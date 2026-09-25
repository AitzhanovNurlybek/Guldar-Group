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
          <div className="glass rounded-[32px] p-6 sm:p-10">
            <p className="eyebrow">Среди клиентов</p>
            <ul className="mt-5 flex flex-wrap gap-x-10 gap-y-4 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              {clients.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </Reveal>

        <section>
          <Reveal>
            <SectionHead eyebrow="Как работаем" title="Договор, гарантия и один ответственный" />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={(i % 2) * 70}>
                <div className="h-full rounded-[26px] border border-line p-6">
                  <h3 className="text-lg font-semibold tracking-[-0.01em]">{a.title}</h3>
                  <p className="mt-2 leading-relaxed text-fg-2">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <SectionHead eyebrow="Реквизиты" title="Данные компании" />
          </Reveal>
          <Reveal>
            <dl className="glass mt-8 divide-y divide-line rounded-[28px] px-6">
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
