import "server-only";
import { AiHiba, type FeladatTipus } from "@km/ai-adapters";
import { fajlOlvas } from "@km/fajl-core";
import { nyersBajtok, nyersSzoveg, weboldalSzoveg } from "@km/letolto";
import type { KinalatSor, SzervezetProfil, TemaTerv } from "@km/contracts";
import { jsonRobusztusan, keretEllenoriz, meresRogzit, prompt, szolgaltato } from "../ai";
import { fajlKornyezet } from "../fajl";
import { profilSorok } from "../poszt/profil-blokk";
import { profilBetolt, kinalatMent } from "../profil";
import { cegKutatas } from "./kutatas";
import { mellekletOlvas, type Melleklet } from "./kepolvaso";
import { domainNev, kinalatAloldalak, kinalatTisztit, kozossegiLink, szakmaSor, temaTartalek, temakTisztit } from "../profil/kinalat-szabaly";
import { kategoriaOf, tipusOf } from "../profil/tipus-szabaly";
import { programTar } from "../program/tar";
import { programOsszegzes } from "../program/blokk";

// R-18 7. kör (Csilla 10-12, IRANYOK-round7.md „Setup”): az első beállítás új lépéseinek gépezete. A jóváhagyott profilra épül (a kínálat,
// az árak, az oldal, a szokások és a tématerv a profil jsonb-jébe kerül — új tábla és új RLS nélkül). Minden lépés hibatűrő: ha a gép
// nem válaszol vagy a honlap nem olvasható, üres listával megy tovább (a felhasználó kézzel kitölti) — a beállítás soha nem áll meg.

type Hivo = { szervezetId: string; fiokId: string };

/** Egy szöveges AI-hívás JSON-válasszal (keret → hívás → mérés); hibánál null. */
async function aiJson(h: Hivo, feladat: FeladatTipus, promptFajl: string, nyelv: string, bemenet: string): Promise<Record<string, unknown> | null> {
  try {
    await keretEllenoriz(h.szervezetId, h.fiokId);
  } catch {
    return null;
  }
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const v = await sz.hiv({ feladat, rendszer: await prompt(promptFajl, "hu", nyelv), szoveg: bemenet, nyelv, maxKiToken: 1500, idokorlatMs: 40_000 });
    await meresRogzit(h.szervezetId, v.meres, h.fiokId);
    return JSON.parse(jsonRobusztusan(v.szoveg)) as Record<string, unknown>;
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    await meresRogzit(h.szervezetId, { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat, tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod }).catch(() => undefined);
    console.error(`[${feladat}] sikertelen:`, kod, hiba instanceof Error ? hiba.message : hiba);
    return null;
  }
}

function nyelvE(p: SzervezetProfil): string {
  return p.nyelvek?.[0] ?? "hu";
}

export type OlvasEredmeny = { honlap: string; domain: string; sorok: KinalatSor[]; kozossegi: string; vendeglato: boolean; talalt: boolean };

/**
 * 1. lépés („Ezt kínáljátok?”): a honlap (a piszkozatból vagy a háttérben olvasott arculatból; ha nincs, a netes kutatás keresi meg),
 * a kezdőlap és legfeljebb három kínálat-aloldal szövege → a gép kiszedi a szolgáltatásokat / termékeket. A honlap Facebook- vagy
 * Instagram-linkje a 4. lépés mezőjébe kerül („a honlapodon találtuk”). Profil nélkül null.
 */
export async function kinalatotOlvas(h: Hivo): Promise<OlvasEredmeny | null> {
  const p = await profilBetolt(h.szervezetId);
  if (!p) return null;
  const nyelv = nyelvE(p);
  const kat = kategoriaOf(p); // c30 F1: the stored category, else the hospitality regex (same answer as before for every existing org)
  const vendeglatoE = kat === "vendeglatas";
  let honlap = p.honlap || p.arculat.tervezet?.forras_cim || "";
  let kozossegi = "";
  if (!honlap) {
    const k = await cegKutatas(h.szervezetId, { nev: p.nev, leiras: p.osszefoglalo, nyelv }, h.fiokId);
    if (k?.talalt && k.honlap && k.bizonyossag !== "alacsony") honlap = k.honlap;
    kozossegi = (k?.kozossegi ?? []).find((u) => /facebook\.com|instagram\.com/.test(u))?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "") ?? "";
    if (honlap) await kinalatMent(h.szervezetId, { honlap });
  }
  if (!honlap) return { honlap: "", domain: "", sorok: [], kozossegi, vendeglato: vendeglatoE, talalt: false };
  const darabok: string[] = [];
  try {
    const nyers = await nyersSzoveg(honlap, "html");
    kozossegi = kozossegiLink(nyers.szoveg, nyers.vegsoCim) || kozossegi;
    const fo = await weboldalSzoveg(honlap);
    darabok.push(`Kezdőlap (${fo.vegsoCim}):\n${fo.szoveg.slice(0, 6000)}`);
    for (const al of kinalatAloldalak(nyers.szoveg, nyers.vegsoCim)) {
      try {
        const w = await weboldalSzoveg(al);
        darabok.push(`Aloldal (${w.vegsoCim}):\n${w.szoveg.slice(0, 5000)}`);
      } catch {
        /* egy aloldal kiesése nem baj */
      }
    }
  } catch (hiba) {
    console.error("[kinalat] a honlap nem olvasható:", honlap, hiba instanceof Error ? hiba.message : hiba);
  }
  let sorok: KinalatSor[] = [];
  if (darabok.length) {
    const j = await aiJson(h, "kinalat_kiolvasas", "kinalat_kiolvasas", nyelv, [`A cég: ${p.nev}`, ...darabok].join("\n\n").slice(0, 18000));
    sorok = kinalatTisztit(j?.["sorok"]);
  }
  return { honlap, domain: domainNev(honlap), sorok, kozossegi, vendeglato: vendeglatoE, talalt: darabok.length > 0 };
}

const LISTA_TIPUS = /^\s*(application\/pdf|image\/(png|jpeg|webp))\s*(;|$)/i;

/**
 * 2. lépés („Van étlapod?” / „Van szolgáltatás-listád vagy árlistád?”): a lista egy linkről (weboldal vagy egy PDF / kép a neten),
 * vagy feltöltött fájlokból (PDF, fotók — több oldal is) → a gép kiolvassa a sorokat (név + ár). A feltöltött fájlok a fájltárban
 * maradnak (dokumentum cél), az azonosítójuk a profilba kerül.
 */
export async function listatOlvas(h: Hivo, be: { link?: string; fajlok?: string[] }): Promise<KinalatSor[] | null> {
  const p = await profilBetolt(h.szervezetId);
  if (!p) return null;
  const nyelv = nyelvE(p);
  const mellekletek: Melleklet[] = [];
  if (be.fajlok?.length) {
    const ktx = { fiok_id: h.fiokId, szervezet_id: h.szervezetId, szerep: "szerkeszto" as const };
    for (const id of be.fajlok.slice(0, 6)) {
      const f = await fajlOlvas(fajlKornyezet(), ktx, id);
      if (!f.ok) continue;
      const mime = f.ertek.meta.tipus === "pdf" ? "application/pdf" : f.ertek.meta.tipus === "png" ? "image/png" : f.ertek.meta.tipus === "webp" ? "image/webp" : "image/jpeg";
      mellekletek.push({ mime, bajtok: f.ertek.bajtok, nev: f.ertek.meta.nev });
    }
    await kinalatMent(h.szervezetId, { kinalat_fajlok: [...new Set([...(p.kinalat_fajlok ?? []), ...be.fajlok])].slice(-10) });
  } else if (be.link?.trim()) {
    try {
      const b = await nyersBajtok(be.link.trim(), { engedettTipus: LISTA_TIPUS, maxBajt: 15_000_000, idokorlatMs: 15_000 });
      mellekletek.push({ mime: b.tipus.split(";")[0]!.trim().toLowerCase(), bajtok: b.bajtok });
    } catch {
      try {
        const w = await weboldalSzoveg(be.link.trim());
        const j = await aiJson(h, "kinalat_kiolvasas", "kinalat_kiolvasas", nyelv, `A cég: ${p.nev}\n\n${w.szoveg.slice(0, 15000)}`);
        return kinalatTisztit(j?.["sorok"]);
      } catch (hiba) {
        console.error("[kinalat lista] a link nem olvasható:", hiba instanceof Error ? hiba.message : hiba);
        return [];
      }
    }
  }
  if (mellekletek.length === 0) return [];
  const szoveg = await mellekletOlvas(h.szervezetId, { feladat: "kinalat_kiolvasas", promptFajl: "kinalat_kiolvasas", nyelv, mellekletek, kiegeszites: `A cég: ${p.nev}` }, h.fiokId);
  if (!szoveg) return [];
  try {
    return kinalatTisztit((JSON.parse(jsonRobusztusan(szoveg)) as Record<string, unknown>)["sorok"]);
  } catch {
    return [];
  }
}

/**
 * 4. lépés („Hol posztolsz most?”): az oldal címe és a képernyőképek → a gép leírja a cég posztolási szokásait (hangnem, hossz, emoji,
 * hashtag). A nyilvános oldalt megpróbáljuk elolvasni (ahol a szolgáltató engedi); a képernyőkép nélküli, olvashatatlan oldal nem hiba.
 */
export async function szokasokatOlvas(h: Hivo, be: { kozossegi_oldal: string; kepernyokepek: string[] }): Promise<string> {
  const p = await profilBetolt(h.szervezetId);
  if (!p) return "";
  const mellekletek: Melleklet[] = [];
  const ktx = { fiok_id: h.fiokId, szervezet_id: h.szervezetId, szerep: "szerkeszto" as const };
  for (const id of be.kepernyokepek.slice(0, 5)) {
    const f = await fajlOlvas(fajlKornyezet(), ktx, id);
    if (f.ok && f.ertek.meta.tipus !== "pdf") mellekletek.push({ mime: f.ertek.meta.tipus === "png" ? "image/png" : f.ertek.meta.tipus === "webp" ? "image/webp" : "image/jpeg", bajtok: f.ertek.bajtok });
  }
  let nyilvanos = "";
  if (be.kozossegi_oldal.trim()) {
    try {
      const cim = /^https?:\/\//i.test(be.kozossegi_oldal) ? be.kozossegi_oldal : `https://${be.kozossegi_oldal}`;
      const w = await weboldalSzoveg(cim, { idokorlatMs: 8000 });
      if (w.szoveg.length > 300) nyilvanos = w.szoveg.slice(0, 4000);
    } catch {
      /* a közösségi oldal gyakran nem olvasható belépés nélkül — nem hiba */
    }
  }
  if (mellekletek.length === 0) return "";
  const szoveg = await mellekletOlvas(h.szervezetId, { feladat: "poszt_szokasok", promptFajl: "poszt_szokasok", nyelv: nyelvE(p), mellekletek, kiegeszites: nyilvanos ? `Az oldal nyilvános szövege:\n${nyilvanos}` : "" }, h.fiokId);
  return (szoveg ?? "").replace(/\s+/g, " ").trim().slice(0, 800);
}

/** 5. lépés („Ezekről érdemes posztolnod”): 4–8 téma a profilból, a kínálatból és a szokásokból; a gép nélkül a tartalék-párosítás. */
export async function temakatJavasol(h: Hivo): Promise<TemaTerv[] | null> {
  const p = await profilBetolt(h.szervezetId);
  if (!p) return null;
  const nyelv = nyelvE(p);
  const kat = kategoriaOf(p);
  const tipus = tipusOf(p);
  // c30 F7 (terv §3 temak_terv): cégnél a szakma sora (minden szakmánál, nem csak a vendéglátásnál); fesztiválnál a típus, a dátumok és a
  // program tömör összegzése (fajtánként hány tétel, a kiemelt fellépők) — a prompt ebből a fesztivál-témákat kéri, fajtával
  const r = p.rendezveny ?? p.rendezveny_javaslat;
  const kulon = tipus === "fesztival"
    ? ["Típus: fesztivál / rendezvény.", r?.mettol || r?.meddig ? `A rendezvény: ${[r.mettol, r.meddig].filter(Boolean).join(" – ")}${r.hely?.[nyelv as keyof NonNullable<typeof r.hely>] || r.hely?.hu ? `, ${r.hely?.[nyelv as keyof NonNullable<typeof r.hely>] || r.hely?.hu}` : ""}.` : "",
      ...programOsszegzes(await programTar.lista(h.szervezetId).catch(() => []), nyelv)]
    : [szakmaSor(kat)];
  const j = await aiJson(h, "temak_terv", "temak_terv", nyelv, [...profilSorok({ ...p, tema_terv: [] }), ...kulon].filter(Boolean).join("\n"));
  const temak = temakTisztit(j?.["temak"]).slice(0, 8);
  return temak.length >= 3 ? temak : temaTartalek(p.kinalat ?? [], kat, nyelv, tipus);
}
