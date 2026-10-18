import { describe, it, expect } from "vitest";
import { IRANYTU_HATAR, IranytuCelSema } from "@rogton/contracts";
import { vag } from "../iranytu/vag";

// 2026-09-21 (Vilmos): az AI egy 60 karakternél hosszabb „Mikorra” szöveget javasolt, és az iránytű mentése
// és jóváhagyása némán elbukott. A határ bővebb lett, és az AI-javaslatot a határra vágjuk (javaslat.ts: vag()).


describe("iránytű: a mezők határa", () => {
  const cel = (mikorra: string) => ({ id: "00000000-0000-4000-8000-000000000001", nev: "Cél", miert: "", mikorra, mirol_tudod: "", forras: "ai" });

  it("a Vilmos-féle hosszú „Mikorra” most belefér", () => {
    const hosszu = "12 hónapon belül stabil heti vagy kétheti rendszerességű, értelmező tartalom";
    expect(hosszu.length).toBeGreaterThan(60);
    expect(IranytuCelSema.safeParse(cel(hosszu)).success).toBe(true);
  });

  it("a vágott szöveg mindig belefér, szóhatáron, három ponttal", () => {
    const t = "szó ".repeat(200).trim();
    const v = vag(t, IRANYTU_HATAR.mikorra);
    expect(v.length).toBeLessThanOrEqual(IRANYTU_HATAR.mikorra);
    expect(v.endsWith("…")).toBe(true);
    expect(IranytuCelSema.safeParse(cel(v)).success).toBe(true);
  });

  it("a rövid szöveget nem bántja", () => {
    expect(vag("3–6 hónap", IRANYTU_HATAR.mikorra)).toBe("3–6 hónap");
  });
});
