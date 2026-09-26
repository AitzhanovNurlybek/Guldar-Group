import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { WhatsAppIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { PriceCalculator } from "@/components/PriceCalculator";
import { Reveal } from "@/components/Reveal";
import { ServiceCard } from "@/components/ServiceCard";
import { serviceGroups, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Услуги и цены",
  description: "Ремонт под ключ, отделка, электромонтаж, сантехника, техобслуживание и металлоконструкции в Алматы. Цены от 10 000 ₸.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Услуги и цены"
        title="От розетки до здания"
        lead="Цены — ориентир. Точную сумму зафиксируем в договоре после выезда."
      />
      <Container className="space-y-16 pb-8">
        <Reveal>
          <div className="panel-strong overflow-hidden rounded-3xl">
            <div className="hazard h-1.5" aria-hidden />
            <div className="p-6 sm:p-10">
              <h2 className="title">Калькулятор</h2>
              <p className="mt-3 text-lg text-fg-2">Вилка цен за пару кликов.</p>
              <div className="mt-8">
                <PriceCalculator />
              </div>
            </div>
          </div>
        </Reveal>

        {serviceGroups.map((g) => (
          <section key={g.title}>
            <Reveal className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
              <h2 className="text-2xl font-extrabold tracking-[-0.025em]">{g.title}</h2>
              <p className="text-fg-2">{g.lead}</p>
            </Reveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s, i) => (
                <Reveal key={s.slug} delay={(i % 3) * 70}>
                  <ServiceCard {...s} />
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        <Reveal>
          <div className="panel-strong flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-3xl p-6 sm:p-10">
            <div className="max-w-xl">
              <h2 className="title">Не нашли свою задачу?</h2>
              <p className="mt-3 text-lg text-fg-2">Опишите её в WhatsApp — ответим, сколько это стоит.</p>
            </div>
            <a
              href={waLink("Здравствуйте! У меня задача, которой нет в списке услуг:")}
              target="_blank"
              rel="noopener"
              className="btn btn-accent"
            >
              <WhatsAppIcon />
              Написать в WhatsApp
            </a>
          </div>
        </Reveal>
      </Container>
    </>
  );
}
