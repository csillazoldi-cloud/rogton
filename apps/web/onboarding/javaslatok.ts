import "server-only";
import { AiHiba, type HivasMeres } from "@rogton/ai-adapters";
import { JavaslatokValasz, HangnemFinomitasValasz, type HangnemFinomitasKeres, type OnboardingPiszkozat } from "@rogton/contracts";
import { tartalomnyelv } from "@rogton/onboarding-core";
import { szolgaltato, keretEllenoriz, meresRogzit, prompt, jsonRobusztusan, AiKozosHiba } from "../ai";
import { nyelvekSzovegbol, rendezvenyJavaslat, tipusJavaslat } from "../profil/tipus-szabaly";

export class JavaslatHiba extends Error {
  constructor(public readonly kod: "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_KIKAPCSOLVA" | "ERVENYTELEN_ADAT", public readonly mezok?: Record<string, string>) {
    super(kod);
    this.name = "JavaslatHiba";
  }
}

const TARTALOMNYELV_NEVEK: Record<string, string> = {
  hu: "magyar", ro: "román", en: "angol", de: "német", fr: "francia", it: "olasz", es: "spanyol",
  sk: "szlovák", sr: "szerb", hr: "horvát", uk: "ukrán", pl: "lengyel", cs: "cseh", nl: "holland",
  pt: "portugál", sv: "svéd", tr: "török", ar: "arab",
};

/** A havi keret ellenőrzése a javaslat-hívások előtt — a kimerült keret itt is 429, nem belső hiba (E-11 javítás). */
export async function keretVagyJavaslatHiba(szervezetId?: string, fiokId?: string): Promise<void> {
  try { await keretEllenoriz(szervezetId, fiokId); } catch (h) {
    if (h instanceof AiKozosHiba) throw new JavaslatHiba(h.kod); // AI_KERET_KIMERULT vagy AI_KIKAPCSOLVA (F-5)
    throw h;
  }
}

export { tartalomnyelv, jsonRobusztusan };

/** Javaslatok a 2. lépéshez a piszkozat 1. lépése alapján (név, összefoglaló, célközönség-kérdés válasza, forrás). */
function evMost(): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric" }).format(new Date()));
}

export async function javaslatokatKeszit(szervezetId: string, piszkozat: OnboardingPiszkozat, felulet: string, fiokId?: string): Promise<JavaslatokValasz> {
  const b = piszkozat.bemutatkozas ?? {};
  const osszefoglalo = b.osszefoglalo?.trim() ?? "";
  const leiras = b.leiras?.trim() ?? "";
  if (!osszefoglalo && !leiras) throw new JavaslatHiba("ERVENYTELEN_ADAT", { forras: "ures" });

  const tnyelv = tartalomnyelv(piszkozat, felulet);
  const feladatSorok: string[] = [];
  if (b.nev?.trim()) feladatSorok.push(`A szervezet neve: ${b.nev.trim()}`);
  if (osszefoglalo) feladatSorok.push(`Tevékenység-összefoglaló: ${osszefoglalo}`);
  else if (leiras) feladatSorok.push(`Tevékenység-összefoglaló: ${leiras}`);
  const celkozonsegValasz = b.celkozonseg?.trim(); // az 1. lépés kihagyható kérdésének válasza
  if (celkozonsegValasz) feladatSorok.push(`A felhasználó szerint a célközönség: ${celkozonsegValasz}`);
  const forrasTipus = b.forras_tipus === "weboldal" && b.weboldal?.trim() ? `weboldal ${b.weboldal.trim()}` : "saját leírás";
  feladatSorok.push(`Forrás: ${forrasTipus}`);

  await keretVagyJavaslatHiba(szervezetId, fiokId);
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({
      feladat: "javaslatok",
      rendszer: await prompt("javaslatok", felulet, tnyelv),
      szoveg: feladatSorok.join("\n"),
      nyelv: felulet,
      maxKiToken: 600,
      idokorlatMs: 30_000,
    });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const nyers = jsonRobusztusan(v.szoveg);
    const elemzett = JSON.parse(nyers) as unknown;
    // c30 F1: the three new keys are NOT part of this check — a bad type/category value must never fail the whole proposal;
    // they are normalised separately by `tipusJavaslat` (regex fallback with biztos: false when missing or unusable).
    const ellenorzott = JavaslatokValasz.omit({ forras: true, tartalomnyelv: true, szervezet_tipus: true, kategoria: true, biztos: true, rendezveny: true }).safeParse(elemzett);
    if (!ellenorzott.success) throw new AiHiba("AI_ROSSZ_VALASZ");
    const ertek = ellenorzott.data;
    // c30 F6b: a leírásban kimondott nyelvek („magyarul és románul”) előbb állnak, mint a gép tippje; ha a szöveg nem mond nyelvet, a gépé
    const szovegNyelvek = nyelvekSzovegbol(`${b.nev ?? ""} ${osszefoglalo || leiras}`);
    const ervenyesNyelvek = (szovegNyelvek.length ? szovegNyelvek : ertek.nyelvek).filter((n) => TARTALOMNYELV_NEVEK[n as keyof typeof TARTALOMNYELV_NEVEK] !== undefined) as typeof ertek.nyelvek;
    const tipus = tipusJavaslat(elemzett, b.nev ?? "", osszefoglalo || leiras);
    return {
      ...ertek,
      nyelvek: ervenyesNyelvek,
      tartalomnyelv: tnyelv,
      forras: sz.leirolap.azonosito === "teszt" ? "teszt" : "ai",
      szervezet_tipus: tipus.szervezet_tipus,
      kategoria: tipus.kategoria,
      biztos: tipus.biztos,
      // c30 F6 (rajz D2): a festival's dates + town — the AI's answer, else the dates the text itself gives; never invented
      ...(tipus.szervezet_tipus === "fesztival" ? { rendezveny: rendezvenyJavaslat((elemzett as Record<string, unknown> | null)?.["rendezveny"], `${b.nev ?? ""} ${osszefoglalo || leiras}`, evMost()) } : {}),
    };
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = {
      szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "javaslatok",
      tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod,
    };
    await meresRogzit(szervezetId, meres);
    if (kod === "AI_KERET_KIMERULT") throw new JavaslatHiba("AI_KERET_KIMERULT");
    console.error("AI-hívás sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
    throw new JavaslatHiba("AI_NEM_ELERHETO", { ok: kod });
  }
}

/** A hangnem finomítása: irány (kozvetlenebb | targyilagosabb | egyedi + megjegyzés). */
export async function hangnemetFinomit(szervezetId: string, be: HangnemFinomitasKeres, felulet: string, fiokId?: string): Promise<HangnemFinomitasValasz> {
  await keretVagyJavaslatHiba(szervezetId, fiokId);
  const sz = szolgaltato();
  const t0 = Date.now();
  const iranySzoveg =
    be.irany === "egyedi"
      ? (be.megjegyzes?.trim() || "egyedi")
      : be.irany === "kockak"
        ? `A hangnem ezekből a jelzőkből álljon össze: ${be.megjegyzes?.trim() || ""}. Írj egy rövid hangnem-leírást (max 200 karakter) és egy mintamondatot a szervezet nevében.`
        : be.irany;
  const szoveg = `A hangnem-leírás: ${be.hangnem_leiras}\nA mintaszöveg:\n${be.hangnem_minta}\nA kérés: ${iranySzoveg}`;
  try {
    const v = await sz.hiv({
      feladat: "hangnem_finomitas",
      rendszer: await prompt("hangnem_finomitas", felulet, be.tartalomnyelv),
      szoveg,
      nyelv: felulet,
      maxKiToken: 400,
      idokorlatMs: 30_000,
    });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const nyers = jsonRobusztusan(v.szoveg);
    const elemzett = JSON.parse(nyers) as unknown;
    const ellenorzott = HangnemFinomitasValasz.omit({ forras: true }).safeParse(elemzett);
    if (!ellenorzott.success) throw new AiHiba("AI_ROSSZ_VALASZ");
    return { ...ellenorzott.data, forras: sz.leirolap.azonosito === "teszt" ? "teszt" : "ai" };
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = {
      szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "hangnem_finomitas",
      tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod,
    };
    await meresRogzit(szervezetId, meres);
    if (kod === "AI_KERET_KIMERULT") throw new JavaslatHiba("AI_KERET_KIMERULT");
    console.error("AI-hívás sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
    throw new JavaslatHiba("AI_NEM_ELERHETO", { ok: kod });
  }
}
