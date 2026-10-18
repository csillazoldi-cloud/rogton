import "server-only";
import { desc, eq, inArray, and } from "drizzle-orm";
import type { FiokNezet } from "@rogton/contracts";
import { meghivoAllapot, meghivoLista, tagokLista } from "@rogton/hozzaferes-core";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { hozzaferesKornyezet, szerepFordit } from "../hozzaferes";
import type { BevaltoNezet, MeghivoSor, Szerep, TagEsemenySor, TagokNezet } from "./tipusok";

// F-3e (R-2): a Tagok lap és a beváltó lap adatának összeállítója — a hozzáférés-modul (gépezet) fölött, a befogadó adataival kiegészítve
// (név, e-mail a fiókból; a kiadó neve; a „Mi történt" sorok az eseménynaplóból). Új mérés nincs; a jegy sehol nem naplózódik.

export * from "./tipusok";

/** A tagsági fajták, amik a Tagok lap „Mi történt" blokkjába valók. */
const TAG_FAJTAK = ["meghivo_kiadva", "meghivo_visszavonva", "meghivo_elfogadva", "tag_felveve", "szerep_valtozott", "tag_eltavolitva", "tag_kilepett"];

async function fiokNevek(ids: string[]): Promise<Map<string, { nev: string; email: string }>> {
  const ki = new Map<string, { nev: string; email: string }>();
  const egyedi = [...new Set(ids.filter(Boolean))];
  if (egyedi.length === 0) return ki;
  const sorok = await db().select({ id: sema.fiok.id, nev: sema.fiok.nev, email: sema.fiok.email }).from(sema.fiok).where(inArray(sema.fiok.id, egyedi));
  for (const s of sorok) ki.set(s.id, { nev: s.nev, email: s.email });
  return ki;
}

/** A Tagok lap EGY adata. A néző ide nem jut (a lap átirányítja), de ha mégis: a meghívók listája neki üres. */
export async function tagokNezet(fiok: FiokNezet, szervezet: { id: string; nev: string }, szerep: Szerep): Promise<TagokNezet> {
  const k = hozzaferesKornyezet();
  const ktx = { fiok_id: fiok.id, szervezet_id: szervezet.id, szerep: szerepFordit(szerep) };

  const tagokE = await tagokLista(k, ktx);
  const tagok = tagokE.ok ? tagokE.ertek : [];
  const meghivokE = szerep === "nezo" ? null : await meghivoLista(k, ktx);
  const meghivok = meghivokE && meghivokE.ok ? meghivokE.ertek : [];

  let esemenyek: { id: string; fajta: string; ido: Date; fiokId: string | null; adat: unknown }[] = [];
  try {
    esemenyek = await szervezetKent(szervezet.id, (tx) =>
      tx
        .select({ id: sema.esemeny.id, fajta: sema.esemeny.fajta, ido: sema.esemeny.ido, fiokId: sema.esemeny.fiokId, adat: sema.esemeny.adat })
        .from(sema.esemeny)
        .where(and(eq(sema.esemeny.szervezetId, szervezet.id), inArray(sema.esemeny.fajta, TAG_FAJTAK)))
        .orderBy(desc(sema.esemeny.ido))
        .limit(5),
    );
  } catch (h) {
    console.error("[tagok] esemenyek:", h);
  }

  const nevek = await fiokNevek([...tagok.map((t) => t.fiok_id), ...meghivok.map((m) => m.letrehozta), ...esemenyek.map((e) => e.fiokId ?? "")]);

  return {
    munkater: { id: szervezet.id, nev: szervezet.nev },
    szerep,
    sajat_fiok_id: fiok.id,
    tagok: tagok.map((t) => ({
      fiok_id: t.fiok_id,
      nev: nevek.get(t.fiok_id)?.nev ?? "",
      email: nevek.get(t.fiok_id)?.email ?? "",
      szerep: t.szerep as Szerep,
      csatlakozott: t.csatlakozott,
      en: t.fiok_id === fiok.id,
    })),
    meghivok: meghivok.map((m): MeghivoSor => ({
      id: m.id,
      szerep: m.szerep as Szerep,
      email: m.email,
      letrehozva: m.letrehozva,
      lejar: m.lejar,
      allapot: m.allapot_most,
      kiadta_nev: nevek.get(m.letrehozta)?.nev ?? "",
    })),
    esemenyek: esemenyek.map((e): TagEsemenySor => ({
      id: e.id,
      fajta: e.fajta,
      ido: e.ido.toISOString(),
      fiok_nev: e.fiokId ? (nevek.get(e.fiokId)?.nev ?? null) : null,
      adat: (e.adat ?? {}) as Record<string, string | number | boolean | null>,
    })),
  };
}

/** A beváltó lap adata a jegyből (nyilvános): a nevet, a munkatér nevét és a szerepet CSAK élő (kiadott) meghívónál adjuk ki (D-F30). A jegyet nem naplózzuk. */
export async function bevaltoNezet(jegy: string, fiok: FiokNezet | null): Promise<BevaltoNezet> {
  const k = hozzaferesKornyezet();
  const ures: BevaltoNezet = {
    allapot: "nincs", meghivo_nev: null, szervezet_nev: null, szerep: null, lejar: null,
    belepve: fiok !== null, fiok_email: fiok?.email ?? null, mar_tag: false,
  };
  if (!jegy || jegy.length > 200) return ures;
  const m = await k.meghivo.lenyomatSzerint(k.azonosito.lenyomat(jegy));
  if (!m) return ures;
  const allapot = meghivoAllapot(m, k.ora.most());
  const marTag = fiok !== null && fiok.szervezetek.some((sz) => sz.id === m.szervezet_id);
  if (allapot !== "kiadott") return { ...ures, allapot, mar_tag: marTag };
  // a munkatér neve a meghívó szervezetének kapuján át (sorszintű védelem: a `szervezet` tábla csak a beállított szervezettel olvasható);
  // a látogató még nem tag, de a meghívó maga jogosít erre az egy névre — mérve: db()-vel üres jött (a próba fogta meg)
  const szervezetSor = await szervezetKent(m.szervezet_id, async (tx) =>
    (await tx.select({ nev: sema.szervezet.nev }).from(sema.szervezet).where(eq(sema.szervezet.id, m.szervezet_id)).limit(1))[0]);
  const nevek = await fiokNevek([m.letrehozta]);
  return {
    allapot,
    meghivo_nev: nevek.get(m.letrehozta)?.nev ?? "",
    szervezet_nev: szervezetSor?.nev ?? "",
    szerep: m.szerep as Szerep,
    lejar: m.lejar,
    belepve: fiok !== null,
    fiok_email: fiok?.email ?? null,
    mar_tag: marTag,
  };
}
