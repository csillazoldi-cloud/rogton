"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Nyelv } from "@rogton/design-system";
import { sablonKitolt } from "./sablon";

interface FeliratokKontextus {
  f: Record<string, string>;
  nyelv: Nyelv;
  t: (kulcs: string, ertekek?: Record<string, string | number>) => string;
}

const Kontextus = createContext<FeliratokKontextus | undefined>(undefined);

export function FeliratokSzolgaltato({ f, nyelv, children }: { f: Record<string, string>; nyelv: Nyelv; children: ReactNode }) {
  const t = (kulcs: string, ertekek?: Record<string, string | number>): string => {
    const sablon = f[kulcs];
    if (sablon === undefined) return kulcs;
    return sablonKitolt(sablon, ertekek); // R-18 3. kör: többes szám is (nyelv/sablon.ts)
  };

  return <Kontextus.Provider value={{ f, nyelv, t }}>{children}</Kontextus.Provider>;
}

export function useFeliratok(): FeliratokKontextus {
  const kontextus = useContext(Kontextus);
  if (!kontextus) throw new Error("useFeliratok csak FeliratokSzolgaltato alatt hasznalhato");
  return kontextus;
}
