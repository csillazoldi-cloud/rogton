// VZ-1 · Közlemények — a tiszta szabályok (vizual/kozlemeny-szabaly.ts), adatbázis és hálózat nélkül:
//  - a lap kérdései → a recept tartalma (Forgalmi változás / Egy mondat / Számokban), a „Hol?” és a „Melyik járat?” (kerdesek 3),
//    a három állapotszó a sávon (kerdesek 2), a nap a hét napja szóval (szám nélkül — a recept T2 szabálya), a sorszám és a dátum;
//  - a posztból kitöltés ellenőrzése: csak a helyes alakú mező kerül át, kitalált tény nincs (a hiányzó üres marad);
//  - a „Nem fér ki” → rövidebb javaslat, a sávcímke a recept 22 karakterére; az arculatból eredő jelzés nem Tiboré (kerdesek 4).
import { describe, expect, it } from "vitest";
import {
  bajKeres, ertekIr, ertekOlvas, hianyzo, hetNapja, holFajta, idoNormal, jelzesKivonat, kitoltesErtelmez, mondatKezdo, rovidCimke, rovidebb,
  szamErtelmez, tartalomEpit, uresUrlap, type Epites, type KepValasz, type Urlap,
} from "../vizual/kozlemeny-szabaly";

const MA = "2026-10-06";
const alap = (sablon: Epites["sablon"], urlap: Urlap, extra: Partial<Epites> = {}): Epites => ({
  sablon, urlap, nyelv: "hu", ro: null,
  allapotRo: { zavar: "Închis", keses: "Circulă greu", helyreallt: "Redeschis" },
  allapotSzo: { zavar: "Lezárva", keses: "Lassabban halad", helyreallt: "Újra járható" },
  rovat: { elso: "Számokban", masodik: "În cifre" }, jaratFocim: { elso: "{kod}. járat", masodik: "Linia {kod}" },
  holFajta: "hol", sorszam: 14, ...extra,
});
const zavarUrlap = (): Urlap => {
  const u = uresUrlap(MA);
  u.zavar = { allapot: "zavar", hol: "Bolyai utca, Rózsák tere – Kossuth utca", nap: "2026-10-07", kezdet: "08:00", veg: "16:00", vegKb: false, helyette: "kerülő a Bernády téren át", frissites: "12:00" };
  return u;
};

describe("VZ-1 · a lap kérdései → a recept tartalma", () => {
  it("Forgalmi változás (nem közlekedési munkatér): a „Hol?” a főcím, a sáv szava, a nap szóval, a sorszám és a „Mikor?” napja", () => {
    const { mezok } = tartalomEpit(alap("zavar", zavarUrlap()), MA);
    expect(mezok["allapot"]).toBe("zavar");
    expect(mezok["allapot_cimke"]).toEqual({ elsodleges: "Lezárva" });
    expect(mezok["focim"]).toEqual({ elsodleges: "Bolyai utca, Rózsák tere – Kossuth utca" });
    expect(mezok["jarat"]).toBeUndefined();
    expect(mezok["idoszak"]).toEqual({ kezdet: "08:00", veg: "16:00", veg_kozelito: false });
    expect(mezok["nap"]).toEqual({ elsodleges: "szerda" });
    expect(JSON.stringify(mezok["nap"])).not.toMatch(/\d/); // a recept T2 szabálya: a „nap” mezőben nem állhat szám
    // a képre mondatkezdő nagybetűvel (a recept T5 szabálya); a mezőben marad, amit Tibor írt
    expect(mezok["reszletek"]).toEqual([{ azonosito: "helyette", szoveg: { elsodleges: "Kerülő a Bernády téren át" } }, { azonosito: "kovetkezo_frissites", ido: "12:00" }]);
    expect(mezok["azonosito_sor"]).toEqual({ sorszam: 14, datum: "2026-10-07" });
  });

  it("„Románul is”: a sáv, a nap és a szövegek második nyelve; a hiányzó román mező egynyelvű marad", () => {
    const { mezok } = tartalomEpit(alap("zavar", zavarUrlap(), { ro: { hol: "strada Bolyai" } }), MA);
    expect(mezok["allapot_cimke"]).toEqual({ elsodleges: "Lezárva", masodlagos: "Închis" });
    expect(mezok["focim"]).toEqual({ elsodleges: "Bolyai utca, Rózsák tere – Kossuth utca", masodlagos: "Strada Bolyai" });
    expect(mezok["nap"]).toEqual({ elsodleges: "szerda", masodlagos: "miercuri" });
    expect((mezok["reszletek"] as { szoveg?: unknown }[])[0]!.szoveg).toEqual({ elsodleges: "Kerülő a Bernády téren át" });
  });

  it("közlekedési munkatér (tomegkozlekedes csomag): „Melyik járat?” → a járat kódja, a főcím a járat neve", () => {
    expect(holFajta(["kozlekedes"])).toBe("hol");
    expect(holFajta(["kozlekedes", "tomegkozlekedes"])).toBe("jarat");
    const u = zavarUrlap();
    u.zavar.hol = "23";
    const { mezok } = tartalomEpit(alap("zavar", u, { holFajta: "jarat", ro: {} }), MA);
    expect(mezok["jarat"]).toEqual({ kod: "23" });
    expect(mezok["focim"]).toEqual({ elsodleges: "23. járat", masodlagos: "Linia 23" });
  });

  it("idő nélkül nincs „idoszak”; rossz idő sem kerül a képre; „8” → „08:00”", () => {
    const u = zavarUrlap();
    u.zavar.kezdet = "8 óra";
    expect(tartalomEpit(alap("zavar", u), MA).mezok["idoszak"]).toBeUndefined();
    expect(idoNormal("8")).toBe("08:00");
    expect(idoNormal("800")).toBe("08:00");
    expect(idoNormal("16.30")).toBe("16:30");
    expect(idoNormal("25:00")).toBe("25:00");
  });

  it("Egy mondat: a mondat a főcím, a mai dátum; a kép a rövidebb javaslatot mutatja, ha kérjük (kerdesek 5)", () => {
    const u = uresUrlap(MA);
    u.allitas.mondat = "Harminc éve burkolunk Marosvásárhelyen, és minden udvart úgy rakunk le, mint a sajátunkat.";
    const r = tartalomEpit(alap("allitas", u, { ro: { mondat: "De treizeci de ani pavăm în Târgu Mureș." }, rovidites: { mondat: "Harminc éve burkolunk Marosvásárhelyen." } }), MA).mezok;
    expect(r["focim"]).toEqual({ elsodleges: "Harminc éve burkolunk Marosvásárhelyen.", masodlagos: "De treizeci de ani pavăm în Târgu Mureș." });
    expect(r["azonosito_sor"]).toEqual({ sorszam: 14, datum: MA });
    expect(r["rovat_cimke"]).toBeUndefined();
  });

  it("Számokban: rovatcímke, sávok (2–4, 0–100), forrás vagy „csak példa” → a fiók nyilatkozata", () => {
    const u = uresUrlap(MA);
    u.adatsavok = { cim: "Mit mondanak az ügyfeleink?", sorok: [{ nev: "Időben elkészült", szam: "96" }, { nev: "Ajánlana minket", szam: "92,5" }, { nev: "", szam: "" }], honnan: "Saját kérdőív, 64 ügyfél", csakPelda: false };
    const r = tartalomEpit(alap("adatsavok", u), MA).mezok;
    expect(r["rovat_cimke"]).toEqual({ elsodleges: "Számokban" });
    expect(r["savok"]).toEqual([{ cimke: { elsodleges: "Időben elkészült" }, ertek: 96 }, { cimke: { elsodleges: "Ajánlana minket" }, ertek: 92.5 }]);
    expect(r["forras"]).toEqual({ valos: { elsodleges: "Saját kérdőív, 64 ügyfél" } });
    u.adatsavok.csakPelda = true;
    expect(tartalomEpit(alap("adatsavok", u), MA).mezok["forras"]).toEqual({ nyilatkozat: true });
  });

  it("mi hiányzik: Hol? · a mondat · a cím, legalább két jó sor, forrás vagy „csak példa”; 0–100", () => {
    const u = uresUrlap(MA);
    expect(hianyzo("zavar", u)).toBe("hol");
    expect(hianyzo("allitas", u)).toBe("mondat");
    expect(hianyzo("adatsavok", u)).toBe("cim");
    u.adatsavok.cim = "Cím";
    u.adatsavok.sorok = [{ nev: "A", szam: "10" }, { nev: "B", szam: "120" }];
    expect(hianyzo("adatsavok", u)).toBe("savok");
    u.adatsavok.sorok[1]!.szam = "20";
    expect(hianyzo("adatsavok", u)).toBe("honnan");
    u.adatsavok.csakPelda = true;
    expect(hianyzo("adatsavok", u)).toBeNull();
    expect(szamErtelmez("101")).toEqual({ ok: false });
    expect(szamErtelmez("33,3 %")).toEqual({ ok: true, ertek: 33.3 });
    expect(szamErtelmez("")).toEqual({ ok: true, ertek: null });
  });
});

describe("VZ-1 · posztból kitöltés (gepezet 2) — a gép válaszának ellenőrzése", () => {
  it("csak a helyes alakú mezők jönnek át; a hiányzó üres marad (nincs kitalált tény); a nap hiányában a mai nap", () => {
    const v = kitoltesErtelmez("zavar", { zavar: { allapot: "lezarva", hol: "  Bolyai utca  ", nap: null, kezdet: "8:00", veg: "16:00", veg_kb: true, helyette: null, frissites: "12:00" } }, MA);
    expect(v.zavar).toEqual({ allapot: "zavar", hol: "Bolyai utca", nap: MA, kezdet: "", veg: "", vegKb: false, helyette: "", frissites: "12:00" });
  });
  it("Számokban: legfeljebb négy sáv, csak 0–100; legalább két (üres) sor a lapon", () => {
    const v = kitoltesErtelmez("adatsavok", { adatsavok: { cim: "Ügyfeleink", savok: [{ nev: "A", szam: 50 }, { nev: "B", szam: 150 }, { nev: "", szam: 3 }], forras: "Kérdőív" } }, MA);
    expect(v.adatsavok).toEqual({ cim: "Ügyfeleink", sorok: [{ nev: "A", szam: "50" }, { nev: "", szam: "" }], honnan: "Kérdőív", csakPelda: false });
  });
  it("nem objektum válasz: üres lap", () => {
    expect(kitoltesErtelmez("allitas", "nem json", MA)).toEqual({ allitas: { mondat: "" } });
  });
});

describe("VZ-1 · ha nem fér ki — egy mondat, kész rövidebb javaslattal; a szabálynév nem Tiboré", () => {
  const valasz = (m: Partial<KepValasz>): KepValasz => ({ kep: "", mezok: [], kepalairas: [], jelzesek: [], tiltott: false, ...m });
  it("piros főcím → „nem fér” a lap mezőjén; a második nyelv csak akkor rövidül, ha az is túl hosszú", () => {
    const u = uresUrlap(MA);
    u.allitas.mondat = "Harminc éve burkolunk Marosvásárhelyen, és minden udvart úgy rakunk le, mint a sajátunkat.";
    expect(bajKeres("allitas", valasz({ mezok: [{ mezo: "focim", allapot: "piros", lepesek: [], problemak: [{ reszlet: "elsodleges: 4 sor > 3" }] }] }), u))
      .toEqual({ fajta: "nem_fer", lapMezo: "mondat", masodikIs: false });
    expect(bajKeres("allitas", valasz({ mezok: [{ mezo: "focim", allapot: "piros", lepesek: [], problemak: [{ reszlet: "masodlagos: 3 sor > 2" }] }] }), u))
      .toMatchObject({ masodikIs: true });
    expect(rovidebb(u.allitas.mondat)).toBe("Harminc éve burkolunk Marosvásárhelyen.");
  });
  it("a sávcímke túl hosszú (A7) → az érintett sor, 22 karakteres javaslat", () => {
    const u = uresUrlap(MA);
    u.adatsavok.sorok = [{ nev: "Időben elkészült", szam: "96" }, { nev: "tisztán hagytuk a terepet", szam: "88" }];
    const b = bajKeres("adatsavok", valasz({ jelzesek: [{ szabaly: "A7", szigorusag: "tiltas", mezo: "savok", reszlet: "„Tisztán hagytuk a terepet…” 25 karakter > 22", arculati: false }] }), u);
    expect(b).toEqual({ fajta: "nem_fer", lapMezo: "sor1", masodikIs: false });
    expect(rovidCimke("Tisztán hagytuk a terepet").length).toBeLessThanOrEqual(22);
  });
  it("az arculatból eredő tiltás nem állítja meg Tibort; a nem arculati tiltás egy mondat; mindkettő a rendszergazdáé", () => {
    const u = uresUrlap(MA);
    const v = valasz({ jelzesek: [{ szabaly: "T3", szigorusag: "tiltas", mezo: "idoszak", reszlet: "Reddit Mono", arculati: true }] });
    expect(bajKeres("zavar", v, u)).toBeNull();
    const v2 = valasz({ jelzesek: [...v.jelzesek, { szabaly: "T5", szigorusag: "tiltas", mezo: "focim", reszlet: "x", arculati: false }] });
    expect(bajKeres("zavar", v2, u)).toEqual({ fajta: "szabaly", lapMezo: "hol" });
    expect(jelzesKivonat(v2).map((j) => [j.szabaly, j.arculati])).toEqual([["T3", true], ["T5", false]]);
  });
  it("mezők olvasása / írása; mondatkezdő; a hét napja románul", () => {
    let u = uresUrlap(MA);
    u = ertekIr(u, "sor1", "Új név");
    expect(ertekOlvas(u, "sor1")).toBe("Új név");
    expect(mondatKezdo("  kerülő  út ")).toBe("Kerülő út");
    expect(hetNapja("2026-10-08", "ro")).toBe("joi");
  });
});
