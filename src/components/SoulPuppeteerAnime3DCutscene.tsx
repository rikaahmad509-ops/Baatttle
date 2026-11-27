import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FastForward, Sparkles } from 'lucide-react';

interface SoulPuppeteerAnime3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  soulCount?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutsceneAct = 'eye_awakening' | 'domain_theater' | 'impact_requiem' | 'curtain_return';

const ACT_LABELS: Record<CutsceneAct, string> = {
  eye_awakening: 'BABAK I · KAI — TATAPAN SANG DALANG & BENANG TAKDIR',
  domain_theater: 'BABAK II · RYOIKI TENKAI — TEATER MARIONET TAK TERBATAS',
  impact_requiem: 'BABAK III · JENTIKAN KUGUTSU — EKSEKUSI BAYANGAN ABADI!',
  curtain_return: 'BABAK IV · TIRAI MERAH TERBUKA — KEMBALI KE PERTEMPURAN!'
};

// Zero-GC module-scoped math helpers
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 2.4, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();

export const SoulPuppeteerAnime3DCutscene: React.FC<SoulPuppeteerAnime3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 6.0,
  soulCount = 0,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [act, setAct] = useState<CutsceneAct>('eye_awakening');
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

    // 1. Software WebGL Probe (never alter scene content/UI, only rendering cost & frame pacing)
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
      renderer.toneMappingExposure = 1.15;
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
      scene.background = new THREE.Color(0x090211);
      scene.fog = new THREE.FogExp2(0x160524, 0.014);

      const camera = new THREE.PerspectiveCamera(
        46,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        240
      );
      camera.position.set(0.7, 2.75, 4.1);
      _currentLook.set(0, 2.45, 0);
      camera.lookAt(_currentLook);

      // 2. Mandatory RoomEnvironment Studio Reflections for Metallic Accents
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      trackTex(envRT.texture);
      envRT.dispose();
      pmremGenerator.dispose();

      // 3. Three-Point Anime Lighting (High-contrast Crimson Rim + Cool Violet Hemi + Crisp Key)
      const hemiLight = new THREE.HemisphereLight(0xd8b4fe, 0x3b0764, 0.78);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfce7f3, 2.6);
      keyLight.position.set(11, 20, 12);
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

      const crimsonRimLight = new THREE.DirectionalLight(0xf43f5e, 2.4);
      crimsonRimLight.position.set(-10, 9, -15);
      scene.add(crimsonRimLight);

      const coreAuraLight = new THREE.PointLight(0xe879f9, 3.8, 32, 1.5);
      coreAuraLight.position.set(0, 3.2, 1.8);
      scene.add(coreAuraLight);

      // 4. Stepped 4-Band Cel-Shading Gradient Map (Authentic Anime Toon Bands)
      const toonSteps = new Uint8Array([38, 105, 190, 255]);
      const toonGradTex = trackTex(
        new THREE.DataTexture(toonSteps, 4, 1, THREE.RedFormat)
      );
      toonGradTex.minFilter = THREE.NearestFilter;
      toonGradTex.magFilter = THREE.NearestFilter;
      toonGradTex.needsUpdate = true;

      // Crisp Anime Ink Outline Material (Inverted-Hull BackSide)
      const inkOutlineMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x05010a,
          side: THREE.BackSide
        })
      );

      const addCelOutline = (mesh: THREE.Mesh, thickness = 1.055) => {
        const outline = new THREE.Mesh(mesh.geometry, inkOutlineMat);
        outline.scale.setScalar(thickness);
        mesh.add(outline);
        return outline;
      };

      // 5. Custom GLSL Anime Crimson-Moon Eclipse Sky Dome (with Impact B/W Inversion!)
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

              vec3 abyssBot = vec3(0.05, 0.01, 0.09);
              vec3 violetMid = vec3(0.18, 0.04, 0.28);
              vec3 crimsonZenith = vec3(0.04, 0.01, 0.08);

              vec3 col = mix(abyssBot, violetMid, smoothstep(0.32, 0.62, h));
              col = mix(col, crimsonZenith, smoothstep(0.68, 0.98, h));

              // Colossal Anime Crimson Moon directly behind theater stage
              vec3 moonDir = normalize(vec3(0.0, 0.34, -0.94));
              float moonDot = dot(dir, moonDir);
              float moonDisc = smoothstep(0.962, 0.966, moonDot);
              float moonCorona = pow(max(0.0, moonDot), 18.0);
              float moonInnerDark = smoothstep(0.979, 0.983, dot(dir, normalize(vec3(0.04, 0.36, -0.93))));

              // Ink-brush swirling clouds across moon
              float cloud = noise(dir.xy * 6.5 + vec2(uTime * 0.14, -uTime * 0.07));
              float cloudBand = smoothstep(0.45, 0.72, cloud);

              col += vec3(0.85, 0.08, 0.32) * moonCorona * 0.65;
              vec3 moonCol = mix(vec3(0.98, 0.14, 0.38), vec3(1.0, 0.86, 0.92), smoothstep(0.965, 0.978, moonDot));
              col = mix(col, moonCol, moonDisc * (1.0 - moonInnerDark * 0.85));
              col = mix(col, vec3(0.04, 0.01, 0.07), cloudBand * 0.42 * smoothstep(0.35, 0.8, h));

              // Anime Radial Energy Streaks on impact
              float ang = atan(dir.y - 0.18, dir.x);
              float streaks = pow(abs(sin(ang * 24.0 + uTime * 3.5)), 8.0);
              col += vec3(0.95, 0.25, 0.65) * streaks * uImpact * 0.45;

              // Signature Anime Sakuga High-Contrast Monochrome Flash
              float lum = dot(col, vec3(0.299, 0.587, 0.114));
              vec3 bw = vec3(step(0.16, lum) * 0.98);
              col = mix(col, bw, clamp(uFlash, 0.0, 1.0));

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      const skyDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(125, 32, 24)), skyMat);
      scene.add(skyDome);

      // 6. Extended Obsidian Marionette Stage Floor & GLSL Anime Transmutation Circle
      const stageFloorMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0x170924,
          gradientMap: toonGradTex
        })
      );
      const stageBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(52, 54, 1.0, 48)),
        stageFloorMat
      );
      stageBase.position.y = -0.5;
      stageBase.receiveShadow = !isSoftwareGl;
      scene.add(stageBase);

      // Outer crimson marble rim
      const stageRim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(13.2, 0.28, 12, 64)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x9f1239,
            roughness: 0.25,
            metalness: 0.85,
            emissive: 0x881337,
            emissiveIntensity: 0.35
          })
        )
      );
      stageRim.rotation.x = Math.PI / 2;
      stageRim.position.y = 0.06;
      scene.add(stageRim);

      // Rotating GLSL Anime Puppetry Magic Circle Decal (polygonOffset prevents z-fighting)
      const magicCircleUniforms = {
        uTime: { value: 0 },
        uAlpha: { value: 0.92 },
        uImpact: { value: 0 },
        uFlash: { value: 0 }
      };
      const magicCircleMat = trackMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
          blending: THREE.AdditiveBlending,
          uniforms: magicCircleUniforms,
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
            uniform float uImpact;
            uniform float uFlash;
            varying vec2 vUv;

            void main() {
              vec2 p = vUv * 2.0 - 1.0;
              float r = length(p);
              if (r > 1.0) discard;
              float ang = atan(p.y, p.x);

              float ringOuter = smoothstep(0.025, 0.0, abs(r - 0.94));
              float ringMid = smoothstep(0.02, 0.0, abs(r - 0.72));
              float ringInner = smoothstep(0.018, 0.0, abs(r - 0.42));

              // Star-of-Threads 8-point geometric anime seal
              float rotAng = ang + uTime * 0.45;
              float starA = abs(cos(rotAng * 4.0));
              float starPoly = smoothstep(0.024, 0.0, abs(r - (0.52 + 0.18 * starA)));

              // Runic blocks spinning counter-clockwise
              float runes = step(0.25, sin(ang * 24.0 - uTime * 1.8)) * smoothstep(0.06, 0.0, abs(r - 0.83));
              float crossThreads = smoothstep(0.012, 0.0, abs(sin(ang * 3.0 + uTime * 0.25)) * r) * step(r, 0.92);

              float intensity = ringOuter + ringMid * 0.9 + ringInner + starPoly * 0.95 + runes * 0.85 + crossThreads * 0.55;
              vec3 baseCol = mix(vec3(0.92, 0.22, 0.65), vec3(1.0, 0.16, 0.36), sin(r * 8.0 - uTime * 3.0) * 0.5 + 0.5);
              baseCol = mix(baseCol, vec3(1.0, 0.95, 1.0), uImpact * 0.45 + starPoly * 0.3);
              if (uFlash > 0.5) baseCol = vec3(1.0);

              float radialFade = 1.0 - smoothstep(0.92, 1.0, r);
              gl_FragColor = vec4(baseCol, clamp(intensity * uAlpha * radialFade, 0.0, 1.0));
            }
          `
        })
      );
      const magicCircleMesh = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(25, 25)),
        magicCircleMat
      );
      magicCircleMesh.rotation.x = -Math.PI / 2;
      magicCircleMesh.position.y = 0.04;
      scene.add(magicCircleMesh);

      // Upper Sky Inverted Anime Magic Seal above Colossus
      const skySealMesh = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(34, 34)),
        magicCircleMat
      );
      skySealMesh.rotation.x = Math.PI / 2;
      skySealMesh.position.set(0, 14.5, -2.5);
      scene.add(skySealMesh);

      // 7. Amphitheater of 6 Tilted Anime Torii / Crimson Stage Gates (Natural Arena Framing)
      const toriiCrimsonMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xbe123c,
          gradientMap: toonGradTex
        })
      );
      const toriiObsidianMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0x1e1b4b,
          gradientMap: toonGradTex
        })
      );
      const toriiGoldMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          roughness: 0.25,
          metalness: 0.9
        })
      );

      const toriiGroup = new THREE.Group();
      scene.add(toriiGroup);
      const pillarGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.36, 9.2, 10));
      const lintelGeo = trackGeo(new THREE.BoxGeometry(6.8, 0.48, 0.65));
      const subLintelGeo = trackGeo(new THREE.BoxGeometry(5.6, 0.3, 0.46));

      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI * 0.85 + (i / 5) * Math.PI * 0.7; // Arc behind the stage
        const dist = 16.5 + (i % 2) * 2.2;
        const gate = new THREE.Group();
        gate.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        gate.lookAt(0, 0, 0);
        // Dramatic surreal anime lean
        gate.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.08;

        const pL = new THREE.Mesh(pillarGeo, toriiCrimsonMat);
        pL.position.set(-2.1, 4.6, 0);
        addCelOutline(pL, 1.06);
        gate.add(pL);

        const pR = new THREE.Mesh(pillarGeo, toriiCrimsonMat);
        pR.position.set(2.1, 4.6, 0);
        addCelOutline(pR, 1.06);
        gate.add(pR);

        const topBeam = new THREE.Mesh(lintelGeo, toriiObsidianMat);
        topBeam.position.set(0, 8.9, 0);
        addCelOutline(topBeam, 1.05);
        gate.add(topBeam);

        const midBeam = new THREE.Mesh(subLintelGeo, toriiCrimsonMat);
        midBeam.position.set(0, 7.3, 0);
        addCelOutline(midBeam, 1.05);
        gate.add(midBeam);

        const plaque = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.7, 1.1, 0.55)), toriiGoldMat);
        plaque.position.set(0, 8.1, 0);
        gate.add(plaque);

        toriiGroup.add(gate);
      }

      // 8. Composite 10-Part Anime Soul Puppeteer Hero Model (Cel-Shaded + Ink Outlines + Glowing Anime Eyes)
      const puppeteerRoot = new THREE.Group();
      puppeteerRoot.position.set(0, 0, 0.8);
      scene.add(puppeteerRoot);

      const cloakMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0x3b0764,
          gradientMap: toonGradTex
        })
      );
      const cloakTrimMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xe879f9,
          emissive: 0xa21caf,
          emissiveIntensity: 0.35,
          gradientMap: toonGradTex
        })
      );
      const skinPaleMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xf1e6fa,
          gradientMap: toonGradTex
        })
      );
      const hairObsidianMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0x1e1b4b,
          gradientMap: toonGradTex
        })
      );
      const gauntletMetalMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          roughness: 0.22,
          metalness: 0.9
        })
      );

      // (1) Flared Anime Coat Skirt (LatheGeometry, grounded bottom-center pivot y=0)
      const coatProfile = [
        new THREE.Vector2(0.88, 0.0),
        new THREE.Vector2(0.72, 0.45),
        new THREE.Vector2(0.46, 1.15),
        new THREE.Vector2(0.38, 1.72),
        new THREE.Vector2(0.18, 2.02),
        new THREE.Vector2(0.0, 2.05)
      ];
      const coatGeo = trackGeo(new THREE.LatheGeometry(coatProfile, 14));
      const coatMesh = new THREE.Mesh(coatGeo, cloakMat);
      coatMesh.castShadow = !isSoftwareGl;
      addCelOutline(coatMesh, 1.045);
      puppeteerRoot.add(coatMesh);

      // (2) High Anime Collar Mantle
      const collarMesh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.44, 0.36, 0.45, 12, 1, true)),
        cloakTrimMat
      );
      collarMesh.position.y = 2.05;
      addCelOutline(collarMesh, 1.06);
      puppeteerRoot.add(collarMesh);

      // (3) Head + Crowned Hood
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.38, 0.02);
      puppeteerRoot.add(headGroup);

      const headSphere = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.28, 16, 14)),
        skinPaleMat
      );
      addCelOutline(headSphere, 1.07);
      headGroup.add(headSphere);

      // (4) Spiky Anime Hair Tufts
      const hairBack = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.36, 0.56, 9)),
        hairObsidianMat
      );
      hairBack.position.set(0, 0.14, -0.06);
      hairBack.rotation.x = -0.35;
      addCelOutline(hairBack, 1.06);
      headGroup.add(hairBack);

      // (5) Signature Crown Tiara Crest
      const crownCrest = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.14, 0)),
        gauntletMetalMat
      );
      crownCrest.scale.set(1.3, 1.5, 0.5);
      crownCrest.position.set(0, 0.32, 0.18);
      headGroup.add(crownCrest);

      // (6-7) Glowing Heterochromatic Anime Eyes + Dramatic Light Slashes (Crimson & Fuchsia)
      const eyeCrimsonMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xfb7185 }));
      const eyeFuchsiaMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xf0abfc }));

      const eyeLeft = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.11, 0.042)), eyeCrimsonMat);
      eyeLeft.position.set(-0.1, 0.02, 0.265);
      eyeLeft.rotation.z = -0.18;
      headGroup.add(eyeLeft);

      const eyeRight = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.11, 0.042)), eyeFuchsiaMat);
      eyeRight.position.set(0.1, 0.02, 0.265);
      eyeRight.rotation.z = 0.18;
      headGroup.add(eyeRight);

      // Anime eye glint streak plane (blazes bright during Babak I!)
      const eyeFlashBeamMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xff2a6d,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const eyeFlashBeam = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(1.15, 0.035)),
        eyeFlashBeamMat
      );
      eyeFlashBeam.position.set(0.1, 0.02, 0.275);
      eyeFlashBeam.rotation.z = 0.08;
      headGroup.add(eyeFlashBeam);

      // (8-9) Commanding Anime Arms & Golden Gauntlets (Raised to Pull Strings / Snap Fingers!)
      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.42, 1.88, 0.08);
      puppeteerRoot.add(rightArmPivot);

      const armGeo = trackGeo(new THREE.CylinderGeometry(0.085, 0.065, 0.85, 10));
      const rightArm = new THREE.Mesh(armGeo, cloakMat);
      rightArm.position.y = -0.35;
      addCelOutline(rightArm, 1.08);
      rightArmPivot.add(rightArm);

      const rightHand = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.13, 0)), gauntletMetalMat);
      rightHand.position.y = -0.82;
      rightArmPivot.add(rightHand);

      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.42, 1.88, 0.08);
      puppeteerRoot.add(leftArmPivot);

      const leftArm = new THREE.Mesh(armGeo, cloakMat);
      leftArm.position.y = -0.35;
      addCelOutline(leftArm, 1.08);
      leftArmPivot.add(leftArm);

      const leftHand = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.13, 0)), gauntletMetalMat);
      leftHand.position.y = -0.82;
      leftArmPivot.add(leftHand);

      // (10) Orbiting Sovereign Marionette Crossbar behind Puppeteer's back
      const heroCrossbar = new THREE.Group();
      heroCrossbar.position.set(0, 2.25, -0.65);
      puppeteerRoot.add(heroCrossbar);
      const barMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xf43f5e,
          emissive: 0x9f1239,
          emissiveIntensity: 0.45,
          gradientMap: toonGradTex
        })
      );
      const barA = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.1, 0.1)), barMat);
      addCelOutline(barA, 1.08);
      heroCrossbar.add(barA);
      const barB = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 2.1, 0.1)), barMat);
      addCelOutline(barB, 1.08);
      heroCrossbar.add(barB);

      // Contact Shadow Disc under Puppeteer
      const contactShadow = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(1.35, 32)),
        trackMat(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }))
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = 0.02;
      scene.add(contactShadow);

      // 9. Colossal Composite 11-Part "Shin-en no Kugutsu" Sovereign Phantom Puppet Colossus
      const colossusGroup = new THREE.Group();
      colossusGroup.position.set(0, -10, -4.5);
      scene.add(colossusGroup);

      const colArmorMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0x1e1b4b,
          gradientMap: toonGradTex
        })
      );
      const colMaskMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xf5f3ff,
          gradientMap: toonGradTex
        })
      );
      const colGlowMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e
        })
      );

      // Colossal Ribcage Torso
      const colTorso = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.4, 5.4, 7)), colArmorMat);
      colTorso.rotation.z = Math.PI;
      colTorso.position.y = 4.6;
      addCelOutline(colTorso, 1.05);
      colossusGroup.add(colTorso);

      // Heart Soul Core Orb inside Ribcage
      const colCore = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.95, 1)),
        trackMat(new THREE.MeshBasicMaterial({ color: 0xe879f9 }))
      );
      colCore.position.set(0, 5.1, 1.1);
      colossusGroup.add(colCore);

      // Horned Kabuki/Shinobi Porcelain Mask Head
      const colHead = new THREE.Group();
      colHead.position.set(0, 8.2, 0.55);
      colossusGroup.add(colHead);

      const maskFace = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(1.35, 0)), colMaskMat);
      maskFace.scale.set(0.95, 1.25, 0.85);
      addCelOutline(maskFace, 1.06);
      colHead.add(maskFace);

      // Twin Giant Oni/Puppet Horns
      const hornGeo = trackGeo(new THREE.ConeGeometry(0.28, 2.3, 6));
      const hornL = new THREE.Mesh(hornGeo, gauntletMetalMat);
      hornL.position.set(-0.95, 1.35, 0.25);
      hornL.rotation.z = 0.48;
      addCelOutline(hornL, 1.06);
      colHead.add(hornL);

      const hornR = new THREE.Mesh(hornGeo, gauntletMetalMat);
      hornR.position.set(0.95, 1.35, 0.25);
      hornR.rotation.z = -0.48;
      addCelOutline(hornR, 1.06);
      colHead.add(hornR);

      // Colossal Glowing Slit Eyes
      const cEyeL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 0.16, 0.25)), colGlowMat);
      cEyeL.position.set(-0.48, 0.15, 1.08);
      cEyeL.rotation.z = -0.25;
      colHead.add(cEyeL);

      const cEyeR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 0.16, 0.25)), colGlowMat);
      cEyeR.position.set(0.48, 0.15, 1.08);
      cEyeR.rotation.z = 0.25;
      colHead.add(cEyeR);

      // Colossal Scythe-Claw Arms (Left & Right)
      const colLeftArm = new THREE.Group();
      colLeftArm.position.set(-3.1, 6.5, 0.6);
      colossusGroup.add(colLeftArm);
      const scyBladeGeo = trackGeo(new THREE.ConeGeometry(0.55, 4.6, 5));
      const scyArmL = new THREE.Mesh(scyBladeGeo, barMat);
      scyArmL.position.set(-1.3, -1.6, 0.9);
      scyArmL.rotation.z = -2.35;
      addCelOutline(scyArmL, 1.06);
      colLeftArm.add(scyArmL);

      const colRightArm = new THREE.Group();
      colRightArm.position.set(3.1, 6.5, 0.6);
      colossusGroup.add(colRightArm);
      const scyArmR = new THREE.Mesh(scyBladeGeo, barMat);
      scyArmR.position.set(1.3, -1.6, 0.9);
      scyArmR.rotation.z = 2.35;
      addCelOutline(scyArmR, 1.06);
      colRightArm.add(scyArmR);

      // Giant Sky-Bound Puppetry X-Crossbar Frame behind Colossus
      const giantCrossbar = new THREE.Group();
      giantCrossbar.position.set(0, 10.2, -1.8);
      colossusGroup.add(giantCrossbar);
      const gBar1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(14.5, 0.42, 0.42)), gauntletMetalMat);
      addCelOutline(gBar1, 1.04);
      giantCrossbar.add(gBar1);
      const gBar2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 14.5, 0.42)), gauntletMetalMat);
      addCelOutline(gBar2, 1.04);
      giantCrossbar.add(gBar2);

      // 10. Dynamic Glowing Fate Threads (TubeGeometry ribbons connecting Puppeteer -> Arena -> Sky Crossbar)
      const threadGroup = new THREE.Group();
      scene.add(threadGroup);
      const threadMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending
        })
      );
      const threadFuchsiaMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        })
      );

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const rad = 5.5 + (i % 3) * 2.8;
        const pStart = new THREE.Vector3(
          i % 2 === 0 ? 0.5 : -0.5,
          2.05,
          0.95
        );
        const pMid = new THREE.Vector3(
          Math.cos(ang) * rad * 0.55,
          4.2 + (i % 4) * 1.4,
          Math.sin(ang) * rad * 0.55
        );
        const pEnd = new THREE.Vector3(
          Math.cos(ang) * rad,
          0.15,
          Math.sin(ang) * rad
        );
        const curve = new THREE.CatmullRomCurve3([pStart, pMid, pEnd]);
        const tGeo = trackGeo(new THREE.TubeGeometry(curve, 18, 0.032, 6, false));
        const tMesh = new THREE.Mesh(tGeo, i % 2 === 0 ? threadMat : threadFuchsiaMat);
        threadGroup.add(tMesh);
      }

      // 11. InstancedMesh #1: 28 Cel-Shaded Suspended Marionette Dolls + InstancedMesh #2: 28 Vertical Fate Strings
      const puppetCount = 28;
      const puppetBodyGeo = trackGeo(new THREE.ConeGeometry(0.46, 1.65, 6));
      const puppetBodyMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xc026d3,
          emissive: 0x701a75,
          emissiveIntensity: 0.45,
          gradientMap: toonGradTex
        })
      );
      const puppetsInst = new THREE.InstancedMesh(puppetBodyGeo, puppetBodyMat, puppetCount);
      puppetsInst.frustumCulled = false;
      scene.add(puppetsInst);

      const stringGeo = trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 16, 5));
      const stringMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending
        })
      );
      const stringsInst = new THREE.InstancedMesh(stringGeo, stringMat, puppetCount);
      stringsInst.frustumCulled = false;
      scene.add(stringsInst);

      const puppetMeta: { angle: number; dist: number; baseY: number; phase: number }[] = [];
      for (let i = 0; i < puppetCount; i++) {
        const ring = i < 12 ? 0 : 1;
        const idxInRing = ring === 0 ? i : i - 12;
        const totalInRing = ring === 0 ? 12 : 16;
        const angle = (idxInRing / totalInRing) * Math.PI * 2 + ring * 0.22;
        const dist = ring === 0 ? 5.2 + (i % 2) * 1.1 : 9.4 + (i % 3) * 1.2;
        puppetMeta.push({
          angle,
          dist,
          baseY: 1.6 + (i % 3) * 0.9,
          phase: i * 0.7
        });
        _tmpColor.setHex(i % 2 === 0 ? 0xe879f9 : 0xf43f5e);
        puppetsInst.setColorAt(i, _tmpColor);
      }
      if (puppetsInst.instanceColor) puppetsInst.instanceColor.needsUpdate = true;

      // 12. 3D Anime Action Speedlines Cone around Camera (ShaderMaterial!)
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
              float rnd = hash(id * 13.7 + floor(uTime * 18.0));

              float lineMask = smoothstep(0.32, 0.0, abs(localX - 0.5)) * step(0.62, rnd);
              float edgeFade = smoothstep(0.05, 0.42, vUv.y) * (1.0 - smoothstep(0.68, 0.96, vUv.y));
              vec3 col = mix(vec3(1.0, 0.25, 0.55), vec3(1.0, 0.96, 1.0), rnd);

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

      // 13. Multi-Layer Impact Shockwave Domes & Expanding Thread Rings
      const impactDomeMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
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
          color: 0xf0abfc,
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

      // 14. InstancedMesh #3: 48 Crimson Shattered Theater Shards (fly outward on impact)
      const shardCount = 48;
      const shardGeo = trackGeo(new THREE.TetrahedronGeometry(0.32, 0));
      const shardMat = trackMat(
        new THREE.MeshToonMaterial({
          color: 0xf43f5e,
          emissive: 0x9f1239,
          emissiveIntensity: 0.75,
          gradientMap: toonGradTex
        })
      );
      const shardsInst = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
      shardsInst.frustumCulled = false;
      shardsInst.visible = false;
      const shardVel: { vx: number; vy: number; vz: number; rx: number; ry: number; s: number }[] = [];
      for (let i = 0; i < shardCount; i++) {
        const ang = (i / shardCount) * Math.PI * 2 + Math.random() * 0.35;
        const spd = 5.5 + Math.random() * 11.5;
        shardVel.push({
          vx: Math.cos(ang) * spd,
          vy: 4.5 + Math.random() * 10.5,
          vz: Math.sin(ang) * spd,
          rx: (Math.random() - 0.5) * 9,
          ry: (Math.random() - 0.5) * 9,
          s: 0.65 + Math.random() * 1.15
        });
      }
      scene.add(shardsInst);

      // 15. Swirling Soul Petals & Sparks (280 Points)
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
          color: 0xf472b6,
          size: 0.19,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
      scene.add(sparkPoints);

      // Pre-warm shaders only on hardware GPU
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
      let currentAct: CutsceneAct = 'eye_awakening';
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

        // UI State updates only when meaningful thresholds cross
        let nextAct: CutsceneAct = 'eye_awakening';
        if (progress >= 0.86) nextAct = 'curtain_return';
        else if (progress >= 0.68) nextAct = 'impact_requiem';
        else if (progress >= 0.24) nextAct = 'domain_theater';

        if (nextAct !== currentAct) {
          currentAct = nextAct;
          setAct(nextAct);
        }
        setUiProgress(Math.round(progress * 100));

        // Signature Anime High-Contrast Black & White Impact Frame (0.685 -> 0.745)
        const inImpactFlash = progress >= 0.685 && progress <= 0.745;
        if (inImpactFlash !== lastFlashState) {
          lastFlashState = inImpactFlash;
          setImpactFlash(inImpactFlash);
        }
        const flashVal = inImpactFlash ? 1.0 : 0.0;

        // Shader uniforms
        skyUniforms.uTime.value = elapsed;
        skyUniforms.uFlash.value = flashVal;
        magicCircleUniforms.uTime.value = elapsed;
        magicCircleUniforms.uFlash.value = flashVal;
        speedlineUniforms.uTime.value = elapsed;

        let impactVal = 0;

        // Animate Hero Crossbar & Arms smoothly across Acts
        heroCrossbar.rotation.z = elapsed * 1.45;
        colCore.rotation.y = elapsed * 2.2;
        colCore.rotation.x = elapsed * 1.1;
        giantCrossbar.rotation.z = -elapsed * 0.55;

        if (progress < 0.24) {
          // ACT I: Dramatic Anime Eye Close-up & Fate Thread Awakening
          const t1 = progress / 0.24;
          speedlineUniforms.uIntensity.value = 0.85 + Math.sin(t1 * Math.PI) * 0.45;
          magicCircleUniforms.uAlpha.value = 0.35 + t1 * 0.55;
          colossusGroup.position.y = -11.5;

          // Dramatic Dutch-tilt eye close-up sweep
          eyeFlashBeamMat.opacity = 0.45 + Math.sin(elapsed * 18) * 0.45;
          eyeFlashBeam.scale.x = 0.6 + t1 * 1.9;
          rightArmPivot.rotation.set(-0.9 - t1 * 0.8, 0, -0.35);
          leftArmPivot.rotation.set(-0.5 - t1 * 0.6, 0, 0.4);
          threadGroup.scale.setScalar(0.35 + t1 * 0.65);

          // Suspended dolls fade in
          for (let i = 0; i < puppetCount; i++) {
            const m = puppetMeta[i];
            const sway = Math.sin(elapsed * 2.2 + m.phase) * 0.14;
            _dummy.position.set(
              Math.cos(m.angle) * m.dist,
              m.baseY + Math.sin(elapsed * 1.8 + m.phase) * 0.25,
              Math.sin(m.angle) * m.dist
            );
            _dummy.rotation.set(sway, -m.angle + Math.PI / 2, 0.22 * (1 - t1));
            _dummy.scale.setScalar(0.4 + t1 * 0.6);
            _dummy.updateMatrix();
            puppetsInst.setMatrixAt(i, _dummy.matrix);

            _dummy.position.set(Math.cos(m.angle) * m.dist, m.baseY + 8.0, Math.sin(m.angle) * m.dist);
            _dummy.rotation.set(0, 0, 0);
            _dummy.scale.set(1, 1, 1);
            _dummy.updateMatrix();
            stringsInst.setMatrixAt(i, _dummy.matrix);
          }
          puppetsInst.instanceMatrix.needsUpdate = true;
          stringsInst.instanceMatrix.needsUpdate = true;

          camera.fov = THREE.MathUtils.lerp(36, 44, t1);
          camera.updateProjectionMatrix();
          _camTarget.set(
            THREE.MathUtils.lerp(0.65, -0.75, t1),
            THREE.MathUtils.lerp(2.55, 2.7, t1),
            THREE.MathUtils.lerp(2.55, 3.8, t1)
          );
          _lookTarget.set(0, 2.42, 0.82);
        } else if (progress < 0.68) {
          // ACT II: Domain Expansion — Crimson Moon Marionette Theatre & Colossus Rise
          const t2 = (progress - 0.24) / 0.44;
          const riseEase = 1 - Math.pow(1 - Math.min(1, t2 * 1.25), 3);

          speedlineUniforms.uIntensity.value = 0.28 + t2 * 0.35;
          magicCircleUniforms.uAlpha.value = 0.92;
          eyeFlashBeamMat.opacity = 0.25;
          eyeFlashBeam.scale.x = 0.8;

          // Colossus rises majestically behind Puppeteer
          colossusGroup.position.y = THREE.MathUtils.lerp(-10.5, 0.2, riseEase);
          colLeftArm.rotation.z = Math.sin(t2 * Math.PI * 1.5) * 0.32;
          colRightArm.rotation.z = -Math.sin(t2 * Math.PI * 1.5) * 0.32;

          // Puppeteer commands the strings, then prepares the finger snap
          rightArmPivot.rotation.set(-1.9 - Math.sin(elapsed * 4) * 0.18, 0.2, -0.45);
          leftArmPivot.rotation.set(-1.6 + Math.sin(elapsed * 4) * 0.18, -0.2, 0.45);
          threadGroup.scale.setScalar(1.0);

          // All 28 marionettes snap into upright combat stance in concentric dance
          for (let i = 0; i < puppetCount; i++) {
            const m = puppetMeta[i];
            const orbit = m.angle + elapsed * 0.32;
            const py = m.baseY + Math.sin(elapsed * 3.0 + m.phase) * 0.35;
            _dummy.position.set(Math.cos(orbit) * m.dist, py, Math.sin(orbit) * m.dist);
            _dummy.rotation.set(0.18, -orbit + Math.PI / 2, 0);
            _dummy.scale.setScalar(1.05);
            _dummy.updateMatrix();
            puppetsInst.setMatrixAt(i, _dummy.matrix);

            _dummy.position.set(Math.cos(orbit) * m.dist, py + 8.0, Math.sin(orbit) * m.dist);
            _dummy.rotation.set(0, 0, 0);
            _dummy.scale.set(1, 1, 1);
            _dummy.updateMatrix();
            stringsInst.setMatrixAt(i, _dummy.matrix);
          }
          puppetsInst.instanceMatrix.needsUpdate = true;
          stringsInst.instanceMatrix.needsUpdate = true;

          // Dramatic sweeping wide anime crane orbit
          camera.fov = THREE.MathUtils.lerp(44, 58, t2);
          camera.updateProjectionMatrix();
          const camOrbit = THREE.MathUtils.lerp(-0.45, 0.55, t2);
          const camRadius = THREE.MathUtils.lerp(9.5, 16.5, riseEase);
          _camTarget.set(
            Math.sin(camOrbit) * camRadius,
            THREE.MathUtils.lerp(2.8, 5.8, t2),
            Math.cos(camOrbit) * camRadius
          );
          _lookTarget.set(0, THREE.MathUtils.lerp(2.6, 4.6, t2), -1.2);
        } else if (progress < 0.86) {
          // ACT III: Climax Finger Snap, Anime Black-White Impact Flash & Crimson Thread Burst
          const t3 = (progress - 0.68) / 0.18;
          impactVal = 1.0 - t3 * 0.4;
          speedlineUniforms.uIntensity.value = 1.15 * (1 - t3 * 0.6);
          magicCircleUniforms.uAlpha.value = 1.0;

          colossusGroup.position.y = 0.2;
          colLeftArm.rotation.z = THREE.MathUtils.lerp(0.25, -0.85, Math.min(1, t3 * 2.2));
          colRightArm.rotation.z = THREE.MathUtils.lerp(-0.25, 0.85, Math.min(1, t3 * 2.2));

          // Puppeteer snaps right arm down sharply
          rightArmPivot.rotation.set(-2.5 + t3 * 1.4, 0, -0.2);
          leftArmPivot.rotation.set(-1.3, 0, 0.65);

          impactDome.visible = true;
          const domeScale = 1.2 + t3 * 22.0;
          impactDome.scale.set(domeScale, domeScale * 0.72, domeScale);
          impactDomeMat.opacity = Math.max(0, (1 - t3) * 0.72);

          shockRing.visible = true;
          const ringScale = 1.5 + t3 * 24.0;
          shockRing.scale.setScalar(ringScale);
          shockRingMat.opacity = Math.max(0, (1 - t3) * 0.92);

          // Shattered Crimson Theater Shards bursting outward
          shardsInst.visible = true;
          for (let i = 0; i < shardCount; i++) {
            const sv = shardVel[i];
            const flyT = t3 * 1.1;
            const sy = Math.max(0.15, 1.4 + sv.vy * flyT - 9.2 * flyT * flyT);
            _dummy.position.set(sv.vx * flyT, sy, sv.vz * flyT);
            _dummy.rotation.set(sv.rx * flyT, sv.ry * flyT, flyT * 4.0);
            _dummy.scale.setScalar(sv.s * Math.max(0.05, 1 - t3 * 0.65));
            _dummy.updateMatrix();
            shardsInst.setMatrixAt(i, _dummy.matrix);
          }
          shardsInst.instanceMatrix.needsUpdate = true;

          // Shake impulse during impact burst
          const shakeMag = Math.max(0, (1 - t3 * 1.5)) * 0.42;
          camera.fov = THREE.MathUtils.lerp(62, 50, t3);
          camera.updateProjectionMatrix();
          _camTarget.set(
            Math.sin(elapsed * 48) * shakeMag,
            4.8 + Math.cos(elapsed * 42) * shakeMag,
            14.2
          );
          _lookTarget.set(0, 3.2, -0.5);
        } else {
          // ACT IV: Curtain Rise — Smooth Crane Ascension Back to Battle Stance
          const t4 = (progress - 0.86) / 0.14;
          impactVal = (1 - t4) * 0.35;
          speedlineUniforms.uIntensity.value = 0.0;
          impactDome.visible = false;
          shockRing.visible = false;
          shardsInst.visible = false;
          magicCircleUniforms.uAlpha.value = 0.92 * (1 - t4 * 0.45);
          colossusGroup.position.y = THREE.MathUtils.lerp(0.2, -1.8, t4);

          camera.fov = THREE.MathUtils.lerp(50, 46, t4);
          camera.updateProjectionMatrix();
          _camTarget.set(
            THREE.MathUtils.lerp(0, -1.4, t4),
            THREE.MathUtils.lerp(5.2, 12.2, t4),
            THREE.MathUtils.lerp(14.2, 10.8, t4)
          );
          _lookTarget.set(0, THREE.MathUtils.lerp(3.0, 1.2, t4), 0);
        }

        skyUniforms.uImpact.value = impactVal;
        magicCircleUniforms.uImpact.value = impactVal;
        coreAuraLight.position.set(0, 3.0 + Math.sin(elapsed * 4) * 0.3, 1.2);
        coreAuraLight.intensity = 3.5 + impactVal * 5.0;

        // Animate swirling soul embers
        const sAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
        const sArr = sAttr.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          const baseAng = sparkMeta[i * 3];
          const rad = sparkMeta[i * 3 + 1];
          const spd = sparkMeta[i * 3 + 2];
          const a = baseAng + elapsed * (0.5 + impactVal * 1.1);
          sArr[i * 3] = Math.cos(a) * (rad + impactVal * 3.0);
          sArr[i * 3 + 1] = (elapsed * spd + i * 0.41) % 14;
          sArr[i * 3 + 2] = Math.sin(a) * (rad + impactVal * 3.0);
        }
        sAttr.needsUpdate = true;

        // Snappy yet silky exponential camera damping
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
      aria-label="Cutscene Anime 3D Soul Puppeteer Infinite Marionette Theatre"
    >
      {/* Dedicated Canvas Mount (100% Unobstructed Center) */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Brief Signature Anime Sakuga Impact Flash Vignette */}
      {impactFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border-8 border-white/80 mix-blend-difference"
        />
      )}

      {/* Top Anime Letterbox Bar & Title Header (No backdrop-blur, no static pills) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black via-black/85 to-transparent px-5 sm:px-8 pt-4 pb-7 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-game font-semibold tracking-wider text-rose-300">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>Soul Puppeteer</span>
            <span aria-hidden="true">·</span>
            <span>Ryoiki Tenkai: Kugutsu Kyoko</span>
          </div>
          <h2 className="mt-1 font-title text-xl sm:text-3xl font-black tracking-wide text-white drop-shadow text-balance">
            INFINITE MARIONETTE THEATRE · DOMAIN REQUIEM
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-game font-semibold text-fuchsia-200/95 tracking-wide">
            {ACT_LABELS[act]}
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right text-xs font-mono tabular-nums text-rose-200/90">
          <span className="text-[11px] font-semibold text-fuchsia-300">Tempaan Jiwa</span>
          <span className="text-base font-bold text-white">{soulCount}/30 Soul</span>
        </div>
      </div>

      {/* Bottom Anime Letterbox Dock & Skip Action */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-5 sm:px-8 pt-7 pb-5 flex items-end justify-between gap-4">
        <div className="pointer-events-none flex items-center gap-2 text-xs font-game text-fuchsia-100/85 tracking-wide">
          <span>Cel-Shaded Anime</span>
          <span aria-hidden="true">·</span>
          <span>Benang Takdir</span>
          <span aria-hidden="true">·</span>
          <span>Raja Marionet</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums font-semibold text-rose-300">{uiProgress}%</span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-950/95 hover:bg-slate-900 border border-fuchsia-400/60 hover:border-rose-300 text-slate-100 font-game font-semibold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-fuchsia-300" />
        </button>
      </div>

      {/* Bottom Crimson-Violet Progress Line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-fuchsia-400 to-purple-200 transition-[width] duration-100"
          style={{ width: `${uiProgress}%` }}
        />
      </div>
    </div>
  );
};
