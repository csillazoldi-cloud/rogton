// c30 F0 — profile safety net (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.1, §8 risks 1–4, §10 F0 row;
// docs/decisions/2026-10-17-c30-f0-profil-biztositek.md). No visible change.
// Pure part: the loose stored schema, the tolerant read, what a full save keeps, the merge-patch check.
// Live part (PROBA_CIM + DATABASE_URL; test AI; A-11 also needs PROBA_APP_DATABASE_URL = km_app): unknown keys survive
// load → save, a garbage value still loads and is not lost, re-approval keeps everything the draft does not produce,
// `mezoMent` merges, and under ANOTHER org's tenant context it updates 0 rows.
import { Client } from "pg";
import { sql as dsql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ProfilModositas, SzervezetProfil, type KinalatSor } from "@rogton/contracts";
import { PROFIL_MAG, PROFIL_MAG_TIPUS, profilMentesre, profilMezokEllenoriz, profilTureloOlvas } from "@rogton/profile-core";
import * as sema from "../adatbazis/sema";
import { mezoMentTx, profilTar } from "../profil/tar";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const FIOK = "00000000-0000-4000-8000-0000000000f0";
/** A realistic stored profile (RO-first guesthouse in Sovata, HU second) — accents, commas, long names. */
const ALAP = {
  nev: "Pensiunea Ștefănescu, Sovata — Ștefănescu Panzió, Szováta",
  osszefoglalo: "Családi panzió a Medve-tó mellett, Szovátán: 12 szoba, házi reggeli, szaunázás, túrák a Bekecs-tetőre. Pensiune de familie lângă Lacul Ursu.",
  osszefoglalo_forras: "ai", osszefoglalo_modositva: false,
  celkozonseg: "családok, nyugdíjasok, wellness-kedvelők Erdélyből és Magyarországról", celkozonseg_forras: "ai", celkozonseg_modositva: false,
  cel: "", cel_forras: "", cel_modositva: false,
  nyelvek: ["ro", "hu"], nyelvek_forras: "sajat",
  hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "", hangnem_forras: "", hangnem_modositva: false,
  arculat: { allapot: "nincs", tervezet: null, verzio: 1, jovahagyott_verzio: null, verziok: {} },
  kesobbre: ["cel", "hangnem", "arculat"],
  jovahagyva: "2026-10-17T08:00:00.000Z",
  jovahagyta: FIOK,
} as const;
const KINALAT: KinalatSor[] = [
  { nev: "Kétágyas szoba reggelivel — Cameră dublă cu mic dejun", reszlet: "Medve-tó, 300 m; erkély, ő ű ș ț ă", ar: "350 lei/éj", aktiv: true },
  { nev: "Szauna és sós fürdő, csütörtök–vasárnap", reszlet: "", ar: "", aktiv: true },
];
const NEVEK = [{ hu: "Szovátai Medve-tó", ro: "Lacul Ursu din Sovata", en: "Bear Lake, Sovata" }];
// moved by c30 F1 (rule 10): `szervezet_tipus` became a KNOWN profile field in F1, so the "unknown future key" examples use `jovo_tipus`
const JOVO = { jovo_tipus: "fesztival", jovo_kulcs: { nyelv_mod: "egyben", megjegyzes: "Zilele Târgumureșene, „Aura Șova & Band”, ő ű ș ț ă" } };

describe("F0 pure: loose stored schema, tolerant read, full-save keep rule, merge-patch check", () => {
  it("the stored schema keeps unknown keys; the input schema (ProfilModositas) still drops them", () => {
    const p = SzervezetProfil.parse({ ...ALAP, ...JOVO });
    expect((p as Record<string, unknown>)["jovo_kulcs"]).toEqual(JOVO.jovo_kulcs);
    expect((p as Record<string, unknown>)["jovo_tipus"]).toBe("fesztival");
    const m = ProfilModositas.parse({ nev: "Ștefănescu Panzió", szervezet_tipus: "fesztival" });
    expect(m).toEqual({ nev: "Ștefănescu Panzió" }); // no key injection through the account page
  });

  it("the core list is derived from the schema and matches the typed list", () => {
    expect([...PROFIL_MAG].sort()).toEqual([...PROFIL_MAG_TIPUS].sort());
    expect(PROFIL_MAG).not.toContain("kinalat");
    expect(PROFIL_MAG).not.toContain("osszefoglalo_modositva"); // has a default: non-core
  });

  it("a valid profile loads as is; unknown keys pass through", () => {
    const e = profilTureloOlvas({ ...ALAP, ...JOVO, kinalat: KINALAT });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.kihagyott).toEqual([]);
    expect(e.profil.kinalat).toEqual(KINALAT);
    expect((e.profil as Record<string, unknown>)["jovo_kulcs"]).toEqual(JOVO.jovo_kulcs);
  });

  it("a garbage value in a non-core field still loads: the field is left out, everything else stays", () => {
    const e = profilTureloOlvas({
      ...ALAP, ...JOVO, jovo_tipus: 12345, // garbage in an unknown (future) key: passes through untouched
      szervezet_tipus: 12345, // c30 F1 (rule 10): szervezet_tipus is now a known plain-string field → garbage in it is left out, not fatal
      arak_posztban: "igen", kinalat: "nem lista", tema_terv: [{ tema: "Reel a stégről", tipus: "reel" }], // garbage in known optional keys
      hivatalos_nevek: NEVEK, kesobbre: ["cel", "program"], // "program": a value from a future version in a derived list
    });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.kihagyott.sort()).toEqual(["arak_posztban", "kesobbre", "kinalat", "szervezet_tipus", "tema_terv"]); // + szervezet_tipus: known since c30 F1
    expect(e.profil.arak_posztban).toBeUndefined();
    expect(e.profil.kinalat).toBeUndefined();
    expect(e.profil.kesobbre).toEqual(["cel"]);
    expect(e.profil.hivatalos_nevek).toEqual(NEVEK);
    expect(e.profil.nev).toBe(ALAP.nev);
    expect((e.profil as Record<string, unknown>)["jovo_tipus"]).toBe(12345);
    expect(e.profil.szervezet_tipus).toBeUndefined(); // c30 F1: a known field with a bad value is left out (and kept in the row by ment)
  });

  it("null only for a non-object or a broken core — and it names the core fields", () => {
    expect(profilTureloOlvas(null)).toEqual({ ok: false, ok_hiba: "NEM_OBJEKTUM", mezok: [] });
    expect(profilTureloOlvas([ALAP])).toEqual({ ok: false, ok_hiba: "NEM_OBJEKTUM", mezok: [] });
    const { nev: _n, ...nevNelkul } = ALAP;
    expect(profilTureloOlvas(nevNelkul)).toEqual({ ok: false, ok_hiba: "HIBAS_MAG", mezok: ["nev"] });
    expect(profilTureloOlvas({ ...ALAP, jovahagyta: "nem-uuid", kinalat: "x" })).toMatchObject({ ok: false, ok_hiba: "HIBAS_MAG", mezok: ["jovahagyta"] });
  });

  it("a full save keeps stored keys this version cannot represent; a known valid key left out is still removed", () => {
    const uj = SzervezetProfil.parse({ ...ALAP, osszefoglalo: "Új leírás, ékezetekkel: ő ű ș ț ă." });
    const { adatok, megorzott } = profilMentesre({ ...ALAP, ...JOVO, arak_posztban: "igen", poszt_szokasok: "régi, érvényes" }, uj);
    expect(megorzott.sort()).toEqual(["arak_posztban", "jovo_kulcs", "jovo_tipus"]); // c30 F1: the unknown example key is jovo_tipus (see JOVO)
    expect(adatok["jovo_kulcs"]).toEqual(JOVO.jovo_kulcs);
    expect(adatok["arak_posztban"]).toBe("igen"); // raw value back in the row: not lost, still unreadable here
    expect(adatok["poszt_szokasok"]).toBeUndefined(); // valid and known: the caller's omission is a real removal (as before)
    expect(adatok["osszefoglalo"]).toBe("Új leírás, ékezetekkel: ő ű ș ț ă.");
    // the new profile's own value always wins over a stored one
    expect(profilMentesre({ ...ALAP, szervezet_tipus: "ceg" }, SzervezetProfil.parse({ ...ALAP, szervezet_tipus: "fesztival" })).adatok["szervezet_tipus"]).toBe("fesztival");
  });

  it("the merge patch: known non-core fields only, parsed (trimmed); unknown, core, null and empty are refused", () => {
    expect(profilMezokEllenoriz({ poszt_szokasok: "  Rövid posztok, 2–3 emoji, #Szováta #Sovata  ", kinalat: KINALAT }))
      .toEqual({ ok: true, patch: { poszt_szokasok: "Rövid posztok, 2–3 emoji, #Szováta #Sovata", kinalat: KINALAT } });
    // c30 F1 (rule 10): szervezet_tipus is now a known non-core field, so it is accepted; the unknown-key example is jovo_tipus
    expect(profilMezokEllenoriz({ szervezet_tipus: "fesztival" })).toEqual({ ok: true, patch: { szervezet_tipus: "fesztival" } });
    expect(profilMezokEllenoriz({ jovo_tipus: "fesztival" })).toEqual({ ok: false, mezok: { jovo_tipus: "ismeretlen" } });
    expect(profilMezokEllenoriz({ nev: "Másik név" })).toEqual({ ok: false, mezok: { nev: "mag_mezo" } });
    expect(profilMezokEllenoriz({ arak_posztban: null })).toMatchObject({ ok: false, mezok: { arak_posztban: "invalid_type" } });
    expect(profilMezokEllenoriz({})).toEqual({ ok: false, mezok: { "": "ures" } });
    expect(profilMezokEllenoriz("kinalat")).toEqual({ ok: false, mezok: { "": "nem_objektum" } });
  });
});

describe("F0 live: load → save, garbage, re-approval, mezoMent, A-11", () => {
  const jelszo = "ProbaJelszo123!";
  const CEG = "Pensiunea Ștefănescu, Sovata — próba F0";
  const MASIK = "Kő és Kert Térkövező Kft., Marosvásárhely — próba F0";
  let sutik = "";
  let masikSutik = "";
  let a = "";
  let b = "";
  const belep = async (nev: string, szervezet: string) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const be = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(be.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s });
    expect(sz.statusz).toBe(201);
    return { s, id: sz.torzs.id };
  };
  const piszkozat = (s: string, nev: string, osszefoglalo: string) => keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
    bemutatkozas: { nev, osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: osszefoglalo },
    kommunikacio: { celkozonseg: "családok, nyugdíjasok, wellness-kedvelők", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["ro", "hu"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "ro", hangnem_forras: "sajat" },
  } });
  const tarolt = async (id: string) => (await sql<{ adatok: Record<string, unknown> }>("SELECT adatok FROM szervezet_profil WHERE szervezet_id = $1", [id]))[0]!.adatok;
  const beir = (id: string, patch: Record<string, unknown>) => sql("UPDATE szervezet_profil SET adatok = adatok || $2::jsonb WHERE szervezet_id = $1", [id, JSON.stringify(patch)]);

  beforeAll(async () => {
    const x = await belep("Ștefănescu-Kovács Ildikó", CEG);
    const y = await belep("Kovács-Szentgyörgyi Tibor", MASIK);
    sutik = x.s; a = x.id; masikSutik = y.s; b = y.id;
    for (const [s, nev] of [[sutik, CEG], [masikSutik, MASIK]] as const) {
      expect((await piszkozat(s, nev, "Családi panzió a Medve-tó mellett, Szovátán: 12 szoba, házi reggeli, szauna.")).statusz).toBe(200);
      expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
    }
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("a profile with unknown keys survives load → save (direct and through an existing saver)", async () => {
    await beir(a, JOVO);
    const p = await profilTar.betolt(a);
    expect(p).not.toBeNull();
    expect((p as Record<string, unknown>)["jovo_kulcs"]).toEqual(JOVO.jovo_kulcs);
    await profilTar.ment(a, { ...p!, hivatalos_nevek: NEVEK });
    expect(await tarolt(a)).toMatchObject({ ...JOVO, hivatalos_nevek: NEVEK });
    // an existing full-save path (kinalatMent: load → change → ment) keeps them too
    expect((await keres("/api/profil/kinalat", { modszer: "PUT", sutik, torzs: { kinalat: KINALAT, arak_posztban: true } })).statusz).toBe(200);
    expect(await tarolt(a)).toMatchObject({ ...JOVO, hivatalos_nevek: NEVEK, kinalat: KINALAT, arak_posztban: true });
  });

  it("a garbage value still loads (no redirect to onboarding) and is not lost by the next save; a broken core → null", async () => {
    await beir(b, { szervezet_tipus: 12345, arak_posztban: "igen", tema_terv: [{ tema: "Reel a stégről", tipus: "reel" }] });
    const p = await profilTar.betolt(b);
    expect(p).not.toBeNull();
    expect(p!.nev).toBe(MASIK);
    expect(p!.arak_posztban).toBeUndefined();
    const g = await keres<{ profil: unknown }>("/api/profil", { sutik: masikSutik });
    expect(g.statusz).toBe(200);
    expect(g.torzs.profil).not.toBeNull();
    // the next full save (Hivatalos nevek) writes the raw unreadable values back — the person's data is not silently dropped
    expect((await keres("/api/profil/nevek", { modszer: "PUT", sutik: masikSutik, torzs: { nevek: [{ hu: "Kultúrpalota", ro: "Palatul Culturii", en: "" }] } })).statusz).toBe(200);
    expect(await tarolt(b)).toMatchObject({ szervezet_tipus: 12345, arak_posztban: "igen", tema_terv: [{ tema: "Reel a stégről", tipus: "reel" }], hivatalos_nevek: [{ hu: "Kultúrpalota", ro: "Palatul Culturii", en: "" }] });
    // documented null case: the core is broken (no name)
    const nev = (await tarolt(b))["nev"];
    await sql("UPDATE szervezet_profil SET adatok = adatok - 'nev' WHERE szervezet_id = $1", [b]);
    expect(await profilTar.betolt(b)).toBeNull();
    await beir(b, { nev });
    expect(await profilTar.betolt(b)).not.toBeNull();
  });

  it("re-approval keeps kinalat, hivatalos_nevek and a made-up future key; only the draft's own fields change", async () => {
    const elotte = await tarolt(a);
    expect(elotte).toMatchObject({ kinalat: KINALAT, hivatalos_nevek: NEVEK, ...JOVO });
    const uj = "Családi panzió a Medve-tó mellett, Szovátán, 1998 óta: 14 szoba, házi reggeli, szauna, sós fürdő; ș ț ă.";
    expect((await piszkozat(sutik, CEG, uj)).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik })).statusz).toBe(200);
    const utana = await tarolt(a);
    expect(utana["osszefoglalo"]).toBe(uj);
    expect(utana).toMatchObject({ kinalat: KINALAT, hivatalos_nevek: NEVEK, arak_posztban: true, ...JOVO });
    // the jsonb diff: every changed key is one the draft produces (profilPiszkozatbol). `frissitve` may also move: the background
    // brand-colour job after approval (arculatotHatterben → arculatMent) stamps it when it writes a draft arculat.
    const piszkozatKulcsai = new Set([...PROFIL_MAG_TIPUS, "osszefoglalo_modositva", "celkozonseg_modositva", "cel_modositva", "hangnem_modositva", "frissitve"]);
    const valtozott = [...new Set([...Object.keys(elotte), ...Object.keys(utana)])].filter((k) => JSON.stringify(elotte[k]) !== JSON.stringify(utana[k]));
    expect(valtozott).toContain("osszefoglalo");
    expect(valtozott.filter((k) => !piszkozatKulcsai.has(k))).toEqual([]);
  });

  it("mezoMent merges one field and keeps every other key; a bad patch is refused before SQL", async () => {
    const elotte = await tarolt(a);
    const e = await profilTar.mezoMent(a, { poszt_szokasok: "Rövid posztok, 2–3 emoji, #Szováta #Sovata" });
    expect(e).toEqual({ ok: true, sorok: 1 });
    const utana = await tarolt(a);
    expect(utana).toEqual({ ...elotte, poszt_szokasok: "Rövid posztok, 2–3 emoji, #Szováta #Sovata" });
    // c30 F1 (rule 10): the unknown-key example is jovo_tipus (szervezet_tipus became a known field in F1)
    expect(await profilTar.mezoMent(a, { jovo_tipus: "fesztival" } as never)).toEqual({ ok: false, hiba: "ERVENYTELEN_ADAT", mezok: { jovo_tipus: "ismeretlen" } });
    expect(await profilTar.mezoMent(a, { nev: "Átírt név" } as never)).toEqual({ ok: false, hiba: "ERVENYTELEN_ADAT", mezok: { nev: "mag_mezo" } });
    expect(await tarolt(a)).toEqual(utana);
  });

  it.skipIf(!process.env["PROBA_APP_DATABASE_URL"])("A-11: mezoMent as km_app under ANOTHER org's tenant context updates 0 rows; under its own, 1", async () => {
    const k = new Client({ connectionString: process.env["PROBA_APP_DATABASE_URL"] });
    await k.connect();
    try {
      const d = drizzle({ client: k, schema: sema });
      const bElotte = await tarolt(b);
      const idegen = await d.transaction(async (tx) => {
        await tx.execute(dsql`SELECT set_config('app.szervezet_id', ${a}, true)`);
        return mezoMentTx(tx, b, { poszt_szokasok: "idegen írás — nem mehet át" });
      });
      expect(idegen).toBe(0);
      expect(await tarolt(b)).toEqual(bElotte);
      const sajat = await d.transaction(async (tx) => {
        await tx.execute(dsql`SELECT set_config('app.szervezet_id', ${b}, true)`);
        return mezoMentTx(tx, b, { poszt_szokasok: "Saját írás: térkő, szegély, ő ű" });
      });
      expect(sajat).toBe(1);
      expect((await tarolt(b))["poszt_szokasok"]).toBe("Saját írás: térkő, szegély, ő ű");
    } finally {
      await k.end();
    }
  });
});
