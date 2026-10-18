# @km/hozzaferes-core

## 1. Mit csinál

Egy munkatérnek tagjai vannak, három szereppel: tulajdonos, szerkesztő, néző. A modul tudja,
ki hívhat meg valakit és milyen szerepre, ki állíthatja át egy tag szerepét, ki vehet le
valakit, és mikor nem lehet valamit megtenni. A meghívó egy egyszer használatos, hét napig
érvényes jegy, amit a meghívott a belépése után vált be; minden döntéshez indokot ad.

## 2. Mit kér a befogadótól

A `host.ts` portjai — mindegyik egy sor:

- `TagsagTar.tagok(szervezet_id)` — a munkatér tagjainak listája.
- `TagsagTar.felvesz(szervezet_id, fiok_id, szerep, mikor)` — új tag felvétele.
- `TagsagTar.szerepAllit(szervezet_id, fiok_id, szerep)` — egy tag szerepének átállítása.
- `TagsagTar.eltavolit(szervezet_id, fiok_id)` — egy tag eltávolítása.
- `MeghivoTar.ment(m)` — új meghívó tárolása.
- `MeghivoTar.frissit(m)` — meglévő meghívó állapotváltásának mentése.
- `MeghivoTar.azonositoSzerint(szervezet_id, id)` — meghívó azonosító szerint.
- `MeghivoTar.lenyomatSzerint(lenyomat)` — meghívó a jegy lenyomata szerint (munkatértől függetlenül).
- `MeghivoTar.lista(szervezet_id)` — a munkatér meghívóinak listája.
- `Ora.most()` — az aktuális idő ISO szövegként.
- `Azonosito.uj()` — egyedi azonosító.
- `Azonosito.jegy()` — a meghívó titka (legalább 32 véletlen karakter).
- `Azonosito.lenyomat(jegy)` — egyirányú lenyomat a jegyből.
- `EsemenyKimenet(e)` — a modul eseményeinek fogadója.

## 3. Mit ad vissza

Bejárat-függvények (mind `Eredmeny<T>`-t ad):

- `dont(ktx, muvelet, cel?)` — tiszta döntő, indokkal.
- `tagokLista(k, ktx)` — a munkatér tagjai.
- `meghiv(k, ktx, { szerep, email? })` — meghívó kiadása; a `jegy` egyszer jön vissza.
- `meghivoLista(k, ktx)` — a meghívók `allapot_most`-tal.
- `meghivoVisszavon(k, ktx, meghivo_id)` — meghívó visszavonása.
- `meghivoElfogad(k, { fiok_id }, jegy)` — jegy beváltása.
- `szerepAllit(k, ktx, fiok_id, szerep)` — szerep átállítása.
- `tagEltavolit(k, ktx, fiok_id)` — tag eltávolítása.
- `kilep(k, ktx)` — kilépés a munkatérből.

Események: `meghivo_kiadva`, `meghivo_visszavonva`, `meghivo_elfogadva`, `tag_felveve`,
`szerep_valtozott`, `tag_eltavolitva`, `tag_kilepett`.

## 4. Hibakódok

- `NINCS_JOG` — a szerep nem elég a művelethez.
- `NAGYOBB_SZEREP` — magánál nagyobb szerepet adna.
- `UTOLSO_TULAJDONOS` — az utolsó tulajdonost érintené.
- `MAGAT_NEM` — saját magát állítaná át vagy távolítaná el.
- `NINCS_ILYEN_TAG` — nincs ilyen tag.
- `NINCS_ILYEN_MEGHIVO` — nincs ilyen meghívó.
- `MEGHIVO_LEJART` — a jegy lejárt.
- `MEGHIVO_FELHASZNALVA` — a jegyet már beváltották.
- `MEGHIVO_VISSZAVONVA` — a jegyet visszavonták.
- `MAR_TAG` — a meghívott már tagja a munkatérnek.
- `ERVENYTELEN_ADAT` — a bemenet nem felel meg.

## 5. Beillesztés

1. A `packages/hozzaferes-core` mappa másolása, felvétel a workspace-listába.
2. A `host.ts` öt portjának megírása a saját tárolóra (a webalkalmazásban Postgres + drizzle
   a `tagsag` és a `meghivo` táblával; a referencia-hostban SQLite).
3. `Ora`: `() => new Date().toISOString()`; `Azonosito`: `crypto.randomUUID()`, 32 bájt
   véletlen base64url jegy, SHA-256 hex lenyomat.
4. A modul próbáinak futtatása (`pnpm --filter @km/hozzaferes-core proba`) — adatbázis nélkül
   zöldek.
5. Három határőr-szabály felvétele a `.dependency-cruiser.cjs`-be.
6. A hibakódok fordítása feliratokra (`hozzaferes.hiba_*`), a HTTP-státusz a szerződés 6.
   pontja szerint.
