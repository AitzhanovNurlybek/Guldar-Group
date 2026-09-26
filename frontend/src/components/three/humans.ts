import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/*
 * Люди на макете: стилизованные, но с человеческими пропорциями (рост ≈ 1.78 ед. = метров).
 * Скелет — иерархия групп: таз → поясница → грудь → шея → голова, ключицы → плечо → предплечье → кисть,
 * бедро → голень → стопа. Одежда и обувь — отдельная геометрия поверх «тела».
 * Геометрия и материалы общие для всех людей и создаются один раз; в покадровой анимации — ни одного new.
 */

// Размеры скелета, м
export const DIM = {
  pelvisY: 0.97, // высота таза в стойке
  hipX: 0.095,
  hipY: -0.05,
  thigh: 0.44,
  shin: 0.42,
  ankle: 0.06, // от голеностопа до подошвы
  upper: 0.28,
  fore: 0.25,
  shoulderX: 0.13,
};
const LEG = DIM.thigh + DIM.shin;

/* ─── Геометрия ──────────────────────────────────────────────── */

// Сужающийся «сегмент тела» со скруглёнными торцами и лёгкой мышцей в верхней трети.
// Висит от точки подвеса вниз (по −y) — так поворот сустава выглядит естественно.
function limb(r1: number, rMid: number, r2: number, len: number, seg = 14) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r1 * Math.sin(a), r1 * Math.cos(a)));
  }
  pts.push(new THREE.Vector2(rMid, -len * 0.32));
  pts.push(new THREE.Vector2((rMid + r2) / 2, -len * 0.7));
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r2 * Math.cos(a), -len - r2 * Math.sin(a)));
  }
  // Профиль снизу вверх — иначе грани смотрят внутрь и отсекаются
  return new THREE.LatheGeometry(pts.reverse(), seg);
}

// Тело вращения по профилю [радиус, высота] с эллиптическим сечением (плечи шире, чем грудь в глубину)
function lathe(profile: [number, number][], depth: number, seg = 20) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  if (pts[0].y > pts[pts.length - 1].y) pts.reverse();
  const g = new THREE.LatheGeometry(pts, seg);
  g.scale(1, 1, depth);
  return g;
}

export function createHumanKit() {
  const geo = {
    // Голова — «яйцо» с сужением к подбородку, а не шар
    head: lathe(
      [
        [0.0001, 0.125],
        [0.045, 0.12],
        [0.068, 0.1],
        [0.079, 0.06],
        [0.08, 0.02],
        [0.076, -0.025],
        [0.068, -0.06],
        [0.052, -0.09],
        [0.03, -0.11],
        [0.0001, -0.117],
      ],
      1.24,
      22,
    ),
    hair: new THREE.SphereGeometry(0.086, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
    nose: new THREE.ConeGeometry(0.014, 0.04, 8),
    eye: new THREE.SphereGeometry(0.0085, 8, 6),
    brow: new RoundedBoxGeometry(0.028, 0.006, 0.01, 1, 0.003),
    ear: new THREE.SphereGeometry(0.024, 10, 8),
    neck: limb(0.047, 0.046, 0.05, 0.1, 12),
    // Торс: таз, поясница, грудная клетка — три части, чтобы корпус мог скручиваться
    pelvis: lathe(
      [
        [0.0001, 0.09],
        [0.15, 0.09],
        [0.16, 0.02],
        [0.165, -0.05],
        [0.14, -0.11],
        [0.0001, -0.13],
      ],
      0.68,
    ),
    abdomen: lathe(
      [
        [0.158, -0.04],
        [0.154, 0.06],
        [0.158, 0.16],
        [0.165, 0.23],
      ],
      0.66,
    ),
    chest: lathe(
      [
        [0.162, -0.03],
        [0.172, 0.06],
        [0.182, 0.14],
        [0.176, 0.2],
        [0.15, 0.245],
        [0.07, 0.275],
        [0.0001, 0.28],
      ],
      0.6,
    ),
    // Складки ткани: кромка футболки, воротник, гармошка брюк над обувью
    hem: new THREE.TorusGeometry(0.16, 0.009, 6, 28),
    collar: new THREE.TorusGeometry(0.062, 0.012, 6, 20),
    deltoid: new THREE.SphereGeometry(0.068, 14, 10),
    // Руки
    sleeveShort: limb(0.062, 0.058, 0.053, 0.13),
    sleeveLong: limb(0.06, 0.056, 0.047, DIM.upper),
    upperArm: limb(0.046, 0.045, 0.037, DIM.upper),
    foreArm: limb(0.039, 0.038, 0.029, DIM.fore),
    foreSleeve: limb(0.046, 0.045, 0.038, DIM.fore * 0.78),
    cuff: new THREE.TorusGeometry(0.041, 0.008, 6, 16),
    palm: limb(0.03, 0.034, 0.026, 0.11, 10),
    thumb: limb(0.012, 0.012, 0.01, 0.05, 8),
    // Ноги — это брюки: кожа не видна, отдельное «тело» не нужно
    thigh: limb(0.082, 0.078, 0.06, DIM.thigh),
    shin: limb(0.061, 0.058, 0.055, DIM.shin),
    fold: new THREE.TorusGeometry(0.057, 0.007, 6, 18),
    // Кроссовки: верх, подошва, носок
    shoe: new RoundedBoxGeometry(0.1, 0.075, 0.24, 3, 0.03),
    sole: new RoundedBoxGeometry(0.108, 0.026, 0.27, 2, 0.01),
    // Каска и светоотражающие полосы жилета
    helmet: new THREE.SphereGeometry(0.096, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    brim: new THREE.CylinderGeometry(0.108, 0.112, 0.012, 28),
    ridge: new RoundedBoxGeometry(0.022, 0.03, 0.2, 2, 0.008),
    vest: lathe(
      [
        [0.17, -0.12],
        [0.172, 0.0],
        [0.18, 0.12],
        [0.186, 0.2],
        [0.16, 0.25],
        [0.1, 0.27],
      ],
      0.63,
    ),
    stripe: new THREE.TorusGeometry(0.182, 0.011, 4, 32),
  };
  // Кроссовка: носок вперёд, пятка под голеностопом
  geo.shoe.translate(0, -0.02, 0.055);
  geo.sole.translate(0, -DIM.ankle + 0.013, 0.06);
  geo.nose.rotateX(Math.PI / 2);

  const fabric = (color: string, roughness = 0.92) =>
    new THREE.MeshPhysicalMaterial({ color, roughness, sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.35) });
  const mat = {
    skinA: new THREE.MeshStandardMaterial({ color: "#c38a68", roughness: 0.58 }),
    skinB: new THREE.MeshStandardMaterial({ color: "#a8704f", roughness: 0.6 }),
    hair: new THREE.MeshStandardMaterial({ color: "#1f1712", roughness: 0.75 }),
    eye: new THREE.MeshStandardMaterial({ color: "#14100d", roughness: 0.25 }),
    jacket: fabric("#34465a"),
    shirt: fabric("#e4e7ea"),
    tee: fabric("#8b97a3"),
    chino: fabric("#2a2f36"),
    work: fabric("#233348"),
    vest: fabric("#f5871f", 0.78),
    reflect: new THREE.MeshStandardMaterial({ color: "#d9e0e6", roughness: 0.25, metalness: 0.7 }),
    shoeWhite: new THREE.MeshStandardMaterial({ color: "#e9ebee", roughness: 0.6 }),
    shoeDark: new THREE.MeshStandardMaterial({ color: "#3a312a", roughness: 0.7 }),
    sole: new THREE.MeshStandardMaterial({ color: "#f4f4f2", roughness: 0.8 }),
    helmet: new THREE.MeshStandardMaterial({ color: "#f5a01f", roughness: 0.32, metalness: 0.05 }),
  };

  const dispose = () => {
    Object.values(geo).forEach((g) => g.dispose());
    Object.values(mat).forEach((m) => m.dispose());
  };
  return { geo, mat, dispose };
}
export type HumanKit = ReturnType<typeof createHumanKit>;

/* ─── Скелет ─────────────────────────────────────────────────── */

export type Rig = ReturnType<typeof buildHuman>;

type Look = {
  skin: THREE.Material;
  top: THREE.Material;
  pants: THREE.Material;
  shoe: THREE.Material;
  longSleeves: boolean;
  worker?: boolean; // каска и жилет
};

export function buildHuman(kit: HumanKit, look: Look) {
  const { geo, mat } = kit;
  const group = (parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const o = new THREE.Group();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const mesh = (parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };

  const root = new THREE.Group();
  const pelvis = group(root, 0, DIM.pelvisY, 0);
  mesh(pelvis, geo.pelvis, look.pants);

  // Корпус
  const spine = group(pelvis, 0, 0.07, 0);
  const abdomen = mesh(spine, geo.abdomen, look.top);
  const hem = mesh(spine, geo.hem, look.top, 0, -0.035, 0);
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1, 0.68, 1);
  const chest = group(spine, 0, 0.19, 0);
  const chestMesh = mesh(chest, geo.chest, look.top);
  const collar = mesh(chest, geo.collar, look.top, 0, 0.265, 0.004);
  collar.rotation.x = Math.PI / 2 + 0.2;
  let vest: THREE.Mesh | null = null;
  if (look.worker) {
    vest = mesh(chest, geo.vest, mat.vest, 0, 0, 0);
    [0.02, 0.13].forEach((y) => {
      const s = mesh(chest, geo.stripe, mat.reflect, 0, y, 0);
      s.rotation.x = Math.PI / 2;
      s.scale.set(1, 0.65, 1);
    });
  }

  // Шея и голова
  const neck = group(chest, 0, 0.255, 0.005);
  mesh(neck, geo.neck, look.skin).rotation.x = Math.PI; // сегмент растёт вверх от основания шеи
  const head = group(neck, 0, 0.1, 0);
  const skull = mesh(head, geo.head, look.skin, 0, 0.115, 0.008);
  skull.castShadow = true;
  mesh(head, geo.nose, look.skin, 0, 0.1, 0.098);
  [-1, 1].forEach((s) => {
    const e = mesh(head, geo.ear, look.skin, s * 0.078, 0.11, -0.005);
    e.scale.set(0.35, 0.8, 0.55);
  });
  // Волосы: линия роста надо лбом, сзади — ниже, до затылка
  const hair = mesh(head, geo.hair, mat.hair, 0, 0.148, 0.004);
  hair.scale.set(1.09, 1.13, 1.32);
  hair.rotation.x = -0.25;
  // Глаза и брови — едва заметно, чтобы голова читалась как лицо, а не как манекен
  [-1, 1].forEach((s) => {
    mesh(head, geo.eye, mat.eye, s * 0.03, 0.128, 0.084).castShadow = false;
    const brow = mesh(head, geo.brow, mat.hair, s * 0.031, 0.152, 0.087);
    brow.castShadow = false;
    brow.rotation.set(-0.25, 0, s * -0.08);
  });
  if (look.worker) {
    const helmet = group(head, 0, 0.165, 0.004);
    helmet.rotation.x = -0.08;
    const dome = mesh(helmet, geo.helmet, mat.helmet);
    dome.scale.set(1, 0.92, 1.18);
    const brim = mesh(helmet, geo.brim, mat.helmet, 0, 0.004, 0.012);
    brim.scale.set(1, 1, 1.22);
    mesh(helmet, geo.ridge, mat.helmet, 0, 0.082, 0);
  }

  // Руки: ключица → плечо → предплечье → кисть
  const arm = (side: 1 | -1) => {
    const clav = group(chest, side * 0.05, 0.215, -0.005);
    const del = mesh(clav, geo.deltoid, look.top, side * 0.115, -0.012, 0);
    del.scale.set(0.95, 0.85, 0.9);
    const upper = group(clav, side * DIM.shoulderX, 0, 0);
    mesh(upper, geo.upperArm, look.skin);
    mesh(upper, look.longSleeves ? geo.sleeveLong : geo.sleeveShort, look.top);
    const fore = group(upper, 0, -DIM.upper, 0);
    mesh(fore, geo.foreArm, look.skin);
    if (look.longSleeves) {
      mesh(fore, geo.foreSleeve, look.top);
      const c = mesh(fore, geo.cuff, look.top, 0, -DIM.fore * 0.74, 0);
      c.rotation.x = Math.PI / 2;
    }
    const hand = group(fore, 0, -DIM.fore - 0.005, 0);
    const palm = mesh(hand, geo.palm, look.skin);
    palm.scale.set(1.15, 1, 0.62);
    const thumb = mesh(hand, geo.thumb, look.skin, -side * 0.024, -0.02, 0.018);
    thumb.rotation.set(0.5, 0, -side * 0.45);
    return { clav, upper, fore, hand };
  };
  const L = arm(1);
  const R = arm(-1);

  // Ноги: бедро → голень → стопа
  const leg = (side: 1 | -1) => {
    const thigh = group(pelvis, side * DIM.hipX, DIM.hipY, 0);
    mesh(thigh, geo.thigh, look.pants);
    const shin = group(thigh, 0, -DIM.thigh, 0);
    mesh(shin, geo.shin, look.pants);
    [0.33, 0.37].forEach((k, i) => {
      const f = mesh(shin, geo.fold, look.pants, 0, -DIM.shin + k * 0.1, 0.002);
      f.rotation.x = Math.PI / 2 + (i ? 0.18 : -0.12);
    });
    const foot = group(shin, 0, -DIM.shin, 0);
    mesh(foot, geo.shoe, look.shoe);
    mesh(foot, geo.sole, mat.sole);
    return { thigh, shin, foot };
  };
  const LL = leg(1);
  const RL = leg(-1);

  return {
    root,
    pelvis,
    spine,
    chest,
    chestMesh,
    abdomen,
    hem,
    vest,
    neck,
    head,
    armL: L,
    armR: R,
    legL: LL,
    legR: RL,
  };
}

/* ─── Помощники ──────────────────────────────────────────────── */

const clamp = THREE.MathUtils.clamp;
const _t = new THREE.Vector3();
const _p = new THREE.Vector3();
const _d = new THREE.Vector3();
const _n = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();

// Плавный «шум» из несоизмеримых синусов — мелкая неровность движения, чтобы не было робота
export const wobble = (t: number, seed: number) =>
  Math.sin(t * 0.73 + seed) * 0.5 + Math.sin(t * 1.37 + seed * 2.1) * 0.3 + Math.sin(t * 2.91 + seed * 0.7) * 0.2;

/*
 * Двухзвенная инверсная кинематика: плечо+предплечье (или бедро+голень) тянутся к цели,
 * локоть/колено смотрит в сторону pole. Всё в локальных координатах родителя верхнего звена.
 */
export function solveTwoBone(
  upper: THREE.Object3D,
  lower: THREE.Object3D,
  a: number,
  b: number,
  targetWorld: THREE.Vector3,
  poleWorld: THREE.Vector3,
) {
  const parent = upper.parent!;
  parent.updateWorldMatrix(true, false);
  _t.copy(targetWorld);
  parent.worldToLocal(_t);
  _p.copy(poleWorld);
  parent.worldToLocal(_p);

  _d.subVectors(_t, upper.position);
  const dist = clamp(_d.length(), Math.abs(a - b) + 1e-3, (a + b) * 0.9995);
  _d.normalize();
  // Направление на pole, перпендикулярное линии «сустав → цель»
  _n.subVectors(_p, upper.position);
  _n.addScaledVector(_d, -_n.dot(_d));
  if (_n.lengthSq() < 1e-8) _n.set(0, 0, 1);
  _n.normalize();

  const cosA = clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1);
  const sinA = Math.sqrt(1 - cosA * cosA);
  // Направление верхнего звена (к локтю)
  _y.copy(_d).multiplyScalar(cosA).addScaledVector(_n, sinA);
  // Базис кости: звено вдоль −y, локальная +z — в сторону pole
  _y.negate();
  _x.crossVectors(_y, _n).normalize();
  _n.crossVectors(_x, _y).normalize();
  _m.makeBasis(_x, _y, _n);
  upper.quaternion.setFromRotationMatrix(_m);

  const cosG = clamp((a * a + b * b - dist * dist) / (2 * a * b), -1, 1);
  lower.rotation.set(Math.PI - Math.acos(cosG), 0, 0);
}

// Стопа параллельна полу (ориентация как у корня персонажа)
function footFlat(foot: THREE.Object3D, root: THREE.Object3D, pitch = 0) {
  foot.parent!.getWorldQuaternion(_q);
  root.getWorldQuaternion(_q2);
  foot.quaternion.copy(_q.invert()).multiply(_q2);
  if (pitch) {
    _q2.setFromAxisAngle(_x.set(1, 0, 0), pitch);
    foot.quaternion.multiply(_q2);
  }
}

// Дыхание: грудь чуть расширяется, плечи приподнимаются
function breathe(r: Rig, t: number, rate: number, depth: number) {
  const b = Math.sin(t * rate);
  r.chestMesh.scale.set(1 + 0.008 * b * depth, 1 + 0.01 * b * depth, 1 + 0.018 * b * depth);
  if (r.vest) r.vest.scale.copy(r.chestMesh.scale);
  r.armL.clav.position.y = 0.215 + 0.004 * b * depth;
  r.armR.clav.position.y = 0.215 + 0.004 * b * depth;
}

/* ─── Походка ────────────────────────────────────────────────── */

const HIP_A = 0.36; // амплитуда бедра, рад
// Длина полного цикла (два шага) при данной амплитуде — чтобы стопы не «скользили»
export const strideLength = (amp: number) => 4 * LEG * Math.sin(HIP_A * Math.max(amp, 0.05)) * 0.92;

type LegPose = { hip: number; knee: number; foot: number };
const legL: LegPose = { hip: 0, knee: 0, foot: 0 };
const legR: LegPose = { hip: 0, knee: 0, foot: 0 };

// Фаза φ одной ноги: sin φ > 0 — нога впереди; cos φ > 0 — перенос (нога идёт вперёд), иначе опора
function legPose(out: LegPose, phi: number, amp: number) {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  out.hip = -HIP_A * amp * s - 0.04 * amp; // «−» — вперёд
  // Колено: пик сгибания в начале переноса + лёгкая амортизация после постановки пятки
  out.knee =
    0.05 +
    amp * (1.0 * Math.pow(Math.max(0, Math.cos(phi + 0.35)), 1.6) + 0.14 * Math.max(0, Math.sin(2 * (phi - Math.PI / 2))) * (c < 0 ? 1 : 0));
  // Стопа: носок вверх перед постановкой пятки, перекат и толчок носком в конце опоры
  out.foot = amp * (0.55 * Math.pow(Math.max(0, -s), 3) - 0.24 * Math.pow(Math.max(0, Math.sin(phi - 0.3)), 2));
}

// Насколько опора ниже бедра: по положению голеностопа и самой низкой точке подошвы
function legReach(p: LegPose) {
  const a = p.hip;
  const b = p.hip + p.knee;
  const y = DIM.thigh * Math.cos(a) + DIM.shin * Math.cos(b);
  const pitch = p.foot;
  const heel = DIM.ankle * Math.cos(pitch) + -0.06 * Math.sin(pitch);
  const toe = DIM.ankle * Math.cos(pitch) + 0.18 * Math.sin(pitch);
  return y + Math.max(heel, toe);
}

/**
 * Цикл ходьбы: ноги в противофазе, руки в противофазе ногам, корпус компенсирует,
 * голова держит горизонт, таз поднимается и опускается по опорной ноге.
 * phase — фаза левой ноги (рад), amp — 0..1 (0 — стоит), t — время для дыхания и неровностей.
 */
export function poseWalk(r: Rig, phase: number, amp: number, t: number, seed: number) {
  const v = 1 + 0.05 * wobble(t * 0.6, seed); // шаг чуть «гуляет»
  const A = amp * v;
  legPose(legL, phase, A);
  legPose(legR, phase + Math.PI, A);

  const s = Math.sin(phase);
  const c = Math.cos(phase);

  r.legL.thigh.rotation.set(legL.hip, 0, 0.015);
  r.legL.shin.rotation.set(legL.knee, 0, 0);
  r.legL.foot.rotation.set(legL.foot - legL.hip - legL.knee, 0, 0);
  r.legR.thigh.rotation.set(legR.hip, 0, -0.015);
  r.legR.shin.rotation.set(legR.knee, 0, 0);
  r.legR.foot.rotation.set(legR.foot - legR.hip - legR.knee, 0, 0);

  // Таз: высота — по опорной ноге (стопа всегда на полу), скручивание к шагающей ноге, перенос веса
  const reach = Math.max(legReach(legL), legReach(legR));
  r.pelvis.position.set(-0.022 * A * c, -DIM.hipY + reach, 0);
  r.pelvis.rotation.set(0, -0.1 * A * s, -0.035 * A * c);

  // Корпус: наклон вперёд, противовращение грудной клетки
  r.spine.rotation.set(0.05 + 0.02 * A * Math.cos(2 * phase), 0.05 * A * s, 0.02 * A * c);
  r.chest.rotation.set(0.02, 0.13 * A * s, 0.02 * A * c);

  // Руки: левая рука вперёд вместе с правой ногой; локоть сгибается сильнее на махе вперёд
  const armA = 0.36 * A;
  const asym = 1 + 0.08 * wobble(t * 0.4, seed + 3);
  const fwdL = -s;
  const fwdR = s;
  r.armL.upper.rotation.set(-armA * fwdL * asym - 0.05, 0, 0.11);
  r.armR.upper.rotation.set(-armA * fwdR - 0.05, 0, -0.11);
  r.armL.fore.rotation.set(-(0.28 + 0.32 * A * Math.max(0, fwdL)), 0, 0);
  r.armR.fore.rotation.set(-(0.28 + 0.32 * A * Math.max(0, fwdR)), 0, 0);
  r.armL.hand.rotation.set(-0.12, 0.1, 0);
  r.armR.hand.rotation.set(-0.12, -0.1, 0);
  // Плечи подаются за рукой
  r.armL.clav.rotation.set(0, -0.05 * A * fwdL, 0);
  r.armR.clav.rotation.set(0, 0.05 * A * fwdR, 0);

  // Голова компенсирует скручивание и покачивание — взгляд ровный, иногда чуть по сторонам
  const look = 0.12 * wobble(t * 0.25, seed + 7);
  r.neck.rotation.set(-0.05 - 0.02 * A * Math.cos(2 * phase), -(r.pelvis.rotation.y + r.spine.rotation.y + r.chest.rotation.y) * 0.85, 0);
  r.head.rotation.set(0.02 * wobble(t * 0.3, seed + 11), look, -(r.pelvis.rotation.z + r.spine.rotation.z + r.chest.rotation.z) * 0.8);

  // Ткань: кромка куртки чуть запаздывает за тазом
  r.hem.rotation.set(Math.PI / 2 + 0.03 * A * c, 0, 0.04 * A * s);

  breathe(r, t, 2.3, 1);
}

/* ─── Работа: маляр с валиком ────────────────────────────────── */

const _target = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _hip = new THREE.Vector3();

export type WorkState = {
  lookYaw: number;
  lookPitch: number;
};

/**
 * Маляр катает валик вверх-вниз. Правая рука ведётся ИК к ручке валика, и вся цепочка следует за ней:
 * кисть → предплечье → локоть → плечо → ключица → грудь → поясница. Стопы стоят на месте (ИК ног),
 * таз переносит вес с ноги на ногу, колени пружинят, голова следит за валиком.
 * u — положение валика 0 (низ) … 1 (верх), grip — мировая точка ручки валика.
 */
export function poseWork(
  r: Rig,
  u: number,
  sway: number,
  grip: THREE.Vector3,
  roller: THREE.Vector3,
  floorY: number,
  t: number,
  seed: number,
  st: WorkState,
  dt: number,
  lift: { liftL: number; liftR: number },
) {
  const low = 1 - u;
  // Таз: перенос веса и приседание, когда валик внизу
  r.pelvis.position.set(0.035 * sway, DIM.pelvisY - 0.02 - 0.07 * low * low, 0.02 * u - 0.03 * low);
  r.pelvis.rotation.set(0.04 * low, 0.1 + 0.05 * sway, -0.035 * sway);
  // Корпус: наклон к стене внизу, прогиб и тянущееся плечо вверху, поворот к рабочей руке
  r.spine.rotation.set(0.1 + 0.26 * low, -0.12 - 0.08 * u, 0.03 * sway);
  r.chest.rotation.set(0.04 * low - 0.1 * u, -0.1 - 0.06 * u, 0.05 * sway - 0.06 * u);
  // Правая ключица поднимается, когда рука тянется вверх
  r.armR.clav.rotation.set(0, 0.06 * u, -0.18 * u);
  r.armL.clav.rotation.set(0, 0, 0.04 * u);
  breathe(r, t, 2.0, 1.3);

  // Правая рука: ИК к ручке, локоть смотрит вниз и в сторону
  r.root.updateWorldMatrix(true, true);
  r.root.localToWorld(_pole.set(-0.55, DIM.pelvisY + 0.05, 0.05));
  solveTwoBone(r.armR.upper, r.armR.fore, DIM.upper, DIM.fore + 0.07, grip, _pole);
  r.armR.hand.rotation.set(-0.35 - 0.3 * u, 0, 0.25);

  // Левая рука свободна: слегка согнута, на подъёме уходит в сторону для баланса
  r.armL.upper.rotation.set(-0.12 - 0.12 * u + 0.03 * wobble(t * 0.5, seed), 0.1, 0.14 + 0.18 * u);
  r.armL.fore.rotation.set(-0.5 - 0.2 * u, 0, 0);
  r.armL.hand.rotation.set(-0.2, 0, 0);

  // Ноги: стопы на полу (ИК), колени смотрят вперёд
  const legIK = (lg: Rig["legL"], fx: number, fz: number, yaw: number, up: number) => {
    r.root.localToWorld(_target.set(fx, DIM.ankle, fz));
    _target.y = floorY + DIM.ankle + up;
    r.root.localToWorld(_pole.set(fx * 1.3, 0.6, fz + 1));
    solveTwoBone(lg.thigh, lg.shin, DIM.thigh, DIM.shin, _target, _pole);
    footFlat(lg.foot, r.root);
    if (yaw) {
      _q2.setFromAxisAngle(_y.set(0, 1, 0), yaw);
      lg.foot.quaternion.multiply(_q2);
    }
  };
  legIK(r.legL, 0.13, -0.05, 0.18, lift.liftL);
  legIK(r.legR, -0.14, 0.12, -0.12, lift.liftR);

  // Голова: следит за валиком с запаздыванием
  r.neck.parent!.updateWorldMatrix(true, false);
  r.head.getWorldPosition(_hip);
  _target.copy(roller).sub(_hip);
  r.neck.parent!.getWorldQuaternion(_q);
  _target.applyQuaternion(_q.invert());
  const yaw = Math.atan2(_target.x, _target.z);
  const pitch = -Math.atan2(_target.y, Math.hypot(_target.x, _target.z));
  st.lookYaw = THREE.MathUtils.damp(st.lookYaw, clamp(yaw, -0.9, 0.9), 4, dt);
  st.lookPitch = THREE.MathUtils.damp(st.lookPitch, clamp(pitch, -0.7, 0.5), 4, dt);
  r.neck.rotation.set(st.lookPitch * 0.4, st.lookYaw * 0.45, 0);
  r.head.rotation.set(st.lookPitch * 0.6, st.lookYaw * 0.55, 0.02 * wobble(t * 0.4, seed + 5));

  r.hem.rotation.set(Math.PI / 2 + 0.02 * sway, 0, 0.03 * sway);
}
