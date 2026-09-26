import Image from "next/image";
import Link from "next/link";
import { ClientLogos } from "@/components/ClientLogos";
import { Container, SectionHead } from "@/components/Container";
import { Icon, WhatsAppIcon, type IconName } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { PriceCalculator } from "@/components/PriceCalculator";
import { IconTile, ServiceCard } from "@/components/ServiceCard";
import { WhatsAppBuilder } from "@/components/WhatsAppBuilder";
import { featuredServices, productGroups, projects, services, site, steps, waGreeting, waLink } from "@/lib/site";

const perks = ["Договор и гарантия", "Материалы от нас", `${services.length} видов работ`];

const ktoRoles: { icon: IconName; label: string }[] = [
  { icon: "bolt", label: "Электрик" },
  { icon: "drop", label: "Сантехник" },
  { icon: "hammer", label: "Мастер" },
];

export default function Home() {
  return (
    <>
      {/* ── Первый экран: текст слева, макет помещения на фоне справа ── */}
      <section className="relative">
        <Container className="grid lg:min-h-dvh lg:grid-cols-[1.05fr_1fr] lg:items-center">
          {/* На телефоне сверху место под макет */}
          <div aria-hidden className="h-[calc(40svh+4rem)] lg:hidden" />
          <div className="relative pb-10 lg:py-16">
            <p className="eyebrow">С {site.foundedYear} года · Алматы</p>
            <h1 className="display mt-5">
              Ремонт коммерческих помещений <span className="accent-text">под ключ</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-fg-2">
              Офисы, магазины, кафе и склады — одна бригада, один договор.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-1.5 rounded-full border border-line bg-ink-900/60 px-3 py-1.5 text-sm font-semibold text-fg-2">
                  <Icon name="check" className="size-4 text-safety" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={waLink(waGreeting)} target="_blank" rel="noopener" className="btn btn-accent">
                <WhatsAppIcon />
                Обсудить в WhatsApp
              </a>
              <a href="#kalkulyator" className="btn btn-ghost">
                Рассчитать цену
                <Icon name="arrow" className="size-4 rotate-90" />
              </a>
            </div>
            <div className="mt-10">
              <p className="mb-3 text-sm text-fg-3">Работали с:</p>
              <ClientLogos />
            </div>
            <p className="mt-10 hidden items-center gap-2 text-sm font-semibold text-fg-3 lg:flex">
              <Icon name="arrow" className="size-4 rotate-90 text-safety" />
              Листайте — ремонт идёт
            </p>
          </div>
        </Container>
      </section>

      {/* ── Услуги ── */}
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead eyebrow="Услуги" title="Что делаем" />
            <Link href="/uslugi" className="btn btn-ghost">
              Все услуги и цены
              <Icon name="arrow" className="size-4" />
            </Link>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 3) * 70}>
                <ServiceCard {...s} compact />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Калькулятор ── */}
      <section id="kalkulyator" className="scroll-mt-24 pb-16 sm:pb-24">
        <Container>
          <Reveal>
            <div className="panel-strong overflow-hidden rounded-3xl">
              <div className="hazard h-1.5" aria-hidden />
              <div className="p-6 sm:p-10">
                <SectionHead eyebrow="Калькулятор" title="Сколько стоит ремонт" lead="Выберите работы и площадь — покажем вилку цен." />
                <div className="mt-8">
                  <PriceCalculator />
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Техобслуживание ── */}
      <section className="py-8">
        <Container>
          <Reveal>
            <div className="panel-strong overflow-hidden rounded-3xl">
              <div className="hazard h-1.5" aria-hidden />
              <div className="grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2">
                <div>
                  <p className="eyebrow">Для сетей и офисов</p>
                  <h2 className="title mt-3">Техобслуживание по договору</h2>
                  <p className="mt-3 text-lg text-fg-2">Электрик, сантехник и мастер — без своего штата.</p>
                  <a
                    href={waLink("Здравствуйте! Интересует техническое обслуживание помещений. Можно обсудить условия?")}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-accent mt-7"
                  >
                    <WhatsAppIcon />
                    Обсудить обслуживание
                  </a>
                </div>
                {/* Три специалиста → один договор */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {ktoRoles.map((r) => (
                      <div key={r.label} className="flex items-center gap-2.5 rounded-2xl border border-line bg-ink-950/60 py-2 pr-4 pl-2">
                        <IconTile name={r.icon} size="sm" />
                        <span className="font-bold">{r.label}</span>
                      </div>
                    ))}
                  </div>
                  <Icon name="arrow" className="size-7 rotate-90 text-safety" />
                  <div className="rounded-2xl border-2 border-safety bg-safety/10 px-10 py-5 text-center">
                    <p className="text-5xl font-extrabold tracking-[-0.04em] text-safety">1</p>
                    <p className="mt-1 font-bold">договор</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Как работаем ── */}
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal>
            <SectionHead eyebrow="Как работаем" title="Четыре шага" />
          </Reveal>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 70} className="panel flex items-center gap-4 rounded-2xl p-5">
                <span className="relative">
                  <IconTile name={s.icon} />
                  <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-safety text-xs font-extrabold text-[#1a0e02]">
                    {i + 1}
                  </span>
                </span>
                <span className="font-bold leading-snug">{s.title}</span>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── Объекты (появится, когда будут фото) ── */}
      {projects.length > 0 && (
        <section className="pb-16 sm:pb-24">
          <Container>
            <Reveal>
              <SectionHead eyebrow="Объекты" title="Что мы уже сделали" />
            </Reveal>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <Reveal key={p.image} delay={(i % 3) * 70}>
                  <figure className="panel overflow-hidden rounded-2xl">
                    <div className="relative aspect-[4/3]">
                      <Image src={p.image} alt={p.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                    </div>
                    <figcaption className="p-5">
                      <p className="font-bold">{p.title}</p>
                      <p className="mt-1 text-sm text-fg-2">{p.place}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── Поставка ── */}
      <section className="pb-16 sm:pb-24">
        <Container>
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead eyebrow="Поставка" title="Материалы — тоже от нас" />
            <Link href="/produkciya" className="btn btn-ghost">
              Подробнее
              <Icon name="arrow" className="size-4" />
            </Link>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {productGroups.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className="panel flex h-full items-center gap-4 rounded-2xl p-4">
                  <IconTile name={p.icon} size="sm" />
                  <span className="font-bold leading-snug">{p.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Результат: на этом блоке ремонт в макете заканчивается, макет виден полностью ── */}
      <section data-scene-finale className="relative">
        <Container className="flex min-h-[80svh] items-end pb-10 lg:min-h-[92dvh] lg:items-center lg:pb-0">
          <Reveal className="max-w-sm">
            <p className="eyebrow">Результат</p>
            <h2 className="title mt-3">Ремонт закончен — можно открываться</h2>
            <p className="mt-3 text-lg text-fg-2">Свет, плитка, витрина и вывеска — по одному договору.</p>
            <a href="#obsudit" className="btn btn-accent mt-7">
              Хочу так же
              <Icon name="arrow" className="size-4 rotate-90" />
            </a>
          </Reveal>
        </Container>
      </section>

      {/* ── Давайте обсудим ── */}
      <section id="obsudit" className="scroll-mt-24 py-8">
        <Container>
          <Reveal>
            <div className="panel-strong overflow-hidden rounded-3xl">
              <div className="hazard h-1.5" aria-hidden />
              <div className="p-6 sm:p-10">
                <SectionHead eyebrow="Давайте обсудим" title="Расскажите об объекте" lead="Отметьте пару вариантов — сообщение соберётся само." />
                <div className="mt-8">
                  <WhatsAppBuilder />
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
