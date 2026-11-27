import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FastForward } from 'lucide-react';

interface SolarisSupernova3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutscenePhase = 'eclipse' | 'incarnation' | 'supernova';

const PHASE_LABELS: Record<CutscenePhase, string> = {
  eclipse: 'FASE I · GERHANA SANCTUM IGNIS AURELIA & TARIKAN GRAVITASI INTI BINTANG',
  incarnation: 'FASE II · SAYAP NAGA SURYA & PILAR LAHAR MELETUS — INKARNASI AVATAR',
  supernova: 'FASE III · HANTAMAN TOMBAK MATAHARI — LEDAKAN SUPERNOVA & HUJAN METEOR!'
};

// Pre-allocated module-scope scratch helpers (zero GC inside render loop)
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 1.5, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();
const _axisY = new THREE.Vector3(0, 1, 0);

export const SolarisSupernova3DCutscene: React.FC<SolarisSupernova3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 4.8,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [phase, setPhase] = useState<CutscenePhase>('eclipse');
  const [uiProgress, setUiProgress] = useState<number>(0);

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const testGl =
        canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' }) ||
        canvas.getContext('webgl', { antialias: true, powerPreference: 'high-performance' });
      if (!testGl) {
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
      renderer.toneMappingExposure = 0.80;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setSize(window.innerWidth, window.innerHeight, false);

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
      scene.background = new THREE.Color(0x0b0202);
      scene.fog = new THREE.FogExp2(0x1b0502, 0.024);

      const camera = new THREE.PerspectiveCamera(
        48,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        140
      );
      camera.position.set(1.9, 1.0, 5.5);
      _currentLook.set(0, 1.65, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.45;
      disposables.push(envRT, roomEnv, pmrem);

      // Dramatic Solar Eclipse & Caldera Lighting Rig (balanced contrast)
      const hemiLight = new THREE.HemisphereLight(0xfb923c, 0x160402, 0.52);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfef08a, 1.42);
      keyLight.position.set(4.5, 8.8, 5.8);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 32;
        keyLight.shadow.camera.left = -9;
        keyLight.shadow.camera.right = 9;
        keyLight.shadow.camera.top = 9;
        keyLight.shadow.camera.bottom = -9;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const backEclipseRim = new THREE.PointLight(0xf97316, 6.8, 36, 1.55);
      backEclipseRim.position.set(0, 3.6, -4.4);
      scene.add(backEclipseRim);

      const coreLight = new THREE.PointLight(0xfacc15, 3.8, 22, 1.55);
      coreLight.position.set(0, 1.7, 1.1);
      scene.add(coreLight);

      const magmaUnderLight = new THREE.PointLight(0xea580c, 4.2, 18, 1.6);
      magmaUnderLight.position.set(0, 0.35, 0.6);
      scene.add(magmaUnderLight);

      // =========================================================================
      // BACKGROUND 1: Procedural Cosmic Nebula & Starfield Sky Dome (GLSL Shader)
      // =========================================================================
      const skyUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 0.4 },
        uFlash: { value: 0 }
      };
      const skyDomeMat = trackMat(
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
            uniform float uIntensity;
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
                p = p * 2.04 + vec3(0.17, -0.23, 0.11);
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldDir);
              float elev = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
              float horizonGlow = pow(1.0 - abs(dir.y), 3.4);

              // Swirling cosmic solar nebula clouds
              vec3 nebCoord = dir * 2.6 + vec3(uTime * 0.04, -uTime * 0.03, uTime * 0.02);
              float nebA = fbm(nebCoord);
              float nebB = fbm(nebCoord * 1.9 + vec3(nebA * 1.3));
              float ribbon = smoothstep(0.36, 0.82, nebB);

              vec3 deepVoid = vec3(0.014, 0.004, 0.010);
              vec3 crimsonCloud = vec3(0.16, 0.022, 0.012);
              vec3 solarAmber = vec3(0.38, 0.13, 0.02);
              vec3 goldDust = vec3(0.48, 0.30, 0.08);

              vec3 col = mix(deepVoid, crimsonCloud, nebA * 0.72 + horizonGlow * 0.38);
              col += solarAmber * ribbon * (0.14 + uIntensity * 0.16);
              col += goldDust * pow(ribbon, 3.2) * (0.08 + uIntensity * 0.16);

              // Horizon volcanic caldera sky bounce
              col += vec3(0.32, 0.07, 0.01) * horizonGlow * (0.16 + uIntensity * 0.16);

              // Twinkling stars in upper dome
              float starGrid = hash(floor(dir * 135.0));
              float star = smoothstep(0.992, 0.999, starGrid) * smoothstep(0.04, 0.45, dir.y);
              float twinkle = 0.6 + 0.4 * sin(uTime * 4.5 + starGrid * 90.0);
              col += vec3(0.95, 0.84, 0.62) * star * twinkle * (1.0 - uFlash * 0.4);

              // Subtle Supernova sky pulse
              col += vec3(0.68, 0.34, 0.08) * uFlash * 0.14;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      const skyDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(76, 32, 24)), skyDomeMat);
      scene.add(skyDome);

      // =========================================================================
      // PROCEDURAL TEXTURES (Magma Fissures, Solar Temple Altar Dial, Corona)
      // =========================================================================
      const magmaCanvas = document.createElement('canvas');
      magmaCanvas.width = 512;
      magmaCanvas.height = 512;
      const mctx = magmaCanvas.getContext('2d');
      if (mctx) {
        mctx.fillStyle = '#0c0504';
        mctx.fillRect(0, 0, 512, 512);

        const pitGrad = mctx.createRadialGradient(256, 256, 10, 256, 256, 248);
        pitGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        pitGrad.addColorStop(0.2, 'rgba(249, 115, 22, 0.78)');
        pitGrad.addColorStop(0.55, 'rgba(154, 52, 18, 0.38)');
        pitGrad.addColorStop(1, 'rgba(12, 5, 4, 0)');
        mctx.fillStyle = pitGrad;
        mctx.fillRect(0, 0, 512, 512);

        // Solar temple compass spokes + jagged radial lava cracks
        mctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
        mctx.lineWidth = 2;
        mctx.beginPath();
        mctx.arc(256, 256, 152, 0, Math.PI * 2);
        mctx.stroke();
        mctx.beginPath();
        mctx.arc(256, 256, 206, 0, Math.PI * 2);
        mctx.stroke();

        for (let i = 0; i < 20; i++) {
          const baseAng = (i * Math.PI * 2) / 20 + (i % 3) * 0.07;
          mctx.strokeStyle = i % 2 === 0 ? '#fb923c' : '#fde047';
          mctx.lineWidth = i % 3 === 0 ? 4.2 : 2.3;
          mctx.beginPath();
          let cx = 256;
          let cy = 256;
          mctx.moveTo(cx, cy);
          for (let seg = 1; seg <= 6; seg++) {
            const r = seg * 38;
            const jitter = Math.sin(i * 7.3 + seg * 2.9) * 0.16;
            cx = 256 + Math.cos(baseAng + jitter) * r;
            cy = 256 + Math.sin(baseAng + jitter) * r;
            mctx.lineTo(cx, cy);
          }
          mctx.stroke();
        }
      }
      const magmaTex = new THREE.CanvasTexture(magmaCanvas);
      magmaTex.colorSpace = THREE.SRGBColorSpace;
      magmaTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      disposables.push(magmaTex);

      const coronaCanvas = document.createElement('canvas');
      coronaCanvas.width = 512;
      coronaCanvas.height = 512;
      const cctx = coronaCanvas.getContext('2d');
      if (cctx) {
        cctx.clearRect(0, 0, 512, 512);
        const cg = cctx.createRadialGradient(256, 256, 70, 256, 256, 252);
        cg.addColorStop(0, 'rgba(0, 0, 0, 0)');
        cg.addColorStop(0.32, 'rgba(254, 240, 138, 0.98)');
        cg.addColorStop(0.48, 'rgba(249, 115, 22, 0.82)');
        cg.addColorStop(0.74, 'rgba(220, 38, 38, 0.32)');
        cg.addColorStop(1, 'rgba(9, 2, 2, 0)');
        cctx.fillStyle = cg;
        cctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 40; i++) {
          const a = (i * Math.PI * 2) / 40;
          const len = 138 + ((i * 37) % 102);
          cctx.strokeStyle = i % 3 === 0 ? 'rgba(254, 249, 195, 0.86)' : 'rgba(251, 146, 60, 0.6)';
          cctx.lineWidth = i % 2 === 0 ? 4.8 : 2.3;
          cctx.beginPath();
          cctx.moveTo(256 + Math.cos(a) * 84, 256 + Math.sin(a) * 84);
          cctx.lineTo(256 + Math.cos(a + 0.04) * len, 256 + Math.sin(a + 0.04) * len);
          cctx.stroke();
        }
      }
      const coronaTex = new THREE.CanvasTexture(coronaCanvas);
      coronaTex.colorSpace = THREE.SRGBColorSpace;
      coronaTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      disposables.push(coronaTex);

      // Shared PBR Materials
      const basaltMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x160c0a,
          roughness: 0.78,
          metalness: 0.28
        })
      );
      const obsidianMetalMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x1e0b09,
          roughness: 0.34,
          metalness: 0.74
        })
      );
      const crimsonArmorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x881337,
          emissive: 0x3b0712,
          emissiveIntensity: 0.22,
          roughness: 0.28,
          metalness: 0.76
        })
      );
      const solarGoldMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          emissive: 0x78350f,
          emissiveIntensity: 0.16,
          roughness: 0.2,
          metalness: 0.92
        })
      );
      const capeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x6b170c,
          emissive: 0x2d0b04,
          emissiveIntensity: 0.18,
          roughness: 0.68,
          metalness: 0.15,
          side: THREE.DoubleSide
        })
      );
      const plasmaOrangeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 0.95,
          roughness: 0.18,
          metalness: 0.14
        })
      );
      const whiteSunMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfde68a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.15,
          roughness: 0.14,
          metalness: 0.1
        })
      );
      const eclipseVoidMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x030102,
          roughness: 0.95,
          metalness: 0.05
        })
      );

      // =========================================================================
      // BACKGROUND 2: Stepped Obsidian Sun-Altar + Animated Molten Lava Lake
      // =========================================================================
      const craterFloor = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(38, 64)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x0a0303,
            roughness: 0.92,
            metalness: 0.14
          })
        )
      );
      craterFloor.rotation.x = -Math.PI / 2;
      craterFloor.position.y = -0.34;
      scene.add(craterFloor);

      // Animated Flowing Molten Magma Moat circling the Temple Altar
      const lavaUniforms = {
        uTime: { value: 0 },
        uSurge: { value: 0.35 }
      };
      const lavaMoatMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: lavaUniforms,
          transparent: true,
          depthWrite: false,
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vPos;
            void main() {
              vUv = uv;
              vPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            varying vec3 vPos;
            uniform float uTime;
            uniform float uSurge;

            void main() {
              float r = length(vPos.xy);
              float ang = atan(vPos.y, vPos.x);
              float wave1 = sin(r * 2.8 - uTime * 2.2 + sin(ang * 5.0 + uTime));
              float wave2 = cos(ang * 9.0 + r * 1.9 + uTime * 1.4);
              float veins = smoothstep(0.15, 0.92, 0.5 + 0.5 * (wave1 * 0.6 + wave2 * 0.4));
              float edgeFade = smoothstep(4.0, 4.9, r) * (1.0 - smoothstep(8.2, 11.2, r));

              vec3 crust = vec3(0.05, 0.01, 0.008);
              vec3 magma = vec3(0.72, 0.22, 0.02);
              vec3 core = vec3(0.88, 0.66, 0.22);

              vec3 col = mix(crust, magma, veins * (0.55 + uSurge * 0.35));
              col += core * pow(veins, 3.6) * (0.35 + uSurge * 0.45);
              gl_FragColor = vec4(col, edgeFade * (0.72 + uSurge * 0.16));
            }
          `
        })
      );
      const lavaMoat = new THREE.Mesh(trackGeo(new THREE.RingGeometry(4.0, 11.4, 72, 2)), lavaMoatMat);
      lavaMoat.rotation.x = -Math.PI / 2;
      lavaMoat.position.y = -0.22;
      scene.add(lavaMoat);

      // 3-Tiered Octagonal Obsidian Sun-Temple Altar Dais (grounded at y = 0)
      const altarGroup = new THREE.Group();
      scene.add(altarGroup);

      const daisTier1 = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(4.45, 4.9, 0.18, 8)),
        basaltMat
      );
      daisTier1.position.y = -0.17;

      const daisTier2 = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(3.45, 3.8, 0.14, 8)),
        obsidianMetalMat
      );
      daisTier2.position.y = -0.07;

      const altarTrimRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.48, 0.045, 8, 48)),
        solarGoldMat
      );
      altarTrimRing.rotation.x = Math.PI / 2;
      altarTrimRing.position.y = 0.0;

      const altarInnerRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.95, 0.032, 8, 48)),
        plasmaOrangeMat
      );
      altarInnerRing.rotation.x = Math.PI / 2;
      altarInnerRing.position.y = 0.01;

      altarGroup.add(daisTier1, daisTier2, altarTrimRing, altarInnerRing);

      const magmaPitMat = trackMat(
        new THREE.MeshBasicMaterial({
          map: magmaTex,
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        })
      );
      const magmaPit = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(3.42, 48)), magmaPitMat);
      magmaPit.rotation.x = -Math.PI / 2;
      magmaPit.position.y = 0.02;
      scene.add(magmaPit);

      // Soft Contact Grounding Shadow + Solar Heat Ring directly under Solaris
      const contactRingMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf97316,
          transparent: true,
          opacity: 0.52,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      const contactRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.28, 0.72, 32)), contactRingMat);
      contactRing.rotation.x = -Math.PI / 2;
      contactRing.position.set(0, 0.03, 0.15);
      scene.add(contactRing);

      // =========================================================================
      // BACKGROUND 3: 6 Monumental Ruined Solar Obelisks + Distant Volcano Peaks
      // =========================================================================
      const pillarPlinthGeo = trackGeo(new THREE.CylinderGeometry(0.68, 0.85, 0.6, 6));
      const pillarShaftGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.56, 3.6, 6));
      const pillarCoreGeo = trackGeo(new THREE.CylinderGeometry(0.41, 0.46, 0.35, 6));
      const pillarCollarGeo = trackGeo(new THREE.TorusGeometry(0.46, 0.045, 8, 24));
      const pillarCapstoneGeo = trackGeo(new THREE.ConeGeometry(0.44, 1.05, 6));

      const pillarCapstones: THREE.Mesh[] = [];
      const pillarCapstoneBaseY = 4.35;
      const geyserVents: THREE.Vector3[] = [];
      const obeliskCorePositions: THREE.Vector3[] = [];

      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6 + 0.32;
        const rad = 6.35 + (i % 2) * 0.55;
        const px = Math.cos(a) * rad;
        const pz = Math.sin(a) * rad;

        const obelisk = new THREE.Group();
        obelisk.position.set(px, -0.26, pz);
        obelisk.lookAt(0, -0.26, 0);
        obelisk.rotateX(0.06);

        const plinth = new THREE.Mesh(pillarPlinthGeo, basaltMat);
        plinth.position.y = 0.3;

        const shaft = new THREE.Mesh(pillarShaftGeo, obsidianMetalMat);
        shaft.position.y = 2.15;

        const runeCore = new THREE.Mesh(pillarCoreGeo, i % 2 === 0 ? plasmaOrangeMat : whiteSunMat);
        runeCore.position.y = 2.65;

        const collar = new THREE.Mesh(pillarCollarGeo, solarGoldMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = 3.85;

        const capstone = new THREE.Mesh(pillarCapstoneGeo, crimsonArmorMat);
        capstone.position.y = pillarCapstoneBaseY;
        pillarCapstones.push(capstone);

        obelisk.add(plinth, shaft, runeCore, collar, capstone);
        scene.add(obelisk);
        obelisk.updateMatrixWorld(true);
        const coreWorld = new THREE.Vector3();
        runeCore.getWorldPosition(coreWorld);
        obeliskCorePositions.push(coreWorld);

        // Magma geyser vent positions just inside the obelisk ring
        const vRad = 4.75;
        geyserVents.push(new THREE.Vector3(Math.cos(a - 0.22) * vRad, 0, Math.sin(a - 0.22) * vRad));
      }

      // 8 Inner Basalt Crystal Spires around the Altar rim
      const spireGeo = trackGeo(new THREE.ConeGeometry(0.44, 2.1, 5));
      const spireVeinGeo = trackGeo(new THREE.OctahedronGeometry(0.17, 0));
      const spireGlows: THREE.Mesh[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8 + 0.24;
        const rad = 4.95 + (i % 2) * 0.42;
        const sGroup = new THREE.Group();
        sGroup.position.set(Math.cos(a) * rad, 0.55, Math.sin(a) * rad);
        sGroup.lookAt(0, 1.3, 0);
        sGroup.rotateX(0.32);
        const rock = new THREE.Mesh(spireGeo, basaltMat);
        rock.scale.set(1, 0.8 + (i % 3) * 0.24, 0.85);
        const ember = new THREE.Mesh(spireVeinGeo, i % 2 === 0 ? plasmaOrangeMat : whiteSunMat);
        ember.position.y = 1.15;
        spireGlows.push(ember);
        sGroup.add(rock, ember);
        scene.add(sGroup);
      }

      // Distant Volcanic Caldera Mountain Rim (32 Instanced Jagged Peaks)
      const peakCount = 32;
      const peakGeo = trackGeo(new THREE.ConeGeometry(2.6, 8.5, 5));
      const peakMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.9,
          metalness: 0.12
        })
      );
      const peakInstanced = new THREE.InstancedMesh(peakGeo, peakMat, peakCount);
      for (let i = 0; i < peakCount; i++) {
        const a = (i * Math.PI * 2) / peakCount + (i % 3) * 0.04;
        const dist = 17.5 + (i % 4) * 2.4;
        const heightScale = 0.72 + ((i * 19) % 10) * 0.11;
        const widthScale = 0.85 + ((i * 13) % 7) * 0.12;
        _dummy.position.set(Math.cos(a) * dist, heightScale * 3.1 - 0.8, Math.sin(a) * dist);
        _dummy.rotation.set(((i % 3) - 1) * 0.08, a, ((i % 5) - 2) * 0.06);
        _dummy.scale.set(widthScale, heightScale, widthScale * 0.9);
        _dummy.updateMatrix();
        peakInstanced.setMatrixAt(i, _dummy.matrix);
        _tmpColor.setHex(i % 3 === 0 ? 0x260b07 : i % 2 === 0 ? 0x1a0705 : 0x120504);
        peakInstanced.setColorAt(i, _tmpColor);
      }
      if (peakInstanced.instanceColor) peakInstanced.instanceColor.needsUpdate = true;
      peakInstanced.computeBoundingSphere();
      scene.add(peakInstanced);

      // =========================================================================
      // BACKGROUND 4: Colossal Eclipsing Star, Corona Shader, Prominence Arcs & Asteroid Belt
      // =========================================================================
      const eclipseStarGroup = new THREE.Group();
      eclipseStarGroup.position.set(0, 3.35, -5.2);
      scene.add(eclipseStarGroup);

      const eclipseMoon = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1.78, 32, 32)), eclipseVoidMat);
      const eclipseCoronaRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.85, 0.095, 14, 72)),
        whiteSunMat
      );

      // Custom Fresnel Solar Corona Aura Sphere around Eclipse
      const coronaAuraUniforms = {
        uTime: { value: 0 },
        uPower: { value: 1.0 }
      };
      const coronaAuraMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: coronaAuraUniforms,
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
            uniform float uPower;
            void main() {
              vec3 viewDir = normalize(vViewPos);
              float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
              float pulse = 0.85 + 0.15 * sin(uTime * 6.0 + vNormal.y * 8.0);
              float intensity = pow(rim, 2.8) * pulse * uPower;
              vec3 col = mix(vec3(0.85, 0.28, 0.03), vec3(0.95, 0.72, 0.3), pow(rim, 4.2));
              gl_FragColor = vec4(col * intensity, clamp(intensity * 0.65, 0.0, 1.0));
            }
          `
        })
      );
      const coronaAuraSphere = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(2.38, 32, 32)),
        coronaAuraMat
      );

      const coronaBillboardMat = trackMat(
        new THREE.MeshBasicMaterial({
          map: coronaTex,
          transparent: true,
          opacity: 0.36,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide
        })
      );
      const coronaBillboard = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(7.2, 7.2)), coronaBillboardMat);
      coronaBillboard.position.z = -0.15;

      // 4 Curved 3D Solar Prominence Plasma Arcs erupting from the Eclipse rim
      const prominenceGroup = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const baseA = (i * Math.PI) / 2 + 0.35;
        const span = 0.58;
        const arcR = 1.82;
        const peakR = 2.65 + (i % 2) * 0.35;
        const p0 = new THREE.Vector3(Math.cos(baseA) * arcR, Math.sin(baseA) * arcR, 0.08);
        const p1 = new THREE.Vector3(
          Math.cos(baseA + span * 0.5) * peakR,
          Math.sin(baseA + span * 0.5) * peakR,
          (i % 2 === 0 ? 1 : -1) * 0.38
        );
        const p2 = new THREE.Vector3(Math.cos(baseA + span) * arcR, Math.sin(baseA + span) * arcR, -0.08);
        const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
        const promGeo = trackGeo(new THREE.TubeGeometry(curve, 20, 0.055, 8, false));
        const promMesh = new THREE.Mesh(promGeo, i % 2 === 0 ? plasmaOrangeMat : whiteSunMat);
        prominenceGroup.add(promMesh);
      }

      const gyroRingA = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(2.65, 0.06, 10, 72)),
        solarGoldMat
      );
      gyroRingA.rotation.set(0.45, 0.3, 0);

      const gyroRingB = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.18, 0.052, 10, 72)),
        plasmaOrangeMat
      );
      gyroRingB.rotation.set(-0.65, 0.5, 0.2);

      const gyroRingC = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.72, 0.042, 10, 72)),
        obsidianMetalMat
      );
      gyroRingC.rotation.set(1.15, -0.35, 0.4);

      // Volumetric Solar Eclipse God-Rays (8 additive radial light shafts)
      const godRayUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 0.7 }
      };
      const godRayMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: godRayUniforms,
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
            varying vec2 vUv;
            uniform float uTime;
            uniform float uIntensity;
            void main() {
              float radialX = 1.0 - abs(vUv.x - 0.5) * 2.0;
              radialX = pow(max(0.0, radialX), 2.8);
              float lenMask = smoothstep(0.06, 0.28, vUv.y) * (1.0 - smoothstep(0.45, 1.0, vUv.y));
              float flicker = 0.72 + 0.28 * sin(uTime * 5.2 + vUv.y * 12.0 + vUv.x * 7.0);
              float alpha = radialX * lenMask * flicker * uIntensity;
              vec3 col = mix(vec3(0.95, 0.35, 0.04), vec3(1.0, 0.88, 0.52), radialX);
              gl_FragColor = vec4(col * alpha, clamp(alpha, 0.0, 1.0));
            }
          `
        })
      );
      const godRaysGroup = new THREE.Group();
      godRaysGroup.position.z = -0.26;
      const godRayGeo = trackGeo(new THREE.PlaneGeometry(0.58, 9.8));
      for (let i = 0; i < 8; i++) {
        const shaft = new THREE.Mesh(godRayGeo, godRayMat);
        const angle = (i * Math.PI * 2) / 8 + 0.19;
        shaft.rotation.z = angle;
        shaft.position.set(-Math.sin(angle) * 4.2, Math.cos(angle) * 4.2, (i % 2 === 0 ? 1 : -1) * 0.08);
        godRaysGroup.add(shaft);
      }

      eclipseStarGroup.add(
        eclipseMoon,
        eclipseCoronaRing,
        coronaAuraSphere,
        coronaBillboard,
        godRaysGroup,
        prominenceGroup,
        gyroRingA,
        gyroRingB,
        gyroRingC
      );

      // Orbiting Molten Asteroid Belt around the Eclipse Star (36 Instanced Ember Rocks)
      const asteroidCount = 36;
      const asteroidGeo = trackGeo(new THREE.DodecahedronGeometry(0.14, 0));
      const asteroidMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x451a03,
          emissiveIntensity: 0.32,
          roughness: 0.68,
          metalness: 0.42
        })
      );
      const asteroidBelt = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount);
      asteroidBelt.frustumCulled = false;
      eclipseStarGroup.add(asteroidBelt);

      const asteroidAngles: number[] = [];
      const asteroidRadii: number[] = [];
      const asteroidYOffsets: number[] = [];
      for (let i = 0; i < asteroidCount; i++) {
        asteroidAngles.push((i * Math.PI * 2) / asteroidCount);
        asteroidRadii.push(4.15 + (i % 5) * 0.45);
        asteroidYOffsets.push(((i % 7) - 3) * 0.16);
        _tmpColor.setHex(i % 4 === 0 ? 0xf97316 : i % 2 === 0 ? 0x451a03 : 0x29110c);
        asteroidBelt.setColorAt(i, _tmpColor);
      }
      if (asteroidBelt.instanceColor) asteroidBelt.instanceColor.needsUpdate = true;

      // =========================================================================
      // HERO: Composite 3D Solaris Ignis — Pyre Dragoon
      // =========================================================================
      const solarisGroup = new THREE.Group();
      solarisGroup.position.set(0, 0, 0.15);
      scene.add(solarisGroup);

      // Armored Greaves & Legs
      const legGeo = trackGeo(new THREE.CylinderGeometry(0.13, 0.11, 0.82, 8));
      const kneeGeo = trackGeo(new THREE.OctahedronGeometry(0.14, 0));
      const legL = new THREE.Mesh(legGeo, obsidianMetalMat);
      legL.position.set(-0.22, 0.41, 0);
      const kneeL = new THREE.Mesh(kneeGeo, solarGoldMat);
      kneeL.position.set(-0.22, 0.56, 0.11);
      const legR = new THREE.Mesh(legGeo, obsidianMetalMat);
      legR.position.set(0.22, 0.41, 0);
      const kneeR = new THREE.Mesh(kneeGeo, solarGoldMat);
      kneeR.position.set(0.22, 0.56, 0.11);
      solarisGroup.add(legL, kneeL, legR, kneeR);

      // Pelvis & Gold Belt Crest
      const pelvis = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.3, 0.24, 0.3, 8)),
        crimsonArmorMat
      );
      pelvis.position.y = 0.94;
      const beltCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.11, 0)), whiteSunMat);
      beltCore.position.set(0, 0.95, 0.28);
      solarisGroup.add(pelvis, beltCore);

      // Draconic Breastplate + Blazing Solar Core Sternum
      const chest = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.4, 0.28, 0.82, 8)),
        crimsonArmorMat
      );
      chest.position.y = 1.46;
      const chestTrim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.22, 0.035, 8, 24)),
        solarGoldMat
      );
      chestTrim.position.set(0, 1.52, 0.34);
      const chestReactor = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 16, 16)), whiteSunMat);
      chestReactor.position.set(0, 1.52, 0.35);
      solarisGroup.add(chest, chestTrim, chestReactor);

      // Tattered Dragon War Cape
      const capeShape = new THREE.Shape();
      capeShape.moveTo(-0.46, 0);
      capeShape.lineTo(0.46, 0);
      capeShape.lineTo(0.84, -1.58);
      capeShape.lineTo(0.34, -1.32);
      capeShape.lineTo(0, -1.72);
      capeShape.lineTo(-0.34, -1.32);
      capeShape.lineTo(-0.84, -1.58);
      capeShape.closePath();
      const capeMesh = new THREE.Mesh(
        trackGeo(new THREE.ExtrudeGeometry(capeShape, { depth: 0.04, bevelEnabled: false })),
        capeMat
      );
      capeMesh.position.set(0, 1.82, -0.3);
      capeMesh.rotation.x = 0.26;
      solarisGroup.add(capeMesh);

      // Dragon-Scale Spiked Shoulder Pauldrons
      const pauldronGeo = trackGeo(new THREE.DodecahedronGeometry(0.24, 0));
      const spikeGeo = trackGeo(new THREE.ConeGeometry(0.08, 0.42, 6));
      const pauldronL = new THREE.Group();
      pauldronL.position.set(-0.5, 1.76, 0);
      const pMeshL = new THREE.Mesh(pauldronGeo, solarGoldMat);
      pMeshL.scale.set(1.2, 0.8, 1.05);
      const pSpikeL = new THREE.Mesh(spikeGeo, plasmaOrangeMat);
      pSpikeL.position.set(-0.18, 0.22, 0);
      pSpikeL.rotation.z = 0.55;
      pauldronL.add(pMeshL, pSpikeL);

      const pauldronR = new THREE.Group();
      pauldronR.position.set(0.5, 1.76, 0);
      const pMeshR = new THREE.Mesh(pauldronGeo, solarGoldMat);
      pMeshR.scale.set(1.2, 0.8, 1.05);
      const pSpikeR = new THREE.Mesh(spikeGeo, plasmaOrangeMat);
      pSpikeR.position.set(0.18, 0.22, 0);
      pSpikeR.rotation.z = -0.55;
      pauldronR.add(pMeshR, pSpikeR);
      solarisGroup.add(pauldronL, pauldronR);

      // Dragon-Horned Solar Helm & Glowing Visor
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.08, 0.04);
      const helmMesh = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(0.23, 0)),
        obsidianMetalMat
      );
      const visorMesh = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.28, 0.065, 0.16)),
        whiteSunMat
      );
      visorMesh.position.set(0, 0.02, 0.16);
      const hornGeo = trackGeo(new THREE.ConeGeometry(0.065, 0.48, 6));
      const hornL = new THREE.Mesh(hornGeo, solarGoldMat);
      hornL.position.set(-0.2, 0.22, -0.02);
      hornL.rotation.set(-0.2, 0, 0.52);
      const hornR = new THREE.Mesh(hornGeo, solarGoldMat);
      hornR.position.set(0.2, 0.22, -0.02);
      hornR.rotation.set(-0.2, 0, -0.52);
      const crestPlume = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.08, 0.42, 6)),
        plasmaOrangeMat
      );
      crestPlume.position.set(0, 0.28, -0.08);
      crestPlume.rotation.x = -0.4;
      headGroup.add(helmMesh, visorMesh, hornL, hornR, crestPlume);
      solarisGroup.add(headGroup);

      // 6 Unfurling Solar Dragon Flame Wings + 8-Point Solar Halo
      const wingRoot = new THREE.Group();
      wingRoot.position.set(0, 1.62, -0.34);
      solarisGroup.add(wingRoot);

      const flameShape = new THREE.Shape();
      flameShape.moveTo(0, 0);
      flameShape.quadraticCurveTo(0.75, 0.48, 1.55, 0.24);
      flameShape.quadraticCurveTo(0.95, -0.08, 1.25, -0.32);
      flameShape.quadraticCurveTo(0.55, -0.22, 0, -0.14);
      flameShape.closePath();
      const wingBladeGeo = trackGeo(
        new THREE.ExtrudeGeometry(flameShape, { depth: 0.03, bevelEnabled: false })
      );

      const leftWings: THREE.Mesh[] = [];
      const rightWings: THREE.Mesh[] = [];
      for (let wIdx = 0; wIdx < 3; wIdx++) {
        const wMat = wIdx === 0 ? whiteSunMat : plasmaOrangeMat;
        const rWing = new THREE.Mesh(wingBladeGeo, wMat);
        rWing.position.set(0.14, 0.14 - wIdx * 0.2, 0);
        rWing.scale.setScalar(1.08 - wIdx * 0.16);
        rightWings.push(rWing);

        const lWing = new THREE.Mesh(wingBladeGeo, wMat);
        lWing.position.set(-0.14, 0.14 - wIdx * 0.2, 0);
        lWing.scale.set(-(1.08 - wIdx * 0.16), 1.08 - wIdx * 0.16, 1);
        leftWings.push(lWing);

        wingRoot.add(rWing, lWing);
      }

      const solarHaloGroup = new THREE.Group();
      solarHaloGroup.position.set(0, 1.88, -0.42);
      solarHaloGroup.visible = false;
      const haloRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.95, 0.036, 8, 48)),
        solarGoldMat
      );
      solarHaloGroup.add(haloRing);
      const haloRayGeo = trackGeo(new THREE.ConeGeometry(0.065, 0.48, 5));
      for (let r = 0; r < 8; r++) {
        const a = (r * Math.PI * 2) / 8;
        const ray = new THREE.Mesh(haloRayGeo, r % 2 === 0 ? whiteSunMat : plasmaOrangeMat);
        ray.position.set(Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0);
        ray.rotation.z = a - Math.PI / 2;
        solarHaloGroup.add(ray);
      }
      solarisGroup.add(solarHaloGroup);

      // Articulated Arms & Monumental Sunfire Lance
      const armGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.075, 0.72, 8));
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.46, 1.7, 0.06);
      const leftArmMesh = new THREE.Mesh(armGeo, crimsonArmorMat);
      leftArmMesh.position.y = -0.34;
      const leftGauntlet = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 10, 10)), solarGoldMat);
      leftGauntlet.position.y = -0.7;
      leftArmPivot.add(leftArmMesh, leftGauntlet);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.46, 1.7, 0.06);
      const rightArmMesh = new THREE.Mesh(armGeo, crimsonArmorMat);
      rightArmMesh.position.y = -0.34;
      const rightGauntlet = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 10, 10)), solarGoldMat);
      rightGauntlet.position.y = -0.7;
      rightArmPivot.add(rightArmMesh, rightGauntlet);
      solarisGroup.add(leftArmPivot, rightArmPivot);

      const lanceGroup = new THREE.Group();
      lanceGroup.position.set(0.55, 1.12, 0.32);
      solarisGroup.add(lanceGroup);

      const shaft = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.045, 0.04, 3.35, 10)),
        obsidianMetalMat
      );
      const pommel = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), solarGoldMat);
      pommel.position.y = -1.72;
      const crossGuard = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.24, 0.045, 8, 24, Math.PI)),
        solarGoldMat
      );
      crossGuard.position.y = 1.05;
      crossGuard.rotation.z = Math.PI;
      const lanceBlade = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.21, 1.15, 6)),
        whiteSunMat
      );
      lanceBlade.position.y = 1.75;
      const lanceFlameGuard = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.19, 0)),
        plasmaOrangeMat
      );
      lanceFlameGuard.position.y = 1.18;

      const miniSunOrb = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.32, 20, 20)),
        whiteSunMat
      );
      miniSunOrb.position.y = 2.38;
      miniSunOrb.visible = false;

      // Sunfire Lance Blazing Flame Sheath (ShaderMaterial)
      const lanceSheathUniforms = {
        uTime: { value: 0 },
        uHeat: { value: 0.4 }
      };
      const lanceSheathMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: lanceSheathUniforms,
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
            varying vec2 vUv;
            uniform float uTime;
            uniform float uHeat;
            void main() {
              float flow = sin(vUv.y * 18.0 - uTime * 16.0 + sin(vUv.x * 12.566) * 2.2);
              float core = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.65, 1.0, vUv.y));
              float flames = smoothstep(-0.2, 0.9, flow) * core;
              vec3 col = mix(vec3(1.0, 0.38, 0.04), vec3(1.0, 0.95, 0.68), flames);
              gl_FragColor = vec4(col, flames * uHeat);
            }
          `
        })
      );
      const lanceSheath = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.36, 1.48, 14, 1, true)),
        lanceSheathMat
      );
      lanceSheath.position.y = 1.82;

      lanceGroup.add(shaft, pommel, crossGuard, lanceBlade, lanceFlameGuard, lanceSheath, miniSunOrb);

      // =========================================================================
      // ADDITIONAL EFFECTS 1: Twin Spiraling Solar Dragon Helix Ribbons (Phase II)
      // =========================================================================
      const helixGroup = new THREE.Group();
      helixGroup.position.set(0, 0, 0.2);
      helixGroup.visible = false;
      scene.add(helixGroup);

      const helixMatA = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const helixMatB = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf97316,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      for (let h = 0; h < 2; h++) {
        const pts: THREE.Vector3[] = [];
        const steps = 36;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const ang = t * Math.PI * 5 + h * Math.PI;
          const rad = 1.45 * (1 - t * 0.55);
          pts.push(new THREE.Vector3(Math.cos(ang) * rad, 0.25 + t * 3.85, Math.sin(ang) * rad));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const hGeo = trackGeo(new THREE.TubeGeometry(curve, 48, 0.042, 8, false));
        helixGroup.add(new THREE.Mesh(hGeo, h === 0 ? helixMatA : helixMatB));
      }

      // =========================================================================
      // ADDITIONAL EFFECTS 2: 6 Volcanic Magma Geyser Columns around Altar
      // =========================================================================
      const geyserGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.42, 9.5, 14, 1, true));
      const geyserMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfb923c,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const geysers: THREE.Mesh[] = [];
      for (let i = 0; i < geyserVents.length; i++) {
        const gMesh = new THREE.Mesh(geyserGeo, geyserMat);
        gMesh.position.set(geyserVents[i].x, 4.4, geyserVents[i].z);
        gMesh.visible = false;
        geysers.push(gMesh);
        scene.add(gMesh);
      }

      // =========================================================================
      // ADDITIONAL EFFECTS 3: Supernova Cataclysm Multi-Shell + Starburst Rays + Meteor Rain
      // =========================================================================
      const pillarMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const solarPillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.95, 1.65, 18, 28, 1, true)),
        pillarMat
      );
      solarPillar.position.set(0, 8.8, 0.4);
      solarPillar.visible = false;
      scene.add(solarPillar);

      // Supernova Plasma Fireball Core Shader Sphere
      const novaCoreUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const novaCoreMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: novaCoreUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPos;
            varying vec3 vViewPos;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPos = position;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vViewPos = -mv.xyz;
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPos;
            varying vec3 vViewPos;
            uniform float uTime;
            uniform float uAlpha;
            void main() {
              vec3 viewDir = normalize(vViewPos);
              float fresnel = 1.0 - max(0.0, dot(viewDir, vNormal));
              float turb = sin(vPos.x * 7.0 + uTime * 9.0) * cos(vPos.y * 7.0 - uTime * 7.5) * sin(vPos.z * 7.0 + uTime * 6.0);
              float coreGlow = clamp(0.45 + turb * 0.35 + fresnel * 0.45, 0.0, 1.0);
              vec3 col = mix(vec3(0.95, 0.3, 0.04), vec3(1.0, 0.92, 0.58), coreGlow);
              float outAlpha = uAlpha * pow(coreGlow, 1.35);
              gl_FragColor = vec4(col * outAlpha, outAlpha);
            }
          `
        })
      );
      const novaFireball = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1, 28, 28)), novaCoreMat);
      novaFireball.position.set(0, 1.2, 0.4);
      novaFireball.visible = false;
      scene.add(novaFireball);

      // 12 Radial Starburst Solar Spears shooting outward in Phase III
      const starburstCount = 12;
      const starburstGeo = trackGeo(new THREE.ConeGeometry(0.16, 4.5, 6));
      const starburstMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const starburstInstanced = new THREE.InstancedMesh(starburstGeo, starburstMat, starburstCount);
      starburstInstanced.frustumCulled = false;
      starburstInstanced.visible = false;
      scene.add(starburstInstanced);

      const starburstDirs: THREE.Vector3[] = [];
      const starburstQuats: THREE.Quaternion[] = [];
      const _upVec = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < starburstCount; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / starburstCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.abs(Math.cos(phi)) * 0.78 + 0.14,
          Math.sin(phi) * Math.sin(theta)
        ).normalize();
        starburstDirs.push(dir);
        starburstQuats.push(new THREE.Quaternion().setFromUnitVectors(_upVec, dir));
      }

      // Tilted Supernova Equatorial Accretion Disk
      const accretionMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf97316,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const accretionDisk = new THREE.Mesh(
        trackGeo(new THREE.RingGeometry(0.6, 2.3, 56)),
        accretionMat
      );
      accretionDisk.position.set(0, 1.35, 0.4);
      accretionDisk.rotation.set(Math.PI / 2 - 0.24, 0.15, 0);
      accretionDisk.visible = false;
      scene.add(accretionDisk);

      // Triple Expanding Shockwave Rings
      const shockwaveMagma = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.09, 10, 64)),
        plasmaOrangeMat
      );
      shockwaveMagma.rotation.x = Math.PI / 2;
      shockwaveMagma.position.set(0, 0.16, 0.4);
      shockwaveMagma.visible = false;
      scene.add(shockwaveMagma);

      const shockwaveGold = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.058, 10, 64)),
        whiteSunMat
      );
      shockwaveGold.rotation.x = Math.PI / 2;
      shockwaveGold.position.set(0, 0.26, 0.4);
      shockwaveGold.visible = false;
      scene.add(shockwaveGold);

      const shockwaveTilt = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.045, 10, 64)),
        whiteSunMat
      );
      shockwaveTilt.rotation.set(Math.PI / 2 - 0.48, 0.3, 0);
      shockwaveTilt.position.set(0, 1.35, 0.4);
      shockwaveTilt.visible = false;
      scene.add(shockwaveTilt);

      // 48 Falling Molten Meteor Streaks raining from the sky in Phase III
      const meteorCount = 48;
      const meteorGeo = trackGeo(new THREE.ConeGeometry(0.08, 0.85, 5));
      const meteorMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const meteorInstanced = new THREE.InstancedMesh(meteorGeo, meteorMat, meteorCount);
      meteorInstanced.frustumCulled = false;
      meteorInstanced.visible = false;
      scene.add(meteorInstanced);

      const meteorOffsets: { x: number; y: number; z: number; speed: number }[] = [];
      const meteorDir = new THREE.Vector3(-0.35, -1.0, -0.15).normalize();
      const meteorQuat = new THREE.Quaternion().setFromUnitVectors(_upVec, meteorDir);
      for (let i = 0; i < meteorCount; i++) {
        meteorOffsets.push({
          x: ((i * 29) % 24) - 10,
          y: 10 + (i % 7) * 2.2,
          z: -10 + ((i * 17) % 18),
          speed: 14 + (i % 5) * 2.8
        });
      }

      // 110 Instanced Plasma Shards: Reverse-Gravity Implosion -> Spiral Vortex -> Supernova Blast
      const shardCount = 110;
      const shardGeo = trackGeo(new THREE.TetrahedronGeometry(0.11, 0));
      const shardMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xea580c,
          emissiveIntensity: 0.85,
          roughness: 0.18,
          metalness: 0.28
        })
      );
      const shardInstanced = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
      shardInstanced.frustumCulled = false;
      scene.add(shardInstanced);

      const shardDirs: THREE.Vector3[] = [];
      const shardSpeeds: number[] = [];
      const shardAngles: number[] = [];
      for (let i = 0; i < shardCount; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / shardCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        shardDirs.push(
          new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.abs(Math.cos(phi)) * 0.72 + 0.08,
            Math.sin(phi) * Math.sin(theta)
          ).normalize()
        );
        shardSpeeds.push(5.6 + (i % 7) * 1.2);
        shardAngles.push((i * Math.PI * 2) / shardCount);
        _tmpColor.setHex(i % 4 === 0 ? 0xfef08a : i % 2 === 0 ? 0xf97316 : 0xef4444);
        shardInstanced.setColorAt(i, _tmpColor);
      }
      if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;

      // 220 Rising Volcanic Ash & Golden Spark Embers across the Sanctuary
      const emberCount = 220;
      const emberPos = new Float32Array(emberCount * 3);
      const emberSpeeds = new Float32Array(emberCount);
      for (let i = 0; i < emberCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.1 + Math.random() * 12.5;
        emberPos[i * 3] = Math.cos(a) * r;
        emberPos[i * 3 + 1] = 0.1 + Math.random() * 8.5;
        emberPos[i * 3 + 2] = Math.sin(a) * r;
        emberSpeeds[i] = 0.8 + Math.random() * 1.8;
      }
      const emberGeo = trackGeo(new THREE.BufferGeometry());
      const emberPosAttr = new THREE.BufferAttribute(emberPos, 3);
      emberGeo.setAttribute('position', emberPosAttr);
      const emberMat = trackMat(
        new THREE.PointsMaterial({
          color: 0xfdba74,
          size: 0.095,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const emberPoints = new THREE.Points(emberGeo, emberMat);
      scene.add(emberPoints);

      // =========================================================================
      // ADDITIONAL VFX: Plasma Lightning Arcs, Slash Trails, Heat Dome, Fissures & Spark Needles
      // =========================================================================
      // 1) 6 Jagged Solar Plasma Lightning Arcs from Obelisk Rune Cores -> Solaris / Mini-Sun
      const arcSegments = 14;
      const arcPositionsList: Float32Array[] = [];
      const arcPosAttrs: THREE.BufferAttribute[] = [];
      const arcLines: THREE.Line[] = [];
      const arcMatGold = trackMat(
        new THREE.LineBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const arcMatOrange = trackMat(
        new THREE.LineBasicMaterial({
          color: 0xf97316,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      for (let i = 0; i < obeliskCorePositions.length; i++) {
        const arr = new Float32Array(arcSegments * 3);
        const attr = new THREE.BufferAttribute(arr, 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        const geo = trackGeo(new THREE.BufferGeometry());
        geo.setAttribute('position', attr);
        const line = new THREE.Line(geo, i % 2 === 0 ? arcMatGold : arcMatOrange);
        line.frustumCulled = false;
        scene.add(line);
        arcPositionsList.push(arr);
        arcPosAttrs.push(attr);
        arcLines.push(line);
      }

      // 2) 3 Crescent Sunfire Slash Afterimage Arcs during Lance Windup & Slam
      const slashTrailsGroup = new THREE.Group();
      slashTrailsGroup.position.set(0.1, 1.8, 0.52);
      slashTrailsGroup.visible = false;
      scene.add(slashTrailsGroup);

      const slashTrailMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const slashArcs: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const arc = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(1.75 + i * 0.36, 0.048 + i * 0.014, 8, 42, Math.PI * 1.12)),
          slashTrailMat
        );
        arc.rotation.set(0.25 * (i - 1), -0.45 + i * 0.3, -Math.PI * 0.32 + i * 0.22);
        slashTrailsGroup.add(arc);
        slashArcs.push(arc);
      }

      // 3) Supernova Expanding Fresnel Heat-Wave Distortion Dome (Phase III)
      const heatDomeUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const heatDomeMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: heatDomeUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.FrontSide,
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying vec3 vLocalPos;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vLocalPos = position;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vViewPos = -mv.xyz;
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying vec3 vLocalPos;
            uniform float uTime;
            uniform float uAlpha;
            void main() {
              vec3 viewDir = normalize(vViewPos);
              float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
              float ripple = 0.7 + 0.3 * sin(vLocalPos.y * 18.0 - uTime * 14.0);
              float intensity = pow(rim, 4.4) * ripple * uAlpha;
              vec3 col = mix(vec3(1.0, 0.42, 0.06), vec3(1.0, 0.94, 0.68), pow(rim, 5.5));
              gl_FragColor = vec4(col * intensity, clamp(intensity, 0.0, 1.0));
            }
          `
        })
      );
      const heatWaveDome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(1, 28, 20)),
        heatDomeMat
      );
      heatWaveDome.position.set(0, 1.25, 0.4);
      heatWaveDome.visible = false;
      scene.add(heatWaveDome);

      // 4) 16 Radial Ground Flame Fissure Streaks racing across the Temple Altar (Phase III)
      const fissureCount = 16;
      const fissureGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.07, 1.75));
      const fissureMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const fissureInstanced = new THREE.InstancedMesh(fissureGeo, fissureMat, fissureCount);
      fissureInstanced.frustumCulled = false;
      fissureInstanced.visible = false;
      scene.add(fissureInstanced);

      // 5) 60 High-Speed Supernova Spark Needles blasting radially outward (Phase III)
      const sparkCount = 60;
      const sparkGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.032, 0.72, 5));
      const sparkMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const sparkInstanced = new THREE.InstancedMesh(sparkGeo, sparkMat, sparkCount);
      sparkInstanced.frustumCulled = false;
      sparkInstanced.visible = false;
      scene.add(sparkInstanced);

      const sparkDirs: THREE.Vector3[] = [];
      const sparkQuats: THREE.Quaternion[] = [];
      const sparkSpeeds: number[] = [];
      for (let i = 0; i < sparkCount; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / sparkCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i + 0.45;
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.abs(Math.cos(phi)) * 0.78 + 0.1,
          Math.sin(phi) * Math.sin(theta)
        ).normalize();
        sparkDirs.push(dir);
        sparkQuats.push(new THREE.Quaternion().setFromUnitVectors(_axisY, dir));
        sparkSpeeds.push(11.5 + (i % 6) * 2.4);
        _tmpColor.setHex(i % 3 === 0 ? 0xfef9c3 : i % 2 === 0 ? 0xfacc15 : 0xfb923c);
        sparkInstanced.setColorAt(i, _tmpColor);
      }
      if (sparkInstanced.instanceColor) sparkInstanced.instanceColor.needsUpdate = true;

      // =========================================================================
      // GPU POST-PROCESSING PIPELINE (UnrealBloom + Supernova Chromatic Shock Pass)
      // Skipped cleanly on software WebGL (SwiftShader/llvmpipe) per Three.js guidelines
      // =========================================================================
      let composer: EffectComposer | null = null;
      let renderPass: RenderPass | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let shockPass: ShaderPass | null = null;
      let outputPass: OutputPass | null = null;

      const shockUniforms = {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uAberration: { value: 0.0012 },
        uShockWave: { value: 0 },
        uShockRadius: { value: 0 },
        uAnamorphic: { value: 0.04 },
        uFlash: { value: 0 },
        uVignette: { value: 0.40 }
      };

      if (!isSoftwareGl) {
        const initW = window.innerWidth;
        const initH = Math.max(1, window.innerHeight);
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);
        bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.16, 0.20, 1.22);
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
            uniform float uTime;
            uniform float uAberration;
            uniform float uShockWave;
            uniform float uShockRadius;
            uniform float uAnamorphic;
            uniform float uFlash;
            uniform float uVignette;
            varying vec2 vUv;

            void main() {
              vec2 center = vec2(0.5, 0.5);
              vec2 toCenter = vUv - center;
              float dist = length(toCenter);
              vec2 dir = dist > 0.0001 ? toCenter / dist : vec2(0.0);

              // Radial Supernova Shockwave Distortion Ring
              float ringDiff = dist - uShockRadius;
              float ringBand = exp(-ringDiff * ringDiff * 180.0) * uShockWave;
              vec2 uv = clamp(vUv - dir * ringBand * 0.028, 0.001, 0.999);

              // Radial Chromatic Aberration
              vec2 caOffset = dir * uAberration * (0.35 + dist * 1.15 + ringBand * 1.4);
              float r = texture2D(tDiffuse, clamp(uv + caOffset, 0.001, 0.999)).r;
              float g = texture2D(tDiffuse, uv).g;
              float b = texture2D(tDiffuse, clamp(uv - caOffset, 0.001, 0.999)).b;
              vec3 col = vec3(r, g, b);

              // Subtle Horizontal Anamorphic Solar Flare Streak
              float hBand = exp(-abs(vUv.y - 0.5) * 54.0) * exp(-abs(vUv.x - 0.5) * 3.8);
              col += vec3(0.95, 0.54, 0.16) * hBand * uAnamorphic;

              // Impact Shockwave Gold Rim
              col += vec3(0.95, 0.72, 0.34) * ringBand * 0.09;

              // Subtle Impact Flash Pulse (no overexposure)
              col += vec3(0.95, 0.74, 0.42) * uFlash;

              // Cinematic Vignette
              float vig = smoothstep(0.34, 0.96, dist);
              col *= 1.0 - vig * uVignette;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        });
        outputPass = new OutputPass();

        composer.addPass(renderPass);
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
        if (composer) {
          composer.setSize(w, h);
        }
        if (bloomPass) {
          bloomPass.resolution.set(w, h);
        }
      };
      window.addEventListener('resize', handleResize);

      let raf = 0;
      let timerId: ReturnType<typeof setTimeout> | null = null;
      let disposed = false;
      let lastFrameTime = performance.now();
      let lastPhase: CutscenePhase = 'eclipse';
      let lastUiPct = -1;

      const afterDraw = (nextTick: FrameRequestCallback) => {
        if (disposed) return;
        if (isSoftwareGl) {
          const gl = renderer?.getContext() as WebGL2RenderingContext | undefined;
          if (gl && typeof gl.fenceSync === 'function') {
            const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
            gl.flush();
            const poll = () => {
              if (disposed) {
                if (sync) gl.deleteSync(sync);
                return;
              }
              const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
              if (state === gl.UNSIGNALED) {
                timerId = setTimeout(poll, 5);
              } else {
                if (sync) gl.deleteSync(sync);
                timerId = setTimeout(() => {
                  if (!disposed) raf = requestAnimationFrame(nextTick);
                }, 80);
              }
            };
            timerId = setTimeout(poll, 5);
          } else {
            renderer?.getContext().finish();
            timerId = setTimeout(() => {
              if (!disposed) raf = requestAnimationFrame(nextTick);
            }, 80);
          }
        } else {
          raf = requestAnimationFrame(nextTick);
        }
      };

      const tick = (now: number) => {
        if (disposed || !renderer) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
        lastFrameTime = now;
        const elapsedSec = now * 0.001;

        const elapsedSinceSync = (now - lastSyncTimeRef.current) / 1000;
        const estRemaining = Math.max(0, remainingRef.current - elapsedSinceSync);
        const p = Math.max(0, Math.min(1, 1 - estRemaining / Math.max(0.1, totalDuration)));

        const pct = Math.round(p * 100);
        if (pct !== lastUiPct) {
          lastUiPct = pct;
          setUiProgress(pct);
        }

        const nextPhase: CutscenePhase =
          p < 0.32 ? 'eclipse' : p < 0.65 ? 'incarnation' : 'supernova';
        if (nextPhase !== lastPhase) {
          lastPhase = nextPhase;
          setPhase(nextPhase);
        }

        // Update sky dome, lava lake, corona, god-rays & lance sheath shader uniforms
        skyUniforms.uTime.value = elapsedSec;
        skyUniforms.uIntensity.value = p < 0.32 ? 0.22 + (p / 0.32) * 0.14 : p < 0.65 ? 0.36 + ((p - 0.32) / 0.33) * 0.22 : 0.56;
        lavaUniforms.uTime.value = elapsedSec;
        lavaUniforms.uSurge.value = p < 0.32 ? 0.22 : p < 0.65 ? 0.42 : 0.62;
        coronaAuraUniforms.uTime.value = elapsedSec;
        coronaAuraUniforms.uPower.value = p < 0.32 ? 0.24 : p < 0.65 ? 0.34 : 0.42;
        godRayUniforms.uTime.value = elapsedSec;
        godRayUniforms.uIntensity.value = p < 0.32 ? 0.08 + (p / 0.32) * 0.05 : p < 0.65 ? 0.13 + ((p - 0.32) / 0.33) * 0.06 : 0.19;
        godRaysGroup.rotation.z -= dt * (p < 0.32 ? 0.14 : p < 0.65 ? 0.35 : 0.62);
        lanceSheathUniforms.uTime.value = elapsedSec;
        lanceSheathUniforms.uHeat.value = p < 0.32 ? 0.18 : p < 0.65 ? 0.3 : 0.38;

        // Cosmic background, prominence loops, gyroscope rings & asteroid belt rotation
        const spinBoost = p < 0.32 ? 1 : p < 0.65 ? 2.4 : 3.8;
        gyroRingA.rotation.x += dt * 0.9 * spinBoost;
        gyroRingA.rotation.y += dt * 1.1 * spinBoost;
        gyroRingB.rotation.y -= dt * 1.25 * spinBoost;
        gyroRingB.rotation.z += dt * 0.7 * spinBoost;
        gyroRingC.rotation.x -= dt * 0.65 * spinBoost;
        gyroRingC.rotation.z -= dt * 0.85 * spinBoost;
        coronaBillboard.rotation.z += dt * 0.42 * spinBoost;
        prominenceGroup.rotation.z -= dt * 0.32 * spinBoost;

        // Animate orbiting asteroid belt around eclipse sun
        for (let i = 0; i < asteroidCount; i++) {
          const ang = asteroidAngles[i] + elapsedSec * (0.28 + (i % 3) * 0.08) * (p >= 0.65 ? 1.8 : 1.0);
          const rad = asteroidRadii[i];
          _dummy.position.set(
            Math.cos(ang) * rad,
            asteroidYOffsets[i] + Math.sin(ang * 2) * 0.25,
            Math.sin(ang) * rad * 0.55
          );
          _dummy.rotation.set(elapsedSec + i, ang, i * 0.7);
          _dummy.scale.setScalar(0.75 + (i % 4) * 0.28);
          _dummy.updateMatrix();
          asteroidBelt.setMatrixAt(i, _dummy.matrix);
        }
        asteroidBelt.instanceMatrix.needsUpdate = true;

        // Rising volcanic ember particles (in-place array update)
        const emberRiseMult = p < 0.32 ? 1.0 : p < 0.65 ? 2.1 : 3.2;
        for (let i = 0; i < emberCount; i++) {
          const idx = i * 3;
          emberPos[idx + 1] += dt * emberSpeeds[i] * emberRiseMult;
          if (emberPos[idx + 1] > 9.2) {
            emberPos[idx + 1] = 0.08;
          }
        }
        emberPosAttr.needsUpdate = true;
        emberPoints.rotation.y += dt * 0.35 * spinBoost;

        for (let i = 0; i < spireGlows.length; i++) {
          spireGlows[i].rotation.y += dt * 2.5;
        }

        // Levitating pillar capstones rise with solar gravity
        const capstoneLift = p < 0.32 ? (p / 0.32) * 0.35 : p < 0.65 ? 0.35 + ((p - 0.32) / 0.33) * 0.75 : 1.1;
        for (let i = 0; i < pillarCapstones.length; i++) {
          pillarCapstones[i].position.y =
            pillarCapstoneBaseY + capstoneLift + Math.sin(elapsedSec * 2.8 + i) * 0.1;
          pillarCapstones[i].rotation.y += dt * (0.7 + (p >= 0.32 ? 1.2 : 0));
        }

        // Dynamic target FOV & Post-Processing intensities
        let targetFov = 48;
        let bloomStrength = 0.58;
        let aberration = 0.0016;
        let shockWaveStrength = 0;
        let shockRadius = 0;
        let anamorphicStrength = 0.14;
        let postFlash = 0;

        if (p < 0.32) {
          // PHASE I: Solar Eclipse + Reverse-Gravity Implosion
          const ep = p / 0.32;
          const ease = 1 - Math.pow(1 - ep, 3);

          targetFov = 48 - ease * 1.6;
          bloomStrength = 0.14 + ease * 0.04;
          aberration = 0.0008 + ease * 0.0006;
          anamorphicStrength = 0.02 + ease * 0.02;

          skyUniforms.uFlash.value = 0;
          const starScale = 1.0 - ease * 0.14;
          eclipseStarGroup.scale.setScalar(starScale);
          coronaBillboardMat.opacity = 0.26 + Math.sin(ep * Math.PI * 4) * 0.05;

          solarisGroup.position.set(0, -0.06 * ease, 0.15);
          rightArmPivot.rotation.set(-0.75 - ease * 0.45, 0, -0.25);
          leftArmPivot.rotation.set(-0.55 - ease * 0.3, 0.35, 0.25);
          lanceGroup.position.set(0.58, 1.38, 0.35);
          lanceGroup.rotation.set(0.18, 0, -0.14);
          miniSunOrb.visible = false;

          for (let wIdx = 0; wIdx < 3; wIdx++) {
            const foldAngle = 0.95 - ease * 0.25 + wIdx * 0.18;
            rightWings[wIdx].rotation.set(0.35, -0.65, -foldAngle);
            leftWings[wIdx].rotation.set(0.35, 0.65, foldAngle);
          }
          solarHaloGroup.visible = false;
          helixGroup.visible = false;
          for (let g = 0; g < geysers.length; g++) geysers[g].visible = false;
          solarPillar.visible = false;
          novaFireball.visible = false;
          starburstInstanced.visible = false;
          accretionDisk.visible = false;
          shockwaveMagma.visible = false;
          shockwaveGold.visible = false;
          shockwaveTilt.visible = false;
          meteorInstanced.visible = false;
          slashTrailsGroup.visible = false;
          heatWaveDome.visible = false;
          fissureInstanced.visible = false;
          sparkInstanced.visible = false;

          contactRing.scale.setScalar(1.0 + ease * 0.35);
          contactRingMat.opacity = 0.45 + ease * 0.25;

          for (let i = 0; i < shardCount; i++) {
            const loopT = (ep * 1.9 + i / shardCount) % 1;
            const ang = shardAngles[i] + ep * Math.PI * 2.6;
            const rad = 6.2 * (1 - loopT) + 0.35;
            _dummy.position.set(
              Math.cos(ang) * rad,
              0.3 + (1 - loopT) * (1.2 + (i % 5) * 0.55) + loopT * 1.45,
              0.15 + Math.sin(ang) * rad
            );
            _dummy.rotation.set(loopT * 6, ang, i);
            _dummy.scale.setScalar(0.55 + loopT * 0.55);
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          // Update Obelisk Plasma Lightning Arcs feeding Solaris chest reactor
          _tmpVecA.set(0, 1.52 - 0.06 * ease, 0.5);
          for (let i = 0; i < obeliskCorePositions.length; i++) {
            const activeArc = ep > 0.16 && (i % 2 === 0 || ep > 0.45);
            arcLines[i].visible = activeArc;
            if (activeArc) {
              const src = obeliskCorePositions[i];
              const arr = arcPositionsList[i];
              for (let s = 0; s < arcSegments; s++) {
                const t = s / (arcSegments - 1);
                const env = Math.sin(t * Math.PI);
                const jitterX = Math.sin(elapsedSec * 42 + i * 3.7 + s * 2.3) * 0.26 * env;
                const jitterY = Math.cos(elapsedSec * 36 + i * 2.9 + s * 3.1) * 0.32 * env;
                const jitterZ = Math.sin(elapsedSec * 31 + i * 5.1 + s * 1.9) * 0.26 * env;
                arr[s * 3] = src.x + (_tmpVecA.x - src.x) * t + jitterX;
                arr[s * 3 + 1] = src.y + (_tmpVecA.y - src.y) * t + jitterY;
                arr[s * 3 + 2] = src.z + (_tmpVecA.z - src.z) * t + jitterZ;
              }
              arcPosAttrs[i].needsUpdate = true;
            }
          }
          arcMatGold.opacity = 0.55 + ease * 0.35;
          arcMatOrange.opacity = 0.5 + ease * 0.35;

          magmaPitMat.opacity = 0.58 + ease * 0.14;
          coreLight.intensity = 3.8 + ease * 2.6;
          backEclipseRim.intensity = 6.5 + ease * 2.5;
        } else if (p < 0.65) {
          // PHASE II: Solar Dragon Wings Unfurl + Helix Coils + Magma Geysers
          const ip = (p - 0.32) / 0.33;
          const ascendEase = 1 - Math.pow(1 - Math.min(1, ip * 1.25), 3);

          targetFov = 46.4 - ip * 2.9;
          bloomStrength = 0.18 + ip * 0.05;
          aberration = 0.0012 + ip * 0.001;
          anamorphicStrength = 0.03 + ip * 0.03;

          skyUniforms.uFlash.value = ip * 0.04;
          solarisGroup.position.set(0, ascendEase * 0.98, 0.15);
          capeMesh.rotation.x = 0.38 + Math.sin(ip * Math.PI * 6) * 0.12;

          for (let wIdx = 0; wIdx < 3; wIdx++) {
            const spread = 0.25 - wIdx * 0.34 + Math.sin(ip * Math.PI * 5 + wIdx) * 0.08;
            const openY = 0.22 * (1 - ascendEase);
            rightWings[wIdx].rotation.set(-0.08, -openY, spread);
            leftWings[wIdx].rotation.set(-0.08, openY, -spread);
          }
          solarHaloGroup.visible = true;
          solarHaloGroup.scale.setScalar(0.4 + ascendEase * 0.74);
          solarHaloGroup.rotation.z = ip * Math.PI * 2.4;

          // Twin Spiraling Flame Helix Ribbons coiling upward around Solaris
          helixGroup.visible = true;
          helixGroup.rotation.y += dt * 5.2;
          helixGroup.scale.set(0.85 + ip * 0.35, 0.65 + ascendEase * 0.5, 0.85 + ip * 0.35);
          helixMatA.opacity = 0.28 + ip * 0.32;
          helixMatB.opacity = 0.24 + ip * 0.3;

          // Sequential Magma Geyser eruptions around the temple rim
          geyserMat.opacity = 0.16 + ip * 0.28;
          for (let g = 0; g < geysers.length; g++) {
            const gDelay = g / geysers.length;
            const active = ip > gDelay * 0.55;
            geysers[g].visible = active;
            if (active) {
              const gProg = Math.min(1, (ip - gDelay * 0.55) / 0.45);
              geysers[g].scale.set(0.75 + gProg * 0.45, 0.25 + gProg * 0.85, 0.75 + gProg * 0.45);
              geysers[g].rotation.y += dt * 3.0;
            }
          }

          contactRing.scale.setScalar(1.4 + ascendEase * 0.9);
          contactRingMat.opacity = 0.5 - ascendEase * 0.15;

          const hoist = Math.min(1, ip * 1.3);
          rightArmPivot.rotation.set(-2.35 * hoist, 0, -0.35);
          leftArmPivot.rotation.set(-2.25 * hoist, 0.25, 0.35);
          lanceGroup.position.set(0.12, 2.15 + hoist * 0.35, 0.42);
          lanceGroup.rotation.set(0.28 - ip * 0.35, 0, 0.08);
          miniSunOrb.visible = true;
          const sunCharge = 0.35 + ip * 1.2 + Math.sin(ip * 32) * 0.06;
          miniSunOrb.scale.setScalar(sunCharge);

          eclipseStarGroup.scale.setScalar(0.86 + ip * 0.34);
          coronaBillboardMat.opacity = 0.34;

          // Converge all 6 Obelisk Plasma Lightning Arcs into the levitating Mini-Sun
          solarisGroup.updateMatrixWorld(true);
          miniSunOrb.getWorldPosition(_tmpVecA);
          for (let i = 0; i < obeliskCorePositions.length; i++) {
            arcLines[i].visible = true;
            const src = obeliskCorePositions[i];
            const arr = arcPositionsList[i];
            for (let s = 0; s < arcSegments; s++) {
              const t = s / (arcSegments - 1);
              const env = Math.sin(t * Math.PI);
              const jitterX = Math.sin(elapsedSec * 56 + i * 4.1 + s * 2.6) * 0.36 * env;
              const jitterY = Math.cos(elapsedSec * 48 + i * 3.3 + s * 2.9) * 0.42 * env;
              const jitterZ = Math.sin(elapsedSec * 44 + i * 5.7 + s * 2.1) * 0.36 * env;
              arr[s * 3] = src.x + (_tmpVecA.x - src.x) * t + jitterX;
              arr[s * 3 + 1] = src.y + (_tmpVecA.y - src.y) * t + jitterY;
              arr[s * 3 + 2] = src.z + (_tmpVecA.z - src.z) * t + jitterZ;
            }
            arcPosAttrs[i].needsUpdate = true;
          }
          arcMatGold.opacity = 0.92;
          arcMatOrange.opacity = 0.88;

          // Crescent slash trails begin manifesting behind Lance windup at late Phase II
          if (ip > 0.62) {
            const wT = (ip - 0.62) / 0.38;
            slashTrailsGroup.visible = true;
            slashTrailsGroup.position.set(0.1, 2.25 + wT * 0.35, 0.45);
            slashTrailsGroup.scale.setScalar(0.65 + wT * 0.45);
            slashTrailsGroup.rotation.set(0.25, wT * 1.4, wT * 0.9);
            slashTrailMat.opacity = wT * 0.72;
          } else {
            slashTrailsGroup.visible = false;
          }

          for (let i = 0; i < shardCount; i++) {
            const loopT = (ip * 2.5 + i / shardCount) % 1;
            const ang = shardAngles[i] - ip * Math.PI * 4.2;
            const rad = 4.4 * (1 - loopT);
            _dummy.position.set(
              Math.cos(ang) * rad,
              1.4 + ascendEase * 0.98 + Math.sin(loopT * Math.PI) * 1.1,
              0.35 + Math.sin(ang) * rad
            );
            _dummy.rotation.set(ip * 8 + i, ang, i);
            _dummy.scale.setScalar(0.72 * (1 - loopT * 0.45));
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          solarPillar.visible = false;
          novaFireball.visible = false;
          starburstInstanced.visible = false;
          accretionDisk.visible = false;
          shockwaveMagma.visible = false;
          shockwaveGold.visible = false;
          shockwaveTilt.visible = false;
          meteorInstanced.visible = false;
          heatWaveDome.visible = false;
          fissureInstanced.visible = false;
          sparkInstanced.visible = false;

          coreLight.intensity = 6.4 + ip * 3.2;
          backEclipseRim.intensity = 8.5 + ip * 2.5;
        } else {
          // PHASE III: Sunfire Lance Slam -> Cataclysmic Supernova + Starburst + Meteor Rain
          const sp = (p - 0.65) / 0.35;
          const slamT = Math.min(1, sp / 0.18);
          const blastT = Math.min(1, sp / 0.55);
          const blastEase = 1 - Math.pow(1 - blastT, 3);

          const impactDecay = Math.max(0, 1 - sp / 0.45);
          targetFov = sp < 0.16 ? 43.5 + (sp / 0.16) * 13.5 : 57.0 - Math.min(1, (sp - 0.16) / 0.84) * 8.0;
          bloomStrength = sp < 0.18 ? 0.28 - (sp / 0.18) * 0.06 : 0.22 - (sp - 0.18) * 0.08;
          aberration = 0.0012 + impactDecay * 0.0032;
          shockWaveStrength = sp < 0.65 ? Math.max(0, 1 - sp / 0.65) : 0;
          shockRadius = 0.06 + sp * 1.25;
          anamorphicStrength = 0.03 + impactDecay * 0.06;
          postFlash = sp < 0.09 ? (1 - sp / 0.09) * 0.045 : 0;

          skyUniforms.uFlash.value = sp < 0.14 ? (1 - sp / 0.14) * 0.12 : 0;

          solarisGroup.position.set(0, (1 - slamT) * 0.98, 0.15 + slamT * 0.25);
          rightArmPivot.rotation.set(-2.35 + slamT * 1.65, 0, -0.2);
          leftArmPivot.rotation.set(-2.25 + slamT * 1.3, 0.25, 0.2);
          lanceGroup.position.set(0.22, 2.45 - slamT * 1.25, 0.58);
          lanceGroup.rotation.set(0.15 + slamT * 2.85, 0, 0);
          miniSunOrb.visible = sp < 0.18;
          miniSunOrb.scale.setScalar(1.8 + sp * 4);

          for (let wIdx = 0; wIdx < 3; wIdx++) {
            const spread = 0.28 - wIdx * 0.32;
            rightWings[wIdx].rotation.set(-0.14, 0, spread);
            leftWings[wIdx].rotation.set(-0.14, 0, -spread);
          }
          solarHaloGroup.visible = true;
          solarHaloGroup.scale.setScalar(1.25);
          solarHaloGroup.rotation.z += dt * 4.5;
          helixGroup.visible = false;

          // Flash plasma lightning arcs briefly on impact then dissolve
          for (let i = 0; i < arcLines.length; i++) {
            arcLines[i].visible = sp < 0.14;
          }

          // Crescent Slash Trails flare dramatically during downward Lance slam
          if (sp < 0.45) {
            const slashFade = 1 - sp / 0.45;
            slashTrailsGroup.visible = true;
            slashTrailsGroup.position.set(0.12, 1.95 - slamT * 0.75, 0.58);
            slashTrailsGroup.scale.setScalar(1.1 + blastEase * 1.35);
            slashTrailsGroup.rotation.x += dt * 6.5;
            slashTrailsGroup.rotation.z += dt * 4.2;
            slashTrailMat.opacity = 0.58 * slashFade;
          } else {
            slashTrailsGroup.visible = false;
          }

          // All 6 magma geysers roar upward during impact
          geyserMat.opacity = Math.max(0.08, 0.44 * (1 - sp * 0.72));
          for (let g = 0; g < geysers.length; g++) {
            geysers[g].visible = true;
            geysers[g].scale.set(1.15 + blastEase * 0.35, 1.28, 1.15 + blastEase * 0.35);
            geysers[g].rotation.y += dt * 4.2;
          }

          contactRing.scale.setScalar(2.0 + blastEase * 3.5);
          contactRingMat.opacity = Math.max(0.12, 0.58 * (1 - sp));

          // Sky-piercing Solar Beam Pillar
          solarPillar.visible = true;
          const pillarScale = sp < 0.2 ? 0.35 + (sp / 0.2) * 0.75 : Math.max(0.18, 1.1 - (sp - 0.2) * 0.9);
          solarPillar.scale.set(pillarScale, 1, pillarScale);
          pillarMat.opacity = sp < 0.2 ? 0.26 : Math.max(0.04, 0.26 - (sp - 0.2) * 0.24);

          // Compact Supernova Plasma Fireball Core
          novaFireball.visible = sp < 0.52;
          if (novaFireball.visible) {
            const fbScale = 0.42 + blastEase * 2.1;
            novaFireball.scale.setScalar(fbScale);
            novaCoreUniforms.uTime.value = elapsedSec;
            novaCoreUniforms.uAlpha.value = sp < 0.12 ? 0.34 : Math.max(0, 0.34 * (1 - (sp - 0.12) / 0.4));
          }

          // Expanding Crisp Fresnel Heat-Wave Rim Bubble
          heatWaveDome.visible = sp < 0.78;
          if (heatWaveDome.visible) {
            heatWaveDome.scale.setScalar(1.2 + blastEase * 10.5);
            heatDomeUniforms.uTime.value = elapsedSec;
            heatDomeUniforms.uAlpha.value = Math.max(0, 0.30 * (1 - sp / 0.78));
          }

          // 16 Radial Ground Flame Fissure Streaks racing along the altar floor
          fissureInstanced.visible = sp < 0.88;
          if (fissureInstanced.visible) {
            const fDist = 0.8 + blastEase * 8.6;
            for (let i = 0; i < fissureCount; i++) {
              const ang = (i * Math.PI * 2) / fissureCount + (i % 2) * 0.11;
              _dummy.position.set(Math.cos(ang) * fDist, 0.06, 0.4 + Math.sin(ang) * fDist);
              _dummy.rotation.set(0, -ang + Math.PI / 2, 0);
              _dummy.scale.set(1.0 + (1 - sp) * 0.7, 1, 0.85 + blastEase * 1.6);
              _dummy.updateMatrix();
              fissureInstanced.setMatrixAt(i, _dummy.matrix);
            }
            fissureInstanced.instanceMatrix.needsUpdate = true;
            fissureMat.opacity = Math.max(0, 0.52 * (1 - sp / 0.88));
          }

          // 12 Radial Starburst Sun-Spear Light Rays
          starburstInstanced.visible = sp < 0.82;
          if (starburstInstanced.visible) {
            const rayDist = 1.2 + blastEase * 6.5;
            for (let i = 0; i < starburstCount; i++) {
              _tmpVecA.copy(starburstDirs[i]).multiplyScalar(rayDist);
              _dummy.position.set(_tmpVecA.x, 1.25 + _tmpVecA.y, 0.4 + _tmpVecA.z);
              _dummy.quaternion.copy(starburstQuats[i]);
              const stretch = Math.max(0.2, 1.2 - sp * 0.9);
              _dummy.scale.set(stretch, 0.9 + blastEase * 1.1, stretch);
              _dummy.updateMatrix();
              starburstInstanced.setMatrixAt(i, _dummy.matrix);
            }
            starburstInstanced.instanceMatrix.needsUpdate = true;
            starburstMat.opacity = Math.max(0, 0.36 * (1 - sp / 0.82));
          }

          accretionDisk.visible = true;
          const accScale = 0.6 + blastEase * 6.4;
          accretionDisk.scale.setScalar(accScale);
          accretionDisk.rotation.z += dt * 2.4;
          accretionMat.opacity = sp < 0.3 ? 0.30 : Math.max(0.05, 0.30 - (sp - 0.3) * 0.30);

          shockwaveMagma.visible = true;
          shockwaveGold.visible = true;
          shockwaveTilt.visible = true;
          shockwaveMagma.scale.setScalar(0.8 + blastEase * 13.5);
          shockwaveGold.scale.setScalar(0.5 + blastEase * 10.2);
          shockwaveTilt.scale.setScalar(0.6 + blastEase * 8.6);
          shockwaveTilt.rotation.z += dt * 1.6;

          // Falling Molten Meteor Rain across the cosmic sky
          meteorInstanced.visible = true;
          for (let i = 0; i < meteorCount; i++) {
            const m = meteorOffsets[i];
            const fallT = (sp * m.speed * 0.18 + i * 0.07) % 1;
            _tmpVecB.copy(meteorDir).multiplyScalar(fallT * 18);
            _dummy.position.set(m.x + _tmpVecB.x, m.y + _tmpVecB.y, m.z + _tmpVecB.z);
            _dummy.quaternion.copy(meteorQuat);
            _dummy.scale.set(0.8, 1.0 + (i % 3) * 0.45, 0.8);
            _dummy.updateMatrix();
            meteorInstanced.setMatrixAt(i, _dummy.matrix);
          }
          meteorInstanced.instanceMatrix.needsUpdate = true;
          meteorMat.opacity = sp < 0.2 ? sp / 0.2 : Math.max(0.2, 1 - (sp - 0.2) * 0.75);

          // 60 High-Speed Spark Needles shooting outward faster than shards
          sparkInstanced.visible = sp < 0.9;
          if (sparkInstanced.visible) {
            for (let i = 0; i < sparkCount; i++) {
              const sDist = blastEase * sparkSpeeds[i] * 1.45;
              _dummy.position.set(
                sparkDirs[i].x * sDist,
                Math.max(0.15, 1.3 + sparkDirs[i].y * sDist),
                0.4 + sparkDirs[i].z * sDist
              );
              _dummy.quaternion.copy(sparkQuats[i]);
              const lenScale = Math.max(0.2, 1.45 - sp * 1.15);
              _dummy.scale.set(1, lenScale, 1);
              _dummy.updateMatrix();
              sparkInstanced.setMatrixAt(i, _dummy.matrix);
            }
            sparkInstanced.instanceMatrix.needsUpdate = true;
            sparkMat.opacity = Math.max(0, 0.96 * (1 - sp / 0.9));
          }

          // Supernova Ejected Solar Meteorites blasting radially outward
          for (let i = 0; i < shardCount; i++) {
            const dist = blastEase * shardSpeeds[i] * 1.5;
            _dummy.position.set(
              shardDirs[i].x * dist,
              Math.max(0.18, 1.35 + shardDirs[i].y * dist * 0.95),
              0.4 + shardDirs[i].z * dist
            );
            _dummy.rotation.set(blastEase * 12 + i, blastEase * 9, i * 0.5);
            _dummy.scale.setScalar(Math.max(0.35, 1.25 - sp * 0.7));
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          eclipseStarGroup.scale.setScalar(1.2 + Math.sin(sp * Math.PI) * 0.28);

          coreLight.intensity = Math.max(4.5, 9.5 * (1 - sp * 0.5));
          backEclipseRim.intensity = Math.max(6.5, 11.0 * (1 - sp * 0.4));
          magmaPitMat.opacity = 0.70;
        }

        // Dynamic 3D Camera Choreography + FOV Punch
        if (p < 0.32) {
          const ep = p / 0.32;
          _camTarget.set(1.95 - ep * 0.82, 0.95 + ep * 0.48, 5.3 - ep * 0.6);
          _lookTarget.set(0, 1.72 + ep * 0.45, -0.45);
        } else if (p < 0.65) {
          const ip = (p - 0.32) / 0.33;
          const camAng = 0.22 - ip * 1.18;
          const camDist = 4.75 + ip * 1.65;
          _camTarget.set(
            Math.sin(camAng) * camDist,
            1.95 + ip * 1.35,
            Math.cos(camAng) * camDist
          );
          _lookTarget.set(0, 1.88 + ip * 0.55, -0.25);
        } else {
          const sp = (p - 0.65) / 0.35;
          const shakeMag = sp < 0.32 ? (1 - sp / 0.32) * 0.44 : 0;
          const shakeX = Math.sin(now * 0.11) * shakeMag;
          const shakeY = Math.cos(now * 0.14) * shakeMag;
          const camAng = -0.96 + sp * 1.32;
          const camDist = 6.4 + Math.min(1, sp * 1.35) * 3.35;
          _camTarget.set(
            Math.sin(camAng) * camDist + shakeX,
            2.95 + sp * 1.15 + shakeY,
            Math.cos(camAng) * camDist
          );
          _lookTarget.set(0, 1.68, -0.35);
        }

        const dampFactor = 1 - Math.exp(-8.0 * dt);
        camera.position.lerp(_camTarget, dampFactor);
        _currentLook.lerp(_lookTarget, dampFactor);
        camera.lookAt(_currentLook);

        const nextFov = camera.fov + (targetFov - camera.fov) * dampFactor;
        if (Math.abs(nextFov - camera.fov) > 0.015) {
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }

        if (composer && bloomPass) {
          bloomPass.strength = bloomStrength;
          shockUniforms.uTime.value = elapsedSec;
          shockUniforms.uAberration.value = aberration;
          shockUniforms.uShockWave.value = shockWaveStrength;
          shockUniforms.uShockRadius.value = shockRadius;
          shockUniforms.uAnamorphic.value = anamorphicStrength;
          shockUniforms.uFlash.value = postFlash;
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
        afterDraw(tick);
      };

      raf = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        if (raf) cancelAnimationFrame(raf);
        if (timerId !== null) clearTimeout(timerId);
        window.removeEventListener('resize', handleResize);
        renderPass?.dispose();
        bloomPass?.dispose();
        shockPass?.dispose();
        outputPass?.dispose();
        composer?.dispose();
        for (const item of disposables) {
          item.dispose();
        }
        renderer?.dispose();
      };
    } catch {
      onFallbackRef.current?.();
      return undefined;
    }
  }, [totalDuration]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b0202] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D Supernova Incarnation"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top Cinematic Letterbox Bar (solid dark fill, no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#120403]/92 border-b border-orange-500/45 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-game tracking-[0.24em] uppercase text-orange-300 truncate">
            SOLARIS IGNIS · SANCTUM IGNIS AURELIA &amp; LEDAKAN BINTANG 3D
          </p>
          <h2 className="font-title text-base sm:text-2xl font-black tracking-wider text-amber-300 truncate">
            SUPERNOVA INCARNATION
          </h2>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <span className="inline-block px-2.5 py-1 rounded border border-orange-400/45 bg-orange-950/75 text-[11px] font-game tracking-wider text-amber-200">
            {phase === 'eclipse'
              ? 'FASE I · GERHANA SANCTUM SURYA'
              : phase === 'incarnation'
                ? 'FASE II · AVATAR NAGA MATAHARI'
                : 'FASE III · LEDAKAN SUPERNOVA'}
          </span>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-[#120403]/92 border-t border-orange-500/45 px-5 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <p className="pointer-events-none text-[11px] sm:text-xs font-game tracking-wider text-orange-200/90 truncate">
          {PHASE_LABELS[phase]}
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-orange-950 hover:bg-orange-900 border border-orange-400/60 hover:border-amber-300 text-orange-50 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-amber-300" />
        </button>

        {/* Bottom Progress Strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-stone-900">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-200 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
