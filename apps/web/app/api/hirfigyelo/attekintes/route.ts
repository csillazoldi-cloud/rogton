import { attekintes } from "@rogton/news-monitor-core";
import { eq } from "drizzle-orm";
import { belepettSzervezet, eredmenyValasz, hiba, kapu, valasz } from "../_kozos";
import { hostKontextus, kornyezet } from "../../../../hirfigyelo";
import { szervezetAktivSora } from "../../../../hirfigyelo/sor";
import { sema, szervezetKent } from "../../../../adatbazis/kapcsolat";

export const dynamic = "force-dynamic";

export async function GET(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "tag");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);
    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id); // R-13: a néző szűrő-beállításával
    const e = await attekintes(k, ktx);
    if (!e.ok) return eredmenyValasz(e);
    const sorban = await szervezetAktivSora(eredmeny.szervezet.id);
    const sor = await szervezetKent(eredmeny.szervezet.id, async (tx) =>
      (
        await tx
          .select({ be: sema.szervezet.aiEngedelyezve })
          .from(sema.szervezet)
          .where(eq(sema.szervezet.id, eredmeny.szervezet.id))
          .limit(1)
      )[0],
    );
    const ai_engedelyezve = sor?.be ?? true;
    const { ok: _ok, ...adat } = e;
    return valasz({ hirfigyelo: { ...adat, sorban, ai_engedelyezve } });
  } catch (h) {
    console.error("Hirfigyelo attekintes GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
