// Az állapotlap egysoros felvezetése (ALLAPOT-SZABALY 4.1). Az adat: nas/public/allapot/allapot.json.
//
//   pnpm allapot kezd    F-2a "A kezdőképernyő csempéi" --ki kimi,claude --ora 3 [--szakasz F-2] [--hatra] [--rajtad]
//   pnpm allapot indit   F-3e --ki claude,kimi --ora 6      (egy előre felvett, hátra lévő lépés indítása)
//   pnpm allapot kesz    F-2a
//   pnpm allapot lezar   F-8.5 --miert "kiváltotta: Kati tesztjei (c16–c18)"   (kész + egysoros ok a név végén; soha nem töröl)
//   pnpm allapot szakasz F-2 --szazalek 40 --allapot folyamatban [--leiras "…"]
//   pnpm allapot naplo   "Az R-1 rajz ellenőrzése kész: hibátlan" [--ido "10-10 21:48"]   (--ido: utólagos sor a helyére, időrendben)
//   pnpm allapot rajtad  "A modul-lista jóváhagyása" --miert "enélkül az F-7 nem indulhat"
//   pnpm allapot rajtad-kesz "A modul-lista"          (a tétel eleje szerint; a rajtad listáról leveszi)
//   pnpm allapot --nem-tesz-ki                        (bármelyik mellé: csak a fájlt írja, a NAS-ra nem teszi)
//
// Minden hívás: beírja a sort, átállítja a `frissitve` mezőt, ELLENŐRZI a sémát, és kiteszi a lapot (nas/allapot-kirak.sh).
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ellenoriz } from "./sema.mjs";

const GYOKER = process.cwd();
const FAJL = join(GYOKER, "nas", "public", "allapot", "allapot.json");
const argv = process.argv.slice(2);
const nemTeszKi = argv.includes("--nem-tesz-ki");
const a = argv.filter((x) => x !== "--nem-tesz-ki");
const opcio = (n, d) => { const i = a.indexOf(n); return i > 0 && a[i + 1] !== undefined ? a[i + 1] : d; };
const pozicios = a.filter((x, i) => !x.startsWith("--") && !(i > 0 && a[i - 1].startsWith("--")));
const [parancs, ...tobbi] = pozicios;

const d = JSON.parse(readFileSync(FAJL, "utf8"));
const most = new Date();
const ido = `${String(most.getMonth() + 1).padStart(2, "0")}-${String(most.getDate()).padStart(2, "0")} ${String(most.getHours()).padStart(2, "0")}:${String(most.getMinutes()).padStart(2, "0")}`;

function hiba(sz) { console.error(`✖ allapot: ${sz}`); process.exit(2); }

switch (parancs) {
  case "kezd": {
    const [kod, nev] = tobbi;
    if (!kod || !nev) hiba("kezd <kód> <név> --ki a,b --ora n [--szakasz F-n]");
    if (d.lepesek.some((l) => l.kod === kod)) hiba(`van már ${kod} lépés — használd a kesz parancsot, vagy más kódot`);
    const ki = opcio("--ki", "claude").split(",").map((s) => s.trim()).filter(Boolean);
    // --hatra (c6, 2026-10-11): nyitott, de még senki nem dolgozik rajta — a szakaszt sem indítja el
    const hatra = a.includes("--hatra");
    const lepes = { kod, nev, allapot: hatra ? "hatra" : "folyamatban", ora: Number(opcio("--ora", "1")), agens: ki.filter((k) => k !== "claude").length, ki };
    if (a.includes("--rajtad")) lepes.rajtad = true;
    d.lepesek.push(lepes);
    const szakasz = opcio("--szakasz", kod.split(/[a-z.]/)[0]);
    const sz = d.szakaszok.find((s) => s.kod === szakasz);
    if (sz && sz.allapot === "hatra" && !hatra) sz.allapot = "folyamatban";
    break;
  }
  case "indit": {
    // egy már felvett (hatra) lépés indítása: folyamatban + ki/ora — a régi, előre felvett lépéseknek
    const [kod] = tobbi;
    const l = d.lepesek.find((x) => x.kod === kod);
    if (!l) hiba(`nincs ${kod} lépés`);
    l.allapot = "folyamatban"; delete l.rajtad;
    if (opcio("--ki")) { l.ki = opcio("--ki").split(",").map((s) => s.trim()).filter(Boolean); l.agens = l.ki.filter((k) => k !== "claude").length; }
    if (opcio("--ora")) l.ora = Number(opcio("--ora"));
    const sz = d.szakaszok.find((s) => s.kod === (opcio("--szakasz", kod.split(/[a-z.]/)[0])));
    if (sz && sz.allapot === "hatra") sz.allapot = "folyamatban";
    break;
  }
  case "kesz": {
    const [kod] = tobbi;
    const l = d.lepesek.find((x) => x.kod === kod);
    if (!l) hiba(`nincs ${kod} lépés`);
    l.allapot = "kesz"; delete l.rajtad;
    break;
  }
  case "lezar": {
    // c6 (2026-10-11): lezárás egysoros okkal — a lépés kész lesz, a név végére kerül „· lezárva MM-DD: <ok>”. Nem töröl (törvény).
    const [kod] = tobbi;
    const miert = opcio("--miert");
    if (!kod || !miert) hiba("lezar <kód> --miert <egy mondat>");
    const l = d.lepesek.find((x) => x.kod === kod);
    if (!l) hiba(`nincs ${kod} lépés`);
    l.allapot = "kesz"; delete l.rajtad;
    if (!l.nev.includes(" · lezárva ")) l.nev = `${l.nev} · lezárva ${ido.slice(0, 5)}: ${miert}`;
    break;
  }
  case "szakasz": {
    const [kod] = tobbi;
    const sz = d.szakaszok.find((s) => s.kod === kod);
    if (!sz) hiba(`nincs ${kod} szakasz`);
    if (opcio("--szazalek")) sz.szazalek = Number(opcio("--szazalek"));
    if (opcio("--allapot")) sz.allapot = opcio("--allapot");
    if (opcio("--leiras")) sz.leiras = opcio("--leiras");
    break;
  }
  case "naplo": {
    const [mi] = tobbi;
    if (!mi) hiba("naplo <mondat>");
    const sajatIdo = opcio("--ido");
    if (sajatIdo !== undefined && !/^\d{2}-\d{2} \d{2}:\d{2}$/.test(sajatIdo)) hiba("--ido formája: MM-DD HH:MM");
    if (sajatIdo === undefined) d.naplo.unshift({ ido, mi });
    else {
      // utólagos sor: a helyére, a legfrissebb legfelül (az év közös — a lap egy éven belüli naplót tart)
      const i = d.naplo.findIndex((n) => /^\d{2}-\d{2} \d{2}:\d{2}$/.test(n.ido) && n.ido < sajatIdo); // a régi, dátum nélküli „23:50” sorokat átlépi
      d.naplo.splice(i < 0 ? d.naplo.length : i, 0, { ido: sajatIdo, mi });
    }
    break;
  }
  case "rajtad": {
    const [mit] = tobbi;
    if (!mit) hiba("rajtad <mit> --miert <miért>");
    d.rajtad.unshift({ mit, miert: opcio("--miert", "") });
    break;
  }
  case "rajtad-kesz": {
    const [eleje] = tobbi;
    const n = d.rajtad.length;
    d.rajtad = d.rajtad.filter((r) => !r.mit.startsWith(eleje));
    if (d.rajtad.length === n) hiba(`nincs ilyen kezdetű rajtad-tétel: ${eleje}`);
    break;
  }
  default:
    hiba("parancs: kezd | indit | kesz | lezar | szakasz | naplo | rajtad | rajtad-kesz");
}

d.frissitve = new Date(most.getTime() - most.getTimezoneOffset() * 60000).toISOString().replace("Z", "").slice(0, 16) + tzJel(most);
const hibak = ellenoriz(d);
if (hibak.length) { console.error("✖ a séma nem stimmel:\n  " + hibak.join("\n  ")); process.exit(3); }
writeFileSync(FAJL, JSON.stringify(d, null, 2) + "\n");
console.log(`✔ allapot: ${parancs} beírva (${ido})`);

if (!nemTeszKi) {
  const r = spawnSync("bash", [join(GYOKER, "nas", "allapot-kirak.sh")], { encoding: "utf8" });
  const atment = (r.stdout ?? "").split("\n").filter((s) => s.includes("átment")).length;
  if (atment >= 2) console.log("✔ a lap kint van a NAS-on");
  else { console.error("✖ a kitevés nem sikerült — a fájl megvan, tedd ki később: bash nas/allapot-kirak.sh\n" + (r.stderr ?? "").slice(-400)); process.exit(4); }
}

function tzJel(dt) {
  const o = -dt.getTimezoneOffset(); const j = o >= 0 ? "+" : "-"; const h = String(Math.floor(Math.abs(o) / 60)).padStart(2, "0"); const m = String(Math.abs(o) % 60).padStart(2, "0");
  return `${j}${h}:${m}`;
}
