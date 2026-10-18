import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { felirat, feliratok } from "../../nyelv";
import { KAPU_KIVUL_FEJLEC, KAPU_LAP, kapuJelszo, visszaUt } from "../../oldalkapu/szabaly";
import { Marka } from "../_kozos/Marka";
import { FoGomb } from "../_kozos/R15";
import { KozosTema } from "../_kozos/KozosTema";
import "../_kozos/fiok.css"; // a mező (km-mezo, km-cimke, km-bemenet) alakja — ugyanaz, mint a belépőlapon
import "./kapu.css";

// G9 — a kapu lapja (Csilla, 2026-10-18 16:05; Tibor-szabályok): a » + Rögtön jel, EGY jelszómező, EGY fő gomb, semmi más
// (nincs regisztráció, nincs link). Sima HTML-űrlap: JavaScript nélkül is működik — a POST /kapu-t a proxy.ts kezeli.
// A gyökér-keret a kapun kívül csak a kapu.* feliratokat adja le (layout.tsx), és sötét módban mutatja.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<{ title: string }> {
  return { title: felirat(await feliratok("hu", null), "kapu.oldalcim") };
}

type Allapot = "rossz" | "sok" | "zarva" | null;

export default async function KapuOldal({ searchParams }: { searchParams: Promise<{ h?: string; vissza?: string }> }) {
  const p = await searchParams;
  const kivul = (await headers()).get(KAPU_KIVUL_FEJLEC) === "1";
  // kikapcsolt kapunál, helyben (a proxy nem jelölte): nincs mit mutatni, megy a kezdőlapra
  if (!kivul && kapuJelszo() === "") redirect("/");
  const allapot: Allapot = p.h === "rossz" || p.h === "sok" || p.h === "zarva" ? p.h : null;
  const zarva = allapot === "zarva" || kapuJelszo() === "";
  const f = await feliratok("hu", null);
  const t = (k: string) => felirat(f, k);
  const sor = allapot === "rossz" ? t("kapu.rossz") : allapot === "sok" ? t("kapu.sok") : zarva ? t("kapu.zarva") : null;
  return (
    <>
      <KozosTema />
      <main className="km-lap-keret kp-lap">
        <div className="kp-oszlop">
          <h1 className="kp-cim">
            <Marka nev={t("kapu.oldalcim")} osztaly="kp-marka" />
          </h1>
          {zarva ? null : (
            <form className="kp-urlap" method="post" action={KAPU_LAP}>
              <input type="hidden" name="vissza" value={visszaUt(p.vissza)} />
              <div className="km-mezo">
                <label className="km-cimke" htmlFor="kp-jelszo">{t("kapu.jelszo")}</label>
                <input
                  id="kp-jelszo"
                  name="jelszo"
                  type="password"
                  className="km-bemenet"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  required
                  autoFocus
                  aria-invalid={allapot === "rossz" ? "true" : undefined}
                  aria-describedby={sor ? "kp-sor" : undefined}
                />
              </div>
              <FoGomb type="submit" osztaly="kp-gomb">{t("kapu.belepes")}</FoGomb>
            </form>
          )}
          {sor ? <p id="kp-sor" className="kp-sor" role={allapot ? "status" : undefined}>{sor}</p> : null}
        </div>
      </main>
    </>
  );
}
