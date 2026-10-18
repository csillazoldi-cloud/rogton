// G9 — a kapu élőben, egy futó kiszolgálón.
//  A) BEKAPCSOLT kapu: PROBA_KAPU_CIM (egy KAPU_JELSZO-val indított kiszolgáló) + PROBA_KAPU_JELSZO (ugyanaz a jelszó). A rendes
//     próbakörnyezet kiszolgálója (PROBA_CIM) kapu nélkül fut, mert a többi ~1100 próba a kapu mögé nem lát be — ezért ez a rész
//     csak a két változóval fut (a build önpróbája egy második kiszolgálót indít hozzá; plan-out/EPITES-NAPLO-G9.md).
//  B) KIKAPCSOLT kapu (PROBA_CIM, a rendes próbakörnyezet): helyben nyitva, Cloudflare-fejléccel zárva.
// A címeket a próba az X-Forwarded-For-ral adja (MEGBIZHATO_PROXY_DB=1), a 203.0.113.0/24 dokumentációs tartományból.
import { describe, expect, it } from "vitest";
import { PROBA_CIM } from "./segedek";

const KAPU_CIM = process.env.PROBA_KAPU_CIM ?? "";
const KAPU_JELSZO = process.env.PROBA_KAPU_JELSZO ?? "";
const VAN_KAPU = KAPU_CIM !== "" && KAPU_JELSZO !== "";
const egyedi = () => `203.0.113.${100 + Math.floor(Math.random() * 150)}`;

async function k(alap: string, ut: string, o: { modszer?: string; fej?: Record<string, string>; torzs?: string | URLSearchParams } = {}) {
  const v = await fetch(alap + ut, { method: o.modszer ?? "GET", headers: o.fej ?? {}, body: o.torzs ?? null, redirect: "manual" });
  return { statusz: v.status, fej: v.headers, szoveg: await v.text() };
}
const urlap = (jelszo: string, vissza = "/kezdolap") => new URLSearchParams({ jelszo, vissza });
const URLAP_FEJ = (cim: string) => ({ "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": cim });

describe.skipIf(!VAN_KAPU)("G9 kapu élőben — bekapcsolva", () => {
  it("1. jegy nélkül minden lap a kapu (200, a cím marad), benne csak a kapu: jelszómező, Belépés, semmi más szöveg a termékről", async () => {
    for (const ut of ["/belepes", "/", "/kezdolap", "/regisztracio", "/naptar?het=2026-43"]) {
      const v = await k(KAPU_CIM, ut, { fej: { "x-forwarded-for": egyedi() } });
      expect(v.statusz, ut).toBe(200);
      expect(v.szoveg, ut).toContain('action="/kapu"');
      expect(v.szoveg, ut).toContain('name="jelszo"');
      expect(v.szoveg, ut).toContain('autoComplete="current-password"');
      expect(v.fej.get("set-cookie") ?? "", ut).not.toContain("rogton_kapu");
      // a termék többi felirata nincs a lapon (a belépőlap, a regisztráció, a menü szövegei)
      for (const tilos of ["E-mail-cím", "Regisztráció", "Nincs még fiókod", "Kezdőlap", "Posztszöveg", "Hírek", "Iránytű", "Fiók létrehozása"]) {
        expect(v.szoveg.includes(tilos), `${ut}: ${tilos}`).toBe(false);
      }
    }
    const v = await k(KAPU_CIM, "/naptar?het=2026-43", { fej: { "x-forwarded-for": egyedi() } });
    expect(v.szoveg).toContain('name="vissza" value="/naptar?het=2026-43"');
  });

  it("2. a szabad lista jelszó nélkül is megy: életjel, manifest, ikon, betű, a kapu lapja", async () => {
    expect((await k(KAPU_CIM, "/api/egeszseg")).statusz).toBe(200);
    expect((await k(KAPU_CIM, "/manifest.webmanifest")).statusz).toBe(200);
    expect((await k(KAPU_CIM, "/favicon.ico")).statusz).toBe(200);
    expect((await k(KAPU_CIM, "/r18/ikon/ikon-sotet-32.png")).statusz).toBe(200);
    expect((await k(KAPU_CIM, "/betuk/saira-latin-400-normal.woff2")).statusz).toBe(200);
    expect((await k(KAPU_CIM, "/kapu")).statusz).toBe(200);
  });

  it("3. API jegy nélkül: 401 {\"hiba\":\"kapu\"}, utf-8, no-store — a belépés és a regisztráció API-ja is", async () => {
    for (const [m, ut] of [["GET", "/api/program/lista"], ["POST", "/api/fiok/belepes"], ["POST", "/api/fiok/regisztracio"], ["GET", "/api/belso/cim"]] as const) {
      const v = await k(KAPU_CIM, ut, { modszer: m, fej: { "content-type": "application/json" }, ...(m === "POST" ? { torzs: "{}" } : {}) });
      expect(v.statusz, ut).toBe(401);
      expect(JSON.parse(v.szoveg), ut).toEqual({ hiba: "kapu" });
      expect(v.fej.get("content-type"), ut).toBe("application/json; charset=utf-8");
      expect(v.fej.get("cache-control"), ut).toBe("no-store");
    }
  });

  it("4. rossz jelszó: 401 + „Nem jó a jelszó.”; a 6. rossz próba ugyanarról a címről 429 + „Túl sok próbálkozás…”, jó jelszóval is", async () => {
    const cim = egyedi();
    for (let i = 1; i <= 5; i++) {
      const v = await k(KAPU_CIM, "/kapu", { modszer: "POST", fej: URLAP_FEJ(cim), torzs: urlap(`rossz-${i} ékezettel`) });
      expect(v.statusz, `${i}.`).toBe(401);
      expect(v.szoveg).toContain("Nem jó a jelszó.");
      expect(v.szoveg).toContain('name="jelszo"');
    }
    const hat = await k(KAPU_CIM, "/kapu", { modszer: "POST", fej: URLAP_FEJ(cim), torzs: urlap("rossz-6") });
    expect(hat.statusz).toBe(429);
    expect(hat.szoveg).toContain("Túl sok próbálkozás. Próbáld 15 perc múlva.");
    const jo = await k(KAPU_CIM, "/kapu", { modszer: "POST", fej: URLAP_FEJ(cim), torzs: urlap(KAPU_JELSZO) });
    expect(jo.statusz).toBe(429);
    expect(jo.fej.get("set-cookie") ?? "").not.toContain("rogton_kapu");
  });

  it("5. jó jelszó: 303 vissza oda, ahonnan jött + rogton_kapu süti (HttpOnly, Secure, SameSite=Lax, Path=/, 30 nap); utána minden nyitva", async () => {
    const cim = egyedi();
    const v = await k(KAPU_CIM, "/kapu", { modszer: "POST", fej: URLAP_FEJ(cim), torzs: urlap(KAPU_JELSZO, "/naptar?het=2026-43") });
    expect(v.statusz).toBe(303);
    expect(v.fej.get("location")).toBe("/naptar?het=2026-43");
    const suti = v.fej.get("set-cookie") ?? "";
    expect(suti).toMatch(/^rogton_kapu=[A-Za-z0-9_-]{43};/);
    expect(suti).toMatch(/HttpOnly/i);
    expect(suti).toMatch(/Secure/i);
    expect(suti).toMatch(/SameSite=lax/i);
    expect(suti).toMatch(/Path=\//);
    expect(suti).toMatch(/Max-Age=2592000/);
    const jegy = suti.split(";")[0] ?? "";
    // a kapun belül: a belépőlap a valódi belépőlap, az API a saját válaszát adja (nem a kapuét)
    const b = await k(KAPU_CIM, "/belepes", { fej: { cookie: jegy } });
    expect(b.statusz).toBe(200);
    expect(b.szoveg).not.toContain('action="/kapu"');
    expect(b.szoveg).toContain("E-mail-cím");
    const a = await k(KAPU_CIM, "/api/program/lista", { fej: { cookie: jegy } });
    expect(a.szoveg).not.toContain('"hiba":"kapu"');
    // a kapu lapja jeggyel: vissza
    const kp = await k(KAPU_CIM, "/kapu?vissza=%2Fkezdolap", { fej: { cookie: jegy } });
    expect(kp.statusz).toBe(303);
    expect(kp.fej.get("location")).toBe("/kezdolap");
    // nyílt átirányítás nincs
    const ny = await k(KAPU_CIM, "/kapu", { modszer: "POST", fej: URLAP_FEJ(egyedi()), torzs: urlap(KAPU_JELSZO, "//gonosz.example/") });
    expect(ny.fej.get("location")).toBe("/");
  });

  it("6. hamis jegy, hamis kapun-kívül fejléc: nem nyit semmit", async () => {
    const v = await k(KAPU_CIM, "/api/program/lista", { fej: { cookie: `rogton_kapu=${"A".repeat(43)}`, "x-rogton-kapun-kivul": "1" } });
    expect(v.statusz).toBe(401);
    const l = await k(KAPU_CIM, "/belepes", { fej: { cookie: "rogton_kapu=nem-jo" } });
    expect(l.szoveg).toContain('action="/kapu"');
  });
});

describe("G9 kapu élőben — kikapcsolva (a rendes próbakörnyezet)", () => {
  it("7. jelszó nélkül helyben nyitva; Cloudflare-fejléccel (CF-Connecting-IP) zárva: lap „most nem elérhető”, API 503", async () => {
    let helyi: Awaited<ReturnType<typeof k>>;
    try {
      helyi = await k(PROBA_CIM, "/belepes");
    } catch {
      return; // nincs futó kiszolgáló: a többi élő próbához hasonlóan kimarad
    }
    if (helyi.szoveg.includes('action="/kapu"')) return; // ez a kiszolgáló kapuval fut — ide nem tartozik
    expect(helyi.statusz).toBe(200);
    expect(helyi.szoveg).toContain("E-mail-cím");
    const cf = { "cf-connecting-ip": "84.2.3.4", "x-forwarded-for": "84.2.3.4" };
    const z = await k(PROBA_CIM, "/belepes", { fej: cf });
    expect(z.statusz).toBe(200);
    expect(z.szoveg).toContain("A belépés most nem elérhető.");
    expect(z.szoveg).not.toContain('name="jelszo"');
    expect(z.szoveg).not.toContain("E-mail-cím");
    const a = await k(PROBA_CIM, "/api/program/lista", { fej: cf });
    expect(a.statusz).toBe(503);
    expect(JSON.parse(a.szoveg)).toEqual({ hiba: "kapu_nincs_beallitva" });
    expect((await k(PROBA_CIM, "/api/egeszseg", { fej: cf })).statusz).toBe(200);
  });
});
