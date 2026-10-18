import { inflateRawSync } from "node:zlib";

// c30 F5 (terv §8 7. pont, D8 — Csilla: a Word-programot is olvassuk): a .docx SZÖVEGE, és semmi más. Egy .docx egy ZIP-csomag;
// ebből kizárólag a `word/document.xml`-t nyitjuk ki, a bekezdések szövegével (w:t), tabbal és sortöréssel. Nincs XML-elemző, nincs
// entitás-kifejtés (DOCTYPE / ENTITY → elutasítás), nincs kép, makró, beágyazott objektum, külső hivatkozás. Szigorú korlátok:
//   · a fájl ≤ 5 MB, a ZIP-ben ≤ 200 bejegyzés, ZIP64 és titkosított bejegyzés nincs;
//   · a document.xml kibontva ≤ 4 MB — a kibontás maga is ennyinél áll meg (maxOutputLength), így a hamis méretet bevalló
//     „zip-bomba” sem fúj fel több memóriát;
//   · a szöveg ≤ 200 000 karakter.
// A típusellenőrzés a tartalomból megy (PK\x03\x04 + [Content_Types].xml + word/document.xml), nem a fájlnévből.

export const DOCX_KORLAT = { maxBajt: 5_000_000, maxBejegyzes: 200, maxXmlBajt: 4_000_000, maxSzoveg: 200_000 } as const;
export type DocxKorlat = { maxBajt: number; maxBejegyzes: number; maxXmlBajt: number; maxSzoveg: number };
export type DocxHiba = "NEM_DOCX" | "TUL_NAGY" | "SERULT" | "TOMORITESI_BOMBA" | "TILTOTT_XML";
export type DocxEredmeny = { ok: true; szoveg: string } | { ok: false; hiba: DocxHiba };

const u16 = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8);
const u32 = (b: Uint8Array, i: number) => (b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16) | (b[i + 3]! << 24)) >>> 0;

/** A tartalom eleje ZIP-e (PK\x03\x04) — a .docx, .xlsx, .pptx közös fejléce; a docx-ot a bejegyzések döntik el. */
export function zipFej(b: Uint8Array): boolean {
  return b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
}

type Bejegyzes = { nev: string; modszer: number; tomoritett: number; kibontott: number; helyiFej: number; jelzok: number };

function kozpontiKonyvtar(b: Uint8Array, k: DocxKorlat): Bejegyzes[] | DocxHiba {
  // a központi könyvtár vége (EOCD): az utolsó 22 + 65 535 bájtban, hátulról keresve
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65_535); i--) {
    if (u32(b, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return "SERULT";
  const db = u16(b, eocd + 10);
  const meret = u32(b, eocd + 12);
  const kezd = u32(b, eocd + 16);
  if (db === 0xffff || meret === 0xffffffff || kezd === 0xffffffff) return "SERULT"; // ZIP64: egy programfájlnak nem kell
  if (db > k.maxBejegyzes) return "TUL_NAGY";
  if (kezd + meret > eocd) return "SERULT";
  const ki: Bejegyzes[] = [];
  let p = kezd;
  for (let n = 0; n < db; n++) {
    if (p + 46 > b.length || u32(b, p) !== 0x02014b50) return "SERULT";
    const nevHossz = u16(b, p + 28), extraHossz = u16(b, p + 30), megjHossz = u16(b, p + 32);
    if (p + 46 + nevHossz > b.length) return "SERULT";
    const nev = new TextDecoder("utf-8").decode(b.subarray(p + 46, p + 46 + nevHossz));
    ki.push({ nev, jelzok: u16(b, p + 8), modszer: u16(b, p + 10), tomoritett: u32(b, p + 20), kibontott: u32(b, p + 24), helyiFej: u32(b, p + 42) });
    p += 46 + nevHossz + extraHossz + megjHossz;
  }
  return ki;
}

function kibont(b: Uint8Array, e: Bejegyzes, k: DocxKorlat): Uint8Array | DocxHiba {
  if (e.jelzok & 0x1) return "SERULT"; // titkosított
  if (e.kibontott > k.maxXmlBajt) return "TOMORITESI_BOMBA";
  const h = e.helyiFej;
  if (h + 30 > b.length || u32(b, h) !== 0x04034b50) return "SERULT";
  const adat = h + 30 + u16(b, h + 26) + u16(b, h + 28);
  if (adat + e.tomoritett > b.length) return "SERULT";
  const nyers = b.subarray(adat, adat + e.tomoritett);
  if (e.modszer === 0) return nyers.length > k.maxXmlBajt ? "TOMORITESI_BOMBA" : nyers;
  if (e.modszer !== 8) return "SERULT";
  try {
    // a kibontás a korlátnál megáll: a bevallott méret hazudhat, a memória nem nő tovább
    return new Uint8Array(inflateRawSync(nyers, { maxOutputLength: k.maxXmlBajt }));
  } catch (h) {
    return h instanceof RangeError || (h as { code?: string })?.code === "ERR_BUFFER_TOO_LARGE" ? "TOMORITESI_BOMBA" : "SERULT";
  }
}

/** Csak az öt beépített XML-entitás és a számjeles karakterhivatkozás — más entitást nem fejtünk ki. */
function entitasok(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos|#\d{1,7}|#x[0-9a-fA-F]{1,6});/g, (m, e: string) => {
    if (e === "amp") return "&";
    if (e === "lt") return "<";
    if (e === "gt") return ">";
    if (e === "quot") return '"';
    if (e === "apos") return "'";
    const kod = e.startsWith("#x") ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return kod > 0 && kod <= 0x10ffff ? String.fromCodePoint(kod) : m;
  });
}

/** A document.xml bekezdéseinek szövege: bekezdésenként egy sor; w:tab → tab, w:br / w:cr → sortörés. A törölt szöveg (w:delText)
 *  és a mezőkódok (w:instrText) kimaradnak; a bekezdés-beállítások (w:pPr, benne a tabulátor-pozíciók) sem számítanak szövegnek. */
export function documentXmlSzoveg(xml: string): string {
  const sorok: string[] = [];
  for (const m of xml.matchAll(/<w:p\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:p>)/g)) {
    const belso = (m[1] ?? "").replace(/<w:pPr\b[\s\S]*?<\/w:pPr>/g, "").replace(/<w:rPr\b[\s\S]*?<\/w:rPr>/g, "");
    let sor = "";
    for (const t of belso.matchAll(/<w:t\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:t>)|<w:tab\b[^>]*\/>|<w:(?:br|cr)\b[^>]*\/>/g)) {
      if (t[0].startsWith("<w:tab")) sor += "\t";
      else if (t[0].startsWith("<w:br") || t[0].startsWith("<w:cr")) sor += "\n";
      else sor += entitasok(t[1] ?? "");
    }
    sorok.push(sor);
  }
  return sorok.join("\n");
}

/** A .docx szövege a korlátokkal. Hiba: NEM_DOCX (nem ZIP / nincs benne Word-dokumentum), TUL_NAGY, SERULT, TOMORITESI_BOMBA, TILTOTT_XML. */
export function docxSzoveg(b: Uint8Array, k: DocxKorlat = DOCX_KORLAT): DocxEredmeny {
  if (b.length > k.maxBajt) return { ok: false, hiba: "TUL_NAGY" };
  if (b.length < 30 || !zipFej(b)) return { ok: false, hiba: "NEM_DOCX" };
  const kk = kozpontiKonyvtar(b, k);
  if (typeof kk === "string") return { ok: false, hiba: kk };
  const doc = kk.find((e) => e.nev === "word/document.xml");
  if (!doc || !kk.some((e) => e.nev === "[Content_Types].xml")) return { ok: false, hiba: "NEM_DOCX" };
  const x = kibont(b, doc, k);
  if (typeof x === "string") return { ok: false, hiba: x };
  let xml: string;
  try {
    xml = new TextDecoder("utf-8", { fatal: true }).decode(x);
  } catch {
    return { ok: false, hiba: "SERULT" };
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) return { ok: false, hiba: "TILTOTT_XML" };
  return { ok: true, szoveg: documentXmlSzoveg(xml).slice(0, k.maxSzoveg) };
}
