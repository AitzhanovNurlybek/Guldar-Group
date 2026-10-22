"use client";

import { useEffect, useRef } from "react";
import { getScroll, subscribeScroll } from "./scroll";

export const FRAME_COUNT = 144;
const frameSrc = (set: string, i: number) => `/scene/${set}/${String(i + 1).padStart(3, "0")}.avif`;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

type Connection = EventTarget & { saveData?: boolean };
type SceneNavigator = Navigator & { connection?: Connection };

/** An explicit progress value lets visitors inspect a stage without scrolling. */
export function SceneFrames({ progress }: { progress?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const poster = useRef<HTMLImageElement>(null);
  const progressRef = useRef(progress);
  const updateProgress = useRef<(() => void) | null>(null);

  useEffect(() => {
    progressRef.current = progress;
    updateProgress.current?.();
  }, [progress]);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;

    const mobile = window.matchMedia("(max-width: 1023px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as SceneNavigator).connection;
    let stop = () => {};

    const start = () => {
      stop();
      const set = mobile.matches ? "m" : "d";
      const staticMode = reduced.matches || Boolean(connection?.saveData);
      // Bound decoded images instead of retaining the full 144-frame sequence.
      const cacheLimit = mobile.matches ? 12 : 18;
      const frames = new Map<number, HTMLImageElement>();
      const pending = new Map<number, HTMLImageElement>();
      const failed = new Set<number>();
      let alive = true;
      let inView = true;
      let queue: number[] = [];
      let width = 0;
      let height = 0;
      let current = clamp(progressRef.current ?? getScroll().progress) * (FRAME_COUNT - 1);
      let target = current;
      let raf = 0;
      let last = 0;
      let drawn = "";
      let lastRequested = "";

      if (poster.current) poster.current.style.visibility = "visible";
      ctx.clearRect(0, 0, c.width, c.height);

      const nearest = (index: number) => {
        let found = -1;
        let distance = Infinity;
        for (const i of frames.keys()) {
          if (Math.abs(i - index) < distance) {
            found = i;
            distance = Math.abs(i - index);
          }
        }
        return found;
      };

      const blit = (im: HTMLImageElement, alpha: number) => {
        // Keep the complete architectural model on every screen shape.
        const scale = Math.min(width / im.naturalWidth, height / im.naturalHeight);
        const w = im.naturalWidth * scale;
        const h = im.naturalHeight * scale;
        ctx.globalAlpha = alpha;
        ctx.drawImage(im, (width - w) / 2, (height - h) / 2, w, h);
      };

      const draw = () => {
        if (staticMode && progressRef.current === undefined) return;
        const a = Math.floor(current);
        const ia = nearest(a);
        if (ia < 0 || !width || !height) return;
        const first = frames.get(ia)!;
        const next = frames.get(a + 1);
        const blend = ia === a && next ? current - a : 0;
        const key = `${ia}|${blend.toFixed(3)}|${width}|${height}`;
        if (key === drawn) return;
        drawn = key;
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
        blit(first, 1 - blend);
        if (blend > 0 && next) {
          // Weighted premultiplied blending preserves transparent model edges.
          ctx.globalCompositeOperation = "lighter";
          blit(next, blend);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        if (poster.current) poster.current.style.visibility = "hidden";
      };

      const prune = () => {
        if (frames.size <= cacheLimit) return;
        const distance = (i: number) => Math.min(Math.abs(i - current), Math.abs(i - target));
        const ordered = [...frames.keys()].sort((a, b) => distance(b) - distance(a));
        for (const index of ordered.slice(0, frames.size - cacheLimit)) frames.delete(index);
      };

      const pump = () => {
        while (alive && inView && !document.hidden && pending.size < 3 && queue.length) {
          const index = queue.shift()!;
          if (frames.has(index) || pending.has(index) || failed.has(index)) continue;
          const im = new Image();
          im.decoding = "async";
          pending.set(index, im);
          im.onload = async () => {
            try {
              await im.decode();
            } catch {
              // A completed image is still drawable if explicit decode fails.
            }
            if (!alive) return;
            pending.delete(index);
            frames.set(index, im);
            prune();
            request(true);
            pump();
          };
          im.onerror = () => {
            if (!alive) return;
            pending.delete(index);
            failed.add(index);
            pump();
          };
          im.src = frameSrc(set, index);
        }
      };

      const preload = () => {
        if (!inView || document.hidden) return;
        if (staticMode && progressRef.current === undefined) return;
        const a = Math.floor(target);
        const b = Math.floor(current);
        const key = `${a}|${b}`;
        if (key === lastRequested) return;
        lastRequested = key;
        const desired = staticMode
          ? [Math.round(target)]
          : [a, a + 1, b, b + 1, a + 2, a - 1, a + 3, a - 2, b - 1, b + 2];
        queue = [...new Set(desired)].filter(
          (i) => i >= 0 && i < FRAME_COUNT && !frames.has(i) && !pending.has(i) && !failed.has(i),
        );
        pump();
      };

      const tick = (now: number) => {
        raf = 0;
        if (!alive || !inView || document.hidden) return;
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
        last = now;
        current = staticMode ? target : current + (target - current) * (1 - Math.exp(-12 * dt));
        if (Math.abs(target - current) < 0.005) current = target;
        preload();
        draw();
        if (current !== target) raf = requestAnimationFrame(tick);
        else last = 0;
      };

      function request(force = false) {
        if (force) drawn = "";
        if (!raf && alive && inView && !document.hidden) raf = requestAnimationFrame(tick);
      }

      const resize = () => {
        const rect = c.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, Math.round(rect.width * dpr));
        height = Math.max(1, Math.round(rect.height * dpr));
        if (c.width !== width || c.height !== height) {
          c.width = width;
          c.height = height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
        }
        request(true);
      };

      const sync = () => {
        const manual = progressRef.current;
        if (staticMode && manual === undefined) {
          queue = [];
          if (poster.current) poster.current.style.visibility = "visible";
          ctx.clearRect(0, 0, width, height);
          drawn = "";
          return;
        }
        target = clamp(manual ?? getScroll().progress) * (FRAME_COUNT - 1);
        if (staticMode) current = target = Math.round(target);
        preload();
        request();
      };

      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(raf);
          raf = 0;
          last = 0;
        } else {
          lastRequested = "";
          sync();
        }
      };

      updateProgress.current = sync;
      const ro = new ResizeObserver(resize);
      ro.observe(c);
      resize();
      const unsubscribe = subscribeScroll(sync);
      document.addEventListener("visibilitychange", visibility);
      const intersection = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (!inView) {
          cancelAnimationFrame(raf);
          raf = 0;
          last = 0;
          queue = [];
        } else {
          // Resume at the visible stage instead of replaying offscreen scroll.
          current = target;
          lastRequested = "";
          sync();
          request(true);
        }
      }, { rootMargin: "160px" });
      intersection.observe(c);

      stop = () => {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        intersection.disconnect();
        unsubscribe();
        document.removeEventListener("visibilitychange", visibility);
        for (const im of pending.values()) {
          im.onload = null;
          im.onerror = null;
          im.removeAttribute("src");
        }
        pending.clear();
        frames.clear();
        updateProgress.current = null;
      };
    };

    start();
    mobile.addEventListener("change", start);
    reduced.addEventListener("change", start);
    connection?.addEventListener("change", start);
    return () => {
      stop();
      mobile.removeEventListener("change", start);
      reduced.removeEventListener("change", start);
      connection?.removeEventListener("change", start);
    };
  }, []);

  return (
    <>
      <picture>
        <source media="(max-width: 1023px)" srcSet="/scene/poster-m.webp" />
        <img ref={poster} src="/scene/poster-d.webp" alt="" width={1320} height={1200} fetchPriority="high" className="absolute inset-0 size-full object-contain" />
      </picture>
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />
    </>
  );
}
