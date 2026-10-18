import "server-only";
import { AiHiba, type HivasMeres } from "@km/ai-adapters";
import { ArculatTervezet, type ArculatJavaslatValasz, type OnboardingPiszkozat } from "@km/contracts";
import { meresRogzit, prompt, szolgaltato } from "./osszefoglalo";
import { JavaslatHiba, jsonRobusztusan, keretVagyJavaslatHiba, tartalomnyelv } from "./javaslatok";
import { cegKutatas, honlapSzineiLetolt } from "./kutatas";
import { honlapLogoMent } from "./honlap-logo";
import type { HonlapSzinek } from "./szinek";

/** A honlap, amit a gép olvasott, és amit rajta talált. R-16 K7: a cím is kell („Honnan?”, `forras_cim`). */
export type SajatHonlap = { honlap: string; szinek: HonlapSzinek };

/**
 * 2026-09-28 (Vilmos): a cég SAJÁT színei — a megadott honlapról, vagy ha nincs, a gép netes kutatásával talált honlapról.
 * Az AI-hívással PÁRHUZAMOSAN fut, és legfeljebb ~40 mp; ha semmi nem jön, marad az AI javaslata (a kép soha nem szürke).
 */
async function sajatSzinek(szervezetId: string, nev: string, mirol: string, weboldal: string, nyelv: string, fiokId?: string): Promise<SajatHonlap | null> {
  let honlap = weboldal;
  if (!honlap) {
    const k = await cegKutatas(szervezetId, { nev, leiras: mirol, nyelv }, fiokId);
    if (k?.talalt && k.honlap && k.bizonyossag !== "alacsony") honlap = k.honlap;
  }
  if (!honlap) return null;
  const idokorlat = new Promise<null>((r) => setTimeout(() => r(null), 12_000));
  const szinek = await Promise.race([honlapSzineiLetolt(honlap), idokorlat]);
  return szinek ? { honlap, szinek } : null;
}

/**
 * R-16 K7 (TERV §2-K7, gepezet 10): a honlapról olvasottak a tervezetbe — a cím („Honnan?”), a színjelöltek (12d „A honlapról”),
 * és ha a színek is onnan jöttek: `szin_forras = "honlap"` (így a 12b „Jól ismer a gép?” nyílik). Tiszta: a próba ezt méri.
 */
export function honlapTervezetbe(tervezet: ArculatTervezet, sajat: SajatHonlap | null): ArculatTervezet {
  if (!sajat) return tervezet;
  const s = sajat.szinek;
  const ki: ArculatTervezet = {
    ...tervezet,
    forras_cim: sajat.honlap.trim().slice(0, 500),
    szin_jeloltek: [...new Set(s.jeloltek.map((j) => j.szin.toLowerCase()))].filter((x) => /^#[0-9a-f]{6}$/.test(x)).slice(0, 8),
  };
  if (s.fo) {
    ki.elsodleges = s.fo;
    if (s.masodik) ki.masodlagos = s.masodik;
    if (s.hatter) ki.hatter = s.hatter;
    ki.eredet = "forras";
    ki.szin_forras = "honlap";
  }
  return ki;
}

/**
 * R-16 K7: a honlap logója fájlként (csak ha még nincs logó-fájl, R7) — a színek megérkezése után, az AI-hívással párhuzamosan.
 * Soha nem dob és nem állítja meg a javaslatot; a hibája a naplóba kerül (onboarding/honlap-logo.ts).
 */
export async function honlapLogoCsendben(szervezetId: string, fiokId: string | undefined, sajat: Promise<SajatHonlap | null>): Promise<void> {
  try {
    const s = await sajat;
    if (!s?.szinek.logo || !fiokId) return;
    await honlapLogoMent(szervezetId, fiokId, s.szinek.logo);
  } catch (h) {
    console.error("[honlap_logo] sikertelen:", h instanceof Error ? h.message : h);
  }
}

/** Arculati tervezet javaslata az 1. lépés forrásaiból (v6 seedStep2 → brand draft). Javaslat, nem szabály. */
export async function arculatotJavasol(szervezetId: string, piszkozat: OnboardingPiszkozat, felulet: string, fiokId?: string): Promise<ArculatJavaslatValasz> {
  const b = piszkozat.bemutatkozas ?? {};
  const osszefoglalo = b.osszefoglalo?.trim() ?? "";
  const leiras = b.leiras?.trim() ?? "";
  if (!osszefoglalo && !leiras) throw new JavaslatHiba("ERVENYTELEN_ADAT", { forras: "ures" });

  const tnyelv = tartalomnyelv(piszkozat, felulet);
  // az 1. lépés jelölései: logó / arculati kézikönyv / vizuális referenciák / a weboldal is (csak weboldal-forrásnál)
  const f = b.arculat_forrasok ?? { logo: false, kezikonyv: false, referenciak: false, weboldal_is: false };
  const weboldalIs = f.weboldal_is && b.forras_tipus === "weboldal" && !!b.weboldal?.trim();
  const forrasNevek: string[] = [];
  if (f.logo) forrasNevek.push("logó");
  if (f.kezikonyv) forrasNevek.push("arculati kézikönyv");
  if (f.referenciak) forrasNevek.push("vizuális referenciák");
  if (weboldalIs) forrasNevek.push("a weboldal is");
  const vanForras = forrasNevek.length > 0;
  const forrasSzoveg = forrasNevek.length > 0 ? forrasNevek.join(", ") : "nincs megadott arculati forrás";

  const szovegSorok: string[] = [];
  if (b.nev?.trim()) szovegSorok.push(`A szervezet neve: ${b.nev.trim()}`);
  szovegSorok.push(`Tevékenység-összefoglaló: ${osszefoglalo || leiras}`);
  szovegSorok.push(`Megjelölt arculati források: ${forrasSzoveg}`);

  await keretVagyJavaslatHiba(szervezetId, fiokId);
  const sz = szolgaltato();
  const t0 = Date.now();
  const szinekIgeret = sajatSzinek(szervezetId, b.nev?.trim() ?? "", osszefoglalo || leiras, b.weboldal?.trim() ?? "", tnyelv, fiokId).catch(() => null);
  // R-16 K7: a logó letöltése a színek után indul, az AI-hívás közben fut; a javaslat (és az AI hibája is) megvárja — soha nem dob
  const logoIgeret = honlapLogoCsendben(szervezetId, fiokId, szinekIgeret);
  try {
    const v = await sz.hiv({
      feladat: "arculat_javaslat",
      rendszer: await prompt("arculat", felulet, tnyelv),
      szoveg: szovegSorok.join("\n"),
      nyelv: felulet,
      maxKiToken: 1500, // 2026-09-28: 500-nál új fióknál AI_ROSSZ_VALASZ jött (a gpt-5-mini gondolkodása is ebből költ); bővebb keret + a mezők vágása
      idokorlatMs: 30_000,
    });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const nyers = jsonRobusztusan(v.szoveg);
    const elemzett = JSON.parse(nyers) as unknown;
    // a szöveges mezők a séma határára vágva — egy túl hosszú mondat miatt ne vesszen el az egész javaslat
    const e = { ...(elemzett as Record<string, unknown>) };
    const vag = (k: string, n: number) => { if (typeof e[k] === "string") e[k] = (e[k] as string).trim().slice(0, n); };
    vag("betu_iranymutatas", 200); vag("kepvilag", 500); vag("kovetendo", 300); vag("kerulendo", 300);
    if (typeof e["lekerekites"] === "number") e["lekerekites"] = Math.max(0, Math.min(24, Math.round(e["lekerekites"] as number)));
    const ellenorzott = ArculatTervezet.safeParse({
      ...e,
      betu_cim: "",
      betu_szoveg: "",
      nyelv: tnyelv,
      eredet: vanForras ? "forras" : "ai",
      modositva: false,
    });
    if (!ellenorzott.success) throw new AiHiba("AI_ROSSZ_VALASZ");
    const tervezet = honlapTervezetbe(ellenorzott.data, await szinekIgeret);
    await logoIgeret;
    return {
      tervezet,
      forras: sz.leirolap.azonosito === "teszt" ? "teszt" : "ai",
    };
  } catch (hiba) {
    await logoIgeret; // R-16 K7: a logó az AI hibájától függetlenül elkészül (a fájl a munkatéré, nem a tervezeté)
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = {
      szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "arculat_javaslat",
      tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod,
    };
    await meresRogzit(szervezetId, meres);
    if (kod === "AI_KERET_KIMERULT") throw new JavaslatHiba("AI_KERET_KIMERULT");
    console.error("AI-hívás sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
    throw new JavaslatHiba("AI_NEM_ELERHETO", { ok: kod });
  }
}
