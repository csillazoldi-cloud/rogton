// F-8.1 a (T-30): az átirányítás célja a nyilvános cím, nem a doboz belső címe. EGYSÉGPRÓBA, futó rendszer nélkül.
import { describe, expect, it } from "vitest";
import { nyilvanosCim } from "../hitelesites/nyilvanos-cim";

function keres(fejlecek: Record<string, string>, url = "http://0.0.0.0:3000/beallitasok/nyit/abc"): Request {
  return new Request(url, { headers: fejlecek });
}

describe("nyilvanosCim (F-8.1 a, az audit P0-ja)", () => {
  it("a proxy mögött a Host és az X-Forwarded-Proto adja a címet — nem a 0.0.0.0:3000", () => {
    const cel = nyilvanosCim(keres({ host: "saas.mediapartizan.ro", "x-forwarded-proto": "https" }), "/hirfigyelo/beallitas");
    expect(cel.href).toBe("https://saas.mediapartizan.ro/hirfigyelo/beallitas");
    expect(cel.href).not.toContain("0.0.0.0");
  });

  it("az X-Forwarded-Host előbbre való a Host-nál, és a lista első eleme számít", () => {
    const cel = nyilvanosCim(keres({ host: "belso:3000", "x-forwarded-host": "saas.mediapartizan.ro, belso:3000", "x-forwarded-proto": "https" }), "/beallitasok");
    expect(cel.host).toBe("saas.mediapartizan.ro");
  });

  it("proxy nélkül (helyi futás) a kérés saját címe marad", () => {
    const cel = nyilvanosCim(keres({}, "http://127.0.0.1:8401/beallitasok/nyit/abc"), "/belepes?vissza=/beallitasok");
    expect(cel.href).toBe("http://127.0.0.1:8401/belepes?vissza=/beallitasok");
  });

  it("csak belső út engedett — külső cím és '//' nem (nincs nyílt átirányítás)", () => {
    expect(() => nyilvanosCim(keres({}), "https://gonosz.example/")).toThrow();
    expect(() => nyilvanosCim(keres({}), "//gonosz.example/")).toThrow();
  });
});
