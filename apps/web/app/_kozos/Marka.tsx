// R-18 (Csilla 10-11, 2. kör): a termékjel — a/t jel + a termék neve NAGYBETŰVEL (fejlec.termeknev) — EGY helyen, a belépett lapok felső
// sávjában és minden nyilvános / belépés előtti fejlécben (nyitólap, belépés, regisztráció, jelszó, első beállítás, meghívó, adatkezelés).
// A jel két képe (sötét / világos mód) egymáson; a CSS a <html data-mod> szerint mutatja az egyiket. A név alapvonala a jel „a” betűjének
// aljára ül (r18.css: align-items: baseline — a jel dobozának alja = az „a” alja, mérve: 153,5/155 sor). Kiszolgálói komponensből is hívható.
import Link from "next/link";

export function Jel() {
  return (
    <span className="r18-jel" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- díszkép, a public/r18 mappából, méretezés CSS-ből */}
      <img className="r18-jel-sotet" src="/r18/at-jel-szines.png" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="r18-jel-vilagos" src="/r18/at-jel-tinta.png" alt="" />
    </span>
  );
}

/** `href` nélkül nem link (a nyilvános fejlécekben a régi „K” jel sem volt az). `osztaly`: pl. a nevet telefonon elrejtő osztály a névre. */
export function Marka({ nev, href, cimke, osztaly, nevOsztaly }: { nev: string; href?: string; cimke?: string; osztaly?: string; nevOsztaly?: string }) {
  const cls = osztaly ? `r18-marka ${osztaly}` : "r18-marka";
  const belso = (
    <>
      <Jel />
      <span className={nevOsztaly ? `r18-marka-nev ${nevOsztaly}` : "r18-marka-nev"}>{nev}</span>
    </>
  );
  if (href) return <Link href={href} className={cls} aria-label={cimke}>{belso}</Link>;
  return <div className={cls}>{belso}</div>;
}
