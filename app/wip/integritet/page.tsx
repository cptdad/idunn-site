import type { Metadata } from "next";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: "Så behandlar Iðunn Estetik dina personuppgifter enligt GDPR.",
};

export default function Integritet() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl text-ink">Integritetspolicy</h1>
        <p className="mt-3 text-sm text-ink/60">Utkast — granskas innan lansering.</p>

        <div className="mt-8 space-y-6 text-ink/80">
          <section>
            <h2 className="font-serif text-xl text-ink">Personuppgiftsansvarig</h2>
            <p className="mt-2 text-sm">
              Iðunn Estetik Stockholm ansvarar för behandlingen av dina
              personuppgifter.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-ink">Vilka uppgifter</h2>
            <p className="mt-2 text-sm">
              När du skickar en bokningsförfrågan behandlar vi namn,
              kontaktuppgifter och det du väljer att skriva. Vi ber dig att inte
              lämna känsliga hälsouppgifter via webbformulär.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-ink">Ändamål och laglig grund</h2>
            <p className="mt-2 text-sm">
              Uppgifterna används för att kontakta dig och hantera din
              förfrågan, på grundval av ditt samtycke och vårt berättigade
              intresse att besvara förfrågningar.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-ink">Lagring</h2>
            <p className="mt-2 text-sm">
              Uppgifter sparas inom EU/EES och inte längre än nödvändigt. Du har
              rätt till tillgång, rättelse och radering. Kontakta oss för att
              utöva dina rättigheter.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
