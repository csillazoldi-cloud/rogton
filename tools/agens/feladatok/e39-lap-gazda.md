Te egy React/TypeScript fejlesztő vagy egy meglévő Next.js 16 alkalmazásban. A feladat: EGY képernyő
megírása a mellékelt RAJZ szerint. A rajz a mérce: ami nincs rajta, az ne kerüljön a képernyőre;
ami rajta van, az kerüljön rá.

MELLÉKLETEK
1. `Koltseg-gazda.dc.html` — a RAJZ (tervezői formátum). A benne lévő HTML szerkezetet és a stílust
   kell átültetni. A benne lévő adatok mintaadatok — a valódi adat az API-ból jön.
2. `Tema.tsx` — egy MEGLÉVŐ lap ebből az alkalmazásból: ebből másold a szerkezeti mintákat
   (kliens-komponens, feliratok használata, betöltés, hibakezelés, mentés).
3. `tema.css` — a meglévő lap CSS-e: ebből látod, hogyan írunk CSS-t (osztálynevek, tokenek).

AMIT ÍRNOD KELL — pontosan két fájl:

=== FÁJL: apps/web/app/koltseg/KoltsegGazda.tsx ===
"use client" komponens. Bemenete: `{ kezdo: GazdaNezet; feliratok: Record<string,string>; honap: string }`.
- A táblázat sorai a `kezdo.sorok` tömbből jönnek (mezők: szervezet_id, nev, hivasok, helyi_hivasok,
  ido_ms, usd, keret_usd, sajat_keret, utolso, hol).
- A `hol` mező értéke "helyi" | "felho" | "vegyes" | "nincs" — ez a név alatti kis pont és szöveg
  (feliratkulcsok: koltseg.helyi, koltseg.felho, koltseg.vegyes, koltseg.nincs_hivas).
  A pont színe: helyi = var(--ok), felho = var(--warn), vegyes = var(--primary-2), nincs = var(--text-faint).
- A keret mező szerkeszthető beviteli mező. Ha a felhasználó megváltoztatja, a "Keretek mentése" gomb
  aktívvá válik, és PUT kérést küld a `/api/koltseg/keret` címre ilyen törzzsel:
  `{ "keretek": [ { "szervezet_id": "...", "keret_usd": 5 } ] }` — csak a MEGVÁLTOZOTT sorokat küldd.
  A válasz ugyanaz a GazdaNezet szerkezet `{ koltseg: ... }` burokban; ezzel frissítsd az állapotot.
  Siker után írd ki a koltseg.keret_mentve feliratot. A "Mégse" visszaállítja a beírt értékeket.
- A négy összesítő kártya értékei: kezdo.osszes.hivasok, kezdo.osszes.helyi_hivasok,
  kezdo.osszes.usd, kezdo.osszes.ido_ms.
- A hónapválasztó a mostani és az előző 11 hónapot kínálja (YYYY-MM), és váltáskor
  `GET /api/koltseg/osszes?honap=YYYY-MM` kéréssel tölt újra.
- A "Letöltés táblázatba" gomb CSV-t állít elő a böngészőben a látható sorokból és letölti.
- Minden szöveg a `feliratok` térképből jön (kulcs → szöveg); ha egy kulcs hiányzik, a kulcs
  jelenjen meg. A `{n}` helyettesítőt cseréld le a számra.
- Az időt így írd ki: 60000 ms fölött "{n} perc" (koltseg.perc), alatta "{n} mp" (koltseg.masodperc).
- A pénzt két tizedesjeggyel, magyar tizedesvesszővel, utána " $".
- A keret-kihasználtság sáv: (usd / keret_usd * 100), 100%-ra vágva; 80% fölött a sáv színe
  `linear-gradient(120deg,#ff4520,#ff7a55)`, alatta `var(--grad-primary)`.

=== FÁJL: apps/web/app/koltseg/koltseg-gazda.css ===
A lap CSS-e. MINDEN érték token legyen (var(--...)), ahogy a rajzban és a tema.css-ben látod.
Osztálynév-előtag: `.km-kolt`. Telefonra is működjön (720 px alatt a táblázat vízszintesen görgethető).

SZABÁLYOK
- TypeScript, szigorú típusok, `any` nélkül. React 19, Next 16.
- Ne találj ki új mezőt, gombot vagy szöveget, ami nincs a rajzon.
- A válaszod CSAK a két fájlblokk legyen, `=== FÁJL: út ===` és `=== FÁJL VÉGE ===` közé zárva.
