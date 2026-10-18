// G8: a lebegő Visszajelzés gomb kapcsolója a környezetből (uzem/.env.pelda: VISSZAJELZES_GOMB, alapértéke „ki”).
// Csak a pontos „be” kapcsolja be: üres, hiányzó vagy elgépelt érték → ki (az élő gépen a gomb a kifejezett döntés szerint nincs).
export function visszajelzesGombBe(ertek: string | undefined = process.env.VISSZAJELZES_GOMB): boolean {
  return (ertek ?? "").trim().toLowerCase() === "be";
}
