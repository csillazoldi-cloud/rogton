import { kapu } from "../../_kapu";
import { hiba } from "../../tema/_kozos";
import { ALBUM_FOTO_MAX, albumZip } from "../../../../album";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * c30 F9 (TERV §6 „Output and download”): a kiválasztott fotók egy ZIP-ben, a kért sorrendben (`?fotok=<id>,<id>,…`, ≤ 40).
 * Belépés kell, és csak a munkatér saját albumfotói (bármely tag, a néző is letöltheti — olvasás). Nyilvános link nincs.
 */
export async function GET(keres: Request): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;
    const idk = (new URL(keres.url).searchParams.get("fotok") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (idk.length === 0 || idk.length > ALBUM_FOTO_MAX || !idk.every((id) => UUID.test(id)) || new Set(idk).size !== idk.length) {
      return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);
    }
    const z = await albumZip(ktx.szervezet.id, idk);
    if (!z.ok) return hiba({ hiba: z.hiba }, 404);
    const nap = new Date().toISOString().slice(0, 10);
    return new Response(z.folyam, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="album-${nap}.zip"`,
        "content-length": String(z.meret),
        "cache-control": "private, no-store",
      },
    });
  } catch (h) {
    console.error("Album zip GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
