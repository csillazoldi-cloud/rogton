// Márkaszín-kinyerés HTML-ből és CSS-ekből. Tiszta függvények, nincs I/O.
// Node 24, TS strict, exactOptionalPropertyTypes, ESM.

export type Szin = `#${string}`; // mindig kisbetűs #rrggbb

export type HonlapSzinek = {
  fo: Szin | null;
  masodik: Szin | null;
  hatter: Szin | null;
  logo: string | null;
  jeloltek: { szin: Szin; suly: number }[];
};

// ---------- segédek ----------

const NAGY_HEX = /^[0-9a-fA-F]{6}$/;

function hexKisit(s: string): Szin | null {
  if (!NAGY_HEX.test(s)) return null;
  return ("#" + s.toLowerCase()) as Szin;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

// #rrggbb -> [r,g,b]
function hexRgb(hex: Szin): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbHex(r: number, g: number, b: number): Szin {
  const f = (n: number) => {
    const v = Math.max(0, Math.min(255, Math.round(n)));
    return v.toString(16).padStart(2, "0");
  };
  return ("#" + f(r) + f(g) + f(b)) as Szin;
}

function rgbTav(a: Szin, b: Szin): number {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// HSL (h 0..360, s 0..1, l 0..1) -> hex
function hslHex(h: number, s: number, l: number): Szin {
  h = ((h % 360) + 360) % 360;
  s = clamp01(s);
  l = clamp01(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = l - c / 2;
  return rgbHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// hex -> HSL (s,l 0..1)
function hexHsl(hex: Szin): { h: number; s: number; l: number } {
  const [r0, g0, b0] = hexRgb(hex);
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

// ---------- szinNormalizal ----------

const NEVES: Record<string, Szin> = {
  white: "#ffffff",
  black: "#000000",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
};

// "255, 0, 0" vagy "255 0 0" -> [255,0,0]
function szamok(s: string): number[] {
  const out: number[] = [];
  const re = /-?\d*\.?\d+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push(parseFloat(m[0]));
    if (out.length > 8) break;
  }
  return out;
}

// alfa érték: "0.5", "50%", "1" -> 0..1
function alfaErtek(tok: string | undefined): number {
  if (tok === undefined) return 1;
  const t = tok.trim();
  if (t.endsWith("%")) {
    const v = parseFloat(t.slice(0, -1));
    return isNaN(v) ? 1 : clamp01(v / 100);
  }
  const v = parseFloat(t);
  return isNaN(v) ? 1 : clamp01(v);
}

export function szinNormalizal(nyers: string): Szin | null {
  if (typeof nyers !== "string") return null;
  const s = nyers.trim().toLowerCase();
  if (s.length === 0) return null;

  // névvel adott
  if (Object.prototype.hasOwnProperty.call(NEVES, s)) return NEVES[s]!;

  // #rgb / #rrggbb / #rrggbbaa
  if (s.startsWith("#")) {
    const h = s.slice(1);
    if (/^[0-9a-f]{3}$/.test(h)) {
      const r = h[0]!, g = h[1]!, b = h[2]!;
      return ("#" + r + r + g + g + b + b) as Szin;
    }
    if (/^[0-9a-f]{6}$/.test(h)) return ("#" + h) as Szin;
    if (/^[0-9a-f]{8}$/.test(h)) {
      const a = parseInt(h.slice(6, 8), 16) / 255;
      if (a < 0.5) return null;
      return ("#" + h.slice(0, 6)) as Szin;
    }
    return null;
  }

  // rgb() / rgba()
  const rgbM = /^rgba?\(([^)]*)\)$/.exec(s);
  if (rgbM) {
    const belul = rgbM[1]!;
    // szóközös modern forma: "rgb(255 0 0 / 0.5)"
    const perJel = belul.split("/");
    const szinResz = perJel[0]!;
    const alfaTok = perJel.length > 1 ? perJel[1] : undefined;
    const nums = szamok(szinResz);
    if (nums.length < 3) return null;
    let a = 1;
    if (alfaTok !== undefined) a = alfaErtek(alfaTok);
    else if (nums.length >= 4) a = nums[3]!;
    if (a < 0.5) return null;
    const r = nums[0]!, g = nums[1]!, b = nums[2]!;
    // százalékos forma: "100% 0% 0%"
    const szazalek = szinResz.includes("%");
    const skala = szazalek ? 2.55 : 1;
    return rgbHex(r * skala, g * skala, b * skala);
  }

  // hsl() / hsla()
  const hslM = /^hsla?\(([^)]*)\)$/.exec(s);
  if (hslM) {
    const belul = hslM[1]!;
    const perJel = belul.split("/");
    const szinResz = perJel[0]!;
    const alfaTok = perJel.length > 1 ? perJel[1] : undefined;
    const nums = szamok(szinResz);
    if (nums.length < 3) return null;
    let a = 1;
    if (alfaTok !== undefined) a = alfaErtek(alfaTok);
    else if (nums.length >= 4) a = nums[3]!;
    if (a < 0.5) return null;
    const h = nums[0]!;
    const sPct = szinResz.includes("%");
    const s = sPct ? nums[1]! / 100 : nums[1]!;
    const l = sPct ? nums[2]! / 100 : nums[2]!;
    return hslHex(h, s, l);
  }

  return null;
}

// ---------- cssCimek ----------

// <link rel="stylesheet" href="..."> abszolút címei, max 6, sorrendben.
export function cssCimek(html: string, alap: string): string[] {
  if (typeof html !== "string" || html.length === 0) return [];
  const out: string[] = [];
  const linkRe = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const tag = m[0]!;
    const rel = /rel\s*=\s*["']?([^"'>\s]+)/i.exec(tag);
    if (!rel) continue;
    if (rel[1]!.toLowerCase() !== "stylesheet") continue;
    const href = /href\s*=\s*["']([^"']*)["']/i.exec(tag);
    if (!href) continue;
    const nyers = href[1]!.trim();
    if (nyers.length === 0) continue;
    if (nyers.startsWith("data:")) continue;
    let abszolut: string | null = null;
    try {
      abszolut = new URL(nyers, alap).toString();
    } catch {
      abszolut = null;
    }
    if (abszolut === null) continue;
    out.push(abszolut);
    if (out.length >= 6) break;
  }
  return out;
}

// ---------- súlyozás ----------

type Jelolt = { szin: Szin; suly: number };

function hozzaad(map: Map<Szin, number>, szin: Szin | null, suly: number): void {
  if (szin === null) return;
  map.set(szin, (map.get(szin) ?? 0) + suly);
}

// meta tagek
function metaSulyok(html: string, map: Map<Szin, number>): void {
  const re = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0]!;
    const nameM = /name\s*=\s*["']([^"']*)["']/i.exec(tag);
    if (!nameM) continue;
    const nev = nameM[1]!.toLowerCase();
    let suly = 0;
    if (nev === "theme-color") suly = 8;
    else if (nev === "msapplication-tilecolor") suly = 5;
    else continue;
    const contentM = /content\s*=\s*["']([^"']*)["']/i.exec(tag);
    if (!contentM) continue;
    hozzaad(map, szinNormalizal(contentM[1]!), suly);
  }
}

// egyéni tulajdonságok: --nev: ertek
function egyeniTulajdonsagok(css: string, map: Map<Szin, number>): void {
  const re = /--([a-zA-Z0-9_-]+)\s*:\s*([^;{}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const nev = m[1]!.toLowerCase();
    const ertek = m[2]!.trim();
    const szin = szinNormalizal(ertek);
    if (szin === null) continue;
    const kulcs = /primary|brand|accent|main|theme|secondary|color-1|szin/.test(nev);
    hozzaad(map, szin, kulcs ? 5 : 1);
  }
}

// background / background-color szabályok
function hatterSzabalyok(css: string, map: Map<Szin, number>): void {
  // egyszerű blokk-szintű feldolgozás: "szelektor { ... }"
  const blokkRe = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blokkRe.exec(css)) !== null) {
    const szelektor = m[1]!.toLowerCase();
    const test = m[2]!;
    const fontos = /header|nav|btn|button|\.cta|hero|footer|navbar|menu/.test(szelektor);
    // background-color és background
    const bgRe = /(?:^|[;{\s])background(?:-color)?\s*:\s*([^;}]+)/gi;
    let bm: RegExpExecArray | null;
    while ((bm = bgRe.exec(test)) !== null) {
      const ertek = bm[1]!.trim();
      // gradient esetén az első színt vesszük
      const szin = szinNormalizal(ertek) ?? elsoSzinGradientbol(ertek);
      hozzaad(map, szin, fontos ? 3 : 1);
    }
  }
}

function elsoSzinGradientbol(ertek: string): Szin | null {
  const re = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ertek)) !== null) {
    const s = szinNormalizal(m[1]!);
    if (s !== null) return s;
  }
  return null;
}

// color: szabályok
function szovegSzinek(css: string, map: Map<Szin, number>): void {
  const blokkRe = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blokkRe.exec(css)) !== null) {
    const szelektor = m[1]!.trim().toLowerCase();
    const test = m[2]!;
    const fontos = /(^|[\s,>+~])(a|a:hover|h1|h2|\.btn)([\s,{:]|$)/.test(szelektor);
    const colorRe = /(?:^|[;{\s])color\s*:\s*([^;}]+)/gi;
    let cm: RegExpExecArray | null;
    while ((cm = colorRe.exec(test)) !== null) {
      const szin = szinNormalizal(cm[1]!.trim());
      hozzaad(map, szin, fontos ? 2 : 0.5);
    }
  }
}

// HTML style="" attribútumok és <style> blokkok
function htmlStilusok(html: string, map: Map<Szin, number>): void {
  // <style> blokkok
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(html)) !== null) {
    const css = m[1]!;
    egyeniTulajdonsagok(css, map);
    hatterSzabalyok(css, map);
    szovegSzinek(css, map);
  }
  // style="..." attribútumok
  const attrRe = /style\s*=\s*["']([^"']*)["']/gi;
  while ((m = attrRe.exec(html)) !== null) {
    const css = m[1]!;
    // background
    const bgRe = /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/gi;
    let bm: RegExpExecArray | null;
    while ((bm = bgRe.exec(css)) !== null) {
      hozzaad(map, szinNormalizal(bm[1]!.trim()) ?? elsoSzinGradientbol(bm[1]!), 1);
    }
    const colorRe = /(?:^|;)\s*color\s*:\s*([^;]+)/gi;
    let cm: RegExpExecArray | null;
    while ((cm = colorRe.exec(css)) !== null) {
      hozzaad(map, szinNormalizal(cm[1]!.trim()), 0.5);
    }
  }
}

// SVG fill="#..."
function svgFillek(html: string, map: Map<Szin, number>): void {
  const re = /fill\s*=\s*["']([^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    hozzaad(map, szinNormalizal(m[1]!.trim()), 1);
  }
}

// ---------- jelölt-szűrés és összevonás ----------

const KERETRENDSZER = new Set<string>([
  "#007bff", "#0d6efd", "#0062cc", "#0056b3", "#28a745", "#198754", "#dc3545", "#ffc107", "#17a2b8", "#0dcaf0", "#6f42c1", "#e83e8c", "#fd7e14", "#20c997",
  "#3b82f6", "#2563eb", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6", "#ec4899", "#0073aa", "#2271b1", "#135e96",
]);

function nemMarkaszín(szin: Szin): boolean {
  const { s, l } = hexHsl(szin);
  if (s < 0.18) return true;
  if (l > 0.92) return true;
  if (l < 0.08) return true;
  return false;
}

function osszevon(jeloltek: Jelolt[]): Jelolt[] {
  // súly szerint csökkenő
  const rendezett = [...jeloltek].sort((a, b) => b.suly - a.suly);
  const out: Jelolt[] = [];
  for (const j of rendezett) {
    let beolvadt = false;
    for (const o of out) {
      if (rgbTav(o.szin, j.szin) < 40) {
        o.suly += j.suly;
        beolvadt = true;
        break;
      }
    }
    if (!beolvadt) out.push({ szin: j.szin, suly: j.suly });
  }
  out.sort((a, b) => b.suly - a.suly);
  return out;
}

// ---------- háttér ----------

function hatterKereses(css: string): { szin: Szin; suly: number } | null {
  let legjobb: { szin: Szin; suly: number } | null = null;
  const blokkRe = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blokkRe.exec(css)) !== null) {
    const szelektor = m[1]!.trim().toLowerCase();
    if (!/(^|[\s,>+~])(body|html|main|:root)([\s,{:]|$)/.test(szelektor)) continue;
    const test = m[2]!;
    const bgRe = /(?:^|[;{\s])background(?:-color)?\s*:\s*([^;}]+)/gi;
    let bm: RegExpExecArray | null;
    while ((bm = bgRe.exec(test)) !== null) {
      const szin = szinNormalizal(bm[1]!.trim()) ?? elsoSzinGradientbol(bm[1]!);
      if (szin === null) continue;
      const { l } = hexHsl(szin);
      if (l <= 0.85) continue;
      const suly = 1;
      if (legjobb === null || suly > legjobb.suly) legjobb = { szin, suly };
    }
  }
  return legjobb;
}

// ---------- logó ----------

function attr(tag: string, nev: string): string | null {
  // szóköz vagy a tag eleje előtt — így a data-alt / data-id nem számít
  const m = new RegExp(`\\s${nev}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag);
  return m ? m[1]!.trim() : null;
}

function logoSrc(html: string, alap: string): string | null {
  const abszolut = (h: string): string | null => {
    if (!h || h.startsWith("data:")) return null;
    try { return new URL(h, alap).toString(); } catch { return null; }
  };
  // 1) az első <img>, amelynek src, alt, class vagy id attribútumában ott a „logo”
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = attr(tag, "src") ?? "";
    const egyutt = [src, attr(tag, "alt"), attr(tag, "class"), attr(tag, "id")].join(" ").toLowerCase();
    if (!egyutt.includes("logo")) continue;
    // közösségi ikon nem a cég logója (mérve: new.transportlocal.ro → facebook-blue.png)
    if (/facebook|instagram|twitter|youtube|tiktok|linkedin|whatsapp|google|apple|android|visa|mastercard|paypal/.test(egyutt)) continue;
    const u = abszolut(src);
    if (u) return u;
  }
  // 2) apple-touch-icon, 3) icon (svg, aztán png előnyben)
  const ikonok: { href: string; pont: number }[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = (attr(tag, "rel") ?? "").toLowerCase().split(/\s+/);
    const href = attr(tag, "href") ?? "";
    if (!href || href.startsWith("data:")) continue;
    const tipus = `${attr(tag, "type") ?? ""} ${href}`.toLowerCase();
    if (rel.includes("apple-touch-icon") || rel.includes("apple-touch-icon-precomposed")) ikonok.push({ href, pont: 10 });
    else if (rel.includes("icon")) ikonok.push({ href, pont: tipus.includes("svg") ? 2 : tipus.includes("png") ? 1 : 0 });
  }
  ikonok.sort((x, y) => y.pont - x.pont);
  for (const i of ikonok) {
    const u = abszolut(i.href);
    if (u) return u;
  }
  return null;
}

// ---------- fő belépő ----------

export function honlapSzinek(html: string, cssek: string[], alap: string): HonlapSzinek {
  const ures: HonlapSzinek = { fo: null, masodik: null, hatter: null, logo: null, jeloltek: [] };
  if (typeof html !== "string") return ures;
  const cssLista = Array.isArray(cssek) ? cssek.filter((c) => typeof c === "string") : [];

  const map = new Map<Szin, number>();

  // HTML források
  metaSulyok(html, map);
  htmlStilusok(html, map);
  svgFillek(html, map);

  // CSS források
  for (const css of cssLista) {
    egyeniTulajdonsagok(css, map);
    hatterSzabalyok(css, map);
    szovegSzinek(css, map);
  }

  // jelöltek összeállítása (nem-márkaszínek kiesnek)
  const jeloltek: Jelolt[] = [];
  for (const [szin, suly] of map) {
    if (nemMarkaszín(szin)) continue;
    // a Bootstrap/Tailwind alapszínei a keretrendszeré, nem a cégé — tizedsúllyal számítanak (mérve: maszol.ro #007bff)
    jeloltek.push({ szin, suly: KERETRENDSZER.has(szin) ? suly / 10 : suly });
  }

  const osszevont = osszevon(jeloltek);

  // fo / masodik
  let fo: Szin | null = null;
  let masodik: Szin | null = null;
  if (osszevont.length > 0) {
    fo = osszevont[0]!.szin;
    for (let i = 1; i < osszevont.length; i++) {
      const j = osszevont[i]!;
      if (rgbTav(fo, j.szin) >= 80) {
        masodik = j.szin;
        break;
      }
    }
  }

  // hatter
  let hatter: Szin | null = null;
  for (const css of cssLista) {
    const h = hatterKereses(css);
    if (h !== null) {
      hatter = h.szin;
      break;
    }
  }
  if (hatter === null) {
    // HTML <style> blokkokból is
    const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m: RegExpExecArray | null;
    while ((m = styleRe.exec(html)) !== null) {
      const h = hatterKereses(m[1]!);
      if (h !== null) {
        hatter = h.szin;
        break;
      }
    }
  }

  // logo
  const logo = logoSrc(html, alap);

  // jeloltek max 8
  const vegsoJeloltek = osszevont.slice(0, 8).map((j) => ({ szin: j.szin, suly: j.suly }));

  return { fo, masodik, hatter, logo, jeloltek: vegsoJeloltek };
}
