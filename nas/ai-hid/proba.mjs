// Az AI-híd önálló próbái. Futtatás:  node nas/ai-hid/proba.mjs
// Nincs hozzá vitest: a híd egyetlen .mjs fájl, dobozban fut, függőség nélkül.
//
// A B-05 REPRODUKCIÓS PRÓBÁJA: a javítás ELŐTT elbukott (a SIGKILL soha nem futott le,
// mert a feltétele a válasz elkészültét nézte, nem a folyamat kilépését).
import { futtatasIdokorlattal } from "./hid.mjs";
import { writeFileSync, unlinkSync } from "node:fs";

let hibak = 0;
function allit(felt, nev) {
  console.log((felt ? "  OK   " : "  BUKIK") + "  " + nev);
  if (!felt) hibak++;
}

// SIGTERM-et FIGYELMEN KÍVÜL HAGYÓ gyerek: csak SIGKILL viszi el.
const MAKACS = "/tmp/km-makacs-proba.mjs";
writeFileSync(MAKACS, `process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);\n`);

console.log("B-05 — a SIGTERM-et figyelmen kivul hagyo folyamat kenyszerleallitasa");
const t0 = Date.now();
const eredmeny = await futtatasIdokorlattal("node", [MAKACS], {}, 800, undefined);
const valaszIdo = Date.now() - t0;

allit(eredmeny.idotullepes === true, "a hivo idotullepest kap");
allit(valaszIdo < 2000, `a valasz nem varja meg a folyamatot (${valaszIdo} ms)`);

// A SIGKILL 3 masodperccel a SIGTERM utan jon; varunk ra, aztan nezzuk, el-e meg.
await new Promise((r) => setTimeout(r, 4200));
let elMeg = false;
try { process.kill(eredmeny.pid ?? -1, 0); elMeg = true; } catch { elMeg = false; }
allit(!elMeg, "a folyamat a SIGKILL utan tenyleg megszunt");

// Nincs arva folyamat: a szamlalo visszaallt
const { eloFolyamatokSzama } = await import("./hid.mjs");
allit(eloFolyamatokSzama() === 0, `nem maradt elo folyamat (most ${eloFolyamatokSzama()})`);

try { unlinkSync(MAKACS); } catch { /* mindegy */ }
console.log(hibak === 0 ? "\nMINDEN PROBA ZOLD" : `\n${hibak} PROBA BUKOTT`);
process.exit(hibak === 0 ? 0 : 1);
