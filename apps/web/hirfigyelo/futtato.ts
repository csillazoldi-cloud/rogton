import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { Idozites, ertekelesUjra, figyelesFuttat, javaslatKiprobal } from "@rogton/news-monitor-core";

import { esedekes } from "@rogton/news-monitor-core";
import { db, sema } from "../adatbazis/kapcsolat";
import { kornyezet } from "./index";
import { profilBetolt } from "../profil";
import { beragadtakElenged, haladasIr, hibara, indulaskorElenged, kovetkezoKivesz, lezar, sorbaTesz, type SorTetel } from "./sor";
import { oraiTakaritas } from "../hitelesites/takaritas";
import { albumHasznalatPosztokbol, albumKoltoztet } from "../album";
import { ertesitesekTick, napiCsomagKeszit } from "../visszajelzes";
import { osszkepTorol } from "./osszkep";

// A sor 15 perc után „beragadtnak” tekint egy tételt. A futás ennél EGY PERCCEL korábbi határidőt kap,
// hogy magától fejezze be és mentse, amit addig elért — különben a tétel lejárna, a munka pedig gazdátlanul futna tovább
// (mérve 2026-09-08: a lejárt tétel után még 12 percig ment az AI-hívás).
const FUTAS_HATARIDO_PERC = 14;
function hatarido(): Date {
  return new Date(Date.now() + FUTAS_HATARIDO_PERC * 60 * 1000);
}

// A Hírfigyelő futtatója (E-22): az alkalmazás saját folyamatában él (instrumentation.ts),
// 5 másodpercenként egy tick. Egyszerre EGY munka fut az egész rendszerben.

export const RENDSZER_FIOK = "00000000-0000-4000-8000-000000000000";

// Egypéldányosság: a Next több csomagban is betöltheti — a globalThis-en egyszer indul.
declare global {
  // eslint-disable-next-line no-var
  var __kmHfFuttato: { leallit: () => void } | undefined;
}

/** A napi ütemezés ellenőrzése és sorba tevése (percenként egyszer). */
async function napiUtemezes(most: Date): Promise<void> {
  // A napi ütemezések a hf_napi_utemezesek() függvényből (SECURITY DEFINER): a futtató a sorszintű védelem alól
  // csak ezt a szűk listát látja — szervezet, időzítés, az utolsó napi futás kezdete. (A km_app közvetlenül nem olvashatná
  // a hf_beallitas_verzio-t szervezet-kontextus nélkül.)
  const d = db();
  const sorok = (await d.execute(sql`SELECT szervezet_id, idozites, utolso_napi FROM hf_napi_utemezesek()`)).rows as { szervezet_id: string; idozites: unknown; utolso_napi: string | Date | null }[];
  for (const sor of sorok) {
    const e = Idozites.safeParse(sor.idozites);
    if (!e.success || e.data.mod !== "napi") continue;
    const utolso = sor.utolso_napi ? new Date(sor.utolso_napi) : null;
    if (!esedekes(e.data, utolso, most)) continue;
    // Ma (a zónában) még nem került sorba napi tétel (az esedekes() a KEZDETT futásokat nézi; a még várakozót itt)
    const maFutott = (
      await d
        .select({ id: sema.hfSor.id })
        .from(sema.hfSor)
        .where(sql`${sema.hfSor.szervezetId} = ${sor.szervezet_id} AND ${sema.hfSor.fajta} = 'napi' AND ${sema.hfSor.letrehozva} >= ${maKeZDete(most, e.data)}`)
        .limit(1)
    )[0];
    if (maFutott) continue;
    await sorbaTesz(sor.szervezet_id, "napi", {});
  }
}

/** A mai nap kezdete a zónában (a napi futás ellenőrzéséhez). */
function maKeZDete(most: Date, idozites: Idozites): Date {
  const zona = idozites.idozona || "Europe/Bucharest";
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const r = fmt.formatToParts(most);
  const g = (t: string) => Number(r.find((x) => x.type === t)?.value ?? "0");
  const ev = g("year"), ho = g("month"), nap = g("day");
  // A zóna „helyi” éjfél UTC-ben: a fali időt UTC-ként értelmezzük, majd levonjuk az eltolást
  const eltolas = (d: Date) => {
    const r2 = fmt.formatToParts(d);
    const g2 = (t: string) => Number(r2.find((x) => x.type === t)?.value ?? "0");
    return Date.UTC(g2("year"), g2("month") - 1, g2("day"), g2("hour"), g2("minute"), g2("second")) - d.getTime();
  };
  const faliEjjfel = Date.UTC(ev, ho - 1, nap, 0, 0, 0);
  let cel = new Date(faliEjjfel - eltolas(most));
  cel = new Date(faliEjjfel - eltolas(cel));
  return cel;
}

/** Óránkénti takarítás: melyik óra volt az utolsó. A folyamat memóriájában elég — ha újraindul, egyszer többet takarít. */
let utolsoTakaritottOra = -1;
let utolsoCsomagOra = -1; // V1: a napi javítócsomag órája
// V5b: a napi csomag újrapróbája — ha a csomag hibára futott, 10 perc múlva egyszer újra.
let csomagUjraProba: number | null = null;
let csomagUjraProbaNap: string | null = null;

/** Egy tick: beragadtak elengedése, ÓRÁNKÉNTI TAKARÍTÁS, napi ütemezés, egy tétel feldolgozása. */
async function tick(): Promise<void> {
  const most = new Date();
  try {
    await beragadtakElenged(most);
  } catch (h) {
    console.error("[hirfigyelo-futtato] beragadtakElenged hiba:", h);
  }

  // E-34: takarítás óránként egyszer (az óra első percének első tickjén) — lejárt munkamenetek,
  // felhasznált visszaállító jegyek, régi belépési kísérletek.
  if (most.getMinutes() === 0 && most.getSeconds() < 5 && most.getHours() !== utolsoTakaritottOra) {
    utolsoTakaritottOra = most.getHours();
    try {
      const t = await oraiTakaritas(most);
      if (t.munkamenet + t.jegy + t.naplo + t.esemeny > 0) {
        console.log(`[hirfigyelo-futtato] takaritas: ${t.munkamenet} munkamenet, ${t.jegy} jegy, ${t.naplo} naplosor, ${t.esemeny} esemeny (30 nap, T-24)`);
      }
    } catch (h) {
      console.error("[hirfigyelo-futtato] takaritas hiba:", h);
    }
    // c30 F9, D7: a 30 napos albumfotók a _torolni/ alá (nem törlünk; mentés nincs) — külön próbálva, hogy a takarítást ne vigye magával
    try {
      const a = await albumKoltoztet(most, albumHasznalatPosztokbol); // c30 F10: a posztok fotói a „Kitettem” / az utolsó használat után 30 nappal
      if (a.koltozott > 0) console.log(`[hirfigyelo-futtato] album: ${a.koltozott} fotó a _torolni/ alá (30 nap, D7)`);
    } catch (h) {
      console.error("[hirfigyelo-futtato] album költöztetés hiba:", h);
    }
  }

  // Napi javítócsomag 05:00-kor Europe/Bucharest szerint (a doboz órája UTC lehet).
  // A helyi 05:00 nyáron 02 UTC, télen 03 UTC — ezért a helyi órát nézzük.
  const helyiOra = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Europe/Bucharest",
  }).format(most);
  if (helyiOra === "05" && most.getMinutes() === 0 && most.getSeconds() < 5 && most.getHours() !== utolsoCsomagOra) {
    utolsoCsomagOra = most.getHours();
    const tegnapKulcs = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Bucharest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(most.getTime() - 24 * 60 * 60 * 1000));
    try {
      const c = await napiCsomagKeszit(tegnapKulcs, "hu");
      if (c.ok) {
        console.log(`[visszajelzes] napi csomag: ${c.csomag ? c.csomag.id : "nincs mit osszesiteni"} (${tegnapKulcs})`);
      } else {
        console.warn(`[visszajelzes] napi csomag: ${c.hiba} (${tegnapKulcs})`);
        csomagUjraProba = Date.now() + 10 * 60_000;
        csomagUjraProbaNap = tegnapKulcs;
      }
    } catch (h) {
      console.warn("[visszajelzes] napi csomag:", h);
      csomagUjraProba = Date.now() + 10 * 60_000;
      csomagUjraProbaNap = tegnapKulcs;
    }
  }

  // V5b: a hibás napi csomag egyszeri újrapróbája (10 perc után, ugyanarra a napra).
  if (csomagUjraProba !== null && Date.now() >= csomagUjraProba && csomagUjraProbaNap !== null) {
    const nap = csomagUjraProbaNap;
    csomagUjraProba = null;
    csomagUjraProbaNap = null;
    try {
      const c = await napiCsomagKeszit(nap, "hu");
      if (c.ok) {
        console.log(`[visszajelzes] napi csomag (ujraproba): ${c.csomag ? c.csomag.id : "nincs mit osszesiteni"} (${nap})`);
      } else {
        console.warn(`[visszajelzes] napi csomag (ujraproba): ${c.hiba} (${nap})`);
      }
    } catch (h) {
      console.warn("[visszajelzes] napi csomag (ujraproba):", h);
    }
  }

  // c1 + c7: 02:00 hub-összesítő, 08:00 „Tegnap javítva” Telegram-üzenet — percenként egyszer nézi, naponta egyszer küld (soha nem dob)
  if (most.getSeconds() < 5) {
    await ertesitesekTick(most).catch((h) => console.warn("[visszajelzes] ertesitesek:", h));
  }

  // Napi ütemezés percenként egyszer (a perc első tickjén)
  if (most.getSeconds() < 5) {
    try {
      await napiUtemezes(most);
    } catch (h) {
      console.error("[hirfigyelo-futtato] napiUtemezes hiba:", h);
    }
  }

  let tetel: Awaited<ReturnType<typeof kovetkezoKivesz>>;
  try {
    tetel = await kovetkezoKivesz();
  } catch (h) {
    // pl. a tábla még nincs meg (induláskor a migráció előtt) — a következő tick újra próbálja
    console.error("[hirfigyelo-futtato] kovetkezoKivesz hiba:", h instanceof Error ? h.message : h);
    return;
  }
  if (!tetel) return;

  try {
    await feldolgoz(tetel);
  } catch (h) {
    console.error(`[hirfigyelo-futtato] tetel hiba (${tetel.id}):`, h);
    await hibara(tetel.id, h instanceof Error ? h.message : "ismeretlen_hiba").catch((h2) =>
      console.error("[hirfigyelo-futtato] hibara hiba:", h2),
    );
  }
}

/**
 * A tétel válasznyelve (E-29c): amit a futást INDÍTÓ ember választott a felületen; a napi (automatikus)
 * futásnál a szervezet tulajdonosáé. Ha egyik sincs, magyar.
 */
async function tetelNyelve(tetel: SorTetel): Promise<"hu" | "ro" | "en"> {
  // F10-M1 (Vilmos, 2026-09-16: „Tartalomnyelvek: magyar" — a hírek mégis románul jöttek): a szervezet profiljának
  // ELSŐ tartalomnyelve dönt, nem a kérést küldő felhasználó felületi nyelve; csak ha a profil nem mond nyelvet, jön a kérésé, majd a tulajdonosé.
  try {
    const profil = await profilBetolt(tetel.szervezetId);
    const elso = profil?.nyelvek?.[0];
    if (elso === "hu" || elso === "ro" || elso === "en") return elso;
  } catch (h) {
    console.error("[hirfigyelo-futtato] profil nyelve:", h);
  }
  const megadott = (tetel.adat as { nyelv?: unknown }).nyelv;
  if (megadott === "hu" || megadott === "ro" || megadott === "en") return megadott;
  try {
    const sorok = await db()
      .select({ nyelv: sema.fiok.nyelv })
      .from(sema.tagsag)
      .innerJoin(sema.fiok, eq(sema.fiok.id, sema.tagsag.fiokId))
      .where(and(eq(sema.tagsag.szervezetId, tetel.szervezetId), eq(sema.tagsag.szerep, "tulajdonos")))
      .limit(1);
    const ny = sorok[0]?.nyelv;
    if (ny === "hu" || ny === "ro" || ny === "en") return ny;
  } catch (h) {
    console.error("[hirfigyelo-futtato] tulajdonos nyelve nem olvasható:", h);
  }
  return "hu";
}

/** 2026-09-22: újraszűrés sorba tétele (a futás után, vagy ha az előző újraszűrés nem végzett). Hiba nem állítja meg a futtatót. */
async function ujraszuresSorba(tetel: SorTetel): Promise<void> {
  try {
    await sorbaTesz(tetel.szervezetId, "ertekeles_ujra", { nyelv: (tetel.adat as { nyelv?: string }).nyelv ?? "hu", automatikus: true });
  } catch (h) {
    console.error("[hirfigyelo-futtato] ujraszures sorba:", h);
  }
}

/** R-15 (gepezet 1): a gyűjtés / újraszűrés után a gép megírja a posztot minden érdekes hírhez. Hiba nem állítja meg a futtatót. */
async function hirekbolPosztok(szervezetId: string): Promise<void> {
  try {
    const { posztokatIrHirekbol } = await import("../r15");
    await posztokatIrHirekbol(szervezetId);
  } catch (h) {
    console.error("[hirfigyelo-futtato] posztok hírekből:", h);
  }
}

/** Egy tétel feldolgozása a fajta szerint. */
async function feldolgoz(tetel: SorTetel): Promise<void> {
  // R-13: a kipróbálást egy ember kérte — az ő kreditjéből és az ő szűrő-szemével; a futás/újraszűrés kreditje megoszlik
  const kero = tetel.fajta === "kiprobal" ? (tetel.adat as { fiok_id?: string }).fiok_id : undefined;
  const k = await kornyezet(tetel.szervezetId, await tetelNyelve(tetel), kero, kero ? { fizeto: kero } : {});
  k.haladas = async (h) => { try { await haladasIr(tetel.id, h); } catch (hiba) { console.error("[hirfigyelo-futtato] haladas:", hiba); } }; // F9-A3: a haladás a sor tételére — hiba nem állítja meg a futást
  const ktx = {
    fiok_id: RENDSZER_FIOK,
    szervezet_id: tetel.szervezetId,
    szerep: "tulajdonos" as const,
  };
  const proba = (tetel.adat as { proba?: boolean }).proba ?? false;

  let futasId: string | undefined;
  switch (tetel.fajta) {
    case "futas": {
      const e = await figyelesFuttat(k, ktx, { proba, hatarido: hatarido() });
      if (e.ok) {
        futasId = e.futas.id;
        await lezar(tetel.id, { futas_id: futasId });
        await ujraszuresSorba(tetel); // 2026-09-22: a függők és a régi szűrővel értékeltek újraszűrése
        if (!proba) await hirekbolPosztok(tetel.szervezetId);
      } else {
        await hibara(tetel.id, e.hiba);
      }
      break;
    }
    case "ertekeles_ujra": {
      const e = await ertekelesUjra(k, ktx, { hatarido: hatarido() });
      if (e.ok) {
        await lezar(tetel.id, { ujra_ertekelt: e.ujraErtekelt });
        // 2026-09-22: más hírek maradtak meg → a tárolt összkép már nem igaz; ha maradt még újraszűrendő, folytatjuk
        if (e.ujraErtekelt > 0) await osszkepTorol(tetel.szervezetId).catch((h) => console.error("[hirfigyelo-futtato] osszkep torles:", h));
        if (e.maradt > 0) await ujraszuresSorba(tetel);
        else await hirekbolPosztok(tetel.szervezetId);
      } else {
        await hibara(tetel.id, e.hiba);
      }
      break;
    }
    case "kiprobal": {
      // A javaslat kipróbálása ugyanazon a mintán: cikkenként egy AI-hívás → a háttérben (E-26); az eredmény a tételen
      const javaslatId = (tetel.adat as { javaslat_id?: string }).javaslat_id ?? "";
      const e = await javaslatKiprobal(k, ktx, javaslatId);
      if (e.ok) {
        await lezar(tetel.id, { javaslat_id: javaslatId, osszehasonlitas: e.osszehasonlitas });
      } else {
        await hibara(tetel.id, e.hiba);
      }
      break;
    }
    case "napi": {
      // A napi futás: a beállítás szerinti figyelesFuttat (proba nélkül)
      const e = await figyelesFuttat(k, ktx, { proba: false, hatarido: hatarido() });
      if (e.ok) {
        futasId = e.futas.id;
        await lezar(tetel.id, { futas_id: futasId });
        await ujraszuresSorba(tetel);
        await hirekbolPosztok(tetel.szervezetId);
      } else {
        await hibara(tetel.id, e.hiba);
      }
      break;
    }
  }
}

/** A futtató elindítása; visszaadja a leállító függvényt. */
export function futtatoIndit(): () => void {
  if (process.env["HF_FUTTATO"] === "0") return () => {};
  if (globalThis.__kmHfFuttato) return globalThis.__kmHfFuttato.leallit;

  const ido = setInterval(() => {
    void tick();
  }, 5000);
  const leallit = () => clearInterval(ido);
  globalThis.__kmHfFuttato = { leallit };
  console.log("[hirfigyelo-futtato] elindult (5 mp-es tick)");
  // T-21: a régi folyamat „fut" tételei az induláskor elengednek — a kirakás megszakította őket, várni rájuk nincs értelme
  void indulaskorElenged(new Date())
    .then((n) => { if (n > 0) console.log(`[hirfigyelo-futtato] indulaskor elengedett beragadt tetel: ${n}`); })
    .catch((h) => console.error("[hirfigyelo-futtato] indulaskorElenged hiba:", h));
  return leallit;
}
