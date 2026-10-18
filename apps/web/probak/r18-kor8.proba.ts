// R-18 8. kör (Kati 10-13/14 + Round 8 rajz: Naptár, Beállítások; Csilla 10-14). Tiszta rész: a közölhető szöveg cím-őre (tapadó cím,
// csupa nagybetű, emoji a végén), a felhívás mint SZÁNDÉK (ctaSorok, atirasBemenet), a promptok új változatai, a szabály-visszhang őre
// („no invented activities shown”), a Tibor-zár elfogadott pirosai. Élő rész (PROBA_CIM + DATABASE_URL; teszt AI): a felhívás nem kerül
// szó szerint a végére; a kép beállításai a posztra kerülnek, és a „Kép szerkesztése” (?szerk=1) ebből tölt; a honlap és a közösségi oldal
// szerkeszthető; a Kezdőlap „Saját ötletből” linkje; a Naptár: levétel · törlés (puha) · visszavonás · húzás tartománya; tenant-szűrés.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztMunka, TipusAdat } from "@km/contracts";
import { atirasBemenet, ctaSorok, kozolhetoSzoveg } from "../poszt/bemenet";
import { szabalyVisszhang, visszhangNelkul } from "../poszt/tipus";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const prompt = (f: string) => readFileSync(new URL(`../prompts/${f}`, import.meta.url), "utf8");

describe("a közölhető szöveg nem kezdődik címmel (kozolhetoSzoveg)", () => {
  it("a tapadó cím (üres sor nélkül, rövid, írásjel nélkül, utána hosszú mondat) lekerül — emojival a végén is", () => {
    expect(kozolhetoSzoveg("Új udvar a Fenyő utcában 🌿\nTegnap fejeztük be a Fenyő utcai udvart, 120 m² antik kockakővel.")).toBe("Tegnap fejeztük be a Fenyő utcai udvart, 120 m² antik kockakővel.");
    expect(kozolhetoSzoveg("Curte nouă în Târgu Mureș\nAm terminat ieri curtea de pe strada Brazilor, cu 120 m² de piatră.")).toBe("Am terminat ieri curtea de pe strada Brazilor, cu 120 m² de piatră.");
  });
  it("a csupa nagybetűs első sor lekerül; a valódi első mondat és az egyetlen sor marad", () => {
    expect(kozolhetoSzoveg("KÉSZ AZ UDVAR!\n\nTegnap fejeztük be a Fenyő utcai udvart.")).toBe("Tegnap fejeztük be a Fenyő utcai udvart.");
    const mondat = "Tegnap befejeztük a Fenyő utcai udvart.\nNézd meg, milyen lett!";
    expect(kozolhetoSzoveg(mondat)).toBe(mondat);
    expect(kozolhetoSzoveg("Szép napot mindenkinek")).toBe("Szép napot mindenkinek");
  });
  it("a rövid, de mondatvégi írásjellel zárt nyitó sor nem cím", () => {
    const s = "Kész!\nTegnap fejeztük be a Fenyő utcai udvart, 120 m² antik kockakővel.";
    expect(kozolhetoSzoveg(s)).toBe(s);
  });
});

describe("a felhívás szándék, nem kész mondat", () => {
  it("ctaSorok: a szándékot adja, és kimondja, hogy ne szó szerint", () => {
    const s = ctaSorok("Hívj fel: 0744 123 456").join("\n");
    expect(s).toContain("NEM kész mondat");
    expect(s).toContain("Hívj fel: 0744 123 456");
    expect(s).toMatch(/ne másold szó szerint/);
    expect(ctaSorok("  ")).toEqual([]);
  });
  it("atirasBemenet: a teljes szöveg átírásánál viszi a szándékot, kijelölt részletnél nem", () => {
    expect(atirasBemenet([], "fb", "felhivas", "", "Kész az udvar.", "Kérj ajánlatot")).toContain("Cselekvésre hívás szándéka");
    expect(atirasBemenet([], "fb", "rovidebb", "Kész az udvar.", "Kész az udvar. Gyere el!", "Kérj ajánlatot")).not.toContain("Cselekvésre hívás szándéka");
  });
  it("a promptok új változatai: v9 · v4 · v3 · v2, a szabályaikkal", () => {
    const sz = prompt("poszt_szoveg.hu.md"), at = prompt("poszt_atiras.hu.md"), ti = prompt("poszt_tipus.hu.md"), ci = prompt("poszt_cikk.hu.md");
    expect(sz.split("\n")[0]).toMatch(/poszt-szoveg · v9 · 2026-10-14/);
    expect(at.split("\n")[0]).toMatch(/poszt-atiras · v4 · 2026-10-14/);
    // c30 F7 (10-17): poszt_tipus is v4 now (the RENDEZVÉNY rule + the album-photo rule); the v3 rules below are unchanged, the header keeps v3
    expect(ti.split("\n")[0]).toMatch(/poszt-tipus · v4 · 2026-10-17 .*· v3: 2026-10-14/);
    expect(ci.split("\n")[0]).toMatch(/poszt-cikk · v2 · 2026-10-14/);
    for (const p of [sz, at, ti, ci]) expect(p).toMatch(/szó szerint/);
    expect(ti).toMatch(/no invented activities shown/);
  });
});

describe("a szabály nem kerül a kimenetbe (Kati 10-13: B-roll „no invented activities shown”)", () => {
  it("szabalyVisszhang HU/RO/EN", () => {
    for (const s of ["no invented activities shown", "Only the given facts", "nincs kitalált tevékenység", "fără activități inventate"]) expect(szabalyVisszhang(s)).toBe(true);
    for (const s of ["Kész udvar, lassú ráközelítés", "Autó és gyerekek az udvaron"]) expect(szabalyVisszhang(s)).toBe(false);
  });
  it("visszhangNelkul: a videó cellájából a visszhang kiürül, a valódi tartalom marad", () => {
    const adat = { video: { sorok: [{ ido: "0–3 mp", elmondod: "Ez az udvar négy nap alatt lett ilyen.", felirat: "4 NAP", kep: "no invented activities shown" }, { ido: "3–14 mp", elmondod: "Hétfőn még sár volt itt.", felirat: "ELŐTTE", kep: "Régi beton, gép munka közben" }], hookok: [] } } as unknown as TipusAdat;
    const ki = visszhangNelkul(adat) as { video: { sorok: { kep: string }[] } };
    expect(ki.video.sorok[0]!.kep).toBe("");
    expect(ki.video.sorok[1]!.kep).toBe("Régi beton, gép munka közben");
  });
});

describe("Tibor-zár: a Round 8 elfogadott pirosai (Csilla 2026-10-14, zárt válasz 5)", () => {
  it("a Beállítások telefonos listája, az Adatkezelés és a telefonos húzás elfogadva, indoklással", () => {
    const e = JSON.parse(readFileSync(new URL("../../../tools/tibor-proba/elfogadott.json", import.meta.url), "utf8")) as { lapok: Record<string, { dontes: string; datum: string }> };
    for (const k of ["ertesitesek/telefon", "adatkezeles/asztali", "adatkezeles/telefon", "naptar-huzas/telefon"]) {
      expect(e.lapok[k]?.datum).toBe("2026-10-14");
      expect(e.lapok[k]?.dontes).toMatch(/list\/transient state, no single primary action — accepted by Csilla 2026-10-14/);
    }
  });
});

describe("élőben: felhívás, kép beállításai, Szervezet adatai, Saját ötlet, Naptár", () => {
  const jelszo = "ProbaJelszo123!";
  let sutik = "";
  let masik = "";
  const CEG = "Kő és Kert Térkövező Kft., Marosvásárhely — próba 8";
  const MASIK = "Șandor & Fiii SRL — próba 8";
  const belep = async (nev: string, szervezet: string) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s });
    const osszefoglalo = "Térkövezés, díszburkolat és kertépítés Marosvásárhelyen és környékén, húsz éve.";
    await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev: szervezet, osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: osszefoglalo },
      kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu"], nyelvek_forras: "ai", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
    } });
    await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s });
    return s;
  };
  const ujPoszt = async (s: string, cim: string) => {
    const r = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: s, torzs: { forras: { tipus: "sajat", azonosito: "", cim, url: "", szoveg: cim }, cim, felulet: "fb", nyelv: "hu", uj: true } });
    const id = r.torzs.munka.id;
    await keres(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik: s, torzs: { felulet: "fb", nyelv: "hu" } });
    return id;
  };
  const html = async (ut: string, s: string) => (await fetch(`${PROBA_CIM}${ut}`, { headers: { cookie: `${s}; km_nyelv=hu` } })).text();
  beforeAll(async () => {
    sutik = await belep("Kovács-Szentgyörgyi Tibor", CEG);
    masik = await belep("Szász Ágnes-Ioana", MASIK);
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("a felhívás a forrásba kerül, a szöveget a gép írja át (nem a kód illeszti a végére szó szerint)", async () => {
    const id = await ujPoszt(sutik, "Őszi gyepszellőztetés a Rózsák terén");
    const cta = "Kérj ingyenes felmérést: 0744 123 456";
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}`, { modszer: "PUT", sutik, torzs: { felulet: "fb", nyelv: "hu", szoveg: "Ősszel érdemes szellőztetni a gyepet, így tavasszal erősebb lesz.", cta } });
    expect(r.statusz).toBe(200);
    expect(r.torzs.munka.forras.cta?.["hu"]).toBe(cta);
    const szoveg = r.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")?.szoveg ?? "";
    expect(szoveg.trim().endsWith(cta)).toBe(false);
  });

  it("a kép beállításai a posztra kerülnek (x-kep-beallitas), és a „Kép szerkesztése” (?szerk=1) ezekkel nyit", async () => {
    const id = await ujPoszt(sutik, "Tiszta térkő télre");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const beall = { helyzet: "uj", ertek: { cim: "Tiszta térkő télre — Bolyai tér, 340 m²" }, valtozat: "vilagos", meret: "poszt" };
    const v = await fetch(`${PROBA_CIM}/api/r15/kep`, { method: "POST", body: png, headers: { cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent("térkő.png"), "x-poszt": id, "x-kep-beallitas": encodeURIComponent(JSON.stringify(beall)) } });
    expect(v.status).toBe(201);
    const sor = (await sql<{ b: unknown }>("SELECT forras->'kep_beallitas' AS b FROM poszt_munka WHERE id = $1", [id]))[0]!;
    expect(sor.b).toMatchObject(beall);
    expect(await html(`/kepek/uj/uj?poszt=${id}&szerk=1`, sutik)).toContain("Bolyai tér, 340 m²");
    // érvénytelen fejléc: a kép felmegy, a beállítás nem (nem dől el a feltöltés)
    const v2 = await fetch(`${PROBA_CIM}/api/r15/kep`, { method: "POST", body: png, headers: { cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": "x.png", "x-poszt": id, "x-kep-beallitas": "nem-json" } });
    expect(v2.status).toBe(201);
  });

  it("Szervezet adatai: a honlap és a közösségi oldal szerkeszthető; a Kezdőlapon egy koppintás a Saját ötlet", async () => {
    const r = await keres<{ honlap: string; kozossegi_oldal: string }>("/api/profil/kinalat", { modszer: "PUT", sutik, torzs: { honlap: "https://kovacsterko.ro", kozossegi_oldal: "facebook.com/kovacsterko" } });
    expect(r.statusz).toBe(200);
    expect(r.torzs.kozossegi_oldal).toBe("facebook.com/kovacsterko");
    const sz = (await sql<{ id: string }>("SELECT id FROM szervezet WHERE nev = $1", [CEG]))[0]!.id;
    const a = (await sql<{ h: string; k: string }>("SELECT adatok->>'honlap' AS h, adatok->>'kozossegi_oldal' AS k FROM szervezet_profil WHERE szervezet_id = $1", [sz]))[0]!;
    expect(a).toEqual({ h: "https://kovacsterko.ro", k: "facebook.com/kovacsterko" });
    expect(await html("/fiok", sutik)).toContain("https://kovacsterko.ro");
    expect(await html("/kezdolap", sutik)).toContain('href="/poszt?sajat=1"');
  });

  it("Naptár: levétel → visszavonás; törlés (puha) → a listákból eltűnik, a sor megmarad → visszavonás", async () => {
    const id = await ujPoszt(sutik, "Nyílt nap a telephelyünkön, szombaton");
    await keres(`/api/r15/poszt/${id}/kesz`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
    const ma = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik, torzs: { muvelet: "nap", nap: ma } })).statusz).toBe(200);
    const sor = async () => (await sql<{ t: string | null; le: unknown; tor: string | null }>("SELECT tervezett_nap::text AS t, forras->'naptar_le' AS le, forras->>'torolve' AS tor FROM poszt_munka WHERE id = $1", [id]))[0]!;
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik, torzs: { muvelet: "levesz" } })).statusz).toBe(200);
    let s = await sor();
    expect(s.t).toBeNull();
    expect(s.le).toMatchObject({ tervezett_nap: ma });
    expect(await html("/naptar", sutik)).not.toContain(id);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik, torzs: { muvelet: "visszavon" } })).statusz).toBe(200);
    s = await sor();
    expect(s.t).toBe(ma);
    expect(s.le).toBeNull();
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik, torzs: { muvelet: "torol" } })).statusz).toBe(200);
    s = await sor();
    expect(s.tor).toBeTruthy();
    expect(await html("/naptar", sutik)).not.toContain(id);
    expect(await html("/poszt", sutik)).not.toContain(id);
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik, torzs: { muvelet: "visszavon" } })).statusz).toBe(200);
    s = await sor();
    expect(s.tor).toBeNull();
    expect(s.t).toBe(ma);
    expect(await html("/naptar", sutik)).toContain(id);
  });

  it("Naptár: a húzás tartománya ma − 31 … ma + 90; a másik szervezet posztja nem mozdítható", async () => {
    const id = await ujPoszt(sutik, "Megújul a Tisza-parti főtér");
    const nap = (n: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(d); };
    for (const [n, v] of [[-31, 200], [90, 200], [-40, 400], [100, 400]] as const) {
      expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik, torzs: { muvelet: "nap", nap: nap(n) } })).statusz).toBe(v);
    }
    expect((await keres(`/api/poszt/${id}/naptar`, { modszer: "POST", sutik: masik, torzs: { muvelet: "torol" } })).statusz).toBe(404);
    expect((await sql<{ tor: string | null }>("SELECT forras->>'torolve' AS tor FROM poszt_munka WHERE id = $1", [id]))[0]!.tor).toBeNull();
  });
});
