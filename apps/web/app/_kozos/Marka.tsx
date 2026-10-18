// G5 (Rögtön, 2026-10-18): a termékjel — a gyorsmedia „»” jele (két ferde háromszög, skewX(−12), a gyorsmedia-favicon geometriája) és a
// „Rögtön” szóvédjegy Saira Condensed ExtraBold betűvel, −12°-os dőléssel, KÖRVONALAKKÁ alakítva (így nem függ a betű betöltésétől).
// A két rész KÜLÖN svg ugyanazzal a függőleges kerettel (y 44–148, a nagybetű 74 egység = a jel magassága), így a név elrejthető
// (`nevOsztaly`, telefonon) és a jel magában is áll. A jel színe a `--marka-jel` token (sötétben neon, világosban tinta), a névé a
// szöveg színe. A végleges logó cseréje: CSAK ez a fájl (JEL_* és NEV_* állandók).
import Link from "next/link";

/** a » jel: a gyorsmedia-logó két sokszöge (eredeti koordináták), a közös függőleges keretben */
const JEL_VIEWBOX = "40 44 112 104";
const JEL_SOKSZOGEK = ["70,52 70,126 114,89", "101,52 101,126 145,89"];
/** a „Rögtön” szó körvonala (Saira Condensed 800, 1000 egység/em; a betű y-tengelye felfelé nő — ezért a −y skála) */
const NEV_VIEWBOX = "152 44 292 104";
const NEV_TRANSZFORM = "translate(186,124) scale(0.104,-0.104)";
const NEV_UT = "M318 0L257 232L206 232L206 0L46 0L46 688L288 688Q363 688 402 663Q441 638 454 590Q467 542 467 460Q467 384 454.5 335.5Q442 287 404 262L483 0ZM248 365Q277 365 288 370.5Q299 376 303 394.5Q307 413 307 459Q307 505 303.5 523Q300 541 288.5 546.5Q277 552 248 552L206 552L206 365L248 365Z M719 -8Q630 -8 590.5 14Q551 36 539.5 88Q528 140 528 255Q528 370 539.5 422Q551 474 590.5 496Q630 518 719 518Q808 518 847 496Q886 474 897.5 422Q909 370 909 255Q909 140 897.5 88Q886 36 847 14Q808 -8 719 -8ZM719 113Q741 113 748.5 120.5Q756 128 758.5 155Q761 182 761 255Q761 328 758.5 355Q756 382 748.5 389.5Q741 397 719 397Q697 397 689 389.5Q681 382 679 355.5Q677 329 677 255Q677 181 679 154.5Q681 128 689 120.5Q697 113 719 113ZM569 619L569 729L694 729L694 619ZM746 619L746 729L871 729L871 619Z M1148 -205Q1110 -205 1069 -202Q1028 -199 1001 -194L1001 -84L1111 -85Q1156 -85 1172.5 -78.5Q1189 -72 1193.5 -52.5Q1198 -33 1198 20L1198 65L1190 65Q1178 33 1153.5 19Q1129 5 1091 5Q1043 5 1016.5 28.5Q990 52 978.5 107Q967 162 967 262Q967 364 979 419Q991 474 1017.5 496Q1044 518 1092 518Q1126 518 1153 503Q1180 488 1192 452L1201 452L1205 510L1347 510L1347 58Q1347 -45 1336 -97Q1325 -149 1282.5 -177Q1240 -205 1148 -205ZM1157 134Q1175 134 1182.5 139Q1190 144 1194 161Q1197 173 1197.5 199.5Q1198 226 1198 261Q1198 336 1195 354Q1191 375 1183 381.5Q1175 388 1157 388Q1136 388 1128 381.5Q1120 375 1118 351.5Q1116 328 1116 261Q1116 195 1118.5 171Q1121 147 1128.5 140.5Q1136 134 1157 134Z M1460 0L1460 389L1400 389L1400 510L1460 510L1460 658L1610 658L1610 510L1689 510L1689 389L1610 389L1610 0Z M1917 -8Q1828 -8 1788.5 14Q1749 36 1737.5 88Q1726 140 1726 255Q1726 370 1737.5 422Q1749 474 1788.5 496Q1828 518 1917 518Q2006 518 2045 496Q2084 474 2095.5 422Q2107 370 2107 255Q2107 140 2095.5 88Q2084 36 2045 14Q2006 -8 1917 -8ZM1917 113Q1939 113 1946.5 120.5Q1954 128 1956.5 155Q1959 182 1959 255Q1959 328 1956.5 355Q1954 382 1946.5 389.5Q1939 397 1917 397Q1895 397 1887 389.5Q1879 382 1877 355.5Q1875 329 1875 255Q1875 181 1877 154.5Q1879 128 1887 120.5Q1895 113 1917 113ZM1767 619L1767 729L1892 729L1892 619ZM1944 619L1944 729L2069 729L2069 619Z M2402 274Q2402 333 2400 354.5Q2398 376 2391 382Q2384 388 2364 388Q2344 388 2336.5 380Q2329 372 2327 347Q2325 322 2325 258L2325 0L2176 0L2176 510L2319 510L2323 451L2331 451Q2357 518 2440 518Q2487 518 2511 499Q2535 480 2543 442Q2551 404 2551 337L2551 0L2402 0Z";

export function Jel() {
  return (
    <span className="r18-jel" aria-hidden="true">
      <svg viewBox={JEL_VIEWBOX} focusable="false">
        <g transform="skewX(-12)">{JEL_SOKSZOGEK.map((p) => <polygon key={p} points={p} className="r18-jel-alak" />)}</g>
      </svg>
    </span>
  );
}

function Nev({ osztaly }: { osztaly?: string | undefined }) {
  return (
    <span className={osztaly ? `r18-marka-nev ${osztaly}` : "r18-marka-nev"} aria-hidden="true">
      <svg viewBox={NEV_VIEWBOX} focusable="false">
        <g transform="skewX(-12)"><path transform={NEV_TRANSZFORM} d={NEV_UT} className="r18-nev-alak" /></g>
      </svg>
    </span>
  );
}

/** `href` nélkül nem link. `nev`: a termék neve (fejlec.termeknev) — a képernyőolvasó ezt mondja; a rajzolt szóvédjegy fix. */
export function Marka({ nev, href, cimke, osztaly, nevOsztaly }: { nev: string; href?: string; cimke?: string; osztaly?: string; nevOsztaly?: string }) {
  const cls = osztaly ? `r18-marka ${osztaly}` : "r18-marka";
  const belso = (
    <>
      <Jel />
      <Nev osztaly={nevOsztaly} />
    </>
  );
  if (href) return <Link href={href} className={cls} aria-label={cimke ?? nev}>{belso}</Link>;
  return <div className={cls} role="img" aria-label={nev}>{belso}</div>;
}
