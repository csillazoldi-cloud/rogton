// A konnektor: a modul saját szótára és minden port, amit a befogadó ad.
import { z } from "zod";

export const EsemenyFajta = z.enum([
  "belepes", "kilepes", "jelszo_valtas", "kileptetes_mindenhol",
  "meghivo_kiadva", "meghivo_visszavonva", "meghivo_elfogadva", "tag_felveve", "szerep_valtozott", "tag_eltavolitva", "tag_kilepett",
  "futas_indult", "futas_kesz", "futas_hiba", "keret_kimerult",
  "tema_alkalmazva", "feliratok_alkalmazva", "profil_jovahagyva",
  "ai_kapcsolo_valtozott", "fajl_feltoltve", "mentes_kimaradt",
  // 0.2.0 (F-5b, R-4, D-F33): a forrás állapota hibásra vált · egy futásban az AI nem válaszolt · a 15 perces elengedés · a belépési korlát betelt (rendszerszintű)
  "forras_hibas", "ai_nem_valaszol", "futas_beragadt", "belepesi_kiserletek",
]);
export type EsemenyFajta = z.infer<typeof EsemenyFajta>;

export const Sulyossag = z.enum(["info", "figyelem", "hiba"]);
export type Sulyossag = z.infer<typeof Sulyossag>;

export const Csatorna = z.enum(["nincs", "kimeno"]);
export type Csatorna = z.infer<typeof Csatorna>;

export const EsemenyHibaKod = z.enum(["NINCS_JOG", "ERVENYTELEN_ADAT", "ISMERETLEN_FAJTA"]);
export type EsemenyHibaKod = z.infer<typeof EsemenyHibaKod>;

export type Esemeny = {
  id: string;
  szervezet_id: string | null;
  fajta: EsemenyFajta;
  sulyossag: Sulyossag;
  fiok_id: string | null;
  ido: string;
  adat: Record<string, string | number | boolean | null>;
};

export type ErtesitesBeallitas = Partial<Record<EsemenyFajta, Csatorna>>;

export const ErtesitesBeallitasSema = z.partialRecord(EsemenyFajta, Csatorna);

export const ALAP_ERTESITES: Record<EsemenyFajta, Csatorna> = {
  belepes: "nincs",
  kilepes: "nincs",
  jelszo_valtas: "nincs",
  kileptetes_mindenhol: "nincs",
  meghivo_kiadva: "nincs",
  meghivo_visszavonva: "nincs",
  meghivo_elfogadva: "nincs",
  tag_felveve: "nincs",
  szerep_valtozott: "nincs",
  tag_eltavolitva: "nincs",
  tag_kilepett: "nincs",
  futas_indult: "nincs",
  futas_kesz: "nincs",
  futas_hiba: "nincs",
  keret_kimerult: "nincs",
  tema_alkalmazva: "nincs",
  feliratok_alkalmazva: "nincs",
  profil_jovahagyva: "nincs",
  ai_kapcsolo_valtozott: "nincs",
  fajl_feltoltve: "nincs",
  mentes_kimaradt: "nincs",
  forras_hibas: "nincs",
  ai_nem_valaszol: "nincs",
  futas_beragadt: "nincs",
  belepesi_kiserletek: "nincs",
};

export const MENTES_KIMARADT_ALAPBOL_BE = false;

export type KimenoUzenet = {
  szervezet_id: string | null;
  fajta: EsemenyFajta;
  sulyossag: Sulyossag;
  cim: string;
  szoveg: string;
  ido: string;
};

export type HostKontextus = {
  fiok_id: string;
  szervezet_id: string;
  szerep: "tulajdonos" | "szerkeszto" | "nezo";
};

export interface EsemenyTar {
  ir(e: Esemeny): Promise<void>;
  lista(szervezet_id: string, szuro?: { fajta?: EsemenyFajta; limit?: number }): Promise<Esemeny[]>;
  rendszerLista(szuro?: { limit?: number }): Promise<Esemeny[]>;
}

export interface ErtesitesTar {
  kozos(): Promise<ErtesitesBeallitas>;
  kozosMent(b: ErtesitesBeallitas): Promise<void>;
  szervezeti(szervezet_id: string): Promise<ErtesitesBeallitas>;
  szervezetiMent(szervezet_id: string, b: ErtesitesBeallitas): Promise<void>;
}

export interface Ora {
  most(): string;
}

export interface Azonosito {
  uj(): string;
}

export interface KimenoCsatorna {
  kuld(u: KimenoUzenet): Promise<{ ok: true } | { ok: false; hiba: string }>;
}

export type Feliratozo = (kulcs: string, ertekek?: Record<string, string | number>) => string;

export type Kornyezet = {
  tar: EsemenyTar;
  ertesites: ErtesitesTar;
  ora: Ora;
  azonosito: Azonosito;
  csatorna: KimenoCsatorna;
  felirat: Feliratozo;
};
