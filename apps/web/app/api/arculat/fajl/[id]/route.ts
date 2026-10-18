import { kapu } from "../../../_kapu";
import { hiba } from "../../../tema/_kozos";
import { fajlKornyezet } from "../../../../../fajl";
import { szerepFordit } from "../../../../../hozzaferes";
import { MIME, fajlFolyam } from "@km/fajl-core";

export const dynamic = "force-dynamic";

export async function GET(
  keres: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const ktx = await kapu(keres, "tag");
    if (ktx instanceof Response) return ktx;

    const { id } = await ctx.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return hiba({ hiba: "NINCS_ILYEN_FAJL" }, 404); // nem uuid: nincs ilyen (az adatbázis-hiba helyett)

    const k = fajlKornyezet();
    const e = await fajlFolyam(k, {
      fiok_id: ktx.fiok.id,
      szervezet_id: ktx.szervezet.id,
      szerep: szerepFordit(ktx.szerep),
    }, id);

    if (!e.ok) {
      const http = e.hiba === "NINCS_JOG" ? 403 : e.hiba === "NINCS_ILYEN_FAJL" ? 404 : 400;
      return hiba({ hiba: e.hiba }, http);
    }

    const { meta, folyam } = e.ertek;
    // A fájlnév a fejlécben: ASCII-tartalék + RFC 5987 `filename*` (UTF-8). Javítás (R-16 K6 közben mérve, 2026-09-30): a nyers név a
    // fejlécben a Latin-1-en kívüli betűnél (ő, ű, ș, ț …) „Cannot convert argument to a ByteString” hibát dobott → 500, és a fájl
    // (pl. „Kövesi Térkő logó.png”) előnézete üres maradt. A kép maga nem érintett (az a fájltárból olvas, nem ezen az úton).
    const ascii = meta.nev.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    const fejlec: Record<string, string> = {
      "content-type": MIME[meta.tipus],
      "content-disposition": `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(meta.nev)}`,
      "cache-control": "private, max-age=0",
      "content-length": String(meta.meret),
    };
    // R-16 K6 (TERV 1.6): a gép-írta névlogó SVG-je — önálló megnyitásnál se futhasson benne semmi, és a böngésző ne találgasson típust
    if (meta.tipus === "svg") {
      fejlec["content-security-policy"] = "default-src 'none'; style-src 'unsafe-inline'";
      fejlec["x-content-type-options"] = "nosniff";
    }
    // Csilla 2026-10-10 (100 MB): a tartalom folyamként megy ki a lemezről — a 100 MB-os PDF sem kerül egészben a memóriába
    return new Response(folyam, { status: 200, headers: fejlec });
  } catch (h) {
    console.error("Arculat fajl [id] GET hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
