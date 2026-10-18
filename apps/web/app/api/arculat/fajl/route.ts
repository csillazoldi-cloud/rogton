import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { fajlKornyezet } from "../../../../fajl";
import { szerepFordit } from "../../../../hozzaferes";
import { FajlCel, LogoValtozat, celMaxMeret, fajlEllenoriz, feltolt, feltoltFajlbol, fajlLista } from "@rogton/fajl-core";
import { eldob, ideiglenesTorol, korlatosBeolvas, torzsFajlba } from "../../../../fajl/beolvas";
import { elemzesFejlecbol, hianyzoNyelvre, type BetuElemzes } from "@rogton/arculat-core";
import { betuVizsgal } from "../../../../arculat/betu";
import { profilTar } from "../../../../profil/tar";

export const dynamic = "force-dynamic";

export async function POST(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "szerkeszto");
    if (ktx instanceof Response) return ktx;

    const nyersNev = keres.headers.get("x-fajl-nev");
    const nev = nyersNev ? decodeURIComponent(nyersNev) : "fajl";
    const nyersCel = keres.headers.get("x-fajl-cel");
    const celE = FajlCel.safeParse(nyersCel ?? "dokumentum");
    if (!celE.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const cel = celE.data;
    // c30 F9: az albumfotó a saját végpontján jön (/api/album/foto — kvóta, sebességkorlát, képméret, külön mappa), itt nem
    if (cel === "album") {
      await eldob(keres);
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }

    // Csilla 2026-10-10: a korlát célonként (fajl-core `celMaxMeret`): arculati/szervezeti fájl 100 MB, betű és posztkép 10 MB.
    // A `content-length` > korlát → 413 azonnal (a törzs beolvasása előtt).
    const max = celMaxMeret(cel);
    const cl = keres.headers.get("content-length");
    if (cl && Number(cl) > max) {
      await eldob(keres); // a válasz így biztosan megérkezik (különben a kliens kapcsolat-bontást lát)
      return hiba({ hiba: "TUL_NAGY" }, 413);
    }

    const nyersHely = keres.headers.get("x-logo-valtozat");
    const helyE = nyersHely === null ? null : LogoValtozat.safeParse(nyersHely);
    if (helyE && !helyE.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const logoValtozat = cel === "logo" ? (helyE?.data ?? "vilagos") : null;
    const elemzes = cel === "logo" ? elemzesFejlecbol(keres.headers.get("x-logo-elemzes")) : null;

    const ktxF = { fiok_id: ktx.fiok.id, szervezet_id: ktx.szervezet.id, szerep: szerepFordit(ktx.szerep) };
    const k = fajlKornyezet();

    // R-16 K5 (TERV 1.5, §2-K5, gepezet 8): betű — a fontkit-vizsgálat a feltöltés ELŐTT fut, így ami nem nyitható meg betűként, az
    // nem kerül a lemezre (415 TIPUS_NEM_ENGEDETT). Előbb a fájl-core szabálya (üres · 10 MB · a fej ttf/otf/woff2-e), hogy a hibakód
    // ugyanaz legyen, mint máshol. Az eredmény (név + hiányzó ékezetek) az `elemzes` oszlopba kerül (a K1 oszlopa, új séma nélkül).
    // A betű (≤ 10 MB) a fontkit miatt memóriában marad, de korláttal olvasva (darabolt küldésnél sem nő a korlát fölé).
    let betu: BetuElemzes | null = null;
    let e: Awaited<ReturnType<typeof feltolt>>;
    if (cel === "betu") {
      const bajtok = await korlatosBeolvas(keres, max);
      if (!bajtok) return hiba({ hiba: "TUL_NAGY" }, 413);
      const elo = fajlEllenoriz({ meret: bajtok.length, fej: bajtok.subarray(0, 512) }, { cel });
      if (!elo.ok) {
        const http = elo.hiba === "TUL_NAGY" ? 413 : elo.hiba === "URES" ? 400 : 415;
        return hiba({ hiba: elo.hiba === "SVG_NEM_ENGEDETT" ? "TIPUS_NEM_ENGEDETT" : elo.hiba }, http);
      }
      betu = betuVizsgal(bajtok, nev);
      if (!betu) return hiba({ hiba: "TIPUS_NEM_ENGEDETT" }, 415);
      e = await feltolt(k, ktxF, { nev, cel, bajtok, logo_valtozat: logoValtozat, eredet: "feltoltes", elemzes: betu });
    } else {
      // Minden más (≤ 100 MB): a törzs darabonként egy ideiglenes fájlba megy futó bájtszámlálással (a korlát fölött azonnal megáll),
      // a típust a fájl első bájtjaiból ismerjük fel (SVG-tilalom marad), és a végleges helyére átnevezés viszi. Memóriában csak a fej.
      const t = await torzsFajlba(keres, max);
      if (!t.ok) return hiba({ hiba: t.hiba }, t.hiba === "TUL_NAGY" ? 413 : 400);
      try {
        e = await feltoltFajlbol(k, ktxF, {
          nev, cel, meret: t.meret, fej: t.fej, ideiglenesUt: t.ut,
          logo_valtozat: logoValtozat, eredet: "feltoltes", elemzes,
        });
      } finally {
        // sikeres úton a fájl már a helyén van (az átnevezés után ez nem talál semmit); hibaúton itt tűnik el
        await ideiglenesTorol(t.ut);
      }
    }

    if (!e.ok) {
      const http = e.hiba === "NINCS_JOG" ? 403
        : e.hiba === "SVG_NEM_ENGEDETT" || e.hiba === "TIPUS_NEM_ENGEDETT" ? 415
        : e.hiba === "TUL_NAGY" ? 413
        : e.hiba === "URES" || e.hiba === "ERVENYTELEN_ADAT" ? 400
        : 500;
      return hiba({ hiba: e.hiba }, http);
    }
    if (betu) {
      // a lap a munkatér nyelveire szűrt hiányt mondja (hu mindig, ro ha a munkatér nyelve) — TERV §2-K5: 201 { fajl, betu: { nev, hianyzo } }
      const nyelvek = (await profilTar.betolt(ktx.szervezet.id).catch(() => null))?.nyelvek ?? ["hu"];
      return valasz({ fajl: e.ertek, betu: { nev: betu.nev, hianyzo: hianyzoNyelvre(betu, nyelvek) } }, 201);
    }
    return valasz({ fajl: e.ertek }, 201);
  } catch (h) {
    console.error("Arculat fajl POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;

    const url = new URL(keres.url);
    const nyersCel = url.searchParams.get("cel");
    const celE = nyersCel === null ? null : FajlCel.safeParse(nyersCel);
    if (celE && !celE.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const cel = celE ? celE.data : null;

    const k = fajlKornyezet();
    const e = await fajlLista(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    }, cel ?? undefined);

    if (!e.ok) return hiba({ hiba: e.hiba }, 403);
    // R-15: a posztok képei (cel "kep") nem arculati anyagok — cél nélküli kérésre nem jönnek.
    // R-16 K5 (TERV §2-K5): a saját betűk (cel "betu") sem „Fájlok” — azok a 12e-n élnek.
    // c30 F9: az albumfotók sem (munkapéldányok, 30 napig; a felületük az F10 albuma) — cél nélküli kérésre nem jönnek.
    const lista = cel ? e.ertek : e.ertek.filter((f) => f.cel !== "kep" && f.cel !== "betu" && f.cel !== "album");
    return valasz({ fajl: lista }); // a lista is a `fajl` kulcs alatt (a szerződés/próbák szerint)
  } catch (h) {
    console.error("Arculat fajl GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
