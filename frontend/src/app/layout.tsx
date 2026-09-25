import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Sidebar, WhatsAppFab } from "@/components/Sidebar";
import { SceneBackground } from "@/components/three/SceneBackground";
import { site } from "@/lib/site";
import "./globals.css";

// Современный гротеск с кириллицей — и для текста, и для заголовков
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: { default: `${site.name} — ${site.tagline.toLowerCase()}`, template: `%s — ${site.name}` },
  description:
    "Ремонт под ключ, электромонтаж, сантехника и техническое обслуживание офисов, магазинов и складов в Алматы. Договор и гарантия. С 2015 года.",
};

export const viewport: Viewport = {
  themeColor: "#08111b",
};

// Карточка компании для поисковиков и карт
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  name: site.name,
  legalName: site.legalName,
  description: site.tagline,
  telephone: `+${site.whatsapp}`,
  email: site.email,
  foundingDate: String(site.foundedYear),
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Толе би, 305, офис 27",
    addressLocality: "Алматы",
    postalCode: "050031",
    addressCountry: "KZ",
  },
  openingHours: "Mo-Su 09:00-20:00",
  areaServed: "Алматы",
  sameAs: [site.gis, site.satu],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <SceneBackground />
        <Sidebar />
        <div className="relative z-10 flex min-h-dvh flex-col lg:pl-[7.25rem]">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <WhatsAppFab />
      </body>
    </html>
  );
}
