"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlapTokenek,
  KozosTemaAllapot,
  SzervezetTemaAllapot,
  TOKEN_KULCSOK,
  TOKEN_SZABALYOK,
  egyesit,
  olvashatosagiFigyelmeztetesek,
  szinRgb,
  teljesTokenek,
  temaEllenoriz,
  type TemaHiba,
  type TemaVerzioFej,
} from "@rogton/design-system";
import temaAlap from "@rogton/design-system/tema-alap.json";
import { useFeliratok } from "../../nyelv/kliens";
import { FajlValaszto, fajlnevSzelet, fajltLetolt, hivas } from "../_kozos/kliens";
import { ElonezetPanel, type ElonezetAllapot } from "./ElonezetPanel";
import { TerkozCsoport } from "./TerkozCsoport";
import { SemaValaszto } from "./SemaValaszto";
import "./sema-valaszto.css";

export type Szint = "szervezet" | "kozos";
type Betoltes = "kesz" | "folyik" | "hiba";
type Uzenet = { ok: boolean; szoveg: string } | null;

type SzintAdat = { alap: AlapTokenek; alkalmazott: AlapTokenek; tervezet: AlapTokenek | null; verziok: TemaVerzioFej[] };

const ALAP_CSOMAG = AlapTokenek.parse((temaAlap as { tokens: unknown }).tokens);

export function szervezetAdat(a: SzervezetTemaAllapot): SzintAdat {
  return { alap: a.alap, alkalmazott: a.hatasos, tervezet: a.tervezet ? egyesit(a.alap, a.tervezet.felulirasok) : null, verziok: a.verziok };
}
export function kozosAdat(a: KozosTemaAllapot): SzintAdat {
  return { alap: ALAP_CSOMAG, alkalmazott: a.alkalmazott.tokenek, tervezet: a.tervezet?.tokenek ?? null, verziok: a.verziok };
}

const px = (v: string | undefined): number => parseInt(v ?? "", 10) || 0;
function hexSzin(v: string | undefined): string {
  const rgb = szinRgb(v);
  if (!rgb) return "#000000"; // tokenőr: ok — a színválasztó technikai tartaléka, nem festett érték
  return "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");
}

const BETUK = [
  { v: "'Archivo',sans-serif", n: "Archivo" }, { v: "'Space Grotesk',sans-serif", n: "Space Grotesk" },
  { v: "'IBM Plex Sans',sans-serif", n: "IBM Plex Sans" }, { v: "'Public Sans',sans-serif", n: "Public Sans" }, { v: "Georgia,serif", n: "Georgia (serif)" },
];
const KOD_BETUK = [{ v: "'IBM Plex Mono',monospace", n: "IBM Plex Mono" }, { v: "monospace", n: "monospace (rendszer)" }, { v: "'Courier New',monospace", n: "Courier New" }];
const ARAB_CIM = [{ v: "'Cairo','Archivo',sans-serif", n: "Cairo" }, { v: "'Tajawal',sans-serif", n: "Tajawal" }];
const ARAB_SZOVEG = [{ v: "'Tajawal','Public Sans',sans-serif", n: "Tajawal" }, { v: "'Cairo',sans-serif", n: "Cairo" }];
const SZIN_MEZOK: (keyof AlapTokenek)[] = ["--bg", "--bg-elev", "--text", "--text-mut", "--primary", "--primary-2", "--accent-warm", "--accent-gold", "--on-primary", "--accent", "--accent-text", "--ok", "--err", "--focus", "--keszul", "--olvasatlan"];

const TER_KULCSOK = Object.keys(TOKEN_SZABALYOK).filter((k) => k.startsWith("--ter-")) as (keyof AlapTokenek)[];

type CsoportFul = "szin" | "betu" | "meret" | "forma" | "terkoz" | "egyeb";

export function Tema({ kezdo, szervezetNev, tulajdonos, rendszergazda }: { kezdo: SzervezetTemaAllapot; szervezetNev: string; tulajdonos: boolean; rendszergazda: boolean }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const [szint, setSzint] = useState<Szint>("szervezet");
  const [adat, setAdat] = useState<SzintAdat>(() => szervezetAdat(kezdo));
  const [tokenek, setTokenek] = useState<AlapTokenek>(() => { const a = szervezetAdat(kezdo); return a.tervezet ?? a.alkalmazott; });
  const [betoltes, setBetoltes] = useState<Betoltes>("kesz");
  const [piszkos, setPiszkos] = useState(false);
  const [uzenet, setUzenet] = useState<Uzenet>(null);
  const [importHibak, setImportHibak] = useState<{ token: string; szoveg: string }[]>([]);
  const [advNyitva, setAdvNyitva] = useState(false);
  const [mobil, setMobil] = useState(false);
  const [allapotNezet, setAllapotNezet] = useState<ElonezetAllapot>("normal");
  const [ioSzoveg, setIoSzoveg] = useState("");
  const [fut, setFut] = useState(false);
  const [aktivFul, setAktivFul] = useState<CsoportFul>("szin");

  const szerkesztheto = szint === "kozos" ? rendszergazda : tulajdonos;
  const apiUt = szint === "kozos" ? "/api/tema/kozos" : "/api/tema";
  const teljes = useMemo(() => teljesTokenek(tokenek), [tokenek]);
  const figyelmeztetesek = useMemo(() => olvashatosagiFigyelmeztetesek(tokenek), [tokenek]);

  function tokenBeallit(kulcs: keyof AlapTokenek, ertek: string) {
    setTokenek((elozo) => ({ ...elozo, [kulcs]: ertek }));
    setPiszkos(true); setUzenet(null); setImportHibak([]);
  }
  const setSzin = (k: keyof AlapTokenek) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => tokenBeallit(k, e.target.value);
  const setPx = (k: keyof AlapTokenek) => (e: ChangeEvent<HTMLInputElement>) => tokenBeallit(k, `${e.target.value}px`);
  const setNyers = (k: keyof AlapTokenek) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => tokenBeallit(k, String(e.target.value));

  async function betolt(uj: Szint) {
    setBetoltes("folyik"); setUzenet(null); setImportHibak([]);
    try {
      const v = await fetch(uj === "kozos" ? "/api/tema/kozos" : "/api/tema", { credentials: "same-origin" });
      if (v.status === 401) { router.push("/belepes"); return; }
      const torzs = (await v.json()) as { tema?: unknown };
      const a = uj === "kozos" ? kozosAdat(KozosTemaAllapot.parse(torzs.tema)) : szervezetAdat(SzervezetTemaAllapot.parse(torzs.tema));
      setAdat(a); setTokenek(a.tervezet ?? a.alkalmazott); setPiszkos(false); setBetoltes("kesz");
    } catch {
      setBetoltes("hiba");
    }
  }
  function szintValt(e: ChangeEvent<HTMLSelectElement>) {
    const uj = e.target.value === "kozos" ? "kozos" : "szervezet";
    setSzint(uj); void betolt(uj);
  }

  function adatValaszbol(torzs: Record<string, unknown>): SzintAdat | null {
    const e = szint === "kozos" ? KozosTemaAllapot.safeParse(torzs["tema"]) : SzervezetTemaAllapot.safeParse(torzs["tema"]);
    if (!e.success) return null;
    return szint === "kozos" ? kozosAdat(e.data as KozosTemaAllapot) : szervezetAdat(e.data as SzervezetTemaAllapot);
  }

  function hibaSzoveg(h: TemaHiba): string {
    const kulcs = `tema.ellenorzes_${h.kod.replace(/[A-Z]/g, (b) => "_" + b.toLowerCase())}`;
    const sablon = t(kulcs);
    return (sablon === kulcs ? h.kod : sablon).replace(/\{([^}]+)\}/g, (egesz, nev: string) => (nev in h.parameterek ? String(h.parameterek[nev]) : egesz));
  }

  function elvet() {
    if (betoltes !== "kesz") return;
    setTokenek(adat.alkalmazott); setPiszkos(false); setImportHibak([]); setUzenet({ ok: true, szoveg: t("tema.notice_discard") });
  }
  function alapertekek() {
    if (betoltes !== "kesz") return;
    setTokenek(adat.alap); setPiszkos(true); setImportHibak([]); setUzenet({ ok: true, szoveg: t("tema.notice_defaults") });
  }
  async function tervezetMent(): Promise<boolean> {
    if (betoltes !== "kesz") { setUzenet({ ok: false, szoveg: t("tema.betoltes_load_err") }); return false; }
    setFut(true);
    const r = await hivas(apiUt, "PUT", { $schema: "km-theme/2", tokens: tokenek });
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return false; }
    if (r.statusz !== 200) { setUzenet({ ok: false, szoveg: t("tema.notice_draft_err") }); return false; }
    setAdat((a) => adatValaszbol(r.torzs) ?? { ...a, tervezet: tokenek });
    return true;
  }
  async function tervezetMentGomb() {
    if (await tervezetMent()) setUzenet({ ok: true, szoveg: t("tema.notice_draft_ok") });
  }
  async function alkalmaz() {
    if (betoltes !== "kesz") { setUzenet({ ok: false, szoveg: t("tema.betoltes_load_err") }); return; }
    setFut(true);
    const mentve = await hivas(apiUt, "PUT", { $schema: "km-theme/2", tokens: tokenek });
    const r = mentve.statusz === 200 ? await hivas(`${apiUt}/alkalmaz`, "POST", {}) : mentve;
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz !== 200) { setUzenet({ ok: false, szoveg: t("tema.notice_apply_err") }); return; }
    setAdat((a) => adatValaszbol(r.torzs) ?? { ...a, alkalmazott: tokenek, tervezet: null });
    setPiszkos(false); setUzenet({ ok: true, szoveg: t("tema.notice_applied") });
    router.refresh();
  }

  async function visszaallit(verzio: number) {
    if (betoltes !== "kesz") return;
    setFut(true);
    const r = await hivas(`${apiUt}/visszaallit`, "POST", { verzio });
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    const uj = r.statusz === 200 ? adatValaszbol(r.torzs) : null;
    if (!uj || !uj.tervezet) { setUzenet({ ok: false, szoveg: t("tema.notice_visszaallitas_err") }); return; }
    setAdat(uj); setTokenek(uj.tervezet); setPiszkos(true); setImportHibak([]);
    setUzenet({ ok: true, szoveg: t("tema.notice_visszaallitva", { n: verzio }) });
  }

  function exportal() {
    setIoSzoveg(JSON.stringify({ $schema: "km-theme/2", tokens: tokenek }, null, 2));
    setUzenet({ ok: true, szoveg: t("tema.notice_export") }); setImportHibak([]);
  }
  function exportalFajlba() {
    const nev = `tema-${szint === "kozos" ? "kozos-alap" : fajlnevSzelet(szervezetNev)}-${new Date().toISOString().slice(0, 10)}.json`;
    fajltLetolt(nev, JSON.stringify({ $schema: "km-theme/2", tokens: tokenek }, null, 2));
    setUzenet({ ok: true, szoveg: t("tema.notice_export_fajl", { nev }) }); setImportHibak([]);
  }
  function importalFajlbol(szoveg: string) {
    setIoSzoveg(szoveg);
    importal(szoveg);
  }
  function importal(forras?: string) {
    if (betoltes !== "kesz") { setUzenet({ ok: false, szoveg: t("tema.betoltes_load_err") }); return; }
    let obj: unknown = null;
    try { obj = JSON.parse(forras ?? ioSzoveg); } catch { setUzenet({ ok: false, szoveg: t("tema.notice_json") }); setImportHibak([]); return; }
    const e = temaEllenoriz(obj);
    if (!e.ok) { setImportHibak(e.hibak.map((h) => ({ token: h.token, szoveg: hibaSzoveg(h) }))); setUzenet(null); return; }
    const ign = e.figyelmenKivul.length ? t("tema.ignored", { n: e.figyelmenKivul.length }) : "";
    setTokenek({ ...adat.alap, ...e.tokenek }); setPiszkos(true); setImportHibak([]);
    setUzenet({ ok: true, szoveg: t("tema.notice_import_ok", { ign }) });
  }

  const szinCimke = (k: keyof AlapTokenek) => (k === "--bg" ? `${t("tema.colors")} — bg` : k.replace(/^--/, ""));
  const csuszkaCimke = (cimke: string, ertek: string, token: string) => (
    <label className="km-tema-cimke">{cimke}: <strong>{ertek}</strong> <code className="km-tema-kod">{token}</code></label>
  );
  const valaszto = (token: keyof AlapTokenek, cimke: string, opciok: { v: string; n: string }[]) => (
    <div key={token}>
      <label className="km-tema-cimke">{cimke} <code className="km-tema-kod">{token}</code></label>
      <select className="km-tema-valaszto" value={tokenek[token]} onChange={setNyers(token)} disabled={!szerkesztheto}>
        {opciok.some((o) => o.v === tokenek[token]) ? null : <option value={tokenek[token]}>{tokenek[token]}</option>}
        {opciok.map((o) => <option key={o.v} value={o.v}>{o.n}</option>)}
      </select>
    </div>
  );
  const csuszka = (token: keyof AlapTokenek, cimke: string, min: number, max: number, lepes = 1, mod: "px" | "nyers" | "szazalek" = "px") => {
    const nyers = tokenek[token];
    const ertek = mod === "px" ? px(nyers) : parseFloat(nyers) || 0;
    const kiir = mod === "szazalek" ? `${nyers}%` : nyers;
    const valtozik = mod === "px" ? setPx(token) : setNyers(token);
    return (
      <div key={token}>
        {csuszkaCimke(cimke, kiir, token)}
        <input type="range" className="km-tema-csuszka" min={min} max={max} step={lepes} value={ertek} onChange={valtozik} aria-label={cimke} disabled={!szerkesztheto} />
      </div>
    );
  };
  const alak = (token: keyof AlapTokenek, cimke: string, max: number, kapszulazhato: boolean) => {
    const e = px(tokenek[token]);
    const kapszula = e > max;
    return (
      <div key={token}>
        <div className="km-tema-csuszka-fej">
          {csuszkaCimke(cimke, kapszula ? t("tema.pill") : tokenek[token], token)}
          {kapszulazhato ? (
            <button type="button" className="km-tema-kapszula" data-be={kapszula ? "true" : "false"} onClick={() => tokenBeallit(token, kapszula ? "6px" : "999px")} disabled={!szerkesztheto}>{t("tema.pill")}</button>
          ) : null}
        </div>
        <input type="range" className="km-tema-csuszka" min={0} max={max} step={1} value={Math.min(e, max)} onChange={setPx(token)} aria-label={cimke} disabled={!szerkesztheto} />
      </div>
    );
  };

  const kesz = betoltes === "kesz";
  const { nyelv } = useFeliratok();
  const datum = (iso: string) => { try { return new Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(new Date(iso)); } catch { return iso; } };
  const szintJelveny = szint === "kozos" ? t("tema.szint_kozos") : t("tema.szint_szervezet");

  // az alsó sáv mondata: hány TÉRKÖZ-fok tér el az alkalmazott készlettől (a rajz: „A tervezet {n} fokot módosít”)
  const kulonbozoTerkoz = useMemo(() => {
    return TER_KULCSOK.filter((k) => tokenek[k] !== adat.alkalmazott[k]).length;
  }, [tokenek, adat.alkalmazott]);

  const fulCimkek: { kulcs: CsoportFul; felirat: string }[] = [
    { kulcs: "szin", felirat: t("ter.cs_szin") },
    { kulcs: "betu", felirat: t("ter.cs_betu") },
    { kulcs: "meret", felirat: t("ter.cs_meret") },
    { kulcs: "forma", felirat: t("ter.cs_forma") },
    { kulcs: "terkoz", felirat: t("ter.cs_terkoz") },
    { kulcs: "egyeb", felirat: t("ter.cs_egyeb") },
  ];

  return (
    <div className="km-tema">
      <header className="km-tema-fejlec">
        <div className="km-tema-fejlec-bal">
          <div className="km-tema-cim">{t("tema.title")}</div>
          <span className="km-tema-szint">{szintJelveny}</span>
          <span className="km-tema-jelveny">{t("ter.theme_szam", { n: TOKEN_KULCSOK.length, cs: fulCimkek.length })}</span>
          <span className="km-tema-piszkos" data-piszkos={piszkos ? "true" : "false"}>{piszkos ? t("tema.dirty") : t("tema.synced")}</span>
        </div>
        <div className="km-tema-fejlec-jobb">
          {rendszergazda ? (
            <select className="km-tema-allapot-valaszto" value={szint} onChange={szintValt} aria-label={t("tema.szint_valaszto")} disabled={fut}>
              <option value="szervezet">{t("tema.szint_valaszto_szervezet")} — {szervezetNev}</option>
              <option value="kozos">{t("tema.szint_valaszto_kozos")}</option>
            </select>
          ) : null}
          <button type="button" className="km-tema-gomb" onClick={alapertekek} disabled={!kesz || fut || !szerkesztheto}>{t("tema.defaults")}</button>
          <button type="button" className="km-tema-gomb km-tema-gomb-kiemelt" onClick={tervezetMentGomb} disabled={!kesz || fut || !szerkesztheto}>{t("tema.save_draft")}</button>
        </div>
      </header>

      {betoltes === "folyik" ? <div className="km-tema-uzenet" data-fajta="info" aria-live="polite">{t("tema.betoltes_loading")}</div> : null}
      {betoltes === "hiba" ? (
        <div className="km-tema-uzenet" data-fajta="hiba" aria-live="assertive">
          {t("tema.betoltes_load_err")}
          <button type="button" className="km-tema-uzenet-gomb" onClick={() => void betolt(szint)}>{t("tema.betoltes_retry")}</button>
        </div>
      ) : null}
      {!szerkesztheto ? <div className="km-tema-uzenet" data-fajta="figyelem">{szint === "kozos" ? t("tema.nincs_jog_kozos") : t("tema.csak_tulajdonos")}</div> : null}
      {uzenet ? <div className="km-tema-uzenet" data-fajta={uzenet.ok ? "ok" : "hiba"} aria-live="polite">{uzenet.szoveg}</div> : null}
      {importHibak.length ? (
        <div className="km-tema-uzenet" data-fajta="hiba" aria-live="assertive">
          <div className="km-tema-uzenet-cim">{t("tema.import_err_intro")}</div>
          {importHibak.map((h, i) => <div key={i}><code>{h.token}</code> — {h.szoveg}</div>)}
        </div>
      ) : null}
      {figyelmeztetesek.length ? (
        <div className="km-tema-uzenet" data-fajta="figyelem">
          {t("tema.contrast", { list: figyelmeztetesek.map((f) => `${f.par.replace(/--/g, "")} (${f.arany.toFixed(1)}:1)`).join(" · ") })}
        </div>
      ) : null}

      {kesz ? (
        <>
          <div className="km-tema-fulek">
            {fulCimkek.map((f) => (
              <button key={f.kulcs} type="button" className="km-tema-mod-gomb" data-be={aktivFul === f.kulcs ? "true" : "false"} onClick={() => setAktivFul(f.kulcs)}>{f.felirat}</button>
            ))}
          </div>

          <main className="km-lap-keret km-tema-fo">
            {szerkesztheto ? (
              <SemaValaszto key={szint} aktivKod={szint === "kozos" ? null : (kezdo.sema_kod ?? null)} nyelv={nyelv} kozos={szint === "kozos"} onValtva={() => router.refresh()} />
            ) : null}
            <div className="km-tema-oszlop">
              {aktivFul === "szin" ? (
                <section className="km-tema-szekcio">
                  <h2 className="km-tema-szekcio-cim">{t("tema.colors")}</h2>
                  <div className="km-tema-szinek">
                    {SZIN_MEZOK.map((k) => (
                      <label key={k} className="km-tema-szin">{szinCimke(k)}
                        <span className="km-tema-szin-sor">
                          <input type="color" className="km-tema-szin-bemenet" value={hexSzin(tokenek[k])} onChange={setSzin(k)} aria-label={szinCimke(k)} disabled={!szerkesztheto} />
                          <code className="km-tema-kod">{k}</code>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="km-tema-jegyzet km-tema-jegyzet-szinek">{t("tema.colors_note")}</div>
                </section>
              ) : null}

              {aktivFul === "szin" ? (
                <section className="km-tema-szekcio">
                  <h2 className="km-tema-szekcio-cim">{t("tema.shadow_color")}</h2>
                  <label className="km-tema-szin">{t("tema.shadow_color")}
                    <span className="km-tema-szin-sor">
                      <input type="color" className="km-tema-szin-bemenet" value={hexSzin(tokenek["--shadow-color"])} onChange={setSzin("--shadow-color")} aria-label={t("tema.shadow_color")} disabled={!szerkesztheto} />
                      <code className="km-tema-kod">--shadow-color</code>
                    </span>
                  </label>
                </section>
              ) : null}

              {aktivFul === "betu" ? (
                <section className="km-tema-szekcio">
                  <h2 className="km-tema-szekcio-cim">{t("tema.type")}</h2>
                  {valaszto("--font-display", t("tema.font_head"), BETUK)}
                  {valaszto("--font-body", t("tema.font_body"), BETUK)}
                  {valaszto("--font-code", t("tema.font_code"), KOD_BETUK)}
                  {valaszto("--font-display-arab", t("tema.font_arab_h"), ARAB_CIM)}
                  {valaszto("--font-body-arab", t("tema.font_arab_b"), ARAB_SZOVEG)}
                  {valaszto("--fw-head", t("tema.fw_head"), TOKEN_SZABALYOK["--fw-head"].tipus === "enum" ? TOKEN_SZABALYOK["--fw-head"].ertekek.map((v) => ({ v, n: v })) : [])}
                  {valaszto("--fw-strong", t("tema.fw_strong"), TOKEN_SZABALYOK["--fw-strong"].tipus === "enum" ? TOKEN_SZABALYOK["--fw-strong"].ertekek.map((v) => ({ v, n: v })) : [])}
                </section>
              ) : null}

              {aktivFul === "meret" ? (
                <section className="km-tema-szekcio">
                  <h2 className="km-tema-szekcio-cim">{t("ter.cs_meret")}</h2>
                  {csuszka("--fs-h1", t("tema.fs_h1"), 20, 56)}
                  {csuszka("--fs-base", t("tema.fs_base"), 12, 20)}
                  {csuszka("--fs-metric", t("tema.fs_metric"), 18, 48)}
                  {csuszka("--aurora-opacity", t("tema.aurora_opacity"), 0, 70)}
                  {csuszka("--orb-size", t("tema.orb_size"), 44, 120)}
                  {csuszka("--fs-hero", t("tema.fs_hero"), 24, 80)}
                  {csuszka("--fs-hero-sm", t("tema.fs_hero_sm"), 20, 48)}
                  {csuszka("--fs-szekcio", t("tema.fs_szekcio"), 16, 40)}
                  {csuszka("--fs-zaro", t("tema.fs_zaro"), 18, 48)}
                  {csuszka("--lh", t("tema.lh"), 1.1, 2.2, 0.05, "nyers")}
                </section>
              ) : null}

              {aktivFul === "forma" ? (
                <section className="km-tema-szekcio">
                  <h2 className="km-tema-szekcio-cim">{t("tema.shapes")}</h2>
                  <div className="km-tema-jegyzet km-tema-jegyzet-formak">{t("tema.shapes_note")}</div>
                  {alak("--r-btn", t("tema.r_btn"), 30, true)}
                  {alak("--r-field", t("tema.r_field"), 30, true)}
                  {alak("--r-card", t("tema.r_card"), 30, false)}
                  {alak("--r-badge", t("tema.r_badge"), 30, true)}
                  {csuszka("--bw", t("tema.bw"), 0, 4)}
                </section>
              ) : null}

              {aktivFul === "terkoz" ? (
                <TerkozCsoport tokenek={tokenek} tokenBeallit={tokenBeallit} szerkesztheto={szerkesztheto} t={t} />
              ) : null}

              {aktivFul === "egyeb" ? (
                <>
                  <section className="km-tema-szekcio">
                    <h2 className="km-tema-szekcio-cim">{t("tema.fx")}</h2>
                    {csuszka("--blur-glass", t("tema.blur"), 0, 60)}
                    {csuszka("--glass-alpha", t("tema.glass"), 0, 30, 1, "szazalek")}
                    {csuszka("--shadow-strength", t("tema.shadow_strength"), 0, 80, 1, "szazalek")}
                    {csuszka("--foto-hero", t("tema.foto_hero"), 0, 100, 1, "szazalek")}
                    {csuszka("--foto-zaro", t("tema.foto_zaro"), 0, 100, 1, "szazalek")}
                    {csuszka("--fatyol", t("tema.fatyol"), 0, 100, 1, "szazalek")}
                    <div className="km-tema-jegyzet">{t("tema.foto_jegyzet")}</div>
                    <label className="km-tema-cimke">{t("tema.motion")} <code className="km-tema-kod">--motion</code></label>
                    <select className="km-tema-valaszto" value={tokenek["--motion"]} onChange={setNyers("--motion")} disabled={!szerkesztheto}>
                      <option value="normal">{t("tema.motion_normal")}</option>
                      <option value="slow">{t("tema.motion_slow")}</option>
                      <option value="off">{t("tema.motion_off")}</option>
                    </select>
                    <div className="km-tema-jegyzet km-tema-jegyzet-mozgas">{t("tema.motion_note")}</div>
                  </section>

                  <section className="km-tema-szekcio">
                    <h2 className="km-tema-szekcio-cim">{t("tema.adv")}</h2>
                    {csuszka("--sat-glass", t("tema.sat"), 50, 300, 10, "szazalek")}
                    {csuszka("--control-min", t("tema.control_min"), 32, 64)}
                    {csuszka("--tile-min", t("tema.tile_min"), 200, 520, 10)}
                    {/* R-7e: egységes tartalomszélesség — űrlap · lista (D-F43) */}
                    {csuszka("--urlap-max", t("tema.urlap_max"), 640, 720, 10)}
                    {csuszka("--lista-max", t("tema.lista_max"), 1100, 1200, 10)}
                    {csuszka("--kapcsolo-w", t("tema.kapcsolo_w"), 28, 64)}
                    {csuszka("--kapcsolo-h", t("tema.kapcsolo_h"), 16, 36)}
                  </section>

                  <section className="km-tema-szekcio">
                    <h2 className="km-tema-szekcio-cim">{t("tema.io")}</h2>
                    <div className="km-tema-io-gombok">
                      <button type="button" className="km-tema-gomb" onClick={exportal}>{t("tema.export")}</button>
                      <button type="button" className="km-tema-gomb" onClick={() => importal()} disabled={!szerkesztheto}>{t("tema.import")}</button>
                      <button type="button" className="km-tema-gomb" onClick={exportalFajlba}>{t("tema.export_fajl")}</button>
                      <FajlValaszto cimke={t("tema.import_fajl")} className="km-tema-gomb" disabled={!szerkesztheto} beolvasva={importalFajlbol} />
                    </div>
                    <textarea className="km-tema-io-mezo" dir="ltr" rows={6} value={ioSzoveg} onChange={(e) => setIoSzoveg(e.target.value)} placeholder='{"$schema":"km-theme/2","tokens":{"--primary":"#4f5fd6"}}' aria-label="Theme JSON" /* tokenőr: ok — a v6 helyőrző példája */ />
                    <div className="km-tema-jegyzet km-tema-jegyzet-io">{t("tema.io_note")}</div>
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
                            {v.allapot === "korabbi" ? (
                              <button type="button" className="km-tema-gomb km-tema-verzio-gomb" onClick={() => void visszaallit(v.verzio)} disabled={fut || !szerkesztheto}>{t("tema.visszaallit")}</button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : null}
            </div>

            <div className="km-tema-elonezet-oszlop">
              <div className="km-tema-elonezet-fej">
                <div className="km-tema-elonezet-cim">{t("tema.preview")}</div>
                <span className="km-tema-elonezet-megj">{t("tema.preview_note")}</span>
                <div className="km-tema-mod">
                  <button type="button" className="km-tema-mod-gomb" data-be={mobil ? "false" : "true"} onClick={() => setMobil(false)}>{t("tema.desktop")}</button>
                  <button type="button" className="km-tema-mod-gomb" data-be={mobil ? "true" : "false"} onClick={() => setMobil(true)}>{t("tema.mobile")}</button>
                </div>
                <select className="km-tema-allapot-valaszto" value={allapotNezet} onChange={(e) => setAllapotNezet(e.target.value as ElonezetAllapot)} aria-label="state">
                  <option value="normal">{t("tema.st_normal")}</option>
                  <option value="hover">{t("tema.st_hover")}</option>
                  <option value="focus">{t("tema.st_focus")}</option>
                  <option value="disabled">{t("tema.st_disabled")}</option>
                  <option value="error">{t("tema.st_error")}</option>
                </select>
              </div>
              <div className="km-tema-elonezet-keret">
                <ElonezetPanel teljes={teljes} allapot={allapotNezet} mobil={mobil} t={t} />
              </div>
            </div>
          </main>

          <div className="km-tema-sav">
            <span className="km-tema-sav-szoveg">{t("ter.sav_szoveg", { n: kulonbozoTerkoz })}</span>
            <div className="km-tema-sav-gombok">
              <button type="button" className="km-tema-gomb" onClick={elvet} disabled={!kesz || fut || !szerkesztheto}>{t("ter.sav_elvet")}</button>
              <button type="button" className="km-tema-gomb-alkalmaz" onClick={alkalmaz} disabled={!kesz || fut || !szerkesztheto}>{t("ter.sav_alkalmaz")}</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
