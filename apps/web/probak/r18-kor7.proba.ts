// R-18 7. kör (Csilla 10-12, „post topics & types”, IRANYOK-round7.md). Tiszta rész: vendéglátós-e a cég, a kínálat és a tématerv
// tisztítása, a honlap közösségi linkje és kínálat-aloldalai, a gép nélküli tartalék-terv, a kínálat-blokk a gép előtt (ár csak „Igen”-nél),
// az árak utóellenőrzése, a fajta-kimenet ellenőrzése, a videó szószáma és a másolható szövegek, a javasolt fajta.
// Élő rész (PROBA_CIM + DATABASE_URL; teszt AI): /api/profil/kinalat (profil nélkül 409; a másik szervezet nem látja; a meglévő profil-jsonb-ben),
// km_app sorszintű védelem, a lista feltöltött fotóból, az oldal + képernyőkép, a témák, a poszt fajtái, és „árak: Nem” → a kimenetben nincs ár.
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { KinalatSor, PosztMunka, TemaTerv } from "@rogton/contracts";
import { domainNev, kinalatAloldalak, kinalatTisztit, kozossegiLink, temaTartalek, temakTisztit, vendeglato } from "../profil/kinalat-szabaly";
import { readFileSync } from "node:fs";
import { arakNelkul, javasoltTipus, kinalatSorok, kitalaltReszek, szavazasSzoveg, temaTervSorok, tipusKimenet, tipusSzovegek, videoSzamlalo, videoSzoveg } from "../poszt/tipus";
import { profilSorok } from "../poszt/profil-blokk";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const KINALAT: KinalatSor[] = [
  { nev: "Díszburkolat, térkő lerakása", reszlet: "udvar, kocsibeálló, járda", ar: "85 lej/m²-től", aktiv: true },
  { nev: "Szegélyezés és vízelvezetés", reszlet: "", ar: "", aktiv: true },
  { nev: "Régi burkolat bontása", reszlet: "", ar: "40 lej/m²", aktiv: false },
];

describe("kínálat és tématerv szabályai (profil/kinalat-szabaly.ts)", () => {
  it("vendéglátás HU/RO/EN szavakból; a térkövező nem az", () => {
    expect(vendeglato("Csillag Vendéglő, házias ételek Szovátán")).toBe(true);
    expect(vendeglato("Restaurant cu specific ardelenesc în Târgu Mureș")).toBe(true);
    expect(vendeglato("Kávézó és cukrászda a főtéren")).toBe(true);
    expect(vendeglato("Kő és Kert Térkövező Kft. — díszburkolat, kertépítés")).toBe(false);
  });
  it("a kínálat tisztítása: üres név ki, azonos név (kis/nagybetű) egyszer, a pipa alapból bekapcsolva", () => {
    expect(kinalatTisztit([{ nev: "  Díszburkolat  " }, { nev: "díszburkolat" }, { nev: "" }, { nev: "Șanțuri", ar: "30 lei", aktiv: false }, null])).toEqual([
      { nev: "Díszburkolat", reszlet: "", ar: "", aktiv: true },
      { nev: "Șanțuri", reszlet: "", ar: "30 lei", aktiv: false },
    ]);
    expect(kinalatTisztit("nem lista")).toEqual([]);
  });
  it("a tématerv tisztítása: ismeretlen fajta és üres téma ki, legfeljebb 12", () => {
    expect(temakTisztit([{ tema: "Munkáink", tipus: "album" }, { tema: "x", tipus: "reel" }, { tema: " ", tipus: "video" }])).toEqual([{ tema: "Munkáink", tipus: "album" }]);
    expect(temakTisztit(Array.from({ length: 20 }, (_, i) => ({ tema: `T${i}`, tipus: "kartya" }))).length).toBe(12);
  });
  it("a honlap Facebook-oldala (a megosztó link nem), és a kínálat-aloldalak (a saját domainen, legfeljebb 3)", () => {
    const html = `<a href="https://www.facebook.com/sharer/sharer.php?u=x">Megosztás</a><a href="https://www.facebook.com/kovacsterko/">Facebook</a>
      <a href="/szolgaltatasaink">Szolgáltatásaink</a><a href="/arak">Árak</a><a href="https://mas.ro/arak">Más</a><a href="/kapcsolat">Kapcsolat</a><a href="/termekek">Termékek</a><a href="/galeria">Galéria</a><a href="/servicii">x</a>`;
    expect(kozossegiLink(html, "https://kovacsterko.ro/")).toBe("facebook.com/kovacsterko");
    expect(kinalatAloldalak(html, "https://kovacsterko.ro/")).toEqual(["https://kovacsterko.ro/szolgaltatasaink", "https://kovacsterko.ro/arak", "https://kovacsterko.ro/termekek"]);
    expect(domainNev("https://www.kovacsterko.ro/akarmi")).toBe("kovacsterko.ro");
  });
  it("gép nélkül a tartalék-terv: a szokásos párosítás, a bekapcsolt szolgáltatással; legalább három fajta", () => {
    const t = temaTartalek(KINALAT, false, "hu");
    expect(t[0]).toEqual({ tema: "Munkáink — kész munkák, előtte–utána", tipus: "album" });
    expect(t).toContainEqual({ tema: "Szolgáltatásunk: Díszburkolat, térkő lerakása", tipus: "picmess" });
    expect(t.some((x) => x.tema.includes("Régi burkolat"))).toBe(false); // kivett pipa: nem posztolunk róla
    expect(new Set(t.map((x) => x.tipus)).size).toBeGreaterThanOrEqual(3);
    expect(temaTartalek([], true, "ro")[0]).toEqual({ tema: "Meniul zilei / săptămânii", tipus: "picmess" });
  });
});

describe("a gép elé: kínálat, tématerv, árak (poszt/tipus.ts, profil-blokk.ts)", () => {
  const ures = { nev: "Kő és Kert Kft.", osszefoglalo: "Térkövezés.", celkozonseg: "", cel: "", hangnem_leiras: "", hangnem_minta: "" };
  it("ár csak „Igen”-nél kerül a gép elé; „Nem”-nél és válasz nélkül a tiltás sora; a kivett pipa nincs a listában", () => {
    const igen = kinalatSorok(KINALAT, true).join("\n");
    expect(igen).toContain("- Díszburkolat, térkő lerakása (udvar, kocsibeálló, járda) · ár: 85 lej/m²-től");
    expect(igen).toMatch(/Árat csak ebből a listából írj/);
    for (const nem of [kinalatSorok(KINALAT, false).join("\n"), kinalatSorok(KINALAT, undefined).join("\n")]) {
      expect(nem).not.toContain("85 lej");
      expect(nem).toMatch(/Árat, díjat, összeget NE írj/);
    }
    expect(igen).not.toContain("Régi burkolat");
    expect(kinalatSorok([], true)).toEqual([]);
  });
  it("a profil-blokk viszi a kínálatot és a tématervet (minden poszt-prompt kontextusa)", () => {
    const terv: TemaTerv[] = [{ tema: "Egy nap a telepen", tipus: "video" }];
    const s = profilSorok({ ...ures, kinalat: KINALAT, arak_posztban: false, tema_terv: terv, poszt_szokasok: "Tegező, 2–3 hashtag." }).join("\n");
    expect(s).toContain("=== A CÉG KÍNÁLATA");
    expect(s).toContain("- Egy nap a telepen · Videó");
    expect(s).toContain("Tegező, 2–3 hashtag.");
    expect(s).not.toContain("85 lej");
    expect(temaTervSorok([])).toEqual([]);
  });
  it("„Nem”-nél a lista árai kikerülnek a kimenetből (a forrásból jöttek is); „Igen”-nél maradnak", () => {
    const be = "Új udvar a Fenyő utcában · 85 lej/m²-től! Szegély is (40 lej/m²).";
    expect(arakNelkul(be, KINALAT, false)).toBe("Új udvar a Fenyő utcában! Szegély is.");
    expect(arakNelkul(be, KINALAT, undefined)).not.toMatch(/lej/);
    expect(arakNelkul(be, KINALAT, true)).toBe(be);
  });
});

describe("a poszt fajtái (poszt/tipus.ts)", () => {
  it("a gép válaszának ellenőrzése fajtánként; a hiányos válasz null (nincs félkész kimenet)", () => {
    const v = tipusKimenet("video", { sorok: [{ ido: "0–3 mp", elmondod: "Négy nap alatt lett ilyen.", felirat: "4 NAP", kep: "Kész udvar" }, { ido: "3–14 mp", elmondod: "Hétfőn még sár volt itt.", felirat: "", kep: "" }], hookok: ["A", "B", "C"] });
    expect(v?.adat.video?.sorok.length).toBe(2);
    expect(v?.adat.video?.hookok).toEqual(["A", "B"]);
    expect(tipusKimenet("video", { sorok: [{ ido: "0–3", elmondod: "egy" }] })).toBeNull();
    expect(tipusKimenet("szavazas", { kerdes: "Melyik?", valaszok: ["Antik kő", "Homokkő", "Rácskő", "Gyep", "Beton"] })?.adat.szavazas?.valaszok.length).toBe(4);
    expect(tipusKimenet("szavazas", { kerdes: "Melyik?", valaszok: ["csak egy"] })).toBeNull();
    expect(tipusKimenet("album", { szoveg: "Kész a Fenyő utcai udvar.", kepek: ["előtte", "utána"] })?.szoveg).toBe("Kész a Fenyő utcai udvar.");
    expect(tipusKimenet("kartya", { szoveg: "Tipp.", cim: "Tudtad?", sor: "A fagy a sótól jobban árt." })?.adat.kartya?.cim).toBe("Tudtad?");
    expect(tipusKimenet("picmess", { szoveg: "x" })).toBeNull();
  });
  it("a videó szószáma (kb. 2,3 szó / mp), a másolható forgatókönyv és szavazás", () => {
    const sorok = [{ ido: "0–3 mp", elmondod: "Ez az udvar négy nap alatt lett ilyen.", felirat: "4 NAP", kep: "Kész udvar" }, { ido: "3–14 mp", elmondod: "Hétfő reggel még sár és repedt beton volt itt.", felirat: "", kep: "Gép" }];
    expect(videoSzamlalo(sorok)).toEqual({ szo: 17, mp: 7 });
    expect(videoSzoveg(sorok, { elmondod: "Elmondod", felirat: "Felirat", kep: "Kép" })).toBe("1. 0–3 mp\nElmondod: Ez az udvar négy nap alatt lett ilyen.\nFelirat: 4 NAP\nKép: Kész udvar\n\n2. 3–14 mp\nElmondod: Hétfő reggel még sár és repedt beton volt itt.\nKép: Gép");
    expect(szavazasSzoveg("Melyik udvart választanád?", ["Antik kő", " ", "Homokkő"])).toBe("Melyik udvart választanád?\n1. Antik kő\n2. Homokkő");
  });
  it("a javasolt fajta a tématervből (közös szótő), egyezés nélkül nincs", () => {
    const terv: TemaTerv[] = [{ tema: "Munkáink — kész udvarok, előtte–utána", tipus: "album" }, { tema: "Egy nap a telepen", tipus: "video" }];
    expect(javasoltTipus("Kész az udvar a Fenyő utcában", terv)).toBe("album");
    expect(javasoltTipus("Nyílt nap a telepünkön", terv)).toBe("video");
    expect(javasoltTipus("Időjárás", terv)).toBeNull();
  });
});

// Csilla 10-12 (élőben, valódi modell): a „Csapatépítő hétvége Szovátán: fotóalbum a csapatról, 14-en voltunk a Medve-tónál, jövőre is
// megyünk.” ötletből a videó túrázást, ötletelést a víz partján, tábortüzes történeteket és mályvacukor-sütést, a szavazás „Hiking and
// nature shot / Campfire evening moment” válaszokat talált ki.
const OTLET = "Csapatépítő hétvége Szovátán: fotóalbum a csapatról, 14-en voltunk a Medve-tónál, jövőre is megyünk.";
describe("semmi kitalált részlet (poszt_tipus v2 + kitalaltReszek)", () => {
  const p = readFileSync(new URL("../prompts/poszt_tipus.hu.md", import.meta.url), "utf8");
  it("a prompt minden fajtánál kimondja: csak a megadott tényekből; tevékenységet, számot, nevet nem talál ki; a helynév egy alakban", () => {
    // R-18 8. kör (Kati 10-13: B-roll visszhang): v3 lett; a v2 „semmi kitalált részlet” szabálya változatlan — a fejléc a v2-t is őrzi
    // c30 F7 (10-17): v4 (the RENDEZVÉNY rule + the album-photo rule were added); the v2 and v3 rules are unchanged and the header still keeps both
    expect(p.split("\n")[0]).toMatch(/poszt-tipus · v4 · 2026-10-17 .*· v3: 2026-10-14 .*· v2: 2026-10-12/);
    expect(p).toMatch(/ne találj ki tevékenységet, programot, eseményt, tárgyat, számot, nevet, helyet/);
    expect(p).toMatch(/NINCS túrázás, tábortűz/);
    expect(p).toMatch(/„Medve-tó” „Medve-tó” marad/);
    expect(p).toMatch(/tedd kérdéssé a nézőnek/);
    for (const fajta of ["1. „video”", "2. „szavazas”", "3. „album”", "4. „picmess” vagy „kartya”"]) {
      const resz = p.slice(p.indexOf(fajta), p.indexOf("\n\n", p.indexOf(fajta)));
      expect(resz, fajta).toMatch(/CSAK A MEGADOTT TÉNYEKBŐL/);
    }
  });
  it("az élő hiba (fixture): a kitalált helynév-fordítás és szám megfogva; a bemenetben álló név (ragozva is) és szám nem", () => {
    const kimenet = [
      "Tizennégyen voltunk a Medve-tónál, és jövőre is megyünk.",
      "Este a Bear Lake partján 3 órát ültünk a tábortűz mellett.",
      "14 EMBER",
      "Szovátán minden reggel együtt ébredtünk.",
    ];
    const k = kitalaltReszek(kimenet, OTLET);
    expect(k.nevek).toEqual(["Bear", "Lake"]);
    expect(k.szamok).toEqual(["3"]);
    expect(kitalaltReszek(["A csapat a Medve-tónál, 14-en."], OTLET)).toEqual({ szamok: [], nevek: [] });
  });
  it("a fajta-kimenet minden szövege az őr elé kerül (videó, szavazás, album, kártya)", () => {
    const v = tipusKimenet("video", { sorok: [{ ido: "0–3 mp", elmondod: "Ott voltunk a Medve-tónál.", felirat: "14-EN", kep: "Csoportkép" }, { ido: "3–10 mp", elmondod: "Jövőre is megyünk.", felirat: "", kep: "" }], hookok: ["Mi történt Szovátán?"] })!;
    expect(tipusSzovegek(v.adat, v.szoveg)).toEqual(["Ott voltunk a Medve-tónál.", "14-EN", "Csoportkép", "Jövőre is megyünk.", "Mi történt Szovátán?"]);
    const sz = tipusKimenet("szavazas", { kerdes: "Hová menjünk jövőre?", valaszok: ["Medve-tó", "Campfire evening moment"] })!;
    expect(kitalaltReszek(tipusSzovegek(sz.adat, sz.szoveg), OTLET).nevek).toEqual([]); // a válasz eleje mondatkezdés — a tevékenységet a prompt tiltja, nem az őr
  });
});

describe("élőben: kínálat, beállítás-lépések, poszt fajták, árak", () => {
  const jelszo = "ProbaJelszo123!";
  let sutik = "";
  let masik = "";
  const CEG = "Kő és Kert Térkövező Kft., Marosvásárhely — próba 7";
  const MASIK = "Șandor & Fiii SRL — próba 7";
  const belep = async (nev: string, szervezet: string) => {
    const email = veletlenEmail();
    await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    await keres("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s });
    return s;
  };
  // az összefoglaló elején áll az ár: a teszt-csatlakozó a bemenet elejét visszaadja, így az ár a kimenetbe is „bejut” — az utóellenőrzésnek kell kivennie
  const jovahagy = async (s: string, nev: string) => {
    const osszefoglalo = "Díszburkolat 85 lej/m²-től Marosvásárhelyen és környékén, húsz éve, saját csapattal, kertépítéssel együtt.";
    await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
      bemutatkozas: { nev, osszefoglalo, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: osszefoglalo },
      kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu"], nyelvek_forras: "ai", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: "hu", hangnem_forras: "sajat" },
    } });
    expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s })).statusz).toBe(200);
  };
  const szerv = async (nev: string) => (await sql<{ id: string }>("SELECT id FROM szervezet WHERE nev = $1", [nev]))[0]!.id;
  beforeAll(async () => {
    sutik = await belep("Kovács-Szentgyörgyi Tibor", CEG);
    masik = await belep("Szász Ágnes-Ioana", MASIK);
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("profil nélkül: a lekérdezés üres, a mentés 409, a beállítás-lépések 409", async () => {
    const g = await keres<{ van_profil: boolean; kinalat: unknown[] }>("/api/profil/kinalat", { sutik });
    expect(g.torzs.van_profil).toBe(false);
    expect((await keres("/api/profil/kinalat", { modszer: "PUT", sutik, torzs: { kinalat: KINALAT } })).statusz).toBe(409);
    expect((await keres("/api/onboarding/beallitas/olvas", { modszer: "POST", sutik, torzs: {} })).statusz).toBe(409);
    expect((await keres("/api/onboarding/beallitas/temak", { modszer: "POST", sutik, torzs: {} })).statusz).toBe(409);
  });

  it("mentés és visszaolvasás (ékezetek); a meglévő profil-jsonb-ben; a másik szervezet nem látja", async () => {
    await jovahagy(sutik, CEG);
    await jovahagy(masik, MASIK);
    const p = await keres<{ kinalat: KinalatSor[]; arak_posztban: boolean | null }>("/api/profil/kinalat", { modszer: "PUT", sutik, torzs: { kinalat: KINALAT, arak_posztban: false, tema_terv: [{ tema: "Egy nap a telepen", tipus: "video" }] } });
    expect(p.statusz).toBe(200);
    expect(p.torzs.kinalat).toEqual(KINALAT);
    expect(p.torzs.arak_posztban).toBe(false);
    expect((await keres("/api/profil/kinalat", { modszer: "PUT", sutik, torzs: { arak_posztban: "igen" } })).statusz).toBe(400);
    const m = await keres<{ kinalat: unknown[]; tema_terv: unknown[] }>("/api/profil/kinalat", { sutik: masik });
    expect(m.torzs.kinalat).toEqual([]);
    expect(m.torzs.tema_terv).toEqual([]);
    const sor = (await sql<{ adatok: { kinalat?: KinalatSor[]; arak_posztban?: boolean; tema_terv?: TemaTerv[] } }>("SELECT adatok FROM szervezet_profil WHERE szervezet_id = $1", [await szerv(CEG)]))[0]!;
    expect(sor.adatok.kinalat).toEqual(KINALAT);
    expect(sor.adatok.tema_terv).toEqual([{ tema: "Egy nap a telepen", tipus: "video" }]);
  });

  it("sorszintű védelem (km_app): a másik szervezet nevében a profil sora (a kínálattal) sem olvasható, sem írható", async () => {
    const url = process.env["PROBA_APP_DATABASE_URL"];
    if (!url) return;
    const a = await szerv(CEG), b = await szerv(MASIK);
    const k = new Client({ connectionString: url });
    await k.connect();
    try {
      await k.query("BEGIN");
      await k.query("SELECT set_config('app.szervezet_id', $1, true)", [b]);
      expect((await k.query("SELECT adatok->'kinalat' AS k FROM szervezet_profil WHERE szervezet_id = $1", [a])).rowCount).toBe(0);
      expect((await k.query("UPDATE szervezet_profil SET adatok = jsonb_set(adatok, '{arak_posztban}', 'true') WHERE szervezet_id = $1", [a])).rowCount).toBe(0);
      await k.query("COMMIT");
      await k.query("BEGIN");
      await k.query("SELECT set_config('app.szervezet_id', $1, true)", [a]);
      expect((await k.query("SELECT adatok->'arak_posztban' AS a FROM szervezet_profil WHERE szervezet_id = $1", [a])).rows[0]?.a).toBe(false);
      await k.query("COMMIT");
    } finally {
      await k.end();
    }
  });

  it("a lista feltöltött fotóból (a fájltárba, „dokumentum”), az oldal + képernyőkép → szokások, a témák", async () => {
    // egy 1×1-es PNG (a képolvasó a teszt-csatlakozóval minta-étlapot ad)
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const f = await fetch(`${process.env["PROBA_CIM"] ?? "http://127.0.0.1:3000"}/api/onboarding/beallitas/fajl`, { method: "POST", body: png, headers: { cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent("étlap 1. oldal.png") } });
    expect(f.status).toBe(201);
    const id = ((await f.json()) as { fajl: { id: string } }).fajl.id;
    const l = await keres<{ sorok: KinalatSor[] }>("/api/onboarding/beallitas/lista", { modszer: "POST", sutik, torzs: { fajlok: [id] } });
    expect(l.statusz).toBe(200);
    expect(l.torzs.sorok.length).toBeGreaterThan(0);
    expect(l.torzs.sorok[0]!.ar).not.toBe("");
    const cel = (await sql<{ cel: string }>("SELECT cel FROM arculat_fajl WHERE id = $1", [id]))[0]!.cel;
    expect(cel).toBe("dokumentum");
    const o = await keres<{ poszt_szokasok: string }>("/api/onboarding/beallitas/oldal", { modszer: "POST", sutik, torzs: { kozossegi_oldal: "facebook.com/kovacsterko", kepernyokepek: [id] } });
    expect(o.statusz).toBe(200);
    expect(o.torzs.poszt_szokasok.length).toBeGreaterThan(0);
    const t = await keres<{ temak: TemaTerv[] }>("/api/onboarding/beallitas/temak", { modszer: "POST", sutik, torzs: {} });
    expect(t.statusz).toBe(200);
    expect(t.torzs.temak.length).toBeGreaterThanOrEqual(3);
    // a másik szervezet nem olvashatja az első feltöltését
    const idegen = await keres<{ sorok: unknown[] }>("/api/onboarding/beallitas/lista", { modszer: "POST", sutik: masik, torzs: { fajlok: [id] } });
    expect(idegen.torzs.sorok).toEqual([]);
  });

  let id = "";
  it("a poszt fajtái: videó-forgatókönyv, szavazás, album (a szöveg a mezőbe), vissza a sima szöveghez", async () => {
    const p = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik, torzs: { forras: { tipus: "sajat", azonosito: "", cim: "Kész a Fenyő utcai udvar", url: "", szoveg: "Kész a Fenyő utcai udvar, 120 m², négy nap alatt." }, cim: "Fenyő utcai udvar", felulet: "fb", nyelv: "hu", uj: true } });
    id = p.torzs.munka.id;
    const v = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu", tipus: "video" } });
    expect(v.statusz).toBe(200);
    expect(v.torzs.munka.forras.poszt_tipus).toBe("video");
    expect(v.torzs.munka.forras.tipus_adat?.["hu"]?.video?.sorok.length).toBeGreaterThanOrEqual(2);
    const sz = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu", tipus: "szavazas" } });
    expect(sz.torzs.munka.forras.tipus_adat?.["hu"]?.szavazas?.valaszok.length).toBeGreaterThanOrEqual(2);
    const a = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu", tipus: "album" } });
    expect(a.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")?.szoveg.length).toBeGreaterThan(0);
    expect((await keres(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu", tipus: "reel" } })).statusz).toBe(400);
    const vissza = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik, torzs: { tipus: null } });
    expect(vissza.torzs.munka.forras.poszt_tipus).toBeUndefined();
    // a másik szervezet nem ír rá
    expect((await keres(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik: masik, torzs: { felulet: "fb", nyelv: "hu", tipus: "video" } })).statusz).toBe(404);
  });

  it("a saját ötletből kért fajta: ha a gép bemenetben nem álló számot vagy nevet írt, egyszer újrakérjük (a teszt-csatlakozó mintája ilyet ír)", async () => {
    const p = await keres<{ munka: PosztMunka }>("/api/poszt", { modszer: "POST", sutik, torzs: { forras: { tipus: "sajat", azonosito: "", cim: OTLET.slice(0, 40), url: "", szoveg: OTLET }, cim: "Csapatépítő hétvége", felulet: "fb", nyelv: "hu", uj: true } });
    const szid = await szerv(CEG);
    const db = async () => (await sql<{ db: number }>("SELECT count(*)::int AS db FROM ai_hivas WHERE szervezet_id = $1 AND feladat = 'poszt_tipus'", [szid]))[0]!.db;
    const elotte = await db();
    const v = await keres<{ munka: PosztMunka }>(`/api/poszt/${p.torzs.munka.id}/tipus`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu", tipus: "video" } });
    expect(v.statusz).toBe(200);
    expect(await db() - elotte).toBe(2); // a minta „120 m²”-t és „Hétfő”-t ír, ami az ötletben nincs → második kérés
  });

  it("„Árak a posztokban: Nem” → a kimenetben nincs ár (akkor sem, ha a forrás tartalmazta); „Igen” → marad", async () => {
    const szoveg = async () => {
      const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/szoveg`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu" } });
      expect(r.statusz).toBe(200);
      return r.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")!.szoveg;
    };
    await keres("/api/profil/kinalat", { modszer: "PUT", sutik, torzs: { arak_posztban: false } });
    expect(await szoveg()).not.toContain("85 lej");
    const k = await keres<{ munka: PosztMunka }>(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik, torzs: { felulet: "fb", nyelv: "hu", tipus: "kartya" } });
    expect(JSON.stringify(k.torzs.munka.forras.tipus_adat)).not.toContain("85 lej");
    expect(k.torzs.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")!.szoveg).not.toContain("85 lej");
    await keres("/api/profil/kinalat", { modszer: "PUT", sutik, torzs: { arak_posztban: true } });
    await keres(`/api/poszt/${id}/tipus`, { modszer: "POST", sutik, torzs: { tipus: null } });
    expect(await szoveg()).toContain("85 lej/m²-től");
  });

  it("a beállítás lapja profillal megnyílik; a Szervezet adatai „Kínálat és árak” lapja a sorokkal", async () => {
    const b = await keres<string>("/onboarding/beallitas", { sutik });
    expect(b.statusz).toBe(200);
    expect(b.torzs).toContain("Ezt kínáljátok?");
    const k = await keres<string>("/fiok/kinalat", { sutik });
    expect(k.statusz).toBe(200);
    expect(k.torzs).toContain("Díszburkolat, térkő lerakása");
    expect(k.torzs).toContain("Árak a posztokban");
  });
});
