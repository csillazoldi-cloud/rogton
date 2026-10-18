// A csatlakozási pontok: szerepek, jogosultság, AI-hívó, események.
import { z } from "zod";
import type { HfBemenet, HfFeladat } from "./ai";

export const Szerep = z.enum(["tulajdonos", "szerkeszto", "nezo"]);
export type Szerep = z.infer<typeof Szerep>;

export const HostKontextus = z.object({
  fiok_id: z.uuid(),
  szervezet_id: z.uuid(),
  szerep: Szerep,
});
export type HostKontextus = z.infer<typeof HostKontextus>;

export const Muvelet = z.enum(["nez", "beallit", "futtat", "visszajelez", "javaslat_dont"]);
export type Muvelet = z.infer<typeof Muvelet>;

/** Jogosultság: tulajdonos és szerkesztő mindent; néző csak nézhet. */
export function jogosult(szerep: Szerep, muvelet: Muvelet): boolean {
  if (szerep === "tulajdonos" || szerep === "szerkeszto") return true;
  return muvelet === "nez";
}

export type AiHivo = <F extends HfFeladat>(
  feladat: F,
  bemenet: HfBemenet[F],
) => Promise<{ ok: true; valasz: unknown; becsult_usd: number } | { ok: false; kod: "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_NINCS_KULCS" | "AI_ROSSZ_VALASZ" }>;

export type HirfigyeloEsemeny = {
  fajta: "futas_indult" | "futas_kesz" | "futas_hiba" | "mentes_hiba" | "keret_kimerult";
  szervezet_id: string;
  futas_id?: string;
  uj_talalatok?: number;
  reszlet?: string;
};

/** F9-A3: a futás haladása — a host a sor tételébe írja, a képernyő ezt mutatja. */
export type FutasHaladas = { forrasok_letoltve: number; forrasok_osszes: number; cikkek_talalt: number; cikkek_ertekelve: number; cikkek_ertekelendo: number };
