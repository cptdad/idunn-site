import type { Metadata } from "next";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Villkor",
  description: "Boknings- och köpvillkor för Iðunn Estetik.",
};

export default function Villkor() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl text-ink">Villkor</h1>
        <p className="mt-3 text-sm text-ink/60">Utkast — granskas innan lansering.</p>

        <div className="mt-8 space-y-6 text-ink/80 text-sm">
          <p>
            En bokningsförfrågan är inte bindande förrän vi bekräftat tid.
            Första besöket är en konsultation och innebär ingen skyldighet att
            genomföra behandling.
          </p>
          <p>
            Behandlingar utförs endast av legitimerad vårdpersonal och aldrig på
            personer under 18 år. Behandling sker endast efter individuell
            bedömning och fullständig information om nytta och risker.
          </p>
          <p>
            Av- och ombokning samt eventuella avgifter meddelas i samband med
            bokning. Fullständiga villkor kompletteras innan lansering.
          </p>
        </div>
      </div>
    </Container>
  );
}
