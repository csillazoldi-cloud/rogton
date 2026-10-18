// G2 (2026-10-18): a fork egy gépen fut (uzem/), a NAS kirakói megszűntek. Ez a próba a régi nas-kotet-mappak.proba.ts UTÓDJA,
// ugyanazzal a céllal (a c30 F9 utómunka tanulsága: a bind-mount mappát senki nem hozza létre magától, és ha hiányzik, a doboz nem indul):
// amit az uzem/docker-compose.yml a $GMA_GYOKER/adatok alól csatol, azt az uzem/kirak.sh MINDEN indítás előtt elkészíti, és az
// alkalmazás (node, 1000) által írt mappákat 1000:1000-re állítja. Az elvárás átkerült a NAS-szkriptekről a uzem/kirak.sh-ra (ok: G2).
// Fájlolvasás, kiszolgáló nélkül.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const olvas = (ut: string) => readFileSync(new URL(`../../../${ut}`, import.meta.url), "utf8");
const compose = olvas("uzem/docker-compose.yml");
const KOTET = /^\s*-\s*\$\{GMA_GYOKER(?::\?[^}]*)?\}\/(adatok\/[A-Za-z0-9_-]+):/gm;
const kotetek = [...compose.matchAll(KOTET)].map((m) => m[1]!);
const appResz = compose.slice(compose.indexOf("\n  app:"), compose.indexOf("\n  kepgyar:"));
const appKotetek = [...appResz.matchAll(KOTET)].map((m) => m[1]!);
const kirak = olvas("uzem/kirak.sh");
const sorok = kirak.split("\n");

describe("az uzem kötet-mappái: amit a compose csatol, azt a kirakó elkészíti", () => {
  it("a compose kötetei (a próba önellenőrzése)", () => {
    expect(kotetek).toEqual(expect.arrayContaining(["adatok/postgres", "adatok/fajlok", "adatok/album"]));
    expect(appKotetek).toEqual(["adatok/fajlok", "adatok/album"]);
  });
  it("uzem/kirak.sh: minden adatok-kötet mkdir -p, az alkalmazáséi chown 1000:1000 — az első `up -d` előtt", () => {
    const mkdirSor = sorok.findIndex((l) => /mkdir -p .*adatok\/postgres/.test(l));
    expect(mkdirSor, "nincs mkdir -p sor az adatok mappákra").toBeGreaterThan(-1);
    for (const k of kotetek) expect(sorok[mkdirSor], `hiányzik a mkdir -p ${k}`).toContain(`$GMA/${k}`);
    const chownSor = sorok.findIndex((l) => /chown"? .*1000:1000/.test(l));
    expect(chownSor, "nincs chown 1000:1000 sor").toBeGreaterThan(-1);
    for (const k of appKotetek) expect(sorok[chownSor], `hiányzik a chown ${k}`).toContain(`/a/${k.replace("adatok/", "")}`);
    const elsoUp = sorok.findIndex((l) => /up -d --no-build/.test(l) && !l.trim().startsWith("#"));
    expect(elsoUp).toBeGreaterThan(mkdirSor);
    expect(elsoUp).toBeGreaterThan(chownSor);
  });
  it("csak a 127.0.0.1:8410 a kiadott port, és a db / képgyártó csak a belső hálózaton", () => {
    expect([...compose.matchAll(/^\s*-\s*"([0-9.]+:\d+:\d+)"/gm)].map((m) => m[1])).toEqual(["127.0.0.1:8410:80"]);
    const kepgyar = compose.slice(compose.indexOf("\n  kepgyar:"), compose.indexOf("\n  web:"));
    expect(kepgyar).toMatch(/networks: \[belso\]/);
    expect(compose).toMatch(/belso:\n\s+name: gma-belso\n\s+internal: true/);
  });
});
