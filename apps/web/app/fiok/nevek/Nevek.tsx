"use client";
// R-18 6. kör (Kati D) · „Hivatalos nevek”: asztalon háromoszlopos táblázat (Magyar · Román · Angol), soronként ✕, a végén egy üres sor az
// új névnek; telefonon nevenként egy kártya (HU/RO/EN) és „+ Új név”. Egy fő gomb: „Mentem”. Egy nyelv is elég — a hiányzót nem találjuk ki.
// Mentés: PUT /api/profil/nevek (a profil meglévő jsonb-jében). Utána minden fordítás és írás ezeket a neveket használja (poszt/nevek.ts).
import { useState } from "react";
import { useFeliratok } from "../../../nyelv/kliens";
import { hivas } from "../../_kozos/kliens";
import { FoGomb, HalkLink, Info, KerdesCim } from "../../_kozos/R15";
import "../../_kozos/r15-lapok.css";
import "./nevek.css";

type Sor = { hu: string; ro: string; en: string };
const URES: Sor = { hu: "", ro: "", en: "" };
const NYELVEK = ["hu", "ro", "en"] as const;
const vanBenne = (s: Sor) => !!(s.hu.trim() || s.ro.trim() || s.en.trim());

export function Nevek({ kezdo, vanProfil, szerkesztheti, vissza }: { kezdo: Sor[]; vanProfil: boolean; szerkesztheti: boolean; vissza: string | null }) {
  const { t } = useFeliratok();
  // mindig van egy üres sor a végén (asztalon az új név helye)
  const [sorok, setSorok] = useState<Sor[]>(() => [...kezdo.map((s) => ({ ...URES, ...s })), { ...URES }]);
  const [allapot, setAllapot] = useState<"" | "fut" | "kesz" | "hiba">("");
  const nyelvNev: Record<(typeof NYELVEK)[number], string> = { hu: t("nevek.magyar"), ro: t("nevek.roman"), en: t("nevek.angol") };
  const pelda: Record<(typeof NYELVEK)[number], string> = { hu: t("nevek.pelda_hu"), ro: t("nevek.pelda_ro"), en: t("nevek.pelda_en") };

  function allit(i: number, k: (typeof NYELVEK)[number], v: string) {
    setAllapot("");
    setSorok((l) => {
      const uj = l.map((s, j) => (j === i ? { ...s, [k]: v } : s));
      if (vanBenne(uj[uj.length - 1]!)) uj.push({ ...URES }); // az utolsó sor kitöltésével jön a következő üres
      return uj;
    });
  }
  const torol = (i: number) => { setAllapot(""); setSorok((l) => { const uj = l.filter((_, j) => j !== i); return uj.length && !vanBenne(uj[uj.length - 1]!) ? uj : [...uj, { ...URES }]; }); };
  const ujNev = () => setSorok((l) => (vanBenne(l[l.length - 1]!) ? [...l, { ...URES }] : l));

  async function ment() {
    setAllapot("fut");
    const r = await hivas("/api/profil/nevek", "PUT", { nevek: sorok.filter(vanBenne) });
    if (r.statusz !== 200) { setAllapot("hiba"); return; }
    const l = (r.torzs["nevek"] as Sor[] | undefined) ?? [];
    setSorok([...l.map((s) => ({ ...URES, ...s })), { ...URES }]);
    setAllapot("kesz");
  }

  const kitoltott = sorok.filter(vanBenne);
  const tiltva = !szerkesztheti || !vanProfil;
  const visszaLink = vissza ? <HalkLink href={vissza}>← {t("r15.nav.poszt")}</HalkLink> : <HalkLink href="/fiok">{t("nevek.vissza")}</HalkLink>;
  const allapotSor = allapot === "kesz" ? <Info osztaly="r18f-ok">{t("nevek.mentve")}</Info> : allapot === "hiba" ? <Info>{t("nevek.hiba")}</Info> : null;

  return (
    <main className="km-lap-keret r15-lap r18f-lap">
      <span className="r15-csak-asztal"><KerdesCim cim={t("nevek.cim")} alcim={t("nevek.alcim")} /></span>
      <span className="r15-csak-tel"><KerdesCim cim={t("nevek.cim")} alcim={t("nevek.alcim_rovid")} /></span>
      <div className="r18f-linkek">{visszaLink}</div>
      {!vanProfil ? <Info>{t("nevek.nincs_profil")}</Info> : null}

      {/* asztal: táblázat */}
      <section className="r15-teendo r18f-tabla r15-csak-asztal" data-r15="teendo">
        <div className="r18f-fej" aria-hidden="true">{NYELVEK.map((k) => <span key={k} className="r18f-cimke">{nyelvNev[k]}</span>)}<span /></div>
        {sorok.map((s, i) => {
          const utolso = i === sorok.length - 1;
          return (
            <div key={i} className="r18f-sor">
              {NYELVEK.map((k) => <input key={k} className="r18p-input" value={s[k]} maxLength={200} aria-label={nyelvNev[k]} placeholder={utolso ? pelda[k] : ""} disabled={tiltva} onChange={(e) => allit(i, k, e.target.value)} />)}
              {!utolso ? <button type="button" className="r18f-torol" aria-label={t("nevek.torles")} disabled={tiltva} onClick={() => torol(i)}>✕</button> : <span />}
            </div>
          );
        })}
        <div className="r18f-gombsor">
          <FoGomb onClick={() => void ment()} disabled={tiltva || allapot === "fut"}>{t("nevek.mentem")}</FoGomb>
          <Info>{t("nevek.egy_eleg")}</Info>
        </div>
        {allapotSor}
      </section>

      {/* telefon: nevenként egy kártya */}
      <div className="r18f-kartyak r15-csak-tel">
        {(kitoltott.length ? sorok.slice(0, -1) : sorok.slice(0, 1)).map((s, i) => (
          <div key={i} className="r18f-kartya">
            {NYELVEK.map((k) => (
              <label key={k} className="r18f-kartya-sor"><span className="r18f-nyelv">{k.toUpperCase()}</span><input className="r18p-input" value={s[k]} maxLength={200} aria-label={nyelvNev[k]} placeholder={kitoltott.length ? "" : pelda[k]} disabled={tiltva} onChange={(e) => allit(i, k, e.target.value)} /></label>
            ))}
            {kitoltott.length ? <button type="button" className="r18f-torol r18f-kartya-torol" aria-label={t("nevek.torles")} disabled={tiltva} onClick={() => torol(i)}>✕</button> : null}
          </div>
        ))}
        <span><HalkLink onClick={ujNev} disabled={tiltva}>{t("nevek.uj")}</HalkLink></span>
        <Info>{t("nevek.egy_eleg")}</Info>
        {allapotSor}
      </div>
      <div className="r15-also-sav"><FoGomb onClick={() => void ment()} disabled={tiltva || allapot === "fut"}>{t("nevek.mentem")}</FoGomb></div>
    </main>
  );
}
