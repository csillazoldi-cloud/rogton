// c30 F10 — a fotóalbum tiszta részei (album/exif.ts, album/szabaly.ts): a készítés ideje az EXIF-ből (a telefon az újrakódolás ELŐTT
// olvassa — utána az EXIF és a GPS eltűnik), a kicsinyítés mérete, a tartalék válogatás (a készítés ideje szerint, egyenletesen), a gép
// válaszának értelmezése, a sorrend-lap Előrébb / Hátrébb. Kiszolgáló és adatbázis nélkül.
import { describe, expect, it } from "vitest";
import { exifIso, exifKeszult, kicsinyitMeret } from "../album/exif";
import { athelyez, egyenletesen, idoSzerint, valogatasErtelmez, valogatasSorok } from "../album/szabaly";

/** Egy JPEG-fej EXIF-fel: IFD0 (+ ExifIFD mutató, + GPS mutató), ExifIFD (DateTimeOriginal, OffsetTimeOriginal) — kis- vagy nagy-endián. */
function exifJpeg(o: { ido?: string; eltolas?: string; le?: boolean; csakDateTime?: string } = {}): Uint8Array {
  const le = o.le ?? true;
  const t: number[] = [];
  const u16 = (v: number) => (le ? [v & 0xff, v >> 8] : [v >> 8, v & 0xff]);
  const u32 = (v: number) => (le ? [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, v >>> 24] : [v >>> 24, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]);
  const asc = (s: string) => [...s].map((c) => c.charCodeAt(0)).concat([0]);
  // elrendezés (a TIFF elejétől): 8 fej · IFD0 @8 (3 bejegyzés) · ExifIFD @50 (2 bejegyzés) · adatok @80
  const ifd0 = 8, exif = 50, adat = 80;
  const ido = asc(o.ido ?? "2025:06:27 21:14:05");
  const elt = asc(o.eltolas ?? "+03:00");
  const dt = asc(o.csakDateTime ?? "2025:06:27 20:00:00");
  t.push(...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(ifd0));
  while (t.length < ifd0) t.push(0);
  const ifd0Bejegyzes: number[][] = [
    o.csakDateTime ? [...u16(0x0132), ...u16(2), ...u32(dt.length), ...u32(adat + 40)] : [...u16(0x8769), ...u16(4), ...u32(1), ...u32(exif)],
    [...u16(0x8825), ...u16(4), ...u32(1), ...u32(0)], // GPS — nem olvassuk
  ];
  t.push(...u16(ifd0Bejegyzes.length), ...ifd0Bejegyzes.flat(), ...u32(0));
  while (t.length < exif) t.push(0);
  t.push(...u16(o.eltolas === "" ? 1 : 2), ...u16(0x9003), ...u16(2), ...u32(ido.length), ...u32(adat));
  if (o.eltolas !== "") t.push(...u16(0x9011), ...u16(2), ...u32(elt.length), ...u32(adat + 24));
  t.push(...u32(0));
  while (t.length < adat) t.push(0);
  t.push(...ido); while (t.length < adat + 24) t.push(0);
  t.push(...elt); while (t.length < adat + 40) t.push(0);
  t.push(...dt);
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...t];
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, ...new Array(14).fill(0), 0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 0xff, ...app1, 0xff, 0xda, 0, 2]);
}

describe("exifKeszult — a készítés ideje az EXIF-ből", () => {
  it("DateTimeOriginal + OffsetTimeOriginal (kis- és nagy-endián): pontos idő", () => {
    for (const le of [true, false]) {
      const e = exifKeszult(exifJpeg({ le }));
      expect(e).toEqual({ datum: "2025-06-27T21:14:05", eltolas: "+03:00" });
      expect(exifIso(e!)).toBe("2025-06-27T18:14:05.000Z");
    }
  });
  it("eltolás nélkül a telefon helyi ideje; csak DateTime (IFD0) is jó; nincs EXIF → null", () => {
    expect(exifKeszult(exifJpeg({ eltolas: "" }))).toEqual({ datum: "2025-06-27T21:14:05", eltolas: null });
    expect(exifKeszult(exifJpeg({ csakDateTime: "2025:06:28 10:00:00" }))?.datum).toBe("2025-06-28T10:00:00");
    expect(exifKeszult(Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0, 2]))).toBeNull();
    expect(exifKeszult(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
    expect(exifKeszult(exifJpeg({ ido: "0000:00:00 00:00:00" }))).toBeNull();
  });
});

describe("kicsinyitMeret", () => {
  it("a hosszabbik oldal a határ, az arány marad, nagyítás nincs", () => {
    expect(kicsinyitMeret(4032, 3024, 2048)).toEqual({ szel: 2048, mag: 1536 });
    expect(kicsinyitMeret(3024, 4032, 512)).toEqual({ szel: 384, mag: 512 });
    expect(kicsinyitMeret(2048, 1365, 512)).toEqual({ szel: 512, mag: 341 });
    expect(kicsinyitMeret(800, 600, 2048)).toEqual({ szel: 800, mag: 600 });
  });
});

describe("a válogatás tartaléka és a gép válasza", () => {
  const f = (n: number, keszult: string | null, feltoltve = "2026-06-27T20:00:00Z") => ({ id: `f${n}`, nev: `${n}.jpg`, keszult, feltoltve });
  it("idoSzerint: a készítés ideje, ahol nincs: a feltöltésé", () => {
    const sor = idoSzerint([f(1, "2026-06-27T21:00:00Z"), f(2, null, "2026-06-27T19:00:00Z"), f(3, "2026-06-27T20:30:00Z")]);
    expect(sor.map((x) => x.id)).toEqual(["f2", "f3", "f1"]);
  });
  it("egyenletesen: ≤ 10 → mind; 30-ból 10, az első és az utolsó benne, ismétlés nélkül", () => {
    const harminc = Array.from({ length: 30 }, (_, i) => i);
    const v = egyenletesen(harminc, 10);
    expect(v).toHaveLength(10);
    expect(v[0]).toBe(0); expect(v[9]).toBe(29);
    expect(new Set(v).size).toBe(10);
    expect(egyenletesen([1, 2, 3], 10)).toEqual([1, 2, 3]);
  });
  it("valogatasErtelmez: JSON (szövegben is), 1-től számozva, rossz szám és ismétlés nélkül, ≤ 20; használhatatlan → null", () => {
    expect(valogatasErtelmez('Íme: {"valasztott":[{"i":3,"leiras":"tömeg a  színpad előtt"},{"i":1},{"i":3},{"i":11},{"i":"2"}]}', 10))
      .toEqual([{ i: 3, leiras: "tömeg a színpad előtt" }, { i: 1, leiras: "" }, { i: 2, leiras: "" }]);
    expect(valogatasErtelmez({ valasztott: Array.from({ length: 30 }, (_, k) => ({ i: k + 1 })) }, 40)).toHaveLength(20);
    expect(valogatasErtelmez('{"valasztott":[]}', 10)).toBeNull();
    expect(valogatasErtelmez("nem JSON", 10)).toBeNull();
    expect(valogatasErtelmez(null, 10)).toBeNull();
  });
  // G4 (Rögtön, 2026-10-18): az időzóna Europe/Budapest (nyáron UTC+2, a régi Bukarest UTC+3 helyett): 18:14Z = 20:14 helyi
  it("valogatasSorok: sorszám és Budapest szerinti idő", () => {
    expect(valogatasSorok([{ keszult: "2026-06-27T18:14:00Z" }, { keszult: null }])).toEqual(["1. fotó · 06. 27. 20:14", "2. fotó"]);
  });
  it("athelyez (D8c): Előrébb / Hátrébb egy hellyel; a szélén nincs mozgás", () => {
    expect(athelyez(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(athelyez(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(athelyez(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(athelyez(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  });
});
