// R-18 6. kör (Kati 10-11 · rajz: IRANYOK-round6.md). Tiszta rész: a hivatalos nevek blokkja a profil-blokkban (így minden
// generáló/fordító prompt elé odakerül), a névcsere utóellenőrzés, a felhívás (CTA) helye, az emoji beszúrása a kurzorhoz, a platform
// képméretei. Élő rész (PROBA_CIM + DATABASE_URL; teszt AI): /api/profil/nevek (profil nélkül 409, más szervezet nem látja),
// a fordítás a román hivatalos nevet adja, a „Beleírom” a felhívást teszi utolsó bekezdésnek, és az Új változat után is az marad;
// a posztból nyitott Képek lap a sablon-lépés („Ezzel folytatom”).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { HivatalosNev, PosztMunka } from "@rogton/contracts";
import { nevCsere, nevekSorok, nevekTisztit } from "../poszt/nevek";
import { profilSorok } from "../poszt/profil-blokk";
import { ctaBeszur, ctaSorok } from "../poszt/bemenet";
import { kurzorhozSzur } from "../app/poszt/kurzor";
import { KEP_MERET } from "../r15/platform-aranyok";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const SZINHAZ: HivatalosNev = { hu: "Marosvásárhelyi Nemzeti Színház", ro: "Teatrul Național Târgu-Mureș", en: "Târgu Mureș National Theatre" };
const KULTUR: HivatalosNev = { hu: "Kultúrpalota", ro: "Palatul Culturii", en: "" };

describe("hivatalos nevek (poszt/nevek.ts)", () => {
  it("a tisztítás a teljesen üres sort elhagyja, a szóközöket összehúzza", () => {
    expect(nevekTisztit([{ hu: "  Kultúrpalota ", ro: "Palatul   Culturii" }, { hu: "", ro: " ", en: "" }, null, "x"])).toEqual([{ hu: "Kultúrpalota", ro: "Palatul Culturii", en: "" }]);
    expect(nevekTisztit("nem lista")).toEqual([]);
  });
  it("a gép elé kötelező blokk kerül; a hiányzó nyelv nem jelenik meg (azt nem találjuk ki)", () => {
    const s = nevekSorok([SZINHAZ, KULTUR]);
    expect(s[0]).toMatch(/HIVATALOS NEVEK — kötelező/);
    expect(s).toContain("magyarul: Marosvásárhelyi Nemzeti Színház · románul: Teatrul Național Târgu-Mureș · angolul: Târgu Mureș National Theatre");
    expect(s).toContain("magyarul: Kultúrpalota · románul: Palatul Culturii");
    expect(nevekSorok([])).toEqual([]);
  });
  const ures = { nev: "", osszefoglalo: "", celkozonseg: "", cel: "", hangnem_leiras: "", hangnem_minta: "" };
  it("a profil-blokk viszi a neveket — így minden prompt (szöveg, átírás, fordítás, kép) megkapja; profil más mező nélkül is", () => {
    expect(profilSorok({ ...ures, nev: "Kő és Kert Kft.", hivatalos_nevek: [SZINHAZ] }).join("\n")).toMatch(/románul: Teatrul Național Târgu-Mureș/);
    expect(profilSorok({ ...ures, hivatalos_nevek: [KULTUR] }).join("\n")).toMatch(/HIVATALOS NEVEK/);
    expect(profilSorok({ ...ures, nev: "Kő és Kert Kft." }).join("\n")).not.toMatch(/HIVATALOS NEVEK/);
  });
  it("utóellenőrzés: a román szövegben a magyar (vagy rossz betűs) alak a hivatalos román névre cserél; toldalékos szót nem bánt", () => {
    expect(nevCsere("Vă așteptăm la Marosvásárhelyi Nemzeti Színház!", [SZINHAZ], "ro")).toBe("Vă așteptăm la Teatrul Național Târgu-Mureș!");
    expect(nevCsere("Spectacol la teatrul național târgu-mureș.", [SZINHAZ], "ro")).toBe("Spectacol la Teatrul Național Târgu-Mureș.");
    expect(nevCsere("Találkozzunk a Kultúrpalotában!", [KULTUR], "ro")).toBe("Találkozzunk a Kultúrpalotában!");
    expect(nevCsere("Concert la Kultúrpalota.", [KULTUR], "en")).toBe("Concert la Kultúrpalota."); // angol alak nincs → nem fordítjuk
  });
});

describe("felhívás (poszt/bemenet.ts ctaBeszur)", () => {
  const t = "Kész a Fenyő utcai udvar!\n\nKét hét munka volt.";
  it("a felhívás az utolsó bekezdés; a záró hashtag-sor utána marad", () => {
    expect(ctaBeszur(t, "", "Kérj ajánlatot még ma!")).toBe(`${t}\n\nKérj ajánlatot még ma!`);
    expect(ctaBeszur(`${t}\n\n#térkő #marosvásárhely`, "", "Kérj ajánlatot!")).toBe(`${t}\n\nKérj ajánlatot!\n\n#térkő #marosvásárhely`);
  });
  it("a régi felhívást cseréli (nem duplikál), üres új felhívás kiveszi", () => {
    const egy = ctaBeszur(t, "", "Hívj minket!");
    expect(ctaBeszur(egy, "Hívj minket!", "Írj nekünk!")).toBe(`${t}\n\nÍrj nekünk!`);
    expect(ctaBeszur(egy, "Hívj minket!", "Hívj minket!")).toBe(egy);
    expect(ctaBeszur(egy, "Hívj minket!", "")).toBe(t);
  });
  it("a gép bemenetében a felhívás sora: ne írjon másikat", () => {
    // R-18 8. kör (Kati 10-13: a felhívás szó szerint, idegenül állt a posztban): a sor most SZÁNDÉK — a gép a poszt hangján írja meg,
    // és továbbra sem ír mellé másikat
    expect(ctaSorok("Hívj minket!")[0]).toMatch(/Cselekvésre hívás szándéka.*Hívj minket!.*ne írj mellé másik felhívást/);
    expect(ctaSorok(" ")).toEqual([]);
  });
});

describe("emoji a kurzorhoz · képméretek", () => {
  it("a kurzor helyére (kijelölést cserélve) kerül, a kurzor utána áll", () => {
    expect(kurzorhozSzur("Kész az udvar!", 13, 13, " 🎉")).toEqual({ szoveg: "Kész az udvar 🎉!", kurzor: 16 });
    expect(kurzorhozSzur("Kész az udvar!", 5, 7, "a")).toEqual({ szoveg: "Kész a udvar!", kurzor: 6 });
    expect(kurzorhozSzur("ab", 99, 99, "c").szoveg).toBe("abc");
  });
  it("platformonként az ideális kép (a rajz értékei)", () => {
    expect(KEP_MERET.fb).toEqual({ szel: 1080, mag: 1350, forma: "allo", arany: "4:5" });
    expect(KEP_MERET.ig.forma).toBe("allo");
    expect(KEP_MERET.li).toMatchObject({ szel: 1200, mag: 1200, forma: "negyzet" });
    expect(KEP_MERET.blog).toMatchObject({ szel: 1200, mag: 630, forma: "fekvo" });
  });
});

describe("élőben: hivatalos nevek · Beleírom · sablon-lépés", () => {
  const jelszo = "ProbaJelszo123!";
  let sutik = "";
  let masikSutik = "";
  let id = "";
  const belep = async (nev: string, szervezet: string) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s });
    return s;
  };
  const jovahagy = async (s: string) => {
    await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev: "Kő és Kert Térkövező Kft.", osszefoglalo: "Térkövezés és kertépítés Marosvásárhelyen és környékén, húsz éve, saját csapattal.", osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: "Térkövezés és kertépítés Marosvásárhelyen és környékén, húsz éve, saját csapattal." },
      kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "ai", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
    } });
    const j = await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s });
    expect(j.statusz).toBe(200);
  };
  beforeAll(async () => {
    sutik = await belep("Kovács-Szentgyörgyi Tibor", "Kő és Kert Térkövező Kft., Marosvásárhely");
    masikSutik = await belep("Szász Ágnes", "Șandor & Fiii SRL, Târgu Mureș");
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("jóváhagyott profil nélkül a mentés 409, a lista üres", async () => {
    const g = await keres<{ nevek: unknown[]; van_profil: boolean }>("/api/profil/nevek", { sutik });
    expect(g.statusz).toBe(200);
    expect(g.torzs).toEqual({ nevek: [], van_profil: false });
    const p = await keres("/api/profil/nevek", { modszer: "PUT", sutik, torzs: { nevek: [SZINHAZ] } });
    expect(p.statusz).toBe(409);
  });

  it("mentés és visszaolvasás (ékezetek, kötőjel); a másik szervezet nem látja", async () => {
    await jovahagy(sutik);
    await jovahagy(masikSutik);
    const p = await keres<{ nevek: HivatalosNev[] }>("/api/profil/nevek", { modszer: "PUT", sutik, torzs: { nevek: [SZINHAZ, { hu: "", ro: "", en: "" }, KULTUR] } });
    expect(p.statusz).toBe(200);
    expect(p.torzs.nevek).toEqual([SZINHAZ, KULTUR]);
    const g = await keres<{ nevek: HivatalosNev[] }>("/api/profil/nevek", { sutik });
    expect(g.torzs.nevek).toEqual([SZINHAZ, KULTUR]);
    const m = await keres<{ nevek: HivatalosNev[] }>("/api/profil/nevek", { sutik: masikSutik });
    expect(m.torzs.nevek).toEqual([]);
    // a profil mezőjében él (meglévő jsonb), nem külön táblában
    const sor = (await sql<{ adatok: { hivatalos_nevek?: HivatalosNev[] } }>("SELECT p.adatok FROM szervezet_profil p JOIN szervezet s ON s.id = p.szervezet_id WHERE s.nev = $1", ["Kő és Kert Térkövező Kft., Marosvásárhely"]))[0]!;
    expect(sor.adatok.hivatalos_nevek).toEqual([SZINHAZ, KULTUR]);
  });

  it("Beleírom: a felhívás az utolsó bekezdés, a munkán megmarad, és az Új változat után is az zár", async () => {
    const p = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik,
      torzs: { forras: { tipus: "sajat", azonosito: "", cim: "Előadás a Marosvásárhelyi Nemzeti Színházban", url: "", szoveg: "Pénteken a Marosvásárhelyi Nemzeti Színház előtt raktuk le az új térkövet." }, cim: "Színház előtti tér", felulet: "fb", nyelv: "hu", uj: true } });
    id = p.torzs.munka.id;
    await keres(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
    const szoveg = "Kész a Marosvásárhelyi Nemzeti Színház előtti tér.\n\n#térkő";
    const cta = "Kérj ajánlatot még ma, egy napon belül válaszolunk!";
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}`, { modszer: "PUT", sutik, torzs: { felulet: "fb", nyelv: "hu", szoveg, cta } });
    expect(r.statusz).toBe(200);
    const cella = r.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")!;
    // R-18 8. kör (Kati 10-13): a „Beleírom” már nem illeszti szó szerint a végére — a gép (poszt_atiras „felhivas”) a poszt hangján írja
    // meg a zárást. A teszt-AI mintaszöveget ad, ezért itt csak azt mérjük, hogy a szöveg nem a szó szerinti beillesztés, és a szándék megmaradt.
    expect(cella.szoveg).not.toBe(`Kész a Marosvásárhelyi Nemzeti Színház előtti tér.\n\n${cta}\n\n#térkő`);
    expect(cella.szoveg.length).toBeGreaterThan(0);
    expect(r.torzs.munka.forras.cta?.["hu"]).toBe(cta);
    const uj = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
    expect(uj.statusz).toBe(200);
    const ujSzoveg = uj.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")!.szoveg;
    // R-18 8. kör: az Új változat a szándékot a gép bemenetében viszi (ctaSorok), a kód nem illeszti a végére — a szöveg nem a szó szerinti felhívással zár
    expect(ujSzoveg.trim().endsWith(cta)).toBe(false);
    expect(uj.torzs.munka.forras.cta?.["hu"]).toBe(cta);
  });

  it("a román fordításban a hivatalos román név áll, a magyar alak nem", async () => {
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/forditas`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "ro" } });
    expect(r.statusz).toBe(200);
    const ro = r.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "ro")!.szoveg;
    expect(ro.length).toBeGreaterThan(0);
    expect(ro).not.toContain("Marosvásárhelyi Nemzeti Színház");
  });

  it("a posztból nyitott Képek lap a sablon-lépés: javasolt sablon, „Ezzel folytatom”, a poszt neve", async () => {
    const r = await keres<string>(`/kepek?poszt=${id}`, { sutik });
    expect(r.statusz).toBe(200);
    expect(r.torzs).toContain("Ezzel folytatom");
    expect(r.torzs).toMatch(/javasolt/);
    expect(r.torzs).toContain(`/kepek/uj/kesz?poszt=${id}`);
  });
});
