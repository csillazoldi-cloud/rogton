import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// @rogton/letolto — a KÖZÖS letöltő (E-20, csomagba emelve E-29-ben): SSRF-védelem, robots.txt-ellenőrzés,
// weboldal- és RSS/Atom-letöltés. HOST-SEMLEGES: nincs benne Next, React, adatbázis vagy `server-only`,
// hogy a webalkalmazás ÉS a referencia-host is ugyanezt használhassa (A-12: másolás nélkül).

export type LetoltesHibaKod =
  | "FORRAS_ROSSZ_CIM"
  | "FORRAS_TILTOTT_CIM"
  | "FORRAS_NEM_ELERHETO"
  | "FORRAS_TUL_NAGY"
  | "FORRAS_NEM_SZOVEG"
  | "FORRAS_TILTVA"
  | "FORRAS_ROSSZ_TIPUS" // R-16 K7: a bájt-letöltésnél a válasz típusa nem az engedett (pl. text/html egy logó helyett)
  | "robots_tiltja"
  | "idotullepes";

export class LetoltesHiba extends Error {
  constructor(
    public readonly kod: LetoltesHibaKod,
    uzenet?: string,
  ) {
    super(uzenet ?? kod);
    this.name = "LetoltesHiba";
  }
}

export function cimNormalizal(be: string): URL {
  let cim = be.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(cim) && !/^https?:\/\//i.test(cim)) {
    throw new LetoltesHiba("FORRAS_ROSSZ_CIM"); // más protokoll (ftp:, file:, javascript: …) tilos
  }
  if (!/^https?:\/\//i.test(cim)) {
    cim = "https://" + cim;
  }
  // a hosztnév legyen valódi tartománynév vagy IP: szóköz, ékezet, pont nélküli szó → hibás cím
  if (!/^https?:\/\/[^\s/?#]+\.[^\s/?#]+/i.test(cim) && !/^https?:\/\/\[/i.test(cim)) {
    throw new LetoltesHiba("FORRAS_ROSSZ_CIM");
  }
  let url: URL;
  try {
    url = new URL(cim);
  } catch {
    throw new LetoltesHiba("FORRAS_ROSSZ_CIM");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new LetoltesHiba("FORRAS_ROSSZ_CIM");
  }
  return url;
}

function ipv4Tiltott(ip: string): boolean {
  const reszek = ip.split(".").map(Number);
  if (reszek.length !== 4 || reszek.some((r) => Number.isNaN(r) || r < 0 || r > 255)) {
    return true;
  }
  const a = reszek[0] ?? 0, b = reszek[1] ?? 0;
  if (a === 0) return true; // 0/8
  if (a === 10) return true; // 10/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10
  if (a === 127) return true; // 127/8
  if (a === 169 && b === 254) return true; // 169.254/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 168) return true; // 192.168/16
  if (a >= 224) return true; // 224/4 és 240/4
  return false;
}

/**
 * IPv6-cím nyolc darab 16 bites részre bontva. Szöveges alakot NEM elemzünk mintával:
 * a `::ffff:127.0.0.1` és a `::ffff:7f00:1` UGYANAZ a cím, csak máshogy írva — a korábbi
 * ellenőrzés csak az elsőt fogta meg (biztonsági felülvizsgálat 2026-09-10, B-03).
 */
function ipv6Reszek(ip: string): number[] | null {
  let ala = ip.toLowerCase().replace(/%.*$/, ""); // zóna (fe80::1%eth0) le
  // beágyazott pontos IPv4 (…:a.b.c.d) átírása két hextetre
  const pontos = ala.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (pontos?.[1]) {
    const b = pontos[1].split(".").map(Number);
    if (b.length !== 4 || b.some((x) => Number.isNaN(x) || x < 0 || x > 255)) return null;
    const h1 = ((b[0]! << 8) | b[1]!).toString(16);
    const h2 = ((b[2]! << 8) | b[3]!).toString(16);
    ala = ala.slice(0, -pontos[1].length) + h1 + ":" + h2;
  }
  const ketto = ala.split("::");
  if (ketto.length > 2) return null;
  const darabol = (r: string) => (r === "" ? [] : r.split(":"));
  const eleje = darabol(ketto[0] ?? "");
  const vege = ketto.length === 2 ? darabol(ketto[1] ?? "") : [];
  const hianyzo = ketto.length === 2 ? 8 - eleje.length - vege.length : 0;
  if (hianyzo < 0) return null;
  const teljes = [...eleje, ...Array(hianyzo).fill("0"), ...vege];
  if (teljes.length !== 8) return null;
  const szamok = teljes.map((h) => parseInt(h || "0", 16));
  if (szamok.some((n) => Number.isNaN(n) || n < 0 || n > 0xffff)) return null;
  return szamok;
}

function ipv4Szoveg(a: number, b: number): string {
  return `${(a >> 8) & 0xff}.${a & 0xff}.${(b >> 8) & 0xff}.${b & 0xff}`;
}

function ipv6Tiltott(ip: string): boolean {
  const r = ipv6Reszek(ip);
  if (!r) return true; // amit nem értünk, azt nem engedjük
  const [a, b, c, d, e, f, g, h] = r as [number, number, number, number, number, number, number, number];
  if (r.every((x) => x === 0)) return true; // :: (meghatározatlan)
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && f === 0 && g === 0 && h === 1) return true; // ::1 loopback
  if ((a & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
  if ((a & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((a & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  // IPv4-mapped (::ffff:0:0/96) és IPv4-compatible (::/96) — a beágyazott IPv4-et ellenőrizzük
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && (f === 0xffff || f === 0)) {
    return ipv4Tiltott(ipv4Szoveg(g, h));
  }
  // NAT64 (64:ff9b::/96) — a végén szintén IPv4 van
  if (a === 0x64 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) {
    return ipv4Tiltott(ipv4Szoveg(g, h));
  }
  // 6to4 (2002::/16) — a beágyazott IPv4 a 2. és 3. hextetben
  if (a === 0x2002) {
    return ipv4Tiltott(ipv4Szoveg(b, c));
  }
  return false;
}

function cimTiltott(ip: string): boolean {
  const verzio = isIP(ip);
  if (verzio === 4) return ipv4Tiltott(ip);
  if (verzio === 6) return ipv6Tiltott(ip);
  return true; // nem IP
}

function hosztnevTiltott(host: string): boolean {
  const ala = host.toLowerCase();
  if (ala === "localhost") return true;
  if (ala.endsWith(".local") || ala.endsWith(".internal")) return true;
  if (isIP(ala) !== 0) return true; // számmal írt cím
  return false;
}

export async function nyilvanosCim(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, ""); // IPv6 literál: [::1] → ::1
  if (hosztnevTiltott(host)) {
    throw new LetoltesHiba("FORRAS_TILTOTT_CIM");
  }
  if (isIP(host)) {
    // számmal írt cím: DNS nélkül, közvetlenül ellenőrizzük
    if (cimTiltott(host)) throw new LetoltesHiba("FORRAS_TILTOTT_CIM");
    return;
  }
  let cimek: string[];
  try {
    const eredmeny = await lookup(host, { all: true });
    cimek = eredmeny.map((e) => e.address);
  } catch {
    throw new LetoltesHiba("FORRAS_NEM_ELERHETO");
  }
  if (cimek.length === 0 || cimek.some((ip) => cimTiltott(ip))) {
    throw new LetoltesHiba("FORRAS_TILTOTT_CIM");
  }
}

function entitasFelold(szoveg: string): string {
  return szoveg.replace(/&(amp|lt|gt|quot|#39|nbsp|#\d+);/g, (egy, nev: string) => {
    switch (nev) {
      case "amp": return "&";
      case "lt": return "<";
      case "gt": return ">";
      case "quot": return '"';
      case "#39": return "'";
      case "nbsp": return " ";
      default: {
        const szam = nev.slice(1);
        const kod = Number(szam);
        return Number.isFinite(kod) ? String.fromCodePoint(kod) : egy;
      }
    }
  });
}

function szovegKinyer(html: string): { cim: string; szoveg: string } {
  let maradek = html;
  const cimEgyezes = maradek.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const cim = cimEgyezes?.[1] ? entitasFelold(cimEgyezes[1].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim() : "";

  maradek = maradek
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  maradek = maradek
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  maradek = entitasFelold(maradek);
  maradek = maradek.replace(/\s+/g, " ").trim();
  if (maradek.length > 12000) {
    maradek = maradek.slice(0, 12000);
  }
  return { cim, szoveg: maradek };
}

/**
 * R-16 K7 (TERV §2-K7, gepezet 10): a válasz-törzs BÁJTJAI, ugyanazzal a menet közbeni kerettel, mint a szövegé —
 * a keret átlépése hiba (FORRAS_TUL_NAGY), a hálózati olvasást megszakítjuk.
 */
async function torzsBajtok(torzs: ReadableStream<Uint8Array>, maxBajt: number): Promise<Uint8Array> {
  const olvaso = torzs.getReader();
  const darabok: Uint8Array[] = [];
  let eddig = 0;
  try {
    for (;;) {
      const { done, value } = await olvaso.read();
      if (done) break;
      eddig += value.byteLength;
      if (eddig > maxBajt) {
        void olvaso.cancel();
        throw new LetoltesHiba("FORRAS_TUL_NAGY");
      }
      darabok.push(value);
    }
  } finally {
    try { olvaso.releaseLock(); } catch { /* már elengedve */ }
  }
  const ki = new Uint8Array(eddig);
  let hol = 0;
  for (const d of darabok) { ki.set(d, hol); hol += d.byteLength; }
  return ki;
}

/**
 * Válasz-törzs beolvasása BÁJTKERETTEL. A keret a beolvasás közben él, nem utólag —
 * enélkül egy nagy vagy soha véget nem érő válasz elfogyaszthatja a munkafolyamatot.
 * `csonkol=true`: a keretnél megállunk és visszaadjuk, amennyi megvan (robots.txt).
 * `csonkol=false`: a keret átlépése hiba (FORRAS_TUL_NAGY).
 */
async function torzsOlvas(torzs: ReadableStream<Uint8Array>, maxBajt: number, csonkol = false): Promise<string> {
  const olvaso = torzs.getReader();
  const dekodolo = new TextDecoder();
  let ki = "";
  let eddig = 0;
  try {
    for (;;) {
      const { done, value } = await olvaso.read();
      if (done) break;
      eddig += value.byteLength;
      if (eddig > maxBajt) {
        if (!csonkol) throw new LetoltesHiba("FORRAS_TUL_NAGY");
        ki += dekodolo.decode(value.slice(0, value.byteLength - (eddig - maxBajt)), { stream: true });
        void olvaso.cancel(); // a hálózati olvasást TÉNYLEGESEN megszakítjuk
        return ki + dekodolo.decode();
      }
      ki += dekodolo.decode(value, { stream: true });
    }
    return ki + dekodolo.decode();
  } finally {
    try { olvaso.releaseLock(); } catch { /* már elengedve */ }
  }
}

async function robotsEllenoriz(url: URL): Promise<void> {
  // robots.txt lekérése a gazdáról (időkorlát 5 mp a TELJES letöltésre, max 64 kB; ha nem elérhető → engedett).
  // Biztonsági felülvizsgálat 2026-09-10 (B-02): korábban az időzítő a fejléc megérkezésekor törlődött,
  // és a törzs `arrayBuffer()`-rel EGÉSZBEN beolvasódott, csak utána rövidült 64 kB-ra — vagyis sem
  // időkorlát, sem valódi méretkorlát nem volt rajta.
  const robotsUrl = new URL("/robots.txt", url.origin);
  let robotsSzoveg = "";
  const vezerlo = new AbortController();
  const idozito = setTimeout(() => vezerlo.abort(), 5000);
  try {
    const valasz = await fetch(robotsUrl, {
      signal: vezerlo.signal,
      headers: { "user-agent": "KommunikaciosMunkater/0.1 (+forrasfeldolgozas)" },
      redirect: "manual",
    });
    if (valasz.ok && valasz.body) {
      robotsSzoveg = await torzsOlvas(valasz.body, 64 * 1024, true);
    }
  } catch {
    return; // nem elérhető, túl nagy vagy időtúllépés → engedett
  } finally {
    clearTimeout(idozito); // CSAK a törzs beolvasása után
  }

  const ut = url.pathname + url.search;
  const sorok = robotsSzoveg.split(/\r?\n/);
  let aktualisUa: string | null = null;
  const tiltottUtak: string[] = [];
  for (const sor of sorok) {
    const s = sor.trim();
    if (!s || s.startsWith("#")) continue;
    const kettospont = s.indexOf(":");
    if (kettospont === -1) continue;
    const kulcs = s.slice(0, kettospont).trim().toLowerCase();
    const ertek = s.slice(kettospont + 1).trim();
    if (kulcs === "user-agent") {
      aktualisUa = ertek.toLowerCase();
    } else if (kulcs === "disallow" && (aktualisUa === "*" || aktualisUa === "kommunikaciosmunkater")) {
      if (ertek) tiltottUtak.push(ertek);
    }
  }
  for (const tiltott of tiltottUtak) {
    if (tiltott === "/" || ut.startsWith(tiltott)) {
      throw new LetoltesHiba("robots_tiltja");
    }
  }
}

/**
 * XML-mezőből olvasható szöveg. A `<![CDATA[ … ]]>` burkot ELŐBB feloldjuk: enélkül a burok nyitása
 * (`<![CDATA[`) HTML-címkének látszik, és a címkeirtás a TELJES tartalmat kidobná — a cím és a szöveg
 * üresen maradna. (Mérve 2026-09-08: a BBC hírcsatornája így 33 üres cikket adott.)
 * A CDATA belseje nyers szöveg, ezért ott entitást sem oldunk fel újra.
 */
export function xmlMezoSzoveg(nyers: string): string {
  const cdataMinta = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
  const darabok: string[] = [];
  let vege = 0;
  let egyezes: RegExpExecArray | null;
  while ((egyezes = cdataMinta.exec(nyers)) !== null) {
    const kivul = nyers.slice(vege, egyezes.index);
    if (kivul) darabok.push(entitasFelold(kivul.replace(/<[^>]*>/g, " ")));
    darabok.push((egyezes[1] ?? "").replace(/<[^>]*>/g, " ")); // a CDATA belsejében is lehet HTML
    vege = egyezes.index + egyezes[0].length;
  }
  const marad = nyers.slice(vege);
  if (marad) darabok.push(entitasFelold(marad.replace(/<[^>]*>/g, " ")));
  return darabok.join(" ").replace(/\s+/g, " ").trim();
}

function rssElemzo(xml: string, forrasUrl: string): { cim: string; url: string; megjelenes: string | null; szoveg: string; nyelv: string | null }[] {
  const cikkek: { cim: string; url: string; megjelenes: string | null; szoveg: string; nyelv: string | null }[] = [];
  const nyelvEgyezes = xml.match(/<language>([^<]*)<\/language>/i) ?? xml.match(/<feed[^>]*xml:lang="([^"]*)"/i);
  const nyelvTeljes = nyelvEgyezes?.[1]?.trim() ?? "";
  const nyelv = nyelvTeljes ? nyelvTeljes.slice(0, 2).toLowerCase() : null;

  // RSS: <item>, Atom: <entry>
  const itemMinta = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let egyezes: RegExpExecArray | null;
  while ((egyezes = itemMinta.exec(xml)) !== null && cikkek.length < 50) {
    const tartalom = egyezes[2] ?? "";
    // A cím a <title>-ből; ha ott nincs, a névtérrel megadott változatokból (dc:title, media:title) — csak utána adjuk fel.
    const cimEgy = tartalom.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      ?? tartalom.match(/<(?:dc|media):title[^>]*>([\s\S]*?)<\/(?:dc|media):title>/i);
    const cim = xmlMezoSzoveg(cimEgy?.[1] ?? "");
    let link = "";
    const linkEgy = tartalom.match(/<link[^>]*href="([^"]*)"/i);
    if (linkEgy?.[1]) {
      link = linkEgy[1];
    } else {
      const linkEgy2 = tartalom.match(/<link>([\s\S]*?)<\/link>/i);
      link = xmlMezoSzoveg(linkEgy2?.[1] ?? "");
    }
    if (!link) continue;
    try { link = new URL(link, forrasUrl).toString(); } catch { continue; }
    const datumEgy = tartalom.match(/<(pubDate|published|updated)>([^<]*)<\/\1>/i);
    let megjelenes: string | null = null;
    if (datumEgy?.[2]) {
      const d = new Date(datumEgy[2].trim());
      if (!Number.isNaN(d.getTime())) megjelenes = d.toISOString();
    }
    const tartalomEgy = tartalom.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)
      ?? tartalom.match(/<content\b[^>]*>([\s\S]*?)<\/content>/i)
      ?? tartalom.match(/<description>([\s\S]*?)<\/description>/i)
      ?? tartalom.match(/<summary>([\s\S]*?)<\/summary>/i);
    const szoveg = xmlMezoSzoveg(tartalomEgy?.[1] ?? "");
    if (!cim) continue; // cím nélküli tétel nem cikk — nem visszük tovább
    cikkek.push({ cim, url: link, megjelenes, szoveg, nyelv });
  }
  return cikkek;
}

export async function weboldalSzoveg(
  be: string,
  opciok?: { idokorlatMs?: number; maxBajt?: number; maxAtiranyitas?: number },
): Promise<{ vegsoCim: string; cim: string; szoveg: string }> {
  const url = cimNormalizal(be);
  await nyilvanosCim(url);
  const l = await lekerKovetve(url, {
    accept: "text/html,application/xhtml+xml,application/rss+xml,application/atom+xml,text/xml",
    idokorlatMs: opciok?.idokorlatMs ?? 10000,
    maxBajt: opciok?.maxBajt ?? 1_000_000,
    maxAtiranyitas: opciok?.maxAtiranyitas ?? 3,
    engedettTipus: /text\/html|application\/xhtml\+xml|text\/plain|application\/rss\+xml|application\/atom\+xml|text\/xml|application\/xml/i,
  });
  const kinyert = szovegKinyer(l.teljes);
  return { vegsoCim: l.url.toString(), cim: kinyert.cim, szoveg: kinyert.szoveg };
}

/**
 * 2026-09-28 (első beállítás, a cég színei): egy lap vagy stíluslap NYERS szövege, ugyanazzal a védelemmel
 * (nyilvános cím, kézi átirányítás, időkorlát, méretkorlát), mint a többi letöltés.
 */
export async function nyersSzoveg(
  be: string,
  fajta: "html" | "css",
  opciok?: { idokorlatMs?: number; maxBajt?: number },
): Promise<{ vegsoCim: string; szoveg: string }> {
  const url = cimNormalizal(be);
  await nyilvanosCim(url);
  const l = await lekerKovetve(url, {
    accept: fajta === "css" ? "text/css,*/*;q=0.1" : "text/html,application/xhtml+xml",
    idokorlatMs: opciok?.idokorlatMs ?? 8000,
    maxBajt: opciok?.maxBajt ?? (fajta === "css" ? 800_000 : 1_500_000),
    maxAtiranyitas: 3,
    engedettTipus: fajta === "css" ? /text\/css|text\/plain|application\/octet-stream/i : /text\/html|application\/xhtml\+xml/i,
  });
  return { vegsoCim: l.url.toString(), szoveg: l.teljes };
}

/** R-16 K7: a képek, amelyeket a bájt-letöltő alapból elfogad (a logó a honlapról: PNG, JPEG, WebP, SVG). */
export const KEP_TIPUSOK = /^\s*image\/(png|jpeg|webp|svg\+xml)\s*(;|$)/i;

/**
 * R-16 K7 (TERV §2-K7, gepezet 10; TERV §5: a letöltő eddig csak szöveget adott): egy fájl NYERS BÁJTJAI — a honlapon talált logó.
 * Ugyanaz a védelem, mint a `nyersSzoveg`-é: csak http(s), nyilvános cím az indulásnál ÉS minden átirányítás után (kézi követés),
 * időkorlát a teljes letöltésre, méretkorlát beolvasás közben (alap 2 MB — a képre kerülő logó korlátja, fajl-core KEP_LOGO_MAX_BAJT),
 * és csak az engedett tartalomtípus (alap: PNG, JPEG, WebP, SVG; minden más — pl. text/html — FORRAS_ROSSZ_TIPUS).
 * A típust a hívó a bájtok fejéből is ellenőrzi (a fejléc csak az első szűrő, a kiszolgáló hazudhat).
 */
export async function nyersBajtok(
  be: string,
  opciok?: { maxBajt?: number; engedettTipus?: RegExp; idokorlatMs?: number },
): Promise<{ vegsoCim: string; tipus: string; bajtok: Uint8Array }> {
  const url = cimNormalizal(be);
  await nyilvanosCim(url);
  const l = await lekerKovetveAltal(
    url,
    {
      accept: "image/png,image/jpeg,image/webp,image/svg+xml;q=0.9",
      idokorlatMs: opciok?.idokorlatMs ?? 8000,
      maxBajt: opciok?.maxBajt ?? 2_000_000,
      maxAtiranyitas: 3,
      engedettTipus: opciok?.engedettTipus ?? KEP_TIPUSOK,
      rosszTipus: "FORRAS_ROSSZ_TIPUS",
    },
    torzsBajtok,
  );
  return { vegsoCim: l.url.toString(), tipus: l.contentType, bajtok: l.teljes };
}

type Cikk = { cim: string; url: string; megjelenes: string | null; szoveg: string; nyelv: string | null };

const OLVASO_FEJLEC = { "user-agent": "KommunikaciosMunkater/0.1 (+forrasfeldolgozas)" };

type Lekert<T = string> = { url: URL; contentType: string; teljes: T };
type LekeresOpciok = { accept: string; idokorlatMs: number; maxBajt: number; maxAtiranyitas: number; engedettTipus?: RegExp; rosszTipus?: LetoltesHibaKod };

/** A szöveges lekérés (a régi alak, változatlan viselkedéssel). */
function lekerKovetve(kezdo: URL, o: LekeresOpciok): Promise<Lekert> {
  return lekerKovetveAltal(kezdo, o, (t, m) => torzsOlvas(t, m));
}

/**
 * Lekérés átirányítás-követéssel. Az átirányítást KÉZZEL követjük: minden ugrás után újra
 * ellenőrizni kell, hogy a cél nyilvános-e. A `redirect: "follow"` ezt nem teszi meg, így egy
 * nyilvános cím belső hálózati címre irányíthatna át (SSRF).
 * R-16 K7: a törzs olvasója paraméter (szöveg vagy bájt) — a védelem egy helyen marad, mindkettőre ugyanaz.
 */
async function lekerKovetveAltal<T>(
  kezdo: URL,
  o: LekeresOpciok,
  olvas: (torzs: ReadableStream<Uint8Array>, maxBajt: number) => Promise<T>,
): Promise<Lekert<T>> {
  let url = kezdo;
  for (let ugras = 0; ugras <= o.maxAtiranyitas; ugras++) {
    // Az időkorlát a TELJES lekérésre szól — a fejlécre ÉS a törzsre. Biztonsági felülvizsgálat
    // 2026-09-10 (B-02): korábban a fejléc megérkezésekor törlődött, ezért egy lassan csepegtető
    // vagy soha véget nem érő forrás korlátlanul lekötötte a munkafolyamatot.
    const vezerlo = new AbortController();
    const idozito = setTimeout(() => vezerlo.abort(), o.idokorlatMs);
    let valasz: Response;
    try {
      valasz = await fetch(url, {
        redirect: "manual",
        signal: vezerlo.signal,
        headers: { ...OLVASO_FEJLEC, accept: o.accept },
      });
    } catch {
      clearTimeout(idozito);
      throw new LetoltesHiba("FORRAS_NEM_ELERHETO");
    }

    if (valasz.status >= 300 && valasz.status < 400) {
      clearTimeout(idozito);
      const hova = valasz.headers.get("location");
      if (!hova || ugras >= o.maxAtiranyitas) throw new LetoltesHiba("FORRAS_NEM_ELERHETO");
      try {
        url = new URL(hova, url);
      } catch {
        throw new LetoltesHiba("FORRAS_ROSSZ_CIM");
      }
      await nyilvanosCim(url); // MINDEN ugrás után újra
      continue;
    }

    // 401/403/429: az oldal él, de nem enged be — ez más hiba, mint a „nem érhető el”
    try {
      if (valasz.status === 401 || valasz.status === 403 || valasz.status === 429) {
        throw new LetoltesHiba("FORRAS_TILTVA");
      }
      if (!valasz.ok) throw new LetoltesHiba("FORRAS_NEM_ELERHETO");

      const contentType = valasz.headers.get("content-type") ?? "";
      if (o.engedettTipus && !o.engedettTipus.test(contentType)) {
        throw new LetoltesHiba(o.rosszTipus ?? "FORRAS_NEM_SZOVEG");
      }
      if (!valasz.body) throw new LetoltesHiba("FORRAS_NEM_ELERHETO");

      let teljes: T;
      try {
        teljes = await olvas(valasz.body, o.maxBajt);
      } catch (hiba) {
        if (hiba instanceof LetoltesHiba) throw hiba;
        throw new LetoltesHiba("FORRAS_NEM_ELERHETO"); // megszakítás (időtúllépés) is ide fut
      }
      return { url, contentType, teljes };
    } finally {
      clearTimeout(idozito); // CSAK a törzs beolvasása után
    }
  }
  throw new LetoltesHiba("FORRAS_NEM_ELERHETO");
}

/** Hírfolyam-e a letöltött tartalom (fejléc vagy a dokumentum eleje alapján). */
function hirfolyamE(contentType: string, teljes: string): boolean {
  if (/application\/rss\+xml|application\/atom\+xml|application\/rdf\+xml/i.test(contentType)) return true;
  const eleje = teljes.trimStart().slice(0, 400);
  return /<rss\b/i.test(eleje) || /<feed\b/i.test(eleje) || /<rdf:RDF\b/i.test(eleje);
}

/** A megszokott hírfolyam-utak, ha a lap nem hirdeti magát. */
const HIRFOLYAM_UTAK = ["/feed/", "/rss/", "/rss.xml", "/feed.xml", "/atom.xml", "/index.xml", "/?feed=rss2"];

/**
 * Hírfolyam-jelöltek a lapból: előbb amit a lap maga hirdet (`<link rel="alternate">`), utána a
 * megszokott utak. Legfeljebb 6 jelölt, ismétlés és a kiindulási cím nélkül.
 */
function hirfolyamJeloltek(html: string, alap: URL): string[] {
  const nyers: string[] = [];
  const fej = html.slice(0, 200_000);
  const linkMinta = /<link\b[^>]*>/gi;
  let egyezes: RegExpExecArray | null;
  while ((egyezes = linkMinta.exec(fej)) !== null) {
    const cimke = egyezes[0];
    if (!/rel\s*=\s*["']?[^"'>]*alternate/i.test(cimke)) continue;
    if (!/type\s*=\s*["']?application\/(rss|atom|rdf)\+xml/i.test(cimke)) continue;
    const hrefEgy = cimke.match(/href\s*=\s*"([^"]*)"/i) ?? cimke.match(/href\s*=\s*'([^']*)'/i) ?? cimke.match(/href\s*=\s*([^\s>]+)/i);
    const ertek = hrefEgy?.[1]?.trim();
    if (!ertek) continue;
    try {
      nyers.push(new URL(entitasFelold(ertek), alap).toString());
    } catch {
      continue; // hibás href: kihagyjuk
    }
  }
  for (const ut of HIRFOLYAM_UTAK) {
    try {
      nyers.push(new URL(ut, alap.origin).toString());
    } catch {
      continue;
    }
  }
  const latott = new Set<string>([alap.toString()]);
  const ki: string[] = [];
  for (const c of nyers) {
    if (latott.has(c)) continue;
    latott.add(c);
    ki.push(c);
    if (ki.length >= 6) break;
  }
  return ki;
}

/** A lap hírfolyamának megkeresése. Az első olyan jelölt nyer, amelyik valóban hírfolyam és van benne cikk. */
async function hirfolyamKeres(alap: URL, html: string): Promise<{ url: URL; cikkek: Cikk[] } | null> {
  for (const jelolt of hirfolyamJeloltek(html, alap)) {
    let url: URL;
    try {
      url = new URL(jelolt);
    } catch {
      continue;
    }
    try {
      await nyilvanosCim(url);
      await robotsEllenoriz(url);
      const l = await lekerKovetve(url, {
        accept: "application/rss+xml,application/atom+xml,text/xml,application/xml",
        idokorlatMs: 6000,
        maxBajt: 3_000_000,
        maxAtiranyitas: 2,
      });
      if (!hirfolyamE(l.contentType, l.teljes)) continue;
      const cikkek = rssElemzo(l.teljes, l.url.toString());
      if (cikkek.length === 0) continue;
      return { url: l.url, cikkek };
    } catch {
      continue; // ez a jelölt nem jött be, jöhet a következő
    }
  }
  return null;
}

/**
 * A hírfigyelő letöltője: robots.txt-ellenőrzés + weboldal/RSS-letöltés.
 *
 * A felhasználótól NEM várunk el technikai tudást: ha csak a lap címét adta meg („zi-de-zi.ro”),
 * a letöltő követi az átirányítást, és ha a lap nem hírfolyam, MEGKERESI a hírfolyamát. A megtalált
 * címet `felfedezettCim`-ben adja vissza, hogy a hívó eltehesse — a következő futás már azt kéri le.
 */
export async function letoltoHiv(forras: { cim: string; tipus: "rss" | "weboldal" | null }): Promise<
  { ok: true; tipus: "rss" | "weboldal"; szovegOlvashato: boolean; cikkek: Cikk[]; felfedezettCim?: string }
  | { ok: false; hibaOk: string }
> {
  try {
    const kezdo = cimNormalizal(forras.cim);
    await nyilvanosCim(kezdo);
    await robotsEllenoriz(kezdo);

    const l = await lekerKovetve(kezdo, {
      accept: "application/rss+xml,application/atom+xml,text/xml,text/html,application/xhtml+xml",
      idokorlatMs: 10_000,
      maxBajt: 5_000_000,
      maxAtiranyitas: 3,
    });
    const vegso = l.url.toString();
    const atiranyitva = vegso === kezdo.toString() ? undefined : vegso;

    if (forras.tipus === "rss" || hirfolyamE(l.contentType, l.teljes)) {
      const cikkek = rssElemzo(l.teljes, vegso);
      return {
        ok: true,
        tipus: "rss",
        szovegOlvashato: cikkek.some((c) => c.szoveg.length > 200),
        cikkek,
        ...(atiranyitva ? { felfedezettCim: atiranyitva } : {}),
      };
    }

    // A lap nem hírfolyam. Ha még nem dőlt el, hogy weboldalként figyeljük, előbb megkeressük a
    // hírfolyamát: a hírfolyam több cikket ad és kevesebbet terhel, de a felhasználónak nem kell tudnia róla.
    if (forras.tipus === null) {
      const talalt = await hirfolyamKeres(l.url, l.teljes);
      if (talalt) {
        return {
          ok: true,
          tipus: "rss",
          szovegOlvashato: talalt.cikkek.some((c) => c.szoveg.length > 200),
          cikkek: talalt.cikkek,
          felfedezettCim: talalt.url.toString(),
        };
      }
    }

    // nincs hírfolyam: a lapot magát figyeljük — EGY cikk a lap címével és szövegével
    const kinyert = szovegKinyer(l.teljes);
    const cikk: Cikk = { cim: kinyert.cim, url: vegso, megjelenes: null, szoveg: kinyert.szoveg, nyelv: null };
    return {
      ok: true,
      tipus: "weboldal",
      szovegOlvashato: kinyert.szoveg.length > 200,
      cikkek: [cikk],
      ...(atiranyitva ? { felfedezettCim: atiranyitva } : {}),
    };
  } catch (hiba) {
    if (hiba instanceof LetoltesHiba) {
      return { ok: false, hibaOk: hiba.kod };
    }
    return { ok: false, hibaOk: "FORRAS_NEM_ELERHETO" };
  }
}
