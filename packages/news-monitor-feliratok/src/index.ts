// @rogton/news-monitor-feliratok — a Hírfigyelő modul feliratai három nyelven (E-29).
// A FORRÁS a `feliratok/hf.<nyelv>.json`: ebből készül a webalkalmazás adatbázis-migrációja
// (`tools/feliratok/general.mjs`), és ugyanebből olvas a referencia-host, amelynek nincs adatbázisa.
// Így egy szöveg EGY helyen él — a második host nem másol (A-12).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const NYELVEK = ["hu", "ro", "en"] as const;
export type Nyelv = (typeof NYELVEK)[number];

export type Feliratok = Record<string, string>;

const gyorsitotar = new Map<Nyelv, Feliratok>();

function feliratokUt(nyelv: Nyelv): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "feliratok", `hf.${nyelv}.json`);
}

/** Egy nyelv teljes felirat-szótára (`hf.<kulcs>` → szöveg). A fájlt egyszer olvassuk be. */
export function feliratok(nyelv: Nyelv): Feliratok {
  const meglevo = gyorsitotar.get(nyelv);
  if (meglevo) return meglevo;
  const szotar = JSON.parse(readFileSync(feliratokUt(nyelv), "utf-8")) as Feliratok;
  gyorsitotar.set(nyelv, szotar);
  return szotar;
}

/** Egy felirat a megadott nyelven; ha ott nincs, magyarul; ha sehol, maga a kulcs. */
export function felirat(nyelv: Nyelv, kulcs: string): string {
  return feliratok(nyelv)[kulcs] ?? feliratok("hu")[kulcs] ?? kulcs;
}

/** A `{név}` helyőrzők behelyettesítése: `felirat` + értékek. */
export function feliratKitolt(nyelv: Nyelv, kulcs: string, ertekek: Record<string, string | number>): string {
  return felirat(nyelv, kulcs).replace(/\{(\w+)\}/g, (egesz, nev: string) => {
    const ertek = ertekek[nev];
    return ertek === undefined ? egesz : String(ertek);
  });
}

/** Minden kulcs (a magyar szótár szerint) — a teljesség ellenőrzéséhez. */
export function kulcsok(): string[] {
  return Object.keys(feliratok("hu"));
}
