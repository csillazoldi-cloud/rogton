"use client";
// R-15 · 08b „Így fog kinézni” (design/R15/rajz/R15-lapok-1.dc.html, 08b; gepezet 12–16). A kész szöveg a kiválasztott platform
// felépítésével: vágás a platform „Továbbiak” / „több” előtti hosszán (elonezetVag), a cég neve és logója (vagy kezdőbetűi),
// a kép a platform arányában. A kártya mindig világos, semleges feed-színekkel (nem séma-token — szándékosan). Logót nem másol.
// Minden gomb-szerű elem a kártyán (Tetszik, Hozzászólás…) csak díszítés; a valódi vezérlő a kép helye (kepHelye).
import { useState, type ReactNode } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import type { R15Ceg, R15Felulet, R15Kep } from "../../r15/tipusok";
import { elonezetVag, FELSO_HATAR } from "../../r15/szamol";
import { KEP_MERET, elonezetArany } from "../../r15/platform-aranyok";
import { Baj, HalkGomb, Info } from "../_kozos/R15";
import "./r15-elonezet.css";

/** A kerek profilkép: a cég logója az arculatból (Kati 10-11: „a profilkép nem működik”); ha nincs, vagy nem tölthető be, a kezdőbetűk. */
function Kor({ ceg, forma }: { ceg: R15Ceg; forma: "fb" | "ig" | "li" }) {
  const [hibas, setHibas] = useState(false);
  const osztaly = `r15e-kor r15e-kor-${forma}`;
  if (ceg.logo_url && !hibas) return <img className={`${osztaly} r15e-kor-logo`} src={ceg.logo_url} alt="" aria-hidden="true" onError={() => setHibas(true)} />;
  return <span className={osztaly} aria-hidden="true">{ceg.kezdobetuk}</span>;
}

/** A poszt képe a felület arányában (r15/platform-aranyok.ts): a saját aránya a felület határai között. */
function PosztKep({ kep, felulet }: { kep: R15Kep; felulet: R15Felulet }) {
  const [arany, setArany] = useState(() => elonezetArany(felulet));
  return <img className="r15e-kep" style={{ aspectRatio: String(arany) }} src={kep.url} alt={kep.nev} onLoad={(e) => setArany(elonezetArany(felulet, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight))} />;
}

const Ikon = ({ d }: { d: string[] }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);

export function R15Elonezet({ felulet, szoveg, cim = "", ceg, kep, kepHelye, onRovidebben }: {
  felulet: R15Felulet;
  szoveg: string;
  /** R-17 C2: a cikk címe (csak a blog felületen) */
  cim?: string;
  ceg: R15Ceg;
  kep: R15Kep | null;
  /** a kép helye, ha nincs kép (08c: a három út) */
  kepHelye?: ReactNode;
  onRovidebben?: () => void;
}) {
  const { t, nyelv } = useFeliratok();
  const { latszo, vagott, tul } = elonezetVag(szoveg, felulet);
  const jel = felulet === "fb" ? t("r15.elo.tovabbiak") : t("r15.elo.tobb");

  // a kép helye / a kép a felület mai arányában (r15/platform-aranyok.ts — Kati 10-11: a régi fekvő hely túl kicsi volt)
  const kepResz = () =>
    kep ? (
      <PosztKep key={`${kep.id}-${felulet}`} kep={kep} felulet={felulet} />
    ) : (
      <div className="r15e-kephely" style={{ aspectRatio: String(elonezetArany(felulet)) }}>
        {felulet === "ig" ? <span className="r15e-mut">{t("r15.elo.ig_kep_kell")}</span> : null}
        {kepHelye ?? <span className="r15e-mut">{t("r15.elo.nincs_kep")}</span>}
      </div>
    );

  const tovabb = vagott ? <span className="r15e-mut">… {jel}</span> : null;

  let kartya: ReactNode;
  if (felulet === "blog") {
    // R-17 C2 (17-08bl): egyszerű honlap-cikk — a honlap sávja (a cég honlapja, ha ismert), a kép helye (fekvő), a cím, a dátum és a cég,
    // az első bekezdések (a második halványabban). A menü-szavak helyén díszítő sávok (gépezet nincs mögöttük).
    let datum = "";
    try { datum = new Intl.DateTimeFormat(nyelv, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(new Date()); } catch { /* üres marad */ }
    const bekezdesek = latszo.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).slice(0, 2);
    kartya = (
      <div className="r15e-cikk">
        <div className="r15e-cikk-sav">
          <span className="r15e-cikk-domain">{ceg.honlap || ceg.nev}</span>
          <span className="r15e-cikk-menu" aria-hidden="true"><span /><span /><span /></span>
        </div>
        {kepResz()}
        <div className="r15e-cikk-test">
          {cim ? <p className="r15e-cikk-cim">{cim}</p> : null}
          <p className="r15e-mut r15e-kicsi">{datum} · {ceg.nev}</p>
          {bekezdesek.map((b, i) => <p key={i} className={i === 0 ? "r15e-cikk-bek" : "r15e-cikk-bek r15e-cikk-halvany"}>{b}{i === bekezdesek.length - 1 && vagott ? "…" : ""}</p>)}
        </div>
      </div>
    );
  } else if (felulet === "ig") {
    kartya = (
      <>
        <div className="r15e-fej r15e-fej-ig">
          <span className="r15e-ig-gyuru"><span className="r15e-ig-gyuru-belso"><Kor ceg={ceg} forma="ig" /></span></span>
          <span className="r15e-nevek"><span className="r15e-nev r15e-nev-ig">{ceg.felhasznalo}</span></span>
          <span className="r15e-pontok" aria-hidden="true">···</span>
        </div>
        {kepResz()}
        <div className="r15e-ikonsor" aria-hidden="true">
          <Ikon d={["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"]} />
          <Ikon d={["M20 12a8 8 0 1 1-3.2-6.4A8 8 0 0 1 20 12z", "M20 12v8l-3.5-2"]} />
          <Ikon d={["M21 3 10 14", "M21 3l-7 18-4-7-7-4z"]} />
          <span className="r15e-kitolt" />
          <Ikon d={["M6 3h12v18l-6-4-6 4z"]} />
        </div>
        <p className="r15e-szoveg r15e-szoveg-ig"><strong>{ceg.felhasznalo}</strong>{latszo}{tovabb}</p>
        <p className="r15e-ig-ido">{t("r15.elo.most")}</p>
      </>
    );
  } else {
    const li = felulet === "li";
    kartya = (
      <>
        <div className={li ? "r15e-fej r15e-fej-li" : "r15e-fej"}>
          <Kor ceg={ceg} forma={li ? "li" : "fb"} />
          <span className="r15e-nevek">
            <span className="r15e-nev">{ceg.nev}</span>
            {li ? <span className="r15e-mut r15e-kicsi">{t("r15.elo.li_meta")}</span> : <span className="r15e-mut r15e-kicsi">{t("r15.elo.most")} · {t("r18.elo.nyilvanos")}</span>}
          </span>
          {/* Kati 10-11 („Mire van ez a gomb?”): a díszítő „+ Követés” kikerült — a makettben nincs gombnak látszó semmi, ami nem működik */}
          <span className="r15e-pontok" aria-hidden="true">···</span>
        </div>
        <p className={li ? "r15e-szoveg r15e-szoveg-li" : "r15e-szoveg"}>{latszo}{tovabb}</p>
        {kepResz()}
        <div className="r15e-reakciok" aria-hidden="true">
          {(li ? ["tetszik", "hozzaszolas", "ujrakuldes", "kuldes"] : ["tetszik", "hozzaszolas", "megosztas"]).map((r) => <span key={r}>{t(`r18.elo.${r}`)}</span>)}
        </div>
      </>
    );
  }

  // R-18 6. kör (Kati B): „Ideális kép Facebookra: 1080 × 1350 px, álló (4:5)” — a kiválasztott felület ajánlott képmérete
  // (r15/platform-aranyok.ts KEP_MERET). Asztalon az előnézet alatt, telefonon fölötte (görgetés nélkül látszódjon).
  const m = KEP_MERET[felulet];
  const meretSzoveg = `${m.szel} × ${m.mag} px`;
  const meretSablon = t("poszt.kep_meret", { platform: t(`poszt.kep_platform_${felulet}`), forma: `${t(`poszt.forma_${m.forma}`)} (${nyelv === "en" ? m.arany.replace(",", ".") : m.arany})` });
  const meretSor = (osztaly: string) => (
    <p className={`r18p-meret ${osztaly}`}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 17l3-4 2 2.5L15 13l1.5 4" /></svg>
      <span>{meretSablon.split("{meret}").map((d, i) => (i === 0 ? d : <span key={i}><strong className="r18p-meret-szam">{meretSzoveg}</strong>{d}</span>))}</span>
    </p>
  );

  return (
    <div className="r15e">
      {meretSor("r15-csak-tel")}
      {tul ? (
        <Baj szoveg={t("poszt.tul_hosszu", { max: FELSO_HATAR[felulet] })} gomb={onRovidebben ? <HalkGomb onClick={onRovidebben}>{t("r15.poszt.rovidebben")}</HalkGomb> : null} />
      ) : null}
      <div className="r15e-kartya" data-r15="eredmeny">{kartya}</div>
      {meretSor("r15-csak-asztal")}
      <Info>{felulet === "blog" ? t("r17.poszt.cikk_elonezet_info") : vagott ? t("r15.elo.eleje", { jel }) : t("r15.elo.teljes")}</Info>
    </div>
  );
}
