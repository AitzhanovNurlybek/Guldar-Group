import Link from "next/link";
import { Container, SectionHead } from "@/components/Container";
import { Icon, WhatsAppIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { DeferredWidget } from "@/components/DeferredWidgets";
import { IconTile, ServiceCard } from "@/components/ServiceCard";
import { SceneProvider, SceneShowcase } from "@/components/scene/SceneBackground";
import { HomeChoreography } from "@/components/HomeChoreography";
import { ClientLogos } from "@/components/ClientLogos";
import { Testimonials } from "@/components/Testimonials";
import { RoomExplorer } from "@/components/scene/RoomExplorer";
import { MobileDisclosure } from "@/components/MobileDisclosure";
import { RenovationComparison } from "@/components/RenovationComparison";
import { clients, productGroups, services, site, waGreeting, waLink } from "@/lib/site";
import type { IconName } from "@/components/Icons";
import { faqJsonLd, serializeJsonLd } from "@/lib/seo";

const mainServices = ["pod-klyuch", "proektirovanie", "dizayn-proekt", "otdelka", "elektromontazh", "santehnika", "kto", "metallokonstrukcii"].map(
  (slug) => services.find((service) => service.slug === slug)!,
);
const process = [
  { title: "Обсуждаем задачу", text: "Помещение, бюджет и сроки." },
  { title: "Согласуем смету", text: "Работы и материалы фиксируем в договоре." },
  { title: "Выполняем ремонт", text: "Работаем по согласованному плану." },
  { title: "Сдаём помещение", text: "Проверяем результат вместе с вами." },
];
const agreements: { title: string; text: string; icon: IconName }[] = [
  { title: "Состав работ", text: "Фиксируем перечень работ и материалов.", icon: "layers" },
  { title: "Согласованная смета", text: "Изменения обсуждаем с вами заранее.", icon: "ruler" },
  { title: "Договор и акты", text: "Оформляем договор, счёт и акт выполненных работ.", icon: "shield" },
];
const years = new Date().getFullYear() - site.foundedYear;
const yearsWord = years % 10 === 1 && years % 100 !== 11 ? "год" : [2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years % 100) ? "года" : "лет";
const facts = [
  { value: String(years), label: `${yearsWord} работаем в Алматы` },
  { value: String(clients.length), label: "известных компаний среди заказчиков" },
  { value: String(services.length), label: "видов работ — от проекта до обслуживания" },
  { value: "1", label: "договор и смета на весь ремонт" },
];
const faq = [
  { question: "С какими объектами работаете?", answer: "С офисами, магазинами, кафе и складами в Алматы. Выполняем ремонт целиком или отдельные работы." },
  { question: "Как узнать стоимость?", answer: "Калькулятор даёт ориентир. Точную смету составляем после осмотра помещения." },
  { question: "Можно заказать только проект?", answer: "Да. Проектирование, дизайн-проект и ремонт можно заказать отдельно." },
  { question: "Поставляете материалы?", answer: "Да. Стройматериалы, электротехнику, инструменты и запорную арматуру по согласованному списку." },
  { question: "Что прислать для начала?", answer: "Тип помещения, площадь и нужные работы. План и фотографии можно приложить в WhatsApp." },
];

export default function Home() {
  return <SceneProvider>
    <HomeChoreography />

    <section id="home" className="editorial-hero">
      <Container>
        <div className="hero-composition hero-composition--comparison">
          <div className="editorial-hero-copy">
            <p className="hero-location">Алматы <span>С {site.foundedYear} года</span></p>
            <h1>Ремонт офисов и магазинов под&nbsp;ключ.</h1>
            <p className="editorial-hero-lead">Проектирование, ремонт и материалы для коммерческих помещений в Алматы.</p>
            <ul className="hero-objects" aria-label="С какими помещениями работаем">{["Офисы", "Магазины", "Кафе и рестораны", "Склады"].map((place) => <li key={place}>{place}</li>)}</ul>
            <div className="editorial-hero-actions">
              <a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" className="btn btn-accent"><WhatsAppIcon className="size-5" />Написать в WhatsApp</a>
              <a href="#kalkulyator" className="btn btn-ghost">Рассчитать стоимость</a>
            </div>
            <p className="hero-note"><Icon name="check" className="size-4" />Смета и договор до начала работ</p>
          </div>
        </div>
      </Container>
      <RenovationComparison />
    </section>

    <section className="facts-band" aria-label="GulDar Group в цифрах"><Container><dl className="facts">{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></Container></section>

    <section className="section-space clients-section">
      <Container>
        <div className="clients-heading"><div><h2>Среди наших заказчиков</h2></div><a href="#otzyvy" className="text-link">Рекомендации<Icon name="arrowUpRight" className="size-4" /></a></div>
        <ClientLogos size="lg" />
      </Container>
    </section>

    <section id="uslugi" className="section-space services-section scroll-mt-28">
      <Container>
        <Reveal className="section-heading-row"><SectionHead eyebrow="Услуги" title={<>От проекта<br />до отделки.</>} /><Link href="/uslugi" className="text-link">Все услуги и цены<Icon name="arrowUpRight" className="size-5" /></Link></Reveal>
        <div className="services-grid services-editorial">
          {mainServices.map((service, index) => <Reveal key={service.slug} className={index === 0 ? "service-featured" : ""}><ServiceCard {...service} text={index === 0 ? "От демонтажа до готового помещения. Один договор." : service.text} mobileOverview featured={index === 0} /></Reveal>)}
        </div>
      </Container>
    </section>

    <section id="o-kompanii" className="section-space assurance-section scroll-mt-28">
      <Container>
        <div className="assurance-layout"><Reveal><SectionHead eyebrow="Условия работы" title="Смета до начала работ." /><Link href="/o-kompanii#rekvizity" className="text-link mt-7">О компании и реквизиты<Icon name="arrowUpRight" className="size-5" /></Link></Reveal>
          <dl className="agreement-list">{agreements.map((agreement) => <div key={agreement.title}><dt><IconTile name={agreement.icon} size="sm" />{agreement.title}</dt><dd>{agreement.text}</dd></div>)}</dl>
        </div>
      </Container>
    </section>

    <section id="etapy" className="section-space process-section">
      <Container>
        <div className="process-intro"><Reveal><SectionHead eyebrow="Этапы ремонта" title="Как меняется помещение." /><p className="visualization-note">Демонстрационный 3D-макет</p></Reveal><SceneShowcase /></div>
        <ol className="process-grid mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{process.map((step, index) => <Reveal as="li" key={step.title}><span className="process-number">0{index + 1}</span><h3 className="mt-5 text-lg font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-fg-2">{step.text}</p></Reveal>)}</ol>
      </Container>
    </section>

    <section id="kalkulyator" className="section-space scroll-mt-28"><Container><Reveal className="panel-strong calculator-panel"><SectionHead eyebrow="Бюджет" title="Сколько стоит ремонт?" lead="Выберите работы и площадь для предварительного расчёта." /><MobileDisclosure id="calculator-options" sectionId="kalkulyator" label="Рассчитать стоимость"><DeferredWidget kind="calculator" /></MobileDisclosure></Reveal></Container></section>

    <section data-scene-finale className="section-space scene-finale light-section"><Container><div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"><Reveal><SectionHead eyebrow="После открытия" title="Обслуживание после ремонта." lead="Электрика, сантехника и мелкий ремонт по договору." /><Link href="/uslugi/kto" className="text-link mt-7">Об обслуживании<Icon name="arrowUpRight" className="size-5" /></Link></Reveal><RoomExplorer /></div></Container></section>

    <section className="section-space reviews-section"><Container><Testimonials concise /></Container></section>

    <section id="postavka" className="section-space supply-section scroll-mt-28"><Container><Reveal className="supply-panel"><div><p className="eyebrow">Поставка</p><h2 className="title mt-3">Материалы для ремонта.</h2><p className="mt-4 max-w-lg text-fg-2">Комплектуем объект по согласованному списку.</p><Link href="/produkciya" className="text-link mt-6">Каталог материалов<Icon name="arrowUpRight" className="size-5" /></Link></div><div className="supply-directions">{productGroups.map((group) => <div key={group.title}><IconTile name={group.icon} size="sm" /><div><h3>{group.title}</h3><p>{group.text}</p></div></div>)}</div></Reveal></Container></section>

    <section className="section-space faq-section"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(faq)) }} /><Container className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><SectionHead eyebrow="Вопросы" title="Перед началом работ." /><div className="faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden>+</span></summary><p>{item.answer}</p></details>)}</div></Container></section>

    <section id="obsudit" className="section-space brief-section scroll-mt-28"><Container><Reveal className="panel-strong brief-panel"><SectionHead eyebrow="Начнём с вашего объекта" title="Обсудим ремонт?" /><div className="brief-quick-actions"><a href={waLink(waGreeting)} target="_blank" rel="noopener noreferrer" className="btn btn-accent"><WhatsAppIcon className="size-5" />Написать в WhatsApp</a><a href={`tel:${site.technicalTel}`} className="text-link">{site.technicalPhone}</a></div><MobileDisclosure id="brief-options" sectionId="obsudit" label="Добавить детали объекта"><DeferredWidget kind="whatsapp" /></MobileDisclosure></Reveal></Container></section>
  </SceneProvider>;
}
