// VZ-1 · Közlemények, élőben (PROBA_CIM + DATABASE_URL; a km_app-os mérés PROBA_APP_DATABASE_URL-lel):
//  - a posztból kitöltés (gepezet 2): POST /api/vizual/kozlemeny/kitolt — a teszt-csatlakozóval a recept mezői, EGY ai_hivas sor
//    („kozlemeny_kitoltes”, a tag kreditjéből), idegen poszt 404, rossz recept 400;
//  - a szám (kerdesek 8): a letöltés után az „utolsó” a letöltött szám; a következő javaslat ennél eggyel több; munkaterenként külön;
//  - a munkaterek elválasztása (A-11): a kozlemeny_sorszam és a kep_jelzes sorszintű védelme a km_app nevében — a másik munkatér nem
//    látja és nem írja; a rendszergazda listája (SECURITY DEFINER) mindet látja, a lapja csak rendszergazdának nyílik;
//  - a régi cím (/kepek/kozlekedes) a „Közlemények” lapra visz; a Képek sor neve „Közlemények”.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const jelszo = "ProbaJelszo123!";
type Fiok = { sutik: string; fiokId: string; szervezetId: string };
async function fiok(nev: string, munkater: string | null, profil = false): Promise<Fiok> {
  const email = veletlenEmail();
  const r = await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  let szervezetId = "";
  if (munkater) szervezetId = (await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: munkater }, sutik })).torzs.id;
  if (profil) {
    await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik, torzs: { bemutatkozas: { nev: munkater, osszefoglalo: "Térkövezés, udvarok, járdák Marosvásárhelyen.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "Díszburkolat Marosvásárhelyen és Szászrégenben." }, kommunikacio: { celkozonseg: "családi házat építők", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "ai", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" } } });
    await keres("/api/onboarding/jovahagyas", { modszer: "POST", sutik, torzs: {} });
  }
  return { sutik, fiokId: r.torzs.id, szervezetId };
}
async function poszt(f: Fiok): Promise<string> {
  const r = await keres<{ munka: { id: string } }>("/api/poszt", { modszer: "POST", sutik: f.sutik, torzs: { forras: { tipus: "sajat", azonosito: "", cim: "", url: "", szoveg: "" }, cim: "Bolyai utca", felulet: "fb", nyelv: "hu", uj: true } });
  const id = r.torzs.munka.id;
  await keres(`/api/poszt/${id}`, { modszer: "PUT", sutik: f.sutik, torzs: { felulet: "fb", nyelv: "hu", szoveg: "Szerdán 8 és 16 óra között lezárjuk a Bolyai utcát a Rózsák tere és a Kossuth utca között. Kerüljenek a Bernády téren át." } });
  return id;
}

describe("VZ-1 · Közlemények (élő)", () => {
  let tibor: Fiok, masik: Fiok, gazda: Fiok;
  let posztId = "";
  beforeAll(async () => {
    tibor = await fiok("Kovács Tibor", "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely", true);
    masik = await fiok("Fenyő Ágnes", "Fenyő Asztalosműhely, Szászrégen", true);
    gazda = await fiok("Rendszergazda Réka", "Aitmetica próba");
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [gazda.fiokId]);
    posztId = await poszt(tibor);
  }, 60_000);
  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("posztból kitöltés: a recept mezői a teszt-csatlakozóval, egy ai_hivas sor; idegen poszt 404; rossz recept 400", async () => {
    const elotte = (await sql<{ db: number }>("SELECT count(*)::int AS db FROM ai_hivas WHERE szervezet_id = $1 AND feladat = 'kozlemeny_kitoltes'", [tibor.szervezetId]))[0]!.db;
    const r = await keres<{ urlap: { zavar?: { hol: string; kezdet: string; veg: string; allapot: string } }; nev: string }>("/api/vizual/kozlemeny/kitolt", { modszer: "POST", sutik: tibor.sutik, torzs: { poszt: posztId, sablon: "zavar" } });
    expect(r.statusz).toBe(200);
    expect(r.torzs.urlap.zavar).toMatchObject({ allapot: "zavar", hol: "Bolyai utca, Rózsák tere – Kossuth utca", kezdet: "08:00", veg: "16:00" });
    expect(r.torzs.nev).toBe("Bolyai utca");
    const utana = (await sql<{ db: number; szolg: string }>("SELECT count(*)::int AS db, max(szolgaltato) AS szolg FROM ai_hivas WHERE szervezet_id = $1 AND feladat = 'kozlemeny_kitoltes'", [tibor.szervezetId]))[0]!;
    expect(utana.db).toBe(elotte + 1);
    expect(utana.szolg).toBe("teszt");
    expect((await keres("/api/vizual/kozlemeny/kitolt", { modszer: "POST", sutik: masik.sutik, torzs: { poszt: posztId, sablon: "zavar" } })).statusz).toBe(404);
    expect((await keres("/api/vizual/kozlemeny/kitolt", { modszer: "POST", sutik: tibor.sutik, torzs: { poszt: posztId, sablon: "helyzet" } })).statusz).toBe(400);
  });

  it("a szám: a letöltött szám lesz az utolsó, munkaterenként és receptenként; hibás szám 400", async () => {
    expect((await keres<{ sorszam: number; jelzes: number }>("/api/vizual/kozlemeny/letoltve", { modszer: "POST", sutik: tibor.sutik, torzs: { sablon: "zavar", sorszam: 14, jelzesek: [{ szabaly: "T3", szigorusag: "tiltas", arculati: true, mezo: "idoszak", reszlet: "Reddit Mono (monospace)" }, { szabaly: "<script>", szigorusag: "tiltas" }] } })).torzs).toEqual({ sorszam: 14, jelzes: 1 });
    await keres("/api/vizual/kozlemeny/letoltve", { modszer: "POST", sutik: masik.sutik, torzs: { sablon: "zavar", sorszam: 3, jelzesek: [] } });
    await keres("/api/vizual/kozlemeny/letoltve", { modszer: "POST", sutik: tibor.sutik, torzs: { sablon: "adatsavok", sorszam: 2, jelzesek: [] } });
    const sorok = await sql<{ szervezet_id: string; sablon: string; utolso: number }>("SELECT szervezet_id, sablon, utolso FROM kozlemeny_sorszam WHERE szervezet_id = ANY($1) ORDER BY sablon", [[tibor.szervezetId, masik.szervezetId]]);
    expect(sorok).toEqual(expect.arrayContaining([
      { szervezet_id: tibor.szervezetId, sablon: "zavar", utolso: 14 }, { szervezet_id: tibor.szervezetId, sablon: "adatsavok", utolso: 2 },
      { szervezet_id: masik.szervezetId, sablon: "zavar", utolso: 3 },
    ]));
    expect((await keres("/api/vizual/kozlemeny/letoltve", { modszer: "POST", sutik: tibor.sutik, torzs: { sablon: "zavar", sorszam: -1 } })).statusz).toBe(400);
    expect((await keres("/api/vizual/kozlemeny/letoltve", { modszer: "POST", sutik: tibor.sutik, torzs: { sablon: "zavar", sorszam: "abc" } })).statusz).toBe(400);
  });

  it("a javaslat a szerkesztő lapon: az utolsó + 1 (a lap HTML-jébe kerül a kezdőérték)", async () => {
    const lap = await keres<string>("/kepek/zavar", { sutik: tibor.sutik });
    expect(lap.statusz).toBe(200);
    expect(String(lap.torzs)).toMatch(/\\"sorszam\\":15|"sorszam":15/);
    const lap2 = await keres<string>("/kepek/allitas", { sutik: tibor.sutik });
    expect(String(lap2.torzs)).toMatch(/\\"sorszam\\":1[,}]|"sorszam":1[,}]/);
  });

  // A km_tulaj (a próba kapcsolata) megkerüli a sorszintű védelmet — a km_app nevében mérünk, ha a próba megkapja a címét.
  it("munkaterek elválasztása (A-11): a másik munkatér a km_app nevében nem látja és nem írja a számot és a jelzéseket", async () => {
    for (const t of ["kozlemeny_sorszam", "kep_jelzes"]) {
      expect((await sql<{ r: boolean }>("SELECT relrowsecurity AS r FROM pg_class WHERE relname = $1", [t]))[0]!.r).toBe(true);
      expect((await sql<{ db: number }>("SELECT count(*)::int AS db FROM pg_policies WHERE tablename = $1 AND policyname = $2", [t, `${t}_sajat_szervezet`]))[0]!.db).toBe(1);
    }
    const url = process.env["PROBA_APP_DATABASE_URL"];
    if (!url) return;
    const { Client } = await import("pg");
    const c = new Client({ connectionString: url });
    await c.connect();
    try {
      const nevében = async <T>(sz: string, f: () => Promise<T>): Promise<T> => {
        await c.query("BEGIN");
        await c.query("SELECT set_config('app.szervezet_id', $1, true)", [sz]);
        try { return await f(); } finally { await c.query("ROLLBACK"); }
      };
      const lat = async (sz: string, tabla: string) => nevében(sz, async () => (await c.query(`SELECT count(*)::int AS db FROM ${tabla} WHERE szervezet_id = $1`, [tibor.szervezetId])).rows[0].db as number);
      expect(await lat(tibor.szervezetId, "kozlemeny_sorszam")).toBe(2);
      expect(await lat(masik.szervezetId, "kozlemeny_sorszam")).toBe(0);
      expect(await lat(tibor.szervezetId, "kep_jelzes")).toBe(1);
      expect(await lat(masik.szervezetId, "kep_jelzes")).toBe(0);
      // írás a másik munkatér nevében: a szabály elutasítja (WITH CHECK)
      await expect(nevében(masik.szervezetId, () => c.query("INSERT INTO kozlemeny_sorszam (szervezet_id, sablon, utolso) VALUES ($1, 'allitas', 99)", [tibor.szervezetId]))).rejects.toThrow(/row-level security/);
      const modositott = await nevében(masik.szervezetId, async () => (await c.query("UPDATE kozlemeny_sorszam SET utolso = 999 WHERE szervezet_id = $1", [tibor.szervezetId])).rowCount);
      expect(modositott).toBe(0);
    } finally {
      await c.end();
    }
  });

  it("a rendszergazda listája: a függvény minden munkatér jelzését adja; a lap csak rendszergazdának nyílik", async () => {
    const f = await sql<{ szervezet_id: string; szabaly: string; arculati: boolean }>("SELECT szervezet_id, szabaly, arculati FROM kep_jelzes_osszes() WHERE szervezet_id = $1", [tibor.szervezetId]);
    expect(f).toEqual([{ szervezet_id: tibor.szervezetId, szabaly: "T3", arculati: true }]);
    const lap = await keres<string>("/gephaz/kep-jelzesek", { sutik: gazda.sutik });
    expect(lap.statusz).toBe(200);
    expect(String(lap.torzs)).toContain("Márka-jelzések");
    expect(String(lap.torzs)).toContain("Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely");
    const tiltott = await fetch(`${PROBA_CIM}/gephaz/kep-jelzesek`, { headers: { cookie: `${tibor.sutik}; km_nyelv=hu` }, redirect: "manual" });
    expect([303, 307, 308]).toContain(tiltott.status);
    expect(tiltott.headers.get("location")).toContain("/gephaz");
  });

  // Csilla 2026-10-06 18:15: a név „Szöveges képek”, a lap címe /kepek/szoveges-kepek (korábban „Közlemények”, /kepek/kozlemenyek) —
  // mindkét régebbi cím ide visz.
  it("mindkét régebbi cím a Szöveges képek lapra visz (a poszt azonosítójával); a Képek sor neve „Szöveges képek”", async () => {
    for (const regi of ["kozlekedes", "kozlemenyek"]) {
      const v = await fetch(`${PROBA_CIM}/kepek/${regi}?poszt=${posztId}`, { headers: { cookie: `${tibor.sutik}; km_nyelv=hu` }, redirect: "manual" });
      expect([303, 307, 308]).toContain(v.status);
      expect(v.headers.get("location")).toContain(`/kepek/szoveges-kepek?poszt=${posztId}`);
    }
    await sql("UPDATE szervezet SET iparagi_csomagok = '{kozlekedes}' WHERE id = $1", [tibor.szervezetId]);
    const kepek = await keres<string>(`/kepek?poszt=${posztId}`, { sutik: tibor.sutik });
    expect(String(kepek.torzs)).toContain(`href="/kepek/szoveges-kepek?poszt=${posztId}"`);
    expect(String(kepek.torzs)).toMatch(/>Szöveges képek</);
    expect(String(kepek.torzs)).not.toMatch(/Közlemények/);
    const v1 = await keres<string>("/kepek/szoveges-kepek", { sutik: tibor.sutik });
    expect(String(v1.torzs)).toContain("<title>Szöveges képek");
    expect(String(v1.torzs)).toContain("Mit szeretnél közölni?");
  });
});
