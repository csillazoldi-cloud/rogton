"use client";
// R-16 K6 · 12g „Készítsünk egyet?” (design/R16-arculat/R16-arculat.dc.html 12g; TERV §2-K6; gepezet 13; kerdesek 4). A rajz a szerződés.
// A gép a cég nevéből, a munkatér színeiből és cím-betűjéből három névlogót kínál, amelyek ELRENDEZÉSBEN különböznek (c10, UTOKERES-12G):
// szó (nev: csak a név) · bélyeg (kor: kezdőbetű körben, alatta a név) · keretes (negyzet: a név sávban, kerettel) — a stílus neve nem látszik.
// Asztal: három kártya egy sorban, mindegyik fölül a logó egyforma dobozban (280 × 120, a háttérszínen, középen), alatta egy kész kép
// (280 × 350) ezzel a logóval. Telefon: a három logó egymás alatt (teljes szélesség × 84), alattuk a kiválasztott a két kész képen
// (világos 150 × 188, színes 104 × 130).
// Egy koppintás kijelöl; fő gomb: „Ez legyen” (a négy helyre elkészül és jóváhagyva ment: POST /api/arculat/nevlogo → vissza a 12c-re);
// halk link: „Inkább feltöltöm” (→ 12f). A „A négy helyre mi tesszük.” halk sor 10-06 óta nincs a lapon (Kati #6: aki nem tudja, hogy több
// logóforma van, annak ez nem mond semmit — T3/T5); a kulcs az adatbázisban marad. Hogyan készül (betű, szín, jel): sehol — a logó mutatja.
// Kirakás-zár javítás (10-01, Csilla: jóváhagyva; a bíráló: „Készítsünk egyet? — mit készítsünk, és mi az az egy?”): a cím és az alcím a már
// jóváhagyott 12a telefonos szöveg — „Válassz logót a cégnevedből” / „Ezt a hármat a nevedből csináltuk.” (r16.arculat.nevlogo.*, 0142).
// A régi keszit.kerdes/.alcim kulcs megmarad az adatbázisban (nem törlünk), csak ez a lap nem használja.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink } from "../../../_kozos/R15";
import { PostKep, type MintaValasztas } from "../_kozos/IgyNezKi";
import { VisszaSzakasz } from "../_kozos/VisszaSzakasz";
import { arSzoveg } from "../../../../logoterv/szabaly";
import "../../../_kozos/r15-lapok.css";

export const STILUSOK = ["nev", "kor", "negyzet"] as const;
export type Stilus = (typeof STILUSOK)[number];

export type NevlogoAdat = {
  /** a sávok háttere: a munkatér háttérszíne (a rajz 12g) */
  hatter: string;
  /** a még nem jóváhagyott arculat színei a képekhez (allapot.ts `elonezet`); jóváhagyva null */
  elonezet: { fo: string; masodik: string; hatter: string } | null;
  /** a korábban választott stílus, ha van (különben a rajz kijelölése: kis kör + név) */
  stilus: Stilus | null;
  /** R-17 B1: a tervezői ajánlat ára (EUR; a rendszergazda állítja) — null: nincs ajánlat, a gomb nem látszik */
  logotervAr?: number | null;
};

/** Telefonos-e a nézet (a CSS töréspontja, 640 px) — a képeket csak a látható elrendezés kéri: a képgyártó egyszerre egy képet rajzol,
 *  a rejtett elrendezés képei feleslegesen várakoztatnák a láthatókat (TERV §4 23.). Első rajzoláskor (kiszolgálón) még ismeretlen. */
export function useTelefon(): boolean | null {
  const [tel, setTel] = useState<boolean | null>(null);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const f = () => setTel(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return tel;
}

/** A kép helye, amíg a kép nem kérhető (ismeretlen vagy rejtett elrendezés): ugyanaz a keret, üresen (T3: gépezetet nem mutatunk). */
function UresKep({ osztaly }: { osztaly: string }) {
  return <div className={`r16a-igy-kep ${osztaly}`} data-r15="eredmeny" />;
}

export function Nevlogo({ adat }: { adat: NevlogoAdat }) {
  const { t, nyelv } = useFeliratok();
  const tel = useTelefon();
  const router = useRouter();
  const [stilus, setStilus] = useState<Stilus>(adat.stilus ?? "kor");
  const [folyik, setFolyik] = useState(false);
  const [hiba, setHiba] = useState(false);
  const valasztas = (s: Stilus): MintaValasztas => ({ nevlogo: { stilus: s }, ...(adat.elonezet ? { szinek: adat.elonezet } : {}) });

  async function ment() {
    setFolyik(true);
    setHiba(false);
    try {
      const v = await fetch("/api/arculat/nevlogo", { method: "POST", body: JSON.stringify({ stilus }), headers: { "content-type": "application/json" }, credentials: "same-origin" });
      if (!v.ok) { setHiba(true); setFolyik(false); return; }
      router.push("/fiok/arculat"); // 12c: a Logók sorban a négy hely (a lap kiszolgálói, mindig friss)
      router.refresh();
    } catch {
      setHiba(true);
      setFolyik(false);
    }
  }

  const foGomb = <FoGomb onClick={() => void ment()} disabled={folyik} aria-busy={folyik}>{t("r16.arculat.ez_legyen")}</FoGomb>;
  const sav = (s: Stilus) => (
    <span className="r16n-sav" aria-hidden="true" style={{ background: adat.hatter }}>
      <img className={`r16n-sav-logo r16n-sav-${s}`} src={`/api/arculat/nevlogo/${s}`} alt="" />
    </span>
  );
  const halk = (
    <>
      <HalkLink href="/fiok/arculat/logok">{t("r16.arculat.keszit.inkabb_feltoltom")}</HalkLink>
    </>
  );

  return (
    <main className="km-lap-keret r16a-lap">
      <div className="r16n-lap">
        <div className="r17-fej">
          <VisszaSzakasz />
          <div>
          <h1 className="r15-kerdes" data-r15="kerdes">{t("r16.arculat.nevlogo.kerdes")}</h1>
          <p className="r15-kerdes-alcim r16n-alcim" data-r15="kerdes-alcim">{t("r16.arculat.nevlogo.alcim")}</p>
          </div>
        </div>

        {/* asztal: három kártya — a logó a háttérszínen, alatta egy kész kép vele */}
        <div className="r16n-kartyak r15-csak-asztal" role="radiogroup" aria-label={t("r16.arculat.nevlogo.kerdes")}>
          {STILUSOK.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={s === stilus} aria-label={t("r16.arculat.logo")} className="r16n-kartya" onClick={() => setStilus(s)}>
              {sav(s)}
              <span className={`r16n-keret${s === stilus ? " r16n-keret-ki" : ""}`}>
                {tel === false ? <PostKep helyzet="kesz" valtozat="vilagos" frissites={0} valasztas={valasztas(s)} osztaly="r16n-kep" /> : <UresKep osztaly="r16n-kep" />}
              </span>
            </button>
          ))}
        </div>

        {/* telefon: a három logó egymás alatt, alattuk a kiválasztott a két kész képen */}
        <div className="r16n-tel r15-csak-tel">
          <div className="r16n-savok" role="radiogroup" aria-label={t("r16.arculat.nevlogo.kerdes")}>
            {STILUSOK.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={s === stilus} aria-label={t("r16.arculat.logo")} className={`r16n-sav-gomb${s === stilus ? " r16n-sav-ki" : ""}`} onClick={() => setStilus(s)}>
                {sav(s)}
              </button>
            ))}
          </div>
          <div className="r16n-tel-kepek">
            {tel ? <PostKep helyzet="kesz" valtozat="vilagos" frissites={0} valasztas={valasztas(stilus)} osztaly="r16n-tel-nagy" /> : <UresKep osztaly="r16n-tel-nagy" />}
            {tel ? <PostKep helyzet="kesz" valtozat="szines" frissites={0} valasztas={valasztas(stilus)} osztaly="r16n-tel-kicsi" /> : <UresKep osztaly="r16n-tel-kicsi" />}
          </div>
        </div>

        {hiba ? <Baj szoveg={t("fiok.mentes_hiba")} gomb={<HalkGomb onClick={() => setHiba(false)}>{t("kozos.rendben")}</HalkGomb>} /> : null}

        <div className="r16n-gombok">
          <span className="r15-csak-asztal">{foGomb}</span>
          {halk}
        </div>
        {/* R-17 B1 (Kati #5, Csilla 10-06): a névlogó marad az elsődleges (ingyenes) út; a tervezői ajánlat a HALK második, az árral */}
        {adat.logotervAr ? (
          <div className="r17-ajanlat"><HalkGomb href="/fiok/arculat/logoterv">{t("r17.logoterv.gomb", { ar: arSzoveg(adat.logotervAr, nyelv) })}</HalkGomb></div>
        ) : null}
      </div>

      <div className="r15-also-sav">{foGomb}</div>
    </main>
  );
}
