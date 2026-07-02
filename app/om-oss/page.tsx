import type { Metadata } from "next";
import Container from "@/components/Container";
import AppleBranch from "@/components/AppleBranch";

export const metadata: Metadata = {
  title: "Om oss",
  description:
    "Iðunn Estetik är en klinik i Stockholm nära Gullmarsplan med fokus på naturliga resultat, medicinsk trygghet och långsiktigt underhåll.",
};

export default function OmOss() {
  return (
    <Container className="py-20">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-gold">
          Om oss
        </p>
        <h1 className="font-serif text-4xl text-ink md:text-5xl">
          Kliniken som ibland säger nej
        </h1>
        <p className="mt-6 text-lg text-ink/75">
          Iðunn Estetik grundades på en enkel övertygelse: det bästa estetiska
          resultatet är det som ingen märker. Folk ska se att du ser pigg,
          utvilad och fräsch ut — inte att du gjort en behandling.
        </p>
        <p className="mt-4 text-ink/75">
          Behandlingar utförs av legitimerad sjuksköterska med utbildning och
          erfarenhet inom estetiska injektioner. Du träffar samma behandlare
          varje gång, vilket skapar trygghet och kontinuitet över tid.
        </p>
      </div>

      <AppleBranch className="my-16" />

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-8">
          <h2 className="font-serif text-2xl text-ink">Vår filosofi</h2>
          <p className="mt-3 text-ink/75">
            Vi behandlar aldrig mer än vad som krävs för ett naturligt och
            harmoniskt resultat. Ibland är rätt råd att avvakta eller att inte
            behandla alls — och det säger vi.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-cream p-8">
          <h2 className="font-serif text-2xl text-ink">Trygghet först</h2>
          <p className="mt-3 text-ink/75">
            Varje behandling föregås av en konsultation där vi går igenom dina
            önskemål, förutsättningar, realistiska resultat och risker. Du
            behandlas endast om det bedöms lämpligt.
          </p>
        </div>
      </div>
    </Container>
  );
}
