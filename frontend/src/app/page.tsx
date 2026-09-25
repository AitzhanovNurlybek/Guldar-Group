import Image from "next/image";
import Link from "next/link";
import { Container, SectionHead } from "@/components/Container";
import { Icon, WhatsAppIcon, type IconName } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { IconTile, ServiceCard } from "@/components/ServiceCard";
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
  { value: String(site.foundedYear), label: "год основания — больше 10 лет на рынке" },
  { value: String(services.length), label: "видов работ: от розетки до здания" },
  { value: "10 000 ₸", label: "мелкий ремонт — приезжаем даже на одну задачу" },
  { value: "9–20", label: "принимаем заявки каждый день" },
];

const ktoRoles: { icon: IconName; label: string }[] = [
  { icon: "bolt", label: "Электрик" },
  { icon: "drop", label: "Сантехник" },
  { icon: "hammer", label: "Мастер" },
];

const tapeItems = [
  "Ремонт под ключ",
  "Электромонтаж",
  "Сантехника",
  "Отделка",
  "Фасады",
  "Демонтаж",
  "Металлоконструкции",
  "Техобслуживание",
];

function Tape() {
  const row = tapeItems.map((t) => (
    <span key={t} className="flex items-center gap-6 pr-6">
      {t}
      <span className="size-2 bg-[#1a0e02]" />
    </span>
  ));
  return (
    <div aria-hidden className="relative -rotate-[1.5deg] overflow-hidden border-y-2 border-[#1a0e02] bg-safety py-3">
      <div className="tape-track font-display text-xl font-semibold tracking-[0.08em] text-[#1a0e02] uppercase">
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ── Первый экран: слева текст, справа — стройка на фоне ── */}
      <section className="relative">
        <Container className="grid lg:min-h-dvh lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* На телефоне сверху место под стройку */}
          <div aria-hidden className="h-[calc(40svh+4rem)] lg:hidden" />
          <div className="relative pb-10 lg:py-16">
            <p className="inline-flex items-center gap-2.5 rounded-sm border border-line bg-ink-900/70 px-3 py-1.5 font-display text-sm tracking-[0.12em] text-fg-2 uppercase">
              <span className="size-2 bg-safety" />
              ТОО · Алматы · с {site.foundedYear} года
            </p>
            <h1 className="display mt-6">
              Ремонт офисов и коммерческих помещений <span className="accent-text">под ключ</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-2">
              Электрика, сантехника, отделка и фасад — одна бригада и один договор. Сами поставляем материалы и даём
              гарантию на работы.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={waLink(waGreeting)} target="_blank" rel="noopener" className="btn btn-accent">
                <WhatsAppIcon />
                Обсудить в WhatsApp
              </a>
              <Link href="/uslugi" className="btn btn-ghost">
                Услуги и цены
                <Icon name="arrow" className="size-4" />
              </Link>
            </div>
            <div className="mt-10 max-w-xl">
              <p className="font-display text-xs tracking-[0.14em] text-fg-3 uppercase">Среди клиентов</p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-display text-xl font-medium tracking-[0.04em] text-fg-2 uppercase">
                {clients.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <p className="mt-12 hidden items-center gap-2 font-display text-sm tracking-[0.14em] text-fg-3 uppercase lg:flex">
              <Icon name="arrow" className="size-4 rotate-90 text-safety" />
              Листайте — дом достраивается
            </p>
          </div>
        </Container>
      </section>

      <div className="overflow-x-clip py-4">
        <Tape />
      </div>

      {/* ── Цифры ── */}
      <section className="pt-14 pb-8">
        <Container>
          <Reveal>
            <dl className="panel grid grid-cols-2 rounded-lg lg:grid-cols-4">
              {facts.map((f, i) => (
                <div
                  key={f.value}
                  className={`p-5 sm:p-7 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
                >
                  <dt className="font-display text-4xl font-semibold tracking-[0.01em] sm:text-5xl">
                    {i === 2 && <span className="mr-1 text-2xl text-fg-3 sm:text-3xl">от</span>}
                    {f.value}
                  </dt>
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
              index="01"
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
            <div className="panel-strong overflow-hidden rounded-xl">
              <div className="hazard h-2" aria-hidden />
              <div className="grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:p-12">
                <div>
                  <p className="eyebrow">Для сетей, офисов и ТЦ</p>
                  <h2 className="title mt-4">Техобслуживание без штата мастеров</h2>
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
                        <Icon name="check" className="mt-0.5 size-5 shrink-0 text-safety" />
                        <span className="text-fg-2">{t}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={waLink("Здравствуйте! Интересует техническое обслуживание помещений. Можно обсудить условия?")}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-accent mt-8"
                  >
                    <WhatsAppIcon />
                    Обсудить обслуживание
                  </a>
                </div>

                {/* Три специалиста → один договор */}
                <div className="flex flex-col items-center gap-5">
                  <div className="flex flex-wrap justify-center gap-3">
                    {ktoRoles.map((r) => (
                      <div key={r.label} className="flex items-center gap-3 rounded-md border border-line bg-ink-950/60 py-2 pr-4 pl-2">
                        <IconTile name={r.icon} />
                        <span className="font-display text-lg tracking-[0.04em] uppercase">{r.label}</span>
                      </div>
                    ))}
                  </div>
                  <svg viewBox="0 0 24 40" className="h-12 text-safety" fill="none" stroke="currentColor" aria-hidden>
                    <path d="M12 2v34M5 29l7 8 7-8" strokeWidth="1.8" strokeLinecap="square" />
                  </svg>
                  <div className="rounded-md border-2 border-safety bg-safety/10 px-12 py-6 text-center">
                    <p className="font-display text-6xl font-semibold text-safety">1</p>
                    <p className="mt-1 font-display text-lg tracking-[0.06em] uppercase">договор с {site.name}</p>
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
            <SectionHead index="02" eyebrow="Как работаем" title="От сообщения до сдачи объекта — пять шагов" />
          </Reveal>
          <div className="ruler mt-10" aria-hidden />
          <ol className="mt-6 grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 70} className="panel rounded-lg p-6">
                <span className="font-display text-5xl font-semibold text-safety/90">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl leading-tight font-medium tracking-[0.03em] uppercase">{s.title}</h3>
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
            <SectionHead index="03" eyebrow="Условия" title="Договор, гарантия и материалы от нас" />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={i * 70}>
                <div className="panel h-full rounded-lg border-l-2 border-l-safety p-6">
                  <h3 className="font-display text-xl leading-tight font-medium tracking-[0.03em] uppercase">{a.title}</h3>
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
                  <figure className="panel overflow-hidden rounded-lg">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="p-5">
                      <p className="font-display text-lg tracking-[0.03em] uppercase">{p.title}</p>
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
                index="04"
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
                <div className="panel lift flex h-full flex-col gap-4 rounded-lg p-5">
                  <IconTile name={p.icon} />
                  <div>
                    <h3 className="font-display text-lg leading-tight font-medium tracking-[0.03em] uppercase">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{p.text}</p>
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
            <div className="panel-strong overflow-hidden rounded-xl">
              <div className="hazard h-2" aria-hidden />
              <div className="p-6 sm:p-10">
                <SectionHead
                  index="05"
                  eyebrow="Давайте обсудим"
                  title="Расскажите об объекте — ответим в WhatsApp"
                  lead="Отметьте пару вариантов, сообщение соберётся само. Останется нажать «Отправить»."
                />
                <div className="mt-10">
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
