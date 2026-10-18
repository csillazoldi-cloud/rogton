# Feladat — FORDÍTOTT ELLENŐR (E-18, záró kör): a KÉSZ Theme-felület a v6 prototípus ellen

Vasszabály: **semmi nem lehet a képernyőn, ami nincs a tervben** — a felesleg hiba; ami hiányzik, az kérdés. A terv a v6
`Theme-beallitasok.dc.html` (a sablon `{{ t.kulcs }}` szövegei a `km-i18n.js` kulcsai; a mi kulcsaink `tema.<snake_case>`
alakban ugyanazok: `thSaveDraft` → `tema.save_draft`, `thNoticeDraftOk` → `tema.notice_draft_ok`). A megvalósítás:
`Tema.tsx` (a vezérlők és a fejléc) és `ElonezetPanel.tsx` (az élő előnézet), React.

NEM kell futtatni semmit; olvasd a két oldalt, és hasonlítsd össze **elemről elemre**: fejléc (cím, jelvények, gombok),
üzenetek (betöltés, hiba, értesítés, importhibák, kontraszt), a bal oszlop 7 szekciója (Színek 12 mező + jegyzet; Tipográfia
3 választó + 2 csúszka; Formák 4 lekerekítés + kapszula + keretvastagság; Térközök 2 csúszka; Effektek 3 csúszka + mozgás;
Részletes: árnyékszín, 4 választó, 5 csúszka; Export/import), a jobb oszlop (előnézet fej: cím, megjegyzés, Desktop/Mobil,
állapotválasztó; az előnézet elemei sorrendben). A gombok VISELKEDÉSÉT is vesd össze (discard, resetDefaults, saveDraft,
applyTheme, exportTheme, importTheme, togglePill, a --pad-card csúszka a --pad-block-ot is állítja).

Ismert és ELFOGADOTT eltérések, ezeket NE jelezd:
- a nyelvválasztó a mi közös vezérlőnk (nincs arab); az „Onboarding →” link helyett „Vissza a fiókhoz →”;
- a tervezet és az alkalmazás nem a böngésző tárában, hanem a kiszolgálón van (`/api/tema`); az alkalmazás után a lap újratölti
  a témát (v6: applyToRoot);
- a D-09 döntés miatt két szint van: a fejlécben a szint jelvénye (a v6 `thAdmin` jelvény helyén) és a rendszergazdának egy
  szintválasztó; a nem-tulajdonosnak figyelmeztető sor és tiltott vezérlők;
- a kód-szöveg mintában a v6 fix `#4f5fd6` helyett az aktuális `--primary` érték;
- a gombpárna a v6 literál `13px 26px` helyett a `--btn-pad-y/x` token;
- az E-14 kör óta SZÁNDÉKOSAN hozzáadva (Vilmos kérte / a 4. szakasz terve): a „Korábbi verziók” lista visszaállítás-gombokkal
  (`km-tema-verzio*`), az „Exportálás fájlba” / „Importálás fájlból” gombpár az export/import szekcióban (`FajlValaszto`), a
  betöltés/hiba/újra üzenetsáv (`tema.betoltes_*`), a színmezőnél a token neve (nem a hex).
Ez a ZÁRÓ ellenőrzés: az E-14 kör 2 eltérése (színminta felirata, `ob1card`) már javítva; nézd meg, nem maradt-e / nem jött-e új.

Add vissza egyetlen fájlt: `docs/E-18-FORDITOTT-ELLENORZES-tema-kimi.md`, magyarul, ebben a szerkezetben:

## Felesleg (van nálunk, nincs a v6-ban) — HIBA
| Elem (idézd a szöveget / az osztály nevét) | Hol a kódban | Javaslat |

## Hiány (van a v6-ban, nincs nálunk) — KÉRDÉS
| v6 elem (a `t.kulcs` és a jelölés) | Megjegyzés |

## Eltérő viselkedés (megvan, de máshogy)
| v6 | Nálunk | Súly (kicsi / közepes / nagy) |

## Egyezik
Rövid felsorolás szekciónként.

Légy konkrét és szigorú; ha bizonytalan vagy, írd oda. Ne találj ki elemeket. Ne írj kódot.
