"use client";

import { useEffect, useState, type ReactNode } from "react";

export function MobileDisclosure({ id, sectionId, label, children }: {
  id: string;
  sectionId: string;
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const matches = (hash: string) => hash === `#${sectionId}` || hash === `#${id}`;
    const onHash = () => { if (matches(window.location.hash)) setOpen(true); };
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (anchor && matches(anchor.hash)) setOpen(true);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, [id, sectionId]);

  return <div id={id} className="mobile-disclosure" data-open={open}>
    <button id={`${id}-trigger`} type="button" className="mobile-disclosure-trigger" aria-controls={`${id}-content`} aria-expanded={open} onClick={() => setOpen(!open)}>
      <span>{label}</span><span className="disclosure-sign" aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    <div id={`${id}-content`} className="mobile-disclosure-content">{children}</div>
  </div>;
}
