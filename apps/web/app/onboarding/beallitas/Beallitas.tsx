"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { KinalatSor, PosztNyelvMod, ProgramTetel, Rendezveny, SzervezetTipus, TemaTerv } from "@rogton/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { Marka } from "../../_kozos/Marka";
import { Visszajelzes } from "../../_kozos/Visszajelzes";
import { hivas } from "../../_kozos/kliens";
import { FoGomb, HalkGomb, HalkLink, Info, KerdesCim } from "../../_kozos/R15";
import { KinalatLista, TemaLista } from "../../_kozos/R18Kinalat";
import { NyelvModValaszto } from "../../_kozos/C30NyelvMod";
import { ProgramForras, ProgramNapok, ProgramTetelLap } from "../../_kozos/C30Program";
import { lepesekFor, type Lepes } from "../../../profil/tipus-szabaly";
import "../../_kozos/r15-lapok.css";

// R-18 7. kör (rajz: „Beállítás · …” artboardok, IRANYOK-round7.md „Setup”; Csilla 10-12): a lépések sorban, mind előre kitöltve,
// semmit nem kell befejezni. Minden lépés a saját fő gombjával (vagy egy koppintással) ment a profilba; „Mentés és kilépés” bárhonnan
// a Kezdőlapra visz (a többi a Szervezet adatainál pótolható). A választós lépéseken (lista, árak) nincs fő gomb: a választás a válasz.
// Csilla: a lista-kérdés a szakmától függ (vendéglátás: „Van étlapod?”, mindenki más: „Van szolgáltatás-listád vagy árlistád?”),
// mindkettőn Link · PDF · Fotó és egy valódi „Nincs, átugrom” gomb; az árak kérdése csak akkor jön, ha van lista.

// c30 F6 (plan §2 Part B, rajz D2/D3/D4): a lépések sora `lepesekFor(tipus, vanLista, nyelvekSzama)` (profil/tipus-szabaly.ts) — egy nyelvű
// cégnél pontosan a mai öt; fesztiválnál „Mikor és hol lesz?” és „Ez a programod?” a kínálat / lista / árak helyett.
// c30 F3 (rajz D5): `nyelvek` — a szervezet tartalomnyelvei; `nyelvMod` — az előre kiválasztott nyelvi mód (a tárolt, vagy D6: fesztivál →
// „egyben”, cég → „kulon”). A „Hogyan posztoljunk két nyelven?” lépés csak 2+ nyelvnél jön; egy nyelvű cégnél a lépések ugyanazok, mint eddig.
type Kezdo = {
  kinalat: KinalatSor[]; arak: boolean | null; kozossegi: string; temak: TemaTerv[]; vendeglato: boolean; nyelvek: string[]; nyelvMod: PosztNyelvMod;
  // c30 F6: a szervezet típusa; fesztiválnál a rendezvény (a mentett, vagy a gép javaslata), a program és honnan olvastuk
  tipus: SzervezetTipus; rendezveny: Rendezveny; program: ProgramTetel[]; programForras: "link" | "pdf" | "word" | "foto" | null; programFut?: "link" | "pdf" | "word" | "foto" | null;
};
type Kep = { id: string; url: string };

function Keszul({ cim, mit }: { cim: string; mit?: string }) {
  return (
    <div className="r15-teendo r18k7-keszul" aria-busy="true">
      <div role="status" className="r18k7-keszul-sor"><span className="r18k7-keszul-cimke"><span className="r18k7-keszul-pont" aria-hidden="true" />{cim}</span><span className="r18k7-keszul-sav" aria-hidden="true"><span /></span></div>
      {mit ? <Info>{mit}</Info> : null}
    </div>
  );
}

function Vaz() {
  return (
    <div className="r18k7-lista r18k7-vaz" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => <div key={i} className="r18k7-sor"><span className="r18k7-pipa" /><span className="r18k7-vaz-csik" /></div>)}
    </div>
  );
}

async function feltolt(f: File): Promise<string | null> {
  const v = await fetch("/api/onboarding/beallitas/fajl", { method: "POST", body: f, credentials: "same-origin", headers: { "x-fajl-nev": encodeURIComponent(f.name.slice(0, 120)) } }).catch(() => null);
  if (!v || v.status !== 201) return null;
  return ((await v.json()) as { fajl: { id: string } }).fajl.id;
}

export function Beallitas({ kezdo }: { kezdo: Kezdo }) {
  const { t, nyelv: uiNyelv } = useFeliratok();
  const router = useRouter();
  const fesztival = kezdo.tipus === "fesztival";
  const [lepes, setLepes] = useState<Lepes>(() => lepesekFor(kezdo.tipus, false, kezdo.nyelvek.length)[0]!);
  const [kinalat, setKinalat] = useState<KinalatSor[]>(kezdo.kinalat);
  const [domain, setDomain] = useState("");
  const [olvas, setOlvas] = useState(!fesztival && kezdo.kinalat.length === 0);
  const [vendeglatoE, setVendeglatoE] = useState(kezdo.vendeglato);
  const [ujSor, setUjSor] = useState(-1);
  // lista lépés
  const [listaMod, setListaMod] = useState<"valaszt" | "link" | "olvas" | "eredmeny">("valaszt");
  const [link, setLink] = useState("");
  const [listaSorok, setListaSorok] = useState<KinalatSor[]>([]);
  const [listaHiba, setListaHiba] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  // oldal lépés
  const [kozossegi, setKozossegi] = useState(kezdo.kozossegi);
  const [talaltuk, setTalaltuk] = useState(false);
  const [kepek, setKepek] = useState<Kep[]>([]);
  const kepRef = useRef<HTMLInputElement>(null);
  // témák
  const [temak, setTemak] = useState<TemaTerv[]>(kezdo.temak);
  const [temaFut, setTemaFut] = useState(false);
  const [ujTema, setUjTema] = useState(-1);
  const [fut, setFut] = useState(false);
  // c30 F3 · nyelvi mód (D5)
  const [nyelvMod, setNyelvMod] = useState<PosztNyelvMod>(kezdo.nyelvMod);
  // c30 F6 · rendezvény (D2) és program (D3/D4)
  const elsoNy = kezdo.nyelvek[0] ?? "hu", masodikNy = kezdo.nyelvek[1] ?? null;
  const [mettol, setMettol] = useState(kezdo.rendezveny.mettol ?? "");
  const [meddig, setMeddig] = useState(kezdo.rendezveny.meddig ?? "");
  const [holHely, setHolHely] = useState(kezdo.rendezveny.hely?.[elsoNy as keyof NonNullable<Rendezveny["hely"]>] ?? "");
  const [rendHely, setRendHely] = useState<NonNullable<Rendezveny["hely"]>>(kezdo.rendezveny.hely ?? {}); // a mentett helyszín (a szerver a gép második nyelvű helyét újrafordíthatja)
  const holMasik = masodikNy ? rendHely[masodikNy as keyof NonNullable<Rendezveny["hely"]>] ?? "" : "";
  const [belepo, setBelepo] = useState(kezdo.rendezveny.belepo ?? "");
  const [belepoNyitva, setBelepoNyitva] = useState(!!kezdo.rendezveny.belepo);
  const [rendHiba, setRendHiba] = useState(false);
  const [program, setProgram] = useState<ProgramTetel[]>(kezdo.program);
  const [programForras, setProgramForras] = useState(kezdo.programForras);
  const [lap, setLap] = useState<ProgramTetel | null>(null);

  const vanLista = kinalat.some((k) => k.aktiv && k.nev.trim());
  const lepesSor = (lista: boolean): Lepes[] => lepesekFor(kezdo.tipus, lista, kezdo.nyelvek.length);
  const lepesek: Lepes[] = lepesSor(vanLista);
  const hol = lepesek.indexOf(lepes);
  const szamlalo = t("onboarding.lepes_szamlalo", { aktualis: 3 + Math.max(0, hol), osszes: 2 + lepesek.length });

  // 1. lépés: a honlap olvasása (csak ha még nincs kínálat a profilban)
  useEffect(() => {
    if (!olvas) return;
    let megszakitva = false;
    void (async () => {
      const r = await hivas("/api/onboarding/beallitas/olvas", "POST", {});
      if (megszakitva) return;
      if (r.statusz === 401) { router.push("/belepes"); return; }
      if (r.statusz === 200) {
        const sorok = (r.torzs["sorok"] as KinalatSor[] | undefined) ?? [];
        setKinalat(sorok.length ? sorok : [{ nev: "", reszlet: "", ar: "", aktiv: true }]);
        if (!sorok.length) setUjSor(0);
        setDomain(typeof r.torzs["domain"] === "string" ? r.torzs["domain"] : "");
        setVendeglatoE(r.torzs["vendeglato"] === true);
        const k = typeof r.torzs["kozossegi"] === "string" ? r.torzs["kozossegi"] : "";
        if (k && !kozossegi) { setKozossegi(k); setTalaltuk(true); }
      } else {
        setKinalat([{ nev: "", reszlet: "", ar: "", aktiv: true }]);
        setUjSor(0);
      }
      setOlvas(false);
    })();
    return () => { megszakitva = true; };
  }, [olvas]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. lépés: a témák (ha még nincsenek)
  useEffect(() => {
    if (lepes !== "temak" || temak.length > 0 || temaFut) return;
    setTemaFut(true);
    void (async () => {
      const r = await hivas("/api/onboarding/beallitas/temak", "POST", {});
      if (r.statusz === 200) setTemak((r.torzs["temak"] as TemaTerv[] | undefined) ?? []);
      setTemaFut(false);
    })();
  }, [lepes]); // eslint-disable-line react-hooks/exhaustive-deps

  async function ment(adat: Record<string, unknown>): Promise<boolean> {
    const r = await hivas("/api/profil/kinalat", "PUT", adat);
    if (r.statusz === 401) { router.push("/belepes"); return false; }
    return r.statusz === 200;
  }
  const tovabb = (honnan: Lepes) => {
    const l: Lepes[] = lepesSor(vanLista);
    const kov = l[l.indexOf(honnan) + 1];
    if (kov) { setLepes(kov); window.scrollTo(0, 0); }
  };
  const vissza = () => {
    if (lepes === "lista" && listaMod !== "valaszt") { setListaMod("valaszt"); return; }
    const elozo = lepesek[hol - 1];
    if (elozo) setLepes(elozo); else router.push("/kezdolap");
  };
  async function kilep() {
    await ment({ kesz: true });
    router.push("/kezdolap");
  }

  async function kinalatRendben() {
    if (fut) return;
    setFut(true);
    const ok = await ment({ kinalat: kinalat.filter((k) => k.nev.trim()) });
    setFut(false);
    if (ok) tovabb("kinalat");
  }
  async function listaOlvas(be: { link?: string; fajlok?: string[] }) {
    setListaMod("olvas");
    setListaHiba(false);
    const r = await hivas("/api/onboarding/beallitas/lista", "POST", be);
    const sorok = r.statusz === 200 ? ((r.torzs["sorok"] as KinalatSor[] | undefined) ?? []) : [];
    if (sorok.length === 0) { setListaHiba(true); setListaMod("valaszt"); return; }
    setListaSorok(sorok);
    setListaMod("eredmeny");
  }
  async function fajlokbol(lista: FileList | null) {
    if (!lista?.length) return;
    setListaMod("olvas");
    const idk: string[] = [];
    for (const f of [...lista].slice(0, 6)) { const id = await feltolt(f); if (id) idk.push(id); }
    if (idk.length === 0) { setListaHiba(true); setListaMod("valaszt"); return; }
    await listaOlvas({ fajlok: idk });
  }
  async function listaRendben() {
    if (fut) return;
    setFut(true);
    const nevek = new Set(kinalat.map((k) => k.nev.toLocaleLowerCase()));
    const uj = [...kinalat.filter((k) => k.nev.trim()), ...listaSorok.filter((s) => s.nev.trim() && !nevek.has(s.nev.toLocaleLowerCase()))];
    const ok = await ment({ kinalat: uj });
    setFut(false);
    if (ok) { setKinalat(uj); setListaMod("valaszt"); tovabb("lista"); }
  }
  async function arakValaszt(igen: boolean) {
    if (fut) return;
    setFut(true);
    const ok = await ment({ arak_posztban: igen });
    setFut(false);
    if (ok) tovabb("arak");
  }
  async function rendezvenyRendben() {
    if (fut) return;
    setFut(true);
    setRendHiba(false);
    const hely = { ...rendHely, [elsoNy]: holHely.trim() };
    const r = await hivas("/api/profil/rendezveny", "PUT", { ...(mettol ? { mettol } : {}), ...(meddig ? { meddig } : {}), hely, ...(belepo.trim() ? { belepo: belepo.trim() } : {}) });
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz === 200) { setRendHely((r.torzs["rendezveny"] as Rendezveny | undefined)?.hely ?? {}); tovabb("rendezveny"); } else setRendHiba(true);
  }
  async function nyelvModRendben() {
    if (fut) return;
    setFut(true);
    const r = await hivas("/api/profil/nyelvmod", "PUT", { mod: nyelvMod });
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz === 200) tovabb("nyelvmod");
  }
  async function kepetTesz(lista: FileList | null) {
    if (!lista?.length) return;
    setFut(true);
    const uj: Kep[] = [];
    for (const f of [...lista].slice(0, 5 - kepek.length)) { const id = await feltolt(f); if (id) uj.push({ id, url: URL.createObjectURL(f) }); }
    setKepek((k) => [...k, ...uj].slice(0, 5));
    setFut(false);
  }
  async function oldalTovabb() {
    if (fut) return;
    setFut(true);
    const r = await hivas("/api/onboarding/beallitas/oldal", "POST", { kozossegi_oldal: kozossegi, kepernyokepek: kepek.map((k) => k.id) });
    setFut(false);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    tovabb("oldal");
  }
  async function temakRendben() {
    if (fut) return;
    setFut(true);
    const ok = await ment({ tema_terv: temak.filter((x) => x.tema.trim()), kesz: true });
    setFut(false);
    if (ok) router.push("/kezdolap");
  }

  const arPelda = kinalat.find((k) => k.aktiv && k.ar)?.ar ?? "";
  const listaCim = vendeglatoE ? t("onb.etlap_cim") : t("onb.lista_cim");

  let cim = "", alcim = "", tartalom: React.ReactNode = null, fo: React.ReactNode = null;
  if (lepes === "rendezveny") {
    // c30 F6 · D2 „Mikor és hol lesz?” — a gép javaslata (vagy a mentett) előre kitöltve; egy fő gomb
    cim = t("c30.rend.cim");
    alcim = t("c30.rend.alcim");
    tartalom = (
      <>
        <div className="c30-rend-datumok">
          <div className="r18k7-mezo-blokk"><label className="r18k7-cimke" htmlFor="c30-mettol">{t("c30.rend.elso_nap")}</label><input id="c30-mettol" className="r18p-input" type="date" lang={uiNyelv} value={mettol} onChange={(e) => setMettol(e.target.value)} /></div>
          <div className="r18k7-mezo-blokk"><label className="r18k7-cimke" htmlFor="c30-meddig">{t("c30.rend.utolso_nap")}</label><input id="c30-meddig" className="r18p-input" type="date" lang={uiNyelv} value={meddig} min={mettol || undefined} aria-invalid={(mettol && meddig && meddig < mettol) || undefined} onChange={(e) => setMeddig(e.target.value)} /></div>
        </div>
        <div className="r18k7-mezo-blokk">
          <label className="r18k7-cimke" htmlFor="c30-hol">{t("c30.rend.hol")}</label>
          <input id="c30-hol" className="r18p-input" value={holHely} maxLength={120} onChange={(e) => setHolHely(e.target.value)} />
          {masodikNy && holMasik ? <span className="r18p-halk">{t("c30.rend.hely_masik", { nyelvul: t(`nyelv.hatarozo.${masodikNy}`), hely: holMasik })}</span> : null}
        </div>
        {belepoNyitva ? (
          <div className="r18k7-mezo-blokk">
            <label className="r18k7-cimke" htmlFor="c30-belepo">{t("c30.rend.belepo")} <span className="r18p-halk">· {t("poszt.nem_kotelezo")}</span></label>
            <input id="c30-belepo" className="r18p-input" value={belepo} maxLength={200} placeholder={t("c30.rend.belepo_pl")} onChange={(e) => setBelepo(e.target.value)} />
          </div>
        ) : <div><HalkLink onClick={() => setBelepoNyitva(true)}>{t("c30.rend.belepo_link")}</HalkLink></div>}
        {rendHiba ? <Info>{t("onb.nem_sikerult")}</Info> : null}
      </>
    );
    fo = <FoGomb onClick={() => void rendezvenyRendben()} disabled={fut || (!!mettol && !!meddig && meddig < mettol)}>{t("onb.rendben")}</FoGomb>;
  } else if (lepes === "program") {
    // c30 F6 · D3 „Ez a programod?” (napok, az első nyitva) — vagy az üres állapot (Link · PDF · Word · Fotó · „Nincs még, később”, fő gomb nélkül)
    if (program.length === 0) {
      cim = t("c30.prog.ures_cim");
      alcim = t("c30.prog.ures_alcim");
      tartalom = <ProgramForras fut={kezdo.programFut ?? null} onKesz={(v) => { setProgram(v.tetelek); setProgramForras(v.fajta); }} onKesobb={() => tovabb("program")} />;
    } else {
      const napokSzama = new Set(program.map((x) => x.nap).filter(Boolean)).size;
      const forras = programForras ? t(`c30.prog.forras.${programForras}`) : "";
      cim = t("c30.prog.cim");
      alcim = t("c30.prog.alcim");
      tartalom = (
        <>
          {forras ? <Info osztaly="r15-csak-tel">{t("c30.prog.forras_mondat", { forras })}</Info> : null}
          {forras ? <Info osztaly="r15-csak-asztal">{t("c30.prog.forras_db", { forras, n: program.length, napok: napokSzama })}</Info> : null}
          <ProgramNapok tetelek={program} nyelvek={kezdo.nyelvek} onTetel={setLap} asztaliOszlop />
        </>
      );
      // rajz D4a: a nyitott lap mögött a „Rendben” látszik, de nem fő gomb (nincs jele, nem fókuszálható) — T2: egy fő gomb, a „Mentem”
      fo = lap
        ? <FoGomb onClick={() => tovabb("program")} disabled={fut} data-r15={undefined} tabIndex={-1}>{t("onb.rendben")}</FoGomb>
        : <FoGomb onClick={() => tovabb("program")} disabled={fut}>{t("onb.rendben")}</FoGomb>;
    }
  } else if (lepes === "kinalat") {
    cim = t("onb.kinalat_cim");
    alcim = olvas ? t("onb.olvassuk_alcim") : t("onb.kinalat_alcim");
    tartalom = olvas ? (
      <><Keszul cim={t("onb.olvassuk")} mit={t("onb.olvassuk_mit")} /><Vaz /></>
    ) : (
      <>
        {domain ? <Info>{t("onb.kinalat_forras", { domain })}</Info> : null}
        <KinalatLista sorok={kinalat} valt={setKinalat} ujNyitva={ujSor} />
        <div><HalkLink onClick={() => { setKinalat((k) => [...k, { nev: "", reszlet: "", ar: "", aktiv: true }]); setUjSor(kinalat.length); }}>{t("onb.hianyzik")}</HalkLink></div>
      </>
    );
    fo = olvas ? null : <FoGomb onClick={() => void kinalatRendben()} disabled={fut}>{t("onb.rendben")}</FoGomb>;
  } else if (lepes === "lista") {
    cim = listaCim;
    alcim = t("onb.etlap_alcim");
    if (listaMod === "olvas") tartalom = <><Keszul cim={t("onb.olvassuk_listat")} /><Vaz /></>;
    else if (listaMod === "eredmeny") {
      tartalom = <KinalatLista sorok={listaSorok} valt={setListaSorok} />;
      fo = <FoGomb onClick={() => void listaRendben()} disabled={fut}>{t("onb.rendben")}</FoGomb>;
    } else if (listaMod === "link") {
      tartalom = (
        <div className="r18k7-link">
          <label className="r18k7-cimke" htmlFor="r18k7-link">{t("onb.link_mezo")}</label>
          <div className="r18p-cta-sor">
            <input id="r18k7-link" className="r18p-input" inputMode="url" value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && link.trim()) void listaOlvas({ link }); }} />
            <HalkGomb onClick={() => void listaOlvas({ link })} disabled={!link.trim()}>{t("onb.link_gomb")}</HalkGomb>
          </div>
        </div>
      );
    } else {
      tartalom = (
        <>
          <div className="r18k7-opciok" role="group" aria-label={listaCim}>
            <button type="button" className="r18k7-opcio" onClick={() => setListaMod("link")}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>{t("onb.etlap_link")}</button>
            <button type="button" className="r18k7-opcio" onClick={() => pdfRef.current?.click()}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 14h8M8 17h5" /></svg>{t("onb.etlap_pdf")}</button>
            <button type="button" className="r18k7-opcio" onClick={() => fotoRef.current?.click()}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>{t("onb.etlap_foto")}</button>
          </div>
          <input ref={pdfRef} type="file" accept="application/pdf" hidden onChange={(e) => { void fajlokbol(e.target.files); e.target.value = ""; }} />
          <input ref={fotoRef} type="file" accept="image/*" multiple hidden onChange={(e) => { void fajlokbol(e.target.files); e.target.value = ""; }} />
          <div><HalkGomb onClick={() => tovabb("lista")}>{t("onb.atugrom")}</HalkGomb></div>
          <Info>{listaHiba ? t("onb.nem_sikerult") : vendeglatoE ? t("onb.etlap_info") : t("onb.lista_info")}</Info>
        </>
      );
    }
  } else if (lepes === "arak") {
    cim = t("onb.arak_cim");
    alcim = t("onb.arak_alcim");
    tartalom = (
      <>
        <div className="r18k7-opciok r18k7-ketto" role="radiogroup" aria-label={t("szerv.arak_posztban")}>
          <button type="button" className="r18k7-opcio" role="radio" aria-checked={kezdo.arak === true} disabled={fut} onClick={() => void arakValaszt(true)}>{t("onb.igen")}{arPelda ? <span className="r18k7-opcio-info">{t("onb.arak_pelda", { ar: arPelda })}</span> : null}</button>
          <button type="button" className="r18k7-opcio" role="radio" aria-checked={kezdo.arak === false} disabled={fut} onClick={() => void arakValaszt(false)}>{t("onb.nem")}<span className="r18k7-opcio-info">{t("onb.arak_nem")}</span></button>
        </div>
        <Info>{t("onb.arak_kesobb")}</Info>
      </>
    );
  } else if (lepes === "nyelvmod") {
    cim = t("c30.nyelvmod.cim");
    alcim = t("c30.nyelvmod.alcim");
    tartalom = <NyelvModValaszto nyelvek={kezdo.nyelvek} mod={nyelvMod} valt={setNyelvMod} tiltva={fut} />;
    fo = <FoGomb onClick={() => void nyelvModRendben()} disabled={fut}>{t("onb.rendben")}</FoGomb>;
  } else if (lepes === "oldal") {
    cim = t("onb.oldal_cim");
    alcim = t("onb.oldal_alcim");
    tartalom = fut && kepek.length ? <Keszul cim={t("onb.olvassuk_oldalt")} /> : (
      <>
        <div className="r18k7-mezo-blokk">
          <label className="r18k7-cimke" htmlFor="r18k7-oldal">{t("onb.oldal_mezo")}</label>
          <input id="r18k7-oldal" className="r18p-input" inputMode="url" value={kozossegi} placeholder="facebook.com/…" maxLength={300} onChange={(e) => { setKozossegi(e.target.value); setTalaltuk(false); }} />
          {talaltuk ? <span className="r18p-halk">{t("onb.oldal_talaltuk")}</span> : null}
        </div>
        <div className="r18k7-mezo-blokk">
          <span className="r18k7-cimke">{t("onb.kepernyokep")} <span className="r18p-halk">· {t("poszt.nem_kotelezo")}</span></span>
          <div className="r18k7-kepek">
            {kepek.map((k) => (
              <span key={k.id} className="r18k7-kep"><img src={k.url} alt="" /><button type="button" className="r18k7-kep-x" aria-label={t("onb.kep_torles")} onClick={() => setKepek((l) => l.filter((x) => x.id !== k.id))}>✕</button></span>
            ))}
            {kepek.length < 5 ? <HalkGomb onClick={() => kepRef.current?.click()} disabled={fut}>{t("onb.kepernyokep_gomb")}</HalkGomb> : null}
          </div>
          <input ref={kepRef} type="file" accept="image/*" multiple hidden onChange={(e) => { void kepetTesz(e.target.files); e.target.value = ""; }} />
        </div>
        <Info>{t("onb.oldal_oszinte")}</Info>
      </>
    );
    fo = <FoGomb onClick={() => void oldalTovabb()} disabled={fut}>{t("onb.tovabb")}</FoGomb>;
  } else {
    cim = t("onb.temak_cim");
    alcim = t("onb.temak_alcim");
    tartalom = temaFut ? <><Keszul cim={t("onb.temak_keszul")} /><Vaz /></> : (
      <>
        <TemaLista temak={temak} valt={setTemak} ujNyitva={ujTema} />
        <div><HalkLink onClick={() => { setTemak((x) => [...x, { tema: "", tipus: "picmess" }]); setUjTema(temak.length); }}>{t("onb.uj_tema")}</HalkLink></div>
      </>
    );
    fo = temaFut ? null : <FoGomb onClick={() => void temakRendben()} disabled={fut}>{t("onb.rendben")}</FoGomb>;
  }

  return (
    <div className="km-hatter r15e-hatter r15-keretes">
      {/* rajz D4a: a nyitott tétel-lap alatt a lap többi része néma és elérhetetlen (aria-hidden + inert) */}
      <div className="km-tartalom" aria-hidden={lepes === "program" && lap ? true : undefined} inert={lepes === "program" && !!lap}>
        <header className="km-fejlec km-eb-fej r15e-fejlec r18k7-fej" data-r15="sotet-sav">
          <div className="km-fejlec-bal r15e-fejlec-bal"><Marka nev={t("fejlec.termeknev")} nevOsztaly="r15-csak-asztal" /></div>
          <span className="r18k7-lepes r15-csak-asztal">{t("onb.elso_beallitas")}</span>
          <div className="km-fejlec-jobb r15e-fejlec-jobb"><HalkLink onClick={() => void kilep()}>{t("onboarding.mentes_es_kilepes")}</HalkLink></div>
        </header>
        <main className="km-lap-keret r15e-lap">
          <div className={lepes === "program" && program.length ? "r15e-belso r15e-keskeny r18k7-oszlop c30-szeles" : "r15e-belso r15e-keskeny r18k7-oszlop"}>
            <div className="r18k7-felso"><HalkLink onClick={vissza}>← {t("onboarding.vissza")}</HalkLink><span className="r18k7-lepes">{szamlalo}</span></div>
            <KerdesCim cim={cim} alcim={alcim} />
            {tartalom}
            {fo ? <div className="r15-csak-asztal">{fo}</div> : null}
            {fo ? <div className="r15-also-sav">{fo}</div> : null}
          </div>
        </main>
      </div>
      {lepes === "program" && lap ? <ProgramTetelLap tetel={lap} nyelvek={kezdo.nyelvek} onZar={() => setLap(null)} onMentve={(x) => { setProgram((l) => l.map((y) => (y.id === x.id ? x : y))); setLap(null); }} /> : null}
      <Visszajelzes />
    </div>
  );
}
