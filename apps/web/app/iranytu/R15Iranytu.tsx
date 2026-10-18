"use client";
// R-15 · 11 Iránytű (design/R15/rajz/R15-lapok-4.dc.html 11a · 11a2 · 11b · 11c · 11c2; gepezet-4 · 4, 5; kerdesek-4 · 7, 8, 11, 13).
//   11a  nincs se tervezet, se jóváhagyott → halvány PÉLDA (szakma szerint) + „Kérek javaslatot” (POST /api/iranytu/javaslat, majd
//        PUT /api/iranytu a tervezettel — ugyanaz, amit a mai szerkesztő tesz) · 11a2 közben: pörgő, nyugtató sor, linkek nélkül.
//   11b  van tervezet → négy rövid lista + „Jóváhagyom” (POST /api/iranytu/jovahagyas; csak a tulajdonos — a kiszolgáló is kényszeríti).
//   11c  jóváhagyott → legfeljebb 3 posztötlet (iranytu/otletek.ts) → POST /api/poszt (forras.tipus "terv") → /poszt?munka=… · 11c2.
// „Átírom” / „Módosítás” / „Inkább magam töltöm ki” / „Az egész iránytű”: a MAI szerkesztő (Iranytu.tsx), változatlan gépezettel.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IranytuAllapotSema, IranytuSema, IranytuVerzioSema } from "@rogton/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { FelsoSav } from "../_kozos/FelsoSav";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { hivas } from "../_kozos/kliens";
import { Baj, DolgozoGomb, FoGomb, HalkGomb, HalkLink, Info, KerdesCim, Reszletek, Teendo } from "../_kozos/R15";
import { iranytuOtletek, otletForras, type IranytuOtlet } from "../../iranytu/otletek";
import { Iranytu } from "./Iranytu";
import "../_kozos/r15-lapok.css";
import "./r15-iranytu.css";

type Nezet = "r15" | "szerkeszto";
type SzerkesztoMod = { mod: "olvas" | "szerkeszt"; sajat: boolean };

function maiNap(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function datumRovid(iso: string, nyelv: string): string {
  if (!iso) return "";
  try { return new Intl.DateTimeFormat(nyelv, { month: "short", day: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(`${iso}T12:00:00Z`)); } catch { return iso; }
}

function datumNap(iso: string | null, nyelv: string): string {
  if (!iso) return "";
  try { return new Intl.DateTimeFormat(nyelv, { month: "short", day: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(iso)); } catch { return iso.slice(0, 10); }
}

const URES: IranytuSema = { celok: [], vizio: "", vizio_forras: "", ertekek: [], idoszakok: [], tolni: [], tiltott_szavak: [], kerulendo_temak: [] };

export function R15Iranytu({ szerkesztheto, jovahagyhat, sav, tartalomNyelv, kezdoAllapot, kezdoVerziok, peldaKulcsok }: {
  szerkesztheto: boolean; jovahagyhat: boolean; sav: FelsoSavAdat; tartalomNyelv: string;
  kezdoAllapot: IranytuAllapotSema; kezdoVerziok: IranytuVerzioSema[]; peldaKulcsok: string[];
}) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const [allapot, setAllapot] = useState<IranytuAllapotSema>(kezdoAllapot);
  const [verziok, setVerziok] = useState<IranytuVerzioSema[]>(kezdoVerziok);
  const [nezet, setNezet] = useState<Nezet>("r15");
  const [szerkMod, setSzerkMod] = useState<SzerkesztoMod>({ mod: "szerkeszt", sajat: false });
  const [fut, setFut] = useState<string | null>(null); // "javaslat" · "jovahagy" · egy ötlet id-ja
  const [hiba, setHiba] = useState("");
  const [reszletek, setReszletek] = useState(false);
  const [egesz, setEgesz] = useState(false);

  async function ujratolt() {
    const r = await hivas("/api/iranytu", "GET");
    if (r.statusz === 200) {
      const v = r.torzs as { allapot: IranytuAllapotSema; verziok?: IranytuVerzioSema[] };
      setAllapot(v.allapot);
      setVerziok(v.verziok ?? []);
    }
  }

  function szerkesztore(mod: "olvas" | "szerkeszt", sajat = false) {
    setSzerkMod({ mod, sajat });
    setNezet("szerkeszto");
  }

  if (nezet === "szerkeszto") {
    return <Iranytu szerkesztheto={szerkesztheto} jovahagyhat={jovahagyhat} sav={sav} kezdoMod={szerkMod.mod} sajatKezdesKezdo={szerkMod.sajat}
      onKesz={() => { void ujratolt().then(() => setNezet("r15")); }} />;
  }

  // ----- 11a: „Kérek javaslatot” — a mai szerkesztő javaslatKer("mind") + autosave útja, egy lépésben
  async function javaslatKer() {
    if (fut) return;
    setFut("javaslat"); setHiba("");
    const v = await hivas("/api/iranytu/javaslat", "POST", { blokk: "mind" });
    const j = (v.torzs as { javaslat?: Partial<IranytuSema> }).javaslat;
    if (v.statusz === 401) { router.push("/belepes"); return; }
    if (v.statusz !== 200 || !j) {
      const kod = typeof v.torzs["hiba"] === "string" ? v.torzs["hiba"] : "";
      const profilHiba = !!(v.torzs["mezok"] as Record<string, string> | undefined)?.["profil"];
      setHiba(profilHiba ? t("iranytu.javaslat_hiba_profil") : kod === "AI_KERET_KIMERULT" ? t("r13.kredit.elfogyott")
        : kod === "AI_KIKAPCSOLVA" ? t("iranytu.javaslat_hiba_kikapcsolva") : t("iranytu.javaslat_hiba_ai"));
      setFut(null);
      return;
    }
    const uj: IranytuSema = {
      ...URES,
      celok: j.celok ?? [], vizio: j.vizio ?? "", vizio_forras: j.vizio ? "ai" : "", ertekek: j.ertekek ?? [], idoszakok: j.idoszakok ?? [],
      tolni: j.tolni ?? [], tiltott_szavak: j.tiltott_szavak ?? [], kerulendo_temak: j.kerulendo_temak ?? [],
    };
    const m = await hivas("/api/iranytu", "PUT", uj);
    if (m.statusz === 200) setAllapot((m.torzs as { allapot: IranytuAllapotSema }).allapot);
    else setHiba(t("hiba.mentes") || t("kozos.hiba"));
    setFut(null);
  }

  // ----- 11b: „Jóváhagyom”
  async function jovahagy() {
    if (fut || !allapot.tervezet) return;
    setFut("jovahagy"); setHiba("");
    const r = await hivas("/api/iranytu/jovahagyas", "POST", allapot.tervezet);
    if (r.statusz === 200) { await ujratolt(); }
    else setHiba(t("hiba.mentes") || t("kozos.hiba"));
    setFut(null);
  }

  // ----- 11b › Részletek: „Tervezet elvetése” — ugyanaz, mint a mai szerkesztőben (a jóváhagyott, ennek híján az üres lap kerül a tervezetbe)
  async function tervezetElvetese() {
    const r = await hivas("/api/iranytu", "PUT", allapot.jovahagyott ?? URES);
    if (r.statusz === 200) await ujratolt(); else setHiba(t("hiba.mentes") || t("kozos.hiba"));
  }

  // ----- 11c: posztötlet → posztmunka (T9)
  async function posztra(o: IranytuOtlet) {
    if (fut) return;
    setFut(o.id); setHiba("");
    const r = await hivas("/api/poszt", "POST", { forras: otletForras(o), cim: o.cim, felulet: "fb", nyelv: tartalomNyelv });
    const id = (r.torzs["munka"] as { id?: string } | undefined)?.id;
    if (r.statusz === 200 && id) { router.push(`/poszt?munka=${encodeURIComponent(id)}`); return; }
    setHiba(r.torzs["hiba"] === "AI_KERET_KIMERULT" ? t("r13.kredit.elfogyott") : t("hf.poszt_hiba"));
    setFut(null);
  }

  const reszletekBlokk = (tervezet: boolean) => (
    <Reszletek>
      <div className="r15i-reszletek">
        <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.mire_hasznalja")}</span><p>{t("iranytu.mire_hasznalja_szoveg")}</p></div>
        <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.pelda_cim")}</span><p>{t("iranytu.pelda_szoveg")}</p></div>
        {tervezet && allapot.tervezet ? (
          <>
            {allapot.tervezet.vizio ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.vizio")}</span><p>{allapot.tervezet.vizio}</p></div> : null}
            {allapot.tervezet.ertekek.length ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.ertekrend")}</span>{allapot.tervezet.ertekek.map((e) => <p key={e.id}>{e.nev}{e.magyarazat ? ` — ${e.magyarazat}` : ""}</p>)}</div> : null}
            {szerkesztheto ? <div><HalkGomb onClick={() => void tervezetElvetese()}>{t("iranytu.tervezet_elvetese")}</HalkGomb></div> : null}
          </>
        ) : null}
        {verziok.length > 0 ? (
          <div className="r15i-bek">
            <span className="r15i-cimke">{t("iranytu.korabbi")}</span>
            <ul className="r15i-verziok">
              {verziok.map((v) => (
                <li key={v.verzio}>
                  <span>{datumNap(v.jovahagyva, nyelv)} · {v.jovahagyta_nev}</span>
                  {jovahagyhat ? <HalkLink onClick={() => { void hivas(`/api/iranytu/verziok/${v.verzio}`, "POST").then(() => ujratolt()); }}>{t("iranytu.visszaallitas")}</HalkLink> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Reszletek>
  );

  const bajSor = hiba ? <Baj szoveg={hiba} gomb={<HalkGomb onClick={() => setHiba("")}>{t("hf.ujra")}</HalkGomb>} /> : null;

  // ===== 11a / 11a2 =====
  if (!allapot.tervezet && !allapot.jovahagyott) {
    const dolgozik = fut === "javaslat";
    const pelda = dolgozik ? null : (
      <div className="r15i-pelda">
        <Info osztaly="r15i-pelda-jel">{t("r15.ir.pelda_jel")}</Info>
        {peldaKulcsok.map((k) => <Info key={k} osztaly="r15i-pelda-sor">{t(k)}</Info>)}
      </div>
    );
    const gomb = !szerkesztheto ? null : dolgozik ? <DolgozoGomb>{t("r15.ir.irjuk")}</DolgozoGomb> : <FoGomb onClick={() => void javaslatKer()}>{t("iranytu.javaslatot_kerek")}</FoGomb>;
    return (
      <>
        <FelsoSav adat={sav} aktiv="iranytu" />
        <main className="km-lap-keret r15-lap r15i-lap">
          <div className="r15-lap-belso r15i-belso">
            <KerdesCim cim={t(dolgozik ? "r15.ir.irjuk_kerdes" : "r15.ir.ures_kerdes")} alcim={t("r15.ir.ures_alcim")} />
            {bajSor}
            {pelda}
            {!szerkesztheto ? <Info>{t("iranytu.csak_tulajdonos")}</Info> : null}
            <div className="r15i-gombsor r15-csak-asztal">
              {gomb}
              {dolgozik ? <Info>{t("r15.ir.varj")}</Info> : szerkesztheto ? <HalkLink onClick={() => szerkesztore("szerkeszt", true)}>{t("iranytu.inkabb_magam")}</HalkLink> : null}
            </div>
            {dolgozik ? null : (
              <div className="r15-linksor">
                {szerkesztheto ? <span className="r15-csak-tel"><HalkLink onClick={() => szerkesztore("szerkeszt", true)}>{t("iranytu.inkabb_magam")}</HalkLink></span> : null}
                <HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")}</HalkLink>
              </div>
            )}
            {reszletek && !dolgozik ? reszletekBlokk(false) : null}
          </div>
          {gomb ? (
            <div className="r15-also-sav">
              {dolgozik ? <div className="r15-also-nyugtato"><Info>{t("r15.ir.varj")}</Info></div> : null}
              {gomb}
            </div>
          ) : null}
        </main>
      </>
    );
  }

  // ===== 11b =====
  if (allapot.tervezet) {
    const tv = allapot.tervezet;
    const ma = maiNap();
    const futoKampany = tv.idoszakok.filter((i) => i.nev.trim() && (!i.meddig || i.meddig >= ma));
    const dolgozik = fut === "jovahagy";
    const fo = jovahagyhat
      ? (dolgozik ? <DolgozoGomb>{t("r15.ir.jovahagyom")}</DolgozoGomb> : <FoGomb onClick={() => void jovahagy()}>{t("r15.ir.jovahagyom")}</FoGomb>)
      : szerkesztheto ? <FoGomb onClick={() => szerkesztore("szerkeszt")}>{t("r15.mit.atirom")}</FoGomb> : null;
    return (
      <>
        <FelsoSav adat={sav} aktiv="iranytu" />
        <main className="km-lap-keret r15-lap r15i-lap">
          <div className="r15-lap-belso r15i-belso">
            <KerdesCim cim={t("r15.ir.tervezet_kerdes")} alcim={t("r15.ir.tervezet_alcim")} />
            {bajSor}
            <Teendo osztaly="r15i-kartya">
              <div className="r15i-lista">
                <div className="r15i-fej"><span className="r15i-cimke">{t("iranytu.celok")}</span>{szerkesztheto && jovahagyhat ? <HalkLink onClick={() => szerkesztore("szerkeszt")}>{t("r15.mit.atirom")}</HalkLink> : null}</div>
                {tv.celok.map((c) => <div key={c.id} className="r15i-ertek" data-r15="eredmeny" data-r15-forras="gep">{c.nev}</div>)}
              </div>
              {tv.tolni.length ? (
                <div className="r15i-lista"><span className="r15i-cimke">{t("iranytu.tolni")}</span>
                  <div className="r15i-ertek" data-r15="eredmeny" data-r15-forras="gep">{tv.tolni.map((x) => x.nev).join(" · ")}</div></div>
              ) : null}
              {futoKampany.length ? (
                <div className="r15i-lista"><span className="r15i-cimke">{t("iranytu.idoszakok")}</span>
                  {futoKampany.map((i) => <div key={i.id} className="r15i-ertek" data-r15="eredmeny" data-r15-forras="gep">{i.nev}{i.mettol || i.meddig ? ` (${datumRovid(i.mettol, nyelv)} – ${datumRovid(i.meddig, nyelv)})` : ""}</div>)}</div>
              ) : null}
              {tv.tiltott_szavak.length || tv.kerulendo_temak.length ? (
                <div className="r15i-lista"><span className="r15i-cimke">{t("iranytu.kerulni")}</span>
                  {tv.tiltott_szavak.length ? <div className="r15i-ertek" data-r15="eredmeny">{tv.tiltott_szavak.map((x) => `„${x}”`).join(" · ")}</div> : null}
                  {tv.kerulendo_temak.length ? <div className="r15i-ertek" data-r15="eredmeny">{tv.kerulendo_temak.join(" · ")}</div> : null}</div>
              ) : null}
            </Teendo>
            {!jovahagyhat ? <Info>{t("iranytu.csak_tulajdonos")}</Info> : null}
            <div className="r15i-gombsor r15-csak-asztal">
              {fo}
              <HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")}</HalkLink>
            </div>
            <div className="r15-csak-tel"><div className="r15-linksor"><HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")}</HalkLink></div></div>
            {reszletek ? reszletekBlokk(true) : null}
          </div>
          {fo ? <div className="r15-also-sav">{fo}</div> : null}
        </main>
      </>
    );
  }

  // ===== 11c / 11c2 =====
  const ir = allapot.jovahagyott!;
  const otletek = iranytuOtletek(ir, maiNap());
  const elso = otletek[0];
  const dolgozoOtlet = fut && otletek.some((o) => o.id === fut) ? fut : null;
  const fajtaSor = (o: IranytuOtlet) => o.fajta === "kampany"
    ? <Info><span>{t("r15.ir.kampany")}</span>{o.mettol || o.meddig ? ` · ${datumRovid(o.mettol, nyelv)} – ${datumRovid(o.meddig, nyelv)}` : ""}</Info>
    : <Info>{t(o.fajta === "tolni" ? "iranytu.tolni" : "iranytu.celok")}</Info>;
  const jovSor = allapot.jovahagyva ? <Info>{t("r15.ir.jovahagyva", { mikor: datumNap(allapot.jovahagyva, nyelv), ki: allapot.jovahagyta_nev })}</Info> : null;
  const otletKartya = (o: IranytuOtlet, i: number) => (
    <Teendo key={o.id} osztaly="r15i-otlet">
      {fajtaSor(o)}
      <div className="r15i-otlet-cim" data-r15="eredmeny" data-r15-forras="gep">{o.cim}</div>
      {o.alatta ? <div className="r15i-otlet-alatta r15-csak-asztal" data-r15="eredmeny">{o.alatta}</div> : null}
      {szerkesztheto ? (
        <div className={i === 0 ? "r15i-otlet-gomb r15-csak-asztal" : "r15i-otlet-gomb"}>
          {i === 0
            ? (dolgozoOtlet === o.id ? <DolgozoGomb posztra>{t("r15.poszt.irjuk")}</DolgozoGomb> : <FoGomb posztra onClick={() => void posztra(o)} disabled={!!fut}>{t("hf.poszt_keszits")}</FoGomb>)
            : (dolgozoOtlet === o.id ? <HalkGomb posztra disabled aria-busy="true">{t("r15.poszt.irjuk")}</HalkGomb> : <HalkGomb posztra onClick={() => void posztra(o)} disabled={!!fut}>{t("hf.poszt_keszits")}</HalkGomb>)}
          {i === 0 && dolgozoOtlet ? <Info>{t("r15.kozos.par_masodperc")}</Info> : null}
        </div>
      ) : null}
    </Teendo>
  );
  const linkek = (
    <div className="r15-linksor">
      <HalkLink onClick={() => setEgesz((x) => !x)} aria-expanded={egesz}>{t("r15.ir.egesz")}</HalkLink>
      {szerkesztheto ? <HalkLink onClick={() => szerkesztore("szerkeszt")}>{t("iranytu.modositas")}</HalkLink> : null}
      <HalkLink onClick={() => setReszletek((x) => !x)} aria-expanded={reszletek}>{t("r15.kozos.reszletek")}</HalkLink>
    </div>
  );
  // nincs ötlet → az olvasó nézet, fő gomb „Módosítás” (gepezet-4 · 4)
  const telFo = !szerkesztheto ? null : !elso ? <FoGomb onClick={() => szerkesztore("szerkeszt")}>{t("iranytu.modositas")}</FoGomb>
    : dolgozoOtlet ? <DolgozoGomb posztra>{t("r15.poszt.irjuk")}</DolgozoGomb>
    : <FoGomb posztra onClick={() => void posztra(elso)}>{t("r15.ir.az_elsorol")}</FoGomb>;
  return (
    <>
      <FelsoSav adat={sav} aktiv="iranytu" />
      <main className="km-lap-keret r15-lap r15i-lap">
        <div className="r15-lap-belso r15i-belso r15i-szeles">
          <KerdesCim cim={t("r15.ir.kerdes")} alcim={t("r15.ir.alcim")} />
          {bajSor}
          {/* asztal: három kártya egy sorban, alatta a „Jóváhagyva” sor és a linkek (rajz 11c) */}
          {otletek.length ? <div className="r15i-racs r15-csak-asztal">{otletek.map((o, i) => otletKartya(o, i))}</div> : null}
          <div className="r15i-lab r15-csak-asztal">{jovSor}{linkek}</div>
          {/* telefon (rajz 11c telefon): az első képernyőn a két első ötlet és a linksor; a 3. ötlet és a „Jóváhagyva” sor a hajtás alatt */}
          <div className="r15-csak-tel">
            <div className="r15i-tel-elso">
              {otletek.slice(0, 2).map((o, i) => otletKartya(o, i))}
              {linkek}
            </div>
            <div className="r15i-tel-tobbi">
              {otletek.slice(2).map((o, i) => otletKartya(o, i + 2))}
              {jovSor}
            </div>
          </div>
          {egesz ? (
            <Reszletek>
              <div className="r15i-reszletek">
                {ir.celok.length ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.celok")}</span>{ir.celok.map((c) => <p key={c.id}>{c.nev}{c.miert ? ` — ${c.miert}` : ""}{c.mikorra ? ` (${c.mikorra})` : ""}</p>)}</div> : null}
                {ir.vizio ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.vizio")}</span><p>{ir.vizio}</p></div> : null}
                {ir.ertekek.length ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.ertekrend")}</span>{ir.ertekek.map((e) => <p key={e.id}>{e.nev}{e.magyarazat ? ` — ${e.magyarazat}` : ""}</p>)}</div> : null}
                {ir.idoszakok.length ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.idoszakok")}</span>{ir.idoszakok.map((i) => <p key={i.id}>{i.nev} ({datumRovid(i.mettol, nyelv)} – {datumRovid(i.meddig, nyelv)}){i.mit ? ` — ${i.mit}` : ""}</p>)}</div> : null}
                {ir.tolni.length ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.tolni")}</span><p>{ir.tolni.map((x) => x.nev).join(" · ")}</p></div> : null}
                {ir.tiltott_szavak.length || ir.kerulendo_temak.length ? <div className="r15i-bek"><span className="r15i-cimke">{t("iranytu.kerulni")}</span><p>{[...ir.tiltott_szavak.map((x) => `„${x}”`), ...ir.kerulendo_temak].join(" · ")}</p></div> : null}
              </div>
            </Reszletek>
          ) : null}
          {reszletek ? reszletekBlokk(false) : null}
        </div>
        {telFo ? (
          <div className="r15-also-sav">
            {dolgozoOtlet ? <div className="r15-also-nyugtato"><Info>{t("r15.kozos.par_masodperc")}</Info></div> : null}
            {telFo}
          </div>
        ) : null}
      </main>
    </>
  );
}
