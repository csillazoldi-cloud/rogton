// @km/ai-adapters — szolgáltatók, hívások, hibák, költségmérés (ALAPTERV 5. pont).
// A hívó FELADATOT kér, nem konkrét modellt. Minden szolgáltató egy leírólapot ad magáról.
// A modell válasza JAVASLAT, nem jogosultság: a hívó program ellenőrzi, mielőtt bármit tenne vele.
// Helyi modell kiesésekor NINCS csendes átváltás felhőre.
import { z } from "zod";

/** Feladattípusok — szerződés feladatonként; az első: tevékenység-összefoglaló. */
export const FeladatTipus = z.enum(["osszefoglalo", "javaslatok", "hangnem_finomitas", "arculat_javaslat", "hf_beallitas_javaslat", "hf_relevancia", "hf_osszkep", "hf_ugyanaz_az_esemeny", "hf_szabaly_javaslat", "hf_tartalomotlet"]);
export type FeladatTipus = z.infer<typeof FeladatTipus>;

export const Hol = z.enum(["felho", "helyi"]);

