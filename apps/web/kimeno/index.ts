import "server-only";
import type { FiokNezet } from "@km/contracts";
import { esemenyKornyezet, ertesitesLekerdez } from "../esemeny";
import { KIMENO_CSOPORTOK, RENDSZERSZINTU_FAJTAK } from "./tipusok";
import type { KimenoNezet } from "./tipusok";

export * from "./tipusok";

export async function kimenoNezet(
  fiok: FiokNezet,
  szervezetId: string,
  szerep: "tulajdonos" | "szerkeszto" | "nezo",
): Promise<KimenoNezet | null> {
  const nezet: KimenoNezet["nezet"] | null = fiok.rendszergazda
    ? "rendszergazda"
    : szerep === "tulajdonos"
      ? "tulajdonos"
      : null;
  if (nezet === null) return null;

  const bekotve = Boolean(process.env["ERTESITES_WEBHOOK_URL"]?.trim());

  const e = await ertesitesLekerdez(await esemenyKornyezet(), {
    fiok_id: fiok.id,
    szervezet_id: szervezetId,
    szerep,
  });
  if (!e.ok) throw new Error(e.hiba);

  const csoportok = KIMENO_CSOPORTOK.map((cs) => ({
    kod: cs.kod,
    fajtak:
      nezet === "tulajdonos"
        ? cs.fajtak.filter((f) => !RENDSZERSZINTU_FAJTAK.includes(f))
        : [...cs.fajtak],
  }));

  return {
    nezet,
    bekotve,
    kozos: e.ertek.kozos,
    szervezeti: e.ertek.szervezeti,
    hatasos: e.ertek.hatasos,
    csoportok,
  };
}
