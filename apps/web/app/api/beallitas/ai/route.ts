import { eq } from "drizzle-orm";
import { z } from "zod";
import { kapu } from "../../_kapu";
import { hiba, valasz } from "../../tema/_kozos";
import { sema, szervezetKent } from "../../../../adatbazis/kapcsolat";
import { esemenyKornyezet, feljegyezHatterben } from "../../../../esemeny";

export const dynamic = "force-dynamic";

const KapcsoloBe = z.object({ engedelyezve: z.boolean() });

/** F-5 (R-4): a szervezet AI-kapcsolója. GET bármely tagnak; PUT a tulajdonosnak. Kikapcsolva egyetlen AI-hívás sem indul a szervezet nevében. */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const sor = await szervezetKent(ktx.szervezet.id, async (tx) =>
      (await tx.select({ be: sema.szervezet.aiEngedelyezve }).from(sema.szervezet).where(eq(sema.szervezet.id, ktx.szervezet.id)).limit(1))[0]);
    return valasz({ beallitas: { ai_engedelyezve: sor?.be ?? true } });
  } catch (h) {
    console.error("AI kapcsolo GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}

export async function PUT(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tulajdonos");
    if (ktx instanceof Response) return ktx;
    const p = KapcsoloBe.safeParse(await keres.json().catch(() => null));
    if (!p.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    await szervezetKent(ktx.szervezet.id, async (tx) => {
      await tx.update(sema.szervezet).set({ aiEngedelyezve: p.data.engedelyezve }).where(eq(sema.szervezet.id, ktx.szervezet.id));
    });
    await feljegyezHatterben(await esemenyKornyezet(), { szervezet_id: ktx.szervezet.id, fajta: "ai_kapcsolo_valtozott", fiok_id: ktx.fiok.id, adat: { engedelyezve: p.data.engedelyezve } });
    return valasz({ beallitas: { ai_engedelyezve: p.data.engedelyezve } });
  } catch (h) {
    console.error("AI kapcsolo PUT hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
