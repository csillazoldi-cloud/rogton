// c30 F2 — post language mode + second language + the „Más nyelven” menu (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.3, §5, §10 F2;
// docs/decisions/2026-10-17-c30-f2-nyelvmod.md). The default equals today's behaviour; nothing writes the mode yet (F3).
// Pure part: nyelvMod defaults for 0/1/2/3 languages and stored values, masodikNyelv, the menu union (Sovata [ro, de] adds German),
// the tolerant read of a bad stored mode. Live part (PROBA_CIM + DATABASE_URL; test AI): a [ro, de] org gets a German cell
// through the same „Más nyelven” call the page makes.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POSZT_NYELV_MODOK, PosztMunka, SzervezetProfil } from "@km/contracts";
import { masNyelvenLista, masodikNyelv, nyelvMod, profilMezokEllenoriz, profilTureloOlvas } from "@km/profile-core";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const ALAP = {
  nev: "Pensiunea Ștefănescu, Sovata", osszefoglalo: "Pensiune de familie lângă Lacul Ursu, 12 camere, mic dejun de casă, saună.",
  osszefoglalo_forras: "ai", celkozonseg: "familii și turiști din Germania și Austria", celkozonseg_forras: "ai", cel: "", cel_forras: "",
  nyelvek: ["ro", "de"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "", hangnem_forras: "",
  arculat: { allapot: "nincs", tervezet: null, verzio: 1, jovahagyott_verzio: null, verziok: {} }, kesobbre: ["cel", "hangnem", "arculat"],
  jovahagyva: "2026-10-17T09:00:00.000Z", jovahagyta: "00000000-0000-4000-8000-0000000000f2",
};

describe("F2 pure: mode, second language, the „Más nyelven” menu", () => {
  it("nyelvMod defaults = today: 0 or 1 language → egy; 2 or 3 → kulon (each language its own post)", () => {
    expect(nyelvMod(null)).toBe("egy");
    expect(nyelvMod({ nyelvek: [] })).toBe("egy");
    expect(nyelvMod({ nyelvek: ["hu"] })).toBe("egy");
    expect(nyelvMod({ nyelvek: ["hu", "ro"] })).toBe("kulon");
    expect(nyelvMod({ nyelvek: ["ro", "hu", "en"] })).toBe("kulon");
    expect(nyelvMod({ nyelvek: ["ro", "de"] })).toBe("kulon");
  });

  it("a stored mode is used when known; unknown/garbage → the default; one language is always egy", () => {
    for (const m of POSZT_NYELV_MODOK) expect(nyelvMod({ nyelvek: ["hu", "ro"], poszt_nyelv_mod: m })).toBe(m);
    expect(nyelvMod({ nyelvek: ["hu", "ro"], poszt_nyelv_mod: " egyben " })).toBe("egyben");
    for (const x of ["Egyben", "ketnyelvu", 2, null, ""]) expect(nyelvMod({ nyelvek: ["hu", "ro"], poszt_nyelv_mod: x })).toBe("kulon");
    expect(nyelvMod({ nyelvek: ["hu"], poszt_nyelv_mod: "egyben" })).toBe("egy"); // nothing to pair
  });

  it("masodikNyelv = nyelvek[1]: the order of nyelvek is the order of a joined post; nothing is hard-coded to RO", () => {
    expect(masodikNyelv({ nyelvek: ["hu"] })).toBeNull();
    expect(masodikNyelv({ nyelvek: [] })).toBeNull();
    expect(masodikNyelv(undefined)).toBeNull();
    expect(masodikNyelv({ nyelvek: ["hu", "ro"] })).toBe("ro");
    expect(masodikNyelv({ nyelvek: ["ro", "hu"] })).toBe("hu"); // RO-first org (e.g. a city hall)
    expect(masodikNyelv({ nyelvek: ["ro", "de"] })).toBe("de"); // Sovata guesthouse
    expect(masodikNyelv({ nyelvek: ["hu", "xx"] })).toBeNull();
  });

  it("the „Más nyelven” menu: hu, ro, en always (as today) + every other profile language; Sovata [ro, de] adds de", () => {
    expect(masNyelvenLista([])).toEqual(["hu", "ro", "en"]);
    expect(masNyelvenLista(undefined)).toEqual(["hu", "ro", "en"]);
    expect(masNyelvenLista(["hu"])).toEqual(["hu", "ro", "en"]);
    expect(masNyelvenLista(["hu", "ro"])).toEqual(["hu", "ro", "en"]);
    expect(masNyelvenLista(["ro", "hu", "en"])).toEqual(["hu", "ro", "en"]);
    expect(masNyelvenLista(["ro", "de"])).toEqual(["hu", "ro", "en", "de"]);
    expect(masNyelvenLista(["hu", "de", "sk", "de", "xx", 7])).toEqual(["hu", "ro", "en", "de", "sk"]);
  });

  it("the stored mode is a plain string: a bad value is left out on read (F0) and the default applies; the merge patch accepts it", () => {
    const jo = profilTureloOlvas({ ...ALAP, poszt_nyelv_mod: "egyben" });
    expect(jo.ok && jo.kihagyott).toEqual([]);
    expect(jo.ok && nyelvMod(jo.profil)).toBe("egyben");
    const rossz = profilTureloOlvas({ ...ALAP, poszt_nyelv_mod: 42 });
    expect(rossz.ok && rossz.kihagyott).toEqual(["poszt_nyelv_mod"]);
    expect(rossz.ok && nyelvMod(rossz.profil)).toBe("kulon");
    expect(SzervezetProfil.parse({ ...ALAP, poszt_nyelv_mod: "ismeretlen" }).poszt_nyelv_mod).toBe("ismeretlen"); // stored as is, read as kulon
    expect(profilMezokEllenoriz({ poszt_nyelv_mod: "egyben" })).toEqual({ ok: true, patch: { poszt_nyelv_mod: "egyben" } });
  });
});

describe("F2 live: a [ro, de] org's German post through the „Más nyelven” call", () => {
  const jelszo = "ProbaJelszo123!";
  let s = "";
  beforeAll(async () => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Ștefănescu Ioana-Mária", email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Pensiunea Ștefănescu, Sovata — próba F2" }, sutik: s })).statusz).toBe(201);
    expect((await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev: "Pensiunea Ștefănescu, Sovata — próba F2", osszefoglalo: ALAP.osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: ALAP.osszefoglalo },
      kommunikacio: { celkozonseg: ALAP.celkozonseg, celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["ro", "de"], nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "ro", hangnem_forras: "sajat" },
    } })).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("the stored profile has no mode (default kulon), and a German cell is written next to the Romanian one", async () => {
    const adatok = (await sql<{ adatok: Record<string, unknown> }>("SELECT p.adatok FROM szervezet_profil p JOIN szervezet sz ON sz.id = p.szervezet_id WHERE sz.nev = $1", ["Pensiunea Ștefănescu, Sovata — próba F2"]))[0]!.adatok;
    expect("poszt_nyelv_mod" in adatok).toBe(false);
    expect(nyelvMod(adatok as { nyelvek: string[] })).toBe("kulon");
    expect(masodikNyelv(adatok as { nyelvek: string[] })).toBe("de");
    const uj = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: s, torzs: {
      forras: { tipus: "sajat", azonosito: "", cim: "Saună nouă", url: "", szoveg: "Am deschis sauna nouă lângă Lacul Ursu, Sovata." },
      cim: "Saună nouă", felulet: "fb", nyelv: "ro", uj: true,
    } });
    expect(uj.statusz).toBe(200);
    const id = uj.torzs.munka.id;
    const ro = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik: s, torzs: { felulet: "fb", nyelv: "ro" } });
    expect(ro.statusz).toBe(200);
    const de = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik: s, torzs: { felulet: "fb", nyelv: "de" } });
    expect(de.statusz).toBe(200);
    const cellak = de.torzs.munka.szovegek.filter((c) => c.felulet === "fb").map((c) => c.nyelv).sort();
    expect(cellak).toEqual(["de", "ro"]);
    expect(de.torzs.munka.szovegek.find((c) => c.nyelv === "de")!.szoveg.trim().length).toBeGreaterThan(0);
  });
});
