import { describe, it, expect } from "vitest";
import { honlapSzinek, szinNormalizal, cssCimek } from "../onboarding/szinek";

describe("szinNormalizal", () => {
  it("hex rövid formátumot teljesre alakít", () => {
    expect(szinNormalizal("#ABC")).toBe("#aabbcc");
  });

  it("hex nagybetűs formátumot kisbetűsre alakít", () => {
    expect(szinNormalizal("#2F5D4E")).toBe("#2f5d4e");
  });

  it("rgb vesszővel elválasztott formátumot hexre alakít", () => {
    expect(szinNormalizal("rgb(47, 93, 78)")).toBe("#2f5d4e");
  });

  it("rgb szóközzel elválasztott formátumot hexre alakít", () => {
    expect(szinNormalizal("rgb(47 93 78)")).toBe("#2f5d4e");
  });

  it("rgba alfa érték 0.5 alatt nullt ad", () => {
    expect(szinNormalizal("rgba(47,93,78,0.3)")).toBeNull();
  });

  it("hsl formátumot hexre alakít", () => {
    expect(szinNormalizal("hsl(0, 100%, 50%)")).toBe("#ff0000");
  });

  it("név alapú színeket hexre alakít", () => {
    expect(szinNormalizal("white")).toBe("#ffffff");
  });

  it("transparent színt nullt ad", () => {
    expect(szinNormalizal("transparent")).toBeNull();
  });

  it("ismeretlen szöveget nullt ad", () => {
    expect(szinNormalizal("valami")).toBeNull();
  });
});

describe("cssCimek", () => {
  it("link elemekből abszolút URL-eket generál", () => {
    const html = `<link rel="stylesheet" href="/css/a.css">`;
    const eredmeny = cssCimek(html, "https://pelda.ro/");
    expect(eredmeny).toContain("https://pelda.ro/css/a.css");
  });

  it("legfeljebb 6 címet ad vissza", () => {
    const html = Array.from({ length: 10 }, (_, i) => `<link rel="stylesheet" href="/css/a${i}.css">`).join("");
    const eredmeny = cssCimek(html, "https://pelda.ro/");
    expect(eredmeny.length).toBeLessThanOrEqual(6);
  });
});

describe("honlapSzinek", () => {
  it("meta theme-color és CSS háttérszínt azonosít", () => {
    const html = `<meta name="theme-color" content="#2f5d4e">`;
    const cssek = `.btn { background:#d9a441 }`;
    const eredmeny = honlapSzinek(html, [cssek], "https://pelda.ro/");
    expect(eredmeny.fo).toBe("#2f5d4e");
    expect(eredmeny.masodik).toBe("#d9a441");
  });

  it("szürke, fehér és fekete nem lehet fő vagy második szín", () => {
    const html = `<meta name="theme-color" content="#777777">`;
    const cssek = `.btn { background:#ffffff }`;
    const eredmeny = honlapSzinek(html, [cssek], "https://pelda.ro/");
    expect(eredmeny.fo).toBeNull();
    expect(eredmeny.masodik).toBeNull();
  });

  it("nagyon hasonló színeket egyként kezeli", () => {
    const html = `<meta name="theme-color" content="#2f5d4e">`;
    const cssek = `.btn { background:#305e4f }`;
    const eredmeny = honlapSzinek(html, [cssek], "https://pelda.ro/");
    expect(eredmeny.masodik).toBeNull();
  });

  it("body háttérszínt azonosít", () => {
    const html = "";
    const cssek = `body { background:#f5f1e8 }`;
    const eredmeny = honlapSzinek(html, [cssek], "https://pelda.ro/");
    expect(eredmeny.hatter).toBe("#f5f1e8");
  });

  it("sötét body háttérszín nullt ad", () => {
    const html = "";
    const cssek = `body { background:#222 }`;
    const eredmeny = honlapSzinek(html, [cssek], "https://pelda.ro/");
    expect(eredmeny.hatter).toBeNull();
  });

  it("img logót abszolút URL-lal adja vissza", () => {
    const html = `<img src="/img/logo.svg" alt="Cég">`;
    const eredmeny = honlapSzinek(html, [], "https://pelda.ro/");
    expect(eredmeny.logo).toBe("https://pelda.ro/img/logo.svg");
  });

  it("apple-touch-icon-t használja ha nincs img logo", () => {
    const html = `<link rel="apple-touch-icon" href="/ati.png">`;
    const eredmeny = honlapSzinek(html, [], "https://pelda.ro/");
    expect(eredmeny.logo).toBe("https://pelda.ro/ati.png");
  });

  it("data URI logót nem fogad el", () => {
    const html = `<img src="data:image/svg+xml;base64,..." alt="Logo">`;
    const eredmeny = honlapSzinek(html, [], "https://pelda.ro/");
    expect(eredmeny.logo).toBeNull();
  });

  it("üres bemenetnél minden null és jeloltek üres", () => {
    const eredmeny = honlapSzinek("", [], "https://pelda.ro/");
    expect(eredmeny.fo).toBeNull();
    expect(eredmeny.masodik).toBeNull();
    expect(eredmeny.hatter).toBeNull();
    expect(eredmeny.logo).toBeNull();
    expect(eredmeny.jeloltek).toEqual([]);
  });

  it("csak szürke/fehér/fekete színeknél fo null", () => {
    const html = `<meta name="theme-color" content="#888888">`;
    const cssek = `.btn { background:#000000 }`;
    const eredmeny = honlapSzinek(html, [cssek], "https://pelda.ro/");
    expect(eredmeny.fo).toBeNull();
  });

  it("nagy CSS fájlt 2 másodpercen belül feldolgozza", () => {
    const nagyCss = Array.from({ length: 10000 }, (_, i) => `.elem${i} { background:#${(i % 256).toString(16).padStart(2, "0")}${(i % 256).toString(16).padStart(2, "0")}${(i % 256).toString(16).padStart(2, "0")} }`).join("\n");
    const kezdet = performance.now();
    honlapSzinek("", [nagyCss], "https://pelda.ro/");
    const veg = performance.now();
    expect(veg - kezdet).toBeLessThan(2000);
  });
});
