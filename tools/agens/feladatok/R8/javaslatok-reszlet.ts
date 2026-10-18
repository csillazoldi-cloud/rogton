  if (osszefoglalo) feladatSorok.push(`Tevékenység-összefoglaló: ${osszefoglalo}`);
  else if (leiras) feladatSorok.push(`Tevékenység-összefoglaló: ${leiras}`);
  const celkozonsegValasz = b.celkozonseg?.trim(); // az 1. lépés kihagyható kérdésének válasza
  if (celkozonsegValasz) feladatSorok.push(`A felhasználó szerint a célközönség: ${celkozonsegValasz}`);
  const forrasTipus = b.forras_tipus === "weboldal" && b.weboldal?.trim() ? `weboldal ${b.weboldal.trim()}` : "saját leírás";
  feladatSorok.push(`Forrás: ${forrasTipus}`);

  await keretVagyJavaslatHiba(szervezetId);
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({
      feladat: "javaslatok",
      rendszer: await prompt("javaslatok", felulet, tnyelv),
      szoveg: feladatSorok.join("\n"),
      nyelv: felulet,
      maxKiToken: 600,
      idokorlatMs: 30_000,
    });
    await meresRogzit(szervezetId, v.meres);
    const nyers = jsonRobusztusan(v.szoveg);
    const elemzett = JSON.parse(nyers) as unknown;
    const ellenorzott = JavaslatokValasz.omit({ forras: true, tartalomnyelv: true }).safeParse(elemzett);
    if (!ellenorzott.success) throw new AiHiba("AI_ROSSZ_VALASZ");
    const ertek = ellenorzott.data;
    const ervenyesNyelvek = ertek.nyelvek.filter((n) => TARTALOMNYELV_NEVEK[n] !== undefined);
    return {
      ...ertek,
      nyelvek: ervenyesNyelvek,
      tartalomnyelv: tnyelv,
      forras: sz.leirolap.azonosito === "teszt" ? "teszt" : "ai",
    };
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = {
      szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "javaslatok",
      tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod,
    };
    await meresRogzit(szervezetId, meres);
    if (kod === "AI_KERET_KIMERULT") throw new JavaslatHiba("AI_KERET_KIMERULT");
    console.error("AI-hívás sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
