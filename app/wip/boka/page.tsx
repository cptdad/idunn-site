import type { Metadata } from "next";
import Container from "@/components/Container";
import BookingForm from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Boka tid",
  description:
    "Boka en konsultation hos Iðunn Estetik i Stockholm. Första besöket är alltid en genomgång — ingen behandling utan fullständig information.",
};

export default function Boka() {
  return (
    <Container className="py-20">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
            Boka tid
          </p>
          <h1 className="font-serif text-4xl text-ink md:text-5xl">
            Boka din konsultation
          </h1>
          <p className="mt-5 text-lg text-ink/75">
            Välj en ledig tid nedan (varje tid är 30 minuter).
          </p>
          <ul className="mt-8 space-y-3 text-sm text-ink/75">
            <li>• Legitimerad sjuksköterska</li>
            <li>• Nära Gullmarsplan, Stockholm</li>
            <li>• Endast för dig som är 18 år eller äldre</li>
          </ul>
        </div>
        <BookingForm />
      </div>
    </Container>
  );
}
