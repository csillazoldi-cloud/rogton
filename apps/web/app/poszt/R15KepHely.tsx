"use client";
// R-15 · 08c — kép a poszthoz (design/R15/rajz/R15-lapok-1.dc.html, 08c 1–3; gepezet 17–19).
// R15KepHely: a kép helye az előnézet kártyáján, ha még nincs kép — három út: saját fotó · Kész képeim · új kép (Képek lap).
// R15KepAlatta: a kártya alatti halk sor (van kép: „Másik kép · Kép nélkül”); R15KepValaszto: „Melyik kép menjen hozzá?” alsó lap.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFeliratok } from "../../nyelv/kliens";
import { hivas } from "../_kozos/kliens";
import type { R15Kep } from "../../r15/tipusok";
import { FoGomb, HalkGomb, HalkLink, Info, KerdesCim } from "../_kozos/R15";
import "./r15-kephely.css";

function hibaKulcs(statusz: number): string {
  if (statusz === 415) return "fajl.hiba_tipus_nem_engedett";
  if (statusz === 413) return "fajl.hiba_tul_nagy";
  return "poszt.hiba_ai";
}

/** 08c 2 — „Melyik kép menjen hozzá?”: alsó lap (telefon) / felugró (asztal) a Kész képeim rácsával. */
export function R15KepValaszto({ posztId, kepek, jelenlegi, onZar, onValtozott }: {
  posztId: string; kepek: R15Kep[]; jelenlegi: string | null; onZar: () => void; onValtozott: () => void;
}) {
  const { t } = useFeliratok();
  const [valasztott, setValasztott] = useState<string | null>(jelenlegi ?? kepek[0]?.id ?? null);
  const [fut, setFut] = useState(false);
  const [kliens, setKliens] = useState(false);
  useEffect(() => setKliens(true), []);
  async function hozzatesz() {
    if (!valasztott) return;
    setFut(true);
    const v = await hivas(`/api/r15/poszt/${encodeURIComponent(posztId)}/kep`, "PUT", { kep_id: valasztott });
    setFut(false);
    if (v.statusz === 200) { onZar(); onValtozott(); }
  }
  if (!kliens) return null;
  // a réteg a <body>-ba kerül: így sem a kártya világos feed-stílusa, sem a szülő elrendezése nem hat rá
  return createPortal(
    <div className="r15k-reteg" role="dialog" aria-modal="true" aria-label={t("r15.kep.melyik_kep")}>
      <div className="r15k-hatter" aria-hidden="true" onClick={onZar} />
      <div className="r15k-lap">
        <span className="r15k-fogo" aria-hidden="true" />
        <div className="r15k-lap-tartalom">
          <KerdesCim cim={t("r15.kep.melyik_kep")} />
          <div className="r15k-racs">
            {kepek.map((k) => (
              <button key={k.id} type="button" className={k.id === valasztott ? "r15k-csempe r15k-csempe-aktiv" : "r15k-csempe"} aria-pressed={k.id === valasztott} onClick={() => setValasztott(k.id)}>
                <img src={k.url} alt="" />
                <span className="r15k-csempe-nev">{k.nev}</span>
                {k.id === valasztott ? <span className="r15k-pipa" aria-hidden="true">✓</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="r15k-lap-lab">
          <HalkGomb onClick={onZar}>{t("r15.kep.megse")}</HalkGomb>
          <FoGomb onClick={() => void hozzatesz()} disabled={!valasztott || fut}>{t("r15.kep.ezt_teszem")}</FoGomb>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 08c 1 — a kép helye, ha nincs kép: a három út (a kártyán belül, világos feed-kinézetben). */
export function R15KepHely({ posztId, kepek, uzenet = true, onValtozott }: {
  posztId: string; kepek: R15Kep[]; uzenet?: boolean; onValtozott: () => void;
}) {
  const { t } = useFeliratok();
  const input = useRef<HTMLInputElement>(null);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState<string | null>(null);
  const [valaszto, setValaszto] = useState(false);

  async function feltolt(f: File) {
    setFut(true);
    setHiba(null);
    try {
      const v = await fetch("/api/r15/kep", {
        method: "POST", body: f, credentials: "same-origin",
        headers: { "x-fajl-nev": encodeURIComponent(f.name.replace(/\.[a-z0-9]+$/i, "")), "x-poszt": posztId },
      });
      if (v.status === 201) onValtozott();
      else setHiba(t(hibaKulcs(v.status)));
    } catch {
      setHiba(t("poszt.hiba_ai"));
    } finally {
      setFut(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="r15k-hely">
      {uzenet ? <span className="r15k-hely-uzenet">{t("r15.kep.tegyel")}</span> : null}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void feltolt(f); }} />
      <HalkGomb onClick={() => input.current?.click()} disabled={fut}>{fut ? "…" : t("r15.kep.feltoltok")}</HalkGomb>
      {kepek.length > 0 ? <HalkGomb onClick={() => setValaszto(true)} disabled={fut}>{t("r15.kep.kesz_kepeim", { n: kepek.length })}</HalkGomb> : null}
      <HalkGomb href={`/kepek?poszt=${encodeURIComponent(posztId)}`}>{t("r15.kep.kep_ehhez_poszthoz") /* Kati 10-10 #5; R-18 6. kör (Kati F): előbb a mintaválasztás (/kepek?poszt=), utána a szerkesztő */}</HalkGomb>
      {hiba ? <span className="r15k-hely-uzenet" role="alert">{hiba}</span> : null}
      {valaszto ? <R15KepValaszto posztId={posztId} kepek={kepek} jelenlegi={null} onZar={() => setValaszto(false)} onValtozott={onValtozott} /> : null}
    </div>
  );
}

/** 08c 1 és 3 — a kártya alatti sorok: kép nélkül „Kép nélkül is kimásolhatod.”; képpel „Másik kép · Kép nélkül” + a másolás módja. */
export function R15KepAlatta({ posztId, kep, kepek, onValtozott, szerkHelyzet = "" }: { posztId: string; kep: R15Kep | null; kepek: R15Kep[]; onValtozott: () => void; /** R-18 8. kör: a szerkesztőből tett kép mintája — „Kép szerkesztése” */ szerkHelyzet?: string }) {
  const { t } = useFeliratok();
  const [valaszto, setValaszto] = useState(false);
  if (!kep) return <Info>{t("r15.kep.nelkul_is")}</Info>;
  async function nelkul() {
    const v = await hivas(`/api/r15/poszt/${encodeURIComponent(posztId)}/kep`, "PUT", { kep_id: null });
    if (v.statusz === 200) onValtozott();
  }
  return (
    <>
      <div className="r15k-alatta">
        {/* R-18 8. kör (Kati 10-13): vissza a szerkesztőbe ugyanazokkal a beállításokkal (poszt_munka.forras.kep_beallitas) */}
        {szerkHelyzet ? <HalkLink href={`/kepek/uj/${encodeURIComponent(szerkHelyzet)}?poszt=${encodeURIComponent(posztId)}&szerk=1`}>{t("r18.kep.szerkesztes")}</HalkLink> : null}
        <HalkLink onClick={() => setValaszto(true)}>{t("r15.kep.masik")}</HalkLink>
        <HalkLink onClick={() => void nelkul()}>{t("r15.kep.kep_nelkul")}</HalkLink>
      </div>
      <Info>{t("r15.kep.masol_letolt")}</Info>
      {valaszto ? <R15KepValaszto posztId={posztId} kepek={kepek} jelenlegi={kep.id} onZar={() => setValaszto(false)} onValtozott={onValtozott} /> : null}
    </>
  );
}
