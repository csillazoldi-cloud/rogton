// E-29b: a hírfigyelő futásának biztonsági fékei — pár-korlát, határidő, üres cím kiszűrése.
import { describe, expect, it } from "vitest";
import { figyelesFuttat, attekintes, memoriaTar, type AiHivo, type HostKontextus, type Kornyezet, type Beallitas, type Forras, type Futas } from "../src";

const SZ = "11111111-1111-4111-8111-111111111111";
const FI = "22222222-2222-4222-8222-222222222222";
const IDO = "2026-09-08T06:00:00.000Z";
const tulaj: HostKontextus = { fiok_id: FI, szervezet_id: SZ, szerep: "tulajdonos" };
const be: Beallitas = { celok: ["sajat_marka"], temak: [{ nev: "Teszt", nevvaltozatok: [], megkulonboztetes: "" }], foldrajzi_fokusz: "", nyelvek: [], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "" };

/** Csonk AI: minden hívást számol, a pár-kérdésre hamisat, az értékelésre érvényes választ ad. */
function csonkAi(szamlalok: { par: number; relevancia: number }): AiHivo {
  return async (tipus, _bemenet) => {
    if (tipus === "hf_ugyanaz_az_esemeny") {
      szamlalok.par++;
      return { ok: true, valasz: { ugyanaz: false, indok: "csonk" } };
    }
    if (tipus === "hf_relevancia") {
      szamlalok.relevancia++;
      return {
        ok: true,
        valasz: {
          fontossag: "erdekes",
          temacimke: "szakmai",
          miert: "mert",
          indoklas: "csonk",
          osszefoglalo: "osszefoglalo",
        },
      };
    }
    return { ok: false, kod: "AI_NEM_ELERHETO" };
  };
}

/** Környezet: egy forrás, sok azonos szövegű cikk; az AI lépteti az órát minden hívásnál. */
function kornyezet(opciok: { cikkSzam: number; hatarido?: Date; lepkedoOra?: boolean; uresCimuIndex?: number }): { k: Kornyezet; szamlalok: { par: number; relevancia: number }; ora: Date } {
  const szamlalok = { par: 0, relevancia: 0 };
  const alap = new Date(IDO);
  let ora = new Date(alap.getTime());
  const ai: AiHivo = async (tipus, _bemenet) => {
    if (opciok.lepkedoOra) ora = new Date(ora.getTime() + 60_000); // minden AI-hívás 1 perc
    if (tipus === "hf_ugyanaz_az_esemeny") {
      szamlalok.par++;
      return { ok: true, valasz: { ugyanaz: false, indok: "csonk" } };
    }
    if (tipus === "hf_relevancia") {
      szamlalok.relevancia++;
      return {
        ok: true,
        valasz: {
          fontossag: "erdekes",
          temacimke: "szakmai",
          miert: "mert",
          indoklas: "csonk",
          osszefoglalo: "osszefoglalo",
        },
      };
    }
    return { ok: false, kod: "AI_NEM_ELERHETO" };
  };
  const cikkek = Array.from({ length: opciok.cikkSzam }, (_, i) => ({
    cim: opciok.uresCimuIndex === i ? "" : `Cikk ${i}`,
    url: `https://f1.example/${i}`,
    megjelenes: null,
    szoveg: "Ugyanaz a szöveg minden cikkben, hogy minden pár gyanús legyen.",
    nyelv: "hu",
  }));
  const letolto = async (_f: Forras) => ({ ok: true as const, tipus: "rss" as const, szovegOlvashato: true, cikkek });
  const k: Kornyezet = {
    tar: memoriaTar(),
    ai,
    letolto,
    profil: {},
    idAdo: () => `id-${Math.random().toString(36).slice(2)}`,
    most: () => ora,
  };
  return { k, szamlalok, ora };
}

/** Beállítja az aktív verziót és a forrást, hogy a futás elindulhasson. */
async function elokeszit(k: Kornyezet): Promise<void> {
  await k.tar.verziokMent(SZ, [{ verzio: 1, beallitas: be, letrehozva: IDO, eredet: "kezi", allapot: "aktiv" }]);
  await k.tar.forrasMent(SZ, { id: "f1", cim: "https://f1.example/feed", tipus: "rss", eredet: "kezi", allapot: "hasznalhato", ellenorzott: true, utolso_sikeres: IDO, hiba_ok: null });
}

describe("futás biztonsági fékei", () => {
  it("a pár-korlát fog: 20 azonos cikk (190 pár) → pontosan HF_PAR_KORLAT hívás, a futás reszleges", async () => {
    const { k, szamlalok } = kornyezet({ cikkSzam: 20 });
    await elokeszit(k);
    const e = await figyelesFuttat(k, tulaj, { proba: true });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(szamlalok.par).toBe(60); // HF_PAR_KORLAT
    expect(e.futas.allapot).toBe("reszleges");
  });

  it("korlát alatt nincs változás: 5 azonos cikk (10 pár) → 10 hívás, a futás kesz", async () => {
    const { k, szamlalok } = kornyezet({ cikkSzam: 5 });
    await elokeszit(k);
    const e = await figyelesFuttat(k, tulaj, { proba: true });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(szamlalok.par).toBe(10);
    expect(e.futas.allapot).toBe("kesz");
  });

  it("a határidő fog: 3 perc alatt legfeljebb 3-4 AI-hívás, a futás reszleges, a lista nem üres", async () => {
    const { k, szamlalok, ora } = kornyezet({ cikkSzam: 20, hatarido: new Date(new Date(IDO).getTime() + 3 * 60_000), lepkedoOra: true });
    await elokeszit(k);
    const e = await figyelesFuttat(k, tulaj, { proba: true, hatarido: new Date(new Date(IDO).getTime() + 3 * 60_000) });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(szamlalok.par + szamlalok.relevancia).toBeLessThanOrEqual(4);
    expect(e.futas.allapot).toBe("reszleges");
    const at = await attekintes(k, tulaj);
    expect(at.ok).toBe(true);
    if (!at.ok) return;
    expect(at.talalatok.length).toBeGreaterThan(0);
  });

  it("határidő nélkül a régi viselkedés: minden pár lekérdeződik a korlátig, nem részleges a határidő miatt", async () => {
    const { k, szamlalok } = kornyezet({ cikkSzam: 20, lepkedoOra: true });
    await elokeszit(k);
    const e = await figyelesFuttat(k, tulaj, { proba: true });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(szamlalok.par).toBe(60); // a korlátig megy, de nem a határidő miatt áll le
    expect(e.futas.allapot).toBe("reszleges"); // a pár-korlát miatt
  });

  it("cím nélküli cikk kimarad: 3 cikkből 1 üres című → 2 találat, nincs üres című kivonat", async () => {
    const { k } = kornyezet({ cikkSzam: 3, uresCimuIndex: 1 });
    await elokeszit(k);
    const e = await figyelesFuttat(k, tulaj, { proba: true });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.ujTalalatok.length).toBe(2);
    const at = await attekintes(k, tulaj);
    expect(at.ok).toBe(true);
    if (!at.ok) return;
    expect(at.talalatok.length).toBe(2);
    const kivonatok = await k.tar.kivonatok(SZ, at.talalatok.map((t) => t.kivonat_id));
    expect(kivonatok.length).toBe(2);
    expect(kivonatok.every((kv) => kv.cim.trim().length > 0)).toBe(true);
  });

  it("az értékelés is megáll a határidőnél: van fuggoben találat, a futás reszleges", async () => {
    const { k, szamlalok } = kornyezet({ cikkSzam: 20, hatarido: new Date(new Date(IDO).getTime() + 2 * 60_000), lepkedoOra: true });
    await elokeszit(k);
    const e = await figyelesFuttat(k, tulaj, { proba: true, hatarido: new Date(new Date(IDO).getTime() + 2 * 60_000) });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.futas.allapot).toBe("reszleges");
    expect(szamlalok.relevancia).toBeLessThan(e.ujTalalatok.length); // nem értékeltük mindet
    const at = await attekintes(k, tulaj);
    expect(at.ok).toBe(true);
    if (!at.ok) return;
    expect(at.talalatok.some((t) => t.ertekeles_allapot === "fuggoben")).toBe(true);
  });
});
