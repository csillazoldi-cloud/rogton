"use client";
// R-18 (rajz: Mod-valto.dc.html; IRANYOK.md „Mode switch — spec”): a sötét / világos mód váltója.
//   gomb — asztali felső sáv, a harang bal oldalán: 44×44 ikon, azt a módot mutatja, AMIT KAPSZ (sötétben nap, világosban hold).
//   sor  — telefonos ☰ lap utolsó menüsora: hold ikon · „Sötét mód” · a meglévő kapcsoló-minta (role="switch").
// Mindkettő ugyanazt a modBeallit()-ot hívja, és egymásnak eseménnyel szól. Első betöltéskor a fej szkriptje már kitette a jelölést;
// amíg a komponens nem olvasta ki, a sötét módot feltételezi (a két ikont a CSS a jelölésből választja, így nincs villanás).
import { useEffect, useState } from "react";
import type { Mod } from "@km/design-system";
import { useFeliratok } from "../../nyelv/kliens";
import { MOD_ESEMENY, aktualisMod, modBeallit, taroltMod } from "./mod";

function useMod(): [Mod, () => void] {
  const [mod, setMod] = useState<Mod>("sotet");
  useEffect(() => {
    setMod(aktualisMod());
    const figyel = (e: Event) => setMod((e as CustomEvent<Mod>).detail);
    window.addEventListener(MOD_ESEMENY, figyel);
    // Ha a felhasználó még nem választott, a készülék váltását követjük (pl. esti automatikus sötét mód).
    let mq: MediaQueryList | null = null;
    const keszulek = () => { if (!taroltMod() && mq) modBeallit(mq.matches ? "vilagos" : "sotet", { tarol: false }); };
    try { mq = window.matchMedia("(prefers-color-scheme: light)"); mq.addEventListener("change", keszulek); } catch { mq = null; }
    return () => { window.removeEventListener(MOD_ESEMENY, figyel); mq?.removeEventListener("change", keszulek); };
  }, []);
  return [mod, () => modBeallit(mod === "sotet" ? "vilagos" : "sotet")];
}

const Nap = () => (
  <svg className="r18-ik-nap" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </svg>
);
const Hold = ({ osztaly = "r18-ik-hold", meret = 22 }: { osztaly?: string; meret?: number }) => (
  <svg className={osztaly} width={meret} height={meret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);

export function ModValto({ valtozat }: { valtozat: "gomb" | "sor" }) {
  const { t } = useFeliratok();
  const [mod, valt] = useMod();
  if (valtozat === "sor") {
    return (
      <button type="button" className="r18-menu-sor r18-mod-sor" role="switch" aria-checked={mod === "sotet"} onClick={valt}>
        <Hold osztaly="r18-menu-ikon" meret={20} />
        <span>{t("mod.sotet")}</span>
        <span className="r18-kapcsolo" aria-hidden="true" />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="r18-mod-gomb"
      aria-label={mod === "sotet" ? t("mod.valto.vilagosra") : t("mod.valto.sotetre")}
      title={mod === "sotet" ? t("mod.vilagos") : t("mod.sotet")}
      onClick={valt}
    >
      <Nap />
      <Hold />
    </button>
  );
}
