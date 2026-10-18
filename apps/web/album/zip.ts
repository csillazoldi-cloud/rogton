// c30 F9 (TERV §6 „Output and download”): a ZIP a „store” módszerrel (tömörítés nélkül — a JPEG úgyis tömör), új függőség nélkül.
// Tiszta: bemenet a fájlok sora (név, idő, a bájtokat adó függvény, a várt méret), kimenet egy folyam. Egyszerre EGY fájl van a
// memóriában (≤ 2,5 MB), így 20 fotó sem nyomja meg az alkalmazás 512 MB-ját. ZIP64 nincs (40 × 2,5 MB messze 4 GB alatt).
// A nevek UTF-8-ban (a 11. jelzőbit), így az ékezet (ő, ű, ș, ț, â) a Windows-os és a macOS-es kicsomagolóban is megmarad.

const CRC_TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLA[(c ^ b[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** DOS idő és dátum (a ZIP régi mezői; időzóna nélküli falióra — a hívó adja meg az órát, mi a budapesti idő szerint számolunk). */
function dosIdo(d: Date): { ido: number; datum: number } {
  const r = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Budapest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      .formatToParts(d).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const ev = Math.max(1980, Number(r.year));
  return {
    ido: ((Number(r.hour) % 24) << 11) | (Number(r.minute) << 5) | (Math.floor(Number(r.second) / 2)),
    datum: ((ev - 1980) << 9) | (Number(r.month) << 5) | Number(r.day),
  };
}

export type ZipTetel = { nev: string; ido: Date; meret: number; bajtok: () => Promise<Uint8Array | null> };

const LOKALIS = 30, KOZPONTI = 46, VEG = 22;
const UTF8_JELZO = 1 << 11;

/** A ZIP pontos mérete előre (a `content-length`-hez): fájlonként 30 + név + adat, a központi jegyzék 46 + név, a vége 22. */
export function zipMeret(tetelek: { nev: string; meret: number }[]): number {
  const enc = new TextEncoder();
  return tetelek.reduce((s, t) => s + LOKALIS + KOZPONTI + 2 * enc.encode(t.nev).length + t.meret, 0) + VEG;
}

/** A folyam. Ha egy fájl hiányzik, vagy a mérete nem a várt, a folyam HIBÁVAL áll meg (félkész ZIP nem megy ki „sikeresnek”). */
export function zipFolyam(tetelek: ZipTetel[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const kozponti: Uint8Array[] = [];
  let eltolas = 0;
  let i = 0;
  return new ReadableStream<Uint8Array>({
    async pull(c) {
      if (i < tetelek.length) {
        const t = tetelek[i++]!;
        const b = await t.bajtok();
        if (!b || b.length !== t.meret) {
          c.error(new Error(`a ZIP ${i}. fájlja hiányzik vagy megváltozott`));
          return;
        }
        const nev = enc.encode(t.nev);
        const crc = crc32(b);
        const { ido, datum } = dosIdo(t.ido);
        const fej = new Uint8Array(LOKALIS + nev.length);
        const v = new DataView(fej.buffer);
        v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, UTF8_JELZO, true); v.setUint16(8, 0, true);
        v.setUint16(10, ido, true); v.setUint16(12, datum, true); v.setUint32(14, crc, true);
        v.setUint32(18, b.length, true); v.setUint32(22, b.length, true); v.setUint16(26, nev.length, true); v.setUint16(28, 0, true);
        fej.set(nev, LOKALIS);
        const k = new Uint8Array(KOZPONTI + nev.length);
        const kv = new DataView(k.buffer);
        kv.setUint32(0, 0x02014b50, true); kv.setUint16(4, 20, true); kv.setUint16(6, 20, true); kv.setUint16(8, UTF8_JELZO, true);
        kv.setUint16(10, 0, true); kv.setUint16(12, ido, true); kv.setUint16(14, datum, true); kv.setUint32(16, crc, true);
        kv.setUint32(20, b.length, true); kv.setUint32(24, b.length, true); kv.setUint16(28, nev.length, true);
        kv.setUint32(42, eltolas, true);
        k.set(nev, KOZPONTI);
        kozponti.push(k);
        eltolas += fej.length + b.length;
        c.enqueue(fej);
        c.enqueue(b);
        return;
      }
      const jegyzekMeret = kozponti.reduce((s, k) => s + k.length, 0);
      for (const k of kozponti) c.enqueue(k);
      const veg = new Uint8Array(VEG);
      const vv = new DataView(veg.buffer);
      vv.setUint32(0, 0x06054b50, true); vv.setUint16(8, kozponti.length, true); vv.setUint16(10, kozponti.length, true);
      vv.setUint32(12, jegyzekMeret, true); vv.setUint32(16, eltolas, true);
      c.enqueue(veg);
      c.close();
    },
  });
}
