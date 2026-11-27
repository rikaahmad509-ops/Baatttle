import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Crown, FastForward } from 'lucide-react';

interface MonkeyKingGreatSage3DCutsceneProps {
  remainingTime: number;
  totalDuration?: number;
  sageStacks?: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

type CutsceneAct = 'army' | 'ascent' | 'heaven_cleave' | 'return';

const ACT_LABELS: Record<CutsceneAct, string> = {
  army: 'BABAK I · 72 TRANSFORMASI — BANGKITNYA PASUKAN KERA EMAS',
  ascent: 'BABAK II · MENEMBUS GERBANG SEMBILAN LANGIT & SEGEL DHARMA',
  heaven_cleave: 'BABAK III · RUYI JINGU BANG RAKSASA — HANTAMAN PEMECAH LANGIT!',
  return: 'BABAK IV · QI TIAN DA SHENG — KEMBALI KE PERTEMPURAN!'
};

// Zero-GC module-scoped math helpers
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 2.2, 0);
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();

export const MonkeyKingGreatSage3DCutscene: React.FC<MonkeyKingGreatSage3DCutsceneProps> = ({
  remainingTime,
  totalDuration = 6.2,
  sageStacks = 0,
  onSkip,
  onWebGLUnavailable
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const remainingRef = useRef<number>(remainingTime);
  const lastSyncTimeRef = useRef<number>(performance.now());
  const onSkipRef = useRef(onSkip);
  const onFallbackRef = useRef(onWebGLUnavailable);

  const [act, setAct] = useState<CutsceneAct>('army');
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
      scene.background = new THREE.Color(0x0c0716);
      scene.fog = new THREE.FogExp2(0x160c26, 0.015);

      const camera = new THREE.PerspectiveCamera(
        48,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1,
        240
      );
      camera.position.set(0, 3.6, 13.5);
      _currentLook.set(0, 2.2, 0);
      camera.lookAt(_currentLook);

      // 2. Mandatory RoomEnvironment Studio Reflections
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      trackTex(envRT.texture);
      envRT.dispose();
      pmremGenerator.dispose();

      // 3. Balanced 3-Point Celestial Lighting Rig (Warm Gold Key + Cool Twilight Hemisphere + Crimson Rim)
      const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x7c2d12, 0.72);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffedd5, 2.7);
      keyLight.position.set(14, 24, 12);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -16;
      keyLight.shadow.camera.right = 16;
      keyLight.shadow.camera.top = 16;
      keyLight.shadow.camera.bottom = -16;
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 55;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.85);
      rimLight.position.set(-14, 9, -15);
      scene.add(rimLight);

      const heroAuraLight = new THREE.PointLight(0xfbbf24, 16, 26, 1.6);
      heroAuraLight.position.set(0, 3.2, 1.5);
      scene.add(heroAuraLight);

      const impactBurstLight = new THREE.PointLight(0xfef08a, 0, 50, 1.4);
      impactBurstLight.position.set(0, 2.0, 0);
      scene.add(impactBurstLight);

      // 4. Custom GLSL Nine Heavens Cosmic Sky Dome (golden aurora bands & celestial sunset stars)
      const skyUniforms = {
        uTime: { value: 0 },
        uImpact: { value: 0 }
      };
      const skyMat = trackMat(
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: skyUniforms,
          vertexShader: `
            varying vec3 vWorldDir;
            void main() {
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vWorldDir = normalize(worldPos.xyz);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform float uImpact;
            varying vec3 vWorldDir;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            void main() {
              float h = clamp(vWorldDir.y * 0.5 + 0.5, 0.0, 1.0);
              vec3 zenith = vec3(0.05, 0.03, 0.14);
              vec3 midSky = vec3(0.18, 0.07, 0.25);
              vec3 horizon = vec3(0.75, 0.34, 0.09);

              vec3 col = mix(horizon, midSky, smoothstep(0.32, 0.62, h));
              col = mix(col, zenith, smoothstep(0.58, 0.96, h));

              // Celestial golden aurora ribbons sweeping through the heavens
              float angle = atan(vWorldDir.z, vWorldDir.x);
              float ribbon = sin(angle * 5.0 + uTime * 0.9 + vWorldDir.y * 8.0) * 0.5 + 0.5;
              float ribbonMask = smoothstep(0.25, 0.72, h) * (1.0 - smoothstep(0.72, 0.98, h));
              col += vec3(1.0, 0.72, 0.22) * pow(ribbon, 3.0) * ribbonMask * (0.28 + uImpact * 0.55);

              // Subtle golden starfield near upper sky
              vec2 starUv = floor(vec2(angle * 34.0, vWorldDir.y * 48.0));
              float starVal = step(0.985, hash(starUv)) * smoothstep(0.45, 0.85, h);
              col += vec3(1.0, 0.92, 0.65) * starVal * 0.9;

              // Impact flash tint across sky
              col += vec3(1.0, 0.85, 0.4) * uImpact * 0.32;

              gl_FragColor = vec4(col, 1.0);
            }
          `
        })
      );
      const skyDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(120, 32, 24)), skyMat);
      scene.add(skyDome);

      // 5. Procedural Jade Courtyard Platform with Custom GLSL Tectonic Golden Fissure Shader
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const jadeCanvas = document.createElement('canvas');
      jadeCanvas.width = 512;
      jadeCanvas.height = 512;
      const jctx = jadeCanvas.getContext('2d');
      if (jctx) {
        jctx.fillStyle = '#1b202e';
        jctx.fillRect(0, 0, 512, 512);
        // Concentric temple marble rings
        const ringColors = ['#2b3348', '#453424', '#1f293d', '#5c431f'];
        for (let r = 230; r >= 40; r -= 42) {
          jctx.strokeStyle = ringColors[(r / 42) | 0 % ringColors.length] || '#854d0e';
          jctx.lineWidth = 4;
          jctx.beginPath();
          jctx.arc(256, 256, r, 0, Math.PI * 2);
          jctx.stroke();
        }
        // Radial stone tile joints
        jctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
        jctx.lineWidth = 2;
        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * Math.PI * 2;
          jctx.beginPath();
          jctx.moveTo(256 + Math.cos(ang) * 32, 256 + Math.sin(ang) * 32);
          jctx.lineTo(256 + Math.cos(ang) * 246, 256 + Math.sin(ang) * 246);
          jctx.stroke();
        }
        // Center Taiji / Bagua crest circle
        jctx.strokeStyle = '#fbbf24';
        jctx.lineWidth = 5;
        jctx.beginPath();
        jctx.arc(256, 256, 48, 0, Math.PI * 2);
        jctx.stroke();
      }
      const jadeTex = trackTex(new THREE.CanvasTexture(jadeCanvas));
      jadeTex.colorSpace = THREE.SRGBColorSpace;
      jadeTex.anisotropy = maxAniso;

      const fissureUniforms = {
        uImpact: { value: 0 },
        uTime: { value: 0 }
      };

      const courtyardMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: jadeTex,
          roughness: 0.46,
          metalness: 0.24
        })
      );
      courtyardMat.onBeforeCompile = (shader) => {
        shader.uniforms.uImpact = fissureUniforms.uImpact;
        shader.uniforms.uTime = fissureUniforms.uTime;
        shader.vertexShader = `varying vec3 vCourtPos;\n${shader.vertexShader}`.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>\n  vCourtPos = position;`
        );
        shader.fragmentShader = `
          uniform float uImpact;
          uniform float uTime;
          varying vec3 vCourtPos;
          ${shader.fragmentShader}
        `.replace(
          '#include <emissivemap_fragment>',
          `
          #include <emissivemap_fragment>
          float rad = length(vCourtPos.xz);
          float ang = atan(vCourtPos.z, vCourtPos.x);
          float crackPattern = abs(sin(ang * 9.0 + sin(rad * 1.4) * 1.8));
          float fissureLine = (1.0 - smoothstep(0.0, 0.095, crackPattern)) * smoothstep(0.4, 2.2, rad) * (1.0 - smoothstep(8.5, 11.8, rad));
          float ringShock = smoothstep(0.6, 0.0, abs(rad - (uImpact * 11.5)));
          float glowStrength = uImpact * (fissureLine * 2.4 + ringShock * 1.6);
          totalEmissiveRadiance += vec3(1.0, 0.65, 0.12) * glowStrength;
          `
        );
      };

      const courtyardMesh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(12.2, 11.4, 0.85, 48)),
        courtyardMat
      );
      courtyardMesh.position.y = -0.425;
      courtyardMesh.receiveShadow = !isSoftwareGl;
      scene.add(courtyardMesh);

      // Golden Courtyard Outer Rim Ring (offset slightly to prevent Z-fighting)
      const brushedGoldMat = trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xf59e0b,
          emissive: 0x78350f,
          emissiveIntensity: 0.35,
          metalness: 0.94,
          roughness: 0.18,
          clearcoat: 0.8,
          anisotropy: 0.75
        })
      );
      const courtyardTrim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(12.25, 0.16, 12, 64)),
        brushedGoldMat
      );
      courtyardTrim.rotation.x = Math.PI / 2;
      courtyardTrim.position.y = 0.02;
      scene.add(courtyardTrim);

      // Contact Shadow Disc under Monkey King when grounded
      const contactShadowCanvas = document.createElement('canvas');
      contactShadowCanvas.width = 128;
      contactShadowCanvas.height = 128;
      const csCtx = contactShadowCanvas.getContext('2d');
      if (csCtx) {
        const g = csCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
        g.addColorStop(0, 'rgba(0,0,0,0.65)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.22)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        csCtx.fillStyle = g;
        csCtx.fillRect(0, 0, 128, 128);
      }
      const contactShadowTex = trackTex(new THREE.CanvasTexture(contactShadowCanvas));
      const contactShadow = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(3.2, 3.2)),
        trackMat(new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.55 }))
      );
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = 0.025;
      scene.add(contactShadow);

      // 6. Nine Heavens Celestial Jade Pillars (Surrounding Outer Gate, 8 composite pillars)
      const jadePillarMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.58,
          metalness: 0.18
        })
      );
      const jadeAccentMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0f766e,
          emissive: 0x115e59,
          emissiveIntensity: 0.4,
          roughness: 0.3,
          metalness: 0.35
        })
      );

      const pillars: THREE.Group[] = [];
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const pGroup = new THREE.Group();
        const radius = 11.1;
        pGroup.position.set(Math.cos(ang) * radius, 0, Math.sin(ang) * radius);
        pGroup.rotation.y = -ang;

        const basePedestal = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.45, 0.7, 1.45)), jadePillarMat);
        basePedestal.position.y = 0.35;
        pGroup.add(basePedestal);

        const columnShaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.46, 0.55, 6.2, 12)), jadePillarMat);
        columnShaft.position.y = 3.6;
        columnShaft.castShadow = !isSoftwareGl;
        pGroup.add(columnShaft);

        const goldBand = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.56, 0.08, 8, 20)), brushedGoldMat);
        goldBand.rotation.x = Math.PI / 2;
        goldBand.position.y = 5.4;
        pGroup.add(goldBand);

        const capCrystal = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.52, 0)), jadeAccentMat);
        capCrystal.position.y = 7.2;
        pGroup.add(capCrystal);

        scene.add(pGroup);
        pillars.push(pGroup);
      }

      // 7. InstancedMesh Sea of Nine Heavens Clouds (48 sculpted cloud clusters surrounding courtyard)
      const cloudCount = 48;
      const cloudGeo = trackGeo(new THREE.IcosahedronGeometry(1.0, 2));
      const cloudMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfef3c7,
          emissive: 0x92400e,
          emissiveIntensity: 0.25,
          roughness: 0.85,
          metalness: 0.0
        })
      );
      const cloudInst = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudCount);
      cloudInst.frustumCulled = false;
      const cloudBaseData: { ang: number; dist: number; y: number; sx: number; sy: number; sz: number; spd: number }[] = [];
      for (let i = 0; i < cloudCount; i++) {
        const ang = (i / cloudCount) * Math.PI * 2 + (i % 3) * 0.25;
        const dist = 13.5 + (i % 5) * 4.8 + Math.random() * 2.5;
        const y = -2.2 + (i % 4) * 1.15 - (dist - 13) * 0.08;
        const sx = 2.6 + Math.random() * 2.4;
        const sy = 0.85 + Math.random() * 0.7;
        const sz = 2.2 + Math.random() * 1.9;
        cloudBaseData.push({ ang, dist, y, sx, sy, sz, spd: 0.04 + (i % 3) * 0.025 });
        _dummy.position.set(Math.cos(ang) * dist, y, Math.sin(ang) * dist);
        _dummy.scale.set(sx, sy, sz);
        _dummy.rotation.y = ang;
        _dummy.updateMatrix();
        cloudInst.setMatrixAt(i, _dummy.matrix);
        _tmpColor.setHex(i % 2 === 0 ? 0xfef3c7 : 0xfde68a);
        cloudInst.setColorAt(i, _tmpColor);
      }
      cloudInst.instanceMatrix.needsUpdate = true;
      if (cloudInst.instanceColor) cloudInst.instanceColor.needsUpdate = true;
      cloudInst.computeBoundingSphere();
      scene.add(cloudInst);

      // 8. Composite Hero Model: Sun Wukong (Monkey King) + Somersault Cloud + RuYi Jingu Bang (11 parts!)
      const heroRoot = new THREE.Group();
      heroRoot.position.set(0, 0.8, 0);
      scene.add(heroRoot);

      const furMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.85, metalness: 0.05 }));
      const skinMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.72, metalness: 0.05 }));
      const crimsonSilkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0x450a0a, emissiveIntensity: 0.25, roughness: 0.78, metalness: 0.08, side: THREE.DoubleSide }));
      const glowingEyeMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xfef08a }));

      const monkeyBody = new THREE.Group();
      heroRoot.add(monkeyBody);

      // Torso armor
      const torso = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.34, 1.05, 12)), brushedGoldMat);
      torso.position.y = 1.28;
      torso.castShadow = !isSoftwareGl;
      monkeyBody.add(torso);

      // Waist sash & legs
      const sash = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.37, 0.09, 8, 20)), crimsonSilkMat);
      sash.rotation.x = Math.PI / 2;
      sash.position.y = 0.82;
      monkeyBody.add(sash);

      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(trackGeo(new THREE.CapsuleGeometry(0.14, 0.52, 6, 10)), furMat);
        leg.position.set(side * 0.2, 0.42, 0);
        leg.castShadow = !isSoftwareGl;
        monkeyBody.add(leg);

        const pauldron = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.28, 0.42, 8)), brushedGoldMat);
        pauldron.rotation.z = side * -1.05;
        pauldron.position.set(side * 0.56, 1.72, 0);
        monkeyBody.add(pauldron);
      }

      // Sculpted Monkey Head + Golden Tightening Circlet + Twin Sweeping Phoenix Plumes
      const head = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.32, 16, 14)), skinMat);
      head.position.y = 2.08;
      head.castShadow = !isSoftwareGl;
      monkeyBody.add(head);

      const mane = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.35, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.65)), furMat);
      mane.position.set(0, 2.13, -0.05);
      mane.rotation.x = -0.3;
      monkeyBody.add(mane);

      const circlet = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.33, 0.045, 8, 24)), brushedGoldMat);
      circlet.rotation.x = Math.PI / 2 - 0.15;
      circlet.position.y = 2.22;
      monkeyBody.add(circlet);

      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.048, 8, 8)), glowingEyeMat);
        eye.position.set(side * 0.11, 2.1, 0.28);
        monkeyBody.add(eye);

        // Twin long sweeping Phoenix Plumes built via TubeGeometry
        const plumeCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.22, 2.28, -0.04),
          new THREE.Vector3(side * 0.55, 2.68, -0.45),
          new THREE.Vector3(side * 0.85, 2.95, -1.18),
          new THREE.Vector3(side * 1.05, 2.75, -1.85)
        ]);
        const plumeMesh = new THREE.Mesh(
          trackGeo(new THREE.TubeGeometry(plumeCurve, 18, 0.045, 6, false)),
          crimsonSilkMat
        );
        monkeyBody.add(plumeMesh);
      }

      // Flowing Crimson Battle Cape
      const capeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.75, -0.26),
        new THREE.Vector3(0, 1.35, -0.68),
        new THREE.Vector3(0, 0.72, -1.05)
      ]);
      const capeMesh = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(capeCurve, 10, 0.36, 8, false)),
        crimsonSilkMat
      );
      capeMesh.scale.set(1.4, 1.0, 0.25);
      monkeyBody.add(capeMesh);

      // Somersault Cloud (Jindou Yun) beneath Monkey King's feet
      const kintonGroup = new THREE.Group();
      heroRoot.add(kintonGroup);
      const kintonMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.75,
          roughness: 0.65,
          metalness: 0.05
        })
      );
      const kintonOffsets = [
        [0, -0.15, 0, 1.05, 0.42, 0.85],
        [-0.75, -0.22, 0.1, 0.68, 0.34, 0.62],
        [0.75, -0.2, -0.1, 0.72, 0.36, 0.64],
        [0, -0.22, -0.58, 0.75, 0.35, 0.65]
      ];
      for (const [kx, ky, kz, sx, sy, sz] of kintonOffsets) {
        const puff = new THREE.Mesh(trackGeo(new THREE.IcosahedronGeometry(0.7, 2)), kintonMat);
        puff.position.set(kx, ky, kz);
        puff.scale.set(sx, sy, sz);
        kintonGroup.add(puff);
      }

      // 9. Hand-Held + Titanic Scaling RuYi Jingu Bang (Composite Banded Weapon with Shader Energy Core!)
      const ruyiPivot = new THREE.Group();
      ruyiPivot.position.set(0.55, 1.35, 0.25);
      heroRoot.add(ruyiPivot);

      const staffCoreUniforms = {
        uTime: { value: 0 },
        uCharge: { value: 0 }
      };
      const staffCrimsonMat = trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0x991b1b,
          emissive: 0xd97706,
          emissiveIntensity: 0.55,
          metalness: 0.65,
          roughness: 0.25,
          clearcoat: 0.9
        })
      );
      staffCrimsonMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = staffCoreUniforms.uTime;
        shader.uniforms.uCharge = staffCoreUniforms.uCharge;
        shader.vertexShader = `varying vec3 vStaffLocal;\n${shader.vertexShader}`.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>\n  vStaffLocal = position;`
        );
        shader.fragmentShader = `
          uniform float uTime;
          uniform float uCharge;
          varying vec3 vStaffLocal;
          ${shader.fragmentShader}
        `.replace(
          '#include <emissivemap_fragment>',
          `
          #include <emissivemap_fragment>
          float helix = sin(vStaffLocal.y * 14.0 - uTime * 9.0 + atan(vStaffLocal.z, vStaffLocal.x) * 3.0);
          float vein = smoothstep(0.65, 0.98, helix);
          totalEmissiveRadiance += vec3(1.0, 0.85, 0.25) * vein * (0.4 + uCharge * 2.5);
          `
        );
      };

      const staffShaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 2.8, 16)), staffCrimsonMat);
      ruyiPivot.add(staffShaft);
      const staffCapTop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.095, 0.09, 0.42, 16)), brushedGoldMat);
      staffCapTop.position.y = 1.48;
      ruyiPivot.add(staffCapTop);
      const staffCapBot = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.09, 0.095, 0.42, 16)), brushedGoldMat);
      staffCapBot.position.y = -1.48;
      ruyiPivot.add(staffCapBot);

      // 10. InstancedMesh 36 Golden Clone Warriors (Spiritual Golden Silhouette Figures)
      const cloneCount = 36;
      const cloneGeo = trackGeo(new THREE.CapsuleGeometry(0.24, 0.72, 4, 8));
      const cloneMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.35,
          roughness: 0.22,
          metalness: 0.85,
          transparent: true,
          opacity: 0.92
        })
      );
      const clonesInst = new THREE.InstancedMesh(cloneGeo, cloneMat, cloneCount);
      clonesInst.frustumCulled = false;
      scene.add(clonesInst);

      // 11. Three Colossal Rotating Celestial Bagua / Dharma Seal Rings (ShaderMaterial!)
      const sealRings: THREE.Mesh[] = [];
      const sealRingMat = trackMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uAlpha: { value: 0.85 }
          },
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
            varying vec2 vUv;
            void main() {
              vec2 p = vUv * 2.0 - 1.0;
              float r = length(p);
              float ang = atan(p.y, p.x);
              float outerBand = smoothstep(0.06, 0.0, abs(r - 0.88));
              float innerBand = smoothstep(0.04, 0.0, abs(r - 0.64));
              float runes = step(0.15, sin(ang * 16.0 + uTime * 2.4)) * smoothstep(0.09, 0.0, abs(r - 0.76));
              float intensity = outerBand + innerBand * 0.85 + runes * 0.9;
              vec3 col = mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.95, 0.6), runes);
              gl_FragColor = vec4(col, clamp(intensity * uAlpha, 0.0, 1.0));
            }
          `
        })
      );

      for (let i = 0; i < 3; i++) {
        const ringMesh = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(14 + i * 3.5, 14 + i * 3.5)), sealRingMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 5.5 + i * 5.2;
        scene.add(ringMesh);
        sealRings.push(ringMesh);
      }

      // 12. Great Sage Golden Nimbus Halo Behind Apex Descent
      const sageHalo = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(3.2, 0.14, 12, 48)),
        trackMat(new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending }))
      );
      scene.add(sageHalo);

      // 13. Multi-Layer Impact Shockwave Domes & Expanding Rings
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
          color: 0xf59e0b,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      const shockRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.78, 1.0, 48)), shockRingMat);
      shockRing.rotation.x = -Math.PI / 2;
      shockRing.position.y = 0.08;
      shockRing.visible = false;
      scene.add(shockRing);

      // 14. InstancedMesh Shattered Jade Debris Shards (54 chunks flying outward on impact)
      const shardCount = 54;
      const shardGeo = trackGeo(new THREE.DodecahedronGeometry(0.28, 0));
      const shardMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          emissive: 0xd97706,
          emissiveIntensity: 0.45,
          roughness: 0.55,
          metalness: 0.25
        })
      );
      const shardsInst = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
      shardsInst.frustumCulled = false;
      shardsInst.visible = false;
      const shardVel: { vx: number; vy: number; vz: number; rx: number; ry: number; s: number }[] = [];
      for (let i = 0; i < shardCount; i++) {
        const ang = (i / shardCount) * Math.PI * 2 + Math.random() * 0.3;
        const spd = 4.5 + Math.random() * 10.5;
        shardVel.push({
          vx: Math.cos(ang) * spd,
          vy: 5.5 + Math.random() * 9.5,
          vz: Math.sin(ang) * spd,
          rx: (Math.random() - 0.5) * 8,
          ry: (Math.random() - 0.5) * 8,
          s: 0.65 + Math.random() * 1.1
        });
      }
      scene.add(shardsInst);

      // 15. Golden Cosmic Spark Particles (320 points)
      const sparkCount = 320;
      const sparkPositions = new Float32Array(sparkCount * 3);
      const sparkMeta = new Float32Array(sparkCount * 3); // angle, radius, speed
      for (let i = 0; i < sparkCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.8 + Math.random() * 9.5;
        const spd = 2.0 + Math.random() * 6.5;
        sparkMeta[i * 3] = ang;
        sparkMeta[i * 3 + 1] = rad;
        sparkMeta[i * 3 + 2] = spd;
        sparkPositions[i * 3] = Math.cos(ang) * rad;
        sparkPositions[i * 3 + 1] = Math.random() * 8;
        sparkPositions[i * 3 + 2] = Math.sin(ang) * rad;
      }
      const sparkGeo = trackGeo(new THREE.BufferGeometry());
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
      const sparkMat = trackMat(
        new THREE.PointsMaterial({
          color: 0xfde047,
          size: 0.24,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending
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

      // Software-WebGL Paced Render Loop
      let isDisposed = false;
      let frameId = 0;
      let prevTime = performance.now();
      let currentAct: CutsceneAct = 'army';
      let lastUiPct = -1;

      const afterDraw = (cb: () => void) => {
        if (!renderer) return;
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

      const startMs = performance.now();

      const tick = () => {
        if (isDisposed || !renderer) return;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
        prevTime = now;

        const sinceSync = (now - lastSyncTimeRef.current) / 1000;
        const liveRemaining = Math.max(0, remainingRef.current - sinceSync);
        const progress = THREE.MathUtils.clamp(1 - liveRemaining / totalDuration, 0, 1);
        const elapsed = (now - startMs) * 0.001;

        const nextAct: CutsceneAct =
          progress < 0.24
            ? 'army'
            : progress < 0.54
              ? 'ascent'
              : progress < 0.84
                ? 'heaven_cleave'
                : 'return';
        if (nextAct !== currentAct) {
          currentAct = nextAct;
          setAct(nextAct);
        }
        const pct = Math.round(progress * 100);
        if (pct !== lastUiPct) {
          lastUiPct = pct;
          setUiProgress(pct);
        }

        // Shader Uniforms
        skyUniforms.uTime.value = elapsed;
        sealRingMat.uniforms.uTime.value = elapsed;
        staffCoreUniforms.uTime.value = elapsed;
        fissureUniforms.uTime.value = elapsed;

        // Swirl surrounding Nine Heavens cloud sea
        for (let i = 0; i < cloudCount; i++) {
          const c = cloudBaseData[i];
          const ang = c.ang + elapsed * c.spd;
          _dummy.position.set(
            Math.cos(ang) * c.dist,
            c.y + Math.sin(elapsed * 0.9 + i) * 0.25,
            Math.sin(ang) * c.dist
          );
          _dummy.scale.set(c.sx, c.sy, c.sz);
          _dummy.rotation.y = ang;
          _dummy.updateMatrix();
          cloudInst.setMatrixAt(i, _dummy.matrix);
        }
        cloudInst.instanceMatrix.needsUpdate = true;

        // Animate Celestial Seal Rings
        for (let i = 0; i < sealRings.length; i++) {
          const ring = sealRings[i];
          ring.rotation.z = elapsed * (i % 2 === 0 ? 0.85 : -1.1);
          const ringVisibleScale = progress < 0.72 ? 1.0 : Math.max(0.01, 1.0 - (progress - 0.72) * 3.5);
          ring.scale.setScalar(ringVisibleScale);
        }

        // Act Choreography
        let impactVal = 0;
        if (progress < 0.24) {
          // Act I: Rising on Somersault Cloud + 72-Hair Golden Clone Formation
          const t1 = progress / 0.24;
          heroRoot.position.set(0, 0.85 + Math.sin(elapsed * 3.2) * 0.16, 0);
          monkeyBody.rotation.set(0.08, Math.sin(t1 * Math.PI) * 0.4, 0);
          kintonGroup.visible = true;
          kintonGroup.scale.setScalar(1.0);

          ruyiPivot.position.set(0.55, 1.35, 0.25);
          ruyiPivot.rotation.set(0.25, 0, -0.45 - t1 * 0.3);
          ruyiPivot.scale.setScalar(1.0);
          staffCoreUniforms.uCharge.value = t1 * 0.45;
          sageHalo.material.opacity = 0;

          // 36 Clones burst outward into spiraling formation around Monkey King
          const formEase = THREE.MathUtils.smoothstep(t1, 0.12, 0.95);
          for (let i = 0; i < cloneCount; i++) {
            const ang = (i / cloneCount) * Math.PI * 2 + elapsed * 1.4;
            const ringTier = i % 3;
            const rad = formEase * (2.8 + ringTier * 1.65);
            const h = 0.6 + formEase * (1.2 + ringTier * 1.3) + Math.sin(elapsed * 4 + i) * 0.2;
            _dummy.position.set(Math.cos(ang) * rad, h, Math.sin(ang) * rad);
            _dummy.rotation.set(0, -ang + Math.PI * 0.5, 0);
            _dummy.scale.setScalar(0.1 + formEase * 0.85);
            _dummy.updateMatrix();
            clonesInst.setMatrixAt(i, _dummy.matrix);
          }
          clonesInst.instanceMatrix.needsUpdate = true;

          _camTarget.set(Math.sin(t1 * 1.1) * 5.2, 2.5 + t1 * 1.1, 8.2 - t1 * 1.8);
          _lookTarget.set(0, 2.0, 0);
        } else if (progress < 0.54) {
          // Act II: Skyward Spiral Ascent Through Nine Heavens Dharma Seal Rings
          const t2 = (progress - 0.24) / 0.30;
          const easeAsc = THREE.MathUtils.smoothstep(t2, 0, 1);
          const climbY = THREE.MathUtils.lerp(1.2, 16.5, easeAsc);
          const spiralR = Math.sin(t2 * Math.PI) * 2.2;
          const spiralAng = t2 * Math.PI * 3.0;
          heroRoot.position.set(Math.cos(spiralAng) * spiralR, climbY, Math.sin(spiralAng) * spiralR);
          monkeyBody.rotation.set(-0.35, -spiralAng + Math.PI, 0);
          kintonGroup.scale.setScalar(1.15);

          ruyiPivot.position.set(0, 1.55, 0.45);
          ruyiPivot.rotation.set(1.2, elapsed * 12, 0);
          ruyiPivot.scale.setScalar(1.0 + t2 * 1.4);
          staffCoreUniforms.uCharge.value = 0.45 + t2 * 0.55;
          sageHalo.material.opacity = t2 * 0.55;
          sageHalo.position.copy(heroRoot.position).add(new THREE.Vector3(0, 1.6, -0.6));
          sageHalo.lookAt(camera.position);

          // Golden Clone Comet Streams chasing upward
          for (let i = 0; i < cloneCount; i++) {
            const ang = (i / cloneCount) * Math.PI * 2 + elapsed * 3.8;
            const trailOffset = (i % 6) * 0.65;
            const rad = 2.6 + (i % 4) * 1.25;
            _dummy.position.set(
              heroRoot.position.x + Math.cos(ang) * rad,
              Math.max(0.5, climbY - trailOffset + Math.sin(i + elapsed * 6) * 0.4),
              heroRoot.position.z + Math.sin(ang) * rad
            );
            _dummy.rotation.set(0.55, -ang, 0);
            _dummy.scale.set(0.85, 1.25, 0.85);
            _dummy.updateMatrix();
            clonesInst.setMatrixAt(i, _dummy.matrix);
          }
          clonesInst.instanceMatrix.needsUpdate = true;

          _camTarget.set(
            heroRoot.position.x + Math.cos(spiralAng + 0.9) * 7.5,
            climbY - 2.6,
            heroRoot.position.z + Math.sin(spiralAng + 0.9) * 7.5
          );
          _lookTarget.set(heroRoot.position.x, climbY + 1.5, heroRoot.position.z);
        } else if (progress < 0.84) {
          // Act III: Colossal Heaven-Splitting RuYi Jingu Bang Slam & Cataclysm!
          const t3 = (progress - 0.54) / 0.30;
          const hitT = THREE.MathUtils.clamp((t3 - 0.38) / 0.62, 0, 1);

          if (t3 < 0.38) {
            // Winding up Titanic RuYi at apex before crashing down
            const windT = t3 / 0.38;
            const descY = THREE.MathUtils.lerp(16.5, 4.8, windT * windT);
            heroRoot.position.set(0, descY, 0);
            monkeyBody.rotation.set(0.45, 0, 0);
            kintonGroup.visible = false;

            const titanScale = THREE.MathUtils.lerp(2.4, 7.2, THREE.MathUtils.smoothstep(windT, 0, 1));
            ruyiPivot.position.set(0, 2.2, 1.2);
            ruyiPivot.rotation.set(0.35 - windT * 0.4, 0, 0);
            ruyiPivot.scale.set(titanScale * 0.32, titanScale, titanScale * 0.32);
            staffCoreUniforms.uCharge.value = 1.0;

            sageHalo.position.set(0, descY + 1.8, -0.8);
            sageHalo.scale.setScalar(1.4);
            sageHalo.material.opacity = 0.85;
            sageHalo.lookAt(camera.position);

            // Clones dive in converging golden spear formation
            for (let i = 0; i < cloneCount; i++) {
              const ang = (i / cloneCount) * Math.PI * 2;
              const rad = (1 - windT * 0.65) * (4.0 + (i % 3) * 2.1);
              _dummy.position.set(Math.cos(ang) * rad, descY + 1.5 - windT * 2.5, Math.sin(ang) * rad);
              _dummy.rotation.set(Math.PI * 0.85, -ang, 0);
              _dummy.scale.set(0.7, 1.5, 0.7);
              _dummy.updateMatrix();
              clonesInst.setMatrixAt(i, _dummy.matrix);
            }
            clonesInst.instanceMatrix.needsUpdate = true;

            _camTarget.set(6.5, descY + 1.2, 13.5);
            _lookTarget.set(0, descY * 0.7, 0);
          } else {
            // MASSIVE IMPACT! Colossal RuYi planted into the shattered Jade Courtyard!
            impactVal = Math.min(1, hitT * 1.45);
            heroRoot.position.set(0, 0.05, 0);
            monkeyBody.rotation.set(0.18, 0, 0);
            kintonGroup.visible = false;

            // Colossal Pillar RuYi towering skyward from courtyard center!
            ruyiPivot.position.set(0, 8.2, 0.6);
            ruyiPivot.rotation.set(0.06, elapsed * 0.4, 0);
            ruyiPivot.scale.set(1.9, 6.4, 1.9);
            staffCoreUniforms.uCharge.value = 1.0 - hitT * 0.35;

            sageHalo.position.set(0, 2.2, -0.5);
            sageHalo.scale.setScalar(1.25 + hitT * 0.3);
            sageHalo.material.opacity = Math.max(0, 0.9 - hitT * 0.5);
            sageHalo.lookAt(camera.position);

            // Shockwave Dome + Expanding Ring
            const waveFade = 1 - THREE.MathUtils.smoothstep(hitT, 0.25, 1.0);
            impactDome.visible = waveFade > 0.01;
            impactDome.scale.setScalar(1.2 + hitT * 16.5);
            impactDomeMat.opacity = waveFade * 0.65;

            shockRing.visible = waveFade > 0.01;
            shockRing.scale.setScalar(1.5 + hitT * 20.0);
            shockRingMat.opacity = waveFade * 0.95;

            impactBurstLight.intensity = waveFade * 55;

            // Flying Shattered Jade Debris Shards
            shardsInst.visible = waveFade > 0.01;
            const simT = hitT * 1.35;
            for (let i = 0; i < shardCount; i++) {
              const sv = shardVel[i];
              _dummy.position.set(
                sv.vx * simT,
                Math.max(0.15, sv.vy * simT - 6.8 * simT * simT),
                sv.vz * simT
              );
              _dummy.rotation.set(sv.rx * simT, sv.ry * simT, 0);
              _dummy.scale.setScalar(sv.s * (1 - hitT * 0.45));
              _dummy.updateMatrix();
              shardsInst.setMatrixAt(i, _dummy.matrix);
            }
            shardsInst.instanceMatrix.needsUpdate = true;

            // Clones scatter radially as golden spirit warriors
            for (let i = 0; i < cloneCount; i++) {
              const ang = (i / cloneCount) * Math.PI * 2 + hitT * 0.8;
              const rad = 3.2 + hitT * 8.5 + (i % 3) * 1.5;
              _dummy.position.set(Math.cos(ang) * rad, 0.7 + Math.sin(hitT * Math.PI) * 2.2, Math.sin(ang) * rad);
              _dummy.rotation.set(0, -ang, 0);
              _dummy.scale.setScalar(Math.max(0.05, 1.0 - hitT * 0.65));
              _dummy.updateMatrix();
              clonesInst.setMatrixAt(i, _dummy.matrix);
            }
            clonesInst.instanceMatrix.needsUpdate = true;

            const shakeAmt = Math.max(0, 1 - hitT * 1.4) * 0.55;
            _camTarget.set(
              Math.sin(elapsed * 45) * shakeAmt,
              4.2 + hitT * 2.6 + Math.cos(elapsed * 39) * shakeAmt,
              14.5 + hitT * 3.5
            );
            _lookTarget.set(0, 2.4, 0);
          }
        } else {
          // Act IV: Triumphant Great Sage Martial Stance & Return to Battle
          const t4 = (progress - 0.84) / 0.16;
          impactVal = Math.max(0, 1 - t4 * 1.15);
          heroRoot.position.set(0, 0.02, 0);
          monkeyBody.rotation.set(0, t4 * 0.3, 0);
          kintonGroup.visible = false;

          ruyiPivot.position.set(0.55, 1.45, 0.25);
          ruyiPivot.rotation.set(0.2, 0, -0.55);
          ruyiPivot.scale.setScalar(THREE.MathUtils.lerp(2.4, 1.05, THREE.MathUtils.smoothstep(t4, 0, 0.7)));
          staffCoreUniforms.uCharge.value = 0.6 * (1 - t4);

          impactDome.visible = false;
          shockRing.visible = false;
          shardsInst.visible = false;
          impactBurstLight.intensity = 0;
          sageHalo.position.set(0, 1.8, -0.4);
          sageHalo.scale.setScalar(1.0);
          sageHalo.material.opacity = (1 - t4) * 0.45;
          sageHalo.lookAt(camera.position);

          // Final 6 golden clones orbit tightly then dissolve into Monkey King
          for (let i = 0; i < cloneCount; i++) {
            if (i >= 8) {
              _dummy.scale.setScalar(0.001);
              _dummy.updateMatrix();
              clonesInst.setMatrixAt(i, _dummy.matrix);
            } else {
              const ang = (i / 8) * Math.PI * 2 + elapsed * 3.5;
              const rad = THREE.MathUtils.lerp(3.2, 0.4, t4);
              _dummy.position.set(Math.cos(ang) * rad, 1.0 + t4 * 0.4, Math.sin(ang) * rad);
              _dummy.scale.setScalar(Math.max(0.01, 0.85 * (1 - t4)));
              _dummy.updateMatrix();
              clonesInst.setMatrixAt(i, _dummy.matrix);
            }
          }
          clonesInst.instanceMatrix.needsUpdate = true;

          _camTarget.set(
            THREE.MathUtils.lerp(0, -1.8, t4),
            THREE.MathUtils.lerp(6.8, 10.5, t4),
            THREE.MathUtils.lerp(17.8, 12.0, t4)
          );
          _lookTarget.set(0, THREE.MathUtils.lerp(2.4, 1.2, t4), 0);
        }

        skyUniforms.uImpact.value = impactVal;
        fissureUniforms.uImpact.value = impactVal;
        heroAuraLight.position.set(heroRoot.position.x, heroRoot.position.y + 2.4, heroRoot.position.z + 1.2);
        contactShadow.visible = heroRoot.position.y < 1.8;
        contactShadow.material.opacity = THREE.MathUtils.clamp(0.55 - heroRoot.position.y * 0.25, 0, 0.55);

        // Animate swirling golden sparks
        const sAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
        const sArr = sAttr.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          const baseAng = sparkMeta[i * 3];
          const rad = sparkMeta[i * 3 + 1];
          const spd = sparkMeta[i * 3 + 2];
          const a = baseAng + elapsed * (0.4 + impactVal * 0.9);
          sArr[i * 3] = heroRoot.position.x + Math.cos(a) * (rad + impactVal * 3.2);
          sArr[i * 3 + 1] = ((elapsed * spd + i * 0.37) % 14) + Math.max(0, heroRoot.position.y - 2);
          sArr[i * 3 + 2] = heroRoot.position.z + Math.sin(a) * (rad + impactVal * 3.2);
        }
        sAttr.needsUpdate = true;

        // Silky-Smooth Exponential Camera Damping
        const dampAlpha = 1 - Math.exp(-6.5 * dt);
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
      aria-label="Cutscene 3D Monkey King Qi Tian Da Sheng"
    >
      {/* Dedicated Canvas Mount (100% Unobstructed Center) */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Minimal Top Cinematic Header Scrim (No backdrop-blur, no static pills, no pulsing dots) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-5 sm:p-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-game font-semibold tracking-wider text-amber-300">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Sun Wukong</span>
            <span aria-hidden="true">·</span>
            <span>Great Sage, Heaven&apos;s Equal</span>
          </div>
          <h2 className="mt-1 font-title text-xl sm:text-3xl font-black tracking-wide text-white drop-shadow text-balance">
            QI TIAN DA SHENG · 72 CELESTIAL CLONES
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-game font-semibold text-amber-100/90 tracking-wide">
            {ACT_LABELS[act]}
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right text-xs font-mono tabular-nums text-amber-200/90">
          <span className="text-[11px] font-semibold text-amber-400">Segel Qi Tian</span>
          <span className="text-base font-bold text-white">{sageStacks}/12 Stack</span>
        </div>
      </div>

      {/* Unified Bottom Dock (Clean typography + accessible Skip button, no backdrop-blur) */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-end justify-between gap-4">
        <div className="pointer-events-none flex items-center gap-2 text-xs font-game text-amber-100/85 tracking-wide">
          <span>72 Pasukan Kera</span>
          <span aria-hidden="true">·</span>
          <span>Sembilan Langit</span>
          <span aria-hidden="true">·</span>
          <span>RuYi Raksasa</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums font-semibold text-amber-300">{uiProgress}%</span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-amber-400/60 hover:border-amber-300 text-slate-100 font-game font-semibold text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Lewati Cutscene</span>
          <FastForward className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* Bottom Progress Line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-yellow-200 transition-[width] duration-100"
          style={{ width: `${uiProgress}%` }}
        />
      </div>
    </div>
  );
};
