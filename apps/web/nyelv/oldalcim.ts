import "server-only";
import { cookies, headers } from "next/headers";
import { MUNKAMENET_SUTI } from "@km/contracts";
import { NYELV_SUTI } from "@km/design-system";
import { aktualisFiok, aktualisSzervezet } from "../hitelesites";
import { felirat, feliratok, nyelvKeresbol } from "./index";
import { hatasosNyelv } from "./munkater";

/** Oldalcím (böngészőfül) a kért nyelven — a lapok generateMetadata-jából hívva.
 *  R-18 2. kör (Csilla 10-11): a fül mindig a termék nevével végződik („Belépés — Posztgyár”). A régi „… — Kommunikációs munkatér”
 *  végződéseket a 0164 migráció cserélte; ahol a cím egy lapfelirat (pl. „Képek”), ott itt kerül mögé a név. */
export async function oldalcim(kulcs: string): Promise<{ title: string }> {
  const [sutik, fejlecek] = await Promise.all([cookies(), headers()]);
  const suti = sutik.get(NYELV_SUTI)?.value;
  let szervezetId: string | null = null;
  let nyelv = nyelvKeresbol(suti, fejlecek.get("accept-language"));
  try {
    const fiok = await aktualisFiok(sutik.get(MUNKAMENET_SUTI)?.value);
    szervezetId = fiok ? (aktualisSzervezet(fiok)?.id ?? null) : null;
    // V1: süti nélkül a fülcím is a munkatér nyelvén (ugyanaz a sorrend, mint a layoutban)
    if (!suti && fiok) nyelv = (await hatasosNyelv(fiok, szervezetId)) ?? nyelv;
  } catch { szervezetId = null; }
  const f = await feliratok(nyelv, szervezetId);
  const cim = felirat(f, kulcs);
  const nev = felirat(f, "fejlec.termeknev");
  if (nev === "fejlec.termeknev" || cim === nev || cim.endsWith(` — ${nev}`)) return { title: cim };
  return { title: `${cim} — ${nev}` };
}
