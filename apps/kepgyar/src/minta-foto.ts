// c14 (a megrendelő döntése 2026-10-08 15:05, docs/decisions/2026-10-08-c14-mintafoto.md): a „Kész munka” MINTAKÉPÉN
// (POST /helyzet-minta — a Kezdőlap és a Hírek ajánlatának képe, a Képek kártyája, az Arculat „Így néz ki” képe) a sablon
// fotóhelyén valódi példafotó áll a csíkos „fotó” hely helyett — a bíráló (Tibor-kapu 10-06 18:36) a csíkot feltöltő-helynek nézte.
// c15 (a megrendelő döntése 2026-10-08 15:43–15:50, docs/decisions/2026-10-08-c15-iparagi-mintafoto.md): a fotó a cég SZAKMÁJÁHOZ illik.
// A szakmát (8 zárt kategória) a példaszövegeket író meglévő AI-hívás választja (apps/web/vizual/peldak.ts), a web a kérés
// `minta_kategoria` mezőjében küldi; ismeretlen / hiányzó kategória vagy hiányzó fájl → a semleges fotó.
// A fotók: Magnific (Freepik), a megrendelő fizetős fiókjával letöltve 10-08 (fizetős licenc, forrásmegjelölés nem kell); ≤ 1600 px,
// JPEG 82, sRGB, metaadat nélkül (apps/kepgyar/minta/).
// Csak a minta kapja: a kitöltő (POST /helyzet) képe változatlan — ott a csíkos hely a feltöltés helye. Ha a tartalom már hoz
// fotót (vagy előtte–utána párt kér), semmi nem változik. A fotó ugyanazon az úton jut a képre, mint a feltöltött:
// `tartalom.fotok[0].adat` adat-URL → a sablon `foto()` eleme (packages/vizual-core/src/helyzet.ts).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const itt = dirname(fileURLToPath(import.meta.url));
export const MINTA_MAPPA = join(itt, "../minta");

/** A zárt szakma-lista — UGYANAZ, mint apps/web/vizual/minta-kategoria.ts MINTA_FOTO_KATEGORIAK (a web nem függ ettől a csomagtól;
 *  eltérésnél a képgyártó a semlegest adja, hiba nincs). c30 F11: + `rendezveny` — a fesztivál mintafotója (a web fesztiválnál küldi). */
export const MINTA_KATEGORIAK = ["epites", "vendeglatas", "bolt", "szepseg", "iroda", "muhely", "kozlekedes", "kert", "rendezveny"] as const;
export type MintaKategoria = (typeof MINTA_KATEGORIAK)[number] | "semleges";

/** Kategória → fájl a minta/ mappában. Új fotó = EGY sor itt (a fájl a minta/ mappába). Ami nincs itt, a semlegest kapja.
 *  muhely, kozlekedes, kert: a fotók 10-08 16:55-kor letöltve (c15b) — mind a 8 kategóriának van fotója. */
export const MINTA_FOTOK: Partial<Record<MintaKategoria, string>> = {
  epites: "kesz-minta-terko.jpg",
  vendeglatas: "kesz-minta-vendeglatas.jpg",
  bolt: "kesz-minta-bolt.jpg",
  szepseg: "kesz-minta-szepseg.jpg",
  iroda: "kesz-minta-iroda.jpg",
  muhely: "kesz-minta-muhely.jpg",
  kozlekedes: "kesz-minta-kozlekedes.jpg",
  kert: "kesz-minta-kert.jpg",
  /** c30 F11 (10-17): a fesztivál fotója — színpad és közönség; a megrendelő adta, a licencet 10-17-én megerősítette (forrás: _c30-minta) */
  rendezveny: "kesz-minta-rendezveny.jpg",
  /** a semleges (10-08): az iroda fotója — általános, nyugodt kép */
  semleges: "kesz-minta-iroda.jpg",
};

/** A bejövő érték → kategória; minden más (hiány, elírás, nem szöveg) → "semleges". */
export function mintaKategoria(x: unknown): MintaKategoria {
  return typeof x === "string" && (MINTA_KATEGORIAK as readonly string[]).includes(x) ? (x as MintaKategoria) : "semleges";
}

const tar = new Map<string, string | null>();
function olvas(mappa: string, fajl: string): string | null {
  const ut = join(mappa, fajl);
  if (!tar.has(ut)) {
    try {
      tar.set(ut, `data:image/jpeg;base64,${readFileSync(ut).toString("base64")}`);
    } catch (e) {
      console.error("minta-fotó: nem olvasható", ut, e instanceof Error ? e.message : e);
      tar.set(ut, null);
    }
  }
  return tar.get(ut)!;
}

/** A kategória példafotója adat-URL-ként (fájlonként egyszer beolvasva). Nincs fájl a kategóriához, vagy nem olvasható → a semleges;
 *  ha az sem olvasható → null (a minta a régi csíkos hellyel készül, hiba nélkül). `mappa`/`fotok`: a füstpróbának. */
export function mintaFotoAdat(kategoria: unknown, mappa = MINTA_MAPPA, fotok = MINTA_FOTOK): string | null {
  const k = mintaKategoria(kategoria);
  const sajat = fotok[k];
  const adat = sajat ? olvas(mappa, sajat) : null;
  if (adat) return adat;
  const semleges = fotok.semleges;
  return semleges ? olvas(mappa, semleges) : null;
}

/**
 * A minta tartalma a példafotóval — a `kesz` és (R-15 c5 2. kör, a megrendelő 2026-10-10 18:08: a Képek lapon nincs csíkos minta) az `uj`
 * helyzetnél, csak ha nincs benne fotó és nem előtte–utána. A többi helyzet sablonján nincs fotóhely.
 * `tartalom`: a kérés nyers tartalma (a munkatér példaszövege) vagy hiányában az `alap` (a képgyártó általános mintája).
 * Minden más esetben a bejövő `tartalom` változatlanul megy tovább (undefined is: akkor a képgyártó a saját mintáját veszi).
 */
export function mintaFotoval(helyzet: unknown, tartalom: unknown, alap: object | undefined, foto: string | null): unknown {
  if ((helyzet !== "kesz" && helyzet !== "uj") || !foto) return tartalom;
  const forras = tartalom === undefined || tartalom === null ? alap : tartalom;
  if (!forras || typeof forras !== "object" || Array.isArray(forras)) return tartalom;
  const t = forras as Record<string, unknown>;
  if (t["elotte_utana"] === true) return tartalom;
  if (Array.isArray(t["fotok"]) && t["fotok"].length > 0) return tartalom;
  return { ...t, fotok: [{ adat: foto }] };
}
