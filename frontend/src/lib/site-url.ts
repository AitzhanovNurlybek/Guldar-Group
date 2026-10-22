/** One canonical origin for metadata, structured data and the sitemap. */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return "http://localhost:3000";

  const url = new URL(configured);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash || url.pathname !== "/"
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, query or credentials.");
  }
  return url.origin;
}

export const siteUrl = resolveSiteUrl();
