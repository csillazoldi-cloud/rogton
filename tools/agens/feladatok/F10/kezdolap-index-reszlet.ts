  return {
    utolso_sikeres: utolso?.veg ?? null,
    utolso_futas: legutobbiVege,
    kovetkezo: a.kovetkezo ? a.kovetkezo.toISOString() : null,
    idozona,
    fut: a.aktivFutas !== null,
    uj: a.ujDb ?? 0,
    forrashiba: hibasForrasok.size,
    // R-7b 02: a 3 legfontosabb friss cím — a kártyák (egy esemény = egy kártya) fontos → érdekes → háttér sorrendben, az elrejtettek nélkül
    elso_cimek: [...(a.kartyak ?? [])]
      .filter((k) => k.jeloles !== "elrejtett")
      .sort((x, y) => sorrend(x.fontossag) - sorrend(y.fontossag))
      .slice(0, 3)
      .map((k) => ({ talalat_id: k.fo_talalat_id, cim: k.cim, kategoria: k.fontossag ?? "hatter" })),
    fuggoben,
    keret_kimerult: keretKimerult,
  };
}
