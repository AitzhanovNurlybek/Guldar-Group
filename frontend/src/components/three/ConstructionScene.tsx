"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { backgroundModel } from "@/lib/site";

/*
 * Стройка на фоне сайта: две башни из логотипа и башенный кран.
 * Прокрутка страницы = ход стройки: сцена поворачивается, этажи растут,
 * фасад догоняет каркас, кран носит груз к верхнему этажу.
 * Рендер только по требованию (frameloop="demand") — в покое GPU не работает.
 */

const START = 0.3; // на первом экране здание уже построено на треть
const FLOOR_H = 0.52;
const SLAB = 0.08;
const COL = 0.09;
const BASE_Y = 0.2;
const ROT0 = -1; // поворот сцены: ROT0 + прогресс × ROT (≈105° за всю страницу)
const ROT = 2.4;

type TowerSpec = { cx: number; w: number; d: number; floors: number; roof: "down" | "up" };
const TOWERS: TowerSpec[] = [
  { cx: -0.86, w: 1.6, d: 1.6, floors: 9, roof: "down" },
  { cx: 0.86, w: 1.6, d: 1.6, floors: 12, roof: "up" },
];

const CRANE = { x: 2.75, z: -1.25, mast: 8, s: 0.34, jib: 5, counter: 1.8 };

/* ─── Текстуры (рисуются на canvas, без загрузки файлов) ─────────── */

function facadeTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 256, 128);
  grad.addColorStop(0, "#2a6a9c");
  grad.addColorStop(0.55, "#1c4f7a");
  grad.addColorStop(1, "#15405f");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 128);
  // Отражение неба
  g.fillStyle = "rgba(255,255,255,0.10)";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(120, 0);
  g.lineTo(40, 128);
  g.lineTo(0, 128);
  g.fill();
  // Импосты
  g.fillStyle = "rgba(190,220,245,0.55)";
  for (let x = 0; x <= 256; x += 64) g.fillRect(x - 2, 0, 4, 128);
  // Межэтажный пояс
  g.fillStyle = "#0e2a42";
  g.fillRect(0, 110, 256, 18);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function hazardTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 32;
  const g = c.getContext("2d")!;
  g.fillStyle = "#11161c";
  g.fillRect(0, 0, 128, 32);
  g.fillStyle = "#f5871f";
  for (let x = -32; x < 160; x += 32) {
    g.beginPath();
    g.moveTo(x, 32);
    g.lineTo(x + 16, 32);
    g.lineTo(x + 32, 0);
    g.lineTo(x + 16, 0);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(14, 1);
  return t;
}

/* ─── Геометрия крана: фермы из «стержней» одним InstancedMesh ───── */

const UP = new THREE.Vector3(0, 1, 0);

function strut(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  const p = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  return new THREE.Matrix4().compose(p, q, new THREE.Vector3(t, len, t));
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function mastStruts() {
  const { mast: H, s } = CRANE;
  const h = s / 2;
  const corners = [v(-h, 0, -h), v(h, 0, -h), v(h, 0, h), v(-h, 0, h)];
  const n = 16;
  const seg = H / n;
  const out: THREE.Matrix4[] = [];
  corners.forEach((c) => out.push(strut(c.clone(), c.clone().setY(H), 0.035)));
  for (let j = 0; j < n; j++) {
    for (let k = 0; k < 4; k++) {
      const a = corners[k];
      const b = corners[(k + 1) % 4];
      out.push(strut(a.clone().setY((j + 1) * seg), b.clone().setY((j + 1) * seg), 0.02));
      const [from, to] = j % 2 ? [a, b] : [b, a];
      out.push(strut(from.clone().setY(j * seg), to.clone().setY((j + 1) * seg), 0.018));
    }
  }
  return out;
}

// Поворотная часть: стрела, противовесная консоль, оголовок
function slewStruts() {
  const { jib, counter } = CRANE;
  const out: THREE.Matrix4[] = [];
  const zb = 0.15;
  const yb = 0.2;
  const yt = 0.55;
  const m = 12;
  const seg = jib / m;
  out.push(strut(v(-0.2, yb, zb), v(-jib, yb, zb), 0.03));
  out.push(strut(v(-0.2, yb, -zb), v(-jib, yb, -zb), 0.03));
  out.push(strut(v(-0.2, yt, 0), v(-jib + seg, yt, 0), 0.03));
  for (let i = 0; i < m; i++) {
    const x0 = -0.2 - i * seg;
    const x1 = x0 - seg;
    const xt = Math.max(x0 - seg / 2, -jib + seg);
    out.push(strut(v(x0, yb, zb), v(x0, yb, -zb), 0.016));
    for (const z of [zb, -zb]) {
      out.push(strut(v(x0, yb, z), v(xt, yt, 0), 0.016));
      out.push(strut(v(xt, yt, 0), v(x1, yb, z), 0.016));
    }
  }
  // Противовесная консоль
  out.push(strut(v(0.2, yb, zb), v(counter, yb, zb), 0.03));
  out.push(strut(v(0.2, yb, -zb), v(counter, yb, -zb), 0.03));
  for (let x = 0.2; x <= counter + 0.01; x += 0.4) out.push(strut(v(x, yb, zb), v(x, yb, -zb), 0.016));
  // Оголовок
  const h = CRANE.s / 2;
  for (const [x, z] of [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ])
    out.push(strut(v(x, yb, z), v(0, 1.45, 0), 0.026));
  return out;
}

function cableStruts() {
  const { jib, counter } = CRANE;
  return [
    strut(v(0, 1.45, 0), v(-jib * 0.62, 0.55, 0), 0.012),
    strut(v(0, 1.45, 0), v(-jib + 0.4, 0.55, 0), 0.012),
    strut(v(0, 1.45, 0), v(counter, 0.2, 0.15), 0.012),
    strut(v(0, 1.45, 0), v(counter, 0.2, -0.15), 0.012),
  ];
}

function roofGeometry(spec: TowerSpec) {
  const hw = spec.w / 2;
  const hi = 1.1;
  const lo = 0.35;
  const pts: [number, number][] =
    spec.roof === "down"
      ? [[-hw, 0], [-hw, hi], [hw, lo], [hw, 0]]
      : [[-hw, 0], [-hw, lo], [hw, hi], [hw, 0]];
  const shape = new THREE.Shape();
  shape.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => shape.lineTo(...p));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: spec.d - COL, bevelEnabled: false });
  g.translate(0, 0, -(spec.d - COL) / 2);
  return g;
}

/* ─── Раскладка этажей по прогрессу ───────────────────────────── */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const Q90 = new THREE.Quaternion().setFromAxisAngle(UP, Math.PI / 2);
const P = new THREE.Vector3();
const S = new THREE.Vector3();

type TowerMeshes = {
  slabs: THREE.InstancedMesh | null;
  cols: THREE.InstancedMesh | null;
  glass: THREE.InstancedMesh | null;
  roof: THREE.Mesh | null;
};

// f — сколько этажей каркаса «готово» (дробное число), фасад отстаёт на 2 этажа
function layoutTower(spec: TowerSpec, m: TowerMeshes, f: number) {
  const { cx, w, d, floors } = spec;
  if (!m.slabs || !m.cols || !m.glass || !m.roof) return;
  const colPos: [number, number][] = [];
  const ix = w / 2 - COL / 2;
  const iz = d / 2 - COL / 2;
  for (const x of [-ix, 0, ix]) for (const z of [-iz, 0, iz]) if (x !== 0 || z !== 0) colPos.push([x, z]);

  for (let i = 0; i <= floors; i++) {
    const t = i === 0 ? 1 : ease(clamp01((f - (i - 1) - 0.8) / 0.2));
    P.set(cx, BASE_Y + i * FLOOR_H + SLAB / 2, 0);
    if (t > 0) S.set(w * t, SLAB, d * t);
    else S.setScalar(1e-4);
    m.slabs.setMatrixAt(i, M.compose(P, Q.identity(), S));
  }

  for (let i = 0; i < floors; i++) {
    const t = ease(clamp01(f - i));
    const h = (FLOOR_H - SLAB) * t;
    const y0 = BASE_Y + i * FLOOR_H + SLAB;
    colPos.forEach(([x, z], k) => {
      P.set(cx + x, y0 + h / 2, z);
      if (t > 0) S.set(COL, h, COL);
      else S.setScalar(1e-4);
      m.cols!.setMatrixAt(i * colPos.length + k, M.compose(P, Q.identity(), S));
    });

    const tg = ease(clamp01(f - 2 - i));
    const hg = (FLOOR_H - SLAB) * tg;
    const yg = y0 + hg / 2;
    const sides: [number, number, boolean, number][] = [
      [0, iz, false, w - COL],
      [0, -iz, false, w - COL],
      [ix, 0, true, d - COL],
      [-ix, 0, true, d - COL],
    ];
    sides.forEach(([x, z, rot, len], k) => {
      P.set(cx + x, yg, z);
      if (tg > 0) S.set(len, hg, 0.03);
      else S.setScalar(1e-4);
      m.glass!.setMatrixAt(i * 4 + k, M.compose(P, rot ? Q90 : Q.identity(), S));
    });
  }

  m.slabs.instanceMatrix.needsUpdate = true;
  m.cols.instanceMatrix.needsUpdate = true;
  m.glass.instanceMatrix.needsUpdate = true;

  const tr = ease(clamp01(f - floors - 2));
  m.roof.scale.set(1, Math.max(tr, 1e-4), 1);
  m.roof.visible = tr > 0.001;
}

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? clamp01(window.scrollY / max) : 0;
}

/* ─── Сцена ───────────────────────────────────────────────────── */

function useMaterials() {
  return useMemo(() => {
    const facade = facadeTexture();
    const hazard = hazardTexture();
    return {
      concrete: new THREE.MeshStandardMaterial({ color: "#8d969f", roughness: 0.92 }),
      concreteDark: new THREE.MeshStandardMaterial({ color: "#5d6873", roughness: 0.85 }),
      glass: new THREE.MeshStandardMaterial({ map: facade, metalness: 0.55, roughness: 0.22, envMapIntensity: 1.1 }),
      glassPlain: new THREE.MeshStandardMaterial({ color: "#245b88", metalness: 0.6, roughness: 0.2 }),
      crane: new THREE.MeshStandardMaterial({ color: "#f5871f", roughness: 0.55, metalness: 0.25 }),
      craneDark: new THREE.MeshStandardMaterial({ color: "#c96a12", roughness: 0.6, metalness: 0.25 }),
      steel: new THREE.MeshStandardMaterial({ color: "#a7b3bf", roughness: 0.35, metalness: 0.85 }),
      cab: new THREE.MeshStandardMaterial({ color: "#e9eef3", roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: "#16222e", roughness: 0.6 }),
      hazard: new THREE.MeshStandardMaterial({ map: hazard, roughness: 0.7 }),
    };
  }, []);
}

const box = new THREE.BoxGeometry(1, 1, 1);

function Tower({
  spec,
  mats,
  onMesh,
}: {
  spec: TowerSpec;
  mats: ReturnType<typeof useMaterials>;
  onMesh: <K extends keyof TowerMeshes>(key: K, obj: TowerMeshes[K]) => void;
}) {
  const roof = useMemo(() => roofGeometry(spec), [spec]);
  const colsPerFloor = 8;
  return (
    <group>
      <instancedMesh
        ref={(r) => onMesh("slabs", r)}
        args={[box, mats.concrete, spec.floors + 1]}
      />
      <instancedMesh
        ref={(r) => onMesh("cols", r)}
        args={[box, mats.concreteDark, spec.floors * colsPerFloor]}
      />
      <instancedMesh
        ref={(r) => onMesh("glass", r)}
        args={[box, mats.glass, spec.floors * 4]}
      />
      <mesh
        ref={(r) => onMesh("roof", r)}
        geometry={roof}
        material={mats.glassPlain}
        position={[spec.cx, BASE_Y + spec.floors * FLOOR_H + SLAB, 0]}
      />
    </group>
  );
}

function Struts({ matrices, material }: { matrices: THREE.Matrix4[]; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return <instancedMesh ref={ref} args={[box, material, matrices.length]} />;
}

function Site({ reduced }: { reduced: boolean }) {
  const mats = useMaterials();
  const invalidate = useThree((s) => s.invalidate);
  const prog = useRef({ target: START, current: reduced ? START : 0.08 });
  const root = useRef<THREE.Group>(null);
  const slew = useRef<THREE.Group>(null);
  const trolley = useRef<THREE.Group>(null);
  const hoist = useRef<THREE.Mesh>(null);
  const load = useRef<THREE.Group>(null);
  // Меши башен заполняются ref-колбэками
  const towers = useRef<TowerMeshes[]>(TOWERS.map(() => ({ slabs: null, cols: null, glass: null, roof: null })));

  const mast = useMemo(() => mastStruts(), []);
  const slewing = useMemo(() => slewStruts(), []);
  const cables = useMemo(() => cableStruts(), []);

  useEffect(() => {
    const onScroll = () => {
      prog.current.target = START + (1 - START) * scrollProgress();
      invalidate();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [invalidate]);

  useFrame((_, delta) => {
    const p = prog.current;
    p.current = reduced ? p.target : THREE.MathUtils.damp(p.current, p.target, 3.2, Math.min(delta, 0.05));
    if (Math.abs(p.current - p.target) > 0.0004) invalidate();
    const k = p.current;

    TOWERS.forEach((spec, i) => layoutTower(spec, towers.current[i], k * (spec.floors + 3)));
    if (root.current) root.current.rotation.y = ROT0 + k * ROT;

    // Кран: стрела ходит туда-обратно, крюк поднимает груз к верхнему этажу правой башни
    const b = TOWERS[1];
    const top = BASE_Y + Math.min(Math.ceil(k * (b.floors + 3)), b.floors) * FLOOR_H;
    if (slew.current) slew.current.rotation.y = -0.15 + Math.sin(k * Math.PI * 3) * 0.55;
    const tx = 1.6 + (Math.sin(k * Math.PI * 5) * 0.5 + 0.5) * 2.2;
    const hookY = Math.min(top + 0.9, CRANE.mast - 0.8) - (CRANE.mast + BASE_Y);
    trolley.current?.position.set(-tx, 0.12, 0);
    if (hoist.current) {
      const len = -hookY;
      hoist.current.scale.set(0.012, len, 0.012);
      hoist.current.position.set(0, -len / 2, 0);
    }
    load.current?.position.set(0, hookY, 0);
  });

  return (
    <group ref={root} position={[-0.55, 0, 0.1]}>
      {/* Площадка */}
      <mesh geometry={box} material={mats.concrete} position={[0.9, 0.1, -0.25]} scale={[7.2, 0.2, 4.8]} />
      <mesh geometry={box} material={mats.hazard} position={[0.9, 0.1, 2.16]} scale={[7.2, 0.12, 0.02]} />
      {TOWERS.map((spec, i) => (
        <Tower
          key={spec.cx}
          spec={spec}
          mats={mats}
          onMesh={(key, obj) => {
            towers.current[i][key] = obj;
          }}
        />
      ))}

      {/* Материалы на площадке */}
      <group position={[3.4, BASE_Y, 1.1]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={box} material={mats.steel} position={[0, 0.05 + i * 0.1, 0]} scale={[0.9, 0.08, 0.12]} />
        ))}
        <mesh geometry={box} material={mats.concreteDark} position={[-0.1, 0.2, -0.6]} scale={[0.5, 0.4, 0.5]} />
      </group>

      {/* Кран */}
      <group position={[CRANE.x, BASE_Y, CRANE.z]}>
        <mesh geometry={box} material={mats.dark} position={[0, 0.05, 0]} scale={[0.8, 0.1, 0.8]} />
        <Struts matrices={mast} material={mats.crane} />
        <group ref={slew} position={[0, CRANE.mast, 0]}>
          <mesh geometry={box} material={mats.craneDark} position={[0, 0.1, 0]} scale={[0.52, 0.2, 0.52]} />
          <mesh geometry={box} material={mats.cab} position={[-0.1, 0.4, 0.36]} scale={[0.36, 0.34, 0.3]} />
          <Struts matrices={slewing} material={mats.crane} />
          <Struts matrices={cables} material={mats.steel} />
          <mesh geometry={box} material={mats.concreteDark} position={[CRANE.counter - 0.35, 0.02, 0]} scale={[0.55, 0.42, 0.42]} />
          <group ref={trolley}>
            <mesh geometry={box} material={mats.dark} scale={[0.22, 0.1, 0.34]} />
            <mesh ref={hoist} geometry={box} material={mats.steel} />
            <group ref={load}>
              <mesh geometry={box} material={mats.craneDark} position={[0, 0.05, 0]} scale={[0.08, 0.1, 0.08]} />
              <group position={[0, -0.12, 0]}>
                <mesh geometry={box} material={mats.steel} scale={[1.2, 0.14, 0.03]} />
                <mesh geometry={box} material={mats.steel} position={[0, 0.07, 0]} scale={[1.2, 0.02, 0.14]} />
                <mesh geometry={box} material={mats.steel} position={[0, -0.07, 0]} scale={[1.2, 0.02, 0.14]} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ─── Своя .glb вместо стройки ────────────────────────────────── */

function GltfModel({ src }: { src: string }) {
  const gltf = useLoader(GLTFLoader, src);
  const invalidate = useThree((s) => s.invalidate);
  const ref = useRef<THREE.Group>(null);
  const object = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const bbox = new THREE.Box3().setFromObject(scene);
    const dims = bbox.getSize(new THREE.Vector3());
    const k = 8 / Math.max(dims.x, dims.y, dims.z);
    scene.scale.setScalar(k);
    const c = bbox.getCenter(new THREE.Vector3()).multiplyScalar(-k);
    scene.position.set(c.x, -bbox.min.y * k, c.z);
    return scene;
  }, [gltf]);
  useEffect(() => {
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [invalidate]);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = ROT0 + (START + (1 - START) * scrollProgress()) * ROT;
  });
  return (
    <group ref={ref}>
      <primitive object={object} />
    </group>
  );
}

class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ─── Окружение и камера ─────────────────────────────────────── */

function Environment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene, invalidate } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [get]);
  return null;
}

// Вся стройка с краном (≈10 ед. в высоту, радиус разворота ≈4.6 ед.) целиком помещается в кадр
function FitCamera() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const { camera, invalidate } = get();
    const t = Math.tan(THREE.MathUtils.degToRad(30 / 2));
    const aspect = size.width / size.height;
    const z = Math.max(6.4 / t, 4.6 / (t * aspect));
    camera.position.set(0, 6, z);
    camera.lookAt(0.3, 4.5, 0);
    invalidate();
  }, [get, size]);
  return null;
}

export default function ConstructionScene() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const site = <Site reduced={reduced} />;

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ fov: 30, position: [0, 6.2, 20] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Environment />
      <FitCamera />
      <hemisphereLight args={["#bfe0ff", "#0b1622", 0.9]} />
      <directionalLight position={[-5, 9, 6]} intensity={1.9} color="#ffe2bd" />
      <directionalLight position={[6, 3, -5]} intensity={0.7} color="#6fb6ff" />
      {backgroundModel ? (
        <Fallback fallback={site}>
          <Suspense fallback={site}>
            <GltfModel src={backgroundModel} />
          </Suspense>
        </Fallback>
      ) : (
        site
      )}
    </Canvas>
  );
}
