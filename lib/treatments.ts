// Behandlingsutbud: två kategorier med områden.
// Fillers prissätts per ml, Toxin per behandlat område (se pricing_tiers i DB).

export type Category = {
  key: "fillers" | "toxin";
  title: string;
  unit: string; // singular, t.ex. "ml" eller "område"
  unitPlural: string; // plural, t.ex. "ml" eller "områden"
  intro: string;
  areas: string[];
  risks: string;
};

export const categories: Category[] = [
  {
    key: "fillers",
    title: "Fillers",
    unit: "ml",
    unitPlural: "ml",
    intro:
      "Subtil återuppbyggnad av volym och kontur där tid eller genetik gett ett tröttare intryck. Debiteras per milliliter.",
    areas: [
      "Läppar",
      "Kindben",
      "Nasolabialveck",
      "Marionettlinjer",
      "Käklinje",
      "Haka",
      "Tear troughs (mörka ringar under ögonen)",
    ],
    risks:
      "Vanliga, oftast övergående biverkningar kan vara svullnad, rodnad, ömhet och blåmärke. Ovanliga men allvarligare komplikationer finns. Fullständig riskinformation ges vid konsultationen, och behandling sker endast om det bedöms lämpligt.",
  },
  {
    key: "toxin",
    title: "Toxin",
    unit: "område",
    unitPlural: "områden",
    intro:
      "Muskelavslappnande behandling som mjukar upp uttrycksrynkor och kan finjustera proportioner. Debiteras per behandlat område.",
    areas: [
      "Glabella (”arg-rynkan” mellan ögonbrynen)",
      "Sura mungipor (marionettlinjer)",
      "Nästox (avsmalning eller uppnäsa)",
      "Panna och lätt ögonbrynslyft",
      "Apelsinhaka och spända hakmuskler",
      "Käkförminskning",
      "Lipflip (form på överläppen)",
      "Traptox / Barbietox",
      "Nefertiti-halslyft",
      "Vader (smalare intryck)",
    ],
    risks:
      "Vanliga, oftast övergående biverkningar kan vara rodnad, svullnad, blåmärke eller huvudvärk. Mer ovanliga reaktioner förekommer. Du får fullständig information vid konsultationen och behandlas endast om det bedöms lämpligt.",
  },
];

export function categoryByKey(key: string): Category | undefined {
  return categories.find((c) => c.key === key);
}
