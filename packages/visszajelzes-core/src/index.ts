// @rogton/visszajelzes-core — a Visszajelzés modul TISZTA magja (V1).
// Nincs React, Next, adatbázis, hálózat: csak a szerződés (zod-sémák) és a tiszta segédek.
// A képernyő-modul (V2) és a rendszergazda-lapok (V3) erre építenek.
import { z } from "zod";

// ── Állapotok ────────────────────────────────────────────────────────────────

/** A visszajelzés életútja: új → elfogadva → kész. */
export const VisszajelzesAllapot = z.enum(["uj", "elfogadva", "kesz"]);
export type VisszajelzesAllapot = z.infer<typeof VisszajelzesAllapot>;

/** A megjelölt elem: emberi címke, CSS-út, a szöveg eleje. */
export const VisszajelzesElem = z.object({
  cimke: z.string().max(200),
  szelektor: z.string().max(500),
  szoveg_reszlet: z.string().max(300),
});
export type VisszajelzesElem = z.infer<typeof VisszajelzesElem>;

/** A beküldött visszajelzés (a felhasználótól). */
export const VisszajelzesBekuldes = z.object({
  lap: z.string().min(1).max(300),
  lap_cim: z.string().max(200).default(""),
  elem: VisszajelzesElem.nullable(),
  kijelolt_szoveg: z.string().max(1000).default(""),
  szoveg: z.string().trim().min(1).max(2000),
  nyelv: z.string().length(2),
  kep: z.string().max(400_000).nullable(),
  ablak: z.object({ w: z.number().int(), h: z.number().int() }),
});
export type VisszajelzesBekuldes = z.infer<typeof VisszajelzesBekuldes>;

/** A tárolt visszajelzés (a beküldött + a rendszer jegyezte adatok). */
export const Visszajelzes = VisszajelzesBekuldes.extend({
  id: z.string(),
  /** null: névtelen (belépés előtti) beküldés, vagy szervezet nélküli fiók (0148, Kati 10-02) */
  szervezet_id: z.string().nullable(),
  szervezet_nev: z.string(),
  /** null: névtelen beküldés (nem volt munkamenet) */
  fiok_id: z.string().nullable(),
  fiok_nev: z.string(),
  /** igaz: munkamenet nélkül jött (a fiók- és munkaterület-adat a beküldőről nem ismert) */
  nevtelen: z.boolean().optional(),
  allapot: VisszajelzesAllapot,
  letrehozva: z.iso.datetime(),
  csomag_id: z.string().nullable(),
  /** a listában: van-e tárolt kép (a kép maga külön végponton jön) */
  van_kep: z.boolean().optional(),
});
export type Visszajelzes = z.infer<typeof Visszajelzes>;

// ── Javítócsomag ─────────────────────────────────────────────────────────────

/** Egy javító tétel állapota a rendszergazda döntése szerint. */
export const JavitoTetelAllapot = z.enum(["javasolt", "elfogadva", "kesobb", "nem"]);
export type JavitoTetelAllapot = z.infer<typeof JavitoTetelAllapot>;

/** Egy javító tétel: egy fejlesztőnek szóló javaslat, a hivatkozott visszajelzésekkel. */
export const JavitoTetel = z.object({
  id: z.string(),
  cim: z.string().max(160),
  javaslat: z.string().max(800),
  sulyossag: z.enum(["kicsi", "kozepes", "nagy"]),
  lapok: z.array(z.string()),
  visszajelzes_ids: z.array(z.string()),
  allapot: JavitoTetelAllapot,
});
export type JavitoTetel = z.infer<typeof JavitoTetel>;

/** A napi javítócsomag: az összefoglaló és a tételek. */
export const JavitoCsomag = z.object({
  id: z.string(),
  nap: z.string(),
  osszefoglalo: z.string().max(1200),
  tetelek: z.array(JavitoTetel),
  visszajelzes_db: z.number().int(),
  letrehozva: z.iso.datetime(),
});
export type JavitoCsomag = z.infer<typeof JavitoCsomag>;

/** Az AI válasza a javítócsomag-promptra (a séma, amit a host ellenőriz). */
export const JavitoCsomagValasz = z.object({
  osszefoglalo: z.string().max(1200),
  tetelek: z
    .array(
      z.object({
        cim: z.string().max(160),
        javaslat: z.string().max(800),
        sulyossag: z.enum(["kicsi", "kozepes", "nagy"]),
        visszajelzes_ids: z.array(z.string()).min(1),
      }),
    )
    .max(20),
});
export type JavitoCsomagValasz = z.infer<typeof JavitoCsomagValasz>;

// ── Tiszta segédek ───────────────────────────────────────────────────────────

/**
 * A javítócsomag-prompt bemenete: minden visszajelzés egy `<<ADAT visszajelzes>>` blokkban.
 * A kép NEM megy az AI-nak (adatvédelem + token-takarékosság).
 */
export function csomagBemenet(vjk: Visszajelzes[]): string {
  const blokkok = vjk.map((v) => {
    const sorok: string[] = [];
    sorok.push("<<ADAT visszajelzes>>");
    sorok.push(`Azonosító: ${v.id}`);
    sorok.push(`Lap: ${v.lap}`);
    if (v.lap_cim) sorok.push(`Lap címe: ${v.lap_cim}`);
    if (v.elem) {
      sorok.push(`Elem címkéje: ${v.elem.cimke}`);
      if (v.elem.szoveg_reszlet) sorok.push(`Elem szövege: ${v.elem.szoveg_reszlet}`);
    }
    if (v.kijelolt_szoveg) sorok.push(`Kijelölt szöveg: ${v.kijelolt_szoveg}`);
    sorok.push(`A felhasználó szövege: ${v.szoveg}`);
    sorok.push(`Nyelv: ${v.nyelv}`);
    sorok.push(`Ki: ${v.nevtelen ? "névtelen (belépés nélkül)" : v.fiok_nev}`);
    sorok.push(`Mikor: ${v.letrehozva}`);
    sorok.push("<<ADAT VÉGE>>");
    return sorok.join("\n");
  });
  return blokkok.join("\n\n");
}

/**
 * A javítócsomag összeállítása az AI válaszából.
 * - az azonosítókat a host adja (`idAdo`),
 * - a `lapok` a hivatkozott visszajelzések lapjaiból (egyedivé téve),
 * - csak LÉTEZŐ visszajelzés-azonosítókat tartunk meg,
 * - ha egy tételnek nem marad hivatkozása, a tétel kimarad.
 */
export function csomagOsszeall(
  nap: string,
  valasz: JavitoCsomagValasz,
  vjk: Visszajelzes[],
  idAdo: () => string,
): JavitoCsomag {
  const ismert = new Map<string, Visszajelzes>();
  for (const v of vjk) ismert.set(v.id, v);

  const tetelek: JavitoTetel[] = [];
  for (const t of valasz.tetelek) {
    const megmaradt = t.visszajelzes_ids.filter((id) => ismert.has(id));
    if (megmaradt.length === 0) continue;
    const lapok: string[] = [];
    for (const id of megmaradt) {
      const v = ismert.get(id)!;
      if (!lapok.includes(v.lap)) lapok.push(v.lap);
    }
    tetelek.push({
      id: idAdo(),
      cim: t.cim,
      javaslat: t.javaslat,
      sulyossag: t.sulyossag,
      lapok,
      visszajelzes_ids: megmaradt,
      allapot: "javasolt",
    });
  }

  return {
    id: idAdo(),
    nap,
    osszefoglalo: valasz.osszefoglalo,
    tetelek,
    visszajelzes_db: vjk.length,
    letrehozva: new Date().toISOString(),
  };
}

