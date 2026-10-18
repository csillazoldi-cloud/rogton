// c30 F1 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.2, §2 Part A; docs/decisions/2026-10-17-c30-f1-tipus-kategoria.md):
// the organisation's type (ceg | fesztival) and category — pure rules, no database, no network (probak/c30-f1-tipus.proba.ts).
//  - `kategoriaOf(profil)`: the stored category, else "vendeglatas" when the existing hospitality regex matches name + summary,
//    else "semleges". An org without a stored category behaves exactly as before (the regex was the only signal), with no write.
//  - `tipusOf(profil)`: the stored type, else "ceg" (D13: unsure and unanswered = company).
//  - `tipusJavaslat(ai, nev, osszefoglalo)`: the review-proposal call's guess, normalised; without a usable AI answer, the regex
//    fallbacks (hospitality → vendeglatas, festival words → fesztival) — always with biztos: false, so nothing is copied.
import { KATEGORIAK, POSZT_NYELV_MODOK, SZERVEZET_TIPUSOK, TARTALOMNYELVEK, kategoria, szervezetTipus, type Kategoria, type PosztNyelvMod, type SzervezetTipus } from "@km/contracts";
import { vendeglato } from "./kinalat-szabaly";
import { honapSzam } from "../program/szabaly";

/** Festival / event words in HU, RO and EN (plan §2). It only ever yields an UNSURE guess (biztos: false) — the AI's `biztos` decides
 *  whether the question shows. c30 F6 (coordinator 10-17): tightened so a restaurant's „rendezvények” (events it hosts), „programok”
 *  or „nyitvatartási napok” no longer fire: only festival words, „Zilele …”, a capitalised „…i Napok” (Marosvásárhelyi Napok) or
 *  „Napok 2026”, „városnap(ok)”, and „… Days 2026”. */
const FESZTIVAL = /(fesztivál|fesztival|festival|\bzilele\b|városnap|varosnap|\bnapok\s+20\d\d|\bdays\s+20\d\d)/iu;
const NAGY_NAPOK = /\p{Lu}\p{L}*i\s+Napok(?![\p{L}])/u; // „Marosvásárhelyi Napok” — case-sensitive: „nyitvatartási napok” stays out
export function fesztivalSzoveg(szoveg: string): boolean {
  return FESZTIVAL.test(szoveg) || NAGY_NAPOK.test(szoveg);
}

export type Lepes = "kinalat" | "lista" | "arak" | "rendezveny" | "program" | "nyelvmod" | "oldal" | "temak";
/**
 * c30 F6 (plan §2 Part B): the steps of „Első beállítás” Part B. A company: today's steps (kínálat, lista, árak only with a list),
 * the language step only with 2+ languages — a one-language company sees exactly today's five. A festival: „Mikor és hol lesz?”,
 * „Ez a programod?” instead of kínálat / lista / árak, then the same nyelvmod (2+ languages), oldal, témák.
 */
export function lepesekFor(tipus: SzervezetTipus, vanLista: boolean, nyelvekSzama: number): Lepes[] {
  const ketNyelv: Lepes[] = nyelvekSzama >= 2 ? ["nyelvmod"] : [];
  if (tipus === "fesztival") return ["rendezveny", "program", ...ketNyelv, "oldal", "temak"];
  return ["kinalat", "lista", ...(vanLista ? (["arak"] as Lepes[]) : []), ...ketNyelv, "oldal", "temak"];
}

export type RendezvenyJavaslat = { mettol?: string; meddig?: string; hely?: Record<string, string> };
const iso = (e: number, h: number, n: number) => {
  const d = new Date(Date.UTC(e, h - 1, n));
  return d.getUTCFullYear() === e && d.getUTCMonth() === h - 1 && d.getUTCDate() === n ? `${e}-${String(h).padStart(2, "0")}-${String(n).padStart(2, "0")}` : null;
};
/**
 * c30 F6 (rajz D2, AI off / unsure): the event's date range read from the text — „június 25–28.”, „2026. június 25. és 28. között”,
 * „25–28 iunie 2026”, „Între 25 și 28 iunie”, „June 25–28”. Without a year, `ev`. Nothing found → {} (never a guess).
 */
export function datumTartomany(szoveg: string, ev: number): { mettol?: string; meddig?: string } {
  const s = szoveg.replace(/\s+/g, " ");
  const kot = String.raw`\s*(?:[-–—]|és|és a|si|și|to|and|-tól|-től|-ig)\s*`;
  const a = s.match(new RegExp(String.raw`(\d{1,2})\.?${kot}(\d{1,2})\.?\s+([\p{L}]+)\.?(?:\s+(\d{4}))?`, "iu"));
  if (a) {
    const h = honapSzam(a[3]!);
    if (h) {
      const e = a[4] ? +a[4] : ev, m = iso(e, h, +a[1]!), v = iso(e, h, +a[2]!);
      if (m && v && m <= v) return { mettol: m, meddig: v };
    }
  }
  const b = s.match(new RegExp(String.raw`(?:(\d{4})\.?\s+)?([\p{L}]+)\.?\s+(\d{1,2})\.?${kot}(\d{1,2})`, "iu"));
  if (b) {
    const h = honapSzam(b[2]!);
    if (h) {
      const e = b[1] ? +b[1] : ev, m = iso(e, h, +b[3]!), v = iso(e, h, +b[4]!);
      if (m && v && m <= v) return { mettol: m, meddig: v };
    }
  }
  return {};
}

/** The AI's `rendezveny` answer, normalised (valid ISO dates, mettol ≤ meddig, town per content language), else the text's date range. */
export function rendezvenyJavaslat(ai: unknown, szoveg: string, ev: number): RendezvenyJavaslat {
  const o = ai && typeof ai === "object" && !Array.isArray(ai) ? (ai as Record<string, unknown>) : {};
  const datum = (x: unknown) => (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && iso(+x.slice(0, 4), +x.slice(5, 7), +x.slice(8, 10)) ? x : undefined);
  let mettol = datum(o["mettol"]), meddig = datum(o["meddig"]);
  // a present but impossible date (2026-06-31) or a backwards range makes the AI's whole date answer unusable → the text's range
  const rossz = (x: unknown, d: string | undefined) => typeof x === "string" && x.trim() !== "" && !d;
  if (rossz(o["mettol"], mettol) || rossz(o["meddig"], meddig) || (mettol && meddig && mettol > meddig)) { mettol = undefined; meddig = undefined; }
  if (!mettol && !meddig) ({ mettol, meddig } = datumTartomany(szoveg, ev));
  const hely: Record<string, string> = {};
  if (o["hely"] && typeof o["hely"] === "object" && !Array.isArray(o["hely"])) {
    for (const [k, v] of Object.entries(o["hely"] as Record<string, unknown>)) {
      if ((TARTALOMNYELVEK as readonly string[]).includes(k) && typeof v === "string" && v.trim()) hely[k] = v.trim().slice(0, 120);
    }
  }
  return { ...(mettol ? { mettol } : {}), ...(meddig ? { meddig } : {}), ...(Object.keys(hely).length ? { hely } : {}) };
}

type HelyNyelvenkent = Partial<Record<string, string>>;
export type HelyTerv = { hely: HelyNyelvenkent; gep: HelyNyelvenkent; forditani?: { szoveg: string; cel: string } };

/** c30 F6 (Csilla 10-17, same rule as posts): the event's town per language when the person saves D2.
 *  The second-language town is the MACHINE's while it is empty or equals what the machine last wrote (`hely_gep`, at first the proposal).
 *  If the first-language town changed and the second one is still the machine's, it is cleared and handed back for re-translation;
 *  a second-language town the person wrote is never overwritten. Without a second language nothing else happens. */
export function helyTerv(be: HelyNyelvenkent, tarolt: { hely?: HelyNyelvenkent | undefined; hely_gep?: HelyNyelvenkent | undefined } | undefined, javaslat: { hely?: HelyNyelvenkent | undefined } | undefined, elso: string, masodik: string | null): HelyTerv {
  const tiszta = (o: HelyNyelvenkent | undefined) => Object.fromEntries(Object.entries(o ?? {}).filter(([, v]) => typeof v === "string" && v.trim()).map(([k, v]) => [k, (v as string).trim()])) as HelyNyelvenkent;
  const regi = tiszta(tarolt?.hely ?? javaslat?.hely);
  const gep = tiszta(tarolt?.hely_gep ?? javaslat?.hely);
  const hely = tiszta(be);
  if (!masodik || masodik === elso) return { hely, gep };
  const masik = hely[masodik] ?? regi[masodik] ?? "";
  const gepe = !masik || masik === (gep[masodik] ?? "");
  const elsoValtozott = (hely[elso] ?? "") !== (regi[elso] ?? "");
  if (elsoValtozott && gepe) {
    delete hely[masodik]; delete gep[masodik];
    return hely[elso] ? { hely, gep, forditani: { szoveg: hely[elso] as string, cel: masodik } } : { hely, gep };
  }
  if (masik) hely[masodik] = masik;
  return { hely, gep };
}

type Profilszeru = { nev?: string; osszefoglalo?: string; kategoria?: unknown; szervezet_tipus?: unknown };

/** The category used by every rule (list title, fallback topics). Stored value first; the regex only when nothing is stored. */
export function kategoriaOf(p: Profilszeru): Kategoria {
  const t = kategoria(p.kategoria);
  if (t !== "semleges") return t;
  return vendeglato(`${p.nev ?? ""} ${p.osszefoglalo ?? ""}`) ? "vendeglatas" : "semleges";
}

export function tipusOf(p: Profilszeru): SzervezetTipus {
  return szervezetTipus(p.szervezet_tipus);
}

export type TipusJavaslat = { szervezet_tipus: SzervezetTipus; kategoria: Kategoria; biztos: boolean };

/**
 * The machine's guess from the javaslatok answer. `biztos` is true only when the AI gave a known type, said it is sure, and (for a
 * company) gave a known category. Anything unusable → the regex fallback with biztos: false.
 */
export function tipusJavaslat(ai: unknown, nev: string, osszefoglalo: string): TipusJavaslat {
  const o = ai && typeof ai === "object" && !Array.isArray(ai) ? (ai as Record<string, unknown>) : {};
  const nyersTipus = typeof o["szervezet_tipus"] === "string" ? o["szervezet_tipus"].trim() : "";
  const nyersKat = typeof o["kategoria"] === "string" ? o["kategoria"].trim() : "";
  const ismertTipus = (SZERVEZET_TIPUSOK as readonly string[]).includes(nyersTipus);
  const ismertKat = (KATEGORIAK as readonly string[]).includes(nyersKat) || nyersKat === "semleges";
  const szoveg = `${nev} ${osszefoglalo}`;
  const regexKat: Kategoria = vendeglato(szoveg) ? "vendeglatas" : "semleges";
  if (!ismertTipus) {
    return { szervezet_tipus: fesztivalSzoveg(szoveg) ? "fesztival" : "ceg", kategoria: regexKat, biztos: false };
  }
  const tipus = szervezetTipus(nyersTipus);
  if (tipus === "fesztival") return { szervezet_tipus: tipus, kategoria: ismertKat ? kategoria(nyersKat) : "semleges", biztos: o["biztos"] === true };
  return { szervezet_tipus: tipus, kategoria: ismertKat ? kategoria(nyersKat) : regexKat, biztos: o["biztos"] === true && ismertKat };
}

/**
 * c30 F3 (D6, rajz D5): the language mode pre-selected in the setup step „Hogyan posztoljunk két nyelven?" — the stored mode if the person
 * already chose one, otherwise festival → "egyben" (both languages in one post), company → "kulon" (separate posts = today's behaviour).
 */
export function elsoNyelvMod(p: Profilszeru & { poszt_nyelv_mod?: unknown }): PosztNyelvMod {
  const t = typeof p.poszt_nyelv_mod === "string" ? p.poszt_nyelv_mod.trim() : "";
  if ((POSZT_NYELV_MODOK as readonly string[]).includes(t)) return t as PosztNyelvMod;
  return tipusOf(p) === "fesztival" ? "egyben" : "kulon";
}

// c30 F6b (élő 10-17: a Part A a felület nyelvét, angolt jelölte be, pedig a leírás „magyarul és románul” mondta): a leírásban
// KIMONDOTT nyelvek, előfordulási sorrendben. Csak nyelvi alak számít („magyarul”, „în limba română”, „in English”) — a „Magyar
// Színház” vagy a „Román–magyar barátság” nem. Ha a szöveg nem nevez meg nyelvet: üres, és a gép javaslata dönt.
const NYELV_ALAKOK: [string, RegExp][] = [
  ["hu", /(?<![\p{L}])(magyarul|magyar nyelv\p{L}*|(?:în (?:limba )?|și |si )maghiară|(?:in |and )hungarian|auf ungarisch)(?![\p{L}])/iu],
  ["ro", /(?<![\p{L}])(románul|román nyelv\p{L}*|românește|(?:în (?:limba )?|și |si )română|(?:in |and )romanian|auf rumänisch)(?![\p{L}])/iu],
  ["en", /(?<![\p{L}])(angolul|angol nyelv\p{L}*|(?:în (?:limba )?|și |si )engleză|(?:in |and )english|auf englisch)(?![\p{L}])/iu],
  ["de", /(?<![\p{L}])(németül|német nyelv\p{L}*|(?:în (?:limba )?|și |si )germană|(?:in |and )german|auf deutsch)(?![\p{L}])/iu],
];
export function nyelvekSzovegbol(szoveg: string): string[] {
  const talalt = NYELV_ALAKOK.map(([k, re]) => [k, re.exec(szoveg)?.index ?? -1] as const).filter(([, i]) => i >= 0);
  return talalt.sort((a, b) => a[1] - b[1]).map(([k]) => k);
}
