// A tiszta szabályok: súlyosság-alap, értesítés-egyesítés, kimenő üzenet.
import {
  ALAP_ERTESITES,
  type Csatorna,
  type Esemeny,
  type EsemenyFajta,
  type ErtesitesBeallitas,
  type Feliratozo,
  type KimenoUzenet,
  type Sulyossag,
} from "./host";

export const ALAP_SULYOSSAG: Record<EsemenyFajta, Sulyossag> = {
  belepes: "info",
  kilepes: "info",
  jelszo_valtas: "info",
  kileptetes_mindenhol: "figyelem",
  meghivo_kiadva: "info",
  meghivo_visszavonva: "info",
  meghivo_elfogadva: "info",
  tag_felveve: "info",
  szerep_valtozott: "figyelem",
  tag_eltavolitva: "figyelem",
  tag_kilepett: "info",
  futas_indult: "info",
  futas_kesz: "info",
  futas_hiba: "hiba",
  keret_kimerult: "hiba",
  tema_alkalmazva: "info",
  feliratok_alkalmazva: "info",
  profil_jovahagyva: "info",
  ai_kapcsolo_valtozott: "figyelem",
  fajl_feltoltve: "info",
  mentes_kimaradt: "hiba",
  forras_hibas: "figyelem",
  ai_nem_valaszol: "figyelem",
  futas_beragadt: "hiba",
  belepesi_kiserletek: "figyelem",
};

export function hatasosErtesites(
  kozos: ErtesitesBeallitas,
  szervezeti: ErtesitesBeallitas,
): Record<EsemenyFajta, Csatorna> {
  const eredmeny = { ...ALAP_ERTESITES };
  for (const kulcs of Object.keys(kozos) as EsemenyFajta[]) {
    const ertek = kozos[kulcs];
    if (ertek !== undefined) eredmeny[kulcs] = ertek;
  }
  for (const kulcs of Object.keys(szervezeti) as EsemenyFajta[]) {
    const ertek = szervezeti[kulcs];
    if (ertek !== undefined) eredmeny[kulcs] = ertek;
  }
  return eredmeny;
}

export function kimenoUzenet(e: Esemeny, felirat: Feliratozo): KimenoUzenet {
  const cimKulcs = `esemeny.${e.fajta}_cim`;
  const szovegKulcs = `esemeny.${e.fajta}_szoveg`;

  const ertekek: Record<string, string | number> = {};
  for (const [kulcs, ertek] of Object.entries(e.adat)) {
    if (ertek === null) continue;
    ertekek[kulcs] = typeof ertek === "boolean" ? String(ertek) : ertek; // a feliratozó szöveget vagy számot vár
  }

  const cimNyers = felirat(cimKulcs, ertekek);
  const szovegNyers = felirat(szovegKulcs, ertekek);

  const cim = cimNyers === cimKulcs ? e.fajta : cimNyers;
  const szoveg = szovegNyers === szovegKulcs ? JSON.stringify(e.adat) : szovegNyers;

  return {
    szervezet_id: e.szervezet_id,
    fajta: e.fajta,
    sulyossag: e.sulyossag,
    cim,
    szoveg,
    ido: e.ido,
  };
}
