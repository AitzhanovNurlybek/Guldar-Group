"use client";

import { useEffect, useRef, useState } from "react";
import { SceneFrames } from "./SceneFrames";
import { subscribeScroll } from "./scroll";

// Этапы ремонта — те же пороги, что в сюжете рендера (render/scene.py), по прогрессу прокрутки
const STAGES: [number, string][] = [
  [0, "Стены: штукатурка и покраска"],
  [0.3, "Полы"],
  [0.48, "Электрика и свет"],
  [0.62, "Витрина и мебель"],
  [0.92, "Объект сдан"],
];
const stageAt = (p: number) => STAGES.reduce((i, [from], j) => (p >= from ? j : i), 0);

/*
 * Фон сайта в три слоя с разной скоростью параллакса: свечение (медленнее всех), миллиметровка
 * и фото-рендер помещения, который прокрутка листает от черновой коробки до готового объекта.
 * На первом экране рендер в полную силу, дальше приглушается, чтобы не мешать читать. Всё — от одного источника прокрутки.
 */
export function SceneBackground() {
  const scene = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(
    () =>
      subscribeScroll(({ progress, hero, finale }) => {
        const desktop = window.innerWidth >= 1024;
        const min = desktop ? 0.5 : 0.12;
        let o = 1 - (1 - min) * Math.min(hero / 0.7, 1);
        // К блоку «Результат» рендер снова разгорается: ремонт закончен, результат виден до подвала
        if (finale !== null) {
          const peak = desktop ? 1 : 0.9;
          const tail = desktop ? 0.85 : 0.4; // на телефоне под блоком текст поверх рендера — приглушаем
          const approach = finale > 0 ? Math.max(0, 1 - finale / 0.8) : 1;
          const after = finale < 0 ? Math.min(-finale / 0.6, 1) : 0;
          o = Math.max(o, min + (peak - min) * approach - (peak - tail) * after);
        }
        if (scene.current) scene.current.style.opacity = String(o);
        if (glow.current) glow.current.style.transform = `translate3d(0, ${(-progress * 40).toFixed(2)}px, 0)`;
        if (grid.current) grid.current.style.transform = `translate3d(0, ${(-progress * 120).toFixed(2)}px, 0)`;
        if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0.04, progress).toFixed(4)})`;
        setStage(stageAt(progress));
      }),
    [],
  );

  return (
    <>
      <div ref={glow} aria-hidden className="backdrop-glow" />
      <div ref={grid} aria-hidden className="backdrop-grid" />
      <div
        ref={scene}
        aria-hidden
        className="scene-layer pointer-events-none fixed top-16 right-0 z-0 h-[40svh] w-full lg:top-0 lg:h-dvh lg:w-[60vw]"
      >
        <SceneFrames />
        {/* Подпись этапа — связывает интерфейс со сценой; только на десктопе */}
        <div className="scene-hud absolute right-8 bottom-8 hidden w-56 lg:block">
          <p className="flex items-center gap-2 text-[0.7rem] font-bold tracking-[0.12em] text-fg-3 uppercase">
            <span className="size-1.5 rounded-full bg-safety shadow-[0_0_10px_2px_rgb(245_135_31/0.6)]" />
            Этап {stage + 1} / {STAGES.length}
          </p>
          <p key={stage} className="scene-hud-title mt-1.5 text-sm font-bold text-fg">
            {STAGES[stage][1]}
          </p>
          <span className="mt-3 block h-px w-full overflow-hidden bg-line">
            <span ref={bar} className="block h-full origin-left bg-safety" style={{ transform: "scaleX(0.04)" }} />
          </span>
        </div>
      </div>
    </>
  );
}
