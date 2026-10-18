// c30 F9 — a fotóalbum tiszta szabályai (album/szabaly.ts, album/zip.ts): a korlátok sorrendje, a D7 30 napja (a „Kitettem” és a
// használat ága is, amit az F10 tölt ki), a ZIP-név, a ZIP pontos mérete. Kiszolgáló és adatbázis nélkül.
import { crc32 as zlibCrc } from "node:zlib";
import { describe, expect, it } from "vitest";
import { ALBUM_KVOTA_BAJT, albumBefer, albumElemzes, albumLejart, zipNev } from "../album/szabaly";
import { crc32, zipFolyam, zipMeret } from "../album/zip";

const most = new Date("2026-07-01T10:00:00.000Z");
const nap = (n: number) => new Date(most.getTime() - n * 86_400_000).toISOString();
const ures = { bajt: 0, utobbi: 0, albumban: 0, ablakEleje: null };

describe("albumBefer — a korlátok", () => {
  it("üres munkatér: bejön", () => expect(albumBefer(ures, { meret: 1e6, kicsi: false }, most)).toEqual({ ok: true }));
  it("a kvóta a `kicsi`-re is áll (bájtban számít)", () => {
    const h = { ...ures, bajt: ALBUM_KVOTA_BAJT - 10 };
    expect(albumBefer(h, { meret: 11, kicsi: true }, most)).toMatchObject({ ok: false, hiba: "ALBUM_MEGTELT", http: 413 });
    expect(albumBefer(h, { meret: 10, kicsi: false }, most)).toEqual({ ok: true });
  });
  it("60 fotó / 10 perc: a 61. vár, a várakozás az ablak elejéből jön (1–10 perc); a `kicsi` nem számít", () => {
    const h = { ...ures, utobbi: 60, ablakEleje: new Date(most.getTime() - 7 * 60_000).toISOString() };
    expect(albumBefer(h, { meret: 1, kicsi: false }, most)).toEqual({ ok: false, hiba: "TUL_SOK_FELTOLTES", http: 429, ujraPerc: 3 });
    expect(albumBefer(h, { meret: 1, kicsi: true }, most)).toEqual({ ok: true });
  });
  it("40 fotó / album", () => {
    expect(albumBefer({ ...ures, albumban: 40 }, { meret: 1, kicsi: false }, most)).toMatchObject({ hiba: "ALBUM_TELE", http: 409 });
    expect(albumBefer({ ...ures, albumban: 39 }, { meret: 1, kicsi: false }, most)).toEqual({ ok: true });
  });
});

describe("albumLejart — D7, 30 nap", () => {
  it("használat nélkül: a feltöltés után 30 nappal", () => {
    expect(albumLejart({ feltoltve: nap(29) }, most)).toBe(false);
    expect(albumLejart({ feltoltve: nap(30) }, most)).toBe(true);
  });
  it("egy még ki nem tett poszt friss használata kitolja", () => {
    expect(albumLejart({ feltoltve: nap(40), hasznalva: nap(5) }, most)).toBe(false);
  });
  it("a „Kitettem” után 30 nappal (a feltöltés ideje ekkor nem számít)", () => {
    expect(albumLejart({ feltoltve: nap(90), kitettem: nap(29) }, most)).toBe(false);
    expect(albumLejart({ feltoltve: nap(31), kitettem: nap(31) }, most)).toBe(true);
  });
});

describe("az elemzés és a ZIP", () => {
  it("albumElemzes: csak a szerződés szerinti alak", () => {
    expect(albumElemzes({ album: "ziua-2", kicsi: false })).toEqual({ album: "ziua-2", kicsi: false });
    expect(albumElemzes({ album: "../x", kicsi: false })).toBeNull();
    expect(albumElemzes(null)).toBeNull();
  });
  it("zipNev: sorszám, a név ékezettel, tiltott jelek nélkül, a kiterjesztés a tartalomé", () => {
    expect(zipNev(1, "Wellhello és Smiley – Zilele Târgumureșene 2025.JPEG", "jpg")).toBe("01-Wellhello és Smiley – Zilele Târgumureșene 2025.jpg");
    expect(zipNev(12, "a/b\\c:d?.webp", "webp")).toBe("12-a_b_c_d_.webp");
    expect(zipNev(3, ".jpg", "jpg")).toBe("03-foto.jpg");
  });
  it("crc32 = a node:zlib-é; a ZIP mérete előre pontos; hiányzó fájlnál a folyam hibával áll meg", async () => {
    const b = new TextEncoder().encode("Piața Trandafirilor – ő ű ș ț");
    expect(crc32(b)).toBe(zlibCrc(b));
    const tetelek = [
      { nev: "01-ő.jpg", ido: most, meret: b.length, bajtok: async () => b },
      { nev: "02-ș.jpg", ido: most, meret: 3, bajtok: async () => new Uint8Array([1, 2, 3]) },
    ];
    const ki = new Uint8Array(await new Response(zipFolyam(tetelek)).arrayBuffer());
    expect(ki.length).toBe(zipMeret(tetelek));
    // a nevek UTF-8-ban: a 11. jelzőbit a helyi fejlécben (a kicsomagoló enélkül CP437-nek olvasná az „ő”-t)
    expect(new DataView(ki.buffer).getUint16(6, true) & 0x800).toBe(0x800);
    expect(new DataView(ki.buffer).getUint32(0, true)).toBe(0x04034b50);
    const hibas = zipFolyam([{ nev: "x.jpg", ido: most, meret: 5, bajtok: async () => null }]);
    await expect(new Response(hibas).arrayBuffer()).rejects.toThrow();
  });
});
