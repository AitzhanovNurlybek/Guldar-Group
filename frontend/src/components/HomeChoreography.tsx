"use client";

import { useEffect } from "react";
import { getScroll, subscribeLayout, subscribeScroll } from "./scene/scroll";

export function HomeChoreography() {
  useEffect(() => {
    const timeline = document.querySelector<HTMLElement>(".process-grid");
    if (!timeline) return;
    let top = 0, height = 1;
    const measure = () => {
      const rect = timeline.getBoundingClientRect();
      top = rect.top + getScroll().y;
      height = rect.height;
    };
    const stopLayout = subscribeLayout(measure);
    const stopScroll = subscribeScroll(({ y, vh }) => {
      timeline.style.setProperty("--process-progress", String(Math.max(0, Math.min(1, (y + vh * 0.7 - top) / (height + vh * 0.2)))));
    });
    return () => { stopLayout(); stopScroll(); };
  }, []);
  return null;
}
