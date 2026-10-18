// A bejárat folyamatai: mindegyik előbb dont(), aztán a tár, aztán esemény.
import {
  type HozzaferesHibaKod,
  type HostKontextus,
  type Kornyezet,
  type Meghivo,
  type MeghivoAllapot,
  type Szerep,
  type Tag,
} from "./host";
import { dont } from "./szabalyok";
import { lejarat, meghivoAllapot } from "./meghivo";

export type Eredmeny<T> =
  | { ok: true; ertek: T }
  | { ok: false; hiba: HozzaferesHibaKod };

function hiba<T>(kod: HozzaferesHibaKod): Eredmeny<T> {
  return { ok: false, hiba: kod };
}

export async function tagokLista(
  k: Kornyezet,
  ktx: HostKontextus,
): Promise<Eredmeny<Tag[]>> {
  const d = dont(ktx, "tagok_nez");
  if (!d.szabad) return hiba(d.indok);
  const tagok = await k.tagsag.tagok(ktx.szervezet_id);
  return { ok: true, ertek: tagok };
}

export async function meghiv(
  k: Kornyezet,
  ktx: HostKontextus,
  be: { szerep: Szerep; email?: string | null },
): Promise<Eredmeny<{ meghivo: Meghivo; jegy: string }>> {
  const d = dont(ktx, "tag_meghiv", { szerep: be.szerep });
  if (!d.szabad) return hiba(d.indok);

  const most = k.ora.most();
  const jegy = k.azonosito.jegy();
  const lenyomat = k.azonosito.lenyomat(jegy);

  const m: Meghivo = {
    id: k.azonosito.uj(),
    szervezet_id: ktx.szervezet_id,
    szerep: be.szerep,
    email: be.email ?? null,
    lenyomat,
    letrehozta: ktx.fiok_id,
    letrehozva: most,
    lejar: lejarat(most),
    allapot: "kiadott",
    elfogadta: null,
    elfogadva: null,
    visszavonva: null,
  };

  await k.meghivo.ment(m);
  await k.esemeny({
    fajta: "meghivo_kiadva",
    szervezet_id: ktx.szervezet_id,
    meghivo_id: m.id,
    szerep: m.szerep,
    kiadta: ktx.fiok_id,
  });

  return { ok: true, ertek: { meghivo: m, jegy } };
}

export async function meghivoLista(
  k: Kornyezet,
  ktx: HostKontextus,
): Promise<Eredmeny<(Meghivo & { allapot_most: MeghivoAllapot })[]>> {
  const d = dont(ktx, "tagok_nez");
  if (!d.szabad) return hiba(d.indok);

  const most = k.ora.most();
  const lista = await k.meghivo.lista(ktx.szervezet_id);
  const ki = lista.map((m) => ({
    ...m,
    allapot_most: meghivoAllapot(m, most),
  }));
  return { ok: true, ertek: ki };
}

export async function meghivoVisszavon(
  k: Kornyezet,
  ktx: HostKontextus,
  meghivo_id: string,
): Promise<Eredmeny<Meghivo>> {
  const d = dont(ktx, "meghivo_visszavon");
  if (!d.szabad) return hiba(d.indok);

  const m = await k.meghivo.azonositoSzerint(ktx.szervezet_id, meghivo_id);
  if (m === null) return hiba("NINCS_ILYEN_MEGHIVO");

  const most = k.ora.most();
  const allapot = meghivoAllapot(m, most);
  if (allapot === "elfogadott") return hiba("MEGHIVO_FELHASZNALVA");
  if (allapot === "visszavont") return hiba("MEGHIVO_VISSZAVONVA");
  if (allapot === "lejart") return hiba("MEGHIVO_LEJART");

  const frissitett: Meghivo = {
    ...m,
    allapot: "visszavont",
    visszavonva: most,
  };
  await k.meghivo.frissit(frissitett);
  await k.esemeny({
    fajta: "meghivo_visszavonva",
    szervezet_id: ktx.szervezet_id,
    meghivo_id: m.id,
    visszavonta: ktx.fiok_id,
  });
  return { ok: true, ertek: frissitett };
}

export async function meghivoElfogad(
  k: Kornyezet,
  elfogado: { fiok_id: string },
  jegy: string,
): Promise<Eredmeny<{ szervezet_id: string; szerep: Szerep }>> {
  const lenyomat = k.azonosito.lenyomat(jegy);
  const m = await k.meghivo.lenyomatSzerint(lenyomat);
  if (m === null) return hiba("NINCS_ILYEN_MEGHIVO");

  const most = k.ora.most();
  const allapot = meghivoAllapot(m, most);
  if (allapot === "elfogadott") return hiba("MEGHIVO_FELHASZNALVA");
  if (allapot === "visszavont") return hiba("MEGHIVO_VISSZAVONVA");
  if (allapot === "lejart") return hiba("MEGHIVO_LEJART");

  const tagok = await k.tagsag.tagok(m.szervezet_id);
  if (tagok.some((t) => t.fiok_id === elfogado.fiok_id)) {
    return hiba("MAR_TAG");
  }

  await k.tagsag.felvesz(m.szervezet_id, elfogado.fiok_id, m.szerep, most);

  const frissitett: Meghivo = {
    ...m,
    allapot: "elfogadott",
    elfogadta: elfogado.fiok_id,
    elfogadva: most,
  };
  await k.meghivo.frissit(frissitett);

  await k.esemeny({
    fajta: "meghivo_elfogadva",
    szervezet_id: m.szervezet_id,
    meghivo_id: m.id,
    fiok_id: elfogado.fiok_id,
    szerep: m.szerep,
  });
  await k.esemeny({
    fajta: "tag_felveve",
    szervezet_id: m.szervezet_id,
    fiok_id: elfogado.fiok_id,
    szerep: m.szerep,
  });

  return { ok: true, ertek: { szervezet_id: m.szervezet_id, szerep: m.szerep } };
}

export async function szerepAllit(
  k: Kornyezet,
  ktx: HostKontextus,
  fiok_id: string,
  szerep: Szerep,
): Promise<Eredmeny<Tag>> {
  const tagok = await k.tagsag.tagok(ktx.szervezet_id);
  const d = dont(ktx, "szerep_allit", { fiok_id, szerep, tagok });
  if (!d.szabad) return hiba(d.indok);

  const regi = tagok.find((t) => t.fiok_id === fiok_id);
  if (regi === undefined) return hiba("NINCS_ILYEN_TAG");

  await k.tagsag.szerepAllit(ktx.szervezet_id, fiok_id, szerep);
  await k.esemeny({
    fajta: "szerep_valtozott",
    szervezet_id: ktx.szervezet_id,
    fiok_id,
    regi: regi.szerep,
    uj: szerep,
    allitotta: ktx.fiok_id,
  });

  return {
    ok: true,
    ertek: { fiok_id, szerep, csatlakozott: regi.csatlakozott },
  };
}

export async function tagEltavolit(
  k: Kornyezet,
  ktx: HostKontextus,
  fiok_id: string,
): Promise<Eredmeny<{ fiok_id: string }>> {
  const tagok = await k.tagsag.tagok(ktx.szervezet_id);
  const d = dont(ktx, "tag_eltavolit", { fiok_id, tagok });
  if (!d.szabad) return hiba(d.indok);

  await k.tagsag.eltavolit(ktx.szervezet_id, fiok_id);
  await k.esemeny({
    fajta: "tag_eltavolitva",
    szervezet_id: ktx.szervezet_id,
    fiok_id,
    eltavolitotta: ktx.fiok_id,
  });
  return { ok: true, ertek: { fiok_id } };
}

export async function kilep(
  k: Kornyezet,
  ktx: HostKontextus,
): Promise<Eredmeny<{ fiok_id: string }>> {
  const tagok = await k.tagsag.tagok(ktx.szervezet_id);
  const d = dont(ktx, "kilep", { fiok_id: ktx.fiok_id, tagok });
  if (!d.szabad) return hiba(d.indok);

  await k.tagsag.eltavolit(ktx.szervezet_id, ktx.fiok_id);
  await k.esemeny({
    fajta: "tag_kilepett",
    szervezet_id: ktx.szervezet_id,
    fiok_id: ktx.fiok_id,
  });
  return { ok: true, ertek: { fiok_id: ktx.fiok_id } };
}
