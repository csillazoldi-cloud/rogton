// R-15 · 2. szállítmány — a lapok tiszta számításai (adatbázis és hálózat nélkül; próba: probak/r15-szamol.proba.ts).
import type { PosztMunka } from "@rogton/contracts";
import type { R15VaroPoszt, R15KeszPoszt, R15Halad, R15KezdolapAllapot } from "./tipusok";

/**
 * gepezet-2 1 — a bemutatkozó poszt eredet-jele. A poszt eredetét a `forras` tárolja (gepezet 5: `tipus` + `azonosito`); a bemutatkozó
 * a „Saját ötletből” gépezetével készül (`tipus: "sajat"`), ezért a jele a `sajat` eredet RÖGZÍTETT azonosítója. Az A-8 szerint
 * ugyanaz az azonosító ugyanazt a munkát nyitja — így szervezetenként egy bemutatkozó poszt lehet. A generátor (gepezet-2 1,
 * Vilmos döntésére vár, kerdesek-2 2) ezt írja majd; addig egyetlen munkán sincs, és a 03a ág nem nyílik.
 */
export const BEMUTATKOZO_AZONOSITO = "profil:bemutatkozo";
export function bemutatkozoPoszt(m: Pick<PosztMunka, "forras">): boolean {
  return m.forras.tipus === "sajat" && m.forras.azonosito === BEMUTATKOZO_AZONOSITO;
}

/**
 * gepezet-2 2 — a Kezdőlap állapota. `valahaKesz`: volt-e a szervezetnek valaha kész posztja (bármelyik héten).
 * „A héten semmi nem lett kész”: 0 kész poszt ÉS 0 letöltött kép — ilyenkor a kész-pillanat nem jelenik meg (munkad).
 */
export function kezdolapAllapot(varo: Pick<R15VaroPoszt, "bemutatkozo">[], h: Pick<R15Halad, "poszt_kesz" | "kep_letoltve">, valahaKesz: boolean): R15KezdolapAllapot {
  if (varo.length === 1 && varo[0]!.bemutatkozo && !valahaKesz) return "elso";
  if (varo.length > 0) return "dolgos";
  return h.poszt_kesz > 0 || h.kep_letoltve > 0 ? "kesz" : "munkad";
}

/** gepezet 4 — két látható állapot: Kész, ha bármelyik cellája véglegesítve (a „Kész, másolom” ezt teszi), különben Vár rád. */
export function posztKesz(m: PosztMunka): boolean {
  return m.szovegek.some((c) => c.allapot === "vegleges");
}

/** A poszt fő szövege: a kért nyelvű facebookos cella, különben bármelyik nem üres cella. */
export function foSzoveg(m: PosztMunka, nyelv?: string): string {
  const fb = m.szovegek.find((c) => c.felulet === "fb" && (!nyelv || c.nyelv === nyelv) && c.szoveg.trim());
  if (fb) return fb.szoveg;
  return m.szovegek.find((c) => c.szoveg.trim())?.szoveg ?? "";
}

/** gepezet 11 — a hír címének első mondata; ha 8 szónál hosszabb, az első 8 szó + „…”. */
export function rovidCim(cim: string): string {
  const tiszta = cim.replace(/\s+/g, " ").trim();
  const elso = (tiszta.match(/^.*?[.!?](?=\s|$)/u)?.[0] ?? tiszta).trim();
  const szavak = elso.split(" ").filter(Boolean);
  return szavak.length <= 8 ? elso : `${szavak.slice(0, 8).join(" ")}…`;
}

/** gepezet 5 — a lista rövid neve: amit a gép írt, különben a rövid cím első három szava, különben a munka címe. */
export function rovidNev(m: PosztMunka): string {
  if (m.forras.rovid_nev) return m.forras.rovid_nev;
  const alap = m.forras.rovid_cim || m.forras.cim || m.cim;
  const szavak = alap.replace(/[.!?…]+$/u, "").split(/\s+/).filter(Boolean);
  return szavak.length <= 3 ? szavak.join(" ") : `${szavak.slice(0, 3).join(" ")}…`;
}

/** Legfeljebb n szó; ha több, az első n + „…” (a kártya szövege sosem nő meg — T5). */
/** VJ-1011: a Kezdőlap nagy sora telefonon legfeljebb ennyi szó — mérve 10-10: a gép 12 szavas első mondatával a 03 telefonon 43 szó
 *  (T5 ≤ 40); 8 szóval 39. Asztalon a teljes (≤ 12 szavas) sor marad. */
export const TEL_CIM_SZO = 8;

function szavakig(mondat: string, n: number): string {
  const sz = mondat.split(/\s+/).filter(Boolean);
  return sz.length <= n ? mondat : `${sz.slice(0, n).join(" ")}…`;
}

/** Mondatokra bontás (a végjellel együtt). */
function mondatok(sor: string): string[] {
  return (sor.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/gu) ?? []).map((m) => m.trim()).filter(Boolean);
}

/**
 * A Kezdőlap nagy kártyájára: az első mondat (a poszt „címe”) és az utána következő mondat — hashtag-sor és üres sor nélkül.
 * Ha a gép egy bekezdésben írt, a bekezdés mondatait vesszük; így a kártya sosem kapja a teljes szöveget.
 */
export function sorok(szoveg: string): { elso: string; masodik: string } {
  const m = szoveg
    .split(/\n+/)
    .map((x) => x.trim())
    .filter((x) => x && !/^(#\S+\s*)+$/u.test(x))
    .flatMap(mondatok);
  return { elso: szavakig(m[0] ?? "", 12), masodik: szavakig(m[1] ?? "", 16) };
}

export function varoPoszt(m: PosztMunka, nyelv?: string): R15VaroPoszt {
  const sz = foSzoveg(m, nyelv);
  const { elso, masodik } = sorok(sz);
  return {
    id: m.id,
    rovid_nev: rovidNev(m),
    forras_cim: m.forras.cim || m.cim,
    elso_sor: elso,
    elso_sor_rovid: szavakig(elso || m.forras.cim || m.cim, TEL_CIM_SZO),
    masodik_sor: masodik,
    van_szoveg: sz.trim().length > 0,
    forras_tipus: m.forras.tipus,
    bemutatkozo: bemutatkozoPoszt(m),
  };
}

export function keszPoszt(m: PosztMunka): R15KeszPoszt {
  return { id: m.id, rovid_nev: rovidNev(m), forras_tipus: m.forras.tipus };
}

/** gepezet 2 — a sáv kitöltése: kész / (kész + váró), legfeljebb 1; ha egyik sincs, 0. */
export function halad(posztKeszDb: number, kepDb: number, varoDb: number): R15Halad {
  const osszes = posztKeszDb + varoDb;
  const arany = osszes === 0 ? 0 : Math.min(1, posztKeszDb / osszes);
  return { poszt_kesz: posztKeszDb, kep_letoltve: kepDb, varo: varoDb, arany };
}

/** A naptári nap kulcsa Europe/Budapest szerint (ÉÉÉÉ-HH-NN). */
function napKulcs(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Budapest", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** gepezet 9 — hány naptári napja volt (0 = ma, 1 = tegnap), Europe/Budapest szerint; null → soha. */
export function napjaVolt(ido: string | Date | null | undefined, most = new Date()): number | null {
  if (!ido) return null;
  const d = typeof ido === "string" ? new Date(ido) : ido;
  if (Number.isNaN(d.getTime())) return null;
  const a = Date.parse(`${napKulcs(d)}T00:00:00Z`);
  const b = Date.parse(`${napKulcs(most)}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** A hírforrás rövid neve: a domain, „www.” nélkül. */
export function forrasNev(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** 08b (gepezet 12) — a platform „Továbbiak” / „több” előtti része, karakterben (ugyanaz, mint a poszt-gépezet LATHATO_HATAR-a). */
export const ELONEZET_HATAR = { fb: 477, ig: 125, li: 210, blog: 600 } as const; // R-17 C2: a cikk első bekezdései
/** A platformok felső határa (poszt-gépezet KARAKTERHATAR); fölötte valódi baj. */
export const FELSO_HATAR = { fb: 63_206, ig: 2_200, li: 3_000, blog: 63_206 } as const; // a blog határa PUHA (2 500, csak számláló) — „baj” nincs

/**
 * 08b — az előnézet szövege: ha hosszabb a platform látható részénél, szóhatáron vágva (a vég írásjel és szóköz nélkül),
 * különben egészben. Instagramon a sortörések szóközzé válnak (a felirat egy folyó sor a név után).
 */
export function elonezetVag(szoveg: string, felulet: "fb" | "ig" | "li" | "blog"): { latszo: string; vagott: boolean; tul: boolean } {
  const alap = felulet === "ig" ? szoveg.replace(/\s*\n+\s*/g, " ").trim() : szoveg.trim();
  const hatar = ELONEZET_HATAR[felulet];
  const tul = szoveg.length > FELSO_HATAR[felulet];
  if (alap.length <= hatar) return { latszo: alap, vagott: false, tul };
  const eleje = alap.slice(0, hatar);
  const szokoz = eleje.search(/\s\S*$/u);
  const vag = (szokoz > hatar * 0.6 ? eleje.slice(0, szokoz) : eleje).replace(/[\s.,;:!?–—-]+$/u, "");
  // Ha a vágás egy új bekezdés első 1–3 szavánál van, a bekezdés előtt vágunk (ne lógjon egy csonka sor a „több” előtt).
  const bek = vag.lastIndexOf("\n");
  const vege = bek >= 0 ? vag.slice(bek + 1).trim().split(/\s+/).filter(Boolean).length : 99;
  const vegso = bek > 0 && vege < 4 ? vag.slice(0, bek).replace(/[\s.,;:!?–—-]+$/u, "") : vag;
  return { latszo: vegso, vagott: true, tul };
}
