import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "О компании" };

export default function AboutPage() {
  return (
    <>
      <PageHeader title="О компании" lead={`${site.legalName} — на рынке с ${site.foundedYear} года.`} />
      <Container className="space-y-4 py-12 text-subtle">
        <p>TODO: история компании.</p>
        <p>TODO: команда, лицензии и допуски.</p>
        <p>TODO: реквизиты (БИН, банк).</p>
      </Container>
    </>
  );
}
