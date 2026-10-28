"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icons";

const RoomOrbitCanvas = dynamic(() => import("./RoomOrbitCanvas"), { ssr: false });
export type RoomAction = { kind: "left" | "right" | "reset"; id: number };

class ViewerBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function RoomExplorer() {
  const enableButton = useRef<HTMLButtonElement>(null);
  const firstControl = useRef<HTMLButtonElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [action, setAction] = useState<RoomAction>({ kind: "reset", id: 0 });
  const command = (kind: RoomAction["kind"]) => setAction((previous) => ({ kind, id: previous.id + 1 }));
  const close = () => {
    setEnabled(false); setReady(false);
    requestAnimationFrame(() => enableButton.current?.focus({ preventScroll: true }));
  };
  useEffect(() => { if (enabled && ready) firstControl.current?.focus({ preventScroll: true }); }, [enabled, ready]);
  return <figure id="maket" className="scene-finale-window room-explorer scroll-mt-28" data-interactive={enabled}>
    <span className="finale-label">От чернового помещения до готового пространства</span>
    <div className="finale-image" aria-label="Макет готового коммерческого помещения">
      <Image src="/scene/d/144.avif" alt="3D-макет готового помещения: отделка, освещение и мебель" aria-hidden={ready && !failed} fill unoptimized sizes="(max-width: 1023px) 100vw, 50vw" className="object-contain" style={{ opacity: ready && !failed ? 0 : 1 }} />
      {enabled && !failed && <ViewerBoundary onFailure={() => { setFailed(true); close(); }}><RoomOrbitCanvas action={action} onReady={() => setReady(true)} onFailure={() => { setFailed(true); close(); }} /></ViewerBoundary>}
      {enabled && !ready && !failed && <p className="room-loading" role="status">Загружаем 3D-макет…</p>}
    </div>
    {enabled ? <div className="room-controls">
      <div className="room-rotation-buttons" role="group" aria-label="Управление поворотом макета">
        <button ref={firstControl} type="button" disabled={!ready} onClick={() => command("left")} aria-label="Повернуть макет влево">↶</button>
        <button type="button" disabled={!ready} onClick={() => command("reset")} className="room-reset">Исходный вид</button>
        <button type="button" disabled={!ready} onClick={() => command("right")} aria-label="Повернуть макет вправо">↷</button>
      </div>
      <button type="button" className="text-link" onClick={close}>Завершить просмотр<Icon name="close" className="size-4" /></button>
      <p>Вращайте мышью или пальцем. Кнопками тоже можно.</p>
    </div> : <div className="room-controls">
      <button ref={enableButton} type="button" className="btn btn-ghost room-enable" onClick={() => { setFailed(false); setEnabled(true); }}><Icon name="box" className="size-5" />Повернуть макет в 3D</button>
      <p>{failed ? "Не удалось открыть 3D. Можно попробовать ещё раз." : "Включите просмотр, чтобы рассмотреть помещение со всех сторон."}</p>
    </div>}
    <figcaption>Иллюстрация этапов ремонта · 3D-макет</figcaption>
  </figure>;
}
