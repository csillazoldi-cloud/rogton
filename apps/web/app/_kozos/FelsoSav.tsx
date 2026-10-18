"use client";
// R-18 arculatfrissítés (2026-10-11, Csilla; rajz: Claude Design „Posztgyár · sötét/világos”, A-/B-*.dc.html; design/R18-arculatfrissites/
// IRANYOK.md + IRANYOK-round4.md): a felső sáv új rendje. Csak a navigáció rendeződött át — minden korábbi lap, út és művelet megvan.
//   Asztal: a/t jel + termék neve NAGYBETŰVEL (fejlec.termeknev) · Kezdőlap · Hírek · Posztszöveg · Képek · „Profil ▾” (Iránytű, Szervezet
//   adatai, Beállítások) · „Cégeim ▾” CSAK egynél több cégnél (cégváltás: a meglévő POST /api/szervezet/valt) · mód-váltó · harang a számmal
//   (a régi „Értesítések” menüpont helyett, ugyanoda visz) · „Kovács Tibor ▾” fiókmenü. A régi cég-gomb a sávból kikerült: a váltás a Cégeimbe,
//   a Tagok és a Visszajelzések sor a fiókmenübe költözött (nem tűnt el semmi).
//   Telefon: jel + név · az aktuális lap neve narancs aláhúzással (ha nem fér ki a név mellé, elbújik — a ☰ lapon jelölve marad) · harang · ☰.
//   A ☰ lap: fő menü · PROFIL · CÉGEIM (egynél több cégnél) · a fiók sorai · mód-sor; alul ragad a Nyelv · Kijelentkezés (VJ-1011).
// Előzmény: F-2 (R-1 v3), R-7b (egy modulnál közvetlen Hírek, több modulnál Modulok lenyíló), R-9, R-12, R-15, VJ-1011. Minden szöveg feliratkulcsból.

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { apiHivas } from "./hibaszoveg";
import { useFeliratok } from "../../nyelv/kliens";
import { Nyelvvalaszto } from "./Nyelvvalaszto";
import { KilepesGomb } from "../szervezet/uj/KilepesGomb";
import { R15Javitva, type JavitottTetel } from "./R15Javitva";
import { R15Ikon } from "./R15Ikon";
import { ModValto } from "./ModValto";
import { HalvanyLogo } from "./HalvanyLogo";
import { Marka } from "./Marka";
import { Visszajelzes, VISSZAJELZES_INDIT } from "./Visszajelzes"; // R-9: a Visszajelzés modul minden belépett lapon

type AktivLap = "kezdolap" | "ugyfelprofil" | "poszt" | "kepek" | "naptar" | "iranytu" | "gephaz" | "modul" | "sajat" | "hirek" | "visszajelzes" | "beallitasok" | "nincs";
type Nyitott = "profil" | "cegeim" | "modulok" | "fiok" | "lap" | null;

/** A telefonos sávban kiírt lapnév kulcsa (R-18: „the active page label visible”). */
const LAPNEV: Partial<Record<AktivLap, string>> = {
  kezdolap: "r15.nav.kezdolap", hirek: "r15.nav.hirek", modul: "r15.nav.hirek", poszt: "r15.nav.poszt", kepek: "r15.nav.kepek", naptar: "r15.nav.naptar",
  iranytu: "r15.nav.iranytu", ugyfelprofil: "r15.nav.szervezet", gephaz: "r15.nav.beallitasok", sajat: "nav.sajat_fiok", visszajelzes: "nav.visszajelzesek",
  beallitasok: "r15.nav.beallitasok", // R-18 8. kör: a Beállítások lap (Round 8 rajz) — telefonon a lapnév, asztalon nincs kiemelt menüpont
};
const PROFIL_LAPOK: readonly AktivLap[] = ["iranytu", "ugyfelprofil", "gephaz"];

/** Beállítások: fogaskerék (a rajz Profil menüjéből). */
const Fogaskerek = () => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="r15-ikon">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const Pipa = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="r15-ikon">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const Harang = () => (
  <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export function FelsoSav({ adat, aktiv, javitott = [] }: { adat: FelsoSavAdat; aktiv: AktivLap; /** c7 (R-15 c5 2. kör): csak a Kezdőlap adja — a saját, tegnap óta javított jelzések */ javitott?: JavitottTetel[] }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const [nyitott, setNyitott] = useState<Nyitott>(null);
  const lapRef = useRef<HTMLDivElement>(null);
  const holRef = useRef<HTMLDivElement>(null);
  const [holRejtve, setHolRejtve] = useState(false);

  const bezar = useCallback(() => setNyitott(null), []);
  const valt = (mi: Exclude<Nyitott, null>) => setNyitott((v) => (v === mi ? null : mi));

  useEffect(() => {
    function kattintas(e: MouseEvent) {
      // a nyitott lenyílón / ☰ lapon belüli és a nyitógombra eső kattintás nem zár (a gomb maga vált); minden más igen
      const cel = e.target as HTMLElement | null;
      if (cel?.closest?.("[data-r18-menu], [data-r18-nyito]")) return;
      bezar();
    }
    function billentyu(e: KeyboardEvent) {
      if (e.key === "Escape") bezar();
    }
    document.addEventListener("mousedown", kattintas);
    document.addEventListener("keydown", billentyu);
    return () => {
      document.removeEventListener("mousedown", kattintas);
      document.removeEventListener("keydown", billentyu);
    };
  }, [bezar]);

  // A ☰ lap nyitásakor a fókusz a lap első sorára kerül (billentyűzettel is végigjárható).
  useEffect(() => {
    if (nyitott === "lap") lapRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [nyitott]);

  // R-18 round 4: telefonon, ha a termék neve és a lapnév nem fér el egymás mellett (RO „FABRICA DE POSTĂRI”), a lapnév elbújik.
  useLayoutEffect(() => {
    const hol = holRef.current;
    if (!hol) return;
    const mer = () => {
      // a lapnév nem fér ki, ha a doboza túlcsordul (overflow: hidden mellett a scrollWidth a tartalom teljes szélessége)
      setHolRejtve(hol.firstElementChild ? hol.scrollWidth > hol.clientWidth + 1 : false);
    };
    mer();
    const ro = new ResizeObserver(mer);
    ro.observe(hol);
    return () => ro.disconnect();
  }, [aktiv]);

  async function valtMunkater(szervezetId: string) {
    bezar();
    if (szervezetId === adat.munkater.id) return;
    await apiHivas("/api/szervezet/valt", { szervezet_id: szervezetId });
    router.push("/kezdolap");
    router.refresh();
  }

  const szerepJelveny = adat.fiok.rendszergazda
    ? "nav.szerep_rendszergazda"
    : adat.szerep === "nezo"
      ? "nav.szerep_nezo"
      : null;

  const szerepek = [
    adat.szerep !== "nezo" ? t(`nav.szerep_${adat.szerep}`) : null,
    adat.fiok.rendszergazda ? t("nav.szerep_rendszergazda") : null,
  ].filter(Boolean);

  const vanHirfigyelo = adat.modulok.includes("hirfigyelo");
  const egyModul = adat.modulok.length <= 1 && vanHirfigyelo;
  const tobbCeg = adat.munkaterek.length > 1;
  const profilAktiv = PROFIL_LAPOK.includes(aktiv);
  const lapnev = LAPNEV[aktiv];
  const harangCimke = adat.ertesites_olvasatlan > 0
    ? t("nav.ertesitesek_szammal", { n: adat.ertesites_olvasatlan })
    : t("nav.ertesitesek");
  const navOsztaly = (lap: AktivLap) => (aktiv === lap ? "r18-nav-a aktiv km-sav-nav-aktiv" : "r18-nav-a km-sav-nav-link");

  const profilSorok = (bezaro: () => void) => (
    <>
      <Link href="/iranytu" className={aktiv === "iranytu" ? "r18-menu-sor aktiv" : "r18-menu-sor"} role="menuitem" aria-current={aktiv === "iranytu" ? "page" : undefined} onClick={bezaro}>
        <R15Ikon nev="iranytu" /><span>{t("r15.nav.iranytu")}</span>
      </Link>
      <Link href="/fiok" className={aktiv === "ugyfelprofil" ? "r18-menu-sor aktiv" : "r18-menu-sor"} role="menuitem" aria-current={aktiv === "ugyfelprofil" ? "page" : undefined} onClick={bezaro}>
        <R15Ikon nev="szervezet" /><span>{t("r15.nav.szervezet")}</span>
      </Link>
      {adat.gephaz && (
        <Link href="/gephaz" className={aktiv === "gephaz" ? "r18-menu-sor aktiv" : "r18-menu-sor"} role="menuitem" aria-current={aktiv === "gephaz" ? "page" : undefined} onClick={bezaro}>
          <Fogaskerek /><span>{t("r15.nav.beallitasok")}</span>
        </Link>
      )}
    </>
  );

  const cegSorok = adat.munkaterek.map((m) => (
    <button
      key={m.id}
      type="button"
      className={m.id === adat.munkater.id ? "r18-menu-sor aktiv-ceg" : "r18-menu-sor"}
      role="menuitemradio"
      aria-checked={m.id === adat.munkater.id}
      onClick={() => void valtMunkater(m.id)}
    >
      <span className="r18-ceg-pipa">{m.id === adat.munkater.id ? <Pipa /> : null}</span>
      <span className="r18-menu-szoveg">{m.nev}</span>
    </button>
  ));

  return (
    <>
    <header className="km-sav r18-sav">
      <div className="km-sav-belso">
        {/* Bal: termékjel + név — a Kezdőlapra visz (Kati 10-05 #1) */}
        <Marka nev={t("fejlec.termeknev")} href="/kezdolap" cimke={t("fejlec.haza", { nev: t("fejlec.termeknev") })} osztaly="km-sav-haza" />

        {/* Telefon: az aktuális lap neve narancs aláhúzással */}
        <div className={holRejtve ? "r18-hol r18-hol-rejtve" : "r18-hol"} ref={holRef} aria-hidden={holRejtve || !lapnev ? true : undefined}>
          {lapnev ? <span className="r18-hol-lap">{t(lapnev)}</span> : null}
        </div>

        {/* Közép: navigáció (asztal) */}
        <nav className="r18-nav km-sav-nav" aria-label={t("nav.menu")}>
          <Link href="/kezdolap" className={navOsztaly("kezdolap")} aria-current={aktiv === "kezdolap" ? "page" : undefined}>
            {t("r15.nav.kezdolap")}
          </Link>
          {egyModul ? (
            <Link href="/hirfigyelo" className={navOsztaly("hirek")} aria-current={aktiv === "hirek" ? "page" : undefined}>
              <span>{t("r15.nav.hirek")}</span>
              {/* R-15 (gepezet 8): egy szám — ugyanaz, mint a Hírek lap címe */}
              {adat.uj_talalat > 0 && <span className="r18-szam km-sav-nav-szam">{adat.uj_talalat}</span>}
            </Link>
          ) : vanHirfigyelo ? (
            <div className="r18-nav-lenyilo">
              <button type="button" className={aktiv === "hirek" || aktiv === "modul" ? "r18-nav-a aktiv" : "r18-nav-a"} data-r18-nyito aria-haspopup="menu" aria-expanded={nyitott === "modulok"} onClick={() => valt("modulok")}>
                <span>{t("nav.modulok")}</span>
                <span className="r18-nyil" aria-hidden="true">▾</span>
              </button>
              {nyitott === "modulok" && (
                <div className="r18-legordulo" role="menu" data-r18-menu>
                  <Link href="/hirfigyelo" className="r18-menu-sor" role="menuitem" onClick={bezar}>
                    <span>{t("hf.modTitle")}</span>
                    {adat.uj_talalat > 0 && <span className="r18-szam">{t("nav.uj_talalat_jelzes", { n: adat.uj_talalat })}</span>}
                  </Link>
                </div>
              )}
            </div>
          ) : null}
          {/* R-11/A: Posztszöveg */}
          <Link href="/poszt" className={navOsztaly("poszt")} aria-current={aktiv === "poszt" ? "page" : undefined}>
            <span>{t("r15.nav.poszt")}</span>
            {adat.poszt_varo > 0 && <span className="r18-szam km-sav-nav-szam">{adat.poszt_varo}</span>}
          </Link>
          {/* VZ-1: Képek */}
          <Link href="/kepek" className={navOsztaly("kepek")} aria-current={aktiv === "kepek" ? "page" : undefined}>
            {t("r15.nav.kepek")}
          </Link>
          {/* R-18 3. kör: Naptár — a Képek és a Profil között (rajz: „Naptár …”) */}
          <Link href="/naptar" className={navOsztaly("naptar")} aria-current={aktiv === "naptar" ? "page" : undefined}>
            {t("r15.nav.naptar")}
          </Link>
          {/* R-18: Profil ▾ — Iránytű, Szervezet adatai, Beállítások (az utak változatlanok, csak a menüpont költözött) */}
          <div className="r18-nav-lenyilo">
            <button type="button" className={profilAktiv ? "r18-nav-a aktiv" : "r18-nav-a"} data-r18-nyito aria-haspopup="menu" aria-expanded={nyitott === "profil"} onClick={() => valt("profil")}>
              <span>{t("nav.profil")}</span>
              <span className="r18-nyil" aria-hidden="true">▾</span>
            </button>
            {nyitott === "profil" && (
              <div className="r18-legordulo" role="menu" aria-label={t("nav.profil")} data-r18-menu>
                {profilSorok(bezar)}
              </div>
            )}
          </div>
          {/* R-18 round 4: Cégeim ▾ — CSAK egynél több cégnél; a jelenlegi pipával, választásra cégváltás */}
          {tobbCeg && (
            <div className="r18-nav-lenyilo">
              <button type="button" className="r18-nav-a" data-r18-nyito aria-haspopup="menu" aria-expanded={nyitott === "cegeim"} onClick={() => valt("cegeim")}>
                <span>{t("nav.cegeim")}</span>
                <span className="r18-nyil" aria-hidden="true">▾</span>
              </button>
              {nyitott === "cegeim" && (
                <div className="r18-legordulo r18-legordulo-ceg" role="menu" aria-label={t("nav.cegeim")} data-r18-menu>
                  {cegSorok}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Jobb: javított jelzések (c7) · mód-váltó · harang · fiókmenü */}
        <div className="r18-jobb km-sav-jobb">
          <R15Javitva tetelek={javitott} osztaly="r15jv-asztal" />
          <ModValto valtozat="gomb" />
          <Link href="/beallitasok" className="r18-csengo km-sav-ertesites" aria-label={harangCimke} title={harangCimke}>
            <Harang />
            {adat.ertesites_olvasatlan > 0 && <span className="r18-csengo-szam">{t("ertesites.harang_szam", { n: adat.ertesites_olvasatlan })}</span>}
          </Link>
          <div className="r18-fiok-blokk">
            <button type="button" className="r18-gh km-sav-fiok-gomb" data-r18-nyito aria-haspopup="menu" aria-expanded={nyitott === "fiok"} onClick={() => valt("fiok")} title={adat.fiok.nev}>
              <span>{adat.fiok.nev}</span>
              <span className="r18-nyil" aria-hidden="true">▾</span>
            </button>
            {nyitott === "fiok" ? (
              <div className="r18-legordulo r18-legordulo-fiok km-sav-fiok-lenyilo" role="menu" data-r18-menu>
                <Link href="/sajat-fiok" role="menuitem" className="r18-menu-sor r18-menu-fej" onClick={bezar}>
                  <span className="r18-menu-szoveg">{adat.fiok.nev}</span>
                  {szerepJelveny && <span className="r18-menu-szerep">{t(szerepJelveny)}</span>}
                </Link>
                {adat.tagok ? (
                  // F-3f: a Tagok sor (a régi cég-lenyílóból költözött; a nézőnek nincs)
                  <Link href="/tagok" role="menuitem" className="r18-menu-sor" onClick={bezar}>
                    <span className="r18-menu-szoveg">{t("nav.tagok")}</span>
                    <span className="r18-menu-szerep">{t("nav.tagok_szam", { n: adat.tagok.n, m: adat.tagok.m })}</span>
                  </Link>
                ) : null}
                {adat.gephaz ? (
                  // R-9: a Visszajelzések lap (a régi cég-lenyílóból költözött)
                  <Link href="/visszajelzes" role="menuitem" className="r18-menu-sor" onClick={bezar}>
                    <span>{t("nav.visszajelzesek")}</span>
                  </Link>
                ) : null}
                <div className="r18-menu-nyelv"><Nyelvvalaszto /></div>
                <button
                  type="button"
                  role="menuitem"
                  className="r18-menu-sor"
                  onClick={() => {
                    bezar();
                    window.dispatchEvent(new Event(VISSZAJELZES_INDIT));
                  }}
                >
                  {t("vj.gomb")}
                </button>
                <div className="r18-menu-kilep"><KilepesGomb /></div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Telefon: javított jelzések · harang · ☰ */}
        <div className="r18-tel km-sav-telefon">
          <R15Javitva tetelek={javitott} osztaly="r15jv-tel" />
          <Link href="/beallitasok" className="r18-csengo" aria-label={harangCimke}>
            <Harang />
            {adat.ertesites_olvasatlan > 0 && <span className="r18-csengo-szam">{t("ertesites.harang_szam", { n: adat.ertesites_olvasatlan })}</span>}
          </Link>
          <button
            type="button"
            className="r18-menu-t km-sav-hamburger"
            data-r18-nyito
            aria-label={nyitott === "lap" ? t("nav.menu_bezar") : t("nav.menu")}
            aria-expanded={nyitott === "lap"}
            onClick={() => valt("lap")}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>

      {nyitott === "lap" && (
        <>
          <div className="r18-fatyol" aria-hidden="true" onMouseDown={bezar} />
          <div className="r18-lap km-sav-telefon-menu" role="dialog" aria-modal="true" aria-label={t("nav.menu")} ref={lapRef} data-r18-menu>
            <div className="r18-lap-fej">
              <button type="button" className="r18-menu-t" aria-label={t("nav.menu_bezar")} onClick={bezar}>
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <Link href="/kezdolap" className={aktiv === "kezdolap" ? "r18-menu-sor aktiv" : "r18-menu-sor"} aria-current={aktiv === "kezdolap" ? "page" : undefined} onClick={bezar}>
              {t("r15.nav.kezdolap")}
            </Link>
            {egyModul ? (
              <Link href="/hirfigyelo" className={aktiv === "hirek" ? "r18-menu-sor aktiv" : "r18-menu-sor"} aria-current={aktiv === "hirek" ? "page" : undefined} onClick={bezar}>
                <span>{t("r15.nav.hirek")}</span>
                {adat.uj_talalat > 0 && <span className="r18-szam r18-szam-jobb">{adat.uj_talalat}</span>}
              </Link>
            ) : vanHirfigyelo ? (
              <>
                <div className="r18-menu-cim">{t("nav.modulok")}</div>
                <Link href="/hirfigyelo" className="r18-menu-sor" onClick={bezar}>
                  <span>{t("hf.modTitle")}</span>
                  {adat.uj_talalat > 0 && <span className="r18-szam r18-szam-jobb">{t("nav.uj_talalat_jelzes", { n: adat.uj_talalat })}</span>}
                </Link>
              </>
            ) : null}
            <Link href="/poszt" className={aktiv === "poszt" ? "r18-menu-sor aktiv" : "r18-menu-sor"} aria-current={aktiv === "poszt" ? "page" : undefined} onClick={bezar}>
              <span>{t("r15.nav.poszt")}</span>
              {adat.poszt_varo > 0 && <span className="r18-szam r18-szam-jobb">{adat.poszt_varo}</span>}
            </Link>
            <Link href="/kepek" className={aktiv === "kepek" ? "r18-menu-sor aktiv" : "r18-menu-sor"} aria-current={aktiv === "kepek" ? "page" : undefined} onClick={bezar}>
              {t("r15.nav.kepek")}
            </Link>
            <Link href="/naptar" className={aktiv === "naptar" ? "r18-menu-sor aktiv" : "r18-menu-sor"} aria-current={aktiv === "naptar" ? "page" : undefined} onClick={bezar}>
              {t("r15.nav.naptar")}
            </Link>

            <div className="r18-menu-cim">{t("nav.profil")}</div>
            {profilSorok(bezar)}

            {tobbCeg && (
              <>
                <div className="r18-menu-cim">{t("nav.cegeim")}</div>
                {cegSorok}
              </>
            )}

            {/* A fiók sorai (a régi telefonos menüből — semmi nem maradt ki) */}
            <div className="r18-menu-cim">{adat.fiok.nev}</div>
            <Link href="/sajat-fiok" className={aktiv === "sajat" ? "r18-menu-sor aktiv" : "r18-menu-sor"} onClick={bezar}>
              <span className="r18-menu-szoveg">{t("nav.sajat_fiok_sor", { nev: t("nav.sajat_fiok"), szerepek: szerepek.join(" · ") })}</span>
            </Link>
            {adat.tagok !== null && (
              <Link href="/tagok" className="r18-menu-sor" onClick={bezar}>{t("nav.tagok")}</Link>
            )}
            {adat.gephaz && (
              <Link href="/visszajelzes" className={aktiv === "visszajelzes" ? "r18-menu-sor aktiv" : "r18-menu-sor"} aria-current={aktiv === "visszajelzes" ? "page" : undefined} onClick={bezar}>
                {t("nav.visszajelzesek")}
              </Link>
            )}
            <button
              type="button"
              className="r18-menu-sor"
              onClick={() => {
                bezar();
                window.dispatchEvent(new Event(VISSZAJELZES_INDIT));
              }}
            >
              {t("vj.gomb")}
            </button>

            <div className="r18-menu-elval" aria-hidden="true" />
            <ModValto valtozat="sor" />

            <div className="km-sav-telefon-alul">
              <Nyelvvalaszto className="km-sav-nyelv" />
              <KilepesGomb />
            </div>
          </div>
        </>
      )}
      {/* R-9: a Visszajelzés modul minden belépett lapon */}
      <Visszajelzes />
    </header>
    {/* R-18: a halvány aitmetica felirat a lap alján, a Visszajelzés gomb közelében (díszítés) — a sávon KÍVÜL, hogy a tartalom
        mögé kerüljön (a sáv saját rétege a tartalom fölött van) */}
    <HalvanyLogo />
    </>
  );
}
