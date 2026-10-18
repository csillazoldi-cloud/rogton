// R-10 forrás-ajánló: ellenőrzött oldallista nyelv és térség szerint. A cím az RSS-csatorna címe — a rendszer az első letöltéskor ellenőrzi.
// G4 (Rögtön, 2026-10-18): a magyarországi piacra — országos magyar hírforrások (7) és a magyar szakmai oldalak (5). A korábbi erdélyi
// és romániai lista kikerült. Mind a 12 cím 2026-10-18-án mérve élő RSS 2.0 csatorna (friss tételekkel). Térségi (városi) forrás most
// nincs a listán: a `terseg` mező üres, a térség szerinti ajánlás így a szakmai és az általános oldalakra esik vissza.
// Az `altalanos: true` sorok mindig ajánlhatók a nyelvhez.
export type ForrasListaSor = {
  cim: string;
  nev: string;
  nyelv: string;
  terseg: readonly string[];
  altalanos: boolean;
  leiras: { hu: string; ro: string; en: string };
  /** J-1g: szakmai oldal — szó ELEJÉRE illesztett kulcsok a bemutatkozásban (ékezet nélkül, kisbetűvel). */
  szakma?: readonly string[];
};

// J-1g: szakmai oldalak a listára (szó ELEJÉRE illesztett kulcsok a bemutatkozásban).
const EPITOIPAR = ["epitoipar", "epites", "epito", "kivitelez", "terko", "terkov", "burkol", "beton", "aszfalt", "tetofed", "felujit", "udvar", "jarda", "kozmu", "szigetel", "gepesz", "villanyszerel", "ablak", "nyilaszaro", "construct", "amenajar", "pavaj", "pavele", "renovar", "acoperis", "izolati"];
const INGATLAN = ["ingatlan", "lakasep", "lakopark", "imobiliar", "dezvoltator"];
const KERT_AGRAR = ["kertep", "kertesz", "kerti", "mezogazd", "agrar", "gazdalkod", "noveny", "gradinar", "peisag", "agricol", "fermier"];
const EPITESZET = ["epitesz", "lakberendez", "belsoep", "arhitect", "design interior"];

export const FORRAS_LISTA: readonly ForrasListaSor[] = [
  { cim: "https://telex.hu/rss", nev: "telex.hu", nyelv: "hu", terseg: [], altalanos: true, leiras: { hu: "országos hírek · közélet, gazdaság", ro: "știri naționale din Ungaria · viață publică, economie", en: "Hungarian national news · public life, economy" } },
  { cim: "https://444.hu/feed", nev: "444.hu", nyelv: "hu", terseg: [], altalanos: true, leiras: { hu: "országos hírek, elemzések", ro: "știri naționale din Ungaria, analize", en: "Hungarian national news and analysis" } },
  { cim: "https://hvg.hu/rss", nev: "hvg.hu", nyelv: "hu", terseg: [], altalanos: true, leiras: { hu: "hetilap · közélet, gazdaság, vállalkozás", ro: "săptămânal maghiar · viață publică, economie", en: "Hungarian weekly · public life, economy, business" } },
  { cim: "https://index.hu/24ora/rss/", nev: "index.hu", nyelv: "hu", terseg: [], altalanos: true, leiras: { hu: "országos hírek percről percre", ro: "știri naționale din Ungaria, la minut", en: "Hungarian national news, minute by minute" } },
  { cim: "https://magyarnemzet.hu/feed", nev: "magyarnemzet.hu", nyelv: "hu", terseg: [], altalanos: true, leiras: { hu: "országos napilap · közélet, gazdaság", ro: "cotidian național maghiar · viață publică", en: "Hungarian national daily · public life" } },
  { cim: "https://www.portfolio.hu/rss/all.xml", nev: "portfolio.hu", nyelv: "hu", terseg: [], altalanos: true, leiras: { hu: "gazdasági hírek · piacok, vállalkozások", ro: "știri economice din Ungaria · piețe, firme", en: "Hungarian business news · markets, companies" } },
  { cim: "https://www.vg.hu/feed", nev: "vg.hu", nyelv: "hu", terseg: [], altalanos: true, leiras: { hu: "Világgazdaság · gazdaság, kkv-k, pályázatok", ro: "Világgazdaság · economie, IMM-uri (maghiară)", en: "Világgazdaság · economy, SMEs (Hungarian)" } },
  { cim: "https://magyarepitok.hu/rss", nev: "magyarepitok.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: EPITOIPAR, leiras: { hu: "építőipari hírek · beruházások, kivitelezés, anyagárak", ro: "știri din construcții (maghiară) · investiții, execuție", en: "construction industry news (Hungarian) · projects, contracting" } },
  { cim: "https://epiteszforum.hu/rss", nev: "epiteszforum.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: [...EPITESZET, "epitoipar", "epites"], leiras: { hu: "építészet · épületek, tervezés, városépítés", ro: "arhitectură (maghiară) · clădiri, proiectare", en: "architecture (Hungarian) · buildings, design" } },
  { cim: "https://www.octogon.hu/feed", nev: "octogon.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: [...EPITESZET, "kertep", "burkol"], leiras: { hu: "építészet, lakberendezés, kertépítés", ro: "arhitectură, amenajări interioare, grădini (maghiară)", en: "architecture, interiors, garden design (Hungarian)" } },
  { cim: "https://www.portfolio.hu/rss/ingatlan.xml", nev: "portfolio.hu · ingatlan", nyelv: "hu", terseg: [], altalanos: false, szakma: [...INGATLAN, "epitoipar"], leiras: { hu: "ingatlanpiac · lakásépítés, árak, fejlesztések", ro: "piața imobiliară (maghiară) · prețuri, dezvoltări", en: "property market (Hungarian) · prices, developments" } },
  { cim: "https://www.agroinform.hu/rss.php", nev: "agroinform.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: KERT_AGRAR, leiras: { hu: "mezőgazdaság és kertészet · piac, támogatások", ro: "agricultură și horticultură (maghiară)", en: "agriculture and horticulture (Hungarian)" } },
] as const;

/**
 * J-1g2: a szakmai oldal híreire NEM vonatkozik a helyfeltétel — a szakmai hír attól
 * érdekes, hogy a cég szakmájáról szól, nem attól, hogy a cég városában történt. Igaz, ha a cím a lista szakmai oldala.
 */
export function szakmaiForrasCim(cim: string): boolean {
  const n = (c: string) => c.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
  const c = n(cim);
  return FORRAS_LISTA.some((s) => "szakma" in s && Array.isArray((s as { szakma?: unknown }).szakma) && n(s.cim) === c);
}
