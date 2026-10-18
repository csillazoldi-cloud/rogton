// G9 — az oldal kapuja („kapu”): EGY közös jelszó minden előtt (Csilla, 2026-10-18 16:05 — a Cloudflare Access helyett).
// Ez a fájl a TISZTA szabály (nincs adatbázis, nincs Next): melyik út szabad, mi történjen egy kéréssel. A proxy.ts hívja, a próbák
// közvetlenül mérik. Döntés és okok: docs/decisions/2026-10-18-g9-kapu.md.

/** A kapu sütije (HttpOnly, Secure, SameSite=Lax, 30 nap) — az értéke egy átlátszatlan, véletlen jegy; a lenyomata a kapu_jegy táblában. */
export const KAPU_SUTI = "rogton_kapu";
export const KAPU_LAP = "/kapu";
export const JEGY_NAP = 30;
/** A proxy ezzel jelöli a kérést, ha a látogató a kapun KÍVÜL van (a kapu lapja, a szabad fájlok): a gyökér-keret ilyenkor csak a
 *  kapu feliratait adja le, és nem keres fiókot. A böngészőtől jövő azonos nevű fejlécet a proxy mindig eldobja. */
export const KAPU_KIVUL_FEJLEC = "x-rogton-kapun-kivul";
/** A kapu lapjának feliratai — a kapun kívül CSAK ezek kerülnek a lapra (a termék többi szövege nem). */
export const KAPU_FELIRAT_ELOTAG = "kapu.";

/** A beállított jelszó (üres = a kapu ki van kapcsolva). */
export function kapuJelszo(ertek: string | undefined = process.env.KAPU_JELSZO): string {
  return (ertek ?? "").trim();
}

const SZABAD_PONTOS = new Set([KAPU_LAP, "/api/egeszseg", "/manifest.webmanifest", "/favicon.ico"]);
const SZABAD_ELOTAG = ["/r18/ikon/", "/_next/static/", "/betuk/"];

/** A jelszó nélkül is elérhető utak (a brief listája). A Next a pathname-et a proxy előtt normalizálja (`..`, `%2e%2e`). */
export function szabadUt(ut: string): boolean {
  return SZABAD_PONTOS.has(ut) || SZABAD_ELOTAG.some((e) => ut.startsWith(e));
}

/** Visszatérési út a sikeres belépés után: csak SAJÁT, "/"-rel kezdődő út (nyílt átirányítás tilos), és nem maga a kapu. */
export function visszaUt(nyers: string | null | undefined): string {
  const v = (nyers ?? "").trim();
  if (!/^\/(?![/\\])/.test(v) || v.length > 2000 || /[\r\n]/.test(v)) return "/";
  if (v === KAPU_LAP || v.startsWith(`${KAPU_LAP}?`) || v.startsWith(`${KAPU_LAP}/`)) return "/";
  return v;
}

/**
 * Helyi-e a kérés — csak akkor számít, ha NINCS jelszó beállítva (a kapu ki van kapcsolva). Ilyenkor a gép csak a saját oldaláról
 * nyílik ki: a helyi fejlesztés és a próbák változatlanul mennek, egy jelszó nélkül maradt élő gép viszont a Cloudflare felől ZÁRVA.
 * Mérce: a CF-Connecting-IP fejléc. A gép egyetlen nyilvános útja a Cloudflare-alagút, és a Cloudflare ezt a fejlécet MINDEN kérésre
 * ráteszi (a látogató által küldöttet felülírja, levenni nem lehet). Ami nélküle jön, az a gépről magáról jön (127.0.0.1:8410, az
 * SSH-alagút, a kirakás életjele) — vagy egy fejlesztő gépről, ahol nincs is Cloudflare. A cím (X-Forwarded-For) NEM mérce: azt a
 * próbák szándékosan változtatják (a sebességkorlát-próbák), és a Next a proxyban nem adja a kapcsolat valódi címét.
 */
export function helyiKeres(fejlecek: Headers): boolean {
  return !fejlecek.get("cf-connecting-ip");
}

export type Dontes =
  | { tipus: "tovabb" } // a kapun belül (vagy kikapcsolt kapu helyben): a kérés megy a helyére
  | { tipus: "kivul" } // szabad út a kapun kívül: megy a helyére, a kapun-kívül jelöléssel
  | { tipus: "kapu-lap" } // oldal, jegy nélkül: a kapu lapja jelenik meg (200, a cím marad)
  | { tipus: "api-401" } // API vagy nem GET kérés jegy nélkül: 401 {"hiba":"kapu"}
  | { tipus: "belepes" } // POST /kapu: jelszó-ellenőrzés
  | { tipus: "mar-bent" } // GET /kapu érvényes jeggyel: vissza oda, ahonnan jött
  | { tipus: "zarva-lap" } // nincs jelszó beállítva, és a kérés nem helyi: „most nem elérhető” lap
  | { tipus: "zarva-api" }; // ugyanez API-ra / nem GET kérésre: 503

export function dontes(k: { modszer: string; ut: string; jelszoVan: boolean; helyi: boolean; jegyErvenyes: boolean }): Dontes {
  const olvas = k.modszer === "GET" || k.modszer === "HEAD";
  const api = k.ut.startsWith("/api/");
  if (!k.jelszoVan) {
    if (k.helyi) return { tipus: "tovabb" };
    // a kapu lapja maga is „kívül” megy (jelszó nélkül a „most nem elérhető” sort mutatja): a Next a proxy átírása után a proxyt
    // az ÚJ úttal újra lefuttatja — ha a /kapu is átírást kapna, a kérés körbe járna (mérve: a kérés 10 s-ig lógott)
    if (szabadUt(k.ut) && (k.ut !== KAPU_LAP || olvas)) return { tipus: "kivul" };
    return api || !olvas ? { tipus: "zarva-api" } : { tipus: "zarva-lap" };
  }
  if (k.ut === KAPU_LAP) {
    if (k.modszer === "POST") return { tipus: "belepes" };
    if (!olvas) return { tipus: "api-401" };
    return k.jegyErvenyes ? { tipus: "mar-bent" } : { tipus: "kivul" };
  }
  if (szabadUt(k.ut)) return { tipus: "kivul" };
  if (k.jegyErvenyes) return { tipus: "tovabb" };
  return api || !olvas ? { tipus: "api-401" } : { tipus: "kapu-lap" };
}

/** Csak a kapu feliratai — a kapun kívüli lapokra ennyi kerül a böngészőbe. */
export function kapuFeliratai(f: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(f).filter(([k]) => k.startsWith(KAPU_FELIRAT_ELOTAG)));
}
