// R-18 7. kör (Csilla 10-12, design/R18-arculatfrissites/IRANYOK-round7.md): a kínálat és a tématerv tiszta szabályai (a profil oldalán, mert a
// Szervezet adatai is használja; az első beállítás innen veszi) —
// vendéglátós-e a cég (étlap vagy szolgáltatás-lista kérdés), a gép kínálat-válaszának tisztítása, a honlap közösségi linkje és a
// kínálatot mutató aloldalai, a tématerv tisztítása és a gép nélküli tartalék-terv. Adatbázis és hálózat nélkül (probak/r18-kor7.proba.ts).
import { FESZTIVAL_TEMA_FAJTAK, KINALAT_MAX, PosztTipus, TEMA_MAX, type Kategoria, type KinalatSor, type SzervezetTipus, type TemaTerv } from "@rogton/contracts";

/** Vendéglátás (étterem, kávézó, cukrászda, pékség, catering, panzió…) — a cég leírásából, három nyelven. */
const VENDEGLATO = /(étterm|étkezd|vendéglő|kávéz|kávéház|cukrászd|pékség|pizzéri|bisztró|büfé|catering|panzió|szálló|kifőzde|söröz|borozó|restaurant|restaurante|cafenea|cafe\b|café|patiser|brutări|brutari|pensiune|bistro|pizzeri|bakery|catering|guesthouse|food truck)/iu;
export function vendeglato(szoveg: string): boolean {
  return VENDEGLATO.test(szoveg);
}

const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** A gép (vagy a kliens) kínálat-sorai: üres név ki, azonos név (kis/nagybetű nélkül) csak egyszer, legfeljebb 60. */
export function kinalatTisztit(be: unknown): KinalatSor[] {
  if (!Array.isArray(be)) return [];
  const ki: KinalatSor[] = [];
  const latott = new Set<string>();
  for (const sor of be) {
    const o = (sor ?? {}) as Record<string, unknown>;
    const nev = s(o["nev"], 160);
    if (!nev || latott.has(nev.toLocaleLowerCase("hu"))) continue;
    latott.add(nev.toLocaleLowerCase("hu"));
    ki.push({ nev, reszlet: s(o["reszlet"], 200), ar: s(o["ar"], 60), aktiv: o["aktiv"] !== false });
    if (ki.length >= KINALAT_MAX) break;
  }
  return ki;
}

/** A tématerv sorai: üres téma és ismeretlen fajta ki, legfeljebb 12. */
export function temakTisztit(be: unknown): TemaTerv[] {
  if (!Array.isArray(be)) return [];
  const ki: TemaTerv[] = [];
  for (const sor of be) {
    const o = (sor ?? {}) as Record<string, unknown>;
    const tema = s(o["tema"], 160);
    const tipus = PosztTipus.safeParse(o["tipus"]);
    if (!tema || !tipus.success) continue;
    // c30 F7: a fesztivál-téma fajtája csak a zárt listából; más érték (vagy cégnél semmi) — a mező kimarad
    const fajta = typeof o["fajta"] === "string" && (FESZTIVAL_TEMA_FAJTAK as readonly string[]).includes(o["fajta"].trim()) ? o["fajta"].trim() : null;
    ki.push(fajta ? { tema, tipus: tipus.data, fajta } : { tema, tipus: tipus.data });
    if (ki.length >= TEMA_MAX) break;
  }
  return ki;
}

/** A honlap rövid neve a „A {domain} oldalról olvastuk ki” sorhoz (www. nélkül). */
export function domainNev(cim: string): string {
  try {
    return new URL(cim).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function hrefek(html: string, alap: string): { cim: URL; szoveg: string }[] {
  const ki: { cim: URL; szoveg: string }[] = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/giu;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    try {
      ki.push({ cim: new URL(m[1]!.trim(), alap), szoveg: m[2]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
    } catch {
      /* rossz cím: kimarad */
    }
  }
  return ki;
}

/** A honlapon talált Facebook- vagy Instagram-oldal (a megosztó és bővítmény-linkek nélkül); nincs: üres. */
export function kozossegiLink(html: string, alap: string): string {
  for (const { cim } of hrefek(html, alap)) {
    const host = cim.hostname.replace(/^(www|m)\./, "");
    if (!/^(facebook\.com|instagram\.com)$/.test(host)) continue;
    if (/^\/(sharer|share|plugins|dialog|tr|login|policy|privacy|help)/i.test(cim.pathname) || cim.pathname === "/" || cim.pathname === "") continue;
    return `${host}${cim.pathname.replace(/\/+$/, "")}`;
  }
  return "";
}

const KINALAT_LINK = /(szolg|árak|arak|árlist|arlist|étlap|etlap|menü|menu|termék|termek|kínálat|kinalat|servicii|serviciu|pret|prețuri|meniu|produse|services|prices|pricing|products|offer)/iu;
/** A honlap saját aloldalai, amelyek a kínálatot mutathatják (legfeljebb 3, a kezdőlap nélkül). */
export function kinalatAloldalak(html: string, alap: string): string[] {
  let host = "";
  try { host = new URL(alap).hostname; } catch { return []; }
  const ki: string[] = [];
  for (const { cim, szoveg } of hrefek(html, alap)) {
    if (cim.hostname !== host || !/^https?:$/.test(cim.protocol)) continue;
    if (!KINALAT_LINK.test(`${cim.pathname} ${szoveg}`)) continue;
    const u = `${cim.origin}${cim.pathname}`;
    if (u === alap.replace(/#.*$/, "") || ki.includes(u)) continue;
    ki.push(u);
    if (ki.length >= 3) break;
  }
  return ki;
}

const TARTALEK: Record<string, { vendeglato: TemaTerv[]; mas: TemaTerv[]; fesztival: TemaTerv[]; szolg: (nev: string) => string }> = {
  hu: {
    vendeglato: [
      { tema: "Napi / heti menü", tipus: "picmess" }, { tema: "Új étel a kínálatban", tipus: "album" },
      { tema: "Tudtad? — a konyhánk titkai", tipus: "kartya" }, { tema: "Egy nap a konyhán", tipus: "video" },
      { tema: "Kérdezd meg a vendégeidet", tipus: "szavazas" },
    ],
    mas: [
      { tema: "Munkáink — kész munkák, előtte–utána", tipus: "album" }, { tema: "Tudtad? — szakmai tippek", tipus: "kartya" },
      { tema: "Ajánlatok, akciók", tipus: "picmess" }, { tema: "Egy nap a munkában", tipus: "video" },
      { tema: "Kérdezd meg a követőidet", tipus: "szavazas" },
    ],
    // c30 F7 (terv §4): a fesztivál témái — a fajta a téma kulcsa, a típus a szokásos formátum
    fesztival: [
      { tema: "Visszaszámlálás a fesztiválig", tipus: "kartya", fajta: "visszaszamlalo" }, { tema: "Holnapi program", tipus: "picmess", fajta: "holnapi_program" },
      { tema: "Mai program", tipus: "picmess", fajta: "mai_program" }, { tema: "Fellépők bemutatása", tipus: "picmess", fajta: "fellepo" },
      { tema: "Tudnivalók: helyszín, parkolás, belépés", tipus: "kartya", fajta: "gyakorlati" }, { tema: "Fotóalbum a fesztivál napjairól", tipus: "album", fajta: "album" },
      { tema: "Köszönjük — visszatekintés", tipus: "album", fajta: "koszono" },
    ],
    szolg: (nev) => `Szolgáltatásunk: ${nev}`,
  },
  ro: {
    vendeglato: [
      { tema: "Meniul zilei / săptămânii", tipus: "picmess" }, { tema: "Preparat nou în meniu", tipus: "album" },
      { tema: "Știai? — secretele bucătăriei", tipus: "kartya" }, { tema: "O zi în bucătărie", tipus: "video" },
      { tema: "Întreabă-ți clienții", tipus: "szavazas" },
    ],
    mas: [
      { tema: "Lucrările noastre — înainte și după", tipus: "album" }, { tema: "Știai? — sfaturi de specialitate", tipus: "kartya" },
      { tema: "Oferte, promoții", tipus: "picmess" }, { tema: "O zi la lucru", tipus: "video" },
      { tema: "Întreabă-ți urmăritorii", tipus: "szavazas" },
    ],
    fesztival: [
      { tema: "Numărătoare inversă până la festival", tipus: "kartya", fajta: "visszaszamlalo" }, { tema: "Programul de mâine", tipus: "picmess", fajta: "holnapi_program" },
      { tema: "Programul de azi", tipus: "picmess", fajta: "mai_program" }, { tema: "Artiștii festivalului", tipus: "picmess", fajta: "fellepo" },
      { tema: "Informații practice: locație, parcare, acces", tipus: "kartya", fajta: "gyakorlati" }, { tema: "Album foto din zilele festivalului", tipus: "album", fajta: "album" },
      { tema: "Mulțumim — o privire înapoi", tipus: "album", fajta: "koszono" },
    ],
    szolg: (nev) => `Serviciul nostru: ${nev}`,
  },
  en: {
    vendeglato: [
      { tema: "Daily / weekly menu", tipus: "picmess" }, { tema: "A new dish", tipus: "album" },
      { tema: "Did you know? — kitchen secrets", tipus: "kartya" }, { tema: "A day in the kitchen", tipus: "video" },
      { tema: "Ask your guests", tipus: "szavazas" },
    ],
    mas: [
      { tema: "Our work — before and after", tipus: "album" }, { tema: "Did you know? — expert tips", tipus: "kartya" },
      { tema: "Offers", tipus: "picmess" }, { tema: "A day at work", tipus: "video" },
      { tema: "Ask your followers", tipus: "szavazas" },
    ],
    fesztival: [
      { tema: "Countdown to the festival", tipus: "kartya", fajta: "visszaszamlalo" }, { tema: "Tomorrow's programme", tipus: "picmess", fajta: "holnapi_program" },
      { tema: "Today's programme", tipus: "picmess", fajta: "mai_program" }, { tema: "Meet the performers", tipus: "picmess", fajta: "fellepo" },
      { tema: "Practical info: venue, parking, entry", tipus: "kartya", fajta: "gyakorlati" }, { tema: "Photo album from the festival days", tipus: "album", fajta: "album" },
      { tema: "Thank you — a look back", tipus: "album", fajta: "koszono" },
    ],
    szolg: (nev) => `Our service: ${nev}`,
  },
};

/** c30 F1 (plan §3 `kinalat-szabaly.ts TARTALEK`): the fallback topic set is chosen BY CATEGORY. Today only hospitality has its
 *  own set; every other company category uses the general set, both kept word for word from round 7. A category with its own
 *  set later = one line here plus its texts (the festival set waits for F7). */
const KATEGORIA_SZETT: Partial<Record<Kategoria, "vendeglato">> = { vendeglatas: "vendeglato" };

/** Gép nélküli tartalék-terv (ha az AI nem válaszol): a fajták szokásos párosítása (IRANYOK-round7.md „Typical mapping”).
 *  `kat`: the category (`kategoriaOf`); a boolean is still accepted with its round-7 meaning (true = hospitality). */
export function temaTartalek(kinalat: readonly KinalatSor[], kat: Kategoria | boolean, nyelv: string, tipus?: SzervezetTipus): TemaTerv[] {
  const t = TARTALEK[nyelv] ?? TARTALEK["hu"]!;
  if (tipus === "fesztival") return [...t.fesztival]; // c30 F7: a fesztiválnak nincs kínálata — a saját témakészlete
  const k: Kategoria = typeof kat === "boolean" ? (kat ? "vendeglatas" : "semleges") : kat;
  const alap = KATEGORIA_SZETT[k] === "vendeglato" ? t.vendeglato : t.mas;
  const szolg = kinalat.filter((k) => k.aktiv).slice(0, 2).map((k) => ({ tema: t.szolg(k.nev).slice(0, 160), tipus: "picmess" as const }));
  return [alap[0]!, ...szolg, ...alap.slice(1)].slice(0, 8);
}

/** c30 F7 (terv §3 temak_terv): a cég szakmájának sora a tématerv bemenetében — eddig csak a vendéglátás kapott sort („A cég vendéglátással
 *  foglalkozik.”); most minden szakma irányítja a témákat. „semleges”: nincs sor. A prompt magyar, ezért a sor is az. */
const SZAKMA: Record<Kategoria, string> = {
  epites: "építőipar", vendeglatas: "vendéglátás", bolt: "bolt, kereskedelem", szepseg: "szépségápolás", iroda: "irodai szolgáltatás",
  muhely: "műhely, szerviz", kozlekedes: "közlekedés, szállítás", kert: "kert, kertészet", semleges: "",
};
export function szakmaSor(kat: Kategoria): string {
  return SZAKMA[kat] ? `A cég szakmája: ${SZAKMA[kat]}.` : "";
}
