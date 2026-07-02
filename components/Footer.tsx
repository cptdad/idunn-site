import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-beige/50">
      <div className="container-c grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="font-serif text-2xl text-ink">
            Iðunn <span className="text-gold">Estetik</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink/70">{site.tagline}</p>
        </div>

        <div className="text-sm text-ink/80">
          <p className="mb-3 font-medium text-ink">Klinik</p>
          <p>{site.areaHint}</p>
          <p className="mt-1">{site.email}</p>
          <p className="mt-1">Legitimerad sjuksköterska</p>
        </div>

        <div className="text-sm text-ink/80">
          <p className="mb-3 font-medium text-ink">Sidor</p>
          <ul className="space-y-1.5">
            <li><Link href="/behandlingar" className="hover:text-ink">Behandlingar</Link></li>
            <li><Link href="/naturligt-underhall" className="hover:text-ink">Naturligt underhåll</Link></li>
            <li><Link href="/priser" className="hover:text-ink">Priser</Link></li>
            <li><Link href="/kontakt" className="hover:text-ink">Kontakt</Link></li>
            <li><Link href="/integritet" className="hover:text-ink">Integritetspolicy</Link></li>
            <li><Link href="/villkor" className="hover:text-ink">Villkor</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="container-c flex flex-col gap-2 py-6 text-xs text-ink/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Iðunn Estetik Stockholm</p>
          <p>
            Estetiska injektionsbehandlingar utförs endast av legitimerad
            vårdpersonal och aldrig på personer under 18 år.
          </p>
        </div>
      </div>
    </footer>
  );
}
