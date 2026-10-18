// A bekötés próbája (E-19b, H-3): a hírfigyelő magja a proba-host csatlakozóival fut — a modul kódjának módosítása nélkül.
import { describe, expect, it } from "vitest";
import { beallitasMent, figyelesFuttat, forrasEllenoriz, forrasHozzaad, memoriaTar, attekintes, type Kornyezet } from "@rogton/news-monitor-core";
import { kontextus, rogzitettLetolto, tesztAi, idAdo, most, rogzitettProfil } from "../src/host";

function kornyezet(): Kornyezet {
  return { tar: memoriaTar(), letolto: rogzitettLetolto, ai: tesztAi, profil: rogzitettProfil, idAdo, most };
}
const BEALLITAS = { celok: ["sajat_marka"], temak: [{ nev: "Minta Műhely", nevvaltozatok: [], megkulonboztetes: "" }], foldrajzi_fokusz: "", nyelvek: [], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "" };

describe("proba-host bekötés (E-19b)", () => {
  it("1. a rögzített profil a @rogton/contracts sémája szerint érvényes", () => {
    expect(rogzitettProfil.nev).toBe("Minta Műhely");
    expect(rogzitettProfil.arculat.allapot).toBe("jovahagyott");
  });

  it("2. beállítás → források (jó, hibás, facebook) → futás: 3 kártya, 4 cikk, 1 hibás forrás; a facebook nem forrás", async () => {
    const k = kornyezet();
    const m = await beallitasMent(k, kontextus, BEALLITAS, "kezi");
    expect(m.ok && m.uj?.verzio).toBe(1);
    const jo = await forrasHozzaad(k, kontextus, "https://pelda.hu/feed", "kezi");
    const rossz = await forrasHozzaad(k, kontextus, "https://hibas.pelda.hu/", "kezi");
    const fb = await forrasHozzaad(k, kontextus, "https://www.facebook.com/mintamuhely", "kezi");
    expect(jo.ok && rossz.ok && fb.ok).toBe(true);
    if (!jo.ok || !rossz.ok || !fb.ok) return;
    expect(fb.forras.allapot).toBe("nem_tamogatott");
    await forrasEllenoriz(k, kontextus, jo.forras.id);
    await forrasEllenoriz(k, kontextus, rossz.forras.id);
    const r = await figyelesFuttat(k, kontextus, { proba: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.futas.allapot).toBe("reszleges");
    expect(r.futas.uj_talalatok).toBe(3);
    expect(r.ujTalalatok.length).toBe(4);
    expect(r.futas.hibas_forrasok.map((h) => h.forras_id)).toEqual([rossz.forras.id]);
    const a = await attekintes(k, kontextus);
    expect(a.ok && a.ujDb).toBe(4);
  });

  it("3. A-10: ugyanaz a futás még egyszer → 0 új kártya, 0 új cikk; a találatok száma marad", async () => {
    const k = kornyezet();
    await beallitasMent(k, kontextus, BEALLITAS, "kezi");
    const jo = await forrasHozzaad(k, kontextus, "https://pelda.hu/feed", "kezi");
    if (!jo.ok) return;
    await forrasEllenoriz(k, kontextus, jo.forras.id);
    const r1 = await figyelesFuttat(k, kontextus, { proba: false });
    const r2 = await figyelesFuttat(k, kontextus, { proba: false });
    expect(r1.ok && r1.ujTalalatok.length).toBe(4);
    expect(r2.ok && r2.ujTalalatok.length).toBe(0);
    expect(r2.ok && r2.futas.uj_talalatok).toBe(0);
    expect((await k.tar.talalatok(kontextus.szervezet_id)).length).toBe(4);
    expect((await k.tar.esemenyek(kontextus.szervezet_id)).length).toBe(3);
  });
});
