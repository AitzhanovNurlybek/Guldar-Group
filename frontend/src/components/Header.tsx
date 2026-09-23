import Link from "next/link";
import { nav, site } from "@/lib/site";
import { Container } from "./Container";

export function Header() {
  return (
    <header className="border-b border-line bg-background">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {site.name}
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent">
              {item.label}
            </Link>
          ))}
        </nav>
        <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`} className="text-sm font-semibold">
          {site.phone}
        </a>
      </Container>
    </header>
  );
}
