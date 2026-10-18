// R-16 K1 (TERV 1.7 R2, 2-K1 Self-test): a régi fiókoldali doboz a TELJES arculatot küldi a lap megnyitásakori állapotból.
// Egy elavult lap nem tüntethet el egy közben született jóváhagyást: 409 ELAVULT_ADAT, és pillanatkép soha nem vész el.
// A profil.proba.ts stílusában: valódi kiszolgáló + adatbázis (PROBA_CIM, DATABASE_URL).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ArculatLepes, HibaValasz, JovahagyasValasz, ProfilValasz } from "@km/contracts";
import { arculatJovahagy, arculatModosit, arculatTervezetElvet } from "@km/profile-core";
import { keres, lezar, sql, takaritas, veletlenEmail } from "./segedek";

describe("R2: elavult arculat-írás a PUT /api/profil-on (R-16 K1)", () => {
  let sutik: string;
  let szervezetId: string;
  let v1: ArculatLepes; // az 1. jóváhagyás utáni állapot (a „régi lap” ezt tartja)

  async function put(arculat: ArculatLepes) {
    return keres<unknown>("/api/profil", { modszer: "PUT", torzs: { arculat }, sutik });
  }

  beforeAll(async () => {
    const email = veletlenEmail();
    const jelszo = "ProbaJelszo123!";
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Ördögh Árpád", email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    expect(b.statusz).toBe(200);
    sutik = b.sutik.join("; ");
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: "Kövesi Térkő és Burkolat Kft." }, sutik });
    expect(sz.statusz).toBe(201);
    szervezetId = sz.torzs.id;
    const pisz = await keres("/api/onboarding/piszkozat", {
      modszer: "PUT",
      sutik,
      torzs: {
        bemutatkozas: { nev: "Kövesi Térkő és Burkolat Kft.", osszefoglalo: "Térkövezés, szegélyezés és vízelvezetés Maros megyében — családi házaknak és önkormányzatoknak.", osszefoglalo_forras: "sajat", forras_tipus: "leiras", leiras: "Térkövezés Marosvásárhelyen és környékén, 2004 óta." },
        kommunikacio: { celkozonseg: "családi házak", celkozonseg_forras: "sajat", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
      },
    });
    expect(pisz.statusz).toBe(200);
    const j = await keres<unknown>("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik });
    expect(j.statusz).toBe(200);
    const profil = JovahagyasValasz.parse(j.torzs).profil;
    // tervezet → jóváhagyás (v1), ahogy a régi doboz teszi
    const t = await put(arculatModosit(profil.arculat, { elsodleges: "#2f5d50", masodlagos: "#c9a86a", hatter: "#f1ede4" }));
    expect(t.statusz).toBe(200);
    const tp = ProfilValasz.parse(t.torzs).profil!;
    const jv = await put(arculatJovahagy(tp.arculat));
    expect(jv.statusz).toBe(200);
    v1 = ProfilValasz.parse(jv.torzs).profil!.arculat;
    expect(v1.allapot).toBe("jovahagyott");
    expect(Object.keys(v1.verziok)).toEqual(["1"]);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("egy másik lapon született újabb jóváhagyás után a régi lap írása 409 ELAVULT_ADAT, és a v2 pillanatkép megmarad", async () => {
    // „másik lap”: módosít és jóváhagy → v2
    const nyit = await put(arculatModosit(v1, { elsodleges: "#1f3a5f" }));
    expect(nyit.statusz).toBe(200);
    const v2 = await put(arculatJovahagy(ProfilValasz.parse(nyit.torzs).profil!.arculat));
    expect(v2.statusz).toBe(200);
    // a „régi lap” még a v1-es állapotból ír (pl. a képvilágot szerkeszti)
    const regi = await put(arculatModosit(v1, { kepvilag: "Kész udvarok közelről" }));
    expect(regi.statusz).toBe(409);
    expect(HibaValasz.parse(regi.torzs).hiba).toBe("ELAVULT_ADAT");
    const most = await keres<unknown>("/api/profil", { sutik });
    const a = ProfilValasz.parse(most.torzs).profil!.arculat;
    expect(a.jovahagyott_verzio).toBe(2);
    expect(Object.keys(a.verziok).sort()).toEqual(["1", "2"]);
    expect(a.verziok["2"]?.elsodleges).toBe("#1f3a5f");
  });

  it("pillanatképet elhagyó vagy átíró beküldés: 200, de a tárolt pillanatképek érintetlenek (a kiszolgálóé nyer)", async () => {
    const a = ProfilValasz.parse((await keres<unknown>("/api/profil", { sutik })).torzs).profil!.arculat;
    const hamis: ArculatLepes = { ...a, verziok: { "2": { ...a.verziok["2"]!, elsodleges: "#000000" } } };
    const v = await put(hamis);
    expect(v.statusz).toBe(200);
    const uj = ProfilValasz.parse(v.torzs).profil!.arculat;
    expect(Object.keys(uj.verziok).sort()).toEqual(["1", "2"]);
    expect(uj.verziok["2"]?.elsodleges).toBe("#1f3a5f");
    // és az adatbázisban is
    const sor = await sql<{ adatok: { arculat: { verziok: Record<string, { elsodleges: string }> } } }>("SELECT adatok FROM szervezet_profil WHERE szervezet_id = $1", [szervezetId]);
    expect(Object.keys(sor[0]!.adatok.arculat.verziok).sort()).toEqual(["1", "2"]);
    expect(sor[0]!.adatok.arculat.verziok["2"]!.elsodleges).toBe("#1f3a5f");
  });

  it("a tervezet elvetése (a régi doboz „Elvetés”-e) nem elavult írás: 200", async () => {
    const a = ProfilValasz.parse((await keres<unknown>("/api/profil", { sutik })).torzs).profil!.arculat;
    const nyit = await put(arculatModosit(a, { kepvilag: "Próba" }));
    expect(nyit.statusz).toBe(200);
    const nyitott = ProfilValasz.parse(nyit.torzs).profil!.arculat;
    expect(nyitott.verzio).toBe(3);
    const elvet = await put(arculatTervezetElvet(nyitott));
    expect(elvet.statusz).toBe(200);
    const vissza = ProfilValasz.parse(elvet.torzs).profil!.arculat;
    expect(vissza.verzio).toBe(2);
    expect(vissza.allapot).toBe("jovahagyott");
    expect(Object.keys(vissza.verziok).sort()).toEqual(["1", "2"]);
  });
});
