// R-17 B · a fizetős logótervezés tiszta szabályai (logoterv/szabaly.ts): az ár és a címzett mezője, a kérdőív törzse, a színnév-előtöltés,
// az összefoglaló rövidítése és a levél szövege. Adatbázis és hálózat nélkül.
import { describe, expect, it } from "vitest";
import { HOL_ALAP, LogotervKuldes, arErtelmez, arSzoveg, cimzettErtelmez, level, rovidMondat, szinNevKulcs, szinNevKulcsok } from "../logoterv/szabaly";

describe("az ár (rendszergazda)", () => {
  it("szám, tizedesvessző is; üres és 0 → nincs ajánlat (null)", () => {
    expect(arErtelmez("79")).toEqual({ ok: true, ar: 79 });
    expect(arErtelmez(79)).toEqual({ ok: true, ar: 79 });
    expect(arErtelmez("79,50")).toEqual({ ok: true, ar: 79.5 });
    expect(arErtelmez(" 120.25 ")).toEqual({ ok: true, ar: 120.25 });
    expect(arErtelmez("")).toEqual({ ok: true, ar: null });
    expect(arErtelmez(null)).toEqual({ ok: true, ar: null });
    expect(arErtelmez("0")).toEqual({ ok: true, ar: null });
  });
  it("hibás: negatív, betű, túl sok tizedes, túl nagy", () => {
    for (const r of ["-5", "hetvenkilenc", "79.999", "1000000", "7 9", {}, true]) expect(arErtelmez(r), String(r)).toEqual({ ok: false });
  });
  it("a gombon: „79 €” egész összegnél tizedes nélkül", () => {
    expect(arSzoveg(79, "hu").replace(/\s/g, " ")).toBe("79 €");
    expect(arSzoveg(79.5, "hu").replace(/\s/g, " ")).toBe("79,50 €");
    expect(arSzoveg(79, "en")).toBe("€79");
  });
});

describe("a címzett (rendszergazda)", () => {
  it("üres = nincs levél; egy egyszerű e-mail-cím elfogadva", () => {
    expect(cimzettErtelmez("")).toEqual({ ok: true, cimzett: "" });
    expect(cimzettErtelmez("  csilla@mediapartizan.ro ")).toEqual({ ok: true, cimzett: "csilla@mediapartizan.ro" });
    expect(cimzettErtelmez("ráduly.csilla@példa.ro")).toEqual({ ok: true, cimzett: "ráduly.csilla@példa.ro" });
  });
  it("több cím, szóköz, @ nélkül, fejléc-betörés → hibás", () => {
    for (const r of ["a@b.ro, c@d.ro", "csilla mediapartizan.ro", "csilla@", "a@b.ro\\nBcc: x@y.ro", "a@b", 12]) expect(cimzettErtelmez(r), String(r)).toEqual({ ok: false });
  });
});

describe("a kérdőív törzse", () => {
  it("ékezetes, vesszős adatokkal; a „hol” csak az öt lehetőség; a minták uuid-ok", () => {
    const e = LogotervKuldes.safeParse({ nev: "Kovács Burkolat és Térkőgyártó Kft.", mivel: "Térkövezés, udvarok, járdák — Marosvásárhely", hangulat: "megbízható, erős, helyi", szinek: "zöld és homok; piros nem", hol: ["facebook", "auto"], minta_idk: [] });
    expect(e.success).toBe(true);
    expect(LogotervKuldes.safeParse({ nev: "X", hol: ["tv"] }).success).toBe(false);
    expect(LogotervKuldes.safeParse({ nev: "   " }).success).toBe(false);
    expect(LogotervKuldes.safeParse({ nev: "X", minta_idk: ["../../etc/passwd"] }).success).toBe(false);
    expect(LogotervKuldes.safeParse({ nev: "X", mivel: "á".repeat(401) }).success).toBe(false);
  });
  it("„Hol fogod használni?” alapból: Facebook, Honlap, Autó, ruha (kerdesek 8)", () => {
    expect([...HOL_ALAP]).toEqual(["facebook", "honlap", "auto"]);
  });
});

describe("előtöltés", () => {
  it("színnevek a munkatér színeiből (felirat-kulcsok), ismétlés nélkül", () => {
    expect(szinNevKulcs("#2f5d50")).toBe("r17.szinnev.zold");
    expect(szinNevKulcs("#c9a86a")).toBe("r17.szinnev.homok");
    expect(szinNevKulcs("#f1ede4")).toBe("r17.szinnev.krem");
    expect(szinNevKulcs("#ffffff")).toBe("r17.szinnev.feher");
    expect(szinNevKulcs("#111111")).toBe("r17.szinnev.fekete");
    expect(szinNevKulcs("#c0392b")).toBe("r17.szinnev.piros");
    expect(szinNevKulcs("#1f4e8c")).toBe("r17.szinnev.kek");
    expect(szinNevKulcs("#7a4a2a")).toBe("r17.szinnev.barna");
    expect(szinNevKulcs("nem szín")).toBeNull();
    expect(szinNevKulcsok(["#2f5d50", "#c9a86a", "#2e5c4f"])).toEqual(["r17.szinnev.zold", "r17.szinnev.homok"]);
  });
  it("a „Mivel foglalkoztok?” az összefoglaló első mondata, szóhatáron vágva", () => {
    expect(rovidMondat("Térkövet gyártunk és díszburkolatot rakunk Marosvásárhelyen. Harminc éve.")).toBe("Térkövet gyártunk és díszburkolatot rakunk Marosvásárhelyen");
    const hosszu = rovidMondat("Térkövet gyártunk, díszburkolatot rakunk, kerti utakat, teraszokat és kocsibeállókat építünk Marosvásárhelyen, Szászrégenben és Nyárádszeredában.", 60);
    expect(hosszu.endsWith("…")).toBe(true);
    expect(hosszu.length).toBeLessThanOrEqual(61);
    expect(rovidMondat("")).toBe("");
  });
});

describe("a levél", () => {
  const f = (k: string, e?: Record<string, string | number>) => `${k}${e ? JSON.stringify(e) : ""}`;
  it("tárgy a munkatér nevével, a törzsben minden válasz, a hol a feliratokkal", () => {
    const l = level(f, { munkater: "Kovács Burkolat, Marosvásárhely", ki: "Kovács Tibor", ar: 79, valaszok: { nev: "Kovács Burkolat", mivel: "Térkövezés", hangulat: "erős", szinek: "zöld", hol: ["facebook", "tabla"] }, mintaDb: 2 });
    expect(l.targy).toBe('r17.level.targy{"munkater":"Kovács Burkolat, Marosvásárhely"}');
    expect(l.szoveg).toContain("r17.logoterv.nev Kovács Burkolat");
    expect(l.szoveg).toContain("r17.logoterv.hol_facebook, r17.logoterv.hol_tabla");
    expect(l.szoveg).toContain('r17.level.minta{"n":2}');
    expect(l.szoveg).not.toMatch(/\n\n\n/);
  });
});
