import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { services } from "@/lib/site";

export const metadata: Metadata = { title: "Услуги" };

export default function ServicesPage() {
  return (
    <>
      <PageHeader title="Услуги" lead="TODO: вводный абзац об услугах." />
      <Container className="grid gap-4 py-12 sm:grid-cols-2">
        {services.map((s) => (
          <Card key={s.slug} title={s.title} text={s.text} />
        ))}
      </Container>
    </>
  );
}
