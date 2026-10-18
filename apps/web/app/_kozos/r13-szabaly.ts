// R-13 kredit-képernyők — a lapok tiszta döntései (design/R13/rajz/R13-lapok.dc.html, gepezet.md). Külön .ts fájl, hogy a próba
// JSX és React nélkül olvashassa (probak/r13-kredit-kepernyok.proba.ts). A R13SajatFiok.tsx és a Kreditek.tsx innen veszi őket.

export type Fokozat = "nagyon_szigoru" | "kozepes" | "laza";

/** 13a — az összegzés első sora: a fokozat mondata a hellyel és a témákkal (`r13.szures.{fokozat}_konkret`).
 *  Ha a munkatérnek még nincs beállítása (nincs téma), vagy a nagyon szigorú fokozathoz nincs hely, a fokozat általános mondata áll
 *  (`r13.szures.{fokozat}_mondat`) — a konkrét mondat üres hellyel/témával értelmetlen lenne. Ezt az állapotot a rajz nem mutatja (kérdés). */
export function fokozatMondat(
  t: (k: string, e?: Record<string, string | number>) => string,
  sz: { fokozat: Fokozat; hely: string; temak: string[] },
): string {
  const temak = sz.temak.join(", ");
  if (!temak || (sz.fokozat === "nagyon_szigoru" && !sz.hely)) return t(`r13.szures.${sz.fokozat}_mondat`);
  return t(`r13.szures.${sz.fokozat}_konkret`, { hely: sz.hely, temak });
}

/** 13b3 — az első tag, akinek elfogyott a kreditje (ha van): őróla szól a Kreditek nézet címe. */
export function elfogyottTag<T extends { maradt: number }>(tagok: T[]): T | null {
  return tagok.find((x) => x.maradt <= 0) ?? null;
}

/** 13d — a GET /api/kredit/sajat válaszából: elfogyott-e (ugyanaz a döntés, mint a kiszolgálón: kredit/szabaly `indithato` —
 *  a tagnak nem maradt, vagy a munkatér kreditje fogyott el). */
export function kreditElfogyott(k: { maradt: number; munkater_elfogyott: boolean }): boolean {
  return k.maradt <= 0 || k.munkater_elfogyott;
}
