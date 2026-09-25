import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Icon, WhatsAppIcon, type IconName } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { WhatsAppBuilder } from "@/components/WhatsAppBuilder";
import { site, waGreeting, waLink } from "@/lib/site";

export const metadata: Metadata = { title: "Контакты" };

const channels: { icon: IconName | "wa"; label: string; value: string; href: string; external?: boolean }[] = [
  { icon: "wa", label: "WhatsApp", value: "Быстрее всего", href: waLink(waGreeting), external: true },
  { icon: "phone", label: "Телефон", value: site.phone, href: `tel:+${site.whatsapp}` },
  { icon: "mail", label: "Почта", value: site.email, href: `mailto:${site.email}` },
  { icon: "pin", label: "Офис", value: site.address, href: site.gis, external: true },
];

export default function ContactsPage() {
  return (
    <>
      <PageHeader eyebrow="Контакты" title="Давайте обсудим" lead={`${site.hours}. Отвечаем в WhatsApp, по телефону и почте.`} />
      <Container className="space-y-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={i * 60}>
              <a
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener" } : {})}
                className="panel lift flex h-full flex-col rounded-lg p-6"
              >
                <span
                  className={`grid size-11 place-items-center rounded-md ${
                    c.icon === "wa" ? "bg-[#25d366]/15 text-[#25d366]" : "bg-steel-600/40 text-ice-300"
                  }`}
                >
                  {c.icon === "wa" ? <WhatsAppIcon /> : <Icon name={c.icon} />}
                </span>
                <span className="mt-5 font-display text-sm tracking-[0.1em] text-fg-3 uppercase">{c.label}</span>
                <span className="mt-1 font-semibold leading-snug">{c.value}</span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="panel-strong overflow-hidden rounded-xl border-t-4 border-t-safety p-6 sm:p-10">
            <h2 className="title">Расскажите об объекте</h2>
            <p className="mt-3 max-w-xl text-lg text-fg-2">Отметьте пару вариантов — сообщение соберётся само.</p>
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
            className="panel lift flex flex-wrap items-center justify-between gap-4 rounded-lg p-6"
          >
            <span>
              <span className="block text-lg font-medium font-display tracking-[0.03em] uppercase">Открыть в 2GIS</span>
              <span className="mt-1 block text-sm text-fg-2">{site.address}</span>
            </span>
            <Icon name="arrowUpRight" className="size-5 text-safety" />
          </a>
        </Reveal>
      </Container>
    </>
  );
}
