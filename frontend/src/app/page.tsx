import Image from "next/image";
import Link from "next/link";
import { Container, SectionHead } from "@/components/Container";
import { Icon, WhatsAppIcon, type IconName } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { IconTile, ServiceCard } from "@/components/ServiceCard";
import { HeroScene } from "@/components/three/HeroScene";
import { WhatsAppBuilder } from "@/components/WhatsAppBuilder";
import {
  advantages,
  clients,
  featuredServices,
  productGroups,
  projects,
  services,
  site,
  steps,
  waGreeting,
  waLink,
} from "@/lib/site";

const facts = [
  { value: String(site.foundedYear), label: "год основания — работаем больше 10 лет" },
  { value: String(services.length), label: "видов работ: от розетки до здания" },
  { value: "от 10 000 ₸", label: "мелкий ремонт — приезжаем даже на одну задачу" },
  { value: "9:00–20:00", label: "принимаем заявки без выходных" },
];

const ktoRoles: { icon: IconName; label: string }[] = [
  { icon: "bolt", label: "Электрик" },
  { icon: "drop", label: "Сантехник" },
  { icon: "hammer", label: "Мастер" },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative pt-18 lg:pt-8">
        <Container className="grid items-center gap-2 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:gap-4">
          <div className="relative z-10 pb-6 lg:py-6">
            <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-fg-2">
              <span className="size-1.5 rounded-full bg-wa shadow-[0_0_10px_var(--wa)]" />
              ТОО · Алматы · с {site.foundedYear} года
            </p>
            <h1 className="display mt-6">
              Ремонт офисов и коммерческих помещений <span className="accent-text">под ключ</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-2">
              Электрика, сантехника, отделка и фасад — одна бригада и один договор. Сами поставляем материалы и даём
              гарантию на работы.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={waLink(waGreeting)} target="_blank" rel="noopener" className="btn btn-wa">
                <WhatsAppIcon />
                Обсудить в WhatsApp
              </a>
              <Link href="/uslugi" className="btn btn-ghost">
                Услуги и цены
                <Icon name="arrow" className="size-4" />
              </Link>
            </div>
            <div className="mt-10">
              <p className="text-xs font-medium tracking-wide text-fg-3 uppercase">Среди клиентов</p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[1.05rem] font-semibold tracking-[-0.01em] text-fg-2">
                {clients.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* На телефоне сцена идёт первой — это первое, что видит человек */}
          <div className="relative -mx-4 order-first h-[340px] sm:mx-0 sm:h-[460px] lg:order-none lg:h-[min(700px,calc(100dvh-5rem))]">
            <HeroScene />
            <p className="glass pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 text-xs text-fg-2">
              <Icon name="arrow" className="size-3.5 rotate-180" />
              Покрутите
              <Icon name="arrow" className="size-3.5" />
            </p>
          </div>
        </Container>
      </section>

      {/* ── Цифры ── */}
      <section className="py-8">
        <Container>
          <Reveal>
            <dl className="glass grid grid-cols-2 overflow-hidden rounded-[28px] lg:grid-cols-4">
              {facts.map((f) => (
                <div key={f.value} className="p-5 sm:p-7">
                  <dt className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{f.value}</dt>
                  <dd className="mt-2 text-sm leading-snug text-fg-2">{f.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>

      {/* ── Услуги ── */}
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal>
            <SectionHead
              eyebrow="Услуги"
              title="Одна бригада вместо пяти подрядчиков"
              lead="Берём объект целиком или закрываем одну задачу. Цены — ориентир: точную сумму фиксируем в договоре после выезда."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 3) * 70}>
                <ServiceCard {...s} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8">
            <Link href="/uslugi" className="btn btn-ghost">
              Все {services.length} услуг и цены
              <Icon name="arrow" className="size-4" />
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* ── Техобслуживание ── */}
      <section className="py-8">
        <Container>
          <Reveal>
            <div className="glass relative overflow-hidden rounded-[32px] p-6 sm:p-10 lg:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-sky-400/20 blur-3xl"
              />
              <div className="relative grid items-center gap-10 lg:grid-cols-2">
                <div>
                  <p className="eyebrow">Для сетей, офисов и ТЦ</p>
                  <h2 className="title mt-3">Техобслуживание без штата мастеров</h2>
                  <p className="mt-4 text-lg leading-relaxed text-fg-2">
                    Электрик, сантехник и мастер по ремонту — по одному договору. Не нужно держать людей в штате и
                    платить зарплату, пока ничего не сломалось.
                  </p>
                  <ul className="mt-6 space-y-3 text-[0.95rem]">
                    {[
                      "Электрика: освещение, розетки, щиты",
                      "Сантехника: водопровод, канализация, засоры",
                      "Мелкий ремонт: двери, плитка, потолки",
                      "Договор, счёт и акт — для бухгалтерии всё официально",
                    ].map((t) => (
                      <li key={t} className="flex gap-3">
                        <Icon name="check" className="mt-0.5 size-5 shrink-0 text-sky-400" />
                        <span className="text-fg-2">{t}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={waLink("Здравствуйте! Интересует техническое обслуживание помещений. Можно обсудить условия?")}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-primary mt-8"
                  >
                    <WhatsAppIcon />
                    Обсудить обслуживание
                  </a>
                </div>

                {/* Три специалиста → один договор */}
                <div className="flex flex-col items-center gap-5">
                  <div className="flex flex-wrap justify-center gap-3">
                    {ktoRoles.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center gap-2.5 rounded-2xl border border-line bg-ink-950/40 py-2.5 pr-4 pl-2.5"
                      >
                        <IconTile name={r.icon} />
                        <span className="font-medium">{r.label}</span>
                      </div>
                    ))}
                  </div>
                  <svg viewBox="0 0 24 40" className="h-12 text-ice-300/60" fill="none" stroke="currentColor" aria-hidden>
                    <path d="M12 2v34M5 29l7 8 7-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="rounded-[26px] border border-line-strong bg-gradient-to-br from-blue-500/40 to-steel-600/30 px-10 py-7 text-center shadow-[0_30px_60px_-30px_rgb(88_174_232/0.6)]">
                    <p className="text-5xl font-semibold tracking-[-0.04em]">1</p>
                    <p className="mt-1 text-fg-2">договор с {site.name}</p>
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
            <SectionHead eyebrow="Как работаем" title="От сообщения до сдачи объекта — пять шагов" />
          </Reveal>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 70} className="glass rounded-[26px] p-6">
                <span className="font-mono text-sm font-medium text-sky-400">0{i + 1}</span>
                <h3 className="mt-4 font-semibold tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── Условия ── */}
      <section className="py-8">
        <Container>
          <Reveal>
            <SectionHead eyebrow="Условия" title="Договор, гарантия и материалы от нас" />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={i * 70}>
                <div className="h-full rounded-[26px] border border-line p-6">
                  <h3 className="font-semibold tracking-[-0.01em]">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-2">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Объекты (появится, когда будут фото) ── */}
      {projects.length > 0 && (
        <section className="py-16 sm:py-24">
          <Container>
            <Reveal>
              <SectionHead eyebrow="Объекты" title="Что мы уже сделали" />
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <Reveal key={p.image} delay={(i % 3) * 70}>
                  <figure className="glass overflow-hidden rounded-[26px]">
                    <div className="relative aspect-[4/3]">
                      <Image src={p.image} alt={p.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                    </div>
                    <figcaption className="p-5">
                      <p className="font-semibold">{p.title}</p>
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
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHead
                eyebrow="Поставка"
                title="Материалы для объекта — тоже от нас"
                lead="Не ждём поставщиков и не перекладываем закупку на вас. Продаём и отдельно, без ремонта."
              />
              <Link href="/produkciya" className="btn btn-ghost">
                Что поставляем
                <Icon name="arrow" className="size-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productGroups.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className="glass lift flex h-full items-start gap-4 rounded-[26px] p-5">
                  <IconTile name={p.icon} />
                  <div>
                    <h3 className="font-semibold tracking-[-0.01em]">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-fg-2">{p.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Давайте обсудим ── */}
      <section id="obsudit" className="scroll-mt-24 py-8">
        <Container>
          <Reveal>
            <div className="glass-heavy rounded-[32px] p-6 sm:p-10">
              <SectionHead
                eyebrow="Давайте обсудим"
                title="Расскажите об объекте — ответим в WhatsApp"
                lead="Отметьте пару вариантов, сообщение соберётся само. Останется нажать «Отправить»."
              />
              <div className="mt-10">
                <WhatsAppBuilder />
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
