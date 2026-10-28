import { Container, SectionHead } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ClientLogos } from "@/components/ClientLogos";
import { Testimonials } from "@/components/Testimonials";
import { advantages, site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "О строительной компании",
  "GulDar Group — строительство, ремонт и обслуживание коммерческих объектов в Алматы с 2015 года. Направления работы, подход к проектам и реквизиты компании.",
  "/o-kompanii",
);

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
        title="Ремонтируем и обслуживаем с 2015 года"
        crumb={{ name: "О компании", path: "/o-kompanii" }}
        lead="Офисы, магазины и торговые площади в Алматы. Плюс металлоконструкции и поставка материалов."
      />
      <Container className="space-y-20 pb-8">
        <Reveal>
          <div className="panel-glass rounded-3xl p-6 sm:p-10">
            <p className="eyebrow">Среди клиентов</p>
            <div className="mt-5">
              <ClientLogos size="lg" />
            </div>
          </div>
        </Reveal>

        <Testimonials />

        <section>
          <Reveal>
            <SectionHead eyebrow="Как работаем" title="Договор, гарантия и один ответственный" />
          </Reveal>
          <div className="company-principles mt-10">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={(i % 2) * 70}>
                <div>
                  <h3 className="text-xl leading-tight font-bold">{a.title}</h3>
                  <p className="mt-2 leading-relaxed text-fg-2">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="rekvizity" className="scroll-mt-28">
          <Reveal>
            <SectionHead eyebrow="Реквизиты" title="Данные компании" />
          </Reveal>
          <Reveal>
            <dl className="company-requisites mt-8 divide-y divide-line">
              {requisites.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="text-sm text-fg-3">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>
      </Container>
    </>
  );
}
