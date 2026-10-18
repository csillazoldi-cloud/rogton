import { kapu } from "../../_kapu";
import { cegKutatas, honlapSzineiLetolt } from "../../../../onboarding/kutatas";

export const dynamic = "force-dynamic";

// 2026-09-28 — a cég netes kutatása és a honlap színei (az első beállítás „Ezt találtuk rólad” lépéséhez; a képernyő a
// Design rajzára vár: DESIGN-KERES-R15-02-KUTATAS-SZINEK.md). Be: { nev, leiras, varos? }. Ki: { kutatas, szinek } — bármelyik lehet null.
export async function POST(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const be = (await keres.json().catch(() => null)) as { nev?: unknown; leiras?: unknown; varos?: unknown } | null;
    const nev = typeof be?.nev === "string" ? be.nev.trim().slice(0, 120) : "";
    const leiras = typeof be?.leiras === "string" ? be.leiras.trim().slice(0, 600) : "";
    const varos = typeof be?.varos === "string" ? be.varos.trim().slice(0, 80) : "";
    if (!nev) return Response.json({ hiba: "ERVENYTELEN_ADAT", mezok: { nev: "ures" } }, { status: 400 });
    const kutatas = await cegKutatas(e.szervezet.id, { nev, leiras, nyelv: "hu", ...(varos ? { varos } : {}) }, e.fiok.id);
    const szinek = kutatas?.honlap && kutatas.bizonyossag !== "alacsony" ? await honlapSzineiLetolt(kutatas.honlap) : null;
    return Response.json({ kutatas, szinek }, { headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("Kutatás POST hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
