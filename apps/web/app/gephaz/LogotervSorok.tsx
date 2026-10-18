"use client";
// R-17 B4 (design/R17-visszajelzes/rajz 17-admin; gepezet B4; Csilla 10-06): a Beállítások „Rendszer” csoportjában, csak rendszergazdának.
//  - „Logótervezés ára”: szám + EUR + Mentés (üresen hagyva a Névlogó lap gombja eltűnik);
//  - „Logókérések címzettje”: e-mail + Mentés — ide megy levél minden új kérésről, HA a levelezés be van állítva (SMTP a NAS .env-ben);
//    üresen vagy levelezés nélkül nincs levél és nincs hiba: a kérések a listában vannak (a lista a hiteles forrás);
//  - „Logókérések” → /gephaz/logoterv (a lista).
// Végpont: PUT /api/admin/logoterv { ar } / { cimzett } (rendszergazda). A rajzon nincs a címzett- és a lista-sor (kerdesek 1 válasza
// Csilla 10-06: e-mail választható beállításként, a lista a forrás) — a szomszéd sorok mintájára készült.
import Link from "next/link";
import { useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";

export function LogotervSorok({ kezdo }: { kezdo: { ar: number | null; cimzett: string } }) {
  const { t } = useFeliratok();
  const [ar, setAr] = useState(kezdo.ar === null ? "" : String(kezdo.ar));
  const [cimzett, setCimzett] = useState(kezdo.cimzett);
  const [allapot, setAllapot] = useState<Record<"ar" | "cimzett", "" | "fut" | "mentve" | "hibas">>({ ar: "", cimzett: "" });

  async function ment(mezo: "ar" | "cimzett") {
    setAllapot((a) => ({ ...a, [mezo]: "fut" }));
    try {
      const v = await fetch("/api/admin/logoterv", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(mezo === "ar" ? { ar } : { cimzett }) });
      setAllapot((a) => ({ ...a, [mezo]: v.ok ? "mentve" : "hibas" }));
    } catch {
      setAllapot((a) => ({ ...a, [mezo]: "hibas" }));
    }
  }

  const visszajelzes = (mezo: "ar" | "cimzett") =>
    allapot[mezo] === "mentve" ? <span className="km-gh-lt-jel" role="status">{t("r17.admin.mentve")}</span>
      : allapot[mezo] === "hibas" ? <span className="km-gh-lt-jel" role="alert">{t(mezo === "ar" ? "r17.admin.ar_hibas" : "r17.admin.cimzett_hibas")}</span>
        : null;

  return (
    <>
      <li className="km-gh-sor">
        <div className="km-gh-lt-sor">
          <div className="km-gh-sor-tartalom km-gh-lt-szoveg">
            <span className="km-gh-sor-nev">{t("r17.admin.logoterv_ar")}</span>
            <span className="km-gh-sor-kov">{t("r17.admin.logoterv_ar_kov")}</span>
            {visszajelzes("ar")}
          </div>
          <div className="km-gh-lt-vezerlo">
            <input className="km-gh-lt-mezo km-gh-lt-szam" inputMode="decimal" value={ar} onChange={(e) => { setAr(e.target.value); setAllapot((a) => ({ ...a, ar: "" })); }} aria-label={t("r17.admin.logoterv_ar")} maxLength={9} />
            <span className="km-gh-lt-egyseg">EUR</span>
            <button type="button" className="km-gh-lt-gomb" onClick={() => void ment("ar")} disabled={allapot.ar === "fut"}>{t("r13.kozos.mentes")}</button>
          </div>
        </div>
      </li>
      <li className="km-gh-sor">
        <div className="km-gh-lt-sor">
          <div className="km-gh-sor-tartalom km-gh-lt-szoveg">
            <span className="km-gh-sor-nev">{t("r17.admin.logoterv_cimzett")}</span>
            <span className="km-gh-sor-kov">{t("r17.admin.logoterv_cimzett_kov")}</span>
            {visszajelzes("cimzett")}
          </div>
          <div className="km-gh-lt-vezerlo">
            <input className="km-gh-lt-mezo" type="email" value={cimzett} onChange={(e) => { setCimzett(e.target.value); setAllapot((a) => ({ ...a, cimzett: "" })); }} aria-label={t("r17.admin.logoterv_cimzett")} maxLength={200} autoComplete="off" />
            <button type="button" className="km-gh-lt-gomb" onClick={() => void ment("cimzett")} disabled={allapot.cimzett === "fut"}>{t("r13.kozos.mentes")}</button>
          </div>
        </div>
      </li>
      <li className="km-gh-sor">
        <Link href="/gephaz/logoterv" className="km-gh-sor-link">
          <span className="km-gh-sor-nev">{t("r17.admin.logoterv_lista")}</span>
          <span className="km-gh-sor-kov">{t("r17.admin.logoterv_lista_kov")}</span>
          <span className="km-gh-sor-nyil" aria-hidden="true">→</span>
        </Link>
      </li>
    </>
  );
}
