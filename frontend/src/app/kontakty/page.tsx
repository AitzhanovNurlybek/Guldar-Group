import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Контакты" };

export default function ContactsPage() {
  return (
    <>
      <PageHeader title="Контакты" />
      <Container className="grid gap-10 py-12 md:grid-cols-2">
        <div className="space-y-2">
          <p>
            <span className="text-subtle">Адрес:</span> {site.address}
          </p>
          <p>
            <span className="text-subtle">Телефон:</span> {site.phone}
          </p>
          <p>
            <span className="text-subtle">Email:</span> {site.email}
          </p>
          <p>
            <span className="text-subtle">Режим работы:</span> {site.hours}
          </p>
          {/* TODO: карта 2GIS */}
        </div>
        <ContactForm />
      </Container>
    </>
  );
}
