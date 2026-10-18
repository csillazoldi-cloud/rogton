"use client";
// R-16 K3 · „Logó, színek, betűk” — 12a · 12b · 12c (design/R16-arculat/R16-arculat.dc.html; TERV §2-K3). A rajz a szerződés:
// ami nincs a rajzon, az nincs a képernyőn. Asztal: bal hasáb 640 (kérdés · teendő a sorokkal · Fájlok), jobbra „Így néz ki egy képed”;
// telefon (≤ 640): kérdés → a két kép → a sorok → Fájlok; a fő gomb a lap alján (r15-also-sav).
//  - 12a (nincs jóváhagyva, nincs logó): „Kezdjük a logóddal”; fő: „Logó feltöltése” (→ 12f); halk: „Így jó, logó nélkül” (jóváhagy).
//  - 12b (nincs jóváhagyva, de van logó / a színek a honlapról): „Jól ismer a gép?”; fő: „Igen, ez mi vagyunk” (jóváhagy).
//    Az alcím és a „Honnan?” CSAK ha ismert a honlap címe (TERV §4 15.: nem állítunk olyat, amit nem tudunk).
//  - 12c (jóváhagyva): „Így készülnek a képeid” + kész-sor; fő: „Kép készítése” (→ /kepek, T9).
//  - Néző: a sorok Csere nélkül, jóváhagyás nincs; fő gomb: „Kép készítése” (T2: pontosan egy).
// R-16 K6: „Nincs logóm” (halk link → 12g /fiok/arculat/nevlogo) a Logó sor „Még nincs” mezője mellett, telefonon a 12a „Így jó, logó
// nélkül” gombja mellett (a rajz 12a) — csak szerkesztőnek (a néző nem készít logót). A „Csere” Színek → /fiok/arculat/szinek (K4),
// Betűk → /fiok/arculat/betuk (K5): a rajz és a TERV §2-K3 szerint; a K4/K5 előtt ezek a címek még nem léteznek (sötét lap, TERV §4 2.).
// A Részletek (r15.kozos.reszletek) mögött: a régi tervezet-doboz képvilág/követendő/kerülendő/lekerekítés mezői (mentés = jóváhagyás,
// kerdesek 4), 12c-n a jóváhagyó és az idő, és a „jóváhagyás visszavonása”. Mentés után `router.refresh()`: a képernyő újratöltés
// nélkül vált (12a → 12c).
// R-16 utókérés 2 (UTOKERES-2.md, gepezet-3 4): TELEFONON, ha szerkesztő és még nincs logó (12a, `ures`), a lap a névlogóval kezd
// (NevlogoNyito: három névlogó, kép, színek, betűk, „Van saját logóm” · „Most logó nélkül”, fő gomb „Ez legyen a logóm”); a két
// „logó nélkül” út egy lett. A szakasz többi része telefonon ilyenkor rejtve, a „Fájlok” és a „Részletek” sora marad. Asztal: változatlan.
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LogoValtozat } from "@km/contracts";
import { BEEPITETT } from "@km/arculat-core";
import type { SzakaszAdat } from "../../../arculat/allapot";
import { useFeliratok } from "../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink, Info, KeszPillanat, KerdesCim, Reszletek, Teendo } from "../../_kozos/R15";
import { ArculatAnyagok } from "../../_kozos/ArculatAnyagok";
import { IgyNezKi } from "./_kozos/IgyNezKi";
import { useSajatBetu } from "./_kozos/sajatBetu";
import { NevlogoNyito, NevlogoNyitoFoGomb, useNevlogoNyito } from "./NevlogoNyito";
import { useTelefon } from "./nevlogo/Nevlogo";
import "../../_kozos/r15-lapok.css";

const LOGO_SORREND: readonly LogoValtozat[] = ["vilagos", "sotet", "egyszinu", "negyzetes"];
/** 12b: egy logó a sorban — az első kitöltött hely ebben a sorrendben (a rajzon a világos). */
const EGY_LOGO_SORREND: readonly LogoValtozat[] = ["vilagos", "egyszinu", "sotet", "negyzetes"];

export function ArculatSzakasz({ adat }: { adat: SzakaszAdat }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const [folyik, setFolyik] = useState(false);
  const [, atmenet] = useTransition();
  const [hiba, setHiba] = useState(false);
  const [reszletekNyitva, setReszletekNyitva] = useState(false);
  const [fajlokNyitva, setFajlokNyitva] = useState(false);
  const [honnanNyitva, setHonnanNyitva] = useState(false);
  const [mezok, setMezok] = useState(adat.reszletek);

  const { nezet, szerkesztheto } = adat;
  const kesz = nezet === "kesz";
  const talalt = nezet === "talalt";
  // utókérés 2: a telefonos nyitó a névlogóval — csak szerkesztőnek, csak üres (nem jóváhagyott, logó nélküli) szakaszon
  const nyito = szerkesztheto && nezet === "ures" && !adat.vanLogo;
  const nl = useNevlogoNyito();
  const tel = useTelefon();

  async function kuld(ut: string, modszer: "POST" | "PUT", torzs: unknown = {}) {
    setFolyik(true);
    setHiba(false);
    try {
      const v = await fetch(ut, { method: modszer, body: JSON.stringify(torzs), headers: { "content-type": "application/json" }, credentials: "same-origin" });
      if (!v.ok) { setHiba(true); return; }
      setReszletekNyitva(false);
      atmenet(() => router.refresh());
    } catch {
      setHiba(true);
    } finally {
      setFolyik(false);
    }
  }
  const jovahagy = () => void kuld("/api/arculat/jovahagy", "POST");
  const reszletekMent = () => void kuld("/api/arculat/reszletek", "PUT", mezok);
  const visszavon = () => void kuld("/api/arculat/visszavon", "POST");

  // ——— a fej ———
  const cim = kesz ? t("r16.arculat.kesz.kerdes") : talalt ? t("r16.arculat.talalt.kerdes") : t("r16.arculat.ures.kerdes");
  const alcim = kesz ? undefined : talalt ? (adat.forrasCim ? t("r16.arculat.talalt.alcim") : undefined) : t("r16.arculat.ures.alcim");

  // ——— a fő gomb (T2: pontosan egy) ———
  const fo: { szoveg: string; href?: string; onClick?: () => void } =
    !szerkesztheto || kesz ? { szoveg: t("r16.arculat.kep_keszitese"), href: "/kepek" }
      : talalt ? { szoveg: t("r16.arculat.igen"), onClick: jovahagy }
        : { szoveg: t("r16.arculat.logo_feltoltes"), href: "/fiok/arculat/logok" };
  const foGomb = () => fo.href
    ? <FoGomb href={fo.href}>{fo.szoveg}</FoGomb>
    : <FoGomb onClick={fo.onClick ?? (() => undefined)} disabled={folyik} aria-busy={folyik}>{fo.szoveg}</FoGomb>;

  const csere = (href: string) => (szerkesztheto ? <HalkGomb href={href} osztaly="r16a-csere">{t("r16.arculat.csere")}</HalkGomb> : null);

  // ——— a Logó sor ———
  const kitoltott = LOGO_SORREND.filter((h) => adat.logok[h]);
  const logoCsempe = (hely: LogoValtozat) => (
    <span key={hely} className={`r16a-csempe r16a-csempe-${hely}`} style={hely === "egyszinu" ? undefined : { background: adat.logoHatterek[hely] }}>
      <img src={`/api/arculat/fajl/${adat.logok[hely]}`} alt={t(`r16.arculat.logok.${hely}`)} />
    </span>
  );
  const megNincs = szerkesztheto
    ? <a className="r16a-meg-nincs" href="/fiok/arculat/logok"><span className="r16a-meg-nincs-mezo">{t("r16.arculat.logo_meg_nincs")}</span></a>
    : <span className="r16a-meg-nincs"><span className="r16a-meg-nincs-mezo">{t("r16.arculat.logo_meg_nincs")}</span></span>;
  const nincsLogom = szerkesztheto ? <HalkLink href="/fiok/arculat/nevlogo">{t("r16.arculat.nincs_logom")}</HalkLink> : null;
  let logoSor: ReactNode;
  if (!adat.vanLogo) {
    // 12a: a „Még nincs” mező maga a gomb (→ 12f), mellette a „Nincs logóm” (→ 12g, K6); Csere nincs. Telefonon a 12a-n a sor nem látszik
    // (a fő gomb a feltöltés; a „Nincs logóm” ott a halk gomb mellett áll).
    logoSor = <Sor cimke={t("r16.arculat.logo")} {...(nezet === "ures" ? { osztaly: "r15-csak-asztal" } : {})} tartalom={<>{megNincs}{nincsLogom}</>} />;
  } else if (!kesz) {
    const egy = EGY_LOGO_SORREND.find((h) => adat.logok[h])!;
    // R-17 A9 (12b telefon, Kati H2): telefonon MINDEN feltöltött változat csempeként (a sor címkéje „Logók”), asztalon változatlan (kerdesek 4)
    logoSor = <Sor cimke={t("r16.arculat.logo")} cimkeTel={t("r16.arculat.logok")} tartalom={<>
      <span className="r15-csak-asztal r17-egy-logo">{logoCsempe(egy)}{szerkesztheto ? <HalkLink href="/fiok/arculat/logok">{t("r16.arculat.tobb_logo")}</HalkLink> : null}</span>
      <span className="r15-csak-tel"><span className="r16a-csempek">{kitoltott.map(logoCsempe)}</span></span>
    </>} csere={csere("/fiok/arculat/logok")} />;
  } else {
    logoSor = <Sor cimke={t("r16.arculat.logok")} tartalom={<span className="r16a-csempek">{kitoltott.map(logoCsempe)}</span>} csere={csere("/fiok/arculat/logok")} />;
  }

  const szin = (hex: string, kulcs: string) => (
    <span className="r16a-szin">
      <span className="r16a-korong" style={{ background: hex }} role="img" aria-label={t(kulcs)} />
      <span className="r16a-szin-szo r15-csak-asztal">{t(kulcs)}</span>
    </span>
  );

  const vanFajl = adat.fajlok.kezikonyv + adat.fajlok.minta + adat.fajlok.dokumentum > 0;
  const idoSzoveg = (iso: string) => { try { return new Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)); } catch { return iso; } };

  return (
    <main className="km-lap-keret r16a-lap">
      <div className={nyito ? "r16a-szakasz r16a-szakasz-nl" : "r16a-szakasz"}>
        {nyito ? <NevlogoNyito adat={adat} allapot={nl} logoNelkul={jovahagy} logoNelkulFolyik={folyik} /> : null}
        <div className="r16a-fej">
          <KerdesCim cim={cim} {...(alcim ? { alcim } : {})} />
          {kesz ? (
            <div className="r16a-kesz">
              <KeszPillanat>
                <span className="r15-csak-asztal">{t("r16.arculat.kesz.jovahagyva")}</span>
                <span className="r15-csak-tel">{t("r16.arculat.kesz.jovahagyva_rovid")}</span>
              </KeszPillanat>
            </div>
          ) : null}
        </div>

        <div className="r16a-kep">
          {/* a nyitóban telefonon a képet a NevlogoNyito kéri — a rejtett elrendezés képe ne foglalja a képgyártót (TERV §4 23.) */}
          {nyito && tel !== false ? null : <IgyNezKi meret="szakasz" valasztas={adat.elonezet ? { szinek: adat.elonezet } : null} />}
        </div>

        <Teendo osztaly="r16a-sorok">
          {logoSor}
          <Sor
            cimke={t("r16.arculat.szinek")}
            tartalom={<>{szin(adat.szinek.fo, "r16.arculat.szin.fo")}{szin(adat.szinek.masodik, "r16.arculat.szin.masodik")}{szin(adat.szinek.hatter, "r16.arculat.szin.hatter")}</>}
            csere={csere("/fiok/arculat/szinek")}
          />
          <Sor
            cimke={t("r16.arculat.betuk")}
            tartalom={<>
              <span className="r16a-betu"><Betu minta={t("r16.arculat.betu.cim")} szo={<BetuSzo osztaly="r16a-betu-cim" kulcs={adat.betuk.cim} szo={t(adat.betuk.cimSzo)} sajat={adat.betuk.cimSajat} />} /></span>
              <span className="r16a-betu"><Betu minta={t("r16.arculat.betu.szoveg")} szo={<BetuSzo osztaly="r16a-betu-szoveg" kulcs={adat.betuk.szoveg} szo={t(adat.betuk.szovegSzo)} sajat={adat.betuk.szovegSajat} />} /></span>
            </>}
            csere={csere("/fiok/arculat/betuk")}
          />
          {/* asztal: a fő gomb a teendőben; telefonon a lap alján */}
          <div className="r16a-gombsor r15-csak-asztal">
            {foGomb()}
            {szerkesztheto && nezet === "ures" ? <HalkGomb onClick={jovahagy} disabled={folyik} aria-busy={folyik} osztaly="r16a-halk-nagy">{t("r16.arculat.jo_logo_nelkul")}</HalkGomb> : null}
            {talalt && adat.forrasCim ? <HalkLink onClick={() => setHonnanNyitva((x) => !x)} aria-expanded={honnanNyitva}>{t("r16.arculat.talalt.honnan")}</HalkLink> : null}
          </div>
          {szerkesztheto && nezet === "ures" ? (
            <div className="r16a-tel-sor r15-csak-tel">
              <HalkGomb onClick={jovahagy} disabled={folyik} aria-busy={folyik} osztaly="r16a-csere">{t("r16.arculat.jo_logo_nelkul")}</HalkGomb>
              {nincsLogom}
            </div>
          ) : null}
        </Teendo>

        <div className="r16a-alja">
          {hiba ? <Baj szoveg={t("fiok.mentes_hiba")} gomb={<HalkGomb onClick={() => setHiba(false)}>{t("kozos.rendben")}</HalkGomb>} /> : null}
          {honnanNyitva && adat.forrasCim ? <Reszletek><p className="r16a-reszletek">{adat.forrasCim}</p></Reszletek> : null}
          <div className="r16a-fajlok-sor">
            <Info osztaly="r15-csak-asztal">{vanFajl ? t("r16.arculat.fajlok_db", { minta: adat.fajlok.minta, dok: adat.fajlok.dokumentum }) : t("r16.arculat.fajlok_sor")}</Info>
            {talalt && adat.forrasCim ? <span className="r15-csak-tel"><HalkLink onClick={() => setHonnanNyitva((x) => !x)} aria-expanded={honnanNyitva}>{t("r16.arculat.talalt.honnan")}</HalkLink></span> : null}
            <HalkLink onClick={() => setFajlokNyitva((x) => !x)} aria-expanded={fajlokNyitva}>{t("r16.arculat.fajlok")}</HalkLink>
            <HalkLink onClick={() => setReszletekNyitva((x) => !x)} aria-expanded={reszletekNyitva}>{t("r15.kozos.reszletek")}</HalkLink>
          </div>

          {reszletekNyitva ? (
            <Reszletek>
              <div className="r16a-reszletek-mezok">
                {kesz && adat.jovahagyva ? <p className="r16a-reszletek">{t("fiok.jovahagyva_meta", { ido: idoSzoveg(adat.jovahagyva.ido), ki: adat.jovahagyva.ki })}</p> : null}
                {szerkesztheto ? (
                  <>
                    <label className="r16a-mezo">{t("onboarding3.arc_kepvilag")}
                      <textarea rows={2} value={mezok.kepvilag} maxLength={500} onChange={(e) => setMezok((m) => ({ ...m, kepvilag: e.target.value }))} />
                    </label>
                    <label className="r16a-mezo">{t("onboarding3.arc_kovetendo")}
                      <input value={mezok.kovetendo} maxLength={300} onChange={(e) => setMezok((m) => ({ ...m, kovetendo: e.target.value }))} />
                    </label>
                    <label className="r16a-mezo">{t("onboarding3.arc_kerulendo")}
                      <input value={mezok.kerulendo} maxLength={300} onChange={(e) => setMezok((m) => ({ ...m, kerulendo: e.target.value }))} />
                    </label>
                    <label className="r16a-mezo">{t("onboarding3.arc_lekerekites")}: {mezok.lekerekites} px
                      <input type="range" min={0} max={24} step={1} value={mezok.lekerekites} onChange={(e) => setMezok((m) => ({ ...m, lekerekites: parseInt(e.target.value, 10) }))} />
                    </label>
                    <div className="r16a-gombsor">
                      <HalkGomb onClick={reszletekMent} disabled={folyik} aria-busy={folyik}>{t("onboarding3.mentes")}</HalkGomb>
                      {kesz ? <HalkLink onClick={visszavon}>{t("onboarding3.arc_visszavon")}</HalkLink> : null}
                    </div>
                  </>
                ) : (
                  <>
                    {adat.reszletek.kepvilag ? <p className="r16a-reszletek">{t("onboarding3.arc_kepvilag")}: {adat.reszletek.kepvilag}</p> : null}
                    {adat.reszletek.kovetendo || adat.reszletek.kerulendo ? <p className="r16a-reszletek">{t("fiok.arc_iranyelvek", { a: adat.reszletek.kovetendo, b: adat.reszletek.kerulendo })}</p> : null}
                  </>
                )}
              </div>
            </Reszletek>
          ) : null}

          {fajlokNyitva ? (
            <div className="r16a-fajlok">
              <ArculatAnyagok arculat={adat.lepes} szerkesztheto={szerkesztheto} valtozik={() => undefined} celok={["kezikonyv", "referencia", "dokumentum"]} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="r15-also-sav">{nyito ? <NevlogoNyitoFoGomb allapot={nl} /> : foGomb()}</div>
    </main>
  );
}

/** Egy sor a teendőben: címke · tartalom · (Csere). Asztalon három oszlop, telefonon: címke és Csere egy sorban, alatta a tartalom. */
function Sor({ cimke, cimkeTel, tartalom, csere, osztaly }: { cimke: string; cimkeTel?: string; tartalom: ReactNode; csere?: ReactNode; osztaly?: string | undefined }) {
  return (
    <div className={`r16a-sor${osztaly ? ` ${osztaly}` : ""}`}>
      {cimkeTel
        ? <div className="r16a-sor-cimke"><span className="r15-csak-asztal">{cimke}</span><span className="r15-csak-tel">{cimkeTel}</span></div>
        : <div className="r16a-sor-cimke">{cimke}</div>}
      <div className="r16a-sor-tartalom">{tartalom}</div>
      {csere ? <div className="r16a-sor-csere">{csere}</div> : null}
    </div>
  );
}

/** A betű szava a saját betűjével. R-16 K5: saját betűnél a szó helyén a betű neve, a saját betűjével (betöltésig a Public Sans). */
function BetuSzo({ osztaly, kulcs, szo, sajat }: { osztaly: string; kulcs: string; szo: string; sajat: { id: string; nev: string } | null }) {
  const csalad = useSajatBetu(sajat?.id);
  if (sajat) return <span className={`${osztaly} kb-public-sans`} style={csalad ? { fontFamily: csalad } : undefined}>{sajat.nev}</span>;
  // VJ-1011 (Kati #8, „telefonon a betűtípusnevek nem látszanak”): a beépített betű neve halkan a szó mellett — mindkét szélességen
  const nev = BEEPITETT.find((b) => b.kulcs === kulcs)?.nev;
  return <><span className={`${osztaly} kb-${kulcs}`}>{szo}</span>{nev ? <span className="r16a-betu-nev"> · {nev}</span> : null}</>;
}

/** „Cím: {nev}” — a felirat mintájába a {nev} helyére a saját betűjével írt szó kerül (a szó elé/után álló szöveg a feliraté). */
function Betu({ minta, szo }: { minta: string; szo: ReactNode }) {
  const i = minta.indexOf("{nev}");
  if (i < 0) return <>{minta} {szo}</>;
  return <>{minta.slice(0, i)}{szo}{minta.slice(i + 5)}</>;
}
