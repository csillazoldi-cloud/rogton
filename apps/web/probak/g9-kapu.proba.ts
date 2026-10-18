// G9 — az oldal kapuja (Csilla, 2026-10-18 16:05). Szabály (adatbázis nélkül) + jegyek és korlát (adatbázissal).
// Az élő, futó kiszolgálós próbák: g9-kapu-elo.proba.ts. Döntés: docs/decisions/2026-10-18-g9-kapu.md.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  KAPU_KIVUL_FEJLEC, KAPU_SUTI, dontes, helyiKeres, kapuFeliratai, kapuJelszo, szabadUt, visszaUt,
} from "../oldalkapu/szabaly";
import { DATABASE_URL, lezar, sql } from "./segedek";

const olvas = (ut: string) => readFileSync(new URL(`../../../${ut}`, import.meta.url), "utf8");

describe("G9 kapu — szabály", () => {
  it("1. a szabad lista pontosan a brief szerinti; minden más a kapu mögött", () => {
    for (const u of ["/kapu", "/api/egeszseg", "/manifest.webmanifest", "/favicon.ico", "/r18/ikon/ikon-sotet-32.png",
      "/_next/static/chunks/a.js", "/betuk/saira-latin-400-normal.woff2"]) expect(szabadUt(u), u).toBe(true);
    for (const u of ["/", "/belepes", "/regisztracio", "/kezdolap", "/api/program/lista", "/api/fiok/belepes", "/api/egeszseg/x",
      "/kapu/x", "/kapuk", "/r18/logo.png", "/r18/ikon", "/betuk", "/nyitolap/kep.jpg", "/kepbetuk/a.woff2", "/fajlok/x.pdf",
      "/_next/image", "/robots.txt", "/manifest.webmanifest/x"]) expect(szabadUt(u), u).toBe(false);
  });

  it("2. döntés bekapcsolt kapunál: jegy nélkül oldal → kapu lap, API és nem-GET → 401; jeggyel tovább; POST /kapu → belépés", () => {
    const d = (modszer: string, ut: string, jegyErvenyes = false) => dontes({ modszer, ut, jelszoVan: true, helyi: true, jegyErvenyes }).tipus;
    expect(d("GET", "/belepes")).toBe("kapu-lap");
    expect(d("GET", "/")).toBe("kapu-lap");
    expect(d("HEAD", "/kezdolap")).toBe("kapu-lap");
    expect(d("GET", "/api/program/lista")).toBe("api-401");
    expect(d("POST", "/api/fiok/belepes")).toBe("api-401");
    expect(d("POST", "/belepes")).toBe("api-401"); // szerverművelet sem csúszik át
    expect(d("GET", "/api/egeszseg")).toBe("kivul");
    expect(d("GET", "/betuk/a.woff2")).toBe("kivul");
    expect(d("GET", "/kapu")).toBe("kivul");
    expect(d("POST", "/kapu")).toBe("belepes");
    expect(d("PUT", "/kapu")).toBe("api-401");
    expect(d("GET", "/kapu", true)).toBe("mar-bent");
    expect(d("GET", "/belepes", true)).toBe("tovabb");
    expect(d("POST", "/api/fiok/belepes", true)).toBe("tovabb");
    // helyi kérés sem kerül meg egy BEKAPCSOLT kaput
    expect(dontes({ modszer: "GET", ut: "/kezdolap", jelszoVan: true, helyi: true, jegyErvenyes: false }).tipus).toBe("kapu-lap");
  });

  it("3. kikapcsolt kapu (nincs jelszó): helyben nyitva, a Cloudflare felől zárva (lap: zárva, API: 503)", () => {
    const d = (modszer: string, ut: string, helyi: boolean) => dontes({ modszer, ut, jelszoVan: false, helyi, jegyErvenyes: false }).tipus;
    expect(d("GET", "/belepes", true)).toBe("tovabb");
    expect(d("POST", "/api/fiok/belepes", true)).toBe("tovabb");
    expect(d("GET", "/belepes", false)).toBe("zarva-lap");
    expect(d("GET", "/kapu", false)).toBe("kivul"); // a lap maga mutatja a „most nem elérhető” sort; átírás nincs (körbejárna)
    expect(d("GET", "/api/program/lista", false)).toBe("zarva-api");
    expect(d("POST", "/kapu", false)).toBe("zarva-api");
    expect(d("GET", "/api/egeszseg", false)).toBe("kivul");
    expect(d("GET", "/favicon.ico", false)).toBe("kivul");
  });

  it("4. helyi kérés = nincs CF-Connecting-IP (a gép egyetlen nyilvános útja a Cloudflare, ami mindig ráteszi); a cím nem számít", () => {
    expect(helyiKeres(new Headers())).toBe(true);
    expect(helyiKeres(new Headers({ "x-forwarded-for": "198.51.100.7" }))).toBe(true); // a próbák saját címe
    expect(helyiKeres(new Headers({ "cf-connecting-ip": "84.2.3.4" }))).toBe(false);
    expect(helyiKeres(new Headers({ "cf-connecting-ip": "127.0.0.1", "x-forwarded-for": "127.0.0.1" }))).toBe(false);
  });

  it("5. visszatérési út: csak saját út, nem a kapu, nincs nyílt átirányítás", () => {
    expect(visszaUt("/naptar?het=2026-43")).toBe("/naptar?het=2026-43");
    expect(visszaUt("/fiok/arculat/logok")).toBe("/fiok/arculat/logok");
    for (const v of ["", null, undefined, "//gonosz.example", "/\\gonosz.example", "https://gonosz.example/", "kezdolap", "/kapu",
      "/kapu?h=rossz", "/kapu/x", "/a\r\nSet-Cookie: x=1"]) expect(visszaUt(v), String(v)).toBe("/");
  });

  it("6. a jelszó a .env-ből, levágva; üres = ki", () => {
    expect(kapuJelszo(undefined)).toBe("");
    expect(kapuJelszo("   ")).toBe("");
    expect(kapuJelszo(" Árvíz tűrő, 2026 ")).toBe("Árvíz tűrő, 2026");
  });

  it("7. a kapun kívül csak a kapu.* feliratok kerülnek a lapra", () => {
    expect(kapuFeliratai({ "kapu.jelszo": "Jelszó", "kapu.belepes": "Belépés", "belepes.cim": "Lépj be", "fejlec.termeknev": "Rögtön" }))
      .toEqual({ "kapu.jelszo": "Jelszó", "kapu.belepes": "Belépés" });
    const l = olvas("apps/web/app/layout.tsx");
    expect(l).toContain("KAPU_KIVUL_FEJLEC");
    expect(l).toMatch(/const f = kapunKivul \? kapuFeliratai\(mindenFelirat\) : mindenFelirat;/);
  });

  it("8. a proxy a Next 16 helyén (apps/web/proxy.ts), mindenre fut a /_next/static kivételével, és eldobja a hamis kapun-kívül fejlécet", () => {
    const p = olvas("apps/web/proxy.ts");
    expect(p).toMatch(/export async function proxy\(/);
    expect(p).toContain('matcher: ["/((?!_next/static/|api/arculat/fajl$).*)"]');
    // a proxyt kikerülő egyetlen út maga kéri a kaput, a törzs olvasása előtt (POST és GET)
    const f = olvas("apps/web/app/api/arculat/fajl/route.ts");
    expect(f.match(/const kapuValasz = await kapuUtvonalon\(keres\);/g)?.length).toBe(2);
    expect(f.indexOf("kapuUtvonalon(keres)")).toBeLessThan(f.indexOf("torzsFajlba("));
    expect(olvas("apps/web/next.config.ts")).toContain('experimental: { proxyClientMaxBodySize: "12mb" }');
    expect(p).toContain("fej.delete(KAPU_KIVUL_FEJLEC)");
    expect(p).toMatch(/httpOnly: true, secure: true, sameSite: "lax", path: "\/", maxAge: JEGY_NAP \* 24 \* 60 \* 60/);
    expect(p).toMatch(/NextResponse\.json\(\{ hiba: "kapu" \}, \{ status: 401/);
    expect(p).not.toMatch(/console\.[a-z]+\([^)]*probalt/); // a beírt jelszó soha nem kerül naplóba
    expect(KAPU_SUTI).toBe("rogton_kapu");
    expect(KAPU_KIVUL_FEJLEC).toBe("x-rogton-kapun-kivul");
    expect(olvas("uzem/.env.pelda")).toMatch(/^KAPU_JELSZO=$/m);
    expect(olvas("uzem/docker-compose.yml")).toMatch(/^ {6}KAPU_JELSZO: \$\{KAPU_JELSZO:-\}$/m);
  });

  it("8b. a proxyt kikerülő feltöltési út ugyanazt dönti: kikapcsolt kapu helyben tovább, Cloudflare felől 503; bekapcsolva jegy nélkül 401", async () => {
    const { kapuUtvonalon } = await import("../oldalkapu/utvonal");
    const regi = process.env.KAPU_JELSZO;
    try {
      delete process.env.KAPU_JELSZO;
      expect(await kapuUtvonalon(new Request("http://x/api/arculat/fajl", { method: "POST" }))).toBeNull();
      const z = await kapuUtvonalon(new Request("http://x/api/arculat/fajl", { method: "POST", headers: { "cf-connecting-ip": "84.2.3.4" } }));
      expect(z?.status).toBe(503);
      expect(await z?.json()).toEqual({ hiba: "kapu_nincs_beallitva" });
      process.env.KAPU_JELSZO = "Zöld kapu, 2026";
      const v = await kapuUtvonalon(new Request("http://x/api/arculat/fajl", { method: "GET" }));
      expect(v?.status).toBe(401);
      expect(v?.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(await v?.json()).toEqual({ hiba: "kapu" });
    } finally {
      if (regi === undefined) delete process.env.KAPU_JELSZO; else process.env.KAPU_JELSZO = regi;
    }
  });

  it("9. a kapu lapja: egy jelszómező, egy fő gomb, nincs link, nincs regisztráció; telefonbarát mező", () => {
    const k = olvas("apps/web/app/kapu/page.tsx").split("\n").filter((s) => !s.trimStart().startsWith("//")).join("\n");
    expect(k.match(/<input\b/g)?.length).toBe(2); // a jelszó + a rejtett visszatérési út
    expect(k).toContain('type="password"');
    expect(k).toContain('autoComplete="current-password"');
    expect(k).toContain('autoCapitalize="none"');
    expect(k.match(/<FoGomb\b/g)?.length).toBe(1);
    expect(k).not.toMatch(/<a\b|<Link\b|regisztr/i);
    expect(k).toContain('method="post" action={KAPU_LAP}');
  });
});

const VAN_ADATBAZIS = DATABASE_URL !== "";

describe.skipIf(!VAN_ADATBAZIS)("G9 kapu — jegyek és korlát (adatbázis)", () => {
  const JELSZO = "Zöld kapu, ékezettel — 2026!";
  const CIM = "203.0.113.91";
  let jegyMod: typeof import("../oldalkapu/jegy");
  let korlat: typeof import("../hitelesites/korlat");

  beforeAll(async () => {
    jegyMod = await import("../oldalkapu/jegy");
    korlat = await import("../hitelesites/korlat");
    await sql("DELETE FROM belepesi_kiserlet WHERE fajta = 'kapu' AND cim LIKE '203.0.113.%'");
  });
  afterAll(async () => {
    await sql("DELETE FROM belepesi_kiserlet WHERE fajta = 'kapu' AND cim LIKE '203.0.113.%'");
    await lezar();
  });

  it("10. jegy kiadása és ellenőrzése; az adatbázisban csak lenyomat van (a jegy és a jelszó nem)", async () => {
    jegyMod.jegyEmlekUrit();
    const { jegy, lejar } = await jegyMod.jegyKiad(JELSZO, CIM);
    expect(jegy).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Math.round((lejar.getTime() - Date.now()) / 86_400_000)).toBe(30);
    expect(await jegyMod.jegyErvenyes(jegy, JELSZO)).toBe(true);
    const sor = await sql<{ id: string; jelszo_lenyomat: string; ip_hash: string }>("SELECT id, jelszo_lenyomat, ip_hash FROM kapu_jegy ORDER BY letrehozva DESC LIMIT 1");
    expect(sor[0]?.id).toMatch(/^[0-9a-f]{64}$/);
    expect(sor[0]?.id).not.toBe(jegy);
    expect(JSON.stringify(sor)).not.toContain(JELSZO);
    expect(JSON.stringify(sor)).not.toContain(CIM);
  });

  it("11. a jelszó cseréje minden régi jegyet érvénytelenít (a 60 mp-es emlék sem menti meg)", async () => {
    const { jegy } = await jegyMod.jegyKiad(JELSZO, CIM);
    expect(await jegyMod.jegyErvenyes(jegy, JELSZO)).toBe(true); // most már az emlékben is
    expect(await jegyMod.jegyErvenyes(jegy, `${JELSZO}x`)).toBe(false);
    expect(await jegyMod.jegyErvenyes(jegy, "")).toBe(false);
  });

  it("12. ismeretlen, rossz alakú, lejárt vagy visszavont jegy nem érvényes", async () => {
    expect(await jegyMod.jegyErvenyes(undefined, JELSZO)).toBe(false);
    expect(await jegyMod.jegyErvenyes("rovid", JELSZO)).toBe(false);
    expect(await jegyMod.jegyErvenyes("A".repeat(43), JELSZO)).toBe(false);
    const regen = new Date(Date.now() - 31 * 86_400_000);
    const { jegy: lejart } = await jegyMod.jegyKiad(JELSZO, CIM, regen);
    jegyMod.jegyEmlekUrit();
    expect(await jegyMod.jegyErvenyes(lejart, JELSZO)).toBe(false);
    const { jegy: visszavont } = await jegyMod.jegyKiad(JELSZO, CIM);
    await sql("DELETE FROM kapu_jegy WHERE jelszo_lenyomat = $1", [jegyMod.jelszoLenyomat(JELSZO)]); // = TRUNCATE kapu_jegy a próbában
    jegyMod.jegyEmlekUrit();
    expect(await jegyMod.jegyErvenyes(visszavont, JELSZO)).toBe(false);
  });

  it("13. jelszó-összevetés: pontos egyezés kell (ékezet, szóköz, kis-nagybetű számít); üres beállított jelszóval semmi sem jó", () => {
    expect(jegyMod.jelszoEgyezik(JELSZO, JELSZO)).toBe(true);
    for (const p of ["", " ", JELSZO.toUpperCase(), JELSZO.replace("ö", "o"), `${JELSZO} `]) expect(jegyMod.jelszoEgyezik(p, JELSZO), p).toBe(false);
    expect(jegyMod.jelszoEgyezik("", "")).toBe(false);
  });

  it("14. korlát: 5 rossz próba / 15 perc címenként — a 6. már nem jut a jelszóig; más cím szabad", async () => {
    expect(korlat.KORLATOK.kapu).toEqual({ cim: { darab: 5, ablakPerc: 15 }, csakSikertelen: true });
    for (let i = 0; i < 5; i++) {
      expect((await korlat.korlatEllenoriz("kapu", null, "203.0.113.92")).szabad).toBe(true);
      await korlat.kiserletNaplo("kapu", null, "203.0.113.92", false);
    }
    expect(await korlat.korlatEllenoriz("kapu", null, "203.0.113.92")).toEqual({ szabad: false, ok: "cim", ujraPerc: 15 });
    expect((await korlat.korlatEllenoriz("kapu", null, "203.0.113.93")).szabad).toBe(true);
    const n = await sql<{ email: string | null }>("SELECT email FROM belepesi_kiserlet WHERE fajta = 'kapu' AND cim = '203.0.113.92'");
    expect(n.every((s) => s.email === null)).toBe(true); // a kapunál nincs e-mail, és a jelszó sincs a naplóban
  });
});
