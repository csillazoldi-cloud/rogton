// G8: operations — nightly backup, off-box pull, restore drill, heartbeat. File-level guards on the scripts and units
// (the scripts themselves were run end to end in the build's local drill; see HANDOFF.md, G8).
// Design: docs/decisions/2026-10-18-g8-mentes.md.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const olvas = (ut: string) => readFileSync(new URL(`../../../${ut}`, import.meta.url), "utf8");
const kod = (ut: string) =>
  olvas(ut)
    .split("\n")
    .filter((s) => !s.trimStart().startsWith("#"))
    .join("\n");

describe("G8 mentés", () => {
  const m = kod("uzem/mentes.sh");

  it("1. csak nyilvános kulcsra titkosít (age -R), titkos kulcsot nem fogad el, és nincs openssl-jelszó", () => {
    expect(m).toMatch(/age -R "\$KULCS"/);
    expect(m).toMatch(/grep -q 'AGE-SECRET-KEY' "\$KULCS" && megall/);
    expect(m).not.toMatch(/openssl|age -d/);
  });

  it("2. a mentést nem törli: a régiek a _torolni/mentes-napi alá kerülnek, 14 marad; rm csak a saját munkamappára", () => {
    expect(m).toMatch(/MEGORZES=\$\{MENTES_MEGORZES:-14\}/);
    expect(m).toMatch(/mv "\$regi" "\$GMA\/_torolni\/mentes-napi\/"/);
    for (const sor of m.split("\n").filter((s) => /(^|[^-\w])rm\s/.test(s))) expect(sor).toMatch(/rm -rf "\$MUNKA"/);
  });

  it("3. adatbázis + fájlok + MANIFEST, a dump titkosítás előtt visszaolvasva; a kirakás zárját fogja", () => {
    expect(m).toMatch(/pg_dump -Fc -U km_tulaj -d km/);
    expect(m).toMatch(/pg_restore -l/);
    expect(m).toMatch(/--network none --user 0 -v "\$GMA\/adatok:\/a:ro"/);
    expect(m).toMatch(/MANIFEST km\.dump fajlok-album\.tar/);
    expect(m).toMatch(/flock -w 3600 8/);
    expect(m).toMatch(/mentés kész: /);
  });

  it("4. a timer 03:40 Budapest szerint, a kihagyott éjszakát pótolja; a szolgáltatás a ~/admin szkriptjét futtatja", () => {
    const t = olvas("uzem/systemd/gma-mentes.timer");
    expect(t).toMatch(/^OnCalendar=\*-\*-\* 03:40:00 Europe\/Budapest$/m);
    expect(t).toMatch(/^Persistent=true$/m);
    expect(olvas("uzem/systemd/gma-mentes.service")).toMatch(/^ExecStart=\/bin\/bash %h\/admin\/uzem\/mentes\.sh$/m);
  });
});

describe("G8 lehúzás és visszatöltési próba", () => {
  it("5. a Mac húz (a gép nem kezdeményez), 30 marad, a régiek _torolni/ alá; a legújabbat próbából visszafejti", () => {
    const l = kod("uzem/mentes-lehuz.sh");
    expect(l).toMatch(/MEGORZES=\$\{MENTES_MEGORZES:-30\}/);
    expect(l).toMatch(/mv "\$regi" "\$CEL\/_torolni\/"/);
    expect(l).toMatch(/age -d -i "\$KULCS" "\$LEGUJABB"/);
    expect(l).not.toMatch(/(^|[^-\w])rm\s/);
    // macOS ships bash 3.2 and BSD head: no negative head counts, no mapfile
    expect(l).not.toMatch(/head -n -|mapfile|readarray/);
  });

  it("6. a próba eldobható, hálózat nélküli dobozba tölt, az élő gma-db-hez nem nyúl, és a végén eltávolítja", () => {
    const v = kod("uzem/mentes-visszatolt.sh");
    expect(v).toMatch(/PROBA=gma-proba-db/);
    expect(v).toMatch(/docker run -d --name "\$PROBA" --network none --tmpfs/);
    expect(v).toMatch(/trap takarit EXIT/);
    expect(v).toMatch(/sha256sum -c/);
    expect(v).not.toMatch(/docker (exec|stop|rm)[^\n]*gma-db\b(?!-)/);
  });
});

describe("G8 szívdobbanás", () => {
  const s = kod("uzem/szivdobbanas.sh");

  it("7. a Telegram csak akkor hív ki, ha MINDKÉT változó be van állítva; a token nem kerül parancssorba", () => {
    expect(s).toMatch(/\[ -n "\$token" \] && \[ -n "\$chat" \] \|\| return 0/);
    expect(s).toMatch(/curl [^\n]*--config -/);
    expect(s).not.toMatch(/curl [^\n]*api\.telegram\.org/);
    expect(olvas("uzem/.env.pelda")).toMatch(/^RIASZTAS_TELEGRAM_TOKEN=$/m);
    expect(olvas("uzem/.env.pelda")).toMatch(/^RIASZTAS_TELEGRAM_CHAT=$/m);
  });

  it("8. életjel + warp a gma-app hálózatán át; kirakás alatt kihagy; 90 napnál régebbi napló a _torolni/naplo alá", () => {
    expect(s).toMatch(/127\.0\.0\.1:\$PORT\/api\/egeszseg/);
    expect(s).toMatch(/docker exec gma-app node/);
    expect(s).toMatch(/flock -n "\$GMA\/allapot\/zar" true/);
    expect(s).toMatch(/-mtime \+90 -exec mv -t "\$GMA\/_torolni\/naplo\/"/);
    expect(s).toMatch(/>> "\$RIASZTAS"/);
  });

  it("9. a timer 10 percenként fut", () => {
    expect(olvas("uzem/systemd/gma-szivdobbanas.timer")).toMatch(/^OnUnitActiveSec=10min$/m);
  });
});

// G8 kiegészítés (Csilla, 2026-10-18 16:02): a lebegő Visszajelzés gomb kapcsolója és a /api/belso/cim karakterkészlete.
describe("G8 Visszajelzés-gomb kapcsoló (VISSZAJELZES_GOMB)", () => {
  it("10. csak a pontos „be” kapcsol be; üres, hiányzó, „ki” vagy elgépelt érték → ki", async () => {
    const { visszajelzesGombBe } = await import("../app/_kozos/visszajelzes-gomb");
    expect(visszajelzesGombBe("be")).toBe(true);
    expect(visszajelzesGombBe(" BE ")).toBe(true);
    for (const e of [undefined, "", "ki", "igen", "1", "bekapcsolva"]) expect(visszajelzesGombBe(e), String(e)).toBe(false);
  });

  it("11. a sablon alapértéke „ki”, a compose ki-vel adja tovább az appnak", () => {
    expect(olvas("uzem/.env.pelda")).toMatch(/^VISSZAJELZES_GOMB=ki$/m);
    expect(olvas("uzem/docker-compose.yml")).toMatch(/^ {6}VISSZAJELZES_GOMB: \$\{VISSZAJELZES_GOMB:-ki\}$/m);
  });

  it("12. a gyökér-keret kérésenként olvassa és kontextusban adja le; a gomb-hely kikapcsolva semmit sem rajzol", () => {
    const l = olvas("apps/web/app/layout.tsx");
    expect(l).toMatch(/export const dynamic = "force-dynamic"/);
    expect(l).toMatch(/<VisszajelzesKapcsolo be=\{visszajelzesGombBe\(\)\}>/);
    const v = olvas("apps/web/app/_kozos/Visszajelzes.tsx");
    expect(v).toMatch(/if \(!be \|\| !kesz\) return null;/);
    // a modul (és vele a html-to-image képernyőkép-készítő) csak dinamikusan, bekapcsolt gombnál töltődik
    expect(v).toMatch(/dynamic\(\(\) => import\("\.\/VisszajelzesModulHely"\), \{ ssr: false \}\)/);
    expect(v).not.toMatch(/@rogton\/visszajelzes-react/);
  });

  it("13. a menü „Visszajelzés” sora is a kapcsolótól függ (különben halott gomb); a /visszajelzes adminlap linkje marad", () => {
    const s = olvas("apps/web/app/_kozos/FelsoSav.tsx");
    expect(s.match(/\{vjGomb \? \(/g)?.length).toBe(2);
    expect(s.match(/window\.dispatchEvent\(new Event\(VISSZAJELZES_INDIT\)\)/g)?.length).toBe(2);
    expect(s.match(/href="\/visszajelzes"/g)?.length).toBe(2);
  });

  it("14. a Visszajelzes komponens senki mást nem kerül meg: a modult csak a VisszajelzesModulHely importálja", async () => {
    const { execFileSync } = await import("node:child_process");
    const gyoker = new URL("../../../", import.meta.url).pathname;
    const talalat = execFileSync("git", ["-C", gyoker, "grep", "--untracked", "-l", "@rogton/visszajelzes-react\"", "--", "apps/web/app"], { encoding: "utf8" })
      .trim()
      .split("\n");
    expect(talalat).toEqual(["apps/web/app/_kozos/VisszajelzesModulHely.tsx"]);
  });
});

describe("G8 /api/belso/cim karakterkészlet", () => {
  it("15. a válasz minden ágon application/json; charset=utf-8 (belépés nélkül: 403)", async () => {
    const { GET } = await import("../app/api/belso/cim/route");
    const v = await GET(new Request("http://127.0.0.1/api/belso/cim"));
    expect(v.status).toBe(403);
    expect(v.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(v.headers.get("cache-control")).toBe("no-store");
    const r = olvas("apps/web/app/api/belso/cim/route.ts");
    expect(r.match(/headers: FEJLECEK/g)?.length).toBe(2);
  });
});
