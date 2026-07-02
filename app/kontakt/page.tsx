import type { Metadata } from "next";
import Container from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakta Iðunn Estetik i Stockholm, nära Gullmarsplan. Öppettider och kontaktuppgifter.",
};

export default function Kontakt() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Kontakt
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">
          Hitta till oss
        </h1>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-8">
          <h2 className="font-serif text-2xl text-ink">Klinik</h2>
          <p className="mt-3 text-ink/75">{site.areaHint}</p>
          <p className="mt-4 text-sm text-ink/70">Exakt adress meddelas här.</p>
          <p className="mt-6 text-ink/80">{site.email}</p>
        </div>
        <div className="rounded-2xl border border-line bg-cream p-8">
          <h2 className="font-serif text-2xl text-ink">Öppettider</h2>
          <ul className="mt-3 space-y-1 text-ink/75">
            <li>Måndag–fredag: enligt bokning</li>
            <li>Lördag: enligt bokning</li>
            <li>Söndag: stängt</li>
          </ul>
        </div>
      </div>
    </Container>
  );
}
