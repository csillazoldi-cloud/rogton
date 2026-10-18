"use client";
// R-15 utókérés 2 (gepezet-3 1–2): a „Friss hírek minden reggel · Bekapcsolom” sor, mellette a „Mi ez?” — helyben nyíló mondat
// (r15.kozos.napi_hirek_reszlet) és egy link a Mit figyeljünk lapra (r15.kozos.mit_figyelunk → /hirfigyelo/beallitas).
// A sor és a gomb művelete változatlan (PUT /api/r15/napi-figyeles, a hívó adja); a „Mi ez?” csak szöveg, nem navigál.
// Rajz: design/R15/rajz/R15-lapok-2.dc.html — 03c2 (asztal: a jobb oldali lista első sora, telefon: a minta alatt) és a 04a „Miért nincs
// ma hír?” mögötti sor; a lenyitott állapot a 04a alatti „MI EZ?” panel.
import { useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import { HalkGomb, HalkLink, Reszletek } from "./R15";

export const MIT_FIGYELJUNK_CIM = "/hirfigyelo/beallitas";

export function NapiHirekSor({ onBekapcsol, folyik, osztaly }: { onBekapcsol: () => void; folyik: boolean; osztaly?: string }) {
  const { t } = useFeliratok();
  const [nyitva, setNyitva] = useState(false);
  return (
    <div className={osztaly ? `r15-napi ${osztaly}` : "r15-napi"}>
      <div className="r15-napi-sor">
        <span className="r15-napi-cimke">
          <span>{t("r15.kozos.napi_hirek_sor")}</span>
          <HalkLink onClick={() => setNyitva((x) => !x)} aria-expanded={nyitva}>{t("r15.kozos.mi_ez")}</HalkLink>
        </span>
        <HalkGomb onClick={onBekapcsol} disabled={folyik} aria-busy={folyik}>{t("r15.kezdolap.bekapcsolom")}</HalkGomb>
      </div>
      {nyitva ? (
        <Reszletek>
          <div className="r15-napi-reszlet">
            <p>{t("r15.kozos.napi_hirek_reszlet")}</p>
            <HalkLink href={MIT_FIGYELJUNK_CIM}>{t("r15.kozos.mit_figyelunk")}</HalkLink>
          </div>
        </Reszletek>
      ) : null}
    </div>
  );
}
