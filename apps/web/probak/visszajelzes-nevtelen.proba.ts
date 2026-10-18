// 0148 (Kati 10-02, Csilla 10-06): a lebegő Visszajelzés gomb a belépés ELŐTTI lapokon is (fiók létrehozása, belépés, első beállítás).
// Munkamenet nélkül a beküldés NÉVTELEN, és a belépési védelem mintájára szűk úton megy (app/api/visszajelzes/route.ts):
//   - cím szerinti sebességkorlát: 10 kísérlet / óra / cím, minden kísérlet számít (hitelesites/korlat.ts „visszajelzes”);
//   - a törzs legfeljebb 450 000 bájt (a beolvasás közben megáll), a szöveg legfeljebb 1000 karakter;
//   - kép csak a modul saját képernyőképe: PNG adat-URL (base64) — más fájl, más formátum nem.
// A belépett, munkatérrel rendelkező beküldő útja változatlan (nincs korlát, a szerződés határai). A névtelen sor CSAK a rendszergazda
// listájában jelenik meg, a tulajdonoséban nem (A-11). Élő próba: PROBA_CIM + DATABASE_URL.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const jelszo = "ProbaJelszo123!";
const JEL = `nevtelen-proba-${crypto.randomUUID().slice(0, 8)}`;
// valódi, apró PNG (1×1) — a modul is PNG adat-URL-t küld (html-to-image toPng)
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
// a próba saját, dokumentációs címtartományból (TEST-NET-2), hogy a többi próba számlálóit ne érintse
const IP_A = "198.51.100.71";
const IP_B = "198.51.100.72";
const IP_C = "198.51.100.73";

function torzs(szoveg: string, kep: string | null = PNG, lap = `/regisztracio?${JEL}`) {
  return { lap, lap_cim: "Fiók létrehozása — Kommunikációs munkatér", elem: null, kijelolt_szoveg: "", szoveg, nyelv: "hu", kep, ablak: { w: 390, h: 844 } };
}
const bekuld = (t: unknown, ip: string, sutik?: string) =>
  keres<{ visszajelzes?: { id: string }; hiba?: string }>("/api/visszajelzes", { modszer: "POST", torzs: t, fejlecek: { "x-forwarded-for": ip }, ...(sutik ? { sutik } : {}) });

type Fiok = { sutik: string; fiokId: string };
async function fiok(nev: string, munkater: string | null): Promise<Fiok> {
  const email = veletlenEmail();
  const r = await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
  expect(r.statusz).toBe(201);
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  if (munkater) expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: munkater }, sutik })).statusz).toBe(201);
  return { sutik, fiokId: r.torzs.id };
}

async function takarit() {
  await sql("DELETE FROM visszajelzes WHERE lap LIKE $1", [`%${JEL}%`]);
  await sql("DELETE FROM belepesi_kiserlet WHERE fajta = 'visszajelzes' AND cim = ANY($1)", [[IP_A, IP_B, IP_C]]);
}

describe("névtelen visszajelzés a belépés előtti lapokról (0148)", () => {
  let tibor: Fiok; // tulajdonos, munkatérrel
  let uj: Fiok; // belépett, még munkatér nélkül (a „Hozd létre a munkateret” lapon)
  let gazda: Fiok; // rendszergazda

  beforeAll(async () => {
    await takarit();
    tibor = await fiok("Kovács Tibor", "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely");
    uj = await fiok("Szőcs-Bartha Enikő", null);
    gazda = await fiok("Rendszergazda Réka", null);
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [gazda.fiokId]);
  });

  afterAll(async () => {
    await takarit();
    await takaritas();
    await lezar();
  });

  it("munkamenet nélkül: 201, a sor névtelen (nincs fiók, nincs munkatér), a szöveg és a kép épen", async () => {
    const szoveg = "A „Jelszó mutatása” gomb nem működik a telefonomon, Marosvásárhely, Rózsák tere — ő, ű, ș, ț is megy?";
    const r = await bekuld(torzs(szoveg), IP_A);
    expect(r.statusz).toBe(201);
    const [sor] = await sql<{ nevtelen: boolean; fiok_id: string | null; szervezet_id: string | null; fiok_nev: string; szoveg: string; kep: string }>(
      "SELECT nevtelen, fiok_id, szervezet_id, fiok_nev, szoveg, kep FROM visszajelzes WHERE id = $1", [r.torzs.visszajelzes?.id]);
    expect(sor).toMatchObject({ nevtelen: true, fiok_id: null, szervezet_id: null, fiok_nev: "", szoveg, kep: PNG });
  });

  it("munkamenet nélkül szigorúbb határ: nem PNG kép, nem adat-URL, 1000 karakternél hosszabb szöveg → 400", async () => {
    expect((await bekuld(torzs("svg kép", "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="), IP_A)).statusz).toBe(400);
    expect((await bekuld(torzs("html", "data:text/html;base64,PGgxPmhpPC9oMT4="), IP_A)).statusz).toBe(400);
    expect((await bekuld(torzs("külső cím", "https://pelda.example/kep.png"), IP_A)).statusz).toBe(400);
    expect((await bekuld(torzs("rossz base64", "data:image/png;base64,<script>"), IP_A)).statusz).toBe(400);
    expect((await bekuld(torzs("á".repeat(1001)), IP_A)).statusz).toBe(400);
    expect((await bekuld(torzs("á".repeat(1000)), IP_A)).statusz).toBe(201);
    // a belépett, munkatérrel rendelkező beküldőnek a szerződés határa marad (2000)
    expect((await bekuld(torzs("é".repeat(1500)), IP_C, tibor.sutik)).statusz).toBe(201);
  });

  it("munkamenet nélkül a túl nagy törzs 413 (a beolvasás a határon megáll)", async () => {
    const nagy = torzs("nagy kép", `data:image/png;base64,${"A".repeat(460_000)}`);
    const r = await bekuld(nagy, IP_C);
    expect(r.statusz).toBe(413);
    expect(r.torzs.hiba).toBe("TUL_NAGY");
  });

  it("sebességkorlát: egy címről 10 kísérlet / óra, a 11. → 429 Retry-After-rel; másik cím közben szabad", async () => {
    const kodok: number[] = [];
    for (let i = 1; i <= 10; i++) kodok.push((await bekuld(torzs(`${i}. próba, ékezettel: árvíztűrő tükörfúrógép`), IP_B)).statusz);
    expect(kodok).toEqual(Array(10).fill(201));
    const tizenegyedik = await bekuld(torzs("11. — ez már sok"), IP_B);
    expect(tizenegyedik.statusz).toBe(429);
    expect(tizenegyedik.torzs.hiba).toBe("TUL_SOK_KISERLET");
    expect(Number(tizenegyedik.fejlecek.get("retry-after"))).toBe(3600);
    const [tul] = await sql<{ db: number }>("SELECT count(*)::int AS db FROM visszajelzes WHERE lap LIKE $1 AND szoveg LIKE '11.%'", [`%${JEL}%`]);
    expect(tul?.db, "a korlát fölötti beküldés nem került a táblába").toBe(0);
    // a rossz kérések is számítanak (mint a regisztrációnál): a C címről a 413 már egy kísérlet volt
    expect((await bekuld(torzs("másik cím"), IP_C)).statusz).toBe(201);
  });

  it("belépett, munkatérrel: a régi út — nincs korlát (11 beküldés ugyanarról a címről), a sor a fiókhoz és a munkatérhez kötött", async () => {
    const kodok: number[] = [];
    for (let i = 1; i <= 11; i++) kodok.push((await bekuld(torzs(`Tibor ${i}. megjegyzése`, null, `/kezdolap?${JEL}`), IP_B, tibor.sutik)).statusz);
    expect(kodok).toEqual(Array(11).fill(201));
    const [sor] = await sql<{ nevtelen: boolean; fiok_id: string; szervezet_id: string | null }>(
      "SELECT nevtelen, fiok_id, szervezet_id FROM visszajelzes WHERE lap = $1 AND szoveg = 'Tibor 1. megjegyzése'", [`/kezdolap?${JEL}`]);
    expect(sor?.nevtelen).toBe(false);
    expect(sor?.fiok_id).toBe(tibor.fiokId);
    expect(sor?.szervezet_id).not.toBeNull();
  });

  it("belépett, de még munkatér nélkül: a fiók ismert, a munkatér nincs, a szűk út határai érvényesek", async () => {
    const r = await bekuld(torzs("A munkatér nevénél nem tudom, mit írjak.", PNG, `/szervezet/uj?${JEL}`), IP_C, uj.sutik);
    expect(r.statusz).toBe(201);
    const [sor] = await sql<{ nevtelen: boolean; fiok_id: string; szervezet_id: string | null; fiok_nev: string }>(
      "SELECT nevtelen, fiok_id, szervezet_id, fiok_nev FROM visszajelzes WHERE id = $1", [r.torzs.visszajelzes?.id]);
    expect(sor).toMatchObject({ nevtelen: false, fiok_id: uj.fiokId, szervezet_id: null, fiok_nev: "Szőcs-Bartha Enikő" });
    expect((await bekuld(torzs("svg", "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", `/szervezet/uj?${JEL}`), IP_C, uj.sutik)).statusz).toBe(400);
  });

  it("a lista: a rendszergazda látja a névtelent (nevtelen = igaz), a munkatér tulajdonosa nem (A-11)", async () => {
    const g = await keres<{ visszajelzes: { tetelek: { lap: string; nevtelen?: boolean; fiok_id: string | null }[] } }>("/api/visszajelzes", { sutik: gazda.sutik });
    expect(g.statusz).toBe(200);
    const nevtelenek = g.torzs.visszajelzes.tetelek.filter((x) => x.lap.includes(JEL) && x.nevtelen);
    expect(nevtelenek.length).toBeGreaterThan(0);
    expect(nevtelenek.every((x) => x.fiok_id === null)).toBe(true);
    const t = await keres<{ visszajelzes: { tetelek: { lap: string; nevtelen?: boolean }[] } }>("/api/visszajelzes", { sutik: tibor.sutik });
    expect(t.statusz).toBe(200);
    const sajat = t.torzs.visszajelzes.tetelek.filter((x) => x.lap.includes(JEL));
    expect(sajat.length).toBe(12); // a 11 + az 1500 karakteres — csak a sajátjai
    expect(sajat.some((x) => x.nevtelen)).toBe(false);
  });
});
