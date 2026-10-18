# Feladat — ÉPÍTŐ (V3): háttérhír nem jelenik meg; „Eredeti cikk" mindig a cikkre; főoldal soha nem találat

Vilmos döntése (2026-09-18, a visszajelzések 7. és 4. pontja): a Hírek lapon csak a FONTOS és az ÉRDEKES hírek látszanak; a háttérhírek egy összecsukott sorban („+N háttérhír — megnézem"), alapból zárva. Az „Eredeti cikk" gomb mindig egy cikkre visz, soha egy portál főoldalára; cikk-hivatkozás nélkül nincs kártya. (A kép a kártyán és az egy mondat a rajz után jön — NEM ez a feladat.)

React 19, TS 7 strict. RÉSZLET-fájlok (`_RESZLET-Attekintes.md`, `_RESZLET-kartya.md`), legfeljebb 6 CSERE fájlonként. Tokenőr: CSS csak `var(--…)`. Nincs `any`.

## MÉRT tények
- `apps/web/app/hirfigyelo/Attekintes.tsx` (mellékelve) 364. sor: a csoportosítás `fontos → 0, erdekes → 1, (nem kész) → 2, hatter → 3`; a lista 8 kártyát mutat + „Mutasd a következő 8-at". A kártya: `HirKartya.tsx` (mellékelve); a felugró: `HirFelugro.tsx` 129. és 148. sor: `elsoForras.url` / `f.url` az „Eredeti cikk" hivatkozás.
- `packages/news-monitor-core/src/kartya.ts` (mellékelve): a `Kartya.url` a kivonat `url`-je (79.). A találat forrása lehet maga a portál főoldala, ha a forrás nem ad hírfolyamot, és a letöltő a főoldalt olvasta (Csilla esete: bbc.com).
- A forrás-ellenőrzés: `apps/web/hirfigyelo/index.ts` `forrasEllenoriz`/a `POST /api/hirfigyelo/forrasok/{id}/ellenoriz` (mellékelt részlet) — a `hirfolyam` mező üres, ha nincs RSS/Atom.

## Mit kell megírni
1. **Attekintes.tsx:** a `hatter` fontosságú, kész kártyák NEM kerülnek a fő listába. Alattuk egy sor: `<button>` „+{n} háttérhír — megnézem" (`hf.hatter_sor` felirat, `{n}`), kattintásra a háttér-kártyák a lista alá kerülnek (állapot `hatterNyitva`), a gomb „Háttérhírek elrejtése" lesz (`hf.hatter_elrejt`). Ha nincs háttérhír, a sor nincs. A „11 új" számláló és az „N hír az elmúlt két napból" szövegek a nem-háttér hírekre számolnak.
2. **kartya.ts (mag):** a `kartyakEpit` csak akkor épít kártyát, ha a fő találat `url`-je NEM a forrás gyökere (útvonal nélküli cím: `new URL(url).pathname` üres vagy `/`, és nincs `?`). A kihagyott találatok száma a `KartyaEpites` eredményébe kerül (`kihagyott_fooldal: number`), hogy a lap egy sorban jelezhesse („N találatot kihagytunk: nem cikk, hanem főoldal" — `hf.kihagyott_fooldal`). Egységpróba a mag `probak/` mappájába (`kartya-fooldal.proba.ts`): egy főoldal-találatból nincs kártya, egy cikkből van.
3. **forrás-ellenőrzés:** ha egy forrásnak nincs hírfolyama (`hirfolyam` üres), az ellenőrzés eredménye `allapot: "hibas"` legyen `ok: "NINCS_HIRFOLYAM"` okkal (nem `aktiv`), és a lapon a forrás sora ezt mondja: `hf.forras_nincs_hirfolyam` („Ez az oldal nem ad hírfolyamot — a főoldalát nem olvassuk. Adj meg egy rovatot vagy egy másik oldalt."). Ha ez a mező már létezik más néven, ahhoz igazodj (a mellékelt részlet szerint).
4. **Feliratok:** `0090_v3_kartyak.sql` (hu/ro/en): `hf.hatter_sor`, `hf.hatter_elrejt`, `hf.kihagyott_fooldal`, `hf.forras_nincs_hirfolyam`.

Más fájlhoz ne nyúlj.
