// c4 kapu — a vitest JSON-kimenetek összesítése egyetlen eredménylistába.
//   node tools/kapu/osszesit.mjs <mappa a <csomag>.json fájlokkal> <gyökér> [ellenoriz.tsv] > eredmeny.json
// Az ellenoriz.tsv soronként „<azonosító>\t<zold|bukik>” — a kapu írja az `ellenoriz` lánc tagjairól.
// Egy teszt azonosítója: "<csomag mappa>::<fájl a csomagon belül>::<leíró blokkok > teszt neve>".
// Ha egy fájl be sem töltődik (nincs benne egyetlen teszt sem, de bukott), azonosítója: "<csomag>::<fájl>::(a fájl nem töltődött be)".
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const [mappa, gyoker, ellenorizTsv] = process.argv.slice(2);
if (!mappa || !gyoker) { console.error("használat: osszesit.mjs <mappa> <gyökér>"); process.exit(2); }

const tesztek = [];
const hianyzo = [];
for (const f of readdirSync(mappa).filter((x) => x.endsWith(".json")).sort()) {
  const csomag = f.replace(/\.json$/, "").replace(/_/g, "/");
  let j;
  try { j = JSON.parse(readFileSync(join(mappa, f), "utf8")); } catch { hianyzo.push(csomag); continue; }
  for (const tr of j.testResults ?? []) {
    const fajl = relative(join(gyoker, csomag), tr.name);
    const ar = tr.assertionResults ?? [];
    if (ar.length === 0 && tr.status === "failed") {
      tesztek.push({ azonosito: `${csomag}::${fajl}::(a fájl nem töltődött be)`, allapot: "bukik", uzenet: String(tr.message ?? "").slice(0, 400) });
      continue;
    }
    // Egy elbukott beforeAll/afterAll a fájl tesztjeit „kimarad”-nak jelöli; a fájl hibáját külön sorként vesszük fel, különben eltűnne.
    if (tr.status === "failed" && !ar.some((a) => a.status === "failed")) {
      tesztek.push({ azonosito: `${csomag}::${fajl}::(a fájl hibája: előkészítés/lezárás)`, allapot: "bukik", uzenet: String(tr.message ?? "").slice(0, 400) });
    }
    for (const a of ar) {
      const nev = [...(a.ancestorTitles ?? []), a.title].join(" > ");
      const allapot = a.status === "passed" ? "zold" : a.status === "failed" ? "bukik" : "kimarad";
      tesztek.push({ azonosito: `${csomag}::${fajl}::${nev}`, allapot, uzenet: allapot === "bukik" ? String((a.failureMessages ?? [])[0] ?? "").slice(0, 400) : undefined });
    }
  }
}
if (ellenorizTsv) {
  for (const sor of readFileSync(ellenorizTsv, "utf8").split("\n").filter(Boolean)) {
    const [azonosito, allapot] = sor.split("\t");
    tesztek.push({ azonosito, allapot: allapot === "zold" ? "zold" : "bukik" });
  }
}
const szam = (x) => tesztek.filter((t) => t.allapot === x).length;
console.log(JSON.stringify({ osszes: tesztek.length, zold: szam("zold"), bukik: szam("bukik"), kimarad: szam("kimarad"), hianyzo_kimenet: hianyzo, tesztek }, null, 2));
