import type { ProgramTetel } from "@km/contracts";

// c30 F6: a program-felület tiszta segédei (napcímkék, csoportosítás, idő) — a próbák is ezt hívják (probak/c30-f6-fesztival.proba.ts).

export const NAP_ISO = /^\d{4}-\d{2}-\d{2}$/;
const utc = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** „Csütörtök, jún. 25.” (hu) · „Joi, 25 iun.” (ro) · „Thursday, Jun 25” (en) — a felület nyelvén, időzóna-csúszás nélkül. */
export function napCimke(iso: string, ui: string): string {
  const d = utc(iso);
  const resz = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(ui, { ...o, timeZone: "UTC" }).format(d);
  const het = resz({ weekday: "long" });
  const Het = het.charAt(0).toLocaleUpperCase(ui) + het.slice(1);
  const ho = resz({ month: "short" }), nap = resz({ day: "numeric" });
  if (ui === "hu") return `${Het}, ${ho.endsWith(".") ? ho : `${ho}.`} ${nap}.`;
  if (ui === "ro") return `${Het}, ${nap} ${ho}`;
  return `${Het}, ${ho} ${nap}`;
}

/** „jún. 25–28.” (hu) · „25–28 iun.” (ro) · „Jun 25–28” (en); egy nap: csak az. */
export function idoszakCimke(tol: string, ig: string, ui: string): string {
  const resz = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(ui, { ...o, timeZone: "UTC" }).format(utc(iso));
  const ho = (iso: string) => { const h = resz(iso, { month: "short" }); return ui === "hu" && !h.endsWith(".") ? `${h}.` : h; };
  const n = (iso: string) => resz(iso, { day: "numeric" });
  const egyHo = tol.slice(0, 7) === ig.slice(0, 7);
  if (tol === ig) return ui === "hu" ? `${ho(tol)} ${n(tol)}.` : ui === "ro" ? `${n(tol)} ${ho(tol)}` : `${ho(tol)} ${n(tol)}`;
  if (ui === "hu") return egyHo ? `${ho(tol)} ${n(tol)}–${n(ig)}.` : `${ho(tol)} ${n(tol)}. – ${ho(ig)} ${n(ig)}.`;
  if (ui === "ro") return egyHo ? `${n(tol)}–${n(ig)} ${ho(ig)}` : `${n(tol)} ${ho(tol)} – ${n(ig)} ${ho(ig)}`;
  return egyHo ? `${ho(tol)} ${n(tol)}–${n(ig)}` : `${ho(tol)} ${n(tol)} – ${ho(ig)} ${n(ig)}`;
}

/** A tétel neve / helyszíne a felület nyelvén, ha van; különben a szervezet első nyelvén; különben ami van. */
export function nyelviErtek(x: Partial<Record<string, string>>, ui: string, nyelvek: string[]): string {
  return x[ui] || nyelvek.map((n) => x[n]).find(Boolean) || Object.values(x).find(Boolean) || "";
}

export type NapCsoport = { kulcs: string | null; tetelek: ProgramTetel[] };
/** Napok szerint: a napok sorban, a rendezvény egészére szólók a végén; egy napon belül az egész napos elöl, aztán kezdés szerint. */
export function napCsoportok(tetelek: readonly ProgramTetel[]): NapCsoport[] {
  const m = new Map<string | null, ProgramTetel[]>();
  for (const t of tetelek) { const k = t.nap && NAP_ISO.test(t.nap) ? t.nap : null; if (!m.has(k)) m.set(k, []); m.get(k)!.push(t); }
  const kulcsok = [...m.keys()].sort((a, b) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)));
  return kulcsok.map((k) => ({ kulcs: k, tetelek: [...m.get(k)!].sort((a, b) => (a.kezdes ?? "").localeCompare(b.kezdes ?? "")) }));
}

const IDO = /^(\d{1,2})[:.](\d{2})$/;
/** „21:00”, „9.30” → „09:30”; üres → null; rossz → undefined. */
export function idoBe(s: string): string | null | undefined {
  const x = s.trim();
  if (!x || x === "–") return null;
  const m = x.match(IDO);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return undefined;
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}

