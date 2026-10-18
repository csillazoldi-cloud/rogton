import "server-only";
import { AiHiba, type HivasMeres } from "@km/ai-adapters";
import { Tartalomnyelv } from "@km/contracts";
import { AiKozosHiba, jsonRobusztusan, keretEllenoriz, meresRogzit, prompt, szolgaltato, szovegRobusztusan } from "../ai";
import { profilBetolt } from "../profil";
import { tipusOf } from "../profil/tipus-szabaly";
import { profilSorok } from "../poszt/profil-blokk";
import { forditandoMezok, mezokVissza, type KepMezo } from "./fordit-mezok";
import { nevCsere } from "../poszt/nevek";

// VZ-2c „Mit írj mellé?” — a kép mellé javasolt posztszöveg. A Posztszöveg modul promptja (prompts/poszt_szoveg.hu.md)
// dolgozik: a kiváltó a kép szövege. A cég profilja ugyanúgy megy be, mint a Posztszövegnél. Elérhetőséget nem ír:
// a Szervezet adataiban nincs telefonszám (VZ-2 kerdesek.md 5.).

export class MelleHiba extends Error {
  constructor(readonly kod: "AI_KERET_KIMERULT" | "AI_NEM_ELERHETO" | "ERVENYTELEN_ADAT") {
    super(kod);
  }
}

const FELULET: Record<string, { nev: string; hatar: number }> = {
  poszt: { nev: "facebook", hatar: 600 },
  negyzet: { nev: "facebook", hatar: 600 },
  story: { nev: "instagram", hatar: 300 },
};

export async function melleIr(szervezetId: string, fiokId: string, be: { meret?: unknown; szoveg?: unknown }): Promise<string> {
  const f = FELULET[String(be.meret ?? "poszt")] ?? FELULET["poszt"]!;
  const kepSzoveg = typeof be.szoveg === "string" ? be.szoveg.trim().slice(0, 800) : "";
  if (!kepSzoveg) throw new MelleHiba("ERVENYTELEN_ADAT");
  const p = await profilBetolt(szervezetId).catch(() => null);
  const nyelv = ["hu", "ro", "en"].find((n) => n === p?.nyelvek?.[0]) ?? "hu";
  const bemenet = [
    ...profilSorok(p),
    `Felület: ${f.nev}`,
    `Felső karakterhatár: ${f.hatar}`,
    // c30 F12: fesztiválnál „a fesztivál saját képe” (a cég sora bájtra ugyanaz)
    `A kiváltó típusa: ${p && tipusOf(p) === "fesztival" ? "a fesztivál" : "a cég"} saját képe a közösségi médiára — a szöveg a kép mellé kerül, a képen ez áll:`,
    `A kiváltó szövege:\n${kepSzoveg}`,
    "Ne írj elérhetőséget (telefonszámot, címet), ha a profilban nincs.",
  ].join("\n");
  try {
    await keretEllenoriz(szervezetId, fiokId);
  } catch (h) {
    if (h instanceof AiKozosHiba) throw new MelleHiba("AI_KERET_KIMERULT");
    throw h;
  }
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({ feladat: "poszt_szoveg", rendszer: await prompt("poszt_szoveg", "hu", nyelv, p ? tipusOf(p) : undefined), szoveg: bemenet, nyelv, maxKiToken: 700, idokorlatMs: 40_000 });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const j = JSON.parse(jsonRobusztusan(v.szoveg)) as { szoveg?: string; hashtagek?: string[] };
    const torzs = szovegRobusztusan(String(j.szoveg ?? "")).trim();
    const cimkek = (j.hashtagek ?? []).filter((h) => typeof h === "string" && h.trim()).map((h) => (h.startsWith("#") ? h : `#${h}`));
    if (!torzs) throw new MelleHiba("AI_NEM_ELERHETO");
    return cimkek.length ? `${torzs}\n\n${cimkek.join(" ")}` : torzs;
  } catch (hiba) {
    if (hiba instanceof MelleHiba) throw hiba;
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "poszt_szoveg", tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod };
    await meresRogzit(szervezetId, meres).catch(() => undefined);
    console.error("[kep melle] sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
    throw new MelleHiba(kod === "AI_KERET_KIMERULT" ? "AI_KERET_KIMERULT" : "AI_NEM_ELERHETO");
  }
}

/** c30 F4 (terv §5 „Images”): a kép második nyelve bármelyik tartalomnyelv lehet (a szervezet második nyelve, pl. Szováta: „de”).
 *  Ismeretlen vagy hiányzó cél → „ro” (a régi viselkedés). */
export function kepCel(cel: unknown): Tartalomnyelv {
  const r = Tartalomnyelv.safeParse(cel);
  return r.success ? r.data : "ro";
}

/** VZ-2b „Román változat is”: a kép szövege egy sorban a második nyelven, a gép fordítja JAVASLATKÉNT (a munkatárs átnézi).
 *  A Posztszöveg fordító promptja dolgozik (prompts/poszt_forditas.hu.md). */
export async function kepFordit(szervezetId: string, fiokId: string, be: { szoveg?: unknown; cel?: unknown }): Promise<string> {
  const szoveg = typeof be.szoveg === "string" ? be.szoveg.trim().slice(0, 400) : "";
  const cel = kepCel(be.cel); // c30 F4: eddig csak hu|ro
  if (!szoveg) throw new MelleHiba("ERVENYTELEN_ADAT");
  const p = await profilBetolt(szervezetId).catch(() => null);
  const bemenet = [
    ...profilSorok(p),
    "Felület: a cég képe a közösségi médiára — a fordítás EGY rövid sor a képen (legfeljebb 90 karakter), a kép első nyelvű szövege alatt.",
    `A kért nyelv: ${cel}`,
    `A szöveg:\n${szoveg}`,
  ].join("\n");
  try {
    await keretEllenoriz(szervezetId, fiokId);
  } catch (h) {
    if (h instanceof AiKozosHiba) throw new MelleHiba("AI_KERET_KIMERULT");
    throw h;
  }
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({ feladat: "poszt_forditas", rendszer: await prompt("poszt_forditas", "hu", cel, p ? tipusOf(p) : undefined), szoveg: bemenet, nyelv: cel, maxKiToken: 300, idokorlatMs: 30_000 });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const j = JSON.parse(jsonRobusztusan(v.szoveg)) as { szoveg?: string };
    const ki = szovegRobusztusan(String(j.szoveg ?? "")).replace(/\s+/g, " ").trim();
    if (!ki) throw new MelleHiba("AI_NEM_ELERHETO");
    return nevCsere(ki, p?.hivatalos_nevek, cel).slice(0, 200); // R-18 6. kör: hivatalos nevek
  } catch (hiba) {
    if (hiba instanceof MelleHiba) throw hiba;
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "poszt_forditas", tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod };
    await meresRogzit(szervezetId, meres).catch(() => undefined);
    throw new MelleHiba(kod === "AI_KERET_KIMERULT" ? "AI_KERET_KIMERULT" : "AI_NEM_ELERHETO");
  }
}

/**
 * Kati 10-11: a kép MINDEN szövegmezője a második nyelven (a „Román változat is” így teljes román képet ad, nem egy sort a magyar alatt).
 * Egy hívás, mezőnként egy sor; ha a gép nem ugyanannyi sort ad, mezőnként fordítunk (ritka; a teszt-csatlakozó ilyen).
 * A betű nélküli mező (szám) változatlanul marad. Válasz: {mezo: fordítás}.
 */
export async function kepForditMezok(szervezetId: string, fiokId: string, be: { mezok?: unknown; cel?: unknown }): Promise<Partial<Record<KepMezo, string>>> {
  const cel = kepCel(be.cel); // c30 F4: eddig csak hu|en|ro
  // R-18 6. kör (Kati D): a hivatalos nevek a kép minden fordított mezőjében is (a gép bemenetében és utóellenőrzéssel)
  const nevek = (await profilBetolt(szervezetId).catch(() => null))?.hivatalos_nevek ?? [];
  const tisztit = (m: Partial<Record<KepMezo, string>>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, nevCsere(v ?? "", nevek, cel)])) as Partial<Record<KepMezo, string>>;
  const { kulcsok, sorok } = forditandoMezok(be.mezok);
  if (kulcsok.length === 0) return {};
  if (kulcsok.length > 1) {
    const egyben = await forditHivas(szervezetId, fiokId, cel, [
      "Felület: a cég képe a közösségi médiára — a kép szövegmezői, mezőnként EGY sor. A fordításban pontosan ugyanennyi sor legyen,",
      `ugyanebben a sorrendben, egy sor = egy mező (${kulcsok.length} sor); a sorokat ne vond össze, ne számozd.`,
      `A kért nyelv: ${cel}`,
      `A szöveg:\n${sorok.join("\n")}`,
    ]);
    const ki = mezokVissza(kulcsok, egyben);
    if (ki) return tisztit(ki);
  }
  const ki: Partial<Record<KepMezo, string>> = {};
  for (let i = 0; i < kulcsok.length; i++) {
    ki[kulcsok[i]!] = (await forditHivas(szervezetId, fiokId, cel, [
      "Felület: a cég képe a közösségi médiára — a kép egy szövegmezője, EGY sor.",
      `A kért nyelv: ${cel}`,
      `A szöveg:\n${sorok[i]}`,
    ])).replace(/\s+/g, " ").trim().slice(0, 300);
  }
  return tisztit(ki);
}

async function forditHivas(szervezetId: string, fiokId: string, cel: string, sorokBe: string[]): Promise<string> {
  const p = await profilBetolt(szervezetId).catch(() => null);
  const bemenet = [...profilSorok(p), ...sorokBe].join("\n");
  try {
    await keretEllenoriz(szervezetId, fiokId);
  } catch (h) {
    if (h instanceof AiKozosHiba) throw new MelleHiba("AI_KERET_KIMERULT");
    throw h;
  }
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({ feladat: "poszt_forditas", rendszer: await prompt("poszt_forditas", "hu", cel, p ? tipusOf(p) : undefined), szoveg: bemenet, nyelv: cel, maxKiToken: 500, idokorlatMs: 30_000 });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const j = JSON.parse(jsonRobusztusan(v.szoveg)) as { szoveg?: string };
    const ki = szovegRobusztusan(String(j.szoveg ?? "")).trim();
    if (!ki) throw new MelleHiba("AI_NEM_ELERHETO");
    return ki;
  } catch (hiba) {
    if (hiba instanceof MelleHiba) throw hiba;
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "poszt_forditas", tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod };
    await meresRogzit(szervezetId, meres).catch(() => undefined);
    throw new MelleHiba(kod === "AI_KERET_KIMERULT" ? "AI_KERET_KIMERULT" : "AI_NEM_ELERHETO");
  }
}
