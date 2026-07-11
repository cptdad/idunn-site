import type { Metadata } from "next";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { categories } from "@/lib/treatments";

export const metadata: Metadata = {
  title: "Behandlingar",
  description:
    "Behandlingsutbud hos Iðunn Estetik i Stockholm: fillers och toxin. Saklig information med fokus på naturliga resultat, trygghet och realistiska förväntningar.",
};

export default function Behandlingar() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Behandlingar
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">
          Vårt behandlingsutbud
        </h1>
        <p className="mt-5 text-lg text-ink/75">
          Vi arbetar återhållsamt och långsiktigt. All bedömning sker individuellt
          vid en konsultation, och vi behandlar bara när det är lämpligt.
        </p>
      </div>

      <div className="mt-14 space-y-8">
        {categories.map((c) => (
          <article
            key={c.key}
            className="rounded-2xl border border-line bg-cream p-8"
          >
            <h2 className="font-serif text-2xl text-ink">{c.title}</h2>
            <p className="mt-2 text-ink/80">{c.intro}</p>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-ink">Områden vi behandlar</p>
                <ul className="mt-2 space-y-1 text-sm text-ink/70">
                  {c.areas.map((a) => (
                    <li key={a} className="flex gap-2">
                      <span className="text-gold">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  Risker & viktig information
                </p>
                <p className="mt-2 text-sm text-ink/70">{c.risks}</p>
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

      <div className="mt-10 text-center">
        <Button href="/wip/boka">Boka tid</Button>
      </div>
    </Container>
  );
}
