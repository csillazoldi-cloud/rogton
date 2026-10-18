"use client";
// R-7c 01–02: a Gépház (Beállítások) lap — sorlista öt (rendszergazdánál hat) csoportban.
// Minden sor: név · egy mondat (a _kov kulcs) · „→” (Link). Csoportonként egy <section>, kártya nélkül.
// Az „Ami itt nincs” blokk és a token-számok elmaradnak. A gépezet (végpontok, adatok) a mai komponensből marad.

import { R15IkonDoboz, type R15IkonNev } from "../_kozos/R15Ikon";
import Link from "next/link";
import type { GephazNezet } from "../../kezdolap/tipusok";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import { PENZNEMEK, type Penznem } from "../../kezdolap/tipusok";
import { LogotervSorok } from "./LogotervSorok";
import type { SajatKredit } from "../../kredit/tipusok";
import { FoGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import "../_kozos/r15-lapok.css";

// R-15 c5 2. kör (design/R15/rajz/R15-lapok-5.dc.html 13a · 13b; gepezet-5 4; kerdesek-5 7–10, Csilla 10-10 18:08) — a TULAJDONOS nézete:
// „Minden be van állítva” + egy mondat; csak a sorok nevei (a magyarázó mondatok lekerültek, T5); a próbaidőszak egy halk sor (a halott
// „Árazás és fizetés” doboz, a „tulajdonos nézet” jelvény és a közös-alap bevezető lekerült); az AI-keret helyett az R-13 kredit-sora;
// a Pénznem, az AI-használat, a Kapcsolat más rendszerekkel és a Felület szövegei a „Haladó ▾” mögött; a fő gomb „Meghívok valakit”
// (→ /tagok?meghivo=1, ott a meglévő meghívó-ablak nyílik). A RENDSZERGAZDA nézete változatlan (alább, `RendszergazdaGephaz`).
export function Gephaz({ nezet, logoterv = null, kredit = null }: { nezet: GephazNezet; logoterv?: { ar: number | null; cimzett: string } | null; kredit?: SajatKredit | null }) {
  if (nezet.nezet === "rendszergazda") return <RendszergazdaGephaz nezet={nezet} logoterv={logoterv} />;
  return <TulajGephaz nezet={nezet} kredit={kredit} />;
}

const MEGHIVO_CIM = "/tagok?meghivo=1";

function TulajGephaz({ nezet, kredit }: { nezet: GephazNezet; kredit: SajatKredit | null }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const [halado, setHalado] = useState(false);
  const [penznem, setPenznem] = useState<Penznem>(nezet.munkater.penznem);
  const [penznemFut, setPenznemFut] = useState(false);
  async function penznemValt(uj: Penznem) {
    setPenznem(uj);
    setPenznemFut(true);
    await hivas("/api/beallitas/penznem", "PUT", { penznem: uj });
    setPenznemFut(false);
    router.refresh();
  }
  // c5 3. kör (R15-lapok-6 13aI · 13bI; Csilla 10-10 21:02): minden sor előtt egy ikon a kis négyzetben (csak megjelenés)
  const sorLink = (href: string, kulcs: string, ikon: R15IkonNev) => (
    <li className="r15be-sor">
      <Link href={href} className="r15be-sor-link">
        <span className="r15-ikonos"><R15IkonDoboz nev={ikon} /><span>{t(kulcs)}</span></span>
        <span className="r15be-nyil" aria-hidden="true">›</span>
      </Link>
    </li>
  );
  return (
    <div className="r15-lap-belso r15be-belso">
      <KerdesCim cim={t("r15.be.kerdes")} alcim={t("r15.be.alcim")} />

      <section className="r15be-csoport" aria-label={t("gephaz.csoport_szervezet")}>
        <h2 className="r15be-csoport-cim">{t("gephaz.csoport_szervezet")}</h2>
        <ul className="r15be-lista">
          {sorLink("/fiok", "gephaz.szervezet_adatai", "szervezet")}
          {sorLink("/tema", "tema.cim", "megjelenes")}
        </ul>
        {/* ma minden csomag próbaidőszakban van (a régi sor is feltétel nélkül írta: csomag.probaidoszak_cimke) */}
        <Info osztaly="r15be-info">{t("r15.be.proba_sor")}</Info>
      </section>

      <section className="r15be-csoport" aria-label={t("gephaz.csoport_csapat")}>
        <h2 className="r15be-csoport-cim">{t("gephaz.csoport_csapat")}</h2>
        <ul className="r15be-lista">
          <li className="r15be-sor r15be-sor-gombbal">
            <Link href="/tagok" className="r15be-sor-link">
              <span className="r15-ikonos"><R15IkonDoboz nev="csapat" /><span>{t("tagok.cim")}</span></span>
              <span className="r15be-nyil" aria-hidden="true">›</span>
            </Link>
            <span className="r15-csak-asztal"><FoGomb href={MEGHIVO_CIM}>{t("r13.tagok.meghivok")}</FoGomb></span>
          </li>
        </ul>
      </section>

      {kredit && kredit.havi > 0 ? (
        <section className="r15be-csoport" aria-label={t("gephaz.csoport_hasznalat")}>
          <h2 className="r15be-csoport-cim">{t("gephaz.csoport_hasznalat")}</h2>
          <ul className="r15be-lista">
            <li className="r15be-sor r15be-sor-sima">
              <span className="r15-ikonos"><R15IkonDoboz nev="kredit" /><span>{t("r13.kezdolap.kredit_sor", { maradt: kredit.maradt, havi: kredit.havi })}</span></span>
              <Link href="/sajat-fiok" className="r15-halk-link">{t("r13.kezdolap.mire_ment")}</Link>
            </li>
          </ul>
        </section>
      ) : null}

      <div className="r15be-halado">
        <HalkLink aria-expanded={halado} onClick={() => setHalado((x) => !x)}><span className="r15-ikonos"><R15IkonDoboz nev="halado" /><span>{`${t("gephaz.csoport_halado")} ${halado ? "▴" : "▾"}`}</span></span></HalkLink>
        {halado ? (
          <ul className="r15be-lista" data-r15="reszletek">
            <li className="r15be-sor r15be-sor-sima">
              <label htmlFor="km-gh-penznem" className="r15-ikonos"><R15IkonDoboz nev="penz" /><span>{t("gephaz.pennznem")}</span></label>
              <select id="km-gh-penznem" className="km-gh-penznem-valaszto" aria-label={t("gephaz.penznem_cimke")} value={penznem} disabled={penznemFut} onChange={(e) => void penznemValt(e.target.value as Penznem)}>
                {PENZNEMEK.map((p) => <option key={p} value={p}>{t(`penznem.${p}`)}</option>)}
              </select>
            </li>
            {nezet.koltseg !== null ? sorLink("/koltseg", "koltseg.link", "meres") : null}
            {sorLink("/gephaz/kimeno", "kimeno.cim", "kapcsolat")}
            {sorLink("/feliratok", "feliratok.cim", "szoveg")}
          </ul>
        ) : null}
      </div>

      <div className="r15-also-sav"><FoGomb href={MEGHIVO_CIM}>{t("r13.tagok.meghivok")}</FoGomb></div>
    </div>
  );
}

function RendszergazdaGephaz({ nezet, logoterv = null }: { nezet: GephazNezet; logoterv?: { ar: number | null; cimzett: string } | null }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const rendszergazda = nezet.nezet === "rendszergazda";

  // R-1 v4: a pénznem-vezérlő (Munkatér sor, csak a tulajdonos nézetén). Választás → PUT /api/beallitas/penznem → a lap frissül (D-F22).
  const [penznem, setPenznem] = useState<Penznem>(nezet.munkater.penznem);
  const [penznemFut, setPenznemFut] = useState(false);
  async function penznemValt(uj: Penznem) {
    setPenznem(uj);
    setPenznemFut(true);
    await hivas("/api/beallitas/penznem", "PUT", { penznem: uj });
    setPenznemFut(false);
    router.refresh();
  }

  // Az időzóna kimondva (a kiszolgáló UTC-s doboz, a böngésző nem) — különben hidratálási eltérés (418).
  const ZONA = "Europe/Budapest";

  const penzFormat = (osszeg: { ertek: number; penznem: string }) =>
    new Intl.NumberFormat(nyelv, {
      style: "currency",
      currency: osszeg.penznem,
      currencyDisplay: "narrowSymbol",
    }).format(osszeg.ertek);

  // Az árfolyam-vezérlő (rendszergazda, Rendszer csoport) — a mai árfolyam-vezérlő helye.
  // A mai komponensben nem volt külön árfolyam-vezérlő; a szerződés szerint itt a helye, a mai adatforrásból.
  // (A tényleges árfolyam-adat a kiszolgálóról jön; itt csak a sor jelenik meg a _kov mondattal.)

  return (
    <div className="km-gh-tartalom">
      <div className="km-gh-fejlec">
        <div className="km-gh-cimsor">
          <h1 className="km-gh-h1">{t("gephaz.cim")}</h1>
          <span
            className={`km-gh-jelveny ${rendszergazda ? "km-gh-jelveny-rg" : "km-gh-jelveny-tulaj"}`}
          >
            {t(rendszergazda ? "gephaz.jelveny" : "gephaz.jelveny_tulaj")}
          </span>
        </div>
        <p className="km-gh-bevezeto">
          {rendszergazda
            ? t("gephaz.bevezeto")
            : t("gephaz.tulaj_bevezeto", { munkater: nezet.munkater.nev })}
        </p>
      </div>

      {/* 1. csoport — Szervezet */}
      <section className="km-gh-csoport">
        <h2 className="km-gh-csoport-cim">{t("gephaz.csoport_szervezet")}</h2>
        <ul className="km-gh-sorlista">
          <li className="km-gh-sor">
            <Link href="/fiok" className="km-gh-sor-link">
              <span className="km-gh-sor-nev">{t("gephaz.szervezet_adatai")}</span>
              <span className="km-gh-sor-kov">{t("gephaz.szervezet_adatai_kov")}</span>
              <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
            </Link>
          </li>
          <li className="km-gh-sor">
            <div className="km-gh-sor-tartalom">
              <span className="km-gh-sor-nev">{t("csomag.cim")}: {t(`csomag.${nezet.csomag.kod}_nev`)} ({t("csomag.probaidoszak_cimke")})</span>
              <span className="km-gh-sor-kov">{t(`csomag.${nezet.csomag.kod}_megj`)}</span>
              {/* a „még nem működik” jelölés harmadik alakja: a SORON, vezérlő nélkül (R-5 ATADO 3.) */}
              <div className="km-gh-keszul-sor">
                <div className="km-gh-keszul-fej">
                  <span className="km-gh-keszul-cim">{t("csomag.arazas_cim")}</span>
                  <span className="km-gh-keszul-jelveny">{t("jelzes.meg_nem_mukodik")}</span>
                </div>
                <span className="km-gh-csempe-szoveg">{t("csomag.arazas_miert")}</span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      {/* 2. csoport — Csapattagok */}
      <section className="km-gh-csoport">
        <h2 className="km-gh-csoport-cim">{t("gephaz.csoport_csapat")}</h2>
        <ul className="km-gh-sorlista">
          <li className="km-gh-sor">
            <Link href="/tagok" className="km-gh-sor-link">
              <span className="km-gh-sor-nev">{t("tagok.cim")}</span>
              <span className="km-gh-sor-kov">{t("tagok.kov")}</span>
              <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* 3. csoport — Megjelenés */}
      <section className="km-gh-csoport">
        <h2 className="km-gh-csoport-cim">{t("gephaz.csoport_megjelenes")}</h2>
        <ul className="km-gh-sorlista">
          <li className="km-gh-sor">
            <Link href="/tema" className="km-gh-sor-link">
              <span className="km-gh-sor-nev">{t("tema.cim")}</span>
              <span className="km-gh-sor-kov">{t("tema.kov")}</span>
              <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* 4. csoport — Használat */}
      <section className="km-gh-csoport">
        <h2 className="km-gh-csoport-cim">{t("gephaz.csoport_hasznalat")}</h2>
        <ul className="km-gh-sorlista">
          {/* Pénznem — csak tulajdonos (a mai Munkatér csempe pénznem-vezérlője) */}
          {!rendszergazda && (
            <li className="km-gh-sor">
              <div className="km-gh-sor-tartalom">
                <span className="km-gh-sor-nev">{t("gephaz.pennznem")}</span>
                <span className="km-gh-sor-kov">{t("gephaz.pennznem_kov")}</span>
                <div className="km-gh-penznem-sor">
                  <label className="km-gh-csempe-szoveg" htmlFor="km-gh-penznem">
                    {t("gephaz.penznem_cimke")}
                  </label>
                  <select
                    id="km-gh-penznem"
                    className="km-gh-penznem-valaszto"
                    value={penznem}
                    disabled={penznemFut}
                    onChange={(e) => void penznemValt(e.target.value as Penznem)}
                  >
                    {PENZNEMEK.map((p) => (
                      <option key={p} value={p}>
                        {t(`penznem.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          )}
          {/* AI-keret — a mai Költség csempe adatából */}
          {nezet.koltseg !== null && (
            <li className="km-gh-sor">
              <Link href="/koltseg" className="km-gh-sor-link">
                <span className="km-gh-sor-nev">
                  {t("koltseg.keret_sor", { osszeg: penzFormat(nezet.koltseg.osszeg) })}
                </span>
                <span className="km-gh-sor-kov">{t("koltseg.kov")}</span>
                <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
              </Link>
            </li>
          )}
        </ul>
      </section>

      {/* 5. csoport — Haladó */}
      <section className="km-gh-csoport">
        <h2 className="km-gh-csoport-cim">{t("gephaz.csoport_halado")}</h2>
        <ul className="km-gh-sorlista">
          <li className="km-gh-sor">
            <Link href="/gephaz/kimeno" className="km-gh-sor-link">
              <span className="km-gh-sor-nev">{t("kimeno.cim")}</span>
              <span className="km-gh-sor-kov">{t("kimeno.kov")}</span>
              <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
            </Link>
          </li>
          <li className="km-gh-sor">
            <Link href="/feliratok" className="km-gh-sor-link">
              <span className="km-gh-sor-nev">{t("feliratok.cim")}</span>
              <span className="km-gh-sor-kov">{t("feliratok.kov")}</span>
              <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* 6. csoport — Rendszer (csak rendszergazda) */}
      {rendszergazda && (
        <section className="km-gh-csoport">
          <h2 className="km-gh-csoport-cim">{t("gephaz.csoport_rendszer")}</h2>
          <ul className="km-gh-sorlista">
            <li className="km-gh-sor">
              <Link href="/fiokok" className="km-gh-sor-link">
                <span className="km-gh-sor-nev">{t("gephaz.fiokok")}</span>
                <span className="km-gh-sor-kov">{t("gephaz.fiokok_kov")}</span>
                <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
              </Link>
            </li>
            <li className="km-gh-sor">
              <Link href="/tema?szint=kozos" className="km-gh-sor-link">
                <span className="km-gh-sor-nev">{t("tema.kozos_alap")}</span>
                <span className="km-gh-sor-kov">{t("tema.kozos_alap_kov")}</span>
                <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
              </Link>
            </li>
            <li className="km-gh-sor">
              <Link href="/feliratok?szint=kozos" className="km-gh-sor-link">
                <span className="km-gh-sor-nev">{t("feliratok.kozos_alap")}</span>
                <span className="km-gh-sor-kov">{t("feliratok.kozos_alap_kov")}</span>
                <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
              </Link>
            </li>
            <li className="km-gh-sor">
              <div className="km-gh-sor-tartalom">
                <span className="km-gh-sor-nev">{t("gephaz.arfolyam")}</span>
                <span className="km-gh-sor-kov">{t("gephaz.arfolyam_kov")}</span>
                {/* a mai árfolyam-vezérlő helye — a mai komponensben nem volt külön vezérlő, a sor a szerződés szerint itt van */}
              </div>
            </li>
            {/* R-17 B4: a logótervezés ára, a kérések címzettje és listája */}
            {logoterv ? <LogotervSorok kezdo={logoterv} /> : null}
            {/* VZ-1 kerdesek 4 (Csilla 2026-10-06): a közlemény-képek szabály-jelzései a rendszergazdáé — a lista (a rendszergazdai csoportban) */}
            {logoterv ? (
              <li className="km-gh-sor">
                <Link href="/gephaz/kep-jelzesek" className="km-gh-sor-link">
                  <span className="km-gh-sor-nev">{t("vz1r.admin_jelzesek")}</span>
                  <span className="km-gh-sor-kov">{t("vz1r.admin_jelzesek_kov")}</span>
                  <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      )}
    </div>
  );
}
