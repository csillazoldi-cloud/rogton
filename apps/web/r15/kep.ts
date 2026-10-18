import "server-only";
import type { PosztForras } from "@km/contracts";
import { fajlLista, fajlMeta, feltolt, hasznaltLogok, type FajlMeta, type HostKontextus } from "@km/fajl-core";
import { fajlKornyezet } from "../fajl";
import { posztTar } from "../poszt/tar";
import { elsoNyelv } from "./index";
import type { R15Ceg, R15Kep } from "./tipusok";

// R-15 · 08c — kép a poszthoz (design/R15/gepezet.md 17–22). A képek a meglévő fájltárban élnek, "kep" céllal
// (a bájtok a FAJL_MAPPA alatt, a sor az arculat_fajl táblában); a poszt a forrásában tartja a kép azonosítóját.
// Egy poszthoz egy kép; egy kép több poszthoz is mehet; „Kép nélkül” csak a kapcsolatot bontja, a kép megmarad.

export class KepHiba extends Error {
  constructor(public readonly kod: "NINCS_JOG" | "NINCS_ILYEN_FAJL" | "NINCS_ILYEN_POSZT" | "TIPUS_NEM_ENGEDETT" | "TUL_NAGY" | "URES" | "ERVENYTELEN_ADAT" | "SVG_NEM_ENGEDETT") {
    super(kod);
    this.name = "KepHiba";
  }
}

function kepbol(m: FajlMeta): R15Kep {
  return { id: m.id, nev: m.nev.replace(/\.(png|jpe?g|webp)$/i, ""), url: `/api/arculat/fajl/${m.id}`, feltoltve: m.feltoltve };
}

/** gepezet 17, 20, 21 — kép feltöltése (saját fotó, vagy a Képek lapon készült kép); ha poszt is jön, rögtön hozzá is kerül. */
export async function kepFeltolt(ktx: HostKontextus, be: { nev: string; bajtok: Uint8Array; posztId?: string; beallitas?: PosztForras["kep_beallitas"] }): Promise<R15Kep> {
  const e = await feltolt(fajlKornyezet(), ktx, { nev: be.nev, cel: "kep", bajtok: be.bajtok });
  if (!e.ok) throw new KepHiba(e.hiba === "NINCS_ILYEN_FAJL" ? "ERVENYTELEN_ADAT" : e.hiba);
  if (e.ertek.tipus === "pdf") throw new KepHiba("TIPUS_NEM_ENGEDETT");
  if (be.posztId) await posztKepAllit(ktx, be.posztId, e.ertek.id, be.beallitas);
  return kepbol(e.ertek);
}

/** gepezet 18 — „Kész képeim”: a szervezet képei, a legújabb elöl. */
export async function keszKepeim(ktx: HostKontextus): Promise<R15Kep[]> {
  const e = await fajlLista(fajlKornyezet(), ktx, "kep");
  if (!e.ok) return [];
  return [...e.ertek].sort((a, b) => b.feltoltve.localeCompare(a.feltoltve)).map(kepbol);
}

/** Egy kép adata (a poszt nézetéhez); null, ha nincs ilyen vagy nem kép. */
export async function kepAdat(ktx: HostKontextus, id: string): Promise<R15Kep | null> {
  if (!id) return null;
  const e = await fajlMeta(fajlKornyezet(), ktx, id).catch(() => null);
  return e && e.ok && e.ertek.cel === "kep" ? kepbol(e.ertek) : null;
}

/** gepezet 19 — a poszt képe: csere, vagy (null) a kapcsolat bontása. A poszt állapota NEM változik (kerdesek 18: a kész poszt kész marad). */
export async function posztKepAllit(ktx: HostKontextus, posztId: string, kepId: string | null, beallitas?: PosztForras["kep_beallitas"]): Promise<void> {
  const munka = await posztTar.betolt(ktx.szervezet_id, posztId).catch(() => null);
  if (!munka) throw new KepHiba("NINCS_ILYEN_POSZT");
  if (kepId) {
    const kep = await kepAdat(ktx, kepId);
    if (!kep) throw new KepHiba("NINCS_ILYEN_FAJL");
  }
  munka.forras.kep_fajl_id = kepId ?? "";
  // R-18 8. kör: a szerkesztő beállításai a képpel együtt (új kép a szerkesztőből: felülírja; más kép vagy kép nélkül: törlődik)
  if (beallitas) munka.forras.kep_beallitas = beallitas;
  else delete munka.forras.kep_beallitas;
  await posztTar.ment(ktx.szervezet_id, munka);
}

/** gepezet 21 — „Új poszt ehhez a képhez”: saját poszt a kép szövegéből, a képpel; a szöveget a 08 lap íratja meg („Írjuk a posztot…”). */
export async function kepbolPoszt(ktx: HostKontextus, kepId: string, szoveg: string): Promise<string> {
  const kep = await kepAdat(ktx, kepId);
  if (!kep) throw new KepHiba("NINCS_ILYEN_FAJL");
  const tiszta = szoveg.replace(/\s+/g, " ").trim().slice(0, 4000);
  const cim = (tiszta || kep.nev).slice(0, 120);
  const munka = await posztTar.letrehoz(ktx.szervezet_id, ktx.fiok_id, cim, {
    tipus: "sajat", azonosito: "", cim, url: "", szoveg: tiszta || kep.nev, rovid_nev: "", rovid_cim: "", otlet: "", kep_fajl_id: kep.id,
  });
  const nyelv = await elsoNyelv(ktx.szervezet_id);
  munka.szovegek = [{ felulet: "fb", nyelv, szoveg: "", javaslat: "", hashtagek: [], allapot: "nincs", veglegesitve: null, nyelvre_szabva: false, elavult_forditas: false }];
  await posztTar.ment(ktx.szervezet_id, munka);
  return munka.id;
}

/** gepezet 13 — a cég az előnézetben: név, kezdőbetűk (ha nincs logó), a legújabb logó, és egy Instagram-szerű név. */
export async function cegAdat(ktx: HostKontextus, nev: string): Promise<R15Ceg> {
  // Kati 10-11 („a profilkép az előnézetben nem működik”): eddig a legutóbb feltöltött NEM-pdf logó-fájl ment — ami lehetett a böngészőben
  // nem megjeleníthető fájl is. Most az arculat helyei közül a képre alkalmas fájl (hasznaltLogok): elöl a négyzetes (a profilkép helye),
  // aztán a világos, az egyszínű, a sötét. A lap a betöltési hibánál is a kezdőbetűkre vált (R15Elonezet Kor).
  const logok = await fajlLista(fajlKornyezet(), ktx, "logo").catch(() => null);
  const helyek = hasznaltLogok(logok && logok.ok ? logok.ertek : [], null);
  const logoId = helyek.negyzetes ?? helyek.vilagos ?? helyek.egyszinu ?? helyek.sotet ?? null;
  const logo = logoId ? { id: logoId } : undefined;
  const szavak = nev.split(/\s+/).filter((s) => /\p{L}/u.test(s));
  const kezdobetuk = (szavak.length >= 2 ? (szavak[0]![0] ?? "") + (szavak[1]![0] ?? "") : (szavak[0] ?? "?").slice(0, 2)).toUpperCase();
  const felhasznalo = nev.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return { nev, kezdobetuk, logo_url: logo ? `/api/arculat/fajl/${logo.id}` : null, felhasznalo: felhasznalo || "ceg" };
}
