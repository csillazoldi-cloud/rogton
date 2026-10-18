import "server-only";
import {
  PosztForras,
  PosztFelulet,
  type PosztMunka,
  type PosztSzoveg,
  type PosztFelulet as PosztFeluletTipus,
  PosztNyelv,
  type PosztNyelv as PosztNyelvTipus,
  type OsszhangAllapot,
  type IranytuSema,
  type PosztTipus,
} from "@rogton/contracts";
import { AiHiba, type FeladatTipus, type HivasMeres } from "@rogton/ai-adapters";
import {
  szolgaltato,
  keretEllenoriz,
  meresRogzit,
  prompt,
  jsonRobusztusan,
  AiKozosHiba,
} from "../ai";
import { iranytuTar } from "../iranytu/tar";
import { profilBetolt } from "../profil";
import { profilSorok, programSorok } from "./profil-blokk";
import { programTar } from "../program/tar";
import { programNevek } from "../program/blokk";
import { tipusOf } from "../profil/tipus-szabaly";
import { fesztivalBemenet } from "../ai/fesztival-szo";
import {
  BLOG_CIM_MAX,
  BLOG_HATAR,
  KARAKTERHATAR,
  LATHATO_HATAR,
  POSZT_PROMPTOK,
  atirasBemenet,
  forditasBemenet,
  forditasForrasa,
  szovegBemenet,
  kozolhetoSzoveg,
  forditasCimNelkul,
  ctaSorok,
} from "./bemenet";
import { nevCsere } from "./nevek";
import { arakNelkul, kitalaltReszek, szabalyVisszhang, tenyorrelKer, tipusKimenet, tipusSor, tipusSzovegek, visszhangNelkul } from "./tipus";
import { posztTar } from "./tar";
import { alapCta, ketnyelvuFelulet, ketnyelvuKeret, tulHosszu } from "./ketnyelvu";
import { masodikNyelv, nyelvMod } from "@rogton/profile-core";
import { tiltottSzavakEllenorzes } from "./szuro";
import { VALASZTO_NAPOK, ervenyesNap, javaslatokatAd, napKulcs, napokKozott, type Nap, type NaptarPoszt } from "./naptar";

// R-11/A · Posztszöveg — a gépezet. Egy munka = egy gondolat; azon belül cellák: felület × nyelv.
// A cég iránytűje NEM forrás, hanem SZŰRŐ: a szöveg a kiváltóból születik, az iránytű csak megméri.
// Az összhangjelzés figyelmeztetés, nem zár: pirossal is lehet véglegesíteni (A-6).

export class PosztHiba extends Error {
  constructor(
    public readonly kod:
      | "AI_NEM_ELERHETO"
      | "AI_KERET_KIMERULT"
      | "AI_KIKAPCSOLVA"
      | "ERVENYTELEN_ADAT"
      | "NINCS_ILYEN_TALALAT",
    public readonly mezok?: Record<string, string>,
  ) {
    super(kod);
    this.name = "PosztHiba";
  }
}

/** Egy cella címe: melyik munka, melyik felület, melyik nyelv — és milyen nyelven szól a kezelőhöz. */
export type PosztKeres = {
  szervezetId: string;
  id: string;
  felulet: PosztFeluletTipus;
  nyelv: PosztNyelvTipus;
  uiNyelv: string;
  /** R-13: a kérő fiók — az AI-munka az ő kreditjéből megy (ha ismert) */
  fiokId?: string;
};

// A-7: a platformok felső határa és a látható rész — a bemenet-építővel együtt a bemenet.ts-ben (tiszta modul).
export { KARAKTERHATAR, LATHATO_HATAR };

/**
 * A poszt AI-hívásainak kimeneti felső határa. 2026-09-21: a profil (hosszú hangnem) óta a bemenet nagyobb, és a
 * gpt-5-mini a gondolkodásra is ebből költ — az iránytű 900 tokennél üres választ adott (MÉRVE). Felső határ, nem költség.
 */
const POSZT_KI_TOKEN = 2500;

function szoveg(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function szovegLista(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const ki: string[] = [];
  for (const elem of v) {
    const s = szoveg(elem);
    if (s) ki.push(s);
  }
  return ki;
}

async function keretVagyPosztHiba(szervezetId: string, fiokId?: string): Promise<void> {
  try {
    await keretEllenoriz(szervezetId, fiokId);
  } catch (h) {
    if (h instanceof AiKozosHiba) throw new PosztHiba(h.kod);
    throw h;
  }
}

/**
 * Egy AI-hívás a poszt-gépezetből: keret → hívás → mérés → JSON.
 * A hibát is mérjük (E-7), és PosztHibára fordítjuk — a lap ebből tud állapotot mutatni.
 */
async function aiKer(
  hivo: { szervezetId: string; fiokId?: string },
  feladat: FeladatTipus,
  promptFajl: string,
  uiNyelv: string,
  tartalomNyelv: string,
  szovegBe: string,
  maxKiToken: number,
  gondolkodas?: "minimal" | "low",
): Promise<unknown> {
  const { szervezetId, fiokId } = hivo;
  await keretVagyPosztHiba(szervezetId, fiokId);
  const sz = szolgaltato();
  const t0 = Date.now();
  // c30 F12: fesztiválnál a rendszerprompt és a gép saját bemeneti mondatai „a fesztivál”-ról szólnak (ai/fesztival-szo.ts)
  const fesz = await fesztivalE(szervezetId);
  try {
    const v = await sz.hiv({
      feladat,
      rendszer: await prompt(promptFajl, uiNyelv, tartalomNyelv, fesz ? "fesztival" : undefined),
      szoveg: fesz ? fesztivalBemenet(szovegBe) : szovegBe,
      nyelv: tartalomNyelv,
      maxKiToken,
      idokorlatMs: 40_000,
      ...(gondolkodas ? { gondolkodas } : {}),
    });
    await meresRogzit(szervezetId, v.meres, fiokId);
    return JSON.parse(jsonRobusztusan(v.szoveg)) as unknown;
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = {
      szolgaltato: sz.leirolap.azonosito,
      modell: sz.leirolap.modell,
      feladat,
      tokenek_be: 0,
      tokenek_ki: 0,
      becsult_usd: 0,
      ido_ms: Date.now() - t0,
      allapot: "hiba",
      hiba_kod: kod,
    };
    await meresRogzit(szervezetId, meres);
    if (kod === "AI_KERET_KIMERULT") throw new PosztHiba("AI_KERET_KIMERULT");
    console.error("poszt AI-hívás sikertelen:", feladat, kod, hiba instanceof Error ? hiba.message : hiba);
    throw new PosztHiba("AI_NEM_ELERHETO", { ok: kod });
  }
}

// ---------------------------------------------------------------------------
// Cellák
// ---------------------------------------------------------------------------

function cellaKeres(munka: PosztMunka, felulet: PosztFeluletTipus, nyelv: PosztNyelvTipus): PosztSzoveg | null {
  return munka.szovegek.find((sz) => sz.felulet === felulet && sz.nyelv === nyelv) ?? null;
}

function ujCella(felulet: PosztFeluletTipus, nyelv: PosztNyelvTipus): PosztSzoveg {
  return {
    felulet,
    nyelv,
    szoveg: "",
    javaslat: "",
    hashtagek: [],
    allapot: "nincs",
    veglegesitve: null,
    nyelvre_szabva: false,
    elavult_forditas: false,
  };
}

/** A cella megkeresése, és ha még nincs, létrehozása. */
function cellatBiztosit(munka: PosztMunka, felulet: PosztFeluletTipus, nyelv: PosztNyelvTipus): PosztSzoveg {
  const meglevo = cellaKeres(munka, felulet, nyelv);
  if (meglevo) return meglevo;
  const uj = ujCella(felulet, nyelv);
  munka.szovegek.push(uj);
  return uj;
}

/** A-9: a magyar eredeti változása nem írja felül a fordítást — csak megjelöli elavultként. */
function elavultForditasokatJelol(munka: PosztMunka, forrasNyelv: PosztNyelvTipus): void {
  for (const sz of munka.szovegek) {
    if (sz.nyelv !== forrasNyelv && sz.szoveg.trim().length > 0) sz.elavult_forditas = true;
  }
}

function hashtageketFuz(torzs: string, hashtagek: string[]): string {
  if (hashtagek.length === 0) return torzs;
  const sor = hashtagek.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
  return `${torzs}\n\n${sor}`;
}

type NyersSzovegValasz = { szoveg?: unknown; cim?: unknown; hashtagek?: unknown; rovid_nev?: unknown; rovid_cim?: unknown; otlet?: unknown };

/** R-17 C: a blog felületen nincs hashtag (a gép mégis adhat — eldobjuk), és a cím a cellába kerül, legfeljebb BLOG_CIM_MAX karakter. */
function blogra(felulet: PosztFeluletTipus, a: { szoveg: string; cim: string; hashtagek: string[] }): { vegso: string; cim: string | undefined; hashtagek: string[] } {
  if (felulet !== "blog") return { vegso: hashtageketFuz(a.szoveg, a.hashtagek), cim: undefined, hashtagek: a.hashtagek };
  return { vegso: a.szoveg, cim: a.cim.slice(0, BLOG_CIM_MAX), hashtagek: [] };
}

function nyersSzovegetAlakit(nyers: unknown): { szoveg: string; cim: string; hashtagek: string[]; rovid_nev: string; rovid_cim: string; otlet: string } {
  const n = (nyers ?? {}) as NyersSzovegValasz;
  return {
    szoveg: szoveg(n.szoveg),
    cim: szoveg(n.cim).replace(/\s+/g, " "),
    hashtagek: szovegLista(n.hashtagek),
    rovid_nev: szoveg(n.rovid_nev).slice(0, 60),
    rovid_cim: szoveg(n.rovid_cim).slice(0, 160),
    otlet: szoveg(n.otlet).replace(/[.。]+$/u, "").slice(0, 160),
  };
}

// ---------------------------------------------------------------------------
// Munkák
// ---------------------------------------------------------------------------

export async function munkatLetrehoz(szervezetId: string, fiokId: string, be: unknown): Promise<PosztMunka> {
  const b = (be ?? {}) as { forras?: unknown; cim?: unknown; felulet?: unknown; nyelv?: unknown; uj?: unknown; javasolt_nap?: unknown };
  const forrasE = PosztForras.safeParse(b.forras);
  if (!forrasE.success) throw new PosztHiba("ERVENYTELEN_ADAT", { forras: "hibas" });
  const feluletE = PosztFelulet.safeParse(b.felulet);
  if (!feluletE.success) throw new PosztHiba("ERVENYTELEN_ADAT", { felulet: "hibas" });
  const nyelvE = PosztNyelv.safeParse(b.nyelv);
  if (!nyelvE.success) throw new PosztHiba("ERVENYTELEN_ADAT", { nyelv: "hibas" });
  const nyelv = nyelvE.data;
  const cim = szoveg(b.cim) || forrasE.data.cim || forrasE.data.szoveg.slice(0, 60) || "Névtelen munka";

  // A-8: ugyanabból a hírből ugyanaz a munka nyílik meg, nem új — kivéve, ha kifejezetten újat kérnek.
  if (b.uj !== true && forrasE.data.azonosito) {
    const meglevok = await posztTar.lista(szervezetId, 200);
    for (const sor of meglevok) {
      if (sor.forras_azonosito && sor.forras_azonosito === forrasE.data.azonosito) {
        const teljes = await posztTar.betolt(szervezetId, sor.id);
        if (teljes) return teljes;
      }
    }
  }

  const munka = await posztTar.letrehoz(szervezetId, fiokId, cim, forrasE.data);
  munka.szovegek = [ujCella(feluletE.data, nyelv)];
  const mentett = await posztTar.ment(szervezetId, munka);
  // c30 F8 (terv §4, rajz D7): a horgonyzott ötletből („Megírjuk”) a poszt a horgony napját kapja javasolt napnak — a Naptár ezt mutatja,
  // amikor kész lesz (a gép javaslata a jövőbeli javasolt napot nem írja felül). Csak új munkánál; érvényes naptári nap kell.
  if (ervenyesNap(b.javasolt_nap)) await posztTar.naptarMent(szervezetId, mentett.id, { javasolt_nap: b.javasolt_nap });
  return mentett;
}

export async function munkatBetolt(szervezetId: string, id: string): Promise<PosztMunka> {
  const munka = await posztTar.betolt(szervezetId, id);
  if (!munka) throw new PosztHiba("NINCS_ILYEN_TALALAT", { id });
  return munka;
}

export async function munkakatListaz(szervezetId: string) {
  return posztTar.lista(szervezetId);
}

// ---------------------------------------------------------------------------
// Szövegkészítés és szerkesztés
// ---------------------------------------------------------------------------

/** c30 F7: a fesztivál programja (csak fesztiválnál; máskor és hibánál üres — a poszt akkor is megíródik). */
async function fesztivalProgram(szervezetId: string, p: Awaited<ReturnType<typeof profilBetolt>>) {
  if (!p || tipusOf(p) !== "fesztival") return null;
  return programTar.lista(szervezetId).catch(() => []);
}

/** c30 F7: fesztivál-e a szervezet (a tényőr ennél minden posztra áll). */
async function fesztivalE(szervezetId: string): Promise<boolean> {
  const p = await profilBetolt(szervezetId).catch(() => null);
  return !!p && tipusOf(p) === "fesztival";
}

/** A cég profilja az AI-bemenet elején (név, tevékenység, célközönség, cél, hangnem, minta). c30 F7 (terv §3): fesztiválnál utána a
 *  rendezvény és a program SZELETE (a poszt horgonya: a forrás azonosítója, vagy a kiváltóban megnevezett tételek), a szelet névpárjaival. */
async function profilBemenet(szervezetId: string, munka?: PosztMunka, nyelv?: string): Promise<string[]> {
  const p = await profilBetolt(szervezetId);
  const tetelek = munka ? await fesztivalProgram(szervezetId, p) : null;
  const program = tetelek && munka
    ? programSorok({ tetelek, rendezveny: p?.rendezveny ?? p?.rendezveny_javaslat, azonosito: munka.forras.azonosito, kivalto: [munka.forras.cim, munka.cim, munka.forras.szoveg].join("\n"), nyelv: nyelv ?? p?.nyelvek?.[0] ?? "hu" })
    : [];
  return [...profilSorok(p), ...program];
}

/** R-18 7. kör: a kínálat és az árak kérése — az árak utóellenőrzéséhez (arakNelkul: „Nem”-nél a lista árai nem maradnak a kimenetben). */
async function arSzuro(szervezetId: string): Promise<(szoveg: string) => string> {
  const p = await profilBetolt(szervezetId).catch(() => null);
  return (szoveg) => arakNelkul(szoveg, p?.kinalat, p?.arak_posztban);
}

/** R-18 6. kör (Kati D): a cég hivatalos nevei — az utóellenőrzéshez (nevCsere). c30 F7 (terv §3): fesztiválnál a program két nyelvű
 *  nevei és helyszínei is („Középkori Vár ↔ Cetatea Medievală”) — csak itt, a posztíráskor fűzve; a profilba nem írjuk. A cég saját
 *  listája elöl áll, így ütközésnél az nyer. */
async function hivatalosNevek(szervezetId: string) {
  const p = await profilBetolt(szervezetId).catch(() => null);
  const sajat = p?.hivatalos_nevek ?? [];
  const tetelek = await fesztivalProgram(szervezetId, p);
  return tetelek?.length ? [...sajat, ...programNevek(tetelek)] : sajat;
}

/**
 * c30 F3 (plan §5): is this cell one half of a "both languages in one post" (`egyben`)? Only for the org's first two languages and
 * not on the blog. Then each half gets half of the platform budget, and (D15) the call to action is written by the machine into
 * both halves — there is no separate CTA field in this mode. In every other case nothing changes (`egyben: false`).
 */
async function ketnyelvuKontextus(szervezetId: string, felulet: PosztFeluletTipus, nyelv: PosztNyelvTipus) {
  const p = await profilBetolt(szervezetId).catch(() => null);
  const elso = (p?.nyelvek?.[0] ?? null) as PosztNyelvTipus | null;
  const masodik = masodikNyelv(p) as PosztNyelvTipus | null;
  const egyben = nyelvMod(p) === "egyben" && !!elso && !!masodik && ketnyelvuFelulet(felulet) && (nyelv === elso || nyelv === masodik);
  const honlap = (p?.honlap ?? "").trim();
  return { egyben, elso, masodik, keret: egyben ? ketnyelvuKeret(felulet) : null, alapCta: egyben ? alapCta(honlap) : "" };
}

/**
 * R-18 6. kör (Kati C) → 8. kör (Kati 10-13: „a beírt felhívás szó szerint, idegenül került a végére”): „Beleírom” — a mező SZÁNDÉK. A szándék a
 * munkán nyelvenként megmarad (minden újraírás és „Új változat” megkapja), és a gép most a poszt hangján, a saját szavaival írja meg a zárást
 * (átírás „felhivas” művelettel: csak az utolsó bekezdés változik). Gépi munka: az átírás kreditjéből megy. Üres mező: a szándék törlődik
 * (a szöveg nem változik). A kliens a mező mostani szövegét küldi — előbb azt mentjük.
 */
export async function ctaBeleir(k: PosztKeres, mostaniSzoveg: string, cta: string): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const uj = cta.replace(/\s+/g, " ").trim().slice(0, 300);
  const cella = cellatBiztosit(munka, k.felulet, k.nyelv);
  if (mostaniSzoveg.trim()) cella.szoveg = mostaniSzoveg;
  munka.forras.cta = { ...(munka.forras.cta ?? {}), [k.nyelv]: uj };
  await posztTar.ment(k.szervezetId, munka);
  if (!uj || !cella.szoveg.trim()) return munkatBetolt(k.szervezetId, k.id);
  return szovegetAtir(k, "felhivas");
}

/** A mai nap Budapest szerint, ÉÉÉÉ-HH-NN. */
function maiNap(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(new Date());
}

/**
 * 2026-09-28 (Vilmos, a bűnmegelőzés-poszt): a 09-28 előtt hírből létrehozott posztoknál a kiváltó szövegének végén
 * ott maradt a kártya nekünk szóló ötlet-mondata („Készíthettek rövid posztot…”) — a gép ebből írt felajánlást
 * („ha érdekel, készítek…”). Hírnél az ilyen bekezdés nem megy a gép elé; az új posztokba már be sem kerül (hirbolPoszt).
 */
const OTLET_BEKEZDES = /^(készít|írhat|oszthat|megoszthat|posztolhat|bemutathat|kiemelhet|felhívhat|érdemes lehet)/i;

export function kivaltoSzoveg(munka: Pick<PosztMunka, "forras">): string {
  const sz = munka.forras.szoveg;
  if (munka.forras.tipus !== "hir") return sz;
  return sz.split(/\n\s*\n/).filter((b) => !OTLET_BEKEZDES.test(b.trim())).join("\n\n").trim();
}

function forrasBemenet(munka: PosztMunka, felulet: PosztFeluletTipus, profil: string[], nyelvKert: string, kx?: { keret: number | null; alapCta: string }): string {
  // R-18 3. kör: a bemenet építése a tiszta bemenet.ts-be költözött (szovegBemenet), hogy próbával őrizhető legyen — a tartalma változatlan,
  // kivéve a saját ötletet (kivaltoSorok). c30 F3: `egyben` módban a fél keret és (D15) a gép felhívása, ha a személy nem adott meg.
  return szovegBemenet(munka, felulet, profil, maiNap(), kivaltoSzoveg(munka), munka.forras.cta?.[nyelvKert] || kx?.alapCta || "", kx?.keret ?? null);
}

export async function szovegetKeszit(k: PosztKeres): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const kx = await ketnyelvuKontextus(k.szervezetId, k.felulet, k.nyelv);
  const bemenet = forrasBemenet(munka, k.felulet, await profilBemenet(k.szervezetId, munka, k.nyelv), k.nyelv, kx);
  const prompt = k.felulet === "blog" ? "poszt_cikk" : "poszt_szoveg"; // R-17 C2: a honlap-cikk saját promptja (cím + hosszabb szöveg, hashtag és emoji nélkül); a v6 szabályai abban is
  // v5 (2026-09-28, MÉRVE a bűnmegelőzés-hírre): „minimal”-lal a gép a mai dátum ellenére „zajlik”-ot / „ma kezdődött”-et írt;
  // „low”-val mindkét próbán helyes múlt idő, felajánlás nélkül. Ára ~2× (≈0,004 USD / poszt), ~10 mp.
  let nyers = await aiKer(k, "poszt_szoveg", prompt, k.uiNyelv, k.nyelv, bemenet, POSZT_KI_TOKEN, "low");
  // c30 F7 (terv §3): fesztiválnál a tényőr (poszt/tipus.ts kitalaltReszek) a sima posztra is áll — időpont, fellépő, szám csak a
  // bemenetből (a program szeletéből) jöhet. Ha a gép mást írt, egyszer újrakérjük, megnevezve, mit ne használjon; a második válasz marad.
  if (await fesztivalE(k.szervezetId)) {
    nyers = (await tenyorrelKer(nyers, bemenet, (v) => nyersSzovegetAlakit(v).szoveg, (javito) => aiKer(k, "poszt_szoveg", prompt, k.uiNyelv, k.nyelv, javito, POSZT_KI_TOKEN, "low"))).valasz;
  }
  const { szoveg: nyersTorzs, cim: cikkCim, hashtagek: nyersHashtagek, rovid_nev, rovid_cim, otlet } = nyersSzovegetAlakit(nyers);
  // Kati 10-11: csak közölhető szöveg — cím-sor és nekünk szóló sor nélkül (bemenet.ts kozolhetoSzoveg); ha a vágás mindent vinne, marad az eredeti
  const nevek = await hivatalosNevek(k.szervezetId);
  const arak = await arSzuro(k.szervezetId);
  // c30 F3 utómunka (10-17): a kiváltó címe(i) is mennek az őrnek — a mondatnak álcázott címet („Kökény Attila vasárnapi koncertje.”) is levágja
  const cimek = [munka.forras.cim, munka.cim, munka.forras.rovid_cim, rovid_cim].filter((x): x is string => typeof x === "string" && !!x.trim());
  const torzs = arak(nevCsere(kozolhetoSzoveg(nyersTorzs, cimek) || nyersTorzs, nevek, k.nyelv)); // R-18 6. kör: hivatalos nevek · 7. kör: árak csak „Igen”-nél
  const bl = blogra(k.felulet, { szoveg: torzs, cim: cikkCim, hashtagek: nyersHashtagek });
  const { cim, hashtagek } = bl;
  const cta = munka.forras.cta?.[k.nyelv] ?? "";
  void cta; // R-18 8. kör: a felhívás szándékát a gép a poszt hangján írja a végére (ctaSorok) — szó szerint nem illesztjük be
  const vegso = bl.vegso;
  // R-15 (gepezet 5, 11): a rövid név, a rövid cím és az ötlet az ELSŐ megíráskor kerül a munkára — utána nem változik
  if (!munka.forras.rovid_nev && rovid_nev) munka.forras.rovid_nev = rovid_nev;
  if (!munka.forras.rovid_cim && rovid_cim) munka.forras.rovid_cim = rovid_cim;
  if (!munka.forras.otlet && otlet) munka.forras.otlet = otlet;

  const cella = cellatBiztosit(munka, k.felulet, k.nyelv);
  cella.szoveg = vegso;
  cella.javaslat = vegso;
  cella.hashtagek = hashtagek;
  if (cim !== undefined) cella.cim = cim;
  cella.allapot = "javaslat";
  cella.veglegesitve = null;
  cella.elavult_forditas = false;
  elavultForditasokatJelol(munka, k.nyelv);

  await posztTar.ment(k.szervezetId, munka);
  return osszhangotVizsgal(k);
}

/**
 * R-18 7. kör (IRANYOK-round7.md): a poszt fajtája. A gép a fajtához illő kimenetet ad (videó-forgatókönyv · szavazás · fotóalbum ·
 * képre kerülő cím + sor); a fotóalbum, a Picmess kép és a szöveges kártya posztszövege a poszt mezőjébe kerül (ugyanazok az
 * utóellenőrzések, mint az „Új változat”-nál: közölhető szöveg, hivatalos nevek, árak, felhívás a végén). Ugyanaz a kredit, mint az új változaté.
 */
export async function tipustKeszit(k: PosztKeres, tipus: PosztTipus, extra = ""): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const mostani = cellaKeres(munka, k.felulet, k.nyelv)?.szoveg.trim() ?? "";
  // c30 F10: `extra` — a fotóalbum fotóinak leírása (a prompt album-szakasza szerint a felirat csak ezt és a programtételt mondhatja)
  const bemenet = [tipusSor(tipus), forrasBemenet(munka, k.felulet, await profilBemenet(k.szervezetId, munka, k.nyelv), k.nyelv), extra, mostani ? `A poszt mostani szövege (ebből dolgozz):\n${mostani}` : ""].filter(Boolean).join("\n");
  const nyers = await aiKer(k, "poszt_tipus", "poszt_tipus", k.uiNyelv, k.nyelv, bemenet, POSZT_KI_TOKEN, "low");
  let kimenet = tipusKimenet(tipus, nyers);
  // Csilla 10-12 (élőben kitalált túra, tábortűz, „Bear Lake”): a szám és a tulajdonnév csak a bemenetből jöhet — ha a gép mást írt,
  // egyszer újrakérjük, megnevezve, mit ne használjon (poszt/tipus.ts kitalaltReszek). A második válasz akkor is marad, ha nem tökéletes.
  if (kimenet) {
    const k1 = kitalaltReszek(tipusSzovegek(kimenet.adat, kimenet.szoveg), bemenet);
    const visszhang = tipusSzovegek(kimenet.adat, kimenet.szoveg).some(szabalyVisszhang); // R-18 8. kör: a szabály szövege a kimenetben
    if (k1.szamok.length || k1.nevek.length || visszhang) {
      const javito = `${bemenet}\nFIGYELEM — ${k1.szamok.length || k1.nevek.length ? `az előző válaszodban ezek nem szerepelnek a bemenetben, NE használd őket: ${[...k1.nevek, ...k1.szamok].join(", ")}. ` : ""}${visszhang ? "A szabályok szövege (pl. „nincs kitalált tevékenység”) NEM kerülhet egyetlen mezőbe sem — a „kep” mező csak azt írja le, mi látszik a képen." : ""}`;
      const masodik = tipusKimenet(tipus, await aiKer(k, "poszt_tipus", "poszt_tipus", k.uiNyelv, k.nyelv, javito, POSZT_KI_TOKEN, "low"));
      if (masodik) kimenet = masodik;
    }
  }
  if (!kimenet) throw new PosztHiba("AI_NEM_ELERHETO", { ok: "ROSSZ_VALASZ" });
  const nevek = await hivatalosNevek(k.szervezetId);
  const arak = await arSzuro(k.szervezetId);
  const tiszta = (x: string) => arak(nevCsere(x, nevek, k.nyelv));
  const adat = visszhangNelkul(kimenet.adat); // ami az újrakérés után is a szabályt mondja vissza, kimarad
  if (adat.video) adat.video = { sorok: adat.video.sorok.map((r) => ({ ...r, elmondod: tiszta(r.elmondod), felirat: tiszta(r.felirat) })), hookok: adat.video.hookok.map(tiszta) };
  if (adat.szavazas) adat.szavazas = { kerdes: tiszta(adat.szavazas.kerdes), valaszok: adat.szavazas.valaszok.map(tiszta) };
  if (adat.kartya) adat.kartya = { cim: tiszta(adat.kartya.cim), sor: tiszta(adat.kartya.sor) };
  munka.forras.poszt_tipus = tipus;
  munka.forras.tipus_adat = { ...(munka.forras.tipus_adat ?? {}), [k.nyelv]: adat };
  if (kimenet.szoveg) {
    const torzs = tiszta(kozolhetoSzoveg(kimenet.szoveg, [munka.forras.cim, munka.cim, munka.forras.rovid_cim].filter(Boolean)) || kimenet.szoveg); // c30 F3 utómunka
    const cta = munka.forras.cta?.[k.nyelv] ?? "";
    const vegso = torzs; // R-18 8. kör: a felhívás szándéka a gép bemenetében (ctaSorok), szó szerint nem illesztjük be
    void cta;
    const cella = cellatBiztosit(munka, k.felulet, k.nyelv);
    cella.szoveg = vegso;
    cella.javaslat = vegso;
    cella.allapot = "javaslat";
    cella.veglegesitve = null;
    elavultForditasokatJelol(munka, k.nyelv);
  }
  return posztTar.ment(k.szervezetId, munka);
}

/**
 * c30 F10 (terv §6): a fotóalbum felirata a választott fotók leírásából (és a poszt programtételéből — a profil bemenete adja), a poszt
 * fajtája „album”. `egyben` módban a szervezet második nyelvén is (a meglévő hű fordítással, mint a D6 két nyelvű posztnál): a két rész két
 * cella marad. Ha a gép nem elérhető, a hiba a hívóé (a fotók sorrendje ettől még megvan).
 */
export async function albumFeliratKeszit(k: PosztKeres, leirasok: string[]): Promise<PosztMunka> {
  const kx = await ketnyelvuKontextus(k.szervezetId, k.felulet, k.nyelv);
  const elso = kx.egyben && kx.elso ? kx.elso : k.nyelv;
  const sorok = leirasok.map((l, i) => `${i + 1}. ${l || "—"}`);
  const extra = sorok.length ? `A fotók leírása (a poszt sorrendjében):\n${sorok.join("\n")}` : "";
  let munka = await tipustKeszit({ ...k, nyelv: elso }, "album", extra);
  if (kx.egyben && kx.masodik && kx.masodik !== elso) munka = await forditastKeszit({ ...k, nyelv: kx.masodik });
  return munka;
}

/** c30 F10: a poszt két nyelve egy posztban (`egyben`) — a fotóalbum lapja ebből tudja, kell-e a második rész. */
export async function albumKetnyelvu(szervezetId: string, felulet: PosztFeluletTipus, nyelv: PosztNyelvTipus): Promise<{ elso: string; masodik: string | null }> {
  const kx = await ketnyelvuKontextus(szervezetId, felulet, nyelv);
  return { elso: kx.elso ?? nyelv, masodik: kx.egyben ? kx.masodik : null };
}

/** R-18 7. kör: vissza a sima szöveges poszthoz (a fajta kimenete megmarad, ha később visszaválasztják). */
export async function tipustTorol(szervezetId: string, id: string): Promise<PosztMunka> {
  const munka = await munkatBetolt(szervezetId, id);
  delete munka.forras.poszt_tipus;
  return posztTar.ment(szervezetId, munka);
}

export async function szovegetMent(
  szervezetId: string,
  id: string,
  felulet: PosztFeluletTipus,
  nyelv: PosztNyelvTipus,
  ujSzoveg: string,
  /** R-17 C2: a cikk címe (csak a blog felületen; undefined = nem változik) */
  ujCim?: string,
): Promise<PosztMunka> {
  const munka = await munkatBetolt(szervezetId, id);
  const cella = cellatBiztosit(munka, felulet, nyelv);
  cella.szoveg = ujSzoveg;
  if (felulet === "blog" && ujCim !== undefined) cella.cim = ujCim.replace(/\s+/g, " ").trim().slice(0, BLOG_CIM_MAX);
  cella.allapot = cella.szoveg.trim().length === 0 ? "nincs" : "szerkesztve";
  cella.veglegesitve = null;
  elavultForditasokatJelol(munka, nyelv);
  return posztTar.ment(szervezetId, munka);
}

export async function szovegetAtir(k: PosztKeres, muvelet: string, kijeloles?: string): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const cella = cellaKeres(munka, k.felulet, k.nyelv);
  if (!cella) throw new PosztHiba("NINCS_ILYEN_TALALAT", { felulet: k.felulet, nyelv: k.nyelv });

  const kijelolt = szoveg(kijeloles);
  const kx = await ketnyelvuKontextus(k.szervezetId, k.felulet, k.nyelv);
  // v3 (2026-09-30, Erika): a művelet a leírásával megy (bemenet.ts ATIRAS_MUVELETEK), a profil célközönségével együtt
  const bemenet = atirasBemenet(await profilBemenet(k.szervezetId, munka, k.nyelv), k.felulet, muvelet, kijelolt, cella.szoveg, munka.forras.cta?.[k.nyelv] || kx.alapCta, kx.keret);
  const nyers = await aiKer(k, "poszt_atiras", POSZT_PROMPTOK.atiras, k.uiNyelv, k.nyelv, bemenet, POSZT_KI_TOKEN);
  const { szoveg: nyersResz } = nyersSzovegetAlakit(nyers);
  const nevek = await hivatalosNevek(k.szervezetId);
  const tisztaResz = (await arSzuro(k.szervezetId))(nevCsere(kijelolt ? nyersResz : kozolhetoSzoveg(nyersResz, [munka.forras.cim, munka.cim, munka.forras.rovid_cim].filter(Boolean)) || nyersResz, nevek, k.nyelv)); // Kati 10-11 + hivatalos nevek + 7. kör: árak
  const ujResz = tisztaResz; // R-18 8. kör: a felhívás szándéka a bemenetben (atirasBemenet → ctaSorok); a gép a poszt hangján írja, nem illesztjük be
  if (!ujResz) throw new PosztHiba("AI_NEM_ELERHETO", { ok: "URES_VALASZ" });

  if (kijelolt) {
    const poz = cella.szoveg.indexOf(kijelolt);
    cella.szoveg =
      poz >= 0 ? cella.szoveg.slice(0, poz) + ujResz + cella.szoveg.slice(poz + kijelolt.length) : ujResz;
  } else {
    cella.szoveg = ujResz;
  }
  cella.allapot = "szerkesztve";
  cella.veglegesitve = null;
  elavultForditasokatJelol(munka, k.nyelv);

  return posztTar.ment(k.szervezetId, munka);
}

// ---------------------------------------------------------------------------
// Nyelvek
// ---------------------------------------------------------------------------

export async function forditastKeszit(k: PosztKeres, rovidites = true): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const kx = await ketnyelvuKontextus(k.szervezetId, k.felulet, k.nyelv);
  // 2026-09-30 (Kati B6): a magyar szerkesztett szöveg a forrás; a cél nyelv saját cellája soha (bemenet.ts).
  // c30 F3: `egyben` módban a második fél forrása mindig az ELSŐ nyelv cellája (a nyelvek sorrendje — RO-első szervezetnél a román).
  const elsoCella = kx.egyben && kx.elso && k.nyelv === kx.masodik ? cellaKeres(munka, k.felulet, kx.elso) : null;
  const forrasCella = elsoCella && elsoCella.szoveg.trim() ? elsoCella : forditasForrasa(munka.szovegek, k.felulet, k.nyelv);
  if (!forrasCella) throw new PosztHiba("NINCS_ILYEN_TALALAT", { felulet: k.felulet });

  // v3: HŰ fordítás (prompts/poszt_forditas.hu.md) — nem ír újat, a helyneveket a cél nyelv alakjában adja
  const bemenet = forditasBemenet(await profilBemenet(k.szervezetId, munka, k.nyelv), k.felulet, forrasCella, k.nyelv, kx.keret);
  const nyers = await aiKer(k, "poszt_forditas", POSZT_PROMPTOK.forditas, k.uiNyelv, k.nyelv, bemenet, POSZT_KI_TOKEN);
  const { szoveg: nyersForditott, cim: forditottCim, hashtagek: nyersHashtagek } = nyersSzovegetAlakit(nyers);
  // c30 F3 utómunka (10-17): egy plusz cím-bekezdés a fordítás elején, ami a forrásban nincs, lekerül (a fordítás hű — a forrás címtelen)
  const forditott = nevCsere(k.felulet === "blog" ? nyersForditott : forditasCimNelkul(forrasCella.szoveg, nyersForditott), await hivatalosNevek(k.szervezetId), k.nyelv); // R-18 6. kör: hivatalos nevek
  const { vegso, cim, hashtagek } = blogra(k.felulet, { szoveg: forditott, cim: forditottCim, hashtagek: nyersHashtagek });
  // R-18 6. kör (Kati C): ha a forrás a beírt felhívással zárult, a fordítás utolsó bekezdése a felhívás ezen a nyelven
  // R-18 8. kör: a felhívás SZÁNDÉK — ha a cél nyelven még nincs, a forrás nyelv szándéka kerül oda (a gép úgyis a cél nyelv hangján írja)
  const forrasCta = munka.forras.cta?.[forrasCella.nyelv] ?? "";
  if (forrasCta && !munka.forras.cta?.[k.nyelv]) munka.forras.cta = { ...(munka.forras.cta ?? {}), [k.nyelv]: forrasCta };

  const cella = cellatBiztosit(munka, k.felulet, k.nyelv);
  cella.szoveg = vegso;
  cella.javaslat = vegso;
  cella.hashtagek = hashtagek;
  if (cim !== undefined) cella.cim = cim;
  cella.allapot = "javaslat";
  cella.veglegesitve = null;
  cella.nyelvre_szabva = false;
  cella.elavult_forditas = false;

  const mentett = await posztTar.ment(k.szervezetId, munka);
  // c30 F3 (plan §5 Limits): the joined post over the platform limit → the machine is asked ONCE to shorten the first half (only if
  // it is still the machine's own text — a person's text is never rewritten) and the second half is translated again. If it is still
  // too long, nothing is cut: the counter on the page shows the overflow.
  if (rovidites && kx.egyben && kx.elso && k.nyelv === kx.masodik) {
    const elso = cellaKeres(mentett, k.felulet, kx.elso);
    if (elso && elso.allapot === "javaslat" && elso.szoveg.trim() === elso.javaslat.trim() && tulHosszu(k.felulet, elso.szoveg, vegso)) {
      await szovegetAtir({ ...k, nyelv: kx.elso }, "rovidebb");
      return forditastKeszit(k, false);
    }
  }
  return mentett;
}

export async function nyelvreSzab(k: PosztKeres): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const cella = cellaKeres(munka, k.felulet, k.nyelv);
  if (!cella) throw new PosztHiba("NINCS_ILYEN_TALALAT", { felulet: k.felulet, nyelv: k.nyelv });

  const sorok = [
    ...(await profilBemenet(k.szervezetId, munka, k.nyelv)),
    `Felület: ${k.felulet}`,
    `Felső karakterhatár: ${KARAKTERHATAR[k.felulet]}`,
    `A hírfolyamban az első ${LATHATO_HATAR[k.felulet]} karakter látszik — a lényeg legyen ott.`,
    `A szöveg nyelve: ${k.nyelv}`,
    `A szöveg:\n${cella.szoveg}`,
  ];
  const nyers = await aiKer(
    k,
    "poszt_nyelvre_szabas",
    "poszt_nyelvre_szabas",
    k.uiNyelv,
    k.nyelv,
    sorok.join("\n"),
    POSZT_KI_TOKEN,
  );
  const { szoveg: nyersUj, hashtagek } = nyersSzovegetAlakit(nyers);
  const uj = nevCsere(nyersUj, await hivatalosNevek(k.szervezetId), k.nyelv); // R-18 6. kör: hivatalos nevek
  const vegso = hashtageketFuz(uj, hashtagek);

  cella.szoveg = vegso;
  cella.javaslat = vegso;
  cella.hashtagek = hashtagek;
  cella.allapot = "szerkesztve";
  cella.veglegesitve = null;
  cella.nyelvre_szabva = true;

  return posztTar.ment(k.szervezetId, munka);
}

// ---------------------------------------------------------------------------
// Összhang — a cég iránytűje mint SZŰRŐ
// ---------------------------------------------------------------------------

function osszhangNemFutott(mondat: string): OsszhangAllapot {
  return {
    allapot: "nem_futott",
    mondat,
    pont: "",
    pont_szoveg: "",
    szovegresz: "",
    teendok: [],
    ideje: new Date().toISOString(),
  };
}

type NyersOsszhang = {
  allapot?: unknown;
  mondat?: unknown;
  pont?: unknown;
  pont_szoveg?: unknown;
  szovegresz?: unknown;
  teendok?: unknown;
};

function nyersOsszhangotAlakit(nyers: unknown): OsszhangAllapot {
  const n = (nyers ?? {}) as NyersOsszhang;
  const ideje = new Date().toISOString();
  const allapot = szoveg(n.allapot);
  if (allapot === "ellentmond") {
    return {
      allapot: "ellentmond",
      mondat: szoveg(n.mondat),
      pont: szoveg(n.pont),
      pont_szoveg: szoveg(n.pont_szoveg),
      szovegresz: szoveg(n.szovegresz),
      teendok: szovegLista(n.teendok).slice(0, 3),
      ideje,
    };
  }
  if (allapot === "ok") {
    return { allapot: "ok", mondat: szoveg(n.mondat), pont: "", pont_szoveg: "", szovegresz: "", teendok: [], ideje };
  }
  return osszhangNemFutott("ismeretlen_valasz");
}

/** P-2: a TELJES jóváhagyott iránytű megy át a vizsgálatra, nem csak az értékrend. */
function iranytuBemenet(iranytu: IranytuSema): string {
  const sorok: string[] = [];
  if (iranytu.vizio.trim()) sorok.push(`Vízió: ${iranytu.vizio.trim()}`);
  for (const c of iranytu.celok) sorok.push(`Cél: ${c.nev}${c.miert ? ` — miért: ${c.miert}` : ""}`);
  for (const e of iranytu.ertekek) sorok.push(`Érték: ${e.nev}${e.magyarazat ? ` — ${e.magyarazat}` : ""}`);
  for (const i of iranytu.idoszakok) sorok.push(`Időszak: ${i.nev}${i.mit ? ` — ${i.mit}` : ""}`);
  for (const t of iranytu.tolni) sorok.push(`Amit tolni akarunk: ${t.nev}`);
  for (const t of iranytu.kerulendo_temak) sorok.push(`Kerülendő téma: ${t}`);
  return sorok.join("\n");
}

export async function osszhangotVizsgal(k: PosztKeres): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const cella = cellaKeres(munka, k.felulet, k.nyelv);
  if (!cella) throw new PosztHiba("NINCS_ILYEN_TALALAT", { felulet: k.felulet, nyelv: k.nyelv });

  // Amíg nincs szöveg, nincs mit vizsgálni — és nincs jelzés sem (R-11/A 02).
  if (cella.szoveg.trim().length === 0) {
    munka.osszhang = null;
    return posztTar.ment(k.szervezetId, munka);
  }

  const sor = await iranytuTar.betolt(k.szervezetId);
  const jovahagyott = sor?.jovahagyott ?? null;
  if (!jovahagyott) {
    munka.osszhang = osszhangNemFutott("nincs_iranytu");
    return posztTar.ment(k.szervezetId, munka);
  }

  const tiltott = tiltottSzavakEllenorzes(cella.szoveg, jovahagyott.tiltott_szavak);
  if (tiltott) {
    munka.osszhang = {
      allapot: "ellentmond",
      mondat: "tiltott_szo",
      pont: "tiltott_szavak",
      pont_szoveg: tiltott,
      szovegresz: tiltott,
      teendok: [],
      ideje: new Date().toISOString(),
    };
    return posztTar.ment(k.szervezetId, munka);
  }

  const bemenet = [
    `A cég iránytűje:\n${iranytuBemenet(jovahagyott)}`,
    `A megvizsgálandó szöveg:\n${cella.szoveg}`,
  ].join("\n\n");

  try {
    const nyers = await aiKer(k, "poszt_osszhang", "poszt_osszhang", k.uiNyelv, k.nyelv, bemenet, 1500);
    munka.osszhang = nyersOsszhangotAlakit(nyers);
  } catch (hiba) {
    munka.osszhang =
      hiba instanceof PosztHiba && hiba.kod === "AI_KERET_KIMERULT"
        ? osszhangNemFutott("keret_kimerult")
        : osszhangNemFutott("ai_hiba");
  }
  return posztTar.ment(k.szervezetId, munka);
}

// ---------------------------------------------------------------------------
// Véglegesítés
// ---------------------------------------------------------------------------

/** P-1: a véglegesítés EGY felületre és EGY nyelvre szól. A-6: a piros jelzés ténye megmarad. */
export async function veglegesit(k: PosztKeres): Promise<PosztMunka> {
  let munka = await munkatBetolt(k.szervezetId, k.id);
  const cella = cellaKeres(munka, k.felulet, k.nyelv);
  if (!cella) throw new PosztHiba("NINCS_ILYEN_TALALAT", { felulet: k.felulet, nyelv: k.nyelv });
  if (cella.szoveg.trim().length === 0) throw new PosztHiba("ERVENYTELEN_ADAT", { szoveg: "ures" });

  // A vizsgálat a véglegesítés előtt még egyszer lefut, ha a szöveg közben változott.
  if (!munka.osszhang || cella.allapot === "szerkesztve" || cella.allapot === "javaslat") {
    munka = await osszhangotVizsgal(k);
  }

  const frissCella = cellaKeres(munka, k.felulet, k.nyelv);
  if (!frissCella) throw new PosztHiba("NINCS_ILYEN_TALALAT", { felulet: k.felulet, nyelv: k.nyelv });
  frissCella.allapot = "vegleges";
  frissCella.veglegesitve = new Date().toISOString();
  if (munka.osszhang?.allapot === "ellentmond") munka.piros_veglegesites = true;

  return posztTar.ment(k.szervezetId, munka);
}

/** „Mégis szerkesztem” — a véglegesítés visszavonása egy cellán. */
export async function veglegesitestVisszavon(k: PosztKeres): Promise<PosztMunka> {
  const munka = await munkatBetolt(k.szervezetId, k.id);
  const cella = cellaKeres(munka, k.felulet, k.nyelv);
  if (!cella) throw new PosztHiba("NINCS_ILYEN_TALALAT", { felulet: k.felulet, nyelv: k.nyelv });
  cella.allapot = "szerkesztve";
  cella.veglegesitve = null;
  return posztTar.ment(k.szervezetId, munka);
}

// ---------------------------------------------------------------------------
// R-18 3. kör · Naptár — a kész posztok napja (a szabályok a tiszta poszt/naptar.ts-ben)
// ---------------------------------------------------------------------------

/** Kész-e a poszt a naptár szerint: van véglegesített („Kész, másolom”) cellája. Ugyanaz a szabály, mint az r15/szamol `posztKesz`-é —
 *  itt külön, mert az r15 a poszt modulra épül, nem fordítva (kör nélkül). */
function naptarKesz(m: PosztMunka): boolean {
  return m.szovegek.some((c) => c.allapot === "vegleges");
}

function naptarRovidNev(m: PosztMunka): string {
  if (m.forras.rovid_nev) return m.forras.rovid_nev;
  return (m.forras.rovid_cim || m.forras.cim || m.cim).replace(/\s+/g, " ").trim();
}

/**
 * A naptár adata: a kész (vagy már napot kapott) posztok, és ha egy kész posztnak még nincs napja, a gép most javasol neki egyet (ezt el is
 * menti, hogy a javaslat ne ugráljon). A `kep_fajl_id` a lapnak kell a bélyegképhez (a kép címét az r15/kep adja).
 */
export async function naptarBetolt(szervezetId: string, most = new Date()): Promise<{ ma: Nap; posztok: (NaptarPoszt & { kep_fajl_id: string })[] }> {
  const ma = napKulcs(most);
  const sorok = await posztTar.naptarSorok(szervezetId);
  const posztok = sorok
    // R-18 8. kör: a „Levétel a naptárból” után a poszt kimarad (és nem kap új javaslatot), amíg Tibor újra napot nem ad neki
    .filter((s) => !s.munka.forras.naptar_le && (naptarKesz(s.munka) || s.tervezett_nap || s.kiteve))
    .map((s) => ({
      id: s.munka.id,
      rovid_nev: naptarRovidNev(s.munka),
      kep_url: null,
      kep_fajl_id: s.munka.forras.kep_fajl_id ?? "",
      tervezett_nap: s.tervezett_nap,
      javasolt_nap: s.javasolt_nap,
      kiteve: s.kiteve,
    }));
  for (const p of javaslatokatAd(posztok, ma)) await posztTar.naptarMent(szervezetId, p.id, { javasolt_nap: p.javasolt_nap });
  return { ma, posztok };
}

/**
 * Egy naptár-művelet (a lap „Elfogadom” · „Másik nap” / húzás · „Kitettem” · a „…” menü gombjai):
 *   {muvelet: "elfogad"}          → a javasolt nap lesz a tervezett
 *   {muvelet: "nap", nap: "ÉÉÉÉ-HH-NN"} → a választott nap lesz a tervezett; a kitétel jele törlődik (újra tervezett).
 *        R-18 8. kör: a húzás és a „+” a látott hét bármely napjára tehet — ma − 31 … ma + 90 (a napválasztó továbbra is ma + 13-ig kínál).
 *   {muvelet: "kitettem"}         → kitéve most
 *   {muvelet: "levesz"}           → R-18 8. kör: le a naptárról (a poszt marad; a korábbi napok a forras.naptar_le-ben)
 *   {muvelet: "torol"}            → R-18 8. kör: puha törlés (forras.torolve) — a sor és a kép megmarad, csak a listák rejtik
 *   {muvelet: "visszavon"}        → a fenti kettő visszavonása (10 mp-es „Visszavonás”; utána is működik)
 */
export const NAPTAR_MULT = 31;
export const NAPTAR_JOVO = 90;
export async function naptarMuvelet(szervezetId: string, id: string, be: unknown, most = new Date()): Promise<void> {
  const b = (be ?? {}) as { muvelet?: unknown; nap?: unknown };
  const ma = napKulcs(most);
  const sor = (await posztTar.naptarSorok(szervezetId, 400, b.muvelet === "visszavon")).find((s) => s.munka.id === id);
  if (!sor) throw new PosztHiba("NINCS_ILYEN_TALALAT", { id });
  let ok: boolean;
  switch (b.muvelet) {
    case "elfogad": {
      const nap = sor.javasolt_nap ?? sor.tervezett_nap;
      if (!nap) throw new PosztHiba("ERVENYTELEN_ADAT", { muvelet: "nincs_javaslat" });
      ok = await posztTar.naptarMent(szervezetId, id, { tervezett_nap: nap });
      break;
    }
    case "nap": {
      if (!ervenyesNap(b.nap)) throw new PosztHiba("ERVENYTELEN_ADAT", { nap: "hibas" });
      const kulonbseg = napokKozott(ma, b.nap);
      if (kulonbseg < -NAPTAR_MULT || kulonbseg > NAPTAR_JOVO) throw new PosztHiba("ERVENYTELEN_ADAT", { nap: "tartomanyon_kivul" });
      if (sor.munka.forras.naptar_le) {
        const { naptar_le: _le, ...forras } = sor.munka.forras;
        void _le;
        await posztTar.ment(szervezetId, { ...sor.munka, forras });
      }
      ok = await posztTar.naptarMent(szervezetId, id, { tervezett_nap: b.nap, kiteve: null });
      break;
    }
    case "kitettem":
      ok = await posztTar.naptarMent(szervezetId, id, { kiteve: most });
      break;
    case "levesz": {
      const naptar_le = { tervezett_nap: sor.tervezett_nap, javasolt_nap: sor.javasolt_nap, kiteve: sor.kiteve, ido: most.toISOString() };
      await posztTar.ment(szervezetId, { ...sor.munka, forras: { ...sor.munka.forras, naptar_le } });
      ok = await posztTar.naptarMent(szervezetId, id, { tervezett_nap: null, javasolt_nap: null, kiteve: null });
      break;
    }
    case "torol":
      await posztTar.ment(szervezetId, { ...sor.munka, forras: { ...sor.munka.forras, torolve: most.toISOString() } });
      ok = true;
      break;
    case "visszavon": {
      const { torolve, naptar_le, ...forras } = sor.munka.forras;
      if (torolve) {
        // a törlés visszavonása: csak a jel megy le (a naptár-oszlopokhoz a törlés nem nyúlt)
        await posztTar.ment(szervezetId, { ...sor.munka, forras: naptar_le ? { ...forras, naptar_le } : forras });
        ok = true;
      } else if (naptar_le) {
        await posztTar.ment(szervezetId, { ...sor.munka, forras });
        ok = await posztTar.naptarMent(szervezetId, id, {
          tervezett_nap: naptar_le.tervezett_nap,
          javasolt_nap: naptar_le.javasolt_nap,
          kiteve: naptar_le.kiteve ? new Date(naptar_le.kiteve) : null,
        });
      } else ok = true;
      break;
    }
    default:
      throw new PosztHiba("ERVENYTELEN_ADAT", { muvelet: "ismeretlen" });
  }
  if (!ok) throw new PosztHiba("NINCS_ILYEN_TALALAT", { id });
}
