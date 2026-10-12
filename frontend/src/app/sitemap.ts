import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Список страниц для поисковиков. Добавили новую страницу в src/app/<путь>/page.tsx — впишите её сюда.
const PATHS = ["", "/uslugi", "/produkciya", "/o-kompanii", "/kontakty"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
