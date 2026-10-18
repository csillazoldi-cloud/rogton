"use client";
// R-13 kredit-képernyők (design/R13/rajz/R13-lapok.dc.html, gepezet.md) — a lapok közös darabjai: számformátum, a halk „elfogyott”
// mondat a kis jellel (13d3, 13d4), a saját kredit újraolvasása, ha egy AI-művelet a keret-hibával tér vissza (gepezet 13d: „ha versenyez”).
import { useCallback } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import type { SajatKredit } from "../../kredit/tipusok";
import { kijelzes } from "../../kredit/szabaly";
import { hivas } from "./kliens";
import { kreditElfogyott } from "./r13-szabaly";
import "./r13.css";

/** Kredit a felületen: egy tizedesig, a felület nyelvének tizedesjelével („458,5”); egészre kerekedve tizedes nélkül („312”).
 *  A meglévő szabályt használja (kredit/szabaly `kijelzes`, ezredben) — a bemenet kredit, ahogy a végpontok adják. */
export function useKreditSzam(): (n: number) => string {
  const { nyelv } = useFeliratok();
  return useCallback((n: number) => kijelzes(Math.round(n * 1000), nyelv === "ro" || nyelv === "en" ? nyelv : "hu"), [nyelv]);
}

/** 13d3 · 13d4 — a halk mondat a kis jellel: nem riasztó doboz (T7), egy mondat, ami megmondja, miért halvány a gomb. */
export function ElfogyottSor({ children, osztaly }: { children: React.ReactNode; osztaly?: string }) {
  return (
    <p className={osztaly ? `r13-elfogyott ${osztaly}` : "r13-elfogyott"} data-r15="info">
      <span className="r13-pont" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** A saját kredit újraolvasása (GET /api/kredit/sajat). Hálózati hibánál null — a lap marad, ahogy volt. */
export async function sajatKreditOlvas(): Promise<SajatKredit | null> {
  const v = await hivas("/api/kredit/sajat", "GET");
  const k = v.torzs["kredit"] as Omit<SajatKredit, "elfogyott"> | undefined;
  if (v.statusz !== 200 || !k) return null;
  // ugyanaz a döntés, mint a kiszolgálón (kredit/szabaly `indithato`): a tagnak nem maradt, vagy a munkatérnek elfogyott
  return { ...k, elfogyott: kreditElfogyott(k) };
}
