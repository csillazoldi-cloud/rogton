"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TARTALOMNYELVEK, type OnboardingPiszkozat, type Tartalomnyelv, type MezoForras } from "@rogton/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { Jelveny, OnboardingKeret, hivas, nyelvNev, usePiszkozat } from "../_kozos/keret";
import { arculatotKer } from "../_kozos/arculat";
import { JavaslatokValasz } from "@rogton/contracts";
import { javaslatokBeolvaszt } from "@rogton/onboarding-core";
import { arculatTervezetBefogad } from "@rogton/profile-core";

type Kommunikacio = OnboardingPiszkozat["kommunikacio"];
type Fuggo = { leiras: string; minta: string; irany: string } | null;

// A 2. lépés (R-7a 05): négy kérdés egyszerű sorokban, egy állapotsáv felül (készül · kész · hiba),
// mezőnkénti kis „később” gomb. A mezők minden állapotban szerkeszthetők; a javaslat csak üres mezőt tölt.
export function Lepes2({ szervezetNev, kezdo, kezdoFrissitve }: { szervezetNev: string; kezdo: OnboardingPiszkozat; kezdoFrissitve: string | null }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const { piszkozat, setPiszkozat, allapot, mentMost, mentveEkkor } = usePiszkozat(kezdo, kezdoFrissitve);
  const k = piszkozat.kommunikacio;
  const [javaslatHiba, setJavaslatHiba] = useState(false);
  const [javaslatFut, setJavaslatFut] = useState(false);
  const [javaslatKesz, setJavaslatKesz] = useState(false);
  const [frissJavaslat, setFrissJavaslat] = useState(false);
  const [nyelvKereso, setNyelvKereso] = useState("");
  const [hangnemMegj, setHangnemMegj] = useState("");
  const [fuggoHangnem, setFuggoHangnem] = useState<Fuggo>(null);
  const [finomitasFut, setFinomitasFut] = useState(false);
  const [sajatCelNyitva, setSajatCelNyitva] = useState(false);
  const javaslatKerve = useRef(false);

  function modosit(resz: Partial<Kommunikacio>) {
    setPiszkozat((p) => ({ ...p, kommunikacio: { ...p.kommunikacio, ...resz } }));
  }
  function szerkeszt(mezo: "celkozonseg" | "cel" | "hangnem_leiras", ertek: string) {
    const forrasKulcs = (mezo === "hangnem_leiras" ? "hangnem_forras" : `${mezo}_forras`) as keyof Kommunikacio;
    const modKulcs = (mezo === "hangnem_leiras" ? "hangnem_modositva" : `${mezo}_modositva`) as keyof Kommunikacio;
    const jelenlegi = k[forrasKulcs] as MezoForras;
    const uj = jelenlegi === "" || jelenlegi === "sajat" ? { [forrasKulcs]: "sajat", [modKulcs]: false } : { [modKulcs]: true };
    modosit({ [mezo]: ertek, ...uj } as Partial<Kommunikacio>);
  }

  async function javaslatokatKer() {
    setJavaslatFut(true); setJavaslatHiba(false); setJavaslatKesz(false);
    const r = await hivas("/api/onboarding/javaslatok", "POST");
    setJavaslatFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz !== 200) { setJavaslatHiba(true); modosit({ javaslatok_kerve: true }); return; }
    const v = JavaslatokValasz.safeParse(r.torzs);
    if (!v.success) { setJavaslatHiba(true); modosit({ javaslatok_kerve: true }); return; }
    setPiszkozat((p) => ({ ...p, kommunikacio: javaslatokBeolvaszt(p.kommunikacio, v.data) }));
    setJavaslatKesz(true);
    setFrissJavaslat(true);
    setTimeout(() => setFrissJavaslat(false), 1800);
    if (kezdo.arculat.allapot === "nincs" && !kezdo.arculat.tervezet) {
      const tervezet = await arculatotKer();
      if (tervezet) setPiszkozat((p) => ({ ...p, arculat: arculatTervezetBefogad(p.arculat, tervezet) }));
    }
  }
  useEffect(() => {
    if (javaslatKerve.current || kezdo.kommunikacio.javaslatok_kerve) return;
    javaslatKerve.current = true;
    void javaslatokatKer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = nyelvKereso.trim().toLowerCase();
  const osszes = TARTALOMNYELVEK.map((kod) => ({ kod, nev: nyelvNev(kod, nyelv) }));
  const lista = osszes.filter((o) => !q || o.nev.toLowerCase().includes(q) || o.kod.includes(q)).slice(0, q ? 20 : 8);
  const javasolt = k.nyelvek_javasolt.filter((kod) => !k.nyelvek.includes(kod));
  function nyelvValt(kod: Tartalomnyelv) {
    const van = k.nyelvek.includes(kod);
    modosit({ nyelvek: van ? k.nyelvek.filter((x) => x !== kod) : [...k.nyelvek, kod], nyelvek_javasolt: [], nyelvek_forras: "sajat" });
  }
  function javasoltHozzaad(kod: Tartalomnyelv) {
    modosit({ nyelvek: [...k.nyelvek, kod], nyelvek_javasolt: k.nyelvek_javasolt.filter((x) => x !== kod), nyelvek_forras: "weboldal" });
  }
  function nyelvTorol(kod: Tartalomnyelv) {
    modosit({ nyelvek: k.nyelvek.filter((x) => x !== kod), nyelvek_forras: k.nyelvek_forras === "" || k.nyelvek_forras === "sajat" ? "sajat" : k.nyelvek_forras });
  }

  async function finomit(irany: "kozvetlenebb" | "targyilagosabb" | "egyedi") {
    if (finomitasFut) return;
    if (irany === "egyedi" && !hangnemMegj.trim()) return;
    setFinomitasFut(true);
    const r = await hivas("/api/onboarding/hangnem", "POST", {
      irany, ...(irany === "egyedi" ? { megjegyzes: hangnemMegj.trim() } : {}),
      hangnem_leiras: k.hangnem_leiras, hangnem_minta: k.hangnem_minta, tartalomnyelv: (k.hangnem_nyelv || k.nyelvek[0] || "hu") as Tartalomnyelv,
    });
    setFinomitasFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz !== 200) { setJavaslatHiba(true); return; }
    const leiras = typeof r.torzs["hangnem_leiras"] === "string" ? r.torzs["hangnem_leiras"] : "";
    const minta = typeof r.torzs["hangnem_minta"] === "string" ? r.torzs["hangnem_minta"] : "";
    if (leiras || minta) { setFuggoHangnem({ leiras, minta, irany: irany === "egyedi" ? hangnemMegj.trim() : t(`onboarding2.${irany}`) }); setHangnemMegj(""); }
  }
  function hangnemElfogad() {
    if (!fuggoHangnem) return;
    modosit({ hangnem_leiras: fuggoHangnem.leiras, hangnem_minta: fuggoHangnem.minta, hangnem_forras: "ai", hangnem_modositva: false });
    setFuggoHangnem(null);
  }

  async function tovabb() {
    if (!(await mentMost())) return;
    router.push("/onboarding/3");
  }
  function vissza() { void mentMost().then(() => router.push("/onboarding/1")); }

  const hangnemNyelv = k.hangnem_nyelv || k.nyelvek[0] || nyelv;

  // cél példa-chipek
  const celTajekoztat = t("onboarding2.cel_tajekoztat");
  const celErdeklodo = t("onboarding2.cel_erdeklodo");
  const celPeldak = [celTajekoztat, celErdeklodo];
  const celSajat = !celPeldak.includes(k.cel) && k.cel.trim() !== "";
  const celTextareaNyitva = sajatCelNyitva || celSajat;
  function celPeldaValt(ertek: string) {
    if (k.cel === ertek) { szerkeszt("cel", ""); return; }
    szerkeszt("cel", ertek);
    setSajatCelNyitva(false);
  }

  // stílus példa-chipek
  const stilusKozvetlen = t("onboarding2.stilus_kozvetlen");
  const stilusTargyilagos = t("onboarding2.stilus_targyilagos");
  const stilusPeldak = [stilusKozvetlen, stilusTargyilagos];
  const stilusSajat = !stilusPeldak.includes(k.hangnem_leiras) && k.hangnem_leiras.trim() !== "";
  const [sajatStilusNyitva, setSajatStilusNyitva] = useState(false);
  const stilusTextareaNyitva = sajatStilusNyitva || stilusSajat;
  function stilusPeldaValt(ertek: string) {
    if (k.hangnem_leiras === ertek) { szerkeszt("hangnem_leiras", ""); return; }
    szerkeszt("hangnem_leiras", ertek);
    setSajatStilusNyitva(false);
  }

  const allapotKod = javaslatFut ? "keszul" : javaslatHiba ? "hiba" : javaslatKesz ? "kesz" : "keszul";

  return (
    <OnboardingKeret szervezetNev={szervezetNev} lepes={2} allapot={allapot} mentMost={mentMost} mentveEkkor={mentveEkkor} piszkozat={piszkozat} friss={frissJavaslat}>
      <div className="km-fej">
        <h1 className="km-ob-h1">{t("onboarding2.cim")}</h1>
        <p className="km-alcim">{t("onboarding2.halasztas")}</p>
      </div>

      <div className="km-ob-allapot" data-allapot={allapotKod} role="status" aria-live="polite">
        {javaslatFut ? (
          <>
            <span className="km-ob-porko" aria-hidden="true" />
            <span>{t("onboarding2.javaslat_keszul")}</span>
          </>
        ) : javaslatHiba ? (
          <>
            <span>{t("onboarding2.javaslat_hiba")}</span>
            <button type="button" className="km-gomb-hiba" onClick={javaslatokatKer}>{t("kozos.ujraprobalas")}</button>
          </>
        ) : (
          <span>{t("onboarding2.javaslat_kesz")}</span>
        )}
      </div>

      {/* 1. Kiknek */}
      <div className="km-ob-sor" data-kesobb={k.celkozonseg_kesobb ? "true" : "false"}>
        <div className="km-ob-sor-fej">
          <label className="km-ob-sor-cim" htmlFor="ob2-kiknek">{t("onboarding2.kiknek")}</label>
          <Jelveny forras={k.celkozonseg_forras} modositva={k.celkozonseg_modositva} ures={k.celkozonseg_kesobb || !k.celkozonseg} />
          <button type="button" className="km-ob-kesobb" onClick={() => modosit({ celkozonseg_kesobb: !k.celkozonseg_kesobb })}>{k.celkozonseg_kesobb ? t("onboarding2.megis") : t("onboarding.kesobbre")}</button>
        </div>
        {k.celkozonseg_kesobb ? <div className="km-ob-kesobbre">{t("onboarding2.kesobbre_hagyva")}</div> : (
          <textarea id="ob2-kiknek" className="km-ob-terulet" rows={2} aria-label={t("onboarding2.kiknek")} placeholder={t("onboarding2.celkozonseg_pl")} value={k.celkozonseg} onChange={(e) => szerkeszt("celkozonseg", e.target.value)} />
        )}
      </div>

      {/* 2. Cél */}
      <div className="km-ob-sor" data-kesobb={k.cel_kesobb ? "true" : "false"}>
        <div className="km-ob-sor-fej">
          <span className="km-ob-sor-cim">{t("onboarding2.cel")}</span>
          <Jelveny forras={k.cel_forras} modositva={k.cel_modositva} ures={k.cel_kesobb || !k.cel} />
          <button type="button" className="km-ob-kesobb" onClick={() => modosit({ cel_kesobb: !k.cel_kesobb })}>{k.cel_kesobb ? t("onboarding2.megis") : t("onboarding.kesobbre")}</button>
        </div>
        {k.cel_kesobb ? <div className="km-ob-kesobbre">{t("onboarding2.kesobbre_hagyva")}</div> : (
          <>
            <div className="km-ob-chipek">
              <button type="button" className="km-ob-chip" aria-pressed={k.cel === celTajekoztat} onClick={() => celPeldaValt(celTajekoztat)}>{celTajekoztat}</button>
              <button type="button" className="km-ob-chip" aria-pressed={k.cel === celErdeklodo} onClick={() => celPeldaValt(celErdeklodo)}>{celErdeklodo}</button>
              <button type="button" className="km-ob-chip" aria-pressed={celTextareaNyitva} onClick={() => setSajatCelNyitva((v) => !v)}>{t("onboarding2.sajat")}</button>
            </div>
            {celTextareaNyitva ? (
              <textarea className="km-ob-terulet" rows={2} aria-label={t("onboarding2.cel")} placeholder={t("onboarding2.cel_pl")} value={k.cel} onChange={(e) => szerkeszt("cel", e.target.value)} />
            ) : null}
          </>
        )}
      </div>

      {/* 3. Nyelvek */}
      <div className="km-ob-sor">
        <div className="km-ob-sor-fej">
          <span className="km-ob-sor-cim">{t("onboarding2.nyelvek")}</span>
          <Jelveny forras={k.nyelvek_forras} ures={k.nyelvek.length === 0} />
        </div>
        <div className="km-ob-chipek">
          {(["hu", "ro", "en"] as Tartalomnyelv[]).map((kod) => (
            <button key={kod} type="button" className="km-ob-chip" aria-pressed={k.nyelvek.includes(kod)} onClick={() => nyelvValt(kod)}>{t(`kozos.${kod === "hu" ? "magyar" : kod === "ro" ? "roman" : "angol"}`)}</button>
          ))}
          <details className="km-ob-tovabbi">
            <summary className="km-ob-chip">{t("onboarding2.tovabbi_nyelvek")}</summary>
            {javasolt.length > 0 ? (
              <div className="km-ob-javasolt">
                <span>{t("onboarding2.javasoljuk")}</span>
                {javasolt.map((kod) => <button key={kod} type="button" className="km-ob-javasolt-gomb" onClick={() => javasoltHozzaad(kod)}>+ {nyelvNev(kod, nyelv)}</button>)}
              </div>
            ) : null}
            <div className="km-ob-nyelvek">
              {k.nyelvek.map((kod) => <button key={kod} type="button" className="km-ob-nyelv-chip" onClick={() => nyelvTorol(kod)}>{nyelvNev(kod, nyelv)} <span>×</span></button>)}
              {k.nyelvek.length === 0 ? <span className="km-ob-nincs-nyelv">{t("onboarding2.nincs_nyelv")}</span> : null}
            </div>
            <input className="km-ob-nyelv-kereso" value={nyelvKereso} onChange={(e) => setNyelvKereso(e.target.value)} placeholder={t("onboarding2.nyelv_kereses")} aria-label={t("onboarding2.nyelv_kereses")} />
            <div className="km-ob-nyelv-lista">
              {lista.map((o) => <button key={o.kod} type="button" className="km-ob-nyelv-opcio" aria-pressed={k.nyelvek.includes(o.kod)} onClick={() => nyelvValt(o.kod)}>{o.nev}</button>)}
            </div>
          </details>
        </div>
      </div>

      {/* 4. Stílus */}
      <div className="km-ob-sor" data-kesobb={k.hangnem_kesobb ? "true" : "false"}>
        <div className="km-ob-sor-fej">
          <span className="km-ob-sor-cim">{t("onboarding2.stilus")}</span>
          <Jelveny forras={k.hangnem_forras} modositva={k.hangnem_modositva} ures={k.hangnem_kesobb || !k.hangnem_leiras} />
          <button type="button" className="km-ob-kesobb" onClick={() => modosit({ hangnem_kesobb: !k.hangnem_kesobb })}>{k.hangnem_kesobb ? t("onboarding2.megis") : t("onboarding.kesobbre")}</button>
        </div>
        {k.hangnem_kesobb ? <div className="km-ob-kesobbre">{t("onboarding2.kesobbre_hagyva")}</div> : (
          <>
            <div className="km-ob-chipek">
              <button type="button" className="km-ob-chip" aria-pressed={k.hangnem_leiras === stilusKozvetlen} onClick={() => stilusPeldaValt(stilusKozvetlen)}>{stilusKozvetlen}</button>
              <button type="button" className="km-ob-chip" aria-pressed={k.hangnem_leiras === stilusTargyilagos} onClick={() => stilusPeldaValt(stilusTargyilagos)}>{stilusTargyilagos}</button>
              <button type="button" className="km-ob-chip" aria-pressed={stilusTextareaNyitva} onClick={() => setSajatStilusNyitva((v) => !v)}>{t("onboarding2.sajat")}</button>
            </div>
            {stilusTextareaNyitva ? (
              <input className="km-ob-hangnem" value={k.hangnem_leiras} aria-label={t("onboarding2.stilus")} placeholder={t("onboarding2.hangnem_pl")} onChange={(e) => szerkeszt("hangnem_leiras", e.target.value)} />
            ) : null}
            {k.hangnem_minta ? (
              <div className="km-ob-minta">
                <div className="km-ob-minta-cim">{t("onboarding2.minta_cimke")} · {t("onboarding2.tartalomnyelv_cimke", { l: nyelvNev(hangnemNyelv, nyelv) })}</div>
                <div className="km-ob-minta-szoveg">{k.hangnem_minta}</div>
              </div>
            ) : null}
            {k.hangnem_minta && !fuggoHangnem ? (
              <>
                <div className="km-ob-finomitas">
                  <span>{t("onboarding2.finomitas")}</span>
                  <button type="button" className="km-ob-finom-gomb" disabled={finomitasFut} onClick={() => finomit("kozvetlenebb")}>{t("onboarding2.kozvetlenebb")}</button>
                  <button type="button" className="km-ob-finom-gomb" disabled={finomitasFut} onClick={() => finomit("targyilagosabb")}>{t("onboarding2.targyilagosabb")}</button>
                </div>
                <div className="km-ob-finom-sor">
                  <input value={hangnemMegj} onChange={(e) => setHangnemMegj(e.target.value)} placeholder={t("onboarding2.megjegyzes_pl")} aria-label={t("onboarding2.megjegyzes_pl")} />
                  <button type="button" className="km-gomb-kis-elso" disabled={!hangnemMegj.trim() || finomitasFut} onClick={() => finomit("egyedi")}>{t("onboarding2.alkalmaz")}</button>
                </div>
              </>
            ) : null}
            {fuggoHangnem ? (
              <div className="km-ob-fuggo">
                <div className="km-ob-fuggo-fej"><span className="km-ob-fuggo-cim">{t("onboarding2.uj_javaslat")}</span><span className="km-ob-fuggo-megj">{fuggoHangnem.leiras}</span></div>
                <div className="km-ob-fuggo-szoveg km-ob-dolt">{fuggoHangnem.minta}</div>
                <div className="km-ob-fuggo-gombok">
                  <button type="button" className="km-gomb-kis-elso" onClick={hangnemElfogad}>{t("onboarding1.elfogadom_ujat")}</button>
                  <button type="button" className="km-gomb-kis" onClick={() => setFuggoHangnem(null)}>{t("onboarding1.megtartom")}</button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="km-ob-gombsor">
        <button className="km-gomb-szellem" type="button" onClick={vissza}>{t("onboarding.nyil_vissza")} {t("onboarding.vissza")}</button>
        <button className="km-gomb" type="button" onClick={tovabb}>{t("onboarding.mentes_es_tovabb")} {t("onboarding.nyil")}</button>
      </div>
    </OnboardingKeret>
  );
}
