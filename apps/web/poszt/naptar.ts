// R-18 3. kör · Naptár (Csilla 10-11; rajz: Claude Design „Naptár …” A/B, design/R18-arculatfrissites/IRANYOK.md Round 5) — a TISZTA
// szabályok: a nap kulcsa (Europe/Bucharest), a hét, a gép által javasolt nap és a heti számláló. Se adatbázis, se React: próbával őrizve
// (probak/r18-naptar.proba.ts). A tárolás a poszt_munka három új oszlopa (0166): tervezett_nap, javasolt_nap, kiteve — a poszt/tar.ts-ben.

/** ÉÉÉÉ-HH-NN — egy naptári nap, időzóna nélkül. */
export type Nap = string;

export type NaptarAllapot = "kiteve" | "tervezett" | "javasolt";

/** Egy kész poszt a naptárban (a lap és a végpontok ezt kapják). */
export type NaptarPoszt = {
  id: string;
  rovid_nev: string;
  /** a kép (ha a poszthoz van) — a sor bélyegképe */
  kep_url: string | null;
  tervezett_nap: Nap | null;
  javasolt_nap: Nap | null;
  /** ISO idő, ha kitette */
  kiteve: string | null;
};

export const NAPTAR_IDOZONA = "Europe/Bucharest";
/** A „Másik nap” választója: ma + a következő 13 nap (14 sor, a rajz napválasztója szerint). */
export const VALASZTO_NAPOK = 14;

const napFormazo = new Intl.DateTimeFormat("en-CA", { timeZone: NAPTAR_IDOZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** A naptári nap Bukarest szerint. */
export function napKulcs(d: Date): Nap {
  return napFormazo.format(d);
}

export function ervenyesNap(s: unknown): s is Nap {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Nap + n nap (n lehet negatív). Délben számolunk UTC-ben, így az óraátállítás nem csúsztat. */
export function napHozzaad(nap: Nap, n: number): Nap {
  const d = new Date(`${nap}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A hét napja: 1 = hétfő … 7 = vasárnap. */
export function hetNapja(nap: Nap): number {
  const n = new Date(`${nap}T12:00:00Z`).getUTCDay();
  return n === 0 ? 7 : n;
}

/** A hét hétfője. */
export function hetKezdete(nap: Nap): Nap {
  return napHozzaad(nap, 1 - hetNapja(nap));
}

export function napokKozott(a: Nap, b: Nap): number {
  return Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86_400_000);
}

/** Melyik napon áll a poszt a naptárban: ahol kitette, különben a tervezett, különben a javasolt nap. */
export function posztNapja(p: Pick<NaptarPoszt, "tervezett_nap" | "javasolt_nap" | "kiteve">): Nap | null {
  if (p.kiteve) return napKulcs(new Date(p.kiteve));
  return p.tervezett_nap ?? p.javasolt_nap;
}

export function posztAllapot(p: Pick<NaptarPoszt, "tervezett_nap" | "kiteve">): NaptarAllapot {
  if (p.kiteve) return "kiteve";
  return p.tervezett_nap ? "tervezett" : "javasolt";
}

/**
 * A gép javaslata egy új kész posztnak: holnaptól a választó végéig (ma + 13) az a szabad nap, ahol a posztok szétszóródnak.
 * Pontozás (a kisebb jobb): foglalt nap kiesik · szomszédos nap foglalt +10 · hétvége +8 · hétfő/szerda/péntek +3 (kedd és csütörtök
 * a legjobb, a rajz példája: kedd/csütörtök) · a korábbi nap kicsit jobb (+0,1 naponként). Ha minden nap foglalt: a legkevésbé zsúfolt.
 */
export function javasolNapot(foglalt: ReadonlyMap<Nap, number> | ReadonlySet<Nap>, ma: Nap): Nap {
  const db = (n: Nap): number => (foglalt instanceof Map ? (foglalt.get(n) ?? 0) : (foglalt as ReadonlySet<Nap>).has(n) ? 1 : 0);
  let legjobb: { nap: Nap; pont: number } | null = null;
  for (let i = 1; i < VALASZTO_NAPOK; i++) {
    const nap = napHozzaad(ma, i);
    const hn = hetNapja(nap);
    let pont = db(nap) * 100;
    if (db(napHozzaad(nap, -1)) > 0 || db(napHozzaad(nap, 1)) > 0) pont += 10;
    if (hn >= 6) pont += 8;
    else if (hn !== 2 && hn !== 4) pont += 3;
    pont += i * 0.1;
    if (!legjobb || pont < legjobb.pont) legjobb = { nap, pont };
  }
  return legjobb!.nap;
}

/** A napok foglaltsága: hány poszt áll egy-egy napon (kitéve, tervezve vagy javasolva) — a javaslathoz és a választó „1 poszt” jeléhez. */
export function foglaltsag(posztok: readonly Pick<NaptarPoszt, "tervezett_nap" | "javasolt_nap" | "kiteve">[]): Map<Nap, number> {
  const m = new Map<Nap, number>();
  for (const p of posztok) {
    const n = posztNapja(p);
    if (n) m.set(n, (m.get(n) ?? 0) + 1);
  }
  return m;
}

/**
 * Napot javasol minden kész posztnak, amelynek még nincs napja (se kitéve, se tervezve, se érvényes javaslat). Elmúlt, el nem fogadott
 * javaslat helyett újat ad. A sorrend: ahogy a hívó adja (a legrégebbi kész poszt elöl). Visszaadja a változott posztokat.
 */
export function javaslatokatAd(posztok: NaptarPoszt[], ma: Nap): NaptarPoszt[] {
  const valtozott: NaptarPoszt[] = [];
  const foglalt = foglaltsag(posztok.filter((p) => !(p.javasolt_nap && !p.tervezett_nap && !p.kiteve && p.javasolt_nap <= ma)));
  for (const p of posztok) {
    if (p.kiteve || p.tervezett_nap) continue;
    if (p.javasolt_nap && p.javasolt_nap > ma) continue;
    const nap = javasolNapot(foglalt, ma);
    p.javasolt_nap = nap;
    foglalt.set(nap, (foglalt.get(nap) ?? 0) + 1);
    valtozott.push(p);
  }
  return valtozott;
}

/** A hét számlálója (T8): hány poszt került ki ezen a héten, és hány van még tervezve rá (kitétel nélkül). */
export function hetiSzamlalo(posztok: readonly NaptarPoszt[], ma: Nap): { kiteve: number; tervezett: number } {
  const het = hetKezdete(ma);
  const vege = napHozzaad(het, 6);
  let kiteve = 0, tervezett = 0;
  for (const p of posztok) {
    const n = posztNapja(p);
    if (!n || n < het || n > vege) continue;
    if (p.kiteve) kiteve++;
    else if (p.tervezett_nap) tervezett++;
  }
  return { kiteve, tervezett };
}

/** A lap kérdése (T1): mit kell most tenni. Sorrend: a mai (vagy elmúlt) napú, ki nem tett poszt → javaslat elfogadása → rendben → üres. */
export type NaptarKerdes =
  | { fajta: "kitetted"; id: string; javasoltIs: boolean }
  | { fajta: "javasolt"; id: string; nap: Nap }
  | { fajta: "rendben" }
  | { fajta: "ures" };

export function naptarKerdes(posztok: readonly NaptarPoszt[], ma: Nap): NaptarKerdes {
  const javasoltak = posztok.filter((p) => !p.kiteve && !p.tervezett_nap && p.javasolt_nap).sort((a, b) => (a.javasolt_nap! < b.javasolt_nap! ? -1 : 1));
  const esedekes = posztok
    .filter((p) => !p.kiteve && p.tervezett_nap && p.tervezett_nap <= ma)
    .sort((a, b) => (a.tervezett_nap! < b.tervezett_nap! ? 1 : -1)); // a mai elöl, aztán a frissebb elmaradt
  if (esedekes[0]) return { fajta: "kitetted", id: esedekes[0].id, javasoltIs: javasoltak.length > 0 };
  if (javasoltak[0]) return { fajta: "javasolt", id: javasoltak[0].id, nap: javasoltak[0].javasolt_nap! };
  if (posztok.length > 0) return { fajta: "rendben" };
  return { fajta: "ures" };
}
