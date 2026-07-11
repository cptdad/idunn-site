"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { categories } from "@/lib/treatments";

type Tiers = Record<string, Record<number, number>>;

export default function Priser() {
  const [tiers, setTiers] = useState<Tiers>({});

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => setTiers(d.tiers || {}))
      .catch(() => setTiers({}));
  }, []);

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Priser
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Prislista</h1>
        <p className="mt-5 text-lg text-ink/75">
          Fillers debiteras per milliliter och toxin per behandlat område.
          Slutligt upplägg bekräftas alltid vid din konsultation.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {categories.map((c) => {
          const rows = tiers[c.key] || {};
          return (
            <div
              key={c.key}
              className="overflow-hidden rounded-2xl border border-line"
            >
              <div className="border-b border-line bg-beige/40 px-6 py-4">
                <h2 className="font-serif text-xl text-ink">{c.title}</h2>
                <p className="text-xs text-ink/50">Pris per {c.unit}</p>
              </div>
              {[1, 2, 3, 4].map((q, i) => (
                <div
                  key={q}
                  className={`flex items-center justify-between px-6 py-4 ${
                    i % 2 === 0 ? "bg-cream" : "bg-beige/20"
                  }`}
                >
                  <span className="text-ink">
                    {q} {q === 1 ? c.unit : c.unitPlural}
                  </span>
                  <span className="text-sm text-ink/70">
                    {rows[q] != null
                      ? `${rows[q].toLocaleString("sv-SE")} kr`
                      : "–"}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-ink/60">
        Fler områden eller större mängd? Det tar vi vid konsultationen.
      </p>

      <div className="mt-10 text-center">
        <Button href="/wip/boka">Boka tid</Button>
      </div>
    </Container>
  );
}
