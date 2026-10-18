// @km/news-monitor-promptok — a Hírfigyelő AI-utasításai (E-31).
// A promptok a MODUL részei, nem a befogadó alkalmazásé: mindkét host UGYANAZT az utasítást küldi a modellnek,
// így az értékelés is ugyanaz. Egy fájl nyelvenként nincs: a promptok magyarul íródnak, és a NYELVET
// a `{{nyelv}}` hely + a célnyelvi keretmondat adja (lásd `nyelviKeret`).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { HfFeladat } from "@km/news-monitor-core";

export const NYELVEK = ["hu", "ro", "en"] as const;
export type Nyelv = (typeof NYELVEK)[number];

const NYELV_NEVEK: Record<Nyelv, string> = { hu: "magyar", ro: "román", en: "angol" };

/**
 * MÉRVE (2026-09-08, helyi Qwen 27b): a magyarul megfogalmazott „a mezőket románul írd” utasítást a modell
 * FIGYELMEN KÍVÜL HAGYTA — a prompt elején és a végén is. A CÉLNYELVEN írt mondat viszont hat.
 * Ezért a nyelvfüggő promptot ez a mondat keretezi elöl és hátul.
 */
const NYELVI_KERET: Record<Nyelv, string | null> = {
  hu: null, // a prompt maga magyar, nem kell keret
  ro: "Scrie TOATE câmpurile text ale răspunsului în limba ROMÂNĂ.",
  en: "Write ALL text fields of the answer in ENGLISH.",
};

const gyorsitotar = new Map<string, string>();

function promptUt(feladat: HfFeladat): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "promptok", `${feladat}.hu.md`);
}

/** A nyers prompt-szöveg (behelyettesítés nélkül) — a próbákhoz és az ellenőrzéshez. */
export function nyersPrompt(feladat: HfFeladat): string {
  const meglevo = gyorsitotar.get(feladat);
  if (meglevo !== undefined) return meglevo;
  const szoveg = readFileSync(promptUt(feladat), "utf-8");
  gyorsitotar.set(feladat, szoveg);
  return szoveg;
}

/** A feladat rendszerutasítása a kért VÁLASZNYELVEN. Ezt küldi a host a modellnek. */
export function prompt(feladat: HfFeladat, nyelv: Nyelv = "hu"): string {
  const alap = nyersPrompt(feladat);
  const szoveg = alap.replaceAll("{{nyelv}}", NYELV_NEVEK[nyelv]); // F-8.3: a v5 promptban a hely többször szerepel
  const keret = alap.includes("{{nyelv}}") ? NYELVI_KERET[nyelv] : null;
  return keret ? `${keret}\n\n${szoveg.trimEnd()}\n\n${keret}` : szoveg;
}

/** Nyelvfüggő-e a prompt (van-e benne `{{nyelv}}` hely)? A beállítás-javaslat válasza nem próza, ezért nem az. */
export function nyelvfuggo(feladat: HfFeladat): boolean {
  return nyersPrompt(feladat).includes("{{nyelv}}");
}
