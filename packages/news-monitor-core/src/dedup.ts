// Cikk ≠ esemény: a gyanús párok keresése és az eseménybe sorolás.
import type { Kivonat } from "./kivonat";
import type { Esemeny } from "./talalat";

/** Kisbetű, írásjel nélkül, 3+ betűs szavak, ékezet marad. */
export function cimNormalizal(cim: string): string[] {
  return cim
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((s) => s.length >= 3);
}

/** Jaccard-hasonlóság két halmaz között. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let metszet = 0;
  for (const x of a) if (b.has(x)) metszet++;
  const unio = a.size + b.size - metszet;
  return unio === 0 ? 0 : metszet / unio;
}

/** Gyanús-e a pár: azonos ujjlenyomat, VAGY a címek Jaccard-hasonlósága ≥ 0,5 ÉS az idő 72 órán belül. */
export function gyanusPar(a: Kivonat, b: Kivonat): boolean {
  if (a.ujjlenyomat === b.ujjlenyomat) return true;
  const aSzo = new Set(cimNormalizal(a.cim));
  const bSzo = new Set(cimNormalizal(b.cim));
  if (jaccard(aSzo, bSzo) < 0.5) return false;
  const aIdo = a.megjelenes ? new Date(a.megjelenes) : new Date(a.begyujtes);
  const bIdo = b.megjelenes ? new Date(b.megjelenes) : new Date(b.begyujtes);
  const diff = Math.abs(aIdo.getTime() - bIdo.getTime());
  return diff <= 72 * 60 * 60 * 1000;
}

/** Eseménybe sorolás: determinisztikus, egy kivonat egy eseménybe; `ugyanaz` csak gyanús párokra hívódik. */
export function esemenybeSorol(
  ujKivonatok: Kivonat[],
  meglevoEsemenyek: { esemeny: Esemeny; kivonatok: Kivonat[] }[],
  ugyanaz: (a: Kivonat, b: Kivonat) => boolean,
  idAdo: () => string,
  most: Date,
  szervezetId = "",
): { ujEsemenyek: Esemeny[]; bovitett: { esemeny_id: string; kivonat_id: string }[] } {
  const ujEsemenyek: Esemeny[] = [];
  const bovitett: { esemeny_id: string; kivonat_id: string }[] = [];
  const felhasznalt = new Set<string>();

  for (const k of ujKivonatok) {
    if (felhasznalt.has(k.id)) continue;
    let hova: { esemeny: Esemeny; kivonatok: Kivonat[] } | undefined;
    let meglevobe = false; // csak a MEGLÉVŐ esemény bővítése számít „bővített”-nek
    // Először a meglévő eseményekben keresünk
    for (const e of meglevoEsemenyek) {
      for (const ek of e.kivonatok) {
        if (gyanusPar(k, ek) && ugyanaz(k, ek)) {
          hova = e; meglevobe = true;
          break;
        }
      }
      if (hova) break;
    }
    // Ha nem, az új eseményekben
    if (!hova) {
      for (const e of ujEsemenyek) {
        const ek = ujKivonatok.find((x) => x.id === e.fo_talalat_id);
        if (ek && gyanusPar(k, ek) && ugyanaz(k, ek)) {
          hova = { esemeny: e, kivonatok: [ek] };
          break;
        }
      }
    }
    if (hova) {
      if (meglevobe) bovitett.push({ esemeny_id: hova.esemeny.id, kivonat_id: k.id });
      hova.esemeny.talalat_ids.push(k.id);
      hova.kivonatok.push(k);
    } else {
      const id = idAdo();
      const esemeny: Esemeny = {
        id,
        szervezet_id: szervezetId, // a hívó adja (a kivonat nem ismeri a szervezetet)
        fo_talalat_id: k.id,
        talalat_ids: [k.id],
        letrehozva: most.toISOString(),
      };
      ujEsemenyek.push(esemeny);
    }
    felhasznalt.add(k.id);
  }
  return { ujEsemenyek, bovitett };
}
