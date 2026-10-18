// F-2 (R-1 v3): a kezdőképernyő és a Gépház adatszerkezetei. Külön fájlban, mert a kiszolgálói modul "server-only",
// a képernyők viszont kliens-komponensek — a TÍPUSOKAT mindkettőnek ugyanabból kell vennie (mint koltseg/tipusok.ts).
// A hiteles leírás: docs/KEZDOLAP-SZERZODES.md; a rajz: design/r1-kezdokepernyo/atado-2/.

/** D5: a pénznem a munkatér beállítása — euró · dollár · forint · lej. Az összegek USD-ben mérve, tárolt (nem élő) árfolyammal átszámítva. */
export const PENZNEMEK = ["EUR", "USD", "HUF", "RON"] as const;
export type Penznem = (typeof PENZNEMEK)[number];

/** Egy összeg: a mért USD, és a munkatér pénznemében az érték (a tárolt árfolyammal). A felület az `ertek`-et mutatja, a `penznem` jelével. */
export type Osszeg = { usd: number; penznem: Penznem; ertek: number };

export type Szerep = "tulajdonos" | "szerkeszto" | "nezo";

/** A hírfigyelő csempe adata. `null` = a munkatérnek még nincs figyelési beállítása (első használat). */
export type HirfigyeloCsempe = {
  /** az utolsó SIKERES futás vége (ISO), vagy null = még nem futott */
  utolso_sikeres: string | null;
  /** R-1 v4: a LEGUTÓBBI futás vége bármilyen állapotban (ISO), vagy null — ha utolso_sikeres null, de ez nem, a csempe „Utolsó futás … az értékelés függőben" sort mutat */
  utolso_futas: string | null;
  /** a következő tervezett futás (ISO), vagy null = kézi indítás */
  kovetkezo: string | null;
  /** a beállítás időzónája (a következő futás ebben jelenik meg) */
  idozona: string;
  /** fut-e éppen a háttérben */
  fut: boolean;
  /** új (még nem megtekintett) találatok száma */
  uj: number;
  /** hány forrás akadt el a legutóbbi futásban (különböző forrás_id-k száma) */
  forrashiba: number;
  /** R-7b 02 (D-F42 E1): a legfontosabb 3 friss cím a Hírek csempére — fontos → érdekes sorrendben, elrejtett nélkül */
  // F10-M1: cim = a beállított nyelven, ha van fordítás; cim_eredeti = az eredeti, ha eltér
  elso_cimek: { talalat_id: string; cim: string; cim_eredeti: string | null; kategoria: "fontos" | "erdekes" | "hatter" }[];
  /** hány találat értékelése függőben (fuggoben + keret_kimerult) */
  fuggoben: number;
  /** igaz, ha van keret_kimerult állapotú találat — a csempe a kezdolap.keret_elfogyott mondatot mutatja */
  keret_kimerult: boolean;
};

export type HianyzoResz = "celkozonseg" | "cel" | "nyelvek" | "hangnem" | "arculat";

export type ProfilCsempe = {
  /** a jóváhagyás ideje (ISO) */
  jovahagyva: string;
  /** a jóváhagyó neve (ha a fiók már nincs meg: üres) */
  jovahagyta_nev: string;
  /** a jóváhagyáskor hiányzó / későbbre hagyott részek */
  hianyzo: HianyzoResz[];
};

export type ArculatAllapot = "nincs" | "tervezet" | "kesobb" | "jovahagyott";

export type ForrasokCsempe = {
  osszes: number;
  hasznalhato: number;
  korlatozott: number;
  hibas: number;
  nem_tamogatott: number;
  ellenorzes_alatt: number;
};

export type KoltsegCsempe = {
  /** YYYY-MM */
  honap: string;
  hivasok: number;
  ido_ms: number;
  becsult: Osszeg;
  keret: Osszeg;
  /** keret − becsült, legalább 0 */
  maradt: Osszeg;
};

/** A kezdőképernyő EGY lekérdezése (GET /api/kezdolap). */
export type KezdolapNezet = {
  munkater: { id: string; nev: string; penznem: Penznem };
  szerep: Szerep;
  /** igaz = nincs jóváhagyott ügyfélprofil → a 2. artboard (első használat) */
  elso_hasznalat: boolean;
  hirfigyelo: HirfigyeloCsempe | null;
  /** null = nincs jóváhagyott profil */
  profil: ProfilCsempe | null;
  arculat: ArculatAllapot;
  forrasok: ForrasokCsempe;
  koltseg: KoltsegCsempe;
  /** a MUNKATÉR szintjén mentetlen (nem alkalmazott) tervezet — a feltételes 6. csempe */
  tervezet: { tema: boolean; feliratok: boolean };
  /** R-8: a Csomagod sor — a munkatér csomagjának kódja és a hírek modul forrás-plafonja */
  csomag: { kod: string; forras_max: number | null };
};

/** A Gépház adata (GET /api/gephaz). A `nezet` dönti el, melyik artboard: rendszergazda (4.) vagy tulajdonos (8.). */
export type GephazNezet = {
  nezet: "rendszergazda" | "tulajdonos";
  /** a pénznem a tulajdonos nézet Munkatér csempéjének vezérlőjéhez (R-1 v4) */
  munkater: { id: string; nev: string; penznem: Penznem };
  tema: {
    /** van-e mentetlen tervezet — rendszergazdánál a KÖZÖS alap, tulajdonosnál a MUNKATÉR szintjén */
    tervezet: boolean;
    /** a tokenkészlet mérete (rendszergazda) / a közös alapból jövő tokenek száma (tulajdonos: osszes − felulirt) */
    tokenek: number;
    /** hány tokent ír felül a munkatér (tulajdonos); rendszergazdánál 0 */
    felulirt: number;
    /** mikor lépett érvénybe az alkalmazott (ISO), vagy null */
    alkalmazva: string | null;
  };
  feliratok: {
    tervezet: boolean;
    /** hány kulcsot ír felül a munkatér (tulajdonos); rendszergazdánál a közös felülírt kulcsok száma */
    felulirt: number;
  };
  /** csak rendszergazda; tulajdonosnál null (a csempe meg sem jelenik) */
  koltseg: { honap: string; munkaterek: number; osszeg: Osszeg } | null;
  /** F-7b (R-5, 01–02. artboard): a Csomag csempe — a munkatér csomagja és a modulok (benne / nincs benne) */
  csomag: { kod: string; modulok: { modul: string; benne: boolean }[] };
  /** F-7b (R-5): a Kimenő értesítések csempe — a csatorna bekötve-e; a szám tulajdonosnál a hatásos, rendszergazdánál a közös alap „kimenő" fajtái */
  kimeno: { bekotve: boolean; kimeno_szam: number };
  /** csak rendszergazda; tulajdonosnál null */
  fiokok: { fiokok: number; munkaterek: number; felfuggesztett: number; utolso_belepes: { nev: string; idopont: string } | null } | null;
};

/** A felső sáv adata (a kiszolgálói lap adja át a FelsoSav komponensnek). */
export type FelsoSavAdat = {
  munkater: { id: string; nev: string };
  /** minden munkatér, amihez a fiók tartozik, szereppel — a lenyíló listája (az aktuális is benne) */
  munkaterek: { id: string; nev: string; szerep: Szerep }[];
  szerep: Szerep;
  fiok: { nev: string; rendszergazda: boolean };
  /** a Modulok lenyíló egyetlen valódi sora mellé: új találatok száma (0 = nincs jelvény) */
  uj_talalat: number;
  /** R-15 (gepezet 4): a „Vár rád” posztok száma — a Posztszöveg menüpont jelvénye */
  poszt_varo: number;
  /** látszik-e a Gépház ajtó: tulajdonos vagy rendszergazda (D-F23) */
  gephaz: boolean;
  /** a Gépház csempéinek száma a telefonos lenyíló jelvényéhez (4 rendszergazda, 2 tulajdonos) */
  gephaz_csempek: number;
  /** F-3f (D-F24 feloldva): a munkatér-lenyíló Tagok sora — {n} tag · {m} függő meghívó; null = a néző nem látja a sort */
  tagok: { n: number; m: number } | null;
  /** F-5b (R-4): az olvasatlan értesítések száma a harangon (0 = nincs szám; a felületi csatorna kikapcsolva → 0) */
  ertesites_olvasatlan: number;
  /** F-7a (D-F35): a munkatér csomagjának moduljai — a Modulok lenyíló csak ezeket mutatja */
  modulok: string[];
};
