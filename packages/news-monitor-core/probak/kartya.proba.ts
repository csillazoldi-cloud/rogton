// E-23: kártyák (egy esemény = egy kártya) és a tartalomötlet csak kérésre.
import { describe, expect, it } from "vitest";
import {
  kartyakEpit,
  memoriaTar,
  tartalomotletKer,
  type AiHivo,
  type Esemeny,
  type Forras,
  type HostKontextus,
  type Kivonat,
  type Kornyezet,
  type Talalat,
} from "../src";

const SZ = "11111111-1111-4111-8111-111111111111";
const IDO = "2026-09-08T06:00:00.000Z";

function forras(id: string, cim = `https://${id}.example/feed`): Forras {
  return { id, cim, tipus: "rss", eredet: "kezi", allapot: "hasznalhato", ellenorzott: true, utolso_sikeres: IDO, hiba_ok: null };
}
function kivonat(id: string, forrasId: string, szoveg: string, cim = `Cím ${id}`): Kivonat {
  return {
    id, forras_id: forrasId, cim, url: `https://${forrasId}.example/${id}`, kanonikus_url: `${forrasId}.example/${id}`, megjelenes: IDO,
    begyujtes: IDO, szoveg, csonkolt: false, ujjlenyomat: `uj-${id}`, nyelv: "hu", lejar: "2026-10-08T06:00:00.000Z",
  };
}
function talalat(id: string, esemenyId: string, ertekelt: boolean, extra: Partial<Talalat> = {}): Talalat {
  return {
    id, szervezet_id: SZ, esemeny_id: esemenyId, kivonat_id: id,
    ertekeles: ertekelt ? { fontossag: "fontos", temacimke: "szakmai", miert: "mert", indoklas: "ind", osszefoglalo: "", szabaly_verzio: 2, ertekelve: IDO, csonkolt_alapjan: false } : null,
    ertekeles_allapot: ertekelt ? "kesz" : "fuggoben", megtekintes: "uj", jeloles: "nincs", letrehozva: IDO, futas_id: "f1", tartalomotlet: null, ...extra,
  };
}
function esemeny(id: string, fo: string, ids: string[], letrehozva = IDO): Esemeny {
  return { id, szervezet_id: SZ, fo_talalat_id: fo, talalat_ids: ids, letrehozva };
}

const hosszu = Array.from({ length: 60 }, (_, i) => `szó${i}`).join(" ") + ".";

describe("kartyakEpit", () => {
  it("egy esemény két találattal → egy kártya, két forrás, forras_szam 2", () => {
    const k = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1", "t2"])],
      talalatok: [talalat("t1", "e1", true), talalat("t2", "e1", true)],
      kivonatok: [kivonat("t1", "f1", "Első cikk szövege."), kivonat("t2", "f2", "Második cikk szövege.")],
      forrasok: [forras("f1"), forras("f2")],
    });
    expect(k).toHaveLength(1);
    expect(k[0]!.forras_szam).toBe(2);
    expect(k[0]!.forrasok.map((f) => f.forras_id)).toEqual(["f1", "f2"]);
    expect(k[0]!.cim).toBe("Cím t1");
    expect(k[0]!.fontossag).toBe("fontos");
    expect(k[0]!.szabaly_verzio).toBe(2);
  });

  it("megtekintes: „uj”, ha az esemény BÁRMELYIK találata új; különben megtekintett", () => {
    const be = {
      esemenyek: [esemeny("e1", "t1", ["t1", "t2"])],
      talalatok: [talalat("t1", "e1", true, { megtekintes: "megtekintett" }), talalat("t2", "e1", true)],
      kivonatok: [kivonat("t1", "f1", "a."), kivonat("t2", "f1", "b.")],
      forrasok: [forras("f1")],
    };
    expect(kartyakEpit(be)[0]!.megtekintes).toBe("uj");
    be.talalatok[1]!.megtekintes = "megtekintett";
    expect(kartyakEpit(be)[0]!.megtekintes).toBe("megtekintett");
  });

  it("összefoglaló: az értékelésből; ha üres, a kivonat első 300 karaktere szóhatáron, „…”-tal", () => {
    const ert = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"])],
      talalatok: [talalat("t1", "e1", true, { ertekeles: { fontossag: "erdekes", temacimke: "szakmai", miert: "m", indoklas: "", osszefoglalo: "AI-összefoglaló.", szabaly_verzio: 1, ertekelve: IDO, csonkolt_alapjan: false } })],
      kivonatok: [kivonat("t1", "f1", hosszu)], forrasok: [forras("f1")],
    });
    expect(ert[0]!.osszefoglalo).toBe("AI-összefoglaló.");
    const tartalek = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"])], talalatok: [talalat("t1", "e1", false)],
      kivonatok: [kivonat("t1", "f1", hosszu)], forrasok: [forras("f1")],
    });
    const o = tartalek[0]!.osszefoglalo;
    expect(o.length).toBeLessThanOrEqual(301);
    expect(o.endsWith("…")).toBe(true);
    expect(o).not.toMatch(/szó\d*…$/.source.replace("szó", "szó\\d+[a-z]")); // nem vág szó közepén: „…” előtt teljes szó áll
    expect(/ szó\d+…$/.test(o)).toBe(true);
  });

  it("értékeletlen találat → fontossag null, ertekeles_allapot fuggoben, szabaly_verzio null", () => {
    const k = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"])], talalatok: [talalat("t1", "e1", false)],
      kivonatok: [kivonat("t1", "f1", "a.")], forrasok: [forras("f1")],
    });
    expect(k[0]!.fontossag).toBeNull();
    expect(k[0]!.temacimke).toBeNull();
    expect(k[0]!.szabaly_verzio).toBeNull();
    expect(k[0]!.ertekeles_allapot).toBe("fuggoben");
  });

  it("hiányzó kivonat → az a forrás kimarad, a kártya marad; ha egy sincs, a kártya kimarad", () => {
    const k = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1", "t2"]), esemeny("e2", "t3", ["t3"])],
      talalatok: [talalat("t1", "e1", true), talalat("t2", "e1", true), talalat("t3", "e2", true)],
      kivonatok: [kivonat("t1", "f1", "a.")], forrasok: [forras("f1")],
    });
    expect(k).toHaveLength(1);
    expect(k[0]!.esemeny_id).toBe("e1");
    expect(k[0]!.forras_szam).toBe(1);
  });

  it("rendezés: létrehozás szerint csökkenő", () => {
    const k = kartyakEpit({
      esemenyek: [esemeny("regi", "t1", ["t1"], "2026-09-01T00:00:00.000Z"), esemeny("uj", "t2", ["t2"], "2026-09-08T00:00:00.000Z")],
      talalatok: [talalat("t1", "regi", true), talalat("t2", "uj", true)],
      kivonatok: [kivonat("t1", "f1", "a."), kivonat("t2", "f1", "b.")], forrasok: [forras("f1")],
    });
    expect(k.map((x) => x.esemeny_id)).toEqual(["uj", "regi"]);
  });

  it("F10-M1: az értékelés cim_forditott mezője a kártyára kerül, a cim az eredeti marad", () => {
    const k = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"])],
      talalatok: [talalat("t1", "e1", true, { ertekeles: { fontossag: "fontos", temacimke: "szakmai", miert: "m", indoklas: "", osszefoglalo: "", szabaly_verzio: 2, ertekelve: IDO, csonkolt_alapjan: false, cim_forditott: "Fordított cím" } })],
      kivonatok: [kivonat("t1", "f1", "a.")], forrasok: [forras("f1")],
    });
    expect(k[0]!.cim_forditott).toBe("Fordított cím");
    expect(k[0]!.cim).toBe("Cím t1");
  });

  it("F10-M1: értékelés nélkül a cim_forditott üres", () => {
    const k = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1"])],
      talalatok: [talalat("t1", "e1", false)],
      kivonatok: [kivonat("t1", "f1", "a.")], forrasok: [forras("f1")],
    });
    expect(k[0]!.cim_forditott).toBe("");
  });
});

describe("tartalomotletKer", () => {
  function kornyezet(ai: AiHivo, profil: unknown = { hangnem_leiras: "közvetlen" }) {
    const tar = memoriaTar();
    const k: Kornyezet = { tar, ai, letolto: async () => ({ ok: false, hiba: "nincs" }) as never, profil, idAdo: () => "id", most: () => new Date(IDO) };
    return { k, tar };
  }
  const tulaj: HostKontextus = { fiok_id: "22222222-2222-4222-8222-222222222222", szervezet_id: SZ, szerep: "tulajdonos" };
  const nezo: HostKontextus = { ...tulaj, szerep: "nezo" };

  async function elokeszit(k: Kornyezet) {
    await k.tar.forrasMent(SZ, forras("f1"));
    await k.tar.kivonatMent(SZ, kivonat("t1", "f1", "A cikk szövege."));
    await k.tar.talalatMent(SZ, talalat("t1", "e1", true));
  }

  it("néző → NINCS_JOG; nincs ilyen találat → NINCS_ILYEN_TALALAT", async () => {
    const { k } = kornyezet(async () => ({ ok: true, valasz: {}, becsult_usd: 0 }));
    await elokeszit(k);
    expect(await tartalomotletKer(k, nezo, "t1")).toEqual({ ok: false, hiba: "NINCS_JOG" });
    expect(await tartalomotletKer(k, tulaj, "nincs")).toEqual({ ok: false, hiba: "NINCS_ILYEN_TALALAT" });
  });

  it("siker: az ötlet mentve, a hangnem a profilból megy; második kérés NEM hív AI-t", async () => {
    let hivas = 0;
    let kapottHangnem = "";
    const ai: AiHivo = async (feladat, be) => {
      hivas++;
      expect(feladat).toBe("hf_tartalomotlet");
      kapottHangnem = (be as { hangnem: string }).hangnem;
      return { ok: true, valasz: { szoveg: "Javaslat: posztold.", nyelv: "hu" }, becsult_usd: 0 };
    };
    const { k, tar } = kornyezet(ai);
    await elokeszit(k);
    const e1 = await tartalomotletKer(k, tulaj, "t1");
    expect(e1.ok).toBe(true);
    if (!e1.ok) return;
    expect(e1.talalat.tartalomotlet).toEqual({ szoveg: "Javaslat: posztold.", nyelv: "hu", keszult: IDO });
    expect(kapottHangnem).toBe("közvetlen");
    const mentett = (await tar.talalatok(SZ)).find((t) => t.id === "t1");
    expect(mentett?.tartalomotlet?.szoveg).toBe("Javaslat: posztold.");
    const e2 = await tartalomotletKer(k, tulaj, "t1");
    expect(e2.ok).toBe(true);
    expect(hivas).toBe(1);
  });

  it("AI-hiba → a hiba kódja; rossz válasz → AI_ROSSZ_VALASZ; semmi nem mentődik", async () => {
    const { k: k1, tar: tar1 } = kornyezet(async () => ({ ok: false, kod: "AI_KERET_KIMERULT" }));
    await elokeszit(k1);
    expect(await tartalomotletKer(k1, tulaj, "t1")).toEqual({ ok: false, hiba: "AI_KERET_KIMERULT" });
    expect((await tar1.talalatok(SZ))[0]!.tartalomotlet).toBeNull();
    const { k: k2 } = kornyezet(async () => ({ ok: true, valasz: { szoveg: 12 }, becsult_usd: 0 }));
    await elokeszit(k2);
    const e = await tartalomotletKer(k2, tulaj, "t1");
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.hiba).toBe("AI_ROSSZ_VALASZ");
  });
});

// E-31 — VERZIÓFRISSÍTÉSI PRÓBA (0.1.0 → 0.2.0): az új mező VÁLASZTHATÓ, a régiek változatlanok.
// Ez a próba azt őrzi, hogy a 0.1.0-ra írt host kódja a 0.2.0-val is fut.
describe("0.2.0 — kompatibilis bővítés: esemeny_ideje", () => {
  it("a kártya a LEGKORÁBBI megjelenést kapja, és a régi mezők érintetlenek", () => {
    const korabbi = { ...kivonat("t2", "f2", "Második cikk."), megjelenes: "2026-09-06T08:00:00.000Z" };
    const kesobbi = { ...kivonat("t1", "f1", "Első cikk."), megjelenes: "2026-09-07T09:00:00.000Z" };
    const k = kartyakEpit({
      esemenyek: [esemeny("e1", "t1", ["t1", "t2"])],
      talalatok: [talalat("t1", "e1", true), talalat("t2", "e1", true)],
      kivonatok: [kesobbi, korabbi],
      forrasok: [forras("f1"), forras("f2")],
    });
    expect(k).toHaveLength(1);
    expect(k[0]!.esemeny_ideje).toBe("2026-09-06T08:00:00.000Z");
    // a 0.1.0 mezői változatlanul a helyükön
    expect(k[0]!.esemeny_id).toBe("e1");
    expect(k[0]!.forras_szam).toBe(2);
    expect(k[0]!.letrehozva).toBe(IDO);
  });

  it("megjelenési idő nélküli forrásnál üres — a 0.1.0-ra írt hostot nem zavarja", () => {
    const k = kartyakEpit({
      esemenyek: [esemeny("e2", "t3", ["t3"])],
      talalatok: [talalat("t3", "e2", true)],
      kivonatok: [{ ...kivonat("t3", "f1", "Harmadik cikk."), megjelenes: null }],
      forrasok: [forras("f1")],
    });
    expect(k[0]!.esemeny_ideje).toBeNull();
  });
});
