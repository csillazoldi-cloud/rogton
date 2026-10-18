import React from "react";
import "./nyitolap.css";
import { Marka } from "./_kozos/Marka";
import { ModValto } from "./_kozos/ModValto";

// R-7d példa-kártya — a szövegek feliratkulcsból (0068), kitalált példa „Példa" jelöléssel
const PELDA_KULCSOK = {
  cim: "nyitolap.pelda_cim",
  kiado: "nyitolap.pelda_kiado",
  datum: "nyitolap.pelda_datum",
  osszefoglalo: "nyitolap.pelda_osszefoglalo",
  indok: "nyitolap.pelda_indok",
} as const;

interface NyitolapProps {
  t: (kulcs: string) => string;
  verzio: string;
  nyelvvalaszto: React.ReactNode;
  /** R-17 D1: a háromnyelvű választó-sáv (csak ha a nyelv nem dönthető el) — a fejléc alatt */
  nyelvSav?: React.ReactNode;
}

export default function Nyitolap({ t, verzio, nyelvvalaszto, nyelvSav = null }: NyitolapProps) {
  const kapcsolat = t("kozos.kapcsolat");
  const vanKapcsolat = kapcsolat !== "kozos.kapcsolat";

  return (
    <div className="km-ny">
      <header className="km-ny-fejlec">
        <div className="km-ny-kozep km-ny-fejlec-belso">
          <div className="km-ny-fejlec-bal">
            {/* R-18 2. kör: a/t jel + termék neve (mint a belépett lapok sávjában) */}
            <Marka nev={t("fejlec.termeknev")} />
          </div>
          <div className="km-ny-fejlec-jobb">
            <ModValto valtozat="gomb" />
            {nyelvvalaszto}
            <a className="km-ny-gomb km-ny-gomb-ghost" href="/belepes">
              {t("nyitolap.belepes")}
            </a>
            <a className="km-ny-gomb km-ny-gomb-elso" href="/regisztracio">
              {t("nyitolap.regisztracio")}
            </a>
          </div>
        </div>
      </header>
      {nyelvSav}

      <main>
        <section className="km-ny-hero">
          <div className="km-ny-kozep km-ny-hero-racs">
            <div className="km-ny-hero-szoveg">
              <h1 className="km-ny-h1">{t("nyitolap.cim")}</h1>
              <p className="km-ny-hero-alcim">{t("nyitolap.alcim")}</p>
              <div className="km-ny-hero-gombok">
                <a className="km-ny-gomb km-ny-gomb-elso" href="/regisztracio">
                  {t("nyitolap.regisztracio")}
                </a>
                <a className="km-ny-gomb km-ny-gomb-ghost" href="/belepes">
                  {t("nyitolap.mar_van_fiokom")}
                </a>
              </div>
            </div>

            <div className="km-ny-pelda">
              <span className="km-ny-pelda-jelzes">{t("nyitolap.pelda_jelzes")}</span>
              <article className="km-ny-pelda-kartya">
                <h2 className="km-ny-pelda-cim">{t(PELDA_KULCSOK.cim)}</h2>
                <div className="km-ny-pelda-meta">
                  {t(PELDA_KULCSOK.kiado)} · {t(PELDA_KULCSOK.datum)}
                </div>
                <p className="km-ny-pelda-osszefoglalo">{t(PELDA_KULCSOK.osszefoglalo)}</p>
                <p className="km-ny-pelda-indok">
                  <span className="km-ny-pelda-indok-cim">{t("hf.indok_cim")}</span>{" "}
                  {t(PELDA_KULCSOK.indok)}
                </p>
                <button
                  type="button"
                  className="km-ny-gomb km-ny-gomb-ghost km-ny-pelda-gomb"
                  aria-disabled="true"
                >
                  {t("nyitolap.pelda_gomb")}
                </button>
              </article>
            </div>
          </div>
        </section>

        <section className="km-ny-szekcio">
          <div className="km-ny-kozep">
            <h2 className="km-ny-szekcio-cim">{t("nyitolap.mit_tud_cim")}</h2>
            <div className="km-ny-kartya-racs">
              <article className="km-ny-kartya">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 5h9M4 10h13M4 15h7" />
                  <path d="M17 15.5l2 2 3.5-3.5" />
                </svg>
                <h3 className="km-ny-kartya-cim">{t("nyitolap.kartya1_cim")}</h3>
                <p className="km-ny-kartya-szoveg">{t("nyitolap.kartya1_szoveg")}</p>
              </article>
              <article className="km-ny-kartya">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--src-web)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M15.8 15.8L21 21" />
                  <path d="M8.5 11h5M11 8.5v5" />
                </svg>
                <h3 className="km-ny-kartya-cim">{t("nyitolap.kartya2_cim")}</h3>
                <p className="km-ny-kartya-szoveg">{t("nyitolap.kartya2_szoveg")}</p>
              </article>
              <article className="km-ny-kartya">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3.5l1.7 3.9 4.3.4-3.2 2.8.9 4.2-3.7-2.2-3.7 2.2.9-4.2L6 7.8l4.3-.4z" />
                  <path d="M7 19h10" />
                </svg>
                <h3 className="km-ny-kartya-cim">{t("nyitolap.kartya3_cim")}</h3>
                <p className="km-ny-kartya-szoveg">{t("nyitolap.kartya3_szoveg")}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="km-ny-szekcio">
          <div className="km-ny-kozep">
            <h2 className="km-ny-szekcio-cim">{t("nyitolap.kerdesek_cim")}</h2>
            <div className="km-ny-kerdesek">
              <div className="km-ny-kerdes">
                <span className="km-ny-kerdes-cim">{t("nyitolap.kerdes1")}</span>
                <span className="km-ny-valasz">{t("nyitolap.valasz1")}</span>
              </div>
              <div className="km-ny-kerdes">
                <span className="km-ny-kerdes-cim">{t("nyitolap.kerdes2")}</span>
                <span className="km-ny-valasz">{t("nyitolap.valasz2")}</span>
              </div>
              <div className="km-ny-kerdes">
                <span className="km-ny-kerdes-cim">{t("nyitolap.kerdes3")}</span>
                <span className="km-ny-valasz">{t("nyitolap.valasz3")}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="km-ny-zaro">
          <div className="km-ny-kozep">
            <a className="km-ny-gomb km-ny-gomb-elso" href="/regisztracio">
              {t("nyitolap.regisztracio")}
            </a>
          </div>
        </section>
      </main>

      <footer className="km-ny-lablec">
        <div className="km-ny-kozep km-ny-lablec-belso">
          <div className="km-ny-lablec-bal">
            <span>{t("nyitolap.lablec_cegnev")}</span>
            {vanKapcsolat ? (
              <>
                <span className="km-ny-lablec-elvalaszto" aria-hidden="true">·</span>
                <span>{kapcsolat}</span>
              </>
            ) : null}
            <span className="km-ny-lablec-elvalaszto" aria-hidden="true">·</span>
            <a href="/adatkezeles">{t("nav.adatkezeles")}</a>
          </div>
          <div className="km-ny-lablec-jobb">
            <span className="km-ny-verzio">{verzio}</span>
            <span className="km-ny-teszt-jelveny">{t("kozos.teszt_jelveny")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
