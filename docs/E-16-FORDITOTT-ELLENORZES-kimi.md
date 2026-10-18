## Felesleg (van nálunk, nincs a rajzon) — HIBA

| Elem | Hol a kódban | Javaslat |
|------|-------------|----------|
| Szintválasztó select a fejlécben, amikor a felhasználó NEM rendszergazda | `Feliratok.tsx`: a `rendszergazda ? (…<select>…)` feltétel miatt nem jelenik meg, de a `km-tema-allapot-valaszto` osztályú elem a kódban létezik | Ellenőrizni: a rajzon mindig látszik a szintválasztó; ha nem rendszergazda, akkor is csak olvashatóan? A rajzon nincs ilyen állapot. |
| `data-piszkos="false"` állapot jelzése (szinkronban) | `Feliratok.tsx`: `<span className="km-tema-piszkos" data-piszkos={piszkos ? "true" : "false"}>` — a rajzon csak a piszkos jelvény látszik, a "szinkronban" soha | A "szinkronban" szöveg és a hozzá tartozó jelvény eltávolítása, ha nincs piszkos állapot. |
| Üzenet: betöltés folyamatban (`betoltes === "folyik"`) | `Feliratok.tsx`: külön üzenetdoboz a `km-tema-uzenet` osztállyal | A rajzon nincs ilyen átmeneti állapot-jelzés; csak a "Tervezet mentve" üzenet látszik példaként. |
| Üzenet: betöltési hiba (`betoltes === "hiba"`) újrapróbálással | `Feliratok.tsx`: külön hibaüzenet "Betöltés újra" gombbal | A rajzon nincs ilyen. |
| Üzenet: nincs jog (`!szerkesztheto`) | `Feliratok.tsx`: külön figyelmeztetés | A rajzon nincs ilyen; a gombok inaktívak lehetnek, de külön üzenet nem látszik. |
| Import hibák listája kóddobozokkal | `Feliratok.tsx`: `importHibak.length` feltétel | A rajzon nincs ilyen részletes hibakiírás; az import szekcióban csak a jegyzet látszik. |
| `km-feliratok-csoport-valaszto` select a lenyílóban, amikor NEM `mindenhol` | `Feliratok.tsx`: `{mindenhol ? <option value="">{t("feliratok.szuro_mind")}</option> : null}` | A rajzon a lenyíló mindig csak a képernyőket listázza, nincs "Mind" opció a nem-keresési állapotban. |
| `rows={2}` a textarea-kon | `Feliratok.tsx`: `<textarea … rows={2} …>` | A rajzon nincs `rows` attribútum megadva; a `min-height: 66px` határozza meg a magasságot. |
| `aria-label`, `aria-live`, `aria-hidden` attribútumok | `Feliratok.tsx`: számos helyen | A rajzon nincsenek ARIA attribútumok (ez elfogadható különbség, de a szabály szerint jelezni kell). |
| `disabled` állapotok a gombokon | `Feliratok.tsx`: `disabled={!kesz || fut || !szerkesztheto}` | A rajzon nincs inaktív gomb megjelenítve; a gombok mindig aktívnak tűnnek. |
| `fut` állapot (töltés közbeni letiltás) | `Feliratok.tsx`: `useState(false)` | A rajzon nincs ilyen átmeneti állapot-jelzés. |
| `km-fejlec-link` osztály a vissza-linken | `Feliratok.tsx`: `<a href="/fiok" className="km-fejlec-link">` | A rajzon egyszerű `<a>` tag, nincs külön osztály. |
| `km-tema-szekcio-cim` a fő panel címénél | `Feliratok.tsx`: `<h2 className="km-tema-szekcio-cim">` | A rajzon sima `<h2>` stílussal, nincs `km-tema-szekcio-cim` osztály a címen. |
| `km-tema-jegyzet` osztály a magyarázaton | `Feliratok.tsx`: `<div className="km-tema-jegyzet km-feliratok-magyarazat">` | A rajzon inline stílus, nincs külön osztály. |
| `km-tema-mod` és `km-tema-mod-gomb` a szűrőknél | `Feliratok.tsx`: `<div className="km-tema-mod km-feliratok-szurok">` | A rajzon inline stílusú gombok, nincs `km-tema-mod` konténer. |
| `km-feliratok-ures` üzenet | `Feliratok.tsx`: `<div className="km-feliratok-ures">` | A rajzon nincs "Nincs találat" állapot megjelenítve. |
| `km-feliratok-kartya` `data-sajat` attribútuma | `Feliratok.tsx`: `<div … data-sajat={s ? "true" : "false"}>` | A rajzon a "saját" kártya `background: rgba(255,255,255,0.04)`-tel különbözik, nincs `data-sajat` attribútum. |
| `km-tema-io-gombok` konténer | `Feliratok.tsx`: `<div className="km-tema-io-gombok">` | A rajzon sima `<div style="display: flex; gap: 8px; flex-wrap: wrap;">`, nincs külön osztály. |
| `km-tema-io-mezo` osztály | `Feliratok.tsx`: `<textarea className="km-tema-io-mezo">` | A rajzon inline stílus, nincs külön osztály. |
| `km-tema-verzio-ures` üzenet | `Feliratok.tsx`: `<div className="km-tema-verzio-ures">` | A rajzon nincs üres verzió-lista állapot. |
| `km-tema-verziok` lista és `km-tema-verzio` elemek osztályai | `Feliratok.tsx`: számos `km-tema-verzio-*` osztály | A rajzon inline stílus, nincsenek ezek az osztályok. |
| `km-tema-verzio-gomb` osztály | `Feliratok.tsx`: `<button … className="km-tema-gomb km-tema-verzio-gomb">` | A rajzon inline stílusú gomb, nincs külön osztály. |
| `km-feliratok-tovabbi` konténer | `Feliratok.tsx`: `<div className="km-feliratok-tovabbi">` | A rajzon sima `<div style="display: flex; justify-content: center; margin-top: 14px;">`. |
| `km-feliratok-also` konténer | `Feliratok.tsx`: `<div className="km-feliratok-also">` | A rajzon sima `<div style="display: grid; …">`. |

## Hiány (van a rajzon, nincs nálunk) — KÉRDÉS

| Rajz-elem | Megjegyzés |
|-----------|-----------|
| **Asztali: fejléc bal oldalán a szint-jelvény szövege részletesen**: "a szervezet saját szövegei — csak a közöstől eltérő sorok" | Nálunk `t("feliratok.szint_szervezet")` = "a szervezet saját szövegei — csak a közöstől eltérő sorok" — EGYEZIK, nem hiány. |
| **Telefon: "Elvetés" gomb rövidített szövege** | Nálunk `t("tema.discard")` = "Módosítások elvetése" — a telefon rajzon "Elvetés" látszik. A `feliratok-hu.json`-ban nincs "Elvetés" kulcs. |
| **Telefon: "Alkalmazás" rövidített szöveg** | Nálunk `t("tema.apply")` = "Alkalmazás a teljes alkalmazásra" — a telefon rajzon "Alkalmazás" látszik. A `feliratok-hu.json`-ban nincs rövidített forma. |
| **Asztali: "Módosítások elvetése" gomb** | Nálunk `t("tema.discard")` — egyezik. |
| **Asztali: "Tervezet mentése" gomb (félkövér)** | Nálunk `t("tema.save_draft")` — egyezik, de a CSS-ben nincs `font-weight: 600` a mentés gombon. |
| **Asztali: "Alkalmazás a teljes alkalmazásra" gomb (gradiens, árnyék)** | Nálunk `t("tema.apply")` — egyezik, de a CSS-ben nincs `box-shadow` az alkalmazás gombon. |
| **Asztali: vissza-link "Vissza a fiókhoz →"** | Nálunk `t("tema.vissza_fiok")` + " →" — egyezik. |
| **Üzenetsáv: "Tervezet mentve. A teljes alkalmazás szövegei nem változtak."** | Nálunk `t("feliratok.notice_draft_ok")` — egyezik. |
| **Bal oszlop: "Képernyők" cím nagybetűvel, trackinggel** | Nálunk `t("feliratok.csoportok")` = "Képernyők" — egyezik, de a CSS-ben nincs `letter-spacing: 0.06em; text-transform: uppercase`. |
| **Bal oszlop: képernyő-lista gombok `border: 1px solid transparent` alapállapotban** | A CSS-ben `.km-feliratok-csoport` `border: var(--bw) solid transparent` — EGYEZIK. |
| **Bal oszlop: aktív képernyő `background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)`** | A CSS-ben `.km-feliratok-csoport[data-be="true"]` `background: var(--panel-soft-2); border-color: var(--line-soft)` — kérdés: a `var(--panel-soft-2)` és `var(--line-soft)` megegyezik-e a rajz értékeivel? |
| **Számláló doboz: "Összes felirat", "Saját módosítás", "Hiányzó fordítás" 3 sor** | Nálunk megvan. |
| **Fő panel: csoport címe + "10 felirat · 1 saját · 1 hiányzó fordítás"** | Nálunk `t("feliratok.csoport_osszeg")` — egyezik. |
| **Fő panel: magyarázat szövege** | Nálunk `t("feliratok.magyarazat")` / `t("feliratok.magyarazat_kozos")` — egyezik. |
| **Kereső: ikon balra, placeholder szöveg** | Nálunk megvan. |
| **3 szűrő gomb: "Mind", "Csak a saját módosítások", "Hiányzó fordítás"** | Nálunk megvan. |
| **Kártya: kulcs kódban, állapot-jelvény** | Nálunk megvan. |
| **"Visszaállítás a közösre" gomb a sajátnál** | Nálunk `visszaNev` — egyezik. |
| **3 nyelv címkével: "Magyar (eredeti)", "Română", "English"** | Nálunk `t("feliratok.nyelv_hu")` stb. — egyezik. |
| **Tartalék-jegyzet: "tartalék: a magyar szöveg látszik, amíg nincs fordítás"** | Nálunk `t("feliratok.tartalek")` — egyezik. |
| **"További N felirat mutatása" gomb** | Nálunk `t("feliratok.tovabbi")` — egyezik. |
| **Export/import szekció: cím, 2 gomb, textarea, jegyzet** | Nálunk megvan. |
| **Korábbi verziók: cím, jegyzet, lista verziókkal, állapot-jelvényekkel, dátummal, "Visszaállítás" gombbal** | Nálunk megvan. |
| **Telefon: fejléc gombjai külön sorban törnek** | A CSS `@media (max-width: 900px)` nem kezeli külön a fejléc gombjait; a `.km-tema-fejlec-jobb` flex-wrap-je a `tema.css`-ből jön. Kérdés: a telefon nézetben a gombok tényleg külön sorba törnek-e? |
| **Telefon: a képernyők listája lenyíló (`<select>`)** | Nálunk `.km-feliratok-csoport-valaszto` — egyezik. |
| **Telefon: nyelvek egymás alatt (1 oszlop)** | A CSS `@media` `grid-template-columns: 1fr` — egyezik. |
| **Asztali: "hibakódhoz kötött" jelvény** | Nálunk `t("feliratok.hibakod")` — egyezik. |

## Eltérő viselkedés / megjelenés

| Rajz | Nálunk | Súly |
|------|--------|------|
| A "Tervezet mentése" gomb **félkövér** (`font-weight: 600`) | A CSS-ben nincs külön stílus a mentés gombhoz; a `km-tema-gomb` osztály nem ad félkövérséget | Közepes — a rajzon kiemelt gomb |
| Az "Alkalmazás a teljes alkalmazásra" gomb **árnyéka**: `box-shadow: 0 4px 16px rgba(95,110,230,0.4)` | A CSS-ben nincs `box-shadow` a `km-tema-gomb-alkalmaz` osztályon (vagy ha van, nem látszik a `feliratok.css`-ben) | Közepes — a rajzon kiemelt, lebegő gomb |
| A fejléc **háttérszíne**: `#12141c` | A `km-tema-fejlec` osztály a `tema.css`-ből jön; kérdés: megegyezik-e? | Alacsony — ha a téma változói jók |
| A "szinkronban" jelvény **soha nem látszik** a rajzon | Nálunk mindig renderelődik, csak `data-piszkos="false"`-sal | Alacsony — funkcionális, nem vizuális hiba |
| A bal oszlop **sticky** pozicionálása: `top: 76px` | A CSS-ben `position: sticky; top: 76px` — egyezik | — |
| A kártya **saját állapotának háttere**: `rgba(255,255,255,0.04)` | A CSS-ben `var(--panel-soft-2)` | Alacsony — ha a változó értéke egyezik |
| A kereső ikon **színe**: `#7a8496` (fix szín) | A CSS-ben `color: var(--text-dim)` | Alacsony — ha a változó értéke egyezik |
| A textarea **placeholder színe**: `#6b7484` a rajzon, de a tartalék textarea-nál `#7a8496` | A CSS-ben `::placeholder { color: var(--text-faint); }` egységesen | Közepes — a rajzon a tartalék textarea placeholder színe eltér |
| Telefon: a fejléc **nem tör 3 sorba** egyértelműen a rajzon | A CSS `@media` nem kezeli külön a fejléc layout-ját; a `tema.css` flex-wrap-je dönt | Közepes — lehet, hogy a gombok nem törnek megfelelően |
| A "Közös elemek" csoport a rajzon **4** elemet mutat | A `CSOPORT_SORREND`-ben `"kozos"` van, de a tényleges darabszám az adattól függ | — (ismert eltérés) |
| A `feliratok.css` **nem definiálja** a `km-tema-*` osztályokat, csak a `feliratok-*` prefixűeket | A `tema.css`-ből származnak — kérdés: a téma CSS tényleg betöltődik-e? | Alacsony — architekturális kérdés |

## Egyezik

- Fejléc szerkezete: cím, szint-jelvény, piszkos jelvény, szintválasztó (rendszergazdánál), nyelvválasztó, 3 gomb, vissza-link
- Üzenetsáv elhelyezése és stílusa (zöld háttér, zöld szöveg)
- Bal oszlop: képernyők listája darabszámmal, számláló doboz 3 sorral
- Fő panel: csoport címe + összeg, magyarázat, keresőmező ikonnal, 3 szűrő
- Kártyák szerkezete: kulcs, állapot-jelvények, "Visszaállítás a közösre" gomb, 3 nyelv textarea-val, tartalék-jegyzet
- "További N felirat mutatása" gomb középre igazítva
- Export/import és Korábbi verziók szekciók alul, 2 oszlopban asztalon, 1 oszlopban telefonon
- Telefon: lenyíló képernyőválasztó, nyelvek egymás alatt, fejléc gombjai törnek (elvileg)
- A keresés és a saját/hiányzó szűrő minden képernyőre kiterjed, ilyenkor "Mind" a cím
