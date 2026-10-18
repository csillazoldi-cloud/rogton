// c30 F9 — a fotóalbum szabályai, tisztán (FESZTIVAL-ES-NYELVI-MOD-TERV §1.5, §6 „Limits”, D7). Nincs benne adatbázis és lemez:
// a befogadó (album/index.ts, album/koltoztet.ts) méri a számokat, és ez dönt.
//
// A korlátok (pilot alapértékek — Vilmos és Csilla változtathatja):
//   · 500 MB albumtár munkateréként (a `nagy` és a `kicsi` fájl is számít; a `_torolni/`-be költözöttek már nem);
//   · 60 FOTÓ 10 percenként munkateréként (a `kicsi` pár nem számít külön: egy fotó = egy `nagy` + egy `kicsi` feltöltés,
//     így egy 30 fotós album 60 kérés, és belefér);
//   · egy albumban legfeljebb 40 fotó (a `kicsi` itt sem számít);
//   · D7: 30 nap — a nem használt fotó 30 nappal a feltöltése után, a kitett poszt fotója 30 nappal a „Kitettem” után kerül a
//     `_torolni/` alá (nem törlünk; mentés nincs).
import { z } from "zod";

export const ALBUM_KVOTA_BAJT = 500 * 1024 * 1024;
export const ALBUM_SEBESSEG_DB = 60;
export const ALBUM_SEBESSEG_PERC = 10;
export const ALBUM_FOTO_MAX = 40;
export const ALBUM_MEGORZES_NAP = 30;
const NAP_MS = 24 * 60 * 60 * 1000;

/** Az album kulcsa (a kliens adja: az F10-ben a poszt, amihez az album tartozik). Útvonalba és fájlnévbe nem kerül. */
export const AlbumKulcs = z.string().regex(/^[0-9A-Za-z_-]{1,64}$/);

/** Az `arculat_fajl.elemzes` az albumnál (TERV 1.5 — a meglévő jsonb oszlop, új oszlop nélkül). */
export const AlbumElemzes = z.object({
  album: AlbumKulcs,
  /** a `kicsi` (≤ 512 px) változat-e; a `kicsi` a párja (`par`) `nagy` sorára mutat */
  kicsi: z.boolean(),
  par: z.string().uuid().optional(),
  /** a fotó készítésének ideje (a telefon EXIF-jéből vagy a fájl idejéből, a kicsinyítés ELŐTT kiolvasva); ISO */
  keszult: z.string().datetime({ offset: true }).optional(),
  /** D7: mikor költözött a `_torolni/` alá — ettől fogva nem számít a kvótába, és nem tölthető le */
  kiveve: z.string().datetime({ offset: true }).optional(),
});
export type AlbumElemzes = z.infer<typeof AlbumElemzes>;

export function albumElemzes(e: unknown): AlbumElemzes | null {
  const p = AlbumElemzes.safeParse(e);
  return p.success ? p.data : null;
}

export type AlbumHasznalat = {
  /** a munkatér albumfotóinak bájtjai (a ki nem vettek) */
  bajt: number;
  /** a munkatér `nagy` feltöltései az utolsó `ALBUM_SEBESSEG_PERC` percben */
  utobbi: number;
  /** ebben az albumban a `nagy` fotók száma (a ki nem vettek) */
  albumban: number;
  /** a legrégebbi `nagy` feltöltés ideje az ablakban (ISO) — ebből a várakozás percben */
  ablakEleje?: string | null;
};

export type AlbumDontes =
  | { ok: true }
  | { ok: false; hiba: "ALBUM_MEGTELT"; http: 413 }
  | { ok: false; hiba: "ALBUM_TELE"; http: 409 }
  | { ok: false; hiba: "TUL_SOK_FELTOLTES"; http: 429; ujraPerc: number };

/** Befér-e egy új feltöltés (`meret` bájt; `kicsi`: a pár második fele, ami a darabszámokba nem számít). */
export function albumBefer(h: AlbumHasznalat, uj: { meret: number; kicsi: boolean }, most: Date): AlbumDontes {
  if (h.bajt + uj.meret > ALBUM_KVOTA_BAJT) return { ok: false, hiba: "ALBUM_MEGTELT", http: 413 };
  if (uj.kicsi) return { ok: true };
  if (h.utobbi >= ALBUM_SEBESSEG_DB) {
    const eleje = h.ablakEleje ? new Date(h.ablakEleje).getTime() : most.getTime();
    const vege = eleje + ALBUM_SEBESSEG_PERC * 60_000;
    return { ok: false, hiba: "TUL_SOK_FELTOLTES", http: 429, ujraPerc: Math.max(1, Math.ceil((vege - most.getTime()) / 60_000)) };
  }
  if (h.albumban >= ALBUM_FOTO_MAX) return { ok: false, hiba: "ALBUM_TELE", http: 409 };
  return { ok: true };
}

/**
 * D7: lejárt-e a fotó (30 nap). Ha egy kitett poszt fotója: a „Kitettem” után 30 nappal; különben a legutóbbi használata (feltöltés,
 * ill. egy még ki nem tett poszt utolsó módosítása) után 30 nappal. A `kicsi` a párjával együtt megy (a hívó intézi).
 */
export function albumLejart(f: { feltoltve: string; hasznalva?: string | null; kitettem?: string | null }, most: Date): boolean {
  const hatar = most.getTime() - ALBUM_MEGORZES_NAP * NAP_MS;
  if (f.kitettem) return new Date(f.kitettem).getTime() <= hatar;
  const utolso = Math.max(new Date(f.feltoltve).getTime(), f.hasznalva ? new Date(f.hasznalva).getTime() : 0);
  return utolso <= hatar;
}

/** A ZIP-ben a fájl neve: „01-<név>.jpg” — a sorszám a poszt sorrendje; a név a feltöltött fájlé, a kiterjesztés a tartalomé. */
export function zipNev(sorszam: number, nev: string, kiterjesztes: string): string {
  const alap = nev.normalize("NFC").replace(/\.[A-Za-z0-9]{1,5}$/, "").replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "_").trim().slice(0, 120) || "foto";
  return `${String(sorszam).padStart(2, "0")}-${alap}.${kiterjesztes}`;
}

// ---------------------------------------------------------------------------
// c30 F10 (terv §6 „AI pick and order”): a válogatás tiszta részei.
// ---------------------------------------------------------------------------

/** Ennyit választ a gép, ha nem elérhető (a készítés ideje szerint, egyenletesen) — a terv 8–10-et kér. */
export const VALOGATAS_ALAP = 10;
/** A válogatás ennyi fotót küld a gépnek (kicsiben, „low” felbontással) — csak ennél a feladatnál ennyi. */
export const VALOGATAS_GEPNEK = 40;
/** A válogatás ennyi ideig „fut” — utána elakadtnak számít, és újraindítható (a háttérfutás a kiszolgáló újraindulásával elveszhet). */
export const VALOGATAS_ELAKAD_MS = 5 * 60_000;

export type AlbumFoto = { id: string; kicsi_id: string | null; nev: string; keszult: string | null; feltoltve: string; meret: number };

/** A fotók a készítésük ideje szerint (ahol nincs: a feltöltés ideje), azonos időnél név szerint — a válogatás és a tartalék alapja. */
export function idoSzerint<T extends { keszult: string | null; feltoltve: string; nev: string }>(fotok: T[]): T[] {
  const ido = (f: T) => Date.parse(f.keszult ?? f.feltoltve) || 0;
  return [...fotok].sort((a, b) => ido(a) - ido(b) || a.nev.localeCompare(b.nev));
}

/** A tartalék válogatás (nincs gép, vagy a válasza használhatatlan): egyenletesen szétszórt fotók a sorból, az első és az utolsó benne. */
export function egyenletesen<T>(sor: T[], db = VALOGATAS_ALAP): T[] {
  if (sor.length <= db) return [...sor];
  if (db <= 1) return sor.slice(0, Math.max(0, db));
  const ki: T[] = [];
  for (let k = 0; k < db; k++) ki.push(sor[Math.round((k * (sor.length - 1)) / (db - 1))]!);
  return ki;
}

/** A gép válasza → a választott fotók (1-től számozva a bemenet szerint), ismétlés és érvénytelen szám nélkül, ≤ 20. Üres → null. */
export function valogatasErtelmez(nyers: unknown, db: number): { i: number; leiras: string }[] | null {
  let o: unknown = nyers;
  if (typeof nyers === "string") {
    const kezd = nyers.indexOf("{"), veg = nyers.lastIndexOf("}");
    if (kezd < 0 || veg <= kezd) return null;
    try { o = JSON.parse(nyers.slice(kezd, veg + 1)); } catch { return null; }
  }
  const lista = (o as { valasztott?: unknown } | null)?.valasztott;
  if (!Array.isArray(lista)) return null;
  const latott = new Set<number>();
  const ki: { i: number; leiras: string }[] = [];
  for (const x of lista) {
    const i = Number((x as { i?: unknown })?.i);
    if (!Number.isInteger(i) || i < 1 || i > db || latott.has(i)) continue;
    latott.add(i);
    const l = (x as { leiras?: unknown }).leiras;
    ki.push({ i, leiras: typeof l === "string" ? l.replace(/\s+/g, " ").trim().slice(0, 160) : "" });
    if (ki.length >= 20) break;
  }
  return ki.length ? ki : null;
}

/** A gépnek küldött sorok: „3. fotó · 21:14” (a készítés ideje Bukarest szerint, ha ismert). */
export function valogatasSorok(fotok: { keszult: string | null }[]): string[] {
  const ora = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Bucharest", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return fotok.map((f, k) => `${k + 1}. fotó${f.keszult ? ` · ${ora.format(new Date(f.keszult))}` : ""}`);
}

/** A sorrend-lap műveletei (rajz D8c): Előrébb / Hátrébb egy hellyel; a szélén nincs mozgás. */
export function athelyez<T>(sor: T[], hol: number, irany: -1 | 1): T[] {
  const cel = hol + irany;
  if (hol < 0 || hol >= sor.length || cel < 0 || cel >= sor.length) return sor;
  const ki = [...sor];
  [ki[hol], ki[cel]] = [ki[cel]!, ki[hol]!];
  return ki;
}
