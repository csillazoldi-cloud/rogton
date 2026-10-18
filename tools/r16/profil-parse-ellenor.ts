// R-16 K1 · TERV 1.7 R1-b — CSAK OLVAS. A tárolt profilok és onboarding-piszkozatok beolvashatók-e az ÚJ sémával, és a régi logó
// (`logo_fajl_id`) ugyanaz maradt-e (`logok.vilagos`) a tervezetben ÉS minden pillanatképben. A K1 (és a K5, K6) kirakása ELŐTT fut,
// a NAS-ról kimentett sorokon. Ha bármi hibás: 1-es kilépési kód, és a kirakás NEM indul.
//
// Kimentés a NAS-on (soronként egy jsonb; a -At miatt fejléc és keret nélkül):
//   ssh nas 'sudo docker exec aitmetica-saas-db psql -U km_tulaj -d km -At -c "select adatok from szervezet_profil"' > profilok.txt
//   ssh nas 'sudo docker exec aitmetica-saas-db psql -U km_tulaj -d km -At -c "select adatok from onboarding_piszkozat"' > piszkozatok.txt
// Futtatás a tárhely gyökeréből (Node 24 típus-lehántással, vagy: npx tsx …):
//   node tools/r16/profil-parse-ellenor.ts profilok.txt piszkozatok.txt
// A sor fajtáját a tartalma dönti el: `bemutatkozas` kulcs → piszkozat, különben profil.
import { readFileSync } from "node:fs";
import { OnboardingPiszkozat, SzervezetProfil } from "../../packages/contracts/src/index.ts";

type Nyers = Record<string, unknown>;
const obj = (x: unknown): Nyers | null => (x && typeof x === "object" && !Array.isArray(x) ? (x as Nyers) : null);
/** A régi adat logója: a nyers JSON `logo_fajl_id`-je (ha a sor már új alakú, a `logok.vilagos`-a elől). */
const nyersLogo = (t: Nyers | null): string | null => {
  if (!t) return null;
  const l = obj(t["logok"]);
  const v = (l?.["vilagos"] as string | null | undefined) ?? (t["logo_fajl_id"] as string | null | undefined);
  return v ?? null;
};

const fajlok = process.argv.slice(2);
if (fajlok.length === 0) {
  console.error("Használat: node tools/r16/profil-parse-ellenor.ts <psql -At kimentés> [további kimentés …]");
  process.exit(2);
}

let sorDb = 0, profilDb = 0, piszkozatDb = 0, hibas = 0, logoElteres = 0, pillanatkepDb = 0, legnagyobb = 0;
const reszletek: string[] = [];
for (const f of fajlok) {
  const sorok = readFileSync(f, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
  sorok.forEach((sor, i) => {
    sorDb++;
    const hol = `${f}:${i + 1}`;
    legnagyobb = Math.max(legnagyobb, Buffer.byteLength(sor, "utf8"));
    let nyers: Nyers | null;
    try { nyers = obj(JSON.parse(sor)); } catch { nyers = null; }
    if (!nyers) { hibas++; reszletek.push(`${hol}: nem JSON-objektum`); return; }
    const piszkozat = "bemutatkozas" in nyers;
    if (piszkozat) piszkozatDb++; else profilDb++;
    const e = piszkozat ? OnboardingPiszkozat.safeParse(nyers) : SzervezetProfil.safeParse(nyers);
    if (!e.success) {
      hibas++;
      reszletek.push(`${hol}: NEM olvasható az új sémával — ${e.error.issues.slice(0, 3).map((x) => `${x.path.join(".")}: ${x.code}`).join("; ")}`);
      return;
    }
    const nyersA = obj(nyers["arculat"]);
    const ujA = e.data.arculat;
    // a tervezet
    const nyersT = obj(nyersA?.["tervezet"]);
    if (nyersT && ujA.tervezet) {
      const regi = nyersLogo(nyersT);
      if (ujA.tervezet.logok.vilagos !== regi || ujA.tervezet.logo_fajl_id !== regi) {
        logoElteres++;
        reszletek.push(`${hol}: tervezet logója eltér (régi ${regi}, új logok.vilagos ${ujA.tervezet.logok.vilagos}, tükör ${ujA.tervezet.logo_fajl_id})`);
      }
    } else if (nyersT && !ujA.tervezet) {
      hibas++;
      reszletek.push(`${hol}: a tervezet eltűnt a beolvasáskor`);
    }
    // minden pillanatkép
    const nyersV = obj(nyersA?.["verziok"]) ?? {};
    for (const [k, v] of Object.entries(nyersV)) {
      pillanatkepDb++;
      const uj = ujA.verziok[k];
      if (!uj) { hibas++; reszletek.push(`${hol}: a ${k}. pillanatkép eltűnt a beolvasáskor`); continue; }
      const regi = nyersLogo(obj(v));
      if (uj.logok.vilagos !== regi || uj.logo_fajl_id !== regi) {
        logoElteres++;
        reszletek.push(`${hol}: a ${k}. pillanatkép logója eltér (régi ${regi}, új ${uj.logok.vilagos})`);
      }
    }
  });
}

for (const r of reszletek) console.log("  " + r);
const kb = (legnagyobb / 1024).toFixed(1);
const nagy = legnagyobb > 256 * 1024 ? " · FIGYELEM: 256 KB fölötti profil — jelezd a state.md-ben (TERV 1.7 R6), NE vágd" : "";
console.log(`R1-b profil-parse: ${sorDb} sor (${profilDb} profil, ${piszkozatDb} piszkozat) · ${hibas} hibás · ${logoElteres} logó-eltérés · ${pillanatkepDb} pillanatkép · legnagyobb ${kb} KB${nagy} → ${hibas === 0 && logoElteres === 0 ? "RENDBEN" : "HIBA — a kirakás NEM indulhat"}`);
process.exit(hibas === 0 && logoElteres === 0 ? 0 : 1);
