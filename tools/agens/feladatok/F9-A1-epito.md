# Feladat — ÉPÍTŐ (F9-A1): az AI-válaszok szelídítése a hírfigyelőben (beállítás-javaslat · összkép · szabály-javaslat)

TypeScript 7 strict, zod 4.5, vitest. A repó egy pnpm-munkatér. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza, TELJES fájltartalommal (nem diff). Nincs új csomag, nincs `any`, nincs `as unknown as` hackelés a sémák megkerülésére. Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban. Nem írsz felületet (tsx). CSAK az alább felsorolt fájlokat adod vissza.

## MÉRT tények (2026-09-15, gpt-5-mini, `reasoning_effort: "minimal"`, a valódi tesztprofillal) — ezek a hibák okai

1. **hf_beallitas_javaslat** — 4 hívásból 3 megbukott az ellenőrzésen: a modell a `kizarasok` tömbbe EGYETLEN hosszú mondatot ír (mért hosszak: 152, 192, 272 karakter), a `Beallitas` séma pedig tételenként legfeljebb 120 karaktert enged (`kizarasok.0 too_big`). Maga a JSON teljes és helyes volt (finish_reason `stop`, 600–658 kimeneti token a 800-as keretből). A többi mező rendben volt.
2. **hf_osszkep** — 600 tokenes kerettel a modell a TELJES keretet gondolkodásra költi (`reasoning_tokens: 600`, `finish_reason: length`, üres tartalom) → az adapter `AI_ROSSZ_VALASZ`-t dob. 1500-as kerettel a válasz megjön (535–874 token), DE: (a) a `hivatkozott_talalatok` elemei `talalat_<uuid>` alakúak, mert a bemenet `<<ADAT talalat_<uuid>>>` címkével adja őket — a kód a csupasz uuid-t várja, így „nincs ervenyes hivatkozas”; (b) a `szoveg` 3-ból 1-szer 1500 karakter fölé megy (mért: 1594). Javított bemenettel (az azonosító külön `Azonosító:` sorban, és a promptban 1200 karakteres kérés) 3/3 jó volt, 875–1082 karakter.
3. **hf_szabaly_javaslat** — ugyanaz a `Beallitas` séma (a `javasolt` mezőben), tehát ugyanaz a `kizarasok`-hiba fenyeget; a mért válaszok 666–689 tokenesek a 800-as keretből → egy hosszabb már csonkul.

## Mit kell megírni

### 1. ÚJ fájl: `packages/news-monitor-core/src/szelidit.ts`

Tiszta, tárolás- és hálózatmentes függvények. Az ELLENŐRZÉS ELŐTT futnak a nyers (`unknown`) AI-válaszon, és csak ALAKOT javítanak — tartalmat nem találnak ki. Ha a bemenet nem objektum, változatlanul adják vissza. Sosem dobnak kivételt.

```ts
/** Hosszú szöveg rövidítése: legfeljebb `max` karakter; ha vágni kell, az utolsó mondatvégnél (". " / "! " / "? "), annak híján az utolsó szóköznél, és a végére „…” kerül (a „…” beleszámít a max-ba). */
export function szovegRovidit(szoveg: string, max: number): string;

/** Egy kizárás-tétel feldarabolása: ha 120 karakternél hosszabb, `;` és `,` mentén darabol, trimmel, üreseket eldob; ami még mindig hosszabb, azt szovegRovidit(…, 120). */
export function kizarasDarabol(tetel: string): string[];

/** Nyelv-kód: kisbetűs, két betű; a „magyar/hungarian”→hu, „román/romana/română/romanian”→ro, „angol/english”→en nevek átváltása; ami nem két betű a végén, kimarad. */
export function nyelvKod(ertek: unknown): string | null;

/**
 * A Beallitas alakú nyers objektum szelídítése (a `Beallitas` séma korlátaihoz igazítva, kitalálás nélkül):
 *  - minden string trim;
 *  - celok: csak "sajat_marka" | "szakmai" | "tartalomotlet" marad (egyedien); ha nem tömb, érintetlen;
 *  - temak: tömb elemei objektumok; nev → legfeljebb 120; nevvaltozatok → csak nem üres stringek, egyenként ≤120, legfeljebb 20, egyedien; megkulonboztetes → szovegRovidit 500; nem objektum elem kimarad; legfeljebb 30 téma;
 *  - foldrajzi_fokusz → szovegRovidit 300; szabad_szoveg → szovegRovidit 2000;
 *  - nyelvek → nyelvKod, null kimarad, egyedien, legfeljebb 10; ha string (pl. "hu"), egyelemű tömbbé;
 *  - kizarasok → minden elem kizarasDarabol, összefűzve, egyedien, legfeljebb 50; ha string, egyelemű tömbként kezelve;
 *  - idozites: ha objektum és `ora`/`perc` numerikus STRING ("7"), számmá; `mod` kisbetűs; más nem változik.
 * Ismeretlen kulcsok megmaradnak (a séma úgyis eldobja). A visszatérés `unknown`, mert az ellenőrzés a sémáé.
 */
export function beallitasSzelidit(nyers: unknown): unknown;

/**
 * Az összkép nyers válaszának szelídítése:
 *  - szoveg → szovegRovidit 1500;
 *  - hivatkozott_talalatok → csak stringek, trim, a `talalat_` előtag (kis/nagybetűtől függetlenül) levágva, egyedien; ha string, egyelemű tömb;
 *  - bizonytalan: a "true"/"false" string → boolean; szám 0/1 → boolean.
 */
export function osszkepSzelidit(nyers: unknown): unknown;

/** A szabály-javaslat nyers válaszának szelídítése: `javasolt` → beallitasSzelidit; indoklas → szovegRovidit 800; varhato_hatas → szovegRovidit 400; profil_erintett mint a bizonytalan; mi_alapjan: ha string → egyelemű tömb, csak stringek maradnak. */
export function szabalyJavaslatSzelidit(nyers: unknown): unknown;

/** A feladat szerinti szelídítő; a többi feladatnál (hf_relevancia, hf_ugyanaz_az_esemeny, hf_tartalomotlet) a válasz változatlan. */
export function aiValaszSzelidit(feladat: HfFeladat, valasz: unknown): unknown;
```
A `HfFeladat` típus a `./ai`-ban van — KÖRKÖRÖS import elkerülésére a `szelidit.ts` NE importáljon az `./ai`-ból: a feladatnevet `string`-ként vedd át (`feladat: string`), és a hívó (`ai.ts`) adja a HfFeladat-ot.

### 2. MÓDOSÍTOTT fájl: `packages/news-monitor-core/src/ai.ts` (mellékelve)

`aiValaszEllenoriz`-ben a `schema.safeParse(valasz)` HELYETT `schema.safeParse(aiValaszSzelidit(feladat, valasz))`. Fölé egy rövid megjegyzés: „F9-A1 (MÉRVE 2026-09-15): a modell jó tartalmat ad rossz alakban (hosszú kizárás-mondat, `talalat_` előtag, túl hosszú összkép) — a szelídítés az alakot igazítja, tartalmat nem talál ki.” Minden más változatlan; a meglévő próbák (`probak/ai.proba.ts`) ugyanúgy zöldek maradnak (a szelídítés a jó válaszokat nem változtatja).

### 3. MÓDOSÍTOTT fájl: `packages/news-monitor-core/src/index.ts` (mellékelve)

`export * from "./szelidit";` hozzáadva.

### 4. MÓDOSÍTOTT fájl: `apps/web/hirfigyelo/ai.ts` (mellékelve, TELJES fájlt adsz vissza)

- `hf_beallitas_javaslat`: `maxKiToken = 1200;` — megjegyzés: `// F9-A1 MÉRVE 2026-09-15: 600–658 token a jó válasz; a 800 túl szűk egy bővebb profilnál`
- `hf_osszkep`: `maxKiToken = 1500;` — megjegyzés: `// F9-A1 MÉRVE 2026-09-15: 600-nál a gpt-5-mini a teljes keretet gondolkodásra költötte (reasoning 600, üres válasz, 10/10); 1500-nál 535–874 token, mind jó`
  és a bemenet formátuma ÚJ: minden találat
  ```
  <<ADAT talalat>>
  Azonosító: ${t.id}
  Cím: ${t.cim}
  Forrás: ${t.forras}
  Miért fontos: ${t.miert}
  <<ADAT VÉGE>>
  ```
  (a címke NEM tartalmazza az azonosítót — MÉRVE: a `talalat_<id>` címkéből a modell előtagos azonosítót ad vissza).
- `hf_szabaly_javaslat`: `maxKiToken = 1600;` — megjegyzés: `// F9-A1 MÉRVE 2026-09-15: 666–689 token a 800-ból; a teljes beállítás + indoklás + hatás ennél több lehet`
- Minden más sor (a többi feladat, a keret-ellenőrzés, a mérés, a hibakezelés) VÁLTOZATLAN.

### 5. MÓDOSÍTOTT promptok (mellékelve; TELJES fájlokat adsz vissza; az első sor a fejléc — a verziót és a dátumot emeld: `v2 · 2026-09-15`, illetve az összképnél és a szabály-javaslatnál `v3 · 2026-09-15`; a meglévő `<<ADAT …>>`-védelmi bekezdés és a `{{nyelv}}` hely SZÓ SZERINT marad, mert próbák ellenőrzik)

- `packages/news-monitor-promptok/promptok/hf_beallitas_javaslat.hu.md` — a Szabályok közé:
  - `- "kizarasok": rövid kifejezések, tételenként 1–4 szó (pl. "ipari tömeggyártás", "külföldi láncok akciói"), tételenként legfeljebb 100 karakter, legfeljebb 10 tétel. NEM mondat, NEM felsorolás egy stringben.`
  - `- "temak[].nevvaltozatok": legfeljebb 5 rövid változat; "temak[].megkulonboztetes": egy mondat.`
  - `- "szabad_szoveg": legfeljebb két mondat, vagy üres string.`
  - `- "nyelvek": kétbetűs kódok ("hu", "ro", "en").`
- `packages/news-monitor-promptok/promptok/hf_szabaly_javaslat.hu.md` — ugyanez a négy szabály a `javasolt` mezőre vonatkoztatva, plusz: `- "indoklas": legfeljebb 600 karakter; "varhato_hatas": legfeljebb 300 karakter.`
- `packages/news-monitor-promptok/promptok/hf_osszkep.hu.md` — a bemenet leírása: „(minden találatnál külön sorban: Azonosító, cím, forrás, miért fontos)”; a Szabályokban: `- "szoveg": legfeljebb 1200 karakter (kb. 6–8 mondat), magyarul, összefüggő összkép a találatokról.` (az 1500 helyett) és `- "hivatkozott_talalatok": PONTOSAN az „Azonosító:” sorokban álló értékek, előtag és változtatás nélkül; csak a bemenetben szereplő azonosítókat használhatod.`

### 6. ÚJ próbafájl: `packages/news-monitor-core/probak/szelidit.proba.ts`

vitest, a `../src/szelidit` és a `../src/ai` importjával. Legalább ezek:
- `kizarasDarabol("tömeggyártásra és ipari pékségre utaló hírek, nem helyi beszállítókra fókuszáló tartalmak, más városokkal kapcsolatos beszállítói megállapodások, angol nyelvű források ha nincs magyar változat")` → 4 elem, mind ≤120, egyik sem üres;
- egy 120-nál rövidebb tétel változatlanul, egy elemben jön vissza;
- `szovegRovidit` 1594 karakteres, több mondatos szöveget ≤1500-ra vág, mondatvégnél, „…” a végén; rövid szöveg érintetlen;
- `nyelvKod("magyar")` → "hu", `nyelvKod("HU")` → "hu", `nyelvKod("magyar nyelv")` → null;
- `beallitasSzelidit` egy VALÓS mért válaszon (a mellékelt `valasz-2.txt` tartalmát tedd be szó szerint, a `kizarasok` 272 karakteres tételével) → utána `aiValaszEllenoriz("hf_beallitas_javaslat", { beallitas: … }, { talalat_ids: [] })` `ok: true`, és a kizárások száma ≥ 3;
- `aiValaszEllenoriz("hf_osszkep", { szoveg: "x", hivatkozott_talalatok: ["talalat_t-1", "t-2"], bizonytalan: "false" }, { talalat_ids: ["t-1", "t-2"] })` → ok, `hivatkozott_talalatok` = ["t-1","t-2"], `bizonytalan` = false;
- egy jó, séma szerinti válasz szelídítve UGYANAZ marad (`toEqual`);
- nem objektum bemenet (`null`, `"szoveg"`, `42`) változatlanul jön vissza, kivétel nélkül.

## Elfogadás
`pnpm --filter ./packages/news-monitor-core proba` és `pnpm --filter ./packages/news-monitor-promptok proba` zöld; `pnpm tipus` zöld; `pnpm hatar` 0 sértés. Add vissza a 8 fájlt (szelidit.ts, ai.ts, index.ts, apps/web/hirfigyelo/ai.ts, 3 prompt, szelidit.proba.ts).
