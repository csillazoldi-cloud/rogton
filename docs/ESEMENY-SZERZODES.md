# Az eseménynapló- és értesítés-modul szerződése — `@km/esemeny-core` (F-5 / R-4) · 0.1

2026-09-12 · a `docs/MODULSZABALY.md` szerint. Ez a mag NYILVÁNOS felülete; a befogadók és a próbák ebből dolgoznak.
Rajz nincs (design/r4 hiányzik): itt CSAK gépezet épül — a napló, a két szint szabálya, a kimenő csatorna kapuja.

## 1. Mit csinál (technológiai szó nélkül)

A rendszerben történő dolgokról (valaki belépett, meghívtak valakit, lefutott egy figyelés, elfogyott a keret) egységes
feljegyzés készül: mi történt, kinél, mikor, ki tette. Ez a napló. Egy második szabály eldönti, melyik fajta eseményről
kell értesíteni: van egy közös alapbeállítás (a rendszergazda állítja) és egy szervezeti felülírás (a tulajdonos állítja);
ami nincs felülírva, az a közösből jön. Ha egy eseményt értesíteni kell, a modul egy rövid üzenetet ad a befogadónak, aki a
saját csatornáján (pl. egy webes horog) elküldi. Alapból SEMMIRŐL nem megy értesítés — csak amit bekapcsolnak.

## 2. A szótár

```ts
export const EsemenyFajta = z.enum([
  "belepes", "kilepes", "jelszo_valtas", "kileptetes_mindenhol",
  "meghivo_kiadva", "meghivo_visszavonva", "meghivo_elfogadva", "tag_felveve", "szerep_valtozott", "tag_eltavolitva", "tag_kilepett",
  "futas_indult", "futas_kesz", "futas_hiba", "keret_kimerult",
  "tema_alkalmazva", "feliratok_alkalmazva", "profil_jovahagyva",
  "ai_kapcsolo_valtozott", "fajl_feltoltve", "mentes_kimaradt",
]);
export const Sulyossag = z.enum(["info", "figyelem", "hiba"]);
export const Csatorna = z.enum(["nincs", "kimeno"]);   // a "kimeno" = a befogadó kimenő csatornája (egyetlen, a titok a vaultban)
export const EsemenyHibaKod = z.enum(["NINCS_JOG", "ERVENYTELEN_ADAT", "ISMERETLEN_FAJTA"]);
```

## 3. A tárgyak

```ts
export type Esemeny = {
  id: string;
  szervezet_id: string | null;       // null = az egész rendszer (pl. mentés kimaradt)
  fajta: EsemenyFajta;
  sulyossag: Sulyossag;              // a fajtából számolt alap (ALAP_SULYOSSAG), felülírható a feljegyzésnél
  fiok_id: string | null;            // ki tette (null, ha a rendszer)
  ido: string;                       // ISO — az órából
  adat: Record<string, string | number | boolean | null>;   // rövid, kulcs–érték; SOHA nem titok, nem jelszó, nem jegy
};

/** Értesítési beállítás: fajtánként melyik csatornára. Részleges lehet (a szervezeti szint csak a felülírt fajtákat tartalmazza). */
export type ErtesitesBeallitas = Partial<Record<EsemenyFajta, Csatorna>>;
export const ALAP_ERTESITES: Record<EsemenyFajta, Csatorna>;   // MINDEN fajta "nincs" — alapból semmi nem megy ki

/** A „mentés kimaradt" jelzés alapból KI (R-4): amíg a mentés nem fut magától, ez hamis riasztás lenne. */
export const MENTES_KIMARADT_ALAPBOL_BE = false;

export type KimenoUzenet = { szervezet_id: string | null; fajta: EsemenyFajta; sulyossag: Sulyossag; cim: string; szoveg: string; ido: string };
```

## 4. A konnektor — `host.ts`

```ts
export type HostKontextus = { fiok_id: string; szervezet_id: string; szerep: "tulajdonos" | "szerkeszto" | "nezo" };

export interface EsemenyTar {
  ir(e: Esemeny): Promise<void>;
  lista(szervezet_id: string, szuro?: { fajta?: EsemenyFajta; limit?: number }): Promise<Esemeny[]>;   // legújabb elöl, limit alap 100
  rendszerLista(szuro?: { limit?: number }): Promise<Esemeny[]>;    // a szervezet nélküli (rendszer-) események — a rendszergazdának
}
export interface ErtesitesTar {
  kozos(): Promise<ErtesitesBeallitas>;                              // a közös alap (üres = ALAP_ERTESITES)
  kozosMent(b: ErtesitesBeallitas): Promise<void>;
  szervezeti(szervezet_id: string): Promise<ErtesitesBeallitas>;    // a felülírás (csak a felülírt fajták)
  szervezetiMent(szervezet_id: string, b: ErtesitesBeallitas): Promise<void>;
}
export interface Ora { most(): string }
export interface Azonosito { uj(): string }
export interface KimenoCsatorna { kuld(u: KimenoUzenet): Promise<{ ok: true } | { ok: false; hiba: string }> }   // a befogadóé; a titok NÁLA van
export type Feliratozo = (kulcs: string, ertekek?: Record<string, string | number>) => string;   // a befogadó feliratrendszere (esemeny.<fajta>_cim / _szoveg)

export type Kornyezet = { tar: EsemenyTar; ertesites: ErtesitesTar; ora: Ora; azonosito: Azonosito; csatorna: KimenoCsatorna; felirat: Feliratozo };
```

TILOS a magban: `Date.now()`, `new Date()`, `Math.random()`, `crypto`, `process.env`, hálózat, adatbázis, React. Import: `@km/contracts`, `zod`.

## 5. A bejárat

```ts
export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: EsemenyHibaKod };
export const ALAP_SULYOSSAG: Record<EsemenyFajta, Sulyossag>;   // futas_hiba, keret_kimerult, mentes_kimaradt → "hiba"; tag_eltavolitva, szerep_valtozott, ai_kapcsolo_valtozott, kileptetes_mindenhol → "figyelem"; a többi "info"

/** Két szint egyesítése: ami a szervezetiben nincs, a közösből; ami a közösben nincs, az ALAP_ERTESITES-ből. Tiszta. */
export function hatasosErtesites(kozos: ErtesitesBeallitas, szervezeti: ErtesitesBeallitas): Record<EsemenyFajta, Csatorna>;

/** Feljegyzés + (ha a hatásos beállítás "kimeno") a kimenő üzenet elküldése. A küldés hibája NEM dobja el a feljegyzést: az esemény
 *  a tárba kerül, és a visszatérési érték mondja meg, ment-e ki. A `fajta` ismeretlen → ISMERETLEN_FAJTA. */
export function feljegyez(k: Kornyezet, e: { szervezet_id: string | null; fajta: EsemenyFajta; fiok_id?: string | null; adat?: Esemeny["adat"]; sulyossag?: Sulyossag }):
  Promise<Eredmeny<{ esemeny: Esemeny; kikuldve: boolean; kuldesHiba: string | null }>>;

/** A kimenő üzenet szövege a feliratozóból: cím `esemeny.<fajta>_cim`, szöveg `esemeny.<fajta>_szoveg` az `adat` értékeivel. Tiszta. */
export function kimenoUzenet(e: Esemeny, felirat: Feliratozo): KimenoUzenet;

export function naplo(k: Kornyezet, ktx: HostKontextus, szuro?: { fajta?: EsemenyFajta; limit?: number }): Promise<Eredmeny<Esemeny[]>>;   // bármely tag
export function ertesitesLekerdez(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{ kozos: ErtesitesBeallitas; szervezeti: ErtesitesBeallitas; hatasos: Record<EsemenyFajta, Csatorna> }>>;   // bármely tag
export function ertesitesSzervezetiMent(k: Kornyezet, ktx: HostKontextus, b: unknown): Promise<Eredmeny<ErtesitesBeallitas>>;   // csak tulajdonos (NINCS_JOG); a `b` sémája ErtesitesBeallitas, ismeretlen fajta → ERVENYTELEN_ADAT
export function ertesitesKozosMent(k: Kornyezet, b: unknown): Promise<Eredmeny<ErtesitesBeallitas>>;   // a befogadó előtte ellenőrzi a rendszergazda-jogot
```

## 6. Hibakódok → HTTP (a befogadó): NINCS_JOG 403 · ERVENYTELEN_ADAT 400 · ISMERETLEN_FAJTA 400.

## 7. A befogadó kötelezettségei

- Az `adat`-ba SOHA nem kerül titok: jelszó, jegy, süti, kulcs. A mag nem tud róla, ezért a hívó felel.
- A kimenő csatorna titka (a horog címe) a vaultból a befogadó környezetébe kerül (`ERTESITES_WEBHOOK_URL`), a kódban és a naplóban nem jelenik meg.
- A meglévő jelek bekötése (F-5): belépés/kilépés (hitelesites), a hozzáférés-modul eseményei (`hozzaferes/index.ts` esemény-kimenete), a hírfigyelő
  eseményei (`hirfigyelo/index.ts`), téma és feliratok alkalmazása, profil jóváhagyása, AI-kapcsoló váltása, jelszóváltás, kiléptetés.
- Az AI-kapcsoló (R-4) a szervezet beállítása (`szervezet.ai_engedelyezve`, alap igaz): MINDEN AI-hívás előtt ellenőrizve (`keretEllenoriz`
  mellett) — kikapcsolt AI-nál a hívás `AI_KIKAPCSOLVA` hibával áll meg, és a háttérfutás is kihagyja az AI-lépést.
