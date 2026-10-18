"use client";

import { useFeliratok } from "../../nyelv/kliens";
import { Marka } from "../_kozos/Marka";
import { ModValto } from "../_kozos/ModValto";

export function Adatkezeles() {
  const { t: tt } = useFeliratok();

  const kapcsolat = tt("kozos.kapcsolat");
  const vanKapcsolat = kapcsolat !== "kozos.kapcsolat";

  const datum = tt("kozos.tajekoztato_datum");
  const vanDatum = datum !== "kozos.tajekoztato_datum";

  return (
    <div className="km-ny">
      <header className="km-ny-fejlec">
        <div className="km-ny-kozep km-ny-fejlec-belso">
          <div className="km-ny-fejlec-bal">
            {/* R-18 2. kör: a/t jel + termék neve (mint a belépett lapok sávjában) */}
            <Marka nev={tt("fejlec.termeknev")} />
          </div>
          <div className="km-ny-fejlec-jobb">
            <ModValto valtozat="gomb" />
            <a className="km-ny-gomb km-ny-gomb-ghost" href="/belepes">
              {tt("nyitolap.belepes")}
            </a>
            <a className="km-ny-gomb km-ny-gomb-elso" href="/regisztracio">
              {tt("nyitolap.regisztracio")}
            </a>
          </div>
        </div>
      </header>

      <main className="km-lap-keret km-adk-lap">
        <div className="km-ny-kozep">
          <h1 className="km-adk-cim">{tt("beallitasok.adatkezeles_cim")}</h1>
          <p className="km-adk-alcim">{tt("beallitasok.adatkezeles_alcim")}</p>

          <div className="km-adk-kerdesek">
            <article className="km-adk-kerdes">
              <h2 className="km-adk-kerdes-cim">{tt("beallitasok.mit_kuldunk")}</h2>
              <p className="km-adk-kerdes-valasz">{tt("beallitasok.mit_kuldunk_valasz")}</p>
            </article>
            <article className="km-adk-kerdes">
              <h2 className="km-adk-kerdes-cim">{tt("beallitasok.kinek")}</h2>
              <p className="km-adk-kerdes-valasz">{tt("beallitasok.kinek_valasz")}</p>
            </article>
            <article className="km-adk-kerdes">
              <h2 className="km-adk-kerdes-cim">{tt("beallitasok.mire_hasznalja")}</h2>
              <p className="km-adk-kerdes-valasz">{tt("beallitasok.mire_hasznalja_valasz")}</p>
            </article>
          </div>

          <div className="km-adk-adatutak">
            <div className="km-adk-adatut">
              <span className="km-adk-adatut-mi">{tt("adatpolitika.ut1_mi")}</span>
              <span className="km-adk-adatut-kihez">{tt("adatpolitika.ut1_kihez")}</span>
            </div>
            <div className="km-adk-adatut">
              <span className="km-adk-adatut-mi">{tt("adatpolitika.ut2_mi")}</span>
              <span className="km-adk-adatut-kihez">{tt("adatpolitika.ut2_kihez")}</span>
            </div>
          </div>

          {vanDatum ? (
            <p className="km-adk-tajekoztato">
              {tt("nyitolap.teljes_tajekoztato", { datum })}
            </p>
          ) : null}

          {vanKapcsolat ? (
            <div className="km-adk-kapcsolat">
              <span className="km-adk-kapcsolat-cim">{tt("nyitolap.kapcsolattarto_cim")}</span>
              <span className="km-adk-kapcsolat-ertek">{kapcsolat}</span>
            </div>
          ) : null}

          <a className="km-adk-vissza" href="/">
            {tt("nyitolap.vissza")}
          </a>
        </div>
      </main>

      <footer className="km-ny-lablec">
        <div className="km-ny-kozep km-ny-lablec-belso">
          <div className="km-ny-lablec-bal">
            <span>{tt("nyitolap.ceg")}</span>
            <span className="km-ny-lablec-elvalaszto" aria-hidden="true">·</span>
            <span>{tt("nyitolap.kapcsolat")}</span>
            <span className="km-ny-lablec-elvalaszto" aria-hidden="true">·</span>
            <a href="/adatkezeles">{tt("nyitolap.adat_link")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
