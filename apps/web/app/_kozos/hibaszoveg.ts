// A kiszolgáló hibakódot ad; a szöveg a feliratokból jön (hiba.<KÓD>, tartalék: hiba.ALTALANOS) — R-09, R-14.
export function hibaSzoveg(t: (kulcs: string) => string, kod: string | undefined): string {
  const kulcs = `hiba.${kod ?? "ALTALANOS"}`;
  const szoveg = t(kulcs);
  return szoveg === kulcs ? t("hiba.ALTALANOS") : szoveg;
}

/** Egy API-hívás JSON-nal; a válasz { statusz, torzs }. Hálózati hiba: statusz 0. */
export async function apiHivas(ut: string, torzs?: unknown): Promise<{ statusz: number; torzs: Record<string, unknown> }> {
  try {
    const beallitas: RequestInit = { method: "POST", credentials: "same-origin" };
    if (torzs !== undefined) {
      beallitas.headers = { "content-type": "application/json" };
      beallitas.body = JSON.stringify(torzs);
    }
    const v = await fetch(ut, beallitas);
    let t: unknown = {};
    try { t = await v.json(); } catch { t = {}; }
    return { statusz: v.status, torzs: typeof t === "object" && t !== null ? (t as Record<string, unknown>) : {} };
  } catch {
    return { statusz: 0, torzs: {} };
  }
}

export function hibaKod(torzs: Record<string, unknown>): string | undefined {
  return typeof torzs["hiba"] === "string" ? torzs["hiba"] : undefined;
}
export function hibasMezok(torzs: Record<string, unknown>): Set<string> {
  const m = torzs["mezok"];
  return new Set(typeof m === "object" && m !== null ? Object.keys(m) : []);
}
