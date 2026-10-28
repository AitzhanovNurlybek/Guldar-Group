import type { Metadata } from "next";
import { serviceGroups, site } from "@/lib/site";

const hostname = new URL(site.url).hostname;
const localHostname = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

export const isIndexable = !localHostname &&
  process.env.SITE_NOINDEX !== "true" &&
  (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

export const homeTitle = "Ремонт офисов и магазинов под ключ в Алматы — GulDar Group";
export const homeDescription =
  "Ремонт офисов, магазинов, кафе и складов под ключ в Алматы с 2015 года. Проектирование, дизайн-проект, электрика, сантехника, отделка и поставка материалов. Смета и договор до начала работ.";

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
  ...pageMetadata("Ремонт офисов и магазинов под ключ в Алматы", homeDescription, "/"),
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

const organization = {
  "@type": "GeneralContractor",
  "@id": absoluteUrl("/#organization"),
  name: site.name,
  legalName: site.legalName,
  url: absoluteUrl(),
  logo: absoluteUrl("/icon.svg"),
  image: absoluteUrl("/opengraph-image"),
  description: homeDescription,
  telephone: site.phone.replace(/\s/g, ""),
  contactPoint: { "@type": "ContactPoint", telephone: site.technicalTel, contactType: "technical support", availableLanguage: "Russian" },
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
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Услуги GulDar Group",
    itemListElement: serviceGroups.flatMap((group) => group.items).map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.title, description: service.text },
    })),
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    organization,
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: site.name,
      url: absoluteUrl(),
      inLanguage: "ru",
      publisher: { "@id": absoluteUrl("/#organization") },
    },
  ],
};

export function breadcrumbJsonLd(name: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: absoluteUrl() },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
