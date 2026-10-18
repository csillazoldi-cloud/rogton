// R-16 K5 (TERV §2-K5 Self-test, 1.5, gepezet 8): a feltöltött betű kiszolgálói vizsgálata a VALÓDI fontkittel (arculat/betu.ts) —
// megnyílik-e, mi a neve, mi hiányzik a magyar és a román ékezetekből. Adatbázis és kiszolgáló nélkül.
// Próbafájlok: a képgyártó saját woff2-jei (tools/vizual/referencia/betuk-munkater — mérve a TERV-ben: a latin fájlból hiányzik
// az Ő Ș ț ă, a latin-ext fájlból az alap latin betűk), és két teljes OFL betű: probak/betuk/Caladea-Regular.ttf (semmi nem hiányzik)
// és Caladea-Italic.ttf (a román ș ț Ș hiányzik — mérve fontkittel, 2026-09-30). Licenc: probak/betuk/OFL-Caladea.txt.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hianyzoNyelvre } from "@rogton/arculat-core";
import { betuVizsgal } from "../arculat/betu";

const olvas = (ut: string) => new Uint8Array(readFileSync(new URL(ut, import.meta.url)));
const MUNKATER = "../../../tools/vizual/referencia/betuk-munkater/";

describe("betuVizsgal (fontkit)", () => {
  it("teljes TTF (Caladea Regular): megnyílik, a neve a családnév, magyarból és románból semmi nem hiányzik", () => {
    const e = betuVizsgal(olvas("./betuk/Caladea-Regular.ttf"), "Caladea-Regular.ttf");
    expect(e).toEqual({ fajta: "betu", nev: "Caladea", hianyzo: [] });
  });
  it("román ș nélküli TTF (Caladea Italic): magyar munkatérben nincs hiány, magyar + románban a ș ț Ș", () => {
    const e = betuVizsgal(olvas("./betuk/Caladea-Italic.ttf"), "Caladea-Italic.ttf")!;
    expect(e.nev).toBe("Caladea");
    expect(hianyzoNyelvre(e, ["hu"])).toEqual([]);
    expect(hianyzoNyelvre(e, ["hu", "ro"])).toEqual(["ș", "ț", "Ș"]);
  });
  it("WOFF2 (a képgyártó latin fájlja): megnyílik; az ő ű Ő Ű hiányzik (az a latin-ext fájlban van)", () => {
    const e = betuVizsgal(olvas(MUNKATER + "public-sans-latin-400-normal.woff2"), "public-sans-latin-400-normal.woff2")!;
    expect(e.nev).toMatch(/^Public Sans/); // mérve: a fontsource-fájl belső neve „Public Sans Thin” (változó betű részlete)
    expect(hianyzoNyelvre(e, ["hu"])).toEqual(["ő", "ű", "Ő", "Ű"]);
  });
  it("nem betű (PNG bájtok, csonka TTF-fej, üres): null → a végpont 415-öt ad, a lemezre nem kerül", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    expect(betuVizsgal(png, "logo.png")).toBeNull();
    const csonka = olvas("./betuk/Caladea-Regular.ttf").slice(0, 400);
    expect(betuVizsgal(csonka, "csonka.ttf")).toBeNull();
    expect(betuVizsgal(new Uint8Array([0, 1, 0, 0]), "ures.ttf")).toBeNull();
  });
});
