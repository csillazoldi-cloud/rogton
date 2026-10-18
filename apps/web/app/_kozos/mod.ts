// R-18 (2026-10-11): sötét / világos mód — a böngészőben tárolt választás és a lap fejének szkriptje.
// A választás CSAK a böngészőben él (localStorage `km-mod`), szerverre nem kerül. G5 (Rögtön): ha nincs választás, a SÖTÉT mód az alap
// (a készülék beállítása nem dönt) — a termék arculata sötét.
// A szkript a <head>-ben fut, festés ELŐTT teszi ki a <html data-mod> jelölést — így nincs rossz színű villanás betöltéskor.
import { MOD_TAROLO, MOD_VALTAS_MS, type Mod } from "@rogton/design-system";

/** A fej szkriptje (sorban, festés előtt). A tároló hibája (privát ablak, tiltott süti) nem baj: akkor a készülék dönt. */
export const MOD_FEJ_SZKRIPT = `(function(){var d=document.documentElement,m=null;try{m=window.localStorage.getItem(${JSON.stringify(MOD_TAROLO)})}catch(e){}if(m!=="sotet"&&m!=="vilagos"){m="sotet"}d.setAttribute("data-mod",m)})();`;

/** Az esemény, amivel a két váltó (asztali gomb, telefonos sor) egymásnak szól. */
export const MOD_ESEMENY = "km-mod-valt";

export function aktualisMod(): Mod {
  if (typeof document === "undefined") return "sotet";
  return document.documentElement.getAttribute("data-mod") === "vilagos" ? "vilagos" : "sotet";
}

export function taroltMod(): Mod | null {
  try {
    const m = window.localStorage.getItem(MOD_TAROLO);
    return m === "sotet" || m === "vilagos" ? m : null;
  } catch {
    return null;
  }
}

let idozito: ReturnType<typeof setTimeout> | undefined;

/** Mód beállítása: a színek ~250 ms alatt átúsznak (csökkentett mozgásnál azonnal), a választás a böngészőben marad. */
export function modBeallit(uj: Mod, { tarol = true }: { tarol?: boolean } = {}): void {
  const d = document.documentElement;
  let csendes = false;
  try { csendes = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* nincs matchMedia: van átúszás */ }
  if (!csendes) {
    d.classList.add("mod-valt");
    if (idozito) clearTimeout(idozito);
    idozito = setTimeout(() => d.classList.remove("mod-valt"), MOD_VALTAS_MS + 60);
  }
  d.setAttribute("data-mod", uj);
  if (tarol) {
    try { window.localStorage.setItem(MOD_TAROLO, uj); } catch { /* a választás csak erre a lapra szól */ }
  }
  window.dispatchEvent(new CustomEvent(MOD_ESEMENY, { detail: uj }));
}
