"use client";
import { useState } from "react";
import type { KinalatSor, TemaTerv } from "@rogton/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { hivas } from "../../_kozos/kliens";
import { Kapcsolo } from "../../_kozos/Kapcsolo";
import { FoGomb, HalkLink, Info, KerdesCim } from "../../_kozos/R15";
import { KinalatLista, TemaLista } from "../../_kozos/R18Kinalat";
import "../../_kozos/r15-lapok.css";
import "../nevek/nevek.css";

// R-18 7. kör (rajz „Szervezet adatai · Kínálat és árak”): alnavigáció (Alapadatok · Kínálat és árak · Hivatalos nevek · N), a pipás lista
// soronként ár-mezővel, „+ Hiányzik valami?”, az „Árak a posztokban” kapcsoló és egy „Mentem”. A tématerv (Csilla 10-12) ugyanebben a
// dobozban, alatta — egy fő gomb ment mindent. A gép csak a kitöltött árat írja ki, és csak bekapcsolt kapcsolónál.

type Kezdo = { kinalat: KinalatSor[]; arak: boolean; temak: TemaTerv[] };

export function Kinalat({ cegNev, kezdo, nevekSzama, vanProfil, szerkesztheti }: { cegNev: string; kezdo: Kezdo; nevekSzama: number; vanProfil: boolean; szerkesztheti: boolean }) {
  const { t } = useFeliratok();
  const [kinalat, setKinalat] = useState<KinalatSor[]>(kezdo.kinalat);
  const [arak, setArak] = useState(kezdo.arak);
  const [temak, setTemak] = useState<TemaTerv[]>(kezdo.temak);
  const [ujSor, setUjSor] = useState(-1);
  const [ujTema, setUjTema] = useState(-1);
  const [allapot, setAllapot] = useState<"" | "fut" | "kesz" | "hiba">("");
  const tiltva = !szerkesztheti || !vanProfil;
  const valt = <T,>(f: (x: T) => void) => (x: T) => { setAllapot(""); f(x); };

  async function ment() {
    setAllapot("fut");
    const r = await hivas("/api/profil/kinalat", "PUT", { kinalat: kinalat.filter((k) => k.nev.trim()), arak_posztban: arak, tema_terv: temak.filter((x) => x.tema.trim()) });
    if (r.statusz !== 200) { setAllapot("hiba"); return; }
    setKinalat((r.torzs["kinalat"] as KinalatSor[] | undefined) ?? []);
    setTemak((r.torzs["tema_terv"] as TemaTerv[] | undefined) ?? []);
    setAllapot("kesz");
  }

  const fo = <FoGomb onClick={() => void ment()} disabled={tiltva || allapot === "fut"}>{t("nevek.mentem")}</FoGomb>;
  return (
    <main className="km-lap-keret r15-lap r18f-lap">
      <KerdesCim cim={t("nav.szervezet_adatai")} alcim={cegNev} />
      <nav className="r18f-linkek r18k7-alnav" aria-label={t("nav.szervezet_adatai")}>
        <HalkLink href="/fiok">{t("szerv.alapadatok")}</HalkLink>
        <span className="r18k7-alnav-aktiv" aria-current="page">{t("szerv.kinalat")}</span>
        <HalkLink href="/fiok/nevek">{t("nevek.link", { n: nevekSzama })}</HalkLink>
      </nav>
      {!vanProfil ? <Info>{t("nevek.nincs_profil")}</Info> : null}
      <section className="r15-teendo r18k7-szerv" data-r15="teendo">
        <h2 className="r15-teendo-cim">{t("szerv.kinalat")}</h2>
        <Info>{t("szerv.kinalat_alcim")}</Info>
        <KinalatLista sorok={kinalat} valt={valt(setKinalat)} arral ujNyitva={ujSor} />
        <div><HalkLink disabled={tiltva} onClick={() => { setKinalat((k) => [...k, { nev: "", reszlet: "", ar: "", aktiv: true }]); setUjSor(kinalat.length); }}>{t("onb.hianyzik")}</HalkLink></div>
        <div className="r18k7-kapcs-sor"><span>{t("szerv.arak_posztban")}</span><Kapcsolo be={arak} valt={valt(setArak)} letiltva={tiltva} cimke={t("szerv.arak_posztban")} /></div>
        <h2 className="r15-teendo-cim r18k7-szerv-cim">{t("onb.temak_cim")}</h2>
        <Info>{t("szerv.temak_alcim")}</Info>
        <TemaLista temak={temak} valt={valt(setTemak)} ujNyitva={ujTema} />
        <div><HalkLink disabled={tiltva} onClick={() => { setTemak((x) => [...x, { tema: "", tipus: "picmess" }]); setUjTema(temak.length); }}>{t("onb.uj_tema")}</HalkLink></div>
        <div className="r18f-gombsor r15-csak-asztal">{fo}{allapot === "kesz" ? <Info osztaly="r18f-ok">{t("nevek.mentve")}</Info> : allapot === "hiba" ? <Info>{t("nevek.hiba")}</Info> : null}</div>
      </section>
      {allapot === "kesz" ? <Info osztaly="r18f-ok r15-csak-tel">{t("nevek.mentve")}</Info> : allapot === "hiba" ? <Info osztaly="r15-csak-tel">{t("nevek.hiba")}</Info> : null}
      <div className="r15-also-sav">{fo}</div>
    </main>
  );
}
