// G8 (Csilla, 2026-10-18 16:02): a lebegő Visszajelzés gomb a VISSZAJELZES_GOMB kapcsolón — a BÖNGÉSZŐ DOM-ja szerint.
// A gomb csak a kliensen, a betöltés után jelenik meg, ezért a HTML-fetch nem elég: valódi böngésző nézi a belépőlapot (nyilvános
// keret) és a Kezdőlapot (belépett felső sáv, ☰ menü is).
//
// Futtatás: egy futó kiszolgáló (PROBA_CIM) és a hozzá tartozó elvárt állás (PROBA_VJ_GOMB=be|ki — amivel a kiszolgálót
// indították), plus a böngésző (playwright-core a tools/kepernyokep alól; BONGESZO_UT = a chrome futtatható fájlja).
// Bármelyik hiányában a próba KIMARAD — ez szándékos: a két állás két külön kiszolgáló-indítást kíván, a build önpróbája
// mindkettőt lefuttatja (plan-out/EPITES-NAPLO-G8.md).
import { describe, expect, it } from "vitest";
import { PROBA_CIM } from "./segedek";
import { VAN_BONGESZO, bongeszoIndit } from "./bongeszo";

const ELVART = process.env.PROBA_VJ_GOMB ?? "";
const FUT = (ELVART === "be" || ELVART === "ki") && VAN_BONGESZO;

type Meres = { gomb: number; hely: number; menuSor: number; modulKod: boolean };

describe.skipIf(!FUT)(`G8 Visszajelzés-gomb a DOM-ban (VISSZAJELZES_GOMB=${ELVART || "?"})`, () => {
  it("belépőlap (nyilvános) és Kezdőlap (belépve, ☰ menüvel), 390 px: gomb, menüsor, modul-kód az elvárt állás szerint", async () => {
    const bongeszo = await bongeszoIndit();
    try {
      const ktx = await bongeszo.newContext({ viewport: { width: 390, height: 844 }, locale: "hu" });
      const lap = await ktx.newPage();
      const js: string[] = [];
      lap.on("response", (r) => { if (r.url().endsWith(".js")) js.push(r.url()); });

      async function meres(): Promise<Meres> {
        await lap.waitForLoadState("networkidle");
        await lap.waitForTimeout(800); // a gomb a hidratálás után, egy effektben jelenik meg
        const gomb = await lap.locator(".km-vj-gomb").count();
        const hely = await lap.locator(".km-vj-hely").count();
        // a betöltött JS-darabok közül van-e, amelyik a modul kódját hordja (a modul saját osztályneve csak abban van)
        let modulKod = false;
        for (const u of [...new Set(js)]) {
          const t = await (await ktx.request.get(u)).text();
          if (t.includes("km-vj-bub-gombok")) { modulKod = true; break; }
        }
        return { gomb, hely, menuSor: 0, modulKod };
      }

      // 1. nyilvános keret
      await lap.goto(`${PROBA_CIM}/belepes`);
      const nyilvanos = await meres();

      // 2. belépve — fiók + szervezet a böngészőben (a sütik így a böngészőé)
      const email = `vj-gomb-${Date.now().toString(36)}@proba.example`;
      const jelszo = "Árvíztűrő-Tükörfúrógép 2026!";
      const api = (ut: string, torzs: unknown) =>
        lap.evaluate(async ([u, t]: [string, unknown]) => (await fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(t), credentials: "same-origin" })).status, [ut, torzs] as [string, unknown]);
      expect(await api("/api/fiok/regisztracio", { nev: "Kovács Tibor Ödön", email, jelszo })).toBe(201);
      expect(await api("/api/fiok/belepes", { email, jelszo })).toBe(200);
      expect(await api("/api/szervezet", { nev: "Kovács és Társa Térkő, Udvar- és Járdaépítő Kft." })).toBe(201);
      js.length = 0;
      await lap.goto(`${PROBA_CIM}/kezdolap`);
      const belepve = await meres();
      // a ☰ menü (telefonon) — benne a „Visszajelzés” indítósor csak bekapcsolt gombnál
      const nyito = lap.locator("[data-r18-nyito]:visible").last();
      if (await nyito.count()) await nyito.click();
      await lap.waitForTimeout(300);
      const felirat = await lap.evaluate(() => [...document.querySelectorAll("button.r18-menu-sor")].map((s) => (s.textContent ?? "").trim()), undefined);
      belepve.menuSor = felirat.filter((s) => /^visszajelzés$/i.test(s)).length;

      if (ELVART === "ki") {
        expect(nyilvanos).toEqual({ gomb: 0, hely: 0, menuSor: 0, modulKod: false });
        expect(belepve).toEqual({ gomb: 0, hely: 0, menuSor: 0, modulKod: false });
      } else {
        expect(nyilvanos.gomb).toBe(1);
        expect(nyilvanos.modulKod).toBe(true);
        expect(belepve.gomb).toBe(1);
        expect(belepve.menuSor).toBe(1);
      }
    } finally {
      await bongeszo.close();
    }
  }, 90_000);
});
