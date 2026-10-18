import "server-only";
import { PosztFelulet, PosztNyelv, type HibaValasz } from "@rogton/contracts";
import { PosztHiba, type PosztKeres } from "../../../poszt";

// R-11/A2c: a Posztszöveg végpontjainak közös darabjai — hibafordítás, cellacím, kérés-törzs.

export function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

export function valasz(adat: unknown): Response {
  return Response.json(adat, { headers: { "cache-control": "no-store" } });
}

/** A gépezet hibái egységes válaszokká. Ami nem PosztHiba, az belső hiba. */
export function posztHibaValasz(h: unknown, hol: string): Response {
  if (h instanceof PosztHiba) {
    switch (h.kod) {
      case "AI_NEM_ELERHETO":
        return hiba({ hiba: "AI_NEM_ELERHETO" }, 502);
      case "AI_KERET_KIMERULT":
        return hiba({ hiba: "AI_KERET_KIMERULT" }, 429);
      case "AI_KIKAPCSOLVA":
        return hiba({ hiba: "AI_KIKAPCSOLVA" }, 409);
      case "ERVENYTELEN_ADAT":
        return hiba({ hiba: "ERVENYTELEN_ADAT", mezok: h.mezok ?? {} }, 400);
      case "NINCS_ILYEN_TALALAT":
        return hiba({ hiba: "NINCS_ILYEN_TALALAT" }, 404);
    }
  }
  console.error(`Poszt ${hol} hiba:`, h instanceof Error ? h.message : h);
  return hiba({ hiba: "BELSO_HIBA" }, 500);
}

/** A kezelő felületének nyelve — ezen a nyelven szól az utasítás az AI-nak. */
export function uiNyelv(keres: Request): string {
  return keres.headers.get("accept-language")?.split(",")[0]?.trim().slice(0, 5) || "hu";
}

export async function torzset(keres: Request): Promise<Record<string, unknown>> {
  const be = await keres.json().catch(() => null);
  return (be ?? {}) as Record<string, unknown>;
}

/** Egy cella címe a kérés törzséből: melyik felület, melyik nyelv. */
export function cellaCim(
  keres: Request,
  szervezetId: string,
  id: string,
  torzs: Record<string, unknown>,
  fiokId?: string, // R-13: a kérő — az AI-munka az ő kreditjéből megy
): PosztKeres | Response {
  const feluletE = PosztFelulet.safeParse(torzs["felulet"]);
  if (!feluletE.success) return hiba({ hiba: "ERVENYTELEN_ADAT", mezok: { felulet: "ervenytelen" } }, 400);
  const nyelvE = PosztNyelv.safeParse(torzs["nyelv"]);
  if (!nyelvE.success) return hiba({ hiba: "ERVENYTELEN_ADAT", mezok: { nyelv: "ervenytelen" } }, 400);
  return { szervezetId, id, felulet: feluletE.data, nyelv: nyelvE.data, uiNyelv: uiNyelv(keres), ...(fiokId ? { fiokId } : {}) };
}
