import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FastForward, Layers } from 'lucide-react';
import { sounds } from '../audio/soundManager';
import {
  buildAnimeCloneAnomali3D,
  buildAnimeHeroAnomali3D,
  buildAnimeRiftWalker3D,
  createAnomalyStageTexture
} from '../game/anomalyFusionAnimeScene';

interface AnomalyCutsceneModalProps {
  isMuted: boolean;
  onComplete: () => void;
}

type CutsceneAct = 'anime_2d' | 'morph_2d_to_3d' | 'fusion_3d' | 'clone_awakening_3d';

interface ActMeta {
  badge: string;
  dimensionTag: string;
  subtitle: string;
}

const ACT_META: Record<CutsceneAct, ActMeta> = {
  anime_2d: {
    badge: 'BABAK I · ANIME 2D — RETAS DIMENSI RIFT WALKER',
    dimensionTag: '2D ANIME',
    subtitle: 'Rift Walker membelah kanvas realitas 2D untuk memanggil Hero Anomali...'
  },
  morph_2d_to_3d: {
    badge: 'BABAK II · TRANSISI 2D → 3D — REALITAS DATAR PECAH!',
    dimensionTag: '2D → 3D BREAK',
    subtitle: 'Lapisan anime 2D hancur berkeping-keping, membuka dimensi 3D sejati!'
  },
  fusion_3d: {
    badge: 'BABAK III · ANIME 3D — PENYERAPAN & KELAHIRAN CLONE',
    dimensionTag: '3D ANIME',
    subtitle: 'Hero Anomali menyerap Rift Walker dan menempa Clone Anomali bersenjata seluruh pasif!'
  },
  clone_awakening_3d: {
    badge: 'BABAK IV · ANIME 3D — KEBANGKITAN CLONE ANOMALI!',
    dimensionTag: '3D ANIME',
    subtitle: 'Hero Anomali & Rift Walker pergi ke portal, Clone Anomali siap bertempur!'
  }
};

const TOTAL_DURATION = 6.6;

interface ShardSpec {
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  spin: number;
  delay: number;
}

function createCelShards(): ShardSpec[] {
  const cols = 6;
  const rows = 4;
  const pts: Array<Array<[number, number]>> = [];
  for (let r = 0; r <= rows; r++) {
    const rowPts: Array<[number, number]> = [];
    for (let c = 0; c <= cols; c++) {
      const baseX = c / cols;
      const baseY = r / rows;
      const jx =
        c === 0 || c === cols ? 0 : Math.sin(r * 7.3 + c * 13.7) * 0.045;
      const jy =
        r === 0 || r === rows ? 0 : Math.cos(r * 11.1 + c * 5.9) * 0.055;
      rowPts.push([baseX + jx, baseY + jy]);
    }
    pts.push(rowPts);
  }

  const shards: ShardSpec[] = [];
  const pushTri = (p0: [number, number], p1: [number, number], p2: [number, number]) => {
    const cx = (p0[0] + p1[0] + p2[0]) / 3;
    const cy = (p0[1] + p1[1] + p2[1]) / 3;
    const dx = cx - 0.5;
    const dy = cy - 0.5;
    const dist = Math.hypot(dx, dy) || 0.01;
    const nx = dx / dist;
    const ny = dy / dist;
    const speed = 0.55 + (1 - Math.min(1, dist)) * 0.55 + Math.abs(Math.sin(cx * 31 + cy * 17)) * 0.35;
    shards.push({
      p0,
      p1,
      p2,
      cx,
      cy,
      vx: nx * speed,
      vy: ny * speed - 0.14,
      spin: ((cx - 0.5) * 2.4 + (cy - 0.5) * 1.5) * 2.1,
      delay: Math.min(0.28, dist * 0.36)
    });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = pts[r][c];
      const tr = pts[r][c + 1];
      const bl = pts[r + 1][c];
      const br = pts[r + 1][c + 1];
      if ((r + c) % 2 === 0) {
        pushTri(tl, tr, br);
        pushTri(tl, br, bl);
      } else {
        pushTri(tl, tr, bl);
        pushTri(tr, br, bl);
      }
    }
  }
  return shards;
}

const CEL_SHARDS = createCelShards();

// Zero-GC module-scoped math helpers for Three.js loop
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 1.7, 0);
const _tmpColor = new THREE.Color();

function drawAnime2DScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  webglFallback: boolean
) {
  ctx.save();
  const cx = w * 0.5;
  const cy = h * 0.5;
  const minDim = Math.min(w, h);
  const scale = minDim / 720;

  // 1. Flat 2D Cel Anime Backdrop
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#070518');
  skyGrad.addColorStop(0.55, '#190b36');
  skyGrad.addColorStop(1, '#091529');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle 2D anime horizon ground plane
  ctx.fillStyle = '#070d1f';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  for (let i = -8; i <= 8; i++) {
    ctx.moveTo(cx + i * 35 * scale, h * 0.72);
    ctx.lineTo(cx + i * 155 * scale, h);
  }
  ctx.stroke();

  // Radial anime speedlines
  const lineCount = 42;
  const speedSpin = t * 1.4;
  for (let i = 0; i < lineCount; i++) {
    const a = (i / lineCount) * Math.PI * 2 + speedSpin * 0.12;
    const innerR = minDim * (0.28 + (i % 3) * 0.05);
    const outerR = minDim * 0.92;
    ctx.strokeStyle =
      i % 3 === 0
        ? 'rgba(34, 211, 238, 0.36)'
        : i % 3 === 1
        ? 'rgba(232, 121, 249, 0.30)'
        : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = (i % 2 === 0 ? 2.8 : 1.4) * scale;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * innerR, cy * 0.92 + Math.sin(a) * innerR);
    ctx.lineTo(cx + Math.cos(a) * outerR, cy * 0.92 + Math.sin(a) * outerR);
    ctx.stroke();
  }

  // 2. Jagged 2D Dimensional Rift Tear in sky
  const riftProgress = Math.min(1, t / 1.15);
  const riftHalfW = (180 + Math.sin(t * 7) * 8) * riftProgress * scale;
  const riftHalfH = (26 + Math.cos(t * 9) * 4) * riftProgress * scale;
  const riftY = h * 0.31;

  ctx.save();
  ctx.translate(cx, riftY);
  const riftGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.max(10, riftHalfW));
  riftGrad.addColorStop(0, '#ffffff');
  riftGrad.addColorStop(0.32, '#f0abfc');
  riftGrad.addColorStop(0.68, '#06b6d4');
  riftGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = riftGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(1, riftHalfW * 1.15), Math.max(1, riftHalfH * 1.9), -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Sharp manga-ink zig-zag tear edge
  ctx.strokeStyle = '#05020d';
  ctx.lineWidth = 6 * scale;
  ctx.beginPath();
  ctx.moveTo(-riftHalfW, 0);
  ctx.lineTo(-riftHalfW * 0.45, -riftHalfH);
  ctx.lineTo(0, -riftHalfH * 0.45);
  ctx.lineTo(riftHalfW * 0.48, -riftHalfH * 1.1);
  ctx.lineTo(riftHalfW, 0);
  ctx.lineTo(riftHalfW * 0.42, riftHalfH);
  ctx.lineTo(0, riftHalfH * 0.5);
  ctx.lineTo(-riftHalfW * 0.48, riftHalfH * 0.9);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = '#e879f9';
  ctx.lineWidth = 2.6 * scale;
  ctx.stroke();
  ctx.restore();

  // 3. 2D Anime Hero Anomali silhouette descending from rift (0.7s -> 1.85s)
  const heroAppear = Math.max(0, Math.min(1, (t - 0.65) / 0.85));
  if (heroAppear > 0.01) {
    const hy = riftY + (1 - heroAppear) * -45 * scale + Math.sin(t * 4) * 5 * scale;
    ctx.save();
    ctx.translate(cx, hy);
    ctx.scale(scale * (0.75 + heroAppear * 0.25), scale * (0.75 + heroAppear * 0.25));
    ctx.globalAlpha = Math.min(1, heroAppear * 1.2);

    // 6 Flat 2D Anime Wings
    const wingCols = ['#fbbf24', '#e879f9', '#22d3ee'];
    for (const side of [-1, 1]) {
      for (let wi = 0; wi < 3; wi++) {
        ctx.save();
        ctx.rotate(side * (0.25 - wi * 0.34 + Math.sin(t * 5 + wi) * 0.05));
        ctx.fillStyle = wingCols[wi];
        ctx.strokeStyle = '#05020d';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(side * 24, -10 + wi * 14);
        ctx.lineTo(side * (165 - wi * 18), -52 + wi * 28);
        ctx.lineTo(side * (135 - wi * 16), -14 + wi * 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // Golden Crown Halo
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -86, 46, 12, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inked Silhouette Body + Horns
    ctx.fillStyle = '#2e1065';
    ctx.strokeStyle = '#05020d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -68);
    ctx.lineTo(-26, -32);
    ctx.lineTo(-42, 48);
    ctx.lineTo(42, 48);
    ctx.lineTo(26, -32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Horns
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.moveTo(side * 12, -62);
      ctx.lineTo(side * 34, -95);
      ctx.lineTo(side * 20, -52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing Anime Eyes
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-13, -52, 9, 4);
    ctx.fillRect(4, -52, 9, 4);

    // Fallback-mode absorption & Clone birth in 2D if WebGL is unavailable
    if (webglFallback && t >= 2.8) {
      const fP = Math.min(1, (t - 2.8) / 1.5);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(0, 175 * (1 - fP));
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Foreground 2D Cel-Shaded Anime Rift Walker (or Clone Anomali in WebGL fallback > 4.25s)
  const isFallbackClone = webglFallback && t >= 4.25;
  const rwScale = scale * 1.15;
  const lungeLift = Math.max(0, Math.min(1, (t - 1.25) / 0.55));
  const rwY = h * 0.72 - lungeLift * 22 * scale + Math.sin(t * 5.2) * 3 * scale;

  ctx.save();
  ctx.translate(cx, rwY);
  ctx.scale(rwScale, rwScale);

  // Ground cel shadow
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 62, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Billowing 2D Anime Scarf
  const scarfWave = Math.sin(t * 9) * 14;
  ctx.fillStyle = isFallbackClone ? '#67e8f9' : '#06b6d4';
  ctx.strokeStyle = '#05020d';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-18, -112);
  ctx.quadraticCurveTo(-85, -134 + scarfWave, -152, -96 - scarfWave * 0.6);
  ctx.lineTo(-132, -74 - scarfWave * 0.4);
  ctx.quadraticCurveTo(-72, -104 + scarfWave * 0.7, -14, -96);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cel highlight strip on scarf
  ctx.fillStyle = '#a5f3fc';
  ctx.beginPath();
  ctx.moveTo(-24, -109);
  ctx.quadraticCurveTo(-78, -124 + scarfWave, -134, -95 - scarfWave * 0.5);
  ctx.lineTo(-125, -88 - scarfWave * 0.5);
  ctx.quadraticCurveTo(-74, -113 + scarfWave, -22, -101);
  ctx.closePath();
  ctx.fill();

  // Legs & Tactical Coat (2-tone flat cel shading)
  ctx.fillStyle = isFallbackClone ? '#bae6fd' : '#0f172a';
  ctx.strokeStyle = '#05020d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-26, -80);
  ctx.lineTo(-42, 12);
  ctx.lineTo(-14, 12);
  ctx.lineTo(0, -34);
  ctx.lineTo(16, 12);
  ctx.lineTo(44, 12);
  ctx.lineTo(26, -80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Torso Armor
  ctx.fillStyle = isFallbackClone ? '#e0f2fe' : '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-34, -124);
  ctx.lineTo(34, -124);
  ctx.lineTo(24, -68);
  ctx.lineTo(-24, -68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Torso cel rim highlight
  ctx.fillStyle = isFallbackClone ? '#f0abfc' : '#22d3ee';
  ctx.beginPath();
  ctx.moveTo(0, -105);
  ctx.lineTo(12, -92);
  ctx.lineTo(0, -79);
  ctx.lineTo(-12, -92);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head + Spiky Anime Hair + Visor
  ctx.fillStyle = isFallbackClone ? '#f8fafc' : '#164e63';
  ctx.beginPath();
  ctx.moveTo(-24, -148);
  ctx.lineTo(-34, -168);
  ctx.lineTo(-14, -162);
  ctx.lineTo(0, -184);
  ctx.lineTo(15, -162);
  ctx.lineTo(35, -168);
  ctx.lineTo(24, -148);
  ctx.lineTo(18, -126);
  ctx.lineTo(-18, -126);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing Anime Visor Slit + Eye Flare
  ctx.fillStyle = isFallbackClone ? '#fde047' : '#67e8f9';
  ctx.fillRect(-16, -143, 32, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-10, -141, 20, 3);

  // Twin Raised Quantum Katanas
  const raiseAngle = lungeLift * 0.45;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 34, -106);
    ctx.rotate(side * (-0.52 - raiseAngle));
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#05020d';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-3, -118);
    ctx.lineTo(5, -134);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isFallbackClone ? '#f0abfc' : '#22d3ee';
    ctx.fillRect(-1, -115, 3, 110);
    ctx.restore();
  }
  ctx.restore();

  // 5. Dimensional Fissure Cracks forming across the 2D frame right before shatter (1.42s -> 1.85s)
  if (t >= 1.4) {
    const crackP = Math.min(1, (t - 1.4) / 0.45);
    ctx.save();
    ctx.translate(cx, cy);
    const rays = 9;
    for (let r = 0; r < rays; r++) {
      const baseA = (r / rays) * Math.PI * 2 + 0.25;
      const maxLen = minDim * 0.72 * crackP;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = (4.2 - (r % 2) * 1.4) * scale;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let seg = 1; seg <= 4; seg++) {
        const d = (seg / 4) * maxLen;
        const jag = Math.sin(r * 7 + seg * 11) * 26 * scale;
        ctx.lineTo(
          Math.cos(baseA) * d - Math.sin(baseA) * jag,
          Math.sin(baseA) * d + Math.cos(baseA) * jag
        );
      }
      ctx.stroke();
      ctx.strokeStyle = r % 2 === 0 ? '#22d3ee' : '#e879f9';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Manga ink frame corners & letterbox bars
  const barH = Math.round(h * 0.065);
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  ctx.restore();
}

export const AnomalyCutsceneModal: React.FC<AnomalyCutsceneModalProps> = ({
  isMuted,
  onComplete
}) => {
  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const anime2DCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const completedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  const isMutedRef = useRef(isMuted);

  const [act, setAct] = useState<CutsceneAct>('anime_2d');
  const [progress, setProgress] = useState<number>(0);
  const [impactFlash, setImpactFlash] = useState<boolean>(false);
  const [webglUnavailable, setWebglUnavailable] = useState<boolean>(false);

  onCompleteRef.current = onComplete;
  isMutedRef.current = isMuted;

  const finishCutscene = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        finishCutscene();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [finishCutscene]);

  useEffect(() => {
    const mount = threeMountRef.current;
    const canvas2D = anime2DCanvasRef.current;
    if (!mount || !canvas2D) return;

    // Offscreen snapshot buffer holds the exact 2D anime frame when 2D->3D shatter begins
    const snapCanvas = document.createElement('canvas');
    snapshotCanvasRef.current = snapCanvas;

    const resize2DCanvases = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas2D.width = Math.floor(w * dpr);
      canvas2D.height = Math.floor(h * dpr);
      canvas2D.style.width = `${w}px`;
      canvas2D.style.height = `${h}px`;
      const ctx2D = canvas2D.getContext('2d');
      if (ctx2D) ctx2D.setTransform(dpr, 0, 0, dpr, 0, 0);

      snapCanvas.width = Math.floor(w * dpr);
      snapCanvas.height = Math.floor(h * dpr);
    };
    resize2DCanvases();

    // Software WebGL probe (cost & frame pacing only; never changes scene objects/UI)
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
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let hasWebGL = false;
    const disposables: Array<{ dispose: () => void }> = [];
    let threeCanvas: HTMLCanvasElement | null = null;

    // Animated scene references (populated when WebGL succeeds)
    let skyUniforms: {
      uTime: { value: number };
      uImpact: { value: number };
      uFlash: { value: number };
      uPortalOpen: { value: number };
    } | null = null;
    let stageDisc: THREE.Mesh | null = null;
    let portalGroup: THREE.Group | null = null;
    let portalRings: THREE.Mesh[] = [];
    let riftWalkerRig: ReturnType<typeof buildAnimeRiftWalker3D> | null = null;
    let heroAnomaliRig: ReturnType<typeof buildAnimeHeroAnomali3D> | null = null;
    let cloneAnomaliRig: ReturnType<typeof buildAnimeCloneAnomali3D> | null = null;
    let absorbBeamGroup: THREE.Group | null = null;
    let absorbBeams: THREE.Mesh[] = [];
    let impactShockRing: THREE.Mesh | null = null;
    let impactShockMat: THREE.MeshBasicMaterial | null = null;
    let shardParticles: THREE.Points | null = null;
    let shardGeo: THREE.BufferGeometry | null = null;
    let shardCount = 260;
    let shardBaseVel: Float32Array | null = null;
    let auraPointLight: THREE.PointLight | null = null;

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

    try {
      threeCanvas = document.createElement('canvas');
      threeCanvas.style.display = 'block';
      threeCanvas.style.width = '100%';
      threeCanvas.style.height = '100%';
      mount.innerHTML = '';
      mount.appendChild(threeCanvas);

      const handleContextLost = (ev: Event) => {
        ev.preventDefault();
        hasWebGL = false;
        setWebglUnavailable(true);
      };
      threeCanvas.addEventListener('webglcontextlost', handleContextLost);

      renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setSize(window.innerWidth, Math.max(1, window.innerHeight), false);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060414);
      scene.fog = new THREE.FogExp2(0x10082a, 0.015);

      camera = new THREE.PerspectiveCamera(
        48,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        240
      );
      camera.position.set(0, 2.0, 6.2);
      _currentLook.set(0, 1.5, 0);
      camera.lookAt(_currentLook);

      // Mandatory RoomEnvironment for metallic accents
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      trackTex(envRT.texture);
      envRT.dispose();
      pmrem.dispose();

      // Warm/Cool 3-Point Anime Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xa5f3fc, 0x3b0764, 0.9);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfef9c3, 2.5);
      keyLight.position.set(10, 18, 12);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -16;
      keyLight.shadow.camera.right = 16;
      keyLight.shadow.camera.top = 16;
      keyLight.shadow.camera.bottom = -16;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 50;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const magentaRimLight = new THREE.DirectionalLight(0xe879f9, 2.3);
      magentaRimLight.position.set(-11, 9, -14);
      scene.add(magentaRimLight);

      auraPointLight = new THREE.PointLight(0x22d3ee, 4.0, 34, 1.5);
      auraPointLight.position.set(0, 2.8, 1.6);
      scene.add(auraPointLight);

      // Quantized 4-band anime cel-shading DataTexture + Inverted-hull ink outline
      const toonSteps = new Uint8Array([42, 114, 196, 255]);
      const toonGradTex = trackTex(new THREE.DataTexture(toonSteps, 4, 1, THREE.RedFormat));
      toonGradTex.minFilter = THREE.NearestFilter;
      toonGradTex.magFilter = THREE.NearestFilter;
      toonGradTex.needsUpdate = true;

      const inkOutlineMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x05020d,
          side: THREE.BackSide
        })
      );
      const palette = { toonGradTex, inkOutlineMat };

      // Custom GLSL Anime Prismatic Dimensional Sky Dome
      skyUniforms = {
        uTime: { value: 0 },
        uImpact: { value: 0 },
        uFlash: { value: 0 },
        uPortalOpen: { value: 1 }
      };
      const skyMat = trackMat(
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: skyUniforms,
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
            uniform float uImpact;
            uniform float uFlash;
            uniform float uPortalOpen;
            varying vec3 vWorldPos;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                u.y
              );
            }

            void main() {
              vec3 dir = normalize(vWorldPos);
              float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
              float ang = atan(dir.x, dir.z);

              vec3 voidBase = vec3(0.03, 0.02, 0.09);
              vec3 indigoMid = vec3(0.11, 0.05, 0.27);
              vec3 cyanHorizon = vec3(0.04, 0.20, 0.34);

              vec3 col = mix(voidBase, cyanHorizon, smoothstep(0.32, 0.56, h));
              col = mix(col, indigoMid, smoothstep(0.56, 0.92, h));

              // Swirling dimensional rift aurora streaks
              float swirl = noise(vec2(ang * 3.0 + uTime * 0.28, dir.y * 6.0 - uTime * 0.22));
              float band = smoothstep(0.55, 0.85, swirl);
              col += vec3(0.12, 0.72, 0.92) * band * 0.28 * uPortalOpen;
              col += vec3(0.85, 0.32, 0.95) * smoothstep(0.68, 0.95, swirl) * 0.32 * uPortalOpen;

              // Manga speedline streaks on sky horizon
              float rays = pow(abs(sin(ang * 24.0 + uTime * 0.6)), 10.0);
              col += vec3(0.25, 0.85, 0.95) * rays * (1.0 - abs(dir.y)) * 0.22;

              // Anime B/W sakuga impact frame inversion
              if (uImpact > 0.01) {
                float lum = dot(col, vec3(0.299, 0.587, 0.114));
                vec3 bw = vec3(step(0.16, lum));
                col = mix(col, 1.0 - bw, clamp(uImpact, 0.0, 1.0));
              }
              col = mix(col, vec3(1.0), clamp(uFlash, 0.0, 1.0));

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      scene.add(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(120, 32, 20)), skyMat));

      // Ground Mandala Stage + Contact Shadow Disc
      const stageTex = trackTex(createAnomalyStageTexture(renderer));
      const stageGeo = trackGeo(new THREE.CylinderGeometry(8.5, 9.2, 0.5, 48));
      const stageMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: stageTex,
          roughness: 0.48,
          metalness: 0.32,
          emissive: 0x0e7490,
          emissiveIntensity: 0.22
        })
      );
      stageDisc = new THREE.Mesh(stageGeo, stageMat);
      stageDisc.position.y = -0.25;
      stageDisc.receiveShadow = true;
      scene.add(stageDisc);

      // Outer floating crystal shards circling arena
      const crystalGeo = trackGeo(new THREE.OctahedronGeometry(0.45, 0));
      const crystalMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.38,
          gradientMap: toonGradTex
        })
      );
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(Math.cos(a) * 10.2, 1.2 + (i % 3) * 0.9, Math.sin(a) * 10.2);
        crystal.scale.set(0.7, 2.0 + (i % 2) * 0.8, 0.7);
        crystal.rotation.set(0.2 * (i % 3), a, 0.15);
        scene.add(crystal);
      }

      // Swirling 3D Overhead Anomaly Portal
      portalGroup = new THREE.Group();
      portalGroup.position.set(0, 6.4, -1.6);
      const ringSpecs = [
        { r: 2.8, tube: 0.09, color: 0xe879f9 },
        { r: 2.15, tube: 0.08, color: 0x22d3ee },
        { r: 1.45, tube: 0.07, color: 0xfbbf24 }
      ];
      portalRings = [];
      for (const spec of ringSpecs) {
        const rMesh = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(spec.r, spec.tube, 10, 48)),
          trackMat(new THREE.MeshBasicMaterial({ color: spec.color }))
        );
        rMesh.rotation.x = Math.PI * 0.42;
        portalGroup.add(rMesh);
        portalRings.push(rMesh);
      }
      const portalCore = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(1.35, 32)),
        trackMat(
          new THREE.MeshBasicMaterial({
            color: 0xf0abfc,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide
          })
        )
      );
      portalCore.rotation.x = Math.PI * 0.42;
      portalGroup.add(portalCore);
      scene.add(portalGroup);

      // 3D Cel-Shaded Anime Characters
      riftWalkerRig = buildAnimeRiftWalker3D(palette, trackGeo, trackMat);
      scene.add(riftWalkerRig.root);

      heroAnomaliRig = buildAnimeHeroAnomali3D(palette, trackGeo, trackMat);
      heroAnomaliRig.root.position.set(0, 3.6, -1.5);
      heroAnomaliRig.root.scale.setScalar(1.22);
      scene.add(heroAnomaliRig.root);

      cloneAnomaliRig = buildAnimeCloneAnomali3D(palette, trackGeo, trackMat);
      cloneAnomaliRig.root.position.set(0, 2.4, 0.2);
      cloneAnomaliRig.root.visible = false;
      scene.add(cloneAnomaliRig.root);

      // Absorption Tether Beams (3 curved glowing cylinders connecting Rift Walker -> Hero Anomali)
      absorbBeamGroup = new THREE.Group();
      absorbBeamGroup.visible = false;
      absorbBeams = [];
      const beamColors = [0x22d3ee, 0xe879f9, 0xfbbf24];
      for (let i = 0; i < 3; i++) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 1.2, 0.2),
          new THREE.Vector3((i - 1) * 0.9, 2.6, -0.4),
          new THREE.Vector3(0, 4.6, -1.3)
        ]);
        const bMesh = new THREE.Mesh(
          trackGeo(new THREE.TubeGeometry(curve, 20, 0.065 - i * 0.012, 8, false)),
          trackMat(
            new THREE.MeshBasicMaterial({
              color: beamColors[i],
              transparent: true,
              opacity: 0.92
            })
          )
        );
        absorbBeamGroup.add(bMesh);
        absorbBeams.push(bMesh);
      }
      scene.add(absorbBeamGroup);

      // Genesis Expanding Torus Shockwave
      impactShockMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf0abfc,
          transparent: true,
          opacity: 0
        })
      );
      impactShockRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.0, 0.09, 10, 48)),
        impactShockMat
      );
      impactShockRing.rotation.x = Math.PI * 0.5;
      impactShockRing.position.set(0, 0.35, 0);
      scene.add(impactShockRing);

      // Prismatic Energy Shards Particle Burst
      const shardPos = new Float32Array(shardCount * 3);
      const shardCol = new Float32Array(shardCount * 3);
      shardBaseVel = new Float32Array(shardCount * 3);
      for (let i = 0; i < shardCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.6 + Math.random() * 6.8;
        shardPos[i * 3] = Math.cos(a) * r;
        shardPos[i * 3 + 1] = 0.2 + Math.random() * 5.8;
        shardPos[i * 3 + 2] = Math.sin(a) * r;
        shardBaseVel[i * 3] = (Math.random() - 0.5) * 1.4;
        shardBaseVel[i * 3 + 1] = 0.6 + Math.random() * 1.8;
        shardBaseVel[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
        _tmpColor.setHex(i % 3 === 0 ? 0x22d3ee : i % 3 === 1 ? 0xe879f9 : 0xfbbf24);
        shardCol[i * 3] = _tmpColor.r;
        shardCol[i * 3 + 1] = _tmpColor.g;
        shardCol[i * 3 + 2] = _tmpColor.b;
      }
      shardGeo = trackGeo(new THREE.BufferGeometry());
      shardGeo.setAttribute('position', new THREE.BufferAttribute(shardPos, 3));
      shardGeo.setAttribute('color', new THREE.BufferAttribute(shardCol, 3));
      const shardMat = trackMat(
        new THREE.PointsMaterial({
          size: 0.19,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      shardParticles = new THREE.Points(shardGeo, shardMat);
      scene.add(shardParticles);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }
      hasWebGL = true;
    } catch {
      hasWebGL = false;
      setWebglUnavailable(true);
    }

    const handleResize = () => {
      resize2DCanvases();
      if (renderer && camera) {
        const w = window.innerWidth;
        const h = Math.max(1, window.innerHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    };
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let isDisposed = false;
    const startTime = performance.now();
    let lastTime = startTime;
    let currentAct: CutsceneAct = 'anime_2d';
    let snapshotTaken = false;
    let playedSfx0 = false;
    let playedSfx1 = false;
    let playedSfx2 = false;
    let playedSfx3 = false;

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
      if (isDisposed) return;

      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      const elapsed = Math.min(TOTAL_DURATION, (now - startTime) / 1000);
      lastTime = now;

      // Audio cues at act beats
      if (!isMutedRef.current) {
        if (!playedSfx0 && elapsed >= 0.05) {
          playedSfx0 = true;
          sounds.playSkill('void');
        }
        if (!playedSfx1 && elapsed >= 1.85) {
          playedSfx1 = true;
          sounds.playTimeStop();
        }
        if (!playedSfx2 && elapsed >= 3.05) {
          playedSfx2 = true;
          sounds.playSkill('temporal');
        }
        if (!playedSfx3 && elapsed >= 4.25) {
          playedSfx3 = true;
          sounds.playExplosion();
          sounds.playLevelUp();
        }
      }

      // Act state transitions
      let nextAct: CutsceneAct = 'anime_2d';
      if (elapsed >= 5.15) nextAct = 'clone_awakening_3d';
      else if (elapsed >= 3.05) nextAct = 'fusion_3d';
      else if (elapsed >= 1.85) nextAct = 'morph_2d_to_3d';

      if (nextAct !== currentAct) {
        currentAct = nextAct;
        setAct(nextAct);
      }
      setProgress(Math.min(100, (elapsed / TOTAL_DURATION) * 100));

      const flashActive =
        (elapsed >= 1.85 && elapsed <= 2.0) ||
        (elapsed >= 4.22 && elapsed <= 4.4);
      setImpactFlash(flashActive);

      // 1. Render 2D Anime Layer / 2D-to-3D Shatter Layer
      const ctx2D = canvas2D.getContext('2d');
      if (ctx2D) {
        const w = window.innerWidth;
        const h = Math.max(1, window.innerHeight);

        if (!hasWebGL) {
          // Pure 2D Anime fallback across all 4 acts
          ctx2D.clearRect(0, 0, w, h);
          drawAnime2DScene(ctx2D, w, h, elapsed, true);
        } else if (elapsed < 1.85) {
          // Pure 2D Cel Anime Phase
          ctx2D.clearRect(0, 0, w, h);
          drawAnime2DScene(ctx2D, w, h, elapsed, false);
        } else if (elapsed < 3.05) {
          // Capture final 2D frame once, then shatter it into 48 spinning cel shards!
          if (!snapshotTaken) {
            snapshotTaken = true;
            const snapCtx = snapCanvas.getContext('2d');
            if (snapCtx) {
              const dpr = snapCanvas.width / Math.max(1, w);
              snapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
              drawAnime2DScene(snapCtx, w, h, 1.85, false);
            }
          }

          ctx2D.clearRect(0, 0, w, h);
          const breakP = (elapsed - 1.85) / 1.2;

          for (let i = 0; i < CEL_SHARDS.length; i++) {
            const s = CEL_SHARDS[i];
            const localP = Math.max(0, Math.min(1, (breakP - s.delay) / (1 - s.delay)));
            if (localP >= 0.98) continue;

            const ease = localP * localP;
            const ox = s.vx * ease * w * 0.72;
            const oy = s.vy * ease * h * 0.72;
            const rot = s.spin * ease;
            const sc = Math.max(0.05, 1 - ease * 0.65);

            ctx2D.save();
            ctx2D.globalAlpha = Math.max(0, 1 - ease * 1.12);
            const px = s.cx * w;
            const py = s.cy * h;
            ctx2D.translate(px + ox, py + oy);
            ctx2D.rotate(rot);
            ctx2D.scale(sc, sc);
            ctx2D.translate(-px, -py);

            ctx2D.beginPath();
            ctx2D.moveTo(s.p0[0] * w, s.p0[1] * h);
            ctx2D.lineTo(s.p1[0] * w, s.p1[1] * h);
            ctx2D.lineTo(s.p2[0] * w, s.p2[1] * h);
            ctx2D.closePath();

            ctx2D.save();
            ctx2D.clip();
            ctx2D.drawImage(snapCanvas, 0, 0, w, h);
            ctx2D.restore();

            // Glowing fracture edge around each peeling 2D cel shard
            ctx2D.strokeStyle = i % 2 === 0 ? '#22d3ee' : '#e879f9';
            ctx2D.lineWidth = 2.4;
            ctx2D.stroke();
            ctx2D.restore();
          }
        } else {
          // 100% clear once 2D->3D transition completes
          ctx2D.clearRect(0, 0, w, h);
        }
      }

      // 2. Render 3D Cel-Shaded Anime Scene (when WebGL active)
      if (hasWebGL && renderer && scene && camera && skyUniforms) {
        skyUniforms.uTime.value = elapsed;
        const impactVal =
          elapsed >= 1.85 && elapsed < 2.02
            ? 1 - (elapsed - 1.85) / 0.17
            : elapsed >= 4.22 && elapsed < 4.42
            ? 1 - (elapsed - 4.22) / 0.2
            : 0;
        skyUniforms.uImpact.value = Math.max(0, impactVal);
        skyUniforms.uFlash.value =
          elapsed >= 4.22 && elapsed < 4.46
            ? Math.sin(((elapsed - 4.22) / 0.24) * Math.PI) * 0.72
            : 0;

        if (stageDisc) stageDisc.rotation.y = elapsed * 0.18;

        // Portal rings spin & shrink during final departure
        if (portalGroup) {
          const portalScale =
            elapsed < 5.3
              ? 1
              : Math.max(0.05, 1 - Math.max(0, (elapsed - 5.85) / 0.7) * 0.92);
          portalGroup.scale.setScalar(portalScale);
          skyUniforms.uPortalOpen.value = portalScale;
          portalRings.forEach((ring, idx) => {
            ring.rotation.z = elapsed * (idx % 2 === 0 ? 1.5 : -1.9);
          });
        }

        // Animate 3D Rift Walker (stands -> pulled up into Hero Anomali -> absorbed at 4.25s)
        if (riftWalkerRig) {
          const rwVisible = elapsed < 4.26;
          riftWalkerRig.root.visible = rwVisible;
          if (rwVisible) {
            if (elapsed < 3.05) {
              const readyLift = Math.max(0, (elapsed - 1.85) / 1.2);
              riftWalkerRig.root.position.set(0, 0.05 + readyLift * 0.25, 0.35);
              riftWalkerRig.root.scale.setScalar(1);
              riftWalkerRig.leftArm.rotation.x = -0.35 - readyLift * 0.65;
              riftWalkerRig.rightArm.rotation.x = -0.35 - readyLift * 0.65;
            } else {
              // Pulled upward toward Hero Anomali chest core!
              const absorbP = Math.min(1, (elapsed - 3.05) / 1.2);
              const easeAbsorb = absorbP * absorbP;
              riftWalkerRig.root.position.set(
                Math.sin(elapsed * 14) * 0.12 * (1 - absorbP),
                0.3 + easeAbsorb * 3.8,
                0.35 - easeAbsorb * 1.45
              );
              riftWalkerRig.root.rotation.y = absorbP * Math.PI * 3.5;
              riftWalkerRig.root.scale.setScalar(Math.max(0.04, 1 - easeAbsorb * 0.92));
            }
            riftWalkerRig.scarfSegments.forEach((seg, idx) => {
              seg.position.y = 1.58 - idx * 0.08 + Math.sin(elapsed * 10 + idx) * 0.05;
              seg.rotation.x = Math.sin(elapsed * 9 + idx * 0.9) * 0.22;
            });
          }
        }

        // Animate 3D Hero Anomali (looms -> absorbs -> glows cyan chest core -> ascends into portal)
        if (heroAnomaliRig) {
          if (elapsed < 5.15) {
            heroAnomaliRig.root.visible = true;
            heroAnomaliRig.root.position.set(0, 3.35 + Math.sin(elapsed * 3.1) * 0.14, -1.35);
            heroAnomaliRig.root.scale.setScalar(1.22);
          } else {
            const departP = Math.min(1, (elapsed - 5.15) / 1.05);
            const easeDepart = departP * departP;
            heroAnomaliRig.root.position.set(0, 3.35 + easeDepart * 4.4, -1.35 - easeDepart * 0.4);
            heroAnomaliRig.root.scale.setScalar(Math.max(0.02, 1.22 * (1 - easeDepart * 0.96)));
            heroAnomaliRig.root.visible = departP < 0.96;
          }

          // Chest core switches bright cyan once Rift Walker is absorbed
          if (elapsed >= 4.25) {
            heroAnomaliRig.chestCoreMat.color.setHex(0x22d3ee);
            heroAnomaliRig.chestCore.scale.setScalar(1.45 + Math.sin(elapsed * 14) * 0.18);
          } else {
            heroAnomaliRig.chestCoreMat.color.setHex(0xe879f9);
            heroAnomaliRig.chestCore.scale.setScalar(1.0 + Math.sin(elapsed * 8) * 0.1);
          }

          heroAnomaliRig.crownHalo.rotation.y = elapsed * 1.4;
          heroAnomaliRig.leftWings.forEach((w, idx) => {
            w.rotation.y = -0.22 + Math.sin(elapsed * 5.8 + idx * 0.5) * 0.24;
          });
          heroAnomaliRig.rightWings.forEach((w, idx) => {
            w.rotation.y = 0.22 - Math.sin(elapsed * 5.8 + idx * 0.5) * 0.24;
          });
          heroAnomaliRig.fusionOrbs.forEach((orb, idx) => {
            const a = elapsed * 1.9 + (idx / heroAnomaliRig.fusionOrbs.length) * Math.PI * 2;
            orb.position.set(Math.cos(a) * 1.75, 1.7 + Math.sin(elapsed * 3 + idx) * 0.28, Math.sin(a) * 1.75);
          });
        }

        // Absorption beams active during Act III (3.05 -> 4.25)
        if (absorbBeamGroup) {
          absorbBeamGroup.visible = elapsed >= 3.05 && elapsed < 4.26;
          if (absorbBeamGroup.visible) {
            absorbBeamGroup.rotation.y = elapsed * 5.2;
            absorbBeams.forEach((b, idx) => {
              b.scale.x = 1 + Math.sin(elapsed * 18 + idx) * 0.28;
            });
          }
        }

        // Impact shockwave ring at 4.25s
        if (impactShockRing && impactShockMat) {
          if (elapsed >= 4.24 && elapsed < 5.3) {
            const sP = (elapsed - 4.24) / 1.06;
            impactShockRing.visible = true;
            impactShockRing.scale.setScalar(0.5 + sP * 11.5);
            impactShockMat.opacity = Math.max(0, (1 - sP) * 0.92);
          } else {
            impactShockRing.visible = false;
          }
        }

        // Animate 3D Clone Anomali (born at 4.25s, lands into heroic katana pose!)
        if (cloneAnomaliRig) {
          const cloneBorn = elapsed >= 4.24;
          cloneAnomaliRig.root.visible = cloneBorn;
          if (cloneBorn) {
            const birthP = Math.min(1, (elapsed - 4.24) / 0.72);
            const dropY = (1 - birthP * birthP) * 2.85;
            cloneAnomaliRig.root.position.set(0, dropY, 0.35);
            cloneAnomaliRig.root.scale.setScalar(0.6 + birthP * 0.48);
            cloneAnomaliRig.backHalo.rotation.z = elapsed * 2.1;
            cloneAnomaliRig.leftArm.rotation.x = -0.75 + Math.sin(elapsed * 4) * 0.08;
            cloneAnomaliRig.rightArm.rotation.x = -0.35 - Math.sin(elapsed * 4) * 0.08;
            cloneAnomaliRig.scarfSegments.forEach((seg, idx) => {
              seg.position.y = 1.58 - idx * 0.08 + Math.sin(elapsed * 11 + idx) * 0.06;
            });
          }
        }

        // Floating prism shard particles
        if (shardParticles && shardGeo && shardBaseVel) {
          const posAttr = shardGeo.attributes.position as THREE.BufferAttribute;
          const arr = posAttr.array as Float32Array;
          const speedBoost = elapsed >= 3.05 && elapsed < 4.5 ? 2.4 : 1.0;
          for (let i = 0; i < shardCount; i++) {
            arr[i * 3] += shardBaseVel[i * 3] * dt * speedBoost;
            arr[i * 3 + 1] += shardBaseVel[i * 3 + 1] * dt * speedBoost;
            arr[i * 3 + 2] += shardBaseVel[i * 3 + 2] * dt * speedBoost;
            if (arr[i * 3 + 1] > 7.5) {
              arr[i * 3 + 1] = 0.2;
              const a = Math.random() * Math.PI * 2;
              const r = 0.6 + Math.random() * 6.4;
              arr[i * 3] = Math.cos(a) * r;
              arr[i * 3 + 2] = Math.sin(a) * r;
            }
          }
          posAttr.needsUpdate = true;
        }

        // Aura PointLight color shift
        if (auraPointLight) {
          auraPointLight.color.setHex(elapsed >= 4.25 ? 0x67e8f9 : elapsed >= 3.05 ? 0xe879f9 : 0x22d3ee);
          auraPointLight.intensity = elapsed >= 4.2 && elapsed < 4.5 ? 8.5 : 4.2;
        }

        // Smooth Exponential Camera Choreography (starts front-aligned with 2D frame, then sweeps 3D!)
        if (elapsed < 1.85) {
          _camTarget.set(0, 2.0, 6.2);
          _lookTarget.set(0, 1.5, 0);
        } else if (elapsed < 3.05) {
          const p = (elapsed - 1.85) / 1.2;
          _camTarget.set(Math.sin(p * 1.1) * 4.4, 2.1 + p * 1.4, 6.2 - p * 0.4);
          _lookTarget.set(0, 1.85 + p * 0.5, -0.3);
        } else if (elapsed < 5.15) {
          const p = (elapsed - 3.05) / 2.1;
          const orbit = 1.1 + p * 1.55;
          _camTarget.set(Math.sin(orbit) * 6.4, 2.6 + Math.sin(p * Math.PI) * 1.3, Math.cos(orbit) * 6.4);
          _lookTarget.set(0, 2.6 - (elapsed >= 4.25 ? 0.7 : 0), -0.4);
        } else {
          const p = (elapsed - 5.15) / 1.45;
          const orbit = 2.65 + p * 1.1;
          _camTarget.set(Math.sin(orbit) * 4.9, 1.45 + p * 0.55, Math.cos(orbit) * 4.9);
          _lookTarget.set(0, 1.45, 0.2);
        }

        const dampAlpha = 1 - Math.exp(-5.4 * dt);
        camera.position.lerp(_camTarget, dampAlpha);
        _currentLook.lerp(_lookTarget, dampAlpha);
        camera.lookAt(_currentLook);

        renderer.render(scene, camera);
      }

      if (elapsed >= TOTAL_DURATION) {
        finishCutscene();
        return;
      }

      if (hasWebGL && isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      for (const item of disposables) {
        try {
          item.dispose();
        } catch {
          // ignore disposal errors
        }
      }
      renderer?.dispose();
      threeCanvas?.remove();
    };
  }, [finishCutscene]);

  const meta = ACT_META[act];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene Anomaly Fusion Portal 2D ke 3D Anime"
    >
      {/* Layer 1 (Bottom): Live Three.js 3D Cel-Shaded Anime Scene */}
      <div
        ref={threeMountRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      />

      {/* Layer 2 (Middle): High-DPI 2D Anime Canvas + 2D-to-3D Shatter Transition */}
      <canvas
        ref={anime2DCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 block"
      />

      {/* High-contrast Anime Sakuga Impact Flash */}
      {impactFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[15] bg-white/45"
        />
      )}

      {/* Top-Left Title & Dimension Transition Indicator (No backdrop-blur over WebGL, no pulsating dots) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-5 sm:p-8 flex items-start justify-between">
        <div className="max-w-xl rounded-xl border border-cyan-400/35 bg-slate-950/85 px-4 py-3 shadow-xl">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-game font-bold tracking-wider uppercase bg-fuchsia-950/90 border border-fuchsia-400/50 text-fuchsia-200">
              <Layers className="w-3.5 h-3.5 text-cyan-300" />
              {webglUnavailable ? '2D ANIME' : meta.dimensionTag}
            </span>
            <p className="text-[11px] font-game tracking-[0.18em] uppercase text-cyan-300">
              {meta.badge}
            </p>
          </div>
          <h2 className="font-title text-lg sm:text-2xl font-black tracking-wider text-white">
            ANOMALY FUSION PORTAL
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-200 font-game">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Dock: Progress & Skip Button (No backdrop-filter over WebGL) */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-8 flex items-end justify-between gap-4 pointer-events-none">
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-950/85 border border-slate-700/80 px-3 py-2 text-[11px] font-game text-slate-300 tracking-wide">
          <span className={act === 'anime_2d' ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
            1. 2D Anime
          </span>
          <span className="text-slate-600">→</span>
          <span className={act === 'morph_2d_to_3d' ? 'text-fuchsia-300 font-bold' : 'text-slate-400'}>
            2. Shatter 2D→3D
          </span>
          <span className="text-slate-600">→</span>
          <span className={act === 'fusion_3d' || act === 'clone_awakening_3d' ? 'text-amber-300 font-bold' : 'text-slate-400'}>
            3. 3D Anime Fusion
          </span>
        </div>

        <button
          onClick={finishCutscene}
          className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-fuchsia-400/60 hover:border-cyan-300 text-slate-100 font-game font-semibold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shadow-lg"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-cyan-300" />
        </button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-1.5 bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
