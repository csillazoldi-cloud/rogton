// A szerkesztő által kitöltött tartalom. Mezőnként a recept típusa mondja meg az alakot.
import { z } from "zod";

/** Nyelvpár. Egynyelvű lapnál a másodlagos hiányzik. */
export const Par = z.object({
  elsodleges: z.string().min(1),
  masodlagos: z.string().min(1).optional(),
});
export type Par = z.infer<typeof Par>;

export const IdoTartomany = z.object({
  kezdet: z.string().regex(/^\d{2}:\d{2}$/),
  veg: z.string().regex(/^\d{2}:\d{2}$/),
  veg_kozelito: z.boolean().default(false),
});

export const Jarat = z.object({ kod: z.string().min(1), nev: Par.optional() });

export const TablaSor = z.object({
  azonosito: z.string(),
  /** a kihagyott megállók: elemenként nyelvpár (a másodlagos hiányozhat: nincs neve a másik nyelven) */
  elemek: z.array(Par).optional(),
  /** szöveges érték nyelvpárként */
  szoveg: Par.optional(),
  /** időpont a fiók sablonmondatába ágyazva */
  ido: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const SavElem = z.object({ cimke: Par, ertek: z.number().min(0) });

export const AzonositoSor = z.object({
  sorszam: z.number().int().min(0),
  /** ISO dátum: ÉÉÉÉ-HH-NN */
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** A forrás: vagy a fiók „illusztratív adat” nyilatkozata, vagy valós forrás. */
export const Forras = z.union([z.object({ nyilatkozat: z.literal(true) }), z.object({ valos: Par })]);

export const Tartalom = z.object({
  recept: z.string(),
  formatum: z.object({ szelesseg: z.number().int().positive(), magassag: z.number().int().positive() }),
  mezok: z.record(z.string(), z.unknown()),
  /** mezőnkénti rövid változat (csak ahol a recept megengedi) */
  rovid: z.record(z.string(), Par).default({}),
});
export type Tartalom = z.infer<typeof Tartalom>;
