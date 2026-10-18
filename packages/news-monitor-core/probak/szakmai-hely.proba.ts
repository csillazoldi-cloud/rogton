// J-1g2: a szakmai oldal híreire nem vonatkozik a helyfeltétel. G4 (Rögtön): a példa helye Debrecen, a „helyi portál” példája
// egy listán kívüli cím (a régi erdélyi portál kikerült a listából) — a szabály ugyanaz.
import { describe, expect, it } from "vitest";
import { fokozatSzerint, relevanciabolErtekeles } from "../src";
import { szakmaiForrasCim } from "../src/forras-lista";

const valasz = {
  fontossag: "erdekes", temacimke: "szakmai", miert: "mert", indoklas: "i", osszefoglalo: "o", cim_forditott: "c",
  cegednek: "x", vevoidnek: "", fo_tema: "térkövezés", erintett_tema: "", rola_szol: false, helyszin: "nem", hatokor: "orszagos", hely_feltetel: "Debrecen",
} as never;
const kivonat = { cim: "Új térkőburkolat a budapesti téren", szoveg: "Budapesten elkészült a tér burkolata.", nyelv: "hu", csonkolt: false };

describe("szakmai oldal: nincs helyfeltétel", () => {
  it("a lista szakmai oldalát felismeri, a helyi portált nem", () => {
    expect(szakmaiForrasCim("https://magyarepitok.hu/rss")).toBe(true);
    expect(szakmaiForrasCim("https://www.magyarepitok.hu/rss/")).toBe(true);
    expect(szakmaiForrasCim("https://telex.hu/rss")).toBe(false);
  });
  it("helyi portálról a más városban történt hír nagyon szigorúan kiesik", () => {
    const e = relevanciabolErtekeles(valasz, kivonat, "hu", 1, new Date());
    expect(fokozatSzerint(e, "nagyon_szigoru")).toBe("hatter");
  });
  it("szakmai oldalról ugyanez nagyon szigorúan is átmegy", () => {
    const e = relevanciabolErtekeles(valasz, kivonat, "hu", 1, new Date(), null, true);
    expect(e.hely_ok).toBe(true);
    expect(fokozatSzerint(e, "nagyon_szigoru")).toBe("erdekes");
  });
});
