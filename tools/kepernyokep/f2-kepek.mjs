// F-2 (R-1 v3): a kezdőképernyő és a Gépház képernyőképei a FUTÓ rendszerről, a rajz nyolc artboardja mellé.
// A kep.mjs mintájára (Edge/Chrome playwright-core-ral), de a rajz állapotait végigjárva:
//   01 kezdőképernyő normál (tulajdonos, jóváhagyott profil, beállított figyelés, egy próbafutás után)
//   02 első használat (a profil jóváhagyása előtt)
//   03 néző szerep (egy meghívott néző fiókkal)
//   04 Gépház rendszergazda (CSAK ha a fiókon a rendszergazda-jelölés áll — lásd a --fazis 2)
//   05 kezdőképernyő telefonon (390)   06 a felső sáv a lenyílókkal (asztali)   07 a felső sáv telefonon, nyitva   08 Gépház tulajdonos
//
//   node tools/kepernyokep/f2-kepek.mjs --cim http://127.0.0.1:8401 --ki <mappa> [--fazis 1|2] [--nyelv hu] [--resolve saas.mediapartizan.ro:443:192.168.1.144]
//     --fazis 1 (alap): fiókok + adat létrehozása, 01–03, 05–08 képek; a fiók e-mail-címét a <mappa>/fiok.json-ba írja.
//     --fazis 2: a fiok.json fiókjával lép be (miután a rendszergazda-jelölést SQL-lel megkapta) és a 04-et készíti.
//     --fazis 3: a fiok.json fiókjával a 01 és 05 újra — a próbafutás vége után (a teszten a valódi AI percekig dolgozik).
//     --fazis 4: (R-1 v4) a felső sáv a régi lapokon — 09 Ügyfélprofil, 10 Hírfigyelő, Theme; a Gépház a pénznem-vezérlővel.
//   A próbafutás valódi letöltéssel megy (hálózat kell); az eredmény számai a valódi futásból jönnek — nem beégetett példák.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const CIM = arg("--cim", "http://127.0.0.1:8401"), KI = arg("--ki", "kepek-f2"), NYELV = arg("--nyelv", "hu"), FAZIS = arg("--fazis", "1");
const JELSZO = "ProbaJelszo123!";
// --resolve saas.mediapartizan.ro:443:192.168.1.144 — a tesztoldal a NAS-on át (mint a kep.mjs-ben)
const RESOLVE = arg("--resolve", "");
const PROBA_RSS = process.env["PROBA_RSS"] ?? "https://www.maszol.ro/rss";
mkdirSync(KI, { recursive: true });

const bongeszo = await chromium.launch({ channel: process.env.BONGESZO ?? "msedge", args: RESOLVE ? [`--host-resolver-rules=MAP ${RESOLVE.split(":")[0]} ${RESOLVE.split(":")[2]}`] : [] });
const naplo = (lap, cimke) => {
  lap.on("pageerror", (e) => console.log(`LAPHIBA[${cimke}]: ${e.message}`));
  lap.on("console", (m) => { if (m.type() === "error") console.log(`KONZOL[${cimke}]: ${m.text().slice(0, 300)}`); });
  lap.on("response", (r) => { if (r.status() >= 400 && !r.url().includes("/api/fiok/belepes")) console.log(`VÁLASZ ${r.status()}: ${r.url()}`); });
};

async function ujLap(cimke) {
  const ktx = await bongeszo.newContext({ viewport: { width: 1440, height: 900 }, locale: NYELV, ignoreHTTPSErrors: true });
  const lap = await ktx.newPage();
  naplo(lap, cimke);
  await lap.goto(`${CIM}/belepes`, { waitUntil: "domcontentloaded" });
  return lap;
}
async function api(lap, ut, torzs, modszer = "POST") {
  return lap.evaluate(async ([u, t, m]) => {
    const v = await fetch(u, { method: m, headers: { "content-type": "application/json" }, body: t === undefined ? undefined : JSON.stringify(t), credentials: "same-origin" });
    let torzs = null; try { torzs = JSON.parse(await v.text()); } catch { /* üres */ }
    return { statusz: v.status, torzs };
  }, [ut, torzs, modszer]);
}
function kell(r, mit, elvart) {
  if (!elvart.includes(r.statusz)) throw new Error(`${mit}: ${r.statusz} ${JSON.stringify(r.torzs).slice(0, 300)}`);
  return r.torzs;
}
async function kep(lap, ut, nev, w = 1440, h = 900, elotte) {
  await lap.setViewportSize({ width: w, height: h });
  await lap.goto(`${CIM}${ut}`, { waitUntil: "networkidle" });
  await lap.waitForFunction(() => !/Betöltés|Loading|Se încarcă/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
  if (elotte) await elotte(lap);
  await lap.waitForTimeout(500);
  const f = join(KI, `${nev}.png`);
  await lap.screenshot({ path: f, fullPage: true });
  console.log(`kép: ${f}  (${lap.url()})`);
}

if (FAZIS === "1") {
  // --- A: tulajdonos fiók + munkatér ---
  const a = await ujLap("A");
  const emailA = `proba-f2-${Date.now().toString(36)}@proba.example`;
  kell(await api(a, "/api/fiok/regisztracio", { nev: "Portik Vilmos", email: emailA, jelszo: JELSZO }), "regisztráció A", [201]);
  kell(await api(a, "/api/fiok/belepes", { email: emailA, jelszo: JELSZO }), "belépés A", [200]);
  kell(await api(a, "/api/szervezet", { nev: "Aitmetica SRL" }), "szervezet", [201]);
  if (NYELV !== "hu") await api(a, "/api/nyelv", { nyelv: NYELV });
  console.log(`A bejelentkezve: ${emailA}`);

  // 02 · első használat (nincs jóváhagyott profil)
  await kep(a, "/kezdolap", "02-elso-hasznalat-asztali");
  await kep(a, "/kezdolap", "02-elso-hasznalat-telefon", 390, 844);

  // profil (ugyanaz a két lépés, mint a kep.mjs --profil): a cél későbbre hagyva → „1 rész hiányzik"
  kell(await api(a, "/api/onboarding/piszkozat", {
    bemutatkozas: { nev: "Aitmetica SRL", osszefoglalo: "Kommunikációs munkakörnyezetet fejlesztő cég Marosvásárhelyen; ügyfelei kis- és középvállalkozások.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "Az Aitmetica SRL több ügyfélnek eladható, AI-központú kommunikációs munkakörnyezetet fejleszt, iparágtól függetlenül." },
    kommunikacio: { celkozonseg: "kis- és középvállalkozások kommunikációs vezetői", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "ai", hangnem_leiras: "közvetlen, szakmai, tegeződő", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
  }, "PUT"), "piszkozat", [200]);
  kell(await api(a, "/api/onboarding/jovahagyas", {}), "jóváhagyás", [200]);
  console.log("profil jóváhagyva");

  // figyelés: napi időzítés (így van „következő tervezett futás"), források több állapotban, egy próbafutás
  kell(await api(a, "/api/hirfigyelo/beallitas", {
    celok: ["sajat_marka"], temak: [{ nev: "Marosvásárhely", nevvaltozatok: ["Târgu Mureș"], megkulonboztetes: "" }],
    foldrajzi_fokusz: "Maros megye", nyelvek: ["hu"], kizarasok: [], idozites: { mod: "napi", ora: 18, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "Helyi gazdasági hírek",
  }, "PUT"), "beállítás", [200]);
  kell(await api(a, "/api/hirfigyelo/forrasok", { cim: "https://facebook.com/aitmetica" }), "forrás fb", [200]);
  const rss = kell(await api(a, "/api/hirfigyelo/forrasok", { cim: PROBA_RSS }), "forrás rss", [200]);
  const rssId = rss?.hirfigyelo?.forras?.id;
  if (rssId) console.log("rss ellenőrzés:", (await api(a, `/api/hirfigyelo/forrasok/${rssId}/ellenoriz`, {})).torzs?.hirfigyelo?.forras?.allapot);
  kell(await api(a, "/api/hirfigyelo/forrasok", { cim: "https://nincs-ilyen-oldal.proba.example/rss" }), "forrás hibás", [200]);
  const futas = await api(a, "/api/hirfigyelo/futas", { proba: true });
  if (futas.statusz === 202) {
    const sorId = futas.torzs.hirfigyelo.sor.id; const hatar = Date.now() + 90000; let vege = null;
    while (Date.now() < hatar) {
      const s = await api(a, `/api/hirfigyelo/futas/sor/${sorId}`, undefined, "GET");
      if (s.torzs?.hirfigyelo?.sor?.allapot === "kesz" || s.torzs?.hirfigyelo?.sor?.allapot === "hiba") { vege = s.torzs.hirfigyelo.sor; break; }
      await new Promise((r) => setTimeout(r, 2000));
    }
    console.log("próbafutás:", vege ? vege.allapot : "nem ért véget 90 mp alatt");
  } else console.log("próbafutás nem indult:", futas.statusz, JSON.stringify(futas.torzs).slice(0, 200));

  // --- B: néző (meghívóval, szervezet nélkül regisztrál, beváltja) ---
  const meghivo = kell(await api(a, "/api/tagok/meghivo", { szerep: "nezo" }), "meghívó", [201]);
  const b = await ujLap("B");
  const emailB = `proba-f2-nezo-${Date.now().toString(36)}@proba.example`;
  kell(await api(b, "/api/fiok/regisztracio", { nev: "Néző Nóra", email: emailB, jelszo: JELSZO }), "regisztráció B", [201]);
  kell(await api(b, "/api/fiok/belepes", { email: emailB, jelszo: JELSZO }), "belépés B", [200]);
  kell(await api(b, "/api/meghivo/elfogad", { jegy: meghivo.hozzaferes.jegy }), "elfogadás", [200]);
  if (NYELV !== "hu") await api(b, "/api/nyelv", { nyelv: NYELV });

  // 01 · normál, 05 · telefon, 06 · a felső sáv lenyílói, 07 · telefon nyitva, 08 · Gépház tulajdonos
  await kep(a, "/kezdolap", "01-kezdolap-normal-asztali");
  await kep(a, "/kezdolap", "05-kezdolap-telefon", 390, 844);
  await kep(a, "/kezdolap", "06-felso-sav-munkater-lenyilo", 1440, 900, async (lap) => { await lap.click(".km-sav-munkater-gomb"); await lap.waitForTimeout(300); });
  await kep(a, "/kezdolap", "06-felso-sav-modulok-lenyilo", 1440, 900, async (lap) => { await lap.click(".km-sav-nav-gomb"); await lap.waitForTimeout(300); });
  await kep(a, "/kezdolap", "07-felso-sav-telefon-nyitva", 390, 844, async (lap) => { await lap.click(".km-sav-hamburger"); await lap.waitForTimeout(300); });
  await kep(a, "/gephaz", "08-gephaz-tulajdonos-asztali");
  await kep(a, "/gephaz", "08-gephaz-tulajdonos-telefon", 390, 844);
  // 03 · néző
  await kep(b, "/kezdolap", "03-kezdolap-nezo-asztali");
  await kep(b, "/gephaz", "03-nezo-gephaz-atiranyit");

  writeFileSync(join(KI, "fiok.json"), JSON.stringify({ emailA, emailB }, null, 2) + "\n");
  console.log(`a fiókok: ${join(KI, "fiok.json")} — a 04-hez: UPDATE fiok SET rendszergazda = true WHERE email = '${emailA}'; majd --fazis 2`);
} else if (FAZIS === "3") {
  // 3. fázis: a fiok.json fiókjával újra a 01 és 05 — amikor a próbafutás már végzett (a teszten a valódi AI percekig értékel)
  const { emailA } = JSON.parse(readFileSync(join(KI, "fiok.json"), "utf8"));
  const a = await ujLap("A3");
  kell(await api(a, "/api/fiok/belepes", { email: emailA, jelszo: JELSZO }), "belépés A", [200]);
  await kep(a, "/kezdolap", "01-kezdolap-normal-asztali");
  await kep(a, "/kezdolap", "05-kezdolap-telefon", 390, 844);
} else if (FAZIS === "4") {
  // 4. fázis (R-1 v4): a felső sáv a régi lapokon (09 Ügyfélprofil, 10 Hírfigyelő Áttekintés), a Theme lap a sávval, a Gépház a pénznem-vezérlővel
  const { emailA } = JSON.parse(readFileSync(join(KI, "fiok.json"), "utf8"));
  const a = await ujLap("A4");
  kell(await api(a, "/api/fiok/belepes", { email: emailA, jelszo: JELSZO }), "belépés A", [200]);
  await kep(a, "/fiok", "09-ugyfelprofil-savval-asztali");
  await kep(a, "/hirfigyelo", "10-hirfigyelo-savval-asztali");
  await kep(a, "/hirfigyelo", "10-hirfigyelo-savval-telefon", 390, 844);
  await kep(a, "/tema", "10b-theme-savval-asztali");
  await kep(a, "/gephaz", "08-gephaz-tulajdonos-penznem-asztali");
  await kep(a, "/gephaz", "08-gephaz-tulajdonos-penznem-nyitva", 1440, 900, async (lap) => { await lap.focus(".km-gh-penznem-valaszto"); await lap.waitForTimeout(200); });
} else {
  const { emailA } = JSON.parse(readFileSync(join(KI, "fiok.json"), "utf8"));
  const a = await ujLap("A2");
  kell(await api(a, "/api/fiok/belepes", { email: emailA, jelszo: JELSZO }), "belépés A", [200]);
  await kep(a, "/gephaz", "04-gephaz-rendszergazda-asztali");
  await kep(a, "/gephaz", "04-gephaz-rendszergazda-telefon", 390, 844);
  await kep(a, "/kezdolap", "01-kezdolap-rendszergazda-jelvennyel");
}
await bongeszo.close();
