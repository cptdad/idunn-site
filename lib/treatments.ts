export type Treatment = {
  slug: string;
  title: string;
  summary: string;
  about: string;
  suitableFor: string;
  risks: string;
};

// OBS: Vi marknadsför inte receptbelagda läkemedel (t.ex. botulinumtoxin) mot
// allmänheten. Vi beskriver behandlingsområden sakligt och inkluderar
// riskinformation. Detta är ett medvetet juridiskt val (se webbplanen).
export const treatments: Treatment[] = [
  {
    slug: "rynkbehandling",
    title: "Rynkbehandling i övre ansiktet",
    summary:
      "Mjukar upp uttrycksrynkor i panna, mellan ögonbrynen och kring ögonen för ett vilat intryck.",
    about:
      "En bedömning görs alltid individuellt. Målet är ett naturligt resultat där dina uttryck bevaras — inte ett fryst ansikte.",
    suitableFor:
      "Du som vill dämpa uttrycksrynkor diskret och behålla ett naturligt ansiktsuttryck.",
    risks:
      "Vanliga, oftast övergående biverkningar kan vara rodnad, svullnad, blåmärke eller huvudvärk. Mer ovanliga reaktioner förekommer. Du får fullständig information vid konsultationen och behandlas endast om det bedöms lämpligt.",
  },
  {
    slug: "harmonisering",
    title: "Harmonisering med fillers",
    summary:
      "Subtil återuppbyggnad av volym och kontur där tid eller genetik gett ett tröttare intryck.",
    about:
      "Vi arbetar återhållsamt och långsiktigt. Ibland är rätt råd att avvakta eller att göra mindre än du tänkt — det säger vi i så fall.",
    suitableFor:
      "Du som söker en diskret förbättring med bibehållet naturligt uttryck.",
    risks:
      "Vanliga, oftast övergående biverkningar kan vara svullnad, rodnad, ömhet och blåmärke. Ovanliga men allvarligare komplikationer finns. Fullständig riskinformation ges vid konsultationen.",
  },
  {
    slug: "hudvard",
    title: "Hudvårdande behandlingar",
    summary:
      "Behandlingar som stärker hudkvalitet och lyster som del av ett långsiktigt underhåll.",
    about:
      "Hudens kvalitet är grunden. Vi ser behandling som underhåll över tid snarare än enstaka stora ingrepp.",
    suitableFor: "Du som vill vårda hudens kvalitet och lyster över tid.",
    risks:
      "Övergående rodnad och känslighet kan förekomma. Lämplighet bedöms individuellt vid konsultationen.",
  },
  {
    slug: "konsultation",
    title: "Konsultation",
    summary:
      "Alltid första steget. En lugn genomgång av dina önskemål, förutsättningar och realistiska resultat.",
    about:
      "Första besöket är en konsultation, inte en garanterad behandling. Ibland är vårt bästa råd att inte behandla alls.",
    suitableFor: "Alla som funderar. Utan förpliktelse.",
    risks:
      "Ingen behandling utförs utan att du fått fullständig information om nytta, alternativ och risker.",
  },
];
