import type { Kartya, Futas } from "@km/news-monitor-core";
import type { Nyelv } from "@km/news-monitor-feliratok";
import { htmlBiztos } from "./lap.js";

export function talalatokOldal(a: {
  nyelv: Nyelv;
  kartyak: Kartya[];
  utolsoSikeres: Futas | null;
  fut: boolean;
  ujDb: number;
  forrasHibak: { forras_id: string; ok: string }[];
  forrasCime: (forrasId: string) => string;
  feliratok: (kulcs: string, ertekek?: Record<string, string | number>) => string;
  /** Útvonal-előtag (pl. "/referencia"), ha a host nem a gyökéren felel. Üres = gyökér. */
  alapUt?: string;
  /**
   * Írható-e a bemutató. ALAPBÓL NEM: a referencia-host nyilvánosan elérhető, és az indítás
   * VALÓDI munkát tesz sorba a gépen. Ha nem írható, a gomb létre sem jön — nem tiltott gombot
   * mutatunk, hanem nincs gomb (a kiszolgáló a POST-ot is elutasítja).
   */
  irhato?: boolean;
}): string {
  const reszek: string[] = [];

  // Állapotsor
  let allapotSzoveg: string;
  if (a.fut) {
    allapotSzoveg = a.feliratok("hf.stRunning");
  } else if (a.utolsoSikeres) {
    // a `veg` a futás lezárásakor kap értéket; ha (még) üres, a kezdetét mutatjuk
    const ido = new Intl.DateTimeFormat(a.nyelv, { dateStyle: "short", timeStyle: "short" }).format(
      new Date(a.utolsoSikeres.veg ?? a.utolsoSikeres.kezdet)
    );
    allapotSzoveg = a.feliratok("hf.stLastRun", { t: ido });
  } else {
    allapotSzoveg = a.feliratok("hf.stNever");
  }

  let ujSzoveg: string;
  if (a.ujDb > 0) {
    ujSzoveg = `<span class="uj-jelzo">${htmlBiztos(a.feliratok("hf.stNew", { n: a.ujDb }))}</span>`;
  } else {
    ujSzoveg = `<span class="uj-jelzo-ures">${htmlBiztos(a.feliratok("hf.stNoNew"))}</span>`;
  }

  reszek.push(`<div class="allapot-sor">
  <span class="allapot-uzem">${htmlBiztos(allapotSzoveg)}</span>
  ${ujSzoveg}
</div>`);

  // Indítás gomb — csak írható bemutatóban
  if (a.irhato) {
    const gombFelirat = a.fut ? a.feliratok("hf.trialRunningBtn") : a.feliratok("hf.stRunNow");
    const disabledAttr = a.fut ? " disabled" : "";
    reszek.push(`<form class="inditas-form" method="post" action="${a.alapUt ?? ""}/inditas">
  <button class="inditas-gomb" type="submit"${disabledAttr}>${htmlBiztos(gombFelirat)}</button>
</form>`);
  }

  // Forráshibák
  if (a.forrasHibak.length > 0) {
    const hibasCimek = a.forrasHibak
      .map((h) => a.forrasCime(h.forras_id))
      .filter((c) => c.length > 0)
      .join(", ");
    if (hibasCimek.length > 0) {
      reszek.push(`<div class="figyelmeztetes">${htmlBiztos(a.feliratok("hf.srcProblem", { p: hibasCimek }))}</div>`);
    }
  }

  // Kártyák
  if (a.kartyak.length === 0) {
    reszek.push(`<div class="nincs-kartya">
  <h2 class="nincs-kartya-cim">${htmlBiztos(a.feliratok("hf.ovNoNewTitle"))}</h2>
  <p class="nincs-kartya-szoveg">${htmlBiztos(a.feliratok("hf.ovNoNewBody"))}</p>
</div>`);
  } else {
    const rendezett = [...a.kartyak].sort((x, y) => {
      const xIdo = new Date(x.letrehozva).getTime();
      const yIdo = new Date(y.letrehozva).getTime();
      return yIdo - xIdo;
    });

    const kartyaReszek = rendezett.map((k) => {
      const resz: string[] = [];

      // Jelvény
      let jelveny = "";
      if (k.ertekeles_allapot === "kesz") {
        let jelvenyOsztaly = "";
        let jelvenySzoveg = "";
        if (k.fontossag === "fontos") {
          jelvenyOsztaly = "jelveny-fontos";
          jelvenySzoveg = a.feliratok("hf.impHigh");
        } else if (k.fontossag === "erdekes") {
          jelvenyOsztaly = "jelveny-erdekes";
          jelvenySzoveg = a.feliratok("hf.impMed");
        } else {
          jelvenyOsztaly = "jelveny-hatter";
          jelvenySzoveg = a.feliratok("hf.impLow");
        }
        jelveny = `<span class="jelveny ${jelvenyOsztaly}">${htmlBiztos(jelvenySzoveg)}</span>`;
      } else {
        jelveny = `<span class="jelveny">…</span>`;
      }

      // Új jelvény
      let ujJelveny = "";
      if (k.megtekintes === "uj") {
        ujJelveny = `<span class="jelveny jelveny-uj">${htmlBiztos(a.feliratok("hf.fNew"))}</span>`;
      }

      resz.push(`<article class="kartya">
  <div class="kartya-fej">
    ${jelveny}
    ${ujJelveny}
  </div>
  <h2 class="kartya-cim">${htmlBiztos(k.cim)}</h2>
  <p class="kartya-osszefoglalo">${htmlBiztos(k.osszefoglalo)}</p>
  <div class="kartya-miert">
    <span class="kartya-miert-cimke">${htmlBiztos(a.feliratok("hf.whyLabel"))}:</span>
    ${htmlBiztos(k.miert)}
  </div>
  <div class="kartya-labsor">
    ${k.esemeny_ideje ? `<span>${htmlBiztos(new Intl.DateTimeFormat(a.nyelv, { dateStyle: "short", timeStyle: "short" }).format(new Date(k.esemeny_ideje)))}</span>` : ""}
    <span>${htmlBiztos(a.feliratok("hf.detSources"))}: ${k.forrasok.length}</span>
    <span>${htmlBiztos(k.forrasok.map((f) => a.forrasCime(f.forras_id)).filter((c) => c.length > 0).join(", "))}</span>
  </div>
</article>`);
      return resz.join("\n");
    });

    reszek.push(`<div class="kartyak">
${kartyaReszek.join("\n")}
</div>`);
  }

  return reszek.join("\n");
}
