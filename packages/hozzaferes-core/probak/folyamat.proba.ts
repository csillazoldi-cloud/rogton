import { describe, expect, it } from "vitest";
import {
  kilep,
  meghiv,
  meghivoElfogad,
  meghivoLista,
  meghivoVisszavon,
  szerepAllit,
  tagEltavolit,
  tagokLista,
  type HostKontextus,
} from "../src/index";
import { memoriaKornyezet, tagBeir, type MemoriaKornyezet } from "./segedek";

const SZ = "sz-1";

function ktx(fiok_id: string, szerep: HostKontextus["szerep"]): HostKontextus {
  return { fiok_id, szervezet_id: SZ, szerep };
}

function alapKornyezet(): MemoriaKornyezet {
  const k = memoriaKornyezet("2026-01-01T00:00:00.000Z");
  tagBeir(k, SZ, "t1", "tulajdonos");
  tagBeir(k, SZ, "s1", "szerkeszto");
  tagBeir(k, SZ, "n1", "nezo");
  return k;
}

describe("folyamat — meghívó kiadás és elfogadás", () => {
  it("kiadás: a jegy a válaszban van, a tárban csak a lenyomat", async () => {
    const k = alapKornyezet();
    const r = await meghiv(k, ktx("s1", "szerkeszto"), { szerep: "nezo" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ertek.jegy).toBe("jegy-1");
    expect(r.ertek.meghivo.lenyomat).toBe("ln:jegy-1");
    expect(r.ertek.meghivo.lenyomat).not.toBe(r.ertek.jegy);
    const tarolt = k.meghivokTar.get(r.ertek.meghivo.id);
    expect(tarolt?.lenyomat).toBe("ln:jegy-1");
    expect(k.esemenyek.some((e) => e.fajta === "meghivo_kiadva")).toBe(true);
  });

  it("elfogadás: felvesz + elfogadott + két esemény; másodszor MEGHIVO_FELHASZNALVA", async () => {
    const k = alapKornyezet();
    const ki = await meghiv(k, ktx("s1", "szerkeszto"), { szerep: "nezo" });
    if (!ki.ok) throw new Error("kiadás hiba");
    const jegy = ki.ertek.jegy;

    const el = await meghivoElfogad(k, { fiok_id: "uj1" }, jegy);
    expect(el.ok).toBe(true);
    if (!el.ok) return;
    expect(el.ertek.szervezet_id).toBe(SZ);
    expect(el.ertek.szerep).toBe("nezo");

    const tagok = await k.tagsag.tagok(SZ);
    expect(tagok.some((t) => t.fiok_id === "uj1")).toBe(true);

    const tarolt = k.meghivokTar.get(ki.ertek.meghivo.id);
    expect(tarolt?.allapot).toBe("elfogadott");
    expect(tarolt?.elfogadta).toBe("uj1");

    const fajtak = k.esemenyek.map((e) => e.fajta);
    expect(fajtak).toContain("meghivo_elfogadva");
    expect(fajtak).toContain("tag_felveve");

    const masodik = await meghivoElfogad(k, { fiok_id: "uj2" }, jegy);
    expect(masodik).toEqual({ ok: false, hiba: "MEGHIVO_FELHASZNALVA" });
  });

  it("lejárt jegy → MEGHIVO_LEJART, és a meghivoLista allapot_most-ja lejart", async () => {
    const k = alapKornyezet();
    const ki = await meghiv(k, ktx("s1", "szerkeszto"), { szerep: "nezo" });
    if (!ki.ok) throw new Error("kiadás hiba");

    k.oraBeallit("2026-01-09T00:00:00.000Z");

    const el = await meghivoElfogad(k, { fiok_id: "uj1" }, ki.ertek.jegy);
    expect(el).toEqual({ ok: false, hiba: "MEGHIVO_LEJART" });

    const lista = await meghivoLista(k, ktx("s1", "szerkeszto"));
    expect(lista.ok).toBe(true);
    if (!lista.ok) return;
    expect(lista.ertek[0].allapot_most).toBe("lejart");
  });

  it("visszavont → MEGHIVO_VISSZAVONVA", async () => {
    const k = alapKornyezet();
    const ki = await meghiv(k, ktx("s1", "szerkeszto"), { szerep: "nezo" });
    if (!ki.ok) throw new Error("kiadás hiba");

    const v = await meghivoVisszavon(k, ktx("s1", "szerkeszto"), ki.ertek.meghivo.id);
    expect(v.ok).toBe(true);

    const el = await meghivoElfogad(k, { fiok_id: "uj1" }, ki.ertek.jegy);
    expect(el).toEqual({ ok: false, hiba: "MEGHIVO_VISSZAVONVA" });
  });

  it("már tag → MAR_TAG", async () => {
    const k = alapKornyezet();
    const ki = await meghiv(k, ktx("s1", "szerkeszto"), { szerep: "nezo" });
    if (!ki.ok) throw new Error("kiadás hiba");

    const el = await meghivoElfogad(k, { fiok_id: "n1" }, ki.ertek.jegy);
    expect(el).toEqual({ ok: false, hiba: "MAR_TAG" });
  });

  it("ismeretlen jegy → NINCS_ILYEN_MEGHIVO", async () => {
    const k = alapKornyezet();
    const el = await meghivoElfogad(k, { fiok_id: "uj1" }, "nincs-ilyen");
    expect(el).toEqual({ ok: false, hiba: "NINCS_ILYEN_MEGHIVO" });
  });
});

describe("folyamat — szerep és tagság", () => {
  it("szerepAllit sikeres útja szerep_valtozott eseménnyel", async () => {
    const k = alapKornyezet();
    const r = await szerepAllit(k, ktx("t1", "tulajdonos"), "n1", "szerkeszto");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ertek.szerep).toBe("szerkeszto");
    expect(
      k.esemenyek.some(
        (e) => e.fajta === "szerep_valtozott" && e.fiok_id === "n1",
      ),
    ).toBe(true);
  });

  it("tagEltavolit sikeres útja tag_eltavolitva eseménnyel", async () => {
    const k = alapKornyezet();
    const r = await tagEltavolit(k, ktx("t1", "tulajdonos"), "n1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ertek.fiok_id).toBe("n1");
    const tagok = await k.tagsag.tagok(SZ);
    expect(tagok.some((t) => t.fiok_id === "n1")).toBe(false);
    expect(
      k.esemenyek.some(
        (e) => e.fajta === "tag_eltavolitva" && e.fiok_id === "n1",
      ),
    ).toBe(true);
  });

  it("tagokLista nézőnek is szabad", async () => {
    const k = alapKornyezet();
    const r = await tagokLista(k, ktx("n1", "nezo"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ertek.length).toBe(3);
  });

  it("kilep: az utolsó tulajdonos nem léphet ki", async () => {
    const k = memoriaKornyezet("2026-01-01T00:00:00.000Z");
    tagBeir(k, SZ, "t1", "tulajdonos");
    const r = await kilep(k, ktx("t1", "tulajdonos"));
    expect(r).toEqual({ ok: false, hiba: "UTOLSO_TULAJDONOS" });
  });
});
