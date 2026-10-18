# Adatkötés — R-1 · 2. javítókör (v4)

Csak az ebben a körben hozzáadott elemek. A v3 adatkötései változatlanok.

## Pénznem-vezérlő (8. artboard, Munkatér csempe)

| A rajzon | Honnan | Művelet |
|---|---|---|
| a lenyíló mai értéke | a munkatér `penznem` beállítása | `GET` a munkatér beállításaival együtt |
| a négy választható érték | fix lista: `EUR` · `USD` · `HUF` · `RON` | — |
| a megjelenő név | felirat: `penznem.<kod>` | — |
| választás mentése | `PUT /api/beallitas/penznem` | **csak tulajdonos** |

A vezérlő a **tulajdonos** nézetében van. A rendszergazda nézetében (4. artboard) nincs, tehát a végpont jogosultsága és a felület egyezik.

Választás után a kezdőképernyő AI-keret csempéjének három értéke (becsült költség, keret, maradék) az új pénznemben áll, tárolt árfolyammal átszámolva. A hívásszám és a gépidő pénznem-független.

## Részleges futás (1., 3., 5., 10. artboard)

| A rajzon | Honnan |
|---|---|
| melyik sor áll | a legutóbbi futás eredménye: van-e **teljesen sikeres** futás |
| „Utolsó futás” időpontja | a legutóbbi futás **befejezése** (akkor is, ha az értékelés függőben maradt) |
| „Utolsó sikeres futás” időpontja | a legutóbbi **teljesen sikeres** futás befejezése |
| „{n} találat értékelése függőben” | a futáshoz tartozó, még nem értékelt találatok száma |
| „{n} forrás elakadt” | a futásban hibára futott források száma |

A négy jelzés **négy külön adat**, nem egy állapotmező. A rajzon ezért is állnak külön: az „elakadt” figyelmeztető színű, a „függőben” semleges — az egyik hiba, a másik várakozás.

**A prototípusban** a váltás a `nincsTeljesFutas` Tweaks-kapcsolóval szimulált.

## Felső sáv a régi lapokon (9., 10. artboard)

A sáv adatkötése változatlan (v3): terméknév, munkatér neve és váltója, a négy lap, nyelvválasztó, fiók neve, Kilépés.

Új: a **modul fülsora** (10. artboard) a modul saját lapjaiból áll — a hírfigyelőnél három, fixen. A „7 új” jelzés a `nav.uj_talalat_jelzes` kulccsal, a modul új találatainak számából.

A **mentés-állapot** (9. artboard) a lap saját mentési állapotából jön, nem a sávból: `mentve` (+ időpont) · `mentés…` · `a mentés nem sikerült`. A sáv nem tud róla.
