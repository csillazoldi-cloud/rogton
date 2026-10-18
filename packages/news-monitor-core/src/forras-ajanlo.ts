// R-10 forrás-ajánló: ellenőrzött listából (nyelv + térség) — NEM AI-ból.
// Tiszta függvény: nincs hálózat, adatbázis, React.

import { FORRAS_LISTA, type ForrasListaSor } from "./forras-lista";

export type AjanlottForras = {
  cim: string;
  nev: string;
  nyelv: string;
  leiras: string;
  miert: "terseg" | "szakma" | "nyelv" | "altalanos";
};

export type ForrasAjanloBemenet = {
  nyelvek: string[];
  szoveg: string;
  nyelv: "hu" | "ro" | "en";
  max?: number;
};

/** Ékezet- és kisbetű-normalizálás: NFD + kombináló jelek törlése. */
function normalizal(szoveg: string): string {
  return szoveg
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function talalatokSzama(szovegNormalizalt: string, kulcsszavak: readonly string[]): number {
  let db = 0;
  for (const k of kulcsszavak) {
    const kn = normalizal(k);
    if (kn.length > 0 && szovegNormalizalt.includes(kn)) db += 1;
  }
  return db;
}

/** J-1g: szó ELEJÉRE illesztés (a „szépítés” ne adjon „építés”-találatot). */
function szakmaTalalat(szovegNormalizalt: string, kulcsok: readonly string[] | undefined): number {
  if (!kulcsok) return 0;
  const t = ` ${szovegNormalizalt.replace(/[^a-z0-9]+/g, " ")}`;
  let db = 0;
  for (const k of kulcsok) if (t.includes(` ${normalizal(k)}`)) db += 1;
  return db;
}

function leirasSzoveg(sor: ForrasListaSor, nyelv: "hu" | "ro" | "en"): string {
  return sor.leiras[nyelv] ?? sor.leiras.hu;
}

export function forrasAjanlo(be: ForrasAjanloBemenet): AjanlottForras[] {
  const max = typeof be.max === "number" && be.max > 0 ? be.max : 8;
  const szovegN = normalizal(be.szoveg);
  const nyelvek = new Set(be.nyelvek);

  const latott = new Set<string>();
  const ki: AjanlottForras[] = [];

  const hozzaad = (sor: ForrasListaSor, miert: AjanlottForras["miert"]): boolean => {
    if (latott.has(sor.cim)) return false;
    if (ki.length >= max) return false;
    latott.add(sor.cim);
    ki.push({
      cim: sor.cim,
      nev: sor.nev,
      nyelv: sor.nyelv,
      leiras: leirasSzoveg(sor, be.nyelv),
      miert,
    });
    return true;
  };

  // (1) a felhasználó tartalomnyelvein a térség-találatos oldalak, találatszám szerint csökkenően
  const tersegTalalatok = FORRAS_LISTA
    .filter((s) => nyelvek.has(s.nyelv))
    .map((s) => ({ sor: s, db: talalatokSzama(szovegN, s.terseg) }))
    .filter((x) => x.db > 0)
    .sort((a, b) => b.db - a.db);
  // J-1g: a két legjobb helyi oldal után a szakmai oldalak jönnek (így az alapból bejelölt első háromban van szakmai is),
  // utána a többi helyi találat.
  const szakmaTalalatok = FORRAS_LISTA
    .filter((s) => nyelvek.has(s.nyelv))
    .map((s) => ({ sor: s, db: szakmaTalalat(szovegN, s.szakma) }))
    .filter((x) => x.db > 0)
    .sort((a, b) => b.db - a.db);
  for (const { sor } of tersegTalalatok.slice(0, 2)) hozzaad(sor, "terseg");
  for (const { sor } of szakmaTalalatok) {
    if (ki.length >= max) break;
    hozzaad(sor, "szakma");
  }
  for (const { sor } of tersegTalalatok) {
    if (ki.length >= max) break;
    hozzaad(sor, "terseg");
  }

  // (2) ugyanezeken a nyelveken az általános oldalak
  for (const sor of FORRAS_LISTA) {
    if (ki.length >= max) break;
    if (!nyelvek.has(sor.nyelv)) continue;
    if (!sor.altalanos) continue;
    hozzaad(sor, "altalanos");
  }

  // (3) ha még kevesebb, mint max: a többi nyelv térség-találatai
  if (ki.length < max) {
    const masNyelvTalalatok = FORRAS_LISTA
      .filter((s) => !nyelvek.has(s.nyelv))
      .map((s) => ({ sor: s, db: talalatokSzama(szovegN, s.terseg) }))
      .filter((x) => x.db > 0)
      .sort((a, b) => b.db - a.db);
    for (const { sor } of masNyelvTalalatok) {
      if (ki.length >= max) break;
      hozzaad(sor, "nyelv");
    }
  }

  return ki;
}
