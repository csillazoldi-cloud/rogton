"use client";
// R-18 8. kör · Beállítások (Csilla 10-14; Claude Design „Round 8 · A sötét / B világos”, round8/shot-*-r8-beallitasok-*):
// a beállítások EGY helyen. Asztalon bal oldali lista (fiók-kártya + négy csoport), mellette a kiválasztott rész (Értesítések, Adatkezelés);
// telefonon a /beallitasok maga a lista, egy sorra koppintva a rész nyílik („‹ Beállítások” vissza). Csak átrendezés: minden sor egy MEGLÉVŐ
// lapra vagy fülre visz (Szervezet adatai /fiok, Iránytű, Tagok, Megjelenés /tema, Visszajelzéseim, Gépház) — semmi nem tűnt el, és a Profil
// menü rövidítései is maradnak (zárt válasz 4). A sorok ugyanazzal a feltétellel látszanak, mint eddig a menüben.
import Link from "next/link";
import type { FelsoSavAdat } from "../../kezdolap/tipusok";
import { useFeliratok } from "../../nyelv/kliens";
import { R15Ikon, type R15IkonNev } from "../_kozos/R15Ikon";

export type BeallitasResz = "ertesitesek" | "adatpolitika" | "nyelv";

type Sor = { kulcs: string; href: string; ikon: R15IkonNev; cimke: string; jel?: string | undefined; aktiv?: boolean };

/** `posztokNyelve`: c30 F3 (rajz D9b) — a „Posztok nyelve” sor, csak 2+ nyelvű szervezetnél és szerkesztőnek (a page dönti el). */
export function BeallitasokMenu({ sav, szervezetNev, aktiv, posztokNyelve = false }: { sav: FelsoSavAdat; szervezetNev: string; aktiv: BeallitasResz | null; posztokNyelve?: boolean }) {
  const { t } = useFeliratok();
  const tulajVagyAdmin = sav.szerep === "tulajdonos" || sav.fiok.rendszergazda;
  const csoportok: Sor[][] = [
    [
      { kulcs: "szervezet", href: "/fiok", ikon: "szervezet", cimke: t("r15.nav.szervezet") },
      ...(posztokNyelve ? [{ kulcs: "nyelv", href: "/beallitasok?ful=nyelv", ikon: "szoveg" as const, cimke: t("c30.beall.posztok_nyelve"), aktiv: aktiv === "nyelv" }] : []),
      { kulcs: "iranytu", href: "/iranytu", ikon: "iranytu", cimke: t("r15.nav.iranytu") },
      ...(sav.tagok ? [{ kulcs: "tagok", href: "/tagok", ikon: "csapat" as const, cimke: t("nav.tagok"), jel: String(sav.tagok.n) }] : []),
    ],
    [
      { kulcs: "ertesitesek", href: "/beallitasok?ful=ertesitesek", ikon: "harang", cimke: t("nav.ertesitesek"), jel: sav.ertesites_olvasatlan > 0 ? t("r18.beall.uj_db", { n: sav.ertesites_olvasatlan }) : undefined, aktiv: aktiv === "ertesitesek" },
      ...(tulajVagyAdmin ? [{ kulcs: "megjelenes", href: "/tema", ikon: "hold" as const, cimke: t("tema.cim") }] : []),
    ],
    [
      { kulcs: "adatkezeles", href: "/beallitasok?ful=adatpolitika", ikon: "pajzs", cimke: t("beallitasok.ful_adatpolitika"), aktiv: aktiv === "adatpolitika" },
      ...(sav.gephaz ? [{ kulcs: "visszajelzes", href: "/visszajelzes", ikon: "buborek" as const, cimke: t("r18.beall.visszajelzeseim") }] : []),
    ],
    sav.gephaz ? [{ kulcs: "gephaz", href: "/gephaz", ikon: "fogaskerek", cimke: t("r18.beall.gephaz"), jel: t("r18.beall.admin") }] : [],
  ];
  const monogram = sav.fiok.nev.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => Array.from(s)[0]?.toLocaleUpperCase("hu") ?? "").join("");
  return (
    <nav className="r18b-menu" aria-label={t("r15.nav.beallitasok")}>
      <Link href="/sajat-fiok" className="r18b-fiok">
        <span className="r18b-monogram" aria-hidden="true">{monogram}</span>
        <span className="r18b-fiok-szoveg">
          <span className="r18b-fiok-nev">{sav.fiok.nev}</span>
          <span className="r18b-fiok-al">{t("r18.beall.sajat_fiok_al", { szervezet: szervezetNev })}</span>
        </span>
        <span className="r18b-nyil" aria-hidden="true">›</span>
      </Link>
      {csoportok.filter((c) => c.length > 0).map((c, i) => (
        <div key={i} className="r18b-csoport">
          {c.map((s) => (
            <Link key={s.kulcs} href={s.href} className={s.aktiv ? "r18b-sor r18b-sor-aktiv" : "r18b-sor"} aria-current={s.aktiv ? "page" : undefined}>
              <span className="r18b-ikon" aria-hidden="true"><R15Ikon nev={s.ikon} meret={16} /></span>
              <span className="r18b-sor-nev">{s.cimke}</span>
              {s.jel ? <span className="r18b-jel">{s.jel}</span> : null}
              <span className="r18b-nyil" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
