import localFont from "next/font/local";
export const bodyCyrillic = localFont({ src: "../../public/fonts/manrope-cyrillic-optimized.woff2", variable: "--font-body-cyr", display: "swap", weight: "400 800", adjustFontFallback: false });
export const bodyLatin = localFont({ src: "../../public/fonts/manrope-latin-optimized.woff2", variable: "--font-body-latin", display: "swap", weight: "400 800", adjustFontFallback: "Arial" });
export const displayCyrillic = localFont({ src: "../../public/fonts/montserrat-cyrillic-optimized.woff2", variable: "--font-heading-cyr", display: "swap", weight: "600 800", adjustFontFallback: false });
