"use client";
// VZ-1 · a közlemény-képek szabály-jelzései (rendszergazda). Egy sor = egy jelzés egy letöltött képről: mikor · munkatér · kép (és száma)
// · a szabály neve (vz.szabaly_*) · arculat okozta-e / tiltja-e a letöltést · a képgyártó részlete.
import { useFeliratok } from "../../../nyelv/kliens";
import type { KepJelzesSor } from "../../../vizual/kozlemeny";
import { SABLON_NEV, sablonNeve } from "../../../vizual/kozlemeny-szabaly";

export function KepJelzesek({ sorok }: { sorok: KepJelzesSor[] }) {
  const { t, nyelv } = useFeliratok();
  const ido = new Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" });
  const szabalyNev = (id: string) => {
    const k = `vz.szabaly_${id}`;
    const n = t(k);
    return n === k ? id : `${id} · ${n}`;
  };
  return (
    <div className="km-gh-tartalom">
      <div className="km-gh-fejlec">
        <h1 className="km-gh-h1">{t("vz1r.admin_lista_cim")}</h1>
        <p className="km-gh-bevezeto">{t("vz1r.admin_lista_alcim")}</p>
      </div>
      {sorok.length === 0 ? <p className="km-gh-bevezeto">{t("vz1r.admin_ures")}</p> : (
        <div className="km-gh-lk-gorgeto">
          <table className="km-gh-lk-tabla">
            <thead>
              <tr>
                <th>{t("vz1r.admin_mikor")}</th>
                <th>{t("vz1r.admin_munkater")}</th>
                <th>{t("vz1r.admin_kep")}</th>
                <th>{t("vz1r.admin_szabaly")}</th>
                <th>{t("vz1r.admin_reszlet")}</th>
              </tr>
            </thead>
            <tbody>
              {sorok.map((s) => (
                <tr key={s.id}>
                  <td><span className="km-gh-lk-ido">{ido.format(new Date(s.letrehozva))}</span></td>
                  <td>{s.szervezet_nev}</td>
                  <td>{sablonNeve(s.sablon) ? t(SABLON_NEV[sablonNeve(s.sablon)!].nev) : s.sablon}{s.sorszam !== null ? <span className="km-gh-lk-halk"> · {s.sorszam}</span> : null}</td>
                  <td>
                    <div className="km-gh-lk-valaszok">
                      <span>{szabalyNev(s.szabaly)}</span>
                      <span className="km-gh-lk-halk">{[s.arculati ? t("vz1r.admin_arculat") : "", s.szigorusag === "tiltas" ? t("vz1r.admin_tiltas") : ""].filter(Boolean).join(" · ")}</span>
                    </div>
                  </td>
                  <td><span className="km-gh-lk-halk">{[s.mezo, s.reszlet].filter(Boolean).join(" · ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
