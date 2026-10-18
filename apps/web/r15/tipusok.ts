// R-15 · 2. szállítmány (03 Kezdőlap · 04 Hírek · 08 Posztszöveg) — a lapok adat-szerződése.
// Rajz: design/R15/rajz/R15-lapok-1.dc.html · gépezet: design/R15/gepezet.md (a sorszámok arra hivatkoznak).
// Tiszta típusok: kiszolgálón és kliensen is importálható.

export type R15Felulet = "fb" | "ig" | "li" | "blog"; // R-17 C: + „Blog / honlap”

/** T8 — a heti haladás (gepezet 2). `arany` = kész / (kész + váró), 0..1. */
export type R15Halad = { poszt_kesz: number; kep_letoltve: number; varo: number; arany: number };

/** Egy „Vár rád” poszt (gepezet 4, 5). `van_szoveg`: false → a 08 lap „Írjuk a posztot…” állapotban nyílik (gepezet 1). */
export type R15VaroPoszt = {
  id: string;
  /** 1–2 szavas rövid név („Díszburkolat”) — a gép írja; ha még nincs, a hír rövid címe */
  rovid_nev: string;
  /** a kiváltó hír címe (a kártya nagy sora a Kezdőlapon: a poszt első sora, ha van) */
  forras_cim: string;
  /** a poszt első sora (a Kezdőlap nagy kártyájának címe) és a második mondat eleje */
  elso_sor: string;
  /** VJ-1011 (T5): a nagy sor telefonos változata, legfeljebb 8 szó (+ „…”) — a teljes szöveg egy koppintásra, a „Megnézem a posztot” mögött */
  elso_sor_rovid: string;
  masodik_sor: string;
  van_szoveg: boolean;
  forras_tipus: "hir" | "terv" | "belso" | "sajat";
  /** gepezet-2 1 — a bemutatkozó poszt (eredet = profil, `szamol.ts` BEMUTATKOZO_AZONOSITO). A 03a szövegei ebből döntenek. */
  bemutatkozo: boolean;
};

/** gepezet-2 5–6 — a napi hírfigyelés: be · ki · nincs (még nincs hírfigyelő-beállítás; „Bekapcsolom” ilyenkor nem tud mit tenni). */
export type R15NapiFigyeles = "be" | "ki" | "nincs";

/**
 * gepezet-2 2 — a Kezdőlap állapota (`kezdolapAllapot`, szamol.ts):
 * elso = 03a (az egyetlen váró poszt a bemutatkozó, és még soha nem lett kész poszt) · dolgos = 03b (N ≥ 1) ·
 * kesz = 03c (N = 0, a héten volt kész munka) · munkad = 03c kész-pillanat nélkül („Mutasd meg a legutóbbi munkádat”).
 */
export type R15KezdolapAllapot = "elso" | "dolgos" | "kesz" | "munkad";

export type R15KeszPoszt = { id: string; rovid_nev: string; forras_tipus: "hir" | "terv" | "belso" | "sajat" };

/** A Kezdőlap „Még vár” listájának apró teendői (gepezet 7). Csak akkor jönnek, ha valóban van dolog. */
export type R15Teendo =
  | { kod: "poszt"; poszt: R15VaroPoszt }
  | { kod: "napi_figyeles" } // a napi hírfigyelés ki van kapcsolva → „Bekapcsolom” (PUT /api/r15/napi-figyeles)
  | { kod: "celok" }; // nincs jóváhagyott iránytű-cél → „Megírom” (/iranytu)

/** 03 Kezdőlap. */
export type R15Kezdolap = {
  /** a „Vár rád” posztok, a legújabb elöl (a nagy kártya = varo[0]) */
  varo: R15VaroPoszt[];
  /** a „Még vár” lista: a többi váró poszt, aztán az apró teendők */
  meg_var: R15Teendo[];
  halad: R15Halad;
  /** gepezet 9 — az utolsó gyűjtés napokban (0 = ma, 1 = tegnap); null = még soha */
  utolso_kereses_nap: number | null;
  /** szerkesztheti-e (a néző nem nyomhat „Bekapcsolom”-ot) */
  szerkeszthet: boolean;
  /** gepezet-2 2 */
  allapot: R15KezdolapAllapot;
  /** gepezet-2 6 — a 03c alcíme ettől függ (be → „Holnap reggel hozzuk…”, különben nincs alcím) */
  napi_figyeles: R15NapiFigyeles;
  /** c30 F8 (rajz D7a): a fesztivál esedékes, horgonyzott ötletei (ma … ma + 2, legfeljebb 3), amelyekből még nem lett poszt — cégnél üres */
  otletek?: R15HorgonyOtlet[];
};

/** c30 F8: egy horgonyzott ötlet a Kezdőlapon / a Naptárban (program/horgony.ts HorgonyOtlet + `ma`: ma esedékes-e). */
export type R15HorgonyOtlet = {
  nap: string; fajta: string; cel_nap: string | null; program_id?: string; nevek: string[]; hatra?: number; kulcs: string; ma: boolean; /** a szervezet első tartalomnyelve — ezen nyílik a poszt */ nyelv: string;
};

/** 04 Hírek — egy kártya: csak érdekes (nem kiszűrt, nem elrejtett) hír az „Új” csoportból (gepezet 8). */
export type R15HirKartya = {
  talalat_id: string;
  /** a hírforrás rövid neve (domain, www. nélkül) */
  forras_nev: string;
  url: string;
  /** gepezet 11 — a kártyán a rövid cím (≤ 8 szó); a teljes cím a Részletekben */
  rovid_cim: string;
  cim: string;
  /** „Ötlet: …” — egy sor, ≤ 10 szó; üres, ha még nincs poszt */
  otlet: string;
  /** a hozzá írt poszt; null → a gomb megnyomásakor készül (POST /api/r15/hirek/{talalat_id}/poszt) */
  munka_id: string | null;
  mentett: boolean;
};

/** c5 · 05 Hír részletei (design/R15/rajz/R15-lapok-4.dc.html 05; gepezet-4 · 3): egy hír kártyája (a néző szemével) + a hozzá írt poszt. */
export type R15HirReszlet = {
  kartya: import("@km/news-monitor-core").Kartya;
  /** a hírhez már írt poszt munkája; null → a gomb megnyomásakor készül (POST /api/r15/hirek/{talalat_id}/poszt) */
  munka_id: string | null;
  /** a felület nyelve, amire a kártya címe fordítva van (a forrás nyelvének jelzéséhez) */
  tartalom_nyelv: string;
};

export type R15Hirek = {
  kartyak: R15HirKartya[];
  halad: R15Halad;
  utolso_kereses_nap: number | null;
  /** fut-e most gyűjtés (a „Keress most új híreket” ilyenkor nem nyomható) */
  fut: boolean;
  /** kiszűrt hírek száma — a 04a alcíme (gepezet-2 7), ha > 0 */
  kihagyott: number;
  szerkeszthet: boolean;
  /** gepezet-2 5 — be → „Holnap reggel újra nézzük.”; ki → „Friss hírek minden reggel · Bekapcsolom” */
  napi_figyeles: R15NapiFigyeles;
  /** gepezet-2 5 — az ELSŐ gyűjtés fut még (fut, és lezárt gyűjtés még nincs) → „Keressük az első híreiteket” */
  elso_gyujtes: boolean;
};

/** 08 Posztszöveg — a bal oldali lista (gepezet 4). */
export type R15PosztLista = { varo: R15VaroPoszt[]; kesz: R15KeszPoszt[] };

/** „Kész, másolom” válasza (gepezet 3). */
export type R15KeszValasz = {
  /** a poszt ezen a héten hányadik kész (1 = az első) */
  heti_sorszam: number;
  /** a következő váró poszt; null → a fő gomb a Kezdőlapra visz */
  kovetkezo_id: string | null;
  varo_db: number;
  felulet: R15Felulet;
  halad: R15Halad;
};

/** 08c — egy kép a „Kész képeim” közül (gepezet 18). `url`: a kép maga (a tag láthatja). */
export type R15Kep = { id: string; nev: string; url: string; feltoltve: string };

/** 08b — a cég az előnézetben (gepezet 13): ha nincs logó, a kezdőbetűk látszanak a körben. */
export type R15Ceg = { nev: string; kezdobetuk: string; logo_url: string | null; felhasznalo: string; /** R-17 C2: a honlap címe a cikk-előnézethez (üres: nem ismert) */ honlap?: string };
