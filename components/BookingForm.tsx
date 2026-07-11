"use client";

import { useEffect, useRef, useState } from "react";
import {
  categories,
  computeQuantity,
  estimatedMinutes,
  type TimeConfig,
} from "@/lib/treatments";
import { validatePersonnummer } from "@/lib/personnummer";
import { requiredBlocks, slotTimes } from "@/lib/slots";

type Slot = { id: number; datum: string; tid: string; duration: number };
type Status = "idle" | "sending" | "ok" | "error";
type Tiers = Record<string, Record<number, number>>;

function formatDate(d: string): string {
  try {
    const s = new Date(`${d}T00:00:00`).toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return d;
  }
}

export default function BookingForm() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const [tiers, setTiers] = useState<Tiers>({});
  const [mlWeights, setMlWeights] = useState<Record<string, number>>({});
  const [timeConfig, setTimeConfig] = useState<TimeConfig>({
    base: 15,
    per_ml: 10,
    per_area: 5,
  });
  const [category, setCategory] = useState<string>(categories[0]?.key || "fillers");
  const [areas, setAreas] = useState<string[]>([]);

  const [pnr, setPnr] = useState("");
  const [namn, setNamn] = useState("");
  const [adress, setAdress] = useState("");
  const [epost, setEpost] = useState("");
  const [telefon, setTelefon] = useState("");
  const [meddelande, setMeddelande] = useState("");
  const [samtycke, setSamtycke] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("");
  const [confirmedDuration, setConfirmedDuration] = useState(30);

  // Turnstile
  const [siteKey, setSiteKey] = useState("");
  const [token, setToken] = useState("");
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const rendered = useRef(false);

  useEffect(() => {
    loadSlots();
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => setSiteKey(cfg.turnstileSiteKey || ""))
      .catch(() => setSiteKey(""));
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => {
        setTiers(d.tiers || {});
        setMlWeights(d.mlWeights || {});
        if (d.timeConfig) setTimeConfig(d.timeConfig);
      })
      .catch(() => setTiers({}));
  }, []);

  useEffect(() => {
    if (!siteKey) return;
    const scriptId = "cf-turnstile-script";
    const render = () => {
      const w = window as any;
      if (w.turnstile && widgetRef.current && !rendered.current) {
        rendered.current = true;
        w.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: (t: string) => setToken(t),
          "error-callback": () => setToken(""),
          "expired-callback": () => setToken(""),
        });
      }
    };
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      render();
    }
  }, [siteKey]);

  function resetTurnstile() {
    const w = window as any;
    if (siteKey && w.turnstile) {
      try {
        w.turnstile.reset();
      } catch {}
      setToken("");
    }
  }

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

  const MAX_QTY = 4; // max 4 ml (fillers) / 4 områden (rynkbehandling)
  const currentCat = categories.find((c) => c.key === category)!;
  const quantity = computeQuantity(currentCat, areas, mlWeights);
  const currentPrice = quantity >= 1 ? tiers[category]?.[quantity] : undefined;
  const requiredMin =
    quantity >= 1 ? estimatedMinutes(currentCat, quantity, timeConfig) : 0;
  const neededBlocks = requiredBlocks(requiredMin);
  const availTimes = new Set(
    slots.filter((s) => s.datum === selectedDate).map((s) => s.tid)
  );
  const fits = (startTid: string) =>
    slotTimes(startTid, neededBlocks).every((t) => availTimes.has(t));
  const selectedSlot = slots.find((s) => s.id === selected);
  const notEnoughTime =
    !!selectedSlot && requiredMin > 0 && !fits(selectedSlot.tid);
  const pnrCheck = pnr ? validatePersonnummer(pnr) : null;

  function toggleArea(a: string) {
    setAreas((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Välj en tid först.");
      return;
    }
    if (areas.length === 0) {
      setError("Välj minst ett område.");
      return;
    }
    if (!currentPrice) {
      setError(
        "För den här kombinationen behöver vi lägga upp en plan — boka en konsultation."
      );
      return;
    }
    if (notEnoughTime) {
      setError(
        "Det finns inte tillräckligt med tid från vald starttid. Välj en annan starttid."
      );
      return;
    }
    const v = validatePersonnummer(pnr);
    if (!v.valid) {
      setError(v.error || "Ogiltigt personnummer.");
      return;
    }
    if (siteKey && !token) {
      setError("Bekräfta att du inte är en robot.");
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
          category,
          areas,
          meddelande,
          samtycke,
          turnstileToken: token,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("idle");
        setError(data.error || "Något gick fel. Försök igen.");
        resetTurnstile();
        if (res.status === 409) {
          setSelected(null);
          loadSlots();
        }
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setConfirmedTime(data.nar || "");
      setConfirmedDuration(data.duration || 30);
      setStatus("ok");
    } catch {
      setStatus("idle");
      setError("Något gick fel. Försök igen.");
      resetTurnstile();
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-line bg-cream p-8 text-center">
        <h3 className="font-serif text-2xl text-ink">Tack för din bokning</h3>
        <p className="mt-3 text-ink/75">
          Din tid: <strong>{confirmedTime}</strong> ({confirmedDuration} min). En
          bekräftelse har skickats till din e-post.
        </p>
      </div>
    );
  }

  const dates = Array.from(new Set(slots.map((s) => s.datum))).sort();
  const timesForDate = slots
    .filter((s) => s.datum === selectedDate)
    .sort((a, b) => a.tid.localeCompare(b.tid));

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-cream p-8">
      {/* Tidsval */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">
          Välj datum och tid
        </label>
        {loadingSlots ? (
          <p className="text-sm text-ink/60">Hämtar lediga tider…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-ink/60">
            Inga lediga tider just nu. Hör gärna av dig via kontaktsidan.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelected(null);
              }}
              className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
            >
              <option value="">Välj datum</option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
            <select
              value={selected ?? ""}
              onChange={(e) =>
                setSelected(e.target.value ? Number(e.target.value) : null)
              }
              disabled={!selectedDate}
              className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold disabled:opacity-50"
            >
              <option value="">Välj tid</option>
              {timesForDate.map((s) => {
                const ok = requiredMin === 0 || fits(s.tid);
                return (
                  <option key={s.id} value={s.id} disabled={!ok}>
                    {s.tid}
                    {!ok ? " – ryms ej" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Behandlingskategori */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-ink">Behandling</label>
        <div className="flex gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setCategory(c.key);
                setAreas([]);
              }}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                category === c.key
                  ? "border-gold bg-gold text-cream"
                  : "border-line text-ink hover:border-gold"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Områden */}
      <div className="mt-5">
        <label className="mb-2 block text-sm text-ink/80">
          Välj de områden du önskar
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {currentCat.areas.map((a) => {
            const checked = areas.includes(a.name);
            const inc =
              currentCat.mode === "ml" ? mlWeights[a.name] ?? a.ml ?? 0 : 1;
            const disabled = !checked && quantity + inc > MAX_QTY;
            return (
              <label
                key={a.name}
                className={`flex items-start gap-2 text-sm ${
                  disabled ? "text-ink/30" : "text-ink/75"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleArea(a.name)}
                  className="mt-1 h-4 w-4 accent-gold"
                />
                <span>
                  {a.name}
                  {currentCat.mode === "ml" ? ` (${inc} ml)` : ""}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink/50">
          Max {MAX_QTY} {currentCat.unitPlural} per bokning.
        </p>
      </div>

      {/* Beräknad mängd + pris */}
      {areas.length > 0 && (
        <div className="mt-4 rounded-lg border border-gold bg-cream p-3 text-center text-sm text-ink">
          {currentPrice != null ? (
            <div>
              <div>
                Beräknat: ca{" "}
                <strong>{currentPrice.toLocaleString("sv-SE")} kr</strong> · ca{" "}
                {requiredMin} min
              </div>
              {notEnoughTime && (
                <div className="mt-1 text-sage-dark">
                  Det finns inte tillräckligt med tid från vald starttid. Välj en
                  annan starttid.
                </div>
              )}
            </div>
          ) : (
            <span>
              För den här kombinationen lägger vi upp en plan vid en
              konsultation.
            </span>
          )}
        </div>
      )}

      {/* Personnummer */}
      <div className="mt-6">
        <label className="mb-2 block text-sm text-ink/80">Personnummer</label>
        <input
          value={pnr}
          onChange={(e) => setPnr(e.target.value)}
          required
          placeholder="ÅÅÅÅMMDD-XXXX"
          className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
        />
        {pnr && pnrCheck && !pnrCheck.valid && (
          <p className="mt-1 text-xs text-sage-dark">{pnrCheck.error}</p>
        )}
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

      {siteKey && <div ref={widgetRef} className="mt-5" />}

      <button
        type="submit"
        disabled={status === "sending" || !currentPrice || notEnoughTime}
        className="mt-6 w-full rounded-full bg-gold px-8 py-3.5 text-cream transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        {status === "sending" ? "Bokar…" : "Boka & betala"}
      </button>

      {error && (
        <p className="mt-4 text-center text-sm text-sage-dark">{error}</p>
      )}
    </form>
  );
}
