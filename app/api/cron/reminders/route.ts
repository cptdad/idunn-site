import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

// Manuell trigger för påminnelser (den schemalagda körningen sker via cron i
// custom-worker.ts). Skyddad med CRON_SECRET.
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  const secret = request.headers.get("x-cron-secret");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Ej behörig." }, { status: 401 });
  }
  const result = await sendReminders(env);
  return NextResponse.json({ ok: true, ...result });
}
