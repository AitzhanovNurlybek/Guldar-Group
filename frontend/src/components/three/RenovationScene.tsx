"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { backgroundModel } from "@/lib/site";
import { buildHuman, createHumanKit, poseWalk, poseWork, strideLength, wobble, type WorkState } from "./humans";
import { getScroll, subscribeScroll } from "./scroll";
import { blobTexture, concreteTexture, edgeTexture } from "./textures";

/*
 * Макет коммерческого помещения в разрезе — «до» и «после» ремонта, с живыми людьми.
 * Прокрутка страницы = ход ремонта: маляр докрашивает стену, кладётся плитка, вешаются и
 * загораются светильники, ставится витрина, появляются стойка, стеллаж и вывеска.
 *
 * Прокрутка управляет камерой (а не моделью): единый progress 0 → 1 → опорные ракурсы → сглаживание.
 * Независимо от прокрутки живёт idle-анимация: человек ходит по мосткам, маляр работает валиком,
 * люди дышат, провода и светильники чуть покачиваются.
 * При системной настройке «уменьшить движение» idle-анимации нет, кадры рисуются только при прокрутке.
 */

const START = 0.12; // на первом экране ремонт только начался
const H = 2.6; // высота стен

/* ─── Материалы ──────────────────────────────────────────────── */

function createMaterials(hq: boolean) {
  const concrete = concreteTexture(7, hq ? 512 : 256);
  const plasterTex = concreteTexture(23, hq ? 512 : 256);
  const std = (color: string, roughness = 0.7, metalness = 0, map?: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, map: map ?? null, roughnessMap: map ?? null });
  return {
    textures: [concrete, plasterTex],
    // Бетон и штукатурка — с фактурой; шероховатость «гуляет» по той же карте
    slab: std("#39434d", 0.9, 0, concrete),
    screed: std("#9aa2aa", 0.95, 0, concrete),
    plaster: std("#a7afb6", 1, 0, plasterTex),
    paint: std("#f1f2f3", 0.9, 0, plasterTex),
    accent: std("#1d5a8a", 0.62),
    tile: std("#ffffff", 0.38),
    // Металл: тёмный матовый и светлая сталь — ловят блики окружения
    steel: std("#aab5bf", 0.34, 0.9),
    steelDark: std("#2c353e", 0.45, 0.8),
    wood: std("#b98a5e", 0.6),
    white: std("#f3f5f7", 0.45),
    orange: std("#f5871f", 0.5),
    green: std("#3f8f5a", 0.85),
    greenDark: std("#2f6e45", 0.85),
    blueBox: std("#2f73ad", 0.6),
    paintBlue: std("#3b8fd6", 0.4),
    nap: std("#e9ecef", 1),
    // Стекло из двух слоёв: лёгкая голубая тонировка + отражение окружения, которое складывается со светом.
    // Так стекло прозрачное, но с живыми бликами — без дорогого прохода transmission.
    glass: new THREE.MeshPhysicalMaterial({
      color: "#bfe2f7",
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
    glassReflect: new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.06,
      metalness: 1,
      envMapIntensity: 1.1,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    lamp: new THREE.MeshStandardMaterial({ color: "#fff4e0", emissive: "#ffd9a0", emissiveIntensity: 0.05 }),
    sign: new THREE.MeshStandardMaterial({ color: "#9fd1f4", emissive: "#7cc4ff", emissiveIntensity: 0 }),
    cone: new THREE.MeshBasicMaterial({
      color: "#ffd9a0",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  };
}
type Mats = ReturnType<typeof createMaterials>;

/* ─── Помощники ──────────────────────────────────────────────── */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (k: number, a: number, b: number) => clamp01((k - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
// Лёгкий «отскок» в конце — предмет ставят на место
const easeBack = (t: number) => {
  const c = 1.4;
  return t <= 0 ? 0 : t >= 1 ? 1 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

const UP = new THREE.Vector3(0, 1, 0);
const box = new THREE.BoxGeometry(1, 1, 1);

// Брусья с фаской: металл и мебель ловят кромкой свет. Кэш по размерам — каждая геометрия одна.
const RB = new Map<string, THREE.BufferGeometry>();
function rb(w: number, h: number, d: number, r = 0.012) {
  const key = `${w}|${h}|${d}|${r}`;
  let g = RB.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) / 2 - 1e-4));
    RB.set(key, g);
  }
  return g;
}

// Стержень от точки a до точки b — для лестницы, вывески и валика
function strut(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  const p = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  return new THREE.Matrix4().compose(p, q, new THREE.Vector3(t, len, t));
}

// Знак логотипа (две башни) линиями — для светящейся вывески
function logoStruts() {
  const s = 0.024;
  const P = (x: number, y: number) => new THREE.Vector3((x - 24) * s, (41 - y) * s, 0);
  const lines: [number, number][][] = [
    [[2, 41], [7, 41]],
    [[41, 41], [46, 41]],
    [[7, 41], [7, 29], [15, 24.5]],
    [[41, 41], [41, 29], [33, 24.5]],
    [[15, 41], [15, 12], [23, 17], [23, 41]],
    [[25, 41], [25, 16.5], [33, 6], [33, 41]],
  ];
  const out: THREE.Matrix4[] = [];
  lines.forEach((pl) => {
    for (let i = 0; i < pl.length - 1; i++) out.push(strut(P(...pl[i]), P(...pl[i + 1]), 0.03));
  });
  return out;
}

function ladderStruts() {
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const out: THREE.Matrix4[] = [];
  for (const x of [-0.24, 0.24]) {
    out.push(strut(v(x, 0, 0.32), v(x * 0.8, 1.7, 0), 0.05));
    out.push(strut(v(x, 0, -0.32), v(x * 0.8, 1.7, 0), 0.05));
  }
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const z = 0.32 * (1 - t);
    const hw = 0.24 - 0.048 * t;
    out.push(strut(v(-hw, 1.7 * t, z), v(hw, 1.7 * t, z), 0.035));
  }
  return out;
}

/* ─── Мостки: решётчатый настил и перила ─────────────────────── */

const DECK = 0.16; // высота настила
const WALK = { x0: -1.05, x1: 1.75, z0: 1.42, z1: 1.96 };
const WALK_Z = 1.67; // ось движения человека
const WALK_X = [-0.72, 1.42] as const;

function walkwayStruts(step: number) {
  const out: THREE.Matrix4[] = [];
  const len = WALK.x1 - WALK.x0;
  const w = WALK.z1 - WALK.z0;
  const zc = (WALK.z0 + WALK.z1) / 2;
  // Поперечные полосы решётки
  for (let x = WALK.x0 + step / 2; x < WALK.x1; x += step)
    out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, DECK - 0.012, zc), new THREE.Quaternion(), new THREE.Vector3(0.012, 0.024, w - 0.04)));
  // Продольные
  for (let i = 1; i < 5; i++)
    out.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(WALK.x0 + len / 2, DECK - 0.03, WALK.z0 + (w * i) / 5),
        new THREE.Quaternion(),
        new THREE.Vector3(len - 0.04, 0.03, 0.01),
      ),
    );
  return out;
}

function Struts({ matrices, material, cast = true, geometry = box }: { matrices: THREE.Matrix4[]; material: THREE.Material; cast?: boolean; geometry?: THREE.BufferGeometry }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} castShadow={cast} receiveShadow />;
}

function Walkway({ mats, hq }: { mats: Mats; hq: boolean }) {
  const grid = useMemo(() => walkwayStruts(hq ? 0.05 : 0.1), [hq]);
  const len = WALK.x1 - WALK.x0;
  const xc = (WALK.x0 + WALK.x1) / 2;
  const posts = [WALK.x0 + 0.04, WALK.x0 + len / 3, WALK.x0 + (2 * len) / 3, WALK.x1 - 0.04];
  return (
    <group>
      {/* Обвязка настила */}
      {[WALK.z0 + 0.02, WALK.z1 - 0.02].map((z) => (
        <mesh key={z} geometry={rb(len, 0.12, 0.04, 0.008)} material={mats.steelDark} position={[xc, DECK - 0.06, z]} castShadow receiveShadow />
      ))}
      {[WALK.x0 + 0.02, WALK.x1 - 0.02].map((x) => (
        <mesh key={x} geometry={rb(0.04, 0.12, WALK.z1 - WALK.z0, 0.008)} material={mats.steelDark} position={[x, DECK - 0.06, (WALK.z0 + WALK.z1) / 2]} castShadow />
      ))}
      <Struts matrices={grid} material={mats.steel} />
      {/* Перила со стороны зрителя — передний план, дают глубину */}
      {posts.map((x) => (
        <mesh key={x} geometry={rb(0.035, 0.95, 0.035, 0.008)} material={mats.steelDark} position={[x, DECK + 0.475, WALK.z1 - 0.03]} castShadow />
      ))}
      {[0.95, 0.5].map((y, i) => (
        <mesh key={y} position={[xc, DECK + y, WALK.z1 - 0.03]} rotation={[0, 0, Math.PI / 2]} material={i ? mats.steelDark : mats.orange} castShadow>
          <cylinderGeometry args={[i ? 0.012 : 0.02, i ? 0.012 : 0.02, len, 12]} />
        </mesh>
      ))}
      {/* Ступень */}
      <mesh geometry={rb(0.3, 0.08, 0.5, 0.01)} material={mats.steelDark} position={[WALK.x0 - 0.15, 0.04, (WALK.z0 + WALK.z1) / 2]} castShadow receiveShadow />
    </group>
  );
}

/* ─── Помещение ──────────────────────────────────────────────── */

const TILE_N = 8;
const TILE = 4 / TILE_N;
// Временные объекты для покадровых расчётов — без мусора в памяти на каждом кадре
const TM = new THREE.Matrix4();
const TQ = new THREE.Quaternion();
const TP = new THREE.Vector3();
const TS = new THREE.Vector3();

const tileProgress = (k: number) => seg(k, 0.22, 0.6);
// Насколько уложена плитка в клетке (i, j): 0 — нет, 1 — лежит
function tileT(k: number, i: number, j: number) {
  const thr = ((i + j) / (2 * TILE_N - 2)) * 0.75;
  return easeBack(seg(tileProgress(k), thr, thr + 0.25));
}
function floorAt(k: number, x: number, z: number) {
  const i = Math.min(TILE_N - 1, Math.max(0, Math.floor((x + 2) / TILE)));
  const j = Math.min(TILE_N - 1, Math.max(0, Math.floor((z + 2) / TILE)));
  return 0.01 + 0.04 * Math.min(1, tileT(k, i, j));
}
// Край покрашенной части стены и где при этом валик
const paintWidth = (k: number) => 4 * easeOut(seg(k, 0.02, 0.3));
const rollerX = (k: number) => Math.min(0.95, Math.max(-1.55, -2 + Math.max(paintWidth(k), 0.35) - 0.2));

type Progress = { k: number };

function Room({ reduced, hq }: { reduced: boolean; hq: boolean }) {
  const mats = useMemo(() => createMaterials(hq), [hq]);
  const logo = useMemo(() => logoStruts(), []);
  const ladder = useMemo(() => ladderStruts(), []);
  const logoFacets = useMemo(() => {
    const s = 0.024;
    const shape = (pts: [number, number][]) => {
      const sh = new THREE.Shape();
      pts.forEach(([x, y], i) => (i ? sh.lineTo((x - 24) * s, (41 - y) * s) : sh.moveTo((x - 24) * s, (41 - y) * s)));
      sh.closePath();
      return sh;
    };
    return new THREE.ShapeGeometry([
      shape([[18, 41], [18, 24], [23, 27.2], [23, 41]]),
      shape([[28.5, 41], [28.5, 30], [33, 26.2], [33, 41]]),
    ]);
  }, []);
  const tileColors = useMemo(() => {
    const a = new THREE.Color("#d9d4cc");
    const b = new THREE.Color("#c9c3b9");
    return Array.from({ length: TILE_N * TILE_N }, (_, i) => ((Math.floor(i / TILE_N) + i) % 2 ? a : b));
  }, []);
  // Контактные тени и «запечённая» AO у стыков стен и пола
  const overlays = useMemo(() => {
    const edge = edgeTexture();
    const blob = blobTexture();
    const shade = (map: THREE.Texture, opacity: number) =>
      new THREE.MeshBasicMaterial({ color: "#05090f", alphaMap: map, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    return { edge, blob, ao: shade(edge, 0.42), aoWall: shade(edge, 0.3), contact: shade(blob, 0.5) };
  }, []);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => (Array.isArray(m) ? m.forEach((t) => t.dispose()) : m.dispose()));
      Object.values(overlays).forEach((o) => o.dispose());
      logoFacets.dispose();
      RB.forEach((g) => g.dispose());
      RB.clear();
    },
    [mats, overlays, logoFacets],
  );

  const progress = useRef<Progress>({ k: START });
  const state = useRef({ current: reduced ? START : 0, time: 0 });
  // Части макета по именам — заполняются ref-колбэками, читаются в кадре
  const [parts] = useState(() => new Map<string, THREE.Object3D>());
  const tiles = useRef<THREE.InstancedMesh>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const lampLight = useRef<THREE.PointLight>(null);

  useLayoutEffect(() => {
    const mesh = tiles.current;
    if (!mesh) return;
    tileColors.forEach((c, i) => mesh.setColorAt(i, c));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [tileColors]);

  useFrame((frame, delta) => {
    const s = state.current;
    // Шаг ограничен 0.1 с: на медленном устройстве сглаживание сходится за то же время, а не за то же число кадров
    const dt = Math.min(delta, 0.1);
    if (!reduced) s.time += dt;
    const t = s.time;
    // Ход ремонта сглаживаем всегда: это ответ на действие человека, без сглаживания — рывки
    const target = START + (1 - START) * getScroll().progress;
    s.current = THREE.MathUtils.damp(s.current, target, 3.5, dt);
    if (Math.abs(s.current - target) < 0.001) s.current = target;
    else if (reduced) frame.invalidate();
    const k = s.current;
    progress.current.k = k;
    // Map, а не объект: части могут ещё не смонтироваться — тогда просто пропускаем
    const P = (name: string) => parts.get(name) as THREE.Object3D;

    const show = (name: string, v: number) => {
      const o = P(name);
      if (!o) return;
      o.visible = v > 0.001;
      o.scale.setScalar(Math.max(v, 0.001));
    };

    // 1. Покраска задней стены — слой краски растёт за валиком маляра
    const w = paintWidth(k);
    if (P("paint")) {
      P("paint").visible = w > 0.01;
      P("paint").scale.set(Math.max(w, 0.001), H - 0.02, 0.01);
      P("paint").position.x = -2 + w / 2;
    }

    // 2. Плитка — от угла к краю, стопка на полу тает
    const tileP = tileProgress(k);
    const tm = tiles.current;
    if (tm) {
      for (let i = 0; i < TILE_N; i++)
        for (let j = 0; j < TILE_N; j++) {
          const v = tileT(k, i, j);
          const sc = v > 0.001 ? v : 0.0001;
          TP.set(-2 + TILE * (i + 0.5), 0.035 + (1 - Math.min(v, 1)) * 0.25, -2 + TILE * (j + 0.5));
          TS.set((TILE - 0.02) * sc, 0.03 * sc, (TILE - 0.02) * sc);
          tm.setMatrixAt(i * TILE_N + j, TM.compose(TP, TQ, TS));
        }
      tm.instanceMatrix.needsUpdate = true;
    }
    if (P("stack")) {
      const left = 1 - tileP;
      P("stack").visible = left > 0.02;
      P("stack").scale.set(1, Math.max(left, 0.001), 1);
    }

    // 3. Электрика: провода → светильники → свет. Провода и подвесы чуть покачиваются
    if (P("wires")) {
      P("wires").visible = k < 0.5;
      P("wires").children.forEach((o, i) => {
        o.rotation.set(0.03 * Math.sin(t * 0.9 + i * 1.7), 0, 0.04 * Math.sin(t * 0.7 + i * 2.3));
      });
    }
    show("coil", 1 - easeOut(seg(k, 0.58, 0.64)));
    show("lampA", easeBack(seg(k, 0.46, 0.56)));
    show("lampB", easeBack(seg(k, 0.5, 0.6)));
    if (P("lampA")) P("lampA").rotation.z = 0.008 * Math.sin(t * 0.8);
    if (P("lampB")) P("lampB").rotation.z = 0.008 * Math.sin(t * 0.8 + 1.4);
    const on = easeOut(seg(k, 0.62, 0.7));
    // Живой свет: едва заметное «дыхание» яркости
    const breathe = 1 + 0.015 * Math.sin(t * 0.6) * Math.sin(t * 1.7);
    const lampMesh = P("lampDiffuser") as THREE.Mesh | undefined;
    if (lampMesh) (lampMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = (0.05 + on * 2.4) * breathe;
    const coneMesh = P("coneA") as THREE.Mesh | undefined;
    if (coneMesh) (coneMesh.material as THREE.MeshBasicMaterial).opacity = on * 0.05 * breathe;
    if (hemi.current) hemi.current.intensity = 0.55 + on * 0.35;
    if (lampLight.current) lampLight.current.intensity = on * 1.1 * breathe;

    // 4. Витрина: стёкла встают снизу вверх
    ["glass0", "glass1", "glass2"].forEach((n, i) => {
      const v = easeOut(seg(k, 0.5 + i * 0.05, 0.62 + i * 0.05));
      const o = P(n);
      if (!o) return;
      o.visible = v > 0.001;
      o.scale.set(1, Math.max(v, 0.001), 1);
    });

    // 5. Мебель и вывеска, строительный инвентарь убирают
    show("accent", easeOut(seg(k, 0.64, 0.74)));
    show("counter", easeBack(seg(k, 0.7, 0.8)));
    show("shelving", easeBack(seg(k, 0.74, 0.84)));
    show("goods", easeBack(seg(k, 0.8, 0.9)));
    show("plant", easeBack(seg(k, 0.84, 0.92)));
    if (P("plant")) P("plant").rotation.z = 0.012 * Math.sin(t * 0.5);
    show("ladder", 1 - easeOut(seg(k, 0.78, 0.88)));
    show("toolbox", 1 - easeOut(seg(k, 0.86, 0.94)));
    show("sign", easeBack(seg(k, 0.84, 0.93)));
    const signLines = P("signLines")?.children[0] as THREE.InstancedMesh | undefined;
    if (signLines) (signLines.material as THREE.MeshStandardMaterial).emissiveIntensity = easeOut(seg(k, 0.9, 1)) * 2.2 * breathe;
  });

  const ref = (name: string) => (o: THREE.Object3D | null) => {
    if (o) parts.set(name, o);
    else parts.delete(name);
  };

  return (
    <>
      <hemisphereLight ref={hemi} args={["#cfe6ff", "#1a2430", 0.55]} />
      <pointLight ref={lampLight} position={[0.4, 1.9, -0.15]} intensity={0} distance={4.5} decay={2} color="#ffe2b8" />
      <group>
        {/* Плита перекрытия и стяжка */}
        <mesh geometry={rb(4.36, 0.3, 4.36, 0.03)} material={mats.slab} position={[0, -0.16, 0]} receiveShadow />
        <mesh geometry={box} material={mats.screed} position={[0.08, 0.005, 0.08]} scale={[4.16, 0.01, 4.16]} receiveShadow />
        <instancedMesh ref={tiles} args={[box, mats.tile, TILE_N * TILE_N]} receiveShadow />

        {/* AO у стыков: пол у задней стены и у витрины, низ стены */}
        <mesh material={overlays.ao} position={[0.08, 0.053, -1.78]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.12, 0.42]} />
        </mesh>
        <group position={[-1.8, 0.052, 0.08]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={overlays.ao} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.12, 0.4]} />
          </mesh>
        </group>
        <mesh material={overlays.aoWall} position={[0.08, 0.2, -1.984]}>
          <planeGeometry args={[4.12, 0.34]} />
        </mesh>

        {/* Задняя стена: штукатурка + слой краски, который растёт слева направо */}
        <mesh geometry={box} material={mats.plaster} position={[0, H / 2, -2.08]} scale={[4.32, H, 0.16]} receiveShadow castShadow />
        <mesh geometry={rb(4.34, 0.05, 0.18, 0.012)} material={mats.steelDark} position={[0, H + 0.02, -2.08]} castShadow />
        <mesh ref={ref("paint")} geometry={box} material={mats.paint} position={[0, H / 2, -1.995]} scale={[0.001, H, 0.01]} receiveShadow />

        {/* Витрина слева: каркас, стёкла ставятся по ходу ремонта */}
        <group position={[-2.06, 0, 0.08]}>
          <mesh geometry={rb(0.14, 0.14, 4.16, 0.02)} material={mats.steelDark} position={[0, 0.07, 0]} castShadow receiveShadow />
          <mesh geometry={rb(0.14, 0.2, 4.16, 0.02)} material={mats.steelDark} position={[0, H - 0.1, 0]} castShadow />
          {[-2.02, -0.69, 0.64, 1.97].map((z) => (
            <mesh key={z} geometry={rb(0.1, H, 0.1, 0.015)} material={mats.steelDark} position={[0, H / 2, z]} castShadow />
          ))}
          {[-1.355, -0.025, 1.305].map((z, i) => (
            <group key={z} ref={ref(`glass${i}`)} position={[0, 0.14, z]}>
              <mesh geometry={box} material={mats.glass} position={[0, (H - 0.34) / 2, 0]} scale={[0.03, H - 0.34, 1.23]} />
              <mesh geometry={box} material={mats.glassReflect} position={[0.017, (H - 0.34) / 2, 0]} scale={[0.002, H - 0.34, 1.23]} />
            </group>
          ))}
        </group>

        {/* Электрощит с трассой и мотком кабеля */}
        <group position={[1.55, 0, -1.94]}>
          <mesh geometry={rb(0.46, 0.64, 0.1, 0.02)} material={mats.white} position={[0, 1.35, 0]} castShadow />
          <mesh geometry={box} material={mats.orange} position={[0, 1.58, 0.055]} scale={[0.46, 0.06, 0.01]} />
          <mesh geometry={rb(0.05, 0.86, 0.05, 0.01)} material={mats.steelDark} position={[0, 2.1, 0]} />
        </group>
        <mesh ref={ref("coil")} position={[1.72, 0.05, -0.95]} rotation={[Math.PI / 2, 0, 0]} material={mats.orange} castShadow>
          <torusGeometry args={[0.2, 0.045, 12, 32]} />
        </mesh>

        {/* Провода под светильники — висят с потолка, пока светильники не повесили */}
        <group ref={ref("wires")}>
          {[-0.2, 1.0, 0.0, 0.8].map((x, i) => (
            <group key={i} position={[x, H - 0.02, i < 2 ? -0.85 : 0.55]}>
              <mesh material={mats.steelDark} position={[0, -0.25, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.5, 6]} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Светильники: подвесные линейные, с конусом света */}
        {[
          { name: "lampA", pos: [0.4, 2.2, -0.85] as const },
          { name: "lampB", pos: [0.4, 2.2, 0.55] as const },
        ].map((l, i) => (
          <group key={l.name} ref={ref(l.name)} position={l.pos}>
            <mesh geometry={rb(1.4, 0.06, 0.11, 0.015)} material={mats.steelDark} castShadow />
            <mesh ref={i === 0 ? ref("lampDiffuser") : undefined} geometry={box} material={mats.lamp} position={[0, -0.035, 0]} scale={[1.34, 0.012, 0.08]} />
            {[-0.55, 0.55].map((x) => (
              <mesh key={x} geometry={box} material={mats.steelDark} position={[x, 0.4, 0]} scale={[0.01, 0.8, 0.01]} />
            ))}
            <mesh ref={i === 0 ? ref("coneA") : undefined} material={mats.cone} position={[0, -1.1, 0]} scale={[1.7, 1, 0.9]}>
              <coneGeometry args={[0.75, 2.1, 24, 1, true]} />
            </mesh>
          </group>
        ))}

        {/* Стойка ресепшена и фирменная стена с вывеской */}
        <group ref={ref("accent")} position={[0.4, 1.55, -1.985]}>
          <mesh geometry={box} material={mats.accent} scale={[2.1, 1.25, 0.02]} receiveShadow />
        </group>
        <group ref={ref("sign")} position={[0.4, 1.28, -1.96]}>
          <group ref={ref("signLines")}>
            <Struts matrices={logo} material={mats.sign} cast={false} />
          </group>
          <mesh geometry={logoFacets} material={mats.paintBlue} position={[0, 0, -0.005]} />
        </group>
        <group ref={ref("counter")} position={[0.4, 0, -0.85]}>
          <mesh geometry={rb(1.8, 0.9, 0.55, 0.02)} material={mats.wood} position={[0, 0.45, 0]} castShadow receiveShadow />
          <mesh geometry={rb(1.9, 0.05, 0.64, 0.015)} material={mats.white} position={[0, 0.925, 0]} castShadow />
          <mesh geometry={box} material={mats.accent} position={[0, 0.62, 0.28]} scale={[1.8, 0.1, 0.01]} />
        </group>

        {/* Стеллаж с товаром — поставка материалов */}
        <group ref={ref("shelving")} position={[-1.3, 0, -1.72]}>
          {[-0.52, 0.52].map((x) => (
            <mesh key={x} geometry={rb(0.04, 2, 0.04, 0.008)} material={mats.steelDark} position={[x, 1, 0]} castShadow />
          ))}
          {[0.3, 0.8, 1.3, 1.8].map((y) => (
            <mesh key={y} geometry={rb(1.08, 0.03, 0.32, 0.008)} material={mats.white} position={[0, y, 0]} castShadow receiveShadow />
          ))}
        </group>
        <group ref={ref("goods")} position={[-1.3, 0, -1.72]}>
          {(
            [
              [-0.3, 0.42, "orange"],
              [0.05, 0.4, "blueBox"],
              [0.32, 0.43, "white"],
              [-0.2, 0.92, "blueBox"],
              [0.25, 0.9, "orange"],
              [-0.28, 1.41, "white"],
              [0.12, 1.42, "blueBox"],
            ] as const
          ).map(([x, y, mat], i) => (
            <mesh key={i} geometry={rb(0.26, 0.2 + (i % 3) * 0.04, 0.22, 0.01)} material={mats[mat]} position={[x, y, 0]} castShadow />
          ))}
        </group>

        <group ref={ref("plant")} position={[-1.6, 0, 1.2]}>
          <mesh material={mats.steelDark} position={[0, 0.17, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.13, 0.34, 24]} />
          </mesh>
          <mesh material={mats.green} position={[0, 0.66, 0]} castShadow>
            <icosahedronGeometry args={[0.33, 2]} />
          </mesh>
          <mesh material={mats.greenDark} position={[0.14, 0.92, 0.05]} castShadow>
            <icosahedronGeometry args={[0.2, 2]} />
          </mesh>
        </group>

        {/* Инвентарь ремонта: стремянка, ящик, стопка плитки */}
        <group ref={ref("ladder")} position={[1.25, 0, -0.2]} rotation={[0, -0.5, 0]}>
          <Struts matrices={ladder} material={mats.steel} />
        </group>
        <group ref={ref("toolbox")} position={[1.35, 0, 1.1]} rotation={[0, 0.4, 0]}>
          <mesh geometry={rb(0.5, 0.24, 0.24, 0.02)} material={mats.orange} position={[0, 0.12, 0]} castShadow />
          <mesh geometry={rb(0.3, 0.04, 0.04, 0.01)} material={mats.steelDark} position={[0, 0.3, 0]} />
        </group>
        <group ref={ref("stack")} position={[0.2, 0, 0.85]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} geometry={rb(0.48, 0.03, 0.48, 0.006)} material={mats.tile} position={[0, 0.02 + i * 0.035, 0]} castShadow />
          ))}
        </group>

        <Walkway mats={mats} hq={hq} />
        <People progress={progress} reduced={reduced} mats={mats} contact={overlays.contact} />
      </group>
    </>
  );
}

/* ─── Люди ───────────────────────────────────────────────────── */

const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
// Ручка валика относительно центра валика
const GRIP = new THREE.Vector3(0, -0.205, 0.22);

function buildRoller(mats: Mats) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);
  const napGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.23, 24);
  const rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  const nap = new THREE.Mesh(napGeo, mats.nap);
  nap.rotation.z = Math.PI / 2;
  nap.castShadow = true;
  spin.add(nap);
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const pts = [v(0.13, 0, 0), v(0.13, -0.1, 0.1), v(0.02, -0.15, 0.16), v(-0.02, -0.26, 0.28)];
  const tmp = new THREE.Vector3();
  const add = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) => {
    const mesh = new THREE.Mesh(rod, m);
    strut(a, b, 1).decompose(mesh.position, mesh.quaternion, tmp);
    mesh.scale.set(r, tmp.y, r);
    mesh.castShadow = true;
    group.add(mesh);
  };
  add(v(-0.12, 0, 0), pts[0], 0.005, mats.steel);
  add(pts[0], pts[1], 0.005, mats.steel);
  add(pts[1], pts[2], 0.005, mats.steel);
  add(pts[2], pts[3], 0.017, mats.orange);
  return {
    group,
    spin,
    dispose: () => {
      napGeo.dispose();
      rod.dispose();
    },
  };
}

function buildCast(mats: Mats) {
  const kit = createHumanKit();
  const walker = buildHuman(kit, {
    skin: kit.mat.skinA,
    top: kit.mat.jacket,
    pants: kit.mat.chino,
    shoe: kit.mat.shoeWhite,
    longSleeves: true,
  });
  const worker = buildHuman(kit, {
    skin: kit.mat.skinB,
    top: kit.mat.tee,
    pants: kit.mat.work,
    shoe: kit.mat.shoeDark,
    longSleeves: false,
    worker: true,
  });
  const roller = buildRoller(mats);
  return {
    walker,
    worker,
    roller,
    dispose: () => {
      kit.dispose();
      roller.dispose();
    },
  };
}

function People({
  progress,
  reduced,
  mats,
  contact,
}: {
  progress: React.RefObject<Progress>;
  reduced: boolean;
  mats: Mats;
  contact: THREE.Material;
}) {
  // Люди и валик собираются императивно и добавляются в группу; при размонтировании — убираются и освобождаются
  const holder = useRef<THREE.Group>(null);
  const cast = useRef<ReturnType<typeof buildCast> | null>(null);
  useEffect(() => {
    const c = buildCast(mats);
    const g = holder.current;
    g?.add(c.walker.root, c.worker.root, c.roller.group);
    cast.current = c;
    return () => {
      g?.remove(c.walker.root, c.worker.root, c.roller.group);
      cast.current = null;
      c.dispose();
    };
  }, [mats]);

  const sim = useRef({
    time: 0,
    // Человек на мостках
    x: 0.35,
    dir: 1,
    yaw: Math.PI / 2,
    turning: false,
    turn: 0,
    phase: 0,
    amp: 0,
    // Маляр
    rx: rollerX(START),
    prevRx: rollerX(START),
    stroke: 1.2,
    step: 0,
    look: { lookYaw: 0, lookPitch: 0 } as WorkState,
  });
  const bucket = useRef<THREE.Group>(null);
  const blobWalker = useRef<THREE.Mesh>(null);
  const blobWorker = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const s = sim.current;
    if (!cast.current) return;
    const { walker, worker, roller } = cast.current;
    const k = progress.current.k;
    if (!reduced) s.time += dt;
    const t = s.time;

    /* Человек на мостках: ходит туда-обратно, у края замедляется и разворачивается лицом к зрителю */
    let ampTarget = 0;
    if (reduced) {
      walker.root.rotation.y = s.yaw;
    } else if (!s.turning) {
      const rem = s.dir > 0 ? WALK_X[1] - s.x : s.x - WALK_X[0];
      const f = THREE.MathUtils.smoothstep(rem, 0, 0.55);
      const v = 0.95 * (0.35 + 0.65 * f) * (1 + 0.05 * wobble(t * 0.5, 1));
      ampTarget = 0.45 + 0.55 * f;
      s.x += s.dir * v * dt;
      s.phase += ((v * dt) / strideLength(s.amp || ampTarget)) * Math.PI * 2;
      s.yaw = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      if (rem <= 0.01) {
        s.turning = true;
        s.turn = 0;
      }
    } else {
      s.turn = Math.min(1, s.turn + dt / 1.5);
      const e = THREE.MathUtils.smootherstep(s.turn, 0, 1);
      const y0 = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      s.yaw = y0 - 2 * y0 * e; // через «лицом к зрителю»
      ampTarget = 0.3;
      s.phase += Math.PI * 2 * 0.8 * dt;
      if (s.turn >= 1) {
        s.turning = false;
        s.dir = -s.dir;
      }
    }
    s.amp = THREE.MathUtils.damp(s.amp, ampTarget, 5, dt);
    walker.root.position.set(s.x, DECK, WALK_Z);
    walker.root.rotation.y = s.yaw;
    poseWalk(walker, s.phase, s.amp, t, 0.3);
    if (blobWalker.current) {
      blobWalker.current.position.set(s.x + walker.pelvis.position.x * Math.sin(s.yaw), DECK + 0.003, WALK_Z);
      blobWalker.current.rotation.z = s.yaw;
    }

    /* Маляр: идёт вдоль стены за краем краски и катает валик вверх-вниз */
    const rxTarget = rollerX(k);
    s.rx = reduced ? rxTarget : THREE.MathUtils.damp(s.rx, rxTarget, 2.2, dt);
    const vx = (s.rx - s.prevRx) / Math.max(dt, 1e-4);
    s.prevRx = s.rx;
    if (!reduced) s.stroke += dt * ((Math.PI * 2) / 2.7) * (1 + 0.12 * wobble(t * 0.3, 4));
    const u = reduced ? 0.6 : 0.5 - 0.5 * Math.cos(s.stroke);
    const sway = Math.sin(s.stroke * 0.5);
    const rollerY = 1.15 + 0.95 * u;
    roller.group.position.set(s.rx, rollerY, -1.93);
    roller.spin.rotation.x = -rollerY / 0.055; // валик катится, а не скользит
    V1.copy(roller.group.position).add(GRIP);

    const wx = s.rx - 0.15;
    const floorY = floorAt(k, wx, -1.3);
    // Приставной шаг, когда маляр переходит вдоль стены
    const moving = Math.min(1, Math.abs(vx) * 5);
    s.step += (Math.abs(vx) / 0.22) * Math.PI * dt;
    worker.root.position.set(wx, floorY, -1.3);
    worker.root.rotation.y = Math.PI;
    poseWork(worker, u, sway, V1, V2.copy(roller.group.position), floorY, t, 2.1, s.look, dt, {
      liftL: 0.06 * moving * Math.max(0, Math.sin(s.step)),
      liftR: 0.06 * moving * Math.max(0, -Math.sin(s.step)),
    });
    if (blobWorker.current) blobWorker.current.position.set(wx, floorY + 0.004, -1.28);
    if (bucket.current) {
      const b = bucket.current;
      b.position.x = reduced ? wx - 0.55 : THREE.MathUtils.damp(b.position.x, wx - 0.55, 1.5, dt);
      b.position.y = floorAt(k, b.position.x, -1.45);
    }
  });

  return (
    <>
      <group ref={holder} />
      <group ref={bucket} position={[rollerX(START) - 0.7, 0.01, -1.45]}>
        <mesh material={mats.white} position={[0, 0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.17, 0.14, 0.3, 24]} />
        </mesh>
        <mesh material={mats.nap} position={[0, 0.29, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.01, 24]} />
        </mesh>
        <mesh material={mats.steel} position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.16, 0.006, 6, 24, Math.PI]} />
        </mesh>
      </group>
      <mesh ref={blobWalker} material={contact} rotation={[-Math.PI / 2, 0, 0]} scale={[0.42, 0.62, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={blobWorker} material={contact} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6, 0.5, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}

/* ─── Своя .glb вместо макета ─────────────────────────────────── */

function GltfModel({ src }: { src: string }) {
  const gltf = useLoader(GLTFLoader, src);
  const object = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const bbox = new THREE.Box3().setFromObject(scene);
    const dims = bbox.getSize(new THREE.Vector3());
    const k = 4.4 / Math.max(dims.x, dims.y, dims.z);
    scene.scale.setScalar(k);
    const c = bbox.getCenter(new THREE.Vector3()).multiplyScalar(-k);
    scene.position.set(c.x, -bbox.min.y * k, c.z);
    return scene;
  }, [gltf]);
  return <primitive object={object} />;
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

/* ─── Окружение, свет и камера ───────────────────────────────── */

function Environment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene, invalidate } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [get]);
  return null;
}

// Ключевой тёплый свет с мягкими тенями, холодный контровой по контуру людей и металла, заполняющий
function Lights({ hq, reduced }: { hq: boolean; reduced: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null);
  useFrame((state) => {
    if (reduced || !key.current) return;
    const t = state.clock.elapsedTime;
    key.current.intensity = 2.3 * (1 + 0.012 * Math.sin(t * 0.37) * Math.sin(t * 0.91));
  });
  const size = hq ? 2048 : 1024;
  return (
    <>
      <directionalLight
        ref={key}
        position={[3.5, 7, 4]}
        intensity={2.3}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[size, size]}
        shadow-radius={hq ? 5 : 3}
        shadow-camera-left={-3.4}
        shadow-camera-right={3.4}
        shadow-camera-top={3.4}
        shadow-camera-bottom={-3.4}
        shadow-camera-near={2}
        shadow-camera-far={16}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-3, 4.5, -5]} intensity={1.5} color="#9fd1ff" />
      <directionalLight position={[-5, 3, 5]} intensity={0.35} color="#8cc6ff" />
    </>
  );
}

/*
 * Камера снимает сцену по сценарию прокрутки. Опорные ракурсы — сферические координаты вокруг точки интереса:
 * азимут и возвышение (°), дистанция (доля от «вся комната в кадре») и сама точка.
 * Между опорами — сплайн Катмулла—Рома (без изломов), поверх — демпфирование: камера догоняет цель с инерцией.
 */
// shift — сдвиг объекта в кадре вправо (доля ширины): слева на экране текст, фокус держим в открытой части
const SHOTS: [number, number, number, number, number, number, number][] = [
  // az, el, dist, x,    y,    z,     shift
  [62, 25, 1.06, 0.1, 0.95, 0.15, 0], // 0.0 — вся комната, широко и сверху
  [53, 22, 0.82, 0.25, 0.95, 0.6, 0.06], // 0.2 — плавно ближе, в фокусе человек на мостках
  [36, 17, 0.56, 0.35, 1.0, 1.4, 0.12], // 0.4 — у мостков, человек идёт
  [70, 16, 0.56, 0.8, 1.2, -1.1, 0.1], // 0.6 — камера уходит вправо, в фокусе маляр (в профиль)
  [56, 23, 0.86, 0.3, 1.0, -0.1, 0.04], // 0.8 — отъезжаем
  [44, 21, 1.0, 0.1, 0.95, 0.1, 0], // 1.0 — финальный общий план
];
const CH = 7;
const DEG = Math.PI / 180;

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function sampleShot(p: number, out: number[]) {
  const n = SHOTS.length - 1;
  const f = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const u = f - i;
  const a = SHOTS[Math.max(0, i - 1)];
  const b = SHOTS[i];
  const c = SHOTS[i + 1];
  const d = SHOTS[Math.min(n, i + 2)];
  for (let ch = 0; ch < CH; ch++) out[ch] = catmull(a[ch], b[ch], c[ch], d[ch], u);
}

function CameraRig({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const size = useThree((s) => s.size);
  const st = useRef({
    target: new Array<number>(CH).fill(0),
    cur: null as number[] | null,
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    time: 0,
  });

  useEffect(() => {
    if (reduced || mobile) return;
    const s = st.current;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      s.px = (e.clientX / window.innerWidth) * 2 - 1;
      s.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, [reduced, mobile]);

  useFrame((state, delta) => {
    const s = st.current;
    const dt = Math.min(delta, 0.1);
    sampleShot(getScroll().progress, s.target);
    if (!s.cur) {
      // Вступление: камера мягко подъезжает к первому ракурсу
      s.cur = s.target.slice();
      if (!reduced) {
        s.cur[0] += 10;
        s.cur[1] += 6;
        s.cur[2] *= 1.25;
      }
    }
    let moving = false;
    for (let i = 0; i < CH; i++) {
      s.cur[i] = THREE.MathUtils.damp(s.cur[i], s.target[i], 2.2, dt);
      if (Math.abs(s.cur[i] - s.target[i]) > 1e-4) moving = true;
    }
    s.tx = THREE.MathUtils.damp(s.tx, s.px, 2.5, dt);
    s.ty = THREE.MathUtils.damp(s.ty, s.py, 2.5, dt);
    if (!reduced) s.time += dt;
    const t = s.time;

    // Собственное «дыхание» камеры и лёгкий параллакс за курсором
    const az = (s.cur[0] + s.tx * 3 + 0.8 * Math.sin(t * 0.13)) * DEG;
    const el = (s.cur[1] - s.ty * 1.6 + 0.5 * Math.sin(t * 0.09 + 1)) * DEG;
    const tan = Math.tan(THREE.MathUtils.degToRad(30 / 2));
    const aspect = size.width / Math.max(size.height, 1);
    const d0 = Math.max(2.9 / tan, 3.3 / (tan * aspect)) * (mobile ? 1.05 : 1);
    const d = s.cur[2] * d0;
    // Точка, куда смотрит камера, смещена влево от объекта — объект оказывается правее центра кадра
    const side = -2 * s.cur[6] * d * tan * aspect;
    const lx = s.cur[3] + side * Math.cos(az);
    const lz = s.cur[5] - side * Math.sin(az);
    const cam = state.camera;
    cam.position.set(
      lx + d * Math.cos(el) * Math.sin(az),
      s.cur[4] + d * Math.sin(el),
      lz + d * Math.cos(el) * Math.cos(az),
    );
    cam.lookAt(lx, s.cur[4], lz);
    if (reduced && moving) state.invalidate();
  });
  return null;
}

// Кадры: без «уменьшить движение» — каждый кадр (сцена живёт сама), на телефоне после первого экрана — через кадр.
// С «уменьшить движение» — только по прокрутке.
function Ticker({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (reduced) return subscribeScroll(() => invalidate());
    let raf = 0;
    let n = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      n++;
      if (!(mobile && getScroll().hero > 0.9) || n % 2 === 0) invalidate();
    };
    const unsubscribe = subscribeScroll(() => {});
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
    };
  }, [invalidate, reduced, mobile]);
  return null;
}

// Если кадры не успевают — снижаем плотность пикселей, пока не станет плавно (и обратно, с запасом)
function AdaptiveDpr({ max }: { max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ time: 0, frames: 0, dpr: max });
  useFrame((_, delta) => {
    const a = acc.current;
    a.time += Math.min(delta, 0.25);
    a.frames++;
    if (a.frames < 90) return;
    const avg = a.time / a.frames;
    a.time = 0;
    a.frames = 0;
    let next = a.dpr;
    if (avg > 1 / 45) next = Math.max(1, a.dpr - 0.25);
    else if (avg < 1 / 58 && a.dpr < max) next = Math.min(max, a.dpr + 0.125);
    if (next !== a.dpr) {
      a.dpr = next;
      setDpr(next);
    }
  });
  return null;
}

export default function RenovationScene() {
  const [reduced, setReduced] = useState(false);
  const [mobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px), (pointer: coarse)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const hq = !mobile;
  const maxDpr = mobile ? 1.25 : 1.75;
  const room = <Room reduced={reduced} hq={hq} />;

  return (
    <Canvas
      frameloop="demand"
      shadows="percentage"
      dpr={[1, maxDpr]}
      camera={{ fov: 30, position: [9, 7, 9], near: 0.5, far: 60 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
      }}
    >
      <Environment />
      <Lights hq={hq} reduced={reduced} />
      <CameraRig reduced={reduced} mobile={mobile} />
      <Ticker reduced={reduced} mobile={mobile} />
      {!reduced && <AdaptiveDpr max={maxDpr} />}
      {backgroundModel ? (
        <Fallback fallback={room}>
          <Suspense fallback={room}>
            <hemisphereLight args={["#cfe6ff", "#1a2430", 1]} />
            <GltfModel src={backgroundModel} />
          </Suspense>
        </Fallback>
      ) : (
        room
      )}
    </Canvas>
  );
}
