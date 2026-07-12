"use client";

import { useEffect, useRef, useState } from "react";
import {
  categories,
  computeQuantity,
  combinedMinutes,
  type TimeConfig,
} from "@/lib/treatments";
import { validatePersonnummer } from "@/lib/personnummer";
import { requiredBlocks, slotTimes } from "@/lib/slots";
import { stockholmMs } from "@/lib/time";

type Slot = { datum: string; tid: string };
type Status = "idle" | "sending" | "ok" | "error";
type Tiers = Record<string, Record<number, number>>;

const fillersCat = categories.find((c) => c.key === "fillers")!;
const toxinCat = categories.find((c) => c.key === "toxin")!;

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
  const [available, setAvailable] = useState<Slot[]>([]);
  const [occupied, setOccupied] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTid, setSelectedTid] = useState("");

  const [tiers, setTiers] = useState<Tiers>({});
  const [mlWeights, setMlWeights] = useState<Record<string, number>>({});
  const [timeConfig, setTimeConfig] = useState<TimeConfig>({
    base: 15,
    per_ml: 10,
    per_area: 5,
  });
  const [fillerAreas, setFillerAreas] = useState<string[]>([]);
  const [toxinAreas, setToxinAreas] = useState<string[]>([]);

  const [pnr, setPnr] = useState("");
  const [namn, setNamn] = useState("");
  const [adress, setAdress] = useState("");
  const [epost, setEpost] = useState("");
  const [telefon, setTelefon] = useState("");
  const [meddelande, setMeddelande] = useState("");
  const [samtycke, setSamtycke] = useState(false);

  const [consultationReq, setConsultationReq] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("");

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

  const allAreas = [...fillerAreas, ...toxinAreas];

  useEffect(() => {
    const v = validatePersonnummer(pnr);
    if (!v.valid || allAreas.length === 0) {
      setConsultationReq(false);
      return;
    }
    const t = setTimeout(() => {
      fetch("/api/consultation-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personnummer: pnr, areas: allAreas }),
      })
        .then((r) => r.json())
        .then((d) => setConsultationReq(!!d.required))
        .catch(() => setConsultationReq(true));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnr, fillerAreas, toxinAreas]);

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
      const d = await res.json();
      setAvailable(d.available || []);
      setOccupied(d.occupied || []);
    } catch {
      setAvailable([]);
      setOccupied([]);
    }
    setLoadingSlots(false);
  }

  const fillerMl = computeQuantity(fillersCat, fillerAreas, mlWeights);
  const toxinCount = computeQuantity(toxinCat, toxinAreas);
  const fillerPrice = fillerMl >= 1 ? tiers["fillers"]?.[fillerMl] ?? 0 : 0;
  const toxinPrice = toxinCount >= 1 ? tiers["toxin"]?.[toxinCount] ?? 0 : 0;
  const totalPrice = fillerPrice + toxinPrice;
  const hasSelection = fillerMl >= 1 || toxinCount >= 1;
  const requiredMin = combinedMinutes(timeConfig, fillerMl, toxinCount);
  const neededBlocks = requiredBlocks(requiredMin);

  const occForDate = new Set(
    occupied.filter((o) => o.datum === selectedDate).map((o) => o.tid)
  );
  const fits = (tid: string) =>
    slotTimes(tid, neededBlocks).every((t) => !occForDate.has(t));

  const cutoffMs = Date.now() + 48 * 3600 * 1000;
  const tooSoon = (tid: string) =>
    consultationReq && stockholmMs(selectedDate, tid) < cutoffMs;

  const selectedClash =
    !!selectedTid && requiredMin > 0 && !fits(selectedTid);
  const selectedTooSoon = !!selectedTid && tooSoon(selectedTid);
  const pnrCheck = pnr ? validatePersonnummer(pnr) : null;

  function toggleFiller(a: string) {
    setFillerAreas((p) =>
      p.includes(a) ? p.filter((x) => x !== a) : [...p, a]
    );
  }
  function toggleToxin(a: string) {
    setToxinAreas((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
  }

  function validate(): string | null {
    if (!selectedDate || !selectedTid) return "Välj en tid först.";
    if (!hasSelection) return "Välj minst ett område.";
    if (totalPrice <= 0) return "Ogiltig behandling eller mängd.";
    if (selectedClash)
      return "Behandlingen ryms inte från den valda tiden — en annan bokning ligger i vägen. Välj en annan tid.";
    if (selectedTooSoon)
      return "Den här behandlingen kräver en konsultation minst 48 timmar innan. Välj en tid längre fram.";
    const v = validatePersonnummer(pnr);
    if (!v.valid) return v.error || "Ogiltigt personnummer.";
    if (!namn) return "Ange namn.";
    if (!epost) return "Ange e-post.";
    if (!samtycke) return "Du behöver godkänna villkoren.";
    if (siteKey && !token) return "Bekräfta att du inte är en robot.";
    return null;
  }

  function onReview(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setReviewing(true);
  }

  async function confirmBooking() {
    const err = validate();
    if (err) {
      setError(err);
      setReviewing(false);
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/boka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datum: selectedDate,
          tid: selectedTid,
          personnummer: pnr,
          namn,
          adress,
          epost,
          telefon,
          fillerAreas,
          toxinAreas,
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
        setReviewing(false);
        if (res.status === 409) {
          setSelectedTid("");
          loadSlots();
        }
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setConfirmedTime(data.nar || "");
      setStatus("ok");
    } catch {
      setStatus("idle");
      setError("Något gick fel. Försök igen.");
      resetTurnstile();
      setReviewing(false);
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-line bg-cream p-8 text-center">
        <h3 className="font-serif text-2xl text-ink">Tack för din bokning</h3>
        <p className="mt-3 text-ink/75">
          Din tid: <strong>{confirmedTime}</strong>. En bekräftelse har skickats
          till din e-post.
        </p>
      </div>
    );
  }

  if (reviewing) {
    return (
      <div className="rounded-2xl border border-line bg-cream p-8">
        <h3 className="font-serif text-2xl text-ink">Granska din bokning</h3>
        <dl className="mt-5 space-y-2 text-sm">
          <Row label="Tid">
            {selectedTid ? `${formatDate(selectedDate)} kl. ${selectedTid}` : "-"}{" "}
            (ca {requiredMin} min)
          </Row>
          {fillerMl >= 1 && (
            <Row label="Fillers">
              {fillerAreas.join(", ")} ({fillerMl} ml)
            </Row>
          )}
          {toxinCount >= 1 && (
            <Row label="Rynkbehandling">
              {toxinAreas.join(", ")} ({toxinCount}{" "}
              {toxinCount === 1 ? "område" : "områden"})
            </Row>
          )}
          <Row label="Pris">{totalPrice.toLocaleString("sv-SE")} kr</Row>
          <Row label="Namn">{namn}</Row>
          <Row label="Personnummer">{pnrCheck?.display || pnr}</Row>
          <Row label="E-post">{epost}</Row>
          {telefon ? <Row label="Telefon">{telefon}</Row> : null}
        </dl>

        {consultationReq && (
          <p className="mt-4 rounded-lg border border-line bg-beige/40 p-3 text-sm text-ink/75">
            Vi kontaktar dig minst 48 timmar innan för en kostnadsfri, lagstadgad
            konsultation.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setReviewing(false)}
            className="rounded-full border border-line px-6 py-3 text-sm text-ink"
          >
            Tillbaka
          </button>
          <button
            type="button"
            onClick={confirmBooking}
            disabled={status === "sending"}
            className="rounded-full bg-gold px-8 py-3 text-sm text-cream hover:bg-gold-light disabled:opacity-60"
          >
            {status === "sending" ? "Bokar…" : "Bekräfta och betala"}
          </button>
        </div>
        {error && (
          <p className="mt-4 text-center text-sm text-sage-dark">{error}</p>
        )}
      </div>
    );
  }

  const dates = Array.from(new Set(available.map((s) => s.datum))).sort();
  const timesForDate = available
    .filter((s) => s.datum === selectedDate)
    .sort((a, b) => a.tid.localeCompare(b.tid));

  return (
    <form onSubmit={onReview} className="rounded-2xl border border-line bg-cream p-8">
      {/* Tidsval */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">
          Välj datum och tid
        </label>
        {loadingSlots ? (
          <p className="text-sm text-ink/60">Hämtar lediga tider…</p>
        ) : available.length === 0 ? (
          <p className="text-sm text-ink/60">
            Inga lediga tider just nu. Hör gärna av dig via kontaktsidan.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTid("");
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
              value={selectedTid}
              onChange={(e) => setSelectedTid(e.target.value)}
              disabled={!selectedDate}
              className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold disabled:opacity-50"
            >
              <option value="">Välj tid</option>
              {timesForDate.map((s) => {
                const clash = requiredMin > 0 && !fits(s.tid);
                const soon = tooSoon(s.tid);
                return (
                  <option key={s.tid} value={s.tid} disabled={clash || soon}>
                    {s.tid}
                    {clash
                      ? " – upptagen"
                      : soon
                      ? " – kräver konsultation (48h)"
                      : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Behandlingar sida vid sida */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">{fillersCat.title}</p>
          <div className="space-y-2">
            {fillersCat.areas.map((a) => {
              const checked = fillerAreas.includes(a.name);
              const inc = mlWeights[a.name] ?? a.ml ?? 0;
              const disabled = !checked && fillerMl + inc > 4;
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
                    onChange={() => toggleFiller(a.name)}
                    className="mt-1 h-4 w-4 accent-gold"
                  />
                  <span>
                    {a.name} ({inc} ml)
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink/50">Max 4 ml.</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">{toxinCat.title}</p>
          <div className="space-y-2">
            {toxinCat.areas.map((a) => {
              const checked = toxinAreas.includes(a.name);
              const disabled = !checked && toxinCount >= 4;
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
                    onChange={() => toggleToxin(a.name)}
                    className="mt-1 h-4 w-4 accent-gold"
                  />
                  <span>{a.name}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink/50">Max 4 områden.</p>
        </div>
      </div>

      {hasSelection && totalPrice > 0 && (
        <div className="mt-4 rounded-lg border border-gold bg-cream p-3 text-center text-sm text-ink">
          Beräknat: ca <strong>{totalPrice.toLocaleString("sv-SE")} kr</strong> ·
          ca {requiredMin} min
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
        {consultationReq && (
          <p className="mt-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700">
            Den här behandlingen kräver en kostnadsfri konsultation — boka minst
            48 timmar fram.
          </p>
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
        disabled={
          status === "sending" ||
          !totalPrice ||
          selectedClash ||
          selectedTooSoon
        }
        className="mt-6 w-full rounded-full bg-gold px-8 py-3.5 text-cream transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        Granska bokning
      </button>

      {error && (
        <p className="mt-4 text-center text-sm text-sage-dark">{error}</p>
      )}
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
