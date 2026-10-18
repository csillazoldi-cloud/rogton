"use client";
// RETIRED (R-16 K7, TERV §2-K7 / §4 25., gepezet 11, kerdesek 1 — Csilla igenje): a /fiok régi „Vizuális arculat — tervezet” dobozának
// szerkesztője. Semmi nem hivatkozik rá; a funkciója a „Logó, színek, betűk” szakaszban él (/fiok/arculat: színek 12d/12d2, betűk 12e,
// képvilág / követendő / kerülendő / lekerekítés a 12c „Részletek” mögött, jóváhagyás és visszavonás a 12b/12c-n). A fában marad, mint a
// régi Kezdolap.tsx / Poszt.tsx — a törlés Csilla kattintása. Új kód ne importálja.
import type { ArculatLepes } from "@km/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { ARCULAT_ALAP, arculatJovahagy, arculatKesobbre, arculatMegis, arculatModosit, arculatTervezetElvet, arculatVisszavon } from "@km/profile-core";
import { arculatAllapotSzoveg } from "./kliens";

// A v6 prototípus betűkészlet-választéka a mintakártyához (az ügyfélkreatív tartománya, nem a felület betűje)
const CIM_BETUK = ["Georgia, serif", "'Archivo',sans-serif", "'Space Grotesk',sans-serif", "'IBM Plex Sans',sans-serif", "'Cairo',sans-serif"];
const CIM_BETU_NEVEK = ["Georgia (serif)", "Archivo", "Space Grotesk", "IBM Plex Sans", "Cairo (arab)"];
const SZOVEG_BETUK = ["'Public Sans',sans-serif", "'IBM Plex Sans',sans-serif", "Georgia, serif", "'Tajawal',sans-serif"];
const SZOVEG_BETU_NEVEK = ["Public Sans", "IBM Plex Sans", "Georgia (serif)", "Tajawal (arab)"];
/** A mintakártya szövege — SEMLEGES minta a tervezet nyelvén (az ügyfélkreatív nyelve, nem a felületé, ezért nem feliratkulcs;
 *  az arab a jobbról balra írás próbája). F-8.1 i (T-35): a v6 iparági példamondata („Kézzel készült, tartós darabok") elmaradt — az audit 8. pontja. */
export const KARTYA_SZOVEG: Record<string, { szoveg: string; gomb: string }> = {
  hu: { szoveg: "Így néz ki egy rövid szöveg a saját színeiddel és betűiddel.", gomb: "Tovább" },
  ro: { szoveg: "Așa arată un text scurt cu culorile și fonturile tale.", gomb: "Mai departe" },
  en: { szoveg: "This is how a short text looks in your colours and fonts.", gomb: "Continue" },
  ar: { szoveg: "هكذا يبدو نص قصير بألوانك وخطوطك.", gomb: "متابعة" },
};

/** Az arculat állapotának jelvény-szövege (állapot · n. tervezet · általad módosítva). */
export function arculatJelvenySzoveg(a: ArculatLepes, t: (k: string, e?: Record<string, string | number>) => string): string {
  let sz = arculatAllapotSzoveg(a.allapot, t);
  if (a.allapot === "tervezet" && a.tervezet) sz += " · " + t("onboarding3.arc_tervezet_v", { v: a.verzio }) + (a.tervezet.modositva ? t("jelveny.modositva") : "");
  return sz;
}

/** Az arculati blokk (v6 OB-03-B) — a 3. lépésen és a fiókoldalon ugyanaz. Az állapotgépet itt visszük:
 *  nincs → tervezet → (kesobb | jovahagyott); jóváhagyott szerkesztése új tervezet (verzio+1), a pillanatkép megmarad. */
export { ARCULAT_ALAP };

export function ArculatBlokk({ arculat: a, nev, valtozik }: { arculat: ArculatLepes; nev: string; valtozik: (uj: (regi: ArculatLepes) => ArculatLepes) => void }) {
  const { t } = useFeliratok();
  const tervezet = a.tervezet;
  const arculatJelveny = arculatJelvenySzoveg(a, t);
  const bp = tervezet?.elsodleges ?? ARCULAT_ALAP.elsodleges, bs = tervezet?.masodlagos ?? ARCULAT_ALAP.masodlagos, bbg = tervezet?.hatter ?? ARCULAT_ALAP.hatter;
  const bCim = tervezet?.betu_cim || ARCULAT_ALAP.betu_cim, bSzov = tervezet?.betu_szoveg || ARCULAT_ALAP.betu_szoveg;
  const bRad = tervezet?.lekerekites ?? 8;
  const bNyelv = tervezet?.nyelv ?? "hu";
  const kartya = KARTYA_SZOVEG[bNyelv] ?? KARTYA_SZOVEG["hu"]!;
  const arculatTest = !!tervezet && a.allapot !== "kesobb";
  const kesobbreHagyva = a.allapot === "kesobb";
  const arculatNincs = !tervezet && a.allapot !== "kesobb";
  const arculatIdeiglenes = !!tervezet && (!tervezet.betu_cim || !tervezet.betu_szoveg);
  return (
    <>
      <div className="km-ob-arculat">
        <div className="km-ob-tomb-fej">
          <div className="km-ob-arculat-cim">{t("onboarding3.arculat_cim")}</div>
          <span className="km-ob-arc-jelveny" data-allapot={a.allapot}>{arculatJelveny}</span>
          {a.allapot === "tervezet" || (!tervezet && a.allapot === "nincs") ? (
            <button type="button" className="km-ob-kesobb" onClick={() => valtozik((pa) => arculatKesobbre(pa))}>{t("onboarding3.arc_kesobbre")}</button>
          ) : null}
          {kesobbreHagyva ? (
            <button type="button" className="km-ob-kesobb" onClick={() => valtozik((pa) => arculatMegis(pa))}>{t("onboarding3.arc_megis")}</button>
          ) : null}
        </div>
        <div className="km-ob-arculat-sugo">{t("onboarding3.arculat_sugo")}</div>
        {a.allapot === "tervezet" && a.jovahagyott_verzio !== null ? (
          <div className="km-ob-figyelem km-ob-arc-megtartva">{t("onboarding3.arc_megtartva", { v: a.jovahagyott_verzio })}
            <button type="button" className="km-gomb-figyelem" onClick={() => valtozik((pa) => arculatTervezetElvet(pa))}>{t("onboarding3.arc_tervezet_elvet")}</button>
          </div>
        ) : null}
        {arculatTest && tervezet ? (
          <>
            <div className="km-ob-arc-racs">
              <div className="km-ob-arc-bal">
                <div className="km-ob-arc-alcim">{t("onboarding3.arc_szinek")} <span>{t("onboarding3.arc_csak_kreativ")}</span></div>
                <div className="km-ob-arc-szinek">
                  <label><input type="color" value={tervezet.elsodleges} aria-label={t("onboarding3.arc_elsodleges")} onChange={(e) => valtozik((pa) => arculatModosit(pa, { elsodleges: e.target.value }))} />{t("onboarding3.arc_elsodleges")}</label>
                  <label><input type="color" value={tervezet.masodlagos} aria-label={t("onboarding3.arc_masodlagos")} onChange={(e) => valtozik((pa) => arculatModosit(pa, { masodlagos: e.target.value }))} />{t("onboarding3.arc_masodlagos")}</label>
                  <label><input type="color" value={tervezet.hatter} aria-label={t("onboarding3.arc_hatter")} onChange={(e) => valtozik((pa) => arculatModosit(pa, { hatter: e.target.value }))} />{t("onboarding3.arc_hatter")}</label>
                </div>
                <div className="km-ob-arc-ketto">
                  <label>{t("onboarding3.arc_betu_cim")}
                    <select value={tervezet.betu_cim} onChange={(e) => valtozik((pa) => arculatModosit(pa, { betu_cim: e.target.value }))}>
                      <option value="">— {t("onboarding3.arc_nincs")} —</option>
                      {CIM_BETUK.map((f, i) => <option key={f} value={f}>{CIM_BETU_NEVEK[i]}</option>)}
                    </select>
                  </label>
                  <label>{t("onboarding3.arc_betu_szoveg")}
                    <select value={tervezet.betu_szoveg} onChange={(e) => valtozik((pa) => arculatModosit(pa, { betu_szoveg: e.target.value }))}>
                      <option value="">— {t("onboarding3.arc_nincs")} —</option>
                      {SZOVEG_BETUK.map((f, i) => <option key={f} value={f}>{SZOVEG_BETU_NEVEK[i]}</option>)}
                    </select>
                  </label>
                </div>
                {tervezet.betu_iranymutatas ? <div className="km-ob-arc-megj">{t("onboarding3.arc_betu_iranymutatas", { v: tervezet.betu_iranymutatas })}</div> : null}
                <label className="km-ob-arc-cimke">{t("onboarding3.arc_kepvilag")}</label>
                <textarea className="km-ob-arc-terulet" rows={2} aria-label={t("onboarding3.arc_kepvilag")} value={tervezet.kepvilag} onChange={(e) => valtozik((pa) => arculatModosit(pa, { kepvilag: e.target.value }))} />
                <div className="km-ob-arc-ketto">
                  <label>{t("onboarding3.arc_kovetendo")}<input value={tervezet.kovetendo} onChange={(e) => valtozik((pa) => arculatModosit(pa, { kovetendo: e.target.value }))} /></label>
                  <label>{t("onboarding3.arc_kerulendo")}<input value={tervezet.kerulendo} onChange={(e) => valtozik((pa) => arculatModosit(pa, { kerulendo: e.target.value }))} /></label>
                </div>
                <div className="km-ob-arc-sor">
                  <label className="km-ob-arc-csuszka">{t("onboarding3.arc_lekerekites")}: <strong>{bRad} px</strong>
                    <input type="range" min={0} max={24} step={1} value={bRad} onChange={(e) => valtozik((pa) => arculatModosit(pa, { lekerekites: parseInt(e.target.value, 10) }))} />
                  </label>
                  <label>{t("onboarding3.arc_kartya_nyelv")}
                    <select value={bNyelv} onChange={(e) => valtozik((pa) => arculatModosit(pa, { nyelv: e.target.value }))}>
                      <option value="hu">Magyar</option><option value="ro">Română</option><option value="en">English</option><option value="ar">العربية</option>
                    </select>
                  </label>
                </div>
                <div className="km-ob-arc-eredet">{tervezet.eredet === "forras" ? t("onboarding3.arc_eredet_forras") : t("onboarding3.arc_eredet_ai")} {t("onboarding3.arc_egy_minta")}</div>
              </div>
              <div className="km-ob-arc-jobb">
                <div className="km-ob-arc-alcim">{t("onboarding3.arc_mintakartya")}</div>
                {/* az ügyfélkreatív: KIZÁRÓLAG a tervezet értékeiből épül, SaaS-tokent nem örököl (v6) */}
                <div dir={bNyelv === "ar" ? "rtl" : "ltr"} aria-label={t("onboarding3.arc_mintakartya")} className="km-mintakartya" style={{ background: bbg, borderRadius: `${bRad}px`, fontFamily: bSzov }}>
                  <div className="km-mintakartya-logo" style={{ borderRadius: `${Math.max(2, Math.round(bRad * 0.5))}px`, background: bp, color: bbg, fontFamily: bCim }}>{(nev || "M").charAt(0).toUpperCase()}</div>
                  <div className="km-mintakartya-cim" style={{ color: bp, fontFamily: bCim }}>{nev || t("onboarding3.minta_nev")}</div>
                  <div className="km-mintakartya-szoveg" style={{ color: `color-mix(in srgb, ${bp} 75%, black)` /* tokenőr: ok — ügyfélkreatív, a tervezet színéből (v6) */ }}>{kartya.szoveg}</div>
                  <div className="km-mintakartya-gomb" style={{ background: bs, color: `color-mix(in srgb, ${bs} 15%, black)` /* tokenőr: ok — ügyfélkreatív, a tervezet színéből (v6) */, borderRadius: `${bRad}px` }}>{kartya.gomb}</div>
                </div>
                {arculatIdeiglenes ? <div className="km-ob-arc-ideiglenes">{t("onboarding3.arc_ideiglenes")}</div> : null}
              </div>
            </div>
            <div className="km-ob-arc-gombok">
              {a.allapot === "tervezet" ? (
                <>
                  <button type="button" className="km-gomb-arc-jovahagy" onClick={() => valtozik((pa) => arculatJovahagy(pa))}>{t("onboarding3.arc_jovahagyas")}</button>
                  <span className="km-ob-arc-kulon">{t("onboarding3.arc_kulon")}</span>
                </>
              ) : null}
              {a.allapot === "jovahagyott" ? (
                <span className="km-ob-arc-ok">✓ {t("onboarding3.arc_jovahagyott")} <button type="button" className="km-ob-arc-visszavon" onClick={() => valtozik((pa) => arculatVisszavon(pa))}>{t("onboarding3.arc_visszavon")}</button></span>
              ) : null}
            </div>
          </>
        ) : null}
        {kesobbreHagyva ? <div className="km-ob-kesobbre">{t("onboarding3.arc_kesobb_hosszu")}</div> : null}
        {arculatNincs ? <div className="km-ob-kesobbre">{t("onboarding3.arc_nincs_megj")}</div> : null}
      </div>
    </>
  );
}
