import Image from "next/image";
import { testimonials } from "@/lib/testimonials";
import { SectionHead } from "./Container";
import { Icon } from "./Icons";

function ReviewText({ review }: { review: (typeof testimonials)[number] }) {
  return <>
    <blockquote><p>«{review.quote}»</p></blockquote>
    <p className="testimonial-attribution">{review.attribution}</p>
    <a href={`/reviews/${review.id}.pdf`} target="_blank" rel="noopener noreferrer" className="text-link">Читать письмо<Icon name="arrowUpRight" className="size-4" /><span className="text-xs font-medium text-fg-3">PDF</span></a>
  </>;
}

export function Testimonials({ concise = false }: { concise?: boolean }) {
  return <section id="otzyvy" className={`testimonials-section scroll-mt-28${concise ? " testimonials-concise" : ""}`} aria-label="Отзывы заказчиков">
    {concise ? <SectionHead eyebrow="Рекомендации" title="Письма заказчиков." /> : <SectionHead eyebrow="Опыт в документах" title="Рекомендации в оригинале." lead="Sulpak, «Мастершина» и школа «ДАНА» о работе с GulDar Group. Каждый отзыв можно открыть и прочитать целиком." />}
    <div className="testimonials-list">
      {testimonials.map((review, index) => <article key={review.id} className="testimonial">
        <a className="testimonial-document" href={`/reviews/${review.id}.pdf`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть оригинал отзыва: ${review.company}, PDF`}>
          <Image src={`/reviews/${review.id}.webp`} width={240} height={340} sizes="(max-width: 639px) 80px, 140px" alt={`Скан письма от компании ${review.company}`} className="testimonial-scan" />
        </a>
        <div className="testimonial-body">
          {(!concise || index === 0) && <p className="testimonial-project">{review.project}</p>}
          <h3>{review.company}</h3>
          {concise && index > 0 ? <details className="testimonial-details"><summary>Читать рекомендацию<span aria-hidden="true">+</span></summary><p className="testimonial-project">{review.project}</p><ReviewText review={review} /></details> : <ReviewText review={review} />}
        </div>
      </article>)}
    </div>
  </section>;
}
