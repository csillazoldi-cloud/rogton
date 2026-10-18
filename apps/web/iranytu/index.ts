import "server-only";
import { IranytuSema, type IranytuAllapotSema, type IranytuVerzioSema, type HibaKod } from "@km/contracts";
import { iranytuTar } from "./tar";

export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: HibaKod; mezok?: Record<string, string> };

/** A szervezet iránytű-állapota: tervezet, jóváhagyott, ki és mikor hagyta jóvá. */
export async function iranytuAllapot(szervezetId: string): Promise<IranytuAllapotSema> {
  const sor = await iranytuTar.betolt(szervezetId);
  if (!sor) return { tervezet: null, jovahagyott: null, jovahagyva: null, jovahagyta_nev: "", verzio: 0, van_tervezet: false };
  return {
    tervezet: sor.tervezet,
    jovahagyott: sor.jovahagyott,
    jovahagyva: sor.jovahagyva === null ? null : sor.jovahagyva.toISOString(),
    jovahagyta_nev: sor.jovahagytaNev,
    verzio: sor.verzio,
    van_tervezet: sor.tervezet !== null,
  };
}

/** A korábbi jóváhagyott változatok (a legutóbbi elöl). */
export function iranytuVerziok(szervezetId: string): Promise<IranytuVerzioSema[]> {
  return iranytuTar.verziokLista(szervezetId);
}

/** A tervezet mentése — a szerkesztő is mentheti. */
export async function iranytuTervezetMent(szervezetId: string, be: unknown): Promise<Eredmeny<IranytuAllapotSema>> {
  const e = IranytuSema.safeParse(be);
  if (!e.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: mezokbol(e.error.issues) };
  await iranytuTar.tervezetMent(szervezetId, e.data);
  return { ok: true, ertek: await iranytuAllapot(szervezetId) };
}

/** Jóváhagyás — csak a tulajdonos (a végpont őrzi). Új verziót hoz létre. */
export async function iranytuJovahagy(szervezetId: string, be: unknown, fiokId: string, fiokNev: string): Promise<Eredmeny<IranytuAllapotSema>> {
  const e = IranytuSema.safeParse(be);
  if (!e.success) return { ok: false, hiba: "ERVENYTELEN_ADAT", mezok: mezokbol(e.error.issues) };
  await iranytuTar.jovahagy(szervezetId, e.data, fiokId, fiokNev);
  return { ok: true, ertek: await iranytuAllapot(szervezetId) };
}

/** Egy korábbi verzió visszaállítása TERVEZETKÉNT — a jóváhagyott változatlan marad. */
export async function iranytuVisszaallit(szervezetId: string, verzio: number): Promise<Eredmeny<IranytuAllapotSema>> {
  const verziok = await iranytuTar.verziokLista(szervezetId);
  const valasztott = verziok.find((v) => v.verzio === verzio);
  if (!valasztott) return { ok: false, hiba: "NINCS_ILYEN_VERZIO" };
  await iranytuTar.tervezetMent(szervezetId, valasztott.adatok);
  return { ok: true, ertek: await iranytuAllapot(szervezetId) };
}

/** A jóváhagyott iránytű, vagy null. Ezt kapja majd az összhangvizsgálat (Vilmos döntése: a TELJES jóváhagyott iránytű). */
export async function iranytuJovahagyott(szervezetId: string): Promise<IranytuSema | null> {
  const sor = await iranytuTar.betolt(szervezetId);
  return sor ? sor.jovahagyott : null;
}

function mezokbol(issues: { path: PropertyKey[]; code: string }[]): Record<string, string> {
  const mezok: Record<string, string> = {};
  for (const p of issues) { const ut = p.path.join("."); if (ut && !mezok[ut]) mezok[ut] = p.code; }
  return mezok;
}
