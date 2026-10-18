import "server-only";
// R-16 K5 (TERV §2-K5, 1.2, 1.5, gepezet 7–8, kerdesek 4) — a 12e „Betűk” adata és lépése.
//  - `betuValasztek`: a képgyártó öt betűje (a hangulatszóval és a névvel), a munkatér saját betűi (név + a munkatér nyelveire szűrt
//    hiányzó ékezetek), és hogy most melyik a cím és a szöveg betűje — ugyanaz a forrás, amiből a képek készülnek (jóváhagyott
//    pillanatkép, különben a tervezet, különben az alapszett: allapot.ts `arculatNezet`), és ugyanaz a „cím || szöveg” tartalék,
//    mint a vizual/helyzet.ts `kepArculat`-jáé, hogy a ✓ azon álljon, amivel a kép tényleg készül.
//  - `betukJovahagy`: „Ez legyen” = a két betű mentése ÉS jóváhagyása egy lépésben (kerdesek 4), a lepes.ts szabályával (meglévő
//    pillanatkép soha nem íródik felül: a `jovahagyTenyleges` a módosított tervezetet a következő szabad verzióra hagyja jóvá).
// A profilt a `profil/tar`-ból, a fájlokat a `fajl/tar`-ból olvassuk (TERV §3: `vizual/*`-ot és a `profil` bejáratát nem importáljuk).
import type { ArculatLepes, ArculatLogok, ArculatTervezet } from "@rogton/contracts";
import type { FajlMeta } from "@rogton/fajl-core";
import { arculatModosit } from "@rogton/profile-core";
import { BEEPITETT, BetuElemzes, beepitettKulcs, betuKulcs, hianyzoNyelvre, sajatBetuId, sajatKulcs } from "@rogton/arculat-core";
import { profilTar } from "../profil/tar";
import { fajlTar } from "../fajl/tar";
import { arculatNezet, jovahagyottKep, type SzakaszAdat, type Szerep } from "./allapot";
import { alapTervezet } from "./alap";
import { jovahagyTenyleges } from "./lepes";
import { betuVizsgal } from "./betu";

export type SajatBetuSor = { id: string; kulcs: string; nev: string; hianyzo: string[] };
export type BetuValasztek = {
  beepitett: { kulcs: string; szo: string; nev: string }[];
  /** a munkatér saját betűi, a legújabb elöl */
  sajat: SajatBetuSor[];
  cim: string;
  szoveg: string;
  /** a „Így néz ki” színei, ha az arculat nincs jóváhagyva (a kép azt mutassa, amit a gomb jóváhagy — allapot.ts `elonezet`) */
  elonezet: SzakaszAdat["elonezet"];
};

/** A tárolt érték (kulcs, régi CSS-szöveg vagy "sajat:<id>") → a lap kulcsa: a saját betű csak akkor, ha a fájl megvan. */
export function betuKulcsNormal(ertek: string, sajatIdk: ReadonlySet<string>): string {
  const id = sajatBetuId(ertek);
  if (id) return sajatIdk.has(id) ? sajatKulcs(id) : "public-sans";
  return betuKulcs(ertek);
}

/** A tervezet/pillanatkép két betűje a képek tartalékával (üres mező: a másik, végül a Public Sans). */
export function ketBetu(t: Pick<ArculatTervezet, "betu_cim" | "betu_szoveg">, sajatIdk: ReadonlySet<string>): { cim: string; szoveg: string } {
  const cim = t.betu_cim || t.betu_szoveg || "public-sans";
  const szoveg = t.betu_szoveg || t.betu_cim || "public-sans";
  return { cim: betuKulcsNormal(cim, sajatIdk), szoveg: betuKulcsNormal(szoveg, sajatIdk) };
}

/** Egy saját betű sora: a tárolt vizsgálatból; ha az nincs vagy olvashatatlan (pl. kézzel bekerült fájl), a bájtokból újra (nem tároljuk). */
async function sajatSor(szervezetId: string, f: FajlMeta, nyelvek: readonly string[]): Promise<SajatBetuSor | null> {
  let e = BetuElemzes.safeParse(f.elemzes).data ?? null;
  if (!e) {
    const b = await fajlTar.olvas(szervezetId, f.id).catch(() => null);
    e = b ? betuVizsgal(b, f.nev) : null;
  }
  if (!e) return null; // nem nyitható meg betűként: nem kínáljuk fel
  return { id: f.id, kulcs: sajatKulcs(f.id), nev: e.nev, hianyzo: hianyzoNyelvre(e, nyelvek) };
}

/** A 12e adata a munkatérhez; null, ha még nincs jóváhagyott profil (akkor az onboarding jön, mint a /fiok-on). */
export async function betuValasztek(szervezetId: string, szerep: Szerep): Promise<BetuValasztek | null> {
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return null;
  const fajlok = await fajlTar.lista(szervezetId).catch(() => null);
  const betuFajlok = (fajlok ?? []).filter((f) => f.cel === "betu").sort((a, b) => (a.feltoltve < b.feltoltve ? 1 : a.feltoltve > b.feltoltve ? -1 : a.id < b.id ? 1 : -1));
  const sajat = (await Promise.all(betuFajlok.map((f) => sajatSor(szervezetId, f, profil.nyelvek)))).filter((x): x is SajatBetuSor => x !== null);
  const nezet = arculatNezet({ profil, fajlok, szerep, jovahagyoNev: "" });
  const forras = forrasTervezet(profil.arculat, profil.nev, profil.osszefoglalo, profil.nyelvek);
  const { cim, szoveg } = ketBetu(forras, new Set(sajat.map((s) => s.id)));
  return { beepitett: BEEPITETT.map((b) => ({ ...b })), sajat, cim, szoveg, elonezet: nezet.elonezet };
}

/** Amiből a képek készülnek: a jóváhagyott pillanatkép, különben a tervezet, különben az alapszett (allapot.ts ugyanígy dönt). */
function forrasTervezet(a: ArculatLepes, nev: string, osszefoglalo: string, nyelvek: readonly string[]): Pick<ArculatTervezet, "betu_cim" | "betu_szoveg"> {
  const jov = jovahagyottKep(a);
  if (jov) return jov;
  if (a.tervezet?.elsodleges) return a.tervezet;
  return alapTervezet(nev, osszefoglalo, nyelvek[0] ?? "hu");
}

/** A POST törzsének egy kulcsa érvényes-e: beépített kulcs, vagy a munkatér egyik `betu` fájljának "sajat:<id>"-je. */
export function kulcsErvenyes(kulcs: string, sajatIdk: ReadonlySet<string>): boolean {
  if (beepitettKulcs(kulcs)) return true;
  const id = sajatBetuId(kulcs);
  return id !== null && kulcs === sajatKulcs(id) && sajatIdk.has(id);
}

/** „Ez legyen” (12e): a küldött betű(k) mentése és jóváhagyása egy lépésben. Tervezet nélkül az alapszettre épül. */
export function betukJovahagy(a: ArculatLepes, be: { cim?: string | undefined; szoveg?: string | undefined }, alap: ArculatTervezet, most: Date, logok: ArculatLogok | undefined): ArculatLepes {
  const resz: Partial<ArculatTervezet> = {};
  if (be.cim !== undefined) resz.betu_cim = be.cim;
  if (be.szoveg !== undefined) resz.betu_szoveg = be.szoveg;
  const alapos: ArculatLepes = a.tervezet ? a : { ...a, tervezet: alap };
  // az `arculatModosit` a jóváhagyott állapotból új verziót nyit (tervezet állapot) — ezt a `jovahagyTenyleges` hagyja jóvá, a
  // pillanatképeket nem írva felül (lepes.ts `jovahagyVedett`)
  return jovahagyTenyleges(arculatModosit(alapos, resz), alap, most, logok);
}
