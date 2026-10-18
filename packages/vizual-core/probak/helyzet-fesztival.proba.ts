// c30 F12 (Csilla 10-17): a kép kis felirata fesztiválnál a fesztivál szava — „KÉSZ MUNKA” → „ILYEN VOLT” (RO „CUM A FOST”, EN „HOW IT
// WAS”), „AKCIÓ” → „JEGY”. Az arculat `fesztival` mezője nélkül (cég) a kép HTML-je bájtra ugyanaz, mint eddig.
import { describe, expect, it } from "vitest";
import { HelyzetArculat, HelyzetTartalom, MINTA, helyzetHtml } from "../src/index";

const html = (h: "kesz" | "akcio", fesztival: boolean | undefined, nyelv: string) =>
  helyzetHtml(h, "poszt", HelyzetTartalom.parse(MINTA["hu"]![h]), HelyzetArculat.parse({ nev: "Próba", ...(fesztival === undefined ? {} : { fesztival }) }), { betuCim: (f) => f, nyelv, fok: 0, valtozat: "vilagos" });

describe("a kép kis feliratai a munkatér típusa szerint", () => {
  it("cég: KÉSZ MUNKA / AKCIÓ; `fesztival: false` = a mező nélküli kép, bájtra", () => {
    expect(html("kesz", undefined, "hu")).toContain("KÉSZ MUNKA");
    expect(html("akcio", undefined, "hu")).toContain("AKCIÓ");
    expect(html("kesz", false, "hu")).toBe(html("kesz", undefined, "hu"));
  });
  it("fesztivál: ILYEN VOLT / JEGY, románul és angolul is", () => {
    expect(html("kesz", true, "hu")).toContain("ILYEN VOLT");
    expect(html("kesz", true, "hu")).not.toContain("KÉSZ MUNKA");
    expect(html("akcio", true, "hu")).toContain("JEGY");
    expect(html("kesz", true, "ro")).toContain("CUM A FOST");
    expect(html("kesz", true, "en")).toContain("HOW IT WAS");
  });
});
