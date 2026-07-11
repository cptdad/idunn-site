"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";

type Booking = { namn: string; datum: string; tid: string; status: string };
type Slot = { id: number; datum: string; tid: string };

export default function Avboka() {
  const [token, setToken] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "reschedule" | "done">("view");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t);
    if (!t) {
      setError("Länk saknas.");
      setLoading(false);
      return;
    }
    fetch(`/api/avboka?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setBooking(d.booking);
        else setError(d.error || "Bokningen hittades inte.");
        setLoading(false);
      })
      .catch(() => {
        setError("Något gick fel.");
        setLoading(false);
      });
  }, []);

  async function loadSlots() {
    const r = await fetch("/api/slots");
    const d = await r.json();
    setSlots(d.slots || []);
  }

  async function doCancel() {
    setBusy(true);
    const r = await fetch("/api/avboka", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "cancel" }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      setMsg("Din tid är avbokad.");
      setMode("done");
    } else setError(d.error || "Kunde inte avboka.");
  }

  async function doReschedule() {
    if (!selected) return;
    setBusy(true);
    const r = await fetch("/api/avboka", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "reschedule", newSlotId: selected }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      setMsg(`Din tid är ombokad till ${d.nar}.`);
      setMode("done");
    } else setError(d.error || "Kunde inte omboka.");
  }

  const byDate: Record<string, Slot[]> = {};
  for (const s of slots) (byDate[s.datum] ||= []).push(s);

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-lg">
        <h1 className="font-serif text-3xl text-ink">Av- eller omboka</h1>

        {loading && <p className="mt-4 text-sm text-ink/60">Hämtar din bokning…</p>}

        {!loading && error && (
          <p className="mt-4 text-sm text-sage-dark">{error}</p>
        )}

        {!loading && booking && mode === "done" && (
          <div className="mt-6 rounded-2xl border border-line bg-cream p-6">
            <p className="text-ink">{msg}</p>
          </div>
        )}

        {!loading && booking && mode === "view" && booking.status === "active" && (
          <div className="mt-6 rounded-2xl border border-line bg-cream p-6">
            <p className="text-ink/80">
              Hej {booking.namn}, din tid är{" "}
              <strong>
                {booking.datum} kl. {booking.tid}
              </strong>{" "}
              (30 min).
            </p>
            <p className="mt-3 text-sm text-ink/60">
              Avbokning senare än 24 timmar före besöket debiteras med 50 % av
              behandlingens pris.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setMode("reschedule");
                  loadSlots();
                }}
                className="rounded-full border border-gold px-6 py-2.5 text-sm text-ink hover:bg-gold hover:text-cream"
              >
                Omboka
              </button>
              <button
                onClick={doCancel}
                disabled={busy}
                className="rounded-full bg-gold px-6 py-2.5 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
              >
                Avboka
              </button>
            </div>
          </div>
        )}

        {!loading && booking && mode === "view" && booking.status !== "active" && (
          <p className="mt-4 text-sm text-ink/60">
            Den här bokningen är redan avbokad.
          </p>
        )}

        {!loading && booking && mode === "reschedule" && (
          <div className="mt-6 rounded-2xl border border-line bg-cream p-6">
            <p className="text-sm font-medium text-ink">Välj en ny tid</p>
            {slots.length === 0 ? (
              <p className="mt-3 text-sm text-ink/60">Inga lediga tider just nu.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {Object.entries(byDate).map(([d, list]) => (
                  <div key={d}>
                    <p className="mb-2 text-xs uppercase tracking-wide text-ink/50">
                      {d}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelected(s.id)}
                          className={`rounded-full border px-4 py-2 text-sm ${
                            selected === s.id
                              ? "border-gold bg-gold text-cream"
                              : "border-line text-ink hover:border-gold"
                          }`}
                        >
                          {s.tid}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setMode("view")}
                className="rounded-full border border-line px-5 py-2.5 text-sm text-ink"
              >
                Tillbaka
              </button>
              <button
                onClick={doReschedule}
                disabled={busy || !selected}
                className="rounded-full bg-gold px-6 py-2.5 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
              >
                Bekräfta ny tid
              </button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
