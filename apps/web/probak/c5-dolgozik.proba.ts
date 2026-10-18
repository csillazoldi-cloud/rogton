// c5 (Csilla 10-10, kerdesek-4 · 9; gepezet-4 · 5): MINDEN generáló gomb dolgozó állapota ugyanaz a minta — a DolgozoGomb (letiltva,
// aria-busy, pörgő, data-r15="fo-gomb"), mellette egy nyugtató sor. A web próbáiban nincs JSX-fordító (ismert-bukasok: hf-temak), ezért
// ez FORRÁS-próba: a komponens és a négy hely szövegét nézi. A képernyőn mért állapotot a c5 építési jelentés képei mutatják.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const f = (ut: string) => readFileSync(new URL(`../app/${ut}`, import.meta.url), "utf8");

describe("c5 dolgozó állapotok", () => {
  it("a DolgozoGomb: letiltott, aria-busy, pörgő, és a fő gomb jelölését viszi", () => {
    const r15 = f("_kozos/R15.tsx");
    const db = r15.slice(r15.indexOf("export function DolgozoGomb"), r15.indexOf("/** T2 — halk, keretes gomb"));
    expect(db).toContain("disabled");
    expect(db).toContain('aria-busy="true"');
    expect(db).toContain("r15-porgo");
    expect(db).toContain('"data-r15": "fo-gomb"');
    expect(f("_kozos/r15.css")).toMatch(/\.r15-fo-gomb\.r15-fo-gomb-dolgozik \{[^}]*opacity: 0\.9/);
  });
  it("02a2 · 05w · 11a2 · 11c2: a DolgozoGomb a saját szövegével + a nyugtató sor", () => {
    const eb = f("onboarding/ElsoBeallitas.tsx");
    expect(eb).toContain('<DolgozoGomb>{t("r15.eb.keszitjuk")}</DolgozoGomb>');
    expect(eb).toContain('t("r15.eb.fel_perc")');
    const hir = f("hirfigyelo/hir/[id]/R15Hir.tsx");
    expect(hir).toContain('<DolgozoGomb posztra>{t("r15.poszt.irjuk")}</DolgozoGomb>');
    expect(hir).toContain('t("r15.kozos.par_masodperc")');
    const ir = f("iranytu/R15Iranytu.tsx");
    expect(ir).toContain('<DolgozoGomb>{t("r15.ir.irjuk")}</DolgozoGomb>');
    expect(ir).toContain('t("r15.ir.varj")');
    expect(ir).toContain('"r15.ir.irjuk_kerdes"');
    expect(ir).toContain('<DolgozoGomb posztra>{t("r15.poszt.irjuk")}</DolgozoGomb>');
    expect(ir).toContain('t("r15.kozos.par_masodperc")');
  });
});
