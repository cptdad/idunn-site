import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

// Publik, ofarlig config för klienten (Turnstile site key är avsedd att vara publik).
export async function GET() {
  try {
    const env = getCloudflareContext().env as any;
    return NextResponse.json({
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || "",
    });
  } catch {
    return NextResponse.json({ turnstileSiteKey: "" });
  }
}
