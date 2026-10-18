export { Marka, SzovegStilus, Elrendezes, MezoMegjelenes, BlokkMegjelenes, Lepcsofok } from "./marka.ts";
export { Recept, ReceptMezo, kotelezoE, maxSor, kikoltoztetheto, mezoSorrend } from "./recept.ts";
export { Tartalom, Par } from "./tartalom.ts";
export { osszeallit, uresValasztas, type Valasztas, type Osszeallitas, type OsszeallitasOpciok } from "./html.ts";
export { MERO_SZKRIPT, meresOsszeallit, mezoTipus, szabalyCsalad, type LapMeres, type ElemMeres, type SzabalyMezoTipus } from "./meres.ts";
export { ellenoriz, kontraszt, hossz, type Szabaly, type Talalat, type EllenorzoKontextus, type Ellenorzo, type EllenorzesEredmeny } from "./ellenorzo.ts";
import { ELLENORZOK_A, NEM_DONTHETO_A } from "./ellenorzo-a.ts";
import { ELLENORZOK_B1, NEM_DONTHETO_B1 } from "./ellenorzo-b1.ts";
import { ELLENORZOK_B2a, NEM_DONTHETO_B2a } from "./ellenorzo-b2a.ts";
import { JAVITOTT_ELLENORZOK } from "./ellenorzo-javitas.ts";
import type { Ellenorzo } from "./ellenorzo.ts";
const valaszt = (forras: Record<string, Ellenorzo>, fajtak: string[]) =>
  Object.fromEntries(fajtak.filter((f) => forras[f]).map((f) => [f, forras[f]!] as const));
/** Az összes megírt ellenőrző, check-fajta szerint — minden fajtát az a fájl ad, amelyik a csoportjáért felel. */
export const ELLENORZOK: Record<string, Ellenorzo> = {
  ...valaszt(ELLENORZOK_A, ["date_format", "equal_size", "field_role", "fixed_size", "font_forbidden", "forbidden_chars", "ladder_order", "line_diff", "max_chars", "max_lines", "max_width_formula", "min_size", "scale_factor", "size_range", "size_steps", "text_case", "widow"]),
  ...valaszt(ELLENORZOK_B1, ["baseline", "capacity", "color_on_ground", "dimension", "grid", "inside_box", "min_gap", "no_overlap", "not_intersect", "position", "ratio_max", "zone_clear", "zone_text_forbidden"]),
  ...valaszt(ELLENORZOK_B2a, ["count_exact", "count_max", "required_field", "order", "enum_only"]),
  ...JAVITOTT_ELLENORZOK,
};
/** A méréstől el nem dönthető szabályok, indokkal. */
export const NEM_DONTHETO: Record<string, string> = { ...NEM_DONTHETO_A, ...NEM_DONTHETO_B1, ...NEM_DONTHETO_B2a };
export { illeszt, problemak, mezoOsszegzes, type MezoOsszegzes, type IllesztesEredmeny, type IllesztesProblema, type IllesztesLepes } from "./illesztes.ts";
export type { Mero, BetuUtvonal } from "./host.ts";
export {
  HELYZETEK,
  MERETEK,
  HelyzetArculat,
  HelyzetTartalom,
  SEMLEGES,
  BETUK,
  CIM_LEPCSO,
  CIM_MAX_SOR,
  MINTA,
  HELYZET_MERO,
  betuKulcs,
  raIrt,
  helyzetHtml,
  helyzetIllesztes,
  VALTOZATOK,
  paletta,
  valtozatok,
  // R-16 K2: logó a háttérhez, olvasható szöveg
  arculatLogok,
  logoValaszt,
  logoLemezek,
  vilagosHatter,
  olvashato,
  wcagArany,
  OLVASHATO,
  type Paletta,
  type KepLogo,
  type HelyzetLogok,
  type LogoValasztas,
  type Valtozat,
  type Helyzet,
  type Meret,
  type HelyzetMeres,
  type HelyzetEredmeny,
} from "./helyzet.ts";
// R-16 K6 (gepezet 13): a névlogó — tiszta SVG, a szöveg a `BetuUtvonal` porton át útvonallá alakítva; c10: három elrendezés
export {
  NEVLOGO_STILUSOK,
  NEVLOGO_VALTOZATOK,
  NEVLOGO_SZELES_MAX,
  NEVLOGO_KET_SOR,
  NEVLOGO_BELYEG_KET_SOR,
  NevlogoKeres,
  NevlogoSzinek,
  nevlogoSvg,
  nevlogoSorok,
  nevlogoSzoveg,
  nevlogoKezdobetu,
  nevlogoSzinezes,
  type NevlogoStilus,
  type NevlogoValtozat,
  type NevlogoBemenet,
  type NevlogoEredmeny,
  type NevlogoSzinezes,
} from "./nevlogo.ts";
