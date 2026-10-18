import "server-only";
import { POSZT_NYELV_MODOK, ProfilModositas, Rendezveny, SzervezetProfil, type HibaKod, type PosztNyelvMod } from "@rogton/contracts";
import { arculatOsszefesul, nyelvMod, profilModositasAlkalmaz } from "@rogton/profile-core";
import { profilTar } from "./tar";
import { peldakatFrissit } from "../vizual/peldak";
import { nevekTisztit } from "../poszt/nevek";
import { kinalatTisztit, temakTisztit } from "./kinalat-szabaly";
import { helyTerv } from "./tipus-szabaly";

export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: HibaKod; mezok?: Record<string, string> };

/** A szervezet jóváhagyott profilja, vagy null. */
export function profilBetolt(szervezetId: string): Promise<SzervezetProfil | null> {
  return profilTar.betolt(szervezetId);
}

/** A jóváhagyott profil módosítása a fiókoldalon (E-10): a szabály a profile-core-é, a tárolás a tár-é. */
export async function profilModosit(szervezetId: string, be: unknown): Promise<Eredmeny<SzervezetProfil>> {
  const m = ProfilModositas.safeParse(be);
  if (!m.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: mezokbol(m.error.issues) };
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return { ok: false, hiba: "NINCS_JOG" };
  // R-16 K1 (TERV 1.7 R2): a régi doboz a TELJES arculatot küldi — egy elavult lap nem tüntethet el egy közben született
  // jóváhagyást: a pillanatképek maradnak (a kiszolgálóé nyer), a régebbi verzióból jövő írás 409 ELAVULT_ADAT.
  let modositas = m.data;
  if (m.data.arculat !== undefined) {
    const o = arculatOsszefesul(profil.arculat, m.data.arculat);
    if (!o.ok) return { ok: false, hiba: o.hiba };
    modositas = { ...m.data, arculat: o.arculat };
  }
  const uj = SzervezetProfil.safeParse(profilModositasAlkalmaz(profil, modositas));
  if (!uj.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: mezokbol(uj.error.issues) };
  await profilTar.ment(szervezetId, uj.data);
  peldakatFrissit(szervezetId); // VZ-2: ha a profil változott, a Képek példaszövegét a gép újraírja (háttérben)
  return { ok: true, ertek: uj.data };
}

function mezokbol(issues: { path: PropertyKey[]; code: string }[]): Record<string, string> {
  const mezok: Record<string, string> = {};
  for (const p of issues) { const ut = p.path.join("."); if (ut && !mezok[ut]) mezok[ut] = p.code; }
  return mezok;
}

/**
 * R-18 6. kör (Kati D): a „Hivatalos nevek” mentése — a teljes lista egyben (a lap a teljes listát küldi). A profil meglévő jsonb-jében
 * (szervezet_profil.adatok.hivatalos_nevek): új tábla és új sorszintű szabály nincs, a profil sorát a saját szervezet szabálya védi.
 */
export async function hivatalosNevekMent(szervezetId: string, be: unknown): Promise<Eredmeny<SzervezetProfil>> {
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return { ok: false, hiba: "NINCS_JOG" };
  const lista = nevekTisztit((be as { nevek?: unknown } | null)?.nevek);
  const uj = SzervezetProfil.safeParse({ ...profil, hivatalos_nevek: lista, frissitve: new Date().toISOString() });
  if (!uj.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: mezokbol(uj.error.issues) };
  await profilTar.ment(szervezetId, uj.data);
  return { ok: true, ertek: uj.data };
}

/**
 * R-18 7. kör (IRANYOK-round7.md): a kínálat és árak, az oldal és a szokások, a tématerv mentése — egyszerre egy vagy több rész
 * (az első beállítás lépésenként ment, a Szervezet adatai egyben). A meglévő profil-jsonb-ben (új tábla és új RLS nélkül).
 * `kesz: true` = a beállítás-sor végére ért (vagy kilépett belőle): a dátum a profilba kerül.
 */
export async function kinalatMent(szervezetId: string, be: unknown): Promise<Eredmeny<SzervezetProfil>> {
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return { ok: false, hiba: "NINCS_JOG" };
  const o = (be ?? {}) as Record<string, unknown>;
  const uj: SzervezetProfil = { ...profil, frissitve: new Date().toISOString() };
  if (o["kinalat"] !== undefined) uj.kinalat = kinalatTisztit(o["kinalat"]);
  if (o["arak_posztban"] !== undefined) {
    if (typeof o["arak_posztban"] !== "boolean") return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: { arak_posztban: "invalid_type" } };
    uj.arak_posztban = o["arak_posztban"];
  }
  if (o["kozossegi_oldal"] !== undefined) uj.kozossegi_oldal = typeof o["kozossegi_oldal"] === "string" ? o["kozossegi_oldal"].trim().slice(0, 300) : "";
  if (o["tema_terv"] !== undefined) uj.tema_terv = temakTisztit(o["tema_terv"]);
  if (o["kepernyokepek"] !== undefined) uj.kepernyokepek = Array.isArray(o["kepernyokepek"]) ? (o["kepernyokepek"] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 5) : [];
  if (o["kinalat_fajlok"] !== undefined) uj.kinalat_fajlok = Array.isArray(o["kinalat_fajlok"]) ? (o["kinalat_fajlok"] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 10) : [];
  if (typeof o["poszt_szokasok"] === "string") uj.poszt_szokasok = o["poszt_szokasok"].trim().slice(0, 800);
  if (typeof o["honlap"] === "string") uj.honlap = o["honlap"].trim().slice(0, 500);
  if (o["kesz"] === true) uj.beallitas_r7 = new Date().toISOString();
  const e = SzervezetProfil.safeParse(uj);
  if (!e.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: mezokbol(e.error.issues) };
  await profilTar.ment(szervezetId, e.data);
  return { ok: true, ertek: e.data };
}

/**
 * c30 F3 (plan §1.3, §2; rajz D5 „Hogyan posztoljunk két nyelven?” és D9b „Beállítások → Posztok nyelve”): a posztok nyelvi módja.
 * Csak a profil `poszt_nyelv_mod` mezője íródik, összefésülő írással (`mezoMent`, a saját szervezet szabályán belül) — a posztok
 * szövegéhez (`szovegek[]`) ez soha nem nyúl, így a mód váltása semmit nem veszít el. Egy nyelvű szervezetnél nincs mit menteni.
 */
export async function nyelvModMent(szervezetId: string, be: unknown): Promise<Eredmeny<PosztNyelvMod>> {
  const mod = (be as { mod?: unknown } | null)?.mod;
  if (typeof mod !== "string" || !(POSZT_NYELV_MODOK as readonly string[]).includes(mod)) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: { mod: "ervenytelen" } };
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return { ok: false, hiba: "NINCS_JOG" };
  if (profil.nyelvek.length < 2) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: { mod: "egy_nyelv" } };
  const e = await profilTar.mezoMent(szervezetId, { poszt_nyelv_mod: mod });
  if (!e.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: e.mezok };
  return { ok: true, ertek: nyelvMod({ nyelvek: profil.nyelvek, poszt_nyelv_mod: mod }) };
}

/**
 * c30 F6 (rajz D2 „Mikor és hol lesz?”): a rendezvény dátumai, települése nyelvenként és a belépő sora — csak a profil `rendezveny` mezője
 * íródik, összefésülő írással (`mezoMent`, a saját szervezet szabályán belül). Az első nap nem lehet az utolsó után.
 */
export async function rendezvenyMent(szervezetId: string, be: unknown, fordit?: (szoveg: string, cel: string) => Promise<string>): Promise<Eredmeny<Rendezveny>> {
  const r = Rendezveny.safeParse(be);
  if (!r.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: { rendezveny: "ervenytelen" } };
  const d = r.data;
  if (d.mettol && d.meddig && d.mettol > d.meddig) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: { meddig: "korabbi" } };
  const p = await profilTar.betolt(szervezetId);
  if (!p) return { ok: false, hiba: "NINCS_JOG" };
  // Csilla 10-17: the second-language town follows the first only while it is still the machine's (helyTerv); `hely_gep` never comes from the client
  const terv = helyTerv(d.hely ?? {}, p.rendezveny, p.rendezveny_javaslat, p.nyelvek[0] ?? "hu", p.nyelvek[1] ?? null);
  if (terv.forditani && fordit) {
    const f = await fordit(terv.forditani.szoveg, terv.forditani.cel).then((x) => x.trim().slice(0, 120)).catch(() => "");
    if (f) { terv.hely[terv.forditani.cel] = f; terv.gep[terv.forditani.cel] = f; } // failed → the machine's old town stays cleared, never a wrong one
  }
  const lathato: Rendezveny = { ...(d.mettol ? { mettol: d.mettol } : {}), ...(d.meddig ? { meddig: d.meddig } : {}), ...(Object.keys(terv.hely).length ? { hely: terv.hely } : {}), ...(d.belepo?.trim() ? { belepo: d.belepo.trim() } : {}) };
  const e = await profilTar.mezoMent(szervezetId, { rendezveny: { ...lathato, ...(Object.keys(terv.gep).length ? { hely_gep: terv.gep } : {}) } });
  if (!e.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: e.mezok };
  return { ok: true, ertek: lathato };
}
