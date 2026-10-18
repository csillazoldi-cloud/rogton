// A HOST letöltő csatlakozója.
// E-29 óta a VALÓDI letöltő a közös `@km/letolto` csomagból jön — ugyanaz, amit a webalkalmazás használ (A-12: nincs másolat).
// A rögzített letöltő megmarad a próbákhoz és a hálózat nélküli bemutatóhoz; a `profil.json` `letolto` mezője választ.
import { letoltoHiv } from "@km/letolto";
import type { Letolto } from "@km/news-monitor-core";

// 2026-09-22: a minta-cikkek ideje a MOSTHOZ képest (a mag 48 órás frissességi szűrője miatt a rögzített dátumok
// szeptember 5-e óta minden cikket kiszűrtek, és a referencia-próba elbukott).
function oraval(ora: number): string {
  return new Date(Date.now() + ora * 3_600_000).toISOString();
}

const MINTA_CIKKEK = [
  {
    cim: "Új kézműves bútor kollekció a Minta Műhelytől",
    url: "https://pelda.hu/cikk/1",
    megjelenes: oraval(-30),
    szoveg: "A Minta Műhely bemutatta új kézműves bútor kollekcióját, amely tölgyfából készült, marosvásárhelyi műhelyében.",
    nyelv: "hu",
  },
  {
    cim: "Új kézműves bútor kollekció érkezett a Minta Műhelytől",
    url: "https://pelda.hu/cikk/2",
    megjelenes: oraval(-29),
    szoveg: "A Minta Műhely új kollekciója tölgyfa bútorokkal bővült, kézműves technikával készült darabokkal.",
    nyelv: "hu",
  },
  {
    cim: "Asztalos műhely látogatóknak",
    url: "https://pelda.hu/cikk/3",
    megjelenes: oraval(-20),
    szoveg: "A Minta Műhely asztalos műhelye látogatható, ahol a bútorok készítését lehet megtekinteni.",
    nyelv: "hu",
  },
  {
    cim: "Fenntartható faanyag a bútoriparban",
    url: "https://pelda.hu/cikk/4",
    megjelenes: oraval(-6),
    szoveg: "A fenntartható faanyag egyre fontosabb a bútoriparban; a beszerzés és a tanúsítás kérdései kerültek elő.",
    nyelv: "hu",
  },
];

/** Rögzített letöltő: a „https://pelda.hu/feed” a minta-cikkeket adja, a „hibas.” kezdetű cím időtúllépést, minden más ismeretlen hibát. */
export const rogzitettLetolto: Letolto = async (f) => {
  if (f.cim.includes("pelda.hu/feed")) {
    return { ok: true, tipus: "rss", szovegOlvashato: true, cikkek: MINTA_CIKKEK };
  }
  if (f.cim.includes("hibas.")) {
    return { ok: false, hibaOk: "időtúllépés" };
  }
  return { ok: false, hibaOk: "ismeretlen" };
};

/** A valódi letöltő: a közös csomag — SSRF-védelem, robots.txt, RSS/Atom. */
export const valodiLetolto: Letolto = async (f) => letoltoHiv({ cim: f.cim, tipus: f.tipus });

export function letoltoValaszt(fajta: "rogzitett" | "valodi"): Letolto {
  return fajta === "valodi" ? valodiLetolto : rogzitettLetolto;
}
