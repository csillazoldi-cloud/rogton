import "server-only";
import { FESZTIVAL_PROMPTOK, fesztivalPrompt } from "./fesztival-szo";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { AiHiba, anthropicSzolgaltato, tesztSzolgaltato, type Szolgaltato, type HivasMeres, claudeElofizetesSzolgaltato, codexElofizetesSzolgaltato, ollamaSzolgaltato, openaiSzolgaltato } from "@rogton/ai-adapters";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { kreditTerhel, kreditVan } from "../kredit";
export { szovegRobusztusan } from "./szoveg";

// A közös AI-csatlakozó (E-20): a szolgáltató-választás, a havi keret ellenőrzése, a mérés rögzítése,
// a promptok betöltése és a JSON robusztus kinyerése. Az onboarding és a hírfigyelő innen importál.

export class AiKozosHiba extends Error {
  constructor(public readonly kod: "AI_KERET_KIMERULT" | "AI_KIKAPCSOLVA", uzenet?: string) {
    super(uzenet ?? kod);
    this.name = "AiKozosHiba";
  }
}

export function szolgaltato(nev: string = process.env["AI_SZOLGALTATO"] ?? "teszt"): Szolgaltato {
  // D-10: a tesztfázisban két ELŐFIZETÉS is választható (az ai-hid dobozon át), API-kulcs nélkül
  switch (nev) {
    case "anthropic": return anthropicSzolgaltato;
    case "claude-elofizetes": return claudeElofizetesSzolgaltato;
    case "codex-elofizetes": return codexElofizetesSzolgaltato;
    case "helyi-ollama": return ollamaSzolgaltato;
    case "openai": return openaiSzolgaltato; // T-25 (D-F37): OpenAI API kulccsal — a tesztoldal hírfigyelője
    default: return tesztSzolgaltato;
  }
}

/**
 * A HÍRFIGYELŐ szolgáltatója (D-12): `HF_AI_SZOLGALTATO` — alap `teszt`; a valódi AI ellenőrzéséhez `anthropic` (API-kulcs).
 * Az előfizetéses híd NEM automatikus helyettesítő: csak kifejezett beállításra (`claude-elofizetes`) megy oda.
 * `helyi-ollama` — a Dell gépen futó Ollama (Qwen), a helyi hálózaton.
 */
export function hirfigyeloSzolgaltato(): Szolgaltato {
  return szolgaltato(process.env["HF_AI_SZOLGALTATO"] ?? "teszt");
}

export const HONAP = () => new Date().toISOString().slice(0, 7);

export const ALAP_KERET_USD = () => Number(process.env["AI_HAVI_KERET_USD"] ?? "5");

/**
 * A keret ellenőrzése minden AI-hívás előtt (E-39). KÉT fék van, mindkettőnek át kell engednie:
 *  1. a SZERVEZET havi kerete (szervezet.ai_keret_usd, ennek hiányában az alapérték) — ez a terméki korlát,
 *  2. a RENDSZER havi kerete (ai_koltseg_honap) — biztonsági fék az egész gépre.
 * A szervezet eddigi költségét a saját sorai adják; a sorszintű védelem kapuján át olvassuk.
 */
export async function keretEllenoriz(szervezetId?: string, fiokId?: string): Promise<void> {
  const alap = ALAP_KERET_USD();
  // R-13 (2026-09-22): a tag kreditje — ha neki vagy a munkatérnek nem maradt, csak az ő AI-munkája áll le.
  // Egyelőre a keret-hibával (a felület ezt már érti); a saját szövege az R-13 rajzzal jön.
  if (szervezetId && fiokId) {
    // a kredit-nyilvántartás hibája nem állíthatja le a munkát (naplózzuk, és a dolláros keret véd tovább)
    const van = await kreditVan(szervezetId, fiokId).catch((h) => { console.error("[kredit] ellenőrzés sikertelen:", h); return true; });
    if (!van) throw new AiKozosHiba("AI_KERET_KIMERULT", "kredit elfogyott");
  }
  if (szervezetId) {
    // F-5 (R-4): a szervezet AI-kapcsolója — kikapcsolva egyetlen hívás sem indul a nevében; a keret előtt eldől
    const [kapcsolo] = await szervezetKent(szervezetId, async (tx) =>
      tx.select({ be: sema.szervezet.aiEngedelyezve }).from(sema.szervezet).where(eq(sema.szervezet.id, szervezetId)).limit(1));
    if (kapcsolo && !kapcsolo.be) throw new AiKozosHiba("AI_KIKAPCSOLVA");
    const [sor] = await szervezetKent(szervezetId, async (tx) => tx.execute(sql`
      SELECT coalesce((SELECT sz.ai_keret_usd FROM szervezet sz WHERE sz.id = ${szervezetId}), ${alap})::float8 AS keret,
             coalesce((SELECT sum(h.becsult_usd) FROM ai_hivas h
                       WHERE h.szervezet_id = ${szervezetId} AND to_char(h.letrehozva, 'YYYY-MM') = ${HONAP()}), 0)::float8 AS eddig
    `).then((e) => (e as unknown as { rows: { keret: number; eddig: number }[] }).rows));
    if (sor && sor.eddig >= sor.keret) throw new AiKozosHiba("AI_KERET_KIMERULT");
  }
  const sorok = await db().select({ usd: sema.aiKoltsegHonap.becsultUsd }).from(sema.aiKoltsegHonap).where(eq(sema.aiKoltsegHonap.honap, HONAP())).limit(1);
  const eddig = Number(sorok[0]?.usd ?? 0);
  // A rendszerkeret a visszaélés elleni kerítés az EGÉSZ gépre (nyílt regisztráció, D-17): ha nincs beállítva,
  // az ügyfélkeret tízszerese. Ennek tágabbnak kell lennie az ügyfélkeretnél, különben az ügyfélkeret díszlet.
  if (eddig >= Number(process.env["AI_RENDSZER_KERET_USD"] ?? String(alap * 10))) throw new AiKozosHiba("AI_KERET_KIMERULT");
}

export async function meresRogzit(szervezetId: string, m: HivasMeres, fiokId?: string): Promise<void> {
  // R-13: a sikeres hívás 1 kredit annak, aki indította (ha tudjuk, ki)
  if (fiokId && m.allapot === "ok") await kreditTerhel(szervezetId, [fiokId], m.feladat);
  try {
    await szervezetKent(szervezetId, async (tx) => {
      await tx.insert(sema.aiHivas).values({
        szervezetId, feladat: m.feladat, szolgaltato: m.szolgaltato, modell: m.modell,
        tokenekBe: m.tokenek_be, tokenekKi: m.tokenek_ki, becsultUsd: m.becsult_usd.toFixed(6),
        idoMs: m.ido_ms, allapot: m.allapot, hibaKod: m.hiba_kod ?? null,
      });
    });
    await db()
      .insert(sema.aiKoltsegHonap)
      .values({ honap: HONAP(), becsultUsd: m.becsult_usd.toFixed(6), hivasok: 1 })
      .onConflictDoUpdate({
        target: sema.aiKoltsegHonap.honap,
        set: { becsultUsd: sql`${sema.aiKoltsegHonap.becsultUsd} + ${m.becsult_usd.toFixed(6)}`, hivasok: sql`${sema.aiKoltsegHonap.hivasok} + 1`, frissitve: new Date() },
      });
  } catch (hiba) {
    console.error("AI-hívás mérésének rögzítése sikertelen:", hiba);
  }
}

const promptGyorsitotarak = new Map<string, string>();
/**
 * A NEM hírfigyelő promptok (arculat, összefoglaló, javaslatok, hangnemfinomítás) az alkalmazás sajátjai.
 * A HÍRFIGYELŐ promptjai E-31 óta a `@rogton/news-monitor-promptok` csomagban élnek — a modul része, mindkét host onnan olvassa.
 */
export async function prompt(fajl: string, nyelv: string, tartalomnyelv?: string, tipus?: string): Promise<string> {
  // ALAPTERV 3.: az AI-promptok fájlban, verziózva a tárhelyen (apps/web/prompts/, a futó alkalmazás mappájából olvasva)
  let gyorsitott = promptGyorsitotarak.get(fajl);
  if (!gyorsitott) {
    gyorsitott = await readFile(join(process.cwd(), "prompts", `${fajl}.hu.md`), "utf8");
    promptGyorsitotarak.set(fajl, gyorsitott);
  }
  const nyelvNevek: Record<string, string> = { hu: "magyar", ro: "román", en: "angol" };
  const tartalomNyelvNevek: Record<string, string> = {
    hu: "magyar", ro: "román", en: "angol", de: "német", fr: "francia", it: "olasz", es: "spanyol",
    sk: "szlovák", sr: "szerb", hr: "horvát", uk: "ukrán", pl: "lengyel", cs: "cseh", nl: "holland",
    pt: "portugál", sv: "svéd", tr: "török", ar: "arab",
  };
  let szoveg = gyorsitott.replace("{{nyelv}}", nyelvNevek[nyelv] ?? "magyar");
  if (tartalomnyelv) szoveg = szoveg.replace("{{tartalomnyelv}}", tartalomNyelvNevek[tartalomnyelv] ?? "magyar");
  // c30 F12: fesztiválnál „a cég” → „a fesztivál” (ai/fesztival-szo.ts) — a cég promptja változatlan
  if (tipus === "fesztival" && FESZTIVAL_PROMPTOK.has(fajl)) szoveg = fesztivalPrompt(szoveg);
  return szoveg;
}

export function jsonRobusztusan(szoveg: string): string {
  let t = szoveg.trim();
  const kodKerites = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (kodKerites) t = kodKerites[1]!.trim();
  const elso = t.indexOf("{");
  const utolso = t.lastIndexOf("}");
  if (elso === -1 || utolso === -1 || utolso <= elso) throw new AiHiba("AI_ROSSZ_VALASZ");
  return t.slice(elso, utolso + 1);
}
