SÚLYOS talalatok.ts:44 — `forrasCime` visszaadhat nyers forráscímet (adatbázisból), ami `htmlBiztos` nélkül kerül a `hf.srcProblem` paraméterébe; javítás: ott is escape-elni.
SÚLYOS talalatok.ts:88 — `k.forrasok.map(...).join(", ")` nyers forráscímeket szúr a kimenetbe escape nélkül; javítás: `htmlBiztos` a teljes stringre.
KÖZEPES talalatok.ts:83 — `k.miert` és `k.osszefoglalo` escape-elve van, de a `kartya-labsor` forrásszáma és a forráscímek összefűzése nem; javítás: külön escape minden elemre.
KÖZEPES beallitas.ts:31 — `tema.nevvaltozatok.join(", ")` escape-elve van, de a `nevváltozatok` változóban a zárójelek és a vesszők nem; javítás: a teljes stringet escape-elni.
KÖZEPES lap.ts:47 — a `nyelvAttr` csak `hu`/`ro`/`en` lehet, de a `lang` attribútum értéke nem escape-elve; bár a `Nyelv` típus véd, de a `nyelvKeresbol` nem ellenőrzi a süti értékét — javítás: típus-ellenőrzés a sütinél is.
KÖZEPES talalatok.ts:56 — a `disabled` attribútum csak akkor van, ha `a.fut`, de a `POST /inditas` kézzel is elküldhető; nincs CSRF-védelem, és a szerver nem ellenőrzi újra a futás állapotát — javítás: szerveroldali ellenőrzés és token.
APRÓ talalatok.ts:57 — a gomb felirata `hf.trialRunningBtn` futás közben, de a gomb `disabled`, így a felirat nem olvasható fel képernyőolvasóval; javítás: `aria-disabled` és a felirat megtartása.
APRÓ talalatok.ts:79 — a `…` jelvény (nem `kesz` állapot) csak színnel és pontokkal jelöl, nincs szöveges felirat; javítás: `aria-label` vagy rejtett szöveg.
APRÓ stilus.ts:1 — a `.verzio` osztály kétszer van definiálva (a fájl elején és a végén), ami nem hibás, de felesleges; javítás: egy helyen.
APRÓ talalatok.ts:44 — a `forrasHibak` esetén a `hibasCimek` összefűzése után a `hf.srcProblem` paraméterében a `p` értéke escape-elve van, de a `forrasCime` visszaadhat `id`-t is, ami nem biztonságos; javítás: az `id`-t is escape-elni.
APRÓ beallitas.ts:52 — a `forras.hiba_ok` a `hf.srcProblem` paraméterében escape-elve van, de a `hibaResz` változóban a ` — ` elválasztó nem; javítás: a teljes stringet escape-elni.
APRÓ lap.ts:60 — a `new Date().getFullYear()` a láblécben dinamikus, de nem lokalizált; javítás: a felirat-csomagból venni.
A nyelvváltó hivatkozások (`?nyelv=hu/ro/en`) megtartják az aktuális oldalt, és a `nyelvKeresbol` a süti értékét is ellenőrzi a `NYELVEK` listában, így a nyelvváltás biztonságos és működik.