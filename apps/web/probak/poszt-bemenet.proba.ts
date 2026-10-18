import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import type { PosztSzoveg } from "@km/contracts";
import { profilSorok } from "../poszt/profil-blokk";
import {
  ATIRAS_MUVELETEK,
  POSZT_PROMPTOK,
  atirasBemenet,
  forditasBemenet,
  forditasForrasa,
  muveletSor,
  uresCellaMuvelet,
} from "../poszt/bemenet";

// 2026-09-30 — Kati B6 (a fordítás „tükör”, a településnevet nem fordítja, nem a szerkesztett magyart fordítja)
// és Erika 09-24 („Rövidebben”: túl szakmai; „Közvetlenebbül”: „az átlag emberek fele kommunikálunk”).
// AI nélkül: a gép elé kerülő bemenetet és a promptok szabályait őrzi. A modell válaszát élőben kell mérni.

const promptFajl = (nev: string) => readFileSync(join(__dirname, "..", "prompts", `${nev}.hu.md`), "utf8");

const PROFIL = profilSorok({
  nev: "Kovács Térkő Kft.",
  osszefoglalo: "Díszburkolás és térkövezés Marosvásárhelyen.",
  celkozonseg: "Családi házak tulajdonosai Maros megyében — nem szakemberek.",
  cel: "Több ajánlatkérés tavasszal.",
  hangnem_leiras: "Tegezünk. Rövid bekezdések, egy emoji a végén.",
  hangnem_minta: "Nálunk a járda nem csak út, hanem a ház névjegye.",
});

const cella = (nyelv: "hu" | "ro" | "en", szoveg: string, allapot: PosztSzoveg["allapot"] = "szerkesztve"): PosztSzoveg => ({
  felulet: "fb",
  nyelv,
  szoveg,
  javaslat: "",
  hashtagek: [],
  allapot,
  veglegesitve: null,
  nyelvre_szabva: false,
  elavult_forditas: false,
});

describe("Fordítás: a gomb a HŰ fordítás promptját hívja", () => {
  it("a fordítás és a nyelvre szabás két külön prompt", () => {
    expect(POSZT_PROMPTOK.forditas).toBe("poszt_forditas");
    expect(POSZT_PROMPTOK.nyelvre_szabas).toBe("poszt_nyelvre_szabas");
  });

  // 2026-10-06 (R-17 C, Blog / honlap): a fordító v4 lett — a honlap-cikk címét is fordítja; a v3 hűség-szabályai változatlanok,
  // ezért a lenti elvárások maradnak, csak a verziószám mozdult (v3 → v4).
  it("a fordítás promptja v4, és a hűség szabályait tartalmazza", () => {
    const p = promptFajl(POSZT_PROMPTOK.forditas);
    expect(p).toMatch(/prompt: poszt-forditas · v4 ·/);
    expect(p).toContain("HŰEN");
    expect(p).toContain("Mondatról mondatra");
    expect(p).toContain("ugyanannyi bekezdés");
    expect(p).toContain("nem tükörfordítás");
    expect(p).toContain("{{tartalomnyelv}}");
    // a prompt() csak az ELSŐ előfordulást cseréli
    expect(p.split("{{tartalomnyelv}}").length).toBe(2);
  });

  it("a helynév-útmutató benne van, a nevek változatlanok maradnak", () => {
    const p = promptFajl(POSZT_PROMPTOK.forditas);
    for (const hely of ["Marosvásárhely · Târgu Mureș", "Kolozsvár · Cluj-Napoca", "Sepsiszentgyörgy · Sfântu Gheorghe",
      "Székelyudvarhely · Odorheiu Secuiesc", "Csíkszereda · Miercurea Ciuc", "Erdély · Transilvania · Transylvania",
      "Maros megye · județul Mureș · Mureș County"]) {
      expect(p).toContain(hely);
    }
    expect(p).toContain("bármely más településre ugyanez a szabály");
    expect(p).toContain("Cég-, márka-, termék-, rendezvény- és személynevet NE fordíts");
    // a cég írási szabályai már nem írhatják át a fordítást (v2-ben ezt kérte a prompt)
    expect(p).toContain("NEM írhatják át a fordítást");
  });

  it("a nyelvre szabás promptja változatlan (az csiszolhat)", () => {
    expect(promptFajl(POSZT_PROMPTOK.nyelvre_szabas)).toMatch(/prompt: poszt-nyelvre-szabas · v2 ·/);
  });
});

describe("Fordítás: miből fordítunk", () => {
  it("a szerkesztett magyar a forrás, akkor is, ha más nyelv véglegesítve van", () => {
    const hu = cella("hu", "A szerkesztett magyar szöveg.");
    const en = cella("en", "Finalized English.", "vegleges");
    expect(forditasForrasa([en, hu], "fb", "ro")).toBe(hu);
  });

  it("a cél nyelv saját cellája soha nem forrás", () => {
    const ro = cella("ro", "Text vechi în română.");
    expect(forditasForrasa([ro], "fb", "ro")).toBeUndefined();
    const en = cella("en", "English text.");
    expect(forditasForrasa([ro, en], "fb", "ro")).toBe(en);
  });

  it("a bemenet a forrásszöveget szó szerint viszi, ékezettel, bekezdéssel, emojival", () => {
    const szoveg = "Marosvásárhelyen, a Rózsák terén új járda épült. 🧱\n\nKovács Térkő Kft. — gyere, nézd meg!";
    const be = forditasBemenet(PROFIL, "fb", { nyelv: "hu", szoveg }, "ro");
    expect(be).toContain(`A szöveg:\n${szoveg}`);
    expect(be).toContain("A szöveg nyelve: hu");
    expect(be).toContain("A kért nyelv: ro");
    expect(be).toContain("Felső karakterhatár: 63206");
    expect(be).toContain("=== A CÉG PROFILJA ===");
  });
});

describe("Üres cella fő gombja („Készítsd el ide”)", () => {
  it("román fülön, ha van magyar szöveg, fordít; magyar fülön ír", () => {
    const hu = cella("hu", "Van már magyar szöveg.");
    expect(uresCellaMuvelet([hu], "fb", "ro")).toBe("forditas");
    expect(uresCellaMuvelet([hu], "fb", "en")).toBe("forditas");
    expect(uresCellaMuvelet([hu], "fb", "hu")).toBe("szoveg");
  });

  it("más felület szövege nem számít; szöveg nélkül ír", () => {
    const huIg = { ...cella("hu", "Csak Instagramra."), felulet: "ig" as const };
    expect(uresCellaMuvelet([huIg], "fb", "ro")).toBe("szoveg");
    expect(uresCellaMuvelet([cella("hu", "   ")], "fb", "ro")).toBe("szoveg");
  });
});

describe("Átírás: a profil célközönsége és a művelet leírása a gép előtt", () => {
  // a gombok műveletei — ugyanaz a lista, mint az app/api/poszt/[id]/atiras/route.ts MUVELETEK (a „sajat” kivételével)
  const GOMBOK = ["rovidebb", "hosszabb", "kozvetlenebb", "targyilagosabb", "hashtag"];

  it("minden gomb-műveletnek van leírása", () => {
    for (const m of GOMBOK) expect(ATIRAS_MUVELETEK[m], m).toBeTruthy();
    const utvonal = readFileSync(join(__dirname, "..", "app", "api", "poszt", "[id]", "atiras", "route.ts"), "utf8");
    for (const m of GOMBOK) expect(utvonal).toContain(`"${m}"`);
  });

  it("a bemenetben ott a célközönség, a hangnem és a művelet leírása", () => {
    const be = atirasBemenet(PROFIL, "fb", "kozvetlenebb", "", "A kivitelezési ütemezés implementációja megtörtént.");
    expect(be).toContain("Kiknek szól:\nCsaládi házak tulajdonosai Maros megyében — nem szakemberek.");
    expect(be).toContain("HOGYAN ÍRJUNK");
    expect(be).toContain("Tegezünk.");
    expect(be).toContain("Kért művelet: kozvetlenebb — Közvetlenebbül: köznyelven");
    expect(be).toContain("A teljes szöveget írd át.");
    expect(be).toContain("A jelenlegi szöveg:\nA kivitelezési ütemezés implementációja megtörtént.");
  });

  it("a „Rövidebben” nem sűríthet szakszavakba", () => {
    expect(muveletSor("rovidebb")).toContain("ne sűríts szakszavakba");
  });

  it("a saját kérés szó szerint megy, kijelöléssel", () => {
    const be = atirasBemenet([], "ig", "legyen benne a nyitvatartás", "első mondat", "első mondat. második.");
    expect(be).toContain("Kért művelet (a munkatárs saját kérése): legyen benne a nyitvatartás");
    expect(be).toContain("Csak ezt a részt írd át:\nelső mondat");
  });

  it("az átírás promptja v3, a közérthetőségi szabállyal", () => {
    const p = promptFajl(POSZT_PROMPTOK.atiras);
    // R-18 8. kör (Kati 10-13): a prompt v4 lett (a felhívás szándék, a „felhivas” művelet, az első sor nem cím); a v3 közérthetőségi
    // szabálya változatlanul benne van — a fejléc a v3 leírását is őrzi
    expect(p).toMatch(/prompt: poszt-atiras · v4 · 2026-10-14 .*· v3: 2026-09-30/);
    expect(p).toContain("„Kiknek szól”");
    expect(p).toContain("köznyelven");
    expect(p).toContain("Szakszót csak akkor hagyj, ha a „Kiknek szól” szakmai közönséget ír");
    expect(p).toContain("Rövidítéskor sem sűrítesz szakszavakba");
    expect(p).not.toMatch(/roviddebben|mas_hangnem|emoji_nelkul/);
    expect(p.split("{{tartalomnyelv}}").length).toBe(2);
  });
});
