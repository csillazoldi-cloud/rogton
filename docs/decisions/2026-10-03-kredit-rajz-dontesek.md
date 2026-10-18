# Döntésnapló — R-13 kredit rajzok, 2026-10-03

Csilla döntései (chat, 2026-10-02–03), Vilmos utólagos OK-ja kérve az 1. és 3. pontra:

1. **Pénz-mondat:** a lapok kimondhatják, hogy a kredit nem kerül külön pénzbe („Nem kerül külön pénzbe — a havi keretből megy”). A 13a lapon és a Kreditek nézeten marad; a 13d2/13d3 lapokon MÉRÉS alapján a rövidebb „Ehhez nem kell kredit.” áll (a pénz-mondat ott rontott).
2. **Tagok-szerkezet:** a Tagok első képernyője marad a mai (tagok, szerepek, Meghívás); a kreditosztás egy csendes „Kreditek ›” sor mögé kerül, saját nézetre (/tagok/kreditek). Új, kis követelmény.
3. **Bíráló-persona:** a teszt-Tibor mindig tulajdonosként olvas. A tag-hangú mondatok („szólj a tulajdonosnak”) miatti piros KONTEXTUS-MŰTERMÉK (ugyanaz az osztály, mint a Cipó Pékség 10-01-en): rögzítjük, nem rajzolunk át miatta.

Nyitva (Q15, Csillának, egyszerű szavakkal): elfogadjuk-e úgy a hat tulajdonosi lapot, hogy a teszt-Tibor pirosat ad rájuk, mert egy átlagos napon nincs rajtuk tennivaló. A rajz-zár emiatt ZÁRVA (próba 24/24 zöld, bíráló 14 piros, stabil 3–4 pont).

## 2026-10-06 — Csilla válaszai a kód-kör kérdéseire (11:00)

1. **Tagok első képernyője:** marad a mai (a 10-03-i 2. pont megerősítve). Nincs átrajzolás, nincs elvétel (e-mail, csatlakozás dátuma, függő meghívók, „Mi történt” maradnak).
2. **Kezdőlap kredit-sor:** CSAK a „Mára kész vagy” állapotban, ahogy a 13d1 rajzolta. A kód eddig a „Mutasd meg a legutóbbi munkádat” (03c2) változatban is mutatta — javítva, most csak a `kesz` állapotban.
3. **Elfogyott kredit a Hírek és a Posztszöveg lapon:** ha a néző a munkatér TULAJDONOSA, a „szólj a munkatér tulajdonosának” mondat helyett halk link: „Szeretnél több kreditet?” → /tagok/kreditek (felirat: `r13.kredit.tobbet_szeretnel`, migráció 0146; RO „Vrei mai multe credite?”, EN „Want more credits?”). Halk link, nem második fő gomb (T2). A tag mondata változatlan.
4. **Saját fiók, elfogyott kredit:** a hírek beállítása látszik az elfogyott-üzenet alatt, halványan (új token: `--szakasz-halvany: 0.55`, r15.css — a meglévő halvány gomb 0.45-je túl erős szövegre). A kezelők HASZNÁLHATÓK maradnak (fókuszban/egér alatt a szakasz teljes erővel): a beállítás átírása semmit nem indít, csak a következő olvasás kerül majd kreditbe. A szakasz címe h2 (a lap kérdése az elfogyott-cím marad), fő gomb nincs benne.
