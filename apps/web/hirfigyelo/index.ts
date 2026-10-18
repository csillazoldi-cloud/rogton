import "server-only";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";
import { randomUUID } from "node:crypto";
import type { FiokNezet, Szerep } from "@rogton/contracts";
import { ALAP_SZURES, type HostKontextus, type Kornyezet } from "@rogton/news-monitor-core";
import { profilBetolt } from "../profil";
import { iranytuTar } from "../iranytu/tar";
import { iranytuSzuronek } from "./iranytu-szuro";
import { aiHivo, type AiHibaSzamlalo } from "./ai";
import { letolto } from "./letolto";
import { postgresTar } from "./tar";
import { tagSzuresek } from "./tag-szures";
import { kreditesTagok, kreditTerhel } from "../kredit";

/** A Hírfigyelő környezete a webalkalmazásban: a mag folyamatai ezt kapják.
 *  `nyelv`: a VÁLASZ nyelve — a felület nyelve, amit a futást indító ember (vagy a tulajdonos) választott (E-29c). */
/**
 * R-13: `nezoFiokId` — a néző (az olvasó lapok az ő szűrő-beállításával mutatnak); `opciok.fizeto` — ha egy ember kérte
 * az AI-munkát (API), az ő kreditjéből megy; nélküle (háttérfutás) a mag osztja szét a kreditet azok között, akiknek kellett.
 */
export async function kornyezet(szervezetId: string, nyelv: "hu" | "ro" | "en" = "hu", nezoFiokId?: string, opciok: { fizeto?: string } = {}): Promise<Kornyezet> {
  const profil = await profilBetolt(szervezetId);
  // R-13: a tagok szűrő-beállítása (a gép ezek szerint olvas — csak akinek van kreditje), és a néző szeme (az olvasó lapoknak)
  const tagokMind = await tagSzuresek(szervezetId).catch(() => []);
  const kredites = await kreditesTagok(szervezetId).catch((h) => { console.error("[hirfigyelo] kredit:", h); return null; });
  const tagok = kredites ? tagokMind.filter((t) => kredites.has(t.fiok_id)) : tagokMind;
  const nezoSz = nezoFiokId ? tagokMind.find((t) => t.fiok_id === nezoFiokId) ?? { fiok_id: nezoFiokId, ...ALAP_SZURES } : undefined;
  // 2026-09-22: a szigorú szűrő az Iránytűt is látja (a jóváhagyottat) — a profil "iranytu" mezőjében.
  const iranytu = iranytuSzuronek((await iranytuTar.betolt(szervezetId).catch(() => null))?.jovahagyott ?? null);
  const aiSzamlalo: AiHibaSzamlalo = { nem_valaszolt: 0 }; // F-5b: egy futás AI-hibái — a végén egy esemény
  return {
    tar: postgresTar(),
    letolto,
    ai: aiHivo(szervezetId, nyelv, aiSzamlalo, opciok.fizeto),
    profil: { ...(profil ?? {}), ...(iranytu ? { iranytu } : {}) },
    nyelv, // F10-M1: a tartalomnyelv a magnak (azonos nyelvű cím = nincs fordítás)
    tagok,
    ...(opciok.fizeto ? {} : { kreditTerhel: (fiokok: string[], feladat: string) => kreditTerhel(szervezetId, fiokok, feladat) }),
    ...(nezoSz ? { nezo: { fokozat: nezoSz.fokozat, eloszures: nezoSz.eloszures } } : {}),
    idAdo: () => randomUUID(),
    most: () => new Date(),
    esemeny: async (e) => {
      console.log(`[hirfigyelo] ${e.fajta} szervezet=${e.szervezet_id}${e.futas_id ? ` futas=${e.futas_id}` : ""}${e.uj_talalatok !== undefined ? ` uj=${e.uj_talalatok}` : ""}${e.reszlet ? ` reszlet=${e.reszlet}` : ""}`);
      // F-5: az eseménynaplóba is (a `mentes_hiba` a napló nyelvén `futas_hiba`, a részletben a valódi ok)
      const fajta = e.fajta === "mentes_hiba" ? "futas_hiba" : e.fajta;
      const adat: Record<string, string | number | boolean | null> = {};
      if (e.futas_id) adat["futas_id"] = e.futas_id;
      if (e.uj_talalatok !== undefined) adat["uj_talalatok"] = e.uj_talalatok;
      if (e.reszlet) adat["reszlet"] = e.fajta === "mentes_hiba" ? `mentes_hiba: ${e.reszlet}` : e.reszlet;
      await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: e.szervezet_id, fajta, fiok_id: null, adat });
      // F-5b (D-F33): ha a futásban az AI nem válaszolt, a futás végén EGY esemény — a függő találatok számával (R-4: „nem hiba, hanem várakozás")
      if ((e.fajta === "futas_kesz" || e.fajta === "futas_hiba") && aiSzamlalo.nem_valaszolt > 0) {
        const n = aiSzamlalo.nem_valaszolt; aiSzamlalo.nem_valaszolt = 0;
        await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: e.szervezet_id, fajta: "ai_nem_valaszol", fiok_id: null, adat: { n, ...(e.futas_id ? { futas_id: e.futas_id } : {}) } });
      }
    },
  };
}

/** A fiók szerepe a szervezetben; ha nincs tagság, null. */
export function hostKontextus(fiok: FiokNezet, szervezetId: string): HostKontextus | null {
  const tagsag = fiok.szervezetek.find((sz) => sz.id === szervezetId);
  if (!tagsag) return null;
  return {
    fiok_id: fiok.id,
    szervezet_id: szervezetId,
    szerep: tagsag.szerep as Szerep,
  };
}
