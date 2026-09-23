import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { productGroups } from "@/lib/site";

export const metadata: Metadata = { title: "Продукция" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="Продукция" lead="TODO: каталог или прайс по запросу — уточнить у заказчика." />
      <Container className="grid gap-4 py-12 sm:grid-cols-2">
        {productGroups.map((p) => (
          <Card key={p.title} title={p.title} text={p.text} />
        ))}
      </Container>
    </>
  );
}
