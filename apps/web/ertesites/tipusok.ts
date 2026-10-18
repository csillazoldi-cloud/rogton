// F-5b (R-4): az Értesítések és adatpolitika lap szerződése — a kiszolgáló ezt adja, a lap ezt rajzolja.
// Az értesítés FIÓK-szintű (kit hogyan érjenek el), az adatpolitika MUNKATÉR-szintű (mi történik az adatával) — a rajz adatkotes.md-je szerint.
import type { EsemenyFajta } from "@rogton/esemeny-core";

/** A rajz öt eseménye, ami minden tagnak szólhat — sorrendben, ahogy a „Miről szóljon" blokk mutatja. */
export const ERTESITES_FAJTAK = ["futas_kesz", "forras_hibas", "keret_kimerult", "ai_nem_valaszol", "futas_beragadt"] as const satisfies readonly EsemenyFajta[];
export type ErtesitesFajta = (typeof ERTESITES_FAJTAK)[number];
/** A rendszergazdai csoport egyetlen eseménye — közönséges felhasználónak meg sem jelenik (04. artboard). */
export const RENDSZERGAZDA_FAJTA = "belepesi_kiserletek" as const satisfies EsemenyFajta;
export type SajatFajta = ErtesitesFajta | typeof RENDSZERGAZDA_FAJTA;

/** A fiók saját beállítása: melyik eseményről szóljunk, és a felületi csatorna (harang + lista). Alapból mind be (a rajz 9.1 döntése). */
export type SajatBeallitas = {
  esemenyek: Record<SajatFajta, boolean>;
  feluleten: boolean;
};
export const ALAP_SAJAT_BEALLITAS: SajatBeallitas = {
  esemenyek: { futas_kesz: true, forras_hibas: true, keret_kimerult: true, ai_nem_valaszol: true, futas_beragadt: true, belepesi_kiserletek: true },
  feluleten: true,
};

/** Hová visz a sor (a rajz: találatok · források · költség · a futás részletei; a rendszergazdai: a Fiókok lap). */
export type ErtesitesCel = "talalatok" | "forrasok" | "koltseg" | "futas" | "fiokok";
export const FAJTA_CEL: Record<SajatFajta, ErtesitesCel> = {
  futas_kesz: "talalatok",
  forras_hibas: "forrasok",
  keret_kimerult: "koltseg",
  ai_nem_valaszol: "futas",
  futas_beragadt: "futas",
  belepesi_kiserletek: "fiokok",
};
/** A cél útja a munkatérben (a munkatér-váltást a /beallitasok/nyit/[id] út végzi el). */
export const CEL_UT: Record<ErtesitesCel, string> = {
  talalatok: "/hirfigyelo",
  forrasok: "/hirfigyelo/beallitas",
  koltseg: "/koltseg",
  futas: "/hirfigyelo",
  fiokok: "/fiokok",
};

/** Egy sor a „Mi történt" listában. A szöveg kulcsa `ertesites.esemeny_<fajta>`, a helyőrzők értékei az `ertekek`-ben. */
export type ErtesitesSor = {
  id: string;
  fajta: SajatFajta;
  ido: string; // ISO
  olvasott: boolean;
  /** melyik munkatérben történt; null = rendszerszintű (a rendszergazdai csoport) */
  munkater: { id: string; nev: string } | null;
  cel: ErtesitesCel;
  ertekek: Record<string, string | number>;
};

export type ErtesitesLista = {
  sorok: ErtesitesSor[];
  olvasatlan: number;
  osszes: number;
};

/** Az adatpolitika fül rendszeradata: a hírfigyelő AI-szolgáltatója (a 2. adatút-sor szereplője), a futtatás helye, az ország, a mérés napja. */
export type AdatpolitikaNezet = {
  szolgaltato: {
    /** emberi név (nem a belső azonosító) — adat, nem felirat */
    nev: string;
    hol: "helyi" | "felho";
    /** feliratkulcs: adatpolitika.orszag_* */
    orszag_kulcs: string;
  };
  /** az adatút kimutatásának napja (ISO dátum) — a kód írásakor újramérve */
  meres_datum: string;
  /** a felhő-kapcsoló helye: a tulajdonosnál látszik (kikapcsolva, „még nem működik"), másnak nincs ott (04. artboard) */
  felho_kapcsolo_latszik: boolean;
  /** F-7b (R-5, 05. artboard): a munkatér AI-kapcsolója — a doboz csak a tulajdonosnál (felho_kapcsolo_latszik) */
  ai_engedelyezve: boolean;
  /** az utolsó kikapcsolás (az `ai_kapcsolo_valtozott` eseményből, a fiók nevével); null = nincs adat → a sor elmarad */
  ai_kikapcsolva: { ido: string; ki: string } | null;
};

export type BeallitasokNezet = {
  lista: ErtesitesLista;
  beallitas: SajatBeallitas;
  /** a rendszergazdai csoport látszik-e */
  rendszergazda: boolean;
  adatpolitika: AdatpolitikaNezet;
};
