"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";

export default function BokaKlar() {
  const [nar, setNar] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`/api/avboka?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.booking)
          setNar(
            `${d.booking.datum} kl. ${d.booking.tid} (${d.booking.duration || 30} min)`
          );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-cream p-8 text-center">
        <h1 className="font-serif text-3xl text-ink">Tack för din betalning</h1>
        <p className="mt-4 text-ink/75">
          {loading
            ? "Bekräftar din bokning…"
            : nar
            ? `Din tid: ${nar}.`
            : "Din bokning behandlas."}
        </p>
        <p className="mt-3 text-sm text-ink/60">
          En bekräftelse skickas till din e-post. Första besöket är alltid en
          lugn genomgång.
        </p>
      </div>
    </Container>
  );
}
