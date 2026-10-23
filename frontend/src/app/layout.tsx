import type { Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Sidebar, WhatsAppFab } from "@/components/Sidebar";
import { SceneBackground } from "@/components/scene/SceneBackground";
import { MotionEffects } from "@/components/MotionEffects";
import { rootMetadata, organizationJsonLd, serializeJsonLd } from "@/lib/seo";
import { bodyCyrillic, bodyLatin, displayCyrillic } from "./fonts";
import "./globals.css";

export const metadata = rootMetadata;
export const viewport: Viewport = { themeColor: "#f6f8f7" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`antialiased ${bodyCyrillic.variable} ${bodyLatin.variable} ${displayCyrillic.variable}`}>
      <body className="min-h-dvh font-sans">
        <a href="#main-content" className="skip-link">Перейти к содержимому</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }} />
        <SceneBackground />
        <MotionEffects />
        <Sidebar />
        <div className="site-shell relative z-10 flex min-h-dvh flex-col pt-[72px] lg:pt-[88px]">
          <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
          <Footer />
        </div>
        <WhatsAppFab />
      </body>
    </html>
  );
}
