"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingPiszkozat } from "@rogton/contracts";
import { useFeliratok } from "../../../nyelv/kliens";
import { Nyelvvalaszto } from "../../_kozos/Nyelvvalaszto";
import { Marka } from "../../_kozos/Marka";
import { ModValto } from "../../_kozos/ModValto";
import { Visszajelzes } from "../../_kozos/Visszajelzes";
import { type Allapot, Jelveny, MentesAllapot, arculatAllapotSzoveg, hivas, nyelvNev } from "../../_kozos/kliens";
export { hivas, nyelvNev, arculatAllapotSzoveg, Jelveny, type Allapot };


/** A piszkozat és a mentése (A-04): siker csak a kiszolgáló visszaigazolása után; hibánál újrapróbál a következő változásnál. */
export function usePiszkozat(kezdo: OnboardingPiszkozat, kezdoFrissitve: string | null) {
  const router = useRouter();
  const [piszkozat, setPiszkozat] = useState<OnboardingPiszkozat>(kezdo);
  const [allapot, setAllapot] = useState<Allapot>(kezdoFrissitve ? "kesz" : "csend");
  const [mentveEkkor, setMentveEkkor] = useState<Date | null>(kezdoFrissitve ? new Date(kezdoFrissitve) : null);
  const idozito = useRef<ReturnType<typeof setTimeout> | null>(null);
  const legutobbMentett = useRef<string>(JSON.stringify(kezdo));

  const ment = useCallback(async (mit: OnboardingPiszkozat): Promise<boolean> => {
    setAllapot("folyik");
    const r = await hivas("/api/onboarding/piszkozat", "PUT", mit);
    if (r.statusz === 200) { legutobbMentett.current = JSON.stringify(mit); setAllapot("kesz"); setMentveEkkor(new Date()); return true; }
    if (r.statusz === 401) { router.push("/belepes"); return false; }
    if (r.statusz === 409) { router.push("/szervezet/uj"); return false; }
    setAllapot("hiba");
    return false;
  }, [router]);

  useEffect(() => {
    if (JSON.stringify(piszkozat) === legutobbMentett.current) return;
    if (idozito.current) clearTimeout(idozito.current);
    idozito.current = setTimeout(() => { void ment(piszkozat); }, 800);
    return () => { if (idozito.current) clearTimeout(idozito.current); };
  }, [piszkozat, ment]);

  /** Azonnali mentés (lépésváltás, kilépés előtt, „Újrapróbálás”). */
  async function mentMost(): Promise<boolean> {
    if (idozito.current) clearTimeout(idozito.current);
    return JSON.stringify(piszkozat) === legutobbMentett.current ? true : ment(piszkozat);
  }

  return { piszkozat, setPiszkozat, allapot, mentMost, mentveEkkor };
}

/** Egy előnézet-sor: címke, jelvény, érték (v6 previewRows). */
export function ElonezetSor({ cimke, ertek, forras, modositva, kesobb, friss }: { cimke: string; ertek: string; forras: "sajat" | "ai" | "weboldal" | ""; modositva?: boolean; kesobb?: boolean; friss?: boolean | undefined }) {
  const { t } = useFeliratok();
  const van = ertek.trim().length > 0 && !kesobb;
  return (
    <div className="km-elonezet-sor" data-friss={friss && van && forras === "ai" ? "true" : "false"}>
      <div className="km-elonezet-cimke">{cimke} <Jelveny forras={forras} modositva={modositva ?? false} ures={!van} /></div>
      <div className="km-elonezet-ertek" data-ures={van ? "false" : "true"}>{van ? ertek : kesobb ? t("onboarding2.kesobb_rovid") : t("elonezet.nincs")}</div>
    </div>
  );
}

/** Az onboarding közös váza: kompakt fejléc (lépés címke, mentés-állapot, mentés és vissza), rács (kártya + előnézet). */
export function OnboardingKeret({ szervezetNev, lepes, allapot, mentMost, mentveEkkor, piszkozat, friss, elonezet, children }: {
  szervezetNev: string; lepes: 1 | 2 | 3; allapot: Allapot; mentMost: () => Promise<boolean>; mentveEkkor: Date | null; piszkozat: OnboardingPiszkozat; friss?: boolean; elonezet?: "teljes" | "javaslat" | "nincs"; children: ReactNode;
}) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const b = piszkozat.bemutatkozas, k = piszkozat.kommunikacio;
  const elonezetMod = elonezet ?? "teljes";

  async function mentesEsVissza() {
    if (!(await mentMost())) return;
    router.push("/kezdolap");
  }

  const hangnemErtek = k.hangnem_leiras && k.hangnem_minta ? `${k.hangnem_leiras} — „${k.hangnem_minta}”` : k.hangnem_leiras;

  const elonezetTartalom = (() => {
    if (elonezetMod === "javaslat") {
      return (
        <>
          <div className="km-elonezet-cim"><span className="km-elonezet-pont" aria-hidden="true" />{t("onboarding1.elonezet_cim")}</div>
          {b.osszefoglalo.trim().length === 0 ? (
            <p className="km-elonezet-ures">{t("onboarding1.elonezet_ures")}</p>
          ) : (
            <>
              <ElonezetSor cimke={t("elonezet.nev")} ertek={b.nev} forras={b.nev ? "sajat" : ""} />
              <ElonezetSor cimke={t("elonezet.tevekenyseg")} ertek={b.osszefoglalo} forras={b.osszefoglalo_forras} modositva={b.osszefoglalo_modositva} />
            </>
          )}
        </>
      );
    }
    // "teljes" — a 2. lépés megtartja a mai tartalmat
    return (
      <>
        <div className="km-elonezet-cim"><span className="km-elonezet-pont" aria-hidden="true" />{t("elonezet.cim")}</div>
        <div className="km-elonezet-alcim">{t("elonezet.alcim")}</div>
        <ElonezetSor cimke={t("elonezet.nev")} ertek={b.nev} forras={b.nev ? "sajat" : ""} />
        <ElonezetSor cimke={t("elonezet.tevekenyseg")} ertek={b.osszefoglalo} forras={b.osszefoglalo_forras} modositva={b.osszefoglalo_modositva} />
        <ElonezetSor cimke={t("elonezet.celkozonseg")} ertek={k.celkozonseg} forras={k.celkozonseg_forras} modositva={k.celkozonseg_modositva} kesobb={k.celkozonseg_kesobb} friss={friss} />
        <ElonezetSor cimke={t("elonezet.kommunikacios_cel")} ertek={k.cel} forras={k.cel_forras} modositva={k.cel_modositva} kesobb={k.cel_kesobb} friss={friss} />
        <ElonezetSor cimke={t("elonezet.tartalomnyelvek")} ertek={k.nyelvek.map((ny) => nyelvNev(ny, nyelv)).join(", ")} forras={k.nyelvek_forras} />
        <ElonezetSor cimke={t("elonezet.hangnem")} ertek={hangnemErtek} forras={k.hangnem_forras} modositva={k.hangnem_modositva} kesobb={k.hangnem_kesobb} friss={friss} />
        <div className="km-elonezet-sor">
          <div className="km-elonezet-cimke">{t("elonezet.arculat")}</div>
          <div className="km-elonezet-ertek km-elonezet-arculat" data-allapot={piszkozat.arculat.allapot}>{arculatAllapotSzoveg(piszkozat.arculat.allapot, t)}</div>
        </div>
      </>
    );
  })();

  return (
    <div className="km-hatter">
      <div className="km-tartalom">
        <header className="km-fejlec km-ob-fejlec-lepes">
          <div className="km-fejlec-bal">
            {/* R-18 2. kör: a/t jel + termék neve (mint a belépett lapok sávjában) */}
            <Marka nev={t("fejlec.termeknev")} />
            <div className="km-ob-fejlec-jelveny">{szervezetNev}</div>
            <div className="km-ob-fejlec-lepes-cimke">{t(`onboarding.lepes_${lepes}_fejlec`)}</div>
          </div>
          <div className="km-fejlec-jobb">
            <ModValto valtozat="gomb" />
            <Nyelvvalaszto />
            <MentesAllapot allapot={allapot} mentveEkkor={mentveEkkor} ujra={() => { void mentMost(); }} />
            <button className="km-gomb-szellem" type="button" onClick={mentesEsVissza}>
              <span className="km-csak-asztal">{t("onboarding.mentes_es_vissza")}</span>
              <span className="km-csak-telefon">{t("onboarding.mentes_es_vissza_rovid")}</span>
            </button>
          </div>
        </header>
        <main className={`km-lap-keret km-ob-racs${elonezetMod === "nincs" ? " km-ob-racs-egy" : ""}`}>
          <section className="km-ob-kartya">{children}</section>
          {elonezetMod !== "nincs" ? (
            <aside className={`km-elonezet${elonezetMod === "javaslat" ? " km-elonezet-csukhato" : ""}`}>
              {elonezetMod === "javaslat" ? (
                <>
                  {/* R-7a 03/04: asztalon nyitva áll, telefonon összecsukható — a kettő közül a CSS mutat egyet */}
                  <div className="km-elonezet-asztal">{elonezetTartalom}</div>
                  <details className="km-elonezet-details">
                    <summary className="km-elonezet-summary">{t("onboarding1.elonezet_megnyitas")}</summary>
                    <div className="km-elonezet-tartalom">{elonezetTartalom}</div>
                  </details>
                </>
              ) : elonezetTartalom}
            </aside>
          ) : null}
        </main>
      </div>
      {/* Kati 10-02: a lebegő Visszajelzés gomb az első beállítás lépésein is */}
      <Visszajelzes />
    </div>
  );
}
