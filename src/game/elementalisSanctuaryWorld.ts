import * as THREE from 'three';

/**
 * Deterministic heightfield matching Elementalis's Primordial Sanctuary lore:
 * - Central flat mossy clearing for readable combat
 * - Carved lake basin on front-left (-x, +z)
 * - Winding stream from upper-right cliff (+x, -z)
 * - Rolling verdant hills and rising mountain foothills around the perimeter
 */
export function computeSanctuaryHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);

  // Carved Lake Basin in the front-left valley quadrant (-x, +z)
  const lx = x + 6.8;
  const lz = z - 5.2;
  const lakeEllip = Math.hypot(lx / 6.6, lz / 4.8);
  const lakeCarve = lakeEllip < 1.3 ? -2.05 * Math.pow(Math.max(0, 1 - lakeEllip / 1.3), 1.45) : 0;

  // Winding Stream feeding the lake from the upper-right waterfall cliff
  const streamDist = Math.abs(z - 1.5 + 0.55 * (x - 1.5) - Math.sin(x * 0.28) * 1.4);
  const inStreamSpan = x > -7.5 && x < 11.5 && z > -8.5 && z < 8.5;
  const streamCarve =
    inStreamSpan && r > 3.2 && streamDist < 1.9
      ? -0.82 * Math.pow(1 - streamDist / 1.9, 1.5)
      : 0;

  // Central flat grassy sanctuary clearing (so altar & combat zone look readable)
  const centerFlatten = THREE.MathUtils.smoothstep(r, 2.8, 9.5);

  // Rolling organic hills & plains
  const rollingHills =
    (Math.sin(x * 0.22) * Math.cos(z * 0.2) * 0.85 +
      Math.sin(x * 0.48 + z * 0.36) * 0.35 +
      Math.cos(x * 0.14 - z * 0.16) * 0.65) *
    centerFlatten;

  // Outer valley foothills rising toward the surrounding mountains
  const rimRise = r > 12.5 ? Math.pow((r - 12.5) / 8.5, 1.6) * 3.8 : 0;

  // Elevated rocky promontory for the Ancient Spirit Tree & Waterfall Cliff (+x, -z)
  const cliffDist = Math.hypot(x - 8.8, z + 8.4);
  const cliffBump = cliffDist < 6.0 ? Math.pow(1 - cliffDist / 6.0, 1.5) * 3.2 : 0;

  return Math.max(-2.15, lakeCarve + streamCarve + rollingHills + rimRise + cliffBump);
}

export function createSanctuaryWaterTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const waterCanvas = document.createElement('canvas');
  waterCanvas.width = 512;
  waterCanvas.height = 512;
  const wctx = waterCanvas.getContext('2d');
  if (wctx) {
    wctx.fillStyle = '#0284c7';
    wctx.fillRect(0, 0, 512, 512);
    const wg = wctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    wg.addColorStop(0, '#38bdf8');
    wg.addColorStop(0.55, '#0ea5e9');
    wg.addColorStop(1, '#0369a1');
    wctx.fillStyle = wg;
    wctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 65; i++) {
      const rx = (i * 89) % 512;
      const ry = (i * 137) % 512;
      const rr = 22 + (i % 5) * 14;
      wctx.strokeStyle = i % 2 === 0 ? 'rgba(186, 230, 253, 0.34)' : 'rgba(94, 234, 212, 0.25)';
      wctx.lineWidth = 2.2;
      wctx.beginPath();
      wctx.ellipse(rx, ry, rr, rr * 0.55, (i % 6) * 0.4, 0, Math.PI * 2);
      wctx.stroke();
    }
  }
  const waterTex = new THREE.CanvasTexture(waterCanvas);
  waterTex.colorSpace = THREE.SRGBColorSpace;
  waterTex.wrapS = THREE.RepeatWrapping;
  waterTex.wrapT = THREE.RepeatWrapping;
  waterTex.repeat.set(3, 3);
  waterTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return waterTex;
}

export function createSanctuaryWaterfallTexture(): THREE.CanvasTexture {
  const fallCanvas = document.createElement('canvas');
  fallCanvas.width = 256;
  fallCanvas.height = 512;
  const fctx = fallCanvas.getContext('2d');
  if (fctx) {
    const fg = fctx.createLinearGradient(0, 0, 256, 0);
    fg.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
    fg.addColorStop(0.25, 'rgba(125, 211, 252, 0.85)');
    fg.addColorStop(0.5, 'rgba(240, 249, 255, 0.95)');
    fg.addColorStop(0.75, 'rgba(125, 211, 252, 0.85)');
    fg.addColorStop(1, 'rgba(14, 165, 233, 0.2)');
    fctx.fillStyle = fg;
    fctx.fillRect(0, 0, 256, 512);

    for (let i = 0; i < 40; i++) {
      const sx = 28 + ((i * 53) % 200);
      const sy = (i * 37) % 512;
      fctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      fctx.fillRect(sx, sy, 4 + (i % 5), 42 + (i % 30));
    }
  }
  const fallTex = new THREE.CanvasTexture(fallCanvas);
  fallTex.colorSpace = THREE.SRGBColorSpace;
  fallTex.wrapS = THREE.RepeatWrapping;
  fallTex.wrapT = THREE.RepeatWrapping;
  fallTex.repeat.set(1, 2);
  return fallTex;
}

export function createSanctuarySkyTexture(): THREE.CanvasTexture {
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const sctx = skyCanvas.getContext('2d');
  if (sctx) {
    const sg = sctx.createLinearGradient(0, 0, 0, 512);
    sg.addColorStop(0.0, '#04121b');
    sg.addColorStop(0.35, '#0b2c3b');
    sg.addColorStop(0.62, '#134e4a');
    sg.addColorStop(0.82, '#fbbf24');
    sg.addColorStop(1.0, '#062124');
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 16; i++) {
      const cx = (i * 73) % 512;
      const cy = 150 + ((i * 41) % 140);
      const cg = sctx.createRadialGradient(cx, cy, 4, cx, cy, 85);
      cg.addColorStop(0, 'rgba(94, 234, 212, 0.2)');
      cg.addColorStop(1, 'rgba(15, 23, 42, 0)');
      sctx.fillStyle = cg;
      sctx.fillRect(0, 0, 512, 512);
    }
  }
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  return skyTex;
}
