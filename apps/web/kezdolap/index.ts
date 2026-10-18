import "server-only";
import { eq } from "drizzle-orm";
import { aktivVerzio, attekintes, nezoSzerint } from "@rogton/news-monitor-core";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { honapVagyMost, sajatNezet } from "../koltseg";
import { gazdaNezet } from "../koltseg";
import { nezet as fiokokNezet } from "../fiokok";
import { kornyezet, hostKontextus } from "../hirfigyelo";
import { hozzaferesKornyezet, szerepFordit } from "../hozzaferes";
import { meghivoLista, tagokLista } from "@rogton/hozzaferes-core";
import { profilBetolt } from "../profil";
import { olvasatlanSzam } from "../ertesites";
import { szervezetCsomag } from "../csomag";
import { ALAP_CSOMAG_KOD, MODULOK } from "@rogton/contracts";
import { esemenyKornyezet, ertesitesLekerdez } from "../esemeny";
import { fiokNeve } from "../szervezet/reszletek";
import { kozosAllapot as temaKozosAllapot, szervezetTemaAllapot } from "../tema";
import { kozosAllapot as feliratKozosAllapot, szervezetAllapot as feliratSzervezetAllapot } from "../szovegek";
import { PENZNEMEK, type ArculatAllapot, type FelsoSavAdat, type ForrasokCsempe, type GephazNezet, type HianyzoResz, type HirfigyeloCsempe, type KezdolapNezet, type KoltsegCsempe, type Osszeg, type Penznem, type ProfilCsempe, type Szerep } from "./tipusok";
import type { FiokNezet, SzervezetProfil } from "@rogton/contracts";
import type { FeliratFelulirasok } from "@rogton/design-system";

export * from "./tipusok";

// F-2 (R-1 v3): a kezdőképernyő és a Gépház adatforrása. MINDEN csempe a MEGLÉVŐ gépezetből jön — nincs új mérés,
// nincs új tábla a három tárolási tételen kívül (szervezet.penznem, fiok.aktualis_szervezet_id, arfolyam).
// Egy csempe hibája nem dönti a lapot: a csempe üres értéket kap, a hibát a kiszolgáló naplózza.

const ALAP_ARFOLYAM: Record<Penznem, number> = { EUR: 0.92, USD: 1, HUF: 360, RON: 4.6 };

/** A tárolt árfolyamok. Ha egy sor hiányzik, a szerződés kezdőértéke érvényes rá. */
export async function arfolyamok(): Promise<Record<Penznem, number>> {
  const sorok = await db().select().from(sema.arfolyam);
  const ki: Record<Penznem, number> = { ...ALAP_ARFOLYAM };
  for (const s of sorok) {
    if ((PENZNEMEK as readonly string[]).includes(s.penznem)) {
      ki[s.penznem as Penznem] = Number(s.egyUsd);
    }
  }
  return ki;
}

/** USD → a munkatér pénzneme, a tárolt árfolyammal, 2 tizedesre kerekítve. */
export function atszamit(usd: number, penznem: Penznem, arf: Record<Penznem, number>): Osszeg {
  const ertek = Math.round(usd * arf[penznem] * 100) / 100;
  return { usd, penznem, ertek };
}

/** A munkatér pénznemének beállítása (tulajdonos). */
export async function penznemAllit(szervezetId: string, penznem: Penznem): Promise<void> {
  await szervezetKent(szervezetId, async (tx) => {
    await tx.update(sema.szervezet).set({ penznem }).where(eq(sema.szervezet.id, szervezetId));
  });
}

/** Egy árfolyam állítása (rendszergazda); visszaadja a teljes árfolyam-készletet. */
export async function arfolyamAllit(penznem: Penznem, egyUsd: number): Promise<Record<Penznem, number>> {
  // UPDATE, nem INSERT … ON CONFLICT: a km_app szerepnek a 0050 szerint SELECT és UPDATE joga van a táblán, és a négy sor a
  // migrációból mindig megvan (a mátrix rendszergazda-sora 500-at mért az INSERT-tel — MERES 7.).
  await db().update(sema.arfolyam).set({ egyUsd: String(egyUsd), frissitve: new Date() }).where(eq(sema.arfolyam.penznem, penznem));
  return arfolyamok();
}

/** A munkatér pénzneme — `szervezetKent` alatt (a sorszintű védelem kapuján át). */
async function munkaterPenznem(szervezetId: string): Promise<Penznem> {
  const sor = await szervezetKent(szervezetId, async (tx) =>
    (await tx.select({ penznem: sema.szervezet.penznem }).from(sema.szervezet).where(eq(sema.szervezet.id, szervezetId)).limit(1))[0],
  );
  const p = sor?.penznem;
  return p && (PENZNEMEK as readonly string[]).includes(p) ? (p as Penznem) : "EUR";
}

function nullaOsszeg(penznem: Penznem): Osszeg {
  return { usd: 0, penznem, ertek: 0 };
}

function uresForrasok(): ForrasokCsempe {
  return { osszes: 0, hasznalhato: 0, korlatozott: 0, hibas: 0, nem_tamogatott: 0, ellenorzes_alatt: 0 };
}

function uresKoltseg(penznem: Penznem, honap: string): KoltsegCsempe {
  return { honap, hivasok: 0, ido_ms: 0, becsult: nullaOsszeg(penznem), keret: nullaOsszeg(penznem), maradt: nullaOsszeg(penznem) };
}

/** A hírfigyelő csempe a létező magból. `null`, ha nincs beállítás (NINCS_BEALLITAS). */
async function hirfigyeloCsempe(fiok: FiokNezet, szervezetId: string): Promise<HirfigyeloCsempe | null> {
  const k = await kornyezet(szervezetId, fiok.nyelv ?? "hu", fiok.id); // R-13: a néző szűrő-beállításával
  const ktx = hostKontextus(fiok, szervezetId);
  if (!ktx) return null;
  // Nincs aktív figyelési beállítás → nincs csempe-adat (a 2. artboard „még nem futott" sora); a mag áttekintése üres szervezetre is ok-t ad, ezért ELŐBB ezt nézzük.
  const verziok = await k.tar.verziok(szervezetId);
  const aktiv = aktivVerzio(verziok);
  if (!aktiv) return null;
  const a = await attekintes(k, ktx);
  if (!a.ok && a.hiba === "NINCS_BEALLITAS") return null;
  if (!a.ok) throw new Error(a.hiba);

  const futasok = await k.tar.futasok(szervezetId);
  const idozona = aktiv.beallitas.idozites.idozona ?? "Europe/Bucharest";

  const utolso = a.utolsoSikeres;
  const legutobbi = futasok.length > 0
    ? futasok.reduce((m, f) => (new Date(f.kezdet).getTime() > new Date(m.kezdet).getTime() ? f : m))
    : null;
  // F-8.1 g (T-19 audit 5.): a „{n} forrás elakadt" és a Források csempe EGY időablakból számoljon — a források MAI állapotából,
  // nem a legutóbbi futás hibalistájából (a kettő eltért: „0 forrás elakadt" mellett „1 hibás" a csempén — mérve 2026-09-13).
  const forrasokMa = await k.tar.forrasok(szervezetId);
  const hibasForrasok = new Set(forrasokMa.filter((f) => f.allapot === "hibas").map((f) => f.id));

  const talalatok = a.talalatok ?? [];
  const fuggoben = talalatok.filter((t) => t.ertekeles_allapot === "fuggoben" || t.ertekeles_allapot === "keret_kimerult").length;
  const keretKimerult = talalatok.some((t) => t.ertekeles_allapot === "keret_kimerult");

  const legutobbiVege = legutobbi ? (legutobbi.veg ?? (legutobbi.allapot === "indul" || legutobbi.allapot === "fut" ? null : legutobbi.kezdet)) : null;
  return {
    utolso_sikeres: utolso?.veg ?? null,
    utolso_futas: legutobbiVege,
    kovetkezo: a.kovetkezo ? a.kovetkezo.toISOString() : null,
    idozona,
    fut: a.aktivFutas !== null,
    uj: a.ujDb ?? 0,
    forrashiba: hibasForrasok.size,
    // R-7b 02: a 3 legfontosabb friss cím — a kártyák (egy esemény = egy kártya) fontos → érdekes → háttér sorrendben, az elrejtettek nélkül
    elso_cimek: [...(a.kartyak ?? [])]
      .filter((k) => k.jeloles !== "elrejtett" && !(k.ertekeles_allapot === "kesz" && k.fontossag === "hatter")) // 2026-09-22: a kiszűrt nem látszik
      .sort((x, y) => sorrend(x.fontossag) - sorrend(y.fontossag))
      .slice(0, 3)
      .map((k) => ({ talalat_id: k.fo_talalat_id, cim: k.cim_forditott || k.cim, cim_eredeti: k.cim_forditott && k.cim_forditott !== k.cim ? k.cim : null, kategoria: k.fontossag ?? "hatter" })),
    fuggoben,
    keret_kimerult: keretKimerult,
  };
}

/** A források csempe a hírfigyelő tárból, állapot szerint számolva. */
async function forrasokCsempe(fiok: FiokNezet, szervezetId: string): Promise<ForrasokCsempe> {
  const k = await kornyezet(szervezetId, fiok.nyelv ?? "hu");
  const forrasok = await k.tar.forrasok(szervezetId);
  const ki = uresForrasok();
  ki.osszes = forrasok.length;
  for (const f of forrasok) {
    if (f.allapot === "hasznalhato") ki.hasznalhato++;
    else if (f.allapot === "korlatozott") ki.korlatozott++;
    else if (f.allapot === "hibas") ki.hibas++;
    else if (f.allapot === "nem_tamogatott") ki.nem_tamogatott++;
    else if (f.allapot === "ellenorzes_alatt") ki.ellenorzes_alatt++;
  }
  return ki;
}

/** A profil csempe a jóváhagyott profilból. A hiányzó részek a profil `kesobbre` listája (a profile-core számolja). */
async function profilCsempe(_szervezetId: string, profil: SzervezetProfil): Promise<ProfilCsempe> {
  // a név a fiókból (D-F30/4): az eltávolított tag neve is megmarad a jóváhagyás mellett
  const jovahagytaNev = await fiokNeve(profil.jovahagyta);
  return { jovahagyva: profil.jovahagyva, jovahagyta_nev: jovahagytaNev, hianyzo: [...profil.kesobbre] };
}

/** A költség csempe a szervezet saját nézetéből, a munkatér pénznemében. */
async function koltsegCsempe(szervezetId: string, penznem: Penznem, arf: Record<Penznem, number>): Promise<KoltsegCsempe> {
  const honap = honapVagyMost(null);
  const n = await sajatNezet(szervezetId, honap);
  const becsult = atszamit(n.usd, penznem, arf);
  const keret = atszamit(n.keret_usd, penznem, arf);
  const maradtUsd = Math.max(0, n.keret_usd - n.usd);
  return {
    honap,
    hivasok: n.hivasok,
    ido_ms: n.ido_ms,
    becsult,
    keret,
    maradt: atszamit(maradtUsd, penznem, arf),
  };
}

/** A kezdőképernyő EGY lekérdezése. Minden csempe külön try/catch-ben: a hibás csempe üres értéket kap. */
export async function kezdolapNezet(
  fiok: FiokNezet,
  szervezet: { id: string; nev: string },
  szerep: Szerep,
): Promise<KezdolapNezet> {
  const penznem = await munkaterPenznem(szervezet.id).catch((h) => {
    console.error("[kezdolap] penznem:", h);
    return "EUR" as Penznem;
  });
  const arf = await arfolyamok().catch((h) => {
    console.error("[kezdolap] arfolyam:", h);
    return { ...ALAP_ARFOLYAM };
  });

  // Egy profil-olvasás a három profil-eredetű mezőhöz (első használat, profil csempe, arculat).
  let profilSor: SzervezetProfil | null = null;
  try {
    profilSor = await profilBetolt(szervezet.id);
  } catch (h) {
    console.error("[kezdolap] profil:", h);
  }
  const elsoHasznalat = profilSor === null;
  const arculat: ArculatAllapot = profilSor ? profilSor.arculat.allapot : "nincs";

  let hirfigyelo: HirfigyeloCsempe | null = null;
  try {
    hirfigyelo = await hirfigyeloCsempe(fiok, szervezet.id);
  } catch (h) {
    console.error("[kezdolap] hirfigyelo:", h);
    hirfigyelo = null;
  }

  let profil: ProfilCsempe | null = null;
  if (profilSor) {
    try {
      profil = await profilCsempe(szervezet.id, profilSor);
    } catch (h) {
      console.error("[kezdolap] profil csempe:", h);
      profil = { jovahagyva: profilSor.jovahagyva, jovahagyta_nev: "", hianyzo: [...profilSor.kesobbre] };
    }
  }

  let forrasok: ForrasokCsempe = uresForrasok();
  try {
    forrasok = await forrasokCsempe(fiok, szervezet.id);
  } catch (h) {
    console.error("[kezdolap] forrasok:", h);
    forrasok = uresForrasok();
  }

  let koltseg: KoltsegCsempe = uresKoltseg(penznem, honapVagyMost(null));
  try {
    koltseg = await koltsegCsempe(szervezet.id, penznem, arf);
  } catch (h) {
    console.error("[kezdolap] koltseg:", h);
    koltseg = uresKoltseg(penznem, honapVagyMost(null));
  }

  let tervezet = { tema: false, feliratok: false };
  try {
    const t = await szervezetTemaAllapot(szervezet.id);
    const f = await feliratSzervezetAllapot(szervezet.id);
    tervezet = { tema: t.tervezet !== null, feliratok: f.tervezet !== null };
  } catch (h) {
    console.error("[kezdolap] tervezet:", h);
    tervezet = { tema: false, feliratok: false };
  }

  // R-8: a Csomagod sor
  let csomag: KezdolapNezet["csomag"] = { kod: ALAP_CSOMAG_KOD, forras_max: null };
  try {
    const cs = await szervezetCsomag(szervezet.id);
    csomag = { kod: cs.kod, forras_max: cs.forras_max };
  } catch (h) {
    console.error("[kezdolap] csomag:", h);
  }
  return {
    munkater: { id: szervezet.id, nev: szervezet.nev, penznem },
    szerep,
    elso_hasznalat: elsoHasznalat,
    hirfigyelo,
    profil,
    arculat,
    forrasok,
    koltseg,
    tervezet,
    csomag,
  };
}

/** A Gépház nézete. `null`, ha a fiók nem tulajdonos és nem rendszergazda (a végpont ebből 403-at ad). */
export async function gephazNezet(
  fiok: FiokNezet,
  szervezet: { id: string; nev: string },
  szerep: Szerep,
): Promise<GephazNezet | null> {
  const rendszergazda = fiok.rendszergazda;
  const tulajdonos = szerep === "tulajdonos";
  if (!rendszergazda && !tulajdonos) return null;

  const honap = honapVagyMost(null);
  const penznem = await munkaterPenznem(szervezet.id).catch((h) => {
    console.error("[gephaz] penznem:", h);
    return "EUR" as Penznem;
  });
  const arf = await arfolyamok().catch((h) => {
    console.error("[gephaz] arfolyam:", h);
    return { ...ALAP_ARFOLYAM };
  });

  // F-7b (R-5, 01–02. artboard): a Csomag és a Kimenő értesítések csempéje — mindkét nézeten. Hiba esetén alapérték, a Gépház nem dőlhet el.
  const cs = await szervezetCsomag(szervezet.id).catch((h) => { console.error("[gephaz] csomag:", h); return null; });
  const csomag: GephazNezet["csomag"] = { kod: cs?.kod ?? ALAP_CSOMAG_KOD, modulok: MODULOK.map((m) => ({ modul: m, benne: cs ? cs.modulok.includes(m) : true })) };
  let kimeno: GephazNezet["kimeno"] = { bekotve: Boolean(process.env["ERTESITES_WEBHOOK_URL"]?.trim()), kimeno_szam: 0 };
  try {
    const e = await ertesitesLekerdez(await esemenyKornyezet(), { fiok_id: fiok.id, szervezet_id: szervezet.id, szerep });
    if (e.ok) {
      // rendszergazdánál a közös alap, tulajdonosnál a hatásos „kimenő" fajtái (a rajz adatkotes.md-je)
      const forras: Record<string, string> = rendszergazda ? e.ertek.kozos : e.ertek.hatasos;
      kimeno = { ...kimeno, kimeno_szam: Object.values(forras).filter((v) => v === "kimeno").length };
    }
  } catch (h) {
    console.error("[gephaz] kimeno:", h);
  }

  if (rendszergazda) {
    // Rendszergazda nézet (4. artboard): a KÖZÖS alap a téma és a feliratok szintjén, plusz a költség és a fiókok.
    let tema = { tervezet: false, tokenek: 0, felulirt: 0, alkalmazva: null as string | null };
    try {
      const k = await temaKozosAllapot();
      tema = {
        tervezet: k.tervezet !== null,
        tokenek: k.alkalmazott ? Object.keys(k.alkalmazott.tokenek).length : 0,
        felulirt: 0,
        alkalmazva: alkalmazvaIdo(k.verziok, k.alkalmazott?.verzio ?? null),
      };
    } catch (h) {
      console.error("[gephaz] tema:", h);
    }

    let feliratok = { tervezet: false, felulirt: 0 };
    try {
      const f = await feliratKozosAllapot();
      feliratok = { tervezet: f.tervezet !== null, felulirt: feliratFelulirtSzam(f.alkalmazott?.felulirasok ?? null) };
    } catch (h) {
      console.error("[gephaz] feliratok:", h);
    }

    let koltseg: GephazNezet["koltseg"] = null;
    try {
      const g = await gazdaNezet(honap);
      koltseg = {
        honap,
        munkaterek: g.osszes.szervezetek,
        osszeg: atszamit(g.osszes.usd, penznem, arf),
      };
    } catch (h) {
      console.error("[gephaz] koltseg:", h);
      koltseg = null;
    }

    let fiokok: GephazNezet["fiokok"] = null;
    try {
      const n = await fiokokNezet(fiok.id, honap);
      const legutobbi = n.fiokok
        .filter((f) => f.utolso_belepes !== null)
        .sort((a, b) => new Date(b.utolso_belepes ?? 0).getTime() - new Date(a.utolso_belepes ?? 0).getTime())[0];
      fiokok = {
        fiokok: n.fiokok.length,
        munkaterek: n.munkaterek.length,
        felfuggesztett: n.fiokok.filter((f) => f.felfuggesztve !== null).length,
        utolso_belepes: legutobbi ? { nev: legutobbi.nev, idopont: legutobbi.utolso_belepes ?? "" } : null,
      };
    } catch (h) {
      console.error("[gephaz] fiokok:", h);
      fiokok = null;
    }

    return {
      nezet: "rendszergazda",
      munkater: { id: szervezet.id, nev: szervezet.nev, penznem },
      tema,
      feliratok,
      koltseg,
      fiokok,
      csomag,
      kimeno,
    };
  }

  // Tulajdonos nézet (8. artboard): a MUNKATÉR szintjén a téma és a feliratok; költség és fiókok nincs.
  let tema = { tervezet: false, tokenek: 0, felulirt: 0, alkalmazva: null as string | null };
  try {
    const t = await szervezetTemaAllapot(szervezet.id);
    const felulirt = t.alkalmazott ? Object.keys(t.alkalmazott.felulirasok ?? {}).length : 0;
    const alapDb = t.alap ? Object.keys(t.alap).length : 0;
    tema = {
      tervezet: t.tervezet !== null,
      tokenek: Math.max(0, alapDb - felulirt),
      felulirt,
      alkalmazva: alkalmazvaIdo(t.verziok, t.alkalmazott?.verzio ?? null),
    };
  } catch (h) {
    console.error("[gephaz] tema:", h);
  }

  let feliratok = { tervezet: false, felulirt: 0 };
  try {
    const f = await feliratSzervezetAllapot(szervezet.id);
    feliratok = { tervezet: f.tervezet !== null, felulirt: feliratFelulirtSzam(f.alkalmazott?.felulirasok ?? null) };
  } catch (h) {
    console.error("[gephaz] feliratok:", h);
  }

  return {
    nezet: "tulajdonos",
    munkater: { id: szervezet.id, nev: szervezet.nev, penznem },
    tema,
    feliratok,
    koltseg: null,
    fiokok: null,
    csomag,
    kimeno,
  };
}

/** A felülírt feliratkulcsok száma (a három nyelv kulcsainak uniója). */
function feliratFelulirtSzam(felulirasok: FeliratFelulirasok | null): number {
  if (!felulirasok) return 0;
  const kulcsok = new Set<string>();
  for (const ny of ["hu", "ro", "en"] as const) for (const kulcs of Object.keys(felulirasok[ny] ?? {})) kulcsok.add(kulcs);
  return kulcsok.size;
}

/** Mikor lépett érvénybe az alkalmazott verzió — a verziók fejéből (ISO), vagy null. */
function alkalmazvaIdo(verziok: { verzio: number; alkalmazva: string | null }[], verzio: number | null): string | null {
  if (verzio === null) return null;
  return verziok.find((v) => v.verzio === verzio)?.alkalmazva ?? null;
}

/** A felső sáv adata (a kiszolgálói lap adja át a FelsoSav komponensnek). */
export function felsoSavAdat(
  fiok: FiokNezet,
  szervezet: { id: string; nev: string },
  szerep: Szerep,
  ujTalalat: number,
): FelsoSavAdat {
  return {
    munkater: { id: szervezet.id, nev: szervezet.nev },
    munkaterek: fiok.szervezetek.map((sz) => ({ id: sz.id, nev: sz.nev, szerep: sz.szerep as Szerep })),
    szerep,
    fiok: { nev: fiok.nev, rendszergazda: fiok.rendszergazda },
    uj_talalat: ujTalalat,
    poszt_varo: 0,
    gephaz: szerep === "tulajdonos" || fiok.rendszergazda,
    gephaz_csempek: fiok.rendszergazda ? 4 : 2,
    tagok: null, ertesites_olvasatlan: 0, modulok: ["hirfigyelo"],
  };
}

/** F-3f: a Tagok sor számai a lenyílóhoz — tagok és élő (kiadott) meghívók; a nézőnek null (nem látja a lapot, D-F30). Hiba esetén null (a sáv nem dőlhet). */
export async function tagokSzam(fiok: FiokNezet, szervezetId: string, szerep: Szerep): Promise<{ n: number; m: number } | null> {
  if (szerep === "nezo") return null;
  try {
    const k = hozzaferesKornyezet();
    const ktx = { fiok_id: fiok.id, szervezet_id: szervezetId, szerep: szerepFordit(szerep) };
    const [t, m] = await Promise.all([tagokLista(k, ktx), meghivoLista(k, ktx)]);
    return { n: t.ok ? t.ertek.length : 0, m: m.ok ? m.ertek.filter((x) => x.allapot_most === "kiadott").length : 0 };
  } catch (h) {
    console.error("[kezdolap] tagokSzam:", h);
    return null;
  }
}

/** A felső sáv adata EGY hívással: a sáv alapadatai + az új találatok száma + a Tagok sor számai. Minden belépett lap ezt hívja. */
export async function felsoSav(fiok: FiokNezet, szervezet: { id: string; nev: string }, szerep: Szerep): Promise<FelsoSavAdat> {
  // R-15 (gepezet 8): a Hírek jelvénye ugyanaz a szám, mint a Hírek lap kártyái; a Posztszövegé a váró posztok száma
  const { r15HirSzam, r15VaroSzam } = await import("../r15");
  const [uj, varo, tagok, olvasatlan, csomag] = await Promise.all([r15HirSzam(szervezet.id, fiok.id), r15VaroSzam(szervezet.id), tagokSzam(fiok, szervezet.id, szerep), olvasatlanSzam(fiok), szervezetCsomag(szervezet.id).catch(() => null)]);
  return { ...felsoSavAdat(fiok, szervezet, szerep, uj), poszt_varo: varo, tagok, ertesites_olvasatlan: olvasatlan, modulok: csomag?.modulok ?? ["hirfigyelo"] };
}

/** R-1 v4: az új (még nem megtekintett) találatok száma a felső sáv „{n} új" jelvényéhez — olcsó, hiba esetén 0 (a sáv nem dőlhet a hírfigyelőn). */
export async function ujTalalatSzam(fiok: FiokNezet, szervezetId: string): Promise<number> {
  try {
    const k = await kornyezet(szervezetId, fiok.nyelv ?? "hu", fiok.id);
    const talalatok = (await k.tar.talalatok(szervezetId)).map((t) => nezoSzerint(t, k.nezo)); // R-13: a néző szemével
    // 2026-09-22 (Vilmos): a kiszűrt (háttér) hír nem „új”
    return talalatok.filter((t) => t.megtekintes === "uj" && !(t.ertekeles_allapot === "kesz" && t.ertekeles?.fontossag === "hatter")).length;
  } catch (h) {
    console.error("[kezdolap] ujTalalatSzam:", h);
    return 0;
  }
}

/** R-7b 02: a kártya fontosságának sorrendje a Hírek csempén. */
function sorrend(f: "fontos" | "erdekes" | "hatter" | null): number {
  return f === "fontos" ? 0 : f === "erdekes" ? 1 : f === "hatter" ? 2 : 3; // értékelés nélkül (null) a végére
}
