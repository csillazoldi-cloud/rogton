// R-16 K2 (gepezet 9, TERV §2-K2): „Így néz ki” — a mintakép a még NEM jóváhagyott összeállítással.
// A `POST /api/vizual/helyzet-minta/[helyzet]` törzse. Tiszta: nem olvas adatbázist, nem hív képgyártót.
// Szabály: a törzs csak a színeket (és K5/K6-tól a betűket, a névlogó stílusát) írhatja felül; a logó a munkatér saját fájlja, vagy (K6)
// a GÉP által a kért stílusból most készített névlogó — bájtot vagy fájl-azonosítót a törzsből soha nem veszünk át (az ismeretlen kulcsot a zod eldobja).
import { z } from "zod";
import { HexSzin } from "@km/contracts";
import type { KepArculat, KepSajatBetu } from "./helyzet";

export const MintaKeres = z.object({
  /** a két „Így néz ki” kép: a világos és a színes (VZ-3); hiányában világos */
  valtozat: z.enum(["vilagos", "szines"]).optional(),
  /** a választott (még nem mentett) három szín */
  szinek: z.object({ fo: HexSzin, masodik: HexSzin, hatter: HexSzin }).optional(),
  /** K5: a két betű kulcsa (beépített kulcs vagy "sajat:<id>") — a saját betű bájtja a munkatér saját fájljából jön (a végpont tölti be) */
  betuk: z.object({ cim: z.string().max(80), szoveg: z.string().max(80) }).optional(),
  /** K6 (TERV §2-K6): a jelölt névlogó stílusa — a végpont a képgyártóval elkészítteti a négy PNG-t, és erre az egy képre azok állnak a
   *  logók helyén (a munkatér saját logói helyett); semmi nem tárolódik */
  nevlogo: z.object({ stilus: z.enum(["nev", "kor", "negyzet"]) }).optional(),
  /** R-17 A2 (12f2): a Logók lapon kijelölt hely — erre az egy képre a munkatér SAJÁT, ezen a helyen álló logója kerül minden helyre
   *  (a kép így azt a változatot mutatja). Csak a hely NEVE jön a törzsből, bájt vagy fájl-azonosító nem. */
  logo_hely: z.enum(["vilagos", "sotet", "egyszinu"]).optional(),
});
export type MintaKeres = z.infer<typeof MintaKeres>;

/** A munkatér tényleges arculata, erre az egy képre a kérés színeivel (és K5-től betűivel) felülírva. A logók érintetlenek.
 *  `sajatBetuk`: a kért "sajat:" kulcsok bájtja, amit a végpont a munkatér SAJÁT fájljaiból töltött be (vizual/helyzet.ts
 *  `sajatBetukAdat`) — ami nincs köztük, azt a kép a Public Sans-szal írja (idegen fájl így nem kerülhet a képre). */
export function mintaArculat(alap: KepArculat, k: MintaKeres, sajatBetuk: readonly KepSajatBetu[] = [], nevlogo?: KepArculat["logok"]): KepArculat {
  const ki: KepArculat = { ...alap, logok: alap.logok, logo: alap.logo };
  if (k.szinek) {
    ki.fo = k.szinek.fo.toLowerCase();
    ki.masodik = k.szinek.masodik.toLowerCase();
    ki.hatter = k.szinek.hatter.toLowerCase();
  }
  // R-16 K5 (TERV §2-K5 „POST helyzet-minta gains betuk”): a két betű; a régi `betu` a cím (TERV 1.3)
  if (k.betuk) {
    ki.betu_cim = k.betuk.cim;
    ki.betu_szoveg = k.betuk.szoveg;
    ki.betu = k.betuk.cim;
    const kert = new Set([k.betuk.cim, k.betuk.szoveg]);
    ki.sajat_betuk = [...(alap.sajat_betuk ?? []), ...sajatBetuk].filter((b, i, l) => kert.has(b.kulcs) && l.findIndex((x) => x.kulcs === b.kulcs) === i);
  }
  // R-16 K6: a jelölt névlogó PNG-i a logók helyén (a végpont készítteti el a képgyártóval a kérés `nevlogo` stílusával; nem tárolódik).
  // Csak akkor, ha a kérés névlogót kért — így a törzs magában soha nem tehet idegen képet a logó helyére.
  if (k.nevlogo && nevlogo) {
    ki.logok = { ...nevlogo };
    ki.logo = nevlogo.vilagos?.adat ?? nevlogo.egyszinu?.adat ?? null;
  }
  // R-17 A2: a kijelölt hely logója (a munkatér saját, már betöltött logója) minden helyen — ha azon a helyen nincs logó, nem változik semmi
  if (k.logo_hely && !k.nevlogo) {
    const l = alap.logok[k.logo_hely];
    if (l) {
      ki.logok = { vilagos: l, sotet: l, egyszinu: l, ...(alap.logok.negyzetes ? { negyzetes: alap.logok.negyzetes } : {}) };
      ki.logo = l.adat;
    }
  }
  return ki;
}
