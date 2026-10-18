# Gépezet — R-15 · 2. szállítmány (03 · 04 · 08)

Ami a rajzhoz új adatot, számlálót vagy viselkedést kér. A sorszámokra a rajz hivatkozik.

1. **Poszt minden érdekes hírhez, magától.** A gyűjtés után a gép minden érdekes hírhez megírja a posztot (Facebook, a szervezet első nyelvén), és a Posztszöveg „Vár rád” csoportjába teszi. A „Mutasd a kész posztot” így azonnal kész szöveget nyit (T9: 1 kattintás). Ha a szöveg még nincs kész, a gomb megnyomásakor a 08 lap „Írjuk a posztot…” állapotban nyílik, és helyben jelenik meg a szöveg. Üres lap sosem jelenik meg.
2. **Heti haladás-számláló.** Szervezetenként, hétfőtől vasárnapig: `poszt_kesz` (a „Kész, másolom” megnyomása) és `kep_letoltve` (Képek → Letöltés). Megjelenik a 03, 04 és 08 lapon (`data-r15="halad"`), később a Képeken is. A sáv kitöltése: kész posztok / (kész + váró), legfeljebb 100%.
3. **„Kész, másolom”.** Egy gomb, három dolgot tesz: a szöveget a vágólapra másolja, a posztot „Kész” állapotba teszi, és növeli a `poszt_kesz` számlálót. Utána jön a kész-pillanat: „Kész a poszt!”, a cél platform neve és a heti sorszám („a második”). A fő gomb a következő váró poszthoz visz; ha nincs több, a Kezdőlapra.
4. **Poszt-állapotok.** A `javaslat · üres · szerkesztve` helyett két állapot látszik: **Vár rád** és **Kész**. A régi állapotok maradhatnak a háttérben.
5. **A poszt eredete.** Minden hírből írt poszt tárolja a hír azonosítóját és egy 1–2 szavas rövid nevet („Díszburkolat”, „Tisza-parti főtér”). A gép írja a poszt megírásakor. Ez a név a lista eleme, a Kezdőlap sora és az alcím („A díszburkolatos hírből írtuk”).
6. **Kép a poszthoz.** A „Kép készítése” / „Kép hozzá” a Képek lapot nyitja, a poszt első sorával előre kitöltve. A kész kép visszakerül a poszthoz, és bélyegképként látszik a 08 jobb oszlopában.
7. **Kezdőlap: „Ma N poszt vár rád”.** N = a „Vár rád” posztok száma. A nagy kártya a legújabb váró poszt; a többi és az apró teendők (napi hírfigyelés, bemutatkozás hiányai) a „Még vár” listában. Ha N = 0: „Ma nincs dolgod”, a kész-pillanat és a heti haladás.
8. **Egy szám a hírekre.** A menü jelvénye, a cím és a kártyák száma ugyanaz: az Új csoportban lévő érdekes hírek száma. A „2 új, ebből 3 érdekes” féle két szám nem jelenik meg.
9. **„Legutóbb 4 napja kerestünk.”** Az utolsó gyűjtés ideje napokban („ma”, „tegnap”, „4 napja”), óra és „futás” szó nélkül.
10. **„Még 2 apróság” (telefon, 03).** A „Még vár” lista 2. elemétől összecsukva; egy érintésre helyben nyílik.
11. **Rövid hírcím a kártyán.** A kártyán a hír címének első mondata áll (ha 8 szónál hosszabb, a gép rövidíti), a teljes cím a Részletekben és a cím fölé víve látszik. A rövid cím a hír mellé tárolódik.
