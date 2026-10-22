"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useRef, useState } from "react";
import { getScroll, subscribeFrame } from "./scene/scroll";
const Calculator = dynamic(() => import("./PriceCalculator").then((module) => module.PriceCalculator), { ssr: false });
const Builder = dynamic(() => import("./WhatsAppBuilder").then((module) => module.WhatsAppBuilder), { ssr: false });
export function DeferredWidget({ kind }: { kind: "calculator" | "whatsapp" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let near = false, quiet = 0, previousY = getScroll().y;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { near = true; observer.disconnect(); } }, { rootMargin: "600px" });
    const stop = subscribeFrame((_, delta) => {
      const y = getScroll().y;
      quiet = y === previousY ? quiet + delta : 0; previousY = y;
      if (near && quiet > 0.2) { stop(); startTransition(() => setVisible(true)); }
    });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); stop(); };
  }, []);
  return <div ref={ref} className={`deferred-widget deferred-${kind}`} aria-busy={!visible}>{visible ? kind === "calculator" ? <Calculator /> : <Builder /> : <div className="widget-skeleton" aria-hidden="true"><span /><span /><span /></div>}</div>;
}
