import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexable } from "@/lib/seo";
import { serviceDetails } from "@/lib/service-details";

const PATHS = ["/", "/uslugi", "/produkciya", "/o-kompanii", "/kontakty"];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexable) return [];

  // lastModified must reflect a real content edit, not the date of every build.
  return [...PATHS, ...serviceDetails.map(({ slug }) => `/uslugi/${slug}`)]
    .map((path) => ({ url: absoluteUrl(path) }));
}
