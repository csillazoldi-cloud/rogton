// R-16 utókérés 2 — a két telefonos üres állapot (design/R16-arculat/UTOKERES-2.md; R16-arculat.dc.html 12a telefon · 12f0; gepezet-3 4).
// Tiszta próba (forrásolvasás): a nyitó a 12g gépezetét használja, a tárolt stílusértékek változatlanok, a két „logó nélkül” út
// egy lett (a „Most logó nélkül” = a régi jóváhagyás), az asztali 12a/12f változatlan, és minden új kulcs megvan hu/ro/en.
// A végén az utókérés-2 MINDEN változott fájlja: az ott használt r15./r16. kulcsok mind megvannak egy migrációban.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const olvas = (ut: string) => readFileSync(gy(`apps/web/app/${ut}`), "utf8");
const nyito = olvas("fiok/arculat/NevlogoNyito.tsx");
const szakasz = olvas("fiok/arculat/ArculatSzakasz.tsx");
const nevlogo = olvas("fiok/arculat/nevlogo/Nevlogo.tsx");
const logok = olvas("fiok/arculat/logok/LogokFeltoltes.tsx");
const logokLap = olvas("fiok/arculat/logok/page.tsx");
const MIG = gy("apps/web/adatbazis/migraciok/");
const osszes = readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const hasznalt = (s: string) => [...new Set([...s.matchAll(/t\(\s*["'`]((?:r15|r16)\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!))];

describe("R-16 12a telefon — a nyitó a névlogóval", () => {
  it("a 12g gépezete: ugyanaz a végpont, ugyanazok a tárolt stílusértékek, az első kijelölve", () => {
    expect(nevlogo).toContain('export const STILUSOK = ["nev", "kor", "negyzet"] as const;');
    expect(nyito).toContain('useState<Stilus>("nev")');
    expect(nyito).toContain('fetch("/api/arculat/nevlogo", { method: "POST", body: JSON.stringify({ stilus })');
    expect(nyito).toContain("/api/arculat/nevlogo/${s}");
  });
  it("csak szerkesztőnek, csak üres, logó nélküli szakaszon; telefonon (az asztali 12a változatlan)", () => {
    expect(szakasz).toContain('const nyito = szerkesztheto && nezet === "ures" && !adat.vanLogo;');
    expect(nyito).toContain('className="r16a-nl r15-csak-tel"');
    for (const k of ["r16.arculat.ures.kerdes", "r16.arculat.ures.alcim", "r16.arculat.logo_feltoltes", "r16.arculat.jo_logo_nelkul", "r16.arculat.nincs_logom"]) expect(szakasz, k).toContain(`"${k}"`);
  });
  it("a két „logó nélkül” út egy: a „Most logó nélkül” a régi jóváhagyás; a „Van saját logóm” a kérdés nélküli 12f", () => {
    expect(szakasz).toContain("logoNelkul={jovahagy}");
    expect(nyito).toContain('export const VAN_SAJAT_LOGOM_CIM = "/fiok/arculat/logok?van=1";');
    expect(hasznalt(nyito)).toEqual(expect.arrayContaining(["r16.arculat.nevlogo.kerdes", "r16.arculat.nevlogo.alcim", "r16.arculat.van_sajat_logom", "r16.arculat.most_logo_nelkul", "r16.arculat.ez_legyen_logom"]));
  });
});

describe("R-16 12f0 — „Van már logód?”", () => {
  it("a kérdés csak logó nélkül és nem a „Van saját logóm” linkjéről", () => {
    expect(logokLap).toContain('const van = (await searchParams)["van"] === "1";');
    expect(logokLap).toContain("kerdes={!van && szakasz !== null && !szakasz.vanLogo}");
  });
  it("két egyenrangú kártya, a „Nincs” előre kijelölve; a fő gomb felirata a választást követi", () => {
    expect(logok).toContain('useState<"van" | "nincs">("nincs")');
    expect(logok).toContain('valasz === "nincs" ? t("r16.arculat.logok.keszits_egyet") : t("r16.arculat.logok.valasztas")');
    expect(logok).toContain('router.push("/fiok/arculat/nevlogo")');
    expect((logok.match(/role="radio"/g) ?? []).length).toBe(2);
  });
  it("az asztali 12f változatlan: a négy hely és a „Logók kiválasztása” a helyén", () => {
    expect(logok).toContain('className={kerdesLatszik ? "r16a-racs r15-csak-asztal" : "r16a-racs"}');
    expect(logok).toContain('<FoGomb onClick={() => tobbRef.current?.click()}>{t("r16.arculat.logok.valasztas")}</FoGomb>');
  });
});

describe("utókérés 2 — minden használt kulcs megvan egy migrációban, hu/ro/en", () => {
  it("Kezdőlap, Hírek, napi hírek sora, minta, Mit figyeljünk, R-16 nyitó és logók", () => {
    const fajlok = ["kezdolap/R15Kezdolap.tsx", "hirfigyelo/R15Hirek.tsx", "_kozos/R15NapiHirek.tsx", "_kozos/R15MunkaMinta.tsx",
      "hirfigyelo/beallitas/Beallitas.tsx", "hirfigyelo/beallitas/Forrasok.tsx", "fiok/arculat/NevlogoNyito.tsx", "fiok/arculat/ArculatSzakasz.tsx", "fiok/arculat/logok/LogokFeltoltes.tsx"];
    const kulcsok = [...new Set(fajlok.flatMap((f) => hasznalt(olvas(f))))].sort();
    expect(kulcsok).toEqual(expect.arrayContaining(["r15.kozos.mi_ez", "r15.kozos.minta_sor", "r15.hirek.miert_nincs", "r15.kozos.halad_ures", "r15.mit.kerdes", "r16.arculat.logok.van_kerdes"]));
    const hiany: string[] = [];
    for (const k of kulcsok) for (const ny of ["hu", "ro", "en"]) if (!osszes.includes(`('${k}', '${ny}',`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
  });
});
