import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Icon, WhatsAppIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { serviceDetails } from "@/lib/service-details";
import { absoluteUrl, pageMetadata, serializeJsonLd } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return serviceDetails.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const service = serviceDetails.find((item) => item.slug === slug);
  if (!service) notFound();
  return pageMetadata(service.title, service.description, `/uslugi/${slug}`);
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = serviceDetails.find((item) => item.slug === slug);
  if (!service) notFound();

  const url = absoluteUrl(`/uslugi/${slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: service.title,
        description: service.description,
        url,
        provider: { "@id": absoluteUrl("/#organization") },
        areaServed: { "@type": "City", name: "Алматы" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: absoluteUrl() },
          { "@type": "ListItem", position: 2, name: "Услуги", item: absoluteUrl("/uslugi") },
          { "@type": "ListItem", position: 3, name: service.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <PageHeader eyebrow="GulDar Group · Алматы" title={service.title} lead={service.intro} />
      <Container className="space-y-12 pb-12 sm:space-y-16">
        <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-sm text-fg-2">
          <Link href="/" className="hover:text-signal">Главная</Link>
          <span aria-hidden="true">/</span>
          <Link href="/uslugi" className="hover:text-signal">Услуги</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-fg">{service.title}</span>
        </nav>

        <section aria-labelledby="scope-title">
          <h2 id="scope-title" className="title">{service.scopeTitle}</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {service.scope.map((item, index) => (
              <article key={item.title} className="panel rounded-2xl p-6 sm:p-8">
                <span className="text-sm font-extrabold text-signal">0{index + 1}</span>
                <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-fg-2">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel-strong rounded-3xl p-6 sm:p-9">
            <p className="eyebrow">Стоимость</p>
            <h2 className="mt-3 text-2xl font-bold">Как рассчитывается смета</h2>
            <p className="mt-4 leading-relaxed text-fg-2">{service.cost}</p>
            <Link href="/uslugi#calculator" className="mt-6 inline-flex items-center gap-2 font-bold text-signal hover:text-fg">
              Калькулятор и все услуги <Icon name="arrow" className="size-4" />
            </Link>
          </div>
          <div className="panel rounded-3xl p-6 sm:p-9">
            <p className="eyebrow">Первый шаг</p>
            <h2 className="mt-3 text-2xl font-bold">Что прислать для обсуждения</h2>
            <ul className="mt-5 space-y-4">
              {service.preparation.map((item) => (
                <li key={item} className="flex items-start gap-3 text-fg-2">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-safety" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="questions-title">
          <h2 id="questions-title" className="title">Частые вопросы</h2>
          <div className="mt-7 space-y-3">
            {service.questions.map(({ question, answer }) => (
              <details key={question} className="panel rounded-2xl px-6 py-5">
                <summary className="cursor-pointer text-lg font-bold">{question}</summary>
                <p className="mt-4 max-w-3xl leading-relaxed text-fg-2">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="panel-strong flex flex-wrap items-center justify-between gap-6 rounded-3xl p-6 sm:p-10">
          <div className="max-w-xl">
            <h2 className="title">Обсудим ваш объект</h2>
            <p className="mt-3 text-fg-2">Напишите, что планируете, и приложите фотографии или план помещения.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={waLink(`Здравствуйте! Интересует: ${service.title}. Хочу обсудить объект.`)} target="_blank" rel="noopener" className="btn btn-accent">
              <WhatsAppIcon /> Обсудить в WhatsApp
            </a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="btn btn-ghost">Позвонить</a>
          </div>
        </section>

        <nav aria-label="Другие направления" className="flex flex-wrap gap-3">
          {serviceDetails.filter((item) => item.slug !== slug).map((item) => (
            <Link key={item.slug} href={`/uslugi/${item.slug}`} className="panel inline-flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-bold hover:text-signal">
              {item.title} <Icon name="arrow" className="size-4 shrink-0" />
            </Link>
          ))}
        </nav>
      </Container>
    </>
  );
}
