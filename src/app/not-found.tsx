import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-bold">Страница не найдена</h1>
      <Link href="/" className="mt-6 inline-block text-accent">
        На главную
      </Link>
    </Container>
  );
}
