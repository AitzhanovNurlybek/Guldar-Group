/*
 * Единый источник прокрутки для 3D и параллакса фона.
 * Один пассивный слушатель на всё приложение, пересчёт не чаще кадра (rAF).
 * progress — 0 → 1 по всей странице, а если на ней есть блок data-scene-finale (на главной — «Результат»),
 * то 1 — когда этот блок в центре экрана: там ремонт в макете закончен. hero — 0 → 1 в пределах первого экрана.
 * finale — где центр блока data-scene-finale относительно центра экрана, в высотах экрана (> 0 — ниже), или null.
 * 3D читает getScroll() прямо в кадре; сглаживание (инерция камеры) — на стороне сцены.
 */

export type ScrollState = { progress: number; hero: number; y: number; vh: number; finale: number | null };
type Listener = (s: ScrollState) => void;

const state: ScrollState = { progress: 0, hero: 0, y: 0, vh: 1, finale: null };
const listeners = new Set<Listener>();
let raf = 0;
let resizeObserver: ResizeObserver | null = null;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function measure() {
  raf = 0;
  const vh = window.innerHeight || 1;
  state.y = window.scrollY;
  state.vh = vh;
  const finale = document.querySelector<HTMLElement>("[data-scene-finale]");
  if (finale) {
    const r = finale.getBoundingClientRect();
    const center = r.top + r.height / 2 - vh / 2;
    const end = state.y + center;
    state.finale = center / vh;
    state.progress = end > 0 ? clamp01(state.y / end) : 1;
  } else {
    const max = document.documentElement.scrollHeight - vh;
    state.finale = null;
    state.progress = max > 0 ? clamp01(state.y / max) : 0;
  }
  state.hero = clamp01(state.y / vh);
  listeners.forEach((l) => l(state));
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(measure);
}

export function getScroll() {
  return state;
}

export function subscribeScroll(fn: Listener) {
  if (listeners.size === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Высота страницы меняется без прокрутки: переход между страницами, подгрузка шрифтов
    resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);
  }
  listeners.add(fn);
  measure();
  return () => {
    listeners.delete(fn);
    if (listeners.size) return;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    resizeObserver?.disconnect();
    resizeObserver = null;
    cancelAnimationFrame(raf);
    raf = 0;
  };
}
