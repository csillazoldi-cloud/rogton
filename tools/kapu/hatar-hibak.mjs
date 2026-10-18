// c4 kapu — a határőr (dependency-cruiser) szabálysértései soronként, azonosítóval, hogy a régiek alapvonalba tehetők legyenek,
// egy ÚJ sértés viszont pirosat adjon. A tárhely saját .dependency-cruiser.cjs-ét és saját dependency-cruiserét használja.
//   node tools/kapu/hatar-hibak.mjs <munkafa>   → JSON: { "rendben": bool, "hibak": ["ellenoriz::hatar::<szabály>::<út>", …] }
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const munkafa = process.argv[2] ?? process.cwd();
const r = spawnSync(process.execPath, [
  join(munkafa, "tools/hatar/node_modules/dependency-cruiser/bin/dependency-cruise.mjs"),
  "--config", ".dependency-cruiser.cjs", "-T", "json", "packages", "apps",
], { cwd: munkafa, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
let j;
try { j = JSON.parse(r.stdout); } catch {
  console.log(JSON.stringify({ rendben: false, hibak: ["ellenoriz::hatar::(a határőr nem futott le)"], hiba: (r.stderr ?? "").slice(-400) }));
  process.exit(0);
}
const hibak = [];
for (const v of j.summary?.violations ?? []) {
  if (v.rule?.severity !== "error") continue;
  // körnél a kör tagjai (sorrendjük a kör kezdőpontjától független: a legkisebb névtől forgatjuk)
  let ut;
  if (Array.isArray(v.cycle) && v.cycle.length) {
    const tagok = [v.from, ...v.cycle.map((c) => (typeof c === "string" ? c : c.name))].filter((x, i, a) => a.indexOf(x) === i);
    const k = tagok.indexOf([...tagok].sort()[0]);
    ut = [...tagok.slice(k), ...tagok.slice(0, k)].join(" → ");
  } else ut = `${v.from} → ${v.to}`;
  hibak.push(`ellenoriz::hatar::${v.rule.name}::${ut}`);
}
const egyedi = [...new Set(hibak)].sort();
console.log(JSON.stringify({ rendben: egyedi.length === 0, hibak: egyedi }, null, 2));
