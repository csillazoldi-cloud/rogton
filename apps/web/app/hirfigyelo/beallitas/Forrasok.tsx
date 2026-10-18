"use client";
// R-15 · 06 Mit figyeljünk — az „Oldalak” rész (design/R15/rajz/R15-lapok-3.dc.html 06a/06b + az „ÁTÍROM” UTÁN és a RITKÁBB ÁLLAPOTOK
// panel; gepezet-3 3.3–3.4). A gépezet a régi E-25 lapé, változatlanul: betöltés (GET /api/hirfigyelo/forrasok), hozzáadás (POST, utána
// azonnali ellenőrzés), ellenőrzés/újrapróbálás (POST …/ellenoriz), cím módosítása (PUT), eltávolítás megerősítéssel (DELETE), a csomag
// forrás-korlátja (`forras_max`), a hibakód → emberi mondat fordítás.
// Ami más: EGY lista (a csoportcímek — saját · szakmai · „AI által javasolt” — elmaradtak; a kézi oldalak elöl, a gép javasoltak a végén);
// rendben lévő oldalnál NINCS állapotsor (T3: forrás-állapot tiltott), csak bajnál egy halk mondat a neve alatt; a műveletek csak az
// „Átírom” után látszanak: a sor „···” menüjében (fejléce az utolsó sikeres nézés ideje), és a lista fölött „+ Új oldal”.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Forras } from "@rogton/news-monitor-core";
import { useFeliratok } from "../../../nyelv/kliens";
import { hfKeres, idoRovid, forrasNev } from "../_kozos/kliens";
import { allapotKulcs, forrasSorrend } from "./mitFigyeljunk";

// A gépi hibakódot EMBERI mondatra fordítjuk (a régi lap táblája — a „···” menü fejlécében, a nem figyelhető oldal sora mellett).
const HIBA_FELIRAT: Record<string, string> = {
  belepes_mogott: "hf.srcUnsupportedDetail",
  nem_nyilvanos: "hf.srcErrPrivate",
  ervenytelen: "hf.srcErrBadAddress",
  FORRAS_ROSSZ_CIM: "hf.srcErrBadAddress",
  FORRAS_TILTOTT_CIM: "hf.srcErrPrivate",
  FORRAS_NEM_ELERHETO: "hf.srcErrUnreachable",
  FORRAS_TILTVA: "hf.srcErrBlocked",
  FORRAS_NEM_SZOVEG: "hf.srcErrNotText",
  FORRAS_TUL_NAGY: "hf.srcErrTooBig",
  robots_tiltja: "hf.srcErrRobots",
  idotullepes: "hf.srcErrTimeout",
  nem_elerheto: "hf.srcErrUnreachable",
  nincs_tipus: "hf.srcErrNoContent",
  nincs_hirfolyam: "hf.forras_nincs_hirfolyam",
};

export type OldalakAllapot = { db: number; max: number | null };

export function Forrasok({ szerkesztheto, szerk, onAllapot }: { szerkesztheto: boolean; szerk: boolean; onAllapot?: (a: OldalakAllapot) => void }) {
  const { t, nyelv } = useFeliratok();
  const [forrasok, setForrasok] = useState<Forras[] | null>(null);
  const [forrasMax, setForrasMax] = useState<number | null>(null);
  const [betoltesHiba, setBetoltesHiba] = useState(false);
  const [ujNyitva, setUjNyitva] = useState(false);
  const [ujCim, setUjCim] = useState("");
  const [hozzaadHiba, setHozzaadHiba] = useState<string | null>(null);
  const [folyik, setFolyik] = useState<string | null>(null);
  const [hozzaadFolyik, setHozzaadFolyik] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [cimSzerkeszt, setCimSzerkeszt] = useState<{ id: string; ertek: string } | null>(null);
  const [torlesMegerosit, setTorlesMegerosit] = useState<string | null>(null);
  const listaRef = useRef<Forras[]>([]);
  const menuHely = useRef<HTMLDivElement>(null);

  const frissites = useCallback((lista: Forras[]) => {
    listaRef.current = lista;
    setForrasok(lista);
  }, []);
  useEffect(() => { if (forrasok) onAllapot?.({ db: forrasok.length, max: forrasMax }); }, [forrasok, forrasMax, onAllapot]);

  const betolt = useCallback(async () => {
    const v = await hfKeres<{ forrasok: Forras[]; forras_max?: number | null }>("/api/hirfigyelo/forrasok");
    if (v.statusz === 200 && v.torzs.forrasok) {
      setBetoltesHiba(false);
      setForrasMax(v.torzs.forras_max ?? null);
      frissites(v.torzs.forrasok);
    } else if (v.hiba === "NINCS_BEALLITAS") {
      // R-7b (audit 12.): beállítás nélkül a lista ÜRES, nem hiba
      setBetoltesHiba(false);
      frissites([]);
    } else {
      setBetoltesHiba(true);
    }
  }, [frissites]);
  useEffect(() => { void betolt(); }, [betolt]);

  // az „Átírom” bezárása a nyitott menüt, mezőt és megerősítést is bezárja
  useEffect(() => { if (!szerk) { setMenu(null); setCimSzerkeszt(null); setTorlesMegerosit(null); setUjNyitva(false); } }, [szerk]);
  useEffect(() => {
    if (!menu) return;
    const kattint = (e: MouseEvent) => { if (menuHely.current && !menuHely.current.contains(e.target as Node)) setMenu(null); };
    const bill = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    document.addEventListener("mousedown", kattint);
    document.addEventListener("keydown", bill);
    return () => { document.removeEventListener("mousedown", kattint); document.removeEventListener("keydown", bill); };
  }, [menu]);

  const ellenoriz = async (id: string) => {
    if (!szerkesztheto || folyik) return;
    setFolyik(id);
    setHozzaadHiba(null);
    const v = await hfKeres<{ forras: Forras }>(`/api/hirfigyelo/forrasok/${id}/ellenoriz`, "POST");
    setFolyik(null);
    if (v.statusz === 200 && v.torzs.forras) {
      const kapott = v.torzs.forras;
      frissites(listaRef.current.map((f) => (f.id === id ? kapott : f)));
    } else if (v.hiba) {
      setHozzaadHiba("r15.mit.mentes_hiba");
    }
  };

  const cimMentes = async (id: string) => {
    if (!szerkesztheto || folyik || !cimSzerkeszt) return;
    const cim = cimSzerkeszt.ertek.trim();
    if (cim.length < 4) { setHozzaadHiba("hf.srcAddBad"); return; }
    setFolyik(id);
    setHozzaadHiba(null);
    const v = await hfKeres<{ forras: Forras }>(`/api/hirfigyelo/forrasok/${id}`, "PUT", { cim });
    setFolyik(null);
    if (v.statusz === 200 && v.torzs.forras) {
      const kapott = v.torzs.forras;
      setCimSzerkeszt(null);
      frissites(listaRef.current.map((f) => (f.id === id ? kapott : f)));
    } else if (v.hiba === "ERVENYTELEN_ADAT") {
      setHozzaadHiba("hf.srcAddBad");
    } else if (v.hiba) {
      setHozzaadHiba("r15.mit.mentes_hiba");
    }
  };

  const eltavolit = async (id: string) => {
    if (!szerkesztheto || folyik) return;
    setFolyik(id);
    setHozzaadHiba(null);
    const v = await hfKeres<{ forras: Forras }>(`/api/hirfigyelo/forrasok/${id}`, "DELETE");
    setFolyik(null);
    if (v.statusz === 200) {
      setTorlesMegerosit(null);
      frissites(listaRef.current.filter((f) => f.id !== id));
    } else if (v.hiba) {
      setHozzaadHiba("r15.mit.mentes_hiba");
    }
  };

  const hozzaad = async () => {
    const cim = ujCim.trim();
    if (!szerkesztheto || cim.length < 4 || hozzaadFolyik) return;
    setHozzaadFolyik(true);
    setHozzaadHiba(null);
    const v = await hfKeres<{ forras: Forras }>("/api/hirfigyelo/forrasok", "POST", { cim });
    setHozzaadFolyik(false);
    if (v.statusz === 200 && v.torzs.forras) {
      const kapott = v.torzs.forras;
      setUjCim("");
      setUjNyitva(false);
      frissites([...listaRef.current, kapott]);
      // A felhasználónak ne kelljen külön „Ellenőrzés”-t nyomnia: rögtön megnézzük a címet.
      if (kapott.allapot === "ellenorzes_alatt") void ellenoriz(kapott.id);
    } else if (v.hiba === "FORRAS_KORLAT") {
      setHozzaadHiba(null);
      void betolt(); // F9-A8: a csomag forrás-korlátja betelt — a lista újratöltése mutatja a mondatot
    } else if (v.hiba) {
      setHozzaadHiba(v.hiba === "ERVENYTELEN_ADAT" ? "hf.srcAddBad" : "r15.mit.mentes_hiba");
    }
  };

  const korlatBetelt = forrasMax !== null && forrasok !== null && forrasok.length >= forrasMax;
  const lista = forrasok ? forrasSorrend(forrasok) : [];

  return (
    <div className="r15m-resz r15m-oldalak">
      <div className="r15m-resz-fej">
        <span className="r15m-resz-cim">{t("r15.mit.oldalak")}</span>
        {szerk && szerkesztheto && !korlatBetelt ? (
          <button type="button" className="r15-halk-link" onClick={() => setUjNyitva(true)} aria-expanded={ujNyitva}>
            <span aria-hidden="true">{"+\u00a0"}</span>{t("r15.mit.uj_oldal")}
          </button>
        ) : null}
      </div>
      {betoltesHiba ? (
        <div className="r15-baj" data-r15="baj" role="alert">
          <p className="r15-baj-szoveg">{t("hf.betoltes_hiba")}</p>
          <button type="button" className="r15-halk-gomb" onClick={() => { setBetoltesHiba(false); void betolt(); }}>{t("hf.ujra")}</button>
        </div>
      ) : null}
      {forrasok === null && !betoltesHiba ? <p className="r15-info" data-r15="info">{t("r15.mit.javaslunk")}</p> : null}
      {forrasok !== null && lista.length === 0 ? <p className="r15-info" data-r15="info">{t("hf.nincs_figyelt_oldal")}</p> : null}
      <div className="r15m-oldal-lista">
        {lista.map((f) => {
          const kulcs = allapotKulcs(f);
          const sor = kulcs ? t(kulcs) : null;
          const sorFolyik = folyik === f.id;
          const szerkesztE = cimSzerkeszt?.id === f.id;
          const megerositE = torlesMegerosit === f.id;
          return (
            <div className="r15m-oldal" key={f.id}>
              <div className="r15m-oldal-fo">
                <span className="r15m-oldal-szoveg">
                  <span className="r15m-oldal-nev" dir="ltr" title={f.cim}>{forrasNev(f.cim)}</span>
                  {sor ? <span className="r15m-oldal-baj">{sor}</span> : null}
                </span>
                {szerk && szerkesztheto ? (
                  <div className="r15-menu-hely" ref={menu === f.id ? menuHely : undefined}>
                    <button type="button" className="r15-pontok" aria-haspopup="menu" aria-expanded={menu === f.id}
                      aria-label={`${forrasNev(f.cim)}: ${t("hf.forras_cim_modositas")} · ${t("hf.forras_eltavolitas")}`}
                      onClick={() => setMenu((m) => (m === f.id ? null : f.id))} disabled={folyik !== null}>···</button>
                    {menu === f.id ? (
                      <div className="r15-menu r15m-menu" role="menu">
                        {f.utolso_sikeres ? <p className="r15m-menu-fej">{t("r15.mit.utoljara", { mikor: idoRovid(f.utolso_sikeres, nyelv) })}</p> : null}
                        {f.allapot !== "hasznalhato" ? (
                          <>
                            {f.hiba_ok ? <p className="r15m-menu-fej">{t(HIBA_FELIRAT[f.hiba_ok] ?? "hf.srcErrDetail")}</p> : null}
                            <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { setMenu(null); void ellenoriz(f.id); }}>{t("hf.forras_ujraprobalas")}</button>
                          </>
                        ) : null}
                        <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { setMenu(null); setTorlesMegerosit(null); setCimSzerkeszt({ id: f.id, ertek: f.cim }); }}>{t("hf.forras_cim_modositas")}</button>
                        <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { setMenu(null); setCimSzerkeszt(null); setTorlesMegerosit(f.id); }}>{t("hf.forras_eltavolitas")}</button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {szerk && szerkesztE && cimSzerkeszt ? (
                <div className="r15m-mezosor">
                  <input className="r15m-mezo" type="text" dir="ltr" value={cimSzerkeszt.ertek} aria-label={t("hf.forras_cim_modositas")} disabled={sorFolyik}
                    onChange={(e) => setCimSzerkeszt({ id: f.id, ertek: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") void cimMentes(f.id); if (e.key === "Escape") setCimSzerkeszt(null); }} />
                  <button type="button" className="r15-halk-gomb" onClick={() => void cimMentes(f.id)} disabled={sorFolyik}>{t("kozos.rendben")}</button>
                  <button type="button" className="r15-halk-link" onClick={() => setCimSzerkeszt(null)} disabled={sorFolyik}>{t("kozos.megse")}</button>
                </div>
              ) : null}
              {szerk && megerositE ? (
                <div className="r15m-mezosor">
                  <span className="r15m-kerdes">{t("r15.mit.eltavolitas_kerdes")}</span>
                  <button type="button" className="r15-halk-gomb" onClick={() => void eltavolit(f.id)} disabled={sorFolyik}>{t("kozos.rendben")}</button>
                  <button type="button" className="r15-halk-link" onClick={() => setTorlesMegerosit(null)} disabled={sorFolyik}>{t("kozos.megse")}</button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {szerk && szerkesztheto && korlatBetelt ? <p className="r15-info" data-r15="info">{t("hf.forras_korlat_mondat", { m: forrasMax ?? 0 })}</p> : null}
      {szerk && szerkesztheto && ujNyitva && !korlatBetelt ? (
        <div className="r15m-mezosor">
          <input className="r15m-mezo" type="text" dir="ltr" autoFocus value={ujCim} placeholder={t("r15.mit.oldal_pelda")} aria-label={t("r15.mit.uj_oldal")}
            onChange={(e) => setUjCim(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void hozzaad(); } if (e.key === "Escape") setUjNyitva(false); }} />
          <button type="button" className="r15-halk-gomb" onClick={() => void hozzaad()} disabled={ujCim.trim().length < 4 || hozzaadFolyik} aria-busy={hozzaadFolyik}>{t("hf.forras_hozzaadas")}</button>
        </div>
      ) : null}
      {hozzaadHiba ? (
        <div className="r15-baj" data-r15="baj" role="alert">
          <p className="r15-baj-szoveg">{t(hozzaadHiba)}</p>
          <button type="button" className="r15-halk-gomb" onClick={() => setHozzaadHiba(null)}>{t("kozos.rendben")}</button>
        </div>
      ) : null}
    </div>
  );
}
