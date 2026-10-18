# Feladat — FORDÍTOTT ELLENŐR (E-29b): a CDATA-javítás és a biztonsági fék — keresd a HIBÁT

Egy valódi hibát javítottunk: a hírcsatorna-olvasó a `<![CDATA[ … ]]>` burokba tett címet és szöveget kidobta (a burok nyitása HTML-címkének látszott),
ezért egyes hírcsatornákról ÜRES cikkek érkeztek. Ebből következett, hogy minden cikk ujjlenyomata azonos lett, minden párt megkérdeztünk az AI-tól
(496 hívás 32 cikkre, 27 perc). Javítás: `xmlMezoSzoveg` a `packages/letolto`-ban; a magban pár-korlát (`HF_PAR_KORLAT`) és `hatarido`; cím nélküli cikk kimarad.

Mellékletben: az `xmlMezoSzoveg` és a hírcsatorna-elemző, a `figyelesFuttat` érintett része, a `futas.ts`, és a két új próbafájl.

Nézd végig, minden megállapításodhoz FÁJL és SOR:

1. **`xmlMezoSzoveg`**: van-e bemenet, amire ROSSZUL működik? Egymásba ágyazott vagy lezáratlan CDATA; több CDATA egy mezőben; CDATA-n KÍVÜLI szöveg mellette;
   `]]>` a szövegben; entitás a CDATA belsejében (ott NEM szabad feloldani — jól van ez így?); nagyon hosszú mező (visszalépéses regex, lassulás)?
2. **A cikk kihagyása cím nélkül**: elveszhet-e emiatt VALÓDI cikk (pl. olyan hírcsatorna, ahol a cím máshol van)?
3. **A pár-korlát**: a korlát feletti párokra nem kérdezünk — okozhat-e ez rossz eredményt (két kártya egy eseményből), és látszik-e ez a felhasználónak?
   A `reszleges` állapot elég jelzés?
4. **A `hatarido`**: minden hosszú lépés előtt ellenőrizzük? Van-e olyan ág, ami a határidő után is dolgozik? Mi történik a félbehagyott futás adataival?
   Elveszhet-e adat, vagy maradhat-e a futás örökre `fut` állapotban?
5. **A webalkalmazás 14 perces határideje** és a sor 15 perces lejárata: jó-e ez a sorrend? Mi van, ha a gép órája elmozdul?
6. **A két új próbafájl**: van-e olyan állítás, ami akkor is átmenne, ha a javítást visszavonnánk? (Ez a legfontosabb kérdés.)

Írj `docs/E-29b-FORDITOTT-ELLENORZES-deepseek.md` néven TÖMÖR jelentést: **legfeljebb 12 sor**, minden sor MÁS megállapítás — ismétlés TILOS.
Alak: `SÚLYOS` / `KÖZEPES` / `APRÓ` + fájl:sor + mi a baj + mi lenne a javítás. A végén EGY mondat: mi az, ami tényleg működik.
Ha valamiről nem tudsz dönteni, írd oda: „nem eldönthető”. Ne írj kódot, ne dicsérj, ne ismételd a feladatot.
