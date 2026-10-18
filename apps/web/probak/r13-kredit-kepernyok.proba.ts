// R-13 kredit-képernyők — élő próbák a lapokra és a gépezetükre (design/R13/rajz/R13-lapok.dc.html, gepezet.md).
// Ki mit lát (a Kreditek nézet csak a tulajdonosé), a tenant-határ (A-11: más munkatér tagjának kreditje nem írható),
// és hogy a lapok a valódi állapotot mutatják (elfogyott kredit → 13a3 · 13d2 · 13d3 · 13d4). Realisztikus nevek: ékezet, kötőjel, vessző.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const jelszo = "ProbaJelszo123!";
type Fiok = { sutik: string; fiokId: string; szervezetId: string };

async function fiok(nev: string, szervezet: string | null): Promise<Fiok> {
  const email = veletlenEmail();
  const r = await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
  expect(r.statusz).toBe(201);
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  let szervezetId = "";
  if (szervezet) {
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik });
    expect(sz.statusz).toBe(201);
    szervezetId = sz.torzs.id;
  }
  return { sutik, fiokId: r.torzs.id, szervezetId };
}

/** A „Kreditek ›” sor LÁTHATÓ szövege (a lap a feliratszótárt is magával viszi, ezért a puszta „tartalmazza” nem elég). */
const kreditSor = (html: string) => (html.match(/href="\/tagok\/kreditek"><span>([^]*?)<\/span>/)?.[1] ?? "").replace(/<!-- -->/g, "");

const honap = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit" }).format(new Date());

describe("R-13 kredit-képernyők (élő)", () => {
  let tibor: Fiok; // tulajdonos, Kovács Burkolat Kft.
  let anna: Fiok; // szerkesztő ugyanott
  let bence: Fiok; // néző ugyanott
  let masik: Fiok; // tulajdonos egy MÁSIK munkatérben (A-11)
  let munka = ""; // egy saját ötletből indított poszt (a Posztszöveg elfogyott-állapotához)

  beforeAll(async () => {
    tibor = await fiok("Kovács Tibor", "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely");
    anna = await fiok("Szabó-Nagy Anna Réka", null);
    bence = await fiok("Kovács Bence", null);
    masik = await fiok("Fenyő Ágnes", "Fenyő Asztalosműhely, Szászrégen");
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'szerkeszto'), ($1, $3, 'nezo')", [tibor.szervezetId, anna.fiokId, bence.fiokId]);
    await sql("UPDATE szervezet SET kredit_havi = 1500 WHERE id = $1", [tibor.szervezetId]);
    const p = await keres<{ munka?: { id: string } }>("/api/poszt", { modszer: "POST", sutik: tibor.sutik,
      torzs: { forras: { tipus: "sajat", azonosito: "", cim: "", url: "", szoveg: "" }, cim: "Díszburkolat, térkő — Marosvásárhely", felulet: "fb", nyelv: "hu", uj: true } });
    expect(p.statusz).toBe(200);
    munka = p.torzs.munka?.id ?? "";
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("a Tagok lapon a tulajdonosnak ott a halk „Kreditek” sor, a Kreditek nézet tulajdonosnak 200, a tagok neveivel", async () => {
    const tagok = await keres<string>("/tagok", { sutik: tibor.sutik });
    expect(tagok.statusz).toBe(200);
    expect(kreditSor(tagok.torzs)).toBe("Kreditek · mindenki egyenlő részt kap");
    const nezet = await keres<string>("/tagok/kreditek", { sutik: tibor.sutik });
    expect(nezet.statusz).toBe(200);
    expect(nezet.torzs).toContain(">Így osztjuk el a gép munkáját<");
    expect(nezet.torzs).toContain(">Szabó-Nagy Anna Réka<");
    expect(nezet.torzs).toContain(">500 kredit<"); // 1500 / 3 tag, egyenlő rész
  });

  it("a szerkesztő a Kreditek nézet helyett a Tagokra kerül, a „Kreditek” sor nélkül; a néző a Kezdőlapra", async () => {
    await keres("/api/szervezet/valt", { modszer: "POST", sutik: anna.sutik, torzs: { szervezet_id: tibor.szervezetId } });
    await keres("/api/szervezet/valt", { modszer: "POST", sutik: bence.sutik, torzs: { szervezet_id: tibor.szervezetId } });
    const a = await keres<string>("/tagok/kreditek", { sutik: anna.sutik });
    expect([200, 307]).toContain(a.statusz);
    const aTagok = await keres<string>("/tagok", { sutik: anna.sutik });
    expect(kreditSor(aTagok.torzs)).toBe("");
    const r = await fetch(`${process.env.PROBA_CIM ?? "http://127.0.0.1:3000"}/tagok/kreditek`, { headers: { cookie: `${bence.sutik}; km_nyelv=hu` }, redirect: "manual" });
    expect(r.headers.get("location") ?? "").toContain("/kezdolap");
    const ra = await fetch(`${process.env.PROBA_CIM ?? "http://127.0.0.1:3000"}/tagok/kreditek`, { headers: { cookie: `${anna.sutik}; km_nyelv=hu` }, redirect: "manual" });
    expect(ra.headers.get("location") ?? "").toMatch(/\/tagok$/);
  });

  it("A-11: más munkatér tulajdonosa nem írhatja át egy tag kreditjét (404), a sor változatlan marad", async () => {
    const v = await keres("/api/kredit/tagok/" + anna.fiokId, { modszer: "PUT", sutik: masik.sutik, torzs: { havi: 9999 } });
    expect(v.statusz).toBe(404);
    const [sor] = await sql<{ kredit_havi: string | null }>("SELECT kredit_havi FROM tagsag WHERE szervezet_id = $1 AND fiok_id = $2", [tibor.szervezetId, anna.fiokId]);
    expect(sor?.kredit_havi).toBeNull();
  });

  it("13b2: a tulajdonos külön összeget ad (800), a nézet „külön” jellel mutatja, a többiek egyenlő része újraszámolódik; vissza egyenlőre", async () => {
    const v = await keres("/api/kredit/tagok/" + anna.fiokId, { modszer: "PUT", sutik: tibor.sutik, torzs: { havi: 800 } });
    try {
      expect(v.statusz).toBe(200);
      const nezet = await keres<string>("/tagok/kreditek", { sutik: tibor.sutik });
      expect(nezet.torzs).toContain(">800 kredit<");
      expect(nezet.torzs).toContain(">350 kredit<");
      const tagok = await keres<string>("/tagok", { sutik: tibor.sutik });
      expect(kreditSor(tagok.torzs)).toBe("Kreditek"); // van külön összeg → csak „Kreditek ›”
    } finally {
      const vissza = await keres("/api/kredit/tagok/" + anna.fiokId, { modszer: "PUT", sutik: tibor.sutik, torzs: { havi: null } });
      expect(vissza.statusz).toBe(200);
    }
  });

  it("13a: a Saját fiók tetején a hírek mondata és a saját kredit-sor; elfogyott kreditnél a 13a3 (szerkesztőnek „szólj a tulajdonosnak”)", async () => {
    const tl = await keres<string>("/sajat-fiok", { sutik: tibor.sutik });
    expect(tl.torzs).toContain("Ilyen hírekből írunk neked posztot");
    expect(tl.torzs).toContain(">Kreditjeid: 500 / 500 ebben a hónapban<");
    await sql("INSERT INTO kredit_mozgas (szervezet_id, fiok_id, honap, ezred, feladat) VALUES ($1, $2, $3, 500000, 'poszt_iras')", [tibor.szervezetId, anna.fiokId, honap()]);
    const a = await keres<string>("/sajat-fiok", { sutik: anna.sutik });
    expect(a.torzs).toContain(">E hónapban több posztot nem írunk<");
    expect(a.torzs).toContain(">Ha most kell több, szólj a munkatér tulajdonosának.<");
    // 10-06 MÓDOSÍTVA (Csilla, 4. döntés): a hírek beállítása elfogyott kreditnél sem tűnik el, hanem halványan a lap alján marad —
    // ezért nem a hiányát mérjük, hanem hogy a fő kérdés (h1) nem ez, és a szakasz a halvány tárolóban van.
    expect(a.torzs).not.toMatch(/<h1[^>]*>Ilyen hírekből írunk neked posztot<\/h1>/);
    expect(a.torzs).toContain('data-r13="halvany"');
  });

  it("13b3: a Kreditek nézet címe megmondja, kinek fogyott el; 13d2: a Kezdőlapon a nyugodt teendő-sor", async () => {
    const nezet = await keres<string>("/tagok/kreditek", { sutik: tibor.sutik });
    expect(nezet.torzs).toContain(">Szabó-Nagy Anna Réka kreditje elfogyott<");
    expect(nezet.torzs).toContain(">Többet adok neki<");
    const k = await keres<string>("/kezdolap", { sutik: anna.sutik });
    expect(k.statusz).toBe(200);
    expect(k.torzs).toMatch(/Elfogyott a havi kredited: új posztot e hónapban nem írunk\.<\/p>/);
    expect(k.torzs).toContain('href="/sajat-fiok"');
    const kt = await keres<string>("/kezdolap", { sutik: tibor.sutik });
    expect(kt.torzs).not.toMatch(/Elfogyott a havi kredited: új posztot e hónapban nem írunk\.<\/p>/); // csak neki áll le
    // Csilla 10-06 (2): a kredit-sor csak a „Mára kész vagy” állapotban — itt egy poszt vár (03b), tehát nincs
    expect(kt.torzs).not.toMatch(/>Kreditjeid: [0-9,]+ \/ [0-9,]+ ebben a hónapban</);
  });

  it("Csilla 10-06 (3): elfogyott kreditnél a Posztszöveg a TULAJDONOSNAK halk linket ad a Kreditek nézetre; a tag mondata változatlan", async () => {
    await sql("INSERT INTO kredit_mozgas (szervezet_id, fiok_id, honap, ezred, feladat) VALUES ($1, $2, $3, 500000, 'poszt_iras')", [tibor.szervezetId, tibor.fiokId, honap()]);
    const t = await keres<string>(`/poszt?munka=${munka}`, { sutik: tibor.sutik });
    expect(t.statusz).toBe(200);
    expect(t.torzs).toMatch(/<a class="r15-halk-link" href="\/tagok\/kreditek">Szeretnél több kreditet\?<\/a>/);
    expect(t.torzs).not.toContain(">Elfogyott a kredited ebben a hónapban — szólj a munkatér tulajdonosának.<");
    const a = await keres<string>(`/poszt?munka=${munka}`, { sutik: anna.sutik }); // Anna kreditje az előző próbától elfogyott
    expect(a.torzs).toContain(">Elfogyott a kredited ebben a hónapban — szólj a munkatér tulajdonosának.<");
    expect(a.torzs).not.toMatch(/href="\/tagok\/kreditek">Szeretnél több kreditet/);
  });

  it("Csilla 10-06 (4): a Saját fiók elfogyott-állapotában a hírek beállítása látszik, halványan, és az Átírom használható", async () => {
    const t = await keres<string>("/sajat-fiok", { sutik: tibor.sutik });
    expect(t.torzs).toContain(">E hónapban több posztot nem írunk<");
    expect(t.torzs).toMatch(/<section class="r15-lap-belso r13a-halvany" data-r13="halvany"[^>]*><h2 class="r13-szakasz-cim">Ilyen hírekből írunk neked posztot<\/h2>/);
    expect(t.torzs).toMatch(/r13a-halvany[\s\S]*>Átírom<\/button>/);
    // a beállítás elfogyott kreditnél is menthető (a halvány szakasz gépezete ugyanaz)
    const put = await keres("/api/hirfigyelo/sajat-szures", { modszer: "PUT", sutik: tibor.sutik, torzs: { fokozat: "laza", eloszures: true } });
    expect(put.statusz).toBe(200);
  });
});
