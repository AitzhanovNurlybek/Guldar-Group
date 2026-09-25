"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { heroModels } from "@/lib/site";

type Vec3 = [number, number, number];
type DragState = { active: boolean; rot: number; vel: number; lastX: number; lastT: number };

/* ─── Материалы ─────────────────────────────────────────────── */

function useMaterials() {
  return useMemo(
    () => ({
      glass: new THREE.MeshPhysicalMaterial({
        color: "#8cc6ee",
        metalness: 0.1,
        roughness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        transparent: true,
        opacity: 0.5,
      }),
      glassSoft: new THREE.MeshPhysicalMaterial({
        color: "#5b9fd4",
        roughness: 0.15,
        clearcoat: 1,
        transparent: true,
        opacity: 0.32,
      }),
      facet: new THREE.MeshPhysicalMaterial({ color: "#1f64a0", metalness: 0.45, roughness: 0.25, clearcoat: 1 }),
      slab: new THREE.MeshPhysicalMaterial({ color: "#0d2339", metalness: 0.4, roughness: 0.3, clearcoat: 1 }),
      window: new THREE.MeshStandardMaterial({ color: "#cfe9ff", emissive: "#7cc4ff", emissiveIntensity: 0.9 }),
      ceramic: new THREE.MeshPhysicalMaterial({ color: "#e9f2fa", roughness: 0.32, clearcoat: 0.8 }),
      metal: new THREE.MeshStandardMaterial({ color: "#a9bccd", metalness: 0.9, roughness: 0.28 }),
      metalDark: new THREE.MeshStandardMaterial({ color: "#5d7288", metalness: 0.85, roughness: 0.35 }),
      ink: new THREE.MeshStandardMaterial({ color: "#0b1a2d", roughness: 0.6 }),
      navy: new THREE.MeshPhysicalMaterial({ color: "#12304f", roughness: 0.4, clearcoat: 0.6 }),
      red: new THREE.MeshPhysicalMaterial({ color: "#e2553f", roughness: 0.35, clearcoat: 0.7 }),
      yellow: new THREE.MeshStandardMaterial({ color: "#f5c542", roughness: 0.5 }),
      paint: new THREE.MeshStandardMaterial({ color: "#58aee8", roughness: 0.95 }),
      sky: new THREE.MeshPhysicalMaterial({ color: "#58aee8", roughness: 0.3, clearcoat: 1 }),
      bulb: new THREE.MeshPhysicalMaterial({
        color: "#dff1ff",
        emissive: "#6fbcf5",
        emissiveIntensity: 1.4,
        roughness: 0.1,
        transparent: true,
        opacity: 0.92,
      }),
      edge: new THREE.LineBasicMaterial({ color: "#9fd1f4", transparent: true, opacity: 0.85 }),
    }),
    [],
  );
}

type Mats = ReturnType<typeof useMaterials>;

/* ─── Геометрия-помощники ───────────────────────────────────── */

function extrude(points: [number, number][], depth: number) {
  const s = new THREE.Shape();
  s.moveTo(...points[0]);
  points.slice(1).forEach((p) => s.lineTo(...p));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

function Outlined({ geometry, material, edge }: { geometry: THREE.BufferGeometry; material: THREE.Material; edge: THREE.Material }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 25), [geometry]);
  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <lineSegments geometry={edges} material={edge} />
    </group>
  );
}

/* ─── Объекты ───────────────────────────────────────────────── */

// Башни повторяют силуэт логотипа: два корпуса со скошенными крышами и боковые крылья
function Tower({ m }: { m: Mats }) {
  const g = useMemo(() => {
    const D = 0.7;
    return {
      left: extrude([[-0.9, -1.4], [-0.9, 1.25], [-0.1, 0.75], [-0.1, -1.4]], D),
      right: extrude([[0.1, -1.4], [0.1, 0.95], [0.85, 1.95], [0.85, -1.4]], D),
      wingL: extrude([[-1.75, -1.4], [-1.75, -0.35], [-0.95, -0.8], [-0.95, -1.4]], D * 0.8),
      wingR: extrude([[0.9, -1.4], [0.9, -0.85], [1.7, -0.35], [1.7, -1.4]], D * 0.8),
      facetL: extrude([[-0.62, -1.4], [-0.62, 0.35], [-0.1, 0.02], [-0.1, -1.4]], D + 0.06),
      facetR: extrude([[0.42, -1.4], [0.42, -0.1], [0.85, 0.45], [0.85, -1.4]], D + 0.06),
      slab: new RoundedBoxGeometry(4, 0.1, 1.5, 3, 0.04),
    };
  }, []);

  const bands = useMemo(() => {
    const out: { x: number; y: number; w: number }[] = [];
    for (let y = -1.15; y < 0.5; y += 0.28) out.push({ x: -0.5, y, w: 0.66 });
    for (let y = -1.15; y < 0.8; y += 0.28) out.push({ x: 0.475, y, w: 0.6 });
    return out;
  }, []);

  return (
    <group>
      <Outlined geometry={g.left} material={m.glass} edge={m.edge} />
      <Outlined geometry={g.right} material={m.glass} edge={m.edge} />
      <Outlined geometry={g.wingL} material={m.glassSoft} edge={m.edge} />
      <Outlined geometry={g.wingR} material={m.glassSoft} edge={m.edge} />
      <mesh geometry={g.facetL} material={m.facet} />
      <mesh geometry={g.facetR} material={m.facet} />
      {bands.map((b, i) =>
        [1, -1].map((side) => (
          <mesh key={`${i}${side}`} position={[b.x, b.y, side * 0.37]} material={m.window}>
            <boxGeometry args={[b.w, 0.022, 0.01]} />
          </mesh>
        )),
      )}
      <mesh position={[0, -1.47, 0]} geometry={g.slab} material={m.slab} />
    </group>
  );
}

// Электрощит: корпус, окно с автоматами, ручка, знак «молния»
function Cabinet({ m }: { m: Mats }) {
  const body = useMemo(() => new RoundedBoxGeometry(0.9, 1.2, 0.34, 4, 0.05), []);
  return (
    <group>
      <mesh geometry={body} material={m.ceramic} />
      <mesh position={[0, 0.2, 0.172]} material={m.ink}>
        <boxGeometry args={[0.64, 0.36, 0.01]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[-0.25 + i * 0.1, 0.2, 0.18]}>
          <mesh material={m.ceramic}>
            <boxGeometry args={[0.075, 0.2, 0.03]} />
          </mesh>
          <mesh position={[0, i % 3 === 0 ? 0.03 : -0.03, 0.02]} material={i === 2 ? m.red : m.sky}>
            <boxGeometry args={[0.03, 0.05, 0.02]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.34, -0.12, 0.19]} material={m.metalDark}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
      </mesh>
      <mesh position={[0, -0.26, 0.172]} rotation={[0, 0, Math.PI / 2]} material={m.yellow}>
        <circleGeometry args={[0.11, 3]} />
      </mesh>
      {[-0.44, -0.49, -0.54].map((y) => (
        <mesh key={y} position={[0, y, 0.172]} material={m.ink}>
          <boxGeometry args={[0.5, 0.012, 0.005]} />
        </mesh>
      ))}
    </group>
  );
}

// Вентиль: труба с фланцами и красный маховик
function Valve({ m }: { m: Mats }) {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} material={m.metal}>
        <cylinderGeometry args={[0.11, 0.11, 1.5, 32]} />
      </mesh>
      {[-0.33, 0.33].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.metalDark}>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 32]} />
        </mesh>
      ))}
      <mesh material={m.metalDark}>
        <sphereGeometry args={[0.24, 32, 16]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={m.metal}>
        <cylinderGeometry args={[0.09, 0.12, 0.3, 24]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={m.metal}>
        <cylinderGeometry args={[0.025, 0.025, 0.25, 12]} />
      </mesh>
      <group position={[0, 0.66, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.red}>
          <torusGeometry args={[0.3, 0.038, 14, 48]} />
        </mesh>
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a) => (
          <mesh key={a} rotation={[0, a, 0]} material={m.red}>
            <boxGeometry args={[0.6, 0.03, 0.03]} />
          </mesh>
        ))}
        <mesh material={m.red}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 20]} />
        </mesh>
      </group>
    </group>
  );
}

// Каска
function Helmet({ m }: { m: Mats }) {
  return (
    <group>
      <mesh material={m.ceramic}>
        <sphereGeometry args={[0.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.01, 0.06]} scale={[1, 1, 1.12]} material={m.ceramic}>
        <cylinderGeometry args={[0.6, 0.62, 0.035, 48]} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} material={m.sky}>
        <torusGeometry args={[0.505, 0.035, 10, 40, Math.PI]} />
      </mesh>
    </group>
  );
}

// Малярный валик
function Roller({ m }: { m: Mats }) {
  const frame = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, 0, 0),
      new THREE.Vector3(0.52, 0, 0),
      new THREE.Vector3(0.52, -0.22, 0),
      new THREE.Vector3(0.12, -0.34, 0),
      new THREE.Vector3(0, -0.6, 0),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.02, 8);
  }, []);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} material={m.paint}>
        <cylinderGeometry args={[0.17, 0.17, 0.75, 32]} />
      </mesh>
      {[-0.385, 0.385].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.metal}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
        </mesh>
      ))}
      <mesh geometry={frame} material={m.metal} />
      <mesh position={[0, -0.83, 0]} material={m.navy}>
        <cylinderGeometry args={[0.055, 0.065, 0.46, 20]} />
      </mesh>
    </group>
  );
}

// Лампа — электрика
function Bulb({ m }: { m: Mats }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} material={m.bulb}>
        <sphereGeometry args={[0.32, 40, 24]} />
      </mesh>
      <mesh position={[0, -0.1, 0]} material={m.bulb}>
        <cylinderGeometry args={[0.15, 0.22, 0.22, 32]} />
      </mesh>
      <mesh position={[0, -0.32, 0]} material={m.metal}>
        <cylinderGeometry args={[0.145, 0.145, 0.24, 32]} />
      </mesh>
      {[-0.24, -0.32, -0.4].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.metal}>
          <torusGeometry args={[0.148, 0.014, 8, 32]} />
        </mesh>
      ))}
      <mesh position={[0, -0.47, 0]} material={m.ink}>
        <sphereGeometry args={[0.055, 16, 8]} />
      </mesh>
      <pointLight position={[0, 0.2, 0]} color="#7cc4ff" intensity={1.2} distance={2.5} />
    </group>
  );
}

function Tile({ m }: { m: Mats }) {
  const g = useMemo(() => new RoundedBoxGeometry(0.46, 0.46, 0.05, 3, 0.02), []);
  return <mesh geometry={g} material={m.ceramic} />;
}

/* ─── Замена на свою .glb-модель ───────────────────────────── */

function GltfModel({ src, size }: { src: string; size: number }) {
  const gltf = useLoader(GLTFLoader, src);
  const object = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const dims = box.getSize(new THREE.Vector3());
    const k = size / Math.max(dims.x, dims.y, dims.z);
    scene.scale.setScalar(k);
    scene.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-k));
    return scene;
  }, [gltf, size]);
  return <primitive object={object} />;
}

// Если файла нет или он битый — показываем объект, нарисованный кодом
class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Slot({ src, size, children }: { src: string | null; size: number; children: ReactNode }) {
  if (!src) return <>{children}</>;
  return (
    <Fallback fallback={children}>
      <Suspense fallback={children}>
        <GltfModel src={src} size={size} />
      </Suspense>
    </Fallback>
  );
}

/* ─── Движение ─────────────────────────────────────────────── */

function Float({
  children,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  speed = 0.8,
  amp = 0.1,
  spin = 0.15,
  phase = 0,
}: {
  children: ReactNode;
  position: Vec3;
  rotation?: Vec3;
  scale?: number;
  speed?: number;
  amp?: number;
  spin?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime * speed + phase;
    g.position.y = position[1] + Math.sin(t) * amp;
    g.rotation.x = rotation[0] + Math.sin(t * 0.7) * 0.08;
    g.rotation.z = rotation[2] + Math.cos(t * 0.6) * 0.06;
    g.rotation.y += delta * spin;
  });
  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      {children}
    </group>
  );
}

// Вся композиция: наклон к курсору + вращение перетаскиванием с инерцией
function Rig({ spin, children }: { spin: (delta: number) => number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const tilt = useRef({ x: 0, y: 0 });
  useFrame((state, delta) => {
    const rot = spin(delta);
    tilt.current.x = THREE.MathUtils.damp(tilt.current.x, -state.pointer.y * 0.12, 4, delta);
    tilt.current.y = THREE.MathUtils.damp(tilt.current.y, state.pointer.x * 0.22, 4, delta);
    ref.current?.rotation.set(tilt.current.x, rot + tilt.current.y, 0);
  });
  return <group ref={ref}>{children}</group>;
}

function Environment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [get]);
  return null;
}

// Камера отъезжает на узких экранах, чтобы композиция помещалась целиком
function FitCamera() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const { camera } = get();
    const aspect = size.width / size.height;
    // Помещаем по высоте (±3 ед.) и по ширине (±2.55 ед.), берём дальнее из двух
    const t = Math.tan(THREE.MathUtils.degToRad(35 / 2));
    camera.position.z = Math.max(3 / t, 2.55 / (t * aspect));
    camera.updateProjectionMatrix();
  }, [get, size]);
  return null;
}

function Scene({ spin }: { spin: (delta: number) => number }) {
  const m = useMaterials();
  return (
    <>
      <Environment />
      <FitCamera />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <directionalLight position={[-4, 2, -3]} intensity={1.6} color="#58aee8" />
      <Rig spin={spin}>
        <Float position={[0, -0.05, 0]} rotation={[0, -0.45, 0]} spin={0} amp={0.05} speed={0.5}>
          <Slot src={heroModels.tower} size={4}>
            <Tower m={m} />
          </Slot>
        </Float>
        <Float position={[-1.75, 1.35, -0.6]} rotation={[0, 0.5, 0]} scale={0.7} phase={1} spin={0.12}>
          <Slot src={heroModels.cabinet} size={1.3}>
            <Cabinet m={m} />
          </Slot>
        </Float>
        <Float position={[1.65, -1.75, 0.8]} rotation={[0.2, -0.4, 0.1]} scale={0.72} phase={2.2} spin={0.18}>
          <Slot src={heroModels.valve} size={1.5}>
            <Valve m={m} />
          </Slot>
        </Float>
        <Float position={[1.55, 1.95, -0.7]} rotation={[0.35, 0, -0.2]} scale={0.66} phase={3.4} spin={0.1}>
          <Slot src={heroModels.helmet} size={1.2}>
            <Helmet m={m} />
          </Slot>
        </Float>
        <Float position={[-1.7, -1.7, 0.9]} rotation={[0, 0.3, 0.5]} scale={0.76} phase={4.1} spin={0.14}>
          <Slot src={heroModels.roller} size={1.2}>
            <Roller m={m} />
          </Slot>
        </Float>
        <Float position={[-0.55, 2.45, -1]} scale={0.6} phase={5} spin={0.2}>
          <Slot src={heroModels.bulb} size={0.9}>
            <Bulb m={m} />
          </Slot>
        </Float>
        <Float position={[0.75, 2.7, 0.4]} rotation={[0.9, 0.4, 0.2]} scale={0.55} phase={0.6} spin={0.25} amp={0.14}>
          <Tile m={m} />
        </Float>
      </Rig>
    </>
  );
}

export default function Hero3D() {
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({ active: false, rot: 0, vel: 0, lastX: 0, lastT: 0 });
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Не рендерим кадры, когда сцена ушла за экран
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onDown = (e: React.PointerEvent) => {
    const d = drag.current;
    d.active = true;
    d.vel = 0;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dt = Math.max(e.timeStamp - d.lastT, 1) / 1000;
    const step = dx * 0.008;
    d.rot += step;
    d.vel = THREE.MathUtils.lerp(d.vel, step / dt, 0.5); // сглаженная скорость для передачи в инерцию
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  };
  // Шаг инерции: после отпускания вращение продолжается с той же скоростью и плавно гаснет
  const spin = useCallback((delta: number) => {
    const d = drag.current;
    if (!d.active) {
      d.rot += d.vel * delta;
      d.vel *= Math.pow(0.08, delta);
    }
    return d.rot;
  }, []);

  const onUp = () => {
    drag.current.active = false;
  };
  const onCancel = () => {
    drag.current.active = false;
    drag.current.vel = 0;
  };

  return (
    <div
      ref={wrap}
      className="size-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
      aria-label="3D-композиция: здание, электрощит, вентиль, каска, валик и лампа. Можно вращать."
      role="img"
    >
      <Canvas
        camera={{ position: [0, 0.2, 8.6], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={!visible ? "never" : reduced ? "demand" : "always"}
      >
        <Suspense fallback={null}>
          <Scene spin={spin} />
        </Suspense>
      </Canvas>
    </div>
  );
}
