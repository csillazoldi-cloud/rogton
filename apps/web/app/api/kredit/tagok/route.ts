// R-13 (2026-09-22): a munkatér kreditje és a tagoké — csak a tulajdonos látja.
import { inArray } from "drizzle-orm";
import { kapu } from "../../_kapu";
import { db, sema, szervezetKent } from "../../../../adatbazis/kapcsolat";
import { kreditAllapot } from "../../../../kredit";
import { egyenleg, hiba, kr, valasz } from "../_kozos";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "tulajdonos");
    if (e instanceof Response) return e;
    const a = await kreditAllapot(e.szervezet.id);
    const idk = a.tagok.map((t) => t.fiok_id);
    const nevek = idk.length > 0 ? await db().select({ id: sema.fiok.id, nev: sema.fiok.nev }).from(sema.fiok).where(inArray(sema.fiok.id, idk)) : [];
    const szerepek = await szervezetKent(e.szervezet.id, (tx) => tx.select({ fiokId: sema.tagsag.fiokId, szerep: sema.tagsag.szerep }).from(sema.tagsag));
    return valasz({
      kredit: {
        honap: a.honap,
        munkater: { havi: a.munkater.havi, felhasznalt: kr(a.munkater.felhasznalt), kiosztott: kr(a.munkater.kiosztott), kiosztatlan: kr(Math.max(0, a.munkater.keret - a.munkater.kiosztott)) },
        tagok: a.tagok.map((t) => ({
          fiok_id: t.fiok_id,
          nev: nevek.find((n) => n.id === t.fiok_id)?.nev ?? "",
          szerep: szerepek.find((s) => s.fiokId === t.fiok_id)?.szerep ?? "nezo",
          kulon: t.kulon,
          ...egyenleg(t.keret, t.felhasznalt),
        })),
      },
    });
  } catch (h) {
    console.error("Kredit tagok GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
