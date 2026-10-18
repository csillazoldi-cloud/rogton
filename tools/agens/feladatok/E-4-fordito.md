# Feladat — FORDÍTÓ (E-4): a felület szövegei románul és angolul

Mellékelve a magyar feliratok (`apps/web/feliratok/hu.json`): kulcs → szöveg. Ez egy webes alkalmazás
(„Kommunikációs munkatér": marketingeseknek szóló, AI-val segített kommunikációs munkakörnyezet) fiók-képernyőinek
szövege: regisztráció, belépés, szervezet létrehozása, hibaüzenetek.

Add vissza KÉT fájlban, pontosan ugyanazokkal a kulcsokkal, ugyanabban a sorrendben, érvényes JSON-ként:
1. `apps/web/feliratok/ro.json` — román (Romániában használt, diakritikus jelekkel: ș ț ă â î; tegező, közvetlen,
   természetes hang, nem tükörfordítás)
2. `apps/web/feliratok/en.json` — angol (brit/nemzetközi, közvetlen „you", rövid)

Szabályok:
- A `{verzio}` és minden `{…}` helyőrző változatlanul marad.
- A `nyelv.hu`, `nyelv.ro`, `nyelv.en` értéke MINDEN nyelven a nyelv saját neve marad: „Magyar", „Română", „English".
- A `kozos.app_nev` és a „Kommunikációs munkatér" terméknév: románul „Spațiu de lucru de comunicare", angolul
  „Communication Workspace" — ezt használd következetesen az oldalcímekben is.
- A `kozos.teszt_jelveny` („teszt"): ro „test", en „test".
- A példaértékek (`*_pl`) maradhatnak hasonlóak, de a név legyen nyelvhez illő (ro: „Ex. Popescu Ana", en: „e.g. Anna Kovács").
- A `hiba.ROSSZ_BELEPES` szándékosan nem árulja el, hogy az e-mail vagy a jelszó volt rossz — ezt tartsd meg.
- Csak a két JSON fájlt add vissza, a szokásos `=== FÁJL: … ===` blokkokban.
