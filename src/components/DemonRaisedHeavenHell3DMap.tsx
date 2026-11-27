import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  computeHeavenHellHeight,
  create3DAngelRig,
  create3DDemonRig,
  createHeavenMarbleTexture,
  createHellLavaTexture,
  Summon3DRig
} from '../game/demonRaisedHeavenHellWorld';

export interface DemonRaised3DMinionSync {
  id: number;
  kind: 'angel' | 'demon';
  ndcX: number;
  ndcY: number;
  hpRatio: number;
  modLevel: number;
  attackFlash: number;
  facing: number;
}

export interface DemonRaised3DSyncData {
  playerNorm: { x: number; y: number } | null;
  playerNdc: { x: number; y: number } | null;
  minions: DemonRaised3DMinionSync[];
}

interface DemonRaisedHeavenHell3DMapProps {
  domainRemaining: number;
  getArenaSyncData?: () => DemonRaised3DSyncData | null;
  onWebGLUnavailable?: () => void;
}

const _tmpColor = new THREE.Color();
const _heroLightTarget = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 0.2, 0.6);
const _ndcVec = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _targetWorldPos = new THREE.Vector3();

function projectNdcToGround(
  ndcX: number,
  ndcY: number,
  planeY: number,
  camera: THREE.PerspectiveCamera,
  out: THREE.Vector3
) {
  _ndcVec.set(ndcX, ndcY, 0.5).unproject(camera);
  _rayDir.copy(_ndcVec).sub(camera.position).normalize();
  if (Math.abs(_rayDir.y) > 0.001) {
    const t = (planeY - camera.position.y) / _rayDir.y;
    out.set(camera.position.x + _rayDir.x * t, 0, camera.position.z + _rayDir.z * t);
  }
}

export const DemonRaisedHeavenHell3DMap: React.FC<DemonRaisedHeavenHell3DMapProps> = ({
  domainRemaining,
  getArenaSyncData,
  onWebGLUnavailable
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const remRef = useRef<number>(domainRemaining);
  const lastSyncRef = useRef<number>(performance.now());
  const getSyncRef = useRef(getArenaSyncData);
  const onFallbackRef = useRef(onWebGLUnavailable);

  getSyncRef.current = getArenaSyncData;
  onFallbackRef.current = onWebGLUnavailable;

  useEffect(() => {
    remRef.current = domainRemaining;
    lastSyncRef.current = performance.now();
  }, [domainRemaining]);

  useEffect(() => {
    const mountEl = containerRef.current;
    if (!mountEl) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'block w-full h-full';
    mountEl.appendChild(canvas);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const testGl =
        canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' }) ||
        canvas.getContext('webgl', { antialias: true, powerPreference: 'high-performance' });
      if (!testGl) {
        onFallbackRef.current?.();
        return () => {
          canvas.remove();
        };
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
      renderer.toneMappingExposure = 1.02;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setSize(window.innerWidth, Math.max(1, window.innerHeight), false);

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
      scene.background = new THREE.Color(0x090612);
      scene.fog = new THREE.FogExp2(0x090612, 0.014);

      const camera = new THREE.PerspectiveCamera(
        44,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.5,
        150
      );
      camera.position.set(0, 26.2, 11.4);
      _currentLook.set(0, 0.2, 0.6);
      camera.lookAt(_currentLook);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      disposables.push(envRT, roomEnv, pmrem);

      // Lighting Rig: Split Warm Heaven Gold & Crimson Hell Glow + Dynamic Hero Light
      const hemiLight = new THREE.HemisphereLight(0xfef08a, 0x7f1d1d, 0.85);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
      sunLight.position.set(-12, 26, 14);
      if (!isSoftwareGl) {
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.set(1024, 1024);
        sunLight.shadow.camera.near = 2;
        sunLight.shadow.camera.far = 70;
        sunLight.shadow.camera.left = -24;
        sunLight.shadow.camera.right = 24;
        sunLight.shadow.camera.top = 24;
        sunLight.shadow.camera.bottom = -24;
        sunLight.shadow.bias = -0.0005;
        sunLight.shadow.normalBias = 0.02;
      }
      scene.add(sunLight);

      const heavenAccent = new THREE.PointLight(0xfde047, 10, 26, 1.35);
      heavenAccent.position.set(-9.5, 4.0, 0);
      scene.add(heavenAccent);

      const hellAccent = new THREE.PointLight(0xf43f5e, 12, 26, 1.35);
      hellAccent.position.set(9.5, 3.6, 2.0);
      scene.add(hellAccent);

      const heroAuraLight = new THREE.PointLight(0xfde047, 7.0, 16, 1.4);
      heroAuraLight.position.set(0, 2.1, 0);
      scene.add(heroAuraLight);

      const marbleTex = createHeavenMarbleTexture(renderer);
      const lavaTex = createHellLavaTexture(renderer);
      disposables.push(marbleTex, lavaTex);

      // 1. Sculpted 3D Heaven & Hell Split Battle Terrain
      const terrainSize = 58;
      const terrainSegs = 88;
      const terrainGeo = trackGeo(
        new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs)
      );
      terrainGeo.rotateX(-Math.PI / 2);

      const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
      const vertCount = posAttr.count;
      const splitColors = new Float32Array(vertCount * 3);

      const cMarble = new THREE.Color(0xdbeafe);
      const cGoldStone = new THREE.Color(0xfef08a);
      const cObsidian = new THREE.Color(0x1f1419);
      const cCharred = new THREE.Color(0x3b1219);
      const cMagma = new THREE.Color(0xdc2626);
      const cSeam = new THREE.Color(0x282144);

      for (let i = 0; i < vertCount; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const h = computeHeavenHellHeight(vx, vz);
        posAttr.setY(i, h);

        if (vx < -1.2) {
          const blend = THREE.MathUtils.clamp((-vx - 1.2) / 10, 0, 1);
          _tmpColor.copy(cSeam).lerp(cMarble, blend);
          if (h > 1.2) _tmpColor.lerp(cGoldStone, 0.32);
        } else if (vx > 1.2) {
          const blend = THREE.MathUtils.clamp((vx - 1.2) / 10, 0, 1);
          _tmpColor.copy(cSeam).lerp(cObsidian, blend);
          if (h < -0.5) _tmpColor.lerp(cMagma, 0.72);
          else if (h > 1.2) _tmpColor.lerp(cCharred, 0.65);
        } else {
          _tmpColor.copy(cSeam);
        }

        splitColors[i * 3] = _tmpColor.r;
        splitColors[i * 3 + 1] = _tmpColor.g;
        splitColors[i * 3 + 2] = _tmpColor.b;
      }
      posAttr.needsUpdate = true;
      terrainGeo.computeVertexNormals();
      terrainGeo.setAttribute('color', new THREE.BufferAttribute(splitColors, 3));

      const terrainUniforms = {
        uTime: { value: 0 },
        uHeroXZ: { value: new THREE.Vector2(0, 0) }
      };

      const terrainMat = trackMat(
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.74,
          metalness: 0.14
        })
      );
      terrainMat.customProgramCacheKey = () => 'demon-raised-hh-map-v1';
      terrainMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = terrainUniforms.uTime;
        shader.uniforms.uHeroXZ = terrainUniforms.uHeroXZ;

        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
            varying vec3 vTerrainPos;`
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            vTerrainPos = transformed;`
          );

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
            uniform float uTime;
            uniform vec2 uHeroXZ;
            varying vec3 vTerrainPos;

            float hhMapHash(vec2 p) {
              p = fract(p * vec2(123.34, 456.21));
              p += dot(p, p + 45.32);
              return fract(p.x * p.y);
            }
            float hhMapNoise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hhMapHash(i), hhMapHash(i + vec2(1.0, 0.0)), f.x),
                mix(hhMapHash(i + vec2(0.0, 1.0)), hhMapHash(i + vec2(1.0, 1.0)), f.x),
                f.y
              );
            }`
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            float seamMask = exp(-pow(vTerrainPos.x / 0.42, 2.0));
            float hellSide = smoothstep(-1.2, 1.2, vTerrainPos.x);
            float lavaCrack = smoothstep(0.68, 0.94, hhMapNoise(vTerrainPos.xz * 1.4 + vec2(uTime * 0.12))) * hellSide;

            vec3 mapCol = mix(diffuseColor.rgb, vec3(0.95, 0.25, 0.08), lavaCrack * 0.55);

            // Soft combat-readability darkening across center clearing so 2D projectiles & 3D summons pop
            float centerDim = smoothstep(14.5, 2.5, length(vTerrainPos.xz));
            mapCol *= mix(0.92, 0.58, centerDim);

            // Hero duality aura ring
            float heroDist = length(vTerrainPos.xz - uHeroXZ);
            float heroRing = exp(-pow((heroDist - 1.85) / 0.2, 2.0));
            vec3 heroRingTint = mix(vec3(0.98, 0.85, 0.28), vec3(0.95, 0.2, 0.42), smoothstep(-0.3, 0.3, vTerrainPos.x - uHeroXZ.x));
            diffuseColor.rgb = mix(mapCol, heroRingTint, heroRing * 0.36);`
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            float seamGlow = seamMask * (0.38 + 0.18 * sin(uTime * 3.5 + vTerrainPos.z * 0.45));
            vec3 seamTint = mix(vec3(0.98, 0.85, 0.25), vec3(0.92, 0.16, 0.38), smoothstep(-0.32, 0.32, vTerrainPos.x));
            totalEmissiveRadiance += seamTint * seamGlow + vec3(1.0, 0.32, 0.08) * lavaCrack * 0.55 + heroRingTint * heroRing * 0.4;`
          );
      };

      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = !isSoftwareGl;
      scene.add(terrainMesh);

      // 2. Central Split Duality Altar & Flank Architectural Props
      const heavenMarbleMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: marbleTex,
          color: 0xfef9c3,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.16,
          roughness: 0.28,
          metalness: 0.22
        })
      );
      const hellObsidianMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x1c1016,
          emissive: 0x450a0a,
          emissiveIntensity: 0.28,
          roughness: 0.48,
          metalness: 0.55
        })
      );
      const goldMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xd97706,
          emissiveIntensity: 0.65,
          roughness: 0.22,
          metalness: 0.86
        })
      );
      const crimsonGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfb7185,
          emissive: 0xe11d48,
          emissiveIntensity: 1.15,
          roughness: 0.2,
          metalness: 0.45
        })
      );
      const azureGlowMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          emissive: 0x38bdf8,
          emissiveIntensity: 1.15,
          roughness: 0.2,
          metalness: 0.4
        })
      );

      const dais = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.6, 3.05, 0.22, 16)), hellObsidianMat);
      dais.position.y = 0.08;
      scene.add(dais);

      const leftArcRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(2.85, 0.045, 10, 32, Math.PI)),
        goldMat
      );
      leftArcRing.rotation.x = Math.PI / 2;
      leftArcRing.rotation.z = Math.PI / 2;
      leftArcRing.position.y = 0.06;
      scene.add(leftArcRing);

      const rightArcRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(2.85, 0.045, 10, 32, Math.PI)),
        crimsonGlowMat
      );
      rightArcRing.rotation.x = Math.PI / 2;
      rightArcRing.rotation.z = -Math.PI / 2;
      rightArcRing.position.y = 0.06;
      scene.add(rightArcRing);

      // Left Flank: Celestial Marble Pillars & Floating Crystals
      const heavenCrystals: THREE.Mesh[] = [];
      for (let i = 0; i < 8; i++) {
        const ang = Math.PI * 0.65 + (i / 7) * Math.PI * 0.7;
        const dist = 9.2 + (i % 3) * 3.4;
        const px = Math.cos(ang) * dist;
        const pz = Math.sin(ang) * dist;
        const baseGroundY = computeHeavenHellHeight(px, pz) - 0.35;
        const colH = 3.0 + (i % 3) * 1.3;

        const colGroup = new THREE.Group();
        colGroup.position.set(px, baseGroundY, pz);

        const shaft = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.4, 0.54, colH, 8)),
          heavenMarbleMat
        );
        shaft.position.y = colH * 0.5;
        shaft.castShadow = !isSoftwareGl;
        colGroup.add(shaft);

        const capRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.68, 0.055, 8, 24)), goldMat);
        capRing.rotation.x = Math.PI / 2;
        capRing.position.y = colH + 0.25;
        colGroup.add(capRing);

        const crystal = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.38, 0)), azureGlowMat);
        crystal.position.y = colH + 0.9;
        crystal.scale.set(0.75, 1.45, 0.75);
        colGroup.add(crystal);
        heavenCrystals.push(crystal);

        scene.add(colGroup);
      }

      // Heaven Radiant Pool (-x, +z)
      const heavenPoolMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: marbleTex,
          color: 0xbae6fd,
          emissive: 0x0284c7,
          emissiveIntensity: 0.36,
          roughness: 0.14,
          metalness: 0.35,
          transparent: true,
          opacity: 0.76
        })
      );
      const heavenPool = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(5.4, 36)), heavenPoolMat);
      heavenPool.rotation.x = -Math.PI / 2;
      heavenPool.position.set(-7.6, -0.18, 4.8);
      scene.add(heavenPool);

      // Right Flank: Jagged Obsidian Volcanic Spires & Molten Lava Pool
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI * 0.38 + (i / 9) * Math.PI * 0.76;
        const dist = 9.4 + (i % 3) * 3.6;
        const sx = Math.cos(ang) * dist;
        const sz = Math.sin(ang) * dist;
        const baseGroundY = computeHeavenHellHeight(sx, sz) - 0.45;
        const spireH = 3.6 + (i % 4) * 1.5;

        const spGroup = new THREE.Group();
        spGroup.position.set(sx, baseGroundY, sz);
        spGroup.rotation.y = i * 0.7;

        const mainCrag = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.4, spireH, 6)), hellObsidianMat);
        mainCrag.position.y = spireH * 0.5;
        mainCrag.castShadow = !isSoftwareGl;
        spGroup.add(mainCrag);

        const magmaVein = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.42, 0)), crimsonGlowMat);
        magmaVein.scale.set(0.45, 2.3, 0.45);
        magmaVein.position.set(0, spireH * 0.45, 0.68);
        magmaVein.rotation.x = 0.28;
        spGroup.add(magmaVein);

        scene.add(spGroup);
      }

      const lavaPoolMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: lavaTex,
          color: 0xf97316,
          emissive: 0xdc2626,
          emissiveIntensity: 0.7,
          roughness: 0.25,
          metalness: 0.15,
          transparent: true,
          opacity: 0.9
        })
      );
      const lavaPool = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(5.6, 36)), lavaPoolMat);
      lavaPool.rotation.x = -Math.PI / 2;
      lavaPool.position.set(7.4, -0.34, 4.8);
      lavaPool.scale.set(1.05, 1, 0.85);
      scene.add(lavaPool);

      // 3. Pre-allocated Pool of 3D Summoned Troops (6 Angels + 6 Demons -> Zero runtime GC)
      interface PoolSlot {
        rig: Summon3DRig;
        assignedId: number | null;
        spawnAge: number;
      }
      const angelPool: PoolSlot[] = [];
      const demonPool: PoolSlot[] = [];
      for (let i = 0; i < 6; i++) {
        const aRig = create3DAngelRig(trackGeo, trackMat);
        aRig.root.visible = false;
        scene.add(aRig.root);
        angelPool.push({ rig: aRig, assignedId: null, spawnAge: 0 });

        const dRig = create3DDemonRig(trackGeo, trackMat);
        dRig.root.visible = false;
        scene.add(dRig.root);
        demonPool.push({ rig: dRig, assignedId: null, spawnAge: 0 });
      }

      // 4. Split Heaven Motes & Hell Embers (240 Points)
      const moteCount = 240;
      const motePos = new Float32Array(moteCount * 3);
      const moteCol = new Float32Array(moteCount * 3);
      const moteSeeds = new Float32Array(moteCount);
      for (let i = 0; i < moteCount; i++) {
        const isAngelSide = i % 2 === 0;
        motePos[i * 3] = (isAngelSide ? -1 : 1) * (0.8 + Math.random() * 14.5);
        motePos[i * 3 + 1] = 0.2 + Math.random() * 6.0;
        motePos[i * 3 + 2] = (Math.random() - 0.5) * 24;
        moteSeeds[i] = Math.random() * Math.PI * 2;
        _tmpColor.setHex(
          isAngelSide ? (i % 4 === 0 ? 0xfde047 : 0x7dd3fc) : i % 4 === 1 ? 0xf97316 : 0xf43f5e
        );
        moteCol[i * 3] = _tmpColor.r;
        moteCol[i * 3 + 1] = _tmpColor.g;
        moteCol[i * 3 + 2] = _tmpColor.b;
      }
      const moteGeo = trackGeo(new THREE.BufferGeometry());
      moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
      moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
      const moteMat = trackMat(
        new THREE.PointsMaterial({
          size: 0.16,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      scene.add(new THREE.Points(moteGeo, moteMat));

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      const handleResize = () => {
        if (!renderer) return;
        const w = window.innerWidth;
        const h = Math.max(1, window.innerHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      window.addEventListener('resize', handleResize);

      let frameId = 0;
      let isDisposed = false;
      let lastTime = performance.now();
      const mountTime = lastTime;

      const afterDraw = (cb: () => void) => {
        if (isDisposed || !renderer) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (isDisposed) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
        } else {
          frameId = window.setTimeout(cb, 80);
        }
      };

      const syncPoolForKind = (
        pool: PoolSlot[],
        units: DemonRaised3DMinionSync[],
        dt: number,
        elapsed: number
      ) => {
        // Release slots whose minion IDs no longer exist
        for (const slot of pool) {
          if (slot.assignedId !== null && !units.some((u) => u.id === slot.assignedId)) {
            slot.assignedId = null;
            slot.rig.root.visible = false;
          }
        }

        for (let idx = 0; idx < units.length; idx++) {
          const u = units[idx];
          let slot = pool.find((s) => s.assignedId === u.id);
          if (!slot) {
            slot = pool.find((s) => s.assignedId === null);
            if (!slot) continue;
            slot.assignedId = u.id;
            slot.spawnAge = 0;
            projectNdcToGround(u.ndcX, u.ndcY, 0.45, camera, _targetWorldPos);
            slot.rig.root.position.copy(_targetWorldPos);
          }

          slot.spawnAge += dt;
          slot.rig.root.visible = true;
          projectNdcToGround(u.ndcX, u.ndcY, 0.45, camera, _targetWorldPos);

          const moveDamp = 1 - Math.exp(-16 * dt);
          slot.rig.root.position.lerp(_targetWorldPos, moveDamp);

          const popScale = Math.min(1, slot.spawnAge / 0.22);
          const baseScale = (1.32 + u.modLevel * 0.14) * popScale;
          slot.rig.root.scale.setScalar(Math.max(0.01, baseScale));

          // Smoothly face 2D movement/target angle
          const targetRotY = Math.atan2(Math.cos(u.facing), Math.sin(u.facing));
          let diff = targetRotY - slot.rig.body.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          slot.rig.body.rotation.y += diff * Math.min(1, dt * 12);

          // Animate hover, flapping wings, & attack strike swing
          const hoverBase = u.kind === 'angel' ? 0.52 : 0.44;
          slot.rig.body.position.y = hoverBase + Math.sin(elapsed * 4.5 + u.id) * 0.08;
          slot.rig.leftWingPivot.rotation.y = 0.25 + Math.sin(elapsed * 9.0 + u.id) * 0.36;
          slot.rig.rightWingPivot.rotation.y = -0.25 - Math.sin(elapsed * 9.0 + u.id) * 0.36;
          slot.rig.haloOrCrown.rotation.y = elapsed * 1.4;

          const strikeSwing = u.attackFlash > 0 ? Math.sin(u.attackFlash * Math.PI * 4) * 0.95 : 0;
          slot.rig.weaponPivot.rotation.x = Math.sin(elapsed * 3.5 + u.id) * 0.15 + strikeSwing;

          slot.rig.modRing.visible = u.modLevel > 0;
          if (slot.rig.modRing.visible) {
            slot.rig.modRing.rotation.z = elapsed * 3.2;
          }
        }
      };

      const tick = () => {
        if (isDisposed || !renderer) return;
        const now = performance.now();
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        const elapsed = (now - mountTime) / 1000;
        lastTime = now;

        marbleTex.offset.x = elapsed * 0.025;
        lavaTex.offset.y = -elapsed * 0.055;
        terrainUniforms.uTime.value = elapsed;

        for (let i = 0; i < heavenCrystals.length; i++) {
          heavenCrystals[i].rotation.y = elapsed * 1.5 + i * 0.7;
        }

        const mPosAttr = moteGeo.attributes.position as THREE.BufferAttribute;
        const mArr = mPosAttr.array as Float32Array;
        for (let i = 0; i < moteCount; i++) {
          const s = moteSeeds[i];
          mArr[i * 3 + 1] += dt * (0.42 + (i % 3) * 0.2);
          mArr[i * 3] += Math.sin(elapsed * 1.6 + s) * dt * 0.28;
          if (mArr[i * 3 + 1] > 6.5) mArr[i * 3 + 1] = 0.2;
        }
        mPosAttr.needsUpdate = true;

        const syncData = getSyncRef.current?.() ?? null;
        const normPos = syncData?.playerNorm ?? null;
        const nx = normPos ? THREE.MathUtils.clamp(normPos.x, -1, 1) : 0;
        const ny = normPos ? THREE.MathUtils.clamp(normPos.y, -1, 1) : 0;

        if (syncData?.playerNdc) {
          projectNdcToGround(syncData.playerNdc.x, syncData.playerNdc.y, 0.3, camera, _heroLightTarget);
          _heroLightTarget.y = 2.0;
        } else {
          _heroLightTarget.set(nx * 9.5, 2.0, ny * 7.5);
        }
        heroAuraLight.position.lerp(_heroLightTarget, 1 - Math.exp(-8 * dt));
        heroAuraLight.color.setHex(heroAuraLight.position.x < 0 ? 0xfde047 : 0xf43f5e);
        terrainUniforms.uHeroXZ.value.set(heroAuraLight.position.x, heroAuraLight.position.z);

        const swayX = Math.sin(elapsed * 0.26) * 0.45 + nx * 0.9;
        const swayZ = Math.cos(elapsed * 0.2) * 0.3 + ny * 0.55;
        _camGoal.set(swayX, 26.2, 11.4 + swayZ);
        _lookGoal.set(nx * 0.4, 0.2, 0.6 + ny * 0.3);

        const dampAlpha = 1 - Math.exp(-3.6 * dt);
        camera.position.lerp(_camGoal, dampAlpha);
        _currentLook.lerp(_lookGoal, dampAlpha);
        camera.lookAt(_currentLook);
        camera.updateMatrixWorld();

        // Sync live 3D Angel & Demon summoned troops right on top of their 2D engine positions!
        const allMinions = syncData?.minions ?? [];
        const angels = allMinions.filter((m) => m.kind === 'angel');
        const demons = allMinions.filter((m) => m.kind === 'demon');
        syncPoolForKind(angelPool, angels, dt, elapsed);
        syncPoolForKind(demonPool, demons, dt, elapsed);

        renderer.render(scene, camera);

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      tick();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
        window.removeEventListener('resize', handleResize);
        for (const item of disposables) {
          try {
            item.dispose();
          } catch {
            // ignore disposal errors
          }
        }
        renderer?.dispose();
        canvas.remove();
      };
    } catch {
      renderer?.dispose();
      canvas.remove();
      onFallbackRef.current?.();
      return undefined;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-slate-950"
    />
  );
};
