// E-29: a Hírfigyelő feliratai EGY helyen élnek — a `@rogton/news-monitor-feliratok` adatfájljaiban.
// Ez a próba a GÉPEZET, ami őrzi, hogy az adatbázis és az adatfájl ne csússzon szét (az adatfájl belső épségét
// a csomag saját próbája őrzi):
// ha valaki kézzel ír át egy feliratot a migrációban (vagy fordítva), ez a próba elbukik.
import { feliratok, NYELVEK } from "@rogton/news-monitor-feliratok";
import { afterAll, describe, expect, it } from "vitest";
import { lezar, sql } from "./segedek";

afterAll(async () => {
  await lezar();
});

describe("hirfigyelo feliratok: adatfajl = adatbazis (E-29)", () => {
  it("az adatbázisban ugyanaz a szöveg van, mint az adatfájlban", async () => {
    const sorok = await sql<{ kulcs: string; nyelv: string; szoveg: string }>(
      "SELECT kulcs, nyelv, szoveg FROM felirat WHERE kulcs LIKE 'hf.%'",
    );
    expect(sorok.length).toBeGreaterThan(100);
    const eltero: { kulcs: string; nyelv: string; adatbazis: string; adatfajl: string | undefined }[] = [];
    for (const sor of sorok) {
      if (!(NYELVEK as readonly string[]).includes(sor.nyelv)) continue;
      const adatfajl = feliratok(sor.nyelv as (typeof NYELVEK)[number])[sor.kulcs];
      if (adatfajl !== sor.szoveg) eltero.push({ kulcs: sor.kulcs, nyelv: sor.nyelv, adatbazis: sor.szoveg, adatfajl });
    }
    expect(eltero).toEqual([]);

    // fordítva is: minden adatfájlbeli kulcs benne van az adatbázisban
    const adatbazisKulcsok = new Set(sorok.map((s) => `${s.kulcs}|${s.nyelv}`));
    const hianyzo: string[] = [];
    for (const nyelv of NYELVEK) {
      for (const kulcs of Object.keys(feliratok(nyelv))) {
        if (!adatbazisKulcsok.has(`${kulcs}|${nyelv}`)) hianyzo.push(`${kulcs} (${nyelv})`);
      }
    }
    expect(hianyzo).toEqual([]);
  });
});
