// packages/news-monitor-core/src/folyamat.ts — RÉSZLET (tartalomotletKer)
  return { ok: true, osszkep: v };
}

/** Tartalomötlet kérése egy találathoz — CSAK ez a folyamat hívja, soha nem automatikus. */
export async function tartalomotletKer(k: Kornyezet, ktx: HostKontextus, talalatId: string): Promise<Eredmeny<{ talalat: Talalat }>> {
  const jog = jogEllenoriz(ktx, "futtat");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const talalatok = await k.tar.talalatok(szervezetId);
  const talalat = talalatok.find((t) => t.id === talalatId);
  if (!talalat) return { ok: false, hiba: "NINCS_ILYEN_TALALAT" };

  // Ha már van tartalomötlet, nem hívunk AI-t
  if (talalat.tartalomotlet) return { ok: true, talalat };

  const kivonatok = await k.tar.kivonatok(szervezetId, [talalat.kivonat_id]);
  const kivonat = kivonatok[0];
  if (!kivonat) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_kivonat" };

  const profil = k.profil as { hangnem_leiras?: string } | null | undefined;
  const hangnem = profil?.hangnem_leiras ?? "";

  const valasz = await k.ai("hf_tartalomotlet", {
    talalat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt },
    hangnem,
  });
  if (!valasz.ok) {
    if (valasz.kod === "AI_KERET_KIMERULT") return { ok: false, hiba: "AI_KERET_KIMERULT" };
    if (valasz.kod === "AI_ROSSZ_VALASZ") return { ok: false, hiba: "AI_ROSSZ_VALASZ" };
    return { ok: false, hiba: "AI_NEM_ELERHETO" };
  }
  const ell = aiValaszEllenoriz("hf_tartalomotlet", valasz.valasz, { talalat_ids: [] });
  if (!ell.ok) return { ok: false, hiba: "AI_ROSSZ_VALASZ", reszlet: ell.reszlet };
  const v = ell.ertek as TartalomotletValasz;

  const frissitett: Talalat = {
    ...talalat,
