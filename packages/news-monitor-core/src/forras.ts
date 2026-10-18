// Források: cím kiegészítése, osztályozás, kanonikus URL, ellenőrzési eredmény.
import { z } from "zod";

export const ForrasTipus = z.enum(["rss", "weboldal"]);
export type ForrasTipus = z.infer<typeof ForrasTipus>;

export const ForrasAllapot = z.enum(["ellenorzes_alatt", "hasznalhato", "korlatozott", "hibas", "nem_tamogatott"]);
export type ForrasAllapot = z.infer<typeof ForrasAllapot>;

export const Forras = z.object({
  id: z.string().min(1),
  cim: z.string().url(),
  tipus: ForrasTipus.nullable(),
  eredet: z.enum(["kezi", "ai_javaslat"]),
  allapot: ForrasAllapot,
  ellenorzott: z.boolean(),
  utolso_sikeres: z.iso.datetime().nullable(),
  hiba_ok: z.string().max(300).nullable(),
});
export type Forras = z.infer<typeof Forras>;

const NEM_TAMOGATOTT_GAZDAG = ["facebook.com", "fb.com", "m.facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com", "tiktok.com"];

/** Valódi gazdanév-e: tartománynév ponttal és legalább kétbetűs véggel, vagy IPv4/IPv6/localhost. */
function gazdaErvenyes(gazda: string): boolean {
  if (gazda === "localhost") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(gazda)) return true;
  if (gazda.includes(":")) return true; // IPv6 literál
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(gazda);
}

/**
 * A begépelt cím kiegészítése. A felhasználótól NEM várunk el protokollt és nem várunk el
 * hibátlan gépelést: „zi-de-zi.ro”, „www.zi-de-zi.ro/”, „ ZI-DE-ZI.ro. ” mind érvényes bevitel.
 * Visszatérés: a teljes cím, vagy null, ha ebből nem lesz cím.
 */
export function cimKiegeszit(be: string): string | null {
  let cim = be.trim().replace(/\s+/g, "");
  cim = cim.replace(/^[<("']+/, "").replace(/[>)"'.,;]+$/, "");
  if (cim === "") return null;
  // más protokoll (ftp:, file:, javascript: …) nem cím nekünk
  if (/^[a-z][a-z0-9+.-]*:/i.test(cim) && !/^https?:\/\//i.test(cim)) return null;
  if (!/^https?:\/\//i.test(cim)) cim = "https://" + cim;
  let u: URL;
  try {
    u = new URL(cim);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const gazda = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!gazdaErvenyes(gazda)) return null;
  u.hash = "";
  return u.toString();
}

/** A cím osztályozása: támogatott-e, és ha igen, valószínű típus (rss/weboldal). A `cim` a kiegészített cím. */
export function forrasCimOsztalyoz(cim: string): {
  cim: string;
  tipus: "rss" | "weboldal" | null;
  allapot: "ellenorzes_alatt" | "nem_tamogatott";
  ok: "belepes_mogott" | "nem_nyilvanos" | "ervenytelen" | null;
} {
  const nyers = cim.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(nyers) && !/^https?:\/\//i.test(nyers)) {
    return { cim: nyers, tipus: null, allapot: "nem_tamogatott", ok: "nem_nyilvanos" };
  }
  const teljes = cimKiegeszit(nyers);
  if (teljes === null) return { cim: nyers, tipus: null, allapot: "nem_tamogatott", ok: "ervenytelen" };
  const u = new URL(teljes);
  const gazda = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (NEM_TAMOGATOTT_GAZDAG.some((g) => gazda === g || gazda.endsWith("." + g))) return { cim: teljes, tipus: null, allapot: "nem_tamogatott", ok: "belepes_mogott" };
  if (gazda === "localhost" || gazda.endsWith(".local") || gazda.endsWith(".internal")) return { cim: teljes, tipus: null, allapot: "nem_tamogatott", ok: "nem_nyilvanos" };
  // IP-cím
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(gazda) || gazda.includes(":")) return { cim: teljes, tipus: null, allapot: "nem_tamogatott", ok: "nem_nyilvanos" };
  const ut = u.pathname.toLowerCase().replace(/\/+$/, "");
  const rss = ut.endsWith(".rss") || ut.endsWith(".xml") || ut.endsWith("/feed") || ut.endsWith("/rss") || ut.endsWith("/atom") || u.searchParams.has("feed");
  return { cim: teljes, tipus: rss ? "rss" : null, allapot: "ellenorzes_alatt", ok: null };
}

/** Kanonikus URL: kisbetűs séma/gazda, töredék és követő paraméterek nélkül, paraméterek rendezve. */
export function kanonikusUrl(cim: string): string {
  let u: URL;
  try {
    u = new URL(cim);
  } catch {
    throw new Error("ervenytelen_cim");
  }
  u.hash = "";
  const torlendo = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "mc_cid", "mc_eid"];
  for (const k of torlendo) u.searchParams.delete(k);
  const marad = [...u.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  u.search = "";
  for (const [k, v] of marad) u.searchParams.append(k, v);
  let ki = u.toString();
  if (ki.endsWith("/") && u.pathname !== "/") ki = ki.slice(0, -1);
  return ki;
}

/** Gyökér-cím-e: az útvonal üres vagy `/`, és nincs query. Érvénytelen URL → false. */
export function gyokerCim(cim: string): boolean {
  let u: URL;
  try {
    u = new URL(cim);
  } catch {
    return false;
  }
  const ut = u.pathname;
  return (ut === "" || ut === "/") && u.search === "";
}

/**
 * Az ellenőrzés eredményének alkalmazása a forrásra; AI-javaslat ellenőrzés előtt nem ellenőrzött.
 * `felfedezettCim`: ha a letöltő átirányítást követett vagy hírfolyamot talált a lapon, a forrás
 * címe erre cserélődik — így a következő futás már közvetlenül a jó címet kéri le.
 */
export function forrasEllenorzesEredmeny(
  f: Forras,
  e: { elerheto: boolean; tipus: ForrasTipus | null; szovegOlvashato: boolean; hibaOk: string | null; felfedezettCim?: string | null },
  most: Date,
): Forras {
  if (f.eredet === "ai_javaslat" && !f.ellenorzott) return { ...f, allapot: "ellenorzes_alatt", ellenorzott: false };
  if (!e.elerheto) return { ...f, allapot: "hibas", ellenorzott: true, hiba_ok: e.hibaOk ?? "nem_elerheto" };
  if (e.tipus === null) return { ...f, allapot: "hibas", ellenorzott: true, hiba_ok: e.hibaOk ?? "nincs_tipus" };
  if (e.tipus === "weboldal" && gyokerCim(e.felfedezettCim ?? f.cim)) {
    return { ...f, allapot: "hibas", ellenorzott: true, tipus: e.tipus, hiba_ok: "nincs_hirfolyam" };
  }
  const cim = e.felfedezettCim ?? f.cim;
  if (!e.szovegOlvashato) return { ...f, cim, allapot: "korlatozott", ellenorzott: true, tipus: e.tipus, utolso_sikeres: most.toISOString(), hiba_ok: null };
  return { ...f, cim, allapot: "hasznalhato", ellenorzott: true, tipus: e.tipus, utolso_sikeres: most.toISOString(), hiba_ok: null };
}
