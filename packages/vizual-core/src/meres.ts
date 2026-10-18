// A mérés: amit a böngésző a kész lapról visszaad. Ebből dönt az illesztés és a szabályellenőrző.
// A mérést a befogadó végzi (host.ts: Mero) — a mag csak az alakját ismeri.

/** A szabályrendszer mezőtípusai (szabalyok.json: szotarak.mezoTipus). */
export type SzabalyMezoTipus =
  | "headline"
  | "lead"
  | "body"
  | "list"
  | "table"
  | "label"
  | "kicker"
  | "metadata"
  | "source"
  | "number"
  | "dataLabel"
  | "subtitle"
  | "quote"
  | "cta"
  | "placeholder"
  | "photo"
  | "signal"
  | "emblem"
  | "lockup"
  | "chart"
  | "caption"
  | "name"
  | "role";

/** Egy kirajzolt szöveg- vagy arculati elem, ahogy a böngésző látta. */
export interface ElemMeres {
  /** a recept mezője (pl. "focim") */
  mezo: string;
  /** "elsodleges" | "masodlagos" | "par" | "kod" | "nev" | "-" | sor- vagy elemazonosító */
  nyelv: string;
  /** a szabályrendszer mezőtípusa (a recept mezőjéből képezve, lásd mezoTipus) */
  tipus: SzabalyMezoTipus;
  szerep: "hang" | "tajekoztatas" | "technikai" | null;
  /** a látható szöveg (arculati elemnél üres) */
  szoveg: string;
  /** a számított betűcsalád első neve */
  csalad: string;
  /** a betűcsalád monospace-e (a befogadó méri: az „i” és az „M” szélessége egyezik-e) */
  monospace: boolean;
  suly: number;
  meret_px: number;
  sorkoz_px: number;
  betukoz_px: number;
  nagybetus: boolean;
  tabularis: boolean;
  /** #rrggbb */
  szin: string;
  /** a mögötte álló legközelebbi kitöltött háttér, #rrggbb */
  hatter: string;
  sorok: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** vízszintesen kilóg-e a dobozából (nem tördelhető sor) */
  kilog: boolean;
  /** a szöveg nyelvenként (egysoros párnál [elsődleges, másodlagos]; különben [szöveg]) */
  nyelvi: string[];
  /** lemezen/sávon áll-e (pl. a teljes szélességű állapotsáv) — a margószabály alól kivétel */
  lemez: boolean;
  /** az utolsó sor szövege (az árva sor vizsgálatához) */
  utolso_sor: string;
  /** az utolsó sor szélessége a leghosszabb sorhoz képest (0–1) */
  utolso_sor_arany: number;
}

export interface LapMeres {
  szelesseg: number;
  magassag: number;
  /** ennyi px-szel lóg ki a tartalom a lap aljából (0 = elfér) */
  tullepes_px: number;
  elemek: ElemMeres[];
}

/** A recept mezője → a szabályrendszer mezőtípusa. Ismeretlen mező: "body". */
export function mezoTipus(mezo: string, nyelv: string): SzabalyMezoTipus {
  switch (mezo) {
    case "focim":
      return "headline";
    case "magyarazat":
      return "body";
    case "rovat_cimke":
      return "kicker";
    case "allapot_ikon":
      return "placeholder";
    case "allapot_cimke":
    case "nap":
      return "label";
    case "jarat":
      return nyelv === "kod" ? "number" : "label";
    case "idoszak":
      return "number";
    case "reszletek":
      return "table";
    case "savok":
      return nyelv.startsWith("ertek") ? "number" : nyelv.startsWith("sav") ? "chart" : "dataLabel";
    case "mertek_magyarazat":
      return "caption";
    case "forras":
      return "source";
    case "azonosito_sor":
      return "metadata";
    case "jelzes":
      return "signal";
    case "emblema":
      return "emblem";
    default:
      return "body";
  }
}

/**
 * A böngészőben futó mérőszkript szövege. A befogadó a kész lapon futtatja
 * (pl. page.evaluate(MERO_SZKRIPT)), és a visszaadott nyers listát adja a mérés-összeállítónak.
 * Tiszta adat — a mag nem futtatja.
 */
export const MERO_SZKRIPT = `(() => {
  const hex = (c) => { const m = c.match(/\\d+(\\.\\d+)?/g); if (!m) return "#000000";
    return "#" + m.slice(0,3).map(v => Math.round(+v).toString(16).padStart(2,"0")).join(""); };
  const atlatszo = (c) => c === "transparent" || /rgba\\(.*,\\s*0\\)$/.test(c);
  const hatter = (el) => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (b && !atlatszo(b)) return hex(b); } return "#ffffff"; };
  const monoCache = {};
  const mono = (csalad, suly) => { const k = csalad + suly; if (k in monoCache) return monoCache[k];
    const c = document.createElement("canvas").getContext("2d"); c.font = suly + " 40px " + csalad;
    return (monoCache[k] = Math.abs(c.measureText("iiii").width - c.measureText("MMMM").width) < 0.5); };
  const lap = document.querySelector("[data-lap]");
  const lr = lap.getBoundingClientRect();
  // túllépés: a tartalom alja a tartalomdoboz (a belső margón belüli rész) alja alatt — a belső margóba lógás is túllépés
  let tul = 0;
  for (const o of document.querySelectorAll("[data-oszlop]")) {
    const ocs = getComputedStyle(o); const or = o.getBoundingClientRect();
    const alja = or.bottom - parseFloat(ocs.paddingBottom) - parseFloat(ocs.borderBottomWidth);
    let legalso = -Infinity;
    for (const g of o.children) { const gr = g.getBoundingClientRect(); if (gr.height > 0) legalso = Math.max(legalso, gr.bottom + parseFloat(getComputedStyle(g).marginBottom || "0")); }
    tul = Math.max(tul, o.scrollHeight - o.clientHeight, legalso - alja);
  }
  const elemek = [];
  for (const el of document.querySelectorAll("[data-mezo]")) {
    if (el.querySelector("[data-mezo]")) continue; // csak a legbelső, valóban kirajzolt elemet mérjük
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const fs = parseFloat(cs.fontSize); const lh = cs.lineHeight === "normal" ? fs * 1.2 : parseFloat(cs.lineHeight);
    const csalad = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    const szoveg = (el.innerText || "").trim();
    const nyelv = el.getAttribute("data-nyelv") || "-";
    // a szöveg valódi doboza (nem a nyújtott elemé) és a sorok a Range soronkénti téglalapjaiból
    let tr = r, sorTeglak = [];
    if (szoveg) { const rg = document.createRange(); rg.selectNodeContents(el); tr = rg.getBoundingClientRect();
      const sorMap = new Map(); for (const q of rg.getClientRects()) { if (q.width < 1) continue; const k = Math.round(q.top / (lh / 2));
        const v = sorMap.get(k); sorMap.set(k, v ? { l: Math.min(v.l, q.left), r: Math.max(v.r, q.right), t: Math.min(v.t, q.top) } : { l: q.left, r: q.right, t: q.top }); }
      sorTeglak = [...sorMap.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]); }
    const leghosszabb = Math.max(1, ...sorTeglak.map((q) => q.r - q.l));
    const utolso = sorTeglak.length ? sorTeglak[sorTeglak.length - 1] : null;
    let utolsoSor = "";
    if (utolso && szoveg) {
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const szoPoz = []; let n;
      while ((n = tw.nextNode())) { const re = /\S+/g; let m; while ((m = re.exec(n.textContent))) szoPoz.push([n, m.index, m[0]]); }
      const rg2 = document.createRange(); const vege = [];
      for (let i = szoPoz.length - 1; i >= 0; i--) { const [nn, ix, sz] = szoPoz[i]; rg2.setStart(nn, ix); rg2.setEnd(nn, ix + sz.length);
        if (Math.abs(rg2.getBoundingClientRect().top - utolso.t) < lh / 2) vege.unshift(sz); else break; }
      utolsoSor = vege.join(" "); }
    const masod = el.querySelector("span[lang]");
    const nyelvi = masod && szoveg ? [szoveg.slice(0, szoveg.lastIndexOf(masod.innerText.trim())).replace(/[\s·|/]+$/, "").trim(), masod.innerText.replace(/^[\s·]+/, "").trim()]
      : el.querySelector("br") ? (el.innerText || "").split("\\n").map((x) => x.trim()).filter(Boolean) : (szoveg ? [szoveg] : []);
    elemek.push({ mezo: el.getAttribute("data-mezo"), nyelv, szoveg, csalad, monospace: szoveg ? mono(csalad, cs.fontWeight) : false,
      suly: +cs.fontWeight, meret_px: fs, sorkoz_px: lh, betukoz_px: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
      nagybetus: cs.textTransform === "uppercase", tabularis: cs.fontVariantNumeric.includes("tabular-nums"),
      szin: hex(cs.color), hatter: hatter(el), sorok: szoveg ? Math.max(1, sorTeglak.length || Math.round(r.height / lh)) : 0,
      // vízszintesen a szöveg valódi szélessége, függőlegesen az elem (sor)doboza — a betűk túlnyúlása nem átfedés
      x: (szoveg ? tr.x : r.x) - lr.x, y: r.y - lr.y, w: szoveg ? tr.width : r.width, h: r.height, kilog: el.scrollWidth > el.clientWidth + 1,
      nyelvi, lemez: !!el.closest("[data-sav]"), utolso_sor: utolsoSor,
      utolso_sor_arany: utolso ? (utolso.r - utolso.l) / leghosszabb : 1 });
  }
  return { szelesseg: lr.width, magassag: lr.height, tullepes_px: Math.max(0, Math.round(tul)), elemek };
})()`;

/**
 * A böngésző nyers mérését kiegészíti a szabályrendszer mezőtípusával és a szereppel.
 * A szerep a TÉNYLEGESEN használt betűcsaládból jön (a márka három szerep-betűje közül),
 * nem a recept szándékából — így a mérés azt mondja, ami a képen van.
 */
export function meresOsszeallit(
  nyers: Omit<LapMeres, "elemek"> & { elemek: Omit<ElemMeres, "tipus" | "szerep">[] },
  betuk: { hang: string; tajekoztatas: string; technikai: string },
): LapMeres {
  const szerepe = (csalad: string): ElemMeres["szerep"] =>
    csalad === betuk.hang ? "hang" : csalad === betuk.tajekoztatas ? "tajekoztatas" : csalad === betuk.technikai ? "technikai" : null;
  return {
    ...nyers,
    elemek: nyers.elemek.map((e) => ({ ...e, tipus: mezoTipus(e.mezo, e.nyelv), szerep: e.szoveg ? szerepe(e.csalad) : null })),
  };
}

/** A recept családja → a szabályrendszer családneve (szabalyok.json kulcs-előtagjai). */
export function szabalyCsalad(receptCsalad: string): string {
  if (receptCsalad === "adat") return "data";
  return "statement";
}
