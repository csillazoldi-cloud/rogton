# Feladat — ÉPÍTŐ (V1): a munkatér nyelve visz mindent

Vilmos döntése (2026-09-18, a 2026-09-16-i visszajelzések 1. pontja): a felület, a témák és az AI szövegei a MUNKATÉR tartalomnyelvén jelennek meg. A fiók saját nyelve csak akkor számít, ha a fiók KIFEJEZETTEN átállította (Saját fiók lap). Szente esete: a fiókja nyelvet nem választott, a böngészője angol → angol felület, magyar témák.

TypeScript 7 strict, Next 16. Kimenet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkokban; RÉSZLET-fájl (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`; a RÉGI szó szerint a mellékletből, egyedi, 3–8 sor) a meglévő fájlokhoz. Nincs `any`, magyar azonosítók, nincs új csomag.

## MÉRT tények
- `fiok.nyelv` (`adatbazis/sema.ts` 60. sor): `text("nyelv")`, NULL = a fiók még nem váltott nyelvet. A Saját fiók lap írja (`PUT /api/nyelv` — mellékelve).
- Belépéskor (`app/api/fiok/belepes/route.ts` 69–74. sor, mellékelve) a nyelv-süti (`NYELV_SUTI`) a `fiok.nyelv`-re áll — ha az NULL, a süti nem áll be, és a `nyelvKeresbol` (`nyelv/index.ts`, mellékelve) a böngésző Accept-Language-éből választ.
- A munkatér tartalomnyelvei: a profil `nyelvek` mezője (`packages/profile-core`, `SzervezetProfil.nyelvek: Nyelv[]`; az első a fő nyelv — F-10 óta a hírfigyelő futása is ezt használja, `tetelNyelve`). A profil lekérése: `apps/web/profil/index.ts` (mellékelve, a `profilNezet`/`szervezetProfil` függvény).
- Munkatér-váltás: `POST /api/szervezet/valt` (mellékelve).

## Mit kell megírni

### 1. TELJES: `apps/web/nyelv/munkater.ts` (új)
```ts
/** V1: a fiók hatásos felületi nyelve — a fiók saját választása, ha van; különben a munkatér első tartalomnyelve; különben null. */
export async function hatasosNyelv(fiok: { nyelv: string | null }, szervezetId: string | null): Promise<Nyelv | null>
/** A nyelv-süti Set-Cookie fejléce (ugyanaz a forma, mint a belépésnél). */
export function nyelvSutiFejlec(nyelv: Nyelv): string
```
A `hatasosNyelv` a profilból olvassa a `nyelvek[0]`-t (ha a profil vagy a lista üres: null).

### 2. RÉSZLET: `_RESZLET-belepes.md` → `app/api/fiok/belepes/route.ts`
A 69–74. sor helyett: `const nyelv = await hatasosNyelv(fiok, aktualisSzervezet(fiok)?.id ?? null); if (nyelv) valasz.headers.append("set-cookie", nyelvSutiFejlec(nyelv));` (a szükséges importokkal; az `aktualisSzervezet` a `hitelesites`-ből — a belépés fájl már importálja az `aktualisFiok`-ot ugyanonnan).

### 3. RÉSZLET: `_RESZLET-valt.md` → `app/api/szervezet/valt/route.ts`
Sikeres váltás után ugyanez: ha a fiók `nyelv` mezője NULL, a süti az ÚJ munkatér első tartalomnyelvére áll; ha a fiók választott nyelvet, nem nyúlunk a sütihez.

### 4. RÉSZLET: `_RESZLET-layout.md` → `app/layout.tsx` (mellékelve)
Ahol a lap nyelvét a `nyelvKeresbol(süti, accept-language)` adja: belépett fiók esetén, ha NINCS nyelv-süti, a `hatasosNyelv(fiok, szervezetId)` az elsőbbség, és csak utána az Accept-Language. (A süti mindig nyer, ha van.)

### 5. TELJES: `apps/web/probak/nyelv-munkater.proba.ts` (vitest, élő, a `segedek.ts` mintájára — `tema.proba.ts` a minta)
- új fiók + munkatér, a profil nyelvei `["hu","ro"]` (a profil mentésének végpontja a mellékelt profil-próbában látszik); belépés → a válasz `set-cookie` fejlécében a nyelv-süti `hu`, a `/kezdolap` HTML `lang="hu"`.
- ugyanez a fiók a Saját fiókon `en`-t választ (`PUT /api/nyelv`) → belépés után a süti `en` (a fiók választása nyer).

Más fájlhoz ne nyúlj.
