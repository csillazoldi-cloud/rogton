import type { Nyelv } from "@km/news-monitor-feliratok";
import { STILUS } from "./stilus.js";

export function htmlBiztos(szoveg: string): string {
  return szoveg
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function lap(f: {
  cim: string;
  nyelv: Nyelv;
  aktiv: "talalatok" | "beallitas";
  tartalom: string;
  tokenekCss: string;
  /** A felület feliratai — a fejléc és a menü is a KÖZÖS felirat-csomagból jön, nem beégetve. */
  feliratok: (kulcs: string, ertekek?: Record<string, string | number>) => string;
  /** Útvonal-előtag (pl. "/referencia"), ha a host nem a gyökéren felel. Üres = gyökér. */
  alapUt?: string;
}): string {
  const alapUt = f.alapUt ?? "";
  const nyelvAttr = f.nyelv === "hu" ? "hu" : f.nyelv === "ro" ? "ro" : "en";
  const aktivTalalatok = f.aktiv === "talalatok" ? " aktiv" : "";
  const aktivBeallitas = f.aktiv === "beallitas" ? " aktiv" : "";
  const huAktiv = f.nyelv === "hu" ? " aktiv" : "";
  const roAktiv = f.nyelv === "ro" ? " aktiv" : "";
  const enAktiv = f.nyelv === "en" ? " aktiv" : "";

  return `<!doctype html>
<html lang="${nyelvAttr}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${htmlBiztos(f.cim)}</title>
<style>
${f.tokenekCss}
${STILUS}
</style>
</head>
<body>
<div class="lap">
  <header class="fejlec">
    <h1 class="fejlec-cim">${htmlBiztos(f.feliratok("hf.modTitle"))}</h1>
    <span class="fejlec-tag">referencia-host</span>
  </header>

  <nav class="nav">
    <div class="nav-links">
      <a class="nav-link${aktivTalalatok}" href="${alapUt}/">${htmlBiztos(f.feliratok("hf.pOverview"))}</a>
      <a class="nav-link${aktivBeallitas}" href="${alapUt}/beallitas">${htmlBiztos(f.feliratok("hf.pSetup"))}</a>
    </div>
    <div class="nyelv-valaszto" aria-label="${htmlBiztos(f.feliratok("hf.uiLangLabel"))}">
      <a class="nyelv-link${huAktiv}" href="?nyelv=hu">HU</a>
      <a class="nyelv-link${roAktiv}" href="?nyelv=ro">RO</a>
      <a class="nyelv-link${enAktiv}" href="?nyelv=en">EN</a>
    </div>
  </nav>

  <main>
${f.tartalom}
  </main>

  <footer class="lablec">
    ${htmlBiztos(f.feliratok("hf.modTitle"))} · referencia-host · ${new Date().getFullYear()}
  </footer>
</div>
</body>
</html>`;
}
