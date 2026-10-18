"use client";
import { useState, type ReactNode } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import { Nyelvvalaszto } from "./Nyelvvalaszto";
import { Visszajelzes } from "./Visszajelzes";
import { HalvanyLogo } from "./HalvanyLogo";
import { Marka } from "./Marka";
import { ModValto } from "./ModValto";
import "./fiok.css";

/** A fiók-képernyők közös váza: háttér, fejléc, középre tett üvegkártya — az E-3 rajz szerint.
 *  `r15`: a Tibor-szabálylap szerinti változat (design/R15/rajz/R15-lapok-4.dc.html 01 Belépés) — üvegkártya nélkül, a tartalom maga
 *  adja a kérdés-címet és a teendő-lapot; telefonon a nyelvválasztó HU/RO/EN rövidítéssel, a fejléc-link a tartalom alá kerül (a hívó teszi ki). */
export function FiokOldal({ fejlecJobb, children, r15 = false }: { fejlecJobb: ReactNode; children: ReactNode; r15?: boolean }) {
  const { t } = useFeliratok();
  return (
    <div className={r15 ? "km-hatter r15b-hatter r15-keretes" : "km-hatter"}>
      <div className="km-tartalom">
        <header className={r15 ? "km-fejlec r15b-fejlec" : "km-fejlec"} data-r15={r15 ? "sotet-sav" : undefined}>
          <div className="km-fejlec-bal">
            {/* R-18 2. kör: a/t jel + termék neve (mint a belépett lapok sávjában) */}
            <Marka nev={t("fejlec.termeknev")} />
            <div className="km-jelveny">{t("kozos.teszt_jelveny")}</div>
          </div>
          <div className="km-fejlec-jobb">
            {r15 ? (
              <>
                <ModValto valtozat="gomb" />
                <Nyelvvalaszto className="km-nyelv r15-csak-asztal" />
                <Nyelvvalaszto className="km-nyelv r15-csak-tel" rovid />
                <span className="r15-csak-asztal">{fejlecJobb}</span>
              </>
            ) : (
              <>
                <ModValto valtozat="gomb" />
                <Nyelvvalaszto />
                {fejlecJobb}
              </>
            )}
          </div>
        </header>
        {r15 ? (
          <main className="km-lap-keret r15b-lap">
            <div className="r15b-belso">{children}</div>
          </main>
        ) : (
          <main className="km-lap-keret km-kozep">
            <div className="km-kartya">{children}</div>
          </main>
        )}
      </div>
      {/* Kati 10-02: a lebegő Visszajelzés gomb a belépés előtti lapokon is (belépés, fiók létrehozása, munkatér létrehozása, jelszó);
          munkamenet nélkül a beküldés névtelen (0148, api/visszajelzes) */}
      <Visszajelzes />
      {/* R-18: a halvány aitmetica felirat a belépés előtti lapokon is (díszítés, a gomb közelében) */}
      <HalvanyLogo />
    </div>
  );
}

export function KartyaFej({ cim, kiemelt, alcim }: { cim: string; kiemelt: string; alcim: string }) {
  return (
    <div className="km-fej">
      <h1 className="km-h1">
        {cim} <span>{kiemelt}</span>
      </h1>
      <p className="km-alcim">{alcim}</p>
    </div>
  );
}

export function Hibadoboz({ szoveg }: { szoveg: string }) {
  return (
    <div className="km-hibadoboz" role="alert">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>{szoveg}</div>
    </div>
  );
}

export function Mezo({
  azonosito, cimke, sugo, hibas, hiba, jelszoMutatas, ...bemenet
}: {
  azonosito: string;
  cimke: string;
  sugo?: string | undefined;
  hibas?: boolean | undefined;
  hiba?: string | undefined;
  jelszoMutatas?: boolean | undefined;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useFeliratok();
  const [mutat, setMutat] = useState(false);
  const hibasE = hibas === true || hiba !== undefined;
  const tipus = jelszoMutatas ? (mutat ? "text" : "password") : bemenet.type;
  const input = (
    <input
      id={azonosito}
      name={azonosito}
      className="km-bemenet"
      aria-invalid={hibasE ? "true" : undefined}
      aria-describedby={hiba !== undefined ? `${azonosito}-hiba` : undefined}
      {...bemenet}
      type={tipus}
    />
  );
  return (
    <div className="km-mezo">
      <label className="km-cimke" htmlFor={azonosito}>{cimke}</label>
      {jelszoMutatas ? (
        <div className="km-mezo-jelszo-sor">
          {input}
          <button
            type="button"
            className="km-jelszo-mutat"
            aria-pressed={mutat}
            aria-controls={azonosito}
            // Kati 10-02 (telefon, új fiók): „a jelszó mutatása gomb nem működik”. Asztali és Chromium-telefon emulációban a gomb
            // működik (390/360 px, érintéssel mérve) — a valódi telefonon a különbség a nyitott billentyűzet: a koppintás először
            // elveszi a fókuszt a mezőtől, a billentyűzet becsukódik, a lap felugrik, és a koppintás nem a gombon ér véget.
            // Ezért a gomb nem veszi el a fókuszt (a billentyűzet nyitva marad, semmi nem mozdul), és az átváltás a mutatót
            // is a helyén hagyja. Ha a telefonon így is néma marad, a következő lépés Kati telefonjának böngészője (WebKit) — itt nincs.
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMutat((m) => !m)}
          >
            {t("fiok.jelszo_mutatasa")}
          </button>
        </div>
      ) : input}
      {hiba !== undefined ? (
        <div className="km-mezo-hiba" id={`${azonosito}-hiba`} role="alert">{hiba}</div>
      ) : null}
      {sugo ? <div className="km-sugo">{sugo}</div> : null}
    </div>
  );
}
