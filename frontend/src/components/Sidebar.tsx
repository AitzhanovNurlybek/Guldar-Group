"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, WhatsAppIcon } from "./Icons";
import { Logo } from "./Logo";
import { nav, site, waGreeting, waLink } from "@/lib/site";

const ITEM = 46; // высота пункта, px
const GAP = 2;

function activeIndex(pathname: string) {
  return nav.findIndex((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const idx = activeIndex(pathname);
  return (
    <nav aria-label="Основное меню" className="relative">
      {/* Отметка активного пункта переезжает, а не мигает */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 rounded-md bg-white/[0.05] transition-[transform,opacity] duration-500 ease-(--ease-fluid) before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:bg-safety"
        style={{ height: ITEM, transform: `translateY(${Math.max(idx, 0) * (ITEM + GAP)}px)`, opacity: idx < 0 ? 0 : 1 }}
      />
      <ul className="relative flex flex-col" style={{ gap: GAP }}>
        {nav.map((item, i) => {
          const active = i === idx;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-4 font-display text-[0.98rem] font-medium tracking-[0.06em] uppercase transition-colors duration-200 active:scale-[0.98] ${
                  active ? "text-fg" : "text-fg-2 hover:text-fg"
                }`}
                style={{ height: ITEM }}
              >
                <Icon name={item.icon} className={`size-[1.1rem] ${active ? "text-safety" : ""}`} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ContactCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-ink-850">
      <div className="hazard h-1.5" aria-hidden />
      <div className="p-4">
        <p className="font-display text-lg font-medium tracking-[0.02em] uppercase">Обсудим объект?</p>
        <p className="mt-1 text-xs leading-relaxed text-fg-2">Пришлите адрес и пару фото — ответим в WhatsApp.</p>
        <a href={waLink(waGreeting)} target="_blank" rel="noopener" className="btn btn-accent mt-3 h-11 w-full text-[0.9rem]">
          <WhatsAppIcon className="size-4" />
          Написать
        </a>
        <a
          href={`tel:+${site.whatsapp}`}
          className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-fg-2 hover:text-fg"
        >
          <Icon name="phone" className="size-3.5" />
          {site.phone}
        </a>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Десктоп: плавающая панель слева */}
      <aside className="bar fixed inset-y-4 left-4 z-40 hidden w-64 flex-col rounded-xl p-4 lg:flex">
        <Link href="/" className="px-2 pt-1 pb-7" aria-label="На главную">
          <Logo />
        </Link>
        <NavList />
        <div className="mt-auto space-y-4">
          <ContactCard />
          <p className="px-2 text-[0.7rem] leading-relaxed text-fg-3">
            {site.hours}
            <br />
            {site.address}
          </p>
        </div>
      </aside>

      {/* Мобильная верхняя панель */}
      <header className="bar fixed inset-x-3 top-3 z-40 flex h-14 items-center justify-between rounded-xl pr-2 pl-3 lg:hidden">
        <Link href="/" aria-label="На главную">
          <Logo compact />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-md text-fg transition-transform active:scale-95"
        >
          <Icon name="menu" className="size-6" />
        </button>
      </header>

      {/* Мобильное меню: выезжает слева и уходит туда же */}
      <div
        className={`fixed inset-0 z-50 bg-ink-950/70 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        inert={!open}
        aria-label="Меню"
        className={`bar fixed inset-y-3 left-3 z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col rounded-xl p-4 transition-transform duration-500 ease-(--ease-fluid) lg:hidden ${
          open ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"
        }`}
      >
        <div className="flex items-center justify-between px-2 pt-1 pb-6">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            className="grid size-10 place-items-center rounded-md text-fg-2 transition-transform active:scale-95"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <NavList onNavigate={() => setOpen(false)} />
        <div className="mt-auto">
          <ContactCard />
        </div>
      </aside>
    </>
  );
}

// Плавающая кнопка WhatsApp — только на телефоне, на десктопе её роль у сайдбара.
// Появляется после первого экрана, чтобы не дублировать кнопку в шапке страницы.
export function WhatsAppFab() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const sync = () => setShown(window.scrollY > window.innerHeight * 0.6);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <a
      href={waLink(waGreeting)}
      target="_blank"
      rel="noopener"
      tabIndex={shown ? undefined : -1}
      aria-hidden={!shown}
      className={`btn btn-accent fixed right-4 bottom-4 z-30 h-13 pr-5 pl-4 shadow-[0_18px_40px_-12px_rgb(245_135_31/0.7)] transition-[translate,opacity] duration-500 ease-(--ease-fluid) lg:hidden ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <WhatsAppIcon className="size-5" />
      Обсудить
    </a>
  );
}
