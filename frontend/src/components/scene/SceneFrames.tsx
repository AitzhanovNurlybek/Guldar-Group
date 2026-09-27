"use client";

import { useEffect, useRef } from "react";
import { getScroll, subscribeScroll } from "./scroll";

/*
 * Фон-«видео» из кадров фото-рендера (render/scene.py → render/export_frames.py).
 * Прокрутка листает кадры: 0 — черновое помещение, последний — готовый объект.
 * Между соседними кадрами — плавный переход прозрачностью, поверх — инерция, как у камеры.
 * Кадры грузятся «грубо → точно»: сначала каждый 16-й, потом промежуточные — листать можно почти сразу.
 * Кадры вокруг текущего заранее декодируются, чтобы быстрая прокрутка не спотыкалась.
 * Пока первый кадр не нарисован (или браузер не умеет AVIF) — виден постер.
 */
export const FRAME_COUNT = 144;
const frameSrc = (set: string, i: number) => `/scene/${set}/${String(i + 1).padStart(3, "0")}.avif`;

export function SceneFrames() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const poster = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const set = window.matchMedia("(max-width: 1023px)").matches ? "m" : "d";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

    const frames: (HTMLImageElement | undefined)[] = [];
    const decoded = new Set<number>();
    let alive = true;
    let failed = false;
    let W = 0;
    let H = 0;
    let cur = getScroll().progress * (FRAME_COUNT - 1);
    let target = cur;
    let raf = 0;
    let last = 0;
    let drawn = "";

    const nearest = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };
    // Как object-fit: cover — кадр заполняет слой, лишнее обрезается поровну
    const blit = (im: HTMLImageElement, alpha: number) => {
      const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
      const w = im.naturalWidth * s;
      const h = im.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
    };
    const draw = () => {
      const a = Math.floor(cur);
      const ia = nearest(a);
      if (ia < 0) return;
      const next = frames[a + 1];
      const blend = ia === a && next ? cur - a : 0;
      const key = `${ia}|${blend.toFixed(2)}|${W}|${H}`;
      if (key === drawn) return;
      drawn = key;
      ctx.clearRect(0, 0, W, H);
      blit(frames[ia]!, 1);
      if (blend > 0.02 && next) blit(next, blend);
      ctx.globalAlpha = 1;
      if (poster.current) poster.current.style.visibility = "hidden";
    };
    // Декодировать кадры вокруг цели заранее — иначе drawImage декодирует их синхронно, посреди прокрутки
    const warm = (center: number) => {
      for (let i = center - 4; i <= center + 6; i++) {
        const im = frames[i];
        if (im && !decoded.has(i)) {
          decoded.add(i);
          im.decode().catch(() => {});
        }
      }
    };
    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      cur = reduced ? target : cur + (target - cur) * (1 - Math.exp(-9 * dt));
      if (Math.abs(target - cur) < 0.01) cur = target;
      warm(Math.round(target));
      draw();
      if (cur !== target) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const request = (force = false) => {
      if (force) drawn = "";
      if (!raf && alive && !failed) raf = requestAnimationFrame(tick);
    };

    // Порядок загрузки: каждый 16-й, 8-й, 4-й, 2-й кадр, затем все (при экономии трафика — до каждого 4-го)
    const order: number[] = [];
    const queued = new Set<number>();
    for (const step of saveData ? [16, 8, 4] : [16, 8, 4, 2, 1])
      for (let i = 0; i < FRAME_COUNT; i += step)
        if (!queued.has(i)) {
          queued.add(i);
          order.push(i);
        }
    if (!queued.has(FRAME_COUNT - 1)) order.splice(1, 0, FRAME_COUNT - 1);
    let queue = 0;
    const loadNext = () => {
      if (!alive || failed || queue >= order.length) return;
      const i = order[queue++];
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        frames[i] = im;
        if (Math.abs(i - Math.round(cur)) <= 1 || drawn === "") request(true);
        loadNext();
      };
      im.onerror = () => {
        if (i === 0) failed = true; // AVIF не поддерживается — остаётся постер
        loadNext();
      };
      im.src = frameSrc(set, i);
    };
    for (let k = 0; k < 6; k++) loadNext();

    const ro = new ResizeObserver(() => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = Math.max(1, Math.round(r.width * dpr));
      H = c.height = Math.max(1, Math.round(r.height * dpr));
      request(true);
    });
    ro.observe(c);
    const unsubscribe = subscribeScroll(({ progress }) => {
      target = progress * (FRAME_COUNT - 1);
      request();
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsubscribe();
    };
  }, []);

  return (
    <>
      <picture>
        <source media="(max-width: 1023px)" srcSet="/scene/poster-m.webp" />
        <img ref={poster} src="/scene/poster-d.webp" alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
      </picture>
      <canvas ref={canvas} className="absolute inset-0 size-full" />
    </>
  );
}
