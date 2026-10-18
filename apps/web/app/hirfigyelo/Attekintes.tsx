"use client";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { HirfigyeloKeret } from "./_kozos/HirfigyeloKeret";
import { HirKartya } from "./HirKartya"; // R-9: a kártya két hasábhoz
import { HirFelugro } from "./HirFelugro"; // R-9: a hír részletei felugróban
import { hfKeres, varjSor, idoRovid, nyelvNev, forrasNev, type SorTetel } from "./_kozos/kliens";
import type { Kartya } from "@rogton/news-monitor-core";

type BeallitasValasz = {
  verziok: { verzio: number; beallitas: { idozites: { mod: "kezi" | "napi"; ora: number; perc: number; idozona: string } }; letrehozva: string; eredet: string; allapot: string }[];
  aktiv: { verzio: number; beallitas: { idozites: { mod: "kezi" | "napi"; ora: number; perc: number; idozona: string } }; letrehozva: string; eredet: string; allapot: string } | null;
  tervezet: unknown;
};

type AttekintesValasz = {
  utolsoFutas?: { kezdet: string; veg: string | null; allapot: string; uj_talalatok: number } | null;
  utolsoSikeres: { id: string; szabaly_verzio: number; kezdet: string; veg: string | null; allapot: string; uj_talalatok: number; hibas_forrasok: { forras_id: string; ok: string }[]; proba: boolean } | null;
  aktivFutas: { id: string; szabaly_verzio: number; kezdet: string; veg: string | null; allapot: string; uj_talalatok: number; hibas_forrasok: { forras_id: string; ok: string }[]; proba: boolean } | null;
  kovetkezo: string | null;
  ujDb: number;
  talalatok: unknown[];
  esemenyek: unknown[];
  forrasHibak: { forras_id: string; ok: string }[];
  kartyak: Kartya[];
  sorban: SorTetel | null;
  /** F-7b (R-5, 06.): a munkatér AI-kapcsolója — kikapcsolva a figyelmeztető sáv áll a lap tetején */
  ai_engedelyezve?: boolean;
  /** V3 (2026-09-18): a főoldal-találatok miatt kihagyott kártyák száma — a lap egy sorban jelzi */
  kihagyott_fooldal?: number;
};

type OsszkepValasz = { osszkep: { szoveg: string; hivatkozott_talalatok: string[]; bizonytalan: boolean } };

type Szuro = "new" | "saved" | "hidden" | "all";
type FutAllapot = "all" | "fut" | "hiba";

export function Attekintes({ profilNev, szerep, sav }: { profilNev: string; szerep: string; sav: FelsoSavAdat }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();

  const [betoltve, setBetoltve] = useState(false);
  const [lassu, setLassu] = useState(false);
  const [hiba, setHiba] = useState<string | null>(null);
  const [beallitas, setBeallitas] = useState<BeallitasValasz | null>(null);
  const [attekintes, setAttekintes] = useState<AttekintesValasz | null>(null);
  const [osszkep, setOsszkep] = useState<OsszkepValasz | null>(null);
  const [osszkepHiba, setOsszkepHiba] = useState(false);
  const [futAllapot, setFutAllapot] = useState<FutAllapot>("all");
  const [futHiba, setFutHiba] = useState<string | null>(null);
  const [szuro, setSzuro] = useState<Szuro>("new");
  const [hiddenNote, setHiddenNote] = useState(false);
  const [kartyak, setKartyak] = useState<Kartya[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [otletHiba, setOtletHiba] = useState<string | null>(null);
  const [otletFut, setOtletFut] = useState(false);
  const [megtekintettHelyi, setMegtekintettHelyi] = useState<Set<string>>(new Set());
  const [ujraFut, setUjraFut] = useState(false);
  const [ujraUzenet, setUjraUzenet] = useState<string | null>(null); // 2026-09-22: az újrapróbálás eredménye látszik
  const [haladas, setHaladas] = useState<NonNullable<SorTetel["haladas"]> | null>(null);
  const [lathato, setLathato] = useState(8); // R-9: egy lapon legfeljebb 8 kártya
  // V3 (2026-09-18, Vilmos 7. pont): a háttérhírek alapból zárva — a „+N háttérhír — megnézem" sor nyitja

  const sorbanRef = useRef<SorTetel | null>(null);
  const futAllapotRef = useRef<FutAllapot>("all");
  futAllapotRef.current = futAllapot;

  // F9-A10: URL-paraméter feldolgozása betöltés után — egyszer fut
  const urlParamFeldolgozva = useRef(false);

  // F9-A2: az összkép külön töltődik — nem blokkolja a kártyák megjelenését.
  const osszkepBetolt = useCallback(async (kartyak: Kartya[]) => {
    const vanErtekelt = kartyak.some((k) => k.ertekeles_allapot === "kesz");
    if (!vanErtekelt) {
      setOsszkep(null);
      setOsszkepHiba(false);
      return;
    }
    const o = await hfKeres<OsszkepValasz>("/api/hirfigyelo/osszkep");
    if (o.statusz === 200) {
      setOsszkep(o.torzs);
      setOsszkepHiba(false);
    } else {
      setOsszkep(null);
      setOsszkepHiba(true);
    }
  }, []);

  const betolt = useCallback(async () => {
    setHiba(null);
    const [a, b] = await Promise.all([
      hfKeres<AttekintesValasz>("/api/hirfigyelo/attekintes"),
      hfKeres<BeallitasValasz>("/api/hirfigyelo/beallitas"),
    ]);
    if (a.statusz === 401 || b.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (a.statusz !== 200 || b.statusz !== 200) {
      setHiba(a.hiba ?? b.hiba ?? "HIBA");
      setBetoltve(true);
      return;
    }
    setAttekintes(a.torzs);
    setBeallitas(b.torzs);
    setKartyak(a.torzs.kartyak);
    sorbanRef.current = a.torzs.sorban;
    if (a.torzs.sorban) {
      setFutAllapot("fut");
      void varjSor(a.torzs.sorban.id, { onLepes: (s) => setHaladas(s.haladas ?? null) }).then((sor) => {
        setHaladas(null);
        if (sor?.allapot === "hiba") {
          setFutAllapot("hiba");
          setFutHiba(t("hf.futas_hiba"));
        } else {
          setFutAllapot("all");
          void ujraBetolt();
        }
      });
    }
    setBetoltve(true);
    // F9-A2: az összkép a háttérben töltődik, nem blokkolja a kártyákat.
    void osszkepBetolt(a.torzs.kartyak);
  }, [router, t, osszkepBetolt]);

  const ujraBetolt = useCallback(async () => {
    const a = await hfKeres<AttekintesValasz>("/api/hirfigyelo/attekintes");
    if (a.statusz === 200) {
      setAttekintes(a.torzs);
      setKartyak(a.torzs.kartyak);
      sorbanRef.current = a.torzs.sorban;
      void osszkepBetolt(a.torzs.kartyak);
    }
  }, [osszkepBetolt]);

  // F9-A6: egy elakadt értékelés újraindítása — a sor-tételre várunk, utána újratöltünk.
  const ertekelesUjra = useCallback(async () => {
    setUjraUzenet(null);
    setUjraFut(true);
    const v = await hfKeres<{ sor: SorTetel }>("/api/hirfigyelo/ertekeles-ujra", "POST", {});
    if (v.statusz === 202 && v.torzs.sor?.id) {
      const sor = await varjSor(v.torzs.sor.id, { onLepes: (s) => setHaladas(s.haladas ?? null) });
      setHaladas(null);
      setUjraFut(false);
      // 2026-09-22 (Vilmos: „be sem akar töltődni”): ha az újrapróbálás sem hozott összefoglalót, megmondjuk.
      if (!sor || sor.allapot === "hiba" || (sor.eredmeny?.ujra_ertekelt ?? 0) === 0) setUjraUzenet(t("hf.ujraertekeles_sikertelen"));
      if (sor) void ujraBetolt();
      return;
    }
    setUjraFut(false);
    setUjraUzenet(v.statusz === 409 ? t("hf.ujraertekeles_fut_mar") : t("hf.ujraertekeles_sikertelen"));
  }, [ujraBetolt, t]);

  useEffect(() => {
    void betolt();
  }, [betolt]);

  // F9-A2: 5 mp után jelezzük, hogy a betöltés a szokásosnál tovább tart.
  useEffect(() => {
    if (betoltve) return;
    const id = setTimeout(() => setLassu(true), 5000);
    return () => clearTimeout(id);
  }, [betoltve]);

  // Escape zárja a részletpanelt
  useEffect(() => {
    if (!detailId) return;
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailId(null);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [detailId]);

  const futasIndit = useCallback(async () => {
    if (futAllapotRef.current === "fut") return;
    setFutHiba(null);
    const v = await hfKeres<{ sor: SorTetel }>("/api/hirfigyelo/futas", "POST", {});
    if (v.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (v.statusz === 409 && v.hiba === "FUT_MAR") {
      setFutAllapot("fut");
      // Megpróbáljuk megtalálni a sor-tételt
      const a = await hfKeres<AttekintesValasz>("/api/hirfigyelo/attekintes");
      if (a.statusz === 200 && a.torzs.sorban) {
        sorbanRef.current = a.torzs.sorban;
        void varjSor(a.torzs.sorban.id, { onLepes: (s) => setHaladas(s.haladas ?? null) }).then((sor) => {
          setHaladas(null);
          if (sor?.allapot === "hiba") {
            setFutAllapot("hiba");
            setFutHiba(t("hf.futas_hiba"));
          } else {
            setFutAllapot("all");
            void ujraBetolt();
          }
        });
      }
      return;
    }
    if (v.statusz === 202 && v.torzs.sor) {
      setFutAllapot("fut");
      sorbanRef.current = v.torzs.sor;
      void varjSor(v.torzs.sor.id, { onLepes: (s) => setHaladas(s.haladas ?? null) }).then((sor) => {
        setHaladas(null);
        if (sor?.allapot === "hiba") {
          setFutAllapot("hiba");
          setFutHiba(t("hf.futas_hiba"));
        } else {
          setFutAllapot("all");
          void ujraBetolt();
        }
      });
      return;
    }
    setFutHiba(t("hf.futas_hiba"));
  }, [router, t, ujraBetolt]);

  const megtekint = useCallback(async (kartya: Kartya) => {
    if (kartya.megtekintes !== "uj") return;
    setMegtekintettHelyi((elozo) => new Set(elozo).add(kartya.fo_talalat_id));
    const v = await hfKeres(`/api/hirfigyelo/talalatok/${kartya.fo_talalat_id}/megtekint`, "POST", {});
    if (v.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (v.statusz !== 200) {
      setMegtekintettHelyi((elozo) => {
        const uj = new Set(elozo);
        uj.delete(kartya.fo_talalat_id);
        return uj;
      });
    }
  }, [router]);

  // F9-A10: a betöltés után egyszer kiolvassuk a ?talalat paramétert
  useEffect(() => {
    if (!betoltve || urlParamFeldolgozva.current) return;
    urlParamFeldolgozva.current = true;

    const params = new URLSearchParams(window.location.search);
    // R-15: a Hírek lap „Elmentett és elrejtett hírek” sora ide hoz, a mentett szűrővel
    if (params.get("szuro") === "mentett") setSzuro("saved");
    const talalat = params.get("talalat");
    if (!talalat) return;

    const kartya = kartyak.find((k) => k.fo_talalat_id === talalat);
    if (!kartya) return;

    if (kartya.jeloles === "elrejtett") {
      setSzuro("all");
    }
    setDetailId(kartya.fo_talalat_id);
    void megtekint(kartya);
  }, [betoltve, kartyak, megtekint]);

  const jelol = useCallback(async (kartya: Kartya, jeloles: "nincs" | "mentett" | "elrejtett") => {
    const regi = kartya.jeloles;
    // Optimista frissítés
    setKartyak((elozo) => elozo.map((k) => (k.fo_talalat_id === kartya.fo_talalat_id ? { ...k, jeloles } : k)));
    if (jeloles === "elrejtett") setHiddenNote(true);
    if (jeloles === "elrejtett" && kartya.megtekintes === "uj") {
      void megtekint(kartya);
    }
    const v = await hfKeres(`/api/hirfigyelo/talalatok/${kartya.fo_talalat_id}/jelol`, "POST", { jeloles });
    if (v.statusz === 401) {
      router.push("/belepes");
      return;
    }
    if (v.statusz !== 200) {
      // Visszaállítás
      setKartyak((elozo) => elozo.map((k) => (k.fo_talalat_id === kartya.fo_talalat_id ? { ...k, jeloles: regi } : k)));
    }
  }, [router, megtekint]);

  const tartalomotlet = useCallback(async (kartya: Kartya) => {
    if (otletFut) return;
    setOtletFut(true);
    setOtletHiba(null);
    const v = await hfKeres<{ talalat: { tartalomotlet: { szoveg: string; nyelv: string; keszult: string } | null } }>(
      `/api/hirfigyelo/talalatok/${kartya.fo_talalat_id}/tartalomotlet`,
      "POST",
      {},
    );
    if (v.statusz === 401) {
      router.push("/belepes");
      setOtletFut(false);
      return;
    }
    if (v.statusz === 429) {
      setOtletHiba(t("hf.otlet_keret"));
      setOtletFut(false);
      return;
    }
    if (v.statusz !== 200) {
      setOtletHiba(t("hf.otlet_hiba"));
      setOtletFut(false);
      return;
    }
    // Frissítjük a kártyát
    setKartyak((elozo) => elozo.map((k) => (k.fo_talalat_id === kartya.fo_talalat_id ? { ...k, tartalomotlet: v.torzs.talalat?.tartalomotlet ?? null } : k)));
    setOtletFut(false);
  }, [otletFut, router, t]);

  if (!betoltve) {
    return (
      <HirfigyeloKeret aktiv="attekintes" profilNev={profilNev} sav={sav}>
        <section data-screen-label="HF-I Áttekintés">
          <div className="km-hf-uzenet" aria-live="polite">
            {t("hf.betoltes")}
            {lassu && (
              <>
                <div>{t("hf.betoltes_lassu")}</div>
                <button className="km-hf-uzenet-gomb" onClick={() => { setLassu(false); void betolt(); }}>{t("hf.ujraprobalom")}</button>
              </>
            )}
          </div>
        </section>
      </HirfigyeloKeret>
    );
  }

  if (hiba) {
    return (
      <HirfigyeloKeret aktiv="attekintes" profilNev={profilNev} sav={sav}>
        <div className="km-hf-uzenet" data-fajta="hiba">
          {t("hf.betoltes_hiba")}
          <button className="km-hf-uzenet-gomb" onClick={() => { setBetoltve(false); void betolt(); }}>{t("hf.ujra")}</button>
        </div>
      </HirfigyeloKeret>
    );
  }

  const firstUse = beallitas?.aktiv === null;
  const utolsoSikeres = attekintes?.utolsoSikeres ?? null;
  const utolsoFutas = attekintes?.utolsoFutas ?? null;
  const aktivFutas = attekintes?.aktivFutas ?? null;
  const forrasHibak = attekintes?.forrasHibak ?? [];
  const kovetkezo = attekintes?.kovetkezo ?? null;
  const aktivBeallitas = beallitas?.aktiv?.beallitas;
  const idozites = aktivBeallitas?.idozites;
  const kihagyottFooldal = attekintes?.kihagyott_fooldal ?? 0;

  const aiKieses = (aktivFutas?.allapot === "ai_fuggoben") || kartyak.some((k) => k.ertekeles_allapot === "fuggoben");
  const keretKimerult = kartyak.some((k) => k.ertekeles_allapot === "keret_kimerult");
  const fuggoDb = kartyak.filter((k) => k.ertekeles_allapot === "fuggoben").length;
  const keszDb = kartyak.filter((k) => k.ertekeles_allapot === "kesz").length;
  const fut = futAllapot === "fut";
  // J-1: a legutóbbi futás nem sikerült (pl. egyik oldalt sem tudtuk elolvasni) — ezt kimondjuk, nem „még nem futott”-at írunk
  const utolsoHibas = !fut && utolsoFutas !== null && utolsoFutas.allapot === "hiba" && (utolsoSikeres === null || new Date(utolsoFutas.kezdet).getTime() > new Date(utolsoSikeres.kezdet).getTime());
  const futHibas = futAllapot === "hiba";

  // 2026-09-22 (Vilmos): a kiszűrt (háttér) hírek SEHOL nem látszanak — csak a számuk, egy sorban.
  const kiszurtDb = kartyak.filter((k) => k.ertekeles_allapot === "kesz" && k.fontossag === "hatter" && k.jeloles !== "elrejtett").length;
  const lathatoKartyak = kartyak.filter((k) => !(k.ertekeles_allapot === "kesz" && k.fontossag === "hatter"));

  const szurtKartyak = lathatoKartyak.filter((k) => {
    if (szuro === "saved") return k.jeloles === "mentett";
    if (szuro === "hidden") return k.jeloles === "elrejtett";
    if (szuro === "new") return k.jeloles !== "elrejtett";
    return k.jeloles !== "elrejtett";
  });

  const foKartyak = szurtKartyak;

  // V3: a számlálók a NEM-háttér hírekre számolnak (a „11 új" és az „N hír az elmúlt két napból").
  const ujDb = foKartyak.filter((k) => k.megtekintes === "uj" && !megtekintettHelyi.has(k.fo_talalat_id) && k.jeloles !== "elrejtett").length;
  const szurtUj = foKartyak.filter((k) => k.megtekintes === "uj" && k.jeloles !== "elrejtett").length;
  const noNew = utolsoSikeres !== null && utolsoSikeres.uj_talalatok === 0 && !fut && foKartyak.length === 0;
  const showSummary = osszkep !== null && !(aiKieses && keszDb === 0) && !keretKimerult && !fut && !noNew;
  const showHits = !fut && !noNew;

  const szurok: { kulcs: Szuro; cimke: string; szam: number }[] = [
    { kulcs: "new", cimke: t("hf.fNew"), szam: lathatoKartyak.filter((k) => k.jeloles !== "elrejtett").length },
    { kulcs: "saved", cimke: t("hf.fSaved"), szam: lathatoKartyak.filter((k) => k.jeloles === "mentett").length },
    { kulcs: "hidden", cimke: t("hf.fHidden"), szam: lathatoKartyak.filter((k) => k.jeloles === "elrejtett").length },
    { kulcs: "all", cimke: t("hf.fAll"), szam: lathatoKartyak.filter((k) => k.jeloles !== "elrejtett").length },
  ];

  const detailKartya = detailId ? kartyak.find((k) => k.fo_talalat_id === detailId) ?? null : null;

  // R-9: EGY lista, fontos → érdekes → még készül sorrendben, csoporton belül a hír ideje szerint; egyszerre 8 látszik.
  // V3: a háttérhírek NEM részei a fő listának — külön, összecsukott sorban jelennek meg.
  const csoport = (k: Kartya) => (k.ertekeles_allapot !== "kesz" ? 2 : k.fontossag === "fontos" ? 0 : k.fontossag === "erdekes" ? 1 : 3);
  const rendezett = [...foKartyak].sort((a, b) => csoport(a) - csoport(b) || new Date(b.esemeny_ideje ?? b.letrehozva).getTime() - new Date(a.esemeny_ideje ?? a.letrehozva).getTime());
  const mutatott = rendezett.slice(0, lathato);
  const tobbi = rendezett.length - mutatott.length;


  return (
    <HirfigyeloKeret aktiv="attekintes" profilNev={profilNev} sav={sav}>
      <section data-screen-label="HF-I Áttekintés">
        {attekintes?.ai_engedelyezve === false ? (
          <div className="km-hf-ai-sav" role="status">
            <span>{t("ai_kapcsolo.hirfigyelo_sav")}</span>
            {sav.szerep === "tulajdonos" ? <a href="/beallitasok?ful=adatpolitika" className="km-hf-ai-sav-link">{t("ai_kapcsolo.sav_link")}</a> : null}
          </div>
        ) : null}
        {firstUse ? (
          <div className="km-hf-at-elso">
            <h1 className="km-hf-at-elso-cim">{t("hf.ures_cim")}</h1>
            <p className="km-hf-at-elso-szoveg">{t("hf.ures_szoveg")}</p>
            <a href="/hirfigyelo/beallitas" className="km-hf-at-elso-gomb">{t("hf.ures_gomb")}</a>
          </div>
        ) : (
          <>
            {/* Állapotsáv */}
            <div className="km-hf-at-status">
              <span className="km-hf-at-status-elem">
                <span
                  className="km-hf-at-pont"
                  data-allapot={forrasHibak.length > 0 ? "hiba" : "ok"}
                  aria-hidden="true"
                />
                {utolsoHibas && utolsoFutas
                  ? t("hf.stLastRunFailed", { t: idoRovid(utolsoFutas.veg ?? utolsoFutas.kezdet, nyelv) })
                  : utolsoSikeres
                  ? t("hf.stLastRun", { t: idoRovid(utolsoSikeres.veg ?? utolsoSikeres.kezdet, nyelv) })
                  : t("hf.stNever")}
              </span>
              <span className="km-hf-at-status-elvalaszto">·</span>
              <span className="km-hf-at-status-elem">
                {idozites?.mod === "napi" && kovetkezo
                  ? t("hf.stNextRun", { t: idoRovid(kovetkezo, nyelv, idozites.idozona), tz: idozites.idozona })
                  : t("hf.stNextManual")}
              </span>
              <span className="km-hf-at-status-elvalaszto">·</span>
              <span className="km-hf-at-status-elem" data-uj={ujDb > 0 ? "true" : "false"}>
                {ujDb > 0 ? t("hf.stNew", { n: ujDb }) : t("hf.stNoNew")}
              </span>
              {forrasHibak.length > 0 && (
                <a href="/hirfigyelo/beallitas" className="km-hf-at-reszleges">
                  ⚠ {t("hf.stPartialShort", { n: forrasHibak.length })}
                </a>
              )}
              {!fut && szerep !== "nezo" && (
                <button className="km-hf-at-futtatas" onClick={() => void futasIndit()}>
                  {t("hf.stRunNow")}
                </button>
              )}
              {fut && (
                <span className="km-hf-at-fut" aria-live="polite">
                  <span className="km-hf-at-porgo" aria-hidden="true" />
                  {t("hf.stRunning")}
                  {haladas ? " · " + t("hf.futas_haladas", { f: haladas.forrasok_letoltve, m: haladas.forrasok_osszes, c: haladas.cikkek_talalt, e: haladas.cikkek_ertekelve }) : null}
                </span>
              )}
            </div>

            {futHibas && (
              <div className="km-hf-uzenet" data-fajta="hiba">{futHiba}</div>
            )}
            {ujraUzenet && (
              <div className="km-hf-uzenet" data-fajta="hiba" role="status">{ujraUzenet}</div>
            )}

            {/* V3 (2026-09-18): a főoldal-találatok miatt kihagyott kártyák jelzése */}
            {kihagyottFooldal > 0 && (
              <div className="km-hf-at-kihagyott" role="status">
                {t("hf.kihagyott_fooldal", { n: kihagyottFooldal })}
              </div>
            )}

            {/* AI-kiesés vagy keret-kimerülés */}
            {(aiKieses || keretKimerult) && (
              <div className="km-hf-at-figyelmeztetes" aria-live="polite">
                {keretKimerult
                  ? t("hf.keret_kimerult")
                  : fuggoDb > 0
                    ? t("hf.ertekeles_hianyzik_n", { n: fuggoDb })
                    : t("hf.stAiPend")}
              </div>
            )}

            {/* Nincs új találat */}
            {utolsoHibas && (
              <div className="km-hf-at-nincs-uj">
                <div className="km-hf-at-nincs-uj-cim">{t("hf.futas_nem_sikerult_cim")}</div>
                <div className="km-hf-at-nincs-uj-szoveg">
                  {t("hf.futas_nem_sikerult_szoveg")} <a href="/hirfigyelo/beallitas">{t("hf.futas_nem_sikerult_link")}</a>
                </div>
              </div>
            )}

            {noNew && !utolsoHibas && (
              <div className="km-hf-at-nincs-uj">
                <div className="km-hf-at-nincs-uj-cim">✓ {t("hf.ovNoNewTitle")}</div>
                <div className="km-hf-at-nincs-uj-szoveg">{t("hf.ovNoNewBody")}</div>
              </div>
            )}

            {/* Összkép */}
            {showSummary && osszkep && (
              <div className="km-hf-at-osszkep" id="osszkep">
                <div className="km-hf-at-osszkep-fejlec">
                  <div className="km-hf-at-osszkep-cim">{t("hf.ovSummaryTitle")}</div>
                  <span className="km-hf-at-osszkep-jelveny">{t("hf.ovSummaryBadge")}</span>
                </div>
                <div className="km-hf-at-osszkep-szoveg">{osszkep.osszkep.szoveg}</div>
                <div className="km-hf-at-osszkep-lablec" data-bizonytalan={osszkep.osszkep.bizonytalan ? "true" : "false"}>
                  {t("hf.ovSummaryCaveat")}
                </div>
              </div>
            )}

            {/* Találatok */}
            {showHits && (
              <>
                <div className="km-hf-at-szurok" role="tablist" aria-label={t("hf.pOverview")}>
                  {szurok.map((s) => (
                    <button
                      key={s.kulcs}
                      role="tab"
                      aria-selected={szuro === s.kulcs}
                      className="km-hf-at-szuro"
                      data-aktiv={szuro === s.kulcs ? "true" : "false"}
                      onClick={() => { setSzuro(s.kulcs); setLathato(8); }}
                    >
                      {s.cimke}
                    </button>
                  ))}
                </div>
                {hiddenNote && szuro !== "hidden" && (
                  <div className="km-hf-at-hidden-note">{t("hf.hiddenNote")}</div>
                )}
                <div className="km-hf-at-kartyak">
                  {mutatott.map((k) => (
                    <HirKartya
                      key={k.fo_talalat_id}
                      kartya={k}
                      nyelv={nyelv}
                      t={t}
                      szerep={szerep}
                      megtekintettHelyileg={megtekintettHelyi.has(k.fo_talalat_id)}
                      onJelol={(jeloles) => void jelol(k, jeloles)}
                      onNyit={() => {
                        setDetailId(k.fo_talalat_id);
                        void megtekint(k);
                      }}
                      onUjraertekel={() => void ertekelesUjra()}
                      ujraFut={ujraFut}
                    />
                  ))}
                  {foKartyak.length === 0 && (
                    <div className="km-hf-at-ures">{t("hf.emptyFilter")}</div>
                  )}
                </div>
                {tobbi > 0 && (
                  <div className="km-hf-at-tobbi">
                    <span className="km-hf-at-tobbi-szoveg">{t("hf.tovabbi_hirek", { n: tobbi })}</span>
                    <button className="km-hf-at-gomb-mentes" onClick={() => setLathato((l) => l + 8)}>{t("hf.mutasd_kovetkezo", { n: Math.min(8, tobbi) })} ▾</button>
                  </div>
                )}

                {/* 2026-09-22 (Vilmos): a kiszűrt hírek nem látszanak — csak a számuk */}
                {kiszurtDb > 0 && (
                  <div className="km-hf-at-kiszurt" role="status">{t("hf.kiszurt_sor", { n: kiszurtDb })}</div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {detailKartya && (
        <HirFelugro
          kartya={detailKartya}
          nyelv={nyelv}
          t={t}
          szerep={szerep}
          otletFut={otletFut}
          otletHiba={otletHiba}
          onBezar={() => setDetailId(null)}
          onOtlet={() => void tartalomotlet(detailKartya)}
          onJelol={(j) => void jelol(detailKartya, j)}
        />
      )}
    </HirfigyeloKeret>
  );
}
