// A2 (2026-09-25 visszajelzés — Csilla: „az add topics-ot megnyomtam, kifagyott minden, kék kicsi forgó cucc a kurzornál”;
// Kamilla 09-16: „a hozzáadás gombnál vacakol, gondolkodik, nem enged”). Tiszta próba: nincs kiszolgáló, nincs adatbázis.
// Amit őriz:
//  1. a letiltott gomb nem mutathat várakozó kurzort (ez volt a „forgó cucc”: az üres mezőnél letiltott Hozzáadás
//     gomb `cursor: wait`-et kapott — nyomás után a mező kiürül, a gomb letiltódik, a kurzor alatta homokóra lesz);
//  2. a témafelvétel soha nem „csendes semmi” (dupla, túl hosszú, túl sok → ok);
//  3. a futó mentés alatt érkező mentés nem vész el (a régi lap eldobta);
//  4. a hívás időkorlátos: egy be nem fejeződő kérés sem hagyja a gombot örökké foglaltan.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Beallitas, Tema } from "@km/news-monitor-core";
import { mentoSor, temaHozzaadas, TEMA_NEV_MAX, TEMAK_MAX } from "../app/hirfigyelo/beallitas/temaMuvelet";
import { hfKeres } from "../app/hirfigyelo/_kozos/kliens";

const tema = (nev: string) => ({ nev, nevvaltozatok: [], megkulonboztetes: "" });

describe("A2 — a letiltott gomb nem „gondolkodik”", () => {
  const css = (ut: string) => readFileSync(new URL(ut, import.meta.url), "utf8");
  it("a :disabled szabályokban nincs cursor: wait (beállítás lap, onboarding gomb)", () => {
    for (const ut of ["../app/hirfigyelo/beallitas.css", "../app/_kozos/fiok.css"]) {
      const szabalyok = css(ut).match(/[^{}]*:disabled[^{}]*\{[^}]*\}/g) ?? [];
      expect(szabalyok.length).toBeGreaterThan(0);
      const varakozo = szabalyok.filter((s) => /cursor:\s*wait/.test(s));
      expect(varakozo, ut).toEqual([]);
    }
  });
});

describe("A2 — témafelvétel", () => {
  it("új téma bekerül, a mező kiürül", () => {
    const e = temaHozzaadas([tema("térkő")], "díszburkolat, járda; térkő");
    expect(e.ujak).toEqual(["díszburkolat", "járda"]);
    expect(e.temak.map((t) => t.nev)).toEqual(["térkő", "díszburkolat", "járda"]);
    expect(e.bevitel).toBe("");
    expect(e.ok).toBeNull();
  });
  it("ami már a listán van (kis-nagybetűtől függetlenül), arra kimondja: mar_van — a mező marad", () => {
    const e = temaHozzaadas([tema("Térkő lerakás")], "térkő lerakás");
    expect(e.ujak).toEqual([]);
    expect(e.ok).toBe("mar_van");
    expect(e.bevitel).toBe("térkő lerakás");
  });
  it("a sémánál hosszabb téma nem kerül be csendben (a mentés különben némán bukna): tul_hosszu", () => {
    const hosszu = "á".repeat(TEMA_NEV_MAX + 1);
    const e = temaHozzaadas([], hosszu);
    expect(e.ok).toBe("tul_hosszu");
    expect(e.temak).toEqual([]);
  });
  it("a 31. téma: tul_sok", () => {
    const tele = Array.from({ length: TEMAK_MAX }, (_, i) => tema(`téma ${i}`));
    const e = temaHozzaadas(tele, "még egy");
    expect(e.ok).toBe("tul_sok");
    expect(e.temak.length).toBe(TEMAK_MAX);
  });
  it("üres bevitel: nincs üzenet (a gomb a mezőbe teszi a kurzort)", () => {
    expect(temaHozzaadas([], "  , ; ").ok).toBe("ures");
  });
  it("a korlátok egyeznek a sémával", () => {
    expect(Tema.safeParse(tema("a".repeat(TEMA_NEV_MAX))).success).toBe(true);
    expect(Tema.safeParse(tema("a".repeat(TEMA_NEV_MAX + 1))).success).toBe(false);
    const alap = { celok: ["sajat_marka"], foldrajzi_fokusz: "", nyelvek: [], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "" };
    expect(Beallitas.safeParse({ ...alap, temak: Array.from({ length: TEMAK_MAX }, (_, i) => tema(`t${i}`)) }).success).toBe(true);
    expect(Beallitas.safeParse({ ...alap, temak: Array.from({ length: TEMAK_MAX + 1 }, (_, i) => tema(`t${i}`)) }).success).toBe(false);
  });
});

describe("A2 — mentések sorban", () => {
  it("a futó mentés alatt küldött mentés nem vész el: a futó után a legfrissebb megy fel", async () => {
    const mentett: string[] = [];
    let elsoKesz: () => void = () => {};
    const sor = mentoSor<string>(async (ertek) => {
      if (mentett.length === 0 && ertek === "v1") await new Promise<void>((r) => { elsoKesz = r; });
      mentett.push(ertek);
    });
    const p1 = sor.kuld("v1");
    expect(sor.fut()).toBe(true);
    void sor.kuld("v2"); // pl. témafelvétel az automatikus mentés alatt
    void sor.kuld("v3");
    elsoKesz();
    await p1;
    expect(mentett).toEqual(["v1", "v3"]);
    expect(sor.fut()).toBe(false);
  });
  it("a hibázó mentés után a sor nem akad el", async () => {
    const mentett: string[] = [];
    const sor = mentoSor<string>(async (ertek) => { if (ertek === "rossz") throw new Error("x"); mentett.push(ertek); });
    await sor.kuld("rossz");
    await sor.kuld("jo");
    expect(mentett).toEqual(["jo"]);
  });
});

describe("A2 — a kérés időkorlátja", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it("a soha be nem fejeződő kérés is visszatér (IDOTULLEPES), és a jel megszakítja a fetch-et", async () => {
    vi.useFakeTimers();
    let megszakitva = false;
    vi.stubGlobal("fetch", (_ut: string, be: RequestInit) => new Promise((_ok, hiba) => {
      be.signal?.addEventListener("abort", () => { megszakitva = true; hiba(new DOMException("aborted", "AbortError")); });
    }));
    const p = hfKeres("/api/hirfigyelo/beallitas", "PUT", { a: 1 }, { idokorlatMs: 30_000 });
    await vi.advanceTimersByTimeAsync(30_001);
    const v = await p;
    expect(v.statusz).toBe(0);
    expect(v.hiba).toBe("IDOTULLEPES");
    expect(megszakitva).toBe(true);
  });
  it("a hálózati hiba HALOZAT marad", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("failed")));
    const v = await hfKeres("/api/x");
    expect(v.hiba).toBe("HALOZAT");
  });
});
