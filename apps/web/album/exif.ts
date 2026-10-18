// c30 F10 (terv §6 „Phone upload UX”): a telefonon, a feltöltés ELŐTT — tiszta, a böngészőben és a próbában is fut.
//  · `exifKeszult`: a fotó készítésének ideje a JPEG EXIF-jéből (DateTimeOriginal + ha van, OffsetTimeOriginal; tartalék: DateTime).
//    Az újrakódolás (vászon → JPEG) az EXIF-et — a GPS-t is — eldobja, ezért az időt előtte olvassuk ki. Ha nincs: null (a hívó a
//    fájl idejét veszi).
//  · `kicsinyitMeret`: a hosszabbik oldal legfeljebb `max` képpont, az arány marad, nagyítás nincs.

export type ExifIdo = { datum: string; eltolas: string | null };

function ascii(v: DataView, i: number, n: number): string {
  let s = "";
  for (let k = 0; k < n && i + k < v.byteLength; k++) {
    const c = v.getUint8(i + k);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

/** A JPEG első ~128 kB-ja elég (az APP1 a fájl elején áll). */
export function exifKeszult(bajtok: ArrayBuffer | Uint8Array): ExifIdo | null {
  const u = bajtok instanceof Uint8Array ? bajtok : new Uint8Array(bajtok);
  const v = new DataView(u.buffer, u.byteOffset, u.byteLength);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null;
  let i = 2;
  while (i + 4 <= v.byteLength) {
    if (v.getUint8(i) !== 0xff) return null;
    const m = v.getUint8(i + 1);
    if (m === 0xda || m === 0xd9) return null;
    const hossz = v.getUint16(i + 2);
    if (m === 0xe1 && ascii(v, i + 4, 4) === "Exif") return tiffIdo(v, i + 10, Math.min(v.byteLength, i + 2 + hossz));
    i += 2 + hossz;
  }
  return null;
}

function tiffIdo(v: DataView, t: number, vege: number): ExifIdo | null {
  if (t + 8 > vege) return null;
  const rend = ascii(v, t, 2);
  if (rend !== "II" && rend !== "MM") return null;
  const le = rend === "II";
  const u16 = (o: number) => (o + 2 <= vege ? v.getUint16(o, le) : 0);
  const u32 = (o: number) => (o + 4 <= vege ? v.getUint32(o, le) : 0);
  const cimkek = (ifd: number): Map<number, number> => {
    const m = new Map<number, number>();
    const db = u16(t + ifd);
    for (let k = 0; k < db && k < 512; k++) {
      const e = t + ifd + 2 + k * 12;
      if (e + 12 > vege) break;
      m.set(u16(e), e);
    }
    return m;
  };
  const szoveg = (e: number | undefined): string => {
    if (e === undefined) return "";
    const n = u32(e + 4);
    const hol = n <= 4 ? e + 8 : t + u32(e + 8);
    return hol + n <= vege ? ascii(v, hol, n) : "";
  };
  const ifd0 = cimkek(u32(t + 4));
  const exifMut = ifd0.get(0x8769);
  const exif = exifMut !== undefined ? cimkek(u32(exifMut + 8)) : new Map<number, number>();
  const nyers = szoveg(exif.get(0x9003)) || szoveg(ifd0.get(0x0132));
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(nyers);
  if (!m || m[1] === "0000") return null;
  const elt = szoveg(exif.get(0x9011));
  return { datum: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`, eltolas: /^[+-]\d{2}:\d{2}$/.test(elt) ? elt : null };
}

/** Az EXIF-idő ISO-ban: az eltolással, ha a telefon megadta; különben a böngésző (a telefon) helyi idejeként. */
export function exifIso(e: ExifIdo): string {
  if (e.eltolas) return new Date(`${e.datum}${e.eltolas}`).toISOString();
  const [d, ido] = e.datum.split("T") as [string, string];
  const [y, mo, n] = d.split("-").map(Number) as [number, number, number];
  const [h, mi, s] = ido.split(":").map(Number) as [number, number, number];
  return new Date(y, mo - 1, n, h, mi, s).toISOString();
}

export function kicsinyitMeret(szel: number, mag: number, max: number): { szel: number; mag: number } {
  const hosszabb = Math.max(szel, mag);
  if (hosszabb <= max) return { szel, mag };
  const a = max / hosszabb;
  return { szel: Math.max(1, Math.round(szel * a)), mag: Math.max(1, Math.round(mag * a)) };
}
