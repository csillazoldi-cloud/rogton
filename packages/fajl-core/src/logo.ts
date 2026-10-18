// A5 (Kati 09-25: „a képszerkesztő nem vette át a feltöltött arculati elemeket”) — R-16 gepezet 1, kerdesek 5 (Csilla döntése):
// a logó NEM az arculati állapotgép része, hanem a munkatér saját fájlja. A kép mindig a LEGFRISSEBB feltöltött, képként
// használható logót kapja — akár jóváhagyott, akár „későbbre hagyott” az arculat, akár nincs tervezet. A színek és a betűk
// maradnak a jóváhagyás alatt. Tiszta függvény: a képek (apps/web vizual/helyzet.ts) és a fájllista „ez van használatban”
// jelvénye (ArculatAnyagok.tsx) ugyanezt kérdezi, így a kettő nem mondhat mást.
// Az R-16 2–4. pontja (logóváltozatok: vilagos/sotet/egyszinu/negyzetes) ezt bővíti: ugyanez a választás helyenként.
import type { FajlMeta, FajlTipus, LogoValtozat } from "./host";

/** A képgyártó ezeket tudja képként beágyazni (a PDF logó feltölthető, de a képre nem kerül). */
export const KEP_LOGO_TIPUSOK: readonly FajlTipus[] = ["png", "jpg", "webp"];
/** A képgyártó adat-URL-ként kapja a logót; e fölött kihagyjuk (vizual-core: logo ≤ 3 000 000 karakter base64). */
export const KEP_LOGO_MAX_BAJT = 2_000_000;

/** Képként használható logó-e (cél, típus, méret). */
export function kepreAlkalmasLogo(f: Pick<FajlMeta, "cel" | "tipus" | "meret">): boolean {
  return f.cel === "logo" && KEP_LOGO_TIPUSOK.includes(f.tipus) && f.meret > 0 && f.meret < KEP_LOGO_MAX_BAJT;
}

type LogoFajl = Pick<FajlMeta, "id" | "cel" | "tipus" | "meret" | "feltoltve"> & { logo_valtozat?: LogoValtozat | null | undefined };

/** A négy hely, sorrendben (R-16 gepezet 2). */
export const LOGO_VALTOZATOK: readonly LogoValtozat[] = ["vilagos", "sotet", "egyszinu", "negyzetes"];

export type HasznaltLogok = Record<LogoValtozat, string | null>;

/** Egy logó-sor helye: a régi (hely nélküli) sor világos. */
export function logoHelye(f: { logo_valtozat?: LogoValtozat | null | undefined }): LogoValtozat {
  return f.logo_valtozat ?? "vilagos";
}

/**
 * R-16 K1 (TERV 1.1): helyenként a képen használt logó azonosítója — a hely legfrissebb, képre alkalmas fájlja
 * (ugyanaz a döntés, mint `hasznaltLogoId`-nál: feltöltés ideje, egyező időnél az azonosító). A hely nélküli logó-sor
 * világosnak számít. Ahol nincs fájl (vagy a lista nem olvasható), ott a pillanatkép `logok[hely]`-e a tartalék.
 */
export function hasznaltLogok(
  fajlok: readonly LogoFajl[] | null | undefined,
  pillanatkepLogok: Partial<Record<LogoValtozat, string | null>> | null | undefined,
): HasznaltLogok {
  const legjobb: Record<LogoValtozat, LogoFajl | null> = { vilagos: null, sotet: null, egyszinu: null, negyzetes: null };
  for (const f of fajlok ?? []) {
    if (!kepreAlkalmasLogo(f)) continue;
    const h = logoHelye(f);
    const l = legjobb[h];
    if (!l || f.feltoltve > l.feltoltve || (f.feltoltve === l.feltoltve && f.id > l.id)) legjobb[h] = f;
  }
  const ki = {} as HasznaltLogok;
  for (const h of LOGO_VALTOZATOK) ki[h] = legjobb[h]?.id ?? pillanatkepLogok?.[h] ?? null;
  return ki;
}

/**
 * A képen használt logó azonosítója (A5): a munkatér legfrissebb, képre alkalmas világos logó-fájlja; ha ilyen nincs, a
 * pillanatkép/tervezet `logo_fajl_id`-je — a régi viselkedés. R-16 K1: = `hasznaltLogok(...).vilagos`, és ha a világos hely
 * üres, az egyszínű (a TERV 1.3 legacy `logo` mezőjének sorrendje) — így a 12f-en egyetlen fekete logót feltöltő munkatér
 * képe sem veszíti el a logót, amíg a képoldal (K2) a négy helyet nem ismeri. A sötét hely (fehér logó) a világos képre nem kerül.
 */
export function hasznaltLogoId(
  fajlok: readonly LogoFajl[] | null | undefined,
  pillanatkepLogoId: string | null | undefined,
): string | null {
  const h = hasznaltLogok(fajlok, { vilagos: pillanatkepLogoId ?? null });
  return h.vilagos ?? h.egyszinu;
}
