import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Icon, WhatsAppIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { IconTile } from "@/components/ServiceCard";
import { productGroups, site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Поставка материалов",
  description: "Электротехническая продукция, строительные материалы, инструменты и запорная арматура в Алматы.",
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Поставка"
        title="Материалы для объекта"
        lead="Пришлите список — посчитаем цену и сроки."
      />
      <Container className="space-y-10 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {productGroups.map((p, i) => (
            <Reveal key={p.title} delay={(i % 2) * 70}>
              <article className="panel lift flex h-full flex-col rounded-2xl p-6 sm:p-8">
                <IconTile name={p.icon} />
                <h2 className="mt-5 text-xl leading-tight font-bold tracking-[-0.015em]">{p.title}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-fg-2">{p.text}</p>
                <a
                  href={waLink(`Здравствуйте! Нужен прайс: ${p.title.toLowerCase()}.`)}
                  target="_blank"
                  rel="noopener"
                  className="mt-6 inline-flex items-center gap-2 self-start text-sm font-medium text-safety hover:text-fg"
                >
                  <WhatsAppIcon className="size-4" />
                  Запросить прайс
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="panel-strong flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-3xl p-6 sm:p-10">
            <div className="max-w-xl">
              <h2 className="title">Есть список материалов?</h2>
              <p className="mt-3 text-lg text-fg-2">Фото или файл — прямо в WhatsApp.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={waLink("Здравствуйте! Хочу заказать материалы, пришлю список.")}
                target="_blank"
                rel="noopener"
                className="btn btn-accent"
              >
                <WhatsAppIcon />
                Отправить список
              </a>
              <a href={site.satu} target="_blank" rel="noopener" className="btn btn-ghost">
                Каталог на Satu.kz
                <Icon name="arrowUpRight" className="size-4" />
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </>
  );
}
