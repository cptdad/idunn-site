// Delad regel för lagstadgad konsultation (48h).
// Konsultation krävs om kunden är ny (inget tidigare bekräftat besök) eller om
// något valt område inte behandlats de senaste sex månaderna.

export function parseAreas(omrade: string): string[] {
  const after = (omrade || "").split(": ")[1] || "";
  const names = after.split(" (")[0] || "";
  return names
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function consultationRequired(
  env: any,
  normalizedPnr: string,
  currentAreas: string[],
  excludeBookingId?: number
): Promise<boolean> {
  if (!normalizedPnr) return true;
  try {
    const stmt =
      excludeBookingId != null
        ? env.DB.prepare(
            "SELECT omrade, datum FROM bookings WHERE personnummer = ? AND status = 'active' AND id != ?"
          ).bind(normalizedPnr, excludeBookingId)
        : env.DB.prepare(
            "SELECT omrade, datum FROM bookings WHERE personnummer = ? AND status = 'active'"
          ).bind(normalizedPnr);
    const { results } = await stmt.all();
    const prior = results ?? [];
    if (prior.length === 0) return true; // ny kund

    const sixMonthsAgo = new Date(Date.now() - 182 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const treated = new Set<string>();
    for (const p of prior) {
      if (p.datum >= sixMonthsAgo) {
        for (const a of parseAreas(p.omrade)) treated.add(a);
      }
    }
    return currentAreas.some((a) => !treated.has(a)); // nytt/olämnat område
  } catch {
    return true; // vid osäkerhet: kräv konsultation
  }
}
