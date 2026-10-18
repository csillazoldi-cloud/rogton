import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { szerepFordit } from "../../../../hozzaferes";
import { ALBUM_MAX_MERET_BAJT } from "@rogton/fajl-core";
import { eldob, korlatosBeolvas } from "../../../../fajl/beolvas";
import { AlbumKulcs, albumFotoFeltolt, albumFotok } from "../../../../album";
import { posztTar } from "../../../../poszt/tar";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * c30 F9 (TERV §6 „Server”): EGY albumfotó feltöltése. A törzs a fájl bájtjai (≤ 2,5 MB, jpg/webp — a telefon már kicsinyítette).
 * Fejlécek: `x-fajl-nev` (URI-kódolva), `x-album` (az album kulcsa), `x-album-par` (csak a `kicsi` változatnál: a `nagy` id-je),
 * `x-keszult` (ISO, a fotó készítése). Néző: 403 (a kapu). 201 { fajl } · 413 TUL_NAGY / ALBUM_MEGTELT · 415 · 409 ALBUM_TELE ·
 * 429 TUL_SOK_FELTOLTES (+ mezok.ujra_perc) · 404 (a pár nem a munkatér albumfotója).
 */
export async function POST(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "szerkeszto");
    if (ktx instanceof Response) return ktx;

    const cl = keres.headers.get("content-length");
    if (cl && Number(cl) > ALBUM_MAX_MERET_BAJT) {
      await eldob(keres);
      return hiba({ hiba: "TUL_NAGY" }, 413);
    }
    const albumE = AlbumKulcs.safeParse(keres.headers.get("x-album") ?? "");
    const par = keres.headers.get("x-album-par");
    const nyersKeszult = keres.headers.get("x-keszult");
    const keszult = nyersKeszult && !Number.isNaN(Date.parse(nyersKeszult)) ? new Date(nyersKeszult).toISOString() : null;
    if (!albumE.success || (par !== null && !UUID.test(par))) {
      await eldob(keres);
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }
    // c30 F10 (Csilla 10-17, döntés 2): az album kulcsa a poszt id-je — a munkatér saját posztja kell hozzá (40 fotó / poszt)
    if (!(await posztTar.betolt(ktx.szervezet.id, albumE.data).catch(() => null))) {
      await eldob(keres);
      return hiba({ hiba: "NINCS_ILYEN_TALALAT" }, 404);
    }
    const nyersNev = keres.headers.get("x-fajl-nev");
    let nev = "foto.jpg";
    try { nev = nyersNev ? decodeURIComponent(nyersNev) : nev; } catch { /* hibás kódolás: az alapnév */ }

    const bajtok = await korlatosBeolvas(keres, ALBUM_MAX_MERET_BAJT);
    if (!bajtok) return hiba({ hiba: "TUL_NAGY" }, 413);

    const e = await albumFotoFeltolt(
      { fiok_id: ktx.fiok.id, szervezet_id: ktx.szervezet.id, szerep: szerepFordit(ktx.szerep) },
      { nev, album: albumE.data, par, keszult, bajtok },
    );
    if (!e.ok) {
      if (e.hiba === "TUL_SOK_FELTOLTES") return hiba({ hiba: e.hiba, mezok: { ujra_perc: String(e.ujraPerc) } }, 429);
      return hiba({ hiba: e.hiba === "SVG_NEM_ENGEDETT" ? "TIPUS_NEM_ENGEDETT" : e.hiba }, e.http);
    }
    return valasz({ fajl: e.fajl }, 201);
  } catch (h) {
    console.error("Album foto POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

/** c30 F10: egy album (= egy poszt) feltöltött fotói — a lap frissítés után is ebből látja, mi érkezett meg. Bármely tag. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const albumE = AlbumKulcs.safeParse(new URL(keres.url).searchParams.get("album") ?? "");
    if (!albumE.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    return valasz({ fotok: await albumFotok(ktx.szervezet.id, albumE.data) });
  } catch (h) {
    console.error("Album foto GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
