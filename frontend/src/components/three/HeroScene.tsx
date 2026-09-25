"use client";

import dynamic from "next/dynamic";

// three.js грузится отдельным чанком уже после первой отрисовки страницы
const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => <Glow />,
});

function Glow() {
  return (
    <div className="grid size-full place-items-center">
      <div className="size-48 animate-pulse rounded-full bg-sky-400/15 blur-3xl" />
    </div>
  );
}

export function HeroScene() {
  return (
    <div className="relative size-full">
      {/* Мягкая «тень» под композицией — дешевле настоящих теней в WebGL */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[12%] bottom-[8%] h-16 rounded-[50%] bg-sky-400/20 blur-3xl"
      />
      <Hero3D />
    </div>
  );
}
