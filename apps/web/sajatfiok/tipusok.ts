// F-4b (R-3 v2): a Saját fiók lap szerződése — a kiszolgáló ezt adja, a lap ezt rajzolja.
// A lap a FIÓKRÓL szól (nem a munkatérről): adataim, jelszó, belépések, a felület nyelve, munkatereim, a rendszergazdai blokk.
import type { Szerep } from "@km/contracts";

/** Egy sor az „Utolsó belépéseim" listában — a belépési naplóból (30 nap), legújabb elöl. A cím az, ahogy a kiszolgáló látta. */
export type BelepesSor = {
  ido: string; // ISO
  cim: string;
  sikeres: boolean;
};

/** Egy munkatér a „Munkatereim" listában. `utolso_tulajdonos`: a Kilépek gomb zárt, a két mondat mellette (01./05. artboard). */
export type MunkaterSor = {
  id: string;
  nev: string;
  szerep: Szerep;
  /** a fiókon tárolt aktuális választás (D-F25) — „most ebben vagy" */
  aktualis: boolean;
  utolso_tulajdonos: boolean;
};

export type SajatFiokNezet = {
  fiok: {
    id: string;
    nev: string;
    email: string;
    nyelv: "hu" | "ro" | "en" | null;
    rendszergazda: boolean;
  };
  /** az utolsó belépés időpontja (a fiók sorából), ISO; null = nincs */
  utolso_belepes: string | null;
  /** az utolsó 3 belépési kísérlet (30 nap), legújabb elöl */
  belepesek: BelepesSor[];
  /** a belépési napló megőrzése napokban (a lap mondata) */
  megorzes_nap: number;
  munkaterek: MunkaterSor[];
  /** az oldalsáv „Beállítások" sorának száma (R-4 bejárat) */
  ertesites_olvasatlan: number;
};

/** A kilépés válasza (POST /api/tagok/kilep, kiegészítve): ha az aktuális munkatérből lépett ki, a következő választott munkatér; null = nem maradt. */
export type KilepValasz = {
  hozzaferes: { fiok_id: string };
  kovetkezo_szervezet_id: string | null;
};
