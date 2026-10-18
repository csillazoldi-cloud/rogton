"use client";
import type { ReactNode } from "react";
import { useFeliratok } from "../../../nyelv/kliens";
import { FelsoSav } from "../../_kozos/FelsoSav";
import type { FelsoSavAdat } from "../../../kezdolap/tipusok";
import "./hirfigyelo.css";

export type HfLap = "attekintes" | "beallitas" | "finomhangolas";

/** A már létező lapok — egy fül csak akkor látszik, ha a lapja megvan (nincs gomb gépezet nélkül). E-25/E-26 bővíti. */
// Döntés 10-06 (Kati #17, Csilla #40): a „Pontosítás” (Találatok pontosítása) lekerült Tibor útjáról — a fülsorban sincs. A lap és az útja
// (a LAP_UT-ban is) megmarad, címmel elérhető; csak a rá mutató fül és linkek tűntek el.
export const ELERHETO_LAPOK: ReadonlySet<HfLap> = new Set<HfLap>(["attekintes", "beallitas"]);
export const LAP_UT: Record<HfLap, string> = { attekintes: "/hirfigyelo", beallitas: "/hirfigyelo/beallitas", finomhangolas: "/hirfigyelo/finomhangolas" };

/**
 * A Hírfigyelő modul közös váza a v7 prototípus szerint: felső sáv, alatta a modul fülsora (modulnév, jelvény, a három fül, új találatok jelzése),
 * alatta a közös profil sora, majd a lap tartalma (max 1180px). A fülek: a prototípus 3 lapja; a Finomhangolás fül „•" jelzést kap,
 * ha van friss próbafutás (`finomhangolasJelzes`).
 */
/**
 * R-15 · 06 Mit figyeljünk (gepezet-3 3.1, kerdesek-3 5 — Csilla 10-01: jóváhagyva): `fulsor={false}` → a modul-fülsor nem jelenik meg
 * (az Áttekintés a menü „Hírek” pontja, a Pontosítás a lap „Mit találtunk eddig?” linkje); `mainOsztaly` a R-15 lapváz osztálya
 * (a telefonos alsó gombsáv helye). A finomhangolás lap változatlanul a fülsorral jön, amíg át nem rajzoljuk.
 */
export function HirfigyeloKeret({ aktiv, profilNev, finomhangolasJelzes = false, children, sav, fulsor = true, mainOsztaly }: { aktiv: HfLap; profilNev: string; finomhangolasJelzes?: boolean; children: ReactNode; sav: FelsoSavAdat; fulsor?: boolean; mainOsztaly?: string }) {
  const { t } = useFeliratok();
  // R-7b 07 (D-F43): a fülek a rajz neveivel — telefonon a rövid alak, hogy 390-en elférjenek (audit: a harmadik fül kilógott)
  const jelzes = finomhangolasJelzes && aktiv !== "finomhangolas" ? " •" : "";
  const fulek: { lap: HfLap; cimke: string; rovid: string }[] = [
    { lap: "attekintes", cimke: t("hf.ful_attekintes"), rovid: t("hf.ful_attekintes_rovid") },
    { lap: "beallitas", cimke: t("hf.ful_beallitas"), rovid: t("hf.ful_beallitas_rovid") },
    { lap: "finomhangolas", cimke: t("hf.ful_pontositas") + jelzes, rovid: t("hf.ful_pontositas_rovid") + jelzes },
  ];
  return (
    <div className="km-hf">
      <FelsoSav adat={sav} aktiv="hirek" />
      {fulsor ? <div className="km-hf-fulsor">
        <div className="km-lap-keret-sav">
          <span className="km-hf-modul-nev">{t("hf.modTitle")}</span>
          <span className="km-hf-modul-jelveny">{t("hf.modTag")}</span>
          <nav className="km-hf-fulek" aria-label={t("hf.pOverview")}>
            {fulek.filter((f) => ELERHETO_LAPOK.has(f.lap)).map((f) => (
              <a key={f.lap} href={LAP_UT[f.lap]} className="km-hf-ful" data-aktiv={f.lap === aktiv ? "true" : "false"} aria-current={f.lap === aktiv ? "page" : undefined}><span className="km-csak-asztal">{f.cimke}</span><span className="km-csak-telefon">{f.rovid}</span></a>
            ))}
          </nav>
          {sav.uj_talalat > 0 ? (
            <span className="km-hf-uj-talalat">{t("nav.uj_talalat_jelzes", { n: sav.uj_talalat })}</span>
          ) : null}
        </div>
      </div> : null}
      {/* R-7b (audit 11.): a „Közös profil … az onboardingból átvéve" sor elmarad — a rajzon nincs; a profilNev a lapoknak marad */}
      <main className={`km-lap-keret ${mainOsztaly ?? "km-hf-tartalom"}`}>{children}</main>
    </div>
  );
}
