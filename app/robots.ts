import type { MetadataRoute } from "next";

// Tills vidare: blockera all indexering. Ändra till "allow: '/'" vid lansering.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
