"use client";
// R-16 K4 · 12d2 „Más színt” (design/R16-arculat/R16-arculat.dc.html 12d2; TERV §2-K4, gepezet 6b, kerdesek 4). A rajz a szerződés.
// A kivétel, nem az út: egy szín egyenként. Fülek: Fő · Második · Háttér (`?ful=`); „A logódból:” a logó színei (≤ 5, a mostani
// bekarikázva — logószín nélkül a sor nincs); „Más szín:” a rögzített 12 színű gyűrű (arculat-core `GYURU`), közepén a fül mostani
// színe. Egy koppintás → mindkét kép azonnal átszíneződik (IgyNezKi POST-mód, képenként egy kérés fut, a legutolsó választás nyer).
// Fő gomb: „Ez legyen” (ment ÉS jóváhagy → 12c); halk: „Mégse” (→ vissza a 12d-re). Nincs kódmező, csúszka, színválasztó (a rajz szerint);
// az olvasható betűszínt a kép maga választja (gepezet 5, K2 `olvashato`). Telefon: cím → a két kép → fülek → színek; a fő gomb alul.
// Kirakás-zár javítás (10-01, Csilla: jóváhagyva): a cím alatt fülenként egy halk sor — hol látszik a szín a képeken (r16.arculat.szin.hol_*).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SzinHarmas } from "@rogton/arculat-core";
import type { SzinekAdat } from "../../../../../arculat/szinek";
import { useFeliratok } from "../../../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink, Info, Teendo } from "../../../../_kozos/R15";
import { IgyNezKi } from "../../_kozos/IgyNezKi";
import { useLogoSzinek } from "../logoSzinek";
import { szinKodErtelmez } from "../szinKod";
import { VisszaSzakasz } from "../../_kozos/VisszaSzakasz";
import "../../../../_kozos/r15-lapok.css";

export type Ful = "fo" | "masodik" | "hatter";
const FULEK: readonly Ful[] = ["fo", "masodik", "hatter"];
/** A gyűrű helyei: 12 szín körben, felül kezdve, óramutató szerint (a rajz 12d2: 220 px-es kör, 36 px-es gombok; telefonon 170 / 30). */
const HELYEK = Array.from({ length: 12 }, (_, i) => ({ sin: Math.sin((i * Math.PI) / 6), cos: Math.cos((i * Math.PI) / 6) }));

export function MasSzin({ adat, kezdo, ful: kezdoFul }: { adat: SzinekAdat; kezdo: SzinHarmas; ful: Ful }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const { logoSzinek, javaslatok } = useLogoSzinek(adat);
  const [ful, setFul] = useState<Ful>(kezdoFul);
  const [szinek, setSzinek] = useState<SzinHarmas>(kezdo);
  const [folyik, setFolyik] = useState(false);
  const [hiba, setHiba] = useState(false);
  const most = szinek[ful];
  // R-17 A5/A6 (12d2/12d3): „Pontos kódom van” → a kódmező, a fül mostani színével előtöltve; érvényes kódnál a szín azonnal átáll
  // (ugyanaz az út, mint egy korong megérintése), érvénytelennél egy halk mondat, a szín marad. Mentés: a meglévő „Ez legyen”.
  const [kodNyitva, setKodNyitva] = useState(false);
  const [kod, setKod] = useState(most.toUpperCase());
  const kodErtek = szinKodErtelmez(kod);
  useEffect(() => {
    // fülváltáskor vagy korong-érintéskor a mező a mostani színt mutatja (a saját, érvényes gépelést nem írja felül)
    if (szinKodErtelmez(kod) !== most) setKod(most.toUpperCase());
  }, [most, ful]); // eslint-disable-line react-hooks/exhaustive-deps
  function kodValt(uj: string) {
    setKod(uj);
    const h = szinKodErtelmez(uj);
    if (h && h !== most) setSzinek((s) => ({ ...s, [ful]: h }));
  }

  function fulre(f: Ful) {
    setFul(f);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("ful", f);
      window.history.replaceState(window.history.state, "", u.toString()); // a fül a címben (TERV §2-K4 `?ful=`), újratöltés nélkül
    } catch { /* a cím frissítése nem fontos a működéshez */ }
  }
  const valaszt = (hex: string) => setSzinek((s) => ({ ...s, [ful]: hex }));

  async function ment() {
    setFolyik(true);
    setHiba(false);
    // ha pontosan egy 12d-kártya színei maradtak (pl. csak megnézte), annak a forrása; különben egyenkénti választás = saját
    const kartya = javaslatok.find((j) => j.fo === szinek.fo && j.masodik === szinek.masodik && j.hatter === szinek.hatter);
    const torzs = kartya
      ? { ...szinek, forras: kartya.forras, ...(kartya.forras === "szett" && kartya.szett ? { szett: kartya.szett } : {}) }
      : { ...szinek, forras: "sajat" };
    try {
      const v = await fetch("/api/arculat/szinek", { method: "POST", body: JSON.stringify(torzs), headers: { "content-type": "application/json" }, credentials: "same-origin" });
      if (!v.ok) { setHiba(true); setFolyik(false); return; }
      router.push("/fiok/arculat");
      router.refresh();
    } catch {
      setHiba(true);
      setFolyik(false);
    }
  }

  const foGomb = <FoGomb onClick={() => void ment()} disabled={folyik} aria-busy={folyik}>{t("r16.arculat.ez_legyen")}</FoGomb>;
  const korong = (hex: string, cimke: string, osztaly: string, key: string) => (
    <button key={key} type="button" className={`${osztaly}${hex === most ? " r16sz-korong-ki" : ""}`} style={{ background: hex }} aria-label={cimke} aria-pressed={hex === most} onClick={() => valaszt(hex)} />
  );

  return (
    <main className="km-lap-keret r16a-lap">
      <div className="r16sz-mas">
        <div className="r16sz-mas-fej r17-fej">
          <VisszaSzakasz />
          <div>
          <h1 className="r15-kerdes" data-r15="kerdes">{t(`r16.arculat.szin.kerdes_${ful}`)}</h1>
          {/* kirakás-zár 10-01 (a bíráló: „második szín — a második micsoda?”): egy halk sor, hol látszik ez a szín a képeken (0143) */}
          <p className="r15-kerdes-alcim" data-r15="kerdes-alcim">{t(`r16.arculat.szin.hol_${ful}`)}</p>
          </div>
        </div>

        <div className="r16sz-mas-kep">
          <IgyNezKi meret="szakasz" valasztas={{ szinek }} />
        </div>

        <Teendo osztaly="r16sz-mas-teendo">
          <div role="tablist" className="r16sz-fulek">
            {FULEK.map((f) => (
              <button key={f} type="button" role="tab" aria-selected={f === ful} className={`r16sz-ful${f === ful ? " r16sz-ful-ki" : ""}`} onClick={() => fulre(f)}>
                {t(`r16.arculat.szin.ful_${f}`)}
              </button>
            ))}
          </div>

          {logoSzinek.length > 0 ? (
            <div className="r16sz-logo-sor">
              <Info>{t("r16.arculat.szin.logobol")}</Info>
              <div className="r16sz-korongok">
                {logoSzinek.map((h, i) => korong(h, `${t("r16.arculat.szin.logobol")} ${i + 1}`, "r16sz-korong", `l${h}`))}
              </div>
            </div>
          ) : null}

          <div className="r16sz-gyuru-sor">
            <div className="r16sz-gyuru" role="group" aria-label={t("r16.arculat.szin.mas")}>
              {adat.gyuru.map((h, i) => (
                <span key={h} className="r16sz-gyuru-hely" style={{ ["--sin" as string]: HELYEK[i]!.sin.toFixed(4), ["--cos" as string]: HELYEK[i]!.cos.toFixed(4) }}>
                  {korong(h, `${t("r16.arculat.szin.mas")} ${i + 1}`, "r16sz-korong r16sz-korong-gyuru", `g${h}`)}
                </span>
              ))}
              <span className="r16sz-gyuru-kozep" style={{ background: most }} aria-hidden="true" />
            </div>
            <div className="r16sz-gyuru-szoveg">
              <Info>{t("r16.arculat.szin.mas")}</Info>
              <Info osztaly="r15-csak-asztal">{t("r16.arculat.szin.erintsd")}</Info>
              {kodNyitva ? (
                <div className="r17-kod">
                  <div className="r17-kod-sor">
                    <span className="r17-kod-minta r15-csak-asztal" style={{ background: kodErtek ?? most }} aria-hidden="true" />
                    <input className="r17-kod-mezo" value={kod} onChange={(e) => kodValt(e.target.value)} aria-label={t("r17.arculat.szin.kod_cimke")}
                      aria-invalid={kod.trim() !== "" && !kodErtek} autoComplete="off" spellCheck={false} inputMode="text" maxLength={24} />
                  </div>
                  <Info>{kod.trim() !== "" && !kodErtek ? t("r17.arculat.szin.kod_hibas") : t("r17.arculat.szin.kod_sugo")}</Info>
                </div>
              ) : (
                <HalkLink onClick={() => setKodNyitva(true)}>{t("r17.arculat.szin.pontos_kod")}</HalkLink>
              )}
              <span className="r15-csak-tel"><HalkLink href="/fiok/arculat/szinek">{t("r16.arculat.megse")}</HalkLink></span>
            </div>
          </div>

          {hiba ? <Baj szoveg={t("fiok.mentes_hiba")} gomb={<HalkGomb onClick={() => setHiba(false)}>{t("kozos.rendben")}</HalkGomb>} /> : null}

          <div className="r16sz-gombok r15-csak-asztal">
            {foGomb}
            <HalkLink href="/fiok/arculat/szinek">{t("r16.arculat.megse")}</HalkLink>
          </div>
        </Teendo>
      </div>

      <div className="r15-also-sav">{foGomb}</div>
    </main>
  );
}
