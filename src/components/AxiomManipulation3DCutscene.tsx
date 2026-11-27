import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface AxiomManipulation3DCutsceneProps {
  remainingTime: number;
  totalDuration: number;
  onSkip: () => void;
  onWebGLUnavailable?: () => void;
}

export const AxiomManipulation3DCutscene: React.FC<AxiomManipulation3DCutsceneProps> = ({
  remainingTime,
  totalDuration,
  onSkip,
  onWebGLUnavailable
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const onUnavailableRef = useRef(onWebGLUnavailable);

  useEffect(() => {
    onUnavailableRef.current = onWebGLUnavailable;
  }, [onWebGLUnavailable]);

  const progress = Math.max(0, Math.min(1, 1 - remainingTime / Math.max(0.1, totalDuration)));
  progressRef.current = progress;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
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
    renderer.setClearColor(0x03020d, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050316, 0.022);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.2, 160);
    camera.position.set(0, 4.5, 13);

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

    scene.add(new THREE.HemisphereLight(0x67e8f9, 0x3b0764, 0.85));
    const mainLight = new THREE.DirectionalLight(0xe0f2fe, 2.4);
    mainLight.position.set(8, 16, 10);
    if (!isSoftwareGl) {
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(1024, 1024);
      mainLight.shadow.bias = -0.0005;
    }
    scene.add(mainLight);

    const pointCoreLight = new THREE.PointLight(0x22d3ee, 5.0, 32);
    pointCoreLight.position.set(0, 3.2, 0);
    scene.add(pointCoreLight);

    const obsidianMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.22 })
    );
    const cyanGlowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x22d3ee,
        emissiveIntensity: 2.3,
        metalness: 0.3,
        roughness: 0.14
      })
    );
    const violetGlowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x9333ea,
        emissiveIntensity: 1.85,
        metalness: 0.55,
        roughness: 0.2
      })
    );
    const goldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.5,
        metalness: 0.88,
        roughness: 0.18
      })
    );

    // Inverted Reality Floor Grid
    const floorGeo = trackGeo(new THREE.CylinderGeometry(18, 18, 0.25, 32));
    const floorMesh = new THREE.Mesh(floorGeo, obsidianMat);
    floorMesh.position.y = -0.2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(34, 24, 0x22d3ee, 0x581c87);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Hero Axiom Cutscene Avatar at center
    const heroGroup = new THREE.Group();
    heroGroup.position.set(0, 1.8, 0);
    scene.add(heroGroup);

    const torsoGeo = trackGeo(new THREE.CylinderGeometry(0.42, 0.25, 1.15, 6));
    const torso = new THREE.Mesh(torsoGeo, violetGlowMat);
    heroGroup.add(torso);

    const headGeo = trackGeo(new THREE.DodecahedronGeometry(0.32, 0));
    const head = new THREE.Mesh(headGeo, obsidianMat);
    head.position.y = 0.88;
    heroGroup.add(head);

    const crownProngGeo = trackGeo(new THREE.ConeGeometry(0.08, 0.45, 4));
    for (let i = -1; i <= 1; i++) {
      const p = new THREE.Mesh(crownProngGeo, i === 0 ? cyanGlowMat : goldMat);
      p.position.set(i * 0.22, 1.24 + (i === 0 ? 0.12 : 0), 0);
      p.rotation.z = -i * 0.35;
      heroGroup.add(p);
    }

    // Converging Gyro Rings around Hero
    const gyroOuterGeo = trackGeo(new THREE.TorusGeometry(2.1, 0.05, 8, 56));
    const gyroOuter = new THREE.Mesh(gyroOuterGeo, cyanGlowMat);
    heroGroup.add(gyroOuter);

    const gyroInnerGeo = trackGeo(new THREE.TorusGeometry(1.45, 0.045, 8, 48));
    const gyroInner = new THREE.Mesh(gyroInnerGeo, violetGlowMat);
    heroGroup.add(gyroInner);

    // Giant Tesseract Cage Wireframe converging overhead
    const cageGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    disposables.push(cageEdges);
    const cageLineMat = trackMat(new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 }));
    const cageWire = new THREE.LineSegments(cageEdges, cageLineMat);
    cageWire.position.set(0, 3.0, 0);
    scene.add(cageWire);

    // 6 Towering Reality Monolith Obelisks
    const obeliskGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.52, 6.2, 4));
    const obelisks: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(obeliskGeo, i % 2 === 0 ? obsidianMat : violetGlowMat);
      const a = (i / 6) * Math.PI * 2;
      m.position.set(Math.cos(a) * 6.2, -3.5, Math.sin(a) * 6.2);
      scene.add(m);
      obelisks.push(m);
    }

    // 18 Floating Shatter Shards
    const shardGeo = trackGeo(new THREE.OctahedronGeometry(0.26, 0));
    const shards: { mesh: THREE.Mesh; ang: number; rad: number; yBase: number; spd: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(shardGeo, i % 3 === 0 ? goldMat : i % 2 === 0 ? cyanGlowMat : violetGlowMat);
      const ang = (i / 18) * Math.PI * 2;
      const rad = 3.2 + (i % 4) * 1.4;
      const yBase = 0.8 + (i % 5) * 0.95;
      scene.add(m);
      shards.push({ mesh: m, ang, rad, yBase, spd: 1.0 + (i % 3) * 0.55 });
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

      const p = progressRef.current;

      // Camera orbit sweep + sudden impact zoom at p >= 0.70
      const orbitAng = p * Math.PI * 1.55 - 0.5;
      const camDist = p < 0.70 ? 12.5 - p * 4.5 : 8.2 + (p - 0.70) * 12;
      const camHeight = p < 0.70 ? 4.4 - p * 1.4 : 3.4 + (p - 0.70) * 4.2;
      camera.position.set(Math.sin(orbitAng) * camDist, camHeight, Math.cos(orbitAng) * camDist);
      camera.lookAt(0, 2.2, 0);

      // Obelisks rise in Stage 1 and invert during Stage 3
      for (let i = 0; i < obelisks.length; i++) {
        const ob = obelisks[i];
        const targetY = p < 0.68 ? -2.8 + Math.min(1, p * 2.4) * 5.8 : 3.2 - (p - 0.68) * 1.4;
        ob.position.y = targetY + Math.sin(elapsed * 2.5 + i) * 0.25;
        ob.rotation.y = elapsed * 0.7 + i;
      }

      // Tesseract Cage compresses toward center until Reality Shatter (p = 0.70), then expands massively
      const cageScale = p < 0.70 ? Math.max(2.2, 11.5 - p * 13.0) : 2.2 + (p - 0.70) * 34;
      cageWire.scale.setScalar(cageScale);
      cageWire.rotation.set(elapsed * 0.9, elapsed * 1.3, elapsed * 0.5);

      heroGroup.position.y = 1.9 + Math.sin(elapsed * 3.5) * 0.16;
      gyroOuter.rotation.set(elapsed * 2.2, elapsed * 1.6, 0);
      gyroInner.rotation.set(-elapsed * 2.8, 0, elapsed * 2.1);

      pointCoreLight.intensity = p >= 0.68 && p <= 0.76 ? 12.0 : 5.5;
      pointCoreLight.color.setHex(p >= 0.70 ? 0xfde047 : 0x22d3ee);

      for (const s of shards) {
        const a = s.ang + elapsed * s.spd;
        const r = p >= 0.70 ? s.rad * (1 + (p - 0.70) * 2.2) : s.rad * (1 - p * 0.35);
        s.mesh.position.set(Math.cos(a) * r, s.yBase + Math.sin(elapsed * 3 + s.ang) * 0.35, Math.sin(a) * r);
        s.mesh.rotation.set(elapsed * 3, elapsed * 4, 0);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl && typeof gl.finish === 'function') {
        gl.finish();
      }
      if (alive) {
        rafId = requestAnimationFrame(tick);
      }
    };

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

  const inFlash = progress >= 0.685 && progress <= 0.745;
  const stageText =
    progress < 0.34
      ? 'TAHAP I · PEMBALIKAN VEKTOR RUANG 3D'
      : progress < 0.70
      ? 'TAHAP II · KONVERGENSI KUBUS TESSERACT'
      : 'TAHAP III · APEX DOMINION: OVERLORD OF REALITY!';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 select-none">
      <div ref={hostRef} className="absolute inset-0" />

      {/* Impact Flash Overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-cyan-100 transition-opacity duration-75"
        style={{ opacity: inFlash ? 0.85 : 0 }}
      />

      {/* Cinematic Top & Bottom Letterbox Bars */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-purple-500/20 border border-cyan-400/50 text-[10px] font-title font-bold tracking-widest text-cyan-300 uppercase">
            3D MANIPULATION OVERDRIVE
          </span>
          <span className="text-xs font-mono text-purple-200 tracking-wider">{stageText}</span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="pointer-events-auto px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-400/50 text-xs font-title font-bold text-cyan-200 transition-colors cursor-pointer"
        >
          Lewati Cutscene ⏭
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex flex-col items-center justify-end pb-5 px-4">
        <div className="text-xs font-title tracking-[0.28em] text-cyan-300 uppercase">
          AXIOM · SOVEREIGN OF VECTOR &amp; MIND
        </div>
        <div className="mt-1 text-lg sm:text-2xl font-title font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-amber-300">
          APEX DOMINION · PENGUASA REALITAS 3D
        </div>
      </div>
    </div>
  );
};
