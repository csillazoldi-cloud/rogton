// A8 (Kami, 2026-09-25: 2–3 szó a „Mivel foglalkoztok?” mezőben → „A megadott forrásból nem derül ki…”).
// Tiszta próba: a túl rövid leírás az AI hívása előtt felismerhető, és a gép „nem derül ki” válasza sosem összefoglaló.
import { describe, expect, it } from "vitest";
import { leirasTulRovid, nemDerulKi } from "@km/onboarding-core";

describe("A8 — túl rövid leírás", () => {
  it("2–3 szó túl rövid", () => {
    expect(leirasTulRovid("térkövezés")).toBe(true);
    expect(leirasTulRovid("térkő, burkolás, kertépítés")).toBe(true);
    expect(leirasTulRovid("Kézműves pékség Marosvásárhelyen.")).toBe(true);
    expect(leirasTulRovid("   ")).toBe(true);
  });
  it("pár mondat elég (ékezettel, vesszővel)", () => {
    expect(leirasTulRovid("Kézműves pékség Marosvásárhelyen, családoknak és irodáknak sütünk kovászos kenyeret.")).toBe(false);
    expect(leirasTulRovid("Térköveket rakunk le udvarokon és járdákon Maros megyében, magánházaknak és cégeknek.")).toBe(false);
    expect(leirasTulRovid("Facem pavaje și borduri în Târgu Mureș, pentru case și firme din zonă.")).toBe(false);
  });
  it("írásjel-sorozat nem számít szónak", () => {
    expect(leirasTulRovid("pékség - - - - - - - - - - - - - - - - - - - - - -")).toBe(true);
  });
});

describe("A8 — a gép „nem derül ki” válasza", () => {
  it("a v2 jel felismerhető (bármely nyelven)", () => {
    expect(nemDerulKi("NEM_DERUL_KI — hiányzik, hogy mit csinál a cég és kiknek.")).toBe(true);
    expect(nemDerulKi("  „NEM_DERUL_KI: lipsește activitatea.")).toBe(true);
  });
  it("a v1 szöveges válasza is (ne kerüljön a profilba)", () => {
    expect(nemDerulKi("A megadott forrásból nem derül ki egyértelműen a tevékenység. Hiányzik, mit árul a cég.")).toBe(true);
  });
  it("a rendes összefoglaló nem ilyen", () => {
    expect(nemDerulKi("A Tibor Térkő Kft. Marosvásárhelyen térköveket rak le magánházaknak és cégeknek.")).toBe(false);
    expect(nemDerulKi("[MINTA] Egy pékség.")).toBe(false);
    expect(nemDerulKi("NEM_DERUL_KIVÉTELES")).toBe(false);
  });
});
