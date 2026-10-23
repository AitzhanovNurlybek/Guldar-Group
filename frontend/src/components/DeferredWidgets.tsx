"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useRef, useState } from "react";
const Calculator = dynamic(() => import("./PriceCalculator").then((module) => module.PriceCalculator), { ssr: false });
const Builder = dynamic(() => import("./WhatsAppBuilder").then((module) => module.WhatsAppBuilder), { ssr: false });
export function DeferredWidget({ kind }: { kind: "calculator" | "whatsapp" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      startTransition(() => setVisible(true));
    }, { rootMargin: "400px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`deferred-widget deferred-${kind}`} aria-busy={!visible}>{visible ? kind === "calculator" ? <Calculator /> : <Builder /> : <div className="widget-skeleton" role="status"><p className="text-sm text-fg-2">{kind === "calculator" ? "Загружаем калькулятор…" : "Загружаем форму…"}</p><span /><span /><span /></div>}</div>;
}
