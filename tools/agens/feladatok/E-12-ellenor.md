# Feladat — FORDÍTOTT ELLENŐR (E-12): a képernyők a v6 prototípus ellen

Vasszabály: **semmi nem lehet a képernyőn, ami nincs a tervben** — a felesleg hiba; ami hiányzik, az kérdés. A terv a
v6 prototípus (`e12-v6-lepesek.html`: az 1., 2. és 3. lépés jelölése; a szövegek `{{ t.kulcs }}` alakban, a
`km-i18n.js` kulcsai). A megvalósítás: `Lepes1.tsx`, `Lepes2.tsx`, `Lepes3.tsx`, `ArculatBlokk.tsx`, `keret.tsx`
(React; a szövegek `t("kulcs")` alakban, a feliratok a `hu.json`-ból).

NEM kell futtatni semmit; olvasd a két oldalt, és hasonlítsd össze **elemről elemre** (mezők, gombok, jelvények, dobozok,
segédszövegek, előnézet-sorok, állapotok). Ismert és ELFOGADOTT eltérések, ezeket NE jelezd:
- a fejlécben a szervezet neve a v6 „munkacím” helyén; a nyelvválasztó a mi E-4-es vezérlőnk; nincs fejlesztői panel
  (a v6 „dev panel”: forrás-/AI-/mentéshiba kapcsolók) és nincs „Prototípus visszaállítása” gomb;
- a v6 „resume” (OB-R) képernyő helyett belépés után a piszkozat automatikusan betöltődik;
- az 1. lépésen a dokumentum-csatolás a fájl NEVÉT menti (a fájl később);
- a „kész” lapon a `handoff`-megjegyzés (profile.open) nincs;
- a lépésjelző a mi CSS-osztályainkkal, de ugyanaz a három lépés és a „n / 3. lépés” számláló.

Add vissza egyetlen fájlt: `docs/E-12-FORDITOTT-ELLENORZES.md`, magyarul, ebben a szerkezetben:

## Felesleg (van nálunk, nincs a v6-ban) — HIBA
Táblázat: | Képernyő | Elem (idézd a szöveget / az osztály nevét) | Hol a kódban (fájl) | Javaslat |

## Hiány (van a v6-ban, nincs nálunk) — KÉRDÉS
Táblázat: | Képernyő | v6 elem (a `t.kulcs` és a jelölés) | Megjegyzés |

## Eltérő viselkedés (megvan, de máshogy)
Táblázat: | Képernyő | v6 | Nálunk | Súly (kicsi / közepes / nagy) |

## Egyezik
Rövid felsorolás képernyőnként, mi az, ami elemről elemre megvan.

Légy konkrét és szigorú; ha bizonytalan vagy, írd oda, hogy bizonytalan. Ne találj ki elemeket, csak azt írd, amit a
mellékelt fájlokban látsz. Ne írj kódot.
