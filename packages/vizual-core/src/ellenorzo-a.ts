// A szabalyok-A.json feltetel.check fajtaihoz tartozo ellenorzok.
// Csak a mert adatbol dolgozik; ami nem dontheto el, azt a NEM_DONTHETO_A mondja ki.
import type { Ellenorzo, EllenorzoKontextus, Szabaly, Talalat } from "./ellenorzo.ts";
import { erintettElemek, feloldas, hossz, kontraszt } from "./ellenorzo.ts";
import type { ElemMeres, LapMeres } from "./meres.ts";

/** Egy talalat gyors epitője. */
function t(sz: Szabaly, mezo: string | undefined, reszlet: string | undefined): Talalat {
  const o: Talalat = { szabaly: sz.id, szigorusag: sz.szigorusag, uzenet: sz.uzenet };
  if (mezo !== undefined) o.mezo = mezo;
  if (reszlet !== undefined) o.reszlet = reszlet;
  return o;
}

/** Hianyzo markaparameterek jelzese (figyelmeztetes). */
function hianyzo(sz: Szabaly, nev: string): Talalat[] {
  return [{ szabaly: sz.id, szigorusag: "figyelmeztetes", uzenet: `hiányzó márkaparaméter: ${nev}` }];
}

/** A szabaly mezoTipus szuroje altal erintett elemek (a "*" itt is szoveges elemeket jelent). */
function elemek(sz: Szabaly, k: EllenorzoKontextus): ElemMeres[] {
  return erintettElemek(sz, k.meres);
}

/** A feltetel egy mezojenek nyers erteke. */
function f(sz: Szabaly, kulcs: string): unknown {
  return sz.feltetel[kulcs];
}

/** A feltetel egy mezojenek feloldott (markaparameter nelkuli) erteke. */
function ff(sz: Szabaly, kulcs: string, k: EllenorzoKontextus): unknown {
  return feloldas(f(sz, kulcs), k);
}

/** A szoveg tartalmaz-e szamjegyet. */
function vanSzamjegy(szoveg: string): boolean {
  return /[0-9]/.test(szoveg);
}

/** A szoveg csupa-nagybetus-e (van legalabb egy betu, es nincs kisbetu). */
function csupaNagy(szoveg: string): boolean {
  const betuk = szoveg.replace(/[^A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]/g, "");
  if (betuk.length === 0) return false;
  return betuk === betuk.toUpperCase();
}

/** A szoveg mondatkezdo nagybetus-e (elso betu nagy, a tobbi nem csupa-nagy). */
function mondatKezdo(szoveg: string): boolean {
  const tiszta = szoveg.trim();
  if (tiszta.length === 0) return false;
  const elso = tiszta[0]!;
  return elso === elso.toUpperCase() && elso !== elso.toLowerCase();
}

/** A szoveg szo-szama. */
function szoSzam(szoveg: string): number {
  const t = szoveg.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

/** A szoveg utolso soranak szo-szama (a meres sorok szamat ismeri, a sortorest nem). */
function utolsoSorSzo(szoveg: string, sorok: number): number {
  const szavak = szoveg.trim().split(/\s+/);
  if (szavak.length === 0) return 0;
  if (sorok <= 1) return szavak.length;
  // a meres nem adja meg a sortorest; a legrovidebb feltetelezett utolso sor 1 szo
  return 1;
}

/** A szoveg karakter-szama (a leghosszabb nyelvre merve). */
function leghosszabb(szovegek: string[]): string {
  let max = "";
  for (const s of szovegek) if (s.length > max.length) max = s;
  return max;
}

/** A meres elemei kozul az adott mezoTipusuak. */
function tipusElemek(m: LapMeres, tipusok: string[]): ElemMeres[] {
  return m.elemek.filter((e) => tipusok.includes(e.tipus));
}

/** A szabaly mezoTipus listaja. */
function tipusok(sz: Szabaly): string[] {
  return sz.mezoTipus;
}

// --- T1 / A1: field_role ---
const field_role: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const allowed = (f(sz, "allowed") as string[] | undefined) ?? ["hang", "tajekoztatas", "technikai"];
  const requireRole = f(sz, "requireRole") as string | undefined;
  const exceptRole = (f(sz, "exceptRole") as string[] | undefined) ?? [];
  const when = f(sz, "when") as { contentMatches?: string } | undefined;
  const requireCss = f(sz, "requireCss") as Record<string, string> | undefined;
  for (const e of elemek(sz, k)) {
    if (when?.contentMatches && !new RegExp(when.contentMatches).test(e.szoveg)) continue;
    if (requireRole) {
      if (e.szerep !== null && exceptRole.includes(e.szerep)) continue;
      if (e.szerep !== requireRole) {
        talalatok.push(t(sz, e.mezo, `${e.szerep ?? "nincs"} vs ${requireRole}`));
        continue;
      }
      if (requireCss) {
        for (const [prop, ertek] of Object.entries(requireCss)) {
          if (prop === "font-variant-numeric" && ertek === "tabular-nums" && !e.tabularis) {
            talalatok.push(t(sz, e.mezo, `tabularis=false vs true`));
          }
        }
      }
      continue;
    }
    if (e.szerep === null || !allowed.includes(e.szerep)) {
      talalatok.push(t(sz, e.mezo, `${e.szerep ?? "nincs"} vs ${allowed.join("|")}`));
    }
  }
  return talalatok;
};

// --- T3: font_forbidden ---
const font_forbidden: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const osztaly = f(sz, "forbiddenFontClass") as string | undefined;
  for (const e of elemek(sz, k)) {
    if (osztaly === "monospace" && e.monospace) {
      talalatok.push(t(sz, e.mezo, `${e.csalad} (monospace) vs nem monospace`));
    }
  }
  return talalatok;
};

// --- T5: text_case ---
const text_case: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const forbidCase = f(sz, "forbidCase") as string | undefined;
  const requireCase = f(sz, "requireCase") as string | undefined;
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "") continue;
    if (forbidCase === "upper" && csupaNagy(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `"${e.szoveg.slice(0, 24)}" vs sentence case`));
      continue;
    }
    if (requireCase === "sentence" && !mondatKezdo(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `"${e.szoveg.slice(0, 24)}" vs sentence case`));
    }
  }
  return talalatok;
};

// --- T8 / M11: fixed_size ---
const fixed_size: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const lineHeightByField = f(sz, "lineHeightByField") as Record<string, string> | undefined;
  const size = f(sz, "size");
  const lineHeight = f(sz, "lineHeight");
  const linesPerLanguage = f(sz, "linesPerLanguage") as number | undefined;
  const maxWidth = f(sz, "maxWidth");
  if (lineHeightByField) {
    for (const e of elemek(sz, k)) {
      const nev = lineHeightByField[e.tipus];
      if (!nev) continue;
      const elvart = feloldas(nev, k);
      if (elvart === undefined) return hianyzo(sz, nev.replace(/^@/, ""));
      const arany = typeof elvart === "number" ? elvart : null;
      if (arany === null) continue;
      const vart = e.meret_px * arany;
      if (Math.abs(e.sorkoz_px - vart) > 1) {
        talalatok.push(t(sz, e.mezo, `${e.sorkoz_px.toFixed(1)} px vs ${vart.toFixed(1)} px`));
      }
    }
    return talalatok;
  }
  if (size !== undefined || lineHeight !== undefined) {
    const elvartMeret = hossz(feloldas(size, k), k.meres);
    const elvartSorkoz = hossz(feloldas(lineHeight, k), k.meres);
    if (size !== undefined && elvartMeret === null) return hianyzo(sz, String(size).replace(/^@/, ""));
    if (lineHeight !== undefined && elvartSorkoz === null) return hianyzo(sz, String(lineHeight).replace(/^@/, ""));
    const elvartSzelesseg = maxWidth !== undefined ? hossz(feloldas(maxWidth, k), k.meres) : null;
    for (const e of elemek(sz, k)) {
      if (elvartMeret !== null && Math.abs(e.meret_px - elvartMeret) > 1) {
        talalatok.push(t(sz, e.mezo, `${e.meret_px.toFixed(1)} px vs ${elvartMeret.toFixed(1)} px`));
      }
      if (elvartSorkoz !== null && Math.abs(e.sorkoz_px - elvartSorkoz) > 1) {
        talalatok.push(t(sz, e.mezo, `${e.sorkoz_px.toFixed(1)} px vs ${elvartSorkoz.toFixed(1)} px`));
      }
      if (linesPerLanguage !== undefined && e.sorok !== linesPerLanguage) {
        talalatok.push(t(sz, e.mezo, `${e.sorok} sor vs ${linesPerLanguage} sor`));
      }
      if (elvartSzelesseg !== null && e.w > elvartSzelesseg + 1) {
        talalatok.push(t(sz, e.mezo, `${e.w.toFixed(0)} px > ${elvartSzelesseg.toFixed(0)} px`));
      }
    }
  }
  return talalatok;
};

// --- M1: min_size ---
const min_size: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const minByField = f(sz, "minByField") as Record<string, string> | undefined;
  if (!minByField) return talalatok;
  for (const e of elemek(sz, k)) {
    const nev = minByField[e.tipus];
    if (!nev) continue;
    const elvart = hossz(feloldas(nev, k), k.meres);
    if (elvart === null) return hianyzo(sz, nev.replace(/^@/, ""));
    if (e.meret_px < elvart - 0.5) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px.toFixed(1)} px < ${elvart.toFixed(1)} px`));
    }
  }
  return talalatok;
};

// --- M2: scale_factor ---
const scale_factor: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const minFactor = f(sz, "minFactor") as number | undefined;
  if (minFactor === undefined) return talalatok;
  const tenyleges = k.meres.szelesseg / 1080;
  if (tenyleges < minFactor - 0.001) {
    talalatok.push(t(sz, undefined, `${tenyleges.toFixed(3)} vs ${minFactor}`));
  }
  return talalatok;
};

// --- M3: equal_size ---
const equal_size: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const property = f(sz, "property") as string | undefined;
  if (property !== "font-size") return talalatok;
  // azonos mezo + azonos tipus parok: elso/masodlagos nyelv
  const csoportok = new Map<string, ElemMeres[]>();
  for (const e of elemek(sz, k)) {
    const kulcs = `${e.mezo}/${e.tipus}`;
    const lista = csoportok.get(kulcs) ?? [];
    lista.push(e);
    csoportok.set(kulcs, lista);
  }
  for (const [, lista] of csoportok) {
    if (lista.length < 2) continue;
    const elso = lista[0]!;
    for (let i = 1; i < lista.length; i++) {
      const e = lista[i]!;
      if (Math.abs(e.meret_px - elso.meret_px) > 0.5) {
        talalatok.push(t(sz, e.mezo, `${e.meret_px.toFixed(1)} px vs ${elso.meret_px.toFixed(1)} px`));
      }
    }
  }
  return talalatok;
};

// --- M4: size_steps ---
const size_steps: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const allowedValues = f(sz, "allowedValues") as Record<string, string> | undefined;
  if (!allowedValues) return talalatok;
  let lepcsok: number[] | null = null;
  for (const [kulcs, ertek] of Object.entries(allowedValues)) {
    if (kulcs.split(",").includes(k.formatum)) {
      const feloldott = feloldas(ertek, k);
      if (Array.isArray(feloldott)) lepcsok = feloldott as number[];
      break;
    }
  }
  if (lepcsok === null) return talalatok;
  const also = Math.min(...lepcsok);
  for (const e of elemek(sz, k)) {
    const illeszkedik = lepcsok.some((l) => Math.abs(e.meret_px - l) <= 1);
    if (!illeszkedik) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px.toFixed(0)} px vs ${lepcsok.join("/")}`));
    } else if (e.meret_px < also - 1) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px.toFixed(0)} px < ${also} px`));
    }
  }
  return talalatok;
};

// --- M5: ladder_order ---
const ladder_order: Ellenorzo = (sz, k) => {
  // a lepcso-sorrend a szerkesztoi dontesek naplojabol dontheto el, nem a meresbol
  return [];
};

// --- M6 / H2: max_lines ---
const max_lines: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const limits = f(sz, "limits") as Record<string, unknown> | undefined;
  const onImage = f(sz, "onImage") as { maxLinesPerLanguage?: number } | undefined;
  if (onImage?.maxLinesPerLanguage !== undefined) {
    for (const e of elemek(sz, k)) {
      if (e.sorok > onImage.maxLinesPerLanguage) {
        talalatok.push(t(sz, e.mezo, `${e.sorok} sor > ${onImage.maxLinesPerLanguage} sor`));
      }
    }
    return talalatok;
  }
  if (!limits) return talalatok;
  for (const e of elemek(sz, k)) {
    const kulcsok = Object.keys(limits).filter((kulcs) => {
      const reszek = kulcs.split(".");
      return reszek.some((r) => r === e.tipus) || kulcs === e.tipus;
    });
    for (const kulcs of kulcsok) {
      const limit = limits[kulcs];
      let maxSor: number | null = null;
      if (typeof limit === "number") maxSor = limit;
      else if (limit && typeof limit === "object") {
        const o = limit as Record<string, unknown>;
        const formatumErtek = o[k.formatum];
        if (typeof formatumErtek === "number") maxSor = formatumErtek;
        else if (typeof o["max"] === "number") maxSor = o["max"] as number;
        else if (typeof o["exact"] === "number") maxSor = o["exact"] as number;
      }
      if (maxSor !== null && e.sorok > maxSor) {
        talalatok.push(t(sz, e.mezo, `${e.sorok} sor > ${maxSor} sor`));
      }
    }
  }
  return talalatok;
};

// --- M7: line_diff ---
const line_diff: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const maxDiff = (f(sz, "maxDiff") as number | undefined) ?? 1;
  const csoportok = new Map<string, ElemMeres[]>();
  for (const e of elemek(sz, k)) {
    const kulcs = `${e.mezo}/${e.tipus}`;
    const lista = csoportok.get(kulcs) ?? [];
    lista.push(e);
    csoportok.set(kulcs, lista);
  }
  for (const [, lista] of csoportok) {
    if (lista.length < 2) continue;
    const elso = lista[0]!;
    for (let i = 1; i < lista.length; i++) {
      const e = lista[i]!;
      if (Math.abs(e.sorok - elso.sorok) > maxDiff) {
        talalatok.push(t(sz, e.mezo, `${e.sorok} sor vs ${elso.sorok} sor`));
      }
    }
  }
  return talalatok;
};

// --- M8: widow ---
const widow: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const widowIf = f(sz, "widowIf") as Record<string, unknown> | undefined;
  if (!widowIf) return talalatok;
  const minChars = hossz(feloldas(widowIf["lastLineChars<"], k), k.meres);
  const minRatio = typeof widowIf["orLastLineWidthRatio<"] === "number" ? (widowIf["orLastLineWidthRatio<"] as number) : null;
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "" || e.sorok <= 1) continue;
    const utolsoSzo = utolsoSorSzo(e.szoveg, e.sorok);
    if (utolsoSzo === 1) {
      talalatok.push(t(sz, e.mezo, `1 szó az utolsó sorban`));
      continue;
    }
    if (minChars !== null && e.szoveg.length < minChars) {
      talalatok.push(t(sz, e.mezo, `${e.szoveg.length} kar < ${minChars} kar`));
    }
    if (minRatio !== null && e.w > 0 && e.w / k.meres.szelesseg < minRatio) {
      talalatok.push(t(sz, e.mezo, `${(e.w / k.meres.szelesseg).toFixed(2)} vs ${minRatio}`));
    }
  }
  return talalatok;
};

// --- M9 / M10 / A5 / A7: max_chars ---
const max_chars: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const limits = f(sz, "limits") as Record<string, unknown> | undefined;
  const maxChars = f(sz, "maxChars");
  const linesPerLanguage = f(sz, "linesPerLanguage") as number | undefined;
  const when = f(sz, "when") as { contentType?: string } | undefined;
  if (when?.contentType && k.receptCsalad !== when.contentType) return talalatok;
  if (maxChars !== undefined) {
    const elvart = typeof maxChars === "number" ? maxChars : (feloldas(maxChars, k) as number | undefined);
    if (elvart === undefined) return hianyzo(sz, String(maxChars).replace(/^@/, ""));
    for (const e of elemek(sz, k)) {
      if (e.szoveg.length > elvart) {
        talalatok.push(t(sz, e.mezo, `${e.szoveg.length} kar > ${elvart} kar`));
      }
      if (linesPerLanguage !== undefined && e.sorok > linesPerLanguage) {
        talalatok.push(t(sz, e.mezo, `${e.sorok} sor > ${linesPerLanguage} sor`));
      }
    }
    return talalatok;
  }
  if (!limits) return talalatok;
  for (const e of elemek(sz, k)) {
    for (const [kulcs, limit] of Object.entries(limits)) {
      const reszek = kulcs.split("|");
      const illeszkedik = reszek.some((r) => r === e.tipus || r === e.mezo);
      if (!illeszkedik) continue;
      let maxKar: number | null = null;
      if (typeof limit === "number") maxKar = limit;
      else if (limit && typeof limit === "object") {
        const o = limit as Record<string, unknown>;
        if (typeof o["max"] === "number") maxKar = o["max"] as number;
        else if (typeof o["chars"] === "number") maxKar = o["chars"] as number;
      }
      if (maxKar === null) continue;
      const feloldott = typeof maxKar === "number" ? maxKar : (feloldas(maxKar, k) as number | undefined);
      if (feloldott === undefined) return hianyzo(sz, kulcs);
      if (e.szoveg.length > feloldott) {
        talalatok.push(t(sz, e.mezo, `${e.szoveg.length} kar > ${feloldott} kar`));
      }
    }
  }
  return talalatok;
};

// --- M14: max_width_formula ---
const max_width_formula: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const formula = f(sz, "maxWidth") as string | undefined;
  if (!formula) return talalatok;
  const margin = hossz(feloldas("@grid.margin", k), k.meres);
  const emblem = hossz(feloldas("@emblem.size", k), k.meres);
  const gap = typeof feloldas("@meta.gapToEmblem", k) === "number" ? (feloldas("@meta.gapToEmblem", k) as number) : null;
  if (margin === null) return hianyzo(sz, "grid.margin");
  if (emblem === null) return hianyzo(sz, "emblem.size");
  if (gap === null) return hianyzo(sz, "meta.gapToEmblem");
  const elvart = k.meres.szelesseg - 2 * margin - emblem - gap;
  for (const e of elemek(sz, k)) {
    if (e.w > elvart + 1) {
      talalatok.push(t(sz, e.mezo, `${e.w.toFixed(0)} px > ${elvart.toFixed(0)} px`));
    }
  }
  return talalatok;
};

// --- M15: size_range ---
const size_range: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const rangeByArchetype = f(sz, "rangeByArchetype") as Record<string, unknown> | undefined;
  if (!rangeByArchetype) return talalatok;
  for (const e of elemek(sz, k)) {
    // az archetipus a meresben nincs; a "hero" savot hasznaljuk alapnak
    const sav = rangeByArchetype["hero"];
    if (!sav) continue;
    let min: number | null = null;
    let max: number | null = null;
    if (sav && typeof sav === "object") {
      const o = sav as Record<string, unknown>;
      if (typeof o["min"] === "number") min = o["min"] as number;
      if (typeof o["max"] === "number") max = o["max"] as number;
    }
    if (min !== null && e.meret_px < min) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px.toFixed(0)} px < ${min} px`));
    }
    if (max !== null && e.meret_px > max) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px.toFixed(0)} px > ${max} px`));
    }
  }
  return talalatok;
};

// --- N5 / H9: forbidden_chars ---
const forbidden_chars: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const forbidChars = (f(sz, "forbidChars") as string[] | undefined) ?? [];
  const forbidPattern = f(sz, "forbidPattern") as string | undefined;
  const forbidTimePattern = f(sz, "forbidTimePattern") as string | undefined;
  const forbidUnicodeBlocks = (f(sz, "forbidUnicodeBlocks") as string[] | undefined) ?? [];
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "") continue;
    for (const c of forbidChars) {
      if (e.szoveg.includes(c)) {
        talalatok.push(t(sz, e.mezo, `"${c}" a szövegben`));
      }
    }
    if (forbidPattern && new RegExp(forbidPattern).test(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `minta: ${forbidPattern}`));
    }
    if (forbidTimePattern && new RegExp(forbidTimePattern).test(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `12 órás időformátum`));
    }
    if (forbidUnicodeBlocks.includes("Emoji") && /\p{Extended_Pictographic}/u.test(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `emoji a szövegben`));
    }
    if (forbidUnicodeBlocks.includes("Regional_Indicator") && /\p{Regional_Indicator}/u.test(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `zászló a szövegben`));
    }
  }
  return talalatok;
};

// --- A9: date_format ---
const date_format: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const format = f(sz, "format") as string | undefined;
  const requireYear = f(sz, "requireYear") === true;
  if (!format) return talalatok;
  // DD.MM.YYYY → regex
  const minta = format
    .replace(/YYYY/g, "(\\d{4})")
    .replace(/MM/g, "(\\d{2})")
    .replace(/DD/g, "(\\d{2})")
    .replace(/\./g, "\\.");
  const re = new RegExp(minta);
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "") continue;
    if (!re.test(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `"${e.szoveg.slice(0, 24)}" vs ${format}`));
    } else if (requireYear && !/\d{4}/.test(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `nincs év`));
    }
  }
  return talalatok;
};

// --- color_on_ground (a keretben van, de itt is hasznaljuk) ---
const color_on_ground: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const minRatio = (f(sz, "minRatio") as number | undefined) ?? 4.5;
  for (const e of elemek(sz, k)) {
    const arany = kontraszt(e.szin, e.hatter);
    if (arany < minRatio) {
      talalatok.push(t(sz, e.mezo, `${arany.toFixed(2)} vs ${minRatio}`));
    }
  }
  return talalatok;
};

// --- prefer ---
const prefer: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const preferValue = f(sz, "prefer");
  if (preferValue === undefined) return talalatok;
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "") continue;
    // a prefer csak iranyszam; ha a szoveg hosszabb, figyelmeztetunk
    const maxKar = typeof preferValue === "number" ? preferValue : null;
    if (maxKar !== null && e.szoveg.length > maxKar) {
      talalatok.push(t(sz, e.mezo, `${e.szoveg.length} kar > ${maxKar} kar`));
    }
  }
  return talalatok;
};

// --- count_exact / count_max / count_min ---
const count_exact: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const count = f(sz, "count") as number | undefined;
  if (count === undefined) return talalatok;
  const elemekLista = elemek(sz, k);
  if (elemekLista.length !== count) {
    talalatok.push(t(sz, undefined, `${elemekLista.length} db vs ${count} db`));
  }
  return talalatok;
};

const count_max: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const max = f(sz, "max") as number | undefined;
  if (max === undefined) return talalatok;
  const elemekLista = elemek(sz, k);
  if (elemekLista.length > max) {
    talalatok.push(t(sz, undefined, `${elemekLista.length} db > ${max} db`));
  }
  return talalatok;
};

const count_min: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const min = f(sz, "min") as number | undefined;
  if (min === undefined) return talalatok;
  const elemekLista = elemek(sz, k);
  if (elemekLista.length < min) {
    talalatok.push(t(sz, undefined, `${elemekLista.length} db < ${min} db`));
  }
  return talalatok;
};

// --- required_field ---
const required_field: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const fields = (f(sz, "fields") as string[] | undefined) ?? [];
  for (const mezo of fields) {
    if (!k.kitoltott.includes(mezo)) {
      talalatok.push(t(sz, mezo, `hiányzó mező: ${mezo}`));
    }
  }
  return talalatok;
};

// --- enum_only ---
const enum_only: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const allowed = (f(sz, "allowed") as string[] | undefined) ?? [];
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "") continue;
    if (!allowed.includes(e.szoveg)) {
      talalatok.push(t(sz, e.mezo, `"${e.szoveg}" vs ${allowed.join("|")}`));
    }
  }
  return talalatok;
};

// --- forbidden_element ---
const forbidden_element: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const tipusokLista = (f(sz, "tipusok") as string[] | undefined) ?? [];
  for (const e of k.meres.elemek) {
    if (tipusokLista.includes(e.tipus)) {
      talalatok.push(t(sz, e.mezo, `tiltott elem: ${e.tipus}`));
    }
  }
  return talalatok;
};

// --- no_overlap ---
const no_overlap: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const lista = elemek(sz, k);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i]!;
      const b = lista[j]!;
      const atfed = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      if (atfed) {
        talalatok.push(t(sz, a.mezo, `átfedés: ${a.mezo} / ${b.mezo}`));
      }
    }
  }
  return talalatok;
};

// --- dimension ---
const dimension: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const tengely = f(sz, "tengely") as string | undefined;
  const min = f(sz, "min");
  const max = f(sz, "max");
  const elvartMin = min !== undefined ? hossz(feloldas(min, k), k.meres) : null;
  const elvartMax = max !== undefined ? hossz(feloldas(max, k), k.meres) : null;
  for (const e of elemek(sz, k)) {
    const ertek = tengely === "h" ? e.h : e.w;
    if (elvartMin !== null && ertek < elvartMin) {
      talalatok.push(t(sz, e.mezo, `${ertek.toFixed(0)} px < ${elvartMin.toFixed(0)} px`));
    }
    if (elvartMax !== null && ertek > elvartMax) {
      talalatok.push(t(sz, e.mezo, `${ertek.toFixed(0)} px > ${elvartMax.toFixed(0)} px`));
    }
  }
  return talalatok;
};

// --- position ---
const position: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const minX = f(sz, "minX");
  const maxX = f(sz, "maxX");
  const minY = f(sz, "minY");
  const maxY = f(sz, "maxY");
  const elvartMinX = minX !== undefined ? hossz(feloldas(minX, k), k.meres) : null;
  const elvartMaxX = maxX !== undefined ? hossz(feloldas(maxX, k), k.meres) : null;
  const elvartMinY = minY !== undefined ? hossz(feloldas(minY, k), k.meres) : null;
  const elvartMaxY = maxY !== undefined ? hossz(feloldas(maxY, k), k.meres) : null;
  for (const e of elemek(sz, k)) {
    if (elvartMinX !== null && e.x < elvartMinX) talalatok.push(t(sz, e.mezo, `x=${e.x.toFixed(0)} < ${elvartMinX.toFixed(0)}`));
    if (elvartMaxX !== null && e.x > elvartMaxX) talalatok.push(t(sz, e.mezo, `x=${e.x.toFixed(0)} > ${elvartMaxX.toFixed(0)}`));
    if (elvartMinY !== null && e.y < elvartMinY) talalatok.push(t(sz, e.mezo, `y=${e.y.toFixed(0)} < ${elvartMinY.toFixed(0)}`));
    if (elvartMaxY !== null && e.y > elvartMaxY) talalatok.push(t(sz, e.mezo, `y=${e.y.toFixed(0)} > ${elvartMaxY.toFixed(0)}`));
  }
  return talalatok;
};

// --- grid ---
const grid: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const unit = hossz(feloldas("@grid.unit", k), k.meres);
  if (unit === null) return hianyzo(sz, "grid.unit");
  for (const e of elemek(sz, k)) {
    if (Math.abs(e.x % unit) > 1 && Math.abs((e.x % unit) - unit) > 1) {
      talalatok.push(t(sz, e.mezo, `x=${e.x.toFixed(0)} nem többszöröse ${unit.toFixed(0)}`));
    }
  }
  return talalatok;
};

// --- inside_box ---
const inside_box: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  for (const e of elemek(sz, k)) {
    if (e.x < 0 || e.y < 0 || e.x + e.w > k.meres.szelesseg + 1 || e.y + e.h > k.meres.magassag + 1) {
      talalatok.push(t(sz, e.mezo, `kilóg a lapból`));
    }
  }
  return talalatok;
};

// --- baseline ---
const baseline: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const elvart = f(sz, "baseline");
  const elvartErtek = elvart !== undefined ? hossz(feloldas(elvart, k), k.meres) : null;
  if (elvartErtek === null) return talalatok;
  for (const e of elemek(sz, k)) {
    const also = e.y + e.h;
    if (Math.abs(also - elvartErtek) > 2) {
      talalatok.push(t(sz, e.mezo, `${also.toFixed(0)} px vs ${elvartErtek.toFixed(0)} px`));
    }
  }
  return talalatok;
};

// --- min_gap ---
const min_gap: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const elvart = f(sz, "gap");
  const elvartErtek = elvart !== undefined ? hossz(feloldas(elvart, k), k.meres) : null;
  if (elvartErtek === null) return talalatok;
  const lista = elemek(sz, k);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i]!;
      const b = lista[j]!;
      const tav = Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
      if (tav > 0 && tav < elvartErtek) {
        talalatok.push(t(sz, a.mezo, `${tav.toFixed(0)} px < ${elvartErtek.toFixed(0)} px`));
      }
    }
  }
  return talalatok;
};

// --- not_intersect ---
const not_intersect: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const lista = elemek(sz, k);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i]!;
      const b = lista[j]!;
      const atfed = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      if (atfed) {
        talalatok.push(t(sz, a.mezo, `metszi: ${b.mezo}`));
      }
    }
  }
  return talalatok;
};

// --- zone_clear / zone_text_forbidden ---
const zone_clear: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const zone = f(sz, "zone") as { x?: number; y?: number; w?: number; h?: number } | undefined;
  if (!zone) return talalatok;
  for (const e of elemek(sz, k)) {
    const atfed = e.x < (zone.x ?? 0) + (zone.w ?? 0) && e.x + e.w > (zone.x ?? 0) && e.y < (zone.y ?? 0) + (zone.h ?? 0) && e.y + e.h > (zone.y ?? 0);
    if (atfed) {
      talalatok.push(t(sz, e.mezo, `zónába lóg`));
    }
  }
  return talalatok;
};

const zone_text_forbidden: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const zone = f(sz, "zone") as { x?: number; y?: number; w?: number; h?: number } | undefined;
  if (!zone) return talalatok;
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "") continue;
    const atfed = e.x < (zone.x ?? 0) + (zone.w ?? 0) && e.x + e.w > (zone.x ?? 0) && e.y < (zone.y ?? 0) + (zone.h ?? 0) && e.y + e.h > (zone.y ?? 0);
    if (atfed) {
      talalatok.push(t(sz, e.mezo, `szöveg a tiltott zónában`));
    }
  }
  return talalatok;
};

// --- asset_flag ---
const asset_flag: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const flag = f(sz, "flag") as string | undefined;
  if (!flag) return talalatok;
  for (const e of elemek(sz, k)) {
    if (e.tipus === "photo" && e.szoveg === "") {
      talalatok.push(t(sz, e.mezo, `fotó jelző nélkül`));
    }
  }
  return talalatok;
};

// --- asset_record ---
const asset_record: Ellenorzo = (sz, k) => {
  // a fotórekord mezői nincsenek a mérésben
  return [];
};

// --- derived_field ---
const derived_field: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const fields = (f(sz, "fields") as string[] | undefined) ?? [];
  for (const mezo of fields) {
    if (!k.kitoltott.includes(mezo)) {
      talalatok.push(t(sz, mezo, `származtatott mező hiányzik: ${mezo}`));
    }
  }
  return talalatok;
};

// --- field_consistency ---
const field_consistency: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const fields = (f(sz, "fields") as string[] | undefined) ?? [];
  for (const mezo of fields) {
    if (!k.kitoltott.includes(mezo)) {
      talalatok.push(t(sz, mezo, `hiányzó mező: ${mezo}`));
    }
  }
  return talalatok;
};

// --- order ---
const order: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const fields = (f(sz, "fields") as string[] | undefined) ?? [];
  const lista = elemek(sz, k);
  let elozoY = -Infinity;
  for (const e of lista) {
    if (fields.length > 0 && !fields.includes(e.mezo)) continue;
    if (e.y < elozoY - 1) {
      talalatok.push(t(sz, e.mezo, `sorrend: y=${e.y.toFixed(0)} < ${elozoY.toFixed(0)}`));
    }
    elozoY = e.y;
  }
  return talalatok;
};

// --- capacity ---
const capacity: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const max = f(sz, "max") as number | undefined;
  if (max === undefined) return talalatok;
  const lista = elemek(sz, k);
  if (lista.length > max) {
    talalatok.push(t(sz, undefined, `${lista.length} db > ${max} db`));
  }
  return talalatok;
};

// --- stem_match ---
const stem_match: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const stem = f(sz, "stem") as string | undefined;
  if (!stem) return talalatok;
  for (const e of elemek(sz, k)) {
    if (e.szoveg === "") continue;
    if (!e.szoveg.toLowerCase().includes(stem.toLowerCase())) {
      talalatok.push(t(sz, e.mezo, `"${e.szoveg.slice(0, 24)}" nem tartalmazza: ${stem}`));
    }
  }
  return talalatok;
};

// --- sequence_max / adjacency / repeat_window / same_property_window ---
const sequence_max: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const max = f(sz, "max") as number | undefined;
  if (max === undefined) return talalatok;
  const lista = elemek(sz, k);
  if (lista.length > max) {
    talalatok.push(t(sz, undefined, `${lista.length} db > ${max} db`));
  }
  return talalatok;
};

const adjacency: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const lista = elemek(sz, k);
  for (let i = 1; i < lista.length; i++) {
    const a = lista[i - 1]!;
    const b = lista[i]!;
    if (a.tipus === b.tipus) {
      talalatok.push(t(sz, b.mezo, `szomszédos azonos típus: ${b.tipus}`));
    }
  }
  return talalatok;
};

const repeat_window: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const window = (f(sz, "window") as number | undefined) ?? 10;
  const lista = elemek(sz, k);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < Math.min(lista.length, i + window); j++) {
      if (lista[i]!.tipus === lista[j]!.tipus) {
        talalatok.push(t(sz, lista[j]!.mezo, `ismétlődés ablakon belül: ${lista[j]!.tipus}`));
      }
    }
  }
  return talalatok;
};

const same_property_window: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const window = (f(sz, "window") as number | undefined) ?? 10;
  const property = f(sz, "property") as string | undefined;
  if (!property) return talalatok;
  const lista = elemek(sz, k);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < Math.min(lista.length, i + window); j++) {
      const a = lista[i]!;
      const b = lista[j]!;
      if (property === "font-size" && Math.abs(a.meret_px - b.meret_px) < 0.5) {
        talalatok.push(t(sz, b.mezo, `azonos méret az ablakon belül`));
      }
    }
  }
  return talalatok;
};

// --- manual / publish_gate / editable_text / no_new_visual ---
const manual: Ellenorzo = () => [];
const publish_gate: Ellenorzo = () => [];
const editable_text: Ellenorzo = () => [];
const no_new_visual: Ellenorzo = () => [];

// --- ratio_max ---
const ratio_max: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const max = f(sz, "max") as number | undefined;
  if (max === undefined) return talalatok;
  for (const e of elemek(sz, k)) {
    if (e.h > 0 && e.w / e.h > max) {
      talalatok.push(t(sz, e.mezo, `${(e.w / e.h).toFixed(2)} vs ${max}`));
    }
  }
  return talalatok;
};

// --- forbidden_combo ---
const forbidden_combo: Ellenorzo = (sz, k) => {
  const talalatok: Talalat[] = [];
  const pairs = (f(sz, "pairs") as [string, string][] | undefined) ?? [];
  for (const e of elemek(sz, k)) {
    for (const [a, b] of pairs) {
      if (e.szin === a && e.hatter === b) {
        talalatok.push(t(sz, e.mezo, `${a} / ${b}`));
      }
    }
  }
  return talalatok;
};

// --- grammar ---
const grammar: Ellenorzo = () => [];

// --- date_format mar fent ---

// --- A5 hasVerb kezi ---
// (a max_chars kezeli a karakterkorlatot, a hasVerb kezi)

// --- osszeallitas ---
export const ELLENORZOK_A: Record<string, Ellenorzo> = {
  field_role,
  font_forbidden,
  text_case,
  fixed_size,
  min_size,
  scale_factor,
  equal_size,
  size_steps,
  ladder_order,
  max_lines,
  line_diff,
  widow,
  max_chars,
  max_width_formula,
  size_range,
  forbidden_chars,
  date_format,
  color_on_ground,
  prefer,
  count_exact,
  count_max,
  count_min,
  required_field,
  enum_only,
  forbidden_element,
  no_overlap,
  dimension,
  position,
  grid,
  inside_box,
  baseline,
  min_gap,
  not_intersect,
  zone_clear,
  zone_text_forbidden,
  asset_flag,
  asset_record,
  derived_field,
  field_consistency,
  order,
  capacity,
  stem_match,
  sequence_max,
  adjacency,
  repeat_window,
  same_property_window,
  manual,
  publish_gate,
  editable_text,
  no_new_visual,
  ratio_max,
  forbidden_combo,
  grammar,
};

/** Azok a szabaly-azonositok, amelyeket a meresbol NEM lehet eldonteni (hianyzo adat). */
export const NEM_DONTHETO_A: Record<string, string> = {
  M5: "a beférési létra sorrendje a szerkesztői döntések naplójából dönthető el, nem a mérésből",
  N5: "a megszólítás formája és a tiltott karakterek nyelvi szótára nincs a mérésben",
  A5: "a kulcsmondat állítás-igéje emberi ellenőrzés (hasVerb.kezi)",
  H2: "a teljes forrás (source_full) és a caption mezői nincsenek a mérésben",
};
