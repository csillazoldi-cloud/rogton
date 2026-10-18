"use client";
import Link from "next/link";
import { useFeliratok } from "../../nyelv/kliens";

/**
 * E-50: a rendszergazda-lapok közös navigációja (Theme · Feliratok · Költség · Fiókok).
 * Eddig a négy lap nem tudott egymásról: URL-t kellett beírni. A rajz szerint a fejlécben van,
 * az aktuális lap kiemelve. CSAK rendszergazdának jelenik meg — a lapok maguk is azt ellenőrzik.
 */
export type GazdaLap = "tema" | "feliratok" | "koltseg" | "fiokok";

const LAPOK: { lap: GazdaLap; ut: string; kulcs: string }[] = [
  { lap: "tema", ut: "/tema", kulcs: "gazdanav.tema" },
  { lap: "feliratok", ut: "/feliratok", kulcs: "gazdanav.feliratok" },
  { lap: "koltseg", ut: "/koltseg", kulcs: "gazdanav.koltseg" },
  { lap: "fiokok", ut: "/fiokok", kulcs: "gazdanav.fiokok" },
];

export function GazdaNav({ itt }: { itt: GazdaLap }) {
  const { t } = useFeliratok();
  return (
    <nav className="km-gnav" aria-label={t("gazdanav.rendszergazda")}>
      {LAPOK.map((l) =>
        l.lap === itt ? (
          <span key={l.lap} className="km-gnav-elem" aria-current="page">{t(l.kulcs)}</span>
        ) : (
          <Link key={l.lap} className="km-gnav-elem" href={l.ut}>{t(l.kulcs)}</Link>
        ),
      )}
    </nav>
  );
}
