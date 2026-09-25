import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="grid min-h-[70dvh] place-items-center pt-24 text-center lg:pt-0">
      <div>
        <p className="eyebrow">Ошибка 404</p>
        <h1 className="display mt-3">
          Такой страницы нет
        </h1>
        <Link href="/" className="btn btn-primary mt-8">
          На главную
        </Link>
      </div>
    </Container>
  );
}
