    ujTalalatok.push(talalat);
    await k.tar.talalatMent(szervezetId, talalat);
  }

  // 8) Értékelés: hf_relevancia egyenként
  const ertekelesSzam = Math.min(ujTalalatok.length, HF_NAPI_CIKK);
  await haladas(0, ertekelesSzam);
  for (let i = 0; i < ertekelesSzam; i++) {
    if (keretKimerult) break;
    if (lejart()) { felbeszakadt = true; break; }
    const talalat = ujTalalatok[i]!;
    const kivonat = ujKivonatok.find((kv) => kv.id === talalat.kivonat_id);
    if (!kivonat) continue;
    const valasz = await k.ai("hf_relevancia", {
      profil: k.profil,
      beallitas: aktiv.beallitas,
      kivonat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt, nyelv: kivonat.nyelv },
    });
    if (valasz.ok) {
      const ell = aiValaszEllenoriz("hf_relevancia", valasz.valasz, { talalat_ids: [] });
      if (ell.ok) {
        const r = ell.ertek as RelevanciaValasz;
        talalat.ertekeles = {
          fontossag: r.fontossag,
          temacimke: r.temacimke,
          miert: r.miert,
          indoklas: r.indoklas,
          osszefoglalo: r.osszefoglalo,
          szabaly_verzio: aktiv.verzio,
          ertekelve: most.toISOString(),
          csonkolt_alapjan: kivonat.csonkolt,
        };
        talalat.ertekeles_allapot = "kesz";
      } else {
        aiHibaVolt = true;
        futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
      }
    } else if (valasz.kod === "AI_KERET_KIMERULT") {
      keretKimerult = true;
      talalat.ertekeles_allapot = "keret_kimerult";
    } else {
      aiHibaVolt = true;
      futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
    }
    await k.tar.talalatMent(szervezetId, talalat);
    await haladas(i + 1, ertekelesSzam);
  }
  // A korlát feletti találatok fuggoben maradnak; ha a keret fogyott el, MINDEN még nem értékelt találat ezt mutatja
