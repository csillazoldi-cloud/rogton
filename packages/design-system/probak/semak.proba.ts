import { describe, expect, it } from "vitest";
import { SEMAK, semaKeres, semaFelismer, semaraValt } from "../src/semak";
import { TemaFelulirasok, egyesit } from "../src/tema-szintek";
import { szarmaztat } from "../src/index";
import type { AlapTokenek } from "../src/tokenek";
import alap from "../src/tema-alap.json";

const alapTokenek = (alap as { tokens: AlapTokenek }).tokens;

describe("R-10 semak", () => {
  it("mindharom sema atmegy a TemaFelulirasok.parse-on", () => {
    for (const s of SEMAK) {
      expect(() => TemaFelulirasok.parse(s.tokenek)).not.toThrow();
    }
  });

  it("az ejkek minden kulcsa egyenlo a tema-alap.json tokens ertekevel", () => {
    const ejkek = semaKeres("ejkek");
    expect(ejkek).not.toBeNull();
    for (const [k, v] of Object.entries(ejkek!.tokenek)) {
      expect(v).toBe((alapTokenek as Record<string, string>)[k]);
    }
  });

  it("a vilagos --aurora-opacity === '0' es --bg === '#F7F7F5'", () => {
    const vilagos = semaKeres("vilagos");
    expect(vilagos).not.toBeNull();
    expect(vilagos!.tokenek["--aurora-opacity"]).toBe("0");
    expect(vilagos!.tokenek["--bg"]).toBe("#F7F7F5");
  });

  it("egyik semaban sincs fenyudvar (2026-09-21, D2: az Ejkekbol is kikerult)", () => {
    for (const s of SEMAK) {
      const h = szarmaztat(egyesit(alapTokenek, s.tokenek));
      expect(h["--glow-primary"]).toBe("none");
      expect(s.tokenek["--aurora-opacity"]).toBe("0");
    }
  });
});

describe("semaFelismer es semaraValt (2026-09-21, D1)", () => {
  const hatasos = (fel: TemaFelulirasok | null) => egyesit(alapTokenek, fel);

  it("a kozos alap az Ejkek; mindharom sema felismerheto a sajat tokenjeibol", () => {
    expect(semaFelismer(alapTokenek)).toBe("ejkek");
    for (const s of SEMAK) expect(semaFelismer(hatasos(s.tokenek))).toBe(s.kod);
  });

  it("a fo szin atirasa nem rontja el a felismerest, egy hatterszin atirasa igen", () => {
    const sotet = semaKeres("sotet")!;
    expect(semaFelismer(hatasos({ ...sotet.tokenek, "--primary": "#2f7d5a", "--primary-2": "#6da48c" }))).toBe("sotet");
    expect(semaFelismer(hatasos({ ...sotet.tokenek, "--bg": "#000000" }))).toBeNull();
  });

  it("valtaskor a sajat betumeret es a sajat fo szin megmarad", () => {
    const vilagos = semaKeres("vilagos")!;
    const fel = { "--fs-base": "18px", "--fs-title": "19px", "--fs-h1": "38px", "--primary": "#2f7d5a", "--primary-2": "#6da48c" };
    const uj = semaraValt(vilagos, hatasos(fel), fel);
    expect(uj["--bg"]).toBe("#F7F7F5");
    expect(uj["--fs-base"]).toBe("18px");
    expect(uj["--fs-title"]).toBe("19px");
    expect(uj["--fs-h1"]).toBe("38px");
    expect(uj["--primary"]).toBe("#2f7d5a");
    expect(uj["--primary-2"]).toBe("#6da48c");
  });

  it("ha a fo szin a sema sajatja volt, az uj sema fo szine jon", () => {
    const vilagos = semaKeres("vilagos")!;
    const sotet = semaKeres("sotet")!;
    const uj = semaraValt(sotet, hatasos(vilagos.tokenek), vilagos.tokenek);
    expect(uj["--primary"]).toBe(sotet.tokenek["--primary"]);
    expect(uj["--fs-base"]).toBeUndefined();
  });
});
