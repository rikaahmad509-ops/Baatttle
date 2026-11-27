import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FastForward, Sparkles } from 'lucide-react';
import { ArcanaSuit } from '../types/game';

interface ArcanaTarot3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  cards?: ArcanaSuit[];
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutscenePhase = 'draw' | 'verdict' | 'roulette' | 'curtain_return';

const PHASE_LABELS: Record<CutscenePhase, string> = {
  draw: 'FASE I · ARCANA MENARIK 3 KARTU TAROT & MEMUTAR RODA TAKDIR',
  verdict: 'FASE II · PEMBUKAAN 3 KARTU & JATUHNYA DADU TAKDIR (6)',
  roulette: 'FASE III · ROYAL FLUSH — LEDAKAN DESTINY ROULETTE!',
  curtain_return: 'FASE IV · TIRAI TAKDIR TERTUTUP — KEMBALI KE PERTEMPURAN!'
};

const PHASE_BADGES: Record<CutscenePhase, string> = {
  draw: 'FASE I · TARIK KARTU',
  verdict: 'FASE II · VONIS TAROT',
  roulette: 'FASE III · DESTINY ROULETTE',
  curtain_return: 'FASE IV · ENCORE'
};

const SUIT_META: Record<
  ArcanaSuit,
  { icon: string; hex: number; cssColor: string; title: string; punish: string }
> = {
  spade: {
    icon: '♠',
    hex: 0x38bdf8,
    cssColor: '#38bdf8',
    title: 'THE EXECUTIONER',
    punish: 'EKSEKUSI'
  },
  heart: {
    icon: '♥',
    hex: 0xfb7185,
    cssColor: '#fb7185',
    title: 'CRIMSON CHALICE',
    punish: 'SIPHON HP'
  },
  diamond: {
    icon: '♦',
    hex: 0xfbbf24,
    cssColor: '#fbbf24',
    title: 'GILDED PRISM',
    punish: 'PECAH DEF'
  },
  club: {
    icon: '♣',
    hex: 0xa855f7,
    cssColor: '#a855f7',
    title: 'ARCANE THUNDER',
    punish: 'PETIR STUN'
  }
};

// Zero-GC module-scoped math helpers
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 1.5, 0.5);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();
const _axisY = new THREE.Vector3(0, 1, 0);

export const ArcanaTarot3DCutscene: React.FC<ArcanaTarot3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 4.0,
  cards,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const lockedCardsRef = useRef<[ArcanaSuit, ArcanaSuit, ArcanaSuit]>([
    cards?.[0] ?? 'spade',
    cards?.[1] ?? 'heart',
    cards?.[2] ?? 'diamond'
  ]);
  if (cards && cards.length === 3 && remainingTime >= totalDuration * 0.9) {
    lockedCardsRef.current = [cards[0], cards[1], cards[2]];
  }
  const normalizedCards = lockedCardsRef.current;

  const [phase, setPhase] = useState<CutscenePhase>('draw');
  const [uiProgress, setUiProgress] = useState<number>(0);
  const [verdictFlash, setVerdictFlash] = useState<boolean>(false);

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

    const activeCards: [ArcanaSuit, ArcanaSuit, ArcanaSuit] = [...lockedCardsRef.current];

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
      scene.background = new THREE.Color(0x06010f);
      scene.fog = new THREE.FogExp2(0x0d031d, 0.024);

      const camera = new THREE.PerspectiveCamera(
        46,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        160
      );
      camera.position.set(2.45, 2.25, 6.2);
      _currentLook.set(0, 1.5, 0.65);
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

      // Balanced Velvet-Gold 3-Point Casino Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xf472b6, 0x0b0316, 0.68);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfef08a, 1.65);
      keyLight.position.set(5.5, 11, 6.5);
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

      const rimLight = new THREE.DirectionalLight(0xec4899, 1.25);
      rimLight.position.set(-7, 6.5, -8.5);
      scene.add(rimLight);

      const rouletteLight = new THREE.PointLight(0xfbbf24, 4.5, 22, 1.5);
      rouletteLight.position.set(0, 0.95, 1.35);
      scene.add(rouletteLight);

      const cardStageLight = new THREE.PointLight(0xf472b6, 3.8, 22, 1.5);
      cardStageLight.position.set(0, 2.55, 2.2);
      scene.add(cardStageLight);

      const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      // =========================================================================
      // BACKGROUND 1: Custom GLSL Velvet Tarot & Astral Roulette Sky Dome
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
                p = p * 2.03 + vec3(0.15, -0.18, 0.12);
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec3 dir = normalize(vWorldDir);
              float horizonGlow = pow(1.0 - abs(dir.y), 3.6);
              vec3 nebCoord = dir * 2.4 + vec3(uTime * 0.03, -uTime * 0.02, uTime * 0.02);
              float n1 = fbm(nebCoord);
              float n2 = fbm(nebCoord * 2.1 + vec3(n1 * 1.25));
              float curtain = smoothstep(0.42, 0.85, n2);

              // Subtle gilded zodiac meridian arcs
              float lon = atan(dir.z, dir.x);
              float lat = asin(clamp(dir.y, -1.0, 1.0));
              float arcA = smoothstep(0.982, 0.997, abs(cos(lon * 6.0 - uTime * 0.06)));
              float arcB = smoothstep(0.982, 0.997, abs(cos(lat * 5.0)));
              float filigree = max(arcA, arcB) * smoothstep(-0.05, 0.65, dir.y);

              vec3 velvetBlack = vec3(0.018, 0.006, 0.038);
              vec3 royalPlum = vec3(0.16, 0.03, 0.24);
              vec3 crimsonRose = vec3(0.45, 0.06, 0.26);
              vec3 gildedGold = vec3(0.72, 0.48, 0.12);

              vec3 col = mix(velvetBlack, royalPlum, n1 * 0.78 + horizonGlow * 0.42);
              col += crimsonRose * curtain * (0.28 + uEnergy * 0.36);
              col += gildedGold * pow(curtain, 3.2) * (0.14 + uEnergy * 0.24);
              col += vec3(0.85, 0.62, 0.28) * filigree * (0.12 + uEnergy * 0.18);

              // Sharp twinkling golden-rose starlight
              float starCell = hash(floor(dir * 150.0));
              float star = smoothstep(0.992, 0.999, starCell) * smoothstep(-0.05, 0.45, dir.y);
              float twinkle = 0.55 + 0.45 * sin(uTime * 4.4 + starCell * 95.0);
              col += mix(vec3(1.0, 0.84, 0.94), vec3(1.0, 0.88, 0.52), step(0.996, starCell)) * star * twinkle;

              col += vec3(0.95, 0.68, 0.85) * uFlash * 0.22;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      scene.add(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(88, 32, 24)), skyMat));

      // =========================================================================
      // BACKGROUND 2: Custom GLSL Arcane Sea Floor + Grounded Casino Dais
      // =========================================================================
      const arcaneFloorUniforms = {
        uTime: { value: 0 },
        uSurge: { value: 0.3 }
      };
      const arcaneFloorMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: arcaneFloorUniforms,
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
              float wave = 0.5 + 0.5 * sin(r * 1.2 - uTime * 2.5 + sin(ang * 4.0) * 0.4);
              float spoke = smoothstep(0.95, 0.996, abs(sin(ang * 6.0)));
              float veins = smoothstep(0.35, 0.92, wave * 0.65 + spoke * 0.55);
              float edge = 1.0 - smoothstep(14.0, 32.0, r);

              vec3 darkBed = vec3(0.02, 0.006, 0.045);
              vec3 plumRift = vec3(0.36, 0.06, 0.42);
              vec3 goldVein = vec3(0.92, 0.68, 0.18);

              vec3 col = mix(darkBed, plumRift, veins * (0.38 + uSurge * 0.4));
              col += goldVein * spoke * veins * (0.24 + uSurge * 0.45);
              gl_FragColor = vec4(col, edge * 0.9);
            }
          `
        })
      );
      const floorPlane = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(72, 72)), arcaneFloorMat);
      floorPlane.rotation.x = -Math.PI / 2;
      floorPlane.position.y = -0.62;
      scene.add(floorPlane);

      // Procedural Texture 1: 1024px Destiny Roulette Wheel
      const wheelCanvas = document.createElement('canvas');
      wheelCanvas.width = 1024;
      wheelCanvas.height = 1024;
      const wctx = wheelCanvas.getContext('2d');
      if (wctx) {
        wctx.clearRect(0, 0, 1024, 1024);
        const bgGrad = wctx.createRadialGradient(512, 512, 42, 512, 512, 496);
        bgGrad.addColorStop(0, 'rgba(251, 191, 36, 0.52)');
        bgGrad.addColorStop(0.45, 'rgba(190, 24, 93, 0.34)');
        bgGrad.addColorStop(0.84, 'rgba(88, 28, 135, 0.24)');
        bgGrad.addColorStop(1, 'rgba(9, 2, 18, 0)');
        wctx.fillStyle = bgGrad;
        wctx.fillRect(0, 0, 1024, 1024);

        for (let i = 0; i < 12; i++) {
          const a0 = (i * Math.PI * 2) / 12;
          const a1 = ((i + 1) * Math.PI * 2) / 12;
          wctx.beginPath();
          wctx.moveTo(512, 512);
          wctx.arc(512, 512, 466, a0, a1);
          wctx.closePath();
          wctx.fillStyle = i % 2 === 0 ? 'rgba(131, 24, 67, 0.42)' : 'rgba(15, 23, 42, 0.48)';
          wctx.fill();
          wctx.strokeStyle = i % 3 === 0 ? '#fbbf24' : 'rgba(244, 114, 182, 0.65)';
          wctx.lineWidth = i % 3 === 0 ? 5 : 2.6;
          wctx.stroke();
        }

        // Precision degree ticks around outer bezel
        for (let t = 0; t < 48; t++) {
          const a = (t * Math.PI * 2) / 48;
          const rIn = t % 4 === 0 ? 430 : 448;
          wctx.strokeStyle = t % 4 === 0 ? '#fde047' : 'rgba(244, 114, 182, 0.55)';
          wctx.lineWidth = t % 4 === 0 ? 4 : 2;
          wctx.beginPath();
          wctx.moveTo(512 + Math.cos(a) * rIn, 512 + Math.sin(a) * rIn);
          wctx.lineTo(512 + Math.cos(a) * 468, 512 + Math.sin(a) * 468);
          wctx.stroke();
        }

        wctx.strokeStyle = '#fde047';
        wctx.lineWidth = 8;
        wctx.beginPath();
        wctx.arc(512, 512, 468, 0, Math.PI * 2);
        wctx.stroke();

        wctx.strokeStyle = '#ec4899';
        wctx.lineWidth = 5;
        wctx.beginPath();
        wctx.arc(512, 512, 338, 0, Math.PI * 2);
        wctx.stroke();

        wctx.strokeStyle = '#fbbf24';
        wctx.lineWidth = 4;
        wctx.beginPath();
        wctx.arc(512, 512, 198, 0, Math.PI * 2);
        wctx.stroke();

        const pipIcons = ['♠', '♥', '♦', '♣'];
        const pipColors = ['#38bdf8', '#fb7185', '#fbbf24', '#c084fc'];
        wctx.textAlign = 'center';
        wctx.textBaseline = 'middle';
        wctx.font = 'bold 54px sans-serif';
        for (let i = 0; i < 12; i++) {
          const ang = ((i + 0.5) * Math.PI * 2) / 12;
          const rx = 512 + Math.cos(ang) * 392;
          const ry = 512 + Math.sin(ang) * 392;
          wctx.save();
          wctx.translate(rx, ry);
          wctx.rotate(ang + Math.PI / 2);
          wctx.fillStyle = pipColors[i % 4];
          wctx.fillText(pipIcons[i % 4], 0, 0);
          wctx.restore();
        }
      }
      const wheelTex = trackTex(new THREE.CanvasTexture(wheelCanvas));
      wheelTex.colorSpace = THREE.SRGBColorSpace;
      wheelTex.anisotropy = maxAniso;

      // Procedural Texture 2: Ornate 512x768 Tarot Card Back
      const backCanvas = document.createElement('canvas');
      backCanvas.width = 512;
      backCanvas.height = 768;
      const bctx = backCanvas.getContext('2d');
      if (bctx) {
        bctx.fillStyle = '#140726';
        bctx.fillRect(0, 0, 512, 768);
        bctx.strokeStyle = '#fbbf24';
        bctx.lineWidth = 14;
        bctx.strokeRect(22, 22, 468, 724);
        bctx.strokeStyle = '#ec4899';
        bctx.lineWidth = 6;
        bctx.strokeRect(46, 46, 420, 676);

        bctx.strokeStyle = '#fde047';
        bctx.lineWidth = 5;
        bctx.beginPath();
        bctx.moveTo(256, 130);
        bctx.lineTo(408, 384);
        bctx.lineTo(256, 638);
        bctx.lineTo(104, 384);
        bctx.closePath();
        bctx.stroke();

        bctx.beginPath();
        bctx.arc(256, 384, 88, 0, Math.PI * 2);
        bctx.strokeStyle = '#f472b6';
        bctx.stroke();

        bctx.fillStyle = '#fbbf24';
        bctx.font = 'bold 68px serif';
        bctx.textAlign = 'center';
        bctx.textBaseline = 'middle';
        bctx.fillText('✦', 256, 388);
      }
      const cardBackTex = trackTex(new THREE.CanvasTexture(backCanvas));
      cardBackTex.colorSpace = THREE.SRGBColorSpace;
      cardBackTex.anisotropy = maxAniso;

      // Procedural Texture 3: Crisp 512x768 Tarot Card Front per Suit
      const createCardFaceTexture = (suit: ArcanaSuit) => {
        const meta = SUIT_META[suit];
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 768;
        const fctx = c.getContext('2d');
        if (fctx) {
          const grad = fctx.createLinearGradient(0, 0, 0, 768);
          grad.addColorStop(0, '#090314');
          grad.addColorStop(0.5, '#190831');
          grad.addColorStop(1, '#090314');
          fctx.fillStyle = grad;
          fctx.fillRect(0, 0, 512, 768);

          fctx.strokeStyle = meta.cssColor;
          fctx.lineWidth = 14;
          fctx.strokeRect(20, 20, 472, 728);

          fctx.strokeStyle = 'rgba(251, 191, 36, 0.78)';
          fctx.lineWidth = 5;
          fctx.strokeRect(42, 42, 428, 684);

          fctx.fillStyle = meta.cssColor;
          fctx.font = 'bold 52px sans-serif';
          fctx.textAlign = 'center';
          fctx.textBaseline = 'middle';
          fctx.fillText(meta.icon, 88, 96);
          fctx.fillText(meta.icon, 424, 672);

          fctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
          fctx.lineWidth = 4;
          fctx.beginPath();
          fctx.arc(256, 304, 136, 0, Math.PI * 2);
          fctx.stroke();

          fctx.fillStyle = meta.cssColor;
          fctx.font = '900 208px sans-serif';
          fctx.fillText(meta.icon, 256, 314);

          fctx.fillStyle = '#f8fafc';
          fctx.font = 'bold 30px sans-serif';
          fctx.fillText(meta.title, 256, 524);

          fctx.fillStyle = '#fbbf24';
          fctx.font = '900 40px sans-serif';
          fctx.fillText(meta.punish, 256, 602);
        }
        const tex = trackTex(new THREE.CanvasTexture(c));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        return tex;
      };

      // Procedural Loaded Fate Die Face Texture (1-6 glowing gold pips)
      const createDieFaceTexture = (pips: number) => {
        const dc = document.createElement('canvas');
        dc.width = 128;
        dc.height = 128;
        const ctx = dc.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#18082b';
          ctx.fillRect(0, 0, 128, 128);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 8;
          ctx.strokeRect(8, 8, 112, 112);

          const coords: Record<number, [number, number][]> = {
            1: [[64, 64]],
            2: [[38, 38], [90, 90]],
            3: [[38, 38], [64, 64], [90, 90]],
            4: [[38, 38], [90, 38], [38, 90], [90, 90]],
            5: [[38, 38], [90, 38], [64, 64], [38, 90], [90, 90]],
            6: [[38, 34], [90, 34], [38, 64], [90, 64], [38, 94], [90, 94]]
          };
          ctx.fillStyle = pips === 6 ? '#fde047' : '#f472b6';
          for (const [px, py] of coords[pips] || coords[6]) {
            ctx.beginPath();
            ctx.arc(px, py, pips === 1 ? 15 : 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        const tex = trackTex(new THREE.CanvasTexture(dc));
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };

      // Shared Calibrated PBR Materials
      const obsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x10071f,
          roughness: 0.5,
          metalness: 0.52
        })
      );
      const royalCoatMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x831843,
          emissive: 0x4c0519,
          emissiveIntensity: 0.2,
          roughness: 0.54,
          metalness: 0.24,
          side: THREE.DoubleSide
        })
      );
      const plumClothMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x3b0764,
          emissive: 0x1e0538,
          emissiveIntensity: 0.16,
          roughness: 0.68,
          metalness: 0.14,
          side: THREE.DoubleSide
        })
      );
      const goldTrimMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0x92400e,
          emissiveIntensity: 0.18,
          roughness: 0.18,
          metalness: 0.92
        })
      );
      const magentaGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0xec4899,
          emissiveIntensity: 1.28,
          roughness: 0.18,
          metalness: 0.16
        })
      );
      const goldGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.32,
          roughness: 0.16,
          metalness: 0.18
        })
      );

      // 1. Grounded Astral Casino Dais & 6 Ornate Tarot Arch-Pillars
      const daisBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(4.65, 5.25, 0.55, 16)),
        obsidianMat
      );
      daisBase.position.y = -0.275;
      daisBase.receiveShadow = !isSoftwareGl;
      scene.add(daisBase);

      const daisTrim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(4.68, 0.06, 10, 64)),
        goldTrimMat
      );
      daisTrim.rotation.x = Math.PI / 2;
      daisTrim.position.y = 0.01;
      scene.add(daisTrim);

      const daisVelvetRing = new THREE.Mesh(
        trackGeo(new THREE.RingGeometry(2.85, 4.55, 48)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x2a0836,
            roughness: 0.85,
            metalness: 0.1,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
          })
        )
      );
      daisVelvetRing.rotation.x = -Math.PI / 2;
      daisVelvetRing.position.y = 0.015;
      scene.add(daisVelvetRing);

      // Contact shadow beneath Arcana
      const csCanvas = document.createElement('canvas');
      csCanvas.width = 128;
      csCanvas.height = 128;
      const csCtx = csCanvas.getContext('2d');
      if (csCtx) {
        const g = csCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
        g.addColorStop(0, 'rgba(4, 1, 10, 0.78)');
        g.addColorStop(0.55, 'rgba(4, 1, 10, 0.35)');
        g.addColorStop(1, 'rgba(4, 1, 10, 0)');
        csCtx.fillStyle = g;
        csCtx.fillRect(0, 0, 128, 128);
      }
      const contactShadow = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(1.7, 1.7)),
        trackMat(
          new THREE.MeshBasicMaterial({
            map: trackTex(new THREE.CanvasTexture(csCanvas)),
            transparent: true,
            opacity: 0.72,
            depthWrite: false
          })
        )
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.set(0, 0.025, -0.95);
      scene.add(contactShadow);

      const pylonGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.24, 2.35, 6));
      const pylonBandGeo = trackGeo(new THREE.TorusGeometry(0.21, 0.028, 6, 16));
      const pylonCapGeo = trackGeo(new THREE.OctahedronGeometry(0.24, 0));
      const pylonCaps: THREE.Mesh[] = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6 + Math.PI / 6;
        const pGroup = new THREE.Group();
        pGroup.position.set(Math.cos(ang) * 5.65, 1.0, Math.sin(ang) * 5.65);
        pGroup.lookAt(0, 1.0, 0);
        pGroup.add(new THREE.Mesh(pylonGeo, obsidianMat));

        const band = new THREE.Mesh(pylonBandGeo, goldTrimMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = 0.85;
        pGroup.add(band);

        const cap = new THREE.Mesh(pylonCapGeo, i % 2 === 0 ? magentaGlowMat : goldGlowMat);
        cap.position.y = 1.55;
        pGroup.add(cap);
        pylonCaps.push(cap);
        scene.add(pGroup);
      }

      // 18 Orbiting Mini Phantom Tarot Cards swirling around the arena perimeter
      const miniCardCount = 18;
      const miniCardGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.42, 0.015));
      const miniCardMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x831843,
          emissiveIntensity: 0.65,
          roughness: 0.28,
          metalness: 0.45
        })
      );
      const miniCardInstanced = new THREE.InstancedMesh(miniCardGeo, miniCardMat, miniCardCount);
      miniCardInstanced.frustumCulled = false;
      scene.add(miniCardInstanced);
      for (let i = 0; i < miniCardCount; i++) {
        _tmpColor.setHex(i % 3 === 0 ? 0xfbbf24 : i % 2 === 0 ? 0xf472b6 : 0xa855f7);
        miniCardInstanced.setColorAt(i, _tmpColor);
      }
      if (miniCardInstanced.instanceColor) miniCardInstanced.instanceColor.needsUpdate = true;

      // 2. Sculpted Composite 3D Arcana Sovereign Character (at z = -0.95)
      const arcanaGroup = new THREE.Group();
      arcanaGroup.position.set(0, 0, -0.95);
      scene.add(arcanaGroup);

      // Articulated Boots & Legs
      const thighGeo = trackGeo(new THREE.CylinderGeometry(0.115, 0.095, 0.44, 8));
      const shinGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.075, 0.44, 8));
      const bootGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.11, 0.26));
      const buildLeg = (side: -1 | 1) => {
        const hip = new THREE.Group();
        hip.position.set(side * 0.18, 0.84, 0);
        const thigh = new THREE.Mesh(thighGeo, obsidianMat);
        thigh.position.y = -0.21;
        thigh.castShadow = !isSoftwareGl;

        const knee = new THREE.Group();
        knee.position.y = -0.42;
        const shin = new THREE.Mesh(shinGeo, obsidianMat);
        shin.position.y = -0.21;
        shin.castShadow = !isSoftwareGl;
        const boot = new THREE.Mesh(bootGeo, goldTrimMat);
        boot.position.set(0, -0.4, 0.05);
        knee.add(shin, boot);
        hip.add(thigh, knee);
        arcanaGroup.add(hip);
        return { hip, knee };
      };
      const legL = buildLeg(-1);
      const legR = buildLeg(1);

      const pelvis = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.26, 0.23, 0.28, 8)), plumClothMat);
      pelvis.position.y = 0.92;
      const beltBuckle = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.11, 0)), goldGlowMat);
      beltBuckle.position.set(0, 0.94, 0.26);
      arcanaGroup.add(pelvis, beltBuckle);

      const torsoPivot = new THREE.Group();
      torsoPivot.position.y = 1.04;
      arcanaGroup.add(torsoPivot);

      const torso = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.36, 0.25, 0.82, 8)), royalCoatMat);
      torso.position.y = 0.4;
      torso.castShadow = !isSoftwareGl;
      const lapelCollar = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.25, 0.038, 8, 24)), goldTrimMat);
      lapelCollar.rotation.x = Math.PI / 2 + 0.2;
      lapelCollar.position.set(0, 0.78, 0.04);
      const chestCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.135, 0)), magentaGlowMat);
      chestCore.position.set(0, 0.44, 0.32);
      torsoPivot.add(torso, lapelCollar, chestCore);

      // Swallowtail Royal Coat Tails
      const coatShape = new THREE.Shape();
      coatShape.moveTo(-0.42, 0);
      coatShape.lineTo(0.42, 0);
      coatShape.lineTo(0.72, -1.52);
      coatShape.lineTo(0.2, -1.28);
      coatShape.lineTo(0, -1.65);
      coatShape.lineTo(-0.2, -1.28);
      coatShape.lineTo(-0.72, -1.52);
      coatShape.closePath();
      const coatTails = new THREE.Mesh(
        trackGeo(new THREE.ExtrudeGeometry(coatShape, { depth: 0.04, bevelEnabled: false })),
        plumClothMat
      );
      coatTails.position.set(0, 0.68, -0.26);
      coatTails.rotation.x = 0.24;
      torsoPivot.add(coatTails);

      // Gilded Shoulder Epaulettes
      const pauldronGeo = trackGeo(new THREE.DodecahedronGeometry(0.21, 0));
      const pauldronL = new THREE.Mesh(pauldronGeo, goldTrimMat);
      pauldronL.position.set(-0.45, 0.68, 0);
      pauldronL.scale.set(1.18, 0.72, 1.02);
      const pauldronR = pauldronL.clone();
      pauldronR.position.x = 0.45;
      torsoPivot.add(pauldronL, pauldronR);

      // Masquerade Head + Signature Sovereign Top-Hat with Ace Emblem
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.98, 0.03);
      const faceHelm = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.2, 0)), obsidianMat);
      const visor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.062, 0.14)), magentaGlowMat);
      visor.position.set(0, 0.01, 0.16);

      const hatBrim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 18)), obsidianMat);
      hatBrim.position.set(0, 0.17, -0.02);
      hatBrim.rotation.x = -0.14;
      const hatCrown = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.25, 0.21, 0.38, 16)), royalCoatMat);
      hatCrown.position.set(0, 0.36, -0.05);
      hatCrown.rotation.x = -0.14;
      const hatRibbon = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.23, 0.026, 8, 24)), goldTrimMat);
      hatRibbon.rotation.x = Math.PI / 2 - 0.14;
      hatRibbon.position.set(0, 0.23, -0.03);
      const hatCard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.13, 0.19, 0.02)), goldGlowMat);
      hatCard.position.set(0.19, 0.34, 0.1);
      hatCard.rotation.z = -0.28;

      headGroup.add(faceHelm, visor, hatBrim, hatCrown, hatRibbon, hatCard);
      torsoPivot.add(headGroup);

      // Articulated Arms + Glowing Fate Orbs + Card Fan in Left Hand
      const armGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.065, 0.66, 8));
      const handOrbGeo = trackGeo(new THREE.OctahedronGeometry(0.115, 0));

      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.44, 0.62, 0.04);
      const leftArmMesh = new THREE.Mesh(armGeo, royalCoatMat);
      leftArmMesh.position.set(0, -0.32, 0);
      const leftHandOrb = new THREE.Mesh(handOrbGeo, magentaGlowMat);
      leftHandOrb.position.set(0, -0.68, 0);
      leftArmPivot.add(leftArmMesh, leftHandOrb);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.44, 0.62, 0.04);
      const rightArmMesh = new THREE.Mesh(armGeo, royalCoatMat);
      rightArmMesh.position.set(0, -0.32, 0);
      const rightHandOrb = new THREE.Mesh(handOrbGeo, goldGlowMat);
      rightHandOrb.position.set(0, -0.68, 0);
      rightArmPivot.add(rightArmMesh, rightHandOrb);
      torsoPivot.add(leftArmPivot, rightArmPivot);

      // Floating Golden Destiny Halo behind Arcana
      const sovereignHaloGroup = new THREE.Group();
      sovereignHaloGroup.position.set(0, 0.78, -0.38);
      sovereignHaloGroup.visible = false;
      const sovereignHaloOuter = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.86, 0.036, 8, 48)), goldTrimMat);
      const sovereignHaloInner = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.6, 0.025, 8, 36)), magentaGlowMat);
      sovereignHaloGroup.add(sovereignHaloOuter, sovereignHaloInner);
      torsoPivot.add(sovereignHaloGroup);

      // 3. Giant Rotating Destiny Roulette Floor Wheel (centered at z = 1.35)
      const rouletteGroup = new THREE.Group();
      rouletteGroup.position.set(0, 0.03, 1.35);
      scene.add(rouletteGroup);

      const rouletteMat = trackMat(
        new THREE.MeshBasicMaterial({
          map: wheelTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const rouletteDisc = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(2.85, 64)), rouletteMat);
      rouletteDisc.rotation.x = -Math.PI / 2;
      rouletteGroup.add(rouletteDisc);

      const rouletteOuterRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(2.88, 0.055, 10, 64)), goldGlowMat);
      rouletteOuterRing.rotation.x = Math.PI / 2;
      rouletteOuterRing.position.y = 0.03;

      const rouletteInnerRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1.7, 0.036, 8, 48)), magentaGlowMat);
      rouletteInnerRing.rotation.x = Math.PI / 2;
      rouletteInnerRing.position.y = 0.06;
      rouletteGroup.add(rouletteOuterRing, rouletteInnerRing);

      // 3B. Loaded Fate Die (D6) — Spins in air then slams onto center of Roulette at 0.56->0.62!
      const dieMaterials = [
        trackMat(new THREE.MeshStandardMaterial({ map: createDieFaceTexture(3), roughness: 0.25, metalness: 0.4 })),
        trackMat(new THREE.MeshStandardMaterial({ map: createDieFaceTexture(4), roughness: 0.25, metalness: 0.4 })),
        trackMat(new THREE.MeshStandardMaterial({ map: createDieFaceTexture(6), emissive: 0x78350f, emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.45 })), // +Y face = 6!
        trackMat(new THREE.MeshStandardMaterial({ map: createDieFaceTexture(1), roughness: 0.25, metalness: 0.4 })),
        trackMat(new THREE.MeshStandardMaterial({ map: createDieFaceTexture(2), roughness: 0.25, metalness: 0.4 })),
        trackMat(new THREE.MeshStandardMaterial({ map: createDieFaceTexture(5), roughness: 0.25, metalness: 0.4 }))
      ];
      const fateDieGroup = new THREE.Group();
      fateDieGroup.position.set(0, 2.7, 1.35);
      fateDieGroup.visible = false;
      const fateDieCube = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.62, 0.62, 0.62)), dieMaterials);
      const fateDieCage = new THREE.LineSegments(
        trackGeo(new THREE.EdgesGeometry(trackGeo(new THREE.BoxGeometry(0.66, 0.66, 0.66)))),
        trackMat(new THREE.LineBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.85 }))
      );
      fateDieGroup.add(fateDieCube, fateDieCage);
      scene.add(fateDieGroup);

      // 4. 3 Monumental Floating 3D Tarot Cards + Suit Judgment Spires + Roulette Tethers
      const cardBodyGeo = trackGeo(new THREE.BoxGeometry(1.22, 1.84, 0.058));
      const cardFaceGeo = trackGeo(new THREE.PlaneGeometry(1.14, 1.76));
      const cardBackMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: cardBackTex,
          roughness: 0.32,
          metalness: 0.42
        })
      );
      const tetherGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 1, 8));

      interface CardRig {
        group: THREE.Group;
        beam: THREE.Mesh;
        beamMat: THREE.MeshBasicMaterial;
        tether: THREE.Mesh;
        tetherMat: THREE.MeshBasicMaterial;
        suit: ArcanaSuit;
      }
      const cardRigs: CardRig[] = [];

      for (let i = 0; i < 3; i++) {
        const suit = activeCards[i];
        const meta = SUIT_META[suit];
        const cardGroup = new THREE.Group();
        cardGroup.visible = false;

        const bodyMesh = new THREE.Mesh(cardBodyGeo, goldTrimMat);
        const faceTex = createCardFaceTexture(suit);
        const faceMat = trackMat(
          new THREE.MeshStandardMaterial({
            map: faceTex,
            emissive: meta.hex,
            emissiveIntensity: 0.24,
            roughness: 0.26,
            metalness: 0.22
          })
        );
        const frontPlane = new THREE.Mesh(cardFaceGeo, faceMat);
        frontPlane.position.z = 0.034;

        const backPlane = new THREE.Mesh(cardFaceGeo, cardBackMat);
        backPlane.position.z = -0.034;
        backPlane.rotation.y = Math.PI;

        cardGroup.add(bodyMesh, frontPlane, backPlane);
        scene.add(cardGroup);

        const beamMat = trackMat(
          new THREE.MeshBasicMaterial({
            color: meta.hex,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
          })
        );
        const beam = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.12, 0.52, 6.2, 16, 1, true)),
          beamMat
        );
        beam.visible = false;
        scene.add(beam);

        const tetherMat = trackMat(
          new THREE.MeshBasicMaterial({
            color: meta.hex,
            transparent: true,
            opacity: 0.72,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        const tether = new THREE.Mesh(tetherGeo, tetherMat);
        tether.visible = false;
        scene.add(tether);

        cardRigs.push({ group: cardGroup, beam, beamMat, tether, tetherMat, suit });
      }

      // 5. Phase III Royal Flush Detonation: GLSL Fresnel Verdict Dome, Sky Pillar, Needles & Shards
      const verdictDomeUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0 }
      };
      const verdictDomeMat = trackMat(
        new THREE.ShaderMaterial({
          uniforms: verdictDomeUniforms,
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
              float wave = 0.75 + 0.25 * sin(vLocal.y * 14.0 - uTime * 14.0);
              float intensity = pow(rim, 3.2) * wave * uAlpha;
              vec3 col = mix(vec3(0.95, 0.3, 0.65), vec3(1.0, 0.84, 0.28), pow(rim, 4.5));
              gl_FragColor = vec4(col * intensity, clamp(intensity, 0.0, 1.0));
            }
          `
        })
      );
      const areaDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1, 28, 20)), verdictDomeMat);
      areaDome.position.set(0, 0.5, 1.35);
      areaDome.visible = false;
      scene.add(areaDome);

      const pillarMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf472b6,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const destinyPillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.85, 1.65, 20, 28, 1, true)),
        pillarMat
      );
      destinyPillar.position.set(0, 9.8, 1.35);
      destinyPillar.visible = false;
      scene.add(destinyPillar);

      const shockGoldMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockMagentaMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf472b6,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const shockwaveGold = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1, 0.085, 10, 64)), shockGoldMat);
      shockwaveGold.rotation.x = Math.PI / 2;
      shockwaveGold.position.set(0, 0.16, 1.35);
      shockwaveGold.visible = false;
      scene.add(shockwaveGold);

      const shockwaveMagenta = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1, 0.065, 10, 64)), shockMagentaMat);
      shockwaveMagenta.rotation.x = Math.PI / 2;
      shockwaveMagenta.position.set(0, 0.24, 1.35);
      shockwaveMagenta.visible = false;
      scene.add(shockwaveMagenta);

      // 24 Radial Suit-Colored Judgment Needles
      const needleCount = 24;
      const needleMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const needleInstanced = new THREE.InstancedMesh(
        trackGeo(new THREE.ConeGeometry(0.075, 2.5, 5)),
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
          Math.abs(Math.cos(phi)) * 0.75 + 0.1,
          Math.sin(phi) * Math.sin(theta)
        ).normalize();
        needleDirs.push(dir);
        needleQuats.push(new THREE.Quaternion().setFromUnitVectors(_axisY, dir));
        _tmpColor.setHex(i % 4 === 0 ? 0xfbbf24 : SUIT_META[activeCards[i % 3]].hex);
        needleInstanced.setColorAt(i, _tmpColor);
      }
      if (needleInstanced.instanceColor) needleInstanced.instanceColor.needsUpdate = true;

      // 110 Instanced Tarot Crystal Shards
      const shardCount = 110;
      const shardGeo = trackGeo(new THREE.OctahedronGeometry(0.115, 0));
      const shardMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xec4899,
          emissiveIntensity: 1.05,
          roughness: 0.18,
          metalness: 0.45
        })
      );
      const shardInstanced = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
      shardInstanced.frustumCulled = false;
      scene.add(shardInstanced);

      const shardDirs: THREE.Vector3[] = [];
      const shardSpeeds: number[] = [];
      const orbitAngles: number[] = [];
      for (let i = 0; i < shardCount; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / shardCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        shardDirs.push(
          new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.abs(Math.cos(phi)) * 0.7 + 0.12,
            Math.sin(phi) * Math.sin(theta)
          ).normalize()
        );
        shardSpeeds.push(4.8 + (i % 7) * 0.95);
        orbitAngles.push((i * Math.PI * 2) / shardCount);
        _tmpColor.setHex(i % 4 === 0 ? 0xfbbf24 : SUIT_META[activeCards[i % 3]].hex);
        shardInstanced.setColorAt(i, _tmpColor);
      }
      if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;

      // Ambient Gold & Rose Arcane Dust
      const dustCount = 180;
      const dustPositions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 1.6 + Math.random() * 8.0;
        dustPositions[i * 3] = Math.cos(ang) * rad;
        dustPositions[i * 3 + 1] = 0.25 + Math.random() * 5.6;
        dustPositions[i * 3 + 2] = Math.sin(ang) * rad;
      }
      const dustGeo = trackGeo(new THREE.BufferGeometry());
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      const dustMat = trackMat(
        new THREE.PointsMaterial({
          color: 0xfbbf24,
          size: 0.085,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      scene.add(dustPoints);

      // =========================================================================
      // GPU POST-PROCESSING PIPELINE (Calibrated Bloom + Destiny Shock Pass)
      // =========================================================================
      let composer: EffectComposer | null = null;
      let renderPass: RenderPass | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let shockPass: ShaderPass | null = null;
      let outputPass: OutputPass | null = null;

      const shockUniforms = {
        tDiffuse: { value: null },
        uAberration: { value: 0.001 },
        uShockWave: { value: 0 },
        uShockRadius: { value: 0 },
        uAnamorphic: { value: 0.02 },
        uFlash: { value: 0 },
        uVignette: { value: 0.34 }
      };

      if (!isSoftwareGl) {
        const initW = window.innerWidth;
        const initH = Math.max(1, window.innerHeight);
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);
        bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.18, 0.24, 1.12);
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

              float ringDiff = dist - uShockRadius;
              float ringBand = exp(-ringDiff * ringDiff * 165.0) * uShockWave;
              vec2 uv = clamp(vUv - dir * ringBand * 0.03, 0.001, 0.999);

              vec2 caOffset = dir * uAberration * (0.35 + dist * 1.15 + ringBand * 1.6);
              float r = texture2D(tDiffuse, clamp(uv + caOffset, 0.001, 0.999)).r;
              float g = texture2D(tDiffuse, uv).g;
              float b = texture2D(tDiffuse, clamp(uv - caOffset, 0.001, 0.999)).b;
              vec3 col = vec3(r, g, b);

              float hBand = exp(-abs(vUv.y - 0.5) * 44.0) * exp(-abs(vUv.x - 0.5) * 3.0);
              col += mix(vec3(0.95, 0.34, 0.68), vec3(1.0, 0.84, 0.3), hBand) * hBand * uAnamorphic;

              col += vec3(0.98, 0.72, 0.88) * ringBand * 0.16;
              col += vec3(0.98, 0.85, 0.92) * uFlash;

              float vig = smoothstep(0.36, 0.98, dist);
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

        // Pre-warm all Phase II & Phase III meshes/shaders so p=0.62 causes zero GPU compile hitch
        const warmObjects: THREE.Object3D[] = [
          sovereignHaloGroup,
          fateDieGroup,
          areaDome,
          destinyPillar,
          shockwaveGold,
          shockwaveMagenta,
          needleInstanced,
          ...cardRigs.flatMap((r) => [r.group, r.beam, r.tether])
        ];
        for (const obj of warmObjects) obj.visible = true;
        renderer.compile(scene, camera);
        for (const obj of warmObjects) obj.visible = false;
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
      let lastPhase: CutscenePhase = 'draw';
      let lastUiPct = -1;
      let flashTriggered = false;
      let currentRoll = 0;
      let smoothedBloom = 0.18;
      let smoothedAberration = 0.001;
      let smoothedAnamorphic = 0.02;
      let smoothedRouletteLight = 4.5;
      let smoothedCardLight = 3.8;
      let haloAngle = 0;

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
          p < 0.2 ? 'draw' : p < 0.62 ? 'verdict' : p < 0.85 ? 'roulette' : 'curtain_return';
        if (nextPhase !== lastPhase) {
          lastPhase = nextPhase;
          setPhase(nextPhase);
        }

        if (p >= 0.62 && !flashTriggered) {
          flashTriggered = true;
          setVerdictFlash(true);
          window.setTimeout(() => {
            if (!isDisposed) setVerdictFlash(false);
          }, 160);
        }

        // Update Shaders & Perimeter Orbiters
        skyUniforms.uTime.value = elapsedSec;
        skyUniforms.uEnergy.value = p < 0.2 ? 0.3 : p < 0.62 ? 0.56 : p < 0.85 ? 0.78 : 0.42;
        skyUniforms.uFlash.value = p >= 0.62 && p < 0.72 ? (1 - (p - 0.62) / 0.1) * 0.25 : 0;

        arcaneFloorUniforms.uTime.value = elapsedSec;
        arcaneFloorUniforms.uSurge.value = p < 0.62 ? 0.28 + p * 0.5 : Math.max(0.3, 0.8 - (p - 0.62) * 1.1);

        dustPoints.rotation.y += dt * 0.36;
        for (let i = 0; i < pylonCaps.length; i++) {
          pylonCaps[i].rotation.y += dt * 2.4;
          pylonCaps[i].position.y = 1.55 + Math.sin(elapsedSec * 3.8 + i) * 0.1;
        }

        // 18 Orbiting Mini Phantom Tarot Cards
        for (let i = 0; i < miniCardCount; i++) {
          const ang = (i * Math.PI * 2) / miniCardCount + elapsedSec * (0.55 + (p > 0.62 ? 0.45 : 0));
          const rad = 4.65 + (i % 3) * 0.45;
          _dummy.position.set(
            Math.cos(ang) * rad,
            1.15 + (i % 4) * 0.55 + Math.sin(elapsedSec * 2.4 + i) * 0.22,
            Math.sin(ang) * rad
          );
          _dummy.rotation.set(0.25, -ang + Math.PI / 2, Math.sin(elapsedSec * 2 + i) * 0.15);
          _dummy.scale.setScalar(0.85);
          _dummy.updateMatrix();
          miniCardInstanced.setMatrixAt(i, _dummy.matrix);
        }
        miniCardInstanced.instanceMatrix.needsUpdate = true;

        let targetFov = 46;
        let targetRoll = 0;
        let targetBloom = 0.18;
        let targetAberration = 0.001;
        let shockWave = 0;
        let shockRadius = 0;
        let targetAnamorphic = 0.02;
        let postFlash = 0;
        let targetRouletteLight = 4.5;
        let targetCardLight = 3.8;

        if (p < 0.2) {
          // ===================================================================
          // PHASE I (0.00 - 0.20): Draw 3 Face-Down Tarot Cards & Open Roulette
          // ===================================================================
          const dp = p / 0.2;
          const easeOut = 1 - Math.pow(1 - dp, 3);

          arcanaGroup.position.set(0, Math.sin(dp * Math.PI * 2) * 0.03, -0.95);
          torsoPivot.rotation.set(-0.04, 0, 0);
          legL.hip.rotation.set(0, 0, 0.04);
          legL.knee.rotation.set(0, 0, 0);
          legR.hip.rotation.set(0, 0, -0.04);
          legR.knee.rotation.set(0, 0, 0);

          leftArmPivot.rotation.set(-0.55 - easeOut * 1.05, 0.36, -0.34);
          rightArmPivot.rotation.set(-0.55 - easeOut * 1.05, -0.36, 0.34);
          headGroup.rotation.x = -0.05;
          sovereignHaloGroup.visible = false;
          fateDieGroup.visible = false;

          rouletteGroup.scale.setScalar(0.25 + easeOut * 0.8);
          rouletteMat.opacity = Math.min(0.88, dp * 1.45);
          rouletteDisc.rotation.z = dp * Math.PI * 1.6;
          rouletteOuterRing.rotation.z = -dp * Math.PI * 2.2;
          rouletteInnerRing.rotation.z = dp * Math.PI * 2.8;

          for (let i = 0; i < 3; i++) {
            const rig = cardRigs[i];
            rig.group.visible = true;
            rig.beam.visible = false;
            rig.tether.visible = false;
            const spreadX = (i - 1) * 1.65 * easeOut;
            const arcZ = 1.55 - Math.abs(i - 1) * 0.32;
            rig.group.position.set(
              spreadX,
              -0.3 + easeOut * 2.45 + Math.sin(elapsedSec * 4 + i * 1.2) * 0.06,
              arcZ
            );
            rig.group.rotation.set(0, Math.PI + (1 - easeOut) * 0.75, (i - 1) * -0.08);
            rig.group.scale.setScalar(0.35 + easeOut * 0.65);
          }

          areaDome.visible = false;
          destinyPillar.visible = false;
          shockwaveGold.visible = false;
          shockwaveMagenta.visible = false;
          needleInstanced.visible = false;

          shardInstanced.visible = true;
          for (let i = 0; i < shardCount; i++) {
            const loopT = (dp * 1.6 + i / shardCount) % 1;
            const ang = orbitAngles[i] + dp * Math.PI * 3.0;
            const rad = 0.85 + (1 - loopT) * 1.95;
            _dummy.position.set(Math.cos(ang) * rad, 0.2 + loopT * 2.4, 1.35 + Math.sin(ang) * rad);
            _dummy.rotation.set(loopT * 5, ang, i);
            _dummy.scale.setScalar(0.45 + Math.sin(loopT * Math.PI) * 0.45);
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          targetRouletteLight = 4.2 + easeOut * 3.5;
          targetCardLight = 3.5 + easeOut * 3.2;
          targetFov = 46 - easeOut * 2.0;
          targetBloom = 0.16 + easeOut * 0.04;
        } else if (p < 0.62) {
          // ===================================================================
          // PHASE II (0.20 - 0.62): Sequential Card Flips at 0.20 / 0.32 / 0.44
          // + Loaded Fate Die (D6 -> 6) Drop & Shard Convergence toward Core!
          // ===================================================================
          const vp = (p - 0.2) / 0.42;
          const lift = Math.min(1, vp * 1.4) * 0.32;
          arcanaGroup.position.set(0, lift, -0.95);
          contactShadow.material.opacity = Math.max(0.28, 0.72 - lift * 1.1);
          legL.hip.rotation.set(-0.18 * lift, 0, 0.06);
          legL.knee.rotation.set(0.35 * lift, 0, 0);
          legR.hip.rotation.set(0.08 * lift, 0, -0.06);
          legR.knee.rotation.set(0.18 * lift, 0, 0);

          const preBlastRaise = THREE.MathUtils.smoothstep(p, 0.54, 0.62);
          leftArmPivot.rotation.set(
            THREE.MathUtils.lerp(-1.58 - Math.sin(vp * Math.PI * 4) * 0.08, -1.24, preBlastRaise),
            0.44 + preBlastRaise * 0.08,
            -0.42 - preBlastRaise * 0.08
          );
          rightArmPivot.rotation.set(
            THREE.MathUtils.lerp(-1.58 - Math.sin(vp * Math.PI * 4) * 0.08, -1.24, preBlastRaise),
            -0.44 - preBlastRaise * 0.08,
            0.42 + preBlastRaise * 0.08
          );
          torsoPivot.rotation.set(THREE.MathUtils.lerp(-0.04, -0.08, preBlastRaise), 0, 0);

          haloAngle += dt * (2.6 + preBlastRaise * 1.6);
          sovereignHaloGroup.visible = true;
          sovereignHaloGroup.scale.setScalar(0.55 + Math.min(1, vp * 1.8) * 0.56);
          sovereignHaloGroup.rotation.z = haloAngle;

          rouletteGroup.scale.setScalar(1.05 + Math.sin(vp * Math.PI * 5) * 0.04);
          rouletteMat.opacity = 0.92;
          rouletteDisc.rotation.z += dt * (3.4 + preBlastRaise * 1.6);
          rouletteOuterRing.rotation.z -= dt * (4.2 + preBlastRaise * 1.4);
          rouletteInnerRing.rotation.z += dt * 4.8;

          // Smooth Phase II line -> early orbit transition near p = 0.55..0.62
          const lineToOrbit = THREE.MathUtils.smoothstep(p, 0.54, 0.62);
          const revealThresholds = [0.2, 0.32, 0.44];
          for (let i = 0; i < 3; i++) {
            const rig = cardRigs[i];
            rig.group.visible = true;
            const flipLocal = Math.max(0, Math.min(1, (p - revealThresholds[i]) / 0.1));
            const flipEase = 1 - Math.pow(1 - flipLocal, 3);

            const lineX = (i - 1) * 1.72;
            const lineY = 2.2 + Math.sin(elapsedSec * 4.8 + i * 1.4) * 0.08 + flipEase * 0.16;
            const lineZ = 1.55 - Math.abs(i - 1) * 0.32;

            const orbitAng = (i * Math.PI * 2) / 3;
            const orbitX = Math.cos(orbitAng) * 1.95;
            const orbitY = 2.42;
            const orbitZ = 1.35 + Math.sin(orbitAng) * 1.95 * 0.65;

            rig.group.position.set(
              THREE.MathUtils.lerp(lineX, orbitX, lineToOrbit * 0.35),
              THREE.MathUtils.lerp(lineY, orbitY, lineToOrbit * 0.35),
              THREE.MathUtils.lerp(lineZ, orbitZ, lineToOrbit * 0.35)
            );
            rig.group.rotation.set(
              0,
              THREE.MathUtils.lerp(Math.PI * (1 - flipEase), -orbitAng + Math.PI / 2, lineToOrbit * 0.35),
              (i - 1) * -0.07 * (1 - lineToOrbit * 0.35)
            );
            rig.group.scale.setScalar(1.0 + Math.sin(flipEase * Math.PI) * 0.18);

            if (flipEase > 0.55) {
              rig.beam.visible = true;
              rig.beam.position.set(rig.group.position.x, 2.5, rig.group.position.z);
              rig.beamMat.opacity = Math.min(0.32, (flipEase - 0.55) * 0.72);
            } else {
              rig.beam.visible = false;
            }

            if (p >= 0.46) {
              rig.tether.visible = true;
              rig.tetherMat.opacity = 0.72 * (1 - lineToOrbit * 0.85);
              _tmpVecA.set(rig.group.position.x, rig.group.position.y - 0.7, rig.group.position.z);
              _tmpVecB.set(0, 0.55, 1.35);
              const dist = _tmpVecA.distanceTo(_tmpVecB);
              rig.tether.position.copy(_tmpVecA).lerp(_tmpVecB, 0.5);
              rig.tether.scale.set(1, dist, 1);
              rig.tether.lookAt(_tmpVecB);
              rig.tether.rotateX(Math.PI / 2);
            } else {
              rig.tether.visible = false;
            }
          }

          if (p >= 0.38) {
            fateDieGroup.visible = true;
            const dropT = Math.max(0, Math.min(1, (p - 0.46) / 0.16));
            const dieDropEase = dropT * dropT;
            fateDieGroup.position.set(0, 2.85 - dieDropEase * 2.23, 1.35);
            fateDieGroup.rotation.set(
              (1 - dropT) * Math.PI * 5.0,
              (1 - dropT) * Math.PI * 4.0 + 0.3,
              (1 - dropT) * Math.PI * 3.0
            );
            fateDieGroup.scale.setScalar(0.65 + dropT * 0.45);
          } else {
            fateDieGroup.visible = false;
          }

          // Smooth shard funnel converging to singularity center (0, 1.65, 1.35) right before p=0.62!
          const shardConverge = THREE.MathUtils.smoothstep(p, 0.50, 0.62);
          for (let i = 0; i < shardCount; i++) {
            const loopT = (vp * 2.4 + i / shardCount) % 1;
            const ang = orbitAngles[i] - vp * Math.PI * 4.2;
            const spiralRad = 2.4 * (1 - loopT) * (1 - shardConverge * 0.92);
            const spiralY = THREE.MathUtils.lerp(0.25 + loopT * 2.1, 1.65, shardConverge);
            _dummy.position.set(
              Math.cos(ang) * spiralRad,
              spiralY,
              1.35 + Math.sin(ang) * spiralRad
            );
            _dummy.rotation.set(vp * 6 + i, ang, i);
            _dummy.scale.setScalar(0.62 * (1 - loopT * 0.35));
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          areaDome.visible = false;
          destinyPillar.visible = false;
          shockwaveGold.visible = false;
          shockwaveMagenta.visible = false;
          needleInstanced.visible = false;

          targetRouletteLight = 7.5 + vp * 4.5;
          targetCardLight = 6.5 + vp * 4.0;
          targetFov = 44 + vp * 5.2;
          targetRoll = -0.042 * Math.sin(vp * Math.PI);
          targetBloom = 0.2 + vp * 0.08;
          targetAberration = 0.001 + vp * 0.0011;
          targetAnamorphic = 0.025 + vp * 0.032;
        } else if (p < 0.85) {
          // ===================================================================
          // PHASE III (0.62 - 0.85): ROYAL FLUSH DETONATION (Synced at p = 0.62)
          // ===================================================================
          const rp = (p - 0.62) / 0.23;
          const blastT = Math.min(1, rp / 0.45);
          const blastEase = 1 - Math.pow(1 - blastT, 3);
          const fadeOut = 1 - THREE.MathUtils.smoothstep(rp, 0.55, 1.0);
          const orbitFinish = THREE.MathUtils.smoothstep(rp, 0.0, 0.24);

          arcanaGroup.position.set(0, 0.32 + Math.sin(rp * Math.PI) * 0.04, -0.95);
          torsoPivot.rotation.set(-0.08, 0, 0);
          leftArmPivot.rotation.set(-1.22, 0.52, -0.50);
          rightArmPivot.rotation.set(-1.22, -0.52, 0.50);
          sovereignHaloGroup.visible = true;
          sovereignHaloGroup.scale.setScalar(1.11 + Math.sin(rp * Math.PI) * 0.04);
          haloAngle += dt * 4.2;
          sovereignHaloGroup.rotation.z = haloAngle;

          // Fate Die locked on 6 atop the exploding Destiny Roulette
          fateDieGroup.visible = fadeOut > 0.05;
          fateDieGroup.position.set(0, 0.62 + Math.sin(rp * Math.PI) * 0.35, 1.35);
          fateDieGroup.rotation.set(0, 0.3 + rp * Math.PI * 1.2, 0);
          fateDieGroup.scale.setScalar(1.1);

          rouletteDisc.rotation.z += dt * 5.2;
          rouletteOuterRing.rotation.z -= dt * 5.6;
          rouletteMat.opacity = Math.max(0.38, 0.92 - rp * 0.45);

          // Smoothly finish the 0.35 -> 1.0 transition into full orbital circle
          for (let i = 0; i < 3; i++) {
            const rig = cardRigs[i];
            rig.group.visible = true;
            rig.tether.visible = false;

            const lineX = (i - 1) * 1.72;
            const lineY = 2.36 + Math.sin(elapsedSec * 4.8 + i * 1.4) * 0.08;
            const lineZ = 1.55 - Math.abs(i - 1) * 0.32;

            const orbitAng = (i * Math.PI * 2) / 3 + rp * Math.PI * 1.35;
            const orbitR = 1.95 + blastEase * 0.65;
            const orbitX = Math.cos(orbitAng) * orbitR;
            const orbitY = 2.45 + Math.sin(rp * Math.PI * 2 + i) * 0.14;
            const orbitZ = 1.35 + Math.sin(orbitAng) * orbitR * 0.65;

            const blend = 0.35 + 0.65 * orbitFinish;
            rig.group.position.set(
              THREE.MathUtils.lerp(lineX, orbitX, blend),
              THREE.MathUtils.lerp(lineY, orbitY, blend),
              THREE.MathUtils.lerp(lineZ, orbitZ, blend)
            );
            rig.group.rotation.set(0, (-orbitAng + Math.PI / 2) * blend, 0);
            rig.group.scale.setScalar(1.0 + 0.06 * orbitFinish);
            rig.beam.visible = fadeOut > 0.05;
            rig.beam.position.set(rig.group.position.x, 2.5, rig.group.position.z);
            rig.beamMat.opacity = fadeOut * 0.3;
          }

          areaDome.visible = fadeOut > 0.02;
          areaDome.scale.setScalar(0.85 + blastEase * 8.6);
          verdictDomeUniforms.uTime.value = elapsedSec;
          verdictDomeUniforms.uAlpha.value = fadeOut * THREE.MathUtils.smoothstep(rp, 0.0, 0.12) * 0.46;

          destinyPillar.visible = fadeOut > 0.02;
          const pScale = rp < 0.25 ? 0.5 + (rp / 0.25) * 1.4 : Math.max(0.2, 1.9 * fadeOut);
          destinyPillar.scale.set(pScale, 1, pScale);
          pillarMat.opacity =
            rp < 0.25
              ? THREE.MathUtils.smoothstep(rp, 0.0, 0.1) * 0.42
              : Math.max(0, 0.42 * fadeOut);

          shockwaveGold.visible = fadeOut > 0.02;
          shockwaveMagenta.visible = fadeOut > 0.02;
          shockwaveGold.scale.setScalar(0.9 + blastEase * 12.2);
          shockwaveMagenta.scale.setScalar(0.6 + blastEase * 9.2);
          shockGoldMat.opacity = fadeOut * 0.78;
          shockMagentaMat.opacity = fadeOut * 0.74;

          needleInstanced.visible = fadeOut > 0.03;
          if (needleInstanced.visible) {
            const nDist = 0.65 + blastEase * 7.6;
            for (let i = 0; i < needleCount; i++) {
              _tmpVecB.copy(needleDirs[i]).multiplyScalar(nDist);
              _dummy.position.set(_tmpVecB.x, 1.55 + _tmpVecB.y, 1.35 + _tmpVecB.z);
              _dummy.quaternion.copy(needleQuats[i]);
              _dummy.scale.set(1, 0.8 + blastEase * 0.85, 1);
              _dummy.updateMatrix();
              needleInstanced.setMatrixAt(i, _dummy.matrix);
            }
            needleInstanced.instanceMatrix.needsUpdate = true;
            needleMat.opacity = fadeOut * 0.76;
          }

          // Smooth outward crystal shard burst starting from center (0, 1.65, 1.35)
          shardInstanced.visible = true;
          for (let i = 0; i < shardCount; i++) {
            const dist = blastEase * shardSpeeds[i] * 1.38;
            _dummy.position.set(
              shardDirs[i].x * dist,
              Math.max(0.18, 1.65 + shardDirs[i].y * dist * 0.9),
              1.35 + shardDirs[i].z * dist
            );
            _dummy.rotation.set(blastEase * 8 + i, blastEase * 5.5, i * 0.5);
            _dummy.scale.setScalar(Math.max(0.32, 0.65 + blastEase * 0.5 - rp * 0.4));
            _dummy.updateMatrix();
            shardInstanced.setMatrixAt(i, _dummy.matrix);
          }
          shardInstanced.instanceMatrix.needsUpdate = true;

          targetRouletteLight = Math.max(5.5, 13.0 * (1 - blastT * 0.45));
          targetCardLight = Math.max(4.5, 10.5 * (1 - blastT * 0.42));

          const impactPulse = rp < 0.55 ? 1 - rp / 0.55 : 0;
          targetFov = rp < 0.22 ? 49.2 + (rp / 0.22) * 6.2 : 55.4 - Math.min(1, (rp - 0.22) / 0.78) * 8.0;
          targetRoll = THREE.MathUtils.lerp(0.0, 0.042, THREE.MathUtils.smoothstep(rp, 0.0, 0.16)) * (1 - THREE.MathUtils.smoothstep(rp, 0.35, 0.85));
          targetBloom = 0.29 - rp * 0.11;
          targetAberration = 0.0011 + impactPulse * 0.0028;
          shockWave = rp < 0.68 ? THREE.MathUtils.smoothstep(rp, 0.0, 0.08) * Math.max(0, 1 - rp / 0.68) : 0;
          shockRadius = 0.04 + rp * 1.45;
          targetAnamorphic = 0.04 + impactPulse * 0.075;
          postFlash = rp < 0.14 ? (1 - rp / 0.14) * 0.065 : 0;
        } else {
          // ===================================================================
          // PHASE IV (0.85 - 1.00): Curtain Call & Smooth Return to Battle
          // ===================================================================
          const cp = (p - 0.85) / 0.15;
          const settle = 1 - Math.pow(1 - cp, 2);

          arcanaGroup.position.set(0, 0.32 - settle * 0.26, -0.95);
          contactShadow.material.opacity = 0.45 + settle * 0.25;
          torsoPivot.rotation.set(THREE.MathUtils.lerp(-0.08, 0.1 * Math.sin(cp * Math.PI), settle), 0, 0);
          leftArmPivot.rotation.set(-0.75, 0.32, -0.45);
          rightArmPivot.rotation.set(-1.35 + settle * 0.4, -0.25, 0.35);
          haloAngle += dt * 2.2;
          sovereignHaloGroup.rotation.z = haloAngle;

          areaDome.visible = false;
          destinyPillar.visible = false;
          shockwaveGold.visible = false;
          shockwaveMagenta.visible = false;
          needleInstanced.visible = false;
          fateDieGroup.visible = false;

          for (let i = 0; i < 3; i++) {
            const rig = cardRigs[i];
            rig.group.visible = true;
            rig.beam.visible = false;
            rig.tether.visible = false;
            const orbitAng = (i * Math.PI * 2) / 3 + 1.35 * Math.PI + cp * 0.55;
            const orbitR = THREE.MathUtils.lerp(2.6, 2.35, settle);
            rig.group.position.set(
              Math.cos(orbitAng) * orbitR,
              THREE.MathUtils.lerp(2.45, 2.15, settle) + Math.sin(elapsedSec * 3 + i) * 0.1,
              1.35 + Math.sin(orbitAng) * orbitR * 0.65
            );
            rig.group.rotation.set(0, -orbitAng + Math.PI / 2, 0);
            rig.group.scale.setScalar(1.06 * (1 - settle * 0.18));
          }

          targetRouletteLight = 4.8;
          targetCardLight = 4.2;
          targetFov = THREE.MathUtils.lerp(47.4, 46, settle);
          targetBloom = 0.18;
          targetAnamorphic = 0.02 * (1 - settle * 0.5);
        }

        // Dynamic 4-Phase Cinematic Camera Choreography (continuous angle & smooth shake envelope)
        if (p < 0.2) {
          const dp = p / 0.2;
          const camAng = THREE.MathUtils.lerp(0.38, 0.3, dp);
          const camDist = THREE.MathUtils.lerp(5.95, 5.5, dp);
          _camTarget.set(
            Math.sin(camAng) * camDist,
            2.2 - dp * 0.18,
            Math.cos(camAng) * camDist + 0.65
          );
          _lookTarget.set(0, 1.55, 0.68);
        } else if (p < 0.62) {
          const vp = (p - 0.2) / 0.42;
          const camAng = 0.3 - vp * 0.78;
          const camDist = 5.5 + vp * 0.95;
          _camTarget.set(
            Math.sin(camAng) * camDist,
            2.02 + vp * 0.58,
            Math.cos(camAng) * camDist + 0.65
          );
          _lookTarget.set(0, THREE.MathUtils.lerp(1.55, 1.78, Math.min(1, vp * 2)), THREE.MathUtils.lerp(0.68, 1.15, Math.min(1, vp * 2)));
        } else if (p < 0.85) {
          const rp = (p - 0.62) / 0.23;
          const shakeEnv =
            THREE.MathUtils.smoothstep(rp, 0.0, 0.09) *
            (1 - THREE.MathUtils.smoothstep(rp, 0.1, 0.45));
          const shakeMag = shakeEnv * 0.28;
          const shakeX = Math.sin(elapsedSec * 48) * shakeMag;
          const shakeY = Math.cos(elapsedSec * 44) * shakeMag;
          const camAng = -0.48 + rp * 0.88;
          const camDist = 6.45 + Math.min(1, rp * 1.35) * 2.25;
          _camTarget.set(
            Math.sin(camAng) * camDist + shakeX,
            2.6 + rp * 0.92 + shakeY,
            Math.cos(camAng) * camDist + 0.65
          );
          _lookTarget.set(0, 1.72, 1.1);
        } else {
          const cp = (p - 0.85) / 0.15;
          const endAng = 0.4;
          const endDist = 8.7;
          _camTarget.set(
            THREE.MathUtils.lerp(Math.sin(endAng) * endDist, 0.3, cp),
            THREE.MathUtils.lerp(3.52, 6.7, cp),
            THREE.MathUtils.lerp(Math.cos(endAng) * endDist + 0.65, 10.6, cp)
          );
          _lookTarget.set(0, THREE.MathUtils.lerp(1.72, 1.15, cp), THREE.MathUtils.lerp(1.1, 0.5, cp));
        }

        const dampFactor = 1 - Math.exp(-7.5 * dt);
        const fxAlpha = 1 - Math.exp(-9.0 * dt);
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

        smoothedBloom += (targetBloom - smoothedBloom) * fxAlpha;
        smoothedAberration += (targetAberration - smoothedAberration) * fxAlpha;
        smoothedAnamorphic += (targetAnamorphic - smoothedAnamorphic) * fxAlpha;
        smoothedRouletteLight += (targetRouletteLight - smoothedRouletteLight) * fxAlpha;
        smoothedCardLight += (targetCardLight - smoothedCardLight) * fxAlpha;

        rouletteLight.intensity = smoothedRouletteLight;
        cardStageLight.intensity = smoothedCardLight;

        if (composer && bloomPass) {
          bloomPass.strength = smoothedBloom;
          shockUniforms.uAberration.value = smoothedAberration;
          shockUniforms.uShockWave.value = shockWave;
          shockUniforms.uShockRadius.value = shockRadius;
          shockUniforms.uAnamorphic.value = smoothedAnamorphic;
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
      className="fixed inset-0 z-50 bg-[#06010f] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D Royal Flush Destiny Roulette"
    >
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Subtle Royal Flush Impact Flash */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-pink-300/12 via-amber-100/16 to-purple-300/12 transition-opacity duration-150 ${
          verdictFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Top Cinematic Letterbox Bar (solid dark fill, zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#07020f]/94 border-b border-amber-400/50 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-game tracking-[0.24em] uppercase text-pink-300 flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>ARCANA · TAROT VERDICT &amp; FATE DIE 3D</span>
          </p>
          <h2 className="font-title text-base sm:text-2xl font-black tracking-wider text-amber-300 truncate">
            ROYAL FLUSH: DESTINY ROULETTE
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-400/40 bg-fuchsia-950/85 text-xs font-game">
            {normalizedCards.map((suit, idx) => (
              <span key={`${suit}-${idx}`} style={{ color: SUIT_META[suit].cssColor }}>
                {SUIT_META[suit].icon}
              </span>
            ))}
          </div>
          <span className="hidden md:inline-block px-2.5 py-1 rounded border border-pink-400/40 bg-fuchsia-950/85 text-[11px] font-game tracking-wider text-amber-200">
            {PHASE_BADGES[phase]}
          </span>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-[#07020f]/94 border-t border-amber-400/50 px-5 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <p className="pointer-events-none text-[11px] sm:text-xs font-game tracking-wider text-pink-200/90 truncate">
          {PHASE_LABELS[phase]} · {uiProgress}%
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-fuchsia-950 hover:bg-fuchsia-900 border border-amber-400/60 hover:border-pink-300 text-amber-50 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-amber-300" />
        </button>

        {/* Bottom Progress Strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
