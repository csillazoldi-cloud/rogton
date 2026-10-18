"use client";
// R-15 · 04 Hírek — „Van valami, amiből posztot csinálhatok?” (design/R15/rajz/R15-lapok-2.dc.html, 04a · 04b; gepezet-2 5, 7–9).
// Első vázlat: DeepSeek (A2), a rajzhoz igazítva: Claude. Csak érdekes hír van a lapon, mindegyikhez kész (vagy egy kattintásra
// elkészülő) poszt. A régi áttekintés (összkép, szűrők, minden hír) a „Hírek beállításai” menüből: /hirfigyelo/osszes.
//   04b (van hír): a kártyán a hír címe és „Posztod: …”; a forrás a „···” › Részletek mögött (05); a fő gomb mellett a nyugtató sor.
//   04a (nincs hír): előbb a hír-tény („Ma nincs új hír nektek” + hány hír nem illett), aztán MIKOR jön hír (napi figyelés sora
//   vagy „Holnap reggel újra nézzük.”), aztán az ajánlat egy fő gombbal: kép a legutóbbi munkáról (Képek · Kész munka).
//   Az első gyűjtés alatt: „Keressük az első híreiteket”, alcím nélkül.
// Utókérés 2 (R15-lapok-2 04a, gepezet-3 2; kerdesek-3 1, Csilla 10-01: elfogadva): a 04a alcíme az, amit ma csinálunk
// (r15.hirek.ures_ajanlat), az ajánlat-kártyán nincs cím; a kihagyott hírek sora, a „Legutóbb … kerestünk”, a nullás heti számláló és a
// „Friss hírek minden reggel” sor a „Miért nincs ma hír?” mögött, helyben nyílik. A heti számláló a cím alatt csak akkor látszik, ha
// legalább az egyik száma nem nulla. A mintakép felirat nélkül (MunkaMinta `fotoResz`).
// R-13 13d3 (design/R13/rajz/R13-lapok.dc.html; gepezet.md 13d): elfogyott kreditnél a „Keress most új híreket” halvány és nem nyomható
// (már a kattintás előtt), alatta halkan, egy kis jellel a kérés mondata; a kártyán és a telefonos alsó sávban a nyugtató sor helyett
// „Ehhez nem kell kredit.” (Q14, 4. kör). Ha a keresés közben fogy el (a gép a keret-hibával áll meg), a lap újraolvassa a kreditet.
// Csilla 10-06 (kerdesek 2): ha a néző maga a tulajdonos, a „szólj a munkatér tulajdonosának” helyett halk link: „Szeretnél több kreditet?” →
// /tagok/kreditek (r13.kredit.tobbet_szeretnel, 0146). A tag mondata változatlan.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import type { R15HirKartya, R15Hirek as Adat } from "../../r15/tipusok";
import { FoGomb, Halad, HalkGomb, HalkLink, Info, KerdesCim, Reszletek, Teendo } from "../_kozos/R15";
import { IdoSzo, nevelo } from "../_kozos/R15Ido";
import { KESZ_MUNKA_CIM, MunkaMinta } from "../_kozos/R15MunkaMinta";
import { NapiHirekSor } from "../_kozos/R15NapiHirek";
import { ElfogyottSor, sajatKreditOlvas } from "../_kozos/R13Kredit";
import type { SajatKredit } from "../../kredit/tipusok";
import "../_kozos/r15-lapok.css";

// c5 (kerdesek-4 · 5, Csilla 10-10): a hír részletei saját lapon; a régi /hirfigyelo/osszes?talalat=… cím változatlanul él
const reszletek = (id: string) => `/hirfigyelo/hir/${encodeURIComponent(id)}`;

/** Kis lenyíló: kívül kattintásra és Esc-re zár. */
/** VJ-1011: ennyi hírkártya látszik elsőre (a többi a „Még n hír” mögött). */
const LATHATO_HIR = 3;
/** … és telefonon, ha van mit hajtani (4+ hír): a T5 miatt kettő. */
const LATHATO_HIR_TEL = 2;

export function Lenyilo({ gomb, children, fel }: { gomb: (nyit: () => void, nyitva: boolean) => React.ReactNode; children: (zar: () => void) => React.ReactNode; fel?: boolean }) {
  const [nyitva, setNyitva] = useState(false);
  const hely = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!nyitva) return;
    const kattint = (e: MouseEvent) => { if (hely.current && !hely.current.contains(e.target as Node)) setNyitva(false); };
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape") setNyitva(false); };
    document.addEventListener("mousedown", kattint);
    document.addEventListener("keydown", bill);
    return () => { document.removeEventListener("mousedown", kattint); document.removeEventListener("keydown", bill); };
  }, [nyitva]);
  return (
    <span className="r15-menu-hely" ref={hely}>
      {gomb(() => setNyitva((v) => !v), nyitva)}
      {nyitva ? <div className={fel ? "r15-menu r15-menu-fel" : "r15-menu"} role="menu">{children(() => setNyitva(false))}</div> : null}
    </span>
  );
}

export function R15Hirek({ adat, kredit, tulajdonos = false }: { adat: Adat; kredit?: SajatKredit | null; /** Csilla 10-06: a tulajdonos a mondat helyett halk linket kap a Kreditek nézetre */ tulajdonos?: boolean }) {
  const { t } = useFeliratok();
  const [elfogyott, setElfogyott] = useState(kredit?.elfogyott === true);
  const nyugtato = elfogyott ? t("r13.kozos.nem_kell_kredit") : t("r15.kozos.nyugtato");
  const router = useRouter();
  const [rejtett, setRejtett] = useState<Set<string>>(new Set());
  const [folyik, setFolyik] = useState<string | null>(null);
  const [keres, setKeres] = useState(false);
  const [bekapcsFut, setBekapcsFut] = useState(false);
  const [miertNyitva, setMiertNyitva] = useState(false);

  const kartyak = adat.kartyak.filter((k) => !rejtett.has(k.talalat_id));
  const n = kartyak.length;
  // VJ-1011 (T5): 4+ hírnél a lap már a forrás-sor előtt is túl sok szó volt (mérve 10-10: 4 kártya 49/62, 6 kártya 55/69 szó, telefon/asztal).
  // Az első HÁROM kártya látszik, a többi a „Még n hír” mögött (ugyanaz a minta, mint a Kezdőlap „Még n javaslat”-a: helyben nyílik).
  // Telefonon 4+ hírnél csak KETTŐ: mérve 10-11, 3 kártya + „Még n hír” = 41 szó (≤ 40); 2 kártya + a link belefér.
  const [mind, setMind] = useState(false);
  const mutatott = mind ? kartyak : kartyak.slice(0, LATHATO_HIR);
  const hajtva = !mind && n > LATHATO_HIR;
  const elso = kartyak[0];

  async function posztra(k: R15HirKartya) {
    if (k.munka_id) { router.push(`/poszt?munka=${encodeURIComponent(k.munka_id)}`); return; }
    setFolyik(k.talalat_id);
    const v = await hivas(`/api/r15/hirek/${encodeURIComponent(k.talalat_id)}/poszt`, "POST", {});
    const id = typeof v.torzs["munka_id"] === "string" ? v.torzs["munka_id"] : null;
    if (id) router.push(`/poszt?munka=${encodeURIComponent(id)}`);
    else setFolyik(null);
  }

  async function jelol(k: R15HirKartya, jeloles: "mentett" | "elrejtett") {
    if (jeloles === "elrejtett") setRejtett((r) => new Set(r).add(k.talalat_id));
    await hivas(`/api/hirfigyelo/talalatok/${encodeURIComponent(k.talalat_id)}/jelol`, "POST", { jeloles });
    router.refresh();
  }

  // „Bekapcsolom” — ugyanaz a végpont és művelet, mint a Kezdőlap sorában (napiFigyelesBe)
  async function bekapcsol() {
    setBekapcsFut(true);
    const v = await hivas("/api/r15/napi-figyeles", "PUT", {});
    setBekapcsFut(false);
    if (v.statusz === 200) router.refresh();
  }

  async function keressMost() {
    setKeres(true);
    await hivas("/api/hirfigyelo/futas", "POST", {});
    // R-13: ha a keresés közben fogyott el a kredit, a gomb ettől kezdve halvány, alatta a mondat (13d3)
    const k = await sajatKreditOlvas();
    if (k?.elfogyott) setElfogyott(true);
    router.refresh();
  }

  function pontok(k: R15HirKartya) {
    return (
      <Lenyilo
        gomb={(nyit, nyitva) => (
          <button type="button" className="r15-pontok" aria-haspopup="menu" aria-expanded={nyitva}
            aria-label={`${t("r15.kozos.reszletek")}, ${t("r15.hirek.elmentem")}, ${t("r15.hirek.nem_erdekel")}`} onClick={nyit}>···</button>
        )}
      >
        {(zar) => (
          <>
            <a className="r15-menu-sor" role="menuitem" href={reszletek(k.talalat_id)}>{t("r15.kozos.reszletek")}</a>
            {!k.mentett ? (
              <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { zar(); void jelol(k, "mentett"); }}>{t("r15.hirek.elmentem")}</button>
            ) : null}
            <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { zar(); void jelol(k, "elrejtett"); }}>{t("r15.hirek.nem_erdekel")}</button>
          </>
        )}
      </Lenyilo>
    );
  }

  const halad = { poszt: adat.halad.poszt_kesz, kep: adat.halad.kep_letoltve };

  const miertLink = (
    <HalkLink onClick={() => setMiertNyitva((x) => !x)} aria-expanded={miertNyitva}>{t("r15.hirek.miert_nincs")}</HalkLink>
  );

  const linkek = (
    <div className="r15-linksor">
      {n === 0 ? <span className="r15-csak-asztal">{miertLink}</span> : null}
      <HalkLink onClick={() => void keressMost()} disabled={keres || adat.fut || !adat.szerkeszthet || elfogyott}>{t("r15.hirek.keress_most")}</HalkLink>
      <Lenyilo
        fel
        gomb={(nyit, nyitva) => (
          <HalkLink onClick={nyit} aria-haspopup="menu" aria-expanded={nyitva}>{t("r15.hirek.beallitasok")}</HalkLink>
        )}
      >
        {() => (
          <>
            <a className="r15-menu-sor" role="menuitem" href="/hirfigyelo/osszes#osszkep">{t("r15.hirek.miert_ezek")}</a>
            <a className="r15-menu-sor" role="menuitem" href="/hirfigyelo/beallitas">{t("r15.hirek.mit_figyeljunk")}</a>
            {/* Kati #17 / Csilla #40, döntés 10-06: a „Találatok pontosítása” lap lekerült Tibor útjáról — a menüsor nincs; a lap és az útja megmarad */}
            <a className="r15-menu-sor" role="menuitem" href="/hirfigyelo/osszes?szuro=mentett">{t("r15.hirek.elmentett")}</a>
          </>
        )}
      </Lenyilo>
    </div>
  );

  if (n === 0) {
    // 04a — gepezet-3 2. Az első gyűjtés alatt: „Keressük az első híreiteket”, alcím nélkül (gepezet-2 5).
    const alcim = adat.elso_gyujtes ? undefined : t("r15.hirek.ures_ajanlat");
    const nullasHet = adat.halad.poszt_kesz === 0 && adat.halad.kep_letoltve === 0;
    // „Miért nincs ma hír?” — helyben nyíló részletek (rajz 04a, „MIÉRT NINCS MA HÍR?” panel): a kihagyott hírek, a legutóbbi keresés,
    // a nullás heti számláló és a napi hírek sora (ki → „Bekapcsolom · Mi ez?”; be → „Holnap reggel újra nézzük.”).
    const miert = miertNyitva ? (
      <Reszletek>
        <div className="r15h-miert">
          {adat.kihagyott > 0 ? <p>{t("r15.hirek.kihagytuk", { n: adat.kihagyott })}</p> : null}
          {adat.utolso_kereses_nap !== null ? <p>{t("r15.kozos.legutobb", { mikor: IdoSzo(t, adat.utolso_kereses_nap) })}</p> : null}
          {nullasHet ? <p>{t("r15.kozos.halad_ures")}</p> : null}
          {adat.napi_figyeles === "ki" && adat.szerkeszthet ? (
            <NapiHirekSor osztaly="r15h-miert-napi" onBekapcsol={() => void bekapcsol()} folyik={bekapcsFut} />
          ) : adat.napi_figyeles === "be" ? (
            <p>{t("r15.hirek.holnap_ujra")}</p>
          ) : null}
        </div>
      </Reszletek>
    ) : null;
    return (
      <main className="km-lap-keret r15-lap r15h-lap r15-lapok2">
        <div className="r15-lap-belso r15h-ures">
          {/* telefonon ez az első képernyő; a „Keress most…” és a „Hírek beállításai” alatta, görgetésre (kerdesek-2 7) */}
          <div className="r15h-elso-kepernyo">
            <div className="r15-fej">
              <KerdesCim cim={adat.elso_gyujtes ? t("r15.hirek.elso_kerdes") : t("r15.hirek.ures_kerdes")} {...(alcim ? { alcim } : {})} />
              {/* kerdesek-3 1: a számláló csak akkor, ha van mit mutatni; nullánál a „Miért nincs ma hír?” mögött */}
              {nullasHet ? null : <Halad arany={adat.halad.arany}>{t("r15.kozos.halad_rovid", halad)}</Halad>}
            </div>
            {/* kerdesek-2 5 — a fő gomb nem a „Keress most új híreket”: Képek · Kész munka (gepezet-2 4) */}
            <Teendo osztaly="r15h-ajanlat">
              <MunkaMinta osztaly="r15h-ajanlat-kep" fotoResz />
              <div className="r15h-ajanlat-szoveg r15-csak-asztal">
                <p className="r15h-ajanlat-mondat">{t("r15.kozos.foto_munka")}</p>
                <FoGomb href={KESZ_MUNKA_CIM} osztaly="r15h-ajanlat-gomb">{t("r15.kozos.kepet_keszitek_munka")}</FoGomb>
              </div>
            </Teendo>
            <div className="r15-csak-tel">
              <div className="r15h-miert-tel">
                {miertLink}
                {miert}
              </div>
            </div>
          </div>
          {linkek}
          {elfogyott ? <ElfogyottSor>{tulajdonos ? <HalkLink href="/tagok/kreditek">{t("r13.kredit.tobbet_szeretnel")}</HalkLink> : t("r13.kredit.elfogyott")}</ElfogyottSor> : null}
          <div className="r15-csak-asztal">{miert}</div>
        </div>
        <div className="r15-also-sav">
          <FoGomb href={KESZ_MUNKA_CIM}>{t("r15.kozos.kepet_keszitek_munka")}</FoGomb>
        </div>
      </main>
    );
  }

  return (
    <main className="km-lap-keret r15-lap r15h-lap r15-lapok2">
      <div className="r15-lap-belso">
        <div className="r15-fej">
          <KerdesCim cim={t("r15.hirek.kerdes", { n, az: nevelo(n) })} />
          <Halad arany={adat.halad.arany}>{t("r15.kozos.halad_rovid", halad)}</Halad>
        </div>

        <div className="r15h-racs">
          {mutatott.map((k, i) => (
            <Teendo key={k.talalat_id} osztaly={hajtva && i >= LATHATO_HIR_TEL ? "r15-kartya r15h-kartya r15-csak-asztal" : "r15-kartya r15h-kartya"}>
              {/* gepezet-2 9 / kerdesek-2 9: a forrás a „···” › Részletek mögött; a cím is a Részletekre visz */}
              <a className="r15-kartya-cim" href={reszletek(k.talalat_id)} title={k.cim}>{k.rovid_cim || k.cim}</a>
              {/* Kati 10-10 #4 („honnan a hír?”, Csilla 19:56): egy halk forrás-sor — tájékoztatás (T6): se keret, se gomb.
                  RÖVIDÍTVE csak a domain (a 05 „domain · idő” formája helyett): mérve 10-10, 4 és 6 kártyával az idő asztalon +10 szót adott
                  (4 kártya: 62 → 82), a domain +4-et. CSAK ASZTALON: a jóváhagyott 04b telefonos rajza 40/40 szónál van (az „Ötlet” sorral) —
                  egyetlen szó is pirosra vinné (mérve: 41). Telefonon a forrás egy koppintásra, a 05 első sorában. */}
              <Info osztaly="r15h-forras r15-csak-asztal">{k.forras_nev}</Info>
              {k.otlet ? (
                <p className={i === 0 ? "r15-kartya-mut" : "r15-kartya-mut r15-csak-asztal"}>{t("r15.hirek.posztod", { otlet: k.otlet })}</p>
              ) : null}
              <div className="r15-kartya-kitolt r15-csak-asztal" />
              <div className="r15-kartya-gombsor r15-csak-asztal">
                {i === 0 ? (
                  <FoGomb posztra onClick={() => void posztra(k)} disabled={folyik !== null}>{t("r15.hirek.atnezem_posztot")}</FoGomb>
                ) : (
                  <HalkGomb posztra osztaly="r15h-halk-nagy" onClick={() => void posztra(k)} disabled={folyik !== null}>{t("r15.hirek.atnezem")}</HalkGomb>
                )}
                {pontok(k)}
              </div>
              {/* gepezet-2 8 — a nyugtató sor a fő gomb alatt; a többi kártyán ugyanakkora üres hely (a gombsorok egy vonalban) */}
              {i === 0 ? (
                <Info osztaly="r15-csak-asztal">{nyugtato}</Info>
              ) : (
                <span className="r15h-info-hely r15-csak-asztal" aria-hidden="true" />
              )}
              {i > 0 ? (
                <span className="r15-csak-tel r15h-tel-gomb">
                  <HalkGomb posztra onClick={() => void posztra(k)} disabled={folyik !== null}>{t("r15.hirek.atnezem")}</HalkGomb>
                </span>
              ) : null}
            </Teendo>
          ))}
        </div>
        {hajtva ? (
          <>
            <span className="r15-sor-tobb r15-csak-asztal">
              <HalkLink onClick={() => setMind(true)} aria-expanded={false}>{t("r15.hirek.meg_hir", { n: n - LATHATO_HIR })}</HalkLink>
            </span>
            <span className="r15-sor-tobb r15-csak-tel">
              <HalkLink onClick={() => setMind(true)} aria-expanded={false}>{t("r15.hirek.meg_hir", { n: n - LATHATO_HIR_TEL })}</HalkLink>
            </span>
          </>
        ) : null}

        <div className="r15-alja r15-csak-asztal">
          {adat.utolso_kereses_nap !== null ? <Info>{t("r15.hirek.legutobb_rovid", { mikor: IdoSzo(t, adat.utolso_kereses_nap) })}</Info> : null}
          {linkek}
          {elfogyott ? <ElfogyottSor>{tulajdonos ? <HalkLink href="/tagok/kreditek">{t("r13.kredit.tobbet_szeretnel")}</HalkLink> : t("r13.kredit.elfogyott")}</ElfogyottSor> : null}
        </div>
        {elfogyott ? (
          // 13d3 telefon: a kártya alatt a halvány „Keress most új híreket” és a mondat (a „Hírek beállításai” itt nincs a rajzon)
          <div className="r15-csak-tel r13d-tel-keres">
            <HalkLink disabled>{t("r15.hirek.keress_most")}</HalkLink>
            <ElfogyottSor>{tulajdonos ? <HalkLink href="/tagok/kreditek">{t("r13.kredit.tobbet_szeretnel")}</HalkLink> : t("r13.kredit.elfogyott")}</ElfogyottSor>
          </div>
        ) : null}
      </div>

      {elso ? (
        <div className="r15-also-sav">
          <div className="r15-also-nyugtato"><Info>{nyugtato}</Info></div>
          <FoGomb posztra onClick={() => void posztra(elso)} disabled={folyik !== null}>{t("r15.hirek.atnezem_elsot")}</FoGomb>
        </div>
      ) : null}
    </main>
  );
}
