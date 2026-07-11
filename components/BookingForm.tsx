"use client";

import { useEffect, useState } from "react";
import { treatments } from "@/lib/treatments";
import { validatePersonnummer } from "@/lib/personnummer";

type Slot = { id: number; datum: string; tid: string };
type Status = "idle" | "sending" | "ok" | "error";

export default function BookingForm() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  const [pnr, setPnr] = useState("");
  const [namn, setNamn] = useState("");
  const [adress, setAdress] = useState("");
  const [epost, setEpost] = useState("");
  const [telefon, setTelefon] = useState("");
  const [omrade, setOmrade] = useState(treatments[0]?.title || "");
  const [meddelande, setMeddelande] = useState("");
  const [samtycke, setSamtycke] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [lookupMsg, setLookupMsg] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("");

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    setLoadingSlots(true);
    try {
      const res = await fetch("/api/slots");
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  }

  const pnrCheck = pnr ? validatePersonnummer(pnr) : null;

  async function hamtaUppgifter() {
    setLookupMsg("");
    const v = validatePersonnummer(pnr);
    if (!v.valid) {
      setLookupMsg(v.error || "Ogiltigt personnummer.");
      return;
    }
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personnummer: pnr }),
      });
      const data = await res.json();
      if (data.ok && data.namn) {
        setNamn(data.namn);
        if (data.adress) setAdress(data.adress);
        setLookupMsg("Uppgifter hämtade.");
      } else {
        setLookupMsg(data.error || "Kunde inte hämta uppgifter — fyll i manuellt.");
      }
    } catch {
      setLookupMsg("Kunde inte hämta uppgifter — fyll i manuellt.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Välj en tid först.");
      return;
    }
    const v = validatePersonnummer(pnr);
    if (!v.valid) {
      setError(v.error || "Ogiltigt personnummer.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/boka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selected,
          personnummer: pnr,
          namn,
          adress,
          epost,
          telefon,
          omrade,
          meddelande,
          samtycke,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("idle");
        setError(data.error || "Något gick fel. Försök igen.");
        if (res.status === 409) {
          setSelected(null);
          loadSlots();
        }
        return;
      }
      setConfirmedTime(data.nar || "");
      setStatus("ok");
    } catch {
      setStatus("idle");
      setError("Något gick fel. Försök igen.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-line bg-cream p-8 text-center">
        <h3 className="font-serif text-2xl text-ink">Tack för din bokning</h3>
        <p className="mt-3 text-ink/75">
          Din tid: <strong>{confirmedTime}</strong> (30 min). En bekräftelse har
          skickats till din e-post. Första besöket är alltid en lugn genomgång.
        </p>
      </div>
    );
  }

  const byDate: Record<string, Slot[]> = {};
  for (const s of slots) {
    (byDate[s.datum] ||= []).push(s);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-cream p-8">
      {/* Tidsval */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">
          Välj en tid
        </label>
        {loadingSlots ? (
          <p className="text-sm text-ink/60">Hämtar lediga tider…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-ink/60">
            Inga lediga tider just nu. Hör gärna av dig via kontaktsidan.
          </p>
        ) : (
          <div className="space-y-4">
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
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
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
      </div>

      {/* Personnummer */}
      <div className="mt-6">
        <label className="mb-2 block text-sm text-ink/80">Personnummer</label>
        <div className="flex gap-2">
          <input
            value={pnr}
            onChange={(e) => setPnr(e.target.value)}
            required
            placeholder="ÅÅÅÅMMDD-XXXX"
            className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={hamtaUppgifter}
            className="shrink-0 rounded-lg border border-gold px-4 py-3 text-sm text-ink hover:bg-gold hover:text-cream"
          >
            Hämta uppgifter
          </button>
        </div>
        {pnr && pnrCheck && !pnrCheck.valid && (
          <p className="mt-1 text-xs text-sage-dark">{pnrCheck.error}</p>
        )}
        {lookupMsg && <p className="mt-1 text-xs text-ink/60">{lookupMsg}</p>}
      </div>

      {/* Namn + adress */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-ink/80">Namn</label>
          <input
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            required
            className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-ink/80">Adress</label>
          <input
            value={adress}
            onChange={(e) => setAdress(e.target.value)}
            className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-ink/80">E-post</label>
          <input
            type="email"
            value={epost}
            onChange={(e) => setEpost(e.target.value)}
            required
            className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-ink/80">Telefon</label>
          <input
            type="tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm text-ink/80">Behandlingsområde</label>
        <select
          value={omrade}
          onChange={(e) => setOmrade(e.target.value)}
          className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
        >
          {treatments.map((t) => (
            <option key={t.slug} value={t.title}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm text-ink/80">
          Meddelande (valfritt)
        </label>
        <textarea
          value={meddelande}
          onChange={(e) => setMeddelande(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          placeholder="Dela inte känsliga hälsouppgifter här."
        />
      </div>

      {/* Avbokningsvillkor */}
      <div className="mt-5 rounded-lg border border-line bg-beige/40 p-4 text-sm text-ink/75">
        Avbokning senare än <strong>24 timmar</strong> före besöket debiteras med
        <strong> 50 %</strong> av behandlingens pris.
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-ink/75">
        <input
          type="checkbox"
          checked={samtycke}
          onChange={(e) => setSamtycke(e.target.checked)}
          required
          className="mt-1 h-4 w-4 accent-gold"
        />
        <span>
          Jag är över 18 år, godkänner avbokningsvillkoren och samtycker till att
          Iðunn Estetik behandlar mina uppgifter enligt{" "}
          <a href="/wip/integritet" className="text-gold underline">
            integritetspolicyn
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-7 w-full rounded-full bg-gold px-8 py-3.5 text-cream transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        {status === "sending" ? "Bokar…" : "Boka tid"}
      </button>

      {error && (
        <p className="mt-4 text-center text-sm text-sage-dark">{error}</p>
      )}
    </form>
  );
}
