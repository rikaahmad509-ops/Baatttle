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

interface FallenAngelAscension3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutsceneAct = 'eclipse' | 'awakening' | 'blink' | 'ascension';

const ACT_META: Record<
  CutsceneAct,
  { badge: string; title: string; subtitle: string }
> = {
  eclipse: {
    badge: 'BABAK I · GERHANA BULAN DARAH',
    title: 'SEGEL SERAPHIM TERBUKA',
    subtitle: '"Di bawah gerhana terlarang, segel enam sayap mulai retak..."'
  },
  awakening: {
    badge: 'BABAK II · ENAM SAYAP OBSIDIAN',
    title: 'KEBANGKITAN SAYAP GERHANA',
    subtitle: '"Rantai surga hancur — enam sayap obsidian terbentang kembali!"'
  },
  blink: {
    badge: 'BABAK III · ABYSSAL BLINK',
    title: 'EMPAT LOMPATAN RUANG',
    subtitle: '"Empat tebasan bayangan menembus dimensi tanpa jejak!"'
  },
  ascension: {
    badge: 'BABAK IV · TRUE FALLEN ANGEL',
    title: 'WUJUD SEJATI TERLEPAS',
    subtitle: '"Mode True Fallen Angel aktif — pertarungan kecepatan penuh dimulai!"'
  }
};

// Zero-GC pre-allocated math helpers
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 1.45, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(3, 1, 10, 0.85)');
    g.addColorStop(0.48, 'rgba(18, 4, 28, 0.45)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const FallenAngelAscension3DCutscene: React.FC<FallenAngelAscension3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 12.0,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [act, setAct] = useState<CutsceneAct>('eclipse');
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
      // Calibrated cinematic exposure so Blood Moon & emissives stay rich without glare
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
      const skyDarkColor = new THREE.Color(0x05010c);
      const skyEclipseColor = new THREE.Color(0x13041e);
      scene.background = skyDarkColor.clone();
      scene.fog = new THREE.FogExp2(0x0b0218, 0.025);

      const camera = new THREE.PerspectiveCamera(
        47,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        160
      );
      camera.position.set(2.2, 0.9, 5.8);
      _currentLook.set(0, 1.45, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.50;
      disposables.push(envRT, roomEnv, pmrem);

      // Calibrated Crimson-Amethyst Eclipse Studio Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xc084fc, 0x1a0418, 0.58);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfde68a, 1.28);
      keyLight.position.set(5.5, 11.0, 6.2);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 1.5;
        keyLight.shadow.camera.far = 42;
        keyLight.shadow.camera.left = -14;
        keyLight.shadow.camera.right = 14;
        keyLight.shadow.camera.top = 14;
        keyLight.shadow.camera.bottom = -14;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const bloodMoonRimLight = new THREE.PointLight(0xe11d48, 10.5, 42, 1.4);
      bloodMoonRimLight.position.set(0, 4.4, -6.0);
      scene.add(bloodMoonRimLight);

      const seraphCoreLight = new THREE.PointLight(0xd946ef, 4.8, 24, 1.45);
      seraphCoreLight.position.set(0, 1.9, 1.2);
      scene.add(seraphCoreLight);

      const groundGlowLight = new THREE.PointLight(0xfb7185, 3.2, 18, 1.5);
      groundGlowLight.position.set(0, 0.6, 0.5);
      scene.add(groundGlowLight);

      // =========================================================================
      // 1. ANIMATED GLSL BLOOD-MOON CATHEDRAL SKY DOME
      // =========================================================================
      const skyUniforms = {
        uTime: { value: 0 },
        uEclipse: { value: 0 },
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
            uniform float uEclipse;
            uniform float uFlash;
            varying vec3 vWorldPos;

            float eHash(vec2 p) {
              p = fract(p * vec2(127.1, 311.7));
              p += dot(p, p + 41.3);
              return fract(p.x * p.y);
            }
            float eNoise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(eHash(i), eHash(i + vec2(1.0, 0.0)), f.x),
                mix(eHash(i + vec2(0.0, 1.0)), eHash(i + vec2(1.0, 1.0)), f.x),
                f.y
              );
            }
            float fbm(vec2 p) {
              float v = 0.0;
              float a = 0.5;
              for (int i = 0; i < 4; i++) {
                v += a * eNoise(p);
                p *= 2.04;
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldPos);
              float elev = clamp(dir.y, -0.15, 1.0);

              vec3 zenithCol = mix(vec3(0.015, 0.005, 0.032), vec3(0.035, 0.006, 0.068), uEclipse);
              vec3 horizonCol = mix(vec3(0.08, 0.015, 0.14), vec3(0.32, 0.045, 0.16), uEclipse);
              vec3 col = mix(horizonCol, zenithCol, smoothstep(-0.04, 0.58, elev));

              // Starfield
              float starCell = eHash(floor(dir.xz * 125.0 + dir.y * 90.0));
              float stars = smoothstep(0.992, 0.999, starCell) * smoothstep(0.14, 0.72, elev);
              col += vec3(0.95, 0.75, 1.0) * stars * (0.45 + 0.35 * sin(uTime * 2.4 + starCell * 35.0));

              // Crimson-amethyst eclipse cloud vortex
              float ang = atan(dir.x, -dir.z);
              float cloud = fbm(vec2(ang * 2.2 + uTime * 0.05, elev * 4.5 - uTime * 0.03));
              float veil = smoothstep(0.42, 0.86, cloud) * smoothstep(0.0, 0.42, elev) * (1.0 - smoothstep(0.45, 0.92, elev));
              vec3 veilTint = mix(vec3(0.48, 0.10, 0.58), vec3(0.85, 0.14, 0.30), smoothstep(0.3, 0.8, cloud));
              col += veilTint * veil * (0.28 + 0.45 * uEclipse);

              // Subtle Blood Moon radial backlight around -Z horizon
              vec3 moonDir = normalize(vec3(0.0, 0.36, -0.93));
              float moonAlign = max(0.0, dot(dir, moonDir));
              col += vec3(0.75, 0.12, 0.28) * pow(moonAlign, 7.0) * (0.35 + 0.35 * uEclipse);

              col += vec3(0.72, 0.35, 0.92) * uFlash * 0.42;
              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      scene.add(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(78, 36, 24)), skyMat));

      // =========================================================================
      // 2. PROCEDURAL CATHEDRAL FLOOR SEAL & GLSL FRACTURE / RUNE CIRCUIT GROUND
      // =========================================================================
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = 768;
      floorCanvas.height = 768;
      const fctx = floorCanvas.getContext('2d');
      if (fctx) {
        fctx.fillStyle = '#06010f';
        fctx.fillRect(0, 0, 768, 768);

        const rg = fctx.createRadialGradient(384, 384, 18, 384, 384, 372);
        rg.addColorStop(0, 'rgba(232, 121, 249, 0.78)');
        rg.addColorStop(0.26, 'rgba(190, 18, 60, 0.50)');
        rg.addColorStop(0.58, 'rgba(88, 28, 135, 0.24)');
        rg.addColorStop(1, 'rgba(6, 1, 15, 0)');
        fctx.fillStyle = rg;
        fctx.fillRect(0, 0, 768, 768);

        const radii = [98, 178, 258, 336];
        for (let i = 0; i < radii.length; i++) {
          fctx.strokeStyle = i % 2 === 0 ? 'rgba(244, 114, 182, 0.85)' : 'rgba(251, 191, 36, 0.72)';
          fctx.lineWidth = i === 2 ? 3.5 : 2.2;
          fctx.beginPath();
          fctx.arc(384, 384, radii[i], 0, Math.PI * 2);
          fctx.stroke();
        }

        for (let s = 0; s < 12; s++) {
          const a = (s * Math.PI * 2) / 12;
          fctx.strokeStyle = s % 2 === 0 ? 'rgba(232, 121, 249, 0.72)' : 'rgba(251, 113, 133, 0.55)';
          fctx.lineWidth = s % 2 === 0 ? 2.6 : 1.5;
          fctx.beginPath();
          fctx.moveTo(384 + Math.cos(a) * 65, 384 + Math.sin(a) * 65);
          fctx.lineTo(384 + Math.cos(a) * 336, 384 + Math.sin(a) * 336);
          fctx.stroke();

          const gx = 384 + Math.cos(a) * 218;
          const gy = 384 + Math.sin(a) * 218;
          fctx.fillStyle = s % 3 === 0 ? '#fda4af' : '#f0abfc';
          fctx.beginPath();
          fctx.moveTo(gx, gy - 9);
          fctx.lineTo(gx + 6, gy);
          fctx.lineTo(gx, gy + 9);
          fctx.lineTo(gx - 6, gy);
          fctx.closePath();
          fctx.fill();
        }

        fctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
        fctx.lineWidth = 2.4;
        for (let k = 0; k < 6; k++) {
          const ang = (k * Math.PI * 2) / 6;
          fctx.beginPath();
          fctx.arc(
            384 + Math.cos(ang) * 145,
            384 + Math.sin(ang) * 145,
            34,
            ang - 1.1,
            ang + 1.1
          );
          fctx.stroke();
        }
      }
      const floorTex = new THREE.CanvasTexture(floorCanvas);
      floorTex.colorSpace = THREE.SRGBColorSpace;
      floorTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const contactShadowTex = createContactShadowTexture();
      disposables.push(floorTex, contactShadowTex);

      // Shared PBR Materials
      const obsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0b0614,
          roughness: 0.72,
          metalness: 0.28
        })
      );
      const seraphArmorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x1e1035,
          emissive: 0x2e1065,
          emissiveIntensity: 0.34,
          roughness: 0.24,
          metalness: 0.85
        })
      );
      const crimsonSilkMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x4c0519,
          emissive: 0x881337,
          emissiveIntensity: 0.30,
          roughness: 0.66,
          metalness: 0.16,
          side: THREE.DoubleSide
        })
      );
      const fallenGoldMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0x78350f,
          emissiveIntensity: 0.32,
          roughness: 0.18,
          metalness: 0.92
        })
      );
      const abyssMagentaMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xe879f9,
          emissive: 0xc026d3,
          emissiveIntensity: 1.35,
          roughness: 0.16,
          metalness: 0.22
        })
      );
      const crimsonFlameMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfb7185,
          emissive: 0xe11d48,
          emissiveIntensity: 1.42,
          roughness: 0.16,
          metalness: 0.22
        })
      );
      const wingObsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0f071c,
          emissive: 0x3b0764,
          emissiveIntensity: 0.40,
          roughness: 0.52,
          metalness: 0.34
        })
      );
      const shadowMoonMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x07010c,
          roughness: 0.90,
          metalness: 0.08
        })
      );

      // Cathedral Flagstone Floor with GLSL Abyssal Rift Pulse
      const floorUniforms = {
        uTime: { value: 0 },
        uPulse: { value: 0 }
      };
      const floorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x070210,
          roughness: 0.82,
          metalness: 0.22
        })
      );
      floorMat.customProgramCacheKey = () => 'fallen-angel-cathedral-floor-v1';
      floorMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = floorUniforms.uTime;
        shader.uniforms.uPulse = floorUniforms.uPulse;
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
            varying vec3 vFloorPos;`
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            vFloorPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
            uniform float uTime;
            uniform float uPulse;
            varying vec3 vFloorPos;`
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            vec2 fTile = fract(vFloorPos.xz * 0.65);
            float fEdge = min(min(fTile.x, 1.0 - fTile.x), min(fTile.y, 1.0 - fTile.y));
            float fGrout = 1.0 - smoothstep(0.015, 0.048, fEdge);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.008, 0.055), fGrout * 0.7);`
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            float r = length(vFloorPos.xz);
            float ringWave = exp(-pow(abs(sin(r * 0.75 - uTime * 1.4)), 4.0) * 6.0) * smoothstep(2.0, 14.0, r);
            totalEmissiveRadiance += vec3(0.68, 0.14, 0.58) * ringWave * (0.14 + uPulse * 0.45);`
          );
      };
      const floorGround = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(32, 48)), floorMat);
      floorGround.rotation.x = -Math.PI / 2;
      floorGround.position.y = -0.18;
      floorGround.receiveShadow = !isSoftwareGl;
      scene.add(floorGround);

      const sealMat = trackMat(
        new THREE.MeshBasicMaterial({
          map: floorTex,
          transparent: true,
          opacity: 0.86,
          depthWrite: false
        })
      );
      const sealMesh = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(5.8, 48)), sealMat);
      sealMesh.rotation.x = -Math.PI / 2;
      sealMesh.position.y = 0.01;
      scene.add(sealMesh);

      const contactShadow = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(2.4, 2.4)),
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
      contactShadow.position.y = 0.215;
      scene.add(contactShadow);

      // Raised Stepped Obsidian Altar Dais
      const altarBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(1.62, 1.98, 0.22, 10)),
        obsidianMat
      );
      altarBase.position.y = 0.09;
      altarBase.receiveShadow = !isSoftwareGl;
      const altarTrim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.64, 0.04, 8, 48)),
        crimsonFlameMat
      );
      altarTrim.rotation.x = Math.PI / 2;
      altarTrim.position.y = 0.20;
      const altarOuterSeal = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(2.15, 0.025, 8, 56)),
        fallenGoldMat
      );
      altarOuterSeal.rotation.x = Math.PI / 2;
      altarOuterSeal.position.y = 0.03;
      scene.add(altarBase, altarTrim, altarOuterSeal);

      // 6 Sculpted Gothic Cathedral Obsidian Pillars + Floating Capitals & Crown Shards
      const pillarPlinthGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.42, 0.95));
      const pillarShaftGeo = trackGeo(new THREE.BoxGeometry(0.62, 4.3, 0.62));
      const pillarRuneGeo = trackGeo(new THREE.BoxGeometry(0.13, 3.4, 0.66));
      const pillarCapGeo = trackGeo(new THREE.ConeGeometry(0.48, 0.85, 4));
      const pillars: { group: THREE.Group; cap: THREE.Mesh; baseCapY: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6 + 0.34;
        const rad = 6.4 + (i % 2) * 0.75;
        const pg = new THREE.Group();
        pg.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
        pg.lookAt(0, 0, 0);

        const plinth = new THREE.Mesh(pillarPlinthGeo, seraphArmorMat);
        plinth.position.y = 0.03;
        const shaft = new THREE.Mesh(pillarShaftGeo, obsidianMat);
        shaft.position.y = 2.15;
        shaft.castShadow = !isSoftwareGl;
        shaft.receiveShadow = !isSoftwareGl;
        const rune = new THREE.Mesh(pillarRuneGeo, i % 2 === 0 ? abyssMagentaMat : crimsonFlameMat);
        rune.position.y = 2.22;
        const cap = new THREE.Mesh(pillarCapGeo, fallenGoldMat);
        const baseCapY = 4.85 + (i % 3) * 0.28;
        cap.position.y = baseCapY;
        pg.add(plinth, shaft, rune, cap);
        scene.add(pg);
        pillars.push({ group: pg, cap, baseCapY });
      }

      // =========================================================================
      // 3. GLSL BLOOD MOON ECLIPSE CORONA & ASTROLABE SEALS
      // =========================================================================
      const eclipseGroup = new THREE.Group();
      eclipseGroup.position.set(0, 4.05, -6.8);
      scene.add(eclipseGroup);

      const moonCore = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(1.86, 36, 36)),
        shadowMoonMat
      );
      const eclipseRim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.91, 0.085, 12, 72)),
        crimsonFlameMat
      );

      const coronaUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 0.75 }
      };
      const coronaMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: coronaUniforms,
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
            uniform float uIntensity;
            varying vec2 vUv;

            void main() {
              vec2 p = (vUv - 0.5) * 2.0;
              float r = length(p);
              if (r < 0.44 || r > 1.0) discard;

              float ang = atan(p.y, p.x);
              float rays = sin(ang * 14.0 + uTime * 1.4) * 0.5 + 0.5;
              float fine = sin(ang * 28.0 - uTime * 2.3) * 0.5 + 0.5;
              float distFromMoon = clamp((r - 0.44) / 0.56, 0.0, 1.0);

              float ring = exp(-distFromMoon * 4.2) * (0.65 + 0.35 * rays) + exp(-distFromMoon * 8.5) * fine * 0.45;
              vec3 cInner = vec3(0.96, 0.24, 0.42);
              vec3 cOuter = vec3(0.75, 0.38, 0.96);
              vec3 col = mix(cInner, cOuter, smoothstep(0.0, 0.6, distFromMoon));

              float alpha = ring * (1.0 - smoothstep(0.76, 1.0, r)) * uIntensity;
              gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
            }
          `
        })
      );
      const coronaDisc = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(8.2, 8.2)), coronaMat);
      coronaDisc.position.z = -0.14;

      const moonRingA = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(2.72, 0.052, 10, 72)),
        fallenGoldMat
      );
      moonRingA.rotation.set(0.42, 0.35, 0);
      const moonRingB = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.38, 0.045, 10, 72)),
        abyssMagentaMat
      );
      moonRingB.rotation.set(-0.62, -0.45, 0.2);
      eclipseGroup.add(moonCore, eclipseRim, coronaDisc, moonRingA, moonRingB);

      // =========================================================================
      // 4. COMPOSITE 3D HERO — FALLEN ANGEL (WITH 18-FEATHER 6-WING SERAPH RIG)
      // =========================================================================
      const heroGroup = new THREE.Group();
      heroGroup.position.set(0, 0.2, 0);
      scene.add(heroGroup);

      // Armored Greaves & Knee Sabatons
      const legGeo = trackGeo(new THREE.CylinderGeometry(0.115, 0.092, 0.84, 8));
      const kneeGeo = trackGeo(new THREE.OctahedronGeometry(0.118, 0));
      const legL = new THREE.Mesh(legGeo, seraphArmorMat);
      legL.position.set(-0.19, 0.42, 0);
      legL.castShadow = !isSoftwareGl;
      const kneeL = new THREE.Mesh(kneeGeo, fallenGoldMat);
      kneeL.position.set(-0.19, 0.56, 0.1);
      const legR = new THREE.Mesh(legGeo, seraphArmorMat);
      legR.position.set(0.19, 0.42, 0);
      legR.castShadow = !isSoftwareGl;
      const kneeR = new THREE.Mesh(kneeGeo, fallenGoldMat);
      kneeR.position.set(0.19, 0.56, 0.1);
      heroGroup.add(legL, kneeL, legR, kneeR);

      // Sculpted Upper Body, Eclipse Crest & Tattered Dual-Tail Cloak
      const waist = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.2, 0.26, 8)), obsidianMat);
      waist.position.y = 0.92;
      const chest = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.36, 0.24, 0.78, 8)), seraphArmorMat);
      chest.position.y = 1.42;
      chest.castShadow = !isSoftwareGl;
      const chestCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), crimsonFlameMat);
      chestCore.position.set(0, 1.48, 0.31);
      const chestRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.2, 0.025, 8, 24)), fallenGoldMat);
      chestRing.position.set(0, 1.48, 0.29);
      heroGroup.add(waist, chest, chestCore, chestRing);

      const cloakShape = new THREE.Shape();
      cloakShape.moveTo(-0.40, 0);
      cloakShape.lineTo(0.40, 0);
      cloakShape.lineTo(0.92, -1.62);
      cloakShape.lineTo(0.28, -1.26);
      cloakShape.lineTo(0, -1.72);
      cloakShape.lineTo(-0.28, -1.26);
      cloakShape.lineTo(-0.92, -1.62);
      cloakShape.closePath();
      const cloakMesh = new THREE.Mesh(
        trackGeo(new THREE.ExtrudeGeometry(cloakShape, { depth: 0.035, bevelEnabled: false })),
        crimsonSilkMat
      );
      cloakMesh.position.set(0, 1.76, -0.24);
      cloakMesh.rotation.x = 0.24;
      heroGroup.add(cloakMesh);

      // Winged Shoulder Pauldrons
      const pauldronGeo = trackGeo(new THREE.DodecahedronGeometry(0.2, 0));
      const spikeGeo = trackGeo(new THREE.ConeGeometry(0.065, 0.40, 6));
      const pauldronL = new THREE.Group();
      pauldronL.position.set(-0.44, 1.72, 0);
      const pMeshL = new THREE.Mesh(pauldronGeo, seraphArmorMat);
      pMeshL.scale.set(1.15, 0.76, 1.0);
      const pSpikeL = new THREE.Mesh(spikeGeo, fallenGoldMat);
      pSpikeL.position.set(-0.16, 0.22, 0);
      pSpikeL.rotation.z = 0.62;
      pauldronL.add(pMeshL, pSpikeL);

      const pauldronR = new THREE.Group();
      pauldronR.position.set(0.44, 1.72, 0);
      const pMeshR = new THREE.Mesh(pauldronGeo, seraphArmorMat);
      pMeshR.scale.set(1.15, 0.76, 1.0);
      const pSpikeR = new THREE.Mesh(spikeGeo, fallenGoldMat);
      pSpikeR.position.set(0.16, 0.22, 0);
      pSpikeR.rotation.z = -0.62;
      pauldronR.add(pMeshR, pSpikeR);
      heroGroup.add(pauldronL, pauldronR);

      // Seraphic Head, Blindfold/Visor & Fallen Crown
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.02, 0.04);
      const helmMesh = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.21, 0)), seraphArmorMat);
      const visorMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.055, 0.14)), crimsonFlameMat);
      visorMesh.position.set(0, 0.02, 0.15);
      const crownGeo = trackGeo(new THREE.ConeGeometry(0.05, 0.44, 5));
      const crownL = new THREE.Mesh(crownGeo, fallenGoldMat);
      crownL.position.set(-0.16, 0.22, -0.02);
      crownL.rotation.set(-0.16, 0, 0.44);
      const crownR = new THREE.Mesh(crownGeo, fallenGoldMat);
      crownR.position.set(0.16, 0.22, -0.02);
      crownR.rotation.set(-0.16, 0, -0.44);
      headGroup.add(helmMesh, visorMesh, crownL, crownR);
      heroGroup.add(headGroup);

      // Fractured Fallen Halo
      const fallenHaloGroup = new THREE.Group();
      fallenHaloGroup.position.set(0, 2.16, -0.34);
      const haloArcA = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.78, 0.032, 8, 42, Math.PI * 1.45)),
        fallenGoldMat
      );
      haloArcA.rotation.z = 0.42;
      const haloArcB = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.60, 0.024, 8, 32, Math.PI * 1.2)),
        abyssMagentaMat
      );
      haloArcB.rotation.z = -1.1;
      fallenHaloGroup.add(haloArcA, haloArcB);
      const haloShardGeo = trackGeo(new THREE.OctahedronGeometry(0.068, 0));
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const hs = new THREE.Mesh(haloShardGeo, i % 2 === 0 ? crimsonFlameMat : abyssMagentaMat);
        hs.position.set(Math.cos(a) * 0.96, Math.sin(a) * 0.96, 0);
        fallenHaloGroup.add(hs);
      }
      heroGroup.add(fallenHaloGroup);

      // Articulated Arms + Twin Beveled Abyssal Blink Daggers
      const armGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.065, 0.68, 8));
      const guardGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.045, 0.07));
      const daggerShape = new THREE.Shape();
      daggerShape.moveTo(-0.045, 0);
      daggerShape.lineTo(0.045, 0);
      daggerShape.lineTo(0.075, 0.74);
      daggerShape.lineTo(0, 1.08);
      daggerShape.lineTo(-0.075, 0.74);
      daggerShape.closePath();
      const daggerBladeGeo = trackGeo(
        new THREE.ExtrudeGeometry(daggerShape, {
          depth: 0.025,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.008
        })
      );

      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.42, 1.66, 0.05);
      const leftArmMesh = new THREE.Mesh(armGeo, seraphArmorMat);
      leftArmMesh.position.y = -0.32;
      const leftDagger = new THREE.Group();
      leftDagger.position.set(0, -0.68, 0.05);
      leftDagger.rotation.x = Math.PI * 0.52;
      leftDagger.add(new THREE.Mesh(guardGeo, fallenGoldMat));
      leftDagger.add(new THREE.Mesh(daggerBladeGeo, abyssMagentaMat));
      leftDagger.visible = false;
      leftArmPivot.add(leftArmMesh, leftDagger);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.42, 1.66, 0.05);
      const rightArmMesh = new THREE.Mesh(armGeo, seraphArmorMat);
      rightArmMesh.position.y = -0.32;
      const rightDagger = new THREE.Group();
      rightDagger.position.set(0, -0.68, 0.05);
      rightDagger.rotation.x = Math.PI * 0.52;
      rightDagger.add(new THREE.Mesh(guardGeo, fallenGoldMat));
      rightDagger.add(new THREE.Mesh(daggerBladeGeo, crimsonFlameMat));
      rightDagger.visible = false;
      rightArmPivot.add(rightArmMesh, rightDagger);
      heroGroup.add(leftArmPivot, rightArmPivot);

      // SIX MULTI-FEATHERED ARTICULATED OBSIDIAN SERAPH WINGS (3 Left + 3 Right)
      const wingRoot = new THREE.Group();
      wingRoot.position.set(0, 1.58, -0.28);
      heroGroup.add(wingRoot);

      const primaryPlumeShape = new THREE.Shape();
      primaryPlumeShape.moveTo(0, 0);
      primaryPlumeShape.lineTo(1.80, 0.46);
      primaryPlumeShape.lineTo(2.24, 0.17);
      primaryPlumeShape.lineTo(1.56, -0.18);
      primaryPlumeShape.lineTo(0, -0.14);
      primaryPlumeShape.closePath();
      const primaryPlumeGeo = trackGeo(
        new THREE.ExtrudeGeometry(primaryPlumeShape, {
          depth: 0.032,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.008
        })
      );

      const trimPlumeShape = new THREE.Shape();
      trimPlumeShape.moveTo(0.15, -0.02);
      trimPlumeShape.lineTo(1.62, 0.28);
      trimPlumeShape.lineTo(1.94, 0.11);
      trimPlumeShape.lineTo(1.36, -0.10);
      trimPlumeShape.closePath();
      const trimPlumeGeo = trackGeo(
        new THREE.ExtrudeGeometry(trimPlumeShape, { depth: 0.038, bevelEnabled: false })
      );

      const leftWings: THREE.Group[] = [];
      const rightWings: THREE.Group[] = [];
      for (let w = 0; w < 3; w++) {
        const wingScale = 1.08 - w * 0.16;
        const yOff = 0.25 - w * 0.24;

        const rGroup = new THREE.Group();
        rGroup.position.set(0.15, yOff, -w * 0.07);
        rGroup.scale.setScalar(wingScale);
        const rBase = new THREE.Mesh(primaryPlumeGeo, wingObsidianMat);
        const rSubFeather = new THREE.Mesh(primaryPlumeGeo, wingObsidianMat);
        rSubFeather.scale.set(0.76, 0.72, 0.9);
        rSubFeather.position.set(0.12, -0.14, -0.02);
        rSubFeather.rotation.z = -0.22;
        const rTrim = new THREE.Mesh(trimPlumeGeo, w === 1 ? crimsonFlameMat : abyssMagentaMat);
        rTrim.position.z = 0.015;
        rGroup.add(rBase, rSubFeather, rTrim);
        wingRoot.add(rGroup);
        rightWings.push(rGroup);

        const lGroup = new THREE.Group();
        lGroup.position.set(-0.15, yOff, -w * 0.07);
        lGroup.scale.set(-wingScale, wingScale, wingScale);
        const lBase = new THREE.Mesh(primaryPlumeGeo, wingObsidianMat);
        const lSubFeather = new THREE.Mesh(primaryPlumeGeo, wingObsidianMat);
        lSubFeather.scale.set(0.76, 0.72, 0.9);
        lSubFeather.position.set(0.12, -0.14, -0.02);
        lSubFeather.rotation.z = -0.22;
        const lTrim = new THREE.Mesh(trimPlumeGeo, w === 1 ? crimsonFlameMat : abyssMagentaMat);
        lTrim.position.z = 0.015;
        lGroup.add(lBase, lSubFeather, lTrim);
        wingRoot.add(lGroup);
        leftWings.push(lGroup);
      }

      // =========================================================================
      // 5. ACT I->II BREAKABLE BINDING CHAINS & FLYING SHARDS
      // =========================================================================
      const chainsGroup = new THREE.Group();
      chainsGroup.position.set(0, 1.38, 0);
      scene.add(chainsGroup);
      const chainGeo = trackGeo(new THREE.TorusGeometry(1.08, 0.036, 8, 42));
      const chainRings: THREE.Mesh[] = [];
      const chainTilts = [
        [0.45, 0.2, 0.3],
        [-0.5, 0.65, -0.25],
        [0.82, -0.4, 0.55]
      ];
      for (let i = 0; i < 3; i++) {
        const cr = new THREE.Mesh(chainGeo, i === 1 ? crimsonFlameMat : abyssMagentaMat);
        cr.rotation.set(chainTilts[i][0], chainTilts[i][1], chainTilts[i][2]);
        chainsGroup.add(cr);
        chainRings.push(cr);
      }

      // 4 Curved Binding Tethers anchoring Hero to outer seal
      const tetherGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 1, 6));
      const chainTethers: THREE.Mesh[] = [];
      const tetherTargets = [
        new THREE.Vector3(-3.2, 0.1, 2.8),
        new THREE.Vector3(3.2, 0.1, 2.8),
        new THREE.Vector3(-3.2, 0.1, -2.8),
        new THREE.Vector3(3.2, 0.1, -2.8)
      ];
      for (let i = 0; i < 4; i++) {
        const tm = new THREE.Mesh(tetherGeo, fallenGoldMat);
        _vA.set(0, 1.25, 0);
        _vB.copy(tetherTargets[i]);
        const d = _vA.distanceTo(_vB);
        tm.position.copy(_vA).lerp(_vB, 0.5);
        tm.scale.set(1, d, 1);
        tm.lookAt(_vB);
        tm.rotateX(Math.PI / 2);
        scene.add(tm);
        chainTethers.push(tm);
      }

      // =========================================================================
      // 6. ACT III ABYSSAL BLINK ANCHORS, GLSL SLASH RIBS & AFTERIMAGES
      // =========================================================================
      const blinkAnchors: THREE.Vector3[] = [
        new THREE.Vector3(0, 0.2, 0),
        new THREE.Vector3(-3.2, 0.35, 1.45),
        new THREE.Vector3(3.25, 0.45, 0.85),
        new THREE.Vector3(-2.4, 0.38, -2.05),
        new THREE.Vector3(0, 0.2, 0.15)
      ];

      const warpGateRings: THREE.Mesh[] = [];
      const warpGateGeo = trackGeo(new THREE.TorusGeometry(0.62, 0.045, 8, 36));
      for (let i = 1; i <= 4; i++) {
        const wg = new THREE.Mesh(warpGateGeo, i % 2 === 0 ? crimsonFlameMat : abyssMagentaMat);
        wg.position.copy(blinkAnchors[i]).add(new THREE.Vector3(0, 0.14, 0));
        wg.rotation.x = Math.PI / 2;
        wg.visible = false;
        scene.add(wg);
        warpGateRings.push(wg);
      }

      const beamGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 1, 8));
      const slashArcGeo = trackGeo(new THREE.TorusGeometry(0.95, 0.04, 6, 28, Math.PI * 1.1));
      const warpBeams: THREE.Mesh[] = [];
      const slashArcs: THREE.Mesh[] = [];
      const phantomAfterimages: THREE.Group[] = [];
      const phantomBodyGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.16, 1.38, 8));
      const phantomWingGeo = trackGeo(new THREE.BoxGeometry(1.85, 0.24, 0.04));
      const phantomMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0.44,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );

      for (let i = 0; i < 4; i++) {
        const beam = new THREE.Mesh(beamGeo, i % 2 === 0 ? abyssMagentaMat : crimsonFlameMat);
        const start = blinkAnchors[i];
        const end = blinkAnchors[i + 1];
        _vA.copy(start).add(_vB.set(0, 1.15, 0));
        _vB.copy(end).add(new THREE.Vector3(0, 1.15, 0));
        const dist = _vA.distanceTo(_vB);
        beam.position.copy(_vA).lerp(_vB, 0.5);
        beam.scale.set(1, dist, 1);
        beam.lookAt(_vB);
        beam.rotateX(Math.PI / 2);
        beam.visible = false;
        scene.add(beam);
        warpBeams.push(beam);

        const sArc = new THREE.Mesh(slashArcGeo, i % 2 === 0 ? crimsonFlameMat : abyssMagentaMat);
        sArc.position.copy(end).add(new THREE.Vector3(0, 1.15, 0));
        sArc.rotation.set(0.55, i * 1.2, 0.45);
        sArc.visible = false;
        scene.add(sArc);
        slashArcs.push(sArc);

        const ghost = new THREE.Group();
        ghost.position.copy(blinkAnchors[i]);
        const gb = new THREE.Mesh(phantomBodyGeo, phantomMat);
        gb.position.y = 1.05;
        const gwA = new THREE.Mesh(phantomWingGeo, phantomMat);
        gwA.position.set(0, 1.48, -0.18);
        gwA.rotation.z = 0.24;
        const gwB = new THREE.Mesh(phantomWingGeo, phantomMat);
        gwB.position.set(0, 1.28, -0.22);
        gwB.rotation.z = -0.24;
        ghost.add(gb, gwA, gwB);
        ghost.visible = false;
        scene.add(ghost);
        phantomAfterimages.push(ghost);
      }

      // =========================================================================
      // 7. ACT IV APOTHEOSIS CLIMAX: FRESNEL ECLIPSE DOME, PILLAR & SHOCKWAVES
      // =========================================================================
      const eclipseDomeUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const eclipseDomeMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: eclipseDomeUniforms,
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
              float fres = pow(1.0 - abs(vNormalDir.z), 2.2);
              float wave = sin(vLocalPos.y * 16.0 - uTime * 10.0) * 0.5 + 0.5;
              vec3 col = mix(vec3(0.75, 0.18, 0.92), vec3(0.96, 0.24, 0.44), wave);
              float alpha = clamp((fres * 0.78 + 0.16) * uAlpha, 0.0, 0.42);
              gl_FragColor = vec4(col, alpha);
            }
          `
        })
      );
      const eclipseDome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.56)),
        eclipseDomeMat
      );
      eclipseDome.position.set(0, 0.2, 0.15);
      eclipseDome.visible = false;
      scene.add(eclipseDome);

      const pillarMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xc026d3,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const eclipsePillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(1.05, 1.85, 20, 28, 1, true)),
        pillarMat
      );
      eclipsePillar.position.set(0, 10.0, 0.15);
      eclipsePillar.visible = false;
      scene.add(eclipsePillar);

      const shockVioletMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveViolet = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.075, 10, 64)),
        shockVioletMat
      );
      shockwaveViolet.rotation.x = Math.PI / 2;
      shockwaveViolet.position.set(0, 0.22, 0.15);
      shockwaveViolet.visible = false;
      scene.add(shockwaveViolet);

      const shockCrimsonMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfb7185,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveCrimson = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.055, 10, 64)),
        shockCrimsonMat
      );
      shockwaveCrimson.rotation.x = Math.PI / 2;
      shockwaveCrimson.position.set(0, 0.34, 0.15);
      shockwaveCrimson.visible = false;
      scene.add(shockwaveCrimson);

      // 160 Instanced Obsidian & Amethyst Feathers
      const featherCount = 160;
      const featherGeo = trackGeo(new THREE.ConeGeometry(0.08, 0.44, 4));
      const featherMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x9333ea,
          emissiveIntensity: 0.92,
          roughness: 0.25,
          metalness: 0.35
        })
      );
      const featherInstanced = new THREE.InstancedMesh(featherGeo, featherMat, featherCount);
      featherInstanced.frustumCulled = false;
      scene.add(featherInstanced);

      const fAngles: number[] = [];
      const fRadii: number[] = [];
      const fHeights: number[] = [];
      const fDirs: THREE.Vector3[] = [];
      for (let i = 0; i < featherCount; i++) {
        const a = (i * Math.PI * 2) / featherCount;
        const r = 1.4 + (i % 9) * 0.58;
        fAngles.push(a);
        fRadii.push(r);
        fHeights.push(0.4 + (i % 11) * 0.48);
        fDirs.push(
          new THREE.Vector3(
            Math.cos(a * 1.7),
            0.32 + (i % 7) * 0.14,
            Math.sin(a * 1.7)
          ).normalize()
        );
        _tmpColor.setHex(i % 4 === 0 ? 0xfb7185 : i % 3 === 0 ? 0xfbbf24 : 0xc084fc);
        featherInstanced.setColorAt(i, _tmpColor);
      }
      if (featherInstanced.instanceColor) featherInstanced.instanceColor.needsUpdate = true;

      // Floating Shadow Ember Dust
      const dustCount = 240;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.1 + Math.random() * 10.5;
        dustPos[i * 3] = Math.cos(a) * r;
        dustPos[i * 3 + 1] = 0.2 + Math.random() * 6.8;
        dustPos[i * 3 + 2] = Math.sin(a) * r;
      }
      const dustGeo = trackGeo(new THREE.BufferGeometry());
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustMat = trackMat(
        new THREE.PointsMaterial({
          color: 0xf0abfc,
          size: 0.09,
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      scene.add(dustPoints);

      // =========================================================================
      // 8. GPU POST-PROCESSING (Subtle Bokeh DOF + Calibrated Bloom + Split-Tone Grade)
      // =========================================================================
      let composer: EffectComposer | null = null;
      let renderPass: RenderPass | null = null;
      let bokehPass: BokehPass | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let eclipsePass: ShaderPass | null = null;
      let outputPass: OutputPass | null = null;

      const eclipsePassUniforms = {
        tDiffuse: { value: null },
        uAberration: { value: 0.0007 },
        uShockWave: { value: 0 },
        uShockRadius: { value: 0 },
        uFlash: { value: 0 },
        uVignette: { value: 0.30 },
        uContrast: { value: 1.05 },
        uSaturation: { value: 1.06 },
        uEclipseGrade: { value: 0.0 }
      };

      const depthHiddenObjects: THREE.Object3D[] = [
        coronaDisc,
        eclipseDome,
        eclipsePillar,
        shockwaveViolet,
        shockwaveCrimson,
        dustPoints,
        ...phantomAfterimages
      ];
      const depthHiddenPrev: boolean[] = new Array(depthHiddenObjects.length).fill(false);

      if (!isSoftwareGl) {
        const initW = window.innerWidth;
        const initH = Math.max(1, window.innerHeight);
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);

        bokehPass = new BokehPass(scene, camera, {
          focus: 6.2,
          aperture: 0.00017,
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

        bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.17, 0.25, 1.12);
        eclipsePass = new ShaderPass({
          uniforms: eclipsePassUniforms,
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
            uniform float uEclipseGrade;
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

              col += vec3(0.88, 0.36, 0.92) * ringBand * 0.13;
              col += vec3(0.85, 0.52, 0.96) * uFlash;

              // Split-tone Blood-Moon Eclipse color grading (amethyst shadows + rose-gold highlights)
              float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
              float shadowW = 1.0 - smoothstep(0.04, 0.34, luma);
              float highW = smoothstep(0.32, 0.95, luma);

              vec3 shadowTint = mix(vec3(0.97, 0.94, 1.06), vec3(1.01, 0.92, 1.05), uEclipseGrade);
              vec3 highTint = mix(vec3(1.01, 0.98, 1.03), vec3(1.05, 0.96, 0.98), uEclipseGrade);
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
        composer.addPass(eclipsePass);
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
      let disposed = false;
      let lastFrameTime = performance.now();
      let lastAct: CutsceneAct = 'eclipse';
      let lastUiPct = -1;
      let climaxBeatTriggered = false;
      let currentRoll = 0;
      let smoothedBloomStrength = 0.17;
      let smoothedBloomRadius = 0.25;
      let smoothedDofFocus = 6.2;
      let smoothedDofAperture = 0.00017;
      let smoothedDofMaxBlur = 0.0040;
      let smoothedAberration = 0.0007;
      let smoothedVignette = 0.30;

      const afterDraw = (cb: () => void) => {
        if (disposed || !renderer) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) {
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
        if (disposed || !renderer) return;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
        lastFrameTime = now;

        const elapsedSinceSync = (now - lastSyncTimeRef.current) / 1000;
        const estRemaining = Math.max(0, remainingRef.current - elapsedSinceSync);
        const p = Math.max(0, Math.min(1, 1 - estRemaining / Math.max(0.1, totalDuration)));
        const elapsed = p * totalDuration;

        const pct = Math.round(p * 100);
        if (pct !== lastUiPct) {
          lastUiPct = pct;
          setUiProgress(pct);
        }

        // Synced exactly to GameEngine.ts: Blink cuts at 0.52..0.78, True Fallen at 0.78
        const nextAct: CutsceneAct =
          p < 0.25 ? 'eclipse' : p < 0.52 ? 'awakening' : p < 0.78 ? 'blink' : 'ascension';
        if (nextAct !== lastAct) {
          lastAct = nextAct;
          setAct(nextAct);
        }

        if (p >= 0.78 && !climaxBeatTriggered) {
          climaxBeatTriggered = true;
          setClimaxFlash(true);
          window.setTimeout(() => {
            if (!disposed) setClimaxFlash(false);
          }, 160);
        }

        // Perpetual Cathedral & Eclipse Atmosphere
        const spinMult = p < 0.25 ? 0.65 : p < 0.52 ? 1.4 : p < 0.78 ? 2.4 : 3.0;
        moonRingA.rotation.x += dt * 0.55 * spinMult;
        moonRingA.rotation.y += dt * 0.72 * spinMult;
        moonRingB.rotation.y -= dt * 0.85 * spinMult;
        moonRingB.rotation.z += dt * 0.48 * spinMult;
        coronaUniforms.uTime.value = elapsed;
        coronaUniforms.uIntensity.value = 0.62 + Math.min(0.32, p * 0.4);
        dustPoints.rotation.y += dt * 0.26 * spinMult;
        floorUniforms.uTime.value = elapsed;
        floorUniforms.uPulse.value = THREE.MathUtils.smoothstep(p, 0.2, 0.85);
        altarOuterSeal.rotation.z = elapsed * 0.5;

        for (let i = 0; i < pillars.length; i++) {
          pillars[i].cap.position.y =
            pillars[i].baseCapY + Math.sin(elapsed * 2.2 + i * 1.3) * 0.14;
          pillars[i].cap.rotation.y += dt * 0.9;
        }

        // Post-processing targets
        let targetBloomStrength = 0.17;
        let targetBloomRadius = 0.25;
        let targetAberration = 0.00065;
        let shockWave = 0;
        let shockRadius = 0;
        let postFlash = 0;
        let targetFov = 47;
        let targetRoll = 0;

        if (p < 0.25) {
          // ACT I (0% - 25%): Blood Moon Seal & Bound Seraph
          const a1 = p / 0.25;
          const ease = 1 - Math.pow(1 - a1, 3);

          heroGroup.position.set(0, 0.2, 0);
          heroGroup.rotation.set(0.16 * (1 - ease * 0.4), 0, 0);
          headGroup.rotation.x = 0.28 - ease * 0.18;
          rightArmPivot.rotation.set(-0.25, 0, -0.22);
          leftArmPivot.rotation.set(-0.25, 0, 0.22);
          rightDagger.visible = false;
          leftDagger.visible = false;

          for (let w = 0; w < 3; w++) {
            const tremor = Math.sin(elapsed * 14 + w) * 0.04 * a1;
            rightWings[w].rotation.set(0.28, -0.92, -0.82 - w * 0.18 + tremor);
            leftWings[w].rotation.set(0.28, 0.92, 0.82 + w * 0.18 - tremor);
          }

          chainsGroup.visible = true;
          chainsGroup.scale.setScalar(1.0 + a1 * 0.08);
          for (let i = 0; i < chainRings.length; i++) {
            chainRings[i].rotation.y += dt * (0.45 + i * 0.25);
          }
          for (let i = 0; i < chainTethers.length; i++) {
            chainTethers[i].visible = true;
          }

          fallenHaloGroup.visible = true;
          fallenHaloGroup.scale.setScalar(0.55 + ease * 0.25);
          fallenHaloGroup.rotation.z = a1 * 0.8;

          for (let i = 0; i < 4; i++) {
            warpBeams[i].visible = false;
            slashArcs[i].visible = false;
            warpGateRings[i].visible = false;
            phantomAfterimages[i].visible = false;
          }
          eclipseDome.visible = false;
          eclipsePillar.visible = false;
          shockwaveViolet.visible = false;
          shockwaveCrimson.visible = false;

          for (let i = 0; i < featherCount; i++) {
            const ang = fAngles[i] + a1 * 1.4;
            const r = fRadii[i] * (1.08 - ease * 0.14);
            _dummy.position.set(
              Math.cos(ang) * r,
              0.35 + ((fHeights[i] + a1 * 1.6) % 4.4),
              Math.sin(ang) * r
            );
            _dummy.rotation.set(a1 * 3 + i, ang, 0.4);
            _dummy.scale.setScalar(0.55 + (i % 3) * 0.15);
            _dummy.updateMatrix();
            featherInstanced.setMatrixAt(i, _dummy.matrix);
          }
          featherInstanced.instanceMatrix.needsUpdate = true;

          seraphCoreLight.intensity = 4.5 + ease * 3.5;
          bloodMoonRimLight.intensity = 9.5 + ease * 4.5;
          groundGlowLight.intensity = 3.0 + ease * 2.5;
          targetBloomStrength = 0.16 + ease * 0.03;
          targetFov = 47 - ease * 1.5;
        } else if (p < 0.52) {
          // ACT II (25% - 52%): Chains Shatter & 6 Obsidian Wings Unfurl
          const a2 = (p - 0.25) / 0.27;
          const riseEase = 1 - Math.pow(1 - Math.min(1, a2 * 1.15), 3);

          heroGroup.position.set(0, 0.2 + riseEase * 0.84, 0);
          heroGroup.rotation.set(0.08 * (1 - riseEase), 0, 0);
          headGroup.rotation.x = 0.1 - riseEase * 0.18;
          rightArmPivot.rotation.set(-0.35 - a2 * 0.55, 0, -0.52 - riseEase * 0.35);
          leftArmPivot.rotation.set(-0.35 - a2 * 0.55, 0, 0.52 + riseEase * 0.35);
          rightDagger.visible = a2 > 0.62;
          leftDagger.visible = a2 > 0.62;

          if (a2 < 0.32) {
            const shatterT = a2 / 0.32;
            chainsGroup.visible = true;
            chainsGroup.scale.setScalar(1.08 + shatterT * 2.3);
            chainsGroup.rotation.y += dt * 4.5;
            for (let i = 0; i < chainTethers.length; i++) {
              chainTethers[i].visible = shatterT < 0.55;
            }
            shockWave = Math.sin(shatterT * Math.PI) * 0.65;
            shockRadius = 0.04 + shatterT * 1.1;
          } else {
            chainsGroup.visible = false;
            for (let i = 0; i < chainTethers.length; i++) {
              chainTethers[i].visible = false;
            }
          }

          for (let w = 0; w < 3; w++) {
            const wingStart = 0.18 + w * 0.16;
            const wingProg = Math.max(0, Math.min(1, (a2 - wingStart) / 0.28));
            const wingEase = 1 - Math.pow(1 - wingProg, 3);
            const targetSpread = 0.42 - w * 0.38;
            const rotZ = THREE.MathUtils.lerp(-0.88 - w * 0.16, targetSpread, wingEase);
            const rotY = THREE.MathUtils.lerp(-0.92, -0.12, wingEase);
            const flap = Math.sin(elapsed * 6.0 + w * 0.8) * 0.06 * wingEase;
            rightWings[w].rotation.set(-0.08, rotY, rotZ + flap);
            leftWings[w].rotation.set(-0.08, -rotY, -rotZ - flap);
          }

          fallenHaloGroup.visible = true;
          fallenHaloGroup.scale.setScalar(0.8 + riseEase * 0.42);
          fallenHaloGroup.rotation.z += dt * 1.9;

          for (let i = 0; i < 4; i++) {
            warpBeams[i].visible = false;
            slashArcs[i].visible = false;
            warpGateRings[i].visible = false;
            phantomAfterimages[i].visible = false;
          }
          eclipseDome.visible = false;
          eclipsePillar.visible = false;
          shockwaveViolet.visible = false;
          shockwaveCrimson.visible = false;

          for (let i = 0; i < featherCount; i++) {
            const ang = fAngles[i] + a2 * 4.6;
            const r = 0.9 + ((fRadii[i] + a2 * 2.1) % 5.2);
            _dummy.position.set(
              Math.cos(ang) * r,
              0.4 + riseEase * 0.6 + ((fHeights[i] + a2 * 2.4) % 4.8),
              Math.sin(ang) * r
            );
            _dummy.rotation.set(a2 * 7 + i, ang, 0.7);
            _dummy.scale.setScalar(0.7 + a2 * 0.35);
            _dummy.updateMatrix();
            featherInstanced.setMatrixAt(i, _dummy.matrix);
          }
          featherInstanced.instanceMatrix.needsUpdate = true;

          seraphCoreLight.intensity = 7.5 + a2 * 4.5;
          bloodMoonRimLight.intensity = 13 + a2 * 4.5;
          groundGlowLight.intensity = 5.0 + a2 * 3.0;
          targetBloomStrength = 0.19 + Math.sin(a2 * Math.PI) * 0.035;
          targetAberration = 0.00075 + Math.sin(a2 * Math.PI) * 0.0005;
          targetFov = 45.5 + a2 * 3.5;
          targetRoll = -0.022 * Math.sin(a2 * Math.PI);
        } else if (p < 0.78) {
          // ACT III (52% - 78%): 4-Step Abyssal Blink Dimensional Cuts
          const a3 = (p - 0.52) / 0.26;
          const segFloat = a3 * 4;
          const segIdx = Math.min(3, Math.floor(segFloat));
          const segFrac = segFloat - segIdx;
          const dashEase = 1 - Math.pow(1 - Math.min(1, segFrac * 2.4), 3);

          const fromPt = blinkAnchors[segIdx];
          const toPt = blinkAnchors[segIdx + 1];
          _vA.copy(fromPt).lerp(toPt, dashEase);
          heroGroup.position.copy(_vA);
          heroGroup.position.y += 0.25 + Math.sin(segFrac * Math.PI) * 0.45;
          heroGroup.lookAt(toPt.x, heroGroup.position.y, toPt.z);

          rightDagger.visible = true;
          leftDagger.visible = true;
          rightArmPivot.rotation.set(-1.35, 0.2, -0.55);
          leftArmPivot.rotation.set(-0.95, -0.25, 0.55);

          for (let w = 0; w < 3; w++) {
            const spread = 0.22 - w * 0.34;
            rightWings[w].rotation.set(-0.22, -0.34, spread);
            leftWings[w].rotation.set(-0.22, 0.34, -spread);
          }

          fallenHaloGroup.visible = true;
          fallenHaloGroup.scale.setScalar(1.22);
          fallenHaloGroup.rotation.z += dt * 3.8;
          chainsGroup.visible = false;
          for (let i = 0; i < chainTethers.length; i++) {
            chainTethers[i].visible = false;
          }

          for (let i = 0; i < 4; i++) {
            const activeOrPassed = i <= segIdx;
            warpBeams[i].visible = activeOrPassed;
            slashArcs[i].visible = activeOrPassed;
            if (activeOrPassed) {
              slashArcs[i].scale.setScalar(i === segIdx ? 0.85 + segFrac * 0.55 : 1.15);
            }
            warpGateRings[i].visible = activeOrPassed;
            warpGateRings[i].rotation.z += dt * 4.2;
            warpGateRings[i].scale.setScalar(i === segIdx ? 0.8 + segFrac * 0.9 : 1.15);
            phantomAfterimages[i].visible = activeOrPassed;
            if (activeOrPassed) {
              phantomAfterimages[i].lookAt(blinkAnchors[i + 1].x, 0.2, blinkAnchors[i + 1].z);
            }
          }

          eclipseDome.visible = false;
          eclipsePillar.visible = false;
          shockwaveViolet.visible = true;
          shockwaveViolet.position.set(toPt.x, 0.22, toPt.z);
          shockwaveViolet.scale.setScalar(0.6 + dashEase * 2.9);
          shockVioletMat.opacity = Math.max(0, 0.72 * (1 - segFrac * 0.65));
          shockwaveCrimson.visible = false;

          for (let i = 0; i < featherCount; i++) {
            const anchorRef = blinkAnchors[(i % 4) + 1];
            const ang = fAngles[i] + a3 * 9.5;
            const r = 0.65 + (i % 7) * 0.38;
            _dummy.position.set(
              anchorRef.x + Math.cos(ang) * r,
              0.45 + ((fHeights[i] + a3 * 3.2) % 3.6),
              anchorRef.z + Math.sin(ang) * r
            );
            _dummy.rotation.set(a3 * 14 + i, ang, 1.1);
            _dummy.scale.setScalar(0.82);
            _dummy.updateMatrix();
            featherInstanced.setMatrixAt(i, _dummy.matrix);
          }
          featherInstanced.instanceMatrix.needsUpdate = true;

          seraphCoreLight.intensity = 9.0 + Math.sin(a3 * Math.PI * 8) * 3.0;
          bloodMoonRimLight.intensity = 15.0;
          groundGlowLight.intensity = 6.0;
          targetBloomStrength = 0.20 + Math.sin(segFrac * Math.PI) * 0.03;
          targetAberration = 0.0009 + Math.sin(segFrac * Math.PI) * 0.0008;
          targetFov = 49 + Math.sin(segFrac * Math.PI) * 2.5;
          targetRoll = (segIdx % 2 === 0 ? 1 : -1) * 0.025 * Math.sin(segFrac * Math.PI);
        } else {
          // ACT IV (78% - 100%): True Fallen Angel Apotheosis & Feather Vortex Eruption
          const a4 = (p - 0.78) / 0.22;
          const slamT = Math.min(1, a4 / 0.22);
          const blastT = Math.min(1, a4 / 0.72);
          const blastEase = 1 - Math.pow(1 - blastT, 3);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(a4, 0.48, 1.0);

          heroGroup.position.set(0, 0.2 + (1 - slamT) * 0.75 + Math.sin(a4 * Math.PI) * 0.18, 0.15);
          heroGroup.rotation.set(0, 0, 0);
          headGroup.rotation.x = -0.08;
          rightDagger.visible = true;
          leftDagger.visible = true;
          rightArmPivot.rotation.set(-0.65, 0, -0.95 - (1 - slamT) * 0.4);
          leftArmPivot.rotation.set(-0.65, 0, 0.95 + (1 - slamT) * 0.4);

          for (let w = 0; w < 3; w++) {
            const spread = 0.48 - w * 0.36;
            rightWings[w].rotation.set(-0.1, 0, spread);
            leftWings[w].rotation.set(-0.1, 0, -spread);
          }

          fallenHaloGroup.visible = true;
          fallenHaloGroup.scale.setScalar(1.36);
          fallenHaloGroup.rotation.z += dt * 5.2;

          for (let i = 0; i < 4; i++) {
            warpBeams[i].visible = false;
            slashArcs[i].visible = false;
            warpGateRings[i].visible = false;
            phantomAfterimages[i].visible = false;
          }

          eclipseDome.visible = fadeOut > 0.02;
          eclipseDome.scale.setScalar(1.1 + blastEase * 14.5);
          eclipseDomeUniforms.uTime.value = elapsed;
          eclipseDomeUniforms.uAlpha.value = fadeOut * 0.42;

          eclipsePillar.visible = fadeOut > 0.02;
          const pScale = a4 < 0.25 ? 0.55 + (a4 / 0.25) * 1.45 : Math.max(0.25, 2.0 * fadeOut);
          eclipsePillar.scale.set(pScale, 1, pScale);
          pillarMat.opacity = a4 < 0.25 ? 0.34 : Math.max(0, 0.34 * fadeOut);

          shockwaveViolet.visible = fadeOut > 0.02;
          shockwaveViolet.position.set(0, 0.22, 0.15);
          shockwaveViolet.scale.setScalar(0.8 + blastEase * 12.6);
          shockVioletMat.opacity = fadeOut * 0.68;

          shockwaveCrimson.visible = fadeOut > 0.02;
          shockwaveCrimson.position.set(0, 0.34, 0.15);
          shockwaveCrimson.scale.setScalar(0.5 + blastEase * 9.5);
          shockCrimsonMat.opacity = fadeOut * 0.65;

          for (let i = 0; i < featherCount; i++) {
            const dist = blastEase * (4.8 + (i % 7) * 1.1);
            _dummy.position.set(
              fDirs[i].x * dist,
              Math.max(0.22, 1.3 + fDirs[i].y * dist * 0.95),
              0.15 + fDirs[i].z * dist
            );
            _dummy.rotation.set(blastEase * 12 + i, fAngles[i], i * 0.4);
            _dummy.scale.setScalar(Math.max(0.4, 1.15 - a4 * 0.55));
            _dummy.updateMatrix();
            featherInstanced.setMatrixAt(i, _dummy.matrix);
          }
          featherInstanced.instanceMatrix.needsUpdate = true;

          seraphCoreLight.intensity = 10.5 * fadeOut + 4.5;
          bloodMoonRimLight.intensity = 14.5 * fadeOut + 8.5;
          groundGlowLight.intensity = 6.5 * fadeOut + 2.8;

          const climaxEnv =
            Math.sin(Math.min(1, a4 / 0.22) * Math.PI * 0.5) *
            (1 - THREE.MathUtils.smoothstep(a4, 0.25, 0.95));
          targetBloomStrength = 0.185 + climaxEnv * 0.065;
          targetBloomRadius = 0.25 + climaxEnv * 0.07;
          targetAberration = 0.0007 + climaxEnv * 0.0019;
          shockWave =
            a4 < 0.55 ? Math.max(0, 1 - a4 / 0.55) * Math.sin(Math.min(1, a4 / 0.07) * Math.PI * 0.5) : 0;
          shockRadius = 0.04 + a4 * 1.45;
          postFlash = a4 < 0.12 ? (1 - a4 / 0.12) * 0.045 : 0;
          targetFov = a4 < 0.2 ? 49.5 + (a4 / 0.2) * 4.5 : 54 - ((a4 - 0.2) / 0.8) * 5.0;
          targetRoll = a4 < 0.35 ? 0.028 * (1 - a4 / 0.35) : 0;
        }

        // Update sky & contact shadow height dimming
        skyUniforms.uTime.value = elapsed;
        skyUniforms.uEclipse.value = THREE.MathUtils.smoothstep(p, 0.18, 0.82);
        skyUniforms.uFlash.value = p >= 0.78 && p < 0.90 ? (1 - (p - 0.78) / 0.12) * 0.35 : 0;
        if (scene.background instanceof THREE.Color) {
          scene.background.copy(skyDarkColor).lerp(skyEclipseColor, skyUniforms.uEclipse.value);
        }
        contactShadow.position.set(heroGroup.position.x, 0.215, heroGroup.position.z);
        contactShadow.material.opacity = Math.max(0.24, 0.68 - (heroGroup.position.y - 0.2) * 0.38);

        // 4-Act Dynamic Camera Choreography
        if (p < 0.25) {
          const a1 = p / 0.25;
          _camTarget.set(2.3 - a1 * 1.1, 0.82 + a1 * 0.55, 5.8 - a1 * 1.25);
          _lookTarget.set(0, 1.45 + a1 * 0.3, -0.3);
        } else if (p < 0.52) {
          const a2 = (p - 0.25) / 0.27;
          const camAng = 0.28 - a2 * 2.15;
          const camDist = 4.65 + Math.sin(a2 * Math.PI) * 1.15;
          _camTarget.set(
            Math.sin(camAng) * camDist,
            1.45 + a2 * 1.25,
            Math.cos(camAng) * camDist
          );
          _lookTarget.set(0, 1.65 + a2 * 0.45, -0.15);
        } else if (p < 0.78) {
          const a3 = (p - 0.52) / 0.26;
          const camAng = -1.87 + a3 * 2.35;
          const camDist = 6.9;
          _camTarget.set(
            Math.sin(camAng) * camDist,
            4.1 + Math.sin(a3 * Math.PI * 2) * 0.55,
            Math.cos(camAng) * camDist
          );
          _lookTarget.set(heroGroup.position.x * 0.45, 1.35, heroGroup.position.z * 0.45);
        } else {
          const a4 = (p - 0.78) / 0.22;
          const shakeMag = a4 < 0.26 ? (1 - a4 / 0.26) * 0.24 : 0;
          const shakeX = Math.sin(elapsed * 42) * shakeMag;
          const shakeY = Math.cos(elapsed * 38) * shakeMag;
          const camAng = 0.48 - a4 * 0.48;
          const camDist = 5.4 + Math.min(1, a4 * 1.3) * 2.7;
          _camTarget.set(
            Math.sin(camAng) * camDist + shakeX,
            2.15 + a4 * 0.95 + shakeY,
            Math.cos(camAng) * camDist
          );
          _lookTarget.set(0, 1.65, -0.15);
        }

        const dampFactor = 1 - Math.exp(-6.8 * dt);
        camera.position.lerp(_camTarget, dampFactor);
        _currentLook.lerp(_lookTarget, dampFactor);
        currentRoll += (targetRoll - currentRoll) * dampFactor;
        camera.lookAt(_currentLook);
        if (Math.abs(currentRoll) > 0.0002) {
          camera.rotateZ(currentRoll);
        }

        const nextFov = camera.fov + (targetFov - camera.fov) * dampFactor;
        if (Math.abs(nextFov - camera.fov) > 0.015) {
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }

        if (composer && bloomPass && bokehPass) {
          const postDamp = 1 - Math.exp(-7.5 * dt);
          smoothedBloomStrength += (targetBloomStrength - smoothedBloomStrength) * postDamp;
          smoothedBloomRadius += (targetBloomRadius - smoothedBloomRadius) * postDamp;
          smoothedAberration += (targetAberration - smoothedAberration) * postDamp;

          const targetVignette = THREE.MathUtils.lerp(0.32, 0.24, THREE.MathUtils.smoothstep(p, 0.65, 0.95));
          smoothedVignette += (targetVignette - smoothedVignette) * postDamp;

          const targetFocus = camera.position.distanceTo(_currentLook);
          const targetAperture = THREE.MathUtils.lerp(
            0.00017,
            0.00012,
            THREE.MathUtils.smoothstep(p, 0.45, 0.9)
          );
          const targetMaxBlur = THREE.MathUtils.lerp(
            0.0040,
            0.0026,
            THREE.MathUtils.smoothstep(p, 0.45, 0.9)
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

          eclipsePassUniforms.uAberration.value = smoothedAberration;
          eclipsePassUniforms.uShockWave.value = shockWave;
          eclipsePassUniforms.uShockRadius.value = shockRadius;
          eclipsePassUniforms.uFlash.value = postFlash;
          eclipsePassUniforms.uVignette.value = smoothedVignette;
          eclipsePassUniforms.uEclipseGrade.value = THREE.MathUtils.smoothstep(p, 0.22, 0.88);
          eclipsePassUniforms.uContrast.value = 1.04 + THREE.MathUtils.smoothstep(p, 0.2, 0.78) * 0.03;
          eclipsePassUniforms.uSaturation.value = 1.04 + THREE.MathUtils.smoothstep(p, 0.25, 0.85) * 0.06;

          composer.render();
        } else {
          renderer.render(scene, camera);
        }

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        renderPass?.dispose();
        bokehPass?.dispose();
        bloomPass?.dispose();
        eclipsePass?.dispose();
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

  const currentMeta = ACT_META[act];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05010c] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D True Fallen Angel Ascension"
    >
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Subtle Climax Awakening Pulse */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-fuchsia-500/12 via-rose-400/12 to-amber-200/10 transition-opacity duration-150 ${
          climaxFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Cinematic Letterbox Bar (solid dark fill, no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#080212]/94 border-b border-fuchsia-400/45 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-game tracking-[0.24em] uppercase text-fuchsia-300 flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>FALLEN ANGEL · ECLIPSE SERAPHIM &amp; ABYSSAL BLINK 3D</span>
          </p>
          <h2 className="font-title text-base sm:text-2xl font-black tracking-wider text-rose-200 truncate">
            {currentMeta.title}
          </h2>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <span className="inline-block px-2.5 py-1 rounded border border-fuchsia-400/45 bg-fuchsia-950/85 text-[11px] font-game tracking-wider text-rose-200">
            {currentMeta.badge}
          </span>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-[#080212]/94 border-t border-fuchsia-400/45 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="pointer-events-none min-w-0">
          <p className="text-[10px] sm:text-[11px] font-game tracking-[0.18em] uppercase text-fuchsia-300/85 truncate">
            {currentMeta.badge}
          </p>
          <p className="text-xs sm:text-sm font-medium italic text-rose-100/95 truncate">
            {currentMeta.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-400/60 hover:border-rose-300 text-fuchsia-50 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-rose-300" />
        </button>

        {/* Bottom Progress Strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-fuchsia-400 to-amber-300 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
