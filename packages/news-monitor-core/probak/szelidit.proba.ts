import { describe, it, expect } from "vitest";
import { szovegRovidit, kizarasDarabol, nyelvKod, beallitasSzelidit, osszkepSzelidit, szabalyJavaslatSzelidit, aiValaszSzelidit, relevanciaSzelidit } from "../src/szelidit";
import { aiValaszEllenoriz } from "../src/ai";

describe("szovegRovidit", () => {
  it("rövid szöveget érintetlenül hagy", () => {
    expect(szovegRovidit("Rövid szöveg.", 100)).toBe("Rövid szöveg.");
  });

  it("1594 karakteres, több mondatos szöveget ≤1500-ra vág, mondatvégnél, „…” a végén", () => {
    const mondat = "Ez egy hosszú mondat, amely ismétlődik. ";
    let szoveg = "";
    while (szoveg.length < 1594) szoveg += mondat;
    szoveg = szoveg.slice(0, 1594);
    const rovid = szovegRovidit(szoveg, 1500);
    expect(rovid.length).toBeLessThanOrEqual(1500);
    expect(rovid.endsWith("…")).toBe(true);
    // mondatvégnél vág (a „…” előtt írásjel áll)
    expect(/[.!?]…$/.test(rovid)).toBe(true);
  });

  it("ha nincs mondatvég, szóköznél vág", () => {
    const szoveg = "a".repeat(200) + " " + "b".repeat(200);
    const rovid = szovegRovidit(szoveg, 100);
    expect(rovid.length).toBeLessThanOrEqual(100);
    expect(rovid.endsWith("…")).toBe(true);
  });
});

describe("kizarasDarabol", () => {
  it("a mért 272 karakteres mondatot 4 elemre darabolja, mind ≤120, egyik sem üres", () => {
    const tetel = "tömeggyártásra és ipari pékségre utaló hírek, nem helyi beszállítókra fókuszáló tartalmak, más városokkal kapcsolatos beszállítói megállapodások, angol nyelvű források ha nincs magyar változat";
    const darabok = kizarasDarabol(tetel);
    expect(darabok.length).toBe(4);
    for (const d of darabok) {
      expect(d.length).toBeLessThanOrEqual(120);
      expect(d.length).toBeGreaterThan(0);
    }
  });

  it("egy 120-nál rövidebb tétel változatlanul, egy elemben jön vissza", () => {
    const tetel = "ipari tömeggyártás";
    expect(kizarasDarabol(tetel)).toEqual(["ipari tömeggyártás"]);
  });

  it("üres string → üres tömb", () => {
    expect(kizarasDarabol("   ")).toEqual([]);
  });
});

describe("nyelvKod", () => {
  it("magyar → hu", () => {
    expect(nyelvKod("magyar")).toBe("hu");
  });
  it("HU → hu", () => {
    expect(nyelvKod("HU")).toBe("hu");
  });
  it("magyar nyelv → null", () => {
    expect(nyelvKod("magyar nyelv")).toBeNull();
  });
  it("román → ro", () => {
    expect(nyelvKod("román")).toBe("ro");
  });
  it("angol → en", () => {
    expect(nyelvKod("angol")).toBe("en");
  });
  it("nem string → null", () => {
    expect(nyelvKod(42)).toBeNull();
    expect(nyelvKod(null)).toBeNull();
  });
});

describe("beallitasSzelidit", () => {
  it("a valós mért válaszon (272 karakteres kizárás) az ellenőrzés zöld, a kizárások száma ≥ 3", () => {
    const nyers = {
      beallitas: {
        celok: ["sajat_marka", "szakmai", "tartalomotlet"],
        temak: [
          {
            nev: "kovászos kenyér és kézműves pékség",
            nevvaltozatok: ["kovászos kenyér", "kézműves pékség", "kézi dagasztás", "kovász gondozás"],
            megkulonboztetes: "Hangsúly a lassú kelesztésen, helyi, családi jellegen és kézműves eljáráson; kerülni a tömeggyártás kifejezéseket.",
          },
          {
            nev: "helyi együttműködések és beszállítás",
            nevvaltozatok: ["kávézó beszállítás", "helyi üzletek együttműködés", "kávézó partnerkapcsolat", "friss pékáru beszállítás"],
            megkulonboztetes: "Figyelni az együttműködések lehetőségére, kis mennyiségű, rendszeres beszállításokra és együttműködési történetekre.",
          },
          {
            nev: "helyi közösségi események és ismertség",
            nevvaltozatok: ["helyi piac", "közösségi rendezvény", "kóstoltatás", "lokális PR"],
            megkulonboztetes: "Tudósítások helyi eseményekről, vásárokról, kóstolókról; fókusz a Marosvásárhely és környéke közösségére.",
          },
        ],
        foldrajzi_fokusz: "Marosvásárhely és környéke (helyi, regionális hírek)",
        nyelvek: ["hu"],
        kizarasok: [
          "tömeggyártást, ipari pékárut és nagyüzemi technológiákat említő tartalmak; országos/nemzetközi láncok marketinganyagait, amelyek nem relevánsak a helyi, kézműves profilhoz; általános gasztronómiai trendek, ha nem kapcsolódnak kovászos kenyérhez vagy helyi együttműködéshez",
        ],
        idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" },
        szabad_szoveg:
          "Cél: növelni a helyi ismertséget és a törzsvásárlói kört, erősíteni a bizalmat a kovászos kenyér és kézműves készítés iránt; keresni és monitorozni együttműködési lehetőségeket kávézókkal és kisebb üzletekkel; figyelni helyi eseményeket, kóstolókat, vevői visszajelzéseket és fotóötletekhez autentikus, természetes fényű képeket bemutató anyagokat.",
      },
    };
    const szeliditett = aiValaszSzelidit("hf_beallitas_javaslat", nyers);
    const ell = aiValaszEllenoriz("hf_beallitas_javaslat", szeliditett, { talalat_ids: [] });
    expect(ell.ok).toBe(true);
    if (ell.ok) {
      const ertek = ell.ertek as { beallitas: { kizarasok: string[] } };
      expect(ertek.beallitas.kizarasok.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("nyelvek string → egyelemű tömb", () => {
    const ki = beallitasSzelidit({ nyelvek: "hu" }) as { nyelvek: string[] };
    expect(ki.nyelvek).toEqual(["hu"]);
  });

  it("idozites numerikus string → szám", () => {
    const ki = beallitasSzelidit({ idozites: { mod: "KÉZI", ora: "7", perc: "0" } }) as { idozites: { mod: string; ora: number; perc: number } };
    expect(ki.idozites.ora).toBe(7);
    expect(ki.idozites.perc).toBe(0);
    expect(ki.idozites.mod).toBe("kézi");
  });
});

describe("osszkepSzelidit", () => {
  it("talalat_ előtag levágása, bizonytalan string → boolean", () => {
    const ki = osszkepSzelidit({ szoveg: "x", hivatkozott_talalatok: ["talalat_t-1", "t-2"], bizonytalan: "false" }) as {
      hivatkozott_talalatok: string[];
      bizonytalan: boolean;
    };
    expect(ki.hivatkozott_talalatok).toEqual(["t-1", "t-2"]);
    expect(ki.bizonytalan).toBe(false);
  });

  it("aiValaszEllenoriz hf_osszkep zöld, a hivatkozott_talalatok tiszták", () => {
    const ell = aiValaszEllenoriz(
      "hf_osszkep",
      { szoveg: "x", hivatkozott_talalatok: ["talalat_t-1", "t-2"], bizonytalan: "false" },
      { talalat_ids: ["t-1", "t-2"] },
    );
    expect(ell.ok).toBe(true);
    if (ell.ok) {
      const ertek = ell.ertek as { hivatkozott_talalatok: string[]; bizonytalan: boolean };
      expect(ertek.hivatkozott_talalatok).toEqual(["t-1", "t-2"]);
      expect(ertek.bizonytalan).toBe(false);
    }
  });

  it("szám 0/1 → boolean", () => {
    const ki = osszkepSzelidit({ bizonytalan: 1 }) as { bizonytalan: boolean };
    expect(ki.bizonytalan).toBe(true);
  });
});

describe("szabalyJavaslatSzelidit", () => {
  it("javasolt → beallitasSzelidit, indoklas/varhato_hatas rövidítés, profil_erintett string → boolean", () => {
    const ki = szabalyJavaslatSzelidit({
      javasolt: { kizarasok: ["a".repeat(200)] },
      indoklas: "i".repeat(900),
      varhato_hatas: "v".repeat(500),
      profil_erintett: "true",
      mi_alapjan: "egy indok",
    }) as { javasolt: { kizarasok: string[] }; indoklas: string; varhato_hatas: string; profil_erintett: boolean; mi_alapjan: string[] };
    expect(ki.indoklas.length).toBeLessThanOrEqual(800);
    expect(ki.varhato_hatas.length).toBeLessThanOrEqual(400);
    expect(ki.profil_erintett).toBe(true);
    expect(ki.mi_alapjan).toEqual(["egy indok"]);
    expect(ki.javasolt.kizarasok.length).toBeGreaterThanOrEqual(1);
  });
});

describe("relevanciaSzelidit", () => {
  it("a fontossag mezőbe írt témacímkét fontosságra javítja (sajat_megjelenes → fontos)", () => {
    const ki = relevanciaSzelidit({ fontossag: "sajat_megjelenes", temacimke: "sajat_megjelenes", miert: "x", osszefoglalo: "y" }) as {
      fontossag: string;
      temacimke: string;
    };
    expect(ki.fontossag).toBe("fontos");
  });

  it("a fontossag mezőbe írt szakmai témacímkét erdekesre javítja", () => {
    const ki = relevanciaSzelidit({ fontossag: "szakmai", temacimke: "szakmai", miert: "x", osszefoglalo: "y" }) as {
      fontossag: string;
      temacimke: string;
    };
    expect(ki.fontossag).toBe("erdekes");
  });

  it("a jó választ változatlanul hagyja", () => {
    const jo = { fontossag: "fontos", temacimke: "szakmai", miert: "ok", indoklas: "", osszefoglalo: "" };
    expect(relevanciaSzelidit(jo)).toEqual(jo);
  });

  it("aiValaszEllenoriz hf_relevancia zöld, a fontossag fontosra javítva", () => {
    const ell = aiValaszEllenoriz(
      "hf_relevancia",
      { fontossag: "sajat_megjelenes", temacimke: "sajat_megjelenes", miert: "Mert", indoklas: "", osszefoglalo: "" },
      { talalat_ids: [] },
    );
    expect(ell.ok).toBe(true);
    if (ell.ok) {
      const ertek = ell.ertek as { fontossag: string };
      expect(ertek.fontossag).toBe("fontos");
    }
  });
});

describe("aiValaszSzelidit — jó válasz változatlan", () => {
  it("a séma szerinti jó válasz szelídítve UGYANAZ marad", () => {
    const jo = {
      szoveg: "Rövid összkép.",
      hivatkozott_talalatok: ["t-1"],
      bizonytalan: false,
    };
    expect(aiValaszSzelidit("hf_osszkep", jo)).toEqual(jo);
  });

  it("hf_relevancia válasz változatlan", () => {
    const jo = { fontossag: "fontos", temacimke: "szakmai", miert: "ok", indoklas: "", osszefoglalo: "" };
    expect(aiValaszSzelidit("hf_relevancia", jo)).toEqual(jo);
  });
});

describe("aiValaszSzelidit — nem objektum bemenet", () => {
  it("null, string, szám változatlanul jön vissza, kivétel nélkül", () => {
    expect(aiValaszSzelidit("hf_osszkep", null)).toBeNull();
    expect(aiValaszSzelidit("hf_osszkep", "szoveg")).toBe("szoveg");
    expect(aiValaszSzelidit("hf_osszkep", 42)).toBe(42);
    expect(aiValaszSzelidit("hf_beallitas_javaslat", null)).toBeNull();
    expect(aiValaszSzelidit("hf_szabaly_javaslat", "x")).toBe("x");
  });
});
