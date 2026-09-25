"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

// three.js грузится отдельным чанком уже после первой отрисовки страницы
const ConstructionScene = dynamic(() => import("./ConstructionScene"), { ssr: false });

// Стройка живёт за контентом всего сайта. На первом экране — в полную силу,
// дальше приглушается, чтобы не мешать читать.
export function SceneBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const desktop = window.innerWidth >= 1024;
      const min = desktop ? 0.4 : 0.12;
      const t = Math.min(window.scrollY / (window.innerHeight * 0.7), 1);
      el.style.opacity = String(1 - (1 - min) * t);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="scene-layer pointer-events-none fixed top-16 right-0 z-0 h-[40svh] w-full lg:top-0 lg:h-dvh lg:w-[54vw]"
    >
      <ConstructionScene />
    </div>
  );
}
