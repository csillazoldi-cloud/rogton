// c30 F3 — the bilingual post (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §5, §10 F3; docs/decisions/2026-10-17-c30-f3-ketnyelvu-poszt.md;
// drawings c30 D5 · D6a · D6b · D6 desktop · D9b). Pure part: the join (D1: hashtags once, order by nyelvek, RO-first org), the per-half
// budget, the IG limit with the longest Zilele performer post, what „Kész, másolom" does with the second half (an edited one is never
// overwritten), the budget input line, the pre-selected mode (D6). Live part (PROBA_CIM + DATABASE_URL; test AI): the mode endpoint, the
// byte-identical round trip of `szovegek[]` through every mode switch, the one-time shorten retry (machine text only, a person's never).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztMunka, PosztSzoveg } from "@rogton/contracts";
import { KARAKTERHATAR, keretSorok, szovegBemenet } from "../poszt/bemenet";
import {
  HASHTAG_KERET, KETNYELVU_ELVALASZTO, alapCta, hashtagVeg, ketnyelvuFelulet, ketnyelvuKeret, ketnyelvuOsszefuz, kozosHashtagek,
  masodikTeendo, mezoOsszerak, mezoTorzs, tulHosszu,
} from "../poszt/ketnyelvu";
import { elsoNyelvMod } from "../profil/tipus-szabaly";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

// The drawing's own text (D6, Zilele Târgumureșene 2026 — Kökény Attila, closing day)
const HU = "Vasárnap este Kökény Attila lép fel a Győzelem téri Nagyszínpadon! Június 28-án 20:00-tól, a Marosvásárhelyi Napok zárónapján. Utána 21:30-tól Voltaj, 23:00-kor tűzijáték és a fesztivál hivatalos zárása. Gyere, ünnepeljünk együtt!";
const RO = "Duminică seara, Kökény Attila urcă pe Scena Mare din Piața Victoriei! Pe 28 iunie, de la ora 20:00, în ultima zi a Zilelor Târgumureșene. Urmează Voltaj de la 21:30, iar la 23:00 spectacolul de artificii și închiderea oficială a festivalului. Vino să sărbătorim împreună!";
const TAG_HU = "#MarosvásárhelyiNapok #TârguMureș";
const TAG_RO = "#ZileleTârgumureșene #TârguMureș #marosvásárhelyinapok";

const cella = (resz: Partial<PosztSzoveg>): PosztSzoveg => ({ felulet: "ig", nyelv: "ro", szoveg: "", javaslat: "", hashtagek: [], allapot: "javaslat", veglegesitve: null, nyelvre_szabva: false, elavult_forditas: false, ...resz });

describe("F3 pure: join, budget, second half, inputs", () => {
  it("D1: first text, ———, second text, the hashtags ONCE at the end (case-insensitive), first language first", () => {
    const k = ketnyelvuOsszefuz(`${HU}\n\n${TAG_HU}`, `${RO}\n\n${TAG_RO}`);
    expect(k).toBe(`${HU}\n\n${KETNYELVU_ELVALASZTO}\n\n${RO}\n\n#MarosvásárhelyiNapok #TârguMureș #ZileleTârgumureșene`);
    expect(k.match(/#TârguMureș/g)?.length).toBe(1);
    // a RO-first org (e.g. a city hall): the caller passes nyelvek order — RO first
    expect(ketnyelvuOsszefuz(`${RO}\n\n${TAG_RO}`, `${HU}\n\n${TAG_HU}`).startsWith(RO)).toBe(true);
    // without hashtags; an empty half never leaves a dangling separator
    expect(ketnyelvuOsszefuz(HU, RO)).toBe(`${HU}\n\n———\n\n${RO}`);
    expect(ketnyelvuOsszefuz(`${HU}\n\n${TAG_HU}`, "")).toBe(`${HU}\n\n${TAG_HU}`);
    expect(kozosHashtagek("Csak szöveg, #nemvégén benne", "")).toEqual([]);
  });

  it("the text field shows a half without its hashtag line; an edit keeps the half's own hashtags and trailing spaces", () => {
    const teljes = `${HU}\n\n${TAG_HU}`;
    expect(mezoTorzs(teljes)).toBe(HU);
    expect(mezoOsszerak(`${HU} Hozd a családot is, ingyenes! `, teljes)).toBe(`${HU} Hozd a családot is, ingyenes! \n\n${TAG_HU}`);
    expect(mezoTorzs(mezoOsszerak("ș ț ă \n", teljes))).toBe("ș ț ă \n");
    expect(mezoOsszerak("új szöveg", "régi, hashtag nélkül")).toBe("új szöveg");
    expect(hashtagVeg(teljes)).toEqual({ torzs: HU, hashtagek: ["#MarosvásárhelyiNapok", "#TârguMureș"] });
  });

  it("budget per half = floor((limit − separator − hashtags) / 2): IG 1050, LI 1450; blog stays separate (no joined post)", () => {
    expect(ketnyelvuKeret("ig")).toBe(1050);
    expect(ketnyelvuKeret("li")).toBe(1450);
    expect(ketnyelvuKeret("fb")).toBeGreaterThan(30_000);
    expect(ketnyelvuKeret("blog")).toBeNull();
    expect(ketnyelvuFelulet("blog")).toBe(false);
    expect(tulHosszu("blog", "x".repeat(5000), "y".repeat(5000))).toBe(false);
  });

  it("IG: the longest Zilele performer post, each half at its budget and the hashtags at their allowance, fits 2200", () => {
    const hosszuHu = `${HU} ${"Aura Șova & Band, Cristi Țăran, Kilyén Ilka és Rițiu Krisztina — folclor, Középkori Vár, Színház tér – Borsétány. ".repeat(12)}`.slice(0, ketnyelvuKeret("ig")!);
    const hosszuRo = `${RO} ${"Aura Șova & Band, Cristi Țăran, Kilyén Ilka și Rițiu Krisztina — folclor, Cetatea Medievală, Piața Teatrului – Aleea Vinului. ".repeat(12)}`.slice(0, ketnyelvuKeret("ig")!);
    const tagek = "#MarosvásárhelyiNapok #ZileleTârgumureșene #TârguMureș #Marosvásárhely #KökényAttila".slice(0, HASHTAG_KERET);
    const k = ketnyelvuOsszefuz(`${hosszuHu}\n\n${tagek}`, `${hosszuRo}\n\n${tagek}`);
    expect(k.length).toBeLessThanOrEqual(KARAKTERHATAR.ig);
    expect(tulHosszu("ig", `${hosszuHu}\n\n${tagek}`, `${hosszuRo}\n\n${tagek}`)).toBe(false);
    expect(tulHosszu("ig", `${hosszuHu}${hosszuHu}`, hosszuRo)).toBe(true); // over budget → the shorten retry fires (never a silent cut)
  });

  it("„Kész, másolom” and the second half: missing → write, untouched + stale → refresh, PERSON-edited + stale → never overwritten", () => {
    expect(masodikTeendo(null)).toBe("ir");
    expect(masodikTeendo(cella({ szoveg: " " }))).toBe("ir");
    expect(masodikTeendo(cella({ szoveg: RO, javaslat: RO }))).toBe("kesz");
    expect(masodikTeendo(cella({ szoveg: RO, javaslat: RO, elavult_forditas: true }))).toBe("frissit");
    expect(masodikTeendo(cella({ szoveg: `${RO} Intrarea e liberă!`, javaslat: RO, allapot: "szerkesztve", elavult_forditas: true }))).toBe("jelez");
    expect(masodikTeendo(cella({ szoveg: RO, javaslat: RO, allapot: "vegleges", elavult_forditas: true }))).toBe("jelez");
  });

  it("the budget line goes into the input only in egyben mode; every other post's input is unchanged", () => {
    const munka = { cim: "Kökény Attila", forras: { tipus: "sajat", cim: "", url: "" } };
    const nelkul = szovegBemenet(munka, "ig", ["P"], "2026-06-27", "Kökény Attila vasárnap", "");
    expect(nelkul).not.toContain("Hossz-keret");
    expect(szovegBemenet(munka, "ig", ["P"], "2026-06-27", "Kökény Attila vasárnap", "", 1050)).toContain("Hossz-keret: legfeljebb 1050 karakter");
    expect(keretSorok(null)).toEqual([]);
    // D15: without a person's CTA the machine gets an intent (with the website when known)
    expect(alapCta("https://zileletargumuresene.ro")).toContain("zileletargumuresene.ro");
    expect(alapCta("")).toContain("felhívás");
  });

  it("D6: the setup step pre-selects egyben for a festival, kulon for a company; a stored choice wins", () => {
    expect(elsoNyelvMod({ nyelvek: ["hu", "ro"], szervezet_tipus: "fesztival" } as never)).toBe("egyben");
    expect(elsoNyelvMod({ nyelvek: ["hu", "ro"] } as never)).toBe("kulon");
    expect(elsoNyelvMod({ nyelvek: ["hu", "ro"], szervezet_tipus: "fesztival", poszt_nyelv_mod: "kulon" } as never)).toBe("kulon");
    expect(elsoNyelvMod({ nyelvek: ["ro", "hu"], poszt_nyelv_mod: "garbage" } as never)).toBe("kulon");
  });
});

describe("F3 live: the mode endpoint, the byte-identical round trip, the shorten retry", () => {
  const jelszo = "ProbaJelszo123!";
  const belep = async (nev: string, szervezet: string, nyelvek: string[]) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s });
    expect(sz.statusz).toBe(201);
    const osszefoglalo = "Marosvásárhelyi Napok — Zilele Târgumureșene: négy nap koncert, vásár és tűzijáték június végén.";
    expect((await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev: szervezet, osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: osszefoglalo },
      kommunikacio: { celkozonseg: "családok, fiatalok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek, nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: nyelvek[0], hangnem_forras: "sajat" },
    } })).statusz).toBe(200);
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
    return { s, id: sz.torzs.id };
  };
  const ujPoszt = async (s: string, felulet: string) => {
    const r = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik: s, torzs: {
      forras: { tipus: "sajat", azonosito: "", cim: "Kökény Attila vasárnap", url: "", szoveg: "Kökény Attila lép fel vasárnap 20:00-kor a Győzelem téri Nagyszínpadon." },
      cim: "Kökény Attila vasárnap", felulet, nyelv: "hu", uj: true,
    } });
    expect(r.statusz).toBe(200);
    return r.torzs.munka.id;
  };
  const szovegek = async (id: string) => (await sql<{ szovegek: unknown }>("SELECT szovegek FROM poszt_munka WHERE id = $1", [id]))[0]!.szovegek;
  let fesz = { s: "", id: "" };
  let egyNyelvu = { s: "", id: "" };
  beforeAll(async () => {
    fesz = await belep("Moldovan-Szabó Réka", "Zilele Târgumureșene 2026 — próba F3", ["hu", "ro"]);
    egyNyelvu = await belep("Kovács-Szentgyörgyi Tibor", "Kovács Térkő Kft. — próba F3", ["hu"]);
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("the mode endpoint: a [hu, ro] org saves each mode; a bad value and a one-language org are refused", async () => {
    for (const mod of ["egyben", "kulon", "egy"]) {
      const r = await keres<{ mod: string }>("/api/profil/nyelvmod", { modszer: "PUT", sutik: fesz.s, torzs: { mod } });
      expect(r.statusz).toBe(200);
      expect(r.torzs.mod).toBe(mod);
    }
    expect((await keres("/api/profil/nyelvmod", { modszer: "PUT", sutik: fesz.s, torzs: { mod: "ketnyelvu" } })).statusz).toBe(400);
    expect((await keres("/api/profil/nyelvmod", { modszer: "PUT", sutik: egyNyelvu.s, torzs: { mod: "egyben" } })).statusz).toBe(400);
    const g = await keres<{ mod: string; nyelvek: string[] }>("/api/profil/nyelvmod", { sutik: egyNyelvu.s });
    expect(g.torzs).toMatchObject({ mod: "egy", nyelvek: ["hu"] });
  });

  it("switching egyben → kulon → egy → egyben leaves szovegek[] byte-identical (edited cells included)", async () => {
    expect((await keres("/api/profil/nyelvmod", { modszer: "PUT", sutik: fesz.s, torzs: { mod: "egyben" } })).statusz).toBe(200);
    const id = await ujPoszt(fesz.s, "fb");
    expect((await keres(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik: fesz.s, torzs: { felulet: "fb", nyelv: "hu" } })).statusz).toBe(200);
    expect((await keres(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik: fesz.s, torzs: { felulet: "fb", nyelv: "ro" } })).statusz).toBe(200);
    expect((await keres(`/api/poszt/${id}`, { modszer: "PUT", sutik: fesz.s, torzs: { felulet: "fb", nyelv: "ro", szoveg: `${RO}\n\n${TAG_RO}` } })).statusz).toBe(200);
    const elotte = JSON.stringify(await szovegek(id));
    for (const mod of ["kulon", "egy", "egyben"]) expect((await keres("/api/profil/nyelvmod", { modszer: "PUT", sutik: fesz.s, torzs: { mod } })).statusz).toBe(200);
    expect(JSON.stringify(await szovegek(id))).toBe(elotte);
    const mod = (await sql<{ m: string }>("SELECT adatok->>'poszt_nyelv_mod' AS m FROM szervezet_profil WHERE szervezet_id = $1", [fesz.id]))[0]!.m;
    expect(mod).toBe("egyben");
  });

  it("IG over the limit: the machine's first half is shortened ONCE and the second translated again; a person's half is never rewritten", async () => {
    const hosszu = `${HU} ${"Aura Șova & Band, Cristi Țăran, Kilyén Ilka és Rițiu Krisztina, Középkori Vár. ".repeat(30)}`.slice(0, 2150);
    // (a) machine text → one shorten + one re-translation, the joined post fits
    const id = await ujPoszt(fesz.s, "ig");
    expect((await keres(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik: fesz.s, torzs: { felulet: "ig", nyelv: "hu" } })).statusz).toBe(200);
    await sql(`UPDATE poszt_munka SET szovegek = (SELECT jsonb_agg(CASE WHEN c->>'felulet' = 'ig' AND c->>'nyelv' = 'hu' THEN c || jsonb_build_object('szoveg', $2::text, 'javaslat', $2::text, 'allapot', 'javaslat') ELSE c END) FROM jsonb_array_elements(szovegek) c) WHERE id = $1`, [id, hosszu]);
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik: fesz.s, torzs: { felulet: "ig", nyelv: "ro" } });
    expect(r.statusz).toBe(200);
    const hu = r.torzs.munka.szovegek.find((c) => c.felulet === "ig" && c.nyelv === "hu")!;
    const ro = r.torzs.munka.szovegek.find((c) => c.felulet === "ig" && c.nyelv === "ro")!;
    expect(hu.szoveg.length).toBeLessThan(hosszu.length);
    expect(ketnyelvuOsszefuz(hu.szoveg, ro.szoveg).length).toBeLessThanOrEqual(KARAKTERHATAR.ig);
    // (b) a person's first half → untouched, nothing cut: the overflow is the counter's to show
    const id2 = await ujPoszt(fesz.s, "ig");
    expect((await keres(`/api/poszt/${id2}`, { modszer: "PUT", sutik: fesz.s, torzs: { felulet: "ig", nyelv: "hu", szoveg: hosszu } })).statusz).toBe(200);
    const r2 = await keres<{ munka: PosztMunka }>(`/api/poszt/${id2}/forditas`, { modszer: "POST", sutik: fesz.s, torzs: { felulet: "ig", nyelv: "ro" } });
    expect(r2.statusz).toBe(200);
    expect(r2.torzs.munka.szovegek.find((c) => c.felulet === "ig" && c.nyelv === "hu")!.szoveg).toBe(hosszu);
  });
});
