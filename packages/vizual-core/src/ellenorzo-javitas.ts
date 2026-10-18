// Kézzel írt ellenőrzők azokra a fajtákra, ahol az ügynökök első változata a próbaképeken téves ítéletet adott
// (VZ-3, mérve 2026-09-23 a három mintalapon). Ezek felülírják az ügynöki változatot.
import type { Ellenorzo, EllenorzoKontextus, Szabaly, Talalat } from "./ellenorzo.ts";
import { erintettElemek, feloldas, hossz, kontraszt } from "./ellenorzo.ts";
import type { ElemMeres } from "./meres.ts";

const talalat = (sz: Szabaly, mezo: string | undefined, reszlet: string): Talalat => {
  const t: Talalat = { szabaly: sz.id, szigorusag: sz.szigorusag, uzenet: sz.uzenet, reszlet };
  if (mezo !== undefined) t.mezo = mezo;
  return t;
};
const hianyzo = (sz: Szabaly, nev: string): Talalat => ({
  szabaly: sz.id,
  szigorusag: "figyelmeztetes",
  uzenet: `hiányzó márkaparaméter: ${nev}`,
});

/** Szám-e (a paraméter feloldása után). */
function szam(v: unknown, k: EllenorzoKontextus): number | null {
  const f = feloldas(v, k);
  if (typeof f === "number") return f;
  const h = hossz(f, k.meres);
  return h;
}

/**
 * Illeszkedik-e egy korlát-kulcs („data.headline”, „statement.headline”, „wide169.headline”,
 * „chartLabel|carouselLabel”, „source”) az elemre ennél a formátumnál és családnál.
 */
function kulcsIllik(kulcs: string, e: ElemMeres, k: EllenorzoKontextus): boolean {
  return kulcs.split("|").some((resz) => {
    const [elo, utotag] = resz.includes(".") ? (resz.split(".", 2) as [string, string]) : [null, resz];
    if (utotag !== e.tipus) return false;
    if (elo === null) return true;
    return elo === k.formatum || elo === k.receptCsalad;
  });
}

/** Sötét-e az alap (a modifikátorokhoz: ground=dark). */
const sotet = (hex: string) => kontraszt(hex, "#000000") < 5;

/** Egy mező nyelvenként: kétsoros párnál külön elemek, egysoros párnál a „nyelvi” részek. */
function nyelvenkent(e: ElemMeres): string[] {
  return e.nyelvi.length ? e.nyelvi : e.szoveg ? [e.szoveg] : [];
}

export const max_lines: Ellenorzo = (sz, k) => {
  const ki: Talalat[] = [];
  const onImage = sz.feltetel["onImage"] as { maxLinesPerLanguage?: number } | undefined;
  const limits = sz.feltetel["limits"] as Record<string, unknown> | undefined;
  for (const e of erintettElemek(sz, k.meres)) {
    if (!e.szoveg) continue;
    // egysoros párnál (egy elemben két nyelv) a sorok a két nyelvre együtt számítanak: nyelvenként ennyi jut
    const sorok = e.nyelvi.length > 1 && e.nyelv === "par" ? Math.ceil(e.sorok / e.nyelvi.length) : e.sorok;
    let max: number | null = null;
    if (onImage?.maxLinesPerLanguage !== undefined) max = onImage.maxLinesPerLanguage;
    else if (limits) {
      for (const [kulcs, l] of Object.entries(limits)) {
        if (!kulcsIllik(kulcs, e, k)) continue;
        if (typeof l === "number") max = l;
        else if (l && typeof l === "object") {
          const o = l as Record<string, unknown>;
          const f = o[k.formatum] ?? o["max"] ?? o["maxLines"] ?? o["exact"];
          if (typeof f === "number") {
            max = f;
            const mod = o["modifiers"] as Record<string, string> | undefined;
            if (mod?.["ground=dark"] && sotet(e.hatter)) max += parseInt(mod["ground=dark"], 10) || 0;
          }
        }
      }
    }
    if (max !== null && sorok > max) ki.push(talalat(sz, e.mezo, `${e.nyelv}: ${sorok} sor > ${max} sor`));
  }
  return ki;
};

export const max_chars: Ellenorzo = (sz, k) => {
  const ki: Talalat[] = [];
  const when = sz.feltetel["when"] as { contentType?: string } | undefined;
  if (when?.contentType && when.contentType !== k.receptCsalad) return ki;
  const limits = sz.feltetel["limits"] as Record<string, unknown> | undefined;
  const egyKorlat = sz.feltetel["maxChars"];
  const sorKorlat = sz.feltetel["linesPerLanguage"];
  for (const e of erintettElemek(sz, k.meres)) {
    let max: number | null = null;
    let nev = "";
    if (egyKorlat !== undefined) {
      max = szam(egyKorlat, k);
      nev = String(egyKorlat);
    } else if (limits) {
      for (const [kulcs, l] of Object.entries(limits)) {
        if (!kulcsIllik(kulcs, e, k)) continue;
        const ertek = l && typeof l === "object" ? ((l as Record<string, unknown>)["max"] ?? (l as Record<string, unknown>)["chars"]) : l;
        if (ertek === undefined) continue; // pl. „source: {lines: 2}” — sorkorlát, a max_lines dolga
        max = szam(ertek, k);
        nev = String(ertek);
      }
    }
    if (nev && max === null) {
      ki.push(hianyzo(sz, nev.replace(/^@/, "")));
      continue;
    }
    if (max === null) continue;
    for (const t of nyelvenkent(e)) if (t.length > max) ki.push(talalat(sz, e.mezo, `„${t.slice(0, 40)}…” ${t.length} karakter > ${max}`));
    if (typeof sorKorlat === "number" && e.sorok > sorKorlat) ki.push(talalat(sz, e.mezo, `${e.nyelv}: ${e.sorok} sor > ${sorKorlat}`));
  }
  return ki;
};

/** Dátumnak látszó részek a szövegben (a nem dátumot — időt, járatszámot, százalékot — nem nézzük). */
const DATUMSZERU = /\b\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\b/g;

export const date_format: Ellenorzo = (sz, k) => {
  const ki: Talalat[] = [];
  const formatum = feloldas(sz.feltetel["format"], k);
  if (typeof formatum !== "string") return [hianyzo(sz, String(sz.feltetel["format"]).replace(/^@/, ""))];
  const minta = new RegExp(
    "^" + formatum.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("DD", "\\d{2}").replace("MM", "\\d{2}").replace("YYYY", "\\d{4}") + "$",
  );
  for (const e of erintettElemek(sz, k.meres))
    for (const d of e.szoveg.match(DATUMSZERU) ?? [])
      if (!minta.test(d)) ki.push(talalat(sz, e.mezo, `„${d}” nem ${formatum} alakú`));
  return ki;
};

export const widow: Ellenorzo = (sz, k) => {
  const ki: Talalat[] = [];
  const w = sz.feltetel["widowIf"] as Record<string, unknown> | undefined;
  const d = sz.feltetel["dataFamily"] as Record<string, unknown> | undefined;
  const adat = k.receptCsalad === "data";
  const minKar = szam(w?.["lastLineChars<"], k);
  const minArany = szam(w?.["orLastLineWidthRatio<"], k);
  const adatMax = szam(d?.["orChars<="], k);
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.sorok < 2 || !e.utolso_sor) continue;
    const szavak = e.utolso_sor.split(/\s+/).filter(Boolean);
    if (szavak.length !== 1) continue;
    const hossz1 = e.utolso_sor.length;
    const arva = adat
      ? adatMax !== null && hossz1 <= adatMax
      : (minKar !== null && hossz1 < minKar) || (minArany !== null && e.utolso_sor_arany < minArany);
    if (arva) ki.push(talalat(sz, e.mezo, `${e.nyelv}: az utolsó sor egyetlen rövid szó („${e.utolso_sor}”)`));
  }
  return ki;
};

/** Margó: minden szöveges és arculati elem a margón belül — kivéve a lemezen/sávon állókat. */
function margoEllenor(sz: Szabaly, k: EllenorzoKontextus, kivetelKulcs: string): Talalat[] {
  const ki: Talalat[] = [];
  const m = szam(sz.feltetel["margin"], k);
  if (m === null) return [hianyzo(sz, String(sz.feltetel["margin"]).replace(/^@/, ""))];
  const kivetel = (sz.feltetel[kivetelKulcs] as string[] | undefined) ?? [];
  const W = k.meres.szelesseg;
  const H = k.meres.magassag;
  for (const e of k.meres.elemek) {
    if (e.w === 0 || e.h === 0) continue;
    if (e.lemez && kivetel.includes("plate")) continue;
    if (kivetel.includes(e.tipus)) continue;
    const t = 0.5;
    if (e.x < m - t || e.y < m - t || e.x + e.w > W - m + t || e.y + e.h > H - m + t)
      ki.push(talalat(sz, e.mezo, `${e.nyelv}: x ${Math.round(e.x)}–${Math.round(e.x + e.w)}, y ${Math.round(e.y)}–${Math.round(e.y + e.h)}; a margó ${m} px`));
  }
  return ki;
}
export const grid: Ellenorzo = (sz, k) => margoEllenor(sz, k, "exemptFromMargin");
export const zone_clear: Ellenorzo = (sz, k) => (sz.feltetel["margin"] !== undefined ? margoEllenor(sz, k, "exempt") : []);

/** Kapacitás: sávok, listaelemek száma. A sáv (chart) elemeit egyszer számoljuk. */
export const capacity: Ellenorzo = (sz, k) => {
  const limits = sz.feltetel["limits"] as Record<string, number> | undefined;
  if (!limits) return [];
  const savok = new Set(k.meres.elemek.filter((e) => e.tipus === "chart").map((e) => e.nyelv)).size;
  const ki: Talalat[] = [];
  if (limits["bars"] !== undefined && savok > limits["bars"]) ki.push(talalat(sz, undefined, `${savok} sáv > ${limits["bars"]}`));
  return ki;
};

/** T1: egy mező egy szerep · T2/A1: számot tartalmazó mező technikai szerepben, tabuláris számokkal (hang kivétel). */
export const field_role: Ellenorzo = (sz, k) => {
  const ki: Talalat[] = [];
  const f = sz.feltetel;
  if (f["sameAs"] === "T2" || f["requireRole"]) {
    const req = (f["requireRole"] as string | undefined) ?? "technikai";
    const kivetel = (f["exceptRole"] as string[] | undefined) ?? ["hang"];
    for (const e of erintettElemek(sz, k.meres)) {
      if (!/[0-9]/.test(e.szoveg) || !e.szerep || kivetel.includes(e.szerep)) continue;
      if (e.szerep !== req) ki.push(talalat(sz, e.mezo, `${e.nyelv}: számot tartalmaz, de ${e.szerep} szerepű`));
      else if (!e.tabularis) ki.push(talalat(sz, e.mezo, `${e.nyelv}: nem tabuláris számjegyek`));
    }
    return ki;
  }
  // T1: a mért elem betűje a márka három szerep-betűjének egyike legyen
  for (const e of erintettElemek(sz, k.meres)) if (e.szoveg && e.szerep === null) ki.push(talalat(sz, e.mezo, `${e.nyelv}: a „${e.csalad}” betű egyik szerephez sem tartozik`));
  return ki;
};

export const JAVITOTT_ELLENORZOK: Record<string, Ellenorzo> = {
  max_lines,
  max_chars,
  date_format,
  widow,
  grid,
  zone_clear,
  capacity,
  field_role,
};
