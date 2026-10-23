import Image from "next/image";
import Link from "next/link";
import { Container, SectionHead } from "@/components/Container";
import { Icon, WhatsAppIcon, type IconName } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { DeferredWidget } from "@/components/DeferredWidgets";
import { IconTile, ServiceCard } from "@/components/ServiceCard";
import { SceneProvider, SceneShowcase } from "@/components/scene/SceneBackground";
import { AnimatedNumber } from "@/components/MotionEffects";
import { HomeChoreography } from "@/components/HomeChoreography";
import { ClientLogos } from "@/components/ClientLogos";
import { Testimonials } from "@/components/Testimonials";
import { RoomExplorer } from "@/components/scene/RoomExplorer";
import { productGroups, projects, services, site, waGreeting, waLink } from "@/lib/site";

const mainServices = ["pod-klyuch", "proektirovanie", "dizayn-proekt", "otdelka", "elektromontazh", "santehnika", "kto", "metallokonstrukcii"].map(
  (slug) => services.find((service) => service.slug === slug)!,
);
const places: { icon: IconName; title: string; text: string }[] = [
  { icon: "building", title: "Офисы", text: "Рабочие пространства и кабинеты" },
  { icon: "box", title: "Магазины", text: "Торговые залы и павильоны" },
  { icon: "key", title: "Кафе и рестораны", text: "Залы для гостей и рабочие зоны" },
  { icon: "layers", title: "Склады", text: "Помещения для хранения и работы" },
];
const process = [
  { title: "Обсуждаем задачу", text: "Вы рассказываете о помещении, нужных работах и сроках. Можно начать с фото в WhatsApp." },
  { title: "Считаем смету", text: "После осмотра и замеров определяем объём работ, материалы и стоимость." },
  { title: "Делаем ремонт", text: "Согласовываем договор и выполняем работы: от демонтажа до чистовой отделки." },
  { title: "Передаём объект", text: "Проверяем результат вместе с вами. При необходимости обсуждаем дальнейшее обслуживание." },
];
const faq = [
  { question: "Какие помещения вы ремонтируете?", answer: "Офисы, магазины, торговые помещения, кафе, рестораны и склады в Алматы. Можно заказать ремонт под ключ или отдельные работы: отделку, электрику, сантехнику и демонтаж." },
  { question: "Что входит в ремонт под ключ?", answer: "Демонтаж, инженерные работы и отделка помещения. Конкретный перечень, материалы и этапы согласовываем для вашего объекта и фиксируем в договоре." },
  { question: "Как узнать стоимость ремонта?", answer: "Калькулятор на сайте поможет оценить бюджет по площади и виду работ. Это предварительный ориентир. Точную смету составляем после осмотра помещения и согласования задачи." },
  { question: "Можно заказать материалы вместе с работами?", answer: "Да. GulDar Group также поставляет строительные материалы, электротехническую продукцию, инструменты и запорную арматуру. Состав и условия поставки обсуждаем под ваш объект." },
  { question: "Как начать работу с вами?", answer: "Напишите в WhatsApp или позвоните. Укажите тип помещения, примерную площадь, нужные работы и желаемые сроки. Если есть фотографии или план — приложите их в переписке." },
];

export default function Home() {
  return (
    <SceneProvider>
      <HomeChoreography />
      <section id="home" className="hero-section">
        <Container>
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Строительная компания · Алматы</p>
              {/* avoid-ai-design-ignore: SD5 */}
              <h1 className="display hero-title mt-6">Ремонт коммерческих объектов <span className="accent-text hero-title-ending">под ключ.</span></h1>
              <p className="hero-lead">Проектирование, дизайн-проект и ремонт для вашего бизнеса. От первых планов до отделки, поставки материалов и готового помещения.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#kalkulyator" className="btn btn-accent">Рассчитать стоимость<Icon name="arrowUpRight" className="size-5" /></a>
                <a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><WhatsAppIcon className="size-5" />Обсудить проект</a>
              </div>
              <ul className="hero-promises">
                {["Работаем по договору", "Смета до начала работ"].map((item) => <li key={item}><Icon name="check" className="size-4" />{item}</li>)}
                <li><Icon name="check" className="size-4" />С <AnimatedNumber value={site.foundedYear} /> года</li>
              </ul>
              <a href={`tel:${site.technicalTel}`} className="hero-technical-contact lg:hidden"><span>Технический специалист<strong>{site.technicalPhone}</strong></span><Icon name="phone" className="size-5" /></a>
            </div>
            <SceneShowcase />
          </div>
          <div className="hero-bottom">
            <span>ВАШЕ ПОМЕЩЕНИЕ. НАША РАБОТА.</span>
            <a href="#uslugi">Узнайте, что мы делаем<Icon name="arrow" className="size-4 rotate-90" /></a>
          </div>
        </Container>
      </section>

      <section className="object-strip" aria-label="С какими помещениями работаем">
        <Container className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {places.map((place) => <div key={place.title} className="flex items-center gap-4"><Icon name={place.icon} className="size-7 shrink-0 text-safety" /><div><p className="font-display text-base font-bold">{place.title}</p><p className="mt-1 text-xs text-fg-2">{place.text}</p></div></div>)}
        </Container>
      </section>

      <section className="section-space clients-section">
        <Container>
          <SectionHead eyebrow="Наши клиенты" title="Работаем с компаниями, которые вы знаете" />
          <div className="mt-8"><ClientLogos size="lg" /></div>
        </Container>
      </section>

      <section id="uslugi" className="section-space services-section light-section scroll-mt-28">
        <Container>
          <Reveal className="section-heading-row">
            <SectionHead eyebrow="01 / Чем можем помочь" title={<>Все работы.<br />Одна команда.</>} lead="Нужен полный ремонт или отдельный специалист? Подключимся на нужном этапе." />
            <Link href="/uslugi" className="text-link">Все услуги и цены<Icon name="arrowUpRight" className="size-5" /></Link>
          </Reveal>
          <div className="services-grid mt-10 grid gap-4 sm:grid-cols-2">
            {mainServices.map((service, i) => <Reveal key={service.slug} delay={(i % 3) * 60}><ServiceCard {...service} number={i + 1} /></Reveal>)}
          </div>
        </Container>
      </section>

      <section id="kalkulyator" className="scroll-mt-28 pb-16 sm:pb-24">
        <Container>
          <Reveal className="panel-strong calculator-panel overflow-hidden rounded-3xl p-5 sm:p-10 lg:p-12">
            <div className="section-heading-row"><SectionHead eyebrow="02 / Планируем бюджет" title="Сколько стоит ваш ремонт?" lead="Выберите вид работ и площадь. Получите предварительный диапазон стоимости и отправьте его нам для уточнения." /><span className="estimate-tag"><Icon name="ruler" className="size-5" />Расчёт онлайн</span></div>
            <div className="mt-9"><DeferredWidget kind="calculator" /></div>
          </Reveal>
        </Container>
      </section>

      <section id="o-kompanii" className="section-space process-section scroll-mt-28">
        <Container>
          <Reveal><SectionHead eyebrow="03 / Как всё устроено" title="Понятно на каждом этапе" lead="Сначала согласовываем задачу и стоимость. Затем превращаем план в готовое помещение." /></Reveal>
          <ol className="process-grid mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => <Reveal as="li" key={step.title} delay={i * 60}><span className="process-number">0{i + 1}</span><h3 className="mt-5 text-lg font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-fg-2">{step.text}</p></Reveal>)}
          </ol>
        </Container>
      </section>

      {projects.length > 0 && <section className="section-space"><Container><SectionHead eyebrow="Объекты" title="Наши работы" /><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <figure key={project.image} className="panel overflow-hidden rounded-2xl"><div className="relative aspect-[4/3]"><Image src={project.image} alt={project.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div><figcaption className="p-5"><p className="font-bold">{project.title}</p><p className="mt-1 text-sm text-fg-2">{project.place}</p></figcaption></figure>)}</div></Container></section>}

      <section data-scene-finale className="section-space scene-finale light-section">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <Reveal><SectionHead eyebrow="После ремонта" title="Помещение готово. Мы остаёмся на связи." lead="Электрика, сантехника и мелкий ремонт нужны и после открытия. Возьмём техническое обслуживание на себя." /><div className="mt-7 flex flex-wrap gap-2">{(["bolt", "drop", "hammer"] as IconName[]).map((icon) => <IconTile key={icon} name={icon} />)}</div><Link href="/uslugi/kto" className="text-link mt-7">Об обслуживании помещений<Icon name="arrowUpRight" className="size-5" /></Link></Reveal>
            <RoomExplorer />
          </div>
        </Container>
      </section>

      <section className="section-space reviews-section"><Container><Testimonials /></Container></section>

      <section id="postavka" className="scroll-mt-28 pb-16 sm:pb-24">
        <div className="materials-rail" aria-hidden="true"><div className="materials-track">{productGroups.map((group) => <span key={group.title}>{group.title}<span className="material-joint" /></span>)}</div></div>
        <Container><Reveal className="supply-panel">
          <div><p className="eyebrow">Комплектуем ваш объект</p><h2 className="title mt-3">Материалы? Тоже к нам.</h2><p className="mt-4 max-w-lg text-fg-2">Подберём поставку под согласованный перечень работ.</p><Link href="/produkciya" className="text-link mt-6">Подробнее о поставках<Icon name="arrowUpRight" className="size-5" /></Link></div>
          <div className="grid gap-5 sm:grid-cols-2">{productGroups.map((group) => <div key={group.title} className="flex gap-3"><Icon name={group.icon} className="mt-1 size-6 shrink-0 text-safety" /><div><p className="font-bold">{group.title}</p><p className="mt-1 text-sm leading-relaxed text-fg-2">{group.text}</p></div></div>)}</div>
        </Reveal></Container>
      </section>

      <section className="pb-16 sm:pb-24"><Container className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><SectionHead eyebrow="Ответы на вопросы" title="До начала работ" lead="Коротко о том, что обычно важно знать." /><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden>+</span></summary><p>{item.answer}</p></details>)}</div></Container></section>

      <section id="obsudit" className="scroll-mt-28 pb-8"><Container><Reveal className="panel-strong overflow-hidden rounded-3xl p-5 sm:p-10 lg:p-12"><SectionHead eyebrow="Начнём с вашей задачи" title="Давайте обсудим ваш объект" lead="Выберите нужные работы и расскажите о помещении — подготовим сообщение для WhatsApp." /><div className="mt-8"><DeferredWidget kind="whatsapp" /></div></Reveal></Container></section>
    </SceneProvider>
  );
}
