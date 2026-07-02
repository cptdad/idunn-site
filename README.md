# Iðunn Estetik — webbplats (v1)

Marknadssida för Iðunn Estetik Stockholm. Byggd med Next.js (App Router),
TypeScript och Tailwind CSS.

## Utveckling

```bash
npm install
npm run dev
```

Öppna http://localhost:3000

## Bygg

```bash
npm run build && npm run start
```

## Status v1

- Startsida, behandlingar, naturligt underhåll (medlemskap), om oss, priser,
  kontakt, blogg, boka (formulär + API-stub), integritet, villkor.
- Designsystem: creme/beige/guld/salvie, serif + sans (se `tailwind.config.ts`).
- **Sidan är satt till `noindex`** (se `app/robots.ts` och robots-metadata i
  `app/layout.tsx`). Ta bort spärren vid lansering.

## Att göra (v2/v3)

- Koppla bokning till databas (Postgres) + bekräftelsemejl (Resend) + admin.
- CMS (Sanity) för blogg/innehåll.
- Medlemskap med Stripe.
- Juridisk granskning av all copy innan publicering.

## Juridik

Marknadsför inte receptbelagda läkemedel (t.ex. botulinumtoxin) mot
allmänheten. Behandlingsområden beskrivs sakligt med riskinformation. Se
`Idunn-Estetik-Webbplan.md` avsnitt 6.
