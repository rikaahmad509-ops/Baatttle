import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Axiom3DSyncData } from '../game/GameEngine';

interface Axiom3DBattleLayerProps {
  getSyncData: () => Axiom3DSyncData | null;
  onWebGLUnavailable?: () => void;
}

const _ndcVec = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _tmpVec = new THREE.Vector3();
const _tmpVec2 = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _lookMat = new THREE.Matrix4();
const _tmpQuat = new THREE.Quaternion();

function projectNdcToGround(
  ndcX: number,
  ndcY: number,
  camera: THREE.PerspectiveCamera,
  out: THREE.Vector3,
  planeY: number = 0
): boolean {
  _ndcVec.set(ndcX, ndcY, 0.5).unproject(camera);
  _rayDir.copy(_ndcVec).sub(camera.position).normalize();
  if (Math.abs(_rayDir.y) < 1e-4) return false;
  const t = (planeY - camera.position.y) / _rayDir.y;
  if (t <= 0) return false;
  out.copy(camera.position).addScaledVector(_rayDir, t);
  return true;
}

export const Axiom3DBattleLayer: React.FC<Axiom3DBattleLayerProps> = ({
  getSyncData,
  onWebGLUnavailable
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const getSyncRef = useRef(getSyncData);
  const onUnavailableRef = useRef(onWebGLUnavailable);

  useEffect(() => {
    getSyncRef.current = getSyncData;
  }, [getSyncData]);

  useEffect(() => {
    onUnavailableRef.current = onWebGLUnavailable;
  }, [onWebGLUnavailable]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      onUnavailableRef.current?.();
      return;
    }

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuStr = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software Rasterizer/i.test(gpuStr);

    const width = Math.max(1, host.clientWidth || window.innerWidth);
    const height = Math.max(1, host.clientHeight || window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 160);
    camera.position.set(0, 22, 13.5);
    camera.lookAt(0, 0, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();

    const disposables: { dispose: () => void }[] = [];
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposables.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposables.push(m);
      return m;
    };

    // Lighting
    const hemi = new THREE.HemisphereLight(0xa5f3fc, 0x1e1b4b, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    keyLight.position.set(6, 18, 9);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 45;
      const d = 16;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.45);
    rimLight.position.set(-8, 12, -10);
    scene.add(rimLight);

    // Shadow catcher ground plane
    const shadowCatcherGeo = trackGeo(new THREE.PlaneGeometry(80, 60));
    const shadowCatcherMat = trackMat(new THREE.ShadowMaterial({ opacity: 0.32 }));
    const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = -0.02;
    shadowCatcher.receiveShadow = !isSoftwareGl;
    scene.add(shadowCatcher);

    // Shared Materials
    const obsidianArmorMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.88,
        roughness: 0.24
      })
    );
    const violetPlateMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x4c1d95,
        metalness: 0.72,
        roughness: 0.28,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.35
      })
    );
    const cyanCoreMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x22d3ee,
        emissiveIntensity: 2.0,
        metalness: 0.2,
        roughness: 0.15
      })
    );
    const goldSovereignMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.15,
        metalness: 0.88,
        roughness: 0.2
      })
    );
    const magentaEnergyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf0abfc,
        emissive: 0xd946ef,
        emissiveIntensity: 1.85,
        metalness: 0.3,
        roughness: 0.2
      })
    );

    // =====================================================
    // COMPOSITE 3D AXIOM HERO RIG
    // =====================================================
    const axiomGroup = new THREE.Group();
    scene.add(axiomGroup);

    // Ground contact shadow + Vector Aura Ring on floor
    const heroShadowGeo = trackGeo(new THREE.CircleGeometry(0.62, 24));
    const heroShadowMat = trackMat(
      new THREE.MeshBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.48, depthWrite: false })
    );
    const heroShadowMesh = new THREE.Mesh(heroShadowGeo, heroShadowMat);
    heroShadowMesh.rotation.x = -Math.PI / 2;
    heroShadowMesh.position.y = 0.01;
    axiomGroup.add(heroShadowMesh);

    const floorRingGeo = trackGeo(new THREE.TorusGeometry(0.92, 0.032, 10, 48));
    const floorRingMat = trackMat(
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.65 })
    );
    const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRing.rotation.x = Math.PI / 2;
    floorRing.position.y = 0.04;
    axiomGroup.add(floorRing);

    const floorInnerGeo = trackGeo(new THREE.RingGeometry(0.56, 0.64, 6));
    const floorInnerMat = trackMat(
      new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
    );
    const floorHex = new THREE.Mesh(floorInnerGeo, floorInnerMat);
    floorHex.rotation.x = -Math.PI / 2;
    floorHex.position.y = 0.035;
    axiomGroup.add(floorHex);

    // Deflection Barrier Sphere
    const deflectShieldGeo = trackGeo(new THREE.IcosahedronGeometry(0.95, 1));
    const deflectShieldMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      })
    );
    const deflectShieldMesh = new THREE.Mesh(deflectShieldGeo, deflectShieldMat);
    deflectShieldMesh.position.y = 1.15;
    axiomGroup.add(deflectShieldMesh);

    // Hovering Body Pivot (respects player facing)
    const bodyPivot = new THREE.Group();
    bodyPivot.position.y = 1.05;
    axiomGroup.add(bodyPivot);

    // Armored Mantle / Floating Cloak Fins
    const cloakGeo = trackGeo(new THREE.ConeGeometry(0.52, 1.05, 6, 1, true));
    const cloakMesh = new THREE.Mesh(cloakGeo, obsidianArmorMat);
    cloakMesh.position.y = -0.34;
    cloakMesh.castShadow = !isSoftwareGl;
    bodyPivot.add(cloakMesh);

    // Torso Armor
    const torsoGeo = trackGeo(new THREE.CylinderGeometry(0.30, 0.20, 0.68, 6));
    const torsoMesh = new THREE.Mesh(torsoGeo, violetPlateMat);
    torsoMesh.position.y = 0.14;
    torsoMesh.castShadow = !isSoftwareGl;
    bodyPivot.add(torsoMesh);

    // Chest Psionic Core Crystal
    const coreGeo = trackGeo(new THREE.OctahedronGeometry(0.18, 0));
    const coreMesh = new THREE.Mesh(coreGeo, cyanCoreMat);
    coreMesh.position.set(0, 0.20, 0.24);
    bodyPivot.add(coreMesh);

    // Head & Geometric Mask + 3-Pronged Sovereign Crown
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.70;
    bodyPivot.add(headGroup);

    const headGeo = trackGeo(new THREE.DodecahedronGeometry(0.24, 0));
    const headMesh = new THREE.Mesh(headGeo, obsidianArmorMat);
    headMesh.castShadow = !isSoftwareGl;
    headGroup.add(headMesh);

    const visorGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.075, 0.16));
    const visorMesh = new THREE.Mesh(visorGeo, cyanCoreMat);
    visorMesh.position.set(0, 0.02, 0.16);
    headGroup.add(visorMesh);

    const crownGroup = new THREE.Group();
    crownGroup.position.y = 0.26;
    headGroup.add(crownGroup);
    const prongGeo = trackGeo(new THREE.ConeGeometry(0.055, 0.30, 4));
    for (let i = -1; i <= 1; i++) {
      const prong = new THREE.Mesh(prongGeo, i === 0 ? cyanCoreMat : goldSovereignMat);
      prong.position.set(i * 0.16, i === 0 ? 0.09 : 0.02, 0);
      prong.rotation.z = -i * 0.32;
      crownGroup.add(prong);
    }

    // Floating Armored Arms + Palms (Left & Right)
    const pauldronGeo = trackGeo(new THREE.OctahedronGeometry(0.16, 0));
    const armGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.40, 0.14));
    const palmOrbGeo = trackGeo(new THREE.OctahedronGeometry(0.11, 0));

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.46, 0.26, 0.06);
    bodyPivot.add(leftArmGroup);
    const leftPauldron = new THREE.Mesh(pauldronGeo, violetPlateMat);
    leftArmGroup.add(leftPauldron);
    const leftGauntlet = new THREE.Mesh(armGeo, obsidianArmorMat);
    leftGauntlet.position.set(-0.04, -0.24, 0.12);
    leftGauntlet.rotation.x = -0.65;
    leftArmGroup.add(leftGauntlet);
    const leftOrb = new THREE.Mesh(palmOrbGeo, cyanCoreMat);
    leftOrb.position.set(-0.04, -0.36, 0.34);
    leftArmGroup.add(leftOrb);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.46, 0.26, 0.06);
    bodyPivot.add(rightArmGroup);
    const rightPauldron = new THREE.Mesh(pauldronGeo, violetPlateMat);
    rightArmGroup.add(rightPauldron);
    const rightGauntlet = new THREE.Mesh(armGeo, obsidianArmorMat);
    rightGauntlet.position.set(0.04, -0.24, 0.12);
    rightGauntlet.rotation.x = -0.65;
    rightArmGroup.add(rightGauntlet);
    const rightOrb = new THREE.Mesh(palmOrbGeo, cyanCoreMat);
    rightOrb.position.set(0.04, -0.36, 0.34);
    rightArmGroup.add(rightOrb);

    // Counter-Rotating 3-Axis Vector Gyroscope Rings behind Axiom
    const gyroGroup = new THREE.Group();
    gyroGroup.position.set(0, 0.35, -0.22);
    bodyPivot.add(gyroGroup);

    const gyro1Geo = trackGeo(new THREE.TorusGeometry(0.72, 0.025, 8, 40));
    const gyro1Mesh = new THREE.Mesh(gyro1Geo, cyanCoreMat);
    gyroGroup.add(gyro1Mesh);

    const gyro2Geo = trackGeo(new THREE.TorusGeometry(0.56, 0.022, 8, 36));
    const gyro2Mesh = new THREE.Mesh(gyro2Geo, magentaEnergyMat);
    gyroGroup.add(gyro2Mesh);

    // 6 Orbiting Monolith Blades around Axiom
    const bladeGeo = trackGeo(new THREE.OctahedronGeometry(0.14, 0));
    bladeGeo.scale(0.55, 2.2, 0.35);
    const orbitBlades: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(bladeGeo, i % 2 === 0 ? cyanCoreMat : violetPlateMat);
      orbitBlades.push(m);
      bodyPivot.add(m);
    }

    // 4 Dominion Sovereign Wing Cannons (visible during dominionTimer > 0)
    const wingCannonGroup = new THREE.Group();
    wingCannonGroup.position.set(0, 0.42, -0.32);
    wingCannonGroup.visible = false;
    bodyPivot.add(wingCannonGroup);
    const cannonGeo = trackGeo(new THREE.ConeGeometry(0.11, 0.85, 5));
    cannonGeo.rotateX(Math.PI / 2);
    for (let w = 0; w < 4; w++) {
      const side = w < 2 ? -1 : 1;
      const tier = w % 2;
      const cannon = new THREE.Mesh(cannonGeo, goldSovereignMat);
      cannon.position.set(side * (0.65 + tier * 0.28), 0.38 - tier * 0.34, -0.1);
      wingCannonGroup.add(cannon);
    }

    // =====================================================
    // POOLED 3D PROJECTILES
    // =====================================================
    const MAX_PROJ = 64;
    const prismProjGeo = trackGeo(new THREE.OctahedronGeometry(0.24, 0));
    prismProjGeo.scale(0.6, 0.6, 2.1);
    const bladeProjGeo = trackGeo(new THREE.BoxGeometry(0.56, 0.07, 0.62));
    const rayProjGeo = trackGeo(new THREE.ConeGeometry(0.17, 1.05, 5));
    rayProjGeo.rotateX(Math.PI / 2);

    const prismProjMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.2,
        metalness: 0.4,
        roughness: 0.15
      })
    );
    const bladeProjMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x9333ea,
        emissiveIntensity: 1.9,
        metalness: 0.7,
        roughness: 0.18
      })
    );
    const hijackedProjMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        emissive: 0xec4899,
        emissiveIntensity: 2.3,
        metalness: 0.5,
        roughness: 0.15
      })
    );
    const rayProjMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xa855f7,
        emissiveIntensity: 2.4,
        metalness: 0.6,
        roughness: 0.12
      })
    );

    const projPool: THREE.Mesh[] = [];
    for (let i = 0; i < MAX_PROJ; i++) {
      const m = new THREE.Mesh(prismProjGeo, prismProjMat);
      m.visible = false;
      scene.add(m);
      projPool.push(m);
    }

    // =====================================================
    // POOLED 3D MIND-CONTROL CROWNS + PSIONIC TETHERS
    // =====================================================
    const MAX_DOM = 14;
    const domRingGeo = trackGeo(new THREE.TorusGeometry(0.42, 0.04, 8, 24));
    const domCrownGeo = trackGeo(new THREE.OctahedronGeometry(0.16, 0));
    const tetherNodeGeo = trackGeo(new THREE.OctahedronGeometry(0.075, 0));

    interface DomPoolSlot {
      group: THREE.Group;
      ring: THREE.Mesh;
      crystal: THREE.Mesh;
      tetherNodes: THREE.Mesh[];
    }
    const domPool: DomPoolSlot[] = [];
    for (let i = 0; i < MAX_DOM; i++) {
      const g = new THREE.Group();
      g.visible = false;
      const ring = new THREE.Mesh(domRingGeo, magentaEnergyMat);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      const crystal = new THREE.Mesh(domCrownGeo, cyanCoreMat);
      crystal.position.y = 0.25;
      g.add(crystal);
      scene.add(g);

      const tetherNodes: THREE.Mesh[] = [];
      for (let k = 0; k < 8; k++) {
        const tn = new THREE.Mesh(tetherNodeGeo, k % 2 === 0 ? magentaEnergyMat : cyanCoreMat);
        tn.visible = false;
        scene.add(tn);
        tetherNodes.push(tn);
      }
      domPool.push({ group: g, ring, crystal, tetherNodes });
    }

    // =====================================================
    // POOLED 3D TESSERACT CUBE PRISONS
    // =====================================================
    const MAX_CUBES = 3;
    const unitBoxGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
    const unitBoxEdgesGeo = new THREE.EdgesGeometry(unitBoxGeo);
    disposables.push(unitBoxEdgesGeo);
    const cubeEdgeMat = trackMat(
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.92 })
    );
    const cubeGlassMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x7e22ce,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: 0.16,
        roughness: 0.15,
        metalness: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    const cubeInnerOctGeo = trackGeo(new THREE.OctahedronGeometry(0.32, 0));
    const cubePillarGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 1, 8));

    interface CubePoolSlot {
      group: THREE.Group;
      outerWire: THREE.LineSegments;
      innerGlass: THREE.Mesh;
      innerCore: THREE.Mesh;
      pillars: THREE.Mesh[];
    }
    const cubePool: CubePoolSlot[] = [];
    for (let i = 0; i < MAX_CUBES; i++) {
      const g = new THREE.Group();
      g.visible = false;
      const outerWire = new THREE.LineSegments(unitBoxEdgesGeo, cubeEdgeMat);
      g.add(outerWire);
      const innerGlass = new THREE.Mesh(unitBoxGeo, cubeGlassMat);
      g.add(innerGlass);
      const innerCore = new THREE.Mesh(cubeInnerOctGeo, cyanCoreMat);
      g.add(innerCore);
      const pillars: THREE.Mesh[] = [];
      for (let p = 0; p < 4; p++) {
        const pil = new THREE.Mesh(cubePillarGeo, magentaEnergyMat);
        g.add(pil);
        pillars.push(pil);
      }
      scene.add(g);
      cubePool.push({ group: g, outerWire, innerGlass, innerCore, pillars });
    }

    // =====================================================
    // POOLED 3D SKILL FX BURSTS
    // =====================================================
    const MAX_FX = 12;
    const fxRingGeo = trackGeo(new THREE.TorusGeometry(1, 0.06, 8, 36));
    const fxMonolithGeo = trackGeo(new THREE.ConeGeometry(0.6, 3.0, 4));
    fxMonolithGeo.rotateX(Math.PI);

    interface FxPoolSlot {
      group: THREE.Group;
      ring: THREE.Mesh;
      ringMat: THREE.MeshBasicMaterial;
      monolith: THREE.Mesh;
      monoMat: THREE.MeshStandardMaterial;
    }
    const fxPool: FxPoolSlot[] = [];
    for (let i = 0; i < MAX_FX; i++) {
      const g = new THREE.Group();
      g.visible = false;
      const ringMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 }));
      const ring = new THREE.Mesh(fxRingGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);

      const monoMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x22d3ee,
          emissiveIntensity: 1.4,
          transparent: true,
          opacity: 0.92,
          metalness: 0.75,
          roughness: 0.2
        })
      );
      const monolith = new THREE.Mesh(fxMonolithGeo, monoMat);
      g.add(monolith);
      scene.add(g);
      fxPool.push({ group: g, ring, ringMat, monolith, monoMat });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      if (!host) return;
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    const handleContextLost = (ev: Event) => {
      ev.preventDefault();
      onUnavailableRef.current?.();
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    let rafId = 0;
    let alive = true;
    let elapsed = 0;
    let prevNow = performance.now();

    const tick = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - prevNow) / 1000));
      prevNow = now;
      elapsed += dt;

      const sync = getSyncRef.current();
      if (sync) {
        // 1. Hero Position & Animation
        if (projectNdcToGround(sync.playerNdc.x, sync.playerNdc.y, camera, _tmpVec, 0)) {
          axiomGroup.visible = true;
          axiomGroup.position.copy(_tmpVec);
        } else {
          axiomGroup.visible = false;
        }

        const isDominion = sync.dominionTimer > 0;
        const bobY = Math.sin(elapsed * 3.8) * 0.12 + (isDominion ? 0.22 : 0);
        bodyPivot.position.y = 1.05 + bobY;

        // Engine facing = atan2(dy, dx) in 2D canvas (+X right, +Y down); map to Three.js XZ (+X right, +Z down)
        const targetYaw = Math.PI / 2 - sync.facing;
        bodyPivot.rotation.y = targetYaw;

        // Arm animation based on attack flash & skill pose
        const atkSwing = sync.atkFlash * 0.65;
        let poseLift = 0;
        let poseSpread = 0;
        if (sync.skillPose === 'slam') {
          poseLift = Math.sin(sync.skillPoseProgress * Math.PI) * 1.1;
        } else if (sync.skillPose === 'betrayal' || sync.skillPose === 'dominion') {
          poseSpread = Math.sin(sync.skillPoseProgress * Math.PI) * 0.85;
          poseLift = poseSpread * 0.7;
        } else if (sync.skillPose === 'cube') {
          poseSpread = 0.55;
        }
        leftArmGroup.rotation.x = -atkSwing - poseLift;
        leftArmGroup.rotation.z = poseSpread;
        rightArmGroup.rotation.x = -atkSwing * 1.15 - poseLift;
        rightArmGroup.rotation.z = -poseSpread;

        // Gyro rings & orbiting blades
        const gyroSpeed = isDominion ? 3.2 : 1.5;
        gyro1Mesh.rotation.z = elapsed * gyroSpeed;
        gyro1Mesh.rotation.x = Math.sin(elapsed * 1.1) * 0.35;
        gyro2Mesh.rotation.z = -elapsed * gyroSpeed * 1.4;
        gyro2Mesh.rotation.y = Math.cos(elapsed * 0.9) * 0.45;

        floorRing.rotation.z = elapsed * 1.2;
        floorHex.rotation.z = -elapsed * 0.9;
        floorRingMat.color.setHex(isDominion ? 0xfde047 : 0x22d3ee);

        deflectShieldMesh.visible = sync.deflectReady;
        if (sync.deflectReady) {
          deflectShieldMesh.rotation.y = elapsed * 1.4;
          deflectShieldMesh.rotation.x = elapsed * 0.7;
        }

        wingCannonGroup.visible = isDominion;
        crownGroup.scale.setScalar(isDominion ? 1.35 : 1.0);

        const activeBlades = Math.max(3, Math.min(6, 2 + Math.ceil((sync.stacks / Math.max(1, sync.maxStacks)) * 4)));
        for (let b = 0; b < orbitBlades.length; b++) {
          const blade = orbitBlades[b];
          blade.visible = b < activeBlades || isDominion;
          if (blade.visible) {
            const ang = elapsed * (isDominion ? 3.5 : 2.1) + (b * Math.PI * 2) / orbitBlades.length;
            const r = isDominion ? 1.18 : 0.95;
            blade.position.set(Math.cos(ang) * r, 0.25 + Math.sin(elapsed * 4 + b) * 0.14, Math.sin(ang) * r);
            blade.rotation.y = -ang;
            blade.rotation.z = elapsed * 3.0;
          }
        }

        // 2. Pooled 3D Projectiles
        for (let i = 0; i < MAX_PROJ; i++) {
          const mesh = projPool[i];
          if (i < sync.projectiles.length) {
            const p = sync.projectiles[i];
            if (projectNdcToGround(p.ndcX, p.ndcY, camera, _tmpVec, 0.85)) {
              mesh.visible = true;
              mesh.position.copy(_tmpVec);

              if (p.variant === 'blade') {
                if (mesh.geometry !== bladeProjGeo) mesh.geometry = bladeProjGeo;
                if (mesh.material !== bladeProjMat) mesh.material = bladeProjMat;
                mesh.rotation.set(0, elapsed * 16 + i, 0);
                mesh.scale.setScalar(p.isCrit ? 1.25 : 1.0);
              } else if (p.variant === 'hijacked') {
                if (mesh.geometry !== prismProjGeo) mesh.geometry = prismProjGeo;
                if (mesh.material !== hijackedProjMat) mesh.material = hijackedProjMat;
                const yaw = Math.atan2(p.vx, p.vy);
                mesh.rotation.set(0, yaw, elapsed * 10);
                mesh.scale.setScalar(1.18);
              } else if (p.variant === 'sovereign_ray') {
                if (mesh.geometry !== rayProjGeo) mesh.geometry = rayProjGeo;
                if (mesh.material !== rayProjMat) mesh.material = rayProjMat;
                const yaw = Math.atan2(p.vx, p.vy);
                mesh.rotation.set(0, yaw, 0);
                mesh.scale.setScalar(1.15);
              } else {
                if (mesh.geometry !== prismProjGeo) mesh.geometry = prismProjGeo;
                if (mesh.material !== prismProjMat) mesh.material = prismProjMat;
                const yaw = Math.atan2(p.vx, p.vy);
                mesh.rotation.set(0, yaw, elapsed * 8);
                mesh.scale.setScalar(p.isCrit ? 1.28 : 1.0);
              }
            } else {
              mesh.visible = false;
            }
          } else {
            mesh.visible = false;
          }
        }

        // 3. Mind-Controlled Enemy Crowns & Psionic Tethers
        for (let i = 0; i < MAX_DOM; i++) {
          const slot = domPool[i];
          if (i < sync.dominatedEnemies.length && axiomGroup.visible) {
            const dom = sync.dominatedEnemies[i];
            if (projectNdcToGround(dom.ndcX, dom.ndcY, camera, _tmpVec2, 1.35)) {
              slot.group.visible = true;
              slot.group.position.copy(_tmpVec2);
              slot.ring.rotation.z = elapsed * 4.5 + i;
              slot.crystal.rotation.y = -elapsed * 5.0;
              slot.crystal.position.y = 0.25 + Math.sin(elapsed * 6 + i) * 0.08;

              // Tether arc from Axiom hands to controlled enemy crown
              const startPos = axiomGroup.position;
              for (let k = 0; k < slot.tetherNodes.length; k++) {
                const tn = slot.tetherNodes[k];
                tn.visible = true;
                const frac = (k + 1) / (slot.tetherNodes.length + 1);
                tn.position.lerpVectors(startPos, _tmpVec2, frac);
                tn.position.y += 1.2 + Math.sin(frac * Math.PI) * 1.1;
                tn.rotation.y = elapsed * 6 + k;
              }
            } else {
              slot.group.visible = false;
              for (const tn of slot.tetherNodes) tn.visible = false;
            }
          } else {
            slot.group.visible = false;
            for (const tn of slot.tetherNodes) tn.visible = false;
          }
        }

        // 4. 3D Tesseract Cube Prisons
        for (let i = 0; i < MAX_CUBES; i++) {
          const slot = cubePool[i];
          if (i < sync.cubeZones.length) {
            const cz = sync.cubeZones[i];
            if (projectNdcToGround(cz.ndcX, cz.ndcY, camera, _tmpVec, 0)) {
              slot.group.visible = true;
              slot.group.position.copy(_tmpVec);
              // Approximate world width from normalized radius
              projectNdcToGround(cz.ndcX + cz.radiusNormX, cz.ndcY, camera, _tmpVec2, 0);
              const worldRad = Math.max(1.8, _tmpVec.distanceTo(_tmpVec2));
              const size = worldRad * 1.38;
              slot.group.position.y = size * 0.42;

              slot.outerWire.scale.set(size, size * 0.85, size);
              slot.outerWire.rotation.y = cz.pulseAngle * 0.35;
              slot.innerGlass.scale.set(size * 0.92, size * 0.78, size * 0.92);
              slot.innerGlass.rotation.y = -cz.pulseAngle * 0.45;
              slot.innerCore.scale.setScalar(size * 0.45);
              slot.innerCore.rotation.set(elapsed * 2, elapsed * 3, 0);

              const corner = size * 0.48;
              for (let p = 0; p < 4; p++) {
                const cx = p < 2 ? -corner : corner;
                const czOff = p % 2 === 0 ? -corner : corner;
                slot.pillars[p].position.set(cx, 0, czOff);
                slot.pillars[p].scale.set(1, size * 0.9, 1);
              }
            } else {
              slot.group.visible = false;
            }
          } else {
            slot.group.visible = false;
          }
        }

        // 5. 3D Skill FX Events
        for (let i = 0; i < MAX_FX; i++) {
          const slot = fxPool[i];
          if (i < sync.fxEvents.length) {
            const fx = sync.fxEvents[i];
            if (projectNdcToGround(fx.ndcX, fx.ndcY, camera, _tmpVec, 0.08)) {
              const p = Math.max(0, Math.min(1, fx.age / Math.max(0.05, fx.maxAge)));
              slot.group.visible = true;
              slot.group.position.copy(_tmpVec);

              projectNdcToGround(fx.ndcX + fx.radiusNorm, fx.ndcY, camera, _tmpVec2, 0.08);
              const targetR = Math.max(1.2, _tmpVec.distanceTo(_tmpVec2));
              const ringScale = 0.25 + targetR * Math.pow(p, 0.65);
              slot.ring.scale.setScalar(ringScale);
              slot.ringMat.opacity = Math.max(0, 1 - p);

              if (fx.type === 'slam' || fx.type === 'dominion') {
                slot.ringMat.color.setHex(fx.type === 'dominion' ? 0xfde047 : 0x22d3ee);
                slot.monolith.visible = true;
                const dropT = Math.min(1, p * 2.8);
                slot.monolith.position.y = (1 - dropT) * 7.5 + 1.4;
                slot.monolith.rotation.y = elapsed * 4;
                slot.monoMat.opacity = Math.max(0, 1 - Math.max(0, (p - 0.55) / 0.45));
                slot.monolith.scale.setScalar(fx.type === 'dominion' ? 1.55 : 1.0);
              } else {
                slot.ringMat.color.setHex(fx.type === 'betrayal' ? 0xe879f9 : 0x22d3ee);
                slot.monolith.visible = false;
              }
            } else {
              slot.group.visible = false;
            }
          } else {
            slot.group.visible = false;
          }
        }
      }

      renderer.render(scene, camera);

      const scheduleNext = () => {
        if (alive) {
          rafId = requestAnimationFrame(tick);
        }
      };
      if (isSoftwareGl && typeof gl.finish === 'function') {
        gl.finish();
      }
      scheduleNext();
    };

    // Unused helper variables check silence: keep clean matrix helper referenced
    void _upAxis;
    void _lookMat;
    void _tmpQuat;

    rafId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      for (const d of disposables) {
        d.dispose();
      }
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (canvas.parentElement === host) {
        host.removeChild(canvas);
      }
    };
  }, []);

  return <div ref={hostRef} className="fixed inset-0 z-[15] pointer-events-none" />;
};
