import { NextResponse } from "next/server";

// v1: tar emot bokningsförfrågan och loggar den. I v2 kopplas detta till
// databas (Postgres) + e-postbekräftelse (Resend) och admin-kalender.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namn, epost, samtycke } = body ?? {};

    if (!namn || !epost || !samtycke) {
      return NextResponse.json(
        { ok: false, error: "Obligatoriska fält saknas." },
        { status: 400 }
      );
    }

    // TODO v2: spara i databas + skicka bekräftelsemejl.
    console.log("Ny bokningsförfrågan:", { namn, epost });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ogiltig förfrågan." },
      { status: 400 }
    );
  }
}
