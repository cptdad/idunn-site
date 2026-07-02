import Link from "next/link";
import Container from "@/components/Container";
import Button from "@/components/Button";
import AppleBranch from "@/components/AppleBranch";
import { treatments } from "@/lib/treatments";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-beige/60 blur-3xl" />
        <Container className="relative pt-6 pb-20 md:pt-8 md:pb-28">
          <div className="fade-up mx-auto flex max-w-2xl flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="Iðunn Estetik Stockholm"
              className="mb-8 h-80 w-auto max-w-full md:h-[28rem]"
            />
            <h1 className="max-w-xl text-lg font-normal text-ink/75">
              Naturliga och långsiktiga resultat i en trygg miljö.
            </h1>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Button href="/boka">Boka konsultation</Button>
              <Button href="/behandlingar" variant="outline">
                Se behandlingar
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Filosofi */}
      <section className="bg-beige/40 py-20">
        <Container>
          <AppleBranch className="mb-10" />
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl text-ink md:text-4xl">
              Less is more
            </h2>
            <p className="mt-6 text-lg text-ink/75">
              Vi gör hellre små justeringar över tid än stora förändringar — så
              att du ser ut som dig själv, bara piggare.
            </p>
          </div>
        </Container>
      </section>

      {/* Tre pelare: naturliga resultat, långsiktighet, trygghet */}
      <section className="py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl text-ink md:text-4xl">
              Det vi står för
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                t: "Naturliga resultat",
                d: "Du ska se ut som dig själv — bara piggare och mer utvilad. Aldrig överdrivet, aldrig behandlat.",
              },
              {
                t: "Långsiktighet",
                d: "Vi tänker i år, inte enstaka besök. Små justeringar över tid som bevarar ditt naturliga uttryck.",
              },
              {
                t: "Trygghet",
                d: "Legitimerad sjuksköterska, samma behandlare varje gång och alltid en lugn konsultation först.",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-2xl border border-line bg-cream p-8 text-center transition-shadow hover:shadow-[0_8px_30px_rgba(184,150,90,0.10)]"
              >
                <h3 className="font-serif text-2xl text-ink">{c.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Behandlingar preview */}
      <section className="bg-beige/40 py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl text-ink md:text-4xl">
              Behandlingsområden
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {treatments.map((t) => (
              <Link
                key={t.slug}
                href="/behandlingar"
                className="group rounded-2xl border border-line bg-cream p-7 transition-colors hover:border-gold"
              >
                <h3 className="font-serif text-xl text-ink group-hover:text-gold">
                  {t.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {t.summary}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Medlemskap CTA */}
      <section className="py-24">
        <Container>
          <div className="rounded-3xl border border-line bg-cream px-8 py-14 text-center md:px-16">
            <p className="text-sm uppercase tracking-[0.25em] text-gold">
              Naturligt underhåll
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl text-ink md:text-4xl">
              Ett medlemskap för att fortsätta se ut som dig själv
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-ink/75">
              Bas, Silver och Guld — förmåner och underhåll för dig som vill
              vårda ditt resultat över tid. Alltid utifrån vad du faktiskt
              behöver.
            </p>
            <div className="mt-8">
              <Button href="/naturligt-underhall">Läs om medlemskap</Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
