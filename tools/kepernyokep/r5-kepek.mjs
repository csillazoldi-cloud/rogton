// R-5 (F-7b): a Gépház két új csempéje, a Kimenő értesítések lapja, az AI-kapcsoló és a hírfigyelő sávja a FUTÓ rendszerről, a rajz artboardjai mellé.
//   node tools/kepernyokep/r5-kepek.mjs --cim http://127.0.0.1:8401 --ki <mappa> [--resolve saas.mediapartizan.ro:443:192.168.1.144]
//   01 Gépház tulajdonos (Csomag + Kimenő csempe) · 03 Kimenő lap tulajdonos (két felülírt sor) · 05/A AI be · 05/B AI ki · 06 hírfigyelő kikapcsolt AI-val (valódi próbafutás)
//   07/A Gépház telefon · 07/B Kimenő lap telefon. A 02. és 04. (rendszergazda) próbafiókkal nem készül — a rendszergazda-jelölést csak SQL adja.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CIM = arg("--cim", "http://127.0.0.1:8401"), KI = arg("--ki", "kepek-r5"), NYELV = arg("--nyelv", "hu"), RESOLVE = arg("--resolve", "");
const PROBA_RSS = process.env.PROBA_RSS ?? "https://marosvasarhelyiek.ro/feed";
const JELSZO = "ProbaJelszo123!";
mkdirSync(KI, { recursive: true });
const bongeszo = await chromium.launch({ channel: process.env.BONGESZO ?? "msedge", args: RESOLVE ? [`--host-resolver-rules=MAP ${RESOLVE.split(":")[0]} ${RESOLVE.split(":")[2]}`] : [] });

async function ujLap(cimke) {
  const ktx = await bongeszo.newContext({ viewport: { width: 1440, height: 900 }, locale: NYELV, ignoreHTTPSErrors: true });
  const lap = await ktx.newPage();
  lap.on("pageerror", (e) => console.log(`LAPHIBA[${cimke}] ${new URL(lap.url()).pathname}: ${e.message.slice(0, 60)}`));
  lap.on("response", (r) => { if (r.status() >= 500) console.log(`VÁLASZ ${r.status()}: ${r.url()}`); });
  await lap.goto(`${CIM}/belepes`, { waitUntil: "domcontentloaded" });
  return lap;
}
async function api(lap, ut, torzs, modszer = "POST") {
  return lap.evaluate(async ([u, t, m]) => {
    const v = await fetch(u, { method: m, headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${1 + Math.floor(Math.random() * 250)}` }, body: t === undefined ? undefined : JSON.stringify(t), credentials: "same-origin" });
    let torzs = null; try { torzs = JSON.parse(await v.text()); } catch { /* üres */ }
    return { statusz: v.status, torzs };
  }, [ut, torzs, modszer]);
}
function kell(r, mit, elvart) { if (!elvart.includes(r.statusz)) throw new Error(`${mit}: ${r.statusz} ${JSON.stringify(r.torzs).slice(0, 200)}`); return r.torzs; }
async function kep(lap, ut, nev, w = 1440, h = 900, elotte) {
  await lap.setViewportSize({ width: w, height: h });
  if (ut) await lap.goto(`${CIM}${ut}`, { waitUntil: "networkidle" });
  if (elotte) await elotte(lap);
  await lap.waitForTimeout(500);
  const f = join(KI, `${nev}.png`);
  try { await lap.screenshot({ path: f, fullPage: true }); } catch { await lap.waitForTimeout(1000); await lap.screenshot({ path: f, fullPage: true }); }
  console.log(`kép: ${nev}`);
}
const t = Date.now().toString(36);

const a = await ujLap("A");
kell(await api(a, "/api/fiok/regisztracio", { nev: "Portik Vilmos", email: `proba-r5-a-${t}@proba.example`, jelszo: JELSZO }), "regisztráció", [201]);
kell(await api(a, "/api/fiok/belepes", { email: `proba-r5-a-${t}@proba.example`, jelszo: JELSZO }), "belépés", [200]);
kell(await api(a, "/api/szervezet", { nev: "Aitmetica SRL" }), "szervezet", [201]);
if (NYELV !== "hu") await api(a, "/api/nyelv", { nyelv: NYELV });

// két felülírt sor a kimenő beállításban — a rajz 03. artboardjának mintaadata (futas_hiba, keret_kimerult)
kell(await api(a, "/api/ertesites", { futas_hiba: "kimeno", keret_kimerult: "kimeno" }, "PUT"), "kimenő felülírás", [200]);

// 01 · Gépház, tulajdonos · 07/A telefon
await kep(a, "/gephaz", "01-gephaz-tulajdonos");
await kep(a, "/gephaz", "07a-gephaz-telefon", 390, 844);
// 03 · Kimenő lap, tulajdonos · 07/B telefon
await kep(a, "/gephaz/kimeno", "03-kimeno-tulajdonos");
await kep(a, "/gephaz/kimeno", "07b-kimeno-telefon", 390, 844);

// 05/A · Adatpolitika: az AI-kapcsoló bekapcsolva
await kep(a, "/beallitasok?ful=adatpolitika", "05a-ai-kapcsolo-be");
// AI ki → 05/B
kell(await api(a, "/api/beallitas/ai", { engedelyezve: false }, "PUT"), "AI ki", [200]);
await kep(a, "/beallitasok?ful=adatpolitika", "05b-ai-kapcsolo-ki");

// 06 · a hírfigyelő kikapcsolt AI-val: jóváhagyott profil + beállítás + forrás + próbafutás (a találatok „az AI nem elérhető" jelölést kapnak)
kell(await api(a, "/api/onboarding/piszkozat", {
  bemutatkozas: { nev: "Aitmetica SRL", osszefoglalo: "Kommunikációs munkakörnyezetet fejlesztő cég Marosvásárhelyen; ügyfelei kis- és középvállalkozások.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "Az Aitmetica SRL több ügyfélnek eladható, AI-központú kommunikációs munkakörnyezetet fejleszt, iparágtól függetlenül." },
  kommunikacio: { celkozonseg: "kis- és középvállalkozások kommunikációs vezetői", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu"], nyelvek_forras: "ai", hangnem_leiras: "közvetlen, szakmai", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
}, "PUT"), "piszkozat", [200]);
kell(await api(a, "/api/onboarding/jovahagyas", {}), "jóváhagyás", [200]);
kell(await api(a, "/api/hirfigyelo/beallitas", {
  celok: ["sajat_marka"], temak: [{ nev: "Marosvásárhely", nevvaltozatok: ["Târgu Mureș"], megkulonboztetes: "" }],
  foldrajzi_fokusz: "Maros megye", nyelvek: ["hu"], kizarasok: [], idozites: { mod: "napi", ora: 18, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "Helyi gazdasági hírek",
}, "PUT"), "beállítás", [200]);
const rss = kell(await api(a, "/api/hirfigyelo/forrasok", { cim: PROBA_RSS }), "forrás rss", [200]);
const rssId = rss?.hirfigyelo?.forras?.id;
if (rssId) console.log("rss ellenőrzés:", (await api(a, `/api/hirfigyelo/forrasok/${rssId}/ellenoriz`, {})).torzs?.hirfigyelo?.forras?.allapot);
const futas = await api(a, "/api/hirfigyelo/futas", { proba: true });
if (futas.statusz === 202) {
  const sorId = futas.torzs.hirfigyelo.sor.id; const hatar = Date.now() + 120000; let vege = null;
  while (Date.now() < hatar) {
    const s = await api(a, `/api/hirfigyelo/futas/sor/${sorId}`, undefined, "GET");
    if (s.torzs?.hirfigyelo?.sor?.allapot === "kesz" || s.torzs?.hirfigyelo?.sor?.allapot === "hiba") { vege = s.torzs.hirfigyelo.sor; break; }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("próbafutás (AI ki):", vege ? vege.allapot : "nem ért véget 120 mp alatt");
} else console.log("próbafutás nem indult:", futas.statusz, JSON.stringify(futas.torzs).slice(0, 200));
await kep(a, "/hirfigyelo", "06-hirfigyelo-ai-ki");
// vissza: AI be (a próbafiók marad, a takarítás viszi)
kell(await api(a, "/api/beallitas/ai", { engedelyezve: true }, "PUT"), "AI be", [200]);
await bongeszo.close();
console.log("kész");
