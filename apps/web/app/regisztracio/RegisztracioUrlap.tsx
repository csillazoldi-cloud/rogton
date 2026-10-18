"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hibadoboz, KartyaFej, Mezo } from "../_kozos/Keretek";
import { apiHivas, hibaKod, hibaSzoveg, hibasMezok } from "../_kozos/hibaszoveg";
import { useFeliratok } from "../../nyelv/kliens";

export function RegisztracioUrlap() {
  const router = useRouter();
  // R-2 (D-F30): a meghívó beváltó lapja ide küld, és vissza akar kapni — csak SAJÁT, "/"-rel kezdődő út fogadható (nyílt átirányítás tilos)
  const kereses = useSearchParams();
  const visszaNyers = kereses.get("vissza");
  const vissza = visszaNyers && /^\/(?!\/)/.test(visszaNyers) ? visszaNyers : null;
  const { t } = useFeliratok();
  const [hiba, setHiba] = useState<string | null>(null);
  const [mezokHiba, setMezokHiba] = useState<Record<string, string>>({});
  const [fut, setFut] = useState(false);

  function fokusz(nev: string) {
    const el = document.getElementById(nev);
    if (el instanceof HTMLElement) el.focus();
  }

  async function kuld(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFut(true); setHiba(null); setMezokHiba({});
    const adat = new FormData(e.currentTarget);
    const nev = String(adat.get("nev") ?? "");
    const email = String(adat.get("email") ?? "");
    const jelszo = String(adat.get("jelszo") ?? "");

    const helyi: Record<string, string> = {};
    if (nev.trim() === "") helyi["nev"] = t("hiba.nev_hianyzik");
    if (email.trim() === "") helyi["email"] = t("hiba.email_hianyzik");
    if (jelszo === "") helyi["jelszo"] = t("hiba.jelszo_hianyzik");
    else if (jelszo.length < 10) helyi["jelszo"] = t("hiba.jelszo_rovid");
    if (Object.keys(helyi).length > 0) {
      setMezokHiba(helyi);
      const sorrend = ["nev", "email", "jelszo"];
      const elso = sorrend.find((k) => helyi[k] !== undefined);
      if (elso !== undefined) fokusz(elso);
      setFut(false);
      return;
    }

    const torzs = { nev, email, jelszo };
    const r = await apiHivas("/api/fiok/regisztracio", torzs);
    if (r.statusz !== 201) {
      const kod = hibaKod(r.torzs);
      const m = hibasMezok(r.torzs);
      const szerver: Record<string, string> = {};
      for (const mezo of m) {
        if (mezo === "nev") szerver["nev"] = t("hiba.nev_hianyzik");
        else if (mezo === "email") szerver["email"] = t("hiba.email_hianyzik");
        else if (mezo === "jelszo") szerver["jelszo"] = t("hiba.jelszo_hianyzik");
      }
      if (kod === "GYENGE_JELSZO") szerver["jelszo"] = t("hiba.jelszo_rovid");
      if (kod === "EMAIL_FOGLALT") szerver["email"] = t("hiba.EMAIL_FOGLALT");
      if (Object.keys(szerver).length > 0) {
        setMezokHiba(szerver);
        const sorrend = ["nev", "email", "jelszo"];
        const elso = sorrend.find((k) => szerver[k] !== undefined);
        if (elso !== undefined) fokusz(elso);
      } else {
        setHiba(hibaSzoveg(t, kod));
      }
      setFut(false);
      return;
    }
    // a fiók megvan → belépés ugyanazzal, majd a szervezet megadása
    const b = await apiHivas("/api/fiok/belepes", { email: torzs.email, jelszo: torzs.jelszo });
    if (b.statusz !== 200) { router.push(vissza ? `/belepes?vissza=${encodeURIComponent(vissza)}` : "/belepes"); return; }
    router.push(vissza ?? "/szervezet/uj");
  }

  return (
    <>
      <KartyaFej cim={t("fiok.reg_cim")} kiemelt="" alcim={t("fiok.reg_cel")} />
      <form className="km-urlap" onSubmit={kuld} noValidate>
        {hiba ? <Hibadoboz szoveg={hiba} /> : null}
        <Mezo azonosito="nev" cimke={t("fiok.nev")} placeholder={t("regisztracio.nev_pl")} autoComplete="name" required
          hiba={mezokHiba["nev"]} />
        <Mezo azonosito="email" cimke={t("fiok.email")} type="email" placeholder={t("regisztracio.email_pl")} autoComplete="email" required
          hiba={mezokHiba["email"]} />
        <Mezo azonosito="jelszo" cimke={t("fiok.jelszo")} type="password" placeholder={t("regisztracio.jelszo_pl")} autoComplete="new-password" required
          sugo={t("fiok.jelszo_sugo")} jelszoMutatas hiba={mezokHiba["jelszo"]} />
        <div className="km-lab">
          <button className="km-gomb" type="submit" disabled={fut}>{t("fiok.reg_gomb")}</button>
        </div>
        <div className="km-reg-adatkezeles">
          {t("fiok.reg_adatkezeles")}{" "}
          <a href="/adatkezeles">{t("nav.adatkezeles")}</a>
        </div>
      </form>
    </>
  );
}
