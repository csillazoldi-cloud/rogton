"use client";
import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { NYELVEK } from "@rogton/design-system";
import { useFeliratok } from "../../nyelv/kliens";
import { apiHivas } from "./hibaszoveg";

/** `rovid`: a nyitólap telefonos fejlécében a rajz HU/RO/EN rövidítést kér (E-41).\n * Nyelvválasztó a fejlécben (E-4) — a fiókprofil oldalsávjában más osztállyal (E-17b). Váltáskor a lap kiszolgálói része frissül, a kitöltött mezők megmaradnak. */
export function Nyelvvalaszto({ className = "km-nyelv", rovid = false }: { className?: string; rovid?: boolean } = {}) {
  const { t, nyelv } = useFeliratok();
  const router = useRouter();
  const [fut, setFut] = useState(false);
  async function valt(e: ChangeEvent<HTMLSelectElement>) {
    setFut(true);
    await apiHivas("/api/nyelv", { nyelv: e.target.value });
    router.refresh();
    setFut(false);
  }
  return (
    <select className={className} aria-label={t("kozos.nyelv")} value={nyelv} onChange={valt} disabled={fut}>
      {NYELVEK.map((ny) => (
        <option key={ny} value={ny}>{rovid ? ny.toUpperCase() : t(`nyelv.${ny}`)}</option>
      ))}
    </select>
  );
}
