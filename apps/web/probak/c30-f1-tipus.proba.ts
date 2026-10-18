// c30 F1 — organisation type + category (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.2, §2 Part A, §3, §10 F1;
// docs/decisions/2026-10-17-c30-f1-tipus-kategoria.md). No screen change.
// Pure part: the normalisers and the single category list, `kategoriaOf` = the old regex for every org without a stored category
// (same list title, same fallback topics), the AI guess → draft → profile copy (only when sure), the confirmed category for the
// sample photo. Live part (PROBA_CIM + DATABASE_URL; test AI, which returns no type keys → the regex fallback): the javaslatok
// answer carries the guess; a sure draft is copied at approval, an unsure one is not; re-approval keeps an earlier category.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { JavaslatokValasz, KATEGORIAK, OnboardingPiszkozat, SZERVEZET_TIPUSOK, kategoria, szervezetTipus, type KinalatSor } from "@km/contracts";
import { profilPiszkozatbol, profilTureloOlvas } from "@km/profile-core";
import { temaTartalek, vendeglato } from "../profil/kinalat-szabaly";
import { fesztivalSzoveg, kategoriaOf, tipusJavaslat, tipusOf } from "../profil/tipus-szabaly";
import { MINTA_KATEGORIAK, kepKategoria, mintaKategoria } from "../vizual/minta-kategoria";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const FIOK = "00000000-0000-4000-8000-0000000000f1";
/** Every hospitality/non-hospitality text the existing tests and fixtures use, plus realistic HU/RO ones. */
const SZOVEGEK: [string, string][] = [
  ["Csillag Vendéglő", "Csillag Vendéglő, házias ételek Szovátán"],
  ["Restaurant Ardelean", "Restaurant cu specific ardelenesc în Târgu Mureș"],
  ["Főtér Kávézó", "Kávézó és cukrászda a főtéren"],
  ["Cipó Pékség", "Pékség, kovászos kenyér, kalács és pogácsa Marosvásárhelyen, a Kossuth utcában."],
  ["Pensiunea Ștefănescu, Sovata", "Családi panzió a Medve-tó mellett, Szovátán: 12 szoba, házi reggeli, szauna."],
  ["Murok Bistro", "Bistro & catering, meniul zilei, Piața Trandafirilor"],
  ["Kő és Kert Térkövező Kft., Marosvásárhely", "Kő és Kert Térkövező Kft. — díszburkolat, kertépítés"],
  ["Kovács Térkő Kft.", "Kovács Térkő Kft. — térkövezés"],
  ["Șandor & Fiii SRL", "Transport persoane și marfă, microbuze, Târgu Mureș – Sovata"],
  ["Szépség Szalon Ildikó", "Fodrászat, kozmetika és manikűr Marosvásárhelyen, a Bolyai téren."],
];
const KINALAT: KinalatSor[] = [{ nev: "Díszburkolat, térkő lerakása", reszlet: "udvar, kocsibeálló", ar: "85 lej/m²-től", aktiv: true }];
const ZILELE = ["Zilele Târgumureșene 2026 — Marosvásárhelyi Napok", "Fesztivál június 25–28. között: koncertek a Győzelem téren, Középkori Vár, Színház tér – Borsétány; programul complet pe site."] as const;
const KOVACS = ["Kovács Térkő Kft.", "Kovács Térkő Kft. — térkövezés, díszburkolat, szegélyezés Marosvásárhelyen és környékén."] as const;

/** A valid draft (as the client stores it after the review page). */
function piszkozat(nev: string, osszefoglalo: string, tipus?: { szervezet_tipus?: string; kategoria?: string; tipus_biztos?: boolean }) {
  return OnboardingPiszkozat.parse({
    bemutatkozas: { nev, osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: osszefoglalo, ...tipus },
    kommunikacio: { celkozonseg: "a környék lakói, családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
  });
}

describe("F1 pure: lists, normalisers, kategoriaOf = the old regex, the guess, the copy, the sample photo", () => {
  it("one category list: contracts = web re-export = image maker = the javaslatok prompt; the normalisers", () => {
    expect([...MINTA_KATEGORIAK]).toEqual([...KATEGORIAK]);
    const kepgyar = readFileSync(new URL("../../kepgyar/src/minta-foto.ts", import.meta.url), "utf8");
    const sor = kepgyar.match(/export const MINTA_KATEGORIAK = \[([^\]]*)\]/)?.[1] ?? "";
    // c30 F11 (plan §1.2): the image maker's list gained `rendezveny`, the festival's sample photo — not a company category (the company
    // chooser and the prompts keep KATEGORIAK), so the image maker is now compared with the photo list = KATEGORIAK + rendezveny
    expect(sor.split(",").map((s) => s.trim().replace(/"/g, ""))).toEqual([...KATEGORIAK, "rendezveny"]);
    const prompt = readFileSync(new URL("../prompts/javaslatok.hu.md", import.meta.url), "utf8");
    // c30 F6: the prompt became v3 (+ the festival's `rendezveny`); the F1 type/category rules below are unchanged, so only the number moved
    expect(prompt).toMatch(/javaslatok a 2\. lépéshez · v3 .*· v2: c30 F1/);
    for (const k of KATEGORIAK) expect(prompt).toContain(`- ${k} — `);
    for (const t of SZERVEZET_TIPUSOK) expect(prompt).toContain(`"${t}"`);
    expect(szervezetTipus(" fesztival ")).toBe("fesztival");
    for (const x of [undefined, null, 42, "Fesztivál", "FESZTIVAL", "egyesulet", ""]) expect(szervezetTipus(x)).toBe("ceg"); // D13
    expect(kategoria("epites")).toBe("epites");
    for (const x of [undefined, 7, "Építőipar", "rendezveny", " "]) expect(kategoria(x)).toBe("semleges"); // rendezveny = F11, not yet
    expect(mintaKategoria(" vendeglatas ")).toBe("vendeglatas"); // c15 behaviour unchanged
  });

  it("every existing hospitality fixture: kategoriaOf gives the same list title and the same fallback topics as the old regex", () => {
    for (const [nev, osszefoglalo] of SZOVEGEK) {
      const regi = vendeglato(`${nev} ${osszefoglalo}`);
      const kat = kategoriaOf({ nev, osszefoglalo });
      expect(kat === "vendeglatas", `${nev}`).toBe(regi); // the list title (Beallitas: „Van étlapod?” vs „…szolgáltatás-listád?”)
      for (const nyelv of ["hu", "ro", "en", "de"]) {
        expect(temaTartalek(KINALAT, kat, nyelv), `${nev} ${nyelv}`).toEqual(temaTartalek(KINALAT, regi, nyelv));
      }
    }
    expect(SZOVEGEK.filter(([n, o]) => vendeglato(`${n} ${o}`)).length).toBe(6); // the fixture really has both kinds
  });

  it("TARTALEK by category: hospitality keeps its set, every other company category the general set (word for word)", () => {
    const vend = temaTartalek([], true, "hu"), mas = temaTartalek([], false, "hu");
    expect(vend[0]).toEqual({ tema: "Napi / heti menü", tipus: "picmess" });
    expect(mas[0]).toEqual({ tema: "Munkáink — kész munkák, előtte–utána", tipus: "album" });
    expect(temaTartalek([], "vendeglatas", "hu")).toEqual(vend);
    for (const k of [...KATEGORIAK.filter((k) => k !== "vendeglatas"), "semleges"] as const) expect(temaTartalek([], k, "hu")).toEqual(mas);
    expect(temaTartalek([], "vendeglatas", "ro")[0]).toEqual({ tema: "Meniul zilei / săptămânii", tipus: "picmess" });
  });

  it("a stored category wins over the regex; a garbage stored value falls back to the regex; type default = ceg", () => {
    expect(kategoriaOf({ nev: "Cipó Pékség", osszefoglalo: "Pékség", kategoria: "bolt" })).toBe("bolt");
    expect(kategoriaOf({ nev: "Cipó Pékség", osszefoglalo: "Pékség", kategoria: "Vendéglátás" })).toBe("vendeglatas");
    expect(kategoriaOf({ nev: "Kovács Térkő Kft.", osszefoglalo: "térkövezés", kategoria: 42 })).toBe("semleges");
    expect(tipusOf({})).toBe("ceg");
    expect(tipusOf({ szervezet_tipus: "fesztival" })).toBe("fesztival");
  });

  it("the guess: the Zilele description → fesztival; „Kovács Térkő Kft. — térkövezés” → epites (from the AI's answer)", () => {
    // no AI type keys (the test connector, an old model, AI off): the regex fallback, never sure
    expect(tipusJavaslat({}, ...ZILELE)).toEqual({ szervezet_tipus: "fesztival", kategoria: "semleges", biztos: false });
    expect(tipusJavaslat(null, ...KOVACS)).toEqual({ szervezet_tipus: "ceg", kategoria: "semleges", biztos: false });
    expect(tipusJavaslat({}, "Csillag Vendéglő", "házias ételek Szovátán")).toEqual({ szervezet_tipus: "ceg", kategoria: "vendeglatas", biztos: false });
    expect(fesztivalSzoveg("Kovács Térkő Kft. — térkövezés")).toBe(false);
    expect(fesztivalSzoveg("Zilele Târgumureșene")).toBe(true);
    // the AI's own answer
    expect(tipusJavaslat({ szervezet_tipus: "ceg", kategoria: "epites", biztos: true }, ...KOVACS)).toEqual({ szervezet_tipus: "ceg", kategoria: "epites", biztos: true });
    expect(tipusJavaslat({ szervezet_tipus: "fesztival", kategoria: "semleges", biztos: true }, ...ZILELE)).toEqual({ szervezet_tipus: "fesztival", kategoria: "semleges", biztos: true });
    // unusable answers are never "sure"
    expect(tipusJavaslat({ szervezet_tipus: "Cég", kategoria: "Építőipar", biztos: "true" }, ...KOVACS)).toEqual({ szervezet_tipus: "ceg", kategoria: "semleges", biztos: false });
    expect(tipusJavaslat({ szervezet_tipus: "ceg", kategoria: "pekseg", biztos: true }, "Cipó Pékség", "kovászos kenyér")).toEqual({ szervezet_tipus: "ceg", kategoria: "vendeglatas", biztos: false });
    expect(tipusJavaslat({ szervezet_tipus: "ceg", kategoria: "epites" }, ...KOVACS).biztos).toBe(false);
  });

  it("the copy at approval: a sure guess is stored (type + company category, tipus_forras ai); an unsure one stores nothing", () => {
    const biztos = profilPiszkozatbol(piszkozat(...KOVACS, { szervezet_tipus: "ceg", kategoria: "epites", tipus_biztos: true }), FIOK);
    expect(biztos.ok && { t: biztos.profil.szervezet_tipus, k: biztos.profil.kategoria, f: biztos.profil.tipus_forras }).toEqual({ t: "ceg", k: "epites", f: "ai" });
    const fesztival = profilPiszkozatbol(piszkozat(...ZILELE, { szervezet_tipus: "fesztival", kategoria: "bolt", tipus_biztos: true }), FIOK);
    expect(fesztival.ok && { t: fesztival.profil.szervezet_tipus, k: fesztival.profil.kategoria }).toEqual({ t: "fesztival", k: undefined });
    const bizonytalan = profilPiszkozatbol(piszkozat(...ZILELE, { szervezet_tipus: "fesztival", kategoria: "semleges", tipus_biztos: false }), FIOK);
    expect(bizonytalan.ok && ["szervezet_tipus", "kategoria", "tipus_forras"].filter((k) => k in bizonytalan.profil)).toEqual([]);
    const regi = profilPiszkozatbol(piszkozat(...KOVACS), FIOK); // a draft from before F1
    expect(regi.ok && ["szervezet_tipus", "kategoria", "tipus_forras"].filter((k) => k in regi.profil)).toEqual([]);
    // the stored profile with the new fields reads cleanly (F0 tolerant reader: nothing left out)
    const olv = profilTureloOlvas(biztos.ok ? biztos.profil : null);
    expect(olv.ok && olv.kihagyott).toEqual([]);
    expect(olv.ok && kategoriaOf(olv.profil)).toBe("epites");
    expect(olv.ok && temaTartalek(KINALAT, kategoriaOf(olv.profil), "hu")).toEqual(temaTartalek(KINALAT, false, "hu"));
  });

  it("the sample photo: a confirmed category wins over the AI's pick; without one, the AI's pick (c15)", () => {
    expect(kepKategoria("epites", "bolt")).toBe("epites");
    expect(kepKategoria(undefined, "bolt")).toBe("bolt");
    expect(kepKategoria("semleges", "kert")).toBe("kert");
    expect(kepKategoria("Építőipar", "ismeretlen")).toBe("semleges");
  });

  it("the review-proposal answer contract accepts the guess and stays valid without it (older answers)", () => {
    const alap = { celkozonseg: "x", cel: "y", hangnem_leiras: "z", hangnem_minta: "w", nyelvek: ["hu"], tartalomnyelv: "hu", forras: "teszt" };
    expect(JavaslatokValasz.safeParse(alap).success).toBe(true);
    expect(JavaslatokValasz.safeParse({ ...alap, szervezet_tipus: "fesztival", kategoria: "semleges", biztos: false }).success).toBe(true);
  });
});

describe("F1 live: the guess in the javaslatok answer, the draft → profile copy, re-approval", () => {
  const jelszo = "ProbaJelszo123!";
  const belep = async (nev: string, szervezet: string) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s });
    expect(sz.statusz).toBe(201);
    return { s, id: sz.torzs.id };
  };
  const tarolt = async (id: string) => (await sql<{ adatok: Record<string, unknown> }>("SELECT adatok FROM szervezet_profil WHERE szervezet_id = $1", [id]))[0]!.adatok;
  const piszkozatPut = (s: string, p: ReturnType<typeof piszkozat>) => keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: p });
  let zilele = { s: "", id: "" };
  let kovacs = { s: "", id: "" };
  let csillag = { s: "", id: "" };

  beforeAll(async () => {
    zilele = await belep("Moldovan-Szabó Réka", "Zilele Târgumureșene 2026 — próba F1");
    kovacs = await belep("Kovács-Szentgyörgyi Tibor", "Kovács Térkő Kft. — próba F1");
    csillag = await belep("Csillag Anna-Mária", "Csillag Vendéglő, Szováta — próba F1");
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  // c30 F6: the test connector now answers the type keys itself (festival words → fesztival; „térkő” → epites; sure), so the D1 line
  // and question can be exercised end to end. The regex fallback (no AI keys → never sure) stays covered by the pure test above.
  it("the javaslatok answer carries the guess (test AI answers the type keys since F6)", async () => {
    expect((await piszkozatPut(zilele.s, piszkozat(...ZILELE))).statusz).toBe(200);
    const z = await keres<unknown>("/api/onboarding/javaslatok", { modszer: "POST", torzs: {}, sutik: zilele.s });
    expect(z.statusz).toBe(200);
    expect(JavaslatokValasz.parse(z.torzs)).toMatchObject({ szervezet_tipus: "fesztival", kategoria: "semleges", biztos: true });
    expect((await piszkozatPut(kovacs.s, piszkozat(...KOVACS))).statusz).toBe(200);
    const k = await keres<unknown>("/api/onboarding/javaslatok", { modszer: "POST", torzs: {}, sutik: kovacs.s });
    expect(JavaslatokValasz.parse(k.torzs)).toMatchObject({ szervezet_tipus: "ceg", kategoria: "epites", biztos: true });
  });

  it("the draft keeps the guess; a sure one is copied at approval, an unsure one is not (D13 → ceg when read)", async () => {
    expect((await piszkozatPut(kovacs.s, piszkozat(...KOVACS, { szervezet_tipus: "ceg", kategoria: "epites", tipus_biztos: true }))).statusz).toBe(200);
    const g = await keres<{ piszkozat: { bemutatkozas: Record<string, unknown> } }>("/api/onboarding/piszkozat", { sutik: kovacs.s });
    expect(g.torzs.piszkozat.bemutatkozas).toMatchObject({ szervezet_tipus: "ceg", kategoria: "epites", tipus_biztos: true });
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: kovacs.s })).statusz).toBe(200);
    expect(await tarolt(kovacs.id)).toMatchObject({ szervezet_tipus: "ceg", kategoria: "epites", tipus_forras: "ai" });

    expect((await piszkozatPut(zilele.s, piszkozat(...ZILELE, { szervezet_tipus: "fesztival", kategoria: "semleges", tipus_biztos: false }))).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: zilele.s })).statusz).toBe(200);
    const z = await tarolt(zilele.id);
    expect(["szervezet_tipus", "kategoria", "tipus_forras"].filter((k) => k in z)).toEqual([]);
    expect(tipusOf(z)).toBe("ceg");
  });

  it("a hospitality org without a stored category: the setup still asks for the menu (the old regex answer)", async () => {
    expect((await piszkozatPut(csillag.s, piszkozat("Csillag Vendéglő, Szováta — próba F1", "Csillag Vendéglő, házias ételek Szovátán, a Medve-tó mellett."))).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: csillag.s })).statusz).toBe(200);
    expect("kategoria" in (await tarolt(csillag.id))).toBe(false);
    const o = await keres<{ vendeglato: boolean }>("/api/onboarding/beallitas/olvas", { modszer: "POST", torzs: {}, sutik: csillag.s });
    expect(o.statusz).toBe(200);
    expect(o.torzs.vendeglato).toBe(true);
    const k = await keres<{ vendeglato: boolean }>("/api/onboarding/beallitas/olvas", { modszer: "POST", torzs: {}, sutik: kovacs.s });
    expect(k.torzs.vendeglato).toBe(false);
  });

  it("re-approval with an unsure draft keeps the earlier confirmed category (F0: previous profile first)", async () => {
    expect((await piszkozatPut(kovacs.s, piszkozat(...KOVACS, { szervezet_tipus: "ceg", kategoria: "semleges", tipus_biztos: false }))).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: kovacs.s })).statusz).toBe(200);
    expect(await tarolt(kovacs.id)).toMatchObject({ szervezet_tipus: "ceg", kategoria: "epites", tipus_forras: "ai" });
  });
});
