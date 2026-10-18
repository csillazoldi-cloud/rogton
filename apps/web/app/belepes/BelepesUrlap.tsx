"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mezo } from "../_kozos/Keretek";
import { Baj, FoGomb, KerdesCim, Teendo } from "../_kozos/R15";
import { apiHivas, hibaKod, hibaSzoveg, hibasMezok } from "../_kozos/hibaszoveg";
import { useFeliratok } from "../../nyelv/kliens";

// R-15 · 01 Belépés / 01b hibás adat (design/R15/rajz/R15-lapok-4.dc.html; gepezet-4 · 1). A logika a régi (R-7a) űrlapé, változatlanul:
// helyi ellenőrzés, POST /api/fiok/belepes, ?vissza= (csak saját út), utána /kezdolap. Ami változott: a kiszolgáló hibája egy `baj` sor a
// kártya FÖLÖTT; ROSSZ_BELEPES-nél mindkét mező hibásnak látszik (a rajz 01b); telefonon a fő gomb az alsó sávban, a regisztráció-link az
// űrlap alatt. Az „Elfelejtetted a jelszavad?” a hiba-sorban — UGYANAZZAL a feltétellel, mint eddig (DÖNTÉS 3.4 A: csak ha van
// `kozos.kapcsolat` felirat; ma nincs — kerdesek-4 · 1, Vilmos).
const URLAP_ID = "r15-belepes";

export function BelepesUrlap() {
  const router = useRouter();
  // R-2 (D-F30): a meghívó beváltó lapja ide küld, és vissza akar kapni — csak SAJÁT, "/"-rel kezdődő út fogadható (nyílt átirányítás tilos)
  const kereses = useSearchParams();
  const visszaNyers = kereses.get("vissza");
  const vissza = visszaNyers && /^\/(?!\/)/.test(visszaNyers) ? visszaNyers : null;
  const { t } = useFeliratok();
  const [hiba, setHiba] = useState<string | null>(null);
  const [rosszAdat, setRosszAdat] = useState(false);
  const [mezokHiba, setMezokHiba] = useState<Record<string, string>>({});
  const [fut, setFut] = useState(false);

  // DÖNTÉS 3.4 A: az „Elfelejtetted a jelszavad?” hivatkozás csak akkor látszik, ha van kapcsolat-adat
  const kapcsolat = t("kozos.kapcsolat");
  const vanKapcsolat = kapcsolat !== "kozos.kapcsolat";

  function fokusz(nev: string) {
    const el = document.getElementById(nev);
    if (el instanceof HTMLElement) el.focus();
  }

  async function kuld(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFut(true); setHiba(null); setMezokHiba({}); setRosszAdat(false);
    const adat = new FormData(e.currentTarget);
    const email = String(adat.get("email") ?? "");
    const jelszo = String(adat.get("jelszo") ?? "");

    const helyi: Record<string, string> = {};
    if (email.trim() === "") helyi["email"] = t("hiba.email_hianyzik");
    if (jelszo === "") helyi["jelszo"] = t("hiba.jelszo_hianyzik");
    if (Object.keys(helyi).length > 0) {
      setMezokHiba(helyi);
      const sorrend = ["email", "jelszo"];
      const elso = sorrend.find((k) => helyi[k] !== undefined);
      if (elso !== undefined) fokusz(elso);
      setFut(false);
      return;
    }

    const r = await apiHivas("/api/fiok/belepes", { email, jelszo });
    if (r.statusz !== 200) {
      const kod = hibaKod(r.torzs);
      const m = hibasMezok(r.torzs);
      const szerver: Record<string, string> = {};
      for (const mezo of m) {
        if (mezo === "email") szerver["email"] = t("hiba.email_hianyzik");
        else if (mezo === "jelszo") szerver["jelszo"] = t("hiba.jelszo_hianyzik");
      }
      if (Object.keys(szerver).length > 0) {
        setMezokHiba(szerver);
        const sorrend = ["email", "jelszo"];
        const elso = sorrend.find((k) => szerver[k] !== undefined);
        if (elso !== undefined) fokusz(elso);
      } else {
        setHiba(hibaSzoveg(t, kod));
        setRosszAdat(kod === "ROSSZ_BELEPES");
      }
      setFut(false);
      return;
    }
    // F-2 (D-F25): belépés után a kezdőképernyő; a szervezet nélkülit az a /szervezet/uj-ra, a profil nélkülit az első-használat kártyára viszi
    router.push(vissza ?? "/kezdolap");
  }

  return (
    <>
      <KerdesCim cim={t("fiok.belepes_cim")} alcim={t("belepes.alcim")} />
      {hiba ? (
        <Baj
          szoveg={hiba}
          gomb={vanKapcsolat ? <Link className="r15-halk-link r15b-baj-link" href="/jelszo-elfelejtve">{t("fiok.elfelejtett_jelszo")}</Link> : null}
        />
      ) : null}
      <form id={URLAP_ID} onSubmit={kuld} noValidate>
        <Teendo osztaly="r15b-kartya">
          <Mezo azonosito="email" cimke={t("fiok.email")} type="email" placeholder={t("belepes.email_pl")} autoComplete="email" required
            hibas={rosszAdat} hiba={mezokHiba["email"]} />
          <Mezo azonosito="jelszo" cimke={t("fiok.jelszo")} type="password" placeholder="••••••••••" autoComplete="current-password" required
            jelszoMutatas hibas={rosszAdat} hiba={mezokHiba["jelszo"]} />
          <FoGomb type="submit" disabled={fut} osztaly="r15-csak-asztal r15b-gomb">{t("fiok.belepes_gomb")}</FoGomb>
        </Teendo>
      </form>
      <p className="r15-csak-tel r15b-reg">
        {t("belepes.nincs_fiok")} <Link href="/regisztracio">{t("belepes.nincs_fiok_link")}</Link>
      </p>
      <div className="r15-also-sav">
        <FoGomb type="submit" form={URLAP_ID} disabled={fut}>{t("fiok.belepes_gomb")}</FoGomb>
      </div>
    </>
  );
}
