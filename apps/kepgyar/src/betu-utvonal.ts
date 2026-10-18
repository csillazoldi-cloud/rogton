// R-16 K6 (TERV §2-K6, gepezet 13): a vizual-core `BetuUtvonal` portja a képgyártóban — a szöveg körvonala SVG-útvonalként, a fontkittel
// (2.0.4, MIT; az opentype.js a WOFF2-t nem olvassa — TERV §5). A névlogó így betűfájl nélkül is ugyanúgy néz ki.
//
// A betűfájlok (mérve, TERV §2-K6 „subset gotcha”): a beépített öt család latin és latin-ext részre bontva — az Ő Ș ț ă Ț CSAK a latin-ext
// fájlban van, az alap betűk csak a latinban. Ezért KARAKTERENKÉNT választunk: az első fájl, amelyben a karakter megvan (a glif nem a
// .notdef, azaz az azonosítója nem 0). Sorrend: a cím-betű latin → latin-ext, saját betűnél a saját fájl; utána a Public Sans latin →
// latin-ext (ugyanaz a tartalék, mint a képeken — K5). Az egymás melletti, azonos fájlú karakterek egy menetben íródnak (alávágással).
// Súly: 700 (a rajz 12g névlogója félkövér; mind az öt családnak van 700-as fájlja). Saját betű: a feltöltött fájl, ahogy van.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { create, type Font, type Path } from "fontkit";
import { BETUK, betuKulcs, type BetuUtvonal } from "@km/vizual-core";

const SULY = 700;

/** Egy betűfájl a láncban: a fontkit-betű és egy név (a füstpróba ebből írja ki, melyik fájlból jött a karakter). */
type Lancszem = { nev: string; betu: Font };

const fajlTar = new Map<string, Font>();
function fajlBetu(ut: string): Font {
  let f = fajlTar.get(ut);
  if (!f) {
    const n = create(readFileSync(ut));
    if ("fonts" in n) throw new Error(`gyűjtemény, nem betű: ${ut}`);
    fajlTar.set(ut, (f = n));
  }
  return f;
}

/** A saját betűk (adat-URL) — kis tár a bájtok ujjlenyomatával; a legrégebbi esik ki. */
const sajatTar = new Map<string, Font | null>();
function sajatBetu(adat: string): Font | null {
  const kulcs = createHash("sha1").update(adat).digest("hex");
  if (sajatTar.has(kulcs)) return sajatTar.get(kulcs) ?? null;
  let f: Font | null = null;
  try {
    const n = create(Buffer.from(adat.slice(adat.indexOf(",") + 1), "base64"));
    f = "fonts" in n ? (n.fonts[0] ?? null) : n;
  } catch {
    f = null; // olvashatatlan: a Public Sans ír (a feltöltéskor a web már megvizsgálta — ez csak védőháló)
  }
  sajatTar.set(kulcs, f);
  if (sajatTar.size > 8) sajatTar.delete(sajatTar.keys().next().value!);
  return f;
}

const van = (f: Font, kp: number) => {
  try {
    return f.glyphForCodePoint(kp).id !== 0;
  } catch {
    return false;
  }
};

/** A karakterenkénti betű-lánc a munkatér cím-betűjéhez. `betu`: beépített kulcs, régi CSS-szöveg vagy "sajat:<id>". */
export function betuLanc(mappa: string, betu: string, sajat?: { adat: string } | null): Lancszem[] {
  const beepitett = (kulcs: string): Lancszem[] =>
    (["latin", "latin-ext"] as const).map((r) => ({ nev: `${kulcs}-${r}-${SULY}`, betu: fajlBetu(join(mappa, `${kulcs}-${r}-${SULY}-normal.woff2`)) }));
  const tartalek = beepitett("public-sans");
  if (betu.startsWith("sajat:")) {
    const s = sajat ? sajatBetu(sajat.adat) : null;
    return s ? [{ nev: "sajat", betu: s }, ...tartalek] : tartalek;
  }
  const kulcs = betu in BETUK ? betu : betuKulcs(betu);
  return kulcs === "public-sans" ? tartalek : [...beepitett(kulcs), ...tartalek];
}

/** Karakterenként: melyik fájlból, melyik glif (a füstpróba méri: minden ékezet valódi glif, nem .notdef). */
export function karakterek(lanc: readonly Lancszem[], szoveg: string): { kar: string; fajl: string; glif: number }[] {
  return [...szoveg].map((kar) => {
    const kp = kar.codePointAt(0)!;
    const l = lanc.find((x) => van(x.betu, kp));
    return { kar, fajl: l?.nev ?? "-", glif: l ? l.betu.glyphForCodePoint(kp).id : 0 };
  });
}

/** A port: a szöveg útvonala a lánc szerint (host.ts `BetuUtvonal` szerződése: képpont, y lefelé, alapvonal y = 0, festék bal széle x = 0). */
export function betuUtvonal(lanc: readonly Lancszem[]): BetuUtvonal {
  return {
    utvonal(szoveg, meret, betukoz = 0) {
      // 1. menetek: az egymás melletti, azonos fájlú karakterek együtt (a hiányzó karakter az utolsó fájl .notdef-jével — a füstpróba ezt tiltja)
      const menetek: { l: Lancszem; s: string }[] = [];
      for (const kar of szoveg) {
        const kp = kar.codePointAt(0)!;
        const l = lanc.find((x) => van(x.betu, kp)) ?? lanc[lanc.length - 1]!;
        const utolso = menetek[menetek.length - 1];
        if (utolso && utolso.l === l) utolso.s += kar;
        else menetek.push({ l, s: kar });
      }
      // 2. a glifek helye képpontban; a betűköz minden glif után (a festék-szélességbe az utolsó utáni nem számít)
      const utak: Path[] = [];
      let x = 0;
      for (const { l, s } of menetek) {
        const sk = meret / l.betu.unitsPerEm;
        const run = l.betu.layout(s);
        run.glyphs.forEach((g, i) => {
          const p = run.positions[i]!;
          if (g.path.commands.length > 0) utak.push(g.path.transform(sk, 0, 0, -sk, x + p.xOffset * sk, -p.yOffset * sk));
          x += p.xAdvance * sk + betukoz * meret;
        });
      }
      if (utak.length === 0) return { d: "", szelesseg: 0, felso: 0, also: 0 };
      // 3. a festék befoglalója, és a bal szél az x = 0-ra
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const u of utak) {
        const b = u.bbox;
        x0 = Math.min(x0, b.minX); y0 = Math.min(y0, b.minY); x1 = Math.max(x1, b.maxX); y1 = Math.max(y1, b.maxY);
      }
      const d = utak.map((u) => u.translate(-x0, 0).toSVG()).join("");
      return { d, szelesseg: x1 - x0, felso: Math.max(0, -y0), also: Math.max(0, y1) };
    },
  };
}
