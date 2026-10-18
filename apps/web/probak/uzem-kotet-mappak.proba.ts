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
    // G6: a kirakás saját compose-hívása a "${DC[@]}"; a halo_or() önjavító újraalkotása (már kint lévő változaton, meglévő
    // mappákkal) ezt megelőzheti, ezért azt nem számoljuk az „első up” közé
    const elsoUp = sorok.findIndex((l) => /"\$\{DC\[@\]\}" up -d --no-build/.test(l) && !l.trim().startsWith("#"));
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

// G6/G7 (2026-10-18): a hálózati határok a compose fájlban — a képgyártó csak belül, a kiadott port egyetlen (127.0.0.1:8410), az
// alkalmazásnak nincs saját hálózata (a gma-egress névterében él, így csak a WARP-on vagy sehogy nem megy ki), és az nginx őt
// futásidőben, névvel éri el. Fájlolvasás.
describe("G6/G7: a hálózati határok", () => {
  const szakasz = (nev: string) => {
    const eleje = compose.indexOf(`\n  ${nev}:\n`);
    const vege = compose.slice(eleje + 1).search(/\n  [a-z]+:\n|\nnetworks:\n/);
    return compose.slice(eleje, vege < 0 ? undefined : eleje + 1 + vege);
  };
  it("a képgyártó csak a belső hálózaton van, porta nincs", () => {
    const k = szakasz("kepgyar");
    expect(k).toMatch(/networks: \[belso\]/);
    expect(k).not.toMatch(/ports:|kimeno|network_mode/);
  });
  it("egyetlen kiadott port, az is csak a gépen belül: 127.0.0.1:8410 (a gma-web-en)", () => {
    expect([...compose.matchAll(/^\s*-\s*"([0-9.]+:\d+:\d+)"/gm)].map((m) => m[1])).toEqual(["127.0.0.1:8410:80"]);
    expect(compose.match(/^\s+ports:/gm)?.length).toBe(1);
    expect(szakasz("web")).toContain('"127.0.0.1:8410:80"');
  });
  it("az alkalmazás a gma-egress névterében él: network_mode service:egress, saját hálózat és port nélkül", () => {
    const a = szakasz("app");
    expect(a).toMatch(/network_mode: "service:egress"/);
    expect(a).not.toMatch(/^\s+networks:|^\s+ports:/m);
    const e = szakasz("egress");
    expect(e).toMatch(/networks: \[belso, kimeno\]/);
    expect(e).toMatch(/cap_add: \[NET_ADMIN\]/);
    expect(e).toMatch(/warp=\(on\|plus\)/);
  });
  it("az alagút csak kifelé tárcsáz: porta nincs, a tokene a környezetből jön, a profilja kapcsolja be", () => {
    const t = szakasz("tunnel");
    expect(t).not.toMatch(/ports:/);
    expect(t).toMatch(/TUNNEL_TOKEN: \$\{CF_TUNNEL_TOKEN:-\}/);
    expect(t).toMatch(/profiles: \["tunnel"\]/);
  });
  it("az nginx névvel, futásidőben éri el az alkalmazást, és a látogató címét csak a docker-tartományból fogadja el", () => {
    const n = olvas("uzem/nginx.conf");
    expect(n).toContain("set $app_cim http://egress:3000;");
    expect(n.match(/proxy_pass \$app_cim;/g)?.length).toBe(2);
    expect(n).not.toMatch(/proxy_pass http:\/\/app:3000/);
    expect(n).toMatch(/set_real_ip_from 172\.16\.0\.0\/12;\s*real_ip_header CF-Connecting-IP;/);
    expect(n).not.toContain("$proxy_add_x_forwarded_for");
  });
  it("a kill-switch: a névtér kimenő forgalma alapból tilos, csak a WARP-alagút, a docker-alhálók és a WARP végpontjai mehetnek", () => {
    const k = olvas("uzem/egress/kerites-belul.nft");
    expect(k).toMatch(/type filter hook output priority filter; policy drop;/);
    expect(k).toContain('oifname "CloudflareWARP" accept');
    expect(k).not.toMatch(/192\.168|100\.64|10\.0\.0\.0/);
    expect(olvas("uzem/egress/indit.sh").indexOf("nft -f")).toBeLessThan(olvas("uzem/egress/indit.sh").indexOf("exec /entrypoint.sh"));
  });
});
