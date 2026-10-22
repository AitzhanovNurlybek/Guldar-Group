"use client";

import { useEffect, useRef } from "react";
import { LogoMark } from "./Logo";
import { getScroll, subscribeFrame, subscribeLayout } from "./scene/scroll";
import { sceneMotion } from "./scene/motion-state";
import { getQuality, quality } from "./scene/quality";

export function HomeChoreography() {
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    let processTop = 0, processHeight = 1, tickerWidth = 1, tickerInView = false, tickerX = 0;
    let pointerX = 0, pointerY = 0, x = 0, y = 0, seen = false, lastX = -100, lastY = -100;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const timeline = document.querySelector<HTMLElement>(".process-grid");
    const ticker = document.querySelector<HTMLElement>(".materials-track");
    const poster = document.querySelector<HTMLElement>(".scene-mobile-poster");
    let posterTop = 0;
    const magnetCleanups: (() => void)[] = [];
    const magnets: { element: HTMLElement; x: number; y: number; targetX: number; targetY: number }[] = [];
    const measure = () => {
      if (timeline) { const r = timeline.getBoundingClientRect(); processTop = r.top + getScroll().y; processHeight = r.height; }
      if (ticker) tickerWidth = ticker.scrollWidth / 2;
      if (poster) posterTop = poster.getBoundingClientRect().top + getScroll().y;
    };
    const stopLayout = subscribeLayout(measure);
    const observer = new IntersectionObserver(([entry]) => {
      tickerInView = entry.isIntersecting;
      if (ticker) ticker.style.willChange = tickerInView ? "transform" : "auto";
    });
    if (ticker) observer.observe(ticker);
    const move = (event: PointerEvent) => {
      pointerX = event.clientX; pointerY = event.clientY; seen = true;
      cursor.current?.setAttribute("data-interactive", String(!!(event.target as HTMLElement).closest("a,button,input,summary")));
    };
    const leave = () => { seen = false; };
    if (fine) {
      document.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      document.querySelectorAll<HTMLElement>(".hero-copy .btn").forEach((button) => {
        let rect: DOMRect;
        const magnet = { element: button, x: 0, y: 0, targetX: 0, targetY: 0 };
        magnets.push(magnet);
        const enter = () => { rect = button.getBoundingClientRect(); button.style.willChange = "transform"; };
        const moveButton = (event: PointerEvent) => {
          if (!rect) return;
          magnet.targetX = (event.clientX - rect.left - rect.width / 2) * 0.1;
          magnet.targetY = (event.clientY - rect.top - rect.height / 2) * 0.17;
        };
        const reset = () => {
          magnet.targetX = 0; magnet.targetY = 0;
        };
        button.addEventListener("pointerenter", enter); button.addEventListener("pointermove", moveButton); button.addEventListener("pointerleave", reset);
        magnetCleanups.push(() => { button.removeEventListener("pointerenter", enter); button.removeEventListener("pointermove", moveButton); button.removeEventListener("pointerleave", reset); button.style.willChange = "auto"; });
      });
    }
    const stopFrame = subscribeFrame((_, delta) => {
      const scroll = getScroll();
      if (timeline) timeline.style.setProperty("--process-progress", String(Math.max(0, Math.min(1, (scroll.y + scroll.vh * 0.7 - processTop) / (processHeight + scroll.vh * 0.2)))));
      if (ticker && tickerInView && getQuality() !== "low") { tickerX = (tickerX + delta * 16) % tickerWidth; ticker.style.transform = `translate3d(${-tickerX}px,0,0)`; }
      if (poster && scroll.vw < 768 && Math.abs(posterTop - scroll.y) < scroll.vh) poster.style.transform = `translate3d(0,${Math.max(-8, Math.min(8, (scroll.y - posterTop + scroll.vh * 0.5) / scroll.vh * 8))}px,0)`;
      if (!fine || !quality[getQuality()].pointer) { if (cursor.current) cursor.current.style.opacity = "0"; return; }
      const amount = 1 - Math.exp(-8 * delta);
      for (let i = 0; i < magnets.length; i++) {
        const magnet = magnets[i];
        magnet.x += (magnet.targetX - magnet.x) * amount; magnet.y += (magnet.targetY - magnet.y) * amount;
        if (Math.abs(magnet.x) + Math.abs(magnet.y) > 0.02) magnet.element.style.transform = `translate3d(${magnet.x.toFixed(2)}px,${magnet.y.toFixed(2)}px,0)`;
        else { magnet.element.style.transform = "none"; magnet.element.style.willChange = "auto"; }
      }
      const cameraX = seen && scroll.y < scroll.vh * 1.5 ? (pointerX / scroll.vw - 0.5) * 2 : 0;
      const cameraY = seen && scroll.y < scroll.vh * 1.5 ? (0.5 - pointerY / scroll.vh) * 2 : 0;
      const previousX = sceneMotion.pointerX, previousY = sceneMotion.pointerY;
      sceneMotion.pointerX += (cameraX - previousX) * amount; sceneMotion.pointerY += (cameraY - previousY) * amount;
      if (Math.abs(sceneMotion.pointerX - previousX) + Math.abs(sceneMotion.pointerY - previousY) > 0.0001) sceneMotion.revision++;
      x += (pointerX - x) * amount; y += (pointerY - y) * amount;
      if (cursor.current) {
        cursor.current.style.opacity = seen ? "1" : "0";
        if (Math.abs(x - lastX) + Math.abs(y - lastY) > 0.1) { cursor.current.style.transform = `translate3d(${x - 14}px,${y - 14}px,0)`; lastX = x; lastY = y; }
      }
    });
    return () => { stopFrame(); stopLayout(); observer.disconnect(); document.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); magnetCleanups.forEach((cleanup) => cleanup()); };
  }, []);
  return <><div ref={cursor} className="custom-cursor" aria-hidden="true" /><div className="brand-intro" aria-hidden="true"><LogoMark className="size-8" /><span>GulDar Group</span></div></>;
}
