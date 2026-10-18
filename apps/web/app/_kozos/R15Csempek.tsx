"use client";
// R-15 c5 3. kör (design/R15/rajz/R15-lapok-6.dc.html 03bT · 03cT · 03c2T · 03jT; gepezet-6; Csilla 10-10 21:02): a Kezdőlap tetején a négy
// munkalap csempéje — Hírek · Posztszöveg · Képek · Iránytű. Halk linkek (nem gombok, se jelvény, se szám — T2/T6). Asztalon egy sor,
// ikon + név egy vonalban, a Hírek csempén a „mikor kerestünk utoljára” (a régi „Legutóbb …” sor helyett); telefonon négy kis csempe,
// ikon fölül, név alatta, idő nélkül. `<div role="navigation">`, NEM `<nav>`: a csempék a lap tartalmához tartoznak (a Tibor-próba
// a `<nav>`-ot a felső sávnak veszi és kihagyja — így számolnak a T5 szavai közé, ahogy a rajzon is).
import Link from "next/link";
import { useFeliratok } from "../../nyelv/kliens";
import { R15Ikon, type R15IkonNev } from "./R15Ikon";

const CSEMPEK: readonly { href: string; kulcs: string; ikon: R15IkonNev }[] = [
  { href: "/hirfigyelo", kulcs: "r15.nav.hirek", ikon: "hirek" },
  { href: "/poszt", kulcs: "r15.nav.poszt", ikon: "poszt" },
  { href: "/kepek", kulcs: "r15.nav.kepek", ikon: "kepek" },
  { href: "/iranytu", kulcs: "r15.nav.iranytu", ikon: "iranytu" },
];

export function R15Csempek({ hirekIdo }: { hirekIdo?: string | null }) {
  const { t } = useFeliratok();
  return (
    <div role="navigation" aria-label={t("r15.kezdolap.csempek")} className="r15-csempek" data-r15="csempek">
      {CSEMPEK.map((c) => (
        <Link key={c.href} href={c.href} className="r15-csempe">
          <span className="r15-csempe-ikon"><R15Ikon nev={c.ikon} /></span>
          <span className="r15-csempe-nev">{t(c.kulcs)}</span>
          {c.ikon === "hirek" && hirekIdo ? <span className="r15-csempe-ido r15-csak-asztal">{hirekIdo}</span> : null}
        </Link>
      ))}
    </div>
  );
}
