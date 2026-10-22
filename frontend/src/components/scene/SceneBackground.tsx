"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { SceneAsset } from "./SceneAsset";
import { getScroll, subscribeFrame, subscribeLayout } from "./scroll";
import { SCENE_STAGES as STAGES } from "./animation-config";
import { sceneMotion, selectSceneProgress, startSceneMotion, subscribeScene, subscribeStage } from "./motion-state";
import { useQuality } from "./quality";
import Image from "next/image";

const SceneContext = createContext({ stage: 0 });
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function SceneProvider({ children }: { children: ReactNode }) {
  const story = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(0);
  const [active, setActive] = useState(true);
  const level = useQuality();

  useEffect(() => {
    const stop = startSceneMotion();
    const stageStop = subscribeStage(setStage);
    const trackStop = subscribeScene(() => { if (track.current) track.current.style.transform = `scaleX(${sceneMotion.current})`; });
    return () => { stop(); stageStop(); trackStop(); };
  }, []);

  useEffect(() => {
    const visual = layer.current;
    if (!visual) return;
    let anchorX = 0, anchorY = 0, anchorWidth = 1, anchorHeight = 1;
    let width = 1, height = 1, x = 0, y = 0, scale = 1, measured = false;
    let inView = true, wasActive = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
    observer.observe(visual);
    const measure = () => {
      const anchor = story.current?.querySelector<HTMLElement>(".scene-anchor");
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect(), scroll = getScroll();
      anchorX = rect.left; anchorY = rect.top + scroll.y; anchorWidth = rect.width; anchorHeight = rect.height;
      width = anchorWidth;
      height = anchorHeight;
      visual.style.width = `${width}px`; visual.style.height = `${height}px`;
      measured = false;
    };
    const stopLayout = subscribeLayout(measure);
    let quietFrames = 0;
    const stopFrame = subscribeFrame((_, delta) => {
      const scroll = getScroll();
      const desktop = scroll.vw >= 1024 && level !== "low";
      const dock = desktop ? clamp(scroll.y / (scroll.vh * 0.75)) : 0;
      const initialScale = Math.min(anchorWidth / width, anchorHeight / height);
      const initialX = anchorX + (anchorWidth - width * initialScale) / 2;
      const initialY = anchorY - scroll.y + (anchorHeight - height * initialScale) / 2;
      const dockedScale = Math.min(Math.min(scroll.vw * 0.55, 850) / width, scroll.vh * 0.82 / height);
      const targetX = initialX + (scroll.vw - width * dockedScale - 16 - initialX) * dock;
      const targetY = initialY + (Math.max(24, scroll.vh * 0.07) - initialY) * dock;
      const targetScale = initialScale + (dockedScale - initialScale) * dock;
      const amount = !measured || reduced.matches || !desktop ? 1 : 1 - Math.exp(-9 * delta);
      const moving = Math.abs(x - targetX) + Math.abs(y - targetY) + Math.abs(scale - targetScale) > 0.03;
      x += (targetX - x) * amount; y += (targetY - y) * amount; scale += (targetScale - scale) * amount;
      if (moving || !measured) {
        visual.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
        visual.style.willChange = "transform, opacity"; quietFrames = 0;
      } else if (++quietFrames === 15) visual.style.willChange = "auto";
      measured = true;
      const atResult = scroll.finale === null ? 0 : clamp(1 - Math.abs(scroll.finale) / 0.9);
      const afterResult = scroll.finale === null ? 0 : clamp((-scroll.finale - 0.6) / 0.7);
      const opacity = (1 - dock * 0.83 + atResult * dock * 0.83) * (1 - afterResult);
      visual.style.opacity = opacity.toFixed(3);
      visual.dataset.docked = String(dock > 0.9);
      const nextActive = inView && !document.hidden && opacity > 0.01;
      if (wasActive !== nextActive) { wasActive = nextActive; setActive(nextActive); }
    });
    const visibility = () => setActive(!document.hidden && inView);
    document.addEventListener("visibilitychange", visibility);
    return () => { stopLayout(); stopFrame(); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, [level]);

  return <SceneContext.Provider value={{ stage }}>
    <div ref={story} className="scene-story">
      <div ref={layer} className="scroll-scene-layer" aria-hidden="true">
        <SceneAsset active={active} />
        <div className="scroll-scene-hud">
          <p>Этап 0{stage + 1} / 05 · 3D-макет</p><strong>{STAGES[stage].title}</strong>
          <div className="hud-stage-list">{STAGES.map((item, i) => <span key={item.short} data-active={i === stage}>{item.short}</span>)}</div>
          <span className="scroll-scene-track"><span ref={track} /></span>
        </div>
      </div>
      {children}
    </div>
  </SceneContext.Provider>;
}

export function SceneBackground() {
  return <><div aria-hidden="true" className="backdrop-glow" /><div aria-hidden="true" className="backdrop-grid" /></>;
}

export function SceneShowcase() {
  const { stage } = useContext(SceneContext);
  const range = useRef<HTMLInputElement>(null);
  const [manual, setManual] = useState(false);
  const [manualFrame, setManualFrame] = useState(0);
  const staticScene = useQuality() === "low";
  useEffect(() => {
    let wasManual = sceneMotion.manual;
    let previousTarget = -1;
    return subscribeScene(() => {
    if (wasManual !== sceneMotion.manual) { wasManual = sceneMotion.manual; setManual(wasManual); }
    if (sceneMotion.manual && sceneMotion.target !== previousTarget) { previousTarget = sceneMotion.target; setManualFrame(Math.round(sceneMotion.target * 143) + 1); }
    if (range.current) {
      const value = Math.round((sceneMotion.manual ? sceneMotion.target : sceneMotion.current) * 100);
      range.current.value = String(value);
      range.current.setAttribute("aria-valuetext", `${value}% — ${STAGES[stage].title}`);
    }
    });
  }, [stage]);
  return <div className="scene-showcase">
    <div className="scene-showcase-header"><span><span className="scene-status-dot" />Путь от идеи до готового объекта</span><span className="scene-format-label">3D-макет</span></div>
    <div className="scene-visual scene-anchor" role="img" aria-label={`3D-макет ремонта коммерческого помещения. ${STAGES[stage].title}.`}><div className="scene-mobile-poster"><Image src={manual && manualFrame ? `/scene/d/${String(manualFrame).padStart(3, "0")}.avif` : "/scene/poster-d.webp"} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 80vw, 55vw" alt="" priority className="object-contain" /></div></div>
    <div className="scene-showcase-controls">
      <div className="scene-stage-heading"><p className="scene-stage-title">{STAGES[stage].title}</p><span className="scene-stage-count">0{stage + 1} / 05</span></div>
      <div className="scene-stage-list" role="group" aria-label="Этапы ремонта">{STAGES.map((item, i) => <button key={item.short} type="button" className="scene-stage-button" data-active={stage === i} aria-pressed={stage === i} aria-label={`Показать этап: ${item.title}`} onClick={() => selectSceneProgress(item.progress)}><span>0{i + 1}</span><span>{item.short}</span></button>)}</div>
      <label className="sr-only" htmlFor="scene-progress">Посмотреть ход ремонта</label>
      <input ref={range} id="scene-progress" type="range" min={0} max={100} step={1} defaultValue={0} aria-valuetext={`0% — ${STAGES[0].title}`} onChange={(event) => selectSceneProgress(Number(event.target.value) / 100)} className="scene-range" />
      <div className="scene-showcase-hint"><span>{staticScene ? "Выберите этап или двигайте ползунок" : "Листайте страницу — ремонт идёт"}</span>{manual && !staticScene && <button type="button" className="scene-auto-button" onClick={() => selectSceneProgress(undefined)}>По прокрутке</button>}</div>
    </div>
  </div>;
}
