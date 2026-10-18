"use client";
import { ArculatTervezet } from "@rogton/contracts";
import { hivas } from "../../_kozos/kliens";

/** Arculati tervezet kérése az 1. lépés forrásaiból (v6 seedStep2 → brand draft). Hibánál null: az arculat marad „nincs”. */
export async function arculatotKer(): Promise<ArculatTervezet | null> {
  const r = await hivas("/api/onboarding/arculat", "POST");
  if (r.statusz !== 200) return null;
  const e = ArculatTervezet.safeParse(r.torzs["tervezet"]);
  return e.success ? e.data : null;
}
