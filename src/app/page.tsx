import Link from "next/link";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { productGroups, services, site } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* Hero — TODO: фото объекта и оффер */}
      <section className="bg-muted py-20">
        <Container>
          <h1 className="max-w-3xl text-4xl font-bold sm:text-5xl">{site.tagline}</h1>
          <p className="mt-4 max-w-2xl text-subtle">
            Работаем с {site.foundedYear} года. TODO: главное преимущество одной фразой.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kontakty" className="rounded bg-accent px-5 py-3 font-semibold text-white hover:opacity-90">
              Оставить заявку
            </Link>
            <Link href="/uslugi" className="rounded border border-line px-5 py-3 font-semibold hover:border-accent">
              Услуги
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="text-2xl font-bold">Услуги</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Card key={s.slug} title={s.title} text={s.text} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-muted py-16">
        <Container>
          <h2 className="text-2xl font-bold">Поставка материалов</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productGroups.map((p) => (
              <Card key={p.title} title={p.title} text={p.text} />
            ))}
          </div>
        </Container>
      </section>

      {/* TODO: блок «Объекты / портфолио» */}
      {/* TODO: блок «Клиенты и отзывы» */}

      <section className="py-16">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <h2 className="text-2xl font-bold">Нужна оценка объекта?</h2>
          <Link href="/kontakty" className="rounded bg-accent px-5 py-3 font-semibold text-white hover:opacity-90">
            Связаться
          </Link>
        </Container>
      </section>
    </>
  );
}
