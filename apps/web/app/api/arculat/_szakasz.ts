import "server-only";
// R-16 K3 (TERV §2-K3 API) — a három szakasz-végpont közös válasza. A kapu mindháromnál „szerkeszto” (a néző 403 NINCS_JOG);
// a mentés az `arculatMent` egy tranzakciója (apps/web/arculat/ment.ts), ezért 409 ELAVULT_ADAT itt nem keletkezik.
import type { MentEredmeny } from "../../../arculat/ment";

const FEJ = { "cache-control": "no-store" };

export function szakaszValasz(e: MentEredmeny): Response {
  if (e.ok) return Response.json({ arculat: e.arculat }, { headers: FEJ });
  // nincs jóváhagyott profil (az onboarding még hátravan): nincs mit jóváhagyni — ugyanaz a kód, mint az onboarding jóváhagyásánál
  if (e.hiba === "NINCS_PROFIL") return Response.json({ hiba: "NINCS_PISZKOZAT" }, { status: 409, headers: FEJ });
  return Response.json({ hiba: "ERVENYTELEN_ADAT" }, { status: 400, headers: FEJ });
}

export function belsoHiba(hol: string, h: unknown): Response {
  console.error(`Arculat ${hol} hiba:`, h);
  return Response.json({ hiba: "BELSO_HIBA" }, { status: 500, headers: FEJ });
}
