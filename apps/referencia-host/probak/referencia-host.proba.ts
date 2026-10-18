// A referencia-host próbája (E-28): a mag a második hostban is végigviszi a teljes folyamatot,
// és a találatok tényleg egy SQLite-fájlban maradnak. Minden próba saját, ideiglenes fájlon dolgozik.
import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { kornyezetKeszit, type HostAllas } from "../src/kornyezet.js";
import { beallitasMent, figyelesFuttat, forrasEllenoriz, forrasHozzaad, attekintes, verzioVisszaallit, type Beallitas } from "@km/news-monitor-core";

const BEALLITAS: Beallitas = {
  celok: ["sajat_marka"],
  temak: [{ nev: "Minta Műhely", nevvaltozatok: [], megkulonboztetes: "" }],
  foldrajzi_fokusz: "",
  nyelvek: [],
  kizarasok: [],
  idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
  szabad_szoveg: "",
};

const BEALLITAS2: Beallitas = {
  celok: ["szakmai"],
  temak: [{ nev: "Másik Téma", nevvaltozatok: [], megkulonboztetes: "" }],
  foldrajzi_fokusz: "Budapest",
  nyelvek: ["hu"],
  kizarasok: [],
  idozites: { mod: "kezi", ora: 8, perc: 30, idozona: "Europe/Budapest" },
  szabad_szoveg: "második",
};

const ideiglenesUtvonalak: string[] = [];

function ujUtvonal(): string {
  const utvonal = join(mkdtempSync(join(tmpdir(), "km-ref-")), "adat.db");
  ideiglenesUtvonalak.push(utvonal);
  return utvonal;
}

afterEach(() => {
  for (const utvonal of ideiglenesUtvonalak.splice(0)) {
    rmSync(utvonal, { recursive: true, force: true });
  }
});

function hostKeszit(utvonal?: string): HostAllas {
  return kornyezetKeszit({ utvonal: utvonal ?? ujUtvonal() });
}

describe("referencia-host teljes folyamat (E-28)", () => {
  it("1. beállítás → forrás → ellenőrzés → futás: találatok és kártyák keletkeznek", async () => {
    const host = hostKeszit();
    const { k, ktx } = host;
    const m = await beallitasMent(k, ktx, BEALLITAS, "kezi");
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.uj?.verzio).toBe(1);

    const f = await forrasHozzaad(k, ktx, "https://pelda.hu/feed", "kezi");
    expect(f.ok).toBe(true);
    if (!f.ok) return;
    const ell = await forrasEllenoriz(k, ktx, f.forras.id);
    expect(ell.ok).toBe(true);
    if (!ell.ok) return;
    expect(ell.forras.allapot).toBe("hasznalhato");

    const r = await figyelesFuttat(k, ktx, { proba: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(["kesz", "reszleges"]).toContain(r.futas.allapot);
    expect(r.ujTalalatok.length).toBeGreaterThan(0);

    const a = await attekintes(k, ktx);
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.talalatok.length).toBe(r.ujTalalatok.length);
    expect(a.kartyak.length).toBeGreaterThan(0);
    host.zar();
  });

  it("2. a találatok tényleg az SQLite-fájlban vannak (újranyitás és közvetlen tábla-ellenőrzés)", async () => {
    const utvonal = ujUtvonal();
    const host1 = hostKeszit(utvonal);
    const { k: k1, ktx } = host1;
    await beallitasMent(k1, ktx, BEALLITAS, "kezi");
    const f = await forrasHozzaad(k1, ktx, "https://pelda.hu/feed", "kezi");
    if (!f.ok) return;
    await forrasEllenoriz(k1, ktx, f.forras.id);
    const r = await figyelesFuttat(k1, ktx, { proba: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a1 = await attekintes(k1, ktx);
    expect(a1.ok).toBe(true);
    if (!a1.ok) return;
    const talalatokSzama = a1.talalatok.length;
    const azonositok = a1.talalatok.map((t) => t.id).sort();
    host1.zar();

    // Újranyitás ugyanazzal az útvonallal
    const host2 = hostKeszit(utvonal);
    const a2 = await attekintes(host2.k, host2.ktx);
    expect(a2.ok).toBe(true);
    if (!a2.ok) return;
    expect(a2.talalatok.length).toBe(talalatokSzama);
    expect(a2.talalatok.map((t) => t.id).sort()).toEqual(azonositok);
    host2.zar();

    // Közvetlen SQLite-ellenőrzés
    const db = new DatabaseSync(utvonal);
    const sor = db.prepare("SELECT COUNT(*) AS db FROM talalat").get() as { db: number };
    expect(sor.db).toBe(talalatokSzama);
    db.close();
  });

  it("3. A-10 dedup a második hostban: második futás 0 új találat, a szám változatlan", async () => {
    const host = hostKeszit();
    const { k, ktx } = host;
    await beallitasMent(k, ktx, BEALLITAS, "kezi");
    const f = await forrasHozzaad(k, ktx, "https://pelda.hu/feed", "kezi");
    if (!f.ok) return;
    await forrasEllenoriz(k, ktx, f.forras.id);
    const r1 = await figyelesFuttat(k, ktx, { proba: false });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const a1 = await attekintes(k, ktx);
    expect(a1.ok).toBe(true);
    if (!a1.ok) return;
    const szam1 = a1.talalatok.length;

    const r2 = await figyelesFuttat(k, ktx, { proba: false });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.ujTalalatok.length).toBe(0);
    expect(r2.futas.uj_talalatok).toBe(0);

    const a2 = await attekintes(k, ktx);
    expect(a2.ok).toBe(true);
    if (!a2.ok) return;
    expect(a2.talalatok.length).toBe(szam1);
    host.zar();
  });

  it("4. beállítás nélkül nincs futás", async () => {
    const host = hostKeszit();
    const r = await figyelesFuttat(host.k, host.ktx, { proba: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.hiba).toBe("NINCS_BEALLITAS");
    host.zar();
  });

  it("5. jogosultság: néző nem menthet és nem futtathat, de nézhet", async () => {
    const host = hostKeszit();
    const { k, ktx } = host;
    const nezoKtx = { ...ktx, szerep: "nezo" as const };

    const m = await beallitasMent(k, nezoKtx, BEALLITAS, "kezi");
    expect(m.ok).toBe(false);
    if (m.ok) return;
    expect(m.hiba).toBe("NINCS_JOG");

    const r = await figyelesFuttat(k, nezoKtx, { proba: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.hiba).toBe("NINCS_JOG");

    const a = await attekintes(k, nezoKtx);
    expect(a.ok).toBe(true);
    host.zar();
  });

  it("6. verziózás és visszaállítás", async () => {
    const host = hostKeszit();
    const { k, ktx } = host;
    const m1 = await beallitasMent(k, ktx, BEALLITAS, "kezi");
    expect(m1.ok).toBe(true);
    if (!m1.ok) return;
    expect(m1.uj?.verzio).toBe(1);

    const m2 = await beallitasMent(k, ktx, BEALLITAS2, "kezi");
    expect(m2.ok).toBe(true);
    if (!m2.ok) return;
    expect(m2.uj?.verzio).toBe(2);
    const v1 = m2.verziok.find((v) => v.verzio === 1);
    expect(v1?.allapot).toBe("korabbi");

    const vv = await verzioVisszaallit(k, ktx, 1);
    expect(vv.ok).toBe(true);
    if (!vv.ok) return;
    expect(vv.uj.verzio).toBe(3);
    expect(vv.uj.eredet).toBe("visszaallitas");
    expect(vv.uj.beallitas.temak[0]?.nev).toBe("Minta Műhely");
    host.zar();
  });
});
