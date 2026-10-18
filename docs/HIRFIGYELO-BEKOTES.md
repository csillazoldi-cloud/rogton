# A Hírfigyelő bekötése egy rendszerbe — lépésről lépésre

*Készült: 2026-09-08 (E-31). A leírás a `@km/news-monitor-core` **0.2.0** verziójához szól. Két rendszer fut belőle: a webalkalmazás (`apps/web`: Next, React,
Postgres) és a referencia-host (`apps/referencia-host`: sima Node, SQLite). Ez a lap abból készült, amit a második bekötése tanított.*

## 0. Mit ad a modul, és mit kell adnia a befogadónak

A modul (a „mag") a SZABÁLYOK: mit jelent egy forrás, hogyan lesz a cikkből kivonat, mikor ugyanaz két cikk, hogyan születik a találat és az értékelés,
mit jelent egy beállítás-verzió. A mag **nem tárol, nem hálózik, nem ütemez, nem rajzol** — és nem tud a befogadóról semmit.

A befogadó (a „host") **négy csatlakozót** ad, plusz a kontextust:

| csatlakozó | mit jelent | a webalkalmazásban | a referencia-hostban |
|---|---|---|---|
| **tárolás** | a `HirfigyeloTar` 21 metódusa | Postgres (sorszintű védelemmel) | egy SQLite-fájl (`node:sqlite`) |
| **letöltő** | egy forrás cikkeinek beszerzése | a közös `@km/letolto` csomag | ugyanaz a csomag (vagy rögzített minta a próbákhoz) |
| **AI** | egy FELADAT elvégzése (nem egy konkrét modell!) | közös AI-csatlakozó, keretfigyeléssel | ugyanaz, a helyi modellre kötve |
| **ütemezés** | mikor fusson a figyelés | Postgres-várólista + 5 mp-es kör | SQLite-várólista + saját kör |

Ami NEM a hosté: a modul feliratai és AI-utasításai. Ezek a modul részei, közös csomagban (`@km/news-monitor-feliratok`, `@km/news-monitor-promptok`) —
így két rendszer UGYANAZT mondja a felhasználónak és UGYANAZT kéri a modelltől.

## 1. A csomagok, amiket be kell húzni

```jsonc
"dependencies": {
  "@km/news-monitor-core": "workspace:*",        // a mag (0.2.0)
  "@km/news-monitor-feliratok": "workspace:*",   // a modul feliratai, 3 nyelven
  "@km/news-monitor-promptok": "workspace:*",    // a modul AI-utasításai
  "@km/letolto": "workspace:*",                  // a közös letöltő (SSRF, robots.txt, RSS/Atom)
  "@km/ai-adapters": "workspace:*",              // AI-szolgáltatók (helyi modell, felhő)
  "@km/contracts": "workspace:*"                 // a szervezet profiljának sémája
}
```

A magot **csak a csomag bejáratán át** szabad használni (`@km/news-monitor-core`), belső fájlját soha. Ezt a határőr gépi szabálya őrzi.

## 1b. A típusok, amikkel dolgozni fogsz

```ts
import type { Kornyezet, HostKontextus, HirfigyeloTar, Letolto, AiHivo, HfFeladat } from "@km/news-monitor-core";

type HostKontextus = { fiok_id: string; szervezet_id: string; szerep: "tulajdonos" | "szerkeszto" | "nezo" };

type Kornyezet = {
  tar: HirfigyeloTar; letolto: Letolto; ai: AiHivo;
  profil: unknown;               // a szervezet KÖZÖS profilja — a host adja, a mag csak továbbadja az AI-nak
  idAdo: () => string; most: () => Date;
  esemeny?: (e: { fajta: string; szervezet_id: string; futas_id?: string; uj_talalatok?: number; reszlet?: string }) => void;
};

type Letolto = (f: Forras) => Promise<
  | { ok: true; tipus: "rss" | "weboldal"; szovegOlvashato: boolean;
      cikkek: { cim: string; url: string; megjelenes: string | null; szoveg: string; nyelv: string | null }[] }
  | { ok: false; hibaOk: string }>;

type AiHivo = <F extends HfFeladat>(feladat: F, bemenet: HfBemenet[F]) => Promise<
  | { ok: true; valasz: unknown; becsult_usd: number }
  | { ok: false; kod: "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_NINCS_KULCS" | "AI_ROSSZ_VALASZ" }>;
// HfFeladat: "hf_relevancia" | "hf_osszkep" | "hf_ugyanaz_az_esemeny" | "hf_szabaly_javaslat" | "hf_tartalomotlet" | "hf_beallitas_javaslat"
// A `valasz` NYERS: a mag ellenőrzi a szerződés szerint. Neked csak JSON-t kell visszaadnod.

// Minden magbeli függvény így válaszol — MINDIG az `ok`-ot vizsgáld először:
type Eredmeny<T> = ({ ok: true } & T) | { ok: false; hiba: string; reszlet?: unknown };
```

### Az adattípusok mezői

Mind zod-séma és TypeScript-típus is, a mag bejáratáról (`import { Beallitas, Forras, … } from "@km/news-monitor-core"`). A séma futásidőben is ellenőriz:
`Beallitas.parse(…)` megmondja, mi hibás — ezt használd a saját űrlapod ellenőrzésére, ne írj sajátot.

```ts
Beallitas = { celok: ("sajat_marka"|"szakmai"|"tartalomotlet")[]; temak: { nev: string; nevvaltozatok: string[]; megkulonboztetes: string }[];
              foldrajzi_fokusz: string; nyelvek: string[]; kizarasok: string[];
              idozites: { mod: "kezi"|"napi"; ora: number; perc: number; idozona: string }; szabad_szoveg: string }
BeallitasVerzio = { verzio: number; beallitas: Beallitas; letrehozva: ISO; eredet: "kezi"|"ai_elokeszites"|"ai_javaslat"|"visszaallitas"; allapot: "aktiv"|"korabbi" }
Forras   = { id; cim; tipus: "rss"|"weboldal"|null; eredet: "kezi"|"ai_javaslat";
             allapot: "ellenorzes_alatt"|"hasznalhato"|"korlatozott"|"hibas"|"nem_tamogatott"; ellenorzott: boolean; utolso_sikeres: ISO|null; hiba_ok: string|null }
Kivonat  = { id; forras_id; cim; url; kanonikus_url; megjelenes: ISO|null; begyujtes: ISO; szoveg; csonkolt: boolean; ujjlenyomat; nyelv: string|null; lejar: ISO }
Talalat  = { id; szervezet_id; esemeny_id; kivonat_id; ertekeles: Ertekeles|null;
             ertekeles_allapot: "fuggoben"|"kesz"|"keret_kimerult"; megtekintes: "uj"|"megtekintett"; jeloles: "nincs"|"mentett"|"elrejtett";
             letrehozva: ISO; futas_id; tartalomotlet: { szoveg; nyelv; keszult } | null }
Ertekeles = { fontossag: "fontos"|"erdekes"|"hatter"; temacimke: "sajat_megjelenes"|"szakmai"|"tartalomotlet"; miert; indoklas; osszefoglalo;
              szabaly_verzio: number; ertekelve: ISO; csonkolt_alapjan: boolean }
Esemeny  = { id; szervezet_id; fo_talalat_id; talalat_ids: string[]; letrehozva: ISO }
Futas    = { id; szervezet_id; szabaly_verzio: number; kezdet: ISO; veg: ISO|null;
             allapot: "indul"|"fut"|"kesz"|"reszleges"|"hiba"|"ai_fuggoben"; uj_talalatok: number; hibas_forrasok: { forras_id; ok }[]; proba: boolean }
Visszajelzes   = { id; talalat_id; fajta: "fontos"|"nem_relevans"; okok: ("masik_ceg"|"nem_ez_a_tema"|"tul_altalanos"|"ismetlodo")[]; sajat_indok; letrehozva: ISO }
SzabalyJavaslat = { id; szabaly_verzio: number; javasolt: Beallitas; mi_alapjan: string[]; indoklas; varhato_hatas; profil_erintett: boolean;
                    allapot: "fuggo"|"kiprobalt"|"elfogadva"|"elvetve"; minta_id: string|null; letrehozva: ISO }
Minta    = { id; szervezet_id; szabaly_verzio: number; talalat_ids: string[]; letrehozva: ISO; lejar: ISO }
```

## 2. Tárolás — a `HirfigyeloTar`

A teljes szerződés — ezt kell megvalósítanod:

```ts
interface HirfigyeloTar {
  verziok(szervezetId: string): Promise<BeallitasVerzio[]>;                       // üres tömb, ha nincs
  verziokMent(szervezetId: string, verziok: BeallitasVerzio[]): Promise<void>;    // a TELJES listát cseréli
  tervezet(szervezetId: string, fiokId: string): Promise<Beallitas | null>;       // fiókonként külön mentetlen szerkesztés
  tervezetMent(szervezetId: string, fiokId: string, b: Beallitas | null): Promise<void>;  // null = törlés
  forrasok(szervezetId: string): Promise<Forras[]>;
  forrasMent(szervezetId: string, f: Forras): Promise<void>;                      // van ilyen id → felülír, különben a lista VÉGÉRE
  futasok(szervezetId: string): Promise<Futas[]>;
  futasMent(szervezetId: string, f: Futas): Promise<void>;
  kivonatMent(szervezetId: string, k: Kivonat): Promise<"uj" | "letezik">;        // kulcs: szervezet + kanonikus URL; „letezik” esetén a RÉGI marad
  kivonatok(szervezetId: string, ids: string[]): Promise<Kivonat[]>;              // üres ids → üres tömb
  talalatok(szervezetId: string): Promise<Talalat[]>;
  talalatMent(szervezetId: string, t: Talalat): Promise<void>;
  esemenyek(szervezetId: string): Promise<Esemeny[]>;
  esemenyMent(szervezetId: string, e: Esemeny): Promise<void>;
  visszajelzesek(szervezetId: string): Promise<Visszajelzes[]>;
  visszajelzesMent(szervezetId: string, v: Visszajelzes): Promise<void>;
  javaslatok(szervezetId: string): Promise<SzabalyJavaslat[]>;
  javaslatMent(szervezetId: string, j: SzabalyJavaslat): Promise<void>;
  mintak(szervezetId: string): Promise<Minta[]>;
  mintaMent(szervezetId: string, m: Minta): Promise<void>;
  lejartKivonatokTorol(szervezetId: string, most: Date): Promise<number>;         // a TÖRÖLTEK számát adja vissza
}
```

Minden `…Ment` metódus **beszúr vagy felülír** az `id` alapján, és a lista sorrendje a beszúrásé.
Az adattípusok (`Beallitas`, `Forras`, `Kivonat`, `Talalat`, `Esemeny`, `Futas`, `Visszajelzes`, `SzabalyJavaslat`, `Minta`) a mag bejáratáról jönnek —
`import type { … } from "@km/news-monitor-core"` —, és zod-sémaként is elérhetők, ha ellenőrizni akarod, amit tárolsz.

**A mérce a magban lévő `memoriaTar()`**: futtasd le ugyanazt a műveletsort rajta és a tiéden, és vesd össze a válaszokat — a referencia-host próbája
pontosan ezt teszi (`apps/referencia-host/probak/sqlite-tar.proba.ts`), másold át, az a leggyorsabb ellenőrzés.

**EGY dologban tudatosan térj el tőle**: a `memoriaTar()` a saját belső listáját adja vissza, a tiéd adjon MÁSOLATOT. (Ez a memóriabeli tár ismert gyengéje:
a hívó véletlenül átírhatná a tárolt adatot. Az összevető próbában ezért pillanatképet kell rögzíteni.)

Amire figyelj (mindkettőn megégettük magunkat):
- **Sorrend**: a listák a beszúrás sorrendjében jönnek vissza; egy meglévő elem frissítése NEM viszi a lista végére.
- **`kivonatMent`** `"uj"` vagy `"letezik"` — a kulcs a szervezet + a kanonikus URL (A-10: ugyanaz a cikk nem kerül be kétszer), és `"letezik"` esetén
  a RÉGI adat marad.
- **Szervezet szerinti szűrés minden lekérdezésben** — több ügyfél adata sosem keveredhet.

## 3. Letöltő

```ts
import { letoltoHiv } from "@km/letolto";
const letolto: Letolto = async (f) => letoltoHiv({ cim: f.cim, tipus: f.tipus });
```
A csomag **host-semleges** (nincs benne keretrendszer). Ha a rendszered böngészőbe is fordít kódot, a saját bejáratodon tedd oda a `server-only` őrt —
a letöltő szerveroldali kód (SSRF-védelem, DNS-feloldás).

### Ugyanaz a cikk két forrásból — mit kell tennem?

Semmit: a mag intézi. A `figyelesFuttat` minden letöltött cikkből kivonatot készít, és `kivonatMent`-tel próbálja betenni. A kulcs a szervezet + a KANONIKUS
URL, ezért ugyanaz a cikk másodszorra `"letezik"`-et kap és kimarad (A-10). A MÁS URL-en megjelenő, de azonos ESEMÉNYRŐL szóló cikkeket a mag külön kezeli:
előbb ujjlenyomat és cím-hasonlóság szűri a „gyanús párokat", és csak ezekre kérdez rá az AI-tól (`hf_ugyanaz_az_esemeny`) — futásonként legfeljebb
`HF_PAR_KORLAT` (60) kérdés. Az egy eseményhez tartozó cikkek EGY kártyára kerülnek, több forrással. Neked csak a `kivonatMent` szerződését kell tartanod.

## 4. AI

```ts
import { prompt } from "@km/news-monitor-promptok";

const ai: AiHivo = async (feladat, bemenet) => {
  const rendszer = prompt(feladat, nyelv);        // nyelv: a VÁLASZ nyelve (a felület nyelve)
  const v = await szolgaltato.hiv({ feladat, rendszer, szoveg: bemenetSzoveg(feladat, bemenet), nyelv, maxKiToken, idokorlatMs });
  return { ok: true, valasz: JSON.parse(v.szoveg), becsult_usd: v.meres.becsult_usd };
};
```

Amit a két bekötés tanított:
- **A modell a válasz nyelvét csak a CÉLNYELVEN megfogalmazott utasításból veszi át.** A magyar promptban magyarul kérni, hogy „írj románul", nem működik
  (mérve 2026-09-08, helyi Qwen 27b). A `prompt()` ezt megoldja: a nyelvfüggő utasítást célnyelvi mondat keretezi elöl-hátul.
- **A helyi modell hidegindítása ~30 mp** — az időkorlát ne legyen ennél kevesebb (mi 180 mp-et adunk), és a modell maradjon betöltve (`keep_alive`).
- A hibakódokat pontosan add vissza: `AI_NEM_ELERHETO`, `AI_KERET_KIMERULT`, `AI_NINCS_KULCS`, `AI_ROSSZ_VALASZ`. **Mi történik ilyenkor:**
  a cikkek BEKERÜLNEK (a letöltés és a tárolás megtörtént), a találat `ertekeles_allapot` mezője `fuggoben` marad (kereten kívül: `keret_kimerult`),
  a futás állapota `ai_fuggoben`. Semmi nem vész el. Ugyanez történik `AI_ROSSZ_VALASZ`-nál is (a modell nem a szerződés szerinti JSON-t adta):
  a találat `fuggoben` marad, nem lesz belőle rossz értékelés. A pótlás egyetlen hívás: **`ertekelesUjra(k, ktx)`** — a függőben maradt találatokat újraértékeli.
  A hosted ezt tegye elérhetővé (gomb vagy ütemezett újrapróbálás). Ha az AI ekkor sem elérhető, a találatok maradnak `fuggoben` — az `ertekelesUjra`
  nem dob hibát, csak `ujraErtekelt: 0`-t ad; bármikor újrahívható.
- **A promptok és a feliratok ADATFÁJLOK.** Ha a rendszered egybefordítja a kódot (Next „standalone", esbuild, webpack), a fordító NEM viszi magával
  ezeket a fájlokat — kézzel kell bemásolni a futtatható csomagba. (A mi Dockerfile-unkban két `COPY` sor; enélkül a futás némán „AI nem elérhető"-t ad.)

## 5. Ütemezés

A mag nem ütemez. A host dolga:
1. Az aktív beállítás `idozites` mezője (`{ mod: "kezi" | "napi", ora, perc, idozona }`) alapján eldönteni, esedékes-e a futás.
   **`kezi`** = a rendszer magától SOHA nem indít, csak amikor a felhasználó kéri (gomb). **`napi`** = naponta egyszer, a megadott helyi időpont után. Az időzónát `Intl`-lel
   számold (`hourCycle: "h23"`), ne kézi eltolással.
2. A hosszú munkát háttérbe tenni: a figyelés valódi AI-jal PERCEKIG tart, egy webkérés ezt nem bírja ki.
3. **Adj határidőt**: `figyelesFuttat(k, ktx, { proba: boolean; hatarido?: Date })` — a `hatarido` a 0.2.0 óta van, választható. A futás magától befejezi és menti, amit elért. Enélkül a sorod lejárhat, miközben a munka
   gazdátlanul fut tovább (nálunk 12 percig ment így egy futás).
4. Egyszerre EGY futás szervezetenként — a mag `FUT_MAR`-t ad, ha mégis indítanál másikat.

## 6. A `Kornyezet` — a négy csatlakozó összefűzése

```ts
const k: Kornyezet = {
  tar,                       // HirfigyeloTar (2. pont)
  letolto,                   // Letolto (3. pont)
  ai,                        // AiHivo (4. pont)
  profil,                    // a szervezet KÖZÖS profilja — a host ADJA, a mag csak olvassa (10.3)
  idAdo: () => randomUUID(),
  most: () => new Date(),
  esemeny: (e) => naplo(e),  // választható: naplózás, értesítés
};
const ktx: HostKontextus = { fiok_id, szervezet_id, szerep };  // ki kérdez, melyik szervezetben, milyen szereppel
```

Innentől a mag függvényei hívhatók: `beallitasMent`, `forrasHozzaad`, `forrasEllenoriz`, `figyelesFuttat`, `attekintes`, `visszajelzesRogzit`,
`javaslatKer`, `javaslatKiprobal`, `javaslatDont`, `verzioVisszaallit`, `ertekelesUjra`, `talalatMegtekint`, `talalatJelol`, `osszkep`, `tartalomotletKer`, `finomhangolas`.
Mind ugyanígy néz ki: `(k, ktx, …)` → `{ ok: true, … }` vagy `{ ok: false, hiba: "…" }`. **Mindig az `ok`-ot vizsgáld először.**

## 6b. Első használat — a hívások sorrendje egy üres rendszerben

Nincs külön „telepítés": a mag az első mentéskor hozza létre az első verziót. A sorrend:

```ts
// 1) Van-e már aktív beállítás? (üres rendszerben nincs)
const aktiv = aktivVerzio(await k.tar.verziok(ktx.szervezet_id));   // null

// 2) Beállítás mentése — EZ hozza létre az 1-es verziót. verziokMent-et NEM hívsz kézzel:
//    az a tár BELSŐ metódusa, amit a mag használ.
const m = await beallitasMent(k, ktx, { celok, temak, foldrajzi_fokusz, nyelvek, kizarasok, idozites, szabad_szoveg }, "kezi");
if (!m.ok) return hiba(m.hiba);        // ERVENYTELEN_ADAT → m.reszlet mondja meg, melyik mező

// 3) Forrás hozzáadása és ellenőrzése (a nem ellenőrzött forrás nem kerül be a futásba)
const f = await forrasHozzaad(k, ktx, "https://pelda.hu/feed", "kezi");
if (f.ok) await forrasEllenoriz(k, ktx, f.forras.id);   // → hasznalhato | korlatozott | hibas | nem_tamogatott

// 4) Figyelés — HÁTTÉRBEN, határidővel
const e = await figyelesFuttat(k, ktx, { proba: false, hatarido: new Date(Date.now() + 14 * 60_000) });

// 5) Megjelenítés
const at = await attekintes(k, ktx);   // { talalatok, kartyak, ujDb, utolsoSikeres, aktivFutas, forrasHibak, esemenyek, kovetkezo }
```

Beállítás nélkül a `figyelesFuttat` `NINCS_BEALLITAS`-t ad — ez a „még nincs beállítva" állapot jele, nem hiba.
A `tervezetMent` a mentetlen szerkesztéshez van (a felhasználó félbehagyja az űrlapot); a futó figyelést nem érinti.

## 7. Profil és jogosultság

A profilt a HOST adja (`Kornyezet.profil`), a modul csak olvassa, és NEM gyűjti be (10.3). A szerepeket a mag ismeri: `tulajdonos` és `szerkeszto` mindent,
`nezo` csak nézhet — a `jogosult(szerep, muvelet)` a mag függvénye, ne írd újra.

### A válasz nyelve — honnan tudja a host?

A `HostKontextus`-ban SZÁNDÉKOSAN nincs nyelv: a mag nem tud a felületről. A nyelv a HOSTÉ, és a te AI-csatlakozód viszi be a `prompt(feladat, nyelv)`-be.
Ne keverd a `Beallitas.nyelvek` mezővel: az azt mondja meg, MILYEN NYELVŰ CIKKEKET figyelünk; a `prompt(feladat, nyelv)` nyelve pedig azt, milyen nyelven
ÍRJON az AI. A kettő független (magyar felhasználó figyelhet angol forrásokat). Az `ertekelesUjra` az AKKORI nyelven értékel — ha időközben nyelvet váltottak,
a pótolt találatok az új nyelven készülnek el, a korábbiak nem íródnak át.
Ahonnan mi vesszük: a figyelést INDÍTÓ ember felületi nyelve (a webalkalmazásban a fiókra mentve, mert a háttérfutásban nincs böngésző-adat), a napi
automatikus futásnál a szervezet tulajdonosáé. Ha a felhasználó nyelvet vált, a KÖVETKEZŐ futás már azon a nyelven válaszol — a régi találatok szövege nem
íródik át (ez szándékos: a találat annak a nyelvén marad, ahogy készült).

## 8. Feliratok

```ts
import { felirat, feliratKitolt, NYELVEK } from "@km/news-monitor-feliratok";
```
189 kulcs × 3 nyelv (hu, ro, en). Ha a rendszered adatbázisból szolgálja ki a feliratokat (mint a webalkalmazás), a migrációt a `tools/feliratok/general.mjs`
GENERÁLJA ebből az adatfájlból — kézzel ne írd át egyiket sem, mert szétcsúsznak. Egy próba őrzi, hogy egyeznek.

## 9. Verziófrissítés — mi számít kompatibilisnek

A mag **0.2.0**-ja egy ÚJ, VÁLASZTHATÓ mezőt tett a kártyára (`esemeny_ideje`: a kártya forrásai közül a legkorábbi megjelenés). A 0.1.0-ra írt host kódja
változatlanul fordul és fut — a régi mezők nem változtak, a függvények aláírásai sem.

A szabály, amit tartunk: **kompatibilis** = új választható mező, új függvény, bővülő felsorolás olyan helyen, ahol a hívó nem sorolja fel az eseteket.
**Nem kompatibilis** = mező elvétele vagy átnevezése, kötelezővé tétel, aláírás-változás, hibakód eltüntetése. Az utóbbi főverziót emel, és a szerződéslapon
(`docs/HIRFIGYELO-SZERZODES.md`) fel kell tüntetni.

**Kell-e migrációt írnom?** A 0.2.0-hoz nem: az új mező SZÁMÍTOTT (a kártya összeállításakor keletkezik a forrásokból), nem tárolt — a régi rekordok
változatlanul jók. Ha egy jövőbeli verzió TÁROLT mezőt tesz hozzá, a szerződéslap kimondja, és a host írja meg a saját migrációját.

Frissítés után **mindkét host próbáinak zöldnek kell lenniük.**

## 10. Ellenőrzőlista egy harmadik rendszerhez

1. A hat csomag behúzva, a mag csak a bejáratán át használva.
2. `HirfigyeloTar` megvalósítva; a memóriabeli tárral összevető próba zöld.
3. Letöltő bekötve (a közös csomagból), a saját oldalon a szerver-őrrel.
4. AI-csatlakozó a közös promptokkal, helyes hibakódokkal, elég hosszú időkorláttal.
5. Ütemezés háttérben, határidővel, szervezetenként egy futással.
6. A profil a hostból jön; a jogosultságot a mag dönti el.
7. A feliratok a közös csomagból; ha adatbázisba kerülnek, generálva.
8. Ha egybefordítod a kódot: a prompt- és felirat-adatfájlok bemásolva a futtatható csomagba.
9. Egy végigfutás-próba: beállítás → forrás → ellenőrzés → futás → találatok a saját tárolódban; másodszorra 0 új (dedup).
