// c30 F6 — the festival setup (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §2, §10 F6; docs/decisions/2026-10-17-c30-f6-fesztival-beallitas.md;
// drawings c30 D1 · D2 · D3 · D4 · D9a). Pure part: lepesekFor (a one-language company = today's five steps), the tightened festival
// regex („rendezvények” in a restaurant text does not fire), the date range read from a description, the AI's rendezveny answer normalised,
// the copy at approval (a person's own type answer, the machine's dates), the day labels. Live part (PROBA_CIM + DATABASE_URL; test AI):
// the review proposal gives a festival its type and dates; PUT /api/profil/rendezveny saves the event (editor; viewer 403; bad range 400).
import { describe, expect, it } from "vitest";
import { OnboardingPiszkozat } from "@rogton/contracts";
import { profilPiszkozatbol } from "@rogton/profile-core";
import { datumTartomany, fesztivalSzoveg, helyTerv, lepesekFor, rendezvenyJavaslat, tipusJavaslat } from "../profil/tipus-szabaly";
import { idoBe, idoszakCimke, napCimke, napCsoportok } from "../app/_kozos/c30-program-szabaly";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

describe("F6 pure: the steps", () => {
  it("lepesekFor: a one-language company sees exactly today's five steps; the language step only with 2+ languages; a festival gets dates + programme", () => {
    expect(lepesekFor("ceg", true, 1)).toEqual(["kinalat", "lista", "arak", "oldal", "temak"]);
    expect(lepesekFor("ceg", false, 1)).toEqual(["kinalat", "lista", "oldal", "temak"]);
    expect(lepesekFor("ceg", true, 2)).toEqual(["kinalat", "lista", "arak", "nyelvmod", "oldal", "temak"]);
    expect(lepesekFor("fesztival", false, 2)).toEqual(["rendezveny", "program", "nyelvmod", "oldal", "temak"]);
    expect(lepesekFor("fesztival", true, 1)).toEqual(["rendezveny", "program", "oldal", "temak"]); // a list never adds árak to a festival
  });
});

describe("F6 pure: the festival regex (tightened) and the event's dates", () => {
  it("a restaurant's „rendezvények”, „programok”, „nyitvatartási napok” do not fire; festival words, Zilele, „…i Napok”, „Napok 2026” do", () => {
    for (const x of [
      "Csillag Vendéglő — házias ételek, rendezvények, esküvők és céges vacsorák vállalása",
      "Étterem Szovátán: hétvégi programok, gyerekbarát rendezvényterem",
      "Nyitvatartási napok: hétfőtől péntekig, rendezvényekre előre foglalás",
      "Kovács Térkő Kft. — térkövezés",
      "Pizzeria Napoli — programul de lucru: zilnic 10–22",
    ]) expect(fesztivalSzoveg(x)).toBe(false);
    for (const x of ["Zilele Târgumureșene 2026", "Marosvásárhelyi Napok", "Szovátai Fesztivál", "Festivalul Medieval Sighișoara", "Városnapok Szovátán", "Nyárádmenti napok 2026", "Sovata Days 2026"]) expect(fesztivalSzoveg(x)).toBe(true);
    // the F1 regex fallback still turns the Zilele description into an unsure festival guess
    expect(tipusJavaslat({}, "Zilele Târgumureșene", "Marosvásárhelyi Napok — négy nap koncert").szervezet_tipus).toBe("fesztival");
  });

  it("datumTartomany: HU, RO, EN date ranges from a description; no range → nothing (never a guess)", () => {
    const v = { mettol: "2026-06-25", meddig: "2026-06-28" };
    expect(datumTartomany("Marosvásárhelyi Napok, június 25–28.", 2026)).toEqual(v);
    expect(datumTartomany("2026. június 25. és 28. között a belvárosban", 2026)).toEqual(v);
    expect(datumTartomany("Între 25 și 28 iunie, municipiul Târgu Mureș găzduiește", 2026)).toEqual(v);
    expect(datumTartomany("Program complet (25–28 iunie 2026)", 2025)).toEqual(v);
    expect(datumTartomany("June 25–28, downtown", 2026)).toEqual(v);
    expect(datumTartomany("négy nap koncert június végén", 2026)).toEqual({});
    expect(datumTartomany("június 28–25.", 2026)).toEqual({}); // backwards: not a range
    expect(datumTartomany("február 30–31.", 2026)).toEqual({});
  });

  it("rendezvenyJavaslat: the AI's dates and town (content languages only); bad dates → the text's range; nothing invented", () => {
    expect(rendezvenyJavaslat({ mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș", xx: "?" } }, "", 2026))
      .toEqual({ mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" } });
    expect(rendezvenyJavaslat({ mettol: "2026-06-31", meddig: "2026-06-28" }, "június 25–28.", 2026)).toEqual({ mettol: "2026-06-25", meddig: "2026-06-28" });
    expect(rendezvenyJavaslat(null, "Szovátai Fesztivál", 2026)).toEqual({});
  });

  it("helyTerv (Csilla 10-17): a new first-language town re-translates the second one only while it is the machine's; a person's is never overwritten", () => {
    const javaslat = { hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" } };
    // the machine's RO (from the proposal) → cleared and handed back for translation
    expect(helyTerv({ hu: "Szováta" }, undefined, javaslat, "hu", "ro")).toEqual({ hely: { hu: "Szováta" }, gep: { hu: "Marosvásárhely" }, forditani: { szoveg: "Szováta", cel: "ro" } });
    // the machine's last translation (hely_gep) is still the machine's
    expect(helyTerv({ hu: "Parajd", ro: "Sovata" }, { hely: { hu: "Szováta", ro: "Sovata" }, hely_gep: { ro: "Sovata" } }, javaslat, "hu", "ro").forditani).toEqual({ szoveg: "Parajd", cel: "ro" });
    // the person's RO stays, whether sent or only stored
    expect(helyTerv({ hu: "Szováta", ro: "Szováta (RO)" }, undefined, javaslat, "hu", "ro")).toEqual({ hely: { hu: "Szováta", ro: "Szováta (RO)" }, gep: javaslat.hely });
    expect(helyTerv({ hu: "Parajd" }, { hely: { hu: "Szováta", ro: "Szováta (RO)" } }, javaslat, "hu", "ro")).toEqual({ hely: { hu: "Parajd", ro: "Szováta (RO)" }, gep: javaslat.hely });
    // unchanged first town → nothing translated; one language → nothing else happens; empty first town → the machine's RO goes too
    expect(helyTerv({ hu: "Marosvásárhely" }, undefined, javaslat, "hu", "ro")).toEqual({ hely: javaslat.hely, gep: javaslat.hely });
    expect(helyTerv({ hu: "Szováta" }, undefined, javaslat, "hu", null)).toEqual({ hely: { hu: "Szováta" }, gep: javaslat.hely });
    expect(helyTerv({ hu: " " }, undefined, javaslat, "hu", "ro")).toEqual({ hely: {}, gep: { hu: "Marosvásárhely" } });
  });
});

const PISZKOZAT = (b: Record<string, unknown>) => OnboardingPiszkozat.parse({
  bemutatkozas: { nev: "Zilele Târgumureșene 2026", osszefoglalo: "Marosvásárhelyi Napok — Zilele Târgumureșene, június 25–28.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "x", ...b },
  kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
});
const FIOK = "00000000-0000-4000-8000-0000000000f6";

describe("F6 pure: the copy at approval", () => {
  it("a person's answer to the question (unsure machine) is stored as tipus_forras sajat; the festival's dates go to rendezveny_javaslat", () => {
    const r = profilPiszkozatbol(PISZKOZAT({ szervezet_tipus: "fesztival", kategoria: "semleges", tipus_biztos: false, tipus_sajat: true, rendezveny: { mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" } } }), FIOK);
    expect(r.ok && { t: r.profil.szervezet_tipus, f: r.profil.tipus_forras, j: r.profil.rendezveny_javaslat, r: r.profil.rendezveny }).toEqual({
      t: "fesztival", f: "sajat", j: { mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" } }, r: undefined,
    });
  });
  it("D13 / q30b: unsure and unanswered → nothing stored (= Cég); a company's own category choice is stored", () => {
    const nincs = profilPiszkozatbol(PISZKOZAT({ szervezet_tipus: "fesztival", kategoria: "semleges", tipus_biztos: false }), FIOK);
    expect(nincs.ok && ["szervezet_tipus", "tipus_forras", "rendezveny_javaslat"].filter((k) => k in nincs.profil)).toEqual([]);
    const ceg = profilPiszkozatbol(PISZKOZAT({ szervezet_tipus: "ceg", kategoria: "vendeglatas", tipus_biztos: false, tipus_sajat: true }), FIOK);
    expect(ceg.ok && { t: ceg.profil.szervezet_tipus, k: ceg.profil.kategoria, f: ceg.profil.tipus_forras }).toEqual({ t: "ceg", k: "vendeglatas", f: "sajat" });
  });
});

describe("F6 pure: day labels, grouping, times (D3 / D4)", () => {
  it("napCimke / idoszakCimke in HU, RO, EN; days in order, the whole-event group last, all-day first within a day; idoBe", () => {
    expect(napCimke("2026-06-25", "hu")).toBe("Csütörtök, jún. 25.");
    expect(napCimke("2026-06-25", "en")).toBe("Thursday, Jun 25");
    expect(napCimke("2026-06-25", "ro")).toMatch(/^Joi, 25 iun/);
    expect(idoszakCimke("2026-06-25", "2026-06-28", "hu")).toBe("jún. 25–28.");
    expect(idoszakCimke("2026-06-25", "2026-06-28", "en")).toBe("Jun 25–28");
    const t = (id: string, nap: string | null, kezdes: string | null) => ({ id, nap, kezdes, vege: null, nev: { hu: id }, leiras: {}, helyszin: {}, fellepo: "", fajta: "egyeb" as const, jegy: "", bizonytalan: false, aktiv: true, forras: "gep" as const, modositva: false, kep_fajl_id: null });
    const cs = napCsoportok([t("a", "2026-06-26", "20:00"), t("b", null, null), t("c", "2026-06-25", "19:00"), t("d", "2026-06-26", null)]);
    expect(cs.map((c) => [c.kulcs, c.tetelek.map((x) => x.id)])).toEqual([["2026-06-25", ["c"]], ["2026-06-26", ["d", "a"]], [null, ["b"]]]);
    expect(["21:00", "9.30", "", "–", "24:00", "21"].map(idoBe)).toEqual(["21:00", "09:30", null, null, undefined, undefined]);
  });
});

describe("F6 live: the review proposal and the event", () => {
  it("a festival description gets type + dates from the proposal; PUT /api/profil/rendezveny saves (bad range 400)", async () => {
    try {
      const jelszo = "ProbaJelszo123!", email = veletlenEmail();
      await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Moldovan-Szabó Réka", email, jelszo } });
      const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
      const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
      expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Zilele Târgumureșene 2026 — próba F6" }, sutik: s })).statusz).toBe(201);
      const o = "Marosvásárhelyi Napok — Zilele Târgumureșene: 2026. június 25. és 28. között koncertek, borutca és kézművesvásár.";
      await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: { bemutatkozas: { nev: "Zilele Târgumureșene 2026 — próba F6", osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o } } });
      const j = await keres<Record<string, unknown>>("/api/onboarding/javaslatok", { modszer: "POST", sutik: s });
      expect(j.statusz).toBe(200);
      expect([j.torzs["szervezet_tipus"], j.torzs["biztos"]]).toEqual(["fesztival", true]);
      expect(j.torzs["rendezveny"]).toEqual({ mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "[MINTA] Debrecen", ro: "[MINTA] Debrețin" } }); // G4: a teszt-AI mintahelye semleges (Debrecen) — a régi város nem maradhat a dobozban
      await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
        bemutatkozas: { nev: "Zilele Târgumureșene 2026 — próba F6", osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o, szervezet_tipus: "fesztival", kategoria: "semleges", tipus_biztos: true, rendezveny: j.torzs["rendezveny"] },
        kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
      } });
      expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
      const adatok = (await sql<{ a: Record<string, unknown> }>("SELECT p.adatok AS a FROM szervezet_profil p JOIN szervezet sz ON sz.id = p.szervezet_id WHERE sz.nev = $1", ["Zilele Târgumureșene 2026 — próba F6"]))[0]!.a;
      expect([adatok["szervezet_tipus"], adatok["tipus_forras"], (adatok["rendezveny_javaslat"] as { mettol?: string } | undefined)?.mettol]).toEqual(["fesztival", "ai", "2026-06-25"]);
      expect((await keres("/api/profil/rendezveny", { modszer: "PUT", sutik: s, torzs: { mettol: "2026-06-28", meddig: "2026-06-25" } })).statusz).toBe(400);
      // Csilla 10-17: the HU town changed and the RO town is still the machine's (the proposal) → re-translated (test AI: „[MINTA] …”)
      const g = await keres<{ rendezveny: { hely?: Record<string, string> } }>("/api/profil/rendezveny", { modszer: "PUT", sutik: s, torzs: { hely: { hu: "Marosvásárhely" } } });
      expect(g.statusz).toBe(200);
      expect(g.torzs.rendezveny.hely?.["hu"]).toBe("Marosvásárhely");
      expect(g.torzs.rendezveny.hely?.["ro"]).toMatch(/^\[MINTA\] /);
      expect(g.torzs.rendezveny.hely?.["ro"]).not.toBe("[MINTA] Târgu Mureș");
      const r = await keres<{ rendezveny: unknown }>("/api/profil/rendezveny", { modszer: "PUT", sutik: s, torzs: { mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" }, belepo: "  ingyenes " } });
      expect(r.statusz).toBe(200);
      expect(r.torzs.rendezveny).toEqual({ mettol: "2026-06-25", meddig: "2026-06-28", hely: { hu: "Marosvásárhely", ro: "Târgu Mureș" }, belepo: "ingyenes" });
      // the person's RO town is never overwritten when the HU town changes later
      const sz = await keres<{ rendezveny: { hely?: Record<string, string> } }>("/api/profil/rendezveny", { modszer: "PUT", sutik: s, torzs: { hely: { hu: "Szováta" } } });
      expect(sz.torzs.rendezveny.hely).toEqual({ hu: "Szováta", ro: "Târgu Mureș" });
    } finally {
      await takaritas(); await lezar();
    }
  });
});
