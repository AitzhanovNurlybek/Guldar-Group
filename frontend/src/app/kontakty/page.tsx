import { Container } from "@/components/Container";
import { Icon, WhatsAppIcon, type IconName } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { WhatsAppBuilder } from "@/components/WhatsAppBuilder";
import { site, waGreeting, waLink } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Контакты строительной компании в Алматы",
  `Обсудите строительство или ремонт с GulDar Group: ${site.phone}. Офис: ${site.address}. Телефон, WhatsApp, почта и адрес на карте.`,
  "/kontakty",
);

const channels: { icon: IconName | "wa"; label: string; value: string; href: string; external?: boolean }[] = [
  { icon: "wa", label: "WhatsApp", value: "Быстрее всего", href: waLink(waGreeting), external: true },
  { icon: "phone", label: "Телефон", value: site.phone, href: `tel:+${site.whatsapp}` },
  { icon: "mail", label: "Почта", value: site.email, href: `mailto:${site.email}` },
  { icon: "pin", label: "Офис", value: site.address, href: site.gis, external: true },
];

export default function ContactsPage() {
  return (
    <>
      <PageHeader eyebrow="Контакты" title="Давайте обсудим" lead={site.hours} />
      <Container className="space-y-6 pb-8">
        <div className="contact-channels grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={i * 60}>
              <a
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener" } : {})}
                className="panel lift flex h-full flex-col rounded-2xl p-6"
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl ${
                    c.icon === "wa" ? "bg-[#e1f0e9] text-[#147854]" : "bg-steel-600/40 text-ice-300"
                  }`}
                >
                  {c.icon === "wa" ? <WhatsAppIcon /> : <Icon name={c.icon} />}
                </span>
                <span className="mt-5 text-sm font-semibold text-fg-2">{c.label}</span>
                <span className="mt-1 font-semibold leading-snug">{c.value}</span>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="technical-contact-panel">
          <div><p className="eyebrow">Вопросы по объекту и работам</p><h2>Технический специалист</h2><p>Обсудите состояние помещения, проектирование и состав ремонта.</p></div>
          <a href={`tel:${site.technicalTel}`} className="btn btn-primary"><Icon name="phone" className="size-5" />{site.technicalPhone}</a>
        </div>

        <Reveal>
          <div className="panel-strong overflow-hidden rounded-3xl p-6 sm:p-10">
            <h2 className="title">Расскажите об объекте</h2>
            <p className="mt-3 max-w-xl text-lg text-fg-2">Выберите только известные детали. Готовое сообщение можно отправить в WhatsApp.</p>
            <div className="mt-8">
              <WhatsAppBuilder />
            </div>
          </div>
        </Reveal>

        <Reveal>
          <a
            href={site.gis}
            target="_blank"
            rel="noopener"
            className="panel lift flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6"
          >
            <span>
              <span className="block text-lg font-bold">Открыть в 2GIS</span>
              <span className="mt-1 block text-sm text-fg-2">{site.address}</span>
            </span>
            <Icon name="arrowUpRight" className="size-5 text-safety" />
          </a>
        </Reveal>
      </Container>
    </>
  );
}
