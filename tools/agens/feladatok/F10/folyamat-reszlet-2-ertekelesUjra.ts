
/** A fuggoben találatok újraértékelése a kivonatból, letöltés nélkül. */
export async function ertekelesUjra(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{ ujraErtekelt: number }>> {
  const jog = jogEllenoriz(ktx, "futtat");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  if (!aktiv) return { ok: false, hiba: "NINCS_BEALLITAS" };

  const talalatok = await k.tar.talalatok(szervezetId);
  const fuggoben = talalatok.filter((t) => t.ertekeles_allapot === "fuggoben");
  let ujraErtekelt = 0;
  for (const talalat of fuggoben) {
    const kivonatok = await k.tar.kivonatok(szervezetId, [talalat.kivonat_id]);
    const kivonat = kivonatok[0];
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
          ertekelve: k.most().toISOString(),
          csonkolt_alapjan: kivonat.csonkolt,
        };
        talalat.ertekeles_allapot = "kesz";
        await k.tar.talalatMent(szervezetId, talalat);
        ujraErtekelt++;
      }
    }
  }
  return { ok: true, ujraErtekelt };
}
