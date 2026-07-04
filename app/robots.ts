import type { MetadataRoute } from "next";

// Krävs för statisk export (GitHub Pages) – gör robots.txt till en statisk fil.
export const dynamic = "force-static";

// Tills vidare: blockera all indexering. Ändra till "allow: '/'" vid lansering.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
