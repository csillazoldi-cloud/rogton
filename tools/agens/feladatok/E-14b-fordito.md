# Feladat — FORDÍTÓ (E-14b): a Theme-felület verziólistájának szövegei románul és angolul

Az alábbi magyar feliratokat fordítsd le ROMÁNRA és ANGOLRA (kezelőfelület; rövid, hétköznapi; román diakritikusokkal). A `{n}`
helyőrző változatlan marad. Az „alkalmazott” = az élesben érvényes változat; „tervezet” = még nem élő; „korábbi” = lecserélt régi.

Add vissza EGYETLEN fájlban (`=== FÁJL: tema-forditas-2.json ===`), JSON-ként: { "ro": {…}, "en": {…} } — minden kulcs mindkét nyelven.

Magyar forrás:
{
 "tema.verziok": "Korábbi verziók",
 "tema.verziok_jegyzet": "Minden alkalmazás új verzió; a korábbi megmarad. A visszaállítás új tervezetet készít belőle az előnézetbe — élesbe csak alkalmazással kerül.",
 "tema.verziok_ures": "Még nincs mentett verzió.",
 "tema.verzio_sor": "{n}. verzió",
 "tema.allapot_tervezet": "tervezet",
 "tema.allapot_alkalmazott": "alkalmazott",
 "tema.allapot_korabbi": "korábbi",
 "tema.visszaallit": "Visszaállítás",
 "tema.notice_visszaallitva": "A(z) {n}. verzió betöltve az előnézetbe új tervezetként. Alkalmazásig a teljes alkalmazás nem változik.",
 "tema.notice_visszaallitas_err": "A visszaállítás nem sikerült — az alkalmazott téma és a tervezet érintetlen."
}
