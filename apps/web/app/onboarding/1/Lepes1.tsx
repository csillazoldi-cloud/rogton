"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingPiszkozat } from "@rogton/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { hibaKod, hibasMezok } from "../../_kozos/hibaszoveg";
import { OnboardingKeret, hivas, usePiszkozat } from "../_kozos/keret";

/** A v6 névpótlása: „mintamuhely.hu” → „Mintamuhely”, ha a névmező üres. */
function tartomanyNev(cim: string): string {
  const t = cim.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/.]/)[0] ?? "";
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

type Bemutatkozas = OnboardingPiszkozat["bemutatkozas"];

export function Lepes1({ szervezetNev, kezdo, kezdoFrissitve }: { szervezetNev: string; kezdo: OnboardingPiszkozat; kezdoFrissitve: string | null }) {
  const { t } = useFeliratok();
  const router = useRouter();
  const { piszkozat, setPiszkozat, allapot, mentMost, mentveEkkor } = usePiszkozat(kezdo, kezdoFrissitve);
  // Az összefoglaló állapotai — a v6 prototípus OB-01 logikája: feldolgozás (2 fázis), hiba (forrás | ai),
  // kész (javítható), függő új javaslat (ha a mostanit már kézzel javította), kihagyható kérdés.
  const [folyamat, setFolyamat] = useState<{ fut: boolean; fazis: 0 | 1 }>({ fut: false, fazis: 0 });
  const [hibaTipus, setHibaTipus] = useState<"forras" | "ai" | null>(null);
  const [fuggo, setFuggo] = useState<{ szoveg: string; forras: "weboldal" | "ai" } | null>(null);
  const [gepelt, setGepelt] = useState<string | null>(null); // a v6 „gépelő” megjelenítése az új javaslatnál
  const fazisIdozito = useRef<ReturnType<typeof setTimeout> | null>(null);
  const b = piszkozat.bemutatkozas;

  function modosit(resz: Partial<Bemutatkozas>) {
    setPiszkozat((p) => ({ ...p, bemutatkozas: { ...p.bemutatkozas, ...resz } }));
  }

  // A forras_tipus a kitöltöttségből adódik: weboldal, ha van; különben leírás
  const forrasTipus: "weboldal" | "leiras" = b.weboldal.trim().length > 0 ? "weboldal" : "leiras";

  const keszitheto = b.nev.trim().length > 0 && (b.weboldal.trim().length > 0 || b.leiras.trim().length > 10);
  const osszefoglaloVan = b.osszefoglalo.trim().length > 0;

  function gepel(teljes: string) {
    // a v6 typeOut: betűnként jelenik meg; csökkentett mozgásnál azonnal
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setGepelt(null); return; }
    setGepelt("");
    let i = 0;
    const lepes = () => {
      i += 3;
      if (i >= teljes.length) { setGepelt(null); return; }
      setGepelt(teljes.slice(0, i));
      setTimeout(lepes, 12);
    };
    setTimeout(lepes, 12);
  }

  async function osszefoglalo() {
    if (!keszitheto || folyamat.fut) return;
    setHibaTipus(null); setFuggo(null);
    setFolyamat({ fut: true, fazis: 0 });
    fazisIdozito.current = setTimeout(() => setFolyamat({ fut: true, fazis: 1 }), 1100);
    const r = await hivas("/api/onboarding/osszefoglalo", "POST", { nev: b.nev, forras_tipus: forrasTipus, weboldal: b.weboldal, leiras: b.leiras });
    if (fazisIdozito.current) clearTimeout(fazisIdozito.current);
    setFolyamat({ fut: false, fazis: 0 });
    const kod = hibaKod(r.torzs);
    if (r.statusz === 401) { router.push("/belepes"); return; }
    if (r.statusz !== 200 || typeof r.torzs["osszefoglalo"] !== "string") {
      setHibaTipus(kod === "FORRAS_NEM_ELERHETO" || (kod === "ERVENYTELEN_ADAT" && hibasMezok(r.torzs).has("weboldal")) ? "forras" : "ai");
      return;
    }
    const szoveg = r.torzs["osszefoglalo"];
    const forras: "weboldal" | "ai" = forrasTipus === "weboldal" ? "weboldal" : "ai";
    // ha a mostani szöveget kézzel javította (vagy sajátja), az új javaslat FÜGGŐBEN marad — a javítás nem vész el (A-02)
    const vedett = osszefoglaloVan && (b.osszefoglalo_modositva || b.osszefoglalo_forras === "sajat");
    if (vedett) { setFuggo({ szoveg, forras }); return; }
    const nevPotlas = !b.nev.trim() && forrasTipus === "weboldal" ? { nev: tartomanyNev(b.weboldal) } : {};
    modosit({ osszefoglalo: szoveg, osszefoglalo_forras: forras, osszefoglalo_modositva: false, ...nevPotlas });
    gepel(szoveg);
  }
  function fuggoElfogad() { if (fuggo) { modosit({ osszefoglalo: fuggo.szoveg, osszefoglalo_forras: fuggo.forras, osszefoglalo_modositva: false }); setFuggo(null); } }
  function fuggoElvet() { setFuggo(null); }
  function sajatSzovegHasznal() { modosit({ osszefoglalo: b.leiras.trim(), osszefoglalo_forras: "sajat", osszefoglalo_modositva: false }); setHibaTipus(null); }
  function osszefoglaloSzerkeszt(ertek: string) {
    const uj = b.osszefoglalo_forras === "" || b.osszefoglalo_forras === "sajat" ? { osszefoglalo_forras: "sajat" as const, osszefoglalo_modositva: false } : { osszefoglalo_modositva: true };
    modosit({ osszefoglalo: ertek, ...uj });
  }
  const jelvenySzoveg = b.osszefoglalo_forras === "" ? t("jelveny.ures") : t(`jelveny.${b.osszefoglalo_forras}`) + (b.osszefoglalo_modositva && b.osszefoglalo_forras !== "sajat" ? t("jelveny.modositva") : "");
  const forrasMegj = b.osszefoglalo_forras === "weboldal" ? t("onboarding1.forras_weboldal_megj") : b.osszefoglalo_forras === "ai" ? t("onboarding1.forras_ai_megj") : t("onboarding1.forras_sajat_megj");


  async function tovabb() {
    if (!(await mentMost())) return;
    router.push("/onboarding/2");
  }

  return (
    <OnboardingKeret szervezetNev={szervezetNev} lepes={1} allapot={allapot} mentMost={mentMost} mentveEkkor={mentveEkkor} piszkozat={piszkozat} elonezet="javaslat">
      <div className="km-fej">
        <h1 className="km-ob-h1">{t("onboarding1.cim")}</h1>
        <p className="km-alcim">{t("onboarding1.bevezeto")}</p>
      </div>

      <div className="km-mezo">
        <label className="km-cimke" htmlFor="nev">{t("onboarding1.szervezet_neve")}</label>
        <input id="nev" className="km-bemenet" value={b.nev} onChange={(e) => modosit({ nev: e.target.value })} />
      </div>

      <div className="km-mezo">
        <label className="km-cimke" htmlFor="weboldal">{t("onboarding1.weboldal")}</label>
        <input id="weboldal" className="km-bemenet km-bemenet-mono" value={b.weboldal} inputMode="url" onChange={(e) => modosit({ weboldal: e.target.value })} />
        <div className="km-sugo">{t("onboarding1.vagy")}</div>
      </div>

      <div className="km-mezo">
        <label className="km-cimke" htmlFor="leiras">{t("onboarding1.mivel_foglalkoztok")}</label>
        <textarea id="leiras" className="km-bemenet km-terulet" value={b.leiras} placeholder={t("onboarding1.mivel_sugo")} onChange={(e) => modosit({ leiras: e.target.value })} />
      </div>

      {hibaTipus && !folyamat.fut ? (
        <div className="km-ob-hiba" role="alert">
          <div className="km-ob-hiba-cim">{hibaTipus === "forras" ? t("onboarding1.err_forras_cim") : t("onboarding1.err_ai_cim")}</div>
          <div className="km-ob-hiba-szoveg">{hibaTipus === "forras" ? t("onboarding1.err_forras_szoveg") : forrasTipus === "leiras" ? t("onboarding1.err_ai_szoveg_leiras") : t("onboarding1.err_ai_szoveg_weboldal")}</div>
          <div className="km-ob-hiba-gombok">
            <button type="button" className="km-gomb-hiba" onClick={osszefoglalo}>{t("onboarding1.ujraprobalom")}</button>
            {forrasTipus === "weboldal" ? <button type="button" className="km-gomb-kis" onClick={() => { modosit({ weboldal: "", leiras: b.leiras || b.weboldal }); setHibaTipus(null); }}>{t("onboarding1.bemasolom")}</button> : null}
            {hibaTipus === "ai" && forrasTipus === "leiras" && b.leiras.trim().length > 10 ? <button type="button" className="km-gomb-kis" onClick={sajatSzovegHasznal}>{t("onboarding1.ezt_hasznalom")}</button> : null}
          </div>
        </div>
      ) : null}

      {folyamat.fut ? (
        <div className="km-ob-folyamat" aria-live="polite">
          <div className="km-ob-folyamat-belso">
            <span className="km-ob-porgo" aria-hidden="true" />
            <div>
              <div className="km-ob-fazis">{folyamat.fazis === 0 ? t("onboarding1.fazis1") : t("onboarding1.fazis2")}</div>
              <div className="km-ob-folyamat-megj">{t("onboarding1.folyamat_megj")}</div>
            </div>
          </div>
        </div>
      ) : null}

      {osszefoglaloVan ? (
        <div className="km-ob-ossz">
          <div className="km-ob-ossz-fej">
            <div className="km-ob-ossz-cim">{t("onboarding1.elonezet_cim")}</div>
            <span className="km-jelveny-src" data-src={b.osszefoglalo_forras}>{jelvenySzoveg}</span>
          </div>
          {gepelt !== null ? (
            <div className="km-ob-gepel">{gepelt}<span className="km-ob-kurzor" aria-hidden="true" /></div>
          ) : (
            <textarea rows={4} aria-label={t("onboarding1.elonezet_cim")} value={b.osszefoglalo} onChange={(e) => osszefoglaloSzerkeszt(e.target.value)} />
          )}
          <div className="km-ob-forras-megj">{forrasMegj} {t("onboarding1.nem_teny")}</div>
          {fuggo ? (
            <div className="km-ob-fuggo">
              <div className="km-ob-fuggo-fej"><span className="km-ob-fuggo-cim">{t("onboarding1.fuggo_cim")}</span><span className="km-ob-fuggo-megj">{t("onboarding1.fuggo_megj")}</span></div>
              <div className="km-ob-fuggo-szoveg">{fuggo.szoveg}</div>
              <div className="km-ob-fuggo-gombok">
                <button type="button" className="km-gomb-kis-elso" onClick={fuggoElfogad}>{t("onboarding1.elfogadom_ujat")}</button>
                <button type="button" className="km-gomb-kis" onClick={fuggoElvet}>{t("onboarding1.megtartom")}</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="km-ob-gombsor">
        {!osszefoglaloVan ? (
          <button className="km-gomb" type="button" onClick={osszefoglalo} disabled={!keszitheto || folyamat.fut}>{t("onboarding1.javaslat_gomb")}</button>
        ) : (
          <>
            <button className="km-gomb" type="button" onClick={tovabb}>{t("onboarding.tovabb_lepes2")}</button>
            <button className="km-gomb-szellem" type="button" onClick={osszefoglalo} disabled={folyamat.fut}>{t("onboarding1.ujra")}</button>
          </>
        )}
      </div>
    </OnboardingKeret>
  );
}
