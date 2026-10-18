import "server-only";
// F9-A2: az összkép TÁROLVA — futásonként egyszer készül, nem lapnyitásonként.
import { and, eq } from "drizzle-orm";
import { ALAP_SZURES, osszkep, OsszkepValasz, szuroKulcs, type Hiba, type Kornyezet, type HostKontextus } from "@km/news-monitor-core";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";

type Eredmeny<T> = { ok: true } & T | Hiba;

/** Az utolsó sikeres futás: a legkésőbbi kezdet, ahol az állapot kesz/reszleges/ai_fuggoben. */
function utolsoSikeresFutas(futasok: Awaited<ReturnType<Kornyezet["tar"]["futasok"]>>) {
  const sikeres = futasok.filter((f) => f.allapot === "kesz" || f.allapot === "reszleges" || f.allapot === "ai_fuggoben");
  if (sikeres.length === 0) return null;
  return sikeres.reduce((a, b) => (new Date(b.kezdet).getTime() > new Date(a.kezdet).getTime() ? b : a));
}

export async function osszkepTarolt(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{ osszkep: OsszkepValasz; tarolt: boolean }>> {
  const futasok = await k.tar.futasok(ktx.szervezet_id);
  const utolso = utolsoSikeresFutas(futasok);
  if (!utolso) {
    return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_futas" };
  }

  // R-13: az összkép a néző szűrő-beállítása szerint — az azonos beállítású tagok ugyanazt látják
  const kulcs = szuroKulcs(k.nezo ?? ALAP_SZURES);
  const sor = await szervezetKent(ktx.szervezet_id, async (tx) => {
    const sorok = await tx.select().from(sema.hfOsszkep).where(and(eq(sema.hfOsszkep.szervezetId, ktx.szervezet_id), eq(sema.hfOsszkep.szuroKulcs, kulcs))).limit(1);
    return sorok[0] ?? null;
  });

  // 2. Van sor, ugyanahhoz a futáshoz, és van érvényes összkép → tárolt válasz.
  if (sor && sor.futasId === utolso.id && sor.osszkep !== null) {
    const e = OsszkepValasz.safeParse(sor.osszkep);
    if (e.success) {
      return { ok: true, osszkep: e.data, tarolt: true };
    }
  }

  // 3. Van sor, ugyanahhoz a futáshoz, de az összkép NULL és a hiba 1 óránál fiatalabb → nem hívunk AI-t.
  if (sor && sor.futasId === utolso.id && sor.osszkep === null && sor.hibaIdeje !== null) {
    const eltelt = Date.now() - new Date(sor.hibaIdeje).getTime();
    if (eltelt < 60 * 60 * 1000) {
      return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "osszkep_varakozik" };
    }
  }

  // 4. Különben: a mag folyamata (ez hívja az AI-t).
  const e = await osszkep(k, ktx);
  if (e.ok) {
    await szervezetKent(ktx.szervezet_id, async (tx) => {
      await tx
        .insert(sema.hfOsszkep)
        .values({
          szervezetId: ktx.szervezet_id,
          szuroKulcs: kulcs,
          futasId: utolso.id,
          osszkep: e.osszkep,
          hibaIdeje: null,
          frissitve: new Date(),
        })
        .onConflictDoUpdate({
          target: [sema.hfOsszkep.szervezetId, sema.hfOsszkep.szuroKulcs],
          set: {
            futasId: utolso.id,
            osszkep: e.osszkep,
            hibaIdeje: null,
            frissitve: new Date(),
          },
        });
    });
    return { ok: true, osszkep: e.osszkep, tarolt: false };
  }

  await szervezetKent(ktx.szervezet_id, async (tx) => {
    await tx
      .insert(sema.hfOsszkep)
      .values({
        szervezetId: ktx.szervezet_id,
        szuroKulcs: kulcs,
        futasId: utolso.id,
        osszkep: null,
        hibaIdeje: new Date(),
        frissitve: new Date(),
      })
      .onConflictDoUpdate({
        target: [sema.hfOsszkep.szervezetId, sema.hfOsszkep.szuroKulcs],
        set: {
          futasId: utolso.id,
          osszkep: null,
          hibaIdeje: new Date(),
          frissitve: new Date(),
        },
      });
  });
  return e;
}

/**
 * 2026-09-22: újraszűrés után a tárolt összkép már nem igaz (más hírek maradtak meg) — töröljük, és a lap
 * következő nyitásakor az új, meg nem szűrt hírekből készül.
 */
export async function osszkepTorol(szervezetId: string): Promise<void> {
  await szervezetKent(szervezetId, async (tx) => {
    await tx.delete(sema.hfOsszkep).where(eq(sema.hfOsszkep.szervezetId, szervezetId));
  });
}
