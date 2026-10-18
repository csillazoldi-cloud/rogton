"use client";
// c30 F3 · a posztok nyelvi módja (rajz: c30 D5 „Hogyan posztoljunk két nyelven?” — első beállítás; D9b „Beállítások → Posztok nyelve”).
// Három pipás sor, egy választható (rádió): „Egy posztban mindkét nyelv” · „Külön posztok” · „Csak {első nyelven}”. A sorok alsó sora a
// szervezet nyelveiből épül (pl. „magyarul, alatta románul”), így egy román-első vagy egy román–német szervezetnek is a saját nyelveit mutatja.
// A pipa egy valódi gomb (rádió); a sor szövegére koppintva is választ (Tibor ujja a szövegre megy).
import type { PosztNyelvMod } from "@km/contracts";
import { useFeliratok } from "../../nyelv/kliens";
import { nyelvNev } from "./kliens";

const CIMKES: readonly string[] = ["hu", "ro", "en"];

function Pipa() {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

/** A nyelv neve melléknévként („magyar”, „román”, „német”) a felület nyelvén. */
export function useNyelvMn(): (kod: string) => string {
  const { t, nyelv } = useFeliratok();
  return (kod) => (CIMKES.includes(kod) ? t(`poszt.nyelv_${kod}`) : nyelvNev(kod, nyelv));
}

export function NyelvModValaszto({ nyelvek, mod, valt, tiltva = false }: { nyelvek: readonly string[]; mod: PosztNyelvMod; valt: (m: PosztNyelvMod) => void; tiltva?: boolean }) {
  const { t } = useFeliratok();
  const mn = useNyelvMn();
  const elso = nyelvek[0] ?? "hu", masodik = nyelvek[1] ?? "ro";
  const hat = (k: string) => t(`nyelv.hatarozo.${k}`);
  const sorok: { mod: PosztNyelvMod; cim: string; al: string }[] = [
    { mod: "egyben", cim: t("c30.nyelvmod.egyben"), al: t("c30.nyelvmod.egyben_al", { elso: hat(elso), masodik: hat(masodik) }) },
    { mod: "kulon", cim: t("c30.nyelvmod.kulon"), al: t("c30.nyelvmod.kulon_al", { elso_mn: mn(elso), masodik_mn: mn(masodik) }) },
    { mod: "egy", cim: t("c30.nyelvmod.egy", { elso: hat(elso) }), al: t("c30.nyelvmod.egy_al", { masodik_mn: mn(masodik) }) },
  ];
  return (
    <div className="r18k7-lista" role="radiogroup" aria-label={t("c30.nyelvmod.cim")}>
      {sorok.map((s) => (
        <div key={s.mod} className="r18k7-sor">
          <button type="button" className="r18k7-pipa" role="radio" aria-checked={mod === s.mod} aria-label={s.cim} disabled={tiltva} onClick={() => valt(s.mod)}>{mod === s.mod ? <Pipa /> : null}</button>
          <span className="r18k7-sor-szoveg c30-sor-szoveg" onClick={() => { if (!tiltva) valt(s.mod); }}>{s.cim}<small>{s.al}</small></span>
        </div>
      ))}
    </div>
  );
}
