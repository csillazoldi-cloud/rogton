"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Hibadoboz, KartyaFej, Mezo } from "../../_kozos/Keretek";
import { apiHivas, hibaKod, hibaSzoveg, hibasMezok } from "../../_kozos/hibaszoveg";
import { useFeliratok } from "../../../nyelv/kliens";

export function SzervezetUrlap() {
  const router = useRouter();
  const { t } = useFeliratok();
  const [hiba, setHiba] = useState<string | null>(null);
  const [hibas, setHibas] = useState<Set<string>>(new Set());
  const [fut, setFut] = useState(false);

  async function kuld(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFut(true); setHiba(null); setHibas(new Set());
    const adat = new FormData(e.currentTarget);
    const r = await apiHivas("/api/szervezet", { nev: adat.get("nev") });
    if (r.statusz !== 201) {
      const kod = hibaKod(r.torzs);
      if (kod === "NINCS_BELEPVE") { router.push("/belepes"); return; }
      setHiba(hibaSzoveg(t, kod)); setHibas(hibasMezok(r.torzs)); setFut(false);
      return;
    }
    // R-8: az első beállítás egy lapon
    router.push("/onboarding");
  }

  return (
    <>
      <KartyaFej cim={t("szervezet.cim_eleje")} kiemelt={t("szervezet.cim_kiemelt")} alcim={t("szervezet.alcim")} />
      <form className="km-urlap" onSubmit={kuld} noValidate>
        {hiba ? <Hibadoboz szoveg={hiba} /> : null}
        <Mezo azonosito="nev" cimke={t("szervezet.nev")} placeholder={t("szervezet.nev_pl")} autoComplete="organization" required
          sugo={t("szervezet.nev_sugo")} hibas={hibas.has("nev")} />
        <div className="km-lab">
          <button className="km-gomb" type="submit" disabled={fut}>{t("szervezet.gomb")}</button>
        </div>
      </form>
    </>
  );
}
