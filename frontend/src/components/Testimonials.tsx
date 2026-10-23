import Image from "next/image";
import { testimonials } from "@/lib/testimonials";
import { SectionHead } from "./Container";
import { Icon } from "./Icons";

export function Testimonials() {
  return <section id="otzyvy" className="testimonials-section scroll-mt-28" aria-label="Отзывы заказчиков">
    <SectionHead eyebrow="Отзывы заказчиков" title="За нашей работой — реальные объекты" lead="Письма от компаний, для которых мы выполняли ремонт. Откройте документ, чтобы прочитать отзыв целиком." />
    <div className="testimonials-list">
      {testimonials.map((review) => <article key={review.id} className="testimonial">
        <a className="testimonial-document" href={`/reviews/${review.id}.pdf`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть оригинал отзыва: ${review.company}, PDF`}>
          <Image src={`/reviews/${review.id}.webp`} width={240} height={340} sizes="(max-width: 639px) 80px, 140px" alt={`Скан письма от компании ${review.company}`} className="testimonial-scan" />
        </a>
        <div className="testimonial-body">
          <p className="testimonial-project">{review.project}</p>
          <h3>{review.company}</h3>
          <blockquote><p>«{review.quote}»</p></blockquote>
          <p className="testimonial-attribution">{review.attribution}</p>
          <a href={`/reviews/${review.id}.pdf`} target="_blank" rel="noopener noreferrer" className="text-link">Читать письмо<Icon name="arrowUpRight" className="size-4" /><span className="text-xs font-medium text-fg-3">PDF</span></a>
        </div>
      </article>)}
    </div>
  </section>;
}
