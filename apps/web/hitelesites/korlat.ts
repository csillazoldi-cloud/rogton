// Sebességkorlát a belépésre, a regisztrációra és a jelszó-visszaállításra (E-34).
//
// MIÉRT ÍGY: D-17 (2026-09-08) szerint a regisztráció NYITVA marad, tehát ez a fő védelem,
// nem kényelmi funkció. Adatbázisban számolunk (nem a folyamat memóriájában), mert:
//   - a doboz újraindítása nem törölheti el a számlálót (különben az újraindítás megkerüli a védelmet),
//   - a kísérletek naplója EGYBEN hozzáférésnapló is: ki, mikor, honnan próbálkozott.
//
// KÉT KÜLÖN SZÁMLÁLÓ, mert két különböző támadást fognak meg:
//   fiók szerint  — egy adott e-mail jelszavának próbálgatása (akár sok címről),
//   cím szerint   — egy gép, ami sok fiókot próbál (vagy tömegesen regisztrál).
// A szigorúbb dönt: ha bármelyik betelt, a kérés elutasításra kerül.
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db, sema } from "../adatbazis/kapcsolat";

export type KiserletFajta = "belepes" | "regisztracio" | "jelszo_visszaallitas" | "visszajelzes";

/** Egy korlát: hány kísérlet fér bele ennyi percbe. */
type Korlat = { darab: number; ablakPerc: number };

/**
 * A korlátok. Szándékosan bőkezűek annyira, hogy egy elgépelő ember ne akadjon fenn rajtuk,
 * és szigorúak annyira, hogy a próbálgatás ne legyen kifizetődő.
 *
 * Belépés fiók szerint: 5 rossz jelszó 15 perc alatt. Egy ember 5-nél többször nem gépel el egy jelszót;
 * egy próbálgató 15 percenként 5 tippet kap, ami használhatatlanul lassú.
 * Belépés cím szerint: 20 rossz kísérlet 15 perc alatt — így egy iroda közös címéről többen is hibázhatnak.
 * Regisztráció cím szerint: 20 új fiók óránként. MÉRT ÉRTÉK, nem tipp: 5-tel indultunk, és a saját
 * próbakészletünk azonnal fennakadt rajta — ugyanazt csinálná egy iroda, ahol többen egy címről néznék meg
 * a rendszert. 20/óra egy címről még mindig használhatatlanul lassú tömeges fióknyitáshoz, viszont
 * élő emberek nem akadnak fenn rajta. (Az üres fiókok kára korlátozott: az AI-keret külön, globális fék.)
 */
export const KORLATOK: Record<KiserletFajta, { fiok?: Korlat; cim: Korlat; csakSikertelen: boolean }> = {
  // Belépésnél a SIKERTELEN kísérletet számoljuk: aki tudja a jelszavát, annyiszor lép be, ahányszor akar.
  belepes: { fiok: { darab: 5, ablakPerc: 15 }, cim: { darab: 20, ablakPerc: 15 }, csakSikertelen: true },
  // Regisztrációnál MINDEN kísérlet számít, a sikeres is: itt nem a találgatást fogjuk meg,
  // hanem a tömeges fióknyitást. (Ha csak a sikerteleneket néznénk, a fióknyitás korlátlan maradna.)
  regisztracio: { cim: { darab: 20, ablakPerc: 60 }, csakSikertelen: false },
  jelszo_visszaallitas: { fiok: { darab: 5, ablakPerc: 15 }, cim: { darab: 20, ablakPerc: 15 }, csakSikertelen: true },
  // 0148 (Kati 10-02, Csilla 10-06): NÉVTELEN visszajelzés a belépés előtti lapokról. Mint a regisztrációnál: MINDEN kísérlet számít
  // (a sikeres is), cím szerint — itt nincs fiók, amire számolni lehetne. 10 / óra egy címről: egy tesztelő ennyit nem ír egy óra alatt
  // a belépőlapról, egy szemetelőnek viszont használhatatlanul lassú (és a méretkorlát miatt soronként legfeljebb ~0,4 MB).
  visszajelzes: { cim: { darab: 10, ablakPerc: 60 }, csakSikertelen: false },
};

/** A kísérletnapló megőrzési ideje. Ennél régebbi sorokat a takarítás eldob. */
export const NAPLO_MEGORZES_NAP = 30;

/**
 * Hány MEGBÍZHATÓ fordított proxy van a rendszer előtt. A tesztkörnyezetben kettő:
 * a Synology fordított proxya és a saját nginx dobozunk. Környezeti változóval igazítható,
 * mert ezt a kirakáskor MÉRNI kell, nem feltételezni (lásd `docs/UZEMELTETES.md`).
 */
export function megbizhatoProxyDb(): number {
  const nyers = Number(process.env["MEGBIZHATO_PROXY_DB"] ?? "2");
  return Number.isFinite(nyers) && nyers >= 1 ? Math.floor(nyers) : 2;
}

/**
 * A kérő címe az `x-forwarded-for` listából.
 *
 * FIGYELEM — ez a rész könnyen elrontható, ezért kimondom, miért így van:
 * a mi nginxünk `$proxy_add_x_forwarded_for`-t használ, ami HOZZÁFŰZ a meglévő fejléchez.
 * Ezért a lista ELEJE olyan érték, amit maga a kérő is beírhatott — vagyis HAMISÍTHATÓ.
 * A lista VÉGE viszont a mi proxyjainktól származik, azt a kérő nem tudja befolyásolni.
 * Ezért JOBBRÓL számolunk: a megbízható proxyk számától visszalépve kapjuk a valódi címet.
 *
 * Ha a lista RÖVIDEBB, mint a proxyk száma (rosszul beállított proxyszám), akkor a JOBB SZÉLSŐ
 * elemet vesszük, nem a balt: azt a saját proxynk írta, tehát nem hamisítható. Ilyenkor sok kérő
 * ugyanazt a címet kapja (a korlát túl szigorú lesz) — ez viszont a biztonságos irányba téved.
 *
 * ÉS A LÉNYEG: a cím szerinti korlát ettől függetlenül is csak MÁSODIK védelmi vonal.
 * A FIÓK szerinti korlát az, ami hamisítással nem kerülhető meg — az e-mail a kérés törzséből jön.
 */
export function keresCime(fejlecek: Headers, proxyDb: number = megbizhatoProxyDb()): string {
  const tovabbitott = fejlecek.get("x-forwarded-for");
  if (tovabbitott) {
    const lista = tovabbitott.split(",").map((r) => r.trim()).filter((r) => r !== "");
    if (lista.length > 0) {
      // pl. 2 megbízható proxynál a hátulról MÁSODIK elem a valódi kérő
      const index = lista.length - proxyDb;
      const ertek = index >= 0 ? lista[index] : lista[lista.length - 1];
      if (ertek) return ertek.slice(0, 100);
    }
  }
  const valos = fejlecek.get("x-real-ip")?.trim();
  if (valos) return valos.slice(0, 100);
  return "ismeretlen";
}

function ablakKezdet(perc: number, most: Date): Date {
  return new Date(most.getTime() - perc * 60 * 1000);
}

/**
 * Kísérletek száma egy e-mailre az ablakon belül.
 *
 * FONTOS: a sikeres belépés NEM TÖRÖL naplósorokat — a napló hozzáférésnapló is, azt nem
 * törölheti az, akiről szól. Helyette a számláló csak az UTOLSÓ SIKER ÓTA nézi a sikerteleneket.
 * Ugyanaz az eredmény (aki eltalálta a jelszavát, tiszta lappal indul), de a napló sértetlen marad.
 */
async function fiokSzamlalo(
  fajta: KiserletFajta,
  email: string,
  ablakPerc: number,
  csakSikertelen: boolean,
  most: Date,
): Promise<number> {
  const ablak = ablakKezdet(ablakPerc, most);
  const feltetelek = [
    eq(sema.belepesiKiserlet.fajta, fajta),
    eq(sema.belepesiKiserlet.email, email),
    gte(sema.belepesiKiserlet.ido, ablak),
  ];
  if (csakSikertelen) {
    feltetelek.push(eq(sema.belepesiKiserlet.sikeres, false));
    // csak az utolsó sikeres kísérlet UTÁNI sorok számítanak
    feltetelek.push(
      sql`${sema.belepesiKiserlet.ido} > coalesce((
        SELECT max(k.ido) FROM belepesi_kiserlet k
        WHERE k.fajta = ${fajta} AND k.email = ${email} AND k.sikeres = true AND k.ido >= ${ablak}
      ), ${ablak})`,
    );
  }
  const sorok = await db()
    .select({ db: sql<number>`count(*)::int` })
    .from(sema.belepesiKiserlet)
    .where(and(...feltetelek));
  return sorok[0]?.db ?? 0;
}

/** Kísérletek száma egy címről az ablakon belül. Ismeretlen cím nem számolható — azt átengedjük. */
async function cimSzamlalo(
  fajta: KiserletFajta,
  cim: string,
  ablakPerc: number,
  csakSikertelen: boolean,
  most: Date,
): Promise<number> {
  if (cim === "ismeretlen") return 0;
  const feltetelek = [
    eq(sema.belepesiKiserlet.fajta, fajta),
    eq(sema.belepesiKiserlet.cim, cim),
    gte(sema.belepesiKiserlet.ido, ablakKezdet(ablakPerc, most)),
  ];
  if (csakSikertelen) feltetelek.push(eq(sema.belepesiKiserlet.sikeres, false));
  const sorok = await db()
    .select({ db: sql<number>`count(*)::int` })
    .from(sema.belepesiKiserlet)
    .where(and(...feltetelek));
  return sorok[0]?.db ?? 0;
}

export type KorlatAllas = { szabad: true } | { szabad: false; ok: "fiok" | "cim"; ujraPerc: number };

/**
 * Betelt-e valamelyik korlát? A szigorúbb dönt.
 * A hívó ezt a kérés FELDOLGOZÁSA ELŐTT hívja — a lassú jelszó-ellenőrzés (argon2) el se induljon.
 */
export async function korlatEllenoriz(
  fajta: KiserletFajta,
  email: string | null,
  cim: string,
  most: Date = new Date(),
): Promise<KorlatAllas> {
  const korlat = KORLATOK[fajta];

  if (korlat.fiok && email) {
    const db = await fiokSzamlalo(fajta, email, korlat.fiok.ablakPerc, korlat.csakSikertelen, most);
    if (db >= korlat.fiok.darab) return { szabad: false, ok: "fiok", ujraPerc: korlat.fiok.ablakPerc };
  }
  const cimDb = await cimSzamlalo(fajta, cim, korlat.cim.ablakPerc, korlat.csakSikertelen, most);
  if (cimDb >= korlat.cim.darab) return { szabad: false, ok: "cim", ujraPerc: korlat.cim.ablakPerc };

  return { szabad: true };
}

/** Egy kísérlet naplózása. Ez adja a számlálót ÉS a hozzáférésnaplót is. */
export async function kiserletNaplo(
  fajta: KiserletFajta,
  email: string | null,
  cim: string,
  sikeres: boolean,
): Promise<void> {
  await db()
    .insert(sema.belepesiKiserlet)
    .values({ fajta, email: email?.trim().toLowerCase() ?? null, cim, sikeres });
}

/** A napló takarítása: a megőrzési időnél régebbi sorok eldobása. A háttérfuttató hívja, óránként. */
export async function naploTakarit(most: Date = new Date()): Promise<number> {
  const hatar = new Date(most.getTime() - NAPLO_MEGORZES_NAP * 24 * 60 * 60 * 1000);
  const eredmeny = await db().delete(sema.belepesiKiserlet).where(lt(sema.belepesiKiserlet.ido, hatar));
  return eredmeny.rowCount ?? 0;
}
