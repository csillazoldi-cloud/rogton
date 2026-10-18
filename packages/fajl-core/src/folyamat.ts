// A bejárat: feltöltés, meta, olvasás, lista — a szerződés szerint.
import { ALBUM_MAX_EL, FajlCel, type FajlEredet, type FajlMeta, type HostKontextus, type Kornyezet, type LogoValtozat } from "./host";
import { type Eredmeny, fajlEllenoriz, kepMeret } from "./felismeres";
import { dont } from "./szabalyok";

const FEJ_MAX = 512;
const NEV_MAX = 200;

function tisztitNev(nev: string): string {
  const cserelt = nev.replace(/[/\\]/g, "_");
  return cserelt.slice(0, NEV_MAX);
}

export async function feltolt(
  k: Kornyezet,
  ktx: HostKontextus,
  // R-16 K1: logo_valtozat / eredet / elemzes opcionális, átmenő adat (a mag nem értelmezi az elemzést)
  // c30 F9 (0.4.0): `kepMaxEl` csak az albumnál számít, és csak SZIGORÍTHAT (a `kicsi` pár ≤ 512 px); a felső határ `ALBUM_MAX_EL`.
  be: { nev: string; cel: FajlCel; bajtok: Uint8Array; logo_valtozat?: LogoValtozat | null | undefined; eredet?: FajlEredet | undefined; elemzes?: unknown; kepMaxEl?: number },
): Promise<Eredmeny<FajlMeta>> {
  const jog = dont(ktx, "feltolt");
  if (!jog.szabad) {
    return { ok: false, hiba: jog.indok };
  }

  const fej = be.bajtok.subarray(0, Math.min(be.bajtok.length, FEJ_MAX));
  const ell = fajlEllenoriz({ meret: be.bajtok.length, fej }, { cel: be.cel }); // R-16 K5: a cél típusai (betű csak betűnek)
  if (!ell.ok) {
    return { ok: false, hiba: ell.hiba };
  }
  if (be.cel === "album") {
    // c30 F9 (TERV §6 „Server”): a telefon kicsinyít; ami mégis nagyobb (vagy aminek a mérete nem olvasható ki), nem jön be.
    const m = kepMeret(be.bajtok);
    if (!m) return { ok: false, hiba: "TIPUS_NEM_ENGEDETT" };
    const hatar = Math.min(ALBUM_MAX_EL, be.kepMaxEl ?? ALBUM_MAX_EL);
    if (Math.max(m.szel, m.mag) > hatar) return { ok: false, hiba: "TUL_NAGY" };
  }

  const meta: FajlMeta = {
    id: k.azonosito.uj(),
    szervezet_id: ktx.szervezet_id,
    nev: tisztitNev(be.nev),
    tipus: ell.ertek.tipus,
    meret: be.bajtok.length,
    cel: be.cel,
    feltoltotte: ktx.fiok_id,
    feltoltve: k.ora.most(),
    // R-16 K1: a hely csak logónál él (alap: vilagos); más célnál mindig null. Az elemzés logónál és (K5) betűnél.
    logo_valtozat: be.cel === "logo" ? (be.logo_valtozat ?? "vilagos") : null,
    eredet: be.eredet ?? "feltoltes",
    // R-16 K5: a betűnél is (a befogadó ékezet-vizsgálata, TERV 1.5); c30 F9: az albumnál a pár és a készítés ideje
    // ({ par, kicsi, keszult, album } — TERV 1.5, a mag nem értelmezi); más célnál null
    elemzes: (be.cel === "logo" || be.cel === "betu" || be.cel === "album") && be.elemzes !== undefined ? be.elemzes : null,
  };

  await k.tar.ment(meta, be.bajtok);

  await k.esemeny({
    fajta: "fajl_feltoltve",
    szervezet_id: meta.szervezet_id,
    fajl_id: meta.id,
    tipus: meta.tipus,
    cel: meta.cel,
    meret: meta.meret,
    feltoltotte: meta.feltoltotte,
  });

  return { ok: true, ertek: meta };
}

/**
 * 0.3.0 — a nagy feltöltés útja: a befogadó a kérés törzsét már lemezre írta (futó bájtszámlálással, a korlát felett megszakítva),
 * a mag csak a méretet és a FEJET (az első bájtokat) kapja — a tartalom szerinti típus-ellenőrzés és az SVG-tilalom ugyanaz, mint a
 * `feltolt`-ban. A fájl a tár `mentFajlbol`-jával kerül a helyére; ha a tárnak nincs ilyen útja, a feltöltés nem megy (ERVENYTELEN_ADAT).
 * Hibánál az ideiglenes fájl a HÍVÓÉ marad (ő takarítja).
 */
export async function feltoltFajlbol(
  k: Kornyezet,
  ktx: HostKontextus,
  be: { nev: string; cel: FajlCel; meret: number; fej: Uint8Array; ideiglenesUt: string; logo_valtozat?: LogoValtozat | null | undefined; eredet?: FajlEredet | undefined; elemzes?: unknown },
): Promise<Eredmeny<FajlMeta>> {
  const jog = dont(ktx, "feltolt");
  if (!jog.szabad) {
    return { ok: false, hiba: jog.indok };
  }
  const ell = fajlEllenoriz({ meret: be.meret, fej: be.fej.subarray(0, Math.min(be.fej.length, FEJ_MAX)) }, { cel: be.cel });
  if (!ell.ok) {
    return { ok: false, hiba: ell.hiba };
  }
  if (!k.tar.mentFajlbol) {
    return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  }
  // c30 F9 (0.4.0): az albumfotó mérete a teljes bájtsorból jön (a JPEG EXIF-je az 512 bájtos fejen túl is tarthat) — csak a `feltolt` útján
  if (be.cel === "album") {
    return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  }
  const meta: FajlMeta = {
    id: k.azonosito.uj(),
    szervezet_id: ktx.szervezet_id,
    nev: tisztitNev(be.nev),
    tipus: ell.ertek.tipus,
    meret: be.meret,
    cel: be.cel,
    feltoltotte: ktx.fiok_id,
    feltoltve: k.ora.most(),
    logo_valtozat: be.cel === "logo" ? (be.logo_valtozat ?? "vilagos") : null,
    eredet: be.eredet ?? "feltoltes",
    elemzes: (be.cel === "logo" || be.cel === "betu") && be.elemzes !== undefined ? be.elemzes : null,
  };
  await k.tar.mentFajlbol(meta, be.ideiglenesUt);
  await k.esemeny({
    fajta: "fajl_feltoltve",
    szervezet_id: meta.szervezet_id,
    fajl_id: meta.id,
    tipus: meta.tipus,
    cel: meta.cel,
    meret: meta.meret,
    feltoltotte: meta.feltoltotte,
  });
  return { ok: true, ertek: meta };
}

export async function fajlMeta(
  k: Kornyezet,
  ktx: HostKontextus,
  id: string,
): Promise<Eredmeny<FajlMeta>> {
  const jog = dont(ktx, "olvas");
  if (!jog.szabad) {
    return { ok: false, hiba: jog.indok };
  }
  const m = await k.tar.meta(ktx.szervezet_id, id);
  if (!m) {
    return { ok: false, hiba: "NINCS_ILYEN_FAJL" };
  }
  return { ok: true, ertek: m };
}

export async function fajlOlvas(
  k: Kornyezet,
  ktx: HostKontextus,
  id: string,
): Promise<Eredmeny<{ meta: FajlMeta; bajtok: Uint8Array }>> {
  const jog = dont(ktx, "olvas");
  if (!jog.szabad) {
    return { ok: false, hiba: jog.indok };
  }
  const m = await k.tar.meta(ktx.szervezet_id, id);
  if (!m) {
    return { ok: false, hiba: "NINCS_ILYEN_FAJL" };
  }
  const bajtok = await k.tar.olvas(ktx.szervezet_id, id);
  if (!bajtok) {
    return { ok: false, hiba: "NINCS_ILYEN_FAJL" };
  }
  return { ok: true, ertek: { meta: m, bajtok } };
}

/** 0.3.0: mint a `fajlOlvas`, de a tartalom folyamként jön, ha a tár tudja (`olvasFolyam`); különben a bájtokból készül folyam.
 *  Ugyanaz a jog- és szervezet-szabály (a tár a szervezetre szűr). */
export async function fajlFolyam(
  k: Kornyezet,
  ktx: HostKontextus,
  id: string,
): Promise<Eredmeny<{ meta: FajlMeta; folyam: ReadableStream<Uint8Array> }>> {
  const jog = dont(ktx, "olvas");
  if (!jog.szabad) {
    return { ok: false, hiba: jog.indok };
  }
  const m = await k.tar.meta(ktx.szervezet_id, id);
  if (!m) {
    return { ok: false, hiba: "NINCS_ILYEN_FAJL" };
  }
  if (k.tar.olvasFolyam) {
    const folyam = await k.tar.olvasFolyam(ktx.szervezet_id, id);
    return folyam ? { ok: true, ertek: { meta: m, folyam } } : { ok: false, hiba: "NINCS_ILYEN_FAJL" };
  }
  const bajtok = await k.tar.olvas(ktx.szervezet_id, id);
  if (!bajtok) {
    return { ok: false, hiba: "NINCS_ILYEN_FAJL" };
  }
  const folyam = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bajtok); c.close(); } });
  return { ok: true, ertek: { meta: m, folyam } };
}

export async function fajlLista(
  k: Kornyezet,
  ktx: HostKontextus,
  cel?: FajlCel,
): Promise<Eredmeny<FajlMeta[]>> {
  const jog = dont(ktx, "olvas");
  if (!jog.szabad) {
    return { ok: false, hiba: jog.indok };
  }
  const lista = await k.tar.lista(ktx.szervezet_id, cel);
  return { ok: true, ertek: lista };
}
