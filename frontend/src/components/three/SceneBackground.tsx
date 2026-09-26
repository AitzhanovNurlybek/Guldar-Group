"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { subscribeScroll } from "./scroll";

// three.js грузится отдельным чанком уже после первой отрисовки страницы
const RenovationScene = dynamic(() => import("./RenovationScene"), { ssr: false });

// Этапы ремонта — те же пороги, что у сцены (прогресс ремонта = 0.12 + 0.88 × прокрутка)
const STAGES: [number, string][] = [
  [0, "Покраска стен"],
  [0.3, "Укладка плитки"],
  [0.58, "Электрика и свет"],
  [0.7, "Витрина и мебель"],
  [0.9, "Объект сдан"],
];
const stageAt = (k: number) => STAGES.reduce((i, [from], j) => (k >= from ? j : i), 0);

/*
 * Фон сайта в три слоя с разной скоростью параллакса: свечение (медленнее всех), миллиметровка
 * и 3D-макет помещения, в котором камера двигается сама. На первом экране макет в полную силу,
 * дальше приглушается, чтобы не мешать читать. Всё — от одного источника прокрутки.
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
        // К блоку «Результат» макет снова разгорается: ремонт закончен, результат виден до подвала
        if (finale !== null) {
          const peak = desktop ? 1 : 0.9;
          const tail = desktop ? 0.85 : 0.4; // на телефоне под блоком текст поверх макета — приглушаем
          const approach = finale > 0 ? Math.max(0, 1 - finale / 0.8) : 1;
          const after = finale < 0 ? Math.min(-finale / 0.6, 1) : 0;
          o = Math.max(o, min + (peak - min) * approach - (peak - tail) * after);
        }
        if (scene.current) scene.current.style.opacity = String(o);
        if (glow.current) glow.current.style.transform = `translate3d(0, ${(-progress * 40).toFixed(2)}px, 0)`;
        if (grid.current) grid.current.style.transform = `translate3d(0, ${(-progress * 120).toFixed(2)}px, 0)`;
        const k = 0.12 + 0.88 * progress;
        if (bar.current) bar.current.style.transform = `scaleX(${k.toFixed(4)})`;
        setStage(stageAt(k));
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
        <RenovationScene />
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
            <span ref={bar} className="block h-full origin-left bg-safety" style={{ transform: "scaleX(0.12)" }} />
          </span>
        </div>
      </div>
    </>
  );
}
