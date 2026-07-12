import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validatePersonnummer } from "@/lib/personnummer";
import { consultationRequired } from "@/lib/consultation";

export const dynamic = "force-dynamic";

// Avgör om en lagstadgad konsultation (48h) krävs för valda områden.
export async function POST(request: Request) {
  try {
    const { personnummer, areas } = await request.json();
    const v = validatePersonnummer(personnummer || "");
    if (!v.valid) {
      // Utan giltigt personnummer kan vi inte avgöra – kräv konsultation.
      return NextResponse.json({ ok: true, required: true });
    }
    const env = getCloudflareContext().env as any;
    const required = await consultationRequired(
      env,
      v.normalized || "",
      Array.isArray(areas) ? areas : []
    );
    return NextResponse.json({ ok: true, required });
  } catch {
    return NextResponse.json({ ok: true, required: true });
  }
}
