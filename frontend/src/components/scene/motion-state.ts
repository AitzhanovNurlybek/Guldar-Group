import { animationConfig, SCENE_STAGES } from "./animation-config";
import { getScroll, subscribeFrame, subscribeScroll } from "./scroll";
import { getQuality, subscribeQuality } from "./quality";
export const sceneMotion = { current: 0, target: 0, pointerX: 0, pointerY: 0, manual: false, revision: 0 };
const listeners = new Set<() => void>();
const stageListeners = new Set<(stage: number) => void>();
let stage = 0, origin = 0;
const staticQuery = "(prefers-reduced-motion: reduce), (max-width: 1023px), (pointer: coarse)";
function notify() {
  const next = SCENE_STAGES.reduce((index, item, i) => sceneMotion.current + 0.0001 >= item.progress ? i : index, 0);
  if (next !== stage) { stage = next; stageListeners.forEach((listener) => listener(stage)); }
  listeners.forEach((listener) => listener());
}
export function selectSceneProgress(value: number | undefined) {
  sceneMotion.manual = value !== undefined;
  origin = getScroll().y;
  sceneMotion.target = value ?? getScroll().progress;
  if (window.matchMedia(staticQuery).matches || getQuality() === "low") { sceneMotion.current = sceneMotion.target; sceneMotion.revision++; }
  notify();
}
export function subscribeScene(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function subscribeStage(listener: (value: number) => void) { stageListeners.add(listener); listener(stage); return () => { stageListeners.delete(listener); }; }
export function startSceneMotion() {
  const media = window.matchMedia(staticQuery);
  let stopAnimation: (() => void) | null = null;
  sceneMotion.manual = false;
  sceneMotion.current = sceneMotion.target = 0;
  notify();
  const animate = () => {
    if (media.matches || getQuality() === "low" || stopAnimation || sceneMotion.current === sceneMotion.target) return;
    stopAnimation = subscribeFrame((_, delta) => {
      sceneMotion.current += (sceneMotion.target - sceneMotion.current) * (1 - Math.exp(-animationConfig.damping * delta));
      if (Math.abs(sceneMotion.current - sceneMotion.target) < 0.0001) sceneMotion.current = sceneMotion.target;
      sceneMotion.revision++;
      notify();
      if (sceneMotion.current === sceneMotion.target) { stopAnimation?.(); stopAnimation = null; }
    });
  };
  const stopScene = subscribeScene(animate);
  const sync = () => {
    if (media.matches || getQuality() === "low") {
      stopAnimation?.(); stopAnimation = null;
      const target = sceneMotion.manual ? sceneMotion.target : 0;
      if (sceneMotion.current !== target) { sceneMotion.current = sceneMotion.target = target; sceneMotion.revision++; notify(); }
      return;
    }
    if (sceneMotion.manual && Math.abs(getScroll().y - origin) > 24) sceneMotion.manual = false;
    if (!sceneMotion.manual) sceneMotion.target = getScroll().progress;
    animate();
  };
  const stopScroll = subscribeScroll(sync);
  const stopQuality = subscribeQuality(sync);
  media.addEventListener("change", sync);
  return () => { stopScroll(); stopScene(); stopQuality(); stopAnimation?.(); media.removeEventListener("change", sync); };
}
