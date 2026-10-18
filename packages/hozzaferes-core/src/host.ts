// A konnektor: a modul saját szótára és minden port, amit a befogadó ad.
import { z } from "zod";

export const Szerep = z.enum(["tulajdonos", "szerkeszto", "nezo"]);
export type Szerep = z.infer<typeof Szerep>;

export const SZEREP_ERO: Record<Szerep, number> = {
  nezo: 1,
  szerkeszto: 2,
  tulajdonos: 3,
};

export const Muvelet = z.enum([
  "tagok_nez",
  "tag_meghiv",
  "meghivo_visszavon",
  "meghivo_elfogad",
  "szerep_allit",
  "tag_eltavolit",
  "kilep",
]);
export type Muvelet = z.infer<typeof Muvelet>;

export const HozzaferesHibaKod = z.enum([
  "NINCS_JOG",
  "NAGYOBB_SZEREP",
  "UTOLSO_TULAJDONOS",
  "MAGAT_NEM",
  "NINCS_ILYEN_TAG",
  "NINCS_ILYEN_MEGHIVO",
  "MEGHIVO_LEJART",
  "MEGHIVO_FELHASZNALVA",
  "MEGHIVO_VISSZAVONVA",
  "MAR_TAG",
  "ERVENYTELEN_ADAT",
]);
export type HozzaferesHibaKod = z.infer<typeof HozzaferesHibaKod>;

export type HostKontextus = {
  fiok_id: string;
  szervezet_id: string;
  szerep: Szerep;
};

export type Tag = {
  fiok_id: string;
  szerep: Szerep;
  csatlakozott: string; // ISO
};

export const MeghivoAllapot = z.enum([
  "kiadott",
  "elfogadott",
  "visszavont",
  "lejart",
]);
export type MeghivoAllapot = z.infer<typeof MeghivoAllapot>;

export type Meghivo = {
  id: string;
  szervezet_id: string;
  szerep: Szerep;
  email: string | null;
  lenyomat: string;
  letrehozta: string;
  letrehozva: string;
  lejar: string;
  allapot: "kiadott" | "elfogadott" | "visszavont";
  elfogadta: string | null;
  elfogadva: string | null;
  visszavonva: string | null;
};

export type HozzaferesEsemeny =
  | { fajta: "meghivo_kiadva"; szervezet_id: string; meghivo_id: string; szerep: Szerep; kiadta: string }
  | { fajta: "meghivo_visszavonva"; szervezet_id: string; meghivo_id: string; visszavonta: string }
  | { fajta: "meghivo_elfogadva"; szervezet_id: string; meghivo_id: string; fiok_id: string; szerep: Szerep }
  | { fajta: "tag_felveve"; szervezet_id: string; fiok_id: string; szerep: Szerep }
  | { fajta: "szerep_valtozott"; szervezet_id: string; fiok_id: string; regi: Szerep; uj: Szerep; allitotta: string }
  | { fajta: "tag_eltavolitva"; szervezet_id: string; fiok_id: string; eltavolitotta: string }
  | { fajta: "tag_kilepett"; szervezet_id: string; fiok_id: string };

export interface TagsagTar {
  tagok(szervezet_id: string): Promise<Tag[]>;
  felvesz(szervezet_id: string, fiok_id: string, szerep: Szerep, mikor: string): Promise<void>;
  szerepAllit(szervezet_id: string, fiok_id: string, szerep: Szerep): Promise<void>;
  eltavolit(szervezet_id: string, fiok_id: string): Promise<void>;
}

export interface MeghivoTar {
  ment(m: Meghivo): Promise<void>;
  frissit(m: Meghivo): Promise<void>;
  azonositoSzerint(szervezet_id: string, id: string): Promise<Meghivo | null>;
  lenyomatSzerint(lenyomat: string): Promise<Meghivo | null>;
  lista(szervezet_id: string): Promise<Meghivo[]>;
}

export interface Ora {
  most(): string; // ISO
}

export interface Azonosito {
  uj(): string;
  jegy(): string;
  lenyomat(jegy: string): string;
}

export type EsemenyKimenet = (e: HozzaferesEsemeny) => void | Promise<void>;

export type Kornyezet = {
  tagsag: TagsagTar;
  meghivo: MeghivoTar;
  ora: Ora;
  azonosito: Azonosito;
  esemeny: EsemenyKimenet;
};
