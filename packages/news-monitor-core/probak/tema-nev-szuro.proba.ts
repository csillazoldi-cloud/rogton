// J-1: a cég nevéből képzett témák kiszűrése — determinisztikus őr az AI után.
import { describe, expect, it } from "vitest";
import {
  beallitasJavaslatKer,
  cegnevTemakNelkul,
  memoriaTar,
  temaCegnevbol,
  type AiHivo,
  type Beallitas,
  type HostKontextus,
  type Kornyezet,
} from "../src";

const SZ = "11111111-1111-4111-8111-111111111111";
const IDO = "2026-09-08T06:00:00.000Z";
const tulaj: HostKontextus = { fiok_id: "22222222-2222-4222-8222-222222222222", szervezet_id: SZ, szerep: "tulajdonos" };

const alap: Beallitas = {
  celok: ["sajat_marka", "szakmai"],
  temak: [{ nev: "Teszt Kft.", nevvaltozatok: ["TesztKft"], megkulonboztetes: "" }],
  foldrajzi_fokusz: "Marosvásárhely",
  nyelvek: ["hu"],
  kizarasok: ["sport"],
  idozites: { mod: "napi", ora: 9, perc: 30, idozona: "Europe/Bucharest" },
  szabad_szoveg: "",
};

function kornyezet(ai: AiHivo): Kornyezet {
  return {
    tar: memoriaTar(),
    ai,
    letolto: (async () => ({ ok: false, hiba: "nincs" })) as never,
    profil: { nev: "Tibor Térkő" },
    idAdo: () => "id",
    most: () => new Date(IDO),
  };
}

function tema(nev: string): Beallitas["temak"][number] {
  return { nev, nevvaltozatok: [], megkulonboztetes: "" };
}

describe("temaCegnevbol", () => {
  it("a cég nevét tartalmazó témát felismeri (ékezet és kisbetű nélkül is)", () => {
    expect(temaCegnevbol("Tibor Térkő márka", "Tibor Térkő")).toBe(true);
    expect(temaCegnevbol("tibor terko velemeny", "Tibor Térkő")).toBe(true);
  });

  it("csak egész szóra illeszt, nem részszóra", () => {
    expect(temaCegnevbol("térkövezés", "Tibor Térkő")).toBe(false);
    expect(temaCegnevbol("Tiborfalvi hírek", "Tibor")).toBe(false);
  });
});

describe("cegnevTemakNelkul", () => {
  it("a cég nevét tartalmazó témákat elhagyja, és megadja a kiesettek számát", () => {
    const temak = [
      tema("Tibor Térkő márka"),
      tema("térkövezés"),
      tema("Tibor Térkő vélemény"),
      tema("udvarfelújítás"),
    ];
    const e = cegnevTemakNelkul(temak, "Tibor Térkő");
    expect(e.temak.map((t) => t.nev)).toEqual(["térkövezés", "udvarfelújítás"]);
    expect(e.kiesett).toBe(2);
  });
});

describe("beallitasJavaslatKer — cégneves témák kiszűrése", () => {
  it("első válasz csupa cégneves téma → második hívás, a tervezetben nincs cégneves téma", async () => {
    let hivasok = 0;
    const ai: AiHivo = async (feladat, be) => {
      expect(feladat).toBe("hf_beallitas_javaslat");
      expect((be as { szabad_szoveg: string }).szabad_szoveg).toBeDefined();
      hivasok += 1;
      if (hivasok === 1) {
        return {
          ok: true,
          valasz: {
            beallitas: {
              ...alap,
              temak: [
                tema("Tibor Térkő márka"),
                tema("Tibor Térkő vélemény"),
                tema("Tibor Térkő hírek"),
                tema("Tibor Térkő ajánlat"),
              ],
            },
          },
          becsult_usd: 0,
        };
      }
      return {
        ok: true,
        valasz: {
          beallitas: {
            ...alap,
            temak: [
              tema("térkövezés"),
              tema("udvarfelújítás"),
              tema("építőanyag-árak"),
              tema("útfelújítás"),
            ],
          },
        },
        becsult_usd: 0,
      };
    };

    const k = kornyezet(ai);
    const e = await beallitasJavaslatKer(k, tulaj, "");
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(hivasok).toBe(2);
    expect(e.tervezet.temak.length).toBeGreaterThanOrEqual(3);
    for (const t of e.tervezet.temak) {
      expect(temaCegnevbol(t.nev, "Tibor Térkő")).toBe(false);
    }
  });

  it("első válasz már jó → az AI-t pontosan egyszer hívja", async () => {
    let hivasok = 0;
    const ai: AiHivo = async (feladat, be) => {
      expect(feladat).toBe("hf_beallitas_javaslat");
      expect((be as { szabad_szoveg: string }).szabad_szoveg).toBeDefined();
      hivasok += 1;
      return {
        ok: true,
        valasz: {
          beallitas: {
            ...alap,
            temak: [
              tema("térkövezés"),
              tema("udvarfelújítás"),
              tema("építőanyag-árak"),
              tema("útfelújítás"),
              tema("kertépítés"),
            ],
          },
        },
        becsult_usd: 0,
      };
    };

    const k = kornyezet(ai);
    const e = await beallitasJavaslatKer(k, tulaj, "");
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(hivasok).toBe(1);
    expect(e.tervezet.temak.length).toBeGreaterThanOrEqual(3);
    for (const t of e.tervezet.temak) {
      expect(temaCegnevbol(t.nev, "Tibor Térkő")).toBe(false);
    }
  });
});
