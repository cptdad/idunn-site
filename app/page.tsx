import { basePath } from "@/lib/site";

// Publik "kommer snart"-sida på roten (idunn-estetik.se).
// Själva sidan vi bygger ligger under /wip.
export default function ComingSoon() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <img
        src={`${basePath}/logo.png`}
        alt="Iðunn Estetik Stockholm"
        className="h-72 w-auto max-w-full md:h-96"
      />
      <p className="mt-6 max-w-md text-lg text-ink/75">
        Naturliga och långsiktiga resultat i en trygg miljö.
      </p>
      <p className="mt-10 text-sm uppercase tracking-[0.25em] text-gold">
        Kommer snart…
      </p>
    </div>
  );
}
