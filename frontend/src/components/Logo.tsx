import { site } from "@/lib/site";

// Знак перерисован с логотипа компании (оригинал 60×84 px — для сайта мал).
// TODO: запросить у заказчика вектор (SVG/AI/PDF) и заменить.
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="gd-facet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#58aee8" />
          <stop offset="1" stopColor="#1f64a0" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#9fd1f4" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M2 41h5M41 41h5" />
        <path d="M7 41V29l8-4.5" />
        <path d="M41 41V29l-8-4.5" />
        <path d="M15 41V12l8 5v24" />
        <path d="M25 41V16.5L33 6v35" />
      </g>
      <path d="M18 41V24l5 3.2V41z" fill="url(#gd-facet)" />
      <path d="M28.5 41V30l4.5-3.8V41z" fill="url(#gd-facet)" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-10 shrink-0" />
      <span className="leading-none">
        <span className="block text-[1.05rem] font-bold tracking-[-0.02em] text-fg">
          GULDAR <span className="font-medium text-ice-300">Group</span>
        </span>
        {!compact && (
          <span className="mt-1 block text-[0.5rem] font-semibold tracking-[0.1em] whitespace-nowrap text-signal/90 uppercase">
            {site.motto}
          </span>
        )}
      </span>
    </span>
  );
}
