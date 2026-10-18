"use client";
// G8 (Csilla, 2026-10-18 16:02 — „a lebegő Visszajelzés gomb menjen”, kifejezett igen): nem törlés, hanem kapcsoló.
// A VISSZAJELZES_GOMB környezeti változót a gyökér-keret (layout.tsx, force-dynamic) KÉRÉSENKÉNT olvassa (visszajelzesGombBe),
// és ezen a kontextuson adja le a kliens-komponenseknek. „ki” (vagy üres / ismeretlen érték) → sem a lebegő gomb, sem a
// képernyőkép-készítő szkriptje (html-to-image) nem kerül a lapra, és a menü „Visszajelzés” sora sem látszik (enélkül halott
// gomb maradna: az eseményét senki sem hallgatná). Ami MARAD: a /visszajelzes adminlapok és a POST /api/visszajelzes.
import { createContext, useContext, type ReactNode } from "react";

const Kontextus = createContext<boolean>(false);

export function VisszajelzesKapcsolo({ be, children }: { be: boolean; children: ReactNode }) {
  return <Kontextus.Provider value={be}>{children}</Kontextus.Provider>;
}

/** Igaz, ha a lebegő Visszajelzés gomb be van kapcsolva (VISSZAJELZES_GOMB=be). Szolgáltató nélkül: ki. */
export function useVisszajelzesGomb(): boolean {
  return useContext(Kontextus);
}
