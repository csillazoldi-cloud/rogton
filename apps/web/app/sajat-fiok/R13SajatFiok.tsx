"use client";
// R-13 · 13a Saját fiók — az új szakaszok a lap tetején (design/R13/rajz/R13-lapok.dc.html 13a1 · 13a2 · 13a3; gepezet.md 13a).
// Alattuk az R-3 v2 blokkok változatlanul (SajatFiok.tsx).
//   13a1/13a2: „Ilyen hírekből írunk neked posztot” — a gép mai válogatása két sima mondatban (fokozat a hellyel és a témákkal ·
//     előválogatás), mellette „Átírom”; alatta a fő gomb a hírekhez, egy halk kredit-sor „Részletek”-kel és a pénz-mondat.
//     Az „Átírom” helyben nyílik: három fokozat + a „Gyors előválogatás” kapcsoló; minden változás magától mentődik
//     (PUT /api/hirfigyelo/sajat-szures), nincs Mentés gomb; a „Kész” csak becsuk.
//     A „Részletek” a Kreditjeid szakaszt nyitja helyben: szám, sáv, „Elment rá:” legfeljebb 4 sor (GET /api/kredit/sajat bontása).
//     Telefonon a kreditek görgetés alatt (a rajz „TELEFON · LEJJEBB GÖRGETVE” kerete); az alsó sávban „Ha jó így, nincs dolgod.”
//   13a3: elfogyott a saját kredit — egy teendő: a kész posztok (ahhoz nem kell kredit); halkan, honnan lesz több
//     (tulajdonos: a Kreditek lapon; szerkesztő/néző: szóljon a tulajdonosnak — kerdesek 2).
//     Csilla 10-06: alatta a hírek beállítása halványan (--szakasz-halvany), de használható.
// A „szűr*” szó soha nem látható (T3, kerdesek 1). A kihagyott hírek listája nem látszik (Vilmos).
import { useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import { FoGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import { Kapcsolo } from "../_kozos/Kapcsolo";
import { useKreditSzam } from "../_kozos/R13Kredit";
import { fokozatMondat } from "../_kozos/r13-szabaly";
import type { SajatKredit } from "../../kredit/tipusok";
import type { SajatSzuresNezet } from "../../hirfigyelo/sajat-szures-nezet";
import "../_kozos/r15-lapok.css";
import "../_kozos/r13.css";

type Fokozat = SajatSzuresNezet["fokozat"];
const FOKOZATOK: Fokozat[] = ["nagyon_szigoru", "kozepes", "laza"];

export function R13SajatFiok({ szures: kezdo, kredit, tulajdonos }: { szures: SajatSzuresNezet; kredit: SajatKredit; tulajdonos: boolean }) {
  const { t } = useFeliratok();
  const szam = useKreditSzam();
  const [sz, setSz] = useState(kezdo);
  const [atirom, setAtirom] = useState(false);
  const [reszletek, setReszletek] = useState(false);
  const [hiba, setHiba] = useState(false);

  async function ment(uj: { fokozat: Fokozat; eloszures: boolean }) {
    const elozo = sz;
    setSz((x) => ({ ...x, ...uj }));
    setHiba(false);
    const v = await hivas("/api/hirfigyelo/sajat-szures", "PUT", uj);
    if (v.statusz !== 200) { setSz(elozo); setHiba(true); }
  }

  const kreditSor = t("r13.kezdolap.kredit_sor", { maradt: szam(kredit.maradt), havi: szam(kredit.havi) });
  const kreditSorRovid = t("r13.kezdolap.kredit_sor_rovid", { maradt: szam(kredit.maradt), havi: szam(kredit.havi) });
  const arany = kredit.havi > 0 ? Math.max(0, Math.min(1, kredit.maradt / kredit.havi)) : 0;

  // „Részletek” → a Kreditjeid szakasz helyben (13a1 jobb oldali panel): szám, sáv, „Elment rá:” 4 sor
  const kreditReszletek = (
    <section className="r13a-kredit-panel" data-r15="reszletek" aria-label={t("r13.kredit.cim")}>
      <h2 className="r13-szakasz-cim">{t("r13.kredit.cim")}</h2>
      <p className="r13a-nagyszam">
        <strong className="r13a-metric">{szam(kredit.maradt)}</strong>
        <span>{t("r13.kredit.maradt")}</span>
        <span className="r13-halk">{t("r13.kredit.havi", { havi: szam(kredit.havi) })}</span>
      </p>
      <span className="r13a-sav" aria-hidden="true"><span className="r13a-sav-telt" style={{ width: `${Math.round(arany * 100)}%` }} /></span>
      <p className="r13-halk r13a-mire">{t("r13.kredit.mire")}</p>
      <dl className="r13a-bontas">
        {(["hirek", "poszt", "iranytu", "egyeb"] as const).map((k) => (
          <div key={k} className="r13a-bontas-sor"><dt>{t(`r13.kredit.${k}`)}</dt><dd>{szam(kredit.bontas[k])}</dd></div>
        ))}
      </dl>
    </section>
  );

  // Telefon, görgetés alatt: „Kreditjeid ebben a hónapban” szakasz (13a1 „TELEFON · LEJJEBB GÖRGETVE”, 13a3 jobb oszlop asztalon)
  const kreditSzakasz = (
    <section className="r13a-kredit-szakasz" aria-label={t("r13.kredit.cim")}>
      <h2 className="r13-szakasz-cim">{t("r13.kredit.cim")}</h2>
      <p className="r13-halk">{kreditSorRovid}</p>
      <p className="r13-halk">{t("r13.kredit.mi_az")}</p>
      <p className="r13-halk">{t("r13.kredit.penz_keret")}</p>
      <span><HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")}</HalkLink></span>
      {reszletek ? kreditReszletek : null}
    </section>
  );

  // ---- 13a1 / 13a2 ----
  const panel = (
    <div className="r13a-panel">
      <div className="r13a-valaszto" role="radiogroup" aria-label={t("r13.szures.cim")}>
        {FOKOZATOK.map((f) => (
          <label key={f} className={f === sz.fokozat ? "r13a-radio r13a-radio-aktiv" : "r13a-radio"}>
            <input type="radio" name="r13-fokozat" checked={f === sz.fokozat} onChange={() => void ment({ fokozat: f, eloszures: sz.eloszures })} />
            <span className="r13a-radio-szoveg">
              <strong>{t(`r13.szures.${f}`)}</strong>
              <span className="r13-halk">{t(`r13.szures.${f}_mondat`)}</span>
            </span>
          </label>
        ))}
        <div className="r13a-kapcsolo-sor">
          <Kapcsolo be={sz.eloszures} cimke={t("r13.szures.elovalogatas")} valt={(be) => void ment({ fokozat: sz.fokozat, eloszures: be })} />
          <span className="r13a-radio-szoveg">
            <strong>{t("r13.szures.elovalogatas")}</strong>
            <span className="r13-halk">{sz.eloszures ? t("r13.szures.elovalogatas_be") : t("r13.szures.elovalogatas_ki")}</span>
          </span>
        </div>
      </div>
      <div className="r13a-kesz-sor">
        <button type="button" className="r15-halk-gomb" onClick={() => setAtirom(false)}>{t("r15.mit.kesz")}</button>
        <Info>{t("r13.kozos.automentes")}</Info>
      </div>
      {hiba ? <Info>{t("hiba.ALTALANOS")}</Info> : null}
      <p className="r13-halk r13a-reszlet">{t("r13.szures.reszlet")}</p>
    </div>
  );

  const osszegzes = (
    <section className="r13a-osszegzes" aria-label={t("r13.szures.cim")}>
      <div className="r13a-osszegzes-sor">
        <p className="r13a-mondat-fo">{fokozatMondat(t, sz)}</p>
        <HalkLink onClick={() => setAtirom(true)} aria-expanded={false}>{t("r15.mit.atirom")}</HalkLink>
      </div>
      <div className="r13a-osszegzes-sor2">
        <p className="r13a-mondat">{sz.eloszures ? t("r13.szures.elo_be_sor") : t("r13.szures.elo_ki_sor")}</p>
        {!sz.eloszures ? <p className="r13-halk r13a-kov">{t("r13.szures.elo_ki_kov")}</p> : null}
      </div>
    </section>
  );

  // ---- 13a3: elfogyott a saját kredit ----
  if (kredit.elfogyott) {
    return (
      <div className="r15-lap r15-lapok2 r13a-lap">
        <div className="r15-lap-belso r13a-elfogyott">
          <div className="r13a-elfogyott-bal">
            <KerdesCim cim={t("r13.kredit.elfogyott_cim")} alcim={t("r13.kredit.elfogyott_alcim")} />
            <span className="r15-csak-asztal"><FoGomb href="/poszt">{t("r13.kredit.kesz_posztok")}</FoGomb></span>
            <Info>{tulajdonos ? t("r13.kredit.ha_most_tulajdonos") : t("r13.kredit.ha_most")}</Info>
          </div>
          <div className="r15-csak-asztal">{kreditSzakasz}</div>
        </div>
        {/* Csilla 10-06 (4): a hírek beállítása elfogyott kreditnél is látszik, a lap alján, halványan — a kezelői használhatók maradnak
            (nem változik tőlük semmi, csak a következő olvasás kerül kreditbe); fókuszban/egér alatt teljes erővel. Nincs második fő gomb. */}
        <section className="r15-lap-belso r13a-halvany" data-r13="halvany" aria-label={t("r13.szures.cim")}>
          <h2 className="r13-szakasz-cim">{t("r13.szures.cim")}</h2>
          {atirom ? panel : osszegzes}
        </section>
        <div className="r15-also-sav">
          <div className="r15-also-nyugtato"><Info>{t("r13.kredit.penz_rovid")}</Info></div>
          <FoGomb href="/poszt">{t("r13.kredit.kesz_posztok")}</FoGomb>
        </div>
      </div>
    );
  }

  return (
    <div className="r15-lap r15-lapok2 r13a-lap">
      <div className="r15-lap-belso r13a-belso">
        <div className="r13a-elso">
        <KerdesCim cim={t("r13.szures.cim")} alcim={t("r13.szures.alcim")} alcimOsztaly="r15-csak-asztal" />
        {atirom ? panel : osszegzes}
        </div>
        <div className="r15-csak-asztal r13a-also">
          <FoGomb href="/hirfigyelo">{t("r15.mit.mai_hirek")}</FoGomb>
          <p className="r13-halk r13a-kreditsor">
            <span>{kreditSor}</span>
            <HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")}</HalkLink>
          </p>
          {reszletek ? kreditReszletek : null}
          <p className="r13-halk">{t("r13.kredit.penz_keret")}</p>
        </div>
        <div className="r15-csak-tel r13a-tel-kredit">{kreditSzakasz}</div>
      </div>
      <div className="r15-also-sav">
        <div className="r15-also-nyugtato"><Info>{t("r13.szures.nincs_dolgod")}</Info></div>
        <FoGomb href="/hirfigyelo">{t("r15.mit.mai_hirek")}</FoGomb>
      </div>
    </div>
  );
}
