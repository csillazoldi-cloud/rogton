import "server-only";
// R-16 K3 (TERV §2-K3 allapot.ts) — a „Logó, színek, betűk” szakasz (12a · 12b · 12c) nézetmodellje.
// A lap csak ezt kapja: melyik képernyő (ures · talalt · kesz), a sorok tartalma (logók, három szín, két betű + hangulatszó), a
// „Fájlok” számai, a honlap címe („Honnan?”), a jóváhagyás ideje és a Részletek mezői. A döntés tiszta (`arculatNezet`, próba:
// probak/r16-arculat-allapot.proba.ts); a betöltő (`arculatAllapot`) a profilt a `profil/tar`-ból olvassa — NEM a `profil`
// bejáratából (TERV §3: az a vizual-körbe húzna) —, a fájlokat a `fajl/tar`-ból.
import type { ArculatLepes, ArculatPillanatkep, ArculatTervezet, LogoValtozat, SzervezetProfil } from "@rogton/contracts";
import { hasznaltLogok, LOGO_VALTOZATOK, type FajlMeta } from "@rogton/fajl-core";
import { BetuElemzes, betuKulcs, betuSzo, sajatBetuId, type BetuKulcs } from "@rogton/arculat-core";
import { profilTar } from "../profil/tar";
import { fajlTar } from "../fajl/tar";
import { fiokNeve } from "../szervezet/reszletek";
import { alapTervezet } from "./alap";

export type ArculatNezet = "ures" | "talalt" | "kesz";
export type Szerep = "tulajdonos" | "szerkeszto" | "nezo";
type Szinek = { fo: string; masodik: string; hatter: string };

export type SzakaszAdat = {
  /** 12a: nincs jóváhagyva, nincs logó, nem a honlapról · 12b: nincs jóváhagyva, de van logó VAGY a színek a honlapról · 12c: jóváhagyva */
  nezet: ArculatNezet;
  /** szerkesztő vagy tulajdonos: Csere, jóváhagyás, Részletek-mentés, Visszavonás. A néző csak lát (TERV §4 16.). */
  szerkesztheto: boolean;
  szinek: Szinek;
  /** a sorok nem a tervezetből, hanem az alapszettből jönnek (nincs tervezet) */
  alapbol: boolean;
  betuk: { cim: BetuKulcs; szoveg: BetuKulcs; cimSzo: string; szovegSzo: string; cimSajat: SajatBetuNev | null; szovegSajat: SajatBetuNev | null };
  /** helyenként a képen használt logó (fájl-azonosító) — ugyanaz, amit a képek kapnak (`hasznaltLogok`, A5) */
  logok: Record<LogoValtozat, string | null>;
  vanLogo: boolean;
  /** a logó-csempék háttere a rajz 12c szerint: világos = háttérszín, sötét = fő szín, egyszínű = fehér (a lap adja), négyzetes = háttérszín */
  logoHatterek: { vilagos: string; sotet: string; negyzetes: string };
  fajlok: { kezikonyv: number; minta: number; dokumentum: number };
  /** a honlap, amit a gép olvasott (K7 tölti) — csak ha van, akkor alcím és „Honnan?” (TERV §4 15.) */
  forrasCim: string;
  /** 12c Részletek: mikor és ki (a profil jóváhagyója — ugyanaz a forrás, mint a régi dobozé: fiok.arc_megj_jovahagyott) */
  jovahagyva: { ido: string; ki: string } | null;
  reszletek: { kepvilag: string; kovetendo: string; kerulendo: string; lekerekites: number };
  /** Nem jóváhagyott állapotban az „Így néz ki” képe a tervezet (ill. az alapszett) színeivel készül (POST), mert a képek
   *  egyébként a régebbi jóváhagyott változatot mutatnák — a kép azt mutassa, amit a fő gomb jóváhagy. Jóváhagyva: null (GET). */
  elonezet: Szinek | null;
  /** a tárolt arculati lépés — a „Fájlok” mezői (ArculatAnyagok) ezt kapják, változatlanul */
  lepes: ArculatLepes;
};

/** R-16 K5: a választott saját betű (a sor a nevét a saját betűjével írja — a fájl a /api/arculat/fajl/<id>-ről tölt). */
export type SajatBetuNev = { id: string; nev: string };

/** R-16 K5: "sajat:<id>" → a munkatér betű-fájlja és a neve (a tárolt vizsgálatból, különben a fájlnév); nincs meg → null (tartalék). */
function sajatBetuNev(ertek: string, fajlok: readonly FajlMeta[] | null): SajatBetuNev | null {
  const id = sajatBetuId(ertek);
  const f = id ? (fajlok ?? []).find((x) => x.id === id && x.cel === "betu") : undefined;
  if (!f) return null;
  return { id: f.id, nev: BetuElemzes.safeParse(f.elemzes).data?.nev ?? f.nev.replace(/\.[a-z0-9]+$/i, "") };
}

export type NezetBemenet = {
  profil: Pick<SzervezetProfil, "nev" | "osszefoglalo" | "arculat" | "nyelvek">;
  fajlok: readonly FajlMeta[] | null;
  szerep: Szerep;
  jovahagyoNev: string;
};

/** A jóváhagyott pillanatkép, ha az arculat jóváhagyott állapotban van. */
export function jovahagyottKep(a: SzervezetProfil["arculat"]): ArculatPillanatkep | undefined {
  return a.allapot === "jovahagyott" && a.jovahagyott_verzio ? a.verziok[String(a.jovahagyott_verzio)] : undefined;
}

/** Tiszta döntés: a profil + a fájlok + a szerep → a szakasz adata. */
export function arculatNezet({ profil, fajlok, szerep, jovahagyoNev }: NezetBemenet): SzakaszAdat {
  const a = profil.arculat;
  const jov = jovahagyottKep(a);
  const pk = jov ?? a.tervezet ?? null;
  const logok = hasznaltLogok(fajlok, pk?.logok ?? null);
  const vanLogo = LOGO_VALTOZATOK.some((h) => logok[h] !== null);
  // `kesobb` (későbbre hagyott) és `tervezet` = nincs jóváhagyva → 12a/12b; a „Későbbre hagyom” erről a lapról eltűnt (TERV §2-K3)
  const nezet: ArculatNezet = jov ? "kesz" : vanLogo || a.tervezet?.szin_forras === "honlap" ? "talalt" : "ures";
  const alapbol = !jov && !a.tervezet?.elsodleges;
  const t: ArculatTervezet | ArculatPillanatkep = jov ?? (alapbol ? alapTervezet(profil.nev, profil.osszefoglalo, profil.nyelvek?.[0]) : a.tervezet!);
  const szinek = { fo: t.elsodleges, masodik: t.masodlagos, hatter: t.hatter };
  // R-16 K5: ugyanaz a tartalék, mint a képé (vizual/helyzet.ts): üres mező → a másik
  const cimE = t.betu_cim || t.betu_szoveg, szovegE = t.betu_szoveg || t.betu_cim;
  const cim = betuKulcs(cimE), szoveg = betuKulcs(szovegE);
  const db = (cel: FajlMeta["cel"]) => (fajlok ?? []).filter((f) => f.cel === cel).length;
  return {
    nezet,
    szerkesztheto: szerep !== "nezo",
    szinek,
    alapbol,
    betuk: { cim, szoveg, cimSzo: betuSzo(cim), szovegSzo: betuSzo(szoveg), cimSajat: sajatBetuNev(cimE, fajlok), szovegSajat: sajatBetuNev(szovegE, fajlok) },
    logok,
    vanLogo,
    logoHatterek: { vilagos: szinek.hatter, sotet: szinek.fo, negyzetes: szinek.hatter },
    fajlok: { kezikonyv: db("kezikonyv"), minta: db("referencia"), dokumentum: db("dokumentum") },
    forrasCim: t.forras_cim ?? "",
    jovahagyva: jov ? { ido: jov.jovahagyva, ki: jovahagyoNev } : null,
    reszletek: { kepvilag: t.kepvilag, kovetendo: t.kovetendo, kerulendo: t.kerulendo, lekerekites: t.lekerekites },
    elonezet: jov ? null : szinek,
    lepes: a,
  };
}

/** A szakasz adata a munkatérhez; null, ha még nincs jóváhagyott profil (akkor az onboarding jön, mint a /fiok-on). */
export async function arculatAllapot(szervezetId: string, szerep: Szerep): Promise<SzakaszAdat | null> {
  const profil = await profilTar.betolt(szervezetId);
  if (!profil) return null;
  const [fajlok, jovahagyoNev] = await Promise.all([
    fajlTar.lista(szervezetId).catch(() => null), // olvashatatlan lista: a logók a pillanatkép tartalékából, a számok 0
    fiokNeve(profil.jovahagyta).catch(() => ""),
  ]);
  return arculatNezet({ profil, fajlok, szerep, jovahagyoNev });
}
