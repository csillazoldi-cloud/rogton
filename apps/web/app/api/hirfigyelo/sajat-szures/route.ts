// R-13 (2026-09-22, Vilmos): a saját hírszűrésem — fokozat és előszűrés. Minden tag a SAJÁT fiókjára állítja.
import { z } from "zod";
import { SzuresFokozat } from "@km/news-monitor-core";
import { hiba, kapu, valasz } from "../_kozos";
import { tagSzures, tagSzuresMent } from "../../../../hirfigyelo/tag-szures";

export const dynamic = "force-dynamic";

const Bemenet = z.object({ fokozat: SzuresFokozat, eloszures: z.boolean() });

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const sz = await tagSzures(e.szervezet.id, e.fiok.id);
    return valasz({ szures: { fokozat: sz.fokozat, eloszures: sz.eloszures } });
  } catch (h) {
    console.error("Sajat szures GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tag");
    if (e instanceof Response) return e;
    const be = Bemenet.safeParse(await keres.json().catch(() => null));
    if (!be.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    const sz = await tagSzuresMent(e.szervezet.id, e.fiok.id, be.data);
    return valasz({ szures: { fokozat: sz.fokozat, eloszures: sz.eloszures } });
  } catch (h) {
    console.error("Sajat szures PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
