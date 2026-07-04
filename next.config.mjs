/** @type {import('next').NextConfig} */
// basePath styrs av env:
//  - Cloudflare/lokalt: default "/wip"
//  - GitHub Pages: NEXT_PUBLIC_BASE_PATH="/idunn-site" (repo-namnet)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/wip";
const isStatic = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  basePath,
  ...(isStatic
    ? {
        // Statisk export för GitHub Pages
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        // Dynamisk (Cloudflare/lokalt): skicka roten vidare till basePath
        async redirects() {
          return [
            { source: "/", destination: basePath, basePath: false, permanent: false },
          ];
        },
      }),
};

export default nextConfig;

// OpenNext (Cloudflare) – endast i lokal dev, aldrig vid statisk export.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (!isStatic && process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
