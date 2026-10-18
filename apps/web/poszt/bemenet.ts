import type {
  PosztFelulet as PosztFeluletTipus,
  PosztNyelv as PosztNyelvTipus,
  PosztSzoveg,
} from "@km/contracts";

// A Posztszöveg AI-hívásainak BEMENETE — tiszta függvények (adatbázis és AI nélkül próbálhatók:
// probak/poszt-bemenet.proba.ts). A gépezet (index.ts) ezekből rakja össze, amit a gép elé tesz.
// 2026-09-30 (Kati B6, Erika 09-24): a fordítás hű fordítás lett, az átírás műveletei leírást kapnak.

/** A platformok SAJÁT felső határa (A-7, ellenőrizve 2026-09-19 a platformok leírásából). */
export const KARAKTERHATAR: Record<PosztFeluletTipus, number> = { fb: 63_206, ig: 2_200, li: 3_000, blog: 2_500 };
/** R-17 C (kerdesek 6): a „Blog / honlap” cikk PUHA határa (a számláló csak tájékoztat, a másolást nem tiltja) és a cím felső határa. */
export const BLOG_HATAR = 2_500;
export const BLOG_CIM_MAX = 90;

/** Ennyi látszik a hírfolyamban, mielőtt a „Továbbiak" mögé kerül — ez a gyakorlatban fontosabb szám. */
export const LATHATO_HATAR: Record<PosztFeluletTipus, number> = { fb: 477, ig: 125, li: 210, blog: 600 };

/** Melyik gomb melyik promptot hívja. A „Fordítás erre a nyelvre” a HŰ fordítás (poszt_forditas);
 *  a „nyelvre szabás” (poszt_nyelvre_szabas) az, ami csiszolhat — a kettő nem keverhető. */
export const POSZT_PROMPTOK = {
  szoveg: "poszt_szoveg",
  atiras: "poszt_atiras",
  forditas: "poszt_forditas",
  nyelvre_szabas: "poszt_nyelvre_szabas",
} as const;

/**
 * Az átírás műveletei (a felület gombjai: app/api/poszt/[id]/atiras/route.ts MUVELETEK), mindegyik egy
 * mondatos leírással. 2026-09-30: a prompt eddig más neveket sorolt (roviddebben, mas_hangnem…), mint amit a
 * gombok küldenek (rovidebb, kozvetlenebb…) — a gép csak a puszta szót kapta. Erika (09-24): a „Rövidebben”
 * túl szakmai lett, a „Közvetlenebbül”-nél „az átlag emberek fele kommunikálunk”.
 */
export const ATIRAS_MUVELETEK: Record<string, string> = {
  rovidebb:
    "Rövidebben: ugyanaz a mondanivaló kevesebb szóval. A fölösleget hagyd el, ne sűríts szakszavakba; a szöveg ugyanolyan közérthető maradjon, mint volt, vagy legyen közérthetőbb.",
  hosszabb:
    "Hosszabban: bővebben, de csak abból, ami a szövegben már benne van — új tényt, számot, ígéretet nem találsz ki.",
  kozvetlenebb:
    "Közvetlenebbül: köznyelven, úgy, ahogy egy ember beszél egy másikkal. Hétköznapi szavak, rövid mondatok, a szakszót és a hivatali fordulatot cseréld hétköznapira (kivéve, ha a „Kiknek szól” szakmai közönséget ír), az olvasót úgy szólítsd meg, ahogy a profil írja.",
  targyilagosabb:
    "Tárgyilagosabban: kevesebb jelző és felkiáltás, több tény — de ugyanolyan közérthetően.",
  hashtag: "Hashtagek: a szöveg marad, a végére legfeljebb 3–5 odaillő hashtag kerül (a meglévőket nem duplázod).",
  // R-18 8. kör (Kati 10-13): a „Beleírom” a felhívás SZÁNDÉKÁT a poszt hangján írja a végére (nem szó szerint) — csak a zárás változik
  felhivas:
    "Felhívás: a szöveg többi része SZÓ SZERINT marad; csak az utolsó bekezdés lesz a cselekvésre hívás a megadott szándék szerint, a poszt hangján, a saját szavaiddal (ha már van felhívás a végén, azt cseréld; a záró hashtag-sor maradjon a végén).",
};

/** A művelet sora a bemenetben: ismert műveletnél a leírása, sajátnál (a munkatárs szavai) maga a kérés. */
export function muveletSor(muvelet: string): string {
  const leiras = ATIRAS_MUVELETEK[muvelet];
  return leiras ? `Kért művelet: ${muvelet} — ${leiras}` : `Kért művelet (a munkatárs saját kérése): ${muvelet}`;
}

function feluletSorok(felulet: PosztFeluletTipus): string[] {
  // R-17 C: a honlap-cikknek nincs hírfolyama és felső határa — a cél hossz és a cím szabálya megy a gép elé
  if (felulet === "blog") return [
    "Felület: blog (honlap-cikk)",
    `Cél hossz: kb. 1500–${BLOG_HATAR} karakter (puha határ); a cím legfeljebb ${BLOG_CIM_MAX} karakter; hashtag és emoji nincs.`,
    "Az első bekezdés a lényeg: a honlap cikklistája ezt mutatja.",
  ];
  return [
    `Felület: ${felulet}`,
    `Felső karakterhatár: ${KARAKTERHATAR[felulet]}`,
    `A hírfolyamban az első ${LATHATO_HATAR[felulet]} karakter látszik — a lényeg legyen ott.`,
  ];
}

/** Az átírás bemenete: profil (benne „Kiknek szól” és „HOGYAN ÍRJUNK”), felület, a művelet leírása, a szöveg. */
export function atirasBemenet(
  profil: string[],
  felulet: PosztFeluletTipus,
  muvelet: string,
  kijelolt: string,
  jelenlegi: string,
  /** R-18 8. kör: a felhívás szándéka ezen a nyelven (a gép a poszt hangján írja a végére, nem szó szerint) */
  cta = "",
  /** c30 F3: „egy posztban két nyelv” — ennek a nyelvi résznek a hossz-kerete (null/undefined: nincs ilyen sor) */
  keret?: number | null,
): string {
  return [
    ...profil,
    ...feluletSorok(felulet),
    ...keretSorok(keret),
    muveletSor(muvelet),
    ...(kijelolt ? [] : ctaSorok(cta)),
    kijelolt ? `Csak ezt a részt írd át:\n${kijelolt}` : "A teljes szöveget írd át.",
    `A jelenlegi szöveg:\n${jelenlegi}`,
  ].join("\n");
}

/**
 * Miből fordítunk. 2026-09-30 (Kati B6: „nem a magyar szerkesztett szöveg fordítását adja vissza”): a MAGYAR
 * (szerkesztett) szöveg az eredeti; a cél nyelv saját cellája soha nem forrás. Magyar híján a véglegesített,
 * végül bármelyik másik nyelvű szöveg. (Eddig bármelyik véglegesített cella megelőzte a magyart.)
 */
export function forditasForrasa(
  szovegek: readonly PosztSzoveg[],
  felulet: PosztFeluletTipus,
  celNyelv: PosztNyelvTipus,
): PosztSzoveg | undefined {
  const jeloltek = szovegek.filter(
    (sz) => sz.felulet === felulet && sz.nyelv !== celNyelv && sz.szoveg.trim().length > 0,
  );
  return (
    jeloltek.find((sz) => sz.nyelv === "hu") ??
    jeloltek.find((sz) => sz.allapot === "vegleges") ??
    jeloltek[0]
  );
}

/** A fordítás bemenete: a szöveg SZÓ SZERINT, változtatás nélkül — a gép ezt fordítja, nem ír újat. */
export function forditasBemenet(
  profil: string[],
  felulet: PosztFeluletTipus,
  forras: Pick<PosztSzoveg, "nyelv" | "szoveg" | "cim">,
  celNyelv: PosztNyelvTipus,
  /** c30 F3: „egy posztban két nyelv” — ennek a nyelvi résznek a hossz-kerete */
  keret?: number | null,
): string {
  return [
    ...profil,
    ...feluletSorok(felulet),
    ...keretSorok(keret),
    `A szöveg nyelve: ${forras.nyelv}`,
    `A kért nyelv: ${celNyelv}`,
    // R-17 C: a cikk címe is fordítandó (a válasz {"cim","szoveg"} — prompts/poszt_forditas.hu.md v4)
    ...(felulet === "blog" && forras.cim ? [`A cím:\n${forras.cim}`] : []),
    `A szöveg:\n${forras.szoveg}`,
  ].join("\n");
}

/**
 * Üres cellán a fő gomb („Készítsd el ide”) mit csinál. 2026-09-30 (Kati B6): a román/angol fülön eddig
 * mindig ÚJ posztot írt — ha ugyanarra a felületre már van szöveg más nyelven, azt FORDÍTJA, hogy a nyelvi
 * változatok egységesek legyenek. Új javaslat továbbra is kérhető az „Új javaslat” gombbal.
 */
export function uresCellaMuvelet(
  szovegek: readonly Pick<PosztSzoveg, "felulet" | "nyelv" | "szoveg">[],
  felulet: PosztFeluletTipus,
  nyelv: PosztNyelvTipus,
): "szoveg" | "forditas" {
  if (nyelv === "hu") return "szoveg";
  const vanMas = szovegek.some((sz) => sz.felulet === felulet && sz.nyelv !== nyelv && sz.szoveg.trim().length > 0);
  return vanMas ? "forditas" : "szoveg";
}

/**
 * R-18 3. kör · „Saját ötlet” (Csilla 10-11): a kiváltó sorai a gép bemenetében. Saját ötletnél a beírt mondat a poszt TÁRGYA (nem csak
 * „kiváltó”), a cég profilja csak háttér; üres ötletnél a gép a profilból választ témát. A tény-tilalom a promptban (poszt_szoveg v7) áll.
 * Más kiváltónál (hír, terv, belső infó) változatlanul „A kiváltó szövege:”.
 */
export function kivaltoSorok(tipus: string, kivalto: string): string[] {
  if (tipus !== "sajat") return kivalto ? [`A kiváltó szövege:\n${kivalto}`] : [];
  const otlet = kivalto.trim();
  if (!otlet) return ["Saját ötlet: a felhasználó nem adott témát — válassz egyet abból, amivel a cég foglalkozik (a profil szerint)."];
  return [`Saját ötlet — a poszt TÁRGYA, erről szól a poszt (a felhasználó szavai, ADAT):\n${otlet}`];
}

/**
 * A posztszöveg (poszt_szoveg / poszt_cikk) bemenete: a cég profilja, a felület, a munka címe, a kiváltó, a mai dátum (v5). R-18 3. kör:
 * a gépezetből (index.ts forrasBemenet) ide költözött változatlanul — kivéve, hogy saját ötletnél a „kiváltó címe” sor elmarad (a cím a
 * beírt mondat eleje), és a mondat a poszt tárgyaként áll (kivaltoSorok).
 */
export function szovegBemenet(
  munka: { cim: string; forras: { tipus: string; cim: string; url: string } },
  felulet: PosztFeluletTipus,
  profil: string[],
  mai: string,
  kivalto: string,
  /** R-18 6. kör: a beírt felhívás ezen a nyelven (a gép ne írjon másikat) */
  cta = "",
  /** c30 F3: „egy posztban két nyelv” — ennek a nyelvi résznek a hossz-kerete */
  keret?: number | null,
): string {
  const sorok = [
    ...profil,
    ...(felulet === "blog"
      // R-17 C: a honlap-cikk (prompts/poszt_cikk.hu.md): cél hossz, cím, hashtag nélkül
      ? ["Felület: blog (honlap-cikk)", `Cél hossz: kb. 1500–${BLOG_HATAR} karakter (puha határ); a cím legfeljebb ${BLOG_CIM_MAX} karakter.`]
      : [
        `Felület: ${felulet}`,
        `Felső karakterhatár: ${KARAKTERHATAR[felulet]}`,
        `A hírfolyamban az első ${LATHATO_HATAR[felulet]} karakter látszik — a lényeg legyen ott.`,
        ...keretSorok(keret),
      ]),
    `A munka címe: ${munka.cim}`,
    `A kiváltó típusa: ${munka.forras.tipus}`,
    // v5 (2026-09-28): a mai dátum — enélkül a gép a lezajlott eseményt is jelen időben írta („zajlik”)
    `Mai dátum: ${mai}`,
  ];
  if (munka.forras.cim && munka.forras.tipus !== "sajat") sorok.push(`A kiváltó címe: ${munka.forras.cim}`);
  if (munka.forras.url) sorok.push(`Hivatkozás: ${munka.forras.url}`);
  sorok.push(...kivaltoSorok(munka.forras.tipus, kivalto));
  sorok.push(...ctaSorok(cta));
  return sorok.join("\n");
}

/**
 * Kati 10-11 („a szövegben van egy rész, ami lényegében üzenet az ügyfélnek — nincs helye a szövegben”; „ne legyen cím, a jó
 * szövegeknek nincs címük”): a gép szövegéből csak a KÖZÖLHETŐ rész marad. A prompt (poszt_szoveg v8) ezt kéri; ez az őr akkor is
 * levágja, ha a gép mégis írna:
 *   · az első sor, ha CÍM: markdown-cím (#, **…**), vagy rövid (≤ 10 szó), mondatvégi írásjel nélküli sor, amit üres sor követ, és utána
 *     van még szöveg; vagy „Cím:” / „Title:” / „Titlu:” kezdetű sor;
 *   · a nekünk / a felhasználónak szóló sor („Íme a poszt:”, „Megjegyzés: …”, „Ha szeretnéd, …”, „Képjavaslat: …”, „P.S. …”), és a
 *     csak szögletes zárójelből álló helykitöltő sor („[Kép: a csapat a tónál]”).
 * A kevés szavas, de mondatvégi írásjeles első sor („Kész a Fenyő utcai udvar!”) marad — az a poszt első mondata, nem cím.
 */
const META_SOR = [
  /^(íme|itt (van|a|találod)|here is|here's|iată)\b.*:\s*$/i,
  /^(megjegyzés|megjegyzések|note|notes|notă|observație|tipp a|javaslat a|képjavaslat|kép ?javaslat|fotójavaslat|image suggestion|sugestie (de )?imagine|hashtag ?javaslat)\s*:/i,
  /^(ha szeretnéd|ha gondolod|ha kéred|szívesen (átírom|módosítom|készítek|megírom)|készíthetek|if you('d)? like|if you want|dacă dorești|dacă vrei)\b/i,
  /^p\.?\s?s\.?\b/i,
  /^\s*[[(].{0,200}[\])]\s*$/,
];
const CIM_ELOTAG = /^\s*(cím|title|titlu|headline|főcím)\s*:/i;

/** A cím szavainak „töve”: a legalább 4 betűs szavak első 5 betűje, kisbetűvel (a „vasárnap” és a „vasárnapi” így ugyanaz). */
function tovek(s: string): string[] {
  return s.toLocaleLowerCase("hu").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4).map((w) => w.slice(0, 5));
}
/**
 * c30 F3 utómunka (a fősession élő próbája 10-17, „Zilele teszt”; Kati 10-14 szabálya: nincs külön címmondat a poszt elején): a MONDATNAK
 * álcázott cím — „Kökény Attila vasárnapi koncertje.” Az első bekezdés EGYETLEN rövid sor (≤ 6 szó), PONTTAL zárul, üres sor és további
 * szöveg követi, és a szavai a kiváltó címének szavai (a legalább 4 betűs szavak ≥ 60 %-a, legalább kettő, egyezik a cím egy szavának
 * tövével). A valódi nyitó mondat marad: „Tegnap befejeztük az udvart.” (más szavak), „Kész a Fenyő utcai udvar!” (felkiáltás), és ha a
 * címet nem ismerjük, semmi nem változik. A hosszabb (7–8 szavas) nyitó mondat a cím szavaival is marad („Kökény Attila vasárnap este fellép
 * a Győzelem téren.”) — az már mond valamit; a ≤ 6 szavas, a címet ismétlő külön bekezdés Kati szabálya szerint cím.
 */
export function mondatCim(elso: string, cimek: readonly string[]): boolean {
  const sor = elso.trim();
  if (!sor.endsWith(".") || sor.endsWith("..") || sor.split(/\s+/).length > 6) return false;
  const cim = new Set(cimek.flatMap(tovek));
  if (cim.size === 0) return false;
  const t = tovek(sor);
  if (t.length < 2) return false;
  return t.filter((x) => cim.has(x)).length / t.length >= 0.6;
}

/**
 * c30 F3 utómunka: a fordítás HŰ — ha a gép mégis egy plusz rövid első bekezdést (címet) tesz a fordítás elejére, ami a forrásban nincs,
 * az lekerül. Csak akkor vág, ha a fordításnak pontosan eggyel több bekezdése van, és az első egyetlen rövid (≤ 8 szó) sor, ami nem
 * felkiáltás vagy kérdés (egy kettévágott „Kész! …” bekezdés „Gata!” sora így marad).
 */
export function forditasCimNelkul(forras: string, forditott: string): string {
  const bek = (x: string) => x.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const f = bek(forras), d = bek(forditott);
  const elso = d[0] ?? "";
  if (d.length === f.length + 1 && d.length > 1 && !elso.includes("\n") && elso.split(/\s+/).length <= 8 && !/[!?]$/.test(elso) && !/^(#[\p{L}\p{N}_]+\s*)+$/u.test(elso)) return d.slice(1).join("\n\n");
  return forditott;
}

/** @param cimek a kiváltó címe(i) (forrás címe, rövid cím) — ezekből ismeri fel a mondatnak álcázott címet (mondatCim) */
export function kozolhetoSzoveg(szoveg: string, cimek: readonly string[] = []): string {
  let sorok = szoveg.replace(/\r\n/g, "\n").split("\n");
  // a meta-sorok (bárhol) ki
  sorok = sorok.filter((s) => !META_SOR.some((m) => m.test(s.trim())));
  // az elejéről az üres sorok
  while (sorok.length && !sorok[0]!.trim()) sorok.shift();
  const elso = (sorok[0] ?? "").trim();
  const utana = sorok.slice(1);
  const vanTovabb = utana.some((s) => s.trim());
  const ureskovet = utana.length > 0 && !utana[0]!.trim();
  const markdownCim = /^#{1,6}\s+\S/.test(elso) || /^\*\*[^*].*\*\*$/.test(elso) || /^__[^_].*__$/.test(elso);
  const szavak = elso.split(/\s+/).filter(Boolean).length;
  const rovidCim = szavak > 0 && szavak <= 10 && !/[.!?…:;)"”»]$/.test(elso) && !/^#\w/.test(elso) && ureskovet;
  // R-18 8. kör (Kati 10-13: a szöveg mégis címmel kezdődött) — üres sor nélkül is cím: a rövid (≤ 8 szó), mondatvégi írásjel nélküli
  // első sor, ha közvetlenül egy hosszabb mondat (≥ 6 szó) követi; és a csupa nagybetűs első sor (≤ 12 szó). Emoji a sor végén nem írásjel.
  const elsoTiszta = elso.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u, "").trim();
  const kovetkezo = (utana.find((x) => x.trim()) ?? "").trim();
  const tapadoCim = !ureskovet && szavak > 0 && szavak <= 8 && !/[.!?…:;,)"”»]$/.test(elsoTiszta) && !/^#\w/.test(elso) && kovetkezo.split(/\s+/).length >= 6 && /[.!?…]/.test(kovetkezo);
  const betuk = elso.replace(/[^\p{L}]/gu, "");
  const nagybetus = betuk.length >= 4 && betuk === betuk.toLocaleUpperCase("hu") && szavak <= 12;
  const mondatnakAlcazott = ureskovet && mondatCim(elso, cimek); // c30 F3 utómunka (10-17): „Kökény Attila vasárnapi koncertje.”
  if (vanTovabb && (markdownCim || rovidCim || tapadoCim || nagybetus || mondatnakAlcazott || CIM_ELOTAG.test(elso))) sorok = utana;
  while (sorok.length && !sorok[0]!.trim()) sorok.shift();
  while (sorok.length && !sorok[sorok.length - 1]!.trim()) sorok.pop();
  // ha a vágás után két üres sor maradt egymás után, egy legyen
  return sorok.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * R-18 6. kör (Kati C): a cselekvésre hívás a poszt UTOLSÓ bekezdése. A „Beleírom” így teszi be: ha a korábban beírt felhívás áll a végén,
 * azt cseréli; ha a poszt hashtag-sorral zárul, a felhívás a hashtagek ELÉ kerül. Üres új felhívásnál a régi kikerül. Tiszta függvény.
 */
export function ctaBeszur(szoveg: string, regi: string, uj: string): string {
  const bek = szoveg.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const hashtagSor = (b: string) => /^(#[\p{L}\p{N}_]+\s*)+$/u.test(b);
  const vegHashtag = bek.length > 0 && hashtagSor(bek[bek.length - 1]!) ? bek.pop()! : null;
  const r = regi.trim();
  if (r && bek.length && bek[bek.length - 1] === r) bek.pop();
  const u = uj.replace(/\s+/g, " ").trim();
  if (u && bek[bek.length - 1] !== u) bek.push(u);
  if (vegHashtag) bek.push(vegHashtag);
  return bek.join("\n\n");
}

/** R-18 8. kör (Kati 10-13: a beírt felhívás szó szerint került a posztba, idegenül): a felhívás SZÁNDÉK — a gép a poszt hangján, a saját
 *  szavaival írja az utolsó bekezdésbe; a kód már nem illeszti be szó szerint (a ctaBeszur csak a régi viselkedés tiszta függvénye). */
/**
 * c30 F3 (plan §5 Limits): in "both languages in one post" each half gets half of the platform budget. The input gains one line;
 * the prompts themselves are unchanged (no rule change), and without a budget nothing is added — every other post's input is as before.
 */
export function keretSorok(keret: number | null | undefined): string[] {
  return keret ? [`Hossz-keret: legfeljebb ${keret} karakter — a poszt két nyelven, egy posztban jelenik meg; ez az egyik nyelv része, a másik ugyanennyi.`] : [];
}

export function ctaSorok(cta: string | undefined): string[] {
  const c = (cta ?? "").trim();
  return c ? [`Cselekvésre hívás szándéka (a cég adta meg, NEM kész mondat): ${c} — a poszt utolsó bekezdése ezt mondja el a poszt hangján, a saját szavaiddal; ne másold szó szerint, és ne írj mellé másik felhívást.`] : [];
}
