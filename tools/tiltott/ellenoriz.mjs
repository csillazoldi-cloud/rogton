#!/usr/bin/env node
// Tiltott-szó őr (G4, Rögtön 2026-10-18). A tiltott minták: minta.txt; a tudatosan tűrt helyek: engedett.txt (indokkal).
// Bármely találat → 1-es kilépés (a kirakás és az `ellenoriz` lánc megáll). Csak Node beépített modulokat használ, így a futó
// alkalmazás dobozában is fut (`docker run --entrypoint node gma-app:<sha> /tiltott/ellenoriz.mjs --kep /app`).
//
//   node tools/tiltott/ellenoriz.mjs                    a tárhely: a lefordított app (.next/server + static), public/, promptok,
//                                                       feliratok JSON-jai, a képgyártó forrása és mintái, a migrációk szövege
//   node tools/tiltott/ellenoriz.mjs --kep <gyökér>     egy kibontott dobozkép (pl. /app); a harmadik féltől jövő node_modules kimarad
//   node tools/tiltott/ellenoriz.mjs --db <postgres-url> a feliratok (alap + közös + szervezeti felülírás) — a gép `psql` parancsával
//   node tools/tiltott/ellenoriz.mjs --bejar <alapcím> [--fiok email:jelszó]
//                                                       a futó oldal: HTML, JS, CSS, a válaszfejlécek és a betöltött fájlok NEVEI
//   node tools/tiltott/ellenoriz.mjs --sql-minta        a minták egy PostgreSQL-regexben (a kirak.sh ezzel kérdezi le a db-t)
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ITT = dirname(fileURLToPath(import.meta.url));
const GYOKER = join(ITT, "..", "..");
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const van = (n) => process.argv.includes(n);

// ---- minták és engedélyek ----------------------------------------------------------------------------------------------------
const MINTAK = readFileSync(join(ITT, "minta.txt"), "utf8").split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
const REGEXEK = MINTAK.map((m) => ({ forras: m, re: new RegExp(m, "giu") }));
const ENGEDETT = (existsSync(join(ITT, "engedett.txt")) ? readFileSync(join(ITT, "engedett.txt"), "utf8") : "")
  .split("\n").filter((s) => s.trim() && !s.startsWith("#")).map((s) => {
    const [hol, minta, ok] = s.split("\t");
    if (!hol || !minta || !ok || ok.trim().length < 15) throw new Error(`engedett.txt: hibás sor (3 TAB-bal elválasztott mező, az ok ≥ 15 karakter): ${s}`);
    return { hol: new RegExp(hol), minta: minta.trim(), ok: ok.trim() };
  });
const engedett = (hely, minta) => ENGEDETT.find((e) => e.hol.test(hely) && (e.minta === "*" || e.minta === minta));

const talalatok = []; // { hely, minta, reszlet }
const turt = [];
function vizsgal(hely, szoveg) {
  for (const { forras, re } of REGEXEK) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(szoveg))) {
      const e = engedett(hely, forras);
      const reszlet = szoveg.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, " ");
      (e ? turt : talalatok).push({ hely, minta: forras, reszlet, ok: e?.ok });
      if (talalatok.length + turt.length > 5000) return;
    }
  }
}

// ---- fájlok ------------------------------------------------------------------------------------------------------------------
const BINARIS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".pdf", ".zip", ".gz", ".mp4", ".wasm", ".node", ".so", ".avif"]);
const MAX_MERET = 20 * 1024 * 1024;
let fajlDb = 0;
function bejar(mappa, gyoker, kihagy) {
  if (!existsSync(mappa)) return;
  for (const nev of readdirSync(mappa)) {
    const ut = join(mappa, nev);
    const rel = relative(gyoker, ut).split("\\").join("/");
    if (kihagy(rel, nev)) continue;
    let st; try { st = statSync(ut); } catch { continue; }
    vizsgal(`${rel}#fajlnev`, nev); // a fájl NEVE is számít (pl. egy régi logó fájlneve)
    if (st.isDirectory()) { bejar(ut, gyoker, kihagy); continue; }
    if (!st.isFile() || st.size > MAX_MERET || BINARIS.has(extname(nev).toLowerCase())) continue;
    fajlDb++;
    vizsgal(rel, readFileSync(ut, "utf8"));
  }
}
/** a harmadik féltől jövő node_modules kimarad; a saját csomagjaink (@rogton) nem */
const harmadikFel = (rel) => /(^|\/)node_modules\//.test(rel + "/") && !/node_modules\/(\.pnpm\/[^/]*\/node_modules\/)?@rogton(\/|$)/.test(rel);

// A migrációk: az ÚJ (0181-től) fájlok szigorúan; a régiek (≤ 0180, soha nem szerkesztjük őket) címkesorai csak akkor tűrhetők, ha egy
// újabb migráció UGYANAZT a (kulcs, nyelv) párt felülírja — ezt itt szerkezetileg ellenőrizzük. Amit nem lehet soronként felismerni
// (pl. egy CASE-es UPDATE), azt az engedett.txt nevesíti, és a végső állapotot a `--db` (és a kirak.sh) méri.
const HATAR = "0181";
const TUPLE = /\(\s*'((?:[^']|'')+)'\s*,\s*'(hu|ro|en)'\s*,\s*'((?:[^']|'')*)'\s*\)/g;
function migraciok() {
  const mappa = join(GYOKER, "apps/web/adatbazis/migraciok");
  const nevek = readdirSync(mappa).filter((n) => n.endsWith(".sql")).sort();
  const felulirt = new Set();
  for (const nev of nevek.filter((n) => n >= HATAR)) {
    for (const m of readFileSync(join(mappa, nev), "utf8").matchAll(TUPLE)) felulirt.add(`${m[1]}|${m[2]}`);
  }
  for (const nev of nevek) {
    const rel = `apps/web/adatbazis/migraciok/${nev}`;
    const sorok = readFileSync(join(mappa, nev), "utf8").split("\n");
    // a megjegyzés-sorokat külön hely-jelöléssel nézzük, hogy az engedélylista csak AZOKAT tűrhesse
    vizsgal(`${rel}#megjegyzes`, sorok.filter((s) => s.trim().startsWith("--")).join("\n"));
    let kod = sorok.filter((s) => !s.trim().startsWith("--")).join("\n");
    if (nev < HATAR) {
      kod = kod.replace(TUPLE, (egesz, kulcs, nyelv) => {
        if (!felulirt.has(`${kulcs}|${nyelv}`)) return egesz; // nincs felülírva → marad a vizsgálatban (piros, ha tiltott szó van benne)
        const elotte = talalatok.length;
        vizsgal(`${rel}#felulirt`, egesz);
        for (const t of talalatok.splice(elotte)) turt.push({ ...t, ok: `régi címkesor, a ${HATAR}+ migráció felülírja (${kulcs} [${nyelv}])` });
        return "(…)";
      });
    }
    vizsgal(rel, kod);
  }
}

function tarhely() {
  const web = join(GYOKER, "apps/web");
  if (!existsSync(join(web, ".next/server"))) {
    console.error("✖ tiltott-szó őr: nincs lefordított alkalmazás (apps/web/.next/server) — előbb `pnpm epit`");
    process.exit(2);
  }
  // A forrástérképek (*.map: a forrás megjegyzésekkel) NEM kerülnek a dobozba — a Dockerfile törli őket (`-name '*.map' -delete`),
  // és a dockerfile-ellenőrzés alább ezt meg is követeli. A doboz (--kep) vizsgálata mindent néz.
  const terkep = (rel) => rel.endsWith(".map");
  const df = readFileSync(join(GYOKER, "Dockerfile"), "utf8");
  if (!/find apps\/web\/\.next -name '\*\.map' -delete/.test(df)) vizsgal("Dockerfile#map-torles", "HIÁNYZIK a forrástérképek törlése a Dockerfile-ból: gigabyte");
  bejar(join(web, ".next/server"), GYOKER, terkep);
  bejar(join(web, ".next/static"), GYOKER, terkep);
  for (const m of ["apps/web/public", "apps/web/prompts", "apps/web/feliratok", "packages/news-monitor-feliratok/feliratok",
    "packages/news-monitor-promptok/promptok", "apps/kepgyar/src", "apps/kepgyar/minta", "packages/vizual-core/src", "packages/vizual-receptek",
    "tools/vizual/referencia"]) bejar(join(GYOKER, m), GYOKER, (rel) => harmadikFel(rel));
  migraciok();
}

function kep(gyoker) {
  bejar(gyoker, gyoker, (rel) => harmadikFel(rel) || /^(proc|sys|dev)(\/|$)/.test(rel));
}

// ---- adatbázis ---------------------------------------------------------------------------------------------------------------
function sqlMinta() {
  // JS → PostgreSQL ARE: \b → \y; a (?:…) csoport ott is érvényes
  return `(${MINTAK.map((m) => m.replace(/\\b/g, "\\y")).join("|")})`;
}
const FELIRAT_SQL = (minta) => `
  SELECT 'felirat ' || kulcs || ' [' || nyelv || ']' AS hely, szoveg FROM felirat WHERE szoveg ~* ${minta}
  UNION ALL SELECT 'kozos_felirat_verzio v' || verzio, felulirasok::text FROM kozos_felirat_verzio WHERE felulirasok::text ~* ${minta}
  UNION ALL SELECT 'szervezet_felirat_verzio ' || szervezet_id || ' v' || verzio, felulirasok::text FROM szervezet_felirat_verzio WHERE felulirasok::text ~* ${minta}
  ORDER BY 1`;
function adatbazis(url) {
  const lit = `'${sqlMinta().replace(/'/g, "''")}'`;
  const ki = execFileSync("psql", [url, "-X", "-tA", "-F", "\t", "-v", "ON_ERROR_STOP=1", "-c", FELIRAT_SQL(lit)], { encoding: "utf8" });
  for (const sor of ki.split("\n").filter(Boolean)) { const [hely, ...t] = sor.split("\t"); vizsgal(`db:${hely}`, t.join("\t")); }
}

// ---- bejárás ------------------------------------------------------------------------------------------------------------------
async function bejaras(alap, fiok) {
  const LAPOK = ["/", "/belepes", "/regisztracio", "/jelszo-elfelejtve", "/adatkezeles", "/manifest.webmanifest", "/robots.txt", "/api/egeszseg", "/nincs-ilyen-lap-404"];
  const BELEPVE = ["/kezdolap", "/poszt", "/kepek", "/beallitasok", "/sajat-fiok", "/onboarding", "/hirfigyelo", "/iranytu", "/naptar", "/fiok", "/fiok/arculat", "/tagok", "/visszajelzes", "/tema", "/feliratok", "/koltseg", "/gephaz"];
  let suti = "";
  const latott = new Set();
  const sor = [];
  async function lekér(ut, html) {
    const cim = new URL(ut, alap).toString();
    if (latott.has(cim)) return; latott.add(cim);
    const v = await fetch(cim, { headers: { cookie: suti, "accept-language": "hu-HU,ro;q=0.8" }, redirect: "follow" });
    const fej = [...v.headers.entries()].map(([k, e]) => `${k}: ${e}`).join("\n");
    vizsgal(`${ut}#fejlec`, fej);
    vizsgal(`${ut}#cim`, decodeURIComponent(new URL(v.url).pathname));
    const tipus = v.headers.get("content-type") ?? "";
    if (/image|font|octet-stream|video|pdf/.test(tipus)) { await v.arrayBuffer(); return; }
    const szoveg = await v.text();
    vizsgal(ut, szoveg);
    if (html || /html|javascript|css/.test(tipus)) {
      // a lap által betöltött saját fájlok (script, css, kép, ikon, manifest) — csak azonos eredetűek
      for (const m of szoveg.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^"')]+)["']?\)|["'](\/_next\/static\/[^"'\s]+)["']/g)) {
        const u = m[1] ?? m[2] ?? m[3];
        if (!u || u.startsWith("data:") || u.startsWith("#")) continue;
        try { const abs = new URL(u, cim); if (abs.origin === new URL(alap).origin) sor.push(abs.pathname + abs.search); } catch { /* nem cím */ }
      }
    }
  }
  for (const l of LAPOK) await lekér(l, true);
  if (fiok) {
    const [email, ...j] = fiok.split(":");
    const b = await fetch(new URL("/api/fiok/belepes", alap), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, jelszo: j.join(":") }) });
    if (b.status !== 200) { console.error(`✖ bejárás: a belépés nem sikerült (${b.status})`); process.exit(2); }
    suti = b.headers.getSetCookie().map((s) => s.split(";")[0]).join("; ");
    for (const l of BELEPVE) await lekér(l, true);
  }
  while (sor.length) await lekér(sor.shift(), false);
  return latott.size;
}

// ---- futtatás -------------------------------------------------------------------------------------------------------------------
if (van("--sql-minta")) { process.stdout.write(sqlMinta()); process.exit(0); }
let mit;
if (arg("--kep")) { kep(arg("--kep")); mit = `kép (${arg("--kep")}): ${fajlDb} szövegfájl`; }
else if (arg("--db")) { adatbazis(arg("--db")); mit = "adatbázis feliratai"; }
else if (arg("--bejar")) { const n = await bejaras(arg("--bejar"), arg("--fiok")); mit = `bejárás (${arg("--bejar")}): ${n} cím${arg("--fiok") ? ", belépve is" : ", kijelentkezve"}`; }
else { tarhely(); mit = `tárhely: ${fajlDb} szövegfájl + ${readdirSync(join(GYOKER, "apps/web/adatbazis/migraciok")).length} migráció`; }

const turtDb = turt.length;
if (talalatok.length) {
  console.error(`✖ tiltott-szó őr — ${mit}: ${talalatok.length} találat (${turtDb} tűrt az engedett.txt szerint)`);
  const csoport = new Map();
  for (const t of talalatok) { const k = `${t.hely} · ${t.minta}`; if (!csoport.has(k)) csoport.set(k, []); csoport.get(k).push(t.reszlet); }
  let i = 0;
  const MAX = van("--mind") ? Infinity : 60;
  for (const [k, r] of csoport) { if (i++ >= MAX) { console.error(`  … és még ${csoport.size - 60} hely (mind: --mind)`); break; } console.error(`  ${k} (${r.length}×): …${r[0]}…`); }
  process.exit(1);
}
const okok = new Map();
for (const t of turt) { const k = t.ok.replace(/ \([^()]*\[(hu|ro|en)\]\)$/, ""); okok.set(k, (okok.get(k) ?? 0) + 1); }
console.log(`✔ tiltott-szó őr — ${mit}: 0 találat${turtDb ? ` (${turtDb} tűrt: ${[...okok].map(([k, n]) => `${n}× ${k}`).join("; ")})` : ""}.`);
