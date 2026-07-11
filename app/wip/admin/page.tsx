"use client";

import { useState } from "react";
import Container from "@/components/Container";

type Slot = { id: number; datum: string; tid: string; status: string };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Formulärfält
  const [datum, setDatum] = useState("");
  const [tid, setTid] = useState("");
  const [start, setStart] = useState("");
  const [slut, setSlut] = useState("");

  async function api(method: string, body?: any, query = "") {
    const res = await fetch(`/api/admin/slots${query}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res;
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await api("GET");
    setBusy(false);
    if (res.status === 401) {
      setError("Fel lösenord.");
      return;
    }
    const data = await res.json();
    setSlots(data.slots || []);
    setUnlocked(true);
  }

  async function refresh() {
    const res = await api("GET");
    const data = await res.json();
    setSlots(data.slots || []);
  }

  async function addSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!datum || !tid) return;
    setBusy(true);
    await api("POST", { datum, tid });
    setTid("");
    await refresh();
    setBusy(false);
  }

  async function addRange(e: React.FormEvent) {
    e.preventDefault();
    if (!datum || !start || !slut) return;
    setBusy(true);
    await api("POST", { datum, start, slut });
    await refresh();
    setBusy(false);
  }

  async function del(id: number) {
    setBusy(true);
    await api("DELETE", undefined, `?id=${id}`);
    await refresh();
    setBusy(false);
  }

  if (!unlocked) {
    return (
      <Container className="py-24">
        <form onSubmit={unlock} className="mx-auto max-w-sm text-center">
          <h1 className="font-serif text-3xl text-ink">Admin</h1>
          <p className="mt-3 text-sm text-ink/60">
            Ange lösenord för att hantera tider.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord"
            className="mt-6 w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-full bg-gold px-8 py-3 text-cream hover:bg-gold-light disabled:opacity-60"
          >
            {busy ? "Loggar in…" : "Logga in"}
          </button>
          {error && <p className="mt-4 text-sm text-sage-dark">{error}</p>}
        </form>
      </Container>
    );
  }

  // Gruppera per datum
  const byDate: Record<string, Slot[]> = {};
  for (const s of slots) {
    (byDate[s.datum] ||= []).push(s);
  }

  return (
    <Container className="py-16">
      <h1 className="font-serif text-3xl text-ink">Hantera tider</h1>
      <p className="mt-2 text-sm text-ink/60">
        Varje tid är 30 minuter. Lediga tider visas för kunder på bokningssidan.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Lägg till enstaka tid */}
        <form
          onSubmit={addSingle}
          className="rounded-2xl border border-line bg-cream p-6"
        >
          <h2 className="font-serif text-xl text-ink">Lägg till en tid</h2>
          <label className="mt-4 block text-sm text-ink/80">Datum</label>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          />
          <label className="mt-3 block text-sm text-ink/80">Tid (HH:MM)</label>
          <input
            type="time"
            step={1800}
            value={tid}
            onChange={(e) => setTid(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
          >
            Lägg till
          </button>
        </form>

        {/* Generera intervall */}
        <form
          onSubmit={addRange}
          className="rounded-2xl border border-line bg-cream p-6"
        >
          <h2 className="font-serif text-xl text-ink">
            Generera tider för en dag
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            Skapar 30-min-tider mellan start och slut (använder datumet till
            vänster).
          </p>
          <label className="mt-4 block text-sm text-ink/80">Från</label>
          <input
            type="time"
            step={1800}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          />
          <label className="mt-3 block text-sm text-ink/80">Till</label>
          <input
            type="time"
            step={1800}
            value={slut}
            onChange={(e) => setSlut(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-5 rounded-full border border-gold px-6 py-2.5 text-sm text-ink hover:bg-gold hover:text-cream disabled:opacity-60"
          >
            Generera
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="mt-12">
        <h2 className="font-serif text-xl text-ink">Kommande tider</h2>
        {Object.keys(byDate).length === 0 && (
          <p className="mt-3 text-sm text-ink/60">Inga tider inlagda ännu.</p>
        )}
        <div className="mt-4 space-y-6">
          {Object.entries(byDate).map(([d, list]) => (
            <div key={d}>
              <p className="mb-2 text-sm font-medium text-ink">{d}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((s) => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                      s.status === "booked"
                        ? "border-line bg-beige/50 text-ink/50"
                        : "border-gold text-ink"
                    }`}
                  >
                    {s.tid}
                    {s.status === "booked" ? " (bokad)" : ""}
                    <button
                      onClick={() => del(s.id)}
                      className="text-ink/40 hover:text-sage-dark"
                      aria-label="Ta bort"
                      title="Ta bort"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
