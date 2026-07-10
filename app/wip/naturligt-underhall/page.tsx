import type { Metadata } from "next";
import Container from "@/components/Container";
import Button from "@/components/Button";
import AppleBranch from "@/components/AppleBranch";

export const metadata: Metadata = {
  title: "Naturligt underhåll — medlemskap",
  description:
    "Iðunn Estetiks medlemskap Naturligt underhåll — ett enda, personligt abonnemang där du och din sköterska tillsammans kommer överens om månadskostnaden utifrån just dina behov.",
};

const steps = [
  {
    n: "1",
    t: "Konsultation",
    d: "Ni går igenom dina önskemål och lägger en lugn, långsiktig plan för ditt underhåll.",
  },
  {
    n: "2",
    t: "Ni sätter beloppet tillsammans",
    d: "Du och din sköterska kommer överens om en månadskostnad som speglar just din plan — varken mer eller mindre.",
  },
  {
    n: "3",
    t: "Löpande underhåll",
    d: "Månadsbeloppet går till dina återkommande behandlingar och medlemsförmåner, med samma behandlare varje gång.",
  },
];

export default function Medlemskap() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Naturligt underhåll
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">
          Ett medlemskap, helt anpassat efter dig
        </h1>
        <p className="mt-5 text-lg text-ink/75">
          Vi tror inte på färdiga paket. Istället har vi ett enda medlemskap,
          där du och din sköterska tillsammans kommer överens om en månadskostnad
          som passar just dina behov och din plan. Beloppet baseras på vad ditt
          underhåll faktiskt kräver — det är aldrig en förbindelse att göra mer
          än du behöver.
        </p>
      </div>

      <AppleBranch className="my-16" />

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-line bg-cream p-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold font-serif text-lg text-gold">
              {s.n}
            </div>
            <h2 className="font-serif text-xl text-ink">{s.t}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">{s.d}</p>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-12 text-center font-serif text-2xl text-ink md:text-3xl">
        Vanligtvis <span className="text-gold">495–2 500 kr/mån</span>
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-ink/60">
        Beloppet sätts alltid individuellt vid konsultationen och kan justeras
        över tid. Betalningslösning för medlemskap lanseras i ett senare skede.
      </p>

      <div className="mt-10 text-center">
        <Button href="/wip/boka">Boka konsultation</Button>
      </div>
    </Container>
  );
}
