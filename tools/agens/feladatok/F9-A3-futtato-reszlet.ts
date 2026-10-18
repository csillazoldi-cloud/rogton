// apps/web/hirfigyelo/futtato.ts — RÉSZLET
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { Idozites, ertekelesUjra, figyelesFuttat, javaslatKiprobal } from "@km/news-monitor-core";

import { esedekes } from "@km/news-monitor-core";
import { db, sema } from "../adatbazis/kapcsolat";
import { kornyezet } from "./index";
import { beragadtakElenged, hibara, indulaskorElenged, kovetkezoKivesz, lezar, sorbaTesz, type SorTetel } from "./sor";
import { oraiTakaritas } from "../hitelesites/takaritas";

// A sor 15 perc után „beragadtnak” tekint egy tételt. A futás ennél EGY PERCCEL korábbi határidőt kap,
// hogy magától fejezze be és mentse, amit addig elért — különben a tétel lejárna, a munka pedig gazdátlanul futna tovább
// (mérve 2026-09-08: a lejárt tétel után még 12 percig ment az AI-hívás).
const FUTAS_HATARIDO_PERC = 14;
function hatarido(): Date {
  return new Date(Date.now() + FUTAS_HATARIDO_PERC * 60 * 1000);
}

// A Hírfigyelő futtatója (E-22): az alkalmazás saját folyamatában él (instrumentation.ts),
// 5 másodpercenként egy tick. Egyszerre EGY munka fut az egész rendszerben.

export const RENDSZER_FIOK = "00000000-0000-4000-8000-000000000000";

// Egypéldányosság: a Next több csomagban is betöltheti — a globalThis-en egyszer indul.
declare global {
// … (kihagyva) …

/** Egy tétel feldolgozása a fajta szerint. */
async function feldolgoz(tetel: SorTetel): Promise<void> {
  const k = await kornyezet(tetel.szervezetId, await tetelNyelve(tetel));
  const ktx = {
    fiok_id: RENDSZER_FIOK,
    szervezet_id: tetel.szervezetId,
    szerep: "tulajdonos" as const,
  };
  const proba = (tetel.adat as { proba?: boolean }).proba ?? false;

  let futasId: string | undefined;
  switch (tetel.fajta) {
    case "futas": {
      const e = await figyelesFuttat(k, ktx, { proba, hatarido: hatarido() });
      if (e.ok) {
        futasId = e.futas.id;
        await lezar(tetel.id, { futas_id: futasId });
      } else {
        await hibara(tetel.id, e.hiba);
      }
