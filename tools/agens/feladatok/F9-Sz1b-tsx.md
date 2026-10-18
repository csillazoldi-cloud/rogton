# Feladat — ÉPÍTŐ (F9-Sz1/b, két elhagyás): két mondat elmarad az első beállításból

TypeScript 7 strict, React 19. Két TELJES fájlt adsz vissza `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban; minden más sor betűre ugyanaz marad, mint a mellékletben.

## Tények
- `apps/web/app/onboarding/3/Lepes3.tsx` (mellékelve): a jóváhagyó gomb alatt áll a `<div className="km-ob-jovahagyas-megj">{t("onboarding3.jovahagyas_megj")}</div>` sor („A jóváhagyás csak erre a profilra vonatkozik — nem publikálási vagy automatizálási engedély.”) — a lektor döntése: ez a mondat ELMARAD.
- `apps/web/app/onboarding/kesz/Kesz.tsx` (mellékelve): a `hianyzok` lista a `profil.kesobbre` mezőiből készül (`t(\`mezo.${m}\`)`), és jelvényként megjelenik — a lektor döntése: az **arculat** jelvény ELMARAD (a halk mondat az arculatról marad).

## Mit kell
1. `Lepes3.tsx`: a `km-ob-jovahagyas-megj` div sora törölve (egy megjegyzés a helyén: `{/* F9-Sz1/b: a „csak erre a profilra vonatkozik” mondat elmarad */}`).
2. `Kesz.tsx`: `const hianyzok = profil.kesobbre.filter((m) => m !== "arculat").map((m) => t(\`mezo.${m}\`)); // F9-Sz1/b: az Arculat jelvény elmarad` — ha a `kesobbre` elemtípusa szűkebb (enum), a szűrés `String(m) !== "arculat"` alakban, hogy a típus ne panaszkodjon.
Add vissza a 2 fájlt.
