import { Container } from "./Container";

export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <section className="pt-24 pb-10 lg:pt-16">
      <Container>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display mt-3 max-w-4xl">
          <span className="gradient-text">{title}</span>
        </h1>
        {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-2">{lead}</p>}
      </Container>
    </section>
  );
}
