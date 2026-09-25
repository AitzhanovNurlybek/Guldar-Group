"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, WhatsAppIcon } from "./Icons";
import { Logo, LogoMark } from "./Logo";
import { nav, site, waGreeting, waLink } from "@/lib/site";

const ROW = 44; // высота строки, px
const GAP = 4;

function activeIndex(pathname: string) {
  return nav.findIndex((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));
}

// Подпись пункта: в свёрнутом виде прячется, строка при этом не перестраивается
function Label({ hidden, children }: { hidden: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`whitespace-nowrap transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100 delay-100"}`}
    >
      {children}
    </span>
  );
}

function NavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const idx = activeIndex(pathname);
  return (
    <nav aria-label="Основное меню" className="relative">
      {/* Отметка активного пункта переезжает, а не мигает */}
      <span
        aria-hidden
        className="absolute top-0 left-0 rounded-xl bg-white/[0.06] transition-[transform,opacity,width] duration-500 ease-(--ease-fluid) before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-safety"
        style={{
          height: ROW,
          width: collapsed ? ROW : "100%",
          transform: `translateY(${Math.max(idx, 0) * (ROW + GAP)}px)`,
          opacity: idx < 0 ? 0 : 1,
        }}
      />
      <ul className="relative flex flex-col" style={{ gap: GAP }}>
        {nav.map((item, i) => {
          const active = i === idx;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex items-center rounded-xl pr-3 text-[0.95rem] font-semibold transition-colors duration-200 active:scale-[0.98] ${
                  active ? "text-fg" : "text-fg-2 hover:text-fg"
                }`}
                style={{ height: ROW }}
              >
                <span className="grid size-11 shrink-0 place-items-center">
                  <Icon name={item.icon} className={`size-[1.15rem] ${active ? "text-safety" : ""}`} />
                </span>
                <Label hidden={collapsed}>{item.label}</Label>
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
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-850">
      <div className="hazard h-1.5" aria-hidden />
      <div className="p-4">
        <p className="text-base font-bold tracking-[-0.01em]">Обсудим объект?</p>
        <p className="mt-1 text-xs leading-relaxed text-fg-2">Ответим в WhatsApp.</p>
        <a href={waLink(waGreeting)} target="_blank" rel="noopener" className="btn btn-accent mt-3 h-11 w-full text-sm">
          <WhatsAppIcon className="size-4" />
          Написать
        </a>
        <a href={`tel:+${site.whatsapp}`} className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-fg-2 hover:text-fg">
          <Icon name="phone" className="size-3.5" />
          {site.phone}
        </a>
      </div>
    </div>
  );
}

// Десктоп: узкая панель с иконками, раскрывается по кнопке поверх контента
function Rail() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const collapsed = !open;

  return (
    <aside
      ref={ref}
      className={`bar fixed inset-y-4 left-4 z-40 hidden flex-col overflow-clip rounded-2xl p-4 transition-[width,box-shadow] duration-500 ease-(--ease-fluid) lg:flex ${
        open ? "w-64 bg-ink-900 shadow-[0_30px_90px_-20px_rgb(0_0_0/0.9)]" : "w-[76px]"
      }`}
    >
      {/* Внутренняя ширина фиксирована — при раскрытии контент не перестраивается, а открывается */}
      <div className="flex h-full w-56 flex-col">
        <Link href="/" aria-label="На главную" className="flex items-center" onClick={() => setOpen(false)}>
          <span className="grid size-11 shrink-0 place-items-center">
            <LogoMark className="size-9" />
          </span>
          <span className={`transition-opacity duration-300 ${collapsed ? "opacity-0" : "opacity-100 delay-100"}`}>
            <Logo wordmarkOnly />
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Свернуть меню" : "Развернуть меню"}
          title={open ? "Свернуть меню" : "Развернуть меню"}
          className="mt-4 mb-2 flex items-center overflow-hidden rounded-xl text-sm font-semibold text-fg-2 transition-[color,background-color,width] duration-500 ease-(--ease-fluid) hover:bg-white/[0.05] hover:text-fg active:scale-[0.98]"
          style={{ height: ROW, width: collapsed ? ROW : "100%" }}
        >
          <span className="grid size-11 shrink-0 place-items-center">
            <Icon name={open ? "sidebarClose" : "sidebarOpen"} className="size-[1.2rem]" />
          </span>
          <Label hidden={collapsed}>Свернуть</Label>
        </button>

        <div className={`mb-3 h-px bg-line transition-[width] duration-500 ease-(--ease-fluid) ${collapsed ? "w-11" : "w-full"}`} aria-hidden />
        <NavList collapsed={collapsed} onNavigate={() => setOpen(false)} />

        <div className="mt-auto flex flex-col gap-1">
          <a
            href={waLink(waGreeting)}
            target="_blank"
            rel="noopener"
            title={collapsed ? "Написать в WhatsApp" : undefined}
            className="flex items-center rounded-xl text-sm font-bold text-fg"
            style={{ height: ROW }}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safety text-[#1a0e02] shadow-[0_10px_24px_-10px_rgb(245_135_31/0.8)] transition-transform active:scale-95">
              <WhatsAppIcon className="size-5" />
            </span>
            <span className="pl-3">
              <Label hidden={collapsed}>Написать в WhatsApp</Label>
            </span>
          </a>
          <a
            href={`tel:+${site.whatsapp}`}
            title={collapsed ? site.phone : undefined}
            className="flex items-center rounded-xl text-sm font-semibold text-fg-2 hover:text-fg"
            style={{ height: ROW }}
          >
            <span className="grid size-11 shrink-0 place-items-center">
              <Icon name="phone" className="size-[1.1rem]" />
            </span>
            <Label hidden={collapsed}>{site.phone}</Label>
          </a>
          {open && <p className="px-3 pt-2 text-[0.7rem] leading-relaxed text-fg-3">{site.hours}</p>}
        </div>
      </div>
    </aside>
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
      <Rail />

      {/* Мобильная верхняя панель */}
      <header className="bar fixed inset-x-3 top-3 z-40 flex h-14 items-center justify-between rounded-2xl pr-2 pl-3 lg:hidden">
        <Link href="/" aria-label="На главную">
          <Logo compact />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-xl text-fg transition-transform active:scale-95"
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
        className={`bar fixed inset-y-3 left-3 z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col rounded-2xl p-4 transition-transform duration-500 ease-(--ease-fluid) lg:hidden ${
          open ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"
        }`}
      >
        <div className="flex items-center justify-between px-1 pt-1 pb-6">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            className="grid size-10 place-items-center rounded-xl text-fg-2 transition-transform active:scale-95"
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

// Плавающая кнопка WhatsApp — только на телефоне, на десктопе её роль у панели слева.
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
