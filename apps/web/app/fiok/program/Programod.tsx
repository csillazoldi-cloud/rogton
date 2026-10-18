"use client";
import { useEffect, useState } from "react";
import type { ProgramTetel } from "@rogton/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { HalkGomb, HalkLink, Info, KerdesCim } from "../../_kozos/R15";
import { ProgramForras, ProgramNapok, ProgramOlvasas, ProgramTetelLap, idoszakCimke, programOlvas, programOlvasasVar, useFajlValaszto } from "../../_kozos/C30Program";
import "../../_kozos/r15-lapok.css";

// c30 F6 (rajz D9a): „‹ Szervezet adatai”, „Programod”, a csendes összegző sor („88 program · jún. 25–28. · a Word-fájlból”),
// „Újraolvasom” · „Másik fájl”, a napok összecsukva, „+ Új program”, és a megnyugtató sor („Amit átírtál, azt újraolvasáskor sem
// írjuk felül.”). Az „Újraolvasom” a linket újra beolvassa; fájlnál (Word, PDF, fotó) — amit nem tárolunk — ugyanazt a fajtát kéri újra.
type Forras = { fajta: "link" | "pdf" | "word" | "foto"; link?: string } | null;

export function Programod({ kezdo, nyelvek, forras, szerkesztheti, fut = null }: { kezdo: ProgramTetel[]; nyelvek: string[]; forras: Forras; szerkesztheti: boolean; fut?: "link" | "pdf" | "word" | "foto" | null }) {
  const { t, nyelv } = useFeliratok();
  const [tetelek, setTetelek] = useState(kezdo);
  const [honnan, setHonnan] = useState<Forras>(forras);
  const [lap, setLap] = useState<ProgramTetel | null | "uj">(null);
  const [mod, setMod] = useState<"lista" | "valaszt" | "olvas">(fut ? "olvas" : kezdo.length ? "lista" : "valaszt");
  const [hiba, setHiba] = useState(false);
  // c30 F6b: a lap nyitásakor még futó háttér-olvasást megvárjuk (a munka-állapot látszik; hiba csak a szerver szavára)
  useEffect(() => {
    if (!fut) return;
    let el = false;
    void programOlvasasVar().then((v) => { if (el) return; if (v?.length) { setTetelek(v); setHonnan({ fajta: fut }); } else setHiba(true); setMod(v?.length || kezdo.length ? "lista" : "valaszt"); });
    return () => { el = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function olvas(be: { fajta: "link" | "pdf" | "word" | "foto"; link?: string; fajlok?: FileList }) {
    setMod("olvas");
    setHiba(false);
    const v = await programOlvas(be);
    if (v && v.tetelek.length) { setTetelek(v.tetelek); setHonnan({ fajta: v.fajta, ...(be.link ? { link: be.link } : {}) }); } else setHiba(true);
    setMod("lista");
  }
  const { nyit, valasztok } = useFajlValaszto((fajta, fajlok) => void olvas({ fajta, fajlok }));
  const napok = tetelek.map((x) => x.nap).filter((x): x is string => !!x).sort();
  const idoszak = napok.length ? idoszakCimke(napok[0]!, napok[napok.length - 1]!, nyelv) : "";
  const osszegzes = [t("c30.prog.osszegzes", { n: tetelek.length, idoszak }).replace(/ · $/, ""), honnan ? t(`c30.prog.honnan.${honnan.fajta}`) : ""].filter(Boolean).join(" · ");
  const ujraolvas = () => { if (!honnan) { setMod("valaszt"); return; } if (honnan.fajta === "link" && honnan.link) void olvas({ fajta: "link", link: honnan.link }); else nyit(honnan.fajta); };

  return (
    <>
    {/* a nyitott tétel-lap alatt a lap többi része néma és elérhetetlen (rajz D4a mintája) */}
    <main className="km-lap-keret r15-lap r18f-lap c30-programod" aria-hidden={lap ? true : undefined} inert={!!lap}>
      <div><HalkLink href="/fiok">‹ {t("nav.szervezet_adatai")}</HalkLink></div>
      <KerdesCim cim={t("c30.prog.oldal_cim")} />
      {mod === "olvas" ? <ProgramOlvasas /> : mod === "valaszt" || tetelek.length === 0 ? (
        szerkesztheti ? <ProgramForras onKesz={(v) => { setTetelek(v.tetelek); setHonnan({ fajta: v.fajta }); setMod("lista"); }} /> : null
      ) : (
        <>
          <Info>{osszegzes}</Info>
          {szerkesztheti ? <div className="c30-prog-linkek"><HalkGomb onClick={ujraolvas}>{t("c30.prog.ujraolvasom")}</HalkGomb><HalkLink onClick={() => setMod("valaszt")}>{t("c30.prog.masik_fajl")}</HalkLink></div> : null}
          {valasztok}
          {hiba ? <Info>{t("onb.nem_sikerult")}</Info> : null}
          <ProgramNapok tetelek={tetelek} nyelvek={nyelvek} elsoNyitva={false} onTetel={(x) => { if (szerkesztheti) setLap(x); }} />
          {szerkesztheti ? <button type="button" className="c30-prog-plusz" onClick={() => setLap("uj")}>{t("c30.prog.uj")}</button> : null}
          <Info>{t("c30.prog.felul_nem")}</Info>
        </>
      )}
    </main>
      {lap ? (
        <ProgramTetelLap tetel={lap === "uj" ? null : lap} nyelvek={nyelvek} onZar={() => setLap(null)}
          onMentve={(x) => { setTetelek((l) => (l.some((y) => y.id === x.id) ? l.map((y) => (y.id === x.id ? x : y)) : [...l, x])); setLap(null); }} />
      ) : null}
    </>
  );
}
