// A folyamat végigvitele a konzolra írva.
import {
  beallitasMent,
  forrasHozzaad,
  forrasEllenoriz,
  figyelesFuttat,
  attekintes,
  visszajelzesRogzit,
  javaslatKer,
  javaslatKiprobal,
  javaslatDont,
  memoriaTar,
  type Visszajelzes,
} from "@rogton/news-monitor-core";
import { kontextus, rogzitettLetolto, tesztAi, idAdo, most, rogzitettProfil } from "./host.js";

async function main(): Promise<void> {
  const tar = memoriaTar();
  const k = { tar, letolto: rogzitettLetolto, ai: tesztAi, profil: rogzitettProfil, idAdo, most };

  console.log("=== Hírfigyelő próba ===\n");

  // 1. Beállítás mentése (ai_elokeszites)
  console.log("1. Beállítás mentése (ai_elokeszites)...");
  const beallitas = {
    celok: ["sajat_marka", "szakmai"],
    temak: [
      { nev: "Minta Műhely", nevvaltozatok: ["Minta Muhely"], megkulonboztetes: "bútor" },
      { nev: "bútor", nevvaltozatok: [], megkulonboztetes: "" },
    ],
    foldrajzi_fokusz: "Magyarország",
    nyelvek: ["hu", "ro"],
    kizarasok: ["nagyüzemi"],
    idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Budapest" },
    szabad_szoveg: "Kézműves bútorok, asztalos műhely.",
  };
  const mentes = await beallitasMent(k, kontextus, beallitas, "ai_elokeszites");
  if (!mentes.ok) { console.log("HIBA:", mentes.hiba); return; }
  console.log(`   Verzió: ${mentes.uj?.verzio ?? "nincs új"}\n`);

  // 2. Forrás hozzáadás (3 cím)
  console.log("2. Forrás hozzáadás...");
  const jo = await forrasHozzaad(k, kontextus, "https://pelda.hu/feed", "kezi");
  const hibas = await forrasHozzaad(k, kontextus, "https://hibas.pelda.hu/", "kezi");
  const facebook = await forrasHozzaad(k, kontextus, "https://facebook.com/mintamuhely", "kezi");
  if (!jo.ok || !hibas.ok || !facebook.ok) { console.log("HIBA forrás hozzáadáskor"); return; }
  console.log(`   Jó: ${jo.forras.id}, hibás: ${hibas.forras.id}, facebook: ${facebook.forras.id} (${facebook.forras.allapot})\n`);

  // 3. Ellenőrzés
  console.log("3. Források ellenőrzése...");
  const ell1 = await forrasEllenoriz(k, kontextus, jo.forras.id);
  const ell2 = await forrasEllenoriz(k, kontextus, hibas.forras.id);
  if (!ell1.ok || !ell2.ok) { console.log("HIBA ellenőrzéskor"); return; }
  console.log(`   Jó: ${ell1.forras.allapot}, hibás: ${ell2.forras.allapot} (${ell2.forras.hiba_ok})\n`);

  // 4. Futtatás (próba)
  console.log("4. Futtatás (próba)...");
  const futas = await figyelesFuttat(k, kontextus, { proba: true });
  if (!futas.ok) { console.log("HIBA:", futas.hiba); return; }
  console.log(`   Futás: ${futas.futas.allapot}, új kártya (esemény): ${futas.futas.uj_talalatok}, cikk: ${futas.ujTalalatok.length}, minta: ${futas.minta ? "van" : "nincs"}\n`);

  // 5. Áttekintés
  console.log("5. Áttekintés...");
  const attekintesAdat = await attekintes(k, kontextus);
  if (!attekintesAdat.ok) { console.log("HIBA:", attekintesAdat.hiba); return; }
  console.log(`   Találatok: ${attekintesAdat.talalatok.length}, új: ${attekintesAdat.ujDb}, hibás források: ${attekintesAdat.forrasHibak.length}\n`);

  // 6. Visszajelzés
  console.log("6. Visszajelzés rögzítése...");
  const elsoTalalat = attekintesAdat.talalatok[0];
  if (!elsoTalalat) { console.log("Nincs találat"); return; }
  const v: Visszajelzes = {
    id: idAdo(),
    talalat_id: elsoTalalat.id,
    fajta: "nem_relevans",
    okok: ["masik_ceg"],
    sajat_indok: "Ez nem a Minta Műhelyről szól",
    letrehozva: most().toISOString(),
  };
  const vRogzites = await visszajelzesRogzit(k, kontextus, v);
  if (!vRogzites.ok) { console.log("HIBA:", vRogzites.hiba); return; }
  console.log("   Visszajelzés rögzítve.\n");

  // 7. Javaslat
  console.log("7. Javaslat kérése...");
  const javaslat = await javaslatKer(k, kontextus);
  if (!javaslat.ok) { console.log("HIBA:", javaslat.hiba); return; }
  console.log(`   Javaslat: ${javaslat.javaslat.id}, állapot: ${javaslat.javaslat.allapot}\n`);

  // 8. Kipróbálás (összehasonlítás)
  console.log("8. Javaslat kipróbálása...");
  const kiproba = await javaslatKiprobal(k, kontextus, javaslat.javaslat.id);
  if (!kiproba.ok) { console.log("HIBA:", kiproba.hiba); return; }
  console.log(`   Összehasonlítás: ${kiproba.osszehasonlitas.length} elem\n`);

  // 9. Elfogadás (új verzió)
  console.log("9. Javaslat elfogadása...");
  const dontes = await javaslatDont(k, kontextus, javaslat.javaslat.id, "elfogad");
  if (!dontes.ok) { console.log("HIBA:", dontes.hiba); return; }
  console.log(`   Új verzió: ${dontes.ujVerzio?.verzio ?? "nincs"}\n`);

  // 10. Újrafuttatás (ugyanannyi találat, nincs duplikátum)
  console.log("10. Újrafuttatás...");
  const futas2 = await figyelesFuttat(k, kontextus, { proba: false });
  if (!futas2.ok) { console.log("HIBA:", futas2.hiba); return; }
  console.log(`   Futás: ${futas2.futas.allapot}, új kártya: ${futas2.futas.uj_talalatok}, cikk: ${futas2.ujTalalatok.length} (0 várt — ugyanaz a cikk nem kerül be kétszer, A-10)\n`);

  console.log("=== Kész ===\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
