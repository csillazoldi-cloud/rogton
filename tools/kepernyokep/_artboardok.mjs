// Egy .dc.html rajz artboardjainak külön képei (section[data-screen-label]) — a rajz–képernyő összevetéshez.
import { chromium } from "playwright-core";
const [,, fajl, ki] = process.argv;
const b = await chromium.launch({ channel: "msedge" }); const p = await b.newPage({ viewport: { width: 1700, height: 1200 } });
await p.goto("file:///" + fajl.split(String.fromCharCode(92)).join("/"), { waitUntil: "networkidle" }); await p.waitForTimeout(3000);
const szekciok = await p.$$("section[data-screen-label]");
for (const s of szekciok) {
  const cimke = await s.getAttribute("data-screen-label");
  await s.screenshot({ path: `${ki}/artboard-${cimke}.png` });
  const doboz = await s.boundingBox(); console.log(`artboard ${cimke}: ${Math.round(doboz.width)}x${Math.round(doboz.height)}`);
}
await b.close();
