// A modul folyamatai: a mag vezérli, a host csak a csatlakozókat adja.
import type { Beallitas, BeallitasVerzio } from "./beallitas";
import { aktivVerzio, beallitasNormalizal, ujVerzio, visszaallit } from "./beallitas";
import type { Forras } from "./forras";
import { forrasCimOsztalyoz, forrasEllenorzesEredmeny } from "./forras";
import type { Kivonat } from "./kivonat";
import { kivonatKeszit } from "./kivonat";
import type { Talalat, Esemeny, Fontossag, Ertekeles } from "./talalat";
import { jelol, megtekint, SZURO_VERZIO, szuroElavult, kiszurt } from "./talalat";
import { esemenybeSorol, gyanusPar } from "./dedup";
import type { Futas } from "./futas";
import { cikkFrissesseg, futasAtmenet, indithato, kovetkezoFutas, utolsoSikeres } from "./futas";
import type { Minta } from "./minta";
import { mintaKeszit, mintaLejart, osszehasonlithato, osszehasonlitas, type ErtekelesSor } from "./minta";
import type { SzabalyJavaslat, Visszajelzes } from "./visszajelzes";
import { javaslatAlkalmazhato, javaslatDontes } from "./visszajelzes";
import { aiValaszEllenoriz, helyOk, promptAdatBlokk, type HfFeladat, type RelevanciaValasz, type SzabalyJavaslatValasz, type UgyanazValasz, type TartalomotletValasz } from "./ai";
import type { AiHivo, FutasHaladas, HirfigyeloEsemeny, HostKontextus } from "./host";
import { jogosult } from "./host";
import type { HirfigyeloTar } from "./tar";
import type { ForrasTipus } from "./forras";
import { kartyakEpitReszletes, type Kartya } from "./kartya";
import { eloszur, eloszurtErtekeles } from "./eloszuro";
import { cegnevTemakNelkul } from "./tema-nev-szuro";
import { szakmaiForrasCim } from "./forras-lista";
import { fokozatSzerint, kinekKell, nezoSzerint, type EloTenyek, type TagSzures } from "./tag-szures";

/**
 * A relevancia-válaszból a tárolt értékelés (v12, R-13): a fontosság a LEGENGEDÉKENYEBB fokozaté (a modell így adja;
 * a kód csak azt vágja, aminek sem fő, sem érintett témája nincs), mellette a tények, amelyekből a program tagonként
 * dönt (`nezoSzerint`): rola_szol, fo_tema, erintett_tema, hely_ok (a helyfeltétel a kódban), elo (előszűrő).
 * Azonos nyelvnél a cím marad (F10-M1).
 */
export function relevanciabolErtekeles(
  r: RelevanciaValasz,
  kivonat: { cim: string; szoveg: string; nyelv: string | null; csonkolt: boolean },
  tartalomNyelv: string | undefined,
  szabalyVerzio: number,
  most: Date,
  elo: EloTenyek | null = null,
  /** J-1g2: szakmai oldalról jött cikk — a helyfeltétel nem vonatkozik rá. */
  helyNelkul = false,
): Ertekeles {
  const nincsTema = r.rola_szol !== true && r.fo_tema !== undefined && r.fo_tema === "" && (r.erintett_tema ?? "") === "";
  const fontossag = r.fontossag !== "hatter" && nincsTema ? "hatter" : r.fontossag;
  return {
    fontossag,
    temacimke: r.temacimke,
    miert: r.miert,
    indoklas: r.indoklas,
    osszefoglalo: r.osszefoglalo,
    cim_forditott: tartalomNyelv && kivonat.nyelv === tartalomNyelv ? kivonat.cim : r.cim_forditott,
    cegednek: fontossag === "hatter" ? "" : r.cegednek,
    vevoidnek: fontossag === "hatter" ? "" : r.vevoidnek,
    szabaly_verzio: szabalyVerzio,
    ertekelve: most.toISOString(),
    csonkolt_alapjan: kivonat.csonkolt,
    szuro_verzio: SZURO_VERZIO,
    ...(r.fo_tema !== undefined ? { fo_tema: r.fo_tema } : {}),
    ...(r.erintett_tema !== undefined ? { erintett_tema: r.erintett_tema } : {}),
    ...(r.rola_szol !== undefined ? { rola_szol: r.rola_szol } : {}),
    ...(r.helyszin !== undefined ? { helyszin: r.helyszin } : {}),
    ...(r.hatokor !== undefined ? { hatokor: r.hatokor } : {}),
    ...(r.hely_idezet !== undefined ? { hely_idezet: r.hely_idezet } : {}),
    hely_ok: helyNelkul || helyOk(r, kivonat),
    ...(fontossag !== r.fontossag ? { kiszurve: "tema" as const } : {}),
    elo,
  };
}

/** Napi cikk-korlát: legfeljebb ennyi új cikk értékelése futásonként. */
export const HF_NAPI_CIKK = 60;
/** 2026-09-22: egy újraszűrésben legfeljebb ennyi régi értékelés megy újra (a szigorúbb szűrő bevezetésekor). */
export const HF_UJRASZURES_MAX = 150;

/**
 * Biztonsági fék: legfeljebb ennyi AI-összehasonlítás egy futásban.
 * A gyanús párok száma a cikkszám NÉGYZETÉVEL nőhet, és egy rossz forrás (üres cikkek → azonos ujjlenyomat)
 * minden párt gyanússá tesz. Mérve 2026-09-08: 32 üres cikk = 496 AI-hívás, 27 perc.
 * A korlát fölötti párokra nem kérdezünk: külön esemény marad — inkább két kártya, mint elszabadult futás.
 */
export const HF_PAR_KORLAT = 60;

export type Letolto = (f: Forras) => Promise<
  | {
      ok: true;
      tipus: ForrasTipus;
      szovegOlvashato: boolean;
      cikkek: { cim: string; url: string; megjelenes: string | null; szoveg: string; nyelv: string | null }[];
      /** A ténylegesen letöltött cím, ha nem az eredeti (átirányítás vagy megtalált hírfolyam). */
      felfedezettCim?: string;
    }
  | { ok: false; hibaOk: string }
>;

export type Kornyezet = {
  tar: HirfigyeloTar;
  letolto: Letolto;
  ai: AiHivo;
  /** A szervezet KÖZÖS profilja — a host adja (csak olvasásra, az AI-feladatok bemenete); a modul nem tud a tárolásáról. */
  profil: unknown;
  idAdo: () => string;
  most: () => Date;
  esemeny?: (e: HirfigyeloEsemeny) => void;
  /** F9-A3: a futás haladása forrásonként és értékelésenként; a host tárolja, a képernyő mutatja. */
  haladas?: (h: FutasHaladas) => void | Promise<void>;
  /** F10-M1: a beállított tartalomnyelv (hu/ro/en) — ha a cikk már ezen a nyelven van, a cím fordítása a cím maga (MÉRVE 2026-09-16: a modell a magyar címet is „átfogalmazta"). */
  nyelv?: string;
  /** R-13: a munkatér tagjainak szűrő-beállítása — a gép azt olvassa el, ami legalább egy tagnak átmegy az előszűrőjén. Hiányzik/üres = egy tag az alappal. */
  tagok?: TagSzures[];
  /** R-13: a NÉZŐ szűrő-beállítása — az olvasó folyamatok (áttekintés, összkép, pontosítás) ezzel a szemmel mutatnak. */
  nezo?: Pick<TagSzures, "fokozat" | "eloszures">;
  /**
   * R-13: kredit-terhelés a HÁTTÉRMUNKÁBAN — a sikeres AI-hívás 1 kreditje azok között oszlik meg, akiknek kellett
   * (előszűrés: a bekapcsolt előszűrésű tagok; olvasás: akiknek átment az előszűrőjén; „ugyanaz?”: minden kredites tag).
   * Ha nincs megadva (vagy egy ember kérte, és a host a hívót terheli), a mag nem terhel.
   */
  kreditTerhel?: (fiokok: string[], feladat: HfFeladat) => Promise<void>;
};

export type Hiba = {
  ok: false;
  hiba: "NINCS_JOG" | "NINCS_BEALLITAS" | "FUT_MAR" | "ERVENYTELEN_ADAT" | "NINCS_ILYEN_VERZIO" | "NINCS_ILYEN_JAVASLAT" | "MINTA_LEJART" | "NINCS_ILYEN_TALALAT" | "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_ROSSZ_VALASZ";
  reszlet?: unknown;
};

type Eredmeny<T> = { ok: true } & T | Hiba;

/** Jogosultság-ellenőrzés; hiba esetén NINCS_JOG. */
function jogEllenoriz(ktx: HostKontextus, muvelet: "nez" | "beallit" | "futtat" | "visszajelez" | "javaslat_dont"): Hiba | null {
  if (!jogosult(ktx.szerep, muvelet)) return { ok: false, hiba: "NINCS_JOG" };
  return null;
}

/** Beállítás mentése: ellenőriz, ujVerzio, ment; a tervezetet törli. */
export async function beallitasMent(
  k: Kornyezet,
  ktx: HostKontextus,
  be: unknown,
  eredet: BeallitasVerzio["eredet"],
): Promise<Eredmeny<{ uj: BeallitasVerzio | null; verziok: BeallitasVerzio[] }>> {
  const jog = jogEllenoriz(ktx, "beallit");
  if (jog) return jog;
  const ell = await import("./beallitas").then((m) => m.beallitasEllenoriz(be));
  if (!ell.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: ell.hibak };
  const verziok = await k.tar.verziok(ktx.szervezet_id);
  const e = ujVerzio(verziok, ell.beallitas, eredet, k.most());
  await k.tar.verziokMent(ktx.szervezet_id, e.verziok);
  await k.tar.tervezetMent(ktx.szervezet_id, ktx.fiok_id, null);
  return { ok: true, uj: e.uj, verziok: e.verziok };
}

/** Tervezet mentése: csak a szerkesztő tervezete, a futó figyelést nem érinti. */
export async function tervezetMent(k: Kornyezet, ktx: HostKontextus, be: Beallitas | null): Promise<Eredmeny<{}>> {
  const jog = jogEllenoriz(ktx, "beallit");
  if (jog) return jog;
  await k.tar.tervezetMent(ktx.szervezet_id, ktx.fiok_id, be);
  return { ok: true };
}

/** Verzió visszaállítása: visszaallit + ment. */
export async function verzioVisszaallit(k: Kornyezet, ktx: HostKontextus, verzio: number): Promise<Eredmeny<{ uj: BeallitasVerzio; verziok: BeallitasVerzio[] }>> {
  const jog = jogEllenoriz(ktx, "beallit");
  if (jog) return jog;
  const verziok = await k.tar.verziok(ktx.szervezet_id);
  const e = visszaallit(verziok, verzio, k.most());
  if (!e) return { ok: false, hiba: "NINCS_ILYEN_VERZIO" };
  await k.tar.verziokMent(ktx.szervezet_id, e.verziok);
  return { ok: true, uj: e.uj, verziok: e.verziok };
}

/** Forrás hozzáadása: osztályoz, ment (a nem támogatott is, az ok látszik). */
export async function forrasHozzaad(k: Kornyezet, ktx: HostKontextus, cim: string, eredet: "kezi" | "ai_javaslat"): Promise<Eredmeny<{ forras: Forras }>> {
  const jog = jogEllenoriz(ktx, "beallit");
  if (jog) return jog;
  const oszt = forrasCimOsztalyoz(cim);
  // Amiből nem lesz cím, azt nem tesszük el: a felhasználó javítsa a bevitelt, ne a listát takarítsa.
  if (oszt.ok === "ervenytelen") return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "ervenytelen" };
  const f: Forras = {
    id: k.idAdo(),
    cim: oszt.cim,
    tipus: oszt.tipus,
    eredet,
    allapot: oszt.allapot,
    ellenorzott: false,
    utolso_sikeres: null,
    hiba_ok: oszt.ok,
  };
  await k.tar.forrasMent(ktx.szervezet_id, f);
  return { ok: true, forras: f };
}

/** Forrás ellenőrzése a letöltővel; az eredményt menti. */
export async function forrasEllenoriz(k: Kornyezet, ktx: HostKontextus, forrasId: string): Promise<Eredmeny<{ forras: Forras }>> {
  const jog = jogEllenoriz(ktx, "beallit");
  if (jog) return jog;
  const forrasok = await k.tar.forrasok(ktx.szervezet_id);
  const f = forrasok.find((x) => x.id === forrasId);
  if (!f) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_forras" };
  const letoltes = await k.letolto(f);
  let uj: Forras;
  if (letoltes.ok) {
    uj = forrasEllenorzesEredmeny(
      f,
      { elerheto: true, tipus: letoltes.tipus, szovegOlvashato: letoltes.szovegOlvashato, hibaOk: null, felfedezettCim: letoltes.felfedezettCim ?? null },
      k.most(),
    );
  } else {
    uj = forrasEllenorzesEredmeny(f, { elerheto: false, tipus: null, szovegOlvashato: false, hibaOk: letoltes.hibaOk }, k.most());
  }
  await k.tar.forrasMent(ktx.szervezet_id, uj);
  return { ok: true, forras: uj };
}

/** A figyelés futtatása: a spec 1)–10) pontjai szerint. */
export async function figyelesFuttat(
  k: Kornyezet,
  ktx: HostKontextus,
  { proba, hatarido }: { proba: boolean; hatarido?: Date },
): Promise<Eredmeny<{ futas: Futas; ujTalalatok: Talalat[]; minta: Minta | null }>> {
  const jog = jogEllenoriz(ktx, "futtat");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;

  // 1) Aktív verzió kell
  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  if (!aktiv) return { ok: false, hiba: "NINCS_BEALLITAS" };

  // 2) Dupla indítás tiltva
  const futasok = await k.tar.futasok(szervezetId);
  const aktivFutas = futasok.find((f) => f.allapot === "indul" || f.allapot === "fut") ?? null;
  if (!indithato(aktivFutas)) return { ok: false, hiba: "FUT_MAR" };

  // 3) Futás indul → fut
  const futasId = k.idAdo();
  const most = k.most();
  let futas: Futas = {
    id: futasId,
    szervezet_id: szervezetId,
    szabaly_verzio: aktiv.verzio,
    kezdet: most.toISOString(),
    veg: null,
    allapot: "indul",
    uj_talalatok: 0,
    hibas_forrasok: [],
    proba,
  };
  futas = futasAtmenet(futas, { fajta: "kezd" }, most);
  await k.tar.futasMent(szervezetId, futas);
  k.esemeny?.({ fajta: "futas_indult", szervezet_id: szervezetId, futas_id: futasId });

  // 4) Források letöltése
  // J-1 (2026-09-25, mérve): a kézzel vagy az első beállításból felvett forrás „ellenorzes_alatt” állapotban maradt, ha a
  // felvevő felület nem kérte az ellenőrzést — és a futás kihagyta, így a munkatér SOHA nem kapott hírt. Ezért a futás
  // maga ellenőrzi az ellenőrizetlen, nem AI-javasolt forrást, mielőtt letöltene (az AI-javaslat ellenőrzés előtt nem forrás).
  for (const f of await k.tar.forrasok(szervezetId)) {
    if (f.allapot !== "ellenorzes_alatt" || (f.eredet === "ai_javaslat" && !f.ellenorzott)) continue;
    const l = await k.letolto(f);
    const e = l.ok
      ? { elerheto: true, tipus: l.tipus, szovegOlvashato: l.szovegOlvashato, hibaOk: null, felfedezettCim: l.felfedezettCim ?? null }
      : { elerheto: false, tipus: null, szovegOlvashato: false, hibaOk: l.hibaOk };
    await k.tar.forrasMent(szervezetId, forrasEllenorzesEredmeny(f, e, k.most()));
  }
  const forrasok = await k.tar.forrasok(szervezetId);
  // A futás a használható és a korlátozott forrásokat dolgozza fel, ÉS újra megpróbálja a korábban hibásakat (visszajöhetett);
  // kihagyja a nem támogatottat és az ellenőrizetlent (AI-javaslat ellenőrzés előtt nem forrás).
  const hasznalhatoForrasok = forrasok.filter((f) => f.allapot === "hasznalhato" || f.allapot === "korlatozott" || f.allapot === "hibas");
  const ujKivonatok: Kivonat[] = [];
  let aiHibaVolt = false;
  let keretKimerult = false;
  let felbeszakadt = false; // időkorlát vagy pár-korlát miatt nem kérdeztünk meg mindent
  let regiKihagyva = 0; // F9-A7: 48 óránál régebbi cikkek, kihagyva
  let datumNelkul = 0; // F9-A7: dátum nélküli cikkek — bekerülnek, de a napló jelzi
  let forrasokLetoltve = 0; // F9-A3
  const haladas = async (cikkekErtekelve: number, cikkekErtekelendo: number) => { await k.haladas?.({ forrasok_letoltve: forrasokLetoltve, forrasok_osszes: hasznalhatoForrasok.length, cikkek_talalt: ujKivonatok.length, cikkek_ertekelve: cikkekErtekelve, cikkek_ertekelendo: cikkekErtekelendo }); };
  /** Lejárt-e a host által adott határidő? A hosszú futás így MAGÁTÓL áll le, nem gazdátlanul fut tovább. */
  const lejart = (): boolean => hatarido !== undefined && k.most() >= hatarido;

  for (const f of hasznalhatoForrasok) {
    if (lejart()) { felbeszakadt = true; break; } // a letöltés is hosszú lehet: a határidőt itt is nézzük
    const letoltes = await k.letolto(f);
    forrasokLetoltve += 1;
    if (!letoltes.ok) {
      futas = futasAtmenet(futas, { fajta: "forras_hiba", forras_id: f.id, ok: letoltes.hibaOk }, most);
      if (f.allapot !== "hibas") await k.tar.forrasMent(szervezetId, { ...f, allapot: "hibas", hiba_ok: letoltes.hibaOk });
      await haladas(0, 0);
      continue;
    }
    if (f.allapot === "hibas") await k.tar.forrasMent(szervezetId, { ...f, allapot: letoltes.szovegOlvashato ? "hasznalhato" : "korlatozott", hiba_ok: null, utolso_sikeres: most.toISOString() });
    // 5) Cikkenként kivonat, duplikátum kihagyva
    for (const cikk of letoltes.cikkek) {
      if (!cikk.cim.trim()) continue; // cím nélkül nem cikk (a forrás hibásan adja) — nem tároljuk
      const frissesseg = cikkFrissesseg(cikk.megjelenes, most);
      if (frissesseg === "regi") { regiKihagyva += 1; continue; } // F9-A7: a 48 óránál régebbi cikket nem tároljuk és nem értékeljük
      if (frissesseg === "datum_nelkul") datumNelkul += 1;
      const kivonat = kivonatKeszit(
        { id: k.idAdo(), forras_id: f.id, cim: cikk.cim, url: cikk.url, megjelenes: cikk.megjelenes, szoveg: cikk.szoveg, nyelv: cikk.nyelv },
        most,
      );
      const mentes = await k.tar.kivonatMent(szervezetId, kivonat);
      if (mentes === "letezik") continue;
      ujKivonatok.push(kivonat);
    }
    await haladas(0, 0);
  }

  // R-13: ha a host megadta a tagokat, de egyiknek sincs kreditje, a gép nem olvas (a találatok „keret kimerült”-ek)
  if (k.tagok && k.tagok.length === 0 && ujKivonatok.length > 0) keretKimerult = true;
  const terhel = async (fiokok: string[], feladat: HfFeladat): Promise<void> => { if (k.kreditTerhel && fiokok.length > 0) await k.kreditTerhel(fiokok, feladat); };
  const tagIdk = (k.tagok ?? []).map((t) => t.fiok_id);

  // J-1g2: a szakmai oldalakról jött cikkekre nem vonatkozik a helyfeltétel
  const szakmaiForrasIdk = new Set(forrasok.filter((f) => szakmaiForrasCim(f.cim)).map((f) => f.id));
  const helyNelkulKv = new Set(ujKivonatok.filter((kv) => szakmaiForrasIdk.has(kv.forras_id)).map((kv) => kv.id));

  // 5b) Előszűrő (v11): szólista + címek — ami nem vág a témába / az Iránytűbe, azt a gép el sem olvassa,
  // és az „ugyanaz az esemény?” kérdést sem tesszük fel rá.
  const elo = keretKimerult
    ? { kiszurt: new Map<string, "szolista" | "cim">(), tenyek: new Map<string, EloTenyek>(), szolistaVolt: false, cimKeres: 0 }
    : await eloszur(k, aktiv.beallitas, ujKivonatok, k.tagok ?? [], lejart, (id) => helyNelkulKv.has(id));
  const olvasando = (kv: Kivonat): boolean => !elo.kiszurt.has(kv.id);

  // 6) Eseménybe sorolás: előbb a gyanús párok, majd AI-kérdések, majd szinkron ugyanaz
  const meglevoEsemenyek = await k.tar.esemenyek(szervezetId);
  const meglevoKivonatok = await k.tar.kivonatok(szervezetId, meglevoEsemenyek.flatMap((e) => e.talalat_ids));
  const meglevoCsoportok = meglevoEsemenyek.map((e) => ({
    esemeny: e,
    kivonatok: meglevoKivonatok.filter((kv) => e.talalat_ids.includes(kv.id)),
  }));

  // Gyanús párok gyűjtése (új–új és új–meglévő)
  const gyanusParok: { a: Kivonat; b: Kivonat }[] = [];
  for (let i = 0; i < ujKivonatok.length; i++) {
    if (!olvasando(ujKivonatok[i]!)) continue;
    for (let j = i + 1; j < ujKivonatok.length; j++) {
      if (!olvasando(ujKivonatok[j]!)) continue;
      const ka = ujKivonatok[i]!, kb = ujKivonatok[j]!;
      if (gyanusPar(ka, kb)) gyanusParok.push({ a: ka, b: kb });
    }
    for (const csoport of meglevoCsoportok) {
      for (const ek of csoport.kivonatok) {
        const ka = ujKivonatok[i]!;
        if (gyanusPar(ka, ek)) gyanusParok.push({ a: ka, b: ek });
      }
    }
  }

  // AI-kérdések sorban, Map<"idA|idB", boolean>
  const ugyanazMap = new Map<string, boolean>();
  let parKerdes = 0;
  for (const par of gyanusParok) {
    if (keretKimerult) break;
    if (parKerdes >= HF_PAR_KORLAT || lejart()) { felbeszakadt = true; break; }
    parKerdes++;
    const kulcs = `${par.a.id}|${par.b.id}`;
    const valasz = await k.ai("hf_ugyanaz_az_esemeny", {
      a: { id: par.a.id, cim: par.a.cim, url: par.a.url, szoveg: par.a.szoveg, csonkolt: par.a.csonkolt, ujjlenyomat: par.a.ujjlenyomat, megjelenes: par.a.megjelenes },
      b: { id: par.b.id, cim: par.b.cim, url: par.b.url, szoveg: par.b.szoveg, csonkolt: par.b.csonkolt, ujjlenyomat: par.b.ujjlenyomat, megjelenes: par.b.megjelenes },
    });
    if (valasz.ok) {
      await terhel(tagIdk, "hf_ugyanaz_az_esemeny"); // R-13: minden kredites tagé
      const ell = aiValaszEllenoriz("hf_ugyanaz_az_esemeny", valasz.valasz, { talalat_ids: [] });
      if (ell.ok) {
        const u = (ell.ertek as UgyanazValasz).ugyanaz;
        ugyanazMap.set(kulcs, u);
        ugyanazMap.set(`${par.b.id}|${par.a.id}`, u);
      } else {
        aiHibaVolt = true;
        futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
      }
    } else if (valasz.kod === "AI_KERET_KIMERULT") {
      keretKimerult = true;
      break;
    } else {
      aiHibaVolt = true;
      futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
    }
  }

  const ugyanaz = (a: Kivonat, b: Kivonat): boolean => {
    const kulcs = `${a.id}|${b.id}`;
    return ugyanazMap.get(kulcs) ?? false;
  };

  const sorolas = esemenybeSorol(ujKivonatok, meglevoCsoportok, ugyanaz, k.idAdo, most, szervezetId);

  // Új események mentése
  for (const e of sorolas.ujEsemenyek) await k.tar.esemenyMent(szervezetId, e);
  // Bővített események mentése
  for (const b of sorolas.bovitett) {
    const esemeny = meglevoEsemenyek.find((e) => e.id === b.esemeny_id);
    if (esemeny) {
      esemeny.talalat_ids.push(b.kivonat_id);
      await k.tar.esemenyMent(szervezetId, esemeny);
    }
  }

  // 7) Találat minden új kivonatra
  const ujTalalatok: Talalat[] = [];
  for (const kivonat of ujKivonatok) {
    const esemeny = [...sorolas.ujEsemenyek, ...meglevoEsemenyek].find((e) => e.talalat_ids.includes(kivonat.id));
    if (!esemeny) continue;
    const talalat: Talalat = {
      id: kivonat.id, // egy találat = egy kivonat: ugyanaz az azonosító (az esemény talalat_ids-e ezért valódi találat-azonosító)
      szervezet_id: szervezetId,
      esemeny_id: esemeny.id,
      kivonat_id: kivonat.id,
      ertekeles: null,
      ertekeles_allapot: "fuggoben",
      megtekintes: "uj",
      jeloles: "nincs",
      letrehozva: most.toISOString(),
      futas_id: futasId,
      tartalomotlet: null,
    };
    const eloOk = elo.kiszurt.get(kivonat.id);
    if (eloOk) {
      talalat.ertekeles = eloszurtErtekeles(kivonat, eloOk, aktiv.verzio, most, elo.tenyek.get(kivonat.id) ?? null);
      talalat.ertekeles_allapot = "kesz";
    }
    ujTalalatok.push(talalat);
    await k.tar.talalatMent(szervezetId, talalat);
  }

  // 8) Értékelés: hf_relevancia egyenként — csak amit az előszűrő átengedett
  const ertekelendo = ujTalalatok.filter((t) => t.ertekeles_allapot === "fuggoben");
  const ertekelesSzam = Math.min(ertekelendo.length, HF_NAPI_CIKK);
  await haladas(0, ertekelesSzam);
  for (let i = 0; i < ertekelesSzam; i++) {
    if (keretKimerult) break;
    if (lejart()) { felbeszakadt = true; break; }
    const talalat = ertekelendo[i]!;
    const kivonat = ujKivonatok.find((kv) => kv.id === talalat.kivonat_id);
    if (!kivonat) continue;
    const valasz = await k.ai("hf_relevancia", {
      profil: k.profil,
      beallitas: aktiv.beallitas,
      kivonat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt, nyelv: kivonat.nyelv },
    });
    if (valasz.ok) {
      await terhel(kinekKell(elo.tenyek.get(kivonat.id), k.tagok ?? []).map((t) => t.fiok_id), "hf_relevancia"); // R-13: akiknek kellett
      const ell = aiValaszEllenoriz("hf_relevancia", valasz.valasz, { talalat_ids: [] });
      if (ell.ok) {
        talalat.ertekeles = relevanciabolErtekeles(ell.ertek as RelevanciaValasz, kivonat, k.nyelv, aktiv.verzio, most, elo.tenyek.get(kivonat.id) ?? null, helyNelkulKv.has(kivonat.id));
        talalat.ertekeles_allapot = "kesz";
      } else {
        aiHibaVolt = true;
        futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
      }
    } else if (valasz.kod === "AI_KERET_KIMERULT") {
      keretKimerult = true;
      talalat.ertekeles_allapot = "keret_kimerult";
    } else {
      aiHibaVolt = true;
      futas = futasAtmenet(futas, { fajta: "ai_hiba" }, most);
    }
    await k.tar.talalatMent(szervezetId, talalat);
    await haladas(i + 1, ertekelesSzam);
  }
  // A korlát feletti találatok fuggoben maradnak; ha a keret fogyott el, MINDEN még nem értékelt találat ezt mutatja
  // (D-12: a keret elfogyása érthetően látszik, nem „függőben”-ként).
  if (keretKimerult) {
    for (const t of ujTalalatok) {
      if (t.ertekeles_allapot === "fuggoben") { t.ertekeles_allapot = "keret_kimerult"; await k.tar.talalatMent(szervezetId, t); }
    }
    k.esemeny?.({ fajta: "keret_kimerult", szervezet_id: szervezetId, futas_id: futasId }); // egyszer, akárhol fogyott el
  }

  // 9) Próba esetén minta
  let minta: Minta | null = null;
  if (proba && ujTalalatok.length > 0) {
    minta = mintaKeszit(
      { id: k.idAdo(), szervezet_id: szervezetId, szabaly_verzio: aktiv.verzio, talalat_ids: ujTalalatok.map((t) => t.id) },
      most,
    );
    await k.tar.mintaMent(szervezetId, minta);
  }

  // 10) Vége
  // uj_talalatok = az ÚJ KÁRTYÁK száma (események, a prototípus „{n} új találat” sávja); a cikkenkénti találatok az ujTalalatok listában
  const ujKartyak = sorolas.ujEsemenyek.length;
  futas = futasAtmenet(futas, { fajta: "vege", uj_talalatok: ujKartyak, osszesForras: hasznalhatoForrasok.length, felbeszakadt }, k.most()); // a vég ideje a valódi vég
  await k.tar.futasMent(szervezetId, futas);
  if (futas.allapot === "hiba") {
    k.esemeny?.({ fajta: "futas_hiba", szervezet_id: szervezetId, futas_id: futasId, reszlet: "minden_forras_hibas" });
  } else {
    k.esemeny?.({ fajta: "futas_kesz", szervezet_id: szervezetId, futas_id: futasId, uj_talalatok: ujKartyak, ...(regiKihagyva > 0 || datumNelkul > 0 ? { reszlet: `regi_kihagyva=${regiKihagyva} datum_nelkul=${datumNelkul}` } : {}) });
  }

  return { ok: true, futas, ujTalalatok, minta };
}

/** A fuggoben találatok újraértékelése a kivonatból, letöltés nélkül. */
export async function ertekelesUjra(
  k: Kornyezet,
  ktx: HostKontextus,
  opciok: { hatarido?: Date } = {},
): Promise<Eredmeny<{ ujraErtekelt: number; maradt: number }>> {
  const jog = jogEllenoriz(ktx, "futtat");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  if (!aktiv) return { ok: false, hiba: "NINCS_BEALLITAS" };

  const talalatok = await k.tar.talalatok(szervezetId);
  // F10-M1: a függők mellett azok a kész értékelések is, amelyekből még hiányzik a fordított cím (a mező előtti futásokból).
  // 2026-09-22: és azok, amelyek a mai szűrő ELŐTT készültek (szuroElavult) — a legfrissebbek elöl, legfeljebb HF_UJRASZURES_MAX darab.
  const frissElol = (a: Talalat, b: Talalat) => new Date(b.letrehozva).getTime() - new Date(a.letrehozva).getTime();
  const fuggoben = [
    ...talalatok.filter((t) => t.ertekeles_allapot === "fuggoben"),
    ...talalatok.filter((t) => t.ertekeles_allapot === "kesz" && (!t.ertekeles?.cim_forditott || szuroElavult(t.ertekeles))).sort(frissElol),
  ].slice(0, HF_UJRASZURES_MAX);
  let ujraErtekelt = 0;
  let feldolgozott = 0;
  const lejart = (): boolean => opciok.hatarido !== undefined && k.most() >= opciok.hatarido;
  // v11: az előszűrő az újraszűrésnél is dönt — amit kiszűr, azt a gép nem olvassa el újra
  // R-13: ha a host megadta a tagokat, de egyiknek sincs kreditje, most nem olvasunk újra (a következő hónapban / kreditnél megy)
  if (k.tagok && k.tagok.length === 0) return { ok: true, ujraErtekelt: 0, maradt: fuggoben.length };
  const mindKivonat = fuggoben.length > 0 ? await k.tar.kivonatok(szervezetId, fuggoben.map((t) => t.kivonat_id)) : [];
  const szakmaiIdk = new Set((await k.tar.forrasok(szervezetId)).filter((f) => szakmaiForrasCim(f.cim)).map((f) => f.id));
  const helyNelkulUj = new Set(mindKivonat.filter((kv) => szakmaiIdk.has(kv.forras_id)).map((kv) => kv.id)); // J-1g2
  const elo = await eloszur(k, aktiv.beallitas, mindKivonat, k.tagok ?? [], lejart, (id) => helyNelkulUj.has(id));
  for (const talalat of fuggoben) {
    // 2026-09-22: a hosszú újraszűrés a sor 15 perces korlátja előtt megáll — a maradék a következő alkalommal megy
    if (lejart()) break;
    feldolgozott++;
    const kivonat = mindKivonat.find((kv) => kv.id === talalat.kivonat_id);
    if (!kivonat) continue;
    const eloOk = elo.kiszurt.get(kivonat.id);
    if (eloOk) {
      talalat.ertekeles = eloszurtErtekeles(kivonat, eloOk, aktiv.verzio, k.most(), elo.tenyek.get(kivonat.id) ?? null);
      talalat.ertekeles_allapot = "kesz";
      await k.tar.talalatMent(szervezetId, talalat);
      ujraErtekelt++;
      continue;
    }
    const valasz = await k.ai("hf_relevancia", {
      profil: k.profil,
      beallitas: aktiv.beallitas,
      kivonat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt, nyelv: kivonat.nyelv },
    });
    if (valasz.ok) {
      if (k.kreditTerhel) await k.kreditTerhel(kinekKell(elo.tenyek.get(kivonat.id), k.tagok ?? []).map((t) => t.fiok_id), "hf_relevancia"); // R-13
      const ell = aiValaszEllenoriz("hf_relevancia", valasz.valasz, { talalat_ids: [] });
      if (ell.ok) {
        talalat.ertekeles = relevanciabolErtekeles(ell.ertek as RelevanciaValasz, kivonat, k.nyelv, aktiv.verzio, k.most(), elo.tenyek.get(kivonat.id) ?? null, helyNelkulUj.has(kivonat.id));
        talalat.ertekeles_allapot = "kesz";
        await k.tar.talalatMent(szervezetId, talalat);
        ujraErtekelt++;
      }
    }
  }
  return { ok: true, ujraErtekelt, maradt: fuggoben.length - feldolgozott };
}

/** Találat megtekintése. */
export async function talalatMegtekint(k: Kornyezet, ktx: HostKontextus, id: string): Promise<Eredmeny<{ talalat: Talalat }>> {
  const jog = jogEllenoriz(ktx, "nez");
  if (jog) return jog;
  const talalatok = await k.tar.talalatok(ktx.szervezet_id);
  const t = talalatok.find((x) => x.id === id);
  if (!t) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_talalat" };
  const uj = megtekint(t);
  await k.tar.talalatMent(ktx.szervezet_id, uj);
  return { ok: true, talalat: uj };
}

/** Találat jelölése (mentés/elrejtés/visszaállítás). */
export async function talalatJelol(k: Kornyezet, ktx: HostKontextus, id: string, jeloles: Talalat["jeloles"]): Promise<Eredmeny<{ talalat: Talalat }>> {
  const jog = jogEllenoriz(ktx, "visszajelez");
  if (jog) return jog;
  const talalatok = await k.tar.talalatok(ktx.szervezet_id);
  const t = talalatok.find((x) => x.id === id);
  if (!t) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_talalat" };
  const uj = jelol(t, jeloles);
  await k.tar.talalatMent(ktx.szervezet_id, uj);
  return { ok: true, talalat: uj };
}

/** Visszajelzés rögzítése. */
export async function visszajelzesRogzit(k: Kornyezet, ktx: HostKontextus, v: Visszajelzes): Promise<Eredmeny<{ visszajelzes: Visszajelzes }>> {
  const jog = jogEllenoriz(ktx, "visszajelez");
  if (jog) return jog;
  await k.tar.visszajelzesMent(ktx.szervezet_id, v);
  return { ok: true, visszajelzes: v };
}

/** Szabályjavaslat kérése az aktív beállításból és a fel nem használt visszajelzésekből. */
export async function javaslatKer(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{ javaslat: SzabalyJavaslat }>> {
  const jog = jogEllenoriz(ktx, "javaslat_dont");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  if (!aktiv) return { ok: false, hiba: "NINCS_BEALLITAS" };

  const visszajelzesek = await k.tar.visszajelzesek(szervezetId);
  const javaslatok = await k.tar.javaslatok(szervezetId);
  const felhasznaltVisszajelzesIds = new Set(javaslatok.flatMap((j) => j.mi_alapjan));
  const ujVisszajelzesek = visszajelzesek.filter((v) => !felhasznaltVisszajelzesIds.has(v.id));
  if (ujVisszajelzesek.length === 0) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_visszajelzes" };

  const talalatok = await k.tar.talalatok(szervezetId);
  const visszajelzesAdatok = [];
  for (const v of ujVisszajelzesek) {
    const t = talalatok.find((x) => x.id === v.talalat_id);
    if (!t) continue;
    const kivonatok = await k.tar.kivonatok(szervezetId, [t.kivonat_id]);
    const kivonat = kivonatok[0];
    if (!kivonat) continue;
    // az AI bemenete: a visszajelzés mezői + a cikk kivonata (a szerződés 2.9: „visszajelzések (találat-kivonattal)”)
    visszajelzesAdatok.push({ id: v.id, talalat_id: v.talalat_id, fajta: v.fajta, okok: v.okok, sajat_indok: v.sajat_indok, kivonat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt } });
  }
  if (visszajelzesAdatok.length === 0) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_visszajelzes" };

  const valasz = await k.ai("hf_szabaly_javaslat", {
    beallitas: aktiv.beallitas,
    visszajelzesek: visszajelzesAdatok,
  });
  if (!valasz.ok) return { ok: false, hiba: valasz.kod === "AI_KERET_KIMERULT" ? "AI_KERET_KIMERULT" : valasz.kod === "AI_ROSSZ_VALASZ" ? "AI_ROSSZ_VALASZ" : "AI_NEM_ELERHETO" };
  const ell = aiValaszEllenoriz("hf_szabaly_javaslat", valasz.valasz, { talalat_ids: [] });
  if (!ell.ok) return { ok: false, hiba: "AI_ROSSZ_VALASZ", reszlet: ell.reszlet };
  const v = ell.ertek as SzabalyJavaslatValasz;

  const javaslat: SzabalyJavaslat = {
    id: k.idAdo(),
    szabaly_verzio: aktiv.verzio,
    javasolt: v.javasolt,
    mi_alapjan: ujVisszajelzesek.map((x) => x.id),
    indoklas: v.indoklas,
    varhato_hatas: v.varhato_hatas,
    profil_erintett: v.profil_erintett,
    allapot: "fuggo",
    minta_id: null,
    letrehozva: k.most().toISOString(),
  };
  await k.tar.javaslatMent(szervezetId, javaslat);
  return { ok: true, javaslat };
}

/** Javaslat kipróbálása: az utolsó mintán újraértékeli a javasolt beállítással. */
export async function javaslatKiprobal(k: Kornyezet, ktx: HostKontextus, javaslatId: string): Promise<Eredmeny<{ osszehasonlitas: { talalat_id: string; valtozas: "elorebb" | "hatrebb" | "valtozatlan" }[] }>> {
  const jog = jogEllenoriz(ktx, "javaslat_dont");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const javaslatok = await k.tar.javaslatok(szervezetId);
  const javaslat = javaslatok.find((j) => j.id === javaslatId);
  if (!javaslat) return { ok: false, hiba: "NINCS_ILYEN_JAVASLAT" };

  const mintak = await k.tar.mintak(szervezetId);
  const minta = mintak.sort((a, b) => new Date(b.letrehozva).getTime() - new Date(a.letrehozva).getTime())[0] ?? null;
  if (!minta) return { ok: false, hiba: "MINTA_LEJART" };

  const kivonatok = await k.tar.kivonatok(szervezetId, minta.talalat_ids);
  const ell = osszehasonlithato(minta, kivonatok, k.most());
  if (!ell.ok) return { ok: false, hiba: "MINTA_LEJART", reszlet: ell.ok_kod };

  const talalatok = await k.tar.talalatok(szervezetId);
  const regiSor: ErtekelesSor[] = [];
  const ujSor: ErtekelesSor[] = [];
  for (const talalatId of minta.talalat_ids) {
    const t = talalatok.find((x) => x.id === talalatId);
    if (!t) continue;
    const regi = nezoSzerint(t, k.nezo).ertekeles; // R-13: a néző szemével
    if (regi) regiSor.push({ talalat_id: t.id, fontossag: regi.fontossag });
    const kivonat = kivonatok.find((kv) => kv.id === t.kivonat_id);
    if (!kivonat) continue;
    const valasz = await k.ai("hf_relevancia", {
      profil: k.profil,
      beallitas: javaslat.javasolt,
      kivonat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt, nyelv: kivonat.nyelv },
    });
    if (valasz.ok) {
      const ell2 = aiValaszEllenoriz("hf_relevancia", valasz.valasz, { talalat_ids: [] });
      if (ell2.ok) {
        // R-13: ugyanúgy, mint az éles olvasás — a tények a legengedékenyebb fokozaté, a néző fokozata dönt
        const e = relevanciabolErtekeles(ell2.ertek as RelevanciaValasz, kivonat, k.nyelv, javaslat.szabaly_verzio, k.most());
        ujSor.push({ talalat_id: t.id, fontossag: fokozatSzerint(e, k.nezo?.fokozat ?? "nagyon_szigoru") });
      }
    }
  }

  const ossze = osszehasonlitas(regiSor, ujSor);
  const frissitett = { ...javaslat, allapot: "kiprobalt" as const, minta_id: minta.id };
  await k.tar.javaslatMent(szervezetId, frissitett);
  return { ok: true, osszehasonlitas: ossze };
}

/** Javaslat elfogadása vagy elvetése. */
export async function javaslatDont(k: Kornyezet, ktx: HostKontextus, javaslatId: string, dontes: "elfogad" | "elvet"): Promise<Eredmeny<{ javaslat: SzabalyJavaslat; ujVerzio?: BeallitasVerzio | null }>> {
  const jog = jogEllenoriz(ktx, "javaslat_dont");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const javaslatok = await k.tar.javaslatok(szervezetId);
  const javaslat = javaslatok.find((j) => j.id === javaslatId);
  if (!javaslat) return { ok: false, hiba: "NINCS_ILYEN_JAVASLAT" };

  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  if (!aktiv) return { ok: false, hiba: "NINCS_BEALLITAS" };
  // Csak függő/kipróbált, az AKTÍV verzióra épülő javaslatról lehet dönteni (a már eldöntött vagy elavult nem dönthető újra)
  if (!javaslatAlkalmazhato(javaslat, aktiv)) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: javaslat.allapot === "fuggo" || javaslat.allapot === "kiprobalt" ? "elavult_javaslat" : "lezart_javaslat" };

  let ujVerzioAdat: BeallitasVerzio | null = null;
  if (dontes === "elfogad") {
    const e = ujVerzio(verziok, javaslat.javasolt, "ai_javaslat", k.most());
    if (e.uj) {
      await k.tar.verziokMent(szervezetId, e.verziok);
      ujVerzioAdat = e.uj;
    }
  }
  const frissitett = javaslatDontes(javaslat, dontes);
  await k.tar.javaslatMent(szervezetId, frissitett);
  return { ok: true, javaslat: frissitett, ujVerzio: ujVerzioAdat };
}

/** Áttekintés: az Áttekintés-lap adatai. */
export async function attekintes(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{
  utolsoSikeres: Futas | null;
  /** J-1: a legutóbbi LEZÁRT futás, akár sikertelen is — hogy a Hírek lap ugyanazt mondja, mint a Kezdőlap. */
  utolsoFutas: Futas | null;
  aktivFutas: Futas | null;
  kovetkezo: Date | null;
  ujDb: number;
  talalatok: Talalat[];
  esemenyek: Esemeny[];
  forrasHibak: { forras_id: string; ok: string }[];
  kartyak: Kartya[];
  /** V3: hány eseményt hagytunk ki, mert a fő találat egy portál főoldala volt, nem cikk. */
  kihagyott_fooldal: number;
}>> {
  const jog = jogEllenoriz(ktx, "nez");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const futasok = await k.tar.futasok(szervezetId);
  const utolso = utolsoSikeres(futasok);
  const aktivFutas = futasok.find((f) => f.allapot === "indul" || f.allapot === "fut") ?? null;
  const lezart = futasok.filter((f) => f.allapot !== "indul" && f.allapot !== "fut");
  const utolsoFutas = lezart.length === 0 ? null : lezart.reduce((m, f) => (new Date(f.kezdet).getTime() > new Date(m.kezdet).getTime() ? f : m));
  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  const kovetkezo = aktiv ? kovetkezoFutas(aktiv.beallitas.idozites, k.most()) : null;
  const talalatok = (await k.tar.talalatok(szervezetId)).map((t) => nezoSzerint(t, k.nezo)); // R-13: a néző szemével (csak olvasásra)
  // 2026-09-22 (Vilmos): a kiszűrt (háttér) hír nem „új” — nem mutatjuk, csak a számát.
  const ujDb = talalatok.filter((t) => t.megtekintes === "uj" && !kiszurt(t)).length;
  const esemenyek = await k.tar.esemenyek(szervezetId);
  const forrasHibak = futasok.flatMap((f) => f.hibas_forrasok);
  // Kártyák építése: minden találat kivonat_id-je, a források a tárból
  const kivonatok = await k.tar.kivonatok(szervezetId, talalatok.map((t) => t.kivonat_id));
  const forrasok = await k.tar.forrasok(szervezetId);
  const { kartyak, kihagyott_fooldal } = kartyakEpitReszletes({ esemenyek, talalatok, kivonatok, forrasok });
  return { ok: true, utolsoSikeres: utolso, utolsoFutas, aktivFutas, kovetkezo, ujDb, talalatok, esemenyek, forrasHibak, kartyak, kihagyott_fooldal };
}

/** Összkép kérése az értékelt találatokból. */
export async function osszkep(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{ osszkep: { szoveg: string; hivatkozott_talalatok: string[]; bizonytalan: boolean } }>> {
  const jog = jogEllenoriz(ktx, "nez");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const talalatok = (await k.tar.talalatok(szervezetId)).map((t) => nezoSzerint(t, k.nezo)); // R-13: a néző szemével (csak olvasásra)
  // 2026-09-22 (Vilmos): az összkép csak a meg nem szűrt hírekből dolgozik — a kiszűrt háttérről nem ír.
  const ertekelt = talalatok.filter((t) => t.ertekeles !== null && !kiszurt(t));
  if (ertekelt.length === 0) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_ertekelt" };

  const kivonatok = await k.tar.kivonatok(szervezetId, ertekelt.map((t) => t.kivonat_id));
  const adatok = ertekelt.map((t) => {
    const k = kivonatok.find((kv) => kv.id === t.kivonat_id);
    return {
      id: t.id,
      cim: k?.cim ?? "",
      forras: k?.forras_id ?? "",
      miert: t.ertekeles?.miert ?? "",
    };
  });

  const valasz = await k.ai("hf_osszkep", { talalatok: adatok });
  if (!valasz.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: valasz.kod };
  const ell = aiValaszEllenoriz("hf_osszkep", valasz.valasz, { talalat_ids: ertekelt.map((t) => t.id) });
  if (!ell.ok) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: ell.reszlet };
  const v = ell.ertek as { szoveg: string; hivatkozott_talalatok: string[]; bizonytalan: boolean };
  return { ok: true, osszkep: v };
}

/** Tartalomötlet kérése egy találathoz — CSAK ez a folyamat hívja, soha nem automatikus. */
export async function tartalomotletKer(k: Kornyezet, ktx: HostKontextus, talalatId: string): Promise<Eredmeny<{ talalat: Talalat }>> {
  const jog = jogEllenoriz(ktx, "futtat");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const talalatok = await k.tar.talalatok(szervezetId);
  const talalat = talalatok.find((t) => t.id === talalatId);
  if (!talalat) return { ok: false, hiba: "NINCS_ILYEN_TALALAT" };

  // Ha már van tartalomötlet, nem hívunk AI-t
  if (talalat.tartalomotlet) return { ok: true, talalat };

  const kivonatok = await k.tar.kivonatok(szervezetId, [talalat.kivonat_id]);
  const kivonat = kivonatok[0];
  if (!kivonat) return { ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_kivonat" };

  const profil = k.profil as { hangnem_leiras?: string } | null | undefined;
  const hangnem = profil?.hangnem_leiras ?? "";

  const valasz = await k.ai("hf_tartalomotlet", {
    talalat: { cim: kivonat.cim, szoveg: kivonat.szoveg, csonkolt: kivonat.csonkolt },
    hangnem,
    profil: k.profil,
  });
  if (!valasz.ok) {
    if (valasz.kod === "AI_KERET_KIMERULT") return { ok: false, hiba: "AI_KERET_KIMERULT" };
    if (valasz.kod === "AI_ROSSZ_VALASZ") return { ok: false, hiba: "AI_ROSSZ_VALASZ" };
    return { ok: false, hiba: "AI_NEM_ELERHETO" };
  }
  const ell = aiValaszEllenoriz("hf_tartalomotlet", valasz.valasz, { talalat_ids: [] });
  if (!ell.ok) return { ok: false, hiba: "AI_ROSSZ_VALASZ", reszlet: ell.reszlet };
  const v = ell.ertek as TartalomotletValasz;

  const frissitett: Talalat = {
    ...talalat,
    tartalomotlet: { szoveg: v.szoveg, nyelv: v.nyelv, keszult: k.most().toISOString() },
  };
  await k.tar.talalatMent(szervezetId, frissitett);
  return { ok: true, talalat: frissitett };
}

/** Beállítás-javaslat kérése az AI-tól: a profilból és a szabad szövegből javaslatot készít, TERVEZETKÉNT menti. Soha nem ír aktív verziót. */
export async function beallitasJavaslatKer(
  k: Kornyezet,
  ktx: HostKontextus,
  szabadSzoveg: string,
): Promise<Eredmeny<{ tervezet: Beallitas }>> {
  const jog = jogEllenoriz(ktx, "beallit");
  if (jog) return jog;

  const szervezetNev = typeof (k.profil as { nev?: unknown } | null)?.nev === "string" ? String((k.profil as { nev: string }).nev) : "";
  const kerdez = async (szoveg: string): Promise<Eredmeny<{ beallitas: Beallitas }>> => {
    const valasz = await k.ai("hf_beallitas_javaslat", { profil: k.profil, szabad_szoveg: szoveg });
    if (!valasz.ok) {
      if (valasz.kod === "AI_KERET_KIMERULT") return { ok: false, hiba: "AI_KERET_KIMERULT" };
      if (valasz.kod === "AI_ROSSZ_VALASZ") return { ok: false, hiba: "AI_ROSSZ_VALASZ" };
      return { ok: false, hiba: "AI_NEM_ELERHETO" };
    }
    const ell = aiValaszEllenoriz("hf_beallitas_javaslat", valasz.valasz, { talalat_ids: [] });
    if (!ell.ok) return { ok: false, hiba: "AI_ROSSZ_VALASZ", reszlet: ell.reszlet };
    const b = (ell.ertek as { beallitas: Beallitas }).beallitas;
    // J-1: a cég nevét tartalmazó téma kiesik (determinisztikus őr az AI után)
    return { ok: true, beallitas: { ...b, temak: cegnevTemakNelkul(b.temak, szervezetNev).temak } };
  };
  const elso = await kerdez(szabadSzoveg);
  if (!elso.ok) return elso;
  let beallitas = elso.beallitas;
  // Ha a szűrés után 3-nál kevesebb téma maradt, egyszer újrakérdezzük, kifejezett kéréssel; a kettő együtt adja a listát.
  if (beallitas.temak.length < 3 && szervezetNev) {
    const masodik = await kerdez(`${szabadSzoveg}\nA témák a szervezet szakmájáról és piacáról szóljanak; a szervezet neve („${szervezetNev}”) ne szerepeljen bennük.`.trim());
    if (masodik.ok) {
      const van = new Set(beallitas.temak.map((t) => t.nev));
      beallitas = { ...beallitas, temak: [...beallitas.temak, ...masodik.beallitas.temak.filter((t) => !van.has(t.nev))] };
    }
  }

  // A szabad szöveg kerüljön a mezőbe, ha az AI üresen hagyta
  if (szabadSzoveg && !beallitas.szabad_szoveg) {
    beallitas = { ...beallitas, szabad_szoveg: szabadSzoveg };
  }

  beallitas = beallitasNormalizal(beallitas);

  // Ha van aktív verzió, az időzítést az aktívból vesszük át
  const verziok = await k.tar.verziok(ktx.szervezet_id);
  const aktiv = verziok.find((v) => v.allapot === "aktiv");
  if (aktiv) {
    beallitas = { ...beallitas, idozites: aktiv.beallitas.idozites };
  }

  // Tervezet mentése
  await k.tar.tervezetMent(ktx.szervezet_id, ktx.fiok_id, beallitas);
  return { ok: true, tervezet: beallitas };
}

/** A Finomhangolás lap adata (E-26): a legutóbbi minta tételei (vagy a visszajelzett találatok), a visszajelzések, a javaslatok, a verziók. */
export type FinomhangolasTetel = {
  talalat_id: string;
  cim: string;
  forras_id: string;
  forras_cim: string;
  megjelenes: string | null;
  fontossag: Fontossag | null;
  ertekeles_allapot: Talalat["ertekeles_allapot"];
};

export async function finomhangolas(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{
  minta: Minta | null;
  mintaLejart: boolean;
  tetelek: FinomhangolasTetel[];
  visszajelzesek: Visszajelzes[];
  javaslatok: SzabalyJavaslat[];
  verziok: BeallitasVerzio[];
}>> {
  const jog = jogEllenoriz(ktx, "nez");
  if (jog) return jog;
  const szervezetId = ktx.szervezet_id;
  const most = k.most();
  const [mintak, visszajelzesek, javaslatok, verziok, talalatok, forrasok] = await Promise.all([
    k.tar.mintak(szervezetId), k.tar.visszajelzesek(szervezetId), k.tar.javaslatok(szervezetId), k.tar.verziok(szervezetId),
    k.tar.talalatok(szervezetId).then((ts) => ts.map((t) => nezoSzerint(t, k.nezo))), // R-13: a néző szemével (csak olvasásra)
    k.tar.forrasok(szervezetId),
  ]);
  const minta = [...mintak].sort((a, b) => new Date(b.letrehozva).getTime() - new Date(a.letrehozva).getTime())[0] ?? null;
  // A tételek: a minta találatai; minta nélkül a visszajelzett találatok (az Áttekintésből jelöltek)
  const visszajelzettIds = new Set(visszajelzesek.map((v) => v.talalat_id));
  const tetelIds = minta ? minta.talalat_ids : talalatok.filter((t) => visszajelzettIds.has(t.id)).map((t) => t.id);
  const tetelTalalatok = tetelIds.map((id) => talalatok.find((t) => t.id === id)).filter((t): t is Talalat => !!t);
  const kivonatok = tetelTalalatok.length > 0 ? await k.tar.kivonatok(szervezetId, tetelTalalatok.map((t) => t.kivonat_id)) : [];
  const tetelek: FinomhangolasTetel[] = tetelTalalatok.map((t) => {
    const kv = kivonatok.find((x) => x.id === t.kivonat_id);
    const f = kv ? forrasok.find((x) => x.id === kv.forras_id) : undefined;
    return {
      talalat_id: t.id,
      cim: kv?.cim ?? "",
      forras_id: kv?.forras_id ?? "",
      forras_cim: f?.cim ?? "",
      megjelenes: kv?.megjelenes ?? null,
      fontossag: t.ertekeles?.fontossag ?? null,
      ertekeles_allapot: t.ertekeles_allapot,
    };
  });
  return { ok: true, minta, mintaLejart: minta ? mintaLejart(minta, most) : false, tetelek, visszajelzesek, javaslatok, verziok };
}
