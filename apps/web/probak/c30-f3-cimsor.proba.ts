// c30 F3 follow-up (main session's live test on the real AI, 2026-10-17, test org „Zilele teszt” [hu, ro] egyben): both halves of the
// joined post started with a title written as a sentence — „Kökény Attila vasárnapi koncertje.” / „Concertul lui Kökény Attila
// duminică.” Round 8 (Kati 10-14) removed exactly that. The code guard (poszt/bemenet.ts kozolhetoSzoveg) only knew titles WITHOUT
// end punctuation; a title ending in a period passed in BOTH modes (one-language too). Now: kozolhetoSzoveg gets the trigger's title(s)
// (mondatCim), and the translation drops an extra short first paragraph the source does not have (forditasCimNelkul).
// docs/decisions/2026-10-17-c30-f4-kep-masodik-nyelv.md § F3 follow-up. Pure tests: the model answers are fixed strings here.
import { describe, expect, it } from "vitest";
import { forditasCimNelkul, kozolhetoSzoveg, mondatCim } from "../poszt/bemenet";
import { KETNYELVU_ELVALASZTO, ketnyelvuOsszefuz } from "../poszt/ketnyelvu";

const CIM = ["Kökény Attila vasárnap", "Kökény Attila lép fel vasárnap a Győzelem téren"];
const HU_TORZS = "Vasárnap este 20 órakor Kökény Attila lép fel a Győzelem téri Nagyszínpadon, utána jön a Voltaj és a tűzijáték.\n\nGyertek korán, a téren már délután is lesz program a családoknak!";
const RO_TORZS = "Duminică seara, la ora 20, Kökény Attila urcă pe Scena Mare din Piața Victoriei, apoi urmează Voltaj și focurile de artificii.\n\nVeniți devreme, în piață sunt programe pentru familii încă de după-amiază!";
const TAGEK = "#zileletargumuresene #marosvasarhely";

describe("c30 F3 follow-up: no title sentence at the top, in either half", () => {
  it("first half: a model answer that starts with „Kökény Attila vasárnapi koncertje.” loses that line (the real opening sentence stays)", () => {
    const valasz = `Kökény Attila vasárnapi koncertje.\n\n${HU_TORZS}\n\n${TAGEK}`;
    expect(kozolhetoSzoveg(valasz, CIM)).toBe(`${HU_TORZS}\n\n${TAGEK}`);
    expect(mondatCim("Kökény Attila vasárnapi koncertje.", CIM)).toBe(true);
  });

  it("second half: the translation of the clean first half never gets an extra title paragraph", () => {
    const forras = `${HU_TORZS}\n\n${TAGEK}`;
    const forditas = `Concertul lui Kökény Attila duminică.\n\n${RO_TORZS}\n\n${TAGEK}`;
    expect(forditasCimNelkul(forras, forditas)).toBe(`${RO_TORZS}\n\n${TAGEK}`);
    // a RO-first org writes the Romanian half itself: the same guard with its Romanian title
    expect(kozolhetoSzoveg(forditas, ["Concertul lui Kökény Attila duminică"])).toBe(`${RO_TORZS}\n\n${TAGEK}`);
  });

  it("the joined post then starts with the first real sentence; one separator, hashtags once", () => {
    const hu = kozolhetoSzoveg(`Kökény Attila vasárnapi koncertje.\n\n${HU_TORZS}\n\n${TAGEK}`, CIM);
    const ro = forditasCimNelkul(hu, `Concertul lui Kökény Attila duminică.\n\n${RO_TORZS}\n\n${TAGEK}`);
    const egyben = ketnyelvuOsszefuz(hu, ro);
    expect(egyben.startsWith("Vasárnap este 20 órakor")).toBe(true);
    expect(egyben).not.toContain("koncertje.");
    expect(egyben).not.toContain("Concertul lui");
    expect(egyben.split(KETNYELVU_ELVALASZTO).length).toBe(2);
    expect(egyben.match(/#zileletargumuresene/g)?.length).toBe(1);
  });

  it("real opening sentences stay: other words, an exclamation, a long sentence, no known title, a single line", () => {
    const t = "Két hét munka, és most már a család is birtokba vette az udvart.";
    expect(kozolhetoSzoveg(`Tegnap befejeztük az udvart.\n\n${t}`, ["Új udvar a Fenyő utcában"])).toBe(`Tegnap befejeztük az udvart.\n\n${t}`);
    expect(kozolhetoSzoveg(`Kész a Fenyő utcai udvar!\n\n${t}`, ["Új udvar a Fenyő utcában"])).toBe(`Kész a Fenyő utcai udvar!\n\n${t}`);
    const hosszu = "Kökény Attila vasárnap este fellép a Győzelem téren.";
    expect(kozolhetoSzoveg(`${hosszu}\n\n${HU_TORZS}`, CIM)).toBe(`${hosszu}\n\n${HU_TORZS}`);
    expect(kozolhetoSzoveg(`Kökény Attila vasárnapi koncertje.\n\n${HU_TORZS}`)).toBe(`Kökény Attila vasárnapi koncertje.\n\n${HU_TORZS}`); // no title known → unchanged
    expect(kozolhetoSzoveg("Kökény Attila vasárnapi koncertje.", CIM)).toBe("Kökény Attila vasárnapi koncertje."); // nothing after it
  });

  it("the translation guard only cuts an EXTRA short paragraph: same paragraph count, or a split „Gata!”, stays", () => {
    const forras = `${HU_TORZS}\n\n${TAGEK}`;
    expect(forditasCimNelkul(forras, `${RO_TORZS}\n\n${TAGEK}`)).toBe(`${RO_TORZS}\n\n${TAGEK}`);
    expect(forditasCimNelkul("Kész! Két hét munka volt.\n\n#udvar", "Gata!\n\nAu fost două săptămâni de muncă.\n\n#udvar")).toBe("Gata!\n\nAu fost două săptămâni de muncă.\n\n#udvar");
    const ketBek = "Első bekezdés, hosszabb mondattal a lényegről.\n\nMásodik bekezdés.";
    expect(forditasCimNelkul(ketBek, "Primul paragraf, cu o propoziție mai lungă.\n\nAl doilea paragraf.")).toBe("Primul paragraf, cu o propoziție mai lungă.\n\nAl doilea paragraf.");
  });
});
