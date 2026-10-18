"use client";

import { useMemo } from "react";
import { AlapTokenek, TOKEN_SZABALYOK } from "@km/design-system";
import terHasznalat from "./ter-hasznalat.json";

const TER_KULCSOK = Object.keys(TOKEN_SZABALYOK).filter((k) => k.startsWith("--ter-")) as (keyof AlapTokenek)[];

function terKovetkezoErtek(kulcs: keyof AlapTokenek): number {
  const idx = TER_KULCSOK.indexOf(kulcs);
  if (idx < 0) return 0;
  const kovetkezo = TER_KULCSOK[idx + 1];
  if (!kovetkezo) return 0;
  const szabaly = TOKEN_SZABALYOK[kovetkezo];
  if (szabaly.tipus !== "size") return 0;
  return szabaly.max;
}

export function TerkozCsoport({
  tokenek,
  tokenBeallit,
  szerkesztheto,
  t,
}: {
  tokenek: AlapTokenek;
  tokenBeallit: (kulcs: keyof AlapTokenek, ertek: string) => void;
  szerkesztheto: boolean;
  t: (kulcs: string, parameterek?: Record<string, string | number>) => string;
}) {
  const hasznalat: Record<string, number> = terHasznalat;

  const sorok = useMemo(() => {
    return TER_KULCSOK.map((k) => {
      const szabaly = TOKEN_SZABALYOK[k];
      const ertekPx = parseInt(tokenek[k] ?? "0", 10) || 0;
      const min = szabaly.tipus === "size" ? szabaly.min : 0;
      const max = szabaly.tipus === "size" ? szabaly.max : 0;
      const kovetkezoMax = terKovetkezoErtek(k);
      const effektivMax = kovetkezoMax > 0 ? Math.min(max, kovetkezoMax) : max;
      const db = hasznalat[k as string];
      return { kulcs: k, ertekPx, min, max: effektivMax, db, szabaly };
    });
  }, [tokenek, hasznalat]);

  return (
    <section className="km-tema-szekcio">
      <h2 className="km-tema-szekcio-cim">{t("ter.theme_csoport_cim")}</h2>
      <p className="km-tema-jegyzet">{t("ter.theme_csoport_sugo")}</p>
      <div className="km-terkoz-lista">
        {sorok.map((s) => {
          const disabled = !szerkesztheto || s.kulcs === "--ter-0";
          return (
            <div key={s.kulcs} className="km-terkoz-sor">
              <code className="km-tema-kod km-terkoz-nev">{s.kulcs}</code>
              <input
                type="number"
                className="km-terkoz-mezo"
                min={s.min}
                max={s.max}
                step={1}
                value={s.ertekPx}
                disabled={disabled}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) return;
                  tokenBeallit(s.kulcs, `${Math.max(s.min, Math.min(s.max, v))}px`);
                }}
                aria-label={`${s.kulcs} px`}
              />
              <div className="km-terkoz-sav-tarto">
                {s.kulcs === "--ter-0" ? (
                  <div className="km-terkoz-sav-nulla" style={{ height: "var(--ter-7)" }} />
                ) : (
                  <div className="km-terkoz-sav" style={{ width: tokenek[s.kulcs], height: "var(--ter-7)" }} />
                )}
              </div>
              <span className="km-terkoz-hasznalat">
                {typeof s.db === "number" ? t("ter.hasznalat_db", { n: s.db }) : t("ter.hasznalat_nincs")}
              </span>
            </div>
          );
        })}
      </div>
      <p className="km-tema-jegyzet km-tema-jegyzet-terkoz">{t("ter.theme_zart")}</p>
    </section>
  );
}
