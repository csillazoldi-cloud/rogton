// Kártya-építés: eseményenként egy kártya a felületnek.
import { z } from "zod";
import { Fontossag, Temacimke, ErtekelesAllapot, Talalat, type Esemeny } from "./talalat";
import type { Kivonat } from "./kivonat";
import type { Forras } from "./forras";

export const KartyaForras = z.object({
  talalat_id: z.string().min(1),
  forras_id: z.string().min(1),
  forras_cim: z.string(),
  url: z.string(),
  cim: z.string(),
  megjelenes: z.iso.datetime().nullable(),
  nyelv: z.string().length(2).nullable(),
});
export type KartyaForras = z.infer<typeof KartyaForras>;

export const Kartya = z.object({
  esemeny_id: z.string().min(1),
  fo_talalat_id: z.string().min(1),
  cim: z.string(),
  // F10-M1: a cím a beállított nyelven + a hír két olvasata (a cégednek · a vevőidnek)
  cim_forditott: z.string(),
  cegednek: z.string(),
  vevoidnek: z.string(),
  osszefoglalo: z.string(),
  miert: z.string(),
  indoklas: z.string(),
  fontossag: Fontossag.nullable(),
  temacimke: Temacimke.nullable(),
  ertekeles_allapot: ErtekelesAllapot,
  szabaly_verzio: z.number().int().positive().nullable(),
  csonkolt_alapjan: z.boolean(),
  forrasok: z.array(KartyaForras).min(1),
  forras_szam: z.number().int().positive(),
  megtekintes: z.enum(["uj", "megtekintett"]),
  jeloles: z.enum(["nincs", "mentett", "elrejtett"]),
  letrehozva: z.iso.datetime(),
  /** 0.2.0 (E-31): a kártya forrásai közül a LEGKORÁBBI megjelenés — az esemény ideje, nem a begyűjtésé.
   *  ÚJ, VÁLASZTHATÓ mező: a 0.1.0-ra írt host kódja változatlanul fordul és fut (a régi mezők nem változtak). */
  esemeny_ideje: z.iso.datetime().nullable().optional(),
  tartalomotlet: Talalat.shape.tartalomotlet,
});
export type Kartya = z.infer<typeof Kartya>;

/** V3 (2026-09-18, Vilmos 4. pont): a kártyaépítés eredménye — a kártyák és a kihagyott főoldal-találatok száma. */
export type KartyaEpites = {
  kartyak: Kartya[];
  /** Hány eseményt hagytunk ki, mert a fő találat URL-je a forrás gyökere (főoldal), nem cikk. */
  kihagyott_fooldal: number;
};

/** Szöveg vágása szóhatáron, legfeljebb `max` karakter, „…”-tal jelezve a vágást. */
function szovegVag(szoveg: string, max: number): string {
  if (szoveg.length <= max) return szoveg;
  const vagott = szoveg.slice(0, max);
  const utolsoSzo = vagott.lastIndexOf(" ");
  if (utolsoSzo > 0) return vagott.slice(0, utolsoSzo) + "…";
  return vagott + "…";
}

/** V3 (2026-09-18, Vilmos 4. pont): igaz, ha az URL a forrás gyökere (főoldal), nem cikk.
 *  Feltétel: a pathname üres vagy "/", ÉS nincs query string. */
export function fooldalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const gyoker = path === "" || path === "/";
    const nincsQuery = u.search === "";
    return gyoker && nincsQuery;
  } catch {
    // Értelmezhetetlen URL — nem tekintjük főoldalnak (a kártyaépítés korábban sem szűrt ilyet)
    return false;
  }
}

/** Kártyák építése eseményekből, találatokból, kivonatokból és forrásokból (a 0.1.0 óta változatlan alak: csak a kártyák). */
export function kartyakEpit(be: { esemenyek: Esemeny[]; talalatok: Talalat[]; kivonatok: Kivonat[]; forrasok: Forras[] }): Kartya[] {
  return kartyakEpitReszletes(be).kartyak;
}

/** V3: ugyanaz, a kihagyott főoldal-találatok számával együtt. */
export function kartyakEpitReszletes(be: { esemenyek: Esemeny[]; talalatok: Talalat[]; kivonatok: Kivonat[]; forrasok: Forras[] }): KartyaEpites {
  const talalatById = new Map(be.talalatok.map((t) => [t.id, t]));
  const kivonatById = new Map(be.kivonatok.map((k) => [k.id, k]));
  const forrasById = new Map(be.forrasok.map((f) => [f.id, f]));

  const kartyak: Kartya[] = [];
  let kihagyottFooldal = 0;
  for (const esemeny of be.esemenyek) {
    const foTalalat = talalatById.get(esemeny.fo_talalat_id);
    if (!foTalalat) continue;

    // V3 (2026-09-18, Vilmos 4. pont): ha a fő találat URL-je a forrás gyökere (főoldal), nincs kártya.
    const foKivonat = kivonatById.get(foTalalat.kivonat_id);
    if (foKivonat && fooldalUrl(foKivonat.url)) {
      kihagyottFooldal += 1;
      continue;
    }

    // Források összegyűjtése az esemény találatain át
    const forrasok: KartyaForras[] = [];
    for (const talalatId of esemeny.talalat_ids) {
      const talalat = talalatById.get(talalatId);
      if (!talalat) continue;
      const kivonat = kivonatById.get(talalat.kivonat_id);
      if (!kivonat) continue;
      const forras = forrasById.get(kivonat.forras_id);
      if (!forras) continue;
      forrasok.push({
        talalat_id: talalat.id,
        forras_id: forras.id,
        forras_cim: forras.cim,
        url: kivonat.url,
        cim: kivonat.cim,
        megjelenes: kivonat.megjelenes,
        nyelv: kivonat.nyelv,
      });
    }
    if (forrasok.length === 0) continue;

    // Összefoglaló: az értékelésből, ha van; különben a fő kivonat első 300 karaktere
    let osszefoglalo = foTalalat.ertekeles?.osszefoglalo ?? "";
    if (!osszefoglalo) {
      if (foKivonat) osszefoglalo = szovegVag(foKivonat.szoveg, 300);
    }

    const barmelyikUj = esemeny.talalat_ids.some((id) => talalatById.get(id)?.megtekintes === "uj");

    kartyak.push({
      esemeny_id: esemeny.id,
      fo_talalat_id: foTalalat.id,
      cim: foKivonat?.cim ?? "",
      cim_forditott: foTalalat.ertekeles?.cim_forditott ?? "",
      cegednek: foTalalat.ertekeles?.cegednek ?? "",
      vevoidnek: foTalalat.ertekeles?.vevoidnek ?? "",
      osszefoglalo,
      miert: foTalalat.ertekeles?.miert ?? "",
      indoklas: foTalalat.ertekeles?.indoklas ?? "",
      fontossag: foTalalat.ertekeles?.fontossag ?? null,
      temacimke: foTalalat.ertekeles?.temacimke ?? null,
      ertekeles_allapot: foTalalat.ertekeles_allapot,
      szabaly_verzio: foTalalat.ertekeles?.szabaly_verzio ?? null,
      csonkolt_alapjan: foTalalat.ertekeles?.csonkolt_alapjan ?? false,
      forrasok,
      forras_szam: forrasok.length,
      megtekintes: barmelyikUj ? "uj" : "megtekintett",
      jeloles: foTalalat.jeloles,
      letrehozva: esemeny.letrehozva,
      // 0.2.0: a legkorábbi megjelenés a kártya forrásai közül (üres, ha egyik forrásnak sincs megjelenési ideje)
      esemeny_ideje: forrasok.map((f) => f.megjelenes).filter((m): m is string => m !== null).sort()[0] ?? null,
      tartalomotlet: foTalalat.tartalomotlet,
    });
  }

  // Rendezés: letrehozva csökkenő
  kartyak.sort((a, b) => new Date(b.letrehozva).getTime() - new Date(a.letrehozva).getTime());
  return { kartyak, kihagyott_fooldal: kihagyottFooldal };
}
