# Feladat — ÉPÍTŐ (V4): feltöltés — a hiba a valódi okot mondja, a korlátok a mező mellett

Vilmos döntése (2026-09-18, a visszajelzések 8. pontja). Szente három esete: jpg és PDF feltöltése elbukott, a lap csak annyit mondott: „That didn't work just now. Try again". Hogy a szerveren MI történt, azt Claude méri a NAS naplójából (nem a te dolgod); a te feladatod, hogy a lap ezután minden esetben a valódi okot mondja, és előre kimondja a korlátokat.

React 19, TS 7 strict. RÉSZLET-fájlok (≤6 CSERE fájlonként). Tokenőr: CSS csak `var(--…)`. Nincs `any`.

## MÉRT tények
- Korlát: `MAX_MERET_BAJT = 10 MB` (`packages/fajl-core/src/host.ts` 32.); engedett típusok: png, jpg, pdf (svg tiltva: `SVG_NEM_ENGEDETT`; más: `TIPUS_NEM_ENGEDETT`) — `felismeres.ts` (mellékelve). A felismerés a fájl FEJLÉCÉBŐL megy (nem a kiterjesztésből): egy „.jpg" nevű, de más tartalmú fájl `TIPUS_NEM_ENGEDETT`.
- Végpont: `apps/web/app/api/arculat/fajl/route.ts` (mellékelve): `TUL_NAGY` 413 (a `content-length` alapján ELŐRE is), `TIPUS_NEM_ENGEDETT`/`SVG_NEM_ENGEDETT` 415, `URES`/`ERVENYTELEN_ADAT` 400, `NINCS_JOG` 403, egyéb `BELSO_HIBA` 500 (a 46. sor `console.error`-ral naplóz).
- A lap: `apps/web/app/_kozos/ArculatAnyagok.tsx` (mellékelve): `hibaCimKulcs/hibaMitKulcs/hibaMiertKulcs` (26–49.) — a `TUL_NAGY` és a `TIPUS_NEM_ENGEDETT` már kap saját szöveget; MINDEN MÁS (`BELSO_HIBA`, hálózati hiba 0, 500, 413 a proxytól) az általános „That didn't work just now" szöveget kapja. Az nginx (`nas/nginx.conf`, mellékelve) `client_max_body_size` értéke is korlát lehet — ha kisebb 10 MB-nál, a proxy 413-at ad a kód előtt, és a lap a hálózati ágba fut.

## Mit kell megírni
1. **nginx:** `nas/nginx.conf` — `client_max_body_size 12m;` a `location /api/` (vagy a server) blokkban, ha nincs ilyen sor vagy kisebb (RÉSZLET).
2. **A lap** (`ArculatAnyagok.tsx`): a hibaágak: `TUL_NAGY` → „Túl nagy: legfeljebb 10 MB." · `TIPUS_NEM_ENGEDETT`/`SVG_NEM_ENGEDETT` → „Csak PNG, JPG vagy PDF." · hálózati/413 a proxytól (statusz 0 vagy 413 törzs nélkül) → „Nem ért fel a fájl — túl nagy, vagy megszakadt a kapcsolat. Legfeljebb 10 MB." · `BELSO_HIBA`/500 → „A szerver nem tudta elmenteni. Szóltunk a fejlesztőknek; próbáld meg pár perc múlva." (és a hibát a modul beküldi a Visszajelzés modul `bekuld` végpontjára automatikusan, `forras: "rendszer"` jelöléssel — ha a végpont ezt nem fogadja, csak `console.error`). A mező ALATT állandó sor: „PNG, JPG vagy PDF, legfeljebb 10 MB." (`arculat_fajl.korlatok`). A hibaüzenet a fájl nevével kezdődik.
3. **Feliratok:** `0091_v4_feltoltes.sql` (hu/ro/en): `arculat_fajl.korlatok`, `arculat_fajl.halozat_mit`, `arculat_fajl.szerver_mit`; a meglévő `arculat_fajl.nagy_mit`/`tipus_mit` szövege a fentiekre frissítve (UPDATE, nem INSERT, ha már létezik — a mellékelt migráció-minta szerint).
4. **Próba:** `apps/web/probak/arculat-fajl-hibak.proba.ts` (élő): 11 MB-os fájl → 413 `TUL_NAGY`; egy „.jpg" nevű szöveges fájl → 415 `TIPUS_NEM_ENGEDETT`; egy valódi kis PNG → 201.

Más fájlhoz ne nyúlj.
