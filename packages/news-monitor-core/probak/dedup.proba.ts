import { describe, it, expect } from "vitest";
import {
  gyanusPar,
  esemenybeSorol,
} from "../src/index";

const MOST = new Date("2026-09-07T10:00:00Z");

function keszitKivonat(id: string, cim: string, ujjlenyomat: string, megjelenes: string): any {
  return {
    id,
    forras_id: "f1",
    cim,
    url: `https://pelda.hu/${id}`,
    kanonikus_url: `https://pelda.hu/${id}`,
    megjelenes,
    begyujtes: megjelenes,
    szoveg: "Teszt szöveg",
    csonkolt: false,
    ujjlenyomat,
    nyelv: "hu",
    lejar: "2026-10-07T10:00:00Z",
  };
}

describe("dedup.ts — gyanus parok, esemenybe sorolas (E-19)", () => {
  it("5.1: azonos ujjlenyomat → gyanus", () => {
    const a = keszitKivonat("k1", "Első cím", "ujj1", "2026-09-07T08:00:00Z");
    const b = keszitKivonat("k2", "Második cím", "ujj1", "2026-09-07T09:00:00Z");
    expect(gyanusPar(a, b)).toBe(true);
  });

  it("5.2: hasonlo cim 72 oran belul → gyanus", () => {
    const a = keszitKivonat("k1", "Nagy bejelentés a cégtől", "ujj1", "2026-09-07T08:00:00Z");
    const b = keszitKivonat("k2", "Nagy bejelentés a vállalattól", "ujj2", "2026-09-07T09:00:00Z");
    expect(gyanusPar(a, b)).toBe(true);
  });

  it("5.3: hasonlo cim 5 nap kulonbseggel → nem gyanus", () => {
    const a = keszitKivonat("k1", "Nagy bejelentés a cégtől", "ujj1", "2026-09-01T08:00:00Z");
    const b = keszitKivonat("k2", "Nagy bejelentés a vállalattól", "ujj2", "2026-09-07T09:00:00Z");
    expect(gyanusPar(a, b)).toBe(false);
  });

  it("5.4: mas cim → nem gyanus", () => {
    const a = keszitKivonat("k1", "Teljesen más téma", "ujj1", "2026-09-07T08:00:00Z");
    const b = keszitKivonat("k2", "Egyáltalán nem hasonló", "ujj2", "2026-09-07T09:00:00Z");
    expect(gyanusPar(a, b)).toBe(false);
  });

  it("5.5: esemenybeSorol — 3 kivonat, 2 ugyanaz → 2 esemeny, az egyikben 2 kivonat", () => {
    let szamlalo = 0;
    const idAdo = () => `e${++szamlalo}`;

    const k1 = keszitKivonat("k1", "Bejelentés", "ujj1", "2026-09-07T08:00:00Z");
    const k2 = keszitKivonat("k2", "Bejelentés", "ujj1", "2026-09-07T09:00:00Z"); // ugyanaz mint k1
    const k3 = keszitKivonat("k3", "Más hír", "ujj3", "2026-09-07T10:00:00Z");

    // ugyanaz tiszta függvény: azonos ujjlenyomat alapján
    const ugyanaz = (a: any, b: any) => a.ujjlenyomat === b.ujjlenyomat;

    const eredmeny = esemenybeSorol([k1, k2, k3], [], ugyanaz, idAdo, MOST);

    expect(eredmeny.ujEsemenyek).toHaveLength(2);
    // Melyik eseményben 2 kivonat?
    const kettovel = eredmeny.ujEsemenyek.find((e: any) => e.talalat_ids.length === 2);
    expect(kettovel).toBeDefined();
    const eggyel = eredmeny.ujEsemenyek.find((e: any) => e.talalat_ids.length === 1);
    expect(eggyel).toBeDefined();
    expect(eredmeny.bovitett).toHaveLength(0); // nincs meglévő esemény
  });

  it("5.6: esemenybeSorol — meglévő eseményhez bővít", () => {
    let szamlalo = 0;
    const idAdo = () => `e${++szamlalo}`;

    const k1 = keszitKivonat("k1", "Bejelentés", "ujj1", "2026-09-07T08:00:00Z");
    const k2 = keszitKivonat("k2", "Bejelentés", "ujj1", "2026-09-07T09:00:00Z");

    const ugyanaz = (a: any, b: any) => a.ujjlenyomat === b.ujjlenyomat;

    // Első futás
    const eredmeny1 = esemenybeSorol([k1], [], ugyanaz, idAdo, MOST);
    const meglevoEsemeny = eredmeny1.ujEsemenyek[0];

    // Második futás — meglévő eseményhez bővít
    const meglevo = {
      esemeny: meglevoEsemeny,
      kivonatok: [k1],
    };
    const eredmeny2 = esemenybeSorol([k2], [meglevo], ugyanaz, idAdo, MOST);

    expect(eredmeny2.ujEsemenyek).toHaveLength(0);
    expect(eredmeny2.bovitett).toHaveLength(1);
    expect(eredmeny2.bovitett[0].esemeny_id).toBe(meglevoEsemeny.id);
    expect(eredmeny2.bovitett[0].kivonat_id).toBe("k2");
  });

  it("5.7: esemenybeSorol — determinisztikus, ketszer futtatva ugyanaz", () => {
    let szamlalo = 0;
    const idAdo = () => `e${++szamlalo}`;

    const k1 = keszitKivonat("k1", "Első", "ujj1", "2026-09-07T08:00:00Z");
    const k2 = keszitKivonat("k2", "Második", "ujj2", "2026-09-07T09:00:00Z");

    const ugyanaz = () => false; // soha nem ugyanaz

    const eredmeny1 = esemenybeSorol([k1, k2], [], ugyanaz, idAdo, MOST);
    
    szamlalo = 0; // reset az idAdo-hoz
    const eredmeny2 = esemenybeSorol([k1, k2], [], ugyanaz, idAdo, MOST);

    expect(eredmeny1.ujEsemenyek.map((e: any) => e.talalat_ids)).toEqual(
      eredmeny2.ujEsemenyek.map((e: any) => e.talalat_ids)
    );
    expect(eredmeny1.ujEsemenyek.map((e: any) => e.id)).toEqual(
      eredmeny2.ujEsemenyek.map((e: any) => e.id)
    );
  });
});
