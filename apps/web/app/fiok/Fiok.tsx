"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HANGNEM_LEIRAS_MAX, SzervezetProfil, TARTALOMNYELVEK, type MezoForras, type SzervezetReszletek, type Tartalomnyelv } from "@rogton/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { FelsoSav } from "../_kozos/FelsoSav";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { MentesAllapot, hivas, nyelvNev } from "../_kozos/kliens";
import { FoGomb, HalkGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import "../_kozos/r15-lapok.css";
import "./r15-szervezet.css";
// R-16 K7 (TERV §2-K7, gepezet 11, kerdesek 1 — Csilla igenje): a „Vizuális arculat — tervezet” doboz (ArculatBlokk + ArculatAnyagok)
// beolvadt a „Logó, színek, betűk” szakaszba (/fiok/arculat, 12a–12g). Itt csak egy belépő sor maradt; a képvilág / követendő /
// kerülendő / lekerekítés a 12c „Részletek” mögött él (K3), a kézikönyv / referenciák / dokumentumok a 12c „Fájlok” sora (K3),
// a logók a 12f (K1). Az ArculatBlokk.tsx nyugdíjban, hivatkozás nélkül a fában (a törlés Csilla kattintása).

// R-18 8. kör (Kati 10-13: „az alapadatok egy része nem javítható”): a honlap és a Facebook- / Instagram-oldal eddig csak az első beállításban
// volt megadható (a 7. kör óta a profilban él) — most az Alapadatok között is átírható (a /api/profil/kinalat végponton, mint a kínálat).
type Mezo = "nev" | "tevekenyseg" | "honlap" | "kozossegi" | "celkozonseg" | "cel" | "nyelvek" | "hangnem";
const MEZOK: Mezo[] = ["nev", "tevekenyseg", "honlap", "kozossegi", "celkozonseg", "cel", "nyelvek", "hangnem"];
/** A teljes szélességű kártyák (a mockup: tevékenység és hangnem). */
const SZELES: ReadonlySet<Mezo> = new Set<Mezo>(["tevekenyseg", "hangnem"]);
/** Az első beállítással azonos: három nyelv látszik, a többi a „+ más nyelv" mögött. */
const NYELV_ELSO_HAROM: Tartalomnyelv[] = ["hu", "ro", "en"];
/** A hangnem leírásának felső határa — a kiszolgáló is ezt kényszeríti (ProfilModositas). */
const HANGNEM_MAX = HANGNEM_LEIRAS_MAX;
type Allapot = "csend" | "folyik" | "kesz" | "hiba";

// R-7c 10. artboard: Szervezet adatai — három szakasz (Alapadatok · Tartalmak stílusa · Arculat), oldalsáv nélkül,
// egységes adatlap --lista-max szélességgel. A gépezet (végpontok, adatok) az E-10-é maradt.
export function Fiok({ kezdoProfil, szervezet, fiokId, fiokNev, fiokEmail, szerkesztheto, sav }: { kezdoProfil: SzervezetProfil; szervezet: SzervezetReszletek; fiokId: string; fiokNev: string; fiokEmail: string; szerkesztheto: boolean; sav: FelsoSavAdat }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const [profil, setProfil] = useState<SzervezetProfil>(kezdoProfil);
  const [allapot, setAllapot] = useState<Allapot>("csend");
  const [mentveEkkor, setMentveEkkor] = useState<Date | null>(null);
  const utolsoResz = useRef<Record<string, unknown> | null>(null);
  const [szerkesztett, setSzerkesztett] = useState<Mezo | "">("");
  const [szerkErtek, setSzerkErtek] = useState("");
  // 2026-09-21: a nyelvek kockákkal (mint az első beállításon), a hangnemhez a minta mondat is szerkeszthető,
  // és a mentés hibája a mező alatt látszik — eddig a szabad szöveg csendben üres listát mentett.
  const [szerkNyelvek, setSzerkNyelvek] = useState<Tartalomnyelv[]>([]);
  const [tobbNyelv, setTobbNyelv] = useState(false);
  const [szerkMinta, setSzerkMinta] = useState("");
  const [mezoHiba, setMezoHiba] = useState("");
  const [reszlet, setReszlet] = useState<Mezo | "">("");

  /** Egy vagy több mező mentése a hiteles profilba; a kiszolgáló válasza a friss profil. */
  async function ment(resz: Record<string, unknown>): Promise<boolean> {
    if (!szerkesztheto) { setAllapot("hiba"); return false; } // B-01: második zár a kiszolgálói mellé
    setAllapot("folyik"); utolsoResz.current = resz;
    const r = await hivas("/api/profil", "PUT", resz);
    if (r.statusz === 401) { router.push("/belepes"); return false; }
    const e = SzervezetProfil.safeParse(r.torzs["profil"]);
    if (r.statusz !== 200 || !e.success) { setAllapot("hiba"); return false; }
    setProfil(e.data); setAllapot("kesz"); setMentveEkkor(new Date());
    return true;
  }

  // --- a mezők (mint a 3. lépésen) ---
  const p = profil;
  function ertek(m: Mezo): string {
    switch (m) {
      case "nev": return p.nev;
      case "tevekenyseg": return p.osszefoglalo;
      case "honlap": return p.honlap ?? "";
      case "kozossegi": return p.kozossegi_oldal ?? "";
      case "celkozonseg": return p.celkozonseg;
      case "cel": return p.cel;
      case "nyelvek": return p.nyelvek.map((kod) => nyelvNev(kod, nyelv)).join(", ");
      case "hangnem": return p.hangnem_leiras && p.hangnem_minta ? `${p.hangnem_leiras} — „${p.hangnem_minta}”` : p.hangnem_leiras;
    }
  }
  function forras(m: Mezo): { forras: MezoForras; modositva: boolean } {
    switch (m) {
      case "nev": return { forras: "sajat", modositva: false };
      case "tevekenyseg": return { forras: p.osszefoglalo_forras, modositva: p.osszefoglalo_modositva };
      case "honlap": case "kozossegi": return { forras: "sajat", modositva: false };
      case "celkozonseg": return { forras: p.celkozonseg_forras, modositva: p.celkozonseg_modositva };
      case "cel": return { forras: p.cel_forras, modositva: p.cel_modositva };
      case "nyelvek": return { forras: p.nyelvek_forras, modositva: false };
      case "hangnem": return { forras: p.hangnem_forras, modositva: p.hangnem_modositva };
    }
  }
  function ures(m: Mezo): boolean { return m === "nyelvek" ? p.nyelvek.length === 0 : !ertek(m).trim(); }
  function jelvenySzoveg(m: Mezo): string {
    const f = forras(m);
    const src: MezoForras = ures(m) ? "" : f.forras;
    return src === "" ? t("jelveny.ures") : t(`jelveny.${src}`) + (f.modositva && src !== "sajat" ? t("jelveny.modositva") : "");
  }
  function reszletSzoveg(m: Mezo): string {
    const f = forras(m);
    if (!f.forras || ures(m)) return t("onboarding3.eredet_ures");
    const src = f.forras === "sajat" ? t("onboarding3.eredet_sajat") : f.forras === "weboldal" ? t("onboarding3.eredet_weboldal") : t("onboarding3.eredet_ai");
    const ed = f.forras === "sajat" || f.modositva ? t("onboarding3.eredet_te") : t("onboarding3.eredet_az_ai");
    return t("onboarding3.eredet_sablon", { src, ed });
  }
  function szerkesztesKezd(m: Mezo) {
    setSzerkesztett(m);
    setSzerkErtek(m === "hangnem" ? p.hangnem_leiras : ertek(m));
    setSzerkNyelvek(p.nyelvek);
    setTobbNyelv(p.nyelvek.some((kod) => !NYELV_ELSO_HAROM.includes(kod)));
    setSzerkMinta(p.hangnem_minta);
    setMezoHiba("");
    setReszlet("");
  }
  function nyelvValt(kod: Tartalomnyelv) {
    setMezoHiba("");
    setSzerkNyelvek((regi) => (regi.includes(kod) ? regi.filter((x) => x !== kod) : [...regi, kod]));
  }
  function szerkesztesZar() {
    setSzerkesztett("");
    setSzerkErtek("");
    setMezoHiba("");
  }
  async function szerkesztesMent() {
    const v = szerkErtek.trim();
    let resz: Record<string, unknown>;
    switch (szerkesztett) {
      case "nev": resz = { nev: v }; break;
      case "tevekenyseg": resz = { osszefoglalo: v }; break;
      case "honlap": case "kozossegi": {
        // a kínálat végpontja (szerkesztő is menthet); a válasz a friss profilt nem adja — helyben frissítjük
        setAllapot("folyik");
        const r = await hivas("/api/profil/kinalat", "PUT", szerkesztett === "honlap" ? { honlap: v } : { kozossegi_oldal: v });
        if (r.statusz !== 200) { setAllapot("hiba"); setMezoHiba(t("fiok.mentes_nem_sikerult")); return; }
        setProfil((x) => (szerkesztett === "honlap" ? { ...x, honlap: v } : { ...x, kozossegi_oldal: v }));
        setAllapot("kesz"); setMentveEkkor(new Date()); szerkesztesZar();
        return;
      }
      case "celkozonseg": resz = { celkozonseg: v }; break;
      case "cel": resz = { cel: v }; break;
      case "nyelvek": {
        if (szerkNyelvek.length === 0) { setMezoHiba(t("fiok.nyelv_legalabb_egy")); return; }
        resz = { nyelvek: TARTALOMNYELVEK.filter((kod) => szerkNyelvek.includes(kod)) as Tartalomnyelv[] };
        break;
      }
      case "hangnem": {
        if (v.length > HANGNEM_MAX) { setMezoHiba(t("fiok.hangnem_tul_hosszu", { max: HANGNEM_MAX })); return; }
        resz = { hangnem_leiras: v, hangnem_minta: szerkMinta.trim() };
        break;
      }
      default: return;
    }
    if (await ment(resz)) szerkesztesZar();
    else setMezoHiba(t("fiok.mentes_nem_sikerult"));
  }

  // R-16 K7: az arculat itt már nem szerkeszthető — az egész arculatot 800 ms után visszaíró PUT (`arculatValtozik`) megszűnt.
  // Az R2 őr (elavult teljes-arculat írás → 409 ELAVULT_ADAT) a végponton marad, bárki hívná.

  // R-15 c5 2. kör (design/R15/rajz/R15-lapok-5.dc.html 12a · 12b; gepezet-5 3; kerdesek-5 5–6, Csilla 10-10 18:08):
  // egy nyugodt lista két csoportban (keretes kártyák helyett, T6); a forrás-jelvények és az eredet-panel lekerültek (T3/T6) — a forrás
  // egy mondatban a szerkesztőben látszik; „Átírom” / „Megadom” = a mai szerkesztő (csak a tulajdonosnak); telefonon az egész sor nyitja (›).
  // A lap fő gombja „Logó és színek” (→ /fiok/arculat); szerkesztés közben a „Mentés” a fő gomb, a másik halk.
  // A lábjegyzet egy rövid sorként marad (Q6 módosítva): „Az AI javaslata nem tény.”
  function honnanSzoveg(m: Mezo): string {
    if (ures(m)) return "";
    const f = forras(m).forras;
    return f === "sajat" ? t("r15.sz.honnan_sajat") : f === "weboldal" ? t("r15.sz.honnan_weboldal") : f === "ai" ? t("r15.sz.honnan_gep") : "";
  }
  function mezoSor(m: Mezo) {
    const u = ures(m);
    const cimke = t(`mezo.${m}`);
    const nyitva = szerkesztett === m;
    const gombSzoveg = u ? t("r15.sz.megadom") : t("r15.mit.atirom");
    const szerkGomb = szerkesztheto && !szerkesztett ? (
      <>
        <span className="r15-csak-asztal"><HalkLink onClick={() => szerkesztesKezd(m)}>{gombSzoveg}</HalkLink></span>
        <button type="button" className="r15sz-chev r15-csak-tel" aria-label={`${cimke} — ${gombSzoveg}`} onClick={() => szerkesztesKezd(m)}><span aria-hidden="true">›</span></button>
      </>
    ) : null;
    return (
      <div key={m} id={`km-fp-mezo-${m}`} className="r15sz-sor" data-nyitva={nyitva ? "true" : "false"}>
        <div className="r15sz-fej">
          <span className="r15sz-cimke">{cimke}</span>
          {szerkGomb}
        </div>
        {!nyitva ? (
          u ? <span className="r15sz-ures">{t("onboarding3.kesobb")}</span> : <div className="r15sz-ertek" data-r15="eredmeny">{ertek(m)}</div>
        ) : (
          <>
            {m === "nyelvek" ? (
              <div className="km-eb-kockak" role="group" aria-label={cimke}>
                {TARTALOMNYELVEK.filter((kod) => tobbNyelv || NYELV_ELSO_HAROM.includes(kod) || szerkNyelvek.includes(kod)).map((kod) => {
                  const jelolt = szerkNyelvek.includes(kod);
                  return (
                    <button key={kod} type="button" className="km-eb-kocka" aria-pressed={jelolt} onClick={() => nyelvValt(kod)}>
                      {jelolt ? "✓ " : ""}{nyelvNev(kod, nyelv)}
                    </button>
                  );
                })}
                {!tobbNyelv ? (
                  <button type="button" className="km-eb-kocka" data-javaslat="true" onClick={() => setTobbNyelv(true)}>{t("onboarding.eb_mas_nyelv")}</button>
                ) : null}
              </div>
            ) : m === "hangnem" ? (
              <>
                <label className="km-fp-szerk-cimke">
                  <span>{t("fiok.hangnem_leiras_cimke")}</span>
                  <textarea data-r15="eredmeny" className="km-ob-sor-szerk km-fp-szerk" rows={2} value={szerkErtek} onChange={(e) => { setSzerkErtek(e.target.value); setMezoHiba(""); }} />
                  <span className="km-fp-szerk-szamlalo" data-tul={szerkErtek.trim().length > HANGNEM_MAX ? "true" : "false"}>{t("fiok.hangnem_hossz", { n: szerkErtek.trim().length, max: HANGNEM_MAX })}</span>
                </label>
                <label className="km-fp-szerk-cimke">
                  <span>{t("fiok.hangnem_minta_cimke")}</span>
                  <textarea data-r15="eredmeny" className="km-ob-sor-szerk km-fp-szerk" rows={3} value={szerkMinta} onChange={(e) => setSzerkMinta(e.target.value)} />
                </label>
              </>
            ) : m === "honlap" || m === "kozossegi" ? (
              <input className="r18p-input" inputMode="url" maxLength={m === "honlap" ? 500 : 300} placeholder={m === "honlap" ? "https://…" : "facebook.com/…"} aria-label={cimke} value={szerkErtek} onChange={(e) => { setSzerkErtek(e.target.value); setMezoHiba(""); }} />
            ) : (
              <textarea data-r15="eredmeny" className="km-ob-sor-szerk km-fp-szerk" rows={3} aria-label={cimke} value={szerkErtek} onChange={(e) => { setSzerkErtek(e.target.value); setMezoHiba(""); }} />
            )}
            {honnanSzoveg(m) ? <Info>{honnanSzoveg(m)}</Info> : null}
            {mezoHiba ? <p className="km-fp-szerk-hiba" role="alert">{mezoHiba}</p> : null}
            <div className="r15sz-gombok">
              <span className="r15-csak-asztal"><FoGomb disabled={allapot === "folyik"} onClick={() => void szerkesztesMent()}>{t("onboarding3.mentes")}</FoGomb></span>
              <HalkLink onClick={szerkesztesZar}>{t("onboarding3.megse")}</HalkLink>
            </div>
            <Info>{t("fiok.mentes_kovetkezmeny")}</Info>
          </>
        )}
      </div>
    );
  }

  // telefonon szerkesztés közben csak a szerkesztett mező csoportja látszik (rajz 12b telefon), a Mentés az alsó sávban (T10)
  const csoport = (cim: string, mezok: Mezo[]) => (
    <section className={szerkesztett && !mezok.includes(szerkesztett) ? "r15sz-csoport r15-csak-asztal" : "r15sz-csoport"} aria-label={cim}>
      <h2 className="r15sz-csoport-cim">{cim}</h2>
      {mezok.map((m) => mezoSor(m))}
    </section>
  );
  const jovahagyva = <Info>{t("fiok.jovahagyva_datum", { datum: datum(p.jovahagyva, nyelv, "nap") })}</Info>;
  const arculatGomb = szerkesztett ? <HalkGomb href="/fiok/arculat">{t("r15.sz.arculat_gomb")}</HalkGomb> : <FoGomb href="/fiok/arculat">{t("r15.sz.arculat_gomb")}</FoGomb>;

  return (
    <div className="km-fp-lap r15-keretes r15sz-keret">
      <FelsoSav adat={sav} aktiv="ugyfelprofil" />
      <div className="km-tartalom">
        <main className="km-lap-keret km-fp-fo r15-lap r15sz-lap">
          <div className="r15-lap-belso r15sz-belso">
            <div className="r15sz-cimsor">
              {szerkesztheto ? <KerdesCim cim={t("r15.sz.kerdes")} alcim={t("r15.sz.alcim")} {...(szerkesztett ? { alcimOsztaly: "r15-csak-asztal" } : {})} /> : <KerdesCim cim={t("r15.sz.kerdes")} />}
              <MentesAllapot allapot={allapot} mentveEkkor={mentveEkkor} ujra={() => { if (utolsoResz.current) void ment(utolsoResz.current); }} />
            </div>
            {!szerkesztheto ? <Info>{t("fiok.csak_tulajdonos")}</Info> : null}
            <div className="r15sz-gombsor r15-csak-asztal">{arculatGomb}{szerkesztett ? null : jovahagyva}</div>
            {szerkesztett ? <span className="r15-csak-asztal">{jovahagyva}</span> : null}
            <div className="r15sz-lista">
              {csoport(t("fiok.alapadatok"), ["nev", "tevekenyseg", "honlap", "kozossegi"])}
              {csoport(t("fiok.tartalmak_stilusa"), ["celkozonseg", "cel", "nyelvek", "hangnem"])}
              {/* R-18 6. kör (Kati D): a hivatalos nevek innen is elérhetők (a lista a /fiok/nevek lapon szerkeszthető) */}
              {/* R-18 7. kör: a kínálat és árak (+ tématerv) a /fiok/kinalat lapon szerkeszthető */}
              {/* c30 F6 (rajz D9a): fesztiválnál a „Programod” áll a „Kínálat és árak” helyén (plan §2: festival → Programod, company → Kínálat) */}
              {p.szervezet_tipus === "fesztival" ? (
                <section className={szerkesztett ? "r15sz-csoport r15-csak-asztal" : "r15sz-csoport"} aria-label={t("c30.prog.oldal_cim")}>
                  <h2 className="r15sz-csoport-cim">{t("c30.prog.oldal_cim")}</h2>
                  <div className="r18f-nevek-sor"><Info>{t("c30.prog.szakasz_info")}</Info><HalkLink href="/fiok/program">{t("c30.prog.oldal_cim")} ›</HalkLink></div>
                </section>
              ) : (
              <section className={szerkesztett ? "r15sz-csoport r15-csak-asztal" : "r15sz-csoport"} aria-label={t("szerv.kinalat")}>
                <h2 className="r15sz-csoport-cim">{t("szerv.kinalat")}</h2>
                <div className="r18f-nevek-sor"><Info>{t("szerv.kinalat_alcim")}</Info><HalkLink href="/fiok/kinalat">{t("szerv.kinalat_link", { n: (p.kinalat ?? []).filter((k) => k.aktiv).length })}</HalkLink></div>
              </section>
              )}
              <section className={szerkesztett ? "r15sz-csoport r15-csak-asztal" : "r15sz-csoport"} aria-label={t("nevek.cim")}>
                <h2 className="r15sz-csoport-cim">{t("nevek.cim")}</h2>
                <div className="r18f-nevek-sor"><Info>{t("nevek.szakasz")}</Info><HalkLink href="/fiok/nevek">{t("nevek.link", { n: p.hivatalos_nevek?.length ?? 0 })}</HalkLink></div>
              </section>
              <Info osztaly="r15sz-lab">{t("r15.sz.ai_nem_teny")}</Info>
              <span className="r15-csak-tel">{jovahagyva}</span>
            </div>
          </div>
          <div className="r15-also-sav">
            {szerkesztett ? <FoGomb disabled={allapot === "folyik"} onClick={() => void szerkesztesMent()}>{t("onboarding3.mentes")}</FoGomb> : <FoGomb href="/fiok/arculat">{t("r15.sz.arculat_gomb")}</FoGomb>}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Dátum a felület nyelvén: „rovid” = rövid hónapnév + idő (a fejléc), „nap” = teljes dátum idő nélkül (létrehozva). */
function datum(iso: string, nyelv: string, alak: "rovid" | "nap"): string {
  try {
    // az időzóna kimondva: a kiszolgáló (UTC-s doboz) és a böngésző különben más szöveget ad → 418-as hidratálási hiba (a teszten mérve, F-2d)
    return new Intl.DateTimeFormat(nyelv, alak === "rovid" ? { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" } : { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(new Date(iso));
  } catch { return iso; }
}
