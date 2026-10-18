import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { MUNKAMENET_SUTI } from "@rogton/contracts";
import { betuCss, cssValtozok, modCss, NYELV_SUTI } from "@rogton/design-system";
import { feliratok, nyelvKeresbol } from "../nyelv";
import { FeliratokSzolgaltato } from "../nyelv/kliens";
import { hatasosNyelv } from "../nyelv/munkater";
import { aktualisFiok, aktualisSzervezet } from "../hitelesites";
import { hatasosTema } from "../tema";
import { semaFelismer } from "@rogton/design-system";
import { MOD_FEJ_SZKRIPT } from "./_kozos/mod";
import "./alap.css";
import "./r18.css";

// G5 (Rögtön): a fülikon és a telefonos ikon a » jelből (public/r18/ikon, public/favicon.ico — tools/kepernyokep/ikonok.mjs készíti).
// Tinta csempe neon jellel a sötét böngészőhöz, neon csempe tinta jellel a világoshoz. A manifest: app/manifest.ts.
export const metadata = {
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/r18/ikon/ikon-sotet-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/r18/ikon/ikon-vilagos-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/r18/ikon/apple-touch-icon.png", sizes: "180x180" }],
  },
};
export const dynamic = "force-dynamic";

// A tokenkészlet a HATÁSOS témából, a feliratok a HATÁSOS feliratokból jönnek (E-13/E-16, D-09): közös alap + a belépett ember szervezetének alkalmazott felülírásai;
// belépés előtt (regisztráció, belépés) a közös alap. A feliratok a kért nyelven (R-09, R-14).
// Komponensben nincs szín, betű, méret: minden a :root változóiból.
async function szervezetAzonosito(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const fiok = await aktualisFiok(token);
    return fiok ? (aktualisSzervezet(fiok)?.id ?? null) : null;
  } catch (hiba) {
    console.error("Szervezet a temahoz nem olvashato, a kozos alap megy:", hiba);
    return null;
  }
}

/** V1: nyelv-süti nélkül — belépett fióknál a hatásos nyelv, különben az Accept-Language. */
async function hatasosNyelvVagyBongeszo(token: string | undefined, acceptLanguage: string | null) {
  if (token) {
    try {
      const fiok = await aktualisFiok(token);
      if (fiok) {
        const nyelv = await hatasosNyelv(fiok, aktualisSzervezet(fiok)?.id ?? null);
        if (nyelv) return nyelv;
      }
    } catch (hiba) {
      console.error("Nyelv a fiokbol nem olvashato, a bongeszo nyelve megy:", hiba);
    }
  }
  return nyelvKeresbol(undefined, acceptLanguage);
}

export default async function Keret({ children }: { children: ReactNode }) {
  const [sutik, fejlecek] = await Promise.all([cookies(), headers()]);
  const sutiNyelv = sutik.get(NYELV_SUTI)?.value;
  const szervezetId = await szervezetAzonosito(sutik.get(MUNKAMENET_SUTI)?.value);
  // V1: a süti mindig nyer, ha van. Ha nincs, belépett fióknál a hatásos nyelv (fiók választása,
  // különben a munkatér első tartalomnyelve) az elsőbbség, és csak utána az Accept-Language.
  const nyelv = sutiNyelv
    ? nyelvKeresbol(sutiNyelv, fejlecek.get("accept-language"))
    : await hatasosNyelvVagyBongeszo(sutik.get(MUNKAMENET_SUTI)?.value, fejlecek.get("accept-language"));
  const [tokenek, f] = await Promise.all([hatasosTema(szervezetId), feliratok(nyelv, szervezetId)]);
  return (
    // R-18: a <html data-mod> jelölést a fej szkriptje teszi ki festés előtt (a böngésző választása / a készülék módja) —
    // a kiszolgáló ezt nem ismeri, ezért a jelölés eltérése nem hidratálási hiba (suppressHydrationWarning).
    <html lang={nyelv} data-sema={semaFelismer(tokenek as unknown as Partial<Record<string, string>>) ?? "sajat"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOD_FEJ_SZKRIPT }} />
        {/* G5: a Saira, a Saira Condensed és a JetBrains Mono saját kiszolgálásról (public/betuk) — a leggyakoribb három előre töltve */}
        <link rel="preload" href="/betuk/saira-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/betuk/saira-condensed-latin-700-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/betuk/jetbrains-mono-latin-500-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* A Google Fonts sor az arculat (cég) betűválasztójának mintáihoz marad (Sora, Archivo, Public Sans, …) — a felület betűi már nem innen jönnek. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&family=Archivo:wght@600;700&family=Public+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap"
        />
        <style id="km-betuk">{betuCss("/betuk")}</style>
        <style id="km-tokenek">{cssValtozok(tokenek)}</style>
        {/* R-18: a két mód (sötét / világos) — a hatásos készlet után, erősebb választóval (design-system modCss) */}
        <style id="km-modok">{modCss(tokenek)}</style>
      </head>
      <body>
        {/* R-18: a lélegző fényudvar — három elmosott folt, csak transform/opacity mozog; csökkentett mozgásnál áll */}
        <div className="km-aurora" aria-hidden="true"><span /><span /><span /></div>
        <FeliratokSzolgaltato f={f} nyelv={nyelv}>{children}</FeliratokSzolgaltato>
        {/* R-18 7. kör utókör (Csilla 10-12, élőben 1512 px): a lap VÉGE — a Visszajelzés gomb és a halvány aitmetica felirat ide kerül
            (portál). A body végére tett portált a kliensoldali lapváltás a fejléc és a tartalom ELÉ tette (a React az új lap elemeit a
            body ismert utolsó gyereke elé szúrja): ez a stabil, utolsó elem garantálja, hogy mindkettő a tartalom után álljon. */}
        <div id="km-lap-vege" className="km-lap-vege" />
      </body>
    </html>
  );
}
