import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexable } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Allow crawling so a preview's noindex meta tag can be read.
    ...(isIndexable ? { sitemap: absoluteUrl("/sitemap.xml") } : {}),
  };
}
