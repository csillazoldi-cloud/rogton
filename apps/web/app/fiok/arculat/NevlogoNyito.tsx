"use client";
// R-16 utókérés 2 · 12a TELEFON, ha még nincs logó (design/R16-arculat/R16-arculat.dc.html 12a telefon; UTOKERES-2.md; gepezet-3 4).
// A bíráló („nekem nincs logóm, nem tudom, mit kezdjek ezzel”) után a telefonos nyitó lap a névlogóval kezd — a 12g gépezetével (c10):
// három névlogó a cég nevéből (szó · bélyeg · keretes, a tárolt stílusértékek változatlanok: nev · kor · negyzet), az ELSŐ kijelölve;
// alattuk a kiválasztottal egy kész kép, mellette a Színek (három korong · Csere → 12d) és a Betűk („Aa Aa” — a két betű maga, név
// nélkül · Csere → 12e). Halk linkek: „Van saját logóm” (→ 12f, a „Van már logód?” kérdés nélkül, a fájlválasztóval) és „Most logó
// nélkül” (= a régi „Így jó, logó nélkül”: jóváhagyás logó nélkül). Fő gomb (a lap alján): „Ez legyen a logóm” = a 12g „Ez legyen”
// (POST /api/arculat/nevlogo — a négy helyre elkészül és jóváhagyva ment). Az asztali 12a változatlan (a hívó dönti el, mi látszik).
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SzakaszAdat } from "../../../arculat/allapot";
import { useFeliratok } from "../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink, KerdesCim } from "../../_kozos/R15";
import { PostKep, type MintaValasztas } from "./_kozos/IgyNezKi";
import { useSajatBetu } from "./_kozos/sajatBetu";
import { STILUSOK, useTelefon, type Stilus } from "./nevlogo/Nevlogo";

export const VAN_SAJAT_LOGOM_CIM = "/fiok/arculat/logok?van=1";

/** „Aa” a választott betűvel: beépített betűnél a kepbetuk.css osztálya, saját betűnél a betöltött családja (mint a 12a sor szava). */
function Aa({ kulcs, sajat, osztaly }: { kulcs: string; sajat: { id: string } | null; osztaly: string }) {
  const csalad = useSajatBetu(sajat?.id);
  if (sajat) return <span className={`${osztaly} kb-public-sans`} style={csalad ? { fontFamily: csalad } : undefined} aria-hidden="true">Aa</span>;
  return <span className={`${osztaly} kb-${kulcs}`} aria-hidden="true">Aa</span>;
}

/** Az alsó sáv fő gombja és a lap teste külön kell (a hívó a fő gombot a közös alsó sávba teszi). */
export function useNevlogoNyito() {
  const router = useRouter();
  const [stilus, setStilus] = useState<Stilus>("nev");
  const [folyik, setFolyik] = useState(false);
  const [hiba, setHiba] = useState(false);
  async function ment() {
    setFolyik(true);
    setHiba(false);
    try {
      const v = await fetch("/api/arculat/nevlogo", { method: "POST", body: JSON.stringify({ stilus }), headers: { "content-type": "application/json" }, credentials: "same-origin" });
      if (!v.ok) { setHiba(true); setFolyik(false); return; }
      router.refresh(); // a szakasz újratölt: van logó és jóváhagyva → 12c
      setFolyik(false);
    } catch {
      setHiba(true);
      setFolyik(false);
    }
  }
  return { stilus, setStilus, folyik, hiba, setHiba, ment };
}

export function NevlogoNyitoFoGomb({ allapot }: { allapot: ReturnType<typeof useNevlogoNyito> }) {
  const { t } = useFeliratok();
  return <FoGomb onClick={() => void allapot.ment()} disabled={allapot.folyik} aria-busy={allapot.folyik}>{t("r16.arculat.ez_legyen_logom")}</FoGomb>;
}

export function NevlogoNyito({ adat, allapot, logoNelkul, logoNelkulFolyik }: { adat: SzakaszAdat; allapot: ReturnType<typeof useNevlogoNyito>; logoNelkul: () => void; logoNelkulFolyik: boolean }) {
  const { t } = useFeliratok();
  const tel = useTelefon();
  const { stilus, setStilus } = allapot;
  const valasztas: MintaValasztas = { nevlogo: { stilus }, ...(adat.elonezet ? { szinek: adat.elonezet } : {}) };
  const korong = (hex: string, kulcs: string) => <span className="r16a-nl-korong" style={{ background: hex }} role="img" aria-label={t(kulcs)} />;
  return (
    <div className="r16a-nl r15-csak-tel">
      <KerdesCim cim={t("r16.arculat.nevlogo.kerdes")} alcim={t("r16.arculat.nevlogo.alcim")} />
      <div className="r16a-nl-savok" role="radiogroup" aria-label={t("r16.arculat.nevlogo.kerdes")}>
        {STILUSOK.map((s, i) => (
          <button key={s} type="button" role="radio" aria-checked={s === stilus} aria-label={`${t("r16.arculat.logo")} ${i + 1}`}
            className={`r16a-nl-sav-gomb${s === stilus ? " r16a-nl-sav-ki" : ""}`} onClick={() => setStilus(s)}>
            <span className="r16a-nl-sav" aria-hidden="true" style={{ background: adat.szinek.hatter }}>
              <img className={`r16a-nl-logo r16a-nl-logo-${s}`} src={`/api/arculat/nevlogo/${s}`} alt="" />
            </span>
          </button>
        ))}
      </div>
      <div className="r16a-nl-sor">
        {tel ? <PostKep helyzet="kesz" valtozat="vilagos" frissites={0} valasztas={valasztas} osztaly="r16a-nl-kep" /> : <div className="r16a-igy-kep r16a-nl-kep" data-r15="eredmeny" />}
        <div className="r16a-nl-ertekek">
          <div className="r16a-nl-ertek">
            <span className="r16a-nl-cimke">{t("r16.arculat.szinek")}</span>
            {korong(adat.szinek.fo, "r16.arculat.szin.fo")}{korong(adat.szinek.masodik, "r16.arculat.szin.masodik")}{korong(adat.szinek.hatter, "r16.arculat.szin.hatter")}
            <HalkLink href="/fiok/arculat/szinek">{t("r16.arculat.csere")}</HalkLink>
          </div>
          <div className="r16a-nl-ertek">
            <span className="r16a-nl-cimke">{t("r16.arculat.betuk")}</span>
            {/* R-17 A8 (12a telefon, Kati H2): az „Aa” alatt a betű hangulat-neve (ugyanaz a szó, mint asztalon a „Cím: Erős”) */}
            <span className="r17-aa"><Aa kulcs={adat.betuk.cim} sajat={adat.betuk.cimSajat} osztaly="r16a-nl-aa r16a-nl-aa-cim" /><span className="r17-aa-nev">{adat.betuk.cimSajat?.nev ?? t(adat.betuk.cimSzo)}</span></span>
            <span className="r17-aa"><Aa kulcs={adat.betuk.szoveg} sajat={adat.betuk.szovegSajat} osztaly="r16a-nl-aa r16a-nl-aa-szoveg" /><span className="r17-aa-nev">{adat.betuk.szovegSajat?.nev ?? t(adat.betuk.szovegSzo)}</span></span>
            <HalkLink href="/fiok/arculat/betuk">{t("r16.arculat.csere")}</HalkLink>
          </div>
        </div>
      </div>
      {allapot.hiba ? <Baj szoveg={t("fiok.mentes_hiba")} gomb={<HalkGomb onClick={() => allapot.setHiba(false)}>{t("kozos.rendben")}</HalkGomb>} /> : null}
      <div className="r16a-nl-linkek">
        <HalkLink href={VAN_SAJAT_LOGOM_CIM}>{t("r16.arculat.van_sajat_logom")}</HalkLink>
        <HalkLink onClick={logoNelkul} disabled={logoNelkulFolyik}>{t("r16.arculat.most_logo_nelkul")}</HalkLink>
      </div>
    </div>
  );
}
