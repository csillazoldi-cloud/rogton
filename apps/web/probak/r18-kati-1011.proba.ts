// Kati 10-11 esti visszajelzései (R-18 utókör). Tiszta rész: a közölhető szöveg őre (cím-sor, nekünk szóló sor ki), a prompt v8 szabályai,
// a kép mezőnkénti fordításának szétszedése, a feed-arányok. Élő rész (PROBA_CIM + DATABASE_URL; teszt AI): a „Román változat” a kép
// MINDEN mezőjét adja vissza; a „Kész, másolom” végpontja után a poszt Kész, de nincs „kitéve” (a Naptár „Kitettem”-je külön).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztMunka } from "@rogton/contracts";
import { kozolhetoSzoveg } from "../poszt/bemenet";
import { forditandoMezok, mezokVissza } from "../vizual/fordit-mezok";
import { KEPARANY, elonezetArany } from "../r15/platform-aranyok";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const prompt = (f: string) => readFileSync(new URL(`../prompts/${f}`, import.meta.url), "utf8");

describe("közölhető szöveg (bemenet.ts kozolhetoSzoveg)", () => {
  const torzs = "Hétvégén Szovátán voltunk csapatépítőn, tizennégyen.\n\nKöszönjük mindenkinek, jövőre is megyünk!";
  it("a rövid, írásjel nélküli első sor + üres sor = cím → kikerül", () => {
    expect(kozolhetoSzoveg(`Csapatépítő hétvége Szovátán\n\n${torzs}`)).toBe(torzs);
  });
  it("a markdown-cím és a „Cím:” sor is kikerül", () => {
    expect(kozolhetoSzoveg(`## Csapatépítő hétvége\n\n${torzs}`)).toBe(torzs);
    expect(kozolhetoSzoveg(`**Csapatépítő hétvége Szovátán**\n${torzs}`)).toBe(torzs);
    expect(kozolhetoSzoveg(`Cím: Csapatépítő hétvége\n\n${torzs}`)).toBe(torzs);
  });
  it("a nekünk szóló sorok kikerülnek (Íme…, Megjegyzés:, Ha szeretnéd…, képjavaslat, [helykitöltő])", () => {
    const be = `Íme a poszt:\n\n${torzs}\n\n[Kép: a csapat a Medve-tónál]\nMegjegyzés: a fotókat érdemes az első hozzászólásba tenni.\nHa szeretnéd, készítek rövidebb változatot is.\nKépjavaslat: csoportkép`;
    expect(kozolhetoSzoveg(be)).toBe(torzs);
  });
  it("a mondatként végződő első sor marad (az a poszt első mondata), és a hashtag-sor is marad", () => {
    const p = "Kész a Fenyő utcai udvar!\n\nKét hét munka, és most már a család is birtokba vette.\n\n#díszburkolat #marosvásárhely";
    expect(kozolhetoSzoveg(p)).toBe(p);
  });
  it("egyetlen sorból nem vág (nincs utána szöveg), és a teszt-csatlakozó „[MINTA] …” sora sem tűnik el", () => {
    expect(kozolhetoSzoveg("Csapatépítő hétvége Szovátán")).toBe("Csapatépítő hétvége Szovátán");
    const minta = "[MINTA] Posztszöveg a megadott forrásból: Csapatépítő hétvége Szovátán…\n\n#minta";
    expect(kozolhetoSzoveg(minta)).toBe(minta);
  });
  it("a prompt v8: nincs cím, nincs üzenet a felhasználónak, nincs helykitöltő; az FB első mondata mondat, nem cím", () => {
    const p = prompt("poszt_szoveg.hu.md");
    // R-18 8. kör (Kati 10-13): v9 — a v8 „Nincs cím” szabálya marad, és szigorúbb (az első sor teljes mondat); a fejléc a v8-at is őrzi
    expect(p.split("\n")[0]).toMatch(/poszt-szoveg · v9 · 2026-10-14 .*· v8: 2026-10-11/);
    expect(p).toContain("Nincs cím.");
    expect(p).toMatch(/Nincs benne semmi, ami a felhasználónak vagy nekünk szól/);
    expect(p).toMatch(/Nincs helykitöltő/);
    expect(p).toMatch(/mondat, nem cím/);
    expect(p).not.toMatch(/első sor egy rövid, figyelemfelkeltő mondat \(legfeljebb 8 szó\), külön sorban/);
  });
});

describe("a kép mezőnkénti fordítása (vizual/fordit-mezok.ts)", () => {
  it("csak a betűs mezők fordulnak, a kép sorrendjében; a szám (−15%) marad", () => {
    expect(forditandoMezok({ szam: "−15%", cim: "minden termékünkre", sor: "a hónap  végéig" })).toEqual({ kulcsok: ["cim", "sor"], sorok: ["minden termékünkre", "a hónap végéig"] });
  });
  it("a válasz soronként a mezőkre; eltérő sorszámnál null (a hívó mezőnként kér)", () => {
    expect(mezokVissza(["cim", "sor"], "la toate produsele\npână la sfârșitul lunii")).toEqual({ cim: "la toate produsele", sor: "până la sfârșitul lunii" });
    expect(mezokVissza(["cim", "sor"], "1. la toate produsele\n2. până la sfârșitul lunii")).toEqual({ cim: "la toate produsele", sor: "până la sfârșitul lunii" });
    expect(mezokVissza(["cim", "sor"], "la toate produsele până la sfârșitul lunii")).toBeNull();
  });
});

describe("az előnézet képaránya (r15/platform-aranyok.ts)", () => {
  it("alapból álló 4:5 a hírfolyamban, a blog fekvő 1.91:1", () => {
    expect(KEPARANY.fb.alap).toBeCloseTo(0.8);
    expect(elonezetArany("ig")).toBeCloseTo(0.8);
    expect(elonezetArany("blog")).toBeCloseTo(1.91);
  });
  it("a kép saját aránya a felület határai közé szorítva", () => {
    expect(elonezetArany("fb", 1080, 1080)).toBe(1);
    expect(elonezetArany("fb", 1080, 1920)).toBeCloseTo(0.8); // álló story-kép → 4:5-re vágva
    expect(elonezetArany("li", 3000, 1000)).toBeCloseTo(1.91); // panoráma → 1.91:1
  });
});

describe("élőben: Román változat · Kész, másolom", () => {
  const jelszo = "ProbaJelszo123!";
  let sutik = "";
  let id = "";
  beforeAll(async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Kovács-Szentgyörgyi Tibor", email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Kő és Kert Térkövező Kft., Marosvásárhely" }, sutik });
    const p = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik,
      torzs: { forras: { tipus: "sajat", azonosito: "", cim: "Csapatépítő hétvége Szovátán", url: "", szoveg: "Csapatépítő hétvége Szovátán, fotóalbum a csapatról" }, cim: "Csapatépítő hétvége", felulet: "fb", nyelv: "hu", uj: true } });
    id = p.torzs.munka.id;
    await keres(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("a fordítás a kép MINDEN betűs mezőjét visszaadja (nem egy sort)", async () => {
    const r = await keres<{ mezok: Record<string, string> }>("/api/vizual/fordit", { modszer: "POST", sutik,
      torzs: { mezok: { cim: "Nyílt nap nálunk", hol: "a telephelyünkön", mikor: "szombat, 9–14 óra" }, cel: "ro" } });
    expect(r.statusz).toBe(200);
    expect(Object.keys(r.torzs.mezok).sort()).toEqual(["cim", "hol", "mikor"]);
    for (const v of Object.values(r.torzs.mezok)) expect(v.length).toBeGreaterThan(0);
  });

  it("„Kész, másolom”: a poszt Kész (véglegesítve), de nem „kitéve” — a Kitettem a Naptárban külön", async () => {
    const r = await keres<{ kovetkezo_id: string | null }>(`/api/r15/poszt/${id}/kesz`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
    expect(r.statusz).toBe(200);
    const sor = (await sql<{ szovegek: { allapot: string }[]; kiteve: Date | null }>("SELECT szovegek, kiteve FROM poszt_munka WHERE id = $1", [id]))[0]!;
    expect(sor.szovegek.some((c) => c.allapot === "vegleges")).toBe(true);
    expect(sor.kiteve).toBeNull();
  });
});
