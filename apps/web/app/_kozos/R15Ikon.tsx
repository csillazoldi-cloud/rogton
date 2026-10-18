"use client";
// R-15 c5 3. kör (design/R15/rajz/R15-lapok-6.dc.html; gepezet-6): a Kezdőlap csempéinek és a 13/14 sorainak ikonjai.
// Saját, beágyazott vonalrajzok (24-es nézet, `currentColor` — a szín a témából jön, nincs beégetett szín); nincs ikonbetű, nincs új függőség.
// Mindegyik `aria-hidden`: a felirat mondja ki, mi az (az ikon csak a szemnek segít).
import type { ReactNode } from "react";

const UTAK = {
  hirek: <><path d="M4 5h13v14H6a2 2 0 0 1-2-2z" /><path d="M17 8h3v9a2 2 0 0 1-2 2" /><path d="M7 9h7M7 12h7M7 15h4" /></>,
  poszt: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  kepek: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-5-5-8.5 8.5" /></>,
  iranytu: <><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  szervezet: <><path d="M4 20V6l8-3v17" /><path d="M12 9h8v11" /><path d="M7 9h2M7 13h2M15 13h2M15 16h2M3 20h18" /></>,
  megjelenes: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 1.8-1 1.3-2.1-.6-1.2.2-2.4 1.5-2.4H17a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9z" /><circle cx="7.8" cy="11" r="1" /><circle cx="11" cy="7.5" r="1" /><circle cx="15.5" cy="8.5" r="1" /></>,
  csapat: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9.5" r="2.4" /><path d="M15.8 14.2A4.5 4.5 0 0 1 20.5 19" /></>,
  kredit: <><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.6 0-2.7.8-2.7 2s1.1 1.7 2.7 2 2.7.8 2.7 2-1.1 2-2.7 2c-1.1 0-2-.4-2.5-1.2M12 6.5v1.5M12 16v1.5" /></>,
  halado: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  penz: <><rect x="3" y="6.5" width="18" height="11" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 9.5v5M17.5 9.5v5" /></>,
  meres: <><path d="M4.5 17a8 8 0 1 1 15 0" /><path d="M12 13l3.5-4" /></>,
  kapcsolat: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  szoveg: <><path d="M4 18L8.5 6 13 18M5.6 14h5.8" /><path d="M15 11.5c.6-.9 1.5-1.3 2.6-1.3 1.6 0 2.4.9 2.4 2.4V18M20 15c-2.6 0-4.6.4-4.6 1.8 0 .8.7 1.3 1.6 1.3 1.6 0 3-1 3-2.6" /></>,
  harang: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  figyelem: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.2v.1" /></>,
  chip: <><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" /></>,
  ora: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  // R-18 8. kör · Beállítások (Round 8 rajz): Megjelenés (hold), Adatkezelés (pajzs), Visszajelzéseim (buborék), Gépház (fogaskerék)
  hold: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  pajzs: <><path d="M12 3.5l7 2.5v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  buborek: <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z" />,
  fogaskerek: <><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /></>,
} satisfies Record<string, ReactNode>;

export type R15IkonNev = keyof typeof UTAK;

export function R15Ikon({ nev, meret = 20 }: { nev: R15IkonNev; meret?: number }) {
  return (
    <svg aria-hidden="true" width={meret} height={meret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="r15-ikon">
      {UTAK[nev]}
    </svg>
  );
}

/** A 13/14 sorai előtt: az ikon egy kis, nyugodt, lekerekített négyzetben (keret nélkül — nem doboz, T6). */
export function R15IkonDoboz({ nev }: { nev: R15IkonNev }) {
  return (
    <span className="r15-ikon-doboz" aria-hidden="true">
      <R15Ikon nev={nev} meret={18} />
    </span>
  );
}
