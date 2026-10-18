"use client";
import { useRouter } from "next/navigation";
import { apiHivas } from "../../_kozos/hibaszoveg";
import { useFeliratok } from "../../../nyelv/kliens";

export function KilepesGomb() {
  const router = useRouter();
  const { t } = useFeliratok();
  async function kilep() {
    await apiHivas("/api/fiok/kilepes");
    router.push("/belepes");
    router.refresh();
  }
  return (
    <button className="km-gomb-szellem" type="button" onClick={kilep}>{t("kozos.kilepes")}</button>
  );
}
