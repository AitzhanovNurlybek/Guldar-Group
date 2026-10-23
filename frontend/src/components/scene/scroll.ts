export type ScrollState = { progress: number; hero: number; y: number; vh: number; vw: number; finale: number | null; activeSection: number };
type Listener = (state: ScrollState) => void;
type Frame = (time: number, delta: number) => void;
const state: ScrollState = { progress: 0, hero: 0, y: 0, vh: 1, vw: 1, finale: null, activeSection: 0 };
const scrollListeners = new Set<Listener>();
const layoutListeners = new Set<() => void>();
const frames = new Set<Frame>();
const renderers = new Set<Frame>();
const sectionIds = ["home", "uslugi", "postavka", "o-kompanii", "obsudit"];
let sectionTops: number[] = [];
let finaleCenter = 0, sceneEnd = 1, pageEnd = 1;
let dirty = true, running = false, lastY = -1, raf = 0, lastTime = 0;
let observer: ResizeObserver | null = null;
const clamp = (n: number) => Math.min(1, Math.max(0, n));

function request() {
  if (!raf && running && !document.hidden) raf = requestAnimationFrame(tick);
}
function invalidateLayout() { dirty = true; request(); }
function measure() {
  dirty = false;
  state.vh = window.innerHeight || 1;
  state.vw = document.documentElement.clientWidth;
  pageEnd = document.documentElement.scrollHeight - state.vh;
  const finale = document.querySelector<HTMLElement>("[data-scene-finale]");
  finaleCenter = finale ? finale.getBoundingClientRect().top + state.y + finale.offsetHeight / 2 : 0;
  const story = document.querySelector<HTMLElement>(".scene-story");
  const start = story ? story.getBoundingClientRect().top + state.y : 0;
  sceneEnd = Math.max(1, finaleCenter - state.vh / 2 - start);
  sectionTops = sectionIds.map((id) => {
    const element = document.getElementById(id);
    return element ? element.getBoundingClientRect().top + state.y : Infinity;
  });
  layoutListeners.forEach((listener) => listener());
}
function tick(milliseconds: number) {
  raf = 0;
  if (!running || document.hidden) return;
  state.y = Math.max(0, window.scrollY);
  const measured = dirty;
  if (dirty) measure();
  if (state.y !== lastY || measured) {
    state.progress = clamp(state.y / (finaleCenter ? sceneEnd : Math.max(1, pageEnd)));
    state.hero = clamp(state.y / state.vh);
    state.finale = finaleCenter ? (finaleCenter - state.y - state.vh / 2) / state.vh : null;
    let nearest = -Infinity;
    state.activeSection = 0;
    for (let i = 0; i < sectionTops.length; i++) {
      if (sectionTops[i] <= state.y + state.vh * 0.36 && sectionTops[i] > nearest) { nearest = sectionTops[i]; state.activeSection = i; }
    }
    scrollListeners.forEach((listener) => listener(state));
    lastY = state.y;
  }
  const delta = lastTime ? Math.min((milliseconds - lastTime) / 1000, 0.05) : 1 / 60;
  lastTime = milliseconds;
  frames.forEach((listener) => listener(milliseconds / 1000, delta));
  renderers.forEach((listener) => listener(milliseconds / 1000, delta));
  // Scroll-only pages sleep between browser events; renderers opt into frames.
  if (frames.size || renderers.size) request();
  else lastTime = 0;
}
function visibility() { lastTime = 0; request(); }
function start() {
  if (running) { request(); return; }
  running = true; dirty = true; lastY = -1;
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", invalidateLayout, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  observer = new ResizeObserver(invalidateLayout);
  observer.observe(document.body);
  document.fonts.ready.then(() => { if (running) invalidateLayout(); });
  request();
}
function stopIfUnused() {
  if (scrollListeners.size || layoutListeners.size || frames.size || renderers.size) return;
  running = false; cancelAnimationFrame(raf); raf = 0; lastTime = 0;
  window.removeEventListener("scroll", request);
  window.removeEventListener("resize", invalidateLayout);
  document.removeEventListener("visibilitychange", visibility);
  observer?.disconnect(); observer = null;
}
export const getScroll = () => state;
export function subscribeScroll(listener: Listener) { scrollListeners.add(listener); dirty = true; start(); return () => { scrollListeners.delete(listener); stopIfUnused(); }; }
export function subscribeLayout(listener: () => void) { layoutListeners.add(listener); dirty = true; start(); return () => { layoutListeners.delete(listener); stopIfUnused(); }; }
export function subscribeFrame(listener: Frame, render = false) { const collection = render ? renderers : frames; collection.add(listener); start(); return () => { collection.delete(listener); stopIfUnused(); }; }
