"use client";

import type { CSSProperties, ReactElement } from "react";

export type ElonezetAllapot = "normal" | "hover" | "focus" | "disabled" | "error";

export function ElonezetPanel(p: {
  teljes: Record<string, string>;
  allapot: ElonezetAllapot;
  mobil: boolean;
  t: (kulcs: string) => string;
}): ReactElement {
  const stilus = p.teljes as unknown as CSSProperties;
  const mezoErtek =
    p.allapot === "error"
      ? p.t("tema.field_error")
      : p.allapot === "focus"
        ? p.t("tema.field_focus")
        : p.t("tema.field_sample");

  return (
    <div className="km-tema-elonezet" data-mobil={p.mobil ? "true" : "false"} style={stilus}>
      <div className="km-pv-lap">
        <div>
          <div className="km-pv-fejezet">{p.t("tema.components")}</div>
          <div className="km-pv-sor">
            <button type="button" className="km-pv-gomb-elsodleges" data-allapot={p.allapot}>
              {p.t("tema.primary")}
            </button>
            <button type="button" className="km-pv-gomb-szellem" data-allapot={p.allapot}>
              {p.t("tema.secondary")}
            </button>
            <span className="km-pv-jelveny km-pv-jelveny-sajat">{p.t("jelveny.sajat")}</span>
            <span className="km-pv-jelveny km-pv-jelveny-ai">{p.t("jelveny.ai")}</span>
          </div>
        </div>
        <div>
          <label className="km-pv-mezo-cimke">{p.t("tema.field_label")}</label>
          <input readOnly className="km-pv-mezo" data-allapot={p.allapot} value={mezoErtek} />
        </div>
        <div className="km-pv-kod-sor">
          {p.t("tema.code_demo")}:{" "}
          <code className="km-pv-kod">--primary: {p.teljes["--primary"]}</code>
        </div>
        {p.allapot === "error" && <div className="km-pv-hiba">{p.t("tema.err_demo")}</div>}
        <div className="km-pv-siker">{p.t("tema.ok_demo")}</div>
        {/* 2026-09-21: a régi (v6) első lépés részlete kikerült — az R-8 óta nincs ilyen képernyő, és a narancs cím a visszavont színvilágé volt. */}
      </div>
    </div>
  );
}
