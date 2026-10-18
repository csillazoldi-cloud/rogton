// B-01: a közös kapu innen is elérhető, hogy az útvonalak EGY helyről kérjék a jogellenőrzést.
export { kapu, type Szint } from "../_kapu";
import type { HibaValasz } from "@rogton/contracts";
import type { FiokNezet } from "@rogton/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../hitelesites/suti";
import type { FeliratEredmeny } from "../../../szovegek";

export function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

export function valasz(torzs: unknown, status = 200): Response {
  return Response.json(torzs, { status, headers: { "cache-control": "no-store" } });
}

export async function belepettSzervezet(keres: Request): Promise<{ fiok: FiokNezet; szervezet: { id: string; nev: string } } | Response> {
  const fiok = await aktualisFiok(munkamenetTokenKeresbol(keres));
  if (!fiok) return hiba({ hiba: "NINCS_BELEPVE" }, 401);
  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) return hiba({ hiba: "NINCS_JOG" }, 409);
  return { fiok, szervezet };
}

export function tulajdonos(fiok: FiokNezet, szervezetId: string): boolean {
  return fiok.szervezetek.find(sz => sz.id === szervezetId)?.szerep === "tulajdonos";
}

export async function rendszergazda(keres: Request): Promise<FiokNezet | Response> {
  const fiok = await aktualisFiok(munkamenetTokenKeresbol(keres));
  if (!fiok) return hiba({ hiba: "NINCS_BELEPVE" }, 401);
  if (!fiok.rendszergazda) return hiba({ hiba: "NINCS_JOG" }, 403);
  return fiok;
}

export function eredmenyValasz<T>(e: FeliratEredmeny<T>): Response {
  if (e.ok) return valasz({ feliratok: e.ertek });
  switch (e.hiba) {
    case "ERVENYTELEN_ADAT":
      return valasz({ hiba: e.hiba, felirat_hibak: e.felirat_hibak ?? [], figyelmen_kivul: e.figyelmen_kivul ?? [] }, 400);
    case "NINCS_TERVEZET":
      return hiba({ hiba: e.hiba }, 409);
    case "NINCS_ILYEN_VERZIO":
      return hiba({ hiba: e.hiba }, 404);
    case "NINCS_JOG":
      return hiba({ hiba: e.hiba }, 403);
    default:
      return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
