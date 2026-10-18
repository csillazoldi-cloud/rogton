import { describe, expect, it } from "vitest";
import {
  lejarat,
  MEGHIVO_ERVENYESSEG_NAP,
  meghivoAllapot,
  type Meghivo,
} from "../src/index";

function uresMeghivo(): Meghivo {
  return {
    id: "m-1",
    szervezet_id: "sz-1",
    szerep: "nezo",
    email: null,
    lenyomat: "ln:jegy-1",
    letrehozta: "t1",
    letrehozva: "2026-01-01T00:00:00.000Z",
    lejar: "2026-01-08T00:00:00.000Z",
    allapot: "kiadott",
    elfogadta: null,
    elfogadva: null,
    visszavonva: null,
  };
}

describe("meghivo — állapot és lejárat", () => {
  it("a lejárat pontosan +7 nap", () => {
    expect(MEGHIVO_ERVENYESSEG_NAP).toBe(7);
    expect(lejarat("2026-01-01T00:00:00.000Z")).toBe(
      "2026-01-08T00:00:00.000Z",
    );
  });

  it("kiadott és nem lejárt → kiadott", () => {
    const m = uresMeghivo();
    expect(meghivoAllapot(m, "2026-01-05T00:00:00.000Z")).toBe("kiadott");
  });

  it("kiadott és lejárt → lejart", () => {
    const m = uresMeghivo();
    expect(meghivoAllapot(m, "2026-01-09T00:00:00.000Z")).toBe("lejart");
  });

  it("elfogadott és visszavont állapot megmarad", () => {
    const e = { ...uresMeghivo(), allapot: "elfogadott" as const };
    expect(meghivoAllapot(e, "2026-01-09T00:00:00.000Z")).toBe("elfogadott");
    const v = { ...uresMeghivo(), allapot: "visszavont" as const };
    expect(meghivoAllapot(v, "2026-01-09T00:00:00.000Z")).toBe("visszavont");
  });
});
