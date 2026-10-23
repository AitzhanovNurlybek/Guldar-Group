"use client";

import { useEffect } from "react";
import { detectQuality, setQuality } from "./scene/quality";

export function MotionEffects() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 1023px), (pointer: coarse)");
    const update = () => setQuality(detectQuality());
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return null;
}

export function AnimatedNumber({ value }: { value: number }) {
  return <span className="tabular-nums">{value}</span>;
}
