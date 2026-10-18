"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TARTALOMNYELVEK, type MezoForras, type OnboardingPiszkozat, type Tartalomnyelv } from "@rogton/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { OnboardingKeret, hivas, nyelvNev, usePiszkozat } from "../_kozos/keret";
import { arculatKesobbre } from "@rogton/profile-core";
import { jovahagyhato as jovahagyhatoE, piszkozatMezoSzerkeszt } from "@rogton/onboarding-core";

type Mezo = "nev" | "tevekenyseg" | "celkozonseg" | "cel" | "nyelvek" | "hangnem";
const BEMUTATKOZAS_MEZOK: Mezo[] = ["nev", "tevekenyseg"];
const KOMMUNIKACIO_MEZOK: Mezo[] = ["celkozonseg", "cel", "nyelvek", "hangnem"];
const MEZOK: Mezo[] = [...BEMUTATKOZAS_MEZOK, ...KOMMUNIKACIO_MEZOK];

// A 3. lépés (R-7a 06) — egy szerkeszthető összefoglaló két szakaszban, soronkénti semleges eredet-jelöléssel,
// ugyanazzal a nyelvválasztóval, mint a 2. lépésen. Az arculat nem ennek a lépésnek a dolga (R-7c 10).
export function Lepes3({ szervezetNev, kezdo, kezdoFrissitve, tulajdonos }: { szervezetNev: string; kezdo: OnboardingPiszkozat; kezdoFrissitve: string | null; tulajdonos: boolean }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const { piszkozat, setPiszkozat, allapot, mentMost, mentveEkkor } = usePiszkozat(kezdo, kezdoFrissitve);
  const b = piszkozat.bemutatkozas, k = piszkozat.kommunikacio;
  const [szerkesztett, setSzerkesztett] = useState<Mezo | "">("");
  const [szerkErtek, setSzerkErtek] = useState("");
  const [reszlet, setReszlet] = useState<Mezo | "">("");
  const [jovahagyasFut, setJovahagyasFut] = useState(false);
  const [jovahagyasHiba, setJovahagyasHiba] = useState(false);

  // --- a sorok ---
  function ertek(m: Mezo): string {
    switch (m) {
      case "nev": return b.nev;
      case "tevekenyseg": return b.osszefoglalo;
      case "celkozonseg": return k.celkozonseg_kesobb ? "" : k.celkozonseg;
      case "cel": return k.cel_kesobb ? "" : k.cel;
      case "nyelvek": return k.nyelvek.map((kod) => nyelvNev(kod, nyelv)).join(", ");
      case "hangnem": return k.hangnem_kesobb ? "" : (k.hangnem_leiras && k.hangnem_minta ? `${k.hangnem_leiras} — „${k.hangnem_minta}”` : k.hangnem_leiras);
    }
  }
  function forras(m: Mezo): { forras: MezoForras; modositva: boolean } {
    switch (m) {
      case "nev": return { forras: b.nev ? "sajat" : "", modositva: false };
      case "tevekenyseg": return { forras: b.osszefoglalo_forras, modositva: b.osszefoglalo_modositva };
      case "celkozonseg": return { forras: k.celkozonseg_forras, modositva: k.celkozonseg_modositva };
      case "cel": return { forras: k.cel_forras, modositva: k.cel_modositva };
      case "nyelvek": return { forras: k.nyelvek_forras, modositva: false };
      case "hangnem": return { forras: k.hangnem_forras, modositva: k.hangnem_modositva };
    }
  }
  function kesobb(m: Mezo): boolean { return (m === "celkozonseg" && k.celkozonseg_kesobb) || (m === "cel" && k.cel_kesobb) || (m === "hangnem" && k.hangnem_kesobb); }
  function ures(m: Mezo): boolean { return m === "nyelvek" ? k.nyelvek.length === 0 : !ertek(m).trim(); }
  function eredetSzoveg(m: Mezo): string {
    const f = forras(m);
    if (ures(m)) return "";
    return f.forras === "sajat" || f.modositva ? t("jelzes.te_adtad") : t("jelzes.javaslat");
  }
  function reszletSzoveg(m: Mezo): string {
    const f = forras(m);
    if (!f.forras || ures(m)) return t("onboarding3.eredet_ures");
    const src = f.forras === "sajat" ? t("onboarding3.eredet_sajat") : f.forras === "weboldal" ? t("onboarding3.eredet_weboldal") + (b.weboldal ? ` (${b.weboldal})` : "") : t("onboarding3.eredet_ai");
    const ed = f.forras === "sajat" || f.modositva ? t("onboarding3.eredet_te") : t("onboarding3.eredet_az_ai");
    return t("onboarding3.eredet_sablon", { src, ed });
  }
  function szerkesztesKezd(m: Mezo) {
    setSzerkesztett(m);
    setSzerkErtek(m === "hangnem" ? (k.hangnem_kesobb ? "" : k.hangnem_leiras) : ertek(m));
    setReszlet("");
  }
  function szerkesztesMent() {
    setPiszkozat((p) => szerkesztett === "" ? p : piszkozatMezoSzerkeszt(p, szerkesztett, szerkErtek));
    setSzerkesztett(""); setSzerkErtek("");
  }
  function nyelvValt(kod: Tartalomnyelv) {
    const uj = k.nyelvek.includes(kod) ? k.nyelvek.filter((x) => x !== kod) : [...k.nyelvek, kod];
    setPiszkozat((p) => piszkozatMezoSzerkeszt(p, "nyelvek", uj));
  }

  // --- hiányzók, jóváhagyás ---
  const hianyzok = MEZOK.filter((m) => ures(m)).map((m) => t(`mezo.${m}`));
  const tiltva = !jovahagyhatoE(piszkozat);
  const jovahagyhato = !tiltva && !jovahagyasFut && tulajdonos;
  async function jovahagy() {
    if (!jovahagyhato) return;
    setJovahagyasFut(true); setJovahagyasHiba(false);
    if (piszkozat.arculat.allapot === "nincs") setPiszkozat((p) => ({ ...p, arculat: arculatKesobbre(p.arculat) }));
    if (!(await mentMost())) { setJovahagyasFut(false); setJovahagyasHiba(true); return; }
    const r = await hivas("/api/onboarding/jovahagyas", "POST");
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz !== 200) { setJovahagyasFut(false); setJovahagyasHiba(true); return; }
    router.push("/onboarding/kesz");
  }
  function vissza() { void mentMost().then(() => router.push("/onboarding/2")); }

  function sor(m: Mezo) {
    const u = ures(m);
    const src: MezoForras = u ? "" : forras(m).forras;
    return (
      <div key={m} className="km-ob-sor">
        <div className="km-ob-sor-fej">
          <div className="km-ob-sor-cimke">{t(`mezo.${m}`)}</div>
          {!u ? <span className="km-ob-eredet" data-src={src}>{eredetSzoveg(m)}</span> : null}
          <button type="button" className="km-ob-szerkeszt" aria-expanded={reszlet === m} onClick={() => setReszlet(reszlet === m ? "" : m)}>{t("onboarding3.reszlet")}</button>
          {szerkesztett !== m ? <button type="button" className="km-ob-szerkeszt" onClick={() => szerkesztesKezd(m)}>{t("onboarding3.szerkesztes")}</button> : null}
        </div>
        {reszlet === m ? <div className="km-ob-reszlet">{reszletSzoveg(m)}</div> : null}
        {szerkesztett !== m ? (
          <div className="km-ob-sor-ertek" data-ures={u ? "true" : "false"}>{u ? (kesobb(m) ? t("onboarding3.kesobb") : t("onboarding3.nincs_megadva")) : ertek(m)}</div>
        ) : (
          <>
            <textarea className="km-ob-sor-szerk" rows={3} aria-label={t(`mezo.${m}`)} value={szerkErtek} onChange={(e) => setSzerkErtek(e.target.value)} />
            <div className="km-ob-fuggo-gombok">
              <button type="button" className="km-gomb-kis-elso" onClick={szerkesztesMent}>{t("onboarding3.mentes")}</button>
              <button type="button" className="km-gomb-kis" onClick={() => { setSzerkesztett(""); setSzerkErtek(""); }}>{t("onboarding3.megse")}</button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <OnboardingKeret szervezetNev={szervezetNev} lepes={3} allapot={allapot} mentMost={mentMost} mentveEkkor={mentveEkkor} piszkozat={piszkozat} elonezet="nincs">
      <div className="km-fej">
        <h1 className="km-ob-h1">{t("onboarding3.cim")}</h1>
        <p className="km-alcim">{t("onboarding3.bevezeto")}</p>
      </div>

      <div className="km-ob-osszefoglalo">
        <div className="km-ob-szakasz-cim">{t("onboarding3.bemutatkozas")}</div>
        <div className="km-ob-sorok">{BEMUTATKOZAS_MEZOK.map(sor)}</div>

        <div className="km-ob-szakasz-cim">{t("onboarding.lepes_2")}</div>
        <div className="km-ob-sorok">
          {sor("celkozonseg")}
          {sor("cel")}
          <div className="km-ob-sor">
            <div className="km-ob-sor-fej">
              <div className="km-ob-sor-cimke">{t("mezo.nyelvek")}</div>
              {k.nyelvek.length > 0 ? <span className="km-ob-eredet" data-src={k.nyelvek_forras}>{k.nyelvek_forras === "sajat" ? t("jelzes.te_adtad") : t("jelzes.javaslat")}</span> : null}
            </div>
            <div className="km-ob-nyelvek">
              {/* R-7a 06: ugyanaz a választó, mint a 2. lépésen — a három felületi nyelv elöl, plusz ami már ki van választva; a név a nyelvNev segédből */}
              {TARTALOMNYELVEK.filter((kod) => kod === "hu" || kod === "ro" || kod === "en" || k.nyelvek.includes(kod)).map((kod) => (
                <button key={kod} type="button" className="km-ob-nyelv" data-be={k.nyelvek.includes(kod) ? "true" : "false"} aria-pressed={k.nyelvek.includes(kod)} onClick={() => nyelvValt(kod)}>{nyelvNev(kod, nyelv)}</button>
              ))}
            </div>
          </div>
          {sor("hangnem")}
        </div>
      </div>

      <div className="km-ob-halk">{t("onboarding3.arculat_kesobb")}</div>

      {hianyzok.length > 0 ? <div className="km-ob-figyelem">{t("onboarding3.hianyzik_megj", { list: hianyzok.join(", ") })}</div> : null}
      {jovahagyasHiba && !jovahagyasFut ? (
        <div className="km-ob-hiba" role="alert" aria-live="assertive">
          <div className="km-ob-hiba-cim">{t("onboarding3.jovahagyas_hiba_cim")}</div>
          <div className="km-ob-hiba-szoveg">{t("onboarding3.jovahagyas_hiba_szoveg")}</div>
        </div>
      ) : null}
      <div className="km-ob-gombsor">
        <button className="km-gomb-szellem" type="button" onClick={vissza}>{t("onboarding.nyil_vissza")} {t("onboarding.vissza")}</button>
        <button className="km-gomb" type="button" disabled={!jovahagyhato} onClick={jovahagy}>{jovahagyasFut ? t("onboarding3.jovahagyas_folyik") : t("onboarding.mentes_es_tovabb")}</button>
      </div>
      {/* F9-Sz1/b: a „csak erre a profilra vonatkozik” mondat elmarad */}
      {tiltva ? <div className="km-ob-jovahagyas-tiltva">{t("onboarding3.jovahagyas_tiltva")}</div> : null}
      {!tiltva && !tulajdonos ? <div className="km-ob-jovahagyas-tiltva">{t("onboarding3.jovahagyas_tulajdonos")}</div> : null}
    </OnboardingKeret>
  );
}
