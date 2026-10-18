import "server-only";
import type { FiokNezet, HibaValasz } from "@km/contracts";
import { aktualisFiok, aktualisSzervezet } from "../../hitelesites";
import { munkamenetTokenKeresbol } from "../../hitelesites/suti";

// B-01 (biztonsági felülvizsgálat, 3. lépés, 2026-09-11): EGY kapu minden módosító végponton.
//
// MIÉRT KELLETT. A jogellenőrzés négyféle alakban élt a kódban — volt, ahol csak belépést nézett,
// volt, ahol a szervezetet is, és volt, ahol a SZEREPET is. Mérve a mátrix-próbával (a javítás
// ELŐTT): a `nezo` szerep az API-t közvetlenül hívva átírhatta a figyelési beállítást, forrást
// adhatott hozzá, találatot jelölhetett, visszajelzést adhatott, AI-tartalomötletet kérhetett
// (ez pénzbe kerül), és a szervezet teljes onboardingját jóváhagyhatta. A felületen ezek a gombok
// nem látszottak neki — a FELÜLET volt a zár, nem a kiszolgáló.
//
// A HAT SZINT. Nem rangsor: a `rendszergazda` külön jog, nem a tulajdonos „fölötte" van.
//
//   nyilvanos     belépés nélkül is hívható (belépés, regisztráció, kilépés, jelszó-visszaállítás,
//                 nyelvváltás — ez utóbbi a belépőlapon is kell)
//   belepett      belépett fiók; szervezet nem kell (szervezet létrehozása)
//   tag           a szervezet bármely tagja, nézőt is beleértve (pl. „megnéztem" jelölés)
//   szerkeszto    szerkesztő vagy tulajdonos (mindaz, ami a szervezet munkáját változtatja)
//   tulajdonos    csak a szervezet tulajdonosa (a szervezet arculata, témája, feliratai)
//   rendszergazda a rendszergazda-jelölés kell hozzá (a KÖZÖS alap, a keretek, a fiókok)
//
// A VÁLASZOK, egységesen:
//   401 NINCS_BELEPVE     nincs érvényes munkamenet
//   403 NINCS_JOG         van belépés, de a szerep kevés
//   409 NINCS_SZERVEZET   belépett, de még egyetlen szervezetnek sem tagja — ez nem tiltás,
//                         hanem hiányzó lépés; a felület ebből tudja, hogy szervezetet kell nyitni
//
// A felfüggesztett fiókot nem itt szűrjük: az `aktualisFiok()` már nem ad vissza fiókot rá (E-50).

export type Szint = "nyilvanos" | "belepett" | "tag" | "szerkeszto" | "tulajdonos" | "rendszergazda";
export type Szerep = "tulajdonos" | "szerkeszto" | "nezo";

export type BelepoNyilvanos = { fiok: FiokNezet | null; szervezet: null; szerep: null };
export type BelepoFiok = { fiok: FiokNezet; szervezet: { id: string; nev: string } | null; szerep: Szerep | null };
export type BelepoSzervezet = { fiok: FiokNezet; szervezet: { id: string; nev: string }; szerep: Szerep };

/** A szerepek ereje. A `rendszergazda` NINCS benne: az külön jog, nem a sor vége. */
const ERO: Record<Szerep, number> = { nezo: 1, szerkeszto: 2, tulajdonos: 3 };
const SZUKSEGES: Record<"tag" | "szerkeszto" | "tulajdonos", number> = { tag: 1, szerkeszto: 2, tulajdonos: 3 };

export function kapuHiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

export async function kapu(keres: Request, szint: "nyilvanos"): Promise<BelepoNyilvanos>;
export async function kapu(keres: Request, szint: "belepett" | "rendszergazda"): Promise<BelepoFiok | Response>;
export async function kapu(keres: Request, szint: "tag" | "szerkeszto" | "tulajdonos"): Promise<BelepoSzervezet | Response>;
export async function kapu(
  keres: Request,
  szint: Szint,
): Promise<BelepoNyilvanos | BelepoFiok | BelepoSzervezet | Response> {
  const fiok = await aktualisFiok(munkamenetTokenKeresbol(keres));

  if (szint === "nyilvanos") {
    return { fiok, szervezet: null, szerep: null };
  }

  if (!fiok) return kapuHiba({ hiba: "NINCS_BELEPVE" }, 401);

  if (szint === "rendszergazda") {
    if (!fiok.rendszergazda) return kapuHiba({ hiba: "NINCS_JOG" }, 403);
    // A rendszergazda-lapok a HOST adatát kezelik, nem egy szervezetét — szervezet nem feltétel.
    const sz = aktualisSzervezet(fiok);
    return { fiok, szervezet: sz, szerep: sz ? szerepe(fiok, sz.id) : null };
  }

  if (szint === "belepett") {
    const sz = aktualisSzervezet(fiok);
    return { fiok, szervezet: sz, szerep: sz ? szerepe(fiok, sz.id) : null };
  }

  const szervezet = aktualisSzervezet(fiok);
  if (!szervezet) return kapuHiba({ hiba: "NINCS_SZERVEZET" }, 409);
  const szerep = szerepe(fiok, szervezet.id);
  if (!szerep) return kapuHiba({ hiba: "NINCS_JOG" }, 403);
  if (ERO[szerep] < SZUKSEGES[szint]) return kapuHiba({ hiba: "NINCS_JOG" }, 403);
  return { fiok, szervezet, szerep };
}

function szerepe(fiok: FiokNezet, szervezetId: string): Szerep | null {
  const t = fiok.szervezetek.find((sz) => sz.id === szervezetId);
  return t ? (t.szerep as Szerep) : null;
}
