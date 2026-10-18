// R-16 K2 (gepezet 5, TERV §2-K2): olvasható szöveg minden színen. A hat bevált szett (TERV §2-K4) és 300 rögzített
// magú véletlen színhármas, minden helyzet, minden változat, amit a `valtozatok` visszaad: minden szöveg eléri a küszöbét
// (kis szöveg 4,5 · nagy szöveg és vékony vonal 3). A palettán mérünk, nem a DOM-on — a kontrasztot a próba maga
// számolja (nem a kód `vizsgal`-ját hívja), így nem önmagát igazolja.
// Tudott korlát: az átlátszósággal (opacity) halványított sorokat (második nyelv, név-logó 0,85) a paletta nem látja.
import { describe, it, expect } from "vitest";
import { HELYZETEK, HelyzetArculat, HelyzetTartalom, MINTA, helyzetHtml, olvashato, paletta, valtozatok, type Helyzet } from "../src/index.ts";

// ——— független WCAG-számolás ———
const lin = (c: number) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : Math.pow((c / 255 + 0.055) / 1.055, 2.4));
const L = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const cr = (a: string, b: string) => (Math.max(L(a), L(b)) + 0.05) / (Math.min(L(a), L(b)) + 0.05);
const crMin = (a: string, v: string[]) => Math.min(...v.map((b) => cr(a, b)));
const arnyalat = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255) as [number, number, number];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 1e-9) return null;
  const hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return ((hue * 60) + 360) % 360;
};

const SZETTEK: Record<string, [string, string, string]> = {
  termeszetes: ["#2f5d50", "#c9a86a", "#f1ede4"],
  meleg: ["#a4471f", "#e3a857", "#fbf3e8"],
  friss: ["#17745e", "#f2c94c", "#f4fbf8"],
  megbizhato: ["#1f3a5f", "#7fb2e5", "#f3f6fa"],
  elegans: ["#2b2b2e", "#b89b5e", "#f6f4ef"],
  jatekos: ["#c2410c", "#3aa6b9", "#fff8ec"],
};
// mulberry32 — rögzített mag, minden futás ugyanazt a 300 hármast adja
function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = mulberry32(20260930);
const hex = () => "#" + Math.floor(r() * 0x1000000).toString(16).padStart(6, "0");
const HARMASOK: [string, [string, string, string]][] = [
  ...Object.entries(SZETTEK),
  ...Array.from({ length: 300 }, (_, i) => [`veletlen-${i}`, [hex(), hex(), hex()]] as [string, [string, string, string]]),
];

/** A kép szövegei és vonalai: [név, szín, háttér(ek), küszöb] — ugyanaz a hozzárendelés, amit a helyzetHtml használ. */
function elemek(h: Helyzet, p: ReturnType<typeof paletta>): [string, string, string[], number][] {
  const e: [string, string, string[], number][] = [];
  if (h !== "uj" && h !== "hir") e.push(["szöveg", p.szoveg, p.veg, 4.5]);
  if (h === "hir") e.push(["panel-szöveg", p.panelSzoveg, p.panelVeg, 4.5]);
  if (h === "kesz" || h === "akcio" || h === "hir" || h === "esemeny" || h === "uj") e.push(["címke", p.kiemRa, [p.kiem], 4.5]);
  if (h === "akcio") e.push(["akció száma", p.kiemRa, [p.kiem], 4.5], ["akció sora", p.kiemKicsi, p.veg, 4.5]);
  if (h === "esemeny") e.push(["esemény címkéi", p.kiemKicsi, p.veg, 4.5]);
  if (h === "tudtad") e.push(["Tudtad? fejléc", p.kiemNagy, p.veg, 3], ["Tudtad? csík", p.kiemNagy, p.veg, 3]);
  if (h === "szam") e.push(["a szám", p.kiemNagy, p.veg, 3]);
  return e;
}

describe("olvasható szöveg minden színen", () => {
  it("6 szett + 300 véletlen hármas × 7 helyzet × minden megmaradó változat: minden szöveg ≥ küszöb", () => {
    const hibak: string[] = [];
    let meres = 0;
    for (const [nev, [fo, masodik, hatter]] of HARMASOK) {
      const a = HelyzetArculat.parse({ nev: "Próba", fo, masodik, hatter });
      for (const h of HELYZETEK) {
        const lista = valtozatok(h, a);
        if (!lista.includes("vilagos")) hibak.push(`${nev} ${h}: a Világos kiesett`);
        for (const v of lista) {
          const p = paletta(a, v);
          for (const [mi, szin, veg, min] of elemek(h, p)) {
            meres++;
            const x = crMin(szin, veg);
            if (x < min) hibak.push(`${nev} ${fo}/${masodik}/${hatter} ${h}/${v} ${mi}: ${x.toFixed(2)} < ${min}`);
          }
        }
      }
    }
    expect(hibak.slice(0, 20)).toEqual([]);
    expect(meres).toBeGreaterThan(6000);
  });

  it("a hat szett a Kész munkán megtartja a Színes változatot (TERV §2-K4 mérése nem romlott)", () => {
    for (const [nev, [fo, masodik, hatter]] of Object.entries(SZETTEK))
      expect(valtozatok("kesz", HelyzetArculat.parse({ nev, fo, masodik, hatter })), nev).toContain("szines");
  });

  it("olvashato: megtartja az árnyalatot, és csak annyit sötétít, amennyi kell", () => {
    // világos sárga szöveg krém háttéren → sötétebb sárga, ugyanazzal az árnyalattal
    const ki = olvashato("#f2c94c", ["#fff8ec"], 4.5);
    expect(crMin(ki, ["#fff8ec"])).toBeGreaterThanOrEqual(4.5);
    expect(Math.abs(arnyalat(ki)! - arnyalat("#f2c94c")!)).toBeLessThan(3);
    expect(L(ki)).toBeLessThan(L("#f2c94c"));
    // ami már olvasható, az változatlan
    expect(olvashato("#1f3a5f", ["#f3f6fa"], 4.5)).toBe("#1f3a5f");
    // sötét háttéren világosít
    const vil = olvashato("#2f5d50", ["#1d1f24"], 3);
    expect(L(vil)).toBeGreaterThan(L("#2f5d50"));
    expect(crMin(vil, ["#1d1f24"])).toBeGreaterThanOrEqual(3);
  });

  it("a kép valóban a kiigazított színeket használja (akció sora, Tudtad? fejléce, szám)", () => {
    const a = HelyzetArculat.parse({ nev: "Próba", fo: "#f2c94c", masodik: "#17745e", hatter: "#fff8ec" });
    const p = paletta(a, "vilagos");
    expect(p.kiemKicsi).not.toBe(p.kiem);
    const html = (h: Helyzet) => helyzetHtml(h, "poszt", HelyzetTartalom.parse(MINTA["hu"]![h]), a, { betuCim: (f) => f, nyelv: "hu", fok: 0, valtozat: "vilagos" });
    expect(html("akcio")).toContain(`font-weight:600;color:${p.kiemKicsi};`);
    expect(html("tudtad")).toContain(`color:${p.kiemNagy};`);
    expect(html("szam")).toContain(`color:${p.kiemNagy};white-space:nowrap;`);
    expect(html("esemeny")).toContain(`color:${p.kiemKicsi};font-weight:600;`);
    // a doboz kitöltése a nyers márkaszín marad
    expect(html("akcio")).toContain(`background:${p.kiem};`);
  });
});
