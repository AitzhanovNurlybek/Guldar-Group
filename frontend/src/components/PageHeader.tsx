import { Container } from "./Container";

export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <section className="border-b border-line bg-muted py-12">
      <Container>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-subtle">{lead}</p>}
      </Container>
    </section>
  );
}
