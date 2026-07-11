import type { Metadata } from "next";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Blogg",
  description:
    "Kunskap och tankar om naturlig estetik, trygghet och långsiktigt underhåll från Iðunn Estetik.",
};

const posts = [
  {
    title: "Vad betyder ett naturligt resultat egentligen?",
    excerpt:
      "Om skillnaden mellan att se utvilad ut och att se behandlad ut — och varför mindre ofta är mer.",
  },
  {
    title: "Därför börjar allt med en konsultation",
    excerpt:
      "En genomgång innan behandling handlar om trygghet, realistiska förväntningar och rätt beslut.",
  },
  {
    title: "Långsiktigt underhåll framför stora förändringar",
    excerpt:
      "Hur ett lugnt, återkommande underhåll bevarar ett naturligt uttryck över tid.",
  },
];

export default function Blogg() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Blogg
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">
          Kunskap & tankar
        </h1>
        <p className="mt-5 text-lg text-ink/75">
          Artiklar om naturlig estetik och trygghet. (Exempelinnehåll — riktiga
          artiklar läggs till i nästa steg.)
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <article
            key={p.title}
            className="rounded-2xl border border-line bg-cream p-7"
          >
            <h2 className="font-serif text-xl text-ink">{p.title}</h2>
            <p className="mt-3 text-sm text-ink/70">{p.excerpt}</p>
            <span className="mt-4 inline-block text-sm text-gold">
              Kommer snart
            </span>
          </article>
        ))}
      </div>
    </Container>
  );
}
