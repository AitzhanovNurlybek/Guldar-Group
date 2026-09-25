import type { Metadata } from "next";
import { Container, SectionHead } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { advantages, clients, site } from "@/lib/site";

export const metadata: Metadata = { title: "О компании" };

const requisites = [
  ["Название", site.legalName],
  ["БИН", site.bin],
  ["На рынке", `с ${site.foundedYear} года`],
  ["Адрес", site.address],
  ["Телефон", site.phone],
  ["Email", site.email],
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="О компании"
        title="Строим, ремонтируем и обслуживаем"
        lead={`${site.legalName} работает в Алматы с ${site.foundedYear} года. Ремонтируем офисы, магазины и торговые площади, обслуживаем здания, строим из металлоконструкций и поставляем материалы.`}
      />
      <Container className="space-y-20 pb-8">
        <Reveal>
          <div className="panel rounded-xl p-6 sm:p-10">
            <p className="eyebrow">Среди клиентов</p>
            <ul className="mt-5 flex flex-wrap gap-x-10 gap-y-4 text-3xl font-medium font-display tracking-[0.03em] uppercase sm:text-4xl">
              {clients.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </Reveal>

        <section>
          <Reveal>
            <SectionHead index="01" eyebrow="Как работаем" title="Договор, гарантия и один ответственный" />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={(i % 2) * 70}>
                <div className="panel h-full rounded-lg border-l-2 border-l-safety p-6">
                  <h3 className="text-xl leading-tight font-medium font-display tracking-[0.03em] uppercase">{a.title}</h3>
                  <p className="mt-2 leading-relaxed text-fg-2">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <SectionHead index="02" eyebrow="Реквизиты" title="Данные компании" />
          </Reveal>
          <Reveal>
            <dl className="panel mt-8 divide-y divide-line rounded-xl px-6">
              {requisites.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="text-sm text-fg-3">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>
      </Container>
    </>
  );
}
