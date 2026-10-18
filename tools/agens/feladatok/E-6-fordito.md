# Feladat — FORDÍTÓ (E-6): az onboarding 1. lépésének feliratai románul és angolul

Mellékelve az ÚJ magyar kulcsok (`_uj-e6-hu.json`) és a már lefordított korábbi fájlok mintának
(`ro.json`, `en.json` — ezek hangja és terminológiája a mérce: „Spațiu de lucru de comunicare" /
„Communication Workspace", tegező, közvetlen).

Add vissza KÉT fájlban CSAK az új kulcsokat, ugyanabban a sorrendben, érvényes JSON-ként:
1. `apps/web/feliratok/_uj-e6-ro.json`
2. `apps/web/feliratok/_uj-e6-en.json`

Szabályok:
- A `{…}` helyőrzők változatlanok (`{aktualis}`, `{osszes}`, `{db}`).
- A `+` és `✓` jelek az `arculat_*` kulcsokban maradnak az elején.
- A NAGYBETŰS előnézet-címkék (`elonezet.nev` stb.) a célnyelven is csupa nagybetűvel.
- Az `onboarding1.leiras_pl` példa maradjon példa (helyi ízzel: ro pl. „Brutărie artizanală în Târgu Mureș…", en pl. „Artisan bakery in Târgu Mureș…").
- A „teszt-csatlakozó" kifejezés: ro „conector de test", en „test connector".
