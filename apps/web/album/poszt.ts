import "server-only";
// c30 F10 — a fotóalbum poszt (terv §6; rajz D8a–c): a válogatás (gép vagy tartalék), a sorrend, a „Kiveszem”, és a felirat.
//
// A válogatás a HÁTTÉRBEN fut (POST → 202, a lap 2 mp-enként kérdez): a gép 10–40 kicsi fotót néz meg, utána a felirat íródik — ez
// együtt 30–90 mp is lehet, a NAS nginx-e pedig 60 mp után bont (gotcha, F6b). Az állapot a poszton: `forras.album.allapot` = „fut” →
// „kesz” | „hiba”. Ami „fut”-ként 5 percnél régebbi, elakadtnak számít (újraindítható).
//
// A gép: `mellekletOlvas` (onboarding/kepolvaso.ts) „album_valogatas” feladattal, a `kicsi` (≤ 512 px) változatokkal, „low” felbontással,
// legfeljebb 40 képpel (csak ennél a feladatnál). Ha nem elérhető, vagy a válasza nem használható (teszt-gép is): a készítés ideje
// szerinti sor, egyenletesen 10 fotó (`gep: "sorrend"`). A lépés soha nem áll meg a gép miatt.
import type { PosztAlbum, PosztMunka } from "@km/contracts";
import { fajlTar } from "../fajl/tar";
import { mellekletOlvas } from "../onboarding/kepolvaso";
import { albumFeliratKeszit, munkatBetolt, type PosztKeres } from "../poszt";
import { posztTar } from "../poszt/tar";
import { albumFotoKivesz } from "./koltoztet";
import { albumFotok } from "./index";
import { VALOGATAS_ALAP, VALOGATAS_ELAKAD_MS, VALOGATAS_GEPNEK, egyenletesen, valogatasErtelmez, valogatasSorok, type AlbumFoto } from "./szabaly";

export class AlbumHiba extends Error {
  constructor(public readonly kod: "NINCS_ILYEN_FAJL" | "ERVENYTELEN_ADAT") { super(kod); }
}

/** Fut-e most a válogatás (az elakadt — 5 percnél régebbi — „fut” nem fut). */
export function valogatasFut(a: PosztAlbum | undefined, most = Date.now()): boolean {
  return a?.allapot === "fut" && !!a.kezdve && most - Date.parse(a.kezdve) < VALOGATAS_ELAKAD_MS;
}

/** A lap állapota: a poszt albuma és a feltöltött fotók (frissítés után is minden látszik, ami megérkezett). */
export async function albumAllapot(szervezetId: string, posztId: string): Promise<{ album: PosztAlbum | null; fotok: AlbumFoto[]; munka: PosztMunka }> {
  const munka = await munkatBetolt(szervezetId, posztId);
  const fotok = await albumFotok(szervezetId, posztId);
  const a = munka.forras.album;
  // a már nem létező (kivett, lejárt) fotók kimaradnak a sorból
  const elo = new Set(fotok.map((f) => f.id));
  const album = a ? { ...a, fotok: a.fotok.filter((f) => elo.has(f.fajl_id)), ...(a.allapot === "fut" && !valogatasFut(a) ? { allapot: "hiba" as const } : {}) } : null;
  return { album, fotok, munka };
}

/** A válogatás magja (a háttérben): a gép, vagy a tartalék. Ki: a poszt fotói sorrendben, leírással. */
export async function valogat(
  k: PosztKeres,
  fotok: AlbumFoto[],
  /** a gép — a próba a saját válaszát adhatja (a teszt-gép itt nem válaszol: a tartalék fut) */
  olvaso: typeof mellekletOlvas = mellekletOlvas,
): Promise<{ fotok: PosztAlbum["fotok"]; gep: "ai" | "sorrend" }> {
  const nekiad = fotok.filter((f) => f.kicsi_id).slice(0, VALOGATAS_GEPNEK);
  if (nekiad.length) {
    const mellekletek = [];
    for (const f of nekiad) {
      const b = await fajlTar.olvas(k.szervezetId, f.kicsi_id!).catch(() => null);
      if (b) mellekletek.push({ mime: "image/jpeg", bajtok: b, nev: `${mellekletek.length + 1}.jpg` });
    }
    if (mellekletek.length === nekiad.length) {
      const nyers = await olvaso(k.szervezetId, {
        feladat: "album_valogatas", promptFajl: "album_valogatas", nyelv: k.nyelv, mellekletek, max: VALOGATAS_GEPNEK, reszlet: "low",
        kiegeszites: `A fotók (a mellékletek sorrendjében):\n${valogatasSorok(nekiad).join("\n")}`,
      }, k.fiokId);
      const v = valogatasErtelmez(nyers, nekiad.length);
      if (v) return { fotok: v.map((x) => ({ fajl_id: nekiad[x.i - 1]!.id, leiras: x.leiras })), gep: "ai" };
    }
  }
  return { fotok: egyenletesen(fotok, VALOGATAS_ALAP).map((f) => ({ fajl_id: f.id, leiras: "" })), gep: "sorrend" };
}

async function albumMent(szervezetId: string, posztId: string, album: PosztAlbum, tipus = true): Promise<PosztMunka> {
  const munka = await munkatBetolt(szervezetId, posztId); // mindig a friss poszt (közben a lap menthetett szöveget)
  munka.forras.album = album;
  if (tipus) munka.forras.poszt_tipus = "album";
  return posztTar.ment(szervezetId, munka);
}

/** POST: a válogatás indítása (202). Ha már fut, a futó állapot jön vissza; ha nincs fotó, hiba. */
export async function albumValogatasIndit(k: PosztKeres): Promise<PosztAlbum> {
  const { album, fotok } = await albumAllapot(k.szervezetId, k.id);
  if (album && valogatasFut(album)) return album;
  if (fotok.length === 0) throw new AlbumHiba("NINCS_ILYEN_FAJL");
  const fut: PosztAlbum = { fotok: album?.fotok ?? [], allapot: "fut", kezdve: new Date().toISOString(), ...(album?.gep ? { gep: album.gep } : {}) };
  await albumMent(k.szervezetId, k.id, fut);
  void (async () => {
    try {
      const v = await valogat(k, fotok);
      await albumMent(k.szervezetId, k.id, { fotok: v.fotok, allapot: "fut", kezdve: fut.kezdve!, gep: v.gep });
      // a felirat: a gép nélkül (vagy hibánál) a mostani szöveg marad — a fotók sorrendje ettől még kész
      await albumFeliratKeszit(k, v.fotok.map((f) => f.leiras)).catch((e) => console.error("[album] a felirat nem készült el:", e instanceof Error ? e.message : e));
      await albumMent(k.szervezetId, k.id, { fotok: v.fotok, allapot: "kesz", gep: v.gep });
    } catch (e) {
      console.error("[album] a válogatás nem sikerült:", e instanceof Error ? e.message : e);
      await albumMent(k.szervezetId, k.id, { fotok: fut.fotok, allapot: "hiba" }).catch(() => undefined);
    }
  })();
  return fut;
}

/** A sorrend-lap (D8c): az új sorrend — csak a mostani választott fotók átrendezése (új fotó, ismétlés nem jöhet be). */
export async function albumSorrend(szervezetId: string, posztId: string, sorrend: string[]): Promise<PosztMunka> {
  const { album } = await albumAllapot(szervezetId, posztId);
  if (!album || valogatasFut(album)) throw new AlbumHiba("ERVENYTELEN_ADAT");
  const regi = new Map(album.fotok.map((f) => [f.fajl_id, f]));
  if (sorrend.length !== regi.size || new Set(sorrend).size !== sorrend.length || !sorrend.every((id) => regi.has(id))) throw new AlbumHiba("ERVENYTELEN_ADAT");
  return albumMent(szervezetId, posztId, { ...album, fotok: sorrend.map((id) => regi.get(id)!) }, false);
}

/** „Kiveszem” (D8c; Csilla 10-17): a fotó kikerül a posztból, és a tárból a `_torolni/` alá költözik (helyet szabadít fel, nem törlődik). */
export async function albumKivesz(szervezetId: string, posztId: string, fajlId: string): Promise<PosztMunka> {
  const { album } = await albumAllapot(szervezetId, posztId);
  if (!album || valogatasFut(album) || !album.fotok.some((f) => f.fajl_id === fajlId)) throw new AlbumHiba("NINCS_ILYEN_FAJL");
  const ment = await albumMent(szervezetId, posztId, { ...album, fotok: album.fotok.filter((f) => f.fajl_id !== fajlId) }, false);
  await albumFotoKivesz(szervezetId, fajlId);
  return ment;
}
