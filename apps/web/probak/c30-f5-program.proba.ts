// c30 F5 — the festival programme (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.4, §3, §10 F5; docs/decisions/2026-10-17-c30-f5-program.md).
// Pure part: the parser cleans the Zilele fixture (probak/adat/zilele-2026.json, 88 rows from the real DOCX, the mess put back on purpose),
// the re-read plan keeps a person's work, the DOCX reader reads a SYNTHETIC .docx built here (fake but realistic HU/RO lines) and refuses
// a zip bomb, an oversized file, a non-DOCX file and an XML entity. The real Zilele .docx is a third party's working document with internal
// notes and is NOT in the repo (coordinator 10-17). The real-file check ran once locally on 10-17 (all 88 items' text found, 277 paragraphs)
// and is NOT a test here: the c4 gate refuses new skipped tests (kapu piros 10-17 14:56, „új kimaradt próba”). Live part (PROBA_CIM + DATABASE_URL; test AI; A-11 as km_app needs PROBA_APP_DATABASE_URL):
// RLS on, no DELETE privilege, another org sees 0 rows and cannot update; the endpoints read a real .docx, keep an edited row on re-read.
import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ProgramTetel } from "@km/contracts";
import { DOCX_KORLAT, docxSzoveg } from "../program/docx";
import { idoOlvas, napOlvas, programKulcs, programTisztit, ujraOlvasTerv, type RegiSor, type TisztaTetel } from "../program/szabaly";
import { programBlokk } from "../program/blokk";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const adat = (f: string) => new URL(`./adat/${f}`, import.meta.url);
const FIX = JSON.parse(readFileSync(adat("zilele-2026.json"), "utf8")) as { ev: number; napok: Record<string, number>; nyers: unknown; vart: TisztaTetel[] };
const nev = (t: TisztaTetel) => t.nev.ro ?? t.nev.hu ?? "";
const keresTetel = (l: TisztaTetel[], eleje: string) => l.find((t) => nev(t).startsWith(eleje) || (t.nev.hu ?? "").startsWith(eleje))!;

describe("F5 pure: the parser cleans the Zilele fixture", () => {
  const tiszta = programTisztit(FIX.nyers, { ev: FIX.ev });

  it("88 rows, exactly the hand-checked list; per day 8 · 25 · 25 · 26 + 4 for the whole event; 87 active (the internal note is not)", () => {
    expect(tiszta).toEqual(FIX.vart);
    expect(tiszta.length).toBe(88);
    const napok: Record<string, number> = {};
    for (const t of tiszta) napok[t.nap ?? "egesz"] = (napok[t.nap ?? "egesz"] ?? 0) + 1;
    expect(napok).toEqual(FIX.napok);
    expect(napok).toEqual({ "2026-06-25": 8, "2026-06-26": 25, "2026-06-27": 25, "2026-06-28": 26, egesz: 4 });
    expect(tiszta.filter((t) => t.aktiv).length).toBe(87);
  });

  it("the messy items: „10:00???????” → 10:00 + bizonytalan; the internal note never aktiv; the RO-only item has a RO name only", () => {
    const zaszlo = keresTetel(tiszta, "Sărbătorirea Zilei Drapelului");
    expect([zaszlo.nap, zaszlo.kezdes, zaszlo.bizonytalan, zaszlo.aktiv]).toEqual(["2026-06-26", "10:00", true, true]);
    const jegyzet = keresTetel(tiszta, "A ZÁSZLÓ NAPJÁT");
    expect([jegyzet.aktiv, jegyzet.bizonytalan]).toEqual([false, true]);
    const konf = keresTetel(tiszta, "Conferință și lansare de carte");
    expect(Object.keys(konf.nev)).toEqual(["ro"]);
    expect(konf.nev.ro).toBe("Conferință și lansare de carte - Cartea de oaspeți a Sanatoriului Czakó");
    expect([konf.nap, konf.kezdes, konf.vege]).toEqual(["2026-06-27", "11:00", "14:00"]);
  });

  it("time ranges, ampersands, diacritics, the source typo kept, ALL-CAPS venues in the programme's own spelling, emoji off the name", () => {
    const edo = keresTetel(tiszta, "Edo");
    expect([edo.kezdes, edo.vege]).toEqual(["18:00", "20:30"]);
    expect(keresTetel(tiszta, "Aura Șova").nev).toEqual({ ro: "Aura Șova & Band", hu: "Aura Șova & Band" });
    expect(keresTetel(tiszta, "Aura Șova").fellepo).toBe("Aura Șova & Band");
    expect(keresTetel(tiszta, "Kilyén Ilka").nev.ro).toBe("Kilyén Ilka și Rițiu Krisztina – folclor");
    expect(tiszta.some((t) => t.nev.hu === "Maros Együttes (román tag ozat)")).toBe(true); // never „corrected”
    expect(keresTetel(tiszta, "Kökény Attila").helyszin).toEqual({ ro: "Piața Victoriei – Scena Principală", hu: "Győzelem Tér – Nagyszínpad" });
    expect(keresTetel(tiszta, "Ioana Ignat").helyszin).toEqual({ ro: "Cetatea Medievală", hu: "Középkori Vár" });
    expect(tiszta.find((t) => t.nap === null && t.nev.hu === "Középkori Vár")).toBeTruthy();
    expect(keresTetel(tiszta, "Gențiana").fajta).toBe("koncert"); // „concert” → koncert
    expect(keresTetel(tiszta, "Spectacol de artificii").fajta).toBe("egyeb"); // „fireworks” is not on the list → egyeb
    expect(keresTetel(tiszta, "Trupă maghiară").fellepo).toBe(""); // an unnamed act gets no invented performer
  });

  it("dates and times: the forms the machine may use; impossible values → null, never a guess", () => {
    expect(["2026-06-27", "27.06.2026", "27.06.", "27 iunie", "június 27.", "2026. június 27.", "27 june"].map((x) => napOlvas(x, 2026))).toEqual(Array(7).fill("2026-06-27"));
    expect(["31.02.2026", "2026-13-01", "holnap", "", 27].map((x) => napOlvas(x, 2026))).toEqual([null, null, null, null, null]);
    expect(idoOlvas("24:00")).toEqual({ kezdes: null, vege: null, bizonytalan: false });
    expect(idoOlvas("9.30")).toEqual({ kezdes: "09:30", vege: null, bizonytalan: false });
    expect(idoOlvas("21:45", "23:00")).toEqual({ kezdes: "21:45", vege: "23:00", bizonytalan: false });
    expect(idoOlvas("egész nap")).toEqual({ kezdes: null, vege: null, bizonytalan: false });
  });

  it("the prompt slice: one anchored item, or that day's active items (never the internal note), ≤ 25 lines", () => {
    // c30 F6: ProgramTetel gained `kep_fajl_id` (rajz D4 „Fotó hozzá”) — the expectation is unchanged, the test object just carries the new field
    const tetelek: ProgramTetel[] = tiszta.map((t, i) => ({ ...t, id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, forras: "gep", modositva: false, kep_fajl_id: null }));
    const nap26 = programBlokk(tetelek, { nap: "2026-06-26" }, "hu");
    expect(nap26.length).toBe(24);
    expect(nap26.join("\n")).not.toContain("MEG KELL CSINÁLNI");
    expect(nap26.join("\n")).toContain("bizonytalan — ne állíts róla időt");
    const kokeny = tetelek.find((t) => t.nev.hu === "Kökény Attila")!;
    expect(programBlokk(tetelek, { id: kokeny.id }, "hu")).toEqual(["2026-06-28 · 20:00 · Kökény Attila · Győzelem Tér – Nagyszínpad"]);
  });
});

describe("F5 pure: a re-read never overwrites a person's work", () => {
  const uj = programTisztit(FIX.nyers, { ev: FIX.ev });
  const kokeny = uj.find((t) => t.nev.hu === "Kökény Attila")!;
  const voltaj = uj.find((t) => t.nev.hu === "Voltaj")!;
  const sor = (id: string, t: TisztaTetel, m: Partial<RegiSor> = {}): RegiSor => ({ id, forras: "gep", modositva: false, gepKulcs: programKulcs(t), nap: t.nap, kezdes: t.kezdes, nev: t.nev, ...m });

  it("edited and own rows stay; the machine's untouched row is refreshed; a row gone from the source is soft-deleted; nothing doubles", () => {
    const regi: RegiSor[] = [
      sor("a", kokeny, { modositva: true, nev: { hu: "Kökény Attila — 20:00, ingyenes" } }), // a person renamed it
      sor("b", voltaj),
      sor("c", { ...voltaj, nev: { hu: "Régi tétel, ami már nincs a programban" }, nap: "2026-06-28", kezdes: "12:00" } as TisztaTetel),
      { id: "d", forras: "sajat", modositva: false, gepKulcs: "", nap: "2026-06-28", kezdes: "13:00", nev: { hu: "Saját tétel: sajtótájékoztató" } },
    ];
    const terv = ujraOlvasTerv(regi, uj);
    expect(terv.megtart.sort()).toEqual(["a", "d"]);
    expect(terv.frissit.map((f) => f.id)).toEqual(["b"]);
    expect(terv.torol).toEqual(["c"]);
    expect(terv.beszur.length).toBe(uj.length - 2); // Kökény (kept as edited) and Voltaj (refreshed) are not inserted again
    expect(terv.beszur.some((t) => t.nev.hu === "Kökény Attila")).toBe(false);
  });
});

/** A tiny ZIP writer for the refusal tests (stored or deflated entries; the reader does not check CRCs). */
function zip(bejegyzesek: { nev: string; adat: Uint8Array; tomorit?: boolean; bevallott?: number }[]): Uint8Array {
  const helyi: Buffer[] = [], kozponti: Buffer[] = [];
  let p = 0;
  for (const b of bejegyzesek) {
    const nev = Buffer.from(b.nev, "utf8");
    const adat = b.tomorit ? deflateRawSync(b.adat) : Buffer.from(b.adat);
    const kibontott = b.bevallott ?? b.adat.length;
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(b.tomorit ? 8 : 0, 8);
    h.writeUInt32LE(adat.length, 18); h.writeUInt32LE(kibontott, 22); h.writeUInt16LE(nev.length, 26);
    helyi.push(h, nev, adat);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(b.tomorit ? 8 : 0, 10);
    c.writeUInt32LE(adat.length, 20); c.writeUInt32LE(kibontott, 24); c.writeUInt16LE(nev.length, 28); c.writeUInt32LE(p, 42);
    kozponti.push(c, nev);
    p += 30 + nev.length + adat.length;
  }
  const cd = Buffer.concat(kozponti);
  const e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(bejegyzesek.length, 8); e.writeUInt16LE(bejegyzesek.length, 10);
  e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(p, 16);
  return new Uint8Array(Buffer.concat([...helyi, cd, e]));
}
/** A synthetic Word document — fake programme lines, the real kinds of mess: diacritics (ő ű ș ț ă â î), a range, „&”, „10:00??”. */
const SZINTETIKUS_SOROK = [
  "VINERI, 3 IULIE   /   PÉNTEK, JÚLIUS 3.",
  "Piața Mare – Scena Principală  /  Nagy tér – Nagyszínpad",
  "18:00–19:30 | Fanfara Țărănească & Prietenii",
  "18:00–19:30 | Fanfara Țărănească & Barátai",
  "20:00 – Concert: Bărbulescu & Fiii",
  "20:00 – Koncert: Bărbulescu és fiai",
  "Centru | Főtér 10:00?? Depunere de coroane – Koszorúzás",
  "Pe tot parcursul zilei  /  Egész nap folyamán",
  "Târgul de flori și ceramică – Virág- és kerámiavásár, Szőnyegbolt utca",
];
const SZINTETIKUS_SZOVEG = [...SZINTETIKUS_SOROK, "Piața Mare\tNagy tér"].join("\n");
const XML = (torzs: string) => new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="x"><w:body>${torzs}</w:body></w:document>`);
const CT = { nev: "[Content_Types].xml", adat: new TextEncoder().encode("<Types/>") };
const xmlSzoveg = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** the .docx bytes: the lines as paragraphs (each in two runs, as Word splits them), then one table row with two cells joined by a tab */
const SZINTETIKUS = zip([
  CT,
  { nev: "word/_rels/document.xml.rels", adat: new TextEncoder().encode("<Relationships/>") },
  { nev: "word/document.xml", tomorit: true, adat: XML(
    SZINTETIKUS_SOROK.map((l) => `<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:t xml:space="preserve">${xmlSzoveg(l.slice(0, 5))}</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${xmlSzoveg(l.slice(5))}</w:t></w:r></w:p>`).join("")
    + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Piața Mare</w:t><w:tab/><w:t>Nagy tér</w:t></w:r></w:p></w:tc></w:tr></w:tbl>') },
]);

describe("F5 pure: the DOCX reader (text only, word/document.xml only, strict caps)", () => {
  it("a synthetic .docx: paragraphs in order, HU/RO diacritics, a time range, an ampersand, „10:00??”, a table cell, &amp; decoded once", () => {
    const r = docxSzoveg(SZINTETIKUS);
    expect(r).toEqual({ ok: true, szoveg: SZINTETIKUS_SZOVEG });
  });

  it("refuses a zip bomb: an honest 50 MB document.xml, and one that lies about its size (the inflate stops at the cap)", () => {
    const nagy = new Uint8Array(50_000_000).fill(0x20);
    expect(docxSzoveg(zip([CT, { nev: "word/document.xml", adat: nagy, tomorit: true }]))).toEqual({ ok: false, hiba: "TOMORITESI_BOMBA" });
    expect(docxSzoveg(zip([CT, { nev: "word/document.xml", adat: nagy, tomorit: true, bevallott: 1000 }]))).toEqual({ ok: false, hiba: "TOMORITESI_BOMBA" });
  });

  it("refuses an oversized file, a non-DOCX file (PNG, PDF, a ZIP without a Word document), an XML entity, too many entries", () => {
    const tul = new Uint8Array(DOCX_KORLAT.maxBajt + 1); tul.set([0x50, 0x4b, 0x03, 0x04]);
    expect(docxSzoveg(tul)).toEqual({ ok: false, hiba: "TUL_NAGY" });
    expect(docxSzoveg(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(40).fill(0)]))).toEqual({ ok: false, hiba: "NEM_DOCX" });
    expect(docxSzoveg(new TextEncoder().encode("%PDF-1.7\n" + "x".repeat(100)))).toEqual({ ok: false, hiba: "NEM_DOCX" });
    expect(docxSzoveg(zip([CT, { nev: "xl/workbook.xml", adat: XML("") }]))).toEqual({ ok: false, hiba: "NEM_DOCX" });
    const xxe = new TextEncoder().encode('<?xml version="1.0"?><!DOCTYPE d [<!ENTITY x SYSTEM "file:///etc/passwd">]><w:document><w:body><w:p><w:r><w:t>&x;</w:t></w:r></w:p></w:body></w:document>');
    expect(docxSzoveg(zip([CT, { nev: "word/document.xml", adat: xxe }]))).toEqual({ ok: false, hiba: "TILTOTT_XML" });
    const sok = Array.from({ length: DOCX_KORLAT.maxBejegyzes + 1 }, (_, i) => ({ nev: `x${i}.xml`, adat: new Uint8Array([0x20]) }));
    expect(docxSzoveg(zip([CT, { nev: "word/document.xml", adat: XML("") }, ...sok]))).toEqual({ ok: false, hiba: "TUL_NAGY" });
  });

  it("text only: paragraphs, tabs and breaks; deleted text, field codes and tab-stop settings are not text", () => {
    const x = XML('<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs></w:pPr><w:r><w:t xml:space="preserve">20:00 </w:t></w:r><w:r><w:tab/><w:t>Kökény &amp; társai</w:t></w:r><w:del><w:r><w:delText>TÖRÖLT</w:delText></w:r></w:del><w:r><w:instrText>HYPERLINK</w:instrText></w:r><w:r><w:br/><w:t>&#x0219;i</w:t></w:r></w:p><w:p/><w:p><w:r><w:t>Vége</w:t></w:r></w:p>');
    expect(docxSzoveg(zip([CT, { nev: "word/document.xml", adat: x, tomorit: true }]))).toEqual({ ok: true, szoveg: "20:00 \tKökény & társai\nși\n\nVége" });
  });
});

async function fiok(nev: string, szervezet: string, nyelvek: string[]): Promise<{ s: string; id: string }> {
  const jelszo = "ProbaJelszo123!";
  const email = veletlenEmail();
  await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: szervezet }, sutik: s })).statusz).toBe(201);
  const o = "Marosvásárhelyi Napok — Zilele Târgumureșene: négy nap koncert, vásár és tűzijáték június végén a belvárosban.";
  await keres("/api/onboarding/piszkozat", { modszer: "PUT", sutik: s, torzs: {
    bemutatkozas: { nev: szervezet, osszefoglalo: o, osszefoglalo_forras: "ai", forras_tipus: "leiras", leiras: o },
    kommunikacio: { celkozonseg: "családok", celkozonseg_forras: "ai", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek, nyelvek_forras: "sajat", hangnem_leiras: "", hangnem_minta: "", hangnem_nyelv: nyelvek[0], hangnem_forras: "sajat" },
  } });
  await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik: s });
  const id = (await sql<{ id: string }>("SELECT id FROM szervezet WHERE nev = $1", [szervezet]))[0]!.id;
  return { s, id };
}
const docxKuld = (s: string, bajtok: Uint8Array) =>
  fetch(`${PROBA_CIM}/api/program/olvas`, { method: "POST", body: Buffer.from(bajtok), headers: { cookie: `${s}; km_nyelv=hu`, "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } });

// c30 F6b (live 10-17: the proxy cut a 60–120 s read at 60 s): the read runs in the background — POST answers 202 {olvasas}, GET polls.
// The expectations below are unchanged; only the way the answer is fetched moved (POST 202, then GET until „kesz”).
async function olvasVar(s: string): Promise<{ tetelek: ProgramTetel[]; merleg: { beszurt: number; frissitett: number; torolt: number; megtartott: number } }> {
  for (let i = 0; i < 100; i++) {
    const g = await keres<{ olvasas: { allapot: string; merleg?: { beszurt: number; frissitett: number; torolt: number; megtartott: number } } | null; tetelek?: ProgramTetel[] }>("/api/program/olvas", { sutik: s });
    if (g.torzs.olvasas?.allapot === "kesz") return { tetelek: g.torzs.tetelek ?? [], merleg: g.torzs.olvasas.merleg! };
    if (g.torzs.olvasas?.allapot !== "fut") throw new Error(`olvasás: ${JSON.stringify(g.torzs.olvasas)}`);
    await new Promise((k) => setTimeout(k, 200));
  }
  throw new Error("olvasás: nem lett kész");
}

describe("F5 live: the table, RLS and the endpoints", () => {
  let zilele = { s: "", id: "" }, tibor = { s: "", id: "" };
  beforeAll(async () => {
    zilele = await fiok("Moldovan-Szabó Réka", "Zilele Târgumureșene 2026 — próba F5", ["hu", "ro"]);
    tibor = await fiok("Kovács-Szentgyörgyi Tibor", "Kovács Térkő Kft. — próba F5", ["hu"]);
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("RLS is on with the tenant policy; km_app may SELECT, INSERT, UPDATE — and NOT DELETE", async () => {
    expect((await sql<{ r: boolean }>("SELECT relrowsecurity AS r FROM pg_class WHERE relname = 'program_tetel'"))[0]!.r).toBe(true);
    expect((await sql<{ db: number }>("SELECT count(*)::int AS db FROM pg_policies WHERE tablename = 'program_tetel' AND policyname = 'program_tetel_sajat_szervezet'"))[0]!.db).toBe(1);
    const jog = await sql<{ s: boolean; i: boolean; u: boolean; d: boolean }>(
      "SELECT has_table_privilege('km_app','program_tetel','SELECT') s, has_table_privilege('km_app','program_tetel','INSERT') i, has_table_privilege('km_app','program_tetel','UPDATE') u, has_table_privilege('km_app','program_tetel','DELETE') d");
    expect(jog[0]).toEqual({ s: true, i: true, u: true, d: false });
  });

  it("reads a .docx through the endpoint (test AI → its sample items), then a re-read keeps the edited row and the own item", async () => {
    const r1 = await docxKuld(zilele.s, SZINTETIKUS);
    expect(r1.status).toBe(202); // c30 F6b: was 200 with the result; the result now comes from the poll (olvasVar)
    const b1 = await olvasVar(zilele.s);
    expect(b1.merleg.beszurt).toBe(3);
    const ev = b1.tetelek.find((t) => t.kezdes === "10:00")!;
    expect([ev.bizonytalan, ev.forras]).toEqual([true, "gep"]);
    const koncert = b1.tetelek.find((t) => t.kezdes === "20:00")!;
    const at = await keres<{ tetel: ProgramTetel }>("/api/program/tetel", { modszer: "PUT", sutik: zilele.s, torzs: { id: koncert.id, nev: { hu: "Esti koncert — Kökény Attila", ro: "Concert de seară — Kökény Attila" }, aktiv: false } });
    expect(at.statusz).toBe(200);
    expect([at.torzs.tetel.modositva, at.torzs.tetel.aktiv]).toEqual([true, false]);
    const sajat = await keres<{ tetel: ProgramTetel }>("/api/program/tetel", { modszer: "POST", sutik: zilele.s, torzs: { nap: "2026-06-25", kezdes: "11:00", nev: { hu: "Sajtótájékoztató a Kultúrpalotában" }, fajta: "egyeb" } });
    expect(sajat.statusz).toBe(201);
    expect(sajat.torzs.tetel.forras).toBe("sajat");
    expect((await docxKuld(zilele.s, SZINTETIKUS)).status).toBe(202);
    const b2 = await olvasVar(zilele.s);
    expect(b2.merleg).toEqual({ beszurt: 0, frissitett: 2, torolt: 0, megtartott: 2 });
    expect(b2.tetelek.length).toBe(4);
    const megmaradt = b2.tetelek.find((t) => t.id === koncert.id)!;
    expect([megmaradt.nev.hu, megmaradt.aktiv, megmaradt.modositva]).toEqual(["Esti koncert — Kökény Attila", false, true]);
    expect(b2.tetelek.some((t) => t.nev.hu === "Sajtótájékoztató a Kultúrpalotában")).toBe(true);
    // soft delete: gone from the list, the row stays
    expect((await keres("/api/program/tetel", { modszer: "DELETE", sutik: zilele.s, torzs: { id: sajat.torzs.tetel.id } })).statusz).toBe(200);
    expect((await keres<{ tetelek: ProgramTetel[] }>("/api/program/lista", { sutik: zilele.s })).torzs.tetelek.length).toBe(3);
    expect((await sql<{ t: Date | null }>("SELECT torolve AS t FROM program_tetel WHERE id = $1", [sajat.torzs.tetel.id]))[0]!.t).not.toBeNull();
  });

  it("the endpoint refuses a non-DOCX body, an oversized one and an empty source", async () => {
    expect((await docxKuld(zilele.s, new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(64).fill(1)]))).status).toBe(415);
    const tul = new Uint8Array(DOCX_KORLAT.maxBajt + 10); tul.set([0x50, 0x4b, 0x03, 0x04]);
    expect((await docxKuld(zilele.s, tul)).status).toBe(413);
    expect((await keres("/api/program/olvas", { modszer: "POST", sutik: zilele.s, torzs: {} })).statusz).toBe(400);
  });

  it("A-11: another org's list is empty; its PUT on our row is 404; as km_app under the other org: 0 rows seen, 0 updated, insert refused, delete denied", async () => {
    expect((await keres<{ tetelek: ProgramTetel[] }>("/api/program/lista", { sutik: tibor.s })).torzs.tetelek).toEqual([]);
    const sajatId = (await sql<{ id: string }>("SELECT id FROM program_tetel WHERE szervezet_id = $1 AND torolve IS NULL LIMIT 1", [zilele.id]))[0]!.id;
    expect((await keres("/api/program/tetel", { modszer: "PUT", sutik: tibor.s, torzs: { id: sajatId, aktiv: false } })).statusz).toBe(404);
    const url = process.env["PROBA_APP_DATABASE_URL"];
    if (!url) return;
    const { Client } = await import("pg");
    const c = new Client({ connectionString: url });
    await c.connect();
    try {
      const neveben = async <T>(sz: string, f: () => Promise<T>): Promise<T> => {
        await c.query("BEGIN");
        await c.query("SELECT set_config('app.szervezet_id', $1, true)", [sz]);
        try { return await f(); } finally { await c.query("ROLLBACK"); }
      };
      const lat = (sz: string) => neveben(sz, async () => (await c.query("SELECT count(*)::int AS db FROM program_tetel WHERE szervezet_id = $1", [zilele.id])).rows[0].db as number);
      expect(await lat(zilele.id)).toBeGreaterThan(0);
      expect(await lat(tibor.id)).toBe(0);
      expect(await neveben(tibor.id, async () => (await c.query("UPDATE program_tetel SET aktiv = false WHERE szervezet_id = $1", [zilele.id])).rowCount)).toBe(0);
      await expect(neveben(tibor.id, () => c.query("INSERT INTO program_tetel (szervezet_id, nev) VALUES ($1, '{\"hu\":\"betörő\"}')", [zilele.id]))).rejects.toThrow(/row-level security/);
      await expect(neveben(zilele.id, () => c.query("DELETE FROM program_tetel WHERE szervezet_id = $1", [zilele.id]))).rejects.toThrow(/permission denied/);
    } finally {
      await c.end();
    }
  });
});
