import { describe, expect, it } from "vitest";
import { forrasAjanlo } from "../src/forras-ajanlo";

describe("forrasAjanlo", () => {
  it("magyar nyelv + marosvásárhelyi pékség → az első találatok közt maszol.ro, szekelyhon.ro, marosvasarhelyiek.ro", () => {
    const ki = forrasAjanlo({
      nyelvek: ["hu"],
      szoveg: "Marosvásárhelyi pékség vagyunk, friss pékáru, helyi ügyek érdekelnek.",
      nyelv: "hu",
    });
    const nevek = ki.map((x) => x.nev);
    expect(nevek).toContain("maszol.ro");
    expect(nevek).toContain("szekelyhon.ro");
    // J-1 (2026-09-25): a vasarhely.ro kikerült a listából — a NAS-ról nem elérhető, így hírt sem hozott; helyette a másik
    // marosvásárhelyi helyi portál a térség-találat.
    expect(nevek).toContain("marosvasarhelyiek.ro");
    // az első három mind térség-találat
    expect(ki.slice(0, 3).every((x) => x.miert === "terseg")).toBe(true);
  });

  it("román nyelv + Kolozsvár → stiridecluj.ro elöl", () => {
    const ki = forrasAjanlo({
      nyelvek: ["ro"],
      szoveg: "Firmă din Cluj, servicii locale.",
      nyelv: "ro",
    });
    expect(ki[0]?.nev).toBe("stiridecluj.ro");
    expect(ki[0]?.miert).toBe("terseg");
  });

  it("ismeretlen térség → csak általánosak", () => {
    const ki = forrasAjanlo({
      nyelvek: ["hu"],
      szoveg: "Semmi konkrét hely, csak általános tevékenység.",
      nyelv: "hu",
    });
    expect(ki.length).toBeGreaterThan(0);
    expect(ki.every((x) => x.miert === "altalanos")).toBe(true);
  });

  it("max betartva", () => {
    const ki = forrasAjanlo({
      nyelvek: ["hu", "ro"],
      szoveg: "Marosvásárhely Kolozsvár Hargita Kovászna Bihar Szatmár",
      nyelv: "hu",
      max: 3,
    });
    expect(ki.length).toBeLessThanOrEqual(3);
  });

  it("nincs ismétlés", () => {
    const ki = forrasAjanlo({
      nyelvek: ["hu", "ro"],
      szoveg: "Marosvásárhely Kolozsvár",
      nyelv: "hu",
      max: 20,
    });
    const cimek = ki.map((x) => x.cim);
    expect(new Set(cimek).size).toBe(cimek.length);
  });

  it("a leiras a kért nyelven jön", () => {
    const ki = forrasAjanlo({
      nyelvek: ["hu"],
      szoveg: "Marosvásárhelyi pékség",
      nyelv: "en",
    });
    const maszol = ki.find((x) => x.nev === "maszol.ro");
    expect(maszol?.leiras).toContain("Hungarian news");
  });
  // J-1g (2026-09-25): szakmai oldal a szakmai cégnek — a bejelölt első háromba kerül; szóelejére illeszt („szépítés” ≠ „építés”)
  it("térkövező cég → magyarepitok.hu szakmai oldalként az első háromban", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu"], szoveg: "Térkövezéssel, udvarok és járdák kivitelezésével foglalkozunk Marosvásárhelyen.", nyelv: "hu" });
    const elso3 = ki.slice(0, 3);
    expect(elso3.some((x) => x.nev === "magyarepitok.hu" && x.miert === "szakma")).toBe(true);
    expect(elso3.filter((x) => x.miert === "terseg").length).toBe(2);
  });

  it("szépségszalon → nincs építőipari ajánlat (a „szépítés” nem „építés”)", () => {
    const ki = forrasAjanlo({ nyelvek: ["hu"], szoveg: "Szépítés és kozmetikai szalon Marosvásárhelyen.", nyelv: "hu" });
    expect(ki.some((x) => x.miert === "szakma")).toBe(false);
  });
});
