"use client";
// R-9 (8. lap): a Visszajelzések listája — szűrő-fülek, táblázat, állapot-állítás (PATCH), kép-felugró.
// Minden felirat kulcsból; a dátum a megadott formázóval, Europe/Bucharest időzónában.

import { useCallback, useEffect, useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";

type Allapot = "uj" | "elfogadva" | "kesz";

type Visszajelzes = {
  id: string;
  szervezet_id: string | null;
  szervezet_nev: string;
  fiok_id: string | null;
  fiok_nev: string;
  /** 0148: belépés nélkül küldték (a belépés előtti lapok lebegő gombjáról) */
  nevtelen?: boolean;
  lap: string;
  lap_cim: string;
  elem: { cimke: string; szelektor: string; szoveg_reszlet: string } | null;
  kijelolt_szoveg: string;
  szoveg: string;
  nyelv: string;
  kep: null;
  van_kep?: boolean;
  ablak: { w: number; h: number };
  allapot: Allapot;
  letrehozva: string;
  csomag_id: string | null;
};

type Szuro = "mind" | Allapot;

const ALLAPOTOK: Allapot[] = ["uj", "elfogadva", "kesz"];

export function Lista({ rendszergazda }: { rendszergazda: boolean }) {
  const { t, nyelv } = useFeliratok();
  const [tetelek, setTetelek] = useState<Visszajelzes[]>([]);
  const [szuro, setSzuro] = useState<Szuro>("mind");
  const [tolt, setTolt] = useState(true);
  const [kepFelugro, setKepFelugro] = useState<{ id: string; url: string } | null>(null);

  const datumFormazo = new Intl.DateTimeFormat(nyelv, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  });

  const betolt = useCallback(async () => {
    setTolt(true);
    try {
      const valasz = await fetch("/api/visszajelzes", { credentials: "same-origin" });
      if (!valasz.ok) return;
      const adat = (await valasz.json()) as { visszajelzes: { tetelek: Visszajelzes[] } };
      setTetelek(adat.visszajelzes.tetelek);
    } finally {
      setTolt(false);
    }
  }, []);

  useEffect(() => {
    void betolt();
  }, [betolt]);

  async function allapotValt(id: string, uj: Allapot) {
    const regi = tetelek;
    setTetelek((lista) => lista.map((v) => (v.id === id ? { ...v, allapot: uj } : v)));
    try {
      const valasz = await fetch(`/api/visszajelzes/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allapot: uj }),
      });
      if (!valasz.ok) setTetelek(regi);
    } catch {
      setTetelek(regi);
    }
  }

  async function kepMegnyit(id: string) {
    const valasz = await fetch(`/api/visszajelzes/${id}/kep`, { credentials: "same-origin" });
    if (!valasz.ok) return;
    const adat = (await valasz.json()) as { visszajelzes: { kep: string | null } };
    if (adat.visszajelzes.kep) setKepFelugro({ id, url: adat.visszajelzes.kep });
  }

  const szurt = szuro === "mind" ? tetelek : tetelek.filter((v) => v.allapot === szuro);
  const szam = (a: Szuro) => (a === "mind" ? tetelek.length : tetelek.filter((v) => v.allapot === a).length);

  const fulek: { kulcs: Szuro; felirat: string }[] = [
    { kulcs: "mind", felirat: t("vj.oszlop_allapot") },
    { kulcs: "uj", felirat: t("vj.allapot_uj") },
    { kulcs: "elfogadva", felirat: t("vj.allapot_elfogadva") },
    { kulcs: "kesz", felirat: t("vj.allapot_kesz") },
  ];

  return (
    <>
      <div className="km-vj-fej">
        <h1 className="km-vj-cim">{t("vj.lista_cim")}</h1>
        <div className="km-vj-ful-sor" role="tablist" aria-label={t("vj.lista_cim")}>
          {fulek.map((f) => (
            <button
              key={f.kulcs}
              type="button"
              role="tab"
              aria-selected={szuro === f.kulcs}
              className="km-vj-ful"
              data-aktiv={szuro === f.kulcs}
              onClick={() => setSzuro(f.kulcs)}
            >
              {f.felirat} · {szam(f.kulcs)}
            </button>
          ))}
        </div>
      </div>

      {tolt ? null : szurt.length === 0 ? (
        <p className="km-vj-ures">{t("vj.nincs_meg")}</p>
      ) : (
        <table className="km-vj-tabla">
          <thead>
            <tr>
              <th>{t("vj.oszlop_mikor")}</th>
              <th>{t("vj.oszlop_hol")}</th>
              <th>{t("vj.oszlop_mit")}</th>
              <th>{t("vj.oszlop_kep")}</th>
              <th>{t("vj.oszlop_allapot")}</th>
            </tr>
          </thead>
          <tbody>
            {szurt.map((v) => (
              <tr key={v.id}>
                <td>
                  <span className="km-vj-mikor">{datumFormazo.format(new Date(v.letrehozva))}</span>
                  <span className="km-vj-fiok">{v.nevtelen ? t("vj.nevtelen") : v.fiok_nev}</span>
                  {rendszergazda && <span className="km-vj-szervezet">{v.szervezet_nev}</span>}
                </td>
                <td>
                  <span className="km-vj-lap">{v.lap_cim || v.lap}</span>
                  {v.elem ? (
                    <span className="km-vj-hely">{v.elem.cimke}</span>
                  ) : v.kijelolt_szoveg ? (
                    <span className="km-vj-hely km-vj-idezet">„{v.kijelolt_szoveg}”</span>
                  ) : null}
                </td>
                <td className="km-vj-szoveg">{v.szoveg}</td>
                <td>
                  {!v.van_kep ? (
                    <span className="km-vj-nincs-kep">—</span>
                  ) : (
                    <button type="button" className="km-vj-kep-gomb" onClick={() => void kepMegnyit(v.id)}>
                      {t("vj.megnezem_kepet")}
                    </button>
                  )}
                </td>
                <td>
                  <select
                    className="km-vj-allapot"
                    data-allapot={v.allapot}
                    value={v.allapot}
                    onChange={(e) => void allapotValt(v.id, e.target.value as Allapot)}
                  >
                    {ALLAPOTOK.map((a) => (
                      <option key={a} value={a}>
                        {t(`vj.allapot_${a}`)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {kepFelugro && (
        <div
          className="km-vj-kep-felugro"
          role="dialog"
          aria-modal="true"
          onClick={() => setKepFelugro(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="km-vj-kep" src={kepFelugro.url} alt={t("vj.megnezem_kepet")} />
        </div>
      )}
    </>
  );
}
