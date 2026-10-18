import "server-only";
import type { FeladatTipus, HivasMeres } from "@km/ai-adapters";
import { keretEllenoriz, meresRogzit, prompt } from "../ai";

// R-18 7. kör (IRANYOK-round7.md 2. és 4.): képet és PDF-et olvasó gép — az étlap / árlista fotója vagy PDF-je, és a legutóbbi posztokról
// küldött képernyőképek. A szöveges AI-csatlakozók (@km/ai-adapters) képet nem fogadnak, ezért — mint a netes kutatás (kutatas.ts) —
// közvetlenül az OpenAI Responses API-ját hívjuk (gpt-5-mini, képpel és PDF-fel). Kulcs nélkül, vagy a teszt-csatlakozóval
// (AI_SZOLGALTATO=teszt) a gép minta-választ ad, hogy a lépés AI nélkül is végigpróbálható legyen. A hívást mérjük és a keretből megy.

export type Melleklet = { mime: string; bajtok: Uint8Array; nev?: string };

/** USD: a gpt-5-mini tokenára (a kutatas.ts AR-jával azonos) — a Költség lap ebből számol. */
const AR = { be: 0.25, ki: 2 };

const MINTA: Partial<Record<FeladatTipus, string>> = {
  kinalat_kiolvasas: JSON.stringify({ sorok: [
    { nev: "[MINTA] Gulyásleves", reszlet: "házi, csipetkével", ar: "32 lej" },
    { nev: "[MINTA] Rántott csirkemell", reszlet: "hasábburgonyával", ar: "45 lej" },
    { nev: "[MINTA] Somlói galuska", reszlet: "", ar: "24 lej" },
  ] }),
  // c30 F5: a programfüzet fotója / PDF-je — a teszt-csatlakozó két [MINTA] tételt ad (egy idősávost és egy bizonytalant)
  program_kiolvasas: JSON.stringify({ tetelek: [
    { nap: "2026-06-27", kezdes: "18:00–20:30", nev: { hu: "[MINTA] Esti koncert", ro: "[MINTA] Concert de seară" }, helyszin: { hu: "Főtér", ro: "Piața Centrală" }, fajta: "koncert", fellepo: "", bizonytalan: false },
    { nap: "2026-06-28", kezdes: "10:00???", nev: { hu: "[MINTA] Ünnepség" }, fajta: "unnepseg", bizonytalan: false },
  ] }),
  poszt_szokasok: "[MINTA] Közvetlen, tegező hang. Rövid, 2–4 mondatos posztok, mondatonként legfeljebb egy emoji. A végén 2–3 helyi hashtag.",
};

function tesztMod(): boolean {
  return (process.env["AI_SZOLGALTATO"] ?? "teszt") === "teszt" || !process.env["OPENAI_API_KEY"]?.trim();
}

/**
 * A mellékletek (képek, PDF) olvasása a megadott prompttal. Ki: a gép szövege (a hívó értelmezi), vagy `null`, ha nem sikerült
 * (hálózat, keret, rossz válasz) — a hívó ilyenkor üres eredménnyel megy tovább, a lépés soha nem áll meg miatta.
 */
export async function mellekletOlvas(
  szervezetId: string,
  // c30 F10 (terv §6): `max` — ennyi mellékletet küld (alap 6; a fotóalbum válogatása 40-et, csak az a feladat); `reszlet` — a kép
  // felbontása a gépnek („low”: ~85 token képenként — a fotóalbum kicsi, 512 px-es változatai így olcsók)
  be: { feladat: FeladatTipus; promptFajl: string; nyelv: string; mellekletek: Melleklet[]; kiegeszites?: string; max?: number; reszlet?: "low" | "high" | "auto" },
  fiokId?: string,
): Promise<string | null> {
  if (be.mellekletek.length === 0) return null;
  try {
    await keretEllenoriz(szervezetId, fiokId);
  } catch {
    return null;
  }
  const t0 = Date.now();
  if (tesztMod()) {
    const szoveg = MINTA[be.feladat] ?? "";
    await meresRogzit(szervezetId, { szolgaltato: "teszt", modell: "minta", feladat: be.feladat, tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "ok" }, fiokId);
    return szoveg || null;
  }
  const kulcs = process.env["OPENAI_API_KEY"]!.trim();
  const modell = process.env["OPENAI_MODELL"] ?? "gpt-5-mini";
  const meres = (m: Partial<HivasMeres>): HivasMeres => ({ szolgaltato: "openai", modell, feladat: be.feladat, tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "ok", ...m });
  const vezerlo = new AbortController();
  const idozito = setTimeout(() => vezerlo.abort(), 60_000);
  try {
    const tartalom: Record<string, unknown>[] = [{ type: "input_text", text: be.kiegeszites?.trim() || "Olvasd el a mellékleteket." }];
    for (const m of be.mellekletek.slice(0, be.max ?? 6)) {
      const adat = `data:${m.mime};base64,${Buffer.from(m.bajtok).toString("base64")}`;
      tartalom.push(m.mime === "application/pdf" ? { type: "input_file", filename: m.nev || "dokumentum.pdf", file_data: adat } : { type: "input_image", image_url: adat, ...(be.reszlet ? { detail: be.reszlet } : {}) });
    }
    const valasz = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: vezerlo.signal,
      headers: { authorization: `Bearer ${kulcs}`, "content-type": "application/json" },
      body: JSON.stringify({ model: modell, reasoning: { effort: "low" }, input: [{ role: "system", content: await prompt(be.promptFajl, "hu", be.nyelv) }, { role: "user", content: tartalom }] }),
    });
    const adat = (await valasz.json().catch(() => null)) as Record<string, unknown> | null;
    if (!valasz.ok || !adat) throw new Error(`HTTP ${valasz.status}`);
    const kimenet = Array.isArray(adat["output"]) ? (adat["output"] as Record<string, unknown>[]) : [];
    const szoveg = kimenet
      .filter((o) => o["type"] === "message")
      .flatMap((o) => (Array.isArray(o["content"]) ? (o["content"] as Record<string, unknown>[]) : []))
      .map((c) => (typeof c["text"] === "string" ? c["text"] : ""))
      .join("")
      .trim();
    const u = (adat["usage"] ?? {}) as Record<string, number>;
    const tbe = u["input_tokens"] ?? 0;
    const tki = u["output_tokens"] ?? 0;
    await meresRogzit(szervezetId, meres({ tokenek_be: tbe, tokenek_ki: tki, becsult_usd: (tbe * AR.be + tki * AR.ki) / 1e6 }), fiokId);
    return szoveg || null;
  } catch (h) {
    console.error(`[${be.feladat}] képolvasás sikertelen:`, h instanceof Error ? h.message : h);
    await meresRogzit(szervezetId, meres({ allapot: "hiba", hiba_kod: "AI_NEM_ELERHETO" })).catch(() => undefined);
    return null;
  } finally {
    clearTimeout(idozito);
  }
}
