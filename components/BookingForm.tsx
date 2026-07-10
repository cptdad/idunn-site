"use client";

import { useState } from "react";
import { treatments } from "@/lib/treatments";

type Status = "idle" | "sending" | "ok" | "error";

export default function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/boka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("bad");
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-line bg-cream p-8 text-center">
        <h3 className="font-serif text-2xl text-ink">Tack för din förfrågan</h3>
        <p className="mt-3 text-ink/75">
          Vi återkommer med förslag på tid för din konsultation. Första besöket
          är alltid en genomgång — ingen behandling utförs utan att du fått
          fullständig information.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-cream p-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Namn" name="namn" required />
        <Field label="E-post" name="epost" type="email" required />
        <Field label="Telefon" name="telefon" type="tel" />
        <div>
          <label className="mb-2 block text-sm text-ink/80">
            Behandlingsområde
          </label>
          <select
            name="omrade"
            className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          >
            {treatments.map((t) => (
              <option key={t.slug} value={t.title}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm text-ink/80">
          Meddelande (valfritt)
        </label>
        <textarea
          name="meddelande"
          rows={4}
          className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
          placeholder="Skriv gärna kort vad du funderar på. Dela inte känsliga hälsouppgifter här."
        />
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-ink/75">
        <input
          type="checkbox"
          name="samtycke"
          required
          className="mt-1 h-4 w-4 accent-gold"
        />
        <span>
          Jag är över 18 år och samtycker till att Iðunn Estetik kontaktar mig
          angående min förfrågan. Se{" "}
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
        {status === "sending" ? "Skickar…" : "Skicka förfrågan"}
      </button>

      {status === "error" && (
        <p className="mt-4 text-center text-sm text-sage-dark">
          Något gick fel. Försök igen eller mejla oss direkt.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-ink/80">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-ink outline-none focus:border-gold"
      />
    </div>
  );
}
