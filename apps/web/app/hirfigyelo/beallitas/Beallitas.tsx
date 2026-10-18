"use client";
// R-15 · 06 Mit figyeljünk (/hirfigyelo/beallitas) — design/R15/rajz/R15-lapok-3.dc.html (06a · 06b, az „ÁTÍROM” UTÁN, a „RÉSZLETEK”
// LENYITVA és a RITKÁBB ÁLLAPOTOK panel), gepezet-3 3, kerdesek-3 3 és 5 (Csilla 10-01: jóváhagyva). A rajz a szerződés.
//  - 06a (a reggeli figyelés KI): „Innen hozunk híreket — jó így?” + az alcím (honnan és mi lesz velük); a kártya a gép kitöltötte témákkal és
//    oldalakkal, olvasható; fő gomb „Jó így, kezdjük” — láncolt művelet (gepezet-3 3.5): mentés → ha még soha nem volt kész keresés, egy
//    próbakeresés (POST /api/hirfigyelo/futas {proba:true}, várakozás) → a reggeli figyelés bekapcsolása (PUT /api/r15/napi-figyeles) → 06b.
//  - 06b (BE): „Innen jönnek a posztjaid hírei” + „Ezzel nincs dolgod: …”; fő gomb „Megnézem a mai híreket” (→ /hirfigyelo).
//  - „Átírom”: a kártya helyben szerkeszthető (× · + Új téma · + Új oldal · ···); minden változás magától mentődik (800 ms, mint eddig);
//    „Kész” visszazárja. A „Beállítás mentése” gomb és a modul-fülsor elmaradt (kerdesek-3 5): a mentés ma is automatikus volt.
//  - Részletek (helyben): kiről szóljanak a hírek (saját név), a négy pontosító mező emberi kérdésként, a korlátok, „Keress most” (a régi
//    próbafuttatás, haladással), „Mit találtunk eddig?” (→ finomhangolás), „Mást javasolj témának” (a régi „Újra javasol”), „Mentve · …”,
//    és BEKAPCSOLT figyelésnél „Reggeli hírek kikapcsolása” (DELETE /api/r15/napi-figyeles → 06a; kerdesek-3 3).
//  - A ritkább állapotok egy-egy sorban a kártya fölött: félbehagyott beállítás · a gép még javasol · hibák (T7: csak valódi bajnál, gombbal).
// A verziószám az adatban és az API-ban marad, a képernyőn sehol (T3). A `data-screen-label` a régi próbák jele (hirfigyelo-felulet).
import type { FelsoSavAdat } from "../../../kezdolap/tipusok";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFeliratok } from "../../../nyelv/kliens";
import { HirfigyeloKeret } from "../_kozos/HirfigyeloKeret";
import { hfKeres, varjSor } from "../_kozos/kliens";
import { beallitasEllenoriz, beallitasNormalizal, HF_NAPI_CIKK, HF_CIKK_MAX_KOR_ORA, type Beallitas as BeallitasTipus, type BeallitasVerzio, type Futas } from "@rogton/news-monitor-core";
import { Baj, FoGomb, HalkGomb, HalkLink, Info, KerdesCim, Reszletek, Teendo } from "../../_kozos/R15";
import { Forrasok, type OldalakAllapot } from "./Forrasok";
import { mitFigyeljunkNezet, voltKeszKereses } from "./mitFigyeljunk";
import { mentoSor, temaHozzaadas, TEMA_NEV_MAX, TEMAK_MAX, type TemaHozzaadasEredmeny } from "./temaMuvelet";
import "../../_kozos/r15-lapok.css";

type BeallitasValasz = { verziok: BeallitasVerzio[]; aktiv: BeallitasVerzio | null; tervezet: BeallitasTipus | null };
type MentesValasz = { uj: BeallitasVerzio | null; verziok: BeallitasVerzio[] };
type JavaslatValasz = { tervezet: BeallitasTipus };

// A2: a mentés és a tervezet ne várjon a végtelenségig (a lassú NAS-on a kérés be is ragadhat); a javaslat tovább tarthat.
const MENTES_IDOKORLAT_MS = 30_000;
const JAVASLAT_IDOKORLAT_MS = 120_000;
const HIREK_CIM = "/hirfigyelo";

const URES_BEALLITAS: BeallitasTipus = {
  celok: ["sajat_marka"],
  temak: [],
  foldrajzi_fokusz: "",
  nyelvek: [],
  kizarasok: [],
  idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Budapest" },
  szabad_szoveg: "",
};

export function Beallitas({ profilNev, szerep, sav }: { profilNev: string; szerep: string; sav: FelsoSavAdat }) {
  void profilNev; // a keret és a régi próbák miatt marad a felület
  const { t } = useFeliratok();
  const szerkesztheto = szerep !== "nezo";
  const [beallitas, setBeallitas] = useState<BeallitasTipus>(URES_BEALLITAS);
  const [aktivVerzio, setAktivVerzio] = useState<number | null>(null);
  const [betoltve, setBetoltve] = useState(false);
  const [betoltesHiba, setBetoltesHiba] = useState(false);
  const [mentesHiba, setMentesHiba] = useState(false);
  const [javaslatFolyik, setJavaslatFolyik] = useState(false);
  const [javaslatHiba, setJavaslatHiba] = useState(false);
  const [keresAllapot, setKeresAllapot] = useState<"nyugto" | "fut" | "kesz">("nyugto");
  const [keresHaladas, setKeresHaladas] = useState<{ forrasok_letoltve: number; forrasok_osszes: number } | null>(null);
  const [keresHiba, setKeresHiba] = useState(false);
  const [indit, setIndit] = useState<"nyugto" | "fut" | "hianyzik" | "hiba">("nyugto");
  const [kiFolyik, setKiFolyik] = useState(false);
  const [szerk, setSzerk] = useState(false);
  const [reszletek, setReszletek] = useState(false);
  const [ujTemaNyitva, setUjTemaNyitva] = useState(false);
  const [ujTema, setUjTema] = useState("");
  const [temaOk, setTemaOk] = useState<TemaHozzaadasEredmeny["ok"]>(null);
  const temaMezoRef = useRef<HTMLInputElement | null>(null);
  const [sajatNev, setSajatNev] = useState("");
  const [sajatNevMod, setSajatNevMod] = useState<"csak_szervezet" | "nevemet_is">("csak_szervezet");
  const [tervezetIdozito, setTervezetIdozito] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [vanAktiv, setVanAktiv] = useState(false);
  const [tervezetVan, setTervezetVan] = useState(false);
  const [aktivBeallitas, setAktivBeallitas] = useState<BeallitasTipus | null>(null);
  const [mentveIdo, setMentveIdo] = useState<string | null>(null);
  const [oldalak, setOldalak] = useState<OldalakAllapot | null>(null);
  const betoltveRef = useRef(false);

  // Betöltés — ugyanaz, mint eddig: aktív verzió, félbehagyott tervezet, vagy első megnyitáskor a profilból javaslat
  useEffect(() => {
    if (betoltveRef.current) return;
    betoltveRef.current = true;
    (async () => {
      const v = await hfKeres<BeallitasValasz>("/api/hirfigyelo/beallitas");
      if (v.statusz !== 200) { setBetoltesHiba(true); setBetoltve(true); return; }
      const { aktiv, tervezet } = v.torzs;
      setVanAktiv(aktiv !== null);
      setAktivVerzio(aktiv?.verzio ?? null);
      setAktivBeallitas(aktiv?.beallitas ?? null);
      if (tervezet) {
        setBeallitas(tervezet);
        setTervezetVan(true);
      } else if (aktiv) {
        setBeallitas(aktiv.beallitas);
      } else {
        setJavaslatFolyik(true);
        setBetoltve(true);
        const j = await hfKeres<JavaslatValasz>("/api/hirfigyelo/beallitas/javaslat", "POST", {}, { idokorlatMs: JAVASLAT_IDOKORLAT_MS });
        if (j.statusz === 200 && j.torzs.tervezet) setBeallitas(j.torzs.tervezet);
        else setJavaslatHiba(true);
        setJavaslatFolyik(false);
      }
      setBetoltve(true);
    })();
  }, []);

  // V2 (Vilmos 6.): minden módosítás magától mentődik 800 ms után. Ha a beállítás még nem teljes, csak a tervezet megy fel.
  const mentesRef = useRef<((b: BeallitasTipus) => Promise<void>) | null>(null);
  const mentesTervezet = useCallback((b: BeallitasTipus) => {
    if (!szerkesztheto) return;
    if (tervezetIdozito) clearTimeout(tervezetIdozito);
    const ido = setTimeout(async () => {
      const celok = b.celok.length > 0 ? b.celok : (["sajat_marka"] as BeallitasTipus["celok"]);
      if (beallitasEllenoriz({ ...b, celok }).ok && mentesRef.current) await mentesRef.current(b);
      else await hfKeres("/api/hirfigyelo/beallitas/tervezet", "PUT", b, { idokorlatMs: MENTES_IDOKORLAT_MS });
    }, 800);
    setTervezetIdozito(ido);
  }, [szerkesztheto, tervezetIdozito]);

  const frissitBeallitas = useCallback((b: BeallitasTipus) => {
    setBeallitas(b);
    mentesTervezet(b);
  }, [mentesTervezet]);

  const frissitMezo = <K extends keyof BeallitasTipus>(kulcs: K, ertek: BeallitasTipus[K]) => {
    frissitBeallitas({ ...beallitas, [kulcs]: ertek });
  };

  // Témák
  const temaTorles = (nev: string) => frissitMezo("temak", beallitas.temak.filter((x) => x.nev !== nev));
  // A2: a Hozzáadás mindig nyomható (üres mezőnél a mezőbe teszi a kurzort), és ha nem vesz fel semmit, egy mondatban megmondja, miért
  const temaHozzaad = () => {
    const e = temaHozzaadas(beallitas.temak, ujTema);
    setTemaOk(e.ok === "ures" ? null : e.ok);
    if (e.ujak.length > 0) frissitMezo("temak", e.temak);
    setUjTema(e.bevitel);
    temaMezoRef.current?.focus();
  };

  // Saját név (Részletek: „Kiről szóljanak a hírek?”)
  const sajatNevValtas = (mod: "csak_szervezet" | "nevemet_is") => {
    setSajatNevMod(mod);
    if (mod === "csak_szervezet" && sajatNev.trim()) frissitMezo("temak", beallitas.temak.filter((x) => x.nev !== sajatNev.trim()));
  };
  const sajatNevMentes = (nev: string) => {
    const regi = sajatNev.trim();
    setSajatNev(nev);
    const uj = nev.trim();
    let temak = beallitas.temak;
    if (regi) temak = temak.filter((x) => x.nev !== regi);
    if (uj && !temak.some((x) => x.nev === uj)) temak = [...temak, { nev: uj, nevvaltozatok: [], megkulonboztetes: "" }];
    frissitMezo("temak", temak);
  };

  // „Mást javasolj témának” — a régi „Újra javasol”: új javaslat a meglévők mellé (V2)
  const javaslatKeres = async () => {
    setJavaslatFolyik(true);
    setJavaslatHiba(false);
    const v = await hfKeres<JavaslatValasz>("/api/hirfigyelo/beallitas/javaslat", "POST", {}, { idokorlatMs: JAVASLAT_IDOKORLAT_MS });
    if (v.statusz === 200 && v.torzs.tervezet) {
      const jav = v.torzs.tervezet;
      const meglevo = new Set(beallitas.temak.map((x) => x.nev));
      const ujak = jav.temak.filter((x) => !meglevo.has(x.nev));
      const celok = beallitas.celok.length > 0 ? beallitas.celok : jav.celok;
      frissitBeallitas({ ...beallitas, temak: [...beallitas.temak, ...ujak], celok });
    } else {
      setJavaslatHiba(true);
    }
    setJavaslatFolyik(false);
  };

  // Mentés — A2: sorban (mentoSor), időkorlátos; a hibát egy mondat mondja (r15.mit.mentes_hiba)
  const mentesBelsoRef = useRef<(b: BeallitasTipus) => Promise<boolean>>(async () => false);
  const mentesSorRef = useRef(mentoSor<BeallitasTipus>(async (b) => { await mentesBelsoRef.current(b); }));
  const mentes = (adott?: BeallitasTipus): Promise<void> => {
    if (!szerkesztheto) return Promise.resolve();
    return mentesSorRef.current.kuld(adott ?? beallitas);
  };
  const mentesBelso = async (alap: BeallitasTipus): Promise<boolean> => {
    const celok = alap.celok.length > 0 ? alap.celok : (["sajat_marka"] as BeallitasTipus["celok"]);
    const mentendo: BeallitasTipus = { ...alap, celok };
    if (!beallitasEllenoriz(mentendo).ok) return false;
    const v = await hfKeres<MentesValasz>("/api/hirfigyelo/beallitas", "PUT", beallitasNormalizal(mentendo), { idokorlatMs: MENTES_IDOKORLAT_MS });
    if (v.statusz !== 200) { setMentesHiba(true); return false; }
    setMentesHiba(false);
    setMentveIdo(new Date().toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" }));
    if (v.torzs.uj) { setAktivVerzio(v.torzs.uj.verzio); setVanAktiv(true); setAktivBeallitas(v.torzs.uj.beallitas); }
    await hfKeres("/api/hirfigyelo/beallitas/tervezet", "DELETE", undefined, { idokorlatMs: MENTES_IDOKORLAT_MS });
    setTervezetVan(false); // J-1: a „félbehagytad” sor a mentés után eltűnik
    return true;
  };
  mentesBelsoRef.current = mentesBelso;
  mentesRef.current = (b) => mentes(b);

  // „Keress most” (Részletek) — a régi próbafuttatás, haladással; a hiba egy mondat
  const keressMost = async (): Promise<boolean> => {
    if (!szerkesztheto || keresAllapot === "fut") return false;
    setKeresAllapot("fut");
    setKeresHiba(false);
    const v = await hfKeres<{ sor: { id: string } }>("/api/hirfigyelo/futas", "POST", { proba: true });
    if (v.statusz === 202 && v.torzs.sor) {
      const sor = await varjSor(v.torzs.sor.id, { onLepes: (s) => setKeresHaladas(s.haladas ?? null) });
      setKeresHaladas(null);
      if (sor && sor.allapot === "kesz") { setKeresAllapot("kesz"); return true; }
    }
    setKeresAllapot("nyugto");
    setKeresHiba(true);
    return false;
  };

  // gepezet-3 3.5 — „Jó így, kezdjük”: mentés → (ha kell) egy keresés → a reggeli figyelés bekapcsolása → 06b
  const kezdjuk = async () => {
    if (!szerkesztheto || indit === "fut") return;
    const celok = beallitas.celok.length > 0 ? beallitas.celok : (["sajat_marka"] as BeallitasTipus["celok"]);
    if (!beallitasEllenoriz({ ...beallitas, celok }).ok || (oldalak !== null && oldalak.db === 0)) { setIndit("hianyzik"); return; }
    setIndit("fut");
    if (tervezetIdozito) clearTimeout(tervezetIdozito);
    await mentes(beallitas);
    const f = await hfKeres<{ futasok: Futas[] }>("/api/hirfigyelo/futas");
    if (f.statusz !== 200) { setIndit("hiba"); return; }
    if (!voltKeszKereses(f.torzs.futasok ?? [])) {
      const ok = await keressMost();
      if (!ok) { setIndit("hiba"); return; }
    }
    const v = await hfKeres("/api/r15/napi-figyeles", "PUT", {});
    if (v.statusz !== 200) { setIndit("hiba"); return; }
    setBeallitas((b) => ({ ...b, idozites: { ...b.idozites, mod: "napi" } }));
    setSzerk(false);
    setIndit("nyugto");
  };

  // kerdesek-3 3 — a reggeli hírek kikapcsolása (Részletek, csak bekapcsolt figyelésnél) → 06a
  const reggeliKi = async () => {
    if (!szerkesztheto || kiFolyik) return;
    setKiFolyik(true);
    const v = await hfKeres("/api/r15/napi-figyeles", "DELETE");
    setKiFolyik(false);
    if (v.statusz === 200) setBeallitas((b) => ({ ...b, idozites: { ...b.idozites, mod: "kezi" } }));
    else setMentesHiba(true);
  };

  const keret = (tartalom: React.ReactNode) => (
    <HirfigyeloKeret aktiv="beallitas" profilNev={profilNev} sav={sav} fulsor={false} mainOsztaly="r15-lap r15m-main">{tartalom}</HirfigyeloKeret>
  );

  if (betoltesHiba) {
    return keret(
      <div className="r15-lap-belso r15m-lap">
        <Baj szoveg={t("hf.betoltes_hiba")} gomb={<HalkGomb onClick={() => window.location.reload()}>{t("hf.ujra")}</HalkGomb>} />
      </div>,
    );
  }

  const nezet = mitFigyeljunkNezet(beallitas);
  const be = nezet === "06b";
  const elsoTema = beallitas.temak[0];
  const kerdes = be ? t("r15.mit.kerdes_be") : t("r15.mit.kerdes");
  const alcim = be ? t("r15.mit.alcim_be") : t("r15.mit.alcim");
  const foSzoveg = be || !szerkesztheto ? t("r15.mit.mai_hirek") : t("r15.mit.jo_igy");
  const foGomb = (osztaly?: string) => (be || !szerkesztheto
    ? <FoGomb href={HIREK_CIM} {...(osztaly ? { osztaly } : {})}>{foSzoveg}</FoGomb>
    : <FoGomb onClick={() => void kezdjuk()} disabled={indit === "fut" || javaslatFolyik || !betoltve} aria-busy={indit === "fut"} {...(osztaly ? { osztaly } : {})}>
        {indit === "fut" ? t("r15.mit.bekapcsoljuk") : foSzoveg}
      </FoGomb>);

  const vesszovel = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const mezo = (kulcs: string, ertek: string, valtozik: (s: string) => void, sugo?: string, tiltva?: boolean) => (
    <label className="r15m-cimke">
      <span>{t(kulcs)}</span>
      <input className="r15m-mezo" value={ertek} disabled={!szerkesztheto || tiltva} onChange={(e) => valtozik(e.target.value)} />
      {sugo ? <span className="r15m-sugo">{t(sugo)}</span> : null}
    </label>
  );

  return keret(
    <section data-screen-label="HF-II Figyelés beállítása" className="r15-lap-belso r15m-lap">
      {/* a ritkább állapotok egy sorban, a kártya fölött (rajz: RITKÁBB ÁLLAPOTOK) */}
      {!szerkesztheto ? <Info>{t("r15.mit.csak_nezed")}</Info> : null}
      {tervezetVan && szerkesztheto ? (
        <div className="r15m-allapotsor">
          <Info>{t("r15.mit.felbehagytad")}</Info>
          <HalkLink onClick={() => setTervezetVan(false)}>{t("hf.folytatom")}</HalkLink>
          {vanAktiv && aktivBeallitas ? (
            <HalkLink onClick={async () => { setBeallitas(aktivBeallitas); await hfKeres("/api/hirfigyelo/beallitas/tervezet", "DELETE"); setTervezetVan(false); }}>{t("r15.mit.a_mostanit")}</HalkLink>
          ) : null}
        </div>
      ) : null}

      <div className="r15m-fej">
        <KerdesCim cim={kerdes} alcim={alcim} />
      </div>

      {javaslatFolyik && beallitas.temak.length === 0 ? <Info>{t("r15.mit.javaslunk")}</Info> : null}
      {javaslatHiba ? <Baj szoveg={t("r15.mit.javaslat_hiba")} gomb={<HalkGomb onClick={() => void javaslatKeres()} disabled={!szerkesztheto}>{t("hf.ujra")}</HalkGomb>} /> : null}
      {mentesHiba ? <Baj szoveg={t("r15.mit.mentes_hiba")} gomb={<HalkGomb onClick={() => { setMentesHiba(false); void mentes(); }}>{t("hf.ujra")}</HalkGomb>} /> : null}
      {indit === "hianyzik" ? <Baj szoveg={t("r15.mit.hianyzik")} gomb={<HalkGomb onClick={() => { setIndit("nyugto"); setSzerk(true); }}>{t("r15.mit.atirom")}</HalkGomb>} /> : null}
      {indit === "hiba" ? <Baj szoveg={t("r15.mit.inditas_hiba")} gomb={<HalkGomb onClick={() => { setIndit("nyugto"); void kezdjuk(); }}>{t("hf.ujra")}</HalkGomb>} /> : null}

      <Teendo osztaly="r15m-kartya">
        <div className="r15m-resz">
          <div className="r15m-resz-fej">
            <span className="r15m-resz-cim">{t("r15.mit.temak")}</span>
            {szerkesztheto ? (
              <HalkLink onClick={() => { setSzerk((x) => !x); setUjTemaNyitva(false); setTemaOk(null); }} aria-expanded={szerk}>{szerk ? t("r15.mit.kesz") : t("r15.mit.atirom")}</HalkLink>
            ) : null}
          </div>
          <div className="r15m-chipek">
            {beallitas.temak.map((tema) => (
              <span key={tema.nev} className={szerk ? "r15m-chip r15m-chip-szerk" : "r15m-chip"}>
                {tema.nev}
                {szerk && szerkesztheto ? (
                  <button type="button" className="r15m-chip-x" onClick={() => temaTorles(tema.nev)} aria-label={`${t("hf.tema_eltavolitas")}: ${tema.nev}`}><span aria-hidden="true">×</span></button>
                ) : null}
              </span>
            ))}
            {szerk && szerkesztheto && !ujTemaNyitva ? (
              <button type="button" className="r15-halk-gomb r15m-chip-uj" onClick={() => setUjTemaNyitva(true)}><span aria-hidden="true">{"+\u00a0"}</span>{t("r15.mit.uj_tema")}</button>
            ) : null}
          </div>
          {szerk && szerkesztheto && ujTemaNyitva ? (
            <div className="r15m-mezosor">
              <input ref={temaMezoRef} className="r15m-mezo" autoFocus value={ujTema} placeholder={t("hf.temaHozzaad")} aria-label={t("r15.mit.uj_tema")}
                aria-describedby={temaOk ? "r15m-tema-ok" : undefined}
                onChange={(e) => { setUjTema(e.target.value); if (temaOk) setTemaOk(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); temaHozzaad(); } if (e.key === "Escape") setUjTemaNyitva(false); }} />
              <button type="button" className="r15-halk-gomb" onClick={temaHozzaad}>{t("hf.tema_hozzaadas")}</button>
            </div>
          ) : null}
          {temaOk ? (
            <p id="r15m-tema-ok" className="r15-info" data-r15="info" aria-live="polite">
              {temaOk === "tul_hosszu" ? t("hf.tema_tul_hosszu", { max: TEMA_NEV_MAX }) : temaOk === "tul_sok" ? t("hf.tema_tul_sok", { max: TEMAK_MAX }) : t("hf.tema_mar_van")}
            </p>
          ) : null}
        </div>
        <Forrasok szerkesztheto={szerkesztheto} szerk={szerk} onAllapot={setOldalak} />
      </Teendo>

      <div className="r15m-gombsor r15-csak-asztal">
        {foGomb()}
        {!be && szerkesztheto ? <Info>{t("r15.mit.holnap_jonnek")}</Info> : null}
      </div>

      <div className="r15-linksor">
        {/* döntés 10-06 (Kati #17, Csilla #40): a „Mit találtunk eddig?” link (→ Találatok pontosítása) lekerült Tibor útjáról */}
        <HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")}</HalkLink>
      </div>

      {reszletek ? (
        <Reszletek>
          <div className="r15m-reszletek">
            <div className="r15m-blokk">
              <span className="r15m-resz-cim">{t("r15.mit.kit_kerdes")}</span>
              <div className="r15m-radiok" role="radiogroup" aria-label={t("r15.mit.kit_kerdes")}>
                <label className="r15m-radio"><input type="radio" name="kit" checked={sajatNevMod === "csak_szervezet"} onChange={() => sajatNevValtas("csak_szervezet")} disabled={!szerkesztheto} />{t("r15.mit.csak_cegrol")}</label>
                <label className="r15m-radio"><input type="radio" name="kit" checked={sajatNevMod === "nevemet_is"} onChange={() => sajatNevValtas("nevemet_is")} disabled={!szerkesztheto} />{t("r15.mit.rolam_is")}</label>
              </div>
              {sajatNevMod === "nevemet_is"
                ? <input className="r15m-mezo" value={sajatNev} aria-label={t("r15.mit.rolam_is")} onChange={(e) => sajatNevMentes(e.target.value)} disabled={!szerkesztheto} />
                : <span className="r15m-sugo">{t("r15.mit.rolam_is_sugo")}</span>}
            </div>
            <div className="r15m-mezok">
              {mezo("r15.mit.mas_neven", elsoTema?.nevvaltozatok.join(", ") ?? "", (s) => {
                const temak = [...beallitas.temak];
                if (temak[0]) { temak[0] = { ...temak[0], nevvaltozatok: vesszovel(s) }; frissitMezo("temak", temak); }
              }, "r15.mit.vesszovel", beallitas.temak.length === 0)}
              {mezo("r15.mit.hol", beallitas.foldrajzi_fokusz, (s) => frissitMezo("foldrajzi_fokusz", s))}
              {mezo("r15.mit.nem_erdekel", beallitas.kizarasok.join(", "), (s) => frissitMezo("kizarasok", vesszovel(s)), "r15.mit.vesszovel")}
              {mezo("r15.mit.ha_mast_jelent", elsoTema?.megkulonboztetes ?? "", (s) => {
                const temak = [...beallitas.temak];
                if (temak[0]) { temak[0] = { ...temak[0], megkulonboztetes: s }; frissitMezo("temak", temak); }
              }, "r15.mit.ha_mast_jelent_sugo", beallitas.temak.length === 0)}
            </div>
            <div className="r15m-szovegek">
              <p>{t("r15.mit.mi_tortenik")}</p>
              <p>{t("r15.mit.korlat", { cikk: HF_NAPI_CIKK, nap: Math.round(HF_CIKK_MAX_KOR_ORA / 24) })}</p>
              <p>{t("r15.mit.oszinte")}</p>
              {oldalak && oldalak.max !== null ? <p>{t("r15.mit.oldal_szamlalo", { szabad: Math.max(0, oldalak.max - oldalak.db), n: oldalak.db, m: oldalak.max })}</p> : null}
              <p>{t("r15.mit.holnaptol")}</p>
            </div>
            <div className="r15m-muveletek">
              {szerkesztheto ? (
                <HalkGomb onClick={() => void keressMost()} disabled={keresAllapot === "fut" || !vanAktiv} aria-busy={keresAllapot === "fut"}>
                  {keresAllapot === "fut" && keresHaladas ? t("r15.mit.keresunk", { f: keresHaladas.forrasok_letoltve, m: keresHaladas.forrasok_osszes }) : t("r15.mit.keress_most")}
                </HalkGomb>
              ) : null}
              {szerkesztheto ? <HalkLink onClick={() => void javaslatKeres()} disabled={javaslatFolyik}>{t("r15.mit.mast_javasolj")}</HalkLink> : null}
              {mentveIdo !== null ? <Info>{t("r15.mit.mentve", { ido: mentveIdo })}</Info> : null}
            </div>
            {keresAllapot === "kesz" ? <Info>{t("r15.mit.kereses_kesz")}</Info> : null}
            {keresHiba ? <Info>{t("r15.mit.inditas_hiba")}</Info> : null}
            {be && szerkesztheto ? (
              <div className="r15m-muveletek">
                <HalkGomb onClick={() => void reggeliKi()} disabled={kiFolyik} aria-busy={kiFolyik}>{t("r15.mit.reggeli_ki")}</HalkGomb>
              </div>
            ) : null}
          </div>
        </Reszletek>
      ) : null}

      <div className="r15-also-sav">{foGomb()}</div>
    </section>,
  );
}
