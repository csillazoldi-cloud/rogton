// B-01: a közös kapu innen is elérhető, hogy az útvonalak EGY helyről kérjék a jogellenőrzést.
export { type Szint } from "../_kapu";
import { kapu as alapKapu } from "../_kapu";
import { modulEngedelyezve } from "../../../csomag";
import type { HibaValasz } from "@rogton/contracts";
import type { FiokNezet } from "@rogton/contracts";
import type { Hiba } from "@rogton/news-monitor-core";
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
  const e = await alapKapu(keres, szint);
  if (e instanceof Response) return e;
  if (!(await modulEngedelyezve(e.szervezet.id, "hirfigyelo"))) return hiba({ hiba: "MODUL_NEM_ELERHETO" }, 403);
  return e;
}

/** A mag Hiba-típusának válasszá alakítása a HTTP-státuszokkal. */
export function eredmenyValasz<T>(e: { ok: true } & T | Hiba): Response {
  if (e.ok) { const { ok: _ok, ...adat } = e; return valasz({ hirfigyelo: adat }); } // az `ok` nem része a válasznak (mint a téma API-nál)
  switch (e.hiba) {
    case "NINCS_JOG":
      return hiba({ hiba: e.hiba }, 403);
    case "NINCS_BEALLITAS":
    case "FUT_MAR":
    case "MINTA_LEJART":
      return hiba({ hiba: e.hiba }, 409);
    case "ERVENYTELEN_ADAT":
      return valasz({ hiba: e.hiba, hibak: e.reszlet }, 400);
    case "NINCS_ILYEN_VERZIO":
    case "NINCS_ILYEN_JAVASLAT":
    case "NINCS_ILYEN_TALALAT":
      return hiba({ hiba: e.hiba }, 404);
    case "AI_KERET_KIMERULT":
      return hiba({ hiba: e.hiba }, 429); // D-12: a keret elfogyása érthetően látszik
    case "AI_NEM_ELERHETO":
    case "AI_ROSSZ_VALASZ":
      return hiba({ hiba: e.hiba }, 502);
    default:
      return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
