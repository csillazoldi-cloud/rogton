# VZ-1 · Közlemények — a szerkesztő újrarajzolásának megépítése

**Dátum:** 2026-10-06 · **Állapot:** ELFOGADVA — Csilla 10-06 17:32 (a design/VZ1-szerkeszto rajz és minden ★ alapérték a kerdesek.md-ben).
**Vilmos (biztonság):** átnézés kell — új AI-hívás (posztból kitöltés), két új szervezeti tábla sorszintű védelemmel, egy munkatereken átlátó
rendszergazda-lista (SECURITY DEFINER), és termékszintű csere: a 09-23-as VZ-1b szerkesztő képernyője helyett az új lap.

## Mi épült (a ★ alapértékek szerint)
- **Belépő:** a Képek sora és a lap neve „Közlemények” (kerdesek 1); a csomag-kapcsoló (`iparagi_csomagok` ∋ `kozlekedes`) marad.
  A régi cím (/kepek/kozlekedes) a /kepek/kozlemenyek lapra visz (a `?poszt=` azonosítóval együtt). A szerkesztő a régi címén maradt
  (/kepek/zavar · /kepek/allitas · /kepek/adatsavok), ezért ott nincs szükség átirányításra.
- **Állapotszavak:** „Lezárva · Lassabban halad · Újra járható” minden munkatérnek; a kép sávja ugyanezt írja (románul is, ha kérik).
- **„Hol?” / „Melyik járat?”** (kerdesek 3): a munkatér csomagja dönt — ÚJ csomagérték: `tomegkozlekedes` (nem új mező, a meglévő
  `iparagi_csomagok` tömb egy értéke). Vele: „Melyik járat?” → a recept `jarat.kod`-ja, a kép főcíme „{kod}. járat”. Nélküle (pl. Kovács
  Burkolat): „Hol?” szabad szöveg, a kép főcíme. Ma egy munkatérnek sincs `tomegkozlekedes` — a régi buszos minta-munkatérnek kézzel kell
  beállítani (SQL), ha a „Melyik járat?” kell neki.
- **Márka-szabályok** (kerdesek 4): Tibor nem látja őket; a nem az arculatból eredő tiltás egy mondat („Ezt így nem tehetjük a képre, írd át: …”),
  ami nem fér ki, az a „Nem fér ki. Legyen ez: …” mondat. A LETÖLTÖTT kép összes jelzése a `kep_jelzes` táblába kerül, és a rendszergazda a
  Beállítások → „Márka-jelzések a képeken” listában látja (/gephaz/kep-jelzesek). Korábban erre nem volt gépezet (a VZ-2 is csak leírta).
- **Ha nem fér ki** (kerdesek 5): a kép a gép rövidebb javaslatát mutatja; a második nyelv csak akkor rövidül, ha a képgyártó szerint az is hosszú.
- **Kész lap poszt nélkül** (kerdesek 6): „Még egy kép” a fő gomb, „Letöltés újra” halk.
- **Posztból kitöltés** (kerdesek 7): EGY AI-hívás megnyitáskor (új feladat: `kozlemeny_kitoltes`, prompt: apps/web/prompts/kozlemeny_kitoltes.hu.md v1),
  a meglévő kerettel, költségméréssel és kredittel (mint a VZ-2 „Mit írj mellé?”). A válaszból csak a helyes alakú mező kerül a lapra.
- **A közlemény száma** (kerdesek 8): `kozlemeny_sorszam` — munkaterenként és receptenként az utolsó letöltött szám; a lap ennél eggyel többet
  javasol, a Részletek alatt átírható; a letöltéskor a letöltött szám lesz az utolsó.

## Értelmezések, ahol a rajz nem mondta ki
- A Részletek tartalma a rajz jegyzete szerint: a közlemény száma és „Mikor szólunk újra?” (a kihagyott megállók sora nem került a lapra).
- Számokban: a rajz jegyzete szerint a „Románul is” és a szám a Részletek alatt van — a Részletek halk link a „csak példa” alatt.
- Egy mondat: a rajzon nincs Részletek — a szám itt a gépé (nem írható át a lapon).
- Az idő 24 órás szövegmező (a rajz szerint), a „8” a mező elhagyásakor „08:00” lesz; a nap a rajz szerinti szövegmezőnek látszik, alatta a
  böngésző dátumválasztója.
- A teszt-csatlakozó `kozlemeny_kitoltes` válasza „[MINTA]” jelölés nélküli: a csupa nagybetűs jelölés a képgyártó T5 szabályán elbukna.
