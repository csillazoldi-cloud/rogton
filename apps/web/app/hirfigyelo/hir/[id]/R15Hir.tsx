"use client";
// R-15 · 05 Hír részletei — „Ebből jó poszt lehet” (design/R15/rajz/R15-lapok-4.dc.html 05 · 05w; gepezet-4 · 3, 5).
// T9: egy kattintás a kész posztszövegig — ugyanaz a hívás, mint a 04 Hírek kártyáin (POST /api/r15/hirek/{id}/poszt → /poszt?munka=…).
// A „···” menü a 04 menüje (Elmentem · Nem érdekel · Eredeti cikk); minden más a Részletekben (Miért kaptad, A vevőidnek, források,
// tartalomötlet). Ami NINCS a lapon (kerdesek-4): kategória-jelvény, „v{n} beállítással”, „AI-összefoglaló” jelvény, „AI-keret” mondat.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../../../nyelv/kliens";
import { hivas } from "../../../_kozos/kliens";
import { DolgozoGomb, FoGomb, HalkGomb, HalkLink, Info, KerdesCim, Reszletek, Teendo } from "../../../_kozos/R15";
import { ElfogyottSor } from "../../../_kozos/R13Kredit";
import { forrasNev, idoRovid, nyelvNev } from "../../_kozos/kliens";
import { Lenyilo } from "../../R15Hirek";
import type { R15HirReszlet } from "../../../../r15/tipusok";
import "../../../_kozos/r15-lapok.css";
import "./hir.css";

type Jeloles = "nincs" | "mentett" | "elrejtett";

export function R15Hir({ reszlet, szerep, elfogyottKezdo, tulajdonos }: { reszlet: R15HirReszlet; szerep: string; elfogyottKezdo: boolean; tulajdonos: boolean }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const k = reszlet.kartya;
  const [jeloles, setJeloles] = useState<Jeloles>(k.jeloles);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(false);
  const [reszletekNyitva, setReszletekNyitva] = useState(false);
  const [otlet, setOtlet] = useState(k.tartalomotlet?.szoveg ?? "");
  const [otletFut, setOtletFut] = useState(false);
  const [otletHiba, setOtletHiba] = useState(false);

  const elso = k.forrasok[0] ?? null;
  const forditva = k.cim_forditott && k.cim_forditott !== k.cim && elso?.nyelv && elso.nyelv !== reszlet.tartalom_nyelv
    ? ` · ${t("hf.forditva_nyelvbol", { nyelv: nyelvNev(elso.nyelv, nyelv) })}` : "";
  const fejInfo = elso ? `${forrasNev(elso.forras_cim)}${elso.megjelenes ? ` · ${idoRovid(elso.megjelenes, nyelv)}` : ""}${forditva}` : "";
  const cim = k.cim_forditott || k.cim;
  const fuggoben = k.ertekeles_allapot !== "kesz";
  const miertJo = k.cegednek || k.miert;
  const nezo = szerep === "nezo";
  const kategoria = k.fontossag === "fontos" ? t("hf.kat_fontos") : k.fontossag === "erdekes" ? t("hf.kat_erdekes") : k.fontossag === "hatter" ? t("hf.kat_hatter") : "";

  async function posztra() {
    if (fut) return;
    if (reszlet.munka_id) { setFut(true); router.push(`/poszt?munka=${encodeURIComponent(reszlet.munka_id)}`); return; }
    setFut(true); setHiba(false);
    const v = await hivas(`/api/r15/hirek/${encodeURIComponent(k.fo_talalat_id)}/poszt`, "POST", {});
    const id = typeof v.torzs["munka_id"] === "string" ? v.torzs["munka_id"] : null;
    if (id) { router.push(`/poszt?munka=${encodeURIComponent(id)}`); return; }
    setFut(false); setHiba(true);
  }

  async function jelol(uj: Jeloles) {
    const regi = jeloles;
    setJeloles(uj);
    const v = await hivas(`/api/hirfigyelo/talalatok/${encodeURIComponent(k.fo_talalat_id)}/jelol`, "POST", { jeloles: uj });
    if (v.statusz !== 200) setJeloles(regi);
  }

  async function otletKer() {
    setOtletFut(true); setOtletHiba(false);
    const v = await hivas(`/api/hirfigyelo/talalatok/${encodeURIComponent(k.fo_talalat_id)}/tartalomotlet`, "POST", {});
    const szoveg = (v.torzs["talalat"] as { tartalomotlet?: { szoveg?: string } | null } | undefined)?.tartalomotlet?.szoveg ?? "";
    setOtletFut(false);
    if (szoveg) setOtlet(szoveg); else setOtletHiba(true);
  }

  const gombFelirat = reszlet.munka_id ? t("r15.hirek.atnezem_posztot") : t("hf.poszt_keszits");
  const gomb = fut
    ? <DolgozoGomb posztra>{t("r15.poszt.irjuk")}</DolgozoGomb>
    : <FoGomb posztra onClick={() => void posztra()} disabled={elfogyottKezdo && !reszlet.munka_id}>{gombFelirat}</FoGomb>;
  const gombMellett = fut ? t("r15.kozos.par_masodperc") : t("r15.kozos.nyugtato");
  const elfogyottSor = elfogyottKezdo && !reszlet.munka_id
    ? <ElfogyottSor>{tulajdonos ? <HalkLink href="/tagok/kreditek">{t("r13.kredit.tobbet_szeretnel")}</HalkLink> : t("r13.kredit.elfogyott")}</ElfogyottSor>
    : null;

  const menu = (
    <Lenyilo
      gomb={(nyit, nyitva) => (
        <button type="button" className="r15-pontok" aria-haspopup="menu" aria-expanded={nyitva}
          aria-label={`${t("r15.hirek.elmentem")}, ${t("r15.hirek.nem_erdekel")}, ${t("hf.eredeti_cikk")}`} onClick={nyit}>···</button>
      )}
    >
      {(zar) => (
        <>
          {jeloles === "mentett" ? (
            <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { zar(); void jelol("nincs"); }}>✓ {t("hf.saved")}</button>
          ) : (
            <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { zar(); void jelol("mentett"); }}>{t("r15.hirek.elmentem")}</button>
          )}
          {jeloles === "elrejtett" ? (
            <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { zar(); void jelol("nincs"); }}>{t("hf.restore")}</button>
          ) : (
            <button type="button" className="r15-menu-sor" role="menuitem" onClick={() => { zar(); void jelol("elrejtett"); }}>{t("r15.hirek.nem_erdekel")}</button>
          )}
          {elso ? <a className="r15-menu-sor" role="menuitem" href={elso.url} target="_blank" rel="noopener noreferrer">{t("hf.eredeti_cikk")} ↗</a> : null}
        </>
      )}
    </Lenyilo>
  );

  return (
    <main className="km-lap-keret r15-lap r15-hir-lap">
      <div className="r15-lap-belso r15-hir-belso">
        <div><a className="r15-halk-link" href="/hirfigyelo"><span aria-hidden="true">← </span>{t("r15.nav.hirek")}</a></div>
        <KerdesCim cim={t("r15.hir.kerdes")} alcim={t("r15.hir.alcim")} />
        <Teendo osztaly="r15-hir-kartya">
          <div className="r15-hir-fejsor">
            <Info>{fejInfo}</Info>
            {menu}
          </div>
          <div className="r15-hir-hir">
            <div className="r15-hir-cim" data-r15="eredmeny" data-r15-forras="gep">{cim}</div>
            {k.osszefoglalo ? <div className="r15-hir-osszefoglalo r15-csak-asztal" data-r15="eredmeny">{k.osszefoglalo}</div> : null}
          </div>
          <div className="r15-hir-miert">
            <span className="r15-hir-cimke">{t("r15.hir.miert_jo")}</span>
            {fuggoben || !miertJo ? <Info>{t("r15.hir.olvassuk")}</Info> : <div className="r15-hir-ertek" data-r15="eredmeny" data-r15-forras="gep">{miertJo}</div>}
          </div>
          {nezo ? <Info>{t("r15.hir.nezo")}</Info> : (
            <div className="r15-hir-gombsor r15-csak-asztal">
              {gomb}
              <Info>{gombMellett}</Info>
            </div>
          )}
          {hiba ? <Info osztaly="r15-csak-asztal">{t("hf.poszt_hiba")}</Info> : null}
          {elfogyottSor ? <div className="r15-csak-asztal">{elfogyottSor}</div> : null}
        </Teendo>
        <div><HalkLink onClick={() => setReszletekNyitva((x) => !x)} aria-expanded={reszletekNyitva}>{t("r15.kozos.reszletek")}</HalkLink></div>
        {reszletekNyitva ? (
          <Reszletek>
            <div className="r15-hir-reszletek">
              {k.osszefoglalo ? <p className="r15-csak-tel r15-hir-bek">{k.osszefoglalo}</p> : null}
              {k.vevoidnek ? <div className="r15-hir-bek"><span className="r15-hir-cimke">{t("hf.fu_vevoidnek")}</span><p>{k.vevoidnek}</p></div> : null}
              <div className="r15-hir-bek">
                <span className="r15-hir-cimke">{t("hf.fu_miert_kaptad")}</span>
                {k.indoklas || k.miert ? <p>{k.indoklas || k.miert}</p> : null}
                {kategoria ? <p className="r15-hir-halk">{kategoria}</p> : null}
                {k.csonkolt_alapjan ? <p className="r15-hir-halk">{t("hf.csonkolt")}</p> : null}
                <ul className="r15-hir-forrasok">
                  {k.forrasok.map((f) => (
                    <li key={f.talalat_id}>
                      <span>{forrasNev(f.forras_cim)}</span>
                      <span className="r15-hir-halk">{idoRovid(f.megjelenes, nyelv)}{f.nyelv ? ` · ${t("hf.forras_nyelve", { nyelv: nyelvNev(f.nyelv, nyelv) })}` : ""}</span>
                      <a className="r15-halk-link" href={f.url} target="_blank" rel="noopener noreferrer">{t("hf.gomb_eredeti_cikk")}</a>
                    </li>
                  ))}
                </ul>
              </div>
              {!nezo ? (
                <div className="r15-hir-bek">
                  {otlet ? (
                    <>
                      <p>{otlet}</p>
                      <p className="r15-hir-halk">{t("hf.otlet_figyelmeztetes")}</p>
                    </>
                  ) : (
                    <HalkGomb onClick={() => void otletKer()} disabled={otletFut}>{otletFut ? t("hf.detIdeaWorking") : t("hf.detIdeaBtn")}</HalkGomb>
                  )}
                  {otletHiba ? <p className="r15-hir-halk">{t("hf.poszt_hiba")}</p> : null}
                </div>
              ) : null}
            </div>
          </Reszletek>
        ) : null}
      </div>
      {!nezo ? (
        <div className="r15-also-sav">
          {/* a nyugtató / dolgozó sor a Visszajelzés sávjának bal felében, a fő gomb fölött (gepezet-2 8 mintája) */}
          <div className="r15-also-nyugtato">{elfogyottSor ?? <Info>{hiba ? t("hf.poszt_hiba") : gombMellett}</Info>}</div>
          {gomb}
        </div>
      ) : null}
    </main>
  );
}
