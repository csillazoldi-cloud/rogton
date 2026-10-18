// R-10 forrás-ajánló (2026-09-16): ellenőrzött oldallista nyelv és térség szerint.
// A cím az RSS-csatorna címe — a rendszer az első letöltéskor ellenőrzi.
// J-1 (2026-09-25, a NAS-ról mérve): 7 cím javítva a lap saját RSS-hivatkozására; a vasarhely.ro helyett a vasarhely.ma, a transtelex.hu helyett a
// transtelex.ro (a teszt adatbázisában ezek már használhatók); kivéve, mert a NAS-ról nem olvasható:
// e-nepujsag.ro (/rss és /feed 404), erdon.ro (cikkre irányít), agerpres.ro (idegen proxyra irányít).
// A `terseg` kulcsszavak a bemutatkozás szövegében keresendők (kisbetűs, ékezet nélkül is).
// Az `altalanos: true` sorok mindig ajánlhatók a nyelvhez.
// (A mellékelt forras-lista.json tartalma változatlanul, TS-formában — a tsconfig nem tartalmaz resolveJsonModule-t.)

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

// J-1g (Vilmos döntése 2026-09-25: „1” — szakmai oldalak a listára). A NAS-ról mérve 2026-09-25, mind érvényes hírfolyam.
const EPITOIPAR = ["epitoipar", "epites", "epito", "kivitelez", "terko", "terkov", "burkol", "beton", "aszfalt", "tetofed", "felujit", "udvar", "jarda", "kozmu", "szigetel", "gepesz", "villanyszerel", "ablak", "nyilaszaro", "construct", "amenajar", "pavaj", "pavele", "renovar", "acoperis", "izolati"];
const INGATLAN = ["ingatlan", "lakasep", "lakopark", "imobiliar", "dezvoltator"];
const KERT_AGRAR = ["kertep", "kertesz", "kerti", "mezogazd", "agrar", "gazdalkod", "noveny", "gradinar", "peisag", "agricol", "fermier"];
const EPITESZET = ["epitesz", "lakberendez", "belsoep", "arhitect", "design interior"];

export const FORRAS_LISTA: readonly ForrasListaSor[] = [
  { cim: "https://maszol.ro/rss/", nev: "maszol.ro", nyelv: "hu", terseg: ["erdely", "marosvasarhely", "targu mures", "maros", "kolozsvar", "cluj", "szekelyfold"], altalanos: true, leiras: { hu: "erdélyi magyar hírek · gazdaság, helyi ügyek", ro: "știri maghiare din Ardeal · economie, teme locale", en: "Hungarian news from Transylvania · economy, local matters" } },
  { cim: "https://szekelyhon.ro/rss/szekelyhon_hirek.xml", nev: "szekelyhon.ro", nyelv: "hu", terseg: ["szekelyfold", "hargita", "harghita", "kovaszna", "covasna", "csikszereda", "sepsiszentgyorgy", "szekelyudvarhely", "marosvasarhely", "maros"], altalanos: true, leiras: { hu: "Székelyföld és Maros megye napi hírei", ro: "știrile zilnice ale Ținutului Secuiesc și județului Mureș", en: "daily news of Szeklerland and Mureș county" } },
  { cim: "https://kronika.ro/rss/kronika_hirek.xml", nev: "kronikaonline.ro", nyelv: "hu", terseg: ["erdely", "kolozsvar", "cluj"], altalanos: true, leiras: { hu: "erdélyi magyar napilap · közélet, gazdaság", ro: "cotidian maghiar din Ardeal · viață publică, economie", en: "Transylvanian Hungarian daily · public life, economy" } },
  { cim: "https://transtelex.ro/rss", nev: "transtelex.ro", nyelv: "hu", terseg: ["erdely", "kolozsvar", "cluj"], altalanos: true, leiras: { hu: "erdélyi magyar hírportál · elemzések, közélet", ro: "portal maghiar din Ardeal · analize, viață publică", en: "Transylvanian Hungarian news portal · analysis, public life" } },
  { cim: "https://www.vasarhely.ma/feed/", nev: "vasarhely.ma", nyelv: "hu", terseg: ["marosvasarhely", "targu mures", "maros", "mures"], altalanos: false, leiras: { hu: "Marosvásárhely — helyi hírek, események", ro: "Târgu Mureș — știri și evenimente locale", en: "Târgu Mureș — local news and events" } },
  { cim: "https://marosvasarhelyiek.ro/feed", nev: "marosvasarhelyiek.ro", nyelv: "hu", terseg: ["marosvasarhely", "targu mures", "maros", "mures"], altalanos: false, leiras: { hu: "Marosvásárhely — a városról, embereiről", ro: "Târgu Mureș — despre oraș și oamenii lui", en: "Târgu Mureș — the city and its people" } },
  { cim: "https://hargitanepe.ro/rss", nev: "hargitanepe.ro", nyelv: "hu", terseg: ["hargita", "harghita", "csikszereda", "miercurea ciuc", "szekelyudvarhely", "odorheiu", "gyergyo"], altalanos: false, leiras: { hu: "Hargita megye napilapja", ro: "cotidianul județului Harghita", en: "Harghita county's daily" } },
  { cim: "https://foter.ro/rss/foter.xml", nev: "foter.ro", nyelv: "hu", terseg: ["kolozsvar", "cluj"], altalanos: false, leiras: { hu: "Kolozsvár — helyi hírek", ro: "Cluj — știri locale", en: "Cluj — local news" } },
  { cim: "https://szabadsag.ro/rss.xml", nev: "szabadsag.ro", nyelv: "hu", terseg: ["kolozsvar", "cluj"], altalanos: false, leiras: { hu: "Szabadság — Kolozsvár magyar napilapja", ro: "Szabadság — cotidianul maghiar din Cluj", en: "Szabadság — Cluj's Hungarian daily" } },
  { cim: "https://feeds.feedburner.com/3szekHirek", nev: "3szek.ro", nyelv: "hu", terseg: ["haromszek", "kovaszna", "covasna", "sepsiszentgyorgy", "sfantu gheorghe"], altalanos: false, leiras: { hu: "Háromszék — Kovászna megye napilapja", ro: "Háromszék — cotidianul județului Covasna", en: "Háromszék — Covasna county's daily" } },
  { cim: "https://www.zi-de-zi.ro/feed/", nev: "zi-de-zi.ro", nyelv: "ro", terseg: ["marosvasarhely", "targu mures", "maros", "mures"], altalanos: false, leiras: { hu: "román, Maros megye — helyi hírek", ro: "știri locale din județul Mureș", en: "Romanian, Mureș county — local news" } },
  { cim: "https://www.punctul.ro/feed/", nev: "punctul.ro", nyelv: "ro", terseg: ["marosvasarhely", "targu mures", "maros", "mures"], altalanos: false, leiras: { hu: "román, Marosvásárhely — helyi ügyek", ro: "Târgu Mureș — teme locale", en: "Romanian, Târgu Mureș — local matters" } },
  { cim: "https://www.cuvantul-liber.ro/feed/", nev: "cuvantul-liber.ro", nyelv: "ro", terseg: ["marosvasarhely", "targu mures", "maros", "mures"], altalanos: false, leiras: { hu: "román, Maros megye — napilap", ro: "Cuvântul Liber — cotidianul județului Mureș", en: "Romanian, Mureș county daily" } },
  { cim: "https://www.stiridecluj.ro/rss.xml", nev: "stiridecluj.ro", nyelv: "ro", terseg: ["kolozsvar", "cluj"], altalanos: false, leiras: { hu: "román, Kolozsvár — helyi hírek", ro: "Cluj — știri locale", en: "Romanian, Cluj — local news" } },
  { cim: "https://www.hotnews.ro/rss", nev: "hotnews.ro", nyelv: "ro", terseg: [], altalanos: true, leiras: { hu: "román országos hírek · gazdaság, közélet", ro: "știri naționale · economie, viață publică", en: "Romanian national news · economy, public life" } },
  { cim: "https://www.digi24.ro/rss", nev: "digi24.ro", nyelv: "ro", terseg: [], altalanos: true, leiras: { hu: "román országos hírek", ro: "știri naționale", en: "Romanian national news" } },
  { cim: "https://www.economica.net/feed", nev: "economica.net", nyelv: "ro", terseg: [], altalanos: true, leiras: { hu: "román gazdasági hírek · vállalkozásoknak", ro: "știri economice · pentru firme", en: "Romanian business news" } },
  { cim: "https://www.startupcafe.ro/feed", nev: "startupcafe.ro", nyelv: "ro", terseg: [], altalanos: true, leiras: { hu: "román kisvállalkozói hírek, pályázatok", ro: "știri pentru IMM-uri, finanțări", en: "Romanian SME news and funding" } },
  { cim: "https://www.romania-insider.com/rss", nev: "romania-insider.com", nyelv: "en", terseg: [], altalanos: true, leiras: { hu: "angol nyelvű romániai hírek · üzlet", ro: "știri din România în engleză · business", en: "Romania news in English · business" } },
  { cim: "https://magyarepitok.hu/rss", nev: "magyarepitok.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: EPITOIPAR, leiras: { hu: "építőipari hírek · beruházások, kivitelezés, anyagárak", ro: "știri din construcții (maghiară) · investiții, execuție", en: "construction industry news (Hungarian) · projects, contracting" } },
  { cim: "https://epiteszforum.hu/rss", nev: "epiteszforum.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: [...EPITESZET, "epitoipar", "epites"], leiras: { hu: "építészet · épületek, tervezés, városépítés", ro: "arhitectură (maghiară) · clădiri, proiectare", en: "architecture (Hungarian) · buildings, design" } },
  { cim: "https://www.octogon.hu/feed", nev: "octogon.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: [...EPITESZET, "kertep", "burkol"], leiras: { hu: "építészet, lakberendezés, kertépítés", ro: "arhitectură, amenajări interioare, grădini (maghiară)", en: "architecture, interiors, garden design (Hungarian)" } },
  { cim: "https://www.portfolio.hu/rss/ingatlan.xml", nev: "portfolio.hu · ingatlan", nyelv: "hu", terseg: [], altalanos: false, szakma: [...INGATLAN, "epitoipar"], leiras: { hu: "ingatlanpiac · lakásépítés, árak, fejlesztések", ro: "piața imobiliară (maghiară) · prețuri, dezvoltări", en: "property market (Hungarian) · prices, developments" } },
  { cim: "https://www.agroinform.hu/rss.php", nev: "agroinform.hu", nyelv: "hu", terseg: [], altalanos: false, szakma: KERT_AGRAR, leiras: { hu: "mezőgazdaság és kertészet · piac, támogatások", ro: "agricultură și horticultură (maghiară)", en: "agriculture and horticulture (Hungarian)" } },
  { cim: "https://www.constructiv.ro/?feed=rss2", nev: "constructiv.ro", nyelv: "ro", terseg: [], altalanos: false, szakma: EPITOIPAR, leiras: { hu: "román építőipari hírek", ro: "știri din construcții", en: "Romanian construction news" } },
  { cim: "https://www.revistaconstructiilor.eu/index.php/feed/", nev: "revistaconstructiilor.eu", nyelv: "ro", terseg: [], altalanos: false, szakma: EPITOIPAR, leiras: { hu: "román építőipari szaklap · beruházások, anyagok", ro: "revista construcțiilor · investiții, materiale", en: "Romanian construction magazine · projects, materials" } },
  { cim: "https://www.spatiulconstruit.ro/rss.php", nev: "spatiulconstruit.ro", nyelv: "ro", terseg: [], altalanos: false, szakma: [...EPITOIPAR, ...EPITESZET, ...INGATLAN], leiras: { hu: "román építészet, építőipar, ingatlan", ro: "arhitectură, construcții, imobiliare", en: "Romanian architecture, construction, real estate" } },
] as const;

/**
 * J-1g2 (Vilmos döntése 2026-09-25: „2”): a szakmai oldal híreire NEM vonatkozik a helyfeltétel — a szakmai hír attól
 * érdekes, hogy a cég szakmájáról szól, nem attól, hogy a cég városában történt. Igaz, ha a cím a lista szakmai oldala.
 */
export function szakmaiForrasCim(cim: string): boolean {
  const n = (c: string) => c.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
  const c = n(cim);
  return FORRAS_LISTA.some((s) => "szakma" in s && Array.isArray((s as { szakma?: unknown }).szakma) && n(s.cim) === c);
}
