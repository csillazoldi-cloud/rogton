"use client";
// R-18 8. kör · Naptár (Csilla 10-14; Claude Design „Round 8 · A sötét / B világos”, design/R18-arculatfrissites/round8/shot-*-r8-naptar-*):
// asztalon EGY hét hét oszlopban (H … V), a hét lapozható (‹ okt. 12–18. › · Ma); telefonon a hét egy sávban (pöttyökkel), alatta a
// kiválasztott nap posztjai, „+ Új poszt”. Egy kérdés (T1: „Kitetted a mai posztot?” — húzás közben „Melyik napra teszed?”), egy fő gomb (T2).
// Áthelyezés: asztalon húzással (egér: elmozdításra indul), telefonon hosszú nyomással a hét sávjára — és a kártya „…” menüjében a „Másik nap”
// (telefonon, zárt válasz 1). A „…” menü: „Levétel a naptárból” · „Poszt törlése” — azonnal, 10 mp-es „Visszavonás”-sal, második kérdés nélkül
// (zárt válasz 2; puha törlés, poszt/index.ts naptarMuvelet). A hétvége nem halványabb (zárt válasz 3). A nap „+” gombja a Posztszöveg
// lapot nyitja a nappal (?nap=…; a „Kész, másolom” arra a napra teszi). A műveletek: POST /api/poszt/<id>/naptar.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import { FoGomb, Halad, HalkGomb, Info, KerdesCim } from "../_kozos/R15";
import {
  VALASZTO_NAPOK,
  foglaltsag,
  hetKezdete,
  hetNapja,
  hetiSzamlalo,
  napHozzaad,
  naptarKerdes,
  posztAllapot,
  posztNapja,
  type Nap,
  type NaptarPoszt,
} from "../../poszt/naptar";
import { otletSzovegek, useOtletMegir } from "../_kozos/C30Horgony";
import type { R15HorgonyOtlet } from "../../r15/tipusok";
import "../_kozos/r15-lapok.css";
import "./naptar.css";

const HELY: Record<string, string> = { hu: "hu-HU", ro: "ro-RO", en: "en-GB" };
const datum = (nap: Nap) => new Date(`${nap}T12:00:00Z`);
const nagybetu = (s: string) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);
const posztLap = (id: string) => `/poszt?munka=${encodeURIComponent(id)}`;
/** A visszavonás ideje (zárt válasz 2: 10 mp). */
const VISSZAVONAS_MS = 10_000;
/** Telefonon a hosszú nyomás ideje, és az elmozdulás, ami fölött görgetés (nem húzás) — illetve egérrel a húzás indul. */
const HOSSZU_NYOMAS_MS = 450;
const ELMOZDULAS_PX = 8;

/** Egy sablon, amelynek egyik helyőrzője React-elem (pl. a félkövér „1 kitéve”). */
function Sablon({ sablon, elemek }: { sablon: string; elemek: Record<string, ReactNode> }) {
  const reszek = sablon.split(/(\{\w+\})/g);
  return <>{reszek.map((r, i) => { const m = /^\{(\w+)\}$/.exec(r); return m && m[1]! in elemek ? <span key={i}>{elemek[m[1]!]}</span> : r; })}</>;
}

/** `tel`: a telefonos nézetben indult (a kártya helyben emelkedik, a cél a hét sávja); `erinto`: ujjal (a lap ne görgessen közben). */
type Huzas = { id: string; x: number; y: number; dx: number; dy: number; w: number; cel: Nap | null; erinto: boolean; tel: boolean };
type Visszavonhato = { id: string; fajta: "levesz" | "torol" };

export function Naptar({ ma, posztok, szerkesztheti, szellemek = [] }: { ma: Nap; posztok: NaptarPoszt[]; korabbi?: number; szerkesztheti: boolean; szellemek?: R15HorgonyOtlet[] }) {
  const { t, nyelv } = useFeliratok();
  const { megir, fut: megirFut, hiba: megirHiba } = useOtletMegir();
  const router = useRouter();
  const [fut, setFut] = useState<string | null>(null);
  const [hiba, setHiba] = useState("");
  const het0 = hetKezdete(ma);
  const [het, setHet] = useState<Nap>(het0);
  const [menu, setMenu] = useState<NaptarPoszt | null>(null);
  const [valaszto, setValaszto] = useState<NaptarPoszt | null>(null);
  const [huzas, setHuzas] = useState<Huzas | null>(null);
  const [vissza, setVissza] = useState<Visszavonhato | null>(null);
  const hely = HELY[nyelv] ?? "hu-HU";

  const f = useMemo(() => ({
    hetnap: new Intl.DateTimeFormat(hely, { weekday: "long", timeZone: "UTC" }),
    honapNap: new Intl.DateTimeFormat(hely, { month: "short", day: "numeric", timeZone: "UTC" }),
  }), [hely]);
  const hetnapNev = (nap: Nap) => f.hetnap.format(datum(nap));
  const rovidDatum = (nap: Nap) => f.honapNap.format(datum(nap));
  // „okt. 12–18.” / „12–18 oct.” / „12–18 Oct”: kézzel a formatToParts-ból — a formatRange a Node és a böngésző ICU-jában eltér (React 418, mérve)
  const tartomany = (a: Nap, b: Nap) => {
    const da = datum(a), db = datum(b);
    if (da.getUTCMonth() !== db.getUTCMonth()) return `${f.honapNap.format(da)} – ${f.honapNap.format(db)}`;
    return f.honapNap.formatToParts(db).map((p) => (p.type === "day" ? `${da.getUTCDate()}–${p.value}` : p.value)).join("");
  };
  const napNev = (nap: Nap) => (nap === ma ? t("r18.naptar.nap_ma", { datum: rovidDatum(nap) }) : `${nagybetu(hetnapNev(nap))}, ${rovidDatum(nap)}`);

  const kerdes = naptarKerdes(posztok, ma);
  // telefonon a kérdés napja nyílik (T1: a válasz gombja látsszon) — a kitétel napja, a javasolt nap, különben ma
  const kerdesNap: Nap = kerdes.fajta === "kitetted" ? (posztok.find((p) => p.id === kerdes.id)?.tervezett_nap ?? ma) : kerdes.fajta === "javasolt" ? kerdes.nap : ma;
  const [napTel, setNapTel] = useState<Nap>(kerdesNap);
  const szamlalo = hetiSzamlalo(posztok, ma);
  const foglalt = foglaltsag(posztok);

  // Esc zárja a menüt és a napválasztót
  useEffect(() => {
    if (!valaszto && !menu) return;
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape") { setValaszto(null); setMenu(null); } };
    document.addEventListener("keydown", bill);
    return () => document.removeEventListener("keydown", bill);
  }, [valaszto, menu]);

  // a „Visszavonás” 10 mp után eltűnik (a művelet utána is visszafordítható a kiszolgálón — itt csak a gomb megy)
  useEffect(() => {
    if (!vissza) return;
    const id = window.setTimeout(() => setVissza(null), VISSZAVONAS_MS);
    return () => window.clearTimeout(id);
  }, [vissza]);

  const muvelet = useCallback(async (id: string, torzs: Record<string, unknown>): Promise<boolean> => {
    setFut(id); setHiba("");
    const r = await hivas(`/api/poszt/${encodeURIComponent(id)}/naptar`, "POST", torzs);
    setFut(null);
    if (r.statusz !== 200) { setHiba(t("r18.naptar.hiba")); return false; }
    setValaszto(null);
    router.refresh();
    return true;
  }, [router, t]);

  async function menuMuvelet(p: NaptarPoszt, fajta: "levesz" | "torol") {
    setMenu(null);
    if (await muvelet(p.id, { muvelet: fajta })) setVissza({ id: p.id, fajta });
  }
  async function visszavonas() {
    if (!vissza) return;
    const v = vissza;
    setVissza(null);
    await muvelet(v.id, { muvelet: "visszavon" });
  }

  // ---- húzás (egér: elmozdításra; érintés: hosszú nyomásra) ----
  const huzRef = useRef<{ p: NaptarPoszt; x0: number; y0: number; aktiv: boolean; erinto: boolean; idozito: number | null; kartya: HTMLElement } | null>(null);
  const kattintasTilt = useRef(false);
  const huzasRef = useRef<Huzas | null>(null);
  huzasRef.current = huzas;

  const celAlatt = (x: number, y: number): Nap | null => {
    const el = document.elementFromPoint(x, y);
    const c = el?.closest?.("[data-r18n-cel]");
    return (c?.getAttribute("data-r18n-cel") as Nap | null) ?? null;
  };
  const huzasIndul = (x: number, y: number) => {
    const h = huzRef.current;
    if (!h) return;
    h.aktiv = true;
    kattintasTilt.current = true;
    const r = h.kartya.getBoundingClientRect();
    setHuzas({ id: h.p.id, x, y, dx: x - r.left, dy: y - r.top, w: r.width, cel: celAlatt(x, y), erinto: h.erinto, tel: window.matchMedia("(max-width: 1023px)").matches });
    try { navigator.vibrate?.(10); } catch { /* nincs */ }
  };
  const huzasVege = useCallback(() => {
    const h = huzRef.current;
    if (h?.idozito) window.clearTimeout(h.idozito);
    huzRef.current = null;
    window.removeEventListener("pointermove", mozgas);
    window.removeEventListener("pointerup", felenged);
    window.removeEventListener("pointercancel", megszakad);
    setHuzas(null);
    window.setTimeout(() => { kattintasTilt.current = false; }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function mozgas(e: PointerEvent) {
    const h = huzRef.current;
    if (!h) return;
    if (!h.aktiv) {
      const tav = Math.hypot(e.clientX - h.x0, e.clientY - h.y0);
      if (tav <= ELMOZDULAS_PX) return;
      if (h.erinto) { huzasVege(); return; } // érintésnél a hosszú nyomás előtti mozdulat görgetés
      huzasIndul(e.clientX, e.clientY);
      return;
    }
    const cel = celAlatt(e.clientX, e.clientY);
    setHuzas((x) => (x ? { ...x, x: e.clientX, y: e.clientY, cel } : x));
  }
  function felenged() {
    const h = huzRef.current;
    const most = huzasRef.current;
    if (h?.aktiv && most?.cel && most.cel !== posztNapja(h.p)) void muvelet(h.p.id, { muvelet: "nap", nap: most.cel });
    huzasVege();
  }
  function megszakad() { huzasVege(); }
  // érintéses húzás közben a lap ne görgessen
  useEffect(() => {
    if (!huzas?.erinto) return;
    const tilt = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", tilt, { passive: false });
    return () => document.removeEventListener("touchmove", tilt);
  }, [huzas?.erinto]);
  useEffect(() => () => huzasVege(), [huzasVege]);

  function lenyom(e: React.PointerEvent<HTMLElement>, p: NaptarPoszt) {
    if (!szerkesztheti || fut !== null || posztAllapot(p) === "kiteve" || e.button !== 0) return;
    if ((e.target as Element).closest("button")) return;
    const erinto = e.pointerType !== "mouse";
    huzRef.current = { p, x0: e.clientX, y0: e.clientY, aktiv: false, erinto, idozito: null, kartya: e.currentTarget };
    if (erinto) {
      const x = e.clientX, y = e.clientY;
      huzRef.current.idozito = window.setTimeout(() => huzasIndul(x, y), HOSSZU_NYOMAS_MS);
    }
    window.addEventListener("pointermove", mozgas);
    window.addEventListener("pointerup", felenged);
    window.addEventListener("pointercancel", megszakad);
  }

  // ---- a kérdés (T1) és a heti számláló (T8) ----
  const kerdesCim = huzas ? t("r18.naptar.huzas_cim")
    : kerdes.fajta === "kitetted" ? ((posztok.find((p) => p.id === kerdes.id)?.tervezett_nap ?? ma) < ma ? t("r18.naptar.kerdes_kitetted_elmult") : t("r18.naptar.kerdes_kitetted"))
    : kerdes.fajta === "javasolt" ? (hetKezdete(kerdes.nap) > het0 ? t("r18.naptar.kerdes_jovo", { nap: t(`r18.naptar.napon.${hetNapja(kerdes.nap)}`) }) : t("r18.naptar.kerdes_ezen", { nap: t(`r18.naptar.napon.${hetNapja(kerdes.nap)}`) }))
    : kerdes.fajta === "rendben" ? t("r18.naptar.kerdes_rendben")
    : t("r18.naptar.kerdes_ures");
  const arany = szamlalo.kiteve + szamlalo.tervezett === 0 ? 0 : szamlalo.kiteve / (szamlalo.kiteve + szamlalo.tervezett);
  const kiteveSzo = <strong className="r18n-halad-szam">{t("r18.naptar.kiteve_db", { n: szamlalo.kiteve })}</strong>;
  const haladSablon = (asztal: boolean) => szamlalo.tervezett > 0
    ? <Sablon sablon={t(asztal ? "r18.naptar.halad" : "r18.naptar.halad_tel")} elemek={{ kiteve: kiteveSzo, tervezett: t("r18.naptar.tervezett_db", { n: szamlalo.tervezett }) }} />
    : <Sablon sablon={t(asztal ? "r18.naptar.halad_ures" : "r18.naptar.halad_tel_ures")} elemek={{ kiteve: kiteveSzo }} />;

  const napPosztjai = useMemo(() => {
    const m = new Map<Nap, NaptarPoszt[]>();
    for (const p of posztok) {
      const n = posztNapja(p);
      if (n) m.set(n, [...(m.get(n) ?? []), p]);
    }
    return m;
  }, [posztok]);

  // ---- egy poszt kártyája ----
  function Kartya({ p, tel = false }: { p: NaptarPoszt; tel?: boolean }) {
    const allapot = posztAllapot(p);
    const nap = posztNapja(p);
    const esedekes = allapot === "tervezett" && !!nap && nap <= ma;
    const foKitetted = kerdes.fajta === "kitetted" && kerdes.id === p.id;
    const foJavasolt = kerdes.fajta === "javasolt" && kerdes.id === p.id;
    const huzott = huzas?.id === p.id;
    const zarolt = !szerkesztheti || fut !== null;
    let allapotSzo: string;
    let allapotOsztaly = "r18n-allapot";
    let muvelet_: ReactNode = null;
    if (allapot === "kiteve") { allapotSzo = t("r18.naptar.allapot_kiteve"); allapotOsztaly += " r18n-kiteve"; }
    else if (esedekes && !(huzott && tel)) {
      allapotSzo = t("r18.naptar.kitetted_rovid"); allapotOsztaly += " r18n-hangsuly";
      if (szerkesztheti) muvelet_ = foKitetted
        ? <FoGomb onClick={() => void muvelet(p.id, { muvelet: "kitettem" })} disabled={zarolt}>{t("r18.naptar.kitettem")}</FoGomb>
        : <HalkGomb onClick={() => void muvelet(p.id, { muvelet: "kitettem" })} disabled={zarolt}>{t("r18.naptar.kitettem")}</HalkGomb>;
    } else if (allapot === "javasolt") {
      allapotSzo = t("r18.naptar.javasolt_nap"); allapotOsztaly += " r18n-hangsuly";
      if (szerkesztheti && !huzott) muvelet_ = foJavasolt
        ? <FoGomb onClick={() => void muvelet(p.id, { muvelet: "elfogad" })} disabled={zarolt}>{t("r18.naptar.elfogadom")}</FoGomb>
        : <HalkGomb onClick={() => void muvelet(p.id, { muvelet: "elfogad" })} disabled={zarolt}>{t("r18.naptar.elfogadom")}</HalkGomb>;
    } else allapotSzo = t("r18.naptar.allapot_tervezett");
    const aktiv = foKitetted && !huzott;
    const tobb = szerkesztheti ? (
      <button type="button" className="r18n8-tobb" aria-label={t("r18.naptar.tobb", { nev: p.rovid_nev })} aria-haspopup="dialog" disabled={fut !== null}
        onClick={() => setMenu(p)}>
        <span aria-hidden="true">···</span>
      </button>
    ) : null;
    const osztaly = ["r18n8-kartya", tel ? "r18n8-kartya-tel" : "", aktiv ? "r18n8-aktiv" : "", allapot === "javasolt" ? "r18n8-javasolt" : "", huzott && tel ? "r18n8-emelt" : "", szerkesztheti && allapot !== "kiteve" ? "r18n8-huzhato" : ""].filter(Boolean).join(" ");
    return (
      <div className={osztaly} data-r15={aktiv ? "teendo" : undefined} data-r18n-allapot={esedekes ? "kitetted" : allapot} aria-busy={fut === p.id ? true : undefined}
        onPointerDown={(e) => lenyom(e, p)} onClickCapture={(e) => { if (kattintasTilt.current) { e.preventDefault(); e.stopPropagation(); } }}
        onContextMenu={(e) => { if (huzRef.current) e.preventDefault(); }}>
        {p.kep_url ? (
          <span className="r18n8-kep"><img src={p.kep_url} alt="" draggable={false} />{tobb}</span>
        ) : null}
        <span className="r18n8-cim-sor">
          <a href={posztLap(p.id)} className="r18n8-cim" draggable={false}>{p.rovid_nev}</a>
          {p.kep_url ? null : tobb}
        </span>
        <span className={allapotOsztaly}>{allapotSzo}</span>
        {muvelet_ ? <div className="r18n8-muvelet">{muvelet_}</div> : null}
      </div>
    );
  }
  // a húzott kártya helye (asztal): szaggatott keret, benne az állapot (rajz: „Javasolt nap”)
  const Hely = ({ p }: { p: NaptarPoszt }) => (
    <div className="r18n8-hely" aria-hidden="true">{posztAllapot(p) === "javasolt" ? t("r18.naptar.javasolt_nap") : t("r18.naptar.allapot_tervezett")}</div>
  );

  // c30 F8 (rajz D7b): a horgonyzott ötlet szellem-sora a napján — halk, szaggatott, nem poszt (T6); egy halk „Megírjuk” gomb
  const Szellem = ({ o }: { o: R15HorgonyOtlet }) => (
    <div className="c30-szellem">
      <span>{otletSzovegek(o, t, nyelv).szellem}</span>
      {szerkesztheti ? <HalkGomb onClick={() => void megir(o)} disabled={megirFut !== null}>{t("r18.sajat.megirjuk")}</HalkGomb> : null}
    </div>
  );
  const napSzellemei = (nap: Nap) => szellemek.filter((o) => o.nap === nap);

  // ---- asztal: egy hét hét oszlopban ----
  const hetNapjai = Array.from({ length: 7 }, (_, i) => napHozzaad(het, i));
  const ujPosztNapra = (nap: Nap) => `/poszt?nap=${nap}`;
  const asztal = (
    <div className="r18n8-racs" role="grid" aria-label={tartomany(het, napHozzaad(het, 6))}>
      {hetNapjai.map((nap) => {
        const lista = napPosztjai.get(nap) ?? [];
        const maNap = nap === ma;
        const cel = huzas?.cel === nap && !huzas.tel;
        return (
          <div key={nap} role="gridcell" className={["r18n8-oszlop", maNap ? "r18n8-ma" : "", cel ? "r18n8-cel" : ""].filter(Boolean).join(" ")} data-r18n-cel={szerkesztheti ? nap : undefined}>
            <div className="r18n8-oszlop-fej">
              <span className="r18n8-rovid">{t(`r18.naptar.rovid.${hetNapja(nap)}`)}</span>
              <span className={maNap ? "r18n8-szam r18n8-szam-ma" : "r18n8-szam"}>{datum(nap).getUTCDate()}</span>
            </div>
            <div className="r18n8-oszlop-posztok">
              {lista.map((p) => (huzas?.id === p.id && !huzas.tel ? <Hely key={p.id} p={p} /> : <Kartya key={p.id} p={p} />))}
              {napSzellemei(nap).map((o) => <Szellem key={o.kulcs} o={o} />)}
            </div>
            {szerkesztheti ? (
              <a className="r18n8-plusz" href={ujPosztNapra(nap)} aria-label={t("r18.naptar.uj_poszt_napra", { nap: napNev(nap) })}><span aria-hidden="true">+</span></a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
  const huzottPoszt = huzas && !huzas.tel ? posztok.find((p) => p.id === huzas.id) ?? null : null;
  const lebego = huzottPoszt && huzas ? (
    <div className="r18n8-lebego" style={{ left: huzas.x - huzas.dx, top: huzas.y - huzas.dy, width: huzas.w }} aria-hidden="true">
      <Kartya p={huzottPoszt} />
    </div>
  ) : null;

  // ---- telefon: a hét sávja + a nap posztjai ----
  const telHet = hetKezdete(napTel);
  const sav = (
    <div className="r18n8-sav" role="radiogroup" aria-label={tartomany(telHet, napHozzaad(telHet, 6))}>
      {Array.from({ length: 7 }, (_, i) => napHozzaad(telHet, i)).map((nap) => {
        const lista = napPosztjai.get(nap) ?? [];
        const mind = lista.length > 0 && lista.every((p) => posztAllapot(p) === "kiteve");
        const cel = huzas?.tel && huzas.cel === nap;
        return (
          <button key={nap} type="button" role="radio" aria-checked={nap === napTel} aria-label={napNev(nap)} data-r18n-cel={szerkesztheti ? nap : undefined}
            className={["r18n8-sav-nap", nap === napTel ? "r18n8-valasztott" : "", cel ? "r18n8-cel" : ""].filter(Boolean).join(" ")} onClick={() => setNapTel(nap)}>
            <span className="r18n8-rovid">{t(`r18.naptar.rovid.${hetNapja(nap)}`)}</span>
            <span className={nap === ma ? "r18n8-szam r18n8-szam-ma-tel" : "r18n8-szam"}>{datum(nap).getUTCDate()}</span>
            <span className={lista.length === 0 ? "r18n8-pont r18n8-pont-nincs" : mind ? "r18n8-pont r18n8-pont-kesz" : "r18n8-pont"} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
  const napLista = napPosztjai.get(napTel) ?? [];
  const telefon = (
    <div className="r18n8-tel">
      {sav}
      <div className="r18n8-lapozo r18n8-lapozo-nap">
        <button type="button" className="r18n8-nyil" aria-label={t("r18.naptar.elozo_nap")} onClick={() => setNapTel(napHozzaad(napTel, -1))}><Nyil irany="bal" /></button>
        <span className="r18n8-tartomany">{napNev(napTel)}</span>
        <button type="button" className="r18n8-nyil" aria-label={t("r18.naptar.kovetkezo_nap")} onClick={() => setNapTel(napHozzaad(napTel, 1))}><Nyil irany="jobb" /></button>
      </div>
      <div className="r18n8-tel-posztok">{napLista.map((p) => <Kartya key={p.id} p={p} tel />)}{napSzellemei(napTel).map((o) => <Szellem key={o.kulcs} o={o} />)}</div>
      {szerkesztheti ? <a className="r18n8-uj-tel" href={ujPosztNapra(napTel)}>{t("r18.naptar.uj_poszt")}</a> : null}
    </div>
  );

  // ---- a „…” menü: Levétel · Törlés (azonnal, Visszavonással) · telefonon a Másik nap ----
  const menuLap = menu ? (
    <>
      <div className="r18n-fatyol" aria-hidden="true" onClick={() => setMenu(null)} />
      <div className="r18n8-menu" role="dialog" aria-modal="true" aria-label={t("r18.naptar.mit_szeretnel")}>
        <div className="r18n-fogo" aria-hidden="true" />
        <h2 className="r18n8-menu-cim">{t("r18.naptar.mit_szeretnel")}</h2>
        <button type="button" className="r18n8-opcio r18n8-opcio-fo" onClick={() => void menuMuvelet(menu, "levesz")} disabled={fut !== null}>
          <span className="r18n8-opcio-nev">{t("r18.naptar.levetel")}</span><span className="r18n8-opcio-al">{t("r18.naptar.levetel_al")}</span>
        </button>
        <button type="button" className="r18n8-opcio r18n8-opcio-torol" onClick={() => void menuMuvelet(menu, "torol")} disabled={fut !== null}>
          <span className="r18n8-opcio-nev">{t("r18.naptar.torles")}</span><span className="r18n8-opcio-al">{t("r18.naptar.torles_al")}</span>
        </button>
        {posztAllapot(menu) !== "kiteve" ? (
          <button type="button" className="r18n8-opcio r18n8-csak-tel" onClick={() => { const p = menu; setMenu(null); setValaszto(p); }} disabled={fut !== null}>
            <span className="r18n8-opcio-nev">{t("r18.naptar.masik_nap")}</span>
          </button>
        ) : null}
        <button type="button" className="r18n8-megse" onClick={() => setMenu(null)}>{t("kozos.megse")}</button>
      </div>
    </>
  ) : null;

  // ---- a napválasztó (ma + 13 nap, egy koppintás) — a „Másik nap” a menüből ----
  const valasztoNapok = Array.from({ length: VALASZTO_NAPOK }, (_, i) => napHozzaad(ma, i));
  const kivalasztott = valaszto ? (valaszto.tervezett_nap ?? valaszto.javasolt_nap) : null;
  const valasztoLap = valaszto ? (
    <>
      <div className="r18n-fatyol" aria-hidden="true" onClick={() => setValaszto(null)} />
      <div className="r18n-valaszto" role="dialog" aria-modal="true" aria-label={t("r18.naptar.valaszto_cim")}>
        <div className="r18n-fogo" aria-hidden="true" />
        <div className="r18n-valaszto-fej">
          <h2 className="r18n-valaszto-cim">{t("r18.naptar.valaszto_cim")}</h2>
          <button type="button" className="r18n-bezar" aria-label={t("r18.naptar.bezaras")} onClick={() => setValaszto(null)}>✕</button>
        </div>
        <div role="radiogroup" aria-label={t("r18.naptar.valaszto_cim")} className="r18n-napsorok">
          {valasztoNapok.map((nap) => {
            const db = (foglalt.get(nap) ?? 0) - (nap === kivalasztott ? 1 : 0);
            const megj = nap === valaszto.javasolt_nap && !valaszto.tervezett_nap ? t("r18.naptar.javasolt_megj") : db > 0 ? t("r18.naptar.poszt_db", { n: db }) : "";
            const nev = nap === ma ? `${t("r18.naptar.ma", { nap: hetnapNev(nap) })}, ${rovidDatum(nap)}` : `${nagybetu(hetnapNev(nap))}, ${rovidDatum(nap)}`;
            return (
              <button key={nap} type="button" role="radio" aria-checked={nap === kivalasztott} className="r18n-napsor" disabled={fut !== null}
                onClick={() => void muvelet(valaszto.id, { muvelet: "nap", nap })}>
                <span>{nev}</span><span className="r18n-napsor-megj">{megj}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  ) : null;

  const posztotIrok = kerdes.fajta === "rendben" || kerdes.fajta === "ures";

  return (
    <main className="km-lap-keret r15-lap r18n-lap r18n8-lap" data-huzas={huzas ? "1" : undefined}>
      <div className="r18n8-fej">
        <KerdesCim cim={kerdesCim} />
        <div className="r18n8-fej-sor">
          <Halad arany={arany} osztaly="r18n8-halad">
            <span className="r18n8-csak-asztal">{haladSablon(true)}</span>
            <span className="r18n8-csak-tel">{haladSablon(false)}</span>
          </Halad>
          <div className="r18n8-lapozo r18n8-csak-asztal">
            <button type="button" className="r18n8-nyil" aria-label={t("r18.naptar.elozo_het")} onClick={() => setHet(napHozzaad(het, -7))}><Nyil irany="bal" /></button>
            <span className="r18n8-tartomany">{tartomany(het, napHozzaad(het, 6))}</span>
            <button type="button" className="r18n8-nyil" aria-label={t("r18.naptar.kovetkezo_het")} onClick={() => setHet(napHozzaad(het, 7))}><Nyil irany="jobb" /></button>
            <button type="button" className="r18n8-ma-link" onClick={() => { setHet(het0); setNapTel(ma); }}>{t("r18.naptar.ma_link")}</button>
          </div>
        </div>
        {posztotIrok ? <FoGomb href="/poszt">{t("r18.naptar.posztot_irok")}</FoGomb> : null}
      </div>
      {hiba ? <Info>{hiba}</Info> : null}
      {megirHiba ? <Info>{megirHiba}</Info> : null}
      <div className="r18n8-csak-asztal">{asztal}</div>
      <div className="r18n8-csak-tel">{telefon}</div>
      {lebego}
      {vissza ? (
        <div className="r18n8-vissza" role="status" aria-live="polite">
          <span>{t(vissza.fajta === "torol" ? "r18.naptar.torolve" : "r18.naptar.levetelve")}</span>
          <button type="button" className="r18n8-vissza-gomb" onClick={() => void visszavonas()}>{t("r18.naptar.visszavonas")}</button>
        </div>
      ) : null}
      {menuLap}
      {valasztoLap}
    </main>
  );
}

function Nyil({ irany }: { irany: "bal" | "jobb" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d={irany === "bal" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
