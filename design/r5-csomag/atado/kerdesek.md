# Kérdések — R-5

## Amit a rajz eldöntött (a kérés 5. pontja)

1. **Háromállású választó** (örökli · kimenő · nincs), nem két kapcsoló. Indoklás az `ATADO.md` 2. pontjában. Ha két kapcsoló kell, az a 03. és a 07. artboard sorát érinti, a lap szerkezetét nem.
2. **A Csomag csempe a rács első helyén** áll a tulajdonosnál.
3. **A Kezdőképernyő nem kap új jelzést** a kikapcsolt AI-ról.

## Amit nem tudtam eldönteni

4. **A `bekotve` mező a munkatérre vagy a rendszerre vonatkozik?** A horog címe a NAS `.env`-jében áll, tehát **rendszerszintű** — a rajz így mutatja (ugyanaz az állapot minden munkatérben). Ha munkatérenként lesz külön horog, a szöveg is más lesz.
5. **Mi történik a felülírással, ha a rendszergazda átállítja a közös alapot?** A rajz azt mondja: az „örökli" állású sor **vele mozdul**. Ha a felülírás az akkori értéket akarja rögzíteni, az más viselkedés, és a lap szövege is változik.
6. **Kell-e a kimenő üzenetek naplója** — mi ment ki, mikor, sikerült-e. A rajzon nincs, mert a kérés nem említ végpontot hozzá. Ha van vagy lesz, az egy táblázat a lap alján.
7. **A háromállású választó billentyűvel** hogyan járható (nyilakkal vagy Tabbal) — ez a kódolásé, de 25 sornál számít.

## Amit a kérés nyitva hagy

8. **A 25 fajta magyar címe** a rajzon a `kerdesek.md`-ben javasolt formában áll (rövid, tárgyilagos: „Meghívó kiadva", „A futás hibára futott"). A `feliratok.json`-ban mind a 25 ott van három nyelven — **ha a rendszerben már van szövegük, a rendszeré a hiteles**, és ezek elhagyandók.
9. **Az `esemeny.<fajta>_szoveg` kulcsok** (a kimenő üzenet egy mondata) nincsenek a rajzon, mert a felületen nem jelennek meg. A `feliratok.json` nem tartalmazza őket.
