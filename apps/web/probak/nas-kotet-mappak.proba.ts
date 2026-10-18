// c30 F9 utómunka (10-17, a 7ba2728 kirakása után 502): a NAS dobozkezelője a bind-mount mappát NEM hozza létre magától — ha a compose
// egy új ./adatok/<x> kötetet kap, és a kirakó szkript nem készíti el, a doboz nem indul. Az F9 csak a kézi kirak.sh-t javította; a robot
// a nas/kirak-sha.sh-t futtatja. Ez a próba MINDKÉT kirakóban megköveteli a compose minden ./adatok kötetének `mkdir -p`-jét, és az
// alkalmazás (node, 1000) által írt mappák `chown 1000:1000`-jét. Fájlolvasás, kiszolgáló nélkül.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const olvas = (ut: string) => readFileSync(new URL(`../../../${ut}`, import.meta.url), "utf8");
const compose = olvas("nas/docker-compose.yml");
const kotetek = [...compose.matchAll(/^\s*-\s*\.\/(adatok\/[A-Za-z0-9_-]+):/gm)].map((m) => m[1]!);
/** az alkalmazás doboza írja (a node felhasználó) — a compose `app` szolgáltatásának ./adatok kötetei */
const appResz = compose.slice(compose.indexOf("\n  app:"), compose.indexOf("\n  referencia:"));
const appKotetek = [...appResz.matchAll(/^\s*-\s*\.\/(adatok\/[A-Za-z0-9_-]+):/gm)].map((m) => m[1]!);

describe("a NAS kötet-mappái: amit a compose csatol, azt a kirakó elkészíti", () => {
  it("a compose kötetei (a próba önellenőrzése)", () => {
    expect(kotetek).toEqual(expect.arrayContaining(["adatok/postgres", "adatok/fajlok", "adatok/album"]));
    expect(appKotetek).toEqual(["adatok/fajlok", "adatok/album"]);
  });
  // kirak.sh: a kézi út (--indit); kirak-sha.sh: a robot útja (5. lépés — a db indítása előtt, így az alkalmazás indulásakor már ott van)
  for (const szkript of ["nas/kirak.sh", "nas/kirak-sha.sh"]) {
    it(`${szkript}: minden ./adatok kötet mkdir -p, az alkalmazáséi chown 1000:1000 — a compose up előtt`, () => {
      const s = olvas(szkript);
      const sor = s.split("\n").find((l) => /mkdir -p [^&]*adatok\/postgres/.test(l));
      expect(sor, "nincs mkdir -p sor az adatok mappákra").toBeTruthy();
      const mkdir = /mkdir -p ([^&]*)&&/.exec(sor!)?.[1] ?? "";
      for (const k of kotetek) expect(mkdir.split(/\s+/), `${szkript}: hiányzik a mkdir -p ${k}`).toContain(k);
      const chown = /chown 1000:1000 ([^&]*)&&/.exec(sor!)?.[1] ?? "";
      for (const k of appKotetek) expect(chown.split(/\s+/), `${szkript}: hiányzik a chown 1000:1000 ${k}`).toContain(k);
      // a mappák a `docker compose … up` ELŐTT készülnek: ugyanabban a NAS-parancsban, előrébb
      expect(sor!.indexOf("up -d")).toBeGreaterThan(sor!.indexOf("mkdir -p"));
    });
  }
});
