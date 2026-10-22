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
let dirty = true, running = false, lastY = -1;
let observer: ResizeObserver | null = null;
let scrollDriver: ((time: number) => void) | null = null;
let ticker: (typeof import("gsap"))["gsap"]["ticker"] | null = null;
let bootTimer: ReturnType<typeof setTimeout>;
const readyListeners = new Set<() => void>();
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const invalidateLayout = () => { dirty = true; };
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
function tick(time: number, milliseconds: number) {
  if (document.hidden) return;
  scrollDriver?.(time * 1000);
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
  const delta = Math.min(milliseconds / 1000, 0.05);
  frames.forEach((listener) => listener(time, delta));
  renderers.forEach((listener) => listener(time, delta));
}
function start() {
  if (running) return;
  running = true; dirty = true;
  const boot = () => {
    bootTimer = setTimeout(async () => {
      const { gsap } = await import("gsap");
      if (!running) return;
      ticker = gsap.ticker;
      ticker.fps(performanceBudget.targetFps); ticker.add(tick);
      readyListeners.forEach((listener) => listener());
    }, performanceBudget.motionDelayMs);
  };
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot, { once: true });
  window.addEventListener("resize", invalidateLayout, { passive: true });
  observer = new ResizeObserver(invalidateLayout);
  observer.observe(document.body);
  document.fonts.ready.then(invalidateLayout);
}
function stopIfUnused() {
  if (scrollListeners.size || layoutListeners.size || frames.size || renderers.size || scrollDriver) return;
  ticker?.remove(tick); ticker = null; running = false; clearTimeout(bootTimer);
  window.removeEventListener("resize", invalidateLayout); observer?.disconnect(); observer = null;
}
export const getScroll = () => state;
export function subscribeScroll(listener: Listener) { scrollListeners.add(listener); start(); dirty = true; return () => { scrollListeners.delete(listener); stopIfUnused(); }; }
export function subscribeLayout(listener: () => void) { layoutListeners.add(listener); start(); dirty = true; return () => { layoutListeners.delete(listener); stopIfUnused(); }; }
export function subscribeFrame(listener: Frame, render = false) { const collection = render ? renderers : frames; collection.add(listener); start(); return () => { collection.delete(listener); stopIfUnused(); }; }
export function setScrollDriver(driver: typeof scrollDriver) { scrollDriver = driver; if (driver) start(); else stopIfUnused(); }
export function onMotionReady(listener: () => void) { readyListeners.add(listener); start(); if (ticker) listener(); return () => { readyListeners.delete(listener); }; }
import { performanceBudget } from "./quality";
