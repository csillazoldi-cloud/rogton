// E-25: az AI beállítás-javaslata — a profilból (+ szabad szövegből) tervezetet készít, aktív verziót soha nem ír.
import { describe, expect, it } from "vitest";
import { beallitasJavaslatKer, beallitasMent, memoriaTar, type AiHivo, type Beallitas, type HostKontextus, type Kornyezet } from "../src";

const SZ = "11111111-1111-4111-8111-111111111111";
const IDO = "2026-09-08T06:00:00.000Z";
const tulaj: HostKontextus = { fiok_id: "22222222-2222-4222-8222-222222222222", szervezet_id: SZ, szerep: "tulajdonos" };
const nezo: HostKontextus = { ...tulaj, szerep: "nezo" };

const javasolt: Beallitas = {
  celok: ["sajat_marka", "szakmai"],
  // J-1 (2026-09-25): a cég nevét tartalmazó témát a mag kiszűri (0 hírt okozott) — ezért a minta-téma szakmai téma, nem a cégnév.
  temak: [{ nev: "helyi közlekedés", nevvaltozatok: ["tömegközlekedés"], megkulonboztetes: "" }, { nev: "buszjáratok", nevvaltozatok: [], megkulonboztetes: "" }, { nev: "menetrend", nevvaltozatok: [], megkulonboztetes: "" }],
  foldrajzi_fokusz: "Marosvásárhely",
  nyelvek: ["hu"],
  kizarasok: ["sport"],
  idozites: { mod: "napi", ora: 9, perc: 30, idozona: "Europe/Bucharest" },
  szabad_szoveg: "",
};

function kornyezet(ai: AiHivo): Kornyezet {
  return { tar: memoriaTar(), ai, letolto: (async () => ({ ok: false, hiba: "nincs" })) as never, profil: { nev: "Teszt Kft." }, idAdo: () => "id", most: () => new Date(IDO) };
}
const jo: AiHivo = async (feladat, be) => {
  expect(feladat).toBe("hf_beallitas_javaslat");
  expect((be as { szabad_szoveg: string }).szabad_szoveg).toBeDefined();
  return { ok: true, valasz: { beallitas: javasolt }, becsult_usd: 0 };
};

describe("beallitasJavaslatKer", () => {
  it("néző → NINCS_JOG", async () => {
    expect(await beallitasJavaslatKer(kornyezet(jo), nezo, "")).toEqual({ ok: false, hiba: "NINCS_JOG" });
  });

  it("siker → tervezet mentve a szabad szöveggel, aktív verzió NEM keletkezett", async () => {
    const k = kornyezet(jo);
    const e = await beallitasJavaslatKer(k, tulaj, "helyi közlekedés");
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.tervezet.temak[0]?.nev).toBe("helyi közlekedés");
    expect(e.tervezet.szabad_szoveg).toBe("helyi közlekedés");
    expect(await k.tar.tervezet(SZ, tulaj.fiok_id)).toEqual(e.tervezet);
    expect(await k.tar.verziok(SZ)).toEqual([]);
  });

  it("aktív verzió mellett az időzítés az aktívé marad", async () => {
    const k = kornyezet(jo);
    const mentes = await beallitasMent(k, tulaj, { ...javasolt, idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" } }, "kezi");
    expect(mentes.ok).toBe(true);
    const e = await beallitasJavaslatKer(k, tulaj, "");
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.tervezet.idozites).toEqual({ mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" });
    expect((await k.tar.verziok(SZ)).length).toBe(1);
  });

  it("AI-hiba → AI_NEM_ELERHETO; rossz válasz → AI_ROSSZ_VALASZ, nincs tervezet", async () => {
    const k1 = kornyezet(async () => ({ ok: false, kod: "AI_NEM_ELERHETO" }));
    expect(await beallitasJavaslatKer(k1, tulaj, "")).toEqual({ ok: false, hiba: "AI_NEM_ELERHETO" });
    const k2 = kornyezet(async () => ({ ok: true, valasz: { beallitas: { ...javasolt, celok: [] } }, becsult_usd: 0 }));
    const e = await beallitasJavaslatKer(k2, tulaj, "");
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.hiba).toBe("AI_ROSSZ_VALASZ");
    expect(await k2.tar.tervezet(SZ, tulaj.fiok_id)).toBeNull();
  });
});
