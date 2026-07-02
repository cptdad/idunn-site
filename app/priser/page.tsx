import type { Metadata } from "next";
import Container from "@/components/Container";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Priser",
  description:
    "Transparent prisbild hos Iðunn Estetik. Slutligt pris bestäms alltid individuellt vid konsultation.",
};

const rows = [
  { name: "Konsultation", price: "Kostnadsfri / avräknas" },
  { name: "Rynkbehandling, ett område", price: "Prisuppgift vid konsultation" },
  { name: "Harmonisering med fillers", price: "Prisuppgift vid konsultation" },
  { name: "Hudvårdande behandling", price: "Prisuppgift vid konsultation" },
];

export default function Priser() {
  return (
    <Container className="py-20">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Priser
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Prislista</h1>
        <p className="mt-5 text-lg text-ink/75">
          Vi tror på transparens. Eftersom varje behandling bedöms individuellt
          bekräftas slutligt pris alltid vid din konsultation, innan något
          utförs.
        </p>
      </div>

      <div className="mt-12 overflow-hidden rounded-2xl border border-line">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center justify-between px-6 py-5 ${
              i % 2 === 0 ? "bg-cream" : "bg-beige/40"
            }`}
          >
            <span className="text-ink">{r.name}</span>
            <span className="text-sm text-ink/70">{r.price}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-ink/60">
        Prisuppgifter fylls i när klinikens tjänster fastställts. Denna sida är
        en mall.
      </p>

      <div className="mt-10">
        <Button href="/boka">Boka konsultation</Button>
      </div>
    </Container>
  );
}
