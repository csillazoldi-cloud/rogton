## Felesleg (van nálunk, nincs a rajzon) — HIBA

| Elem | Hol a kódban | Javaslat |
|---|---|---|
| Betöltés-állapot üzenetek (`betoltes_loading`, `betoltes_load_err`, `betoltes_retry`) | `Feliratok.tsx` sorok: `betoltes === "folyik"`, `betoltes === "hiba"`, `betoltes_retry` | A rajzon nincs betöltés-állapot kijelzés; a "Tervezet mentve" az egyetlen üzenetminta. Kérdés: szándékos a hálózati állapot megjelenítése? |
| Jogosultsági üzenet (`!szerkesztheto`) | `Feliratok.tsx`: `!szerkesztheto ? <div className="km-tema-uzenet"...` | A rajzon nincs ilyen figyelmeztető sáv. Szándékos védelem? |
| `km-tema-gomb-kiemelt` osztály a "Tervezet mentése" gombon | `Feliratok.tsx` sor: `className="km-tema-gomb km-tema-gomb-kiemelt"` | ELFOGADOTT (E-16 javítás) — megemlítve a feladatban |
| `km-csak-asztal` / `km-csak-telefon` span-ek a gombokban | `Feliratok.tsx`: két gombnál (`discard`, `apply`) | ELFOGADOTT (E-16 javítás) |
| `FajlValaszto` komponens + "Exportálás fájlba" / "Importálás fájlból" gombok | `Feliratok.tsx`: `exportalFajlba`, `FajlValaszto` | ELFOGADOTT (E-17, E-16 javítás) |
| `importHibak` részletes lista kijelzése | `Feliratok.tsx`: `importHibak.length ? ...` | A rajzon nincs import-hiba megjelenítés; a JSON mező alatt csak magyarázó szöveg van |

## Hiány (van a rajzon, nincs nálunk) — KÉRDÉS

| Rajz-elem | Megjegyzés |
|---|---|
| Asztali: "Közös elemek" csoport a bal listában | `CSOPORT_SORREND`-ben van `"kozos"`, de a rajzon 4 db, a JSON-ban `csoport_kozos`: "Közös elemek" — egyezik, rendben |
| Telefon: a fejléc gombjai sorba törnek | A CSS-ben `@media (max-width: 900px)` a `.km-tema-fejlec-jobb` flex viselkedését nem írja felül külön; a gombok `flex-wrap: wrap` a konténeren van, de a `.km-tema-fejlec` saját szabályai a `tema.css`-ből jönnek — biztosan törik a sor? |
| Asztali: a "Visszaállítás a közösre" gomb a `saját` kártyánál `padding: 5px 10px; font-size: 12px` | `.km-feliratok-vissza` CSS-ben: `padding: 5px 10px; font-size: var(--fs-xs)` — a `--fs-xs` általában 12px, rendben |
| Asztali: `hiba.ROSSZ_BELEPES` és `hiba.NINCS_BELEPVE` kártyáknál a "hibakódhoz kötött" jelvény két külön `span` | Nálunk egy `hibakodhozKotott(k)` függvény adja; a rajzon mindkét kártyán látszik — rendben, a logika jó |
| Telefon: a "Visszaállítás a közösre" gomb a kártya *alján*, nem a fejlécben | A telefon rajzon a gomb a 3 nyelv textarea alatt van; az asztalin a fejlécben. Nálunk a JSX-ben mindig a fejlécben: `{s ? <div className="km-feliratok-kartya-jobb">...` — ez telefonon is a fejlécben marad? |
| Asztali: az üzenetsáv zöld háttérrel: `background: rgba(74,222,128,0.13)` | `.km-tema-uzenet[data-fajta="ok"]` a `tema.css`-ből jön; a szín egyezik-e? Nem látom a `tema.css`-t, de a `--ok` token valószínűleg ugyanez |

## Eltérő viselkedés / megjelenés

| Rajz | Nálunk | Súly |
|---|---|---|
| Asztali: szintválasztó címkéje "Saját szervezet — Minta Műhely" | `t("tema.szint_valaszto_szervezet")` + `szervezetNev` külön: "Saját szervezet — Minta Műhely" — egyezik | — |
| Asztali: nyelvválasztó 3 nyelvet mutat | `<Nyelvvalaszto />` — feltételezem 3 nyelvet, a `NYELVEK` tömb alapján | alacsony (biztosra vehető) |
| Telefon: nyelvválasztó csak "Magyar" | A `Nyelvvalaszto` komponens viselkedése ismeretlen; ha mindig 3 nyelvet mutat, az eltérés | közepes — ellenőrizni kell |
| Telefon: "Elvetés" rövidítés a gombon | `t("feliratok.discard_rovid")` = "Elvetés" — egyezik | — |
| Asztali: kereső placeholder "Keresés kulcsra vagy szövegre — pl. „belépés” vagy „hiba.”" | `t("feliratok.kereses_pl")` — egyezik | — |
| Asztali: szűrő gombok "Mind", "Csak a saját módosítások", "Hiányzó fordítás" | `t("feliratok.szuro_mind")`, `t("feliratok.szuro_sajat")`, `t("feliratok.szuro_hianyzo")` — egyezik | — |
| Asztali: a "saját" kártya háttér `rgba(255,255,255,0.04)` | `.km-feliratok-kartya[data-sajat="true"]` → `background: var(--panel-soft-2)` — a token értéke ismeretlen | alacsony |
| Asztali: a "hiányzó fordítás" jelvény `background: rgba(255,90,55,0.08)` | `.km-feliratok-allapot[data-fajta="hianyzo"]` → `background: var(--warn-bg)` — a token értéke ismeretlen | alacsony |
| Telefon: a kártyák padding `12px` (asztalin `14px 16px`) | CSS-ben nincs telefon-specifikus padding a kártyán — `@media` blokkban nem látom felülírást | közepes — a rajzon telefonon kisebb padding van |
| Asztali: textarea `min-height: 66px` | `.km-feliratok-mezo`: `min-height: 66px` — egyezik | — |
| Asztali: "További N felirat mutatása" középre igazítva | `.km-feliratok-tovabbi`: `justify-content: center` — egyezik | — |
| Telefon: a kereső és szűrők egymás alatt, `align-items: stretch` | `@media (max-width: 900px)`: `.km-feliratok-eszkozok { flex-direction: column; align-items: stretch; }` — egyezik | — |
| Asztali: Export/import gombok "Exportálás a mezőbe", "Importálás a mezőből" | `t("tema.export")`, `t("tema.import")` — egyezik | — |
| Asztali: JSON textarea `background: #12141c` | `.km-tema-io-mezo` — a `tema.css`-ből jön, ismeretlen | alacsony |
| Asztali: verzió listaelem háttér `rgba(255,255,255,0.04)` | `.km-tema-verzio` — a `tema.css`-ből jön, ismeretlen | alacsony |
| Telefon: a "Visszaállítás" gomb a "korábbi" verziónál `padding: 4px 10px; font-size: 12px` | `.km-tema-verzio-gomb` — a `tema.css`-ből jön, ismeretlen | alacsony |

## Egyezik

- Fejléc: cím ("Feliratok"), szint jelvénye, piszkos jelvény, szintválasztó `<select>`, nyelvválasztó `<select>`, 3 gomb (elvetés, tervezet mentése, alkalmazás), vissza-link
- Üzenetsáv: zöld "Tervezet mentve" (a minta szerint)
- Bal oszlop: "Képernyők" cím, csoportlista darabszámmal, számláló doboz 3 sorral (összes, saját, hiányzó)
- Fő panel: csoport címe + összeg, magyarázat szöveg, keresőmező ikonnal, 3 szűrő gomb
- Kártyák: kulcs `<code>`, állapot-jelvény (közös/saját/hiányzó), "hibakódhoz kötött" jelvény, "Visszaállítás a közösre" gomb sajátnál, 3 nyelv címkével, tartalék-jegyzet hiányzónál
- "További N felirat mutatása" gomb
- Alul: Export/import szekció JSON mezővel + magyarázattal, Korábbi verziók szekció listával
- Telefon: képernyők lenyíló `<select>`, nyelvek egymás alatt (grid → 1fr), fejléc gombjai törnek (`flex-wrap`)
