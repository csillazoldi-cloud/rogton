"use client";
import { useEffect, useRef, useState } from "react";
import { PROGRAM_FAJTAK, type ProgramFajta, type ProgramTetel } from "@rogton/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "./kliens";
import { Kapcsolo } from "./Kapcsolo";
import { DolgozoGomb, FoGomb, HalkGomb, HalkLink, Info } from "./R15";

// c30 F6 (canvas „Aitmetica arculatfrissítés”, c30 D3 · D4 · D9a; Csilla 10-17 q30a/q30c): a rendezvény programja a felületen.
//  · ProgramNapok — telefonon a napok összecsukott sorok („Csütörtök, jún. 25. · 8 program · 1 átnézendő”), az első nap nyitva; asztalon
//    (D3 asztali) a napok a bal oszlopban, a kiválasztott nap a jobbon. Soronként idő · név · helyszín; a bizonytalan tételnél egy csendes
//    sor: „Ezt nem tudtuk biztosan kiolvasni” (T7: nem piros).
//  · ProgramTetelLap — a D4 alsó lap: név (+ a második nyelvű név alatta), nap, kezdés–vége, helyszín a hajtás fölött; a többi
//    (fajta, fellépő, pár szó, fotó, „Erről ne posztoljunk”) a Részletek alatt. Egy fő gomb: „Mentem”.
//  · ProgramForras — a D3 üres állapota: Link · PDF · Word · Fotó és „Nincs még, később” (fő gomb nélkül, q30c).
// Az újraolvasás a kézzel átírt és a saját tételt soha nem írja felül (program/szabaly.ts ujraOlvasTerv) — ezt a felület nem ismétli el.

type ProgramForrasFajta = "link" | "pdf" | "word" | "foto";
import { NAP_ISO, idoBe, idoszakCimke, napCimke, napCsoportok, nyelviErtek, type NapCsoport } from "./c30-program-szabaly";
export { idoBe, idoszakCimke, napCimke, napCsoportok, nyelviErtek } from "./c30-program-szabaly";

function Nyil({ le }: { le: boolean }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{le ? <path d="M6 9l6 6 6-6" /> : <path d="M9 6l6 6-6 6" />}</svg>;
}

function Sor({ t, nyelvek, onTetel }: { t: ProgramTetel; nyelvek: string[]; onTetel: (t: ProgramTetel) => void }) {
  const { t: f, nyelv } = useFeliratok();
  const hely = nyelviErtek(t.helyszin, nyelv, nyelvek);
  return (
    <button type="button" role="listitem" className="r18k7-sor c30-prog-sor" onClick={() => onTetel(t)}>
      <span className="r18k7-lepes c30-prog-ido" data-r15="eredmeny">{t.kezdes ?? f("c30.prog.egesz_nap")}</span>
      <span className="r18k7-sor-szoveg c30-prog-szoveg">
        <span className="c30-prog-nev" data-r15="eredmeny">{nyelviErtek(t.nev, nyelv, nyelvek)}{hely ? <small>{hely}</small> : null}</span>
        {t.bizonytalan ? <span className="r15-info c30-prog-bizonytalan" data-r15="info">{f("c30.prog.bizonytalan")}</span> : null}
      </span>
    </button>
  );
}

/** A napok (D3 / D9a). `asztaliOszlop`: asztalon a D3 asztali elrendezése (napok balra); nélküle asztalon is az összecsukott sorok. */
export function ProgramNapok({ tetelek, nyelvek, onTetel, asztaliOszlop = false, elsoNyitva = true }: { tetelek: ProgramTetel[]; nyelvek: string[]; onTetel: (t: ProgramTetel) => void; asztaliOszlop?: boolean; elsoNyitva?: boolean }) {
  const { t, nyelv } = useFeliratok();
  const csoportok = napCsoportok(tetelek);
  const napokSzama = csoportok.filter((c) => c.kulcs !== null).length;
  const [nyitott, setNyitott] = useState<Set<string>>(() => new Set(elsoNyitva && csoportok[0] ? [csoportok[0].kulcs ?? "-"] : [])); // D3: az 1. nap nyitva (q30a); D9a: mind csukva (rajz)
  const [asztalNap, setAsztalNap] = useState<string>(() => csoportok[0]?.kulcs ?? "-");
  const cimke = (c: NapCsoport) => (c.kulcs ? napCimke(c.kulcs, nyelv) : t("c30.prog.mind_napon", { n: napokSzama }));
  const atnez = (c: NapCsoport) => c.tetelek.filter((x) => x.bizonytalan).length;
  const kapcsol = (k: string) => setNyitott((s) => { const u = new Set(s); if (u.has(k)) u.delete(k); else u.add(k); return u; });
  const kivalasztott = csoportok.find((c) => (c.kulcs ?? "-") === asztalNap) ?? csoportok[0];
  return (
    <>
      <div className={asztaliOszlop ? "c30-prog-napok r15-csak-tel" : "c30-prog-napok"}>
        {csoportok.map((c) => {
          const k = c.kulcs ?? "-";
          const nyitva = nyitott.has(k);
          const n = atnez(c);
          return (
            <div key={k} className="c30-prog-csoport">
              <button type="button" className="c30-prog-nap" aria-expanded={nyitva} onClick={() => kapcsol(k)}>
                <b>{cimke(c)}</b>
                <span className="r15-info">{t("c30.prog.nap_db", { n: c.tetelek.length })}</span>
                {n ? <span className="r15-info">{t("c30.prog.atnezendo", { n })}</span> : null}
                <span className="c30-prog-nyil"><Nyil le={nyitva} /></span>
              </button>
              {nyitva ? <div className="r18k7-lista" role="list">{c.tetelek.map((x) => <Sor key={x.id} t={x} nyelvek={nyelvek} onTetel={onTetel} />)}</div> : null}
            </div>
          );
        })}
      </div>
      {asztaliOszlop && kivalasztott ? (
        <div className="c30-prog-racs r15-csak-asztal">
          <nav className="c30-prog-nav" aria-label={t("c30.prog.napok_aria")}>
            {csoportok.map((c) => {
              const k = c.kulcs ?? "-";
              const n = atnez(c);
              return (
                <button key={k} type="button" className="c30-prog-nav-sor" aria-current={k === (kivalasztott.kulcs ?? "-") ? "true" : undefined} onClick={() => setAsztalNap(k)}>
                  {cimke(c)}<span className="c30-prog-jobbra">{c.tetelek.length}{n ? t("c30.prog.atnezendo", { n }) : ""}</span>
                </button>
              );
            })}
          </nav>
          <div className="r18k7-lista" role="list">{kivalasztott.tetelek.map((x) => <Sor key={x.id} t={x} nyelvek={nyelvek} onTetel={onTetel} />)}</div>
        </div>
      ) : null}
    </>
  );
}

async function feltolt(f: File): Promise<string | null> {
  const v = await fetch("/api/onboarding/beallitas/fajl", { method: "POST", body: f, credentials: "same-origin", headers: { "x-fajl-nev": encodeURIComponent(f.name.slice(0, 120)) } }).catch(() => null);
  if (!v || v.status !== 201) return null;
  return ((await v.json()) as { fajl: { id: string } }).fajl.id;
}

export type OlvasValasz = { tetelek: ProgramTetel[]; fajta: ProgramForrasFajta };

/** Egy forrás beolvasása (a végpont újraolvas: a kézzel átírt tételt nem írja felül). Hibánál null. */
export async function programOlvas(be: { fajta: ProgramForrasFajta; link?: string; fajlok?: FileList | File[] }): Promise<OlvasValasz | null> {
  if (be.fajta === "word") {
    const f = be.fajlok?.[0];
    if (!f) return null;
    const v = await fetch("/api/program/olvas", { method: "POST", body: f, credentials: "same-origin", headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } }).catch(() => null);
    if (!v || v.status !== 202) return null;
    const tetelek = await programOlvasasVar();
    return tetelek ? { tetelek, fajta: "word" } : null;
  }
  let torzs: Record<string, unknown>;
  if (be.fajta === "link") torzs = { link: be.link ?? "" };
  else {
    const idk: string[] = [];
    for (const f of [...(be.fajlok ?? [])].slice(0, 6)) { const id = await feltolt(f); if (id) idk.push(id); }
    if (!idk.length) return null;
    torzs = { fajlok: idk, ...(be.fajta === "foto" ? { foto: true } : {}) };
  }
  const r = await hivas("/api/program/olvas", "POST", torzs);
  if (r.statusz !== 202) return null;
  const tetelek = await programOlvasasVar();
  return tetelek ? { tetelek, fajta: be.fajta } : null;
}

/** c30 F6b (élő 10-17): a beolvasás a háttérben fut (egy nagy program 60–120 s) — a lap 2 mp-enként megkérdezi, amíg kész vagy hibás.
 *  Hálózati akadásnál tovább vár (nem mond hibát, amíg a szerver nem mondta); 12 perc után feladja. Kész → a program; hiba → null. */
export async function programOlvasasVar(varakozas = 2000, max = 12 * 60 * 1000): Promise<ProgramTetel[] | null> {
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    await new Promise((k) => setTimeout(k, varakozas));
    const r = await hivas("/api/program/olvas", "GET").catch(() => null);
    if (!r || r.statusz !== 200) continue;
    const o = r.torzs["olvasas"] as { allapot?: string } | null | undefined;
    if (o?.allapot === "kesz") return (r.torzs["tetelek"] as ProgramTetel[] | undefined) ?? [];
    if (o?.allapot !== "fut") return null;
  }
  return null;
}

const Ikon = {
  link: <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  pdf: <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 14h8M8 17h5" /></svg>,
  word: <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 12l1.5 6 2.5-4.5 2.5 4.5L16 12" /></svg>,
  foto: <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>,
};

/** Rejtett fájlválasztók egy kattintáshoz: `nyit(fajta)` megnyitja, a választás után `kesz(fajta, fajlok)`. */
export function useFajlValaszto(kesz: (fajta: ProgramForrasFajta, fajlok: FileList) => void) {
  const pdf = useRef<HTMLInputElement>(null), word = useRef<HTMLInputElement>(null), foto = useRef<HTMLInputElement>(null);
  const nyit = (fajta: ProgramForrasFajta) => (fajta === "pdf" ? pdf : fajta === "word" ? word : foto).current?.click();
  const valasztok = (
    <>
      <input ref={pdf} type="file" accept="application/pdf" hidden onChange={(e) => { if (e.target.files?.length) kesz("pdf", e.target.files); e.target.value = ""; }} />
      <input ref={word} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(e) => { if (e.target.files?.length) kesz("word", e.target.files); e.target.value = ""; }} />
      <input ref={foto} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files?.length) kesz("foto", e.target.files); e.target.value = ""; }} />
    </>
  );
  return { nyit, valasztok };
}

/** Olvasás közben: a „Van étlapod?” lépés mintája (az olvasás állapota). */
export function ProgramOlvasas() {
  const { t } = useFeliratok();
  return (
    <div className="r15-teendo r18k7-keszul" aria-busy="true">
      <div role="status" className="r18k7-keszul-sor"><span className="r18k7-keszul-cimke"><span className="r18k7-keszul-pont" aria-hidden="true" />{t("c30.prog.olvassuk")}</span><span className="r18k7-keszul-sav" aria-hidden="true"><span /></span></div>
    </div>
  );
}

/** A D3 üres állapota: Link · PDF · Word · Fotó (+ „Nincs még, később”, ha van hova továbbmenni). Fő gomb nincs (q30c). */
export function ProgramForras({ onKesz, onKesobb, fut = null }: { onKesz: (v: OlvasValasz) => void; onKesobb?: () => void; fut?: ProgramForrasFajta | null }) {
  const { t } = useFeliratok();
  const [mod, setMod] = useState<"valaszt" | "link" | "olvas">(fut ? "olvas" : "valaszt");
  // F6b: ha a lap nyitásakor még fut egy olvasás (újratöltés, másik lap), azt követjük — a munka-állapot látszik, hiba csak a szerver szavára
  useEffect(() => {
    if (!fut) return;
    let el = false;
    void programOlvasasVar().then((tetelek) => { if (el) return; if (tetelek?.length) onKesz({ tetelek, fajta: fut }); else { setHiba(true); setMod("valaszt"); } });
    return () => { el = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [link, setLink] = useState("");
  const [hiba, setHiba] = useState(false);
  async function olvas(be: { fajta: ProgramForrasFajta; link?: string; fajlok?: FileList }) {
    setMod("olvas");
    setHiba(false);
    const v = await programOlvas(be);
    if (!v || v.tetelek.length === 0) { setHiba(true); setMod("valaszt"); return; }
    onKesz(v);
  }
  const { nyit, valasztok } = useFajlValaszto((fajta, fajlok) => void olvas({ fajta, fajlok }));
  if (mod === "olvas") return <ProgramOlvasas />;
  if (mod === "link") {
    return (
      <div className="r18k7-link">
        <label className="r18k7-cimke" htmlFor="c30-prog-link">{t("onb.link_mezo")}</label>
        <div className="r18p-cta-sor">
          <input id="c30-prog-link" className="r18p-input" inputMode="url" value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && link.trim()) void olvas({ fajta: "link", link }); }} />
          <HalkGomb onClick={() => void olvas({ fajta: "link", link })} disabled={!link.trim()}>{t("onb.link_gomb")}</HalkGomb>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="r18k7-opciok c30-prog-opciok" role="group" aria-label={t("c30.prog.honnan_aria")}>
        <button type="button" className="r18k7-opcio" onClick={() => setMod("link")}>{Ikon.link}{t("onb.etlap_link")}</button>
        <button type="button" className="r18k7-opcio" onClick={() => nyit("pdf")}>{Ikon.pdf}{t("onb.etlap_pdf")}</button>
        <button type="button" className="r18k7-opcio" onClick={() => nyit("word")}>{Ikon.word}{t("c30.prog.word")}</button>
        <button type="button" className="r18k7-opcio" onClick={() => nyit("foto")}>{Ikon.foto}{t("onb.etlap_foto")}</button>
      </div>
      {valasztok}
      {onKesobb ? <div><HalkLink onClick={onKesobb}>{t("c30.prog.kesobb")}</HalkLink></div> : null}
      {hiba ? <Info>{t("onb.nem_sikerult")}</Info> : null}
    </>
  );
}

/** A D4 alsó lap: egy tétel javítása (vagy egy új saját tétel, ha `tetel` null). */
export function ProgramTetelLap({ tetel, nyelvek, onZar, onMentve }: { tetel: ProgramTetel | null; nyelvek: string[]; onZar: () => void; onMentve: (t: ProgramTetel) => void }) {
  const { t } = useFeliratok();
  const elso = nyelvek[0] ?? "hu", masodik = nyelvek[1] ?? null;
  const [nev1, setNev1] = useState(tetel?.nev[elso as keyof ProgramTetel["nev"]] ?? "");
  const [nev2, setNev2] = useState(masodik ? tetel?.nev[masodik as keyof ProgramTetel["nev"]] ?? "" : "");
  const [nap, setNap] = useState(tetel?.nap ?? "");
  const [kezdes, setKezdes] = useState(tetel?.kezdes ?? "");
  const [vege, setVege] = useState(tetel?.vege ?? "");
  const [hely, setHely] = useState(tetel?.helyszin[elso as keyof ProgramTetel["helyszin"]] ?? "");
  const [fajta, setFajta] = useState<ProgramFajta>(tetel?.fajta ?? "egyeb");
  const [fellepo, setFellepo] = useState(tetel?.fellepo ?? "");
  const [leiras, setLeiras] = useState(tetel?.leiras[elso as keyof ProgramTetel["leiras"]] ?? "");
  const [aktiv, setAktiv] = useState(tetel?.aktiv ?? true);
  const [kep, setKep] = useState<string | null>(tetel?.kep_fajl_id ?? null);
  const [reszletek, setReszletek] = useState(false);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState<Set<string>>(new Set());
  const fotoRef = useRef<HTMLInputElement>(null);
  const masikHely = masodik ? tetel?.helyszin[masodik as keyof ProgramTetel["helyszin"]] ?? "" : "";
  const hatarozo = (n: string) => t(`nyelv.hatarozo.${n}`);
  useEffect(() => {
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape" && !fut) onZar(); };
    document.addEventListener("keydown", bill);
    return () => document.removeEventListener("keydown", bill);
  }, [onZar, fut]);

  async function mentem() {
    if (fut) return;
    const k = idoBe(kezdes), v = idoBe(vege);
    const rossz = new Set<string>();
    if (!nev1.trim() && !nev2.trim()) rossz.add("nev");
    if (k === undefined) rossz.add("kezdes");
    if (v === undefined) rossz.add("vege");
    setHiba(rossz);
    if (rossz.size) return;
    const nyelvi = (regi: Partial<Record<string, string>> | undefined, uj: Record<string, string>) =>
      Object.fromEntries(Object.entries({ ...(regi ?? {}), ...uj }).filter(([, x]) => typeof x === "string" && x.trim()));
    const torzs = {
      nev: nyelvi(tetel?.nev, { [elso]: nev1.trim(), ...(masodik ? { [masodik]: nev2.trim() } : {}) }),
      nap: NAP_ISO.test(nap) ? nap : null,
      kezdes: k ?? null,
      vege: k ? v ?? null : null,
      helyszin: nyelvi(tetel?.helyszin, { [elso]: hely.trim() }),
      leiras: nyelvi(tetel?.leiras, { [elso]: leiras.trim() }),
      fajta, fellepo: fellepo.trim(), aktiv,
      ...(kep !== (tetel?.kep_fajl_id ?? null) ? { kep_fajl_id: kep } : {}),
    };
    setFut(true);
    const r = tetel ? await hivas("/api/program/tetel", "PUT", { id: tetel.id, ...torzs }) : await hivas("/api/program/tetel", "POST", torzs);
    setFut(false);
    if (r.statusz === 200 || r.statusz === 201) onMentve(r.torzs["tetel"] as ProgramTetel);
    else setHiba(new Set(["mentes"]));
  }
  async function fotoBe(lista: FileList | null) {
    const f = lista?.[0];
    if (!f) return;
    setFut(true);
    const id = await feltolt(f);
    setFut(false);
    if (id) setKep(id);
  }

  return (
    <div className="c30-lap-tart">
      <div className="c30-fatyol" aria-hidden="true" onClick={() => { if (!fut) onZar(); }} />
      <div className="c30-lap" role="dialog" aria-modal="true" aria-label={t("c30.tetel.lap_aria")}>
        <div className="c30-fogo" aria-hidden="true" />
        <div className="c30-lap-fej">
          <h2 className="c30-lap-cim">{t("c30.tetel.cim")}</h2>
          <button type="button" className="c30-bezar" aria-label={t("kozos.bezaras")} onClick={onZar} disabled={fut}>✕</button>
        </div>
        <div className="r18k7-mezo-blokk">
          <label className="r18k7-cimke" htmlFor="c30-pn">{t("c30.tetel.neve")}</label>
          <input id="c30-pn" className="r18p-input" value={nev1} aria-invalid={hiba.has("nev") || undefined} onChange={(e) => setNev1(e.target.value)} />
          {masodik ? <input id="c30-pn2" className="r18p-input" value={nev2} aria-label={t("c30.tetel.neve_masik", { nyelvul: hatarozo(masodik) })} onChange={(e) => setNev2(e.target.value)} /> : null}
          {masodik ? <span className="r18p-halk">{t("c30.tetel.nyelvek_sugo", { elso: hatarozo(elso), masodik: hatarozo(masodik) })}</span> : null}
        </div>
        <div className="c30-lap-sor">
          <div className="r18k7-mezo-blokk c30-lap-nap">
            <label className="r18k7-cimke" htmlFor="c30-pnap">{t("c30.tetel.nap")}</label>
            <input id="c30-pnap" className="r18p-input" type="date" value={nap} onChange={(e) => setNap(e.target.value)} />
          </div>
          <div className="r18k7-mezo-blokk c30-lap-ido">
            <label className="r18k7-cimke" htmlFor="c30-pk">{t("c30.tetel.kezdes")}</label>
            <input id="c30-pk" className="r18p-input" inputMode="numeric" value={kezdes} aria-invalid={hiba.has("kezdes") || undefined} onChange={(e) => setKezdes(e.target.value)} />
          </div>
          <div className="r18k7-mezo-blokk c30-lap-ido">
            <label className="r18k7-cimke" htmlFor="c30-pv">{t("c30.tetel.vege")}</label>
            <input id="c30-pv" className="r18p-input" inputMode="numeric" value={vege} placeholder="–" aria-invalid={hiba.has("vege") || undefined} onChange={(e) => setVege(e.target.value)} />
          </div>
        </div>
        <div className="r18k7-mezo-blokk">
          <label className="r18k7-cimke" htmlFor="c30-ph">{t("c30.rend.hol")}</label>
          <input id="c30-ph" className="r18p-input" value={hely} onChange={(e) => setHely(e.target.value)} />
          {masodik && masikHely ? <span className="r18p-halk">{t("c30.rend.hely_masik", { nyelvul: hatarozo(masodik), hely: masikHely })}</span> : null}
        </div>
        <div><HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")} {reszletek ? "▴" : "▾"}</HalkLink></div>
        {reszletek ? (
          <div className="c30-lap-reszletek" data-r15="reszletek">
            <div className="r18k7-mezo-blokk">
              <span className="r18k7-cimke">{t("c30.tetel.fajta")}</span>
              <div className="r18k7-chipek" role="radiogroup" aria-label={t("c30.tetel.fajta")}>
                {PROGRAM_FAJTAK.map((x) => <button key={x} type="button" className="r18k7-chip" role="radio" aria-checked={fajta === x} onClick={() => setFajta(x)}>{t(`c30.fajta.${x}`)}</button>)}
              </div>
            </div>
            <div className="r18k7-mezo-blokk">
              <label className="r18k7-cimke" htmlFor="c30-pf">{t("c30.tetel.fellepo")}</label>
              <input id="c30-pf" className="r18p-input" value={fellepo} onChange={(e) => setFellepo(e.target.value)} />
            </div>
            <div className="r18k7-mezo-blokk">
              <label className="r18k7-cimke" htmlFor="c30-pl">{t("c30.tetel.leiras")} <span className="r18p-halk">· {t("poszt.nem_kotelezo")}</span></label>
              <textarea id="c30-pl" className="r18s-mezo c30-lap-leiras" rows={2} value={leiras} placeholder={t("c30.tetel.leiras_pl")} onChange={(e) => setLeiras(e.target.value)} />
            </div>
            <div className="c30-lap-foto">
              <HalkGomb onClick={() => fotoRef.current?.click()} disabled={fut}>{t("c30.tetel.foto")}</HalkGomb>
              <span className="r15-info">{kep ? t("c30.tetel.foto_van") : t("poszt.nem_kotelezo")}</span>
              <input ref={fotoRef} type="file" accept="image/*" hidden onChange={(e) => { void fotoBe(e.target.files); e.target.value = ""; }} />
            </div>
            <div className="r18k7-kapcs-sor"><span>{t("c30.tetel.ne_posztoljunk")}</span><Kapcsolo be={!aktiv} valt={(b) => setAktiv(!b)} cimke={t("c30.tetel.ne_posztoljunk")} /></div>
          </div>
        ) : null}
        {hiba.has("mentes") ? <Info>{t("nevek.hiba")}</Info> : null}
        {fut ? <DolgozoGomb osztaly="c30-teljes">{t("nevek.mentem")}</DolgozoGomb> : <FoGomb osztaly="c30-teljes" onClick={() => void mentem()}>{t("nevek.mentem")}</FoGomb>}
      </div>
    </div>
  );
}
