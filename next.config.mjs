/** @type {import('next').NextConfig} */
// Under utvecklingstiden ligger sidan under /wip.
// Vid skarp lansering på roten: ta bort basePath och redirect nedan.
const nextConfig = {
  reactStrictMode: true,
  basePath: "/wip",
  async redirects() {
    return [
      // Skicka bara-domänen (roten) vidare till /wip
      { source: "/", destination: "/wip", basePath: false, permanent: false },
    ];
  },
};
export default nextConfig;

// OpenNext (Cloudflare) – gör Cloudflare-bindings tillgängliga under `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
