import "server-only";
import { AiHiba, type HivasMeres } from "@km/ai-adapters";
import { fajlOlvas } from "@km/fajl-core";
import { nyersBajtok, weboldalSzoveg } from "@km/letolto";
import type { ProgramTetel, ProgramTetelMezok } from "@km/contracts";
import { randomUUID } from "node:crypto";
import { AiKozosHiba, jsonRobusztusan, keretEllenoriz, meresRogzit, prompt, szolgaltato } from "../ai";
import { fajlKornyezet } from "../fajl";
import { mellekletOlvas, type Melleklet } from "../onboarding/kepolvaso";
import { profilTar } from "../profil/tar";
import { olvasasAllapot, type ProgramOlvasas } from "./allapot";
import { docxSzoveg, zipFej, type DocxHiba } from "./docx";
import { programTisztit, type TisztaTetel } from "./szabaly";
import { programTar, ProgramTarHiba, type OlvasMerleg } from "./tar";

// c30 F5 (terv §1.4, §3, §10 F5): a rendezvény programjának beolvasása — link (weboldal, vagy egy PDF / kép / .docx a neten),
// feltöltött PDF vagy fotó (a meglévő fájltárból, a feltöltéskor már ellenőrizve), vagy Word (.docx, a kérés törzsében; csak a
// szövege, docx.ts). A gép (prompts/program_kiolvasas.hu.md) JSON-t ad; a szabály (szabaly.ts) takarít; a tár (tar.ts) az újraolvasás
// tervével ír — a személy keze nyomát soha nem írja felül. Nincs felület (az az F6).

export class ProgramHiba extends Error {
  constructor(readonly kod: "ERVENYTELEN_ADAT" | "NINCS_SZOVEG" | "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "TUL_SOK" | "NINCS_ILYEN" | DocxHiba) {
    super(kod);
  }
}

type Hivo = { szervezetId: string; fiokId: string };
const BEMENET_MAX = 40_000;
const LINK_TIPUS = /^\s*(application\/pdf|image\/(png|jpeg|webp)|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/(zip|octet-stream))\s*(;|$)/i;

function evMost(): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric" }).format(new Date()));
}

async function kiegeszites(szervezetId: string, ev: number): Promise<{ szoveg: string; nyelv: string }> {
  const p = await profilTar.betolt(szervezetId).catch(() => null);
  const nyelvek = (p?.nyelvek ?? []).filter(Boolean);
  return {
    nyelv: nyelvek[0] ?? "hu",
    szoveg: [`A szervezet: ${p?.nev ?? ""}`, `A program nyelvei: ${nyelvek.join(", ") || "hu"}`, `A rendezvény éve: ${ev}`].join("\n"),
  };
}

/** Szöveges forrás (docx, weboldal) → a gép JSON-ja. Hibánál ProgramHiba. */
async function szovegbol(h: Hivo, szoveg: string, ev: number): Promise<unknown> {
  const k = await kiegeszites(h.szervezetId, ev);
  try {
    await keretEllenoriz(h.szervezetId, h.fiokId);
  } catch (e) {
    if (e instanceof AiKozosHiba) throw new ProgramHiba("AI_KERET_KIMERULT");
    throw e;
  }
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({
      feladat: "program_kiolvasas", rendszer: await prompt("program_kiolvasas", "hu", k.nyelv),
      szoveg: `${k.szoveg}\n\nA program szövege:\n${szoveg.slice(0, BEMENET_MAX)}`, nyelv: k.nyelv, maxKiToken: 16_000, idokorlatMs: 300_000, // F6b: a háttérben fut — egy nagy program 60–120 s, a gépnek bőven jut idő
    });
    await meresRogzit(h.szervezetId, v.meres, h.fiokId);
    return JSON.parse(jsonRobusztusan(v.szoveg));
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "program_kiolvasas", tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod };
    await meresRogzit(h.szervezetId, meres).catch(() => undefined);
    console.error("[program] a gép nem olvasta ki:", kod, hiba instanceof Error ? hiba.message : hiba);
    throw new ProgramHiba(kod === "AI_KERET_KIMERULT" ? "AI_KERET_KIMERULT" : "AI_NEM_ELERHETO");
  }
}

/** PDF / fotó → a képolvasó gép JSON-ja. */
async function mellekletbol(h: Hivo, mellekletek: Melleklet[], ev: number): Promise<unknown> {
  const k = await kiegeszites(h.szervezetId, ev);
  const v = await mellekletOlvas(h.szervezetId, { feladat: "program_kiolvasas", promptFajl: "program_kiolvasas", nyelv: k.nyelv, mellekletek, kiegeszites: k.szoveg }, h.fiokId);
  if (!v) throw new ProgramHiba("AI_NEM_ELERHETO");
  try {
    return JSON.parse(jsonRobusztusan(v));
  } catch {
    throw new ProgramHiba("AI_NEM_ELERHETO");
  }
}

function docxbol(b: Uint8Array): string {
  const r = docxSzoveg(b);
  if (!r.ok) throw new ProgramHiba(r.hiba);
  if (!r.szoveg.trim()) throw new ProgramHiba("NINCS_SZOVEG");
  return r.szoveg;
}

export type OlvasForras = { link?: string; fajlok?: string[]; docx?: Uint8Array; ev?: number; forrasFajta?: "link" | "pdf" | "word" | "foto" };

/** A gép válasza a forrásból (még takarítás és írás nélkül) — a végpont és a próba is ezt hívja. */
export async function programNyers(h: Hivo, be: OlvasForras, ev: number): Promise<unknown> {
  if (be.docx) return szovegbol(h, docxbol(be.docx), ev);
  if (be.fajlok?.length) {
    const ktx = { fiok_id: h.fiokId, szervezet_id: h.szervezetId, szerep: "szerkeszto" as const };
    const mellekletek: Melleklet[] = [];
    for (const id of be.fajlok.slice(0, 6)) {
      const f = await fajlOlvas(fajlKornyezet(), ktx, id);
      if (!f.ok) continue;
      const t = f.ertek.meta.tipus;
      if (t !== "pdf" && t !== "png" && t !== "jpg" && t !== "webp") continue;
      mellekletek.push({ mime: t === "pdf" ? "application/pdf" : t === "png" ? "image/png" : t === "webp" ? "image/webp" : "image/jpeg", bajtok: f.ertek.bajtok, nev: f.ertek.meta.nev });
    }
    if (!mellekletek.length) throw new ProgramHiba("ERVENYTELEN_ADAT");
    return mellekletbol(h, mellekletek, ev);
  }
  const link = be.link?.trim();
  if (!link) throw new ProgramHiba("ERVENYTELEN_ADAT");
  let b: { tipus: string; bajtok: Uint8Array } | null = null;
  try {
    b = await nyersBajtok(link, { engedettTipus: LINK_TIPUS, maxBajt: 15_000_000, idokorlatMs: 15_000 });
  } catch {
    b = null; // nem fájl: weboldalként olvassuk
  }
  if (b) {
    if (zipFej(b.bajtok)) return szovegbol(h, docxbol(b.bajtok), ev);
    const mime = b.tipus.split(";")[0]!.trim().toLowerCase();
    if (mime === "application/pdf" || mime.startsWith("image/")) return mellekletbol(h, [{ mime, bajtok: b.bajtok }], ev);
    throw new ProgramHiba("ERVENYTELEN_ADAT");
  }
  try {
    const w = await weboldalSzoveg(link);
    return szovegbol(h, w.szoveg, ev);
  } catch (hiba) {
    if (hiba instanceof ProgramHiba) throw hiba;
    throw new ProgramHiba("NINCS_SZOVEG");
  }
}

/** Beolvasás + takarítás + újraolvasás-írás. Ki: a teljes (nem törölt) program és a mérleg. */
export async function programotOlvas(h: Hivo, be: OlvasForras): Promise<{ tetelek: ProgramTetel[]; merleg: OlvasMerleg }> {
  const ev = be.ev ?? evMost();
  const nyelv = (await profilTar.betolt(h.szervezetId).catch(() => null))?.nyelvek?.[0] ?? "hu";
  const tiszta = programTisztit(await programNyers(h, be, ev), { ev, nyelv }); // F6b: a csak szöveggel adott név a program első nyelvén
  if (tiszta.length === 0) throw new ProgramHiba("NINCS_SZOVEG"); // a gép nem talált programot: semmi nem íródik (a régi sorok maradnak)
  const merleg = await programTar.ujraOlvasAlkalmaz(h.szervezetId, tiszta);
  // c30 F6 (rajz D3 / D9a): honnan olvastuk — a „A feltöltött Word-fájlból olvastuk ki.” sor és az „Újraolvasom” ebből tudja
  await profilTar.mezoMent(h.szervezetId, { program_forras: { fajta: be.forrasFajta ?? (be.docx ? "word" : be.link ? "link" : "pdf"), ...(be.link ? { link: be.link.trim().slice(0, 500) } : {}), ido: new Date().toISOString() } }).catch(() => undefined);
  return { tetelek: await programTar.lista(h.szervezetId), merleg };
}

export const programLista = (szervezetId: string) => programTar.lista(szervezetId);

// ---------------------------------------------------------------------------------------------------------------------------------
// c30 F6b (élő 10-17, „Zilele teszt 2”): a valódi .docx kiolvasása 60–120 s; az nginx (és a DSM fordított proxy) 60 s-nál elvágta a
// kérést — a lap „nem sikerült”-et mutatott, közben a szerver befejezte és beírta a programot. Ezért a beolvasás a HÁTTÉRBEN fut:
// a POST azonnal 202-vel válaszol, az állapot a profil `program_olvasas` mezőjében él, a lap pedig lekérdezi. A szerver hívását
// semmi nem vágja el (a gépnek 300 s jut). Egyszerre egy olvasás szervezetenként: futó olvasás mellé nem indul új, a lap azt követi.

export { olvasasAllapot, type ProgramOlvasas };

/** Elindítja a beolvasást a háttérben. A .docx hibái (nem docx, túl nagy, üres) AZONNAL dobnak — azt a lap rögtön megmondja. */
export async function programOlvasasIndit(h: Hivo, be: OlvasForras): Promise<ProgramOlvasas> {
  if (be.docx) docxbol(be.docx);
  const p = await profilTar.betolt(h.szervezetId);
  if (!p) throw new ProgramHiba("NINCS_ILYEN");
  const regi = olvasasAllapot(p.program_olvasas);
  if (regi?.allapot === "fut") return regi;
  const o: ProgramOlvasas = { id: randomUUID(), allapot: "fut", fajta: be.forrasFajta ?? (be.docx ? "word" : be.link ? "link" : "pdf"), kezdve: new Date().toISOString() };
  await profilTar.mezoMent(h.szervezetId, { program_olvasas: o });
  void (async () => {
    let vege: ProgramOlvasas;
    try {
      const { merleg } = await programotOlvas(h, be);
      vege = { ...o, allapot: "kesz", vege: new Date().toISOString(), merleg };
    } catch (e) {
      console.error("[program] a háttér-olvasás nem sikerült:", e instanceof Error ? e.message : e);
      vege = { ...o, allapot: "hiba", vege: new Date().toISOString(), hiba: e instanceof ProgramHiba ? e.kod : "AI_NEM_ELERHETO" };
    }
    await profilTar.mezoMent(h.szervezetId, { program_olvasas: vege }).catch((e) => console.error("[program] az állapot nem íródott:", e));
  })();
  return o;
}

/** A lap lekérdezése: az olvasás állapota, és ha kész, a program. */
export async function programOlvasasLekerdez(szervezetId: string): Promise<{ olvasas: ProgramOlvasas | null; tetelek?: ProgramTetel[] }> {
  const o = olvasasAllapot((await profilTar.betolt(szervezetId))?.program_olvasas);
  return o?.allapot === "kesz" ? { olvasas: o, tetelek: await programTar.lista(szervezetId) } : { olvasas: o };
}

function tarHiba(e: unknown): never {
  if (e instanceof ProgramTarHiba) throw new ProgramHiba(e.kod);
  throw e;
}

/** Új saját tétel (kézzel). A név legalább egy nyelven kötelező. */
export async function programTetelUj(szervezetId: string, t: TisztaTetel): Promise<ProgramTetel> {
  if (!Object.values(t.nev).some((s) => s?.trim())) throw new ProgramHiba("ERVENYTELEN_ADAT");
  return programTar.uj(szervezetId, t).catch(tarHiba);
}
export async function programTetelModosit(szervezetId: string, id: string, m: ProgramTetelMezok): Promise<ProgramTetel> {
  if (m.nev && !Object.values(m.nev).some((s) => s?.trim())) throw new ProgramHiba("ERVENYTELEN_ADAT");
  return programTar.modosit(szervezetId, id, m).catch(tarHiba);
}
export async function programTetelTorol(szervezetId: string, id: string): Promise<void> {
  return programTar.torol(szervezetId, id).catch(tarHiba);
}

export { programBlokk } from "./blokk";
export { programTisztit } from "./szabaly";
