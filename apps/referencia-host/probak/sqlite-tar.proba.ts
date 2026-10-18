// E-28: az SQLite-tár a memóriabeli tárral AZONOSAN viselkedik — ez a hordozhatóság alapja.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  memoriaTar,
  type Beallitas,
  type BeallitasVerzio,
  type Esemeny,
  type Forras,
  type Futas,
  type HirfigyeloTar,
  type Kivonat,
  type Minta,
  type SzabalyJavaslat,
  type Talalat,
  type Visszajelzes,
} from "@km/news-monitor-core";
import { afterEach, describe, expect, it } from "vitest";
import { sqliteTar } from "../src/csatlakozok/sqlite-tar.js";

const IDO = "2026-09-08T06:00:00.000Z";
const SZ1 = "szerv1";
const SZ2 = "szerv2";

const ideiglenesMappak: string[] = [];
afterEach(() => {
  for (const mappa of ideiglenesMappak) rmSync(mappa, { recursive: true, force: true });
  ideiglenesMappak.length = 0;
});

function ujIdeiglenesFajl(): string {
  const mappa = mkdtempSync(join(tmpdir(), "km-ref-"));
  ideiglenesMappak.push(mappa);
  return join(mappa, "tar.sqlite");
}

function forras(id: string, cim: string): Forras {
  return { id, cim, tipus: "rss", eredet: "kezi", allapot: "hasznalhato", ellenorzott: true, utolso_sikeres: IDO, hiba_ok: null };
}
function kivonat(id: string, url: string, lejar: string): Kivonat {
  return { id, forras_id: "f1", cim: `Cikk ${id}`, url, kanonikus_url: url.replace("https://", ""), megjelenes: IDO, begyujtes: IDO, szoveg: "szöveg", csonkolt: false, ujjlenyomat: `u-${id}`, nyelv: "hu", lejar };
}
function talalat(id: string, szervezetId: string): Talalat {
  return { id, szervezet_id: szervezetId, esemeny_id: `e-${id}`, kivonat_id: `k-${id}`, ertekeles: null, ertekeles_allapot: "fuggoben", megtekintes: "uj", jeloles: "nincs", letrehozva: IDO, futas_id: "fu1", tartalomotlet: null };
}
const BEALLITAS: Beallitas = {
  celok: ["sajat_marka"],
  temak: [{ nev: "Teszt", nevvaltozatok: [], megkulonboztetes: "" }],
  foldrajzi_fokusz: "",
  nyelvek: ["hu"],
  kizarasok: [],
  idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
  szabad_szoveg: "",
};

/** Ugyanaz a műveletsor mindkét táron — a válaszoknak azonosnak kell lenniük. */
async function muveletsor(tar: HirfigyeloTar): Promise<unknown[]> {
  const nyers: unknown[] = [];
  // Pillanatkép: a memóriabeli tár a SAJÁT listáját adja vissza (a későbbi frissítés visszamenőleg
  // látszana rajta), az SQLite-tár friss másolatot — a két tár összevetéséhez másolatot rögzítünk.
  const valaszok = { push: (x: unknown) => nyers.push(structuredClone(x)) };

  await tar.forrasMent(SZ1, forras("f1", "https://elso.hu/feed"));
  await tar.forrasMent(SZ1, forras("f2", "https://masodik.hu/feed"));
  valaszok.push(await tar.forrasok(SZ1));
  await tar.forrasMent(SZ1, { ...forras("f1", "https://elso.hu/feed"), allapot: "korlatozott" });
  valaszok.push(await tar.forrasok(SZ1));

  const futas: Futas = { id: "fu1", szervezet_id: SZ1, szabaly_verzio: 1, kezdet: IDO, veg: IDO, allapot: "kesz", uj_talalatok: 1, hibas_forrasok: [], proba: false };
  await tar.futasMent(SZ1, futas);
  valaszok.push(await tar.futasok(SZ1));

  valaszok.push(await tar.kivonatMent(SZ1, kivonat("k1", "https://elso.hu/a", "2026-10-08T06:00:00.000Z")));
  valaszok.push(await tar.kivonatok(SZ1, ["k1"]));

  await tar.talalatMent(SZ1, talalat("t1", SZ1));
  valaszok.push(await tar.talalatok(SZ1));

  const esemeny: Esemeny = { id: "e1", szervezet_id: SZ1, fo_talalat_id: "t1", talalat_ids: ["t1"], letrehozva: IDO };
  await tar.esemenyMent(SZ1, esemeny);
  valaszok.push(await tar.esemenyek(SZ1));

  const visszajelzes: Visszajelzes = { id: "v1", talalat_id: "t1", fajta: "fontos", okok: [], sajat_indok: "", letrehozva: IDO };
  await tar.visszajelzesMent(SZ1, visszajelzes);
  valaszok.push(await tar.visszajelzesek(SZ1));

  const javaslat: SzabalyJavaslat = { id: "j1", szabaly_verzio: 1, javasolt: BEALLITAS, mi_alapjan: ["v1"], indoklas: "i", varhato_hatas: "h", profil_erintett: false, allapot: "fuggo", minta_id: null, letrehozva: IDO };
  await tar.javaslatMent(SZ1, javaslat);
  valaszok.push(await tar.javaslatok(SZ1));

  const minta: Minta = { id: "m1", szervezet_id: SZ1, szabaly_verzio: 1, talalat_ids: ["t1"], letrehozva: IDO, lejar: "2026-09-15T06:00:00.000Z" };
  await tar.mintaMent(SZ1, minta);
  valaszok.push(await tar.mintak(SZ1));

  const verzio: BeallitasVerzio = { verzio: 1, beallitas: BEALLITAS, letrehozva: IDO, eredet: "kezi", allapot: "aktiv" };
  await tar.verziokMent(SZ1, [verzio]);
  valaszok.push(await tar.verziok(SZ1));

  await tar.tervezetMent(SZ1, "fiok1", BEALLITAS);
  valaszok.push(await tar.tervezet(SZ1, "fiok1"));
  await tar.tervezetMent(SZ1, "fiok1", null);
  valaszok.push(await tar.tervezet(SZ1, "fiok1"));
  valaszok.push(await tar.tervezet(SZ1, "masik-fiok"));

  return nyers;
}

describe("sqliteTar", () => {
  it("ugyanaz a viselkedés, mint a memóriatáré", async () => {
    const sqlite = sqliteTar(":memory:");
    const memoriaValaszok = await muveletsor(memoriaTar());
    const sqliteValaszok = await muveletsor(sqlite);
    expect(sqliteValaszok).toEqual(memoriaValaszok);
    sqlite.zar();
  });

  it("ugyanaz a cikk nem kerül be kétszer (A-10): uj, majd letezik, és az első marad", async () => {
    const tar = sqliteTar(":memory:");
    const elso = kivonat("k1", "https://cikk.hu/1", "2026-12-31T00:00:00.000Z");
    const masodik = { ...kivonat("k2", "https://cikk.hu/1", "2026-12-31T00:00:00.000Z"), cim: "Másik cím" };
    expect(await tar.kivonatMent(SZ1, elso)).toBe("uj");
    expect(await tar.kivonatMent(SZ1, masodik)).toBe("letezik");
    const kivonatok = await tar.kivonatok(SZ1, ["k1", "k2"]);
    expect(kivonatok).toHaveLength(1);
    expect(kivonatok[0]?.cim).toBe("Cikk k1");
    tar.zar();
  });

  it("a frissítés nem változtatja meg a lista sorrendjét", async () => {
    const tar = sqliteTar(":memory:");
    await tar.forrasMent(SZ1, forras("f1", "https://egy.hu/feed"));
    await tar.forrasMent(SZ1, forras("f2", "https://ketto.hu/feed"));
    await tar.forrasMent(SZ1, forras("f3", "https://harom.hu/feed"));
    await tar.forrasMent(SZ1, { ...forras("f2", "https://ketto.hu/feed"), allapot: "hibas", hiba_ok: "időtúllépés" });
    const forrasok = await tar.forrasok(SZ1);
    expect(forrasok.map((f) => f.id)).toEqual(["f1", "f2", "f3"]);
    expect(forrasok[1]?.allapot).toBe("hibas");
    tar.zar();
  });

  it("lejartKivonatokTorol: csak a lejártakat törli", async () => {
    const tar = sqliteTar(":memory:");
    await tar.kivonatMent(SZ1, kivonat("k1", "https://cikk.hu/1", "2026-05-01T00:00:00.000Z"));
    await tar.kivonatMent(SZ1, kivonat("k2", "https://cikk.hu/2", "2026-05-15T00:00:00.000Z"));
    await tar.kivonatMent(SZ1, kivonat("k3", "https://cikk.hu/3", "2026-07-01T00:00:00.000Z"));
    expect(await tar.lejartKivonatokTorol(SZ1, new Date("2026-06-01T00:00:00.000Z"))).toBe(2);
    const megmaradt = await tar.kivonatok(SZ1, ["k1", "k2", "k3"]);
    expect(megmaradt).toHaveLength(1);
    expect(megmaradt[0]?.id).toBe("k3");
    tar.zar();
  });

  it("fájlba ír és újranyitás után is megvan minden", async () => {
    const fajl = ujIdeiglenesFajl();
    const elso = sqliteTar(fajl);
    await elso.forrasMent(SZ1, forras("f1", "https://egy.hu/feed"));
    await elso.verziokMent(SZ1, [{ verzio: 1, beallitas: BEALLITAS, letrehozva: IDO, eredet: "kezi", allapot: "aktiv" }]);
    await elso.talalatMent(SZ1, talalat("t1", SZ1));
    elso.zar();

    const masodik = sqliteTar(fajl);
    expect((await masodik.forrasok(SZ1)).map((f) => f.id)).toEqual(["f1"]);
    expect((await masodik.verziok(SZ1))[0]?.verzio).toBe(1);
    expect((await masodik.talalatok(SZ1))[0]?.id).toBe("t1");
    masodik.zar();
  });

  it("két szervezet adata elkülönül", async () => {
    const tar = sqliteTar(":memory:");
    await tar.talalatMent(SZ1, talalat("t1", SZ1));
    await tar.talalatMent(SZ2, talalat("t2", SZ2));
    expect((await tar.talalatok(SZ1)).map((t) => t.id)).toEqual(["t1"]);
    expect((await tar.talalatok(SZ2)).map((t) => t.id)).toEqual(["t2"]);
    tar.zar();
  });
});
