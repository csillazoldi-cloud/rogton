// E-50: a Fiókok lap — lekérdezés és a négy veszélyes művelet. CSAK rendszergazdának.
//
// A jogellenőrzés MINDEN belépési ponton itt van, nem a felületen: az útvonalat felület nélkül,
// puszta HTTP-kéréssel is meg lehet hívni. A műveleteket a modul is védi (az utolsó rendszergazda
// nem veheti el a saját jelölését) — két zár, nem egy.
import { z } from "zod";
import type { HibaValasz } from "@km/contracts";
import { kapu } from "../_kapu";
import {
  felfuggeszt,
  felfuggesztestVisszavon,
  honapVagyMost,
  jelolestAd,
  jelolestElvesz,
  nezet,
  torol,
} from "../../../fiokok";

export const dynamic = "force-dynamic";

function hiba(h: HibaValasz, status: number): Response {
  return Response.json(h, { status, headers: { "cache-control": "no-store" } });
}

function valasz(torzs: unknown, status = 200): Response {
  return Response.json(torzs, { status, headers: { "cache-control": "no-store" } });
}

/** Belépett rendszergazda, vagy kész válasz a hívónak. B-01 óta a KÖZÖS kapun át. */
async function gazda(keres: Request): Promise<{ id: string } | Response> {
  const e = await kapu(keres, "rendszergazda");
  if (e instanceof Response) return e;
  return { id: e.fiok.id };
}

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await gazda(keres);
    if (e instanceof Response) return e;
    const honap = honapVagyMost(new URL(keres.url).searchParams.get("honap"));
    return valasz({ fiokok: await nezet(e.id, honap) });
  } catch (h) {
    console.error("Fiokok GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

const muveletSchema = z.object({
  fiok_id: z.string().uuid(),
  muvelet: z.enum(["felfuggeszt", "visszavon", "jelolest_ad", "jelolest_elvesz", "torol"]),
  // A törléshez a fiók e-mail-címét be kell írni — elgépelés ellen, a kiszolgálón ellenőrizve.
  megerosites: z.string().trim().max(200).optional(),
});

export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await gazda(keres);
    if (e instanceof Response) return e;
    const be = await keres.json().catch(() => null);
    const ell = muveletSchema.safeParse(be);
    if (!ell.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const { fiok_id, muvelet, megerosites } = ell.data;

    const eredmeny =
      muvelet === "felfuggeszt" ? await felfuggeszt(fiok_id, e.id)
      : muvelet === "visszavon" ? await felfuggesztestVisszavon(fiok_id)
      : muvelet === "jelolest_ad" ? await jelolestAd(fiok_id)
      : muvelet === "jelolest_elvesz" ? await jelolestElvesz(fiok_id)
      : await torol(fiok_id, e.id, megerosites ?? "");

    if (!eredmeny.ok) {
      const status =
        eredmeny.hiba === "NINCS_ILYEN_FIOK" ? 404
        : eredmeny.hiba === "ONKIZARAS" || eredmeny.hiba === "MAGAT_NEM" || eredmeny.hiba === "UTOLSO_TULAJDONOS" ? 409
        : 400;
      return hiba({ hiba: eredmeny.hiba }, status);
    }
    // A frissített lista rögtön visszamegy: a felület ne találgassa, mi lett a művelet eredménye.
    const honap = honapVagyMost(null);
    return valasz({ fiokok: await nezet(e.id, honap) });
  } catch (h) {
    console.error("Fiokok POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
