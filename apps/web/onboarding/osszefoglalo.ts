import "server-only";
import { AiHiba } from "@rogton/ai-adapters";
import type { ForrasTipus, OsszefoglaloKeres, OsszefoglaloValasz } from "@rogton/contracts";
import { szolgaltato, keretEllenoriz as kozosKeretEllenoriz, meresRogzit, prompt, AiKozosHiba, szovegRobusztusan } from "../ai";
import { LetoltesHiba, weboldalSzoveg } from "@rogton/letolto";
import { nemDerulKi } from "@rogton/onboarding-core";

// A tevékenység-összefoglaló (E-7). A hívó FELADATOT kér; a szolgáltatót a beállítás választja:
//   AI_SZOLGALTATO = teszt | anthropic | claude-elofizetes | codex-elofizetes   (alap: teszt — kulcs nélkül is végigpróbálható)
//   AI_HAVI_KERET_USD (alap: 5) — a keret elérésekor NEM hívunk (AI_KERET_KIMERULT)
// Minden hívás mérve és tárolva (ai_hivas a szervezetnél, ai_koltseg_honap a rendszer szintjén).
// A modell válasza JAVASLAT: a felület javíthatóként mutatja, a felhasználó hagyja jóvá.

export class OsszefoglaloHiba extends Error {
  constructor(public readonly kod: "FORRAS_NEM_ELERHETO" | "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_KIKAPCSOLVA" | "ERVENYTELEN_ADAT", public readonly mezok?: Record<string, string>) {
    super(kod);
    this.name = "OsszefoglaloHiba";
  }
}

export { szolgaltato, meresRogzit, prompt };

/** A havi keret ellenőrzése az onboarding hibatípusával (a közös `AiKozosHiba` → `OsszefoglaloHiba`, hogy a hívók 429-et adjanak — E-11). */
export async function keretEllenoriz(szervezetId?: string, fiokId?: string): Promise<void> {
  try { await kozosKeretEllenoriz(szervezetId, fiokId); } catch (h) {
    if (h instanceof AiKozosHiba) throw new OsszefoglaloHiba(h.kod); // AI_KERET_KIMERULT vagy AI_KIKAPCSOLVA (F-5)
    throw h;
  }
}

/** A forrás összegyűjtése: weboldal (biztonságos letöltés) vagy a saját leírás. */
async function forras(be: OsszefoglaloKeres): Promise<{ tipus: ForrasTipus; szoveg: string }> {
  const tipus: ForrasTipus = be.forras_tipus ?? (be.weboldal?.trim() ? "weboldal" : "leiras");
  if (tipus === "weboldal") {
    if (!be.weboldal?.trim()) throw new OsszefoglaloHiba("ERVENYTELEN_ADAT", { forras: "ures" });
    try {
      const w = await weboldalSzoveg(be.weboldal);
      const szoveg = `${w.cim ? `Az oldal címe: ${w.cim}\n` : ""}Az oldal szövege:\n${w.szoveg}`;
      return { tipus, szoveg };
    } catch (hiba) {
      if (hiba instanceof LetoltesHiba) {
        if (hiba.kod === "FORRAS_ROSSZ_CIM" || hiba.kod === "FORRAS_TILTOTT_CIM") throw new OsszefoglaloHiba("ERVENYTELEN_ADAT", { weboldal: hiba.kod });
        throw new OsszefoglaloHiba("FORRAS_NEM_ELERHETO", { weboldal: hiba.kod });
      }
      throw hiba;
    }
  }
  if (!be.leiras?.trim()) throw new OsszefoglaloHiba("ERVENYTELEN_ADAT", { forras: "ures" });
  return { tipus, szoveg: `A szervezet saját leírása:\n${be.leiras.trim()}` };
}

export async function osszefoglalot_keszit(szervezetId: string, be: OsszefoglaloKeres, nyelv: string, fiokId?: string): Promise<OsszefoglaloValasz> {
  const f = await forras(be);
  await keretEllenoriz(szervezetId, fiokId);
  const sz = szolgaltato();
  const nevSor = be.nev?.trim() ? `A szervezet neve: ${be.nev.trim()}\n` : "";
  const t0 = Date.now();
  try {
    const v = await sz.hiv({ feladat: "osszefoglalo", rendszer: await prompt("osszefoglalo", nyelv), szoveg: `${nevSor}${f.szoveg}`, nyelv, maxKiToken: 400, idokorlatMs: 30_000 });
    await meresRogzit(szervezetId, v.meres, fiokId);
    const szoveg = szovegRobusztusan(v.szoveg);
    if (!szoveg) throw new AiHiba("AI_ROSSZ_VALASZ");
    // A8: nem összefoglaló, hanem „kevés a forrás” — a felület a mező alatt mondja meg, mit írjon (nem hibaként)
    if (nemDerulKi(szoveg)) throw new OsszefoglaloHiba("ERVENYTELEN_ADAT", { tevekenyseg: "nem_derul_ki" });
    return { osszefoglalo: szoveg, forras: sz.leirolap.azonosito === "teszt" ? "teszt" : "ai", forras_tipus: f.tipus, szolgaltato: sz.leirolap.azonosito, becsult_usd: v.meres.becsult_usd };
  } catch (hiba) {
    if (hiba instanceof OsszefoglaloHiba) throw hiba; // A8: a „nem derül ki” nem AI-hiba (a hívás sikerült, a mérése megvan)
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    await meresRogzit(szervezetId, { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "osszefoglalo", tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod });
    if (kod === "AI_KERET_KIMERULT") throw new OsszefoglaloHiba("AI_KERET_KIMERULT");
    console.error("AI-hívás sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
    throw new OsszefoglaloHiba("AI_NEM_ELERHETO", { ok: kod });
  }
}
