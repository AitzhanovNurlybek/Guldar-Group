import { animationConfig, SCENE_STAGES } from "./animation-config";
import { getScroll, subscribeFrame } from "./scroll";
export const sceneMotion = { current: 0, target: 0, pointerX: 0, pointerY: 0, manual: false, revision: 0 };
const listeners = new Set<() => void>();
const stageListeners = new Set<(stage: number) => void>();
let stage = 0, origin = 0;
export function selectSceneProgress(value: number | undefined) {
  sceneMotion.manual = value !== undefined;
  origin = getScroll().y;
  sceneMotion.target = value ?? getScroll().progress;
  listeners.forEach((listener) => listener());
}
export function subscribeScene(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function subscribeStage(listener: (value: number) => void) { stageListeners.add(listener); listener(stage); return () => { stageListeners.delete(listener); }; }
export function startSceneMotion() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  return subscribeFrame((_, delta) => {
    if (sceneMotion.manual && Math.abs(getScroll().y - origin) > 24) selectSceneProgress(undefined);
    if (!sceneMotion.manual) sceneMotion.target = reduced.matches ? 0 : getScroll().progress;
    const before = sceneMotion.current;
    sceneMotion.current += (sceneMotion.target - before) * (reduced.matches ? 1 : 1 - Math.exp(-animationConfig.damping * delta));
    if (Math.abs(sceneMotion.current - sceneMotion.target) < 0.0001) sceneMotion.current = sceneMotion.target;
    if (sceneMotion.current === before) return;
    sceneMotion.revision++;
    const next = SCENE_STAGES.reduce((index, item, i) => sceneMotion.current + 0.0001 >= item.progress ? i : index, 0);
    if (next !== stage) { stage = next; stageListeners.forEach((listener) => listener(stage)); }
    listeners.forEach((listener) => listener());
  });
}
