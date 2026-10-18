// c30 F4 — the image page follows the org's SECOND language (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §5 „Images (F4)”, §10 F4;
// docs/decisions/2026-10-17-c30-f4-kep-masodik-nyelv.md). Pure part: the translation target accepts any content language (kepCel), the
// saved image settings accept the new `masik {nyelv, ertek}` next to the old `ro`. Live part (PROBA_CIM + DATABASE_URL; test AI):
// Sovata [ro, de] → „Német változat is” / „Și varianta în germană”, German fields saved as masik.de and reopened the same; an old post with
// kep_beallitas.ro reopens with its Romanian fields; a one-language company has no toggle; a [hu, ro] company keeps „Román változat is”.
// The browser part (egyben: the toggle starts ON, „Mindkettő” → two files -ro.png and -de.png) runs in the screenshot harness (needs the
// képgyártó), see the decision doc.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { VAN_NYELVVALASZTAS } from "@rogton/design-system";
import { PosztForras, TARTALOMNYELVEK, type PosztMunka } from "@rogton/contracts";
import { kepCel } from "../vizual/melle";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

describe("F4 pure: any content language for the image's second language", () => {
  it("kepCel: every content language passes (de, sk, …); unknown or missing → ro (the old default)", () => {
    for (const n of TARTALOMNYELVEK) expect(kepCel(n)).toBe(n);
    expect(kepCel("de")).toBe("de");
    expect(kepCel(undefined)).toBe("ro");
    expect(kepCel("xx")).toBe("ro");
    expect(kepCel(7)).toBe("ro");
  });

  it("kep_beallitas: the old `ro` still parses unchanged; the new `masik {nyelv, ertek}` parses; a bad language is refused", () => {
    const regi = { helyzet: "esemeny", ertek: { cim: "Nyílt nap" }, valtozat: "vilagos", meret: "poszt", ro: { cim: "Zi deschisă" } };
    expect(PosztForras.shape.kep_beallitas.parse(regi)).toEqual(regi);
    const uj = { helyzet: "esemeny", ertek: { cim: "Zi deschisă" }, valtozat: "vilagos", meret: "poszt", masik: { nyelv: "de", ertek: { cim: "Tag der offenen Tür" } } };
    expect(PosztForras.shape.kep_beallitas.parse(uj)).toEqual(uj);
    expect(PosztForras.shape.kep_beallitas.safeParse({ ...uj, masik: { nyelv: "xx", ertek: {} } }).success).toBe(false);
  });
});

async function szervezet(nev: string, fiokNev: string, nyelvek: string[]): Promise<string> {
  const jelszo = "ProbaJelszo123!";
  const email = veletlenEmail();
  await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: fiokNev, email, jelszo } });
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev }, sutik: s })).statusz).toBe(201);
  const o = "Családi panzió a Medve-tó mellett, 12 szoba, házi reggeli, szauna.";
  expect((await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
    bemutatkozas: { nev, osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o },
    kommunikacio: { celkozonseg: "családok és turisták", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek, nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: nyelvek[0], hangnem_forras: "sajat" },
  } })).statusz).toBe(200);
  expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
  return s;
}
async function poszt(s: string, nyelv: string, cim: string): Promise<string> {
  const r = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: s, torzs: { forras: { tipus: "sajat", azonosito: "", cim, url: "", szoveg: cim }, cim, felulet: "fb", nyelv, uj: true } });
  expect(r.statusz).toBe(200);
  return r.torzs.munka.id;
}
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
async function kepPoszthoz(s: string, id: string, beall: unknown): Promise<void> {
  const v = await fetch(`${PROBA_CIM}/api/r15/kep`, { method: "POST", body: PNG, headers: { cookie: `${s}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent("kép.png"), "x-poszt": id, "x-kep-beallitas": encodeURIComponent(JSON.stringify(beall)) } });
  expect(v.status).toBe(201);
}
// the page ships every label to the browser (the label dictionary), so a test looks at the RENDERED markup only: the toggle row's text span
// and its class attribute — not at any occurrence of a string in the HTML
const kapcsolo = (felirat: string) => `<span>${felirat}</span>`;
const fej = (felirat: string) => `km-vz2-kerdes-cimke">${felirat}</span>`;
const SOR = 'class="km-vz2-ro"';
const html = async (ut: string, s: string, ui = "hu") => (await fetch(`${PROBA_CIM}${ut}`, { headers: { cookie: `${s}; km_nyelv=${ui}` } })).text();
const beallitas = async (id: string) => (await sql<{ b: unknown }>("SELECT forras->'kep_beallitas' AS b FROM poszt_munka WHERE id = $1", [id]))[0]!.b;

describe("F4 live: the image page and the second language", () => {
  let sovata = "", egy = "", huro = "";
  beforeAll(async () => {
    sovata = await szervezet("Pensiunea Ștefănescu, Sovata — próba F4", "Ștefănescu Ioana-Mária", ["ro", "de"]);
    egy = await szervezet("Kovács Térkő Kft., Marosvásárhely — próba F4", "Kovács-Szentgyörgyi Tibor", ["hu"]);
    huro = await szervezet("Zilele Târgumureșene — próba F4", "Moldovan-Szabó Réka", ["hu", "ro"]);
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("Sovata [ro, de]: the toggle names German (HU and RO UI); no „Román változat is”", async () => {
    const hu = await html("/kepek/uj/esemeny", sovata, "hu");
    expect(hu).toContain(kapcsolo("Német változat is"));
    expect(hu).not.toContain(kapcsolo("Román változat is"));
    // RO felület: csak több felületi nyelvnél — G3 (Rögtön, 2026-10-18): a felület csak magyar (FELULETI_NYELVEK = ['hu']); ez a többnyelvű FELÜLET viselkedése, amely csak több felületi nyelvnél él. A magyar-only viselkedést a g3-csak-magyar.proba.ts őrzi.
    if (VAN_NYELVVALASZTAS) {
      const ro = await html("/kepek/uj/esemeny", sovata, "ro");
      expect(ro).toContain(kapcsolo("Și varianta în germană"));
      expect(ro).not.toContain(kapcsolo("Și varianta în română"));
    }
    // the image text is translated to German through the same call the page makes
    const f = await keres<{ mezok: Record<string, string> }>("/api/vizual/fordit", { modszer: "POST", sutik: sovata, torzs: { mezok: { cim: "Saună nouă lângă Lacul Ursu", hol: "Sovata, str. Trandafirilor 12" }, cel: "de" } });
    expect(f.statusz).toBe(200);
    expect(Object.keys(f.torzs.mezok).sort()).toEqual(["cim", "hol"]);
  });

  it("Sovata: German fields are saved as masik {de} and „Kép szerkesztése” reopens them (Németül, the German text)", async () => {
    const id = await poszt(sovata, "ro", "Saună nouă lângă Lacul Ursu");
    const beall = { helyzet: "esemeny", ertek: { cim: "Saună nouă", hol: "Sovata", mikor: "sâmbătă, 10:00" }, valtozat: "vilagos", meret: "poszt", masik: { nyelv: "de", ertek: { cim: "Neue Sauna am Bärensee", hol: "Sovata", mikor: "Samstag, 10 Uhr" } } };
    await kepPoszthoz(sovata, id, beall);
    expect(await beallitas(id)).toMatchObject(beall);
    const h = await html(`/kepek/uj/esemeny?poszt=${id}&szerk=1`, sovata);
    expect(h).toContain("Neue Sauna am Bärensee");
    expect(h).toContain(fej("Németül"));
    expect(h).toContain(kapcsolo("Német változat is"));
  });

  it("an old post with kep_beallitas.ro reopens exactly the same: Romanian fields, „Románul”, „Román változat is”", async () => {
    const id = await poszt(huro, "hu", "Kökény Attila vasárnap a Győzelem téren");
    const regi = { helyzet: "esemeny", ertek: { cim: "Kökény Attila vasárnap", hol: "Győzelem tér", mikor: "vasárnap 20:00" }, valtozat: "vilagos", meret: "poszt", ro: { cim: "Kökény Attila duminică", hol: "Piața Victoriei", mikor: "duminică, 20:00" } };
    await kepPoszthoz(huro, id, regi);
    expect(await beallitas(id)).toEqual(regi); // stored exactly as sent: nothing rewrites `ro` into `masik`
    const h = await html(`/kepek/uj/esemeny?poszt=${id}&szerk=1`, huro);
    expect(h).toContain("Kökény Attila duminică");
    expect(h).toContain("Piața Victoriei");
    expect(h).toContain(fej("Románul"));
    expect(h).toContain(kapcsolo("Román változat is"));
    // and in a [ro, de] org an old Romanian save still opens Romanian (the saved language wins over today's second language)
    const id2 = await poszt(sovata, "ro", "Mic dejun de casă");
    await kepPoszthoz(sovata, id2, { ...regi, ertek: { cim: "Mic dejun de casă" }, ro: { cim: "Mic dejun de casă — RO" } });
    const h2 = await html(`/kepek/uj/esemeny?poszt=${id2}&szerk=1`, sovata);
    expect(h2).toContain("Mic dejun de casă — RO");
    expect(h2).toContain(kapcsolo("Román változat is"));
    expect(h2).not.toContain(kapcsolo("Német változat is"));
  });

  it("a one-language company has no toggle (no dead control); a [hu, ro] company keeps „Román változat is” literally", async () => {
    const e = await html("/kepek/uj/esemeny", egy);
    expect(e).not.toContain(SOR);
    expect(e).not.toContain(kapcsolo("Román változat is"));
    const h = await html("/kepek/uj/esemeny", huro);
    expect(h).toContain(kapcsolo("Román változat is"));
    expect(h).toContain(SOR);
    // RO / EN felület: csak több felületi nyelvnél — G3 (Rögtön, 2026-10-18): a felület csak magyar (FELULETI_NYELVEK = ['hu']); ez a többnyelvű FELÜLET viselkedése, amely csak több felületi nyelvnél él. A magyar-only viselkedést a g3-csak-magyar.proba.ts őrzi.
    if (VAN_NYELVVALASZTAS) {
      expect(await html("/kepek/uj/esemeny", huro, "ro")).toContain(kapcsolo("Și varianta în română"));
      expect(await html("/kepek/uj/esemeny", huro, "en")).toContain(kapcsolo("Romanian version too"));
    }
  });
});
