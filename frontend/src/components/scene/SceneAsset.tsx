"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { performanceBudget, quality, useQuality } from "./quality";
import { sceneMotion, subscribeScene } from "./motion-state";

const RoomCanvas = dynamic(() => import("./RoomCanvas"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SceneAsset() {
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterFrame, setPosterFrame] = useState(0);
  const level = useQuality();
  const staticScene = !quality[level].webgl;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (staticScene || !active) return;
    let idle = 0;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // Give the poster and headline the first paint before downloading the 3D chunk.
      timer = setTimeout(() => {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(() => setLoad(true), { timeout: 2000 });
        else setLoad(true);
      }, performanceBudget.sceneDelayMs);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => { window.removeEventListener("load", schedule); if (idle) window.cancelIdleCallback(idle); clearTimeout(timer); };
  }, [staticScene, active]);

  useEffect(() => {
    if (!staticScene && !failed) return;
    let frame = 0;
    const sync = () => {
      const next = sceneMotion.manual ? Math.round(sceneMotion.target * 143) + 1 : 0;
      if (next !== frame) { frame = next; setPosterFrame(next); }
    };
    sync();
    return subscribeScene(sync);
  }, [staticScene, failed]);

  const frame = String(posterFrame).padStart(3, "0");
  const poster = posterFrame ? `/scene/d/${frame}.avif` : "/scene/poster-d.webp";
  const mobilePoster = posterFrame ? `/scene/m/${frame}.avif` : "/scene/poster-m.webp";
  return <div ref={container} className="scene-asset" data-quality={level} data-rendered={ready && !failed && !staticScene}>
    <picture className="scene-poster" style={{ position: "absolute" }}>
      <source media="(max-width: 1023px)" srcSet={mobilePoster} />
      <Image src={poster} fill unoptimized sizes="(max-width: 1023px) 100vw, 50vw" alt="" loading="eager" fetchPriority="high" className="object-contain" />
    </picture>
    {load && !staticScene && !failed && <SceneBoundary onFailure={onFailure}><RoomCanvas active={active} onReady={onReady} onFailure={onFailure} /></SceneBoundary>}
  </div>;
}
