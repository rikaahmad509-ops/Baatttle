import * as THREE from 'three';

/**
 * Deterministic heightfield for Demon Raised's Heaven & Hell Arena (Surga & Neraka):
 * - Central combat clearing (r < 9.5) stays relatively flat for crystal-clear 2D/3D gameplay alignment
 * - Left flank (-x): Celestial Sanctum marble terraces & alabaster ridge
 * - Right flank (+x): Infernal Obsidian Abyss, lava crater on front-right, & magma channel
 * - Outer dividing twilight rift chasm along x ~ 0 (outside the playable center clearing)
 */
export function computeHeavenHellHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const centerFlatten = THREE.MathUtils.smoothstep(r, 4.0, 10.5);

  // Left Side: Celestial Marble Terraces (Surga)
  const heavenSide = THREE.MathUtils.smoothstep(-x, 1.0, 7.5);
  const terraceRaw = Math.floor((Math.max(0, -x - 6.0) * 0.35 + Math.cos(z * 0.22) * 0.6)) * 0.55;
  const heavenHills =
    heavenSide *
    centerFlatten *
    (0.45 + Math.sin(x * 0.25) * Math.cos(z * 0.25) * 0.45 + Math.max(0, terraceRaw) * 0.45);

  // Right Side: Infernal Obsidian Crags & Lava Crater (Neraka)
  const hellSide = THREE.MathUtils.smoothstep(x, 1.0, 7.5);
  const jaggedCrags =
    hellSide *
    centerFlatten *
    (Math.abs(Math.sin(x * 0.34 + z * 0.28)) * 1.15 + Math.cos(x * 0.52 - z * 0.44) * 0.42);

  // Magma Crater Pool on front-right (+x, +z)
  const lx = x - 7.4;
  const lz = z - 4.8;
  const lavaEllip = Math.hypot(lx / 5.4, lz / 4.2);
  const lavaCarve =
    lavaEllip < 1.25 ? -1.85 * Math.pow(Math.max(0, 1 - lavaEllip / 1.25), 1.4) : 0;

  // Winding Magma Channel from back-right ridge into the lava pool
  const riverDist = Math.abs(z - (-0.55 * (x - 7.4) + 4.8 - Math.sin(z * 0.32) * 1.1));
  const inRiver = x > 3.2 && x < 16.0 && z > -10.5 && z < 6.0;
  const riverCarve =
    inRiver && r > 5.0 && riverDist < 1.55
      ? -0.82 * Math.pow(1 - riverDist / 1.55, 1.45)
      : 0;

  // Outer perimeter mountain rise
  const rimRise = r > 12.8 ? Math.pow((r - 12.8) / 8.2, 1.55) * 3.9 : 0;

  // Dividing Twilight Seam Chasm outside central fighting zone
  const riftChasm =
    r > 7.2 && Math.abs(x) < 1.5
      ? -0.95 * (1 - Math.abs(x) / 1.5) * THREE.MathUtils.smoothstep(r, 7.2, 11.5)
      : 0;

  return Math.max(-2.0, heavenHills + jaggedCrags + lavaCarve + riverCarve + rimRise + riftChasm);
}

export function createHeavenMarbleTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(256, 256, 24, 256, 256, 256);
    g.addColorStop(0, '#fef9c3');
    g.addColorStop(0.55, '#bae6fd');
    g.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 26; i++) {
      const y = (i * 43) % 512;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(170, y + ((i % 3) - 1) * 36, 340, y - ((i % 2) * 28), 512, y + 18);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

export function createHellLavaTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(0, 0, 512, 512);
    const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    g.addColorStop(0, '#fde047');
    g.addColorStop(0.35, '#f97316');
    g.addColorStop(0.75, '#dc2626');
    g.addColorStop(1, '#450a0a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 42; i++) {
      const rx = (i * 97) % 512;
      const ry = (i * 131) % 512;
      const rr = 16 + (i % 5) * 14;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(254, 240, 138, 0.45)' : 'rgba(251, 113, 133, 0.38)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rr, rr * 0.55, (i % 5) * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

export function createHeavenHellSkyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    // Horizontal Heaven (Gold/Azure) -> Twilight Center -> Hell (Crimson/Obsidian)
    const hg = ctx.createLinearGradient(0, 0, 512, 0);
    hg.addColorStop(0.0, '#1e3a5f');
    hg.addColorStop(0.28, '#0e7490');
    hg.addColorStop(0.47, '#fde047');
    hg.addColorStop(0.5, '#1e1b2e');
    hg.addColorStop(0.53, '#fb7185');
    hg.addColorStop(0.72, '#881337');
    hg.addColorStop(1.0, '#1a060b');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, 512, 512);

    // Vertical dark sky zenith fading down into bright horizon glow
    const vg = ctx.createLinearGradient(0, 0, 0, 512);
    vg.addColorStop(0.0, 'rgba(3, 7, 18, 0.94)');
    vg.addColorStop(0.45, 'rgba(9, 11, 22, 0.55)');
    vg.addColorStop(0.75, 'rgba(15, 23, 42, 0.12)');
    vg.addColorStop(1.0, 'rgba(3, 7, 18, 0.92)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface Summon3DRig {
  root: THREE.Group;
  body: THREE.Group;
  leftWingPivot: THREE.Group;
  rightWingPivot: THREE.Group;
  weaponPivot: THREE.Group;
  haloOrCrown: THREE.Object3D;
  modRing: THREE.Mesh;
  groundAura: THREE.Mesh;
}

type GeoTracker = <T extends THREE.BufferGeometry>(g: T) => T;
type MatTracker = <T extends THREE.Material>(m: T) => T;

/**
 * Multi-part articulated 3D Seraphic Angel troop (Heaven summon).
 * Root sits at bottom-center (y = 0) with floating hover body, flapping wings,
 * golden halo, and seraphic lance.
 */
export function create3DAngelRig(trackGeo: GeoTracker, trackMat: MatTracker): Summon3DRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.52;
  root.add(body);

  const alabasterMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.16,
      roughness: 0.32,
      metalness: 0.25
    })
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xd97706,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.88
    })
  );
  const azureGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.35,
      roughness: 0.16,
      metalness: 0.35
    })
  );
  const wingFeatherMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfacc15,
      emissiveIntensity: 0.45,
      roughness: 0.28,
      metalness: 0.3,
      side: THREE.DoubleSide
    })
  );

  // Lower Seraphic Robe
  const robe = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.28, 0.72, 8)), alabasterMat);
  robe.position.y = 0.05;
  body.add(robe);

  // Golden Cuirass
  const chest = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.13, 0.4, 8)), goldMat);
  chest.position.y = 0.46;
  body.add(chest);

  // Chest Core Crystal
  const core = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.09, 0)), azureGlowMat);
  core.position.set(0, 0.48, 0.16);
  body.add(core);

  // Head + Glowing Visor + Golden Halo
  const head = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.13, 12, 12)), alabasterMat);
  head.position.y = 0.77;
  body.add(head);

  const visor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.04, 0.08)), azureGlowMat);
  visor.position.set(0, 0.77, 0.1);
  body.add(visor);

  const halo = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.2, 0.022, 8, 24)), goldMat);
  halo.rotation.x = Math.PI / 2 - 0.15;
  halo.position.set(0, 0.99, -0.02);
  body.add(halo);

  // Articulated Feathered Wings (Left & Right)
  const featherGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.09, 0.03));
  const buildWing = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.14, 0.56, -0.14);
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(featherGeo, k === 0 ? goldMat : wingFeatherMat);
      f.position.set(side * (0.24 - k * 0.04), 0.14 - k * 0.12, -0.04);
      f.rotation.z = side * (0.42 - k * 0.28);
      f.scale.set(1.05 - k * 0.16, 1, 1);
      pivot.add(f);
    }
    return pivot;
  };
  const leftWingPivot = buildWing(-1);
  const rightWingPivot = buildWing(1);
  body.add(leftWingPivot, rightWingPivot);

  // Seraphic Spear Weapon Pivot
  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0.26, 0.48, 0.06);
  const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.92, 6)), goldMat);
  shaft.rotation.x = Math.PI / 3;
  const spearTip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.065, 0.26, 4)), azureGlowMat);
  spearTip.position.set(0, 0.28, 0.48);
  spearTip.rotation.x = Math.PI / 3;
  weaponPivot.add(shaft, spearTip);
  body.add(weaponPivot);

  // Upgrade Mod Ring + Subtle Ground Aura
  const modRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.48, 0.02, 8, 24)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.72
      })
    )
  );
  modRing.rotation.x = Math.PI / 2;
  modRing.position.y = 0.35;
  modRing.visible = false;
  body.add(modRing);

  const groundAura = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.28, 0.42, 24)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    )
  );
  groundAura.rotation.x = -Math.PI / 2;
  groundAura.position.y = 0.04;
  root.add(groundAura);

  return {
    root,
    body,
    leftWingPivot,
    rightWingPivot,
    weaponPivot,
    haloOrCrown: halo,
    modRing,
    groundAura
  };
}

/**
 * Multi-part articulated 3D Infernal Demon troop (Hell summon).
 * Root sits at bottom-center (y = 0) with obsidian armor, curved horns,
 * flapping bat/demon wings, and blazing Hellfire Greatsword.
 */
export function create3DDemonRig(trackGeo: GeoTracker, trackMat: MatTracker): Summon3DRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.45;
  root.add(body);

  const obsidianMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e1118,
      emissive: 0x450a0a,
      emissiveIntensity: 0.25,
      roughness: 0.42,
      metalness: 0.65
    })
  );
  const crimsonMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      emissive: 0x9f1239,
      emissiveIntensity: 0.55,
      roughness: 0.28,
      metalness: 0.55
    })
  );
  const emberGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfda4af,
      emissive: 0xf97316,
      emissiveIntensity: 1.4,
      roughness: 0.18,
      metalness: 0.25
    })
  );

  // Muscular Obsidian Greaves & Torso
  const legGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.05, 0.34, 6));
  const legL = new THREE.Mesh(legGeo, obsidianMat);
  legL.position.set(-0.1, -0.05, 0);
  const legR = new THREE.Mesh(legGeo, obsidianMat);
  legR.position.set(0.1, -0.05, 0);
  body.add(legL, legR);

  const torso = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.14, 0.46, 6)), obsidianMat);
  torso.position.y = 0.32;
  body.add(torso);

  const emberCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.1, 0)), emberGlowMat);
  emberCore.position.set(0, 0.34, 0.19);
  body.add(emberCore);

  // Horned Demon Head + Glowing Ember Eyes
  const head = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.14, 0)), crimsonMat);
  head.position.y = 0.66;
  body.add(head);

  const eyeVisor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 0.04, 0.08)), emberGlowMat);
  eyeVisor.position.set(0, 0.67, 0.11);
  body.add(eyeVisor);

  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 0.74, 0);
  const hornGeo = trackGeo(new THREE.ConeGeometry(0.042, 0.26, 6));
  const hornL = new THREE.Mesh(hornGeo, emberGlowMat);
  hornL.position.set(-0.11, 0.1, 0);
  hornL.rotation.z = 0.55;
  const hornR = new THREE.Mesh(hornGeo, emberGlowMat);
  hornR.position.set(0.11, 0.1, 0);
  hornR.rotation.z = -0.55;
  crownGroup.add(hornL, hornR);
  body.add(crownGroup);

  // Articulated Bat/Infernal Wings
  const wingPlateGeo = trackGeo(new THREE.ConeGeometry(0.19, 0.46, 4));
  const buildDemonWing = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.16, 0.48, -0.15);
    const upper = new THREE.Mesh(wingPlateGeo, crimsonMat);
    upper.position.set(side * 0.22, 0.16, -0.05);
    upper.rotation.z = side * -1.05;
    upper.scale.set(0.55, 1.1, 0.25);
    const lower = new THREE.Mesh(wingPlateGeo, obsidianMat);
    lower.position.set(side * 0.19, -0.06, -0.04);
    lower.rotation.z = side * -1.55;
    lower.scale.set(0.45, 0.9, 0.22);
    pivot.add(upper, lower);
    return pivot;
  };
  const leftWingPivot = buildDemonWing(-1);
  const rightWingPivot = buildDemonWing(1);
  body.add(leftWingPivot, rightWingPivot);

  // Blazing Hellfire Greatsword
  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0.28, 0.36, 0.08);
  const hilt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.04, 0.04)), obsidianMat);
  const blade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.055, 0.72, 0.025)), emberGlowMat);
  blade.position.set(0, 0.28, 0.24);
  blade.rotation.x = Math.PI / 4;
  hilt.rotation.x = Math.PI / 4;
  weaponPivot.add(hilt, blade);
  body.add(weaponPivot);

  // Upgrade Mod Ring + Subtle Ground Aura
  const modRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.5, 0.02, 8, 24)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.72
      })
    )
  );
  modRing.rotation.x = Math.PI / 2;
  modRing.position.y = 0.25;
  modRing.visible = false;
  body.add(modRing);

  const groundAura = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.3, 0.45, 24)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xe11d48,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    )
  );
  groundAura.rotation.x = -Math.PI / 2;
  groundAura.position.y = 0.04;
  root.add(groundAura);

  return {
    root,
    body,
    leftWingPivot,
    rightWingPivot,
    weaponPivot,
    haloOrCrown: crownGroup,
    modRing,
    groundAura
  };
}
