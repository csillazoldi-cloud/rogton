// 0.3.0 (Csilla 2026-10-10): 100 MB az arculati/szervezeti fájloknak, 10 MB a betűnek és a posztképnek; a nagy fájl útja
// `feltoltFajlbol` + `FajlTar.mentFajlbol` (a mag csak a méretet és a fejet látja). A típus-ellenőrzés és az SVG-tilalom ugyanaz.
import { describe, expect, it } from "vitest";
import { BETU_MAX_MERET_BAJT, KEP_MAX_MERET_BAJT, MAX_MERET_BAJT, celMaxMeret, fajlEllenoriz, fajlFolyam, feltoltFajlbol, type FajlMeta, type Kornyezet } from "../src/index.js";

const pdf = new TextEncoder().encode("%PDF-1.4\n");
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">');
const MB = 1024 * 1024;

function kornyezet(fajlbol = true): { k: Kornyezet; mentett: { meta: FajlMeta; ut: string }[] } {
  const mentett: { meta: FajlMeta; ut: string }[] = [];
  const k: Kornyezet = {
    tar: {
      ment: async () => { throw new Error("a nagy út nem a memóriás mentést hívja"); },
      meta: async () => null, olvas: async () => null, lista: async () => [],
      ...(fajlbol ? { mentFajlbol: async (meta: FajlMeta, ut: string) => { mentett.push({ meta, ut }); } } : {}),
    },
    ora: { most: () => "2026-10-10T20:00:00.000Z" },
    azonosito: { uj: () => "00000000-0000-4000-8000-000000000001" },
    esemeny: () => {},
  };
  return { k, mentett };
}
const ktx = { fiok_id: "f", szervezet_id: "s", szerep: "szerkeszto" as const };

describe("0.3.0 — 100 MB, célonkénti korlát", () => {
  it("a korlátok: dokumentum/logó/kézikönyv/referencia 100 MB, betű és posztkép 10 MB", () => {
    expect(MAX_MERET_BAJT).toBe(100 * MB);
    expect(KEP_MAX_MERET_BAJT).toBe(10 * MB);
    expect(BETU_MAX_MERET_BAJT).toBe(10 * MB);
    for (const c of ["dokumentum", "logo", "kezikonyv", "referencia"] as const) expect(celMaxMeret(c)).toBe(100 * MB);
    expect(celMaxMeret("betu")).toBe(10 * MB);
    expect(celMaxMeret("kep")).toBe(10 * MB);
    expect(celMaxMeret()).toBe(100 * MB);
  });
  it("99 MB PDF átmegy, 101 MB nem (TUL_NAGY); posztképnél 11 MB már TUL_NAGY", () => {
    expect(fajlEllenoriz({ meret: 99 * MB, fej: pdf }, { cel: "dokumentum" }).ok).toBe(true);
    expect(fajlEllenoriz({ meret: 101 * MB, fej: pdf }, { cel: "dokumentum" })).toEqual({ ok: false, hiba: "TUL_NAGY" });
    expect(fajlEllenoriz({ meret: 11 * MB, fej: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) }, { cel: "kep" })).toEqual({ ok: false, hiba: "TUL_NAGY" });
  });
  it("feltoltFajlbol: a fej szerinti típus, a tár mentFajlbol-ja kapja az ideiglenes utat; SVG tilos; jog nélkül nincs", async () => {
    const { k, mentett } = kornyezet();
    const e = await feltoltFajlbol(k, ktx, { nev: "kezikonyv.pdf", cel: "kezikonyv", meret: 99 * MB, fej: pdf, ideiglenesUt: "/tmp/x.part" });
    expect(e.ok).toBe(true);
    expect(mentett).toHaveLength(1);
    expect(mentett[0]!.ut).toBe("/tmp/x.part");
    expect(mentett[0]!.meta.tipus).toBe("pdf");
    expect(mentett[0]!.meta.meret).toBe(99 * MB);
    expect(await feltoltFajlbol(k, ktx, { nev: "a.svg", cel: "dokumentum", meret: 100, fej: svg, ideiglenesUt: "/tmp/y" })).toEqual({ ok: false, hiba: "SVG_NEM_ENGEDETT" });
    expect(await feltoltFajlbol(k, ktx, { nev: "n.pdf", cel: "dokumentum", meret: 101 * MB, fej: pdf, ideiglenesUt: "/tmp/z" })).toEqual({ ok: false, hiba: "TUL_NAGY" });
    expect((await feltoltFajlbol(k, { ...ktx, szerep: "nezo" }, { nev: "n.pdf", cel: "dokumentum", meret: 10, fej: pdf, ideiglenesUt: "/tmp/n" })).ok).toBe(false);
    expect(mentett).toHaveLength(1);
  });
  it("ha a tárnak nincs fájl-útja, a nagy feltöltés nem megy (és nem esik vissza memóriára)", async () => {
    const { k } = kornyezet(false);
    expect(await feltoltFajlbol(k, ktx, { nev: "a.pdf", cel: "dokumentum", meret: 10, fej: pdf, ideiglenesUt: "/tmp/a" })).toEqual({ ok: false, hiba: "ERVENYTELEN_ADAT" });
  });
  it("fajlFolyam: a tár folyamát adja; ha nincs olvasFolyam, a bájtokból készül; néző olvashat, más szervezet fájlja nincs", async () => {
    const meta: FajlMeta = { id: "i", szervezet_id: "s", nev: "a.pdf", tipus: "pdf", cel: "dokumentum", meret: 9, feltoltve: "x", feltoltotte: "f" } as FajlMeta;
    const alap = kornyezet().k;
    const k1: Kornyezet = { ...alap, tar: { ...alap.tar, meta: async (sz) => (sz === "s" ? meta : null), olvas: async () => pdf } };
    const e1 = await fajlFolyam(k1, { ...ktx, szerep: "nezo" }, "i");
    expect(e1.ok).toBe(true);
    if (e1.ok) expect(new Uint8Array(await new Response(e1.ertek.folyam).arrayBuffer())).toEqual(pdf);
    expect(await fajlFolyam(k1, { ...ktx, szervezet_id: "masik" }, "i")).toEqual({ ok: false, hiba: "NINCS_ILYEN_FAJL" });
    let olvasva = false;
    const k2: Kornyezet = { ...k1, tar: { ...k1.tar, olvas: async () => { olvasva = true; return pdf; }, olvasFolyam: async () => new Response(pdf).body! } };
    const e2 = await fajlFolyam(k2, ktx, "i");
    expect(e2.ok).toBe(true);
    expect(olvasva).toBe(false);
  });
});
