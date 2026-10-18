import { describe, it, expect } from "vitest";
import { tiltottSzavakEllenorzes } from "../poszt/szuro";

// R-11/A · B-7: a tiltott szavakat kód nézi, szó szerint. Ez a próba adatbázis és AI nélkül fut.

describe("tiltott szavak a posztszövegben (B-7)", () => {
  it("üres listánál soha nincs találat", () => {
    expect(tiltottSzavakEllenorzes("bármilyen szöveg", [])).toBeNull();
  });

  it("megtalálja a szót, kis- és nagybetűtől függetlenül", () => {
    expect(tiltottSzavakEllenorzes("Ez egy OLCSÓ megoldás.", ["olcsó"])).toBe("olcsó");
  });

  it("szóhatáron néz: a szó része nem találat", () => {
    expect(tiltottSzavakEllenorzes("A legolcsóbb pékáru.", ["olcsó"])).toBeNull();
  });

  it("a toldalékos alak sem találat — a tiltás szó szerinti", () => {
    expect(tiltottSzavakEllenorzes("Ez olcsóbb lett.", ["olcsó"])).toBeNull();
  });

  it("központozás nem zavarja meg", () => {
    expect(tiltottSzavakEllenorzes("Ingyen! Tényleg.", ["ingyen"])).toBe("ingyen");
  });

  it("több szóból álló kifejezést tartalmazásként keres", () => {
    expect(tiltottSzavakEllenorzes("A legjobb ár garantált nálunk.", ["legjobb ár"])).toBe("legjobb ár");
  });

  it("az elsőt adja vissza a listából, nem az összeset", () => {
    expect(tiltottSzavakEllenorzes("olcsó és ingyen", ["ingyen", "olcsó"])).toBe("ingyen");
  });

  it("az üres és csak szóközös tételeket kihagyja", () => {
    expect(tiltottSzavakEllenorzes("rendes szöveg", ["", "   "])).toBeNull();
  });

  it("ékezetes szavakat is megtalál a szóhatáron", () => {
    expect(tiltottSzavakEllenorzes("Ez egy őrült jó ajánlat.", ["őrült"])).toBe("őrült");
  });
});
