# Adatkötés — R-6 · Fájlfeltöltés az arculathoz

A blokk **két helyen** áll: az onboarding 3. lépésén és az ügyfélprofilon. Ugyanaz a komponens, ugyanezek a végpontok.

## Feltöltés

`POST /api/arculat/fajl` — a bájtok a törzsben, a fájl neve és célja fejlécben (`x-fajl-nev`, `x-fajl-cel`). Jog: **tulajdonos**.

| Cél (`x-fajl-cel`) | A rajzon |
|---|---|
| `logo` | Logó |
| `kezikonyv` | Arculati kézikönyv |
| `referencia` | Vizuális referenciák |
| `dokumentum` | Egyéb dokumentum |

**Ellenőrzés és hibakódok — a típus a tartalomból:**

| Eset | Kód | Hol áll a rajzon |
|---|---|---|
| SVG | `SVG_NEM_ENGEDETT` (415) | 03. artboard, első kártya |
| nem png/jpg/webp/pdf | `TIPUS_NEM_ENGEDETT` | 03. artboard, második kártya |
| 10 MB felett | `TUL_NAGY` | 03. artboard, harmadik kártya |
| 0 bájt | `URES` | 03. artboard, negyedik kártya |

A hibás fájl **nem kerül a listába**, és a korábbi példány érintetlen marad.

## Lista és megnyitás

| A rajzon | Honnan |
|---|---|
| a fájlok sorai célonként (név, típus, méret, feltöltés ideje) | `GET /api/arculat/fajl?cel=<cel>` |
| Megnyitás / előnézet | `GET /api/arculat/fajl/{id}` — csak a saját szervezetnek; `NINCS_ILYEN_FAJL` |
| „ez van használatban" jelvény a logónál | `ArculatTervezet.logo_fajl_id` az aktuális tervezeten |
| „az {v}. jóváhagyott tervezetben" jelölés a korábbi példányon | a jóváhagyott tervezet `logo_fajl_id`-je |

## Csere

Ugyanaz a `POST` — **új példány jön létre**, a régi megmarad. A tervezetre gyakorolt hatás:

- a csere **új arculati tervezetet** nyit (verzió +1), amit újra jóvá kell hagyni;
- a korábbi jóváhagyott tervezet **változatlan**, a régi `logo_fajl_id`-vel;
- amíg az új nincs jóváhagyva, a tartalomgyártás a jóváhagyott (régi) tervezetet követi.

Ez a 6.2 szabály, és az 05. artboard ezt mutatja meg.

## Jogosultság

| Szerep | Mit tehet |
|---|---|
| tulajdonos | feltölt, cserél, megnyit |
| szerkesztő | megnyit; a feltöltésről a feladatlap nem szól — **lásd `kerdesek.md`** |
| néző | csak megnyit; a feltöltő mezők **nem jelennek meg** |

## Eseménynapló

Minden feltöltés eseményt ír: `fajl_feltoltve` — azonosító, típus, cél, méret. **A fájlnév és a bájtok nem kerülnek a naplóba.**
