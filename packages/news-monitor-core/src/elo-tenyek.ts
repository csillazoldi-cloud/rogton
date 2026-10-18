// R-13 (2026-09-22): az előszűrő tényei egy cikkről — külön fájlban, hogy a talalat.ts és a tag-szures.ts ne hivatkozzon körbe.
import { z } from "zod";

/** Az előszűrő tényei egy cikkről (az értékelés `elo` mezőjében). */
export const EloTenyek = z.object({
  /** A szólista találatai; null = a szólista nem készült el (nincs szó-szűrés). A `hely` true, ha nincs helyfeltétel. */
  szolista: z.object({ nev: z.boolean(), hely: z.boolean(), tema: z.boolean() }).nullable(),
  /** A címlépés: fő téma lehet · csak érinti · egyik sem; null = nem futott rá, vagy nem sikerült. */
  cim: z.enum(["fo", "erinti", "nem"]).nullable(),
});
export type EloTenyek = z.infer<typeof EloTenyek>;
