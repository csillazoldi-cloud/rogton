# Adatkötés — R-2 · Tagok és meghívás

## Tagok lap (`/tagok`, 01–06. artboard)

| A rajzon | Honnan | Jog |
|---|---|---|
| a tagok sorai (név, e-mail, szerep, csatlakozás) | `GET /api/tagok` | tag |
| „{n} tag · {m} függő meghívó” (lapcím mellett és a sáv Tagok sorában) | a két lista darabszáma | tag / tulajdonos-szerkesztő |
| a függő meghívók sorai (címzett, szerep, meddig él, állapot) | `GET /api/tagok/meghivo` | tulajdonos, szerkesztő |
| „Mi történt” két sora | `GET /api/esemenyek?limit=2` | tag |
| Meghívás → kiadás | `POST /api/tagok/meghivo` `{ szerep, email? }` | tulajdonos, szerkesztő |
| a kiadott link | **a POST válasza, egyszer** — a rendszer csak lenyomatot tárol | — |
| Visszavonás | `DELETE /api/tagok/meghivo/{id}` | tulajdonos, szerkesztő |
| Szerep átállítása (a sáv megerősítése után) | `PUT /api/tagok/{fiokId}` `{ szerep }` | tulajdonos |
| Eltávolítás (a sáv megerősítése után) | `DELETE /api/tagok/{fiokId}` | tulajdonos |
| Kilépek a munkatérből (05/A: zárt állapot) | `POST /api/tagok/kilep` | tag |

**Hibakódok és a helyük a rajzon:**

| Kód | Hol áll |
|---|---|
| `NAGYOBB_SZEREP` | 03/C — a tulajdonos-választás tiltott, a mondat alatta |
| `MAGAT_NEM` | 05/B — a felület nem is engedi odáig (inaktív vezérlő) |
| `UTOLSO_TULAJDONOS` | 05/A — zárt gomb + két mondat |
| `MEGHIVO_VISSZAVONVA`, `NINCS_ILYEN_MEGHIVO` | 05/C a listán, 07/C a beváltó lapon |
| `NINCS_ILYEN_TAG` | nincs saját helye — a lista újratöltése oldja meg; a mondat a `meglevo_kulcsok`-ban megvan |

## Beváltó lap (`/meghivo/<jegy>`, 07. artboard)

| A rajzon | Honnan |
|---|---|
| „{meghivo} meghívott a {munkater} munkatérbe” | a jegyhez tartozó meghívó adatai |
| a szerep jelvénye és a mellette álló magyarázat | a meghívó szerepe + a `meghivo.*_mit` feliratok |
| „Ezzel a fiókkal csatlakozol: {email}” | a belépett fiók |
| Elfogadás | `POST /api/meghivo/elfogad` `{ jegy }` |
| a négy hibaút | a válasz hibakódja: `MEGHIVO_LEJART` · `MEGHIVO_FELHASZNALVA` · `MEGHIVO_VISSZAVONVA`/`NINCS_ILYEN_MEGHIVO` · `MAR_TAG` |
| B eset (belépés nélkül) | nincs végpont — a belépés után a jegy megmarad, és a lap újratölt |

Elfogadás után a cél a `/kezdolap`, és a munkatér már a sávban áll (D-F25).

## Eseménynapló

Minden tagsági művelet eseményt ír: `meghivo_kiadva`, `meghivo_visszavonva`, `meghivo_elfogadva`, `tag_felveve`, `szerep_valtozott`, `tag_eltavolitva`, `tag_kilepett`. A lap alján a „Mi történt” sor ezekből dolgozik; a teljes napló az R-4 Gépház-csempéjén lesz.
