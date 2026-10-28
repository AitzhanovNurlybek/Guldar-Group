"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { animationConfig } from "./scene/animation-config";
import { Icon, WhatsAppIcon } from "./Icons";
import { Logo, LogoMark } from "./Logo";
import { getScroll, subscribeScroll } from "./scene/scroll";
import { nav, site, waGreeting, waLink } from "@/lib/site";

const sectionAnchors = ["#home", "#uslugi", "#postavka", "#o-kompanii", "#obsudit"];

function NavList({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Основное меню">
      <ul className={mobile ? "divide-y divide-line" : "flex items-center gap-5 xl:gap-7"}>
        {nav.map((item, index) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={mobile
                  ? `flex items-center gap-5 py-5 text-xl font-semibold transition-colors ${active ? "text-fg underline decoration-1 underline-offset-8" : "text-fg-2 hover:text-fg"}`
                  : `relative flex h-[88px] items-center whitespace-nowrap text-[0.9375rem] font-semibold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-fg after:transition-transform ${active ? "text-fg after:scale-x-100" : "text-fg-2 hover:text-fg after:scale-x-0 hover:after:scale-x-100"}`}
              >
                {mobile && <span className="text-xs font-medium tabular-nums text-fg-3" aria-hidden>0{index + 1}</span>}
                {item.label}
                {mobile && <Icon name="arrowUpRight" className="ml-auto size-5" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [openedForPath, setOpenedForPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [railOpen, setRailOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLButtonElement>(null);
  const scrollMode = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = openedForPath === pathname;

  useEffect(() => {
    let previousY = window.scrollY;
    let directionOrigin = previousY;
    let direction = 0;
    const sync = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - previousY;
      const nextDirection = Math.sign(delta);
      if (nextDirection && nextDirection !== direction) { directionOrigin = previousY; direction = nextDirection; }
      if (window.innerWidth < 1024 || y < 96) setHeaderHidden(false);
      else if (Math.abs(y - directionOrigin) > 12) setHeaderHidden(direction > 0 && y > 180 && !headerRef.current?.contains(document.activeElement));
      const next = scrollMode.current ? y > 48 : y > 144;
      if (next !== scrollMode.current) {
        if (!next && (railRef.current?.contains(document.activeElement) || dockRef.current === document.activeElement)) document.getElementById("main-content")?.focus({ preventScroll: true });
        scrollMode.current = next;
        setScrolled(next);
        if (!next) setRailOpen(false);
      }
      headerRef.current?.setAttribute("data-scrolled", String(y > 24));
      if (pathname === "/") setActiveSection(getScroll().activeSection);
      previousY = y;
    };
    const unsubscribe = subscribeScroll(sync);
    return unsubscribe;
  }, [pathname]);

  useEffect(() => {
    if (!railOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!railRef.current?.contains(event.target as Node)) setRailOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRailOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [railOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.documentElement.style.overflow;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpenedForPath(null);
    };

    // A modal dialog provides native focus trapping and makes the page behind it inert.
    dialog.showModal();
    closeRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resetHeader = () => { if (!desktop.matches) setHeaderHidden(false); };
    desktop.addEventListener("change", resetHeader);
    return () => desktop.removeEventListener("change", resetHeader);
  }, []);

  const closeMenu = () => setOpenedForPath(null);

  return (
    <>
      <header ref={headerRef} data-hidden={headerHidden} inert={headerHidden} aria-hidden={headerHidden} className="scroll-header fixed inset-x-0 top-0 z-40" style={{ "--header-duration": `${animationConfig.headerDuration}s` } as CSSProperties}>
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between gap-5 px-5 sm:px-8 lg:h-[88px] lg:gap-7 xl:px-12">
          <Link href="/" prefetch={false} aria-label="GulDar Group — на главную" className="shrink-0" onClick={closeMenu}>
            <Logo />
          </Link>

          <div className="hidden lg:block">
            <NavList />
          </div>

          <div className="hidden items-center gap-6 lg:flex">
            <a href={`tel:${site.technicalTel}`} className="hidden whitespace-nowrap text-sm font-extrabold text-fg transition-colors hover:text-signal xl:block">
              <span className="mb-1 block text-xs font-semibold text-fg-2">Технический специалист</span>
              {site.technicalPhone}
            </a>
            <a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm shrink-0">
              <WhatsAppIcon className="size-4" />
              Обсудить проект
            </a>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <a href={`tel:${site.technicalTel}`} aria-label={`Технический специалист: ${site.technicalPhone}`} className="grid size-11 place-items-center text-fg transition-colors hover:text-signal">
              <Icon name="phone" className="size-5" />
            </a>
            <button
              type="button"
              onClick={() => setOpenedForPath(pathname)}
              aria-label="Открыть меню"
              aria-haspopup="dialog"
              aria-controls="mobile-navigation"
              aria-expanded={open}
              className="mobile-menu-trigger flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong px-3 text-sm font-bold text-fg transition-colors hover:border-safety hover:text-signal"
            >
              <Icon name="menu" className="size-5" /><span>Меню</span>
            </button>
          </div>
        </div>
      </header>

      <aside ref={railRef} data-visible={scrolled} data-expanded={railOpen} inert={!scrolled} aria-hidden={!scrolled} aria-label="Боковая навигация" className="scroll-rail">
        <div className="rail-content rail-motion">
          <Link href="/" prefetch={false} className="rail-link rail-brand" aria-label="GulDar Group — на главную" onClick={() => setRailOpen(false)}>
            <span className="rail-icon"><LogoMark className="size-9" /></span>
            <span className="rail-label font-extrabold">GulDar Group</span>
          </Link>
          <button type="button" className="rail-link rail-toggle" aria-expanded={railOpen} aria-controls="rail-navigation" aria-label={railOpen ? "Свернуть боковое меню" : "Развернуть боковое меню"} onClick={() => setRailOpen(!railOpen)}>
            <span className="rail-icon"><Icon name={railOpen ? "sidebarClose" : "sidebarOpen"} /></span>
            <span className="rail-label">Свернуть меню</span>
          </button>
          <nav id="rail-navigation" aria-label="Основное меню при прокрутке" className="rail-navigation" style={{ "--active-item": pathname === "/" ? activeSection : Math.max(0, nav.findIndex((item) => item.href !== "/" && pathname.startsWith(item.href))) } as CSSProperties}>
            <span className="rail-active-indicator" aria-hidden="true" />
            {nav.map((item, index) => {
              const active = pathname === "/" ? activeSection === index : item.href !== "/" && pathname.startsWith(item.href);
              return <Link key={item.href} href={pathname === "/" ? sectionAnchors[index] : item.href} className="rail-link" aria-label={item.label} aria-current={active ? pathname === "/" ? "location" : "page" : undefined} title={!railOpen ? item.label : undefined} onClick={() => setRailOpen(false)}>
                <span className="rail-icon"><Icon name={item.icon} /></span>
                <span className="rail-label">{item.label}</span>
              </Link>;
            })}
          </nav>
          <a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" className="rail-link rail-contact" aria-label="Обсудить проект в WhatsApp" title={!railOpen ? "Написать в WhatsApp" : undefined}>
            <span className="rail-icon"><WhatsAppIcon /></span>
            <span className="rail-label">Обсудить проект</span>
          </a>
          <a href="#main-content" className="rail-link" aria-label="Наверх страницы" title={!railOpen ? "Наверх страницы" : undefined} onClick={() => setRailOpen(false)}>
            <span className="rail-icon"><Icon name="arrow" className="size-5 -rotate-90" /></span>
            <span className="rail-label">Наверх страницы</span>
          </a>
        </div>
      </aside>

      <button ref={dockRef} type="button" className="scroll-menu-dock" data-visible={scrolled && headerHidden} inert={!scrolled || !headerHidden} aria-hidden={!scrolled || !headerHidden} aria-label="Открыть меню" aria-haspopup="dialog" aria-controls="mobile-navigation" aria-expanded={open} onClick={() => setOpenedForPath(pathname)}>
        <Icon name="menu" className="size-5" />
        <span>Меню</span>
      </button>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-label="Меню сайта"
        onCancel={closeMenu}
        onClose={closeMenu}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeMenu();
        }}
        className="mobile-navigation fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(100%,26rem)] max-w-none overflow-y-auto overscroll-contain border-0 bg-ink-950 p-0 text-fg shadow-[-20px_0_80px_rgb(20_36_50/0.15)] backdrop:bg-[#102330]/90 lg:hidden"
      >
        <div className="flex min-h-full flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="flex h-[88px] shrink-0 items-center justify-between gap-4 border-b border-line">
            <Link href="/" prefetch={false} aria-label="GulDar Group — на главную" onClick={closeMenu}>
              <Logo />
            </Link>
            <button ref={closeRef} type="button" onClick={closeMenu} aria-label="Закрыть меню" className="grid size-11 place-items-center rounded-md border border-line text-fg transition-colors hover:text-signal">
              <Icon name="close" className="size-5" />
            </button>
          </div>

          <p className="mt-8 mb-3 text-sm font-semibold text-fg-2">Строительная компания · Алматы</p>
          <NavList mobile onNavigate={closeMenu} />

          <div className="mt-auto pt-10">
            <p className="text-lg font-bold">Начнём с вашего проекта.</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">Расскажите, что нужно построить или отремонтировать.</p>
            <a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="btn btn-accent mt-5 w-full">
              <WhatsAppIcon className="size-5" />
              Обсудить проект в WhatsApp
            </a>
            <a href={`tel:+${site.whatsapp}`} className="mt-6 flex items-center gap-3 text-lg font-bold hover:text-signal">
              <Icon name="phone" className="size-4" />
              {site.phone}
            </a>
            <p className="mt-2 text-xs text-fg-3">{site.hours}</p>
            <a href={`tel:${site.technicalTel}`} className="mt-5 block py-2 text-base font-bold"><span className="mb-1 block text-xs font-medium text-fg-3">Технический специалист</span>{site.technicalPhone}</a>
          </div>
        </div>
      </dialog>
    </>
  );
}
