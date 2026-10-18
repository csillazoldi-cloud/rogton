# E-24 Fordított ellenőrzés — a megépített képernyők mérése a v7 prototípus ellen

## Áttekintés (HF-I)

| elem a prototípuson | a kódban | ítélet | megjegyzés |
|---|---|---|---|
| Első használat: cím, szöveg, CTA gomb | `Attekintes.tsx`: `firstUse` blokk, `km-hf-at-elso*` | RENDBEN | CTA link a Beállításra |
| Állapotsáv: futás-pont (zöld/sárga) | `km-hf-at-pont` `data-allapot` | RENDBEN | |
| Állapotsáv: utolsó futás szövege | `t("hf.stLastRun")` / `stNever` | RENDBEN | |
| Állapotsáv: „·” elválasztók | `km-hf-at-status-elvalaszto` | RENDBEN | |
| Állapotsáv: következő futás | `stNextRun` / `stNextManual` | RENDBEN | |
| Állapotsáv: új találatok száma | `stNew` / `stNoNew` | RENDBEN | |
| Részleges hiba jelvény (⚠ + szöveg) | `km-hf-at-reszleges` link | RENDBEN | |
| „Futtatás most” gomb | `km-hf-at-futtatas` | RENDBEN | Néző szerepnél rejtve (megengedett) |
| Futás közbeni spinner + szöveg | `km-hf-at-fut`, `km-hf-at-porgo` | RENDBEN | |
| AI-kiesés sáv | `km-hf-at-figyelmeztetes` | RENDBEN | `aiKieses` logika |
| „Nincs új” doboz (✓ + cím + szöveg) | `km-hf-at-nincs-uj*` | RENDBEN | |
| Összkép blokk: fejléc, jelvény, szöveg, lábjegyzet | `km-hf-at-osszkep*` | RENDBEN | |
| Szűrők: Új, Mentett, Rejtett, Összes | `km-hf-at-szurok`, 4 gomb | RENDBEN | |
| Elrejtett-megjegyzés sáv | `km-hf-at-hidden-note` | RENDBEN | |
| Kártya: fontosság-jelvény | `km-hf-at-imp-*` | RENDBEN | Függőben „…” |
| Kártya: téma-jelvény | `km-hf-at-tema-*` | RENDBEN | |
| Kártya: meta (források + idő) | `km-hf-at-kartya-meta` | RENDBEN | |
| Kártya: verzió-tag | `km-hf-at-kartya-ver` | RENDBEN | |
| Kártya: cím | `km-hf-at-kartya-cim` | RENDBEN | |
| Kártya: összefoglaló | `km-hf-at-kartya-osszefoglalo` | RENDBEN | |
| Kártya: „Miért fontos” + indoklás | `km-hf-at-kartya-miert` | RENDBEN | Függőben is megjelenik („értékelés függőben”) — ELTÉR, lásd lent |
| Kártya: csoportosítás (⧉) | `km-hf-at-kartya-csoport` | RENDBEN | |
| Kártya: Mentés gomb | `km-hf-at-gomb-mentes` | RENDBEN | |
| Kártya: „Nem releváns” gomb | `km-hf-at-gomb-ghost` | RENDBEN | |
| Kártya: „Visszaállítás” gomb (rejtettnél) | `km-hf-at-gomb-ghost` | RENDBEN | |
| Kártya: „Részletek →” gomb | `km-hf-at-gomb-reszlet` | RENDBEN | |
| Üres szűrő üzenet | `km-hf-at-ures` | RENDBEN | |

## Részletpanel (HF-Részletpanel)

| elem a prototípuson | a kódban | ítélet | megjegyzés |
|---|---|---|---|
| Panel: fejléc, cím, Bezárás gomb | `km-hf-at-panel-fejlec`, `-cim`, `-gomb-ghost` | RENDBEN | |
| Fontosság-jelvény | `km-hf-at-imp-*` | RENDBEN | |
| Téma-jelvény | `km-hf-at-tema-*` | RENDBEN | |
| Verzió-tag | `km-hf-at-kartya-ver` | RENDBEN | |
| Találat címe | `km-hf-at-panel-cim-szoveg` | RENDBEN | |
| „Összefoglaló” szakasz + nyelv | `km-hf-at-panel-szakasz-cim`, `-mellek` | RENDBEN | |
| Hosszú szöveg | `km-hf-at-panel-szoveg` | RENDBEN | `indoklas || osszefoglalo` |
| „Miért fontos” szakasz + szöveg | `km-hf-at-panel-miert` | RENDBEN | |
| „Források” szakasz | `km-hf-at-panel-forrasok` | RENDBEN | |
| Forrás-sor: név, idő, nyelv, „Eredeti ↗” | `km-hf-at-panel-forras*` | RENDBEN | |
| Tartalomötlet: nincs → gomb | `km-hf-at-panel-otlet-gomb` | RENDBEN | Nézőnél rejtve (megengedett) |
| Tartalomötlet: van → doboz (cím, szöveg, megjegyzés) | `km-hf-at-panel-otlet*` | RENDBEN | |

## Beállítás (HF-II)

| elem a prototípuson | a kódban | ítélet | megjegyzés |
|---|---|---|---|
| Fejléc: cím + jelvény (Tervezet/Aktív) | `km-hf-be-cim`, `km-hf-be-jelveny` | RENDBEN | |
| Alcím (AI előkészítette) | `km-hf-be-alcim` | RENDBEN | |
| Első használat: kérdés + beviteli mező | `km-hf-be-kerdes`, `km-hf-be-mezo` | RENDBEN | |
| Oszlopcím: „Mit figyeljek?” | `km-hf-be-oszlopcim data-szin="mit"` | RENDBEN | |
| Célok kártya + 3 chip | `km-hf-be-kartya`, `km-hf-be-chip` | RENDBEN | |
| Szabad szöveg + „✦ Javaslat” gomb | `km-hf-be-textarea`, `km-hf-be-gomb-szellem` | RENDBEN | |
| Témák kártya + témák + × gomb | `km-hf-be-tema`, `km-hf-be-tema-torol` | RENDBEN | |
| „Új téma…” beviteli mező | `km-hf-be-tema-uj`, `km-hf-be-tema-input` | RENDBEN | Megengedett többlet |
| Változatok, Földrajzi, Kizárások mezők | `km-hf-be-mezoracs`, `km-hf-be-cimke` | RENDBEN | |
| Megkülönböztetés szöveg | `km-hf-be-megj`, `km-hf-be-megkulonboztetes-cimke` | RENDBEN | |
| Oszlopcím: „Honnan?” | `km-hf-be-oszlopcim data-szin="honnan"` | RENDBEN | |
| Forrás-csoportok (saját/sajtó/AI) | `Forrasok.tsx`: `csoportok` | RENDBEN | |
| Forrás-sor: URL, állapot, meta | `km-hf-be-forras*` | RENDBEN | |
| „Ellenőrzés” gomb | `km-hf-be-forras-gomb` | RENDBEN | |
| AI-figyelmeztetés | `km-hf-be-forras-figyelem` | RENDBEN | |
| Új forrás hozzáadása (mező + gomb) | `km-hf-be-forras-hozzaad*` | RENDBEN | |
| Őszinteségi megjegyzés | `km-hf-be-oszinte` | RENDBEN | |
| Oszlopcím: „Mikor?” | `km-hf-be-oszlopcim data-szin="mikor"` | RENDBEN | |
| Ütemezés: Kézi/Napi radio + idő + időzóna | `km-hf-be-radiosor`, `km-hf-be-ido` | RENDBEN | |
| „Email jön” megjegyzés | `km-hf-be-megj` | RENDBEN | |
| Mentési hiba üzenet | `km-hf-be-uzenet data-fajta="hiba"` | RENDBEN | |
| Mentés sikeres üzenet | `km-hf-be-uzenet data-fajta="ok"` | RENDBEN | |
| Próba kész üzenet + link | `km-hf-be-uzenet data-fajta="info"` | RENDBEN | Link csak ha van Finomhangolás (E-26) |
| Próbafuttatás gomb | `km-hf-be-gomb-szellem` | RENDBEN | |
| Mentés gomb | `km-hf-be-gomb-elsodleges` | RENDBEN | |
| Próba megjegyzés | `km-hf-be-megj` | RENDBEN | |

## Többlet a kódban

- `Attekintes.tsx`: „értékelés függőben” szöveg a kártya „Miért fontos” helyén — a prototípusban ilyen állapot nincs (a kártya csak kész értékeléssel jelenik meg).
- `Attekintes.tsx`: „csonkolt” jelzés (`km-hf-at-kartya-csonkolt`) — a prototípuson nincs ilyen elem.
- `Attekintes.tsx`: futás-hiba üzenet (`futHibas`) — a prototípuson nincs ilyen állapot.
- `Attekintes.tsx`: keret-kimerülés üzenet (`keret_kimerult`) — a prototípuson nincs ilyen állapot.
- `Beallitas.tsx`: „Javaslat folyamatban” / „Javaslat hiba” üzenetek — a prototípuson nincs ilyen állapot.
- `Beallitas.tsx`: „Nincs változás” mentés-üzenet — megengedett (feladat).
- `Beallitas.tsx`: néző szerep figyelmeztetése — megengedett (feladat).
- `Forrasok.tsx`: `nem_tamogatott` állapot — megengedett (feladat).
- `Forrasok.tsx`: betöltési hiba + újratöltés gomb — a prototípuson nincs ilyen állapot.
- `Forrasok.tsx`: „hozzáadás hiba” üzenet — a prototípuson nincs ilyen állapot.
- `Forrasok.tsx`: üres lista esetén hibaüzenet — a prototípuson nincs ilyen állapot.
- `HirfigyeloKeret.tsx`: „Vissza a fiókhoz” link — megengedett (feladat).

## Javítandó

1. **HIÁNYZIK**: A kártya „Miért fontos” szakasza a prototípus szerint csak akkor jelenik meg, ha az értékelés kész (`showWhy: !s.aiDown`). A kódban függőben lévő értékelésnél is megjelenik egy „értékelés függőben” szöveg — ez ELTÉR, törlendő vagy csak kész állapotban jelenjen meg.
2. **TÖBBLET**: A „csonkolt” jelzés (`km-hf-at-kartya-csonkolt`) nem szerepel a prototípuson — eltávolítandó.
3. **TÖBBLET**: A futás-hiba üzenet (`futHibas`) nem szerepel a prototípuson — eltávolítandó vagy a prototípus-állapotokhoz igazítandó.
4. **TÖBBLET**: A keret-kimerülés üzenet (`keret_kimerult`) nem szerepel a prototípuson — eltávolítandó vagy a prototípus-állapotokhoz igazítandó.
5. **TÖBBLET**: A „Javaslat folyamatban” / „Javaslat hiba” üzenetek a Beállítás lapon nem szerepelnek a prototípuson — eltávolítandók vagy a prototípus-állapotokhoz igazítandók.
6. **TÖBBLET**: A Forrasok komponensben a betöltési hiba, hozzáadási hiba és üres lista esetén megjelenő üzenetek nem szerepelnek a prototípuson — eltávolítandók vagy a prototípus-állapotokhoz igazítandók.
7. **ELTÉR**: A Beállítás lapon a „Próba kész” üzenetben a link csak akkor jelenik meg, ha a Finomhangolás lap elérhető — ez a prototípus szerint mindig megjelenik (a link HIÁNYA az E-26-ig megengedett, de a szövegnek mindig látszania kell).
8. **ELTÉR**: A Beállítás lapon a „Tervezet” jelvény logikája: a prototípus szerint `firstUse || savedOkV === null` — a kódban `!vanAktiv || piszkos`. Ez eltérhet, ha van aktív verzió és van mentetlen szerkesztés — ellenőrizendő, hogy a prototípus-logika szerint ilyenkor mi a jelvény.
9. **ELTÉR**: A Beállítás lapon a „Kérdés” (első használat) blokk a prototípus szerint a `firstUse` állapotban jelenik meg — a kódban `elsoHasznalat` állapot, ami a tervezet meglététől is függ. Ellenőrizendő, hogy első használatnál, amikor a szerver AI-javaslatot ad, a kérdés megjelenik-e.
10. **ELTÉR**: A Beállítás lapon a „Szabad szöveg” gomb a prototípus szerint `✦` előtaggal jelenik meg — a kódban ez megvan, de a gomb szövege a `freeBtn` fordítási kulcsot használja, ami nem biztos, hogy tartalmazza a `✦` jelet. Ellenőrizendő a fordítás.
