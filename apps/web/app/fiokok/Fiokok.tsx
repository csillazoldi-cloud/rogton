"use client";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import { apiHivas, hibaKod, hibaSzoveg } from "../_kozos/hibaszoveg";
import type { FiokSor, FiokokNezet, MunkaterSor } from "../../fiokok/tipusok";

// E-50: a Fiókok lap képernyője — a rajz szerint (design/e50/Fiokok.dc.html).
// Két fül egy lapon: Fiókok és Munkaterek. Ugyanaz a keresés, rendezés és részletpanel szolgálja ki
// mindkettőt, ezért nem két lap. A műveletek megerősítést kérnek, és a megerősítés KIMONDJA,
// mi történik utána — nem „biztos vagy benne?", hanem a következmény.

type Ful = "fiokok" | "munkaterek";
type Eredetszuro = "mind" | "ember" | "gepi_teszt";
type Rendezes = "letrehozva" | "belepes";
type Muvelet = "felfuggeszt" | "visszavon" | "jelolest_ad" | "jelolest_elvesz" | "torol";
type Kivalasztott = { fajta: "fiok"; id: string } | { fajta: "munkater"; id: string } | null;

function nyelvKod(nyelv: string): string {
  return nyelv === "ro" ? "ro-RO" : nyelv === "en" ? "en-GB" : "hu-HU";
}

function datum(iso: string | null, nyelv: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(nyelvKod(nyelv), { year: "numeric", month: "short", day: "numeric" });
}

function penz(usd: number, nyelv: string): string {
  return new Intl.NumberFormat(nyelvKod(nyelv), { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(usd);
}

/** A jelszó-visszaállító link lejáratának óra:perc alakja, a felhasználó nyelvén, bukaresti időben. */
function oraPerc(iso: string, nyelv: string): string {
  return new Intl.DateTimeFormat(nyelvKod(nyelv), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  }).format(new Date(iso));
}

/** A legutóbbi mozdulás: a legkésőbbi ismert időpont, és az, hogy mi volt az. */
function utoljaraMozdult(jeloltek: { mikor: string | null; kulcs: string }[]): { mikor: string; kulcs: string } | null {
  let legkesobb: { mikor: string; kulcs: string } | null = null;
  for (const j of jeloltek) {
    if (!j.mikor) continue;
    if (!legkesobb || j.mikor > legkesobb.mikor) legkesobb = { mikor: j.mikor, kulcs: j.kulcs };
  }
  return legkesobb;
}

export function Fiokok({ kezdo }: { kezdo: FiokokNezet }) {
  const { t, nyelv } = useFeliratok();
  const [adat, setAdat] = useState<FiokokNezet>(kezdo);
  const [ful, setFul] = useState<Ful>("fiokok");
  const [kereses, setKereses] = useState("");
  const [eredet, setEredet] = useState<Eredetszuro>("mind");
  const [rendezes, setRendezes] = useState<Rendezes>("letrehozva");
  const [kivalasztott, setKivalasztott] = useState<Kivalasztott>(null);
  const [kerdes, setKerdes] = useState<{ muvelet: Muvelet; fiok: FiokSor } | null>(null);
  const [torlesMegerosites, setTorlesMegerosites] = useState("");
  const [fut, setFut] = useState(false);
  const [uzenet, setUzenet] = useState<{ fajta: "ok" | "hiba"; szoveg: string } | null>(null);
  const [keretPiszkozat, setKeretPiszkozat] = useState("");

  const sajatId = adat.sajat_fiok_id;
  const gazdakSzama = adat.fiokok.filter((f) => f.rendszergazda).length;

  const szurtFiokok = useMemo(() => {
    const k = kereses.trim().toLowerCase();
    const lista = adat.fiokok.filter((f) => {
      if (eredet !== "mind" && f.eredet !== eredet) return false;
      if (!k) return true;
      return f.email.toLowerCase().includes(k) || f.nev.toLowerCase().includes(k);
    });
    return [...lista].sort((a, b) =>
      rendezes === "belepes"
        ? (b.utolso_belepes ?? "").localeCompare(a.utolso_belepes ?? "")
        : b.letrehozva.localeCompare(a.letrehozva),
    );
  }, [adat.fiokok, kereses, eredet, rendezes]);

  const szurtMunkaterek = useMemo(() => {
    const k = kereses.trim().toLowerCase();
    const lista = adat.munkaterek.filter((m) =>
      !k || m.nev.toLowerCase().includes(k) || (m.tulajdonos_email ?? "").toLowerCase().includes(k));
    return [...lista].sort((a, b) => b.letrehozva.localeCompare(a.letrehozva));
  }, [adat.munkaterek, kereses, rendezes]);

  const valasztottFiok = kivalasztott?.fajta === "fiok" ? adat.fiokok.find((f) => f.id === kivalasztott.id) ?? null : null;
  const valasztottMunkater = kivalasztott?.fajta === "munkater" ? adat.munkaterek.find((m) => m.id === kivalasztott.id) ?? null : null;

  function fulValt(uj: Ful) {
    setFul(uj);
    setKivalasztott(null);
    setKerdes(null);
  }

  function munkaterNyit(m: MunkaterSor) {
    setKivalasztott({ fajta: "munkater", id: m.id });
    setKerdes(null);
    setKeretPiszkozat(m.sajat_keret ? String(m.keret_usd) : "");
  }

  async function muveletVegrehajt() {
    if (!kerdes) return;
    setFut(true);
    setUzenet(null);
    const v = await apiHivas("/api/fiokok", {
      fiok_id: kerdes.fiok.id,
      muvelet: kerdes.muvelet,
      ...(kerdes.muvelet === "torol" ? { megerosites: torlesMegerosites } : {}),
    });
    setFut(false);
    if (v.statusz !== 200) {
      setUzenet({ fajta: "hiba", szoveg: hibaSzoveg(t, hibaKod(v.torzs)) });
      setKerdes(null);
      return;
    }
    const uj = v.torzs["fiokok"] as FiokokNezet | undefined;
    if (uj) setAdat(uj);
    const kulcs =
      kerdes.muvelet === "felfuggeszt" ? "fiokok.doneSuspend"
      : kerdes.muvelet === "visszavon" ? "fiokok.doneUnsuspend"
      : kerdes.muvelet === "jelolest_ad" ? "fiokok.doneAdmin"
      : kerdes.muvelet === "jelolest_elvesz" ? "fiokok.doneDropAdmin"
      : "fiokok.doneDelete";
    setUzenet({ fajta: "ok", szoveg: t(kulcs) });
    if (kerdes.muvelet === "torol") setKivalasztott(null);
    setTorlesMegerosites("");
    setKerdes(null);
  }

  async function keretMent(m: MunkaterSor) {
    const nyers = keretPiszkozat.trim();
    const ertek = nyers === "" ? null : Number(nyers.replace(",", "."));
    if (ertek !== null && (!Number.isFinite(ertek) || ertek < 0)) {
      setUzenet({ fajta: "hiba", szoveg: hibaSzoveg(t, "ERVENYTELEN_ADAT") });
      return;
    }
    setFut(true);
    setUzenet(null);
    // Ugyanaz a végpont, mint a Költség lapon — nem másolt funkció, ugyanaz az érték.
    const v = await fetch("/api/koltseg/keret", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keretek: [{ szervezet_id: m.id, keret_usd: ertek }] }),
    }).catch(() => null);
    if (!v || !v.ok) {
      setFut(false);
      setUzenet({ fajta: "hiba", szoveg: hibaSzoveg(t, undefined) });
      return;
    }
    // A Költség-végpont a költséglap nézetét adja vissza; a saját listánkat újratöltjük.
    const friss = await fetch("/api/fiokok", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null);
    setFut(false);
    if (friss?.fiokok) setAdat(friss.fiokok as FiokokNezet);
    setUzenet({ fajta: "ok", szoveg: t("fiokok.quotaSaved", { v: ertek === null ? t("fiokok.quotaDefault") : penz(ertek, nyelv) }) });
  }

  const proba = adat.fiokok.filter((f) => f.eredet === "gepi_teszt").length;

  return (
    <div className="km-fk">
      <div className="km-fk-fejlec">
        <div className="km-fk-fejlec-bal">
          <span className="km-fk-jelveny-gazda">{t("gazdanav.rendszergazda")}</span>
        </div>
        <div className="km-fk-fejlec-jobb">
        </div>
      </div>

      <div className="km-fk-torzs">
        <div className="km-fk-lista">
          <h1 className="km-fk-lapcim">{t("fiokok.title")}</h1>
          <p className="km-fk-lapalcim">{t("fiokok.sub")}</p>

          <div className="km-fk-fulek" role="tablist">
            <button type="button" role="tab" className="km-fk-ful" aria-selected={ful === "fiokok"} onClick={() => fulValt("fiokok")}>
              {t("fiokok.tabAccounts")}
            </button>
            <button type="button" role="tab" className="km-fk-ful" aria-selected={ful === "munkaterek"} onClick={() => fulValt("munkaterek")}>
              {t("fiokok.tabSpaces")}
            </button>
          </div>

          <div className="km-fk-szurok">
            <input
              className="km-fk-kereso"
              value={kereses}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setKereses(e.target.value)}
              placeholder={t("fiokok.searchPh")}
              aria-label={t("fiokok.searchLabel")}
            />
            {ful === "fiokok" ? (
              <div className="km-fk-eredetek">
                {([["mind", "fiokok.origAll"], ["ember", "fiokok.origReal"], ["gepi_teszt", "fiokok.origTest"]] as const).map(([e, k]) => (
                  <button key={e} type="button" className="km-fk-eredet" aria-pressed={eredet === e} onClick={() => setEredet(e)}>
                    {t(k)}
                  </button>
                ))}
              </div>
            ) : null}
            {ful === "fiokok" ? (
              <select
                className="km-fk-valaszto"
                value={rendezes}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setRendezes(e.target.value as Rendezes)}
                aria-label={t("fiokok.sortLabel")}
              >
                <option value="letrehozva">{t("fiokok.sortCreated")}</option>
                <option value="belepes">{t("fiokok.sortSeen")}</option>
              </select>
            ) : null}
          </div>

          <div className="km-fk-szamlalo">
            {ful === "fiokok"
              ? t("fiokok.countTpl", { shown: szurtFiokok.length, total: adat.fiokok.length, test: proba })
              : t("fiokok.countSpaces", { n: szurtMunkaterek.length })}
          </div>

          {uzenet ? (
            <div className="km-fk-uzenet" data-fajta={uzenet.fajta} aria-live="polite">{uzenet.szoveg}</div>
          ) : null}

          {ful === "fiokok" ? (
            <>
              <div className="km-fk-megj">
                <div className="km-fk-megj-cim">{t("fiokok.testNoteTitle")}</div>
                <div className="km-fk-megj-szoveg">{t("fiokok.testNoteBody")}</div>
              </div>

              <div className="km-fk-tabla" data-fajta="fiokok">
                <div className="km-fk-fej">
                  <div>{t("fiokok.colWho")}</div><div>{t("fiokok.colCreated")}</div><div>{t("fiokok.colSeen")}</div>
                  <div>{t("fiokok.colSessions")}</div><div>{t("fiokok.colLang")}</div><div>{t("fiokok.colSpaces")}</div>
                  <div>{t("fiokok.colState")}</div>
                </div>
                {szurtFiokok.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="km-fk-sor"
                    aria-current={kivalasztott?.fajta === "fiok" && kivalasztott.id === f.id}
                    onClick={() => { setKivalasztott({ fajta: "fiok", id: f.id }); setKerdes(null); }}
                  >
                    <span className="km-fk-cella">
                      <span className="km-fk-cella-fo" data-kod="1">{f.email}</span>
                      <span className="km-fk-cella-alsor">
                        {f.nev}
                        {f.eredet === "gepi_teszt" ? <span className="km-fk-jelveny-proba">{t("fiokok.testRowTag")}</span> : null}
                      </span>
                    </span>
                    <span className="km-fk-cella" data-cimke={t("fiokok.colCreated")}>{datum(f.letrehozva, nyelv)}</span>
                    <span className={`km-fk-cella${f.utolso_belepes ? "" : " km-fk-halvany"}`} data-cimke={t("fiokok.colSeen")}>
                      {datum(f.utolso_belepes, nyelv) ?? t("fiokok.never")}
                    </span>
                    <span className="km-fk-cella" data-cimke={t("fiokok.colSessions")}>{f.elo_munkamenet}</span>
                    <span className={`km-fk-cella${f.nyelv ? "" : " km-fk-halvany"}`} data-cimke={t("fiokok.colLang")}>
                      {f.nyelv ? f.nyelv.toUpperCase() : t("fiokok.noLang")}
                    </span>
                    <span className="km-fk-cella" data-cimke={t("fiokok.colSpaces")}>
                      {f.munkaterek.length === 0
                        ? <span className="km-fk-halvany">—</span>
                        : f.munkaterek.map((m) => `${m.nev} (${t(`fiokok.role${m.szerep === "tulajdonos" ? "Owner" : m.szerep === "szerkeszto" ? "Editor" : "Viewer"}`)})`).join(" · ")}
                    </span>
                    <span className="km-fk-cella km-fk-jelvenyek" data-cimke={t("fiokok.colState")}>
                      <span className="km-fk-allapot" data-allapot={f.felfuggesztve ? "felfuggesztve" : "aktiv"}>
                        {f.felfuggesztve ? t("fiokok.stSuspended") : t("fiokok.stActive")}
                      </span>
                      {f.rendszergazda ? <span className="km-fk-jelveny-kicsi">{t("fiokok.stAdmin")}</span> : null}
                    </span>
                  </button>
                ))}
                {szurtFiokok.length === 0 ? <div className="km-fk-ures">{t("fiokok.empty")}</div> : null}
              </div>
            </>
          ) : (
            <div className="km-fk-tabla" data-fajta="munkaterek">
              <div className="km-fk-fej">
                <div>{t("fiokok.colSpace")}</div><div>{t("fiokok.colCreated")}</div><div>{t("fiokok.colOwner")}</div>
                <div>{t("fiokok.colMonitor")}</div><div>{t("fiokok.colSources")}</div><div>{t("fiokok.colCalls")}</div>
                <div>{t("fiokok.colCost")}</div><div>{t("fiokok.colQuota")}</div>
              </div>
              {szurtMunkaterek.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="km-fk-sor"
                  aria-current={kivalasztott?.fajta === "munkater" && kivalasztott.id === m.id}
                  onClick={() => munkaterNyit(m)}
                >
                  <span className="km-fk-cella">
                    <span className="km-fk-cella-fo">{m.nev}</span>
                    <span className={`km-fk-cella-alsor${m.profil_jovahagyva ? "" : " km-fk-halvany"}`}>
                      {m.profil_jovahagyva ? t("fiokok.profileOk") : t("fiokok.profileNone")}
                    </span>
                  </span>
                  <span className="km-fk-cella" data-cimke={t("fiokok.colCreated")}>{datum(m.letrehozva, nyelv)}</span>
                  <span className="km-fk-cella" data-cimke={t("fiokok.colOwner")}>
                    {m.tulajdonos_email ?? <span className="km-fk-halvany">—</span>}
                  </span>
                  <span className={`km-fk-cella${m.hirfigyelo ? "" : " km-fk-halvany"}`} data-cimke={t("fiokok.colMonitor")}>
                    {m.hirfigyelo ? t("fiokok.monitorOn") : t("fiokok.monitorOff")}
                  </span>
                  <span className="km-fk-cella" data-cimke={t("fiokok.colSources")}>{m.forrasok}</span>
                  <span className="km-fk-cella" data-cimke={t("fiokok.colCalls")}>{m.hivasok}</span>
                  <span className="km-fk-cella" data-cimke={t("fiokok.colCost")}>{penz(m.usd, nyelv)}</span>
                  <span className={`km-fk-cella${m.sajat_keret ? "" : " km-fk-halvany"}`} data-cimke={t("fiokok.colQuota")}>
                    {m.sajat_keret ? penz(m.keret_usd, nyelv) : t("fiokok.quotaDefault")}
                  </span>
                </button>
              ))}
              {szurtMunkaterek.length === 0 ? <div className="km-fk-ures">{t("fiokok.empty")}</div> : null}
            </div>
          )}

          <div className="km-fk-nemtud">
            <div className="km-fk-nemtud-cim">{t("fiokok.notMade")}</div>
            <div className="km-fk-nemtud-szoveg">{t("fiokok.notMadeBody")}</div>
          </div>
        </div>

        {valasztottFiok ? (
          <FiokReszlet
            fiok={valasztottFiok}
            sajatId={sajatId}
            gazdakSzama={gazdakSzama}
            fut={fut}
            onBezar={() => setKivalasztott(null)}
            onKerdez={(muvelet) => setKerdes({ muvelet, fiok: valasztottFiok })}
          />
        ) : null}

        {valasztottMunkater ? (
          <MunkaterReszlet
            munkater={valasztottMunkater}
            alapKeret={adat.alap_keret_usd}
            piszkozat={keretPiszkozat}
            setPiszkozat={setKeretPiszkozat}
            fut={fut}
            onBezar={() => setKivalasztott(null)}
            onMent={() => void keretMent(valasztottMunkater)}
          />
        ) : null}
      </div>

      {kerdes ? (
        <Megerosites
          muvelet={kerdes.muvelet}
          fiok={kerdes.fiok}
          sajat={kerdes.fiok.id === sajatId}
          fut={fut}
          megerosites={torlesMegerosites}
          onMegerosites={setTorlesMegerosites}
          onMegse={() => {
            setTorlesMegerosites("");
            setKerdes(null);
          }}
          onVegrehajt={() => void muveletVegrehajt()}
        />
      ) : null}
    </div>
  );
}

/**
 * Telefonon a részletpanel a lista ALATT nyílik (a rajz szerint), ami egy hosszú listánál a hajtás
 * alá esik: a sorra koppintva látszólag nem történik semmi. Ez a ref gördíti oda, ha kell.
 * Asztali nézetben a panel amúgy is látszik, a "nearest" ott nem mozdít semmit.
 */
function odagordul(el: HTMLElement | null): void {
  if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function Teny({ kulcs, ertek }: { kulcs: string; ertek: string }) {
  return (
    <div className="km-fk-teny">
      <span className="km-fk-teny-kulcs">{kulcs}</span>
      <span className="km-fk-teny-ertek">{ertek}</span>
    </div>
  );
}

function FiokReszlet({
  fiok, sajatId, gazdakSzama, fut, onBezar, onKerdez,
}: {
  fiok: FiokSor;
  sajatId: string;
  gazdakSzama: number;
  fut: boolean;
  onBezar: () => void;
  onKerdez: (muvelet: Muvelet) => void;
}) {
  const { t, nyelv } = useFeliratok();
  const [jegyLink, setJegyLink] = useState<{ link: string; lejar: string } | null>(null);
  const [jegyFut, setJegyFut] = useState(false);
  const [jegyHiba, setJegyHiba] = useState(false);
  const [masolva, setMasolva] = useState(false);
  const sajat = fiok.id === sajatId;

  // Fiók váltásakor a korábbi link nem érvényes a mostani fiókra: nullázódik.
  useEffect(() => {
    setJegyLink(null);
    setJegyHiba(false);
    setMasolva(false);
  }, [fiok.id]);

  async function jegyKer(): Promise<void> {
    setJegyFut(true);
    setJegyHiba(false);
    setJegyLink(null);
    const v = await fetch("/api/fiok/jelszo-jegy", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: fiok.email }),
    }).catch(() => null);
    setJegyFut(false);
    if (!v || !v.ok) {
      setJegyHiba(true);
      return;
    }
    const torzs = (await v.json().catch(() => null)) as { utvonal?: string | null; lejar?: string } | null;
    if (!torzs?.utvonal || !torzs.lejar) {
      setJegyHiba(true);
      return;
    }
    setJegyLink({ link: window.location.origin + torzs.utvonal, lejar: torzs.lejar });
  }

  // Az utolsó rendszergazda nem veheti el a saját jelölését: utána a lapokat senki nem érné el.
  // A gomb ezért le van tiltva, és a lap MEGMONDJA, miért — a zár maga az API-ban van.
  const utolsoGazda = sajat && fiok.rendszergazda && gazdakSzama <= 1;
  // A saját fiók felfüggesztése azonnali és visszavonhatatlan önkizárás lenne: a visszavonáshoz
  // be kellene lépni, ami épp nem megy. A zár az API-ban van, a gomb itt csak kiírja, miért nem megy.
  const mozdult = utoljaraMozdult([
    { mikor: fiok.utolso_belepes, kulcs: "fiokok.lmLogin" },
    { mikor: fiok.letrehozva, kulcs: "fiokok.lmCreated" },
  ]);

  return (
    <aside className="km-fk-reszlet" ref={odagordul} aria-label={t("fiokok.detAccount")}>
      <div className="km-fk-reszlet-fej">
        <div className="km-fk-kicsicim">{t("fiokok.detAccount")}</div>
        <button type="button" className="km-fk-gomb km-fk-gomb-zar" onClick={onBezar}>{t("fiokok.close")}</button>
      </div>
      <div className="km-fk-reszlet-cim">{fiok.email}</div>
      <div className="km-fk-reszlet-alcim">{fiok.nev}</div>

      <div className="km-fk-kicsicim">{t("fiokok.detContains")}</div>
      <div className="km-fk-tenyek">
        <Teny kulcs={t("fiokok.colCreated")} ertek={datum(fiok.letrehozva, nyelv) ?? "—"} />
        <Teny kulcs={t("fiokok.colSeen")} ertek={datum(fiok.utolso_belepes, nyelv) ?? t("fiokok.never")} />
        <Teny kulcs={t("fiokok.colSessions")} ertek={String(fiok.elo_munkamenet)} />
        <Teny kulcs={t("fiokok.colLang")} ertek={fiok.nyelv ? fiok.nyelv.toUpperCase() : t("fiokok.noLang")} />
        <Teny kulcs={t("fiokok.detOrigin")} ertek={fiok.eredet === "gepi_teszt" ? t("fiokok.origTest") : t("fiokok.origReal")} />
        <Teny
          kulcs={t("fiokok.colSpaces")}
          ertek={fiok.munkaterek.length === 0
            ? t("fiokok.detNoSpaces")
            : fiok.munkaterek.map((m) => `${m.nev} (${t(`fiokok.role${m.szerep === "tulajdonos" ? "Owner" : m.szerep === "szerkeszto" ? "Editor" : "Viewer"}`)})`).join(" · ")}
        />
        <Teny
          kulcs={t("fiokok.colState")}
          ertek={fiok.felfuggesztve ? t("fiokok.stSuspended") : t("fiokok.stActive")}
        />
      </div>

      <div className="km-fk-kicsicim">{t("fiokok.detLastMove")}</div>
      <div className="km-fk-mozdult">
        {mozdult ? t("fiokok.lastMoveTpl", { what: t(mozdult.kulcs), when: datum(mozdult.mikor, nyelv) ?? "" }) : "—"}
      </div>

      <div className="km-fk-kicsicim">{t("fiokok.detActions")}</div>
      <div className="km-fk-muveletek">
        <button
          type="button"
          className="km-fk-gomb"
          data-suly={fiok.felfuggesztve ? undefined : "veszely"}
          disabled={fut || (sajat && !fiok.felfuggesztve)}
          onClick={() => onKerdez(fiok.felfuggesztve ? "visszavon" : "felfuggeszt")}
        >
          {fiok.felfuggesztve ? t("fiokok.aUnsuspend") : t("fiokok.aSuspend")}
        </button>
        {sajat && !fiok.felfuggesztve ? <div className="km-fk-keret-sugo">{t("fiokok.sajatFelfuggesztes")}</div> : null}
        <button
          type="button"
          className="km-fk-gomb"
          disabled={fut || utolsoGazda}
          onClick={() => onKerdez(fiok.rendszergazda ? "jelolest_elvesz" : "jelolest_ad")}
        >
          {fiok.rendszergazda ? t("fiokok.aDropAdmin") : t("fiokok.aMakeAdmin")}
        </button>
        {utolsoGazda ? <div className="km-fk-keret-sugo">{t("fiokok.utolsoGazda")}</div> : null}
        <button
          type="button"
          className="km-fk-gomb"
          data-suly="veszely"
          disabled={fut || sajat}
          onClick={() => onKerdez("torol")}
        >
          {t("fiokok.aDelete")}
        </button>
        {sajat ? <div className="km-fk-keret-sugo">{t("fiokok.sajatTorles")}</div> : null}
        <button
          type="button"
          className="km-fk-gomb"
          disabled={fut || jegyFut}
          onClick={() => void jegyKer()}
        >
          {jegyFut ? t("fiokok.aResetWorking") : t("fiokok.aReset")}
        </button>
        {jegyLink ? (
          <div className="km-fk-jegy">
            <div className="km-fk-kicsicim">{t("fiokok.resetLinkTitle")}</div>
            <input
              className="km-fk-jegy-mezo"
              readOnly
              value={jegyLink.link}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="km-fk-jegy-sor">
              <button
                type="button"
                className="km-fk-gomb"
                onClick={() => {
                  void navigator.clipboard.writeText(jegyLink.link);
                  setMasolva(true);
                  setTimeout(() => setMasolva(false), 2000);
                }}
              >
                {masolva ? t("fiokok.copied") : t("fiokok.copy")}
              </button>
              <span className="km-fk-keret-sugo">
                {t("fiokok.resetLinkValid", { ido: oraPerc(jegyLink.lejar, nyelv) })}
              </span>
            </div>
            <div className="km-fk-keret-sugo">{t("fiokok.resetLinkHow")}</div>
          </div>
        ) : null}
        {jegyHiba ? <div className="km-fk-keret-sugo">{t("fiokok.resetLinkError")}</div> : null}
      </div>
    </aside>
  );
}

function MunkaterReszlet({
  munkater, alapKeret, piszkozat, setPiszkozat, fut, onBezar, onMent,
}: {
  munkater: MunkaterSor;
  alapKeret: number;
  piszkozat: string;
  setPiszkozat: (ertek: string) => void;
  fut: boolean;
  onBezar: () => void;
  onMent: () => void;
}) {
  const { t, nyelv } = useFeliratok();
  const mozdult = utoljaraMozdult([
    { mikor: munkater.utolso_futas, kulcs: "fiokok.lmRun" },
    { mikor: munkater.profil_jovahagyva, kulcs: "fiokok.lmProfile" },
    { mikor: munkater.letrehozva, kulcs: "fiokok.lmSpaceCreated" },
  ]);

  return (
    <aside className="km-fk-reszlet" ref={odagordul} aria-label={t("fiokok.detSpace")}>
      <div className="km-fk-reszlet-fej">
        <div className="km-fk-kicsicim">{t("fiokok.detSpace")}</div>
        <button type="button" className="km-fk-gomb km-fk-gomb-zar" onClick={onBezar}>{t("fiokok.close")}</button>
      </div>
      <div className="km-fk-reszlet-cim">{munkater.nev}</div>
      <div className="km-fk-reszlet-alcim">{munkater.tulajdonos_email ?? "—"}</div>

      <div className="km-fk-kicsicim">{t("fiokok.detContains")}</div>
      <div className="km-fk-tenyek">
        <Teny kulcs={t("fiokok.colCreated")} ertek={datum(munkater.letrehozva, nyelv) ?? "—"} />
        <Teny kulcs={t("fiokok.colProfile")} ertek={munkater.profil_jovahagyva ? t("fiokok.profileOk") : t("fiokok.profileNone")} />
        <Teny kulcs={t("fiokok.colMonitor")} ertek={munkater.hirfigyelo ? t("fiokok.monitorOn") : t("fiokok.monitorOff")} />
        <Teny kulcs={t("fiokok.colSources")} ertek={String(munkater.forrasok)} />
        <Teny kulcs={t("fiokok.colCalls")} ertek={String(munkater.hivasok)} />
        <Teny kulcs={t("fiokok.colCost")} ertek={penz(munkater.usd, nyelv)} />
        <Teny kulcs={t("fiokok.colQuota")} ertek={munkater.sajat_keret ? penz(munkater.keret_usd, nyelv) : `${t("fiokok.quotaDefault")} (${penz(alapKeret, nyelv)})`} />
      </div>

      <div className="km-fk-kicsicim">{t("fiokok.detLastMove")}</div>
      <div className="km-fk-mozdult">
        {mozdult ? t("fiokok.lastMoveTpl", { what: t(mozdult.kulcs), when: datum(mozdult.mikor, nyelv) ?? "" }) : "—"}
      </div>

      <div className="km-fk-kicsicim">{t("fiokok.detActions")}</div>
      <label className="km-fk-keret-cimke" htmlFor="km-fk-keret">{t("fiokok.quotaLabel")}</label>
      <div className="km-fk-keret-sor">
        <input
          id="km-fk-keret"
          className="km-fk-keret-mezo"
          value={piszkozat}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPiszkozat(e.target.value)}
          placeholder={t("fiokok.quotaDefault")}
          inputMode="decimal"
        />
        <button type="button" className="km-fk-gomb" data-suly="elso" disabled={fut} onClick={onMent}>
          {t("fiokok.quotaSave")}
        </button>
      </div>
      <div className="km-fk-keret-sugo">{t("fiokok.quotaHint")}</div>
    </aside>
  );
}

function Megerosites({
  muvelet, fiok, sajat, fut, megerosites, onMegerosites, onMegse, onVegrehajt,
}: {
  muvelet: Muvelet;
  fiok: FiokSor;
  sajat: boolean;
  fut: boolean;
  megerosites: string;
  onMegerosites: (ertek: string) => void;
  onMegse: () => void;
  onVegrehajt: () => void;
}) {
  const { t } = useFeliratok();
  const kerdesKulcs =
    muvelet === "felfuggeszt" ? "fiokok.cfSuspend"
    : muvelet === "visszavon" ? "fiokok.cfUnsuspend"
    : muvelet === "jelolest_ad" ? "fiokok.cfMakeAdmin"
    : muvelet === "jelolest_elvesz" ? "fiokok.cfDropAdmin"
    : "fiokok.cfDelete";
  const mi =
    muvelet === "felfuggeszt" ? "fiokok.cfSuspendWhat"
    : muvelet === "visszavon" ? "fiokok.cfUnsuspendWhat"
    : muvelet === "jelolest_ad" ? "fiokok.cfMakeAdminWhat"
    : muvelet === "jelolest_elvesz" ? "fiokok.cfDropAdminWhat"
    : "fiokok.cfDeleteWhat";
  const veszely = muvelet === "felfuggeszt" || muvelet === "torol";
  const torles = muvelet === "torol";
  const megerositve = megerosites.trim().toLowerCase() === fiok.email.trim().toLowerCase();

  return (
    <div className="km-fk-megerosites">
      <div className="km-fk-parbeszed" role="dialog" aria-label={t("fiokok.cfTitle")} aria-modal="false">
        <div className="km-fk-kicsicim">{t("fiokok.cfTitle")}</div>
        <div className="km-fk-parbeszed-kerdes">{t(kerdesKulcs)}</div>
        <div className="km-fk-parbeszed-mi">{fiok.email} — {t(mi)}</div>
        {sajat && muvelet === "jelolest_elvesz" ? (
          <div className="km-fk-parbeszed-figyelem">{t("fiokok.cfSelfWarn")}</div>
        ) : null}
        {torles ? (
          <>
            <div className="km-fk-parbeszed-figyelem">{t("fiokok.cfDeleteWarn")}</div>
            <label className="km-fk-parbeszed-mezo">
              <span>{t("fiokok.cfDeleteAsk")}</span>
              <input
                type="email"
                autoComplete="off"
                value={megerosites}
                onChange={(e) => onMegerosites(e.target.value)}
                placeholder={fiok.email}
              />
            </label>
          </>
        ) : null}
        <div className="km-fk-parbeszed-gombok">
          <button type="button" className="km-fk-gomb" data-suly={veszely ? "veszely" : "elso"} disabled={fut || (torles && !megerositve)} onClick={onVegrehajt}>
            {fut ? t("fiokok.folyik") : t("fiokok.cfConfirm")}
          </button>
          <button type="button" className="km-fk-gomb" disabled={fut} onClick={onMegse}>{t("fiokok.cfCancel")}</button>
        </div>
      </div>
    </div>
  );
}
