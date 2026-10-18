# F-6b · Építő — az „Arculati anyagok" blokk (`apps/web/app/_kozos/ArculatAnyagok.tsx` + `arculat-anyagok.css`) az R-6 rajz szerint

CÉL: egy ÖNÁLLÓ kliens-komponens, ami a rajz hat artboardját adja: négy cél (logó · arculati kézikönyv · vizuális referenciák · egyéb dokumentum), feltöltés
húzással vagy kattintással, feltöltés közben pörgő + mondat, a fájlok listája előnézettel és metaadattal, a négy hibaút a mező helyén, Csere megerősítéssel
(a tervezet-következmény kimondva), a korábbi példányok halványan, néző szerepben csak olvasás. **Eltávolítás gomb NINCS** (nem törlünk). A komponenst két
helyre más köti be (az ügyfélprofil lapja és az onboarding 3. lépése) — te csak a komponenst és a CSS-ét írod.

FORRÁS: a hat artboard HTML-je (a rajz hiteles szövege és szerkezete, a tokennevek onnan), a `feliratok.json` (51 `arculat_fajl.*` kulcs — CSAK ezeket és a lent
nevezett meglévőket hívd), az `ATADO.md`, az `ELLENORZES.md` (a döntések), a minták: `app/_kozos/ArculatBlokk.tsx` (a mai arculat-blokk stílusa, `useFeliratok`,
`valtozik()`), `app/_kozos/kliens.tsx` (`FajlValaszto`, `hivas`), `app/_kozos/hibaszoveg.ts` (`hibaKod`, `hibaSzoveg`), `app/_kozos/fiok.css` (osztálynevek stílusa).

A GÉPEZET (kész, próbázott):
- `POST /api/arculat/fajl` — a bájtok a törzsben (`fetch(url, { method: "POST", body: file, headers: { "x-fajl-nev": encodeURIComponent(file.name), "x-fajl-cel": cel, "content-type": "application/octet-stream" }, credentials: "same-origin" })`)
  → 201 `{ fajl: FajlMeta }`; hibák: 415 `SVG_NEM_ENGEDETT`, 415 `TIPUS_NEM_ENGEDETT`, 413 `TUL_NAGY`, 400 `URES`; a mondataik a `fajl.hiba_svg_nem_engedett`,
  `fajl.hiba_tipus_nem_engedett`, `fajl.hiba_tul_nagy`, `fajl.hiba_ures` kulcsokon (MEGVANNAK) — a rajz 03. artboardja ezek köré ír címet és „mit tegyen" mondatot
  (`arculat_fajl.hiba_*` kulcsok). A típus a TARTALOMBÓL dől el (png · jpg · webp · pdf), 10 MB minden célra.
- `GET /api/arculat/fajl` → `{ fajl: FajlMeta[] }` (a munkatér minden fájlja; `?cel=logo` szűr). `FajlMeta = { id, szervezet_id, nev, tipus: "png"|"jpg"|"webp"|"pdf", cel: "logo"|"kezikonyv"|"referencia"|"dokumentum", meret, feltoltotte, feltoltve }` (ISO).
- `GET /api/arculat/fajl/{id}` → a bájtok (képnél `<img src={`/api/arculat/fajl/${id}`}>`; PDF-nél nincs képes előnézet: típus + méret áll, oldalszám NINCS).
- A tervezet `logo_fajl_id` mezője mondja, melyik logó van „használatban"; a korábbi jóváhagyott pillanatképek (`verziok`) saját `logo_fajl_id`-t őriznek.

A KOMPONENS:
```ts
export function ArculatAnyagok({ arculat, szerkesztheto, valtozik }: {
  arculat: ArculatLepes;                 // @km/contracts — tervezet?.logo_fajl_id, verziok[…].logo_fajl_id, jovahagyott_verzio
  szerkesztheto: boolean;                // néző: false → a feltöltő mezők NEM jelennek meg, a fájlok megnyithatók (02/C)
  valtozik: (uj: (regi: ArculatLepes) => ArculatLepes) => void;   // a logó cseréje ezzel írja a tervezet logo_fajl_id-jét (ugyanaz, mint az ArculatBlokk-ban)
})
```
- Betöltés: `useEffect` → `GET /api/arculat/fajl` → a lista célonként. Hiba → `arculat_fajl.hiba_betoltes` (ha nincs ilyen kulcs, a `hiba.ALTALANOS`).
- **01 üres**: cím `arculat_fajl.cim` + `arculat_fajl.opcionalis` jelvény + `arculat_fajl.bevezeto`; négy oszlop (`arculat_fajl.cel_<cel>` cím, feltöltő mező
  `arculat_fajl.mezo_huzd` + `arculat_fajl.mezo_tipusok`, alatta a cél segítő mondata `arculat_fajl.segit_<cel>`); alul `arculat_fajl.nem_toroljuk`. A mező:
  `<label>` + rejtett `<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf">`, `onDragOver`/`onDrop` — a húzott fájl(ok) sorban mennek fel.
- **02/A közben**: a mező helyén a fájl neve + pörgő + `arculat_fajl.feltoltes_kozben`, alatta a „típus a tartalomból" mondat és a „nincs százalék" mondat.
  **02/B kész**: sor: bélyegkép (kép: `<img>`; PDF: `PDF` jelvény) · név · meta (`arculat_fajl.meta` `{ tipus, meret, ido }` — méret kB/MB a felület nyelvén,
  idő `Intl.DateTimeFormat(nyelv, { …, timeZone: "Europe/Bucharest" })`) · gombok: `Csere` (logó/kézikönyv) vagy újabb feltöltő mező (referencia/dokumentum) ·
  `Megnyitás` (`<a href target="_blank">`). A logónál a „két háttéren" előnézet (`arculat_fajl.elonezet_ket_hatter` + a mondat): egy fehér és egy sötét doboz,
  mindkettőben a kép — a két háttér FIX szín (`#ffffff` és `#14151b`), mert háttér-PRÓBA, nem a rendszer színe: írd mellé `/* tokenőr: ok — háttér-próba, ügyfélkreatív */`.
  **02/C néző**: `arculat_fajl.csak_olvasas` jelvény, mezők nélkül, a lista Megnyitással.
- **03 hibák**: a mező helyén, a fájl nevével: cím (`arculat_fajl.hiba_<eset>_cim`) + a rendszer mondata (`fajl.hiba_*`) + „mit tegyen" (`arculat_fajl.hiba_<eset>_mit`);
  az SVG-nél az ok halkabb mondata; a `TUL_NAGY`-nál a „minden célra ugyanaz" megjegyzés. Egy „Rendben" gomb (`kozos.rendben` — ha nincs, `arculat_fajl.hiba_bezar`) visszateszi a mezőt.
- **04 előnézet szabályai**: a kép `object-fit: contain`, fix magasságú doboz, átlátszó PNG a két háttéren látszik; PDF: típus + méret.
- **05/A csere**: a Csere gomb megerősítő kártyát nyit (`arculat_fajl.csere_cim`, mostani → új bélyegkép, `arculat_fajl.csere_kovetkezmeny_cim/_szoveg`,
  `arculat_fajl.csere_nem_torol`, gombok `arculat_fajl.csere_gomb` / `kozos.megse`); megerősítés után POST, siker után **logónál** `valtozik((r) => ({ …tervezet logo_fajl_id: uj.id }))`
  — a tervezet módosítása az ArculatBlokk mintájára (ha `tervezet` null, a rajz szerint a csere nem indít tervezetet, csak a fájl kerül fel).
  **05/B lista csere után**: az új sor `arculat_fajl.hasznalatban` jelvénnyel; a régi halványan, `arculat_fajl.jovahagyott_tervezetben` (`{ n }` = a jóváhagyott verzió
  száma, amelyik rá hivatkozik — a `verziok`-ból; ha egyik sem, `arculat_fajl.korabbi`) + Megnyitás.
- **06 telefon** (`max-width: 640px`): a négy cél egymás alatt, a gombok teljes szélességűek.
- Minden szöveg `t()`-ből; a fájlnév adat. Osztályelőtag `km-af-`. CSS csak tokenekkel; minden térköz `var(--ter-N)`; pixel-térköz és puszta `0` tilos; a bélyegkép
  mérete (56×56) és az előnézet-doboz magassága alakérték, pixelben maradhat.

HATÁR: a két fájl. Az `ArculatBlokk.tsx`, a lapok, a `kliens.tsx`: NEM nyúlsz. TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`. Beégetett szín/betű/méret/lekerekítés TILOS (a két háttér-próba kivételével, megjegyzéssel).
KÉSZ, HA: `pnpm --filter web tipus` zöld, tokenőr zöld; a komponens a hat artboard állapotát adja.
Visszaadás: a két fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban. Semmi más szöveg.
