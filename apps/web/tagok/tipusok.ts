// F-3e (R-2): a Tagok lap és a meghívó beváltó lapjának adatszerkezetei. Külön fájlban, mert a kiszolgálói modul "server-only",
// a képernyők kliens-komponensek. A rajz: design/r2-tagok/atado/; az ellenőrzés és a döntések: design/r2-tagok/ELLENORZES.md, D-F30.

export type Szerep = "tulajdonos" | "szerkeszto" | "nezo";

/** Egy tag a listán — a modul `Tag`-ja + a befogadó által hozzátett név és e-mail (a rajz mindkettőt mutatja). */
export type TagSor = {
  fiok_id: string;
  nev: string;
  email: string;
  szerep: Szerep;
  /** ISO: mikor csatlakozott a munkatérhez */
  csatlakozott: string;
  /** igaz, ha ez a bejelentkezett ember sora — a rajzon „ez te vagy", a vezérlői nem aktívak (MAGAT_NEM a felületen nem fordul elő) */
  en: boolean;
};

export type MeghivoAllapot = "kiadott" | "elfogadott" | "visszavont" | "lejart";

/** Egy kiadott meghívó a „Függő meghívók" blokkban (a jegy NEM része: azt a rendszer csak lenyomatként tárolja). */
export type MeghivoSor = {
  id: string;
  szerep: Szerep;
  /** a címzett e-mailje, ha megadták — csak emlékeztető, üzenet nem megy */
  email: string | null;
  /** ISO */
  letrehozva: string;
  /** ISO — a kiadástól 7 nap (MEGHIVO_ERVENYESSEG_NAP) */
  lejar: string;
  allapot: MeghivoAllapot;
  /** a kiadó neve */
  kiadta_nev: string;
};

/** Egy sor a lap alján álló „Mi történt" blokkban (az eseménynaplóból, csak a tagsági fajták). */
export type TagEsemenySor = {
  id: string;
  fajta: string;
  /** ISO */
  ido: string;
  /** a cselekvő neve, ha van */
  fiok_nev: string | null;
  adat: Record<string, string | number | boolean | null>;
};

/** A Tagok lap EGY adata (a kiszolgálói lap állítja össze). */
export type TagokNezet = {
  munkater: { id: string; nev: string };
  /** a néző szerepe — a felület ebből dönt: tulajdonos mindent; szerkesztő: Meghívás igen, Szerep/Eltávolítás nem; néző nem jut ide */
  szerep: Szerep;
  sajat_fiok_id: string;
  tagok: TagSor[];
  /** csak szerkesztőnek és tulajdonosnak (a nézőnek üres) — a kiadott, még élő és a lejárt/visszavont is, az `allapot` mondja */
  meghivok: MeghivoSor[];
  esemenyek: TagEsemenySor[];
};

/** A `POST /api/tagok/meghivo` válasza a felületnek: a link EGYSZER jön vissza. */
export type MeghivoKiadva = {
  meghivo: MeghivoSor;
  /** a teljes link (origin + /meghivo/<jegy>) — a párbeszéd „B" panelje mutatja, másolható, aztán soha többé */
  link: string;
};

/** A beváltó lap (`/meghivo/<jegy>`) adata — `GET /api/meghivo/{jegy}` (nyilvános; a jegyet nem naplózza). */
export type BevaltoNezet = {
  /** a meghívó állapota MOST; `nincs` = ismeretlen jegy */
  allapot: MeghivoAllapot | "nincs";
  /** a meghívó nevét, a munkatér nevét és a szerepet csak `kiadott` állapotban adjuk ki (D-F30) */
  meghivo_nev: string | null;
  szervezet_nev: string | null;
  szerep: Szerep | null;
  /** ISO, csak `kiadott`-nál */
  lejar: string | null;
  /** a látogató belépett-e (a lap ebből dönt A vagy B panel) */
  belepve: boolean;
  /** a belépett fiók e-mailje — „Ezzel a fiókkal csatlakozol: …" */
  fiok_email: string | null;
  /** a belépett fiók már tagja ennek a munkatérnek → a MAR_TAG (semleges) kártya */
  mar_tag: boolean;
};
