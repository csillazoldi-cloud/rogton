"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { KimenoNezet } from "../../../kimeno/tipusok";
import type { EsemenyFajta } from "@rogton/esemeny-core";
import { useFeliratok } from "../../../nyelv/kliens";
import { hivas } from "../../_kozos/kliens";
import { Kapcsolo } from "../../_kozos/Kapcsolo";
import "./kimeno.css";

type Allapot = "kesz" | "folyik" | "hiba" | "csend";

export function Kimeno({ nezet }: { nezet: KimenoNezet }) {
  const { t, nyelv } = useFeliratok();
  const [kozos, setKozos] = useState<Record<string, "kimeno" | "nincs">>(nezet.kozos);
  const [szervezeti, setSzervezeti] = useState<Record<string, "kimeno" | "nincs">>(nezet.szervezeti);
  const [mentesAllapot, setMentesAllapot] = useState<Allapot>("csend");
  const [mentveEkkor, setMentveEkkor] = useState<Date | null>(null);
  const [nyitottCsoportok, setNyitottCsoportok] = useState<Set<string>>(() => {
    const elso = nezet.csoportok[0]?.kod;
    return elso ? new Set([elso]) : new Set();
  });

  useEffect(() => {
    const elso = nezet.csoportok[0]?.kod;
    setNyitottCsoportok(elso ? new Set([elso]) : new Set());
  }, [nezet.csoportok]);

  const idoFormatum = useMemo(() => {
    return new Intl.DateTimeFormat(nyelv, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Budapest",
    });
  }, [nyelv]);

  const hatasos = useCallback((fajta: string): "kimeno" | "nincs" => {
    if (nezet.nezet === "tulajdonos") {
      return szervezeti[fajta] ?? kozos[fajta] ?? "nincs";
    }
    return kozos[fajta] ?? "nincs";
  }, [nezet.nezet, szervezeti, kozos]);

  const valtozott = useMemo(() => {
    if (nezet.nezet === "tulajdonos") {
      const eredetiKulcsok = Object.keys(nezet.szervezeti) as EsemenyFajta[];
      const jelenlegiKulcsok = Object.keys(szervezeti) as EsemenyFajta[];
      if (eredetiKulcsok.length !== jelenlegiKulcsok.length) return true;
      for (const k of eredetiKulcsok) {
        if (nezet.szervezeti[k] !== szervezeti[k]) return true;
      }
      for (const k of jelenlegiKulcsok) {
        if (!(k in nezet.szervezeti)) return true;
      }
      return false;
    }
    const eredetiKulcsok = Object.keys(nezet.kozos) as EsemenyFajta[];
    const jelenlegiKulcsok = Object.keys(kozos) as EsemenyFajta[];
    if (eredetiKulcsok.length !== jelenlegiKulcsok.length) return true;
    for (const k of eredetiKulcsok) {
      if (nezet.kozos[k] !== kozos[k]) return true;
    }
    for (const k of jelenlegiKulcsok) {
      if (!(k in nezet.kozos)) return true;
    }
    return false;
  }, [nezet.nezet, nezet.szervezeti, nezet.kozos, szervezeti, kozos]);

  const mentes = useCallback(async () => {
    if (!valtozott) return;
    setMentesAllapot("folyik");
    if (nezet.nezet === "tulajdonos") {
      const torzs: Record<string, "kimeno" | "nincs"> = {};
      for (const [k, v] of Object.entries(szervezeti)) {
        torzs[k] = v;
      }
      const eredmeny = await hivas("/api/ertesites", "PUT", torzs);
      if (eredmeny.statusz === 200) {
        setMentesAllapot("kesz");
        setMentveEkkor(new Date());
      } else {
        setMentesAllapot("hiba");
      }
    } else {
      const torzs: Record<string, "kimeno" | "nincs"> = {};
      for (const [k, v] of Object.entries(kozos)) {
        torzs[k] = v;
      }
      const eredmeny = await hivas("/api/ertesites/kozos", "PUT", torzs);
      if (eredmeny.statusz === 200) {
        setMentesAllapot("kesz");
        setMentveEkkor(new Date());
      } else {
        setMentesAllapot("hiba");
      }
    }
  }, [nezet.nezet, szervezeti, kozos, valtozott]);

  const tulajdonosValasztoValt = useCallback((fajta: string, ertek: "orokli" | "kimeno" | "nincs") => {
    setSzervezeti((regi) => {
      const uj = { ...regi };
      if (ertek === "orokli") {
        delete uj[fajta];
      } else {
        uj[fajta] = ertek;
      }
      return uj;
    });
  }, []);

  const rendszergazdaKapcsoloValt = useCallback((fajta: string, ertek: boolean) => {
    setKozos((regi) => {
      const uj = { ...regi };
      if (ertek) {
        uj[fajta] = "kimeno";
      } else {
        uj[fajta] = "nincs";
      }
      return uj;
    });
  }, []);

  const csoportNyitZar = useCallback((kod: string) => {
    setNyitottCsoportok((regi) => {
      const uj = new Set(regi);
      if (uj.has(kod)) {
        uj.delete(kod);
      } else {
        uj.add(kod);
      }
      return uj;
    });
  }, []);

  const mentveSzoveg = useMemo(() => {
    if (mentesAllapot !== "kesz" || !mentveEkkor) return "";
    const ido = idoFormatum.format(mentveEkkor);
    return t("kimeno.mentve", { ido });
  }, [mentesAllapot, mentveEkkor, idoFormatum, t]);

  const esemenySzam = useMemo(() => {
    let n = 0;
    for (const cs of nezet.csoportok) {
      n += cs.fajtak.length;
    }
    return n;
  }, [nezet.csoportok]);

  const csoportNev = useCallback((kod: string): string => {
    if (kod === "hirfigyelo") return t("kimeno.csoport_hirfigyelo");
    return t(`kimeno.csoport_${kod}`);
  }, [t]);

  const lista = (
    <div className="km-ki-tabla">
      <div
        className="km-ki-tabla-fejlec"
        data-tulajdonos={nezet.nezet === "tulajdonos" ? "true" : "false"}
        role="row"
        aria-hidden="true"
      >
        <span className="km-ki-oszlop-esemeny">{t("kimeno.fejlec_esemeny")}</span>
        <span className="km-ki-oszlop-alap">{t("kimeno.fejlec_alap")}</span>
        {nezet.nezet === "tulajdonos" ? (
          <span className="km-ki-oszlop-munkater">{t("kimeno.fejlec_munkater")}</span>
        ) : null}
      </div>

      {nezet.csoportok.map((csoport) => (
        <div key={csoport.kod} className="km-ki-csoport">
          <button
            type="button"
            className="km-ki-csoport-fej"
            aria-expanded={nyitottCsoportok.has(csoport.kod)}
            onClick={() => csoportNyitZar(csoport.kod)}
          >
            <span className="km-ki-csoport-nev">{csoportNev(csoport.kod)}</span>
            <span className="km-ki-csoport-szam" aria-hidden="true">
              {csoport.fajtak.length}
            </span>
            <span className="km-ki-csoport-nyil" aria-hidden="true">
              {nyitottCsoportok.has(csoport.kod) ? "▴" : "▾"}
            </span>
          </button>

          {nyitottCsoportok.has(csoport.kod) ? (
            <div className="km-ki-csoport-tartalom">
              {csoport.fajtak.map((fajta) => (
                <Sor
                  key={fajta}
                  fajta={fajta}
                  nezet={nezet.nezet}
                  kozos={kozos}
                  szervezeti={szervezeti}
                  hatasos={hatasos(fajta)}
                  onTulajdonosValt={tulajdonosValasztoValt}
                  onRendszergazdaValt={rendszergazdaKapcsoloValt}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  return (
    <main className="km-lap-keret km-ki-lap">
      <a href="/gephaz" className="km-ki-vissza">
        {t("kimeno.vissza")}
      </a>

      <div className="km-ki-fejlec">
        <h1 className="km-ki-cim">{t("kimeno.cim")}</h1>
        <span className="km-ki-megj">{t("kimeno.kov")}</span>
      </div>

      <div className="km-ki-csatorna-doboz">
        <div className="km-ki-csatorna-allapot">
          <span
            className="km-ki-csatorna-pont"
            aria-hidden="true"
            data-bekotve={nezet.bekotve}
          />
          <span className="km-ki-csatorna-szoveg">
            {nezet.bekotve ? t("kimeno.bekotve") : t("kimeno.nincs_bekotve")}
          </span>
        </div>
        <span className="km-ki-csatorna-megj">{t("kimeno.csatorna_megj")}</span>
        {nezet.nezet === "rendszergazda" ? (
          <span className="km-ki-csatorna-megj">{t("kimeno.kozos_megj")}</span>
        ) : null}
      </div>

      {!nezet.bekotve ? (
        <>
          <div className="km-ki-ures">
            <h2 className="km-ki-ures-cim">{t("kimeno.ures_cim")}</h2>
            <p className="km-ki-ures-szoveg">{t("kimeno.ures_szoveg")}</p>
          </div>
          <details className="km-ki-lista-nyit">
            <summary className="km-ki-lista-nyit-fej">
              {t("kimeno.lista_nyit", { n: esemenySzam })}
            </summary>
            {lista}
          </details>
        </>
      ) : (
        lista
      )}

      <div className="km-ki-mentes-sor">
        <button
          type="button"
          className="km-ki-mentes-gomb"
          onClick={mentes}
          disabled={!valtozott || mentesAllapot === "folyik"}
        >
          {t("kimeno.mentes")}
        </button>
        {mentesAllapot === "kesz" ? (
          <span className="km-ki-mentve">{mentveSzoveg}</span>
        ) : null}
        {mentesAllapot === "hiba" ? (
          <span className="km-ki-mentes-hiba">{t("kimeno.mentes_hiba")}</span>
        ) : null}
      </div>

      {nezet.nezet === "tulajdonos" ? (
        <div className="km-ki-labjegyzet">
          <span className="km-ki-labjegyzet-szoveg">{t("kimeno.nem_ugyanaz")}</span>
          <a href="/beallitasok" className="km-ki-labjegyzet-link">
            {t("nav.beallitasok")} →
          </a>
        </div>
      ) : null}
    </main>
  );
}

function Sor({
  fajta,
  nezet,
  kozos,
  szervezeti,
  hatasos,
  onTulajdonosValt,
  onRendszergazdaValt,
}: {
  fajta: string;
  nezet: "tulajdonos" | "rendszergazda";
  kozos: Record<string, "kimeno" | "nincs">;
  szervezeti: Record<string, "kimeno" | "nincs">;
  hatasos: "kimeno" | "nincs";
  onTulajdonosValt: (fajta: string, ertek: "orokli" | "kimeno" | "nincs") => void;
  onRendszergazdaValt: (fajta: string, ertek: boolean) => void;
}) {
  const { t } = useFeliratok();
  const kozosErtek = kozos[fajta] ?? "nincs";
  const szervezetiErtek = szervezeti[fajta] === "kimeno" ? "kimeno" : szervezeti[fajta] === "nincs" ? "nincs" : "orokli";

  const dontoSzint = useMemo(() => {
    if (nezet !== "tulajdonos") return "";
    if (szervezetiErtek === "orokli") return t("kimeno.fejlec_alap");
    return t("kimeno.fejlec_munkater");
  }, [nezet, szervezetiErtek, t]);

  return (
    <div className="km-ki-sor" role="row" data-tulajdonos={nezet === "tulajdonos" ? "true" : "false"}>
      <div className="km-ki-sor-nev">
        <span className="km-ki-sor-cim">{t(`esemeny.${fajta}_cim`)}</span>
      </div>

      <div className="km-ki-sor-alap">
        <span className="km-ki-sor-alap-szoveg">
          {kozosErtek === "kimeno" ? t("kimeno.alap_kimeno") : t("kimeno.alap_nincs")}
        </span>
      </div>

      {nezet === "tulajdonos" ? (
        <div className="km-ki-sor-vezerlo">
          <div
            className="km-ki-sor-valaszto"
            role="radiogroup"
            aria-label={t(`esemeny.${fajta}_cim`)}
          >
            {(["orokli", "kimeno", "nincs"] as const).map((allapot) => (
              <button
                key={allapot}
                type="button"
                role="radio"
                aria-checked={szervezetiErtek === allapot}
                className="km-ki-sor-gomb"
                data-kivalasztott={szervezetiErtek === allapot}
                onClick={() => onTulajdonosValt(fajta, allapot)}
                onKeyDown={(e) => {
                  const gombok = ["orokli", "kimeno", "nincs"] as const;
                  const index = gombok.indexOf(allapot);
                  let ujIndex = -1;
                  if (e.key === "ArrowLeft") {
                    ujIndex = index > 0 ? index - 1 : gombok.length - 1;
                  } else if (e.key === "ArrowRight") {
                    ujIndex = index < gombok.length - 1 ? index + 1 : 0;
                  }
                  if (ujIndex !== -1) {
                    e.preventDefault();
                    const ujAllas = gombok[ujIndex];
                    if (ujAllas !== undefined) onTulajdonosValt(fajta, ujAllas);
                    const gomb = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[ujIndex];
                    gomb?.focus();
                  }
                }}
              >
                {t(`kimeno.${allapot}`)}
              </button>
            ))}
          </div>
          <span className="km-ki-sor-ervenyes-jel">
            {t("kimeno.ervenyes_jel", {
              allapot: hatasos === "kimeno" ? t("kimeno.hatasos_kimeno") : t("kimeno.hatasos_nincs"),
            })}
          </span>
          <span className="km-ki-sor-donto-szint">{dontoSzint}</span>
        </div>
      ) : (
        <div className="km-ki-sor-kapcsolo">
          <Kapcsolo
            be={kozosErtek === "kimeno"}
            valt={(ertek) => onRendszergazdaValt(fajta, ertek)}
            cimke={t(`esemeny.${fajta}_cim`)}
          />
        </div>
      )}
    </div>
  );
}
