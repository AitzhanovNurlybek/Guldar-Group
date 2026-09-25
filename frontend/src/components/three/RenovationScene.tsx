"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { backgroundModel } from "@/lib/site";

/*
 * Макет коммерческого помещения в разрезе — «до» и «после» ремонта.
 * Прокрутка страницы = ход ремонта: валик красит стену, кладётся плитка, вешаются и
 * загораются светильники, ставится витрина, появляются стойка, стеллаж и вывеска.
 * Макет поворачивается при прокрутке и слегка покачивается на первом экране.
 * Рендер по требованию: на первом экране ~30 к/с, дальше — только во время прокрутки.
 * При системной настройке «уменьшить движение» покачивания нет, кадры — только при прокрутке.
 */

const START = 0.12; // на первом экране ремонт только начался
const H = 2.6; // высота стен
const ROT0 = -0.6; // поворот: ROT0 + прогресс × ROT
const ROT = 1.15;

/* ─── Материалы ──────────────────────────────────────────────── */

function createMaterials() {
  const std = (color: string, roughness = 0.7, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    slab: std("#2a343e", 0.9),
    screed: std("#7d868f", 0.95),
    plaster: std("#8b949c", 0.95),
    paint: std("#eef0f2", 0.85),
    accent: std("#1d5a8a", 0.6),
    tile: std("#ffffff", 0.35),
    steel: std("#9aa7b3", 0.35, 0.85),
    steelDark: std("#3b4652", 0.5, 0.6),
    wood: std("#b98a5e", 0.6),
    white: std("#f3f5f7", 0.5),
    orange: std("#f5871f", 0.55),
    green: std("#3f8f5a", 0.8),
    greenDark: std("#2f6e45", 0.8),
    blueBox: std("#2f73ad", 0.6),
    paintBlue: std("#3b8fd6", 0.4),
    glass: new THREE.MeshStandardMaterial({
      color: "#a9d6f5",
      roughness: 0.05,
      metalness: 0.2,
      transparent: true,
      opacity: 0.22,
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

// Стержень от точки a до точки b — для лестницы и вывески
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

function Struts({ matrices, material, cast = true }: { matrices: THREE.Matrix4[]; material: THREE.Material; cast?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return <instancedMesh ref={ref} args={[box, material, matrices.length]} castShadow={cast} />;
}

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? clamp01(window.scrollY / max) : 0;
}

/* ─── Помещение ──────────────────────────────────────────────── */

const TILE_N = 8;
const TILE = 4 / TILE_N;
// Временные объекты для покадровых расчётов — без мусора в памяти на каждом кадре
const TM = new THREE.Matrix4();
const TQ = new THREE.Quaternion();
const TP = new THREE.Vector3();
const TS = new THREE.Vector3();
const VA = new THREE.Vector3();
const VB = new THREE.Vector3();

function Room({ reduced }: { reduced: boolean }) {
  const mats = useMemo(() => createMaterials(), []);
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

  const invalidate = useThree((s) => s.invalidate);
  const state = useRef({ target: START, current: reduced ? START : 0, hero: true, px: 0, py: 0, tx: 0, ty: 0 });
  const parts = useRef<Record<string, THREE.Object3D | null>>({});
  const tiles = useRef<THREE.InstancedMesh>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);

  useLayoutEffect(() => {
    const mesh = tiles.current;
    if (!mesh) return;
    tileColors.forEach((c, i) => mesh.setColorAt(i, c));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [tileColors]);

  useEffect(() => {
    const s = state.current;
    const onScroll = () => {
      s.target = START + (1 - START) * scrollProgress();
      s.hero = window.scrollY < window.innerHeight * 0.9;
      invalidate();
    };
    const onPointer = (e: PointerEvent) => {
      if (reduced || !s.hero || e.pointerType === "touch") return;
      s.px = (e.clientX / window.innerWidth) * 2 - 1;
      s.py = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    // Лёгкое покачивание на первом экране — ~30 кадров в секунду, дальше не рисуем
    const tick = window.setInterval(() => {
      if (s.hero && !reduced && !document.hidden) invalidate();
    }, 33);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [invalidate, reduced]);

  useFrame((frame, delta) => {
    const s = state.current;
    // Шаг ограничен 0.1 с: на медленном устройстве сглаживание сходится за то же время, а не за то же число кадров
    const dt = Math.min(delta, 0.1);
    // Прокрутку сглаживаем всегда: это ответ на действие человека, без сглаживания — рывки.
    // При «уменьшить движение» отключаются только покачивание, наклон за курсором и вступление.
    s.current = THREE.MathUtils.damp(s.current, s.target, 3.5, dt);
    if (Math.abs(s.current - s.target) < 0.001) s.current = s.target;
    s.tx = THREE.MathUtils.damp(s.tx, s.px, 3, dt);
    s.ty = THREE.MathUtils.damp(s.ty, s.py, 3, dt);
    if (s.current !== s.target || Math.abs(s.tx - s.px) + Math.abs(s.ty - s.py) > 0.002) invalidate();
    const k = s.current;
    const p = parts.current;

    // Поворот: от прокрутки + покачивание + наклон за курсором
    const sway = reduced ? 0 : Math.sin(frame.clock.elapsedTime * 0.35) * 0.08;
    p.root?.rotation.set(s.ty * 0.04, ROT0 + k * ROT + sway + s.tx * 0.1, 0);

    const show = (name: string, t: number) => {
      const o = p[name];
      if (!o) return;
      o.visible = t > 0.001;
      o.scale.setScalar(Math.max(t, 0.001));
    };

    // 1. Покраска задней стены — валик идёт слева направо и ходит вверх-вниз
    const paintT = easeOut(seg(k, 0.02, 0.3));
    const w = 4 * paintT;
    if (p.paint) {
      p.paint.visible = w > 0.01;
      p.paint.scale.set(Math.max(w, 0.001), H - 0.02, 0.01);
      p.paint.position.x = -2 + w / 2;
    }
    const rollerY = 0.45 + (Math.sin(k * 110) * 0.5 + 0.5) * 1.8;
    if (p.roller) {
      p.roller.position.set(-2 + Math.max(w, 0.25), rollerY, -1.86);
      p.roller.rotation.x = k * 90;
    }
    if (p.rollerRig) p.rollerRig.visible = k < 0.33;
    if (p.pole) {
      // Черенок валика: от пола до валика, длина меняется вместе с высотой
      VA.set(-2 + Math.max(w, 0.25), 0, -1.05);
      VB.set(-2 + Math.max(w, 0.25), rollerY - 0.12, -1.8);
      p.pole.position.copy(VA).add(VB).multiplyScalar(0.5);
      VB.sub(VA);
      const len = VB.length();
      p.pole.quaternion.setFromUnitVectors(UP, VB.normalize());
      p.pole.scale.set(0.035, len, 0.035);
    }
    show("bucket", 1 - easeOut(seg(k, 0.34, 0.42)));

    // 2. Плитка — от угла к краю, стопка на полу тает
    const tileP = seg(k, 0.22, 0.6);
    const tm = tiles.current;
    if (tm) {
      for (let i = 0; i < TILE_N; i++)
        for (let j = 0; j < TILE_N; j++) {
          const thr = ((i + j) / (2 * TILE_N - 2)) * 0.75;
          const t = easeBack(seg(tileP, thr, thr + 0.25));
          const sc = t > 0.001 ? t : 0.0001;
          TP.set(-2 + TILE * (i + 0.5), 0.035 + (1 - Math.min(t, 1)) * 0.25, -2 + TILE * (j + 0.5));
          TS.set((TILE - 0.02) * sc, 0.03 * sc, (TILE - 0.02) * sc);
          tm.setMatrixAt(i * TILE_N + j, TM.compose(TP, TQ, TS));
        }
      tm.instanceMatrix.needsUpdate = true;
    }
    if (p.stack) {
      const left = 1 - tileP;
      p.stack.visible = left > 0.02;
      p.stack.scale.set(1, Math.max(left, 0.001), 1);
    }

    // 3. Электрика: провода → светильники → свет
    if (p.wires) p.wires.visible = k < 0.5;
    show("coil", 1 - easeOut(seg(k, 0.58, 0.64)));
    show("lampA", easeBack(seg(k, 0.46, 0.56)));
    show("lampB", easeBack(seg(k, 0.5, 0.6)));
    const on = easeOut(seg(k, 0.62, 0.7));
    const lampMesh = p.lampDiffuser as THREE.Mesh | undefined;
    if (lampMesh) (lampMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.05 + on * 2.4;
    const coneMesh = p.coneA as THREE.Mesh | undefined;
    if (coneMesh) (coneMesh.material as THREE.MeshBasicMaterial).opacity = on * 0.16;
    if (hemi.current) hemi.current.intensity = 0.75 + on * 0.45;

    // 4. Витрина: стёкла встают снизу вверх
    ["glass0", "glass1", "glass2"].forEach((n, i) => {
      const t = easeOut(seg(k, 0.5 + i * 0.05, 0.62 + i * 0.05));
      const o = p[n];
      if (!o) return;
      o.visible = t > 0.001;
      o.scale.set(1, Math.max(t, 0.001), 1);
    });

    // 5. Мебель и вывеска, строительный инвентарь убирают
    show("accent", easeOut(seg(k, 0.64, 0.74)));
    show("counter", easeBack(seg(k, 0.7, 0.8)));
    show("shelving", easeBack(seg(k, 0.74, 0.84)));
    show("goods", easeBack(seg(k, 0.8, 0.9)));
    show("plant", easeBack(seg(k, 0.84, 0.92)));
    show("ladder", 1 - easeOut(seg(k, 0.78, 0.88)));
    show("toolbox", 1 - easeOut(seg(k, 0.86, 0.94)));
    show("sign", easeBack(seg(k, 0.84, 0.93)));
    const signLines = p.signLines?.children[0] as THREE.InstancedMesh | undefined;
    if (signLines) (signLines.material as THREE.MeshStandardMaterial).emissiveIntensity = easeOut(seg(k, 0.9, 1)) * 2.2;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#cfe6ff", "#1a2430", 0.75]} />
      <group ref={(o) => {
            parts.current.root = o;
          }}>
        {/* Плита перекрытия и стяжка */}
        <mesh geometry={box} material={mats.slab} position={[0, -0.16, 0]} scale={[4.36, 0.3, 4.36]} receiveShadow />
        <mesh geometry={box} material={mats.screed} position={[0.08, 0.005, 0.08]} scale={[4.16, 0.01, 4.16]} receiveShadow />
        <instancedMesh ref={tiles} args={[box, mats.tile, TILE_N * TILE_N]} receiveShadow />

        {/* Задняя стена: штукатурка + слой краски, который растёт слева направо */}
        <mesh geometry={box} material={mats.plaster} position={[0, H / 2, -2.08]} scale={[4.32, H, 0.16]} receiveShadow castShadow />
        <mesh ref={(o) => {
            parts.current.paint = o;
          }} geometry={box} material={mats.paint} position={[0, H / 2, -1.995]} scale={[0.001, H, 0.01]} receiveShadow />

        {/* Витрина слева: каркас, стёкла ставятся по ходу ремонта */}
        <group position={[-2.06, 0, 0.08]}>
          <mesh geometry={box} material={mats.steelDark} position={[0, 0.07, 0]} scale={[0.14, 0.14, 4.16]} castShadow />
          <mesh geometry={box} material={mats.steelDark} position={[0, H - 0.1, 0]} scale={[0.14, 0.2, 4.16]} castShadow />
          {[-2.02, -0.69, 0.64, 1.97].map((z) => (
            <mesh key={z} geometry={box} material={mats.steelDark} position={[0, H / 2, z]} scale={[0.1, H, 0.1]} castShadow />
          ))}
          {[-1.355, -0.025, 1.305].map((z, i) => (
            <group key={z} ref={(o) => {
                parts.current[`glass${i}`] = o;
              }} position={[0, 0.14, z]}>
              <mesh geometry={box} material={mats.glass} position={[0, (H - 0.34) / 2, 0]} scale={[0.03, H - 0.34, 1.23]} />
            </group>
          ))}
        </group>

        {/* Электрощит с трассой и мотком кабеля */}
        <group position={[1.55, 0, -1.94]}>
          <mesh geometry={box} material={mats.white} position={[0, 1.35, 0]} scale={[0.46, 0.64, 0.1]} castShadow />
          <mesh geometry={box} material={mats.orange} position={[0, 1.58, 0.055]} scale={[0.46, 0.06, 0.01]} />
          <mesh geometry={box} material={mats.steelDark} position={[0, 2.1, 0]} scale={[0.05, 0.86, 0.05]} />
        </group>
        <mesh ref={(o) => {
            parts.current.coil = o;
          }} position={[1.5, 0.05, -1.35]} rotation={[Math.PI / 2, 0, 0]} material={mats.orange} castShadow>
          <torusGeometry args={[0.2, 0.045, 10, 28]} />
        </mesh>

        {/* Провода под светильники — висят, пока светильники не повесили */}
        <group ref={(o) => {
            parts.current.wires = o;
          }}>
          {[-0.2, 1.0, 0.0, 0.8].map((x, i) => (
            <mesh key={i} geometry={box} material={mats.steelDark} position={[x, H - 0.05, i < 2 ? -0.85 : 0.55]} scale={[0.015, 0.5, 0.015]} />
          ))}
        </group>

        {/* Светильники: подвесные линейные, с конусом света */}
        {[
          { name: "lampA", pos: [0.4, 2.2, -0.85] as const },
          { name: "lampB", pos: [0.4, 2.2, 0.55] as const },
        ].map((l, i) => (
          <group key={l.name} ref={(o) => {
              parts.current[l.name] = o;
            }} position={l.pos}>
            <mesh geometry={box} material={mats.steelDark} scale={[1.4, 0.06, 0.11]} castShadow />
            <mesh ref={
                i === 0
                  ? (o) => {
                      parts.current.lampDiffuser = o;
                    }
                  : undefined
              } geometry={box} material={mats.lamp} position={[0, -0.035, 0]} scale={[1.34, 0.012, 0.08]} />
            {[-0.55, 0.55].map((x) => (
              <mesh key={x} geometry={box} material={mats.steelDark} position={[x, 0.4, 0]} scale={[0.01, 0.8, 0.01]} />
            ))}
            <mesh ref={
                i === 0
                  ? (o) => {
                      parts.current.coneA = o;
                    }
                  : undefined
              } material={mats.cone} position={[0, -1.1, 0]} scale={[1.7, 1, 0.9]}>
              <coneGeometry args={[0.75, 2.1, 24, 1, true]} />
            </mesh>
          </group>
        ))}

        {/* Стойка ресепшена и фирменная стена с вывеской */}
        <group ref={(o) => {
            parts.current.accent = o;
          }} position={[0.4, 1.55, -1.985]}>
          <mesh geometry={box} material={mats.accent} scale={[2.1, 1.25, 0.02]} receiveShadow />
        </group>
        <group ref={(o) => {
            parts.current.sign = o;
          }} position={[0.4, 1.28, -1.96]}>
          <group ref={(o) => {
            parts.current.signLines = o;
          }}>
            <Struts matrices={logo} material={mats.sign} cast={false} />
          </group>
          <mesh geometry={logoFacets} material={mats.paintBlue} position={[0, 0, -0.005]} />
        </group>
        <group ref={(o) => {
            parts.current.counter = o;
          }} position={[0.4, 0, -0.85]}>
          <mesh geometry={box} material={mats.wood} position={[0, 0.45, 0]} scale={[1.8, 0.9, 0.55]} castShadow receiveShadow />
          <mesh geometry={box} material={mats.white} position={[0, 0.925, 0]} scale={[1.9, 0.05, 0.64]} castShadow />
          <mesh geometry={box} material={mats.accent} position={[0, 0.62, 0.28]} scale={[1.8, 0.1, 0.01]} />
        </group>

        {/* Стеллаж с товаром — поставка материалов */}
        <group ref={(o) => {
            parts.current.shelving = o;
          }} position={[-1.3, 0, -1.72]}>
          {[-0.52, 0.52].map((x) => (
            <mesh key={x} geometry={box} material={mats.steelDark} position={[x, 1, 0]} scale={[0.04, 2, 0.04]} castShadow />
          ))}
          {[0.3, 0.8, 1.3, 1.8].map((y) => (
            <mesh key={y} geometry={box} material={mats.white} position={[0, y, 0]} scale={[1.08, 0.03, 0.32]} castShadow receiveShadow />
          ))}
        </group>
        <group ref={(o) => {
            parts.current.goods = o;
          }} position={[-1.3, 0, -1.72]}>
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
            <mesh key={i} geometry={box} material={mats[mat]} position={[x, y, 0]} scale={[0.26, 0.2 + (i % 3) * 0.04, 0.22]} castShadow />
          ))}
        </group>

        <group ref={(o) => {
            parts.current.plant = o;
          }} position={[-1.45, 0, 1.45]}>
          <mesh material={mats.steelDark} position={[0, 0.17, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.13, 0.34, 20]} />
          </mesh>
          <mesh material={mats.green} position={[0, 0.66, 0]} castShadow>
            <icosahedronGeometry args={[0.33, 1]} />
          </mesh>
          <mesh material={mats.greenDark} position={[0.14, 0.92, 0.05]} castShadow>
            <icosahedronGeometry args={[0.2, 1]} />
          </mesh>
        </group>

        {/* Инвентарь ремонта: валик, ведро, стремянка, ящик, стопка плитки */}
        <group ref={(o) => {
            parts.current.rollerRig = o;
          }}>
          <group ref={(o) => {
            parts.current.roller = o;
          }}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={mats.paintBlue} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.46, 20]} />
            </mesh>
          </group>
          <mesh ref={(o) => {
            parts.current.pole = o;
          }} geometry={box} material={mats.orange} castShadow />
        </group>
        <group ref={(o) => {
            parts.current.bucket = o;
          }} position={[-0.55, 0, -1.35]}>
          <mesh material={mats.white} position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.14, 0.3, 20]} />
          </mesh>
          <mesh material={mats.paintBlue} position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.01, 20]} />
          </mesh>
        </group>
        <group ref={(o) => {
            parts.current.ladder = o;
          }} position={[1.25, 0, -0.2]} rotation={[0, -0.5, 0]}>
          <Struts matrices={ladder} material={mats.steel} />
        </group>
        <group ref={(o) => {
            parts.current.toolbox = o;
          }} position={[1.35, 0, 1.2]} rotation={[0, 0.4, 0]}>
          <mesh geometry={box} material={mats.orange} position={[0, 0.12, 0]} scale={[0.5, 0.24, 0.24]} castShadow />
          <mesh geometry={box} material={mats.steelDark} position={[0, 0.3, 0]} scale={[0.3, 0.04, 0.04]} />
        </group>
        <group ref={(o) => {
            parts.current.stack = o;
          }} position={[0.6, 0, 1.35]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} geometry={box} material={mats.tile} position={[0, 0.02 + i * 0.035, 0]} scale={[0.48, 0.03, 0.48]} castShadow />
          ))}
        </group>
      </group>
    </>
  );
}

/* ─── Своя .glb вместо макета ─────────────────────────────────── */

function GltfModel({ src }: { src: string }) {
  const gltf = useLoader(GLTFLoader, src);
  const invalidate = useThree((s) => s.invalidate);
  const ref = useRef<THREE.Group>(null);
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
  useEffect(() => {
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [invalidate]);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = ROT0 + (START + (1 - START) * scrollProgress()) * ROT * 2;
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
    scene.environmentIntensity = 0.45;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [get]);
  return null;
}

// Изометрия сверху-сбоку; макет (≈4.4 ед. в поперечнике) целиком в кадре на любом экране
function FitCamera() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const { camera, invalidate } = get();
    const t = Math.tan(THREE.MathUtils.degToRad(30 / 2));
    const aspect = size.width / size.height;
    const d = Math.max(2.9 / t, 3.3 / (t * aspect));
    const dir = new THREE.Vector3(1, 0.72, 1).normalize();
    camera.position.copy(dir.multiplyScalar(d)).add(new THREE.Vector3(0, 1.1, 0));
    camera.lookAt(0, 1.1, 0);
    invalidate();
  }, [get, size]);
  return null;
}

export default function RenovationScene() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const room = <Room reduced={reduced} />;

  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 30, position: [9, 7, 9] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Environment />
      <FitCamera />
      <directionalLight
        position={[3.5, 7, 4]}
        intensity={1.8}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-5, 3, 5]} intensity={0.5} color="#8cc6ff" />
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
