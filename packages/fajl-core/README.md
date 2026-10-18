# @km/fajl-core

## 1. Mit csinál

Az ügyfél arculati fájlokat ad a rendszernek: logót, arculati kézikönyvet, referenciaképeket.
A modul a fájl tartalmát nézi meg (nem a nevét), és eldönti, befogadható-e: PNG, JPG, WebP
vagy PDF igen, SVG és minden más nem. Ami átment, a tárba kerül, és a mentés része lesz.

## 2. Mit kér a befogadótól

A `host.ts` portjai — mindegyik egy sor:

- `FajlTar.ment(meta, bajtok)` — a fájl metaadatának és bájtjainak tárolása.
- `FajlTar.meta(szervezet_id, id)` — egy fájl metaadata azonosító szerint, szervezetre szűkítve.
- `FajlTar.olvas(szervezet_id, id)` — egy fájl bájtjai azonosító szerint, szervezetre szűkítve.
- `FajlTar.lista(szervezet_id, cel?)` — a szervezet fájljai, opcionálisan cél szerint szűrve.
- `Ora.most()` — az aktuális idő ISO szövegként.
- `Azonosito.uj()` — egyedi azonosító.
- `EsemenyKimenet(e)` — a modul eseményeinek fogadója.

## 3. Mit ad vissza

Bejárat-függvények (mind `Eredmeny<T>`-t ad):

- `tipusFelismer(fej)` — tartalom szerinti típusfelismerés az első bájtokból.
- `fajlEllenoriz(be, korlat?)` — az ellenőrzés szabálya (üresség, méret, típus).
- `dont(ktx, muvelet)` — tiszta jogosultsági döntő.
- `feltolt(k, ktx, { nev, cel, bajtok, logo_valtozat?, eredet?, elemzes? })` — fájl befogadása és tárolása. 0.2.0 (R-16 K1):
  logónál a hely (`vilagos` · `sotet` · `egyszinu` · `negyzetes`, alap: `vilagos`), az eredet (`feltoltes` · `honlap` · `gep`,
  alap: `feltoltes`) és a böngészőben számolt elemzés — ezt a mag nem értelmezi, csak továbbadja. Más célnál a hely és az elemzés null.
- `fajlMeta(k, ktx, id)` — egy fájl metaadata.
- `fajlOlvas(k, ktx, id)` — egy fájl metaadata és bájtjai.
- `fajlLista(k, ktx, cel?)` — a szervezet fájljai.
- `hasznaltLogok(fajlok, pillanatkepLogok)` — tiszta (R-16 K1): helyenként a legfrissebb képre alkalmas logó-fájl; a hely nélküli
  (régi) logó-sor világosnak számít; üres helyen a pillanatkép `logok[hely]`-e a tartalék.
- `hasznaltLogoId(fajlok, pillanatkepLogoId)` — tiszta: a képen használt logó (`hasznaltLogok(...).vilagos`, ha az üres, az egyszínű;
  ha egyik sincs, a pillanatképé). A5, R-16 gepezet 1.
- `logoHelye(f)`, `LOGO_VALTOZATOK` — a hely olvasása (null = világos) és a négy hely sorrendje.

Események: `fajl_feltoltve`.

R-16 K5 (0.2.0-n belül, csak bővítés): `FajlTipus` + `ttf` · `otf` · `woff2` (a fejből: `00 01 00 00`/`true`, `OTTO`, `wOF2`; a `wOFF` és
a `ttcf` felismert, de nem engedett), `FajlCel` + `betu`, `CEL_TIPUSOK` (betű CSAK a `betu` célra, a `betu` célra CSAK betű; a többi cél
változatlan), `BETU_MAX_MERET_BAJT` (10 MB), `fajlEllenoriz(be, { maxMeret?, cel? })`. A `feltolt` a célt átadja az ellenőrzésnek, és
az `elemzes`-t a `betu` célnál is továbbadja (a befogadó ékezet-vizsgálata — a mag nem értelmezi).

R-16 K6 (0.2.0-n belül, csak bővítés): `FajlTipus` + `svg` (`KITERJESZTES` `svg`, `MIME` `image/svg+xml`) — a gép-készítette névlogó
hordozható mestere, amit a befogadó a `FajlTar.ment`-tel KÖZVETLENÜL ír (`eredet = "gep"`). Feltöltésben az SVG változatlanul tilos
(`fajlEllenoriz` → `SVG_NEM_ENGEDETT`; nincs benne egyetlen cél `CEL_TIPUSOK`-ában sem), és képre sem kerül (`KEP_LOGO_TIPUSOK`).
A befogadó a kiszolgáláskor szigorú fejléceket ad (webalkalmazás: `content-security-policy: default-src 'none'; style-src 'unsafe-inline'`,
`x-content-type-options: nosniff`).

Szótár (0.2.0): `LogoValtozat`, `FajlEredet`; a `FajlMeta` új, opcionális mezői: `logo_valtozat`, `eredet`, `elemzes`
(a befogadó tárolja: a webalkalmazásban az `arculat_fajl` három új oszlopa, a második hostban a `fajl` tábla három új oszlopa).

## 4. Hibakódok

- `NINCS_JOG` — a szerep nem elég a művelethez (feltöltéshez szerkesztő vagy tulajdonos kell).
- `SVG_NEM_ENGEDETT` — a tartalom SVG (programkódot hordozhat).
- `TIPUS_NEM_ENGEDETT` — a tartalom nem PNG, JPG, WebP vagy PDF (a `betu` célnál: nem TTF, OTF vagy WOFF2), vagy a típus nem a célé.
- `TUL_NAGY` — a fájl meghaladja a méretkorlátot (alapból 10 MB).
- `URES` — a fájl üres.
- `NINCS_ILYEN_FAJL` — nincs ilyen fájl, vagy más szervezeté.
- `ERVENYTELEN_ADAT` — a bemenet nem felel meg.

## 5. Beillesztés

1. A `packages/fajl-core` mappa másolása, felvétel a workspace-listába.
2. A `host.ts` portjainak megírása a saját tárolóra (a webalkalmazásban Postgres + drizzle
   az `arculat_fajl` táblával és a `FAJL_MAPPA` alatti fájlrendszerrel; a referencia-hostban
   memória- vagy fájl-tár egy mappában).
3. `Ora`: `() => new Date().toISOString()`; `Azonosito`: `crypto.randomUUID()`.
4. A modul próbáinak futtatása (`pnpm --filter @km/fajl-core proba`) — adatbázis és
   fájlrendszer nélkül zöldek.
5. Három határőr-szabály felvétele a `.dependency-cruiser.cjs`-be.
6. A hibakódok fordítása feliratokra (`fajl.hiba_*`), a HTTP-státusz a szerződés 6. pontja
   szerint.

## 0.3.0 (2026-10-10, Csilla — csak bővítés, a régi befogadó változatlanul megfelel)

- `MAX_MERET_BAJT` 10 MB → **100 MB** (logó, kézikönyv, referencia, dokumentum — PDF is). Új: `KEP_MAX_MERET_BAJT` = 10 MB (a `kep` cél —
  a posztképeket a befogadó memóriában dolgozza fel); `BETU_MAX_MERET_BAJT` marad 10 MB; `celMaxMeret(cel)` adja a cél korlátját
  (a `fajlEllenoriz` alapja is ez).
- Új út a nagy fájlnak: `feltoltFajlbol(k, ktx, { nev, cel, meret, fej, ideiglenesUt, … })` — a befogadó a törzset lemezre írta, a mag
  csak a méretet és a fejet látja (ugyanaz a típus-ellenőrzés, SVG-tilalom, jog). A tár opcionális `mentFajlbol(meta, ideiglenesUt)`
  portja teszi a helyére; ha nincs, a nagy feltöltés `ERVENYTELEN_ADAT` (nem esik vissza memóriára).
- Új: `fajlFolyam(k, ktx, id)` — a letöltés folyamként; a tár opcionális `olvasFolyam(szervezet_id, id)` portja adja (ha nincs, a
  bájtokból készül folyam). Ugyanaz a jog- és szervezet-szabály, mint a `fajlOlvas`-nál.

## 0.4.0 (2026-10-17, c30 F9 — csak bővítés, a régi befogadó változatlanul megfelel)

- `FajlCel` + `album` (a helyszíni fotóalbum munkapéldányai, FESZTIVAL-ES-NYELVI-MOD-TERV §1.5, §6). `CEL_TIPUSOK.album` = `ALBUM_TIPUSOK`
  (jpg · webp — PNG és PDF nem). `ALBUM_MAX_MERET_BAJT` = 2,5 MB (`celMaxMeret("album")`).
- Új, tiszta: `kepMeret(bajtok)` — a kép szélessége és magassága a fejlécből, dekódolás nélkül (JPEG: a SOF-jelölő; WebP: VP8 / VP8L /
  VP8X). Null, ha nem olvasható.
- `feltolt` az `album` célnál: a méret nem olvasható → `TIPUS_NEM_ENGEDETT`; a hosszabbik oldal > `ALBUM_MAX_EL` (2048), ill. a hívó
  szigorúbb `kepMaxEl`-je (a `kicsi` pár: `ALBUM_KICSI_MAX_EL` = 512) fölött → `TUL_NAGY`. Az `elemzes` (pár, kicsi, készült, album)
  az albumnál is továbbmegy — a mag nem értelmezi.
- `feltoltFajlbol` az `album` célt nem fogadja (`ERVENYTELEN_ADAT`): a kép mérete a teljes bájtsorból jön, a 2,5 MB memóriában marad.
- A kvóta, a sebességkorlát, a külön mappa és a 30 napos elköltöztetés a BEFOGADÓÉ (a webalkalmazásban `apps/web/album/`).
