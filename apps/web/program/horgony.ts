import { FESZTIVAL_TEMA_FAJTAK, type FesztivalTemaFajta, type ProgramTetel, type Rendezveny, type TemaTerv } from "@km/contracts";
import { ervenyesNap, napHozzaad, napokKozott, type Nap } from "../poszt/naptar";
import { kiemeltTetelek } from "./blokk";

// c30 F8 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §4, rajz D7a/D7b): a fesztivál-témák HORGONYAI — melyik napon melyik poszt-ötlet
// esedékes a rendezvény dátumai és a program szerint. Tiszta függvény (nincs adatbázis, nincs óra): a „ma” kívülről jön (Bukarest
// szerinti naptári nap, poszt/naptar.ts napKulcs). A napok ÉÉÉÉ-HH-NN kulcsok, a lépés délben UTC-ben (napHozzaad): az óraátállítás
// nem csúsztat. Az ötletek NEM íródnak sehova, amíg valaki nem koppint a „Megírjuk”-ra: akkor lesz belőlük poszt_munka, a forrás
// azonosítója a kulcs (`program:<fajta>:<nap>[:<tétel-id>]`) — ugyanaz az ötlet mindig ugyanazt a posztot nyitja (A-8).

export type HorgonyOtlet = {
  /** a nap, amelyen a posztot ki kellene tenni */
  nap: Nap;
  fajta: FesztivalTemaFajta;
  /** a program napja, amelyről a poszt szól (holnapi / mai program, album, a fellépő fellépésének napja); a többinél null */
  cel_nap: Nap | null;
  /** a fellépő-poszt tétele */
  program_id?: string;
  /** a kártya nevei (a nap kiemelt fellépői, vagy a fellépő neve) — a program első nyelvén */
  nevek: string[];
  /** visszaszámlálásnál: hány nap van még a kezdésig */
  hatra?: number;
  /** az idempotens kulcs — a poszt_munka `forras.azonosito`-ja (a c30 F7 programHorgony ebből veszi a szeletet) */
  kulcs: string;
};

/** Legfeljebb ennyi ötlet egy napra: a rendezvény előtt 2, alatta (és utána) 3. */
export const HORGONY_MAX_ELOTTE = 2;
export const HORGONY_MAX_ALATT = 3;
/** A Kezdőlap ennyi napra előre mutatja az esedékes ötleteket (ma, holnap, holnapután). */
export const HORGONY_ELORE_NAPOK = 3;

/** Ha egy napra több jutna, mint a plafon, ez a sorrend dönt (elöl a fontosabb). */
const RANG: Record<FesztivalTemaFajta, number> = { mai_program: 1, holnapi_program: 2, visszaszamlalo: 3, album: 4, koszono: 5, fellepo: 6, gyakorlati: 7 };

export function horgonyKulcs(o: Pick<HorgonyOtlet, "fajta" | "nap" | "cel_nap" | "program_id">): string {
  return `program:${o.fajta}:${o.cel_nap ?? o.nap}${o.program_id ? `:${o.program_id}` : ""}`;
}

function nev(t: ProgramTetel, nyelv: string): string {
  return (t.fellepo.trim() || t.nev[nyelv as keyof typeof t.nev] || t.nev.hu || t.nev.ro || Object.values(t.nev).find(Boolean) || "").trim();
}

/** A tématerv fesztivál-fajtái; ha a terv egyet sem jelöl (régi terv, cég), mind a hét. */
export function horgonyFajtak(tema: readonly TemaTerv[] | null | undefined): FesztivalTemaFajta[] {
  const k = new Set((tema ?? []).map((t) => t.fajta).filter((f): f is FesztivalTemaFajta => (FESZTIVAL_TEMA_FAJTAK as readonly string[]).includes(f ?? "")));
  return k.size ? FESZTIVAL_TEMA_FAJTAK.filter((f) => k.has(f)) : [...FESZTIVAL_TEMA_FAJTAK];
}

/**
 * Az összes horgony a rendezvényhez (§4): visszaszámlálás kezdés −14, −7, −3, −1 · holnapi program minden nap előtt egy nappal · mai
 * program minden nap · fellépő: a kiemeltek, előadásuk előtt −1…−3 napon, naponta legfeljebb egy · tudnivalók −5 és −1 · album minden
 * nap után egy nappal · köszönet a vége után egy nappal. Napi plafon (RANG szerint): előtte 2, alatta és utána 3. Dátum nélkül: semmi.
 */
export function horgonyJavaslatok(rendezveny: Rendezveny | null | undefined, tetelek: readonly ProgramTetel[], fajtak: readonly FesztivalTemaFajta[], nyelv = "hu"): HorgonyOtlet[] {
  const s = rendezveny?.mettol, e = rendezveny?.meddig ?? rendezveny?.mettol;
  if (!s || !e || !ervenyesNap(s) || !ervenyesNap(e) || e < s) return [];
  const kell = new Set(fajtak);
  const napok: Nap[] = [];
  for (let n = s; n <= e && napok.length < 31; n = napHozzaad(n, 1)) napok.push(n);
  const aktiv = tetelek.filter((t) => t.aktiv);
  const kiemelt = kiemeltTetelek(aktiv);
  const napNevei = (nap: Nap): string[] => {
    const k = kiemelt.filter((t) => t.nap === nap).map((t) => nev(t, nyelv));
    if (k.length) return [...new Set(k.filter(Boolean))].slice(0, 2);
    // nincs fő színpad aznap: a nap két legkésőbbi esti (18:00-tól) koncertje, időrendben; ha az sincs, nincs név (a kártya a napot mondja)
    const esti = aktiv.filter((t) => t.nap === nap && t.fajta === "koncert" && (t.kezdes ?? "") >= "18:00").sort((a, b) => (b.kezdes ?? "").localeCompare(a.kezdes ?? "")).slice(0, 2).reverse();
    return [...new Set(esti.map((t) => nev(t, nyelv)).filter(Boolean))];
  };
  const ki: Omit<HorgonyOtlet, "kulcs">[] = [];
  const tesz = (o: Omit<HorgonyOtlet, "kulcs">) => { if (kell.has(o.fajta)) ki.push(o); };
  for (const d of [14, 7, 3, 1]) tesz({ nap: napHozzaad(s, -d), fajta: "visszaszamlalo", cel_nap: null, nevek: [], hatra: d });
  for (const d of [5, 1]) tesz({ nap: napHozzaad(s, -d), fajta: "gyakorlati", cel_nap: null, nevek: [] });
  for (const n of napok) {
    tesz({ nap: napHozzaad(n, -1), fajta: "holnapi_program", cel_nap: n, nevek: napNevei(n) });
    tesz({ nap: n, fajta: "mai_program", cel_nap: n, nevek: napNevei(n) });
    tesz({ nap: napHozzaad(n, 1), fajta: "album", cel_nap: n, nevek: [] });
  }
  tesz({ nap: napHozzaad(e, 1), fajta: "koszono", cel_nap: null, nevek: [] });
  // fellépők: előadásuk előtt a legközelebbi szabad nap (−1, −2, −3), naponta legfeljebb egy
  if (kell.has("fellepo")) {
    const foglalt = new Set<Nap>();
    for (const t of kiemelt) {
      if (!t.nap) continue;
      for (const d of [1, 2, 3]) {
        const nap = napHozzaad(t.nap, -d);
        if (foglalt.has(nap)) continue;
        foglalt.add(nap);
        ki.push({ nap, fajta: "fellepo", cel_nap: t.nap, program_id: t.id, nevek: [nev(t, nyelv)] });
        break;
      }
    }
  }
  // napi plafon
  const napra = new Map<Nap, Omit<HorgonyOtlet, "kulcs">[]>();
  for (const o of ki) napra.set(o.nap, [...(napra.get(o.nap) ?? []), o]);
  const vegso: HorgonyOtlet[] = [];
  for (const [nap, l] of [...napra.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const max = nap < s ? HORGONY_MAX_ELOTTE : HORGONY_MAX_ALATT;
    for (const o of l.sort((a, b) => RANG[a.fajta] - RANG[b.fajta]).slice(0, max)) vegso.push({ ...o, kulcs: horgonyKulcs(o) });
  }
  return vegso;
}

/** Az esedékes ötletek (ma … ma + 2), amelyekből még nem lett poszt — nap, aztán fontosság szerint; legfeljebb `max`. */
export function esedekesOtletek(lista: readonly HorgonyOtlet[], ma: Nap, letezo: ReadonlySet<string>, max: number): HorgonyOtlet[] {
  return lista
    .filter((o) => !letezo.has(o.kulcs) && napokKozott(ma, o.nap) >= 0 && napokKozott(ma, o.nap) < HORGONY_ELORE_NAPOK)
    .sort((a, b) => a.nap.localeCompare(b.nap) || RANG[a.fajta] - RANG[b.fajta])
    .slice(0, max);
}

/** A Naptár szellem-sorai egy időszakra (ma-tól): a napra eső ötletek, amelyekből még nem lett poszt. Elmúlt napra nincs szellem. */
export function szellemSorok(lista: readonly HorgonyOtlet[], ma: Nap, letezo: ReadonlySet<string>): HorgonyOtlet[] {
  return lista.filter((o) => !letezo.has(o.kulcs) && o.nap >= ma);
}
