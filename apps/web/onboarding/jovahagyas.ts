import "server-only";
import { peldakatFrissit } from "../vizual/peldak";
import { esemenyKornyezet, feljegyezHatterben } from "../esemeny";
import { eq } from "drizzle-orm";
import { OnboardingPiszkozat, SzervezetProfil, type HibaKod } from "@rogton/contracts";
import { arculatMent } from "../arculat/ment";
import { erintetlenArculat, hatterTervezetBefogad } from "../arculat/lepes";
import { profilPiszkozatbol, profilTureloOlvas } from "@rogton/profile-core";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";
import { profilNyersen, profilTar } from "../profil/tar";
import { arculatotJavasol } from "./arculat";

/**
 * 2026-09-28 (Vilmos: „a kép soha ne legyen szürke”): az új első beállítás nem kér arculatot, ezért minden új munkatér
 * arculat NÉLKÜL indult — a Képek szürkék lettek. A jóváhagyás után a háttérben a gép javasol egy arculat-TERVEZETET:
 * a cég honlapjának színeivel (a megadott vagy a netes kutatással megtalált honlapról), ha nincs, az AI javaslatával.
 * Tervezet marad — a tulajdonos a Szervezet adatainál hagyja jóvá vagy írja át. Hiba nem zavarja a jóváhagyást.
 *
 * R-16 K4 (a K3 jelentéséből): az írás az `arculatMent` EGY tranzakciója (`SELECT … FOR UPDATE`), és csak az ÉRINTETLEN arculatba
 * kerül (`hatterTervezetBefogad`: nincs tervezet, pillanatkép, jóváhagyás, és a verzió az onboardingkori). Korábban sima betöltés–mentés
 * volt zár nélkül: az AI-hívás (másodpercek) alatt a 12a-n jóváhagyott arculatot felülírhatta egy tervezettel (a jóváhagyás és a
 * pillanatkép elveszett volna). Ha közben bárki hozzányúlt, a háttérmunka nem ír semmit.
 */
function arculatotHatterben(szervezetId: string, piszkozat: OnboardingPiszkozat, fiokId: string, induloVerzio: number): void {
  void (async () => {
    const profil = await profilTar.betolt(szervezetId);
    if (!profil || !erintetlenArculat(profil.arculat, induloVerzio)) return; // már hozzányúltak: AI-hívás sem kell
    const nyelv = profil.nyelvek?.[0] ?? "hu";
    const { tervezet } = await arculatotJavasol(szervezetId, piszkozat, nyelv, fiokId);
    const e = await arculatMent(szervezetId, (a) => hatterTervezetBefogad(a, tervezet, induloVerzio));
    if (!e.ok) { console.error("[arculat háttér] nem írtuk:", e.hiba); return; }
    if (!e.valtozatlan) peldakatFrissit(szervezetId);
  })().catch((h) => console.error("[arculat háttér] sikertelen:", h instanceof Error ? h.message : h));
}

export type JovahagyasEredmeny = { ok: true; ertek: SzervezetProfil } | { ok: false; hiba: HibaKod; mezok?: Record<string, string> };

/** Az onboarding utolsó tette (R-06): a piszkozatból profil a profile-core szabálya szerint → a profil kapuján át
 *  tárolva → a piszkozat törlődik. Innentől az onboarding nem működtet semmit; a hiteles profil a profilé. */
export async function profiltJovahagy(szervezetId: string, fiokId: string): Promise<JovahagyasEredmeny> {
  const piszkozat = await szervezetKent(szervezetId, async (tx) => {
    const sorok = await tx.select().from(sema.onboardingPiszkozat).where(eq(sema.onboardingPiszkozat.szervezetId, szervezetId)).limit(1);
    const sor = sorok[0];
    if (!sor) return null;
    const e = OnboardingPiszkozat.safeParse(sor.adatok);
    return e.success ? e.data : null;
  });
  if (!piszkozat) return { ok: false, hiba: "NINCS_PISZKOZAT" };
  const eredmeny = profilPiszkozatbol(piszkozat, fiokId);
  if (!eredmeny.ok) return { ok: false, hiba: eredmeny.hiba, mezok: eredmeny.mezok };
  const ellenorzott = SzervezetProfil.safeParse(eredmeny.profil);
  if (!ellenorzott.success) {
    const mezok: Record<string, string> = {};
    for (const p of ellenorzott.error.issues) { const ut = p.path.join("."); if (ut && !mezok[ut]) mezok[ut] = p.code; }
    return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok };
  }
  // c30 F0 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §8 risk 3): re-approval = the PREVIOUS profile first, then the draft's own
  // fields over it. The old whitelist (R-18 round 6: hivatalos_nevek; round 7: kinalat … honlap) is gone: a field the draft does not
  // produce can never be dropped, including fields a newer version wrote (unknown here). The previous profile is read RAW, so even a
  // stored profile with a broken core keeps its other fields; the draft supplies a valid core. Unparseable previous values are
  // left out of the result by `profilTureloOlvas` and put back in the database by `profilTar.ment` (`profilMentesre`).
  const korabbi = await profilNyersen(szervezetId).catch(() => null);
  const osszevont = profilTureloOlvas({ ...(korabbi ?? {}), ...ellenorzott.data });
  if (!osszevont.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: Object.fromEntries(osszevont.mezok.map((m) => [m, osszevont.ok_hiba])) };
  const profil = osszevont.profil;
  // R-18 7. kör: a honlap a piszkozatból jön, ha ott van (a beállítás olvassa); ha nincs, a korábbi marad
  const weboldal = piszkozat.bemutatkozas.weboldal.trim();
  if (weboldal) profil.honlap = weboldal.slice(0, 500);
  await profilTar.ment(szervezetId, profil);
  await szervezetKent(szervezetId, async (tx) => { await tx.delete(sema.onboardingPiszkozat).where(eq(sema.onboardingPiszkozat.szervezetId, szervezetId)); });
  await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: szervezetId, fajta: "profil_jovahagyva", fiok_id: fiokId, adat: {} }); // F-5
  peldakatFrissit(szervezetId); // VZ-2: a Képek hét helyzetének példaszövege a cég szakmájából — háttérben, nem várunk rá
  arculatotHatterben(szervezetId, piszkozat, fiokId, profil.arculat.verzio); // 2026-09-28: a cég színei (honlap / kutatás / AI) — háttérben
  return { ok: true, ertek: profil };
}
