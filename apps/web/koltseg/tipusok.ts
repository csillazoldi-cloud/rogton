// E-39: az AI-költséglap adatszerkezetei. Külön fájlban, mert a kiszolgálói modul "server-only",
// a képernyők viszont kliens-komponensek — a TÍPUSOKAT mindkettőnek ugyanabból kell vennie.

import type { Penznem } from "../kezdolap/tipusok";

export type Hol = "helyi" | "felho" | "vegyes" | "nincs";

export type GazdaSor = {
  szervezet_id: string;
  nev: string;
  hivasok: number;
  helyi_hivasok: number;
  ido_ms: number;
  usd: number;
  keret_usd: number;
  /** igaz, ha ennek a szervezetnek külön kerete van (nem az alapérték) */
  sajat_keret: boolean;
  utolso: string | null;
  hol: Hol;
};

export type GazdaOsszes = { hivasok: number; helyi_hivasok: number; ido_ms: number; usd: number; szervezetek: number };

export type GazdaNezet = { honap: string; alap_keret_usd: number; sorok: GazdaSor[]; osszes: GazdaOsszes };

export type SajatNezet = {
  honap: string;
  usd: number;
  keret_usd: number;
  hivasok: number;
  helyi_hivasok: number;
  felho_hivasok: number;
  ido_ms: number;
  feladatok: { feladat: string; hivasok: number; ido_ms: number; usd: number }[];
  /** a munkatér pénzneme (szervezet.penznem) */
  penznem: Penznem;
  /** 1 USD ennyi a pénznemben; USD-nél 1 */
  arfolyam_egy_usd: number;
};
