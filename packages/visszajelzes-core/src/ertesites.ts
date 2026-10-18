// c1 + c7 (Csilla 2026-10-08/09): a Visszajelzés modul két kimenő értesítésének TISZTA része.
//   c1 — 02:00 (Europe/Bucharest): az előző összesítő óta beérkezett visszajelzések a Project Hub kártyájára, FEEDBACK-ként.
//   c7 — 08:00 (Europe/Bucharest): ha az előző reggel óta valamit „kész”-re tettek, EGY magyar üzenet a csapat Telegram-csoportjába.
// Itt nincs hálózat, adatbázis, Next: a szövegépítők, az időzítés, a „ma már elment” őr, a környezeti változók olvasása,
// és a futás menete befecskendezett függvényekkel (a befogadó adja az adatbázist és a fetch-et). Így minden döntés próbálható.

// Nem importál az index.ts-ből (a határőr kört tilt): a szükséges mezők itt, szerkezetileg — a `Visszajelzes` típus ennek megfelel.
export type ErtesitesTetel = { szoveg: string; lap: string; lap_cim: string; fiok_nev: string; nevtelen?: boolean | undefined };
type Visszajelzes = ErtesitesTetel;

export const ZONA = "Europe/Bucharest";

// ── Idő ──────────────────────────────────────────────────────────────────────

/** A nap kulcsa (ÉÉÉÉ-HH-NN) és az óra a bukaresti falióra szerint (a doboz órája UTC lehet; nyáron +3, télen +2). */
export function helyiIdo(most: Date): { nap: string; ora: number } {
  const nap = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(most);
  const ora = Number(new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", hour12: false }).format(most)) % 24;
  return { nap, ora };
}

/** A tárolt jelző: melyik napon ment ki utoljára, és melyik pillanatig számoltuk a tételeket (ISO). */
export type Jelzo = { nap: string; ig: string };

/**
 * Esedékes-e ma a küldés: a helyi óra elérte a célórát, és ma még nem ment ki.
 * NEM a pontos percet nézi: ha az alkalmazás 02:00-kor éppen újraindult, 02:01-kor (vagy a nap folyamán később) pótolja — de naponta egyszer.
 */
export function esedekes(most: Date, celOra: number, jelzo: Jelzo | null): boolean {
  const { nap, ora } = helyiIdo(most);
  if (ora < celOra) return false;
  return jelzo?.nap !== nap;
}

/** Mettől számolunk: az előző küldés pillanatától; jelző nélkül (első futás) az elmúlt 24 órától. */
export function ablakKezdete(most: Date, jelzo: Jelzo | null): Date {
  if (jelzo) {
    const d = new Date(jelzo.ig);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(most.getTime() - 24 * 60 * 60 * 1000);
}

// ── Környezet ────────────────────────────────────────────────────────────────

export type HubBeallitas = { url: string; kulcs: string; slug: string };
export type TelegramBeallitas = { token: string; chat: string };

/** A NAS .env-ből: HUB_FEEDBACK_URL + HUB_WRITE_KEY (+ HUB_SLUG, alap kommunikacios-munkater). Bármelyik hiányzik → null. */
export function hubBeallitas(env: Record<string, string | undefined>): HubBeallitas | null {
  const url = env["HUB_FEEDBACK_URL"]?.trim() ?? "";
  const kulcs = env["HUB_WRITE_KEY"]?.trim() ?? "";
  if (!url || !kulcs) return null;
  if (!/^https?:\/\//.test(url)) return null;
  return { url, kulcs, slug: env["HUB_SLUG"]?.trim() || "kommunikacios-munkater" };
}

/** A NAS .env-ből: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID. Bármelyik hiányzik → null. */
export function telegramBeallitas(env: Record<string, string | undefined>): TelegramBeallitas | null {
  const token = env["TELEGRAM_BOT_TOKEN"]?.trim() ?? "";
  const chat = env["TELEGRAM_CHAT_ID"]?.trim() ?? "";
  if (!token || !chat) return null;
  return { token, chat };
}

// ── Szöveg ───────────────────────────────────────────────────────────────────

/** A sortörések egy sorba: a szavak szó szerint maradnak, csak a sorvég lesz „ / ”. */
export function egySorba(s: string): string {
  return s
    .split(/\r?\n/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter((x) => x.length > 0)
    .join(" / ");
}

/** Rövidítés szóhatáron, „…”-val. A hossz Unicode-karakterben (az ékezet egy karakter). */
export function rovidit(s: string, max: number): string {
  const egy = egySorba(s);
  const kar = [...egy];
  if (kar.length <= max) return egy;
  const vag = kar.slice(0, max - 1).join("");
  const szokoz = vag.lastIndexOf(" ");
  const alap = szokoz >= max * 0.6 ? vag.slice(0, szokoz) : vag;
  return `${alap.replace(/[\s,.;:–—-]+$/u, "")}…`;
}

/** Hol: a lap címe, ha van, különben az útvonal. */
function hol(v: Pick<Visszajelzes, "lap" | "lap_cim">): string {
  return v.lap_cim ? `${v.lap_cim} (${v.lap})` : v.lap;
}

function ki(v: Pick<Visszajelzes, "nevtelen" | "fiok_nev">): string {
  if (v.nevtelen || !v.fiok_nev) return "névtelen";
  return v.fiok_nev;
}

/** A hub egy bejegyzésébe legfeljebb ennyi tétel; a többi egy „és még N” sorba. */
export const HUB_MAX_TETEL = 60;

/**
 * c1: a napi összesítő szövege a hub kártyájára. Tételenként EGY sor: a tesztelő szövege SZÓ SZERINT idézve
 * (csak a sortörés lesz „ / ”), a lap és a szerző. Nincs új tétel → null (nem megy ki semmi).
 */
export function hubOsszesito(vjk: Visszajelzes[], nap: string): string | null {
  if (vjk.length === 0) return null;
  const sorok: string[] = [];
  sorok.push(`Napi visszajelzés-összesítő · ${nap} · ${vjk.length} új tétel (az alkalmazás Visszajelzés gombjából)`);
  for (const v of vjk.slice(0, HUB_MAX_TETEL)) {
    sorok.push(`- „${egySorba(v.szoveg)}” — ${hol(v)} — ${ki(v)}`);
  }
  if (vjk.length > HUB_MAX_TETEL) sorok.push(`- … és még ${vjk.length - HUB_MAX_TETEL} tétel: /visszajelzes`);
  return sorok.join("\n");
}

/** A Telegram-üzenet feliratai (a `felirat` táblából: vj.tg_cim, vj.tg_tobb, vj.tg_link). */
export type TelegramFeliratok = { cim: string; tobb: (n: number) => string; link: (url: string) => string };

/** Egy tétel szövege a Telegram-üzenetben legfeljebb ennyi karakter. */
export const TG_SZOVEG_MAX = 90;
/** Ennyi tétel fér egy üzenetbe; a többi egy sorba. (A Telegram határa 4096 karakter; 20 × ~150 bőven alatta.) */
export const TG_MAX_TETEL = 20;
export const TG_HATAR = 4096;
/** A lap neve a Telegram-sorban legfeljebb ennyi karakter. */
export const TG_LAP_MAX = 40;

/**
 * c7: a „Tegnap javítva” üzenet önmagában. 2026-10-09 08:13 óta az alkalmazás a `reggeliUzenet`-et küldi (személyre szóló fej);
 * ez a builder a próbáival együtt megmarad. Nincs kész tétel → null (nem megy üzenet).
 * Sima szöveg (parse_mode nélkül): a tesztelő szövegében lehet „<” vagy „&”, amit a HTML-mód elrontana.
 */
export function telegramUzenet(
  keszek: Pick<Visszajelzes, "szoveg" | "lap" | "lap_cim">[],
  f: TelegramFeliratok,
  listaUrl: string,
): string | null {
  if (keszek.length === 0) return null;
  const hossz = (x: string) => [...x].length;
  const fej = `${f.cim}\n`;
  const lab = (maradt: number) => (maradt > 0 ? `\n${f.tobb(maradt)}` : "") + `\n\n${f.link(listaUrl)}`;
  const sorok: string[] = [];
  for (const v of keszek.slice(0, TG_MAX_TETEL)) {
    const sor = `• ${rovidit(v.szoveg, TG_SZOVEG_MAX)} — ${rovidit(v.lap_cim || v.lap, TG_LAP_MAX)}`;
    // a link és az „és még” sor mindig belefér: tételt csak addig veszünk fel, amíg a teljes üzenet a határ alatt marad
    const maradtHa = keszek.length - sorok.length - 1;
    if (hossz(fej) + hossz([...sorok, sor].map((x) => `\n${x}`).join("")) + hossz(lab(maradtHa)) > TG_HATAR) break;
    sorok.push(sor);
  }
  return fej + sorok.map((x) => `\n${x}`).join("") + lab(keszek.length - sorok.length);
}

// ── c1 + c7: két személyre szóló üzenet (Csilla 2026-10-09 08:13) ──────────
// „A csoportüzenet mondja meg, KINEK mit kell tennie.” Két üzenet, mindkettő egy embernek szól, teendővel és darabszámmal:
//   reggel 08:00 — a tesztelőnek: „Kati, tegnap N dolgot javítottunk — kérlek, nézd meg újra:” + a kész tételek
//   este   19:00 — a fejlesztőnek: „Csilla, ma N új visszajelzés jött:” + az új tételek
// A nevek a környezetből jönnek (TELEGRAM_TESZTELO_NEV, TELEGRAM_FEJLESZTO_NEV), a keretszövegek feliratok (0156).
// (A 07:53-as összevont reggeli üzenet ezzel kikerült; a hub-küldő továbbra is kikapcsolva.)

/** A beküldő keresztneve: a név UTOLSÓ szava (magyar névsorrend: „Kovács Katalin” → „Katalin”); névtelen → „névtelen”. */
export function keresztnev(v: Pick<Visszajelzes, "nevtelen" | "fiok_nev">): string {
  if (v.nevtelen || !v.fiok_nev.trim()) return "névtelen";
  const szavak = v.fiok_nev.trim().split(/\s+/);
  return szavak[szavak.length - 1]!;
}

/** A két címzett neve a környezetből; alapérték Kati (tesztelő) és Csilla (fejlesztő). */
export function cimzettek(env: Record<string, string | undefined>): { tesztelo: string; fejleszto: string } {
  return {
    tesztelo: env["TELEGRAM_TESZTELO_NEV"]?.trim() || "Kati",
    fejleszto: env["TELEGRAM_FEJLESZTO_NEV"]?.trim() || "Csilla",
  };
}

export type SzemelyesFeliratok = { fej: (nev: string, n: number) => string; tobb: (n: number) => string; link: (url: string) => string };

/** Fej + tételsorok + „…és még N” + link (+ egy záró sor, ha van), 4096 karakter alatt (amíg nem fér, a sorok vége marad le). Üres lista → null. */
function szemelyes(fej: string, sorok: string[], f: SzemelyesFeliratok, listaUrl: string, zaro?: string): string | null {
  if (sorok.length === 0) return null;
  const epit = (db: number) =>
    [fej, ...sorok.slice(0, db), ...(sorok.length > db ? [f.tobb(sorok.length - db)] : []), "", f.link(listaUrl), ...(zaro ? [zaro] : [])].join("\n");
  let db = Math.min(sorok.length, TG_MAX_TETEL);
  while (db > 0 && [...epit(db)].length > TG_HATAR) db--;
  return epit(db);
}

/**
 * Reggel, a tesztelőnek: a javított tételek. Soronként: a tesztelő szavai rövidítve — lap — „jelezte: <keresztnév>” (mindig).
 * Csilla 2026-10-10 21:55: a link alatt egy állandó záró sor (`hub`, felirat vj.tg_hub: „Nézd meg a hub kártyát is — lehet új
 * tesztfeladat.”) — link nélkül (a hubnak nincs ismert webcíme). Csak itt, és csak ha az üzenet egyáltalán megy (N ≥ 1).
 * Nincs javított tétel → null.
 */
export function reggeliUzenet(
  keszek: Pick<Visszajelzes, "szoveg" | "lap" | "lap_cim" | "fiok_nev" | "nevtelen">[],
  tesztelo: string,
  f: SzemelyesFeliratok & { jelezte: (nev: string) => string; hub: string },
  listaUrl: string,
): string | null {
  // 2026-10-09 (mérve az élő listán): Kati fiókjai „Szente Katalin”, „Szente”, „Bruno Mars” — névösszevetés nem működhet,
  // ezért MINDEN sorban ott a „jelezte: <keresztnév>” (egyszavas névnél az az egy szó).
  const sorok = keszek.map((v) => `• ${rovidit(v.szoveg, TG_SZOVEG_MAX)} — ${rovidit(v.lap_cim || v.lap, TG_LAP_MAX)} — ${f.jelezte(keresztnev(v))}`);
  return szemelyes(f.fej(tesztelo, keszek.length), sorok, f, listaUrl, f.hub);
}

/** Este, a fejlesztőnek: az új tételek. Soronként: szavak rövidítve — lap — keresztnév. Nincs új tétel → null. */
export function estiUzenet(
  ujak: Pick<Visszajelzes, "szoveg" | "lap" | "lap_cim" | "fiok_nev" | "nevtelen">[],
  fejleszto: string,
  f: SzemelyesFeliratok,
  listaUrl: string,
): string | null {
  const sorok = ujak.map((v) => `• ${rovidit(v.szoveg, TG_SZOVEG_MAX)} — ${rovidit(v.lap_cim || v.lap, TG_LAP_MAX)} — ${keresztnev(v)}`);
  return szemelyes(f.fej(fejleszto, ujak.length), sorok, f, listaUrl);
}

// ── A futás menete (befecskendezett függőségekkel) ──────────────────────────

export type ErtesitesFuggosegek<T> = {
  most: Date;
  celOra: number;
  /** false: nincs beállítva a környezet → egy naplósor naponta, semmi más (a jelző NEM lép, a tételek megvárják a beállítást) */
  beallitva: boolean;
  jelzoOlvas: () => Promise<Jelzo | null>;
  jelzoIr: (j: Jelzo) => Promise<void>;
  /** a tételek (tol, ig] között */
  tetelek: (tol: Date, ig: Date) => Promise<T[]>;
  /** a kimenő szöveg; null = nincs mit küldeni */
  szoveg: (tetelek: T[], nap: string) => string | null;
  /** a küldés; hibánál dob */
  kuld: (szoveg: string) => Promise<void>;
  naplo: (sor: string) => void;
};

export type ErtesitesEredmeny =
  | { tortent: "nem_esedekes" }
  | { tortent: "nincs_beallitva" }
  | { tortent: "nincs_mit"; db: 0 }
  | { tortent: "elkuldve"; db: number }
  | { tortent: "hiba"; uzenet: string };

/**
 * Egy értesítés egy lépése. Sorrend: elérte a célórát? → beállítva? → ma már elment? → tételek → szöveg → küldés → jelző.
 * A jelző csak SIKERES küldés (vagy „nincs mit”) után lép: újraindulás után nem küld újra ugyanarra a napra,
 * hiba után pedig a következő próba ugyanazokat a tételeket viszi.
 */
export async function ertesitesLepes<T>(d: ErtesitesFuggosegek<T>): Promise<ErtesitesEredmeny> {
  const { nap, ora } = helyiIdo(d.most);
  if (ora < d.celOra) return { tortent: "nem_esedekes" };
  // hiányzó környezet: az adatbázishoz sem nyúl (percenként hívják)
  if (!d.beallitva) return { tortent: "nincs_beallitva" };
  const jelzo = await d.jelzoOlvas();
  if (!esedekes(d.most, d.celOra, jelzo)) return { tortent: "nem_esedekes" };
  const tol = ablakKezdete(d.most, jelzo);
  const tetelek = await d.tetelek(tol, d.most);
  const szoveg = d.szoveg(tetelek, nap);
  if (szoveg === null) {
    await d.jelzoIr({ nap, ig: d.most.toISOString() });
    return { tortent: "nincs_mit", db: 0 };
  }
  try {
    await d.kuld(szoveg);
  } catch (h) {
    return { tortent: "hiba", uzenet: h instanceof Error ? h.message : String(h) };
  }
  await d.jelzoIr({ nap, ig: d.most.toISOString() });
  return { tortent: "elkuldve", db: tetelek.length };
}

/** A jelző beolvasása a `rendszer_beallitas.ertek` JSON-jából (rossz alak → null). */
export function jelzoBeolvas(ertek: unknown): Jelzo | null {
  if (!ertek || typeof ertek !== "object") return null;
  const o = ertek as Record<string, unknown>;
  if (typeof o["nap"] !== "string" || typeof o["ig"] !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o["nap"])) return null;
  return { nap: o["nap"], ig: o["ig"] };
}
