// E-50: a Fiókok lap adatszerkezetei. Külön fájlban, mert a kiszolgálói modul "server-only",
// a képernyő viszont kliens-komponens — a TÍPUSOKAT mindkettőnek ugyanabból kell vennie.

export type Eredet = "ember" | "gepi_teszt";
export type Szerep = "tulajdonos" | "szerkeszto" | "nezo";

export type Tagsag = { nev: string; szerep: Szerep };

export type FiokSor = {
  id: string;
  email: string;
  nev: string;
  nyelv: "hu" | "ro" | "en" | null;
  letrehozva: string;
  rendszergazda: boolean;
  /** ISO időpont, ha fel van függesztve; null = aktív */
  felfuggesztve: string | null;
  eredet: Eredet;
  /** ISO időpont, vagy null: még soha nem lépett be (vagy a migráció előtti belépéseiről nincs nyom) */
  utolso_belepes: string | null;
  /** hány élő munkamenete van most */
  elo_munkamenet: number;
  munkaterek: Tagsag[];
};

export type MunkaterSor = {
  id: string;
  nev: string;
  letrehozva: string;
  /** ISO időpont, ha van jóváhagyott arculati profil; null = nincs */
  profil_jovahagyva: string | null;
  tulajdonos_email: string | null;
  tulajdonos_nev: string | null;
  /** van-e aktív hírfigyelő-beállítás */
  hirfigyelo: boolean;
  forrasok: number;
  /** a legutóbbi hírfigyelő-futás ideje, vagy null */
  utolso_futas: string | null;
  hivasok: number;
  usd: number;
  /** a rá érvényes havi keret (a saját, vagy az alapérték) */
  keret_usd: number;
  /** igaz, ha külön kerete van, nem az alapérték */
  sajat_keret: boolean;
};

export type FiokokNezet = {
  honap: string;
  alap_keret_usd: number;
  fiokok: FiokSor[];
  munkaterek: MunkaterSor[];
  /** a saját fiók azonosítója — ebből tudja a felület, mikor figyelmeztessen önkizárásra */
  sajat_fiok_id: string;
};
