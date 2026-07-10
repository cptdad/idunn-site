/** @type {import('next').NextConfig} */
// Sidan vi bygger ligger under /wip (via app/wip). Roten är en "kommer snart"-sida.
// basePath används numera bara för GitHub Pages (NEXT_PUBLIC_BASE_PATH="/idunn-site").
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const isStatic = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  ...(isStatic
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;

// OpenNext (Cloudflare) – endast i lokal dev.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (!isStatic && process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
