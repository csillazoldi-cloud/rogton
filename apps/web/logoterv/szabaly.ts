// R-17 B · fizetős logótervezés — a TISZTA szabályok (adatbázis, hálózat nélkül; próba: probak/r17-logoterv-szabaly.proba.ts).
// A kérdőív törzse, az ár és a címzett beállításának ellenőrzése, a színnév-javaslat a kérdőív előtöltéséhez, és az e-mail szövege.
import { z } from "zod";
import { hexbol, telitettsegVilagossag } from "@km/arculat-core";

/** „Hol fogod használni?” — a rajz öt lehetősége (r17.logoterv.hol_*). Alapból kijelölve: Facebook, Honlap, Autó, ruha (kerdesek 8). */
export const HOL = ["facebook", "honlap", "auto", "nyomtatott", "tabla"] as const;
export type Hol = (typeof HOL)[number];
export const HOL_ALAP: readonly Hol[] = ["facebook", "honlap", "auto"];

/** A beküldött kérdőív. A minták a munkatér SAJÁT, már feltöltött fájljai (a végpont ellenőrzi, hogy a munkatéréi-e). */
export const LogotervKuldes = z.object({
  nev: z.string().trim().min(1).max(120),
  mivel: z.string().trim().max(400).default(""),
  hangulat: z.string().trim().max(300).default(""),
  szinek: z.string().trim().max(300).default(""),
  hol: z.array(z.enum(HOL)).max(HOL.length).default([]),
  minta_idk: z.array(z.uuid()).max(10).default([]),
});
export type LogotervKuldes = z.infer<typeof LogotervKuldes>;

/** A tárolt válaszok (a `valaszok` oszlop): a kérdőív a minták nélkül. */
export type LogotervValaszok = Omit<LogotervKuldes, "minta_idk">;

/** Az ár a rendszergazda mezőjéből: üres → null (a gomb eltűnik); 0 is null; különben 0 < ár ≤ 100 000 EUR, legfeljebb 2 tizedes.
 *  Vissza: `{ ok: true, ar }` vagy `{ ok: false }` (a mező mondata: r17.admin.ar_hibas). Tizedesvessző is jó (79,50). */
export function arErtelmez(be: unknown): { ok: true; ar: number | null } | { ok: false } {
  if (be === null || be === undefined) return { ok: true, ar: null };
  const s = typeof be === "number" ? String(be) : typeof be === "string" ? be.trim().replace(",", ".") : null;
  if (s === null) return { ok: false };
  if (s === "") return { ok: true, ar: null };
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return { ok: false };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 100_000) return { ok: false };
  return { ok: true, ar: n === 0 ? null : n };
}

/** A címzett: üres (nincs levél) vagy egy egyszerű e-mail-cím (szóköz, vessző nélkül). */
export function cimzettErtelmez(be: unknown): { ok: true; cimzett: string } | { ok: false } {
  if (be === null || be === undefined) return { ok: true, cimzett: "" };
  if (typeof be !== "string") return { ok: false };
  const s = be.trim();
  if (s === "") return { ok: true, cimzett: "" };
  if (s.length > 200 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(s)) return { ok: false };
  return { ok: true, cimzett: s };
}

/** Az ár a gombon és a kérdőíven: „79 €” (egész összegnél tizedes nélkül), a felület nyelvének szokása szerint. */
export function arSzoveg(ar: number, nyelv: string): string {
  try {
    return new Intl.NumberFormat(nyelv, { style: "currency", currency: "EUR", currencyDisplay: "narrowSymbol", maximumFractionDigits: Number.isInteger(ar) ? 0 : 2, minimumFractionDigits: Number.isInteger(ar) ? 0 : 2 }).format(ar);
  } catch {
    return `${ar} €`;
  }
}

/** Egy szín durva neve a kérdőív „Milyen színek jók?” mezőjének előtöltéséhez — a felirat KULCSA (r17.szinnev.*), nem a szó. */
export function szinNevKulcs(hex: string): string | null {
  const rgb = hexbol(hex);
  if (!rgb) return null;
  const { s, l } = telitettsegVilagossag(rgb);
  if (l < 0.13) return "r17.szinnev.fekete";
  if (s < 0.12) return l > 0.9 ? "r17.szinnev.feher" : "r17.szinnev.szurke";
  const [r, g, b] = rgb.map((x) => x / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  if (l > 0.82) return h >= 20 && h < 70 ? "r17.szinnev.krem" : "r17.szinnev.feher";
  if (h < 15 || h >= 345) return l < 0.35 ? "r17.szinnev.barna" : "r17.szinnev.piros";
  // a földszínek (homok, bézs, okker) telítetlenebbek, mint a narancs és a sárga
  if (h >= 25 && h < 60 && s < 0.6 && l >= 0.4) return "r17.szinnev.homok";
  if (h < 40) return l < 0.45 ? "r17.szinnev.barna" : "r17.szinnev.narancs";
  if (h < 70) return l < 0.4 ? "r17.szinnev.homok" : "r17.szinnev.sarga";
  if (h < 172) return "r17.szinnev.zold";
  if (h < 195) return "r17.szinnev.turkiz";
  if (h < 255) return "r17.szinnev.kek";
  if (h < 290) return "r17.szinnev.lila";
  return "r17.szinnev.rozsaszin";
}

/** A munkatér színeiből a különböző színnév-kulcsok, sorrendben (fő, második, háttér), ismétlés nélkül. */
export function szinNevKulcsok(szinek: readonly string[]): string[] {
  const ki: string[] = [];
  for (const h of szinek) {
    const k = szinNevKulcs(h);
    if (k && !ki.includes(k)) ki.push(k);
  }
  return ki;
}

/** Az összefoglaló első mondata, legfeljebb `max` karakter, szóhatáron vágva (a „Mivel foglalkoztok?” előtöltése). */
export function rovidMondat(szoveg: string, max = 90): string {
  const elso = (szoveg.trim().split(/(?<=[.!?])\s/)[0] ?? "").trim();
  const tiszta = elso.replace(/[.!?]$/, "");
  if (tiszta.length <= max) return tiszta;
  const vag = tiszta.slice(0, max);
  return `${vag.slice(0, Math.max(vag.lastIndexOf(" "), Math.floor(max / 2))).replace(/[,;:]$/, "")}…`;
}

/** A levél szövege (sima szöveg, UTF-8). `f` a feliratok egy nyelven (a levél a rendszergazda nyelvén nem ismert: magyar). */
export function level(f: (kulcs: string, ertekek?: Record<string, string | number>) => string, k: {
  munkater: string; ki: string; ar: number | null; valaszok: LogotervValaszok; mintaDb: number;
}): { targy: string; szoveg: string } {
  const sorok = [
    f("r17.level.bevezeto"),
    "",
    f("r17.level.ki", { munkater: k.munkater, ki: k.ki || "—" }),
    k.ar !== null ? f("r17.logoterv.ar_rovid", { ar: arSzoveg(k.ar, "hu") }) : "",
    "",
    `${f("r17.logoterv.nev")} ${k.valaszok.nev}`,
    `${f("r17.logoterv.mivel")} ${k.valaszok.mivel || "—"}`,
    `${f("r17.logoterv.hangulat")} ${k.valaszok.hangulat || "—"}`,
    `${f("r17.logoterv.szinek")} ${k.valaszok.szinek || "—"}`,
    `${f("r17.logoterv.hol")} ${k.valaszok.hol.map((h) => f(`r17.logoterv.hol_${h}`)).join(", ") || "—"}`,
    k.mintaDb > 0 ? f("r17.level.minta", { n: k.mintaDb }) : "",
  ].filter((s, i, l) => !(s === "" && l[i - 1] === ""));
  return { targy: f("r17.level.targy", { munkater: k.munkater }), szoveg: sorok.join("\n").trim() };
}
