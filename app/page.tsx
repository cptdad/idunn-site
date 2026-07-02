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
        <Container className="relative py-24 md:py-32">
          <div className="fade-up max-w-2xl">
            <p className="mb-5 text-sm uppercase tracking-[0.25em] text-gold">
              Estetik i Stockholm
            </p>
            <h1 className="font-serif text-5xl leading-tight text-ink md:text-6xl">
              Se pigg, utvilad och fräsch ut — inte behandlad.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/75">
              En lugn klinik för naturliga resultat och långsiktigt underhåll.
              Vi behandlar aldrig mer än vad som behövs — och säger ibland nej.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
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
              Naturligt, harmoniskt, långsiktigt
            </h2>
            <p className="mt-6 text-lg text-ink/75">
              Iðunn var i fornnordisk tro väktaren av ungdomens äpplen — en
              symbol för förnyelse och bevarande. Vår filosofi är densamma:
              subtilt underhåll över tid framför stora förändringar.
            </p>
          </div>
        </Container>
      </section>

      {/* USP */}
      <section className="py-20">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                t: "Naturliga resultat",
                d: "Målet är att du ser ut som dig själv — bara piggare och mer utvilad.",
              },
              {
                t: "Medicinsk trygghet",
                d: "Behandlingar utförs av legitimerad sjuksköterska med utbildning och erfarenhet.",
              },
              {
                t: "Ingen överbehandling",
                d: "Vi gör aldrig mer än vad som krävs, och avråder när behandling inte behövs.",
              },
              {
                t: "Samma behandlare",
                d: "Du träffar samma person varje gång och bygger en trygg relation över tid.",
              },
              {
                t: "Alltid konsultation först",
                d: "Första besöket är en genomgång — inte en garanterad behandling.",
              },
              {
                t: "Långsiktigt underhåll",
                d: "Fokus på hudens kvalitet och harmoni över år, inte enstaka ingrepp.",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-2xl border border-line bg-cream p-7 transition-shadow hover:shadow-[0_8px_30px_rgba(184,150,90,0.10)]"
              >
                <h3 className="font-serif text-xl text-ink">{c.t}</h3>
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
          <div className="mb-12 flex items-end justify-between">
            <h2 className="font-serif text-3xl text-ink md:text-4xl">
              Behandlingsområden
            </h2>
            <Link
              href="/behandlingar"
              className="link-underline hidden text-sm text-gold md:inline"
            >
              Alla behandlingar
            </Link>
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
