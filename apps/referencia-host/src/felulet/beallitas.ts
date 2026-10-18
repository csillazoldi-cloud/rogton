import type { BeallitasVerzio, Forras } from "@km/news-monitor-core";
import type { Nyelv } from "@km/news-monitor-feliratok";
import { htmlBiztos } from "./lap.js";

export function beallitasOldal(a: {
  nyelv: Nyelv;
  aktiv: BeallitasVerzio | null;
  forrasok: Forras[];
  feliratok: (kulcs: string, ertekek?: Record<string, string | number>) => string;
}): string {
  const reszek: string[] = [];

  if (!a.aktiv) {
    reszek.push(`<div class="allapot-sor">
  <span>${htmlBiztos(a.feliratok("hf.stNever"))}</span>
</div>`);
    return reszek.join("\n");
  }

  reszek.push(`<p class="verzio"><span class="verzio-jel">v${a.aktiv.verzio}</span> ${htmlBiztos(a.feliratok("hf.verActive"))}</p>`);

  // 1. Mit figyelünk?
  reszek.push(`<section class="szakasz">
  <h2 class="szakasz-cim">${htmlBiztos(a.feliratok("hf.colWhat"))}</h2>
  <div class="szakasz-tartalom">`);

  const temak = a.aktiv.beallitas.temak;
  if (temak.length === 0) {
    reszek.push(`<div class="sor"><span class="sor-ertek-dim">${htmlBiztos(a.feliratok("hf.nincs"))}</span></div>`);
  } else {
    for (const tema of temak) {
      const nevváltozatok = tema.nevvaltozatok && tema.nevvaltozatok.length > 0
        ? ` (${tema.nevvaltozatok.join(", ")})`
        : "";
      reszek.push(`<div class="sor">
    <span class="sor-ertek">${htmlBiztos(tema.nev)}${htmlBiztos(nevváltozatok)}</span>
  </div>`);
    }
  }

  const kizarasok = a.aktiv.beallitas.kizarasok;
  if (kizarasok && kizarasok.length > 0) {
    reszek.push(`<div class="sor">
    <span class="sor-cimke">${htmlBiztos(a.feliratok("hf.exclLabel"))}</span>
    <span class="sor-ertek">${htmlBiztos(kizarasok.join(", "))}</span>
  </div>`);
  }

  reszek.push(`</div>
</section>`);

  // 2. Honnan?
  reszek.push(`<section class="szakasz">
  <h2 class="szakasz-cim">${htmlBiztos(a.feliratok("hf.colFrom"))}</h2>
  <div class="szakasz-tartalom">`);

  if (a.forrasok.length === 0) {
    reszek.push(`<div class="sor"><span class="sor-ertek-dim">${htmlBiztos(a.feliratok("hf.nincs"))}</span></div>`);
  } else {
    for (const forras of a.forrasok) {
      let allapotOsztaly = "";
      let allapotSzoveg = "";
      switch (forras.allapot) {
        case "hasznalhato":
          allapotOsztaly = "forras-allapot-ok";
          allapotSzoveg = a.feliratok("hf.srcOk");
          break;
        case "korlatozott":
          allapotOsztaly = "forras-allapot-korlatozott";
          allapotSzoveg = a.feliratok("hf.srcLimited");
          break;
        case "hibas":
          allapotOsztaly = "forras-allapot-hibas";
          allapotSzoveg = a.feliratok("hf.srcErr");
          break;
        case "ellenorzes_alatt":
          allapotOsztaly = "forras-allapot-ellenorzes";
          allapotSzoveg = a.feliratok("hf.srcChecking");
          break;
      }

      let hibaResz = "";
      if (forras.allapot === "hibas" && forras.hiba_ok) {
        hibaResz = ` — ${htmlBiztos(a.feliratok("hf.srcProblem", { p: forras.hiba_ok }))}`;
      }

      reszek.push(`<div class="sor">
    <span class="sor-ertek">${htmlBiztos(forras.cim)}</span>
    <span class="forras-allapot ${allapotOsztaly}">${htmlBiztos(allapotSzoveg)}</span>
    ${hibaResz}
  </div>`);
    }
  }

  reszek.push(`</div>
</section>`);

  // 3. Mikor?
  reszek.push(`<section class="szakasz">
  <h2 class="szakasz-cim">${htmlBiztos(a.feliratok("hf.colWhen"))}</h2>
  <div class="szakasz-tartalom">`);

  const idozites = a.aktiv.beallitas.idozites;
  if (idozites.mod === "napi") {
    const ora = String(idozites.ora).padStart(2, "0");
    const perc = String(idozites.perc).padStart(2, "0");
    const idoStr = `${ora}:${perc}`;
    reszek.push(`<div class="sor">
    <span class="sor-ertek">${htmlBiztos(a.feliratok("hf.stNextRun", { t: idoStr, tz: idozites.idozona }))}</span>
  </div>`);
  } else {
    reszek.push(`<div class="sor">
    <span class="sor-ertek">${htmlBiztos(a.feliratok("hf.stNextManual"))}</span>
  </div>`);
  }

  reszek.push(`</div>
</section>`);

  return reszek.join("\n");
}
