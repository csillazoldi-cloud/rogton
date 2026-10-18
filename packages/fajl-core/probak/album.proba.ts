// 0.4.0 (c30 F9, FESZTIVAL-ES-NYELVI-MOD-TERV §1.5, §6 „Server”, §10 F9): a fotóalbum célja. jpg/webp, ≤ 2,5 MB, a képméret a
// fejlécből (dekódolás nélkül), ≤ 2048 px (a `kicsi` párnál a hívó szigorít 512-re). PNG elutasítva, 4000 px-es JPEG elutasítva.
import { describe, expect, it } from "vitest";
import {
  ALBUM_KICSI_MAX_EL, ALBUM_MAX_EL, ALBUM_MAX_MERET_BAJT, CEL_TIPUSOK, FajlCel, celMaxMeret, feltolt, feltoltFajlbol, kepMeret,
} from "../src/index.js";
import { kornyezet, memTar, pngFej } from "./segedek.js";

const MB = 1024 * 1024;

/** Szintetikus JPEG: SOI, egy `exif` bájtos APP1 (az EXIF az 512 bájtos fejen túlra tolja a SOF-ot), SOF (alap vagy progresszív),
 *  SOS, kitöltés `meret`-ig, EOI. Dekódolni nem lehet, a fejléce valódi. */
function jpeg(szel: number, mag: number, o: { exif?: number; meret?: number; sof?: number; kitolto?: boolean } = {}): Uint8Array {
  const exif = o.exif ?? 4000;
  const reszek: number[] = [0xff, 0xd8];
  reszek.push(0xff, 0xe1, ((exif + 2) >> 8) & 0xff, (exif + 2) & 0xff, ...new Array(exif).fill(0x45));
  if (o.kitolto) reszek.push(0xff, 0xff); // kitöltő 0xFF-ek a jelölő előtt (a szabvány engedi)
  reszek.push(0xff, o.sof ?? 0xc0, 0x00, 0x11, 0x08, (mag >> 8) & 0xff, mag & 0xff, (szel >> 8) & 0xff, szel & 0xff, 0x03, ...new Array(9).fill(1));
  reszek.push(0xff, 0xda, 0x00, 0x0c, ...new Array(10).fill(0));
  const fej = Uint8Array.from(reszek);
  const osszes = Math.max(o.meret ?? 0, fej.length + 2);
  const b = new Uint8Array(osszes);
  b.set(fej, 0);
  for (let i = fej.length; i < osszes - 2; i++) b[i] = (i * 31) % 251 || 1;
  b[osszes - 2] = 0xff; b[osszes - 1] = 0xd9;
  return b;
}

function riff(darab: string, tartalom: number[]): Uint8Array {
  const b = new Uint8Array(12 + 8 + Math.max(tartalom.length, 20));
  b.set([0x52, 0x49, 0x46, 0x46], 0); b.set([0x57, 0x45, 0x42, 0x50], 8);
  b.set([...darab].map((c) => c.charCodeAt(0)), 12);
  b.set(tartalom, 20);
  return b;
}
const webpVp8 = (szel: number, mag: number) => riff("VP8 ", [0, 0, 0, 0x9d, 0x01, 0x2a, szel & 0xff, (szel >> 8) & 0x3f, mag & 0xff, (mag >> 8) & 0x3f]);
function webpVp8l(szel: number, mag: number): Uint8Array {
  const bitek = ((szel - 1) & 0x3fff) | (((mag - 1) & 0x3fff) << 14);
  return riff("VP8L", [0x2f, bitek & 0xff, (bitek >>> 8) & 0xff, (bitek >>> 16) & 0xff, (bitek >>> 24) & 0xff]);
}
const webpVp8x = (szel: number, mag: number) =>
  riff("VP8X", [0, 0, 0, 0, (szel - 1) & 0xff, ((szel - 1) >> 8) & 0xff, ((szel - 1) >> 16) & 0xff, (mag - 1) & 0xff, ((mag - 1) >> 8) & 0xff, ((mag - 1) >> 16) & 0xff]);

const szerk = { fiok_id: "f-1", szervezet_id: "sz-1", szerep: "szerkeszto" as const };

describe("kepMeret — a méret a fejlécből", () => {
  it("JPEG: alap és progresszív SOF, az EXIF után (az 512 bájtos fejen túl), kitöltő 0xFF-fel is", () => {
    expect(kepMeret(jpeg(2048, 1536))).toEqual({ szel: 2048, mag: 1536 });
    expect(kepMeret(jpeg(1536, 2048, { sof: 0xc2 }))).toEqual({ szel: 1536, mag: 2048 });
    expect(kepMeret(jpeg(800, 600, { exif: 20, kitolto: true }))).toEqual({ szel: 800, mag: 600 });
  });
  it("WebP: VP8, VP8L és VP8X", () => {
    expect(kepMeret(webpVp8(2048, 1365))).toEqual({ szel: 2048, mag: 1365 });
    expect(kepMeret(webpVp8l(512, 341))).toEqual({ szel: 512, mag: 341 });
    expect(kepMeret(webpVp8x(4000, 3000))).toEqual({ szel: 4000, mag: 3000 });
  });
  it("olvashatatlan: csonka JPEG (SOF előtt vége), SOF nélküli JPEG, PNG → null", () => {
    expect(kepMeret(jpeg(800, 600).subarray(0, 300))).toBeNull();
    expect(kepMeret(Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0, 4, 0, 0, 0xff, 0xd9]))).toBeNull();
    expect(kepMeret(pngFej())).toBeNull();
  });
});

describe("az album cél (0.4.0)", () => {
  it("a szótár: album cél, csak jpg és webp, 2,5 MB, 2048 / 512 px", () => {
    expect(FajlCel.options).toContain("album");
    expect([...CEL_TIPUSOK.album]).toEqual(["jpg", "webp"]);
    expect(ALBUM_MAX_MERET_BAJT).toBe(Math.round(2.5 * MB));
    expect(celMaxMeret("album")).toBe(ALBUM_MAX_MERET_BAJT);
    expect([ALBUM_MAX_EL, ALBUM_KICSI_MAX_EL]).toEqual([2048, 512]);
  });

  it("egy 2048 px-es JPEG (1,2 MB) bejön, az elemzés (pár, készült) megmarad", async () => {
    const k = kornyezet(memTar());
    const elemzes = { kicsi: false, keszult: "2025-06-27T19:41:00.000Z", album: "zilele-2025-ziua-2" };
    const e = await feltolt(k, szerk, { nev: "Wellhello és Smiley – Zilele Târgumureșene 2025, ziua 2.jpg", cel: "album", bajtok: jpeg(2048, 1365, { meret: 1.2 * MB }), elemzes });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.ertek.tipus).toBe("jpg");
    expect(e.ertek.elemzes).toEqual(elemzes);
    expect(e.ertek.nev).toBe("Wellhello és Smiley – Zilele Târgumureșene 2025, ziua 2.jpg");
  });

  it("a webp is bejön", async () => {
    const e = await feltolt(kornyezet(memTar()), szerk, { nev: "színpad.webp", cel: "album", bajtok: webpVp8(1600, 1200) });
    expect(e.ok && e.ertek.tipus).toBe("webp");
  });

  it("2,6 MB → TUL_NAGY", async () => {
    const e = await feltolt(kornyezet(memTar()), szerk, { nev: "nagy.jpg", cel: "album", bajtok: jpeg(2048, 1365, { meret: Math.round(2.6 * MB) }) });
    expect(e).toEqual({ ok: false, hiba: "TUL_NAGY" });
  });

  it("PNG → TIPUS_NEM_ENGEDETT (az albumba csak jpg/webp)", async () => {
    const b = new Uint8Array(4096); b.set(pngFej(), 0);
    const e = await feltolt(kornyezet(memTar()), szerk, { nev: "kép.png", cel: "album", bajtok: b });
    expect(e).toEqual({ ok: false, hiba: "TIPUS_NEM_ENGEDETT" });
  });

  it("egy 4000 px-es JPEG (a telefon nem kicsinyítette) → TUL_NAGY; a 2049 px is", async () => {
    expect(await feltolt(kornyezet(memTar()), szerk, { nev: "eredeti.jpg", cel: "album", bajtok: jpeg(4000, 3000) })).toEqual({ ok: false, hiba: "TUL_NAGY" });
    expect(await feltolt(kornyezet(memTar()), szerk, { nev: "egy.jpg", cel: "album", bajtok: jpeg(1000, 2049) })).toEqual({ ok: false, hiba: "TUL_NAGY" });
    expect(await feltolt(kornyezet(memTar()), szerk, { nev: "vp8x.webp", cel: "album", bajtok: webpVp8x(4000, 3000) })).toEqual({ ok: false, hiba: "TUL_NAGY" });
  });

  it("a `kicsi` pár: a hívó 512-re szigorít; nagyobbat nem lehet kérni (a 2048 a felső határ)", async () => {
    expect((await feltolt(kornyezet(memTar()), szerk, { nev: "k.jpg", cel: "album", bajtok: jpeg(512, 341), kepMaxEl: ALBUM_KICSI_MAX_EL })).ok).toBe(true);
    expect(await feltolt(kornyezet(memTar()), szerk, { nev: "k.jpg", cel: "album", bajtok: jpeg(600, 400), kepMaxEl: ALBUM_KICSI_MAX_EL })).toEqual({ ok: false, hiba: "TUL_NAGY" });
    expect(await feltolt(kornyezet(memTar()), szerk, { nev: "x.jpg", cel: "album", bajtok: jpeg(3000, 2000), kepMaxEl: 9999 })).toEqual({ ok: false, hiba: "TUL_NAGY" });
  });

  it("olvashatatlan méretű JPEG → TIPUS_NEM_ENGEDETT", async () => {
    const csonka = jpeg(800, 600).subarray(0, 600);
    expect(await feltolt(kornyezet(memTar()), szerk, { nev: "csonka.jpg", cel: "album", bajtok: csonka })).toEqual({ ok: false, hiba: "TIPUS_NEM_ENGEDETT" });
  });

  it("néző nem tölthet fel (NINCS_JOG)", async () => {
    const e = await feltolt(kornyezet(memTar()), { ...szerk, szerep: "nezo" }, { nev: "a.jpg", cel: "album", bajtok: jpeg(800, 600) });
    expect(e).toEqual({ ok: false, hiba: "NINCS_JOG" });
  });

  it("a lemezes út (feltoltFajlbol) albumot nem fogad: ERVENYTELEN_ADAT", async () => {
    const k = kornyezet({ ...memTar(), mentFajlbol: async () => { throw new Error("nem hívható"); } });
    const b = jpeg(800, 600);
    const e = await feltoltFajlbol(k, szerk, { nev: "a.jpg", cel: "album", meret: b.length, fej: b.subarray(0, 512), ideiglenesUt: "/tmp/x" });
    expect(e).toEqual({ ok: false, hiba: "ERVENYTELEN_ADAT" });
  });

  it("a többi cél változatlan: egy 4000 px-es JPEG posztképnek továbbra is jó", async () => {
    const e = await feltolt(kornyezet(memTar()), szerk, { nev: "poszt.jpg", cel: "kep", bajtok: jpeg(4000, 3000) });
    expect(e.ok).toBe(true);
  });
});
