// Behandlingsutbud: två kategorier med områden.
// Fillers: mängd (ml) räknas ut som summan av valda områdens ml-vikt.
// Rynkbehandling (toxin): mängd = antal valda områden.
// Priset hämtas ur pricing_tiers (kategori + kvantitet 1–4).

export type Area = { name: string; ml?: number };

export type Category = {
  key: "fillers" | "toxin";
  title: string;
  unit: string; // singular
  unitPlural: string; // plural
  mode: "ml" | "areas";
  intro: string;
  areas: Area[];
  risks: string;
};

export const categories: Category[] = [
  {
    key: "fillers",
    title: "Fillers",
    unit: "ml",
    unitPlural: "ml",
    mode: "ml",
    intro:
      "Subtil återuppbyggnad av volym och kontur. Mängden (ml) beräknas utifrån de områden du väljer och debiteras per milliliter.",
    areas: [
      { name: "Läppar", ml: 1 },
      { name: "Kindben", ml: 2 },
      { name: "Nasolabialveck", ml: 1 },
      { name: "Marionettlinjer", ml: 1 },
      { name: "Käklinje", ml: 3 },
      { name: "Haka", ml: 1 },
      { name: "Tear troughs (mörka ringar under ögonen)", ml: 1 },
    ],
    risks:
      "Vanliga, oftast övergående biverkningar kan vara svullnad, rodnad, ömhet och blåmärke. Ovanliga men allvarligare komplikationer finns. Fullständig riskinformation ges vid konsultationen, och behandling sker endast om det bedöms lämpligt.",
  },
  {
    key: "toxin",
    title: "Rynkbehandling",
    unit: "område",
    unitPlural: "områden",
    mode: "areas",
    intro:
      "Muskelavslappnande behandling som mjukar upp uttrycksrynkor och kan finjustera proportioner. Priset beräknas efter antal valda områden.",
    areas: [
      { name: "Glabella (”arg-rynkan” mellan ögonbrynen)" },
      { name: "Sura mungipor (marionettlinjer)" },
      { name: "Nästox (avsmalning eller uppnäsa)" },
      { name: "Panna och lätt ögonbrynslyft" },
      { name: "Apelsinhaka och spända hakmuskler" },
      { name: "Käkförminskning" },
      { name: "Lipflip (form på överläppen)" },
      { name: "Traptox / Barbietox" },
      { name: "Nefertiti-halslyft" },
      { name: "Vader (smalare intryck)" },
    ],
    risks:
      "Vanliga, oftast övergående biverkningar kan vara rodnad, svullnad, blåmärke eller huvudvärk. Mer ovanliga reaktioner förekommer. Du får fullständig information vid konsultationen och behandlas endast om det bedöms lämpligt.",
  },
];

export function categoryByKey(key: string): Category | undefined {
  return categories.find((c) => c.key === key);
}

// Beräkna kvantitet från valda områdesnamn:
// fillers -> summan av ml-vikter, rynkbehandling -> antal valda områden.
export function computeQuantity(
  cat: Category,
  selectedNames: string[],
  mlWeights?: Record<string, number>
): number {
  if (cat.mode === "ml") {
    return cat.areas
      .filter((a) => selectedNames.includes(a.name))
      .reduce((sum, a) => sum + (mlWeights?.[a.name] ?? a.ml ?? 0), 0);
  }
  return cat.areas.filter((a) => selectedNames.includes(a.name)).length;
}
