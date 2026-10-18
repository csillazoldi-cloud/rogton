// R-17 A6 (12d3 „Pontos kódom van”, Kati #10, H3): a színkód-mező értelmezése (app/fiok/arculat/szinek/szinKod.ts). Tiszta próba.
import { describe, expect, it } from "vitest";
import { szinKodErtelmez } from "../app/fiok/arculat/szinek/szinKod";

describe("színkód a „Pontos kódom van” mezőben", () => {
  it("hex: #RRGGBB, RRGGBB, #RGB, RGB — kisbetűs #rrggbb lesz", () => {
    expect(szinKodErtelmez("#1A5C3B")).toBe("#1a5c3b");
    expect(szinKodErtelmez("1a5c3b")).toBe("#1a5c3b");
    expect(szinKodErtelmez("  #C9A86A ")).toBe("#c9a86a");
    expect(szinKodErtelmez("#fa0")).toBe("#ffaa00");
    expect(szinKodErtelmez("FA0")).toBe("#ffaa00");
  });
  it("RGB: „26, 92, 59”, „26 92 59”, „26;92;59”, rgb(26,92,59)", () => {
    expect(szinKodErtelmez("26, 92, 59")).toBe("#1a5c3b");
    expect(szinKodErtelmez("26 92 59")).toBe("#1a5c3b");
    expect(szinKodErtelmez("26;92;59")).toBe("#1a5c3b");
    expect(szinKodErtelmez("rgb(26, 92, 59)")).toBe("#1a5c3b");
    expect(szinKodErtelmez("RGB( 0,0,0 )")).toBe("#000000");
    expect(szinKodErtelmez("255,255,255")).toBe("#ffffff");
  });
  it("nem ismerhető fel → null (a lap egy halk mondatot mutat, a szín nem változik)", () => {
    for (const rossz of ["", "   ", "#12345", "#1234567", "zöld", "#GGGGGG", "256, 0, 0", "1, 2", "rgb(1,2,3", "1,2,3)", "-1, 2, 3", "1.5, 2, 3", "#1A5C3B; drop"]) {
      expect(szinKodErtelmez(rossz), rossz).toBeNull();
    }
  });
});
