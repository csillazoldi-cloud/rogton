    ki.mi_alapjan = ki.mi_alapjan.filter((m): m is string => typeof m === "string");
  }

  return ki;
}

// F9-AI1 (MÉRVE 2026-09-15): a modell 3/3 menetben a fontosság mezőbe a témacímkét írta egy cikknél — determinisztikus megfeleltetés, a prompt saját meghatározása szerint
/** A relevancia-válasz szelídítése: a `fontossag` és a `temacimke` mezők keveredésének javítása, valamint a szöveges mezők rövidítése. */
export function relevanciaSzelidit(nyers: unknown): unknown {
  if (!objektumE(nyers)) return nyers;
  const ki: Record<string, unknown> = { ...nyers };

  // fontossag: ha nem az engedélyezett értékek egyike, de a témacímke értékét tartalmazza → megfeleltetés.
  if (typeof ki.fontossag === "string") {
    const f = ki.fontossag;
    if (f !== "fontos" && f !== "erdekes" && f !== "hatter") {
      if (f === "sajat_megjelenes") ki.fontossag = "fontos";
      else if (f === "szakmai" || f === "tartalomotlet") ki.fontossag = "erdekes";
    }
  }

  // temacimke: ha nem az engedélyezett értékek egyike, de a fontosság értékét tartalmazza → fordított megfeleltetés.
  if (typeof ki.temacimke === "string") {
    const t = ki.temacimke;
    if (t !== "sajat_megjelenes" && t !== "szakmai" && t !== "tartalomotlet") {
      if (t === "fontos") ki.temacimke = "sajat_megjelenes";
      else if (t === "erdekes") ki.temacimke = "szakmai";
      else if (t === "hatter") ki.temacimke = "tartalomotlet";
    }
  }

  // Szöveges mezők: trim + szovegRovidit a séma szerint.
  if (typeof ki.osszefoglalo === "string") ki.osszefoglalo = szovegRovidit(ki.osszefoglalo.trim(), 400);
  if (typeof ki.miert === "string") ki.miert = szovegRovidit(ki.miert.trim(), 300);
  if (typeof ki.indoklas === "string") ki.indoklas = szovegRovidit(ki.indoklas.trim(), 800);

  return ki;
}

/** A feladat szerinti szelídítő; a többi feladatnál (hf_ugyanaz_az_esemeny, hf_tartalomotlet) a válasz változatlan. */
export function aiValaszSzelidit(feladat: string, valasz: unknown): unknown {
  switch (feladat) {
    case "hf_beallitas_javaslat":
      if (objektumE(valasz) && "beallitas" in valasz) {
        return { ...valasz, beallitas: beallitasSzelidit(valasz.beallitas) };
      }
      return valasz;
    case "hf_osszkep":
      return osszkepSzelidit(valasz);
    case "hf_szabaly_javaslat":
      return szabalyJavaslatSzelidit(valasz);
    case "hf_relevancia":
      return relevanciaSzelidit(valasz);
    default:
      return valasz;
  }
}
