import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Crosshair, FastForward } from 'lucide-react';

interface DemonisVoidJudgement3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  targetName?: string;
  targetIsBoss?: boolean;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutscenePhase = 'aiming' | 'launch' | 'explosion' | 'return';

const PHASE_LABELS: Record<CutscenePhase, string> = {
  aiming: 'FASE I · MEMBIDIK LAWAN — PENGUNCIAN VOID SNIPER KOSMIK',
  launch: 'FASE II · MELANCARKAN SERANGAN — TOMBAK VOID KEHANCURAN!',
  explosion: 'FASE III · MENGENAI TARGET — LEDAKAN ABYSSAL ANNIHILATION!',
  return: 'FASE IV · KEMBALI KE PERTEMPURAN!'
};

// Pre-allocated scratch helpers (zero GC inside tick)
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(2.0, 1.7, 0);
const _focusTarget = new THREE.Vector3(-6.5, 1.66, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _tmpVecA = new THREE.Vector3();
const _axisY = new THREE.Vector3(0, 1, 0);

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(3, 1, 10, 0.88)');
    g.addColorStop(0.5, 'rgba(18, 4, 30, 0.45)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const DemonisVoidJudgement3DCutscene: React.FC<DemonisVoidJudgement3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 4.6,
  targetName = 'MUSUH',
  targetIsBoss = false,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [phase, setPhase] = useState<CutscenePhase>('aiming');
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
    let isDisposed = false;
    let flashTimeout = 0;

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
      renderer.toneMappingExposure = 0.88;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setSize(window.innerWidth, Math.max(1, window.innerHeight), false);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        isDisposed = true;
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
      scene.background = new THREE.Color(0x030109);
      scene.fog = new THREE.FogExp2(0x080214, 0.022);

      const camera = new THREE.PerspectiveCamera(
        46,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        150
      );
      camera.position.set(-9.6, 2.55, 2.55);
      _currentLook.set(3.5, 1.72, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.52;
      disposables.push(envRT, roomEnv, pmrem);

      // Calibrated Abyssal Sovereign 3-Point Lighting Rig (crisp highlights, zero glare)
      const hemiLight = new THREE.HemisphereLight(0xa855f7, 0x10021c, 0.65);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xf3e8ff, 1.42);
      keyLight.position.set(-7, 13, 8);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 42;
        keyLight.shadow.camera.left = -16;
        keyLight.shadow.camera.right = 16;
        keyLight.shadow.camera.top = 12;
        keyLight.shadow.camera.bottom = -12;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xf43f5e, 0.98);
      rimLight.position.set(12, 8, -11);
      scene.add(rimLight);

      const shooterLight = new THREE.PointLight(0xa855f7, 5.2, 18, 1.45);
      shooterLight.position.set(-5.8, 2.2, 0.6);
      scene.add(shooterLight);

      const impactLight = new THREE.PointLight(0xe879f9, 3.8, 28, 1.4);
      impactLight.position.set(8.2, 2.1, 0);
      scene.add(impactLight);

      // =========================================================================
      // BACKGROUND 1: Abyssal Cosmic Rift Sky Dome (GLSL FBM + Rift Bands)
      // =========================================================================
      const skyUniforms = {
        uTime: { value: 0 },
        uEnergy: { value: 0.3 },
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
            uniform float uEnergy;
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
                p = p * 2.03 + vec3(0.19, -0.17, 0.13);
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldDir);
              float horizonGlow = pow(1.0 - abs(dir.y), 3.8);
              vec3 nebCoord = dir * 2.4 + vec3(uTime * 0.03, -uTime * 0.025, uTime * 0.02);
              float n1 = fbm(nebCoord);
              float n2 = fbm(nebCoord * 2.15 + vec3(n1 * 1.45));
              float riftBand = smoothstep(0.42, 0.84, n2);

              vec3 abyssBlack = vec3(0.012, 0.005, 0.028);
              vec3 deepViolet = vec3(0.12, 0.025, 0.23);
              vec3 crimsonRift = vec3(0.42, 0.045, 0.19);
              vec3 neonMagenta = vec3(0.56, 0.14, 0.66);

              vec3 col = mix(abyssBlack, deepViolet, n1 * 0.78 + horizonGlow * 0.42);
              col += crimsonRift * riftBand * (0.22 + uEnergy * 0.30);
              col += neonMagenta * pow(riftBand, 3.0) * (0.15 + uEnergy * 0.28);
              col += vec3(0.24, 0.035, 0.34) * horizonGlow * (0.24 + uEnergy * 0.22);

              // Sharp twinkling cosmic stars
              float starCell = hash(floor(dir * 145.0));
              float star = smoothstep(0.992, 0.999, starCell) * smoothstep(-0.05, 0.45, dir.y);
              float twinkle = 0.55 + 0.45 * sin(uTime * 4.2 + starCell * 95.0);
              col += vec3(0.90, 0.80, 1.0) * star * twinkle * 0.85;

              // Controlled dimensional detonation flash
              col += vec3(0.68, 0.24, 0.88) * uFlash * 0.22;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      scene.add(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(85, 32, 24)), skyMat));

      // =========================================================================
      // BACKGROUND 2: Colossal Blackhole Singularity & Swirling Accretion Vortex
      // =========================================================================
      const blackholeGroup = new THREE.Group();
      blackholeGroup.position.set(1.2, 5.4, -14.5);
      scene.add(blackholeGroup);

      const eventHorizonMat = trackMat(
        new THREE.MeshBasicMaterial({ color: 0x010004 })
      );
      const eventHorizon = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(2.35, 32, 32)),
        eventHorizonMat
      );

      const photonRimUniforms = {
        uTime: { value: 0 },
        uSurge: { value: 0.4 }
      };
      const photonRimMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: photonRimUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.FrontSide,
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vViewPos = -mv.xyz;
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            uniform float uTime;
            uniform float uSurge;
            void main() {
              vec3 viewDir = normalize(vViewPos);
              float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
              float pulse = 0.85 + 0.15 * sin(uTime * 5.0 + vNormal.x * 6.0);
              float glow = pow(rim, 3.5) * pulse * uSurge;
              vec3 col = mix(vec3(0.60, 0.16, 0.90), vec3(0.95, 0.28, 0.52), pow(rim, 5.0));
              gl_FragColor = vec4(col * glow, clamp(glow, 0.0, 1.0));
            }
          `
        })
      );
      const photonRimSphere = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(2.96, 32, 32)),
        photonRimMat
      );

      const accretionShaderUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 0.62 }
      };
      const accretionDiskMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: accretionShaderUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          vertexShader: `
            varying vec3 vLocal;
            void main() {
              vLocal = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vLocal;
            uniform float uTime;
            uniform float uIntensity;
            void main() {
              float r = length(vLocal.xy);
              float ang = atan(vLocal.y, vLocal.x);
              float spiral = 0.5 + 0.5 * sin(ang * 4.0 + r * 3.2 - uTime * 3.8);
              float spiral2 = 0.5 + 0.5 * cos(ang * 7.0 - r * 2.4 + uTime * 2.4);
              float mask = smoothstep(2.55, 3.1, r) * (1.0 - smoothstep(4.9, 6.2, r));
              float streak = smoothstep(0.25, 0.95, spiral * 0.65 + spiral2 * 0.35);
              vec3 col = mix(vec3(0.55, 0.14, 0.88), vec3(0.94, 0.26, 0.50), streak);
              float alpha = mask * (0.24 + streak * 0.50) * uIntensity;
              gl_FragColor = vec4(col * alpha, clamp(alpha, 0.0, 1.0));
            }
          `
        })
      );
      const bhAccretionDisk = new THREE.Mesh(
        trackGeo(new THREE.RingGeometry(2.5, 6.2, 64, 2)),
        accretionDiskMat
      );
      bhAccretionDisk.rotation.set(Math.PI / 2 - 0.34, 0.24, 0);

      const bhOrbitRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.85, 0.052, 8, 64)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xc084fc,
            emissive: 0x9333ea,
            emissiveIntensity: 1.25,
            roughness: 0.25,
            metalness: 0.6
          })
        )
      );
      bhOrbitRing.rotation.set(0.65, -0.4, 0.3);

      blackholeGroup.add(eventHorizon, photonRimSphere, bhAccretionDisk, bhOrbitRing);

      // 28 Orbiting Void Debris Asteroids around Blackhole
      const asteroidCount = 28;
      const asteroidMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x3b0764,
          emissiveIntensity: 0.45,
          roughness: 0.72,
          metalness: 0.35,
          flatShading: true
        })
      );
      const bhAsteroids = new THREE.InstancedMesh(
        trackGeo(new THREE.DodecahedronGeometry(0.18, 0)),
        asteroidMat,
        asteroidCount
      );
      bhAsteroids.frustumCulled = false;
      blackholeGroup.add(bhAsteroids);

      const bhAsteroidData: { ang: number; rad: number; y: number }[] = [];
      for (let i = 0; i < asteroidCount; i++) {
        bhAsteroidData.push({
          ang: (i * Math.PI * 2) / asteroidCount,
          rad: 4.1 + (i % 5) * 0.55,
          y: ((i % 7) - 3) * 0.22
        });
        _tmpColor.setHex(i % 4 === 0 ? 0xa855f7 : i % 2 === 0 ? 0x31104a : 0x1a0b2e);
        bhAsteroids.setColorAt(i, _tmpColor);
      }
      if (bhAsteroids.instanceColor) bhAsteroids.instanceColor.needsUpdate = true;

      // =========================================================================
      // BACKGROUND 3: Abyssal Chasm Floor + Arcane Sniper Platform + Floating Ruins
      // =========================================================================
      const abyssRiverUniforms = {
        uTime: { value: 0 },
        uSurge: { value: 0.35 }
      };
      const abyssRiverMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: abyssRiverUniforms,
          transparent: true,
          depthWrite: false,
          vertexShader: `
            varying vec3 vPos;
            void main() {
              vPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vPos;
            uniform float uTime;
            uniform float uSurge;
            void main() {
              float w1 = sin(vPos.x * 0.65 - uTime * 2.2 + sin(vPos.y * 0.45));
              float w2 = cos(vPos.y * 0.85 + uTime * 1.6);
              float veins = smoothstep(0.28, 0.92, 0.5 + 0.5 * (w1 * 0.6 + w2 * 0.4));
              float edge = 1.0 - smoothstep(14.0, 28.0, length(vPos.xy));
              vec3 darkBed = vec3(0.018, 0.006, 0.04);
              vec3 rift = vec3(0.40, 0.09, 0.66);
              vec3 hot = vec3(0.86, 0.20, 0.44);
              vec3 col = mix(darkBed, rift, veins * (0.42 + uSurge * 0.30));
              col += hot * pow(veins, 4.0) * (0.30 + uSurge * 0.38);
              gl_FragColor = vec4(col, edge * 0.88);
            }
          `
        })
      );
      const chasmVoidFloor = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(66, 46)),
        abyssRiverMat
      );
      chasmVoidFloor.rotation.x = -Math.PI / 2;
      chasmVoidFloor.position.y = -0.75;
      scene.add(chasmVoidFloor);

      // Procedural Arcane Sniper Sigil Texture for Demonis Bastion Dais
      const sigilCanvas = document.createElement('canvas');
      sigilCanvas.width = 512;
      sigilCanvas.height = 512;
      const sctx = sigilCanvas.getContext('2d');
      if (sctx) {
        sctx.fillStyle = '#090314';
        sctx.fillRect(0, 0, 512, 512);

        const grad = sctx.createRadialGradient(256, 256, 20, 256, 256, 246);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.44)');
        grad.addColorStop(0.55, 'rgba(244, 63, 94, 0.22)');
        grad.addColorStop(1, 'rgba(9, 3, 20, 0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 512, 512);

        sctx.strokeStyle = 'rgba(232, 121, 249, 0.70)';
        sctx.lineWidth = 3;
        sctx.beginPath();
        sctx.arc(256, 256, 212, 0, Math.PI * 2);
        sctx.stroke();
        sctx.strokeStyle = 'rgba(244, 63, 94, 0.62)';
        sctx.lineWidth = 2;
        sctx.beginPath();
        sctx.arc(256, 256, 152, 0, Math.PI * 2);
        sctx.stroke();

        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          sctx.beginPath();
          sctx.moveTo(256 + Math.cos(a) * 152, 256 + Math.sin(a) * 152);
          sctx.lineTo(
            256 + Math.cos(a + (Math.PI * 2) / 3) * 152,
            256 + Math.sin(a + (Math.PI * 2) / 3) * 152
          );
          sctx.stroke();
        }
      }
      const sigilTex = new THREE.CanvasTexture(sigilCanvas);
      sigilTex.colorSpace = THREE.SRGBColorSpace;
      sigilTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      disposables.push(sigilTex);

      const contactShadowTex = createContactShadowTexture();
      disposables.push(contactShadowTex);
      const contactShadowMat = trackMat(
        new THREE.MeshBasicMaterial({
          map: contactShadowTex,
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        })
      );

      // Shared PBR Materials (calibrated emissive levels)
      const obsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x160a28,
          roughness: 0.62,
          metalness: 0.42
        })
      );
      const darkSteelMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x1e1633,
          roughness: 0.28,
          metalness: 0.84
        })
      );
      const armorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x191229,
          roughness: 0.24,
          metalness: 0.86
        })
      );
      const robeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x3b0764,
          emissive: 0x1e0438,
          emissiveIntensity: 0.36,
          roughness: 0.68,
          metalness: 0.14,
          side: THREE.DoubleSide
        })
      );
      const voidGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xe879f9,
          emissive: 0xa855f7,
          emissiveIntensity: 1.32,
          roughness: 0.18,
          metalness: 0.28
        })
      );
      const crimsonEyeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: 1.48,
          roughness: 0.16
        })
      );
      const astralGoldMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xeab308,
          emissive: 0x713f12,
          emissiveIntensity: 0.32,
          roughness: 0.2,
          metalness: 0.9
        })
      );

      // Shooter Bastion Platform at x = -6.5 (grounded at y = 0)
      const shooterDaisGroup = new THREE.Group();
      shooterDaisGroup.position.set(-6.5, 0, 0);
      scene.add(shooterDaisGroup);

      const daisBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(3.2, 3.85, 0.76, 8)),
        obsidianMat
      );
      daisBase.position.y = -0.38;
      daisBase.receiveShadow = !isSoftwareGl;

      const daisTrim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.22, 0.05, 8, 48)),
        voidGlowMat
      );
      daisTrim.rotation.x = Math.PI / 2;

      const daisSigil = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(3.12, 48)),
        trackMat(
          new THREE.MeshBasicMaterial({
            map: sigilTex,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
          })
        )
      );
      daisSigil.rotation.x = -Math.PI / 2;
      daisSigil.position.y = 0.02;

      // 4 Runic Conduit Pylons around Demonis Bastion feeding the Rail-Lance
      const pylonCoreWorldPositions: THREE.Vector3[] = [];
      const pylonCapstones: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const pr = 2.85;
        const pylon = new THREE.Group();
        pylon.position.set(Math.cos(ang) * pr, 0, Math.sin(ang) * pr);

        const pShaft = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.14, 0.23, 2.25, 6)),
          darkSteelMat
        );
        pShaft.position.y = 1.12;

        const pCollar = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.21, 0.028, 6, 16)),
          astralGoldMat
        );
        pCollar.rotation.x = Math.PI / 2;
        pCollar.position.y = 2.02;

        const pCore = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.18, 0)),
          i % 2 === 0 ? voidGlowMat : crimsonEyeMat
        );
        pCore.position.y = 2.48;
        pylonCapstones.push(pCore);

        pylon.add(pShaft, pCollar, pCore);
        shooterDaisGroup.add(pylon);
        shooterDaisGroup.updateMatrixWorld(true);
        const wPos = new THREE.Vector3();
        pCore.getWorldPosition(wPos);
        pylonCoreWorldPositions.push(wPos);
      }
      shooterDaisGroup.add(daisBase, daisTrim, daisSigil);

      // Enemy Obsidian Altar Platform at x = +8.2 (grounded at y = 0)
      const enemyDaisGroup = new THREE.Group();
      enemyDaisGroup.position.set(8.2, 0, 0);
      scene.add(enemyDaisGroup);

      const eDaisBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(3.5, 4.2, 0.76, 8)),
        obsidianMat
      );
      eDaisBase.position.y = -0.38;
      eDaisBase.receiveShadow = !isSoftwareGl;
      const eDaisTrim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.52, 0.05, 8, 48)),
        crimsonEyeMat
      );
      eDaisTrim.rotation.x = Math.PI / 2;
      enemyDaisGroup.add(eDaisBase, eDaisTrim);

      // Shattered Floating Bridge Slabs + Runic Vein Strips spanning the chasm
      const bridgeSlabs: { group: THREE.Group; baseY: number; phase: number }[] = [];
      const slabGeo = trackGeo(new THREE.BoxGeometry(1.45, 0.26, 2.2));
      const crackStripGeo = trackGeo(new THREE.BoxGeometry(1.25, 0.03, 0.11));
      for (let i = 0; i < 4; i++) {
        const slabGroup = new THREE.Group();
        const bx = -2.2 + i * 2.05;
        const by = -0.18 + ((i % 2) * 0.14 - 0.07);
        const bz = ((i % 3) - 1) * 0.45;
        slabGroup.position.set(bx, by, bz);
        slabGroup.rotation.set(((i % 2) - 0.5) * 0.08, (i % 3) * 0.12, ((i % 2) - 0.5) * 0.1);

        const slabMesh = new THREE.Mesh(slabGeo, obsidianMat);
        const crackMesh = new THREE.Mesh(crackStripGeo, i % 2 === 0 ? voidGlowMat : crimsonEyeMat);
        crackMesh.position.y = 0.14;
        slabGroup.add(slabMesh, crackMesh);
        scene.add(slabGroup);
        bridgeSlabs.push({ group: slabGroup, baseY: by, phase: i * 1.4 });
      }

      // Flanking Chasm Obelisk Arches framing the Void Sniper Line
      const archPillarGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.28, 4.4, 6));
      for (const zSide of [-1, 1]) {
        const obelisk = new THREE.Mesh(archPillarGeo, darkSteelMat);
        obelisk.position.set(0.85, 1.1, zSide * 4.4);
        obelisk.rotation.z = zSide * -0.14;
        scene.add(obelisk);
      }

      // 24 Instanced Jagged Void Crystal Monoliths framing the Chasm
      const crystalCount = 24;
      const crystalInstanced = new THREE.InstancedMesh(
        trackGeo(new THREE.ConeGeometry(0.82, 5.2, 5)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.55,
            metalness: 0.45,
            flatShading: true
          })
        ),
        crystalCount
      );
      for (let i = 0; i < crystalCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const px = -12 + i * 1.15;
        const pz = side * (6.2 + (i % 4) * 2.1);
        const sc = 0.72 + ((i * 17) % 8) * 0.14;
        _dummy.position.set(px, sc * 1.9 - 0.9, pz);
        _dummy.rotation.set(((i % 3) - 1) * 0.12, i * 0.7, side * 0.18);
        _dummy.scale.set(0.85 + (i % 3) * 0.18, sc, 0.85);
        _dummy.updateMatrix();
        crystalInstanced.setMatrixAt(i, _dummy.matrix);
        _tmpColor.setHex(i % 4 === 0 ? 0x4c1d95 : i % 2 === 0 ? 0x2e1065 : 0x160a28);
        crystalInstanced.setColorAt(i, _tmpColor);
      }
      if (crystalInstanced.instanceColor) crystalInstanced.instanceColor.needsUpdate = true;
      crystalInstanced.computeBoundingSphere();
      scene.add(crystalInstanced);

      // =========================================================================
      // HERO: Composite 3D Demonis Sovereign — Articulated Arms & Upgraded Rail-Lance
      // =========================================================================
      const demonisGroup = new THREE.Group();
      demonisGroup.position.set(-6.5, 0, 0);
      scene.add(demonisGroup);

      const demonisShadow = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(1.15, 24)),
        contactShadowMat
      );
      demonisShadow.rotation.x = -Math.PI / 2;
      demonisShadow.position.y = 0.028;
      demonisGroup.add(demonisShadow);

      // Armored Greaves & Knee Guards
      const dLegGeo = trackGeo(new THREE.CylinderGeometry(0.13, 0.11, 0.84, 8));
      const dKneeGeo = trackGeo(new THREE.OctahedronGeometry(0.13, 0));
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(dLegGeo, darkSteelMat);
        leg.position.set(0, 0.42, side * 0.22);
        leg.castShadow = !isSoftwareGl;
        const knee = new THREE.Mesh(dKneeGeo, astralGoldMat);
        knee.position.set(0.12, 0.56, side * 0.22);
        demonisGroup.add(leg, knee);
      }

      // Sculpted Abyssal Chestplate & Void Reactor Core
      const dPelvis = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.32, 0.26, 0.34, 8)),
        armorMat
      );
      dPelvis.position.y = 0.96;

      const dTorso = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.42, 0.28, 0.84, 8)),
        armorMat
      );
      dTorso.position.y = 1.48;
      dTorso.castShadow = !isSoftwareGl;

      const dChestCore = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.16, 0)),
        voidGlowMat
      );
      dChestCore.position.set(0.34, 1.54, 0);
      demonisGroup.add(dPelvis, dTorso, dChestCore);

      // Articulated Sniper Arms gripping the Dual-Braced Rail-Lance
      const armSegGeo = trackGeo(new THREE.CylinderGeometry(0.085, 0.072, 0.46, 8));
      const gauntletGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.14, 0.14));
      for (const side of [-1, 1]) {
        const upperArm = new THREE.Mesh(armSegGeo, darkSteelMat);
        upperArm.position.set(0.14, 1.66, side * 0.40);
        upperArm.rotation.z = -Math.PI / 3;
        upperArm.rotation.y = side * -0.35;

        const forearm = new THREE.Mesh(armSegGeo, armorMat);
        forearm.position.set(side === 1 ? 0.46 : 0.78, 1.62, side * 0.22);
        forearm.rotation.z = Math.PI / 2 - 0.12;
        forearm.rotation.y = side * 0.25;

        const gauntlet = new THREE.Mesh(gauntletGeo, astralGoldMat);
        gauntlet.position.set(side === 1 ? 0.62 : 1.04, 1.63, 0.14);
        demonisGroup.add(upperArm, forearm, gauntlet);
      }

      // Flowing Tattered Sovereign Cloak (ExtrudeGeometry)
      const dCapeShape = new THREE.Shape();
      dCapeShape.moveTo(-0.46, 0);
      dCapeShape.lineTo(0.46, 0);
      dCapeShape.lineTo(0.88, -1.66);
      dCapeShape.lineTo(0.32, -1.36);
      dCapeShape.lineTo(0, -1.82);
      dCapeShape.lineTo(-0.32, -1.36);
      dCapeShape.lineTo(-0.88, -1.66);
      dCapeShape.closePath();
      const dCapeMesh = new THREE.Mesh(
        trackGeo(new THREE.ExtrudeGeometry(dCapeShape, { depth: 0.04, bevelEnabled: false })),
        robeMat
      );
      dCapeMesh.rotation.y = -Math.PI / 2;
      dCapeMesh.position.set(-0.32, 1.84, 0);
      dCapeMesh.rotation.z = -0.28;
      demonisGroup.add(dCapeMesh);

      // 6 Unfurling Abyssal Nebula Rift Wings (3 layered pairs)
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(0.84, 0.58, 1.68, 0.26);
      wingShape.quadraticCurveTo(1.06, -0.1, 1.34, -0.38);
      wingShape.quadraticCurveTo(0.56, -0.22, 0, -0.12);
      wingShape.closePath();
      const wingGeo = trackGeo(
        new THREE.ExtrudeGeometry(wingShape, { depth: 0.03, bevelEnabled: false })
      );
      const voidWings: THREE.Mesh[] = [];
      for (const side of [-1, 1]) {
        for (let w = 0; w < 3; w++) {
          const mat = w === 0 ? voidGlowMat : w === 1 ? crimsonEyeMat : astralGoldMat;
          const wing = new THREE.Mesh(wingGeo, mat);
          wing.position.set(-0.34, 1.78 - w * 0.22, side * 0.2);
          wing.rotation.y = Math.PI / 2 + side * (0.42 + w * 0.1);
          const sc = 1.08 - w * 0.2;
          wing.scale.set(sc, sc, 1);
          demonisGroup.add(wing);
          voidWings.push(wing);
        }
      }

      // Horned Sovereign Helm + Sniper Optic Visor + Rotating Double Void Halo
      const dHeadGroup = new THREE.Group();
      dHeadGroup.position.set(0.02, 2.08, 0);
      const dHelm = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(0.24, 0)),
        armorMat
      );
      const dVisor = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.18, 0.075, 0.28)),
        crimsonEyeMat
      );
      dVisor.position.set(0.18, 0.02, 0);
      dHeadGroup.add(dHelm, dVisor);

      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(
          trackGeo(new THREE.ConeGeometry(0.072, 0.62, 6)),
          astralGoldMat
        );
        horn.position.set(-0.04, 0.28, side * 0.2);
        horn.rotation.x = side * -0.42;
        horn.rotation.z = 0.34;
        dHeadGroup.add(horn);

        const pauldron = new THREE.Mesh(
          trackGeo(new THREE.DodecahedronGeometry(0.24, 0)),
          armorMat
        );
        pauldron.position.set(0, 1.82, side * 0.48);
        pauldron.scale.set(1.1, 0.85, 1.25);
        const pSpike = new THREE.Mesh(
          trackGeo(new THREE.ConeGeometry(0.075, 0.44, 5)),
          voidGlowMat
        );
        pSpike.position.set(0, 2.04, side * 0.62);
        pSpike.rotation.x = side * 0.55;
        demonisGroup.add(pauldron, pSpike);
      }
      demonisGroup.add(dHeadGroup);

      const dHaloGroup = new THREE.Group();
      dHaloGroup.position.set(-0.42, 1.92, 0);
      dHaloGroup.rotation.y = Math.PI / 2;
      const dHaloOuter = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.84, 0.036, 8, 40)),
        voidGlowMat
      );
      const dHaloInner = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.54, 0.026, 8, 32)),
        crimsonEyeMat
      );
      dHaloGroup.add(dHaloOuter, dHaloInner);
      demonisGroup.add(dHaloGroup);

      // Dual-Braced Cosmic Void Rail-Lance Sniper Rifle aimed along +X
      const lanceGroup = new THREE.Group();
      lanceGroup.position.set(0.2, 1.66, 0.14);

      const receiver = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.95, 0.24, 0.22)),
        armorMat
      );
      receiver.position.x = 0.35;

      const stockBrace = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.54, 0.16, 0.14)),
        darkSteelMat
      );
      stockBrace.position.set(-0.34, -0.02, 0);

      const railUpper = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.38, 0.08, 0.12)),
        darkSteelMat
      );
      railUpper.position.set(1.56, 0.11, 0);

      const railLower = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.28, 0.08, 0.12)),
        darkSteelMat
      );
      railLower.position.set(1.52, -0.11, 0);

      const lanceCoreRail = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 2.68, 10)),
        voidGlowMat
      );
      lanceCoreRail.rotation.z = -Math.PI / 2;
      lanceCoreRail.position.set(1.44, 0, 0);

      // 4 Beveled Radiator Fins along the Rail-Lance barrel
      const finGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.32, 0.04));
      for (let f = 0; f < 4; f++) {
        const fin = new THREE.Mesh(finGeo, astralGoldMat);
        fin.position.set(1.15 + f * 0.36, 0, 0);
        lanceGroup.add(fin);
      }

      // Holographic Sniper Scope & Glowing Optic Lens
      const scopeTube = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.065, 0.075, 0.65, 10)),
        astralGoldMat
      );
      scopeTube.rotation.z = Math.PI / 2;
      scopeTube.position.set(0.65, 0.24, 0);

      const scopeLens = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(0.056, 16)),
        crimsonEyeMat
      );
      scopeLens.rotation.y = Math.PI / 2;
      scopeLens.position.set(0.98, 0.24, 0);

      const muzzleRings: THREE.Mesh[] = [];
      for (let r = 0; r < 3; r++) {
        const mRing = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.28 - r * 0.05, 0.026, 8, 28)),
          r % 2 === 0 ? crimsonEyeMat : voidGlowMat
        );
        mRing.rotation.y = Math.PI / 2;
        mRing.position.x = 2.48 + r * 0.28;
        lanceGroup.add(mRing);
        muzzleRings.push(mRing);
      }

      const chargeOrbMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf5d0fe,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending
        })
      );
      const chargeOrb = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.2, 18, 18)),
        chargeOrbMat
      );
      chargeOrb.position.x = 2.72;

      lanceGroup.add(
        receiver,
        stockBrace,
        railUpper,
        railLower,
        lanceCoreRail,
        scopeTube,
        scopeLens,
        chargeOrb
      );
      demonisGroup.add(lanceGroup);

      // 6 Orbiting FCD Void Shards funneling energy into the Lance
      const fcdShards: THREE.Mesh[] = [];
      for (let i = 0; i < 6; i++) {
        const shard = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.14, 0)),
          i % 2 === 0 ? voidGlowMat : crimsonEyeMat
        );
        demonisGroup.add(shard);
        fcdShards.push(shard);
      }

      // =========================================================================
      // ENEMY: Composite Abyssal Colossus + Multi-Ring Aegis Barrier + Shatter Shards
      // =========================================================================
      const enemyGroup = new THREE.Group();
      enemyGroup.position.set(8.2, 0, 0);
      scene.add(enemyGroup);

      const enemyShadow = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(1.45, 24)),
        contactShadowMat
      );
      enemyShadow.rotation.x = -Math.PI / 2;
      enemyShadow.position.y = 0.028;
      enemyGroup.add(enemyShadow);

      const enemyMetalMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: targetIsBoss ? 0x3b0a18 : 0x1e293b,
          roughness: 0.36,
          metalness: 0.72
        })
      );
      const enemyCoreMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: 1.4,
          roughness: 0.18
        })
      );

      const eScale = targetIsBoss ? 1.32 : 1.08;
      enemyGroup.scale.setScalar(eScale);

      for (const side of [-1, 1]) {
        const eLeg = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.22, 0.28, 1.15, 8)),
          enemyMetalMat
        );
        eLeg.position.set(0, 0.58, side * 0.35);
        eLeg.castShadow = !isSoftwareGl;

        const eArm = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.32, 0.96, 0.34)),
          enemyMetalMat
        );
        eArm.position.set(-0.24, 1.48, side * 0.96);
        eArm.rotation.z = 0.24;
        enemyGroup.add(eLeg, eArm);
      }

      const eTorso = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(0.76, 0)),
        enemyMetalMat
      );
      eTorso.position.y = 1.66;
      eTorso.scale.set(1.0, 1.16, 1.25);
      eTorso.castShadow = !isSoftwareGl;

      const eHeart = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.28, 0)),
        enemyCoreMat
      );
      eHeart.position.set(-0.62, 1.66, 0);

      const eHead = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(0.34, 0)),
        enemyMetalMat
      );
      eHead.position.y = 2.5;

      enemyGroup.add(eTorso, eHeart, eHead);

      for (const side of [-1, 1]) {
        const eSpike = new THREE.Mesh(
          trackGeo(new THREE.ConeGeometry(0.24, 0.92, 5)),
          enemyMetalMat
        );
        eSpike.position.set(0, 2.22, side * 0.94);
        eSpike.rotation.x = side * 0.65;

        const eEye = new THREE.Mesh(
          trackGeo(new THREE.SphereGeometry(0.068, 8, 8)),
          enemyCoreMat
        );
        eEye.position.set(-0.28, 2.52, side * 0.14);
        enemyGroup.add(eSpike, eEye);
      }

      // Enemy Aegis Barrier Hex-Shield + Outer Orbiting Guard Ring facing Demonis
      const eShieldMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const eShield = new THREE.Mesh(
        trackGeo(new THREE.RingGeometry(0.2, 1.48, 6)),
        eShieldMat
      );
      eShield.rotation.y = -Math.PI / 2;
      eShield.position.set(-1.35, 1.66, 0);
      enemyGroup.add(eShield);

      // 18 Shattering Hex-Shield Shards triggered on impact
      const shieldShardCount = 18;
      const shieldShardMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfb7185,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const shieldShards = new THREE.InstancedMesh(
        trackGeo(new THREE.CircleGeometry(0.24, 3)),
        shieldShardMat,
        shieldShardCount
      );
      shieldShards.frustumCulled = false;
      shieldShards.visible = false;
      scene.add(shieldShards);

      const shardVel: THREE.Vector3[] = [];
      for (let i = 0; i < shieldShardCount; i++) {
        const ang = (i * Math.PI * 2) / shieldShardCount;
        shardVel.push(
          new THREE.Vector3(
            -1.4 - (i % 3) * 0.8,
            Math.sin(ang) * 3.8 + 1.4,
            Math.cos(ang) * 4.2
          )
        );
      }

      // =========================================================================
      // VFX 1: Conduit Lightning + Laser Sight + Trajectory Lock-On Gates + Reticle
      // =========================================================================
      const arcSegments = 12;
      const arcPositions: Float32Array[] = [];
      const arcAttrs: THREE.BufferAttribute[] = [];
      const arcLines: THREE.Line[] = [];
      const arcMatPurple = trackMat(
        new THREE.LineBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const arcMatCrimson = trackMat(
        new THREE.LineBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      for (let i = 0; i < pylonCoreWorldPositions.length; i++) {
        const arr = new Float32Array(arcSegments * 3);
        const attr = new THREE.BufferAttribute(arr, 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        const geo = trackGeo(new THREE.BufferGeometry());
        geo.setAttribute('position', attr);
        const line = new THREE.Line(geo, i % 2 === 0 ? arcMatPurple : arcMatCrimson);
        line.frustumCulled = false;
        scene.add(line);
        arcPositions.push(arr);
        arcAttrs.push(attr);
        arcLines.push(line);
      }

      // 4 Holographic Sniper Rangefinder Lock-On Gates spanning the chasm
      const scopeGateMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xd946ef,
          transparent: true,
          opacity: 0.52,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const scopeGates: THREE.Mesh[] = [];
      for (let g = 0; g < 4; g++) {
        const gate = new THREE.Mesh(
          trackGeo(new THREE.RingGeometry(0.42, 0.49, 6)),
          scopeGateMat
        );
        gate.rotation.y = Math.PI / 2;
        gate.position.set(-1.7 + g * 2.45, 1.66, 0.14);
        scene.add(gate);
        scopeGates.push(gate);
      }

      // Sniper Laser Sight & Ion Beam Wake
      const laserLineGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 11.4, 8));
      laserLineGeo.rotateZ(Math.PI / 2);
      const laserSightMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const laserSightMesh = new THREE.Mesh(laserLineGeo, laserSightMat);
      laserSightMesh.position.set(1.85, 1.66, 0.14);
      scene.add(laserSightMesh);

      const reticleGroup = new THREE.Group();
      reticleGroup.position.set(6.95, 1.66, 0);
      reticleGroup.rotation.y = Math.PI / 2;
      const retMat1 = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const retMat2 = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const retOuter = new THREE.Mesh(trackGeo(new THREE.RingGeometry(1.55, 1.68, 36)), retMat1);
      const retMid = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.95, 1.05, 6)), retMat2);
      const retInner = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.32, 0.4, 24)), retMat1);
      reticleGroup.add(retOuter, retMid, retInner);
      for (let t = 0; t < 4; t++) {
        const ang = (t * Math.PI) / 2;
        const tickMesh = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.1, 0.65)), retMat1);
        tickMesh.position.set(Math.cos(ang) * 1.32, Math.sin(ang) * 1.32, 0);
        tickMesh.rotation.z = ang + Math.PI / 2;
        reticleGroup.add(tickMesh);
      }
      scene.add(reticleGroup);

      // =========================================================================
      // VFX 2: Phase II Hyper-Velocity Void Spear + Helical Ribbons + Mach Wake Rings
      // =========================================================================
      const spearGroup = new THREE.Group();
      spearGroup.position.set(-3.6, 1.66, 0.14);
      spearGroup.visible = false;
      scene.add(spearGroup);

      const spearMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfef9c3,
          emissive: 0xe879f9,
          emissiveIntensity: 1.65,
          roughness: 0.14
        })
      );
      const spearHead = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.32, 2.0, 8)), spearMat);
      spearHead.rotation.z = -Math.PI / 2;
      spearHead.position.x = 0.85;
      spearGroup.add(spearHead);

      const spearTrailGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.36, 4.8, 12));
      spearTrailGeo.rotateZ(Math.PI / 2);
      const spearTrailMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const spearTrail = new THREE.Mesh(spearTrailGeo, spearTrailMat);
      spearTrail.position.x = -2.1;
      spearGroup.add(spearTrail);

      // Twin helical spiral void ribbons around the Spear
      for (let h = 0; h < 2; h++) {
        const pts: THREE.Vector3[] = [];
        for (let s = 0; s <= 28; s++) {
          const t = s / 28;
          const x = -4.2 + t * 5.1;
          const rad = 0.55 * (1 - t * 0.75);
          const ang = t * Math.PI * 5 + h * Math.PI;
          pts.push(new THREE.Vector3(x, Math.cos(ang) * rad, Math.sin(ang) * rad));
        }
        const hCurve = new THREE.CatmullRomCurve3(pts);
        const hMesh = new THREE.Mesh(
          trackGeo(new THREE.TubeGeometry(hCurve, 36, 0.038, 6, false)),
          h === 0 ? voidGlowMat : crimsonEyeMat
        );
        spearGroup.add(hMesh);
      }

      // 6 Mach Shock Rings + Ion Beam Wake across the Chasm
      const wakeMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const ionBeamWake = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 12.2, 12, 1, true)),
        wakeMat
      );
      ionBeamWake.rotation.z = Math.PI / 2;
      ionBeamWake.position.set(2.3, 1.66, 0.14);
      ionBeamWake.visible = false;
      scene.add(ionBeamWake);

      const machRingMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const machRings: THREE.Mesh[] = [];
      for (let i = 0; i < 6; i++) {
        const mr = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.62, 0.035, 8, 28)),
          machRingMat
        );
        mr.rotation.y = Math.PI / 2;
        mr.position.set(-3.2 + i * 2.05, 1.66, 0.14);
        mr.visible = false;
        scene.add(mr);
        machRings.push(mr);
      }

      // =========================================================================
      // VFX 3: Phase III Abyssal Singularity Implosion -> Sky-Rending Detonation
      // =========================================================================
      const explosionGroup = new THREE.Group();
      explosionGroup.position.set(8.2, 1.66, 0);
      explosionGroup.visible = false;
      scene.add(explosionGroup);

      // Dark Singularity Core + Purple-Crimson Fresnel Shock Dome
      const singularitySphere = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.95, 24, 24)),
        eventHorizonMat
      );

      // 16 Gravitational Pull Implosion Streaks converging inward on impact
      const implosionCount = 16;
      const implosionMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const implosionInstanced = new THREE.InstancedMesh(
        trackGeo(new THREE.ConeGeometry(0.055, 1.4, 5)),
        implosionMat,
        implosionCount
      );
      implosionInstanced.frustumCulled = false;
      implosionInstanced.visible = false;
      scene.add(implosionInstanced);

      const implosionDirs: THREE.Vector3[] = [];
      const implosionQuats: THREE.Quaternion[] = [];
      for (let i = 0; i < implosionCount; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / implosionCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        ).normalize();
        implosionDirs.push(dir);
        // Point tip inward toward singularity center
        _tmpVecA.copy(dir).negate();
        implosionQuats.push(new THREE.Quaternion().setFromUnitVectors(_axisY, _tmpVecA));
      }

      const fractureDomeUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const fractureDomeMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: fractureDomeUniforms,
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
              float wave = 0.72 + 0.28 * sin(vLocal.y * 16.0 - uTime * 15.0);
              float intensity = pow(rim, 3.8) * wave * uAlpha;
              vec3 col = mix(vec3(0.64, 0.18, 0.92), vec3(0.96, 0.28, 0.54), pow(rim, 5.2));
              gl_FragColor = vec4(col * intensity, clamp(intensity, 0.0, 1.0));
            }
          `
        })
      );
      const fractureDome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(1, 28, 22)),
        fractureDomeMat
      );

      const abyssalPillarMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const abyssalPillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.65, 1.25, 18, 24, 1, true)),
        abyssalPillarMat
      );
      abyssalPillar.position.y = 7.4;

      const shockRingMatA = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.76,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const shockRingMatB = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0.70,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const shockRingH = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.4, 0.09, 10, 48)),
        shockRingMatA
      );
      shockRingH.rotation.x = Math.PI / 2;
      const shockRingT1 = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.3, 0.075, 10, 40)),
        shockRingMatB
      );
      shockRingT1.rotation.set(0.65, 0.4, 0.25);
      const shockRingT2 = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.3, 0.075, 10, 40)),
        shockRingMatA
      );
      shockRingT2.rotation.set(-0.55, 0.2, 0.7);

      explosionGroup.add(
        singularitySphere,
        fractureDome,
        abyssalPillar,
        shockRingH,
        shockRingT1,
        shockRingT2
      );

      // 24 Radial Void Rift Slash Needles bursting outward from Detonation
      const needleCount = 24;
      const needleMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.86,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const needleInstanced = new THREE.InstancedMesh(
        trackGeo(new THREE.ConeGeometry(0.085, 2.4, 5)),
        needleMat,
        needleCount
      );
      needleInstanced.frustumCulled = false;
      needleInstanced.visible = false;
      scene.add(needleInstanced);

      const needleDirs: THREE.Vector3[] = [];
      const needleQuats: THREE.Quaternion[] = [];
      for (let i = 0; i < needleCount; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / needleCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.abs(Math.cos(phi)) * 0.8 + 0.1,
          Math.sin(phi) * Math.sin(theta)
        ).normalize();
        needleDirs.push(dir);
        needleQuats.push(new THREE.Quaternion().setFromUnitVectors(_axisY, dir));
        _tmpColor.setHex(i % 3 === 0 ? 0xf5d0fe : i % 2 === 0 ? 0xa855f7 : 0xf43f5e);
        needleInstanced.setColorAt(i, _tmpColor);
      }
      if (needleInstanced.instanceColor) needleInstanced.instanceColor.needsUpdate = true;

      // 240 Blast Debris & Void Spark Particles (in-place BufferAttribute update)
      const sparkCount = 240;
      const sparkPos = new Float32Array(sparkCount * 3);
      const sparkVel = new Float32Array(sparkCount * 3);
      const sparkCol = new Float32Array(sparkCount * 3);
      const sparkPalette = [0xe879f9, 0xa855f7, 0xf43f5e, 0xfef08a, 0xc084fc];
      for (let i = 0; i < sparkCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const spd = 4.5 + Math.random() * 14.5;
        sparkPos[i * 3] = 8.2;
        sparkPos[i * 3 + 1] = 1.66;
        sparkPos[i * 3 + 2] = 0;
        sparkVel[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
        sparkVel[i * 3 + 1] = Math.abs(Math.cos(phi)) * spd * 0.85 + 1.5;
        sparkVel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * spd;
        _tmpColor.setHex(sparkPalette[i % sparkPalette.length]);
        sparkCol[i * 3] = _tmpColor.r;
        sparkCol[i * 3 + 1] = _tmpColor.g;
        sparkCol[i * 3 + 2] = _tmpColor.b;
      }
      const sparkGeo = trackGeo(new THREE.BufferGeometry());
      const sparkPosAttr = new THREE.BufferAttribute(sparkPos, 3);
      sparkGeo.setAttribute('position', sparkPosAttr);
      sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
      const sparkMat = trackMat(
        new THREE.PointsMaterial({
          size: 0.2,
          vertexColors: true,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
      scene.add(sparkPoints);

      // =========================================================================
      // GPU POST-PROCESSING (Subtle Bokeh DOF + Calibrated Bloom + Split-Tone Grade)
      // =========================================================================
      let composer: EffectComposer | null = null;
      let renderPass: RenderPass | null = null;
      let bokehPass: BokehPass | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let shockPass: ShaderPass | null = null;
      let outputPass: OutputPass | null = null;

      const shockUniforms = {
        tDiffuse: { value: null },
        uAberration: { value: 0.0009 },
        uShockWave: { value: 0 },
        uShockRadius: { value: 0 },
        uAnamorphic: { value: 0.045 },
        uFlash: { value: 0 },
        uVignette: { value: 0.30 },
        uContrast: { value: 1.05 },
        uSaturation: { value: 1.06 },
        uJudgementGrade: { value: 0 }
      };

      const depthHiddenObjects: THREE.Object3D[] = [
        photonRimSphere,
        bhAccretionDisk,
        chasmVoidFloor,
        eShield,
        shieldShards,
        laserSightMesh,
        reticleGroup,
        spearTrail,
        ionBeamWake,
        fractureDome,
        abyssalPillar,
        shockRingH,
        shockRingT1,
        shockRingT2,
        needleInstanced,
        implosionInstanced,
        sparkPoints,
        ...scopeGates,
        ...machRings
      ];
      const depthHiddenPrev: boolean[] = new Array(depthHiddenObjects.length).fill(false);

      if (!isSoftwareGl) {
        const initW = window.innerWidth;
        const initH = Math.max(1, window.innerHeight);
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);

        bokehPass = new BokehPass(scene, camera, {
          focus: 5.5,
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

        bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.18, 0.25, 1.12);
        shockPass = new ShaderPass({
          uniforms: shockUniforms,
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
            uniform float uAnamorphic;
            uniform float uFlash;
            uniform float uVignette;
            uniform float uContrast;
            uniform float uSaturation;
            uniform float uJudgementGrade;
            varying vec2 vUv;

            void main() {
              vec2 center = vec2(0.5, 0.5);
              vec2 toCenter = vUv - center;
              float dist = length(toCenter);
              vec2 dir = dist > 0.0001 ? toCenter / dist : vec2(0.0);

              // Radial Dimensional Shockwave Ripple
              float ringDiff = dist - uShockRadius;
              float ringBand = exp(-ringDiff * ringDiff * 165.0) * uShockWave;
              vec2 uv = clamp(vUv - dir * ringBand * 0.024, 0.001, 0.999);

              // Radial Chromatic Aberration
              vec2 caOffset = dir * uAberration * (0.34 + dist * 1.15 + ringBand * 1.45);
              float r = texture2D(tDiffuse, clamp(uv + caOffset, 0.001, 0.999)).r;
              float g = texture2D(tDiffuse, uv).g;
              float b = texture2D(tDiffuse, clamp(uv - caOffset, 0.001, 0.999)).b;
              vec3 col = vec3(r, g, b);

              // Crisp Horizontal Void-Magenta Anamorphic Lens Streak
              float hBand = exp(-abs(vUv.y - 0.5) * 48.0) * exp(-abs(vUv.x - 0.5) * 3.2);
              col += vec3(0.84, 0.24, 0.92) * hBand * uAnamorphic;

              // Impact Shockwave Rim
              col += vec3(0.92, 0.36, 0.64) * ringBand * 0.14;

              // Controlled Impact Pulse
              col += vec3(0.76, 0.44, 0.94) * uFlash;

              // Linear Split-Tone Color Grading (astral-violet shadows + crimson-amber highlights)
              float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
              float shadowW = 1.0 - smoothstep(0.04, 0.34, luma);
              float highW = smoothstep(0.32, 0.95, luma);

              vec3 shadowTint = mix(vec3(0.96, 0.94, 1.07), vec3(1.01, 0.92, 1.06), uJudgementGrade);
              vec3 highTint = mix(vec3(1.01, 0.98, 1.04), vec3(1.05, 0.96, 0.97), uJudgementGrade);
              col *= mix(vec3(1.0), shadowTint, shadowW * 0.5);
              col *= mix(vec3(1.0), highTint, highW * 0.6);

              float postLuma = dot(col, vec3(0.2126, 0.7152, 0.0722));
              col = mix(vec3(postLuma), col, uSaturation);
              col = max(vec3(0.0), (col - 0.18) * uContrast + 0.18);

              // Cinematic Vignette
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
        composer.addPass(shockPass);
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
      let lastTime = performance.now();
      let lastUiPhase: CutscenePhase = 'aiming';
      let lastUiPct = -1;
      let climaxBeatTriggered = false;

      // Smoothly damped post-FX & camera state
      let currentRoll = 0;
      let smoothedBloomStrength = 0.18;
      let smoothedBloomRadius = 0.25;
      let smoothedDofFocus = 5.5;
      let smoothedDofAperture = 0.00016;
      let smoothedDofMaxBlur = 0.0038;
      let smoothedAberration = 0.0009;
      let smoothedAnamorphic = 0.045;
      let smoothedVignette = 0.30;
      let smoothedShooterLight = 5.2;
      let smoothedImpactLight = 3.8;

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
        const elapsedSec = now * 0.001;

        const sinceSync = (now - lastSyncTimeRef.current) / 1000;
        const liveRemaining = Math.max(0, remainingRef.current - sinceSync);
        const progress = Math.max(0, Math.min(1, 1 - liveRemaining / Math.max(0.1, totalDuration)));
        const elapsed = progress * totalDuration;

        const nextPhase: CutscenePhase =
          progress < 0.34
            ? 'aiming'
            : progress < 0.62
              ? 'launch'
              : progress < 0.88
                ? 'explosion'
                : 'return';
        if (nextPhase !== lastUiPhase) {
          lastUiPhase = nextPhase;
          setPhase(nextPhase);
        }
        const pctInt = Math.round(progress * 100);
        if (Math.abs(pctInt - lastUiPct) >= 1) {
          lastUiPct = pctInt;
          setUiProgress(pctInt);
        }

        // Brief React climax pulse synced at exact Phase III detonation (0.62)
        if (!climaxBeatTriggered && progress >= 0.62) {
          climaxBeatTriggered = true;
          setClimaxFlash(true);
          flashTimeout = window.setTimeout(() => setClimaxFlash(false), 160);
        }

        // Update background sky, blackhole vortex & abyss river shaders
        skyUniforms.uTime.value = elapsedSec;
        skyUniforms.uEnergy.value = progress < 0.34 ? 0.32 : progress < 0.62 ? 0.62 : 0.82;
        abyssRiverUniforms.uTime.value = elapsedSec;
        abyssRiverUniforms.uSurge.value = progress < 0.62 ? 0.42 : 0.82;
        photonRimUniforms.uTime.value = elapsedSec;
        photonRimUniforms.uSurge.value = progress < 0.62 ? 0.52 : 0.92;
        accretionShaderUniforms.uTime.value = elapsedSec;
        accretionShaderUniforms.uIntensity.value = progress < 0.62 ? 0.58 : 0.88;
        bhAccretionDisk.rotation.z += dt * (progress >= 0.62 ? 0.85 : 0.45);
        bhOrbitRing.rotation.z -= dt * (progress >= 0.62 ? 1.15 : 0.65);

        // Orbiting Void Asteroids around the Blackhole
        for (let i = 0; i < asteroidCount; i++) {
          const d = bhAsteroidData[i];
          const a = d.ang + elapsedSec * (0.25 + (i % 3) * 0.08);
          _dummy.position.set(
            Math.cos(a) * d.rad,
            d.y + Math.sin(a * 2) * 0.25,
            Math.sin(a) * d.rad * 0.48
          );
          _dummy.rotation.set(elapsedSec + i, a, i);
          _dummy.scale.setScalar(0.7 + (i % 4) * 0.24);
          _dummy.updateMatrix();
          bhAsteroids.setMatrixAt(i, _dummy.matrix);
        }
        bhAsteroids.instanceMatrix.needsUpdate = true;

        // Floating chasm bridge slabs & pylon crystals
        for (let i = 0; i < bridgeSlabs.length; i++) {
          const b = bridgeSlabs[i];
          b.group.position.y = b.baseY + Math.sin(elapsedSec * 2.1 + b.phase) * 0.08;
        }
        for (let i = 0; i < pylonCapstones.length; i++) {
          pylonCapstones[i].rotation.y += dt * 2.6;
          pylonCapstones[i].position.y = 2.48 + Math.sin(elapsedSec * 3.2 + i) * 0.08;
        }

        // Demonis ambient animation (6 wings, cloak, halo)
        dHaloOuter.rotation.z = elapsed * 1.4;
        dHaloInner.rotation.z = -elapsed * 2.2;
        dCapeMesh.rotation.z = -0.28 + Math.sin(elapsed * 7.5) * 0.06;
        for (let w = 0; w < voidWings.length; w++) {
          const side = w < 3 ? -1 : 1;
          const idx = w % 3;
          voidWings[w].rotation.z =
            (0.22 - idx * 0.24) + Math.sin(elapsed * 6.5 + w) * 0.07 * side;
        }

        // Orbiting FCD Shards funnel into Lance Muzzle during Phase I -> Phase II
        const funnelT = THREE.MathUtils.smoothstep(progress, 0.12, 0.36);
        for (let i = 0; i < fcdShards.length; i++) {
          const ang = elapsed * 3.8 + (i * Math.PI * 2) / fcdShards.length;
          const orbR = THREE.MathUtils.lerp(1.55, 0.26, funnelT);
          const ox = THREE.MathUtils.lerp(0, 2.7, funnelT);
          fcdShards[i].position.set(
            ox + Math.cos(ang) * orbR * 0.55,
            1.66 + Math.sin(ang) * orbR,
            Math.cos(ang + 1.2) * orbR * 0.65
          );
          fcdShards[i].rotation.y = elapsed * 4.5 + i;
          fcdShards[i].rotation.x = elapsed * 3.2;
        }

        // Spin Rail-Lance Muzzle Accelerator Rings
        const ringSpin = progress < 0.34 ? 2.5 + progress * 12 : 8.0;
        for (let r = 0; r < muzzleRings.length; r++) {
          muzzleRings[r].rotation.z += dt * ringSpin * (r % 2 === 0 ? 1 : -1);
          const lockScale = progress < 0.34 ? 1.25 - funnelT * 0.3 : 0.95;
          muzzleRings[r].scale.setScalar(lockScale);
        }

        // Lightning conduit arcs from 4 Bastion Pylons into Lance Muzzle
        if (progress < 0.44) {
          lanceGroup.updateMatrixWorld(true);
          chargeOrb.getWorldPosition(_tmpVecA);
          for (let i = 0; i < pylonCoreWorldPositions.length; i++) {
            arcLines[i].visible = progress > 0.05;
            const src = pylonCoreWorldPositions[i];
            const arr = arcPositions[i];
            for (let s = 0; s < arcSegments; s++) {
              const t = s / (arcSegments - 1);
              const env = Math.sin(t * Math.PI);
              const jx = Math.sin(elapsedSec * 48 + i * 3.1 + s * 2.4) * 0.22 * env;
              const jy = Math.cos(elapsedSec * 42 + i * 4.3 + s * 2.8) * 0.26 * env;
              const jz = Math.sin(elapsedSec * 38 + i * 5.2 + s * 2.1) * 0.22 * env;
              arr[s * 3] = src.x + (_tmpVecA.x - src.x) * t + jx;
              arr[s * 3 + 1] = src.y + (_tmpVecA.y - src.y) * t + jy;
              arr[s * 3 + 2] = src.z + (_tmpVecA.z - src.z) * t + jz;
            }
            arcAttrs[i].needsUpdate = true;
          }
          arcMatPurple.opacity =
            progress < 0.34 ? 0.52 + funnelT * 0.34 : 0.86 * (1 - (progress - 0.34) / 0.1);
          arcMatCrimson.opacity = arcMatPurple.opacity;
        } else {
          for (let i = 0; i < arcLines.length; i++) arcLines[i].visible = false;
        }

        // Dynamic target parameters for smoothed post-FX, lights, and FOV
        let targetFov = 46;
        let targetRoll = 0;
        let targetBloomStrength = 0.18;
        let targetBloomRadius = 0.25;
        let targetDofAperture = 0.00016;
        let targetDofMaxBlur = 0.0038;
        let targetAberration = 0.0008;
        let targetAnamorphic = 0.045;
        let targetVignette = 0.30;
        let targetShooterLight = 5.2;
        let targetImpactLight = 3.8;
        let shockWave = 0;
        let shockRadius = 0;
        let postFlash = 0;

        // Phase I: Aiming, Lock-On Gates & Reticle Convergence
        const aimT = THREE.MathUtils.clamp(progress / 0.34, 0, 1);
        const chargeScale = 0.55 + THREE.MathUtils.smoothstep(progress, 0.05, 0.35) * 1.75;
        chargeOrb.scale.setScalar(
          progress < 0.4 ? chargeScale : Math.max(0.01, (0.46 - progress) * 10)
        );

        const gateSnap = THREE.MathUtils.smoothstep(progress, 0.05, 0.33);
        for (let g = 0; g < scopeGates.length; g++) {
          scopeGates[g].visible = progress < 0.62;
          const baseScale = THREE.MathUtils.lerp(1.85, 0.88, gateSnap);
          scopeGates[g].scale.setScalar(baseScale);
          scopeGates[g].rotation.z = (elapsed * (1.8 + g * 0.5)) * (g % 2 === 0 ? 1 : -1);
        }
        scopeGateMat.opacity = progress < 0.34 ? 0.32 + gateSnap * 0.36 : 0.42 * (1 - (progress - 0.34) / 0.28);

        const lockTighten = THREE.MathUtils.lerp(1.95, 0.82, gateSnap);
        reticleGroup.visible = progress < 0.64;
        reticleGroup.scale.setScalar(lockTighten);
        retOuter.rotation.z = elapsed * 1.9;
        retMid.rotation.z = -elapsed * 2.8;
        retInner.rotation.z = elapsed * 3.8;

        laserSightMesh.visible = progress < 0.38;
        laserSightMat.opacity = 0.38 + 0.38 * Math.sin(elapsed * 20);

        if (progress < 0.34) {
          targetFov = 46 - aimT * 6.5;
          targetRoll = THREE.MathUtils.lerp(0.0, -0.022, aimT);
          targetBloomStrength = 0.17 + aimT * 0.06;
          targetBloomRadius = 0.24 + aimT * 0.04;
          targetAberration = 0.0008 + aimT * 0.0007;
          targetAnamorphic = 0.045 + aimT * 0.045;
          targetShooterLight = 5.2 + aimT * 2.6;
          skyUniforms.uFlash.value = 0;
          _focusTarget.set(-5.8, 1.66, 0.14);
        }

        // Phase II: Hyper-Velocity Void Annihilation Spear Launch (0.34 -> 0.62)
        if (progress >= 0.34 && progress < 0.64) {
          const flyT = (progress - 0.34) / 0.28;
          const easedFly = flyT * flyT * (2.5 - 1.5 * flyT);
          const spearX = THREE.MathUtils.lerp(-3.6, 8.0, Math.min(1, easedFly));

          spearGroup.visible = true;
          spearGroup.position.x = spearX;
          spearGroup.rotation.x = elapsed * 11;

          // Demonis recoil kick on firing
          const recoil = Math.max(0, 1 - flyT * 3.2);
          demonisGroup.position.x = -6.5 - recoil * 0.35;
          lanceGroup.position.x = 0.2 - recoil * 0.22;

          // Ion beam wake + expanding Mach shock rings along flight path
          ionBeamWake.visible = true;
          wakeMat.opacity = Math.max(0.16, 0.48 * (1 - flyT * 0.55));
          for (let i = 0; i < machRings.length; i++) {
            const passed = spearX > machRings[i].position.x;
            machRings[i].visible = passed;
            if (passed) {
              const age = Math.min(1, (spearX - machRings[i].position.x) / 4.5);
              machRings[i].scale.setScalar(0.85 + age * 1.45);
            }
          }

          targetShooterLight = 9.2;
          targetFov = 48.5;
          targetRoll = THREE.MathUtils.lerp(-0.022, 0.028, flyT);
          targetBloomStrength = 0.24;
          targetBloomRadius = 0.28;
          targetAberration = 0.0017;
          targetAnamorphic = 0.095;
          targetDofAperture = 0.00018;
          skyUniforms.uFlash.value = 0.04;
          _focusTarget.set(spearX, 1.66, 0.14);
        } else {
          spearGroup.visible = false;
          demonisGroup.position.x = -6.5;
          lanceGroup.position.x = 0.2;
          if (progress < 0.34) {
            ionBeamWake.visible = false;
            for (let i = 0; i < machRings.length; i++) machRings[i].visible = false;
          }
        }

        // Phase III & IV: Singularity Implosion -> Cataclysmic Detonation (0.62 -> 1.0)
        if (progress >= 0.62) {
          const expT = (progress - 0.62) / 0.38;
          const implosionT = Math.min(1, expT / 0.12);
          const burst = THREE.MathUtils.smoothstep(expT, 0.08, 0.34);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(expT, 0.44, 1.0);

          // Wake dissolves shortly after impact
          ionBeamWake.visible = expT < 0.35;
          wakeMat.opacity = Math.max(0, 0.42 * (1 - expT / 0.35));
          for (let i = 0; i < machRings.length; i++) {
            machRings[i].visible = expT < 0.28;
          }

          explosionGroup.visible = fadeOut > 0.01;
          const singScale =
            expT < 0.12 ? 1.5 - implosionT * 0.95 : 0.55 + burst * 2.1 * fadeOut;
          singularitySphere.scale.setScalar(Math.max(0.05, singScale));

          // Gravitational pull streaks converging inward right before blast
          implosionInstanced.visible = expT < 0.16;
          if (implosionInstanced.visible) {
            const pullT = Math.min(1, expT / 0.14);
            const rDist = THREE.MathUtils.lerp(4.4, 0.45, pullT);
            for (let i = 0; i < implosionCount; i++) {
              _tmpVecA.copy(implosionDirs[i]).multiplyScalar(rDist);
              _dummy.position.set(8.2 + _tmpVecA.x, 1.66 + _tmpVecA.y, _tmpVecA.z);
              _dummy.quaternion.copy(implosionQuats[i]);
              _dummy.scale.set(1, 0.8 + (1 - pullT) * 1.1, 1);
              _dummy.updateMatrix();
              implosionInstanced.setMatrixAt(i, _dummy.matrix);
            }
            implosionInstanced.instanceMatrix.needsUpdate = true;
            implosionMat.opacity = (1 - pullT) * 0.85;
          }

          fractureDome.scale.setScalar(0.8 + burst * 8.2);
          fractureDomeUniforms.uTime.value = elapsedSec;
          fractureDomeUniforms.uAlpha.value = fadeOut * 0.48;

          const pScale = expT < 0.18 ? 0.3 + (expT / 0.18) * 0.9 : Math.max(0.15, 1.2 - expT * 0.9);
          abyssalPillar.scale.set(pScale, 1, pScale);
          abyssalPillarMat.opacity = expT < 0.18 ? 0.36 : Math.max(0, 0.36 * fadeOut);

          shockRingH.scale.setScalar(0.6 + expT * 8.6);
          shockRingT1.scale.setScalar(0.5 + expT * 7.4);
          shockRingT2.scale.setScalar(0.5 + expT * 6.8);
          shockRingMatA.opacity = fadeOut * 0.68;
          shockRingMatB.opacity = fadeOut * 0.60;

          // Shattering Hex-Shield Shards burst outward
          shieldShards.visible = expT < 0.55;
          if (shieldShards.visible) {
            const st = expT * 1.15;
            for (let i = 0; i < shieldShardCount; i++) {
              const v = shardVel[i];
              _dummy.position.set(
                8.2 - 1.35 + v.x * st,
                Math.max(0.06, 1.66 + v.y * st - 4.8 * st * st),
                v.z * st
              );
              _dummy.rotation.set(elapsed * 8 + i, elapsed * 6 - i, i);
              _dummy.scale.setScalar(Math.max(0.1, 1.1 - expT * 1.5));
              _dummy.updateMatrix();
              shieldShards.setMatrixAt(i, _dummy.matrix);
            }
            shieldShards.instanceMatrix.needsUpdate = true;
            shieldShardMat.opacity = Math.max(0, 0.82 * (1 - expT / 0.55));
          }

          eShieldMat.opacity = Math.max(0, 0.28 * (1 - implosionT * 2.5));
          eShield.scale.setScalar(1 + implosionT * 0.75);
          enemyGroup.position.x = 8.2 + Math.min(2.4, expT * 3.5);
          enemyGroup.rotation.z = -Math.min(0.55, expT * 1.1);
          enemyGroup.scale.setScalar(
            Math.max(0.01, eScale * (1 - THREE.MathUtils.smoothstep(expT, 0.14, 0.62)))
          );

          // 24 Radial Void Rift Needles
          needleInstanced.visible = fadeOut > 0.05;
          if (needleInstanced.visible) {
            const nDist = 0.8 + burst * 7.2;
            for (let i = 0; i < needleCount; i++) {
              _tmpVecA.copy(needleDirs[i]).multiplyScalar(nDist);
              _dummy.position.set(8.2 + _tmpVecA.x, 1.66 + _tmpVecA.y, _tmpVecA.z);
              _dummy.quaternion.copy(needleQuats[i]);
              _dummy.scale.set(1, 0.8 + burst * 0.8, 1);
              _dummy.updateMatrix();
              needleInstanced.setMatrixAt(i, _dummy.matrix);
            }
            needleInstanced.instanceMatrix.needsUpdate = true;
            needleMat.opacity = fadeOut * 0.74;
          }

          // Explosive blast particles
          sparkMat.opacity = fadeOut * 0.88;
          const sArr = sparkPosAttr.array as Float32Array;
          const simExpTime = expT * (totalDuration * 0.38);
          for (let i = 0; i < sparkCount; i++) {
            const vx = sparkVel[i * 3];
            const vy = sparkVel[i * 3 + 1];
            const vz = sparkVel[i * 3 + 2];
            sArr[i * 3] = 8.2 + vx * simExpTime;
            sArr[i * 3 + 1] = Math.max(0.08, 1.66 + vy * simExpTime - 4.2 * simExpTime * simExpTime);
            sArr[i * 3 + 2] = vz * simExpTime;
          }
          sparkPosAttr.needsUpdate = true;

          targetImpactLight = 4.5 + burst * 8.2 * fadeOut;

          const impactPulse = Math.max(0, 1 - expT / 0.45);
          targetFov =
            expT < 0.18
              ? 48.5 + (expT / 0.18) * 6.8
              : 55.3 - Math.min(1, (expT - 0.18) / 0.82) * 8.3;
          targetRoll = THREE.MathUtils.lerp(0.025, 0.0, Math.min(1, expT * 1.8));
          targetBloomStrength = 0.21 + impactPulse * 0.08;
          targetBloomRadius = 0.26 + impactPulse * 0.06;
          targetAberration = 0.001 + impactPulse * 0.0026;
          targetAnamorphic = 0.055 + impactPulse * 0.08;
          targetVignette = 0.30 + impactPulse * 0.08;
          targetDofAperture = 0.00014;
          targetDofMaxBlur = 0.0032;
          shockWave = expT < 0.65 ? Math.max(0, 1 - expT / 0.65) : 0;
          shockRadius = 0.05 + expT * 1.15;
          postFlash = expT > 0.07 && expT < 0.16 ? (1 - Math.abs(expT - 0.11) / 0.05) * 0.08 : 0;
          skyUniforms.uFlash.value = expT < 0.2 ? (1 - expT / 0.2) * 0.14 : 0;
          _focusTarget.set(8.2, 1.66, 0);
        } else {
          explosionGroup.visible = false;
          implosionInstanced.visible = false;
          shieldShards.visible = false;
          needleInstanced.visible = false;
          sparkMat.opacity = 0;
          targetImpactLight = 3.8 + aimT * 2.2;
          enemyGroup.position.x = 8.2;
          enemyGroup.rotation.z = 0;
          enemyGroup.scale.setScalar(eScale);
          eShieldMat.opacity = 0.26 + Math.sin(elapsedSec * 5) * 0.05;
          eShield.scale.setScalar(1);
        }

        // 4-Phase Cinematic Camera Choreography
        if (progress < 0.34) {
          const t1 = progress / 0.34;
          _camTarget.set(-9.6 + t1 * 1.15, 2.55 - t1 * 0.22, 2.55 - t1 * 0.55);
          _lookTarget.set(THREE.MathUtils.lerp(3.5, 8.0, t1), 1.68, 0);
        } else if (progress < 0.62) {
          const t2 = (progress - 0.34) / 0.28;
          _camTarget.set(
            THREE.MathUtils.lerp(-6.0, 3.8, t2),
            THREE.MathUtils.lerp(2.65, 3.5, t2),
            6.4 - t2 * 1.4
          );
          _lookTarget.set(THREE.MathUtils.lerp(-1.2, 8.2, t2), 1.66, 0);
        } else if (progress < 0.88) {
          const t3 = (progress - 0.62) / 0.26;
          const shake = Math.max(0, 1 - t3 * 1.4) * 0.32;
          _camTarget.set(
            2.5 + Math.sin(elapsed * 42) * shake,
            3.75 + t3 * 1.35 + Math.cos(elapsed * 37) * shake,
            8.4 + t3 * 2.2
          );
          _lookTarget.set(8.2, 1.78, 0);
        } else {
          const t4 = (progress - 0.88) / 0.12;
          _camTarget.set(
            THREE.MathUtils.lerp(2.5, 0.5, t4),
            THREE.MathUtils.lerp(5.1, 8.4, t4),
            THREE.MathUtils.lerp(10.6, 13.4, t4)
          );
          _lookTarget.set(THREE.MathUtils.lerp(8.2, 1.0, t4), 1.25, 0);
        }

        const dampAlpha = 1 - Math.exp(-6.5 * dt);
        const fxAlpha = 1 - Math.exp(-9.0 * dt);
        camera.position.lerp(_camTarget, dampAlpha);
        _currentLook.lerp(_lookTarget, dampAlpha);
        camera.lookAt(_currentLook);
        currentRoll += (targetRoll - currentRoll) * dampAlpha;
        camera.rotateZ(currentRoll);

        const nextFov = camera.fov + (targetFov - camera.fov) * dampAlpha;
        if (Math.abs(nextFov - camera.fov) > 0.015) {
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }

        // Smooth lights & post-processing uniforms
        smoothedShooterLight += (targetShooterLight - smoothedShooterLight) * fxAlpha;
        smoothedImpactLight += (targetImpactLight - smoothedImpactLight) * fxAlpha;
        shooterLight.intensity = smoothedShooterLight;
        impactLight.intensity = smoothedImpactLight;

        const targetFocusDist = Math.max(2.5, Math.min(24.0, camera.position.distanceTo(_focusTarget)));
        smoothedDofFocus += (targetFocusDist - smoothedDofFocus) * fxAlpha;
        smoothedDofAperture += (targetDofAperture - smoothedDofAperture) * fxAlpha;
        smoothedDofMaxBlur += (targetDofMaxBlur - smoothedDofMaxBlur) * fxAlpha;
        smoothedBloomStrength += (targetBloomStrength - smoothedBloomStrength) * fxAlpha;
        smoothedBloomRadius += (targetBloomRadius - smoothedBloomRadius) * fxAlpha;
        smoothedAberration += (targetAberration - smoothedAberration) * fxAlpha;
        smoothedAnamorphic += (targetAnamorphic - smoothedAnamorphic) * fxAlpha;
        smoothedVignette += (targetVignette - smoothedVignette) * fxAlpha;

        if (composer && bloomPass && bokehPass) {
          const bokehUniforms = bokehPass.uniforms as Record<string, THREE.IUniform<number>>;
          bokehUniforms.focus.value = smoothedDofFocus;
          bokehUniforms.aperture.value = smoothedDofAperture;
          bokehUniforms.maxblur.value = smoothedDofMaxBlur;

          bloomPass.strength = smoothedBloomStrength;
          bloomPass.radius = smoothedBloomRadius;

          shockUniforms.uAberration.value = smoothedAberration;
          shockUniforms.uShockWave.value = shockWave;
          shockUniforms.uShockRadius.value = shockRadius;
          shockUniforms.uAnamorphic.value = smoothedAnamorphic;
          shockUniforms.uFlash.value = postFlash;
          shockUniforms.uVignette.value = smoothedVignette;
          shockUniforms.uJudgementGrade.value = THREE.MathUtils.smoothstep(progress, 0.56, 0.72);
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
        window.clearTimeout(flashTimeout);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        renderPass?.dispose();
        bokehPass?.dispose();
        bloomPass?.dispose();
        shockPass?.dispose();
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
      window.clearTimeout(flashTimeout);
      renderer?.dispose();
      canvas.remove();
      onFallbackRef.current?.();
      return undefined;
    }
  }, [targetIsBoss, totalDuration]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#030109] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D Demonis Abyssal Judgement"
    >
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Subtle Phase III Detonation Climax Accent Overlay */}
      <div
        className={`pointer-events-none fixed inset-0 bg-fuchsia-400/20 transition-opacity duration-150 ${
          climaxFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Cinematic Letterbox Header (solid dark fill, zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#080214]/94 border-b border-fuchsia-500/40 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-game tracking-[0.22em] uppercase text-fuchsia-300 flex items-center gap-2 truncate">
            <Crosshair className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Demonis · Abyssal Singularity Chasm</span>
          </p>
          <h2 className="font-title text-lg sm:text-2xl font-black tracking-wider text-white truncate">
            VOID ANNIHILATION SNIPER
          </h2>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300/90">
            TARGET TERKUNCI
          </span>
          <span className="font-title text-sm font-black text-amber-200">
            {targetName}
          </span>
        </div>
      </div>

      {/* Bottom Controls & Progress */}
      <div className="absolute inset-x-0 bottom-0 bg-[#080214]/94 border-t border-fuchsia-500/40 px-5 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <p className="pointer-events-none text-[11px] sm:text-xs font-game text-purple-200/90 tracking-wide truncate">
          {PHASE_LABELS[phase]} · {uiProgress}%
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-slate-950 hover:bg-purple-950 border border-fuchsia-400/60 hover:border-fuchsia-300 text-slate-100 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-fuchsia-300" />
        </button>

        {/* Bottom Progress Bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-fuchsia-400 to-purple-400 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
