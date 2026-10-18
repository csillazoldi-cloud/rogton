import type { ProgramTetel } from "@rogton/contracts";

// c30 F5 (terv §3): a program SZELETE a poszt-promptokhoz — soha nem az egész program. A horgony egy tétel (`id`): csak az a tétel;
// vagy egy nap (`nap`): az aznapi aktív tételek, legfeljebb 25 sor. Tiszta függvény; az F7 köti be (poszt/profil-blokk.ts).
// A bizonytalan tétel jelölve megy („bizonytalan — ne állíts róla időt”), a nem aktív (pl. belső feljegyzés) soha.

export const BLOKK_MAX_SOR = 25;

function sor(t: ProgramTetel, nyelv: string): string {
  const nev = t.nev[nyelv as keyof typeof t.nev] || t.nev.hu || t.nev.ro || Object.values(t.nev).find(Boolean) || "";
  const hely = t.helyszin[nyelv as keyof typeof t.helyszin] || Object.values(t.helyszin).find(Boolean) || "";
  const ido = t.kezdes ? (t.vege ? `${t.kezdes}–${t.vege}` : t.kezdes) : "egész nap";
  return [t.nap ?? "a rendezvény egészén", ido, nev, hely, t.fellepo && t.fellepo !== nev ? `fellép: ${t.fellepo}` : "", t.bizonytalan ? "bizonytalan — ne állíts róla időt" : ""]
    .filter(Boolean).join(" · ");
}

export function programBlokk(tetelek: readonly ProgramTetel[], horgony: { id?: string; nap?: string }, nyelv: string): string[] {
  const aktiv = tetelek.filter((t) => t.aktiv);
  if (horgony.id) {
    const t = aktiv.find((x) => x.id === horgony.id);
    return t ? [sor(t, nyelv)] : [];
  }
  if (horgony.nap) {
    return aktiv.filter((t) => t.nap === horgony.nap)
      .sort((a, b) => (a.kezdes ?? "").localeCompare(b.kezdes ?? ""))
      .slice(0, BLOKK_MAX_SOR).map((t) => sor(t, nyelv));
  }
  return [];
}

// ---------------------------------------------------------------------------------------------------------------------------------
// c30 F7 (terv §3): a szelet kiválasztása egy poszthoz, a program összegzése a tématervhez, és a program névpárjai a hivatalos nevekhez.
// Mind tiszta függvény (probak/c30-f7-fesztival-poszt.proba.ts).

/** A poszt horgonya a programban. `program:<fajta>:<nap>[:<tétel-id>]` (a forrás azonosítója — az F8 így nyitja a posztot) → az a tétel
 *  vagy az a nap; különben azok a tételek, amelyeknek a neve (bármely nyelven, ≥ 5 betű) szerepel a poszt kiváltójában; különben nincs. */
export function programHorgony(azonosito: string, kivalto: string, tetelek: readonly ProgramTetel[]): { id?: string; nap?: string; idk?: string[] } {
  const m = /^program:[a-z_]+:(\d{4}-\d{2}-\d{2})(?::([0-9a-f-]{36}))?$/.exec(azonosito.trim());
  if (m) return m[2] ? { id: m[2] } : { nap: m[1]! };
  const k = kivalto.toLocaleLowerCase("hu");
  if (!k.trim()) return {};
  const idk = tetelek.filter((t) => t.aktiv && Object.values(t.nev).some((n) => typeof n === "string" && n.trim().length >= 5 && k.includes(n.trim().toLocaleLowerCase("hu")))).map((t) => t.id);
  return idk.length ? { idk: idk.slice(0, BLOKK_MAX_SOR) } : {};
}

/** A szelet TÉTELEI a horgonyhoz: egy tétel, egy nap (≤ 25), vagy a kiváltóban megnevezett tételek (≤ 25); a nem aktív soha. */
export function szeletTetelei(tetelek: readonly ProgramTetel[], horgony: { id?: string; nap?: string; idk?: string[] }): ProgramTetel[] {
  const aktiv = tetelek.filter((t) => t.aktiv);
  const rend = (l: ProgramTetel[]) => l.sort((a, b) => `${a.nap ?? ""}${a.kezdes ?? ""}`.localeCompare(`${b.nap ?? ""}${b.kezdes ?? ""}`)).slice(0, BLOKK_MAX_SOR);
  if (horgony.id) return aktiv.filter((t) => t.id === horgony.id).slice(0, 1);
  if (horgony.nap) return rend(aktiv.filter((t) => t.nap === horgony.nap));
  if (horgony.idk?.length) { const be = new Set(horgony.idk); return rend(aktiv.filter((t) => be.has(t.id))); }
  return [];
}

/** A szelet sorai a horgonyhoz (a `programBlokk` sorformája; a több tételes horgonyt is ismeri). */
export function programSzelet(tetelek: readonly ProgramTetel[], horgony: { id?: string; nap?: string; idk?: string[] }, nyelv: string): string[] {
  return szeletTetelei(tetelek, horgony).map((t) => sor(t, nyelv));
}

const FAJTA_NEV: Record<string, string> = { koncert: "koncert", eloadas: "előadás", gyerek: "gyerekprogram", jatek: "játék", workshop: "workshop", kiallitas: "kiállítás", gasztro: "gasztro", vasar: "vásár", unnepseg: "ünnepség", egyeb: "egyéb" };
const FOSZINPAD = /(nagyszínpad|főszínpad|scena principal|main stage)/iu;

/** A kiemelt fellépők (c30 F7 összegzés, F8 horgonyok): a fő színpad esti (20:00-tól) koncertjei, nap és idő szerint. A fő színpad a
 *  nevéből („Nagyszínpad”, „Scena Principală”, „Main stage”); ha egyik sem az, ahol a legtöbb esti koncert van. Csak aktív tétel. */
export function kiemeltTetelek(tetelek: readonly ProgramTetel[]): ProgramTetel[] {
  const esti = tetelek.filter((t) => t.aktiv && t.fajta === "koncert" && (t.kezdes ?? "") >= "20:00");
  const hely = (t: ProgramTetel) => Object.values(t.helyszin).join(" ");
  let fo = esti.filter((t) => FOSZINPAD.test(hely(t)));
  if (fo.length === 0 && esti.length) {
    const hDb = new Map<string, number>();
    for (const t of esti) hDb.set(hely(t), (hDb.get(hely(t)) ?? 0) + 1);
    const legtobb = [...hDb.entries()].sort((a, b) => b[1] - a[1])[0]![0];
    fo = esti.filter((t) => hely(t) === legtobb);
  }
  return fo.sort((a, b) => `${a.nap ?? ""}${a.kezdes ?? ""}`.localeCompare(`${b.nap ?? ""}${b.kezdes ?? ""}`));
}

/** A tématerv bemenetéhez: hány tétel, hány nap, fajtánként hány, és a kiemelt fellépők (a fő színpad esti koncertjei, legfeljebb 8). */
export function programOsszegzes(tetelek: readonly ProgramTetel[], nyelv: string): string[] {
  const aktiv = tetelek.filter((t) => t.aktiv);
  if (aktiv.length === 0) return [];
  const napok = new Set(aktiv.map((t) => t.nap).filter(Boolean)).size;
  const db = new Map<string, number>();
  for (const t of aktiv) db.set(t.fajta, (db.get(t.fajta) ?? 0) + 1);
  const fajtak = [...db.entries()].sort((a, b) => b[1] - a[1]).map(([f, n]) => `${FAJTA_NEV[f] ?? f} ${n}`).join(", ");
  const nev = (t: ProgramTetel) => t.fellepo.trim() || t.nev[nyelv as keyof typeof t.nev] || t.nev.hu || t.nev.ro || Object.values(t.nev).find(Boolean) || "";
  const kiemelt = [...new Set(kiemeltTetelek(aktiv).map((t) => `${nev(t)} (${t.nap ?? "?"} ${t.kezdes ?? ""})`))].slice(0, 8);
  return [`A program: ${aktiv.length} tétel, ${napok} nap — ${fajtak}.`, ...(kiemelt.length ? [`Kiemelt fellépők: ${kiemelt.join("; ")}.`] : [])];
}

type Nevpar = { hu: string; ro: string; en: string };
/** A program két (vagy több) nyelvű nevei és helyszínei névpárként — a posztíráskor a hivatalos nevekhez fűzzük (a profilba NEM írjuk).
 *  Csak aktív tétel; mindkét alak legalább 4 betű, és különböznek; ismétlés nélkül. */
export function programNevek(tetelek: readonly ProgramTetel[]): Nevpar[] {
  const ki: Nevpar[] = [], lat = new Set<string>();
  const tesz = (m: ProgramTetel["nev"]) => {
    const p = { hu: (m.hu ?? "").trim(), ro: (m.ro ?? "").trim(), en: (m.en ?? "").trim() };
    const alakok = [p.hu, p.ro, p.en].filter(Boolean);
    if (alakok.length < 2 || alakok.some((a) => a.length < 4) || new Set(alakok.map((a) => a.toLocaleLowerCase("hu"))).size < 2) return;
    const kulcs = alakok.join("|").toLocaleLowerCase("hu");
    if (lat.has(kulcs)) return;
    lat.add(kulcs); ki.push(p);
  };
  for (const t of tetelek) { if (!t.aktiv) continue; tesz(t.nev); tesz(t.helyszin); }
  return ki;
}
