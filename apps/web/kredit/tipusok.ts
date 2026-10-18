// R-13 kredit-képernyők (design/R13/rajz/R13-lapok.dc.html): a felület adatszerkezetei. Külön fájlban, mert a `./index` "server-only",
// a képernyők kliens-komponensek. Minden szám KREDITBEN (három tizedesig); a felület egy tizedesre kerekít.

/** A saját kreditem ebben a hónapban — ugyanaz, amit a `GET /api/kredit/sajat` ad (Saját fiók, Kezdőlap, Hírek, Posztszöveg). */
export type SajatKredit = {
  honap: string;
  havi: number;
  felhasznalt: number;
  maradt: number;
  /** a tag vagy a munkatér kreditje elfogyott: új AI-munka nem indul (kredit/szabaly `indithato`) */
  elfogyott: boolean;
  kulon_megadott: boolean;
  munkater_elfogyott: boolean;
  bontas: { hirek: number; poszt: number; iranytu: number; egyeb: number };
};

/** A Kreditek nézet (/tagok/kreditek) egy sora — a `GET /api/kredit/tagok` tagja. */
export type TagKreditSor = {
  fiok_id: string;
  nev: string;
  szerep: "tulajdonos" | "szerkeszto" | "nezo";
  /** a tulajdonos által megadott havi kredit; null = egyenlő rész */
  kulon: number | null;
  havi: number;
  felhasznalt: number;
  maradt: number;
};

export type KreditekNezet = {
  honap: string;
  munkater: { havi: number; felhasznalt: number; kiosztott: number; kiosztatlan: number };
  tagok: TagKreditSor[];
  /** a néző (a tulajdonos) fiókja — a saját során nincs Szerep/Eltávolítás */
  sajat_fiok_id: string;
};

/** A rendszergazda: egy munkatér havi kreditje és felhasználása ebben a hónapban (`GET /api/kredit/munkaterek`). */
export type MunkaterKredit = { szervezet_id: string; havi: number; felhasznalt: number };
