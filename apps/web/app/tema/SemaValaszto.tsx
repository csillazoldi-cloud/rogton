"use client";
import { useState } from "react";
import { SEMAK, semaKeres, type SemaKod } from "@km/design-system";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";

type Nyelv = "hu" | "ro" | "en";

export function SemaValaszto({
  aktivKod,
  nyelv,
  kozos,
  onValtva,
}: {
  aktivKod: string | null;
  nyelv: Nyelv;
  kozos: boolean;
  onValtva: () => void;
}) {
  const { t } = useFeliratok();
  // R-10: a váltás után a válaszból frissül, hogy a közös szinten is az igazat mutassa (ott nincs kezdő érték)
  const [aktivHelyi, setAktivHelyi] = useState<string | null>(aktivKod);
  const aktiv: SemaKod = (aktivHelyi ?? "ejkek") as SemaKod;
  const [fut, setFut] = useState<string | null>(null);
  const [uzenet, setUzenet] = useState<{ ok: boolean; szoveg: string } | null>(null);

  async function valtas(kod: SemaKod) {
    if (fut) return;
    setFut(kod);
    setUzenet(null);
    const ut = kozos ? "/api/tema/kozos/sema" : "/api/tema/sema";
    const r = await hivas(ut, "PUT", { kod });
    setFut(null);
    if (r.statusz !== 200) {
      setUzenet({ ok: false, szoveg: t("tema.sema.hiba") });
      return;
    }
    const sema = semaKeres(kod);
    const tema = r.torzs["tema"] as { sema_kod?: string | null } | undefined;
    setAktivHelyi(tema?.sema_kod ?? kod);
    setUzenet({ ok: true, szoveg: t("tema.sema.valtva", { nev: sema ? sema.nev[nyelv] : kod }) });
    onValtva();
  }

  return (
    <section className="km-sema">
      <h2 className="km-sema-cim">{t("tema.sema.cim")}</h2>
      <p className="km-sema-magyarazat">{t("tema.sema.magyarazat")}</p>
      <div className="km-sema-racs">
        {SEMAK.map((sema) => {
          const aktivE = sema.kod === aktiv;
          const tok = sema.tokenek;
          const aurora = tok["--aurora-opacity"] !== "0";
          return (
            <div
              key={sema.kod}
              className={"km-sema-csempe" + (aktivE ? " km-sema-csempe--aktiv" : "")}
            >
              <div
                className="km-sema-elonezet"
                style={{ background: tok["--bg"], borderColor: tok["--text-mut"] }}
              >
                {aurora ? (
                  <span
                    className="km-sema-fenykorong"
                    style={{ background: tok["--primary"] }}
                    aria-hidden="true"
                  />
                ) : null}
                <div
                  className="km-sema-fejsav"
                  style={{ background: tok["--bg-elev"], borderColor: tok["--text-mut"] }}
                >
                  <span className="km-sema-pont" style={{ background: tok["--primary"] }} />
                  <span className="km-sema-vonal" style={{ background: tok["--text"] }} />
                  <span className="km-sema-vonal km-sema-vonal--rovid" style={{ background: tok["--text-mut"] }} />
                </div>
                <div className="km-sema-kartyak">
                  <div
                    className="km-sema-kartya"
                    style={{ background: tok["--bg-elev"], borderColor: tok["--text-mut"] }}
                  >
                    <span className="km-sema-cimke" style={{ background: tok["--primary"] }} />
                    <span className="km-sema-sor" style={{ background: tok["--text"] }} />
                    <span className="km-sema-sor km-sema-sor--rovid" style={{ background: tok["--text"] }} />
                    <span className="km-sema-gomb-mini" style={{ background: tok["--primary"] }} />
                  </div>
                  <div
                    className="km-sema-kartya"
                    style={{ background: tok["--bg-elev"], borderColor: tok["--text-mut"] }}
                  >
                    <span className="km-sema-cimke" style={{ background: tok["--text-mut"] }} />
                    <span className="km-sema-sor" style={{ background: tok["--text"] }} />
                    <span className="km-sema-sor km-sema-sor--rovid" style={{ background: tok["--text"] }} />
                    <span className="km-sema-gomb-mini km-sema-gomb-mini--ures" style={{ borderColor: tok["--text-mut"] }} />
                  </div>
                </div>
              </div>
              <div className="km-sema-szoveg">
                <h3 className="km-sema-nev">{sema.nev[nyelv]}</h3>
                <p className="km-sema-leiras">{sema.leiras[nyelv]}</p>
              </div>
              <div className="km-sema-muvelet">
                {aktivE ? (
                  <span className="km-sema-jelveny">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {t("tema.sema.aktiv")}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="km-sema-gomb"
                    onClick={() => void valtas(sema.kod)}
                    disabled={fut !== null}
                  >
                    {fut === sema.kod ? t("tema.sema.valtas_folyamatban") : t("tema.sema.valt")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {uzenet ? (
        <p className="km-sema-uzenet" data-fajta={uzenet.ok ? "ok" : "hiba"} aria-live="polite">
          {uzenet.szoveg}
        </p>
      ) : null}
    </section>
  );
}
// tokenőr: ok — a séma saját értékei, adat
