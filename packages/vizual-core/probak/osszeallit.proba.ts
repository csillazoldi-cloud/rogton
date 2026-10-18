import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Marka, Recept, Tartalom, osszeallit, uresValasztas } from "../src/index.ts";

const gyoker = join(import.meta.dirname, "../../..");
const marka = Marka.parse(JSON.parse(readFileSync(join(gyoker, "tools/vizual/referencia/marka-transportlocal.json"), "utf8")));
const recept = (r: string) => Recept.parse(JSON.parse(readFileSync(join(gyoker, `packages/vizual-receptek/receptek/recept-${r}.json`), "utf8")));
const tartalom = (r: string) => Tartalom.parse(JSON.parse(readFileSync(join(gyoker, `tools/vizual/referencia/tartalom-${r}.json`), "utf8")));
const opc = { betuCim: (f: string) => f };

describe("osszeallit", () => {
  for (const r of ["zavar", "allitas", "adatsavok"]) {
    it(`${r}: hiba nélkül összeáll`, () => {
      const o = osszeallit(marka, recept(r), tartalom(r), uresValasztas(), opc);
      expect(o.hibak).toEqual([]);
      expect(o.html).toContain('data-mezo="focim"');
      expect(o.html).toContain('data-mezo="emblema"');
    });
  }
  it("a recept nem hordoz színkódot, a szín a márkából jön", () => {
    const m2 = structuredClone(marka);
    m2.szinek["feher"] = "#fefefe";
    const o = osszeallit(m2, recept("allitas"), tartalom("allitas"), uresValasztas(), opc);
    expect(o.html).toContain("#fefefe");
  });
  it("hiányzó szín: jelentés, nem kivétel", () => {
    const m2 = structuredClone(marka);
    delete m2.szinek["zold"];
    const o = osszeallit(m2, recept("allitas"), tartalom("allitas"), uresValasztas(), opc);
    expect(o.hibak.some((h) => h.kod === "HIANYZO_SZIN")).toBe(true);
  });
  it("kiköltöztetett táblázatsor a képaláírásba kerül, a képről lekerül", () => {
    const v = uresValasztas();
    v.kikoltozott.push("reszletek/helyette");
    const o = osszeallit(marka, recept("zavar"), tartalom("zavar"), v, opc);
    expect(o.html).not.toContain("Gara CFR");
    expect(o.kepalairas.join(" ")).toContain("Gara CFR");
  });
  it("a másodlagos nyelv nyelvi jelölést kap", () => {
    const o = osszeallit(marka, recept("allitas"), tartalom("allitas"), uresValasztas(), opc);
    expect(o.html).toMatch(/lang="hu"[^>]*>A menetrendről/);
  });
});
