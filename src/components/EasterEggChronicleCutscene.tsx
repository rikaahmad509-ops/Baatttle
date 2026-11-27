import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ChevronDown, ChevronUp, FastForward, Film, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../audio/soundManager';
import {
  applyTerrainMorph,
  ArticulatedHeroRig,
  buildArticulatedWarriorRig,
  buildCoastalLighthouse,
  buildProceduralBridge,
  buildProceduralHouse,
  buildProceduralTree,
  buildRicePaddyCluster,
  buildStoneLantern,
  buildWoodenBoat,
  createAnimatedWaterMaterial,
  createMaterialLibrary,
  createMorphingTerrain,
  createProceduralSkyDome,
  createToothedGearGeometry,
  sampleBiomeTerrainHeight,
  WORLD_WATER_LEVEL
} from '../game/easterEgg3DBuilder';

interface EasterEggChronicleCutsceneProps {
  isMuted: boolean;
  isInBattle: boolean;
  onToggleMute: () => void;
  onComplete: (completedNaturally: boolean) => void;
}

export const EASTER_EGG_TOTAL_SECONDS = 180; // 3 full minutes (5 Acts x 36s)
const ACT_DURATION = 36;
const TRANSITION_DURATION = 2.2;

interface Act3DSpec {
  id: number;
  roman: string;
  title: string;
  locationTag: string;
  accent: string;
  skyHex: number;
  zenithHex: number;
  midSkyHex: number;
  horizonHex: number;
  sunHex: number;
  fogHex: number;
  fogDensity: number;
  keyColor: number;
  keyIntensity: number;
  keyPos: [number, number, number];
  rimColor: number;
  rimIntensity: number;
  rimPos: [number, number, number];
  fillColor: number;
  fillIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  envIntensity: number;
  exposure: number;
  bloomStrength: number;
  beats: [string, string, string];
}

const ACTS_3D: Act3DSpec[] = [
  {
    id: 0,
    roman: 'I',
    title: 'GERBANG OBSIDIAN & PORTAL PERTAMA',
    locationTag: '00:00 – 00:36 · Pantai Pesisir, Laut & Desa Basalt',
    accent: '#22d3ee',
    skyHex: 0x040914,
    zenithHex: 0x020612,
    midSkyHex: 0x091933,
    horizonHex: 0x12405c,
    sunHex: 0x38bdf8,
    fogHex: 0x081729,
    fogDensity: 0.015,
    keyColor: 0xbae6fd,
    keyIntensity: 0.98,
    keyPos: [6, 14, 8],
    rimColor: 0x22d3ee,
    rimIntensity: 0.72,
    rimPos: [-4, 10, -14],
    fillColor: 0x3b82f6,
    fillIntensity: 0.24,
    hemiSky: 0x38bdf8,
    hemiGround: 0x0b1120,
    hemiIntensity: 0.32,
    envIntensity: 0.24,
    exposure: 0.78,
    bloomStrength: 0.24,
    beats: [
      'Di tepi pantai berpasir dan perumahan pesisir di bawah langit malam, Traveler melangkah menuju dermaga Portal di bibir laut.',
      'Dimension Judge menembus Portal dari arah lautan dengan bilah kembar menyala—memantulkan cahaya sian di permukaan air dan perahu layar.',
      'Ketiga pahlawan menyatukan energi kosmik di pelataran pantai, membuka Segel Kronik Omega berdurasi penuh tiga menit.'
    ]
  },
  {
    id: 1,
    roman: 'II',
    title: 'DUEL PUNCAK EMAS & MONOLIT ES',
    locationTag: '00:36 – 01:12 · Sawah Terasering, Sungai & Pegunungan',
    accent: '#f59e0b',
    skyHex: 0x160f08,
    zenithHex: 0x0f0d1a,
    midSkyHex: 0x3b2314,
    horizonHex: 0x92400e,
    sunHex: 0xfde68a,
    fogHex: 0x26180c,
    fogDensity: 0.014,
    keyColor: 0xfde68a,
    keyIntensity: 1.25,
    keyPos: [15, 9.5, 11],
    rimColor: 0x38bdf8,
    rimIntensity: 0.65,
    rimPos: [-12, 11, -10],
    fillColor: 0xf59e0b,
    fillIntensity: 0.26,
    hemiSky: 0xf59e0b,
    hemiGround: 0x1c1917,
    hemiIntensity: 0.36,
    envIntensity: 0.34,
    exposure: 0.84,
    bloomStrength: 0.22,
    beats: [
      'Di dataran tinggi yang dikelilingi sawah terasering, perumahan desa, dan sungai pegunungan, Monkey King membangkitkan dua belas bayangan emas.',
      'Valkyrie Frost meluncur melintasi jembatan sungai! Benturan tombak kristal dan tongkat Ruyi memercikkan api keemasan di pematang sawah!',
      'Enam monolit safir bangkit di tepi sawah bertingkat saat Valkyrie melayang di bawah aurora keemasan.'
    ]
  },
  {
    id: 2,
    roman: 'III',
    title: 'KATEDRAL RODA WAKTU & PARADOKS',
    locationTag: '01:12 – 01:48 · Lembah Sungai & Kota Katedral',
    accent: '#67e8f9',
    skyHex: 0x050c18,
    zenithHex: 0x030714,
    midSkyHex: 0x121b3a,
    horizonHex: 0x1e3a5f,
    sunHex: 0xa855f7,
    fogHex: 0x0b182e,
    fogDensity: 0.016,
    keyColor: 0xe0f2fe,
    keyIntensity: 1.08,
    keyPos: [-9, 17, 9],
    rimColor: 0xa855f7,
    rimIntensity: 0.78,
    rimPos: [10, 8, -14],
    fillColor: 0x06b6d4,
    fillIntensity: 0.25,
    hemiSky: 0x38bdf8,
    hemiGround: 0x13112c,
    hemiIntensity: 0.3,
    envIntensity: 0.26,
    exposure: 0.8,
    bloomStrength: 0.25,
    beats: [
      'Di tengah lembah katedral yang dikelilingi kanal sungai, jembatan batu, dan perumahan kota tua, Traveler berduel cepat melawan Dimension Judge.',
      'WAKTU MEMBEKU! Air sungai, kawanan burung, dan jarum jam raksasa berhenti total sementara Traveler berjalan mengelilingi Judge di udara!',
      'Traveler memutar lentera waktu berlawanan arah jarum jam—memundurkan roda waktu, pecahan kaca, dan gerakan musuh!'
    ]
  },
  {
    id: 3,
    roman: 'IV',
    title: 'GERHANA MERAH DI HUTAN BAMBU',
    locationTag: '01:48 – 02:24 · Desa Sawah, Sungai & Hutan Bambu',
    accent: '#f43f5e',
    skyHex: 0x110409,
    zenithHex: 0x090207,
    midSkyHex: 0x2b0815,
    horizonHex: 0x6b1028,
    sunHex: 0xf43f5e,
    fogHex: 0x1e0711,
    fogDensity: 0.017,
    keyColor: 0xfda4af,
    keyIntensity: 1.0,
    keyPos: [2, 13, -15],
    rimColor: 0xfb7185,
    rimIntensity: 0.85,
    rimPos: [-10, 7, -10],
    fillColor: 0xf59e0b,
    fillIntensity: 0.22,
    hemiSky: 0xbe123c,
    hemiGround: 0x090d16,
    hemiIntensity: 0.27,
    envIntensity: 0.2,
    exposure: 0.76,
    bloomStrength: 0.27,
    beats: [
      'Di desa sawah hijau di tepi sungai dan perumahan kayu dekat hutan bambu, Samurai Kagero bersiap dalam kuda-kuda Iaido.',
      'Keduanya melesat melintasi pelataran hujan di dekat jembatan kayu merah! Tebasan katana dan kelopak Higanbana menyapu udara!',
      'Di puncak badai gerhana merah, Kagero melancarkan tebasan pusaran di depan gerbang kuil Torii!'
    ]
  },
  {
    id: 4,
    roman: 'V',
    title: 'OBSERVATORIUM PRISMA & KONVERGENSI OMEGA',
    locationTag: '02:24 – 03:00 · Semenanjung Pantai, Kota Pelabuhan & Lautan',
    accent: '#fde047',
    skyHex: 0x040814,
    zenithHex: 0x030718,
    midSkyHex: 0x141b41,
    horizonHex: 0x115e59,
    sunHex: 0xfde047,
    fogHex: 0x09162b,
    fogDensity: 0.013,
    keyColor: 0xfef9c3,
    keyIntensity: 1.15,
    keyPos: [9, 16, 11],
    rimColor: 0x2dd4bf,
    rimIntensity: 0.8,
    rimPos: [-11, 10, -12],
    fillColor: 0xc084fc,
    fillIntensity: 0.28,
    hemiSky: 0x2dd4bf,
    hemiGround: 0x151336,
    hemiIntensity: 0.34,
    envIntensity: 0.3,
    exposure: 0.85,
    bloomStrength: 0.26,
    beats: [
      'Di semenanjung pantai dan perumahan pelabuhan yang dikelilingi lautan luas, Architect dan Lumina merangkai cincin kode di sekitar Tesseract.',
      'Keempat pahlawan melangkah ke altar semenanjung, sementara kapal layar dan sorot mercusuar menyapu ombak pantai.',
      'Keenam pahlawan memancarkan berkas prisma serentak ke inti Tesseract—menganugerahkan Berkah Konvergensi Omega!'
    ]
  }
];

const HERO_COLORS = [
  0xf59e0b, 0xa855f7, 0x38bdf8, 0xef4444, 0x67e8f9,
  0x818cf8, 0xfbbf24, 0x22c55e, 0xf43f5e, 0xec4899,
  0xc084fc, 0xe0f2fe, 0x34d399, 0xe11d48, 0x2dd4bf
];

// Pre-allocated scratch helpers (zero GC inside render tick)
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _curLook = new THREE.Vector3(0, 1.8, 0);
const _dummy = new THREE.Object3D();
const _skyTarget = new THREE.Color();
const _fogTarget = new THREE.Color();
const _keyTarget = new THREE.Color();
const _rimTarget = new THREE.Color();
const _fillTarget = new THREE.Color();
const _hemiSkyTarget = new THREE.Color();
const _hemiGroundTarget = new THREE.Color();
const _accentTarget = new THREE.Color();
const _keyPosTarget = new THREE.Vector3();
const _rimPosTarget = new THREE.Vector3();
const _beamUp = new THREE.Vector3(0, 1, 0);
const _beamDir = new THREE.Vector3();
const _beamQuat = new THREE.Quaternion();
const _waterColTarget = new THREE.Color();
const _waterEmissiveTarget = new THREE.Color();
const _zenithTarget = new THREE.Color();
const _midSkyTarget = new THREE.Color();
const _horizonTarget = new THREE.Color();
const _sunTarget = new THREE.Color();

function updateShadowDisc(rig: ArticulatedHeroRig, heightAboveGround: number): void {
  const h = Math.max(0, heightAboveGround);
  rig.shadowDisc.position.y = -h + 0.015;
  const s = Math.max(0.35, 1 - h * 0.11);
  rig.shadowDisc.scale.setScalar(s);
}

function formatClock(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function easeOutCubic(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - t, 3);
}

function smoothstep01(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

export const EasterEggChronicleCutscene: React.FC<EasterEggChronicleCutsceneProps> = ({
  isMuted,
  isInBattle,
  onToggleMute,
  onComplete
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  const elapsedRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);
  const lastActAudioRef = useRef<number>(-1);
  const firedCuesRef = useRef<Set<string>>(new Set());
  const pointerOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const manualJumpTriggerRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Keyboard shortcuts (Space: Pause/Resume, H: Toggle HUD, Esc: Skip)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current(false);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        setIsPaused((p) => !p);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        e.stopPropagation();
        setIsHudCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, []);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;

    const probeCanvas = document.createElement('canvas');
    const glProbe = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!glProbe) {
      setWebglError(true);
      return;
    }
    const debugExt = glProbe.getExtension('WEBGL_debug_renderer_info');
    const gpuStr = debugExt ? String(glProbe.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '') : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuStr);
    glProbe.getExtension('WEBGL_lose_context')?.loseContext();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance'
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = ACTS_3D[0].exposure;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const domCanvas = renderer.domElement;
    domCanvas.style.width = '100%';
    domCanvas.style.height = '100%';
    domCanvas.style.display = 'block';
    host.appendChild(domCanvas);

    const disposables: Array<{ dispose: () => void }> = [];
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposables.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposables.push(m);
      return m;
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(ACTS_3D[0].skyHex);
    const sceneFog = new THREE.FogExp2(ACTS_3D[0].fogHex, ACTS_3D[0].fogDensity);
    scene.fog = sceneFog;

    const skyDome = createProceduralSkyDome(trackGeo, trackMat);
    skyDome.uniforms.uZenith.value.setHex(ACTS_3D[0].zenithHex);
    skyDome.uniforms.uMidSky.value.setHex(ACTS_3D[0].midSkyHex);
    skyDome.uniforms.uHorizon.value.setHex(ACTS_3D[0].horizonHex);
    skyDome.uniforms.uSunColor.value.setHex(ACTS_3D[0].sunHex);
    scene.add(skyDome.mesh);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 240);
    camera.position.set(0, 4.5, 16);
    _curLook.set(0, 2.2, -1);

    // Calibrated Studio Environment Reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = ACTS_3D[0].envIntensity;
    disposables.push(envRT, roomEnv, pmrem);

    const mats = createMaterialLibrary(isSoftwareGl, renderer.capabilities.getMaxAnisotropy());

    // =========================================================
    // 4-Point Cinematic Lighting Rig + Atmospheric God-Rays
    // =========================================================
    const hemiLight = new THREE.HemisphereLight(
      ACTS_3D[0].hemiSky,
      ACTS_3D[0].hemiGround,
      ACTS_3D[0].hemiIntensity
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(ACTS_3D[0].keyColor, ACTS_3D[0].keyIntensity);
    keyLight.position.set(...ACTS_3D[0].keyPos);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.radius = 3.5;
      keyLight.shadow.camera.left = -22;
      keyLight.shadow.camera.right = 22;
      keyLight.shadow.camera.top = 22;
      keyLight.shadow.camera.bottom = -22;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 65;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.025;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(ACTS_3D[0].rimColor, ACTS_3D[0].rimIntensity);
    rimLight.position.set(...ACTS_3D[0].rimPos);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(ACTS_3D[0].fillColor, ACTS_3D[0].fillIntensity);
    fillLight.position.set(-10, 5, 12);
    scene.add(fillLight);

    const centerPointLight = new THREE.PointLight(0x22d3ee, 2.8, 24, 2.0);
    centerPointLight.position.set(0, 3.8, 0);
    scene.add(centerPointLight);

    const accentPointLight = new THREE.PointLight(0xf59e0b, 1.5, 22, 2.0);
    accentPointLight.position.set(0, 8, -8);
    scene.add(accentPointLight);

    // Subtle volumetric-style light beam shaft (tracks key light / focal point)
    const shaftMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.028,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    const lightShaft = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(7.2, 22, 24, 1, true)),
      shaftMat
    );
    lightShaft.position.set(0, 10, -4);
    lightShaft.rotation.x = 0.14;
    scene.add(lightShaft);

    // =========================================================
    // Procedural Multi-Biome Morphing 3D Terrain + Animated Ocean/River Water
    // =========================================================
    const terrainData = createMorphingTerrain(156, isSoftwareGl ? 56 : 104);
    trackGeo(terrainData.geometry);
    const terrainMesh = new THREE.Mesh(terrainData.geometry, mats.terrainMat);
    terrainMesh.receiveShadow = !isSoftwareGl;
    terrainMesh.castShadow = !isSoftwareGl;
    scene.add(terrainMesh);

    const waterFx = createAnimatedWaterMaterial(trackMat, isSoftwareGl);
    const waterMesh = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(176, 176, isSoftwareGl ? 36 : 64, isSoftwareGl ? 36 : 64)),
      waterFx.material
    );
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = WORLD_WATER_LEVEL;
    waterMesh.receiveShadow = !isSoftwareGl;
    scene.add(waterMesh);

    // Sculpted Central Arena Sanctum Medallion (grounded flush at y = 0)
    const centralDais = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(8.1, 8.8, 0.16, 48)),
      mats.marbleFloor
    );
    centralDais.position.y = -0.08;
    centralDais.receiveShadow = !isSoftwareGl;
    scene.add(centralDais);

    const outerPlinth = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(8.9, 9.6, 0.14, 48)),
      mats.basaltStone
    );
    outerPlinth.position.y = -0.15;
    outerPlinth.receiveShadow = !isSoftwareGl;
    scene.add(outerPlinth);

    const daisTrimRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(8.25, 0.11, 10, 64)),
      mats.brushedBronze
    );
    daisTrimRing.rotation.x = Math.PI / 2;
    daisTrimRing.position.y = 0.01;
    scene.add(daisTrimRing);

    const daisRuneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x22d3ee,
        emissiveIntensity: 1.15,
        roughness: 0.25,
        metalness: 0.4
      })
    );
    const daisInnerRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(4.4, 0.045, 8, 64)),
      daisRuneMat
    );
    daisInnerRing.rotation.x = Math.PI / 2;
    daisInnerRing.position.y = 0.012;
    scene.add(daisInnerRing);

    const spokeGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.02, 3.6));
    for (let sp = 0; sp < 8; sp++) {
      const ang = (sp / 8) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeo, daisRuneMat);
      spoke.position.set(Math.sin(ang) * 6.25, 0.01, Math.cos(ang) * 6.25);
      spoke.rotation.y = ang;
      scene.add(spoke);
    }

    // Persistent Ambient Depth Motes (72 drifting specks across the arena)
    const ambientMoteCount = 72;
    const ambientMoteMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const ambientMotes = new THREE.InstancedMesh(
      trackGeo(new THREE.OctahedronGeometry(0.065, 0)),
      ambientMoteMat,
      ambientMoteCount
    );
    ambientMotes.frustumCulled = false;
    scene.add(ambientMotes);

    // Warm Floating Fireflies / Village Lantern Motes (InstancedMesh)
    const fireflyCount = 36;
    const fireflyMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const fireflyMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.SphereGeometry(0.055, 6, 6)),
      fireflyMat,
      fireflyCount
    );
    fireflyMesh.frustumCulled = false;
    scene.add(fireflyMesh);

    // Gliding Distant Sky Birds (InstancedMesh of stylized V-wing silhouettes)
    const birdCount = 14;
    const birdShape = new THREE.Shape();
    birdShape.moveTo(-0.45, 0.08);
    birdShape.lineTo(-0.1, 0.0);
    birdShape.lineTo(0, 0.12);
    birdShape.lineTo(0.1, 0.0);
    birdShape.lineTo(0.45, 0.08);
    birdShape.lineTo(0.12, -0.06);
    birdShape.lineTo(0, 0.02);
    birdShape.lineTo(-0.12, -0.06);
    birdShape.closePath();
    const birdGeo = trackGeo(new THREE.ShapeGeometry(birdShape));
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide }));
    const birdMesh = new THREE.InstancedMesh(birdGeo, birdMat, birdCount);
    birdMesh.frustumCulled = false;
    scene.add(birdMesh);

    // Terrain-Grounded Perimeter Rock Outcrops (InstancedMesh — auto-hides if submerged in water/rivers)
    const rockGeo = trackGeo(new THREE.DodecahedronGeometry(1.45, 1));
    const rockCount = 32;
    const rockSeeds: Array<{ x: number; z: number; ang: number; sx: number; sy: number; sz: number }> = [];
    const perimeterRocks = new THREE.InstancedMesh(rockGeo, mats.basaltStone, rockCount);
    perimeterRocks.frustumCulled = false;
    perimeterRocks.receiveShadow = !isSoftwareGl;
    perimeterRocks.castShadow = !isSoftwareGl;
    for (let i = 0; i < rockCount; i++) {
      const ang = (i / rockCount) * Math.PI * 2 + (i % 3) * 0.08;
      const rad = 18.5 + (i % 5) * 4.4;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const sx = 1.3 + (i % 3) * 0.75;
      const sy = 1.8 + (i % 4) * 1.1;
      const sz = 1.3 + ((i + 1) % 3) * 0.75;
      rockSeeds.push({ x, z, ang, sx, sy, sz });

      const yTerrain = sampleBiomeTerrainHeight(x, z, 0);
      const dryMask = yTerrain > WORLD_WATER_LEVEL + 0.16 ? 1 : 0;
      _dummy.position.set(x, yTerrain + sy * 0.35, z);
      _dummy.rotation.set((i % 3) * 0.15, ang, ((i + 1) % 2) * 0.12);
      _dummy.scale.set(sx * dryMask, sy * dryMask, sz * dryMask);
      _dummy.updateMatrix();
      perimeterRocks.setMatrixAt(i, _dummy.matrix);
    }
    perimeterRocks.instanceMatrix.needsUpdate = true;
    perimeterRocks.computeBoundingSphere();
    scene.add(perimeterRocks);

    // Persistent Starfield Dome (InstancedMesh)
    const starGeo = trackGeo(new THREE.OctahedronGeometry(0.16, 0));
    const starMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
    const starCount = 240;
    const starField = new THREE.InstancedMesh(starGeo, starMat, starCount);
    starField.frustumCulled = false;
    for (let i = 0; i < starCount; i++) {
      const theta = i * 2.39996;
      const phi = Math.acos(1 - 2 * ((i + 0.5) / starCount));
      const r = 64 + (i % 6) * 4;
      _dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        Math.max(5, Math.abs(r * Math.cos(phi)) + 6),
        r * Math.sin(phi) * Math.sin(theta)
      );
      _dummy.scale.setScalar(0.55 + (i % 4) * 0.32);
      _dummy.updateMatrix();
      starField.setMatrixAt(i, _dummy.matrix);
    }
    starField.instanceMatrix.needsUpdate = true;
    starField.computeBoundingSphere();
    scene.add(starField);

    // =========================================================
    // Dimensional Transition Vortex & Shockwave (Between Acts)
    // =========================================================
    const transVortexGroup = new THREE.Group();
    transVortexGroup.visible = false;
    scene.add(transVortexGroup);

    const transParticleCount = 96;
    const transParticleMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const transParticles = new THREE.InstancedMesh(
      trackGeo(new THREE.OctahedronGeometry(0.14, 0)),
      transParticleMat,
      transParticleCount
    );
    transParticles.frustumCulled = false;
    transVortexGroup.add(transParticles);

    const transWaveMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const transWaveRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(4.5, 0.08, 10, 64)),
      transWaveMat
    );
    transWaveRing.rotation.x = Math.PI / 2;
    transWaveRing.position.y = 1.6;
    transVortexGroup.add(transWaveRing);

    // =========================================================
    // ACT I GROUP: Obsidian Gate, Portal & 3-Hero Arrival
    // =========================================================
    const act1Group = new THREE.Group();
    scene.add(act1Group);

    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 4.2, -5.2);
    act1Group.add(portalGroup);

    const portalOuterRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(3.8, 0.24, 16, 64)),
      mats.brushedBronze
    );
    const portalInnerRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(3.25, 0.12, 12, 64)),
      mats.cyanPlasma
    );
    const portalGoldHalo = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(4.3, 0.08, 10, 64)),
      mats.goldEmissive
    );
    const portalVortexRing = new THREE.Mesh(
      trackGeo(new THREE.TorusKnotGeometry(2.1, 0.09, 100, 12, 2, 3)),
      mats.cyanPlasma
    );
    const portalDiscMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    const portalVortexDisc = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(3.12, 48)),
      portalDiscMat
    );
    portalGroup.add(portalOuterRing, portalInnerRing, portalGoldHalo, portalVortexRing, portalVortexDisc);

    // Floating obsidian stepping rune stones leading toward the Portal
    const act1StepStones: THREE.Mesh[] = [];
    for (let st = 0; st < 4; st++) {
      const stone = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.68 - st * 0.05, 0.78 - st * 0.05, 0.22, 6)),
        mats.obsidianMetal
      );
      stone.position.set((st % 2 === 0 ? -1 : 1) * 0.35, 0.16 + st * 0.14, 1.4 - st * 1.65);
      stone.receiveShadow = !isSoftwareGl;
      stone.castShadow = !isSoftwareGl;
      const runeTrim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.55 - st * 0.04, 0.025, 6, 24)),
        mats.cyanPlasma
      );
      runeTrim.rotation.x = Math.PI / 2;
      runeTrim.position.y = 0.12;
      stone.add(runeTrim);
      act1Group.add(stone);
      act1StepStones.push(stone);
    }

    // Flanking Basalt Pillars grounded onto Act I terrain
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const px = side * (4.6 + row * 0.8);
      const pz = 3.2 - row * 3.6;
      const baseH = sampleBiomeTerrainHeight(px, pz, 0);
      const pHeight = 5.2 + row * 0.7;
      const pillar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.45, 0.62, pHeight, 6)),
        mats.obsidianMetal
      );
      pillar.position.set(px, baseH + pHeight * 0.5, pz);
      pillar.castShadow = !isSoftwareGl;
      pillar.receiveShadow = !isSoftwareGl;
      const capOrb = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.32, 0)), mats.cyanPlasma);
      capOrb.position.set(px, baseH + pHeight + 0.5, pz);
      act1Group.add(pillar, capOrb);
    }

    const travelerRig = buildArticulatedWarriorRig('traveler', mats, trackGeo, !isSoftwareGl);
    travelerRig.root.position.set(-1.4, 0, 5.8);
    travelerRig.root.rotation.y = Math.PI;
    act1Group.add(travelerRig.root);

    const act1JudgeRig = buildArticulatedWarriorRig('dimensionJudge', mats, trackGeo, !isSoftwareGl);
    act1JudgeRig.root.position.set(0, 0.2, -5.2);
    act1Group.add(act1JudgeRig.root);

    const act1AngelRig = buildArticulatedWarriorRig('fallenAngel', mats, trackGeo, !isSoftwareGl);
    act1AngelRig.root.position.set(3.2, 8.5, 1.2);
    act1AngelRig.root.rotation.y = -Math.PI * 0.78;
    act1Group.add(act1AngelRig.root);

    const act1ShockMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const act1ShockRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(2.4, 0.09, 10, 48)),
      act1ShockMat
    );
    act1ShockRing.rotation.x = Math.PI / 2;
    act1ShockRing.position.set(0, 0.4, -1.6);
    act1Group.add(act1ShockRing);

    // Act I Unity Beams (3 Heroes channel energy into the central omega seal)
    const act1UnityMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    const act1UnityGeo = trackGeo(new THREE.CylinderGeometry(0.05, 0.09, 1, 8, 1, true));
    const act1UnityBeams = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(act1UnityGeo, act1UnityMat);
      m.visible = false;
      act1Group.add(m);
      return m;
    });

    // Act I Coastal Pier, Stone Lanterns, Sandy Beach Palm Trees, Coastal Village Houses & Ocean Boats
    const pierDeck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.4, 0.24, 9.2)), mats.timberWood);
    pierDeck.position.set(0, -0.04, -11.4);
    pierDeck.receiveShadow = !isSoftwareGl;
    pierDeck.castShadow = !isSoftwareGl;
    act1Group.add(pierDeck);
    for (const px of [-1.45, 1.45]) {
      for (const pz of [-8.2, -11.6, -15.0]) {
        const pile = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 1.8, 8)), mats.timberWood);
        pile.position.set(px, -0.65, pz);
        const cap = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), mats.warmWindow);
        cap.position.set(px, 0.35, pz);
        act1Group.add(pile, cap);
      }
    }
    for (const lx of [-10.5, 10.5]) {
      const lantern = buildStoneLantern(mats, trackGeo, !isSoftwareGl);
      lantern.position.set(lx, sampleBiomeTerrainHeight(lx, 2.5, 0), 2.5);
      act1Group.add(lantern);
    }

    const act1HouseCoords: Array<[number, number, number]> = [
      [-14.5, 4.2, Math.PI * 0.38],
      [-17.5, -1.6, Math.PI * 0.48],
      [-13.5, 11.2, Math.PI * 0.25],
      [14.5, 4.0, -Math.PI * 0.38],
      [17.8, -1.8, -Math.PI * 0.48],
      [13.8, 11.0, -Math.PI * 0.25]
    ];
    for (const [hx, hz, hRot] of act1HouseCoords) {
      const house = buildProceduralHouse('coastal', mats, trackGeo, !isSoftwareGl);
      house.position.set(hx, sampleBiomeTerrainHeight(hx, hz, 0), hz);
      house.rotation.y = hRot;
      act1Group.add(house);
    }

    const act1PalmCoords: Array<[number, number, number]> = [
      [-10.8, -9.6, 0.4], [-14.8, -8.5, 1.2], [-19.2, -7.2, 2.3],
      [-12.2, 1.2, 0.8], [-19.8, 6.2, 1.9],
      [11.0, -9.4, -0.4], [15.2, -8.3, -1.4], [19.4, -7.0, -2.1],
      [12.4, 1.5, -0.9], [19.6, 6.5, -1.7]
    ];
    for (const [tx, tz, tRot] of act1PalmCoords) {
      const palm = buildProceduralTree('palm', mats, trackGeo, !isSoftwareGl);
      palm.position.set(tx, sampleBiomeTerrainHeight(tx, tz, 0), tz);
      palm.rotation.y = tRot;
      act1Group.add(palm);
    }

    const act1Boats: THREE.Group[] = [];
    const act1BoatPos: Array<[number, number, number]> = [
      [-8.5, -19.5, 0.65],
      [9.2, -21.0, -0.55]
    ];
    for (const [bx, bz, bRot] of act1BoatPos) {
      const boat = buildWoodenBoat(mats, trackGeo, !isSoftwareGl);
      boat.position.set(bx, WORLD_WATER_LEVEL + 0.02, bz);
      boat.rotation.y = bRot;
      act1Group.add(boat);
      act1Boats.push(boat);
    }

    // =========================================================
    // ACT II GROUP: Monkey King vs Valkyrie Frost + Clones + Monoliths + Braziers
    // =========================================================
    const act2Group = new THREE.Group();
    act2Group.visible = false;
    scene.add(act2Group);

    const guardianRig = buildArticulatedWarriorRig('guardian', mats, trackGeo, !isSoftwareGl);
    guardianRig.root.position.set(-2.2, 0, 0);
    guardianRig.root.rotation.y = Math.PI / 2;
    act2Group.add(guardianRig.root);

    const valkyrieRig = buildArticulatedWarriorRig('valkyrie', mats, trackGeo, !isSoftwareGl);
    valkyrieRig.root.position.set(6.5, 0, 0);
    valkyrieRig.root.rotation.y = -Math.PI / 2;
    act2Group.add(valkyrieRig.root);

    const act2ClashMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const act2ClashRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(1.8, 0.1, 10, 48)),
      act2ClashMat
    );
    act2ClashRing.rotation.x = Math.PI / 2;
    act2ClashRing.position.set(0, 1.4, 0);
    act2Group.add(act2ClashRing);

    // Flanking Stone Summit Braziers
    const brazierFlames: THREE.Mesh[] = [];
    for (const bx of [-5.8, 5.8]) {
      const bz = -3.8;
      const bBaseY = sampleBiomeTerrainHeight(bx, bz, 1);
      const ped = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.5, 0.72, 1.6, 8)), mats.basaltStone);
      ped.position.set(bx, bBaseY + 0.8, bz);
      ped.castShadow = !isSoftwareGl;
      ped.receiveShadow = !isSoftwareGl;
      const bowl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.85, 0.45, 0.48, 8)), mats.brushedBronze);
      bowl.position.set(bx, bBaseY + 1.75, bz);
      const flame = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.45, 0)), mats.goldEmissive);
      flame.position.set(bx, bBaseY + 2.25, bz);
      act2Group.add(ped, bowl, flame);
      brazierFlames.push(flame);
    }

    const summitDustCount = 48;
    const summitDustMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.OctahedronGeometry(0.08, 0)),
      mats.goldEmissive,
      summitDustCount
    );
    summitDustMesh.frustumCulled = false;
    act2Group.add(summitDustMesh);

    const act2SparkCount = 36;
    const act2SparkMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.OctahedronGeometry(0.09, 0)),
      mats.goldEmissive,
      act2SparkCount
    );
    act2SparkMesh.frustumCulled = false;
    act2Group.add(act2SparkMesh);

    const cloneOrbits: THREE.Group[] = [];
    for (let c = 0; c < 12; c++) {
      const cg = new THREE.Group();
      const body = new THREE.Mesh(trackGeo(new THREE.CapsuleGeometry(0.2, 0.75, 4, 8)), mats.goldEmissive);
      body.position.y = 0.75;
      const staff = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 6)), mats.brushedBronze);
      staff.position.set(0.28, 0.85, 0);
      staff.rotation.z = 0.45;
      cg.add(body, staff);
      act2Group.add(cg);
      cloneOrbits.push(cg);
    }

    const monolithGroup = new THREE.Group();
    act2Group.add(monolithGroup);
    const monoliths: THREE.Mesh[] = [];
    for (let m = 0; m < 6; m++) {
      const ang = (m / 6) * Math.PI * 2;
      const mx = Math.cos(ang) * 7.6;
      const mz = Math.sin(ang) * 7.6;
      const mBaseY = sampleBiomeTerrainHeight(mx, mz, 1);
      const crystal = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.15, 0.8, 5.8, 6)),
        mats.iceCrystal
      );
      crystal.position.set(mx, mBaseY + 2.7, mz);
      crystal.rotation.z = (m % 2 === 0 ? 1 : -1) * 0.08;
      monolithGroup.add(crystal);
      monoliths.push(crystal);
    }

    const auroraRingA = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(9.2, 0.14, 10, 72)),
      mats.cyanPlasma
    );
    auroraRingA.rotation.x = Math.PI / 2.2;
    auroraRingA.position.y = 7.2;
    monolithGroup.add(auroraRingA);

    // Act II Mountain River Bridge, Stepped Rice Paddies (Sawah), Farmhouses & Pine Trees
    const act2Bridge = buildProceduralBridge('stone', mats, trackGeo, !isSoftwareGl);
    act2Bridge.position.set(-13.2, -0.32, 0.0);
    act2Bridge.rotation.y = -0.18;
    act2Group.add(act2Bridge);

    const act2PaddyCoords: Array<[number, number, number]> = [
      [12.4, -5.2, 0.15], [16.4, -4.6, 0.22],
      [12.8, 1.4, -0.05], [16.8, 1.8, 0.08],
      [12.5, 7.8, -0.22], [16.5, 8.2, -0.18],
      [-20.2, -4.8, 0.2], [-20.4, 5.2, -0.15]
    ];
    for (const [rx, rz, rRot] of act2PaddyCoords) {
      const paddy = buildRicePaddyCluster(mats, trackGeo, waterFx.material);
      paddy.position.set(rx, sampleBiomeTerrainHeight(rx, rz, 1), rz);
      paddy.rotation.y = rRot;
      act2Group.add(paddy);
    }

    const act2HouseCoords: Array<[number, number, number]> = [
      [-19.5, 0.4, Math.PI * 0.5],
      [-17.8, 11.2, Math.PI * 0.35],
      [14.2, -10.8, -Math.PI * 0.25],
      [20.4, -1.8, -Math.PI * 0.52],
      [19.2, 11.0, -Math.PI * 0.72]
    ];
    for (const [hx, hz, hRot] of act2HouseCoords) {
      const house = buildProceduralHouse('village', mats, trackGeo, !isSoftwareGl);
      house.position.set(hx, sampleBiomeTerrainHeight(hx, hz, 1), hz);
      house.rotation.y = hRot;
      act2Group.add(house);
    }

    const act2TreeCoords: Array<[number, number]> = [
      [-17.5, -8.5], [-21.5, -10.5], [-16.2, 7.8], [11.2, -11.5],
      [18.2, -9.2], [21.6, 4.5], [16.2, 13.5], [10.4, 12.2]
    ];
    for (let ti = 0; ti < act2TreeCoords.length; ti++) {
      const [tx, tz] = act2TreeCoords[ti];
      const tree = buildProceduralTree(ti % 2 === 0 ? 'pine' : 'broadleaf', mats, trackGeo, !isSoftwareGl);
      tree.position.set(tx, sampleBiomeTerrainHeight(tx, tz, 1), tz);
      act2Group.add(tree);
    }

    // =========================================================
    // ACT III GROUP: Cathedral Gears, Clock Dial & Hands, Archways, Time-Stop Duel & Tarot
    // =========================================================
    const act3Group = new THREE.Group();
    act3Group.visible = false;
    scene.add(act3Group);

    const act3TravelerRig = buildArticulatedWarriorRig('traveler', mats, trackGeo, !isSoftwareGl);
    act3Group.add(act3TravelerRig.root);

    const act3JudgeRig = buildArticulatedWarriorRig('dimensionJudge', mats, trackGeo, !isSoftwareGl);
    act3Group.add(act3JudgeRig.root);

    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2 + Math.PI / 8;
      const cx = Math.cos(ang) * 10.6;
      const cz = Math.sin(ang) * 10.6;
      const baseH = sampleBiomeTerrainHeight(cx, cz, 2);
      const col = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.52, 0.68, 12.4, 10)),
        mats.sandstoneMat
      );
      col.position.set(cx, baseH + 6.0, cz);
      col.castShadow = !isSoftwareGl;
      col.receiveShadow = !isSoftwareGl;
      act3Group.add(col);
    }

    // Overhead Cathedral Sandstone Arch Ribs
    for (let ar = 0; ar < 4; ar++) {
      const rib = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(10.6, 0.34, 8, 36, Math.PI)),
        mats.sandstoneMat
      );
      rib.position.y = 6.2;
      rib.rotation.y = (ar / 4) * Math.PI + Math.PI / 8;
      act3Group.add(rib);
    }

    const gearSpecs = [
      { r: 3.2, hole: 0.7, teeth: 18, d: 0.36, pos: [0, 5.4, -3.5], speed: 0.45 },
      { r: 2.2, hole: 0.5, teeth: 14, d: 0.3, pos: [-3.9, 4.2, -2.0], speed: -0.7 },
      { r: 2.0, hole: 0.45, teeth: 12, d: 0.3, pos: [3.8, 4.5, -2.2], speed: -0.75 },
      { r: 1.5, hole: 0.35, teeth: 10, d: 0.24, pos: [-2.2, 7.6, -4.0], speed: 1.05 },
      { r: 1.6, hole: 0.35, teeth: 12, d: 0.24, pos: [2.4, 7.4, -3.8], speed: -0.95 },
      { r: 2.6, hole: 0.6, teeth: 16, d: 0.3, pos: [0, 3.0, -5.8], speed: 0.55 },
      { r: 1.3, hole: 0.3, teeth: 10, d: 0.22, pos: [0, 7.9, -1.8], speed: -1.2 }
    ];
    const gears: Array<{ mesh: THREE.Mesh; speed: number }> = [];
    for (const gs of gearSpecs) {
      const gGeo = trackGeo(createToothedGearGeometry(gs.r, gs.hole, gs.teeth, gs.d));
      const gMesh = new THREE.Mesh(gGeo, mats.antiqueBrass);
      gMesh.position.set(gs.pos[0], gs.pos[1], gs.pos[2]);
      gMesh.castShadow = !isSoftwareGl;
      act3Group.add(gMesh);
      gears.push({ mesh: gMesh, speed: gs.speed });
    }

    // Monumental Glowing Clock Dial & Hour/Minute Hands
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 5.4, -3.15);
    act3Group.add(clockGroup);

    const clockDialRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(3.65, 0.08, 10, 64)),
      mats.cyanPlasma
    );
    clockGroup.add(clockDialRing);
    for (let hm = 0; hm < 12; hm++) {
      const a = (hm / 12) * Math.PI * 2;
      const tickBox = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(hm % 3 === 0 ? 0.14 : 0.07, hm % 3 === 0 ? 0.38 : 0.22, 0.08)),
        hm % 3 === 0 ? mats.goldEmissive : mats.cyanPlasma
      );
      tickBox.position.set(Math.sin(a) * 3.32, Math.cos(a) * 3.32, 0);
      tickBox.rotation.z = -a;
      clockGroup.add(tickBox);
    }

    const clockHourHand = new THREE.Group();
    const hourBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 1.85, 0.1)), mats.goldEmissive);
    hourBar.position.y = 0.82;
    clockHourHand.add(hourBar);
    clockGroup.add(clockHourHand);

    const clockMinuteHand = new THREE.Group();
    const minBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 2.85, 0.1)), mats.cyanPlasma);
    minBar.position.y = 1.32;
    clockMinuteHand.add(minBar);
    clockGroup.add(clockMinuteHand);

    const shardCount = 48;
    const shardMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.TetrahedronGeometry(0.42, 0)),
      mats.opticalGlass,
      shardCount
    );
    shardMesh.frustumCulled = false;
    act3Group.add(shardMesh);

    const tarotColors = [0xa855f7, 0xf43f5e, 0x38bdf8, 0xfbbf24];
    const tarotCards: THREE.Group[] = [];
    for (let tIdx = 0; tIdx < 4; tIdx++) {
      const cardGrp = new THREE.Group();
      const plate = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(1.15, 1.75, 0.08)),
        mats.obsidianMetal
      );
      const border = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(1.24, 1.84, 0.04)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: tarotColors[tIdx],
            emissive: tarotColors[tIdx],
            emissiveIntensity: 1.45
          })
        )
      );
      cardGrp.add(border, plate);
      act3Group.add(cardGrp);
      tarotCards.push(cardGrp);
    }

    const chronoRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(4.2, 0.09, 10, 64)),
      mats.cyanPlasma
    );
    chronoRing.position.set(0, 2.2, 0);
    chronoRing.rotation.x = Math.PI / 2;
    act3Group.add(chronoRing);

    const chronoFreezeMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        wireframe: true
      })
    );
    const chronoFreezeDome = new THREE.Mesh(
      trackGeo(new THREE.IcosahedronGeometry(7.2, 2)),
      chronoFreezeMat
    );
    chronoFreezeDome.position.set(0, 1.5, 0);
    act3Group.add(chronoFreezeDome);

    const astralLanternOrb = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(0.24, 1)),
      mats.cyanPlasma
    );
    astralLanternOrb.visible = false;
    act3Group.add(astralLanternOrb);

    // Act III Canal River Stone Bridges & Old-Town Cathedral Village Houses
    for (const bx of [-16.6, 16.6]) {
      const bridge = buildProceduralBridge('stone', mats, trackGeo, !isSoftwareGl);
      bridge.position.set(bx, -0.35, 0);
      act3Group.add(bridge);
    }

    const act3HouseAngles = [-2.4, -1.9, -1.35, -0.5, 0.5, 1.35, 1.9, 2.4];
    for (let hi = 0; hi < act3HouseAngles.length; hi++) {
      const ang = act3HouseAngles[hi];
      const rad = 23.2 + (hi % 2) * 2.2;
      const hx = Math.cos(ang) * rad;
      const hz = Math.sin(ang) * rad;
      const house = buildProceduralHouse(hi % 3 === 0 ? 'coastal' : 'townhouse', mats, trackGeo, !isSoftwareGl);
      house.position.set(hx, sampleBiomeTerrainHeight(hx, hz, 2), hz);
      house.rotation.y = -ang - Math.PI / 2;
      act3Group.add(house);
    }

    for (let ti = 0; ti < 10; ti++) {
      const ang = (ti / 10) * Math.PI * 2 + 0.25;
      const rad = 21.0 + (ti % 3) * 2.8;
      const tx = Math.cos(ang) * rad;
      const tz = Math.sin(ang) * rad;
      const tree = buildProceduralTree('pine', mats, trackGeo, !isSoftwareGl);
      tree.position.set(tx, sampleBiomeTerrainHeight(tx, tz, 2), tz);
      act3Group.add(tree);
    }

    // =========================================================
    // ACT IV GROUP: Bamboo Grove, Torii Gate, Blood Eclipse, Petals & Rain Ripples
    // =========================================================
    const act4Group = new THREE.Group();
    act4Group.visible = false;
    scene.add(act4Group);

    const bambooCount = 56;
    const bambooGrove = new THREE.InstancedMesh(
      trackGeo(new THREE.CylinderGeometry(0.14, 0.19, 13, 8)),
      mats.bambooMat,
      bambooCount
    );
    bambooGrove.frustumCulled = false;
    bambooGrove.castShadow = !isSoftwareGl;
    for (let b = 0; b < bambooCount; b++) {
      const ang = (b / bambooCount) * Math.PI * 2;
      const dist = 10.6 + (b % 5) * 2.5;
      const bx = Math.cos(ang) * dist;
      const bz = Math.sin(ang) * dist;
      const baseY = sampleBiomeTerrainHeight(bx, bz, 3);
      const hScale = 0.85 + (b % 4) * 0.14;
      _dummy.position.set(bx, baseY + 6.0 * hScale, bz);
      _dummy.rotation.set(((b % 3) - 1) * 0.05, ang, ((b % 2) - 0.5) * 0.04);
      _dummy.scale.set(1, hScale, 1);
      _dummy.updateMatrix();
      bambooGrove.setMatrixAt(b, _dummy.matrix);
    }
    bambooGrove.instanceMatrix.needsUpdate = true;
    bambooGrove.computeBoundingSphere();
    act4Group.add(bambooGrove);

    // Crimson Shrine Torii Archway framing the Blood Eclipse
    const toriiZ = -7.2;
    const toriiBaseY = sampleBiomeTerrainHeight(0, toriiZ, 3);
    for (const tx of [-2.8, 2.8]) {
      const post = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 6.2, 10)), mats.crimsonArmor);
      post.position.set(tx, toriiBaseY + 3.1, toriiZ);
      post.castShadow = !isSoftwareGl;
      const basePad = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.36, 0.42, 0.45, 10)), mats.basaltStone);
      basePad.position.set(tx, toriiBaseY + 0.22, toriiZ);
      act4Group.add(post, basePad);
    }
    const toriiTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.6, 0.42, 0.48)), mats.crimsonArmor);
    toriiTop.position.set(0, toriiBaseY + 6.15, toriiZ);
    const toriiNuki = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.6, 0.26, 0.3)), mats.obsidianMetal);
    toriiNuki.position.set(0, toriiBaseY + 5.1, toriiZ);
    act4Group.add(toriiTop, toriiNuki);

    const eclipseGroup = new THREE.Group();
    eclipseGroup.position.set(0, 11.8, -19);
    act4Group.add(eclipseGroup);
    const eclipseCorona = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(3.2, 0.22, 14, 64)),
      mats.crimsonEmissive
    );
    const eclipseCore = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(3.05, 48)),
      trackMat(new THREE.MeshBasicMaterial({ color: 0x050206 }))
    );
    eclipseGroup.add(eclipseCorona, eclipseCore);

    for (const lx of [-5.2, 5.2, -3.2, 3.2]) {
      const lz = Math.abs(lx) > 4 ? -3.5 : -6.2;
      const lantern = buildStoneLantern(mats, trackGeo, !isSoftwareGl);
      lantern.position.set(lx, sampleBiomeTerrainHeight(lx, lz, 3), lz);
      act4Group.add(lantern);
    }

    const samuraiRig = buildArticulatedWarriorRig('samurai', mats, trackGeo, !isSoftwareGl);
    samuraiRig.root.position.set(-3.2, 0, 0);
    samuraiRig.root.rotation.y = Math.PI / 2;
    act4Group.add(samuraiRig.root);

    const act4AngelRig = buildArticulatedWarriorRig('fallenAngel', mats, trackGeo, !isSoftwareGl);
    act4AngelRig.root.position.set(3.2, 8.0, 0);
    act4AngelRig.root.rotation.y = -Math.PI / 2;
    act4Group.add(act4AngelRig.root);

    const slashArcA = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(3.2, 0.08, 8, 48, Math.PI * 1.15)),
      mats.crimsonEmissive
    );
    slashArcA.position.y = 1.6;
    slashArcA.rotation.x = Math.PI / 2.3;
    const slashArcB = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(3.9, 0.06, 8, 48, Math.PI * 0.95)),
      mats.goldEmissive
    );
    slashArcB.position.y = 1.9;
    slashArcB.rotation.x = -Math.PI / 2.6;
    act4Group.add(slashArcA, slashArcB);

    const sparkCount = 44;
    const sparkMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.OctahedronGeometry(0.08, 0)),
      mats.crimsonEmissive,
      sparkCount
    );
    sparkMesh.frustumCulled = false;
    act4Group.add(sparkMesh);

    const petalCount = 42;
    const petalMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.PlaneGeometry(0.22, 0.12)),
      mats.crimsonEmissive,
      petalCount
    );
    petalMesh.frustumCulled = false;
    act4Group.add(petalMesh);

    const rippleCount = 24;
    const rippleMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const rippleMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.RingGeometry(0.18, 0.24, 16)),
      rippleMat,
      rippleCount
    );
    rippleMesh.frustumCulled = false;
    act4Group.add(rippleMesh);

    const rainCount = 130;
    const rainMesh = new THREE.InstancedMesh(
      trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 1.25, 4)),
      trackMat(new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.42 })),
      rainCount
    );
    rainMesh.frustumCulled = false;
    act4Group.add(rainMesh);

    // Act IV Crimson Wooden Stream Bridge, Emerald Rice Paddies (Sawah) & Traditional Village Houses
    const act4Bridge = buildProceduralBridge('wooden', mats, trackGeo, !isSoftwareGl);
    act4Bridge.position.set(11.8, -0.34, 0.5);
    act4Bridge.rotation.y = 0.14;
    act4Group.add(act4Bridge);

    const act4PaddyCoords: Array<[number, number, number]> = [
      [-13.5, -5.0, 0.1], [-13.5, 0.0, 0.0], [-13.5, 5.0, -0.1],
      [-17.6, -3.5, 0.08], [-17.6, 2.5, -0.06]
    ];
    for (const [rx, rz, rRot] of act4PaddyCoords) {
      const paddy = buildRicePaddyCluster(mats, trackGeo, waterFx.material);
      paddy.position.set(rx, sampleBiomeTerrainHeight(rx, rz, 3), rz);
      paddy.rotation.y = rRot;
      act4Group.add(paddy);
    }

    const act4HouseCoords: Array<[number, number, number]> = [
      [-20.5, -7.2, Math.PI * 0.42],
      [-21.2, 3.2, Math.PI * 0.55],
      [-18.8, 10.6, Math.PI * 0.28],
      [17.8, -5.2, -Math.PI * 0.48],
      [18.2, 5.8, -Math.PI * 0.55]
    ];
    for (const [hx, hz, hRot] of act4HouseCoords) {
      const house = buildProceduralHouse('village', mats, trackGeo, !isSoftwareGl);
      house.position.set(hx, sampleBiomeTerrainHeight(hx, hz, 3), hz);
      house.rotation.y = hRot;
      act4Group.add(house);
    }

    const act4TreeCoords: Array<[number, number]> = [
      [-16.2, -10.2], [-15.8, 9.8], [15.8, -9.8], [16.2, 10.5], [14.5, -1.8], [-22.4, -1.6]
    ];
    for (let ti = 0; ti < act4TreeCoords.length; ti++) {
      const [tx, tz] = act4TreeCoords[ti];
      const tree = buildProceduralTree(ti % 2 === 0 ? 'broadleaf' : 'pine', mats, trackGeo, !isSoftwareGl);
      tree.position.set(tx, sampleBiomeTerrainHeight(tx, tz, 3), tz);
      act4Group.add(tree);
    }

    // =========================================================
    // ACT V GROUP: Observatory Tesseract, Armillary Rings, 6-Hero Alliance, Prism Beams & 15 Orbs
    // =========================================================
    const act5Group = new THREE.Group();
    act5Group.visible = false;
    scene.add(act5Group);

    const architectRig = buildArticulatedWarriorRig('architect', mats, trackGeo, !isSoftwareGl);
    act5Group.add(architectRig.root);

    const luminaRig = buildArticulatedWarriorRig('lumina', mats, trackGeo, !isSoftwareGl);
    act5Group.add(luminaRig.root);

    const act5Allies = [
      buildArticulatedWarriorRig('traveler', mats, trackGeo, !isSoftwareGl),
      buildArticulatedWarriorRig('guardian', mats, trackGeo, !isSoftwareGl),
      buildArticulatedWarriorRig('samurai', mats, trackGeo, !isSoftwareGl),
      buildArticulatedWarriorRig('valkyrie', mats, trackGeo, !isSoftwareGl)
    ];
    for (const ally of act5Allies) {
      act5Group.add(ally.root);
    }

    const tesseractGroup = new THREE.Group();
    tesseractGroup.position.set(0, 4.2, 0);
    act5Group.add(tesseractGroup);

    const outerCubeEdges = new THREE.LineSegments(
      trackGeo(new THREE.EdgesGeometry(trackGeo(new THREE.BoxGeometry(3.2, 3.2, 3.2)))),
      trackMat(new THREE.LineBasicMaterial({ color: 0xc084fc }))
    );
    const innerOcta = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(1.15, 0)),
      mats.emeraldEmissive
    );
    const glassShell = new THREE.Mesh(
      trackGeo(new THREE.IcosahedronGeometry(2.15, 0)),
      mats.opticalGlass
    );
    tesseractGroup.add(outerCubeEdges, innerOcta, glassShell);

    const armillaryRingA = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(2.9, 0.045, 8, 56)),
      mats.goldEmissive
    );
    armillaryRingA.position.y = 4.2;
    const armillaryRingB = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(3.35, 0.04, 8, 56)),
      mats.cyanPlasma
    );
    armillaryRingB.position.y = 4.2;
    act5Group.add(armillaryRingA, armillaryRingB);

    const prisms: THREE.Mesh[] = [];
    const prismBaseHeights: number[] = [];
    const prismBeams: THREE.Mesh[] = [];
    const prismBeamMats: THREE.MeshBasicMaterial[] = [];
    const unitBeamGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.08, 1, 8, 1, true));
    for (let pr = 0; pr < 6; pr++) {
      const ang = (pr / 6) * Math.PI * 2;
      const px = Math.cos(ang) * 5.8;
      const pz = Math.sin(ang) * 5.8;
      const py = sampleBiomeTerrainHeight(px, pz, 4) + 1.5;
      const prism = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 2.8, 3)),
        mats.opticalGlass
      );
      prism.position.set(px, py, pz);
      prism.rotation.y = ang;
      act5Group.add(prism);
      prisms.push(prism);
      prismBaseHeights.push(py);

      const beamMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: HERO_COLORS[pr * 2],
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const beam = new THREE.Mesh(unitBeamGeo, beamMat);
      act5Group.add(beam);
      prismBeams.push(beam);
      prismBeamMats.push(beamMat);
    }

    const codeRingA = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(4.6, 0.06, 8, 64)),
      mats.emeraldEmissive
    );
    codeRingA.position.y = 4.2;
    const codeRingB = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(5.2, 0.05, 8, 64)),
      mats.cyanPlasma
    );
    codeRingB.position.y = 4.2;
    act5Group.add(codeRingA, codeRingB);

    const heroOrbs: THREE.Mesh[] = [];
    const orbGeo = trackGeo(new THREE.SphereGeometry(0.28, 16, 14));
    for (let h = 0; h < HERO_COLORS.length; h++) {
      const orbMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: HERO_COLORS[h],
          emissive: HERO_COLORS[h],
          emissiveIntensity: 1.55,
          roughness: 0.15,
          metalness: 0.3
        })
      );
      const orb = new THREE.Mesh(orbGeo, orbMat);
      act5Group.add(orb);
      heroOrbs.push(orb);
    }

    const actGroups = [act1Group, act2Group, act3Group, act4Group, act5Group];

    // 6-Hero Grand Convergence Beams (shooting from each hero into Tesseract Core)
    const act5HeroBeams: THREE.Mesh[] = [];
    const act5HeroBeamMats: THREE.MeshBasicMaterial[] = [];
    const act5HeroBeamColors = [0x2dd4bf, 0xfde047, 0x38bdf8, 0xf59e0b, 0xf43f5e, 0x60a5fa];
    for (let hb = 0; hb < 6; hb++) {
      const mat = trackMat(
        new THREE.MeshBasicMaterial({
          color: act5HeroBeamColors[hb],
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      const mesh = new THREE.Mesh(unitBeamGeo, mat);
      mesh.visible = false;
      act5Group.add(mesh);
      act5HeroBeams.push(mesh);
      act5HeroBeamMats.push(mat);
    }

    // Act V Harbor Coastal Village, Palm Beach & Composite Lighthouse + Sailboats
    const act5HouseCoords: Array<[number, number, number]> = [
      [-15.2, -7.5, Math.PI * 0.35],
      [-16.8, 2.2, Math.PI * 0.5],
      [-13.8, 10.8, Math.PI * 0.78],
      [15.2, -7.2, -Math.PI * 0.35],
      [16.8, 2.6, -Math.PI * 0.5],
      [13.6, 11.0, -Math.PI * 0.78]
    ];
    for (let hi = 0; hi < act5HouseCoords.length; hi++) {
      const [hx, hz, hRot] = act5HouseCoords[hi];
      const house = buildProceduralHouse(hi % 2 === 0 ? 'coastal' : 'townhouse', mats, trackGeo, !isSoftwareGl);
      house.position.set(hx, sampleBiomeTerrainHeight(hx, hz, 4), hz);
      house.rotation.y = hRot;
      act5Group.add(house);
    }

    // Coastal Beacon Lighthouse with rotating volumetric searchlight on Beach Headland
    const lhX = 18.2;
    const lhZ = -13.5;
    const lhY = sampleBiomeTerrainHeight(lhX, lhZ, 4);
    const lighthouse = buildCoastalLighthouse(mats, trackGeo, trackMat, !isSoftwareGl);
    lighthouse.group.position.set(lhX, lhY, lhZ);
    act5Group.add(lighthouse.group);

    for (let pt = 0; pt < 10; pt++) {
      const ang = (pt / 10) * Math.PI * 2 + 0.3;
      const rad = 19.6 + (pt % 2) * 1.4;
      const tx = Math.cos(ang) * rad;
      const tz = Math.sin(ang) * rad;
      const tree = buildProceduralTree(pt % 2 === 0 ? 'palm' : 'broadleaf', mats, trackGeo, !isSoftwareGl);
      tree.position.set(tx, sampleBiomeTerrainHeight(tx, tz, 4), tz);
      tree.rotation.y = -ang;
      act5Group.add(tree);
    }

    const act5Boats: THREE.Group[] = [];
    const act5BoatPos: Array<[number, number, number]> = [
      [-28.0, -14.0, 0.9],
      [27.5, -16.5, -0.7],
      [0.0, -32.0, 1.55]
    ];
    for (const [bx, bz, bRot] of act5BoatPos) {
      const boat = buildWoodenBoat(mats, trackGeo, !isSoftwareGl);
      boat.position.set(bx, WORLD_WATER_LEVEL + 0.04, bz);
      boat.rotation.y = bRot;
      act5Group.add(boat);
      act5Boats.push(boat);
    }

    // Optional GPU Bloom + Film Vignette Post-Processing
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    let vignettePass: ShaderPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        ACTS_3D[0].bloomStrength,
        0.42,
        0.95
      );
      composer.addPass(bloomPass);
      vignettePass = new ShaderPass(VignetteShader);
      vignettePass.uniforms['offset'].value = 1.05;
      vignettePass.uniforms['darkness'].value = 0.92;
      composer.addPass(vignettePass);
      composer.addPass(new OutputPass());
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer) composer.setSize(w, h);
      if (bloomPass) bloomPass.resolution.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Audio Act 0 start
    sounds.playEasterEggChime(0, false);
    lastActAudioRef.current = 0;

    // Smooth Transition & Camera Cinematography State
    let transFromAct = 0;
    let transToAct = 0;
    let transElapsed = 0.0; // Play subtle opening emerge on frame 0
    let transActive = true;
    let needsFinalNormals = true;
    let isOpeningIntro = true;
    let curRoll = 0;
    let shakeAmp = 0;

    let frameId = 0;
    let lastTs = performance.now();
    let uiAcc = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      if (!pausedRef.current && !completedRef.current) {
        elapsedRef.current = Math.min(EASTER_EGG_TOTAL_SECONDS, elapsedRef.current + dt);
        uiAcc += dt;
        if (uiAcc >= 0.1) {
          uiAcc = 0;
          setElapsed(elapsedRef.current);
        }

        const currentAct = Math.min(4, Math.floor(elapsedRef.current / ACT_DURATION));
        if (currentAct !== lastActAudioRef.current) {
          lastActAudioRef.current = currentAct;
          const isFinale = currentAct === 4;
          sounds.playEasterEggChime(isFinale ? 5 : currentAct, isFinale);
        }

        if (elapsedRef.current >= EASTER_EGG_TOTAL_SECONDS) {
          completedRef.current = true;
          setElapsed(EASTER_EGG_TOTAL_SECONDS);
          onCompleteRef.current(true);
          return;
        }
      }

      const t = elapsedRef.current;
      const actIdx = Math.min(4, Math.floor(t / ACT_DURATION));
      const actLocal = t - actIdx * ACT_DURATION;
      const actProgress = actLocal / ACT_DURATION;
      const spec = ACTS_3D[actIdx];

      // Detect act change (natural progression or manual jump)
      if (actIdx !== transToAct || manualJumpTriggerRef.current) {
        manualJumpTriggerRef.current = false;
        if (actIdx !== transToAct) {
          transFromAct = transToAct;
          transToAct = actIdx;
        } else {
          transFromAct = actIdx;
        }
        transElapsed = 0;
        transActive = true;
        needsFinalNormals = true;
        isOpeningIntro = false;
      }

      // Advance transition & morph terrain/stages smoothly (even if user jumped while paused)
      let transAlpha = 1;
      let transPulse = 0;
      if (transActive) {
        transElapsed = Math.min(TRANSITION_DURATION, transElapsed + dt);
        const raw = transElapsed / TRANSITION_DURATION;
        transAlpha = smoothstep01(raw);
        transPulse = Math.sin(raw * Math.PI);

        if (transFromAct !== transToAct) {
          applyTerrainMorph(terrainData, transFromAct, transToAct, transAlpha, !isSoftwareGl || raw >= 0.99);

          // Update perimeter rocks smoothly along morphing terrain
          for (let i = 0; i < rockCount; i++) {
            const rs = rockSeeds[i];
            const yTerrain = sampleBiomeTerrainHeight(rs.x, rs.z, transFromAct);
            const hB = sampleBiomeTerrainHeight(rs.x, rs.z, transToAct);
            const hy = yTerrain * (1 - transAlpha) + hB * transAlpha;
            const dryScale = hy > WORLD_WATER_LEVEL + 0.16 ? 1 : 0;
            _dummy.position.set(rs.x, hy + rs.sy * 0.35, rs.z);
            _dummy.rotation.set((i % 3) * 0.15, rs.ang, ((i + 1) % 2) * 0.12);
            _dummy.scale.set(rs.sx * dryScale, rs.sy * dryScale, rs.sz * dryScale);
            _dummy.updateMatrix();
            perimeterRocks.setMatrixAt(i, _dummy.matrix);
          }
          perimeterRocks.instanceMatrix.needsUpdate = true;
        }

        if (raw >= 1) {
          transActive = false;
          isOpeningIntro = false;
          if (needsFinalNormals && transFromAct !== transToAct) {
            needsFinalNormals = false;
            applyTerrainMorph(terrainData, transToAct, transToAct, 1, true);
          }
        }
      }

      // Cross-animated Stage Enter & Exit Choreography
      for (let i = 0; i < actGroups.length; i++) {
        const grp = actGroups[i];
        if (i === transToAct) {
          grp.visible = true;
          const enterT = transActive ? easeOutCubic(Math.min(1, transElapsed / (TRANSITION_DURATION * 0.78))) : 1;
          const dropOffset = isOpeningIntro ? -1.8 : -3.4;
          grp.position.y = (1 - enterT) * dropOffset;
          grp.scale.setScalar(0.88 + 0.12 * enterT);
        } else if (transActive && i === transFromAct && transFromAct !== transToAct && transElapsed < TRANSITION_DURATION * 0.52) {
          grp.visible = true;
          const exitT = transElapsed / (TRANSITION_DURATION * 0.52);
          grp.position.y = -exitT * exitT * 4.8;
          grp.scale.setScalar(1 - 0.16 * exitT);
        } else {
          grp.visible = false;
          grp.position.y = 0;
          grp.scale.setScalar(1);
        }
      }

      // 3D Transition Vortex & Shockwave Ring
      if (transActive && transPulse > 0.02) {
        transVortexGroup.visible = true;
        const waveScale = 0.5 + (transElapsed / TRANSITION_DURATION) * 3.8;
        transWaveRing.scale.setScalar(waveScale);
        transWaveMat.opacity = transPulse * 0.35;
        transWaveMat.color.set(spec.accent);
        transParticleMat.color.set(spec.accent);
        transParticleMat.opacity = transPulse * 0.5;

        for (let p = 0; p < transParticleCount; p++) {
          const ang = p * 0.48 + transElapsed * 3.2;
          const rad = 2.0 + (p % 10) * 1.15 + transPulse * 2.5;
          const py = 0.4 + (p % 12) * 0.65 + transPulse * 1.6;
          _dummy.position.set(Math.cos(ang) * rad, py, Math.sin(ang) * rad);
          _dummy.rotation.set(t * 2 + p, t * 1.6, p);
          _dummy.scale.setScalar(transPulse * (0.7 + (p % 4) * 0.25));
          _dummy.updateMatrix();
          transParticles.setMatrixAt(p, _dummy.matrix);
        }
        transParticles.instanceMatrix.needsUpdate = true;
      } else {
        transVortexGroup.visible = false;
      }

      // =========================================================
      // Dynamic 4-Point Lighting, Exposure & Volumetric Shaft Blend
      // =========================================================
      _skyTarget.setHex(spec.skyHex);
      _fogTarget.setHex(spec.fogHex);
      _keyTarget.setHex(spec.keyColor);
      _rimTarget.setHex(spec.rimColor);
      _fillTarget.setHex(spec.fillColor);
      _hemiSkyTarget.setHex(spec.hemiSky);
      _hemiGroundTarget.setHex(spec.hemiGround);
      _accentTarget.set(spec.accent);
      _keyPosTarget.set(spec.keyPos[0], spec.keyPos[1], spec.keyPos[2]);
      _rimPosTarget.set(spec.rimPos[0], spec.rimPos[1], spec.rimPos[2]);

      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(_skyTarget, Math.min(1, dt * 2.4));
      }
      sceneFog.color.lerp(_fogTarget, Math.min(1, dt * 2.4));
      sceneFog.density = THREE.MathUtils.damp(sceneFog.density, spec.fogDensity, 2.4, dt);

      keyLight.color.lerp(_keyTarget, Math.min(1, dt * 2.4));
      keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, spec.keyIntensity, 2.4, dt);
      keyLight.position.lerp(_keyPosTarget, Math.min(1, dt * 2.2));

      rimLight.color.lerp(_rimTarget, Math.min(1, dt * 2.4));
      rimLight.intensity = THREE.MathUtils.damp(rimLight.intensity, spec.rimIntensity, 2.4, dt);
      rimLight.position.lerp(_rimPosTarget, Math.min(1, dt * 2.2));

      fillLight.color.lerp(_fillTarget, Math.min(1, dt * 2.4));
      fillLight.intensity = THREE.MathUtils.damp(fillLight.intensity, spec.fillIntensity, 2.4, dt);

      hemiLight.color.lerp(_hemiSkyTarget, Math.min(1, dt * 2.4));
      hemiLight.groundColor.lerp(_hemiGroundTarget, Math.min(1, dt * 2.4));
      hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, spec.hemiIntensity, 2.4, dt);

      scene.environmentIntensity = THREE.MathUtils.damp(
        scene.environmentIntensity,
        spec.envIntensity,
        2.4,
        dt
      );

      const targetExposure = spec.exposure + transPulse * 0.07;
      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        targetExposure,
        3.2,
        dt
      );

      if (bloomPass) {
        bloomPass.strength = THREE.MathUtils.damp(
          bloomPass.strength,
          spec.bloomStrength + transPulse * 0.08,
          3.0,
          dt
        );
      }

      centerPointLight.color.lerp(_accentTarget, Math.min(1, dt * 3.0));
      accentPointLight.color.lerp(_rimTarget, Math.min(1, dt * 2.4));
      shaftMat.color.lerp(_accentTarget, Math.min(1, dt * 2.4));
      shaftMat.opacity = THREE.MathUtils.damp(shaftMat.opacity, 0.025 + transPulse * 0.02, 2.8, dt);

      // Tint central dais runes & ambient depth motes to active biome
      daisRuneMat.color.lerp(_accentTarget, Math.min(1, dt * 2.4));
      daisRuneMat.emissive.lerp(_accentTarget, Math.min(1, dt * 2.4));
      ambientMoteMat.color.lerp(_accentTarget, Math.min(1, dt * 2.4));

      // Freeze world time cleanly during Act III Time Stop (11s..16s)
      const isAct3Frozen = actIdx === 2 && actLocal >= 11 && actLocal < 16;
      const worldTime = isAct3Frozen ? actIdx * ACT_DURATION + 11 : t;

      for (let am = 0; am < ambientMoteCount; am++) {
        const ang = am * 0.618 * Math.PI * 2 + worldTime * (0.08 + (am % 3) * 0.03);
        const rad = 3.2 + (am % 12) * 1.45;
        const my = 0.4 + ((worldTime * (0.35 + (am % 4) * 0.1) + am * 0.7) % 10.5);
        _dummy.position.set(Math.cos(ang) * rad, my, Math.sin(ang) * rad);
        _dummy.rotation.set(worldTime + am, worldTime * 0.7, am);
        _dummy.scale.setScalar(0.6 + Math.sin(worldTime * 2.0 + am) * 0.35);
        _dummy.updateMatrix();
        ambientMotes.setMatrixAt(am, _dummy.matrix);
      }
      ambientMotes.instanceMatrix.needsUpdate = true;

      // Update Procedural Sky Dome, Fireflies, Birds, Water & World Freeze

      _zenithTarget.setHex(spec.zenithHex);
      _midSkyTarget.setHex(spec.midSkyHex);
      _horizonTarget.setHex(spec.horizonHex);
      _sunTarget.setHex(spec.sunHex);
      skyDome.uniforms.uZenith.value.lerp(_zenithTarget, Math.min(1, dt * 2.2));
      skyDome.uniforms.uMidSky.value.lerp(_midSkyTarget, Math.min(1, dt * 2.2));
      skyDome.uniforms.uHorizon.value.lerp(_horizonTarget, Math.min(1, dt * 2.2));
      skyDome.uniforms.uSunColor.value.lerp(_sunTarget, Math.min(1, dt * 2.2));
      skyDome.uniforms.uTime.value = worldTime;

      // Ambient fireflies drifting over rice terraces and village edges
      for (let ff = 0; ff < fireflyCount; ff++) {
        const ang = ff * 0.87 + worldTime * (0.14 + (ff % 3) * 0.04);
        const rad = 11.5 + (ff % 6) * 2.2 + Math.sin(worldTime * 0.9 + ff) * 0.9;
        const fx = Math.cos(ang) * rad;
        const fz = Math.sin(ang) * rad;
        const fy = Math.max(WORLD_WATER_LEVEL + 0.35, sampleBiomeTerrainHeight(fx, fz, actIdx) + 0.85) + Math.sin(worldTime * 2.2 + ff) * 0.4;
        _dummy.position.set(fx, fy, fz);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.setScalar(0.65 + Math.sin(worldTime * 3.8 + ff * 1.4) * 0.45);
        _dummy.updateMatrix();
        fireflyMesh.setMatrixAt(ff, _dummy.matrix);
      }
      fireflyMesh.instanceMatrix.needsUpdate = true;

      // Gliding birds circling high over water & terraces
      for (let bd = 0; bd < birdCount; bd++) {
        const ang = bd * 0.45 + worldTime * (0.18 + (bd % 4) * 0.03);
        const rad = 16 + (bd % 5) * 4.5;
        const bx = Math.cos(ang) * rad;
        const bz = Math.sin(ang) * rad;
        const by = 11.5 + (bd % 4) * 1.6 + Math.sin(worldTime * 2.4 + bd) * 0.45;
        _dummy.position.set(bx, by, bz);
        _dummy.rotation.set(Math.sin(worldTime * 6.5 + bd) * 0.25, -ang, 0);
        _dummy.scale.setScalar(0.95 + (bd % 3) * 0.22);
        _dummy.updateMatrix();
        birdMesh.setMatrixAt(bd, _dummy.matrix);
      }
      birdMesh.instanceMatrix.needsUpdate = true;

      if (!isAct3Frozen) {
        waterFx.uTime.value = t;
      }
      if (actIdx === 0) {
        _waterColTarget.setHex(0x0c4a6e);
        _waterEmissiveTarget.setHex(0x041d2e);
      } else if (actIdx === 1) {
        _waterColTarget.setHex(0x0f766e);
        _waterEmissiveTarget.setHex(0x13281d);
      } else if (actIdx === 2) {
        _waterColTarget.setHex(0x1e3a5f);
        _waterEmissiveTarget.setHex(0x07142b);
      } else if (actIdx === 3) {
        _waterColTarget.setHex(0x311020);
        _waterEmissiveTarget.setHex(0x16040b);
      } else {
        _waterColTarget.setHex(0x0e6b87);
        _waterEmissiveTarget.setHex(0x062536);
      }
      waterFx.material.color.lerp(_waterColTarget, Math.min(1, dt * 2.4));
      waterFx.material.emissive.lerp(_waterEmissiveTarget, Math.min(1, dt * 2.4));

      starField.rotation.y = worldTime * 0.015;

      // Trigger Beat-Synced Procedural Audio Cues Once per Beat
      if (!pausedRef.current && !completedRef.current) {
        const triggerCue = (key: string, fn: () => void) => {
          if (!firedCuesRef.current.has(key)) {
            firedCuesRef.current.add(key);
            fn();
          }
        };
        if (actIdx === 0 && actLocal >= 10 && actLocal < 12) triggerCue('act0_portal', () => sounds.playSkill('void'));
        if (actIdx === 0 && actLocal >= 24 && actLocal < 26) triggerCue('act0_seal', () => sounds.playLevelUp());
        if (actIdx === 1 && actLocal >= 13 && actLocal < 15) triggerCue('act1_clash', () => sounds.playHit(true));
        if (actIdx === 1 && actLocal >= 18 && actLocal < 20) triggerCue('act1_ice', () => sounds.playSkill('freeze'));
        if (actIdx === 2 && actLocal >= 11 && actLocal < 13) triggerCue('act2_stop', () => sounds.playTimeStop());
        if (actIdx === 2 && actLocal >= 16 && actLocal < 18) triggerCue('act2_rewind', () => sounds.playSkill('temporal'));
        if (actIdx === 3 && actLocal >= 12.5 && actLocal < 14.5) triggerCue('act3_slash', () => sounds.playHit(true));
        if (actIdx === 3 && actLocal >= 24 && actLocal < 26) triggerCue('act3_cyclone', () => sounds.playExplosion());
        if (actIdx === 4 && actLocal >= 21 && actLocal < 23) triggerCue('act4_omega', () => sounds.playLevelUp());
      }

      // =====================================================
      // Animate Active 3D Act + 2-Joint Kinematics + Camera Choreography
      // =====================================================
      const px = pointerOffsetRef.current.x;
      const py = pointerOffsetRef.current.y;
      let camFovTarget = 46;
      let camRollTarget = 0;

      if (actIdx === 0) {
        // ACT I: 3-Hero Arrival (Traveler strides + Fallen Angel swoops + Dimension Judge emerges from portal)
        portalOuterRing.rotation.z = t * 0.45;
        portalInnerRing.rotation.z = -t * 0.85;
        portalGoldHalo.rotation.y = Math.sin(t * 0.5) * 0.35;
        portalVortexRing.rotation.x = t * 0.7;
        portalVortexRing.rotation.y = t * 0.9;
        portalVortexDisc.rotation.z = -t * 0.6;
        portalDiscMat.opacity = 0.18 + Math.sin(t * 3.2) * 0.06;

        for (let st = 0; st < act1StepStones.length; st++) {
          act1StepStones[st].position.y = 0.16 + st * 0.14 + Math.sin(t * 2.1 + st * 0.9) * 0.06;
        }
        for (let b = 0; b < act1Boats.length; b++) {
          act1Boats[b].position.y = WORLD_WATER_LEVEL + 0.03 + Math.sin(t * 1.8 + b * 1.4) * 0.07;
          act1Boats[b].rotation.z = Math.sin(t * 1.5 + b) * 0.06;
          act1Boats[b].rotation.x = Math.cos(t * 1.3 + b) * 0.04;
        }

        centerPointLight.position.set(0, 4.2, -4.4);
        centerPointLight.intensity = 3.2 + Math.sin(t * 3.0) * 0.6;
        accentPointLight.position.set(0, 2.5, 4.5);
        accentPointLight.intensity = 1.4;
        lightShaft.position.set(0, 9.5, -5.0);
        lightShaft.rotation.set(0.28, 0, 0);

        // 1) Traveler: natural knee/elbow stride (0..12s) -> sprint dash & crouch-land (12..18s) -> dual-hand seal (18..36s)
        const walkT = Math.min(1, actLocal / 12);
        const dashT = THREE.MathUtils.clamp((actLocal - 12) / 5.5, 0, 1);
        const travZ = THREE.MathUtils.lerp(6.4, 2.0, walkT) - easeOutCubic(dashT) * 1.5;
        const travX = THREE.MathUtils.lerp(-1.2, -2.2, easeOutCubic(dashT));
        const isDashing = actLocal >= 12 && dashT < 0.98;
        const travCycle = actLocal < 12 ? t * 4.8 : isDashing ? t * 9.5 : 0;
        const travStride = actLocal < 12 || isDashing ? Math.sin(travCycle) : 0;
        const travCrouch = isDashing ? 0.14 : actLocal >= 22 && actLocal < 24 ? 0.18 : 0;

        travelerRig.root.position.set(travX, 0, travZ);
        travelerRig.root.rotation.y = Math.PI - 0.25 * dashT;
        travelerRig.torso.position.y = 0.94 - travCrouch + Math.abs(travStride) * 0.04;
        travelerRig.torso.rotation.x = isDashing ? 0.22 : actLocal >= 24 ? -0.06 : 0.05;
        travelerRig.leftLeg.rotation.x = travStride * 0.55 - travCrouch * 1.6;
        travelerRig.rightLeg.rotation.x = -travStride * 0.55 - travCrouch * 1.6;
        travelerRig.leftShin.rotation.x = Math.max(0.08, -travStride * 0.45 + 0.35 + travCrouch * 2.8);
        travelerRig.rightShin.rotation.x = Math.max(0.08, travStride * 0.45 + 0.35 + travCrouch * 2.8);
        travelerRig.leftArm.rotation.x = actLocal >= 24 ? -1.35 : -travStride * 0.4;
        travelerRig.rightArm.rotation.x = actLocal >= 14 ? -1.2 + Math.sin(t * 3.5) * 0.14 : travStride * 0.4;
        travelerRig.leftForearm.rotation.x = actLocal >= 24 ? -0.95 : -0.45 - Math.abs(travStride) * 0.3;
        travelerRig.rightForearm.rotation.x = actLocal >= 14 ? -0.85 : -0.45 - Math.abs(travStride) * 0.3;
        travelerRig.head.rotation.y = actLocal < 12 ? Math.sin(t * 1.1) * 0.32 : 0.18;
        travelerRig.cape.rotation.x = (isDashing ? 0.42 : 0.18) + Math.sin(t * 3.8) * 0.11;
        travelerRig.auraRing.rotation.z = t * 1.2;
        travelerRig.auraRing.scale.setScalar(0.96 + Math.sin(t * 3.2) * 0.08);

        // 2) Fallen Angel: glides down from high sky (0..11s) -> landing crouch (11..13s) -> hover spread (13..36s)
        const descendT = easeOutCubic(THREE.MathUtils.clamp(actLocal / 11, 0, 1));
        const landImpact = THREE.MathUtils.clamp((actLocal - 10.5) / 1.8, 0, 1);
        const angelLandingBend = landImpact > 0 && landImpact < 1 ? Math.sin(landImpact * Math.PI) : 0;
        const angelY = THREE.MathUtils.lerp(8.5, 0.0, descendT) + (actLocal >= 22 ? Math.sin(t * 2.2) * 0.35 + 0.45 : 0);
        const angelZ = THREE.MathUtils.lerp(4.2, 0.9, descendT);
        act1AngelRig.root.position.set(2.6, angelY, angelZ);
        act1AngelRig.root.rotation.y = -Math.PI * 0.82;
        act1AngelRig.torso.position.y = 0.94 - angelLandingBend * 0.2;
        act1AngelRig.torso.rotation.x = actLocal < 11 ? 0.24 : angelLandingBend * 0.25;
        const flap = Math.sin(t * (actLocal < 11 ? 7.5 : 3.2)) * (actLocal < 11 ? 0.55 : 0.22);
        act1AngelRig.leftWing.rotation.y = 0.35 + flap;
        act1AngelRig.rightWing.rotation.y = -0.35 - flap;
        act1AngelRig.rightArm.rotation.x = actLocal >= 20 ? -1.1 + Math.sin(t * 2.8) * 0.2 : -0.4;
        act1AngelRig.rightForearm.rotation.x = actLocal >= 20 ? -0.65 : -0.85;
        act1AngelRig.leftForearm.rotation.x = -0.7;
        act1AngelRig.leftLeg.rotation.x = actLocal < 11 ? 0.35 : -angelLandingBend * 0.6;
        act1AngelRig.rightLeg.rotation.x = actLocal < 11 ? -0.2 : -angelLandingBend * 0.6;
        act1AngelRig.leftShin.rotation.x = actLocal < 11 ? 0.55 : 0.15 + angelLandingBend * 1.1;
        act1AngelRig.rightShin.rotation.x = actLocal < 11 ? 0.75 : 0.15 + angelLandingBend * 1.1;
        act1AngelRig.auraRing.rotation.z = -t * 1.3;

        // 3) Dimension Judge: emerges through portal at 10..22s
        const emergeT = easeOutCubic(THREE.MathUtils.clamp((actLocal - 10) / 8, 0, 1));
        act1JudgeRig.root.visible = actLocal >= 9.5;
        act1JudgeRig.root.position.set(0, Math.sin(t * 2.4) * 0.18 + (1 - emergeT) * 0.8, THREE.MathUtils.lerp(-5.2, -1.6, emergeT));
        act1JudgeRig.root.rotation.y = actLocal < 24 ? 0 : Math.PI;
        act1JudgeRig.rightArm.rotation.x = -0.9 + Math.sin(t * 3.0) * 0.35;
        act1JudgeRig.leftArm.rotation.x = -0.9 - Math.sin(t * 3.0) * 0.35;
        act1JudgeRig.rightForearm.rotation.x = -0.75 + Math.cos(t * 3.0) * 0.25;
        act1JudgeRig.leftForearm.rotation.x = -0.75 - Math.cos(t * 3.0) * 0.25;
        act1JudgeRig.leftShin.rotation.x = 0.28;
        act1JudgeRig.rightShin.rotation.x = 0.42;
        if (act1JudgeRig.haloRing) act1JudgeRig.haloRing.rotation.z = t * 1.6;
        act1JudgeRig.auraRing.rotation.z = t * 1.6;
        updateShadowDisc(travelerRig, 0);
        updateShadowDisc(act1AngelRig, angelY);
        updateShadowDisc(act1JudgeRig, act1JudgeRig.root.position.y);

        // 3-Hero Unity Beams channeling into the central dais seal (23..36s)
        const unityAlpha = smoothstep01((actLocal - 23) / 3.5);
        act1UnityMat.opacity = unityAlpha * 0.55;
        const unityRigs = [travelerRig, act1AngelRig, act1JudgeRig];
        for (let ub = 0; ub < act1UnityBeams.length; ub++) {
          const beam = act1UnityBeams[ub];
          if (unityAlpha > 0.02) {
            const rp = unityRigs[ub].root.position;
            _beamDir.set(0 - rp.x, 1.4 - (rp.y + 1.3), -1.6 - rp.z);
            const len = _beamDir.length();
            _beamDir.normalize();
            _beamQuat.setFromUnitVectors(_beamUp, _beamDir);
            beam.visible = true;
            beam.position.set(rp.x * 0.5, (rp.y + 1.3 + 1.4) * 0.5, (rp.z - 1.6) * 0.5);
            beam.quaternion.copy(_beamQuat);
            const w = 0.75 + Math.sin(t * 9 + ub) * 0.2;
            beam.scale.set(w, len, w);
          } else {
            beam.visible = false;
          }
        }

        // Portal emergence shockwave pulse + impact micro-shake
        const wavePhase = ((actLocal - 12) % 6) / 6;
        if (actLocal >= 12 && wavePhase >= 0) {
          act1ShockRing.scale.setScalar(0.6 + wavePhase * 3.2);
          act1ShockMat.opacity = (1 - wavePhase) * 0.45;
          if (wavePhase < 0.06) shakeAmp = Math.max(shakeAmp, 0.11);
        } else {
          act1ShockMat.opacity = 0;
        }

        // Dynamic 4-Shot Camera Choreography
        if (actLocal < 9) {
          camFovTarget = 43;
          camRollTarget = -0.02;
          _camTarget.set(-3.0 + actLocal * 0.28 + px * 1.4, 1.8 + py * 0.9, travZ + 4.4);
          _lookTarget.set(travX * 0.4, 1.8, travZ - 2.2);
        } else if (actLocal < 18) {
          camFovTarget = 49;
          camRollTarget = isDashing ? 0.035 : 0;
          _camTarget.set(4.6 + px * 1.4, 2.2 + py * 1.0, 4.8 - (actLocal - 9) * 0.22);
          _lookTarget.set(0, 2.3, -2.0);
        } else if (actLocal < 27) {
          camFovTarget = 41; // Tight dramatic Judge reveal close-up
          camRollTarget = -0.025;
          _camTarget.set(-2.8 + px * 1.1, 2.0 + py * 0.7, 2.6);
          _lookTarget.set(0, 2.3, -1.8);
        } else {
          camFovTarget = 53; // Wide heroic aerial crane
          const craneAng = -0.35 + ((actLocal - 27) / 9) * 0.9 + px * 0.4;
          _camTarget.set(Math.sin(craneAng) * 9.8, 4.6 + ((actLocal - 27) / 9) * 2.2 + py * 1.2, Math.cos(craneAng) * 9.8);
          _lookTarget.set(0, 2.8, -2.2);
        }
      } else if (actIdx === 1) {
        // ACT II: Monkey King vs Valkyrie Frost (Multi-Phase Summit Duel + 12 Clones + Braziers + Monoliths)
        const phase3T = THREE.MathUtils.clamp((actLocal - 24) / 6, 0, 1);

        for (let bf = 0; bf < brazierFlames.length; bf++) {
          brazierFlames[bf].rotation.y = t * 4.5 + bf;
          const flare = actLocal >= 13 && actLocal < 25 ? 1.28 + Math.sin(t * 14 + bf) * 0.22 : 1.0 + Math.sin(t * 6 + bf) * 0.12;
          brazierFlames[bf].scale.set(1, flare * 1.25, 1);
        }
        for (let sd = 0; sd < summitDustCount; sd++) {
          const sx = (((t * 3.8 + sd * 1.37) % 24) - 12);
          const sz = (((sd * 2.51) % 20) - 10);
          const sy = 0.8 + (sd % 6) * 0.85 + Math.sin(t * 2.0 + sd) * 0.35;
          _dummy.position.set(sx, sy, sz);
          _dummy.rotation.set(t * 2 + sd, t * 1.4, sd);
          _dummy.scale.setScalar(0.65 + (sd % 3) * 0.25);
          _dummy.updateMatrix();
          summitDustMesh.setMatrixAt(sd, _dummy.matrix);
        }
        summitDustMesh.instanceMatrix.needsUpdate = true;

        // Monkey King locomotion, anticipation crouches & acrobatic staff slams
        const mkJumpCycle = Math.sin(actLocal * 1.4);
        const mkLeap = actLocal < 11 ? Math.abs(mkJumpCycle) * 1.65 : phase3T > 0 ? Math.sin(phase3T * Math.PI) * 2.15 : 0;
        const mkX =
          actLocal < 11
            ? Math.sin(actLocal * 0.9) * 2.4
            : actLocal < 24
            ? -1.6 + Math.sin((actLocal - 11) * 3.4) * 0.95
            : THREE.MathUtils.lerp(-1.6, -2.8, phase3T);
        const mkAirBend = mkLeap > 0.2 ? 0.85 : 0.28;
        guardianRig.root.position.set(mkX, mkLeap, Math.cos(actLocal * 0.8) * 0.6);
        guardianRig.root.rotation.y = actLocal < 11 ? actLocal * 2.5 : Math.PI / 2;
        guardianRig.torso.position.y = 0.94 - (mkLeap < 0.15 && actLocal < 11 ? 0.14 : 0);
        guardianRig.torso.rotation.y = Math.sin(t * 4.5) * 0.55;
        guardianRig.torso.rotation.x = 0.18;
        guardianRig.rightArm.rotation.x = -1.1 + Math.sin(t * 6.5) * 0.72;
        guardianRig.leftArm.rotation.x = -0.8 + Math.cos(t * 6.5) * 0.5;
        guardianRig.rightForearm.rotation.x = -0.95 + Math.cos(t * 6.5) * 0.35;
        guardianRig.leftForearm.rotation.x = -0.85 + Math.sin(t * 6.5) * 0.35;
        guardianRig.weaponPivot.rotation.x = t * 6.0;
        guardianRig.leftLeg.rotation.x = mkLeap > 0.2 ? -0.45 : Math.sin(t * 5.2) * 0.42;
        guardianRig.rightLeg.rotation.x = mkLeap > 0.2 ? 0.35 : -Math.sin(t * 5.2) * 0.42;
        guardianRig.leftShin.rotation.x = mkAirBend;
        guardianRig.rightShin.rotation.x = mkLeap > 0.2 ? 0.95 : 0.32;
        guardianRig.head.rotation.y = Math.sin(t * 2.5) * 0.22;
        guardianRig.cape.rotation.x = 0.24 + Math.sin(t * 5.0) * 0.14;
        guardianRig.auraRing.rotation.z = t * 2.2;

        // Valkyrie Frost enters from glacial flank (9s+) and duels Monkey King!
        valkyrieRig.root.visible = actLocal >= 9;
        const valkX =
          actLocal < 15
            ? THREE.MathUtils.lerp(7.5, 1.6, easeOutCubic(THREE.MathUtils.clamp((actLocal - 9) / 5, 0, 1)))
            : actLocal < 24
            ? 1.6 - Math.sin((actLocal - 11) * 3.4) * 0.95
            : THREE.MathUtils.lerp(1.6, 2.9, phase3T);
        const valkY =
          actLocal < 14
            ? (1 - easeOutCubic(THREE.MathUtils.clamp((actLocal - 9) / 5, 0, 1))) * 2.8
            : actLocal >= 24
            ? phase3T * 2.6 + Math.sin(t * 2.6) * 0.25
            : Math.abs(Math.cos(t * 3.5)) * 0.45;
        valkyrieRig.root.position.set(valkX, valkY, -Math.cos(actLocal * 0.8) * 0.5);
        valkyrieRig.root.rotation.y = -Math.PI / 2;
        valkyrieRig.torso.rotation.x = actLocal < 14 ? 0.26 : 0.12;
        valkyrieRig.rightArm.rotation.x = -1.25 + Math.cos(t * 6.0) * 0.65;
        valkyrieRig.leftArm.rotation.x = -0.5 + Math.sin(t * 4.0) * 0.3;
        valkyrieRig.rightForearm.rotation.x = -0.8 + Math.sin(t * 6.0) * 0.4;
        valkyrieRig.leftForearm.rotation.x = -0.65;
        valkyrieRig.leftLeg.rotation.x = valkY > 0.5 ? -0.35 : Math.cos(t * 5.0) * 0.36;
        valkyrieRig.rightLeg.rotation.x = valkY > 0.5 ? 0.25 : -Math.cos(t * 5.0) * 0.36;
        valkyrieRig.leftShin.rotation.x = valkY > 0.5 ? 0.72 : 0.28;
        valkyrieRig.rightShin.rotation.x = valkY > 0.5 ? 0.55 : 0.28;
        valkyrieRig.leftWing.rotation.y = 0.3 + Math.sin(t * 5.2) * 0.28;
        valkyrieRig.rightWing.rotation.y = -0.3 - Math.sin(t * 5.2) * 0.28;
        valkyrieRig.auraRing.rotation.z = -t * 1.8;
        updateShadowDisc(guardianRig, mkLeap);
        updateShadowDisc(valkyrieRig, valkY);

        // Clash Shockwave Ring, Radial Spark Burst & micro-shake on weapon collisions (13..25s)
        const clashBeat = (actLocal * 1.1) % 1;
        const inClash = actLocal >= 13 && actLocal < 25;
        if (inClash) {
          act2ClashRing.scale.setScalar(0.4 + clashBeat * 3.5);
          act2ClashMat.opacity = (1 - clashBeat) * 0.5;
          if (clashBeat < 0.08) shakeAmp = Math.max(shakeAmp, 0.14);
        } else {
          act2ClashMat.opacity = 0;
        }
        act2SparkMesh.visible = inClash;
        if (inClash) {
          for (let sp = 0; sp < act2SparkCount; sp++) {
            const age = (clashBeat + sp * 0.11) % 1;
            const ang = sp * 1.7 + t * 1.5;
            const elev = Math.sin(sp * 2.3) * 1.6;
            const rad = age * 3.4;
            _dummy.position.set(Math.cos(ang) * rad, 1.6 + elev * age, Math.sin(ang) * rad);
            _dummy.rotation.set(t * 5 + sp, t * 4, sp);
            _dummy.scale.setScalar((1 - age) * 1.25);
            _dummy.updateMatrix();
            act2SparkMesh.setMatrixAt(sp, _dummy.matrix);
          }
          act2SparkMesh.instanceMatrix.needsUpdate = true;
        }

        for (let c = 0; c < cloneOrbits.length; c++) {
          const ang = t * 1.15 + (c * Math.PI * 2) / cloneOrbits.length;
          const r = 4.6 + Math.sin(t * 2.0 + c) * 0.65;
          cloneOrbits[c].position.set(
            Math.cos(ang) * r,
            Math.abs(Math.sin(t * 2.8 + c)) * 0.55,
            Math.sin(ang) * r
          );
          cloneOrbits[c].rotation.y = -ang;
          cloneOrbits[c].children[1].rotation.x = t * 4.5 + c;
        }

        const frostBlend = THREE.MathUtils.clamp((actLocal - 14) / 6, 0, 1);
        monolithGroup.visible = frostBlend > 0.01;
        monolithGroup.position.y = THREE.MathUtils.lerp(-6.2, 0, easeOutCubic(frostBlend));
        auroraRingA.rotation.z = t * 0.45;
        for (let m = 0; m < monoliths.length; m++) {
          monoliths[m].rotation.y = t * 0.3 + m;
        }
        centerPointLight.position.set(0, 3.4, 0);
        centerPointLight.intensity = 2.6 + (actLocal >= 13 && actLocal < 24 ? 1.1 : 0);
        accentPointLight.position.set(0, 7.5, 0);
        accentPointLight.intensity = 1.3 + frostBlend * 1.6;
        lightShaft.position.set(4, 10, 2);
        lightShaft.rotation.set(0.1, 0, -0.35);

        if (actLocal < 9) {
          camFovTarget = 48;
          const camAng = actLocal * 0.38 + px * 0.4;
          _camTarget.set(Math.cos(camAng) * 9.2, 2.7 + py * 1.0, Math.sin(camAng) * 9.2);
          _lookTarget.set(mkX * 0.5, 1.8, 0);
        } else if (actLocal < 18) {
          camFovTarget = 41; // Tight over-the-shoulder clash framing
          camRollTarget = Math.sin(t * 2.4) * 0.035;
          _camTarget.set(Math.sin(t * 0.45) * 2.2 + px * 1.3, 1.85 + py * 0.8, 6.2);
          _lookTarget.set(0, 1.65, 0);
        } else if (actLocal < 26) {
          camFovTarget = 45;
          camRollTarget = -0.025;
          _camTarget.set(-5.2 + px * 1.4, 2.4 + py * 0.9, 5.4);
          _lookTarget.set(0.4, 1.8, 0);
        } else {
          camFovTarget = 54;
          const camAng = 0.8 + (actLocal - 26) * 0.25 + px * 0.4;
          _camTarget.set(Math.cos(camAng) * 11.4, 4.9 + py * 1.2, Math.sin(camAng) * 11.4);
          _lookTarget.set(0, 2.4, 0);
        }
      } else if (actIdx === 2) {
        // ACT III: Cathedral Duel -> Time Stop Walkaround -> Chrono Rewind -> Final Standoff
        const isFrozen = actLocal >= 11 && actLocal < 16;
        const isRewind = actLocal >= 16 && actLocal < 26;
        const timeDir = isFrozen ? 0 : isRewind ? -2.8 : 1.0;

        for (const g of gears) {
          g.mesh.rotation.z += dt * g.speed * timeDir;
        }
        chronoRing.rotation.z = t * (isRewind ? -2.4 : 0.7);
        chronoRing.scale.setScalar(isFrozen ? 1.24 : 1.0 + Math.sin(t * 2.0) * 0.04);

        // Duel timing parameter (freezes at 11..16s, rewinds smoothly 16..26s, snaps forward 26..36s)
        const duelClock =
          actLocal < 11
            ? actLocal
            : isFrozen
            ? 11
            : isRewind
            ? Math.max(1.5, 11 - (actLocal - 16) * 0.95)
            : 1.5 + (actLocal - 26) * 1.4;

        // Clock Hands follow duelClock strictly!
        clockMinuteHand.rotation.z = -duelClock * 0.65;
        clockHourHand.rotation.z = -duelClock * 0.11;

        if (Math.abs(actLocal - 11) < 0.08 || Math.abs(actLocal - 16) < 0.08 || Math.abs(actLocal - 26) < 0.08) {
          shakeAmp = Math.max(shakeAmp, 0.16);
        }

        // Dimension Judge follows duelClock (freezes mid-leap and visibly rewinds limb-by-limb!)
        const judgeAng = duelClock * 0.85;
        const judgeLeap = duelClock > 7 ? Math.sin(Math.min(1, (duelClock - 7) / 4) * Math.PI * 0.6) * 2.3 : 0;
        act3JudgeRig.root.position.set(
          Math.cos(judgeAng) * 2.6,
          judgeLeap,
          Math.sin(judgeAng) * 2.6
        );
        act3JudgeRig.root.rotation.y = -judgeAng - Math.PI / 2;
        act3JudgeRig.torso.rotation.x = judgeLeap > 0.3 ? 0.25 : 0.1;
        act3JudgeRig.rightArm.rotation.x = -1.35 + Math.sin(duelClock * 4.5) * 0.55;
        act3JudgeRig.leftArm.rotation.x = -1.1 - Math.cos(duelClock * 4.5) * 0.55;
        act3JudgeRig.rightForearm.rotation.x = -0.8 + Math.cos(duelClock * 4.5) * 0.35;
        act3JudgeRig.leftForearm.rotation.x = -0.8 - Math.sin(duelClock * 4.5) * 0.35;
        act3JudgeRig.leftLeg.rotation.x = judgeLeap > 0.3 ? -0.45 : Math.sin(duelClock * 6.0) * 0.4;
        act3JudgeRig.rightLeg.rotation.x = judgeLeap > 0.3 ? 0.4 : -Math.sin(duelClock * 6.0) * 0.4;
        act3JudgeRig.leftShin.rotation.x = judgeLeap > 0.3 ? 0.9 : 0.35;
        act3JudgeRig.rightShin.rotation.x = judgeLeap > 0.3 ? 0.75 : 0.35;
        if (act3JudgeRig.haloRing) act3JudgeRig.haloRing.rotation.z = duelClock * 2.2;
        act3JudgeRig.auraRing.rotation.z = duelClock * 1.8;

        // Traveler: duels before 11s, walks freely around frozen Judge (11..16s), channels rewind (16..26s), then lunges!
        if (isFrozen) {
          const walkAround = ((actLocal - 11) / 5) * Math.PI * 0.95;
          act3TravelerRig.root.position.set(Math.cos(walkAround + Math.PI) * 3.4, 0, Math.sin(walkAround + Math.PI) * 3.4);
          act3TravelerRig.root.rotation.y = Math.atan2(
            act3JudgeRig.root.position.x - act3TravelerRig.root.position.x,
            act3JudgeRig.root.position.z - act3TravelerRig.root.position.z
          );
          const stride = Math.sin(t * 3.8);
          act3TravelerRig.torso.position.y = 0.94 + Math.abs(stride) * 0.03;
          act3TravelerRig.torso.rotation.x = 0.04;
          act3TravelerRig.leftLeg.rotation.x = stride * 0.42;
          act3TravelerRig.rightLeg.rotation.x = -stride * 0.42;
          act3TravelerRig.leftShin.rotation.x = Math.max(0.08, -stride * 0.35 + 0.3);
          act3TravelerRig.rightShin.rotation.x = Math.max(0.08, stride * 0.35 + 0.3);
          act3TravelerRig.rightArm.rotation.x = -1.1; // Holding astral lantern high
          act3TravelerRig.rightForearm.rotation.x = -0.95;
          act3TravelerRig.leftArm.rotation.x = -stride * 0.25;
          act3TravelerRig.leftForearm.rotation.x = -0.45;
          act3TravelerRig.head.rotation.y = 0.22;
        } else if (isRewind) {
          act3TravelerRig.root.position.set(-2.6, 0, 2.2);
          act3TravelerRig.root.rotation.y = Math.PI * 0.75;
          act3TravelerRig.torso.position.y = 0.86;
          act3TravelerRig.torso.rotation.x = -0.12;
          act3TravelerRig.rightArm.rotation.x = -1.45;
          act3TravelerRig.rightForearm.rotation.x = -1.1;
          act3TravelerRig.leftArm.rotation.x = -0.75;
          act3TravelerRig.leftForearm.rotation.x = -0.9;
          act3TravelerRig.weaponPivot.rotation.z = -t * 6.0;
          act3TravelerRig.leftLeg.rotation.x = -0.25;
          act3TravelerRig.rightLeg.rotation.x = 0.25;
          act3TravelerRig.leftShin.rotation.x = 0.55;
          act3TravelerRig.rightShin.rotation.x = 0.45;
        } else {
          const travAng = duelClock * 0.85 + Math.PI;
          act3TravelerRig.root.position.set(Math.cos(travAng) * 2.6, 0, Math.sin(travAng) * 2.6);
          act3TravelerRig.root.rotation.y = -travAng - Math.PI / 2;
          const runStride = Math.sin(duelClock * 7.0);
          act3TravelerRig.torso.position.y = 0.9 + Math.abs(runStride) * 0.05;
          act3TravelerRig.torso.rotation.x = 0.16;
          act3TravelerRig.leftLeg.rotation.x = runStride * 0.55;
          act3TravelerRig.rightLeg.rotation.x = -runStride * 0.55;
          act3TravelerRig.leftShin.rotation.x = Math.max(0.1, -runStride * 0.45 + 0.4);
          act3TravelerRig.rightShin.rotation.x = Math.max(0.1, runStride * 0.45 + 0.4);
          act3TravelerRig.rightArm.rotation.x = -1.1 + Math.cos(duelClock * 6.0) * 0.65;
          act3TravelerRig.leftArm.rotation.x = -0.9 + Math.sin(duelClock * 6.0) * 0.65;
          act3TravelerRig.rightForearm.rotation.x = -0.85 + Math.sin(duelClock * 6.0) * 0.35;
          act3TravelerRig.leftForearm.rotation.x = -0.85 + Math.cos(duelClock * 6.0) * 0.35;
        }
        act3TravelerRig.cape.rotation.x = 0.22 + Math.sin(t * 4.0) * 0.1;
        act3TravelerRig.auraRing.rotation.z = t * (isRewind ? -2.8 : 1.4);
        updateShadowDisc(act3JudgeRig, judgeLeap);
        updateShadowDisc(act3TravelerRig, 0);

        // Chrono Time-Stop Expansion Sphere + Astral Lantern Orb held by Traveler
        if (isFrozen || isRewind) {
          const freezePulse = isFrozen ? Math.min(1, (actLocal - 11) / 1.2) : 1 - Math.min(1, (actLocal - 16) / 2.5);
          chronoFreezeDome.visible = freezePulse > 0.02;
          chronoFreezeDome.scale.setScalar(0.4 + freezePulse * 1.15);
          chronoFreezeDome.rotation.y = t * 0.2;
          chronoFreezeMat.opacity = freezePulse * 0.14;
          astralLanternOrb.visible = true;
          const trPos = act3TravelerRig.root.position;
          const trYaw = act3TravelerRig.root.rotation.y;
          astralLanternOrb.position.set(
            trPos.x + Math.sin(trYaw) * 0.85,
            1.75 + Math.sin(t * 4.2) * 0.08,
            trPos.z + Math.cos(trYaw) * 0.85
          );
          astralLanternOrb.rotation.y = t * 4.0;
        } else {
          chronoFreezeDome.visible = false;
          astralLanternOrb.visible = false;
        }

        const shardTime = isFrozen ? 11 : isRewind ? Math.max(0, 11 - (actLocal - 16) * 1.1) : t;
        for (let i = 0; i < shardCount; i++) {
          const ang = i * 0.72 + shardTime * 0.28;
          const rad = 2.8 + (i % 6) * 1.15;
          const sy = 1.2 + (i % 7) * 0.95 + Math.sin(shardTime * 1.8 + i) * 0.22;
          _dummy.position.set(Math.cos(ang) * rad, sy, Math.sin(ang) * rad);
          _dummy.rotation.set(shardTime * 0.9 + i, shardTime * 0.7, i);
          _dummy.scale.setScalar(0.65 + (i % 3) * 0.3);
          _dummy.updateMatrix();
          shardMesh.setMatrixAt(i, _dummy.matrix);
        }
        shardMesh.instanceMatrix.needsUpdate = true;

        for (let k = 0; k < tarotCards.length; k++) {
          const ca = shardTime * 0.85 + (k * Math.PI) / 2;
          tarotCards[k].position.set(
            Math.cos(ca) * 5.2,
            2.3 + Math.sin(shardTime * 2.0 + k) * 0.35,
            Math.sin(ca) * 5.2
          );
          tarotCards[k].rotation.y = -ca + Math.PI / 2;
        }

        centerPointLight.position.set(0, 4.2, -1.5);
        centerPointLight.intensity = isRewind ? 3.8 : 2.6;
        accentPointLight.position.set(0, 8.0, -4.0);
        accentPointLight.intensity = isFrozen ? 2.4 : 1.5;
        lightShaft.position.set(-2, 11, -1);
        lightShaft.rotation.set(0.15, 0, 0.22);

        if (isFrozen) {
          camFovTarget = 40;
          camRollTarget = 0.03;
          const camAng = 0.55 + (actLocal - 11) * 0.38 + px * 0.35;
          _camTarget.set(Math.sin(camAng) * 6.4, 2.0 + py * 0.7, Math.cos(camAng) * 6.4);
          _lookTarget.set(0, 1.9, -0.8);
        } else if (isRewind) {
          camFovTarget = 51;
          camRollTarget = -0.045;
          const camAng = 1.9 - (actLocal - 16) * 0.28 + px * 0.4;
          _camTarget.set(Math.sin(camAng) * 8.6, 2.9 + py * 1.0, Math.cos(camAng) * 8.6);
          _lookTarget.set(0, 2.8, -1.8);
        } else {
          camFovTarget = actLocal >= 26 ? 49 : 46;
          const camAng = -0.6 + actProgress * 1.4 + px * 0.4;
          _camTarget.set(Math.sin(camAng) * 9.4, 2.4 + actProgress * 2.1 + py * 1.2, Math.cos(camAng) * 9.4);
          _lookTarget.set(0, 3.0, -1.5);
        }
      } else if (actIdx === 3) {
        // ACT IV: Samurai Kagero vs Fallen Angel Rain-Drenched Iaido Duel + Torii + Petals + Ripples
        eclipseGroup.rotation.z = t * 0.12;
        const p2 = actLocal >= 12 && actLocal < 24;
        const p3 = actLocal >= 24;

        // Fallen Angel swoops in (0..12s) -> dashes across samurai (12..24s) -> hovers before eclipse (24..36s)
        const swoopT = easeOutCubic(THREE.MathUtils.clamp(actLocal / 10, 0, 1));
        const dashOsc = Math.sin((actLocal - 12) * 2.8);
        const samX = actLocal < 12 ? -3.4 : p2 ? -dashOsc * 3.4 : 0;
        const angX = actLocal < 12 ? THREE.MathUtils.lerp(4.6, 3.4, swoopT) : p2 ? dashOsc * 3.4 : 0.8;
        const angY =
          actLocal < 12
            ? THREE.MathUtils.lerp(8.5, 0, swoopT)
            : p2
            ? Math.abs(Math.cos((actLocal - 12) * 2.8)) * 1.2
            : THREE.MathUtils.lerp(0, 3.2, easeOutCubic((actLocal - 24) / 6)) + Math.sin(t * 2.4) * 0.25;

        // Samurai Iaido deep knee crouch (0..12s) -> rapid strike lunges (12..24s) -> cyclone finish (24..36s)
        samuraiRig.root.position.set(samX, p3 ? Math.sin(t * 6.0) * 0.15 : 0, p2 ? Math.cos((actLocal - 12) * 2.8) * 1.4 : 0);
        samuraiRig.root.rotation.y = p3 ? t * 4.5 : samX <= angX ? Math.PI / 2 : -Math.PI / 2;
        samuraiRig.torso.position.y = actLocal < 12 ? 0.78 : p2 ? 0.86 : 0.94;
        samuraiRig.torso.rotation.x = actLocal < 12 ? 0.28 : p2 ? 0.34 : 0.12;
        samuraiRig.rightArm.rotation.x = p2 || p3 ? -1.25 + Math.cos(t * 8.0) * 0.85 : -0.35;
        samuraiRig.rightForearm.rotation.x = p2 || p3 ? -0.9 + Math.sin(t * 8.0) * 0.45 : -1.2;
        samuraiRig.leftArm.rotation.x = p2 ? -0.8 : -0.55;
        samuraiRig.leftForearm.rotation.x = -1.0;
        samuraiRig.leftLeg.rotation.x = actLocal < 12 ? -0.45 : p2 ? Math.sin(t * 9.0) * 0.55 : 0.3;
        samuraiRig.rightLeg.rotation.x = actLocal < 12 ? 0.35 : p2 ? -Math.sin(t * 9.0) * 0.55 : -0.3;
        samuraiRig.leftShin.rotation.x = actLocal < 12 ? 0.92 : p2 ? Math.max(0.15, 0.55 - Math.sin(t * 9.0) * 0.4) : 0.42;
        samuraiRig.rightShin.rotation.x = actLocal < 12 ? 0.75 : p2 ? Math.max(0.15, 0.55 + Math.sin(t * 9.0) * 0.4) : 0.42;
        samuraiRig.cape.rotation.x = 0.28 + Math.sin(t * 6.0) * 0.14;
        samuraiRig.auraRing.rotation.z = t * 2.4;

        act4AngelRig.root.position.set(angX, angY, p2 ? -Math.cos((actLocal - 12) * 2.8) * 1.4 : -2.6 * (p3 ? 1 : 0));
        act4AngelRig.root.rotation.y = angX >= samX ? -Math.PI / 2 : Math.PI / 2;
        if (p3) act4AngelRig.root.rotation.y = 0;
        const wingFlap = Math.sin(t * (p2 ? 7.5 : 4.0)) * 0.38;
        act4AngelRig.leftWing.rotation.y = 0.35 + wingFlap;
        act4AngelRig.rightWing.rotation.y = -0.35 - wingFlap;
        act4AngelRig.rightArm.rotation.x = -1.2 + Math.sin(t * 7.5) * 0.8;
        act4AngelRig.rightForearm.rotation.x = -0.8 + Math.cos(t * 7.5) * 0.45;
        act4AngelRig.leftShin.rotation.x = angY > 0.4 ? 0.72 : 0.3;
        act4AngelRig.rightShin.rotation.x = angY > 0.4 ? 0.52 : 0.3;
        act4AngelRig.auraRing.rotation.z = -t * 2.2;
        updateShadowDisc(samuraiRig, samuraiRig.root.position.y);
        updateShadowDisc(act4AngelRig, angY);

        if (p2 && Math.abs(dashOsc) < 0.09) {
          shakeAmp = Math.max(shakeAmp, 0.14);
        }

        slashArcA.visible = actLocal >= 11;
        slashArcB.visible = actLocal >= 13;
        slashArcA.rotation.z = t * 5.2;
        slashArcA.scale.setScalar(0.95 + Math.sin(t * 4.5) * 0.18);
        slashArcB.rotation.z = -t * 4.4;

        // Clash embers/sparks bursting around center during duel!
        const sparkBurst = p2 || p3 ? 1 : 0.2;
        for (let s = 0; s < sparkCount; s++) {
          const age = (t * 2.4 + s * 0.17) % 1;
          const a = s * 1.41 + t * 0.8;
          const rad = age * 4.6 * sparkBurst;
          _dummy.position.set(
            Math.cos(a) * rad,
            0.8 + age * 2.6 + Math.sin(s + t * 4) * 0.4,
            Math.sin(a) * rad
          );
          _dummy.rotation.set(t * 4 + s, t * 3, s);
          _dummy.scale.setScalar((1 - age) * sparkBurst * 1.3);
          _dummy.updateMatrix();
          sparkMesh.setMatrixAt(s, _dummy.matrix);
        }
        sparkMesh.instanceMatrix.needsUpdate = true;

        // Drifting Crimson Higanbana Petals
        for (let pt = 0; pt < petalCount; pt++) {
          const pxPos = (((t * 2.4 + pt * 1.91) % 22) - 11);
          const pzPos = (((pt * 2.77) % 18) - 9) + Math.sin(t * 1.6 + pt) * 1.2;
          const pyPos = 7.5 - ((t * 1.3 + pt * 0.45) % 7.3);
          _dummy.position.set(pxPos, pyPos, pzPos);
          _dummy.rotation.set(t * 2.2 + pt, t * 1.8 + pt, t * 1.3);
          _dummy.scale.setScalar(0.75 + (pt % 3) * 0.28);
          _dummy.updateMatrix();
          petalMesh.setMatrixAt(pt, _dummy.matrix);
        }
        petalMesh.instanceMatrix.needsUpdate = true;

        // Rain Splash Ripples on Floor
        for (let rp = 0; rp < rippleCount; rp++) {
          const age = (t * 1.9 + rp * 0.23) % 1;
          const rx = (((rp * 2.31) % 14) - 7);
          const rz = (((rp * 3.17) % 14) - 7);
          _dummy.position.set(rx, 0.035, rz);
          _dummy.rotation.set(-Math.PI / 2, 0, 0);
          _dummy.scale.setScalar(0.25 + age * 2.2);
          _dummy.updateMatrix();
          rippleMesh.setMatrixAt(rp, _dummy.matrix);
        }
        rippleMesh.instanceMatrix.needsUpdate = true;

        for (let r = 0; r < rainCount; r++) {
          const rx = (((r * 1.73) % 16) - 8) * 1.45;
          const rz = (((r * 2.91) % 16) - 8) * 1.45;
          const ry = 13 - ((t * 14.5 + r * 0.7) % 13);
          _dummy.position.set(rx, ry, rz);
          _dummy.rotation.set(0, 0, 0.14);
          _dummy.scale.setScalar(1);
          _dummy.updateMatrix();
          rainMesh.setMatrixAt(r, _dummy.matrix);
        }
        rainMesh.instanceMatrix.needsUpdate = true;
        centerPointLight.position.set(0, 2.8, 1.2);
        centerPointLight.intensity = 3.0 + Math.sin(t * 6.0) * 0.5;
        accentPointLight.position.set(0, 9.0, -12.0);
        accentPointLight.intensity = 2.2;
        lightShaft.position.set(0, 10, -10);
        lightShaft.rotation.set(-0.45, 0, 0);

        if (actLocal < 12) {
          camFovTarget = 42;
          camRollTarget = -0.025;
          _camTarget.set(-5.6 + px * 1.2, 1.4 + py * 0.9, 6.2);
          _lookTarget.set(0.4, 2.5, -2.5);
        } else if (p2) {
          camFovTarget = 48;
          camRollTarget = dashOsc * 0.045;
          const duelAng = Math.sin((actLocal - 12) * 0.55) * 0.65 + px * 0.4;
          _camTarget.set(Math.sin(duelAng) * 7.6, 2.0 + py * 1.0, Math.cos(duelAng) * 7.6);
          _lookTarget.set(0, 1.75, 0);
        } else {
          camFovTarget = 52;
          camRollTarget = 0;
          _camTarget.set(px * 1.5, 1.65 + py * 1.0, 9.6);
          _lookTarget.set(0, 4.4, -6.5);
        }
      } else {
        // ACT V: 6-Hero Grand Alliance + Armillary Rings + Prism Beams + 15-Orb Omega Convergence
        const phase2T = easeOutCubic(THREE.MathUtils.clamp((actLocal - 11) / 6, 0, 1));
        const converge = THREE.MathUtils.clamp((actLocal - 14) / 18, 0, 1);

        tesseractGroup.rotation.x = t * 0.55;
        tesseractGroup.rotation.y = t * 0.85;
        innerOcta.rotation.y = -t * 1.4;
        glassShell.rotation.z = t * 0.35;

        armillaryRingA.rotation.x = Math.PI / 3 + t * 0.5;
        armillaryRingA.rotation.y = t * 0.7;
        armillaryRingB.rotation.x = -Math.PI / 4 - t * 0.45;
        armillaryRingB.rotation.z = t * 0.65;

        codeRingA.rotation.x = t * 0.8;
        codeRingA.rotation.y = t * 0.5;
        codeRingB.rotation.y = -t * 0.9;
        codeRingB.rotation.z = t * 0.6;

        // Architect & Lumina float on either side of Tesseract, ascending in Phase 3
        const ascendY = actLocal >= 24 ? easeOutCubic((actLocal - 24) / 8) * 1.8 : 0;
        architectRig.root.position.set(-2.3, 0.55 + Math.sin(t * 2.2) * 0.2 + ascendY, 0.8);
        architectRig.root.rotation.y = Math.PI * 0.25;
        architectRig.rightArm.rotation.x = -1.25 + Math.sin(t * 3.0) * 0.25;
        architectRig.leftArm.rotation.x = -1.25 + Math.cos(t * 3.0) * 0.25;
        architectRig.rightForearm.rotation.x = -0.85;
        architectRig.leftForearm.rotation.x = -0.85;
        architectRig.leftShin.rotation.x = 0.38;
        architectRig.rightShin.rotation.x = 0.52;
        if (architectRig.haloRing) architectRig.haloRing.rotation.z = t * 1.8;
        architectRig.auraRing.rotation.z = t * 1.6;

        const luminaHover = Math.sin(t * 2.2 + 1.2) * 0.2;
        luminaRig.root.position.set(2.3, 0.55 + luminaHover + ascendY, 0.8);
        luminaRig.root.rotation.y = -Math.PI * 0.25;
        luminaRig.rightArm.rotation.x = -1.35;
        luminaRig.rightForearm.rotation.x = -0.65;
        luminaRig.leftForearm.rotation.x = -0.75;
        luminaRig.leftShin.rotation.x = 0.32;
        luminaRig.rightShin.rotation.x = 0.48;
        luminaRig.leftWing.rotation.y = 0.3 + Math.sin(t * 3.2) * 0.2;
        luminaRig.rightWing.rotation.y = -0.3 - Math.sin(t * 3.2) * 0.2;
        if (luminaRig.haloRing) luminaRig.haloRing.rotation.z = -t * 1.5;
        luminaRig.auraRing.rotation.z = -t * 1.6;

        // 4 Council Heroes walk in onto surrounding sanctum points (10s+) and raise weapons skyward
        const allyAngles = [0.65, 2.5, -2.5, -0.65];
        for (let a = 0; a < act5Allies.length; a++) {
          const ally = act5Allies[a];
          ally.root.visible = actLocal >= 10;
          const dist = THREE.MathUtils.lerp(7.6, 4.3, phase2T);
          const aa = allyAngles[a];
          ally.root.position.set(Math.sin(aa) * dist, 0, Math.cos(aa) * dist);
          ally.root.rotation.y = aa + Math.PI;
          const walk = phase2T < 1 && actLocal >= 10 ? Math.sin(t * 5.0 + a) : 0;
          ally.leftLeg.rotation.x = walk * 0.45;
          ally.rightLeg.rotation.x = -walk * 0.45;
          ally.leftShin.rotation.x = phase2T < 1 ? Math.max(0.1, -walk * 0.4 + 0.35) : 0.22;
          ally.rightShin.rotation.x = phase2T < 1 ? Math.max(0.1, walk * 0.4 + 0.35) : 0.22;
          ally.rightArm.rotation.x = actLocal >= 18 ? -2.2 + Math.sin(t * 2.5 + a) * 0.12 : -0.6 + walk * 0.3;
          ally.rightForearm.rotation.x = actLocal >= 18 ? -0.35 : -0.75;
          ally.leftForearm.rotation.x = -0.65;
          ally.leftWing.rotation.y = 0.25 + Math.sin(t * 3.5) * 0.15;
          ally.rightWing.rotation.y = -0.25 - Math.sin(t * 3.5) * 0.15;
          ally.auraRing.rotation.z = t * 1.4;
        }

        // Prisms & Radial Convergence Beams + 6-Hero Omega Beams into the Tesseract Core
        for (let p = 0; p < prisms.length; p++) {
          prisms[p].rotation.y = t * 0.6 + p;
          prisms[p].position.y = prismBaseHeights[p] + Math.sin(t * 1.8 + p) * 0.25;

          const pPos = prisms[p].position;
          _beamDir.set(0 - pPos.x, 4.2 - (pPos.y + 0.8), 0 - pPos.z);
          const beamLen = _beamDir.length();
          _beamDir.normalize();
          _beamQuat.setFromUnitVectors(_beamUp, _beamDir);

          const beam = prismBeams[p];
          beam.visible = converge > 0.04;
          beam.position.set(pPos.x * 0.5, (pPos.y + 0.8 + 4.2) * 0.5, pPos.z * 0.5);
          beam.quaternion.copy(_beamQuat);
          const beamWidth = 0.4 + converge * 1.35 + Math.sin(t * 8 + p) * 0.12;
          beam.scale.set(beamWidth, beamLen, beamWidth);
          prismBeamMats[p].opacity = converge * 0.42;
        }

        const heroStreamAlpha = smoothstep01((actLocal - 19) / 3.0);
        const omegaHeroes = [architectRig, luminaRig, ...act5Allies];
        for (let hb = 0; hb < act5HeroBeams.length; hb++) {
          const heroRig = omegaHeroes[hb];
          updateShadowDisc(heroRig, heroRig.root.position.y);
          const hBeam = act5HeroBeams[hb];
          if (heroStreamAlpha > 0.02 && heroRig.root.visible) {
            const hp = heroRig.root.position;
            _beamDir.set(0 - hp.x, 4.2 - (hp.y + 1.65), 0 - hp.z);
            const len = _beamDir.length();
            _beamDir.normalize();
            _beamQuat.setFromUnitVectors(_beamUp, _beamDir);
            hBeam.visible = true;
            hBeam.position.set(hp.x * 0.5, (hp.y + 1.65 + 4.2) * 0.5, hp.z * 0.5);
            hBeam.quaternion.copy(_beamQuat);
            const bw = 0.45 + heroStreamAlpha * 0.75 + Math.sin(t * 10 + hb) * 0.1;
            hBeam.scale.set(bw, len, bw);
            act5HeroBeamMats[hb].opacity = heroStreamAlpha * 0.52;
          } else {
            hBeam.visible = false;
          }
        }

        for (let h = 0; h < heroOrbs.length; h++) {
          const ang = t * (0.85 + converge * 1.4) + (h * Math.PI * 2) / heroOrbs.length;
          const orbRad = THREE.MathUtils.lerp(8.5, 2.0, converge) + Math.sin(t * 2.5 + h) * 0.25;
          heroOrbs[h].position.set(
            Math.cos(ang) * orbRad,
            4.2 + Math.sin(t * 2.2 + h * 0.7) * (1.8 * (1 - converge * 0.6)),
            Math.sin(ang) * orbRad
          );
          heroOrbs[h].scale.setScalar(1.0 + converge * 0.5);
        }

        lighthouse.beamPivot.rotation.y = t * 0.55;
        for (let b = 0; b < act5Boats.length; b++) {
          act5Boats[b].position.y = WORLD_WATER_LEVEL + 0.04 + Math.sin(t * 1.7 + b * 1.8) * 0.08;
          act5Boats[b].rotation.z = Math.sin(t * 1.4 + b) * 0.055;
        }

        centerPointLight.position.set(0, 4.0, 0);
        centerPointLight.intensity = 2.8 + converge * 2.0;
        accentPointLight.position.set(0, 9.5, 0);
        accentPointLight.intensity = 1.6 + converge * 1.4;
        lightShaft.position.set(0, 10.5, 0);
        lightShaft.rotation.set(0, 0, 0);

        camFovTarget = actLocal < 12 ? 43 : actLocal < 24 ? 48 : 54;
        camRollTarget = actLocal >= 24 ? Math.sin(t * 0.5) * 0.028 : 0;
        const camAng = t * 0.26 + px * 0.5;
        _camTarget.set(
          Math.cos(camAng) * (11.5 - phase2T * 1.2),
          3.4 + actProgress * 2.6 + py * 1.4,
          Math.sin(camAng) * (11.5 - phase2T * 1.2)
        );
        _lookTarget.set(0, 3.0 + ascendY * 0.4, 0);
      }

      // Dynamic FOV breath + transition pulse
      const finalFovTarget = camFovTarget + transPulse * 6.0;
      if (Math.abs(camera.fov - finalFovTarget) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, finalFovTarget, 4.2, dt);
        camera.updateProjectionMatrix();
      }

      // Silky-smooth exponential camera damping + micro-shake + Dutch roll
      shakeAmp = THREE.MathUtils.damp(shakeAmp, 0, 7.5, dt);
      const sx = shakeAmp > 0.002 ? Math.sin(now * 0.085) * shakeAmp : 0;
      const sy = shakeAmp > 0.002 ? Math.cos(now * 0.11) * shakeAmp * 0.75 : 0;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTarget.x, 3.2, dt) + sx;
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTarget.y, 3.2, dt) + sy;
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTarget.z, 3.2, dt);
      _curLook.x = THREE.MathUtils.damp(_curLook.x, _lookTarget.x, 3.6, dt);
      _curLook.y = THREE.MathUtils.damp(_curLook.y, _lookTarget.y, 3.6, dt);
      _curLook.z = THREE.MathUtils.damp(_curLook.z, _lookTarget.z, 3.6, dt);
      camera.lookAt(_curLook);
      curRoll = THREE.MathUtils.damp(curRoll, camRollTarget, 3.2, dt);
      camera.rotation.z += curRoll;

      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      mats.disposeAll();
      disposables.forEach((d) => d.dispose());
      if (composer) composer.dispose();
      renderer.dispose();
      if (domCanvas.parentNode === host) {
        host.removeChild(domCanvas);
      }
    };
  }, []);

  const currentActIndex = Math.min(4, Math.floor(elapsed / ACT_DURATION));
  const currentAct = ACTS_3D[currentActIndex];
  const actLocal = elapsed - currentActIndex * ACT_DURATION;
  const beatIndex = Math.min(2, Math.floor(actLocal / (ACT_DURATION / 3)));
  const beatText = currentAct.beats[beatIndex];
  const totalPct = Math.min(100, (elapsed / EASTER_EGG_TOTAL_SECONDS) * 100);
  const showChapterSplash = actLocal < 2.6;

  const jumpToAct = (idx: number) => {
    const targetSec = idx * ACT_DURATION + 0.1;
    elapsedRef.current = targetSec;
    manualJumpTriggerRef.current = true;
    firedCuesRef.current.clear();
    setElapsed(targetSec);
    lastActAudioRef.current = idx;
    sounds.playEasterEggChime(idx === 4 ? 5 : idx, idx === 4);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950 select-none overflow-hidden"
      onPointerMove={(e) => {
        pointerOffsetRef.current.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        pointerOffsetRef.current.y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * -2;
      }}
    >
      {/* Dedicated WebGL Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Fallback message only if WebGL is unavailable */}
      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center p-6">
          <Film className="w-12 h-12 text-cyan-400 mb-3" />
          <h2 className="text-xl font-title font-bold text-white mb-2">Mode 3D WebGL Tidak Tersedia</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Perangkat atau browser saat ini tidak mendukung WebGL 3D. Kamu tetap dapat melanjutkan permainan.
          </p>
          <button
            type="button"
            onClick={() => onComplete(false)}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm cursor-pointer"
          >
            Kembali ke Permainan
          </button>
        </div>
      )}

      {/* Subtle Widescreen Cinema Letterbox Framing */}
      <div className="fixed top-0 inset-x-0 h-4 sm:h-6 bg-black/95 pointer-events-none z-10 border-b border-slate-800/40" />
      <div className="fixed bottom-0 inset-x-0 h-4 sm:h-6 bg-black/95 pointer-events-none z-10 border-t border-slate-800/40" />

      {/* Minimal Top-Left Spec Badge */}
      <div className="fixed top-6 sm:top-8 left-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/88 border border-slate-700/80 shadow-lg pointer-events-none">
        <Film className="w-4 h-4 text-amber-300 shrink-0" />
        <div className="leading-tight">
          <p className="text-[10px] font-mono font-bold tracking-widest text-amber-300 uppercase">
            Easter Egg 3D · Babak {currentAct.roman} / V
          </p>
          <p className="text-xs font-title font-bold text-slate-100">{currentAct.title}</p>
        </div>
        <span className="ml-2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-200 tabular-nums">
          {formatClock(elapsed)} / {formatClock(EASTER_EGG_TOTAL_SECONDS)}
        </span>
      </div>

      {/* Smooth Animated Chapter Splash Card on Act Transition */}
      <div
        className={`fixed top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-500 ${
          showChapterSplash ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
      >
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-center shadow-2xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: currentAct.accent }}>
            Babak {currentAct.roman} · Transisi Dunia 3D
          </p>
          <p className="text-sm sm:text-base font-title font-bold text-white tracking-wide">
            {currentAct.title}
          </p>
        </div>
      </div>

      {/* Unified Collapsible Bottom Control Dock */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-20 w-[min(920px,94vw)] transition-transform duration-300 ${
          isHudCollapsed ? 'bottom-3 translate-y-[calc(100%-34px)]' : 'bottom-5 translate-y-0'
        }`}
      >
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setIsHudCollapsed((c) => !c)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-slate-950/92 border border-b-0 border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
          >
            {isHudCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isHudCollapsed ? 'Tampilkan Kontrol (H)' : 'Sembunyikan UI (H)'}</span>
          </button>
        </div>

        <div className="rounded-2xl bg-slate-950/92 border border-slate-700/80 p-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: currentAct.accent }}>
              {currentAct.locationTag}
            </span>

            <div className="flex items-center gap-2">
              {isInBattle && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-200">
                  Selesaikan untuk Berkah Omega
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isPaused ? 'Lanjut' : 'Jeda'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
                title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!completedRef.current) {
                    completedRef.current = true;
                    onComplete(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-400/60 text-slate-200 hover:text-rose-200 text-xs font-semibold cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Lewati</span>
              </button>
            </div>
          </div>

          <p
            key={`${currentActIndex}-${beatIndex}`}
            className="text-sm sm:text-base text-slate-100 leading-relaxed min-h-[2.8rem] transition-opacity duration-500"
          >
            {beatText}
          </p>

          {/* 5-Act Interactive 3D Chapter Timeline */}
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {ACTS_3D.map((act, idx) => {
              const segFill =
                idx < currentActIndex
                  ? 100
                  : idx === currentActIndex
                  ? Math.min(100, (actLocal / ACT_DURATION) * 100)
                  : 0;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => jumpToAct(idx)}
                  className="flex flex-col gap-1 text-left cursor-pointer group"
                >
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-150"
                      style={{
                        width: `${segFill}%`,
                        backgroundColor: act.accent
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-white truncate">
                    {act.roman}. {act.title.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Geser kursor untuk miringkan kamera 3D · Spasi: Jeda · H: Kontrol</span>
            <span>{totalPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
