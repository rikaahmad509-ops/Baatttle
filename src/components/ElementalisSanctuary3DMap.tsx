import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  computeSanctuaryHeight,
  createSanctuaryWaterTexture,
  createSanctuaryWaterfallTexture
} from '../game/elementalisSanctuaryWorld';

interface ElementalisSanctuary3DMapProps {
  realmRemaining: number;
  getPlayerNormPos?: () => { x: number; y: number } | null;
  onWebGLUnavailable?: () => void;
}

const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _heroLightTarget = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 0.2, 0.6);

export const ElementalisSanctuary3DMap: React.FC<ElementalisSanctuary3DMapProps> = ({
  realmRemaining,
  getPlayerNormPos,
  onWebGLUnavailable
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const realmRemRef = useRef<number>(realmRemaining);
  const lastSyncRef = useRef<number>(performance.now());
  const getPlayerNormPosRef = useRef(getPlayerNormPos);
  const onFallbackRef = useRef(onWebGLUnavailable);

  getPlayerNormPosRef.current = getPlayerNormPos;
  onFallbackRef.current = onWebGLUnavailable;

  useEffect(() => {
    realmRemRef.current = realmRemaining;
    lastSyncRef.current = performance.now();
  }, [realmRemaining]);

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
      renderer.toneMappingExposure = 1.04;
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
      scene.background = new THREE.Color(0x062026);
      scene.fog = new THREE.FogExp2(0x062026, 0.014);

      // Elevated tactical 3D diorama battle perspective (~66 deg pitch)
      const camera = new THREE.PerspectiveCamera(
        44,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.5,
        150
      );
      camera.position.set(0, 26.2, 11.4);
      _currentLook.set(0, 0.2, 0.6);
      camera.lookAt(_currentLook);

      // Studio environment reflections for water, crystals, & wet shorelines
      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      disposables.push(envRT, roomEnv, pmrem);

      // Lighting Rig: Warm Sun Key + Cool Teal Hemisphere Fill + Rim + Dynamic Hero Aura Light
      const hemiLight = new THREE.HemisphereLight(0x67e8f9, 0x14532d, 0.92);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfff1c9, 2.05);
      sunLight.position.set(16, 26, 14);
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

      const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.78);
      rimLight.position.set(-14, 12, -16);
      scene.add(rimLight);

      const lakeGlowLight = new THREE.PointLight(0x38bdf8, 8.5, 22, 1.4);
      lakeGlowLight.position.set(-6.8, 1.1, 5.2);
      scene.add(lakeGlowLight);

      const heroAuraLight = new THREE.PointLight(0x2dd4bf, 7.5, 16, 1.4);
      heroAuraLight.position.set(0, 2.1, 0);
      scene.add(heroAuraLight);

      const waterTex = createSanctuaryWaterTexture(renderer);
      const fallTex = createSanctuaryWaterfallTexture();
      disposables.push(waterTex, fallTex);

      // 1. Sculpted 3D Primordial Sanctuary Terrain with PBR Detail Shader
      const terrainSize = 58;
      const terrainSegs = 88;
      const terrainGeo = trackGeo(
        new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs)
      );
      terrainGeo.rotateX(-Math.PI / 2);

      const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
      const vertCount = posAttr.count;
      const targetHeights = new Float32Array(vertCount);
      const lushColors = new Float32Array(vertCount * 3);

      const cGrass = new THREE.Color(0x16a34a);
      const cMeadow = new THREE.Color(0x22c55e);
      const cMoss = new THREE.Color(0x15803d);
      const cSand = new THREE.Color(0x9a8c67);
      const cLakeBed = new THREE.Color(0x0c4a6e);
      const cRock = new THREE.Color(0x3f4c45);
      const cPeak = new THREE.Color(0x64748b);

      for (let i = 0; i < vertCount; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const h = computeSanctuaryHeight(vx, vz);
        targetHeights[i] = h;
        posAttr.setY(i, h);

        const r = Math.hypot(vx, vz);
        const noise = Math.sin(vx * 0.7) * Math.cos(vz * 0.7) * 0.5 + 0.5;
        if (h < -0.55) {
          _tmpColor.copy(cLakeBed);
        } else if (h < -0.05) {
          _tmpColor.copy(cSand).lerp(cMoss, (h + 0.55) / 0.5);
        } else if (h > 2.2) {
          _tmpColor.copy(cRock).lerp(cPeak, Math.min(1, (h - 2.2) / 2.8));
        } else if (h > 1.0) {
          _tmpColor.copy(cMoss).lerp(cRock, (h - 1.0) / 1.2);
        } else {
          _tmpColor.copy(cMoss).lerp(cGrass, noise * 0.7).lerp(cMeadow, r < 7.5 ? 0.35 : 0.12);
        }

        lushColors[i * 3] = _tmpColor.r;
        lushColors[i * 3 + 1] = _tmpColor.g;
        lushColors[i * 3 + 2] = _tmpColor.b;
      }
      posAttr.needsUpdate = true;
      terrainGeo.computeVertexNormals();
      terrainGeo.setAttribute('color', new THREE.BufferAttribute(lushColors, 3));
      terrainGeo.setAttribute('aTargetHeight', new THREE.BufferAttribute(targetHeights, 1));

      const terrainUniforms = {
        uTime: { value: 0 },
        uHeroXZ: { value: new THREE.Vector2(0, 0) }
      };

      const terrainMat = trackMat(
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.85,
          metalness: 0.04
        })
      );
      terrainMat.customProgramCacheKey = () => 'elementalis-sanctuary-map-v1';
      terrainMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = terrainUniforms.uTime;
        shader.uniforms.uHeroXZ = terrainUniforms.uHeroXZ;

        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
            attribute float aTargetHeight;
            varying vec3 vTerrainPos;
            varying float vTargetHeight;
            varying float vSlope;`
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            vTerrainPos = transformed;
            vTargetHeight = aTargetHeight;
            vSlope = 1.0 - clamp(objectNormal.y, 0.0, 1.0);`
          );

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
            uniform float uTime;
            uniform vec2 uHeroXZ;
            varying vec3 vTerrainPos;
            varying float vTargetHeight;
            varying float vSlope;

            float mapHash21(vec2 p) {
              p = fract(p * vec2(123.34, 456.21));
              p += dot(p, p + 45.32);
              return fract(p.x * p.y);
            }

            float mapVNoise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              float a = mapHash21(i);
              float b = mapHash21(i + vec2(1.0, 0.0));
              float c = mapHash21(i + vec2(0.0, 1.0));
              float d = mapHash21(i + vec2(1.0, 1.0));
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }

            float mapFbm(vec2 p) {
              float v = 0.0;
              float amp = 0.5;
              for (int i = 0; i < 4; i++) {
                v += amp * mapVNoise(p);
                p = p * 2.03 + vec2(17.1, 31.7);
                amp *= 0.5;
              }
              return v;
            }`
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            float detailLow = mapFbm(vTerrainPos.xz * 0.42);
            float detailHigh = mapVNoise(vTerrainPos.xz * 3.8);
            float microGrain = mapVNoise(vTerrainPos.xz * 11.5);

            vec3 natureColor = diffuseColor.rgb;
            float grassZone = smoothstep(-0.08, 0.25, vTargetHeight) * (1.0 - smoothstep(0.95, 1.55, vTargetHeight));
            natureColor = mix(natureColor, natureColor * (0.78 + 0.48 * detailLow) + vec3(0.012, 0.035, 0.008) * detailHigh, grassZone);

            float shoreZone = smoothstep(-0.62, -0.25, vTargetHeight) * (1.0 - smoothstep(-0.05, 0.24, vTargetHeight));
            vec3 sandTone = mix(vec3(0.24, 0.20, 0.12), vec3(0.38, 0.32, 0.20), microGrain);
            float wetDarken = mix(0.55, 1.0, smoothstep(-0.32, 0.08, vTargetHeight));
            natureColor = mix(natureColor, sandTone * wetDarken, shoreZone * 0.75);

            float lakeZone = 1.0 - smoothstep(-0.58, -0.22, vTargetHeight);
            float caustic = pow(abs(sin(vTerrainPos.x * 1.9 + detailLow * 4.5 + uTime * 0.75) * cos(vTerrainPos.z * 1.9 - detailHigh * 3.0 - uTime * 0.55)), 2.5);
            vec3 lakeTone = mix(vec3(0.012, 0.09, 0.16), vec3(0.03, 0.24, 0.36), detailLow) + vec3(0.06, 0.28, 0.36) * caustic;
            natureColor = mix(natureColor, lakeTone, lakeZone * 0.85);

            float rockZone = clamp(smoothstep(0.85, 2.0, vTargetHeight) + smoothstep(0.22, 0.52, vSlope) * 0.75, 0.0, 1.0);
            float strata = 0.5 + 0.5 * sin(vTargetHeight * 7.5 + detailLow * 5.0);
            vec3 rockTone = mix(vec3(0.055, 0.072, 0.065), vec3(0.14, 0.16, 0.17), strata * 0.65 + detailHigh * 0.35);
            natureColor = mix(natureColor, rockTone, rockZone * 0.78);

            float peakFrost = smoothstep(2.65, 4.1, vTargetHeight + (detailHigh - 0.5) * 0.55);
            natureColor = mix(natureColor, vec3(0.48, 0.56, 0.62), peakFrost * 0.68);

            // Soft combat-readability darkening across center clearing so glowing 2D effects pop
            float centerDim = smoothstep(14.0, 2.5, length(vTerrainPos.xz));
            natureColor *= mix(0.95, 0.72, centerDim);

            // Subtle living elemental aura ring following Elementalis on the 3D terrain
            float heroDist = length(vTerrainPos.xz - uHeroXZ);
            float heroRing = exp(-pow((heroDist - 1.85) / 0.22, 2.0));
            diffuseColor.rgb = mix(natureColor, vec3(0.08, 0.68, 0.64), heroRing * 0.32);`
          )
          .replace(
            '#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>
            float wetSandFactor = shoreZone * (1.0 - smoothstep(-0.35, 0.04, vTargetHeight));
            roughnessFactor = mix(0.86, 0.24, clamp(lakeZone + wetSandFactor, 0.0, 1.0));`
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            vec3 causticGlow = vec3(0.03, 0.22, 0.34) * caustic * lakeZone * 0.55;
            vec3 heroRingGlow = vec3(0.08, 0.72, 0.66) * heroRing * (0.35 + 0.15 * sin(uTime * 3.0));
            totalEmissiveRadiance += causticGlow + heroRingGlow;`
          );
      };

      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = !isSoftwareGl;
      scene.add(terrainMesh);

      // 2. Central Mossy Stone Sanctuary Altar & 4 Elemental Monoliths
      const altarGroup = new THREE.Group();
      const stoneMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.78, metalness: 0.18 })
      );
      const leylineMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x2dd4bf,
          emissive: 0x14b8a6,
          emissiveIntensity: 1.35,
          roughness: 0.25,
          metalness: 0.6
        })
      );

      const dais = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.6, 3.1, 0.26, 12)), stoneMat);
      dais.position.y = 0.12;
      dais.receiveShadow = !isSoftwareGl;
      altarGroup.add(dais);

      const altarRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(2.85, 0.065, 10, 48)), leylineMat);
      altarRing.rotation.x = Math.PI / 2;
      altarRing.position.y = 0.07;
      altarGroup.add(altarRing);

      const elementColors = [0xf97316, 0x34d399, 0x38bdf8, 0xf59e0b];
      const monolithCores: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const pillarGroup = new THREE.Group();
        pillarGroup.position.set(Math.cos(ang) * 4.6, 0, Math.sin(ang) * 4.6);
        pillarGroup.rotation.y = -ang;

        const baseStone = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 1.25, 0.42)), stoneMat);
        baseStone.position.y = 0.62;
        baseStone.castShadow = !isSoftwareGl;
        pillarGroup.add(baseStone);

        const runeCore = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.24, 0)),
          trackMat(
            new THREE.MeshStandardMaterial({
              color: elementColors[i],
              emissive: elementColors[i],
              emissiveIntensity: 1.7,
              roughness: 0.2,
              metalness: 0.4
            })
          )
        );
        runeCore.position.y = 1.55;
        pillarGroup.add(runeCore);
        monolithCores.push(runeCore);
        altarGroup.add(pillarGroup);
      }
      scene.add(altarGroup);

      // 3. Shimmering Turquoise Lake, Floating Lily Pads + Lotus, & Cascading Waterfall
      const lakeGeo = trackGeo(new THREE.CircleGeometry(7.2, 48));
      lakeGeo.rotateX(-Math.PI / 2);
      const lakeMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: waterTex,
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.28,
          roughness: 0.12,
          metalness: 0.35,
          transparent: true,
          opacity: 0.92
        })
      );
      const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
      lakeMesh.position.set(-6.8, -0.38, 5.2);
      lakeMesh.scale.set(1.15, 1, 0.85);
      scene.add(lakeMesh);

      const lilyGroup = new THREE.Group();
      const lilyMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 }));
      const lotusMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf9a8d4,
          emissive: 0xf472b6,
          emissiveIntensity: 0.7,
          roughness: 0.35
        })
      );
      const lilyPads: THREE.Group[] = [];
      for (let i = 0; i < 12; i++) {
        const ang = i * 1.17;
        const rad = 1.1 + (i % 4) * 1.15;
        const pad = new THREE.Group();
        pad.position.set(-6.8 + Math.cos(ang) * rad * 1.1, -0.34, 5.2 + Math.sin(ang) * rad * 0.78);
        const leaf = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 12, 1, false, 0, Math.PI * 1.8)),
          lilyMat
        );
        pad.add(leaf);
        if (i % 3 === 0) {
          const lotus = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), lotusMat);
          lotus.position.y = 0.1;
          pad.add(lotus);
        }
        lilyGroup.add(pad);
        lilyPads.push(pad);
      }
      scene.add(lilyGroup);

      const fallCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(9.4, 3.6, -8.2),
        new THREE.Vector3(8.1, 2.2, -6.9),
        new THREE.Vector3(7.1, 0.4, -5.6),
        new THREE.Vector3(6.6, -0.35, -4.8)
      ]);
      const fallGeo = trackGeo(new THREE.TubeGeometry(fallCurve, 24, 0.85, 8, false));
      fallGeo.scale(1.4, 1, 0.35);
      const fallMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: fallTex,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.45,
          roughness: 0.15,
          transparent: true,
          opacity: 0.88
        })
      );
      scene.add(new THREE.Mesh(fallGeo, fallMat));

      // 4. Towering Multi-Part Mountains with Snow Caps & Glowing Elemental Veins
      const mountainsGroup = new THREE.Group();
      const rockMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.08, flatShading: true })
      );
      const snowMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55, metalness: 0.05, flatShading: true })
      );
      const veinTealMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x14b8a6, emissiveIntensity: 1.5, roughness: 0.3 })
      );
      const veinAmberMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 1.3, roughness: 0.3 })
      );

      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + 0.15;
        const dist = 17.5 + (i % 3) * 3.2;
        const mx = Math.cos(ang) * dist;
        const mz = Math.sin(ang) * dist;
        const mScale = 1.0 + ((i * 37) % 10) * 0.09;
        const peakH = (5.4 + (i % 4) * 2.1) * mScale;
        const baseGroundY = computeSanctuaryHeight(mx, mz) - 0.6;

        const mGroup = new THREE.Group();
        mGroup.position.set(mx, baseGroundY, mz);
        mGroup.rotation.y = ang + i * 0.5;

        const mainPeak = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(3.4 * mScale, peakH, 7)), rockMat);
        mainPeak.position.y = peakH * 0.5;
        mainPeak.castShadow = !isSoftwareGl;
        mGroup.add(mainPeak);

        const ridge = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.3 * mScale, peakH * 0.68, 6)), rockMat);
        ridge.position.set(1.6 * mScale, peakH * 0.34, 0.7 * mScale);
        mGroup.add(ridge);

        const snowCap = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.18 * mScale, peakH * 0.32, 7)), snowMat);
        snowCap.position.y = peakH * 0.845;
        mGroup.add(snowCap);

        const vein = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.55 * mScale, 0)),
          i % 3 === 0 ? veinAmberMat : veinTealMat
        );
        vein.scale.set(0.5, 2.6, 0.5);
        vein.position.set(0, peakH * 0.42, 1.55 * mScale);
        vein.rotation.x = 0.32;
        mGroup.add(vein);

        mountainsGroup.add(mGroup);
      }
      scene.add(mountainsGroup);

      // 5. Ancient Primordial Spirit Tree on the Cliff Promontory
      const spiritTreeGroup = new THREE.Group();
      const stX = 8.4;
      const stZ = -7.8;
      spiritTreeGroup.position.set(stX, computeSanctuaryHeight(stX, stZ) - 0.2, stZ);

      const barkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x452719, roughness: 0.92 }));
      const spiritLeafMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.35,
          roughness: 0.65
        })
      );
      const sakuraLeafMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0xbe185d,
          emissiveIntensity: 0.32,
          roughness: 0.6
        })
      );

      const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.38, 0.72, 3.2, 8)), barkMat);
      trunk.position.y = 1.6;
      trunk.castShadow = !isSoftwareGl;
      spiritTreeGroup.add(trunk);

      const canopyOffsets: Array<[number, number, number, number, boolean]> = [
        [0, 3.5, 0, 1.65, false],
        [-1.05, 3.05, 0.65, 1.15, true],
        [1.1, 3.15, -0.5, 1.2, false],
        [0.2, 4.15, 0.4, 1.15, true],
        [-0.35, 2.85, -0.95, 1.05, false]
      ];
      for (const [cx, cy, cz, cr, isPink] of canopyOffsets) {
        const crown = new THREE.Mesh(
          trackGeo(new THREE.IcosahedronGeometry(cr, 1)),
          isPink ? sakuraLeafMat : spiritLeafMat
        );
        crown.position.set(cx, cy, cz);
        crown.scale.y = 0.72;
        spiritTreeGroup.add(crown);
      }
      scene.add(spiritTreeGroup);

      // 6. Instanced Pine Forest (72) + Blossom Trees (24) + Mossy Boulders (36)
      const pinePositions: Array<{ x: number; y: number; z: number; s: number; rot: number }> = [];
      for (let i = 0; i < 144 && pinePositions.length < 72; i++) {
        const ang = (i * 2.39996) % (Math.PI * 2);
        const rad = 7.6 + ((i * 19) % 100) / 100 * 8.6;
        const tx = Math.cos(ang) * rad;
        const tz = Math.sin(ang) * rad;
        const ty = computeSanctuaryHeight(tx, tz);
        if (ty < 0.02) continue;
        pinePositions.push({
          x: tx,
          y: ty - 0.12,
          z: tz,
          s: 0.72 + ((i * 31) % 10) * 0.075,
          rot: i * 0.8
        });
      }

      const pineTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.18, 0.9, 6));
      pineTrunkGeo.translate(0, 0.45, 0);
      const pineCone1Geo = trackGeo(new THREE.ConeGeometry(0.68, 1.15, 7));
      pineCone1Geo.translate(0, 1.25, 0);
      const pineCone2Geo = trackGeo(new THREE.ConeGeometry(0.5, 1.0, 7));
      pineCone2Geo.translate(0, 1.85, 0);

      const pineFoliageMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, flatShading: true })
      );
      const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, barkMat, pinePositions.length);
      const pineLowerCones = new THREE.InstancedMesh(pineCone1Geo, pineFoliageMat, pinePositions.length);
      const pineUpperCones = new THREE.InstancedMesh(pineCone2Geo, pineFoliageMat, pinePositions.length);

      const pinePalette = [0x15803d, 0x166534, 0x0f766e, 0x22c55e];
      for (let i = 0; i < pinePositions.length; i++) {
        const p = pinePositions[i];
        _dummy.position.set(p.x, p.y, p.z);
        _dummy.rotation.set(0, p.rot, 0);
        _dummy.scale.setScalar(p.s);
        _dummy.updateMatrix();
        pineTrunks.setMatrixAt(i, _dummy.matrix);
        pineLowerCones.setMatrixAt(i, _dummy.matrix);
        pineUpperCones.setMatrixAt(i, _dummy.matrix);

        _tmpColor.setHex(pinePalette[i % pinePalette.length]);
        pineLowerCones.setColorAt(i, _tmpColor);
        _tmpColor.offsetHSL(0, 0, 0.05);
        pineUpperCones.setColorAt(i, _tmpColor);
      }
      pineTrunks.instanceMatrix.needsUpdate = true;
      pineLowerCones.instanceMatrix.needsUpdate = true;
      pineUpperCones.instanceMatrix.needsUpdate = true;
      if (pineLowerCones.instanceColor) pineLowerCones.instanceColor.needsUpdate = true;
      if (pineUpperCones.instanceColor) pineUpperCones.instanceColor.needsUpdate = true;
      pineTrunks.computeBoundingSphere();
      pineLowerCones.computeBoundingSphere();
      pineUpperCones.computeBoundingSphere();
      scene.add(pineTrunks, pineLowerCones, pineUpperCones);

      // Blossom Trees
      const blossomPositions: Array<{ x: number; y: number; z: number; s: number }> = [];
      for (let i = 0; i < 60 && blossomPositions.length < 24; i++) {
        const ang = (i * 1.81 + 0.4) % (Math.PI * 2);
        const rad = 6.4 + ((i * 23) % 100) / 100 * 6.5;
        const bx = Math.cos(ang) * rad;
        const bz = Math.sin(ang) * rad;
        const by = computeSanctuaryHeight(bx, bz);
        if (by < 0.04) continue;
        blossomPositions.push({ x: bx, y: by - 0.1, z: bz, s: 0.75 + (i % 5) * 0.12 });
      }
      const blossomTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.12, 0.2, 1.1, 6));
      blossomTrunkGeo.translate(0, 0.55, 0);
      const blossomCrownGeo = trackGeo(new THREE.IcosahedronGeometry(0.75, 1));
      blossomCrownGeo.translate(0, 1.45, 0);
      const blossomMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }));
      const blossomTrunks = new THREE.InstancedMesh(blossomTrunkGeo, barkMat, blossomPositions.length);
      const blossomCrowns = new THREE.InstancedMesh(blossomCrownGeo, blossomMat, blossomPositions.length);
      for (let i = 0; i < blossomPositions.length; i++) {
        const b = blossomPositions[i];
        _dummy.position.set(b.x, b.y, b.z);
        _dummy.rotation.set(0, i * 0.7, 0);
        _dummy.scale.setScalar(b.s);
        _dummy.updateMatrix();
        blossomTrunks.setMatrixAt(i, _dummy.matrix);
        blossomCrowns.setMatrixAt(i, _dummy.matrix);
        _tmpColor.setHex(i % 2 === 0 ? 0xf9a8d4 : 0xfde68a);
        blossomCrowns.setColorAt(i, _tmpColor);
      }
      blossomTrunks.instanceMatrix.needsUpdate = true;
      blossomCrowns.instanceMatrix.needsUpdate = true;
      if (blossomCrowns.instanceColor) blossomCrowns.instanceColor.needsUpdate = true;
      blossomTrunks.computeBoundingSphere();
      blossomCrowns.computeBoundingSphere();
      scene.add(blossomTrunks, blossomCrowns);

      // Mossy Boulders
      const boulderGeo = trackGeo(new THREE.DodecahedronGeometry(0.65, 0));
      const bouldersMesh = new THREE.InstancedMesh(boulderGeo, stoneMat, 36);
      for (let i = 0; i < 36; i++) {
        const ang = i * 2.13;
        const rad = 5.4 + (i % 9) * 1.35;
        const rx = Math.cos(ang) * rad;
        const rz = Math.sin(ang) * rad;
        const ry = computeSanctuaryHeight(rx, rz);
        _dummy.position.set(rx, ry + 0.05, rz);
        _dummy.rotation.set(0.2, i * 0.9, 0.15);
        _dummy.scale.setScalar(0.35 + (i % 4) * 0.2);
        _dummy.updateMatrix();
        bouldersMesh.setMatrixAt(i, _dummy.matrix);
      }
      bouldersMesh.instanceMatrix.needsUpdate = true;
      bouldersMesh.computeBoundingSphere();
      scene.add(bouldersMesh);

      // 7. Drifting Translucent Clouds around the outer mountain rim
      const cloudsGroup = new THREE.Group();
      const cloudMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xe0f2fe,
          emissive: 0x0f172a,
          emissiveIntensity: 0.1,
          roughness: 0.95,
          transparent: true,
          opacity: 0.55
        })
      );
      const cloudPuffGeo = trackGeo(new THREE.SphereGeometry(1.35, 10, 8));
      const clouds: THREE.Group[] = [];
      for (let c = 0; c < 8; c++) {
        const cg = new THREE.Group();
        const ang = (c / 8) * Math.PI * 2;
        cg.position.set(Math.cos(ang) * 19.5, 8.8 + (c % 3) * 1.2, Math.sin(ang) * 19.5);
        for (let p = 0; p < 4; p++) {
          const puff = new THREE.Mesh(cloudPuffGeo, cloudMat);
          puff.position.set((p - 1.5) * 1.15, (p % 2) * 0.4, ((p * 3) % 2 - 0.5) * 0.65);
          puff.scale.set(1.1 + (p % 2) * 0.35, 0.65, 0.9);
          cg.add(puff);
        }
        cloudsGroup.add(cg);
        clouds.push(cg);
      }
      scene.add(cloudsGroup);

      // 8. Swirling Elemental Fireflies & Blossom Petals
      const moteCount = 260;
      const motePos = new Float32Array(moteCount * 3);
      const moteCol = new Float32Array(moteCount * 3);
      const moteSeeds = new Float32Array(moteCount);
      const mPalette = [0x2dd4bf, 0x38bdf8, 0xfbbf24, 0x4ade80, 0xf472b6];
      for (let i = 0; i < moteCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 1.5 + Math.random() * 17;
        motePos[i * 3] = Math.cos(ang) * rad;
        motePos[i * 3 + 1] = 0.25 + Math.random() * 6.0;
        motePos[i * 3 + 2] = Math.sin(ang) * rad;
        moteSeeds[i] = Math.random() * Math.PI * 2;
        _tmpColor.setHex(mPalette[i % mPalette.length]);
        moteCol[i * 3] = _tmpColor.r;
        moteCol[i * 3 + 1] = _tmpColor.g;
        moteCol[i * 3 + 2] = _tmpColor.b;
      }
      const moteGeo = trackGeo(new THREE.BufferGeometry());
      moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
      moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
      const moteMat = trackMat(
        new THREE.PointsMaterial({
          size: 0.2,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
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

      const tick = () => {
        if (isDisposed || !renderer) return;
        const now = performance.now();
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        const elapsed = (now - mountTime) / 1000;
        lastTime = now;

        // Animate water, waterfall, lake bobbing & monolith crystals
        waterTex.offset.x = elapsed * 0.05;
        waterTex.offset.y = elapsed * 0.035;
        fallTex.offset.y = -elapsed * 1.4;
        lakeMesh.position.y = -0.38 + Math.sin(elapsed * 2.0) * 0.02;
        terrainUniforms.uTime.value = elapsed;

        for (let i = 0; i < monolithCores.length; i++) {
          monolithCores[i].rotation.y = elapsed * 1.6 + i * 0.8;
          monolithCores[i].position.y = 1.55 + Math.sin(elapsed * 2.4 + i) * 0.1;
        }

        for (let i = 0; i < lilyPads.length; i++) {
          lilyPads[i].position.y = -0.34 + Math.sin(elapsed * 1.9 + i * 0.7) * 0.02;
        }

        for (let c = 0; c < clouds.length; c++) {
          clouds[c].rotation.y = elapsed * 0.035;
          clouds[c].position.y = 8.8 + (c % 3) * 1.2 + Math.sin(elapsed * 0.7 + c) * 0.22;
        }

        const mPosAttr = moteGeo.attributes.position as THREE.BufferAttribute;
        const mArr = mPosAttr.array as Float32Array;
        for (let i = 0; i < moteCount; i++) {
          const s = moteSeeds[i];
          mArr[i * 3 + 1] += dt * (0.4 + (i % 3) * 0.2);
          mArr[i * 3] += Math.sin(elapsed * 1.6 + s) * dt * 0.3;
          mArr[i * 3 + 2] += Math.cos(elapsed * 1.5 + s) * dt * 0.3;
          if (mArr[i * 3 + 1] > 6.8) mArr[i * 3 + 1] = 0.25;
        }
        mPosAttr.needsUpdate = true;

        // Subtle live parallax & Elementalis ground aura tracking 2D combat position
        const normPos = getPlayerNormPosRef.current?.();
        const nx = normPos ? THREE.MathUtils.clamp(normPos.x, -1, 1) : 0;
        const ny = normPos ? THREE.MathUtils.clamp(normPos.y, -1, 1) : 0;
        const targetHeroX = nx * 9.5;
        const targetHeroZ = ny * 7.5;
        _heroLightTarget.set(targetHeroX, 2.0, targetHeroZ);
        heroAuraLight.position.lerp(_heroLightTarget, 1 - Math.exp(-8 * dt));
        terrainUniforms.uHeroXZ.value.set(heroAuraLight.position.x, heroAuraLight.position.z);

        const swayX = Math.sin(elapsed * 0.28) * 0.55 + nx * 1.05;
        const swayZ = Math.cos(elapsed * 0.22) * 0.35 + ny * 0.65;
        _camGoal.set(swayX, 26.2, 11.4 + swayZ);
        _lookGoal.set(nx * 0.45, 0.2, 0.6 + ny * 0.35);

        const dampAlpha = 1 - Math.exp(-3.6 * dt);
        camera.position.lerp(_camGoal, dampAlpha);
        _currentLook.lerp(_lookGoal, dampAlpha);
        camera.lookAt(_currentLook);

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
