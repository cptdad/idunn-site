import Container from "@/components/Container";

export default function MedlemskapKlar() {
  return (
    <Container className="py-24">
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-cream p-8 text-center">
        <h1 className="font-serif text-3xl text-ink">Välkommen som medlem</h1>
        <p className="mt-4 text-ink/75">
          Tack — ditt medlemskap i Naturligt underhåll är aktivt. Din
          månadsbetalning sköts automatiskt, och en kvittens skickas till din
          e-post.
        </p>
        <p className="mt-3 text-sm text-ink/60">
          Vi ser fram emot att ta hand om dig.
        </p>
      </div>
    </Container>
  );
}
