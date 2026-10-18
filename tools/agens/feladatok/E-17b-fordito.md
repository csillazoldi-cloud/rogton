# Feladat — FORDÍTÓ (E-17b): a fiókprofil-oldal új szövegei románul és angolul

Az alábbi magyar feliratokat fordítsd le ROMÁNRA és ANGOLRA. Egy kezelőfelület szövegei: egy szervezet „ügyfélprofilja”
(név, tevékenység, célközönség, cél, hangnem, arculat), amelyet minden más eszköz használ. Stílus: rövid, hétköznapi, nem
szakzsargon; román diakritikus jelekkel. A `{…}` helyőrzők változatlanul maradnak (a `{n}` szám, a `{list}` felsorolás,
az `{ido}` dátum, a `{ki}` egy ember neve, a `{datum}` dátum, a `{szervezet}` a szervezet neve). A „✓” jel maradjon.
NE fordítsd az „Onboarding” szót. A `fiok.morzsa` egy morzsa-sor a fejlécben („/ szervezet / Profil”).

Add vissza EGYETLEN fájlban (`=== FÁJL: e17b-forditas.json ===`), JSON-ként: { "ro": {…}, "en": {…} } — minden kulcs mindkét nyelven, más nem.

Magyar forrás:
{
 "fiok.cim": "Ügyfélprofil",
 "fiok.morzsa": "/ {szervezet} / Profil",
 "fiok.jovahagyva_jelveny": "✓ Jóváhagyva",
 "fiok.jovahagyva_meta": "{ido} · {ki}",
 "fiok.hianyzo_gomb": "{n} hiányzó rész: {list}",
 "fiok.bevezeto": "Ezt a profilt használja minden eszköz. A mentett változás azonnal érvényes; a modulok a következő futásnál már ezt kapják.",
 "fiok.eredet_reszletei": "Eredet részletei",
 "fiok.letrehozva_sor": "Létrehozva: {datum}",
 "fiok.felulet_nyelve": "A felület nyelve",
 "fiok.nyelv_megj_rovid": "A profil szövegeit nem írja át.",
 "fiok.honnan_rovid": "A profil az onboarding három lépéséből jött létre, jóváhagyással. Azóta nincs piszkozat — a hiteles profil ez az egy, itt.",
 "fiok.beallitasok": "Beállítások"
}
