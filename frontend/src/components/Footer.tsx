import Link from "next/link";
import { nav, site } from "@/lib/site";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="pt-10 pb-24 lg:pb-6">
      <Container>
        <div className="glass rounded-[28px] p-6 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-[1.3fr_1fr_1.2fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-2">{site.tagline}. Работаем по договору с {site.foundedYear} года.</p>
            </div>
            <ul className="space-y-2.5 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-fg-2 transition-colors hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-2.5 text-sm text-fg-2">
              <a href={`tel:+${site.whatsapp}`} className="block font-semibold text-fg hover:text-ice-300">
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="block hover:text-fg">
                {site.email}
              </a>
              <p>{site.address}</p>
              <p>{site.hours}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-xs text-fg-3">
            <p>
              © {site.foundedYear}–{new Date().getFullYear()} {site.legalName} · БИН {site.bin}
            </p>
            <p>Цены на сайте — ориентир, не публичная оферта</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
