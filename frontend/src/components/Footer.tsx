import Link from "next/link";
import { nav, site } from "@/lib/site";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-muted py-10 text-sm">
      <Container className="grid gap-8 sm:grid-cols-3">
        <div>
          <p className="font-bold">{site.name}</p>
          <p className="mt-2 text-subtle">{site.tagline}</p>
        </div>
        <ul className="space-y-2">
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-accent">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="space-y-1 text-subtle">
          <p>{site.address}</p>
          <p>{site.phone}</p>
          <p>{site.email}</p>
          <p>{site.hours}</p>
        </div>
      </Container>
      <Container className="mt-8 text-xs text-subtle">
        © {site.foundedYear}–{new Date().getFullYear()} {site.legalName}
      </Container>
    </footer>
  );
}
