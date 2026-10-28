"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { SceneAsset } from "./SceneAsset";
import { SCENE_STAGES as STAGES } from "./animation-config";
import { sceneMotion, selectSceneProgress, startSceneMotion, subscribeScene, subscribeStage } from "./motion-state";
import { useQuality } from "./quality";

const SceneContext = createContext({ stage: 0 });

export function SceneProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const stop = startSceneMotion();
    const stageStop = subscribeStage(setStage);
    return () => { stop(); stageStop(); };
  }, []);
  return <SceneContext.Provider value={{ stage }}><div className="scene-story">{children}</div></SceneContext.Provider>;
}

export function SceneBackground() {
  return <><div aria-hidden="true" className="backdrop-glow" /><div aria-hidden="true" className="backdrop-grid" /></>;
}

export function SceneShowcase() {
  const { stage } = useContext(SceneContext);
  const range = useRef<HTMLInputElement>(null);
  const manual = useSyncExternalStore(subscribeScene, () => sceneMotion.manual, () => false);
  const staticScene = useQuality() === "low";
  useEffect(() => {
    const sync = () => {
      if (!range.current) return;
      const value = Math.round((sceneMotion.manual ? sceneMotion.target : sceneMotion.current) * 100);
      range.current.value = String(value);
      range.current.setAttribute("aria-valuetext", `${value}% — ${STAGES[stage].title}`);
    };
    sync();
    return subscribeScene(sync);
  }, [stage]);
  return <div className="scene-showcase">
    <div className="scene-showcase-header"><span>От первого замера до открытия</span><span className="scene-format-label">3D-макет</span></div>
    <div className="scene-visual" role="img" aria-label={`3D-макет ремонта коммерческого помещения. ${STAGES[stage].title}.`}><SceneAsset /></div>
    <div className="scene-showcase-controls">
      <div className="scene-stage-heading"><p className="scene-stage-title">{STAGES[stage].title}</p><span className="scene-stage-count">0{stage + 1} / 05</span></div>
      <div className="scene-stage-list" role="group" aria-label="Этапы ремонта">{STAGES.map((item, i) => <button key={item.short} type="button" className="scene-stage-button" data-active={stage === i} aria-pressed={stage === i} aria-label={`Показать этап: ${item.title}`} onClick={() => selectSceneProgress(item.progress)}><span>0{i + 1}</span><span>{item.short}</span></button>)}</div>
      <label className="sr-only" htmlFor="scene-progress">Посмотреть ход ремонта</label>
      <input ref={range} id="scene-progress" type="range" min={0} max={100} step={1} defaultValue={0} aria-valuetext={`0% — ${STAGES[0].title}`} onChange={(event) => selectSceneProgress(Number(event.target.value) / 100)} className="scene-range" />
      <div className="scene-showcase-hint"><span>{staticScene ? "Выберите этап или двигайте ползунок" : "Листайте страницу или выберите этап"}</span>{manual && !staticScene && <button type="button" className="scene-auto-button" onClick={() => selectSceneProgress(undefined)}>По прокрутке</button>}<a href="#maket" className="scene-explorer-link">Осмотреть макет в 3D</a></div>
    </div>
  </div>;
}
