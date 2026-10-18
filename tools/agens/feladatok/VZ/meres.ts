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
      return nyelv.startsWith("ertek") ? "number" : "dataLabel";
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
  let tul = 0;
  for (const o of document.querySelectorAll("[data-oszlop]")) tul = Math.max(tul, o.scrollHeight - o.clientHeight);
  const elemek = [];
  for (const el of document.querySelectorAll("[data-mezo]")) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const fs = parseFloat(cs.fontSize); const lh = cs.lineHeight === "normal" ? fs * 1.2 : parseFloat(cs.lineHeight);
    const csalad = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    const szoveg = (el.innerText || "").trim();
    const nyelv = el.getAttribute("data-nyelv") || el.getAttribute("data-sor") || (el.hasAttribute("data-elem") ? "elem" + el.getAttribute("data-elem") : "-");
    elemek.push({ mezo: el.getAttribute("data-mezo"), nyelv, szoveg, csalad, monospace: szoveg ? mono(csalad, cs.fontWeight) : false,
      suly: +cs.fontWeight, meret_px: fs, sorkoz_px: lh, betukoz_px: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
      nagybetus: cs.textTransform === "uppercase", tabularis: cs.fontVariantNumeric.includes("tabular-nums"),
      szin: hex(cs.color), hatter: hatter(el), sorok: szoveg ? Math.max(1, Math.round(r.height / lh)) : 0,
      x: r.x - lr.x, y: r.y - lr.y, w: r.width, h: r.height, kilog: el.scrollWidth > el.clientWidth + 1 });
  }
  return { szelesseg: lr.width, magassag: lr.height, tullepes_px: Math.max(0, Math.round(tul)), elemek };
})()`;

/** A böngésző nyers mérését kiegészíti a szabályrendszer mezőtípusával és a szereppel. */
export function meresOsszeallit(
  nyers: Omit<LapMeres, "elemek"> & { elemek: Omit<ElemMeres, "tipus" | "szerep">[] },
  szerepek: Record<string, ElemMeres["szerep"]>,
): LapMeres {
  return {
    ...nyers,
    elemek: nyers.elemek.map((e) => ({
      ...e,
      tipus: mezoTipus(e.mezo, e.nyelv),
      szerep: szerepek[`${e.mezo}/${e.nyelv}`] ?? szerepek[e.mezo] ?? null,
    })),
  };
}
