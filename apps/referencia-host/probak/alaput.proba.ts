// E-32: a host útvonal-előtaggal is fut (megosztott kiszolgáló mögött, /referencia/ alatt).
import { describe, expect, it } from "vitest";
import { utvonalLevag } from "../src/kiszolgalo.js";
import { lap } from "../src/felulet/lap.js";
import { talalatokOldal } from "../src/felulet/talalatok.js";
import { HostBeallitasok } from "../src/beallitasok.js";
import alapProfil from "../profil.json" with { type: "json" };

const felirat = (kulcs: string): string => kulcs;

describe("útvonal-előtag (E-32)", () => {
  it("előtag nélkül minden útvonal változatlanul megy át", () => {
    expect(utvonalLevag("/", "")).toBe("/");
    expect(utvonalLevag("/beallitas", "")).toBe("/beallitas");
    expect(utvonalLevag("/sor/abc", "")).toBe("/sor/abc");
  });

  it("előtaggal a mögötte lévő útvonalat adja vissza", () => {
    expect(utvonalLevag("/referencia", "/referencia")).toBe("/");
    expect(utvonalLevag("/referencia/", "/referencia")).toBe("/");
    expect(utvonalLevag("/referencia/beallitas", "/referencia")).toBe("/beallitas");
    expect(utvonalLevag("/referencia/sor/abc", "/referencia")).toBe("/sor/abc");
  });

  it("ami nem az előtag alá esik, az nincs (nem szivárog ki a gyökér)", () => {
    expect(utvonalLevag("/beallitas", "/referencia")).toBeNull();
    expect(utvonalLevag("/referenciax/beallitas", "/referencia")).toBeNull();
    expect(utvonalLevag("/", "/referencia")).toBeNull();
  });

  it("a lap hivatkozásai és az űrlap célja az előtaggal indulnak", () => {
    const html = lap({
      cim: "c",
      nyelv: "hu",
      aktiv: "talalatok",
      tokenekCss: "",
      feliratok: felirat,
      alapUt: "/referencia",
      tartalom: talalatokOldal({
        nyelv: "hu",
        kartyak: [],
        utolsoSikeres: null,
        fut: false,
        ujDb: 0,
        forrasHibak: [],
        forrasCime: (id) => id,
        feliratok: felirat,
        alapUt: "/referencia",
        irhato: true, // a próba az útvonal-előtagot vizsgálja, ahhoz kell a gomb
      }),
    });
    expect(html).toContain('href="/referencia/"');
    expect(html).toContain('href="/referencia/beallitas"');
    expect(html).toContain('action="/referencia/inditas"');
    expect(html).not.toContain('href="/beallitas"');
    expect(html).not.toContain('action="/inditas"');
  });

  it("előtag nélkül a hivatkozások a gyökérre mutatnak (alapértelmezés nem változott)", () => {
    const html = lap({ cim: "c", nyelv: "hu", aktiv: "talalatok", tokenekCss: "", feliratok: felirat, tartalom: "" });
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/beallitas"');
  });

  it("a beállításfájl az előtagot szabványos alakra hozza", () => {
    const alap = { ...(alapProfil as Record<string, unknown>) };
    expect(HostBeallitasok.parse(alap).alap_ut).toBe("");
    expect(HostBeallitasok.parse({ ...alap, alap_ut: "referencia/" }).alap_ut).toBe("/referencia");
    expect(HostBeallitasok.parse({ ...alap, alap_ut: "/referencia/" }).alap_ut).toBe("/referencia");
  });
});
