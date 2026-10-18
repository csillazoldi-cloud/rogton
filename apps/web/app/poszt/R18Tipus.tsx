"use client";
import { useEffect, useState } from "react";
import type { PosztTipus, TipusAdat } from "@rogton/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { FoGomb, HalkGomb, HalkLink, Info } from "../_kozos/R15";
import { TIPUSOK } from "../_kozos/R18Kinalat";
import { szavazasSzoveg, videoSzamlalo, videoSzoveg } from "../../poszt/tipus";

// R-18 7. kör (rajz: „Posztszöveg · Videó forgatókönyv / Szavazás / Fotóalbum / Picmess → képminta”, IRANYOK-round7.md): a poszt
// fajtájának chipsora és a fajták kimenete. A chipsor a cím alatt (telefonon vízszintesen görgethető); a téma javasolt fajtája
// „· javasolt”. Chip = a gép megírja ehhez a fajtához (mint az „Új változat”); a kijelölt chipre koppintva vissza a sima szöveghez.

/** A cím és az alcím a fajta szerint (a sima szöveges posztnál a mai cím marad). */
export function tipusCim(tipus: PosztTipus): { cim: string; alcim: string } {
  const k = tipus === "video" ? "video" : tipus === "szavazas" ? "szavazas" : tipus === "album" ? "album" : "kepes";
  return { cim: `${k}.cim`, alcim: `${k}.alcim` };
}

export function TipusChipek({ tipus, javasolt, valaszt, tiltva }: { tipus: PosztTipus | null; javasolt: PosztTipus | null; valaszt: (t: PosztTipus | null) => void; tiltva: boolean }) {
  const { t } = useFeliratok();
  return (
    <div className="r18k7-chipek" role="radiogroup" aria-label={t("tipus.cim")}>
      {TIPUSOK.map((x) => (
        <button key={x} type="button" role="radio" aria-checked={x === tipus} className="r18k7-chip" disabled={tiltva} onClick={() => valaszt(x === tipus ? null : x)}>
          {x === tipus ? <span aria-hidden="true">✓ </span> : null}{t(`tipus.${x}`)}{x === javasolt ? ` · ${t("tipus.javasolt")}` : ""}
        </button>
      ))}
    </div>
  );
}

function useMasolva(): [boolean, (s: string) => Promise<void>] {
  const [masolva, setMasolva] = useState("");
  const [most, setMost] = useState("");
  return [!!masolva && masolva === most, async (s: string) => {
    try { await navigator.clipboard.writeText(s); } catch { /* a vágólap tiltva: a szöveg látszik, kézzel kimásolható */ }
    setMasolva(s); setMost(s);
  }];
}

/** A fajta kimenete (a sima szerkesztő helyén). Az album a poszt szövegmezőjét használja (`mezo`), a többi a saját adatát. */
export function TipusPanel({ tipus, adat, posztId, mezo, keszGomb, ujValtozat, fut }: {
  tipus: PosztTipus;
  adat: TipusAdat | null;
  posztId: string;
  /** a poszt szövegmezője (albumnál a képek mellé írt szöveg) */
  mezo: React.ReactNode;
  /** albumnál a mai „Kész, másolom” gomb (könyveli a posztot) */
  keszGomb: React.ReactNode;
  ujValtozat: () => void;
  fut: boolean;
}) {
  const { t } = useFeliratok();
  const [masolva, masol] = useMasolva();
  const [sorok, setSorok] = useState(adat?.video?.sorok ?? []);
  const [hookok, setHookok] = useState(adat?.video?.hookok ?? []);
  const [kerdes, setKerdes] = useState(adat?.szavazas?.kerdes ?? "");
  const [valaszok, setValaszok] = useState<string[]>(adat?.szavazas?.valaszok ?? ["", ""]);
  useEffect(() => {
    setSorok(adat?.video?.sorok ?? []); setHookok(adat?.video?.hookok ?? []);
    setKerdes(adat?.szavazas?.kerdes ?? ""); setValaszok(adat?.szavazas?.valaszok ?? ["", ""]);
  }, [adat]);

  if (!adat) return <div className="r15p-mezo r15p-irjuk" aria-live="polite"><span className="r15p-porgo" aria-hidden="true" />{t("r15.poszt.irjuk")}</div>;

  if (tipus === "video") {
    const { szo, mp } = videoSzamlalo(sorok);
    const cimkek = { elmondod: t("video.elmondod"), felirat: t("video.felirat"), kep: t("video.kep_rovid") };
    const fo = <FoGomb onClick={() => void masol(videoSzoveg(sorok, cimkek))} disabled={fut} aria-live="polite">{masolva ? t("r18.poszt.kimasoltuk") : t("video.masolas")}</FoGomb>;
    return (
      <>
        <table className="r18k7-tabla r15-csak-asztal">
          <thead><tr><th className="r18k7-tabla-szam">#</th><th className="r18k7-tabla-ido">{t("video.ido")}</th><th>{t("video.elmondod")}</th><th className="r18k7-tabla-felirat">{t("video.felirat")}</th><th className="r18k7-tabla-kep">{t("video.kep")}</th></tr></thead>
          <tbody>{sorok.map((r, i) => <tr key={i}><td className="r18k7-mono">{i + 1}</td><td className="r18k7-mono">{r.ido}</td><td>{r.elmondod}</td><td className="r18k7-felirat">{r.felirat}</td><td className="r18k7-jel">{r.kep}</td></tr>)}</tbody>
        </table>
        <div className="r18k7-lista r15-csak-tel">
          {sorok.map((r, i) => (
            <div key={i} className="r18k7-blokk">
              <div className="r18k7-blokk-fej"><span>{i + 1}</span><span>{r.ido}</span><span className="r18k7-blokk-felirat">{r.felirat}</span></div>
              <div className="r18k7-blokk-szoveg">{r.elmondod}</div>
              {r.kep ? <div className="r18k7-jel">{t("video.kep_rovid")}: {r.kep}</div> : null}
            </div>
          ))}
        </div>
        {hookok.length ? (
          <div className="r18k7-hookok">
            <span className="r18k7-cimke">{t("video.mas_kezdes")}</span>
            {hookok.map((h, i) => (
              <button key={i} type="button" className="r18k7-hook" onClick={() => { const regi = sorok[0]?.elmondod ?? ""; setSorok((s) => s.map((r, j) => (j === 0 ? { ...r, elmondod: h } : r))); setHookok((l) => l.map((x, j) => (j === i ? regi : x))); }}>„{h}”</button>
            ))}
          </div>
        ) : null}
        <div className="r18k7-gombsor r15-csak-asztal">{fo}<HalkGomb onClick={ujValtozat} disabled={fut}>{t("r15.poszt.uj_valtozat")}</HalkGomb><Info>{t("video.szamlalo", { n: szo, mp })}</Info></div>
        <div className="r18k7-gombsor r15-csak-tel"><HalkGomb onClick={ujValtozat} disabled={fut}>{t("r15.poszt.uj_valtozat")}</HalkGomb><Info>{t("video.szamlalo", { n: szo, mp })}</Info></div>
        <div className="r15-also-sav">{fo}</div>
      </>
    );
  }

  if (tipus === "szavazas") {
    const fo = <FoGomb onClick={() => void masol(szavazasSzoveg(kerdes, valaszok))} disabled={fut || !kerdes.trim()} aria-live="polite">{masolva ? t("r18.poszt.kimasoltuk") : t("r15.poszt.kesz_masolom")}</FoGomb>;
    return (
      <>
        <div className="r18k7-mezo-blokk">
          <label className="r18k7-cimke" htmlFor="r18k7-kerdes">{t("szavazas.kerdes")}</label>
          <input id="r18k7-kerdes" className="r18p-input" value={kerdes} maxLength={200} onChange={(e) => setKerdes(e.target.value)} />
        </div>
        <div className="r18k7-mezo-blokk">
          <span className="r18k7-cimke">{t("szavazas.valaszok")}</span>
          {valaszok.map((v, i) => (
            <div key={i} className="r18k7-valasz">
              <span className="r18k7-szam">{i + 1}.</span>
              <input className="r18p-input" value={v} maxLength={80} aria-label={`${i + 1}.`} onChange={(e) => setValaszok((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
              {valaszok.length > 2 ? <button type="button" className="r18k7-torol" aria-label={t("szavazas.torles")} onClick={() => setValaszok((l) => l.filter((_, j) => j !== i))}>✕</button> : null}
            </div>
          ))}
          {valaszok.length < 4 ? <div><HalkLink onClick={() => setValaszok((l) => [...l, ""])}>{t("szavazas.meg_egy")}</HalkLink></div> : null}
        </div>
        <Info>{t("szavazas.hova")}</Info>
        <div className="r18k7-gombsor">{<span className="r15-csak-asztal">{fo}</span>}<HalkGomb onClick={ujValtozat} disabled={fut}>{t("r15.poszt.uj_valtozat")}</HalkGomb></div>
        <div className="r15-also-sav">{fo}</div>
      </>
    );
  }

  if (tipus === "album") {
    const kepek = adat.album?.kepek ?? [];
    return (
      <>
        {mezo}
        <div className="r18k7-cimke">{t("album.sorrend", { min: Math.min(6, kepek.length), max: Math.max(8, kepek.length) })}</div>
        <div className="r18k7-lista">{kepek.map((k, i) => <div key={i} className="r18k7-kepsor"><span className="r18k7-szam">{i + 1}.</span><span>{k}</span></div>)}</div>
        <div className="r18k7-gombsor"><span className="r15-csak-asztal">{keszGomb}</span><HalkGomb onClick={ujValtozat} disabled={fut}>{t("r15.poszt.uj_valtozat")}</HalkGomb></div>
        <div className="r15-also-sav">{keszGomb}</div>
      </>
    );
  }

  // Picmess kép / szöveges kártya: a képre kerülő cím + sor, és a kép a 6. kör mintaválasztásával készül (a szöveges kártya a szöveges mintákkal)
  const cel = `/kepek?poszt=${encodeURIComponent(posztId)}&tipus=${tipus}`;
  const fo = <FoGomb href={cel}>{t("r15.kep.kep_ehhez_poszthoz")}</FoGomb>;
  return (
    <>
      <div className="r15-teendo r18k7-kartya" data-r15="teendo">
        <Info>{t("kepes.kerul")}</Info>
        <div className="r18k7-kartya-cim">{adat.kartya?.cim}</div>
        {adat.kartya?.sor ? <div className="r18k7-kartya-sor">{adat.kartya.sor}</div> : null}
      </div>
      <div className="r18k7-lepes">{t("kepes.kovetkezik")}</div>
      <div className="r18k7-gombsor"><span className="r15-csak-asztal">{fo}</span><HalkGomb onClick={ujValtozat} disabled={fut}>{t("r15.poszt.uj_valtozat")}</HalkGomb></div>
      <div className="r15-also-sav">{fo}</div>
    </>
  );
}
