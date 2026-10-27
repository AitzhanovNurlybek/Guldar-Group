/** One canonical origin for metadata, structured data and the sitemap. */
function parseOrigin(value: string): URL {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash || url.pathname !== "/"
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, query or credentials.");
  }
  return url;
}

function resolveSiteUrl(): string {
  const production = process.env.VERCEL_ENV === "production";
  const fallback = production
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || "guldar-group.vercel.app"}`
    : "http://localhost:3000";
  const url = parseOrigin(process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallback);
  if (production && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    return parseOrigin(fallback).origin;
  }
  return url.origin;
}

export const siteUrl = resolveSiteUrl();
