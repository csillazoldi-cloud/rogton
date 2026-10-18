# R-15 · A6 — 08c 4–5: a Képek kitöltője — „A poszthoz teszem” / „Poszthoz teszem”

A mellékelt MAI `Kitolto.tsx`-et adod vissza egészben, ezekkel a változtatásokkal (minden más marad, szóról szóra):
Rajz: `08c-kep.resz.html` — 4 · Képek, a posztból nyitva · 5 · Képek, magában nyitva.

1. Új, opcionális prop: `poszt?: { id: string; nev: string }` (a kiszolgálói lap adja, ha a címben `?poszt=` van).
2. Új segéd a komponensben: `async function kepetMent(): Promise<string | null>` — az aktuális `eredmeny.kep` (base64 PNG) bájtjait feltölti:
   `fetch("/api/r15/kep", { method: "POST", body: <Uint8Array a base64-ből>, headers: { "x-fajl-nev": encodeURIComponent(<a kép első szövegsora, a kepSzoveg() első sora, vagy helyzet>), ...(poszt ? { "x-poszt": poszt.id } : {}) } })` → a válasz `kep.id`; hibánál `null`.
3. **Posztból nyitva** (`poszt` van): a lap tetején halk sor `t("r15.kep.poszthoz_ehhez", { nev: poszt.nev })` (a `useFeliratok` `t`-jével). A `letoltesGomb` helyén (asztal ÉS telefon, ugyanott, ugyanazzal a tiltással) a fő gomb szövege `r15.kep.a_poszthoz_teszem`: `kepetMent()` → ha sikerült, `window.location.href = "/poszt?munka=" + poszt.id`. Mellé halk gomb `r15.kep.csak_letoltom` = a mai `letolt()`. A Kész lapra ilyenkor nem megy.
4. **Magában nyitva** (`poszt` nincs): a mai Letöltés gomb marad fő gomb; mellé halk gomb `r15.kep.poszthoz_teszem`: `kepetMent()` → a kapott `kepId`-vel megnyitja a `R15PoszthozTeszem` felugrót (`import { R15PoszthozTeszem } from "./R15PoszthozTeszem";` — `kepId`, `kepSzoveg={kepSzoveg()}`, `onZar`).
5. A mai `letolt()` is mentse el a képet a Kész képeim közé: a `fajlba(...)` után `void kepetMent();` (tűz-és-felejtsd, a letöltés nem vár rá).
6. Új CSS nem kell: a halk gombhoz a mai `km-vz-gomb-szellem` osztályt használd.

TypeScript szigorú. Visszaadás: `=== FÁJL: apps/web/app/kepek/Kitolto.tsx ===` … `=== FÁJL VÉGE ===`, semmi más.
Mellékletek: `_kozos.md` (a szabályok közül itt csak a TypeScript és a feliratkulcs rész érvényes), `08c-kep.resz.html`, `MAI-Kitolto.tsx`, `feliratok.json`.
