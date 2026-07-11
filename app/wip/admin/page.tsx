"use client";

import { useState } from "react";
import Container from "@/components/Container";
import { categories } from "@/lib/treatments";

type Slot = {
  id: number;
  datum: string;
  tid: string;
  status: string;
  duration: number;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Record<string, Record<number, number>>>({});
  const [mlWeights, setMlWeights] = useState<Record<string, number>>({});
  const [timeConfig, setTimeConfig] = useState({ base: 15, per_ml: 10, per_area: 5 });
  const [memberships, setMemberships] = useState<any[]>([]);
  const [memEmail, setMemEmail] = useState("");
  const [memNamn, setMemNamn] = useState("");
  const [memAmount, setMemAmount] = useState("");
  const [memLink, setMemLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Formulärfält
  const [datum, setDatum] = useState("");
  const [tid, setTid] = useState("");
  const [start, setStart] = useState("");
  const [slut, setSlut] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);

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
    loadBookings();
    loadPrices();
    loadMemberships();
    loadMlWeights();
    loadTimeConfig();
  }

  async function refresh() {
    const res = await api("GET");
    const data = await res.json();
    setSlots(data.slots || []);
  }

  async function loadBookings() {
    const res = await fetch("/api/admin/bookings", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const d = await res.json();
      setBookings(d.bookings || []);
    }
  }

  async function cancelBooking(id: number) {
    if (!confirm("Avboka och återbetala hela beloppet till kunden?")) return;
    await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "cancel" }),
    });
    await loadBookings();
    await refresh();
  }

  async function noShowBooking(id: number) {
    if (!confirm("Markera som utebliven? 50 % återbetalas till kunden.")) return;
    await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "noshow" }),
    });
    await loadBookings();
  }

  async function loadPrices() {
    const res = await fetch("/api/admin/prices", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const d = await res.json();
      setTiers(d.tiers || {});
    }
  }

  function setTier(category: string, q: number, amount: number) {
    setTiers((prev) => ({
      ...prev,
      [category]: { ...(prev[category] || {}), [q]: amount },
    }));
  }

  async function savePrices() {
    setBusy(true);
    for (const c of categories) {
      for (const q of [1, 2, 3, 4]) {
        await fetch("/api/admin/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": password },
          body: JSON.stringify({
            category: c.key,
            quantity: q,
            amount: tiers[c.key]?.[q] ?? 0,
          }),
        });
      }
    }
    await loadPrices();
    setBusy(false);
  }

  async function loadMlWeights() {
    const res = await fetch("/api/admin/area-ml", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const d = await res.json();
      setMlWeights(d.mlWeights || {});
    }
  }

  function setMlWeight(area: string, ml: number) {
    setMlWeights((prev) => ({ ...prev, [area]: ml }));
  }

  async function saveMlWeights() {
    setBusy(true);
    const fillerAreas = categories.find((c) => c.key === "fillers")?.areas || [];
    for (const a of fillerAreas) {
      await fetch("/api/admin/area-ml", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ area: a.name, ml: mlWeights[a.name] ?? 0 }),
      });
    }
    await loadMlWeights();
    setBusy(false);
  }

  async function loadTimeConfig() {
    const res = await fetch("/api/admin/time-config", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const d = await res.json();
      if (d.timeConfig) setTimeConfig(d.timeConfig);
    }
  }

  async function saveTimeConfig() {
    setBusy(true);
    await fetch("/api/admin/time-config", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(timeConfig),
    });
    await loadTimeConfig();
    setBusy(false);
  }

  async function loadMemberships() {
    const res = await fetch("/api/admin/memberships", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const d = await res.json();
      setMemberships(d.memberships || []);
    }
  }

  async function createMembership(e: React.FormEvent) {
    e.preventDefault();
    if (!memEmail || !memAmount) return;
    setBusy(true);
    setMemLink("");
    const res = await fetch("/api/admin/membership", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({
        email: memEmail,
        namn: memNamn,
        amount: Number(memAmount),
      }),
    });
    const d = await res.json();
    setBusy(false);
    if (d.ok) {
      setMemLink(d.url);
      setMemEmail("");
      setMemNamn("");
      setMemAmount("");
    } else {
      alert(d.error || "Kunde inte skapa länk.");
    }
  }

  async function cancelMembership(id: number) {
    setBusy(true);
    await fetch("/api/admin/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "cancel" }),
    });
    await loadMemberships();
    setBusy(false);
  }

  async function addSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!datum || !tid) return;
    setBusy(true);
    await api("POST", { datum, tid, duration: slotDuration });
    setTid("");
    await refresh();
    setBusy(false);
  }

  async function addRange(e: React.FormEvent) {
    e.preventDefault();
    if (!datum || !start || !slut) return;
    setBusy(true);
    await api("POST", { datum, start, slut, duration: slotDuration });
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const activeBookings = bookings.filter((b) => b.status === "active");
  const upcomingBookings = activeBookings.filter((b) => b.datum >= todayStr);
  const revenue = activeBookings.reduce((s, b) => s + (b.amount || 0), 0);
  const activeMembers = memberships.filter((m) => m.status === "active");
  const mrr = activeMembers.reduce((s, m) => s + (m.amount || 0), 0);
  const availableSlots = slots.filter(
    (s) => s.status === "available" && s.datum >= todayStr
  ).length;

  return (
    <Container className="py-16">
      <h1 className="font-serif text-3xl text-ink">Admin</h1>

      {/* Översikt */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Kommande bokningar", value: String(upcomingBookings.length) },
          {
            label: "Intäkter (betalda)",
            value: `${revenue.toLocaleString("sv-SE")} kr`,
          },
          {
            label: "Aktiva medlemskap",
            value: `${activeMembers.length} · ${mrr.toLocaleString("sv-SE")} kr/mån`,
          },
          { label: "Lediga tider framåt", value: String(availableSlots) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-line bg-cream p-5"
          >
            <p className="text-xs uppercase tracking-wide text-ink/50">
              {c.label}
            </p>
            <p className="mt-2 font-serif text-2xl text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-serif text-2xl text-ink">Hantera tider</h2>
      <p className="mt-1 text-sm text-ink/60">
        Välj längd (30–90 min) per tid. Lediga tider visas för kunder på
        bokningssidan.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
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
          <label className="mt-3 block text-sm text-ink/80">Längd</label>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          >
            {[30, 45, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
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
            Skapar tider med vald längd mellan start och slut (använder datumet
            och längden till vänster).
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
                    {s.tid} ({s.duration} min)
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
      {/* Bokningar */}
      <div className="mt-16">
        <h2 className="font-serif text-xl text-ink">Bokningar</h2>
        {bookings.length === 0 && (
          <p className="mt-3 text-sm text-ink/60">Inga bokningar ännu.</p>
        )}
        <div className="mt-4 space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-4 text-sm ${
                b.status === "active"
                  ? "border-line bg-cream text-ink/80"
                  : "border-line bg-beige/40 text-ink/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">
                    {b.datum} kl. {b.tid} — {b.namn}
                    {b.status === "cancelled"
                      ? " (avbokad)"
                      : b.status === "noshow"
                      ? " (utebliven)"
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-ink/60">
                    {b.epost} · {b.telefon || "-"} · {b.omrade || "-"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/50">
                    Pnr: {b.personnummer || "-"} · {b.adress || "-"}
                  </p>
                  {b.meddelande ? (
                    <p className="mt-1 text-xs italic text-ink/50">
                      ”{b.meddelande}”
                    </p>
                  ) : null}
                </div>
                {b.status === "active" && (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs text-ink/60 hover:text-sage-dark"
                    >
                      Avboka
                    </button>
                    <button
                      onClick={() => noShowBooking(b.id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs text-ink/60 hover:text-sage-dark"
                    >
                      Utebliven
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Priser */}
      <div className="mt-16">
        <h2 className="font-serif text-xl text-ink">Priser</h2>
        <p className="mt-1 text-xs text-ink/50">
          Fillers per ml, toxin per område (kr).
        </p>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          {categories.map((c) => (
            <div key={c.key}>
              <p className="mb-2 text-sm font-medium text-ink">
                {c.title} — pris per {c.unit}
              </p>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((q) => (
                  <div
                    key={q}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-ink/70">
                      {q} {q === 1 ? c.unit : c.unitPlural}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={tiers[c.key]?.[q] ?? 0}
                      onChange={(e) => setTier(c.key, q, Number(e.target.value))}
                      className="w-32 rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={savePrices}
          disabled={busy}
          className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
        >
          Spara priser
        </button>
      </div>
      {/* Mängd per fillerområde (ml) */}
      <div className="mt-16">
        <h2 className="font-serif text-xl text-ink">
          Mängd per fillerområde (ml)
        </h2>
        <p className="mt-1 text-xs text-ink/50">
          Uppskattad mängd som används för att räkna ut total ml och pris vid
          bokning.
        </p>
        <div className="mt-4 max-w-md space-y-2">
          {(categories.find((c) => c.key === "fillers")?.areas || []).map((a) => (
            <div key={a.name} className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink/70">{a.name}</span>
              <input
                type="number"
                min={0}
                value={mlWeights[a.name] ?? 0}
                onChange={(e) => setMlWeight(a.name, Number(e.target.value))}
                className="w-24 rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
              />
            </div>
          ))}
          <button
            onClick={saveMlWeights}
            disabled={busy}
            className="mt-2 rounded-full bg-gold px-6 py-2.5 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
          >
            Spara mängder
          </button>
        </div>
      </div>

      {/* Tidsåtgång */}
      <div className="mt-16">
        <h2 className="font-serif text-xl text-ink">Tidsåtgång</h2>
        <p className="mt-1 text-xs text-ink/50">
          Beräknad behandlingstid = grundtid + tillägg per ml (fillers) / per
          område (rynkbehandling). Kunden kan bara boka en tid som är minst så
          lång.
        </p>
        <div className="mt-4 max-w-md space-y-3">
          {[
            { key: "base", label: "Grundtid (min)" },
            { key: "per_ml", label: "Tillägg per ml – fillers (min)" },
            { key: "per_area", label: "Tillägg per område – rynkbehandling (min)" },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink/70">{f.label}</span>
              <input
                type="number"
                min={0}
                value={(timeConfig as any)[f.key] ?? 0}
                onChange={(e) =>
                  setTimeConfig({ ...timeConfig, [f.key]: Number(e.target.value) })
                }
                className="w-24 rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
              />
            </div>
          ))}
          <button
            onClick={saveTimeConfig}
            disabled={busy}
            className="mt-2 rounded-full bg-gold px-6 py-2.5 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
          >
            Spara tidsåtgång
          </button>
        </div>
      </div>

      {/* Medlemskap */}
      <div className="mt-16">
        <h2 className="font-serif text-xl text-ink">Medlemskap</h2>
        <p className="mt-1 text-xs text-ink/50">
          Skapa en betallänk med individuellt månadsbelopp. Kunden anger kort och
          Stripe drar månadsvis automatiskt.
        </p>

        <form
          onSubmit={createMembership}
          className="mt-4 max-w-md rounded-2xl border border-line bg-cream p-6"
        >
          <label className="block text-sm text-ink/80">Kundens e-post</label>
          <input
            type="email"
            value={memEmail}
            onChange={(e) => setMemEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          />
          <label className="mt-3 block text-sm text-ink/80">Namn (valfritt)</label>
          <input
            value={memNamn}
            onChange={(e) => setMemNamn(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          />
          <label className="mt-3 block text-sm text-ink/80">
            Månadsbelopp (kr)
          </label>
          <input
            type="number"
            min={1}
            value={memAmount}
            onChange={(e) => setMemAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
          >
            Skapa medlemskapslänk
          </button>
        </form>

        {memLink && (
          <div className="mt-4 max-w-md rounded-lg border border-gold bg-cream p-4 text-sm">
            <p className="text-ink/70">Skicka den här länken till kunden:</p>
            <a href={memLink} className="mt-1 block break-all text-gold underline">
              {memLink}
            </a>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {memberships.map((m) => (
            <div
              key={m.id}
              className={`flex items-center justify-between gap-4 rounded-xl border p-3 text-sm ${
                m.status === "cancelled"
                  ? "border-line bg-beige/40 text-ink/50"
                  : "border-line bg-cream text-ink/80"
              }`}
            >
              <span>
                {m.email}
                {m.namn ? ` (${m.namn})` : ""} — {m.amount} kr/mån
                {m.status === "cancelled" ? " (avslutad)" : ""}
              </span>
              {m.status !== "cancelled" && (
                <button
                  onClick={() => cancelMembership(m.id)}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-ink/60 hover:text-sage-dark"
                >
                  Avsluta
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
