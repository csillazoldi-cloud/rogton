# Feladat — FORDÍTOTT ELLENŐR (E-29c): az AI válaszainak nyelve — keresd a HIBÁT

Eddig a hírfigyelő AI-ja mindig magyarul válaszolt. Mostantól a FELÜLET nyelvén: azén, aki a futást indította, a napi futásnál a szervezet tulajdonosáén.
Ehhez: (1) a nyelvváltás a fiókra is mentődik (`fiok.nyelv`, migráció 0033), (2) a sorba tett tétel viszi a nyelvet, (3) a futtató a tételből (vagy a tulajdonos
fiókjából) veszi, (4) az AI-hívó a promptot ezen a nyelven kéri.

MÉRT tény: a magyarul megfogalmazott „a mezőket románul írd” utasítást a helyi modell FIGYELMEN KÍVÜL HAGYTA (a prompt elején és a végén is), és magyarul válaszolt.
A CÉLNYELVEN írt mondat viszont hatott. Ezért a nyelvfüggő promptot a célnyelvi mondat keretezi elöl és hátul.

Mellékletben: `ai-index-reszlet.ts` (a `prompt` függvény), `hirfigyelo-ai.ts`, `futtato-reszlet.ts` (a `tetelNyelve`), `nyelv-route.ts`, `nyelv-ai.proba.ts`, `0033_fiok_nyelv.sql`.

Nézd végig, minden megállapításodhoz FÁJL és SOR:

1. **A nyelv útja**: van-e olyan út, amelyen a figyelés MÉGIS magyarul válaszol, pedig nem kellene? (kézi futás, értékelés újra, javaslat kipróbálása, napi futás,
   és a NEM háttérben futó AI-hívások: tartalomötlet, összkép, beállítás-javaslat.)
2. **A `fiok.nyelv` mentése**: a nyelvváltó útvonal belépés nélkül is működik-e; elronthatja-e a nyelvváltást, ha a mentés hibára fut; írhat-e MÁS fiók nyelvébe?
3. **A prompt keretezése**: a célnyelvi mondat bekerülhet-e olyan promptba, ahová nem való? Megzavarhatja-e a JSON-válasz formáját? Ütközhet-e a bemenet
   ADAT-védelmével (a cikkbe rejtett utasítások elleni sorokkal)?
4. **A prompt gyorsítótára**: a fájl tartalmát tárolja, a behelyettesítés utána történik — biztos, hogy két különböző nyelvű kérés nem keveredik?
5. **A migráció**: `ADD COLUMN IF NOT EXISTS nyelv text` — mi történik a MEGLÉVŐ fiókokkal, és mi történik, ha valaki érvénytelen értéket ír a mezőbe?
6. **A próbák**: van-e olyan állítás, ami akkor is átmenne, ha a keretezést visszavonnánk?

Írj `docs/E-29c-FORDITOTT-ELLENORZES-deepseek.md` néven TÖMÖR jelentést: **legfeljebb 12 sor**, minden sor MÁS megállapítás — ismétlés TILOS.
Alak: `SÚLYOS` / `KÖZEPES` / `APRÓ` + fájl:sor + mi a baj + mi lenne a javítás. A végén EGY mondat: mi az, ami tényleg működik.
Ne írj kódot, ne dicsérj, ne ismételd a feladatot.
