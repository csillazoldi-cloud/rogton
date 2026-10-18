"use client";
import type { ArculatAllapot, MezoForras } from "@rogton/contracts";
import { useRef, type ChangeEvent } from "react";
import { useFeliratok } from "../../nyelv/kliens";

// A profil közös kliens-segédei (E-12b): a fiókoldal és az onboarding képernyői is ezt használják — egyik sem a másikét.
export type Allapot = "kesz" | "folyik" | "hiba" | "csend";

/** Hívás JSON-nal, tetszőleges módszerrel. Hálózati hiba: statusz 0. */
export async function hivas(ut: string, modszer: "GET" | "PUT" | "POST" | "DELETE", torzs?: unknown): Promise<{ statusz: number; torzs: Record<string, unknown> }> {
  try {
    const v = await fetch(ut, {
      method: modszer, credentials: "same-origin",
      ...(torzs === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(torzs) }),
    });
    let t: unknown = {};
    try { t = await v.json(); } catch { t = {}; }
    return { statusz: v.status, torzs: typeof t === "object" && t !== null ? (t as Record<string, unknown>) : {} };
  } catch {
    return { statusz: 0, torzs: {} };
  }
}

/** A mentés állapota a fejlécben (v6): pont + szöveg; hibánál „Újrapróbálás” gomb — az adatok megvannak. */
export function MentesAllapot({ allapot, mentveEkkor, ujra }: { allapot: Allapot; mentveEkkor: Date | null; ujra: () => void }) {
  const { t, nyelv } = useFeliratok();
  if (allapot === "csend") return <div className="km-ob-allapot" data-allapot="csend" role="status" />;
  let szoveg = "";
  if (allapot === "folyik") szoveg = t("onboarding.mentes_folyik");
  else if (allapot === "kesz") {
    let ido = "";
    try { ido = mentveEkkor ? new Intl.DateTimeFormat(nyelv, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Budapest" }).format(mentveEkkor) : ""; } catch { ido = ""; }
    szoveg = ido ? t("onboarding.mentve_ekkor", { t: ido }) : t("onboarding.mentes_kesz");
  } else szoveg = t("onboarding.mentes_hiba");
  return (
    <div className="km-ob-allapot" data-allapot={allapot} role="status" aria-live={allapot === "hiba" ? "assertive" : "polite"}>
      <span className="km-ob-allapot-pont" aria-hidden="true" />{szoveg}
      {allapot === "hiba" ? <button type="button" className="km-gomb-hiba km-gomb-hiba-kis" onClick={ujra}>{t("onboarding.ujraprobalas")}</button> : null}
    </div>
  );
}

/** A v6 „badge”: honnan jött az érték, és módosította-e. */
export function Jelveny({ forras, modositva, ures }: { forras: MezoForras; modositva?: boolean; ures?: boolean }) {
  const { t } = useFeliratok();
  const src = ures ? "" : forras;
  const szoveg = src === "" ? t("jelveny.ures") : t(`jelveny.${src}`) + (modositva && src !== "sajat" ? t("jelveny.modositva") : "");
  return <span className="km-jelveny-src" data-src={src}>{szoveg}</span>;
}

/** Az arculat állapotának neve (v6 brandStatusLabel). */
export function arculatAllapotSzoveg(allapot: ArculatAllapot, t: (kulcs: string) => string): string {
  return allapot === "jovahagyott" ? t("onboarding3.arc_jovahagyott") : allapot === "kesobb" ? t("onboarding3.arc_kesobb") : allapot === "tervezet" ? t("onboarding3.arc_tervezet") : t("onboarding3.arc_nincs");
}

export function nyelvNev(kod: string, felulet: string): string {
  try { return new Intl.DisplayNames([felulet], { type: "language" }).of(kod) ?? kod; } catch { return kod; }
}

/** Fájlnévbe illő szelet egy névből (ékezet nélkül, kötőjelekkel): „Minta Műhely” → „minta-muhely”. */
export function fajlnevSzelet(nev: string): string {
  const s = nev.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s || "szervezet";
}

/** JSON letöltése fájlként a böngészőből (E-17: export fájlba). */
export function fajltLetolt(nev: string, szoveg: string): void {
  const blob = new Blob([szoveg], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nev; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Fájlválasztó gomb (E-17: import fájlból): a kiválasztott .json szövegét adja vissza; a mezőt nem hagyja el a fájl. */
export function FajlValaszto({ cimke, className, disabled, beolvasva }: { cimke: string; className: string; disabled?: boolean; beolvasva: (szoveg: string, nev: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  function valtozik(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const olvaso = new FileReader();
    olvaso.onload = () => { beolvasva(typeof olvaso.result === "string" ? olvaso.result : "", f.name); e.target.value = ""; };
    olvaso.readAsText(f);
  }
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()} disabled={disabled}>{cimke}</button>
      <input ref={ref} type="file" accept=".json,application/json" onChange={valtozik} hidden aria-hidden="true" tabIndex={-1} />
    </>
  );
}

// A témalista bontása a JSX nélküli `temak.ts`-ben él (a tiszta próbák így JSX-átalakítás nélkül futtatják) — A2, 2026-09-30.
export { temakBont } from "./temak";
