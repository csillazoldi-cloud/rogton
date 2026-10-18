// R-17 A · a Logó, színek, betűk allapjai (design/R17-visszajelzes; Kati #10 #11 #13 #14 #15, H2, H3). Tiszta próba:
//  - a „‹ Logó, színek, betűk” vissza-link a hat allapon (Logók, Színek, Más szín, Betűk, Névlogó, logótervezés kérdőív), a Logók lap alsó
//    „Vissza” linkje helyette eltűnt (Kati #13);
//  - a Logók lap fő gombja „Kész”, ha már van logó; a kitöltött hely koppintása kijelöl (az előnézet vált), a második koppintás cserél;
//  - a „mintakép” a kijelölt hely logójával (vizual/minta.ts `logo_hely`): csak a munkatér saját logója, ismeretlen hely → nincs változás;
//  - telefonon a 12a „Aa” alatt a betű neve, a 12b minden logót mutat.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MintaKeres, mintaArculat } from "../vizual/minta";
import type { KepArculat } from "../vizual/helyzet";

const lap = (f: string) => readFileSync(new URL(`../app/fiok/arculat/${f}`, import.meta.url), "utf8");

describe("vissza-link a szakaszra", () => {
  it("mind a hat allapon ott van", () => {
    for (const f of ["logok/LogokFeltoltes.tsx", "szinek/Szinek.tsx", "szinek/mas/MasSzin.tsx", "betuk/Betuk.tsx", "nevlogo/Nevlogo.tsx", "logoterv/Logoterv.tsx"]) {
      expect(lap(f), f).toContain("<VisszaSzakasz />");
    }
    expect(lap("_kozos/VisszaSzakasz.tsx")).toContain('href="/fiok/arculat"');
    expect(lap("_kozos/VisszaSzakasz.tsx")).toContain('t("r16.arculat.szakasz")');
  });
  it("a Logók lap alsó „Vissza” linkje eltűnt (a fenti link váltja ki)", () => {
    expect(lap("logok/LogokFeltoltes.tsx")).not.toContain('t("r16.arculat.vissza")');
  });
});

describe("Logók lap", () => {
  const s = lap("logok/LogokFeltoltes.tsx");
  it("„Kész”, ha van legalább egy logó — asztalon és telefonon is; addig „Logók kiválasztása”", () => {
    expect(s.match(/vanLogo \? <FoGomb href="\/fiok\/arculat">\{t\("r17\.arculat\.logok\.kesz"\)\}<\/FoGomb>/g)?.length).toBe(2);
    expect(s).toContain("const vanLogo = HELYEK.some((h) => logok[h] !== null);");
  });
  it("kitöltött hely: első koppintás kijelöl, második cserél; üres hely: fájlválasztó", () => {
    expect(s).toContain("if (logok[hely] && kijelolt !== hely) { setKijelolt(hely); return; }");
    expect(s).toContain('kijelolt === "negyzetes" && logok.negyzetes');
    expect(s).toContain("<ProfilkepMinta");
  });
});

describe("a mintakép a kijelölt hely logójával", () => {
  const l = (adat: string) => ({ adat, atlatszo: true });
  const alap: KepArculat = {
    nev: "Kövesi Térkő", fo: "#2f5d50", masodik: "#c9a86a", hatter: "#f1ede4", betu: "archivo", betu_cim: "archivo", betu_szoveg: "public-sans", sajat_betuk: [],
    logok: { vilagos: l("VILAGOS"), sotet: l("SOTET"), egyszinu: l("EGYSZINU"), negyzetes: l("NEGYZET") }, logo: "VILAGOS",
  } as unknown as KepArculat;
  it("a „sotet” hely logója kerül minden helyre (a négyzetes marad)", () => {
    const k = MintaKeres.parse({ logo_hely: "sotet" });
    const a = mintaArculat(alap, k);
    expect(a.logok.vilagos?.adat).toBe("SOTET");
    expect(a.logok.egyszinu?.adat).toBe("SOTET");
    expect(a.logok.negyzetes?.adat).toBe("NEGYZET");
    expect(a.logo).toBe("SOTET");
  });
  it("üres hely → nincs változás; a negyzetes nem kérhető (annak a profilkép-minta a helye); bájtot nem fogad a törzs", () => {
    const ures = { ...alap, logok: { vilagos: l("VILAGOS") } } as unknown as KepArculat;
    expect(mintaArculat(ures, MintaKeres.parse({ logo_hely: "sotet" })).logok).toEqual(ures.logok);
    expect(MintaKeres.safeParse({ logo_hely: "negyzetes" }).success).toBe(false);
    const k = MintaKeres.parse({ logo_hely: "vilagos", logok: { vilagos: { adat: "IDEGEN" } } });
    expect(JSON.stringify(k)).not.toContain("IDEGEN");
  });
});

describe("telefon: 12a betűnevek, 12b minden logó", () => {
  it("12a: az „Aa” alatt a hangulat-szó (vagy a saját betű neve)", () => {
    const s = lap("NevlogoNyito.tsx");
    expect(s).toContain('adat.betuk.cimSajat?.nev ?? t(adat.betuk.cimSzo)');
    expect(s).toContain('adat.betuk.szovegSajat?.nev ?? t(adat.betuk.szovegSzo)');
  });
  it("12b: telefonon az összes kitöltött hely csempéje, asztalon az egy logó + „Több logó” marad", () => {
    const s = lap("ArculatSzakasz.tsx");
    expect(s).toContain('<span className="r15-csak-tel"><span className="r16a-csempek">{kitoltott.map(logoCsempe)}</span></span>');
    expect(s).toContain('<span className="r15-csak-asztal r17-egy-logo">{logoCsempe(egy)}');
  });
});
