import * as THREE from 'three';

export interface AnomalyRiftWalkerRig {
  root: THREE.Group;
  body: THREE.Group;
  scarfSegments: THREE.Mesh[];
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  katanaGlows: THREE.MeshBasicMaterial[];
}

export interface AnomalyHeroAnomaliRig {
  root: THREE.Group;
  body: THREE.Group;
  chestCore: THREE.Mesh;
  chestCoreMat: THREE.MeshBasicMaterial;
  crownHalo: THREE.Group;
  leftWings: THREE.Group[];
  rightWings: THREE.Group[];
  fusionOrbs: THREE.Mesh[];
  weaponPivot: THREE.Group;
}

export interface AnomalyCloneAnomaliRig {
  root: THREE.Group;
  body: THREE.Group;
  scarfSegments: THREE.Mesh[];
  backHalo: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
}

export interface AnimeToonPalette {
  toonGradTex: THREE.DataTexture;
  inkOutlineMat: THREE.MeshBasicMaterial;
}

export function addAnimeInkOutline(
  mesh: THREE.Mesh,
  inkOutlineMat: THREE.MeshBasicMaterial,
  thickness = 1.055
): THREE.Mesh {
  const outline = new THREE.Mesh(mesh.geometry, inkOutlineMat);
  outline.scale.setScalar(thickness);
  mesh.add(outline);
  return outline;
}

/**
 * Procedural high-DPI dimensional mandala floor texture (no external URLs / zero 404).
 */
export function createAnomalyStageTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size * 0.5;
    const cy = size * 0.5;

    const bg = ctx.createRadialGradient(cx, cy, 24, cx, cy, size * 0.5);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.45, '#0f172a');
    bg.addColorStop(0.82, '#090d1f');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Subtle radial coordinate grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90);
      ctx.lineTo(cx + Math.cos(a) * 490, cy + Math.sin(a) * 490);
      ctx.stroke();
    }

    // Concentric anime magic circles
    const rings = [
      { r: 465, color: 'rgba(232, 121, 249, 0.72)', w: 6, dash: [24, 12] },
      { r: 420, color: 'rgba(34, 211, 238, 0.80)', w: 4, dash: [] },
      { r: 340, color: 'rgba(251, 191, 36, 0.58)', w: 3, dash: [14, 10] },
      { r: 240, color: 'rgba(232, 121, 249, 0.72)', w: 4, dash: [] },
      { r: 140, color: 'rgba(34, 211, 238, 0.92)', w: 5, dash: [10, 6] }
    ];
    for (const ring of rings) {
      ctx.save();
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.w;
      ctx.setLineDash(ring.dash);
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Overlapping hexagrams
    ctx.save();
    ctx.translate(cx, cy);
    for (let h = 0; h < 2; h++) {
      ctx.save();
      ctx.rotate((h * Math.PI) / 6);
      ctx.strokeStyle = h === 0 ? 'rgba(34, 211, 238, 0.65)' : 'rgba(232, 121, 249, 0.65)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * 340;
        const py = Math.sin(a) * 340;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Glowing inner core
    const core = ctx.createRadialGradient(cx, cy, 4, cx, cy, 130);
    core.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    core.addColorStop(0.35, 'rgba(34, 211, 238, 0.42)');
    core.addColorStop(0.7, 'rgba(232, 121, 249, 0.2)');
    core.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 130, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

/**
 * Multi-part Cel-Shaded 3D Anime Rift Walker (Cyber-Quantum Assassin).
 * Grounded at y = 0 at bottom-center pivot.
 */
export function buildAnimeRiftWalker3D(
  palette: AnimeToonPalette,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T
): AnomalyRiftWalkerRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const navySuitMat = trackMat(
    new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: palette.toonGradTex })
  );
  const armorPlateMat = trackMat(
    new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: palette.toonGradTex })
  );
  const cyanTrimMat = trackMat(
    new THREE.MeshToonMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
      gradientMap: palette.toonGradTex
    })
  );
  const hairMat = trackMat(
    new THREE.MeshToonMaterial({ color: 0x164e63, gradientMap: palette.toonGradTex })
  );
  const scarfMat = trackMat(
    new THREE.MeshToonMaterial({
      color: 0x06b6d4,
      emissive: 0x0e7490,
      emissiveIntensity: 0.42,
      gradientMap: palette.toonGradTex,
      side: THREE.DoubleSide
    })
  );
  const chromeBladeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.16
    })
  );

  // Legs / greaves grounded at y = 0
  const legGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.09, 0.85, 8));
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, navySuitMat);
    leg.position.set(side * 0.17, 0.425, 0);
    leg.castShadow = true;
    addAnimeInkOutline(leg, palette.inkOutlineMat, 1.07);
    body.add(leg);

    const shin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.42, 0.2)), cyanTrimMat);
    shin.position.set(side * 0.17, 0.28, 0.04);
    addAnimeInkOutline(shin, palette.inkOutlineMat, 1.06);
    body.add(shin);
  }

  // Torso & Tactical Coat
  const torso = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.28, 0.2, 0.78, 8)), armorPlateMat);
  torso.position.y = 1.2;
  torso.castShadow = true;
  addAnimeInkOutline(torso, palette.inkOutlineMat, 1.06);
  body.add(torso);

  const chestCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.11, 0)), cyanTrimMat);
  chestCore.position.set(0, 1.32, 0.23);
  body.add(chestCore);

  // Coat tails
  const coatTailGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.62, 0.07));
  const coatTail = new THREE.Mesh(coatTailGeo, navySuitMat);
  coatTail.position.set(0, 0.72, -0.18);
  coatTail.rotation.x = 0.22;
  addAnimeInkOutline(coatTail, palette.inkOutlineMat, 1.055);
  body.add(coatTail);

  // Head & Anime Spiky Hair + Glowing Visor
  const head = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.22, 12, 10)), armorPlateMat);
  head.position.y = 1.82;
  head.castShadow = true;
  addAnimeInkOutline(head, palette.inkOutlineMat, 1.065);
  body.add(head);

  const visor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.32, 0.09, 0.14)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0x67e8f9 }))
  );
  visor.position.set(0, 1.83, 0.17);
  body.add(visor);

  const spikeGeo = trackGeo(new THREE.ConeGeometry(0.09, 0.34, 5));
  const spikeConfigs = [
    { pos: [0, 2.06, -0.02], rot: [-0.35, 0, 0] },
    { pos: [-0.15, 1.99, -0.06], rot: [-0.25, 0, 0.55] },
    { pos: [0.15, 1.99, -0.06], rot: [-0.25, 0, -0.55] },
    { pos: [-0.1, 1.94, -0.18], rot: [-0.75, 0, 0.3] },
    { pos: [0.1, 1.94, -0.18], rot: [-0.75, 0, -0.3] }
  ];
  for (const cfg of spikeConfigs) {
    const spike = new THREE.Mesh(spikeGeo, hairMat);
    spike.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    spike.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    addAnimeInkOutline(spike, palette.inkOutlineMat, 1.07);
    body.add(spike);
  }

  // Flowing 3-segment anime scarf
  const scarfSegments: THREE.Mesh[] = [];
  const scarfGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.06, 0.55));
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(scarfGeo, scarfMat);
    seg.position.set(0, 1.58 - i * 0.08, -0.34 - i * 0.46);
    addAnimeInkOutline(seg, palette.inkOutlineMat, 1.06);
    body.add(seg);
    scarfSegments.push(seg);
  }

  // Arms + Twin Quantum Rift Katanas
  const katanaGlows: THREE.MeshBasicMaterial[] = [];
  const buildKatanaArm = (side: -1 | 1) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.36, 1.48, 0.04);

    const shoulder = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.16, 0.2)), cyanTrimMat);
    addAnimeInkOutline(shoulder, palette.inkOutlineMat, 1.06);
    armGroup.add(shoulder);

    const forearm = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.075, 0.06, 0.52, 7)), armorPlateMat);
    forearm.position.set(0, -0.24, 0.14);
    forearm.rotation.x = -0.6;
    addAnimeInkOutline(forearm, palette.inkOutlineMat, 1.06);
    armGroup.add(forearm);

    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0, -0.4, 0.34);
    bladeGroup.rotation.x = 0.55;

    const hilt = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 6)), armorPlateMat);
    bladeGroup.add(hilt);

    const blade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.035, 1.15, 0.09)), chromeBladeMat);
    blade.position.y = 0.68;
    addAnimeInkOutline(blade, palette.inkOutlineMat, 1.06);
    bladeGroup.add(blade);

    const edgeGlowMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    katanaGlows.push(edgeGlowMat);
    const edgeGlow = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.045, 1.12, 0.035)), edgeGlowMat);
    edgeGlow.position.set(0, 0.68, 0.045);
    bladeGroup.add(edgeGlow);

    armGroup.add(bladeGroup);
    body.add(armGroup);
    return armGroup;
  };

  const leftArm = buildKatanaArm(-1);
  const rightArm = buildKatanaArm(1);

  return { root, body, scarfSegments, leftArm, rightArm, katanaGlows };
}

/**
 * Towering Multi-Part Cel-Shaded 3D Hero Anomali (Fusion of All Heroes).
 */
export function buildAnimeHeroAnomali3D(
  palette: AnimeToonPalette,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T
): AnomalyHeroAnomaliRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const cosmicArmorMat = trackMat(
    new THREE.MeshToonMaterial({ color: 0x3b0764, gradientMap: palette.toonGradTex })
  );
  const goldTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0x92400e,
      emissiveIntensity: 0.25
    })
  );
  const hornMat = trackMat(
    new THREE.MeshToonMaterial({
      color: 0xfb7185,
      emissive: 0x9f1239,
      emissiveIntensity: 0.35,
      gradientMap: palette.toonGradTex
    })
  );
  const chestCoreMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xe879f9 }));

  // Lower ethereal robe + greaves
  const robe = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.65, 1.45, 10, 1, true)), cosmicArmorMat);
  robe.position.y = 0.72;
  addAnimeInkOutline(robe, palette.inkOutlineMat, 1.05);
  body.add(robe);

  // Armored upper chest & pauldron shoulders
  const torso = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.3, 1.05, 8)), cosmicArmorMat);
  torso.position.y = 1.65;
  torso.castShadow = true;
  addAnimeInkOutline(torso, palette.inkOutlineMat, 1.055);
  body.add(torso);

  const chestCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.22, 0)), chestCoreMat);
  chestCore.position.set(0, 1.72, 0.34);
  body.add(chestCore);

  for (const side of [-1, 1]) {
    const pauldron = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.28, 0.56, 6)), goldTrimMat);
    pauldron.position.set(side * 0.62, 2.02, 0);
    pauldron.rotation.z = side * -0.85;
    addAnimeInkOutline(pauldron, palette.inkOutlineMat, 1.06);
    body.add(pauldron);
  }

  // Head + Archfiend Horns + Crown Halo
  const head = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.28, 12, 10)), cosmicArmorMat);
  head.position.y = 2.45;
  addAnimeInkOutline(head, palette.inkOutlineMat, 1.06);
  body.add(head);

  const eyes = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.36, 0.08, 0.16)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0xfde047 }))
  );
  eyes.position.set(0, 2.47, 0.22);
  body.add(eyes);

  const hornGeo = trackGeo(new THREE.ConeGeometry(0.08, 0.65, 6));
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(side * 0.24, 2.8, -0.02);
    horn.rotation.z = side * -0.48;
    horn.rotation.x = -0.2;
    addAnimeInkOutline(horn, palette.inkOutlineMat, 1.065);
    body.add(horn);
  }

  const crownHalo = new THREE.Group();
  crownHalo.position.set(0, 2.95, 0);
  const haloRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.62, 0.045, 8, 28)), goldTrimMat);
  haloRing.rotation.x = Math.PI * 0.5;
  crownHalo.add(haloRing);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.09, 0)), goldTrimMat);
    spike.position.set(Math.cos(a) * 0.62, 0.05, Math.sin(a) * 0.62);
    crownHalo.add(spike);
  }
  body.add(crownHalo);

  // 6 Prismatic Seraph + Arbiter Wings (3 pairs)
  const wingColors = [0xfbbf24, 0xe879f9, 0x22d3ee];
  const leftWings: THREE.Group[] = [];
  const rightWings: THREE.Group[] = [];
  const wingBladeGeo = trackGeo(new THREE.BoxGeometry(1.55, 0.24, 0.05));

  for (let side of [-1, 1] as const) {
    for (let w = 0; w < 3; w++) {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.38, 1.95 - w * 0.24, -0.25);
      const wingMat = trackMat(
        new THREE.MeshToonMaterial({
          color: wingColors[w],
          emissive: wingColors[w],
          emissiveIntensity: 0.42,
          gradientMap: palette.toonGradTex
        })
      );
      const feather = new THREE.Mesh(wingBladeGeo, wingMat);
      feather.position.x = side * (0.95 - w * 0.12);
      feather.rotation.z = side * (0.45 - w * 0.28);
      addAnimeInkOutline(feather, palette.inkOutlineMat, 1.055);
      wingPivot.add(feather);
      body.add(wingPivot);
      if (side === -1) leftWings.push(wingPivot);
      else rightWings.push(wingPivot);
    }
  }

  // Weapon Pivot: Cosmic Fusion Halberd-Katana
  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0.66, 1.65, 0.22);
  const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8)), goldTrimMat);
  weaponPivot.add(shaft);
  const halberdBlade = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.18, 0.95, 4)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0xf0abfc }))
  );
  halberdBlade.position.y = 1.45;
  addAnimeInkOutline(halberdBlade, palette.inkOutlineMat, 1.06);
  weaponPivot.add(halberdBlade);
  weaponPivot.rotation.z = -0.35;
  weaponPivot.rotation.x = 0.2;
  body.add(weaponPivot);

  // 6 Orbiting Elemental Fusion Orbs
  const orbColors = [0xf59e0b, 0xa855f7, 0x38bdf8, 0xf97316, 0xe11d48, 0x10b981];
  const fusionOrbs: THREE.Mesh[] = [];
  const orbGeo = trackGeo(new THREE.OctahedronGeometry(0.15, 1));
  for (let i = 0; i < orbColors.length; i++) {
    const orb = new THREE.Mesh(
      orbGeo,
      trackMat(new THREE.MeshBasicMaterial({ color: orbColors[i] }))
    );
    addAnimeInkOutline(orb, palette.inkOutlineMat, 1.12);
    body.add(orb);
    fusionOrbs.push(orb);
  }

  return {
    root,
    body,
    chestCore,
    chestCoreMat,
    crownHalo,
    leftWings,
    rightWings,
    fusionOrbs,
    weaponPivot
  };
}

/**
 * Cel-Shaded 3D Clone Anomali (Inherits all hero passives, radiant cyan-prismatic twin).
 */
export function buildAnimeCloneAnomali3D(
  palette: AnimeToonPalette,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T
): AnomalyCloneAnomaliRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const silverCyanArmorMat = trackMat(
    new THREE.MeshToonMaterial({
      color: 0xe0f2fe,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      gradientMap: palette.toonGradTex
    })
  );
  const prismCoreMat = trackMat(
    new THREE.MeshToonMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.65,
      gradientMap: palette.toonGradTex
    })
  );
  const magentaAccentMat = trackMat(
    new THREE.MeshToonMaterial({
      color: 0xe879f9,
      emissive: 0xa21caf,
      emissiveIntensity: 0.45,
      gradientMap: palette.toonGradTex
    })
  );

  // Legs
  const legGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.085, 0.85, 8));
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, silverCyanArmorMat);
    leg.position.set(side * 0.17, 0.425, 0);
    leg.castShadow = true;
    addAnimeInkOutline(leg, palette.inkOutlineMat, 1.07);
    body.add(leg);
  }

  // Torso
  const torso = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.3, 0.21, 0.82, 8)), silverCyanArmorMat);
  torso.position.y = 1.22;
  torso.castShadow = true;
  addAnimeInkOutline(torso, palette.inkOutlineMat, 1.06);
  body.add(torso);

  const core = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.13, 0)), magentaAccentMat);
  core.position.set(0, 1.34, 0.25);
  body.add(core);

  // Head + Prismatic Crest
  const head = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.22, 12, 10)), silverCyanArmorMat);
  head.position.y = 1.84;
  addAnimeInkOutline(head, palette.inkOutlineMat, 1.065);
  body.add(head);

  const visor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.33, 0.085, 0.14)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0xfde047 }))
  );
  visor.position.set(0, 1.85, 0.17);
  body.add(visor);

  const hornGeo = trackGeo(new THREE.ConeGeometry(0.07, 0.36, 5));
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(hornGeo, prismCoreMat);
    horn.position.set(side * 0.15, 2.08, 0);
    horn.rotation.z = side * -0.4;
    addAnimeInkOutline(horn, palette.inkOutlineMat, 1.07);
    body.add(horn);
  }

  // Flowing prismatic scarf
  const scarfSegments: THREE.Mesh[] = [];
  const scarfGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.06, 0.56));
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(scarfGeo, i === 1 ? magentaAccentMat : prismCoreMat);
    seg.position.set(0, 1.58 - i * 0.08, -0.34 - i * 0.48);
    addAnimeInkOutline(seg, palette.inkOutlineMat, 1.06);
    body.add(seg);
    scarfSegments.push(seg);
  }

  // Rotating Back Chakra / Anomaly Halo behind shoulders
  const backHalo = new THREE.Group();
  backHalo.position.set(0, 1.56, -0.32);
  const backRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.75, 0.03, 6, 28)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0x67e8f9 }))
  );
  backHalo.add(backRing);
  const orbColors = [0xf59e0b, 0xa855f7, 0x38bdf8, 0xf97316, 0xe11d48, 0x10b981];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pip = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(0.08, 0)),
      trackMat(new THREE.MeshBasicMaterial({ color: orbColors[i] }))
    );
    pip.position.set(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0);
    backHalo.add(pip);
  }
  body.add(backHalo);

  // Arms + Prismatic Blades
  const buildCloneArm = (side: -1 | 1) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.37, 1.48, 0.04);

    const shoulder = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), magentaAccentMat);
    addAnimeInkOutline(shoulder, palette.inkOutlineMat, 1.07);
    arm.add(shoulder);

    const blade = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.045, 1.25, 0.1)),
      trackMat(new THREE.MeshBasicMaterial({ color: side === -1 ? 0x22d3ee : 0xf0abfc }))
    );
    blade.position.set(0, 0.25, 0.42);
    blade.rotation.x = 0.65;
    addAnimeInkOutline(blade, palette.inkOutlineMat, 1.07);
    arm.add(blade);

    body.add(arm);
    return arm;
  };

  const leftArm = buildCloneArm(-1);
  const rightArm = buildCloneArm(1);

  return { root, body, scarfSegments, backHalo, leftArm, rightArm };
}
