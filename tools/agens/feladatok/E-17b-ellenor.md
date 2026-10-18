# Feladat — ELLENŐR (E-17b): fordított ellenőrzés — a fiókprofil mockupja ↔ a megvalósítás

Mellékelve: (1) `Fiokprofil-optimalizalt.dc.html` — a tervező mockupja (a spec: HTML inline stílusokkal + egy kis
állapotgép a `<script type="text/x-dc">` blokkban), (2) `Fiok.tsx` — a React-megvalósítás (a szövegek `t("kulcs")` alakban;
a magyar értékek a `feliratok-hu.json`-ban), (3) `fiok-e17b.css` — a hozzá tartozó CSS (csak tokenek: `var(--…)`; a
`--fs-h2` = 24px, `--fs-md` 14, `--fs-sm` 13, `--fs-xs` 12, `--pad-block` 22px, `--r-block` 10px), (4) `feliratok-hu.json`.

Járj végig a MOCKUPON elemről elemre (fejléc, címsor, bevezető, mezőkártyák és állapotaik, arculat-blokk, lábléc, oldalsáv), és
minden elemnél mondd meg: megvan-e a megvalósításban, ugyanazzal a szöveggel, elrendezéssel, méretekkel, színekkel (tokennel),
viselkedéssel (jelvényre kattintás → eredet-részlet; Szerkesztés → textarea + Mentés/Mégse; a hiányzó-gomb görget). Aztán
fordítva: mi van a MEGVALÓSÍTÁSBAN, ami a mockupban NINCS (többlet). SZÁNDÉKOS, ismert többlet, ne jelezd: a fejlécben a mentés
állapota (`MentesAllapot`, E-11 követelmény); az oldalsávban a „Beállítások” szakasz a Theme/Feliratok linkekkel; a jóváhagyott
arculatnál a megjegyzés szövege más; nyitott arculat-blokk (a v6 OB-03-B). Az osztálynevek eltérése nem hiba (a mockup inline
stílusokat használ).

Add vissza EGYETLEN fájlban (`=== FÁJL: E-17b-FORDITOTT-ELLENORZES-kimi.md ===`), magyarul, táblázatban:
| Elem | Mockup | Megvalósítás | Eltérés? (nincs / VALÓDI / kozmetikai) | Javaslat |. A végén 3 mondatos összegzés: hány valódi eltérés.
