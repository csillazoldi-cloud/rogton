"use client";
import type { FelsoSavAdat } from "../../../kezdolap/tipusok";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeliratok } from "../../../nyelv/kliens";
import { HirfigyeloKeret } from "../_kozos/HirfigyeloKeret";
import { hfKeres, idoRovid, forrasNev, varjSor, type SorTetel } from "../_kozos/kliens";
import type { Beallitas, BeallitasVerzio, SzabalyJavaslat, Visszajelzes, Minta, FinomhangolasTetel } from "@km/news-monitor-core";

type FinomhangolasAdat = {
  minta: Minta | null;
  mintaLejart: boolean;
  tetelek: FinomhangolasTetel[];
  visszajelzesek: Visszajelzes[];
  javaslatok: SzabalyJavaslat[];
  verziok: BeallitasVerzio[];
};

type JavaslatAllapot = "nincs" | "keszul" | "kesz" | "hiba" | "kiprobal" | "osszehasonlit" | "elfogadva" | "elvetve";

type ForrasSor = { id: string; cim: string; allapot?: string };

export function Finomhangolas({ profilNev, szerep, sav }: { profilNev: string; szerep: string; sav: FelsoSavAdat }) {
  const { t, nyelv } = useFeliratok();
  const [adat, setAdat] = useState<FinomhangolasAdat | null>(null);
  const [hiba, setHiba] = useState<string | null>(null);
  const [okValaszto, setOkValaszto] = useState<string | null>(null);
  const [javaslatAllapot, setJavaslatAllapot] = useState<JavaslatAllapot>("nincs");
  const [javaslatHiba, setJavaslatHiba] = useState<string | null>(null);
  const [osszehasonlitas, setOsszehasonlitas] = useState<{ talalat_id: string; valtozas: "elorebb" | "hatrebb" | "valtozatlan" }[] | null>(null);
  const [elfogadvaVerzio, setElfogadvaVerzio] = useState<number | null>(null);
  const [elvetve, setElvetve] = useState(false);
  const [vanForras, setVanForras] = useState<boolean | null>(null);
  const [probaFut, setProbaFut] = useState(false);
  const [probaHiba, setProbaHiba] = useState<string | null>(null);
  const javaslatDobozRef = useRef<HTMLDivElement | null>(null);

  const betolt = useCallback(async () => {
    const v = await hfKeres<FinomhangolasAdat>("/api/hirfigyelo/finomhangolas");
    if (v.statusz === 401) { window.location.href = "/belepes"; return; }
    if (v.statusz === 200) { setAdat(v.torzs); setHiba(null); return; }
    setHiba(v.hiba ?? "HALOZAT");
  }, []);

  useEffect(() => { betolt(); }, [betolt]);

  // Forrás-létezés egyszeri ellenőrzése az üres állapothoz (a FinomhangolasAdat nem hordozza)
  useEffect(() => {
    if (!adat) return;
    if (adat.minta || adat.visszajelzesek.length > 0) return;
    if (vanForras !== null) return;
    (async () => {
      const v = await hfKeres<{ forrasok: ForrasSor[] }>("/api/hirfigyelo/forrasok");
      if (v.statusz === 200) {
        setVanForras((v.torzs.forrasok ?? []).length > 0);
      } else {
        setVanForras(false);
      }
    })();
  }, [adat, vanForras]);

  const aktivVerzio = useMemo(() => adat?.verziok.find((v) => v.allapot === "aktiv")?.verzio ?? 0, [adat]);
  const aktivBeallitas = useMemo(() => adat?.verziok.find((v) => v.allapot === "aktiv")?.beallitas ?? null, [adat]);

  const lathatoJavaslat = useMemo(() => {
    if (!adat) return null;
    return adat.javaslatok
      .filter((j) => (j.allapot === "fuggo" || j.allapot === "kiprobalt") && j.szabaly_verzio === aktivVerzio)
      .sort((a, b) => new Date(b.letrehozva).getTime() - new Date(a.letrehozva).getTime())[0] ?? null;
  }, [adat, aktivVerzio]);

  const felhasznaltVisszajelzesIds = useMemo(() => {
    if (!adat) return new Set<string>();
    return new Set(adat.javaslatok.flatMap((j) => j.mi_alapjan));
  }, [adat]);

  const ujVisszajelzesSzam = useMemo(() => {
    if (!adat) return 0;
    return adat.visszajelzesek.filter((v) => !felhasznaltVisszajelzesIds.has(v.id)).length;
  }, [adat, felhasznaltVisszajelzesIds]);

  // Automatikus javaslatkérés (a prototípus: ≥ 2 visszajelzés után jön a javaslat) — egyszerre egy kérés, a ref őrzi
  const javaslatKeresFolyik = useRef(false);
  useEffect(() => {
    if (!adat || lathatoJavaslat || javaslatKeresFolyik.current || javaslatAllapot === "hiba" || ujVisszajelzesSzam < 2) return;
    javaslatKeresFolyik.current = true;
    setJavaslatAllapot("keszul");
    (async () => {
      const v = await hfKeres<{ javaslat: SzabalyJavaslat }>("/api/hirfigyelo/javaslat", "POST", {});
      if (v.statusz === 200) {
        setJavaslatAllapot("kesz");
        await betolt();
      } else {
        setJavaslatAllapot("hiba");
        setJavaslatHiba(v.hiba ?? "HALOZAT");
      }
      javaslatKeresFolyik.current = false;
    })();
  }, [adat, lathatoJavaslat, javaslatAllapot, ujVisszajelzesSzam, betolt]);

  const legutolsoVisszajelzes = useCallback((talalatId: string): Visszajelzes | null => {
    if (!adat) return null;
    return adat.visszajelzesek
      .filter((v) => v.talalat_id === talalatId)
      .sort((a, b) => new Date(b.letrehozva).getTime() - new Date(a.letrehozva).getTime())[0] ?? null;
  }, [adat]);

  const visszajelzesKuld = useCallback(async (talalatId: string, fajta: "fontos" | "nem_relevans", okok: string[] = []) => {
    const v = await hfKeres<{ visszajelzes: Visszajelzes }>("/api/hirfigyelo/visszajelzes", "POST", { talalat_id: talalatId, fajta, okok, sajat_indok: "" });
    if (v.statusz === 200) { await betolt(); return true; }
    return false;
  }, [betolt]);

  const markYes = useCallback(async (talalatId: string) => {
    if (szerep === "nezo") return;
    await visszajelzesKuld(talalatId, "fontos");
    setOkValaszto(null);
  }, [szerep, visszajelzesKuld]);

  // A negatív jelölés AZONNAL rögzül ok nélkül (üres okok), és megnyílik az ok-választó
  const markNo = useCallback(async (talalatId: string) => {
    if (szerep === "nezo") return;
    await visszajelzesKuld(talalatId, "nem_relevans", []);
    setOkValaszto(talalatId);
  }, [szerep, visszajelzesKuld]);

  // Az ok választása MÁSODIK küldés (frissíti a visszajelzést); az ok kihagyható
  const okValaszt = useCallback(async (talalatId: string, ok: string) => {
    if (szerep === "nezo") return;
    await visszajelzesKuld(talalatId, "nem_relevans", [ok]);
    setOkValaszto(null);
  }, [szerep, visszajelzesKuld]);

  const kiprobal = useCallback(async () => {
    if (!lathatoJavaslat) return;
    setJavaslatAllapot("kiprobal");
    // A kipróbálás a háttérben megy (E-22 sor): 202 + tétel, az eredmény a tétel `eredmeny`-ében
    const v = await hfKeres<{ sor: SorTetel }>(`/api/hirfigyelo/javaslat/${lathatoJavaslat.id}/kiprobal`, "POST", {});
    type Ossze = { talalat_id: string; valtozas: "elorebb" | "hatrebb" | "valtozatlan" }[];
    if (v.statusz === 202 && v.torzs.sor) {
      const sor = await varjSor(v.torzs.sor.id);
      const eredmeny = (sor?.eredmeny ?? null) as { osszehasonlitas?: Ossze } | null;
      if (sor?.allapot === "kesz" && eredmeny?.osszehasonlitas) {
        setOsszehasonlitas(eredmeny.osszehasonlitas);
        setJavaslatAllapot("osszehasonlit");
        setJavaslatHiba(null);
      } else {
        setJavaslatHiba(sor?.hibaOk === "MINTA_LEJART" ? "MINTA_LEJART" : (sor?.hibaOk ?? "HALOZAT"));
        setJavaslatAllapot("kesz");
      }
    } else if (v.statusz === 409 && v.hiba === "MINTA_LEJART") {
      setJavaslatHiba("MINTA_LEJART");
      setJavaslatAllapot("kesz");
    } else {
      setJavaslatHiba(v.hiba ?? "HALOZAT");
      setJavaslatAllapot("kesz");
    }
  }, [lathatoJavaslat]);

  const dontes = useCallback(async (dontes: "elfogad" | "elvet") => {
    if (!lathatoJavaslat) return;
    const v = await hfKeres<{ javaslat: SzabalyJavaslat; ujVerzio?: BeallitasVerzio | null }>(`/api/hirfigyelo/javaslat/${lathatoJavaslat.id}/dont`, "POST", { dontes });
    if (v.statusz === 200) {
      if (dontes === "elfogad") {
        setElfogadvaVerzio(v.torzs.ujVerzio?.verzio ?? null);
        setJavaslatAllapot("elfogadva");
      } else {
        setElvetve(true);
        setJavaslatAllapot("elvetve");
      }
      await betolt();
    } else {
      setJavaslatHiba(v.hiba ?? "HALOZAT");
    }
  }, [lathatoJavaslat, betolt]);

  const visszaallit = useCallback(async (verzio: number) => {
    const v = await hfKeres("/api/hirfigyelo/beallitas/visszaallit", "POST", { verzio });
    if (v.statusz === 200) {
      // a prototípus: visszaállítás után a javaslat állapota alaphelyzetbe (új javaslat jöhet az új aktív verzióra)
      setJavaslatAllapot("nincs");
      setElfogadvaVerzio(null);
      setElvetve(false);
      await betolt();
    }
  }, [betolt]);

  // Újrapróbálás: az effect kizárását megkerüli — a gomb „nincs”-re állítja és közvetlenül indítja a kérést
  const javaslatUjra = useCallback(async () => {
    if (javaslatKeresFolyik.current) return;
    javaslatKeresFolyik.current = true;
    setJavaslatAllapot("keszul");
    setJavaslatHiba(null);
    const v = await hfKeres<{ javaslat: SzabalyJavaslat }>("/api/hirfigyelo/javaslat", "POST", {});
    if (v.statusz === 200) {
      setJavaslatAllapot("kesz");
      await betolt();
    } else {
      setJavaslatAllapot("hiba");
      setJavaslatHiba(v.hiba ?? "HALOZAT");
    }
    javaslatKeresFolyik.current = false;
  }, [betolt]);

  // Helyi próbafutás indítása (a Beallitas lap mintája szerint)
  const probaIndit = useCallback(async () => {
    if (szerep === "nezo" || probaFut) return;
    setProbaFut(true);
    setProbaHiba(null);
    const v = await hfKeres<{ sor: SorTetel }>("/api/hirfigyelo/futas", "POST", { proba: true });
    if (v.statusz === 202 && v.torzs.sor) {
      const sor = await varjSor(v.torzs.sor.id);
      if (sor?.allapot === "kesz") {
        await betolt();
      } else {
        setProbaHiba(sor?.hibaOk ?? "HALOZAT");
      }
    } else {
      setProbaHiba(v.hiba ?? "HALOZAT");
    }
    setProbaFut(false);
  }, [szerep, probaFut, betolt]);

  const ugrasJavaslathoz = useCallback(() => {
    javaslatDobozRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const tuneEmpty = useMemo(() => adat && !adat.minta && adat.visszajelzesek.length === 0, [adat]);
  const tuneHasContent = useMemo(() => adat && (!!adat.minta || adat.visszajelzesek.length > 0), [adat]);

  // A javaslat doboza csak KÉSZ javaslattal látszik (a prototípus sugVisible-je); a készülés/hiba külön, keret nélküli üzenet (hibaút)
  const sugVisible = useMemo(() => !!lathatoJavaslat, [lathatoJavaslat]);

  const sugCurrentText = useMemo(() => {
    if (!aktivBeallitas) return t("hf.nincs");
    const temak = aktivBeallitas.temak?.map((x) => x.nev).join(", ") ?? "";
    const kizarasok = aktivBeallitas.kizarasok?.join(", ") ?? "";
    return t("hf.sugTemak", { temak: temak || t("hf.nincs"), kizarasok: kizarasok || t("hf.nincs") });
  }, [aktivBeallitas, t]);

  const sugProposedText = useMemo(() => {
    if (!lathatoJavaslat || !aktivBeallitas) return "";
    const javasolt = lathatoJavaslat.javasolt;
    const pluszTemak = (javasolt.temak ?? []).filter((x) => !(aktivBeallitas.temak ?? []).some((y) => y.nev === x.nev)).map((x) => x.nev);
    const minuszTemak = (aktivBeallitas.temak ?? []).filter((x) => !(javasolt.temak ?? []).some((y) => y.nev === x.nev)).map((x) => x.nev);
    const pluszKiz = (javasolt.kizarasok ?? []).filter((x) => !(aktivBeallitas.kizarasok ?? []).includes(x));
    const minuszKiz = (aktivBeallitas.kizarasok ?? []).filter((x) => !(javasolt.kizarasok ?? []).includes(x));
    const reszek: string[] = [lathatoJavaslat.indoklas];
    if (pluszTemak.length) reszek.push("+ " + pluszTemak.join(", "));
    if (pluszKiz.length) reszek.push("+ kizárás: " + pluszKiz.join(", "));
    if (minuszTemak.length) reszek.push("− " + minuszTemak.join(", "));
    if (minuszKiz.length) reszek.push("− kizárás: " + minuszKiz.join(", "));
    return reszek.join("\n");
  }, [lathatoJavaslat, aktivBeallitas]);

  const sugBasisText = useMemo(() => {
    if (!lathatoJavaslat || !adat) return "";
    const alapjan = adat.visszajelzesek.filter((v) => lathatoJavaslat.mi_alapjan.includes(v.id));
    const nem = alapjan.filter((v) => v.fajta === "nem_relevans").length;
    const fontos = alapjan.filter((v) => v.fajta === "fontos").length;
    return t("hf.sugBasisSor", { nem: String(nem), fontos: String(fontos) });
  }, [lathatoJavaslat, adat, t]);

  const cmpRows = useMemo(() => {
    if (!osszehasonlitas || !adat) return [];
    return osszehasonlitas.map((c) => {
      const tetel = adat.tetelek.find((x) => x.talalat_id === c.talalat_id);
      return {
        title: tetel?.cim ?? c.talalat_id,
        deltaLabel: c.valtozas === "elorebb" ? "↑ " + t("hf.cmpKept") : c.valtozas === "hatrebb" ? t("hf.cmpDown") : t("hf.cmpSame"),
        deltaFajta: c.valtozas,
      };
    });
  }, [osszehasonlitas, adat, t]);

  const fontossagJelveny = useCallback((fontossag: string | null) => {
    if (!fontossag) return { label: "…", fajta: "ertekletlen" };
    if (fontossag === "fontos") return { label: t("hf.impHigh"), fajta: "fontos" };
    if (fontossag === "erdekes") return { label: t("hf.impMed"), fajta: "erdekes" };
    return { label: t("hf.impLow"), fajta: "hatter" };
  }, [t]);

  const kategoriaSzo = useCallback((kategoria: string | null | undefined) => {
    if (!kategoria) return null;
    return t(`hf.kat_${kategoria}`);
  }, [t]);

  if (!adat) {
    return (
      <HirfigyeloKeret aktiv="finomhangolas" profilNev={profilNev} sav={sav}>
        <section data-screen-label="HF-III Finomhangolás" className="km-hf-fh">
          <div className="km-hf-uzenet">{t("hf.betoltes")}</div>
        </section>
      </HirfigyeloKeret>
    );
  }

  if (hiba) {
    return (
      <HirfigyeloKeret aktiv="finomhangolas" profilNev={profilNev} sav={sav}>
        <section data-screen-label="HF-III Finomhangolás" className="km-hf-fh">
          <div className="km-hf-uzenet" data-fajta="hiba">
            {t("hf.betoltes_hiba")}
            <button className="km-hf-uzenet-gomb" onClick={betolt}>{t("hf.ujra")}</button>
          </div>
        </section>
      </HirfigyeloKeret>
    );
  }

  const haladasN = adat.visszajelzesek.length;
  const haladasM = Math.max(0, 2 - haladasN);

  return (
    <HirfigyeloKeret aktiv="finomhangolas" profilNev={profilNev} sav={sav}>
      <section data-screen-label="HF-III Finomhangolás" className="km-hf-fh">
        {szerep === "nezo" && <div className="km-hf-uzenet" data-fajta="figyelem">{t("hf.csakNezo")}</div>}

        <h1 className="km-hf-fh-cim">{t("hf.pontositas_cim")}</h1>
        <p className="km-hf-fh-alcim">{t("hf.pontositas_bevezeto")}</p>

        {tuneEmpty && (
          <div className="km-hf-fh-ures">
            {vanForras === null && <span>{t("hf.betoltes")}</span>}
            {vanForras === true && (
              <>
                <div>{t("hf.pontositas_ures_van_forras")}</div>
                {szerep !== "nezo" && (
                  <button className="km-hf-fh-gomb-fo" disabled={probaFut} onClick={probaIndit}>
                    {probaFut ? t("hf.sugKeszul") : t("hf.proba_inditasa")}
                  </button>
                )}
                {probaHiba && <div className="km-hf-uzenet" data-fajta="hiba">{t("hf.sugHiba")}</div>}
              </>
            )}
            {vanForras === false && (
              <>
                <div>{t("hf.pontositas_ures_nincs_forras")}</div>
                {szerep !== "nezo" && (
                  <a href="/hirfigyelo/beallitas" className="km-hf-fh-link">{t("hf.ures_gomb")} →</a>
                )}
              </>
            )}
          </div>
        )}

        {tuneHasContent && (
          <>
            {adat.mintaLejart && <div className="km-hf-uzenet" data-fajta="figyelem">{t("hf.mintaLejart")}</div>}

            <div className="km-hf-fh-haladas" aria-live="polite">
              <span>{t("hf.pontositas_haladas", { n: String(haladasN), m: String(haladasM) })}</span>
              {(sugVisible || javaslatAllapot === "kesz" || javaslatAllapot === "osszehasonlit") && (
                <button className="km-hf-fh-gomb-szoveg" onClick={ugrasJavaslathoz}>{t("hf.ugras_javaslathoz")}</button>
              )}
            </div>

            <div className="km-hf-fh-tetelek">
              {/* 2026-09-22 (Vilmos): a kiszűrt (háttér) hírek itt sem látszanak — csak a számuk */}
              {adat.tetelek.filter((tetel) => tetel.fontossag !== "hatter").map((tetel) => {
                const fb = legutolsoVisszajelzes(tetel.talalat_id);
                const fbDone = !!fb && (fb.fajta === "fontos" || fb.okok.length > 0);
                const askReason = okValaszto === tetel.talalat_id || (!!fb && fb.fajta === "nem_relevans" && fb.okok.length === 0);
                const imp = fontossagJelveny(tetel.fontossag);
                const kat = kategoriaSzo(tetel.fontossag); // a tétel kategóriája = a fontosság (fontos · érdekes · háttér); a forrás nyelve nincs a tételen (T-38)
                return (
                  <div key={tetel.talalat_id} className="km-hf-fh-tetel">
                    <div className="km-hf-fh-tetel-fej">
                      <span className="km-hf-fh-jelveny" data-fajta={imp.fajta}>{imp.label}</span>
                      <span className="km-hf-fh-meta">{forrasNev(tetel.forras_cim)}</span>
                    </div>
                    <div className="km-hf-fh-tetel-cim">{tetel.cim}</div>
                    <div className="km-hf-fh-tetel-meta">
                      <span>{forrasNev(tetel.forras_cim)}</span>
                      {kat && <span className="km-hf-fh-kat"> · {kat}</span>}
                    </div>
                    <div className="km-hf-fh-gombok">
                      <button className="km-hf-fh-chip" data-be={fb?.fajta === "fontos" ? "true" : "false"} disabled={szerep === "nezo" || adat.mintaLejart} onClick={() => markYes(tetel.talalat_id)}>{t("hf.jelol_fontos")}</button>
                      <button className="km-hf-fh-chip" data-be={fb?.fajta === "nem_relevans" ? "true" : "false"} disabled={szerep === "nezo" || adat.mintaLejart} onClick={() => markNo(tetel.talalat_id)}>{t("hf.jelol_nem_erdekel")}</button>
                      {fbDone && <span className="km-hf-fh-koszonet">{t("hf.fbThanks")}</span>}
                    </div>
                    {askReason && (
                      <div className="km-hf-fh-okok">
                        <div className="km-hf-fh-okok-cim">{t("hf.negativ_ok")}</div>
                        <div className="km-hf-fh-okok-gombok">
                          {[
                            { kulcs: "masik_ceg", felirat: t("hf.ok_nem_rolunk") },
                            { kulcs: "nem_ez_a_tema", felirat: t("hf.ok_mas_terulet") },
                            { kulcs: "ismetlodo", felirat: t("hf.ok_regi") },
                            { kulcs: "tul_altalanos", felirat: t("hf.ok_nem_hasznos") },
                          ].map((ok) => (
                            <button key={ok.kulcs} className="km-hf-fh-chip" data-be={fb?.okok.includes(ok.kulcs as never) ? "true" : "false"} disabled={szerep === "nezo"} onClick={() => okValaszt(tetel.talalat_id, ok.kulcs)}>{ok.felirat}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {adat.tetelek.some((tetel) => tetel.fontossag === "hatter") && (
                <div className="km-hf-at-kiszurt" role="status">
                  {t("hf.kiszurt_pontositas", { n: String(adat.tetelek.filter((tetel) => tetel.fontossag === "hatter").length) })}
                </div>
              )}
            </div>

            {javaslatAllapot === "keszul" && !lathatoJavaslat && (
              <div className="km-hf-uzenet km-hf-fh-porgo-sor" aria-live="polite">
                <span className="km-hf-fh-porgo" aria-hidden="true"></span>{t("hf.sugKeszul")}
              </div>
            )}
            {javaslatAllapot === "hiba" && !lathatoJavaslat && (
              <div className="km-hf-uzenet" data-fajta="figyelem">
                {t("hf.sugHiba")}
                <button className="km-hf-uzenet-gomb" onClick={javaslatUjra}>{t("hf.ujra")}</button>
              </div>
            )}

            {sugVisible && (
              <div className="km-hf-fh-javaslat" ref={javaslatDobozRef}>
                <div className="km-hf-fh-javaslat-cim">✦ {t("hf.uj_beallitas_kesz")}</div>

                {lathatoJavaslat && (
                  <>
                    <div className="km-hf-fh-javaslat-racs">
                      <div>
                        <div className="km-hf-fh-javaslat-cimke">{t("hf.sugCurrent")}</div>
                        <div className="km-hf-fh-javaslat-szoveg-mut">{sugCurrentText}</div>
                      </div>
                      <div>
                        <div className="km-hf-fh-javaslat-cimke">{t("hf.sugProposed")}</div>
                        <div className="km-hf-fh-javaslat-szoveg">{sugProposedText}</div>
                      </div>
                    </div>
                    <div className="km-hf-fh-javaslat-sor"><span className="km-hf-fh-javaslat-eros">{t("hf.sugBasis")}:</span> {sugBasisText}</div>
                    <div className="km-hf-fh-javaslat-sor-koz"><span className="km-hf-fh-javaslat-eros">{t("hf.sugImpact")}:</span> {lathatoJavaslat.varhato_hatas}</div>

                    {javaslatAllapot === "kesz" && (
                      <div className="km-hf-fh-gombok">
                        <button className="km-hf-fh-gomb-ghost" onClick={kiprobal}>{t("hf.javaslat_kiprobal")}</button>
                        <button className="km-hf-fh-gomb-fo" onClick={() => dontes("elfogad")}>{t("hf.javaslat_elfogad")}</button>
                        <button className="km-hf-fh-gomb-szoveg" onClick={() => dontes("elvet")}>{t("hf.javaslat_elvet")}</button>
                      </div>
                    )}

                    {javaslatAllapot === "kiprobal" && (
                      <div className="km-hf-fh-porgo-sor" aria-live="polite">
                        <span className="km-hf-fh-porgo" aria-hidden="true"></span>{t("hf.sugTrying")}
                      </div>
                    )}

                    {javaslatAllapot === "osszehasonlit" && osszehasonlitas && (
                      <div className="km-hf-fh-osszehasonlitas">
                        <div className="km-hf-fh-osszehasonlitas-cim">
                          {t("hf.cmpTitle")} — {t("hf.cmpOld", { v: String(aktivVerzio) })} vs. {t("hf.cmpNew")}
                        </div>
                        <div className="km-hf-fh-osszehasonlitas-sorok">
                          {cmpRows.map((c) => (
                            <div key={c.title} className="km-hf-fh-osszehasonlitas-sor">
                              <span className="km-hf-fh-osszehasonlitas-cim">{c.title}</span>
                              <span className="km-hf-fh-osszehasonlitas-jel" data-fajta={c.deltaFajta}>{c.deltaLabel}</span>
                            </div>
                          ))}
                        </div>
                        <div className="km-hf-fh-osszehasonlitas-megj">{t("hf.cmpCaveat")}</div>
                        <div className="km-hf-fh-gombok">
                          <button className="km-hf-fh-gomb-fo" onClick={() => dontes("elfogad")}>{t("hf.javaslat_elfogad")}</button>
                          <button className="km-hf-fh-gomb-szoveg" onClick={() => dontes("elvet")}>{t("hf.javaslat_elvet")}</button>
                        </div>
                      </div>
                    )}

                    {javaslatHiba === "MINTA_LEJART" && (
                      <div className="km-hf-uzenet" data-fajta="figyelem">{t("hf.mintaLejart")}</div>
                    )}
                    {javaslatHiba && javaslatHiba !== "MINTA_LEJART" && (
                      <div className="km-hf-uzenet" data-fajta="hiba">{t("hf.cmpHiba")}</div>
                    )}
                  </>
                )}
              </div>
            )}

            {javaslatAllapot === "elfogadva" && elfogadvaVerzio !== null && (
              <div className="km-hf-fh-elfogadva" aria-live="polite">✓ {t("hf.verApplied", { v: String(elfogadvaVerzio) })}</div>
            )}

            {elvetve && (
              <div className="km-hf-fh-elvetve" aria-live="polite">{t("hf.rejected")}</div>
            )}

            {lathatoJavaslat?.profil_erintett && (
              <div className="km-hf-fh-profil">
                {t("hf.profileTouch")} <a href="/fiok">{t("hf.profileOpen")} →</a>
              </div>
            )}

            <div className="km-hf-fh-verziok">
              <div className="km-hf-fh-verziok-cim">{t("hf.verTitle")}</div>
              <div className="km-hf-fh-verziok-lista">
                {[...adat.verziok].sort((a, b) => a.verzio - b.verzio).map((v) => (
                  <div key={v.verzio} className="km-hf-fh-verzio">
                    <span className="km-hf-fh-verzio-szam">v{v.verzio}</span>
                    <span className="km-hf-fh-verzio-leiras">
                      {t(`hf.verEredet_${v.eredet}`)} · {idoRovid(v.letrehozva, nyelv)}
                    </span>
                    {v.allapot === "aktiv" && <span className="km-hf-fh-verzio-aktiv">{t("hf.verActive")}</span>}
                    {v.allapot !== "aktiv" && szerep !== "nezo" && (
                      <button className="km-hf-fh-verzio-vissza" onClick={() => visszaallit(v.verzio)}>{t("hf.restore")}</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="km-hf-fh-verzio-megj">{t("hf.verHitNote")}</div>
            </div>
          </>
        )}
      </section>
    </HirfigyeloKeret>
  );
}
