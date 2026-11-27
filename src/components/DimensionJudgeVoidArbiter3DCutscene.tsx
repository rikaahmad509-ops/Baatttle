import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FastForward, Sparkles } from 'lucide-react';

interface DimensionJudgeVoidArbiter3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutscenePhase = 'singularity' | 'arbiter' | 'severance' | 'ascension_return';

const PHASE_LABELS: Record<CutscenePhase, string> = {
  singularity: 'FASE I · KOMPRESI SINGULARITAS & RETAKAN RUANG DIMENSI',
  arbiter: 'FASE II · SAYAP KRISTAL & PEDANG AGUNG VOID ARBITER TERHUNUS',
  severance: 'FASE III · DIMENSION X-SLASH — REALITAS TERBELAH DUA!',
  ascension_return: 'FASE IV · WUJUD VOID ARBITER SEMPURNA — KEMBALI KE ARENA!'
};

const PHASE_BADGES: Record<CutscenePhase, string> = {
  singularity: 'FASE I · SINGULARITAS RUANG',
  arbiter: 'FASE II · VOID ARBITER',
  severance: 'FASE III · DIMENSION X-SLASH',
  ascension_return: 'FASE IV · ARBITER ASCENDED'
};

// Zero-GC module-scoped scratch math helpers
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 1.8, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();
const _axisY = new THREE.Vector3(0, 1, 0);

export const DimensionJudgeVoidArbiter3DCutscene: React.FC<DimensionJudgeVoidArbiter3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 5.4,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [phase, setPhase] = useState<CutscenePhase>('singularity');
  const [uiProgress, setUiProgress] = useState<number>(0);
  const [slashFlash, setSlashFlash] = useState<boolean>(false);

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
      renderer.toneMappingExposure = 0.86;
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
      scene.background = new THREE.Color(0x03020d);
      scene.fog = new THREE.FogExp2(0x07031a, 0.019);

      const camera = new THREE.PerspectiveCamera(
        46,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        180
      );
      camera.position.set(2.35, 1.3, 5.9);
      _currentLook.set(0, 1.8, -0.35);
      camera.lookAt(_currentLook);

      // Studio Reflections for Imperial Indigo Armor, Astral Gold & Crystal Blades
      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.55;
      trackTex(envRT.texture);
      envRT.dispose();
      roomEnv.dispose();
      pmrem.dispose();

      // Cosmic Astral Judgment 3-Point + Dynamic Core Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xa5b4fc, 0x0d0522, 0.62);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfef3c7, 1.55);
      keyLight.position.set(6, 12, 7);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 36;
        keyLight.shadow.camera.left = -10;
        keyLight.shadow.camera.right = 10;
        keyLight.shadow.camera.top = 10;
        keyLight.shadow.camera.bottom = -10;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x818cf8, 1.15);
      rimLight.position.set(-8, 7, -10);
      scene.add(rimLight);

      const singularityBackLight = new THREE.PointLight(0xa855f7, 7.5, 36, 1.45);
      singularityBackLight.position.set(0, 4.1, -5.2);
      scene.add(singularityBackLight);

      const coreLight = new THREE.PointLight(0x818cf8, 3.8, 20, 1.6);
      coreLight.position.set(0, 2.0, 1.4);
      scene.add(coreLight);

      const goldSlashLight = new THREE.PointLight(0xfbbf24, 2.8, 22, 1.55);
      goldSlashLight.position.set(0, 2.1, 2.3);
      scene.add(goldSlashLight);

      // =========================================================================
      // BACKGROUND 1: Custom GLSL Cosmic Spatial-Grid & Dimensional Rift Sky Dome
      // =========================================================================
      const skyUniforms = {
        uTime: { value: 0 },
        uEnergy: { value: 0.35 },
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
                p = p * 2.02 + vec3(0.17, -0.21, 0.14);
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldDir);
              float horizonGlow = pow(1.0 - abs(dir.y), 3.4);
              vec3 nebCoord = dir * 2.6 + vec3(uTime * 0.035, -uTime * 0.025, uTime * 0.02);
              float n1 = fbm(nebCoord);
              float n2 = fbm(nebCoord * 2.15 + vec3(n1 * 1.35));
              float riftBand = smoothstep(0.45, 0.85, n2);

              // Subtle cosmic astrolabe grid lines projected on celestial dome
              float lon = atan(dir.z, dir.x);
              float lat = asin(clamp(dir.y, -1.0, 1.0));
              float gridLon = smoothstep(0.975, 0.996, abs(cos(lon * 6.0 + uTime * 0.08)));
              float gridLat = smoothstep(0.975, 0.996, abs(cos(lat * 6.0)));
              float celestialGrid = max(gridLon, gridLat) * smoothstep(-0.1, 0.65, dir.y);

              vec3 deepVoid = vec3(0.012, 0.008, 0.045);
              vec3 royalIndigo = vec3(0.09, 0.07, 0.34);
              vec3 astralViolet = vec3(0.36, 0.12, 0.58);
              vec3 goldDust = vec3(0.75, 0.52, 0.14);

              vec3 col = mix(deepVoid, royalIndigo, n1 * 0.85 + horizonGlow * 0.45);
              col += astralViolet * riftBand * (0.3 + uEnergy * 0.45);
              col += goldDust * pow(riftBand, 3.2) * (0.14 + uEnergy * 0.25);
              col += vec3(0.38, 0.42, 0.92) * celestialGrid * (0.12 + uEnergy * 0.22);

              // Crisp twinkling stars
              float starCell = hash(floor(dir * 155.0));
              float star = smoothstep(0.992, 0.999, starCell) * smoothstep(-0.08, 0.45, dir.y);
              float twinkle = 0.55 + 0.45 * sin(uTime * 4.5 + starCell * 90.0);
              col += mix(vec3(0.82, 0.88, 1.0), vec3(1.0, 0.9, 0.65), step(0.997, starCell)) * star * twinkle;

              // Reality slash sky flash
              col += vec3(0.55, 0.45, 0.98) * uFlash * 0.4;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      scene.add(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(92, 32, 24)), skyMat));

      // =========================================================================
      // BACKGROUND 2: Abyssal Spatial Fracture Sea + Astrolabe Judgment Dais
      // =========================================================================
      const abyssSeaUniforms = {
        uTime: { value: 0 },
        uSurge: { value: 0.35 }
      };
      const abyssSeaMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: abyssSeaUniforms,
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
              float r = length(vPos.xy);
              float ang = atan(vPos.y, vPos.x);
              float pulseRing = 0.5 + 0.5 * sin(r * 1.15 - uTime * 2.8);
              float crackRay = smoothstep(0.94, 0.995, abs(sin(ang * 6.0 + sin(r * 0.35) * 0.9)));
              float veins = smoothstep(0.32, 0.94, pulseRing * 0.55 + crackRay * 0.7);
              float edge = 1.0 - smoothstep(16.0, 34.0, r);

              vec3 darkBed = vec3(0.015, 0.01, 0.05);
              vec3 indigoRift = vec3(0.24, 0.22, 0.76);
              vec3 goldCrack = vec3(0.95, 0.72, 0.2);

              vec3 col = mix(darkBed, indigoRift, veins * (0.4 + uSurge * 0.45));
              col += goldCrack * crackRay * pow(veins, 2.2) * (0.28 + uSurge * 0.55);
              gl_FragColor = vec4(col, edge * 0.92);
            }
          `
        })
      );
      const abyssPlane = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(76, 76)), abyssSeaMat);
      abyssPlane.rotation.x = -Math.PI / 2;
      abyssPlane.position.y = -0.68;
      scene.add(abyssPlane);

      // Procedural Texture 1: 1024px Dimensional Astrolabe & Spatial Fracture Seal
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = 1024;
      floorCanvas.height = 1024;
      const fctx = floorCanvas.getContext('2d');
      if (fctx) {
        fctx.fillStyle = '#060318';
        fctx.fillRect(0, 0, 1024, 1024);

        const rg = fctx.createRadialGradient(512, 512, 24, 512, 512, 495);
        rg.addColorStop(0, 'rgba(192, 132, 252, 0.78)');
        rg.addColorStop(0.26, 'rgba(99, 102, 241, 0.48)');
        rg.addColorStop(0.62, 'rgba(49, 46, 129, 0.25)');
        rg.addColorStop(1, 'rgba(6, 3, 24, 0)');
        fctx.fillStyle = rg;
        fctx.fillRect(0, 0, 1024, 1024);

        const radii = [125, 225, 315, 410, 470];
        for (let rIdx = 0; rIdx < radii.length; rIdx++) {
          const rad = radii[rIdx];
          fctx.strokeStyle = rIdx % 2 === 0 ? 'rgba(251, 191, 36, 0.85)' : 'rgba(129, 140, 248, 0.8)';
          fctx.lineWidth = rIdx === 3 ? 4.2 : 2.6;
          fctx.beginPath();
          fctx.arc(512, 512, rad, 0, Math.PI * 2);
          fctx.stroke();
        }

        // Compass tick marks along outer astrolabe dial
        for (let t = 0; t < 48; t++) {
          const a = (t * Math.PI * 2) / 48;
          const innerR = t % 4 === 0 ? 410 : 440;
          fctx.strokeStyle = t % 4 === 0 ? 'rgba(253, 224, 71, 0.88)' : 'rgba(165, 180, 252, 0.55)';
          fctx.lineWidth = t % 4 === 0 ? 3.2 : 1.6;
          fctx.beginPath();
          fctx.moveTo(512 + Math.cos(a) * innerR, 512 + Math.sin(a) * innerR);
          fctx.lineTo(512 + Math.cos(a) * 470, 512 + Math.sin(a) * 470);
          fctx.stroke();
        }

        // Geometric Dodecagram & Diamond Glyph Nodes
        for (let s = 0; s < 12; s++) {
          const a = (s * Math.PI * 2) / 12;
          fctx.strokeStyle = s % 3 === 0 ? 'rgba(251, 191, 36, 0.65)' : 'rgba(192, 132, 252, 0.45)';
          fctx.lineWidth = s % 3 === 0 ? 2.8 : 1.5;
          fctx.beginPath();
          fctx.moveTo(512 + Math.cos(a) * 85, 512 + Math.sin(a) * 85);
          fctx.lineTo(512 + Math.cos(a) * 470, 512 + Math.sin(a) * 470);
          fctx.stroke();

          // Chord triangles for sacred astrolabe lattice
          const aNext = ((s + 4) * Math.PI * 2) / 12;
          fctx.strokeStyle = 'rgba(129, 140, 248, 0.36)';
          fctx.lineWidth = 1.6;
          fctx.beginPath();
          fctx.moveTo(512 + Math.cos(a) * 315, 512 + Math.sin(a) * 315);
          fctx.lineTo(512 + Math.cos(aNext) * 315, 512 + Math.sin(aNext) * 315);
          fctx.stroke();

          const gx = 512 + Math.cos(a) * 270;
          const gy = 512 + Math.sin(a) * 270;
          fctx.fillStyle = s % 2 === 0 ? '#fde047' : '#a5b4fc';
          fctx.beginPath();
          fctx.moveTo(gx, gy - 11);
          fctx.lineTo(gx + 8, gy);
          fctx.lineTo(gx, gy + 11);
          fctx.lineTo(gx - 8, gy);
          fctx.closePath();
          fctx.fill();
        }

        // Crisp Spatial Fracture Cracks
        for (let c = 0; c < 14; c++) {
          const ba = (c * Math.PI * 2) / 14 + 0.12;
          fctx.strokeStyle = c % 2 === 0 ? 'rgba(224, 231, 255, 0.72)' : 'rgba(192, 132, 252, 0.65)';
          fctx.lineWidth = 2.2;
          fctx.beginPath();
          let cx = 512;
          let cy = 512;
          fctx.moveTo(cx, cy);
          for (let seg = 1; seg <= 6; seg++) {
            const r = seg * 74;
            const jit = Math.sin(c * 5.2 + seg * 3.4) * 0.14;
            cx = 512 + Math.cos(ba + jit) * r;
            cy = 512 + Math.sin(ba + jit) * r;
            fctx.lineTo(cx, cy);
          }
          fctx.stroke();
        }
      }
      const floorTex = trackTex(new THREE.CanvasTexture(floorCanvas));
      floorTex.colorSpace = THREE.SRGBColorSpace;
      floorTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      // Shared PBR Materials
      const obsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0c0820,
          roughness: 0.64,
          metalness: 0.38
        })
      );
      const voidArmorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x1a1646,
          emissive: 0x16123b,
          emissiveIntensity: 0.16,
          roughness: 0.28,
          metalness: 0.84
        })
      );
      const imperialIndigoMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x4338ca,
          emissive: 0x2e2785,
          emissiveIntensity: 0.22,
          roughness: 0.26,
          metalness: 0.76
        })
      );
      const astralGoldMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0x78350f,
          emissiveIntensity: 0.16,
          roughness: 0.18,
          metalness: 0.92
        })
      );
      const violetEnergyMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xc084fc,
          emissive: 0xa855f7,
          emissiveIntensity: 1.25,
          roughness: 0.18,
          metalness: 0.18
        })
      );
      const starlightMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfef9c3,
          emissive: 0xfbbf24,
          emissiveIntensity: 1.32,
          roughness: 0.14,
          metalness: 0.12
        })
      );
      const iceWhiteBladeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xddd6fe,
          emissiveIntensity: 1.45,
          roughness: 0.12,
          metalness: 0.15
        })
      );
      const voidBlackMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x010006
        })
      );
      const capeMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x312e81,
          emissive: 0x1e1b4b,
          emissiveIntensity: 0.22,
          roughness: 0.68,
          metalness: 0.16,
          side: THREE.DoubleSide
        })
      );

      // Grounded Octagonal Spatial Architect Dais (y = 0 top surface)
      const daisGroup = new THREE.Group();
      scene.add(daisGroup);

      const daisMain = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(4.35, 5.1, 0.7, 8)),
        obsidianMat
      );
      daisMain.position.y = -0.35;
      daisMain.receiveShadow = !isSoftwareGl;

      const daisGoldRim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(4.38, 0.06, 10, 64)),
        astralGoldMat
      );
      daisGoldRim.rotation.x = Math.PI / 2;
      daisGoldRim.position.y = 0.01;

      const daisOuterRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(5.15, 0.045, 8, 64)),
        violetEnergyMat
      );
      daisOuterRing.rotation.x = Math.PI / 2;
      daisOuterRing.position.y = -0.08;

      const sealMat = trackMat(
        new THREE.MeshBasicMaterial({
          map: floorTex,
          transparent: true,
          opacity: 0.88,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        })
      );
      const astrolabeSeal = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(4.3, 64)), sealMat);
      astrolabeSeal.rotation.x = -Math.PI / 2;
      astrolabeSeal.position.y = 0.025;
      daisGroup.add(daisMain, daisGoldRim, daisOuterRing, astrolabeSeal);

      // Contact Shadow Disc beneath Judge when grounded
      const contactShadowCanvas = document.createElement('canvas');
      contactShadowCanvas.width = 128;
      contactShadowCanvas.height = 128;
      const csCtx = contactShadowCanvas.getContext('2d');
      if (csCtx) {
        const g = csCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
        g.addColorStop(0, 'rgba(3, 1, 12, 0.78)');
        g.addColorStop(0.55, 'rgba(3, 1, 12, 0.35)');
        g.addColorStop(1, 'rgba(3, 1, 12, 0)');
        csCtx.fillStyle = g;
        csCtx.fillRect(0, 0, 128, 128);
      }
      const contactShadowTex = trackTex(new THREE.CanvasTexture(contactShadowCanvas));
      const contactShadowMat = trackMat(
        new THREE.MeshBasicMaterial({
          map: contactShadowTex,
          transparent: true,
          opacity: 0.7,
          depthWrite: false
        })
      );
      const contactShadow = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.9, 1.9)), contactShadowMat);
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.set(0, 0.032, 0.15);
      scene.add(contactShadow);

      // 6 Floating Shattered Obsidian Monoliths + Levitating Crystal Capstones
      const monolithPillarGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.48, 3.6, 6));
      const monolithCapGeo = trackGeo(new THREE.OctahedronGeometry(0.34, 0));
      const monolithBandGeo = trackGeo(new THREE.TorusGeometry(0.44, 0.04, 6, 16));
      const monolithGroups: { group: THREE.Group; cap: THREE.Mesh; baseY: number; ang: number; rad: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6 + 0.38;
        const rad = 6.2 + (i % 2) * 0.95;
        const mg = new THREE.Group();
        const baseY = 1.15 + (i % 3) * 0.38;
        mg.position.set(Math.cos(ang) * rad, baseY, Math.sin(ang) * rad);
        mg.lookAt(0, baseY + 0.4, 0);
        mg.rotateX((i % 2 === 0 ? 1 : -1) * 0.14);

        const body = new THREE.Mesh(monolithPillarGeo, obsidianMat);
        const band = new THREE.Mesh(monolithBandGeo, i % 2 === 0 ? astralGoldMat : violetEnergyMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = 0.85;
        const cap = new THREE.Mesh(monolithCapGeo, i % 2 === 0 ? starlightMat : violetEnergyMat);
        cap.position.y = 2.25;
        mg.add(body, band, cap);
        scene.add(mg);
        monolithGroups.push({ group: mg, cap, baseY, ang, rad });
      }

      // 18 Instanced Zero-Gravity Floating Stone Debris Fragments
      const debrisCount = 18;
      const debrisInstanced = new THREE.InstancedMesh(
        trackGeo(new THREE.DodecahedronGeometry(0.28, 0)),
        obsidianMat,
        debrisCount
      );
      debrisInstanced.frustumCulled = false;
      scene.add(debrisInstanced);
      const debrisMeta: { ang: number; rad: number; y: number; speed: number; scale: number }[] = [];
      for (let i = 0; i < debrisCount; i++) {
        debrisMeta.push({
          ang: (i * Math.PI * 2) / debrisCount,
          rad: 5.1 + (i % 5) * 1.15,
          y: -0.2 + (i % 6) * 0.65,
          speed: (i % 2 === 0 ? 1 : -1) * (0.14 + (i % 4) * 0.04),
          scale: 0.55 + (i % 4) * 0.25
        });
      }

      // 6 Floating Spatial Rift Portals (with GLSL Swirl Core) + Energy Tether Beams
      const portalFrameGeo = trackGeo(new THREE.TorusGeometry(0.62, 0.055, 8, 36));
      const portalOuterRingGeo = trackGeo(new THREE.TorusGeometry(0.76, 0.024, 6, 32));
      const portalInnerGeo = trackGeo(new THREE.CircleGeometry(0.58, 28));
      const portalShaderUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 0.7 }
      };
      const portalInnerMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: portalShaderUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv * 2.0 - 1.0;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform float uTime;
            uniform float uIntensity;
            void main() {
              float r = length(vUv);
              float ang = atan(vUv.y, vUv.x);
              float swirl = 0.5 + 0.5 * sin(ang * 4.0 + r * 9.0 - uTime * 5.2);
              float ring = smoothstep(0.15, 0.92, r) * (1.0 - smoothstep(0.86, 1.0, r));
              vec3 col = mix(vec3(0.48, 0.24, 0.98), vec3(1.0, 0.82, 0.34), swirl * 0.55);
              float alpha = (ring * 0.65 + (1.0 - r) * 0.45 * swirl) * uIntensity;
              gl_FragColor = vec4(col * alpha, clamp(alpha, 0.0, 1.0));
            }
          `
        })
      );

      const portals: THREE.Group[] = [];
      const portalTethers: THREE.Mesh[] = [];
      const tetherGeo = trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 1, 8));
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const pg = new THREE.Group();
        pg.position.set(Math.cos(ang) * 4.0, 2.35 + (i % 2) * 0.45, Math.sin(ang) * 4.0);
        pg.lookAt(0, 2.2, 0.2);
        const frame = new THREE.Mesh(portalFrameGeo, astralGoldMat);
        const outerRing = new THREE.Mesh(portalOuterRingGeo, violetEnergyMat);
        const inner = new THREE.Mesh(portalInnerGeo, portalInnerMat);
        pg.add(frame, outerRing, inner);
        scene.add(pg);
        portals.push(pg);

        const tether = new THREE.Mesh(tetherGeo, i % 2 === 0 ? starlightMat : violetEnergyMat);
        tether.visible = false;
        scene.add(tether);
        portalTethers.push(tether);
      }

      // =========================================================================
      // BACKGROUND 3: Colossal Dimensional Singularity & 4D Tesseract Cage
      // =========================================================================
      const singularityGroup = new THREE.Group();
      singularityGroup.position.set(0, 3.85, -6.4);
      scene.add(singularityGroup);

      const blackHoleCore = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1.72, 32, 32)), voidBlackMat);

      const photonRimUniforms = {
        uTime: { value: 0 },
        uSurge: { value: 0.65 }
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
              float pulse = 0.85 + 0.15 * sin(uTime * 5.2 + vNormal.y * 5.0);
              float glow = pow(rim, 3.1) * pulse * uSurge;
              vec3 col = mix(vec3(0.55, 0.35, 0.98), vec3(1.0, 0.78, 0.25), pow(rim, 4.8));
              gl_FragColor = vec4(col * glow, clamp(glow, 0.0, 1.0));
            }
          `
        })
      );
      const photonRimSphere = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(2.15, 32, 32)), photonRimMat);

      const accretionUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 0.85 }
      };
      const accretionDiskMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: accretionUniforms,
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
              float s1 = 0.5 + 0.5 * sin(ang * 4.0 + r * 3.0 - uTime * 4.2);
              float s2 = 0.5 + 0.5 * cos(ang * 7.0 - r * 2.2 + uTime * 2.6);
              float mask = smoothstep(1.85, 2.35, r) * (1.0 - smoothstep(4.1, 5.4, r));
              float streak = smoothstep(0.22, 0.96, s1 * 0.65 + s2 * 0.35);
              vec3 col = mix(vec3(0.52, 0.28, 0.96), vec3(1.0, 0.82, 0.32), streak);
              float alpha = mask * (0.28 + streak * 0.62) * uIntensity;
              gl_FragColor = vec4(col * alpha, clamp(alpha, 0.0, 1.0));
            }
          `
        })
      );
      const accretionDisk = new THREE.Mesh(trackGeo(new THREE.RingGeometry(1.82, 5.4, 72, 2)), accretionDiskMat);
      accretionDisk.rotation.set(Math.PI / 2 - 0.38, 0.22, 0);

      const armillaryA = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(2.65, 0.058, 10, 72)), astralGoldMat);
      armillaryA.rotation.set(0.45, 0.3, 0);
      const armillaryB = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(3.25, 0.05, 10, 72)), violetEnergyMat);
      armillaryB.rotation.set(-0.7, 0.45, 0.25);
      const armillaryC = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(3.85, 0.042, 10, 72)), voidArmorMat);
      armillaryC.rotation.set(1.1, -0.35, 0.45);

      const outerCubeGeo = trackGeo(new THREE.BoxGeometry(4.15, 4.15, 4.15));
      const outerEdges = trackGeo(new THREE.EdgesGeometry(outerCubeGeo));
      const tesseractOuter = new THREE.LineSegments(
        outerEdges,
        trackMat(new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.78 }))
      );
      const innerCubeGeo = trackGeo(new THREE.BoxGeometry(2.55, 2.55, 2.55));
      const innerEdges = trackGeo(new THREE.EdgesGeometry(innerCubeGeo));
      const tesseractInner = new THREE.LineSegments(
        innerEdges,
        trackMat(new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.9 }))
      );

      singularityGroup.add(
        blackHoleCore,
        photonRimSphere,
        accretionDisk,
        armillaryA,
        armillaryB,
        armillaryC,
        tesseractOuter,
        tesseractInner
      );

      // =========================================================================
      // HERO: Sculpted Composite 3D DIMENSION JUDG -> VOID ARBITER
      // =========================================================================
      const judgeGroup = new THREE.Group();
      judgeGroup.position.set(0, 0, 0.15);
      scene.add(judgeGroup);

      // Articulated Legs (Hip Pivots -> Thigh -> Knee -> Shin/Boot)
      const thighGeo = trackGeo(new THREE.CylinderGeometry(0.135, 0.115, 0.46, 8));
      const shinGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.085, 0.48, 8));
      const bootGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.12, 0.28));
      const kneeGeo = trackGeo(new THREE.OctahedronGeometry(0.13, 0));

      const buildLeg = (side: -1 | 1) => {
        const hipPivot = new THREE.Group();
        hipPivot.position.set(side * 0.22, 0.88, 0);

        const thigh = new THREE.Mesh(thighGeo, voidArmorMat);
        thigh.position.y = -0.22;
        thigh.castShadow = !isSoftwareGl;

        const kneePivot = new THREE.Group();
        kneePivot.position.y = -0.44;
        const kneeGuard = new THREE.Mesh(kneeGeo, astralGoldMat);
        kneeGuard.position.set(0, 0, 0.11);
        const shin = new THREE.Mesh(shinGeo, voidArmorMat);
        shin.position.y = -0.22;
        shin.castShadow = !isSoftwareGl;
        const boot = new THREE.Mesh(bootGeo, imperialIndigoMat);
        boot.position.set(0, -0.42, 0.06);
        kneePivot.add(kneeGuard, shin, boot);

        hipPivot.add(thigh, kneePivot);
        judgeGroup.add(hipPivot);
        return { hipPivot, kneePivot };
      };
      const legL = buildLeg(-1);
      const legR = buildLeg(1);

      // Pelvis, Astral Belt & 4 Articulated Armored Tasset Waist Plates
      const pelvis = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.25, 0.3, 8)), imperialIndigoMat);
      pelvis.position.y = 0.96;
      const beltRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.31, 0.032, 8, 24)), astralGoldMat);
      beltRing.rotation.x = Math.PI / 2;
      beltRing.position.y = 1.05;
      const beltJewel = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.115, 0)), starlightMat);
      beltJewel.position.set(0, 1.03, 0.31);
      judgeGroup.add(pelvis, beltRing, beltJewel);

      const tassetShape = new THREE.Shape();
      tassetShape.moveTo(-0.14, 0);
      tassetShape.lineTo(0.14, 0);
      tassetShape.lineTo(0.22, -0.48);
      tassetShape.lineTo(0, -0.58);
      tassetShape.lineTo(-0.22, -0.48);
      tassetShape.closePath();
      const tassetGeo = trackGeo(
        new THREE.ExtrudeGeometry(tassetShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 })
      );
      const tassets: { mesh: THREE.Mesh; baseRotZ: number; side: number }[] = [];
      for (const side of [-1, 1]) {
        const t = new THREE.Mesh(tassetGeo, voidArmorMat);
        t.position.set(side * 0.31, 1.02, 0.06);
        t.rotation.y = side * (Math.PI / 2 - 0.32);
        const baseRotZ = side * 0.2;
        t.rotation.z = baseRotZ;
        judgeGroup.add(t);
        tassets.push({ mesh: t, baseRotZ, side });
      }

      // Upper Body Pivot (allows martial torso twist during slashes!)
      const torsoPivot = new THREE.Group();
      torsoPivot.position.y = 1.08;
      judgeGroup.add(torsoPivot);

      const chest = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.43, 0.28, 0.84, 8)), imperialIndigoMat);
      chest.position.y = 0.42;
      chest.castShadow = !isSoftwareGl;

      const gorget = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.29, 0.045, 8, 24)), astralGoldMat);
      gorget.rotation.x = Math.PI / 2 + 0.18;
      gorget.position.set(0, 0.82, 0.04);

      const chestRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.22, 0.032, 8, 24)), astralGoldMat);
      chestRing.position.set(0, 0.48, 0.36);
      const chestCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.145, 0)), violetEnergyMat);
      chestCore.position.set(0, 0.48, 0.38);
      torsoPivot.add(chest, gorget, chestRing, chestCore);

      // Twin-Split Imperial Astral Mantle / Cape (Center + Left/Right Tail Ribbons)
      const capeShape = new THREE.Shape();
      capeShape.moveTo(-0.46, 0);
      capeShape.lineTo(0.46, 0);
      capeShape.lineTo(0.92, -1.78);
      capeShape.lineTo(0.28, -1.42);
      capeShape.lineTo(0, -1.88);
      capeShape.lineTo(-0.28, -1.42);
      capeShape.lineTo(-0.92, -1.78);
      capeShape.closePath();
      const capeMesh = new THREE.Mesh(
        trackGeo(new THREE.ExtrudeGeometry(capeShape, { depth: 0.04, bevelEnabled: false })),
        capeMat
      );
      capeMesh.position.set(0, 0.78, -0.32);
      capeMesh.rotation.x = 0.28;
      torsoPivot.add(capeMesh);

      // Spiked Cosmic Shoulder Pauldrons
      const pauldronGeo = trackGeo(new THREE.DodecahedronGeometry(0.24, 0));
      const spikeGeo = trackGeo(new THREE.ConeGeometry(0.075, 0.46, 6));
      const buildPauldron = (side: -1 | 1) => {
        const pg = new THREE.Group();
        pg.position.set(side * 0.52, 0.72, 0);
        const main = new THREE.Mesh(pauldronGeo, astralGoldMat);
        main.scale.set(1.22, 0.78, 1.08);
        const spike = new THREE.Mesh(spikeGeo, violetEnergyMat);
        spike.position.set(side * 0.18, 0.24, 0);
        spike.rotation.z = -side * 0.55;
        pg.add(main, spike);
        torsoPivot.add(pg);
        return pg;
      };
      buildPauldron(-1);
      buildPauldron(1);

      // Crowned Void Arbiter Helm & Glowing Starlight Visor
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.04, 0.04);
      const helmMesh = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.24, 0)), voidArmorMat);
      const visorMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.3, 0.062, 0.16)), starlightMat);
      visorMesh.position.set(0, 0.02, 0.17);
      const crownGeo = trackGeo(new THREE.ConeGeometry(0.062, 0.54, 5));
      const hornL = new THREE.Mesh(crownGeo, astralGoldMat);
      hornL.position.set(-0.2, 0.26, -0.02);
      hornL.rotation.set(-0.2, 0, 0.48);
      const hornR = new THREE.Mesh(crownGeo, astralGoldMat);
      hornR.position.set(0.2, 0.26, -0.02);
      hornR.rotation.set(-0.2, 0, -0.48);
      const crownCenter = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.115, 0)), violetEnergyMat);
      crownCenter.position.set(0, 0.31, 0.06);
      headGroup.add(helmMesh, visorMesh, hornL, hornR, crownCenter);
      torsoPivot.add(headGroup);

      // 6 Articulated Dual-Layer Crystal Blade-Wings + Astrolabe Halo
      const wingRoot = new THREE.Group();
      wingRoot.position.set(0, 0.58, -0.35);
      torsoPivot.add(wingRoot);

      const bladeWingShape = new THREE.Shape();
      bladeWingShape.moveTo(0, 0);
      bladeWingShape.lineTo(1.62, 0.38);
      bladeWingShape.lineTo(2.05, 0.15);
      bladeWingShape.lineTo(1.36, -0.2);
      bladeWingShape.lineTo(0, -0.12);
      bladeWingShape.closePath();
      const wingBladeGeo = trackGeo(
        new THREE.ExtrudeGeometry(bladeWingShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 })
      );
      const wingSpineGeo = trackGeo(new THREE.BoxGeometry(1.15, 0.05, 0.065));

      const leftBladeWings: THREE.Group[] = [];
      const rightBladeWings: THREE.Group[] = [];
      for (let wIdx = 0; wIdx < 3; wIdx++) {
        const wMat = wIdx === 0 ? starlightMat : wIdx === 1 ? violetEnergyMat : imperialIndigoMat;
        const sc = 1.08 - wIdx * 0.16;

        const rwGroup = new THREE.Group();
        rwGroup.position.set(0.16, 0.2 - wIdx * 0.22, 0);
        const rwMesh = new THREE.Mesh(wingBladeGeo, wMat);
        const rwSpine = new THREE.Mesh(wingSpineGeo, astralGoldMat);
        rwSpine.position.set(0.62, 0.1, 0.02);
        rwSpine.rotation.z = 0.18;
        rwGroup.add(rwMesh, rwSpine);
        rwGroup.scale.setScalar(sc);
        rightBladeWings.push(rwGroup);

        const lwGroup = new THREE.Group();
        lwGroup.position.set(-0.16, 0.2 - wIdx * 0.22, 0);
        const lwMesh = new THREE.Mesh(wingBladeGeo, wMat);
        const lwSpine = new THREE.Mesh(wingSpineGeo, astralGoldMat);
        lwSpine.position.set(0.62, 0.1, 0.02);
        lwSpine.rotation.z = 0.18;
        lwGroup.add(lwMesh, lwSpine);
        lwGroup.scale.set(-sc, sc, 1);
        leftBladeWings.push(lwGroup);

        wingRoot.add(rwGroup, lwGroup);
      }

      const arbiterHaloGroup = new THREE.Group();
      arbiterHaloGroup.position.set(0, 0.88, -0.48);
      arbiterHaloGroup.visible = false;
      const haloMainRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1.12, 0.038, 8, 56)), astralGoldMat);
      const haloInnerRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.82, 0.026, 8, 40)), violetEnergyMat);
      arbiterHaloGroup.add(haloMainRing, haloInnerRing);
      const haloPointGeo = trackGeo(new THREE.ConeGeometry(0.06, 0.48, 4));
      for (let r = 0; r < 12; r++) {
        const a = (r * Math.PI * 2) / 12;
        const hp = new THREE.Mesh(haloPointGeo, r % 2 === 0 ? starlightMat : violetEnergyMat);
        hp.position.set(Math.cos(a) * 1.32, Math.sin(a) * 1.32, 0);
        hp.rotation.z = a - Math.PI / 2;
        arbiterHaloGroup.add(hp);
      }
      torsoPivot.add(arbiterHaloGroup);

      // Articulated Arms + Weapon Mount Pivot (for cohesive 1-2 X-Slash motion!)
      const armGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.075, 0.68, 8));
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.48, 0.66, 0.06);
      const leftArmMesh = new THREE.Mesh(armGeo, imperialIndigoMat);
      leftArmMesh.position.y = -0.32;
      const leftGauntlet = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.115, 0)), astralGoldMat);
      leftGauntlet.position.y = -0.68;
      leftArmPivot.add(leftArmMesh, leftGauntlet);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.48, 0.66, 0.06);
      const rightArmMesh = new THREE.Mesh(armGeo, imperialIndigoMat);
      rightArmMesh.position.y = -0.32;
      const rightGauntlet = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.115, 0)), astralGoldMat);
      rightGauntlet.position.y = -0.68;
      rightArmPivot.add(rightArmMesh, rightGauntlet);
      torsoPivot.add(leftArmPivot, rightArmPivot);

      // Monumental Cosmic Greatsword ("Void Arbiter Judgement Edge") mounted inside Right Arm / Center Slash Pivot
      const swordMountPivot = new THREE.Group();
      swordMountPivot.position.set(0, 0.62, 0.45);
      swordMountPivot.visible = false;
      torsoPivot.add(swordMountPivot);

      const greatswordGroup = new THREE.Group();
      swordMountPivot.add(greatswordGroup);

      const hilt = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.048, 0.042, 0.92, 8)), voidArmorMat);
      hilt.position.y = -0.38;
      const pommel = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), astralGoldMat);
      pommel.position.y = -0.88;
      const crossGuard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.86, 0.13, 0.15)), astralGoldMat);
      crossGuard.position.y = 0.08;
      const guardRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.22, 0.026, 8, 24)), violetEnergyMat);
      guardRing.position.set(0, 0.12, 0);
      const guardCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.135, 0)), starlightMat);
      guardCore.position.set(0, 0.12, 0.07);

      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(-0.17, 0);
      bladeShape.lineTo(0.17, 0);
      bladeShape.lineTo(0.23, 2.05);
      bladeShape.lineTo(0, 2.85);
      bladeShape.lineTo(-0.23, 2.05);
      bladeShape.closePath();
      const greatswordBlade = new THREE.Mesh(
        trackGeo(new THREE.ExtrudeGeometry(bladeShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018 })),
        starlightMat
      );
      greatswordBlade.position.set(0, 0.12, -0.03);
      const bladeRunicCore = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.085, 2.0, 0.1)), violetEnergyMat);
      bladeRunicCore.position.y = 1.18;

      greatswordGroup.add(hilt, pommel, crossGuard, guardRing, guardCore, greatswordBlade, bladeRunicCore);

      // Overhead Summoning Rift Halo (appears in Phase II above Judge as Greatsword descends/materializes)
      const summonRiftGroup = new THREE.Group();
      summonRiftGroup.position.set(0, 3.85, 0.55);
      summonRiftGroup.rotation.x = Math.PI / 2;
      summonRiftGroup.visible = false;
      const summonOuter = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1.35, 0.045, 8, 48)), astralGoldMat);
      const summonInner = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(1.28, 36)), portalInnerMat);
      summonRiftGroup.add(summonOuter, summonInner);
      scene.add(summonRiftGroup);

      // =========================================================================
      // VFX: Phase III 1-2 Diagonal Reality Cleave, Dimension X-Slash & Shatter Dome
      // =========================================================================
      const xSlashGroup = new THREE.Group();
      xSlashGroup.position.set(0, 1.85, 1.35);
      xSlashGroup.visible = false;
      scene.add(xSlashGroup);

      const slashCrescentGeo = trackGeo(new THREE.TorusGeometry(2.85, 0.11, 10, 56, Math.PI * 1.18));
      const slashBeamGeo = trackGeo(new THREE.BoxGeometry(0.16, 7.6, 0.22));
      const slashCoreGeo = trackGeo(new THREE.BoxGeometry(0.07, 8.2, 0.14));

      const slashMatA = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const slashMatB = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const slashCoreMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );

      // Stroke 1 ('/')
      const stroke1Group = new THREE.Group();
      stroke1Group.rotation.z = Math.PI / 4;
      const xBladeA = new THREE.Mesh(slashBeamGeo, slashMatA);
      const xCoreA = new THREE.Mesh(slashCoreGeo, slashCoreMat);
      const xArcA = new THREE.Mesh(slashCrescentGeo, slashMatA);
      stroke1Group.add(xBladeA, xCoreA, xArcA);

      // Stroke 2 ('\')
      const stroke2Group = new THREE.Group();
      stroke2Group.rotation.z = -Math.PI / 4;
      const xBladeB = new THREE.Mesh(slashBeamGeo, slashMatB);
      const xCoreB = new THREE.Mesh(slashCoreGeo, slashCoreMat);
      const xArcB = new THREE.Mesh(slashCrescentGeo, slashMatB);
      stroke2Group.add(xBladeB, xCoreB, xArcB);

      const xCenterOrb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.65, 24, 24)), iceWhiteBladeMat);
      xSlashGroup.add(stroke1Group, stroke2Group, xCenterOrb);

      // Custom GLSL Fresnel Reality Shatter Dome
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
              float wave = 0.72 + 0.28 * sin(vLocal.y * 14.0 - uTime * 16.0);
              float intensity = pow(rim, 3.4) * wave * uAlpha;
              vec3 col = mix(vec3(0.58, 0.35, 0.98), vec3(1.0, 0.85, 0.32), pow(rim, 4.8));
              gl_FragColor = vec4(col * intensity, clamp(intensity, 0.0, 1.0));
            }
          `
        })
      );
      const fractureDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1, 28, 22)), fractureDomeMat);
      fractureDome.position.set(0, 1.85, 0.55);
      fractureDome.visible = false;
      scene.add(fractureDome);

      // Towering Void Judgement Pillar
      const pillarMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const realityPillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(1.0, 1.85, 22, 28, 1, true)),
        pillarMat
      );
      realityPillar.position.set(0, 10.5, 0.45);
      realityPillar.visible = false;
      scene.add(realityPillar);

      // Dual Expanding Ground Shockwave Rings
      const shockwaveVioletMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveGoldMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveViolet = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1, 0.095, 10, 64)), shockwaveVioletMat);
      shockwaveViolet.rotation.x = Math.PI / 2;
      shockwaveViolet.position.set(0, 0.16, 0.4);
      shockwaveViolet.visible = false;
      scene.add(shockwaveViolet);

      const shockwaveGold = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1, 0.065, 10, 64)), shockwaveGoldMat);
      shockwaveGold.rotation.x = Math.PI / 2;
      shockwaveGold.position.set(0, 0.28, 0.4);
      shockwaveGold.visible = false;
      scene.add(shockwaveGold);

      // 28 Radial Spatial Severance Needles (InstancedMesh)
      const needleCount = 28;
      const needleMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const needleInstanced = new THREE.InstancedMesh(
        trackGeo(new THREE.ConeGeometry(0.08, 2.8, 5)),
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
          Math.abs(Math.cos(phi)) * 0.78 + 0.1,
          Math.sin(phi) * Math.sin(theta)
        ).normalize();
        needleDirs.push(dir);
        needleQuats.push(new THREE.Quaternion().setFromUnitVectors(_axisY, dir));
        _tmpColor.setHex(i % 3 === 0 ? 0xfef08a : i % 2 === 0 ? 0xc084fc : 0x818cf8);
        needleInstanced.setColorAt(i, _tmpColor);
      }
      if (needleInstanced.instanceColor) needleInstanced.instanceColor.needsUpdate = true;

      // 160 Instanced Dimensional Crystal Shards (Implosion -> Radial Reality Shatter)
      const shardCount = 160;
      const shardGeo = trackGeo(new THREE.OctahedronGeometry(0.115, 0));
      const shardMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x818cf8,
          emissiveIntensity: 1.15,
          roughness: 0.18,
          metalness: 0.35
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
            Math.abs(Math.cos(phi)) * 0.75 + 0.08,
            Math.sin(phi) * Math.sin(theta)
          ).normalize()
        );
        shardSpeeds.push(5.8 + (i % 7) * 1.2);
        shardAngles.push((i * Math.PI * 2) / shardCount);
        _tmpColor.setHex(i % 4 === 0 ? 0xfbbf24 : i % 2 === 0 ? 0xc084fc : 0x818cf8);
        shardInstanced.setColorAt(i, _tmpColor);
      }
      if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;

      // Floating Cosmic Starlight Dust
      const dustCount = 240;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.6 + Math.random() * 10.5;
        dustPos[i * 3] = Math.cos(a) * r;
        dustPos[i * 3 + 1] = 0.25 + Math.random() * 7.2;
        dustPos[i * 3 + 2] = Math.sin(a) * r;
      }
      const dustGeo = trackGeo(new THREE.BufferGeometry());
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustMat = trackMat(
        new THREE.PointsMaterial({
          color: 0xa5b4fc,
          size: 0.09,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      scene.add(dustPoints);

      // =========================================================================
      // GPU POST-PROCESSING PIPELINE (Bloom + Dimensional Shockwave & Chromatic Pass)
      // =========================================================================
      let composer: EffectComposer | null = null;
      let renderPass: RenderPass | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let shockPass: ShaderPass | null = null;
      let outputPass: OutputPass | null = null;

      const shockUniforms = {
        tDiffuse: { value: null },
        uAberration: { value: 0.0012 },
        uShockWave: { value: 0 },
        uShockRadius: { value: 0 },
        uAnamorphic: { value: 0.05 },
        uFlash: { value: 0 },
        uVignette: { value: 0.32 }
      };

      if (!isSoftwareGl) {
        const initW = window.innerWidth;
        const initH = Math.max(1, window.innerHeight);
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);
        bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.18, 0.24, 1.15);
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
            varying vec2 vUv;

            void main() {
              vec2 center = vec2(0.5, 0.5);
              vec2 toCenter = vUv - center;
              float dist = length(toCenter);
              vec2 dir = dist > 0.0001 ? toCenter / dist : vec2(0.0);

              // Radial Spatial Shockwave Ripple
              float ringDiff = dist - uShockRadius;
              float ringBand = exp(-ringDiff * ringDiff * 165.0) * uShockWave;
              vec2 uv = clamp(vUv - dir * ringBand * 0.036, 0.001, 0.999);

              // Radial Chromatic Aberration
              vec2 caOffset = dir * uAberration * (0.35 + dist * 1.2 + ringBand * 1.8);
              float r = texture2D(tDiffuse, clamp(uv + caOffset, 0.001, 0.999)).r;
              float g = texture2D(tDiffuse, uv).g;
              float b = texture2D(tDiffuse, clamp(uv - caOffset, 0.001, 0.999)).b;
              vec3 col = vec3(r, g, b);

              // Anamorphic Gold-Violet Starlight Streak
              float hBand = exp(-abs(vUv.y - 0.5) * 44.0) * exp(-abs(vUv.x - 0.5) * 2.8);
              col += mix(vec3(0.56, 0.38, 0.98), vec3(1.0, 0.84, 0.32), hBand) * hBand * uAnamorphic;

              // Shockwave Rim Tint
              col += vec3(0.88, 0.65, 1.0) * ringBand * 0.2;

              // Brief Climax Flash
              col += vec3(0.95, 0.88, 1.0) * uFlash;

              // Cinematic Vignette
              float vig = smoothstep(0.38, 0.98, dist);
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
        composer?.setSize(w, h);
        bloomPass?.resolution.set(w, h);
      };
      window.addEventListener('resize', handleResize);

      let frameId = 0;
      let isDisposed = false;
      let lastTime = performance.now();
      let lastPhase: CutscenePhase = 'singularity';
      let lastUiPct = -1;
      let flashTriggered = false;
      let currentRoll = 0;

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

        const elapsedSinceSync = (now - lastSyncTimeRef.current) / 1000;
        const estRemaining = Math.max(0, remainingRef.current - elapsedSinceSync);
        const p = Math.max(0, Math.min(1, 1 - estRemaining / Math.max(0.1, totalDuration)));
        const elapsedSec = p * totalDuration;

        const pct = Math.round(p * 100);
        if (pct !== lastUiPct) {
          lastUiPct = pct;
          setUiProgress(pct);
        }

        const nextPhase: CutscenePhase =
          p < 0.32 ? 'singularity' : p < 0.66 ? 'arbiter' : p < 0.88 ? 'severance' : 'ascension_return';
        if (nextPhase !== lastPhase) {
          lastPhase = nextPhase;
          setPhase(nextPhase);
        }

        if (p >= 0.66 && !flashTriggered) {
          flashTriggered = true;
          setSlashFlash(true);
          window.setTimeout(() => {
            if (!isDisposed) setSlashFlash(false);
          }, 180);
        }

        // Update Cosmic Environment Shaders & Orbiting Props
        const spinBoost = p < 0.32 ? 1.15 : p < 0.66 ? 2.4 : p < 0.88 ? 4.2 : 1.7;
        skyUniforms.uTime.value = elapsedSec;
        skyUniforms.uEnergy.value = p < 0.32 ? 0.25 + (p / 0.32) * 0.28 : p < 0.66 ? 0.53 : p < 0.88 ? 0.72 : 0.42;
        skyUniforms.uFlash.value = p >= 0.66 && p < 0.76 ? (1 - (p - 0.66) / 0.1) * 0.22 : 0;

        abyssSeaUniforms.uTime.value = elapsedSec;
        abyssSeaUniforms.uSurge.value = p < 0.66 ? 0.28 + p * 0.5 : Math.max(0.32, 0.78 - (p - 0.66) * 1.1);

        portalShaderUniforms.uTime.value = elapsedSec;
        portalShaderUniforms.uIntensity.value = p < 0.32 ? 0.5 : p < 0.66 ? 0.8 : 0.35;

        photonRimUniforms.uTime.value = elapsedSec;
        photonRimUniforms.uSurge.value = p < 0.66 ? 0.48 + p * 0.55 : 0.78;
        accretionUniforms.uTime.value = elapsedSec;
        accretionUniforms.uIntensity.value = p < 0.66 ? 0.62 + p * 0.32 : 0.75;

        armillaryA.rotation.x += dt * 0.9 * spinBoost;
        armillaryA.rotation.y += dt * 1.15 * spinBoost;
        armillaryB.rotation.y -= dt * 1.3 * spinBoost;
        armillaryB.rotation.z += dt * 0.75 * spinBoost;
        armillaryC.rotation.x -= dt * 0.7 * spinBoost;
        armillaryC.rotation.z -= dt * 0.9 * spinBoost;
        tesseractOuter.rotation.x += dt * 0.55 * spinBoost;
        tesseractOuter.rotation.y += dt * 0.85 * spinBoost;
        tesseractInner.rotation.y -= dt * 1.2 * spinBoost;
        tesseractInner.rotation.z += dt * 0.7 * spinBoost;
        dustPoints.rotation.y += dt * 0.38 * spinBoost;
        chestRing.rotation.z += dt * (1.8 + p * 4.5);

        for (let i = 0; i < monolithGroups.length; i++) {
          const mg = monolithGroups[i];
          mg.group.position.y = mg.baseY + Math.sin(elapsedSec * 2.1 + i * 1.2) * 0.22;
          mg.cap.rotation.y += dt * 2.5;
          mg.cap.position.y = 2.25 + Math.sin(elapsedSec * 3.8 + i) * 0.14;
        }
        for (let i = 0; i < debrisCount; i++) {
          const d = debrisMeta[i];
          const a = d.ang + elapsedSec * d.speed * spinBoost * 0.45;
          _dummy.position.set(
            Math.cos(a) * d.rad,
            d.y + Math.sin(elapsedSec * 1.8 + i) * 0.28,
            Math.sin(a) * d.rad
          );
          _dummy.rotation.set(elapsedSec * 0.8 + i, elapsedSec * 1.1, i);
          _dummy.scale.setScalar(d.scale);
          _dummy.updateMatrix();
          debrisInstanced.setMatrixAt(i, _dummy.matrix);
        }
        debrisInstanced.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < portals.length; i++) {
          portals[i].rotation.z += dt * 1.6 * spinBoost;
        }

        // Post-processing dynamic targets
        let targetFov = 46;
        let targetRoll = 0;
        let bloomStrength = 0.34;
        let aberration = 0.0012;
        let shockWave = 0;
        let shockRadius = 0;
        let anamorphic = 0.05;
        let postFlash = 0;

        if (p < 0.32) {
          // =====================================================================
          // PHASE I: Spatial Singularity Compression & Rift Resonance
          // =====================================================================
          const ep = p / 0.32;
          const ease = 1 - Math.pow(1 - ep, 3);

          singularityGroup.scale.setScalar(0.92 + ease * 0.14);
          sealMat.opacity = 0.55 + ease * 0.18;

          const hoverY = ease * 0.28;
          judgeGroup.position.set(0, hoverY, 0.15);
          contactShadowMat.opacity = Math.max(0.18, 0.68 - hoverY * 0.65);
          torsoPivot.rotation.set(0.05 - ease * 0.08, 0, 0);

          // Subtle knee/hip float posture
          legL.hipPivot.rotation.set(-0.12 * ease, 0, 0.06);
          legL.kneePivot.rotation.set(0.24 * ease, 0, 0);
          legR.hipPivot.rotation.set(-0.06 * ease, 0, -0.06);
          legR.kneePivot.rotation.set(0.12 * ease, 0, 0);

          for (const t of tassets) {
            t.mesh.rotation.z = t.baseRotZ + t.side * ease * 0.12;
          }

          rightArmPivot.rotation.set(-0.62 - ease * 0.48, 0, -0.42);
          leftArmPivot.rotation.set(-0.62 - ease * 0.48, 0, 0.42);
          swordMountPivot.visible = false;
          summonRiftGroup.visible = false;
          arbiterHaloGroup.visible = false;
          xSlashGroup.visible = false;
          fractureDome.visible = false;
          realityPillar.visible = false;
          shockwaveViolet.visible = false;
          shockwaveGold.visible = false;
          needleInstanced.visible = false;

          for (let wIdx = 0; wIdx < 3; wIdx++) {
            const foldAngle = 1.02 - ease * 0.18 + wIdx * 0.18;
            rightBladeWings[wIdx].rotation.set(0.32, -0.68, -foldAngle);
            leftBladeWings[wIdx].rotation.set(0.32, 0.68, foldAngle);
          }

          for (let i = 0; i < portalTethers.length; i++) {
            portalTethers[i].visible = false;
          }

          // Shards spiral inward into Judge's chest reactor
          for (let i = 0; i < shardCount; i++) {
            const loopT = (ep * 1.9 + i / shardCount) % 1;
            const ang = shardAngles[i] + ep * Math.PI * 3.0;
            const rad = 6.6 * (1 - loopT) + 0.35;
            _dummy.position.set(
              Math.cos(ang) * rad,
              0.35 + (1 - loopT) * (1.25 + (i % 5) * 0.55) + loopT * 1.65,
              0.15 + Math.sin(ang) * rad
            );
            _dummy.rotation.set(loopT * 6, ang, i);
            _dummy.scale.setScalar(0.55 + loopT * 0.52);
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          coreLight.intensity = 3.5 + ease * 3.5;
          singularityBackLight.intensity = 7 + ease * 4.5;
          goldSlashLight.intensity = 2.5;

          targetFov = 46 - ease * 3.2;
          bloomStrength = 0.16 + ease * 0.06;
          anamorphic = 0.02 + ease * 0.02;
        } else if (p < 0.66) {
          // =====================================================================
          // PHASE II: Void Arbiter Unfurl + Grand Greatsword Overhead Summon
          // =====================================================================
          const ip = (p - 0.32) / 0.34;
          const ascendEase = 1 - Math.pow(1 - Math.min(1, ip * 1.25), 3);

          const hoverY = 0.28 + ascendEase * 0.98;
          judgeGroup.position.set(0, hoverY, 0.15);
          contactShadowMat.opacity = Math.max(0.08, 0.45 - ascendEase * 0.35);
          capeMesh.rotation.x = 0.38 + Math.sin(ip * Math.PI * 6) * 0.12;

          // Heroic aerial levitation pose
          legL.hipPivot.rotation.set(-0.28 * ascendEase, 0, 0.1);
          legL.kneePivot.rotation.set(0.58 * ascendEase, 0, 0);
          legR.hipPivot.rotation.set(0.1 * ascendEase, 0, -0.08);
          legR.kneePivot.rotation.set(0.22 * ascendEase, 0, 0);

          for (const t of tassets) {
            t.mesh.rotation.z = t.baseRotZ + t.side * (0.12 + ascendEase * 0.24);
          }

          // Twin Blade-Wings sweep wide
          for (let wIdx = 0; wIdx < 3; wIdx++) {
            const spread = 0.3 - wIdx * 0.35 + Math.sin(ip * Math.PI * 5 + wIdx) * 0.06;
            const openY = 0.24 * (1 - ascendEase);
            rightBladeWings[wIdx].rotation.set(-0.08, -openY, spread);
            leftBladeWings[wIdx].rotation.set(-0.08, openY, -spread);
          }

          arbiterHaloGroup.visible = true;
          arbiterHaloGroup.scale.setScalar(0.42 + ascendEase * 0.78);
          arbiterHaloGroup.rotation.z = ip * Math.PI * 2.6;

          // Arms raise overhead to grasp the emerging Void Arbiter Greatsword
          const hoist = Math.min(1, ip * 1.25);
          torsoPivot.rotation.set(-0.14 * hoist, -0.25 * Math.max(0, (ip - 0.65) / 0.35), 0);
          rightArmPivot.rotation.set(-2.35 * hoist, -0.15, -0.26);
          leftArmPivot.rotation.set(-2.25 * hoist, 0.22, 0.26);

          summonRiftGroup.visible = true;
          const riftScale = Math.sin(Math.min(1, ip * 1.35) * Math.PI) * 1.15 + 0.35;
          summonRiftGroup.scale.setScalar(riftScale);
          summonRiftGroup.rotation.z = elapsedSec * 3.4;

          swordMountPivot.visible = true;
          swordMountPivot.position.set(0.05, 1.35 + hoist * 0.38, 0.42);
          swordMountPivot.rotation.set(0.18 - ip * 0.42, 0, 0.28 * Math.max(0, (ip - 0.6) / 0.4));
          greatswordGroup.scale.setScalar(0.55 + ascendEase * 0.56);

          // 6 Spatial Portals fire energy tethers into the overhead Greatsword
          _tmpVecA.set(0.05, hoverY + 2.75, 0.56);
          for (let i = 0; i < portals.length; i++) {
            const tether = portalTethers[i];
            tether.visible = true;
            const pPos = portals[i].position;
            const dist = pPos.distanceTo(_tmpVecA);
            tether.position.copy(pPos).lerp(_tmpVecA, 0.5);
            tether.scale.set(1, dist, 1);
            tether.lookAt(_tmpVecA);
            tether.rotateX(Math.PI / 2);
          }

          // Crystal shards compress into orbiting vortex
          for (let i = 0; i < shardCount; i++) {
            const loopT = (ip * 2.6 + i / shardCount) % 1;
            const ang = shardAngles[i] - ip * Math.PI * 4.5;
            const rad = 4.8 * (1 - loopT);
            _dummy.position.set(
              Math.cos(ang) * rad,
              1.75 + ascendEase * 0.9 + Math.sin(loopT * Math.PI) * 1.05,
              0.3 + Math.sin(ang) * rad
            );
            _dummy.rotation.set(ip * 8 + i, ang, i);
            _dummy.scale.setScalar(0.78 * (1 - loopT * 0.38));
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          xSlashGroup.visible = false;
          fractureDome.visible = false;
          realityPillar.visible = false;
          shockwaveViolet.visible = false;
          shockwaveGold.visible = false;
          needleInstanced.visible = false;

          coreLight.intensity = 6.5 + ip * 4.5;
          singularityBackLight.intensity = 11 + ip * 5;
          goldSlashLight.intensity = 3.5 + ip * 5.5;

          targetFov = 42.8 + ip * 7.2;
          targetRoll = -0.055 * Math.sin(ip * Math.PI);
          bloomStrength = 0.21 + ip * 0.09;
          aberration = 0.0012 + ip * 0.001;
          anamorphic = 0.03 + ip * 0.04;
        } else if (p < 0.88) {
          // =====================================================================
          // PHASE III: 1-2 Double Diagonal Slash -> Colossal Dimension X-Slash!
          // =====================================================================
          const sp = (p - 0.66) / 0.22; // 0..1 across Phase III
          const slash1T = Math.min(1, sp / 0.24);
          const slash2T = sp > 0.22 ? Math.min(1, (sp - 0.22) / 0.24) : 0;
          const burstT = sp > 0.18 ? Math.min(1, (sp - 0.18) / 0.82) : 0;
          const burstEase = 1 - Math.pow(1 - burstT, 3);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(sp, 0.56, 1.0);

          const hoverY = 1.26 - Math.min(1, sp * 1.6) * 0.56;
          judgeGroup.position.set(0, hoverY, 0.15 + Math.min(1, sp * 2.2) * 0.42);
          contactShadowMat.opacity = Math.max(0.12, 0.38 - hoverY * 0.22);

          // Choreographed 1-2 Slash Arm & Torso Motion
          if (sp < 0.24) {
            // Cleave 1: Top-Right -> Bottom-Left ('/')
            torsoPivot.rotation.set(0.24 * slash1T, THREE.MathUtils.lerp(-0.45, 0.55, slash1T), 0);
            rightArmPivot.rotation.set(-2.2 + slash1T * 2.1, -0.15, -0.35 + slash1T * 0.8);
            leftArmPivot.rotation.set(-2.0 + slash1T * 1.7, 0.25, 0.3);
            swordMountPivot.position.set(0.15 - slash1T * 0.25, 1.55 - slash1T * 0.8, 0.65);
            swordMountPivot.rotation.set(0.3 + slash1T * 2.0, 0, -0.78);
          } else {
            // Cleave 2: Bottom-Left -> Top-Right / Cross Cleave ('\')
            torsoPivot.rotation.set(0.24 - slash2T * 0.16, THREE.MathUtils.lerp(0.55, -0.38, slash2T), 0);
            rightArmPivot.rotation.set(-0.1 - slash2T * 0.9, 0.2, 0.45 - slash2T * 0.95);
            leftArmPivot.rotation.set(-0.3 - slash2T * 0.4, 0.25, 0.35);
            swordMountPivot.position.set(-0.1 + slash2T * 0.42, 0.75 + slash2T * 0.45, 0.68);
            swordMountPivot.rotation.set(2.3 - slash2T * 0.9, 0, 0.78);
          }
          swordMountPivot.visible = true;
          greatswordGroup.scale.setScalar(1.14);

          for (let wIdx = 0; wIdx < 3; wIdx++) {
            const spread = 0.34 - wIdx * 0.32;
            rightBladeWings[wIdx].rotation.set(-0.15, 0, spread);
            leftBladeWings[wIdx].rotation.set(-0.15, 0, -spread);
          }
          arbiterHaloGroup.visible = true;
          arbiterHaloGroup.scale.setScalar(1.26);
          arbiterHaloGroup.rotation.z += dt * 5.2;

          summonRiftGroup.visible = false;
          for (let i = 0; i < portalTethers.length; i++) {
            portalTethers[i].visible = false;
          }

          // Colossal 3D Dimension X-Slash (Stroke 1 '/' then Stroke 2 '\')
          xSlashGroup.visible = fadeOut > 0.01;
          const xScale = 0.7 + Math.min(1.35, sp * 2.4);
          xSlashGroup.scale.setScalar(xScale);

          stroke1Group.visible = sp >= 0.03;
          stroke1Group.scale.set(1, Math.min(1, slash1T * 1.4), 1);
          stroke2Group.visible = sp >= 0.22;
          stroke2Group.scale.set(1, Math.min(1, slash2T * 1.4), 1);

          const xOpacity = sp < 0.32 ? 0.84 : Math.max(0, 0.84 * fadeOut);
          slashMatA.opacity = xOpacity;
          slashMatB.opacity = sp >= 0.22 ? xOpacity * 0.88 : 0;
          slashCoreMat.opacity = sp < 0.36 ? 0.82 : Math.max(0, 0.82 * fadeOut);
          xCenterOrb.visible = sp >= 0.22;
          xCenterOrb.scale.setScalar(sp < 0.4 ? 0.5 + (sp - 0.22) * 4.8 : Math.max(0.05, 1.35 * fadeOut));

          // Fresnel Reality Shatter Dome
          fractureDome.visible = sp >= 0.2 && fadeOut > 0.02;
          fractureDome.scale.setScalar(0.9 + burstEase * 8.6);
          fractureDomeUniforms.uTime.value = elapsedSec;
          fractureDomeUniforms.uAlpha.value = fadeOut * 0.42;

          // Sky-Rending Void Pillar
          realityPillar.visible = sp >= 0.18 && fadeOut > 0.02;
          const pillarScale = sp < 0.35 ? 0.5 + ((sp - 0.18) / 0.17) * 1.5 : Math.max(0.25, 2.0 * fadeOut);
          realityPillar.scale.set(pillarScale, 1, pillarScale);
          pillarMat.opacity = sp < 0.35 ? 0.42 : Math.max(0, 0.42 * fadeOut);

          // Dual Expanding Shockwaves
          shockwaveViolet.visible = sp >= 0.18 && fadeOut > 0.02;
          shockwaveGold.visible = sp >= 0.22 && fadeOut > 0.02;
          shockwaveViolet.scale.setScalar(0.8 + burstEase * 14.2);
          shockwaveGold.scale.setScalar(0.5 + burstEase * 10.6);
          shockwaveVioletMat.opacity = fadeOut * 0.72;
          shockwaveGoldMat.opacity = fadeOut * 0.76;

          // 28 Radial Void Severance Needles
          needleInstanced.visible = sp >= 0.22 && fadeOut > 0.03;
          if (needleInstanced.visible) {
            const nDist = 0.7 + burstEase * 8.2;
            for (let i = 0; i < needleCount; i++) {
              _tmpVecB.copy(needleDirs[i]).multiplyScalar(nDist);
              _dummy.position.set(_tmpVecB.x, 1.85 + _tmpVecB.y, 0.5 + _tmpVecB.z);
              _dummy.quaternion.copy(needleQuats[i]);
              _dummy.scale.set(1, 0.85 + burstEase * 0.9, 1);
              _dummy.updateMatrix();
              needleInstanced.setMatrixAt(i, _dummy.matrix);
            }
            needleInstanced.instanceMatrix.needsUpdate = true;
            needleMat.opacity = fadeOut * 0.75;
          }

          // 160 Crystal Shards Blast Outward
          for (let i = 0; i < shardCount; i++) {
            const dist = burstEase * shardSpeeds[i] * 1.55;
            _dummy.position.set(
              shardDirs[i].x * dist,
              Math.max(0.18, 1.65 + shardDirs[i].y * dist * 0.95),
              0.4 + shardDirs[i].z * dist
            );
            _dummy.rotation.set(burstEase * 12 + i, burstEase * 9, i * 0.5);
            _dummy.scale.setScalar(Math.max(0.32, 1.3 - sp * 0.72));
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          singularityGroup.scale.setScalar(1.1 + Math.sin(sp * Math.PI) * 0.3);
          coreLight.intensity = Math.max(5.5, 11.5 * (1 - sp * 0.5));
          singularityBackLight.intensity = Math.max(8.5, 16 * (1 - sp * 0.4));
          goldSlashLight.intensity = Math.max(4.5, 12.5 * (1 - sp * 0.5));

          const impactPulse = sp >= 0.2 && sp < 0.68 ? 1 - (sp - 0.2) / 0.48 : 0;
          targetFov = sp < 0.25 ? 50 + (sp / 0.25) * 7.5 : 57.5 - Math.min(1, (sp - 0.25) / 0.75) * 9.5;
          targetRoll = sp < 0.24 ? 0.06 : -0.04 * fadeOut;
          bloomStrength = 0.34 - sp * 0.14;
          aberration = 0.0014 + impactPulse * 0.0036;
          shockWave = sp >= 0.2 && sp < 0.75 ? Math.max(0, 1 - (sp - 0.2) / 0.55) : 0;
          shockRadius = Math.max(0, (sp - 0.2) * 1.55);
          anamorphic = 0.04 + impactPulse * 0.09;
          postFlash = sp >= 0.2 && sp < 0.34 ? (1 - Math.abs(sp - 0.24) / 0.1) * 0.06 : 0;
        } else {
          // =====================================================================
          // PHASE IV: Void Arbiter Sovereign Stance & Return to Battle
          // =====================================================================
          const rp = (p - 0.88) / 0.12;
          const settle = 1 - Math.pow(1 - rp, 2);

          judgeGroup.position.set(0, 0.7 - settle * 0.25, 0.55 - settle * 0.25);
          contactShadowMat.opacity = 0.35 + settle * 0.2;
          torsoPivot.rotation.set(0.08 * (1 - settle), -0.18 * (1 - settle), 0);

          legL.hipPivot.rotation.set(-0.18, 0, 0.08);
          legL.kneePivot.rotation.set(0.36, 0, 0);
          legR.hipPivot.rotation.set(0.08, 0, -0.08);
          legR.kneePivot.rotation.set(0.16, 0, 0);

          rightArmPivot.rotation.set(-0.78, 0.15, -0.35);
          leftArmPivot.rotation.set(-0.45, 0.2, 0.35);
          swordMountPivot.visible = true;
          swordMountPivot.position.set(0.45, 0.95, 0.48);
          swordMountPivot.rotation.set(0.75, 0, -0.42);
          greatswordGroup.scale.setScalar(1.1);

          for (let wIdx = 0; wIdx < 3; wIdx++) {
            const spread = 0.32 - wIdx * 0.32 + Math.sin(elapsedSec * 4 + wIdx) * 0.04;
            rightBladeWings[wIdx].rotation.set(-0.12, 0, spread);
            leftBladeWings[wIdx].rotation.set(-0.12, 0, -spread);
          }
          arbiterHaloGroup.visible = true;
          arbiterHaloGroup.scale.setScalar(1.22);
          arbiterHaloGroup.rotation.z += dt * 2.2;

          xSlashGroup.visible = false;
          fractureDome.visible = false;
          realityPillar.visible = false;
          shockwaveViolet.visible = false;
          shockwaveGold.visible = false;
          needleInstanced.visible = false;
          summonRiftGroup.visible = false;

          // Gentle floating post-shatter starlight shards
          for (let i = 0; i < shardCount; i++) {
            const ang = shardAngles[i] + elapsedSec * 0.45;
            const rad = 6.2 + (i % 6) * 0.7;
            _dummy.position.set(
              Math.cos(ang) * rad,
              0.4 + ((i * 19) % 10) * 0.42 + Math.sin(elapsedSec * 2 + i) * 0.15,
              Math.sin(ang) * rad
            );
            _dummy.rotation.set(elapsedSec + i, ang, i);
            _dummy.scale.setScalar(0.45 * (1 - settle * 0.4));
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          coreLight.intensity = 5.5;
          singularityBackLight.intensity = 8.5;
          goldSlashLight.intensity = 3.8;
          targetFov = THREE.MathUtils.lerp(48, 46, settle);
          bloomStrength = 0.19;
          anamorphic = 0.025 * (1 - settle * 0.5);
        }

        // Dynamic 4-Phase Cinematic Camera Choreography
        if (p < 0.32) {
          const ep = p / 0.32;
          _camTarget.set(2.3 - ep * 1.15, 1.25 + ep * 0.45, 5.8 - ep * 0.85);
          _lookTarget.set(0, 1.75 + ep * 0.45, -0.35);
        } else if (p < 0.66) {
          const ip = (p - 0.32) / 0.34;
          const camAng = 0.22 - ip * 1.18;
          const camDist = 4.9 + ip * 1.4;
          _camTarget.set(Math.sin(camAng) * camDist, 1.9 + ip * 1.25, Math.cos(camAng) * camDist);
          _lookTarget.set(0, 2.0 + ip * 0.6, -0.2);
        } else if (p < 0.88) {
          const sp = (p - 0.66) / 0.22;
          const shakeMag = sp < 0.46 ? (1 - sp / 0.46) * 0.42 : 0;
          const shakeX = Math.sin(elapsedSec * 52) * shakeMag;
          const shakeY = Math.cos(elapsedSec * 47) * shakeMag;
          const camAng = -0.96 + sp * 1.24;
          const camDist = 6.3 + Math.min(1, sp * 1.35) * 3.0;
          _camTarget.set(
            Math.sin(camAng) * camDist + shakeX,
            2.95 + sp * 0.95 + shakeY,
            Math.cos(camAng) * camDist
          );
          _lookTarget.set(0, 1.8, -0.25);
        } else {
          const rp = (p - 0.88) / 0.12;
          _camTarget.set(
            THREE.MathUtils.lerp(2.5, 0.35, rp),
            THREE.MathUtils.lerp(3.9, 6.8, rp),
            THREE.MathUtils.lerp(8.9, 10.8, rp)
          );
          _lookTarget.set(0, THREE.MathUtils.lerp(1.8, 1.25, rp), 0);
        }

        const dampAlpha = 1 - Math.exp(-7.5 * dt);
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

        if (composer && bloomPass) {
          bloomPass.strength = bloomStrength;
          shockUniforms.uAberration.value = aberration;
          shockUniforms.uShockWave.value = shockWave;
          shockUniforms.uShockRadius.value = shockRadius;
          shockUniforms.uAnamorphic.value = anamorphic;
          shockUniforms.uFlash.value = postFlash;
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
      };
    } catch {
      renderer?.dispose();
      onFallbackRef.current?.();
      return undefined;
    }
  }, [totalDuration]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#03020d] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D Void Arbiter Ascension"
    >
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Brief Dimension X-Slash Impact Flash */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-indigo-300/12 via-amber-100/15 to-purple-300/12 transition-opacity duration-150 ${
          slashFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Cinematic Letterbox Bar (solid dark fill, zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#060418]/92 border-b border-indigo-400/45 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-game tracking-[0.24em] uppercase text-indigo-300 flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>DIMENSION JUDG · SINGULARITAS &amp; DIMENSION X-SLASH 3D</span>
          </p>
          <h2 className="font-title text-base sm:text-2xl font-black tracking-wider text-amber-300 truncate">
            VOID ARBITER ASCENSION
          </h2>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <span className="inline-block px-2.5 py-1 rounded border border-indigo-400/45 bg-indigo-950/90 text-[11px] font-game tracking-wider text-amber-200">
            {PHASE_BADGES[phase]}
          </span>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-[#060418]/92 border-t border-indigo-400/45 px-5 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <p className="pointer-events-none text-[11px] sm:text-xs font-game tracking-wider text-indigo-200/90 truncate">
          {PHASE_LABELS[phase]} · {uiProgress}%
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-400/60 hover:border-amber-300 text-indigo-50 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-amber-300" />
        </button>

        {/* Bottom Progress Strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-400 to-amber-300 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
