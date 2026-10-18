// f) hatasosErtesites három rétege; g) ALAP_SULYOSSAG; j) kimenoUzenet felirat nélkül is ad címet és szöveget.
import { describe, expect, it } from "vitest";
import {
  ALAP_ERTESITES,
  ALAP_SULYOSSAG,
  hatasosErtesites,
  kimenoUzenet,
  type Esemeny,
} from "../src/index";
import { egyszeruFeliratozo } from "./segedek";

describe("hatasosErtesites — három réteg", () => {
  it("f) alapból minden nincs; a közös felülír; a szervezeti felülírja a közöst", () => {
    const kozos = { futas_hiba: "kimeno" as const };
    const szervezeti = { futas_hiba: "nincs" as const, belepes: "kimeno" as const };

    const csakAlap = hatasosErtesites({}, {});
    expect(csakAlap).toEqual(ALAP_ERTESITES);

    const kozosSzint = hatasosErtesites(kozos, {});
    expect(kozosSzint.futas_hiba).toBe("kimeno");
    expect(kozosSzint.belepes).toBe("nincs");

    const mind = hatasosErtesites(kozos, szervezeti);
    expect(mind.futas_hiba).toBe("nincs");
    expect(mind.belepes).toBe("kimeno");
    expect(mind.keret_kimerult).toBe("nincs");
  });
});

describe("ALAP_SULYOSSAG", () => {
  it("g) futas_hiba hiba, tag_eltavolitva figyelem, belepes info", () => {
    expect(ALAP_SULYOSSAG.futas_hiba).toBe("hiba");
    expect(ALAP_SULYOSSAG.tag_eltavolitva).toBe("figyelem");
    expect(ALAP_SULYOSSAG.belepes).toBe("info");
  });
});

describe("kimenoUzenet", () => {
  it("j) felirat nélkül is ad címet és szöveget", () => {
    const e: Esemeny = {
      id: "e-1",
      szervezet_id: "sz-1",
      fajta: "futas_hiba",
      sulyossag: "hiba",
      fiok_id: null,
      ido: "2026-09-12T10:00:00.000Z",
      adat: { futas: "napi" },
    };
    const uzenet = kimenoUzenet(e, egyszeruFeliratozo());
    expect(uzenet.cim).toBe("futas_hiba");
    expect(uzenet.szoveg).toBe(JSON.stringify({ futas: "napi" }));
    expect(uzenet.fajta).toBe("futas_hiba");
    expect(uzenet.sulyossag).toBe("hiba");
    expect(uzenet.ido).toBe("2026-09-12T10:00:00.000Z");
  });
});
