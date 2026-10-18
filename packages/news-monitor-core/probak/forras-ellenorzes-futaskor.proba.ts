import { describe, expect, it } from "vitest";
import { figyelesFuttat, memoriaTar, type AiHivo, type HostKontextus, type Kornyezet, type Beallitas, type Forras } from "../src";

const SZ = "11111111-1111-4111-8111-111111111111";
const FI = "22222222-2222-4222-8222-222222222222";
const IDO = "2026-09-08T06:00:00.000Z";
const tulaj: HostKontextus = { fiok_id: FI, szervezet_id: SZ, szerep: "tulajdonos" };
const be: Beallitas = { celok: ["sajat_marka"], temak: [{ nev: "Teszt", nevvaltozatok: [], megkulonboztetes: "" }], foldrajzi_fokusz: "", nyelvek: [], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "" };

function csonkAi(): AiHivo {
  return async (tipus, _bemenet) => {
    if (tipus === "hf_ugyanaz_az_esemeny") {
      return { ok: true, valasz: { ugyanaz: false, indok: "csonk" } };
    }
    if (tipus === "hf_relevancia") {
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

function kornyezet(opciok: { letoltoValasz: any; forras: Forras }): { k: Kornyezet; letoltoHivasok: number } {
  let letoltoHivasok = 0;
  const letolto = async (_f: Forras) => {
    letoltoHivasok++;
    return opciok.letoltoValasz;
  };
  const k: Kornyezet = {
    tar: memoriaTar(),
    ai: csonkAi(),
    letolto,
    profil: {},
    idAdo: () => `id-${Math.random().toString(36).slice(2)}`,
    most: () => new Date(IDO),
  };
  return { k, letoltoHivasok: 0 }; // A számlálót a letolto closure-ban tartjuk, de a tesztben közvetlenül a letoltoHivasok változót nem tudjuk elérni így. 
  // Jobb, ha a számlálót a kornyezet objektumra függesztjük vagy egy külön változót adunk vissza.
  // A fenti megközelítés hibás, mert a letoltoHivasok a closure-ban van. 
  // Átírjuk:
}

// Helyes megközelítés a számlálóra:
function kornyezetSeged(opciok: { letoltoValasz: any; forras: Forras }): { k: Kornyezet; szamlalo: { hivasok: number } } {
  const szamlalo = { hivasok: 0 };
  const letolto = async (_f: Forras) => {
    szamlalo.hivasok++;
    return opciok.letoltoValasz;
  };
  const k: Kornyezet = {
    tar: memoriaTar(),
    ai: csonkAi(),
    letolto,
    profil: {},
    idAdo: () => `id-${Math.random().toString(36).slice(2)}`,
    most: () => new Date(IDO),
  };
  return { k, szamlalo };
}

async function elokeszit(k: Kornyezet, forras: Forras): Promise<void> {
  await k.tar.verziokMent(SZ, [{ verzio: 1, beallitas: be, letrehozva: IDO, eredet: "kezi", allapot: "aktiv" }]);
  await k.tar.forrasMent(SZ, forras);
}

describe("forrás ellenőrzése futáskor", () => {
  it("kezi forrás ellenőrzése sikeres: állapot hasznalhato, találatok > 0", async () => {
    const forras: Forras = {
      id: "f1",
      cim: "https://f1.example/feed",
      tipus: "rss",
      eredet: "kezi",
      allapot: "ellenorzes_alatt",
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const { k, szamlalo } = kornyezetSeged({
      letoltoValasz: {
        ok: true,
        tipus: "rss",
        szovegOlvashato: true,
        cikkek: [
          { cim: "Cikk 1", url: "https://f1.example/1", megjelenes: null, szoveg: "szoveg", nyelv: "hu" },
          { cim: "Cikk 2", url: "https://f1.example/2", megjelenes: null, szoveg: "szoveg", nyelv: "hu" },
        ],
      },
      forras,
    });
    await elokeszit(k, forras);
    const e = await figyelesFuttat(k, tulaj, { proba: true });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    
    const forrasok = await k.tar.forrasok(SZ);
    const talaltForras = forrasok.find(f => f.id === "f1");
    expect(talaltForras?.allapot).toBe("hasznalhato");
    expect(e.ujTalalatok.length).toBeGreaterThan(0);
  });

  it("kezi forrás ellenőrzése sikertelen: állapot hibas, futás hiba", async () => {
    const forras: Forras = {
      id: "f1",
      cim: "https://f1.example/feed",
      tipus: "rss",
      eredet: "kezi",
      allapot: "ellenorzes_alatt",
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const { k, szamlalo } = kornyezetSeged({
      letoltoValasz: { ok: false, hibaOk: "nem_elerheto" },
      forras,
    });
    await elokeszit(k, forras);
    const e = await figyelesFuttat(k, tulaj, { proba: true });
    expect(e.ok).toBe(true); // A futás maga sikeresen lefutott, de a forrás hibás
    if (!e.ok) return;
    
    const forrasok = await k.tar.forrasok(SZ);
    const talaltForras = forrasok.find(f => f.id === "f1");
    expect(talaltForras?.allapot).toBe("hibas");
    expect(e.futas.allapot).toBe("hiba");
  });

  it("ai_javaslat forrás nem ellenőrzött: letöltő nem hívódik, állapot változatlan", async () => {
    const forras: Forras = {
      id: "f1",
      cim: "https://f1.example/feed",
      tipus: "rss",
      eredet: "ai_javaslat",
      allapot: "ellenorzes_alatt",
      ellenorzott: false,
      utolso_sikeres: null,
      hiba_ok: null,
    };
    const { k, szamlalo } = kornyezetSeged({
      letoltoValasz: {
        ok: true,
        tipus: "rss",
        szovegOlvashato: true,
        cikkek: [
          { cim: "Cikk 1", url: "https://f1.example/1", megjelenes: null, szoveg: "szoveg", nyelv: "hu" },
        ],
      },
      forras,
    });
    await elokeszit(k, forras);
    const e = await figyelesFuttat(k, tulaj, { proba: true });
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    
    expect(szamlalo.hivasok).toBe(0);
    const forrasok = await k.tar.forrasok(SZ);
    const talaltForras = forrasok.find(f => f.id === "f1");
    expect(talaltForras?.allapot).toBe("ellenorzes_alatt");
  });
});
