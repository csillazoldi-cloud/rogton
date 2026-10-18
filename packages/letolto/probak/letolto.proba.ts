import { beforeEach, describe, expect, it, vi } from "vitest";
import { cimNormalizal, letoltoHiv, LetoltesHiba, nyersBajtok, nyilvanosCim, weboldalSzoveg } from "../src/index.js";

// A próbák NEM használnak hálózatot: a DNS-feloldást modulcserével, a hálózati hívást a globális `fetch` cseréjével
// helyettesítjük. A `vi.mock` a fájl tetejére emelődik, ezért EGYSZER szerepel, és a válaszát a `dns` objektumon át állítjuk.
const { dns } = vi.hoisted(() => ({ dns: { cimek: [{ address: "93.184.216.34", family: 4 }] } }));
vi.mock("node:dns/promises", () => ({
  lookup: async () => dns.cimek,
}));

beforeEach(() => {
  dns.cimek = [{ address: "93.184.216.34", family: 4 }]; // alapból nyilvános cím
});

describe("cimNormalizal", () => {
  it("séma nélküli címhez https://-t ad", () => {
    const url = cimNormalizal("pelda.hu");
    expect(url.toString()).toBe("https://pelda.hu/");
  });

  it("http:// címet változatlanul felold", () => {
    const url = cimNormalizal("http://pelda.hu/a?b=1");
    expect(url.toString()).toBe("http://pelda.hu/a?b=1");
  });

  it("tiltott protokollok hibát dobnak", () => {
    for (const rossz of ["ftp://pelda.hu", "file:///etc/passwd", "javascript:alert(1)"]) {
      expect(() => cimNormalizal(rossz)).toThrow();
      try {
        cimNormalizal(rossz);
      } catch (h) {
        expect((h as LetoltesHiba).kod).toBe("FORRAS_ROSSZ_CIM");
      }
    }
  });

  it("érvénytelen címek hibát dobnak", () => {
    for (const rossz of ["pont nelkuli szo", "", "https:// szokoz.hu"]) {
      expect(() => cimNormalizal(rossz)).toThrow();
      try {
        cimNormalizal(rossz);
      } catch (h) {
        expect((h as LetoltesHiba).kod).toBe("FORRAS_ROSSZ_CIM");
      }
    }
  });
});

describe("nyilvanosCim", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("számmal írt tiltott címeket elutasít (DNS nélkül)", async () => {
    const tiltottCimek = [
      "127.0.0.1",
      "10.0.0.5",
      "192.168.1.1",
      "172.16.0.1",
      "169.254.169.254",
      "0.0.0.0",
      "100.64.0.1",
      "::1",
      "fc00::1",
      "fe80::1",
    ];
    for (const cim of tiltottCimek) {
      const url = new URL(`https://${cim.includes(":") ? `[${cim}]` : cim}/`); // IPv6 a címben szögletes zárójellel
      await expect(nyilvanosCim(url)).rejects.toThrow();
      try {
        await nyilvanosCim(url);
      } catch (h) {
        expect((h as LetoltesHiba).kod).toBe("FORRAS_TILTOTT_CIM");
      }
    }
  });

  it("nyilvános címet engedélyez", async () => {
    await expect(nyilvanosCim(new URL("https://pelda.hu/"))).resolves.toBeUndefined();
  });

  it("hosztnév, amely BELSŐ címre mutat, tiltott (DNS-visszakötés elleni védelem)", async () => {
    dns.cimek = [{ address: "127.0.0.1", family: 4 }];
    await expect(nyilvanosCim(new URL("https://gonosz.pelda.hu/"))).rejects.toThrow(LetoltesHiba);
  });
});

describe("letoltoHiv", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("RSS 2.0 feedet feldolgoz", async () => {
    const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Teszt RSS</title>
    <item>
      <title>Első cikk</title>
      <link>https://pelda.hu/1</link>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
      <description>Első leírás</description>
    </item>
    <item>
      <title>Második cikk</title>
      <link>https://pelda.hu/2</link>
      <pubDate>Tue, 02 Jan 2024 11:00:00 GMT</pubDate>
      <description>Második leírás</description>
    </item>
  </channel>
</rss>`;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } }))
      .mockResolvedValueOnce(new Response(rss, { headers: { "content-type": "application/rss+xml" } }));
    vi.stubGlobal("fetch", fetchMock);

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/feed", tipus: "rss" });
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.tipus).toBe("rss");
      expect(eredmeny.cikkek).toHaveLength(2);
      expect(eredmeny.cikkek[0]?.cim).toBe("Első cikk");
      expect(eredmeny.cikkek[0]?.url).toBe("https://pelda.hu/1");
      expect(eredmeny.cikkek[1]?.cim).toBe("Második cikk");
      expect(eredmeny.cikkek[1]?.url).toBe("https://pelda.hu/2");
    }
  });

  it("Atom feedet feldolgoz", async () => {
    const atom = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="hu">
  <title>Teszt Atom</title>
  <entry>
    <title>Atom cikk</title>
    <link href="https://pelda.hu/atom/1"/>
    <updated>2024-01-01T10:00:00Z</updated>
    <summary>Atom összefoglaló</summary>
  </entry>
</feed>`;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } }))
      .mockResolvedValueOnce(new Response(atom, { headers: { "content-type": "application/atom+xml" } }));
    vi.stubGlobal("fetch", fetchMock);

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/atom", tipus: "rss" });
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.tipus).toBe("rss");
      expect(eredmeny.cikkek).toHaveLength(1);
      expect(eredmeny.cikkek[0]?.cim).toBe("Atom cikk");
      expect(eredmeny.cikkek[0]?.url).toBe("https://pelda.hu/atom/1");
      expect(eredmeny.cikkek[0]?.nyelv).toBe("hu");
    }
  });

  it("HTML választ weboldalként dolgoz fel", async () => {
    const html = `<html><head><title>Weboldal címe</title></head><body><p>Szöveg</p></body></html>`;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } }))
      .mockResolvedValueOnce(new Response(html, { headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetchMock);

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/oldal", tipus: "weboldal" });
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.tipus).toBe("weboldal");
      expect(eredmeny.cikkek).toHaveLength(1);
      expect(eredmeny.cikkek[0]?.cim).toBe("Weboldal címe");
    }
  });

  it("robots.txt tiltás esetén hibát ad", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("User-agent: *\nDisallow: /", { headers: { "content-type": "text/plain" } }));
    vi.stubGlobal("fetch", fetchMock);

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: "weboldal" });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hibaOk).toBe("robots_tiltja");
    }
  });

  it("fetch hiba esetén nem dob kivételt", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } }))
      .mockRejectedValueOnce(new Error("Hálózati hiba"));
    vi.stubGlobal("fetch", fetchMock);

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: "weboldal" });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) {
      expect(eredmeny.hibaOk).toBe("FORRAS_NEM_ELERHETO");
    }
  });
});

describe("weboldalSzoveg", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("túl sok átirányítás hibát dob", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValue(new Response(null, { status: 301, headers: { location: "https://pelda.hu/kovetkezo" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(weboldalSzoveg("https://pelda.hu/", { maxAtiranyitas: 3 })).rejects.toThrow();
    try {
      await weboldalSzoveg("https://pelda.hu/", { maxAtiranyitas: 3 });
    } catch (h) {
      expect((h as LetoltesHiba).kod).toBe("FORRAS_NEM_ELERHETO");
    }
  });

  it("méretkorlát túllépése hibát dob", async () => {
    const nagyTorzs = "a".repeat(2 * 1024 * 1024); // 2 MB
    const fetchMock = vi.fn()
      .mockResolvedValue(new Response(nagyTorzs, { headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(weboldalSzoveg("https://pelda.hu/", { maxBajt: 1000 })).rejects.toThrow();
    try {
      await weboldalSzoveg("https://pelda.hu/", { maxBajt: 1000 });
    } catch (h) {
      expect((h as LetoltesHiba).kod).toBe("FORRAS_TUL_NAGY");
    }
  });
});

// E-29b: a CDATA-burok. Mérve 2026-09-08: a BBC hírcsatornája 33 ÜRES cikket adott, mert a burok nyitása
// (`<![CDATA[`) HTML-címkének látszott, és a címkeirtás a teljes tartalmat kivágta.
describe("CDATA-burok a hírcsatornában", () => {
  const csatorna = (elemek: string): string =>
    `<?xml version="1.0"?><rss version="2.0"><channel><title>Teszt</title>${elemek}</channel></rss>`;

  async function feldolgoz(xml: string): Promise<Awaited<ReturnType<typeof letoltoHiv>>> {
    const fetchCsonk = vi.fn()
      .mockResolvedValueOnce(new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } }))
      .mockResolvedValueOnce(new Response(xml, { headers: { "content-type": "application/rss+xml" } }));
    vi.stubGlobal("fetch", fetchCsonk);
    return letoltoHiv({ cim: "https://pelda.hu/feed", tipus: "rss" });
  }

  it("a CDATA-ba csomagolt cím és szöveg megérkezik (nem vész el)", async () => {
    const e = await feldolgoz(csatorna(`<item>
      <title><![CDATA[Nagy bejelentés a városházán]]></title>
      <description><![CDATA[A polgármester ma délelőtt jelentette be a felújítás kezdetét.]]></description>
      <link>https://pelda.hu/1</link>
    </item>`));
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.cikkek).toHaveLength(1);
    expect(e.cikkek[0]?.cim).toBe("Nagy bejelentés a városházán");
    expect(e.cikkek[0]?.szoveg).toBe("A polgármester ma délelőtt jelentette be a felújítás kezdetét.");
  });

  it("a CDATA belsejében lévő HTML-címkék eltűnnek, a szöveg marad", async () => {
    const e = await feldolgoz(csatorna(`<item>
      <title><![CDATA[Cím]]></title>
      <description><![CDATA[<p>Első bekezdés.</p><p>Második <strong>bekezdés</strong>.</p>]]></description>
      <link>https://pelda.hu/2</link>
    </item>`));
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.cikkek[0]?.szoveg).toBe("Első bekezdés. Második bekezdés .");
  });

  it("CDATA nélküli hírcsatorna változatlanul működik (entitásfeloldással)", async () => {
    const e = await feldolgoz(csatorna(`<item>
      <title>Cukr&#225;szda ny&#237;lt</title>
      <description>Friss s&amp;#252;tem&#233;ny minden nap.</description>
      <link>https://pelda.hu/3</link>
    </item>`));
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.cikkek[0]?.cim).toBe("Cukrászda nyílt");
    expect(e.cikkek[0]?.szoveg).toContain("Friss");
  });

  it("cím nélküli tétel nem lesz cikk", async () => {
    const e = await feldolgoz(csatorna(`<item><title><![CDATA[]]></title><description><![CDATA[Van szöveg.]]></description><link>https://pelda.hu/4</link></item>
      <item><title><![CDATA[Van címe]]></title><description><![CDATA[Ennek van.]]></description><link>https://pelda.hu/5</link></item>`));
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.cikkek).toHaveLength(1);
    expect(e.cikkek[0]?.cim).toBe("Van címe");
  });

  it("a CDATA-s cikkek ujjlenyomata KÜLÖNBÖZŐ (nem esik mind egy kupacba)", async () => {
    const e = await feldolgoz(csatorna(`<item><title><![CDATA[Egyik hír]]></title><description><![CDATA[Az egyik esemény leírása.]]></description><link>https://pelda.hu/6</link></item>
      <item><title><![CDATA[Másik hír]]></title><description><![CDATA[Egy teljesen más esemény leírása.]]></description><link>https://pelda.hu/7</link></item>`));
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.cikkek).toHaveLength(2);
    expect(e.cikkek[0]?.szoveg).not.toBe(e.cikkek[1]?.szoveg);
    expect(e.cikkek.every((c) => c.szoveg.length > 0)).toBe(true);
  });
});

// ——— E-42: a felhasználó a lap címét írja be, a rendszer megkeresi a hírfolyamot ———

/** URL szerinti válaszadó: a sorrendtől független, mert a felfedezés több címet is megpróbálhat. */
function valaszAdo(terkep: Record<string, () => Response>) {
  return vi.fn(async (be: URL | string) => {
    const cim = typeof be === "string" ? be : be.toString();
    const keszit = terkep[cim];
    if (!keszit) return new Response("nincs", { status: 404 });
    return keszit();
  });
}

const ENGED = () => new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } });

const MINTA_RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Lap</title>
<item><title>Hír egy</title><link>https://pelda.hu/1</link><description>Leírás egy</description></item>
<item><title>Hír kettő</title><link>https://pelda.hu/2</link><description>Leírás kettő</description></item>
</channel></rss>`;

describe("letoltoHiv — hírfolyam felfedezése és átirányítás", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("a lap fejlécében hirdetett hírfolyamot megtalálja (a felhasználó csak a lap címét írta be)", async () => {
    const html = `<html><head><title>Lap</title>
      <link rel="alternate" type="application/rss+xml" href="/hirek/feed/"></head><body><p>Szöveg</p></body></html>`;
    vi.stubGlobal("fetch", valaszAdo({
      "https://pelda.hu/robots.txt": ENGED,
      "https://pelda.hu/": () => new Response(html, { headers: { "content-type": "text/html" } }),
      "https://pelda.hu/hirek/feed/": () => new Response(MINTA_RSS, { headers: { "content-type": "application/rss+xml" } }),
    }));

    // protokoll nélküli cím, ismeretlen típus — pontosan az, amit a felhasználó begépel
    const eredmeny = await letoltoHiv({ cim: "pelda.hu", tipus: null });
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.tipus).toBe("rss");
      expect(eredmeny.felfedezettCim).toBe("https://pelda.hu/hirek/feed/");
      expect(eredmeny.cikkek).toHaveLength(2);
    }
  });

  it("ha a lap nem hirdeti, a megszokott /feed/ úton is megtalálja", async () => {
    const html = `<html><head><title>Lap</title></head><body><p>Szöveg</p></body></html>`;
    vi.stubGlobal("fetch", valaszAdo({
      "https://pelda.hu/robots.txt": ENGED,
      "https://pelda.hu/": () => new Response(html, { headers: { "content-type": "text/html" } }),
      "https://pelda.hu/feed/": () => new Response(MINTA_RSS, { headers: { "content-type": "application/rss+xml" } }),
    }));

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: null });
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.tipus).toBe("rss");
      expect(eredmeny.felfedezettCim).toBe("https://pelda.hu/feed/");
    }
  });

  it("ha nincs hírfolyam, a lapot magát figyeli (nem hiba)", async () => {
    const html = `<html><head><title>Lap címe</title></head><body><p>Szöveg</p></body></html>`;
    vi.stubGlobal("fetch", valaszAdo({
      "https://pelda.hu/robots.txt": ENGED,
      "https://pelda.hu/": () => new Response(html, { headers: { "content-type": "text/html" } }),
    }));

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: null });
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.tipus).toBe("weboldal");
      expect(eredmeny.cikkek[0]?.cim).toBe("Lap címe");
      expect(eredmeny.felfedezettCim).toBeUndefined();
    }
  });

  it("belső hálózati címre mutató átirányítást NEM követ", async () => {
    vi.stubGlobal("fetch", valaszAdo({
      "https://pelda.hu/robots.txt": ENGED,
      "https://pelda.hu/": () => new Response(null, { status: 302, headers: { location: "http://192.168.1.5/titok" } }),
    }));

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: null });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hibaOk).toBe("FORRAS_TILTOTT_CIM");
  });

  it("átirányítást követ, és a végső címet adja vissza", async () => {
    vi.stubGlobal("fetch", valaszAdo({
      "https://pelda.hu/robots.txt": ENGED,
      "https://pelda.hu/hirek": () => new Response(null, { status: 301, headers: { location: "https://pelda.hu/hirek/" } }),
      "https://pelda.hu/hirek/": () => new Response(MINTA_RSS, { headers: { "content-type": "application/rss+xml" } }),
    }));

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/hirek", tipus: "rss" });
    expect(eredmeny.ok).toBe(true);
    if (eredmeny.ok) {
      expect(eredmeny.felfedezettCim).toBe("https://pelda.hu/hirek/");
      expect(eredmeny.cikkek).toHaveLength(2);
    }
  });

  it("403 esetén külön hibakódot ad (az oldal él, de nem enged be)", async () => {
    vi.stubGlobal("fetch", valaszAdo({
      "https://pelda.hu/robots.txt": ENGED,
      "https://pelda.hu/": () => new Response("tilos", { status: 403 }),
    }));

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: null });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hibaOk).toBe("FORRAS_TILTVA");
  });
});

// ——— Biztonsági felülvizsgálat 2026-09-10: reprodukciós próbák ———
// Mindegyik ELBUKOTT a javítás előtt.

describe("B-03 — belső hálózati cím IPv6-alakban sem csúszhat át", () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  // Ez a konkrét eset, amit a felülvizsgálat reprodukált: a hexadecimálisan írt
  // IPv4-mapped cím. Ugyanaz, mint a ::ffff:127.0.0.1, csak másképp leírva.
  it("::ffff:7f00:1 (a 127.0.0.1 hexában) elutasítva", async () => {
    dns.cimek = [{ address: "::ffff:7f00:1", family: 6 }];
    await expect(nyilvanosCim(new URL("https://gonosz.pelda.hu/"))).rejects.toThrow(LetoltesHiba);
  });

  it("a további beágyazott alakok is elutasítva", async () => {
    const rosszak = [
      "::ffff:c0a8:1",        // 192.168.0.1 hexában
      "::ffff:a00:1",         // 10.0.0.1 hexában
      "::ffff:192.168.1.5",   // ugyanaz pontosan írva
      "0:0:0:0:0:ffff:7f00:1",// teljes alak, rövidítés nélkül
      "::",                   // meghatározatlan cím
      "::1",                  // loopback
      "64:ff9b::7f00:1",      // NAT64-be ágyazott 127.0.0.1
      "2002:7f00:1::",        // 6to4-be ágyazott 127.0.0.1
      "fd00::1",              // ULA
      "fe80::1",              // link-local
      "ff02::1",              // multicast
      "fe80::1%eth0",         // zónás link-local
    ];
    for (const cim of rosszak) {
      dns.cimek = [{ address: cim, family: 6 }];
      await expect(nyilvanosCim(new URL("https://gonosz.pelda.hu/")), cim).rejects.toThrow(LetoltesHiba);
    }
  });

  it("valódi nyilvános IPv6-cím továbbra is átmegy", async () => {
    dns.cimek = [{ address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 }];
    await expect(nyilvanosCim(new URL("https://pelda.hu/"))).resolves.toBeUndefined();
  });
});

describe("B-02 — az időkorlát a TÖRZS beolvasására is él", () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("gyors fejléc + soha véget nem érő törzs: nem akad meg", async () => {
    // A törzs csepegtet, de sosem zárul le. A megszakításnak a törzs olvasása közben kell hatnia.
    // A valódi `fetch` megszakításkor HIBÁRA állítja a törzs adatfolyamát — az álhálózat is ezt teszi,
    // különben nem a javítást mérnénk, hanem a saját utánzatunkat.
    let torzsVezerlo: ReadableStreamDefaultController<Uint8Array> | null = null;
    const vegtelenTorzs = new ReadableStream<Uint8Array>({
      start(vezerlo) { torzsVezerlo = vezerlo; },
      pull(vezerlo) {
        return new Promise<void>((r) => setTimeout(() => {
          try { vezerlo.enqueue(new TextEncoder().encode("x")); } catch { /* mar hibas */ }
          r();
        }, 30));
      },
    });
    const fetchMock = vi.fn(async (_be: unknown, init?: { signal?: AbortSignal }) => {
      if (String(_be).endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } });
      init?.signal?.addEventListener("abort", () => {
        try { torzsVezerlo?.error(new Error("megszakitva")); } catch { /* mar lezarult */ }
      });
      return new Response(vegtelenTorzs, { headers: { "content-type": "text/html" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const kezdes = Date.now();
    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: "weboldal" });
    const ido = Date.now() - kezdes;
    expect(eredmeny.ok).toBe(false);
    expect(ido).toBeLessThan(13_000); // a 10 mp-es korlát + ráhagyás; korlát nélkül sosem állna meg
  }, 20_000);

  it("túl nagy törzs: FORRAS_TUL_NAGY, nem olvassuk végig", async () => {
    let kiadott = 0;
    const nagyTorzs = new ReadableStream<Uint8Array>({
      pull(vezerlo) { kiadott += 100_000; vezerlo.enqueue(new Uint8Array(100_000)); },
    });
    const fetchMock = vi.fn(async (be: unknown) => {
      if (String(be).endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { headers: { "content-type": "text/plain" } });
      return new Response(nagyTorzs, { headers: { "content-type": "text/html" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: "weboldal" });
    expect(eredmeny.ok).toBe(false);
    if (!eredmeny.ok) expect(eredmeny.hibaOk).toBe("FORRAS_TUL_NAGY");
    expect(kiadott).toBeLessThan(20_000_000); // az 5 MB-os keret után megáll, nem olvas tovább
  }, 20_000);

  it("túl nagy robots.txt: nem olvassuk végig, és nem is akad meg", async () => {
    let kiadott = 0;
    const nagyRobots = new ReadableStream<Uint8Array>({
      pull(vezerlo) { kiadott += 50_000; vezerlo.enqueue(new TextEncoder().encode("#".repeat(50_000) + "\n")); },
    });
    const fetchMock = vi.fn(async (be: unknown) => {
      if (String(be).endsWith("/robots.txt")) return new Response(nagyRobots, { headers: { "content-type": "text/plain" } });
      return new Response("<html><title>Lap</title><body>ok</body></html>", { headers: { "content-type": "text/html" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const eredmeny = await letoltoHiv({ cim: "https://pelda.hu/", tipus: "weboldal" });
    expect(eredmeny.ok).toBe(true);          // a robots nem olvasható → engedett
    expect(kiadott).toBeLessThan(1_000_000); // a 64 kB-os keretnél megáll
  }, 20_000);
});

// ——— R-16 K7 (TERV §2-K7, gepezet 10): a bájt-letöltő — a honlapon talált logó ———
describe("nyersBajtok — R-16 K7", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 250, 0, 255]);
  const hibaKod = async (p: Promise<unknown>) => {
    try { await p; return "nincs hiba"; } catch (h) { return h instanceof LetoltesHiba ? h.kod : String(h); }
  };

  it("bináris képet bájtra pontosan visszaad (PNG, a fejléc paraméterével is)", async () => {
    vi.stubGlobal("fetch", valaszAdo({ "https://pelda.hu/logo.png": () => new Response(PNG, { headers: { "content-type": "image/png; charset=binary" } }) }));
    const e = await nyersBajtok("https://pelda.hu/logo.png");
    expect([...e.bajtok]).toEqual([...PNG]);
    expect(e.tipus).toMatch(/^image\/png/);
    expect(e.vegsoCim).toBe("https://pelda.hu/logo.png");
  });

  it("SVG-t is elfogad (a hívó rasztert csinál belőle)", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#a4471f"/></svg>';
    vi.stubGlobal("fetch", valaszAdo({ "https://pelda.hu/logo.svg": () => new Response(svg, { headers: { "content-type": "image/svg+xml" } }) }));
    const e = await nyersBajtok("https://pelda.hu/logo.svg");
    expect(new TextDecoder().decode(e.bajtok)).toBe(svg);
  });

  it("nyilvános átirányítást követ, a végső címmel", async () => {
    vi.stubGlobal("fetch", valaszAdo({
      "https://pelda.hu/logo": () => new Response(null, { status: 302, headers: { location: "/kepek/logo.webp" } }),
      "https://pelda.hu/kepek/logo.webp": () => new Response(PNG, { headers: { "content-type": "image/webp" } }),
    }));
    const e = await nyersBajtok("https://pelda.hu/logo");
    expect(e.vegsoCim).toBe("https://pelda.hu/kepek/logo.webp");
  });

  it("belső címre mutató átirányítást NEM követ (számmal írt cím és belsőre feloldó név)", async () => {
    const fetchMock = valaszAdo({
      "https://pelda.hu/a.png": () => new Response(null, { status: 302, headers: { location: "http://192.168.1.5/titok.png" } }),
      "https://pelda.hu/b.png": () => new Response(null, { status: 301, headers: { location: "https://belso.pelda.hu/titok.png" } }),
      "http://192.168.1.5/titok.png": () => new Response(PNG, { headers: { "content-type": "image/png" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await hibaKod(nyersBajtok("https://pelda.hu/a.png"))).toBe("FORRAS_TILTOTT_CIM");
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).not.toContain("http://192.168.1.5/titok.png");
    // a második ugrás neve belső címre oldódik fel — a DNS-ellenőrzés az ugrás után fut
    let hivas = 0;
    dns.cimek = [{ address: "93.184.216.34", family: 4 }];
    vi.stubGlobal("fetch", vi.fn(async (be: unknown) => {
      hivas++;
      dns.cimek = [{ address: "10.0.0.7", family: 4 }]; // a következő feloldás már belső
      return String(be) === "https://pelda.hu/b.png" ? new Response(null, { status: 301, headers: { location: "https://belso.pelda.hu/titok.png" } }) : new Response(PNG, { headers: { "content-type": "image/png" } });
    }));
    expect(await hibaKod(nyersBajtok("https://pelda.hu/b.png"))).toBe("FORRAS_TILTOTT_CIM");
    expect(hivas).toBe(1);
  });

  it("belső kezdőcímet hálózat nélkül elutasít", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const c of ["http://127.0.0.1/logo.png", "http://localhost/logo.png", "http://[::1]/logo.png", "file:///etc/passwd"]) {
      expect(["FORRAS_TILTOTT_CIM", "FORRAS_ROSSZ_CIM"]).toContain(await hibaKod(nyersBajtok(c)));
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("2 MB fölött megáll (menet közben, nem olvas tovább)", async () => {
    let kiadott = 0;
    const vegtelen = new ReadableStream<Uint8Array>({ pull(v) { kiadott += 100_000; v.enqueue(new Uint8Array(100_000)); } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(vegtelen, { headers: { "content-type": "image/png" } })));
    expect(await hibaKod(nyersBajtok("https://pelda.hu/nagy.png"))).toBe("FORRAS_TUL_NAGY");
    expect(kiadott).toBeLessThan(3_000_000);
    // pontosan a keret még jó, egy bájttal több már nem
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(2_000_000), { headers: { "content-type": "image/png" } })));
    expect((await nyersBajtok("https://pelda.hu/pont.png")).bajtok.byteLength).toBe(2_000_000);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(2_000_001), { headers: { "content-type": "image/png" } })));
    expect(await hibaKod(nyersBajtok("https://pelda.hu/tobb.png"))).toBe("FORRAS_TUL_NAGY");
  }, 20_000);

  it("text/html (és más nem-kép) válasz: FORRAS_ROSSZ_TIPUS", async () => {
    for (const tipus of ["text/html; charset=utf-8", "application/octet-stream", "image/gif", "image/svg", ""]) {
      vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>nem logó</html>", { headers: tipus ? { "content-type": tipus } : {} })));
      expect(await hibaKod(nyersBajtok("https://pelda.hu/logo.png"))).toBe("FORRAS_ROSSZ_TIPUS");
    }
  });

  it("időkorlát a teljes letöltésre (csepegtető forrás)", async () => {
    // mint a B-02 próbája fent: a valódi `fetch` megszakításkor hibára állítja a törzset — az álhálózat is
    let vezerlo: ReadableStreamDefaultController<Uint8Array> | null = null;
    const lassu = new ReadableStream<Uint8Array>({
      start(v) { vezerlo = v; },
      pull(v) { return new Promise<void>((r) => setTimeout(() => { try { v.enqueue(new Uint8Array(10)); } catch { /* már hibás */ } r(); }, 50)); },
    });
    vi.stubGlobal("fetch", vi.fn(async (_c: unknown, o?: { signal?: AbortSignal }) => {
      o?.signal?.addEventListener("abort", () => { try { vezerlo?.error(new Error("megszakitva")); } catch { /* lezárult */ } });
      return new Response(lassu, { headers: { "content-type": "image/png" } });
    }));
    const t0 = Date.now();
    expect(await hibaKod(nyersBajtok("https://pelda.hu/lassu.png", { idokorlatMs: 600 }))).toBe("FORRAS_NEM_ELERHETO");
    expect(Date.now() - t0).toBeLessThan(5_000);
  }, 20_000);
});
