"use client";

import { useCallback, useMemo, useState } from "react";
import type { SajatFiokNezet, MunkaterSor, KilepValasz } from "../../sajatfiok/tipusok";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import "./sajat-fiok.css";

type JelszoAllapot = "ures" | "folyik" | "kesz" | "hiba_jelenlegi";
type NevMentesAllapot = "ures" | "folyik" | "kesz" | "hiba";

/** a rajz időformátuma: „Ma, 14:18" ha mai nap, különben MM-dd HH:mm */
function idoSzoveg(f: Intl.DateTimeFormat, d: Date | string, maKulcs: string | undefined): string {
  const datum = typeof d === "string" ? new Date(d) : d;
  const most = new Date();
  const maiNap = most.getFullYear() === datum.getFullYear() &&
    most.getMonth() === datum.getMonth() &&
    most.getDate() === datum.getDate();

  if (maiNap && maKulcs) {
    const r: Record<string, string> = {};
    for (const p of f.formatToParts(datum)) r[p.type] = p.value;
    // a kulcs értéke „ma {ido}" — a helyőrzőt töltjük, nem fűzünk hozzá (R-7c 08: „Ma, 14:18")
    return maKulcs.replace("{ido}", `${r["hour"] ?? "--"}:${r["minute"] ?? "--"}`);
  }

  const r: Record<string, string> = {};
  for (const p of f.formatToParts(datum)) r[p.type] = p.value;
  return `${r["month"] ?? "--"}-${r["day"] ?? "--"} ${r["hour"] ?? "--"}:${r["minute"] ?? "--"}`;
}

const NYELVEK: { kod: "hu" | "ro" | "en"; nev: string }[] = [
  { kod: "hu", nev: "Magyar" },
  { kod: "ro", nev: "Română" },
  { kod: "en", nev: "English" },
];

export function SajatFiok({ nezet }: { nezet: SajatFiokNezet }) {
  const { t, nyelv } = useFeliratok();

  const [nev, setNev] = useState(nezet.fiok.nev);
  const [nevMentesAllapot, setNevMentesAllapot] = useState<NevMentesAllapot>("ures");
  const [nevHiba, setNevHiba] = useState(false);

  const [jelenlegiJelszo, setJelenlegiJelszo] = useState("");
  const [ujJelszo, setUjJelszo] = useState("");
  const [ujJelszoMegegyszer, setUjJelszoMegegyszer] = useState("");
  const [jelszoAllapot, setJelszoAllapot] = useState<JelszoAllapot>("ures");
  const [jelszoKeszEszkozok, setJelszoKeszEszkozok] = useState(0);

  const [kileptetesAllapot, setKileptetesAllapot] = useState<"ures" | "folyik" | "kesz">("ures");
  const [kileptetesKeszSzam, setKileptetesKeszSzam] = useState(0);

  const [kilepMegerositMunkater, setKilepMegerositMunkater] = useState<MunkaterSor | null>(null);
  const [kilepHibaMunkaterId, setKilepHibaMunkaterId] = useState<string | null>(null);

  const idoFormatum = useMemo(() => {
    return new Intl.DateTimeFormat(nyelv, {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Bucharest",
    });
  }, [nyelv]);

  const nevValtozik = useCallback((ertek: string) => {
    setNev(ertek);
    setNevHiba(false);
    setNevMentesAllapot("ures");
  }, []);

  const nevMentese = useCallback(async () => {
    if (!nev.trim()) {
      setNevHiba(true);
      setNevMentesAllapot("hiba");
      return;
    }
    setNevMentesAllapot("folyik");
    const eredmeny = await hivas("/api/fiok/nev", "PUT", { nev: nev.trim() });
    if (eredmeny.statusz === 200) {
      setNevMentesAllapot("kesz");
    } else {
      setNevHiba(true);
      setNevMentesAllapot("hiba");
    }
  }, [nev]);

  const jelszoMentese = useCallback(async () => {
    if (ujJelszo.length < 10 || ujJelszo !== ujJelszoMegegyszer) return;
    setJelszoAllapot("folyik");
    const eredmeny = await hivas("/api/fiok/jelszo", "PUT", { jelenlegi: jelenlegiJelszo, uj: ujJelszo });
    if (eredmeny.statusz === 200 && "fiok" in eredmeny.torzs && typeof eredmeny.torzs.fiok === "object" && eredmeny.torzs.fiok !== null) {
      const fiok = eredmeny.torzs.fiok as Record<string, unknown>;
      const eszkozok = typeof fiok.masEszkozokKileptetve === "number" ? fiok.masEszkozokKileptetve : 0;
      setJelszoKeszEszkozok(eszkozok);
      setJelszoAllapot("kesz");
      setJelenlegiJelszo("");
      setUjJelszo("");
      setUjJelszoMegegyszer("");
    } else if (eredmeny.statusz === 400 && "hiba" in eredmeny.torzs && eredmeny.torzs.hiba === "ROSSZ_JELENLEGI_JELSZO") {
      setJelszoAllapot("hiba_jelenlegi");
    } else {
      setJelszoAllapot("ures");
    }
  }, [jelenlegiJelszo, ujJelszo, ujJelszoMegegyszer]);

  const kileptetesMindenhol = useCallback(async () => {
    setKileptetesAllapot("folyik");
    const eredmeny = await hivas("/api/fiok/kileptetes-mindenhol", "POST", {});
    if (eredmeny.statusz === 200 && "fiok" in eredmeny.torzs && typeof eredmeny.torzs.fiok === "object" && eredmeny.torzs.fiok !== null) {
      const fiok = eredmeny.torzs.fiok as Record<string, unknown>;
      const torolt = typeof fiok.torolt === "number" ? fiok.torolt : 0;
      setKileptetesKeszSzam(torolt);
      setKileptetesAllapot("kesz");
    } else {
      setKileptetesAllapot("ures");
    }
  }, []);

  const nyelvValt = useCallback(async (ujNyelv: "hu" | "ro" | "en") => {
    await hivas("/api/nyelv", "POST", { nyelv: ujNyelv });
    window.location.reload();
  }, []);

  const kilepGomb = useCallback((munkater: MunkaterSor) => {
    setKilepMegerositMunkater(munkater);
    setKilepHibaMunkaterId(null);
  }, []);

  const kilepMegse = useCallback(() => {
    setKilepMegerositMunkater(null);
  }, []);

  const kilepMegerosit = useCallback(async () => {
    if (!kilepMegerositMunkater) return;
    const eredmeny = await hivas("/api/tagok/kilep", "POST", { szervezet_id: kilepMegerositMunkater.id });
    if (eredmeny.statusz === 200) {
      const valasz = eredmeny.torzs as unknown as KilepValasz;
      if (valasz.kovetkezo_szervezet_id !== null) {
        window.location.href = "/sajat-fiok";
      } else {
        window.location.href = "/szervezet/uj";
      }
    } else if (eredmeny.statusz === 409 && "hiba" in eredmeny.torzs && eredmeny.torzs.hiba === "UTOLSO_TULAJDONOS") {
      setKilepHibaMunkaterId(kilepMegerositMunkater.id);
      setKilepMegerositMunkater(null);
    }
  }, [kilepMegerositMunkater]);

  const jelszoRovid = ujJelszo.length > 0 && ujJelszo.length < 10;
  const jelszoNemEgyezik = ujJelszoMegegyszer.length > 0 && ujJelszo !== ujJelszoMegegyszer;
  const jelszoGombZarva = jelszoRovid || jelszoNemEgyezik || ujJelszo.length === 0 || ujJelszoMegegyszer.length === 0 || jelenlegiJelszo.length === 0;

  const szerepSzin = (szerep: string): { szin: string; bg: string } => {
    if (szerep === "tulajdonos") return { szin: "var(--src-ai)", bg: "var(--src-ai-bg)" };
    if (szerep === "szerkeszto") return { szin: "var(--src-web)", bg: "var(--src-web-bg)" };
    return { szin: "var(--src-empty)", bg: "var(--src-empty-bg)" };
  };

  const maKulcs = t("kezdolap.ma") !== "kezdolap.ma" ? t("kezdolap.ma") : undefined;

  return (
    <div className="km-sf-lap">
      <div className="km-sf-fejlec-sor">
        <div className="km-sf-oldalsav">
          <span className="km-sf-oldalsav-cim">{t("sajat.oldalsav_cim")}</span>
          <div className="km-sf-oldalsav-aktiv">
            <span className="km-sf-oldalsav-aktiv-szoveg">{t("sajat.cim")}</span>
          </div>
          <a href="/beallitasok" className="km-sf-oldalsav-link">
            <span className="km-sf-oldalsav-link-szoveg">{t("nav.beallitasok")}</span>
            {nezet.ertesites_olvasatlan > 0 ? (
              <span className="km-sf-oldalsav-jelveny">{t("ertesites.oldalsav_szam", { n: nezet.ertesites_olvasatlan })}</span>
            ) : null}
          </a>
        </div>

        <div className="km-sf-fejlec">
          <h1 className="km-sf-cim">{t("sajat.cim")}</h1>
          <p className="km-sf-bevezeto">{t("sajat.bevezeto")}</p>
        </div>
      </div>

      <div className="km-sf-racs">
        {/* Adataim */}
        <div className="km-sf-kartya">
          <h2 className="km-sf-kartya-cim">{t("sajatfiok.adataim")}</h2>

          <div className="km-sf-mezo-csoport">
            <label htmlFor="sf-nev" className="km-sf-mezo-cimke">{t("sajat.nev_cimke")}</label>
            <input
              id="sf-nev"
              type="text"
              value={nev}
              onChange={(e) => nevValtozik(e.target.value)}
              className={`km-sf-mezo ${nevHiba ? "km-sf-mezo-hiba" : ""}`}
              style={nevHiba ? { borderColor: "var(--err-strong)" } : undefined}
            />
            {nevHiba ? (
              <span className="km-sf-hiba-szoveg">{t("fiok.hiba_ervenytelen_adat")}</span>
            ) : null}
            {nevHiba ? (
              <span className="km-sf-hiba-megj">{t("sajat.nev_hiba_mit")}</span>
            ) : (
              <span className="km-sf-mezo-megj">{t("sajat.nev_megj")}</span>
            )}
          </div>

          <div className="km-sf-mezo-csoport">
            <div className="km-sf-mezo-fej">
              <label htmlFor="sf-email" className="km-sf-mezo-cimke">{t("sajat.email_cimke")}</label>
              <span className="km-sf-keszul-jelveny">{t("jelzes.meg_nem_mukodik")}</span>
            </div>
            <input
              id="sf-email"
              type="text"
              value={nezet.fiok.email}
              readOnly
              dir="ltr"
              className="km-sf-mezo km-sf-mezo-zart"
            />
            <span className="km-sf-mezo-megj">{t("sajat.email_megj")}</span>
          </div>

          <div className="km-sf-mezo-csoport">
            <label htmlFor="sf-nyelv" className="km-sf-mezo-cimke">{t("sajatfiok.felulet_nyelve")}</label>
            <select
              id="sf-nyelv"
              value={nyelv} /* F9-Sz5: a felület tényleges nyelve (ugyanaz, mint a fejlécé) */
              onChange={(e) => nyelvValt(e.target.value as "hu" | "ro" | "en")}
              className="km-sf-mezo km-sf-mezo-select"
            >
              {NYELVEK.map((n) => (
                <option key={n.kod} value={n.kod}>{n.nev}</option>
              ))}
            </select>
          </div>

          <div className="km-sf-gomb-sor">
            <button
              type="button"
              onClick={nevMentese}
              disabled={nevMentesAllapot === "folyik"}
              className="km-sf-gomb km-sf-gomb-prim"
            >
              {nevMentesAllapot === "folyik" ? (
                <>
                  <span className="km-sf-porog" aria-hidden="true" />
                  <span>{t("sajat.nev_mentes_gomb")}</span>
                </>
              ) : (
                t("sajatfiok.mentes")
              )}
            </button>
            {nevMentesAllapot === "kesz" ? (
              <span className="km-sf-mentve-jel">✓</span>
            ) : null}
          </div>
        </div>

        {/* Biztonság */}
        <div className="km-sf-kartya">
          <h2 className="km-sf-kartya-cim">{t("sajatfiok.biztonsag")}</h2>

          {jelszoAllapot === "kesz" ? (
            <div className="km-sf-jelszo-kesz">
              <div className="km-sf-jelszo-kesz-fej">
                <span className="km-sf-ok-pont" aria-hidden="true" />
                <h2 className="km-sf-kartya-cim km-sf-kartya-cim-ok">{t("sajat.jelszo_kesz_cim")}</h2>
              </div>
              <p className="km-sf-jelszo-kesz-szoveg">{t("sajat.jelszo_kesz_szoveg", { n: jelszoKeszEszkozok })}</p>
              <p className="km-sf-jelszo-kesz-megj">{t("sajat.jelszo_kesz_megj")}</p>
            </div>
          ) : (
            <>
              <div className="km-sf-mezo-csoport">
                <label htmlFor="sf-jelenlegi" className="km-sf-mezo-cimke">{t("sajat.jelenlegi_cimke")}</label>
                <input
                  id="sf-jelenlegi"
                  type="password"
                  value={jelenlegiJelszo}
                  onChange={(e) => { setJelenlegiJelszo(e.target.value); setJelszoAllapot("ures"); }}
                  disabled={jelszoAllapot === "folyik"}
                  className={`km-sf-mezo ${jelszoAllapot === "hiba_jelenlegi" ? "km-sf-mezo-hiba" : ""}`}
                  style={jelszoAllapot === "hiba_jelenlegi" ? { borderColor: "var(--err-strong)" } : undefined}
                  aria-label={t("sajat.jelenlegi_cimke")}
                />
                {jelszoAllapot === "hiba_jelenlegi" ? (
                  <>
                    <span className="km-sf-hiba-szoveg">{t("fiok.hiba_rossz_jelenlegi_jelszo")}</span>
                    <span className="km-sf-hiba-megj">{t("sajat.jelszo_hiba_mit")}</span>
                  </>
                ) : null}
              </div>

              <div className="km-sf-mezo-csoport">
                <label htmlFor="sf-uj" className="km-sf-mezo-cimke">{t("sajat.uj_cimke")}</label>
                <input
                  id="sf-uj"
                  type="password"
                  value={ujJelszo}
                  onChange={(e) => { setUjJelszo(e.target.value); setJelszoAllapot("ures"); }}
                  disabled={jelszoAllapot === "folyik"}
                  className={`km-sf-mezo ${jelszoRovid ? "km-sf-mezo-hiba" : ""}`}
                  style={jelszoRovid ? { borderColor: "var(--err-strong)" } : undefined}
                  aria-label={t("sajat.uj_cimke")}
                />
                <span className="km-sf-mezo-megj">{t("sajat.jelszo_hossz")}</span>
                {jelszoRovid ? (
                  <>
                    <span className="km-sf-hiba-szoveg">{t("sajat.jelszo_rovid")}</span>
                    <span className="km-sf-hiba-megj">{t("sajat.jelszo_rovid_mit")}</span>
                  </>
                ) : null}
              </div>

              <div className="km-sf-mezo-csoport">
                <label htmlFor="sf-uj-megegyszer" className="km-sf-mezo-cimke">{t("sajat.uj_megegyszer_cimke")}</label>
                <input
                  id="sf-uj-megegyszer"
                  type="password"
                  value={ujJelszoMegegyszer}
                  onChange={(e) => { setUjJelszoMegegyszer(e.target.value); setJelszoAllapot("ures"); }}
                  disabled={jelszoAllapot === "folyik"}
                  className={`km-sf-mezo ${jelszoNemEgyezik ? "km-sf-mezo-hiba" : ""}`}
                  style={jelszoNemEgyezik ? { borderColor: "var(--err-strong)" } : undefined}
                  aria-label={t("sajat.uj_megegyszer_cimke")}
                />
                {jelszoNemEgyezik ? (
                  <>
                    <span className="km-sf-hiba-szoveg">{t("sajat.jelszo_nem_egyezik")}</span>
                    <span className="km-sf-hiba-megj">{t("sajat.jelszo_nem_egyezik_mit")}</span>
                  </>
                ) : null}
              </div>

              <div className="km-sf-figyelmeztetes">
                <span className="km-sf-figyelmeztetes-cim">{t("sajatfiok.jelszovaltas_kov")}</span>
                <span className="km-sf-figyelmeztetes-szoveg">{t("sajat.jelszo_kovetkezmeny")}</span>
              </div>

              <button
                type="button"
                onClick={jelszoMentese}
                disabled={jelszoGombZarva || jelszoAllapot === "folyik"}
                className="km-sf-gomb km-sf-gomb-prim"
              >
                {jelszoAllapot === "folyik" ? (
                  <>
                    <span className="km-sf-porog" aria-hidden="true" />
                    <span>{t("sajat.jelszo_mentes_kozben")}</span>
                  </>
                ) : (
                  t("sajatfiok.jelszovaltas")
                )}
              </button>
            </>
          )}

          <div className="km-sf-elvalaszto" />

          <div className="km-sf-kileptetes-csoport">
            <span className="km-sf-kileptetes-megj">{t("sajat.kileptetes_megj")}</span>
            {kileptetesAllapot === "kesz" ? (
              <div className="km-sf-kileptetes-kesz">
                {kileptetesKeszSzam === 0 ? (
                  <span>{t("sajat.kileptetes_nulla")}</span>
                ) : (
                  <span>{t("sajat.kileptetes_kesz", { n: kileptetesKeszSzam })}</span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={kileptetesMindenhol}
                disabled={kileptetesAllapot === "folyik"}
                className="km-sf-gomb km-sf-gomb-szellem"
              >
                {t("sajatfiok.kileptetes_mind")}
              </button>
            )}
          </div>

          <div className="km-sf-elvalaszto" />

          <div className="km-sf-belepesek-csoport">
            <div className="km-sf-belepesek-fej">
              <span className="km-sf-belepesek-alcim">{t("sajatfiok.belepesek")}</span>
              <span className="km-sf-belepesek-sugo">{t("sajatfiok.belepesek_sugo")}</span>
            </div>
            {nezet.belepesek.length > 0 ? (
              <div className="km-sf-belepesek-lista">
                {nezet.belepesek.map((belepes, i) => (
                  <div key={i} className="km-sf-belepes-sor">
                    <span className={`km-sf-belepes-ido ${!belepes.sikeres ? "km-sf-belepes-ido-sikertelen" : ""}`}>
                      {idoSzoveg(idoFormatum, belepes.ido, maKulcs)}
                    </span>
                    <span className="km-sf-belepes-cim" dir="ltr">{belepes.cim}</span>
                    <span
                      className="km-sf-belepes-jelveny"
                      style={{
                        color: belepes.sikeres ? "var(--ok)" : "var(--err)",
                        background: belepes.sikeres ? "var(--ok-bg)" : "var(--err-bg)",
                      }}
                    >
                      {belepes.sikeres ? t("sajat.belepes_sikeres") : t("sajat.belepes_sikertelen")}
                    </span>
                  </div>
                ))}
              </div>
            ) : nezet.utolso_belepes ? (
              <div className="km-sf-belepes-sor">
                <span className="km-sf-belepes-ido">{idoSzoveg(idoFormatum, nezet.utolso_belepes, maKulcs)}</span>
              </div>
            ) : null}
            <span className="km-sf-belepesek-megj">{t("sajat.belepesek_megorzes")}</span>
          </div>
        </div>
      </div>

      {/* Szervezeteim */}
      <div className="km-sf-munkaterek-kartya">
        <div className="km-sf-munkaterek-fej">
          <h2 className="km-sf-kartya-cim">{t("sajatfiok.szervezeteim")}</h2>
          <span className="km-sf-munkaterek-szam">{t("sajat.munkatereim_szam", { n: nezet.munkaterek.length })}</span>
        </div>
        {nezet.munkaterek.length === 1 ? (
          <p className="km-sf-egy-munkater-megj">{t("sajat.egy_munkater_megj")}</p>
        ) : null}
        <div className="km-sf-munkaterek-lista">
          {nezet.munkaterek.map((mt) => {
            const szerepStilus = szerepSzin(mt.szerep);
            const megerosit = kilepMegerositMunkater?.id === mt.id;
            const hiba = kilepHibaMunkaterId === mt.id;
            return (
              <div
                key={mt.id}
                className={`km-sf-munkater-sor ${megerosit ? "km-sf-munkater-sor-kiemelt" : ""}`}
              >
                <div className="km-sf-munkater-nev-sor">
                  <span className="km-sf-munkater-nev">{mt.nev}</span>
                  {mt.aktualis ? (
                    <span className="km-sf-munkater-jelveny" style={{ color: "var(--src-web)", background: "var(--src-web-bg)" }}>
                      {t("sajat.aktualis")}
                    </span>
                  ) : null}
                </div>
                <span
                  className="km-sf-munkater-szerep"
                  style={{ color: szerepStilus.szin, background: szerepStilus.bg }}
                >
                  {t(`nav.szerep_${mt.szerep}`)}
                </span>
                <div className="km-sf-munkater-akcio">
                  {mt.utolso_tulajdonos ? (
                    <div className="km-sf-munkater-zart">
                      <button type="button" disabled className="km-sf-gomb km-sf-gomb-zart">
                        {t("sajatfiok.kilepes_munkaterbol")}
                      </button>
                      <div className="km-sf-munkater-zart-szoveg">
                        <span className="km-sf-munkater-zart-figyelmeztetes">{t("hozzaferes.hiba_utolso_tulajdonos")}</span>
                        <span className="km-sf-munkater-zart-mit">{t("sajat.kilepek_zart_mit")}</span>
                      </div>
                    </div>
                  ) : megerosit ? (
                    <span className="km-sf-munkater-jelveny" style={{ color: "var(--warn)", border: "var(--bw) solid var(--warn-border)" }}>
                      {t("sajat.megerositesre_var")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => kilepGomb(mt)}
                      className="km-sf-gomb km-sf-gomb-szellem"
                    >
                      {t("sajatfiok.kilepes_munkaterbol")}
                    </button>
                  )}
                </div>
                {hiba ? (
                  <div className="km-sf-munkater-hiba">
                    <span className="km-sf-munkater-zart-figyelmeztetes">{t("hozzaferes.hiba_utolso_tulajdonos")}</span>
                    <span className="km-sf-munkater-zart-mit">{t("sajat.kilepek_zart_mit")}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rendszergazdai blokk */}
      {nezet.fiok.rendszergazda ? (
        <div className="km-sf-kartya">
          <div className="km-sf-gazda-fej">
            <h2 className="km-sf-kartya-cim">{t("sajat.gazda_cim")}</h2>
            <span className="km-sf-gazda-jelveny">{t("sajat.gazda_jelveny")}</span>
          </div>
          <p className="km-sf-gazda-megj">{t("sajat.gazda_megj")}</p>
          <div className="km-sf-gazda-linkek">
            <a href="/fiokok" className="km-sf-gazda-link">{t("sajat.gazda_fiokok")}</a>
            <a href="/tema" className="km-sf-gazda-link">{t("sajat.gazda_tema")}</a>
            <a href="/feliratok" className="km-sf-gazda-link">{t("sajat.gazda_feliratok")}</a>
            <a href="/koltseg" className="km-sf-gazda-link">{t("sajat.gazda_koltseg")}</a>
          </div>
        </div>
      ) : null}

      {/* Értesítések és adatpolitika */}
      <div className="km-sf-ertesitesek-kartya">
        <div className="km-sf-ertesitesek-szoveg">
          <span className="km-sf-ertesitesek-cim">{t("sajat.ertesitesek_cim")}</span>
          <span className="km-sf-ertesitesek-megj">{t("sajat.ertesitesek_megj")}</span>
        </div>
        <a href="/beallitasok" className="km-sf-ertesitesek-link">
          {t("nav.beallitasok")} →
        </a>
      </div>

      {/* Torles halk sor */}
      <p className="km-sf-torles-megj">{t("sajat.torles_megj")}</p>

      {/* Megerősítő sáv */}
      {kilepMegerositMunkater ? (
        <div className="km-sf-megerosito-sav">
          <div className="km-sf-megerosito-szoveg">
            <span className="km-sf-megerosito-cim">{t("sajat.kilepek_megerosit_cim", { munkater: kilepMegerositMunkater.nev })}</span>
            <span className="km-sf-megerosito-megj">{t("sajat.kilepek_megerosit_szoveg")}</span>
          </div>
          <div className="km-sf-megerosito-gombok">
            <button type="button" onClick={kilepMegse} className="km-sf-gomb km-sf-gomb-szellem">
              {t("kozos.megse")}
            </button>
            <button type="button" onClick={kilepMegerosit} className="km-sf-gomb km-sf-gomb-prim">
              {t("sajat.kilepek_megerosit_gomb")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
