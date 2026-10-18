// @km/onboarding-core — a három lépés SZABÁLYAI (ALAPTERV 2.: a folyamat, a piszkozat, az AI-javaslat kezelése).
// Tiszta függvények: nincs adatbázis, nincs képernyő, nincs hálózat. A profil szabályait a profile-core adja
// (ez a modul azt HASZNÁLJA); a tárolást és az AI-hívást a befogadó alkalmazás.
import { TARTALOMNYELVEK, type JavaslatokValasz, type OnboardingPiszkozat, type Tartalomnyelv } from "@km/contracts";
import { sajatVagyModositott } from "@km/profile-core";

export type Kommunikacio = OnboardingPiszkozat["kommunikacio"];
export type ProfilMezo = "nev" | "tevekenyseg" | "celkozonseg" | "cel" | "nyelvek" | "hangnem";
export const PROFIL_MEZOK: ProfilMezo[] = ["nev", "tevekenyseg", "celkozonseg", "cel", "nyelvek", "hangnem"];

/** A tartalomnyelv: a piszkozat nyelvei közül az első hu/ro; ha nincs, a felület nyelve (hu/ro/en). */
export function tartalomnyelv(piszkozat: OnboardingPiszkozat, felulet: string): Tartalomnyelv {
  const elso = piszkozat.kommunikacio.nyelvek.find((n) => n === "hu" || n === "ro");
  if (elso) return elso;
  if (felulet === "hu" || felulet === "ro" || felulet === "en") return felulet;
  return "hu";
}

/** Az AI-javaslatok beolvasztása (v6 seedStep2): csak az üres, nem „későbbre hagyott” mezőket tölti ki. */
export function javaslatokBeolvaszt(k: Kommunikacio, v: Omit<JavaslatokValasz, "forras">): Kommunikacio {
  const uj: Kommunikacio = { ...k, javaslatok_kerve: true };
  if (!k.celkozonseg && !k.celkozonseg_kesobb && v.celkozonseg) Object.assign(uj, { celkozonseg: v.celkozonseg, celkozonseg_forras: "ai", celkozonseg_modositva: false });
  if (!k.cel && !k.cel_kesobb && v.cel) Object.assign(uj, { cel: v.cel, cel_forras: "ai", cel_modositva: false });
  if (k.nyelvek.length === 0) uj.nyelvek_javasolt = v.nyelvek.filter((x) => (TARTALOMNYELVEK as readonly string[]).includes(x));
  if (!k.hangnem_leiras && !k.hangnem_kesobb && v.hangnem_leiras) {
    Object.assign(uj, { hangnem_leiras: v.hangnem_leiras, hangnem_minta: v.hangnem_minta, hangnem_nyelv: v.tartalomnyelv, hangnem_forras: "ai", hangnem_modositva: false });
  }
  return uj;
}

/** A 3. lépés soronkénti szerkesztése (v6 applyEdit): saját érték vagy módosított javaslat; a „későbbre” feloldódik. */
export function piszkozatMezoSzerkeszt(p: OnboardingPiszkozat, mezo: ProfilMezo, ertek: string | Tartalomnyelv[]): OnboardingPiszkozat {
  const pb = p.bemutatkozas, pk = p.kommunikacio;
  const v = typeof ertek === "string" ? ertek.trim() : "";
  switch (mezo) {
    case "nev": return { ...p, bemutatkozas: { ...pb, nev: v } };
    case "tevekenyseg": { const u = sajatVagyModositott(pb.osszefoglalo_forras); return { ...p, bemutatkozas: { ...pb, osszefoglalo: v, osszefoglalo_forras: u.forras === "" ? "sajat" : u.forras, osszefoglalo_modositva: u.modositva } }; }
    case "celkozonseg": { const u = sajatVagyModositott(pk.celkozonseg_forras); return { ...p, kommunikacio: { ...pk, celkozonseg: v, celkozonseg_forras: u.forras, celkozonseg_modositva: u.modositva, celkozonseg_kesobb: false } }; }
    case "cel": { const u = sajatVagyModositott(pk.cel_forras); return { ...p, kommunikacio: { ...pk, cel: v, cel_forras: u.forras, cel_modositva: u.modositva, cel_kesobb: false } }; }
    case "nyelvek": return { ...p, kommunikacio: { ...pk, nyelvek: Array.isArray(ertek) ? ertek : [], nyelvek_javasolt: [], nyelvek_forras: "sajat" } };
    case "hangnem": { const u = sajatVagyModositott(pk.hangnem_forras); return { ...p, kommunikacio: { ...pk, hangnem_leiras: v, hangnem_minta: "", hangnem_forras: u.forras, hangnem_modositva: u.modositva, hangnem_kesobb: false } }; }
  }
}

/** A piszkozat egy mezőjének megjelenő értéke (üres, ha későbbre hagyott). */
export function piszkozatMezoErtek(p: OnboardingPiszkozat, mezo: ProfilMezo): string {
  const b = p.bemutatkozas, k = p.kommunikacio;
  switch (mezo) {
    case "nev": return b.nev;
    case "tevekenyseg": return b.osszefoglalo;
    case "celkozonseg": return k.celkozonseg_kesobb ? "" : k.celkozonseg;
    case "cel": return k.cel_kesobb ? "" : k.cel;
    case "nyelvek": return k.nyelvek.join(",");
    case "hangnem": return k.hangnem_kesobb ? "" : k.hangnem_leiras;
  }
}
export function piszkozatMezoUres(p: OnboardingPiszkozat, mezo: ProfilMezo): boolean {
  return mezo === "nyelvek" ? p.kommunikacio.nyelvek.length === 0 : !piszkozatMezoErtek(p, mezo).trim();
}
export function piszkozatMezoKesobb(p: OnboardingPiszkozat, mezo: ProfilMezo): boolean {
  const k = p.kommunikacio;
  return (mezo === "celkozonseg" && k.celkozonseg_kesobb) || (mezo === "cel" && k.cel_kesobb) || (mezo === "hangnem" && k.hangnem_kesobb);
}
/** Jóváhagyható-e: név és elfogadott tevékenységleírás (ATADO 6.1) — a profile-core ugyanezt kényszeríti ki. */
export function jovahagyhato(p: OnboardingPiszkozat): boolean {
  return p.bemutatkozas.nev.trim().length > 0 && p.bemutatkozas.osszefoglalo.trim().length > 0;
}
/** Nyelvek beolvasása kézi szövegből: kódok vagy a megadott nevek, vesszővel. */
export function nyelvekSzovegbol(szoveg: string, nevek: Record<string, string>): Tartalomnyelv[] {
  const darabok = szoveg.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return TARTALOMNYELVEK.filter((kod) => darabok.includes(kod) || darabok.includes((nevek[kod] ?? "").toLowerCase()));
}

/** A8 (Kami, 2026-09-25): a „Mivel foglalkoztok?” mező legalább ennyi — alatta a gép nem tud mit összefoglalni
 *  („A megadott forrásból nem derül ki…”). A felület az AI hívása ELŐTT szól, és nem költ rá. */
export const LEIRAS_MIN_BETU = 40;
export const LEIRAS_MIN_SZO = 5;

/** Túl rövid-e a saját leírás ahhoz, hogy a gép összefoglalót írjon belőle (weboldal nélkül). Tiszta függvény. */
export function leirasTulRovid(leiras: string): boolean {
  const t = leiras.trim();
  const szavak = t.split(/\s+/).filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
  return t.length < LEIRAS_MIN_BETU || szavak < LEIRAS_MIN_SZO;
}

/** A8: a tevékenység-összefoglaló gépi válasza „kevés a forrás” jelzés-e (prompt v2: `NEM_DERUL_KI` az elején).
 *  A v1 szöveges válasza („A megadott forrásból nem derül ki egyértelműen a tevékenység…”) is ide számít —
 *  ez soha nem kerülhet összefoglalóként a profilba. */
export function nemDerulKi(szoveg: string): boolean {
  const t = szoveg.trim();
  return /^[^\p{L}\p{N}]*NEM_DERUL_KI(?![\p{L}\p{N}_])/u.test(t) || /nem derül ki egyértelműen a\s+tevékenység/iu.test(t);
}
