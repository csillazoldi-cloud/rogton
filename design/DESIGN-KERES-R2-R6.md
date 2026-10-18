# Mit kérünk a Claude Designtól — oldalról oldalra (R-2, R-3, R-4, R-6; az R-5 később)

2026-09-12 · Aitmetica SRL · Írta: az orchestrator (VS Code-os Claude), Vilmos kérésére. Ez a lap **egyben** mondja meg, mi a következő
négy rajz, milyen sorrendben, és mi az, ami közben megépült — hogy a Design ne a 09-11-i feladatlapok „meg kell építeni" listájából
induljon, hanem abból, ami **ma van**. A négy régi feladatlap (`design/r2-tagok/DESIGN-FELADAT.md`, `r3-sajat-fiok/`, `r4-rendszerbeallitasok/`,
`r6-fajlfeltoltes/`) érvényes a **miért**-re és a **szabályokra**; ahol ez a lap mást mond, ez a friss.

## 0. Ami már megvan, és amiből építkezz

- **A felső sáv kész** (R-1 v3/v4, `design/r1-kezdokepernyo/atado-3/rajz/R1-kezdokepernyo v4.dc.html`, 6–7. és 9–10. artboard): terméknév, a munkatér
  neve mindig lenyíló, Kezdőképernyő · Modulok ▾ · Ügyfélprofil · Gépház, nyelvválasztó, fiók neve, Kilépés; telefonon hamburger. **Minden új lap ezt kapja
  felülre** — ne rajzolj külön fejlécet, csak jelöld, melyik menüpont aktív.
- **A tokenek**: a tizenöt térközfok (`--ter-0…14`) és a v3/v4 rajz `:root`-ja a mérce; a kód főága ugyanezt tartalmazza. Új token nem kell.
- **A gépezet mind a négy lap mögött kész és próbázott** (végpontok, hibakódok, jogok) — lentebb laponként soroljuk. **Csak olyat rajzolj, aminek van
  gépezete**; ami hiányzik, azt a `kerdesek.md`-be írd, ne a rajzra.
- **Minta a csomagra** (így kérjük vissza mindegyiket): `rajz/<nev>.dc.html` (egy fájl, minden artboard), `ATADO.md` (mi változott, hálózat kell-e),
  `feliratok.json` (minden szöveg három nyelven, hu eredeti, en alap, ro), `tokenek.md`, `adatkotes.md` (melyik elem melyik végpontból), `kerdesek.md`.
  A kész csomagot Vilmos a `SynologyDrive/SaaS/be/` mappába teszi — onnan én emelem a tárhelyre és építem meg.
- **Sorrend**: R-2 → R-3 → R-6 → R-4. Az R-2 a legsürgősebb: ma minden munkatér egyfelhasználós a felületen, pedig a tagság gépezete kész.

---

## 1. R-2 · Tagok és meghívás — a Tagok lap és a meghívó beváltó lapja

**Hova kerül:** a felső sáv munkatér-lenyílójának **Tagok** sora (a v3 rajzon már ott van, megjelölve; a kulcsai `nav.tagok`, `nav.tagok_szam`
= „{n} tag · {m} függő meghívó"). Az útja `/tagok`. A beváltó lap a meghívó linkje: `/meghivo/<jegy>`.

**Kinek látszik:** tulajdonos mindent lát és tehet; szerkesztő látja a listát gombok nélkül; **néző nem látja a lapot** (a Tagok sor neki nincs).

**Ami MA VAN — ebből dolgozik a rajz:**

| Művelet | Végpont | Ki | Hibakódok (a felület mondatai ezekhez kellenek) |
|---|---|---|---|
| taglista (név, e-mail, szerep, csatlakozás ideje) | `GET /api/tagok` | tag | — |
| meghívó kiadása (szerep + opcionális e-mail címzett) | `POST /api/tagok/meghivo` → jegy + link, **egyszer** jön vissza | tulajdonos, szerkesztő (szerkesztő nézőt vagy szerkesztőt hívhat, tulajdonost nem: `NAGYOBB_SZEREP`) | `NAGYOBB_SZEREP` |
| függő meghívók listája (kinek, milyen szerep, meddig él, állapot: kiadott · elfogadott · visszavont · lejárt) | `GET /api/tagok/meghivo` | tulajdonos, szerkesztő | — |
| meghívó visszavonása | `DELETE /api/tagok/meghivo/{id}` | tulajdonos, szerkesztő | `MEGHIVO_VISSZAVONVA` (már visszavont), `NINCS_ILYEN_MEGHIVO` |
| meghívó beváltása (belépett fiók, szervezet nem kell) | `POST /api/meghivo/elfogad` `{ jegy }` | bárki belépett | `NINCS_ILYEN_MEGHIVO`, `MEGHIVO_LEJART`, `MEGHIVO_FELHASZNALVA`, `MEGHIVO_VISSZAVONVA`, `MAR_TAG` |
| szerep átállítása | `PUT /api/tagok/{fiokId}` `{ szerep }` | tulajdonos | `MAGAT_NEM` (a saját szerepét nem), `NINCS_ILYEN_TAG` |
| tag eltávolítása | `DELETE /api/tagok/{fiokId}` | tulajdonos | `MAGAT_NEM`, `NINCS_ILYEN_TAG` |
| kilépés a munkatérből | `POST /api/tagok/kilep` | tag | `UTOLSO_TULAJDONOS` (az egyetlen tulajdonos nem léphet ki) |

A meghívó **jegy** csak lenyomatként tárolódik; **e-mail-küldés nincs** (a link kézzel továbbítódik — D1). Minden tagsági művelet az **eseménynaplóba**
kerül (meghivo_kiadva, meghivo_visszavonva, meghivo_elfogadva, tag_felveve, szerep_valtozott, tag_eltavolitva, tag_kilepett) — a lap alján egy „Mi történt"
sor ebből dolgozhat (`GET /api/esemenyek`).

**Mit rajzolj** (a régi feladatlap 7 artboardja marad, ezekkel a pontosításokkal):
1. Tagok lap normál (3 tag, egy függő meghívó) — a felső sávval, a lenyílóban a Tagok sor aktív.
2. Első használat: egyedül a munkatérben — a meghívás gombja hangsúlyos.
3. Meghívás: szerep választása (néző · szerkesztő · tulajdonos), opcionális e-mail címzett, a kiadott link **egyszer**, másolható; meddig él.
4. Szerep átállítása és eltávolítás megerősítéssel (a megerősítő sáv a **képernyő aljára** rögzül).
5. Az utolsó tulajdonos esete: zárt gomb, mondat (`UTOLSO_TULAJDONOS` / `MAGAT_NEM`).
6. Telefon 390.
7. **A beváltó lap** (`/meghivo/<jegy>`): (a) belépett fiókkal — „X meghívott a Y munkatérbe Z szerepben", egy gomb: Elfogadás; siker után a kezdőképernyő;
   (b) belépés nélkül — a lap a belépésre/regisztrációra visz, és **utána** vissza ide; (c) a négy hibaút egy-egy mondattal: lejárt · felhasznált · visszavont · már tag.

**Ami eldőlt, ne kérdezd:** a néző nem látja a lapot; e-mail nincs; a szerkesztő is hívhat (nézőt/szerkesztőt), csak tulajdonost nem; a lap a munkatéré, nem a Gépházé.
**Feliratkulcs-előtag:** `tagok.*`, `meghivo.*`; a hibakódok mondatai `hozzaferes.hiba_*` néven **már megvannak** a rendszerben (átvehetők).

## 2. R-3 · Saját fiók — a felhasználó a saját magáról

**Hova kerül:** a felső sávban a **fiók nevére** kattintva (ma a név egy link a `/fiok`-ra — az az ügyfélprofil; ez változik: a név a `/sajat-fiok`-ra visz,
a hamburgerben pedig a legalsó „név · szerepek" sor). **Kinek:** minden belépett fiók, szereptől függetlenül.

**Ami MA VAN:**

| Blokk | Végpont | Szabály / hibakód |
|---|---|---|
| név módosítása | `PUT /api/fiok/nev` `{ nev }` | üres név → `ERVENYTELEN_ADAT` |
| e-mail | **nem módosítható** a felületen (D1) — a mező látszik, zárva, mondattal: a rendszergazda írja át | — |
| jelszóváltás | `PUT /api/fiok/jelszo` `{ jelenlegi, uj }` | legalább 10 karakter; rossz jelenlegi → `ROSSZ_JELENLEGI_JELSZO`; **siker után a többi eszköz kilép, ez az egy marad** — a válasz megmondja, hány eszköz lett kiléptetve |
| kiléptetés minden más eszközről | `POST /api/fiok/kileptetes-mindenhol` | a válasz: hány munkamenet szűnt meg |
| a felület nyelve | `POST /api/nyelv` | ide költözik az ügyfélprofil oldalsávjából |
| a munkatereim (név, szerep) | a fiók adata (`GET /api/fiok/en`) | munkaterenként „Kilépek" → `POST /api/tagok/kilep` (az aktuális munkatérre; az utolsó tulajdonosnak zárt gomb: `UTOLSO_TULAJDONOS`) |
| utolsó belépésem | a fiók adata | csak kijelzés |

**Eltérés a régi feladatlaptól, mert így épült meg:** a jelszóváltás **nem** léptet ki az aktuális eszközről — a többiről igen (D-F19). A rajz ezt mondja ki.

**Mit rajzolj:** a régi feladatlap 5 artboardja (alaphelyzet két munkatérrel · jelszóváltás közben a figyelmeztetéssel · a három hibaút · kilépés egy munkatérből
megerősítéssel + az utolsó tulajdonos zárt gombja · telefon), a felső sávval. **Feliratkulcs-előtag:** `sajat.*`; a hibák mondatai `fiok.hiba_*` néven **megvannak**.

## 3. R-6 · Fájlfeltöltés az arculathoz — az arculat-blokk kiegészítése (két helyen jelenik meg)

**Hova kerül:** nem új lap — az **arculat-blokk** az onboarding 3. lépésén és az ügyfélprofilon (közös komponens). **Kinek:** tulajdonos tölt fel; a néző csak lát.

**Ami MA VAN:**

| Művelet | Végpont | Szabály / hibakód |
|---|---|---|
| feltöltés | `POST /api/arculat/fajl` (a bájtok a törzsben; fejléc: `x-fajl-nev`, `x-fajl-cel`) | **típus a tartalomból**: png · jpg · webp · pdf; **SVG tiltva** → `SVG_NEM_ENGEDETT` (415, segítő mondat: kérd PNG-ben); más → `TIPUS_NEM_ENGEDETT`; **legfeljebb 10 MB** → `TUL_NAGY`; üres → `URES` |
| célok | `cel`: `logo` · `kezikonyv` · `referencia` · `dokumentum` | — |
| lista | `GET /api/arculat/fajl?cel=logo` | — |
| letöltés / előnézet | `GET /api/arculat/fajl/{id}` | csak a saját szervezetnek; `NINCS_ILYEN_FAJL` |
| a tervezetben a logó | `ArculatTervezet.logo_fajl_id` — a jóváhagyás pillanatképe **megőrzi**, új logó = új tervezet (6.2 marad) | — |
| eltávolítás | **nincs végpont** (nem törlünk) — a rajzon „Eltávolítás" gomb **ne legyen**; helyette „Csere" (új feltöltés = új példány) | — |
| esemény | minden feltöltés az eseménynaplóban (`fajl_feltoltve`: azonosító, típus, cél, méret — fájlnév és bájt nélkül) | — |

**Eltérés a régi feladatlaptól, mert így épült meg:** **egy** méretkorlát van (10 MB, minden célra — a `MAX_MERET_BAJT`), nem 2/20 MB; „sötét háttérre" külön logó-hely nincs a
gépezetben (egy `logo` cél van) — ha kell, `kerdesek.md`-be; **Eltávolítás gomb nincs**. **Mit rajzolj:** a régi 6 artboard ezekkel; az előnézet szabályai
(széles/magas/átlátszó) az átadóba. **Feliratkulcs-előtag:** `arculat_fajl.*`; a hibák `fajl.hiba_*` néven **megvannak**.

## 4. R-4 · Értesítések és adatpolitika — a Gépház ötödik ajtaja (tulajdonosnak is)

**Hova kerül:** a Gépház lapon egy új csempe **Értesítések és adatpolitika** — a rendszergazdánál a közös alap, a tulajdonosnál a munkatér felülírása
(mint a Theme és a Feliratok — D4/D-F23 mintája). A néző nem látja.

**Ami MA VAN:**

| Blokk | Végpont | Ami mögötte áll |
|---|---|---|
| „Mi történt" lista (mikor · mi · ki) | `GET /api/esemenyek?limit=` (a munkatér), `GET /api/esemenyek/rendszer` (rendszergazda: a fiókszintűek is) | 21 eseményfajta, mind három nyelven (`esemeny.<fajta>_cim`, `_szoveg`); **olvasott-jelölés nincs** (D-F21: nem építettük) — a rajzon ne legyen |
| értesítési beállítás — munkatér | `GET/PUT /api/ertesites` | fajtánként: menjen-e ki üzenet (`kimeno`) vagy ne (`nincs`); a közös alap felülírása |
| értesítési beállítás — közös alap | `GET/PUT /api/ertesites/kozos` (rendszergazda) | alapból **semmi nem megy ki** |
| kimenő csatorna | webes horog a NAS `.env`-jéből (`ERTESITES_WEBHOOK_URL`) — **titok, a felületen soha**; ha nincs beállítva, semmi nem megy ki, nem hiba | a rajzon csak: „a kimenő csatorna be van kötve / nincs bekötve" |
| AI-kapcsoló | `PUT /api/beallitas/ai` `{ engedelyezve }` (tulajdonos) | kikapcsolva **egyetlen** AI-hívás sem indul (`AI_KIKAPCSOLVA`), a figyelés gyűjt, de nem értékel; az esemény `ai_kapcsolo_valtozott` |
| adatút | `docs/ADATUT.md` 4 sora: AI-szolgáltató (kivonat + profil, minden értékeléskor) · forrásoldalak (minden futáskor) · **Google-betűk minden látogató böngészőjéből** · a kimenő horog (fajta, munkatér, egy mondat) | a lap **kimondja**, nem elrejti |

**Eltérés a régi feladatlaptól:** „Próbaüzenet" gomb — **nincs végpont**, ne rajzold (kerdesek.md); olvasott-jelölés nincs; a „mentés kimaradt" jelzés
alapból ki (a NAS ütemezője Vilmosra vár). **Mit rajzolj:** a régi 6 artboard ezekkel (két szint · adatpolitika be/ki · Mi történt lista · telefon), a
Gépház csempéje mindkét nézeten. **Feliratkulcs-előtag:** `ertesites.*`, `adatpolitika.*`.

## 5. R-5 · Előfizetés — **még nem**

A modul-lista és az árak Vilmos döntése; amíg nincs, nincs rajz. A régi feladatlap fiktív árlistát tartalmaz — azt **ne** rajzold meg.

## 6. Kötelező szabályok (mind a négyre)

Csak tokenből (a tizenöt fok, új token nem kell); minden szöveg kulccsal három nyelven; **halott vezérlő tilos** — a fenti táblák mondják, minek van gépezete;
sötét felület; a megerősítő sáv a képernyő aljára; a felső sáv minden lapon; a hálózat-igényt az átadó mondja ki; amit nem tudsz mérni, hagyd üresen és írd a
`kerdesek.md`-be. Egy lap = egy csomag a 0. pont szerkezetében; a `be/` mappába.
