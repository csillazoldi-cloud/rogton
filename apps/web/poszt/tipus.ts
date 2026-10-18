// R-18 7. kör (Csilla 10-12, IRANYOK-round7.md „Post types in Posztszöveg”): a poszt fajtái — tiszta függvények, adatbázis nélkül
// (probak/r18-kor7.proba.ts). A gép bemenetének kínálat- és tématerv-blokkja (az árak csak „Igen”-nél), az árak utóellenőrzése
// („Nem”-nél a lista árai nem maradhatnak a kimenetben), a fajta-kimenet ellenőrzése, a videó szószáma és a másolható szövegek.
import { PosztTipus, TipusAdat, type KinalatSor, type TemaTerv } from "@rogton/contracts";

/** A kínálat a gép elé (mint a profil): a bekapcsolt sorok; ár csak ha a cég kérte („Igen”) és van. Üres listánál nincs blokk. */
export function kinalatSorok(kinalat: readonly KinalatSor[] | null | undefined, arakPosztban: boolean | undefined): string[] {
  const l = (kinalat ?? []).filter((k) => k.aktiv && k.nev.trim());
  if (l.length === 0) return [];
  const arral = arakPosztban === true;
  return [
    "=== A CÉG KÍNÁLATA (szolgáltatások, termékek, ételek) ===",
    ...l.map((k) => `- ${k.nev}${k.reszlet ? ` (${k.reszlet})` : ""}${arral && k.ar ? ` · ár: ${k.ar}` : ""}`),
    arral
      ? "Árat csak ebből a listából írj, pontosan így; ami itt nincs árazva, annak az árát ne találd ki."
      : "Árat, díjat, összeget NE írj a posztba (a cég kérte).",
    "=== A KÍNÁLAT VÉGE ===",
  ];
}

const TIPUS_NEV: Record<PosztTipus, string> = { album: "Fotóalbum", picmess: "Picmess kép", video: "Videó", szavazas: "Szavazás", kartya: "Szöveges kártya" };

/** A tématerv a gép elé: miről érdemes posztolni, melyik fajtában. */
export function temaTervSorok(terv: readonly TemaTerv[] | null | undefined): string[] {
  const l = (terv ?? []).filter((t) => t.tema.trim());
  if (l.length === 0) return [];
  return ["=== A CÉG TÉMATERVE (miről érdemes posztolnia) ===", ...l.map((t) => `- ${t.tema} · ${TIPUS_NEV[t.tipus]}`), "=== A TÉMATERV VÉGE ==="];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Utóellenőrzés: ha a cég NEM kér árat a posztokba, a kínálat-listán álló árak (pl. „85 lej/m²-től”) nem maradhatnak a kimenetben —
 * akkor sem, ha a forrás (a hír, a saját ötlet) tartalmazta őket. A kivágás után a maradék írásjeleket és szóközöket rendbe tesszük.
 */
export function arakNelkul(szoveg: string, kinalat: readonly KinalatSor[] | null | undefined, arakPosztban: boolean | undefined): string {
  if (arakPosztban === true || !szoveg) return szoveg;
  const arak = [...new Set((kinalat ?? []).map((k) => k.ar.trim()).filter((a) => a.length >= 2))].sort((a, b) => b.length - a.length);
  if (arak.length === 0) return szoveg;
  let ki = szoveg;
  for (const ar of arak) ki = ki.replace(new RegExp(`\\s*(?:[·,–-]\\s*)?${esc(ar)}`, "giu"), "");
  return ki.replace(/\(\s*\)/g, "").replace(/[ \t]{2,}/g, " ").replace(/[ \t]+([.,!?])/g, "$1").trim();
}

/** A gép bemenetének első sora: melyik fajtát kérjük (a prompt ebből tudja, milyen JSON-t adjon). */
export function tipusSor(tipus: PosztTipus): string {
  return `Poszt fajtája: ${tipus}`;
}

export type TipusKimenet = { adat: TipusAdat; szoveg: string };

const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const lista = (v: unknown, max: number, db: number) => (Array.isArray(v) ? v.map((x) => s(x, max)).filter(Boolean).slice(0, db) : []);

/** A gép JSON-válaszából a fajta kimenete (ellenőrizve); ha nem használható, null — a hívó ilyenkor hibát ad, nem félkész kimenetet. */
export function tipusKimenet(tipus: PosztTipus, nyers: unknown): TipusKimenet | null {
  const o = (nyers ?? {}) as Record<string, unknown>;
  const szoveg = typeof o["szoveg"] === "string" ? o["szoveg"].trim().slice(0, 6000) : "";
  let jelolt: unknown;
  if (tipus === "video") {
    const sorok = Array.isArray(o["sorok"]) ? (o["sorok"] as Record<string, unknown>[]).map((r) => ({ ido: s(r?.["ido"], 20), elmondod: s(r?.["elmondod"], 400), felirat: s(r?.["felirat"], 60), kep: s(r?.["kep"], 160) })).filter((r) => r.elmondod).slice(0, 10) : [];
    if (sorok.length < 2) return null;
    jelolt = { tipus, video: { sorok, hookok: lista(o["hookok"], 200, 2) } };
  } else if (tipus === "szavazas") {
    const valaszok = lista(o["valaszok"], 80, 4);
    jelolt = { tipus, szavazas: { kerdes: s(o["kerdes"], 200), valaszok } };
    if (!s(o["kerdes"], 200) || valaszok.length < 2) return null;
  } else if (tipus === "album") {
    const kepek = lista(o["kepek"], 120, 10);
    if (kepek.length < 2 || !szoveg) return null;
    jelolt = { tipus, album: { kepek } };
  } else {
    const cim = s(o["cim"], 90);
    if (!cim || !szoveg) return null;
    jelolt = { tipus, kartya: { cim, sor: s(o["sor"], 140) } };
  }
  const e = TipusAdat.safeParse(jelolt);
  return e.success ? { adat: e.data, szoveg } : null;
}

/** A videó kimondott szavai (a „{n} szó · kb. {mp} mp” sorhoz): 2,3 szó / mp-cel számolva. */
export function videoSzamlalo(sorok: readonly { elmondod: string }[]): { szo: number; mp: number } {
  const szo = sorok.reduce((n, r) => n + (r.elmondod.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu)?.length ?? 0), 0);
  return { szo, mp: Math.round(szo / 2.3) };
}

/** A videó-forgatókönyv sima szövegként (a „Másolás” ezt viszi): soronként szám, idő, elmondod, felirat, kép. */
export function videoSzoveg(sorok: readonly { ido: string; elmondod: string; felirat: string; kep: string }[], cimkek: { elmondod: string; felirat: string; kep: string }): string {
  return sorok
    .map((r, i) => [`${i + 1}. ${r.ido}`, `${cimkek.elmondod}: ${r.elmondod}`, r.felirat ? `${cimkek.felirat}: ${r.felirat}` : "", r.kep ? `${cimkek.kep}: ${r.kep}` : ""].filter(Boolean).join("\n"))
    .join("\n\n");
}

/** A szavazás másolható szövege: a kérdés, alatta a válaszok számozva. */
export function szavazasSzoveg(kerdes: string, valaszok: readonly string[]): string {
  return [kerdes.trim(), ...valaszok.map((v) => v.trim()).filter(Boolean).map((v, i) => `${i + 1}. ${v}`)].join("\n");
}

const SZO = /[\p{L}\p{N}]{4,}/gu;
const toldalekNelkul = (w: string) => w.toLocaleLowerCase("hu").slice(0, 5);
/** A poszt témájából a tématerv javasolt fajtája: a legtöbb közös (legalább 4 betűs) szótő nyer; egy sincs: nincs javaslat. */
export function javasoltTipus(cim: string, terv: readonly TemaTerv[] | null | undefined): PosztTipus | null {
  const szavak = new Set((cim.match(SZO) ?? []).map(toldalekNelkul));
  if (szavak.size === 0) return null;
  let legjobb: PosztTipus | null = null, pont = 0;
  for (const t of terv ?? []) {
    const p = new Set((t.tema.match(SZO) ?? []).map(toldalekNelkul).filter((w) => szavak.has(w))).size;
    if (p > pont) { pont = p; legjobb = t.tipus; }
  }
  return legjobb;
}

/**
 * R-18 7. kör utókör (Csilla 10-12, élőben: a „Csapatépítő hétvége Szovátán … Medve-tó” ötletből a videó túrázást és tábortüzet, a szavazás
 * „tábortüzes estét” talált ki; a helynév „Bear Lake” lett). Az ellenőrizhető része: a kimenet SZÁMAI és TULAJDONNEVEI csak a bemenetből
 * jöhetnek (kiváltó, profil, kínálat, hivatalos nevek). A tevékenységek kitalálását szó szerint nem lehet megbízhatóan mérni — arra a prompt
 * (poszt_tipus v2) szabálya és a próbák felelnek; ez az őr a számot és a nevet fogja meg (a hívó egyszer újrakéri a gépet, megnevezve őket).
 * Név: nagybetűs szó, ami nem mondat elején áll és nem csupa nagybetű (a képfelirat „ELŐTTE” nem név); a ragozott alak a szótövén
 * (első 5 betű) egyezik („a Medve-tónál” ← „Medve-tó”). Szám: minden számjegy-sor, ami a bemenetben nem fordul elő.
 */
export function kitalaltReszek(kimenet: readonly string[], bemenet: string): { szamok: string[]; nevek: string[] } {
  const be = bemenet.toLocaleLowerCase("hu");
  const beSzamok = new Set(bemenet.match(/\d+/g) ?? []);
  // c30 F7: a ragozott név („a Középkori Várban”, „a Győzelem téren”) a bemenet szavából + legfeljebb 4 betűs toldalékból — nem kitalált
  const beSzavak = new Set(be.match(/\p{L}{3,}/gu) ?? []);
  const ragozott = (szo: string) => { const k = szo.toLocaleLowerCase("hu"); for (let i = 3; i < k.length && k.length - i <= 4; i++) if (beSzavak.has(k.slice(0, i))) return true; return false; };
  const szamok = new Set<string>(), nevek = new Set<string>();
  for (const sz of kimenet) {
    for (const n of sz.match(/\d+/g) ?? []) if (!beSzamok.has(n)) szamok.add(n);
    const re = /(^|[.!?…:]\s+|["„“(]\s*)?(\p{Lu}[\p{L}'’-]*)/gu;
    for (let m = re.exec(sz); m; m = re.exec(sz)) {
      const szo = m[2]!;
      const elotte = sz.slice(0, m.index + (m[1]?.length ?? 0)).trimEnd();
      if (m[1] !== undefined || elotte === "" || /[.!?…:]$/.test(elotte)) continue; // mondat eleje
      if (szo === szo.toLocaleUpperCase("hu") || szo.length < 3) continue; // csupa nagybetű (képfelirat) vagy rövid
      const to = szo.toLocaleLowerCase("hu").replace(/[-'’].*$/, "").slice(0, 5);
      if (to.length >= 3 && !be.includes(to) && !ragozott(szo)) nevek.add(szo);
    }
  }
  return { szamok: [...szamok], nevek: [...nevek] };
}

/** c30 F7 (terv §3): a tényőr egy sima poszt szövegére, egy újrakéréssel. `kimenetSzoveg` kiveszi a válaszból az ellenőrzendő szöveget;
 *  ha abban a bemenetben nem szereplő szám vagy név van, `ujra` EGYSZER fut a megnevező FIGYELEM-sorral, és a második válasz marad
 *  (akkor is, ha nem tökéletes — mint a fajta-posztoknál). Tiszta vezérlés: a gép hívását a hívó adja (próbában hamis gép). */
export async function tenyorrelKer<T>(elso: T, bemenet: string, kimenetSzoveg: (valasz: T) => string, ujra: (javitoBemenet: string) => Promise<T>): Promise<{ valasz: T; ujrakert: string[] }> {
  const k1 = kitalaltReszek([kimenetSzoveg(elso)], bemenet);
  if (!k1.szamok.length && !k1.nevek.length) return { valasz: elso, ujrakert: [] };
  const tilos = [...k1.nevek, ...k1.szamok];
  const javito = `${bemenet}\nFIGYELEM — az előző válaszodban ezek nem szerepelnek a bemenetben, NE használd őket: ${tilos.join(", ")}. Időpontot, fellépőt, helyszínt csak a megadott programból írj.`;
  return { valasz: await ujra(javito), ujrakert: tilos };
}

/** A fajta-kimenet összes szövege (az őrhöz). */
export function tipusSzovegek(adat: TipusAdat, szoveg: string): string[] {
  return [
    szoveg,
    ...(adat.video?.sorok.flatMap((r) => [r.elmondod, r.felirat, r.kep]) ?? []),
    ...(adat.video?.hookok ?? []),
    ...(adat.szavazas ? [adat.szavazas.kerdes, ...adat.szavazas.valaszok] : []),
    ...(adat.album?.kepek ?? []),
    ...(adat.kartya ? [adat.kartya.cim, adat.kartya.sor] : []),
  ].filter(Boolean);
}

/**
 * R-18 8. kör (Kati 10-13: a videó B-roll cellájában „no invented activities shown” állt): a prompt saját szabályának visszhangja nem
 * lehet a kimenetben. Igaz, ha a szöveg a szabályt mondja vissza (HU / EN / RO fordulatok). A hívó újrakér, és ami így is marad, kiveszi.
 */
const VISSZHANG = /(no invented|not invented|invented (activit|detail|fact)|only (the )?(given|provided) facts|csak a megadott t[ée]ny|kital[áa]lt (tev[ée]kenys[ée]g|r[ée]szlet|t[ée]ny)|nincs kital[áa]lt|semmi kital[áa]lt|nimic inventat|doar faptele|f[ăa]r[ăa] activit[ăa][țt]i inventate)/iu;
export function szabalyVisszhang(szoveg: string): boolean {
  return VISSZHANG.test(szoveg);
}

/** A visszhangos mezők kivétele: képleírás / felirat / képsor eleme üres lesz (illetve kimarad); a kimondott és a válasz marad (azt az újrakérés javítja). */
export function visszhangNelkul(adat: TipusAdat): TipusAdat {
  const t = (s: string) => (szabalyVisszhang(s) ? "" : s);
  return {
    ...adat,
    ...(adat.video ? { video: { sorok: adat.video.sorok.map((r) => ({ ...r, kep: t(r.kep), felirat: t(r.felirat) })), hookok: adat.video.hookok.filter((h) => !szabalyVisszhang(h)) } } : {}),
    ...(adat.album ? { album: { kepek: adat.album.kepek.filter((k) => !szabalyVisszhang(k)) } } : {}),
    ...(adat.kartya ? { kartya: { cim: adat.kartya.cim, sor: t(adat.kartya.sor) } } : {}),
  };
}
