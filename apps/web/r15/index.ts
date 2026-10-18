import "server-only";
import { and, eq } from "drizzle-orm";
import { aktivVerzio, attekintes, beallitasMent, type Kartya } from "@km/news-monitor-core";
import type { PosztMunka } from "@km/contracts";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";
import { kornyezet } from "../hirfigyelo";
import { profilBetolt } from "../profil";
import { iranytuJovahagyott } from "../iranytu";
import { posztTar } from "../poszt/tar";
import { szovegetKeszit, veglegesit, type PosztKeres } from "../poszt";
import { hetiHalad } from "../halad";
import { forrasNev, halad, keszPoszt, kezdolapAllapot, napjaVolt, posztKesz, rovidCim, varoPoszt } from "./szamol";
import { fesztivalOtletek } from "../program/otletek";
import { esedekesOtletek } from "../program/horgony";
import { napKulcs } from "../poszt/naptar";
import { OTLET_MAX } from "../iranytu/otletek";
import type { R15Felulet, R15Halad, R15HirKartya, R15HirReszlet, R15Hirek, R15KeszValasz, R15Kezdolap, R15NapiFigyeles, R15PosztLista, R15Teendo } from "./tipusok";

// R-15 · 2. szállítmány (03 Kezdőlap · 04 Hírek · 08 Posztszöveg) — a lapok adata és a gépezet (design/R15/gepezet.md).
// A régi gépezetet (poszt, hírfigyelő, halad) HASZNÁLJA, nem írja át: a lapok ugyanazt a munkát mutatják, csak másként.

type Szerep = "tulajdonos" | "szerkeszto" | "nezo";
const HIR_POSZT_MAX = 6; // egy gyűjtés után legfeljebb ennyi poszt íródik magától (kredit és idő)

/** A szervezet első tartalomnyelve — ezen készül a poszt (kerdesek 6). */
export async function elsoNyelv(szervezetId: string): Promise<"hu" | "ro" | "en"> {
  const p = await profilBetolt(szervezetId).catch(() => null);
  const n = p?.nyelvek?.[0];
  return n === "ro" || n === "en" ? n : "hu";
}

async function tulajdonosFiok(szervezetId: string): Promise<string | undefined> {
  const sor = await szervezetKent(szervezetId, (tx) =>
    tx.select({ fiok: sema.tagsag.fiokId }).from(sema.tagsag)
      .where(and(eq(sema.tagsag.szervezetId, szervezetId), eq(sema.tagsag.szerep, "tulajdonos"))).limit(1),
  ).catch(() => []);
  return sor[0]?.fiok;
}

/** Az érdekes hír: értékelve, fontos vagy érdekes, nem elrejtett (gepezet 8). */
function erdekes(k: Kartya): boolean {
  return k.ertekeles_allapot === "kesz" && (k.fontossag === "fontos" || k.fontossag === "erdekes") && k.jeloles !== "elrejtett";
}

type HirAllapot = { kartyak: Kartya[]; kihagyott: number; utolso: string | null; fut: boolean };

/** gepezet-2 5–6 — a napi hírfigyelés az aktív beállítás `idozites.mod`-jából (ugyanaz, amit a „Bekapcsolom” átír: `napiFigyelesBe`). */
async function napiFigyeles(szervezetId: string, fiokId?: string): Promise<R15NapiFigyeles> {
  try {
    const k = await kornyezet(szervezetId, "hu", fiokId);
    const aktiv = aktivVerzio(await k.tar.verziok(szervezetId));
    if (!aktiv) return "nincs";
    return aktiv.beallitas.idozites.mod === "napi" ? "be" : "ki";
  } catch (h) {
    console.error("[r15] napi figyelés:", h);
    return "nincs";
  }
}

async function hirAllapot(szervezetId: string, nezoFiokId?: string): Promise<HirAllapot> {
  const k = await kornyezet(szervezetId, "hu", nezoFiokId);
  const e = await attekintes(k, { fiok_id: nezoFiokId ?? "00000000-0000-4000-8000-000000000000", szervezet_id: szervezetId, szerep: "tulajdonos" });
  if (!e.ok) return { kartyak: [], kihagyott: 0, utolso: null, fut: false };
  const kihagyott = e.talalatok.filter((t) => t.ertekeles_allapot === "kesz" && t.ertekeles?.fontossag === "hatter" && t.megtekintes === "uj").length;
  const utolso = e.utolsoFutas?.veg ?? e.utolsoFutas?.kezdet ?? null;
  return { kartyak: e.kartyak.filter(erdekes), kihagyott, utolso, fut: !!e.aktivFutas };
}

function munkaHirhez(munkak: PosztMunka[], talalatId: string): PosztMunka | undefined {
  return munkak.find((m) => m.forras.tipus === "hir" && m.forras.azonosito === talalatId);
}

async function haladKiszamol(szervezetId: string, varoDb: number): Promise<R15Halad> {
  const h = await hetiHalad(szervezetId).catch(() => ({ poszt_kesz: 0, kep_letoltve: 0 }));
  return halad(h.poszt_kesz, h.kep_letoltve, varoDb);
}

// ---------------------------------------------------------------------------
// 04 Hírek
// ---------------------------------------------------------------------------

/** A Hírek lap kártyái: az érdekes hírek, amelyekből még nincs KÉSZ poszt (a kész posztos hír a munkájával együtt lekerül). */
export async function r15Hirek(szervezetId: string, fiokId: string, szerep: Szerep): Promise<R15Hirek> {
  const [ha, munkak, napi] = await Promise.all([hirAllapot(szervezetId, fiokId), posztTar.mind(szervezetId), napiFigyeles(szervezetId, fiokId)]);
  const kartyak: R15HirKartya[] = [];
  for (const k of ha.kartyak) {
    const m = munkaHirhez(munkak, k.fo_talalat_id);
    if (m && posztKesz(m)) continue;
    const cim = k.cim_forditott || k.cim;
    const url = k.forrasok[0]?.url ?? "";
    kartyak.push({
      talalat_id: k.fo_talalat_id,
      forras_nev: forrasNev(url),
      url,
      rovid_cim: m?.forras.rovid_cim || rovidCim(cim),
      cim,
      otlet: m?.forras.otlet ?? "",
      munka_id: m?.id ?? null,
      mentett: k.jeloles === "mentett",
    });
  }
  const varoDb = munkak.filter((m) => !posztKesz(m)).length;
  return {
    kartyak,
    halad: await haladKiszamol(szervezetId, varoDb),
    utolso_kereses_nap: napjaVolt(ha.utolso),
    fut: ha.fut,
    kihagyott: ha.kihagyott,
    szerkeszthet: szerep !== "nezo",
    napi_figyeles: napi,
    // gepezet-2 5 (mérve 10-01, news-monitor-core folyamat.ts): az `aktivFutas` = indul/fut állapotú gyűjtés; az `utolsoFutas` = a
    // legutóbbi LEZÁRT gyűjtés (null, ha még egy sem zárult le). A kettő együtt: az első gyűjtés most fut.
    elso_gyujtes: ha.fut && ha.utolso === null,
  };
}

/**
 * c5 · 05 Hír részletei (gepezet-4 · 3): egy hír a NÉZŐ szemével (az ő szűrő-beállításával, mint a 04-en), a fő- vagy bármelyik
 * forrás-találat azonosítójával. Bérlő: csak a szervezet saját adatából (a hírfigyelő-környezet a szervezet sorait olvassa, A-11) —
 * más szervezet találat-azonosítójára null (a lap 404-et ad). Új tábla, új lekérdezés nincs: ugyanaz az `attekintes`, mint a 04-en.
 */
export async function r15Hir(szervezetId: string, fiokId: string, talalatId: string): Promise<R15HirReszlet | null> {
  const [k, munkak, nyelv] = await Promise.all([kornyezet(szervezetId, undefined, fiokId), posztTar.mind(szervezetId), elsoNyelv(szervezetId)]);
  const e = await attekintes(k, { fiok_id: fiokId, szervezet_id: szervezetId, szerep: "tulajdonos" });
  if (!e.ok) return null;
  const kartya = e.kartyak.find((x) => x.fo_talalat_id === talalatId) ?? e.kartyak.find((x) => x.forrasok.some((f) => f.talalat_id === talalatId));
  if (!kartya) return null;
  const m = munkaHirhez(munkak, kartya.fo_talalat_id);
  return { kartya, munka_id: m?.id ?? null, tartalom_nyelv: nyelv };
}

/** A felső sáv „Hírek” jelvénye és a Hírek lap címe UGYANAZ a szám (gepezet 8). */
export async function r15HirSzam(szervezetId: string, fiokId: string): Promise<number> {
  try {
    const [ha, munkak] = await Promise.all([hirAllapot(szervezetId, fiokId), posztTar.mind(szervezetId)]);
    return ha.kartyak.filter((k) => { const m = munkaHirhez(munkak, k.fo_talalat_id); return !(m && posztKesz(m)); }).length;
  } catch (h) {
    console.error("[r15] hirSzam:", h);
    return 0;
  }
}

/** A „Posztszöveg” jelvény: a Vár rád posztok száma. */
export async function r15VaroSzam(szervezetId: string): Promise<number> {
  try {
    return (await posztTar.mind(szervezetId)).filter((m) => !posztKesz(m)).length;
  } catch (h) {
    console.error("[r15] varoSzam:", h);
    return 0;
  }
}

/** Egy hírhez a poszt munkája: ha van, azt adja; ha nincs, létrehozza (a szöveget a 08 lap íratja meg, „Írjuk a posztot…”). */
export async function hirbolPoszt(szervezetId: string, fiokId: string | null, talalatId: string): Promise<PosztMunka | null> {
  const munkak = await posztTar.mind(szervezetId);
  const meglevo = munkaHirhez(munkak, talalatId);
  if (meglevo) return meglevo;
  const ha = await hirAllapot(szervezetId, fiokId ?? undefined);
  const k = ha.kartyak.find((x) => x.fo_talalat_id === talalatId)
    ?? (await attekintesKartya(szervezetId, talalatId));
  if (!k) return null;
  const cim = k.cim_forditott || k.cim;
  const nyelv = await elsoNyelv(szervezetId);
  const munka = await posztTar.letrehoz(szervezetId, fiokId, cim.slice(0, 200), {
    tipus: "hir",
    azonosito: talalatId,
    cim,
    url: k.forrasok[0]?.url ?? "",
    // v5 (2026-09-28): a „miert” (nekünk szóló ötlet: „Készíthettek…”) NEM kerül a gép elé — abból lett felajánlás a posztban.
    // Helyette a hír megjelenésének napja, hogy a gép a lezajlott eseményt múlt időben írja.
    szoveg: [k.esemeny_ideje ? `A hír megjelenése: ${k.esemeny_ideje.slice(0, 10)}` : "", k.osszefoglalo].filter(Boolean).join("\n\n").slice(0, 4000),
    rovid_nev: "",
    rovid_cim: "",
    otlet: "",
    kep_fajl_id: "",
  });
  munka.szovegek = [{ felulet: "fb", nyelv, szoveg: "", javaslat: "", hashtagek: [], allapot: "nincs", veglegesitve: null, nyelvre_szabva: false, elavult_forditas: false }];
  return posztTar.ment(szervezetId, munka);
}

/** Minden kártya közül (nem csak az érdekesek) — ha a néző szűrője szigorúbb, a Részletekből is lehet posztot kérni. */
async function attekintesKartya(szervezetId: string, talalatId: string): Promise<Kartya | undefined> {
  const k = await kornyezet(szervezetId, "hu");
  const e = await attekintes(k, { fiok_id: "00000000-0000-4000-8000-000000000000", szervezet_id: szervezetId, szerep: "tulajdonos" });
  return e.ok ? e.kartyak.find((x) => x.fo_talalat_id === talalatId) : undefined;
}

/**
 * gepezet 1 — a gyűjtés után a gép minden érdekes hírhez megírja a posztot (Facebook, az első tartalomnyelven).
 * A tulajdonos szemével nézi, mi érdekes. Legfeljebb HIR_POSZT_MAX darab egy körben; ami kimarad, a gomb megnyomásakor íródik meg.
 * A kredit a munkatéré (nincs kérő ember). Hiba nem állítja meg a futtatót.
 */
export async function posztokatIrHirekbol(szervezetId: string): Promise<number> {
  const tulaj = await tulajdonosFiok(szervezetId);
  const ha = await hirAllapot(szervezetId, tulaj);
  const nyelv = await elsoNyelv(szervezetId);
  let irt = 0;
  for (const k of ha.kartyak) {
    if (irt >= HIR_POSZT_MAX) break;
    const munkak = await posztTar.mind(szervezetId);
    const m = munkaHirhez(munkak, k.fo_talalat_id);
    if (m && m.szovegek.some((c) => c.szoveg.trim())) continue;
    try {
      const munka = m ?? (await hirbolPoszt(szervezetId, null, k.fo_talalat_id));
      if (!munka) continue;
      const keres: PosztKeres = { szervezetId, id: munka.id, felulet: "fb", nyelv, uiNyelv: nyelv };
      await szovegetKeszit(keres);
      irt += 1;
    } catch (h) {
      console.error("[r15] poszt írása hírből:", k.fo_talalat_id, h instanceof Error ? h.message : h);
      if (h instanceof Error && /KERET|KIMERULT|KIKAPCSOLVA/.test(h.message)) break; // elfogyott a kredit: nincs értelme folytatni
    }
  }
  if (irt > 0) console.log(`[r15] ${irt} poszt megírva hírekből (szervezet=${szervezetId})`);
  return irt;
}

// ---------------------------------------------------------------------------
// 03 Kezdőlap
// ---------------------------------------------------------------------------

export async function r15Kezdolap(szervezetId: string, fiokId: string, szerep: Szerep): Promise<R15Kezdolap> {
  const nyelv = await elsoNyelv(szervezetId);
  const munkak = await posztTar.mind(szervezetId);
  const varo = munkak.filter((m) => !posztKesz(m)).map((m) => varoPoszt(m, nyelv));
  const megVar: R15Teendo[] = varo.slice(1).map((p) => ({ kod: "poszt", poszt: p }));

  // Apró teendők — csak valódi dolog (gepezet 7): a napi figyelés ki van kapcsolva; nincs jóváhagyott iránytű-cél.
  // gepezet-2 6: N = 0 esetén a „Friss hírek minden reggel” így a lista ELSŐ sora (a váró posztok előtte nincsenek).
  let utolso: string | null = null;
  let napi: R15NapiFigyeles = "nincs";
  try {
    const k = await kornyezet(szervezetId, "hu", fiokId);
    const verziok = await k.tar.verziok(szervezetId);
    const aktiv = aktivVerzio(verziok);
    napi = !aktiv ? "nincs" : aktiv.beallitas.idozites.mod === "napi" ? "be" : "ki";
    if (napi === "ki" && szerep !== "nezo") megVar.push({ kod: "napi_figyeles" });
    const futasok = await k.tar.futasok(szervezetId);
    const lezart = futasok.filter((f) => f.allapot !== "indul" && f.allapot !== "fut");
    const legutobbi = lezart.reduce<(typeof lezart)[number] | null>((a, f) => (!a || new Date(f.kezdet) > new Date(a.kezdet) ? f : a), null);
    utolso = legutobbi?.veg ?? legutobbi?.kezdet ?? null;
  } catch (h) {
    console.error("[r15] kezdolap hírfigyelő:", h);
  }
  try {
    const ir = await iranytuJovahagyott(szervezetId);
    const celok = (ir as { celok?: unknown[] } | null)?.celok;
    if (!ir || !Array.isArray(celok) || celok.length === 0) megVar.push({ kod: "celok" });
  } catch (h) {
    console.error("[r15] kezdolap iránytű:", h);
  }

  // c30 F8 (terv §4, rajz D7a): a fesztivál esedékes ötletei (ma … ma + 2) — a Kezdőlap OTLET_MAX helyét ezek töltik; cégnél null → semmi
  const ma = napKulcs(new Date());
  const f = await fesztivalOtletek(szervezetId).catch((h) => { console.error("[r15] kezdolap ötletek:", h); return null; });
  const otletek = f ? esedekesOtletek(f.lista, ma, f.letezo, OTLET_MAX).map((o) => ({ ...o, ma: o.nap === ma, nyelv: f.nyelv })) : [];
  const h = await haladKiszamol(szervezetId, varo.length);
  return {
    varo,
    meg_var: megVar,
    halad: h,
    utolso_kereses_nap: napjaVolt(utolso),
    szerkeszthet: szerep !== "nezo",
    // gepezet-2 2: „még soha nem lett kész poszt” — a munkák közül egy sincs Kész állapotban (gepezet 4), bármelyik héten.
    // c30 F8: esedékes ötlettel a lap dolgos (a rajz D7a: „Ma 2 poszt vár rád”), akkor is, ha nincs váró poszt
    allapot: otletek.length && varo.length === 0 ? "dolgos" : kezdolapAllapot(varo, h, munkak.some(posztKesz)),
    napi_figyeles: napi,
    ...(otletek.length ? { otletek } : {}),
  };
}

/** „Bekapcsolom” — a napi hírfigyelés: az aktív beállítás új verziója `idozites.mod = "napi"`-val (a Beállítás lap ugyanezt teszi). */
export async function napiFigyelesBe(szervezetId: string, fiokId: string, szerep: Szerep): Promise<boolean> {
  const k = await kornyezet(szervezetId, "hu", fiokId);
  const aktiv = aktivVerzio(await k.tar.verziok(szervezetId));
  if (!aktiv) return false;
  if (aktiv.beallitas.idozites.mod === "napi") return true;
  const uj = { ...aktiv.beallitas, idozites: { ...aktiv.beallitas.idozites, mod: "napi" as const } };
  const e = await beallitasMent(k, { fiok_id: fiokId, szervezet_id: szervezetId, szerep }, uj, "kezi");
  return e.ok;
}

/** Kikapcsolás (gepezet-3 3.9 / kerdesek-3 3, Csilla 10-01: jóváhagyva) — a „Bekapcsolom” párja: az aktív beállítás új verziója
 *  `idozites.mod = "kezi"`-vel (a napi gyűjtés leáll; a kézi „Keress most” és minden más beállítás marad). Ugyanaz az út, mint a
 *  bekapcsolásé (beallitasMent, új verzió — a régi verziók megmaradnak). Már kikapcsolt állapotban nem ír semmit. */
export async function napiFigyelesKi(szervezetId: string, fiokId: string, szerep: Szerep): Promise<boolean> {
  const k = await kornyezet(szervezetId, "hu", fiokId);
  const aktiv = aktivVerzio(await k.tar.verziok(szervezetId));
  if (!aktiv) return false;
  if (aktiv.beallitas.idozites.mod !== "napi") return true;
  const uj = { ...aktiv.beallitas, idozites: { ...aktiv.beallitas.idozites, mod: "kezi" as const } };
  const e = await beallitasMent(k, { fiok_id: fiokId, szervezet_id: szervezetId, szerep }, uj, "kezi");
  return e.ok;
}

// ---------------------------------------------------------------------------
// 08 Posztszöveg
// ---------------------------------------------------------------------------

export async function r15PosztLista(szervezetId: string): Promise<{ lista: R15PosztLista; halad: R15Halad; iranytuVan: boolean; nyelv: "hu" | "ro" | "en" }> {
  const nyelv = await elsoNyelv(szervezetId);
  const munkak = await posztTar.mind(szervezetId);
  const varo = munkak.filter((m) => !posztKesz(m)).map((m) => varoPoszt(m, nyelv));
  const kesz = munkak.filter(posztKesz).map(keszPoszt);
  const ir = await iranytuJovahagyott(szervezetId).catch(() => null);
  return { lista: { varo, kesz }, halad: await haladKiszamol(szervezetId, varo.length), iranytuVan: !!ir, nyelv };
}

/** gepezet 3 — „Kész, másolom”: véglegesít (ettől Kész és ettől nő a heti számláló), és megmondja a heti sorszámot és a következőt. */
export async function keszJelol(k: PosztKeres): Promise<R15KeszValasz> {
  await veglegesit(k);
  const munkak = await posztTar.mind(k.szervezetId);
  const varo = munkak.filter((m) => !posztKesz(m));
  const h = await haladKiszamol(k.szervezetId, varo.length);
  return {
    heti_sorszam: Math.max(1, h.poszt_kesz),
    kovetkezo_id: varo[0]?.id ?? null,
    varo_db: varo.length,
    felulet: k.felulet as R15Felulet,
    halad: h,
  };
}
