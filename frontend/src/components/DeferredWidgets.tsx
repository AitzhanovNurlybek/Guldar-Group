"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { waGreeting, waLink } from "@/lib/site";

const loaders = {
  calculator: () => import("./PriceCalculator").then((module) => module.PriceCalculator),
  whatsapp: () => import("./WhatsAppBuilder").then((module) => module.WhatsAppBuilder),
};

export function DeferredWidget({ kind }: { kind: keyof typeof loaders }) {
  const ref = useRef<HTMLDivElement>(null);
  const [Widget, setWidget] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      loaders[kind]().then((component) => {
        if (active) setWidget(() => component);
      }).catch(() => { if (active) setFailed(true); });
    };
    if (!("IntersectionObserver" in window)) {
      load();
      return () => { active = false; };
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      load();
    }, { rootMargin: "400px" });
    if (ref.current) observer.observe(ref.current);
    return () => { active = false; observer.disconnect(); };
  }, [kind, attempt]);

  return <div ref={ref} className={`deferred-widget deferred-${kind}`} aria-busy={!Widget && !failed}>
    {Widget ? <Widget /> : failed ? <div role="alert" className="space-y-4 py-6">
      <p>Не удалось загрузить {kind === "calculator" ? "калькулятор" : "форму"}.</p>
      <button type="button" className="btn btn-primary" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Попробовать ещё раз</button>
      <a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" className="text-link">Написать в WhatsApp</a>
    </div> : <div className="widget-skeleton" role="status">
      <p className="text-sm text-fg-2">{kind === "calculator" ? "Загружаем калькулятор…" : "Загружаем форму…"}</p><span /><span /><span />
    </div>}
  </div>;
}
