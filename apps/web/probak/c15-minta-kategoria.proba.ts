// c15 (2026-10-08): a szakma-kategória a „Kész munka” mintafotójához — beolvasás (érvényes / érvénytelen / hiányzó → semleges),
// a c15 előtti tárolt példák (kategória nélkül) változatlanul jönnek és a semleges fotót kapják, és a három lista (web, képgyártó,
// prompt) egyezik. Adatbázis és képgyártó nélkül.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { MINTA_FOTO_KATEGORIAK, MINTA_KATEGORIAK, mintaKategoria, taroltPeldak } from "../vizual/minta-kategoria";

describe("c15 minta-kategória", () => {
  it("érvényes kulcs → maga a kulcs", () => {
    for (const k of MINTA_KATEGORIAK) expect(mintaKategoria(k)).toBe(k);
    expect(mintaKategoria(" vendeglatas ")).toBe("vendeglatas");
  });

  it("érvénytelen vagy hiányzó → semleges", () => {
    for (const x of [undefined, null, "", "semleges", "Vendeglatas", "vendéglátás", "kávézó", "pizzeria", 3, {}, ["bolt"]]) {
      expect(mintaKategoria(x)).toBe("semleges");
    }
  });

  it("tárolt példák kategóriával: szétválik, a példákban nincs `kategoria` kulcs", () => {
    const kesz = { cim: "Megújult a reggeli kínálatunk", sor: "Friss croissant minden nap 7-től." };
    const t = taroltPeldak<Record<string, unknown>>({ kesz, kategoria: "vendeglatas" });
    expect(t.kategoria).toBe("vendeglatas");
    expect(t.peldak).toEqual({ kesz });
  });

  it("a c15 előtti tárolt sor (kategória nélkül) változatlan példákkal jön, a kategória semleges", () => {
    const regi = { kesz: { cim: "Elkészült a Rózsák terei járda", sor: "Új térkő, két nap alatt." }, akcio: { szam: "−15%", cim: "a szürke kockakőre", sor: "a hónap végéig" } };
    const t = taroltPeldak<typeof regi>(regi);
    expect(t.kategoria).toBe("semleges");
    expect(t.peldak).toEqual(regi);
  });

  it("hibás kategória a tárban → semleges; nincs sor → nincs példa, semleges", () => {
    expect(taroltPeldak({ kesz: { cim: "x" }, kategoria: "ismeretlen" }).kategoria).toBe("semleges");
    expect(taroltPeldak(undefined)).toEqual({ peldak: null, kategoria: "semleges" });
    expect(taroltPeldak(null)).toEqual({ peldak: null, kategoria: "semleges" });
  });

  it("a web, a képgyártó és a prompt listája ugyanaz", () => {
    const kepgyar = readFileSync(new URL("../../kepgyar/src/minta-foto.ts", import.meta.url), "utf8");
    const sor = kepgyar.match(/export const MINTA_KATEGORIAK = \[([^\]]*)\]/)?.[1] ?? "";
    // c30 F11: the image maker's list = the sample-PHOTO list (the web's 8 + `rendezveny`, the festival's photo — plan §1.2); the web's
    // own list and the prompt stay the 8 company categories, so this one comparison moved to MINTA_FOTO_KATEGORIAK
    expect(sor.split(",").map((s) => s.trim().replace(/"/g, ""))).toEqual([...MINTA_FOTO_KATEGORIAK]);
    expect([...MINTA_FOTO_KATEGORIAK]).toEqual([...MINTA_KATEGORIAK, "rendezveny"]);
    const prompt = readFileSync(new URL("../prompts/kep_peldak.hu.md", import.meta.url), "utf8");
    expect(prompt).toMatch(/kep-peldak · v3/);
    for (const k of MINTA_KATEGORIAK) expect(prompt).toContain(`- ${k} — `);
  });
});
