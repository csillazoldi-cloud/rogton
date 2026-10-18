# Adatkötés — R-7a

| Felirat / érték | Honnan jön |
|---|---|
| a mezők kezdőértéke (01–06) | `GET /api/onboarding/piszkozat` |
| minden mezőváltozás mentése | `PUT /api/onboarding/piszkozat` |
| `onboarding.mentes_allapot` („Mentve 14:18”) | a piszkozat-mentés válaszának időpontja |
| 03 · „Javaslat készítése” → előnézet | `POST /api/onboarding/osszefoglalo` (weboldalból vagy szövegből) |
| 05 · A/B/C állapot | `POST /api/onboarding/javaslatok` — folyamatban / kész / hiba |
| 05 · stílus („Milyen stílusban írjunk?”) | `POST /api/onboarding/hangnem` |
| 06 · soronkénti eredet-jelölés („te adtad meg” / „javaslat”) | a piszkozat mezőnkénti eredet-adata; a mag megvédi a kézi szerkesztést (az AI csak üres mezőt tölt) |
| 06 · „Mentés és tovább” | `POST /api/onboarding/jovahagyas` → hiteles profil |
| 07 · „Hírforrások megadása” | `/hirfigyelo/beallitas` |
| 01 · mezőnkénti hibák | `POST /api/fiok/regisztracio` hibakódjai (hiányzó mező · gyenge jelszó ≥10 · foglalt e-mail), mezőre kötött `aria-invalid` |
| 02 · hibák | `POST /api/fiok/belepes` (hiányzó mező · rossz e-mail/jelszó páros) |
| 02/B · `kozos.kapcsolat` | **nincs gépezet** — Vilmos adata; amíg nincs, a lap nem kerül ki (DÖNTÉS 3.4) |
| 02/B háttere | `/jelszo-visszaallitas?jegy=…` (rendszergazdai jegy) |
| 04/08 · „Javaslat megnézése” | csak felület, nincs külön végpont |
