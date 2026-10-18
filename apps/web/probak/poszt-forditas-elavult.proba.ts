// H1 (Kati, hub 10-05): a román posztban „Marosvásárhely” maradt „Târgu Mureș” helyett. Két ok (gyökérok: app/poszt/forditando.ts):
//  1. a „Más nyelven” váltás csak ÜRES cellát fordított — a már meglévő, azóta elavult fordítás változatlanul jött vissza;
//  2. a közvetlenül román (angol) nyelven írt posztnak (poszt_szoveg) nem volt helynév-szabálya.
// Ez a próba: (a) a váltás döntése valósághű magyar/román szövegekkel, (b) a két prompt helynév-szabálya, (c) élőben: a magyar szöveg
// kézi átírása után a román cella elavult → a döntés „fordítsd újra” → a fordítás után már nem elavult.
// (c) a futó kiszolgálót és az adatbázist kéri (PROBA_CIM, DATABASE_URL); a teszt AI-szolgáltató „[MINTA] …” szöveget ad, ezért a helynév
// tényleges fordítását NEM ez méri — azt csak egy valódi modell mutatja meg (MEASURED.md).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztMunka } from "@rogton/contracts";
import { forditasKell } from "../app/poszt/forditando";
import { keres, lezar, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

type Cella = Parameters<typeof forditasKell>[0][number];
const HU = "Új díszburkolat készült Marosvásárhelyen, a Rózsák terén. A kőművesek két hét alatt végeztek, köszönjük a türelmet!";
const RO_GEP = "Un nou pavaj decorativ a fost realizat la Marosvásárhely, în Piața Trandafirilor. Zidarii au terminat în două săptămâni.";
const RO_KEZI = "Pavaj nou în Târgu Mureș, Piața Trandafirilor — mulțumim pentru răbdare, vecini!";
const cella = (c: Partial<Cella> & Pick<Cella, "nyelv">): Cella => ({ felulet: "fb", szoveg: "", javaslat: "", allapot: "nincs", elavult_forditas: false, ...c });

describe("H1 — mikor fordít újra a „Más nyelven” váltás", () => {
  it("üres vagy hiányzó cella: fordít (mint eddig)", () => {
    expect(forditasKell([cella({ nyelv: "hu", szoveg: HU, javaslat: HU, allapot: "javaslat" })], "fb", "ro")).toBe(true);
    expect(forditasKell([cella({ nyelv: "ro", szoveg: "   " })], "fb", "ro")).toBe(true);
  });
  it("friss (nem elavult) fordítás: nem fordít újra — nem fizetünk feleslegesen", () => {
    const l = [cella({ nyelv: "hu", szoveg: HU, javaslat: HU, allapot: "javaslat" }), cella({ nyelv: "ro", szoveg: RO_GEP, javaslat: RO_GEP, allapot: "javaslat" })];
    expect(forditasKell(l, "fb", "ro")).toBe(false);
  });
  it("ELAVULT és a gép szövege áll benne: újrafordít (ez volt a hiba — eddig a régi „Marosvásárhely”-es szöveg jött vissza)", () => {
    const l = [cella({ nyelv: "hu", szoveg: HU, allapot: "szerkesztve" }), cella({ nyelv: "ro", szoveg: RO_GEP, javaslat: RO_GEP, allapot: "javaslat", elavult_forditas: true })];
    expect(forditasKell(l, "fb", "ro")).toBe(true);
  });
  it("elavult, de kézzel írt (szerkesztve / véglegesítve / eltér a javaslattól): nem nyúl hozzá (A-9)", () => {
    const hu = cella({ nyelv: "hu", szoveg: HU, allapot: "szerkesztve" });
    expect(forditasKell([hu, cella({ nyelv: "ro", szoveg: RO_KEZI, javaslat: RO_GEP, allapot: "szerkesztve", elavult_forditas: true })], "fb", "ro")).toBe(false);
    expect(forditasKell([hu, cella({ nyelv: "ro", szoveg: RO_GEP, javaslat: RO_GEP, allapot: "vegleges", elavult_forditas: true })], "fb", "ro")).toBe(false);
    expect(forditasKell([hu, cella({ nyelv: "ro", szoveg: RO_KEZI, javaslat: RO_GEP, allapot: "javaslat", elavult_forditas: true })], "fb", "ro")).toBe(false);
  });
  it("másik felület cellája nem számít", () => {
    const l = [cella({ nyelv: "ro", felulet: "ig", szoveg: RO_GEP, javaslat: RO_GEP, allapot: "javaslat", elavult_forditas: true })];
    expect(forditasKell(l, "fb", "ro")).toBe(true); // az fb/ro cella üres
    expect(forditasKell(l, "ig", "ro")).toBe(true);
    expect(forditasKell([cella({ nyelv: "ro", felulet: "ig", szoveg: RO_GEP, javaslat: RO_GEP, allapot: "javaslat" })], "ig", "ro")).toBe(false);
  });
});

describe("H1 — a helynév-szabály mindkét posztíró promptban", () => {
  const prompt = (f: string) => readFileSync(new URL(`../prompts/${f}`, import.meta.url), "utf8");
  const szoveg = prompt("poszt_szoveg.hu.md");
  const forditas = prompt("poszt_forditas.hu.md");
  it("a poszt_szoveg v6 kimondja: a helynév a tartalomnyelv alakjában, ékezettel", () => {
    // R-18 3. kör (2026-10-11): a prompt v7 lett (a saját ötlet szabálya került bele); a v6 helynév-szabálya változatlanul benne van —
    // a fejléc a v7-et mondja, és a v6 leírását is megtartja („· v6: v5 + helynevek …”), ezt őrizzük.
    // Kati 10-11: v8 (közölhető szöveg) — a fejléc a v7 és a v6 leírását is megtartja, a helynév-szabály változatlan
    // R-18 8. kör (Kati 10-13): v9 (az első sor soha nem cím; a felhívás szándék) — a fejléc a v8, v7 és v6 leírását is megtartja
    expect(szoveg.split("\n")[0]).toMatch(/poszt-szoveg · v9 · 2026-10-14 .*· v8: 2026-10-11 .*· v6: v5 \+ helynevek/);
    expect(szoveg).toContain("Helynevek — a tartalomnyelv alakjában");
    for (const par of ["Marosvásárhely · Târgu Mureș · Târgu Mureș", "Kolozsvár · Cluj-Napoca · Cluj-Napoca", "Bukarest · București · Bucharest"]) expect(szoveg).toContain(par);
  });
  it("a két prompt mintái nem mondanak ellent egymásnak (minden poszt_szoveg-pár a fordító listájában is ott van)", () => {
    // a minta-lista: a „Minta (…):” sor UTÁNI rész a „- Cég-” pontig, „;”-vel tagolva, mindegyik „hu · ro · en”
    const eleje = szoveg.indexOf(":", szoveg.indexOf("- Minta (magyar · román · angol)")) + 1;
    const lista = szoveg.slice(eleje, szoveg.indexOf("- Cég-", eleje)).replace(/\s+/g, " ").trim().replace(/\.$/, "");
    const parok = lista.split(";").map((x) => x.split(" · ").map((y) => y.trim()));
    for (const p of parok) expect(p.length, p.join(" · ")).toBe(3);
    expect(parok.length).toBeGreaterThanOrEqual(8);
    const fLap = forditas.replace(/\s+/g, " ");
    for (const [hu, ro, en] of parok) expect(fLap, `${hu} · ${ro} · ${en}`).toContain(`${hu} · ${ro} · ${en}`);
  });
});

describe("H1 — élőben: kézi magyar átírás → elavult román cella → újrafordítás", () => {
  let sutik = "";
  let id = "";
  const jelszo = "ProbaJelszo123!";

  beforeAll(async () => {
    const email = veletlenEmail();
    const r = await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Kovács Tibor", email, jelszo } });
    expect(r.statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely" }, sutik });
    expect(sz.statusz).toBe(201);
    const p = await keres<{ munka?: { id: string } }>("/api/poszt", { modszer: "POST", sutik,
      torzs: { forras: { tipus: "sajat", azonosito: "", cim: "", url: "", szoveg: "" }, cim: "Díszburkolat a Rózsák terén — Marosvásárhely", felulet: "fb", nyelv: "hu", uj: true } });
    expect(p.statusz).toBe(200);
    id = p.torzs.munka?.id ?? "";
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("a román cella a magyar kézi átírása után elavult, a váltás újrafordítja, utána friss", async () => {
    const irt = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
    expect(irt.statusz).toBe(200);
    const ro1 = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "ro" } });
    expect(ro1.statusz).toBe(200);
    expect(forditasKell(ro1.torzs.munka.szovegek, "fb", "ro"), "friss fordítás: nincs újrafordítás").toBe(false);

    // Tibor átírja a magyart (ékezet, vessző, helynév) — a kiszolgáló a román cellát elavultnak jelöli
    const mentes = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}`, { modszer: "PUT", sutik, torzs: { felulet: "fb", nyelv: "hu", szoveg: HU } });
    expect(mentes.statusz).toBe(200);
    const roCella = mentes.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "ro");
    expect(roCella?.elavult_forditas).toBe(true);
    expect(roCella?.allapot).toBe("javaslat");
    expect(forditasKell(mentes.torzs.munka.szovegek, "fb", "ro"), "elavult gépi cella: a váltás újrafordít").toBe(true);

    const ro2 = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "ro" } });
    expect(ro2.statusz).toBe(200);
    const uj = ro2.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "ro");
    expect(uj?.elavult_forditas).toBe(false);
    expect(forditasKell(ro2.torzs.munka.szovegek, "fb", "ro")).toBe(false);
    // a magyar kézi szöveg érintetlen
    expect(ro2.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")?.szoveg).toBe(HU);
  });
});
