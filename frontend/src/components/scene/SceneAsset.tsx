"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
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

export function SceneAsset({ active }: { active: boolean }) {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterFrame, setPosterFrame] = useState(0);
  const level = useQuality();
  const staticScene = !quality[level].webgl;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);

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
    return subscribeScene(() => {
      if (!sceneMotion.manual) return;
      const next = Math.round(sceneMotion.target * 143) + 1;
      if (next !== frame) { frame = next; setPosterFrame(next); }
    });
  }, [staticScene, failed]);

  const poster = posterFrame ? `/scene/d/${String(posterFrame).padStart(3, "0")}.avif` : "/scene/poster-d.webp";
  return <div className="scene-asset" data-quality={level} data-rendered={ready && !failed && !staticScene}>
    <div className="scene-poster"><Image src={poster} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 80vw, 55vw" alt="" priority className="object-contain" /></div>
    {load && !staticScene && !failed && <SceneBoundary onFailure={onFailure}><RoomCanvas active={active} onReady={onReady} onFailure={onFailure} /></SceneBoundary>}
  </div>;
}
