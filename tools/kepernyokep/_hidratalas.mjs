// Hidratálási hibák (React 418) keresése lapról lapra, belépve — a képernyőkép-kör kiegészítője. node tools/kepernyokep/_hidratalas.mjs <cim> <fiok.json mappa> [resolve]
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const [CIM, KI, RESOLVE] = process.argv.slice(2);
const { emailA } = JSON.parse(readFileSync(KI + "/fiok.json", "utf8"));
const b = await chromium.launch({ channel: "msedge", args: RESOLVE ? [`--host-resolver-rules=MAP ${RESOLVE.split(":")[0]} ${RESOLVE.split(":")[2]}`] : [] });
const ktx = await b.newContext({ locale: "hu", ignoreHTTPSErrors: true }); const p = await ktx.newPage();
let hibak = []; p.on("pageerror", (e) => hibak.push(e.message.slice(0, 60)));
await p.goto(CIM + "/belepes", { waitUntil: "domcontentloaded" });
await p.evaluate(async ([e]) => { await fetch("/api/fiok/belepes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: e, jelszo: "ProbaJelszo123!" }) }); }, [emailA]);
for (const ut of ["/kezdolap", "/fiok", "/hirfigyelo", "/tema", "/feliratok", "/koltseg", "/gephaz", "/tagok", "/beallitasok", "/beallitasok?ful=adatpolitika", "/sajat-fiok", "/gephaz/kimeno"]) {
  hibak = []; await p.goto(CIM + ut, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  console.log(ut, hibak.length ? "HIBA: " + hibak.join(" | ") : "ok");
}
await b.close();
