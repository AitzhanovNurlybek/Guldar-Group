import { Container } from "./Container";

export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <section className="pt-24 pb-10 lg:pt-16">
      <Container>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display mt-4 max-w-3xl">{title}</h1>
        {lead && <p className="mt-4 max-w-xl text-lg leading-relaxed text-fg-2">{lead}</p>}
      </Container>
    </section>
  );
}
