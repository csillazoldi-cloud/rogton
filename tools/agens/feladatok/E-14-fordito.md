# Feladat — FORDÍTÓ (E-14): a Theme-felület saját szövegei románul és angolul

Az alábbi magyar feliratokat fordítsd le ROMÁNRA és ANGOLRA. Ezek egy kezelőfelület szövegei (a megjelenés — színek, betűk,
formák — beállítása). Stílus: rövid, hétköznapi, nem szakzsargon; a román a romániai magyar–román kétnyelvű közegnek szól
(diakritikus jelekkel: ă â î ș ț). A „közös alap” = a rendszer alapértelmezett megjelenése, amit minden szervezet örököl;
a „saját szervezet” = az adott ügyfélszervezet eltérő beállításai. „Theme-beállítások” románul: „Setări de temă”, angolul
„Theme settings”. A `{…}` helyőrzőket változatlanul hagyd.

Add vissza EGYETLEN fájlban (`=== FÁJL: tema-forditas.json ===`), JSON-ként, ebben az alakban:
{ "ro": { "kulcs": "szöveg", … }, "en": { "kulcs": "szöveg", … } } — minden kulcs mindkét nyelven, más nem.

Magyar forrás:
{
 "tema.oldalcim": "Theme-beállítások — Kommunikációs munkatér",
 "tema.szint_szervezet": "a szervezet saját megjelenése — csak a közös alaptól eltérő értékek",
 "tema.szint_kozos": "közös alap — minden szervezetre hat, amíg a sajátja felül nem írja",
 "tema.szint_valaszto": "Melyik szintet szerkeszted?",
 "tema.szint_valaszto_szervezet": "Saját szervezet",
 "tema.szint_valaszto_kozos": "Közös alap",
 "tema.vissza_fiok": "Vissza a fiókhoz",
 "tema.csak_tulajdonos": "A szervezet megjelenését csak a tulajdonos állíthatja.",
 "tema.nincs_jog_kozos": "A közös alapot csak a rendszergazda állíthatja.",
 "tema.notice_discard_nincs": "Nincs mit elvetni — nincs mentett tervezet.",
 "fiok.tema_link": "Theme-beállítások",
 "fiok.tema_link_sugo": "A felület színei, betűi, formái — a szervezetedre."
}
