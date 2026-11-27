import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FastForward, Sparkles } from 'lucide-react';
import {
  computeSanctuaryHeight,
  createSanctuaryWaterTexture,
  createSanctuaryWaterfallTexture
} from '../game/elementalisSanctuaryWorld';

interface ElementalisGenesis3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutscenePhase = 'awakening' | 'shaping' | 'bloom';

const PHASE_LABELS: Record<CutscenePhase, string> = {
  awakening: 'FASE I · KONVERGENSI 4 MONOLITH ELEMEN PURBA — MEMANGGIL BENIH GENESIS',
  shaping: 'FASE II · GELOMBANG PENCIPTAAN — GUNUNG, SUNGAI, AIR TERJUN & DANAU KEHIDUPAN',
  bloom: 'FASE III · MEKARNYA HUTAN PURBA & AURORA FAJAR — PRIMORDIAL SANCTUARY!'
};

const PHASE_BADGES: Record<CutscenePhase, string> = {
  awakening: 'FASE I · KONVERGENSI',
  shaping: 'FASE II · TERRAFORMING',
  bloom: 'FASE III · GENESIS BLOOM'
};

// Pre-allocated scratch helpers (zero GC inside render loop)
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 1.4, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();

export const ElementalisGenesis3DCutscene: React.FC<ElementalisGenesis3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 5.8,
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
  const [bloomFlash, setBloomFlash] = useState<boolean>(false);

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
    const mount = canvasMountRef.current;
    if (!mount) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      mount.innerHTML = '';
      mount.appendChild(canvas);

      const handleContextLost = (ev: Event) => {
        ev.preventDefault();
        onFallbackRef.current?.();
      };
      canvas.addEventListener('webglcontextlost', handleContextLost);

      const testGl =
        canvas.getContext('webgl2', { antialias: !isSoftwareGl, powerPreference: 'high-performance' }) ||
        canvas.getContext('webgl', { antialias: !isSoftwareGl, powerPreference: 'high-performance' });
      if (!testGl) {
        onFallbackRef.current?.();
        return;
      }

      renderer = new THREE.WebGLRenderer({
        canvas,
        context: testGl as WebGLRenderingContext,
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.88;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setSize(window.innerWidth, Math.max(1, window.innerHeight), false);

      const disposables: Array<{ dispose: () => void }> = [];
      const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
        disposables.push(g);
        return g;
      };
      const trackMat = <T extends THREE.Material>(m: T): T => {
        disposables.push(m);
        return m;
      };
      const trackTex = <T extends THREE.Texture>(t: T): T => {
        disposables.push(t);
        return t;
      };

      const scene = new THREE.Scene();
      const skyVoidColor = new THREE.Color(0x030e12);
      const skySanctuaryColor = new THREE.Color(0x0b2630);
      scene.background = skyVoidColor.clone();
      scene.fog = new THREE.FogExp2(0x05161b, 0.016);

      const camera = new THREE.PerspectiveCamera(
        47,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        175
      );
      camera.position.set(3.2, 2.2, 7.5);
      _currentLook.set(0, 1.45, 0);
      camera.lookAt(_currentLook);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.56;
      trackTex(envRT.texture);
      envRT.dispose();
      roomEnv.dispose();
      pmrem.dispose();

      // Calibrated Dawn-Sanctuary 3-Point Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0x67e8f9, 0x0f3b24, 0.68);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfff1c9, 1.55);
      sunLight.position.set(16, 24, 14);
      if (!isSoftwareGl) {
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.set(1024, 1024);
        sunLight.shadow.camera.near = 2;
        sunLight.shadow.camera.far = 70;
        sunLight.shadow.camera.left = -24;
        sunLight.shadow.camera.right = 24;
        sunLight.shadow.camera.top = 24;
        sunLight.shadow.camera.bottom = -24;
        sunLight.shadow.bias = -0.0005;
        sunLight.shadow.normalBias = 0.02;
      }
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.95);
      rimLight.position.set(-14, 10, -16);
      scene.add(rimLight);

      const coreLight = new THREE.PointLight(0x14b8a6, 4.5, 24, 1.5);
      coreLight.position.set(0, 2.3, 0);
      scene.add(coreLight);

      const lakeGlowLight = new THREE.PointLight(0x38bdf8, 0, 22, 1.55);
      lakeGlowLight.position.set(-6.8, 1.1, 5.2);
      scene.add(lakeGlowLight);

      // =========================================================================
      // BACKGROUND 1: Custom GLSL Twilight-to-Dawn Aurora Sky Dome
      // =========================================================================
      const skyUniforms = {
        uTime: { value: 0 },
        uDawn: { value: 0 },
        uFlash: { value: 0 }
      };
      const skyMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: skyUniforms,
          side: THREE.BackSide,
          depthWrite: false,
          vertexShader: `
            varying vec3 vWorldDir;
            void main() {
              vWorldDir = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vWorldDir;
            uniform float uTime;
            uniform float uDawn;
            uniform float uFlash;

            float hash(vec3 p) {
              p = fract(p * 0.3183099 + 0.1);
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }

            float noise3(vec3 x) {
              vec3 i = floor(x);
              vec3 f = fract(x);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                    mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                    mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                f.z
              );
            }

            float fbm(vec3 p) {
              float v = 0.0;
              float a = 0.5;
              for (int i = 0; i < 4; i++) {
                v += a * noise3(p);
                p = p * 2.03 + vec3(0.14, -0.19, 0.11);
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldDir);
              float elev = clamp(dir.y, -0.2, 1.0);
              float horizonGlow = pow(1.0 - abs(dir.y), 3.4);

              vec3 nebCoord = dir * 2.5 + vec3(uTime * 0.028, -uTime * 0.02, uTime * 0.018);
              float n1 = fbm(nebCoord);
              float n2 = fbm(nebCoord * 2.1 + vec3(n1 * 1.25));

              // Void Twilight -> Sanctuary Dawn gradient
              vec3 voidZenith = vec3(0.012, 0.032, 0.055);
              vec3 dawnZenith = vec3(0.024, 0.115, 0.165);
              vec3 voidHoriz = vec3(0.025, 0.095, 0.12);
              vec3 dawnHoriz = vec3(0.08, 0.34, 0.32);

              vec3 zenith = mix(voidZenith, dawnZenith, uDawn);
              vec3 horiz = mix(voidHoriz, dawnHoriz, uDawn);
              vec3 col = mix(horiz, zenith, smoothstep(-0.05, 0.58, dir.y));

              // Emerald & Cyan Aurora Borealis curtains in upper sky
              float auroraWave = sin(dir.x * 5.2 + dir.z * 3.4 + uTime * 0.55 + n1 * 4.5);
              float auroraBand = smoothstep(0.32, 0.92, auroraWave * 0.5 + 0.5) * smoothstep(0.05, 0.38, dir.y) * (1.0 - smoothstep(0.55, 0.92, dir.y));
              vec3 auroraCol = mix(vec3(0.06, 0.68, 0.55), vec3(0.18, 0.58, 0.88), n2);
              col += auroraCol * auroraBand * (0.14 + uDawn * 0.32);

              // Warm Sunrise Halo toward (+x, +y, +z) matching directional sunLight
              vec3 sunDir = normalize(vec3(0.56, 0.42, 0.52));
              float sunDot = max(0.0, dot(dir, sunDir));
              col += vec3(0.88, 0.62, 0.22) * pow(sunDot, 10.0) * uDawn * 0.38;
              col += vec3(0.75, 0.45, 0.14) * horizonGlow * uDawn * 0.22;

              // Twinkling stars fading softly as dawn rises
              float starCell = hash(floor(dir * 145.0));
              float star = smoothstep(0.992, 0.999, starCell) * smoothstep(0.02, 0.42, dir.y);
              float twinkle = 0.55 + 0.45 * sin(uTime * 4.2 + starCell * 95.0);
              col += vec3(0.82, 0.96, 1.0) * star * twinkle * (1.0 - uDawn * 0.48);

              col += vec3(0.45, 0.92, 0.82) * uFlash * 0.18;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      scene.add(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(88, 32, 24)), skyMat));

      const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const waterTex = trackTex(createSanctuaryWaterTexture(renderer));
      waterTex.anisotropy = maxAniso;
      const fallTex = trackTex(createSanctuaryWaterfallTexture());
      fallTex.anisotropy = maxAniso;

      // =========================================================================
      // 1. Dynamic Morphing Sanctuary Terrain (Arena Tiles -> Living Nature)
      // =========================================================================
      const terrainSize = 54;
      const terrainSegs = 84;
      const terrainGeo = trackGeo(new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs));
      terrainGeo.rotateX(-Math.PI / 2);

      const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
      const vertCount = posAttr.count;
      const targetHeights = new Float32Array(vertCount);
      const vertRadii = new Float32Array(vertCount);
      const lushColors = new Float32Array(vertCount * 3);

      const cGrass = new THREE.Color(0x16a34a);
      const cMeadow = new THREE.Color(0x22c55e);
      const cMoss = new THREE.Color(0x15803d);
      const cSand = new THREE.Color(0x9a8c67);
      const cLakeBed = new THREE.Color(0x0c4a6e);
      const cRock = new THREE.Color(0x3f4c45);
      const cPeak = new THREE.Color(0x64748b);

      for (let i = 0; i < vertCount; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const h = computeSanctuaryHeight(vx, vz);
        targetHeights[i] = h;
        const r = Math.hypot(vx, vz);
        vertRadii[i] = r;
        posAttr.setY(i, 0);

        const noise = Math.sin(vx * 0.7) * Math.cos(vz * 0.7) * 0.5 + 0.5;

        if (h < -0.55) {
          _tmpColor.copy(cLakeBed);
        } else if (h < -0.05) {
          _tmpColor.copy(cSand).lerp(cMoss, (h + 0.55) / 0.5);
        } else if (h > 2.2) {
          _tmpColor.copy(cRock).lerp(cPeak, Math.min(1, (h - 2.2) / 2.8));
        } else if (h > 1.0) {
          _tmpColor.copy(cMoss).lerp(cRock, (h - 1.0) / 1.2);
        } else {
          _tmpColor.copy(cMoss).lerp(cGrass, noise * 0.7).lerp(cMeadow, r < 7.5 ? 0.35 : 0.12);
        }

        lushColors[i * 3] = _tmpColor.r;
        lushColors[i * 3 + 1] = _tmpColor.g;
        lushColors[i * 3 + 2] = _tmpColor.b;
      }

      terrainGeo.setAttribute('color', new THREE.BufferAttribute(lushColors, 3));
      terrainGeo.setAttribute('aTargetHeight', new THREE.BufferAttribute(targetHeights, 1));

      const terrainUniforms = {
        uWaveRadius: { value: -2.5 },
        uWaveActive: { value: 0.0 },
        uTime: { value: 0.0 }
      };

      const terrainMat = trackMat(
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.86,
          metalness: 0.08
        })
      );
      terrainMat.customProgramCacheKey = () => 'elementalis-genesis-terrain-v2';
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
            varying float vTargetHeight;
            varying float vSlope;`
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            float vDist = length(transformed.xz);
            float rippleEnv = exp(-pow((vDist - uWaveRadius) / 1.85, 2.0)) * uWaveActive;
            transformed.y += rippleEnv * (0.28 + 0.12 * sin(vDist * 2.4 - uTime * 7.5));
            vTerrainPos = transformed;
            vTargetHeight = aTargetHeight;
            vSlope = 1.0 - clamp(objectNormal.y, 0.0, 1.0);`
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
            varying float vSlope;

            float genesisHash21(vec2 p) {
              p = fract(p * vec2(123.34, 456.21));
              p += dot(p, p + 45.32);
              return fract(p.x * p.y);
            }

            float genesisVNoise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              float a = genesisHash21(i);
              float b = genesisHash21(i + vec2(1.0, 0.0));
              float c = genesisHash21(i + vec2(0.0, 1.0));
              float d = genesisHash21(i + vec2(1.0, 1.0));
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }

            float genesisFbm(vec2 p) {
              float v = 0.0;
              float amp = 0.5;
              for (int i = 0; i < 4; i++) {
                v += amp * genesisVNoise(p);
                p = p * 2.03 + vec2(17.1, 31.7);
                amp *= 0.5;
              }
              return v;
            }`
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            float warp = (genesisFbm(vTerrainPos.xz * 0.24) - 0.5) * 3.8 + sin(atan(vTerrainPos.z, vTerrainPos.x) * 5.0 + uTime * 0.6) * 0.45;
            float radialDist = length(vTerrainPos.xz) + warp;
            float landMask = 1.0 - smoothstep(uWaveRadius - 1.4, uWaveRadius + 0.7, radialDist);
            float frontier = exp(-pow((radialDist - uWaveRadius) / 1.15, 2.0)) * uWaveActive;
            float innerCrackBand = exp(-pow((radialDist - (uWaveRadius + 1.7)) / 1.4, 2.0)) * uWaveActive;

            // State A: Dark Runic Arena Floor
            vec2 tileCoord = vTerrainPos.xz * 0.85;
            vec2 tileId = floor(tileCoord);
            vec2 tileFract = fract(tileCoord);
            float tileHash = genesisHash21(tileId);
            float edgeDist = min(min(tileFract.x, 1.0 - tileFract.x), min(tileFract.y, 1.0 - tileFract.y));
            float groutMask = 1.0 - smoothstep(0.018, 0.055, edgeDist);
            float bevelHighlight = smoothstep(0.05, 0.09, edgeDist) * (1.0 - smoothstep(0.09, 0.15, edgeDist));
            float tileGrain = genesisVNoise(vTerrainPos.xz * 4.5 + tileHash * 17.0);

            vec3 arenaBase = mix(vec3(0.005, 0.010, 0.026), vec3(0.015, 0.025, 0.058), tileHash * 0.55 + tileGrain * 0.35);
            arenaBase += vec3(0.014, 0.024, 0.048) * bevelHighlight;
            arenaBase = mix(arenaBase, vec3(0.002, 0.004, 0.010), groutMask * 0.85);

            float rFlat = length(vTerrainPos.xz);
            float ring1 = exp(-pow((rFlat - 3.6) / 0.10, 2.0));
            float ring2 = exp(-pow((rFlat - 7.4) / 0.11, 2.0));
            float ring3 = exp(-pow((rFlat - 12.2) / 0.13, 2.0));
            float ring4 = exp(-pow((rFlat - 18.0) / 0.14, 2.0));
            float crossHair = exp(-pow(min(abs(vTerrainPos.x), abs(vTerrainPos.z)) / 0.06, 2.0)) * smoothstep(24.0, 3.0, rFlat);
            float runeMask = clamp(ring1 + ring2 + ring3 + ring4 + crossHair * 0.35, 0.0, 1.0);
            float runePulse = 0.72 + 0.28 * sin(uTime * 2.4 - rFlat * 0.5);
            arenaBase = mix(arenaBase, vec3(0.035, 0.42, 0.78), runeMask * 0.45 * runePulse);

            // State B: Sanctuary Lush Terrain
            float detailLow = genesisFbm(vTerrainPos.xz * 0.42);
            float detailHigh = genesisVNoise(vTerrainPos.xz * 3.8);
            float microGrain = genesisVNoise(vTerrainPos.xz * 11.5);

            vec3 natureColor = diffuseColor.rgb;
            float grassZone = smoothstep(-0.08, 0.25, vTargetHeight) * (1.0 - smoothstep(0.95, 1.55, vTargetHeight));
            natureColor = mix(natureColor, natureColor * (0.78 + 0.48 * detailLow) + vec3(0.012, 0.035, 0.008) * detailHigh, grassZone);

            float shoreZone = smoothstep(-0.62, -0.25, vTargetHeight) * (1.0 - smoothstep(-0.05, 0.24, vTargetHeight));
            vec3 sandTone = mix(vec3(0.24, 0.20, 0.12), vec3(0.38, 0.32, 0.20), microGrain);
            float wetDarken = mix(0.55, 1.0, smoothstep(-0.32, 0.08, vTargetHeight));
            natureColor = mix(natureColor, sandTone * wetDarken, shoreZone * 0.75);

            float lakeZone = 1.0 - smoothstep(-0.58, -0.22, vTargetHeight);
            float caustic = pow(abs(sin(vTerrainPos.x * 1.9 + detailLow * 4.5 + uTime * 0.7) * cos(vTerrainPos.z * 1.9 - detailHigh * 3.0 - uTime * 0.5)), 2.5);
            vec3 lakeTone = mix(vec3(0.012, 0.09, 0.16), vec3(0.03, 0.24, 0.36), detailLow) + vec3(0.06, 0.28, 0.36) * caustic;
            natureColor = mix(natureColor, lakeTone, lakeZone * 0.85);

            float rockZone = clamp(smoothstep(0.85, 2.0, vTargetHeight) + smoothstep(0.22, 0.52, vSlope) * 0.75, 0.0, 1.0);
            float strata = 0.5 + 0.5 * sin(vTargetHeight * 7.5 + detailLow * 5.0);
            vec3 rockTone = mix(vec3(0.055, 0.072, 0.065), vec3(0.14, 0.16, 0.17), strata * 0.65 + detailHigh * 0.35);
            natureColor = mix(natureColor, rockTone, rockZone * 0.78);

            float peakFrost = smoothstep(2.65, 4.1, vTargetHeight + (detailHigh - 0.5) * 0.55);
            natureColor = mix(natureColor, vec3(0.48, 0.56, 0.62), peakFrost * 0.68);

            diffuseColor.rgb = mix(arenaBase, natureColor, landMask);
            vec3 seamTint = mix(vec3(0.08, 0.68, 0.62), vec3(0.85, 0.62, 0.14), clamp(detailHigh * 1.1, 0.0, 1.0));
            diffuseColor.rgb = mix(diffuseColor.rgb, seamTint, frontier * 0.55);`
          )
          .replace(
            '#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>
            float arenaRough = mix(0.36, 0.74, groutMask);
            float wetSandFactor = shoreZone * (1.0 - smoothstep(-0.35, 0.04, vTargetHeight));
            float natureRough = mix(0.86, 0.24, clamp(lakeZone + wetSandFactor, 0.0, 1.0));
            roughnessFactor = mix(arenaRough, natureRough, landMask);`
          )
          .replace(
            '#include <metalnessmap_fragment>',
            `#include <metalnessmap_fragment>
            metalnessFactor = mix(mix(0.32, 0.08, groutMask), 0.04, landMask);`
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            vec3 runeGlow = vec3(0.04, 0.45, 0.78) * runeMask * (0.24 + 0.28 * innerCrackBand) * (1.0 - landMask);
            vec3 groutCrackGlow = vec3(0.06, 0.68, 0.60) * groutMask * innerCrackBand * 0.95;
            vec3 frontierGlow = mix(vec3(0.06, 0.72, 0.64), vec3(0.85, 0.62, 0.16), detailHigh) * frontier * 1.15;
            vec3 causticGlow = vec3(0.02, 0.18, 0.28) * caustic * lakeZone * landMask * 0.42;
            totalEmissiveRadiance += runeGlow + groutCrackGlow + frontierGlow + causticGlow;`
          );
      };

      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = !isSoftwareGl;
      scene.add(terrainMesh);

      // =========================================================================
      // 2. Central Mossy Sanctuary Altar + 4 Elemental Monoliths + Energy Arcs
      // =========================================================================
      const altarGroup = new THREE.Group();
      const stoneMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x2a3644,
          roughness: 0.78,
          metalness: 0.18
        })
      );
      const leylineMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x2dd4bf,
          emissive: 0x14b8a6,
          emissiveIntensity: 1.05,
          roughness: 0.25,
          metalness: 0.6
        })
      );

      const dais = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.65, 3.15, 0.28, 12)), stoneMat);
      dais.position.y = 0.14;
      dais.receiveShadow = !isSoftwareGl;
      altarGroup.add(dais);

      const altarRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(2.85, 0.065, 10, 48)), leylineMat);
      altarRing.rotation.x = Math.PI / 2;
      altarRing.position.y = 0.09;
      altarGroup.add(altarRing);

      const altarOuterRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(3.45, 0.032, 8, 56)), leylineMat);
      altarOuterRing.rotation.x = Math.PI / 2;
      altarOuterRing.position.y = 0.03;
      altarGroup.add(altarOuterRing);

      // Soft contact shadow directly beneath Elementalis
      const csCanvas = document.createElement('canvas');
      csCanvas.width = 128;
      csCanvas.height = 128;
      const csCtx = csCanvas.getContext('2d');
      if (csCtx) {
        const g = csCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
        g.addColorStop(0, 'rgba(3, 18, 22, 0.72)');
        g.addColorStop(0.55, 'rgba(3, 18, 22, 0.3)');
        g.addColorStop(1, 'rgba(3, 18, 22, 0)');
        csCtx.fillStyle = g;
        csCtx.fillRect(0, 0, 128, 128);
      }
      const contactShadow = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(1.75, 1.75)),
        trackMat(
          new THREE.MeshBasicMaterial({
            map: trackTex(new THREE.CanvasTexture(csCanvas)),
            transparent: true,
            opacity: 0.68,
            depthWrite: false
          })
        )
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.set(0, 0.29, 0);
      altarGroup.add(contactShadow);

      // 4 Elemental Standing Monoliths + Dynamic Energy Arcs -> Genesis Seed
      const elementColors = [0xf97316, 0x34d399, 0x38bdf8, 0xfbbf24];
      const monolithCorePositions: THREE.Vector3[] = [];
      const monolithCores: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const pillarGroup = new THREE.Group();
        pillarGroup.position.set(Math.cos(ang) * 4.2, 0, Math.sin(ang) * 4.2);
        pillarGroup.rotation.y = -ang;

        const basePlinth = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.56, 0.24, 6)), stoneMat);
        basePlinth.position.y = 0.12;
        pillarGroup.add(basePlinth);

        const baseStone = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 1.38, 0.44)), stoneMat);
        baseStone.position.y = 0.82;
        baseStone.castShadow = !isSoftwareGl;
        pillarGroup.add(baseStone);

        const runeCore = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.25, 0)),
          trackMat(
            new THREE.MeshStandardMaterial({
              color: elementColors[i],
              emissive: elementColors[i],
              emissiveIntensity: 1.18,
              roughness: 0.2,
              metalness: 0.4
            })
          )
        );
        runeCore.position.y = 1.82;
        pillarGroup.add(runeCore);
        monolithCores.push(runeCore);

        const capCrown = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.32, 0.025, 6, 18)), leylineMat);
        capCrown.rotation.x = Math.PI / 2;
        capCrown.position.y = 1.82;
        pillarGroup.add(capCrown);

        altarGroup.add(pillarGroup);
        altarGroup.updateMatrixWorld(true);
        const worldPos = new THREE.Vector3();
        runeCore.getWorldPosition(worldPos);
        monolithCorePositions.push(worldPos);
      }
      scene.add(altarGroup);

      // 4 Elemental Lightning/Mana Arcs firing from Monoliths into the Genesis Seed
      const arcSegs = 14;
      const arcBuffers: Float32Array[] = [];
      const arcAttrs: THREE.BufferAttribute[] = [];
      const arcLines: THREE.Line[] = [];
      for (let i = 0; i < 4; i++) {
        const arr = new Float32Array(arcSegs * 3);
        const attr = new THREE.BufferAttribute(arr, 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        const geo = trackGeo(new THREE.BufferGeometry());
        geo.setAttribute('position', attr);
        const mat = trackMat(
          new THREE.LineBasicMaterial({
            color: elementColors[i],
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        scene.add(line);
        arcBuffers.push(arr);
        arcAttrs.push(attr);
        arcLines.push(line);
      }

      // =========================================================================
      // 3. Composite 12-Part Elementalis Avatar + Staff + Mandala Halo + 4 Constructs
      // =========================================================================
      const heroGroup = new THREE.Group();
      heroGroup.position.set(0, 0.35, 0);

      const robeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0f766e,
          emissive: 0x042f2e,
          emissiveIntensity: 0.22,
          roughness: 0.44,
          metalness: 0.32,
          side: THREE.DoubleSide
        })
      );
      const deepMantleMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x064e3b,
          emissive: 0x022c22,
          emissiveIntensity: 0.18,
          roughness: 0.58,
          metalness: 0.18,
          side: THREE.DoubleSide
        })
      );
      const goldTrimMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          emissive: 0x78350f,
          emissiveIntensity: 0.16,
          roughness: 0.2,
          metalness: 0.9
        })
      );
      const spiritCoreMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x5eead4,
          emissive: 0x14b8a6,
          emissiveIntensity: 1.25,
          roughness: 0.16,
          metalness: 0.24
        })
      );

      // Lower Robe & Gilded Hem Ring
      const lowerRobe = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.56, 1.24, 12)), robeMat);
      lowerRobe.position.y = 0.62;
      lowerRobe.castShadow = !isSoftwareGl;
      const robeHemRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.52, 0.032, 8, 32)), goldTrimMat);
      robeHemRing.rotation.x = Math.PI / 2;
      robeHemRing.position.y = 0.04;
      heroGroup.add(lowerRobe, robeHemRing);

      // Flowing Primordial Swallowtail Cape behind Elementalis
      const mantleShape = new THREE.Shape();
      mantleShape.moveTo(-0.42, 0);
      mantleShape.lineTo(0.42, 0);
      mantleShape.lineTo(0.76, -1.48);
      mantleShape.lineTo(0.24, -1.24);
      mantleShape.lineTo(0, -1.62);
      mantleShape.lineTo(-0.24, -1.24);
      mantleShape.lineTo(-0.76, -1.48);
      mantleShape.closePath();
      const mantleCape = new THREE.Mesh(
        trackGeo(new THREE.ExtrudeGeometry(mantleShape, { depth: 0.035, bevelEnabled: false })),
        deepMantleMat
      );
      mantleCape.position.set(0, 1.62, -0.26);
      mantleCape.rotation.x = 0.24;
      heroGroup.add(mantleCape);

      // Torso, Astrolabe Sternum & Heart Gem
      const chestArmor = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.25, 0.66, 8)), goldTrimMat);
      chestArmor.position.y = 1.32;
      chestArmor.castShadow = !isSoftwareGl;
      const chestCollar = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.26, 0.035, 8, 24)), goldTrimMat);
      chestCollar.rotation.x = Math.PI / 2 + 0.15;
      chestCollar.position.set(0, 1.64, 0.02);
      const heartGem = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.16, 0)), spiritCoreMat);
      heartGem.position.set(0, 1.35, 0.28);
      heroGroup.add(chestArmor, chestCollar, heartGem);

      // Hooded Spirit Head + Luminous Eyes + Crystalline Nature Crown
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.88, 0.02);
      const headSphere = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.21, 16, 16)), spiritCoreMat);
      const visorBand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.055, 0.14)), goldTrimMat);
      visorBand.position.set(0, 0.02, 0.14);
      const hoodHelm = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.33, 0.56, 8)), robeMat);
      hoodHelm.position.set(0, 0.16, -0.04);
      hoodHelm.rotation.x = -0.18;

      const crownSpikeGeo = trackGeo(new THREE.ConeGeometry(0.045, 0.36, 5));
      for (const side of [-1, 1]) {
        const antler = new THREE.Mesh(crownSpikeGeo, spiritCoreMat);
        antler.position.set(side * 0.22, 0.26, 0.02);
        antler.rotation.z = side * -0.42;
        headGroup.add(antler);
      }
      headGroup.add(headSphere, visorBand, hoodHelm);
      heroGroup.add(headGroup);

      // Dual-Ring Sacred Elemental Mandala Halo behind shoulders
      const haloGroup = new THREE.Group();
      haloGroup.position.set(0, 1.78, -0.26);
      const crownHaloOuter = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.76, 0.042, 10, 40)), goldTrimMat);
      const crownHaloInner = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.54, 0.026, 8, 32)), spiritCoreMat);
      haloGroup.add(crownHaloOuter, crownHaloInner);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const pip = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.09, 0)),
          trackMat(
            new THREE.MeshStandardMaterial({
              color: elementColors[i],
              emissive: elementColors[i],
              emissiveIntensity: 1.15,
              roughness: 0.2
            })
          )
        );
        pip.position.set(Math.cos(a) * 0.76, Math.sin(a) * 0.76, 0);
        haloGroup.add(pip);
      }
      heroGroup.add(haloGroup);

      // Articulated Arms + Primordial Genesis Scepter/Staff
      const armGeo = trackGeo(new THREE.CylinderGeometry(0.075, 0.06, 0.68, 8));
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.42, 1.56, 0.02);
      const leftArmMesh = new THREE.Mesh(armGeo, robeMat);
      leftArmMesh.position.y = -0.32;
      const leftHandOrb = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.1, 0)), spiritCoreMat);
      leftHandOrb.position.y = -0.68;
      leftArmPivot.add(leftArmMesh, leftHandOrb);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.42, 1.56, 0.02);
      const rightArmMesh = new THREE.Mesh(armGeo, robeMat);
      rightArmMesh.position.y = -0.32;
      const rightHandOrb = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.1, 0)), goldTrimMat);
      rightHandOrb.position.y = -0.68;
      rightArmPivot.add(rightArmMesh, rightHandOrb);

      for (const side of [-1, 1]) {
        const pauldron = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.19, 0)), goldTrimMat);
        pauldron.position.set(side * 0.42, 1.58, 0);
        pauldron.scale.set(1.15, 0.72, 1.0);
        heroGroup.add(pauldron);
      }
      heroGroup.add(leftArmPivot, rightArmPivot);

      // Primordial Scepter hovering in front-right & channeling upward
      const staffGroup = new THREE.Group();
      staffGroup.position.set(0.55, 1.55, 0.28);
      const staffShaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.03, 2.35, 8)), goldTrimMat);
      const staffRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.24, 0.026, 8, 28)), goldTrimMat);
      staffRing.position.y = 1.32;
      const staffCrystal = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.16, 0)), spiritCoreMat);
      staffCrystal.position.y = 1.32;
      staffGroup.add(staffShaft, staffRing, staffCrystal);
      heroGroup.add(staffGroup);

      // 4 Distinct Sculpted Elemental Constructs orbiting Elementalis
      const orbGroup = new THREE.Group();
      orbGroup.position.y = 1.55;
      const orbMeshes: THREE.Group[] = [];
      for (let i = 0; i < 4; i++) {
        const subOrb = new THREE.Group();
        const col = elementColors[i];
        const oMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: 1.15,
            roughness: 0.2,
            metalness: 0.35
          })
        );
        if (i === 0) {
          // Ignis: Twin Crossed Ring + Diamond Core
          const core = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.22, 0)), oMat);
          const ringA = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.32, 0.026, 8, 24)), oMat);
          ringA.rotation.x = Math.PI / 3;
          const ringB = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.36, 0.02, 8, 24)), oMat);
          ringB.rotation.y = Math.PI / 3;
          subOrb.add(core, ringA, ringB);
        } else if (i === 1) {
          // Terra: Floating Crystal Cluster
          const centerRock = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.2, 0)), oMat);
          const shardA = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.09, 0.28, 5)), oMat);
          shardA.position.set(0.22, 0.08, 0);
          shardA.rotation.z = -0.6;
          const shardB = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.08, 0.26, 5)), oMat);
          shardB.position.set(-0.2, -0.05, 0.1);
          shardB.rotation.z = 0.8;
          subOrb.add(centerRock, shardA, shardB);
        } else if (i === 2) {
          // Aqua: Hydro Sphere + Dual Wave Rings
          const core = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.2, 16, 16)), oMat);
          const waveRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.32, 0.028, 8, 24)), oMat);
          waveRing.rotation.x = Math.PI / 2.2;
          subOrb.add(core, waveRing);
        } else {
          // Ventus / Storm: Star Tetrahedron + Cyclone Halo
          const coreA = new THREE.Mesh(trackGeo(new THREE.TetrahedronGeometry(0.22, 0)), oMat);
          const coreB = new THREE.Mesh(trackGeo(new THREE.TetrahedronGeometry(0.22, 0)), oMat);
          coreB.rotation.set(Math.PI, Math.PI / 4, 0);
          const windRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.34, 0.022, 8, 24)), oMat);
          windRing.rotation.x = Math.PI / 2;
          subOrb.add(coreA, coreB, windRing);
        }
        orbGroup.add(subOrb);
        orbMeshes.push(subOrb);
      }
      heroGroup.add(orbGroup);
      scene.add(heroGroup);

      // Primordial Genesis Seed Core hovering above Elementalis (triggers Wavefront at 0.32 & Realm Bloom at 0.72)
      const genesisSeed = new THREE.Mesh(
        trackGeo(new THREE.IcosahedronGeometry(0.34, 1)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x99f6e4,
            emissive: 0x2dd4bf,
            emissiveIntensity: 1.35,
            roughness: 0.12,
            metalness: 0.2
          })
        )
      );
      genesisSeed.position.set(0, 3.65, 0);
      scene.add(genesisSeed);

      // =========================================================================
      // 4. Custom GLSL Caustic Sanctuary Lake + Winding River + Waterfall & Mist Plume
      // =========================================================================
      const lakeUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 },
        uMap: { value: waterTex }
      };
      const lakeGeo = trackGeo(new THREE.CircleGeometry(7.2, 48));
      lakeGeo.rotateX(-Math.PI / 2);
      const lakeMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: lakeUniforms,
          transparent: true,
          depthWrite: false,
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vLocalPos;
            void main() {
              vUv = uv;
              vLocalPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            varying vec3 vLocalPos;
            uniform float uTime;
            uniform float uAlpha;
            uniform sampler2D uMap;

            void main() {
              float r = length(vLocalPos.xz) / 7.2;
              vec2 flowUv = vUv * 2.4 + vec2(uTime * 0.035, uTime * 0.024);
              vec3 texCol = texture2D(uMap, flowUv).rgb;

              float waveA = sin(vLocalPos.x * 2.4 + uTime * 2.2) * cos(vLocalPos.z * 2.2 - uTime * 1.8);
              float ripple = sin(r * 24.0 - uTime * 3.5) * 0.5 + 0.5;
              float caustic = pow(clamp(waveA * 0.5 + 0.5, 0.0, 1.0), 3.0);

              vec3 deepAqua = vec3(0.02, 0.22, 0.36);
              vec3 turquoise = vec3(0.08, 0.52, 0.64);
              vec3 foamTint = vec3(0.55, 0.92, 0.96);

              vec3 col = mix(deepAqua, turquoise, 0.45 + caustic * 0.45) * 0.72 + texCol * 0.38;
              col += foamTint * caustic * 0.22;
              float shoreFoam = smoothstep(0.76, 0.96, r) * (0.45 + 0.55 * ripple);
              col += foamTint * shoreFoam * 0.24;

              float edgeFade = 1.0 - smoothstep(0.84, 1.0, r);
              gl_FragColor = vec4(col, edgeFade * uAlpha);
            }
          `
        })
      );
      const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
      lakeMesh.position.set(-6.8, -0.36, 5.2);
      lakeMesh.scale.set(1.15, 1, 0.85);
      scene.add(lakeMesh);

      // Winding Stream connecting Waterfall Base (6.6,-0.32,-4.8) to Lake (-4.8,-0.32,4.2)
      const streamCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(6.6, -0.32, -4.8),
        new THREE.Vector3(5.1, -0.32, -2.5),
        new THREE.Vector3(3.6, -0.32, -0.3),
        new THREE.Vector3(1.2, -0.34, 1.8),
        new THREE.Vector3(-2.4, -0.34, 3.3),
        new THREE.Vector3(-5.0, -0.36, 4.4)
      ]);
      const streamGeo = trackGeo(new THREE.TubeGeometry(streamCurve, 32, 0.85, 8, false));
      streamGeo.scale(1, 0.14, 1);
      const streamMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: waterTex,
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.24,
          roughness: 0.16,
          metalness: 0.32,
          transparent: true,
          opacity: 0
        })
      );
      const streamMesh = new THREE.Mesh(streamGeo, streamMat);
      scene.add(streamMesh);

      // Lily pads & glowing lotus flowers on the lake
      const lilyGroup = new THREE.Group();
      const lilyMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.68 }));
      const lotusMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf9a8d4,
          emissive: 0xdb2777,
          emissiveIntensity: 0.45,
          roughness: 0.35
        })
      );
      for (let i = 0; i < 12; i++) {
        const ang = i * 1.17;
        const rad = 1.1 + (i % 4) * 1.15;
        const pad = new THREE.Group();
        pad.position.set(-6.8 + Math.cos(ang) * rad * 1.1, -0.32, 5.2 + Math.sin(ang) * rad * 0.78);
        const leaf = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 12, 1, false, 0, Math.PI * 1.8)),
          lilyMat
        );
        pad.add(leaf);
        if (i % 3 === 0) {
          const lotus = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), lotusMat);
          lotus.position.y = 0.1;
          pad.add(lotus);
        }
        lilyGroup.add(pad);
      }
      lilyGroup.scale.setScalar(0.001);
      scene.add(lilyGroup);

      // Waterfall Ribbon cascading from cliff (+x, -z) + Mist Plume Rings at Base
      const fallCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(9.4, 3.6, -8.2),
        new THREE.Vector3(8.1, 2.2, -6.9),
        new THREE.Vector3(7.1, 0.4, -5.6),
        new THREE.Vector3(6.6, -0.35, -4.8)
      ]);
      const fallGeo = trackGeo(new THREE.TubeGeometry(fallCurve, 24, 0.85, 8, false));
      fallGeo.scale(1.4, 1, 0.35);
      const fallMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: fallTex,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.32,
          roughness: 0.18,
          transparent: true,
          opacity: 0
        })
      );
      const waterfallMesh = new THREE.Mesh(fallGeo, fallMat);
      scene.add(waterfallMesh);

      const mistPlumeMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xa5f3fc,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const mistPlumes: THREE.Mesh[] = [];
      const mistGeo = trackGeo(new THREE.TorusGeometry(0.95, 0.16, 8, 28));
      for (let m = 0; m < 3; m++) {
        const ring = new THREE.Mesh(mistGeo, mistPlumeMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(6.6, -0.25 + m * 0.12, -4.8);
        mistPlumes.push(ring);
        scene.add(ring);
      }

      // =========================================================================
      // 5. Towering Multi-Part Mountains with Snow Caps & Mineral Veins
      // =========================================================================
      const mountainsGroup = new THREE.Group();
      const rockMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.08, flatShading: true })
      );
      const snowMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.58, metalness: 0.05, flatShading: true })
      );
      const veinTealMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x14b8a6, emissiveIntensity: 1.05, roughness: 0.3 })
      );
      const veinAmberMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.95, roughness: 0.3 })
      );

      const mountainRecords: Array<{ group: THREE.Group; targetY: number; delay: number }> = [];
      const mountainCount = 16;
      for (let i = 0; i < mountainCount; i++) {
        const ang = (i / mountainCount) * Math.PI * 2 + 0.15;
        const dist = 17.5 + (i % 3) * 3.2;
        const mx = Math.cos(ang) * dist;
        const mz = Math.sin(ang) * dist;
        const mScale = 1.0 + ((i * 37) % 10) * 0.09;
        const peakH = (5.4 + (i % 4) * 2.1) * mScale;

        const mGroup = new THREE.Group();
        mGroup.position.set(mx, -peakH, mz);
        mGroup.rotation.y = ang + i * 0.5;

        const mainPeak = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(3.4 * mScale, peakH, 7)), rockMat);
        mainPeak.position.y = peakH * 0.5;
        mainPeak.castShadow = !isSoftwareGl;
        mGroup.add(mainPeak);

        const ridge = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.3 * mScale, peakH * 0.68, 6)), rockMat);
        ridge.position.set(1.6 * mScale, peakH * 0.34, 0.7 * mScale);
        mGroup.add(ridge);

        const snowCap = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.18 * mScale, peakH * 0.32, 7)), snowMat);
        snowCap.position.y = peakH * 0.845;
        mGroup.add(snowCap);

        const vein = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.55 * mScale, 0)),
          i % 3 === 0 ? veinAmberMat : veinTealMat
        );
        vein.scale.set(0.5, 2.6, 0.5);
        vein.position.set(0, peakH * 0.42, 1.55 * mScale);
        vein.rotation.x = 0.32;
        mGroup.add(vein);

        mountainsGroup.add(mGroup);
        const baseGroundY = computeSanctuaryHeight(mx, mz) - 0.6;
        mountainRecords.push({
          group: mGroup,
          targetY: baseGroundY,
          delay: (i % 5) * 0.04
        });
      }
      scene.add(mountainsGroup);

      // =========================================================================
      // 6. Ancient Primordial Spirit Tree + Roots & Hanging Spirit Lanterns
      // =========================================================================
      const spiritTreeGroup = new THREE.Group();
      const stX = 8.4;
      const stZ = -7.8;
      const stGround = computeSanctuaryHeight(stX, stZ);
      spiritTreeGroup.position.set(stX, stGround - 0.2, stZ);

      const barkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x452719, roughness: 0.92 }));
      const spiritLeafMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.24,
          roughness: 0.65
        })
      );
      const sakuraLeafMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0xbe185d,
          emissiveIntensity: 0.22,
          roughness: 0.6
        })
      );

      const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.38, 0.72, 3.2, 8)), barkMat);
      trunk.position.y = 1.6;
      trunk.castShadow = !isSoftwareGl;
      spiritTreeGroup.add(trunk);

      // 4 Buttress Roots anchoring the Spirit Tree to the cliff
      const rootGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.24, 1.2, 6));
      for (let r = 0; r < 4; r++) {
        const ra = (r * Math.PI) / 2 + 0.4;
        const root = new THREE.Mesh(rootGeo, barkMat);
        root.position.set(Math.cos(ra) * 0.62, 0.35, Math.sin(ra) * 0.62);
        root.rotation.set(Math.sin(ra) * 0.6, 0, -Math.cos(ra) * 0.6);
        spiritTreeGroup.add(root);
      }

      const canopyOffsets: Array<[number, number, number, number, boolean]> = [
        [0, 3.5, 0, 1.65, false],
        [-1.05, 3.05, 0.65, 1.15, true],
        [1.1, 3.15, -0.5, 1.2, false],
        [0.2, 4.15, 0.4, 1.15, true],
        [-0.35, 2.85, -0.95, 1.05, false]
      ];
      for (const [cx, cy, cz, cr, isPink] of canopyOffsets) {
        const crown = new THREE.Mesh(
          trackGeo(new THREE.IcosahedronGeometry(cr, 1)),
          isPink ? sakuraLeafMat : spiritLeafMat
        );
        crown.position.set(cx, cy, cz);
        crown.scale.y = 0.72;
        spiritTreeGroup.add(crown);
      }

      // 4 Hanging Spirit Lantern Crystals beneath the canopy
      const lanternGeo = trackGeo(new THREE.OctahedronGeometry(0.16, 0));
      for (let l = 0; l < 4; l++) {
        const la = (l * Math.PI) / 2 + 0.6;
        const lantern = new THREE.Mesh(lanternGeo, spiritCoreMat);
        lantern.position.set(Math.cos(la) * 1.25, 2.55 + (l % 2) * 0.25, Math.sin(la) * 1.25);
        spiritTreeGroup.add(lantern);
      }
      spiritTreeGroup.scale.setScalar(0.001);
      scene.add(spiritTreeGroup);

      // =========================================================================
      // 7. Instanced Forest Groves (72 Pine Trees + 24 Blossom Trees + 36 Boulders)
      // =========================================================================
      const pineCount = 72;
      const pinePositions: Array<{ x: number; y: number; z: number; s: number; rot: number }> = [];
      for (let i = 0; i < pineCount * 2 && pinePositions.length < pineCount; i++) {
        const ang = (i * 2.39996) % (Math.PI * 2);
        const rad = 7.4 + (((i * 19) % 100) / 100) * 8.6;
        const tx = Math.cos(ang) * rad;
        const tz = Math.sin(ang) * rad;
        const ty = computeSanctuaryHeight(tx, tz);
        if (ty < 0.02) continue;
        pinePositions.push({
          x: tx,
          y: ty - 0.12,
          z: tz,
          s: 0.72 + ((i * 31) % 10) * 0.075,
          rot: i * 0.8
        });
      }

      const pineTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.18, 0.9, 6));
      pineTrunkGeo.translate(0, 0.45, 0);
      const pineCone1Geo = trackGeo(new THREE.ConeGeometry(0.68, 1.15, 7));
      pineCone1Geo.translate(0, 1.25, 0);
      const pineCone2Geo = trackGeo(new THREE.ConeGeometry(0.5, 1.0, 7));
      pineCone2Geo.translate(0, 1.85, 0);

      const pineFoliageMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, flatShading: true }));
      const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, barkMat, pinePositions.length);
      const pineLowerCones = new THREE.InstancedMesh(pineCone1Geo, pineFoliageMat, pinePositions.length);
      const pineUpperCones = new THREE.InstancedMesh(pineCone2Geo, pineFoliageMat, pinePositions.length);
      pineLowerCones.frustumCulled = false;
      pineUpperCones.frustumCulled = false;
      pineTrunks.frustumCulled = false;

      const pinePalette = [0x15803d, 0x166534, 0x0f766e, 0x22c55e];
      for (let i = 0; i < pinePositions.length; i++) {
        _tmpColor.setHex(pinePalette[i % pinePalette.length]);
        pineLowerCones.setColorAt(i, _tmpColor);
        _tmpColor.offsetHSL(0, 0, 0.05);
        pineUpperCones.setColorAt(i, _tmpColor);
      }
      if (pineLowerCones.instanceColor) pineLowerCones.instanceColor.needsUpdate = true;
      if (pineUpperCones.instanceColor) pineUpperCones.instanceColor.needsUpdate = true;
      scene.add(pineTrunks, pineLowerCones, pineUpperCones);

      // Blossom Trees (24 instanced)
      const blossomCount = 24;
      const blossomPositions: Array<{ x: number; y: number; z: number; s: number }> = [];
      for (let i = 0; i < 60 && blossomPositions.length < blossomCount; i++) {
        const ang = (i * 1.81 + 0.4) % (Math.PI * 2);
        const rad = 6.2 + (((i * 23) % 100) / 100) * 6.5;
        const bx = Math.cos(ang) * rad;
        const bz = Math.sin(ang) * rad;
        const by = computeSanctuaryHeight(bx, bz);
        if (by < 0.04) continue;
        blossomPositions.push({ x: bx, y: by - 0.1, z: bz, s: 0.75 + (i % 5) * 0.12 });
      }
      const blossomTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.12, 0.2, 1.1, 6));
      blossomTrunkGeo.translate(0, 0.55, 0);
      const blossomCrownGeo = trackGeo(new THREE.IcosahedronGeometry(0.75, 1));
      blossomCrownGeo.translate(0, 1.45, 0);
      const blossomMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }));
      const blossomTrunks = new THREE.InstancedMesh(blossomTrunkGeo, barkMat, blossomPositions.length);
      const blossomCrowns = new THREE.InstancedMesh(blossomCrownGeo, blossomMat, blossomPositions.length);
      blossomTrunks.frustumCulled = false;
      blossomCrowns.frustumCulled = false;
      for (let i = 0; i < blossomPositions.length; i++) {
        _tmpColor.setHex(i % 2 === 0 ? 0xf9a8d4 : 0xfde68a);
        blossomCrowns.setColorAt(i, _tmpColor);
      }
      if (blossomCrowns.instanceColor) blossomCrowns.instanceColor.needsUpdate = true;
      scene.add(blossomTrunks, blossomCrowns);

      // Instanced Mossy Boulders (36)
      const rockPositions: Array<{ x: number; y: number; z: number; s: number; rot: number }> = [];
      for (let i = 0; i < 36; i++) {
        const ang = i * 2.13;
        const rad = 5.2 + (i % 9) * 1.35;
        const rx = Math.cos(ang) * rad;
        const rz = Math.sin(ang) * rad;
        const ry = computeSanctuaryHeight(rx, rz);
        rockPositions.push({ x: rx, y: ry + 0.05, z: rz, s: 0.35 + (i % 4) * 0.2, rot: i * 0.9 });
      }
      const boulderGeo = trackGeo(new THREE.DodecahedronGeometry(0.65, 0));
      const bouldersMesh = new THREE.InstancedMesh(boulderGeo, stoneMat, rockPositions.length);
      bouldersMesh.frustumCulled = false;
      scene.add(bouldersMesh);

      // =========================================================================
      // 8. Phase II/III Genesis Shockwave Dome, Sky Pillar, Sunbeams & Shards
      // =========================================================================
      const genesisDomeUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const genesisDomeMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: genesisDomeUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.FrontSide,
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying vec3 vLocal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vLocal = position;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vViewPos = -mv.xyz;
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying vec3 vLocal;
            uniform float uTime;
            uniform float uAlpha;
            void main() {
              vec3 viewDir = normalize(vViewPos);
              float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
              float wave = 0.75 + 0.25 * sin(vLocal.y * 12.0 - uTime * 10.0);
              float intensity = pow(rim, 3.4) * wave * uAlpha;
              vec3 col = mix(vec3(0.08, 0.78, 0.68), vec3(0.95, 0.82, 0.35), pow(rim, 4.5));
              gl_FragColor = vec4(col * intensity, clamp(intensity, 0.0, 1.0));
            }
          `
        })
      );
      const genesisDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1, 28, 20)), genesisDomeMat);
      genesisDome.position.set(0, 0.8, 0);
      genesisDome.visible = false;
      scene.add(genesisDome);

      const genesisPillarMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x5eead4,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const genesisPillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.75, 1.55, 22, 24, 1, true)),
        genesisPillarMat
      );
      genesisPillar.position.set(0, 11, 0);
      genesisPillar.visible = false;
      scene.add(genesisPillar);

      const shockTealMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x2dd4bf,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockGoldMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveTeal = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1, 0.085, 10, 64)), shockTealMat);
      shockwaveTeal.rotation.x = Math.PI / 2;
      shockwaveTeal.position.y = 0.25;
      shockwaveTeal.visible = false;
      scene.add(shockwaveTeal);

      const shockwaveGold = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1, 0.06, 10, 64)), shockGoldMat);
      shockwaveGold.rotation.x = Math.PI / 2;
      shockwaveGold.position.y = 0.35;
      shockwaveGold.visible = false;
      scene.add(shockwaveGold);

      // Volumetric Dawn God-Ray Sunbeams descending across the Sanctuary in Phase III
      const dawnRayMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const dawnRaysGroup = new THREE.Group();
      const dawnRayGeo = trackGeo(new THREE.ConeGeometry(1.1, 14, 10, 1, true));
      for (let i = 0; i < 6; i++) {
        const ray = new THREE.Mesh(dawnRayGeo, dawnRayMat);
        const a = (i * Math.PI * 2) / 6 + 0.3;
        const rad = 4.5 + (i % 2) * 3.8;
        ray.position.set(Math.cos(a) * rad, 6.2, Math.sin(a) * rad);
        ray.rotation.set(0.18, 0, -0.22);
        dawnRaysGroup.add(ray);
      }
      dawnRaysGroup.visible = false;
      scene.add(dawnRaysGroup);

      // 80 Elemental Crystal Motes / Blossom Petals spiraling outward during Bloom
      const petalCount = 80;
      const petalGeo = trackGeo(new THREE.OctahedronGeometry(0.11, 0));
      const petalMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x14b8a6,
          emissiveIntensity: 0.72,
          roughness: 0.24
        })
      );
      const petalInstanced = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
      petalInstanced.frustumCulled = false;
      for (let i = 0; i < petalCount; i++) {
        _tmpColor.setHex(i % 4 === 0 ? 0xfbbf24 : i % 3 === 0 ? 0xf9a8d4 : i % 2 === 0 ? 0x34d399 : 0x38bdf8);
        petalInstanced.setColorAt(i, _tmpColor);
      }
      if (petalInstanced.instanceColor) petalInstanced.instanceColor.needsUpdate = true;
      scene.add(petalInstanced);

      // Drifting 3D Fluffy Clouds high above the mountain rim
      const cloudsGroup = new THREE.Group();
      const cloudMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xe0f2fe,
          emissive: 0x0f172a,
          emissiveIntensity: 0.1,
          roughness: 0.95,
          transparent: true,
          opacity: 0
        })
      );
      const cloudPuffGeo = trackGeo(new THREE.SphereGeometry(1.4, 12, 10));
      const clouds: THREE.Group[] = [];
      for (let c = 0; c < 8; c++) {
        const cg = new THREE.Group();
        const ang = (c / 8) * Math.PI * 2;
        cg.position.set(Math.cos(ang) * 18, 9.5 + (c % 3) * 1.4, Math.sin(ang) * 18);
        for (let p = 0; p < 4; p++) {
          const puff = new THREE.Mesh(cloudPuffGeo, cloudMat);
          puff.position.set((p - 1.5) * 1.2, (p % 2) * 0.45, (((p * 3) % 2) - 0.5) * 0.7);
          puff.scale.set(1.1 + (p % 2) * 0.35, 0.68, 0.9);
          cg.add(puff);
        }
        cloudsGroup.add(cg);
        clouds.push(cg);
      }
      scene.add(cloudsGroup);

      // Swirling Elemental Fireflies & Petals (340 Points)
      const moteCount = 340;
      const motePos = new Float32Array(moteCount * 3);
      const moteCol = new Float32Array(moteCount * 3);
      const moteSeeds = new Float32Array(moteCount);
      const mPalette = [0x2dd4bf, 0x38bdf8, 0xfbbf24, 0x4ade80, 0xf472b6];
      for (let i = 0; i < moteCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 1.5 + Math.random() * 17;
        motePos[i * 3] = Math.cos(ang) * rad;
        motePos[i * 3 + 1] = 0.2 + Math.random() * 6.8;
        motePos[i * 3 + 2] = Math.sin(ang) * rad;
        moteSeeds[i] = Math.random() * Math.PI * 2;
        _tmpColor.setHex(mPalette[i % mPalette.length]);
        moteCol[i * 3] = _tmpColor.r;
        moteCol[i * 3 + 1] = _tmpColor.g;
        moteCol[i * 3 + 2] = _tmpColor.b;
      }
      const moteGeo = trackGeo(new THREE.BufferGeometry());
      moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
      moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
      const moteMat = trackMat(
        new THREE.PointsMaterial({
          size: 0.18,
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
      // GPU POST-PROCESSING PIPELINE (Subtle DOF + Calibrated Bloom + Color Grade)
      // =========================================================================
      let composer: EffectComposer | null = null;
      let renderPass: RenderPass | null = null;
      let bokehPass: BokehPass | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let genesisPass: ShaderPass | null = null;
      let outputPass: OutputPass | null = null;

      const genesisPassUniforms = {
        tDiffuse: { value: null },
        uAberration: { value: 0.0007 },
        uShockWave: { value: 0 },
        uShockRadius: { value: 0 },
        uSunStreak: { value: 0.02 },
        uFlash: { value: 0 },
        uVignette: { value: 0.30 },
        uContrast: { value: 1.04 },
        uSaturation: { value: 1.05 },
        uGradeDawn: { value: 0.0 }
      };

      const depthHiddenObjects: THREE.Object3D[] = [
        genesisDome,
        genesisPillar,
        shockwaveTeal,
        shockwaveGold,
        dawnRaysGroup,
        motes,
        ...mistPlumes
      ];
      const depthHiddenPrev: boolean[] = new Array(depthHiddenObjects.length).fill(false);

      if (!isSoftwareGl) {
        const initW = window.innerWidth;
        const initH = Math.max(1, window.innerHeight);
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);

        bokehPass = new BokehPass(scene, camera, {
          focus: 6.8,
          aperture: 0.00016,
          maxblur: 0.0040
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

        bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.16, 0.24, 1.12);
        genesisPass = new ShaderPass({
          uniforms: genesisPassUniforms,
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
            uniform float uSunStreak;
            uniform float uFlash;
            uniform float uVignette;
            uniform float uContrast;
            uniform float uSaturation;
            uniform float uGradeDawn;
            varying vec2 vUv;

            void main() {
              vec2 center = vec2(0.5, 0.5);
              vec2 toCenter = vUv - center;
              float dist = length(toCenter);
              vec2 dir = dist > 0.0001 ? toCenter / dist : vec2(0.0);

              float ringDiff = dist - uShockRadius;
              float ringBand = exp(-ringDiff * ringDiff * 160.0) * uShockWave;
              vec2 uv = clamp(vUv - dir * ringBand * 0.022, 0.001, 0.999);

              vec2 caOffset = dir * uAberration * (0.32 + dist * 1.05 + ringBand * 1.4);
              float r = texture2D(tDiffuse, clamp(uv + caOffset, 0.001, 0.999)).r;
              float g = texture2D(tDiffuse, uv).g;
              float b = texture2D(tDiffuse, clamp(uv - caOffset, 0.001, 0.999)).b;
              vec3 col = vec3(r, g, b);

              float hBand = exp(-abs(vUv.y - 0.5) * 46.0) * exp(-abs(vUv.x - 0.5) * 3.2);
              col += mix(vec3(0.18, 0.85, 0.72), vec3(0.98, 0.82, 0.35), hBand) * hBand * uSunStreak;

              col += vec3(0.42, 0.94, 0.82) * ringBand * 0.13;
              col += vec3(0.75, 0.96, 0.88) * uFlash;

              // Subtle phase-aware linear color grading (split-tone + filmic contrast + saturation)
              float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
              float shadowWeight = 1.0 - smoothstep(0.04, 0.36, luma);
              float highWeight = smoothstep(0.32, 0.95, luma);

              vec3 shadowGrade = mix(vec3(0.94, 1.00, 1.05), vec3(0.96, 1.01, 1.00), uGradeDawn);
              vec3 highGrade = mix(vec3(0.97, 1.02, 1.04), vec3(1.045, 1.01, 0.945), uGradeDawn);
              col *= mix(vec3(1.0), shadowGrade, shadowWeight * 0.55);
              col *= mix(vec3(1.0), highGrade, highWeight * 0.65);

              // Gentle contrast around linear mid-tone & vibrance saturation
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
        composer.addPass(genesisPass);
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
      let bloomFlashTriggered = false;
      let currentRoll = 0;
      let smoothedBloomStrength = 0.16;
      let smoothedBloomRadius = 0.24;
      let smoothedDofFocus = 6.8;
      let smoothedDofAperture = 0.00016;
      let smoothedDofMaxBlur = 0.0040;
      let smoothedAberration = 0.0007;
      let smoothedSunStreak = 0.02;
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

        const nextPhase: CutscenePhase =
          progress < 0.32 ? 'awakening' : progress < 0.72 ? 'shaping' : 'bloom';
        if (nextPhase !== lastUiStage) {
          lastUiStage = nextPhase;
          setPhase(nextPhase);
        }
        const pctInt = Math.round(progress * 100);
        if (pctInt !== lastUiPct) {
          lastUiPct = pctInt;
          setUiProgress(pctInt);
        }

        // Trigger flash beat synced cleanly to GameEngine's 0.72 activateElementalisRealm()
        if (progress >= 0.72 && !bloomFlashTriggered) {
          bloomFlashTriggered = true;
          setBloomFlash(true);
          window.setTimeout(() => {
            if (!isDisposed) setBloomFlash(false);
          }, 160);
        }

        const terrainT = THREE.MathUtils.smoothstep(progress, 0.2, 0.65);
        const waterT = THREE.MathUtils.smoothstep(progress, 0.34, 0.68);
        const forestT = THREE.MathUtils.smoothstep(progress, 0.6, 0.9);
        const elapsed = progress * totalDuration;

        // 1. Shader Transition Wavefront + Radial Terrain Elevation Morph
        const waveProgress = THREE.MathUtils.smoothstep(progress, 0.16, 0.72);
        const waveRadius = THREE.MathUtils.lerp(-2.5, 36.5, waveProgress);
        const waveActive =
          THREE.MathUtils.smoothstep(progress, 0.14, 0.22) *
          (1 - THREE.MathUtils.smoothstep(progress, 0.68, 0.8));
        terrainUniforms.uWaveRadius.value = waveRadius;
        terrainUniforms.uWaveActive.value = waveActive;
        terrainUniforms.uTime.value = elapsed;

        const globalSettle = THREE.MathUtils.smoothstep(progress, 0.56, 0.78);
        const getHeightFactor = (r: number) => {
          const localW = THREE.MathUtils.clamp((waveRadius + 0.8 - r) / 5.5, 0, 1);
          return Math.max(localW * localW * (3 - 2 * localW), globalSettle);
        };

        const pArr = posAttr.array as Float32Array;
        for (let i = 0; i < vertCount; i++) {
          pArr[i * 3 + 1] = targetHeights[i] * getHeightFactor(vertRadii[i]);
        }
        posAttr.needsUpdate = true;
        terrainGeo.computeVertexNormals();

        // 2. Rise Mountains
        for (const rec of mountainRecords) {
          const mT = THREE.MathUtils.smoothstep(progress, 0.24 + rec.delay, 0.66 + rec.delay);
          rec.group.position.y = THREE.MathUtils.lerp(rec.targetY - 8.5, rec.targetY, mT);
        }

        // 3. GLSL Lake, Winding Stream, Waterfall & Mist Plume Rings
        lakeUniforms.uTime.value = elapsed;
        lakeUniforms.uAlpha.value = waterT * 0.92;
        streamMat.opacity = waterT * 0.85;
        fallMat.opacity = waterT * 0.88;
        waterTex.offset.x = elapsed * 0.05;
        waterTex.offset.y = elapsed * 0.04;
        fallTex.offset.y = -elapsed * 1.45;
        lakeMesh.position.y = -0.36 + Math.sin(elapsed * 2.1) * 0.02;
        lakeGlowLight.intensity = waterT * 4.5;

        for (let m = 0; m < mistPlumes.length; m++) {
          const phaseM = (elapsed * 0.85 + m * 0.33) % 1;
          mistPlumes[m].scale.setScalar(0.75 + phaseM * 1.45);
          mistPlumes[m].position.y = -0.22 + phaseM * 0.65;
        }
        mistPlumeMat.opacity = waterT * 0.32;

        const lilyScale = THREE.MathUtils.smoothstep(progress, 0.56, 0.84);
        lilyGroup.scale.setScalar(Math.max(0.001, lilyScale));

        // 4. Forest & Flora Sprouting
        spiritTreeGroup.scale.setScalar(Math.max(0.001, forestT));
        for (let i = 0; i < pinePositions.length; i++) {
          const p = pinePositions[i];
          const localDelay = (i % 6) * 0.03;
          const t = THREE.MathUtils.smoothstep(progress, 0.58 + localDelay, 0.88 + localDelay);
          const sc = Math.max(0.001, p.s * t);
          _dummy.position.set(p.x, p.y * getHeightFactor(Math.hypot(p.x, p.z)), p.z);
          _dummy.rotation.set(0, p.rot, 0);
          _dummy.scale.setScalar(sc);
          _dummy.updateMatrix();
          pineTrunks.setMatrixAt(i, _dummy.matrix);
          pineLowerCones.setMatrixAt(i, _dummy.matrix);
          pineUpperCones.setMatrixAt(i, _dummy.matrix);
        }
        pineTrunks.instanceMatrix.needsUpdate = true;
        pineLowerCones.instanceMatrix.needsUpdate = true;
        pineUpperCones.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < blossomPositions.length; i++) {
          const b = blossomPositions[i];
          const t = THREE.MathUtils.smoothstep(progress, 0.62 + (i % 4) * 0.03, 0.92 + (i % 4) * 0.02);
          _dummy.position.set(b.x, b.y * getHeightFactor(Math.hypot(b.x, b.z)), b.z);
          _dummy.rotation.set(0, i * 0.7, 0);
          _dummy.scale.setScalar(Math.max(0.001, b.s * t));
          _dummy.updateMatrix();
          blossomTrunks.setMatrixAt(i, _dummy.matrix);
          blossomCrowns.setMatrixAt(i, _dummy.matrix);
        }
        blossomTrunks.instanceMatrix.needsUpdate = true;
        blossomCrowns.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < rockPositions.length; i++) {
          const r = rockPositions[i];
          const t = THREE.MathUtils.smoothstep(progress, 0.3 + (i % 5) * 0.03, 0.65);
          _dummy.position.set(r.x, r.y * getHeightFactor(Math.hypot(r.x, r.z)), r.z);
          _dummy.rotation.set(0.2, r.rot, 0.15);
          _dummy.scale.setScalar(Math.max(0.001, r.s * t));
          _dummy.updateMatrix();
          bouldersMesh.setMatrixAt(i, _dummy.matrix);
        }
        bouldersMesh.instanceMatrix.needsUpdate = true;

        // 5. Sky Aurora, Clouds & Elementalis Channeling Animation
        skyUniforms.uTime.value = elapsed;
        skyUniforms.uDawn.value = terrainT;
        skyUniforms.uFlash.value =
          progress >= 0.72 && progress < 0.84 ? (1 - (progress - 0.72) / 0.12) * 0.35 : 0;
        if (scene.background instanceof THREE.Color) {
          scene.background.copy(skyVoidColor).lerp(skySanctuaryColor, terrainT);
        }
        cloudMat.opacity = forestT * 0.72;
        for (let c = 0; c < clouds.length; c++) {
          clouds[c].rotation.y = elapsed * 0.04;
          clouds[c].position.y = 9.4 + (c % 3) * 1.4 + Math.sin(elapsed * 0.8 + c) * 0.25;
        }

        // Levitating Elementalis, Staff, Mandala Halo & 4 Sculpted Constructs
        const hoverHeight = 0.42 + Math.sin(elapsed * 2.5) * 0.12 + Math.sin(progress * Math.PI) * 0.55;
        heroGroup.position.y = hoverHeight;
        heroGroup.rotation.y = elapsed * 0.28;
        contactShadow.material.opacity = Math.max(0.26, 0.68 - (hoverHeight - 0.35) * 0.45);
        haloGroup.rotation.z = elapsed * 1.1;
        staffRing.rotation.y = elapsed * 3.0;
        staffCrystal.rotation.y = -elapsed * 3.8;

        // Raise arms smoothly during convergence & release outward on Realm Bloom (0.72)
        const armRaise =
          progress < 0.32
            ? THREE.MathUtils.smoothstep(progress, 0.04, 0.3)
            : progress < 0.72
              ? 1.0
              : 1.0 - THREE.MathUtils.smoothstep(progress, 0.72, 0.84) * 0.45;
        leftArmPivot.rotation.set(-0.35 - armRaise * 1.45, 0.2, -0.3 - armRaise * 0.35);
        rightArmPivot.rotation.set(-0.35 - armRaise * 1.45, -0.2, 0.3 + armRaise * 0.35);

        const orbRad = 1.45 + Math.sin(progress * Math.PI) * 1.1;
        for (let i = 0; i < orbMeshes.length; i++) {
          const ang = elapsed * 2.3 + (i * Math.PI) / 2;
          orbMeshes[i].position.set(
            Math.cos(ang) * orbRad,
            Math.sin(elapsed * 3.0 + i) * 0.38,
            Math.sin(ang) * orbRad
          );
          orbMeshes[i].rotation.y = elapsed * 2.2;
          orbMeshes[i].rotation.x = elapsed * 1.5;
          monolithCores[i].rotation.y += dt * 2.0;
        }

        // Primordial Genesis Seed Core + 4 Monolith Lightning Tethers
        const seedScale =
          progress < 0.32
            ? 0.25 + (progress / 0.32) * 1.15
            : progress < 0.72
              ? 1.4 + Math.sin(elapsed * 10) * 0.12
              : Math.max(0.01, 1.4 * (1 - (progress - 0.72) / 0.14));
        genesisSeed.visible = seedScale > 0.04;
        genesisSeed.scale.setScalar(seedScale);
        genesisSeed.position.y = 3.4 + hoverHeight * 0.55;
        genesisSeed.rotation.y += dt * 3.5;

        const showArcs = progress < 0.76;
        _tmpVecA.copy(genesisSeed.position);
        for (let i = 0; i < 4; i++) {
          arcLines[i].visible = showArcs;
          if (showArcs) {
            const src = monolithCorePositions[i];
            const arr = arcBuffers[i];
            for (let s = 0; s < arcSegs; s++) {
              const t = s / (arcSegs - 1);
              const env = Math.sin(t * Math.PI);
              arr[s * 3] = src.x + (_tmpVecA.x - src.x) * t + Math.sin(elapsed * 22 + i * 3 + s * 2.2) * 0.24 * env;
              arr[s * 3 + 1] = src.y + (_tmpVecA.y - src.y) * t + Math.cos(elapsed * 19 + i * 2 + s * 2.5) * 0.26 * env;
              arr[s * 3 + 2] = src.z + (_tmpVecA.z - src.z) * t + Math.sin(elapsed * 17 + i * 4 + s * 2.0) * 0.24 * env;
            }
            arcAttrs[i].needsUpdate = true;
          }
        }

        // Phase II (0.32 wave) & Phase III (0.72 Grand Realm Bloom) VFX & Post-Processing
        let targetBloomStrength = 0.16;
        let targetBloomRadius = 0.24;
        let targetAberration = 0.00065;
        let shockWave = 0;
        let shockRadius = 0;
        let targetSunStreak = 0.02;
        let postFlash = 0;
        let targetFov = 47;
        let targetRoll = 0;

        if (progress < 0.32) {
          const ap = progress / 0.32;
          coreLight.intensity = 4.2 + ap * 3.8;
          targetBloomStrength = 0.155 + ap * 0.045;
          targetBloomRadius = 0.22 + ap * 0.04;
          genesisDome.visible = false;
          genesisPillar.visible = false;
          shockwaveTeal.visible = false;
          shockwaveGold.visible = false;
          dawnRaysGroup.visible = false;
          targetFov = 47 - ap * 2.0;
        } else if (progress < 0.72) {
          const sp = (progress - 0.32) / 0.4;
          const burstT = Math.min(1, sp / 0.35);
          shockwaveTeal.visible = sp < 0.45;
          shockwaveTeal.scale.setScalar(0.8 + burstT * 14.0);
          shockTealMat.opacity = Math.max(0, 0.65 * (1 - sp / 0.45));
          shockwaveGold.visible = false;
          genesisDome.visible = false;
          genesisPillar.visible = false;
          dawnRaysGroup.visible = false;

          shockWave = sp < 0.28 ? (1 - sp / 0.28) * Math.sin(Math.min(1, sp / 0.06) * Math.PI * 0.5) : 0;
          shockRadius = 0.05 + sp * 2.2;
          coreLight.intensity = 7.5 - sp * 1.5;
          targetBloomStrength = 0.195 + Math.sin(sp * Math.PI) * 0.035;
          targetBloomRadius = 0.25 + Math.sin(sp * Math.PI) * 0.03;
          targetAberration = 0.00075 + Math.sin(Math.min(1, sp / 0.35) * Math.PI) * 0.0006;
          targetSunStreak = 0.02 + Math.sin(sp * Math.PI) * 0.015;
          targetFov = 45 + sp * 4.5;
          targetRoll = -0.025 * Math.sin(sp * Math.PI);
        } else {
          // Exact GameEngine Climax at progress = 0.72 (activateElementalisRealm)
          const bp = (progress - 0.72) / 0.28;
          const blastEase = 1 - Math.pow(1 - Math.min(1, bp / 0.55), 3);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(bp, 0.45, 1.0);

          genesisDome.visible = fadeOut > 0.02;
          genesisDome.scale.setScalar(1.2 + blastEase * 16.5);
          genesisDomeUniforms.uTime.value = elapsed;
          genesisDomeUniforms.uAlpha.value = fadeOut * 0.42;

          genesisPillar.visible = fadeOut > 0.02;
          const pSc = bp < 0.22 ? 0.5 + (bp / 0.22) * 1.4 : Math.max(0.2, 1.9 * fadeOut);
          genesisPillar.scale.set(pSc, 1, pSc);
          genesisPillarMat.opacity = bp < 0.22 ? 0.32 : Math.max(0, 0.32 * fadeOut);

          shockwaveTeal.visible = fadeOut > 0.02;
          shockwaveGold.visible = fadeOut > 0.02;
          shockwaveTeal.scale.setScalar(1.0 + blastEase * 18.0);
          shockwaveGold.scale.setScalar(0.7 + blastEase * 13.5);
          shockTealMat.opacity = fadeOut * 0.7;
          shockGoldMat.opacity = fadeOut * 0.65;

          dawnRaysGroup.visible = true;
          dawnRaysGroup.rotation.y += dt * 0.12;
          dawnRayMat.opacity = Math.min(0.18, bp * 0.32) * (1 - THREE.MathUtils.smoothstep(bp, 0.7, 1.0) * 0.35);

          coreLight.intensity = 9.0 * fadeOut + 4.0;
          const climaxEnv = Math.sin(Math.min(1, bp / 0.22) * Math.PI * 0.5) * (1 - THREE.MathUtils.smoothstep(bp, 0.25, 0.95));
          targetBloomStrength = 0.185 + climaxEnv * 0.065;
          targetBloomRadius = 0.24 + climaxEnv * 0.07;
          targetAberration = 0.0007 + climaxEnv * 0.0018;
          shockWave = bp < 0.55 ? Math.max(0, 1 - bp / 0.55) * Math.sin(Math.min(1, bp / 0.07) * Math.PI * 0.5) : 0;
          shockRadius = 0.04 + bp * 1.5;
          targetSunStreak = 0.028 + climaxEnv * 0.048;
          postFlash = bp < 0.12 ? (1 - bp / 0.12) * 0.045 : 0;
          targetFov = bp < 0.2 ? 49.5 + (bp / 0.2) * 4.5 : 54 - ((bp - 0.2) / 0.8) * 5.0;
          targetRoll = bp < 0.35 ? 0.03 * (1 - bp / 0.35) : 0;
        }

        // Orbiting Crystal Blossom Petals
        for (let i = 0; i < petalCount; i++) {
          const ang = (i * Math.PI * 2) / petalCount + elapsed * (0.42 + terrainT * 0.35);
          const rad = 3.2 + (i % 7) * 1.55 + Math.sin(elapsed * 1.4 + i) * 0.4;
          _dummy.position.set(
            Math.cos(ang) * rad,
            0.8 + ((i * 0.65 + elapsed * 0.7) % 5.5),
            Math.sin(ang) * rad
          );
          _dummy.rotation.set(elapsed + i, ang, i * 0.5);
          _dummy.scale.setScalar(0.55 + forestT * 0.55);
          _dummy.updateMatrix();
          petalInstanced.setMatrixAt(i, _dummy.matrix);
        }
        petalInstanced.instanceMatrix.needsUpdate = true;

        // Swirling Fireflies & Blossom Motes
        const mPosAttr = moteGeo.attributes.position as THREE.BufferAttribute;
        const mArr = mPosAttr.array as Float32Array;
        for (let i = 0; i < moteCount; i++) {
          const s = moteSeeds[i];
          mArr[i * 3 + 1] += dt * (0.45 + (i % 3) * 0.22);
          mArr[i * 3] += Math.sin(elapsed * 1.8 + s) * dt * 0.35;
          mArr[i * 3 + 2] += Math.cos(elapsed * 1.6 + s) * dt * 0.35;
          if (mArr[i * 3 + 1] > 7.5) mArr[i * 3 + 1] = 0.2;
        }
        mPosAttr.needsUpdate = true;

        // 6. Smooth 3-Phase Cinematic Camera Choreography
        if (progress < 0.32) {
          const t1 = progress / 0.32;
          const orbitAng = 0.65 + t1 * 0.82;
          _camTarget.set(Math.cos(orbitAng) * 6.4, 2.2 + t1 * 1.9, Math.sin(orbitAng) * 6.4);
          _lookTarget.set(0, 1.55, 0);
        } else if (progress < 0.72) {
          const t2 = (progress - 0.32) / 0.4;
          const orbitAng = 1.47 + t2 * 1.28;
          _camTarget.set(
            Math.cos(orbitAng) * THREE.MathUtils.lerp(6.4, 15.6, t2),
            THREE.MathUtils.lerp(4.1, 9.0, t2),
            Math.sin(orbitAng) * THREE.MathUtils.lerp(6.4, 15.6, t2)
          );
          _lookTarget.set(-1.3 * t2, 1.05, 1.1 * t2);
        } else {
          const t3 = (progress - 0.72) / 0.28;
          const shakeMag = t3 < 0.22 ? (1 - t3 / 0.22) * 0.24 : 0;
          const shakeX = Math.sin(elapsed * 42) * shakeMag;
          const shakeY = Math.cos(elapsed * 38) * shakeMag;
          const orbitAng = 2.75 + t3 * 0.85;
          _camTarget.set(
            Math.cos(orbitAng) * THREE.MathUtils.lerp(15.6, 13.4, t3) + shakeX,
            THREE.MathUtils.lerp(9.0, 7.2, t3) + shakeY,
            Math.sin(orbitAng) * THREE.MathUtils.lerp(15.6, 13.4, t3)
          );
          _lookTarget.set(0, 1.15, 0);
        }

        const dampAlpha = 1 - Math.exp(-5.8 * dt);
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

        if (composer && bloomPass && bokehPass) {
          const postDamp = 1 - Math.exp(-7.5 * dt);
          smoothedBloomStrength += (targetBloomStrength - smoothedBloomStrength) * postDamp;
          smoothedBloomRadius += (targetBloomRadius - smoothedBloomRadius) * postDamp;
          smoothedAberration += (targetAberration - smoothedAberration) * postDamp;
          smoothedSunStreak += (targetSunStreak - smoothedSunStreak) * postDamp;

          const targetVignette = THREE.MathUtils.lerp(0.32, 0.23, forestT);
          smoothedVignette += (targetVignette - smoothedVignette) * postDamp;

          // Subtle depth-of-field tracking live focal distance to Elementalis / sanctuary core
          const targetFocus = camera.position.distanceTo(_currentLook);
          const targetAperture = THREE.MathUtils.lerp(0.00017, 0.00011, THREE.MathUtils.smoothstep(progress, 0.3, 0.85));
          const targetMaxBlur = THREE.MathUtils.lerp(0.0040, 0.0025, THREE.MathUtils.smoothstep(progress, 0.3, 0.85));
          smoothedDofFocus += (targetFocus - smoothedDofFocus) * postDamp;
          smoothedDofAperture += (targetAperture - smoothedDofAperture) * postDamp;
          smoothedDofMaxBlur += (targetMaxBlur - smoothedDofMaxBlur) * postDamp;

          const bokehUniforms = bokehPass.uniforms as Record<string, THREE.IUniform<number>>;
          bokehUniforms.focus.value = smoothedDofFocus;
          bokehUniforms.aperture.value = smoothedDofAperture;
          bokehUniforms.maxblur.value = smoothedDofMaxBlur;

          bloomPass.strength = smoothedBloomStrength;
          bloomPass.radius = smoothedBloomRadius;

          genesisPassUniforms.uAberration.value = smoothedAberration;
          genesisPassUniforms.uShockWave.value = shockWave;
          genesisPassUniforms.uShockRadius.value = shockRadius;
          genesisPassUniforms.uSunStreak.value = smoothedSunStreak;
          genesisPassUniforms.uFlash.value = postFlash;
          genesisPassUniforms.uVignette.value = smoothedVignette;
          genesisPassUniforms.uGradeDawn.value = THREE.MathUtils.smoothstep(progress, 0.25, 0.88);
          genesisPassUniforms.uContrast.value = 1.03 + terrainT * 0.035 - forestT * 0.015;
          genesisPassUniforms.uSaturation.value = 1.03 + forestT * 0.07;

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
        genesisPass?.dispose();
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
      };
    } catch {
      renderer?.dispose();
      onFallbackRef.current?.();
      return undefined;
    }
  }, [totalDuration]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#030e12] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D Elementalis Primordial Genesis"
    >
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Subtle Genesis Bloom Pulse */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-teal-300/10 via-emerald-100/14 to-amber-200/10 transition-opacity duration-150 ${
          bloomFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Cinematic Letterbox Bar (solid dark fill, zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#041014]/94 border-b border-teal-400/50 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-game tracking-[0.24em] uppercase text-teal-300 flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>ELEMENTALIS · PRIMORDIAL GENESIS 3D</span>
          </p>
          <h2 className="font-title text-base sm:text-2xl font-black tracking-wider text-emerald-100 truncate">
            SANCTUARY OF THE FOUR ELEMENTS
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-teal-400/40 bg-teal-950/85 text-xs font-game">
            <span className="text-orange-400">IGNIS</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400">TERRA</span>
            <span className="text-slate-500">·</span>
            <span className="text-sky-400">AQUA</span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-300">VENTUS</span>
          </div>
          <span className="hidden md:inline-block px-2.5 py-1 rounded border border-emerald-400/40 bg-teal-950/85 text-[11px] font-game tracking-wider text-teal-200">
            {PHASE_BADGES[phase]}
          </span>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-[#041014]/94 border-t border-teal-400/50 px-5 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <p className="pointer-events-none text-[11px] sm:text-xs font-game tracking-wider text-emerald-200/90 truncate">
          {PHASE_LABELS[phase]} · {uiProgress}%
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-400/60 hover:border-emerald-300 text-teal-50 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-teal-300" />
        </button>

        {/* Bottom Progress Strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
