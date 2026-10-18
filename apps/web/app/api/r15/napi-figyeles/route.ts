import { kapu } from "../../_kapu";
import { napiFigyelesBe, napiFigyelesKi } from "../../../../r15";

export const dynamic = "force-dynamic";

// R-15 · 03 Kezdőlap „Napi hírfigyelés · Bekapcsolom” — az aktív hírbeállítás napi időzítésre vált (gepezet 7).
export async function PUT(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const ok = await napiFigyelesBe(e.szervezet.id, e.fiok.id, e.szerep);
    return Response.json(ok ? { ok: true } : { hiba: "NINCS_AKTIV_BEALLITAS" }, { status: ok ? 200 : 409, headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("R15 napi-figyeles hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}

// R-15 · 06 Mit figyeljünk › Részletek „Reggeli hírek kikapcsolása” (gepezet-3 3.9, kerdesek-3 3 — Csilla 10-01: jóváhagyva).
// Ugyanaz a végpont és ugyanaz a jog („szerkeszto”), mint a bekapcsolásé; az aktív beállítás kézi időzítésre vált.
// 200 { ok: true } · 409 NINCS_AKTIV_BEALLITAS · 401/403 a közös kapuból.
export async function DELETE(keres: Request): Promise<Response> {
  try {
    const e = await kapu(keres, "szerkeszto");
    if (e instanceof Response) return e;
    const ok = await napiFigyelesKi(e.szervezet.id, e.fiok.id, e.szerep);
    return Response.json(ok ? { ok: true } : { hiba: "NINCS_AKTIV_BEALLITAS" }, { status: ok ? 200 : 409, headers: { "cache-control": "no-store" } });
  } catch (h) {
    console.error("R15 napi-figyeles (ki) hiba:", h);
    return Response.json({ hiba: "BELSO_HIBA" }, { status: 500 });
  }
}
