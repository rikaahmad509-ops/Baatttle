import React, { useEffect, useRef, useState } from 'react';
import { FastForward } from 'lucide-react';

interface ValkyrieFrost2DAnimeCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  monolithCount?: number;
  frozenEnemiesCount?: number;
  onSkip: () => void;
}

type CutsceneAct = 'stasis' | 'mirrors' | 'shatter' | 'domain';

const ACT_META: Record<CutsceneAct, { kicker: string; subtitle: string }> = {
  stasis: {
    kicker: 'Babak I · Sub-Zero Stasis',
    subtitle: 'Valkyrie Frost membekukan aliran waktu dan membuka segel Cermin Es.'
  },
  mirrors: {
    kicker: 'Babak II · Kebangkitan Monolith Cermin',
    subtitle: 'Monolith kristal raksasa bangkit membentuk jaringan refraksi optik!'
  },
  shatter: {
    kicker: 'Babak III · Jaring Laser Prismatik',
    subtitle: 'Sinar absolut memantul menembus seluruh dimensi dalam satu tebasan!'
  },
  domain: {
    kicker: 'Babak IV · Absolute Zero Domain',
    subtitle: 'Wilayah nol mutlak aktif — sang penguasa kristal menguasai medan tempur!'
  }
};

interface SnowPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  alpha: number;
}

interface IceShard {
  angle: number;
  distFactor: number;
  speed: number;
  size: number;
  rot: number;
  tilt: number;
  hue: number;
}

function drawRadialSpeedlines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  minDim: number,
  t: number,
  intensity: number,
  colorA: string,
  colorB: string
) {
  const count = 56;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + t * 0.24;
    const inner = minDim * (0.22 + ((i * 11) % 7) * 0.032);
    const outer = minDim * 1.05;
    ctx.strokeStyle = i % 3 === 0 ? colorA : i % 3 === 1 ? colorB : '#ffffff';
    ctx.globalAlpha = intensity * (i % 2 === 0 ? 0.45 : 0.22);
    ctx.lineWidth = (i % 4 === 0 ? 3.2 : 1.35) * (minDim / 720);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrostMandala(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  alpha: number,
  scale: number,
  accentColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.34);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;

  // Outer runes ring
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 3.2 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.8 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.86, 0, Math.PI * 2);
  ctx.stroke();

  // Overlapping hexagram triangles (Cryo seal geometry)
  for (let tri = 0; tri < 2; tri++) {
    ctx.beginPath();
    for (let v = 0; v < 3; v++) {
      const a = (v * Math.PI * 2) / 3 + (tri * Math.PI) / 3;
      const px = Math.cos(a) * radius * 0.86;
      const py = Math.sin(a) * radius * 0.86;
      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = tri === 0 ? '#e0f2fe' : '#38bdf8';
    ctx.lineWidth = 2.4 * scale;
    ctx.stroke();
  }

  // Snowflake spokes
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 1.6 * scale;
  for (let s = 0; s < 6; s++) {
    const a = (s * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 0.25, Math.sin(a) * radius * 0.25);
    ctx.lineTo(Math.cos(a) * radius * 0.98, Math.sin(a) * radius * 0.98);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMirrorMonolith2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  w: number,
  riseProgress: number,
  glintPhase: number,
  isInverted: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  const curH = h * riseProgress;
  const curW = w * (0.4 + riseProgress * 0.6);

  // Dark anime ground ring under monolith
  ctx.fillStyle = isInverted ? 'rgba(255,255,255,0.22)' : 'rgba(14, 165, 233, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, curH * 0.45, curW * 0.95, curW * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main faceted crystal prism silhouette
  ctx.beginPath();
  ctx.moveTo(0, -curH * 0.65);
  ctx.lineTo(curW * 0.56, -curH * 0.18);
  ctx.lineTo(curW * 0.42, curH * 0.38);
  ctx.lineTo(0, curH * 0.5);
  ctx.lineTo(-curW * 0.42, curH * 0.38);
  ctx.lineTo(-curW * 0.56, -curH * 0.18);
  ctx.closePath();

  if (isInverted) {
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#ffffff';
  } else {
    const g = ctx.createLinearGradient(-curW * 0.5, -curH * 0.6, curW * 0.5, curH * 0.5);
    g.addColorStop(0, '#e0f2fe');
    g.addColorStop(0.32, '#38bdf8');
    g.addColorStop(0.68, '#0284c7');
    g.addColorStop(1, '#082f49');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#020617';
  }
  ctx.fill();
  ctx.lineWidth = Math.max(2, w * 0.055);
  ctx.stroke();

  if (!isInverted) {
    // Anime cel shadow plane on right facet
    ctx.fillStyle = 'rgba(7, 89, 133, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, -curH * 0.65);
    ctx.lineTo(curW * 0.56, -curH * 0.18);
    ctx.lineTo(curW * 0.42, curH * 0.38);
    ctx.lineTo(0, curH * 0.5);
    ctx.closePath();
    ctx.fill();

    // Specular mirror diagonal sheen
    const sheenY = ((glintPhase % 1) - 0.5) * curH * 0.65;
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(240, 249, 255, 0.58)';
    ctx.beginPath();
    ctx.moveTo(-curW, sheenY - 12);
    ctx.lineTo(curW, sheenY - 36);
    ctx.lineTo(curW, sheenY - 18);
    ctx.lineTo(-curW, sheenY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Inner glowing prism core line
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = Math.max(1.5, w * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, -curH * 0.52);
    ctx.lineTo(0, curH * 0.42);
    ctx.stroke();
  }

  ctx.restore();
}

function drawValkyrieEyeCutIn2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  minDim: number,
  enterP: number,
  exitP: number,
  t: number
) {
  const slideX = (1 - enterP) * -w * 0.85 + exitP * w * 0.85;
  const bandH = minDim * 0.24;
  const bandY = h * 0.24;
  const scale = minDim / 720;

  ctx.save();
  ctx.translate(slideX, 0);

  // Diagonal anime manga slash strip
  ctx.beginPath();
  ctx.moveTo(-40, bandY - bandH * 0.42);
  ctx.lineTo(w + 40, bandY - bandH * 0.68);
  ctx.lineTo(w + 40, bandY + bandH * 0.48);
  ctx.lineTo(-40, bandY + bandH * 0.74);
  ctx.closePath();
  ctx.save();
  ctx.clip();

  const stripGrad = ctx.createLinearGradient(0, bandY - bandH, w, bandY + bandH);
  stripGrad.addColorStop(0, '#041226');
  stripGrad.addColorStop(0.5, '#0c2d57');
  stripGrad.addColorStop(1, '#081b38');
  ctx.fillStyle = stripGrad;
  ctx.fillRect(-40, bandY - bandH, w + 80, bandH * 2.2);

  // Horizontal anime motion lines inside cut-in strip
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.26)';
  ctx.lineWidth = 1.6 * scale;
  for (let i = 0; i < 14; i++) {
    const ly = bandY - bandH * 0.6 + (i / 13) * bandH * 1.25;
    const shift = ((t * 950 + i * 170) % (w + 260)) - 130;
    ctx.beginPath();
    ctx.moveTo(shift, ly);
    ctx.lineTo(shift + 180 * scale, ly - 16 * scale);
    ctx.stroke();
  }

  // Anime close-up face & sweeping silver-ice hair locks
  const faceX = w * 0.52;
  const faceY = bandY;
  ctx.save();
  ctx.translate(faceX, faceY);
  ctx.scale(scale * 1.28, scale * 1.28);

  // Pale alabaster cel skin tone + cool shadow under bangs
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-140, -70);
  ctx.lineTo(135, -70);
  ctx.lineTo(118, 65);
  ctx.lineTo(-125, 65);
  ctx.closePath();
  ctx.fill();

  // Cool blue cheek cel shading
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.beginPath();
  ctx.moveTo(-140, -70);
  ctx.lineTo(135, -70);
  ctx.lineTo(120, -10);
  ctx.lineTo(-135, -2);
  ctx.closePath();
  ctx.fill();

  // Twin sharp anime Valkyrie eyes (Left & Right)
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 56, 2);
    ctx.scale(side, 1);

    // Upper thick ink lash line
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(-36, -6);
    ctx.quadraticCurveTo(-4, -22, 34, -10);
    ctx.lineTo(28, -2);
    ctx.quadraticCurveTo(-2, -12, -30, 0);
    ctx.closePath();
    ctx.fill();

    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-29, 0);
    ctx.quadraticCurveTo(-2, -12, 27, -2);
    ctx.lineTo(22, 16);
    ctx.quadraticCurveTo(-4, 21, -24, 12);
    ctx.closePath();
    ctx.fill();

    // Luminous Glacial Iris
    const irisGrad = ctx.createLinearGradient(0, -10, 0, 18);
    irisGrad.addColorStop(0, '#0284c7');
    irisGrad.addColorStop(0.55, '#38bdf8');
    irisGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(-2, 5, 14, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep sapphire pupil & hexagonal crystal catchlight
    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.ellipse(-2, 5, 6, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -1, 4.2, 0, Math.PI * 2);
    ctx.arc(5, 11, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Anime eyebrow
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-32, -22);
    ctx.quadraticCurveTo(0, -28, 30, -18);
    ctx.stroke();

    ctx.restore();
  }

  // Sweeping silver-white anime hair bangs overlapping brow
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-165, -75);
  ctx.lineTo(165, -75);
  ctx.lineTo(145, -18);
  ctx.lineTo(106, 22);
  ctx.lineTo(88, -28);
  ctx.lineTo(36, 12);
  ctx.lineTo(14, -22);
  ctx.lineTo(-4, 28);
  ctx.lineTo(-28, -22);
  ctx.lineTo(-82, 16);
  ctx.lineTo(-108, -32);
  ctx.lineTo(-148, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden Valkyrie forehead crest
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(12, -26);
  ctx.lineTo(0, -12);
  ctx.lineTo(-12, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crisp iris glint star flare
  const flareSize = 18 + Math.sin(t * 18) * 5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(54, -flareSize);
  ctx.lineTo(58, -4);
  ctx.lineTo(54 + flareSize, 0);
  ctx.lineTo(58, 4);
  ctx.lineTo(54, flareSize);
  ctx.lineTo(50, 4);
  ctx.lineTo(54 - flareSize, 0);
  ctx.lineTo(50, -4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.restore();

  // Crisp neon-ice diagonal frame borders
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(-40, bandY - bandH * 0.42);
  ctx.lineTo(w + 40, bandY - bandH * 0.68);
  ctx.moveTo(-40, bandY + bandH * 0.74);
  ctx.lineTo(w + 40, bandY + bandH * 0.48);
  ctx.stroke();

  ctx.restore();
}

function drawValkyrieAnime2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  t: number,
  pose: 'stasis' | 'sweep' | 'sovereign',
  isInverted: boolean
) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(scale, scale);

  const floatY = Math.sin(t * 3.8) * 7;
  ctx.translate(0, floatY);

  const ink = isInverted ? '#ffffff' : '#020617';
  const wingSpread = pose === 'stasis' ? 0.85 : pose === 'sweep' ? 1.05 : 1.18;
  const flap = Math.sin(t * 5.2) * 0.06;

  // 1. Six Crystalline Ice Valkyrie Pinion Wings
  for (const side of [-1, 1]) {
    for (let wIdx = 0; wIdx < 3; wIdx++) {
      ctx.save();
      ctx.translate(side * 22, -138 + wIdx * 16);
      ctx.rotate(side * ((-0.42 + wIdx * 0.28) * wingSpread + flap));

      const wLen = (195 - wIdx * 34) * wingSpread;
      const wThick = 34 - wIdx * 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * wLen * 0.58, -wThick);
      ctx.lineTo(side * wLen, -wThick * 0.22);
      ctx.lineTo(side * wLen * 0.68, wThick * 0.55);
      ctx.closePath();

      if (isInverted) {
        ctx.fillStyle = '#020617';
      } else {
        ctx.fillStyle =
          wIdx === 0
            ? 'rgba(186, 230, 253, 0.88)'
            : wIdx === 1
              ? 'rgba(56, 189, 248, 0.82)'
              : 'rgba(14, 116, 144, 0.82)';
      }
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Specular crystal vein along wing spine
      if (!isInverted) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(side * 12, -2);
        ctx.lineTo(side * wLen * 0.86, -wThick * 0.18);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 2. Flowing Cobalt & Frost Satin Cloak + Twin Silver Ribbon Tails
  const waveA = Math.sin(t * 7.2) * 18;
  const waveB = Math.cos(t * 6.4) * 14;
  ctx.fillStyle = isInverted ? '#020617' : '#0c4a6e';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-26, -134);
  ctx.quadraticCurveTo(-84, -68 + waveA, -104, 22);
  ctx.lineTo(-42, 4);
  ctx.lineTo(0, 24);
  ctx.lineTo(42, 4);
  ctx.lineTo(104, 22);
  ctx.quadraticCurveTo(84, -68 - waveB, 26, -134);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!isInverted) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-20, -130);
    ctx.quadraticCurveTo(-60, -64 + waveA, -74, 8);
    ctx.lineTo(-34, -2);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Armored Valkyrie Greaves & Battle Skirt
  ctx.fillStyle = isInverted ? '#020617' : '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-18, -68);
  ctx.lineTo(-32, 16);
  ctx.lineTo(-10, 16);
  ctx.lineTo(0, -40);
  ctx.lineTo(10, 16);
  ctx.lineTo(32, 16);
  ctx.lineTo(18, -68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Layered frost skirt plates
  ctx.fillStyle = isInverted ? '#020617' : '#e0f2fe';
  ctx.beginPath();
  ctx.moveTo(-24, -84);
  ctx.lineTo(24, -84);
  ctx.lineTo(42, -32);
  ctx.lineTo(14, -40);
  ctx.lineTo(0, -24);
  ctx.lineTo(-14, -40);
  ctx.lineTo(-42, -32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Sculpted Glacier-White Breastplate & Gold Valkyrie Trim
  ctx.fillStyle = isInverted ? '#020617' : '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-30, -142);
  ctx.lineTo(30, -142);
  ctx.lineTo(20, -82);
  ctx.lineTo(-20, -82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Chest Cryo Prism Core
  ctx.fillStyle = isInverted ? '#ffffff' : '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, -132);
  ctx.lineTo(13, -116);
  ctx.lineTo(0, -100);
  ctx.lineTo(-13, -116);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shoulder Pauldrons
  for (const side of [-1, 1]) {
    ctx.fillStyle = isInverted ? '#020617' : '#0284c7';
    ctx.beginPath();
    ctx.moveTo(side * 22, -144);
    ctx.lineTo(side * 50, -158);
    ctx.lineTo(side * 44, -126);
    ctx.lineTo(side * 26, -124);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 5. Windswept Silver-White Anime Hair, Head & Winged Valkyrie Circlet
  // Back hair flow
  ctx.fillStyle = isInverted ? '#020617' : '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(-24, -178);
  ctx.quadraticCurveTo(-54 + waveB * 0.5, -138, -42 + waveA * 0.4, -90);
  ctx.lineTo(-12, -102);
  ctx.lineTo(12, -102);
  ctx.lineTo(42 - waveB * 0.4, -90);
  ctx.quadraticCurveTo(54 - waveA * 0.5, -138, 24, -178);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Face oval
  ctx.fillStyle = isInverted ? '#ffffff' : '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-17, -174);
  ctx.lineTo(17, -174);
  ctx.lineTo(14, -148);
  ctx.lineTo(0, -140);
  ctx.lineTo(-14, -148);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing ice-cyan anime eyes
  ctx.fillStyle = isInverted ? '#020617' : '#0284c7';
  ctx.fillRect(-11, -159, 8, 4.5);
  ctx.fillRect(3, -159, 8, 4.5);
  ctx.fillStyle = isInverted ? '#ffffff' : '#bae6fd';
  ctx.fillRect(-9, -159, 3, 2.5);
  ctx.fillRect(5, -159, 3, 2.5);

  // Bangs & Gold Valkyrie Winged Crown
  ctx.fillStyle = isInverted ? '#020617' : '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(-24, -176);
  ctx.lineTo(0, -196);
  ctx.lineTo(24, -176);
  ctx.lineTo(18, -162);
  ctx.lineTo(6, -170);
  ctx.lineTo(0, -154);
  ctx.lineTo(-6, -170);
  ctx.lineTo(-18, -162);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden side ear-wings on helm
  ctx.fillStyle = isInverted ? '#ffffff' : '#fbbf24';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 16, -176);
    ctx.lineTo(side * 42, -206);
    ctx.lineTo(side * 34, -176);
    ctx.lineTo(side * 20, -168);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 6. Frostbite Prism Lance (dynamic pose angle per Act)
  ctx.save();
  const lanceAngle =
    pose === 'stasis' ? -0.18 : pose === 'sweep' ? 0.58 + Math.sin(t * 14) * 0.08 : -0.34;
  ctx.translate(28, -118);
  ctx.rotate(lanceAngle);

  // Lance shaft
  ctx.fillStyle = isInverted ? '#ffffff' : '#1e293b';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.2;
  ctx.fillRect(-5, -135, 10, 265);
  ctx.strokeRect(-5, -135, 10, 265);

  // Cross-guard & Cryo Prism Halberd Blade
  ctx.fillStyle = isInverted ? '#020617' : '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(-24, -124);
  ctx.lineTo(24, -124);
  ctx.lineTo(14, -108);
  ctx.lineTo(-14, -108);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isInverted ? '#ffffff' : '#bae6fd';
  ctx.beginPath();
  ctx.moveTo(0, -238);
  ctx.lineTo(26, -154);
  ctx.lineTo(0, -122);
  ctx.lineTo(-26, -154);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!isInverted) {
    // Lance tip glowing diamond core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -195);
    ctx.lineTo(11, -156);
    ctx.lineTo(0, -134);
    ctx.lineTo(-11, -156);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

function drawFrozenTargetStatue2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  isInverted: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Dark silhouette frozen inside translucent ice crystal
  ctx.fillStyle = isInverted ? '#ffffff' : 'rgba(15, 23, 42, 0.72)';
  ctx.beginPath();
  ctx.moveTo(-16, 28);
  ctx.lineTo(-22, -10);
  ctx.lineTo(-8, -34);
  ctx.lineTo(8, -34);
  ctx.lineTo(22, -10);
  ctx.lineTo(16, 28);
  ctx.closePath();
  ctx.fill();

  // Outer faceted cryo prison crystal
  ctx.fillStyle = isInverted ? 'rgba(255,255,255,0.18)' : 'rgba(125, 211, 252, 0.34)';
  ctx.strokeStyle = isInverted ? '#ffffff' : '#bae6fd';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -54);
  ctx.lineTo(30, -16);
  ctx.lineTo(24, 34);
  ctx.lineTo(0, 46);
  ctx.lineTo(-24, 34);
  ctx.lineTo(-30, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export const ValkyrieFrost2DAnimeCutscene: React.FC<ValkyrieFrost2DAnimeCutsceneProps> = ({
  remainingTime,
  totalDuration = 4.6,
  monolithCount = 3,
  frozenEnemiesCount = 0,
  onSkip
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);

  const [act, setAct] = useState<CutsceneAct>('stasis');
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
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'block w-full h-full';
    mountEl.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    // Pre-allocated particle pools (zero allocations inside RAF loop)
    const petalCount = 52;
    const petals: SnowPetal[] = Array.from({ length: petalCount }, (_, i) => ({
      x: (i * 0.6180339) % 1,
      y: ((i * 0.381966) % 1),
      vx: -0.025 + ((i % 7) - 3) * 0.012,
      vy: 0.06 + (i % 5) * 0.028,
      size: 3 + (i % 4) * 2.2,
      rot: i * 0.7,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * (1.4 + (i % 3) * 0.8),
      alpha: 0.35 + (i % 5) * 0.12
    }));

    const shardCount = 38;
    const shards: IceShard[] = Array.from({ length: shardCount }, (_, i) => ({
      angle: (i / shardCount) * Math.PI * 2 + (i % 3) * 0.14,
      distFactor: 0.18 + (i % 5) * 0.14,
      speed: 0.7 + (i % 4) * 0.25,
      size: 12 + (i % 5) * 7,
      rot: i * 1.1,
      tilt: (i % 2 === 0 ? 1 : -1) * 3.5,
      hue: i % 3
    }));

    let viewW = Math.max(1, window.innerWidth);
    let viewH = Math.max(1, window.innerHeight);

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewW = Math.max(1, window.innerWidth);
      viewH = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(viewW * dpr);
      canvas.height = Math.floor(viewH * dpr);
      canvas.style.width = `${viewW}px`;
      canvas.style.height = `${viewH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let isDisposed = false;
    let currentAct: CutsceneAct = 'stasis';
    let lastTime = performance.now();

    const renderFrame = () => {
      if (isDisposed) return;

      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const sinceSync = (now - lastSyncRef.current) / 1000;
      const liveRem = Math.max(0, remainingRef.current - sinceSync);
      const progress = Math.max(0, Math.min(1, 1 - liveRem / Math.max(0.1, totalDuration)));
      const t = progress * totalDuration;

      let nextAct: CutsceneAct = 'stasis';
      if (progress >= 0.80) nextAct = 'domain';
      else if (progress >= 0.60) nextAct = 'shatter';
      else if (progress >= 0.28) nextAct = 'mirrors';

      if (nextAct !== currentAct) {
        currentAct = nextAct;
        setAct(nextAct);
      }
      setUiProgress(Math.round(progress * 1000) / 10);

      const minDim = Math.min(viewW, viewH);
      const scale = minDim / 720;
      const cx = viewW * 0.5;
      const cy = viewH * 0.5;

      // Dynamic Anime Camera Shake during Shatter peak
      let shakeX = 0;
      let shakeY = 0;
      if (!prefersReducedMotion && progress >= 0.58 && progress <= 0.78) {
        const shakeAmt = (1 - Math.abs(progress - 0.64) / 0.14) * 14 * scale;
        shakeX = Math.sin(t * 82) * Math.max(0, shakeAmt);
        shakeY = Math.cos(t * 95) * Math.max(0, shakeAmt);
      }

      // Sakuga B/W Impact Frames right around 0.605 -> 0.638 (synced to 0.62 GameEngine shatter)
      const isImpactInversion = progress >= 0.605 && progress < 0.638;
      const invertWhiteBg = progress >= 0.622 && progress < 0.638;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Background Atmosphere (Glacial Aurora Cathedral vs Sakuga Impact Frame)
      if (isImpactInversion) {
        ctx.fillStyle = invertWhiteBg ? '#f8fafc' : '#020617';
        ctx.fillRect(-30, -30, viewW + 60, viewH + 60);
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
        skyGrad.addColorStop(0, '#020713');
        skyGrad.addColorStop(0.55, progress >= 0.62 ? '#08264c' : '#061936');
        skyGrad.addColorStop(1, '#020a18');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(-30, -30, viewW + 60, viewH + 60);

        // Shimmering Sub-Zero Aurora Curtains in upper sky
        ctx.save();
        for (let band = 0; band < 3; band++) {
          const auroraGrad = ctx.createLinearGradient(0, viewH * 0.08, 0, viewH * 0.54);
          auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          auroraGrad.addColorStop(
            0.5,
            band === 1 ? 'rgba(186, 230, 253, 0.16)' : 'rgba(14, 165, 233, 0.15)'
          );
          auroraGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
          ctx.fillStyle = auroraGrad;
          ctx.beginPath();
          ctx.moveTo(0, viewH * 0.14);
          for (let px = 0; px <= viewW; px += Math.max(40, viewW / 14)) {
            const wy =
              viewH * (0.2 + band * 0.06) +
              Math.sin(px * 0.005 + t * 1.4 + band * 2.1) * 34 * scale;
            ctx.lineTo(px, wy);
          }
          ctx.lineTo(viewW, viewH * 0.54);
          ctx.lineTo(0, viewH * 0.54);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Manga Speedlines (intense during Mirror charge & Laser Shatter)
      const speedlineIntensity =
        progress < 0.28
          ? 0.28
          : progress < 0.6
            ? 0.52
            : progress < 0.8
              ? 0.92
              : 0.32;
      drawRadialSpeedlines(
        ctx,
        cx,
        cy * 0.92,
        minDim,
        t * (progress >= 0.28 ? 2.2 : 0.85),
        speedlineIntensity,
        isImpactInversion ? (invertWhiteBg ? '#020617' : '#ffffff') : '#38bdf8',
        isImpactInversion ? (invertWhiteBg ? '#0f172a' : '#bae6fd') : '#818cf8'
      );

      // 3. Sacred Glacial Mandala Clock-Stop Seal under Valkyrie
      const sealRadius = minDim * (0.24 + Math.min(0.18, progress * 0.2));
      drawFrostMandala(
        ctx,
        cx,
        viewH * 0.74,
        sealRadius,
        t * 0.85,
        isImpactInversion ? 0.85 : 0.78,
        scale,
        progress >= 0.62 ? '#e0f2fe' : '#0284c7'
      );

      // 4. Mirror Monoliths & Frozen Enemies Staging
      const monoRise = Math.min(1, Math.max(0, (progress - 0.14) / 0.22));
      const mCount = Math.max(3, Math.min(4, monolithCount));
      const monolithCoords: Array<{ x: number; y: number }> = [];

      for (let i = 0; i < mCount; i++) {
        const ang =
          -Math.PI * 0.5 +
          (i / mCount) * Math.PI * 2 +
          (progress >= 0.28 ? (progress - 0.28) * 1.15 : 0);
        const orbitR = minDim * (0.31 + (progress >= 0.64 ? 0.04 : 0));
        const mx = cx + Math.cos(ang) * orbitR;
        const my = viewH * 0.56 + Math.sin(ang) * orbitR * 0.36;
        monolithCoords.push({ x: mx, y: my });
      }

      // Draw back-row monoliths behind Valkyrie, then Valkyrie, then front-row monoliths
      for (let i = 0; i < monolithCoords.length; i++) {
        if (monolithCoords[i].y < viewH * 0.56 && monoRise > 0.01) {
          drawMirrorMonolith2D(
            ctx,
            monolithCoords[i].x,
            monolithCoords[i].y,
            158 * scale,
            56 * scale,
            monoRise,
            t * 1.4 + i * 0.3,
            isImpactInversion
          );
        }
      }

      // Frozen Enemy Ice Crystal Statues on the Arena Flanks
      const visualEnemies = Math.max(3, Math.min(5, frozenEnemiesCount || 4));
      const enemyPositions: Array<{ x: number; y: number }> = [];
      for (let e = 0; e < visualEnemies; e++) {
        const side = e % 2 === 0 ? -1 : 1;
        const tier = Math.floor(e / 2);
        const ex = cx + side * (minDim * (0.36 + tier * 0.15));
        const ey = viewH * (0.58 + (e % 3) * 0.08);
        enemyPositions.push({ x: ex, y: ey });
        if (progress >= 0.16 && progress < 0.78) {
          drawFrozenTargetStatue2D(ctx, ex, ey, scale * (0.86 - tier * 0.12), isImpactInversion);
        }
      }

      // 5. Valkyrie Frost Stylized Cel-Shaded Hero Figure
      const valkyriePose: 'stasis' | 'sweep' | 'sovereign' =
        progress < 0.3 ? 'stasis' : progress < 0.76 ? 'sweep' : 'sovereign';
      const valkyrieScale =
        scale *
        (progress < 0.28
          ? 0.94 + (progress / 0.28) * 0.08
          : progress < 0.64
            ? 1.02 + Math.sin(((progress - 0.28) / 0.36) * Math.PI) * 0.1
            : 1.08);
      drawValkyrieAnime2D(
        ctx,
        cx,
        viewH * 0.74,
        valkyrieScale,
        t,
        valkyriePose,
        isImpactInversion
      );

      // Front-row monoliths
      for (let i = 0; i < monolithCoords.length; i++) {
        if (monolithCoords[i].y >= viewH * 0.56 && monoRise > 0.01) {
          drawMirrorMonolith2D(
            ctx,
            monolithCoords[i].x,
            monolithCoords[i].y,
            174 * scale,
            62 * scale,
            monoRise,
            t * 1.4 + i * 0.3,
            isImpactInversion
          );
        }
      }

      // 6. Prismatic Optical Laser Web Ricocheting Through Monoliths & Enemies (Act II–III)
      if (progress >= 0.34 && progress <= 0.84) {
        const beamAlpha =
          progress < 0.44
            ? (progress - 0.34) / 0.1
            : progress > 0.74
              ? 1 - (progress - 0.74) / 0.1
              : 1;
        const beamWidthScale = progress >= 0.6 && progress <= 0.74 ? 2.2 : 1.0;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, beamAlpha));
        ctx.lineCap = 'round';

        // Lance core -> each Monolith + Monolith ring perimeter
        const originX = cx + 22 * scale;
        const originY = viewH * 0.52;
        for (let i = 0; i < monolithCoords.length; i++) {
          const m1 = monolithCoords[i];
          const m2 = monolithCoords[(i + 1) % monolithCoords.length];

          // Outer glow stroke
          ctx.strokeStyle = isImpactInversion ? '#ffffff' : 'rgba(56, 189, 248, 0.78)';
          ctx.lineWidth = 8.5 * scale * beamWidthScale;
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(m1.x, m1.y);
          ctx.lineTo(m2.x, m2.y);
          ctx.stroke();

          // Sharp white anime laser core
          ctx.strokeStyle = isImpactInversion ? '#020617' : '#f0f9ff';
          ctx.lineWidth = 3.2 * scale * beamWidthScale;
          ctx.stroke();
        }

        // Strike rays piercing Frozen Enemy Crystals at peak (0.60 -> 0.80)
        if (progress >= 0.58) {
          const strikeGrow = Math.min(1, (progress - 0.58) / 0.08);
          for (let e = 0; e < enemyPositions.length; e++) {
            const tgt = enemyPositions[e];
            const src = monolithCoords[e % monolithCoords.length];
            const endX = src.x + (tgt.x - src.x) * strikeGrow;
            const endY = src.y + (tgt.y - src.y) * strikeGrow;

            ctx.strokeStyle = isImpactInversion ? '#ffffff' : '#7dd3fc';
            ctx.lineWidth = 10 * scale;
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.4 * scale;
            ctx.stroke();

            // Anime Diamond Cross-Slash Spark at impact point
            if (strikeGrow >= 0.9) {
              const sRad = (24 + Math.sin(t * 28 + e) * 6) * scale;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.moveTo(tgt.x, tgt.y - sRad * 1.4);
              ctx.lineTo(tgt.x + sRad * 0.28, tgt.y - sRad * 0.28);
              ctx.lineTo(tgt.x + sRad * 1.4, tgt.y);
              ctx.lineTo(tgt.x + sRad * 0.28, tgt.y + sRad * 0.28);
              ctx.lineTo(tgt.x, tgt.y + sRad * 1.4);
              ctx.lineTo(tgt.x - sRad * 0.28, tgt.y + sRad * 0.28);
              ctx.lineTo(tgt.x - sRad * 1.4, tgt.y);
              ctx.lineTo(tgt.x - sRad * 0.28, tgt.y - sRad * 0.28);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }

      // 7. Shatter Shockwave Rings + Flying Crystal Shards (0.62 -> 0.86)
      if (progress >= 0.62 && progress <= 0.86) {
        const expP = (progress - 0.62) / 0.24;
        ctx.save();
        ctx.strokeStyle = '#bae6fd';
        ctx.globalAlpha = Math.max(0, 1 - expP);
        ctx.lineWidth = Math.max(1.5, (1 - expP) * 14 * scale);
        ctx.beginPath();
        ctx.arc(cx, cy, expP * minDim * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = Math.max(1, (1 - expP) * 8 * scale);
        ctx.beginPath();
        ctx.arc(cx, cy, expP * minDim * 0.62, 0, Math.PI * 2);
        ctx.stroke();

        // Flying faceted ice shards bursting outward
        for (let i = 0; i < shards.length; i++) {
          const s = shards[i];
          const r = (s.distFactor + expP * s.speed * 0.72) * minDim;
          const sx = cx + Math.cos(s.angle) * r;
          const sy = cy + Math.sin(s.angle) * r;
          const sz = s.size * scale * (1 - expP * 0.45);
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(s.rot + expP * s.tilt);
          ctx.globalAlpha = Math.max(0, (1 - expP) * 0.92);
          ctx.fillStyle = s.hue === 0 ? '#e0f2fe' : s.hue === 1 ? '#38bdf8' : '#a5b4fc';
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.moveTo(0, -sz);
          ctx.lineTo(sz * 0.55, 0);
          ctx.lineTo(0, sz * 0.8);
          ctx.lineTo(-sz * 0.45, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 8. Act I Diagonal Anime Eye Cut-In Strip (0.05 -> 0.29)
      if (progress >= 0.05 && progress <= 0.29) {
        const enterP = Math.min(1, (progress - 0.05) / 0.06);
        const exitP = Math.max(0, (progress - 0.23) / 0.06);
        drawValkyrieEyeCutIn2D(ctx, viewW, viewH, minDim, enterP, exitP, t);
      }

      // 9. Drifting Anime Snow Petals & Ice Motes
      if (!isImpactInversion) {
        ctx.save();
        for (let i = 0; i < petals.length; i++) {
          const pt = petals[i];
          if (!prefersReducedMotion) {
            pt.x = (pt.x + pt.vx * dt + 1) % 1;
            pt.y = (pt.y + pt.vy * dt) % 1;
            pt.rot += pt.rotSpeed * dt;
          }
          const px = pt.x * viewW;
          const py = pt.y * viewH;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(pt.rot);
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = i % 3 === 0 ? '#e0f2fe' : '#7dd3fc';
          ctx.beginPath();
          ctx.moveTo(0, -pt.size * scale);
          ctx.lineTo(pt.size * 0.55 * scale, 0);
          ctx.lineTo(0, pt.size * scale);
          ctx.lineTo(-pt.size * 0.55 * scale, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // 10. Crisp Shatter White Transition Pulse (0.638 -> 0.695, non-blinding)
      if (progress >= 0.638 && progress < 0.695) {
        const flashA = 1 - (progress - 0.638) / 0.057;
        ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0, flashA * 0.45)})`;
        ctx.fillRect(-30, -30, viewW + 60, viewH + 60);
      }

      // 11. Anime Cinema Letterbox Bars
      const barH = Math.round(viewH * 0.072);
      ctx.fillStyle = '#020612';
      ctx.fillRect(-30, -30, viewW + 60, barH + 30);
      ctx.fillRect(-30, viewH - barH, viewW + 60, barH + 30);

      ctx.restore();

      frameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      canvas.remove();
    };
  }, [frozenEnemiesCount, monolithCount, totalDuration]);

  const meta = ACT_META[act];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020713] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 2D Anime Valkyrie Frost"
    >
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Cinematic Header (solid dark surface, zero backdrop-filter, zero static pills) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 py-3.5 sm:px-8 sm:py-4 bg-[#020817]/94 border-b border-sky-400/35 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-game text-sky-300 tracking-wide truncate">
            <span>2D Anime</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="truncate">{meta.kicker}</span>
          </div>
          <h2 className="mt-0.5 font-title text-lg sm:text-2xl font-black tracking-wider text-white truncate">
            SUB-ZERO EPOCH: MIRROR DIMENSION
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-200/90 font-game truncate">
            {meta.subtitle}
          </p>
        </div>

        <div className="hidden md:flex flex-col items-end text-right shrink-0">
          <span className="text-[11px] font-mono tabular-nums text-sky-300">
            {monolithCount} Monolith Cermin · {frozenEnemiesCount > 0 ? `${frozenEnemiesCount} Target Beku` : 'Absolute Zero'}
          </span>
          <span className="mt-0.5 font-title text-xs font-bold tracking-wider text-cyan-100">
            VALKYRIE FROST
          </span>
        </div>
      </div>

      {/* Bottom Bar: Skip Control + Progress Track */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 py-3 sm:px-8 sm:py-4 bg-[#020817]/94 border-t border-sky-400/35 flex items-center justify-between gap-4">
        <p className="text-xs font-mono tabular-nums text-sky-200/90 truncate">
          {meta.kicker} · {Math.round(uiProgress)}%
        </p>

        <button
          type="button"
          onClick={() => onSkipRef.current()}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-slate-950 hover:bg-sky-950 border border-sky-400/60 hover:border-cyan-300 text-slate-100 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-sky-300" />
        </button>

        {/* Bottom Progress Bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
