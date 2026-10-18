"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useFeliratok } from "../../nyelv/kliens";
import type { GazdaNezet, GazdaOsszes, GazdaSor, Hol } from "../../koltseg/tipusok";
import type { MunkaterKredit } from "../../kredit/tipusok";
import { kijelzes } from "../../kredit/szabaly";

// A Költség-gazda felület (E-39) — a `Koltseg-gazda.dc.html` rajz szerint.
// A táblázat sorai a `kezdo.sorok` tömbből jönnek, a keret mező szerkeszthető,
// a "Keretek mentése" PUT kérést küld a `/api/koltseg/keret` címre.




/** A hónapnevek a FELÜLET nyelvén jelenjenek meg, ne mindig magyarul. */
function nyelvKod(nyelv: string): string {
  return nyelv === "ro" ? "ro-RO" : nyelv === "en" ? "en-GB" : "hu-HU";
}

type Betoltes = "kesz" | "folyik" | "hiba";
type Uzenet = { ok: boolean; szoveg: string } | null;

const HOL_SZIN: Record<Hol, string> = {
  helyi: "var(--ok)",
  felho: "var(--warn)",
  vegyes: "var(--primary-2)",
  nincs: "var(--text-faint)",
};

const HOL_KULCS: Record<Hol, string> = {
  helyi: "koltseg.helyi",
  felho: "koltseg.felho",
  vegyes: "koltseg.vegyes",
  nincs: "koltseg.nincs_hivas",
};

function holPontSzin(hol: Hol): string {
  return HOL_SZIN[hol];
}

function holFeliratKulcs(hol: Hol): string {
  return HOL_KULCS[hol];
}

function formatIdo(ms: number, t: (kulcs: string, ertekek?: Record<string, string | number>) => string): string {
  if (ms >= 60000) {
    const perc = Math.round(ms / 60000);
    return t("koltseg.perc", { n: perc });
  }
  const mp = Math.round(ms / 1000);
  return t("koltseg.masodperc", { n: mp });
}

function formatPenz(usd: number): string {
  return usd.toFixed(2).replace(".", ",") + " $";
}

function formatDatum(iso: string | null, nyelv: string, t: (kulcs: string, ertekek?: Record<string, string | number>) => string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const most = new Date();
    const tegnap = new Date(most);
    tegnap.setDate(most.getDate() - 1);
    const ido = d.toLocaleTimeString(nyelvKod(nyelv), { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === most.toDateString()) return `${t("koltseg.ma")} ${ido}`;
    if (d.toDateString() === tegnap.toDateString()) return `${t("koltseg.tegnap")} ${ido}`;
    return d.toLocaleDateString(nyelvKod(nyelv), { month: "short", day: "numeric" }) + ` ${ido}`;
  } catch {
    return iso;
  }
}

function formatHonap(iso: string, nyelv: string): string {
  try {
    const ev = Number(iso.slice(0, 4));
    const ho = Number(iso.slice(5, 7));
    const d = new Date(ev, ho - 1, 1);
    return d.toLocaleDateString(nyelvKod(nyelv), { year: "numeric", month: "long" });
  } catch {
    return iso;
  }
}

function honapLista(): string[] {
  const most = new Date();
  const lista: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(most.getFullYear(), most.getMonth() - i, 1);
    lista.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return lista;
}

// R-13 13c (design/R13/rajz/R13-lapok.dc.html, rendszergazdai belső nézet; nem Tibor-lap): két új oszlop a mai táblában — Havi kredit
// (szám-mező munkaterenként, mellette soronként Mentés → PUT /api/kredit/munkater/{szervezet}) és Elhasznált kredit (GET /api/kredit/munkaterek
// — a tagok elhasznált kreditjének összege, kerdesek 6). A kredit mindig a FOLYÓ hónapé (a hónapválasztó a dolláros oszlopokat lapozza).
export function KoltsegGazda({ kezdo, honap, kredit = [] }: { kezdo: GazdaNezet; honap: string; kredit?: MunkaterKredit[] }) {
  const { t, nyelv } = useFeliratok();
  const [kreditek, setKreditek] = useState<MunkaterKredit[]>(kredit);
  const [kreditMezok, setKreditMezok] = useState<Record<string, string>>({});
  const [kreditFut, setKreditFut] = useState<string | null>(null);
  const kreditSzam = (n: number) => kijelzes(Math.round(n * 1000), nyelv === "ro" || nyelv === "en" ? nyelv : "hu"); // a meglévő kijelzési szabály

  async function kreditMent(szervezetId: string) {
    const nyers = (kreditMezok[szervezetId] ?? "").trim();
    const havi = Number(nyers);
    if (!nyers || !Number.isInteger(havi) || havi < 0) { setUzenet({ ok: false, szoveg: t("koltseg.keret_mentes_hiba") }); return; }
    setKreditFut(szervezetId);
    setUzenet(null);
    try {
      const v = await fetch(`/api/kredit/munkater/${encodeURIComponent(szervezetId)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ havi }), credentials: "same-origin",
      });
      if (v.status === 401) { router.push("/belepes"); return; }
      if (v.status !== 200) { setUzenet({ ok: false, szoveg: t("koltseg.keret_mentes_hiba") }); return; }
      setKreditek((k) => k.some((x) => x.szervezet_id === szervezetId)
        ? k.map((x) => (x.szervezet_id === szervezetId ? { ...x, havi } : x))
        : [...k, { szervezet_id: szervezetId, havi, felhasznalt: 0 }]);
      setKreditMezok((m) => { const u = { ...m }; delete u[szervezetId]; return u; });
      setUzenet({ ok: true, szoveg: t("koltseg.keret_mentve") });
    } catch {
      setUzenet({ ok: false, szoveg: t("koltseg.keret_mentes_hiba") });
    } finally {
      setKreditFut(null);
    }
  }
  const router = useRouter();
  const [sorok, setSorok] = useState<GazdaSor[]>(kezdo.sorok);
  const [osszes, setOsszes] = useState<GazdaOsszes>(kezdo.osszes);
  const [keretErtekek, setKeretErtekek] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const s of kezdo.sorok) m[s.szervezet_id] = s.keret_usd.toFixed(2).replace(".", ",");
    return m;
  });
  const [eredetiKeret, setEredetiKeret] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const s of kezdo.sorok) m[s.szervezet_id] = s.keret_usd.toFixed(2).replace(".", ",");
    return m;
  });
  const [aktHonap, setAktHonap] = useState<string>(honap);
  const [betoltes, setBetoltes] = useState<Betoltes>("kesz");
  const [uzenet, setUzenet] = useState<Uzenet>(null);
  const [fut, setFut] = useState(false);


  const valtozott = useMemo(() => {
    const kulcsok = Object.keys(keretErtekek);
    for (const k of kulcsok) {
      const uj = keretErtekek[k];
      const regi = eredetiKeret[k];
      if (uj !== regi) return true;
    }
    return false;
  }, [keretErtekek, eredetiKeret]);

  function keretValtozik(szervezetId: string) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const ertek = e.target.value;
      setKeretErtekek((elozo) => ({ ...elozo, [szervezetId]: ertek }));
      setUzenet(null);
    };
  }

  function megse() {
    setKeretErtekek({ ...eredetiKeret });
    setUzenet(null);
  }

  async function betoltHonap(uj: string) {
    setBetoltes("folyik");
    setUzenet(null);
    try {
      const v = await fetch(`/api/koltseg/osszes?honap=${uj}`, { credentials: "same-origin" });
      if (v.status === 401) { router.push("/belepes"); return; }
      if (v.status !== 200) { setBetoltes("hiba"); return; }
      const torzs = (await v.json()) as { koltseg?: GazdaNezet };
      if (!torzs.koltseg) { setBetoltes("hiba"); return; }
      const ujSorok = torzs.koltseg.sorok;
      const m: Record<string, string> = {};
      for (const s of ujSorok) m[s.szervezet_id] = s.keret_usd.toFixed(2).replace(".", ",");
      setSorok(ujSorok);
      setOsszes(torzs.koltseg.osszes);
      setKeretErtekek(m);
      setEredetiKeret(m);
      setAktHonap(uj);
      setBetoltes("kesz");
    } catch {
      setBetoltes("hiba");
    }
  }

  function honapValt(e: ChangeEvent<HTMLSelectElement>) {
    const uj = e.target.value;
    if (uj !== aktHonap) void betoltHonap(uj);
  }

  async function keretMent() {
    if (betoltes !== "kesz" || fut) return;
    setFut(true);
    const valtozottSorok = sorok.filter((s) => {
      const uj = keretErtekek[s.szervezet_id];
      const regi = eredetiKeret[s.szervezet_id];
      return uj !== regi;
    });
    const keretek = valtozottSorok.map((s) => {
      const szam = parseFloat((keretErtekek[s.szervezet_id] ?? "").replace(",", "."));
      return { szervezet_id: s.szervezet_id, keret_usd: Number.isFinite(szam) ? szam : 0 };
    });
    try {
      const v = await fetch("/api/koltseg/keret", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keretek }),
        credentials: "same-origin",
      });
      if (v.status === 401) { router.push("/belepes"); return; }
      if (v.status !== 200) { setUzenet({ ok: false, szoveg: t("koltseg.keret_mentes_hiba") }); return; }
      const torzs = (await v.json()) as { koltseg?: GazdaNezet };
      if (!torzs.koltseg) { setUzenet({ ok: false, szoveg: t("koltseg.keret_mentes_hiba") }); return; }
      const ujSorok = torzs.koltseg.sorok;
      const m: Record<string, string> = {};
      for (const s of ujSorok) m[s.szervezet_id] = s.keret_usd.toFixed(2).replace(".", ",");
      setSorok(ujSorok);
      setOsszes(torzs.koltseg.osszes);
      setKeretErtekek(m);
      setEredetiKeret(m);
      setUzenet({ ok: true, szoveg: t("koltseg.keret_mentve") });
    } catch {
      setUzenet({ ok: false, szoveg: t("koltseg.keret_mentes_hiba") });
    } finally {
      setFut(false);
    }
  }

  function letoltCSV() {
    const fejlec = [t("koltseg.o_szervezet"), t("koltseg.o_hivas"), t("koltseg.o_gepido"), t("koltseg.o_koltseg"), t("koltseg.o_keret"), t("koltseg.o_kihasznalva"), t("koltseg.o_utolso")];
    const sorokCSV = sorok.map((s) => {
      const kihasznaltsag = s.keret_usd > 0 ? Math.min(100, (s.usd / s.keret_usd) * 100) : 0;
      return [
        s.nev,
        String(s.hivasok),
        formatIdo(s.ido_ms, t),
        formatPenz(s.usd),
        keretErtekek[s.szervezet_id] ?? "0,00",
        kihasznaltsag.toFixed(0) + "%",
        formatDatum(s.utolso, nyelv, t),
      ].join(";");
    });
    const csv = [fejlec.join(";"), ...sorokCSV].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `koltseg-${aktHonap}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const honapok = honapLista();

  return (
    <div className="km-kolt">
      <div className="km-kolt-fejlec">
        <div className="km-kolt-fejlec-bal">
          <div className="km-kolt-jelveny">{t("koltseg.rendszergazda")}</div>
        </div>
        <div className="km-kolt-fejlec-jobb">
          <select className="km-kolt-valaszto" value={aktHonap} onChange={honapValt} aria-label={t("koltseg.honap_valaszto")} disabled={betoltes === "folyik"}>
            {honapok.map((h) => (
              <option key={h} value={h}>{formatHonap(h, nyelv)}</option>
            ))}
          </select>
          <button type="button" className="km-kolt-gomb" onClick={letoltCSV}>{t("koltseg.letoltes")}</button>
        </div>
      </div>

      <div className="km-kolt-tartalom">
        <h1 className="km-kolt-lapcim">{t("koltseg.cim_gazda")}</h1>
        <p className="km-kolt-lapalcim">{t("koltseg.alcim_gazda")}</p>

        {betoltes === "folyik" ? <div className="km-kolt-uzenet" data-fajta="info" aria-live="polite">{t("koltseg.betoltes")}</div> : null}
        {betoltes === "hiba" ? (
          <div className="km-kolt-uzenet" data-fajta="hiba" aria-live="assertive">
            {t("koltseg.betoltes_hiba")}
            <button type="button" className="km-kolt-uzenet-gomb" onClick={() => void betoltHonap(aktHonap)}>{t("koltseg.ujra")}</button>
          </div>
        ) : null}
        {uzenet ? <div className="km-kolt-uzenet" data-fajta={uzenet.ok ? "ok" : "hiba"} aria-live="polite">{uzenet.szoveg}</div> : null}

        <div className="km-kolt-kartyak">
          <div className="km-kolt-kartya">
            <div className="km-kolt-cimke">{t("koltseg.osszes_hivas")}</div>
            <div className="km-kolt-szam">{osszes.hivasok}</div>
            <div className="km-kolt-megj">{t("koltseg.hivas_osszes_megj", { n: sorok.length })}</div>
          </div>
          <div className="km-kolt-kartya">
            <div className="km-kolt-cimke">{t("koltseg.hazon_belul")}</div>
            <div className="km-kolt-szam" style={{ color: "var(--ok)" }}>{osszes.helyi_hivasok}</div>
            <div className="km-kolt-megj">{t("koltseg.hazon_belul_megj")}</div>
          </div>
          <div className="km-kolt-kartya">
            <div className="km-kolt-cimke">{t("koltseg.becsult")}</div>
            <div className="km-kolt-szam">{formatPenz(osszes.usd)}</div>
            <div className="km-kolt-megj">{t("koltseg.becsult_megj")}</div>
          </div>
          <div className="km-kolt-kartya">
            <div className="km-kolt-cimke">{t("koltseg.gepido")}</div>
            <div className="km-kolt-szam">{formatIdo(osszes.ido_ms, t)}</div>
            <div className="km-kolt-megj">{t("koltseg.gepido_megj")}</div>
          </div>
        </div>

        <div className="km-kolt-kartya km-kolt-tabla-kartya">
          <div className="km-kolt-tabla-fej">
            <h2 className="km-kolt-kartyacim">{t("koltseg.szervezetek")}</h2>
            <div className="km-kolt-megj">{t("koltseg.keret_megj")}</div>
          </div>
          <div className="km-kolt-tabla-tartalom">
            <table className="km-kolt-tabla">
              <thead>
                <tr>
                  <th style={{ width: "26%" }}>{t("koltseg.o_szervezet")}</th>
                  <th>{t("koltseg.o_hivas")}</th>
                  <th>{t("koltseg.o_gepido")}</th>
                  <th>{t("koltseg.o_koltseg")}</th>
                  <th>{t("koltseg.o_keret")}</th>
                  <th style={{ width: "20%" }}>{t("koltseg.o_kihasznalva")}</th>
                  <th>{t("koltseg.o_utolso")}</th>
                  <th>{t("r13.gazda.havi_kredit")}</th>
                  <th>{t("r13.gazda.elhasznalt_kredit")}</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {sorok.map((s) => {
                  const kihasznaltsag = s.keret_usd > 0 ? Math.min(100, (s.usd / s.keret_usd) * 100) : 0;
                  const savSzelesseg = kihasznaltsag.toFixed(0) + "%";
                  const savSzin = kihasznaltsag > 80 ? "var(--grad-headline)" : "var(--grad-primary)";
                  return (
                    <tr key={s.szervezet_id}>
                      <td>
                        <div className="km-kolt-szervezet-nev">{s.nev}</div>
                        <div className="km-kolt-megj">
                          <span className="km-kolt-pont" style={{ background: holPontSzin(s.hol) }}></span>
                          {t(holFeliratKulcs(s.hol))}
                        </div>
                      </td>
                      <td className="km-kolt-mono">{s.hivasok}</td>
                      <td className="km-kolt-mono">{formatIdo(s.ido_ms, t)}</td>
                      <td className="km-kolt-mono">{formatPenz(s.usd)}</td>
                      <td>
                        <input
                          className="km-kolt-mezo"
                          value={keretErtekek[s.szervezet_id] ?? "0,00"}
                          onChange={keretValtozik(s.szervezet_id)}
                          aria-label={`${s.nev} keret`}
                          inputMode="decimal"
                        />
                      </td>
                      <td style={{ minWidth: "150px" }}>
                        <div className="km-kolt-sav">
                          <div className="km-kolt-savbelso" style={{ width: savSzelesseg, background: savSzin }}></div>
                        </div>
                        <div className="km-kolt-megj" style={{ marginTop: "5px" }}>{kihasznaltsag.toFixed(0)}%</div>
                      </td>
                      <td className="km-kolt-megj">{formatDatum(s.utolso, nyelv, t)}</td>
                      {(() => {
                        const k = kreditek.find((x) => x.szervezet_id === s.szervezet_id);
                        const mezo = kreditMezok[s.szervezet_id] ?? (k ? String(k.havi) : "");
                        return (
                          <>
                            <td>
                              <input className="km-kolt-mezo" inputMode="numeric" value={mezo} aria-label={`${s.nev} — ${t("r13.gazda.havi_kredit")}`}
                                onChange={(e) => { const v = e.target.value; setKreditMezok((m) => ({ ...m, [s.szervezet_id]: v })); setUzenet(null); }} />
                            </td>
                            <td className="km-kolt-mono">{k ? kreditSzam(k.felhasznalt) : "—"}</td>
                            <td>
                              <button type="button" className="km-kolt-gomb" onClick={() => void kreditMent(s.szervezet_id)}
                                disabled={kreditFut !== null || kreditMezok[s.szervezet_id] === undefined}>{t("r13.kozos.mentes")}</button>
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="km-kolt-megj">{t("r13.gazda.kredit_sugo")}</div>
          <div className="km-kolt-gombok">
            <button type="button" className="km-kolt-gomb km-kolt-gomb-fo" onClick={() => void keretMent()} disabled={!valtozott || betoltes !== "kesz" || fut}>
              {t("koltseg.keret_mentes")}
            </button>
            <button type="button" className="km-kolt-gomb" onClick={megse} disabled={!valtozott || betoltes !== "kesz" || fut}>
              {t("koltseg.megse")}
            </button>
          </div>
        </div>

        <div className="km-kolt-info-kartyak">
          <div className="km-kolt-kartya">
            <h2 className="km-kolt-kartyacim">{t("koltseg.mi_tortenik_cim")}</h2>
            <p className="km-kolt-info-szoveg">{t("koltseg.mi_tortenik_1")}</p>
            <p className="km-kolt-info-szoveg">{t("koltseg.mi_tortenik_2")}</p>
          </div>
          <div className="km-kolt-kartya">
            <h2 className="km-kolt-kartyacim">{t("koltseg.becsles_cim")}</h2>
            <p className="km-kolt-info-szoveg">{t("koltseg.becsles_szoveg")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
