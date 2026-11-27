import React, { useEffect, useRef, useState } from 'react';
import { FastForward } from 'lucide-react';

interface MorphosChimera2DAnimeCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  onSkip: () => void;
}

type CutsceneAct = 'awakening' | 'convergence' | 'impact' | 'apex_roar';

const ACT_META: Record<
  CutsceneAct,
  { kicker: string; subtitle: string }
> = {
  awakening: {
    kicker: 'Babak I · Kebangkitan Tiga Roh Purba',
    subtitle: 'Roh Razor Wolf, Titan Behemoth, dan Astral Wyvern terbangun di kanvas dimensi.'
  },
  convergence: {
    kicker: 'Babak II · Konvergensi Heliks DNA',
    subtitle: 'Ketiga wujud purba berputar menyatu ke dalam inti tubuh Morphos!'
  },
  impact: {
    kicker: 'Babak III · Omega Metamorfosis',
    subtitle: 'Ledakan evolusi memecah batas realitas untuk menempa wujud puncak!'
  },
  apex_roar: {
    kicker: 'Babak IV · Apex Chimera Bangkit',
    subtitle: 'Tri-Wujud sempurna bersatu — 6/6 Evolution Stack aktif penuh!'
  }
};

function drawSpeedlines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  minDim: number,
  t: number,
  intensity: number,
  colorA: string,
  colorB: string
) {
  const count = 48;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + t * 0.32;
    const inner = minDim * (0.24 + ((i * 7) % 5) * 0.035);
    const outer = minDim * 0.95;
    ctx.strokeStyle = i % 3 === 0 ? colorA : i % 3 === 1 ? colorB : 'rgba(255,255,255,0.22)';
    ctx.globalAlpha = intensity * (i % 2 === 0 ? 0.55 : 0.28);
    ctx.lineWidth = (i % 4 === 0 ? 3.2 : 1.4) * (minDim / 720);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawWolfSpirit2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  t: number,
  alpha: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Cel aura behind wolf head
  ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0, Math.PI * 2);
  ctx.fill();

  // Sharp anime wolf ears & mane
  ctx.fillStyle = '#064e3b';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-46, -12);
  ctx.lineTo(-56, -72);
  ctx.lineTo(-16, -34);
  ctx.lineTo(0, -52);
  ctx.lineTo(16, -34);
  ctx.lineTo(56, -72);
  ctx.lineTo(46, -12);
  ctx.lineTo(62, 16);
  ctx.lineTo(28, 36);
  ctx.lineTo(0, 56);
  ctx.lineTo(-28, 36);
  ctx.lineTo(-62, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cel-shaded emerald highlight snout
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(-28, -10);
  ctx.lineTo(0, -28);
  ctx.lineTo(28, -10);
  ctx.lineTo(16, 36);
  ctx.lineTo(0, 48);
  ctx.lineTo(-16, 36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing emerald anime eyes
  ctx.fillStyle = '#a7f3d0';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 10, -8);
    ctx.lineTo(side * 30, -18);
    ctx.lineTo(side * 24, -2);
    ctx.closePath();
    ctx.fill();
  }

  // Claw slash arcs
  const slashShift = Math.sin(t * 8) * 4;
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-58, i * 16 + slashShift);
    ctx.quadraticCurveTo(0, i * 16 + 26, 58, i * 16 - 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBehemothSpirit2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  t: number,
  alpha: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
  ctx.beginPath();
  ctx.arc(0, 0, 76, 0, Math.PI * 2);
  ctx.fill();

  // Massive horned silhouette
  ctx.fillStyle = '#451a03';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(-64, 34);
  ctx.lineTo(-56, -24);
  ctx.lineTo(-28, -42);
  ctx.lineTo(28, -42);
  ctx.lineTo(56, -24);
  ctx.lineTo(64, 34);
  ctx.lineTo(36, 52);
  ctx.lineTo(-36, 52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Curved titan horns
  ctx.fillStyle = '#f59e0b';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 22, -32);
    ctx.quadraticCurveTo(side * 72, -52, side * 54, -84);
    ctx.quadraticCurveTo(side * 42, -54, side * 12, -38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Armored brow + amber visor eyes
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(-30, -14);
  ctx.lineTo(30, -14);
  ctx.lineTo(22, 24);
  ctx.lineTo(-22, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const pulse = 0.8 + Math.sin(t * 9) * 0.2;
  ctx.fillStyle = '#fef08a';
  ctx.globalAlpha = alpha * pulse;
  ctx.fillRect(-20, -4, 14, 7);
  ctx.fillRect(6, -4, 14, 7);

  ctx.restore();
}

function drawWyvernSpirit2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  t: number,
  alpha: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.beginPath();
  ctx.arc(0, 0, 76, 0, Math.PI * 2);
  ctx.fill();

  // Flapping cel dragon wings
  const flap = Math.sin(t * 7.5) * 0.14;
  ctx.fillStyle = '#0c4a6e';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3.8;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * flap);
    ctx.beginPath();
    ctx.moveTo(side * 14, 0);
    ctx.lineTo(side * 82, -56);
    ctx.lineTo(side * 68, -6);
    ctx.lineTo(side * 54, 24);
    ctx.lineTo(side * 16, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Dragon crest & angular snout
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, -54);
  ctx.lineTo(24, -18);
  ctx.lineTo(14, 48);
  ctx.lineTo(0, 62);
  ctx.lineTo(-14, 48);
  ctx.lineTo(-24, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Astral violet crest ridge
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.moveTo(0, -64);
  ctx.lineTo(10, -24);
  ctx.lineTo(0, 12);
  ctx.lineTo(-10, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Slit dragon eyes
  ctx.fillStyle = '#f0abfc';
  ctx.fillRect(-14, -12, 9, 4);
  ctx.fillRect(5, -12, 9, 4);

  ctx.restore();
}

function drawMorphosBaseForm2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  t: number
) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(scale, scale);

  // Ground shadow
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 68, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Billowing wild mutagen cape
  const wave = Math.sin(t * 8.5) * 16;
  ctx.fillStyle = '#064e3b';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-26, -126);
  ctx.quadraticCurveTo(-78, -68 + wave, -92, 12);
  ctx.lineTo(-28, -4);
  ctx.lineTo(28, -4);
  ctx.lineTo(92, 12);
  ctx.quadraticCurveTo(78, -68 - wave, 26, -126);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Primal armored silhouette
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-36, -128);
  ctx.lineTo(36, -128);
  ctx.lineTo(26, -64);
  ctx.lineTo(38, 12);
  ctx.lineTo(10, 12);
  ctx.lineTo(0, -34);
  ctx.lineTo(-10, 12);
  ctx.lineTo(-38, 12);
  ctx.lineTo(-26, -64);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Emerald bio-core chest
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(0, -112);
  ctx.lineTo(15, -94);
  ctx.lineTo(0, -76);
  ctx.lineTo(-15, -94);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head + jagged primal hair + glowing emerald eyes
  ctx.fillStyle = '#022c22';
  ctx.beginPath();
  ctx.moveTo(-22, -148);
  ctx.lineTo(-36, -172);
  ctx.lineTo(-14, -162);
  ctx.lineTo(0, -186);
  ctx.lineTo(14, -162);
  ctx.lineTo(36, -172);
  ctx.lineTo(22, -148);
  ctx.lineTo(16, -128);
  ctx.lineTo(-16, -128);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(-13, -144, 10, 5);
  ctx.fillRect(3, -144, 10, 5);

  ctx.restore();
}

function drawApexChimera2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  t: number
) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(scale, scale);

  // Towering Astral Wyvern Wings (2 pairs, cel-shaded with crisp ink ribs)
  const wingFlap = Math.sin(t * 6.5) * 0.08;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 28, -148);
    ctx.rotate(side * wingFlap);

    // Upper Sky-Blue Wyvern Wing
    ctx.fillStyle = '#0369a1';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 195, -138);
    ctx.lineTo(side * 245, -54);
    ctx.lineTo(side * 172, -18);
    ctx.lineTo(side * 142, 34);
    ctx.lineTo(0, 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright cel highlight wing membrane
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(side * 16, -6);
    ctx.lineTo(side * 172, -112);
    ctx.lineTo(side * 192, -56);
    ctx.lineTo(side * 116, -14);
    ctx.closePath();
    ctx.fill();

    // Violet secondary pinions
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(side * 145, 22);
    ctx.lineTo(side * 118, 76);
    ctx.lineTo(side * 16, 48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Orbiting 6/6 Evolution Stack Runes behind Chimera
  const evoColors = ['#10b981', '#f59e0b', '#38bdf8', '#a855f7', '#34d399', '#fbbf24'];
  for (let i = 0; i < 6; i++) {
    const a = t * 1.6 + (i / 6) * Math.PI * 2;
    const rx = Math.cos(a) * 142;
    const ry = -132 + Math.sin(a) * 58;
    ctx.fillStyle = evoColors[i];
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rx, ry - 12);
    ctx.lineTo(rx + 10, ry);
    ctx.lineTo(rx, ry + 12);
    ctx.lineTo(rx - 10, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Ground cel shadow
  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 96, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Titan Behemoth Armored Legs & Tail
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-36, -84);
  ctx.lineTo(-54, 16);
  ctx.lineTo(-18, 16);
  ctx.lineTo(0, -40);
  ctx.lineTo(18, 16);
  ctx.lineTo(54, 16);
  ctx.lineTo(36, -84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hulking Chimera Chest Plate (Emerald + Gold Trim)
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.moveTo(-56, -162);
  ctx.lineTo(56, -162);
  ctx.lineTo(38, -76);
  ctx.lineTo(-38, -76);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Behemoth Horned Pauldrons
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(side * 34, -162);
    ctx.lineTo(side * 88, -196);
    ctx.lineTo(side * 74, -138);
    ctx.lineTo(side * 42, -134);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Extended Emerald Razor Claws
    ctx.fillStyle = '#10b981';
    for (let c = 0; c < 3; c++) {
      ctx.beginPath();
      ctx.moveTo(side * (60 + c * 10), -114 + c * 10);
      ctx.lineTo(side * (108 + c * 8), -78 + c * 12);
      ctx.lineTo(side * (56 + c * 8), -96 + c * 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Omega Chimera Chest Core
  const coreGrad = ctx.createRadialGradient(0, -124, 2, 0, -124, 24);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.5, '#6ee7b7');
  coreGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(0, -148);
  ctx.lineTo(22, -124);
  ctx.lineTo(0, -100);
  ctx.lineTo(-22, -124);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Apex Wolf-Dragon Crowned Head + Twin Titan Horns
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-30, -184);
  ctx.lineTo(0, -214);
  ctx.lineTo(30, -184);
  ctx.lineTo(22, -154);
  ctx.lineTo(0, -146);
  ctx.lineTo(-22, -154);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 20, -196);
    ctx.quadraticCurveTo(side * 66, -226, side * 50, -258);
    ctx.quadraticCurveTo(side * 34, -224, side * 12, -202);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Fierce Glowing Eyes + Roar Shockwave Ring
  ctx.fillStyle = '#6ee7b7';
  ctx.beginPath();
  ctx.moveTo(-20, -176);
  ctx.lineTo(-6, -170);
  ctx.lineTo(-16, -166);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -176);
  ctx.lineTo(6, -170);
  ctx.lineTo(16, -166);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawDNAStrands(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heightSpan: number,
  amplitude: number,
  t: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const steps = 34;
  for (let strand = 0; strand < 2; strand++) {
    ctx.strokeStyle = strand === 0 ? '#10b981' : '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const py = cy - heightSpan * 0.5 + p * heightSpan;
      const px = cx + Math.sin(p * Math.PI * 3.5 + t * 5.2 + strand * Math.PI) * amplitude;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Base-pair rungs
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 2; i < steps; i += 3) {
    const p = i / steps;
    const py = cy - heightSpan * 0.5 + p * heightSpan;
    const x1 = cx + Math.sin(p * Math.PI * 3.5 + t * 5.2) * amplitude;
    const x2 = cx + Math.sin(p * Math.PI * 3.5 + t * 5.2 + Math.PI) * amplitude;
    ctx.beginPath();
    ctx.moveTo(x1, py);
    ctx.lineTo(x2, py);
    ctx.stroke();
  }
  ctx.restore();
}

export const MorphosChimera2DAnimeCutscene: React.FC<MorphosChimera2DAnimeCutsceneProps> = ({
  remainingTime,
  totalDuration = 4.8,
  onSkip
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);

  const [act, setAct] = useState<CutsceneAct>('awakening');
  const [uiProgress, setUiProgress] = useState<number>(0);

  onSkipRef.current = onSkip;

  useEffect(() => {
    remainingRef.current = remainingTime;
    lastSyncRef.current = performance.now();
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let isDisposed = false;
    let currentAct: CutsceneAct = 'awakening';

    const renderFrame = () => {
      if (isDisposed) return;

      const sinceSync = (performance.now() - lastSyncRef.current) / 1000;
      const liveRem = Math.max(0, remainingRef.current - sinceSync);
      const progress = Math.max(0, Math.min(1, 1 - liveRem / Math.max(0.1, totalDuration)));
      const t = progress * totalDuration;

      let nextAct: CutsceneAct = 'awakening';
      if (progress >= 0.74) nextAct = 'apex_roar';
      else if (progress >= 0.56) nextAct = 'impact';
      else if (progress >= 0.30) nextAct = 'convergence';

      if (nextAct !== currentAct) {
        currentAct = nextAct;
        setAct(nextAct);
      }
      setUiProgress(Math.round(progress * 1000) / 10);

      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      const minDim = Math.min(w, h);
      const scale = minDim / 720;
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Sakuga screen shake during convergence peak & roar
      let shakeX = 0;
      let shakeY = 0;
      if (progress >= 0.52 && progress <= 0.76) {
        const shakeAmt = (1 - Math.abs(progress - 0.62) / 0.14) * 14 * scale;
        shakeX = Math.sin(t * 78) * Math.max(0, shakeAmt);
        shakeY = Math.cos(t * 91) * Math.max(0, shakeAmt);
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Anime Impact Frame B/W sakuga flashes right at 57%-61%
      const isImpactInversion = progress >= 0.57 && progress < 0.615;
      if (isImpactInversion) {
        ctx.fillStyle = progress < 0.592 ? '#020617' : '#f8fafc';
        ctx.fillRect(-20, -20, w + 40, h + 40);
      } else {
        const bgGrad = ctx.createRadialGradient(cx, cy * 0.9, 20, cx, cy, minDim * 0.85);
        bgGrad.addColorStop(0, progress >= 0.58 ? '#064e3b' : '#052e16');
        bgGrad.addColorStop(0.55, '#071318');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-20, -20, w + 40, h + 40);
      }

      // 2. Manga Speedlines
      drawSpeedlines(
        ctx,
        cx,
        cy * 0.9,
        minDim,
        t * (progress >= 0.30 ? 2.4 : 1.0),
        progress >= 0.56 ? 0.95 : 0.65,
        isImpactInversion ? '#ffffff' : '#10b981',
        isImpactInversion ? '#000000' : '#f59e0b'
      );

      // 3. Bio-Evolution Sigil Circle & DNA Helices
      if (!isImpactInversion) {
        ctx.save();
        ctx.translate(cx, h * 0.74);
        ctx.scale(1, 0.28);
        ctx.rotate(t * 1.4);
        ctx.strokeStyle = progress >= 0.58 ? '#fbbf24' : '#10b981';
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, minDim * (0.28 + Math.min(0.14, progress * 0.16)), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([16 * scale, 10 * scale]);
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, minDim * 0.21, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        drawDNAStrands(
          ctx,
          cx,
          cy * 0.92,
          h * 0.72,
          (progress >= 0.30 ? 115 : 145) * scale,
          t,
          progress >= 0.74 ? 0.28 : 0.62
        );
      }

      // 4. Tri-Spirit 2D Anime Cut-ins & Helix Convergence (0.0 -> 0.58)
      if (progress < 0.60) {
        const convergeP =
          progress < 0.30 ? 0 : Math.min(1, (progress - 0.30) / 0.28);
        const orbitSpin = convergeP * convergeP * Math.PI * 2.2;
        const radius = (1 - convergeP * 0.88) * minDim * 0.31;
        const spiritScale = scale * (1.05 - convergeP * 0.38);
        const spiritAlpha = Math.min(1, progress / 0.14) * (1 - Math.max(0, (progress - 0.55) / 0.05));

        const angles = [-Math.PI * 0.5, Math.PI * 0.18, Math.PI * 0.82];
        const wx = cx + Math.cos(angles[1] + orbitSpin) * radius;
        const wy = cy * 0.82 + Math.sin(angles[1] + orbitSpin) * radius * 0.72;
        const bx = cx + Math.cos(angles[2] + orbitSpin) * radius;
        const by = cy * 0.82 + Math.sin(angles[2] + orbitSpin) * radius * 0.72;
        const dx = cx + Math.cos(angles[0] + orbitSpin) * radius;
        const dy = cy * 0.82 + Math.sin(angles[0] + orbitSpin) * radius * 0.72;

        // Energy tether arcs pulling into Morphos
        if (convergeP > 0.02) {
          const centers: Array<[number, number, string]> = [
            [wx, wy, '#10b981'],
            [bx, by, '#f59e0b'],
            [dx, dy, '#38bdf8']
          ];
          for (const [sx, sy, col] of centers) {
            ctx.strokeStyle = col;
            ctx.lineWidth = 4.5 * scale;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(
              (sx + cx) * 0.5 + Math.sin(t * 16) * 28 * scale,
              (sy + h * 0.68) * 0.5,
              cx,
              h * 0.62
            );
            ctx.stroke();
          }
        }

        drawWolfSpirit2D(ctx, wx, wy, spiritScale, t, spiritAlpha);
        drawBehemothSpirit2D(ctx, bx, by, spiritScale, t, spiritAlpha);
        drawWyvernSpirit2D(ctx, dx, dy, spiritScale, t, spiritAlpha);

        drawMorphosBaseForm2D(ctx, cx, h * 0.73, scale * (1.05 + convergeP * 0.18), t);
      }

      // 5. Impact Shockwaves + Apex Chimera 2D Anime Emergence (0.58 -> 1.0)
      if (progress >= 0.58) {
        const emergeP = Math.min(1, (progress - 0.58) / 0.22);
        const roarP = Math.max(0, (progress - 0.74) / 0.26);

        // Expanding anime shockwave rings
        if (progress < 0.82) {
          const ringP = (progress - 0.58) / 0.24;
          ctx.strokeStyle = '#6ee7b7';
          ctx.lineWidth = Math.max(1, (1 - ringP) * 14 * scale);
          ctx.beginPath();
          ctx.arc(cx, cy * 0.92, ringP * minDim * 0.78, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = Math.max(1, (1 - ringP) * 8 * scale);
          ctx.beginPath();
          ctx.arc(cx, cy * 0.92, ringP * minDim * 0.56, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Apex Chimera cel-shaded 2D figure
        const chimeraScale = scale * (0.95 + emergeP * 0.24 + Math.sin(roarP * Math.PI) * 0.06);
        drawApexChimera2D(ctx, cx, h * 0.76, chimeraScale, t);

        // Roar sonic waves during final act
        if (roarP > 0) {
          const waveCount = 3;
          for (let r = 0; r < waveCount; r++) {
            const wp = (roarP * 2.2 + r * 0.33) % 1;
            ctx.strokeStyle = r % 2 === 0 ? '#10b981' : '#fbbf24';
            ctx.globalAlpha = Math.max(0, (1 - wp) * 0.75);
            ctx.lineWidth = (1 - wp) * 6 * scale;
            ctx.beginPath();
            ctx.arc(cx, h * 0.44, wp * minDim * 0.65, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }

      // 6. Crisp Anime White Impact Flash Fade (0.615 -> 0.68)
      if (progress >= 0.615 && progress < 0.68) {
        const flashA = 1 - (progress - 0.615) / 0.065;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, flashA * 0.78)})`;
        ctx.fillRect(-20, -20, w + 40, h + 40);
      }

      // 7. Anime Cinema Letterbox Bars
      const barH = Math.round(h * 0.065);
      ctx.fillStyle = '#02040a';
      ctx.fillRect(-20, -20, w + 40, barH + 20);
      ctx.fillRect(-20, h - barH, w + 40, barH + 20);

      ctx.restore();

      frameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [totalDuration]);

  const meta = ACT_META[act];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 2D Anime Morphos Apex Chimera"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top-Left Title & Clean Typography (Zero pills / zero backdrop-filter) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-5 sm:p-8 flex items-start justify-between">
        <div className="max-w-xl bg-slate-950/88 border border-emerald-400/35 rounded-xl px-4 py-3 shadow-xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-game text-emerald-300 tracking-wide">
            <span>2D Anime</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>{meta.kicker}</span>
          </div>
          <h2 className="mt-0.5 font-title text-lg sm:text-2xl font-black tracking-wider text-white">
            APEX CHIMERA: OMEGA METAMORPHOSIS
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-200 font-game">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Bar: Skip Button */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 sm:p-8 flex items-end justify-end">
        <button
          onClick={() => onSkipRef.current()}
          className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-emerald-400/55 hover:border-amber-300 text-slate-100 font-game font-semibold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shadow-lg"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-emerald-300" />
        </button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-1.5 bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-sky-400"
          style={{ width: `${uiProgress}%` }}
        />
      </div>
    </div>
  );
};
