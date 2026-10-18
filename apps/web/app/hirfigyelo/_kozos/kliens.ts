"use client";
// A Hírfigyelő képernyőinek közös kliens-segédei (E-24): API-hívás, sor-várakozás, idő- és nyelvformázás.

export type HfValasz<T = Record<string, unknown>> = { statusz: number; torzs: T; hiba: string | null };

/** A kérés alap időkorlátja (A2, 2026-09-30): egy el nem készülő válasz se hagyhatja a gombot örökké „dolgozik” állapotban.
 *  Bőven hosszabb a leglassabb AI-hívásnál (a kiszolgáló AI-időkorlátja 30–60 mp), de véges. */
export const HF_KERES_IDOKORLAT_MS = 120_000;

/** Hívás a /api/hirfigyelo/… pontokra; a válasz `{ hirfigyelo: … }` burkát lebontja, a hibakódot (`hiba`) külön adja.
 *  Soha nem dob, és `idokorlatMs` után MINDIG visszatér (`statusz: 0`, `hiba: "IDOTULLEPES"`) — a hívó a hibaágon oldja a foglaltságot. */
export async function hfKeres<T = Record<string, unknown>>(ut: string, modszer: "GET" | "POST" | "PUT" | "DELETE" = "GET", torzs?: unknown, opciok: { idokorlatMs?: number } = {}): Promise<HfValasz<T>> {
  const vezerlo = new AbortController();
  let lejart = false;
  const idozito = setTimeout(() => { lejart = true; vezerlo.abort(); }, opciok.idokorlatMs ?? HF_KERES_IDOKORLAT_MS);
  try {
    const v = await fetch(ut, {
      method: modszer, credentials: "same-origin", signal: vezerlo.signal,
      ...(torzs === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(torzs) }),
    });
    let t: unknown = {};
    try { t = await v.json(); } catch { t = {}; }
    // a törzs olvasása közben lejárt idő nem „üres siker”, hanem időtúllépés
    if (lejart) return { statusz: 0, torzs: {} as T, hiba: "IDOTULLEPES" };
    const o = typeof t === "object" && t !== null ? (t as Record<string, unknown>) : {};
    const hiba = typeof o["hiba"] === "string" ? (o["hiba"] as string) : null;
    const belso = typeof o["hirfigyelo"] === "object" && o["hirfigyelo"] !== null ? (o["hirfigyelo"] as T) : (o as unknown as T);
    return { statusz: v.status, torzs: belso, hiba };
  } catch {
    return { statusz: 0, torzs: {} as T, hiba: lejart ? "IDOTULLEPES" : "HALOZAT" };
  } finally {
    clearTimeout(idozito);
  }
}

export type SorTetel = { id: string; fajta: string; kezdve?: string | null; allapot: "var" | "fut" | "kesz" | "hiba"; hibaOk: string | null; eredmeny: { futas_id?: string; ujra_ertekelt?: number } | null; haladas?: { forrasok_letoltve: number; forrasok_osszes: number; cikkek_talalt: number; cikkek_ertekelve: number; cikkek_ertekelendo: number } | null };

/** Várakozás egy sor-tételre (E-22: a futás a háttérben megy); `kesz`/`hiba`-ig kérdez, `lepesMs` időközönként, legfeljebb `maxMs`-ig. */
export async function varjSor(sorId: string, opciok: { lepesMs?: number; maxMs?: number; jel?: AbortSignal; onLepes?: (sor: SorTetel) => void } = {}): Promise<SorTetel | null> {
  const lepes = opciok.lepesMs ?? 3000;
  const hatar = Date.now() + (opciok.maxMs ?? 15 * 60 * 1000);
  while (Date.now() < hatar && !opciok.jel?.aborted) {
    const v = await hfKeres<{ sor: SorTetel }>(`/api/hirfigyelo/futas/sor/${sorId}`);
    if (v.statusz === 200 && v.torzs.sor) {
      opciok.onLepes?.(v.torzs.sor);
      if (v.torzs.sor.allapot === "kesz" || v.torzs.sor.allapot === "hiba") return v.torzs.sor;
    } else if (v.statusz === 404 || v.statusz === 401) {
      return null;
    }
    await new Promise((r) => setTimeout(r, lepes));
  }
  return null;
}

/** Rövid idő (a prototípus fmtTime-ja): „szept. 8. 07:00” a felület nyelvén. */
export function idoRovid(iso: string | Date | null | undefined, nyelv: string, idozona?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(nyelv, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", ...(idozona ? { timeZone: idozona } : {}) }).format(typeof iso === "string" ? new Date(iso) : iso);
  } catch { return typeof iso === "string" ? iso : iso.toISOString(); }
}

/** Nyelv neve a felület nyelvén (a prototípus langName-je). */
export function nyelvNev(kod: string | null | undefined, felulet: string): string {
  if (!kod) return "";
  try { return new Intl.DisplayNames([felulet], { type: "language" }).of(kod) ?? kod; } catch { return kod; }
}

/** Forrás rövid neve a címéből: „https://marosvasarhelyiek.ro/feed” → „marosvasarhelyiek.ro”. */
export function forrasNev(cim: string): string {
  try { return new URL(cim).hostname.replace(/^www\./, ""); } catch { return cim; }
}
