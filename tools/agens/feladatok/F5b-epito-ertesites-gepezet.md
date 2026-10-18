# F-5b · Építő — a fiók-szintű értesítés gépezete (`apps/web/ertesites/index.ts`) és a három végpont

CÉL: az R-4 rajz „Mi történt" listája, a fiók kapcsolói és az olvasott-jelölés — kiszolgálói modul + végpontok. A szerződés KÉSZ: `apps/web/ertesites/tipusok.ts`
(melléklet) — abból importálsz, nem írsz bele. Minta a stílusra: `apps/web/tagok/index.ts` (melléklet) — így épül egy lap adatforrása ebben a rendszerben.

TÁBLÁK (a migrációt és a `sema.ts`-t MÁS írja — ezek a Drizzle-nevek, így hívd őket a `sema`-ból):
- `sema.ertesitesFiok` — `fiokId` (uuid, PK), `adat` (jsonb: a `SajatBeallitas`), `olvasvaIg` (timestamptz | null — a „mind olvasott" vízjele), `frissitve` (timestamptz).
- `sema.ertesitesOlvasott` — `fiokId` (uuid), `esemenyId` (uuid), `ido` (timestamptz); PK (fiokId, esemenyId).
- `sema.esemeny` — `id, szervezetId (uuid|null), fajta (text), sulyossag, fiokId, ido (timestamptz), adat (jsonb)`. **RLS**: a `km_app` a saját szervezet sorait ÉS a szervezet nélkülieket látja,
  ezért a szervezeti sorokat `szervezetKent(szervezetId, async (tx) => …)` alatt olvasd (`import { db, sema, szervezetKent } from "../adatbazis/kapcsolat"`), a rendszerszintűeket (`szervezetId IS NULL`) `db()`-vel.
  A fiók-szintű táblákhoz `db()` (nincs RLS; a fiók azonosítója a munkamenetből jön, azt a hívó adja).
- `sema.szervezet` — `id, nev`.

A FIÓK: `FiokNezet` (`import type { FiokNezet } from "../hitelesites"`): `{ id, nev, email, rendszergazda: boolean, nyelv, szervezetek: { id, nev, szerep }[] }`.

FÜGGVÉNYEK (mind exportált, `import "server-only"` az elején):
```ts
export async function sajatBeallitas(fiokId: string): Promise<SajatBeallitas>
  // az ertesites_fiok sor `adat`-ja az ALAP_SAJAT_BEALLITAS-ra terítve (hiányzó kulcs → alap); nincs sor → alap
export async function sajatBeallitasMent(fiokId: string, be: unknown): Promise<SajatBeallitas | null>
  // zod: { esemenyek: Record<SajatFajta, boolean> (mind a hat kulcs kötelező), feluleten: boolean } — hibás → null; UPDATE, ha nincs sor INSERT; visszaadja a mentettet
export async function ertesitesLista(fiok: FiokNezet, limit = 50): Promise<ErtesitesLista>
  // a fiók MINDEN munkateréből (fiok.szervezetek, mindet szervezetKent alatt): esemeny WHERE szervezetId = sz.id AND fajta IN (a fiók BEKAPCSOLT ERTESITES_FAJTAK-jai) ORDER BY ido DESC LIMIT limit;
  // + ha fiok.rendszergazda ÉS esemenyek.belepesi_kiserletek: db() esemeny WHERE szervezetId IS NULL AND fajta = 'belepesi_kiserletek' ORDER BY ido DESC LIMIT limit;
  // összefésülve ido szerint csökkenő, az első `limit` sor. olvasott = (van ertesites_olvasott sor a fiókra és az eseményre) VAGY (ido <= olvasvaIg).
  // munkater: { id, nev } a fiok.szervezetek-ből (rendszerszintűnél null); cel: FAJTA_CEL[fajta];
  // ertekek az adatból: futas_kesz → { n: Number(adat.uj_talalatok ?? 0) }; forras_hibas → { forras: String(adat.forras ?? "") }; ai_nem_valaszol → { n: Number(adat.n ?? 0) }; a többi {}.
  // olvasatlan = az összefésült (limitált) sorok közül a nem olvasottak száma; osszes = a sorok száma. Ha esemenyek-ben egy fajta ki van kapcsolva, az a fajta a listában sem szerepel.
export async function olvasatlanSzam(fiok: FiokNezet): Promise<number>
  // = ertesitesLista(fiok).olvasatlan, DE ha beallitas.feluleten === false → 0 (a harang üres). Hiba esetén 0 és console.error — a sáv nem dőlhet el.
export async function olvasottJelol(fiokId: string, esemenyId: string): Promise<void>       // INSERT … ON CONFLICT DO NOTHING (drizzle: .onConflictDoNothing())
export async function mindOlvasott(fiokId: string): Promise<void>                            // ertesites_fiok.olvasvaIg = now() (UPDATE, ha nincs sor INSERT az alappal)
export async function esemenyMunkatere(fiok: FiokNezet, esemenyId: string): Promise<{ szervezet_id: string | null; fajta: SajatFajta } | null>
  // a megnyitó úthoz: melyik munkatérben van az esemény (a fiók munkatereit végigkérdezve szervezetKent alatt; rendszerszintűt db()-vel, csak rendszergazdának); nincs → null
export async function beallitasokNezet(fiok: FiokNezet, szerep: "tulajdonos" | "szerkeszto" | "nezo"): Promise<BeallitasokNezet>
  // lista + beallitas + rendszergazda: fiok.rendszergazda + adatpolitika: a hírfigyelő szolgáltatója:
  //   import { hirfigyeloSzolgaltato } from "../ai"; import { szolgaltatoHol } from "@km/ai-adapters";
  //   const sz = hirfigyeloSzolgaltato().leirolap;  → nev: sz.nev, hol: szolgaltatoHol(sz.azonosito),
  //   orszag_kulcs: hol === "felho" ? "adatpolitika.orszag_usa" : sz.azonosito === "teszt" ? "adatpolitika.orszag_nincs" : "adatpolitika.orszag_hazon_belul";
  //   meres_datum: "2026-09-13"; felho_kapcsolo_latszik: szerep === "tulajdonos".
```

VÉGPONTOK (`export const dynamic = "force-dynamic"`; minta: `apps/web/app/api/ertesites/route.ts` — melléklet; a kapu: `const ktx = await kapu(keres, "tag"); if (ktx instanceof Response) return ktx;`
→ `ktx.fiok` (FiokNezet), `ktx.szervezet`, `ktx.szerep`; a válasz: `valasz({...})` és `hiba({ hiba: "…" }, status)` a `../tema/_kozos`-ból — a relatív út a mappa mélységétől függ):
- `apps/web/app/api/ertesites/lista/route.ts` — GET → 200 `{ lista }`.
- `apps/web/app/api/ertesites/sajat/route.ts` — GET → 200 `{ beallitas }`; PUT (törzs: SajatBeallitas) → 200 `{ beallitas }`, hibás → 400 `{ hiba: "ERVENYTELEN_ADAT" }`.
- `apps/web/app/api/ertesites/olvasott/route.ts` — POST törzs `{ mind: true }` VAGY `{ esemeny_id: uuid }` → 200 `{ lista }` (a frissített lista); más törzs → 400.
Minden végpont try/catch, `console.error("… hiba:", h)` + 500 `{ hiba: "BELSO_HIBA" }`.

HATÁR: az `index.ts` és a három `route.ts`. A `tipusok.ts`, a `sema.ts`, a migráció: NEM nyúlsz. TypeScript szigorú (`noUncheckedIndexedAccess` → a tömb-index `| undefined`;
`exactOptionalPropertyTypes`; `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`. Drizzle: `eq, and, inArray, isNull, desc, lte` a `drizzle-orm`-ból.
KÉSZ, HA: `pnpm --filter web tipus` zöld.
Visszaadás: a négy fájl teljes tartalommal, külön `=== FÁJL: <út> ===` blokkban. Semmi más szöveg.
