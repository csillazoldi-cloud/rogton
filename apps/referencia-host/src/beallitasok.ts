// A referencia-host BEÁLLÍTÁSAI: minden a `profil.json`-ból jön (a host adja a profilt — 10.3 —, nem gyűjti).
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { SzervezetProfil } from "@km/contracts";
import { Beallitas } from "@km/news-monitor-core";

export const HostBeallitasok = z.object({
  szervezet_id: z.uuid(),
  fiok_id: z.uuid(),
  /** Az SQLite-fájl útvonala (a host gyökeréhez képest is megadható); ":memory:" is lehet. */
  adatbazis: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(8500),
  /** „teszt”: determinisztikus, hálózat nélküli csatlakozó; „ollama”: a helyi modell (a promptok könyvtárával). */
  ai: z.enum(["teszt", "ollama"]).default("teszt"),
  /** „rogzitett”: beépített minta-cikkek (hálózat nélkül); „valodi”: a közös `@km/letolto` csomag. */
  letolto: z.enum(["rogzitett", "valodi"]).default("rogzitett"),
  /** A VÁLASZ nyelve: ezen a nyelven ír az AI (a felület nyelvét a látogató választja). */
  nyelv: z.enum(["hu", "ro", "en"]).default("hu"),
  /** Útvonal-előtag, ha a host nem a gyökéren felel (pl. "/referencia" egy megosztott kiszolgáló mögött).
   *  Üres = a gyökér. A záró perjelet levágjuk, a kezdőt pótoljuk. */
  alap_ut: z.string().default("").transform((u) => {
    const t = u.trim().replace(/\/+$/, "");
    if (t === "") return "";
    return t.startsWith("/") ? t : `/${t}`;
  }),
  /** Az ütemező körének hossza ezredmásodpercben. */
  utemezo_ms: z.number().int().min(1000).default(5000),
  forrasok: z.array(z.string().min(1)).default([]),
  kezdo_beallitas: Beallitas,
  profil: SzervezetProfil,
});
export type HostBeallitasok = z.infer<typeof HostBeallitasok>;

/** A host gyökere (a `src` fölött) — a profil.json és az SQLite-fájl ehhez képest oldódik fel. */
export function hostGyoker(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

export function utFeloldas(ut: string): string {
  if (ut === ":memory:" || isAbsolute(ut)) return ut;
  return join(hostGyoker(), ut);
}

/** A `profil.json` beolvasása és ellenőrzése. Hibás fájl esetén beszédes kivétel — a host el sem indul rosszul. */
export function beallitasokOlvas(profilUt?: string): HostBeallitasok {
  const ut = utFeloldas(profilUt ?? "profil.json");
  let nyers: unknown;
  try {
    nyers = JSON.parse(readFileSync(ut, "utf-8")) as unknown;
  } catch (hiba) {
    throw new Error(`A beállításfájl nem olvasható: ${ut} (${hiba instanceof Error ? hiba.message : String(hiba)})`);
  }
  const ell = HostBeallitasok.safeParse(nyers);
  if (!ell.success) {
    throw new Error(`A beállításfájl hibás: ${ut}\n${JSON.stringify(ell.error.issues, null, 2)}`);
  }
  return ell.data;
}
