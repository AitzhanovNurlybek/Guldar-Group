"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { animationConfig } from "./scene/animation-config";
import { onMotionReady, setScrollDriver, subscribeFrame } from "./scene/scroll";
import { detectQuality, finishProbe, performanceBudget, resetQuality } from "./scene/quality";

export function MotionEffects() {
  const pathname = usePathname();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let disposed = false;
    const setup = async () => {
      lenis?.destroy();
      if (reduced.matches) { lenis = null; setScrollDriver(null); }
      else {
        const { default: Lenis } = await import("lenis");
        if (disposed || reduced.matches) return;
        lenis = new Lenis({ autoRaf: false, duration: animationConfig.scrollDuration, smoothWheel: !window.matchMedia("(pointer: coarse)").matches, syncTouch: false, anchors: { offset: -100 }, prevent: (node) => node.closest("dialog, [data-lenis-prevent]") !== null });
        setScrollDriver((milliseconds) => lenis?.raf(milliseconds));
      }
      resetQuality();
    };
    const stopReady = onMotionReady(setup);
    let count = 0, elapsed = 0;
    const stopProbe = subscribeFrame((_, delta) => {
      if (count++ < 3) return;
      elapsed += delta;
      if (count < performanceBudget.sampleFrames + 3) return;
      finishProbe(detectQuality() === "low" ? 60 : performanceBudget.sampleFrames / elapsed);
      stopProbe();
    });
    reduced.addEventListener("change", setup);
    window.addEventListener("resize", resetQuality, { passive: true });
    return () => { disposed = true; stopReady(); stopProbe(); reduced.removeEventListener("change", setup); window.removeEventListener("resize", resetQuality); lenis?.destroy(); setScrollDriver(null); };
  }, [pathname]);
  return null;
}

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      element.style.animation = "number-settle .8s var(--ease-fluid) both";
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);
  return <><span ref={ref} aria-hidden="true" className="inline-block tabular-nums">{value}</span><span className="sr-only">{value}</span></>;
}
