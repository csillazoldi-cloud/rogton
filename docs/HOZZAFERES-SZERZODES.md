# A hozzáférés-modul szerződése — `@km/hozzaferes-core` (F-3 / R-2) · 0.1

2026-09-12 · a `docs/MODULSZABALY.md` szerint épül; ez a lap a mag NYILVÁNOS felülete. Aki a magot, a webalkalmazás
bekötését, a második befogadót vagy a próbákat írja, EBBŐL dolgozik — nem egymás kódjából.

## 1. Mit csinál (technológiai szó nélkül)

Egy munkatérnek tagjai vannak, három szereppel: tulajdonos, szerkesztő, néző. A modul tudja, ki mit tehet a tagokkal:
ki hívhat meg valakit (és milyen szerepre), ki állíthatja át egy tag szerepét, ki vehet le valakit, és mikor NEM lehet
valamit megtenni (az utolsó tulajdonos nem vehető le és nem léphet ki; senki nem adhat magánál nagyobb szerepet).
A meghívó egy egyszer használatos, hét napig érvényes jegy, amit a meghívott a belépése után bevált. A modul minden
döntéshez indokot ad, nem csak igent vagy nemet.

## 2. A szótár (a modul sajátja — a befogadó fordít rá)

```ts
export const Szerep = z.enum(["tulajdonos", "szerkeszto", "nezo"]);
export const SZEREP_ERO: Record<Szerep, number> = { nezo: 1, szerkeszto: 2, tulajdonos: 3 };
export const Muvelet = z.enum(["tagok_nez", "tag_meghiv", "meghivo_visszavon", "meghivo_elfogad", "szerep_allit", "tag_eltavolit", "kilep"]);
export const HozzaferesHibaKod = z.enum([
  "NINCS_JOG",             // a szerep nem elég a művelethez
  "NAGYOBB_SZEREP",        // magánál nagyobb szerepet adna (meghívásnál vagy átállításnál)
  "UTOLSO_TULAJDONOS",     // az utolsó tulajdonos nem vehető le, nem fokozható le, nem léphet ki
  "MAGAT_NEM",             // saját magát nem távolíthatja el és nem állíthatja át (kilépni a `kilep` művelettel lehet)
  "NINCS_ILYEN_TAG",
  "NINCS_ILYEN_MEGHIVO",
  "MEGHIVO_LEJART",
  "MEGHIVO_FELHASZNALVA",
  "MEGHIVO_VISSZAVONVA",
  "MAR_TAG",               // a meghívott már tagja a munkatérnek
  "ERVENYTELEN_ADAT",
]);
```

Művelet → ki teheti (a `MUVELET_SZEREP` tábla):

| Művelet | nezo | szerkeszto | tulajdonos | megjegyzés |
|---|---|---|---|---|
| tagok_nez | igen | igen | igen | |
| tag_meghiv | nem | igen | igen | a meghívott szerepe ≤ a meghívó szerepe (NAGYOBB_SZEREP) |
| meghivo_visszavon | nem | igen | igen | |
| meghivo_elfogad | — | — | — | nem munkatérhez kötött: bárki, aki belépett és van jegye |
| szerep_allit | nem | nem | igen | nem magát (MAGAT_NEM); az utolsó tulajdonost nem fokozza le (UTOLSO_TULAJDONOS); nem adhat magánál nagyobbat (tulajdonosnál ez nem fordul elő) |
| tag_eltavolit | nem | nem | igen | nem magát (MAGAT_NEM); az utolsó tulajdonost nem (UTOLSO_TULAJDONOS) |
| kilep | igen | igen | igen | az utolsó tulajdonos nem (UTOLSO_TULAJDONOS) |

**Az eltávolított tag munkája megmarad** — ez a befogadó kötelezettsége (a tagság törlése nem törli, amit a tag létrehozott);
a mag ezt a README-ben kimondja, és az esemény-kimenetben jelzi az eltávolítást.

## 3. A tárgyak

```ts
export type Tag = { fiok_id: string; szerep: Szerep; csatlakozott: string /* ISO */ };

export const MeghivoAllapot = z.enum(["kiadott", "elfogadott", "visszavont", "lejart"]);
export type Meghivo = {
  id: string;
  szervezet_id: string;
  szerep: Szerep;                 // a felajánlott szerep
  email: string | null;           // kinek szól (csak tájékoztató; a jegy a kulcs)
  lenyomat: string;               // a jegy lenyomata — a jegy MAGA sehol nem tárolódik
  letrehozta: string;             // fiok_id
  letrehozva: string;             // ISO
  lejar: string;                  // ISO — letrehozva + 7 nap (MEGHIVO_ERVENYESSEG_NAP = 7)
  allapot: "kiadott" | "elfogadott" | "visszavont";   // a "lejart" SZÁMOLT: kiadott és most > lejar
  elfogadta: string | null;       // fiok_id
  elfogadva: string | null;       // ISO
  visszavonva: string | null;     // ISO
};
export function meghivoAllapot(m: Meghivo, most: string): MeghivoAllapot;   // kiadott+lejárt → "lejart"

export type HozzaferesEsemeny =
  | { fajta: "meghivo_kiadva"; szervezet_id: string; meghivo_id: string; szerep: Szerep; kiadta: string }
  | { fajta: "meghivo_visszavonva"; szervezet_id: string; meghivo_id: string; visszavonta: string }
  | { fajta: "meghivo_elfogadva"; szervezet_id: string; meghivo_id: string; fiok_id: string; szerep: Szerep }
  | { fajta: "tag_felveve"; szervezet_id: string; fiok_id: string; szerep: Szerep }
  | { fajta: "szerep_valtozott"; szervezet_id: string; fiok_id: string; regi: Szerep; uj: Szerep; allitotta: string }
  | { fajta: "tag_eltavolitva"; szervezet_id: string; fiok_id: string; eltavolitotta: string }
  | { fajta: "tag_kilepett"; szervezet_id: string; fiok_id: string };
```

## 4. A konnektor — `host.ts` (amit a befogadó ad)

```ts
export type HostKontextus = { fiok_id: string; szervezet_id: string; szerep: Szerep };

export interface TagsagTar {
  tagok(szervezet_id: string): Promise<Tag[]>;
  felvesz(szervezet_id: string, fiok_id: string, szerep: Szerep, mikor: string): Promise<void>;
  szerepAllit(szervezet_id: string, fiok_id: string, szerep: Szerep): Promise<void>;
  eltavolit(szervezet_id: string, fiok_id: string): Promise<void>;
}
export interface MeghivoTar {
  ment(m: Meghivo): Promise<void>;                                        // új meghívó
  frissit(m: Meghivo): Promise<void>;                                     // állapotváltás
  azonositoSzerint(szervezet_id: string, id: string): Promise<Meghivo | null>;
  lenyomatSzerint(lenyomat: string): Promise<Meghivo | null>;            // munkatértől függetlenül (az elfogadáshoz)
  lista(szervezet_id: string): Promise<Meghivo[]>;
}
export interface Ora { most(): string /* ISO */ }
export interface Azonosito {
  uj(): string;                 // egyedi azonosító
  jegy(): string;               // a meghívó titka: legalább 32 véletlen karakter
  lenyomat(jegy: string): string;   // egyirányú lenyomat (a befogadó: pl. SHA-256 hex)
}
export type EsemenyKimenet = (e: HozzaferesEsemeny) => void | Promise<void>;

export type Kornyezet = { tagsag: TagsagTar; meghivo: MeghivoTar; ora: Ora; azonosito: Azonosito; esemeny: EsemenyKimenet };
```

A magban TILOS: `Date.now()`, `new Date()`, `Math.random()`, `crypto`, `process.env`, adatbázis, hálózat, React. Idő az `ora`-ból,
azonosító és jegy az `azonosito`-ból. Import: csak `@km/contracts` és `zod` (a Szerep szavai egyeznek a contracts-éval, de a modul a
SAJÁT enumját exportálja — a befogadó fordít).

## 5. A bejárat — `index.ts` függvényei

```ts
export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: HozzaferesHibaKod };

/** A döntő: szabad-e a művelet — INDOKKAL. Tiszta függvény, tár nélkül; a folyamatok ezt hívják. */
export function dont(
  ktx: HostKontextus,
  muvelet: Muvelet,
  cel?: { fiok_id?: string; szerep?: Szerep; tagok?: Tag[] },   // szerep_allit/tag_eltavolit/kilep/tag_meghiv célja és a tagok listája
): { szabad: true } | { szabad: false; indok: HozzaferesHibaKod };

export function tagokLista(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<Tag[]>>;
export function meghiv(k: Kornyezet, ktx: HostKontextus, be: { szerep: Szerep; email?: string | null }): Promise<Eredmeny<{ meghivo: Meghivo; jegy: string }>>;
   // a `jegy` EGYSZER jön vissza, itt; a tárba csak a lenyomata kerül
export function meghivoLista(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<(Meghivo & { allapot_most: MeghivoAllapot })[]>>;
export function meghivoVisszavon(k: Kornyezet, ktx: HostKontextus, meghivo_id: string): Promise<Eredmeny<Meghivo>>;
   // csak "kiadott" (nem lejárt) vonható vissza; lejárt → MEGHIVO_LEJART; elfogadott → MEGHIVO_FELHASZNALVA; visszavont → MEGHIVO_VISSZAVONVA
export function meghivoElfogad(k: Kornyezet, elfogado: { fiok_id: string }, jegy: string): Promise<Eredmeny<{ szervezet_id: string; szerep: Szerep }>>;
   // lenyomat → meghívó; nincs → NINCS_ILYEN_MEGHIVO; lejárt/felhasznált/visszavont → a megfelelő kód; már tag → MAR_TAG;
   // különben: felvesz + a meghívó "elfogadott" + esemény (meghivo_elfogadva, tag_felveve)
export function szerepAllit(k: Kornyezet, ktx: HostKontextus, fiok_id: string, szerep: Szerep): Promise<Eredmeny<Tag>>;
export function tagEltavolit(k: Kornyezet, ktx: HostKontextus, fiok_id: string): Promise<Eredmeny<{ fiok_id: string }>>;
export function kilep(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{ fiok_id: string }>>;
export const MEGHIVO_ERVENYESSEG_NAP = 7;
```

A `dont()` szabályai sorban: (1) a `MUVELET_SZEREP` tábla; (2) `MAGAT_NEM` (szerep_allit / tag_eltavolit a saját fiókra);
(3) `NAGYOBB_SZEREP` (tag_meghiv / szerep_allit: `SZEREP_ERO[cel.szerep] > SZEREP_ERO[ktx.szerep]`); (4) `UTOLSO_TULAJDONOS`
(szerep_allit lefokozás, tag_eltavolit vagy kilep egy tulajdonoson, ha a `tagok` közt ő az egyetlen tulajdonos); (5) `NINCS_ILYEN_TAG`
(szerep_allit / tag_eltavolit egy nem létező tagra, ha a `tagok` megadva).

*Következmény (2026-09-12, a próbák hozták ki):* mivel a (2) előbb szól, az utolsó tulajdonos SAJÁT lefokozása vagy eltávolítása
`MAGAT_NEM`-et ad; az `UTOLSO_TULAJDONOS` a `kilep` műveletnél él (és védőhálóként a másik kettőnél, ha valaha más is állíthatná).

## 6. Hibakódok — mikor melyik (a befogadó ezekre fordít feliratot és HTTP-státuszt)

| Kód | Mikor | Javasolt HTTP |
|---|---|---|
| NINCS_JOG | a szerep nem elég | 403 |
| NAGYOBB_SZEREP | magánál nagyobbat adna | 403 |
| UTOLSO_TULAJDONOS | az utolsó tulajdonost érintené | 409 |
| MAGAT_NEM | saját magát állítaná/távolítaná | 409 |
| MAR_TAG | a meghívott már tag | 409 |
| NINCS_ILYEN_TAG · NINCS_ILYEN_MEGHIVO | nincs ilyen | 404 |
| MEGHIVO_LEJART · MEGHIVO_FELHASZNALVA · MEGHIVO_VISSZAVONVA | a jegy nem váltható be | 410 |
| ERVENYTELEN_ADAT | a bemenet nem felel meg | 400 |

## 7. Beillesztés (a MODULSZABÁLY 9. pontja erre a modulra)

1. `packages/hozzaferes-core` másolása, workspace-listába. 2. A `host.ts` öt portja a saját tárra (a webalkalmazásban Postgres
+ drizzle a `tagsag` és az új `meghivo` táblával; a referencia-hostban SQLite). 3. `Ora`: `() => new Date().toISOString()`;
`Azonosito`: `crypto.randomUUID()`, 32 bájt véletlen base64url jegy, SHA-256 hex lenyomat. 4. A modul próbái (`pnpm --filter
@km/hozzaferes-core proba`) adatbázis nélkül zöldek. 5. Három határőr-szabály a `.dependency-cruiser.cjs`-be. 6. A hibakódok →
feliratok (`hozzaferes.hiba_*`), a HTTP-státusz a 6. pont szerint.
