# Feladat — TESZTELŐ (E-29): a közös letöltő csomag (`@km/letolto`) próbái

A letöltő eddig a webalkalmazás belsejében élt, most külön csomag lett, hogy a MÁSODIK host is ugyanezt használja (nincs másolat). Eddig csak közvetve, élő
API-próbákon át volt lefedve. A te dolgod SAJÁT, hálózat nélküli próbákat írni rá, amelyek a csomag viselkedését rögzítik.

Mellékletben a csomag teljes forrása (`index.ts`, 399 sor). A próbák a `packages/letolto/probak/letolto.proba.ts` fájlba kerülnek, vitest-tel.

## Amit ellenőrizni kell

1. **`cimNormalizal(be: string): URL`** — hálózat NEM kell hozzá, tiszta függvény:
   - `pelda.hu` → `https://pelda.hu/` (séma nélkül https kerül elé);
   - `http://pelda.hu/a?b=1` változatlanul feloldódik;
   - `ftp://pelda.hu`, `file:///etc/passwd`, `javascript:alert(1)` → `LetoltesHiba` `FORRAS_ROSSZ_CIM`;
   - `pont nelkuli szo`, üres szöveg, `"https:// szokoz.hu"` → `FORRAS_ROSSZ_CIM`;
   - a hibát `expect(() => cimNormalizal(x)).toThrow()`-val ÉS a `kod` mezőn keresztül is ellenőrizd
     (`try { … } catch (h) { expect((h as LetoltesHiba).kod).toBe("FORRAS_ROSSZ_CIM"); }`).
2. **`nyilvanosCim(url: URL)`** — SSRF-védelem. A DNS-feloldást a `node:dns/promises` `lookup`-ja végzi, ezért a próbában
   `vi.mock("node:dns/promises", …)`-kal add vissza a kívánt címet. Ellenőrizd, hogy TILTOTT (hibát dob) a
   `127.0.0.1`, `10.0.0.5`, `192.168.1.1`, `172.16.0.1`, `169.254.169.254` (felhő-metaadat!), `0.0.0.0`, `100.64.0.1`, és az IPv6 `::1`, `fc00::1`, `fe80::1`;
   és ENGEDETT egy nyilvános cím (pl. `93.184.216.34`). A hibakód `FORRAS_TILTOTT_CIM`.
3. **RSS/Atom feldolgozás** — a `letoltoHiv` a hálózatot a globális `fetch`-en át hívja, ezért a próbában
   `vi.stubGlobal("fetch", vi.fn(...))`-nal adj vissza saját választ (`new Response(szoveg, { headers: { "content-type": … } })`).
   A `robots.txt` kérésre is ez a `fetch` fut — az első hívásra adj `User-agent: *\nAllow: /`-t, a másodikra a tartalmat.
   - egy 2 elemű RSS 2.0 (`<rss><channel><item><title><link><pubDate><description>`) → `ok: true`, `tipus: "rss"`, 2 cikk, a címek és linkek helyesek;
   - egy Atom feed (`<feed><entry><title><link href><updated><summary>`) → ugyanígy 1-2 cikk;
   - HTML-válasz (`<html><head><title>…`) → `tipus: "weboldal"`, 1 cikk, a cikk címe a lap címe;
   - `robots.txt`, amely tiltja (`User-agent: *\nDisallow: /`) → `ok: false`, `hibaOk: "robots_tiltja"`;
   - a `fetch` kivételt dob → `ok: false`, `hibaOk: "FORRAS_NEM_ELERHETO"`; a `letoltoHiv` SOHA nem dob kivételt.
4. **`weboldalSzoveg`** — átirányítás-korlát és méretkorlát: 4 egymást követő 301-es válasz → `LetoltesHiba`; egy 2 MB-os törzs a `maxBajt: 1000` opcióval → `FORRAS_TUL_NAGY`.

## Szabályok

TypeScript 7 szigorú kapcsolókkal (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` — a tömbindexelés `T | undefined`, ezért használat előtt ellenőrizd),
ESM: az importok `from "../src/index.js"`. Vitest: `describe`/`it`/`expect`/`vi`, `beforeEach`-ben `vi.restoreAllMocks()` és `vi.unstubAllGlobals()`.
NINCS hálózati hívás egyetlen próbában sem (ha egy eset nem írható meg hálózat nélkül, HAGYD KI és írd oda megjegyzésben, miért).
Magyar leírások az `it(...)`-ekben, magyar megjegyzések. NINCS `any`, nincs `console.log`, nincs új npm-függőség.

NE találj ki nem létező függvényt vagy mezőt: csak azt hívd, ami a mellékelt forrásban `export`-tal szerepel.

A választ ADD VISSZA A FÁJLT TELJES EGÉSZÉBEN, ```ts blokkban, fölötte a fájl útvonalával.
