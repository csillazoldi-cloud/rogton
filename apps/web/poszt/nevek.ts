// R-18 6. kör (Kati D, Csilla 10-11): a cég „Hivatalos nevek” listája — intézmények, események, előadások pontos neve három nyelven.
// Tiszta függvények (probak/r18-kor6.proba.ts): a gép elé kerülő kötelező névpárok, és az utóellenőrzés, ami a kért nyelven a többi
// nyelv alakját a hivatalos alakra cseréli. A lista a szervezet profiljában él (szervezet_profil.adatok.hivatalos_nevek).
import type { HivatalosNev } from "@km/contracts";

export type NevNyelv = "hu" | "ro" | "en";
const NYELVNEV: Record<NevNyelv, string> = { hu: "magyarul", ro: "románul", en: "angolul" };

/** Csak a kitöltött sorok, tisztítva (szóközök), legfeljebb 200; a teljesen üres sor kiesik. */
export function nevekTisztit(be: unknown): HivatalosNev[] {
  if (!Array.isArray(be)) return [];
  const ki: HivatalosNev[] = [];
  for (const sor of be) {
    const s = (sor ?? {}) as Record<string, unknown>;
    const t = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 200) : "");
    const n = { hu: t(s["hu"]), ro: t(s["ro"]), en: t(s["en"]) };
    if (n.hu || n.ro || n.en) ki.push(n);
    if (ki.length >= 200) break;
  }
  return ki;
}

/** A gép bemenetének blokkja: minden névpár egy sor. Üres listánál nincs blokk. */
export function nevekSorok(nevek: readonly HivatalosNev[] | null | undefined): string[] {
  const l = (nevek ?? []).filter((n) => n.hu || n.ro || n.en);
  if (l.length === 0) return [];
  return [
    "=== HIVATALOS NEVEK — kötelező: ha a szövegben előfordul, a kért nyelven PONTOSAN így írd; ha egy nyelv hiányzik, azt a nevet ne fordítsd ===",
    ...l.map((n) => (["hu", "ro", "en"] as const).filter((k) => n[k]).map((k) => `${NYELVNEV[k]}: ${n[k]}`).join(" · ")),
    "=== A NEVEK VÉGE ===",
  ];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Utóellenőrzés: a kért nyelvű szövegben a név MÁS nyelvű alakja (és a kisbetű/nagybetű eltérése) a hivatalos alakra cserél.
 * Csak ott, ahol a kért nyelven van hivatalos név; betűhatáron (a „Kultúrpalotában” toldalékos alakot nem bántja).
 */
export function nevCsere(szoveg: string, nevek: readonly HivatalosNev[] | null | undefined, cel: string): string {
  if (!szoveg || !nevek?.length || !["hu", "ro", "en"].includes(cel)) return szoveg;
  let ki = szoveg;
  const c = cel as NevNyelv;
  for (const n of nevek) {
    const jo = n[c];
    if (!jo) continue;
    for (const k of ["hu", "ro", "en"] as const) {
      const rossz = n[k];
      if (!rossz || rossz.length < 3 || rossz === jo) continue;
      ki = ki.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc(rossz)}(?![\\p{L}\\p{N}])`, "giu"), jo);
    }
    // a hivatalos alak más kis/nagybetűvel is a pontos alakra
    if (jo.length >= 3) ki = ki.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc(jo)}(?![\\p{L}\\p{N}])`, "giu"), jo);
  }
  return ki;
}
