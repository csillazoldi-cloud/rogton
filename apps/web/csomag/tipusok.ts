// F-7a: a csomag-lap (R-5) szerződése — a kiszolgáló ezt adja majd a képernyőnek. A pilotban a Gépház csempéje mutatja.
import type { Csomag, Modul } from "@km/contracts";

export type CsomagNezet = {
  csomag: Csomag;
  /** a rendszer minden ismert modulja, és hogy benne van-e a munkatér csomagjában */
  modulok: { modul: Modul; benne: boolean }[];
};
