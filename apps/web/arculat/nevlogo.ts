import "server-only";
// R-16 K6 (TERV §2-K6, 1.6, 1.7 R5; gepezet 13; kerdesek 4) — a névlogó a web oldalán: a 12g „Készítsünk egyet?” adata, a mentés és az
// újrakészítés. A kép (SVG + PNG) a képgyártóban készül (`POST /nevlogo`, apps/kepgyar/src/nevlogo.ts) — itt csak a kérés és a tárolás.
//  - `nevlogoMent`: „Ez legyen” = a négy hely × (PNG + SVG) = 8 ÚJ `arculat_fajl` sor (`cel='logo'`, `eredet='gep'`, `logo_valtozat` = a hely),
//    majd EGY `arculatMent`: `nevlogo_stilus` + jóváhagyás (kerdesek 4); a pillanatkép `logok`-ja már az új PNG-ket rögzíti.
//  - `regeneral`: a színek (12d/12d2) vagy a cím-betű (12e) „Ez legyen”-je után — CSAK azokra a helyekre ír új sort, ahol a hely legfrissebb
//    fájlja a gépé (`eredet='gep'`). A feltöltött logót soha nem írja felül és nem készíti újra (1.6); sort nem módosít, nem töröl (R5).
//  - `nevlogoKepLogok`: a jelölt névlogó PNG-i a „Így néz ki” képhez (POST helyzet-minta `nevlogo`) — nem tárolódik.
// A profilt a `profil/tar`-ból, a fájlokat a `fajl/tar`-ból olvassuk (TERV §3); `vizual/*`-ot nem importálunk (a képgyártó hívása ezért itt
// külön áll — ugyanaz a KEPGYAR_URL, mint a vizual/helyzet.ts-é).
import { randomUUID } from "node:crypto";
import type { ArculatLepes, ArculatLogok, ArculatTervezet, SzervezetProfil } from "@rogton/contracts";
import { LOGO_VALTOZATOK, logoHelye, type FajlMeta, type LogoValtozat } from "@rogton/fajl-core";
import { ARCULAT_ALAP, arculatModosit } from "@rogton/profile-core";
import { hexbol, nemMarkaszin, relativVilagossag, sajatBetuId, type LogoElemzes } from "@rogton/arculat-core";
import { profilTar } from "../profil/tar";
import { fajlTar } from "../fajl/tar";
import { alapTervezet } from "./alap";
import { jovahagyottKep } from "./allapot";
import { jovahagyTenyleges } from "./lepes";
import { alapA, arculatMent, hasznaltLogokMost, type MentEredmeny } from "./ment";

/** A három stílus (a contracts `nevlogo_stilus` enumja; a vizual-core `NEVLOGO_STILUSOK`-a — a web a vizual-core-t nem importálja).
 *  c10 (UTOKERES-12G): nev = szó · kor = kezdőbetű körben, alatta a név · negyzet = a név kerettel sávban. A tárolt értékek maradnak. */
export const NEVLOGO_STILUSOK = ["nev", "kor", "negyzet"] as const;
export type NevlogoStilus = (typeof NEVLOGO_STILUSOK)[number];
export const nevlogoStilusE = (s: unknown): s is NevlogoStilus => (NEVLOGO_STILUSOK as readonly unknown[]).includes(s);

/** A képgyártó `POST /nevlogo` kérése (vizual-core `NevlogoKeres`). */
export type NevlogoBemenet = {
  nev: string;
  stilus: NevlogoStilus;
  szinek: { fo: string; masodik: string; hatter: string };
  /** a cím-betű kulcsa (beépített kulcs vagy "sajat:<id>") */
  betu: string;
  sajat_betu?: { adat: string; formatum: "truetype" | "opentype" | "woff2" };
};
/** Egy változat a képgyártótól: SVG (szöveg), PNG (bájtok), a viewBox mérete, a fő festék és a színek. */
export type NevlogoValtozat = { svg: string; png: Uint8Array; szelesseg: number; magassag: number; tinta: string; szinek: string[] };
export type NevlogoValtozatok = Record<LogoValtozat, NevlogoValtozat>;
/** A névlogó-készítő (alapból a képgyártó; a próba hamisat ad). */
export type NevlogoKeszito = (b: NevlogoBemenet) => Promise<NevlogoValtozatok>;

export class NevlogoHiba extends Error {
  constructor(readonly kod: "KEPGYAR_NEM_VALASZOL" | "ERVENYTELEN_ADAT") {
    super(kod);
  }
}

const KEPGYAR = process.env["KEPGYAR_URL"] ?? "http://kepgyar:8601";

/** A képgyártó hívása (30 mp: a képgyártó egyszerre egy munkát végez, a 12g képei előtte állhatnak). */
export const kepgyarNevlogo: NevlogoKeszito = async (b) => {
  let v: Response;
  try {
    v = await fetch(`${KEPGYAR}/nevlogo`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b), signal: AbortSignal.timeout(30_000), cache: "no-store" });
  } catch {
    throw new NevlogoHiba("KEPGYAR_NEM_VALASZOL");
  }
  if (v.status === 400) throw new NevlogoHiba("ERVENYTELEN_ADAT");
  const j = (await v.json().catch(() => null)) as { valtozatok?: Record<string, { svg: string; png: string; szelesseg: number; magassag: number; tinta: string; szinek: string[] }> } | null;
  if (!v.ok || !j?.valtozatok) throw new NevlogoHiba("KEPGYAR_NEM_VALASZOL");
  const ki = {} as NevlogoValtozatok;
  for (const h of LOGO_VALTOZATOK) {
    const e = j.valtozatok[h];
    if (!e || typeof e.svg !== "string" || typeof e.png !== "string") throw new NevlogoHiba("KEPGYAR_NEM_VALASZOL");
    ki[h] = { svg: e.svg, png: new Uint8Array(Buffer.from(e.png, "base64")), szelesseg: e.szelesseg, magassag: e.magassag, tinta: e.tinta, szinek: e.szinek };
  }
  return ki;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Amiből a névlogó készül — ugyanaz, amiből a képek (allapot.ts, vizual/helyzet.ts `kepArculat`): a jóváhagyott pillanatkép,
 *  különben a színes tervezet, különben az alapszett. A cím-betű ugyanazzal a tartalékkal (üres → a szöveg-betű → Public Sans). */
export function nevlogoForras(p: Pick<SzervezetProfil, "arculat" | "nev" | "osszefoglalo" | "nyelvek">): { szinek: NevlogoBemenet["szinek"]; betu: string; stilus: NevlogoStilus | null } {
  const a = p.arculat;
  const t: Pick<ArculatTervezet, "elsodleges" | "masodlagos" | "hatter" | "betu_cim" | "betu_szoveg" | "nevlogo_stilus"> =
    jovahagyottKep(a) ?? (a.tervezet?.elsodleges ? a.tervezet : alapTervezet(p.nev, p.osszefoglalo, p.nyelvek?.[0] ?? "hu"));
  // hibás / üres szín (régi adat) → a profil-mag semleges alapja (a 12f próbahátterei is ezt használják)
  const fo = (HEX.test(t.elsodleges) ? t.elsodleges : ARCULAT_ALAP.elsodleges).toLowerCase();
  const hatter = (HEX.test(t.hatter) ? t.hatter : ARCULAT_ALAP.hatter).toLowerCase();
  const masodik = HEX.test(t.masodlagos) ? t.masodlagos.toLowerCase() : fo;
  return { szinek: { fo, masodik, hatter }, betu: t.betu_cim || t.betu_szoveg || "public-sans", stilus: a.tervezet?.nevlogo_stilus ?? jovahagyottKep(a)?.nevlogo_stilus ?? null };
}

const BETU_FORMATUM: Record<string, "truetype" | "opentype" | "woff2"> = { ttf: "truetype", otf: "opentype", woff2: "woff2" };

/** A saját cím-betű bájtja — CSAK a munkatér saját `betu` fájljából (mint a képeknél, vizual/helyzet.ts `sajatBetukAdat`). */
async function sajatBetu(szervezetId: string, betu: string): Promise<NevlogoBemenet["sajat_betu"] | undefined> {
  const id = sajatBetuId(betu);
  if (!id) return undefined;
  // Csilla 2026-10-10 (100 MB): előbb a meta — csak a valóban `betu` célú (≤ 10 MB) fájl töltődik be
  const m = await fajlTar.meta(szervezetId, id).catch(() => null);
  const formatum = m ? BETU_FORMATUM[m.tipus] : undefined;
  if (!m || m.cel !== "betu" || !formatum) return undefined; // nincs meg: a képgyártó a Public Sans-szal ír
  const b = await fajlTar.olvas(szervezetId, id).catch(() => null);
  if (!b) return undefined;
  return { adat: `data:font/${m.tipus};base64,${Buffer.from(b).toString("base64")}`, formatum };
}

/** A kérés a munkatér mostani színeivel és cím-betűjével (a „felülírás” a POST helyzet-minta még nem mentett színeié). */
export async function nevlogoBemenet(szervezetId: string, nev: string, stilus: NevlogoStilus, profil: SzervezetProfil, felulir?: { szinek?: NevlogoBemenet["szinek"]; betu?: string }): Promise<NevlogoBemenet> {
  const f = nevlogoForras(profil);
  const betu = felulir?.betu ?? f.betu;
  const s = await sajatBetu(szervezetId, betu);
  return { nev, stilus, szinek: felulir?.szinek ?? f.szinek, betu, ...(s ? { sajat_betu: s } : {}) };
}

/** A tárolt elemzés (arculat-core LogoElemzes, K1) — így a kép a gépi logót is átlátszónak ismeri, és a sötét háttéren fehérre színezheti. */
export function nevlogoElemzes(v: NevlogoValtozat): LogoElemzes {
  const rgb = hexbol(v.tinta);
  const szinek = [...new Set(v.szinek.map((s) => s.toLowerCase()))];
  return {
    atlatszo: true,
    vilagossag: rgb ? Math.min(1, Math.max(0, relativVilagossag(rgb))) : 0,
    szinszam: szinek.length,
    arany: Math.min(100, Math.max(0.01, v.szelesseg / Math.max(0.01, v.magassag))),
    szinek: szinek.filter((s) => { const r = hexbol(s); return r ? nemMarkaszin(r) : false; }).slice(0, 5),
  };
}

/** A jelölt névlogó a „Így néz ki” képhez: a négy hely adat-URL-je (PNG), átlátszó, a festék világosságával. */
export function nevlogoKepLogok(v: NevlogoValtozatok): Record<LogoValtozat, { adat: string; atlatszo: boolean; vilagossag: number }> {
  const ki = {} as Record<LogoValtozat, { adat: string; atlatszo: boolean; vilagossag: number }>;
  for (const h of LOGO_VALTOZATOK) {
    const e = nevlogoElemzes(v[h]);
    ki[h] = { adat: `data:image/png;base64,${Buffer.from(v[h].png).toString("base64")}`, atlatszo: e.atlatszo, vilagossag: e.vilagossag };
  }
  return ki;
}

/**
 * Tiszta: azok a helyek, ahol a hely LEGFRISSEBB logó-fájlja (bármilyen típus: PNG, SVG, PDF) a gépé — csak ezek készülnek újra.
 * Ha a hely legfrissebb fájlja feltöltött (vagy a honlapról jött), a hely a munkatáré: nem nyúlunk hozzá (TERV 1.6).
 */
export function ujraKeszitendoHelyek(fajlok: readonly Pick<FajlMeta, "id" | "cel" | "feltoltve" | "eredet" | "logo_valtozat">[]): LogoValtozat[] {
  const legfrissebb: Partial<Record<LogoValtozat, (typeof fajlok)[number]>> = {};
  for (const f of fajlok) {
    if (f.cel !== "logo") continue;
    const h = logoHelye(f);
    const l = legfrissebb[h];
    if (!l || f.feltoltve > l.feltoltve || (f.feltoltve === l.feltoltve && f.id > l.id)) legfrissebb[h] = f;
  }
  return LOGO_VALTOZATOK.filter((h) => legfrissebb[h]?.eredet === "gep");
}

/** A megadott helyekre új PNG + SVG sor (`eredet='gep'`). Csak beszúrás. A PNG-k azonosítója helyenként. */
async function fajlokIr(szervezetId: string, fiokId: string, stilus: NevlogoStilus, v: NevlogoValtozatok, helyek: readonly LogoValtozat[]): Promise<Partial<Record<LogoValtozat, string>>> {
  const most = new Date().toISOString();
  const ki: Partial<Record<LogoValtozat, string>> = {};
  for (const h of helyek) {
    const e = v[h];
    const elemzes = nevlogoElemzes(e);
    const svg = new TextEncoder().encode(e.svg);
    const kozos = { szervezet_id: szervezetId, cel: "logo" as const, feltoltotte: fiokId, feltoltve: most, logo_valtozat: h, eredet: "gep" as const, elemzes };
    // az SVG a hordozható mester (képre nem kerül); a PNG a képeké (`kepreAlkalmasLogo`)
    await fajlTar.ment({ ...kozos, id: randomUUID(), nev: `nevlogo-${stilus}-${h}.svg`, tipus: "svg", meret: svg.byteLength }, svg);
    const id = randomUUID();
    await fajlTar.ment({ ...kozos, id, nev: `nevlogo-${stilus}-${h}.png`, tipus: "png", meret: e.png.byteLength }, e.png);
    ki[h] = id;
  }
  return ki;
}

/** „Ez legyen” a 12g-n: a stílus mentése + jóváhagyás egy lépésben; tervezet nélkül az alapszettre épül (lepes.ts szabálya). */
export function nevlogoJovahagy(a: ArculatLepes, stilus: NevlogoStilus, alap: ArculatTervezet, most: Date, logok: ArculatLogok | undefined): ArculatLepes {
  const alapos: ArculatLepes = a.tervezet ? a : { ...a, tervezet: alap };
  return jovahagyTenyleges(arculatModosit(alapos, { nevlogo_stilus: stilus }), alap, most, logok);
}

export type NevlogoMentEredmeny = { ok: true; logok: Record<LogoValtozat, string>; arculat: ArculatLepes } | { ok: false; hiba: "NINCS_PROFIL" | "ERVENYTELEN_ADAT" };

/** 12g „Ez legyen”: a négy változat elkészül, 8 fájl íródik, majd a stílus + jóváhagyás egy `arculatMent`-ben. */
export async function nevlogoMent(szervezetId: string, fiokId: string, nev: string, stilus: NevlogoStilus, keszito: NevlogoKeszito = kepgyarNevlogo): Promise<NevlogoMentEredmeny> {
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return { ok: false, hiba: "NINCS_PROFIL" };
  const v = await keszito(await nevlogoBemenet(szervezetId, nev, stilus, profil));
  const idk = (await fajlokIr(szervezetId, fiokId, stilus, v, LOGO_VALTOZATOK)) as Record<LogoValtozat, string>;
  const logok = await hasznaltLogokMost(szervezetId);
  const m: MentEredmeny = await arculatMent(szervezetId, (a, k) => nevlogoJovahagy(a, stilus, alapA(k), k.most, logok));
  if (!m.ok) return m;
  return { ok: true, logok: idk, arculat: m.arculat };
}

/**
 * Újrakészítés a színek / a cím-betű jóváhagyása után: ahol a hely legfrissebb fájlja a gépé, oda új PNG + SVG sor kerül a MOST jóváhagyott
 * színekkel és betűvel (jóváhagyás nincs — az már megtörtént). Ha nincs gépi hely, vagy nincs mentett stílus: semmi. Visszaadja, mely helyekre írt.
 */
export async function regeneral(szervezetId: string, fiokId: string, nev: string, keszito: NevlogoKeszito = kepgyarNevlogo): Promise<LogoValtozat[]> {
  const helyek = ujraKeszitendoHelyek(await fajlTar.lista(szervezetId, "logo"));
  if (helyek.length === 0) return [];
  const profil = await profilTar.betolt(szervezetId);
  const stilus = profil ? nevlogoForras(profil).stilus : null;
  if (!profil || !stilus) return [];
  const v = await keszito(await nevlogoBemenet(szervezetId, nev, stilus, profil));
  await fajlokIr(szervezetId, fiokId, stilus, v, helyek);
  return helyek;
}

/** A hook a színek / betűk végpontjának: a mentés után, és a hibája soha nem rontja el a mentést (a logó a régi marad, a napló szól). */
export async function regeneralCsendben(szervezetId: string, fiokId: string, nev: string): Promise<void> {
  try {
    await regeneral(szervezetId, fiokId, nev);
  } catch (h) {
    console.error("névlogó újrakészítése nem sikerült (a régi marad):", h);
  }
}
