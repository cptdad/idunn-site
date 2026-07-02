"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/behandlingar", label: "Behandlingar" },
  { href: "/naturligt-underhall", label: "Naturligt underhåll" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/priser", label: "Priser" },
  { href: "/blogg", label: "Blogg" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur">
      <nav className="container-c flex items-center justify-between py-4">
        <Link href="/" className="font-serif text-2xl tracking-wide text-ink">
          Iðunn <span className="text-gold">Estetik</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-underline text-sm text-ink/80 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/boka"
            className="rounded-full bg-gold px-6 py-2.5 text-sm text-cream transition-colors hover:bg-gold-light"
          >
            Boka tid
          </Link>
        </div>

        <button
          className="md:hidden text-ink"
          onClick={() => setOpen((v) => !v)}
          aria-label="Meny"
          aria-expanded={open}
        >
          <span className="block h-0.5 w-6 bg-ink mb-1.5" />
          <span className="block h-0.5 w-6 bg-ink mb-1.5" />
          <span className="block h-0.5 w-6 bg-ink" />
        </button>
      </nav>

      {open && (
        <div className="border-t border-line/70 bg-cream md:hidden">
          <div className="container-c flex flex-col gap-4 py-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink/80"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/boka"
              className="rounded-full bg-gold px-6 py-2.5 text-center text-sm text-cream"
              onClick={() => setOpen(false)}
            >
              Boka tid
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
