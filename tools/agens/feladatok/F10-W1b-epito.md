# Feladat — ÉPÍTŐ (F10-W1b): a F10-W1 feladat HIÁNYZÓ darabjai (az előző menet a CSS közepén megszakadt)

Ugyanazok a szabályok, mint a mellékelt `F10-W1-epito.md`-ben (`=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===`; RÉSZLET-fájl CSERE-blokkokkal, a RÉGI szó szerint; CSAK tokenek a CSS-ben). Az 1–3. pont MÁR KÉSZ (HirKartya.tsx, HirFelugro.tsx, _RESZLET-attekintes.md) — azokat NE add vissza. CSAK ezt a hármat írd meg, a mellékelt feladatlap 4., 5. és 6. pontja szerint, pontosan az ott felsorolt osztályokkal és kulcsokkal:

1. RÉSZLET: `_RESZLET-attekintes-css.md` (a mellékelt `attekintes.css`-hez; CSERE 1 a `.km-hf-at-kartyak` szabály, CSERE 2 a fájl végére az ÚJ osztályok — a RÉGI blokk az attekintes.css utolsó két sora szó szerint).
2. TELJES migráció: `apps/web/adatbazis/migraciok/0079_r9_hirek_ket_hasab.sql` (a 15 kulcs, hu · ro · en).
3. RÉSZLET: `_RESZLET-kezdolap.md` (a mellékelt `Kezdolap-reszlet.tsx` és `kezdolap-css-reszlet.css` alapján).

A már megírt komponensek ezeket az osztályokat használják (ezekre kell CSS): km-hf-k, km-hf-k-fej, km-hf-k-meta, km-hf-k-otlet, km-hf-k-cimek, km-hf-k-cim, km-hf-k-eredeti, km-hf-k-keszul, km-hf-k-gombok, km-hf-k-gomb-fo, km-hf-gyar, km-hf-gyar-gomb, km-hf-gyar-kesobb, km-hf-at-tobbi, km-hf-at-tobbi-szoveg, km-hf-fu-hatter, km-hf-fu, km-hf-fu-fej, km-hf-fu-meta, km-hf-fu-torzs, km-hf-fu-bal, km-hf-fu-jobb, km-hf-fu-cim, km-hf-fu-osszefoglalo, km-hf-fu-gombok, km-hf-fu-miert, km-hf-fu-jobb-cim, km-hf-fu-orb, km-hf-fu-doboz, km-hf-fu-doboz-cim, km-hf-fu-doboz-tartalom, km-hf-fu-lab.
