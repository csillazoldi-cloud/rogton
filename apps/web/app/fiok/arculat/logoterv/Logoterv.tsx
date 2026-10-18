"use client";
// R-17 B2/B3 · 12h „Mesélj a logódról” + 12h2 „Megkaptuk, köszönjük!” (design/R17-visszajelzes/rajz/R17-lapok.dc.html). A rajz a szerződés.
// Asztal: bal hasáb 640 — vissza-link · cím · alcím · teendő (négy mező előtöltve, „Hol fogod használni?” öt kapcsoló, fő gomb „Elküldöm”,
// mellette halk „Van mintám, ami tetszik”) · alatta halkan az ár („Ára: 79 €. Előbb felhívunk, és megbeszéljük.”). Telefon: ugyanez
// egymás alatt, az ár rövidebben, a fő gomb a lap alján. „Elküldöm” → POST /api/logoterv → 12h2 (✓ „Hamarosan jelentkezünk.” + a menete
// mondat: felhívunk, szerződés, banki átutalás — Csilla 10-06) · „Rendben” → a szakasz. A minta: a meglévő feltöltés (x-fajl-cel: referencia).
import { useRef, useState } from "react";
import { useFeliratok } from "../../../../nyelv/kliens";
import { Baj, FoGomb, HalkGomb, HalkLink, Info, KeszPillanat, KerdesCim, Teendo } from "../../../_kozos/R15";
import { HOL, HOL_ALAP, arSzoveg, type Hol } from "../../../../logoterv/szabaly";
import { VisszaSzakasz } from "../_kozos/VisszaSzakasz";
import "../../../_kozos/r15-lapok.css";

const MINTA_ELFOGAD = ".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf";

export function Logoterv({ ar, elotoltes }: { ar: number; elotoltes: { nev: string; mivel: string; hangulatKulcsok: string[]; szinKulcsok: string[] } }) {
  const { t, nyelv } = useFeliratok();
  const [nev, setNev] = useState(elotoltes.nev);
  const [mivel, setMivel] = useState(elotoltes.mivel);
  const [hangulat, setHangulat] = useState(() => elotoltes.hangulatKulcsok.map((k) => t(k).toLocaleLowerCase(nyelv)).filter((x, i, l) => x && l.indexOf(x) === i).join(", "));
  const [szinek, setSzinek] = useState(() => elotoltes.szinKulcsok.map((k) => t(k)).join(", "));
  const [hol, setHol] = useState<Hol[]>([...HOL_ALAP]);
  const [mintak, setMintak] = useState<string[]>([]);
  const [tolt, setTolt] = useState(false);
  const [folyik, setFolyik] = useState(false);
  const [hiba, setHiba] = useState(false);
  const [kesz, setKesz] = useState(false);
  const fajlRef = useRef<HTMLInputElement>(null);
  const arSz = arSzoveg(ar, nyelv);

  const holValt = (h: Hol) => setHol((l) => (l.includes(h) ? l.filter((x) => x !== h) : HOL.filter((x) => x === h || l.includes(x))));

  async function mintaValasztva(e: React.ChangeEvent<HTMLInputElement>) {
    const fajlok = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (fajlok.length === 0) return;
    setTolt(true);
    setHiba(false);
    for (const f of fajlok) {
      try {
        const v = await fetch("/api/arculat/fajl", { method: "POST", body: f, credentials: "same-origin", headers: { "x-fajl-nev": encodeURIComponent(f.name), "x-fajl-cel": "referencia", "content-type": "application/octet-stream" } });
        const j = (await v.json().catch(() => null)) as { fajl?: { id: string } } | null;
        if (v.status === 201 && j?.fajl) setMintak((l) => [...l, j.fajl!.id].slice(0, 10));
        else setHiba(true);
      } catch {
        setHiba(true);
      }
    }
    setTolt(false);
  }

  async function elkuld() {
    setFolyik(true);
    setHiba(false);
    try {
      const v = await fetch("/api/logoterv", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ nev, mivel, hangulat, szinek, hol, minta_idk: mintak }) });
      if (v.status !== 201) { setHiba(true); return; }
      setKesz(true);
      // telefonon a közös keret görög (r15-lapok.css), nem az ablak — mindkettőt a tetejére
      try { window.scrollTo(0, 0); document.querySelector(".km-lap-keret")?.scrollTo(0, 0); } catch { /* nem fontos */ }
    } catch {
      setHiba(true);
    } finally {
      setFolyik(false);
    }
  }

  if (kesz) {
    return (
      <main className="km-lap-keret r16a-lap">
        <div className="r17-lt">
          <div className="r17-fej"><VisszaSzakasz /><KerdesCim cim={t("r17.logoterv.koszonjuk")} /></div>
          <KeszPillanat>{t("r17.logoterv.hamarosan")}</KeszPillanat>
          <div className="r17-lt-info">
            <Info>{t("r17.logoterv.menete")}</Info>
            <Info>{t("r17.logoterv.addig")}</Info>
          </div>
          <span className="r15-csak-asztal"><FoGomb href="/fiok/arculat">{t("kozos.rendben")}</FoGomb></span>
        </div>
        <div className="r15-also-sav"><FoGomb href="/fiok/arculat">{t("kozos.rendben")}</FoGomb></div>
      </main>
    );
  }

  const mezo = (cimke: string, ertek: string, valt: (s: string) => void, max: number, kotelezo = false) => (
    <label className="r17-lt-mezo">
      <span className="r17-lt-cimke">{cimke}</span>
      <input value={ertek} onChange={(e) => valt(e.target.value)} maxLength={max} required={kotelezo} />
    </label>
  );
  const foGomb = <FoGomb onClick={() => void elkuld()} disabled={folyik || tolt || !nev.trim()} aria-busy={folyik}>{t("r17.logoterv.elkuldom")}</FoGomb>;
  const mintaLink = <HalkLink onClick={() => fajlRef.current?.click()} disabled={tolt} aria-busy={tolt}>{t("r17.logoterv.minta")}</HalkLink>;

  return (
    <main className="km-lap-keret r16a-lap">
      <div className="r17-lt">
        <div className="r17-fej"><VisszaSzakasz /><KerdesCim cim={t("r17.logoterv.kerdes")} alcim={t("r17.logoterv.alcim")} /></div>
        <Teendo osztaly="r17-lt-teendo">
          {mezo(t("r17.logoterv.nev"), nev, setNev, 120, true)}
          {mezo(t("r17.logoterv.mivel"), mivel, setMivel, 400)}
          {mezo(t("r17.logoterv.hangulat"), hangulat, setHangulat, 300)}
          {mezo(t("r17.logoterv.szinek"), szinek, setSzinek, 300)}
          <div className="r17-lt-mezo" role="group" aria-label={t("r17.logoterv.hol")}>
            <span className="r17-lt-cimke">{t("r17.logoterv.hol")}</span>
            <div className="r17-lt-chipek">
              {HOL.map((h) => (
                <button key={h} type="button" aria-pressed={hol.includes(h)} className={`r17-lt-chip${hol.includes(h) ? " r17-lt-chip-ki" : ""}`} onClick={() => holValt(h)}>
                  {hol.includes(h) ? <span aria-hidden="true">✓ </span> : null}{t(`r17.logoterv.hol_${h}`)}
                </button>
              ))}
            </div>
          </div>
          {mintak.length > 0 ? <Info>{t("r17.logoterv.minta_db", { n: mintak.length })}</Info> : null}
          <div className="r17-lt-gombsor r15-csak-asztal">
            {foGomb}
            {mintaLink}
          </div>
          <div className="r15-csak-tel"><div className="r17-lt-tel-sor">{mintaLink}<Info>{t("r17.logoterv.ar_rovid", { ar: arSz })}</Info></div></div>
        </Teendo>
        {hiba ? <Baj szoveg={t("vj.hiba")} gomb={<HalkGomb onClick={() => setHiba(false)}>{t("kozos.rendben")}</HalkGomb>} /> : null}
        <Info osztaly="r15-csak-asztal">{t("r17.logoterv.ar_sor", { ar: arSz })}</Info>
      </div>
      <div className="r15-also-sav">{foGomb}</div>
      <input ref={fajlRef} type="file" accept={MINTA_ELFOGAD} multiple hidden onChange={(e) => void mintaValasztva(e)} />
    </main>
  );
}
