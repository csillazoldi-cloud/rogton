import { kapu } from "../../../_kapu";
import { listatOlvas } from "../../../../../onboarding/kinalat";

export const dynamic = "force-dynamic";

// R-18 7. kör · 2. lépés: az étlap / árlista egy linkről ({link}) vagy feltöltött fájlokból ({fajlok: [id…]}) → {sorok}.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = (await keres.json().catch(() => null)) as { link?: unknown; fajlok?: unknown } | null;
    const link = typeof be?.link === "string" ? be.link.trim().slice(0, 500) : "";
    const fajlok = Array.isArray(be?.fajlok) ? (be!.fajlok as unknown[]).filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 6) : [];
    if (!link && fajlok.length === 0) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: { forras: "ures" } }, { status: 400 });
    const sorok = await listatOlvas({ szervezetId: e.szervezet.id, fiokId: e.fiok.id }, fajlok.length ? { fajlok } : { link });
    if (!sorok) return Response.json({ hiba: "NINCS_PROFIL" }, { status: 409 });
    return Response.json({ sorok }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Lista olvasás hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
