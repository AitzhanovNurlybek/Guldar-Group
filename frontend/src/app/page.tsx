import Image from "next/image";
import Link from "next/link";
import { Container, SectionHead } from "@/components/Container";
import { Icon, WhatsAppIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { DeferredWidget } from "@/components/DeferredWidgets";
import { ServiceCard } from "@/components/ServiceCard";
import { SceneProvider, SceneShowcase } from "@/components/scene/SceneBackground";
import { HomeChoreography } from "@/components/HomeChoreography";
import { ClientLogos } from "@/components/ClientLogos";
import { Testimonials } from "@/components/Testimonials";
import { RoomExplorer } from "@/components/scene/RoomExplorer";
import { productGroups, services, site, waGreeting, waLink } from "@/lib/site";

const mainServices = ["pod-klyuch", "proektirovanie", "dizayn-proekt", "otdelka", "elektromontazh", "santehnika", "kto", "metallokonstrukcii"].map(
  (slug) => services.find((service) => service.slug === slug)!,
);
const process = [
  { title: "Задача и осмотр", text: "Обсуждаем назначение помещения, состояние, бюджет и желаемые сроки." },
  { title: "Смета и договор", text: "Согласуем состав работ, материалы и этапы до начала ремонта." },
  { title: "Работы на объекте", text: "Выполняем демонтаж, инженерные работы и отделку по согласованному перечню." },
  { title: "Приёмка результата", text: "Проверяем выполненные работы вместе с вами. Обсуждаем обслуживание после открытия." },
];
const agreements = [
  { title: "Понятный состав работ", text: "Фиксируем, что нужно сделать: от отдельных инженерных задач до ремонта помещения целиком." },
  { title: "Согласованная смета", text: "Определяем объём работ и материалы после осмотра. Изменения обсуждаем отдельно." },
  { title: "Официальное оформление", text: "Работаем как ТОО: договор, счёт и акт выполненных работ. Реквизиты компании открыты." },
];
const faq = [
  { question: "С какими помещениями вы работаете?", answer: "С офисами, магазинами, кафе, торговыми помещениями и складами в Алматы. Можно обсудить ремонт под ключ или отдельные работы." },
  { question: "Как узнать стоимость до начала ремонта?", answer: "Начните с калькулятора на сайте. Точную смету составляем после осмотра и согласования перечня работ и материалов." },
  { question: "Можно заказать проектирование отдельно?", answer: "Да. Проектирование, дизайн-проект и ремонт можно обсудить как отдельные услуги или как одну задачу." },
  { question: "Поставляете ли вы материалы?", answer: "Да. Поставляем строительные материалы, электротехнику, инструменты и запорную арматуру. Перечень и условия согласуем под объект." },
  { question: "Что прислать для первого обсуждения?", answer: "Тип помещения, примерную площадь, нужные работы и желаемые сроки. Если есть план или фотографии текущего состояния, приложите их в WhatsApp." },
];

export default function Home() {
  return <SceneProvider>
    <HomeChoreography />

    <section id="home" className="editorial-hero">
      <Container>
        <div className="hero-composition">
          <div className="editorial-hero-copy">
            <p className="hero-location">Ремонт коммерческих объектов <span>Алматы</span></p>
            <h1>Ремонт для<br />вашего бизнеса.</h1>
            <p className="editorial-hero-lead">Поможем с планировкой, ремонтом и материалами. Офисы, магазины, кафе и склады в Алматы.</p>
            <div className="editorial-hero-actions">
              <a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" className="btn btn-accent"><WhatsAppIcon className="size-5" />Написать в WhatsApp</a>
              <a href="#kalkulyator" className="hero-budget-link">Узнать стоимость<Icon name="arrow" className="size-4" /></a>
            </div>
            <p className="hero-help">Можно начать с вопроса, даже если проекта пока нет.</p>
            <div className="hero-signature"><span>GulDar Group</span><span>Работаем с {site.foundedYear} года</span></div>
            <a href={`tel:${site.technicalTel}`} className="hero-technical-contact lg:hidden"><span>Технический специалист<strong>{site.technicalPhone}</strong></span><Icon name="phone" className="size-5" /></a>
          </div>
          <figure className="hero-interior">
            <picture>
              <source type="image/webp" srcSet="/images/interior-concept-640.webp 640w, /images/interior-concept-960.webp 960w, /images/interior-concept-1536.webp 1536w" sizes="(min-width: 1024px) 54vw, 100vw" />
              <Image src="/images/interior-concept-1536.webp" width={1536} height={1024} alt="Визуализация концепции коммерческого интерьера: приёмная, зона ожидания и переговорная" loading="eager" fetchPriority="high" />
            </picture>
            <figcaption><span>Концепция коммерческого интерьера</span><span>AI-визуализация</span></figcaption>
          </figure>
        </div>
      </Container>
    </section>

    <div className="project-types" aria-label="С какими помещениями работаем"><Container><p>Пространства для работы</p><ul>{["Офисы", "Магазины", "Кафе и рестораны", "Склады"].map((place) => <li key={place}>{place}</li>)}</ul></Container></div>

    <section className="section-space clients-section">
      <Container>
        <div className="clients-heading"><div><p className="eyebrow">Опыт компании</p><h2>Среди наших заказчиков</h2></div><a href="#otzyvy" className="text-link">Читать рекомендательные письма<Icon name="arrowUpRight" className="size-4" /></a></div>
        <ClientLogos size="lg" />
      </Container>
    </section>

    <section id="uslugi" className="section-space services-section scroll-mt-28">
      <Container>
        <Reveal className="section-heading-row"><SectionHead eyebrow="Чем можем помочь" title={<>Что нужно сделать<br />в вашем помещении?</>} lead="Выберите нужное направление. Можно заказать отдельную работу или ремонт целиком." /><Link href="/uslugi" className="text-link">Все услуги и цены<Icon name="arrowUpRight" className="size-5" /></Link></Reveal>
        <div className="services-grid services-editorial">
          {mainServices.map((service, index) => <Reveal key={service.slug} className={index === 0 ? "service-featured" : ""}><ServiceCard {...service} featured={index === 0} /></Reveal>)}
        </div>
      </Container>
    </section>

    <section id="o-kompanii" className="section-space assurance-section scroll-mt-28">
      <Container>
        <div className="assurance-layout"><Reveal><SectionHead eyebrow="Основа работы" title={<>Сначала ясность.<br />Потом ремонт.</>} lead="До выхода на объект обсуждаем задачу, перечень работ и порядок взаимодействия." /><Link href="/o-kompanii#rekvizity" className="text-link mt-7">О компании и реквизиты<Icon name="arrowUpRight" className="size-5" /></Link></Reveal>
          <dl className="agreement-list">{agreements.map((agreement) => <div key={agreement.title}><dt><Icon name="check" className="size-5" />{agreement.title}</dt><dd>{agreement.text}</dd></div>)}</dl>
        </div>
        <div className="company-record"><span>{site.legalName}</span><span>БИН {site.bin}</span><a href={site.gis} target="_blank" rel="noopener noreferrer">Офис в Алматы<Icon name="arrowUpRight" className="size-4" /></a></div>
      </Container>
    </section>

    <section id="etapy" className="section-space process-section">
      <Container>
        <div className="process-intro"><Reveal><SectionHead eyebrow="От плана к результату" title="Ремонт можно представить заранее." lead="Посмотрите, как меняется помещение на разных этапах. Макет иллюстрирует последовательность работ." /><p className="visualization-note">Демонстрационный 3D-макет</p></Reveal><SceneShowcase /></div>
        <ol className="process-grid mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{process.map((step, index) => <Reveal as="li" key={step.title}><span className="process-number">0{index + 1}</span><h3 className="mt-5 text-lg font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-fg-2">{step.text}</p></Reveal>)}</ol>
      </Container>
    </section>

    <section id="kalkulyator" className="section-space scroll-mt-28"><Container><Reveal className="panel-strong calculator-panel"><div className="section-heading-row"><SectionHead eyebrow="Планируем бюджет" title="Начнём с расчёта." lead="Выберите работы и площадь. Получите ориентир, с которым можно обсудить точную смету." /><span className="estimate-tag"><Icon name="ruler" className="size-5" />Предварительная оценка</span></div><div className="mt-9"><DeferredWidget kind="calculator" /></div></Reveal></Container></section>

    <section data-scene-finale className="section-space scene-finale light-section"><Container><div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"><Reveal><SectionHead eyebrow="После открытия" title="Помещение работает. Мы на связи." lead="Электрика, сантехника и мелкий ремонт нужны и после сдачи объекта. Обсудим техническое обслуживание по договору." /><Link href="/uslugi/kto" className="text-link mt-7">Об обслуживании помещений<Icon name="arrowUpRight" className="size-5" /></Link></Reveal><RoomExplorer /></div></Container></section>

    <section className="section-space reviews-section"><Container><Testimonials /></Container></section>

    <section id="postavka" className="section-space supply-section scroll-mt-28"><Container><Reveal className="supply-panel"><div><p className="eyebrow">Комплектуем объект</p><h2 className="title mt-3">Материалы.<br />В составе проекта.</h2><p className="mt-4 max-w-lg text-fg-2">Подберём поставку под согласованный перечень работ.</p><Link href="/produkciya" className="text-link mt-6">О поставках<Icon name="arrowUpRight" className="size-5" /></Link></div><div className="supply-directions">{productGroups.map((group) => <div key={group.title}><Icon name={group.icon} className="size-6" /><div><h3>{group.title}</h3><p>{group.text}</p></div></div>)}</div></Reveal></Container></section>

    <section className="section-space faq-section"><Container className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><SectionHead eyebrow="Перед началом" title="Что важно знать до ремонта." lead="Ответы на вопросы о работах, стоимости и первом обращении." /><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden>+</span></summary><p>{item.answer}</p></details>)}</div></Container></section>

    <section id="obsudit" className="section-space brief-section scroll-mt-28"><Container><Reveal className="panel-strong brief-panel"><div className="brief-heading"><SectionHead eyebrow="Давайте начнём" title="Расскажите, что вы планируете." lead="Выберите только то, что уже известно. Мы подготовим сообщение, которое вы сможете отправить в WhatsApp." /><a href={`tel:${site.technicalTel}`} className="brief-phone"><span>Удобнее поговорить? Позвоните</span>{site.technicalPhone}</a></div><div className="mt-8"><DeferredWidget kind="whatsapp" /></div></Reveal></Container></section>
  </SceneProvider>;
}
