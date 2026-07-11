import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validatePersonnummer } from "@/lib/personnummer";

export const dynamic = "force-dynamic";

// Slår upp namn + adress från personnummer.
// Kroken är förberedd: när en uppslagstjänst (t.ex. Roaring) är vald sätter vi
// PNR_LOOKUP_API_KEY som secret och implementerar anropet nedan.
export async function POST(request: Request) {
  try {
    const { personnummer } = await request.json();
    const v = validatePersonnummer(personnummer || "");
    if (!v.valid) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    }

    const env = getCloudflareContext().env as any;
    const apiKey = env.PNR_LOOKUP_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          error: "Uppslag ej aktiverat än — fyll i namn och adress manuellt.",
        },
        { status: 200 }
      );
    }

    // TODO: anropa vald uppslagstjänst med v.normalized och returnera:
    // return NextResponse.json({ ok: true, namn, adress });
    return NextResponse.json(
      { ok: false, configured: true, error: "Uppslag ej implementerat." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}
