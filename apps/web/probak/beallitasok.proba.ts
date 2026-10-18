import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar, sql } from "./segedek";
import type { ErtesitesLista, SajatBeallitas } from "../ertesites/tipusok";

// F-5b (R-4, D-F33): a fiók-szintű értesítés gépezete a FUTÓ kiszolgáló ellen — a beállítás, a lista, az olvasott-jelölés, a megnyitó út.
// Az eseményeket élesben a gépezet írja; itt SQL-lel szúrjuk be (km_tulaj), ahogy a többi élő próba is a saját adatát.

const jelszo = "ProbaJelszo123!";
const ALAP: SajatBeallitas = {
  esemenyek: { futas_kesz: true, forras_hibas: true, keret_kimerult: true, ai_nem_valaszol: true, futas_beragadt: true, belepesi_kiserletek: true },
  feluleten: true,
};

async function beszur(szervezetId: string | null, fajta: string, adat: Record<string, unknown>, percekkelEzelott: number): Promise<string> {
  const sorok = await sql<{ id: string }>(
    `INSERT INTO esemeny (szervezet_id, fajta, sulyossag, fiok_id, ido, adat)
     VALUES ($1, $2, 'info', NULL, now() - ($3::int * interval '1 minute'), $4::jsonb) RETURNING id`,
    [szervezetId, fajta, percekkelEzelott, JSON.stringify(adat)],
  );
  return sorok[0]!.id;
}

describe("Beállítások — értesítések (F-5b, R-4)", () => {
  let sutikA: string;
  let sutikB: string;
  let szervezetAId: string;
  let futasId: string;
  let forrasId: string;
  let keretId: string;

  beforeAll(async () => {
    const emailA = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Proba A", email: emailA, jelszo } })).statusz).toBe(201);
    const belA = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: emailA, jelszo } });
    expect(belA.statusz).toBe(200);
    sutikA = belA.sutik.join("; ");
    const szA = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", sutik: sutikA, torzs: { nev: "Értesítés A" } });
    expect(szA.statusz).toBe(201);
    szervezetAId = szA.torzs.id;

    const emailB = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Proba B", email: emailB, jelszo } })).statusz).toBe(201);
    const belB = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: emailB, jelszo } });
    sutikB = belB.sutik.join("; ");
    expect((await keres("/api/szervezet", { modszer: "POST", sutik: sutikB, torzs: { nev: "Értesítés B" } })).statusz).toBe(201);

    // három az ötből + egy, ami nem tartozik a listába (belepes) + egy rendszerszintű (csak rendszergazdának)
    futasId = await beszur(szervezetAId, "futas_kesz", { uj_talalatok: 10 }, 1);
    forrasId = await beszur(szervezetAId, "forras_hibas", { forras: "https://pelda.hu/rss" }, 2);
    keretId = await beszur(szervezetAId, "keret_kimerult", {}, 3);
    await beszur(szervezetAId, "belepes", { nev: "valaki" }, 0);
    await beszur(null, "belepesi_kiserletek", { ok: "cim", ujra_perc: 15 }, 0);
  });

  afterAll(async () => {
    await sql(`DELETE FROM esemeny WHERE szervezet_id = $1 OR (szervezet_id IS NULL AND fajta = 'belepesi_kiserletek' AND adat->>'ujra_perc' = '15')`, [szervezetAId]);
    await takaritas();
    await lezar();
  });

  it("1. új fióknál minden értesítés be van kapcsolva, a felületi csatorna is", async () => {
    const v = await keres<{ beallitas: SajatBeallitas }>("/api/ertesites/sajat", { sutik: sutikA });
    expect(v.statusz).toBe(200);
    expect(v.torzs.beallitas).toEqual(ALAP);
  });

  it("2. hiányos beállítás → 400", async () => {
    const v = await keres("/api/ertesites/sajat", { modszer: "PUT", sutik: sutikA, torzs: { esemenyek: ALAP.esemenyek } });
    expect(v.statusz).toBe(400);
    expect((v.torzs as { hiba: string }).hiba).toBe("ERVENYTELEN_ADAT");
  });

  it("3. a mentett beállítás visszaolvasható", async () => {
    const uj: SajatBeallitas = { ...ALAP, esemenyek: { ...ALAP.esemenyek, ai_nem_valaszol: false } };
    const put = await keres<{ beallitas: SajatBeallitas }>("/api/ertesites/sajat", { modszer: "PUT", sutik: sutikA, torzs: uj });
    expect(put.statusz).toBe(200);
    expect(put.torzs.beallitas.esemenyek.ai_nem_valaszol).toBe(false);
    const get = await keres<{ beallitas: SajatBeallitas }>("/api/ertesites/sajat", { sutik: sutikA });
    expect(get.torzs.beallitas).toEqual(uj);
  });

  it("4. a lista: a három sor, olvasatlanul, ido szerint csökkenő, a munkatér nevével és a céllal", async () => {
    const v = await keres<{ lista: ErtesitesLista }>("/api/ertesites/lista", { sutik: sutikA });
    expect(v.statusz).toBe(200);
    const l = v.torzs.lista;
    expect(l.osszes).toBe(3);
    expect(l.olvasatlan).toBe(3);
    expect(l.sorok.map((s) => s.fajta)).toEqual(["futas_kesz", "forras_hibas", "keret_kimerult"]);
    expect(l.sorok.map((s) => s.cel)).toEqual(["talalatok", "forrasok", "koltseg"]);
    expect(l.sorok[0]!.munkater?.nev).toBe("Értesítés A");
    expect(l.sorok[0]!.ertekek["n"]).toBe(10);
    expect(l.sorok[1]!.ertekek["forras"]).toBe("https://pelda.hu/rss");
    expect(l.sorok.every((s) => !s.olvasott)).toBe(true);
    // a rendszerszintű sor közönséges tagnak nincs ott
    expect(l.sorok.some((s) => s.fajta === "belepesi_kiserletek")).toBe(false);
  });

  it("5. a kikapcsolt fajta eltűnik a listából, visszakapcsolva visszajön", async () => {
    const ki: SajatBeallitas = { ...ALAP, esemenyek: { ...ALAP.esemenyek, futas_kesz: false } };
    expect((await keres("/api/ertesites/sajat", { modszer: "PUT", sutik: sutikA, torzs: ki })).statusz).toBe(200);
    const l1 = (await keres<{ lista: ErtesitesLista }>("/api/ertesites/lista", { sutik: sutikA })).torzs.lista;
    expect(l1.osszes).toBe(2);
    expect(l1.sorok.some((s) => s.fajta === "futas_kesz")).toBe(false);
    expect((await keres("/api/ertesites/sajat", { modszer: "PUT", sutik: sutikA, torzs: ALAP })).statusz).toBe(200);
    const l2 = (await keres<{ lista: ErtesitesLista }>("/api/ertesites/lista", { sutik: sutikA })).torzs.lista;
    expect(l2.osszes).toBe(3);
  });

  it("6. egy sor olvasottnak jelölése", async () => {
    const v = await keres<{ lista: ErtesitesLista }>("/api/ertesites/olvasott", { modszer: "POST", sutik: sutikA, torzs: { esemeny_id: keretId } });
    expect(v.statusz).toBe(200);
    expect(v.torzs.lista.olvasatlan).toBe(2);
    expect(v.torzs.lista.sorok.find((s) => s.id === keretId)?.olvasott).toBe(true);
    expect(v.torzs.lista.sorok.find((s) => s.id === futasId)?.olvasott).toBe(false);
  });

  it("7. rossz törzs → 400", async () => {
    expect((await keres("/api/ertesites/olvasott", { modszer: "POST", sutik: sutikA, torzs: { valami: 1 } })).statusz).toBe(400);
    expect((await keres("/api/ertesites/olvasott", { modszer: "POST", sutik: sutikA, torzs: { esemeny_id: "nem-uuid" } })).statusz).toBe(400);
  });

  it("8. a megnyitó út a sor céljára visz, és olvasottnak jelöl", async () => {
    // a fetch követi az átirányítást: a végső lap a /hirfigyelo (200 vagy a belépéshez irányít, ha a lap zárt — a fő kérdés az olvasott-jelölés)
    const v = await keres(`/beallitasok/nyit/${forrasId}`, { sutik: sutikA });
    expect([200, 302, 307]).toContain(v.statusz);
    const olv = await sql<{ n: string }>(`SELECT count(*)::text AS n FROM ertesites_olvasott WHERE esemeny_id = $1`, [forrasId]);
    expect(olv[0]!.n).toBe("1");
    const l = (await keres<{ lista: ErtesitesLista }>("/api/ertesites/lista", { sutik: sutikA })).torzs.lista;
    expect(l.sorok.find((s) => s.id === forrasId)?.olvasott).toBe(true);
    expect(l.olvasatlan).toBe(1);
  });

  it("9. ismeretlen esemény megnyitása a Beállításokra visz vissza, hibát nem ad", async () => {
    const v = await keres("/beallitasok/nyit/00000000-0000-4000-8000-000000000000", { sutik: sutikA });
    expect([200, 302, 307]).toContain(v.statusz);
  });

  it("10. mind olvasott: az olvasatlan 0, minden sor olvasott; a későbbi esemény újra olvasatlan", async () => {
    const v = await keres<{ lista: ErtesitesLista }>("/api/ertesites/olvasott", { modszer: "POST", sutik: sutikA, torzs: { mind: true } });
    expect(v.statusz).toBe(200);
    expect(v.torzs.lista.olvasatlan).toBe(0);
    expect(v.torzs.lista.sorok.every((s) => s.olvasott)).toBe(true);
    // egy ÚJABB esemény (a vízjel után) olvasatlan
    await new Promise((r) => setTimeout(r, 1100));
    await sql(`INSERT INTO esemeny (szervezet_id, fajta, sulyossag, fiok_id, ido, adat) VALUES ($1, 'futas_kesz', 'info', NULL, now(), '{"uj_talalatok": 2}'::jsonb)`, [szervezetAId]);
    const l = (await keres<{ lista: ErtesitesLista }>("/api/ertesites/lista", { sutik: sutikA })).torzs.lista;
    expect(l.osszes).toBe(4);
    expect(l.olvasatlan).toBe(1);
    expect(l.sorok[0]!.olvasott).toBe(false);
  });

  it("11. a felületi csatorna kikapcsolva a lista marad, csak a harang hallgat (a beállítás visszaolvasható)", async () => {
    const ki: SajatBeallitas = { ...ALAP, feluleten: false };
    expect((await keres("/api/ertesites/sajat", { modszer: "PUT", sutik: sutikA, torzs: ki })).statusz).toBe(200);
    const l = (await keres<{ lista: ErtesitesLista }>("/api/ertesites/lista", { sutik: sutikA })).torzs.lista;
    expect(l.osszes).toBe(4);
    expect((await keres("/api/ertesites/sajat", { modszer: "PUT", sutik: sutikA, torzs: ALAP })).statusz).toBe(200);
  });

  it("12. egy másik fiók (B) listája üres — A eseményeit nem látja", async () => {
    const l = (await keres<{ lista: ErtesitesLista }>("/api/ertesites/lista", { sutik: sutikB })).torzs.lista;
    expect(l.osszes).toBe(0);
    expect(l.olvasatlan).toBe(0);
  });

  it("13. belépés nélkül a lista és a beállítás 401", async () => {
    expect((await keres("/api/ertesites/lista")).statusz).toBe(401);
    expect((await keres("/api/ertesites/sajat")).statusz).toBe(401);
  });
});
