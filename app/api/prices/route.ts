import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { loadTreatmentAreas, groupAreas } from "@/lib/areas";

export const dynamic = "force-dynamic";

// Publik: prislistor (per kategori) + ml-vikter per fillerområde.
export async function GET() {
  try {
    const env = getCloudflareContext().env as any;

    const { results } = await env.DB.prepare(
      "SELECT category, quantity, amount FROM pricing_tiers"
    ).all();
    const tiers: Record<string, Record<number, number>> = {};
    for (const r of results ?? []) {
      (tiers[r.category] ||= {})[r.quantity] = r.amount;
    }

    let timeConfig = { base: 15, per_ml: 10, per_area: 5 };
    try {
      const tc: any = await env.DB.prepare(
        "SELECT base, per_ml, per_area FROM time_config WHERE id = 1"
      ).first();
      if (tc) timeConfig = { base: tc.base, per_ml: tc.per_ml, per_area: tc.per_area };
    } catch {
      // time_config kan saknas innan migrering – använd standard
    }

    // Områden från DB (källa till sanning). Faller tillbaka på gamla tabeller
    // om treatment_areas saknas (innan migrering).
    const mlWeights: Record<string, number> = {};
    const disabledAreas: string[] = [];
    let areas: ReturnType<typeof groupAreas> | undefined;

    const rows = await loadTreatmentAreas(env);
    if (rows) {
      areas = groupAreas(rows);
      for (const r of rows) {
        if (r.category === "fillers") mlWeights[r.name] = r.ml ?? 0;
        if (r.disabled) disabledAreas.push(r.name);
      }
    } else {
      try {
        const mlr = await env.DB.prepare("SELECT area, ml FROM area_ml").all();
        for (const r of mlr.results ?? []) mlWeights[r.area] = r.ml;
      } catch {}
      try {
        const da = await env.DB.prepare("SELECT area FROM disabled_areas").all();
        for (const r of da.results ?? []) disabledAreas.push(r.area);
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      tiers,
      mlWeights,
      timeConfig,
      disabledAreas,
      areas,
    });
  } catch (e) {
    console.error("Fel i /api/prices:", e);
    return NextResponse.json({ ok: false, tiers: {}, mlWeights: {} }, { status: 500 });
  }
}
