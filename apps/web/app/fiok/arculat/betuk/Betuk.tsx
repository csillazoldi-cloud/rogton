"use client";
// R-16 K5 · 12e „Melyik betű illik hozzátok?” (design/R16-arculat/R16-arculat.dc.html 12e; TERV §2-K5; gepezet 7–8; kerdesek 2, 4).
// A rajz a szerződés. Asztal: bal hasáb 640 — kérdés · teendő (fülek Cím · Szöveg; az öt betű, mindegyik a SAJÁT alakjában, a
// hangulatszóval és halkan a nevével; ✓ a mostanin; alul „Ez legyen” · „Saját betűm van” · „Mégse”); jobbra „Így néz ki egy képed”.
// Telefon: kérdés → a két kép → fülek → a sorok (név nélkül) → „Saját betűm van” · „Mégse”; a fő gomb a lap alján.
//  - Koppintás egy sorra: a kép újraíródik a választással (POST helyzet-minta `betuk`, IgyNezKi) — még nem ment.
//  - „Ez legyen”: POST /api/arculat/betuk { cim, szoveg } = mentés ÉS jóváhagyás egy lépésben (kerdesek 4), majd vissza a szakaszra (12c).
//  - „Saját betűm van” (a rajzon a címe „TTF, OTF vagy WOFF2 fájl”): fájlválasztó → POST /api/arculat/fajl (x-fajl-cel: betu); 10-06 óta
//    egyszerre több fájl is (Kati #9), egymás után, a súgó („…— egyszerre több is”) mondja ki, új látható mondat nélkül. Utána egy
//    új sor „Saját: <név>” a betű saját alakjában, és kiválasztva; alatta a halk licencmondat (kerdesek 2). Ha a betűből a munkatér
//    nyelvének ékezete hiányzik: EGY halk sor (nem piros, T7), mert a kép ezeket a Public Sans-szal írja (TERV 1.5).
//  - „Mégse”: vissza a szakaszra, mentés nélkül.
// Ami nincs a rajzon (a betű iránymutatás mondata, arab betűk), az nincs itt (a rajz „HÁTRÉBB KERÜLT” sora).
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BetuValasztek, SajatBetuSor } from "../../../../arculat/betuk";
import { useFeliratok } from "../../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink, Info, KerdesCim, Teendo } from "../../../_kozos/R15";
import { hibaMitKulcs } from "../../../_kozos/ArculatAnyagok";
import { IgyNezKi } from "../_kozos/IgyNezKi";
import { useSajatBetu } from "../_kozos/sajatBetu";
import { egymasUtan } from "./tobbFajl";
import { VisszaSzakasz } from "../_kozos/VisszaSzakasz";
import "../../../_kozos/r15-lapok.css";

type Ful = "cim" | "szoveg";
/** A fájlválasztó: a három engedett betűtípus (a kiszolgáló a tartalomból is ellenőrzi — fajl-core + fontkit). */
const ELFOGAD = ".ttf,.otf,.woff2,font/ttf,font/otf,font/woff2";
const TARTALEK = "Public Sans";

export function Betuk({ adat, ful: kezdoFul }: { adat: BetuValasztek; ful: Ful }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const [ful, setFul] = useState<Ful>(kezdoFul);
  const [valasztas, setValasztas] = useState({ cim: adat.cim, szoveg: adat.szoveg });
  const [sajat, setSajat] = useState<SajatBetuSor[]>(adat.sajat);
  const [folyik, setFolyik] = useState(false);
  const [tolt, setTolt] = useState(false);
  const [hiba, setHiba] = useState<string | null>(null);
  const fajlRef = useRef<HTMLInputElement>(null);

  const aktualis = valasztas[ful];
  const valaszt = (kulcs: string) => setValasztas((v) => ({ ...v, [ful]: kulcs }));
  function fulValt(f: Ful) {
    setFul(f);
    // a cím megőrzi a fület (vissza/frissítés után ugyanott nyílik) — navigáció nélkül
    try { window.history.replaceState(null, "", f === "szoveg" ? "?ful=szoveg" : window.location.pathname); } catch { /* nem baj */ }
  }

  async function ezLegyen() {
    setFolyik(true);
    setHiba(null);
    try {
      const v = await fetch("/api/arculat/betuk", { method: "POST", body: JSON.stringify(valasztas), headers: { "content-type": "application/json" }, credentials: "same-origin" });
      if (!v.ok) { setHiba("MENTES"); return; }
      router.push("/fiok/arculat");
      router.refresh();
    } catch {
      setHiba("MENTES");
    } finally {
      setFolyik(false);
    }
  }

  /** Egy betűfájl feltöltése. A sikeres sor a listába kerül; hibánál a hiba kódja jön vissza (a hívó mutatja). */
  async function egyetFeltolt(f: File): Promise<{ sor: SajatBetuSor } | { hiba: string }> {
    try {
      const v = await fetch("/api/arculat/fajl", {
        method: "POST",
        body: f,
        credentials: "same-origin",
        headers: { "x-fajl-nev": encodeURIComponent(f.name), "x-fajl-cel": "betu", "content-type": "application/octet-stream" },
      });
      const j = (await v.json().catch(() => null)) as { hiba?: string; fajl?: { id: string }; betu?: { nev: string; hianyzo: string[] } } | null;
      if (v.status !== 201 || !j?.fajl || !j.betu) {
        return { hiba: j?.hiba ?? (v.status === 413 ? "TUL_NAGY" : v.status >= 500 ? "BELSO_HIBA" : "HALOZAT") };
      }
      const sor: SajatBetuSor = { id: j.fajl.id, kulcs: `sajat:${j.fajl.id}`, nev: j.betu.nev, hianyzo: j.betu.hianyzo };
      setSajat((l) => [sor, ...l.filter((x) => x.id !== sor.id)]);
      return { sor };
    } catch {
      return { hiba: "HALOZAT" };
    }
  }

  /** Kati #9 (10-02): egy betűcsalád több fájlja egyszerre kijelölhető; egymás után megy fel (tobbFajl.ts).
   *  Az ELSŐ sikeres lesz kiválasztva; ha valamelyik nem sikerül, a többi akkor is felmegy, a hiba az utolsó hibás fájlé. */
  async function feltolt(fajlok: File[]) {
    setTolt(true);
    setHiba(null);
    const { elso, hiba: utolsoHiba } = await egymasUtan(fajlok, egyetFeltolt);
    if (elso) valaszt(elso.kulcs);
    if (utolsoHiba) setHiba(utolsoHiba);
    setTolt(false);
  }

  function fajlValasztva(e: React.ChangeEvent<HTMLInputElement>) {
    const fajlok = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (fajlok.length > 0) void feltolt(fajlok);
  }

  const valasztottSajat = sajat.find((s) => s.kulcs === aktualis) ?? null;
  const hibaKulcs = hiba === "MENTES" ? "fiok.mentes_hiba" : hiba === "TIPUS_NEM_ENGEDETT" || hiba === "SVG_NEM_ENGEDETT" ? "r16.arculat.betu.hiba_tipus" : hiba ? hibaMitKulcs(hiba, true) : null; // a betű korlátja 10 MB marad
  const elonezet = { betuk: valasztas, ...(adat.elonezet ? { szinek: adat.elonezet } : {}) };

  const sajatLink = (
    <HalkLink onClick={() => fajlRef.current?.click()} title={t("r16.arculat.betu.sajat_tipus")} disabled={tolt} aria-busy={tolt}>{t("r16.arculat.betu.sajat")}</HalkLink>
  );
  const megseLink = <HalkLink href="/fiok/arculat">{t("r16.arculat.megse")}</HalkLink>;
  const foGomb = <FoGomb onClick={() => void ezLegyen()} disabled={folyik} aria-busy={folyik}>{t("r16.arculat.ez_legyen")}</FoGomb>;

  return (
    <main className="km-lap-keret r16a-lap">
      <div className="r16a-szakasz r16b-lap">
        <div className="r16a-fej">
          <div className="r17-fej"><VisszaSzakasz /><KerdesCim cim={t("r16.arculat.betu.kerdes")} /></div>
        </div>

        <div className="r16a-kep">
          <IgyNezKi meret="szakasz" valasztas={elonezet} />
        </div>

        <Teendo osztaly="r16b-teendo">
          <div role="tablist" className="r16b-fulek">
            {(["cim", "szoveg"] as const).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={ful === f} className={`r16b-ful${ful === f ? " r16b-ful-aktiv" : ""}`} onClick={() => fulValt(f)}>
                {t(f === "cim" ? "r16.arculat.betu.ful_cim" : "r16.arculat.betu.ful_szoveg")}
              </button>
            ))}
          </div>

          <div role="radiogroup" aria-label={t(ful === "cim" ? "r16.arculat.betu.ful_cim" : "r16.arculat.betu.ful_szoveg")} className="r16b-sorok">
            {adat.beepitett.map((b) => (
              <Sor key={b.kulcs} jelolt={aktualis === b.kulcs} onClick={() => valaszt(b.kulcs)}
                szo={<span className={`r16b-szo kb-${b.kulcs}${b.kulcs === "archivo" || b.kulcs === "gelasio" ? " r16b-szo-eros" : ""}`}>{t(b.szo)}</span>}
                nev={b.nev} />
            ))}
            {sajat.map((s) => (
              <SajatSor key={s.id} sor={s} jelolt={aktualis === s.kulcs} onClick={() => valaszt(s.kulcs)} szoveg={t("r16.arculat.betu.sajat_nev", { nev: s.nev })} />
            ))}
          </div>

          {sajat.length > 0 ? <Info osztaly="r16b-halk">{t("r16.arculat.betu.licenc")}</Info> : null}
          {valasztottSajat && valasztottSajat.hianyzo.length > 0 ? (
            <Info osztaly="r16b-halk">{t("r16.arculat.betu.hianyzo_betuk", { betuk: valasztottSajat.hianyzo.join(" "), tartalek: TARTALEK })}</Info>
          ) : null}

          {/* asztal: a fő gomb a teendőben, mellette a két halk link; telefonon a linkek itt, a fő gomb a lap alján */}
          <div className="r16a-gombsor r16b-gombsor r15-csak-asztal">
            {foGomb}
            {sajatLink}
            {megseLink}
          </div>
          <div className="r16b-tel-linkek r15-csak-tel">
            {sajatLink}
            {megseLink}
          </div>
        </Teendo>

        {hibaKulcs ? (
          <div className="r16a-alja">
            <Baj szoveg={t(hibaKulcs)} gomb={<HalkGomb onClick={() => setHiba(null)}>{t("kozos.rendben")}</HalkGomb>} />
          </div>
        ) : null}
      </div>

      <div className="r15-also-sav">{foGomb}</div>
      <input ref={fajlRef} type="file" accept={ELFOGAD} multiple hidden onChange={fajlValasztva} />
    </main>
  );
}

/** Egy betű sora: a szó a saját betűjével, halkan a neve (VJ-1011: telefonon is); ✓ a kiválasztotton (a rajz 12e). */
function Sor({ jelolt, onClick, szo, nev }: { jelolt: boolean; onClick: () => void; szo: React.ReactNode; nev?: string }) {
  return (
    <button type="button" role="radio" aria-checked={jelolt} className={`r16b-sor${jelolt ? " r16b-sor-jelolt" : ""}`} onClick={onClick}>
      <span className="r16b-sor-bal">
        {szo}
        {nev ? <span className="r15-info" data-r15="info">{nev}</span> /* VJ-1011 (Kati #8): a név telefonon is látszik */ : null}
      </span>
      {jelolt ? <span aria-hidden="true" className="r16b-pipa">✓</span> : <span />}
    </button>
  );
}

/** „Saját: <név>” a saját betűjével (betöltésig a Public Sans). */
function SajatSor({ sor, jelolt, onClick, szoveg }: { sor: SajatBetuSor; jelolt: boolean; onClick: () => void; szoveg: string }) {
  const csalad = useSajatBetu(sor.id);
  return <Sor jelolt={jelolt} onClick={onClick} szo={<span className="r16b-szo kb-public-sans" style={csalad ? { fontFamily: csalad } : undefined}>{szoveg}</span>} />;
}
