"use client";
// R-12 (2026-09-21): a kezdőlap három blokkja — lapcím + egy fő művelet · Hírek csempe · üzemállapot-sor.
// (Előtte R-8: összkép · Elkészült · Teendő · Csomagod · Üzemállapot — az R-12 ezt helyezte át, nem vett el belőle.)
// Első használat: egy kártya. Folyamatban: kiemelt kártya 3 mp-enként frissülő számokkal. Néző: nincs Teendő, nincs fő gomb.
// A rajz a szerződés: ami rajta nincs, az nem kerül a képernyőre; ami van, de nincs mögötte gépezet, az sem.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFeliratok } from "../../nyelv/kliens";
import type { KezdolapNezet } from "../../kezdolap/tipusok";
import { hfKeres, varjSor, type SorTetel } from "../hirfigyelo/_kozos/kliens";

type Osszkep = { szoveg: string; hivatkozott_talalatok: string[]; bizonytalan: boolean };

export function Kezdolap({ nezet }: { nezet: KezdolapNezet }) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();

  // Az időzóna KIMONDVA a munkatér figyelési beállításából (alap Europe/Budapest): a kiszolgáló (UTC-s doboz) és a böngésző
  // különben más szöveget ad, és a React a kettő eltérésén elhasal (418-as hidratálási hiba — a teszten mérve 2026-09-12).
  const zona = nezet.hirfigyelo?.idozona ?? "Europe/Budapest";
  const szamFormaz = new Intl.NumberFormat(nyelv);
  const penzFormaz = new Intl.NumberFormat(nyelv, { style: "currency", currency: nezet.munkater.penznem, currencyDisplay: "narrowSymbol" });
  const datumIdoFormaz = new Intl.DateTimeFormat(nyelv, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zona,
  });
  const datumFormaz = new Intl.DateTimeFormat(nyelv, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: zona,
  });
  const napFormaz = new Intl.DateTimeFormat(nyelv, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: zona,
  });

  function datumIdo(iso: string | null): string {
    if (!iso) return "";
    return datumIdoFormaz.format(new Date(iso));
  }

  // === Összkép (napi lap) ===
  const [osszkep, setOsszkep] = useState<Osszkep | null>(null);
  useEffect(() => {
    let el = false;
    void (async () => {
      const v = await hfKeres<{ osszkep: Osszkep }>("/api/hirfigyelo/osszkep");
      if (el) return;
      if (v.statusz === 200 && v.torzs.osszkep) setOsszkep(v.torzs.osszkep);
    })();
    return () => { el = true; };
  }, []);

  // === Folyamatban: a sorban lévő futás követése ===
  const [sorban, setSorban] = useState<SorTetel | null>(null);
  useEffect(() => {
    let el = false;
    void (async () => {
      const v = await hfKeres<{ sorban: SorTetel | null }>("/api/hirfigyelo/attekintes");
      if (el) return;
      if (v.statusz === 200 && v.torzs.sorban) {
        setSorban(v.torzs.sorban);
        const veg = await varjSor(v.torzs.sorban.id, { onLepes: (s) => { if (!el) setSorban(s); } });
        if (el) return;
        if (veg) router.refresh();
      }
    })();
    return () => { el = true; };
  }, [router]);

  const hf = nezet.hirfigyelo;
  const fut = (hf?.fut ?? false) || sorban !== null;

  // === A) Első használat ===
  if (nezet.elso_hasznalat) {
    return (
      <main className="km-lap-keret km-kp-fo">
        <div className="km-kp-elso km-emelkedik">
          <div className="km-kp-elso-felirat">
            {nezet.munkater.nev} · {t("kezdolap.elso_lepes")}
          </div>
          <h1 className="km-kp-elso-cim">
            {t("kezdolap.elso_cim_1")} <span className="km-grad">{t("kezdolap.elso_cim_2")}</span>
          </h1>
          <p className="km-kp-elso-szoveg">{t("kezdolap.elso_szoveg")}</p>
          {nezet.szerep === "nezo" ? (
            <p className="km-kp-elso-sugo">{t("kezdolap.nezo_elso")}</p>
          ) : (
            <Link href="/onboarding" className="km-kp-gomb-fo">
              {t("kezdolap.elso_gomb")}
            </Link>
          )}
          <p className="km-kp-elso-sugo">{t("kezdolap.elso_sugo_r8")}</p>
        </div>
      </main>
    );
  }

  // === B) Folyamatban ===
  if (fut) {
    const hal = sorban?.haladas ?? null;
    const letoltve = hal?.forrasok_letoltve ?? 0;
    const osszes = hal?.forrasok_osszes ?? 0;
    const talalt = hal?.cikkek_talalt ?? 0;
    const ertekelt = hal?.cikkek_ertekelve ?? 0;
    const ertekelendo = hal?.cikkek_ertekelendo ?? 0;
    const szazalek = Math.round((ertekelt / Math.max(1, ertekelendo)) * 100);
    const kezdve = sorban?.kezdve ?? null; // a sor tételének kezdete (MÉRVE 2026-09-16: az id-ból Invalid time value lett)

    return (
      <main className="km-lap-keret km-kp-fo">
        <div className="km-kp-fejlec-sor">
          <h1 className="km-kp-cim">{t("kezdolap.cim")}</h1>
          <span className="km-kp-datum">{napFormaz.format(new Date())}</span>
        </div>

        <div className="km-kp-folyamat km-emelkedik">
          <div className="km-kp-folyamat-fej">
            <span className="km-orb" aria-hidden="true" />
            <div className="km-kp-folyamat-fej-szoveg">
              <div className="km-kp-folyamat-cimke">
                {t("kezdolap.folyamatban")}
                {kezdve ? ` · ${t("kezdolap.folyamat_kezdve", { ido: datumIdo(kezdve) })}` : ""}
              </div>
              <div className="km-kp-folyamat-cim">{t("kezdolap.folyamat_cim")}</div>
              <div className="km-kp-folyamat-szoveg">{t("kezdolap.folyamat_szoveg")}</div>
            </div>
          </div>

          <div className="km-kp-folyamat-szamok">
            <div className="km-kp-folyamat-szam">
              <div className="km-kp-szakasz-cim">{t("kezdolap.folyamat_oldalak")}</div>
              <div className="km-kp-metric">
                {szamFormaz.format(letoltve)}
                <span className="km-kp-folyamat-szam-megj"> / {szamFormaz.format(osszes)}</span>
              </div>
            </div>
            <div className="km-kp-folyamat-szam">
              <div className="km-kp-szakasz-cim">{t("kezdolap.folyamat_cikkek")}</div>
              <div className="km-kp-metric">{szamFormaz.format(talalt)}</div>
              <div className="km-kp-folyamat-szam-megj">{t("kezdolap.folyamat_cikkek_megj")}</div>
            </div>
            <div className="km-kp-folyamat-szam">
              <div className="km-kp-szakasz-cim">{t("kezdolap.folyamat_atnezve")}</div>
              <div className="km-kp-metric km-grad">
                {szamFormaz.format(ertekelt)}
                <span className="km-kp-folyamat-szam-megj"> / {szamFormaz.format(ertekelendo)}</span>
              </div>
            </div>
          </div>

          <div className="km-kp-fenysav" style={{ width: `${szazalek}%` }} aria-hidden="true" />
          <div className="km-kp-folyamat-megj">{t("kezdolap.folyamat_megj")}</div>
        </div>

        {nezet.szerep !== "nezo" && hf !== null && hf.kovetkezo === null && (
          <>
            <div className="km-kp-szakasz-fej">
              <span className="km-kp-szakasz-cim">{t("kezdolap.teendo")}</span>
            </div>
            <div className="km-kp-teendo">
              <div className="km-kp-teendo-sor">
                <div className="km-kp-teendo-szoveg">
                  <span className="km-kp-teendo-cim">{t("kezdolap.teendo_napi_cim")}</span>
                  <span className="km-kp-teendo-megj">{t("kezdolap.teendo_napi_szoveg")}</span>
                </div>
                <Link href="/hirfigyelo/beallitas" className="km-kp-gomb-masodlagos">
                  {t("kezdolap.teendo_napi_gomb")}
                </Link>
              </div>
            </div>
          </>
        )}

      </main>
    );
  }

  // === C) Napi használat — R-12 (2026-09-21): három blokk ===
  // 1. lapcím + EGY fő művelet a cím mellett · 2. a Hírek csempe (benne az AI-összefoglaló „javaslat" jelvénnyel,
  // a lista kereten kívül, sorelválasztóval) · 3. egy üzemállapot-sor. A teendők legfeljebb két sorban a csempe alatt,
  // a csomag a Beállításokra ment — a kezdőlapon egy adata marad az üzemállapot-sorban.
  const uj = hf?.uj ?? 0;
  const fontosDb = hf?.elso_cimek.filter((c) => c.kategoria === "fontos").length ?? 0;
  const erdekesDb = hf?.elso_cimek.filter((c) => c.kategoria === "erdekes").length ?? 0;

  const teendoTetelek: { cim: string; szoveg: string; gomb: string; href: string }[] = [];
  if (nezet.szerep !== "nezo") {
    if (hf !== null && hf.kovetkezo === null) {
      teendoTetelek.push({
        cim: t("kezdolap.teendo_napi_cim"),
        szoveg: t("kezdolap.teendo_napi_szoveg"),
        gomb: t("kezdolap.teendo_napi_gomb"),
        href: "/hirfigyelo/beallitas",
      });
    }
    if (hf !== null && hf.forrashiba > 0) {
      teendoTetelek.push({
        cim: t("kezdolap.teendo_forras_cim", { n: szamFormaz.format(hf.forrashiba) }),
        szoveg: t("kezdolap.teendo_forras_szoveg"),
        gomb: t("kezdolap.teendo_forras_gomb"),
        href: "/hirfigyelo/beallitas",
      });
    }
    if (nezet.profil !== null && nezet.profil.hianyzo.length > 0) {
      const csakArculat = nezet.profil.hianyzo.length === 1 && nezet.profil.hianyzo[0] === "arculat";
      teendoTetelek.push(
        csakArculat
          ? { cim: t("kezdolap.teendo_arculat_cim"), szoveg: t("kezdolap.teendo_arculat_szoveg"), gomb: t("kezdolap.teendo_arculat_gomb"), href: "/fiok" }
          : {
              cim: t("kezdolap.teendo_profil_cim"),
              szoveg: nezet.profil.hianyzo.map((h) => t(`mezo.${h}`)).join(", "),
              gomb: t("kezdolap.teendo_profil_gomb"),
              href: "/fiok",
            },
      );
    }
    if (nezet.tervezet.tema) {
      teendoTetelek.push({ cim: t("kezdolap.tervezet_cim"), szoveg: t("kezdolap.tervezet_szoveg"), gomb: t("kezdolap.tervezet_gomb"), href: "/tema" });
    }
    if (nezet.tervezet.feliratok) {
      teendoTetelek.push({ cim: t("kezdolap.tervezet_cim"), szoveg: t("kezdolap.tervezet_szoveg"), gomb: t("kezdolap.tervezet_gomb"), href: "/feliratok" });
    }
  }
  // Legfeljebb két sor; a harmadiktól egy szám az üzemállapot-sorban.
  const lathatoTeendok = teendoTetelek.slice(0, 2);
  const tobbiTeendo = teendoTetelek.length - lathatoTeendok.length;

  const hasznalhato = nezet.forrasok.hasznalhato;
  const keretMaradt = nezet.koltseg.maradt.ertek;
  const probaidoszak = nezet.csomag.kod === "radar";

  return (
    <main className="km-lap-keret km-kp-fo">
      <div className="km-kp-fejlec-sor km-kp-fejlec-muvelettel">
        <div className="km-kp-fejlec-bal">
          <h1 className="km-kp-cim">{t("kezdolap.cim")}</h1>
          <span className="km-kp-datum">{napFormaz.format(new Date())}</span>
        </div>
        {hf !== null ? (
          <Link href="/hirfigyelo" className="km-kp-gomb-fo">
            {t("kezdolap.fo_gomb_hirek")}
          </Link>
        ) : nezet.szerep !== "nezo" ? (
          <Link href="/hirfigyelo/beallitas" className="km-kp-gomb-fo">
            {t("kezdolap.fo_gomb_proba")}
          </Link>
        ) : null}
      </div>

      {/* Hírek */}
      <div className="km-kp-szakasz-fej">
        <span className="km-kp-szakasz-cim">{t("kezdolap.hirek_cim")}</span>
      </div>
      <div className="km-kp-csempe">
        {hf !== null ? (
          <>
            <div className="km-kp-csempe-fej">
              <div className="km-kp-csempe-szam-sor">
                <span className="km-kp-csempe-szam">{szamFormaz.format(uj)}</span>
                <span className="km-kp-csempe-szam-szoveg">
                  {t("kezdolap.hirek_uj")}
                  {(fontosDb > 0 || erdekesDb > 0) && (
                    <>
                      {", "}
                      {t("kezdolap.ebbol")}{" "}
                      {fontosDb > 0 && <b>{szamFormaz.format(fontosDb)} {t("hf.kat_fontos")}</b>}
                      {fontosDb > 0 && erdekesDb > 0 && " · "}
                      {erdekesDb > 0 && <b>{szamFormaz.format(erdekesDb)} {t("hf.kat_erdekes")}</b>}
                    </>
                  )}
                </span>
              </div>
              <span className="km-kp-csempe-utolso">
                {hf.utolso_sikeres
                  ? t("kezdolap.hirek_utolso", { ido: datumIdo(hf.utolso_sikeres) })
                  : hf.utolso_futas
                    ? t("kezdolap.hirek_utolso", { ido: datumIdo(hf.utolso_futas) })
                    : t("kezdolap.hf_utolso_futas_nincs")}
              </span>
            </div>

            {(hf.fuggoben > 0 || hf.keret_kimerult) && (
              <div className="km-kp-csempe-jelek">
                {hf.fuggoben > 0 && (
                  <span className="km-kp-jelveny-semleges">{t("kezdolap.hf_ertekeles_fuggoben", { n: szamFormaz.format(hf.fuggoben) })}</span>
                )}
                {hf.keret_kimerult && <span className="km-kp-jelveny-figyelem">{t("kezdolap.keret_elfogyott")}</span>}
              </div>
            )}

            {osszkep !== null && (
              <div className="km-kp-csempe-sor km-kp-osszkep-sor">
                <div className="km-kp-osszkep-fej">
                  <span className="km-kp-jelveny-ai">{t("jelzes.javaslat")}</span>
                  <span className="km-kp-osszkep-cim">{t("kezdolap.osszkep_cim")}</span>
                </div>
                <p className="km-kp-osszkep-szoveg">{osszkep.szoveg}</p>
                {osszkep.bizonytalan && <div className="km-kp-osszkep-bizonytalan">{t("hf.ovSummaryCaveat")}</div>}
              </div>
            )}

            {hf.elso_cimek.map((c) => (
              <Link
                key={c.talalat_id}
                href={`/hirfigyelo?talalat=${encodeURIComponent(c.talalat_id)}`}
                className="km-kp-csempe-sor km-kp-hir-sor"
              >
                <span className="km-kp-jelveny-semleges">{t(`hf.kat_${c.kategoria}`)}</span>
                <span className="km-kp-hir-szoveg">
                  <span className="km-kp-hir-cim">{c.cim}</span>
                  {c.cim_eredeti ? <span className="km-kp-hir-eredeti">{c.cim_eredeti}</span> : null}
                </span>
              </Link>
            ))}

            <div className="km-kp-csempe-lab">
              <Link href="/hirfigyelo" className="km-kp-link">
                {uj > 0 ? t("kezdolap.mind_hir", { n: szamFormaz.format(uj) }) : t("kezdolap.hirek_megtekintese")}
              </Link>
            </div>
          </>
        ) : (
          <div className="km-kp-csempe-ures">{t("kezdolap.hf_utolso_futas_nincs")}</div>
        )}
      </div>

      {/* Teendő — legfeljebb két sor */}
      {lathatoTeendok.length > 0 && (
        <>
          <div className="km-kp-szakasz-fej">
            <span className="km-kp-szakasz-cim">{t("kezdolap.teendo")}</span>
            <span className="km-kp-szakasz-db">{t("kezdolap.tetel_n", { n: szamFormaz.format(teendoTetelek.length) })}</span>
          </div>
          <div className="km-kp-teendo">
            {lathatoTeendok.map((tetel, i) => (
              <div key={i} className="km-kp-teendo-sor">
                <div className="km-kp-teendo-szoveg">
                  <span className="km-kp-teendo-cim">{tetel.cim}</span>
                  <span className="km-kp-teendo-megj">{tetel.szoveg}</span>
                </div>
                <Link href={tetel.href} className="km-kp-gomb-masodlagos">
                  {tetel.gomb}
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {nezet.szerep === "nezo" && <div className="km-kp-nezo-megj">{t("kezdolap.nezo_megj")}</div>}

      {/* Üzemállapot — egy sor; a nyíl alatt a részletek */}
      <details className="km-kp-uzemallapot">
        <summary className="km-kp-uzemallapot-osszefoglalo">
          <span className="km-kp-uzemallapot-sor">
            <span className="km-kp-uzemallapot-elem km-kp-uzemallapot-fo">
              {hasznalhato > 0 ? t("kezdolap.forrasok_mukodik", { n: szamFormaz.format(hasznalhato) }) : t("kezdolap.uzemallapot")}
              <span className="km-kp-uzemallapot-nyil" aria-hidden="true">▾</span>
            </span>
            <span className="km-kp-uzemallapot-elvalaszto" aria-hidden="true">·</span>
            <span className="km-kp-uzemallapot-elem">{t("kezdolap.keret_sor", { osszeg: penzFormaz.format(keretMaradt) })}</span>
            <span className="km-kp-uzemallapot-elvalaszto" aria-hidden="true">·</span>
            <span className="km-kp-uzemallapot-elem">
              {probaidoszak
                ? nezet.csomag.forras_max !== null
                  ? t("kezdolap.uzem_proba_forras", { n: nezet.csomag.forras_max })
                  : t("kezdolap.uzem_proba")
                : t(`csomag.${nezet.csomag.kod}_nev`)}
            </span>
            {tobbiTeendo > 0 && (
              <>
                <span className="km-kp-uzemallapot-elvalaszto" aria-hidden="true">·</span>
                <span className="km-kp-uzemallapot-elem">{t("kezdolap.tovabbi_teendo", { n: szamFormaz.format(tobbiTeendo) })}</span>
              </>
            )}
          </span>
          <Link href="/beallitasok" className="km-kp-link">{t("nav.beallitasok")}</Link>
        </summary>
        <div className="km-kp-uzemallapot-tartalom">
          <div className="km-kp-uzemallapot-reszletek">
            <div className="km-kp-forras-reszletek">
              {([
                ["hasznalhato", nezet.forrasok.hasznalhato] as const,
                ["korlatozott", nezet.forrasok.korlatozott] as const,
                ["hibas", nezet.forrasok.hibas] as const,
                ["nem_tamogatott", nezet.forrasok.nem_tamogatott] as const,
                ["ellenorzes_alatt", nezet.forrasok.ellenorzes_alatt] as const,
              ]).map(([kulcs, ertek]) => (
                <div key={kulcs} className="km-kp-forras-reszlet-sor">
                  <span>{t(`kezdolap.forras_${kulcs}`)}</span>
                  <strong>{szamFormaz.format(ertek)}</strong>
                </div>
              ))}
            </div>
            <div className="km-kp-keret-reszletek">
              <div className="km-kp-keret-reszlet-sor">
                <span>{t("kezdolap.koltseg_becsult")}</span>
                <strong>{penzFormaz.format(nezet.koltseg.becsult.ertek)}</strong>
              </div>
              <div className="km-kp-keret-reszlet-sor">
                <span>
                  {t("kezdolap.keret_maradt", {
                    maradt: penzFormaz.format(nezet.koltseg.maradt.ertek),
                    keret: penzFormaz.format(nezet.koltseg.keret.ertek),
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="km-kp-uzemallapot-link-sor">
            <Link href="/koltseg" className="km-kp-uzemallapot-link">
              {t("kezdolap.koltseg_link")}
            </Link>
          </div>
        </div>
      </details>
    </main>
  );
}
