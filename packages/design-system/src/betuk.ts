// G5 (Rögtön, 2026-10-18): a felület betűi SAJÁT kiszolgálásról — Saira Condensed 600/700 (címek), Saira 400/500/600/700 (szöveg),
// JetBrains Mono 400/500 (menü, gombok, címkék — a kód-betű marad). Latin + latin-ext, hogy az ő ű is ebből a betűből jöjjön (a
// fej nélküli böngészőben is). Futás közben semmi nem megy a Google Fontshoz. A fájlok: apps/web/public/betuk/ (fontsource 5.3.0,
// SIL OFL 1.1 — a licencek ott). A tartományok a Google Fonts latin / latin-ext felosztása.

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

/** A három család és a kiszolgált vastagságok (fájlnév-előtag → CSS családnév). */
export const R18_BETUK: readonly { csalad: string; elotag: string; vastagsagok: readonly number[] }[] = [
  { csalad: "Saira", elotag: "saira", vastagsagok: [400, 500, 600, 700] },
  { csalad: "Saira Condensed", elotag: "saira-condensed", vastagsagok: [600, 700] },
  { csalad: "JetBrains Mono", elotag: "jetbrains-mono", vastagsagok: [400, 500] },
];

/** A betűfájlok neve a public/betuk mappában (a próba ezzel nézi, hogy mind megvan). */
export function r18BetuFajlok(): string[] {
  return R18_BETUK.flatMap((b) => b.vastagsagok.flatMap((v) => [`${b.elotag}-latin-${v}-normal.woff2`, `${b.elotag}-latin-ext-${v}-normal.woff2`]));
}

/** A @font-face szabályok szövege (a lap feje teszi ki). `ut`: a betűfájlok webes mappája. */
export function betuCss(ut = "/betuk"): string {
  return R18_BETUK.flatMap((b) => b.vastagsagok.flatMap((v) => [
    [LATIN_EXT, `${b.elotag}-latin-ext-${v}-normal.woff2`],
    [LATIN, `${b.elotag}-latin-${v}-normal.woff2`],
  ].map(([tartomany, fajl]) => `@font-face{font-family:'${b.csalad}';font-style:normal;font-weight:${v};font-display:swap;src:url(${ut}/${fajl}) format('woff2');unicode-range:${tartomany}}`))).join("");
}
