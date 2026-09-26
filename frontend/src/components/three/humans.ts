import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/*
 * Люди на макете: стилизованные, но с человеческими пропорциями (рост ≈ 1.78 ед. = метров).
 * Скелет — иерархия костей: таз → поясница → грудь → шея → голова, ключицы → плечо → предплечье → кисть,
 * бедро → голень → стопа. Лицо, волосы, одежда и обувь — отдельные куски геометрии поверх «тела».
 * Все куски одного человека сливаются в одну сетку со скинингом (каждая вершина жёстко привязана к своей кости),
 * цвета — в вершинах: человек рисуется за 3 вызова (ткань, кожа, глянец) вместо ~50, и детали почти ничего не стоят.
 * Каска — отдельной сеткой без тени, чтобы козырёк не клал тёмную полосу на лицо.
 * Геометрия и материалы создаются один раз; в покадровой анимации — ни одного new.
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

/* ─── Голова: профиль и точки на коже ────────────────────────── */

// Профиль черепа [радиус, высота] от макушки к подбородку; сечение — эллипс, глубина ×HEAD_DEPTH
const HEAD: [number, number][] = [
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
];
const HEAD_DEPTH = 1.24;
const TOP = 0.125;
const CHIN = -0.117;
const SKULL = { y: 0.115, z: 0.008 }; // центр черепа в координатах кости головы

function headRadius(y: number) {
  for (let i = 0; i < HEAD.length - 1; i++) {
    const [r0, y0] = HEAD[i];
    const [r1, y1] = HEAD[i + 1];
    if (y <= y0 && y >= y1) return r0 + ((r1 - r0) * (y0 - y)) / (y0 - y1);
  }
  return 0.0001;
}

// Точка на коже: высота y от центра черепа, угол a от фаса (+ — к +x), отступ наружу out.
// yaw — поворот, при котором деталь смотрит по нормали к лицу.
function onHead(y: number, a: number, out = 0) {
  const r = headRadius(y) + out;
  return {
    x: r * Math.sin(a),
    y: SKULL.y + y,
    z: SKULL.z + HEAD_DEPTH * r * Math.cos(a),
    yaw: Math.atan2(HEAD_DEPTH * Math.sin(a), Math.cos(a)),
  };
}

/*
 * Поверхность по форме черепа — волосы и борода. Для каждого угла a — полоса от lower(a) до upper(a),
 * «раздутая» от центра черепа на толщину thick (сверху волосы пышнее — так выходит само).
 * dense — где сгущать ряды: у макушки (волосы) или у подбородка (борода), там кривизна больше.
 */
function scalp(
  lower: (a: number) => number,
  upper: (a: number) => number,
  from: number,
  to: number,
  thick: (a: number, t: number) => number,
  cols: number,
  rows: number,
  dense: "top" | "bottom",
) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= cols; i++) {
    const a = from + ((to - from) * i) / cols;
    const y0 = lower(a);
    const y1 = upper(a);
    for (let j = 0; j <= rows; j++) {
      const t = j / rows;
      const e = dense === "top" ? Math.sin((t * Math.PI) / 2) : 1 - Math.cos((t * Math.PI) / 2);
      const y = y0 + (y1 - y0) * e;
      const r = headRadius(y);
      const s = 1 + thick(a, t) / 0.08;
      pos.push(s * r * Math.sin(a), s * y, s * HEAD_DEPTH * r * Math.cos(a));
    }
  }
  // Порядок вершин как у LatheGeometry с профилем снизу вверх — грани смотрят наружу
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j;
      const b = a + rows + 1;
      idx.push(a, b, a + 1, b + 1, a + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

// Линия роста волос: надо лбом высоко, над ушами ниже, на затылке — до шеи; бакенбарды перед ухом
function hairline(a: number) {
  const c = Math.cos(a);
  const y = c >= 0 ? 0.014 + 0.05 * Math.pow(c, 1.4) : 0.014 - 0.084 * Math.pow(-c, 0.9);
  return y - 0.03 * Math.exp(-Math.pow((Math.abs(wrapAngle(a)) - 1.28) / 0.11, 2));
}

// Верхний край бороды: под губами низко, к щекам поднимается и сходится с бакенбардами
const beardLine = (a: number) => -0.071 + 0.066 * THREE.MathUtils.smoothstep(Math.abs(a), 0.35, 1.3);

/* ─── Геометрия тела ─────────────────────────────────────────── */

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

const rbox = (w: number, h: number, d: number, r: number, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, r);
const ellipsoid = (r: number, sx: number, sy: number, sz: number, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h).scale(sx, sy, sz);

// Краска куска: цвет вершин и класс поверхности (0 — ткань и волосы, 1 — кожа, 2 — глянец)
type Paint = { color: THREE.Color; kind: 0 | 1 | 2 };
const paint = (hex: string, kind: Paint["kind"] = 0): Paint => ({ color: new THREE.Color(hex), kind });

export function createHumanKit() {
  const geo = {
    // Голова — «яйцо» с сужением к подбородку, а не шар
    head: lathe(HEAD, HEAD_DEPTH, 26),
    hair: scalp(hairline, () => TOP, Math.PI, Math.PI * 3, (a, t) => 0.007 + 0.007 * Math.max(0, Math.cos(a)) * t, 40, 12, "top"),
    buzz: scalp(hairline, () => TOP, Math.PI, Math.PI * 3, () => 0.0035, 32, 10, "top"),
    beard: scalp(() => CHIN, beardLine, -1.5, 1.5, (_, t) => 0.0055 * (1 - 0.35 * t), 26, 8, "bottom"),
    mustache: rbox(0.042, 0.009, 0.012, 0.0044, 1),
    // Лицо: белок, радужка, линия ресниц, брови, нос, губы
    sclera: ellipsoid(0.011, 1.1, 0.6, 0.55),
    iris: ellipsoid(0.0068, 1, 1, 0.55, 10, 8),
    lash: rbox(0.026, 0.0035, 0.007, 0.0017, 1),
    brow: rbox(0.03, 0.0075, 0.01, 0.0036, 1),
    nose: rbox(0.024, 0.048, 0.03, 0.011),
    lips: rbox(0.036, 0.016, 0.014, 0.0065),
    mouth: rbox(0.03, 0.0022, 0.003, 0.001, 1),
    ear: ellipsoid(0.026, 0.6, 1.1, 0.32, 10, 8),
    neck: limb(0.052, 0.051, 0.056, 0.1, 14),
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
    // Складки ткани: кромка куртки, воротник, гармошка брюк над обувью; молния
    hem: new THREE.TorusGeometry(0.16, 0.009, 6, 28),
    // Воротник плотный и чуть стоячий — закрывает основание шеи
    collar: new THREE.TorusGeometry(0.066, 0.017, 8, 24),
    zipper: rbox(0.007, 0.2, 0.004, 0.0015, 1),
    deltoid: new THREE.SphereGeometry(0.068, 14, 10),
    // Руки
    sleeveShort: limb(0.062, 0.058, 0.053, 0.13),
    sleeveLong: limb(0.06, 0.056, 0.047, DIM.upper),
    upperArm: limb(0.046, 0.045, 0.037, DIM.upper),
    foreArm: limb(0.039, 0.038, 0.029, DIM.fore),
    foreSleeve: limb(0.046, 0.045, 0.038, DIM.fore * 0.78),
    cuff: new THREE.TorusGeometry(0.041, 0.008, 6, 16),
    gloveCuff: new THREE.TorusGeometry(0.036, 0.01, 6, 16),
    // Кисть: ладонь, четыре пальца, большой палец
    palm: limb(0.03, 0.034, 0.027, 0.07, 10),
    finger: limb(0.0088, 0.0086, 0.0076, 0.04, 6),
    thumb: limb(0.012, 0.012, 0.01, 0.05, 8),
    // Ноги — это брюки: кожа не видна, отдельное «тело» не нужно
    thigh: limb(0.082, 0.078, 0.06, DIM.thigh),
    shin: limb(0.061, 0.058, 0.055, DIM.shin),
    fold: new THREE.TorusGeometry(0.057, 0.007, 6, 18),
    kneePad: rbox(0.085, 0.1, 0.03, 0.012),
    // Обувь: верх, подошва, шнуровка кроссовок, голенище ботинок
    shoe: rbox(0.1, 0.075, 0.24, 0.03, 3),
    sole: rbox(0.108, 0.026, 0.27, 0.01),
    laces: rbox(0.052, 0.01, 0.1, 0.004, 1),
    bootCuff: new THREE.CylinderGeometry(0.058, 0.064, 0.07, 14),
    // Пояс маляра: ремень, пряжка, сумка с инструментом, рулетка
    belt: new THREE.TorusGeometry(0.163, 0.013, 6, 32),
    buckle: rbox(0.036, 0.03, 0.01, 0.003, 1),
    pouch: rbox(0.06, 0.12, 0.11, 0.015),
    handle: new THREE.CylinderGeometry(0.011, 0.011, 0.16, 8),
    tape: rbox(0.03, 0.065, 0.065, 0.01),
    // Жилет: светоотражающие полосы, карманы
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
    pocket: rbox(0.07, 0.075, 0.014, 0.006),
    // Каска: купол, козырёк, кромка, ребро жёсткости
    helmet: new THREE.SphereGeometry(0.096, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    peak: rbox(0.13, 0.012, 0.055, 0.005),
    rim: new THREE.TorusGeometry(0.098, 0.006, 6, 32),
    ridge: rbox(0.022, 0.03, 0.2, 0.008),
  };
  // Кроссовка: носок вперёд, пятка под голеностопом
  geo.shoe.translate(0, -0.02, 0.055);
  geo.sole.translate(0, -DIM.ankle + 0.013, 0.06);

  const P = {
    skinA: paint("#c38a68", 1),
    skinB: paint("#a8704f", 1),
    lipsA: paint("#a65d4b", 1),
    lipsB: paint("#86493a", 1),
    mouth: paint("#4a2622", 1),
    hair: paint("#221811"),
    beard: paint("#34261b"),
    sclera: paint("#dcd5cb", 2),
    iris: paint("#22150d", 2),
    jacket: paint("#34465a"),
    tee: paint("#8b97a3"),
    chino: paint("#2a2f36"),
    work: paint("#233348"),
    vest: paint("#f5871f"),
    vestPocket: paint("#dd7515"),
    reflect: paint("#e3e8ec", 2),
    zipper: paint("#a7b2bd", 2),
    shoeWhite: paint("#e9ebee"),
    shoeDark: paint("#3a312a"),
    sole: paint("#f4f4f2"),
    laces: paint("#c3c9d0"),
    glove: paint("#56636f"),
    belt: paint("#2a2018"),
    metal: paint("#c9ced3", 2),
    pouch: paint("#8a5a2b"),
    wood: paint("#b98a5e"),
    tape: paint("#f2c01e", 2),
    pad: paint("#2b3036"),
  };

  const std = (roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness });
  const mats = [std(0.86), std(0.52), std(0.3, 0.15)];
  const helmet = new THREE.MeshStandardMaterial({ color: "#f5a01f", roughness: 0.32, metalness: 0.05 });

  // Слитые сетки людей — освобождаются вместе с набором
  const owned: THREE.BufferGeometry[] = [];
  const dispose = () => {
    Object.values(geo).forEach((g) => g.dispose());
    owned.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    helmet.dispose();
  };
  return { geo, paint: P, mats, helmet, owned, dispose };
}
export type HumanKit = ReturnType<typeof createHumanKit>;

/* ─── Скелет ─────────────────────────────────────────────────── */

export type Rig = ReturnType<typeof buildHuman>;

type Look = {
  skin: Paint;
  lips: Paint;
  top: Paint;
  pants: Paint;
  shoe: Paint;
  longSleeves: boolean;
  worker?: boolean; // каска, жилет, перчатки, пояс с инструментом, борода
};

type PartData = { g: THREE.BufferGeometry; p: Paint | "helmet" };

// Кусок геометрии → копия без лишних атрибутов, в координатах `space`, с цветом и привязкой к кости
function bake(o: THREE.Object3D, space: THREE.Matrix4, color?: THREE.Color, bone = 0) {
  const { g } = o.userData.part as PartData;
  const c = g.index ? g.toNonIndexed() : g.clone();
  for (const name of Object.keys(c.attributes)) if (name !== "position" && name !== "normal") c.deleteAttribute(name);
  c.applyMatrix4(new THREE.Matrix4().multiplyMatrices(space, o.matrixWorld));
  if (color) {
    const n = c.attributes.position.count;
    const col = new Float32Array(n * 3);
    const si = new Uint16Array(n * 4);
    const sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
      si[i * 4] = bone;
      sw[i * 4] = 1;
    }
    c.setAttribute("color", new THREE.BufferAttribute(col, 3));
    c.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    c.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
  }
  return c;
}

function merge(list: THREE.BufferGeometry[], groups = false) {
  const g = mergeGeometries(list, groups);
  if (!g) throw new Error("humans: не удалось слить геометрию");
  return g;
}

export function buildHuman(kit: HumanKit, look: Look) {
  const { geo, paint: P } = kit;
  const hands = look.worker ? P.glove : look.skin;
  // Сустав — кость скелета
  const bone = (parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const b = new THREE.Bone();
    b.position.set(x, y, z);
    parent.add(b);
    return b;
  };
  // Кусок поверхности: пока — пустой объект с геометрией и краской; в конце всё сливается в одну сетку
  const part = (parent: THREE.Object3D, g: THREE.BufferGeometry, p: Paint | "helmet", x = 0, y = 0, z = 0) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    o.userData.part = { g, p } satisfies PartData;
    parent.add(o);
    return o;
  };
  // Деталь лица на коже головы
  const face = (head: THREE.Object3D, g: THREE.BufferGeometry, p: Paint, y: number, a: number, out: number) => {
    const s = onHead(y, a, out);
    const o = part(head, g, p, s.x, s.y, s.z);
    o.rotation.y = s.yaw;
    return o;
  };

  const root = new THREE.Group();
  const pelvis = bone(root, 0, DIM.pelvisY, 0);
  part(pelvis, geo.pelvis, look.pants);
  if (look.worker) {
    // Ремень под краем футболки, сумка с молотком на правом бедре, рулетка на левом
    const belt = part(pelvis, geo.belt, P.belt, 0, 0.012, 0);
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1, 0.68, 1);
    part(pelvis, geo.buckle, P.metal, 0, 0.012, 0.117);
    part(pelvis, geo.pouch, P.pouch, -0.182, -0.035, 0.02).rotation.z = 0.05;
    part(pelvis, geo.handle, P.wood, -0.19, 0.06, 0.035).rotation.z = 0.12;
    part(pelvis, geo.tape, P.tape, 0.18, -0.005, 0.02);
  }

  // Корпус
  const spine = bone(pelvis, 0, 0.07, 0);
  part(spine, geo.abdomen, look.top);
  if (look.longSleeves) part(spine, geo.zipper, P.zipper, 0, 0.07, 0.105);
  const hem = bone(spine, 0, -0.035, 0);
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1, 0.68, 1);
  part(hem, geo.hem, look.top);
  const chest = bone(spine, 0, 0.19, 0);
  // Грудь «дышит» отдельной костью — вместе с ней жилет, карманы и воротник
  const chestSkin = bone(chest);
  part(chestSkin, geo.chest, look.top);
  const collar = part(chestSkin, geo.collar, look.top, 0, 0.27, 0.004);
  collar.rotation.x = Math.PI / 2 + 0.2;
  collar.scale.set(1, 1, look.longSleeves ? 1.7 : 1.1);
  if (look.longSleeves) part(chestSkin, geo.zipper, P.zipper, 0, 0.1, 0.109);
  if (look.worker) {
    part(chestSkin, geo.vest, P.vest);
    [0.02, 0.13].forEach((y) => {
      const s = part(chestSkin, geo.stripe, P.reflect, 0, y, 0);
      s.rotation.x = Math.PI / 2;
      s.scale.set(1, 0.65, 1);
    });
    [-1, 1].forEach((s) => {
      const p = part(chestSkin, geo.pocket, P.vestPocket, s * 0.078, -0.045, 0.1);
      p.rotation.y = s * 0.3;
    });
  }

  // Шея и голова
  const neck = bone(chest, 0, 0.255, 0.005);
  part(neck, geo.neck, look.skin).rotation.x = Math.PI; // сегмент растёт вверх от основания шеи
  const head = bone(neck, 0, 0.1, 0);
  part(head, geo.head, look.skin, 0, SKULL.y, SKULL.z);
  part(head, look.worker ? geo.buzz : geo.hair, P.hair, 0, SKULL.y, SKULL.z);
  [-1, 1].forEach((s) => {
    const a = s * 0.37;
    face(head, geo.sclera, P.sclera, 0.012, a, -0.003);
    face(head, geo.iris, P.iris, 0.011, a, 0.0015);
    face(head, geo.lash, P.hair, 0.0195, a, 0.0005).rotation.z = -s * 0.12;
    const brow = face(head, geo.brow, P.hair, 0.037, s * 0.36, 0.0015);
    brow.rotation.z = -s * 0.1;
    if (look.worker) brow.scale.set(1.05, 1.3, 1);
    face(head, geo.ear, look.skin, -0.004, (s * Math.PI) / 2, -0.002);
  });
  face(head, geo.nose, look.skin, -0.012, 0, -0.004).rotation.x = -0.3;
  face(head, geo.lips, look.lips, -0.057, 0, -0.003);
  face(head, geo.mouth, P.mouth, -0.057, 0, 0.0035);
  if (look.worker) {
    part(head, geo.beard, P.beard, 0, SKULL.y, SKULL.z);
    face(head, geo.mustache, P.beard, -0.047, 0, 0.0005);
    const helmet = new THREE.Group();
    helmet.position.set(0, 0.165, 0.004);
    helmet.rotation.x = -0.08;
    head.add(helmet);
    part(helmet, geo.helmet, "helmet").scale.set(1, 0.92, 1.18);
    const rim = part(helmet, geo.rim, "helmet", 0, 0.002, 0);
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1, 1.18, 1);
    part(helmet, geo.peak, "helmet", 0, 0.004, 0.13).rotation.x = 0.12;
    part(helmet, geo.ridge, "helmet", 0, 0.082, 0);
  }

  // Руки: ключица → плечо → предплечье → кисть
  const arm = (side: 1 | -1) => {
    const clav = bone(chest, side * 0.05, 0.215, -0.005);
    const del = part(clav, geo.deltoid, look.top, side * 0.115, -0.012, 0);
    del.scale.set(0.95, 0.85, 0.9);
    const upper = bone(clav, side * DIM.shoulderX, 0, 0);
    part(upper, geo.upperArm, look.skin);
    part(upper, look.longSleeves ? geo.sleeveLong : geo.sleeveShort, look.top);
    const fore = bone(upper, 0, -DIM.upper, 0);
    part(fore, geo.foreArm, look.skin);
    if (look.longSleeves) {
      part(fore, geo.foreSleeve, look.top);
      part(fore, geo.cuff, look.top, 0, -DIM.fore * 0.74, 0).rotation.x = Math.PI / 2;
    }
    if (look.worker) part(fore, geo.gloveCuff, hands, 0, -DIM.fore + 0.012, 0).rotation.x = Math.PI / 2;
    const hand = bone(fore, 0, -DIM.fore - 0.005, 0);
    part(hand, geo.palm, hands).scale.set(1.15, 1, 0.62);
    // Пальцы от указательного к мизинцу, чуть согнуты
    (
      [
        [0.0225, 1.0],
        [0.0075, 1.12],
        [-0.0075, 1.06],
        [-0.0225, 0.86],
      ] as const
    ).forEach(([x, len]) => {
      const f = part(hand, geo.finger, hands, -side * x, -0.072, 0.003);
      f.scale.set(1, len, 1);
      f.rotation.x = 0.35;
    });
    const thumb = part(hand, geo.thumb, hands, -side * 0.026, -0.02, 0.018);
    thumb.rotation.set(0.5, 0, -side * 0.45);
    return { clav, upper, fore, hand };
  };
  const L = arm(1);
  const R = arm(-1);

  // Ноги: бедро → голень → стопа
  const leg = (side: 1 | -1) => {
    const thigh = bone(pelvis, side * DIM.hipX, DIM.hipY, 0);
    part(thigh, geo.thigh, look.pants);
    const shin = bone(thigh, 0, -DIM.thigh, 0);
    part(shin, geo.shin, look.pants);
    [0.33, 0.37].forEach((k, i) => {
      const f = part(shin, geo.fold, look.pants, 0, -DIM.shin + k * 0.1, 0.002);
      f.rotation.x = Math.PI / 2 + (i ? 0.18 : -0.12);
    });
    if (look.worker) part(shin, geo.kneePad, P.pad, 0, -0.035, 0.058);
    const foot = bone(shin, 0, -DIM.shin, 0);
    part(foot, geo.shoe, look.shoe);
    part(foot, geo.sole, P.sole);
    if (look.worker) part(foot, geo.bootCuff, look.shoe, 0, 0.03, 0);
    else part(foot, geo.laces, P.laces, 0, 0.018, 0.07);
    return { thigh, shin, foot };
  };
  const LL = leg(1);
  const RL = leg(-1);

  /* Сборка: куски → одна сетка со скинингом (+ каска отдельно) */
  root.updateMatrixWorld(true);
  const bones: THREE.Bone[] = [];
  const parts: THREE.Object3D[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone);
    if (o.userData.part) parts.push(o);
  });
  const byKind: THREE.BufferGeometry[][] = [[], [], []];
  const helmetParts: THREE.BufferGeometry[] = [];
  const I = new THREE.Matrix4();
  const headInv = head.matrixWorld.clone().invert();
  for (const o of parts) {
    const { p } = o.userData.part as PartData;
    if (p === "helmet") helmetParts.push(bake(o, headInv));
    else {
      let b = o.parent;
      while (b && !(b as THREE.Bone).isBone) b = b.parent;
      byKind[p.kind].push(bake(o, I, p.color, bones.indexOf(b as THREE.Bone)));
    }
    o.removeFromParent();
  }
  const kinds = ([0, 1, 2] as const).filter((k) => byKind[k].length);
  const perKind = kinds.map((k) => merge(byKind[k]));
  const body = merge(perKind, true);
  [...byKind.flat(), ...perKind].forEach((g) => g.dispose());
  kit.owned.push(body);

  const mesh = new THREE.SkinnedMesh(
    body,
    kinds.map((k) => kit.mats[k]),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false; // поза уводит вершины за рамки позы привязки
  root.add(mesh);
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));

  if (helmetParts.length) {
    const g = merge(helmetParts);
    helmetParts.forEach((h) => h.dispose());
    kit.owned.push(g);
    const helmet = new THREE.Mesh(g, kit.helmet);
    helmet.receiveShadow = true;
    head.add(helmet);
  }

  return {
    root,
    mesh,
    pelvis,
    spine,
    chest,
    chestSkin,
    hem,
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
  r.chestSkin.scale.set(1 + 0.008 * b * depth, 1 + 0.01 * b * depth, 1 + 0.018 * b * depth);
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
