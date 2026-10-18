"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FELIRAT_SEMA_VERZIO,
  FeliratSzintAllapot,
  ALAP_NYELV,
  NYELVEK,
  feliratCsomagEllenoriz,
  feliratCsoport,
  hibakodhozKotott,
  type FeliratFelulirasok,
  type FeliratHiba,
  type FeliratSzotar,
  type Nyelv,
} from "@rogton/design-system";
import { useFeliratok } from "../../nyelv/kliens";
import { FajlValaszto, fajlnevSzelet, fajltLetolt, hivas } from "../_kozos/kliens";

// A feliratok szerkesztője (E-16) — az R-7c 07 artboard szerint.
// A tulajdonos a SAJÁT SZERVEZET szövegeit írja át (alatta: közös + alap), a rendszergazda a KÖZÖS alapot (alatta: alap).
// A szerkesztés a tervezetbe megy; „Alkalmazás” után látja mindenki. Kulcsot nem lehet felvenni vagy törölni — a kódból jönnek.
// A szerkesztő egy nyelven nyitva (nyelvfül), a technikai kulcs halkan a másodlagos sorban.

type Szint = "szervezet" | "kozos";
type Betoltes = "kesz" | "folyik" | "hiba";
type Szuro = "mind" | "sajat" | "hianyzo";
type Uzenet = { ok: boolean; szoveg: string } | null;
/** A szerkesztett készlet: nyelvenként kulcs → szöveg (üres = az alatta lévő érték jön). */
type Keszlet = Record<Nyelv, FeliratSzotar>;

const OLDAL = 10;
/** A csoportok sorrendje a bal oszlopban (a rajz szerint); ami nincs itt, a végére kerül. */
const CSOPORT_SORREND = ["kozos", "nav", "kezdolap", "regisztracio", "belepes", "visszaallitas", "szervezet", "hiba", "nyelv", "onboarding", "onboarding1", "onboarding2", "onboarding3", "elonezet", "jelveny", "jelzes", "kesz", "mezo", "fiok", "arculat_fajl", "fajl", "szerep", "hozzaferes", "tagok", "meghivo", "hf", "sajat", "beallitasok", "ertesites", "esemeny", "adatpolitika", "ai_kapcsolo", "gephaz", "csomag", "penznem", "koltseg", "kimeno", "nyitolap", "tema", "ter", "feliratok", "fiokok", "gazdanav"];

function felulirasokbolKeszlet(f: FeliratFelulirasok | null): Keszlet {
  return { hu: { ...(f?.hu ?? {}) }, ro: { ...(f?.ro ?? {}) }, en: { ...(f?.en ?? {}) } };
}

export function Feliratok({ kezdo, szervezetNev, tulajdonos, rendszergazda }: { kezdo: FeliratSzintAllapot; szervezetNev: string; tulajdonos: boolean; rendszergazda: boolean }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const [szint, setSzint] = useState<Szint>("szervezet");
  const [adat, setAdat] = useState<FeliratSzintAllapot>(kezdo);
  const [keszlet, setKeszlet] = useState<Keszlet>(() => felulirasokbolKeszlet(kezdo.tervezet?.felulirasok ?? kezdo.alkalmazott?.felulirasok ?? null));
  const [betoltes, setBetoltes] = useState<Betoltes>("kesz");
  const [piszkos, setPiszkos] = useState(false);
  const [uzenet, setUzenet] = useState<Uzenet>(null);
  const [importHibak, setImportHibak] = useState<{ kulcs: string; nyelv: string; szoveg: string }[]>([]);
  const [csoport, setCsoport] = useState<string>(() => elsoCsoport(kezdo.kulcsok));
  const [kereses, setKereses] = useState("");
  const [szuro, setSzuro] = useState<Szuro>("mind");
  const [mutat, setMutat] = useState(OLDAL);
  const [ioSzoveg, setIoSzoveg] = useState("");
  const [fut, setFut] = useState(false);
  /** A szerkesztőben nyitott nyelv (nyelvfül) — alapból a felület nyelve. */
  const [nyitottNyelv, setNyitottNyelv] = useState<Nyelv>(() => (NYELVEK.includes(nyelv as Nyelv) ? (nyelv as Nyelv) : ALAP_NYELV));

  const szerkesztheto = szint === "kozos" ? rendszergazda : tulajdonos;
  const apiUt = szint === "kozos" ? "/api/feliratok/kozos" : "/api/feliratok";

  /** Egy kulcs értéke egy nyelven a szerkesztett készletben: a saját felülírás, vagy az alatta lévő. */
  const ertek = (k: string, ny: Nyelv): string => keszlet[ny][k] ?? adat.alatta[ny][k] ?? "";
  const sajat = (k: string): boolean => NYELVEK.some((ny) => (keszlet[ny][k] ?? "") !== "" && keszlet[ny][k] !== adat.alatta[ny][k]);
  /** Hiányzó fordítás: az adott nyelven se saját, se alatta lévő érték nincs (a magyar tartalék látszik). */
  const hianyzik = (k: string, ny: Nyelv): boolean => ny !== ALAP_NYELV && (keszlet[ny][k] ?? "") === "" && (adat.alatta[ny][k] ?? "") === "";
  const hianyzoBarhol = (k: string): boolean => NYELVEK.some((ny) => hianyzik(k, ny));

  // --- csoportok és a lista ---
  const csoportok = useMemo(() => {
    const db = new Map<string, number>();
    for (const k of adat.kulcsok) db.set(feliratCsoport(k), (db.get(feliratCsoport(k)) ?? 0) + 1);
    return [...db.entries()].sort((a, b) => sorrend(a[0]) - sorrend(b[0]));
  }, [adat.kulcsok]);
  const keresesKisbetu = kereses.trim().toLowerCase();
  const lista = useMemo(() => {
    const mindenhol = Boolean(keresesKisbetu) || szuro !== "mind";
    const alap = mindenhol ? adat.kulcsok : adat.kulcsok.filter((k) => feliratCsoport(k) === csoport);
    return alap.filter((k) => {
      if (szuro === "sajat" && !sajat(k)) return false;
      if (szuro === "hianyzo" && !hianyzoBarhol(k)) return false;
      if (!keresesKisbetu) return true;
      if (k.toLowerCase().includes(keresesKisbetu)) return true;
      return NYELVEK.some((ny) => ertek(k, ny).toLowerCase().includes(keresesKisbetu));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adat, keszlet, csoport, keresesKisbetu, szuro]);
  const sajatDb = adat.kulcsok.filter(sajat).length;
  const hianyzoDb = adat.kulcsok.filter(hianyzoBarhol).length;
  const csoportDb = adat.kulcsok.filter((k) => feliratCsoport(k) === csoport);

  function csoportNev(c: string): string {
    const kulcs = `feliratok.csoport_${c}`;
    const sz = t(kulcs);
    return sz === kulcs ? c : sz;
  }

  // --- szerkesztés ---
  function szovegValtozik(k: string, ny: Nyelv, v: string) {
    setKeszlet((e) => ({ ...e, [ny]: { ...e[ny], [k]: v } }));
    setPiszkos(true); setUzenet(null); setImportHibak([]);
  }
  function visszaAlatta(k: string) {
    setKeszlet((e) => { const uj = { hu: { ...e.hu }, ro: { ...e.ro }, en: { ...e.en } }; for (const ny of NYELVEK) delete uj[ny][k]; return uj; });
    setPiszkos(true); setUzenet(null);
  }

  /** A küldendő csomag: minden nyelven a szerkesztett kulcsok (az alatta lévővel egyező vagy üres értéket a kiszolgáló kiszűri). */
  function csomag(): { $schema: typeof FELIRAT_SEMA_VERZIO; feliratok: Record<string, FeliratSzotar> } {
    const f: Record<string, FeliratSzotar> = {};
    for (const ny of NYELVEK) {
      const d: FeliratSzotar = {};
      for (const [k, v] of Object.entries(keszlet[ny])) if (v.trim() !== "") d[k] = v;
      f[ny] = d;
    }
    return { $schema: FELIRAT_SEMA_VERZIO, feliratok: f };
  }
  function adatValaszbol(torzs: Record<string, unknown>): FeliratSzintAllapot | null {
    const e = FeliratSzintAllapot.safeParse(torzs["feliratok"]);
    return e.success ? e.data : null;
  }
  function hibaSzoveg(h: FeliratHiba): string {
    const kulcs = `feliratok.ellenorzes_${h.kod.replace(/[A-Z]/g, (b) => "_" + b.toLowerCase())}`;
    const sablon = t(kulcs);
    return (sablon === kulcs ? h.kod : sablon).replace(/\{([^}]+)\}/g, (egesz, nev: string) => (nev in h.parameterek ? String(h.parameterek[nev]) : egesz));
  }

  async function betolt(uj: Szint) {
    setBetoltes("folyik"); setUzenet(null); setImportHibak([]);
    try {
      const v = await fetch(uj === "kozos" ? "/api/feliratok/kozos" : "/api/feliratok", { credentials: "same-origin" });
      if (v.status === 401) { router.push("/belepes"); return; }
      const torzs = (await v.json()) as { feliratok?: unknown };
      const a = FeliratSzintAllapot.parse(torzs.feliratok);
      setAdat(a); setKeszlet(felulirasokbolKeszlet(a.tervezet?.felulirasok ?? a.alkalmazott?.felulirasok ?? null)); setPiszkos(false); setBetoltes("kesz"); setMutat(OLDAL);
    } catch { setBetoltes("hiba"); }
  }
  function szintValt(e: ChangeEvent<HTMLSelectElement>) {
    const uj = e.target.value === "kozos" ? "kozos" : "szervezet";
    setSzint(uj); void betolt(uj);
  }

  function elvet() {
    if (betoltes !== "kesz") return;
    setKeszlet(felulirasokbolKeszlet(adat.alkalmazott?.felulirasok ?? null)); setPiszkos(false); setImportHibak([]);
    setUzenet({ ok: true, szoveg: t("feliratok.notice_discard") });
  }
  async function tervezetMent(): Promise<boolean> {
    if (betoltes !== "kesz") { setUzenet({ ok: false, szoveg: t("feliratok.betoltes_load_err") }); return false; }
    setFut(true);
    const r = await hivas(apiUt, "PUT", csomag());
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return false; }
    if (r.statusz !== 200) { setUzenet({ ok: false, szoveg: t("feliratok.notice_draft_err") }); return false; }
    const uj = adatValaszbol(r.torzs);
    if (uj) { setAdat(uj); setKeszlet(felulirasokbolKeszlet(uj.tervezet?.felulirasok ?? null)); }
    return true;
  }
  async function tervezetMentGomb() {
    if (await tervezetMent()) setUzenet({ ok: true, szoveg: t("feliratok.notice_draft_ok") });
  }
  async function alkalmaz() {
    if (betoltes !== "kesz") { setUzenet({ ok: false, szoveg: t("feliratok.betoltes_load_err") }); return; }
    setFut(true);
    const mentve = await hivas(apiUt, "PUT", csomag());
    const r = mentve.statusz === 200 ? await hivas(`${apiUt}/alkalmaz`, "POST", {}) : mentve;
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz !== 200) { setUzenet({ ok: false, szoveg: t("feliratok.notice_apply_err") }); return; }
    const uj = adatValaszbol(r.torzs);
    if (uj) { setAdat(uj); setKeszlet(felulirasokbolKeszlet(uj.alkalmazott?.felulirasok ?? null)); }
    setPiszkos(false); setUzenet({ ok: true, szoveg: t("feliratok.notice_applied") });
    router.refresh();
  }
  async function visszaallit(verzio: number) {
    if (betoltes !== "kesz") return;
    setFut(true);
    const r = await hivas(`${apiUt}/visszaallit`, "POST", { verzio });
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    const uj = r.statusz === 200 ? adatValaszbol(r.torzs) : null;
    if (!uj || !uj.tervezet) { setUzenet({ ok: false, szoveg: t("feliratok.notice_visszaallitas_err") }); return; }
    setAdat(uj); setKeszlet(felulirasokbolKeszlet(uj.tervezet.felulirasok)); setPiszkos(true); setImportHibak([]);
    setUzenet({ ok: true, szoveg: t("feliratok.notice_visszaallitva", { n: verzio }) });
  }
  function exportal() {
    const cs = csomag();
    setIoSzoveg(JSON.stringify(cs, null, 2));
    setUzenet({ ok: true, szoveg: t("feliratok.notice_export") }); setImportHibak([]);
  }
  function exportalFajlba() {
    const nev = `feliratok-${szint === "kozos" ? "kozos-alap" : fajlnevSzelet(szervezetNev)}-${new Date().toISOString().slice(0, 10)}.json`;
    fajltLetolt(nev, JSON.stringify(csomag(), null, 2));
    setUzenet({ ok: true, szoveg: t("feliratok.notice_export_fajl", { nev }) }); setImportHibak([]);
  }
  function importalFajlbol(szoveg: string) {
    setIoSzoveg(szoveg);
    importal(szoveg);
  }
  function importal(forras?: string) {
    if (betoltes !== "kesz") { setUzenet({ ok: false, szoveg: t("feliratok.betoltes_load_err") }); return; }
    let obj: unknown = null;
    try { obj = JSON.parse(forras ?? ioSzoveg); } catch { setUzenet({ ok: false, szoveg: t("feliratok.notice_json") }); setImportHibak([]); return; }
    const e = feliratCsomagEllenoriz(obj, new Set(adat.kulcsok));
    if (!e.ok) { setImportHibak(e.hibak.map((h) => ({ kulcs: h.kulcs, nyelv: h.nyelv, szoveg: hibaSzoveg(h) }))); setUzenet(null); return; }
    const ign = e.figyelmenKivul.length ? t("feliratok.ignored", { n: e.figyelmenKivul.length }) : "";
    setKeszlet((k) => ({ hu: { ...k.hu, ...(e.feliratok.hu ?? {}) }, ro: { ...k.ro, ...(e.feliratok.ro ?? {}) }, en: { ...k.en, ...(e.feliratok.en ?? {}) } }));
    setPiszkos(true); setImportHibak([]);
    setUzenet({ ok: true, szoveg: t("feliratok.notice_import_ok", { ign }) });
  }

  const kesz = betoltes === "kesz";
  const datum = (iso: string) => { try { return new Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(new Date(iso)); } catch { return iso; } };
  const alattaNev = szint === "kozos" ? t("feliratok.allapot_alap") : t("feliratok.allapot_kozos");
  const visszaNev = szint === "kozos" ? t("feliratok.vissza_alapra") : t("feliratok.vissza_kozosre");
  const csoportSajat = csoportDb.filter(sajat).length;
  const csoportHianyzo = csoportDb.filter(hianyzoBarhol).length;
  const lathato = lista.slice(0, mutat);
  const mindenhol = Boolean(keresesKisbetu) || szuro !== "mind";

  return (
    <div className="km-tema km-feliratok">
      <header className="km-tema-fejlec">
        <div className="km-tema-fejlec-bal">
          <div className="km-tema-cim">{t("feliratok.cim")}</div>
          <span className="km-tema-szint">{szint === "kozos" ? t("feliratok.szint_kozos") : t("feliratok.szint_szervezet")}</span>
          <span className="km-tema-piszkos" data-piszkos={piszkos ? "true" : "false"}>{piszkos ? t("tema.dirty") : t("tema.synced")}</span>
        </div>
        <div className="km-tema-fejlec-jobb">
          {rendszergazda ? (
            <select className="km-tema-allapot-valaszto" value={szint} onChange={szintValt} aria-label={t("tema.szint_valaszto")} disabled={fut}>
              <option value="szervezet">{t("tema.szint_valaszto_szervezet")} — {szervezetNev}</option>
              <option value="kozos">{t("tema.szint_valaszto_kozos")}</option>
            </select>
          ) : null}
          <button type="button" className="km-tema-gomb" onClick={elvet} disabled={!kesz || fut || !szerkesztheto}><span className="km-csak-asztal">{t("tema.discard")}</span><span className="km-csak-telefon">{t("feliratok.discard_rovid")}</span></button>
          <button type="button" className="km-tema-gomb km-tema-gomb-kiemelt" onClick={tervezetMentGomb} disabled={!kesz || fut || !szerkesztheto}>{t("tema.save_draft")}</button>
          <button type="button" className="km-tema-gomb-alkalmaz" onClick={alkalmaz} disabled={!kesz || fut || !szerkesztheto}><span className="km-csak-asztal">{t(szint === "kozos" ? "feliratok.apply_kozos" : "feliratok.apply")}</span><span className="km-csak-telefon">{t("feliratok.apply_rovid")}</span></button>
        </div>
      </header>

      <div className="km-feliratok-nyelvfulek" role="tablist" aria-label={t("feliratok.cim")}>
        {NYELVEK.map((ny) => (
          <button
            key={ny}
            type="button"
            role="tab"
            aria-selected={nyitottNyelv === ny ? "true" : "false"}
            data-be={nyitottNyelv === ny ? "true" : "false"}
            className="km-feliratok-nyelvfulek-gomb"
            onClick={() => setNyitottNyelv(ny)}
          >
            {t(`feliratok.nyelv_${ny}`)}
          </button>
        ))}
      </div>

      {betoltes === "folyik" ? <div className="km-tema-uzenet" data-fajta="info" aria-live="polite">{t("feliratok.betoltes_loading")}</div> : null}
      {betoltes === "hiba" ? (
        <div className="km-tema-uzenet" data-fajta="hiba" aria-live="assertive">
          {t("feliratok.betoltes_load_err")}
          <button type="button" className="km-tema-uzenet-gomb" onClick={() => void betolt(szint)}>{t("feliratok.betoltes_retry")}</button>
        </div>
      ) : null}
      {!szerkesztheto ? <div className="km-tema-uzenet" data-fajta="figyelem">{szint === "kozos" ? t("feliratok.nincs_jog_kozos") : t("feliratok.csak_tulajdonos")}</div> : null}
      {uzenet ? <div className="km-tema-uzenet" data-fajta={uzenet.ok ? "ok" : "hiba"} aria-live="polite">{uzenet.szoveg}</div> : null}
      {importHibak.length ? (
        <div className="km-tema-uzenet" data-fajta="hiba" aria-live="assertive">
          <div className="km-tema-uzenet-cim">{t("feliratok.import_err_intro")}</div>
          {importHibak.map((h, i) => <div key={i}><code>{h.kulcs}{h.nyelv ? ` (${h.nyelv})` : ""}</code> — {h.szoveg}</div>)}
        </div>
      ) : null}

      {kesz ? (
        <main className="km-lap-keret km-feliratok-fo">
          <aside className="km-feliratok-oldalsav">
            <div className="km-tema-szekcio km-feliratok-csoportok">
              <div className="km-feliratok-csoportok-cim">{t("feliratok.csoportok")}</div>
              <select className="km-feliratok-csoport-valaszto" value={mindenhol ? "" : csoport} onChange={(e) => { setCsoport(e.target.value); setKereses(""); setSzuro("mind"); setMutat(OLDAL); }} aria-label={t("feliratok.csoportok")}>
                {mindenhol ? <option value="">{t("feliratok.szuro_mind")}</option> : null}
                {csoportok.map(([c, n]) => <option key={c} value={c}>{csoportNev(c)} ({n})</option>)}
              </select>
              <nav className="km-feliratok-csoportlista">
                {csoportok.map(([c, n]) => (
                  <button type="button" key={c} className="km-feliratok-csoport" data-be={c === csoport && !mindenhol ? "true" : "false"} onClick={() => { setCsoport(c); setKereses(""); setSzuro("mind"); setMutat(OLDAL); }}>
                    <span className="km-feliratok-csoport-nev" title={csoportNev(c)}>{csoportNev(c)}</span><span className="km-feliratok-csoport-db">{n}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="km-tema-szekcio km-feliratok-szamlalo">
              <div><span>{t("feliratok.osszes")}</span><strong>{adat.kulcsok.length}</strong></div>
              <div><span>{t("feliratok.sajat_db")}</span><strong data-szin="ok">{sajatDb}</strong></div>
              <div><span>{t("feliratok.hianyzo_db")}</span><strong data-szin="figyelem">{hianyzoDb}</strong></div>
            </div>
          </aside>

          <div className="km-feliratok-tartalom">
            <section className="km-tema-szekcio">
              <div className="km-feliratok-fej">
                <h2 className="km-tema-szekcio-cim">{mindenhol ? t("feliratok.szuro_mind") : csoportNev(csoport)}</h2>
                <span className="km-feliratok-fej-osszeg">{t("feliratok.csoport_osszeg", { n: mindenhol ? lista.length : csoportDb.length, sajat: mindenhol ? lista.filter(sajat).length : csoportSajat, hianyzo: mindenhol ? lista.filter(hianyzoBarhol).length : csoportHianyzo })}</span>
              </div>
              <div className="km-tema-jegyzet km-feliratok-magyarazat">{szint === "kozos" ? t("feliratok.magyarazat_kozos") : t("feliratok.magyarazat")}</div>
              <div className="km-feliratok-eszkozok">
                <div className="km-feliratok-kereses">
                  <input className="km-feliratok-kereses-mezo" type="search" value={kereses} onChange={(e) => { setKereses(e.target.value); setMutat(OLDAL); }} placeholder={t("feliratok.kereses_pl")} aria-label={t("feliratok.kereses_pl")} />
                  <svg className="km-feliratok-kereses-ikon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                </div>
                <div className="km-tema-mod km-feliratok-szurok">
                  {(["mind", "sajat", "hianyzo"] as Szuro[]).map((sz) => (
                    <button type="button" key={sz} className="km-tema-mod-gomb" data-be={szuro === sz ? "true" : "false"} onClick={() => { setSzuro(sz); setMutat(OLDAL); }}>{t(`feliratok.szuro_${sz}`)}</button>
                  ))}
                </div>
              </div>

              {lista.length === 0 ? <div className="km-feliratok-ures">{t("feliratok.nincs_talalat")}</div> : (
                <div className="km-feliratok-lista">
                  {lathato.map((k) => {
                    const s = sajat(k);
                    const h = hianyzoBarhol(k);
                    const tartalek = hianyzik(k, nyitottNyelv);
                    const v = tartalek ? ertek(k, ALAP_NYELV) : ertek(k, nyitottNyelv);
                    const angolEredeti = nyitottNyelv !== ALAP_NYELV ? ertek(k, ALAP_NYELV) : "";
                    return (
                      <div key={k} className="km-feliratok-kartya" data-sajat={s ? "true" : "false"}>
                        <div className="km-feliratok-kartya-fej">
                          <code className="km-tema-kod km-feliratok-kulcs-halk">{k}</code>
                          {s ? <span className="km-feliratok-allapot" data-fajta="sajat">{t("feliratok.allapot_sajat")}</span>
                            : h ? <span className="km-feliratok-allapot" data-fajta="hianyzo">{t("feliratok.allapot_hianyzo")}</span>
                            : <span className="km-feliratok-allapot" data-fajta="kozos">{alattaNev}</span>}
                          {hibakodhozKotott(k) ? <span className="km-feliratok-allapot" data-fajta="hibakod">{t("feliratok.hibakod")}</span> : null}
                          {s ? <div className="km-feliratok-kartya-jobb"><button type="button" className="km-tema-gomb km-feliratok-vissza" onClick={() => visszaAlatta(k)} disabled={!szerkesztheto}>{visszaNev}</button></div> : null}
                        </div>
                        <div className="km-feliratok-nyelv-szerkeszto">
                          <div className="km-feliratok-nyelv-cimke">{t(`feliratok.nyelv_${nyitottNyelv}`)}</div>
                          <textarea className="km-feliratok-mezo" data-tartalek={tartalek ? "true" : "false"} value={tartalek ? "" : v} placeholder={tartalek ? v : ""} onChange={(e) => szovegValtozik(k, nyitottNyelv, e.target.value)} disabled={!szerkesztheto} rows={2} aria-label={`${k} — ${t(`feliratok.nyelv_${nyitottNyelv}`)}`} />
                          {tartalek ? <div className="km-feliratok-tartalek">{t("feliratok.tartalek")}</div> : null}
                          {angolEredeti ? <div className="km-feliratok-kulcs-halk">{t("feliratok.angol_eredeti")}: {angolEredeti}</div> : null}
                        </div>
                        {s ? <div className="km-feliratok-vissza-also"><button type="button" className="km-tema-gomb km-feliratok-vissza" onClick={() => visszaAlatta(k)} disabled={!szerkesztheto}>{visszaNev}</button></div> : null}
                      </div>
                    );
                  })}
                </div>
              )}
              {lista.length > mutat ? (
                <div className="km-feliratok-tovabbi"><button type="button" className="km-tema-gomb" onClick={() => setMutat((m) => m + OLDAL)}>{t("feliratok.tovabbi", { n: Math.min(OLDAL, lista.length - mutat) })}</button></div>
              ) : null}
            </section>

            <div className="km-feliratok-also">
              <section className="km-tema-szekcio">
                <h2 className="km-tema-szekcio-cim">{t("tema.io")}</h2>
                <div className="km-tema-io-gombok">
                  <button type="button" className="km-tema-gomb" onClick={exportal}>{t("tema.export")}</button>
                  <button type="button" className="km-tema-gomb" onClick={() => importal()} disabled={!szerkesztheto}>{t("tema.import")}</button>
                  <button type="button" className="km-tema-gomb" onClick={exportalFajlba}>{t("tema.export_fajl")}</button>
                  <FajlValaszto cimke={t("tema.import_fajl")} className="km-tema-gomb" disabled={!szerkesztheto} beolvasva={importalFajlbol} />
                </div>
                <textarea className="km-tema-io-mezo" dir="ltr" rows={5} value={ioSzoveg} onChange={(e) => setIoSzoveg(e.target.value)} placeholder='{"$schema":"km-feliratok/1","feliratok":{"ro":{"belepes.gomb":"Intră"}}}' aria-label="Feliratok JSON" />
                <div className="km-tema-jegyzet">{t("feliratok.io_note")}</div>
              </section>
              <section className="km-tema-szekcio">
                <h2 className="km-tema-szekcio-cim">{t("tema.verziok")}</h2>
                <div className="km-tema-jegyzet">{t("tema.verziok_jegyzet")}</div>
                {adat.verziok.length === 0 ? <div className="km-tema-verzio-ures">{t("tema.verziok_ures")}</div> : (
                  <ul className="km-tema-verziok">
                    {adat.verziok.map((v) => (
                      <li key={v.verzio} className="km-tema-verzio" data-allapot={v.allapot}>
                        <span className="km-tema-verzio-nev">{t("tema.verzio_sor", { n: v.verzio })}</span>
                        <span className="km-tema-verzio-allapot">{t(`tema.allapot_${v.allapot}`)}</span>
                        <span className="km-tema-verzio-datum">{datum(v.alkalmazva ?? v.letrehozva)}</span>
                        {v.allapot === "korabbi" ? <button type="button" className="km-tema-gomb km-tema-verzio-gomb" onClick={() => void visszaallit(v.verzio)} disabled={fut || !szerkesztheto}>{t("tema.visszaallit")}</button> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </main>
      ) : null}
    </div>
  );
}

function sorrend(c: string): number {
  const i = CSOPORT_SORREND.indexOf(c);
  return i === -1 ? 999 : i;
}
function elsoCsoport(kulcsok: string[]): string {
  const meglevo = new Set(kulcsok.map(feliratCsoport));
  return CSOPORT_SORREND.find((c) => meglevo.has(c)) ?? (kulcsok[0] ? feliratCsoport(kulcsok[0]) : "");
}
