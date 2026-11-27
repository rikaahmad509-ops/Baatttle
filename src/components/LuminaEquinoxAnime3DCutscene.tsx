import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FastForward, Sparkles } from 'lucide-react';

interface LuminaEquinoxAnime3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  radiantCharges?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutsceneAct = 'resonance' | 'kaleidoscope' | 'convergence' | 'ascension_return';

const ACT_LABELS: Record<CutsceneAct, string> = {
  resonance: 'BABAK I · RESONANSI CAHAYA EMAS & CERMIN KRISTAL',
  kaleidoscope: 'BABAK II · KALEIDOSKOP INFINITI — 24 CERMIN MENGEPUNG LANGIT',
  convergence: 'BABAK III · PRISMATIC EQUINOX — TRANSFORMASI CAHAYA & CERMIN!',
  ascension_return: 'BABAK IV · WUJUD EQUINOX SEMPURNA — KEMBALI KE PERTEMPURAN!'
};

// Zero-GC module-scoped math helpers
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 2.4, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();

export const LuminaEquinoxAnime3DCutscene: React.FC<LuminaEquinoxAnime3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 6.0,
  radiantCharges = 0,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [act, setAct] = useState<CutsceneAct>('resonance');
  const [uiProgress, setUiProgress] = useState<number>(0);
  const [impactFlash, setImpactFlash] = useState<boolean>(false);

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
    const mount = canvasMountRef.current;
    if (!mount) return;

    // 1. Software WebGL Probe (rendering cost & frame pacing only; scene & UI stay identical)
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl =
          probeCanvas.getContext('webgl2') ||
          probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      mount.innerHTML = '';
      mount.appendChild(canvas);

      const handleContextLost = (ev: Event) => {
        ev.preventDefault();
        onFallbackRef.current?.();
      };
      canvas.addEventListener('webglcontextlost', handleContextLost);

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
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
      const trackTex = <T extends THREE.Texture>(t: T): T => {
        disposables.push(t);
        return t;
      };

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x091326);
      scene.fog = new THREE.FogExp2(0x101c38, 0.013);

      const camera = new THREE.PerspectiveCamera(
        46,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        240
      );
      camera.position.set(-0.7, 2.75, 4.0);
      _currentLook.set(0, 2.42, 0.6);
      camera.lookAt(_currentLook);

      // 2. Mandatory RoomEnvironment Studio Reflections for Chrome Silver Mirrors & Gold Armor
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      trackTex(envRT.texture);
      envRT.dispose();
      pmremGenerator.dispose();

      // 3. Balanced 3-Point Warm Gold + Cool Mirror Cyan Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x3b2809, 0.85);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.7);
      keyLight.position.set(12, 22, 12);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -18;
      keyLight.shadow.camera.right = 18;
      keyLight.shadow.camera.top = 18;
      keyLight.shadow.camera.bottom = -18;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 55;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const mirrorRimLight = new THREE.DirectionalLight(0x38bdf8, 2.3);
      mirrorRimLight.position.set(-12, 10, -14);
      scene.add(mirrorRimLight);

      const equinoxAuraLight = new THREE.PointLight(0xfde047, 3.6, 36, 1.5);
      equinoxAuraLight.position.set(0, 3.4, 1.5);
      scene.add(equinoxAuraLight);

      // 4. Quantized 4-Step Cel-Shading Gradient Map + Inverted-Hull Dark Ink Outline
      const toonSteps = new Uint8Array([42, 118, 200, 255]);
      const toonGradTex = trackTex(
        new THREE.DataTexture(toonSteps, 4, 1, THREE.RedFormat)
      );
      toonGradTex.minFilter = THREE.NearestFilter;
      toonGradTex.magFilter = THREE.NearestFilter;
      toonGradTex.needsUpdate = true;

      const inkOutlineMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x070b19,
          side: THREE.BackSide
        })
      );
      const addCelOutline = (mesh: THREE.Mesh, thickness = 1.055) => {
        const outline = new THREE.Mesh(mesh.geometry, inkOutlineMat);
        outline.scale.setScalar(thickness);
        mesh.add(outline);
        return outline;
      };

      // 5. Custom GLSL Anime Golden-Light & Silver-Mirror Eclipse Sky Dome
      const skyUniforms = {
        uTime: { value: 0 },
        uImpact: { value: 0 },
        uFlash: { value: 0 }
      };
      const skyMat = trackMat(
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: skyUniforms,
          vertexShader: `
            varying vec3 vWorldPos;
            void main() {
              vec4 wp = modelMatrix * vec4(position, 1.0);
              vWorldPos = wp.xyz;
              gl_Position = projectionMatrix * viewMatrix * wp;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uImpact;
            uniform float uFlash;
            varying vec3 vWorldPos;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                u.y
              );
            }

            void main() {
              vec3 dir = normalize(vWorldPos);
              float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

              vec3 deepIndigo = vec3(0.04, 0.07, 0.16);
              vec3 mirrorCyanMid = vec3(0.08, 0.24, 0.42);
              vec3 radiantZenith = vec3(0.18, 0.14, 0.28);

              vec3 col = mix(deepIndigo, mirrorCyanMid, smoothstep(0.32, 0.62, h));
              col = mix(col, radiantZenith, smoothstep(0.68, 0.98, h));

              // Dual Sun-Mirror Halo behind Sanctuary
              vec3 sunDir = normalize(vec3(0.0, 0.34, -0.94));
              float sunDot = dot(dir, sunDir);
              float sunDisc = smoothstep(0.966, 0.971, sunDot);
              float sunCorona = pow(max(0.0, sunDot), 16.0);

              // Prismatic aurora bands sweeping across the dome
              float prismWave = noise(dir.xy * 5.0 + vec2(uTime * 0.18, uTime * 0.09));
              vec3 auroraCol = mix(vec3(0.32, 0.85, 1.0), vec3(1.0, 0.86, 0.32), smoothstep(0.35, 0.72, prismWave));
              col += auroraCol * smoothstep(0.45, 0.78, prismWave) * 0.35;

              col += vec3(1.0, 0.84, 0.35) * sunCorona * 0.72;
              col = mix(col, vec3(1.0, 0.98, 0.88), sunDisc);

              // Radial anime prismatic god-rays on convergence
              float ang = atan(dir.y - 0.18, dir.x);
              float rays = pow(abs(sin(ang * 20.0 - uTime * 3.0)), 8.0);
              vec3 rayTint = mix(vec3(0.45, 0.92, 1.0), vec3(1.0, 0.88, 0.35), step(0.0, sin(ang * 10.0)));
              col += rayTint * rays * (0.12 + uImpact * 0.55);

              // Signature Anime Sakuga High-Contrast Monochrome Flash
              float lum = dot(col, vec3(0.299, 0.587, 0.114));
              vec3 bw = vec3(step(0.22, lum) * 0.98);
              col = mix(col, bw, clamp(uFlash, 0.0, 1.0));

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      const skyDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(125, 32, 24)), skyMat);
      scene.add(skyDome);

      // 6. Mirrored Sanctuary Platform + GLSL Kaleidoscope Equinox Mandala (polygonOffset prevents Z-fighting)
      const floorMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0f1f3d,
          metalness: 0.78,
          roughness: 0.16
        })
      );
      const floorBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(52, 54, 1.0, 48)),
        floorMat
      );
      floorBase.position.y = -0.5;
      floorBase.receiveShadow = !isSoftwareGl;
      scene.add(floorBase);

      const brushedGoldMat = trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xfacc15,
          metalness: 0.94,
          roughness: 0.15,
          clearcoat: 0.8
        })
      );
      const mirrorChromeMat = trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          metalness: 0.96,
          roughness: 0.06,
          clearcoat: 1.0
        })
      );

      const stageRim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(13.5, 0.28, 12, 64)),
        brushedGoldMat
      );
      stageRim.rotation.x = Math.PI / 2;
      stageRim.position.y = 0.06;
      scene.add(stageRim);

      // GLSL Rotating Kaleidoscope Equinox Circle
      const mandalaUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0.9 },
        uFusion: { value: 0 },
        uFlash: { value: 0 }
      };
      const mandalaMat = trackMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
          blending: THREE.AdditiveBlending,
          uniforms: mandalaUniforms,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uAlpha;
            uniform float uFusion;
            uniform float uFlash;
            varying vec2 vUv;

            void main() {
              vec2 p = vUv * 2.0 - 1.0;
              float r = length(p);
              if (r > 1.0) discard;
              float ang = atan(p.y, p.x);

              float outerRing = smoothstep(0.024, 0.0, abs(r - 0.94));
              float midRing = smoothstep(0.02, 0.0, abs(r - 0.68));
              float innerRing = smoothstep(0.018, 0.0, abs(r - 0.38));

              // Dual Overlapping Hexagram (Mirror Silver) + Solar Star (Gold)
              float hexA = smoothstep(0.022, 0.0, abs(r - (0.52 + 0.16 * abs(cos(ang * 3.0 + uTime * 0.55)))));
              float solarStar = smoothstep(0.022, 0.0, abs(r - (0.56 + 0.22 * abs(sin(ang * 6.0 - uTime * 0.65)))));
              float prismTicks = step(0.2, sin(ang * 24.0 + uTime * 1.6)) * smoothstep(0.06, 0.0, abs(r - 0.81));

              float intensity = outerRing + midRing * 0.9 + innerRing + hexA * 0.9 + solarStar * (0.65 + uFusion * 0.5) + prismTicks * 0.85;
              vec3 cyanCol = vec3(0.45, 0.90, 1.0);
              vec3 goldCol = vec3(1.0, 0.88, 0.28);
              vec3 col = mix(cyanCol, goldCol, clamp(solarStar + sin(r * 10.0 - uTime * 2.5) * 0.35 + uFusion * 0.25, 0.0, 1.0));
              if (uFlash > 0.5) col = vec3(1.0);

              float radialFade = 1.0 - smoothstep(0.92, 1.0, r);
              gl_FragColor = vec4(col, clamp(intensity * uAlpha * radialFade, 0.0, 1.0));
            }
          `
        })
      );
      const mandalaFloor = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(25.5, 25.5)),
        mandalaMat
      );
      mandalaFloor.rotation.x = -Math.PI / 2;
      mandalaFloor.position.y = 0.04;
      scene.add(mandalaFloor);

      // Sky Halo Seal above Sanctuary
      const skySeal = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(34, 34)),
        mandalaMat
      );
      skySeal.rotation.x = Math.PI / 2;
      skySeal.position.set(0, 15.0, -2.0);
      scene.add(skySeal);

      // 7. Outer Sanctuary Crystal Spire Pillars (Natural Perimeter Framing)
      const crystalPillarMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0x38bdf8,
          emissive: 0x0369a1,
          emissiveIntensity: 0.35,
          gradientMap: toonGradTex
        })
      );
      const spireGeo = trackGeo(new THREE.ConeGeometry(0.75, 11.0, 6));
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI * 0.9 + (i / 9) * Math.PI * 0.8;
        const dist = 17.5 + (i % 2) * 2.5;
        const spire = new THREE.Mesh(spireGeo, crystalPillarMat);
        spire.position.set(Math.cos(ang) * dist, 5.2, Math.sin(ang) * dist);
        spire.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.09;
        addCelOutline(spire, 1.05);
        scene.add(spire);
      }

      // 8. Composite 11-Part Cel-Shaded Anime Lumina Avatar + Ascended Dual Wings
      const luminaRoot = new THREE.Group();
      luminaRoot.position.set(0, 0, 0.6);
      scene.add(luminaRoot);

      const robeGoldMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xfef08a,
          emissive: 0xca8a04,
          emissiveIntensity: 0.25,
          gradientMap: toonGradTex
        })
      );
      const robeMirrorMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xbae6fd,
          emissive: 0x0284c7,
          emissiveIntensity: 0.3,
          gradientMap: toonGradTex
        })
      );
      const skinPaleMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xfdf8f6,
          gradientMap: toonGradTex
        })
      );
      const hairSilverMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xe0f2fe,
          gradientMap: toonGradTex
        })
      );

      // (1) Flared Celestial Gown Skirt (LatheGeometry, grounded bottom-center y=0)
      const dressProfile = [
        new THREE.Vector2(0.92, 0.0),
        new THREE.Vector2(0.74, 0.48),
        new THREE.Vector2(0.45, 1.15),
        new THREE.Vector2(0.36, 1.72),
        new THREE.Vector2(0.18, 2.02),
        new THREE.Vector2(0.0, 2.05)
      ];
      const dressMesh = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(dressProfile, 16)), robeMirrorMat);
      dressMesh.castShadow = !isSoftwareGl;
      addCelOutline(dressMesh, 1.045);
      luminaRoot.add(dressMesh);

      // (2) Asymmetric Golden Solar Mantle Over-Sash
      const mantleMesh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.42, 0.62, 0.92, 12, 1, true)),
        robeGoldMat
      );
      mantleMesh.position.y = 1.62;
      addCelOutline(mantleMesh, 1.055);
      luminaRoot.add(mantleMesh);

      // (3) Head + Crown Tiara + Flowing Twin-Tails
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.38, 0.02);
      luminaRoot.add(headGroup);

      const headSphere = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.28, 16, 14)), skinPaleMat);
      addCelOutline(headSphere, 1.07);
      headGroup.add(headSphere);

      const hairFlow = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.36, 0.92, 10)), hairSilverMat);
      hairFlow.position.set(0, -0.05, -0.14);
      hairFlow.rotation.x = -0.28;
      addCelOutline(hairFlow, 1.055);
      headGroup.add(hairFlow);

      // (4) Prismatic Crown Diadem
      const diadem = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.14, 0)), brushedGoldMat);
      diadem.scale.set(1.4, 1.5, 0.55);
      diadem.position.set(0, 0.34, 0.16);
      headGroup.add(diadem);

      // (5-6) Heterochromatic Anime Eyes (Sky Cyan Mirror Eye + Solar Gold Light Eye) + Flash Streak
      const eyeMirrorMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      const eyeLightMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xfde047 }));

      const eyeL = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.11, 0.044)), eyeMirrorMat);
      eyeL.position.set(-0.1, 0.02, 0.265);
      eyeL.rotation.z = -0.16;
      headGroup.add(eyeL);

      const eyeR = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.11, 0.044)), eyeLightMat);
      eyeR.position.set(0.1, 0.02, 0.265);
      eyeR.rotation.z = 0.16;
      headGroup.add(eyeR);

      const eyeBeamMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const eyeFlashStreak = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.2, 0.04)), eyeBeamMat);
      eyeFlashStreak.position.set(0, 0.02, 0.275);
      headGroup.add(eyeFlashStreak);

      // (7-8) Outstretched Hands Holding Twin Aspects (Left: Silver Mirror Shield, Right: Golden Sun Prism)
      const armGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.06, 0.82, 10));
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.42, 1.88, 0.08);
      luminaRoot.add(leftArmPivot);
      const armL = new THREE.Mesh(armGeo, robeMirrorMat);
      armL.position.y = -0.35;
      addCelOutline(armL, 1.07);
      leftArmPivot.add(armL);

      const heldMirrorHex = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 6)), mirrorChromeMat);
      heldMirrorHex.rotation.x = Math.PI / 2;
      heldMirrorHex.position.set(-0.08, -0.82, 0.14);
      leftArmPivot.add(heldMirrorHex);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.42, 1.88, 0.08);
      luminaRoot.add(rightArmPivot);
      const armR = new THREE.Mesh(armGeo, robeGoldMat);
      armR.position.y = -0.35;
      addCelOutline(armR, 1.07);
      rightArmPivot.add(armR);

      const heldSunPrism = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.2, 0)),
        trackMat(new THREE.MeshBasicMaterial({ color: 0xfde047 }))
      );
      heldSunPrism.position.set(0.08, -0.82, 0.14);
      rightArmPivot.add(heldSunPrism);

      // (9-11) Ascendant Equinox Wings & Halo (Gold Solar Wing + Chrome Cyan Mirror Wing!)
      const equinoxWingsGroup = new THREE.Group();
      equinoxWingsGroup.position.set(0, 1.95, -0.35);
      luminaRoot.add(equinoxWingsGroup);

      const wingFeatherGeo = trackGeo(new THREE.ConeGeometry(0.32, 2.5, 5));
      for (let w = 0; w < 4; w++) {
        // Left side: Mirror Cyan Crystal Wing Feathers
        const mWing = new THREE.Mesh(wingFeatherGeo, mirrorChromeMat);
        mWing.position.set(-0.85 - w * 0.45, 0.35 + (w % 2) * 0.45, -w * 0.12);
        mWing.rotation.z = 0.72 + w * 0.24;
        addCelOutline(mWing, 1.05);
        equinoxWingsGroup.add(mWing);

        // Right side: Radiant Gold Solar Wing Feathers
        const sWing = new THREE.Mesh(wingFeatherGeo, brushedGoldMat);
        sWing.position.set(0.85 + w * 0.45, 0.35 + (w % 2) * 0.45, -w * 0.12);
        sWing.rotation.z = -(0.72 + w * 0.24);
        addCelOutline(sWing, 1.05);
        equinoxWingsGroup.add(sWing);
      }

      const backEquinoxHalo = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(1.75, 0.08, 10, 48)),
        brushedGoldMat
      );
      backEquinoxHalo.position.set(0, 0.55, -0.25);
      equinoxWingsGroup.add(backEquinoxHalo);

      const contactShadow = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(1.35, 32)),
        trackMat(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.52, depthWrite: false }))
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = 0.02;
      scene.add(contactShadow);

      // 9. InstancedMesh #1: 24 Floating Hexagonal Chrome Mirrors + Gold Frames (Kaleidoscope Dome)
      const mirrorCount = 24;
      const mirrorDiscGeo = trackGeo(new THREE.CylinderGeometry(1.05, 1.05, 0.12, 6));
      mirrorDiscGeo.rotateX(Math.PI / 2);
      const mirrorsInst = new THREE.InstancedMesh(mirrorDiscGeo, mirrorChromeMat, mirrorCount);
      mirrorsInst.frustumCulled = false;
      scene.add(mirrorsInst);

      // Converging Laser Beams from each of the 24 mirrors toward Lumina's center
      const beamMatGold = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        })
      );
      const beamMatCyan = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        })
      );
      const beamGroup = new THREE.Group();
      scene.add(beamGroup);

      const mirrorMeta: { angle: number; radius: number; y: number; phase: number }[] = [];
      for (let i = 0; i < mirrorCount; i++) {
        const tier = i < 12 ? 0 : 1;
        const idx = tier === 0 ? i : i - 12;
        const angle = (idx / 12) * Math.PI * 2 + tier * 0.26;
        const radius = tier === 0 ? 6.2 : 10.2;
        const y = tier === 0 ? 3.2 + (i % 2) * 1.1 : 6.4 + (i % 3) * 1.2;
        mirrorMeta.push({ angle, radius, y, phase: i * 0.5 });

        _tmpColor.setHex(i % 2 === 0 ? 0xe0f2fe : 0xfef08a);
        mirrorsInst.setColorAt(i, _tmpColor);

        // Converging laser beam spline into Lumina chest (0, 2.2, 0.6)
        const startPt = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        const midPt = new THREE.Vector3(Math.cos(angle + 0.35) * radius * 0.45, (y + 2.2) * 0.5, Math.sin(angle + 0.35) * radius * 0.45);
        const endPt = new THREE.Vector3(0, 2.2, 0.6);
        const curve = new THREE.CatmullRomCurve3([startPt, midPt, endPt]);
        const bMesh = new THREE.Mesh(
          trackGeo(new THREE.TubeGeometry(curve, 14, 0.045, 5, false)),
          i % 2 === 0 ? beamMatCyan : beamMatGold
        );
        beamGroup.add(bMesh);
      }
      if (mirrorsInst.instanceColor) mirrorsInst.instanceColor.needsUpdate = true;

      // 10. 3D Anime Radial Speedlines Cone around Camera
      const speedlineUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 }
      };
      const speedlineMat = trackMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          depthTest: false,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          uniforms: speedlineUniforms,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uIntensity;
            varying vec2 vUv;
            float hash(float n) { return fract(sin(n) * 43758.5453123); }

            void main() {
              float radialCount = 72.0;
              float id = floor(vUv.x * radialCount);
              float localX = fract(vUv.x * radialCount);
              float rnd = hash(id * 17.3 + floor(uTime * 18.0));

              float lineMask = smoothstep(0.32, 0.0, abs(localX - 0.5)) * step(0.60, rnd);
              float edgeFade = smoothstep(0.05, 0.42, vUv.y) * (1.0 - smoothstep(0.68, 0.96, vUv.y));
              vec3 col = mix(vec3(0.42, 0.90, 1.0), vec3(1.0, 0.92, 0.42), step(0.5, fract(id * 0.5)));

              gl_FragColor = vec4(col, lineMask * edgeFade * uIntensity * 0.65);
            }
          `
        })
      );
      const speedlineCone = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(2.6, 0.55, 6.0, 48, 1, true)),
        speedlineMat
      );
      speedlineCone.rotation.x = Math.PI / 2;
      speedlineCone.position.set(0, 0, -3.2);
      speedlineCone.renderOrder = 10;
      camera.add(speedlineCone);
      scene.add(camera);

      // 11. Multi-Layer Impact Domes & Expanding Nova Ring
      const impactDomeMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      const impactDome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(1.0, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5)),
        impactDomeMat
      );
      impactDome.visible = false;
      scene.add(impactDome);

      const shockRingMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      const shockRing = new THREE.Mesh(
        trackGeo(new THREE.RingGeometry(0.75, 1.0, 48)),
        shockRingMat
      );
      shockRing.rotation.x = -Math.PI / 2;
      shockRing.position.y = 0.08;
      shockRing.visible = false;
      scene.add(shockRing);

      // 12. InstancedMesh #2: 52 Shattered Prismatic Crystal Shards Bursting on Impact
      const shardCount = 52;
      const shardGeo = trackGeo(new THREE.OctahedronGeometry(0.32, 0));
      const shardMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xffffff,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.65,
          gradientMap: toonGradTex
        })
      );
      const shardsInst = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
      shardsInst.frustumCulled = false;
      shardsInst.visible = false;
      const shardVel: { vx: number; vy: number; vz: number; rx: number; ry: number; s: number }[] = [];
      for (let i = 0; i < shardCount; i++) {
        const ang = (i / shardCount) * Math.PI * 2 + Math.random() * 0.3;
        const spd = 5.5 + Math.random() * 11.5;
        shardVel.push({
          vx: Math.cos(ang) * spd,
          vy: 4.5 + Math.random() * 10.5,
          vz: Math.sin(ang) * spd,
          rx: (Math.random() - 0.5) * 9,
          ry: (Math.random() - 0.5) * 9,
          s: 0.65 + Math.random() * 1.15
        });
        _tmpColor.setHex(i % 2 === 0 ? 0xfde047 : 0x38bdf8);
        shardsInst.setColorAt(i, _tmpColor);
      }
      if (shardsInst.instanceColor) shardsInst.instanceColor.needsUpdate = true;
      scene.add(shardsInst);

      // 13. Swirling Gold-Cyan Light-Mirror Motes (280 Points)
      const sparkCount = 280;
      const sparkPositions = new Float32Array(sparkCount * 3);
      const sparkMeta = new Float32Array(sparkCount * 3);
      for (let i = 0; i < sparkCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.5 + Math.random() * 15;
        sparkPositions[i * 3] = Math.cos(a) * r;
        sparkPositions[i * 3 + 1] = Math.random() * 14;
        sparkPositions[i * 3 + 2] = Math.sin(a) * r;
        sparkMeta[i * 3] = a;
        sparkMeta[i * 3 + 1] = r;
        sparkMeta[i * 3 + 2] = 0.8 + Math.random() * 2.4;
      }
      const sparkGeo = trackGeo(new THREE.BufferGeometry());
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
      const sparkMat = trackMat(
        new THREE.PointsMaterial({
          color: 0xe0f2fe,
          size: 0.20,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
      scene.add(sparkPoints);

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
      let prevTime = performance.now();
      let currentAct: CutsceneAct = 'resonance';
      let lastFlashState = false;

      const afterDraw = (cb: () => void) => {
        if (!renderer || isDisposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (isDisposed) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
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
        const dt = Math.min(0.05, (now - prevTime) / 1000);
        prevTime = now;

        const sinceSync = (now - lastSyncTimeRef.current) / 1000;
        const rem = Math.max(0, remainingRef.current - sinceSync);
        const progress = Math.max(0, Math.min(1, 1 - rem / Math.max(0.1, totalDuration)));
        const elapsed = progress * totalDuration;

        let nextAct: CutsceneAct = 'resonance';
        if (progress >= 0.86) nextAct = 'ascension_return';
        else if (progress >= 0.68) nextAct = 'convergence';
        else if (progress >= 0.24) nextAct = 'kaleidoscope';

        if (nextAct !== currentAct) {
          currentAct = nextAct;
          setAct(nextAct);
        }
        setUiProgress(Math.round(progress * 100));

        // Signature Anime Sakuga Monochrome Impact Frame (0.685 -> 0.745)
        const inImpactFlash = progress >= 0.685 && progress <= 0.745;
        if (inImpactFlash !== lastFlashState) {
          lastFlashState = inImpactFlash;
          setImpactFlash(inImpactFlash);
        }
        const flashVal = inImpactFlash ? 1.0 : 0.0;

        skyUniforms.uTime.value = elapsed;
        skyUniforms.uFlash.value = flashVal;
        mandalaUniforms.uTime.value = elapsed;
        mandalaUniforms.uFlash.value = flashVal;
        speedlineUniforms.uTime.value = elapsed;

        let impactVal = 0;
        let fusionVal = 0;

        backEquinoxHalo.rotation.z = elapsed * 0.9;
        heldSunPrism.rotation.y = elapsed * 2.5;
        heldMirrorHex.rotation.z = -elapsed * 1.4;

        if (progress < 0.24) {
          // ACT I: Eye Close-Up — Dual Heterochromatic Resonance (Mirror Cyan + Solar Gold)
          const t1 = progress / 0.24;
          speedlineUniforms.uIntensity.value = 0.85 + Math.sin(t1 * Math.PI) * 0.45;
          mandalaUniforms.uAlpha.value = 0.4 + t1 * 0.5;
          equinoxWingsGroup.scale.setScalar(0.18 + t1 * 0.25);
          beamGroup.scale.setScalar(0.01);

          eyeBeamMat.opacity = 0.5 + Math.sin(elapsed * 20) * 0.45;
          eyeFlashStreak.scale.x = 0.6 + t1 * 1.8;

          leftArmPivot.rotation.set(-0.9 - t1 * 0.5, 0, -0.35);
          rightArmPivot.rotation.set(-0.9 - t1 * 0.5, 0, 0.35);

          for (let i = 0; i < mirrorCount; i++) {
            const m = mirrorMeta[i];
            _dummy.position.set(
              Math.cos(m.angle) * m.radius,
              m.y + Math.sin(elapsed * 2.0 + m.phase) * 0.2,
              Math.sin(m.angle) * m.radius
            );
            _dummy.lookAt(0, 2.2, 0.6);
            _dummy.scale.setScalar(0.2 + t1 * 0.6);
            _dummy.updateMatrix();
            mirrorsInst.setMatrixAt(i, _dummy.matrix);
          }
          mirrorsInst.instanceMatrix.needsUpdate = true;

          camera.fov = THREE.MathUtils.lerp(36, 44, t1);
          camera.updateProjectionMatrix();
          _camTarget.set(
            THREE.MathUtils.lerp(-0.68, 0.72, t1),
            THREE.MathUtils.lerp(2.55, 2.75, t1),
            THREE.MathUtils.lerp(2.55, 3.8, t1)
          );
          _lookTarget.set(0, 2.42, 0.62);
        } else if (progress < 0.68) {
          // ACT II: Kaleidoscope Sanctuary — 24 Mirrors Converging Twin Light & Reflection Beams
          const t2 = (progress - 0.24) / 0.44;
          const beamEase = Math.min(1, t2 * 1.3);
          fusionVal = t2;

          speedlineUniforms.uIntensity.value = 0.32 + t2 * 0.42;
          mandalaUniforms.uAlpha.value = 0.94;
          eyeBeamMat.opacity = 0.28;
          eyeFlashStreak.scale.x = 0.8;

          equinoxWingsGroup.scale.setScalar(THREE.MathUtils.lerp(0.45, 1.05, t2));
          beamGroup.scale.setScalar(beamEase);
          beamGroup.rotation.y = elapsed * 0.45;

          // Lumina floats upward while joining Mirror & Light hands together
          luminaRoot.position.y = Math.sin(t2 * Math.PI) * 0.85 + t2 * 0.55;
          leftArmPivot.rotation.set(-1.55, -0.35 * t2, -0.45 * (1 - t2 * 0.5));
          rightArmPivot.rotation.set(-1.55, 0.35 * t2, 0.45 * (1 - t2 * 0.5));

          for (let i = 0; i < mirrorCount; i++) {
            const m = mirrorMeta[i];
            const orbit = m.angle + elapsed * 0.45;
            const rCur = THREE.MathUtils.lerp(m.radius, m.radius * 0.72, t2 * 0.6);
            _dummy.position.set(
              Math.cos(orbit) * rCur,
              m.y + Math.sin(elapsed * 2.8 + m.phase) * 0.3,
              Math.sin(orbit) * rCur
            );
            _dummy.lookAt(0, luminaRoot.position.y + 2.1, 0.6);
            _dummy.scale.setScalar(1.0);
            _dummy.updateMatrix();
            mirrorsInst.setMatrixAt(i, _dummy.matrix);
          }
          mirrorsInst.instanceMatrix.needsUpdate = true;

          camera.fov = THREE.MathUtils.lerp(44, 58, t2);
          camera.updateProjectionMatrix();
          const camOrbit = THREE.MathUtils.lerp(0.45, -0.58, t2);
          const camRad = THREE.MathUtils.lerp(9.2, 16.2, t2);
          _camTarget.set(
            Math.sin(camOrbit) * camRad,
            THREE.MathUtils.lerp(2.8, 6.2, t2),
            Math.cos(camOrbit) * camRad
          );
          _lookTarget.set(0, 2.8 + t2 * 0.6, 0.2);
        } else if (progress < 0.86) {
          // ACT III: Climax — Equinox Light + Mirror Convergence & Anime Impact Flash
          const t3 = (progress - 0.68) / 0.18;
          impactVal = 1.0 - t3 * 0.35;
          fusionVal = 1.0;

          speedlineUniforms.uIntensity.value = 1.2 * (1 - t3 * 0.55);
          mandalaUniforms.uAlpha.value = 1.0;
          luminaRoot.position.y = 0.65;
          equinoxWingsGroup.scale.setScalar(1.18 + Math.sin(t3 * Math.PI) * 0.18);
          beamGroup.scale.setScalar(Math.max(0.01, 1 - t3));

          leftArmPivot.rotation.set(-2.1, 0, -0.85);
          rightArmPivot.rotation.set(-2.1, 0, 0.85);

          impactDome.visible = true;
          const dScale = 1.4 + t3 * 22.0;
          impactDome.scale.set(dScale, dScale * 0.72, dScale);
          impactDomeMat.opacity = Math.max(0, (1 - t3) * 0.74);

          shockRing.visible = true;
          const rScale = 1.6 + t3 * 24.0;
          shockRing.scale.setScalar(rScale);
          shockRingMat.opacity = Math.max(0, (1 - t3) * 0.92);

          shardsInst.visible = true;
          for (let i = 0; i < shardCount; i++) {
            const sv = shardVel[i];
            const flyT = t3 * 1.15;
            const sy = Math.max(0.15, 1.8 + sv.vy * flyT - 8.5 * flyT * flyT);
            _dummy.position.set(sv.vx * flyT, sy, sv.vz * flyT);
            _dummy.rotation.set(sv.rx * flyT, sv.ry * flyT, flyT * 4.5);
            _dummy.scale.setScalar(sv.s * Math.max(0.05, 1 - t3 * 0.6));
            _dummy.updateMatrix();
            shardsInst.setMatrixAt(i, _dummy.matrix);
          }
          shardsInst.instanceMatrix.needsUpdate = true;

          const shake = Math.max(0, 1 - t3 * 1.5) * 0.4;
          camera.fov = THREE.MathUtils.lerp(62, 48, t3);
          camera.updateProjectionMatrix();
          _camTarget.set(
            Math.sin(elapsed * 45) * shake,
            4.8 + Math.cos(elapsed * 39) * shake,
            13.8
          );
          _lookTarget.set(0, 2.9, 0.4);
        } else {
          // ACT IV: Ascended Equinox Stance — Crane Rise Back to Arena Battle
          const t4 = (progress - 0.86) / 0.14;
          impactVal = (1 - t4) * 0.35;
          fusionVal = 1.0;
          speedlineUniforms.uIntensity.value = 0.0;
          impactDome.visible = false;
          shockRing.visible = false;
          shardsInst.visible = false;
          beamGroup.scale.setScalar(0.01);
          mandalaUniforms.uAlpha.value = 0.9 * (1 - t4 * 0.45);
          luminaRoot.position.y = THREE.MathUtils.lerp(0.65, 0.0, t4);
          equinoxWingsGroup.scale.setScalar(THREE.MathUtils.lerp(1.18, 1.0, t4));

          camera.fov = THREE.MathUtils.lerp(48, 46, t4);
          camera.updateProjectionMatrix();
          _camTarget.set(
            THREE.MathUtils.lerp(0, 1.2, t4),
            THREE.MathUtils.lerp(5.2, 12.2, t4),
            THREE.MathUtils.lerp(13.8, 10.6, t4)
          );
          _lookTarget.set(0, THREE.MathUtils.lerp(2.8, 1.2, t4), 0.2);
        }

        skyUniforms.uImpact.value = impactVal;
        mandalaUniforms.uFusion.value = fusionVal;
        equinoxAuraLight.position.set(0, luminaRoot.position.y + 2.8, 1.2);
        equinoxAuraLight.intensity = 3.4 + impactVal * 5.2;
        contactShadow.material.opacity = THREE.MathUtils.clamp(0.55 - luminaRoot.position.y * 0.25, 0.15, 0.55);

        const sAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
        const sArr = sAttr.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          const baseAng = sparkMeta[i * 3];
          const rad = sparkMeta[i * 3 + 1];
          const spd = sparkMeta[i * 3 + 2];
          const a = baseAng + elapsed * (0.55 + impactVal * 1.1);
          sArr[i * 3] = Math.cos(a) * (rad + impactVal * 3.0);
          sArr[i * 3 + 1] = (elapsed * spd + i * 0.43) % 14;
          sArr[i * 3 + 2] = Math.sin(a) * (rad + impactVal * 3.0);
        }
        sAttr.needsUpdate = true;

        const dampLambda = progress < 0.25 ? 11.0 : 7.5;
        const dampAlpha = 1 - Math.exp(-dampLambda * dt);
        camera.position.lerp(_camTarget, dampAlpha);
        _currentLook.lerp(_lookTarget, dampAlpha);
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
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        for (const item of disposables) {
          try {
            item.dispose();
          } catch {
            // ignore disposal errors
          }
        }
        renderer?.dispose();
        mount.innerHTML = '';
      };
    } catch {
      renderer?.dispose();
      onFallbackRef.current?.();
    }
  }, [totalDuration]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 overflow-hidden select-none"
      role="dialog"
      aria-label="Cutscene Anime 3D Lumina Sovereign Equinox"
    >
      {/* Dedicated Canvas Mount (100% Unobstructed Center) */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Brief Anime High-Contrast Sakuga Impact Flash Vignette */}
      {impactFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border-8 border-white/85 mix-blend-difference"
        />
      )}

      {/* Top Anime Letterbox Bar & Header (No backdrop-blur, no static pills, no pulsing dots) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black via-black/85 to-transparent px-5 sm:px-8 pt-4 pb-7 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-game font-semibold tracking-wider text-sky-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Lumina</span>
            <span aria-hidden="true">·</span>
            <span>Fusi Cahaya &amp; Cermin Suci</span>
          </div>
          <h2 className="mt-1 font-title text-xl sm:text-3xl font-black tracking-wide text-white drop-shadow text-balance">
            SOVEREIGN EQUINOX · PRISMATIC ASCENSION
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-game font-semibold text-amber-100/95 tracking-wide">
            {ACT_LABELS[act]}
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right text-xs font-mono tabular-nums text-sky-200/90">
          <span className="text-[11px] font-semibold text-amber-300">Radiant Charge</span>
          <span className="text-base font-bold text-white">{radiantCharges} Stack</span>
        </div>
      </div>

      {/* Bottom Anime Letterbox Dock & Accessible Skip Action */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-5 sm:px-8 pt-7 pb-5 flex items-end justify-between gap-4">
        <div className="pointer-events-none flex items-center gap-2 text-xs font-game text-sky-100/85 tracking-wide">
          <span>Cel-Shaded Anime</span>
          <span aria-hidden="true">·</span>
          <span>Cahaya Surya</span>
          <span aria-hidden="true">·</span>
          <span>24 Cermin Kristal</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums font-semibold text-amber-300">{uiProgress}%</span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-950/95 hover:bg-slate-900 border border-sky-400/60 hover:border-amber-300 text-slate-100 font-game font-semibold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* Bottom Mirror-to-Light Progress Line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-white to-amber-300 transition-[width] duration-100"
          style={{ width: `${uiProgress}%` }}
        />
      </div>
    </div>
  );
};
