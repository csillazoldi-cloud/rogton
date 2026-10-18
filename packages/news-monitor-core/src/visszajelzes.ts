// Visszajelzés és szabályjavaslat.
import { z } from "zod";
import { Beallitas, type BeallitasVerzio } from "./beallitas";

export const VisszajelzesOk = z.enum(["masik_ceg", "nem_ez_a_tema", "tul_altalanos", "ismetlodo"]);
export type VisszajelzesOk = z.infer<typeof VisszajelzesOk>;

export const Visszajelzes = z.object({
  id: z.string().min(1),
  talalat_id: z.string().min(1),
  fajta: z.enum(["fontos", "nem_relevans"]),
  okok: z.array(VisszajelzesOk).max(4),
  sajat_indok: z.string().trim().max(300).default(""),
  letrehozva: z.iso.datetime(),
});
export type Visszajelzes = z.infer<typeof Visszajelzes>;

export const SzabalyJavaslat = z.object({
  id: z.string().min(1),
  szabaly_verzio: z.number().int().positive(),
  javasolt: Beallitas, // a javasolt TELJES beállítás (a felület a különbséget mutatja az aktívhoz képest)
  mi_alapjan: z.array(z.string()).min(1),
  indoklas: z.string().max(800),
  varhato_hatas: z.string().max(400),
  profil_erintett: z.boolean(),
  allapot: z.enum(["fuggo", "kiprobalt", "elfogadva", "elvetve"]),
  minta_id: z.string().nullable(),
  letrehozva: z.iso.datetime(),
});
export type SzabalyJavaslat = z.infer<typeof SzabalyJavaslat>;

/** Alkalmazható-e: csak fuggo/kiprobalt, és az AKTÍV verzióra épül. */
export function javaslatAlkalmazhato(j: SzabalyJavaslat, aktiv: BeallitasVerzio): boolean {
  return aktiv.allapot === "aktiv" && (j.allapot === "fuggo" || j.allapot === "kiprobalt") && j.szabaly_verzio === aktiv.verzio;
}

/** Döntés a javaslatról: elfogad vagy elvet. */
export function javaslatDontes(j: SzabalyJavaslat, dontes: "elfogad" | "elvet"): SzabalyJavaslat {
  return { ...j, allapot: dontes === "elfogad" ? "elfogadva" : "elvetve" };
}
