import type { Metadata } from "next";
import Container from "@/components/Container";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Naturligt underhåll — medlemskap",
  description:
    "Medlemskapen Bas, Silver och Guld hos Iðunn Estetik. Förmåner och långsiktigt underhåll — utifrån vad du faktiskt behöver.",
};

const tiers = [
  {
    name: "Iðunn Bas",
    price: "från 799 kr/mån",
    points: [
      "Förmåner för löpande underhåll",
      "Prioriterad bokning",
      "Årlig hudgenomgång",
    ],
  },
  {
    name: "Iðunn Silver",
    price: "medlemsnivå",
    featured: true,
    points: [
      "Allt i Bas",
      "Utökade medlemsförmåner",
      "Rådgivning om långsiktig plan",
    ],
  },
  {
    name: "Iðunn Guld",
    price: "medlemsnivå",
    points: [
      "Allt i Silver",
      "Mest omfattande förmåner",
      "Flexibelt underhåll över året",
    ],
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
          Medlemskap för långsiktigt underhåll
        </h1>
        <p className="mt-5 text-lg text-ink/75">
          Ett återkommande månadsupplägg som ger förmåner och gör underhåll
          över tid enkelt. Medlemskapet är ett förmånsupplägg — det är aldrig en
          förbindelse att genomföra fler behandlingar än du behöver.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-8 ${
              t.featured
                ? "border-gold bg-cream shadow-[0_8px_30px_rgba(184,150,90,0.12)]"
                : "border-line bg-cream"
            }`}
          >
            <h2 className="font-serif text-2xl text-ink">{t.name}</h2>
            <p className="mt-1 text-gold">{t.price}</p>
            <ul className="mt-5 space-y-2 text-sm text-ink/75">
              {t.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-gold">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink/60">
        Exakta priser och villkor presenteras vid konsultation. Betalningslösning
        för medlemskap lanseras i ett senare skede.
      </p>

      <div className="mt-10 text-center">
        <Button href="/boka">Boka konsultation</Button>
      </div>
    </Container>
  );
}
