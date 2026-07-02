import type { Metadata } from "next";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { treatments } from "@/lib/treatments";

export const metadata: Metadata = {
  title: "Behandlingar",
  description:
    "Behandlingsområden hos Iðunn Estetik i Stockholm. Saklig information med fokus på naturliga resultat, trygghet och realistiska förväntningar.",
};

export default function Behandlingar() {
  return (
    <Container className="py-20">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Behandlingar
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">
          Behandlingsområden
        </h1>
        <p className="mt-5 text-lg text-ink/75">
          Vi beskriver våra behandlingar sakligt och behandlar bara när det är
          lämpligt. All bedömning sker individuellt vid en konsultation.
        </p>
      </div>

      <div className="mt-14 space-y-8">
        {treatments.map((t) => (
          <article
            key={t.slug}
            className="rounded-2xl border border-line bg-cream p-8"
          >
            <h2 className="font-serif text-2xl text-ink">{t.title}</h2>
            <p className="mt-3 text-ink/80">{t.about}</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-ink">Passar dig som</p>
                <p className="mt-1 text-sm text-ink/70">{t.suitableFor}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  Risker & viktig information
                </p>
                <p className="mt-1 text-sm text-ink/70">{t.risks}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-line bg-beige/50 p-8 text-sm text-ink/70">
        Estetiska injektionsbehandlingar utförs endast av legitimerad
        vårdpersonal och aldrig på personer under 18 år. Denna sida är allmän
        information och inte en uppmaning till behandling.
      </div>

      <div className="mt-10">
        <Button href="/boka">Boka konsultation</Button>
      </div>
    </Container>
  );
}
