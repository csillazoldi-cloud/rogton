// E-34: a kérő címének kiolvasása az `x-forwarded-for` fejlécből.
// Ez EGYSÉGPRÓBA (nem kell hozzá futó rendszer): a hamisíthatóság kérdése itt dől el.
import { describe, expect, it } from "vitest";
import { keresCime } from "../hitelesites/korlat";

function fejlec(ertek?: string, valos?: string): Headers {
  const h = new Headers();
  if (ertek !== undefined) h.set("x-forwarded-for", ertek);
  if (valos !== undefined) h.set("x-real-ip", valos);
  return h;
}

describe("keresCime (E-34)", () => {
  it("két megbízható proxynál a hátulról MÁSODIK elem a valódi kérő", () => {
    // ügyfél → DSM (hozzáfűzi az ügyfelet) → nginx (hozzáfűzi a DSM-et)
    expect(keresCime(fejlec("198.51.100.7, 172.18.0.1"), 2)).toBe("198.51.100.7");
  });

  it("a kérő által HAMISÍTOTT elem nem nyer: az a lista elején van, mi jobbról számolunk", () => {
    // a kérő beírta: "1.2.3.4"; DSM hozzáfűzte a valódi címét, nginx a DSM-ét
    const cim = keresCime(fejlec("1.2.3.4, 198.51.100.7, 172.18.0.1"), 2);
    expect(cim).toBe("198.51.100.7");
    expect(cim).not.toBe("1.2.3.4");
  });

  it("akárhány hamis elemet ír be, a valódi címet kapjuk", () => {
    expect(keresCime(fejlec("9.9.9.9, 8.8.8.8, 7.7.7.7, 198.51.100.7, 172.18.0.1"), 2)).toBe("198.51.100.7");
  });

  it("egy megbízható proxynál a hátulról ELSŐ elem kell", () => {
    expect(keresCime(fejlec("1.2.3.4, 198.51.100.7"), 1)).toBe("198.51.100.7");
  });

  it("ha a lista RÖVIDEBB a proxyk számánál, a JOBB szélsőt vesszük — azt a saját proxynk írta", () => {
    // Rosszul beállított proxyszám esetén a bal szélső a kérő hamisítványa lenne.
    // Inkább a jobb szélsőt vesszük: túl szigorú korlát, de nem megkerülhető.
    expect(keresCime(fejlec("198.51.100.7"), 2)).toBe("198.51.100.7");
    expect(keresCime(fejlec("1.2.3.4, 172.18.0.1"), 3)).toBe("172.18.0.1");
    expect(keresCime(fejlec("1.2.3.4, 172.18.0.1"), 3)).not.toBe("1.2.3.4");
  });

  it("fejléc nélkül az x-real-ip, annak híján 'ismeretlen'", () => {
    expect(keresCime(fejlec(undefined, "203.0.113.9"), 2)).toBe("203.0.113.9");
    expect(keresCime(fejlec(), 2)).toBe("ismeretlen");
    expect(keresCime(fejlec(""), 2)).toBe("ismeretlen");
  });

  it("üres elemeket kihagy, és a hosszt korlátozza", () => {
    expect(keresCime(fejlec(" , 198.51.100.7 , 172.18.0.1 "), 2)).toBe("198.51.100.7");
    const hosszu = "x".repeat(500);
    expect(keresCime(fejlec(`${hosszu}, 172.18.0.1`), 2).length).toBe(100);
  });
});
