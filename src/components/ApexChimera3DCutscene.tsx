import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FastForward } from 'lucide-react';

interface ApexChimera3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

const PHASE_LABELS = {
  helix: 'DNA HELIX CONVERGENCE · WOLF · BEHEMOTH · WYVERN',
  fusion: 'OMEGA BIO-FUSION · METAMORPHOSIS DETONATION',
  reveal: 'APEX CHIMERA AWAKENED · TRI-FORM SOVEREIGNTY'
};

export const ApexChimera3DCutscene: React.FC<ApexChimera3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 3.6,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [phase, setPhase] = useState<'helix' | 'fusion' | 'reveal'>('helix');
  const [uiProgress, setUiProgress] = useState<number>(0);

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const testGl =
        canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' }) ||
        canvas.getContext('webgl', { antialias: true, powerPreference: 'high-performance' });
      if (!testGl) {
        onFallbackRef.current?.();
        return;
      }

      const debugExt = testGl.getExtension('WEBGL_debug_renderer_info');
      const gpuName = debugExt
        ? String(testGl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '')
        : '';
      const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);

      renderer = new THREE.WebGLRenderer({
        canvas,
        context: testGl as WebGLRenderingContext,
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : 2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);

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
      scene.background = new THREE.Color(0x030e0a);
      scene.fog = new THREE.FogExp2(0x03120d, 0.042);

      const camera = new THREE.PerspectiveCamera(
        48,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        80
      );
      camera.position.set(0, 3.2, 8.8);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      disposables.push(envRT, roomEnv, pmrem);

      // 3-Point Dramatic Lighting + Bio-Mutagen Rim
      const hemiLight = new THREE.HemisphereLight(0x6ee7b7, 0x091611, 0.9);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfef08a, 2.5);
      keyLight.position.set(4.5, 8.5, 5.5);
      scene.add(keyLight);

      const emeraldRim = new THREE.PointLight(0x10b981, 18, 22, 1.5);
      emeraldRim.position.set(-4.2, 3.2, -3.5);
      scene.add(emeraldRim);

      const amberCoreLight = new THREE.PointLight(0xf59e0b, 14, 18, 1.5);
      amberCoreLight.position.set(0, 1.8, 0.8);
      scene.add(amberCoreLight);

      // Procedural Alchemy Rune Texture for Pedestal
      const runeCanvas = document.createElement('canvas');
      runeCanvas.width = 512;
      runeCanvas.height = 512;
      const rctx = runeCanvas.getContext('2d');
      if (rctx) {
        rctx.fillStyle = '#04120d';
        rctx.fillRect(0, 0, 512, 512);

        const grad = rctx.createRadialGradient(256, 256, 20, 256, 256, 240);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.42)');
        grad.addColorStop(0.55, 'rgba(245, 158, 11, 0.16)');
        grad.addColorStop(1, 'rgba(4, 18, 13, 0)');
        rctx.fillStyle = grad;
        rctx.fillRect(0, 0, 512, 512);

        rctx.strokeStyle = '#34d399';
        rctx.lineWidth = 4;
        rctx.beginPath();
        rctx.arc(256, 256, 232, 0, Math.PI * 2);
        rctx.stroke();

        rctx.strokeStyle = '#fbbf24';
        rctx.lineWidth = 2.5;
        rctx.beginPath();
        rctx.arc(256, 256, 182, 0, Math.PI * 2);
        rctx.stroke();

        rctx.strokeStyle = 'rgba(110, 231, 183, 0.72)';
        rctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const a1 = (i * Math.PI) / 3;
          const a2 = ((i + 2) * Math.PI) / 3;
          rctx.beginPath();
          rctx.moveTo(256 + Math.cos(a1) * 180, 256 + Math.sin(a1) * 180);
          rctx.lineTo(256 + Math.cos(a2) * 180, 256 + Math.sin(a2) * 180);
          rctx.stroke();
        }
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI * 2) / 24;
          rctx.beginPath();
          rctx.moveTo(256 + Math.cos(a) * 194, 256 + Math.sin(a) * 194);
          rctx.lineTo(256 + Math.cos(a) * 218, 256 + Math.sin(a) * 218);
          rctx.stroke();
        }
      }
      const runeTex = new THREE.CanvasTexture(runeCanvas);
      runeTex.colorSpace = THREE.SRGBColorSpace;
      runeTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      disposables.push(runeTex);

      // Shared PBR Materials
      const obsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0b1914,
          roughness: 0.42,
          metalness: 0.68
        })
      );
      const emeraldArmorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x059669,
          emissive: 0x064e3b,
          emissiveIntensity: 0.55,
          roughness: 0.25,
          metalness: 0.78
        })
      );
      const goldTrimMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xb45309,
          emissiveIntensity: 0.45,
          roughness: 0.2,
          metalness: 0.88
        })
      );
      const coreGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x6ee7b7,
          emissive: 0x34d399,
          emissiveIntensity: 2.2,
          roughness: 0.12,
          metalness: 0.1
        })
      );
      const amberGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 2.0,
          roughness: 0.15,
          metalness: 0.2
        })
      );
      const wolfGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x34d399,
          emissive: 0x10b981,
          emissiveIntensity: 1.4,
          roughness: 0.24,
          metalness: 0.65
        })
      );
      const behemothGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 1.25,
          roughness: 0.3,
          metalness: 0.72
        })
      );
      const wyvernGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xeab308,
          emissiveIntensity: 1.5,
          roughness: 0.2,
          metalness: 0.78,
          side: THREE.DoubleSide
        })
      );

      // 1. Grounded Arena Pedestal + Bio-Crystal Obelisks
      const pedestalGroup = new THREE.Group();
      scene.add(pedestalGroup);

      const floorPlane = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(18, 48)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x04100b,
            roughness: 0.82,
            metalness: 0.25
          })
        )
      );
      floorPlane.rotation.x = -Math.PI / 2;
      floorPlane.position.y = -0.32;
      pedestalGroup.add(floorPlane);

      const daisBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(3.8, 4.35, 0.32, 12)),
        obsidianMat
      );
      daisBase.position.y = -0.16;
      pedestalGroup.add(daisBase);

      const daisRunePlate = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(3.65, 48)),
        trackMat(
          new THREE.MeshStandardMaterial({
            map: runeTex,
            emissive: 0x10b981,
            emissiveMap: runeTex,
            emissiveIntensity: 1.25,
            roughness: 0.35,
            metalness: 0.55
          })
        )
      );
      daisRunePlate.rotation.x = -Math.PI / 2;
      daisRunePlate.position.y = 0.008;
      pedestalGroup.add(daisRunePlate);

      const daisRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.75, 0.065, 12, 64)),
        goldTrimMat
      );
      daisRing.rotation.x = Math.PI / 2;
      daisRing.position.y = 0.02;
      pedestalGroup.add(daisRing);

      const obeliskGeo = trackGeo(new THREE.CylinderGeometry(0.12, 0.24, 1.85, 6));
      const obeliskCrystalGeo = trackGeo(new THREE.OctahedronGeometry(0.22, 0));
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const obGroup = new THREE.Group();
        obGroup.position.set(Math.cos(ang) * 4.5, 0.55, Math.sin(ang) * 4.5);
        obGroup.lookAt(0, 0.55, 0);

        const shaft = new THREE.Mesh(obeliskGeo, obsidianMat);
        obGroup.add(shaft);

        const cap = new THREE.Mesh(obeliskCrystalGeo, i % 2 === 0 ? coreGlowMat : amberGlowMat);
        cap.position.y = 1.22;
        obGroup.add(cap);

        pedestalGroup.add(obGroup);
      }

      // 2. Central 3D Double-Helix DNA Matrix
      const dnaGroup = new THREE.Group();
      dnaGroup.position.y = 1.55;
      scene.add(dnaGroup);

      const strandPointsA: THREE.Vector3[] = [];
      const strandPointsB: THREE.Vector3[] = [];
      const helixSteps = 44;
      for (let i = 0; i <= helixSteps; i++) {
        const t = i / helixSteps;
        const y = (t - 0.5) * 3.8;
        const angle = t * Math.PI * 4;
        const r = 0.86;
        strandPointsA.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
        strandPointsB.push(new THREE.Vector3(Math.cos(angle + Math.PI) * r, y, Math.sin(angle + Math.PI) * r));
      }
      const curveA = new THREE.CatmullRomCurve3(strandPointsA);
      const curveB = new THREE.CatmullRomCurve3(strandPointsB);

      const tubeA = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(curveA, 56, 0.052, 8, false)),
        coreGlowMat
      );
      const tubeB = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(curveB, 56, 0.052, 8, false)),
        amberGlowMat
      );
      dnaGroup.add(tubeA, tubeB);

      const rungGeo = trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 1.65, 6));
      for (let i = 2; i < helixSteps - 1; i += 4) {
        const t = i / helixSteps;
        const y = (t - 0.5) * 3.8;
        const angle = t * Math.PI * 4;
        const rung = new THREE.Mesh(rungGeo, i % 8 === 2 ? coreGlowMat : goldTrimMat);
        rung.position.y = y;
        rung.rotation.z = Math.PI / 2;
        rung.rotation.y = -angle;
        dnaGroup.add(rung);
      }

      // 3. Central Bio-Mutagen Cocoon (Phase 1)
      const cocoonGroup = new THREE.Group();
      cocoonGroup.position.y = 1.65;
      scene.add(cocoonGroup);

      const coreOrb = new THREE.Mesh(
        trackGeo(new THREE.IcosahedronGeometry(0.55, 1)),
        coreGlowMat
      );
      cocoonGroup.add(coreOrb);

      const shellWire = new THREE.Mesh(
        trackGeo(new THREE.IcosahedronGeometry(0.86, 0)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x34d399,
            emissive: 0x10b981,
            emissiveIntensity: 1.1,
            wireframe: true
          })
        )
      );
      cocoonGroup.add(shellWire);

      const orbitRingA = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.18, 0.04, 10, 48)),
        goldTrimMat
      );
      orbitRingA.rotation.x = Math.PI / 3;
      const orbitRingB = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.36, 0.035, 10, 48)),
        coreGlowMat
      );
      orbitRingB.rotation.y = Math.PI / 3;
      cocoonGroup.add(orbitRingA, orbitRingB);

      // 4. Composite 3D Tri-Beast Aspect Totems
      // 4A. Razor Wolf Group
      const wolfGroup = new THREE.Group();
      const wolfHead = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.36, 0.85, 5)), wolfGlowMat);
      wolfHead.rotation.x = Math.PI / 2;
      const wolfSnout = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.18, 0.55, 4)), obsidianMat);
      wolfSnout.rotation.x = Math.PI / 2;
      wolfSnout.position.z = 0.42;
      const wolfEarL = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.1, 0.42, 4)), goldTrimMat);
      wolfEarL.position.set(-0.2, 0.34, -0.12);
      wolfEarL.rotation.z = 0.28;
      const wolfEarR = wolfEarL.clone();
      wolfEarR.position.x = 0.2;
      wolfEarR.rotation.z = -0.28;
      const wolfClawL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.14, 0.85)), coreGlowMat);
      wolfClawL.position.set(-0.42, -0.12, 0.2);
      wolfClawL.rotation.y = 0.25;
      const wolfClawR = wolfClawL.clone();
      wolfClawR.position.x = 0.42;
      wolfClawR.rotation.y = -0.25;
      wolfGroup.add(wolfHead, wolfSnout, wolfEarL, wolfEarR, wolfClawL, wolfClawR);
      scene.add(wolfGroup);

      // 4B. Titan Behemoth Group
      const behemothGroup = new THREE.Group();
      const behTorso = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.48, 0)), behemothGlowMat);
      const behPauldronL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.44, 0.42, 0.52)), obsidianMat);
      behPauldronL.position.set(-0.52, 0.18, 0);
      behPauldronL.rotation.z = 0.3;
      const behPauldronR = behPauldronL.clone();
      behPauldronR.position.x = 0.52;
      behPauldronR.rotation.z = -0.3;
      const behHornL = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.1, 0.55, 5)), goldTrimMat);
      behHornL.position.set(-0.28, 0.46, 0.18);
      behHornL.rotation.set(0.45, 0, 0.45);
      const behHornR = behHornL.clone();
      behHornR.position.x = 0.28;
      behHornR.rotation.z = -0.45;
      const behCore = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.24, 0)), amberGlowMat);
      behCore.position.z = 0.42;
      behemothGroup.add(behTorso, behPauldronL, behPauldronR, behHornL, behHornR, behCore);
      scene.add(behemothGroup);

      // 4C. Astral Wyvern Group
      const wyvernGroup = new THREE.Group();
      const wyvBody = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.38, 0)), wyvernGlowMat);
      wyvBody.scale.set(0.85, 0.85, 1.45);
      const wyvCrest = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.18, 0.65, 4)), goldTrimMat);
      wyvCrest.rotation.x = -Math.PI * 0.42;
      wyvCrest.position.set(0, 0.32, -0.2);
      const wyvWingShape = new THREE.Shape();
      wyvWingShape.moveTo(0, 0);
      wyvWingShape.lineTo(1.05, 0.48);
      wyvWingShape.lineTo(0.82, -0.25);
      wyvWingShape.lineTo(0.32, -0.14);
      wyvWingShape.closePath();
      const wyvWingGeo = trackGeo(
        new THREE.ExtrudeGeometry(wyvWingShape, { depth: 0.04, bevelEnabled: false })
      );
      const wyvWingL = new THREE.Mesh(wyvWingGeo, wyvernGlowMat);
      wyvWingL.position.set(0.22, 0.1, 0);
      const wyvWingR = new THREE.Mesh(wyvWingGeo, wyvernGlowMat);
      wyvWingR.scale.x = -1;
      wyvWingR.position.set(-0.22, 0.1, 0);
      const wyvTail = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.12, 0.8, 5)), obsidianMat);
      wyvTail.rotation.x = -Math.PI / 2;
      wyvTail.position.z = -0.68;
      wyvernGroup.add(wyvBody, wyvCrest, wyvWingL, wyvWingR, wyvTail);
      scene.add(wyvernGroup);

      // 5. Fusion Shockwave Rings + Instanced Crystal Shards
      const shockwaveRingA = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.07, 10, 48)),
        coreGlowMat
      );
      shockwaveRingA.rotation.x = Math.PI / 2;
      shockwaveRingA.position.y = 1.5;
      shockwaveRingA.visible = false;
      scene.add(shockwaveRingA);

      const shockwaveRingB = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1, 0.055, 10, 48)),
        amberGlowMat
      );
      shockwaveRingB.rotation.x = Math.PI / 2;
      shockwaveRingB.position.y = 1.5;
      shockwaveRingB.visible = false;
      scene.add(shockwaveRingB);

      const shardCount = 48;
      const shardGeo = trackGeo(new THREE.OctahedronGeometry(0.12, 0));
      const shardMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x34d399,
          emissiveIntensity: 1.8,
          roughness: 0.15,
          metalness: 0.4
        })
      );
      const shardInstanced = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
      shardInstanced.visible = false;
      scene.add(shardInstanced);

      const shardDirs: THREE.Vector3[] = [];
      const shardSpeeds: number[] = [];
      const _tmpColor = new THREE.Color();
      for (let i = 0; i < shardCount; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / shardCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        shardDirs.push(
          new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi) * 0.72 + 0.25,
            Math.sin(phi) * Math.sin(theta)
          ).normalize()
        );
        shardSpeeds.push(4.5 + (i % 5) * 1.1);
        _tmpColor.setHex(i % 3 === 0 ? 0x34d399 : i % 3 === 1 ? 0xfbbf24 : 0xfef08a);
        shardInstanced.setColorAt(i, _tmpColor);
      }
      if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;

      // 6. Composite 3D Apex Chimera Avatar (Phase 3 Reveal)
      const chimeraGroup = new THREE.Group();
      chimeraGroup.position.y = 1.45;
      chimeraGroup.visible = false;
      scene.add(chimeraGroup);

      // Torso & Chest Reactor
      const chimeraTorso = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.56, 0.36, 1.35, 8)),
        emeraldArmorMat
      );
      chimeraGroup.add(chimeraTorso);

      const chimeraPelvis = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.36, 0.24, 0.48, 8)),
        obsidianMat
      );
      chimeraPelvis.position.y = -0.82;
      chimeraGroup.add(chimeraPelvis);

      const chimeraCore = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.28, 0)),
        amberGlowMat
      );
      chimeraCore.position.set(0, 0.16, 0.48);
      chimeraGroup.add(chimeraCore);

      // Head, Horned Crown & Visor
      const chimeraHead = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(0.34, 0)),
        obsidianMat
      );
      chimeraHead.position.set(0, 0.98, 0.08);
      chimeraGroup.add(chimeraHead);

      const chimeraVisor = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.42, 0.1, 0.24)),
        coreGlowMat
      );
      chimeraVisor.position.set(0, 1.0, 0.3);
      chimeraGroup.add(chimeraVisor);

      const crownHornL = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.11, 0.78, 5)),
        goldTrimMat
      );
      crownHornL.position.set(-0.28, 1.32, -0.05);
      crownHornL.rotation.set(-0.35, 0, 0.48);
      const crownHornR = crownHornL.clone();
      crownHornR.position.x = 0.28;
      crownHornR.rotation.z = -0.48;
      chimeraGroup.add(crownHornL, crownHornR);

      // Massive Behemoth Shoulder Pauldrons & Razor Wolf Claw Gauntlets
      const pauldronGeo = trackGeo(new THREE.DodecahedronGeometry(0.38, 0));
      const pauldronL = new THREE.Mesh(pauldronGeo, obsidianMat);
      pauldronL.position.set(-0.78, 0.56, 0);
      pauldronL.scale.set(1.2, 0.85, 1.1);
      const pauldronR = pauldronL.clone();
      pauldronR.position.x = 0.78;
      chimeraGroup.add(pauldronL, pauldronR);

      const armLGroup = new THREE.Group();
      armLGroup.position.set(-0.82, 0.42, 0.12);
      const armLMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.18, 0.78, 6)), emeraldArmorMat);
      armLMesh.position.set(-0.18, -0.35, 0.22);
      armLMesh.rotation.set(-0.55, 0, -0.32);
      const clawBladeL = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.12, 0.95, 4)), coreGlowMat);
      clawBladeL.position.set(-0.32, -0.68, 0.52);
      clawBladeL.rotation.set(Math.PI * 0.62, 0, -0.25);
      armLGroup.add(armLMesh, clawBladeL);

      const armRGroup = new THREE.Group();
      armRGroup.position.set(0.82, 0.42, 0.12);
      const armRMesh = armLMesh.clone();
      armRMesh.position.x = 0.18;
      armRMesh.rotation.z = 0.32;
      const clawBladeR = clawBladeL.clone();
      clawBladeR.position.x = 0.32;
      clawBladeR.rotation.z = 0.25;
      armRGroup.add(armRMesh, clawBladeR);
      chimeraGroup.add(armLGroup, armRGroup);

      // Expansive Astral Wyvern Wings (Articulated Pivots)
      const chimeraWingShape = new THREE.Shape();
      chimeraWingShape.moveTo(0, 0);
      chimeraWingShape.lineTo(2.35, 1.18);
      chimeraWingShape.lineTo(2.65, 0.28);
      chimeraWingShape.lineTo(1.78, -0.45);
      chimeraWingShape.lineTo(1.05, -0.18);
      chimeraWingShape.lineTo(0.45, -0.52);
      chimeraWingShape.closePath();
      const chimeraWingGeo = trackGeo(
        new THREE.ExtrudeGeometry(chimeraWingShape, {
          depth: 0.055,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.02,
          bevelSegments: 2
        })
      );

      const wingPivotL = new THREE.Group();
      wingPivotL.position.set(-0.34, 0.46, -0.34);
      const wingMeshL = new THREE.Mesh(chimeraWingGeo, wyvernGlowMat);
      wingMeshL.scale.x = -1;
      const wingSparL = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.05, 0.075, 2.55, 6)),
        obsidianMat
      );
      wingSparL.rotation.z = 1.12;
      wingSparL.position.set(-1.12, 0.56, 0.04);
      wingPivotL.add(wingMeshL, wingSparL);

      const wingPivotR = new THREE.Group();
      wingPivotR.position.set(0.34, 0.46, -0.34);
      const wingMeshR = new THREE.Mesh(chimeraWingGeo, wyvernGlowMat);
      const wingSparR = wingSparL.clone();
      wingSparR.rotation.z = -1.12;
      wingSparR.position.x = 1.12;
      wingPivotR.add(wingMeshR, wingSparR);
      chimeraGroup.add(wingPivotL, wingPivotR);

      // Chimera Tail
      const chimeraTail = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.16, 1.65, 6)),
        emeraldArmorMat
      );
      chimeraTail.position.set(0, -0.65, -0.82);
      chimeraTail.rotation.x = -Math.PI * 0.42;
      const tailStinger = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.18, 0)),
        amberGlowMat
      );
      tailStinger.position.set(0, -0.92, -1.56);
      chimeraGroup.add(chimeraTail, tailStinger);

      // Floating Bio-Energy Dust Field
      const dustCount = 160;
      const dustPositions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 1.4 + Math.random() * 5.6;
        dustPositions[i * 3] = Math.cos(ang) * rad;
        dustPositions[i * 3 + 1] = Math.random() * 4.6;
        dustPositions[i * 3 + 2] = Math.sin(ang) * rad;
      }
      const dustGeo = trackGeo(new THREE.BufferGeometry());
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      const dustMat = trackMat(
        new THREE.PointsMaterial({
          color: 0x6ee7b7,
          size: 0.085,
          transparent: true,
          opacity: 0.78,
          depthWrite: false
        })
      );
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      scene.add(dustPoints);

      // Pre-allocated animation helpers (no per-frame heap allocs)
      const _camTarget = new THREE.Vector3();
      const _lookTarget = new THREE.Vector3();
      const _currentLook = new THREE.Vector3(0, 1.45, 0);
      const _dummy = new THREE.Object3D();

      const handleResize = () => {
        if (!renderer) return;
        const w = window.innerWidth;
        const h = Math.max(1, window.innerHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      window.addEventListener('resize', handleResize);

      let raf = 0;
      let timerId: ReturnType<typeof setTimeout> | null = null;
      let disposed = false;
      let lastFrameTime = performance.now();
      let lastPhase: 'helix' | 'fusion' | 'reveal' = 'helix';
      let lastUiPct = -1;

      const afterDraw = (nextTick: FrameRequestCallback) => {
        if (disposed) return;
        if (isSoftwareGl) {
          renderer?.getContext().finish();
          timerId = setTimeout(() => {
            if (!disposed) raf = requestAnimationFrame(nextTick);
          }, 34);
        } else {
          raf = requestAnimationFrame(nextTick);
        }
      };

      const tick = (now: number) => {
        if (disposed || !renderer) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
        lastFrameTime = now;

        // Smoothly interpolate remaining time between engine stat pushes
        const elapsedSinceSync = (now - lastSyncTimeRef.current) / 1000;
        const estRemaining = Math.max(0, remainingRef.current - elapsedSinceSync);
        const p = Math.max(0, Math.min(1, 1 - estRemaining / Math.max(0.1, totalDuration)));

        const pct = Math.round(p * 100);
        if (pct !== lastUiPct) {
          lastUiPct = pct;
          setUiProgress(pct);
        }

        const nextPhase: 'helix' | 'fusion' | 'reveal' =
          p < 0.56 ? 'helix' : p < 0.68 ? 'fusion' : 'reveal';
        if (nextPhase !== lastPhase) {
          lastPhase = nextPhase;
          setPhase(nextPhase);
        }

        // Rotate rune dais & ambient dust
        daisRunePlate.rotation.z = p * Math.PI * 1.4;
        dustPoints.rotation.y = p * 1.1;

        if (p < 0.58) {
          // PHASE 1: DNA Helix & Converging Tri-Beasts
          const hp = p / 0.58;
          const easeIn = hp * hp;

          dnaGroup.visible = true;
          dnaGroup.rotation.y = hp * Math.PI * 5.2;
          const dnaScale = 1.0 - easeIn * 0.42;
          dnaGroup.scale.set(dnaScale, 1 + easeIn * 0.18, dnaScale);

          cocoonGroup.visible = true;
          cocoonGroup.rotation.y = -hp * Math.PI * 4.5;
          shellWire.rotation.x = hp * Math.PI * 3.2;
          orbitRingA.rotation.z = hp * Math.PI * 6;
          orbitRingB.rotation.x = -hp * Math.PI * 5;
          const coreScale = 0.85 + Math.sin(hp * Math.PI * 6) * 0.14 + easeIn * 0.55;
          cocoonGroup.scale.setScalar(coreScale);

          const orbitRadius = 4.15 * (1 - easeIn * 0.92);
          const orbitSpeed = hp * Math.PI * 3.8;
          const beasts = [wolfGroup, behemothGroup, wyvernGroup];
          for (let i = 0; i < 3; i++) {
            const ang = (i * Math.PI * 2) / 3 + orbitSpeed;
            const b = beasts[i];
            b.visible = true;
            b.position.set(
              Math.cos(ang) * orbitRadius,
              1.45 + Math.sin(hp * Math.PI * 3 + i * 2) * 0.42 * (1 - easeIn * 0.6),
              Math.sin(ang) * orbitRadius
            );
            b.lookAt(0, 1.55, 0);
            const bScale = 1.05 - easeIn * 0.35;
            b.scale.setScalar(bScale);
          }

          wyvWingL.rotation.y = Math.sin(hp * 18) * 0.38;
          wyvWingR.rotation.y = -Math.sin(hp * 18) * 0.38;

          chimeraGroup.visible = false;
          shockwaveRingA.visible = false;
          shockwaveRingB.visible = false;
          shardInstanced.visible = false;

          amberCoreLight.intensity = 10 + easeIn * 22;
          emeraldRim.intensity = 16 + easeIn * 14;
        } else {
          // PHASE 2 & 3: Fusion Detonation + Apex Chimera Reveal
          const fp = Math.min(1, (p - 0.58) / 0.42);
          const burstT = Math.min(1, (p - 0.58) / 0.24);

          dnaGroup.visible = false;
          cocoonGroup.visible = false;
          wolfGroup.visible = false;
          behemothGroup.visible = false;
          wyvernGroup.visible = false;

          // Shockwave rings
          if (burstT < 1) {
            shockwaveRingA.visible = true;
            shockwaveRingB.visible = true;
            const ringScaleA = 0.6 + burstT * 7.2;
            const ringScaleB = 0.4 + burstT * 5.4;
            shockwaveRingA.scale.setScalar(ringScaleA);
            shockwaveRingB.scale.setScalar(ringScaleB);
          } else {
            shockwaveRingA.visible = false;
            shockwaveRingB.visible = false;
          }

          // Instanced radial crystal burst
          if (burstT < 1) {
            shardInstanced.visible = true;
            const shardScale = Math.max(0.05, 1.25 * (1 - burstT * 0.85));
            for (let i = 0; i < shardCount; i++) {
              const dist = burstT * shardSpeeds[i];
              _dummy.position.copy(shardDirs[i]).multiplyScalar(dist);
              _dummy.position.y += 1.55;
              _dummy.rotation.set(burstT * 6 + i, burstT * 5, i * 0.7);
              _dummy.scale.setScalar(shardScale);
              _dummy.updateMatrix();
              shardInstanced.setMatrixAt(i, _dummy.matrix);
            }
            shardInstanced.instanceMatrix.needsUpdate = true;
          } else {
            shardInstanced.visible = false;
          }

          // Hero Apex Chimera Emergence
          chimeraGroup.visible = true;
          const emergeEase = 1 - Math.pow(1 - Math.min(1, fp * 2.2), 3);
          const overshoot = fp < 0.35 ? 1 + Math.sin((fp / 0.35) * Math.PI) * 0.16 : 1;
          chimeraGroup.scale.setScalar(Math.max(0.05, emergeEase * overshoot * 1.12));
          chimeraGroup.position.y = 1.48 + Math.sin(fp * Math.PI * 2.5) * 0.14;
          chimeraGroup.rotation.y = -0.35 + fp * 0.75;

          // Wing flap & claw roar pose
          const flap = Math.sin(fp * Math.PI * 4.5) * 0.32;
          wingPivotL.rotation.y = 0.22 + flap;
          wingPivotR.rotation.y = -0.22 - flap;
          armLGroup.rotation.x = -0.45 - Math.sin(fp * Math.PI * 2) * 0.18;
          armRGroup.rotation.x = -0.45 - Math.sin(fp * Math.PI * 2) * 0.18;
          chimeraCore.rotation.y += dt * 3.5;

          amberCoreLight.intensity = Math.max(14, 48 * (1 - burstT * 0.68));
          emeraldRim.intensity = Math.max(18, 34 * (1 - burstT * 0.45));
        }

        // Dynamic 3D Camera Choreography
        if (p < 0.58) {
          const hp = p / 0.58;
          const camAngle = -0.45 + hp * 1.65;
          const camDist = 8.4 - hp * 2.6;
          _camTarget.set(Math.sin(camAngle) * camDist, 3.3 - hp * 1.0, Math.cos(camAngle) * camDist);
          _lookTarget.set(0, 1.55, 0);
        } else {
          const fp = (p - 0.58) / 0.42;
          const shakeMag = fp < 0.25 ? (1 - fp / 0.25) * 0.26 : 0;
          const shakeX = Math.sin(now * 0.08) * shakeMag;
          const shakeY = Math.cos(now * 0.11) * shakeMag;
          const camAngle = 0.42 - fp * 0.78;
          const camDist = 5.4 + Math.min(1, fp * 1.6) * 1.65;
          _camTarget.set(
            Math.sin(camAngle) * camDist + shakeX,
            1.65 + fp * 0.72 + shakeY,
            Math.cos(camAngle) * camDist
          );
          _lookTarget.set(0, 1.72, 0);
        }

        const dampFactor = 1 - Math.exp(-7.5 * dt);
        camera.position.lerp(_camTarget, dampFactor);
        _currentLook.lerp(_lookTarget, dampFactor);
        camera.lookAt(_currentLook);

        renderer.render(scene, camera);
        afterDraw(tick);
      };

      raf = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        if (raf) cancelAnimationFrame(raf);
        if (timerId !== null) clearTimeout(timerId);
        window.removeEventListener('resize', handleResize);
        for (const item of disposables) {
          item.dispose();
        }
        renderer?.dispose();
      };
    } catch {
      onFallbackRef.current?.();
      return undefined;
    }
  }, [totalDuration]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#030e0a] overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene 3D Apex Chimera"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top Cinematic Letterbox Bar (solid dark fill, no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-[#020b08]/90 border-b border-emerald-500/40 px-5 py-3.5 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-game tracking-[0.24em] uppercase text-emerald-300 truncate">
            MORPHOS · OMEGA METAMORPHOSIS 3D
          </p>
          <h2 className="font-title text-base sm:text-2xl font-black tracking-wider text-amber-300 truncate">
            APEX CHIMERA
          </h2>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <span className="inline-block px-2.5 py-1 rounded border border-emerald-400/40 bg-emerald-950/70 text-[11px] font-game tracking-wider text-emerald-200">
            {phase === 'helix' ? 'FASE I · DNA HELIX' : phase === 'fusion' ? 'FASE II · DETONASI FUSI' : 'FASE III · WUJUD APEX'}
          </span>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-[#020b08]/92 border-t border-emerald-500/40 px-5 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <p className="pointer-events-none text-[11px] sm:text-xs font-game tracking-wider text-emerald-200/90 truncate">
          {PHASE_LABELS[phase]}
        </p>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-400/60 hover:border-amber-300 text-emerald-50 font-game font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-amber-300" />
        </button>

        {/* Bottom Progress Strip */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-300 transition-[width] duration-75"
            style={{ width: `${uiProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
