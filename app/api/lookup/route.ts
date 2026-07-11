import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fristående personnummeruppslag är avstängt av säkerhetsskäl.
// Uppslaget sker nu serverside, bundet till en verifierad bokning i /api/boka.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Ej tillgängligt." },
    { status: 410 }
  );
}
