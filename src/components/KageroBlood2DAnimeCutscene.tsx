import React, { useEffect, useRef, useState } from 'react';
import { FastForward } from 'lucide-react';

interface KageroBlood2DAnimeCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  bloodStacks?: number;
  onSkip: () => void;
}

type CutsceneAct = 'awakening' | 'higanbana' | 'iaido' | 'eclipse';

const ACT_META: Record<CutsceneAct, { kicker: string; subtitle: string; jpTag: string }> = {
  awakening: {
    kicker: 'Babak I · Kebangkitan Bulan Darah',
    subtitle: 'Gerhana merah menyelimuti langit — Kagero membuka segel Kekkijutsu!',
    jpTag: '血鬼術・覚醒'
  },
  higanbana: {
    kicker: 'Babak II · Mekar Higanbana Berdarah',
    subtitle: 'Ratusan kelopak Spider Lily crimson bermekaran menyelimuti bilah Akatsuki no Chi!',
    jpTag: '彼岸花・開花'
  },
  iaido: {
    kicker: 'Babak III · Forbidden Iaido: Cross Severance',
    subtitle: 'Tebasan tinta hitam-merah membelah ruang dalam sekejap mata!',
    jpTag: '血刃一閃・絶'
  },
  eclipse: {
    kicker: 'Babak IV · Crimson Moon Eclipse',
    subtitle: 'Wujud Penguasa Bulan Darah aktif — setiap ayunan menebaskan sabit darah ganda!',
    jpTag: '紅月蝕・降臨'
  }
};

interface BloodPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  alpha: number;
}

interface SlashRibbon {
  angle: number;
  offsetY: number;
  width: number;
  delay: number;
  inverted: boolean;
}

function drawAnimeSpeedlines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  minDim: number,
  t: number,
  intensity: number,
  isImpact: boolean
) {
  const count = 64;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + t * 0.35;
    const inner = minDim * (0.18 + ((i * 7) % 6) * 0.036);
    const outer = minDim * 1.1;
    ctx.strokeStyle = isImpact
      ? (i % 2 === 0 ? '#09050a' : '#e11d48')
      : (i % 4 === 0 ? '#ffe4e6' : i % 2 === 0 ? '#fb7185' : '#be123c');
    ctx.globalAlpha = intensity * (i % 2 === 0 ? 0.52 : 0.25);
    ctx.lineWidth = (i % 4 === 0 ? 3.4 : 1.5) * (minDim / 720);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpiderLily2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rot: number,
  bloom: number,
  isImpact: boolean
) {
  if (bloom <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const petals = 6;
  const r = radius * bloom;

  // Curled spider lily petals
  for (let i = 0; i < petals; i++) {
    const a = (i * Math.PI * 2) / petals;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = isImpact ? '#09050a' : '#e11d48';
    ctx.strokeStyle = isImpact ? '#ffe4e6' : '#09050a';
    ctx.lineWidth = Math.max(1.4, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(r * 0.32, -r * 0.24, r * 0.85, -r * 0.14, r, -r * 0.32);
    ctx.bezierCurveTo(r * 0.72, 0.02, r * 0.36, r * 0.16, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Long slender stamen filaments
    ctx.strokeStyle = isImpact ? '#be123c' : '#fda4af';
    ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.65, r * 0.22, r * 1.24, r * 0.06);
    ctx.stroke();
    ctx.fillStyle = '#ffe4e6';
    ctx.beginPath();
    ctx.arc(r * 1.24, r * 0.06, Math.max(1.5, r * 0.05), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = isImpact ? '#e11d48' : '#09050a';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(2.5, r * 0.14), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBloodMagicCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  alpha: number,
  isImpact: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.34);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;

  ctx.strokeStyle = isImpact ? '#09050a' : '#f43f5e';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isImpact ? '#be123c' : '#ffe4e6';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  for (let s = 0; s < 2; s++) {
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + (s * Math.PI) / 4;
      const px = Math.cos(a) * radius * 0.84;
      const py = Math.sin(a) * radius * 0.84;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = s === 0 ? '#fb7185' : '#09050a';
    ctx.lineWidth = s === 0 ? 2.4 : 4;
    ctx.stroke();
    if (s === 1) {
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawKageroAnimeHero(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  t: number,
  act: CutsceneAct,
  isImpact: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const capeWave = Math.sin(t * 7.5) * 14;
  const poseSlash = act === 'iaido' || act === 'eclipse';

  // Flowing Crimson Demon Aura Ribbons behind hero
  for (const side of [-1, 1]) {
    ctx.fillStyle = isImpact ? '#09050a' : 'rgba(225, 29, 72, 0.82)';
    ctx.strokeStyle = isImpact ? '#ffe4e6' : '#09050a';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(side * 12, -26);
    ctx.quadraticCurveTo(side * (96 + capeWave * side), -48, side * (135 - capeWave), 28);
    ctx.quadraticCurveTo(side * 78, 12, side * 18, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Anime Haori Cloak (Ink Black with Crimson Inner Lining)
  ctx.fillStyle = isImpact ? '#ffe4e6' : '#11070d';
  ctx.strokeStyle = isImpact ? '#09050a' : '#f43f5e';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-26, -34);
  ctx.lineTo(26, -34);
  ctx.quadraticCurveTo(64 + capeWave * 0.5, 42, 72 + capeWave, 96);
  ctx.lineTo(-72 - capeWave, 96);
  ctx.quadraticCurveTo(-64 - capeWave * 0.5, 42, -26, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crimson Inner Kimono Sash
  ctx.fillStyle = '#e11d48';
  ctx.strokeStyle = '#09050a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-18, -32);
  ctx.lineTo(18, -32);
  ctx.lineTo(26, 62);
  ctx.lineTo(-26, 62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dynamic Anime Crimson Scarf
  ctx.fillStyle = isImpact ? '#09050a' : '#f43f5e';
  ctx.strokeStyle = '#09050a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-28, -36);
  ctx.quadraticCurveTo(0, -18, 28, -36);
  ctx.quadraticCurveTo(85, -52 + capeWave * 0.7, 118, -18 + capeWave);
  ctx.quadraticCurveTo(66, -12, 22, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stylized Anime Head & Jawline
  ctx.fillStyle = '#fef2f2';
  ctx.strokeStyle = '#09050a';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-24, -68);
  ctx.lineTo(24, -68);
  ctx.lineTo(21, -46);
  ctx.lineTo(0, -32);
  ctx.lineTo(-21, -46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sharp Demon-Slayer Mark on Cheek / Forehead
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-14, -64);
  ctx.lineTo(-7, -58);
  ctx.lineTo(-15, -54);
  ctx.stroke();

  // Glowing Slanted Scarlet Anime Eyes
  for (const side of [-1, 1]) {
    ctx.fillStyle = isImpact ? '#e11d48' : '#09050a';
    ctx.beginPath();
    ctx.moveTo(side * 5, -52);
    ctx.lineTo(side * 18, -56);
    ctx.lineTo(side * 14, -47);
    ctx.lineTo(side * 5, -48);
    ctx.closePath();
    ctx.fill();

    // Crimson Iris
    ctx.fillStyle = '#fb7185';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(side * 11.5, -51, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // White Anime Eye Glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(side * 10.5, -52.2, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spiky Crimson-Black Anime Hair + White Cel-Shaded Rim Highlights
  ctx.fillStyle = '#18070f';
  ctx.strokeStyle = '#09050a';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-30, -48);
  ctx.lineTo(-42, -68);
  ctx.lineTo(-24, -76);
  ctx.lineTo(-28, -96);
  ctx.lineTo(-6, -86);
  ctx.lineTo(8, -102);
  ctx.lineTo(20, -84);
  ctx.lineTo(40, -90);
  ctx.lineTo(30, -68);
  ctx.lineTo(42, -52);
  ctx.lineTo(24, -56);
  ctx.lineTo(14, -64);
  ctx.lineTo(0, -54);
  ctx.lineTo(-14, -66);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crimson Hair Streaks
  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.moveTo(-14, -78);
  ctx.lineTo(8, -96);
  ctx.lineTo(14, -74);
  ctx.lineTo(0, -64);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffe4e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, -78);
  ctx.quadraticCurveTo(0, -85, 18, -76);
  ctx.stroke();

  // Katana Akatsuki no Chi (Iaido Draw Pose -> Overhead Eclipse Slash)
  ctx.save();
  const bladeRot = poseSlash ? -0.52 : -2.65;
  ctx.rotate(bladeRot);
  // Tsuba (Guard)
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#09050a';
  ctx.lineWidth = 2.4;
  ctx.fillRect(14, -12, 8, 24);
  ctx.strokeRect(14, -12, 8, 24);

  // Blood-Forged Curved Katana Blade
  ctx.fillStyle = isImpact ? '#09050a' : '#ffe4e6';
  ctx.strokeStyle = '#09050a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(22, -6);
  ctx.quadraticCurveTo(95, -14, 168, -4);
  ctx.lineTo(154, 6);
  ctx.quadraticCurveTo(88, 0, 22, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing Blood Edge Trail on Blade
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(24, 3);
  ctx.quadraticCurveTo(92, -2, 160, -2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

export const KageroBlood2DAnimeCutscene: React.FC<KageroBlood2DAnimeCutsceneProps> = ({
  remainingTime,
  totalDuration = 4.8,
  bloodStacks = 0,
  onSkip
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef<number>(0);
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  const progress = Math.max(0, Math.min(1, 1 - remainingTime / Math.max(0.1, totalDuration)));
  progressRef.current = progress;

  const [act, setAct] = useState<CutsceneAct>('awakening');

  useEffect(() => {
    const nextAct: CutsceneAct =
      progress < 0.25 ? 'awakening' : progress < 0.55 ? 'higanbana' : progress < 0.80 ? 'iaido' : 'eclipse';
    setAct(nextAct);
  }, [progress]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onSkipRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const petals: BloodPetal[] = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: -0.06 - Math.random() * 0.14,
      vy: 0.04 + Math.random() * 0.11,
      size: 4 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
      alpha: 0.45 + Math.random() * 0.5
    }));

    const slashRibbons: SlashRibbon[] = [
      { angle: -0.28, offsetY: -65, width: 32, delay: 0.54, inverted: false },
      { angle: 0.34, offsetY: 20, width: 38, delay: 0.60, inverted: true },
      { angle: -0.12, offsetY: 75, width: 28, delay: 0.65, inverted: false },
      { angle: 0.05, offsetY: -10, width: 52, delay: 0.70, inverted: true }
    ];

    let animId = 0;
    let lastTs = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const p = progressRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const minDim = Math.min(w, h);
      const currentAct: CutsceneAct =
        p < 0.25 ? 'awakening' : p < 0.55 ? 'higanbana' : p < 0.80 ? 'iaido' : 'eclipse';
      const isImpact = (p >= 0.70 && p <= 0.755) || (p >= 0.555 && p <= 0.58);

      // Camera anime shake during impact acts
      const shakeAmt = currentAct === 'iaido' ? 9 : currentAct === 'eclipse' ? 5 : 1.5;
      const sx = (Math.random() - 0.5) * shakeAmt;
      const sy = (Math.random() - 0.5) * shakeAmt;

      ctx.save();
      ctx.translate(sx, sy);

      // 1. Anime Background + Blood Moon Sky
      if (isImpact) {
        ctx.fillStyle = '#fff1f2';
        ctx.fillRect(-20, -20, w + 40, h + 40);
      } else {
        const bgGrad = ctx.createRadialGradient(cx, cy * 0.78, minDim * 0.06, cx, cy, minDim * 0.95);
        bgGrad.addColorStop(0, '#4c0519');
        bgGrad.addColorStop(0.45, '#19040e');
        bgGrad.addColorStop(1, '#060208');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-20, -20, w + 40, h + 40);
      }

      // Giant Anime Crimson Blood Moon
      const moonR = minDim * (0.22 + Math.min(0.06, p * 0.09));
      ctx.save();
      ctx.fillStyle = isImpact ? '#09050a' : '#be123c';
      ctx.strokeStyle = isImpact ? '#e11d48' : '#ffe4e6';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = isImpact ? 12 : 42;
      ctx.beginPath();
      ctx.arc(cx, cy * 0.68, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Moon crescent ink shadow cutout
      if (p > 0.2) {
        ctx.fillStyle = isImpact ? '#fff1f2' : '#14030b';
        ctx.beginPath();
        ctx.arc(cx - moonR * 0.38, cy * 0.68 - moonR * 0.14, moonR * 0.76, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2. Speedlines & Blood Magic Circle
      drawAnimeSpeedlines(ctx, cx, cy, minDim, p * 5, p > 0.25 ? 0.9 : 0.45, isImpact);
      drawBloodMagicCircle(ctx, cx, cy + minDim * 0.22, minDim * 0.34, p * 2.6, 0.85, isImpact);

      // 3. Blooming Higanbana Flowers Flanking the Frame
      const flowerBloom = Math.max(0, Math.min(1, (p - 0.18) / 0.28));
      if (flowerBloom > 0) {
        drawSpiderLily2D(ctx, cx - minDim * 0.36, cy + minDim * 0.14, minDim * 0.11, p * 0.7, flowerBloom, isImpact);
        drawSpiderLily2D(ctx, cx + minDim * 0.36, cy + minDim * 0.12, minDim * 0.11, -p * 0.8, flowerBloom, isImpact);
        drawSpiderLily2D(ctx, cx - minDim * 0.24, cy - minDim * 0.22, minDim * 0.075, p * 1.1, flowerBloom, isImpact);
        drawSpiderLily2D(ctx, cx + minDim * 0.24, cy - minDim * 0.22, minDim * 0.075, -p * 1.0, flowerBloom, isImpact);
      }

      // 4. Kagero Full Anime Character Foreground
      const heroScale = (minDim / 720) * (currentAct === 'eclipse' ? 1.85 : 1.55);
      const bobY = Math.sin(p * 14) * 6;
      drawKageroAnimeHero(ctx, cx, cy + bobY + minDim * 0.04, heroScale, p * 6, currentAct, isImpact);

      // 5. Sakuga Cross-Screen Ink & Blood Slash Ribbons
      for (const sr of slashRibbons) {
        if (p < sr.delay) continue;
        const slashLife = Math.min(1, (p - sr.delay) / 0.09);
        const fade = Math.max(0, 1 - Math.max(0, p - sr.delay - 0.12) / 0.16);
        if (fade <= 0) continue;
        ctx.save();
        ctx.translate(cx, cy + sr.offsetY);
        ctx.rotate(sr.angle);
        ctx.globalAlpha = fade;
        const halfLen = w * 0.85 * slashLife;
        ctx.fillStyle = sr.inverted && isImpact ? '#09050a' : '#e11d48';
        ctx.strokeStyle = '#09050a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-halfLen, 0);
        ctx.quadraticCurveTo(0, -sr.width, halfLen, 0);
        ctx.quadraticCurveTo(0, sr.width * 0.55, -halfLen, 0);
        ctx.fill();
        ctx.stroke();

        // Razor bright core highlight
        ctx.fillStyle = '#fff1f2';
        ctx.beginPath();
        ctx.moveTo(-halfLen * 0.9, 0);
        ctx.quadraticCurveTo(0, -sr.width * 0.34, halfLen * 0.9, 0);
        ctx.quadraticCurveTo(0, sr.width * 0.18, -halfLen * 0.9, 0);
        ctx.fill();
        ctx.restore();
      }

      // 6. Drifting Crimson Higanbana Petals
      for (const pt of petals) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.rot += pt.rotSpeed * dt;
        if (pt.x < -0.05) pt.x = 1.05;
        if (pt.y > 1.05) pt.y = -0.05;

        ctx.save();
        ctx.translate(pt.x * w, pt.y * h);
        ctx.rotate(pt.rot);
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = isImpact ? '#09050a' : '#f43f5e';
        ctx.strokeStyle = '#09050a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.size, pt.size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Anime Widescreen Letterbox Bars (Top & Bottom)
      const barH = Math.max(46, h * 0.085);
      ctx.fillStyle = '#050207';
      ctx.fillRect(-20, -20, w + 40, barH + 20);
      ctx.fillRect(-20, h - barH, w + 40, barH + 20);
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, barH);
      ctx.lineTo(w, barH);
      ctx.moveTo(0, h - barH);
      ctx.lineTo(w, h - barH);
      ctx.stroke();

      ctx.restore();
      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const meta = ACT_META[act];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top Anime Title Banner */}
      <div className="pointer-events-none absolute top-4 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-rose-600 border border-rose-300/60 text-white text-xs font-black tracking-widest rounded">
            {meta.jpTag}
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-300">
              {meta.kicker}
            </div>
            <div className="font-title text-sm sm:text-base font-black text-white tracking-wider">
              KAGERO · CRIMSON MOON ECLIPSE
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-rose-950/80 border border-rose-500/40 text-xs font-mono text-rose-200">
          <span>🩸 BLOOD STACKS:</span>
          <span className="font-bold text-white">{bloodStacks}</span>
        </div>
      </div>

      {/* Bottom Subtitle + Skip Button */}
      <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="pointer-events-none text-xs sm:text-sm font-semibold text-rose-100 bg-black/75 border border-rose-500/40 px-4 py-1.5 rounded-lg text-center sm:text-left">
          {meta.subtitle}
        </p>

        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-title font-bold text-xs tracking-wider flex items-center gap-2 border border-rose-300/60 shadow-[0_0_20px_rgba(225,29,72,0.55)] cursor-pointer transition-colors"
        >
          <FastForward className="w-4 h-4" />
          <span>LEWATI CUTSCENE ({Math.max(0, remainingTime).toFixed(1)}s)</span>
        </button>
      </div>
    </div>
  );
};
