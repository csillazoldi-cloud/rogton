"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFeliratok } from "../../nyelv/kliens";
import { FelsoSav } from "../_kozos/FelsoSav";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { hivas } from "../_kozos/kliens";
import { eredetDarabok, sajatArany } from "./eredet";

// R-11/A3 — Posztszöveg. Bal oldalon a blokkválasztó (munka · felület · nyelv), középen a szerkesztő,
// jobbra az összhangjelzés. Egy képernyő, görgetés nélkül.
// A cég iránytűje nincs kiírva: csak a jelzés utal rá. A jelzés figyelmeztetés, nem zár.

type Felulet = "fb" | "ig" | "li";
type Nyelv = "hu" | "ro" | "en";
type CellaAllapot = "nincs" | "javaslat" | "szerkesztve" | "vegleges";

const FELULETEK: Felulet[] = ["fb", "ig", "li"];
const NYELVEK: Nyelv[] = ["hu", "ro", "en"];
// A platformok saját felső határa, és amennyi a hírfolyamban látszik (ellenőrizve 2026-09-19).
const KARAKTERHATAR: Record<Felulet, number> = { fb: 63206, ig: 2200, li: 3000 };
const LATHATO_HATAR: Record<Felulet, number> = { fb: 477, ig: 125, li: 210 };

type Szoveg = {
  felulet: Felulet;
  nyelv: Nyelv;
  szoveg: string;
  javaslat: string;
  hashtagek: string[];
  allapot: CellaAllapot;
  veglegesitve: string | null;
  nyelvre_szabva: boolean;
  elavult_forditas: boolean;
};

type Osszhang = {
  allapot: "ok" | "ellentmond" | "nem_futott";
  mondat: string;
  pont: string;
  pont_szoveg: string;
  szovegresz: string;
  teendok: string[];
  ideje: string | null;
};

type Forras = { tipus: "hir" | "terv" | "belso" | "sajat"; azonosito: string; cim: string; url: string; szoveg: string };

type Munka = {
  id: string;
  cim: string;
  forras: Forras;
  szovegek: Szoveg[];
  osszhang: Osszhang | null;
  piros_veglegesites: boolean;
  frissitve: string;
};

type ListaSor = {
  id: string;
  cim: string;
  forras_tipus: Forras["tipus"];
  allapot: CellaAllapot;
  piros_veglegesites: boolean;
  frissitve: string;
};

function idoBelyeg(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function Poszt({ szerkesztheto, sav }: { szerkesztheto: boolean; sav: FelsoSavAdat }) {
  const { t } = useFeliratok();
  const router = useRouter();

  const [munkak, setMunkak] = useState<ListaSor[]>([]);
  const [munka, setMunka] = useState<Munka | null>(null);
  const [toltes, setToltes] = useState(true);
  const [felulet, setFelulet] = useState<Felulet>("fb");
  const [nyelv, setNyelv] = useState<Nyelv>("hu");
  const [szoveg, setSzoveg] = useState("");
  const [mentesAllapot, setMentesAllapot] = useState<"csend" | "folyik" | "kesz" | "hiba">("csend");
  const [mentveEkkor, setMentveEkkor] = useState<Date | null>(null);
  const [fut, setFut] = useState<string | null>(null);
  const [hibaUzenet, setHibaUzenet] = useState("");
  const [ujNyitva, setUjNyitva] = useState(false);
  const [ujTema, setUjTema] = useState("");
  const [reszletek, setReszletek] = useState(false);
  const [elozoek, setElozoek] = useState<string[]>([]);
  const [eredetNezet, setEredetNezet] = useState(false);

  const idozito = useRef<ReturnType<typeof setTimeout> | null>(null);
  const szovegRef = useRef("");
  szovegRef.current = szoveg;
  const cellaKulcs = `${munka?.id ?? ""}|${felulet}|${nyelv}`;
  const cellaKulcsRef = useRef(cellaKulcs);

  const cella = munka?.szovegek.find((sz) => sz.felulet === felulet && sz.nyelv === nyelv) ?? null;
  const vegleges = cella?.allapot === "vegleges";

  function hibaSzoveg(kod: unknown): string {
    if (kod === "AI_KERET_KIMERULT") return t("poszt.hiba_keret");
    if (kod === "AI_KIKAPCSOLVA") return t("poszt.hiba_kikapcsolva");
    return t("poszt.hiba_ai");
  }

  /** A válaszból érkező munka beültetése; a szerkesztőmező is követi. */
  const munkatAtvesz = useCallback((uj: Munka, celFelulet: Felulet, celNyelv: Nyelv) => {
    setMunka(uj);
    const c = uj.szovegek.find((sz) => sz.felulet === celFelulet && sz.nyelv === celNyelv);
    setSzoveg(c?.szoveg ?? "");
    cellaKulcsRef.current = `${uj.id}|${celFelulet}|${celNyelv}`;
  }, []);

  const listatBetolt = useCallback(async () => {
    const v = await fetch("/api/poszt", { credentials: "same-origin", cache: "no-store" });
    if (v.status === 401) {
      router.push("/belepes");
      return [];
    }
    const adat = (await v.json().catch(() => ({}))) as { munkak?: ListaSor[] };
    const sorok = adat.munkak ?? [];
    setMunkak(sorok);
    return sorok;
  }, [router]);

  const munkatBetolt = useCallback(
    async (id: string) => {
      const v = await fetch(`/api/poszt/${id}`, { credentials: "same-origin", cache: "no-store" });
      if (v.status !== 200) return;
      const adat = (await v.json().catch(() => ({}))) as { munka?: Munka };
      if (!adat.munka) return;
      const elso = adat.munka.szovegek[0];
      const celFelulet = elso?.felulet ?? "fb";
      const celNyelv = elso?.nyelv ?? "hu";
      setFelulet(celFelulet);
      setNyelv(celNyelv);
      setElozoek([]);
      munkatAtvesz(adat.munka, celFelulet, celNyelv);
    },
    [munkatAtvesz],
  );

  useEffect(() => {
    void (async () => {
      const sorok = await listatBetolt();
      // A Hírek lapról „?munka=…"-val érkezünk: azt a munkát nyitjuk meg, ne a legutóbbit.
      const kert = new URLSearchParams(window.location.search).get("munka");
      const cel = (kert && sorok.find((s) => s.id === kert)) || sorok[0];
      if (cel) await munkatBetolt(cel.id);
      setToltes(false);
    })();
  }, [listatBetolt, munkatBetolt]);

  /** Cellaváltáskor a mező a cella tartalmát veszi fel. */
  useEffect(() => {
    if (!munka) return;
    if (cellaKulcsRef.current === cellaKulcs) return;
    cellaKulcsRef.current = cellaKulcs;
    const c = munka.szovegek.find((sz) => sz.felulet === felulet && sz.nyelv === nyelv);
    setSzoveg(c?.szoveg ?? "");
    setElozoek([]);
    setEredetNezet(false);
  }, [cellaKulcs, munka, felulet, nyelv]);

  const ment = useCallback(async () => {
    if (!munka || !szerkesztheto) return;
    setMentesAllapot("folyik");
    const r = await hivas(`/api/poszt/${munka.id}`, "PUT", { felulet, nyelv, szoveg: szovegRef.current });
    if (r.statusz === 200) {
      const uj = (r.torzs as { munka?: Munka }).munka;
      if (uj) setMunka(uj);
      setMentesAllapot("kesz");
      setMentveEkkor(new Date());
    } else {
      setMentesAllapot("hiba");
    }
  }, [munka, szerkesztheto, felulet, nyelv]);

  /** Gépelés után 800 ms-mal mentünk. Véglegesített cellába nem írunk. */
  useEffect(() => {
    if (!munka || !szerkesztheto || vegleges) return;
    if (szoveg === (cella?.szoveg ?? "")) return;
    if (idozito.current) clearTimeout(idozito.current);
    idozito.current = setTimeout(() => void ment(), 800);
    return () => {
      if (idozito.current) clearTimeout(idozito.current);
    };
  }, [szoveg, munka, szerkesztheto, vegleges, cella, ment]);

  async function ujMunka() {
    const tema = ujTema.trim();
    if (!tema) return;
    setFut("uj");
    setHibaUzenet("");
    const r = await hivas("/api/poszt", "POST", {
      forras: { tipus: "sajat", azonosito: "", cim: tema.slice(0, 120), url: "", szoveg: tema },
      cim: tema.slice(0, 120),
      felulet,
      nyelv,
    });
    setFut(null);
    if (r.statusz !== 200) {
      setHibaUzenet(hibaSzoveg((r.torzs as { hiba?: unknown }).hiba));
      return;
    }
    const uj = (r.torzs as { munka?: Munka }).munka;
    if (!uj) return;
    setUjNyitva(false);
    setUjTema("");
    await listatBetolt();
    munkatAtvesz(uj, felulet, nyelv);
    await muvelet("szoveg", {}, uj.id);
  }

  /** Egy AI-művelet a nyitott cellán. A válasz mindig a teljes munka.
   *  Az azonosítót át lehet adni: az imént létrehozott munka még nincs az állapotban. */
  async function muvelet(ut: string, torzs: Record<string, unknown>, idFelul?: string) {
    const id = idFelul ?? munka?.id;
    if (!id) return;
    setFut(ut);
    setHibaUzenet("");
    const r = await hivas(`/api/poszt/${id}/${ut}`, "POST", { felulet, nyelv, ...torzs });
    setFut(null);
    if (r.statusz !== 200) {
      setHibaUzenet(hibaSzoveg((r.torzs as { hiba?: unknown }).hiba));
      return;
    }
    const uj = (r.torzs as { munka?: Munka }).munka;
    if (!uj) return;
    setElozoek((e) => [szovegRef.current, ...e].slice(0, 20));
    munkatAtvesz(uj, felulet, nyelv);
    await listatBetolt();
  }

  async function veglegesitestVisszavon() {
    if (!munka) return;
    const r = await hivas(`/api/poszt/${munka.id}/veglegesites`, "DELETE", { felulet, nyelv });
    if (r.statusz !== 200) return;
    const uj = (r.torzs as { munka?: Munka }).munka;
    if (uj) munkatAtvesz(uj, felulet, nyelv);
  }

  function visszavon() {
    const elso = elozoek[0];
    if (elso === undefined) return;
    setSzoveg(elso);
    setElozoek((e) => e.slice(1));
  }

  function cellaAllapotSzo(f: Felulet, ny: Nyelv): string {
    const c = munka?.szovegek.find((sz) => sz.felulet === f && sz.nyelv === ny);
    if (!c || c.allapot === "nincs") return t("poszt.allapot_nincs");
    if (c.allapot === "javaslat") return t("poszt.allapot_javaslat");
    if (c.allapot === "szerkesztve") return t("poszt.allapot_szerkesztve");
    return t("poszt.allapot_vegleges");
  }

  const osszhang = munka?.osszhang ?? null;
  const jelzesOsztaly =
    !osszhang || szoveg.trim().length === 0
      ? "km-po-jelzes km-po-jelzes-nincs"
      : osszhang.allapot === "ok"
        ? "km-po-jelzes km-po-jelzes-zold"
        : osszhang.allapot === "ellentmond"
          ? "km-po-jelzes km-po-jelzes-piros"
          : "km-po-jelzes km-po-jelzes-semleges";

  function jelzesMondat(): string {
    if (!osszhang) return t("osszhang.nincs_meg");
    if (osszhang.allapot === "ok") return "";
    if (osszhang.allapot === "ellentmond") {
      return osszhang.mondat === "tiltott_szo" ? t("osszhang.tiltott_szo") : osszhang.mondat;
    }
    if (osszhang.mondat === "nincs_iranytu") return t("osszhang.nincs_iranytu");
    if (osszhang.mondat === "keret_kimerult") return t("osszhang.keret_kimerult");
    if (osszhang.mondat === "ismeretlen_valasz") return t("osszhang.ismeretlen_valasz");
    return t("osszhang.ai_hiba");
  }

  if (toltes) {
    return (
      <>
      <FelsoSav adat={sav} aktiv="poszt" />
      <main className="km-lap-keret km-po">
        <p className="km-po-toltes">…</p>
      </main>
      </>
    );
  }

  const uresLap = munkak.length === 0 && !ujNyitva;

  return (
    <>
    <FelsoSav adat={sav} aktiv="poszt" />
    <main className="km-lap-keret km-po">

      {uresLap && (
        <div className="km-po-ures">
          <h2>{t("poszt.nincs_munka")}</h2>
          <p>{t("poszt.nincs_munka_szoveg")}</p>
          {szerkesztheto ? (
            <button type="button" className="km-po-fogomb" onClick={() => setUjNyitva(true)}>
              {t("poszt.uj_munka")}
            </button>
          ) : (
            <p className="km-po-halvany">{t("poszt.csak_nezo")}</p>
          )}
        </div>
      )}

      {ujNyitva && (
        <div className="km-po-uj">
          <label className="km-po-mezo">
            <span>{t("poszt.mirol")}</span>
            <input
              type="text"
              value={ujTema}
              onChange={(e) => setUjTema(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void ujMunka();
              }}
            />
          </label>
          <p className="km-po-halvany">{t("poszt.mirol_segitseg")}</p>
          <div className="km-po-uj-gombok">
            <button type="button" className="km-po-fogomb" onClick={() => void ujMunka()} disabled={fut !== null || !ujTema.trim()}>
              {fut === "uj" || fut === "szoveg" ? t("poszt.ai_dolgozik") : t("poszt.inditas")}
            </button>
            <button type="button" className="km-po-halvany-gomb" onClick={() => setUjNyitva(false)}>
              {t("poszt.megse")}
            </button>
          </div>
          {hibaUzenet && <p className="km-po-hiba">{hibaUzenet}</p>}
        </div>
      )}

      {!uresLap && !ujNyitva && (
        <div className="km-po-racs">
          {/* Bal: a blokkválasztó — melyik munka, melyik felület, melyik nyelv */}
          <nav className="km-po-valaszto" aria-label={t("poszt.munkak")}>
            <div className="km-po-valaszto-fej">
              <span>{t("poszt.munkak")}</span>
              {szerkesztheto && (
                <button type="button" className="km-po-apro-gomb" onClick={() => setUjNyitva(true)}>
                  {t("poszt.uj_munka")}
                </button>
              )}
            </div>
            <div className="km-po-munkalista">
              {munkak.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={m.id === munka?.id ? "km-po-munka-aktiv" : undefined}
                  aria-current={m.id === munka?.id ? "true" : undefined}
                  onClick={() => void munkatBetolt(m.id)}
                >
                  <span className="km-po-munka-cim">{m.cim}</span>
                  <span className="km-po-munka-allapot">{t(`poszt.forras_${m.forras_tipus}`)}</span>
                </button>
              ))}
            </div>

            <div className="km-po-valaszto-fej">{t("poszt.felulet")}</div>
            <div className="km-po-sor">
              {FELULETEK.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={f === felulet ? "km-po-ful-aktiv" : "km-po-ful"}
                  aria-current={f === felulet ? "true" : undefined}
                  onClick={() => setFelulet(f)}
                >
                  <span>{t(`poszt.${f}`)}</span>
                  <span className="km-po-munka-allapot">{cellaAllapotSzo(f, nyelv)}</span>
                </button>
              ))}
            </div>

            <div className="km-po-valaszto-fej">{t("poszt.nyelv")}</div>
            <div className="km-po-sor">
              {NYELVEK.map((ny) => (
                <button
                  key={ny}
                  type="button"
                  className={ny === nyelv ? "km-po-ful-aktiv" : "km-po-ful"}
                  aria-current={ny === nyelv ? "true" : undefined}
                  onClick={() => setNyelv(ny)}
                >
                  <span>{t(`poszt.nyelv_${ny}`)}</span>
                  <span className="km-po-munka-allapot">{cellaAllapotSzo(felulet, ny)}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Közép: a szerkesztő */}
          <section className="km-po-szerkeszto">
            <div className="km-po-fejsor">
              <h2 className="km-po-cim">{munka?.cim ?? ""}</h2>
              <span className="km-po-mentes">
                {mentesAllapot === "hiba"
                  ? t("poszt.mentes_hiba")
                  : mentesAllapot === "kesz" && mentveEkkor
                    ? `${t("poszt.mentve")} · ${idoBelyeg(mentveEkkor)}`
                    : ""}
              </span>
            </div>

            {cella?.elavult_forditas && <p className="km-po-figyelmeztetes">{t("poszt.elavult_forditas")}</p>}
            {vegleges && (
              <div className="km-po-vegleges-sav">
                <span>{t("poszt.vegleges_cim")}</span>
                {szerkesztheto && (
                  <button type="button" className="km-po-halvany-gomb" onClick={() => void veglegesitestVisszavon()}>
                    {t("poszt.megis_szerkesztem")}
                  </button>
                )}
              </div>
            )}

            {eredetNezet ? (
              <div className="km-po-mezo km-po-szovegmezo">
                <div className="km-po-eredet" aria-label={t("poszt.eredet_cim")}>
                  {eredetDarabok(cella?.javaslat ?? "", szoveg).map((d, i) => (
                    <span key={`${i}-${d.sajat ? "e" : "a"}`} className={d.sajat ? "km-po-eredet-ember" : "km-po-eredet-ai"}>
                      {d.szoveg}
                    </span>
                  ))}
                </div>
                <div className="km-po-jelmagyarazat">
                  <span className="km-po-eredet-ai">{t("poszt.eredet_ai")}</span>
                  <span className="km-po-eredet-ember">{t("poszt.eredet_ember")}</span>
                  <span className="km-po-halvany">
                    {t("poszt.eredet_arany", { szazalek: sajatArany(eredetDarabok(cella?.javaslat ?? "", szoveg)) })}
                  </span>
                </div>
              </div>
            ) : (
              <label className="km-po-mezo km-po-szovegmezo" data-dolgozik={fut ? "true" : "false"}>
                <span className="km-po-rejtett">{t("poszt.szoveg")}</span>
                {/* J-1 (Csilla): átírás közben a szövegnél is látszódjon, hogy a gép dolgozik — ugyanaz a jelzés, mint íráskor */}
                {fut && (
                  <span className="km-po-dolgozik" aria-live="polite">
                    <span className="km-po-porgo" aria-hidden="true" />
                    {t("poszt.ai_dolgozik")}
                  </span>
                )}
                <textarea
                  value={szoveg}
                  readOnly={!szerkesztheto || vegleges}
                  onChange={(e) => setSzoveg(e.target.value)}
                  rows={14}
                />
              </label>
            )}

            <div className="km-po-labsor">
              <span className="km-po-karakter">{t("poszt.karakter_db", { db: szoveg.length })}</span>
              {szoveg.length > LATHATO_HATAR[felulet] && szoveg.length <= KARAKTERHATAR[felulet] && (
                <span className="km-po-halvany">{t("poszt.lathato_hatar", { db: LATHATO_HATAR[felulet] })}</span>
              )}
              {szoveg.length > KARAKTERHATAR[felulet] && (
                <span className="km-po-hiba">{t("poszt.tul_hosszu", { max: KARAKTERHATAR[felulet] })}</span>
              )}
              {szoveg.trim().length > 0 && (cella?.javaslat ?? "").trim().length > 0 && (
                <button type="button" className="km-po-halvany-gomb" onClick={() => setEredetNezet((v) => !v)}>
                  {eredetNezet ? t("poszt.eredet_vissza") : t("poszt.eredet_gomb")}
                </button>
              )}
              {elozoek.length > 0 && szerkesztheto && !vegleges && (
                <button type="button" className="km-po-halvany-gomb" onClick={visszavon}>
                  {t("poszt.visszavonas")}
                </button>
              )}
              {mentesAllapot === "hiba" && (
                <button type="button" className="km-po-halvany-gomb" onClick={() => void ment()}>
                  {t("poszt.mentes_ujra")}
                </button>
              )}
            </div>

            {szerkesztheto && !vegleges && (
              <div className="km-po-muveletek">
                {szoveg.trim().length === 0 ? (
                  <button type="button" className="km-po-fogomb" onClick={() => void muvelet("szoveg", {})} disabled={fut !== null}>
                    {fut ? t("poszt.ai_dolgozik") : t("poszt.keszits")}
                  </button>
                ) : (
                  <>
                    <button type="button" className="km-po-muvelet" onClick={() => void muvelet("atiras", { muvelet: "rovidebb" })} disabled={fut !== null}>
                      {t("poszt.rovidebb")}
                    </button>
                    <button type="button" className="km-po-muvelet" onClick={() => void muvelet("atiras", { muvelet: "hosszabb" })} disabled={fut !== null}>
                      {t("poszt.hosszabb")}
                    </button>
                    <button type="button" className="km-po-muvelet" onClick={() => void muvelet("atiras", { muvelet: "kozvetlenebb" })} disabled={fut !== null}>
                      {t("poszt.kozvetlenebb")}
                    </button>
                    <button type="button" className="km-po-muvelet" onClick={() => void muvelet("atiras", { muvelet: "targyilagosabb" })} disabled={fut !== null}>
                      {t("poszt.targyilagosabb")}
                    </button>
                    <button type="button" className="km-po-muvelet" onClick={() => void muvelet("atiras", { muvelet: "hashtag" })} disabled={fut !== null}>
                      {t("poszt.hashtag")}
                    </button>
                    <button type="button" className="km-po-muvelet" onClick={() => void muvelet("szoveg", {})} disabled={fut !== null}>
                      {t("poszt.ujra_javaslat")}
                    </button>
                  </>
                )}
              </div>
            )}

            {szerkesztheto && !vegleges && szoveg.trim().length > 0 && (
              <div className="km-po-gombsor">
                <button type="button" className="km-po-fogomb" onClick={() => void muvelet("veglegesites", {})} disabled={fut !== null}>
                  {t("poszt.veglegesites")}
                </button>
              </div>
            )}
            {fut && <p className="km-po-halvany">{t("poszt.ai_dolgozik")}</p>}
            {hibaUzenet && <p className="km-po-hiba">{hibaUzenet}</p>}
          </section>

          {/* Jobb: az összhangjelzés és a forrás */}
          <aside className="km-po-jobb">
            <div className={jelzesOsztaly}>
              <h3>
                {!osszhang || szoveg.trim().length === 0
                  ? t("osszhang.cim")
                  : osszhang.allapot === "ok"
                    ? t("osszhang.ok")
                    : osszhang.allapot === "ellentmond"
                      ? t("osszhang.ellentmond")
                      : t("osszhang.nem_futott")}
              </h3>
              <p>{jelzesMondat()}</p>
              {osszhang?.allapot === "ellentmond" && (
                <>
                  <button type="button" className="km-po-halvany-gomb" onClick={() => setReszletek(true)}>
                    {t("osszhang.reszletek")}
                  </button>
                  <p className="km-po-halvany">{t("osszhang.nem_zar")}</p>
                </>
              )}
              {osszhang?.allapot === "nem_futott" && osszhang.mondat === "nincs_iranytu" && (
                <Link href="/iranytu" className="km-po-link">
                  {t("osszhang.iranytu_link")}
                </Link>
              )}
              {szerkesztheto && szoveg.trim().length > 0 && (
                <button type="button" className="km-po-halvany-gomb" onClick={() => void muvelet("osszhang", {})} disabled={fut !== null}>
                  {t("osszhang.ujra")}
                </button>
              )}
              {munka?.piros_veglegesites && <p className="km-po-halvany">{t("osszhang.piros_vegleges")}</p>}
            </div>

            {nyelv !== "hu" && szerkesztheto && !vegleges && (
              <div className="km-po-doboz">
                <h3>{t("poszt.nyelv")}</h3>
                <button type="button" className="km-po-halvany-gomb" onClick={() => void muvelet("forditas", {})} disabled={fut !== null}>
                  {t("poszt.forditas")}
                </button>
                {szoveg.trim().length > 0 && (
                  <>
                    <button type="button" className="km-po-halvany-gomb" onClick={() => void muvelet("nyelvre-szabas", {})} disabled={fut !== null}>
                      {t("poszt.nyelvre_szabas")}
                    </button>
                    <p className="km-po-halvany">{t("poszt.nyelvre_szabas_mit")}</p>
                  </>
                )}
                {cella?.nyelvre_szabva && <p className="km-po-halvany">{t("poszt.nyelvre_szabva")}</p>}
              </div>
            )}

            {munka && (
              <div className="km-po-doboz">
                <h3>{t("poszt.forras")}</h3>
                <p className="km-po-halvany">{t(`poszt.forras_${munka.forras.tipus}`)}</p>
                {munka.forras.cim && <p>{munka.forras.cim}</p>}
                {munka.forras.url && (
                  <a className="km-po-link" href={munka.forras.url} target="_blank" rel="noreferrer noopener">
                    {munka.forras.url}
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {reszletek && osszhang?.allapot === "ellentmond" && (
        <div className="km-po-fedo" role="dialog" aria-modal="true">
          <div className="km-po-parbeszed">
            <h3>{t("osszhang.ellentmond")}</h3>
            <p>{jelzesMondat()}</p>
            {osszhang.pont_szoveg && (
              <p>
                <strong>{t("osszhang.melyik_pont")}:</strong> {osszhang.pont_szoveg}
              </p>
            )}
            {osszhang.szovegresz && (
              <p>
                <strong>{t("osszhang.melyik_resz")}:</strong> {osszhang.szovegresz}
              </p>
            )}
            {osszhang.teendok.length > 0 && (
              <>
                <p>
                  <strong>{t("osszhang.mit_tehetsz")}:</strong>
                </p>
                <ul>
                  {osszhang.teendok.map((te) => (
                    <li key={te}>{te}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="km-po-halvany">{t("osszhang.nem_zar")}</p>
            <div className="km-po-uj-gombok">
              <Link href="/iranytu" className="km-po-link">
                {t("osszhang.iranytu_link")}
              </Link>
              <button type="button" className="km-po-halvany-gomb" onClick={() => setReszletek(false)}>
                {t("osszhang.bezar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
}
