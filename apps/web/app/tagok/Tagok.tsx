"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TagokNezet, TagSor, MeghivoSor, Szerep, TagEsemenySor } from "../../tagok/tipusok";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import { hibaKod } from "../_kozos/hibaszoveg";
import { FoGomb, Info, KerdesCim } from "../_kozos/R15";
import "../_kozos/r15-lapok.css";
import "../_kozos/r13.css";

type MegerositTipus = "szerep" | "eltavolitas" | null;

type MegerositAllapot = {
  tipus: "szerep";
  fiokId: string;
  nev: string;
  regiSzerep: Szerep;
  ujSzerep: Szerep;
} | {
  tipus: "eltavolitas";
  fiokId: string;
  nev: string;
} | null;

type MeghivoEredmeny = {
  link: string;
  szerep: Szerep;
  email: string | null;
  lejar: string;
} | null;

const ZONA = "Europe/Bucharest";

const SZEREP_SORREND: Szerep[] = ["nezo", "szerkeszto", "tulajdonos"];

/** R-13 13b0 (Csilla 10-03): a tulajdonosnak egy halk „Kreditek ›” sor a tagok alatt; `egyenlo` = senkinek nincs külön összege
 *  (akkor a sor kis szövege „mindenki egyenlő részt kap”). null = nem tulajdonos: nincs sor. */
export type TagokKredit = { egyenlo: boolean } | null;

export function Tagok({ nezet, kredit = null, meghivoNyitva: nyitvaIndul = false }: { nezet: TagokNezet; kredit?: TagokKredit; meghivoNyitva?: boolean }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();

  const [meghivoNyitva, setMeghivoNyitva] = useState(nyitvaIndul && (nezet.szerep === "tulajdonos" || nezet.szerep === "szerkeszto"));
  const [valasztottSzerep, setValasztottSzerep] = useState<Szerep>("nezo");
  const [megjegyzes, setMegjegyzes] = useState("");
  const [meghivoFut, setMeghivoFut] = useState(false);
  const [meghivoEredmeny, setMeghivoEredmeny] = useState<MeghivoEredmeny>(null);
  const [meghivoHiba, setMeghivoHiba] = useState<string | null>(null);

  const [szerkesztettSor, setSzerkesztettSor] = useState<string | null>(null);
  const [szerkesztettSzerep, setSzerkesztettSzerep] = useState<Szerep | null>(null);
  const [megerosit, setMegerosit] = useState<MegerositAllapot>(null);
  const [megerositFut, setMegerositFut] = useState(false);

  const [visszavonasFut, setVisszavonasFut] = useState<Set<string>>(new Set());
  const [visszavonasHiba, setVisszavonasHiba] = useState<Record<string, string>>({});

  const parbeszedElsoMezo = useRef<HTMLInputElement | null>(null);

  const tulajdonos = nezet.szerep === "tulajdonos";
  const meghivoJog = tulajdonos || nezet.szerep === "szerkeszto";

  useEffect(() => {
    if (meghivoNyitva && !meghivoEredmeny) {
      parbeszedElsoMezo.current?.focus();
    }
  }, [meghivoNyitva, meghivoEredmeny]);

  const datumFormat = useCallback((iso: string) => {
    try {
      return new Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeZone: ZONA }).format(new Date(iso));
    } catch {
      return iso;
    }
  }, [nyelv]);

  const rovidDatum = useCallback((iso: string) => {
    // „MM-DD HH:mm" a munkatér időzónájában — NEM a gép helyi idejével (getHours): a kiszolgáló UTC-s doboz, a böngésző nem → 418-as hidratálási hiba (a teszten mérve)
    try {
      const r = new Intl.DateTimeFormat("en-GB", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA }).formatToParts(new Date(iso));
      const g = (tipus: string) => r.find((x) => x.type === tipus)?.value ?? "";
      return `${g("month")}-${g("day")} ${g("hour")}:${g("minute")}`;
    } catch {
      return iso;
    }
  }, []);

  const meghivoKuldes = async () => {
    setMeghivoFut(true);
    setMeghivoHiba(null);
    const { statusz, torzs } = await hivas("/api/tagok/meghivo", "POST", {
      szerep: valasztottSzerep,
      ...(megjegyzes.trim() ? { megjegyzes: megjegyzes.trim() } : {}),
    });
    setMeghivoFut(false);
    if (statusz === 201 && torzs && typeof torzs === "object" && "hozzaferes" in torzs) {
      const h = torzs["hozzaferes"] as Record<string, unknown>;
      const meghivo = h?.["meghivo"] as Record<string, unknown> | undefined;
      const link = typeof h?.["link"] === "string" ? h["link"] : "";
      if (meghivo && link) {
        setMeghivoEredmeny({
          link,
          szerep: (meghivo["szerep"] as Szerep) ?? valasztottSzerep,
          email: (meghivo["email"] as string | null) ?? null,
          lejar: (meghivo["lejar"] as string) ?? "",
        });
        return;
      }
    }
    const kod = hibaKod(torzs);
    setMeghivoHiba(kod ? `hozzaferes.hiba_${kod.toLowerCase()}` : "hiba.ALTALANOS");
  };

  const meghivoBezar = () => {
    setMeghivoNyitva(false);
    setMeghivoEredmeny(null);
    setMeghivoHiba(null);
    setMegjegyzes("");
    setValasztottSzerep("nezo");
    router.refresh();
  };

  const szerepValtozas = (sor: TagSor, uj: Szerep) => {
    if (uj === sor.szerep) {
      setSzerkesztettSor(null);
      setSzerkesztettSzerep(null);
      setMegerosit(null);
      return;
    }
    setSzerkesztettSor(sor.fiok_id);
    setSzerkesztettSzerep(uj);
    setMegerosit({
      tipus: "szerep",
      fiokId: sor.fiok_id,
      nev: sor.nev,
      regiSzerep: sor.szerep,
      ujSzerep: uj,
    });
  };

  const eltavolitasKezdemenyez = (sor: TagSor) => {
    setMegerosit({
      tipus: "eltavolitas",
      fiokId: sor.fiok_id,
      nev: sor.nev,
    });
  };

  const megerositMegse = () => {
    setMegerosit(null);
    setSzerkesztettSor(null);
    setSzerkesztettSzerep(null);
  };

  const megerositVegrehajt = async () => {
    if (!megerosit) return;
    setMegerositFut(true);
    if (megerosit.tipus === "szerep") {
      const { statusz, torzs } = await hivas(`/api/tagok/${megerosit.fiokId}`, "PUT", { szerep: megerosit.ujSzerep });
      if (statusz === 200) {
        setMegerosit(null);
        setSzerkesztettSor(null);
        setSzerkesztettSzerep(null);
        router.refresh();
      } else {
        const kod = hibaKod(torzs);
        alert(t(kod ? `hozzaferes.hiba_${kod.toLowerCase()}` : "hiba.ALTALANOS"));
      }
    } else {
      const { statusz, torzs } = await hivas(`/api/tagok/${megerosit.fiokId}`, "DELETE");
      if (statusz === 200) {
        setMegerosit(null);
        router.refresh();
      } else {
        const kod = hibaKod(torzs);
        alert(t(kod ? `hozzaferes.hiba_${kod.toLowerCase()}` : "hiba.ALTALANOS"));
      }
    }
    setMegerositFut(false);
  };

  const visszavonas = async (m: MeghivoSor) => {
    if (m.allapot !== "kiadott") return;
    setVisszavonasFut((prev) => new Set(prev).add(m.id));
    setVisszavonasHiba((prev) => { const p = { ...prev }; delete p[m.id]; return p; });
    const { statusz, torzs } = await hivas(`/api/tagok/meghivo/${m.id}`, "DELETE");
    setVisszavonasFut((prev) => { const p = new Set(prev); p.delete(m.id); return p; });
    if (statusz === 200) {
      router.refresh();
    } else {
      const kod = hibaKod(torzs);
      setVisszavonasHiba((prev) => ({
        ...prev,
        [m.id]: kod ? `hozzaferes.hiba_${kod.toLowerCase()}` : "hiba.ALTALANOS",
      }));
    }
  };

  const masolas = async (szoveg: string) => {
    try {
      await navigator.clipboard.writeText(szoveg);
    } catch {
      // csendes hiba
    }
  };

  const elsoHasznalat = nezet.tagok.length === 1 && nezet.meghivok.length === 0;

  const osszefoglalo = t("tagok.osszefoglalo", {
    n: String(nezet.tagok.length),
    m: String(nezet.meghivok.filter((m) => m.allapot === "kiadott").length),
  });

  const szerepJelvenyKulcs = (sz: Szerep) => {
    if (sz === "tulajdonos") return "nav.szerep_tulajdonos";
    if (sz === "szerkeszto") return "nav.szerep_szerkeszto";
    return "nav.szerep_nezo";
  };

  const szerepLeirasKulcs = (sz: Szerep) => {
    if (sz === "tulajdonos") return "tagok.szerep_tulajdonos_leiras";
    if (sz === "szerkeszto") return "tagok.szerep_szerkeszto_leiras";
    return "tagok.szerep_nezo_leiras";
  };

  const szerepSzinOsztaly = (sz: Szerep) => {
    if (sz === "tulajdonos") return "km-tg-szerep-tulaj";
    if (sz === "szerkeszto") return "km-tg-szerep-szerk";
    return "km-tg-szerep-nezo";
  };

  return (
    <div className="km-tg-tartalom">
      {elsoHasznalat ? (
        // R-13 13b4 (design/R13/rajz/R13-lapok.dc.html): egyedül a munkatérben — nincs kinek osztani, ezért nincs kredit a lapon.
        // Egy kártya: mit nyer vele, egy gomb, és hogy csak az lép be, akinek ő odaadja a linket. A gomb az R-2 meghívó párbeszédét nyitja.
        <div className="r15-lapok2 r13b4">
          <KerdesCim cim={t("r13.tagok.egyedul_cim")} />
          <section className="r15-teendo r13b4-kartya" data-r15="teendo">
            <p className="r13b4-szoveg">{t("r13.tagok.egyedul_alcim")}</p>
            {meghivoJog ? <span className="r15-csak-asztal"><FoGomb onClick={() => setMeghivoNyitva(true)}>{t("r13.tagok.meghivok")}</FoGomb></span> : null}
            <Info>{t("r13.tagok.visszavonhatod")}</Info>
          </section>
          {meghivoJog ? (
            <div className="r15-also-sav">
              <FoGomb onClick={() => setMeghivoNyitva(true)}>{t("r13.tagok.meghivok")}</FoGomb>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="km-tg-fejlec">
            <div className="km-tg-cim-sor">
              <h1 className="km-tg-h1">{t("tagok.cim")}</h1>
              <span className="km-tg-osszeg">{osszefoglalo}</span>
            </div>
            {meghivoJog && (
              <button
                type="button"
                className="km-tg-gomb-kiemelt"
                onClick={() => setMeghivoNyitva(true)}
              >
                {t("tagok.meghivo_gomb")}
              </button>
            )}
          </div>
          <p className="km-tg-bevezeto">{t("tagok.kov")}</p>

          <div className="km-tg-lista-tablazat">
            <div className="km-tg-lista-fej">
              <div>{t("tagok.fej_ki")}</div>
              <div>{t("tagok.fej_szerep")}</div>
              <div>{t("tagok.fej_csatlakozott")}</div>
              <div />
            </div>
            {nezet.tagok.map((sor) => (
              <div
                key={sor.fiok_id}
                className={`km-tg-sor ${szerkesztettSor === sor.fiok_id ? "km-tg-sor-aktiv" : ""}`}
              >
                <div className="km-tg-sor-ki">
                  <span className="km-tg-sor-nev">{sor.nev}</span>
                  <span className="km-tg-sor-email">{sor.email}</span>
                </div>
                <div>
                  {szerkesztettSor === sor.fiok_id && tulajdonos && !sor.en ? (
                    <div className="km-tg-szerep-sor">
                      <select
                        className="km-tg-szerep-valaszto"
                        value={szerkesztettSzerep ?? sor.szerep}
                        onChange={(e) => szerepValtozas(sor, e.target.value as Szerep)}
                        aria-label={t("tagok.szerep")}
                      >
                        {SZEREP_SORREND.map((sz) => (
                          <option key={sz} value={sz}>{t(szerepJelvenyKulcs(sz))}</option>
                        ))}
                      </select>
                      {szerkesztettSzerep && szerkesztettSzerep !== sor.szerep && (
                        <span className="km-tg-szerep-valtozik">
                          {t("tagok.szerep_valtozik", {
                            regi: t(szerepJelvenyKulcs(sor.szerep)),
                            uj: t(szerepJelvenyKulcs(szerkesztettSzerep)),
                          })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="km-tg-szerep-megjelenites">
                      <span className={`km-tg-jelveny ${szerepSzinOsztaly(sor.szerep)}`}>
                        {t(szerepJelvenyKulcs(sor.szerep))}
                      </span>
                      <span className="km-tg-szerep-leiras">{t(szerepLeirasKulcs(sor.szerep))}</span>
                    </div>
                  )}
                </div>
                <div className="km-tg-sor-datum">{datumFormat(sor.csatlakozott)}</div>
                <div className="km-tg-sor-muveletek">
                  {sor.en ? (
                    <span className="km-tg-jelveny km-tg-jelveny-te">{t("tagok.te_vagy")}</span>
                  ) : tulajdonos ? (
                    <>
                      <button
                        type="button"
                        className="km-tg-gomb-szoveg"
                        onClick={() => {
                          setSzerkesztettSor(sor.fiok_id);
                          setSzerkesztettSzerep(sor.szerep);
                          setMegerosit({
                            tipus: "szerep",
                            fiokId: sor.fiok_id,
                            nev: sor.nev,
                            regiSzerep: sor.szerep,
                            ujSzerep: sor.szerep,
                          });
                        }}
                      >
                        {t("tagok.szerep")}
                      </button>
                      <button
                        type="button"
                        className="km-tg-gomb-szoveg km-tg-gomb-eltavolitas"
                        onClick={() => eltavolitasKezdemenyez(sor)}
                      >
                        {t("tagok.eltavolitas")}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {kredit ? (
            // R-13 13b0: a halk „Kreditek ›” sor (csak a tulajdonos) — a kreditosztás saját nézete (/tagok/kreditek)
            <a className="r13b-link-sor" href="/tagok/kreditek">
              <span>{t("r13.kreditek.link")}{kredit.egyenlo ? <> · {t("r13.kreditek.link_info")}</> : null}</span>
              <span aria-hidden="true">›</span>
            </a>
          ) : null}

          {nezet.meghivok.some((m) => m.allapot !== "elfogadott") && (
            <div className="km-tg-meghivok-blokk">
              <div className="km-tg-meghivok-fej">
                <span className="km-tg-meghivok-cim">{t("meghivo.fuggo_cim")}</span>
                <span className="km-tg-jelveny km-tg-jelveny-info">{t("meghivo.nincs_email")}</span>
              </div>
              {nezet.meghivok.filter((m) => m.allapot !== "elfogadott").map((m) => {
                const halvany = m.allapot === "visszavont" || m.allapot === "lejart";
                return (
                  <div
                    key={m.id}
                    className={`km-tg-meghivo-sor ${halvany ? "km-tg-meghivo-halvany" : ""}`}
                  >
                    <div className="km-tg-meghivo-cimzett">
                      <span className="km-tg-sor-nev">
                        {t("tagok.meghivo_sor", {
                          szerep: t(szerepJelvenyKulcs(m.szerep)),
                          datum: datumFormat(m.lejar),
                        })}
                      </span>
                    </div>
                    <div>
                      <span className={`km-tg-jelveny ${szerepSzinOsztaly(m.szerep)}`}>
                        {t(szerepJelvenyKulcs(m.szerep))}
                      </span>
                    </div>
                    <div className="km-tg-meghivo-allapot">
                      <span className="km-tg-sor-nev">{t(`meghivo.allapot_${m.allapot}`)}</span>
                    </div>
                    <div>
                      {m.allapot === "kiadott" ? (
                        <button
                          type="button"
                          className="km-tg-gomb-szoveg"
                          onClick={() => visszavonas(m)}
                          disabled={visszavonasFut.has(m.id)}
                        >
                          {t("tagok.visszavonas")}
                        </button>
                      ) : (
                        <span className="km-tg-gomb-szoveg km-tg-gomb-tiltott">
                          {t("tagok.visszavonas")}
                        </span>
                      )}
                    </div>
                    {visszavonasHiba[m.id] && (
                      <div className="km-tg-meghivo-hiba">{t(visszavonasHiba[m.id] ?? "")}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {nezet.esemenyek.length > 0 && (
            <div className="km-tg-esemenyek">
              <span className="km-tg-esemenyek-cim">{t("tagok.esemenyek_cim")}</span>
              {nezet.esemenyek.map((e) => (
                <div key={e.id} className="km-tg-esemeny-sor">
                  <span className="km-tg-esemeny-ido">{rovidDatum(e.ido)}</span>
                  <span className="km-tg-esemeny-szoveg">
                    {t(`esemeny.${e.fajta}_cim`, e.adat as Record<string, string | number>)}
                    {e.fiok_nev ? ` · ${e.fiok_nev}` : ""}
                  </span>
                </div>
              ))}
              <Link href="/gephaz" className="km-tg-esemeny-link">
                {t("tagok.esemenyek_link")}
              </Link>
            </div>
          )}
        </>
      )}

      {megerosit && (
        <div className="km-tg-megerosit-sav">
          <div className="km-tg-megerosit-tartalom">
            <div className="km-tg-megerosit-szoveg">
              <span className="km-tg-megerosit-cim">
                {megerosit.tipus === "szerep"
                  ? t("tagok.megerosit_cim", { nev: megerosit.nev, szerep: t(szerepJelvenyKulcs(megerosit.ujSzerep)) })
                  : t("tagok.eltavolit_cim", { nev: megerosit.nev })}
              </span>
              <span className="km-tg-megerosit-leiras">
                {megerosit.tipus === "szerep"
                  ? t("tagok.megerosit_szoveg")
                  : t("tagok.eltavolit_szoveg")}
              </span>
            </div>
            <div className="km-tg-megerosit-gombok">
              <button
                type="button"
                className="km-tg-gomb-masodlagos"
                onClick={megerositMegse}
                disabled={megerositFut}
              >
                {t("kozos.megse")}
              </button>
              <button
                type="button"
                className={megerosit.tipus === "eltavolitas" ? "km-tg-gomb-veszely" : "km-tg-gomb-kiemelt"}
                onClick={megerositVegrehajt}
                disabled={megerositFut}
              >
                {megerosit.tipus === "szerep" ? t("tagok.megerosit_gomb") : t("tagok.eltavolit_gomb")}
              </button>
            </div>
          </div>
        </div>
      )}

      {meghivoNyitva && (
        <div className="km-tg-parbeszed-hatter" onClick={(e) => { if (e.target === e.currentTarget) meghivoBezar(); }}>
          <div className="km-tg-parbeszed">
            {!meghivoEredmeny ? (
              <>
                <h2 className="km-tg-parbeszed-cim">{t("tagok.parbeszed_cim")}</h2>
                <div className="km-tg-szerep-valaszto">
                  <span className="km-tg-mezo-cimke">{t("tagok.szerep")}</span>
                  {SZEREP_SORREND.map((sz) => {
                    const tiltott = !tulajdonos && sz === "tulajdonos";
                    return (
                      <label
                        key={sz}
                        className={`km-tg-szerep-kartya ${valasztottSzerep === sz ? "km-tg-szerep-kartya-aktiv" : ""} ${tiltott ? "km-tg-szerep-kartya-tiltott" : ""}`}
                      >
                        <input
                          type="radio"
                          name="szerep"
                          value={sz}
                          checked={valasztottSzerep === sz}
                          onChange={() => !tiltott && setValasztottSzerep(sz)}
                          disabled={tiltott}
                        />
                        <span className="km-tg-szerep-kartya-tartalom">
                          <span className="km-tg-szerep-kartya-nev">{t(szerepJelvenyKulcs(sz))}</span>
                          <span className="km-tg-szerep-kartya-leiras">
                            {t(szerepLeirasKulcs(sz))}
                          </span>
                          {tiltott && (
                            <span className="km-tg-szerep-kartya-hiba">{t("hozzaferes.hiba_nagyobb_szerep")}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="km-tg-email-mezo">
                  <label className="km-tg-mezo-cimke" htmlFor="km-tg-megjegyzes">
                    {t("tagok.megjegyzes")}{" "}
                    <span className="km-tg-mezo-opcionalis">{t("meghivo.email_opcionalis")}</span>
                  </label>
                  <input
                    id="km-tg-megjegyzes"
                    ref={parbeszedElsoMezo}
                    type="text"
                    className="km-tg-bevitel"
                    value={megjegyzes}
                    onChange={(e) => setMegjegyzes(e.target.value)}
                  />
                  <span className="km-tg-mezo-megjegyzes">{t("tagok.meghivo_sugo")}</span>
                </div>
                <div className="km-tg-elettartam">
                  {t("meghivo.elettartam")}
                </div>
                <div className="km-tg-parbeszed-gombok">
                  <button
                    type="button"
                    className="km-tg-gomb-kiemelt"
                    onClick={meghivoKuldes}
                    disabled={meghivoFut}
                  >
                    {t("tagok.meghivo_gomb")}
                  </button>
                  <button
                    type="button"
                    className="km-tg-gomb-masodlagos"
                    onClick={meghivoBezar}
                    disabled={meghivoFut}
                  >
                    {t("kozos.megse")}
                  </button>
                </div>
                {meghivoHiba && (
                  <div className="km-tg-parbeszed-hiba">{t(meghivoHiba)}</div>
                )}
              </>
            ) : (
              <>
                <div className="km-tg-kesz-fej">
                  <span className="km-tg-kesz-pont" aria-hidden="true" />
                  <h2 className="km-tg-parbeszed-cim">{t("meghivo.kesz_cim")}</h2>
                </div>
                <div className="km-tg-link-mezo">
                  <span className="km-tg-mezo-cimke">{t("meghivo.link_cimke")}</span>
                  <div className="km-tg-link-sor">
                    <span className="km-tg-link-szoveg" dir="ltr">{meghivoEredmeny.link}</span>
                    <button
                      type="button"
                      className="km-tg-gomb-masodlagos"
                      onClick={() => masolas(meghivoEredmeny.link)}
                    >
                      {t("meghivo.masolas_gomb")}
                    </button>
                  </div>
                </div>
                <div className="km-tg-figyelmeztetes">
                  <span className="km-tg-figyelmeztetes-cim">{t("meghivo.egyszer_cim")}</span>
                  <span className="km-tg-figyelmeztetes-szoveg">{t("meghivo.egyszer_szoveg")}</span>
                </div>
                <div className="km-tg-kesz-adatok">
                  <div className="km-tg-kesz-adat-sor">
                    <span className="km-tg-kesz-adat-cimke">{t("meghivo.szerep_cimke_rovid")}</span>
                    <span>{t(szerepJelvenyKulcs(meghivoEredmeny.szerep))}</span>
                  </div>
                  <div className="km-tg-kesz-adat-sor">
                    <span className="km-tg-kesz-adat-cimke">{t("meghivo.meddig_cimke")}</span>
                    <span>{datumFormat(meghivoEredmeny.lejar)}</span>
                  </div>
                  <div className="km-tg-kesz-adat-sor">
                    <span className="km-tg-kesz-adat-cimke">{t("meghivo.cimzett_cimke")}</span>
                    <span className="km-tg-kesz-adat-kod" dir="ltr">{meghivoEredmeny.email ?? "—"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="km-tg-gomb-kiemelt"
                  onClick={meghivoBezar}
                >
                  {t("meghivo.kesz_gomb")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
