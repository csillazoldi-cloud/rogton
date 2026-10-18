"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Hibadoboz, KartyaFej, Mezo } from "../_kozos/Keretek";
import { apiHivas, hibaKod, hibaSzoveg, hibasMezok } from "../_kozos/hibaszoveg";
import { useFeliratok } from "../../nyelv/kliens";

export function VisszaallitasUrlap({ jegy }: { jegy: string }) {
  const router = useRouter();
  const { t } = useFeliratok();
  const [hiba, setHiba] = useState<string | null>(null);
  const [hibas, setHibas] = useState<Set<string>>(new Set());
  const [fut, setFut] = useState(false);
  const [kesz, setKesz] = useState(false);

  async function kuld(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFut(true); setHiba(null); setHibas(new Set());
    const adat = new FormData(e.currentTarget);
    const jelszo = String(adat.get("jelszo") ?? "");
    const megegyszer = String(adat.get("megegyszer") ?? "");
    if (jelszo !== megegyszer) {
      setHiba(t("visszaallitas.nem_egyezik"));
      setHibas(new Set(["megegyszer"]));
      setFut(false);
      return;
    }
    const r = await apiHivas("/api/fiok/jelszo-visszaallitas", { jegy, jelszo });
    if (r.statusz !== 200) {
      setHiba(hibaSzoveg(t, hibaKod(r.torzs)));
      setHibas(hibasMezok(r.torzs));
      setFut(false);
      return;
    }
    setKesz(true);
    setFut(false);
    // A régi belépések érvényüket vesztették, ezért a belépőlapra visszük.
    setTimeout(() => router.push("/belepes"), 2500);
  }

  if (jegy === "") {
    return (
      <>
        <KartyaFej cim={t("visszaallitas.cim_eleje")} kiemelt={t("visszaallitas.cim_kiemelt")} alcim={t("visszaallitas.alcim")} />
        <Hibadoboz szoveg={t("visszaallitas.nincs_jegy")} />
      </>
    );
  }

  if (kesz) {
    return (
      <>
        <KartyaFej cim={t("visszaallitas.cim_eleje")} kiemelt={t("visszaallitas.cim_kiemelt")} alcim={t("visszaallitas.kesz")} />
      </>
    );
  }

  return (
    <>
      <KartyaFej cim={t("visszaallitas.cim_eleje")} kiemelt={t("visszaallitas.cim_kiemelt")} alcim={t("visszaallitas.alcim")} />
      <form className="km-urlap" onSubmit={kuld} noValidate>
        {hiba ? <Hibadoboz szoveg={hiba} /> : null}
        <Mezo azonosito="jelszo" cimke={t("visszaallitas.uj_jelszo")} type="password" placeholder="••••••••••" autoComplete="new-password" required hibas={hibas.has("jelszo")} />
        <Mezo azonosito="megegyszer" cimke={t("visszaallitas.megegyszer")} type="password" placeholder="••••••••••" autoComplete="new-password" required hibas={hibas.has("megegyszer")} />
        <div className="km-lab">
          <button className="km-gomb" type="submit" disabled={fut}>{t("visszaallitas.gomb")}</button>
        </div>
      </form>
    </>
  );
}
