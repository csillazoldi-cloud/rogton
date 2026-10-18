import "server-only";
import { and, asc, eq, gt, lte, sql } from "drizzle-orm";
import {
  ertesitesLepes,
  hubBeallitas,
  hubOsszesito,
  jelzoBeolvas,
  telegramBeallitas,
  cimzettek,
  estiUzenet,
  reggeliUzenet,
  type ErtesitesEredmeny,
  type Jelzo,
  type Visszajelzes,
} from "@km/visszajelzes-core";
import { db, sema } from "../adatbazis/kapcsolat";
import { felirat, feliratok } from "../nyelv";

// c1 + c7 (Csilla 2026-10-08/09; döntés: docs/decisions/2026-10-09-c1-c7-telegram.md).
// 2026-10-09 07:53 (Csilla): a hub NEM cél (a hub-csatlakozó Claude saját OAuth-belépése, az alkalmazás nem használhatja). A napi
// összesítő Telegramra megy. 08:13: két személyre szóló üzenet — 08:00 a tesztelőnek (javított tételek, „nézd meg újra”),
// 19:00 a fejlesztőnek (új tételek); a nevek a környezetből (TELEGRAM_TESZTELO_NEV, TELEGRAM_FEJLESZTO_NEV). A hub-küldő LENT MARAD, kikapcsolva:
// HUB_FEEDBACK_URL / HUB_WRITE_KEY nincs beállítva → nem nyúl semmihez (ha egyszer lesz programból írható hub, csak a két változó kell).
// A futtató (hirfigyelo/futtato.ts) percenként egyszer hívja az `ertesitesekTick`-et. Mindkét értesítés:
//   - naponta EGYSZER megy ki, a jelző a `rendszer_beallitas` táblában (ertesites.hub / ertesites.telegram) → újraindulás után nem ismétel;
//   - hiányzó környezet → naponta egy naplósor, semmi más (az alkalmazás nem áll meg, a jelző nem lép);
//   - küldési hiba → naplósor, 10 perc múlva újra (a jelző nem lép, ugyanazok a tételek mennek).
// A titkok (TELEGRAM_BOT_TOKEN, HUB_WRITE_KEY) csak a NAS .env-ben vannak; itt nem kerülnek naplóba.

const HUB_ORA = 2; // 02:00 Europe/Bucharest
const TG_ORA = 8; // 08:00 Europe/Bucharest — reggel a tesztelőnek (javított tételek)
const ESTE_ORA = 19; // 19:00 Europe/Bucharest — este a fejlesztőnek (új tételek)
const UJRAPROBA_MS = 10 * 60_000;

const JELZO_HUB = "ertesites.hub";
const JELZO_TG = "ertesites.telegram"; // a reggeli üzenet jelzője (a 0154 óta ugyanez a kulcs)
const JELZO_ESTE = "ertesites.telegram_este";

type Fajta = "hub" | "telegram" | "este";
const allapot: Record<Fajta, { kovetkezo: number; jelzettNap: string | null }> = {
  hub: { kovetkezo: 0, jelzettNap: null },
  telegram: { kovetkezo: 0, jelzettNap: null },
  este: { kovetkezo: 0, jelzettNap: null },
};

async function jelzoOlvas(kulcs: string): Promise<Jelzo | null> {
  const [sor] = await db().select({ ertek: sema.rendszerBeallitas.ertek }).from(sema.rendszerBeallitas).where(eq(sema.rendszerBeallitas.kulcs, kulcs)).limit(1);
  return jelzoBeolvas(sor?.ertek);
}

async function jelzoIr(kulcs: string, j: Jelzo): Promise<void> {
  await db()
    .insert(sema.rendszerBeallitas)
    .values({ kulcs, ertek: j })
    .onConflictDoUpdate({ target: sema.rendszerBeallitas.kulcs, set: { ertek: j, frissitve: sql`now()` } });
}

/** A (tol, ig] között beérkezett visszajelzések, a legrégebbi elöl (a hub összesítőjéhez). */
async function ujVisszajelzesek(tol: Date, ig: Date): Promise<Visszajelzes[]> {
  const sorok = await db()
    .select({
      id: sema.visszajelzes.id,
      szervezetId: sema.visszajelzes.szervezetId,
      fiokId: sema.visszajelzes.fiokId,
      fiokNev: sema.visszajelzes.fiokNev,
      nevtelen: sema.visszajelzes.nevtelen,
      lap: sema.visszajelzes.lap,
      lapCim: sema.visszajelzes.lapCim,
      szoveg: sema.visszajelzes.szoveg,
      nyelv: sema.visszajelzes.nyelv,
      allapot: sema.visszajelzes.allapot,
      letrehozva: sema.visszajelzes.letrehozva,
    })
    .from(sema.visszajelzes)
    .where(and(gt(sema.visszajelzes.letrehozva, tol), lte(sema.visszajelzes.letrehozva, ig)))
    .orderBy(asc(sema.visszajelzes.letrehozva));
  return sorok.map((s) => ({
    id: s.id,
    szervezet_id: s.szervezetId,
    szervezet_nev: "",
    fiok_id: s.fiokId,
    fiok_nev: s.fiokNev,
    nevtelen: s.nevtelen,
    lap: s.lap,
    lap_cim: s.lapCim,
    elem: null,
    kijelolt_szoveg: "",
    szoveg: s.szoveg,
    nyelv: s.nyelv,
    kep: null,
    ablak: { w: 0, h: 0 },
    allapot: s.allapot as Visszajelzes["allapot"],
    letrehozva: s.letrehozva.toISOString(),
    csomag_id: null,
  }));
}

/** A (tol, ig] között „kész”-re tett tételek (a reggeli üzenethez). */
async function keszVisszajelzesek(tol: Date, ig: Date): Promise<{ szoveg: string; lap: string; lap_cim: string; fiok_nev: string; nevtelen: boolean }[]> {
  return db()
    .select({ szoveg: sema.visszajelzes.szoveg, lap: sema.visszajelzes.lap, lap_cim: sema.visszajelzes.lapCim, fiok_nev: sema.visszajelzes.fiokNev, nevtelen: sema.visszajelzes.nevtelen })
    .from(sema.visszajelzes)
    .where(and(eq(sema.visszajelzes.allapot, "kesz"), gt(sema.visszajelzes.keszIdo, tol), lte(sema.visszajelzes.keszIdo, ig)))
    .orderBy(asc(sema.visszajelzes.keszIdo));
}

/**
 * c1 küldője — CSERÉLHETŐ. Ma: HTTP POST a HUB_FEEDBACK_URL címre, `Authorization: Bearer <HUB_WRITE_KEY>`, törzs {slug, text}
 * (a hub `post_feedback` eszközének két mezője). A hub valódi írási útja NINCS MEGMÉRVE (a repóban nincs leírva) — ha más,
 * csak ezt a függvényt kell cserélni; a szöveg, az időzítés és a jelző marad.
 */
async function hubKuld(url: string, kulcs: string, slug: string, text: string): Promise<void> {
  const v = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${kulcs}` },
    body: JSON.stringify({ slug, text }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!v.ok) throw new Error(`hub HTTP ${v.status}`);
}

/** c7 küldője: Telegram Bot API sendMessage, sima szöveg. A token csak az URL-ben van; hibaüzenetbe nem kerül. */
async function telegramKuld(token: string, chat: string, text: string): Promise<void> {
  let v: Response;
  try {
    v = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (h) {
    // a fetch hibaüzenete tartalmazhatja a címet (és benne a tokent) — csak a hiba fajtáját adjuk tovább
    throw new Error(`telegram nem elérhető (${h instanceof Error ? h.name : "hiba"})`);
  }
  const t = (await v.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!v.ok || !t?.ok) throw new Error(`telegram HTTP ${v.status}${t?.description ? `: ${t.description.slice(0, 120)}` : ""}`);
}

function listaCim(): string {
  const alap = (process.env["NYILVANOS_CIM"]?.trim() || "https://saas.mediapartizan.ro").replace(/\/+$/, "");
  return `${alap}/visszajelzes`;
}

function naploz(fajta: Fajta, e: ErtesitesEredmeny, nap: string): void {
  const a = allapot[fajta];
  switch (e.tortent) {
    case "nem_esedekes":
      return;
    case "nincs_beallitva":
      if (a.jelzettNap === nap) return;
      a.jelzettNap = nap;
      console.log(
        fajta === "hub"
          ? "[visszajelzes] hub-osszesito: HUB_FEEDBACK_URL / HUB_WRITE_KEY nincs beallitva - nem kuldok semmit"
          : "[visszajelzes] telegram (" + fajta + "): TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID nincs beallitva - nem kuldok semmit",
      );
      return;
    case "nincs_mit":
      console.log(`[visszajelzes] ${fajta}: nincs mit kuldeni (${nap})`);
      return;
    case "elkuldve":
      console.log(`[visszajelzes] ${fajta}: elkuldve, ${e.db} tetel (${nap})`);
      return;
    case "hiba":
      a.kovetkezo = Date.now() + UJRAPROBA_MS;
      console.warn(`[visszajelzes] ${fajta}: kuldes hiba, 10 perc mulva ujra: ${e.uzenet}`);
      return;
  }
}

async function egy(fajta: Fajta, most: Date, futtat: () => Promise<ErtesitesEredmeny>): Promise<void> {
  if (Date.now() < allapot[fajta].kovetkezo) return;
  const nap = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(most);
  try {
    naploz(fajta, await futtat(), nap);
  } catch (h) {
    allapot[fajta].kovetkezo = Date.now() + UJRAPROBA_MS;
    console.warn(`[visszajelzes] ${fajta}: hiba:`, h instanceof Error ? h.message : h);
  }
}

/** Percenként egyszer a futtatóból. Soha nem dob: a hibát naplózza, és 10 perc múlva újrapróbál. */
export async function ertesitesekTick(most: Date, env: Record<string, string | undefined> = process.env): Promise<void> {
  const hub = hubBeallitas(env);
  await egy("hub", most, () =>
    ertesitesLepes<Visszajelzes>({
      most,
      celOra: HUB_ORA,
      beallitva: hub !== null,
      jelzoOlvas: () => jelzoOlvas(JELZO_HUB),
      jelzoIr: (j) => jelzoIr(JELZO_HUB, j),
      tetelek: ujVisszajelzesek,
      szoveg: (t, nap) => hubOsszesito(t, nap),
      kuld: (s) => hubKuld(hub!.url, hub!.kulcs, hub!.slug, s),
      naplo: (s) => console.log(s),
    }),
  );

  // c1 + c7 (Csilla 2026-10-09 08:13): két személyre szóló üzenet, külön napi jelzővel.
  const tg = telegramBeallitas(env);
  const { tesztelo, fejleszto } = cimzettek(env);
  const feliratokKeret = (f: Record<string, string>, fejKulcs: string) => ({
    fej: (nev: string, n: number) => felirat(f, fejKulcs, { nev, n }),
    tobb: (n: number) => felirat(f, "vj.tg_tobb", { n }),
    link: (url: string) => felirat(f, "vj.tg_link", { url }),
    jelezte: (nev: string) => felirat(f, "vj.tg_jelezte", { nev }),
    hub: felirat(f, "vj.tg_hub", {}), // Csilla 2026-10-10: a reggeli üzenet záró sora (az esti nem használja)
  });

  // reggel 08:00 → a tesztelőnek: az előző reggeli üzenet óta „kész”-re tett tételek
  await egy("telegram", most, async () => {
    let f: Record<string, string> = {}; // a feliratok csak akkor töltődnek, ha az üzenet esedékes és be van állítva
    return ertesitesLepes({
      most,
      celOra: TG_ORA,
      beallitva: tg !== null,
      jelzoOlvas: () => jelzoOlvas(JELZO_TG),
      jelzoIr: (j) => jelzoIr(JELZO_TG, j),
      tetelek: async (tol, ig) => {
        f = await feliratok("hu");
        return keszVisszajelzesek(tol, ig);
      },
      szoveg: (t) => reggeliUzenet(t, tesztelo, feliratokKeret(f, "vj.tg_reggel_fej"), listaCim()),
      kuld: (s) => telegramKuld(tg!.token, tg!.chat, s),
      naplo: (s) => console.log(s),
    });
  });

  // este 19:00 → a fejlesztőnek: az előző esti üzenet óta beérkezett tételek
  await egy("este", most, async () => {
    let f: Record<string, string> = {};
    return ertesitesLepes<Visszajelzes>({
      most,
      celOra: ESTE_ORA,
      beallitva: tg !== null,
      jelzoOlvas: () => jelzoOlvas(JELZO_ESTE),
      jelzoIr: (j) => jelzoIr(JELZO_ESTE, j),
      tetelek: async (tol, ig) => {
        f = await feliratok("hu");
        return ujVisszajelzesek(tol, ig);
      },
      szoveg: (t) => estiUzenet(t, fejleszto, feliratokKeret(f, "vj.tg_este_fej"), listaCim()),
      kuld: (s) => telegramKuld(tg!.token, tg!.chat, s),
      naplo: (s) => console.log(s),
    });
  });
}
