// R-15 · a Tibor-szabálylap alapelemei (design/R15/rajz/R15-szabalylap.dc.html, tokenek.md). Minden lap ezekből épül.
// Mindegyik a rajz `data-r15` jelölését viszi — ebből mér a Tibor-próba (tools/tibor-proba). Szöveget NEM tartalmaznak:
// a hívó adja, feliratkulcsból. Kiszolgálói és kliens-komponensből is használhatók (nincs bennük állapot).
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import "./r15.css";

/** T1 — a lap kérdése (≤ 6 szó) és alatta legfeljebb egy mondat. */
export function KerdesCim({ cim, alcim }: { cim: string; alcim?: string }) {
  return (
    <div>
      <h1 className="r15-kerdes" data-r15="kerdes">{cim}</h1>
      {alcim ? <p className="r15-kerdes-alcim" data-r15="kerdes-alcim">{alcim}</p> : null}
    </div>
  );
}

type GombAlap = { children: ReactNode; posztra?: boolean; osztaly?: string };
const o = (alap: string, osztaly?: string) => (osztaly ? `${alap} ${osztaly}` : alap);

/** T2 — a lap EGYETLEN fő gombja. `posztra`: kész posztszöveghez visz (T9). Linkként: `href`. */
export function FoGomb({ children, posztra, href, osztaly, ...tobbi }: GombAlap & ButtonHTMLAttributes<HTMLButtonElement> & { href?: string }) {
  const jel = { "data-r15": "fo-gomb", ...(posztra ? { "data-r15-cel": "poszt" } : {}) };
  if (href) return <a className={o("r15-fo-gomb", osztaly)} href={href} {...jel}>{children}</a>;
  return <button type="button" className={o("r15-fo-gomb", osztaly)} {...jel} {...tobbi}>{children}</button>;
}

/** T2 — halk, keretes gomb (másodlagos lépés). */
export function HalkGomb({ children, href, posztra, osztaly, ...tobbi }: GombAlap & ButtonHTMLAttributes<HTMLButtonElement> & { href?: string }) {
  const jel = posztra ? { "data-r15-cel": "poszt" } : {};
  if (href) return <a className={o("r15-halk-gomb", osztaly)} href={href} {...jel}>{children}</a>;
  return <button type="button" className={o("r15-halk-gomb", osztaly)} {...jel} {...tobbi}>{children}</button>;
}

/** T2 — halk, aláhúzott link: Részletek · Nem érdekel · Miért? */
export function HalkLink({ children, href, ...tobbi }: { children: ReactNode; href?: string } & ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href) return <a className="r15-halk-link" href={href}>{children}</a>;
  return <button type="button" className="r15-halk-link" {...(tobbi as ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}

/** T6 — teendő: kiemelt lap, benne mező vagy gomb. Teendőben NEM lehet másik teendő. */
export function Teendo({ cim, szoveg, children, linkek, osztaly }: { cim?: string; szoveg?: string; children?: ReactNode; linkek?: ReactNode; osztaly?: string }) {
  return (
    <section className={o("r15-teendo", osztaly)} data-r15="teendo">
      {cim ? <h2 className="r15-teendo-cim">{cim}</h2> : null}
      {szoveg ? <p className="r15-teendo-szoveg">{szoveg}</p> : null}
      {children}
      {linkek ? <div className="r15-teendo-linkek">{linkek}</div> : null}
    </section>
  );
}

/** T6 — tájékoztató sor: se keret, se háttér, se gomb. Ha nincs mit mondani, ne jelenjen meg. */
export function Info({ children, osztaly }: { children: ReactNode; osztaly?: string }) {
  return <p className={o("r15-info", osztaly)} data-r15="info">{children}</p>;
}

/** T8 — a heti haladás sora: sáv + „Ezen a héten: N poszt kész · M kép letöltve” (a szöveget a hívó adja). */
export function Halad({ arany, children, osztaly }: { arany: number; children: ReactNode; osztaly?: string }) {
  const szazalek = Math.max(0, Math.min(1, arany)) * 100;
  return (
    <div className={o("r15-halad", osztaly)} data-r15="halad">
      <span className="r15-halad-sav" aria-hidden="true"><span className="r15-halad-telt" style={{ width: `${szazalek}%` }} /></span>
      <span>{children}</span>
    </div>
  );
}

/** T8 — a befejezés pillanata: zöld ✓ és egy mondat („Kész a poszt. Ez a héten a negyedik.”). */
export function KeszPillanat({ children }: { children: ReactNode }) {
  return (
    <div className="r15-kesz" data-r15="kesz" role="status">
      <span className="r15-kesz-jel" aria-hidden="true">✓</span>
      <span>{children}</span>
    </div>
  );
}

/** T7 — valódi baj: egy mondat (mi a baj, mi a teendő) + KÖTELEZŐ gomb. Csak valódi bajnál. */
export function Baj({ szoveg, gomb }: { szoveg: string; gomb: ReactNode }) {
  return (
    <div className="r15-baj" data-r15="baj" role="alert">
      <p className="r15-baj-szoveg">{szoveg}</p>
      {gomb}
    </div>
  );
}

/** T5 — a „Részletek” / „Miért?” mögötti szöveg: nem számít bele a görgetés nélküli szószámba. */
export function Reszletek({ children }: { children: ReactNode }) {
  return <div data-r15="reszletek">{children}</div>;
}
