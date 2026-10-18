import { describe, it, expect } from "vitest";
import { cikkFrissesseg, HF_CIKK_MAX_KOR_ORA } from "../src/futas";

const MOST = new Date("2026-09-07T10:00:00Z");

/** Segéd: a most-hoz képest eltolt ISO időbélyeg. */
function eltoltOra(orak: number): string {
  return new Date(MOST.getTime() + orak * 60 * 60 * 1000).toISOString();
}

describe("F9-A7 cikkFrissesseg — a 48 órás korlát", () => {
  it("47 órás cikk → friss", () => {
    expect(cikkFrissesseg(eltoltOra(-47), MOST)).toBe("friss");
  });

  it("49 órás cikk → regi", () => {
    expect(cikkFrissesseg(eltoltOra(-49), MOST)).toBe("regi");
  });

  it("pontosan 48 óra → friss (a határ beleértendő)", () => {
    expect(cikkFrissesseg(eltoltOra(-48), MOST)).toBe("friss");
  });

  it("jövőbeli cikk → friss", () => {
    expect(cikkFrissesseg(eltoltOra(5), MOST)).toBe("friss");
  });

  it("null dátum → datum_nelkul", () => {
    expect(cikkFrissesseg(null, MOST)).toBe("datum_nelkul");
  });

  it("értelmezhetetlen dátum → datum_nelkul", () => {
    expect(cikkFrissesseg("nem dátum", MOST)).toBe("datum_nelkul");
  });

  it("a maxOra paraméter tiszteletben tartva: 24-gyel a 30 órás cikk regi", () => {
    expect(cikkFrissesseg(eltoltOra(-30), MOST, 24)).toBe("regi");
  });

  it("a maxOra paraméter tiszteletben tartva: 24-gyel a 20 órás cikk friss", () => {
    expect(cikkFrissesseg(eltoltOra(-20), MOST, 24)).toBe("friss");
  });

  it("az alapértelmezett korlát 48 óra", () => {
    expect(HF_CIKK_MAX_KOR_ORA).toBe(48);
  });
});
