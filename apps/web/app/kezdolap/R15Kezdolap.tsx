"use client";
// R-15 · 03 Kezdőlap — „Mi a dolgom ma?” (design/R15/rajz/R15-lapok-2.dc.html, 03a · 03b · 03c; gepezet-2 2–4, 6, 8).
// Első vázlat: DeepSeek (A1), a rajzhoz igazítva: Claude. Az állapotot a kiszolgáló dönti el (r15/szamol.ts `kezdolapAllapot`):
//   dolgos (03b, N ≥ 1): kérdés · haladás · balra a nagy kártya (a legújabb váró poszt), jobbra a „Még vár” lista · alul a halk sor.
//   elso (03a): ugyanez a bemutatkozó poszttal — más cím, alcím és tájékoztató sor (a generátor még nincs kint, gepezet-2 1).
//   kesz (03c): „Mára kész vagy” · a kész-pillanat (a lap legnagyobb eleme) · egy KÉRHETŐ ajánlat: kép a munkáról, egy fő gombbal.
//   munkad (03c, a héten semmi nem lett kész): ugyanez kész-pillanat nélkül, „Mutasd meg a legutóbbi munkádat” címmel.
// A régi „Ma nincs dolgod” állapot fő gomb nélkül nyugdíjban (a kulcs marad az adatbázisban, kerdesek-2 1).
// Telefon: ugyanez egymás alatt; c5 3. kör óta a csempék alatt MINDEN „Még vár” sor a „Még N javaslat” mögött van; a fő gomb a lap alján, fölötte a
// Visszajelzés sávjának bal felében a nyugtató sor (gepezet-2 8).
// Utókérés 2 (design/R15/rajz/R15-lapok-2.dc.html 03c2; gepezet-3 1): a `munkad` állapotban az alcím az eredmény-mondat
// (r15.kozos.foto_munka), a kép mellett „Így néz ki — a te fotóddal és a cégneveddel.” (r15.kozos.minta_sor; a „Ha van kedved…”
// a 03c kész-állapotáé marad), a mintakép felirat nélkül (MunkaMinta `fotoResz`), és a „Friss hírek minden reggel” sor mellett „Mi ez?”.
// R-13 (design/R13/rajz/R13-lapok.dc.html 13d1 · 13d2; gepezet.md 13d):
//   13d1 — a 03c-n a halk kredit-sor („Kreditjeid: 312 / 500 ebben a hónapban”) a „Legutóbb…” mellett; telefonon a rövid változat a lista alatt.
//     Se keret, se jelvény, se gomb (T6). Csak a „Mára kész vagy” állapotban (Csilla 10-06): a 03a/03b/03c2-n nincs.
//   13d2 — elfogyott a kredit: a cím alatt nyugodt teendő-sor (egy mondat + „Mire ment el?” → Saját fiók, másodlagos gomb, nincs piros keret);
//     a kártya nyugtató sora helyett „Ehhez nem kell kredit.” (a kész poszt megnézése nem AI-munka); a kredit-sor ilyenkor nincs.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import type { R15Kezdolap as Adat, R15Teendo } from "../../r15/tipusok";
import { FoGomb, Halad, HalkGomb, HalkLink, Info, KerdesCim, Teendo } from "../_kozos/R15";
import { IdoSzo } from "../_kozos/R15Ido";
import { R15Csempek } from "../_kozos/R15Csempek";
import { KESZ_MUNKA_CIM, MunkaMinta } from "../_kozos/R15MunkaMinta";
import { NapiHirekSor } from "../_kozos/R15NapiHirek";
import { useKreditSzam } from "../_kozos/R13Kredit";
import type { SajatKredit } from "../../kredit/tipusok";
import { otletSzovegek, useOtletMegir } from "../_kozos/C30Horgony";
import type { R15HorgonyOtlet } from "../../r15/tipusok";
import "../_kozos/r15-lapok.css";
import "../_kozos/r13.css";

export function R15Kezdolap({ adat, kredit }: { adat: Adat; kredit?: SajatKredit | null }) {
  const { t, nyelv: ui } = useFeliratok();
  const { megir, fut: megirFut, hiba: megirHiba } = useOtletMegir();
  const szam = useKreditSzam();
  const elfogyott = kredit?.elfogyott === true;
  // 13d2: a kártya és a telefonos alsó sáv mondata — elfogyott kreditnél „Ehhez nem kell kredit.”, különben a nyugtató sor
  const nyugtato = elfogyott ? t("r13.kozos.nem_kell_kredit") : t("r15.kozos.nyugtato");
  // Csilla 10-06 (2): a kredit-sor CSAK a „Mára kész vagy” (03c, `kesz`) állapotban, ahogy a 13d1 rajzolta — a `munkad` (03c2) változatban sem
  const kreditSor = kredit && !elfogyott && adat.allapot === "kesz" ? { maradt: szam(kredit.maradt), havi: szam(kredit.havi) } : null;
  const router = useRouter();
  const [nyitva, setNyitva] = useState(false);
  const [bekapcsFut, setBekapcsFut] = useState(false);

  const elso = adat.varo[0];
  const hirbol = adat.varo.filter((v) => v.forras_tipus === "hir").length;
  // c30 F8 (rajz D7a): a fesztivál esedékes ötletei. A nagy kártya a MA esedékes ötlet (különben, ha nincs váró poszt, az első ötlet);
  // ilyenkor a legújabb váró poszt a „Még vár” listába kerül, az ötletek sorai elöl. Cégnél nincs ötlet: minden marad, ahogy volt.
  const otletek = adat.otletek ?? [];
  const kartyaOtlet: R15HorgonyOtlet | undefined = otletek.find((o) => o.ma) ?? (elso ? undefined : otletek[0]);
  const tobbiOtlet = otletek.filter((o) => o !== kartyaOtlet);
  const lista: R15Teendo[] = [...(kartyaOtlet && elso ? [{ kod: "poszt" as const, poszt: elso }] : []), ...adat.meg_var.filter((x) => x.kod !== "napi_figyeles" || adat.szerkeszthet)];
  const ures = adat.allapot === "kesz" || adat.allapot === "munkad";
  const munkad = adat.allapot === "munkad";
  // c5 3. kör (kerdesek-6 · 2 ★, Csilla 10-10 21:02): telefonon a csempék miatt MINDEN „Még vár” sor a „Még n javaslat” link mögé kerül
  // (helyben nyílik, mint eddig). Asztalon változatlan.
  const telLathato = 0;

  async function bekapcsol() {
    setBekapcsFut(true);
    const v = await hivas("/api/r15/napi-figyeles", "PUT", {});
    setBekapcsFut(false);
    if (v.statusz === 200) router.refresh();
  }

  function otletSor(o: R15HorgonyOtlet) {
    const sz = otletSzovegek(o, t, ui);
    return (
      <div key={`o-${o.kulcs}`} className="r15-sor">
        <span>{sz.info} — {sz.cim}</span>
        <HalkGomb onClick={() => void megir(o)} disabled={megirFut !== null || !adat.szerkeszthet}>{t("r18.sajat.megirjuk")}</HalkGomb>
      </div>
    );
  }

  function sor(x: R15Teendo) {
    if (x.kod === "poszt") {
      return (
        <div key={`p-${x.poszt.id}`} className="r15-sor">
          <span>{t("r15.kezdolap.poszt_sor", { nev: x.poszt.rovid_nev })}</span>
          <HalkGomb href={`/poszt?munka=${encodeURIComponent(x.poszt.id)}`} posztra>{t("r15.kezdolap.atnezem")}</HalkGomb>
        </div>
      );
    }
    if (x.kod === "napi_figyeles" && munkad) {
      // gepezet-3 1 — a 03c2-n a sor mellett „Mi ez?” (helyben nyíló mondat); a 03a sora a rajz szerint változatlan
      return <NapiHirekSor key="napi" onBekapcsol={() => void bekapcsol()} folyik={bekapcsFut} />;
    }
    if (x.kod === "napi_figyeles") {
      // kerdesek-2 4: „Napi hírfigyelés” → „Friss hírek minden reggel” — ugyanaz a gomb, ugyanaz a művelet
      return (
        <div key="napi" className="r15-sor">
          <span>{t("r15.kozos.napi_hirek_sor")}</span>
          <HalkGomb onClick={() => void bekapcsol()} disabled={bekapcsFut}>{t("r15.kezdolap.bekapcsolom")}</HalkGomb>
        </div>
      );
    }
    return (
      <div key="celok" className="r15-sor">
        <span>{t("r15.kezdolap.celok")}</span>
        <HalkGomb href="/iranytu">{t("r15.kezdolap.megirom")}</HalkGomb>
      </div>
    );
  }

  const halad = { poszt: adat.halad.poszt_kesz, kep: adat.halad.kep_letoltve };
  // gepezet-2 3: ugyanaz a számláló — nullánál, ha poszt vár, biztató szöveg
  const haladElso = adat.halad.poszt_kesz === 0 && adat.varo.length > 0;

  // A cím és az alcím állapotonként (gepezet-2 2, 6). Az alcím telefonon a 03a/03b-n nincs (a rajz szerint), a 03c-n van.
  const cim =
    adat.allapot === "elso" ? t("r15.kezdolap.elso_kerdes")
    : adat.allapot === "kesz" ? t("r15.kezdolap.kesz_kerdes")
    : adat.allapot === "munkad" ? t("r15.kozos.munkad_cim")
    : t("r15.kezdolap.kerdes", { n: adat.varo.length + otletek.length });
  const alcim =
    adat.allapot === "elso" ? t("r15.kezdolap.elso_alcim")
    : munkad ? t("r15.kozos.foto_munka") // gepezet-3 1: az eredmény-mondat — mi lesz a fotóból, és hogy ő dönti el, kiteszi-e
    : ures ? (adat.napi_figyeles === "be" ? t("r15.kezdolap.kesz_alcim") : undefined)
    : hirbol > 0 ? t("r15.kezdolap.alcim", { n: hirbol })
    : undefined;

  const sorok = [...tobbiOtlet.map(otletSor), ...lista.map(sor)];
  const listaBlokk = sorok.length > 0 ? (
    <>
      <Teendo osztaly="r15-sorlista r15-csak-asztal">{sorok}</Teendo>
      <div className="r15k-tel-lista r15-csak-tel">
        {sorok.slice(0, telLathato)}
        {sorok.length > telLathato && !nyitva ? (
          <span className="r15-sor-tobb">
            <HalkLink onClick={() => setNyitva(true)} aria-expanded={false}>
              {t("r15.kezdolap.meg_apro", { n: sorok.length - telLathato })}
            </HalkLink>
          </span>
        ) : null}
        {nyitva ? sorok.slice(telLathato) : null}
      </div>
    </>
  ) : null;
  const kartyaSz = kartyaOtlet ? otletSzovegek(kartyaOtlet, t, ui) : null;

  return (
    <main className="km-lap-keret r15-lap r15k-lap r15-lapok2">
      <div className="r15-lap-belso">
        {/* c5 3. kör (R15-lapok-6 03bT): a csempék elöl; a Hírek csempén a régi „Legutóbb …” sor ideje (asztalon) */}
        <R15Csempek hirekIdo={adat.utolso_kereses_nap !== null ? IdoSzo(t, adat.utolso_kereses_nap) : null} />
        <div className="r15-fej">
          <KerdesCim cim={cim} {...(alcim ? { alcim } : {})} {...(ures ? {} : { alcimOsztaly: "r15-csak-asztal" })} />
          {adat.allapot === "kesz" ? (
            // gepezet-2 2 — a kész-pillanat: a lap legnagyobb eleme; benne a heti eredmény
            <div className="r15k-kesz" data-r15="kesz" role="status">
              <span className="r15k-kesz-jel" aria-hidden="true">✓</span>
              <span className="r15k-kesz-szoveg">
                <strong className="r15k-kesz-cim">{t("r15.kozos.szep_munka")}</strong>
                <span data-r15="halad">
                  <span className="r15-csak-asztal">{t("r15.kozos.halad", halad)}</span>
                  <span className="r15-csak-tel">{t("r15.kozos.halad_rovid", halad)}</span>
                </span>
              </span>
            </div>
          ) : !ures ? (
            <Halad arany={adat.halad.arany}>
              {haladElso ? (
                t("r15.kozos.halad_elso")
              ) : (
                <>
                  <span className="r15-csak-asztal">{t("r15.kozos.halad", halad)}</span>
                  <span className="r15-csak-tel">{t("r15.kozos.halad_rovid", halad)}</span>
                </>
              )}
            </Halad>
          ) : null}
        </div>

        {/* R-18 8. kör (Kati 10-13: „a Saját ötlet túl el van dugva”): egy koppintás a saját ötlet mezőig — halk link (T2), a Posztszöveg nyitja */}
        {elfogyott ? null : <div className="r18k8-sajat"><HalkLink href="/poszt?sajat=1">{t("r15.poszt.sajat_otlet")}</HalkLink></div>}

        {elfogyott ? (
          // 13d2 — nyugodt teendő-sor: egy mondat + másodlagos gomb a Saját fiókra (2. kör: nincs piros keret)
          <section className="r15-teendo r13d-elfogyott" data-r15="teendo">
            <p className="r13d-elfogyott-mondat"><span className="r13-pont" aria-hidden="true" />{t("r13.kezdolap.elfogyott_sor")}</p>
            <HalkGomb href="/sajat-fiok">{t("r13.kezdolap.mire_ment")}</HalkGomb>
          </section>
        ) : null}

        {ures ? (
          <div className="r15k-racs">
            {/* gepezet-2 4 — az ajánlat: kifejezetten választható („Ha van kedved…”), egy fő gombbal */}
            <Teendo osztaly="r15k-ajanlat r15-csak-asztal">
              <MunkaMinta osztaly="r15k-ajanlat-kep" fotoResz={munkad} />
              <div className="r15k-ajanlat-szoveg">
                <p className="r15k-ajanlat-mondat">{munkad ? t("r15.kozos.minta_sor") : t("r15.kezdolap.kesz_ajanlat")}</p>
                <FoGomb href={KESZ_MUNKA_CIM} osztaly="r15k-fo">{t("r15.kozos.kepet_keszitek_munka") /* Kati 10-10 #10: „Új képet készítek” kamerának hangzott — a 09 címkéje, ugyanaz a cél */}</FoGomb>
              </div>
            </Teendo>
            <div className="r15k-ajanlat-tel r15-csak-tel">
              <MunkaMinta osztaly={munkad ? "r15k-ajanlat-tel-kep r15k-munkad-kep" : "r15k-ajanlat-tel-kep"} fotoResz={munkad} />
              <p className="r15k-ajanlat-mondat">{munkad ? t("r15.kozos.minta_sor") : t("r15.kezdolap.kesz_ajanlat")}</p>
            </div>
            {listaBlokk}
            {kreditSor ? <Info osztaly="r15-csak-tel">{t("r13.kezdolap.kredit_sor_rovid", kreditSor)}</Info> : null}
          </div>
        ) : kartyaOtlet || elso || sorok.length > 0 ? (
          <div className="r15k-racs">
            {kartyaOtlet && kartyaSz ? (
              // c30 F8 (rajz D7a): az ötlet kártyája — halk sor (mi és mikor) + a nagy cím; a fő gomb „Megírjuk” (alul / asztalon itt)
              <Teendo osztaly="r15-kartya">
                <Info>{kartyaSz.info}</Info>
                <div className="r15k-kartya-szoveg"><p className="r15-kartya-nagy">{kartyaSz.cim}</p></div>
                <div className="r15-kartya-gombblokk r15-csak-asztal">
                  <div className="r15-kartya-gombsor">
                    <FoGomb onClick={() => void megir(kartyaOtlet)} disabled={megirFut !== null || !adat.szerkeszthet} osztaly="r15k-fo">{t("r18.sajat.megirjuk")}</FoGomb>
                  </div>
                  <Info>{nyugtato}</Info>
                </div>
              </Teendo>
            ) : null}
            {elso && !kartyaOtlet ? (
              <Teendo osztaly="r15-kartya">
                {/* R-18 3. kör: a „… hírből” sor csak hírből írt posztnál igaz — saját ötletnél / iránytű-ötletnél nem áll (a Saját ötlet óta gyakori) */}
                {adat.allapot === "elso" ? <Info>{t("r15.kezdolap.bemutatkozo")}</Info> : elso.forras_tipus === "hir" ? <Info>{t("r15.kezdolap.honnan", { nev: elso.rovid_nev })}</Info> : null}
                <div className="r15k-kartya-szoveg">
                  {/* VJ-1011 (T5): telefonon a rövid sor (≤ 8 szó), a teljes szöveg a „Megnézem a posztot” mögött, egy koppintásra */}
                  <p className="r15-kartya-nagy">
                    <span className="r15-csak-asztal">{elso.elso_sor || elso.forras_cim}</span>
                    <span className="r15-csak-tel">{elso.elso_sor_rovid || elso.elso_sor || elso.forras_cim}</span>
                  </p>
                  {elso.masodik_sor ? (
                    <p className="r15-kartya-mut r15-csak-asztal" data-r15="eredmeny">{elso.masodik_sor}</p>
                  ) : null}
                </div>
                <div className="r15-kartya-gombblokk r15-csak-asztal">
                  <div className="r15-kartya-gombsor">
                    <FoGomb posztra href={`/poszt?munka=${encodeURIComponent(elso.id)}`} osztaly="r15k-fo">{t("r15.kezdolap.atnezem_posztot")}</FoGomb>
                    <HalkLink href={`/kepek?poszt=${encodeURIComponent(elso.id)}`}>{t("r15.kozos.kep_hozza")}</HalkLink>
                  </div>
                  {/* gepezet-2 8 — mi jön a gomb után: 08 szerkeszthető, és semmi nem megy ki nélküle („Kész, másolom” csak másol) */}
                  <Info>{nyugtato}</Info>
                </div>
              </Teendo>
            ) : null}
            {listaBlokk}
          </div>
        ) : null}

        {megirHiba ? <Info>{megirHiba}</Info> : null}
        {/* c5 3. kör: a „Legutóbb …” sor ideje a Hírek csempére költözött (gepezet-6) — itt csak a 13d1 kredit-sor marad */}
        {kreditSor ? (
          <div className="r13d-alja r15-csak-asztal">
            <Info>{t("r13.kezdolap.kredit_sor", kreditSor)}</Info>
          </div>
        ) : null}
      </div>

      {ures ? (
        <div className="r15-also-sav">
          <FoGomb href={KESZ_MUNKA_CIM}>{t("r15.kozos.kepet_keszitek_munka") /* Kati 10-10 #10: „Új képet készítek” kamerának hangzott — a 09 címkéje, ugyanaz a cél */}</FoGomb>
        </div>
      ) : kartyaOtlet ? (
        <div className="r15-also-sav">
          <div className="r15-also-nyugtato"><Info>{nyugtato}</Info></div>
          <FoGomb onClick={() => void megir(kartyaOtlet)} disabled={megirFut !== null || !adat.szerkeszthet}>{t("r18.sajat.megirjuk")}</FoGomb>
        </div>
      ) : elso ? (
        <div className="r15-also-sav">
          <div className="r15-also-nyugtato"><Info>{nyugtato}</Info></div>
          <FoGomb posztra href={`/poszt?munka=${encodeURIComponent(elso.id)}`}>{t("r15.kezdolap.atnezem_posztot")}</FoGomb>
        </div>
      ) : null}
    </main>
  );
}
