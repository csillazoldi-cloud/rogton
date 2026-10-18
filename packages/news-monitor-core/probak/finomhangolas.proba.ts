// E-26: a Finomhangolás lap adata és a javaslat-döntés őre.
import { describe, expect, it } from "vitest";
import { finomhangolas, javaslatDont, memoriaTar, type AiHivo, type HostKontextus, type Kornyezet, type SzabalyJavaslat, type Beallitas } from "../src";

const SZ = "11111111-1111-4111-8111-111111111111";
const IDO = "2026-09-08T06:00:00.000Z";
const tulaj: HostKontextus = { fiok_id: "22222222-2222-4222-8222-222222222222", szervezet_id: SZ, szerep: "tulajdonos" };
const be: Beallitas = { celok: ["sajat_marka"], temak: [{ nev: "Teszt", nevvaltozatok: [], megkulonboztetes: "" }], foldrajzi_fokusz: "", nyelvek: [], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "" };

function kornyezet(): Kornyezet {
  const ai: AiHivo = async () => ({ ok: false, kod: "AI_NEM_ELERHETO" });
  return { tar: memoriaTar(), ai, letolto: (async () => ({ ok: false, hiba: "nincs" })) as never, profil: {}, idAdo: () => "id", most: () => new Date(IDO) };
}

describe("finomhangolas", () => {
  it("üres szervezet → nincs minta, nincs tétel, nincs javaslat", async () => {
    const e = await finomhangolas(kornyezet(), tulaj);
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.minta).toBeNull();
    expect(e.mintaLejart).toBe(false);
    expect(e.tetelek).toEqual([]);
    expect(e.verziok).toEqual([]);
  });

  it("minta nélkül a visszajelzett találatok a tételek; lejárt minta jelölve", async () => {
    const k = kornyezet();
    await k.tar.forrasMent(SZ, { id: "f1", cim: "https://f1.example/feed", tipus: "rss", eredet: "kezi", allapot: "hasznalhato", ellenorzott: true, utolso_sikeres: IDO, hiba_ok: null });
    await k.tar.kivonatMent(SZ, { id: "t1", forras_id: "f1", cim: "Cikk", url: "https://f1.example/a", kanonikus_url: "f1.example/a", megjelenes: IDO, begyujtes: IDO, szoveg: "x", csonkolt: false, ujjlenyomat: "u", nyelv: "hu", lejar: "2026-10-08T06:00:00.000Z" });
    await k.tar.talalatMent(SZ, { id: "t1", szervezet_id: SZ, esemeny_id: "e1", kivonat_id: "t1", ertekeles: null, ertekeles_allapot: "fuggoben", megtekintes: "uj", jeloles: "nincs", letrehozva: IDO, futas_id: "fu", tartalomotlet: null });
    await k.tar.visszajelzesMent(SZ, { id: "v1", talalat_id: "t1", fajta: "fontos", okok: [], sajat_indok: "", letrehozva: IDO });
    const e1 = await finomhangolas(k, tulaj);
    expect(e1.ok && e1.tetelek.map((t) => t.talalat_id)).toEqual(["t1"]);
    expect(e1.ok && e1.tetelek[0]?.forras_cim).toBe("https://f1.example/feed");
    await k.tar.mintaMent(SZ, { id: "m1", szervezet_id: SZ, szabaly_verzio: 1, talalat_ids: ["t1"], letrehozva: "2026-08-01T00:00:00.000Z", lejar: "2026-08-31T00:00:00.000Z" });
    const e2 = await finomhangolas(k, tulaj);
    expect(e2.ok && e2.minta?.id).toBe("m1");
    expect(e2.ok && e2.mintaLejart).toBe(true);
  });

  it("már eldöntött javaslatról nem lehet újra dönteni (ERVENYTELEN_ADAT)", async () => {
    const k = kornyezet();
    await k.tar.verziokMent(SZ, [{ verzio: 1, beallitas: be, letrehozva: IDO, eredet: "kezi", allapot: "aktiv" }]);
    const j: SzabalyJavaslat = { id: "j1", szabaly_verzio: 1, javasolt: { ...be, kizarasok: ["sport"] }, mi_alapjan: ["v1"], indoklas: "i", varhato_hatas: "h", profil_erintett: false, allapot: "fuggo", minta_id: null, letrehozva: IDO };
    await k.tar.javaslatMent(SZ, j);
    const e1 = await javaslatDont(k, tulaj, "j1", "elfogad");
    expect(e1.ok && e1.ujVerzio?.verzio).toBe(2);
    const e2 = await javaslatDont(k, tulaj, "j1", "elfogad");
    expect(e2.ok).toBe(false);
    if (!e2.ok) expect(e2.hiba).toBe("ERVENYTELEN_ADAT");
    expect((await k.tar.verziok(SZ)).length).toBe(2);
  });
});
