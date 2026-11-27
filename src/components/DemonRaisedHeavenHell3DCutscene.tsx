import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FastForward, Flame } from 'lucide-react';
import {
  computeHeavenHellHeight,
  create3DAngelRig,
  create3DDemonRig,
  createHeavenMarbleTexture,
  createHellLavaTexture,
  Summon3DRig
} from '../game/demonRaisedHeavenHellWorld';

interface DemonRaisedHeavenHell3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutscenePhase = 'awakening' | 'shaping' | 'summoning';

const PHASE_LABELS: Record<CutscenePhase, string> = {
  awakening: 'FASE I · PEMBELAHAN DUALITAS — MENYATUKAN ROH SURGA & API NERAKA',
  shaping: 'FASE II · KEBANGKITAN SANCTUM SURGA & KAWAH MAGMA NERAKA',
  summoning: 'FASE III · WUJUD ANGEL & DEMON — SERBUAN PASUKAN SURGA & NERAKA!'
};

// Zero-GC pre-allocated math helpers
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 1.45, 0);
const _tmpColor = new THREE.Color();
const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();
const _dummy = new THREE.Object3D();

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(2, 2, 8, 0.85)');
    g.addColorStop(0.45, 'rgba(6, 4, 14, 0.45)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const DemonRaisedHeavenHell3DCutscene: React.FC<DemonRaisedHeavenHell3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 5.6,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [phase, setPhase] = useState<CutscenePhase>('awakening');
  const [uiProgress, setUiProgress] = useState<number>(0);
  const [climaxFlash, setClimaxFlash] = useState<boolean>(false);

  onSkipRef.current = onSkip;
  onFallbackRef.current = onWebGLUnavailable;

  useEffect(() => {
    remainingRef.current = remainingTime;
    lastSyncTimeRef.current = performance.now();
  }, [remainingTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onSkipRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'block w-full h-full';
    mountEl.appendChild(canvas);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const testGl =
        canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' }) ||
        canvas.getContext('webgl', { antialias: true, powerPreference: 'high-performance' });
      if (!testGl) {
        canvas.remove();
        onFallbackRef.current?.();
        return;
      }

      const debugExt = testGl.getExtension('WEBGL_debug_renderer_info');
      const gpuName = debugExt
        ? String(testGl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '')
        : '';
      const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);

      renderer = new THREE.WebGLRenderer({
        canvas,
        context: testGl as WebGLRenderingContext,
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // Calibrated cinematic exposure so marble, gold, & magma retain crisp detail without glare
      renderer.toneMappingExposure = 0.88;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setSize(window.innerWidth, Math.max(1, window.innerHeight), false);

      const handleContextLost = (ev: Event) => {
        ev.preventDefault();
        onFallbackRef.current?.();
      };
      canvas.addEventListener('webglcontextlost', handleContextLost);

      const disposables: Array<{ dispose: () => void }> = [];
      const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
        disposables.push(g);
        return g;
      };
      const trackMat = <T extends THREE.Material>(m: T): T => {
        disposables.push(m);
        return m;
      };

      const scene = new THREE.Scene();
      const skyVoidColor = new THREE.Color(0x05030b);
      const skyDualityColor = new THREE.Color(0x0f0818);
      scene.background = skyVoidColor.clone();
      scene.fog = new THREE.FogExp2(0x0b0714, 0.0155);

      const camera = new THREE.PerspectiveCamera(
        47,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        175
      );
      camera.position.set(0.8, 2.5, 7.6);
      _currentLook.set(0, 1.45, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.50;
      disposables.push(envRT, roomEnv, pmrem);

      // Balanced Dual-Realm Studio Lighting Rig (Warm Gold Key vs Cool Crimson/Azure Fill)
      const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x5c111d, 0.58);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfff4d6, 1.32);
      keyLight.position.set(-11, 21, 13);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 2;
        keyLight.shadow.camera.far = 68;
        keyLight.shadow.camera.left = -24;
        keyLight.shadow.camera.right = 24;
        keyLight.shadow.camera.top = 24;
        keyLight.shadow.camera.bottom = -24;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.62);
      rimLight.position.set(9, 10, -14);
      scene.add(rimLight);

      const heavenLight = new THREE.PointLight(0xfde047, 5.5, 32, 1.45);
      heavenLight.position.set(-8.2, 4.4, 0.6);
      scene.add(heavenLight);

      const hellLight = new THREE.PointLight(0xf43f5e, 6.2, 32, 1.45);
      hellLight.position.set(8.2, 3.8, 1.4);
      scene.add(hellLight);

      const coreLight = new THREE.PointLight(0xe879f9, 3.8, 16, 1.5);
      coreLight.position.set(0, 2.2, 0.6);
      scene.add(coreLight);

      const marbleTex = createHeavenMarbleTexture(renderer);
      const lavaTex = createHellLavaTexture(renderer);
      const contactShadowTex = createContactShadowTexture();
      disposables.push(marbleTex, lavaTex, contactShadowTex);

      // =========================================================================
      // 1. ANIMATED GLSL SPLIT CELESTIAL-INFERNAL SKY DOME
      // =========================================================================
      const skyUniforms = {
        uTime: { value: 0 },
        uRealm: { value: 0 },
        uFlash: { value: 0 }
      };
      const skyMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: skyUniforms,
          side: THREE.BackSide,
          depthWrite: false,
          vertexShader: `
            varying vec3 vWorldPos;
            void main() {
              vec4 wp = modelMatrix * vec4(position, 1.0);
              vWorldPos = wp.xyz;
              gl_Position = projectionMatrix * viewMatrix * wp;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uRealm;
            uniform float uFlash;
            varying vec3 vWorldPos;

            float skyHash(vec2 p) {
              p = fract(p * vec2(127.1, 311.7));
              p += dot(p, p + 34.12);
              return fract(p.x * p.y);
            }
            float skyNoise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(skyHash(i), skyHash(i + vec2(1.0, 0.0)), f.x),
                mix(skyHash(i + vec2(0.0, 1.0)), skyHash(i + vec2(1.0, 1.0)), f.x),
                f.y
              );
            }
            float fbm(vec2 p) {
              float v = 0.0;
              float a = 0.5;
              for (int i = 0; i < 4; i++) {
                v += a * skyNoise(p);
                p *= 2.02;
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldPos);
              float elev = clamp(dir.y, -0.2, 1.0);
              float hMask = smoothstep(-0.22, 0.22, dir.x); // 0 = Heaven (-x), 1 = Hell (+x)

              // Void start palette
              vec3 voidZenith = vec3(0.014, 0.010, 0.032);
              vec3 voidHorizon = vec3(0.055, 0.028, 0.095);
              vec3 voidCol = mix(voidHorizon, voidZenith, smoothstep(-0.05, 0.62, elev));

              // Starfield on zenith
              float starCell = skyHash(floor(dir.xz * 120.0 + dir.y * 85.0));
              float stars = smoothstep(0.992, 0.999, starCell) * smoothstep(0.15, 0.72, elev);
              voidCol += vec3(0.75, 0.86, 1.0) * stars * (0.45 + 0.3 * sin(uTime * 2.5 + starCell * 40.0));

              // Heaven hemisphere (-x): sapphire sky + golden dawn cloud bands
              vec3 hZenith = vec3(0.035, 0.11, 0.26);
              vec3 hMid = vec3(0.09, 0.30, 0.48);
              vec3 hHorizon = vec3(0.78, 0.60, 0.24);
              vec3 heavenCol = mix(hHorizon, mix(hMid, hZenith, smoothstep(0.18, 0.8, elev)), smoothstep(-0.04, 0.36, elev));

              float hCloud = fbm(dir.xz * 3.4 + vec2(uTime * 0.04, -uTime * 0.02));
              float hAurora = smoothstep(0.42, 0.85, hCloud) * smoothstep(0.02, 0.45, elev) * (1.0 - smoothstep(0.45, 0.88, elev));
              heavenCol += vec3(0.55, 0.46, 0.18) * hAurora * 0.55;

              // Hell hemisphere (+x): blackened soot zenith + crimson stormclouds + magma horizon
              vec3 lZenith = vec3(0.045, 0.008, 0.020);
              vec3 lMid = vec3(0.24, 0.025, 0.055);
              vec3 lHorizon = vec3(0.76, 0.18, 0.08);
              vec3 hellCol = mix(lHorizon, mix(lMid, lZenith, smoothstep(0.16, 0.76, elev)), smoothstep(-0.04, 0.36, elev));

              float lCloud = fbm(dir.xz * 3.8 + vec2(-uTime * 0.06, uTime * 0.03));
              float lVeins = smoothstep(0.55, 0.86, lCloud) * smoothstep(0.0, 0.48, elev) * (1.0 - smoothstep(0.48, 0.9, elev));
              hellCol += vec3(0.85, 0.14, 0.16) * lVeins * 0.52;

              vec3 realmCol = mix(heavenCol, hellCol, hMask);

              // Twilight Rift dividing seam in sky (x ~ 0)
              float riftNoise = (skyNoise(vec2(dir.y * 5.0 - uTime * 0.7, dir.z * 3.0)) - 0.5) * 0.045;
              float riftBand = exp(-pow((dir.x + riftNoise) * 14.0, 2.0)) * smoothstep(-0.1, 0.25, elev);
              vec3 riftGlow = mix(vec3(0.95, 0.82, 0.38), vec3(0.82, 0.24, 0.68), smoothstep(-0.04, 0.04, dir.x));
              realmCol += riftGlow * riftBand * 0.42;

              vec3 finalSky = mix(voidCol, realmCol, uRealm);
              finalSky += vec3(0.88, 0.72, 0.95) * uFlash * 0.45;
              gl_FragColor = vec4(finalSky, 1.0);
            }
          `
        })
      );
      scene.add(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(88, 36, 24)), skyMat));

      // =========================================================================
      // 2. DYNAMIC MORPHING HEAVEN & HELL TERRAIN (GLSL MARBLE VEINS + MAGMA RIFT)
      // =========================================================================
      const terrainSize = 56;
      const terrainSegs = 88;
      const terrainGeo = trackGeo(
        new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs)
      );
      terrainGeo.rotateX(-Math.PI / 2);

      const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
      const vertCount = posAttr.count;
      const targetHeights = new Float32Array(vertCount);
      const vertRadii = new Float32Array(vertCount);
      const splitColors = new Float32Array(vertCount * 3);

      const cMarble = new THREE.Color(0xcbd5e1);
      const cGoldStone = new THREE.Color(0xeab308);
      const cObsidian = new THREE.Color(0x160d13);
      const cCharred = new THREE.Color(0x361016);
      const cMagma = new THREE.Color(0xb91c1c);
      const cSeam = new THREE.Color(0x282159);

      for (let i = 0; i < vertCount; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const h = computeHeavenHellHeight(vx, vz);
        targetHeights[i] = h;
        vertRadii[i] = Math.hypot(vx, vz);
        posAttr.setY(i, 0);

        if (vx < -1.1) {
          const blend = THREE.MathUtils.clamp((-vx - 1.1) / 9.5, 0, 1);
          _tmpColor.copy(cSeam).lerp(cMarble, blend);
          if (h > 1.1) _tmpColor.lerp(cGoldStone, 0.36);
        } else if (vx > 1.1) {
          const blend = THREE.MathUtils.clamp((vx - 1.1) / 9.5, 0, 1);
          _tmpColor.copy(cSeam).lerp(cObsidian, blend);
          if (h < -0.45) _tmpColor.lerp(cMagma, 0.72);
          else if (h > 1.1) _tmpColor.lerp(cCharred, 0.65);
        } else {
          _tmpColor.copy(cSeam);
        }

        splitColors[i * 3] = _tmpColor.r;
        splitColors[i * 3 + 1] = _tmpColor.g;
        splitColors[i * 3 + 2] = _tmpColor.b;
      }

      terrainGeo.setAttribute('color', new THREE.BufferAttribute(splitColors, 3));
      terrainGeo.setAttribute('aTargetHeight', new THREE.BufferAttribute(targetHeights, 1));

      const terrainUniforms = {
        uWaveRadius: { value: -2.5 },
        uWaveActive: { value: 0.0 },
        uTime: { value: 0.0 }
      };

      const terrainMat = trackMat(
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.68,
          metalness: 0.18
        })
      );
      terrainMat.customProgramCacheKey = () => 'demon-raised-hh-cutscene-terrain-v2';
      terrainMat.onBeforeCompile = (shader) => {
        shader.uniforms.uWaveRadius = terrainUniforms.uWaveRadius;
        shader.uniforms.uWaveActive = terrainUniforms.uWaveActive;
        shader.uniforms.uTime = terrainUniforms.uTime;

        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
            attribute float aTargetHeight;
            uniform float uWaveRadius;
            uniform float uWaveActive;
            uniform float uTime;
            varying vec3 vTerrainPos;
            varying float vTargetHeight;`
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            float vDist = length(transformed.xz);
            float rippleEnv = exp(-pow((vDist - uWaveRadius) / 1.9, 2.0)) * uWaveActive;
            transformed.y += rippleEnv * (0.28 + 0.12 * sin(vDist * 2.3 - uTime * 7.0));
            vTerrainPos = transformed;
            vTargetHeight = aTargetHeight;`
          );

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
            uniform float uWaveRadius;
            uniform float uWaveActive;
            uniform float uTime;
            varying vec3 vTerrainPos;
            varying float vTargetHeight;

            float hhHash21(vec2 p) {
              p = fract(p * vec2(123.34, 456.21));
              p += dot(p, p + 45.32);
              return fract(p.x * p.y);
            }
            float hhNoise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hhHash21(i), hhHash21(i + vec2(1.0, 0.0)), f.x),
                mix(hhHash21(i + vec2(0.0, 1.0)), hhHash21(i + vec2(1.0, 1.0)), f.x),
                f.y
              );
            }`
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            float n = hhNoise(vTerrainPos.xz * 0.45);
            float warp = (n - 0.5) * 3.0;
            float radialDist = length(vTerrainPos.xz) + warp;
            float landMask = 1.0 - smoothstep(uWaveRadius - 1.4, uWaveRadius + 0.7, radialDist);
            float frontier = exp(-pow((radialDist - uWaveRadius) / 1.15, 2.0)) * uWaveActive;

            // Dormant ritual floor tiles
            vec2 tileFract = fract(vTerrainPos.xz * 0.85);
            float edgeDist = min(min(tileFract.x, 1.0 - tileFract.x), min(tileFract.y, 1.0 - tileFract.y));
            float grout = 1.0 - smoothstep(0.02, 0.055, edgeDist);
            vec3 arenaBase = mix(vec3(0.016, 0.014, 0.032), vec3(0.005, 0.005, 0.014), grout);

            float seamMask = exp(-pow(vTerrainPos.x / 0.55, 2.0));
            float heavenSide = 1.0 - smoothstep(-1.4, 1.4, vTerrainPos.x);
            float hellSide = smoothstep(-1.4, 1.4, vTerrainPos.x);

            // Marble golden veins on Heaven side
            float veinNoise = abs(sin(vTerrainPos.x * 0.9 + n * 4.5 + vTerrainPos.z * 0.35));
            float goldVein = (1.0 - smoothstep(0.0, 0.08, veinNoise)) * heavenSide;

            vec3 transformedColor = diffuseColor.rgb;
            transformedColor = mix(transformedColor, vec3(0.92, 0.78, 0.28), goldVein * 0.42);

            // Scorched volcanic magma cracks on Hell side
            float crackNoise = hhNoise(vTerrainPos.xz * 1.45 + vec2(uTime * 0.14, -uTime * 0.08));
            float lavaCrack = smoothstep(0.67, 0.93, crackNoise) * hellSide;
            transformedColor = mix(transformedColor, vec3(0.92, 0.24, 0.08), lavaCrack * 0.58);

            diffuseColor.rgb = mix(arenaBase, transformedColor, landMask);
            vec3 seamCol = mix(vec3(0.98, 0.86, 0.30), vec3(0.92, 0.18, 0.34), hellSide);
            diffuseColor.rgb = mix(diffuseColor.rgb, seamCol, frontier * 0.55);`
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            float crackGlow = lavaCrack * landMask * 0.72;
            float goldVeinGlow = goldVein * landMask * 0.18;
            float centerSeamGlow = seamMask * landMask * (0.48 + 0.26 * sin(uTime * 4.2 + vTerrainPos.z * 0.55));
            vec3 seamTint = mix(vec3(0.98, 0.85, 0.28), vec3(0.92, 0.16, 0.36), smoothstep(-0.35, 0.35, vTerrainPos.x));
            totalEmissiveRadiance += seamTint * (centerSeamGlow + frontier * 1.05) + vec3(0.98, 0.30, 0.08) * crackGlow + vec3(0.92, 0.76, 0.25) * goldVeinGlow;`
          );
      };

      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = !isSoftwareGl;
      scene.add(terrainMesh);

      // =========================================================================
      // 3. CENTRAL SPLIT DUALITY ALTAR & TWILIGHT RIFT CURTAIN
      // =========================================================================
      const altarGroup = new THREE.Group();
      const heavenMarbleMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: marbleTex,
          color: 0xe2e8f0,
          emissive: 0x0284c7,
          emissiveIntensity: 0.14,
          roughness: 0.24,
          metalness: 0.22
        })
      );
      const hellObsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x180e14,
          emissive: 0x450a0a,
          emissiveIntensity: 0.28,
          roughness: 0.42,
          metalness: 0.62
        })
      );
      const goldMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xd97706,
          emissiveIntensity: 0.68,
          roughness: 0.18,
          metalness: 0.90
        })
      );
      const crimsonGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfb7185,
          emissive: 0xe11d48,
          emissiveIntensity: 1.18,
          roughness: 0.22,
          metalness: 0.42
        })
      );
      const azureGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          emissive: 0x0ea5e9,
          emissiveIntensity: 1.18,
          roughness: 0.20,
          metalness: 0.38
        })
      );

      // Two-tier Split Dais: Left Alabaster Sanctum Half + Right Obsidian Inferno Half
      const daisBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(3.15, 3.55, 0.20, 24)),
        hellObsidianMat
      );
      daisBase.position.y = 0.10;
      daisBase.receiveShadow = !isSoftwareGl;
      altarGroup.add(daisBase);

      const leftDaisHalf = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(2.55, 2.85, 0.16, 20, 1, false, Math.PI * 0.5, Math.PI)),
        heavenMarbleMat
      );
      leftDaisHalf.position.y = 0.24;
      leftDaisHalf.receiveShadow = !isSoftwareGl;
      altarGroup.add(leftDaisHalf);

      const rightDaisHalf = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(2.55, 2.85, 0.16, 20, 1, false, -Math.PI * 0.5, Math.PI)),
        hellObsidianMat
      );
      rightDaisHalf.position.y = 0.24;
      rightDaisHalf.receiveShadow = !isSoftwareGl;
      altarGroup.add(rightDaisHalf);

      const leftArcRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(2.92, 0.055, 10, 36, Math.PI)),
        goldMat
      );
      leftArcRing.rotation.x = Math.PI / 2;
      leftArcRing.rotation.z = Math.PI / 2;
      leftArcRing.position.y = 0.21;
      altarGroup.add(leftArcRing);

      const rightArcRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(2.92, 0.055, 10, 36, Math.PI)),
        crimsonGlowMat
      );
      rightArcRing.rotation.x = Math.PI / 2;
      rightArcRing.rotation.z = -Math.PI / 2;
      rightArcRing.position.y = 0.21;
      altarGroup.add(rightArcRing);

      // Rotating Outer Ritual Seal Rings
      const ritualOuterRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.65, 0.035, 8, 64)),
        trackMat(
          new THREE.MeshBasicMaterial({
            color: 0xc084fc,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        )
      );
      ritualOuterRing.rotation.x = Math.PI / 2;
      ritualOuterRing.position.y = 0.07;
      altarGroup.add(ritualOuterRing);

      // Center Dividing Twilight Energy Seam
      const riftBeam = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(0.24, 30)),
        trackMat(
          new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        )
      );
      riftBeam.rotation.x = -Math.PI / 2;
      riftBeam.position.y = 0.08;
      altarGroup.add(riftBeam);

      // Contact shadow beneath floating Hero
      const contactShadow = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(2.6, 2.6)),
        trackMat(
          new THREE.MeshBasicMaterial({
            map: contactShadowTex,
            transparent: true,
            opacity: 0.65,
            depthWrite: false
          })
        )
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = 0.34;
      altarGroup.add(contactShadow);
      scene.add(altarGroup);

      // =========================================================================
      // 4. SCULPTED DEMON RAISED HERO (12-PART DUAL SOVEREIGN RIG)
      // =========================================================================
      const heroGroup = new THREE.Group();
      heroGroup.position.set(0, 0.46, 0);

      // Sculpted Split Armored Mantle (Left Seraphic Cloak + Right Infernal Mantle)
      const robeLeft = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.56, 1.28, 10, 1, false, Math.PI * 0.5, Math.PI)),
        heavenMarbleMat
      );
      robeLeft.position.y = 0.64;
      robeLeft.castShadow = !isSoftwareGl;
      heroGroup.add(robeLeft);

      const robeRight = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.56, 1.28, 10, 1, false, -Math.PI * 0.5, Math.PI)),
        hellObsidianMat
      );
      robeRight.position.y = 0.64;
      robeRight.castShadow = !isSoftwareGl;
      heroGroup.add(robeRight);

      const waistSash = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.32, 0.045, 8, 24)),
        goldMat
      );
      waistSash.rotation.x = Math.PI / 2;
      waistSash.position.y = 1.02;
      heroGroup.add(waistSash);

      const torsoMesh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.35, 0.25, 0.68, 10)),
        hellObsidianMat
      );
      torsoMesh.position.y = 1.34;
      torsoMesh.castShadow = !isSoftwareGl;
      heroGroup.add(torsoMesh);

      // Asymmetrical Pauldrons (Left Winged Gold / Right Spiked Obsidian-Crimson)
      const leftPauldron = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)),
        goldMat
      );
      leftPauldron.position.set(-0.37, 1.62, 0);
      leftPauldron.rotation.z = 0.42;
      heroGroup.add(leftPauldron);

      const rightPauldron = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.22, 0.44, 5)),
        crimsonGlowMat
      );
      rightPauldron.position.set(0.38, 1.66, 0);
      rightPauldron.rotation.z = -0.68;
      heroGroup.add(rightPauldron);

      // Split Duality Heart Core + Revolving Twin Gyro Rings
      const heartCore = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.17, 0)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xe879f9,
            emissiveIntensity: 1.45,
            roughness: 0.14,
            metalness: 0.4
          })
        )
      );
      heartCore.position.set(0, 1.38, 0.30);
      heroGroup.add(heartCore);

      const heroHaloGyro = new THREE.Group();
      heroHaloGyro.position.set(0, 1.5, -0.14);
      const gyroGold = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.95, 0.025, 8, 40, Math.PI)),
        goldMat
      );
      gyroGold.rotation.z = Math.PI / 2;
      const gyroCrimson = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.95, 0.025, 8, 40, Math.PI)),
        crimsonGlowMat
      );
      gyroCrimson.rotation.z = -Math.PI / 2;
      heroHaloGyro.add(gyroGold, gyroCrimson);
      heroGroup.add(heroHaloGyro);

      // Head Helm + Heterochromatic Visor + Curved Horn & Half-Crown
      const headHelm = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(0.23, 0)),
        hellObsidianMat
      );
      headHelm.position.y = 1.92;
      heroGroup.add(headHelm);

      const visorL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.045, 0.09)), azureGlowMat);
      visorL.position.set(-0.075, 1.94, 0.18);
      const visorR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.045, 0.09)), crimsonGlowMat);
      visorR.position.set(0.075, 1.94, 0.18);
      heroGroup.add(visorL, visorR);

      const heroHalo = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.38, 0.026, 8, 28, Math.PI)),
        goldMat
      );
      heroHalo.position.set(-0.04, 2.28, -0.02);
      heroHalo.rotation.x = Math.PI / 2;
      heroHalo.rotation.z = Math.PI / 2;
      heroGroup.add(heroHalo);

      // Curved Demon Horn via TubeGeometry
      const hornCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.14, 2.04, 0.02),
        new THREE.Vector3(0.28, 2.24, -0.02),
        new THREE.Vector3(0.24, 2.46, 0.08)
      ]);
      const heroHorn = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(hornCurve, 12, 0.042, 7, false)),
        crimsonGlowMat
      );
      heroGroup.add(heroHorn);

      // Articulated Asymmetrical Wings (Left 6-Pinion Seraphic Wing / Right Bone-Membrane Demon Wing)
      const angelWingPivot = new THREE.Group();
      angelWingPivot.position.set(-0.22, 1.56, -0.22);
      const aBladeGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.15, 0.035));
      for (let k = 0; k < 5; k++) {
        const w = new THREE.Mesh(aBladeGeo, k % 2 === 0 ? goldMat : azureGlowMat);
        w.position.set(-0.54 + k * 0.05, 0.42 - k * 0.22, -0.06);
        w.rotation.z = 0.62 - k * 0.24;
        w.scale.set(1.22 - k * 0.12, 1, 1);
        angelWingPivot.add(w);
      }

      const demonWingPivot = new THREE.Group();
      demonWingPivot.position.set(0.22, 1.56, -0.22);
      const dPlateGeo = trackGeo(new THREE.ConeGeometry(0.30, 1.05, 4));
      for (let k = 0; k < 4; k++) {
        const w = new THREE.Mesh(dPlateGeo, k === 0 ? crimsonGlowMat : hellObsidianMat);
        w.position.set(0.52 - k * 0.06, 0.34 - k * 0.22, -0.06);
        w.rotation.z = -1.04 - k * 0.23;
        w.scale.set(0.55, 1.12 - k * 0.13, 0.22);
        demonWingPivot.add(w);
      }
      heroGroup.add(angelWingPivot, demonWingPivot);

      // Articulated Arms + Twin Orbiting Duality Weapons (Seraphic Lance & Hellfire Greatsword)
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.42, 1.54, 0.06);
      const armSegGeo = trackGeo(new THREE.CylinderGeometry(0.075, 0.06, 0.56, 8));
      const leftArmMesh = new THREE.Mesh(armSegGeo, heavenMarbleMat);
      leftArmMesh.position.y = -0.24;
      leftArmGroup.add(leftArmMesh);
      heroGroup.add(leftArmGroup);

      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.42, 1.54, 0.06);
      const rightArmMesh = new THREE.Mesh(armSegGeo, hellObsidianMat);
      rightArmMesh.position.y = -0.24;
      rightArmGroup.add(rightArmMesh);
      heroGroup.add(rightArmGroup);

      const seraphLance = new THREE.Group();
      seraphLance.position.set(-0.88, 1.42, 0.24);
      const lanceShaft = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 1.25, 8)),
        goldMat
      );
      const lanceHead = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.095, 0.52, 4)),
        azureGlowMat
      );
      lanceHead.position.y = 0.82;
      seraphLance.add(lanceShaft, lanceHead);

      const hellBlade = new THREE.Group();
      hellBlade.position.set(0.88, 1.42, 0.24);
      const bladeHilt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.055, 0.06)), goldMat);
      bladeHilt.position.y = -0.34;
      const bladeCore = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.13, 1.25, 0.035)),
        crimsonGlowMat
      );
      bladeCore.position.y = 0.30;
      hellBlade.add(bladeHilt, bladeCore);

      heroGroup.add(seraphLance, hellBlade);
      scene.add(heroGroup);

      // =========================================================================
      // 5. LEFT REALM (SURGA): CELESTIAL MARBLE PILLARS & GLSL CAUSTIC POOL
      // =========================================================================
      const heavenPropsGroup = new THREE.Group();
      const pillarRecords: Array<{
        group: THREE.Group;
        crystal: THREE.Mesh;
        ring: THREE.Mesh;
        targetY: number;
        delay: number;
      }> = [];
      for (let i = 0; i < 8; i++) {
        const ang = Math.PI * 0.64 + (i / 7) * Math.PI * 0.72;
        const dist = 8.4 + (i % 3) * 3.5;
        const px = Math.cos(ang) * dist;
        const pz = Math.sin(ang) * dist;
        const baseGroundY = computeHeavenHellHeight(px, pz) - 0.35;
        const colH = 3.4 + (i % 3) * 1.45;

        const colGroup = new THREE.Group();
        colGroup.position.set(px, baseGroundY - 7.8, pz);

        const plinth = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.66, 0.78, 0.45, 8)),
          goldMat
        );
        plinth.position.y = 0.22;
        colGroup.add(plinth);

        const shaft = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.42, 0.56, colH, 10)),
          heavenMarbleMat
        );
        shaft.position.y = 0.35 + colH * 0.5;
        shaft.castShadow = !isSoftwareGl;
        colGroup.add(shaft);

        const capRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.74, 0.055, 8, 28)), goldMat);
        capRing.rotation.x = Math.PI / 2;
        capRing.position.y = colH + 0.62;
        colGroup.add(capRing);

        const crystal = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.42, 0)), azureGlowMat);
        crystal.position.y = colH + 1.32;
        crystal.scale.set(0.75, 1.55, 0.75);
        colGroup.add(crystal);

        heavenPropsGroup.add(colGroup);
        pillarRecords.push({
          group: colGroup,
          crystal,
          ring: capRing,
          targetY: baseGroundY,
          delay: (i % 4) * 0.035
        });
      }
      scene.add(heavenPropsGroup);

      // GLSL Celestial Caustic Sanctum Pool on Front-Left (-x, +z)
      const heavenPoolUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const heavenPoolMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: heavenPoolUniforms,
          transparent: true,
          depthWrite: false,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uAlpha;
            varying vec2 vUv;

            void main() {
              vec2 p = (vUv - 0.5) * 2.0;
              float r = length(p);
              if (r > 1.0) discard;

              float w1 = sin(p.x * 14.0 + uTime * 2.2) * cos(p.y * 14.0 - uTime * 1.9);
              float w2 = sin((p.x + p.y) * 18.0 - uTime * 2.8);
              float caustic = smoothstep(0.32, 0.92, abs(w1 + w2) * 0.55);

              vec3 deepWater = vec3(0.04, 0.24, 0.44);
              vec3 brightWater = vec3(0.45, 0.85, 1.0);
              vec3 goldRim = vec3(0.98, 0.88, 0.42);

              vec3 col = mix(deepWater, brightWater, caustic * 0.75);
              float rim = smoothstep(0.68, 0.98, r);
              col = mix(col, goldRim, rim * 0.55);

              float alpha = (1.0 - smoothstep(0.86, 1.0, r)) * uAlpha;
              gl_FragColor = vec4(col, alpha);
            }
          `
        })
      );
      const heavenPool = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(5.6, 40)), heavenPoolMat);
      heavenPool.rotation.x = -Math.PI / 2;
      heavenPool.position.set(-7.6, -0.18, 4.8);
      scene.add(heavenPool);

      // =========================================================================
      // 6. RIGHT REALM (NERAKA): VOLCANIC SPIRES, GLSL MAGMA POOL & LAVA RIVER
      // =========================================================================
      const hellPropsGroup = new THREE.Group();
      const spireRecords: Array<{ group: THREE.Group; targetY: number; delay: number }> = [];
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI * 0.38 + (i / 9) * Math.PI * 0.76;
        const dist = 8.4 + (i % 3) * 3.8;
        const sx = Math.cos(ang) * dist;
        const sz = Math.sin(ang) * dist;
        const baseGroundY = computeHeavenHellHeight(sx, sz) - 0.45;
        const spireH = 3.9 + (i % 4) * 1.65;

        const spGroup = new THREE.Group();
        spGroup.position.set(sx, baseGroundY - 8.6, sz);
        spGroup.rotation.y = i * 0.7;

        const mainCrag = new THREE.Mesh(
          trackGeo(new THREE.ConeGeometry(1.48, spireH, 6)),
          hellObsidianMat
        );
        mainCrag.position.y = spireH * 0.5;
        mainCrag.castShadow = !isSoftwareGl;
        spGroup.add(mainCrag);

        const magmaVein = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.45, 0)),
          crimsonGlowMat
        );
        magmaVein.scale.set(0.42, 2.4, 0.42);
        magmaVein.position.set(0, spireH * 0.45, 0.7);
        magmaVein.rotation.x = 0.28;
        spGroup.add(magmaVein);

        hellPropsGroup.add(spGroup);
        spireRecords.push({ group: spGroup, targetY: baseGroundY, delay: (i % 4) * 0.035 });
      }
      scene.add(hellPropsGroup);

      // GLSL Flowing Magma Crater Pool on Front-Right (+x, +z)
      const lavaPoolUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const lavaPoolMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: lavaPoolUniforms,
          transparent: true,
          depthWrite: false,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uAlpha;
            varying vec2 vUv;

            float lavaHash(vec2 p) {
              p = fract(p * vec2(127.1, 311.7));
              p += dot(p, p + 41.2);
              return fract(p.x * p.y);
            }
            float lavaNoise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(lavaHash(i), lavaHash(i + vec2(1.0, 0.0)), f.x),
                mix(lavaHash(i + vec2(0.0, 1.0)), lavaHash(i + vec2(1.0, 1.0)), f.x),
                f.y
              );
            }

            void main() {
              vec2 p = (vUv - 0.5) * 2.0;
              float r = length(p);
              if (r > 1.0) discard;

              float swirl = lavaNoise(p * 4.5 + vec2(uTime * 0.35, -uTime * 0.25));
              float heat = lavaNoise(p * 8.0 - vec2(uTime * 0.55, uTime * 0.3) + swirl * 1.4);
              float molten = smoothstep(0.35, 0.78, heat);

              vec3 crust = vec3(0.18, 0.03, 0.04);
              vec3 magma = vec3(0.95, 0.24, 0.06);
              vec3 whiteHot = vec3(1.0, 0.78, 0.24);

              vec3 col = mix(crust, magma, molten);
              col = mix(col, whiteHot, smoothstep(0.74, 0.96, heat) * 0.85);

              float alpha = (1.0 - smoothstep(0.84, 1.0, r)) * uAlpha;
              gl_FragColor = vec4(col, alpha);
            }
          `
        })
      );
      const lavaPool = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(5.8, 40)), lavaPoolMat);
      lavaPool.rotation.x = -Math.PI / 2;
      lavaPool.position.set(7.4, -0.32, 4.8);
      lavaPool.scale.set(1.05, 1, 0.85);
      scene.add(lavaPool);

      // Winding Magma River ribbon flowing along carved heightfield channel into crater
      const riverPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const rx = THREE.MathUtils.lerp(15.2, 7.6, t);
        const rz = -0.55 * (rx - 7.4) + 4.8 - Math.sin((rx - 7.4) * 0.4) * 0.85;
        const ry = computeHeavenHellHeight(rx, rz) + 0.12;
        riverPts.push(new THREE.Vector3(rx, Math.max(-0.34, ry), rz));
      }
      const riverCurve = new THREE.CatmullRomCurve3(riverPts);
      const lavaStreamMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: lavaTex,
          color: 0xf97316,
          emissive: 0xdc2626,
          emissiveIntensity: 0.9,
          roughness: 0.22,
          transparent: true,
          opacity: 0
        })
      );
      const lavaStreamMesh = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(riverCurve, 28, 0.62, 6, false)),
        lavaStreamMat
      );
      lavaStreamMesh.scale.set(1, 0.18, 1);
      scene.add(lavaStreamMesh);

      // =========================================================================
      // 7. PHASE II-III ENERGY TETHERS, GLSL DUALITY PORTALS & 3D LEGIONS
      // =========================================================================
      // Lightning / Essence Tether Arcs converging into Demon Raised in Phase I-II
      const tetherSegs = 22;
      const tetherBuffers: Float32Array[] = [];
      const tetherAttrs: THREE.BufferAttribute[] = [];
      const tetherLines: THREE.Line[] = [];
      const tetherSources = [
        new THREE.Vector3(-6.8, 5.2, -3.5),
        new THREE.Vector3(-6.2, 4.8, 3.8),
        new THREE.Vector3(6.8, 4.8, -3.5),
        new THREE.Vector3(6.2, 4.4, 3.8)
      ];
      for (let i = 0; i < 4; i++) {
        const buf = new Float32Array(tetherSegs * 3);
        const geo = trackGeo(new THREE.BufferGeometry());
        const attr = new THREE.BufferAttribute(buf, 3);
        geo.setAttribute('position', attr);
        const mat = trackMat(
          new THREE.LineBasicMaterial({
            color: i < 2 ? 0xfde047 : 0xf43f5e,
            transparent: true,
            opacity: 0.82,
            blending: THREE.AdditiveBlending
          })
        );
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        scene.add(line);
        tetherBuffers.push(buf);
        tetherAttrs.push(attr);
        tetherLines.push(line);
      }

      // Twin Multi-Ring GLSL Portals (Heaven Gold/Azure vs Hell Crimson/Magma)
      const portalRingGeo = trackGeo(new THREE.TorusGeometry(1.52, 0.06, 10, 44));
      const portalInnerRingGeo = trackGeo(new THREE.TorusGeometry(1.18, 0.035, 8, 36));
      const portalDiscGeo = trackGeo(new THREE.CircleGeometry(1.48, 36));

      const createPortalVortexMat = (isHeaven: boolean) =>
        trackMat(
          new THREE.ShaderMaterial({
            uniforms: {
              uTime: { value: 0 },
              uAlpha: { value: 0 },
              uColorA: { value: new THREE.Color(isHeaven ? 0x38bdf8 : 0xe11d48) },
              uColorB: { value: new THREE.Color(isHeaven ? 0xfef08a : 0xf97316) }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float uTime;
              uniform float uAlpha;
              uniform vec3 uColorA;
              uniform vec3 uColorB;
              varying vec2 vUv;

              void main() {
                vec2 p = (vUv - 0.5) * 2.0;
                float r = length(p);
                if (r > 1.0) discard;
                float ang = atan(p.y, p.x);
                float spiral = sin(ang * 5.0 - r * 12.0 + uTime * 5.5) * 0.5 + 0.5;
                vec3 col = mix(uColorA, uColorB, spiral * (1.0 - r * 0.45));
                float coreGlow = exp(-r * 2.8) * 0.85 + smoothstep(0.65, 0.98, r) * 0.65;
                float alpha = (1.0 - smoothstep(0.82, 1.0, r)) * coreGlow * uAlpha;
                gl_FragColor = vec4(col, alpha);
              }
            `
          })
        );

      const heavenPortalGroup = new THREE.Group();
      heavenPortalGroup.position.set(-4.8, 2.25, 0.4);
      heavenPortalGroup.rotation.y = Math.PI / 3;
      heavenPortalGroup.scale.setScalar(0.001);
      const heavenOuterRing = new THREE.Mesh(portalRingGeo, goldMat);
      const heavenInnerRing = new THREE.Mesh(portalInnerRingGeo, azureGlowMat);
      const heavenPortalDiscMat = createPortalVortexMat(true);
      const heavenPortalDisc = new THREE.Mesh(portalDiscGeo, heavenPortalDiscMat);
      heavenPortalGroup.add(heavenOuterRing, heavenInnerRing, heavenPortalDisc);
      scene.add(heavenPortalGroup);

      const hellPortalGroup = new THREE.Group();
      hellPortalGroup.position.set(4.8, 2.25, 0.4);
      hellPortalGroup.rotation.y = -Math.PI / 3;
      hellPortalGroup.scale.setScalar(0.001);
      const hellOuterRing = new THREE.Mesh(portalRingGeo, crimsonGlowMat);
      const hellInnerRing = new THREE.Mesh(portalInnerRingGeo, goldMat);
      const hellPortalDiscMat = createPortalVortexMat(false);
      const hellPortalDisc = new THREE.Mesh(portalDiscGeo, hellPortalDiscMat);
      hellPortalGroup.add(hellOuterRing, hellInnerRing, hellPortalDisc);
      scene.add(hellPortalGroup);

      // 4 Angels & 4 Demons Summoned Legion
      const angelTargets = [
        new THREE.Vector3(-4.6, 0.4, -2.6),
        new THREE.Vector3(-5.9, 0.3, 0.2),
        new THREE.Vector3(-4.4, 0.4, 2.9),
        new THREE.Vector3(-3.0, 0.6, -1.3)
      ];
      const demonTargets = [
        new THREE.Vector3(4.6, 0.3, -2.6),
        new THREE.Vector3(5.9, 0.2, 0.2),
        new THREE.Vector3(4.4, 0.3, 2.9),
        new THREE.Vector3(3.0, 0.5, -1.3)
      ];

      const angelRigs: Summon3DRig[] = [];
      const demonRigs: Summon3DRig[] = [];
      for (let i = 0; i < 4; i++) {
        const aRig = create3DAngelRig(trackGeo, trackMat);
        aRig.root.position.set(-4.8, 4.5, 0.4);
        aRig.root.scale.setScalar(0.001);
        aRig.root.lookAt(0, 0.5, 2.5);
        scene.add(aRig.root);
        angelRigs.push(aRig);

        const dRig = create3DDemonRig(trackGeo, trackMat);
        dRig.root.position.set(4.8, -1.5, 0.4);
        dRig.root.scale.setScalar(0.001);
        dRig.root.lookAt(0, 0.5, 2.5);
        scene.add(dRig.root);
        demonRigs.push(dRig);
      }

      // =========================================================================
      // 8. 0.72 CLIMAX VFX (DUALITY DOME, LIGHT PILLARS, TWIN SHOCKWAVES)
      // =========================================================================
      const dualityDomeUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const dualityDomeMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: dualityDomeUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          vertexShader: `
            varying vec3 vLocalPos;
            varying vec3 vNormalDir;
            void main() {
              vLocalPos = position;
              vNormalDir = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uAlpha;
            varying vec3 vLocalPos;
            varying vec3 vNormalDir;

            void main() {
              float fres = pow(1.0 - abs(vNormalDir.z), 2.1);
              float split = smoothstep(-0.35, 0.35, vLocalPos.x);
              vec3 cLeft = vec3(0.35, 0.80, 1.0);
              vec3 cRight = vec3(0.95, 0.20, 0.32);
              vec3 col = mix(cLeft, cRight, split);
              float band = sin(vLocalPos.y * 14.0 - uTime * 9.0) * 0.5 + 0.5;
              col = mix(col, vec3(1.0, 0.9, 0.5), band * 0.25);
              float alpha = clamp((fres * 0.8 + 0.16) * uAlpha, 0.0, 0.42);
              gl_FragColor = vec4(col, alpha);
            }
          `
        })
      );
      const dualityDome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.58)),
        dualityDomeMat
      );
      dualityDome.position.y = 0.25;
      dualityDome.visible = false;
      scene.add(dualityDome);

      const heroPillarMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const heroPillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.95, 1.45, 22, 24, 1, true)),
        heroPillarMat
      );
      heroPillar.position.y = 11.0;
      heroPillar.visible = false;
      scene.add(heroPillar);

      const heavenBeamMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const heavenBeam = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.85, 1.5, 18, 18, 1, true)),
        heavenBeamMat
      );
      heavenBeam.position.set(-4.8, 9.0, 0.4);
      heavenBeam.visible = false;
      scene.add(heavenBeam);

      const hellBeamMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const hellBeam = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.85, 1.5, 18, 18, 1, true)),
        hellBeamMat
      );
      hellBeam.position.set(4.8, 9.0, 0.4);
      hellBeam.visible = false;
      scene.add(hellBeam);

      const shockGoldMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveGold = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.065, 10, 64)),
        shockGoldMat
      );
      shockwaveGold.rotation.x = Math.PI / 2;
      shockwaveGold.position.y = 0.36;
      shockwaveGold.visible = false;
      scene.add(shockwaveGold);

      const shockCrimsonMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveCrimson = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.065, 10, 64)),
        shockCrimsonMat
      );
      shockwaveCrimson.rotation.x = Math.PI / 2;
      shockwaveCrimson.position.y = 0.42;
      shockwaveCrimson.visible = false;
      scene.add(shockwaveCrimson);

      // Split Heaven Light Motes & Hell Embers + Rising Feathers/Sparks (320 Points)
      const moteCount = 320;
      const motePos = new Float32Array(moteCount * 3);
      const moteCol = new Float32Array(moteCount * 3);
      const moteSeeds = new Float32Array(moteCount);
      for (let i = 0; i < moteCount; i++) {
        const isAngelSide = i % 2 === 0;
        const x = (isAngelSide ? -1 : 1) * (0.6 + Math.random() * 15.0);
        const z = (Math.random() - 0.5) * 24;
        motePos[i * 3] = x;
        motePos[i * 3 + 1] = 0.2 + Math.random() * 6.8;
        motePos[i * 3 + 2] = z;
        moteSeeds[i] = Math.random() * Math.PI * 2;
        _tmpColor.setHex(
          isAngelSide ? (i % 4 === 0 ? 0xfde047 : 0x7dd3fc) : i % 4 === 1 ? 0xf97316 : 0xf43f5e
        );
        moteCol[i * 3] = _tmpColor.r;
        moteCol[i * 3 + 1] = _tmpColor.g;
        moteCol[i * 3 + 2] = _tmpColor.b;
      }
      const moteGeo = trackGeo(new THREE.BufferGeometry());
      moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
      moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
      const moteMat = trackMat(
        new THREE.PointsMaterial({
          size: 0.17,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const motes = new THREE.Points(moteGeo, moteMat);
      scene.add(motes);

      // =========================================================================
      // 9. GPU POST-PROCESSING (Subtle Bokeh DOF + Calibrated Bloom + Split-Tone Grade)
      // =========================================================================
      let composer: EffectComposer | null = null;
      let renderPass: RenderPass | null = null;
      let bokehPass: BokehPass | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let dualityPass: ShaderPass | null = null;
      let outputPass: OutputPass | null = null;

      const dualityPassUniforms = {
        tDiffuse: { value: null },
        uAberration: { value: 0.0007 },
        uShockWave: { value: 0 },
        uShockRadius: { value: 0 },
        uFlash: { value: 0 },
        uVignette: { value: 0.30 },
        uContrast: { value: 1.05 },
        uSaturation: { value: 1.06 },
        uRealmGrade: { value: 0.0 }
      };

      const depthHiddenObjects: THREE.Object3D[] = [
        dualityDome,
        heroPillar,
        heavenBeam,
        hellBeam,
        shockwaveGold,
        shockwaveCrimson,
        heavenPortalDisc,
        hellPortalDisc,
        motes
      ];
      const depthHiddenPrev: boolean[] = new Array(depthHiddenObjects.length).fill(false);

      if (!isSoftwareGl) {
        const initW = window.innerWidth;
        const initH = Math.max(1, window.innerHeight);
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);

        bokehPass = new BokehPass(scene, camera, {
          focus: 7.4,
          aperture: 0.00016,
          maxblur: 0.0038
        });
        bokehPass.setSize(initW, initH);
        const origBokehRender = bokehPass.render.bind(bokehPass);
        bokehPass.render = (
          rend: THREE.WebGLRenderer,
          writeBuffer: THREE.WebGLRenderTarget,
          readBuffer: THREE.WebGLRenderTarget,
          deltaTime: number,
          maskActive: boolean
        ) => {
          for (let i = 0; i < depthHiddenObjects.length; i++) {
            depthHiddenPrev[i] = depthHiddenObjects[i].visible;
            depthHiddenObjects[i].visible = false;
          }
          origBokehRender(rend, writeBuffer, readBuffer, deltaTime, maskActive);
          for (let i = 0; i < depthHiddenObjects.length; i++) {
            depthHiddenObjects[i].visible = depthHiddenPrev[i];
          }
        };

        bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.17, 0.25, 1.12);
        dualityPass = new ShaderPass({
          uniforms: dualityPassUniforms,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uAberration;
            uniform float uShockWave;
            uniform float uShockRadius;
            uniform float uFlash;
            uniform float uVignette;
            uniform float uContrast;
            uniform float uSaturation;
            uniform float uRealmGrade;
            varying vec2 vUv;

            void main() {
              vec2 center = vec2(0.5, 0.5);
              vec2 toCenter = vUv - center;
              float dist = length(toCenter);
              vec2 dir = dist > 0.0001 ? toCenter / dist : vec2(0.0);

              float ringDiff = dist - uShockRadius;
              float ringBand = exp(-ringDiff * ringDiff * 155.0) * uShockWave;
              vec2 uv = clamp(vUv - dir * ringBand * 0.022, 0.001, 0.999);

              vec2 caOffset = dir * uAberration * (0.32 + dist * 1.1 + ringBand * 1.45);
              float r = texture2D(tDiffuse, clamp(uv + caOffset, 0.001, 0.999)).r;
              float g = texture2D(tDiffuse, uv).g;
              float b = texture2D(tDiffuse, clamp(uv - caOffset, 0.001, 0.999)).b;
              vec3 col = vec3(r, g, b);

              vec3 shockCol = mix(vec3(0.98, 0.85, 0.38), vec3(0.95, 0.25, 0.42), smoothstep(0.35, 0.65, vUv.x));
              col += shockCol * ringBand * 0.14;
              col += vec3(0.92, 0.78, 0.96) * uFlash;

              // Split-tone Heaven/Hell color grading (deep violet-obsidian shadows, gold-crimson highlights)
              float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
              float shadowW = 1.0 - smoothstep(0.04, 0.34, luma);
              float highW = smoothstep(0.34, 0.96, luma);

              vec3 shadowTint = mix(vec3(0.96, 0.95, 1.06), vec3(0.98, 0.94, 1.02), uRealmGrade);
              vec3 highTint = mix(vec3(0.98, 1.00, 1.04), vec3(1.04, 0.99, 0.95), uRealmGrade);
              col *= mix(vec3(1.0), shadowTint, shadowW * 0.5);
              col *= mix(vec3(1.0), highTint, highW * 0.6);

              float postLuma = dot(col, vec3(0.2126, 0.7152, 0.0722));
              col = mix(vec3(postLuma), col, uSaturation);
              col = max(vec3(0.0), (col - 0.18) * uContrast + 0.18);

              float vig = smoothstep(0.38, 0.98, dist);
              col *= 1.0 - vig * uVignette;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        });
        outputPass = new OutputPass();

        composer.addPass(renderPass);
        composer.addPass(bokehPass);
        composer.addPass(bloomPass);
        composer.addPass(dualityPass);
        composer.addPass(outputPass);

        renderer.compile(scene, camera);
      }

      const handleResize = () => {
        if (!renderer) return;
        const w = window.innerWidth;
        const h = Math.max(1, window.innerHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        composer?.setSize(w, h);
        bokehPass?.setSize(w, h);
        bloomPass?.resolution.set(w, h);
      };
      window.addEventListener('resize', handleResize);

      let frameId = 0;
      let isDisposed = false;
      let lastTime = performance.now();
      let lastUiStage: CutscenePhase = 'awakening';
      let lastUiPct = -1;
      let climaxBeatTriggered = false;
      let currentRoll = 0;
      let smoothedBloomStrength = 0.17;
      let smoothedBloomRadius = 0.25;
      let smoothedDofFocus = 7.4;
      let smoothedDofAperture = 0.00016;
      let smoothedDofMaxBlur = 0.0038;
      let smoothedAberration = 0.0007;
      let smoothedVignette = 0.30;

      const afterDraw = (cb: () => void) => {
        if (isDisposed || !renderer) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (isDisposed) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
        } else {
          frameId = window.setTimeout(cb, 80);
        }
      };

      const tick = () => {
        if (isDisposed || !renderer) return;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        const sinceSync = (now - lastSyncTimeRef.current) / 1000;
        const liveRemaining = Math.max(0, remainingRef.current - sinceSync);
        const progress = Math.max(0, Math.min(1, 1 - liveRemaining / Math.max(0.1, totalDuration)));

        // Synced to GameEngine: 0-0.32 Awakening, 0.32-0.72 Shaping, >=0.72 activateAngelDemonForm()
        const nextPhase: CutscenePhase =
          progress < 0.32 ? 'awakening' : progress < 0.72 ? 'shaping' : 'summoning';
        if (nextPhase !== lastUiStage) {
          lastUiStage = nextPhase;
          setPhase(nextPhase);
        }
        const pctInt = Math.round(progress * 100);
        if (pctInt !== lastUiPct) {
          lastUiPct = pctInt;
          setUiProgress(pctInt);
        }

        if (progress >= 0.72 && !climaxBeatTriggered) {
          climaxBeatTriggered = true;
          setClimaxFlash(true);
          window.setTimeout(() => {
            if (!isDisposed) setClimaxFlash(false);
          }, 160);
        }

        const elapsed = progress * totalDuration;
        const realmT = THREE.MathUtils.smoothstep(progress, 0.16, 0.68);
        const poolT = THREE.MathUtils.smoothstep(progress, 0.32, 0.68);
        const summonT = THREE.MathUtils.smoothstep(progress, 0.62, 0.92);

        // 1. Wavefront & Terrain Elevation
        const waveProgress = THREE.MathUtils.smoothstep(progress, 0.10, 0.72);
        const waveRadius = THREE.MathUtils.lerp(-2.5, 36.5, waveProgress);
        const waveActive =
          THREE.MathUtils.smoothstep(progress, 0.06, 0.14) *
          (1 - THREE.MathUtils.smoothstep(progress, 0.66, 0.78));
        terrainUniforms.uWaveRadius.value = waveRadius;
        terrainUniforms.uWaveActive.value = waveActive;
        terrainUniforms.uTime.value = elapsed;

        const globalSettle = THREE.MathUtils.smoothstep(progress, 0.52, 0.76);
        const pArr = posAttr.array as Float32Array;
        for (let i = 0; i < vertCount; i++) {
          const localW = THREE.MathUtils.clamp((waveRadius + 0.8 - vertRadii[i]) / 5.5, 0, 1);
          const factor = Math.max(localW * localW * (3 - 2 * localW), globalSettle);
          pArr[i * 3 + 1] = targetHeights[i] * factor;
        }
        posAttr.needsUpdate = true;
        terrainGeo.computeVertexNormals();

        // 2. Rise Heaven Sanctum Columns & Hell Volcanic Spires
        for (let i = 0; i < pillarRecords.length; i++) {
          const rec = pillarRecords[i];
          const mT = THREE.MathUtils.smoothstep(progress, 0.24 + rec.delay, 0.64 + rec.delay);
          rec.group.position.y = THREE.MathUtils.lerp(rec.targetY - 7.8, rec.targetY, mT);
          rec.crystal.rotation.y = elapsed * 1.8 + i;
          rec.ring.rotation.z = elapsed * 1.4;
        }
        for (const rec of spireRecords) {
          const mT = THREE.MathUtils.smoothstep(progress, 0.24 + rec.delay, 0.64 + rec.delay);
          rec.group.position.y = THREE.MathUtils.lerp(rec.targetY - 8.6, rec.targetY, mT);
        }

        // 3. GLSL Celestial Pool, Flowing Magma Crater & Winding Lava Stream
        heavenPoolUniforms.uTime.value = elapsed;
        heavenPoolUniforms.uAlpha.value = poolT * 0.86;
        lavaPoolUniforms.uTime.value = elapsed;
        lavaPoolUniforms.uAlpha.value = poolT * 0.94;
        lavaStreamMat.opacity = poolT * 0.88;
        lavaTex.offset.y = -elapsed * 0.14;
        ritualOuterRing.rotation.z = elapsed * 0.55;

        // 4. Demon Raised Duality Ascension Choreography
        const hoverY = 0.46 + Math.sin(elapsed * 2.6) * 0.14 + Math.sin(progress * Math.PI) * 0.42;
        heroGroup.position.y = hoverY;
        heroGroup.rotation.y = Math.sin(elapsed * 1.15) * 0.24;
        contactShadow.material.opacity = Math.max(0.28, 0.68 - (hoverY - 0.4) * 0.4);
        heroHaloGyro.rotation.z = elapsed * 1.3;
        heartCore.rotation.y = elapsed * 3.2;

        const armLift =
          progress < 0.32
            ? THREE.MathUtils.smoothstep(progress, 0.04, 0.30)
            : progress < 0.72
              ? 1.0
              : 1.0 - THREE.MathUtils.smoothstep(progress, 0.72, 0.84) * 0.4;
        leftArmGroup.rotation.set(-0.3 - armLift * 1.35, 0.15, -0.22 - armLift * 0.35);
        rightArmGroup.rotation.set(-0.3 - armLift * 1.35, -0.15, 0.22 + armLift * 0.35);

        angelWingPivot.rotation.y = 0.22 + Math.sin(elapsed * 5.2) * 0.24;
        demonWingPivot.rotation.y = -0.22 - Math.sin(elapsed * 5.2) * 0.24;
        seraphLance.position.y = 1.42 + Math.sin(elapsed * 3.4) * 0.12;
        seraphLance.rotation.z = Math.sin(elapsed * 2.1) * 0.08;
        hellBlade.position.y = 1.42 - Math.sin(elapsed * 3.4) * 0.12;
        hellBlade.rotation.z = -Math.sin(elapsed * 2.1) * 0.08;

        // Energy Tether Arcs during Phase I & II
        const showTethers = progress < 0.76;
        _tmpVecA.copy(heroGroup.position).add(_tmpVecB.set(0, 1.38, 0.2));
        for (let i = 0; i < 4; i++) {
          tetherLines[i].visible = showTethers;
          if (showTethers) {
            const src = tetherSources[i];
            const arr = tetherBuffers[i];
            for (let s = 0; s < tetherSegs; s++) {
              const t = s / (tetherSegs - 1);
              const env = Math.sin(t * Math.PI);
              arr[s * 3] =
                src.x + (_tmpVecA.x - src.x) * t + Math.sin(elapsed * 20 + i * 3 + s * 2.1) * 0.24 * env;
              arr[s * 3 + 1] =
                src.y + (_tmpVecA.y - src.y) * t + Math.cos(elapsed * 18 + i * 2 + s * 2.4) * 0.24 * env;
              arr[s * 3 + 2] =
                src.z + (_tmpVecA.z - src.z) * t + Math.sin(elapsed * 16 + i * 4 + s * 2.0) * 0.24 * env;
            }
            tetherAttrs[i].needsUpdate = true;
          }
        }

        // 5. Twin GLSL Portals & 3D Angel/Demon Legion Emergence
        const portalEnv = Math.sin(THREE.MathUtils.smoothstep(progress, 0.56, 0.99) * Math.PI);
        heavenPortalGroup.scale.setScalar(Math.max(0.001, portalEnv * 1.28));
        heavenOuterRing.rotation.z = elapsed * 2.2;
        heavenInnerRing.rotation.z = -elapsed * 3.1;
        heavenPortalDiscMat.uniforms.uTime.value = elapsed;
        heavenPortalDiscMat.uniforms.uAlpha.value = portalEnv * 0.92;

        hellPortalGroup.scale.setScalar(Math.max(0.001, portalEnv * 1.28));
        hellOuterRing.rotation.z = -elapsed * 2.2;
        hellInnerRing.rotation.z = elapsed * 3.1;
        hellPortalDiscMat.uniforms.uTime.value = elapsed;
        hellPortalDiscMat.uniforms.uAlpha.value = portalEnv * 0.92;

        for (let i = 0; i < 4; i++) {
          const tUnit = THREE.MathUtils.smoothstep(progress, 0.62 + i * 0.045, 0.86 + i * 0.035);
          const aRig = angelRigs[i];
          const aGoal = angelTargets[i];
          aRig.root.position.set(
            THREE.MathUtils.lerp(-4.8, aGoal.x, tUnit),
            THREE.MathUtils.lerp(3.6, computeHeavenHellHeight(aGoal.x, aGoal.z), tUnit),
            THREE.MathUtils.lerp(0.4, aGoal.z, tUnit)
          );
          aRig.root.scale.setScalar(Math.max(0.001, tUnit * 1.38));
          aRig.body.position.y = 0.52 + Math.sin(elapsed * 4.2 + i) * 0.08;
          aRig.leftWingPivot.rotation.y = 0.25 + Math.sin(elapsed * 8.5 + i) * 0.35;
          aRig.rightWingPivot.rotation.y = -0.25 - Math.sin(elapsed * 8.5 + i) * 0.35;
          aRig.weaponPivot.rotation.x = Math.sin(elapsed * 3.6 + i) * 0.26;

          const dRig = demonRigs[i];
          const dGoal = demonTargets[i];
          dRig.root.position.set(
            THREE.MathUtils.lerp(4.8, dGoal.x, tUnit),
            THREE.MathUtils.lerp(-1.2, computeHeavenHellHeight(dGoal.x, dGoal.z), tUnit),
            THREE.MathUtils.lerp(0.4, dGoal.z, tUnit)
          );
          dRig.root.scale.setScalar(Math.max(0.001, tUnit * 1.40));
          dRig.body.position.y = 0.45 + Math.sin(elapsed * 4.5 + i + 1) * 0.07;
          dRig.leftWingPivot.rotation.y = 0.2 + Math.sin(elapsed * 9.0 + i) * 0.38;
          dRig.rightWingPivot.rotation.y = -0.2 - Math.sin(elapsed * 9.0 + i) * 0.38;
          dRig.weaponPivot.rotation.x = Math.sin(elapsed * 4.0 + i) * 0.32;
        }

        // 6. Climax Beat & Phase-Aware Post-Processing Targets
        let targetBloomStrength = 0.17;
        let targetBloomRadius = 0.24;
        let targetAberration = 0.00065;
        let shockWave = 0;
        let shockRadius = 0;
        let postFlash = 0;
        let targetFov = 47;
        let targetRoll = 0;

        if (progress < 0.32) {
          const ap = progress / 0.32;
          coreLight.intensity = 3.8 + ap * 3.5;
          targetBloomStrength = 0.16 + ap * 0.04;
          targetBloomRadius = 0.22 + ap * 0.04;
          dualityDome.visible = false;
          heroPillar.visible = false;
          heavenBeam.visible = false;
          hellBeam.visible = false;
          shockwaveGold.visible = false;
          shockwaveCrimson.visible = false;
          targetFov = 47 - ap * 2.0;
        } else if (progress < 0.72) {
          const sp = (progress - 0.32) / 0.4;
          const burstT = Math.min(1, sp / 0.36);
          shockwaveGold.visible = sp < 0.45;
          shockwaveGold.scale.setScalar(0.8 + burstT * 13.5);
          shockGoldMat.opacity = Math.max(0, 0.55 * (1 - sp / 0.45));
          shockwaveCrimson.visible = false;
          dualityDome.visible = false;
          heroPillar.visible = false;
          heavenBeam.visible = false;
          hellBeam.visible = false;

          shockWave = sp < 0.28 ? (1 - sp / 0.28) * Math.sin(Math.min(1, sp / 0.06) * Math.PI * 0.5) : 0;
          shockRadius = 0.05 + sp * 2.1;
          coreLight.intensity = 7.2 - sp * 1.4;
          targetBloomStrength = 0.19 + Math.sin(sp * Math.PI) * 0.035;
          targetBloomRadius = 0.25 + Math.sin(sp * Math.PI) * 0.03;
          targetAberration = 0.00075 + Math.sin(Math.min(1, sp / 0.35) * Math.PI) * 0.0006;
          targetFov = 45 + sp * 4.5;
          targetRoll = -0.024 * Math.sin(sp * Math.PI);
        } else {
          // Exact GameEngine Climax at progress = 0.72 (activateAngelDemonForm)
          const bp = (progress - 0.72) / 0.28;
          const blastEase = 1 - Math.pow(1 - Math.min(1, bp / 0.55), 3);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(bp, 0.45, 1.0);

          dualityDome.visible = fadeOut > 0.02;
          dualityDome.scale.setScalar(1.2 + blastEase * 16.0);
          dualityDomeUniforms.uTime.value = elapsed;
          dualityDomeUniforms.uAlpha.value = fadeOut * 0.40;

          heroPillar.visible = fadeOut > 0.02;
          const pSc = bp < 0.22 ? 0.5 + (bp / 0.22) * 1.3 : Math.max(0.2, 1.8 * fadeOut);
          heroPillar.scale.set(pSc, 1, pSc);
          heroPillarMat.opacity = bp < 0.22 ? 0.30 : Math.max(0, 0.30 * fadeOut);

          heavenBeam.visible = portalEnv > 0.05;
          heavenBeamMat.opacity = portalEnv * 0.24 * (0.6 + fadeOut * 0.4);
          hellBeam.visible = portalEnv > 0.05;
          hellBeamMat.opacity = portalEnv * 0.24 * (0.6 + fadeOut * 0.4);

          shockwaveGold.visible = fadeOut > 0.02;
          shockwaveCrimson.visible = fadeOut > 0.02;
          shockwaveGold.scale.setScalar(1.0 + blastEase * 17.0);
          shockwaveCrimson.scale.setScalar(0.7 + blastEase * 13.5);
          shockGoldMat.opacity = fadeOut * 0.65;
          shockCrimsonMat.opacity = fadeOut * 0.68;

          coreLight.intensity = 8.2 * fadeOut + 3.8;
          const climaxEnv =
            Math.sin(Math.min(1, bp / 0.22) * Math.PI * 0.5) *
            (1 - THREE.MathUtils.smoothstep(bp, 0.25, 0.95));
          targetBloomStrength = 0.185 + climaxEnv * 0.065;
          targetBloomRadius = 0.24 + climaxEnv * 0.07;
          targetAberration = 0.0007 + climaxEnv * 0.0019;
          shockWave =
            bp < 0.55 ? Math.max(0, 1 - bp / 0.55) * Math.sin(Math.min(1, bp / 0.07) * Math.PI * 0.5) : 0;
          shockRadius = 0.04 + bp * 1.5;
          postFlash = bp < 0.12 ? (1 - bp / 0.12) * 0.045 : 0;
          targetFov = bp < 0.2 ? 49.5 + (bp / 0.2) * 4.5 : 54 - ((bp - 0.2) / 0.8) * 5.0;
          targetRoll = bp < 0.35 ? 0.028 * (1 - bp / 0.35) : 0;
        }

        // 7. Sky Dome & Dual Motes
        skyUniforms.uTime.value = elapsed;
        skyUniforms.uRealm.value = realmT;
        skyUniforms.uFlash.value =
          progress >= 0.72 && progress < 0.84 ? (1 - (progress - 0.72) / 0.12) * 0.38 : 0;
        if (scene.background instanceof THREE.Color) {
          scene.background.copy(skyVoidColor).lerp(skyDualityColor, realmT);
        }

        const mPosAttr = moteGeo.attributes.position as THREE.BufferAttribute;
        const mArr = mPosAttr.array as Float32Array;
        for (let i = 0; i < moteCount; i++) {
          const s = moteSeeds[i];
          mArr[i * 3 + 1] += dt * (0.50 + (i % 3) * 0.24);
          mArr[i * 3] += Math.sin(elapsed * 1.9 + s) * dt * 0.30;
          if (mArr[i * 3 + 1] > 7.4) mArr[i * 3 + 1] = 0.2;
        }
        mPosAttr.needsUpdate = true;

        // 8. Smooth 3-Phase Cinematic Camera Choreography
        if (progress < 0.32) {
          const t1 = progress / 0.32;
          const ang = 0.22 + t1 * 0.52;
          _camTarget.set(Math.sin(ang) * 6.5, 2.25 + t1 * 1.65, Math.cos(ang) * 6.5);
          _lookTarget.set(0, 1.48, 0);
        } else if (progress < 0.72) {
          const t2 = (progress - 0.32) / 0.4;
          const ang = 0.74 - t2 * 1.32;
          _camTarget.set(
            Math.sin(ang) * THREE.MathUtils.lerp(6.5, 14.5, t2),
            THREE.MathUtils.lerp(3.9, 8.7, t2),
            Math.cos(ang) * THREE.MathUtils.lerp(6.5, 14.5, t2)
          );
          _lookTarget.set(0, 1.05, 0);
        } else {
          const t3 = (progress - 0.72) / 0.28;
          const shakeMag = t3 < 0.22 ? (1 - t3 / 0.22) * 0.22 : 0;
          const shakeX = Math.sin(elapsed * 42) * shakeMag;
          const shakeY = Math.cos(elapsed * 38) * shakeMag;
          const ang = -0.58 + t3 * 0.58;
          _camTarget.set(
            Math.sin(ang) * THREE.MathUtils.lerp(14.5, 12.6, t3) + shakeX,
            THREE.MathUtils.lerp(8.7, 6.9, t3) + shakeY,
            Math.cos(ang) * THREE.MathUtils.lerp(14.5, 12.6, t3)
          );
          _lookTarget.set(0, 1.18, 0.2);
        }

        const dampAlpha = 1 - Math.exp(-5.6 * dt);
        camera.position.lerp(_camTarget, dampAlpha);
        _currentLook.lerp(_lookTarget, dampAlpha);
        currentRoll += (targetRoll - currentRoll) * dampAlpha;
        camera.lookAt(_currentLook);
        if (Math.abs(currentRoll) > 0.0002) {
          camera.rotateZ(currentRoll);
        }

        const nextFov = camera.fov + (targetFov - camera.fov) * dampAlpha;
        if (Math.abs(nextFov - camera.fov) > 0.015) {
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }

        heavenLight.intensity = 5.5 + summonT * 3.8;
        hellLight.intensity = 6.2 + summonT * 4.2;

        if (composer && bloomPass && bokehPass) {
          const postDamp = 1 - Math.exp(-7.5 * dt);
          smoothedBloomStrength += (targetBloomStrength - smoothedBloomStrength) * postDamp;
          smoothedBloomRadius += (targetBloomRadius - smoothedBloomRadius) * postDamp;
          smoothedAberration += (targetAberration - smoothedAberration) * postDamp;

          const targetVignette = THREE.MathUtils.lerp(0.32, 0.24, summonT);
          smoothedVignette += (targetVignette - smoothedVignette) * postDamp;

          const targetFocus = camera.position.distanceTo(_currentLook);
          const targetAperture = THREE.MathUtils.lerp(
            0.00016,
            0.00011,
            THREE.MathUtils.smoothstep(progress, 0.3, 0.85)
          );
          const targetMaxBlur = THREE.MathUtils.lerp(
            0.0038,
            0.0024,
            THREE.MathUtils.smoothstep(progress, 0.3, 0.85)
          );
          smoothedDofFocus += (targetFocus - smoothedDofFocus) * postDamp;
          smoothedDofAperture += (targetAperture - smoothedDofAperture) * postDamp;
          smoothedDofMaxBlur += (targetMaxBlur - smoothedDofMaxBlur) * postDamp;

          const bokehUniforms = bokehPass.uniforms as Record<string, THREE.IUniform<number>>;
          bokehUniforms.focus.value = smoothedDofFocus;
          bokehUniforms.aperture.value = smoothedDofAperture;
          bokehUniforms.maxblur.value = smoothedDofMaxBlur;

          bloomPass.strength = smoothedBloomStrength;
          bloomPass.radius = smoothedBloomRadius;

          dualityPassUniforms.uAberration.value = smoothedAberration;
          dualityPassUniforms.uShockWave.value = shockWave;
          dualityPassUniforms.uShockRadius.value = shockRadius;
          dualityPassUniforms.uFlash.value = postFlash;
          dualityPassUniforms.uVignette.value = smoothedVignette;
          dualityPassUniforms.uRealmGrade.value = THREE.MathUtils.smoothstep(progress, 0.22, 0.88);
          dualityPassUniforms.uContrast.value = 1.04 + realmT * 0.035 - summonT * 0.015;
          dualityPassUniforms.uSaturation.value = 1.04 + realmT * 0.06;

          composer.render();
        } else {
          renderer.render(scene, camera);
        }

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      tick();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        renderPass?.dispose();
        bokehPass?.dispose();
        bloomPass?.dispose();
        dualityPass?.dispose();
        outputPass?.dispose();
        composer?.dispose();
        for (const item of disposables) {
          try {
            item.dispose();
          } catch {
            // ignore disposal errors
          }
        }
        renderer?.dispose();
        canvas.remove();
      };
    } catch {
      renderer?.dispose();
      canvas.remove();
      onFallbackRef.current?.();
      return undefined;
    }
  }, [totalDuration]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05030b] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D Demon Raised Angel and Demon"
    >
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Subtle Climax Awakening Pulse */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-300/12 via-fuchsia-200/12 to-rose-400/12 transition-opacity duration-150 ${
          climaxFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Cinematic Letterbox Bar (solid dark fill, zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#06040e]/94 border-b border-amber-400/40 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-game tracking-[0.24em] uppercase text-amber-300 flex items-center gap-2 truncate">
            <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>DEMON RAISED · CELESTIAL-INFERNAL DUALITY 3D</span>
          </p>
          <h2 className="font-title text-lg sm:text-2xl font-black tracking-wider text-white truncate">
            SURGA &amp; NERAKA: WUJUD ANGEL &amp; DEMON
          </h2>
        </div>
        <p className="hidden md:block text-xs font-game font-semibold text-rose-200/95 tracking-wide text-right">
          {PHASE_LABELS[phase]}
        </p>
      </div>

      {/* Bottom Cinematic Bar & Skip Action */}
      <div className="absolute inset-x-0 bottom-0 bg-[#06040e]/94 border-t border-rose-500/40 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="pointer-events-none min-w-0">
          <p className="md:hidden text-[11px] font-game font-semibold text-rose-200 truncate mb-0.5">
            {PHASE_LABELS[phase]}
          </p>
          <p className="text-xs font-game text-amber-100/85 tracking-wide truncate">
            Membuka Sanctum Surga &amp; Kawah Neraka 3D serta Memanggil Pasukan Malaikat &amp; Iblis ·{' '}
            {uiProgress}%
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#110a1e] hover:bg-[#1a102c] border border-amber-400/65 hover:border-rose-400 text-slate-100 font-game font-semibold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* Bottom Dual-Realm Progress Bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-amber-300 via-sky-300 to-rose-500 transition-[width] duration-100"
          style={{ width: `${uiProgress}%` }}
        />
      </div>
    </div>
  );
};
