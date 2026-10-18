import { kapu } from "../../../_kapu";
import { kinalatMent } from "../../../../../profil";
import { szokasokatOlvas } from "../../../../../onboarding/kinalat";

export const dynamic = "force-dynamic";

// R-18 7. kör · 4. lépés: {kozossegi_oldal, kepernyokepek: [id…]} — mentés, és a képernyőképekből a posztolási szokások (ha van kép).
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = (await keres.json().catch(() => null)) as { kozossegi_oldal?: unknown; kepernyokepek?: unknown } | null;
    const kozossegi_oldal = typeof be?.kozossegi_oldal === "string" ? be.kozossegi_oldal.trim().slice(0, 300) : "";
    const kepernyokepek = Array.isArray(be?.kepernyokepek) ? (be!.kepernyokepek as unknown[]).filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 5) : [];
    const h = { szervezetId: e.szervezet.id, fiokId: e.fiok.id };
    const elso = await kinalatMent(h.szervezetId, { kozossegi_oldal, kepernyokepek });
    if (!elso.ok) return Response.json({ hiba: elso.hiba === "NINCS_JOG" ? "NINCS_PROFIL" : elso.hiba }, { status: elso.hiba === "NINCS_JOG" ? 409 : 400 });
    const poszt_szokasok = await szokasokatOlvas(h, { kozossegi_oldal, kepernyokepek });
    if (poszt_szokasok) await kinalatMent(h.szervezetId, { poszt_szokasok });
    return Response.json({ kozossegi_oldal, poszt_szokasok }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Oldal mentés hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
