import * as THREE from 'three';

export interface ProceduralMaterialLibrary {
  basaltStone: THREE.MeshStandardMaterial;
  marbleFloor: THREE.MeshStandardMaterial;
  terrainMat: THREE.MeshStandardMaterial;
  brushedBronze: THREE.MeshPhysicalMaterial;
  antiqueBrass: THREE.MeshStandardMaterial;
  obsidianMetal: THREE.MeshStandardMaterial;
  darkCloth: THREE.MeshPhysicalMaterial;
  crimsonArmor: THREE.MeshPhysicalMaterial;
  goldArmor: THREE.MeshPhysicalMaterial;
  cyanPlasma: THREE.MeshStandardMaterial;
  goldEmissive: THREE.MeshStandardMaterial;
  crimsonEmissive: THREE.MeshStandardMaterial;
  emeraldEmissive: THREE.MeshStandardMaterial;
  violetEmissive: THREE.MeshStandardMaterial;
  azureArmor: THREE.MeshPhysicalMaterial;
  iceCrystal: THREE.MeshPhysicalMaterial;
  opticalGlass: THREE.MeshPhysicalMaterial;
  bambooMat: THREE.MeshStandardMaterial;
  sandstoneMat: THREE.MeshStandardMaterial;
  timberWood: THREE.MeshStandardMaterial;
  plasterWall: THREE.MeshStandardMaterial;
  terracottaRoof: THREE.MeshStandardMaterial;
  slateRoof: THREE.MeshStandardMaterial;
  warmWindow: THREE.MeshStandardMaterial;
  leafFoliage: THREE.MeshStandardMaterial;
  riceGreen: THREE.MeshStandardMaterial;
  sailCloth: THREE.MeshPhysicalMaterial;
  shadowDiscMat: THREE.MeshBasicMaterial;
  disposeAll: () => void;
}

export function createStoneCanvasTexture(
  baseHex: string,
  veinHex: string,
  tileLines: boolean,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle organic mineral blotches
    for (let i = 0; i < 480; i++) {
      const x = (((Math.sin(i * 19.3) * 43758.5) % 1) + 1) % 1 * 512;
      const y = (((Math.cos(i * 47.7) * 29113.1) % 1) + 1) % 1 * 512;
      const r = 4 + (i % 18);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.085)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle mineral veins
    ctx.strokeStyle = veinHex;
    ctx.lineWidth = 1.25;
    for (let v = 0; v < 26; v++) {
      ctx.beginPath();
      let vx = (v * 73) % 512;
      let vy = (v * 139) % 512;
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 5; s++) {
        vx += Math.sin(v + s * 1.7) * 42;
        vy += Math.cos(v * 0.8 + s * 1.3) * 42;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    if (tileLines) {
      ctx.strokeStyle = 'rgba(0,0,0,0.42)';
      ctx.lineWidth = 3;
      for (let g = 0; g <= 512; g += 64) {
        ctx.beginPath();
        ctx.moveTo(g, 0);
        ctx.lineTo(g, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, g);
        ctx.lineTo(512, g);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createBrushedMetalTexture(baseHex: string, streakHex: string, anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = streakHex;
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 2) {
      ctx.globalAlpha = 0.06 + ((y * 17) % 10) * 0.015;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createSoftShadowDiscTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createMaterialLibrary(
  isSoftwareGl: boolean,
  maxAnisotropy: number
): ProceduralMaterialLibrary {
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];

  const trackTex = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const basaltTex = trackTex(createStoneCanvasTexture('#141923', 'rgba(56,189,248,0.08)', true, maxAnisotropy));
  const marbleTex = trackTex(createStoneCanvasTexture('#181f2b', 'rgba(251,191,36,0.14)', true, maxAnisotropy));
  const terrainNoiseTex = trackTex(createStoneCanvasTexture('#98a2b3', 'rgba(255,255,255,0.08)', false, maxAnisotropy));
  terrainNoiseTex.repeat.set(16, 16);
  const bronzeTex = trackTex(createBrushedMetalTexture('#966830', '#fde68a', maxAnisotropy));

  const basaltStone = trackMat(
    new THREE.MeshStandardMaterial({
      map: basaltTex,
      roughness: 0.48,
      metalness: 0.2,
      envMapIntensity: 0.45
    })
  );

  const marbleFloor = trackMat(
    new THREE.MeshStandardMaterial({
      map: marbleTex,
      roughness: 0.24,
      metalness: 0.34,
      envMapIntensity: 0.52
    })
  );

  const terrainMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: terrainNoiseTex,
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.1,
      envMapIntensity: 0.25
    })
  );

  const brushedBronze = trackMat(
    new THREE.MeshPhysicalMaterial({
      map: bronzeTex,
      color: 0xd99b43,
      metalness: 0.92,
      roughness: 0.24,
      anisotropy: 0.75,
      clearcoat: 0.35
    })
  );

  const antiqueBrass = trackMat(
    new THREE.MeshStandardMaterial({
      map: bronzeTex,
      color: 0xc28f44,
      metalness: 0.88,
      roughness: 0.3
    })
  );

  const obsidianMetal = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x131c2e,
      metalness: 0.84,
      roughness: 0.22
    })
  );

  const darkCloth = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x20293a,
      roughness: 0.85,
      metalness: 0.05,
      sheen: 0.75,
      sheenRoughness: 0.58,
      sheenColor: new THREE.Color(0x94a3b8),
      side: THREE.DoubleSide
    })
  );

  const crimsonArmor = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x881337,
      metalness: 0.78,
      roughness: 0.26,
      clearcoat: 0.7,
      clearcoatRoughness: 0.16,
      side: THREE.DoubleSide
    })
  );

  const goldArmor = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      metalness: 0.94,
      roughness: 0.18,
      clearcoat: 0.5,
      anisotropy: 0.7
    })
  );

  const cyanPlasma = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.45,
      roughness: 0.15,
      metalness: 0.2
    })
  );

  const goldEmissive = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 1.35,
      roughness: 0.2,
      metalness: 0.55
    })
  );

  const crimsonEmissive = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.55,
      roughness: 0.18,
      metalness: 0.25
    })
  );

  const emeraldEmissive = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x0d9488,
      emissiveIntensity: 1.4,
      roughness: 0.18,
      metalness: 0.3
    })
  );

  const violetEmissive = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      metalness: 0.3
    })
  );

  const azureArmor = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      metalness: 0.84,
      roughness: 0.22,
      clearcoat: 0.75,
      clearcoatRoughness: 0.14,
      side: THREE.DoubleSide
    })
  );

  const iceCrystal = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      emissive: 0x0284c7,
      emissiveIntensity: 0.42,
      metalness: 0.08,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.86,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 1.0,
      ior: 1.55,
      thickness: 1.4,
      clearcoat: 1.0
    })
  );

  const opticalGlass = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0.02,
      roughness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.94,
      transparent: true,
      opacity: isSoftwareGl ? 0.42 : 1.0,
      ior: 1.68,
      thickness: 1.8,
      iridescence: 0.9,
      clearcoat: 1.0
    })
  );

  const bambooMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x264b2c,
      roughness: 0.52,
      metalness: 0.08
    })
  );

  const sandstoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c4b3d,
      roughness: 0.84,
      metalness: 0.06
    })
  );

  const timberWood = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c3d28,
      roughness: 0.78,
      metalness: 0.05
    })
  );

  const plasterWall = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd6cbb9,
      roughness: 0.88,
      metalness: 0.02
    })
  );

  const terracottaRoof = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.72,
      metalness: 0.06
    })
  );

  const slateRoof = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.58,
      metalness: 0.16
    })
  );

  const warmWindow = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.45,
      roughness: 0.2,
      metalness: 0.1
    })
  );

  const leafFoliage = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2d6a3e,
      roughness: 0.78,
      metalness: 0.04
    })
  );

  const riceGreen = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x65a30d,
      roughness: 0.76,
      metalness: 0.02
    })
  );

  const sailCloth = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf1e8d6,
      roughness: 0.86,
      metalness: 0.02,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xfef3c7),
      side: THREE.DoubleSide
    })
  );

  const shadowDiscTex = trackTex(createSoftShadowDiscTexture(maxAnisotropy));
  const shadowDiscMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: shadowDiscTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  );

  return {
    basaltStone,
    marbleFloor,
    terrainMat,
    brushedBronze,
    antiqueBrass,
    obsidianMetal,
    darkCloth,
    crimsonArmor,
    goldArmor,
    cyanPlasma,
    goldEmissive,
    crimsonEmissive,
    emeraldEmissive,
    violetEmissive,
    azureArmor,
    iceCrystal,
    opticalGlass,
    bambooMat,
    sandstoneMat,
    timberWood,
    plasterWall,
    terracottaRoof,
    slateRoof,
    warmWindow,
    leafFoliage,
    riceGreen,
    sailCloth,
    shadowDiscMat,
    disposeAll: () => {
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    }
  };
}

export interface SkyDomeRig {
  mesh: THREE.Mesh;
  uniforms: {
    uZenith: { value: THREE.Color };
    uMidSky: { value: THREE.Color };
    uHorizon: { value: THREE.Color };
    uSunColor: { value: THREE.Color };
    uSunDir: { value: THREE.Vector3 };
    uTime: { value: number };
  };
}

/**
 * Procedural atmospheric Sky Dome with gradient zenith-to-horizon scattering,
 * solar/moon halo glow, and drifting high-altitude aurora/cloud ribbons.
 */
export function createProceduralSkyDome(
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T
): SkyDomeRig {
  const uniforms = {
    uZenith: { value: new THREE.Color(0x030712) },
    uMidSky: { value: new THREE.Color(0x0a192f) },
    uHorizon: { value: new THREE.Color(0x164e63) },
    uSunColor: { value: new THREE.Color(0x38bdf8) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.35, -0.88).normalize() },
    uTime: { value: 0 }
  };

  const mat = trackMat(
    new THREE.ShaderMaterial({
      uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uMidSky;
        uniform vec3 uHorizon;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        uniform float uTime;
        varying vec3 vWorldDir;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise2(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
            mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          vec3 dir = normalize(vWorldDir);
          float h = clamp(dir.y, -0.2, 1.0);
          vec3 sky = mix(uHorizon, uMidSky, smoothstep(-0.02, 0.28, h));
          sky = mix(sky, uZenith, smoothstep(0.24, 0.85, h));

          // Subtle drifting sky cloud / aurora veil
          if (dir.y > 0.02) {
            vec2 cloudUv = dir.xz / (dir.y + 0.22) * 1.45 + vec2(uTime * 0.018, -uTime * 0.011);
            float n = noise2(cloudUv) * 0.65 + noise2(cloudUv * 2.15 + 4.3) * 0.35;
            float cloudMask = smoothstep(0.52, 0.86, n) * smoothstep(0.02, 0.26, dir.y) * (1.0 - smoothstep(0.55, 0.98, dir.y));
            sky = mix(sky, mix(uHorizon, uSunColor, 0.38) * 1.25, cloudMask * 0.34);
          }

          // Solar / Celestial halo disc
          float sunDot = max(0.0, dot(dir, normalize(uSunDir)));
          sky += uSunColor * pow(sunDot, 10.0) * 0.28;
          sky += uSunColor * pow(sunDot, 120.0) * 0.65;

          gl_FragColor = vec4(sky, 1.0);
        }
      `
    })
  );

  const mesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(128, 32, 20)), mat);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

/**
 * Animated PBR Water Material using onBeforeCompile for realistic ocean/river/paddy waves.
 */
export function createAnimatedWaterMaterial(
  trackMat: <T extends THREE.Material>(m: T) => T,
  isSoftwareGl: boolean
): { material: THREE.MeshPhysicalMaterial; uTime: { value: number } } {
  const uTime = { value: 0 };
  const material = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x0e4d6e,
      emissive: 0x041d2e,
      emissiveIntensity: 0.35,
      roughness: 0.08,
      metalness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: isSoftwareGl ? 0.88 : 0.86,
      envMapIntensity: 1.15
    })
  );

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float w1 = sin(transformed.x * 0.32 + uTime * 1.45) * cos(transformed.z * 0.26 - uTime * 1.15);
      float w2 = sin((transformed.x + transformed.z) * 0.55 - uTime * 2.1) * 0.5;
      transformed.y += (w1 + w2) * 0.095;
      `
    );
  };

  return { material, uTime };
}

// =========================================================
// Procedural Multi-Biome 3D Terrain & Morph System
// =========================================================

function hash2D(ix: number, iz: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2D(ix, iz);
  const b = hash2D(ix + 1, iz);
  const c = hash2D(ix, iz + 1);
  const d = hash2D(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm2D(x: number, z: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (valueNoise2D(x * freq, z * freq) * 2 - 1);
    freq *= 2.04;
    amp *= 0.48;
  }
  return sum;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const WORLD_WATER_LEVEL = -0.45;

/**
 * Deterministic height sampler shared by the terrain mesh and all grounded 3D props.
 * Keeps r <= 8.5 flat at y = -0.06 so the central sanctum & heroes remain flush above water,
 * while sculpting beaches, ocean bays, winding rivers, stepped rice terraces, and village plains.
 */
export function sampleBiomeTerrainHeight(x: number, z: number, actIdx: number): number {
  const r = Math.hypot(x, z);
  const maskInner = smoothstep(8.6, 14.5, r);
  const rimPeak = smoothstep(26, 62, r);
  const ang = Math.atan2(z, x);

  if (actIdx === 0) {
    // Act I: Coastal Ocean Bay (z < -12), Sandy Beach Cove, Flat Village Plains & Basalt Ridges
    const bayMask = smoothstep(-10.5, -24.0, z) * (1 - Math.exp(-Math.pow(x / 3.4, 2)) * 0.85 * smoothstep(-16, -7, z));
    const seaDepth = bayMask * -2.95;
    const beachSlope = smoothstep(-7.5, -14.5, z) * (1 - bayMask) * -0.42;
    const coastalPlain = smoothstep(10.0, 15.0, r) * (z > -10 ? 0.55 : 0.15);
    const backMountains =
      z > 14
        ? smoothstep(16, 46, z) * (Math.abs(fbm2D(x * 0.055 + 3.1, z * 0.055 - 1.7, 4)) * 10.5 + 1.5)
        : 0;
    const outerIslands = z < -28 ? Math.max(0, fbm2D(x * 0.06, z * 0.06, 3)) * 5.2 * smoothstep(22, 46, Math.abs(x)) : 0;
    return -0.06 + (coastalPlain + beachSlope + seaDepth + backMountains + outerIslands) * maskInner;
  }

  if (actIdx === 1) {
    // Act II: Winding Mountain River + Stepped Rice Terraces (Sawah) + Golden Alpine Peaks
    const riverCenterX = -13.2 + Math.sin(z * 0.085) * 3.8;
    const distRiver = Math.abs(x - riverCenterX);
    const riverCarve = Math.exp(-Math.pow(distRiver / 3.3, 2)) * -1.55 * smoothstep(9.5, 13.5, r);

    const rawSlope = smoothstep(11.5, 34, r) * 5.2;
    const terraceStep = Math.floor(rawSlope / 0.68) * 0.68;
    const isRiceFlank = distRiver > 4.2 && r > 11.2 && r < 30;
    const paddyHeight = isRiceFlank ? terraceStep : rawSlope * 0.85;

    const peaks = rimPeak * Math.pow(Math.abs(fbm2D(x * 0.048 - 4.2, z * 0.048 + 2.4, 4)), 1.15) * 12.5;
    const amphitheater = (0.6 + 0.4 * Math.sin(ang * 3 + 0.6)) * rimPeak * 7.5;
    return -0.06 + paddyHeight * maskInner + riverCarve + (peaks + amphitheater) * maskInner;
  }

  if (actIdx === 2) {
    // Act III: Winding Cathedral Canal River + Flat Old-Town Village Plains + Valley Cliffs
    const riverDist = Math.abs(r - 16.8 - Math.sin(ang * 2.0) * 1.6);
    const canalCarve = Math.exp(-Math.pow(riverDist / 2.6, 2)) * -1.45;
    const townPlain = smoothstep(19.5, 22.5, r) * 0.42;
    const cliffs = smoothstep(33, 58, r) * (4.5 + Math.abs(fbm2D(x * 0.06, z * 0.06, 3)) * 10.0);
    return -0.06 + canalCarve + (townPlain + cliffs) * smoothstep(9.0, 12.2, r);
  }

  if (actIdx === 3) {
    // Act IV: Bamboo Valley Stream + Flat Paddy Plains (Sawah) + Village Clearing & Forest Hills
    const streamCenterX = 11.8 + Math.sin(z * 0.11) * 3.0;
    const distStream = Math.abs(x - streamCenterX);
    const streamCarve = Math.exp(-Math.pow(distStream / 2.5, 2)) * -1.35 * smoothstep(9.2, 12.5, r);

    const sawahFlank = x < -9.5 && Math.abs(z) < 22 ? Math.floor(smoothstep(10, 26, Math.abs(x)) * 3) * 0.35 : 0;
    const hills =
      smoothstep(24, 52, r) *
      ((fbm2D(x * 0.05 + 8.3, z * 0.05 - 5.2, 4) * 0.5 + 0.5) * 8.5 + 1.8);
    const pathFlatten = 1 - 0.55 * Math.exp(-Math.pow(x / 4.5, 2));
    return -0.06 + (sawahFlank + hills * pathFlatten) * maskInner + streamCarve;
  }

  // Act V: Observatory Peninsula Plain -> Golden-White Sandy Beach -> Shimmering Open Ocean & Distant Islands
  const plainHeight = smoothstep(10.0, 15.0, r) * 0.38;
  const beachDrop = smoothstep(20.5, 27.5, r) * -2.85;
  const distantIsles =
    smoothstep(44, 62, r) * Math.max(0, fbm2D(x * 0.055 + 12.1, z * 0.055 + 9.4, 4)) * 9.5;
  return -0.06 + (plainHeight + beachDrop + distantIsles) * maskInner;
}

function sampleBiomeTerrainColor(
  x: number,
  z: number,
  h: number,
  actIdx: number,
  out: THREE.Color
): void {
  const r = Math.hypot(x, z);
  const detail = fbm2D(x * 0.14 + 1.9, z * 0.14 - 2.3, 2) * 0.5 + 0.5;
  const hNorm = Math.max(0, Math.min(1, h / 11));

  if (actIdx === 0) {
    // Sandy shoreline beach -> coastal meadow plain -> slate basalt hills
    if (h < -0.15) {
      out.setRGB(0.42 + detail * 0.08, 0.36 + detail * 0.06, 0.24 + detail * 0.04); // Wet beach sand
    } else if (h < 1.1 && z < 16) {
      out.setRGB(0.14 + detail * 0.07, 0.27 + detail * 0.09, 0.18 + detail * 0.05); // Coastal grass plain
    } else {
      out.setRGB(
        0.1 + hNorm * 0.14 + detail * 0.04,
        0.13 + hNorm * 0.17 + detail * 0.05,
        0.19 + hNorm * 0.22 + detail * 0.07
      );
    }
    return;
  }

  if (actIdx === 1) {
    // Riverbed pebble -> lush emerald-gold rice terraces (sawah) -> alpine frost peaks
    if (h < -0.25) {
      out.setRGB(0.24, 0.22, 0.18);
    } else if (h >= 0.15 && h < 4.8) {
      const paddyWave = (h * 1.45) % 1;
      const isDike = paddyWave < 0.16;
      if (isDike) {
        out.setRGB(0.24, 0.19, 0.12); // Earthen pematang dike
      } else {
        out.setRGB(0.18 + detail * 0.09, 0.36 + detail * 0.12, 0.1 + detail * 0.04); // Lush rice paddy
      }
    } else {
      out.setRGB(0.24 + hNorm * 0.18, 0.18 + hNorm * 0.14, 0.12 + hNorm * 0.1);
      if (h > 5.8) {
        out.lerp(_tmpCol.setRGB(0.5, 0.62, 0.76), smoothstep(5.8, 10.0, h) * 0.72);
      }
    }
    return;
  }

  if (actIdx === 2) {
    // Canal bed -> grassy/cobble town plain -> sandstone valley cliffs
    if (h < -0.22) {
      out.setRGB(0.08, 0.18, 0.26);
    } else if (r > 19 && r < 34) {
      out.setRGB(0.16 + detail * 0.07, 0.24 + detail * 0.07, 0.16 + detail * 0.04);
    } else {
      out.setRGB(
        0.14 + hNorm * 0.22 + detail * 0.05,
        0.16 + hNorm * 0.19 + detail * 0.05,
        0.22 + hNorm * 0.17 + detail * 0.05
      );
    }
    return;
  }

  if (actIdx === 3) {
    // Wet forest loam -> emerald sawah paddy -> bamboo hillside moss
    if (h < -0.2) {
      out.setRGB(0.18, 0.16, 0.14);
    } else if (x < -9.5 && Math.abs(z) < 22) {
      out.setRGB(0.14 + detail * 0.06, 0.32 + detail * 0.1, 0.12 + detail * 0.04); // Emerald sawah
    } else {
      const pathBlend = Math.exp(-Math.pow(x / 3.8, 2)) * (r < 24 ? 1 : 0);
      out.setRGB(0.09 + detail * 0.06, 0.19 + hNorm * 0.16 + detail * 0.08, 0.1 + detail * 0.04);
      if (pathBlend > 0.1) {
        out.lerp(_tmpCol.setRGB(0.24, 0.18, 0.18), pathBlend * 0.7);
      }
    }
    return;
  }

  // Act V: Observatory peninsula plain -> warm sandy beach -> ocean reef seabed
  if (h < -0.75) {
    out.setRGB(0.06, 0.2, 0.3);
  } else if (h < 0.08 && r > 19) {
    out.setRGB(0.56 + detail * 0.08, 0.48 + detail * 0.07, 0.32 + detail * 0.05); // Golden sandy beach
  } else {
    out.setRGB(
      0.13 + hNorm * 0.18 + detail * 0.06,
      0.22 + hNorm * 0.2 + detail * 0.08,
      0.19 + hNorm * 0.22 + detail * 0.07
    );
  }
}

const _tmpCol = new THREE.Color();

export interface MorphingTerrainData {
  geometry: THREE.PlaneGeometry;
  vertexCount: number;
  heightsPerAct: Float32Array[];
  colorsPerAct: Float32Array[];
}

/**
 * Generates a high-detail procedural terrain mesh plus 5 precomputed biome height/color maps
 * for smooth zero-allocation morphing between Acts.
 */
export function createMorphingTerrain(size: number, segments: number): MorphingTerrainData {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const posAttr = geometry.attributes.position as THREE.BufferAttribute;
  const vertexCount = posAttr.count;
  const colorArray = new Float32Array(vertexCount * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

  const heightsPerAct: Float32Array[] = [];
  const colorsPerAct: Float32Array[] = [];
  const col = new THREE.Color();

  for (let actIdx = 0; actIdx < 5; actIdx++) {
    const hArr = new Float32Array(vertexCount);
    const cArr = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const h = sampleBiomeTerrainHeight(x, z, actIdx);
      hArr[i] = h;
      sampleBiomeTerrainColor(x, z, h, actIdx, col);
      cArr[i * 3] = col.r;
      cArr[i * 3 + 1] = col.g;
      cArr[i * 3 + 2] = col.b;
    }
    heightsPerAct.push(hArr);
    colorsPerAct.push(cArr);
  }

  // Initialize to Act 0
  for (let i = 0; i < vertexCount; i++) {
    posAttr.setY(i, heightsPerAct[0][i]);
    colorArray[i * 3] = colorsPerAct[0][i * 3];
    colorArray[i * 3 + 1] = colorsPerAct[0][i * 3 + 1];
    colorArray[i * 3 + 2] = colorsPerAct[0][i * 3 + 2];
  }
  posAttr.needsUpdate = true;
  (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  geometry.computeVertexNormals();

  return { geometry, vertexCount, heightsPerAct, colorsPerAct };
}

export function applyTerrainMorph(
  data: MorphingTerrainData,
  fromAct: number,
  toAct: number,
  alpha: number,
  recomputeNormals: boolean
): void {
  const posAttr = data.geometry.attributes.position as THREE.BufferAttribute;
  const colAttr = data.geometry.attributes.color as THREE.BufferAttribute;
  const posArr = posAttr.array as Float32Array;
  const colArr = colAttr.array as Float32Array;

  const hA = data.heightsPerAct[fromAct];
  const hB = data.heightsPerAct[toAct];
  const cA = data.colorsPerAct[fromAct];
  const cB = data.colorsPerAct[toAct];
  const t = Math.max(0, Math.min(1, alpha));
  const inv = 1 - t;

  for (let i = 0; i < data.vertexCount; i++) {
    const pIdx = i * 3;
    posArr[pIdx + 1] = hA[i] * inv + hB[i] * t;
    colArr[pIdx] = cA[pIdx] * inv + cB[pIdx] * t;
    colArr[pIdx + 1] = cA[pIdx + 1] * inv + cB[pIdx + 1] * t;
    colArr[pIdx + 2] = cA[pIdx + 2] * inv + cB[pIdx + 2] * t;
  }

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
  if (recomputeNormals) {
    data.geometry.computeVertexNormals();
  }
}

/**
 * Generates a real beveled toothed gear ExtrudeGeometry.
 */
export function createToothedGearGeometry(
  outerRadius: number,
  innerRadius: number,
  teeth: number,
  depth: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const toothDepth = outerRadius * 0.14;
  const baseR = outerRadius - toothDepth;
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.32;
    const a3 = a0 + step * 0.62;
    const a4 = a0 + step * 0.72;

    const p0x = Math.cos(a0) * baseR;
    const p0y = Math.sin(a0) * baseR;
    if (i === 0) shape.moveTo(p0x, p0y);
    else shape.lineTo(p0x, p0y);

    shape.lineTo(Math.cos(a1) * baseR, Math.sin(a1) * baseR);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * baseR, Math.sin(a4) * baseR);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: Math.min(0.05, depth * 0.18),
    bevelSize: Math.min(0.05, outerRadius * 0.03),
    bevelSegments: 2
  });
  geo.center();
  return geo;
}

export type HeroVariant =
  | 'traveler'
  | 'guardian'
  | 'samurai'
  | 'valkyrie'
  | 'dimensionJudge'
  | 'fallenAngel'
  | 'architect'
  | 'lumina';

export interface ArticulatedHeroRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftShin: THREE.Group;
  rightShin: THREE.Group;
  cape: THREE.Mesh;
  weaponPivot: THREE.Group;
  leftWeaponPivot: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  haloRing?: THREE.Mesh;
  auraRing: THREE.Mesh;
  shadowDisc: THREE.Mesh;
}

/**
 * Builds a richly detailed, 2-segment articulated procedural 3D hero figure grounded flush at y = 0.
 */
export function buildArticulatedWarriorRig(
  variant: HeroVariant,
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  castShadow: boolean
): ArticulatedHeroRig {
  const root = new THREE.Group();

  const armorMat =
    variant === 'guardian' || variant === 'lumina'
      ? mats.goldArmor
      : variant === 'samurai' || variant === 'fallenAngel'
      ? mats.crimsonArmor
      : variant === 'valkyrie'
      ? mats.azureArmor
      : variant === 'dimensionJudge' || variant === 'architect'
      ? mats.obsidianMetal
      : mats.darkCloth;

  const trimMat =
    variant === 'guardian' || variant === 'dimensionJudge' || variant === 'lumina'
      ? mats.brushedBronze
      : variant === 'valkyrie'
      ? mats.iceCrystal
      : variant === 'samurai' || variant === 'fallenAngel'
      ? mats.goldArmor
      : mats.antiqueBrass;

  const coreMat =
    variant === 'samurai' || variant === 'fallenAngel'
      ? mats.crimsonEmissive
      : variant === 'guardian' || variant === 'lumina'
      ? mats.goldEmissive
      : variant === 'dimensionJudge'
      ? mats.violetEmissive
      : variant === 'architect'
      ? mats.emeraldEmissive
      : mats.cyanPlasma;

  const setShadow = (m: THREE.Object3D) => {
    m.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = castShadow;
        c.receiveShadow = castShadow;
      }
    });
  };

  // Grounded soft contact shadow disc + subtle ground energy aura ring
  const shadowDisc = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.65, 1.65)),
    mats.shadowDiscMat
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  root.add(shadowDisc);

  const auraRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.65, 0.025, 6, 28)),
    coreMat
  );
  auraRing.rotation.x = Math.PI / 2;
  auraRing.position.y = 0.03;
  root.add(auraRing);

  // 2-Segment Articulated Legs (Hip at y = 0.94 -> Knee at -0.44 -> Boot bottom at y = 0.00)
  const thighGeo = trackGeo(new THREE.CapsuleGeometry(0.105, 0.24, 6, 10));
  const shinGeo = trackGeo(new THREE.CapsuleGeometry(0.09, 0.24, 6, 10));
  const kneeGeo = trackGeo(new THREE.BoxGeometry(0.17, 0.14, 0.15));
  const bootGeo = trackGeo(new THREE.BoxGeometry(0.21, 0.18, 0.34));

  const makeLeg = (xOffset: number) => {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(xOffset, 0.94, 0);
    const thigh = new THREE.Mesh(thighGeo, mats.obsidianMetal);
    thigh.position.set(0, -0.22, 0);
    hipPivot.add(thigh);

    const shinPivot = new THREE.Group();
    shinPivot.position.set(0, -0.44, 0);
    hipPivot.add(shinPivot);

    const kneeGuard = new THREE.Mesh(kneeGeo, trimMat);
    kneeGuard.position.set(0, 0.01, 0.09);
    const shin = new THREE.Mesh(shinGeo, armorMat);
    shin.position.set(0, -0.21, 0);
    const boot = new THREE.Mesh(bootGeo, trimMat);
    boot.position.set(0, -0.41, 0.05);
    shinPivot.add(kneeGuard, shin, boot);
    return { hipPivot, shinPivot };
  };

  const leftLegData = makeLeg(-0.19);
  const rightLegData = makeLeg(0.19);
  const leftLeg = leftLegData.hipPivot;
  const rightLeg = rightLegData.hipPivot;
  const leftShin = leftLegData.shinPivot;
  const rightShin = rightLegData.shinPivot;
  root.add(leftLeg, rightLeg);

  // Torso (pivoted at waist y = 0.94)
  const torso = new THREE.Group();
  torso.position.set(0, 0.94, 0);
  root.add(torso);

  const chestMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.33, 0.24, 0.78, 12)),
    armorMat
  );
  chestMesh.position.y = 0.42;
  torso.add(chestMesh);

  // Sculpted Breastplate Ridge & Collar
  const breastplate = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.42, 0.36, 0.24)),
    trimMat
  );
  breastplate.position.set(0, 0.52, 0.14);
  const collar = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.24, 0.045, 6, 16)),
    trimMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.8;
  torso.add(breastplate, collar);

  // Belt & Core Emblem
  const belt = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.26, 0.28, 0.14, 12)),
    trimMat
  );
  belt.position.y = 0.08;
  torso.add(belt);

  const chestCore = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.11, 0)),
    coreMat
  );
  chestCore.position.set(0, 0.52, 0.3);
  torso.add(chestCore);

  // Layered Pauldrons (shoulders)
  const pauldronGeo = trackGeo(new THREE.SphereGeometry(0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6));
  const pauldronTrimGeo = trackGeo(new THREE.TorusGeometry(0.18, 0.028, 6, 16));
  const leftPauldron = new THREE.Mesh(pauldronGeo, trimMat);
  leftPauldron.position.set(-0.37, 0.73, 0);
  leftPauldron.rotation.z = 0.38;
  const leftPauldronTrim = new THREE.Mesh(pauldronTrimGeo, coreMat);
  leftPauldronTrim.rotation.x = Math.PI / 2;
  leftPauldron.add(leftPauldronTrim);

  const rightPauldron = new THREE.Mesh(pauldronGeo, trimMat);
  rightPauldron.position.set(0.37, 0.73, 0);
  rightPauldron.rotation.z = -0.38;
  const rightPauldronTrim = new THREE.Mesh(pauldronTrimGeo, coreMat);
  rightPauldronTrim.rotation.x = Math.PI / 2;
  rightPauldron.add(rightPauldronTrim);
  torso.add(leftPauldron, rightPauldron);

  // Cape / Cloak
  const capeMat =
    variant === 'samurai' || variant === 'fallenAngel'
      ? mats.crimsonArmor
      : variant === 'valkyrie'
      ? mats.azureArmor
      : mats.darkCloth;
  const cape = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.82, 1.38, 6, 8)),
    capeMat
  );
  cape.position.set(0, 0.1, -0.28);
  cape.rotation.x = 0.12;
  torso.add(cape);

  // Articulated Wings (for winged/aerial heroes + back halo)
  const leftWing = new THREE.Group();
  leftWing.position.set(-0.2, 0.65, -0.24);
  const rightWing = new THREE.Group();
  rightWing.position.set(0.2, 0.65, -0.24);
  torso.add(leftWing, rightWing);

  let haloRing: THREE.Mesh | undefined;
  if (variant === 'fallenAngel' || variant === 'lumina' || variant === 'valkyrie') {
    const featherGeo = trackGeo(new THREE.BoxGeometry(0.16, 1.12, 0.04));
    const wingMat =
      variant === 'fallenAngel'
        ? mats.crimsonEmissive
        : variant === 'lumina'
        ? mats.goldEmissive
        : mats.iceCrystal;
    for (let f = 0; f < 5; f++) {
      const fL = new THREE.Mesh(featherGeo, f === 0 ? trimMat : wingMat);
      fL.position.set(-0.3 - f * 0.23, 0.34 - f * 0.15, -0.05);
      fL.rotation.z = 0.42 + f * 0.19;
      leftWing.add(fL);

      const fR = new THREE.Mesh(featherGeo, f === 0 ? trimMat : wingMat);
      fR.position.set(0.3 + f * 0.23, 0.34 - f * 0.15, -0.05);
      fR.rotation.z = -0.42 - f * 0.19;
      rightWing.add(fR);
    }
  }

  if (variant === 'dimensionJudge' || variant === 'architect' || variant === 'lumina') {
    haloRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.72, 0.036, 8, 32)),
      variant === 'architect' ? mats.emeraldEmissive : variant === 'dimensionJudge' ? mats.violetEmissive : mats.goldEmissive
    );
    haloRing.position.set(0, 0.85, -0.24);
    torso.add(haloRing);
  }

  // Head + Helmet / Hood
  const head = new THREE.Group();
  head.position.set(0, 0.96, 0);
  torso.add(head);

  const cranium = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.21, 16, 14)), mats.obsidianMetal);
  head.add(cranium);

  if (variant === 'traveler') {
    const hood = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.33, 0.54, 12)), mats.darkCloth);
    hood.position.set(0, 0.1, -0.04);
    hood.rotation.x = -0.18;
    const visorGlow = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.04, 0.06)), mats.cyanPlasma);
    visorGlow.position.set(0, 0.02, 0.18);
    head.add(hood, visorGlow);
  } else if (variant === 'guardian') {
    const helmCrest = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.38, 0.36)), mats.goldEmissive);
    helmCrest.position.set(0, 0.18, -0.02);
    const circlet = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.22, 0.035, 8, 20)), mats.brushedBronze);
    circlet.rotation.x = Math.PI / 2;
    circlet.position.y = 0.08;
    head.add(helmCrest, circlet);
  } else if (variant === 'valkyrie') {
    const tiara = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.24, 0.34, 6)), mats.iceCrystal);
    tiara.position.set(0, 0.19, 0);
    const wingEarGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.3, 0.16));
    const earL = new THREE.Mesh(wingEarGeo, mats.iceCrystal);
    earL.position.set(-0.22, 0.12, -0.02);
    earL.rotation.z = 0.35;
    const earR = new THREE.Mesh(wingEarGeo, mats.iceCrystal);
    earR.position.set(0.22, 0.12, -0.02);
    earR.rotation.z = -0.35;
    head.add(tiara, earL, earR);
  } else if (variant === 'dimensionJudge' || variant === 'lumina') {
    const crown = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.25, 0.03, 8, 24)), mats.goldEmissive);
    crown.rotation.x = Math.PI / 2.3;
    crown.position.y = 0.15;
    const visor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.05, 0.08)), coreMat);
    visor.position.set(0, 0.03, 0.19);
    head.add(crown, visor);
  } else if (variant === 'architect') {
    const prismHelm = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.25, 0)), mats.opticalGlass);
    prismHelm.position.y = 0.06;
    const visor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.05, 0.08)), mats.emeraldEmissive);
    visor.position.set(0, 0.02, 0.19);
    head.add(prismHelm, visor);
  } else {
    const kabutoDome = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      mats.obsidianMetal
    );
    kabutoDome.position.y = 0.04;
    head.add(kabutoDome);
    const hornGeo = trackGeo(new THREE.ConeGeometry(0.04, 0.38, 8));
    const hornMat = variant === 'fallenAngel' ? mats.crimsonEmissive : mats.goldArmor;
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.14, 0.25, 0.14);
    leftHorn.rotation.z = 0.48;
    leftHorn.rotation.x = -0.2;
    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.14, 0.25, 0.14);
    rightHorn.rotation.z = -0.48;
    rightHorn.rotation.x = -0.2;
    head.add(leftHorn, rightHorn);
  }

  // 2-Segment Articulated Arms (Shoulder -> UpperArm -> Elbow Forearm -> Gauntlet -> Weapon)
  const upperArmGeo = trackGeo(new THREE.CapsuleGeometry(0.082, 0.2, 6, 10));
  const forearmGeo = trackGeo(new THREE.CapsuleGeometry(0.072, 0.2, 6, 10));
  const gauntletGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.078, 0.16, 8));

  const makeArm = (xOffset: number) => {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(xOffset, 0.72, 0);
    const upper = new THREE.Mesh(upperArmGeo, armorMat);
    upper.position.y = -0.17;
    shoulderPivot.add(upper);

    const forearmPivot = new THREE.Group();
    forearmPivot.position.set(0, -0.34, 0);
    shoulderPivot.add(forearmPivot);

    const lower = new THREE.Mesh(forearmGeo, mats.obsidianMetal);
    lower.position.y = -0.16;
    const cuff = new THREE.Mesh(gauntletGeo, trimMat);
    cuff.position.y = -0.22;
    forearmPivot.add(lower, cuff);

    return { shoulderPivot, forearmPivot };
  };

  const leftArmData = makeArm(-0.39);
  const rightArmData = makeArm(0.39);
  const leftArm = leftArmData.shoulderPivot;
  const rightArm = rightArmData.shoulderPivot;
  const leftForearm = leftArmData.forearmPivot;
  const rightForearm = rightArmData.forearmPivot;
  torso.add(leftArm, rightArm);

  // Weapon Pivots attached to Right & Left Forearms
  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0, -0.34, 0.06);
  rightForearm.add(weaponPivot);

  const leftWeaponPivot = new THREE.Group();
  leftWeaponPivot.position.set(0, -0.34, 0.06);
  leftForearm.add(leftWeaponPivot);

  if (variant === 'guardian') {
    const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 2.55, 10)), mats.brushedBronze);
    shaft.rotation.x = Math.PI / 2;
    const capGeo = trackGeo(new THREE.CylinderGeometry(0.075, 0.05, 0.3, 12));
    const capA = new THREE.Mesh(capGeo, mats.goldEmissive);
    capA.rotation.x = Math.PI / 2;
    capA.position.z = 1.26;
    const capB = new THREE.Mesh(capGeo, mats.goldEmissive);
    capB.rotation.x = -Math.PI / 2;
    capB.position.z = -1.26;
    weaponPivot.add(shaft, capA, capB);
  } else if (variant === 'samurai' || variant === 'fallenAngel') {
    const hilt = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.028, 0.03, 0.34, 8)), mats.obsidianMetal);
    hilt.rotation.x = Math.PI / 2;
    hilt.position.z = 0.08;
    const guard = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.032, 12)), mats.goldArmor);
    guard.rotation.x = Math.PI / 2;
    guard.position.z = 0.24;
    const blade = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(variant === 'fallenAngel' ? 0.042 : 0.024, variant === 'fallenAngel' ? 0.11 : 0.068, 1.68)),
      mats.crimsonEmissive
    );
    blade.position.z = 1.08;
    weaponPivot.add(hilt, guard, blade);
  } else if (variant === 'valkyrie') {
    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.035, 2.35, 8)), mats.brushedBronze);
    pole.rotation.x = Math.PI / 2;
    pole.position.z = 0.42;
    const lanceTip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.12, 0.76, 6)), mats.iceCrystal);
    lanceTip.rotation.x = Math.PI / 2;
    lanceTip.position.z = 1.88;
    weaponPivot.add(pole, lanceTip);
  } else if (variant === 'dimensionJudge') {
    const bladeR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.032, 0.075, 1.38)), mats.violetEmissive);
    bladeR.position.z = 0.78;
    weaponPivot.add(bladeR);
    const bladeL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.032, 0.075, 1.38)), mats.cyanPlasma);
    bladeL.position.z = 0.78;
    leftWeaponPivot.add(bladeL);
  } else if (variant === 'architect') {
    const cubeR = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.16, 0)), mats.emeraldEmissive);
    cubeR.position.set(0, -0.04, 0.2);
    weaponPivot.add(cubeR);
    const cubeL = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.16, 0)), mats.cyanPlasma);
    cubeL.position.set(0, -0.04, 0.2);
    leftWeaponPivot.add(cubeL);
  } else if (variant === 'lumina') {
    const rod = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 2.15, 8)), mats.goldArmor);
    rod.rotation.x = Math.PI / 2;
    rod.position.z = 0.45;
    const sunOrb = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.15, 1)), mats.goldEmissive);
    sunOrb.position.z = 1.58;
    weaponPivot.add(rod, sunOrb);
  } else {
    const orb = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.12, 1)), mats.cyanPlasma);
    orb.position.set(0, -0.05, 0.14);
    weaponPivot.add(orb);
    const dagger = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.025, 0.055, 0.96)), mats.cyanPlasma);
    dagger.position.z = 0.56;
    leftWeaponPivot.add(dagger);
  }

  setShadow(root);
  return {
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    leftShin,
    rightShin,
    cape,
    weaponPivot,
    leftWeaponPivot,
    leftWing,
    rightWing,
    haloRing,
    auraRing,
    shadowDisc
  };
}

// =========================================================
// Composite 3-12 Part Procedural Landscape Props
// (Houses, Bridges, Trees, Wooden Boats, Rice Paddy Clusters)
// =========================================================

export function buildProceduralHouse(
  style: 'coastal' | 'village' | 'townhouse',
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  castShadow: boolean
): THREE.Group {
  const grp = new THREE.Group();
  const w = style === 'townhouse' ? 2.5 : style === 'coastal' ? 2.3 : 2.6;
  const h = style === 'townhouse' ? 2.4 : 1.7;
  const d = 2.2;

  const roofMat = style === 'townhouse' ? mats.slateRoof : mats.terracottaRoof;
  const wallMat = style === 'village' ? mats.timberWood : mats.plasterWall;

  // 1. Stone foundation plinth (bottom flush at y = 0)
  const plinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w + 0.26, 0.34, d + 0.26)), mats.basaltStone);
  plinth.position.y = 0.17;
  grp.add(plinth);

  // 2. Main walls
  const walls = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, d)), wallMat);
  walls.position.y = 0.34 + h * 0.5;
  grp.add(walls);

  // 3. Pitched overhanging roof (4-sided pyramid/gable)
  const roof = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(Math.max(w, d) * 0.84, 1.35, 4)),
    roofMat
  );
  roof.position.y = 0.34 + h + 0.62;
  roof.rotation.y = Math.PI / 4;
  grp.add(roof);

  // 4. Timber roof ridge & chimney
  const ridge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w * 0.72, 0.14, 0.16)), mats.timberWood);
  ridge.position.y = 0.34 + h + 1.28;
  const chimney = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.75, 0.32)), mats.basaltStone);
  chimney.position.set(w * 0.26, 0.34 + h + 0.85, -d * 0.18);
  grp.add(ridge, chimney);

  // 5. Front porch overhang + pillars + wooden door
  const awning = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w * 0.62, 0.08, 0.58)), roofMat);
  awning.position.set(0, 1.48, d * 0.5 + 0.24);
  const door = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 1.04, 0.08)), mats.timberWood);
  door.position.set(0, 0.86, d * 0.5 + 0.03);
  grp.add(awning, door);

  for (const px of [-w * 0.25, w * 0.25]) {
    const post = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.065, 1.18, 6)), mats.timberWood);
    post.position.set(px, 0.9, d * 0.5 + 0.44);
    grp.add(post);
  }

  // 6. Warm glowing interior windows (front & sides)
  const winGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.42, 0.06));
  const winFrontL = new THREE.Mesh(winGeo, mats.warmWindow);
  winFrontL.position.set(-w * 0.28, 1.25, d * 0.5 + 0.02);
  const winFrontR = new THREE.Mesh(winGeo, mats.warmWindow);
  winFrontR.position.set(w * 0.28, 1.25, d * 0.5 + 0.02);
  const winSide = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.42, 0.48)), mats.warmWindow);
  winSide.position.set(w * 0.5 + 0.02, 1.25, 0);
  grp.add(winFrontL, winFrontR, winSide);

  grp.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = castShadow;
      obj.receiveShadow = castShadow;
    }
  });
  return grp;
}

export function buildProceduralBridge(
  style: 'stone' | 'wooden',
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  castShadow: boolean
): THREE.Group {
  const grp = new THREE.Group();
  const deckMat = style === 'stone' ? mats.sandstoneMat : mats.timberWood;
  const railMat = style === 'stone' ? mats.basaltStone : mats.crimsonArmor;

  // Arched plank segments
  const segCount = 9;
  const deckGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.18, 2.35));
  for (let i = 0; i < segCount; i++) {
    const u = (i / (segCount - 1)) * 2 - 1;
    const x = u * 3.2;
    const y = (1 - u * u) * 0.72 + 0.12;
    const plank = new THREE.Mesh(deckGeo, deckMat);
    plank.position.set(x, y, 0);
    plank.rotation.z = -u * 0.28;
    grp.add(plank);
  }

  // Support piers & side railings with corner lanterns
  const pierGeo = trackGeo(new THREE.CylinderGeometry(0.2, 0.26, 1.8, 8));
  for (const px of [-2.4, 2.4]) {
    for (const pz of [-1.05, 1.05]) {
      const pier = new THREE.Mesh(pierGeo, mats.basaltStone);
      pier.position.set(px, -0.45, pz);
      grp.add(pier);
    }
  }

  const railGeo = trackGeo(new THREE.BoxGeometry(6.8, 0.12, 0.12));
  for (const rz of [-1.08, 1.08]) {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(0, 0.92, rz);
    grp.add(rail);
    for (const lx of [-3.1, 0, 3.1]) {
      const post = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.95, 0.16)), railMat);
      post.position.set(lx, 0.55, rz);
      grp.add(post);
      if (lx !== 0) {
        const lamp = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.13, 0)), mats.warmWindow);
        lamp.position.set(lx, 1.12, rz);
        grp.add(lamp);
      }
    }
  }

  grp.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = castShadow;
      obj.receiveShadow = castShadow;
    }
  });
  return grp;
}

export function buildProceduralTree(
  style: 'palm' | 'pine' | 'broadleaf',
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  castShadow: boolean
): THREE.Group {
  const grp = new THREE.Group();

  if (style === 'palm') {
    const segGeo = trackGeo(new THREE.CylinderGeometry(0.13, 0.18, 1.1, 7));
    let curY = 0.5;
    let curX = 0;
    for (let s = 0; s < 4; s++) {
      const seg = new THREE.Mesh(segGeo, mats.timberWood);
      seg.position.set(curX, curY, 0);
      seg.rotation.z = -0.11 * (s + 1);
      grp.add(seg);
      curX += 0.12 * (s + 1);
      curY += 0.95;
    }
    const frondGeo = trackGeo(new THREE.ConeGeometry(0.32, 2.1, 5));
    for (let f = 0; f < 6; f++) {
      const ang = (f / 6) * Math.PI * 2;
      const frond = new THREE.Mesh(frondGeo, mats.leafFoliage);
      frond.position.set(curX + Math.cos(ang) * 0.72, curY - 0.1, Math.sin(ang) * 0.72);
      frond.rotation.order = 'YXZ';
      frond.rotation.y = -ang;
      frond.rotation.z = -1.18;
      grp.add(frond);
    }
  } else if (style === 'pine') {
    const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.24, 1.7, 7)), mats.timberWood);
    trunk.position.y = 0.85;
    grp.add(trunk);
    for (let tier = 0; tier < 3; tier++) {
      const cone = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(1.15 - tier * 0.24, 1.65 - tier * 0.18, 7)),
        mats.leafFoliage
      );
      cone.position.y = 1.65 + tier * 0.95;
      grp.add(cone);
    }
  } else {
    const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.25, 1.8, 7)), mats.timberWood);
    trunk.position.y = 0.9;
    const crownA = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(1.05, 1)), mats.leafFoliage);
    crownA.position.set(0, 2.35, 0);
    const crownB = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.75, 1)), mats.riceGreen);
    crownB.position.set(0.55, 2.05, 0.35);
    const crownC = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.72, 1)), mats.leafFoliage);
    crownC.position.set(-0.5, 2.1, -0.3);
    grp.add(trunk, crownA, crownB, crownC);
  }

  grp.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = castShadow;
      obj.receiveShadow = castShadow;
    }
  });
  return grp;
}

export function buildWoodenBoat(
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  castShadow: boolean
): THREE.Group {
  const grp = new THREE.Group();
  // 1. Tapered wooden hull + keel rim
  const hull = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.68, 3.0, 6)), mats.timberWood);
  hull.rotation.x = Math.PI / 2;
  hull.scale.set(1.18, 1.0, 0.54);
  hull.position.y = 0.18;

  const deck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, 0.07, 1.75)), mats.sandstoneMat);
  deck.position.set(0, 0.34, 0.12);

  // 2. Mast, cross-yard boom & curved canvas sail
  const mast = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.038, 0.048, 2.25, 6)), mats.timberWood);
  mast.position.set(0, 1.32, -0.15);

  const yard = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 1.45, 6)), mats.timberWood);
  yard.rotation.z = Math.PI / 2;
  yard.position.set(0, 2.1, -0.1);

  const sailGeo = trackGeo(new THREE.CylinderGeometry(0.95, 0.95, 1.35, 10, 1, true, -0.55, 1.1));
  const sail = new THREE.Mesh(sailGeo, mats.sailCloth);
  sail.position.set(0, 1.42, -0.85);

  // 3. Bow warm lantern
  const lantern = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), mats.warmWindow);
  lantern.position.set(0, 1.1, 1.05);

  grp.add(hull, deck, mast, yard, sail, lantern);
  grp.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = castShadow;
      obj.receiveShadow = castShadow;
    }
  });
  return grp;
}

export function buildCoastalLighthouse(
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  castShadow: boolean
): { group: THREE.Group; beamPivot: THREE.Group } {
  const group = new THREE.Group();

  // 1. Stone foundation plinth
  const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.1, 1.35, 0.9, 10)), mats.basaltStone);
  base.position.y = 0.45;
  // 2. Main plaster lighthouse shaft + crimson stripe band
  const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.62, 0.96, 4.8, 12)), mats.plasterWall);
  shaft.position.y = 3.2;
  const stripe = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.75, 0.84, 1.2, 12)), mats.terracottaRoof);
  stripe.position.y = 3.1;
  // 3. Gallery deck & dark iron rail
  const gallery = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.92, 0.82, 0.24, 12)), mats.obsidianMetal);
  gallery.position.y = 5.65;
  // 4. Lantern room glass + glowing beacon core
  const lanternCore = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.86, 10)), mats.warmWindow);
  lanternCore.position.y = 6.18;
  // 5. Conical roof cap
  const cap = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.95, 1.05, 10)), mats.terracottaRoof);
  cap.position.y = 7.05;

  group.add(base, shaft, stripe, gallery, lanternCore, cap);
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = castShadow;
      obj.receiveShadow = castShadow;
    }
  });

  // 6. Rotating volumetric searchlight cone (additive, no shadow)
  const beamPivot = new THREE.Group();
  beamPivot.position.y = 6.2;
  const beamMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  const beamCone = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(3.2, 24, 16, 1, true)), beamMat);
  beamCone.rotation.x = Math.PI / 2;
  beamCone.position.z = 12;
  beamPivot.add(beamCone);
  group.add(beamPivot);

  return { group, beamPivot };
}

export function buildStoneLantern(
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  castShadow: boolean
): THREE.Group {
  const grp = new THREE.Group();
  const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.34, 0.25, 6)), mats.basaltStone);
  base.position.y = 0.125;
  const post = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.14, 0.95, 6)), mats.sandstoneMat);
  post.position.y = 0.72;
  const firebox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.28, 0.26)), mats.warmWindow);
  firebox.position.y = 1.32;
  const roof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.42, 0.32, 6)), mats.basaltStone);
  roof.position.y = 1.6;
  grp.add(base, post, firebox, roof);
  grp.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = castShadow;
      obj.receiveShadow = castShadow;
    }
  });
  return grp;
}

export function buildRicePaddyCluster(
  mats: ProceduralMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  waterMat?: THREE.Material
): THREE.Group {
  const grp = new THREE.Group();
  // Shallow earthen dike rim + paddy bed + rice stalk tufts
  const rim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.6, 0.18, 2.4)), mats.sandstoneMat);
  rim.position.y = 0.06;
  const waterSheet = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(3.2, 2.0)), waterMat ?? mats.iceCrystal);
  waterSheet.rotation.x = -Math.PI / 2;
  waterSheet.position.y = 0.16;
  grp.add(rim, waterSheet);

  const stalkGeo = trackGeo(new THREE.ConeGeometry(0.11, 0.42, 4));
  for (let r = -1; r <= 1; r++) {
    for (let c = -2; c <= 2; c++) {
      const tuft = new THREE.Mesh(stalkGeo, (r + c) % 2 === 0 ? mats.riceGreen : mats.leafFoliage);
      tuft.position.set(c * 0.62, 0.34, r * 0.58);
      grp.add(tuft);
    }
  }
  return grp;
}
