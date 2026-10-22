import type { Metadata } from "next";
import { site } from "@/lib/site";

const hostname = new URL(site.url).hostname;
const localHostname = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

export const isIndexable = Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()) &&
  !localHostname &&
  process.env.SITE_NOINDEX !== "true" &&
  (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

export const homeTitle = "Ремонт офисов и магазинов в Алматы — GulDar Group";
export const homeDescription =
  "Строительная компания GulDar Group: ремонт офисов и магазинов под ключ в Алматы. Демонтаж, электрика, сантехника, отделка и поставка материалов. Смета и договор.";

export function absoluteUrl(path = "/") {
  return new URL(path, `${site.url}/`).toString();
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ru_KZ",
      siteName: site.name,
      title: `${title} — ${site.name}`,
      description,
      url: path,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: homeTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${site.name}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export const rootMetadata: Metadata = {
  ...pageMetadata("Ремонт офисов и магазинов в Алматы", homeDescription, "/"),
  metadataBase: new URL(site.url),
  title: { default: homeTitle, template: `%s — ${site.name}` },
  applicationName: site.name,
  robots: isIndexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
    : { index: false, follow: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  "@id": absoluteUrl("/#organization"),
  name: site.name,
  legalName: site.legalName,
  url: absoluteUrl(),
  description: homeDescription,
  telephone: site.phone.replace(/\s/g, ""),
  email: site.email,
  foundingDate: String(site.foundedYear),
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Толе би, 305, офис 27, 2 этаж",
    addressLocality: "Алматы",
    addressCountry: "KZ",
  },
  areaServed: { "@type": "City", name: "Алматы" },
  sameAs: [site.gis, site.satu],
};

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
