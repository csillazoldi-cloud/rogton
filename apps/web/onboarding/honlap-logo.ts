import "server-only";
// R-16 K7 (TERV §2-K7, 1.7 R7, §4 22., §5; gepezet 10): a honlapon talált logó a munkatér SAJÁT FÁJLJA lesz — így a 12b „Ezt találtuk”
// logója valódi fájl, és a kép már az első napon a cég logójával készül. Az első beállítás kutatása eddig csak a logó CÍMÉT adta
// (`honlapSzinek(...).logo`, onboarding/szinek.ts).
//  - Csak ha a munkatérnek MÉG NINCS logó-fájlja (R7): a feltöltött, a gép készítette vagy korábban letöltött logóhoz nem nyúlunk.
//  - Letöltés a közös letöltővel (`nyersBajtok`: nyilvános cím minden ugrásnál, időkorlát, 2 MB, csak PNG/JPEG/WebP/SVG), a típust a bájtok
//    fejéből is ellenőrizzük (fajl-core `tipusFelismer` / `fajlEllenoriz` — a fejléc hazudhat).
//  - SVG → a képgyártó `POST /svg-png` rasztere (Chromium `<img>`: szkript nem fut, hálózat nincs); a fajl-core SVG-t nem fogad.
//  - Mentés: `cel='logo'`, `logo_valtozat='vilagos'`, `eredet='honlap'`; `elemzes` nincs (a böngészős elemzés a feltöltésé) — a kép az
//    elemzés nélküli logót átlátszatlannak veszi, sötét háttéren lapra teszi (TERV §4 8.; nem színezi).
//  - BÁRMILYEN hiba csendes a felhasználónak (az első beállítás soha nem állhat meg miatta) és a naplóba kerül.
// A fájlokat a `fajl/tar`-ból írjuk (TERV §3); `vizual/*`-ot nem importálunk — a képgyártó hívása ezért itt külön áll (ugyanaz a
// KEPGYAR_URL, mint a vizual/helyzet.ts-é és az arculat/nevlogo.ts-é).
import { randomUUID } from "node:crypto";
import { fajlEllenoriz, kepreAlkalmasLogo, KEP_LOGO_MAX_BAJT, tipusFelismer, type FajlTar } from "@rogton/fajl-core";
import { fajlTar } from "../fajl/tar";
import { nyersBajtok } from "./letolto";

export type HonlapLogoEredmeny = "mentve" | "nincs_cim" | "van_logo" | "letoltes_hiba" | "rossz_tipus" | "raszter_hiba" | "tul_nagy" | "mentes_hiba";

/** A logó letöltése (alapból a közös, védett letöltő; a próba hamisat ad). */
export type LogoLetolto = (cim: string) => Promise<{ vegsoCim: string; bajtok: Uint8Array }>;
/** SVG → PNG (alapból a képgyártó; a próba hamisat ad). */
export type SvgRaszterezo = (svg: Uint8Array) => Promise<Uint8Array>;
export type HonlapLogoEszkozok = { letolt: LogoLetolto; raszter: SvgRaszterezo; tar: Pick<FajlTar, "lista" | "ment"> };

const KEPGYAR = process.env["KEPGYAR_URL"] ?? "http://192.168.1.249:8601";
const FEJ = 512;

/** A képgyártó `POST /svg-png` hívása (20 mp: a képgyártó egyszerre egy munkát végez). */
export const kepgyarSvgPng: SvgRaszterezo = async (svg) => {
  const adat = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  const v = await fetch(`${KEPGYAR}/svg-png`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ adat }), signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (!v.ok) throw new Error(`svg-png: ${v.status} ${(await v.text().catch(() => "")).slice(0, 200)}`);
  return new Uint8Array(await v.arrayBuffer());
};

export const ALAP_ESZKOZOK: HonlapLogoEszkozok = {
  letolt: (cim) => nyersBajtok(cim, { maxBajt: KEP_LOGO_MAX_BAJT }),
  raszter: kepgyarSvgPng,
  tar: fajlTar,
};

/** A fájl neve a címből (a lemezen az id a név — ez csak a listában látszik): az utolsó útszakasz, különben „logo”. */
export function logoFajlNev(cim: string, kiterjesztes: string): string {
  let alap = "logo";
  try {
    const utolso = decodeURIComponent(new URL(cim).pathname.split("/").filter(Boolean).pop() ?? "");
    const tiszta = utolso.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[/\\\u0000-\u001f]/g, "_").trim();
    if (tiszta) alap = tiszta.slice(0, 80);
  } catch { /* hibás cím: marad a „logo” */ }
  return `${alap}.${kiterjesztes}`;
}

/**
 * A honlap logója a világos helyre — csak ha a munkatérnek nincs logó-fájlja. Soha nem dob: az eredményt adja vissza (és naplóz).
 */
export async function honlapLogoMent(szervezetId: string, fiokId: string, logoCim: string | null | undefined, e: HonlapLogoEszkozok = ALAP_ESZKOZOK): Promise<HonlapLogoEredmeny> {
  const naplo = (eredmeny: HonlapLogoEredmeny, reszlet?: string) => {
    if (eredmeny === "mentve") console.log("[honlap_logo] mentve:", szervezetId, logoCim);
    else if (eredmeny !== "nincs_cim" && eredmeny !== "van_logo") console.error("[honlap_logo] nem mentettük:", eredmeny, szervezetId, logoCim, reszlet ?? "");
    return eredmeny;
  };
  try {
    if (!logoCim) return naplo("nincs_cim");
    if ((await e.tar.lista(szervezetId, "logo")).length > 0) return naplo("van_logo"); // R7
    let l: { vegsoCim: string; bajtok: Uint8Array };
    try {
      l = await e.letolt(logoCim);
    } catch (h) {
      return naplo("letoltes_hiba", h instanceof Error ? `${(h as { kod?: string }).kod ?? ""} ${h.message}` : String(h));
    }
    let bajtok = l.bajtok;
    if (tipusFelismer(bajtok.subarray(0, FEJ)) === "svg") {
      try {
        bajtok = await e.raszter(bajtok);
      } catch (h) {
        return naplo("raszter_hiba", h instanceof Error ? h.message : String(h));
      }
    }
    const ell = fajlEllenoriz({ meret: bajtok.byteLength, fej: bajtok.subarray(0, FEJ) }, { cel: "logo", maxMeret: KEP_LOGO_MAX_BAJT });
    if (!ell.ok) return naplo(ell.hiba === "TUL_NAGY" ? "tul_nagy" : "rossz_tipus", ell.hiba);
    const meta = { cel: "logo" as const, tipus: ell.ertek.tipus, meret: bajtok.byteLength };
    if (!kepreAlkalmasLogo(meta)) return naplo(meta.meret >= KEP_LOGO_MAX_BAJT ? "tul_nagy" : "rossz_tipus", meta.tipus); // pl. PDF: feltölthető, de képre nem kerül
    if ((await e.tar.lista(szervezetId, "logo")).length > 0) return naplo("van_logo"); // R7 újra: a letöltés alatt feltölthettek
    await e.tar.ment(
      {
        id: randomUUID(),
        szervezet_id: szervezetId,
        nev: logoFajlNev(l.vegsoCim, meta.tipus),
        ...meta,
        feltoltotte: fiokId,
        feltoltve: new Date().toISOString(),
        logo_valtozat: "vilagos",
        eredet: "honlap",
        elemzes: null,
      },
      bajtok,
    );
    return naplo("mentve");
  } catch (h) {
    return naplo("mentes_hiba", h instanceof Error ? h.message : String(h)); // a fájllista vagy a tár hibája
  }
}
