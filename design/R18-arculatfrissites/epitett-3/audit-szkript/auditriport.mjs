import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const [ELOTTE, UTANA, KI] = process.argv.slice(2);
function olvas(M) {
  const sorok = readdirSync(M + "/r").map((f) => JSON.parse(readFileSync(`${M}/r/${f}`, "utf8")));
  const tip = { "vizszintes-gorgetes": 0, "ket-soros-gomb": 0, tulcsordulas: 0, atfedes: 0, "elcsuszott-sor": 0 }, ut = {}, par = {};
  let ossz = 0, hiba = 0;
  for (const j of sorok) { if (j.hiba) hiba++; for (const t of j.talalatok) { ossz++; tip[t.tipus]++; ut[j.ut.replace(/munka=[0-9a-f-]+/, "munka=…")] = (ut[j.ut.replace(/munka=[0-9a-f-]+/, "munka=…")] ?? 0) + 1; const k = `${t.tipus}|${j.ut.replace(/munka=[0-9a-f-]+/, "munka=…")}|${t.hol.split(" > ").slice(-1)[0]}|${t.szoveg.slice(0, 50)}`; (par[k] ??= { tipus: t.tipus, ut: j.ut.replace(/munka=[0-9a-f-]+/, "munka=…"), elem: t.hol.split(" > ").slice(-1)[0], szoveg: t.szoveg.slice(0, 50), adat: t.adat ?? "", db: 0, hol: [] }).db++; if (par[k].hol.length < 4) par[k].hol.push(`${j.ny}/${j.w}/${j.m === "dark" ? "sötét" : "világos"}`); } }
  return { kombinacio: sorok.length, hibas_betoltes: hiba, talalat: ossz, tipus: tip, utvonal: ut, kulonbozo: Object.values(par).sort((a, b) => b.db - a.db) };
}
const e = olvas(ELOTTE), u = olvas(UTANA);
const meta = { datum: "2026-10-11", mit: "R-18 3. kör · elrendezés-audit", matrix: "54 útvonal-változat × HU/RO/EN × 390/768/1024/1280/1440 × sötét/világos = 1620 lapnézet", ellenorzes: ["vízszintes görgetés (a lap szélesebb a képernyőnél)", "szöveg-túlcsordulás gombban, csempén, jelvényen, menüben (scrollWidth > clientWidth; a szándékos „…” nem hiba)", "két sorba tört gombfelirat", "átfedés két tartalmi elem között (gomb, mező, cím, bekezdés, kép)", "flex-sor elemei nem egy vonalban (> 2 px)"], megjegyzes: "Helyi mérés a VM-ben (Postgres 18.4, éles build, teszt AI, a betűk rendszerbetűként). Előtte = ennek a körnek a kódja az elrendezés-javítások ELŐTT (benne az új Naptár menüponttal)." };
writeFileSync(`${KI}/audit.json`, JSON.stringify({ ...meta, elotte: e, utana: u }, null, 1));
const T = { "vizszintes-gorgetes": "Vízszintes görgetés", "ket-soros-gomb": "Két sorba tört gombfelirat", tulcsordulas: "Kilógó szöveg", atfedes: "Átfedés", "elcsuszott-sor": "Elcsúszott sor" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const max = Math.max(...Object.values(e.tipus), 1);
const sav = (n, szin) => `<div class="sav"><span style="width:${(n / max) * 100}%;background:${szin}"></span></div>`;
const html = `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elrendezés-audit</title>
<style>:root{--bg:#f7f6f2;--t:#111;--m:#5f5b54;--l:#e2dfd8;--p:#4b09d8;--o:#eb5928;--ok:#23704a}@media (prefers-color-scheme:dark){:root{--bg:#0a0a0a;--t:#ececec;--m:#b3b3b3;--l:#2a2a2a;--ok:#7fe0a0}}
body{margin:0;background:var(--bg);color:var(--t);font:15px/1.5 system-ui,sans-serif}main{max-width:980px;margin:0 auto;padding:24px 16px 64px}h1{font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 8px}.m{color:var(--m)}
.kartyak{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:20px 0}.k{border:1px solid var(--l);border-radius:8px;padding:14px}.k b{font-size:34px;display:block;line-height:1.1}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{border-bottom:1px solid var(--l);padding:6px 8px;text-align:left;vertical-align:top}th{color:var(--m);font-weight:600}.sz{text-align:right;font-variant-numeric:tabular-nums}
.sav{height:8px;background:var(--l);border-radius:4px;overflow:hidden;min-width:120px}.sav span{display:block;height:100%}code{font-size:12px}</style></head><body><main>
<h1>Elrendezés-audit — előtte / utána</h1><p class="m">${esc(meta.matrix)}. ${esc(meta.megjegyzes)}</p>
<div class="kartyak"><div class="k"><span class="m">Előtte</span><b style="color:var(--o)">${e.talalat}</b>hibajelzés</div><div class="k"><span class="m">Utána</span><b style="color:var(--ok)">${u.talalat}</b>hibajelzés</div><div class="k"><span class="m">Lapnézet</span><b>${u.kombinacio}</b>${u.hibas_betoltes} sikertelen betöltés</div></div>
<h2>Típusonként</h2><table><tr><th>Ellenőrzés</th><th class="sz">Előtte</th><th></th><th class="sz">Utána</th></tr>${Object.keys(T).map((k) => `<tr><td>${T[k]}</td><td class="sz">${e.tipus[k]}</td><td>${sav(e.tipus[k], "var(--o)")}</td><td class="sz">${u.tipus[k]}</td></tr>`).join("")}</table>
<h2>Mit javítottunk (a leggyakoribb előtte-jelzések)</h2><table><tr><th class="sz">db</th><th>Típus</th><th>Lap</th><th>Elem</th><th>Példa</th></tr>${e.kulonbozo.slice(0, 40).map((p) => `<tr><td class="sz">${p.db}</td><td>${T[p.tipus]}</td><td><code>${esc(p.ut)}</code></td><td><code>${esc(p.elem)}</code><br><span class="m">${esc(p.szoveg)}</span></td><td class="m">${esc(p.hol.join(" · "))}</td></tr>`).join("")}</table>
<p class="m">Összesen ${e.kulonbozo.length} különböző (típus, elem, szöveg) jelzés előtte; a teljes lista az audit.json-ban. Ami egyik ellenőrzésen sem jelzett előtte sem: elcsúszott flex-sor (0).</p>
</main></body></html>`;
writeFileSync(`${KI}/audit.html`, html);
console.log("előtte", e.talalat, JSON.stringify(e.tipus), "utána", u.talalat, JSON.stringify(u.tipus));
