# E-16 — A feliratok szerkesztője: fordított ellenőrzés és végigjátszás (2026-09-07)

## 1. Mi épült
`/feliratok` — az E-15 jóváhagyott rajz szerint (`apps/web/app/feliratok/Feliratok.tsx`, `feliratok.css`; a Theme-lap vázán, `tema.css`).
Két szint (D-09): a tulajdonos a szervezet saját szövegeit (alatta: közös + a csomag alapja), a rendszergazda szintválasztóval a
közös alapot (alatta: a csomag alapja). Képernyők listája darabszámmal, számláló doboz; keresés kulcsra és szövegre; szűrők (Mind /
Csak a saját módosítások / Hiányzó fordítás — ez utóbbi kettő és a keresés minden képernyőre kiterjed); kártyánként a kulcs, az
állapot (közös / saját / hiányzó fordítás), a „hibakódhoz kötött” jelzés a `hiba.*` kulcsoknál, a három nyelv, tartaléknyelv (a
magyar látszik halványan, amíg nincs fordítás), „Visszaállítás a közösre”; 10-esével „További N felirat mutatása”; export/import
(csak a tervezetbe, kulcsonként ellenőrizve — ismeretlen kulcs jelezve, üres szöveg elutasítva); korábbi verziók visszaállítással.
Tervezet mentése → csak a szerkesztő; Alkalmazás → a lapok azonnal az új szöveget kapják (a lap feje a szervezet hatásos feliratait
tölti: alap → közös → szervezet, nyelvenként, tartaléknyelvvel). Telefonon: lenyíló képernyőlista, nyelvek egymás alatt, rövid gombok.
A fiókoldalról link nyílik rá. Feliratok: 77 saját szöveg három nyelven (Kimi), migráció `0022`; a két szint táblái: `0021`.

## 2. A terv 3. kérdésére (mit írhat át a szervezet)
Mindent — a `hiba.*` kulcsok is —, de azok „hibakódhoz kötött” jelzést kapnak. (A rajzon így volt, Vilmos jóváhagyta.)

## 3. Fordított ellenőrzés (Kimi, `docs/E-16-FORDITOTT-ELLENORZES-kimi.md` — nyers)
Megállt és **javítva**: (1) telefonon a rajz rövid gombjai („Elvetés”, „Alkalmazás”) — bevezetve; (2) a „Tervezet mentése” a rajzon
félkövér — bevezetve (a Theme-lapon is, a v6 szerint). Saját átnézésem javította: (3) telefonon a képernyők listája a rajzon lenyíló
volt, nálunk sorba tört lista — lenyíló lett; (4) a keresőmező telefonon 320 px magas volt (flex-alap oszlopban) — javítva.
A jelentés többi sora osztálynév–inline-stílus különbség, ARIA-attribútum vagy átmeneti állapot (betöltés, hiba, jog nélkül) — ezek
a Theme-lapról átvett, v6-ból ismert elemek, nem eltérések. Vitatott, meghagyva: a „szinkronban” jelvény (a v6 Theme-lap mintája).

## 4. Végigjátszás
Gépi (`/tmp/e16-jatek.py`, Playwright): csoportok (19), Belépés csoport 10 kártya; keresés; egy felirat átírása → „saját” jelvény,
Visszaállítás gomb, piszkos jelvény; tervezet mentése → a lap még a régi; újratöltés után a tervezet visszajön; hibás import →
hibalista, semmi nem változik; jó import (ismeretlen kulcs jelezve); alkalmazás → az onboarding címe azonnal az új; „csak saját”
szűrő; visszaállítás a közösre + alkalmazás → a régi cím; hibakód-jelvények (6). Magyarul, románul, angolul (1440) és telefonon (390).
Gépi próbák: `feliratok.proba.ts` (10 eset: elválasztás három szervezettel, a lap feliratai szervezetenként és nyelvenként,
tartaléknyelv, verziók, visszaállítás, hibás csomag nem ír, jogok, közös szint) — 117 zöld összesen.
Képernyőképek: `Claude outputs/e16-kepernyok/`.
