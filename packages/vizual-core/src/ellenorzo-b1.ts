// A B1 szabálykészlet gépi ellenőrzői. Minden `check` fajtához egy függvény.
// Ami a mérésből nem dönthető el, azt a NEM_DONTHETO_B1 sorolja fel — nem találunk ki adatot.
import type { Ellenorzo, EllenorzoKontextus, Szabaly, Talalat } from "./ellenorzo.ts";
import { erintettElemek, feloldas, hossz, kontraszt } from "./ellenorzo.ts";
import type { ElemMeres, LapMeres } from "./meres.ts";

// ---- segédek ----------------------------------------------------------------

/** Találat gyártása egységes alakban. */
function t(sz: Szabaly, mezo: string | undefined, reszlet: string | undefined): Talalat {
  const alap: Talalat = { szabaly: sz.id, szigorusag: sz.szigorusag, uzenet: sz.uzenet };
  if (mezo !== undefined) alap.mezo = mezo;
  if (reszlet !== undefined) alap.reszlet = reszlet;
  return alap;
}

/** Figyelmeztetés hiányzó márkaparaméterre. */
function hianyzo(sz: Szabaly, nev: string, mezo?: string): Talalat {
  const alap: Talalat = {
    szabaly: sz.id,
    szigorusag: "figyelmeztetes",
    uzenet: `hiányzó márkaparaméter: ${nev}`,
  };
  if (mezo !== undefined) alap.mezo = mezo;
  return alap;
}

/** Szám-e a feloldott érték. */
function szam(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** A szabály `when` feltételének egyszerű kiértékelése (ground, contentMatches). */
function whenTeljesul(sz: Szabaly, e: ElemMeres): boolean {
  const w = sz.feltetel["when"];
  if (!w || typeof w !== "object") return true;
  const o = w as Record<string, unknown>;
  if (typeof o["ground"] === "string") {
    // a mérésből a ground nem közvetlenül olvasható; a hátteret használjuk közelítésként
    const g = o["ground"];
    if (g === "photo") {
      // fotó-háttér: nem a lap alap-színe (paper/dark). Egyszerű közelítés: nem tiszta fekete/fehér.
      const h = e.hatter.toLowerCase();
      if (h === "#ffffff" || h === "#000000") return false;
    }
  }
  if (typeof o["contentMatches"] === "string") {
    try {
      if (!new RegExp(o["contentMatches"]).test(e.szoveg)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/** A `except` / `exceptRole` kizárások. */
function kizarva(sz: Szabaly, e: ElemMeres): boolean {
  const ex = sz.feltetel["exceptRole"];
  if (Array.isArray(ex) && e.szerep !== null && ex.includes(e.szerep)) return true;
  const ex2 = sz.feltetel["except"];
  if (Array.isArray(ex2) && ex2.includes(e.tipus)) return true;
  return false;
}

// ---- check fajták -----------------------------------------------------------

/** min_size: a mért betűméret ≥ a feloldott minimum. */
const min_size: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["min"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = hossz(nyers, k.meres);
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.meret_px < hatar) out.push(t(sz, e.mezo, `${e.meret_px} px < ${hatar.toFixed(1)} px`));
  }
  return out;
};

/** max_size / fixed_size: a mért betűméret ≤ a feloldott maximum (fixed: egyenlő). */
const fixed_size: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["size"] ?? sz.feltetel["max"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = hossz(nyers, k.meres);
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (Math.abs(e.meret_px - hatar) > 0.5) out.push(t(sz, e.mezo, `${e.meret_px} px ≠ ${hatar.toFixed(1)} px`));
  }
  return out;
};

/** size_range: min ≤ méret ≤ max. */
const size_range: Ellenorzo = (sz, k) => {
  const minK = sz.feltetel["min"];
  const maxK = sz.feltetel["max"];
  const minNev = typeof minK === "string" ? minK.replace(/^@/, "") : "";
  const maxNev = typeof maxK === "string" ? maxK.replace(/^@/, "") : "";
  const minV = hossz(feloldas(minK, k), k.meres);
  const maxV = hossz(feloldas(maxK, k), k.meres);
  if (minV === null) return [hianyzo(sz, minNev)];
  if (maxV === null) return [hianyzo(sz, maxNev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.meret_px < minV || e.meret_px > maxV)
      out.push(t(sz, e.mezo, `${e.meret_px} px ∉ [${minV.toFixed(1)}, ${maxV.toFixed(1)}]`));
  }
  return out;
};

/** scale_factor: a méret a vászon szélességével arányos (px/ref × szélesség). */
const scale_factor: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["size"] ?? sz.feltetel["min"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = hossz(nyers, k.meres);
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (Math.abs(e.meret_px - hatar) > 0.5) out.push(t(sz, e.mezo, `${e.meret_px} px ≠ ${hatar.toFixed(1)} px`));
  }
  return out;
};

/** equal_size: az érintett elemek mérete egyezzen. */
const equal_size: Ellenorzo = (sz, k) => {
  const elemek = erintettElemek(sz, k.meres).filter((e) => !kizarva(sz, e));
  if (elemek.length < 2) return [];
  const elso = elemek[0]!;
  const out: Talalat[] = [];
  for (const e of elemek.slice(1)) {
    if (Math.abs(e.meret_px - elso.meret_px) > 0.5)
      out.push(t(sz, e.mezo, `${e.meret_px} px ≠ ${elso.meret_px} px`));
  }
  return out;
};

/** size_steps: a méret a lépcső egyik értéke legyen. */
const size_steps: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["steps"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  if (!Array.isArray(nyers)) return [hianyzo(sz, nev)];
  const lepcsok = nyers.filter(szam);
  if (lepcsok.length === 0) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (!lepcsok.some((v) => Math.abs(v - e.meret_px) <= 0.5))
      out.push(t(sz, e.mezo, `${e.meret_px} px ∉ {${lepcsok.join(", ")}}`));
  }
  return out;
};

/** ladder_order: a méretek csökkenő sorrendben kövessék a lépcsőt (elemek sorrendjében). */
const ladder_order: Ellenorzo = (sz, k) => {
  const elemek = erintettElemek(sz, k.meres).filter((e) => !kizarva(sz, e));
  const out: Talalat[] = [];
  for (let i = 1; i < elemek.length; i++) {
    const a = elemek[i - 1]!;
    const b = elemek[i]!;
    if (b.meret_px > a.meret_px + 0.5)
      out.push(t(sz, b.mezo, `${b.meret_px} px > ${a.meret_px} px (előző)`));
  }
  return out;
};

/** max_lines: a sorok száma ≤ a határ. */
const max_lines: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["max"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.sorok > hatar) out.push(t(sz, e.mezo, `${e.sorok} sor > ${hatar} sor`));
  }
  return out;
};

/** max_words: a szöveg szavainak száma ≤ a határ. */
const max_words: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["max"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    const szavak = e.szoveg.split(/\s+/).filter((s) => s.length > 0).length;
    if (szavak > hatar) out.push(t(sz, e.mezo, `${szavak} szó > ${hatar} szó`));
  }
  return out;
};

/** max_chars: a szöveg hossza ≤ a határ. */
const max_chars: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["max"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.szoveg.length > hatar) out.push(t(sz, e.mezo, `${e.szoveg.length} kar > ${hatar} kar`));
  }
  return out;
};

/** max_width: az elem szélessége ≤ a feloldott határ. */
const max_width: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["max"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const hatar = hossz(feloldas(kulcs, k), k.meres);
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.w > hatar) out.push(t(sz, e.mezo, `${e.w.toFixed(1)} px > ${hatar.toFixed(1)} px`));
  }
  return out;
};

/** max_width_formula: a szélesség ≤ a képletből számolt határ (pl. vászon − 2×margó). */
const max_width_formula: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["max"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const hatar = hossz(feloldas(kulcs, k), k.meres);
  if (hatar === null) return [hianyzo(sz, nev)];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.w > hatar) out.push(t(sz, e.mezo, `${e.w.toFixed(1)} px > ${hatar.toFixed(1)} px`));
  }
  return out;
};

/** line_diff: a sorköz és a betűméret aránya a megadott érték körül. */
const line_diff: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["ratio"] ?? sz.feltetel["lineHeight"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const tures = szam(sz.feltetel["tolerance"]) ? (sz.feltetel["tolerance"] as number) : 0.02;
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.meret_px <= 0) continue;
    const arany = e.sorkoz_px / e.meret_px;
    if (Math.abs(arany - hatar) > tures)
      out.push(t(sz, e.mezo, `${arany.toFixed(2)} ≠ ${hatar.toFixed(2)}`));
  }
  return out;
};

/** widow: az utolsó sor ne legyen túl rövid (becslés a szöveg hosszából). */
const widow: Ellenorzo = (sz, k) => {
  const minKar = szam(sz.feltetel["minChars"]) ? (sz.feltetel["minChars"] as number) : 8;
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (e.sorok < 2) continue;
    // becslés: az utolsó sor hossza ≈ szöveg hossza / sorok
    const atlag = e.szoveg.length / e.sorok;
    if (atlag < minKar) out.push(t(sz, e.mezo, `utolsó sor ≈ ${atlag.toFixed(1)} kar < ${minKar} kar`));
  }
  return out;
};

/** prefer: lágy preferencia — csak akkor jelez, ha a feltétel egyértelműen sérül. */
const prefer: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["prefer"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  if (nyers === undefined) return [hianyzo(sz, nev)];
  // A preferencia konkrét mérőszáma nincs a mérésben — nem dönthető el.
  return [];
};

/** font_forbidden: a betűcsalád ne legyen a tiltott listában. */
const font_forbidden: Ellenorzo = (sz, k) => {
  const lista = sz.feltetel["forbidden"];
  if (!Array.isArray(lista)) return [];
  const tiltott = lista.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (tiltott.includes(e.csalad.toLowerCase()))
      out.push(t(sz, e.mezo, `${e.csalad} tiltott`));
  }
  return out;
};

/** text_case: a szöveg legyen nagybetűs (requireCase: "upper"). */
const text_case: Ellenorzo = (sz, k) => {
  const kell = sz.feltetel["requireCase"];
  if (kell !== "upper") return [];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (!e.nagybetus) out.push(t(sz, e.mezo, `nem nagybetűs`));
  }
  return out;
};

/** ratio_max: a technikai réteg aránya a látható szövegben ≤ a határ. */
const ratio_max: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["maxShareOfVisibleText"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const osszes = k.meres.elemek.filter((e) => e.szoveg !== "");
  const osszKar = osszes.reduce((s, e) => s + e.szoveg.length, 0);
  if (osszKar === 0) return [];
  const technikai = erintettElemek(sz, k.meres).filter((e) => !kizarva(sz, e));
  const techKar = technikai.reduce((s, e) => s + e.szoveg.length, 0);
  const arany = techKar / osszKar;
  if (arany > hatar)
    return [t(sz, undefined, `${(arany * 100).toFixed(1)}% > ${(hatar * 100).toFixed(1)}%`)];
  return [];
};

/** color_on_ground: a szöveg színe a háttéren elég kontrasztos legyen. */
const color_on_ground: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["requireColor"] ?? sz.feltetel["textColor"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const elvart = typeof nyers === "string" ? nyers.toLowerCase() : null;
  const minKontraszt = szam(sz.feltetel["minContrast"]) ? (sz.feltetel["minContrast"] as number) : 4.5;
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (!whenTeljesul(sz, e)) continue;
    if (elvart !== null && e.szin.toLowerCase() !== elvart)
      out.push(t(sz, e.mezo, `${e.szin} ≠ ${elvart}`));
    const c = kontraszt(e.szin, e.hatter);
    if (c < minKontraszt)
      out.push(t(sz, e.mezo, `kontraszt ${c.toFixed(2)} < ${minKontraszt}`));
  }
  return out;
};

/** count_exact: pontosan ennyi érintett elem legyen. */
const count_exact: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["count"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const n = erintettElemek(sz, k.meres).length;
  if (n !== hatar) return [t(sz, undefined, `${n} db ≠ ${hatar} db`)];
  return [];
};

/** count_max: legfeljebb ennyi érintett elem. */
const count_max: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["max"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const n = erintettElemek(sz, k.meres).length;
  if (n > hatar) return [t(sz, undefined, `${n} db > ${hatar} db`)];
  return [];
};

/** count_min: legalább ennyi érintett elem. */
const count_min: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["min"];
  const nev = typeof kulcs === "string" ? kulcs.replace(/^@/, "") : "";
  const nyers = feloldas(kulcs, k);
  const hatar = szam(nyers) ? nyers : null;
  if (hatar === null) return [hianyzo(sz, nev)];
  const n = erintettElemek(sz, k.meres).length;
  if (n < hatar) return [t(sz, undefined, `${n} db < ${hatar} db`)];
  return [];
};

/** no_overlap: a dobozok ne fedjék egymást, és ne lógjanak ki. */
const no_overlap: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const elemek = k.meres.elemek.filter((e) => e.szoveg !== "" || e.tipus === "photo");
  // kilógás
  if (sz.feltetel["noClip"] === true) {
    for (const e of elemek) {
      if (e.x < -0.5 || e.y < -0.5 || e.x + e.w > k.meres.szelesseg + 0.5 || e.y + e.h > k.meres.magassag + 0.5)
        out.push(t(sz, e.mezo, `kilóg: (${e.x.toFixed(0)},${e.y.toFixed(0)}) ${e.w.toFixed(0)}×${e.h.toFixed(0)}`));
    }
  }
  // átfedés
  if (sz.feltetel["noOverlap"] === true) {
    for (let i = 0; i < elemek.length; i++) {
      for (let j = i + 1; j < elemek.length; j++) {
        const a = elemek[i]!;
        const b = elemek[j]!;
        const fed = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        if (fed) out.push(t(sz, b.mezo, `átfedés: ${a.mezo} × ${b.mezo}`));
      }
    }
  }
  return out;
};

/** dimension: méret-ellenőrzés (minBand, minSlot, emblem, stb.). */
const dimension: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const f = sz.feltetel;
  const minBandK = f["minBand"];
  if (minBandK !== undefined) {
    const nev = typeof minBandK === "string" ? minBandK.replace(/^@/, "") : "";
    const hatar = hossz(feloldas(minBandK, k), k.meres);
    if (hatar === null) out.push(hianyzo(sz, nev));
    else {
      for (const e of erintettElemek(sz, k.meres)) {
        if (kizarva(sz, e)) continue;
        if (e.h < hatar) out.push(t(sz, e.mezo, `sáv ${e.h.toFixed(0)} px < ${hatar.toFixed(0)} px`));
      }
    }
  }
  const minSlotK = f["minSlot"];
  if (minSlotK !== undefined) {
    const nev = typeof minSlotK === "string" ? minSlotK.replace(/^@/, "") : "";
    const hatar = hossz(feloldas(minSlotK, k), k.meres);
    if (hatar === null) out.push(hianyzo(sz, nev));
    else {
      for (const e of erintettElemek(sz, k.meres)) {
        if (kizarva(sz, e)) continue;
        if (e.h < hatar) out.push(t(sz, e.mezo, `slot ${e.h.toFixed(0)} px < ${hatar.toFixed(0)} px`));
      }
    }
  }
  const emblemK = f["emblem"];
  if (emblemK !== undefined) {
    const nev = typeof emblemK === "string" ? emblemK.replace(/^@/, "") : "";
    const hatar = hossz(feloldas(emblemK, k), k.meres);
    if (hatar === null) out.push(hianyzo(sz, nev));
    else {
      for (const e of k.meres.elemek.filter((x) => x.tipus === "emblem")) {
        if (Math.abs(e.w - hatar) > 1) out.push(t(sz, e.mezo, `emblémaszélesség ${e.w.toFixed(0)} px ≠ ${hatar.toFixed(0)} px`));
      }
    }
  }
  return out;
};

/** grid: margó és hézag-többszörös. */
const grid: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const marginK = sz.feltetel["margin"];
  const nev = typeof marginK === "string" ? marginK.replace(/^@/, "") : "";
  const margin = hossz(feloldas(marginK, k), k.meres);
  if (margin === null) return [hianyzo(sz, nev)];
  const kivetel = Array.isArray(sz.feltetel["exemptFromMargin"])
    ? (sz.feltetel["exemptFromMargin"] as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kivetel.includes(e.tipus)) continue;
    if (e.x < margin - 0.5 || e.y < margin - 0.5 ||
        e.x + e.w > k.meres.szelesseg - margin + 0.5 ||
        e.y + e.h > k.meres.magassag - margin + 0.5)
      out.push(t(sz, e.mezo, `margón kívül: x=${e.x.toFixed(0)} y=${e.y.toFixed(0)}`));
  }
  return out;
};

/** position: az embléma pozíciója (jobb alsó / jobb felső). */
const position: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const engedett = Array.isArray(sz.feltetel["position"])
    ? (sz.feltetel["position"] as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const tiltottLockup = sz.feltetel["forbid"] && typeof sz.feltetel["forbid"] === "object"
    ? (sz.feltetel["forbid"] as Record<string, unknown>)["lockup"] === true
    : false;
  for (const e of k.meres.elemek) {
    if (e.tipus === "emblem") {
      const jobb = e.x + e.w > k.meres.szelesseg * 0.6;
      const also = e.y + e.h > k.meres.magassag * 0.6;
      const felso = e.y < k.meres.magassag * 0.4;
      const ok = (jobb && also && engedett.includes("bottom-right")) ||
                 (jobb && felso && engedett.includes("top-right"));
      if (!ok) out.push(t(sz, e.mezo, `pozíció: x=${e.x.toFixed(0)} y=${e.y.toFixed(0)}`));
    }
    if (tiltottLockup && e.tipus === "lockup")
      out.push(t(sz, e.mezo, `lockup tilos`));
  }
  return out;
};

/** capacity: kapacitás-korlátok (bars, list, stb.). */
const capacity: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const limits = sz.feltetel["limits"];
  if (limits && typeof limits === "object") {
    const o = limits as Record<string, unknown>;
    const listMax = szam(o["list"]) ? o["list"] : null;
    if (listMax !== null) {
      const listak = k.meres.elemek.filter((e) => e.tipus === "list");
      for (const e of listak) {
        const sorok = e.sorok;
        if (sorok > listMax) out.push(t(sz, e.mezo, `${sorok} sor > ${listMax}`));
      }
    }
    const barsMax = szam(o["bars"]) ? o["bars"] : null;
    if (barsMax !== null) {
      const savok = k.meres.elemek.filter((e) => e.tipus === "dataLabel" || e.tipus === "number");
      if (savok.length > barsMax) out.push(t(sz, undefined, `${savok.length} sáv > ${barsMax}`));
    }
  }
  const maxGroups = szam(sz.feltetel["maxGroups"]) ? (sz.feltetel["maxGroups"] as number) : null;
  if (maxGroups !== null) {
    const tablak = k.meres.elemek.filter((e) => e.tipus === "table");
    for (const e of tablak) {
      if (e.sorok > maxGroups) out.push(t(sz, e.mezo, `${e.sorok} csoport > ${maxGroups}`));
    }
  }
  return out;
};

/** not_intersect: szövegdoboz ne metssze a keep-clear dobozokat. */
const not_intersect: Ellenorzo = (sz, k) => {
  // A keep-clear dobozok nincsenek a mérésben — nem dönthető el.
  return [];
};

/** min_gap: a cím teteje a legalsó keep-clear alatt legyen. */
const min_gap: Ellenorzo = (sz, k) => {
  // A keep-clear dobozok nincsenek a mérésben — nem dönthető el.
  return [];
};

/** inside_box: a doboz teljesen benn vagy kinn legyen. */
const inside_box: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const box = sz.feltetel["box"];
  if (box && typeof box === "object" && !Array.isArray(box)) {
    const o = box as Record<string, unknown>;
    const y = o["y"];
    if (Array.isArray(y) && y.length === 2) {
      const y0 = hossz(y[0], k.meres);
      const y1 = hossz(y[1], k.meres);
      if (y0 === null || y1 === null) return [hianyzo(sz, "box.y")];
      for (const e of erintettElemek(sz, k.meres)) {
        if (kizarva(sz, e)) continue;
        const benn = e.y >= y0 - 0.5 && e.y + e.h <= y1 + 0.5;
        const kinn = e.y + e.h <= y0 + 0.5 || e.y >= y1 - 0.5;
        if (!benn && !kinn)
          out.push(t(sz, e.mezo, `részben kinn: y=${e.y.toFixed(0)}..${(e.y + e.h).toFixed(0)}`));
      }
    }
  }
  return out;
};

/** baseline: alapvonal-pozíciók. */
const baseline: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const f = sz.feltetel;
  const baselines = f["baselines"];
  if (baselines && typeof baselines === "object") {
    const o = baselines as Record<string, unknown>;
    const primary = o["primary"];
    const hatar = hossz(primary, k.meres);
    if (hatar === null) return [hianyzo(sz, "baselines.primary")];
    for (const e of erintettElemek(sz, k.meres)) {
      if (kizarva(sz, e)) continue;
      const also = e.y + e.h;
      if (Math.abs(also - hatar) > 4)
        out.push(t(sz, e.mezo, `alapvonal ${also.toFixed(0)} px ≠ ${hatar.toFixed(0)} px`));
    }
  }
  return out;
};

/** zone_clear: biztonsági sávok üresek. */
const zone_clear: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const f = sz.feltetel;
  const marginK = f["margin"];
  if (marginK !== undefined) {
    const nev = typeof marginK === "string" ? marginK.replace(/^@/, "") : "";
    const margin = hossz(feloldas(marginK, k), k.meres);
    if (margin === null) return [hianyzo(sz, nev)];
    const kivetel = Array.isArray(f["exempt"])
      ? (f["exempt"] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    for (const e of erintettElemek(sz, k.meres)) {
      if (kivetel.includes(e.tipus)) continue;
      if (e.x < margin - 0.5 || e.y < margin - 0.5 ||
          e.x + e.w > k.meres.szelesseg - margin + 0.5 ||
          e.y + e.h > k.meres.magassag - margin + 0.5)
        out.push(t(sz, e.mezo, `margón kívül: x=${e.x.toFixed(0)} y=${e.y.toFixed(0)}`));
    }
  }
  const topK = f["top"];
  const bottomK = f["bottom"];
  if (topK !== undefined || bottomK !== undefined) {
    const top = topK !== undefined ? hossz(feloldas(topK, k), k.meres) : 0;
    const bottom = bottomK !== undefined ? hossz(feloldas(bottomK, k), k.meres) : 0;
    if (top === null) return [hianyzo(sz, "top")];
    if (bottom === null) return [hianyzo(sz, "bottom")];
    for (const e of erintettElemek(sz, k.meres)) {
      if (e.y < top - 0.5 || e.y + e.h > k.meres.magassag - bottom + 0.5)
        out.push(t(sz, e.mezo, `sávban: y=${e.y.toFixed(0)}..${(e.y + e.h).toFixed(0)}`));
    }
  }
  return out;
};

/** zone_text_forbidden: tiltott zónákban ne legyen szöveg. */
const zone_text_forbidden: Ellenorzo = (sz, k) => {
  const out: Talalat[] = [];
  const zonesK = sz.feltetel["zones"];
  const zones = feloldas(zonesK, k);
  if (!zones || typeof zones !== "object") {
    const nev = typeof zonesK === "string" ? zonesK.replace(/^@/, "") : "";
    return [hianyzo(sz, nev)];
  }
  const z = zones as Record<string, unknown>;
  const ref = Array.isArray(z["ref"]) ? z["ref"] : null;
  if (!ref || ref.length !== 2) return [];
  const refW = szam(ref[0]) ? ref[0] : 1080;
  const refH = szam(ref[1]) ? ref[1] : 1920;
  const sx = k.meres.szelesseg / refW;
  const sy = k.meres.magassag / refH;
  const top = Array.isArray(z["top"]) ? z["top"] : null;
  const bottom = Array.isArray(z["bottom"]) ? z["bottom"] : null;
  const sides = szam(z["sides"]) ? z["sides"] : 0;
  const rail = z["rail"] && typeof z["rail"] === "object" ? (z["rail"] as Record<string, unknown>) : null;
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.szoveg === "") continue;
    if (top && top.length === 2) {
      const y0 = (szam(top[0]) ? top[0] : 0) * sy;
      const y1 = (szam(top[1]) ? top[1] : 0) * sy;
      if (e.y < y1 && e.y + e.h > y0) { out.push(t(sz, e.mezo, `felső zóna`)); continue; }
    }
    if (bottom && bottom.length === 2) {
      const y0 = (szam(bottom[0]) ? bottom[0] : 0) * sy;
      const y1 = (szam(bottom[1]) ? bottom[1] : 0) * sy;
      if (e.y < y1 && e.y + e.h > y0) { out.push(t(sz, e.mezo, `alsó zóna`)); continue; }
    }
    if (sides > 0) {
      const s = sides * sx;
      if (e.x < s || e.x + e.w > k.meres.szelesseg - s) { out.push(t(sz, e.mezo, `oldalsó zóna`)); continue; }
    }
    if (rail) {
      const rx = Array.isArray(rail["x"]) ? rail["x"] : null;
      const ry = Array.isArray(rail["y"]) ? rail["y"] : null;
      if (rx && rx.length === 2 && ry && ry.length === 2) {
        const x0 = (szam(rx[0]) ? rx[0] : 0) * sx;
        const x1 = (szam(rx[1]) ? rx[1] : 0) * sx;
        const y0 = (szam(ry[0]) ? ry[0] : 0) * sy;
        const y1 = (szam(ry[1]) ? ry[1] : 0) * sy;
        if (e.x < x1 && e.x + e.w > x0 && e.y < y1 && e.y + e.h > y0) {
          out.push(t(sz, e.mezo, `rail zóna`));
        }
      }
    }
  }
  return out;
};

/** forbidden_element: tiltott elem ne legyen a mérésben. */
const forbidden_element: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["tipus"] ?? sz.feltetel["element"];
  if (typeof kulcs !== "string") return [];
  const out: Talalat[] = [];
  for (const e of k.meres.elemek) {
    if (e.tipus === kulcs) out.push(t(sz, e.mezo, `${kulcs} tilos`));
  }
  return out;
};

/** forbidden_combo: tiltott kombináció. */
const forbidden_combo: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["tipusok"];
  if (!Array.isArray(kulcs)) return [];
  const tipusok = kulcs.filter((x): x is string => typeof x === "string");
  const jelen = tipusok.filter((tp) => k.meres.elemek.some((e) => e.tipus === tp));
  if (jelen.length === tipusok.length && tipusok.length > 1)
    return [t(sz, undefined, `tiltott kombináció: ${jelen.join(" + ")}`)];
  return [];
};

/** enum_only: a szöveg csak az engedélyezett értékek egyike legyen. */
const enum_only: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["values"];
  if (!Array.isArray(kulcs)) return [];
  const ertekek = kulcs.filter((x): x is string => typeof x === "string");
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (!ertekek.includes(e.szoveg)) out.push(t(sz, e.mezo, `"${e.szoveg}" ∉ {${ertekek.join(", ")}}`));
  }
  return out;
};

/** required_field: a kötelező mező legyen kitöltve. */
const required_field: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["mezo"];
  if (typeof kulcs !== "string") return [];
  if (!k.kitoltott.includes(kulcs))
    return [t(sz, kulcs, `hiányzó mező: ${kulcs}`)];
  return [];
};

/** field_consistency: a mezők konzisztensek legyenek (pl. azonos szöveg). */
const field_consistency: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["mezok"];
  if (!Array.isArray(kulcs)) return [];
  const mezok = kulcs.filter((x): x is string => typeof x === "string");
  const ertekek = mezok.map((m) => k.meres.elemek.find((e) => e.mezo === m)?.szoveg);
  const elso = ertekek[0];
  if (elso === undefined) return [];
  const out: Talalat[] = [];
  for (let i = 1; i < ertekek.length; i++) {
    if (ertekek[i] !== elso)
      out.push(t(sz, mezok[i], `"${ertekek[i] ?? ""}" ≠ "${elso}"`));
  }
  return out;
};

/** order: az elemek sorrendje. */
const order: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["tipusok"];
  if (!Array.isArray(kulcs)) return [];
  const tipusok = kulcs.filter((x): x is string => typeof x === "string");
  const out: Talalat[] = [];
  let idx = 0;
  for (const e of k.meres.elemek) {
    const i = tipusok.indexOf(e.tipus);
    if (i < 0) continue;
    if (i < idx) out.push(t(sz, e.mezo, `${e.tipus} rossz sorrendben`));
    idx = Math.max(idx, i);
  }
  return out;
};

/** stem_match: a szöveg illeszkedjen a mintára. */
const stem_match: Ellenorzo = (sz, k) => {
  const minta = sz.feltetel["pattern"];
  if (typeof minta !== "string") return [];
  let re: RegExp;
  try { re = new RegExp(minta); } catch { return []; }
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    if (!re.test(e.szoveg)) out.push(t(sz, e.mezo, `"${e.szoveg}" nem illeszkedik`));
  }
  return out;
};

/** derived_field: származtatott mező — a mérésből nem dönthető el. */
const derived_field: Ellenorzo = () => [];

/** date_format: dátumformátum — a mérésből nem dönthető el. */
const date_format: Ellenorzo = () => [];

/** grammar: nyelvtan — a mérésből nem dönthető el. */
const grammar: Ellenorzo = () => [];

/** asset_flag: fotó-metaadat — a mérésből nem dönthető el. */
const asset_flag: Ellenorzo = () => [];

/** asset_record: fotórekord — a mérésből nem dönthető el. */
const asset_record: Ellenorzo = () => [];

/** sequence_max: sorozat-szintű — a mérésből nem dönthető el. */
const sequence_max: Ellenorzo = () => [];

/** adjacency: szomszédság — a mérésből nem dönthető el. */
const adjacency: Ellenorzo = () => [];

/** repeat_window: ismétlődési ablak — a mérésből nem dönthető el. */
const repeat_window: Ellenorzo = () => [];

/** same_property_window: azonos tulajdonság ablaka — a mérésből nem dönthető el. */
const same_property_window: Ellenorzo = () => [];

/** manual: kézi ellenőrzés — a mérésből nem dönthető el. */
const manual: Ellenorzo = () => [];

/** publish_gate: publikálási kapu — a mérésből nem dönthető el. */
const publish_gate: Ellenorzo = () => [];

/** editable_text: szerkeszthető szöveg — a mérésből nem dönthető el. */
const editable_text: Ellenorzo = () => [];

/** forbidden_chars: tiltott karakterek a szövegben. */
const forbidden_chars: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["chars"];
  if (typeof kulcs !== "string") return [];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (kizarva(sz, e)) continue;
    for (const c of kulcs) {
      if (e.szoveg.includes(c)) {
        out.push(t(sz, e.mezo, `tiltott karakter: "${c}"`));
        break;
      }
    }
  }
  return out;
};

/** no_new_visual: új vizuális elem — a mérésből nem dönthető el. */
const no_new_visual: Ellenorzo = () => [];

/** field_role: a mező szerepe egyezzen. */
const field_role: Ellenorzo = (sz, k) => {
  const kulcs = sz.feltetel["szerep"];
  if (typeof kulcs !== "string") return [];
  const out: Talalat[] = [];
  for (const e of erintettElemek(sz, k.meres)) {
    if (e.szerep !== null && e.szerep !== kulcs)
      out.push(t(sz, e.mezo, `szerep: ${e.szerep} ≠ ${kulcs}`));
  }
  return out;
};

// ---- export ----------------------------------------------------------------

export const ELLENORZOK_B1: Record<string, Ellenorzo> = {
  min_size,
  fixed_size,
  size_range,
  scale_factor,
  equal_size,
  size_steps,
  ladder_order,
  max_lines,
  max_words,
  max_chars,
  max_width,
  max_width_formula,
  line_diff,
  widow,
  prefer,
  font_forbidden,
  text_case,
  ratio_max,
  color_on_ground,
  count_exact,
  count_max,
  count_min,
  no_overlap,
  dimension,
  grid,
  position,
  capacity,
  not_intersect,
  min_gap,
  inside_box,
  baseline,
  zone_clear,
  zone_text_forbidden,
  forbidden_element,
  forbidden_combo,
  enum_only,
  required_field,
  field_consistency,
  order,
  stem_match,
  derived_field,
  date_format,
  grammar,
  asset_flag,
  asset_record,
  sequence_max,
  adjacency,
  repeat_window,
  same_property_window,
  manual,
  publish_gate,
  editable_text,
  forbidden_chars,
  no_new_visual,
  field_role,
};

/** Azok a szabály-azonosítók, amelyeket a mérésből NEM lehet eldönteni (hiányzik hozzá adat). */
export const NEM_DONTHETO_B1: Record<string, string> = {
  F3: "a fotó keep-clear dobozai (arc, kéz, tükörződés) nincsenek a mérésben",
  F4: "a keep-clear dobozok alsó éle nincs a mérésben",
  F5: "a slot/sáv geometriája és a keep-clear dobozok nincsenek a mérésben",
  F10: "a scrim-görbék pontjai nincsenek a mérésben",
  F19: "a portré-zoom és az arc pozíciója nincs a mérésben",
  F20: "a fotó-régió szín-hasonlósága nincs a mérésben",
  B4: "a platform reel-zónái és a felirat-sáv nincsenek a mérésben",
  B5: "a középső 1:1 vágás és a lábléc zónája nincs a mérésben",
  B6: "a profilrács kivágása nincs a mérésben",
  B7: "a carousel-dia zóna-alapvonalai nincsenek a mérésben",
  B8: "a feliratlemez és a rail geometriája nincs a mérésben",
  B9: "a lower third és speaker-ID alapvonalai nincsenek a mérésben",
  A11: "a naptár-csoportosítás és a folytatás-sor nincs a mérésben",
  A12: "a diagram fókusz/kontextus színei nincsenek a mérésben",
  M13: "a fotó zajos része és a scrim-opacitás nincs a mérésben",
  K5: "az embléma pozíciója és a lockup-tiltás a mérésből nem dönthető el",
};
