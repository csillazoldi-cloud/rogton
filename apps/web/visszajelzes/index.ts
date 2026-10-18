import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  csomagBemenet,
  csomagOsszeall,
  JavitoCsomagValasz,
  VisszajelzesBekuldes,
  type JavitoCsomag,
  type JavitoTetelAllapot,
  type Visszajelzes,
  type VisszajelzesAllapot,
} from "@km/visszajelzes-core";
import { AiHiba } from "@km/ai-adapters";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { keretEllenoriz, meresRogzit, jsonRobusztusan, prompt, AiKozosHiba, hirfigyeloSzolgaltato } from "../ai";
import { listaFajlbaIr, csomagFajlbaIr } from "./export";

// A Visszajelzés modul szerveroldali magja (V1). A végpontok ezt hívják.
// A modul RENDSZERSZINTŰ: a `visszajelzes` és `javito_csomag` táblán NINCS sorszintű védelem,
// ezért itt `db()`-vel dolgozunk. A tulajdonos a végponton szűrve a saját szervezetét látja.

export type BekuldEredmeny = { ok: true; id: string } | { ok: false; hiba: "ERVENYTELEN_ADAT" };

/**
 * A NÉVTELEN (belépés előtti) beküldés szigorúbb határai (0148, Kati 10-02). A belépett beküldés a szerződés határait kapja
 * (szöveg 2000, kép 400 000 karakter); munkamenet nélkül a szöveg rövidebb, és a kép CSAK a modul saját képernyőképe lehet
 * (PNG adat-URL, base64) — más fájl, más formátum, kívülre mutató cím nem.
 */
export const NEVTELEN_HATAR = { szoveg: 1000, kep: 400_000, torzsBajt: 450_000 } as const;
const PNG_ADAT_URL = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

export type Bekuldo =
  | { nevtelen: false; fiok: { id: string; nev: string }; szervezet: { id: string; nev: string } | null }
  | { nevtelen: true };

/** Egy visszajelzés beküldése. A beküldő a kaputól jön (megbízható): belépett fiók (szervezettel vagy nélküle), vagy névtelen. */
export async function bekuld(bekuldo: Bekuldo, be: unknown): Promise<BekuldEredmeny> {
  const ellenorzott = VisszajelzesBekuldes.safeParse(be);
  if (!ellenorzott.success) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  const b = ellenorzott.data;
  if (bekuldo.nevtelen || bekuldo.szervezet === null) {
    if (b.szoveg.length > NEVTELEN_HATAR.szoveg) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
    if (b.kep !== null && (b.kep.length > NEVTELEN_HATAR.kep || !PNG_ADAT_URL.test(b.kep))) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  }
  const [sor] = await db()
    .insert(sema.visszajelzes)
    .values({
      szervezetId: bekuldo.nevtelen ? null : (bekuldo.szervezet?.id ?? null),
      fiokId: bekuldo.nevtelen ? null : bekuldo.fiok.id,
      fiokNev: bekuldo.nevtelen ? "" : bekuldo.fiok.nev,
      nevtelen: bekuldo.nevtelen,
      lap: b.lap,
      lapCim: b.lap_cim,
      elem: b.elem,
      kijeloltSzoveg: b.kijelolt_szoveg,
      szoveg: b.szoveg,
      nyelv: b.nyelv,
      kep: b.kep,
      ablak: b.ablak,
      allapot: "uj",
    })
    .returning({ id: sema.visszajelzes.id });
  if (!sor) return { ok: false, hiba: "ERVENYTELEN_ADAT" };
  await listaFajlbaIr(await lista({ szervezetId: null })).catch((h) => console.warn("[visszajelzes] lista fajl:", h)); // R18 2. kör: megvárjuk — a válasz után a fájl már a friss listát tartalmazza (a visszajelzes-export próba eddig versenyhelyzetben olvasott); hibát nem dob, a válasz nem változik
  return { ok: true, id: sor.id };
}

export type ListaSzuro = {
  szervezetId: string | null;
  allapot?: VisszajelzesAllapot | undefined;
  limit?: number | undefined;
};

/** A visszajelzések listája. `szervezetId === null` = minden szervezet (rendszergazda). */
export async function lista(szuro: ListaSzuro): Promise<Visszajelzes[]> {
  const limit = szuro.limit ?? 200;
  const feltetelek = [];
  if (szuro.szervezetId !== null) feltetelek.push(eq(sema.visszajelzes.szervezetId, szuro.szervezetId));
  if (szuro.allapot) feltetelek.push(eq(sema.visszajelzes.allapot, szuro.allapot));

  const sorok = await db()
    .select({
      id: sema.visszajelzes.id,
      szervezetId: sema.visszajelzes.szervezetId,
      szervezetNev: sema.szervezet.nev, // lehet null: a szervezet tábla sorszintű védelem alatt áll, a host-szintű db() nem mindig látja
      fiokId: sema.visszajelzes.fiokId,
      fiokNev: sema.visszajelzes.fiokNev,
      nevtelen: sema.visszajelzes.nevtelen,
      lap: sema.visszajelzes.lap,
      lapCim: sema.visszajelzes.lapCim,
      elem: sema.visszajelzes.elem,
      kijeloltSzoveg: sema.visszajelzes.kijeloltSzoveg,
      szoveg: sema.visszajelzes.szoveg,
      nyelv: sema.visszajelzes.nyelv,
      ablak: sema.visszajelzes.ablak,
      allapot: sema.visszajelzes.allapot,
      csomagId: sema.visszajelzes.csomagId,
      letrehozva: sema.visszajelzes.letrehozva,
      vanKep: sql<boolean>`(${sema.visszajelzes.kep} IS NOT NULL)`, // a lista csak azt mondja, van-e kép; a képet a /kep végpont adja
    })
    .from(sema.visszajelzes)
    .leftJoin(sema.szervezet, eq(sema.szervezet.id, sema.visszajelzes.szervezetId)) // V1 (MÉRVE 2026-09-16): innerJoin-nal 0 sor jött — a szervezet tábla RLS-e a host-szintű lekérdezésben üres
    .where(feltetelek.length > 0 ? and(...feltetelek) : undefined)
    .orderBy(desc(sema.visszajelzes.letrehozva))
    .limit(limit);

  return sorok.map((s) => ({
    id: s.id,
    szervezet_id: s.szervezetId,
    szervezet_nev: s.szervezetNev ?? "",
    fiok_id: s.fiokId,
    fiok_nev: s.fiokNev,
    nevtelen: s.nevtelen,
    lap: s.lap,
    lap_cim: s.lapCim,
    elem: (s.elem as Visszajelzes["elem"]) ?? null,
    kijelolt_szoveg: s.kijeloltSzoveg,
    szoveg: s.szoveg,
    nyelv: s.nyelv,
    kep: null, // a lista NEM adja a képet — külön végpont adja
    van_kep: Boolean(s.vanKep),
    ablak: s.ablak as Visszajelzes["ablak"],
    allapot: s.allapot as VisszajelzesAllapot,
    letrehozva: s.letrehozva.toISOString(),
    csomag_id: s.csomagId,
  }));
}

/** Egy visszajelzés képe (data URL). `szervezetId` nem null esetén csak a saját szervezet sorát adja. */
export async function kep(id: string, szervezetId: string | null): Promise<string | null> {
  const feltetelek = [eq(sema.visszajelzes.id, id)];
  if (szervezetId !== null) feltetelek.push(eq(sema.visszajelzes.szervezetId, szervezetId));
  const [sor] = await db()
    .select({ kep: sema.visszajelzes.kep })
    .from(sema.visszajelzes)
    .where(and(...feltetelek))
    .limit(1);
  return sor?.kep ?? null;
}

/** Az állapot váltása. `szervezetId` nem null esetén csak a saját szervezet sorát érinti. */
export async function allapotValt(
  id: string,
  allapot: VisszajelzesAllapot,
  szervezetId: string | null,
): Promise<boolean> {
  const feltetelek = [eq(sema.visszajelzes.id, id)];
  if (szervezetId !== null) feltetelek.push(eq(sema.visszajelzes.szervezetId, szervezetId));
  const sorok = await db()
    .update(sema.visszajelzes)
    // 0154 (c7): a „kész” pillanata a reggeli üzenethez. Már kész tételnél megmarad az első idő (újrakattintás nem küldi újra);
    // ha visszakerül „új”/„elfogadva” állapotba, törlődik — egy újabb „kész” újra bekerül a következő reggeli üzenetbe.
    .set({ allapot, keszIdo: allapot === "kesz" ? sql`COALESCE(${sema.visszajelzes.keszIdo}, now())` : null })
    .where(and(...feltetelek))
    .returning({ id: sema.visszajelzes.id });
  if (sorok.length > 0) {
    await listaFajlbaIr(await lista({ szervezetId: null })).catch((h) => console.warn("[visszajelzes] lista fajl:", h)); // R18 2. kör: megvárjuk — a válasz után a fájl már a friss listát tartalmazza (a visszajelzes-export próba eddig versenyhelyzetben olvasott); hibát nem dob, a válasz nem változik
  }
  return sorok.length > 0;
}

export type CsomagEredmeny =
  | { ok: true; csomag: JavitoCsomag | null }
  | { ok: false; hiba: "AI_KERET_KIMERULT" | "AI_NEM_ELERHETO" | "AI_ROSSZ_VALASZ" };

/** Az adott nap (Europe/Bucharest) visszajelzései, amelyek még nincsenek csomagban. */
async function napiVisszajelzesek(nap: string): Promise<Visszajelzes[]> {
  const sorok = await db()
    .select({
      id: sema.visszajelzes.id,
      szervezetId: sema.visszajelzes.szervezetId,
      szervezetNev: sema.szervezet.nev,
      fiokId: sema.visszajelzes.fiokId,
      fiokNev: sema.visszajelzes.fiokNev,
      nevtelen: sema.visszajelzes.nevtelen,
      lap: sema.visszajelzes.lap,
      lapCim: sema.visszajelzes.lapCim,
      elem: sema.visszajelzes.elem,
      kijeloltSzoveg: sema.visszajelzes.kijeloltSzoveg,
      szoveg: sema.visszajelzes.szoveg,
      nyelv: sema.visszajelzes.nyelv,
      ablak: sema.visszajelzes.ablak,
      allapot: sema.visszajelzes.allapot,
      csomagId: sema.visszajelzes.csomagId,
      letrehozva: sema.visszajelzes.letrehozva,
    })
    .from(sema.visszajelzes)
    .leftJoin(sema.szervezet, eq(sema.szervezet.id, sema.visszajelzes.szervezetId)) // V1: mint a listában — a szervezet tábla RLS-e miatt leftJoin
    .where(
      and(
        isNull(sema.visszajelzes.csomagId),
        sql`(${sema.visszajelzes.letrehozva} AT TIME ZONE 'Europe/Bucharest')::date = ${nap}::date`,
      ),
    )
    .orderBy(sema.visszajelzes.letrehozva);

  return sorok.map((s) => ({
    id: s.id,
    szervezet_id: s.szervezetId,
    szervezet_nev: s.szervezetNev ?? "",
    fiok_id: s.fiokId,
    fiok_nev: s.fiokNev,
    nevtelen: s.nevtelen,
    lap: s.lap,
    lap_cim: s.lapCim,
    elem: (s.elem as Visszajelzes["elem"]) ?? null,
    kijelolt_szoveg: s.kijeloltSzoveg,
    szoveg: s.szoveg,
    nyelv: s.nyelv,
    kep: null,
    ablak: s.ablak as Visszajelzes["ablak"],
    allapot: s.allapot as VisszajelzesAllapot,
    letrehozva: s.letrehozva.toISOString(),
    csomag_id: s.csomagId,
  }));
}

/**
 * A napi javítócsomag elkészítése. A `nap` napján (Europe/Bucharest) keletkezett, még csomag nélküli
 * visszajelzésekből dolgozik. Ha nincs ilyen: `{ ok: true, csomag: null }`.
 * Ha aznapra már van csomag, ÚJ csomag készül a még csomag nélküli visszajelzésekből (több csomag egy napon lehet).
 */
export async function napiCsomagKeszit(nap: string, nyelv: "hu"): Promise<CsomagEredmeny> {
  const vjk = await napiVisszajelzesek(nap);
  if (vjk.length === 0) return { ok: true, csomag: null };

  // A keret ellenőrzése rendszer-szinten (szervezet nélkül): a csomag több szervezet visszajelzését is összesíti.
  try {
    await keretEllenoriz();
  } catch (h) {
    if (h instanceof AiKozosHiba && h.kod === "AI_KERET_KIMERULT") return { ok: false, hiba: "AI_KERET_KIMERULT" };
    return { ok: false, hiba: "AI_NEM_ELERHETO" };
  }

  const sz = hirfigyeloSzolgaltato();
  const meresSzervezet = vjk.find((v) => v.szervezet_id !== null)?.szervezet_id ?? null;
  const t0 = Date.now();
  try {
    const v = await sz.hiv({
      feladat: "javitocsomag",
      rendszer: await prompt("javitocsomag", nyelv),
      szoveg: csomagBemenet(vjk),
      nyelv,
      maxKiToken: 2500,
      idokorlatMs: 90_000,
    });
    // A mérésnek kell egy szervezet — az ELSŐ szervezethez kötött visszajelzés szervezetére rögzítjük (a csomag rendszer-szintű,
    // de a mérés soronként szervezethez kötött; ez a legközelebbi valós szervezet). 0148: ha aznap csak névtelen beküldés volt,
    // nincs szervezet — akkor a munkatér-sor elmarad (a hívás a szolgáltatónál és a rendszerkeretben ettől még ott van: keretEllenoriz).
    if (meresSzervezet) await meresRogzit(meresSzervezet, v.meres);

    const nyers = jsonRobusztusan(v.szoveg);
    const elemzett = JSON.parse(nyers) as unknown;
    const ellenorzott = JavitoCsomagValasz.safeParse(elemzett);
    if (!ellenorzott.success) return { ok: false, hiba: "AI_ROSSZ_VALASZ" };

    let n = 0;
    const idAdo = () => crypto.randomUUID();
    const csomag = csomagOsszeall(nap, ellenorzott.data, vjk, idAdo);
    void n;

    const [beszurt] = await db()
      .insert(sema.javitoCsomag)
      .values({
        id: csomag.id,
        nap: csomag.nap,
        osszefoglalo: csomag.osszefoglalo,
        tetelek: csomag.tetelek,
        visszajelzesDb: csomag.visszajelzes_db,
      })
      .returning({ id: sema.javitoCsomag.id });
    if (!beszurt) return { ok: false, hiba: "AI_NEM_ELERHETO" };

    // A hivatkozott visszajelzések `csomag_id` frissítése. Az `allapot` NEM változik (marad `uj`) —
    // a rendszergazda dönt az elfogadásról.
    const hivatkozott = new Set<string>();
    for (const t of csomag.tetelek) for (const id of t.visszajelzes_ids) hivatkozott.add(id);
    if (hivatkozott.size > 0) {
      await db()
        .update(sema.visszajelzes)
        .set({ csomagId: csomag.id })
        .where(sql`${sema.visszajelzes.id} IN ${sql.raw(`(${[...hivatkozott].map((x) => `'${x}'`).join(",")})`)}`);
    }

    await csomagFajlbaIr(csomag).catch((h) => console.warn("[visszajelzes] csomag fajl:", h));
    await listaFajlbaIr(await lista({ szervezetId: null })).catch((h) => console.warn("[visszajelzes] lista fajl:", h)); // R18 2. kör: megvárjuk — a válasz után a fájl már a friss listát tartalmazza (a visszajelzes-export próba eddig versenyhelyzetben olvasott); hibát nem dob, a válasz nem változik
    return { ok: true, csomag };
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    // A hibás hívást is mérjük (a mérés a legközelebbi szervezetre kerül).
    if (meresSzervezet) await meresRogzit(meresSzervezet, {
      szolgaltato: sz.leirolap.azonosito,
      modell: sz.leirolap.modell,
      feladat: "javitocsomag",
      tokenek_be: 0,
      tokenek_ki: 0,
      becsult_usd: 0,
      ido_ms: Date.now() - t0,
      allapot: "hiba",
      hiba_kod: kod,
    });
    if (kod === "AI_KERET_KIMERULT") return { ok: false, hiba: "AI_KERET_KIMERULT" };
    if (kod === "AI_ROSSZ_VALASZ") return { ok: false, hiba: "AI_ROSSZ_VALASZ" };
    return { ok: false, hiba: "AI_NEM_ELERHETO" };
  }
}

/** A javítócsomagok listája, nap szerint csökkenő. */
export async function csomagok(limit = 30): Promise<JavitoCsomag[]> {
  const sorok = await db()
    .select()
    .from(sema.javitoCsomag)
    .orderBy(desc(sema.javitoCsomag.nap), desc(sema.javitoCsomag.letrehozva))
    .limit(limit);
  return sorok.map((s) => ({
    id: s.id,
    nap: s.nap,
    osszefoglalo: s.osszefoglalo,
    tetelek: s.tetelek as JavitoCsomag["tetelek"],
    visszajelzes_db: s.visszajelzesDb,
    letrehozva: s.letrehozva.toISOString(),
  }));
}

/** Egy tétel állapotának váltása (olvas–módosít–ír a jsonb `tetelek` mezőn). */
export async function csomagTetelAllapot(
  csomagId: string,
  tetelId: string,
  allapot: JavitoTetelAllapot,
): Promise<boolean> {
  const [sor] = await db()
    .select({ tetelek: sema.javitoCsomag.tetelek })
    .from(sema.javitoCsomag)
    .where(eq(sema.javitoCsomag.id, csomagId))
    .limit(1);
  if (!sor) return false;
  const tetelek = sor.tetelek as JavitoCsomag["tetelek"];
  let talalt = false;
  const uj = tetelek.map((t) => {
    if (t.id !== tetelId) return t;
    talalt = true;
    return { ...t, allapot };
  });
  if (!talalt) return false;
  await db()
    .update(sema.javitoCsomag)
    .set({ tetelek: uj })
    .where(eq(sema.javitoCsomag.id, csomagId));
  return true;
}

// c1 + c7: a napi hub-összesítő és a reggeli Telegram-üzenet (a futtató hívja percenként).
export { ertesitesekTick } from "./ertesites";

/** c7 a Kezdőlapon (R-15 c5 2. kör, design/R15/rajz/R15-lapok-5.dc.html 03j/03j2; gepezet-5 6; kerdesek-5 16–17): a belépett ember
 *  SAJÁT, nem névtelen jelzései az AKTUÁLIS szervezetben, amelyek az elmúlt 24 órában lettek „kész”-ek (0154 `kesz_ido`), a legújabb elöl,
 *  legfeljebb 5. A `visszajelzes` táblán nincs sorszintű védelem (lásd fent) — ezért a személy ÉS a szervezet szűrése itt, az SQL-ben van
 *  (A-11). A `lap` csak belső útvonalként megy ki (`/`-rel kezdődik, nem `//`), különben null — a felület linket csak abból csinál. */
export type SajatJavitott = { szoveg: string; lap: string | null; lap_cim: string };
export async function sajatJavitott(fiokId: string, szervezetId: string, most: Date = new Date()): Promise<SajatJavitott[]> {
  const tol = new Date(most.getTime() - 24 * 60 * 60 * 1000);
  const sorok = await db()
    .select({ szoveg: sema.visszajelzes.szoveg, lap: sema.visszajelzes.lap, lap_cim: sema.visszajelzes.lapCim })
    .from(sema.visszajelzes)
    .where(and(
      eq(sema.visszajelzes.fiokId, fiokId),
      eq(sema.visszajelzes.szervezetId, szervezetId),
      eq(sema.visszajelzes.nevtelen, false),
      eq(sema.visszajelzes.allapot, "kesz"),
      sql`${sema.visszajelzes.keszIdo} > ${tol.toISOString()}`,
      sql`${sema.visszajelzes.keszIdo} <= ${most.toISOString()}`,
    ))
    .orderBy(desc(sema.visszajelzes.keszIdo))
    .limit(5);
  return sorok.map((x) => ({ szoveg: x.szoveg, lap: belsoUt(x.lap), lap_cim: x.lap_cim }));
}
/** Csak saját, belső útvonal: „/valami” — nem „//másik.hely”, nem „/\…”, nem séma. */
export function belsoUt(lap: string): string | null {
  const l = lap.trim();
  return /^\/(?![\/\\])[^\s]*$/.test(l) ? l : null;
}

// A `szervezetKent` importja a jövőbeli szervezet-szintű bővítéshez marad (a modul jelenleg rendszer-szintű).
void szervezetKent;
