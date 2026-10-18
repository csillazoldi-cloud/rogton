"use client";
// R-17 B · a Logókérések lista (rendszergazda). Egy sor = egy beküldött kérdőív: mikor · ki · munkatér · a válaszok · ár (a beküldéskori)
// · az e-mail sorsa (nincs beállítva / elküldve / nem ment el) · állapot (új · folyamatban · kész → PUT /api/admin/logoterv/{id}).
import { useState } from "react";
import { useFeliratok } from "../../../nyelv/kliens";
import type { LogotervSor } from "../../../logoterv/index";
import { arSzoveg } from "../../../logoterv/szabaly";

const ALLAPOTOK = ["uj", "folyamatban", "kesz"] as const;
const allapotKulcs = (a: string) => (a === "folyamatban" ? "r17.logokeres.allapot_folyamatban" : `vj.allapot_${a}`);
const ertesitesKulcs = (e: string) => (e === "kuldes" ? "r17.logokeres.ertesites_kuldes" : `r17.logokeres.ertesites_${e}`);

export function Logokeresek({ kezdo }: { kezdo: LogotervSor[] }) {
  const { t, nyelv } = useFeliratok();
  const [sorok, setSorok] = useState(kezdo);
  const ido = new Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Budapest" });

  async function allapotValt(id: string, allapot: string) {
    const v = await fetch(`/api/admin/logoterv/${id}`, { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ allapot }) }).catch(() => null);
    if (v?.ok) setSorok((l) => l.map((s) => (s.id === id ? { ...s, allapot: allapot as LogotervSor["allapot"] } : s)));
  }

  return (
    <div className="km-gh-tartalom">
      <div className="km-gh-fejlec">
        <h1 className="km-gh-h1">{t("r17.logokeres.cim")}</h1>
        <p className="km-gh-bevezeto">{t("r17.logokeres.alcim")}</p>
      </div>
      {sorok.length === 0 ? <p className="km-gh-bevezeto">{t("r17.logokeres.ures")}</p> : (
        <div className="km-gh-lk-gorgeto">
          <table className="km-gh-lk-tabla">
            <thead>
              <tr>
                <th>{t("vj.oszlop_mikor")}</th>
                <th>{t("r17.logokeres.oszlop_munkater")}</th>
                <th>{t("r17.logokeres.oszlop_valaszok")}</th>
                <th>{t("r17.logokeres.oszlop_ar")}</th>
                <th>{t("r17.logokeres.oszlop_ertesites")}</th>
                <th>{t("vj.oszlop_allapot")}</th>
              </tr>
            </thead>
            <tbody>
              {sorok.map((s) => (
                <tr key={s.id}>
                  <td><span className="km-gh-lk-ido">{ido.format(new Date(s.letrehozva))}</span><span className="km-gh-lk-halk">{s.fiok_nev}</span></td>
                  <td>{s.szervezet_nev}</td>
                  <td><div className="km-gh-lk-valaszok">
                    <span><strong>{t("r17.logoterv.nev")}</strong> {s.valaszok.nev}</span>
                    {s.valaszok.mivel ? <span><strong>{t("r17.logoterv.mivel")}</strong> {s.valaszok.mivel}</span> : null}
                    {s.valaszok.hangulat ? <span><strong>{t("r17.logoterv.hangulat")}</strong> {s.valaszok.hangulat}</span> : null}
                    {s.valaszok.szinek ? <span><strong>{t("r17.logoterv.szinek")}</strong> {s.valaszok.szinek}</span> : null}
                    {s.valaszok.hol?.length ? <span><strong>{t("r17.logoterv.hol")}</strong> {s.valaszok.hol.map((h) => t(`r17.logoterv.hol_${h}`)).join(", ")}</span> : null}
                    {s.fajl_db > 0 ? <span className="km-gh-lk-halk">{t("r17.logoterv.minta_db", { n: s.fajl_db })}</span> : null}
                  </div></td>
                  <td>{s.ar_eur === null ? "—" : arSzoveg(s.ar_eur, nyelv)}</td>
                  <td className="km-gh-lk-halk">{t(ertesitesKulcs(s.ertesites))}</td>
                  <td>
                    <select className="km-gh-lk-allapot" value={s.allapot} aria-label={t("vj.oszlop_allapot")} onChange={(e) => void allapotValt(s.id, e.target.value)}>
                      {ALLAPOTOK.map((a) => <option key={a} value={a}>{t(allapotKulcs(a))}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
