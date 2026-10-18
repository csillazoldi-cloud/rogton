"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import type { Penznem } from "../../kezdolap/tipusok";
import type { SajatNezet } from "../../koltseg/tipusok";


/** A hónapnevek a FELÜLET nyelvén jelenjenek meg, ne mindig magyarul. */
function nyelvKod(nyelv: string): string {
  return nyelv === "ro" ? "ro-RO" : nyelv === "en" ? "en-GB" : "hu-HU";
}

type Betoltes = "kesz" | "folyik" | "hiba";

function penzFormatum(usd: number, penznem: Penznem, arf: number, nyelv: string): string {
  return new Intl.NumberFormat(nyelvKod(nyelv), {
    style: "currency",
    currency: penznem,
    currencyDisplay: "narrowSymbol",
  }).format(usd * arf);
}

function idoFormatum(idoMs: number, t: (kulcs: string, ertekek?: Record<string, string | number>) => string): string {
  if (idoMs > 60000) {
    const perc = Math.round(idoMs / 60000);
    return t("koltseg.perc", { n: perc });
  }
  const mp = Math.round(idoMs / 1000);
  return t("koltseg.masodperc", { n: mp });
}

function honapLista(aktualis: string): string[] {
  const ev = Number(aktualis.slice(0, 4));
  const ho = Number(aktualis.slice(5, 7));
  const lista: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(ev, ho - 1 - i, 1);
    lista.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return lista;
}

function honapCimke(honap: string, nyelv: string): string {
  const ev = Number(honap.slice(0, 4));
  const ho = Number(honap.slice(5, 7));
  const datum = new Date(ev, ho - 1, 1);
  const honapNev = datum.toLocaleDateString(nyelvKod(nyelv), { month: "long", year: "numeric" });
  return honapNev.charAt(0).toUpperCase() + honapNev.slice(1);
}

export function KoltsegSajat({
  kezdo,
  szervezetNev,
}: {
  kezdo: SajatNezet;
  szervezetNev: string;
}) {
  const { t, f, nyelv } = useFeliratok();
  const router = useRouter();
  const [adat, setAdat] = useState<SajatNezet>(kezdo);
  const [honap, setHonap] = useState<string>(kezdo.honap);
  const [betoltes, setBetoltes] = useState<Betoltes>("kesz");


  const honapok = useMemo(() => honapLista(kezdo.honap), [kezdo.honap]);

  const szazalek = useMemo(() => {
    if (adat.keret_usd <= 0) return 0;
    return Math.min(100, (adat.usd / adat.keret_usd) * 100);
  }, [adat.usd, adat.keret_usd]);

  const maradek = useMemo(() => Math.max(0, adat.keret_usd - adat.usd), [adat.keret_usd, adat.usd]);

  const savSzin = szazalek > 80
    ? "var(--grad-headline)"
    : "var(--grad-primary)";

  async function honapValt(e: ChangeEvent<HTMLSelectElement>) {
    const ujHonap = e.target.value;
    setHonap(ujHonap);
    setBetoltes("folyik");
    try {
      const v = await fetch(`/api/koltseg?honap=${ujHonap}`, { credentials: "same-origin" });
      if (v.status === 401) { router.push("/belepes"); return; }
      const torzs = (await v.json()) as { koltseg?: SajatNezet };
      if (torzs.koltseg) {
        setAdat(torzs.koltseg);
        setBetoltes("kesz");
      } else {
        setBetoltes("hiba");
      }
    } catch {
      setBetoltes("hiba");
    }
  }

  const feladatNev = (gepiNev: string): string => {
    const kulcs = `koltseg.f_${gepiNev}`;
    return f[kulcs] ?? gepiNev;
  };

  return (
    <div className="km-koltsajat">
      <header className="km-koltsajat-fejlec">
        <div className="km-koltsajat-fejlec-bal" />
        <div className="km-koltsajat-fejlec-jobb">
          <select
            className="km-koltsajat-valaszto"
            value={honap}
            onChange={(e) => void honapValt(e)}
            aria-label={t("koltseg.honap_valaszto")}
            disabled={betoltes === "folyik"}
          >
            {honapok.map((h) => (
              <option key={h} value={h}>{honapCimke(h, nyelv)}</option>
            ))}
          </select>
        </div>
      </header>

      {betoltes === "folyik" ? (
        <div className="km-koltsajat-uzenet" data-fajta="info" aria-live="polite">{t("koltseg.betoltes")}</div>
      ) : null}
      {betoltes === "hiba" ? (
        <div className="km-koltsajat-uzenet" data-fajta="hiba" aria-live="assertive">{t("koltseg.betoltes_hiba")}</div>
      ) : null}

      <main className="km-lap-keret km-koltsajat-tartalom">
        <h1 className="km-koltsajat-lapcim">{t("koltseg.cim_sajat")}</h1>
        <p className="km-koltsajat-lapalcim">{t("koltseg.alcim_sajat")}</p>

        <section className="km-koltsajat-kartya km-koltsajat-keret-kartya">
          <div className="km-koltsajat-keret-sor">
            <div>
              <div className="km-koltsajat-cimke">{t("koltseg.elhasznalt")}</div>
              <div className="km-koltsajat-szam">
                {penzFormatum(adat.usd, adat.penznem, adat.arfolyam_egy_usd, nyelv)}
                <span className="km-koltsajat-szam-keret"> / {penzFormatum(adat.keret_usd, adat.penznem, adat.arfolyam_egy_usd, nyelv)}</span>
              </div>
            </div>
            <div className="km-koltsajat-maradek">
              <div className="km-koltsajat-cimke">{t("koltseg.marad")}</div>
              <div className="km-koltsajat-szam km-koltsajat-maradek-ertek">{penzFormatum(maradek, adat.penznem, adat.arfolyam_egy_usd, nyelv)}</div>
            </div>
          </div>
          <div className="km-koltsajat-sav">
            <div className="km-koltsajat-sav-belso" style={{ width: `${szazalek}%`, background: savSzin }} />
          </div>
          <div className="km-koltsajat-sav-lablec">
            <div className="km-koltsajat-megjegyzes">{t("koltseg.elhasznalva_szazalek", { n: Math.round(szazalek) })}</div>
            <div className="km-koltsajat-megjegyzes">{t("koltseg.ujraindul")}</div>
          </div>
        </section>

        <div className="km-koltsajat-racs">
          <section className="km-koltsajat-kartya km-koltsajat-tablazat-kartya">
            <h2 className="km-koltsajat-kartyacim">{t("koltseg.mire_ment")}</h2>
            <table className="km-koltsajat-tablazat">
              <thead>
                <tr>
                  <th style={{ width: "44%" }}>{t("koltseg.o_feladat")}</th>
                  <th>{t("koltseg.o_hivas")}</th>
                  <th>{t("koltseg.o_gepido")}</th>
                  <th className="km-koltsajat-jobbra">{t("koltseg.o_koltseg")}</th>
                </tr>
              </thead>
              <tbody>
                {adat.feladatok.map((f) => (
                  <tr key={f.feladat}>
                    <td>{feladatNev(f.feladat)}</td>
                    <td className="km-koltsajat-mono">{f.hivasok}</td>
                    <td className="km-koltsajat-mono">{idoFormatum(f.ido_ms, t)}</td>
                    <td className="km-koltsajat-mono km-koltsajat-jobbra">{penzFormatum(f.usd, adat.penznem, adat.arfolyam_egy_usd, nyelv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="km-koltsajat-kartya km-koltsajat-hely-kartya">
            <h2 className="km-koltsajat-kartyacim">{t("koltseg.hol_dolgozik")}</h2>
            <div className="km-koltsajat-hely-sor">
              <span className="km-koltsajat-pont" style={{ background: "var(--ok)" }} />
              <div>
                <div className="km-koltsajat-hely-cim">{t("koltseg.hazon_beluli_gep")}</div>
                <div className="km-koltsajat-megjegyzes">
                  {t("koltseg.hivas_ingyen", { n: adat.helyi_hivasok })}
                </div>
              </div>
            </div>
            <div className="km-koltsajat-hely-sor">
              <span className="km-koltsajat-pont" style={{ background: "var(--warn)" }} />
              <div>
                <div className="km-koltsajat-hely-cim">{t("koltseg.kulso_szolgaltato")}</div>
                <div className="km-koltsajat-megjegyzes">
                  {t("koltseg.hivas_fizetos", { n: adat.felho_hivasok })}
                </div>
              </div>
            </div>
            <div className="km-koltsajat-hely-lablec">
              <p className="km-koltsajat-megjegyzes">{t("koltseg.ki_allitja")}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
