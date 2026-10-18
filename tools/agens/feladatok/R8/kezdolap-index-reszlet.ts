export async function kezdolapNezet(
  fiok: FiokNezet,
  szervezet: { id: string; nev: string },
  szerep: Szerep,
): Promise<KezdolapNezet> {
  const penznem = await munkaterPenznem(szervezet.id).catch((h) => {
    console.error("[kezdolap] penznem:", h);
    return "EUR" as Penznem;
  });
  const arf = await arfolyamok().catch((h) => {
    console.error("[kezdolap] arfolyam:", h);
    return { ...ALAP_ARFOLYAM };
  });

  // Egy profil-olvasás a három profil-eredetű mezőhöz (első használat, profil csempe, arculat).
  let profilSor: SzervezetProfil | null = null;
  try {
    profilSor = await profilBetolt(szervezet.id);
  } catch (h) {
    console.error("[kezdolap] profil:", h);
  }
  const elsoHasznalat = profilSor === null;
  const arculat: ArculatAllapot = profilSor ? profilSor.arculat.allapot : "nincs";

  let hirfigyelo: HirfigyeloCsempe | null = null;
  try {
    hirfigyelo = await hirfigyeloCsempe(fiok, szervezet.id);
  } catch (h) {
    console.error("[kezdolap] hirfigyelo:", h);
    hirfigyelo = null;
  }

  let profil: ProfilCsempe | null = null;
  if (profilSor) {
    try {
      profil = await profilCsempe(szervezet.id, profilSor);
    } catch (h) {
      console.error("[kezdolap] profil csempe:", h);
      profil = { jovahagyva: profilSor.jovahagyva, jovahagyta_nev: "", hianyzo: [...profilSor.kesobbre] };
    }
  }

  let forrasok: ForrasokCsempe = uresForrasok();
  try {
    forrasok = await forrasokCsempe(fiok, szervezet.id);
  } catch (h) {
    console.error("[kezdolap] forrasok:", h);
    forrasok = uresForrasok();
  }

  let koltseg: KoltsegCsempe = uresKoltseg(penznem, honapVagyMost(null));
  try {
    koltseg = await koltsegCsempe(szervezet.id, penznem, arf);
  } catch (h) {
    console.error("[kezdolap] koltseg:", h);
    koltseg = uresKoltseg(penznem, honapVagyMost(null));
  }

  let tervezet = { tema: false, feliratok: false };
  try {
    const t = await szervezetTemaAllapot(szervezet.id);
    const f = await feliratSzervezetAllapot(szervezet.id);
    tervezet = { tema: t.tervezet !== null, feliratok: f.tervezet !== null };
  } catch (h) {
    console.error("[kezdolap] tervezet:", h);
    tervezet = { tema: false, feliratok: false };
  }

  return {
    munkater: { id: szervezet.id, nev: szervezet.nev, penznem },
    szerep,
    elso_hasznalat: elsoHasznalat,
    hirfigyelo,
    profil,
    arculat,
    forrasok,
    koltseg,
    tervezet,
  };
}

