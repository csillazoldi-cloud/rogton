# F-7b · Építő — a Kimenő értesítések lap adatforrása (`apps/web/kimeno/index.ts`) és a hírfigyelő áttekintőjének AI-jelzője

CÉL: (1) `apps/web/kimeno/index.ts` — a `KimenoNezet` a szerződés szerint (`apps/web/kimeno/tipusok.ts`, melléklet; abból importálsz, nem írsz bele);
(2) a `GET /api/hirfigyelo/attekintes` válasza kap egy `ai_engedelyezve: boolean` mezőt (a hírfigyelő lapjának figyelmeztető sávjához, R-5 06. artboard).
Minta a stílusra: `apps/web/ertesites/index.ts` (melléklet).

1. `apps/web/kimeno/index.ts` (`import "server-only"`; `export * from "./tipusok"`):
```ts
export async function kimenoNezet(fiok: FiokNezet, szervezetId: string, szerep: "tulajdonos" | "szerkeszto" | "nezo"): Promise<KimenoNezet | null>
```
- `nezet`: `fiok.rendszergazda` → `"rendszergazda"`; különben `szerep === "tulajdonos"` → `"tulajdonos"`; különben **null** (a lap nem jár — a hívó a Gépházra irányít).
- `bekotve`: `Boolean(process.env["ERTESITES_WEBHOOK_URL"]?.trim())` (a cím titok — a felületre soha, csak igen/nem).
- `kozos`, `szervezeti`, `hatasos`: `import { esemenyKornyezet, ertesitesLekerdez } from "../esemeny"` → `const e = await ertesitesLekerdez(await esemenyKornyezet(), { fiok_id: fiok.id, szervezet_id: szervezetId, szerep });`
  `e.ok` → `e.ertek.kozos`, `e.ertek.szervezeti`, `e.ertek.hatasos`; ha `!e.ok` → dobj hibát (`throw new Error(e.hiba)`), a hívó kezeli.
- `csoportok`: `KIMENO_CSOPORTOK` a `tipusok.ts`-ből; tulajdonosnál a `RENDSZERSZINTU_FAJTAK` (`belepesi_kiserletek`) KIMARAD a csoportból (a tulajdonos lapján 24 sor); rendszergazdánál mind a 25 marad.
  Az eredmény `{ kod, fajtak: [...] }[]` (másolat, nem a readonly tömb).

2. `apps/web/app/api/hirfigyelo/attekintes/route.ts` (melléklet — a mai fájl) kiegészítése:
- a `valasz({ hirfigyelo: { ...adat, sorban } })` helyett `valasz({ hirfigyelo: { ...adat, sorban, ai_engedelyezve } })`, ahol
  `ai_engedelyezve` = a szervezet `ai_engedelyezve` oszlopa: `import { eq } from "drizzle-orm"; import { sema, szervezetKent } from "../../../../adatbazis/kapcsolat";`
  `const sor = await szervezetKent(eredmeny.szervezet.id, async (tx) => (await tx.select({ be: sema.szervezet.aiEngedelyezve }).from(sema.szervezet).where(eq(sema.szervezet.id, eredmeny.szervezet.id)).limit(1))[0]);`
  `const ai_engedelyezve = sor?.be ?? true;` — hiba esetén `true` (a lap nem dőlhet el ezen).
- Minden más változatlan.

HATÁR: a két fájl. A `tipusok.ts`, a `sema.ts`, az esemény-mag: NEM nyúlsz. TypeScript szigorú (`noUncheckedIndexedAccess` → tömb-index `| undefined`; `exactOptionalPropertyTypes`;
`verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`.
KÉSZ, HA: `pnpm --filter web tipus` zöld.
Visszaadás: a két fájl teljes tartalommal, külön `=== FÁJL: <út> ===` blokkban. Semmi más szöveg.
