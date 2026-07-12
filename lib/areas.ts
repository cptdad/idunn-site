// Delad server-logik för behandlingsområden som lagras i D1 (treatment_areas).
// Källa till sanning för både bokningssidan (via /api/prices) och /api/boka.

export type AreaRow = {
  id?: number;
  category: string; // 'fillers' | 'toxin'
  name: string;
  ml: number | null;
  disabled: boolean;
};

// Läs alla områden. Returnerar null om tabellen saknas (innan migrering) så att
// anropande kod kan falla tillbaka på det gamla beteendet.
export async function loadTreatmentAreas(env: any): Promise<AreaRow[] | null> {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, category, name, ml, disabled FROM treatment_areas ORDER BY category, sort, id"
    ).all();
    if (!results || results.length === 0) return null;
    return results.map((r: any) => ({
      id: r.id,
      category: r.category,
      name: r.name,
      ml: r.ml ?? null,
      disabled: !!r.disabled,
    }));
  } catch {
    return null;
  }
}

// Gruppera för publikt bruk (endast aktiva/av-flaggan skickas med).
export function groupAreas(rows: AreaRow[]) {
  return {
    fillers: rows
      .filter((r) => r.category === "fillers")
      .map((r) => ({ name: r.name, ml: r.ml ?? 0, disabled: r.disabled })),
    toxin: rows
      .filter((r) => r.category === "toxin")
      .map((r) => ({ name: r.name, disabled: r.disabled })),
  };
}

// Räkna ut mängder från valda namn utifrån DB-områdena (endast aktiva räknas).
export function quantitiesFromRows(
  rows: AreaRow[],
  fillerAreas: string[],
  toxinAreas: string[]
): { fillerMl: number; toxinCount: number; invalid: boolean } {
  const mlMap = new Map<string, number>();
  const toxinSet = new Set<string>();
  for (const r of rows) {
    if (r.disabled) continue;
    if (r.category === "fillers") mlMap.set(r.name, r.ml ?? 0);
    else if (r.category === "toxin") toxinSet.add(r.name);
  }
  const invalid =
    fillerAreas.some((n) => !mlMap.has(n)) ||
    toxinAreas.some((n) => !toxinSet.has(n));
  const fillerMl = fillerAreas.reduce((s, n) => s + (mlMap.get(n) ?? 0), 0);
  const toxinCount = toxinAreas.filter((n) => toxinSet.has(n)).length;
  return { fillerMl, toxinCount, invalid };
}
