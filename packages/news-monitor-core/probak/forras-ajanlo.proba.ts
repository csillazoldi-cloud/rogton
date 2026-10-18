// G4 (Rögtön, 2026-10-18): a forráslista magyarországi (7 országos + 5 szakmai oldal, mind magyar nyelvű, térségi oldal nélkül).
// A régi elvárások az erdélyi listára szóltak (maszol.ro, szekelyhon.ro, marosvasarhelyiek.ro, stiridecluj.ro térség-találatai) — azok
// az oldalak kikerültek, ezért a térség-ágak helyett itt az új lista viselkedését mérjük. Ami változatlan szabály: a max, az ismétlés
// tilalma, a leírás nyelve, a szakmai oldal az első háromban, és a „szépítés” ≠ „építés”.
import { describe, expect, it } from "vitest";
import { forrasAjanlo } from "../src/forras-ajanlo";
import { FORRAS_LISTA } from "../src/forras-lista";

describe("forrasAjanlo", () => {
  it("a lista: csak magyar nyelvű, https címek, térségi kulcsszó nélkül", () => {
    expect(FORRAS_LISTA.length).toBe(12);
    expect(FORRAS_LISTA.every((s) => s.nyelv === "hu" && s.cim.startsWith("https://") && s.terseg.length === 0)).toBe(true);
    expect(FORRAS_LISTA.filter((s) => s.altalanos).map((s) => s.nev)).toEqual(["telex.hu", "444.hu", "hvg.hu", "index.hu", "magyarnemzet.hu", "portfolio.hu", "vg.hu"]);
  });

  it("magyar nyelv + debreceni pékség → az országos oldalak, mind általános ajánlásként", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu"], szoveg: "Debreceni pékség vagyunk, friss pékáru, helyi ügyek érdekelnek.", nyelv: "hu" });
    const nevek = ki.map((x) => x.nev);
    expect(nevek).toContain("telex.hu");
    expect(nevek).toContain("portfolio.hu");
    expect(ki.every((x) => x.miert === "altalanos")).toBe(true);
  });

  it("csak román tartalomnyelv → nincs ajánlás (a lista magyar)", () => {
    expect(forrasAjanlo({ nyelvek: ["ro"], szoveg: "Firmă din Debrețin, servicii locale.", nyelv: "ro" })).toEqual([]);
  });

  it("ismeretlen térség → csak általánosak", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu"], szoveg: "Semmi konkrét hely, csak általános tevékenység.", nyelv: "hu" });
    expect(ki.length).toBeGreaterThan(0);
    expect(ki.every((x) => x.miert === "altalanos")).toBe(true);
  });

  it("max betartva", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu", "ro"], szoveg: "Debrecen Szeged Pécs Győr Miskolc", nyelv: "hu", max: 3 });
    expect(ki.length).toBeLessThanOrEqual(3);
  });

  it("nincs ismétlés", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu", "ro"], szoveg: "Térkő, ingatlan, kertépítés, építész, Debrecen", nyelv: "hu", max: 20 });
    const cimek = ki.map((x) => x.cim);
    expect(new Set(cimek).size).toBe(cimek.length);
  });

  it("a leiras a kért nyelven jön", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu"], szoveg: "Debreceni pékség", nyelv: "en" });
    expect(ki.find((x) => x.nev === "telex.hu")?.leiras).toContain("Hungarian national news");
  });

  it("térkövező cég → magyarepitok.hu szakmai oldalként az első háromban", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu"], szoveg: "Térkövezéssel, udvarok és járdák kivitelezésével foglalkozunk Debrecenben.", nyelv: "hu" });
    const elso3 = ki.slice(0, 3);
    expect(elso3.some((x) => x.nev === "magyarepitok.hu" && x.miert === "szakma")).toBe(true);
    // térségi oldal nincs a listán, így az első háromban sincs térség-találat (régen 2 volt)
    expect(elso3.filter((x) => x.miert === "terseg").length).toBe(0);
  });

  it("szépségszalon → nincs építőipari ajánlat (a „szépítés” nem „építés”)", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu"], szoveg: "Szépítés és kozmetikai szalon Debrecenben.", nyelv: "hu" });
    expect(ki.some((x) => x.miert === "szakma")).toBe(false);
  });
});
