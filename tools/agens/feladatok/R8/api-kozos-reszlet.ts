// B-01: a közös kapu innen is elérhető, hogy az útvonalak EGY helyről kérjék a jogellenőrzést.
export { type Szint } from "../_kapu";
import { kapu as alapKapu } from "../_kapu";
import { modulEngedelyezve } from "../../../csomag";
import type { HibaValasz } from "@km/contracts";
import type { FiokNezet } from "@km/contracts";
import type { Hiba } from "@km/news-monitor-core";
import { aktualisFiok, aktualisSzervezet } from "../../../hitelesites";
import { munkamenetTokenKeresbol } from "../../../hitelesites/suti";

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
  if (!(await modulEngedelyezve(szervezet.id, "hirfigyelo"))) return hiba({ hiba: "MODUL_NEM_ELERHETO" }, 403);
  return { fiok, szervezet };
}

/** F-7a (D-F35): a hírfigyelő minden végpontja EZEN a kapun jön be — a jog után a munkatér csomagját is nézi: a modul nincs benne → 403 MODUL_NEM_ELERHETO. */
type SzervezetiSzint = "tag" | "szerkeszto" | "tulajdonos";
export async function kapu(keres: Request, szint: SzervezetiSzint) {
