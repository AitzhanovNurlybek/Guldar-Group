import Link from "next/link";
import { nav, site } from "@/lib/site";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer pb-24 lg:pb-6">
      <Container>
        <div className="panel overflow-hidden rounded-3xl">
          <div className="hazard h-1.5" aria-hidden />
          <div className="px-0 py-4 sm:p-8">
            <div className="grid gap-8 sm:grid-cols-[1.3fr_1fr_1.2fr]">
              <div>
                <Logo />
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-2">Ремонт коммерческих помещений в Алматы с {site.foundedYear} года.</p>
              </div>
              <ul className="space-y-2.5 text-sm font-semibold">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-fg-2 transition-colors hover:text-safety">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col items-start gap-2.5 text-sm text-fg-2">
                <a href={`tel:+${site.whatsapp}`} className="font-display text-xl font-extrabold tracking-[-0.02em] text-fg hover:text-safety">
                  {site.phone}
                </a>
                <a href={`mailto:${site.email}`} className="hover:text-fg">
                  {site.email}
                </a>
                <a href={`tel:${site.technicalTel}`} className="technical-footer-link block py-2 font-bold text-fg"><span className="block text-xs font-medium text-fg-3">Технический специалист</span>{site.technicalPhone}</a>
                <p>{site.address}</p>
                <p>{site.hours}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-xs text-fg-3">
              <p>
                © {site.foundedYear}–{new Date().getFullYear()} {site.legalName} · БИН {site.bin}
              </p>
              <p>Цены — ориентир, не публичная оферта</p>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
