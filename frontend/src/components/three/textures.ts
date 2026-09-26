import * as THREE from "three";

/*
 * Процедурные текстуры — рисуются на canvas один раз при старте сцены, без загрузки файлов:
 * бетон/штукатурка (цвет + шероховатость), мягкое пятно контактной тени и градиент «запечённой»
 * ambient occlusion вдоль стыков стен и пола.
 */

// Детерминированный генератор — одинаковая фактура при каждой загрузке
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!] as const;
}

// Бетон: крупные пятна + мелкое зерно + редкие поры. Светлая база — цвет задаёт материал.
export function concreteTexture(seed: number, size = 512, repeat = 1) {
  const [c, g] = canvas(size);
  const r = rng(seed);
  g.fillStyle = "#d8d8d8";
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = size * (0.05 + r() * 0.18);
    const v = 200 + Math.floor(r() * 55);
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, `rgba(${v},${v},${v},0.22)`);
    grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 22;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = "rgba(120,120,120,0.35)";
  for (let i = 0; i < 260; i++) {
    g.beginPath();
    g.arc(r() * size, r() * size, 0.6 + r() * 1.4, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  return tex;
}

// Маски для alphaMap — в оттенках серого (alphaMap читает яркость, а не альфу)
// Мягкое круглое пятно — контактная тень под людьми и предметами
export function blobTexture(size = 128) {
  const [c, g] = canvas(size);
  g.fillStyle = "#000";
  g.fillRect(0, 0, size, size);
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "#fff");
  grd.addColorStop(0.45, "#8c8c8c");
  grd.addColorStop(1, "#000");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// Экран кассы на стойке: шапка в фирменном цвете, строки чека, итог — читается как интерфейс, а не как чёрный прямоугольник
export function screenTexture() {
  const [c, g] = canvas(128);
  c.height = 80;
  g.fillStyle = "#0c1824";
  g.fillRect(0, 0, 128, 80);
  g.fillStyle = "#2f7fc0";
  g.fillRect(0, 0, 128, 14);
  g.fillStyle = "#f5871f";
  g.fillRect(6, 4, 22, 6);
  g.fillStyle = "#9fb3c6";
  for (let i = 0; i < 4; i++) {
    g.fillRect(8, 22 + i * 10, 52 - i * 7, 4);
    g.fillRect(96, 22 + i * 10, 22, 4);
  }
  g.fillStyle = "#e9f2fa";
  g.fillRect(8, 66, 34, 6);
  g.fillStyle = "#f5871f";
  g.fillRect(84, 63, 36, 12);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Затенение у стыка: плотно у края (v = 0), к середине сходит на нет
export function edgeTexture(size = 128) {
  const [c, g] = canvas(size);
  const grd = g.createLinearGradient(0, size, 0, 0);
  grd.addColorStop(0, "#fff");
  grd.addColorStop(0.35, "#5a5a5a");
  grd.addColorStop(1, "#000");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
