import "server-only";
import { AiHiba, type HivasMeres } from "@km/ai-adapters";
import { szolgaltato, keretEllenoriz, meresRogzit, prompt, jsonRobusztusan, AiKozosHiba } from "../ai";
import { profilBetolt } from "../profil";
import { tipusOf } from "../profil/tipus-szabaly";
import { IRANYTU_HATAR, type IranytuSema } from "@km/contracts";
import { vag } from "./vag";

export class IranytuJavaslatHiba extends Error {
  constructor(
    public readonly kod: "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_KIKAPCSOLVA" | "ERVENYTELEN_ADAT",
    public readonly mezok?: Record<string, string>,
  ) {
    super(kod);
    this.name = "IranytuJavaslatHiba";
  }
}

export type JavaslatBlokk = "celok" | "vizio" | "ertekek" | "idoszakok" | "tolni" | "kerulni" | "mind";

/** A havi keret ellenőrzése a javaslat-hívás előtt — a kimerült keret itt is 429, nem belső hiba. */
async function keretVagyIranytuHiba(szervezetId?: string, fiokId?: string): Promise<void> {
  try {
    await keretEllenoriz(szervezetId, fiokId);
  } catch (h) {
    if (h instanceof AiKozosHiba) throw new IranytuJavaslatHiba(h.kod);
    throw h;
  }
}

type NyersCel = { nev?: unknown; miert?: unknown; mikorra?: unknown; mirol_tudod?: unknown };
type NyersErtek = { nev?: unknown; magyarazat?: unknown };
type NyersIdoszak = { nev?: unknown; mettol?: unknown; meddig?: unknown; mit?: unknown };
type NyersTolni = { nev?: unknown };
type NyersValasz = {
  celok?: unknown;
  vizio?: unknown;
  ertekek?: unknown;
  idoszakok?: unknown;
  tolni?: unknown;
  tiltott_szavak?: unknown;
  kerulendo_temak?: unknown;
};

function szoveg(v: unknown, max?: number): string {
  const t = typeof v === "string" ? v.trim() : "";
  return max === undefined ? t : vag(t, max);
}


function celokatAlakit(nyers: unknown): IranytuSema["celok"] {
  if (!Array.isArray(nyers)) return [];
  const ki: IranytuSema["celok"] = [];
  for (const elem of nyers) {
    const c = elem as NyersCel;
    const nev = szoveg(c.nev, IRANYTU_HATAR.nev);
    if (!nev) continue;
    ki.push({
      id: crypto.randomUUID(),
      nev,
      miert: szoveg(c.miert, IRANYTU_HATAR.miert),
      mikorra: szoveg(c.mikorra, IRANYTU_HATAR.mikorra),
      mirol_tudod: szoveg(c.mirol_tudod, IRANYTU_HATAR.mirol_tudod),
      forras: "ai",
    });
  }
  return ki;
}

function ertekeketAlakit(nyers: unknown): IranytuSema["ertekek"] {
  if (!Array.isArray(nyers)) return [];
  const ki: IranytuSema["ertekek"] = [];
  for (const elem of nyers) {
    const e = elem as NyersErtek;
    const nev = szoveg(e.nev, IRANYTU_HATAR.nev);
    if (!nev) continue;
    ki.push({
      id: crypto.randomUUID(),
      nev,
      magyarazat: szoveg(e.magyarazat, IRANYTU_HATAR.magyarazat),
      forras: "ai",
    });
  }
  return ki;
}

function idoszakokatAlakit(nyers: unknown): IranytuSema["idoszakok"] {
  if (!Array.isArray(nyers)) return [];
  const ki: IranytuSema["idoszakok"] = [];
  for (const elem of nyers) {
    const i = elem as NyersIdoszak;
    const nev = szoveg(i.nev, IRANYTU_HATAR.nev);
    if (!nev) continue;
    ki.push({
      id: crypto.randomUUID(),
      nev,
      mettol: szoveg(i.mettol),
      meddig: szoveg(i.meddig),
      mit: szoveg(i.mit, IRANYTU_HATAR.mit),
      forras: "ai",
    });
  }
  return ki;
}

function tolniAlakit(nyers: unknown): IranytuSema["tolni"] {
  if (!Array.isArray(nyers)) return [];
  const ki: IranytuSema["tolni"] = [];
  for (const elem of nyers) {
    const t = elem as NyersTolni;
    const nev = szoveg(t.nev, IRANYTU_HATAR.nev);
    if (!nev) continue;
    ki.push({
      id: crypto.randomUUID(),
      nev,
      forras: "ai",
    });
  }
  return ki;
}

function szovegListatAlakit(nyers: unknown, max: number): string[] {
  if (!Array.isArray(nyers)) return [];
  const ki: string[] = [];
  for (const elem of nyers) {
    const s = szoveg(elem, max);
    if (s) ki.push(s);
  }
  return ki;
}

/** A kért blokk(ok) kiszedése a nyers válaszból és IranytuSema szerinti alakra hozása. */
function blokkotKiszed(nyers: NyersValasz, blokk: JavaslatBlokk): Partial<IranytuSema> {
  const ki: Partial<IranytuSema> = {};
  const kell = (b: Exclude<JavaslatBlokk, "mind">): boolean => blokk === "mind" || blokk === b;

  if (kell("celok")) ki.celok = celokatAlakit(nyers.celok);
  if (kell("vizio")) ki.vizio = szoveg(nyers.vizio, IRANYTU_HATAR.vizio);
  if (kell("ertekek")) ki.ertekek = ertekeketAlakit(nyers.ertekek);
  if (kell("idoszakok")) ki.idoszakok = idoszakokatAlakit(nyers.idoszakok);
  if (kell("tolni")) ki.tolni = tolniAlakit(nyers.tolni);
  if (kell("kerulni")) {
    ki.tiltott_szavak = szovegListatAlakit(nyers.tiltott_szavak, IRANYTU_HATAR.tiltott_szo);
    ki.kerulendo_temak = szovegListatAlakit(nyers.kerulendo_temak, IRANYTU_HATAR.tema);
  }
  return ki;
}

export async function iranytutJavasol(
  szervezetId: string,
  blokk: JavaslatBlokk,
  felulet: string,
  fiokId?: string, // R-13: a kérő — az ő kreditjéből
): Promise<Partial<IranytuSema>> {
  const profil = await profilBetolt(szervezetId);
  if (!profil) throw new IranytuJavaslatHiba("ERVENYTELEN_ADAT", { profil: "hianyzik" });

  // A tartalomnyelv a profil első tartalomnyelve; ha nincs, a felület nyelve.
  const tnyelv = profil.nyelvek[0] ?? felulet;

  const feladatSorok: string[] = [];
  if (profil.nev?.trim()) feladatSorok.push(`A szervezet neve: ${profil.nev.trim()}`);
  if (profil.osszefoglalo?.trim()) feladatSorok.push(`Tevékenység-összefoglaló: ${profil.osszefoglalo.trim()}`);
  if (profil.celkozonseg?.trim()) feladatSorok.push(`Célközönség: ${profil.celkozonseg.trim()}`);
  if (profil.cel?.trim()) feladatSorok.push(`Kommunikációs cél: ${profil.cel.trim()}`);
  if (profil.hangnem_leiras.trim()) feladatSorok.push(`Hangnem: ${profil.hangnem_leiras.trim()}`);
  if (profil.hangnem_minta.trim()) feladatSorok.push(`Hangnem-minta a cég szavaival: ${profil.hangnem_minta.trim()}`);
  if (Array.isArray(profil.nyelvek) && profil.nyelvek.length > 0) {
    feladatSorok.push(`Tartalomnyelvek: ${profil.nyelvek.join(", ")}`);
  }
  feladatSorok.push(`Kért blokk: ${blokk}`);

  await keretVagyIranytuHiba(szervezetId, fiokId);

  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({
      feladat: "iranytu_javaslat",
      rendszer: await prompt("iranytu_javaslat", felulet, tnyelv, tipusOf(profil)), // c30 F12: fesztiválnál „a fesztivál”
      szoveg: feladatSorok.join("\n"),
      nyelv: felulet,
      // 2026-09-21 MÉRVE (Vilmos munkaterén): 900 tokennél a gpt-5-mini üres választ adott (finish_reason: length) —
      // a bővebb profil (hosszú hangnem) mellett a teljes iránytű nem fért bele. A keret a felső határ, nem a költség.
      maxKiToken: blokk === "mind" ? 4000 : 2000,
      idokorlatMs: 55_000, // az nginx 60 mp-nél vág
    });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const nyers = jsonRobusztusan(v.szoveg);
    const elemzett = JSON.parse(nyers) as NyersValasz;
    return blokkotKiszed(elemzett, blokk);
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = {
      szolgaltato: sz.leirolap.azonosito,
      modell: sz.leirolap.modell,
      feladat: "iranytu_javaslat",
      tokenek_be: 0,
      tokenek_ki: 0,
      becsult_usd: 0,
      ido_ms: Date.now() - t0,
      allapot: "hiba",
      hiba_kod: kod,
    };
    await meresRogzit(szervezetId, meres);
    if (kod === "AI_KERET_KIMERULT") throw new IranytuJavaslatHiba("AI_KERET_KIMERULT");
    console.error("AI-hívás sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
    throw new IranytuJavaslatHiba("AI_NEM_ELERHETO", { ok: kod });
  }
}
