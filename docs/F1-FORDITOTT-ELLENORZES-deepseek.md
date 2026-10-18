[ELTÉRÉS] · Tema.tsx:150 (fejléc) · a rajz „{n} token · {cs} csoport” jelvénye beégetett `cs: 6`-tal megy, nem a tényleges csoportszámból · a jelvény hazudhat, ha a csoportok száma változik.
[ELTÉRÉS] · Tema.tsx:150 · a „mentetlen tervezet” jelző a `piszkos` flagből él, ami minden `tokenBeallit`-nél true lesz — a rajz szerint viszont csak a Térköz-fül számait kellene tükröznie · a jelző és a sáv {n} száma így nem ugyanazt méri.
[ELTÉRÉS] · Tema.tsx:150 vs 175 · a fejléc-jelvény `TOKEN_KULCSOK.length`-et ír, a sáv viszont csak a `--ter-*` eltéréseket számolja · két különböző „n” a képernyőn, a rajz egyetlen számot mutat.
[ELTÉRÉS] · Tema.tsx:150 · a fejlécben a rajz szerint csak „Theme-beállítások” + jelvény + „mentetlen tervezet” van; a kódban ott van még a `km-tema-szint` jelvény és a `GazdaNav` is · a rajzon nem szereplő elemek.
[ELTÉRÉS] · Tema.tsx:150 (jobb oldal) · a rajz a fejlécben nem ír „Alapértékek”, „Tervezet mentése”, „Vissza a fiókba” gombokat — a kódban ott vannak · a rajzon nem szereplő vezérlők.
[ELTÉRÉS] · Tema.tsx:150 · a `Nyelvvalaszto` a fejlécben a rajzon nincs feltüntetve · nem a szerződés része.
[ELTÉRÉS] · Tema.tsx:150 · a szintválasztó `<select>` a fejlécben a rajzon nincs · D-F10 szerint tudatos, de a rajzhoz képest eltérés.
[ELTÉRÉS] · Tema.tsx:150 · a `km-tema-fulek` sor a rajzon a fejléc ALATT van; a kódban a fejlécen kívül, de a `kesz` blokkban — pozíció egyezik, viszont a rajz szerint a fülek a fejléc része · kozmetikai.
[ELTÉRÉS] · TerkozCsoport.tsx:60 · a sor négy oszlopos grid (név · mező · sáv · használat), a rajz szerint viszont a sor: név · érték · sáv · „N helyen” — a sorrend stimmel, de a `km-terkoz-hasznalat` a 4. oszlopban van, nem a sáv mellett jobbra · a rajz „jobbra” szövege a sáv UTÁN értendő, ez teljesül.
[ELTÉRÉS] · TerkozCsoport.tsx:60 · a `--ter-0` mezője `disabled`, de a `value` `s.ertekPx` (0), a rajz „0px” feliratot ír · a mező üresen/0-ként jelenik meg, nem „0px” szövegként.
[ELTÉRÉS] · TerkozCsoport.tsx:60 · a `--ter-0` sávja `km-terkoz-sav-nulla` `width: var(--bw)` — a rajz „vékony vonal”, ez stimmel; viszont a `height: var(--ter-7)` a többi sorral azonos, a rajz nem ír magasságot · elfogadható.
[ELTÉRÉS] · TerkozCsoport.tsx:60 · a `km-terkoz-sav` `width: tokenek[s.kulcs]` — a rajz szerint a sáv szélessége a fok értéke pixelben; a `max-width: 100%` levágja, ha a fok nagyobb a tartónál · a rajz nem ír levágást.
[ELTÉRÉS] · TerkozCsoport.tsx:60 · a `terKovetkezoErtek` a következő fok `max`-át használja effektív felső korlátként — a rajz nem ír ilyen korlátot, csak „a fokok a lépcső sorrendjében” · rejtett viselkedés.
[ELTÉRÉS] · TerkozCsoport.tsx:60 · a `hasznalat` a `ter-hasznalat.json`-ból jön, ami a rajzon nincs feltüntetve forrásként · a „N helyen” szám eredete nem a szerződésből.
[KÉRDÉS] · Tema.tsx:150 · a `kulonbozoTerkoz` csak a `--ter-*` eltéréseket számolja, a rajz „A tervezet {n} fokot módosít” — a „fok” itt térköz-fokot jelent, ez stimmel; viszont a fejléc-jelvény `TOKEN_KULCSOK.length`-et ír, ami nem ugyanaz · tisztázandó, melyik a mérvadó.
[KÉRDÉS] · Tema.tsx:150 · a `piszkos` flag a `tokenBeallit`-nél áll be, de a `tervezetMent`/`alkalmaz` után is `setPiszkos(false)` — a rajz „mentetlen tervezet” jelzője a Térköz-fül számaival konzisztens-e, nem derül ki.

---
**Claude értékelése (2026-09-12):** a 16 sorból **1 beépítve** (a csoportszám a fülek listájából jön, nem beégetett 6); a fejléc
meglévő vezérlőire (szintválasztó, nyelv, Alapértékek, Tervezet mentése, vissza-link, GazdaNav) vonatkozó 6 sor a **D-F10** tudatos
döntése — a rajz csak a Térköz-csoportot és a lap keretét rajzolta, a v6 mestere marad a többinek; a `--ter-0` mezője számmező
(a px a mező jelentése, ahogy a többi soré is); a `max-width: 100%` a 80px-es sávot nem vágja; a `terKovetkezoErtek` korlát
ártalmatlan többlet (a `TOKEN_SZABALYOK` max-a a mérvadó) — nem bántjuk, mert a szerkesztő így sem enged a tartományon túl.
A „mentetlen tervezet” jelző az egész tervezetre vonatkozik (mint a v6-ban), a sáv {n}-je a térköz-fokokra — ez a rajz szerinti
kettő, nem ellentmondás.
