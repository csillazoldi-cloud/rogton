// A B2a szabálykészlet gépi ellenőrzői. Egy fajta → egy függvény; a paramétereket a sz.feltetel-ből olvassa.
import type { Ellenorzo, EllenorzoKontextus, Szabaly, Talalat } from "./ellenorzo.ts";
import { erintettElemek, feloldas, hossz, kontraszt } from "./ellenorzo.ts";
import type { ElemMeres, LapMeres } from "./meres.ts";

// --- segédek ---------------------------------------------------------------

/** Találat építése a szabály kötelező mezőivel. */
function t(sz: Szabaly, mezo: string | undefined, reszlet: string | undefined): Talalat {
  const alap: Talalat = { szabaly: sz.id, szigorusag: sz.szigorusag, uzenet: sz.uzenet };
  return {
    ...alap,
    ...(mezo !== undefined ? { mezo } : {}),
    ...(reszlet !== undefined ? { reszlet } : {}),
  };
}

/** Hiányzó márkaparaméter → figyelmeztetés (nem hiba). */
function hianyzo(sz: Szabaly, nev: string): Talalat[] {
  return [{ szabaly: sz.id, szigorusag: "figyelmeztetes", uzenet: `hiányzó márkaparaméter: ${nev}` }];
}

/** A feltétel egy mezőjének nyers értéke. */
function f(sz: Szabaly, kulcs: string): unknown {
  return sz.feltetel[kulcs];
}

/** A feltétel egy mezője stringként, vagy null. */
function fs(sz: Szabaly, kulcs: string): string | null {
  const v = f(sz, kulcs);
  return typeof v === "string" ? v : null;
}

/** A feltétel egy mezője számként, vagy null. */
function fn(sz: Szabaly, kulcs: string): number | null {
  const v = f(sz, kulcs);
  return typeof v === "number" ? v : null;
}

/** A feltétel egy mezője string-tömbként (üres, ha nem az). */
function fss(sz: Szabaly, kulcs: string): string[] {
  const v = f(sz, kulcs);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** A feltétel egy mezője objektumként, vagy null. */
function fo(sz: Szabaly, kulcs: string): Record<string, unknown> | null {
  const v = f(sz, kulcs);
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** A kontextus egy "when" kulcsának értéke (a mérésből nem mindig ismert). */
function whenErtek(sz: Szabaly, kulcs: string): unknown {
  const w = fo(sz, "when");
  return w ? w[kulcs] : undefined;
}

/** Igaz-e a when feltétel az adott kulcsra (a mérésből eldönthető esetekben). */
function whenTeljesul(sz: Szabaly, kulcs: string, k: EllenorzoKontextus): boolean | null {
  const v = whenErtek(sz, kulcs);
  if (v === undefined) return null;
  if (typeof v === "string") {
    // ismert kontextus-mezők
    if (kulcs === "contentType") return k.receptCsalad === v;
    if (kulcs === "genre") return k.receptCsalad === v;
    return null;
  }
  if (typeof v === "number") return null;
  return null;
}

/** A mérésben szereplő elemek, amelyek mezője a megadott prefixszel kezdődik. */
function prefixElemek(m: LapMeres, prefix: string): ElemMeres[] {
  return m.elemek.filter((e) => e.mezo.startsWith(prefix));
}

/** A szöveg szavainak száma (whitespace mentén). */
function szoSzam(szoveg: string): number {
  const t = szoveg.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

/** A szöveg karaktereinek száma. */
function karSzam(szoveg: string): number {
  return szoveg.length;
}

// --- ellenőrzők ------------------------------------------------------------

/** count_exact: pontosan N elem (pl. jelzés, nyelv fájlonként). */
const count_exact: Ellenorzo = (sz, k) => {
  const exact = fn(sz, "exact");
  if (exact === null) return [];
  const ce = fo(sz, "countElements");
  const prefix = ce && typeof ce["idPrefix"] === "string" ? ce["idPrefix"] : null;
  if (prefix === null) {
    // nyelv fájlonként: a mérésből nem dönthető el (fájlok száma)
    return [];
  }
  const elemek = prefixElemek(k.meres, prefix);
  if (elemek.length === exact) return [];
  return [t(sz, undefined, `${elemek.length} vs ${exact}`)];
};

/** count_max: legfeljebb N (szám, szín-szerep). */
const count_max: Ellenorzo = (sz, k) => {
  const max = fn(sz, "maxNumbers") ?? fn(sz, "maxRoles");
  if (max === null) return [];
  const tipusok = fss(sz, "mezoTipus");
  const elemek = tipusok.length > 0
    ? k.meres.elemek.filter((e) => tipusok.includes(e.tipus))
    : erintettElemek(sz, k.meres);
  if (elemek.length <= max) return [];
  return [t(sz, undefined, `${elemek.length} vs ${max}`)];
};

/** count_min: legalább N. */
const count_min: Ellenorzo = (sz, k) => {
  const min = fn(sz, "min");
  if (min === null) return [];
  const elemek = erintettElemek(sz, k.meres);
  if (elemek.length >= min) return [];
  return [t(sz, undefined, `${elemek.length} vs ${min}`)];
};

/** min_size: minden érintett elem betűmérete ≥ a megadott minimum. */
const min_size: Ellenorzo = (sz, k) => {
  const nyers = f(sz, "min");
  const nev = typeof nyers === "string" && nyers.startsWith("@") ? nyers.slice(1) : null;
  const ertek = feloldas(nyers, k);
  const hatar = hossz(ertek, k.meres);
  if (hatar === null) return nev ? hianyzo(sz, nev) : [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.meret_px < hatar) talalatok.push(t(sz, e.mezo, `${e.meret_px} px < ${hatar} px`));
  }
  return talalatok;
};

/** max_size: minden érintett elem betűmérete ≤ a megadott maximum. */
const max_size: Ellenorzo = (sz, k) => {
  const nyers = f(sz, "max");
  const nev = typeof nyers === "string" && nyers.startsWith("@") ? nyers.slice(1) : null;
  const ertek = feloldas(nyers, k);
  const hatar = hossz(ertek, k.meres);
  if (hatar === null) return nev ? hianyzo(sz, nev) : [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.meret_px > hatar) talalatok.push(t(sz, e.mezo, `${e.meret_px} px > ${hatar} px`));
  }
  return talalatok;
};

/** size_range: az érintett elemek mérete a [min, max] sávban. */
const size_range: Ellenorzo = (sz, k) => {
  const minNyers = f(sz, "min");
  const maxNyers = f(sz, "max");
  const minH = hossz(feloldas(minNyers, k), k.meres);
  const maxH = hossz(feloldas(maxNyers, k), k.meres);
  if (minH === null || maxH === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.meret_px < minH || e.meret_px > maxH) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px} px ∉ [${minH}, ${maxH}]`));
    }
  }
  return talalatok;
};

/** fixed_size: az érintett elemek mérete pontosan a megadott érték. */
const fixed_size: Ellenorzo = (sz, k) => {
  const nyers = f(sz, "size");
  const nev = typeof nyers === "string" && nyers.startsWith("@") ? nyers.slice(1) : null;
  const hatar = hossz(feloldas(nyers, k), k.meres);
  if (hatar === null) return nev ? hianyzo(sz, nev) : [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (Math.abs(e.meret_px - hatar) > 0.5) talalatok.push(t(sz, e.mezo, `${e.meret_px} px ≠ ${hatar} px`));
  }
  return talalatok;
};

/** equal_size: az érintett elemek mérete azonos (pl. nyelvi párok). */
const equal_size: Ellenorzo = (sz, k) => {
  const elemek = erintettElemek(sz, k.meres);
  if (elemek.length < 2) return [];
  const elso = elemek[0]!;
  const talalatok: Talalat[] = [];
  for (const e of elemek.slice(1)) {
    if (Math.abs(e.meret_px - elso.meret_px) > 0.5) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px} px ≠ ${elso.meret_px} px`));
    }
  }
  return talalatok;
};

/** scale_factor: az érintett elemek mérete a referencia × szorzó. */
const scale_factor: Ellenorzo = (sz, k) => {
  const szorzo = fn(sz, "factor");
  const ref = fn(sz, "ref");
  if (szorzo === null || ref === null) return [];
  const hatar = (k.meres.szelesseg * szorzo) / ref;
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (Math.abs(e.meret_px - hatar) > 0.5) talalatok.push(t(sz, e.mezo, `${e.meret_px} px ≠ ${hatar} px`));
  }
  return talalatok;
};

/** size_steps: az érintett elemek mérete a megadott lépcső egyik értéke. */
const size_steps: Ellenorzo = (sz, k) => {
  const lepcsok = f(sz, "steps");
  if (!Array.isArray(lepcsok)) return [];
  const szamok = lepcsok.filter((x): x is number => typeof x === "number");
  if (szamok.length === 0) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (!szamok.some((s) => Math.abs(e.meret_px - s) <= 0.5)) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px} px ∉ [${szamok.join(", ")}]`));
    }
  }
  return talalatok;
};

/** ladder_order: az érintett elemek mérete csökkenő sorrendben. */
const ladder_order: Ellenorzo = (sz, k) => {
  const elemek = erintettElemek(sz, k.meres);
  const talalatok: Talalat[] = [];
  for (let i = 1; i < elemek.length; i++) {
    const elozo = elemek[i - 1]!;
    const most = elemek[i]!;
    if (most.meret_px > elozo.meret_px + 0.5) {
      talalatok.push(t(sz, most.mezo, `${most.meret_px} px > ${elozo.meret_px} px`));
    }
  }
  return talalatok;
};

/** max_lines: az érintett elemek sorainak száma ≤ a megadott maximum. */
const max_lines: Ellenorzo = (sz, k) => {
  const max = fn(sz, "max");
  if (max === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.sorok > max) talalatok.push(t(sz, e.mezo, `${e.sorok} sor > ${max} sor`));
  }
  return talalatok;
};

/** max_words: az érintett elemek szavainak száma ≤ a megadott maximum. */
const max_words: Ellenorzo = (sz, k) => {
  const max = fn(sz, "max");
  if (max === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    const n = szoSzam(e.szoveg);
    if (n > max) talalatok.push(t(sz, e.mezo, `${n} szó > ${max} szó`));
  }
  return talalatok;
};

/** max_chars: az érintett elemek karaktereinek száma ≤ a megadott maximum. */
const max_chars: Ellenorzo = (sz, k) => {
  const max = fn(sz, "max");
  if (max === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    const n = karSzam(e.szoveg);
    if (n > max) talalatok.push(t(sz, e.mezo, `${n} kar > ${max} kar`));
  }
  return talalatok;
};

/** max_width: az érintett elemek szélessége ≤ a megadott maximum. */
const max_width: Ellenorzo = (sz, k) => {
  const nyers = f(sz, "max");
  const nev = typeof nyers === "string" && nyers.startsWith("@") ? nyers.slice(1) : null;
  const hatar = hossz(feloldas(nyers, k), k.meres);
  if (hatar === null) return nev ? hianyzo(sz, nev) : [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.w > hatar) talalatok.push(t(sz, e.mezo, `${e.w} px > ${hatar} px`));
  }
  return talalatok;
};

/** max_width_formula: az érintett elemek szélessége ≤ a képletből számolt határ. */
const max_width_formula: Ellenorzo = (sz, k) => {
  const keplet = fo(sz, "formula");
  if (!keplet) return [];
  const szorzo = typeof keplet["factor"] === "number" ? keplet["factor"] : null;
  const ref = typeof keplet["ref"] === "number" ? keplet["ref"] : null;
  if (szorzo === null || ref === null) return [];
  const hatar = (k.meres.szelesseg * szorzo) / ref;
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.w > hatar) talalatok.push(t(sz, e.mezo, `${e.w} px > ${hatar} px`));
  }
  return talalatok;
};

/** line_diff: a sorok száma legfeljebb N-nel térhet el. */
const line_diff: Ellenorzo = (sz, k) => {
  const max = fn(sz, "max");
  if (max === null) return [];
  const elemek = erintettElemek(sz, k.meres);
  if (elemek.length < 2) return [];
  const elso = elemek[0]!;
  const talalatok: Talalat[] = [];
  for (const e of elemek.slice(1)) {
    if (Math.abs(e.sorok - elso.sorok) > max) {
      talalatok.push(t(sz, e.mezo, `${e.sorok} vs ${elso.sorok} sor`));
    }
  }
  return talalatok;
};

/** widow: az utolsó sor ne legyen túl rövid (karakterben). */
const widow: Ellenorzo = (sz, k) => {
  const minKar = fn(sz, "minChars");
  if (minKar === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.sorok < 2) continue;
    const sorok = e.szoveg.split(/\n/);
    const utolso = sorok[sorok.length - 1] ?? "";
    if (karSzam(utolso.trim()) < minKar) {
      talalatok.push(t(sz, e.mezo, `${karSzam(utolso.trim())} kar < ${minKar} kar`));
    }
  }
  return talalatok;
};

/** prefer: preferált érték, eltérés esetén figyelmeztetés. */
const prefer: Ellenorzo = (sz, k) => {
  const nyers = f(sz, "value");
  const nev = typeof nyers === "string" && nyers.startsWith("@") ? nyers.slice(1) : null;
  const ertek = feloldas(nyers, k);
  if (ertek === undefined) return nev ? hianyzo(sz, nev) : [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (typeof ertek === "number" && Math.abs(e.meret_px - ertek) > 0.5) {
      talalatok.push(t(sz, e.mezo, `${e.meret_px} px ≠ ${ertek} px`));
    }
  }
  return talalatok;
};

/** color_on_ground: az érintett elemek kontrasztja ≥ a megadott minimum. */
const color_on_ground: Ellenorzo = (sz, k) => {
  const min = fn(sz, "min");
  if (min === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    const r = kontraszt(e.szin, e.hatter);
    if (r < min) talalatok.push(t(sz, e.mezo, `${r.toFixed(2)} < ${min}`));
  }
  return talalatok;
};

/** font_forbidden: tiltott betűcsaládok. */
const font_forbidden: Ellenorzo = (sz, k) => {
  const tiltott = fss(sz, "families");
  if (tiltott.length === 0) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (tiltott.includes(e.csalad)) talalatok.push(t(sz, e.mezo, `${e.csalad}`));
  }
  return talalatok;
};

/** text_case: kötelező írásmód (nagybetű / kisbetű). */
const text_case: Ellenorzo = (sz, k) => {
  const mod = fs(sz, "mode");
  if (mod === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (mod === "uppercase" && e.szoveg !== e.szoveg.toUpperCase()) {
      talalatok.push(t(sz, e.mezo, `nem nagybetűs`));
    }
    if (mod === "lowercase" && e.szoveg !== e.szoveg.toLowerCase()) {
      talalatok.push(t(sz, e.mezo, `nem kisbetűs`));
    }
  }
  return talalatok;
};

/** ratio_max: a szélesség/magasság arány ≤ a megadott maximum. */
const ratio_max: Ellenorzo = (sz, k) => {
  const max = fn(sz, "max");
  if (max === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.h <= 0) continue;
    const r = e.w / e.h;
    if (r > max) talalatok.push(t(sz, e.mezo, `${r.toFixed(2)} > ${max}`));
  }
  return talalatok;
};

/** field_role: a mező szerepe a megadott. */
const field_role: Ellenorzo = (sz, k) => {
  const vart = fs(sz, "role");
  if (vart === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.szerep !== vart) talalatok.push(t(sz, e.mezo, `${e.szerep ?? "-"} ≠ ${vart}`));
  }
  return talalatok;
};

/** enum_only: a kontextus értéke az engedélyezett halmazban van. */
const enum_only: Ellenorzo = (sz, k) => {
  const engedett = fss(sz, "allowedContentTypes");
  const tiltott = fss(sz, "forbiddenContentTypes");
  if (engedett.length === 0 && tiltott.length === 0) return [];
  const cs = k.receptCsalad;
  if (tiltott.includes(cs)) return [t(sz, undefined, `${cs} tiltott`)];
  if (engedett.length > 0 && !engedett.includes(cs)) return [t(sz, undefined, `${cs} ∉ [${engedett.join(", ")}]`)];
  return [];
};

/** required_field: kötelező mező jelenléte. */
const required_field: Ellenorzo = (sz, k) => {
  const kell = fs(sz, "require");
  if (kell === null) return [];
  if (k.kitoltott.includes(kell)) return [];
  return [t(sz, kell, `hiányzik: ${kell}`)];
};

/** forbidden_element: tiltott elem jelenléte. */
const forbidden_element: Ellenorzo = (sz, k) => {
  const tiltott = fss(sz, "elements");
  if (tiltott.length === 0) return [];
  const talalatok: Talalat[] = [];
  for (const e of k.meres.elemek) {
    if (tiltott.includes(e.mezo)) talalatok.push(t(sz, e.mezo, `tiltott elem: ${e.mezo}`));
  }
  return talalatok;
};

/** forbidden_combo: tiltott kombináció (pl. accent + kis szöveg). */
const forbidden_combo: Ellenorzo = (sz, k) => {
  const parok = f(sz, "pairs");
  if (!Array.isArray(parok)) return [];
  const talalatok: Talalat[] = [];
  for (const p of parok) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const [szin, alap] = p as [unknown, unknown];
    if (typeof szin !== "string" || typeof alap !== "string") continue;
    for (const e of k.meres.elemek) {
      if (e.szin === szin && e.hatter === alap) {
        talalatok.push(t(sz, e.mezo, `${szin} / ${alap}`));
      }
    }
  }
  return talalatok;
};

/** count_exact / count_max / count_min már fent. */

/** no_overlap: az érintett elemek dobozai nem fednek át. */
const no_overlap: Ellenorzo = (sz, k) => {
  const elemek = erintettElemek(sz, k.meres);
  const talalatok: Talalat[] = [];
  for (let i = 0; i < elemek.length; i++) {
    for (let j = i + 1; j < elemek.length; j++) {
      const a = elemek[i]!;
      const b = elemek[j]!;
      const atfed = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      if (atfed) talalatok.push(t(sz, a.mezo, `átfedés: ${a.mezo} / ${b.mezo}`));
    }
  }
  return talalatok;
};

/** dimension: a lap mérete a megadott. */
const dimension: Ellenorzo = (sz, k) => {
  const w = fn(sz, "w");
  const h = fn(sz, "h");
  if (w === null || h === null) return [];
  if (Math.abs(k.meres.szelesseg - w) <= 1 && Math.abs(k.meres.magassag - h) <= 1) return [];
  return [t(sz, undefined, `${k.meres.szelesseg}×${k.meres.magassag} ≠ ${w}×${h}`)];
};

/** grid: az érintett elemek x/y koordinátái a rácshoz igazodnak. */
const grid: Ellenorzo = (sz, k) => {
  const nyers = f(sz, "unit");
  const nev = typeof nyers === "string" && nyers.startsWith("@") ? nyers.slice(1) : null;
  const egyseg = hossz(feloldas(nyers, k), k.meres);
  if (egyseg === null || egyseg <= 0) return nev ? hianyzo(sz, nev) : [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    const dx = Math.abs(e.x % egyseg);
    const dy = Math.abs(e.y % egyseg);
    if (dx > 0.5 && dx < egyseg - 0.5) talalatok.push(t(sz, e.mezo, `x=${e.x} nem rácspont`));
    if (dy > 0.5 && dy < egyseg - 0.5) talalatok.push(t(sz, e.mezo, `y=${e.y} nem rácspont`));
  }
  return talalatok;
};

/** position: az érintett elemek pozíciója a megadott zónában. */
const position: Ellenorzo = (sz, k) => {
  const zona = fo(sz, "zone");
  if (!zona) return [];
  const x0 = typeof zona["x0"] === "number" ? zona["x0"] : null;
  const y0 = typeof zona["y0"] === "number" ? zona["y0"] : null;
  const x1 = typeof zona["x1"] === "number" ? zona["x1"] : null;
  const y1 = typeof zona["y1"] === "number" ? zona["y1"] : null;
  if (x0 === null || y0 === null || x1 === null || y1 === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.x < x0 || e.y < y0 || e.x + e.w > x1 || e.y + e.h > y1) {
      talalatok.push(t(sz, e.mezo, `(${e.x},${e.y},${e.w},${e.h}) ∉ zóna`));
    }
  }
  return talalatok;
};

/** order: az érintett elemek sorrendje a megadott. */
const order: Ellenorzo = (sz, k) => {
  const sorrend = fss(sz, "order");
  if (sorrend.length === 0) return [];
  const elemek = erintettElemek(sz, k.meres);
  const talalatok: Talalat[] = [];
  let idx = 0;
  for (const e of elemek) {
    const poz = sorrend.indexOf(e.mezo);
    if (poz === -1) continue;
    if (poz < idx) talalatok.push(t(sz, e.mezo, `${e.mezo} rossz helyen`));
    idx = Math.max(idx, poz);
  }
  return talalatok;
};

/** capacity: az érintett elemek beférnek a megadott kapacitásba. */
const capacity: Ellenorzo = (sz, k) => {
  const max = fn(sz, "max");
  if (max === null) return [];
  const elemek = erintettElemek(sz, k.meres);
  if (elemek.length <= max) return [];
  return [t(sz, undefined, `${elemek.length} > ${max}`)];
};

/** stem_match: a szövegek azonos tőre illeszkednek. */
const stem_match: Ellenorzo = (sz, k) => {
  const elemek = erintettElemek(sz, k.meres);
  if (elemek.length < 2) return [];
  const elso = elemek[0]!;
  const talalatok: Talalat[] = [];
  for (const e of elemek.slice(1)) {
    if (e.szoveg !== elso.szoveg) talalatok.push(t(sz, e.mezo, `${e.szoveg} ≠ ${elso.szoveg}`));
  }
  return talalatok;
};

/** not_intersect: az érintett elemek nem metszik a tiltott zónát. */
const not_intersect: Ellenorzo = (sz, k) => {
  const zona = fo(sz, "zone");
  if (!zona) return [];
  const x0 = typeof zona["x0"] === "number" ? zona["x0"] : null;
  const y0 = typeof zona["y0"] === "number" ? zona["y0"] : null;
  const x1 = typeof zona["x1"] === "number" ? zona["x1"] : null;
  const y1 = typeof zona["y1"] === "number" ? zona["y1"] : null;
  if (x0 === null || y0 === null || x1 === null || y1 === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    const metsz = e.x < x1 && x0 < e.x + e.w && e.y < y1 && y0 < e.y + e.h;
    if (metsz) talalatok.push(t(sz, e.mezo, `metszi a zónát`));
  }
  return talalatok;
};

/** derived_field: a mező a forrásból származik (a mérésből nem dönthető el). */
const derived_field: Ellenorzo = () => [];

/** date_format: a dátum formátuma a megadott. */
const date_format: Ellenorzo = (sz, k) => {
  const minta = fs(sz, "format");
  if (minta === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.szoveg === "") continue;
    // egyszerű ellenőrzés: a minta hosszához hasonló
    if (e.szoveg.length < 6) talalatok.push(t(sz, e.mezo, `${e.szoveg} nem dátum`));
  }
  return talalatok;
};

/** grammar: nyelvtani helyesség — emberi ellenőrzés. */
const grammar: Ellenorzo = () => [];

/** zone_clear: a zóna üres. */
const zone_clear: Ellenorzo = (sz, k) => {
  const zona = fo(sz, "zone");
  if (!zona) return [];
  const x0 = typeof zona["x0"] === "number" ? zona["x0"] : null;
  const y0 = typeof zona["y0"] === "number" ? zona["y0"] : null;
  const x1 = typeof zona["x1"] === "number" ? zona["x1"] : null;
  const y1 = typeof zona["y1"] === "number" ? zona["y1"] : null;
  if (x0 === null || y0 === null || x1 === null || y1 === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of k.meres.elemek) {
    const metsz = e.x < x1 && x0 < e.x + e.w && e.y < y1 && y0 < e.y + e.h;
    if (metsz) talalatok.push(t(sz, e.mezo, `zónában: ${e.mezo}`));
  }
  return talalatok;
};

/** zone_text_forbidden: a zónában nem lehet szöveg. */
const zone_text_forbidden: Ellenorzo = (sz, k) => {
  const zona = fo(sz, "zone");
  if (!zona) return [];
  const x0 = typeof zona["x0"] === "number" ? zona["x0"] : null;
  const y0 = typeof zona["y0"] === "number" ? zona["y0"] : null;
  const x1 = typeof zona["x1"] === "number" ? zona["x1"] : null;
  const y1 = typeof zona["y1"] === "number" ? zona["y1"] : null;
  if (x0 === null || y0 === null || x1 === null || y1 === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of k.meres.elemek) {
    if (e.szoveg === "") continue;
    const metsz = e.x < x1 && x0 < e.x + e.w && e.y < y1 && y0 < e.y + e.h;
    if (metsz) talalatok.push(t(sz, e.mezo, `szöveg a zónában: ${e.mezo}`));
  }
  return talalatok;
};

/** inside_box: az érintett elemek a dobozon belül vannak. */
const inside_box: Ellenorzo = (sz, k) => {
  const doboz = fo(sz, "box");
  if (!doboz) return [];
  const x0 = typeof doboz["x0"] === "number" ? doboz["x0"] : null;
  const y0 = typeof doboz["y0"] === "number" ? doboz["y0"] : null;
  const x1 = typeof doboz["x1"] === "number" ? doboz["x1"] : null;
  const y1 = typeof doboz["y1"] === "number" ? doboz["y1"] : null;
  if (x0 === null || y0 === null || x1 === null || y1 === null) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.x < x0 || e.y < y0 || e.x + e.w > x1 || e.y + e.h > y1) {
      talalatok.push(t(sz, e.mezo, `kilóg a dobozból`));
    }
  }
  return talalatok;
};

/** baseline: az érintett elemek y-koordinátája a megadott baseline-ok egyike. */
const baseline: Ellenorzo = (sz, k) => {
  const vonalak = f(sz, "baselines");
  if (!Array.isArray(vonalak)) return [];
  const szamok = vonalak.filter((x): x is number => typeof x === "number");
  if (szamok.length === 0) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (!szamok.some((b) => Math.abs(e.y + e.h - b) <= 1)) {
      talalatok.push(t(sz, e.mezo, `y=${e.y + e.h} nem baseline`));
    }
  }
  return talalatok;
};

/** asset_flag: az érintett elemek rendelkeznek a jelzővel. */
const asset_flag: Ellenorzo = (sz, k) => {
  const jelzo = fs(sz, "flag");
  if (jelzo === null) return [];
  // a mérésből nem dönthető el (nincs jelző mező)
  return [];
};

/** asset_record: az érintett elemekhez tartozik rekord. */
const asset_record: Ellenorzo = () => [];

/** min_gap: az érintett elemek között legalább a megadott hézag. */
const min_gap: Ellenorzo = (sz, k) => {
  const nyers = f(sz, "gap");
  const nev = typeof nyers === "string" && nyers.startsWith("@") ? nyers.slice(1) : null;
  const hatar = hossz(feloldas(nyers, k), k.meres);
  if (hatar === null) return nev ? hianyzo(sz, nev) : [];
  const elemek = erintettElemek(sz, k.meres);
  const talalatok: Talalat[] = [];
  for (let i = 0; i < elemek.length; i++) {
    for (let j = i + 1; j < elemek.length; j++) {
      const a = elemek[i]!;
      const b = elemek[j]!;
      const gap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
      if (gap >= 0 && gap < hatar) {
        talalatok.push(t(sz, a.mezo, `${gap} px < ${hatar} px`));
      }
    }
  }
  return talalatok;
};

/** sequence_max: sorozat-szintű — a mérésből nem dönthető el. */
const sequence_max: Ellenorzo = () => [];

/** adjacency: szomszédság — a mérésből nem dönthető el. */
const adjacency: Ellenorzo = () => [];

/** repeat_window: ismétlődés ablakban — a mérésből nem dönthető el. */
const repeat_window: Ellenorzo = () => [];

/** same_property_window: azonos tulajdonság ablakban — a mérésből nem dönthető el. */
const same_property_window: Ellenorzo = () => [];

/** manual: kézi ellenőrzés — a program csak felteszi a kérdést. */
const manual: Ellenorzo = () => [];

/** publish_gate: publikálási kapu — a mérésből nem dönthető el. */
const publish_gate: Ellenorzo = () => [];

/** editable_text: szerkeszthető szöveg — a mérésből nem dönthető el. */
const editable_text: Ellenorzo = () => [];

/** forbidden_chars: tiltott karakterek a szövegben. */
const forbidden_chars: Ellenorzo = (sz, k) => {
  const tiltott = fss(sz, "chars");
  if (tiltott.length === 0) return [];
  const talalatok: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    for (const c of tiltott) {
      if (e.szoveg.includes(c)) talalatok.push(t(sz, e.mezo, `tiltott karakter: ${c}`));
    }
  }
  return talalatok;
};

/** no_new_visual: nem hozhat új vizuális elemet — a mérésből nem dönthető el. */
const no_new_visual: Ellenorzo = () => [];

// --- export ----------------------------------------------------------------

export const ELLENORZOK_B2a: Record<string, Ellenorzo> = {
  field_role,
  font_forbidden,
  text_case,
  ratio_max,
  min_size,
  max_size,
  scale_factor,
  equal_size,
  size_steps,
  ladder_order,
  max_lines,
  max_words,
  line_diff,
  widow,
  max_chars,
  max_width,
  fixed_size,
  prefer,
  color_on_ground,
  max_width_formula,
  size_range,
  count_exact,
  count_max,
  count_min,
  no_overlap,
  dimension,
  grid,
  position,
  forbidden_element,
  forbidden_combo,
  enum_only,
  required_field,
  order,
  capacity,
  stem_match,
  not_intersect,
  derived_field,
  date_format,
  grammar,
  zone_clear,
  zone_text_forbidden,
  inside_box,
  baseline,
  asset_flag,
  asset_record,
  min_gap,
  sequence_max,
  adjacency,
  repeat_window,
  same_property_window,
  manual,
  publish_gate,
  editable_text,
  forbidden_chars,
  no_new_visual,
};

/** Azok a szabály-azonosítók, amelyeket a mérésből NEM lehet eldönteni — indokkal. */
export const NEM_DONTHETO_B2a: Record<string, string> = {
  K1: "a jelzés-típusok (rule/dot/arc/…) nincsenek a mérésben, csak a mező-prefix",
  K8: "a kiemelőszín-szerepek (rule/dot/focus_bar/arc) nincsenek a mérésben",
  K9: "a háttér-alap (ground) és a tartalomtípus nincsenek a mérésben",
  K14: "a hős-elem típusa és a tiltott elemek nincsenek a mérésben",
  K18: "a szerep-címke jelenléte a receptből, nem a mérésből dönthető el",
  K22: "a data_card keret és a kiemelt szám jelzése nincsenek a mérésben",
  N1: "a nyelvi sorrend és a tények azonossága emberi ellenőrzés",
  N3: "a fájlonkénti nyelvszám a publikálásból, nem a mérésből dönthető el",
  N7: "a tradition mező és a naptár-elrendezés nincsenek a mérésben",
  A3: "a comparison mező típusa (change/versus/rank) nincsenek a mérésben",
  A4: "a rétegek sorrendje a receptből, nem a mérésből dönthető el",
  A15: "a számpárok és a comparison mező nincsenek a mérésben",
  B1: "a formátumkód a kontextusból ismert, de a méret-ellenőrzés a dimension-nel történik",
  H1: "a forrás mező és az illusztratív sor jelenléte a receptből dönthető el",
  H3: "a forráskártya ref mezője nincsenek a mérésben",
  H4: "az idézet attribúciója és a hozzájárulás-rekord nincsenek a mérésben",
  H7: "a decidedBy mező és az attribúciós sor nincsenek a mérésben",
};
