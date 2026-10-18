import "server-only";
import { tipusOf } from "../profil/tipus-szabaly";
import { profilBetolt } from "../profil";
import { fajlTar } from "../fajl/tar";
import { KEP_LOGO_MAX_BAJT, LOGO_VALTOZATOK, hasznaltLogok, type FajlMeta, type LogoValtozat } from "@rogton/fajl-core";
import { LogoElemzes, sajatBetuId } from "@rogton/arculat-core";
import { KepgyarHiba } from "./index";
import { munkaterAlapSzett } from "../arculat/alap";
import { eq } from "drizzle-orm";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";

/** A munkatér iparági képcsomagjai (VZ-2: a „Közlekedési közlemények (3)” sor csak ahol a „kozlekedes” be van kapcsolva). */
export async function iparagiCsomagok(szervezetId: string): Promise<string[]> {
  const sor = await szervezetKent(szervezetId, (tx) =>
    tx.select({ c: sema.szervezet.iparagiCsomagok }).from(sema.szervezet).where(eq(sema.szervezet.id, szervezetId)).limit(1),
  ).catch(() => []);
  return sor[0]?.c ?? [];
}

// VZ-2: a hét helyzet képe a munkatér arculatával (design/vz2). Az arculat: a jóváhagyott változat; ha nincs,
// a tervezet (akkor is, ha „későbbre” hagyták — 2026-09-28); ha az sincs, a semleges alap a cég nevével — idegen márka soha.
// Kivétel a logó (A5, 2026-09-30): az a legfrissebb feltöltött logó-fájl, a jóváhagyástól függetlenül (lásd `kepArculat`).

const CIM = process.env["KEPGYAR_URL"] ?? "http://192.168.1.249:8601";
export const HELYZETEK = ["kesz", "akcio", "uj", "hir", "tudtad", "esemeny", "szam"] as const;
export type Helyzet = (typeof HELYZETEK)[number];
export const MERETEK = ["poszt", "story", "negyzet"] as const;
export type Meret = (typeof MERETEK)[number];
const LOGO_TIPUS: Record<string, string> = { png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" };

/** fo/hatter/betu hiányában a képgyártó a semleges alapot adja (vizual-core SEMLEGES — tokenek.md --kep-semleges-*). */
export type KepLogo = { adat: string; atlatszo: boolean; vilagossag?: number };
/** R-16 K2 (TERV 1.3): `logok` — helyenként a logó; `logo` a RÉGI mező (= logok.vilagos ?? logok.egyszinu), a régi képgyártónak. */
/** R-16 K5 (TERV 1.3, 1.5): a választott saját betű bájtja — a képgyártó a NAS lemezét nem látja, ezért adat-URL a kérésben. */
export type KepSajatBetu = { kulcs: string; adat: string; formatum: "truetype" | "opentype" | "woff2" };
/** R-16 K5 (TERV 1.3): `betu_cim` + `betu_szoveg` (betűkulcs vagy "sajat:<id>"), `sajat_betuk` (csak a választottak, ≤ 2);
 *  a RÉGI `betu` = `betu_cim` (a régi képgyártónak, egy kiadásig). */
export type KepArculat = {
  nev: string; fo?: string; hatter?: string; masodik?: string | null; betu?: string;
  betu_cim?: string; betu_szoveg?: string; sajat_betuk?: KepSajatBetu[];
  logok: { vilagos?: KepLogo; sotet?: KepLogo; egyszinu?: KepLogo; negyzetes?: KepLogo };
  logo: string | null;
  /** c30 F12: a munkatér fesztivál (a kép kis feliratai és a mintaszöveg a fesztiválé) — cégnél a mező nincs is ott */
  fesztival?: true;
};
export const VALTOZATOK = ["vilagos", "szines", "sotet", "masodik", "atmenet"] as const;
const valtozatOk = (v: unknown) => (VALTOZATOK as readonly unknown[]).includes(v);

/** VZ-3: a munkatér legutóbb választott színváltozata (alap: Világos). */
export async function kepValtozat(szervezetId: string): Promise<string> {
  const sor = await szervezetKent(szervezetId, (tx) =>
    tx.select({ v: sema.szervezet.kepValtozat }).from(sema.szervezet).where(eq(sema.szervezet.id, szervezetId)).limit(1),
  ).catch(() => []);
  return sor[0]?.v ?? "vilagos";
}
export async function kepValtozatMent(szervezetId: string, v: unknown): Promise<void> {
  if (!valtozatOk(v)) throw new KepgyarHiba("ERVENYTELEN_ADAT", { valtozat: "ervenytelen" });
  await szervezetKent(szervezetId, (tx) => tx.update(sema.szervezet).set({ kepValtozat: String(v) }).where(eq(sema.szervezet.id, szervezetId)));
}

/** A munkatér arculata a képhez, és hogy van-e egyáltalán (a „színeidet a Szervezet adatainál” sorhoz). */
export async function kepArculat(szervezetId: string, szervezetNev: string): Promise<{ arculat: KepArculat; nincsArculat: boolean; nyelv: string }> {
  const p = await profilBetolt(szervezetId).catch(() => null);
  const a = p?.arculat;
  const jov = a?.jovahagyott_verzio ? a.verziok[String(a.jovahagyott_verzio)] : undefined;
  // 2026-09-28 (Vilmos): a kép SOHA ne legyen szürke, ha van színünk — a „későbbre hagyott” arculat tervezetének
  // (a gép javaslatának) színeit is használjuk. A semleges alap csak akkor, ha egyáltalán nincs fő szín.
  const tervezet = a?.tervezet?.elsodleges ? a.tervezet : undefined;
  const forras = jov ?? tervezet;
  const nyelv = ["hu", "ro", "en"].find((n) => n === (p?.nyelvek?.[0] ?? forras?.nyelv)) ?? "hu";
  // A5 (Kati 09-25: „a képszerkesztő nem vette át a feltöltött arculati elemeket”), R-16 gepezet 1 / kerdesek 5:
  // a logó a munkatér saját fájlja, nem a jóváhagyásé — a kép a legfrissebb feltöltött logót kapja, akkor is, ha a pillanatkép
  // régebbi, ha az arculat „későbbre” hagyva, vagy ha nincs tervezet, sőt ha színek sincsenek.
  // R-16 K1+K2 (TERV 1.3, gepezet 2–4): HELYENKÉNT — `hasznaltLogok` (fajl-core) a hely legfrissebb képre alkalmas fájlját adja;
  // a pillanatkép (ill. a tervezet) `logok`-ja csak tartalék (nincs fájl a helyen, vagy a lista nem olvasható).
  const pk = Object.fromEntries(LOGO_VALTOZATOK.map((h) => [h, forras?.logok[h] ?? a?.tervezet?.logok[h] ?? null])) as Record<LogoValtozat, string | null>;
  const logok = await kepLogok(szervezetId, pk);
  // A RÉGI `logo` mező (a régi képgyártónak, TERV 1.3): a világos hely, ha üres, az egyszínű — ugyanaz, mint a `hasznaltLogoId`.
  const logo = logok.vilagos?.adat ?? logok.egyszinu?.adat ?? null;
  // c30 F12: fesztiválnál a jelző (a kép feliratai, a mintaszöveg); cégnél semmi nem kerül az arculatba — a képe bájtra ugyanaz
  const fesztival = p && tipusOf(p) === "fesztival" ? { fesztival: true as const } : {};
  // R-16 K3 (TERV §2-K3, §4 14.): tervezet sincs → az ALAPSZETT a szakmából (apps/web/arculat/alap.ts) — ugyanaz, amit a 12a
  // mutat. „A kép sosem szürke”, a Képek lapon sem; a `nincsArculat` igaz marad (a „színeidet a Szervezet adatainál” sor megmarad).
  if (!forras) {
    const sz = munkaterAlapSzett(p?.nev ?? szervezetNev, p?.osszefoglalo);
    return { arculat: { nev: szervezetNev, fo: sz.fo, hatter: sz.hatter, masodik: sz.masodik, betu: sz.cim, betu_cim: sz.cim, betu_szoveg: sz.szoveg, sajat_betuk: [], logok, logo, ...fesztival }, nincsArculat: true, nyelv };
  }
  // R-16 K5 (gepezet 7): KÉT betű — a cím és a szöveg külön (addig a kép egyet használt: `betu_cim || betu_szoveg`). Üres mező: a
  // másik, végül a Public Sans. A saját betű bájtja a munkatér saját fájljából (sajatBetukAdat).
  const cim = forras.betu_cim || forras.betu_szoveg || "public-sans";
  const szoveg = forras.betu_szoveg || forras.betu_cim || "public-sans";
  return {
    arculat: { nev: szervezetNev, fo: forras.elsodleges, hatter: forras.hatter, masodik: forras.masodlagos ?? null, betu: cim, betu_cim: cim, betu_szoveg: szoveg, sajat_betuk: await sajatBetukAdat(szervezetId, [cim, szoveg]), logok, logo, ...fesztival },
    nincsArculat: false,
    nyelv,
  };
}

const BETU_FORMATUM: Record<string, KepSajatBetu["formatum"]> = { ttf: "truetype", otf: "opentype", woff2: "woff2" };

/**
 * R-16 K5 (TERV 1.3, 1.5): a kulcsok közül a "sajat:<id>"-k bájtja adat-URL-ként — CSAK a munkatér saját `betu` fájljából (a fájl-tár
 * a szervezetre szűr; más cél vagy más munkatér fájlja nem jöhet). Olvashatatlan / hiányzó fájl → kimarad (a kép a Public Sans-szal íródik).
 */
export async function sajatBetukAdat(szervezetId: string, kulcsok: readonly string[]): Promise<KepSajatBetu[]> {
  const idk = [...new Set(kulcsok.map((k) => sajatBetuId(k)).filter((x): x is string => x !== null))].slice(0, 2);
  const ki = await Promise.all(idk.map(async (id): Promise<KepSajatBetu | null> => {
    // Csilla 2026-10-10 (100 MB): előbb a meta — csak a valóban `betu` célú (≤ 10 MB) fájl töltődik be
    const m = await fajlTar.meta(szervezetId, id).catch(() => null);
    const formatum = m ? BETU_FORMATUM[m.tipus] : undefined;
    if (!m || m.cel !== "betu" || !formatum) return null;
    const b = await fajlTar.olvas(szervezetId, id).catch(() => null);
    if (!b) return null;
    return { kulcs: `sajat:${id}`, adat: `data:font/${m.tipus};base64,${Buffer.from(b).toString("base64")}`, formatum };
  }));
  return ki.filter((x): x is KepSajatBetu => x !== null);
}

/** A négy hely logója a képhez: adat-URL + az elemzés (K1, `arculat_fajl.elemzes`) átlátszósága és világossága.
 *  Ismeretlen / hibás elemzés (régi logó) → `atlatszo: false`, `vilagossag` nélkül: a képgyártó lemezre teszi, nem színezi át (TERV §5).
 *  Olvashatatlan, túl nagy vagy nem kép fájl → a hely üres (a képgyártó a következő helyet, végül a nevet választja). */
async function kepLogok(szervezetId: string, pillanatkepLogok: Partial<Record<LogoValtozat, string | null>> | null): Promise<KepArculat["logok"]> {
  const fajlok = await fajlTar.lista(szervezetId, "logo").catch(() => null);
  const idk = hasznaltLogok(fajlok, pillanatkepLogok);
  const ki: KepArculat["logok"] = {};
  await Promise.all(LOGO_VALTOZATOK.map(async (hely) => {
    const id = idk[hely];
    if (!id) return;
    const l = await kepLogo(szervezetId, id, fajlok?.find((f) => f.id === id) ?? null).catch(() => null);
    if (l) ki[hely] = l;
  }));
  return ki;
}

async function kepLogo(szervezetId: string, id: string, ismert: FajlMeta | null): Promise<KepLogo | null> {
  // Csilla 2026-10-10 (100 MB): a méretet a meta mondja meg OLVASÁS ELŐTT — a túl nagy logó be sem töltődik a memóriába
  const m = ismert ?? await fajlTar.meta(szervezetId, id);
  const tipus = m ? LOGO_TIPUS[String(m.tipus).toLowerCase()] : undefined;
  if (!m || !tipus || m.meret >= KEP_LOGO_MAX_BAJT) return null;
  const b = await fajlTar.olvas(szervezetId, id);
  if (!b || b.byteLength >= KEP_LOGO_MAX_BAJT) return null;
  const e = LogoElemzes.safeParse(m.elemzes);
  const adat = `data:${tipus};base64,${Buffer.from(b).toString("base64")}`;
  return e.success ? { adat, atlatszo: e.data.atlatszo, vilagossag: e.data.vilagossag } : { adat, atlatszo: false };
}

async function kerd(ut: string, torzs: unknown, mp: number): Promise<Response> {
  try {
    return await fetch(CIM + ut, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(torzs),
      signal: AbortSignal.timeout(mp * 1000),
      cache: "no-store",
    });
  } catch {
    throw new KepgyarHiba("KEPGYAR_NEM_VALASZOL");
  }
}

/** A kártya mintaképe — a képgyártó munkaterenként eltárolja. c15: `kategoria` (a szakma, minta-kategoria.ts) választja a „Kész munka”
 *  példafotóját; a fotós minta JPEG, minden más PNG — a típus a képgyártó válaszából jön (régi képgyártó: PNG). */
export async function helyzetMinta(helyzet: string, arculat: KepArculat, nyelv: string, tartalom?: Record<string, string>, valtozat?: string, kategoria?: string): Promise<{ kep: ArrayBuffer; tipus: string }> {
  if (!(HELYZETEK as readonly string[]).includes(helyzet)) throw new KepgyarHiba("NINCS_ILYEN");
  const v = await kerd("/helyzet-minta", { helyzet, arculat, nyelv, tartalom, valtozat, minta_kategoria: kategoria }, 20);
  if (v.status === 400) throw new KepgyarHiba("ERVENYTELEN_ADAT");
  if (!v.ok) throw new KepgyarHiba("KEPGYAR_NEM_VALASZOL");
  const tipus = v.headers.get("content-type") === "image/jpeg" ? "image/jpeg" : "image/png";
  return { kep: await v.arrayBuffer(), tipus };
}

/** A kép a kitöltésből: {kep (PNG base64), meret, fok, kisebbBetu, nemFer, mezok}. */
export async function helyzetKep(helyzet: unknown, meret: unknown, tartalom: unknown, arculat: KepArculat, nyelv: string, valtozat?: unknown): Promise<unknown> {
  if (typeof helyzet !== "string" || !(HELYZETEK as readonly string[]).includes(helyzet)) throw new KepgyarHiba("ERVENYTELEN_ADAT", { helyzet: "ervenytelen" });
  if (typeof meret !== "string" || !(MERETEK as readonly string[]).includes(meret)) throw new KepgyarHiba("ERVENYTELEN_ADAT", { meret: "ervenytelen" });
  const v = await kerd("/helyzet", { helyzet, meret, tartalom, arculat, nyelv, valtozat: valtozatOk(valtozat) ? valtozat : "vilagos" }, 30);
  const adat = (await v.json().catch(() => null)) as Record<string, unknown> | null;
  if (v.status === 400) throw new KepgyarHiba("ERVENYTELEN_ADAT", adat?.["reszlet"] ?? adat?.["hiba"]);
  if (!v.ok || !adat) throw new KepgyarHiba("KEPGYAR_NEM_VALASZOL");
  return adat;
}

/** A kérdések helyzetenként (design/vz2 ATADO: legfeljebb 3 + fotó) — a mező és a címke kulcsa. */
export const KERDESEK: Record<Helyzet, { mezo: "cim" | "sor" | "szam" | "mikor" | "hol"; cimke: string }[]> = {
  kesz: [{ mezo: "cim", cimke: "vz2.k_mit_mutatsz" }, { mezo: "sor", cimke: "vz2.k_egy_mondat" }],
  akcio: [{ mezo: "cim", cimke: "vz2.k_mire" }, { mezo: "szam", cimke: "vz2.k_mennyi" }, { mezo: "sor", cimke: "vz2.k_meddig" }],
  uj: [{ mezo: "cim", cimke: "vz2.k_mit_mutatsz" }, { mezo: "sor", cimke: "vz2.k_egy_mondat" }],
  hir: [{ mezo: "cim", cimke: "vz2.k_mi_a_hir" }, { mezo: "mikor", cimke: "vz2.k_mikor" }, { mezo: "sor", cimke: "vz2.k_egy_mondat" }],
  tudtad: [{ mezo: "cim", cimke: "vz2.k_tipp" }, { mezo: "sor", cimke: "vz2.k_egy_mondat" }],
  esemeny: [{ mezo: "cim", cimke: "vz2.k_mi" }, { mezo: "hol", cimke: "vz2.k_hol" }, { mezo: "mikor", cimke: "vz2.k_mikor" }],
  szam: [{ mezo: "szam", cimke: "vz2.k_szam" }, { mezo: "cim", cimke: "vz2.k_egy_mondat" }],
};

/** Az első megnyitás szövege, amíg a gép nem ír a cég szakmájából (6. lépés). Ugyanaz, mint a képgyártó
 *  mintaszövege (packages/vizual-core/src/helyzet.ts MINTA) — a kártya képe és a kitöltő így egyezik. */
export const MINTA: Record<string, Record<Helyzet, Record<string, string>>> = {
  hu: {
    kesz: { cim: "Elkészült a legújabb munkánk", sor: "Nézd meg, milyen lett!" },
    akcio: { szam: "−15%", cim: "minden termékünkre", sor: "a hónap végéig" },
    uj: { cim: "Új a kínálatunkban", sor: "Már nálunk is kapható." },
    hir: { cim: "Változik a nyitvatartás", mikor: "jövő héttől", sor: "Hétköznap 8–17 óra között várunk." },
    tudtad: { cim: "Egy jó tipp a szakmánkból.", sor: "Kérdezz tőlünk bátran, szívesen segítünk." },
    esemeny: { cim: "Nyílt nap nálunk", hol: "a telephelyünkön", mikor: "szombat, 9–14 óra" },
    szam: { szam: "100+", cim: "elégedett ügyfél tavaly." },
  },
  ro: {
    kesz: { cim: "Am terminat cea mai nouă lucrare", sor: "Vezi cum a ieșit!" },
    akcio: { szam: "−15%", cim: "la toate produsele", sor: "până la sfârșitul lunii" },
    uj: { cim: "Nou în oferta noastră", sor: "Disponibil de acum." },
    hir: { cim: "Se schimbă programul", mikor: "de săptămâna viitoare", sor: "Vă așteptăm în zilele lucrătoare, 8–17." },
    tudtad: { cim: "Un sfat util din meseria noastră.", sor: "Întreabă-ne, te ajutăm cu drag." },
    esemeny: { cim: "Zi porți deschise", hol: "la sediul nostru", mikor: "sâmbătă, 9–14" },
    szam: { szam: "100+", cim: "clienți mulțumiți anul trecut." },
  },
  en: {
    kesz: { cim: "Our latest job is finished", sor: "See how it turned out!" },
    akcio: { szam: "−15%", cim: "on all our products", sor: "until the end of the month" },
    uj: { cim: "New in our range", sor: "Available now." },
    hir: { cim: "Our opening hours change", mikor: "from next week", sor: "Weekdays 8am–5pm." },
    tudtad: { cim: "A useful tip from our trade.", sor: "Just ask us — we are happy to help." },
    esemeny: { cim: "Open day", hol: "at our site", mikor: "Saturday, 9am–2pm" },
    szam: { szam: "100+", cim: "happy customers last year." },
  },
};

/** c30 F12: a fesztivál mintaszövege (amíg a gép nem írt a fesztivál adataiból) — a cégé (MINTA) változatlan. */
export const MINTA_FESZTIVAL: Record<string, Record<Helyzet, Record<string, string>>> = {
  hu: {
    kesz: { cim: "Ilyen volt a tegnapi este", sor: "Köszönjük, hogy velünk voltatok!" },
    akcio: { szam: "−20%", cim: "a napijegyekre", sor: "a hét végéig" },
    uj: { cim: "Új fellépő a programban", sor: "Nézd meg, mikor lép színpadra!" },
    hir: { cim: "Változik a program", mikor: "szombattól", sor: "A kapuk 16 órakor nyílnak." },
    tudtad: { cim: "Egy jó tipp a fesztiválra.", sor: "Hozz esőkabátot, és gyere korábban!" },
    esemeny: { cim: "Esti koncert", hol: "a nagyszínpadon", mikor: "szombat, 20 óra" },
    szam: { szam: "10 000+", cim: "látogató tavaly." },
  },
  ro: {
    kesz: { cim: "Așa a fost aseară", sor: "Mulțumim că ați fost alături de noi!" },
    akcio: { szam: "−20%", cim: "la biletele de o zi", sor: "până la sfârșitul săptămânii" },
    uj: { cim: "Un artist nou în program", sor: "Vezi când urcă pe scenă!" },
    hir: { cim: "Se schimbă programul", mikor: "de sâmbătă", sor: "Porțile se deschid la ora 16." },
    tudtad: { cim: "Un sfat util pentru festival.", sor: "Ia-ți o pelerină și vino mai devreme!" },
    esemeny: { cim: "Concert de seară", hol: "pe scena mare", mikor: "sâmbătă, ora 20" },
    szam: { szam: "10 000+", cim: "vizitatori anul trecut." },
  },
  en: {
    kesz: { cim: "This was last night", sor: "Thank you for being with us!" },
    akcio: { szam: "−20%", cim: "on day tickets", sor: "until the end of the week" },
    uj: { cim: "A new act on the line-up", sor: "See when they take the stage!" },
    hir: { cim: "The programme changes", mikor: "from Saturday", sor: "Gates open at 4pm." },
    tudtad: { cim: "A good tip for the festival.", sor: "Bring a raincoat and come early!" },
    esemeny: { cim: "Evening concert", hol: "on the main stage", mikor: "Saturday, 8pm" },
    szam: { szam: "10,000+", cim: "visitors last year." },
  },
};

/** A helyzet mintaszövege a munkatér típusa szerint (fesztivál: MINTA_FESZTIVAL), a nyelv tartalékkal. */
export function mintaSzoveg(nyelv: string, h: Helyzet, fesztival?: boolean): Record<string, string> {
  const m = fesztival ? MINTA_FESZTIVAL : MINTA;
  return m[nyelv]?.[h] ?? m["hu"]![h];
}

/** VZ-3: a megmaradó színváltozatok kis mintaképe: {valtozatok: [{id, kep}]} (üres, ha nincs mit választani). */
export async function helyzetValtozatok(helyzet: unknown, meret: unknown, tartalom: unknown, arculat: KepArculat, nyelv: string): Promise<unknown> {
  if (typeof helyzet !== "string" || !(HELYZETEK as readonly string[]).includes(helyzet)) throw new KepgyarHiba("ERVENYTELEN_ADAT", { helyzet: "ervenytelen" });
  if (typeof meret !== "string" || !(MERETEK as readonly string[]).includes(meret)) throw new KepgyarHiba("ERVENYTELEN_ADAT", { meret: "ervenytelen" });
  if (!arculat.masodik) return { valtozatok: [] };
  const v = await kerd("/helyzet-valtozatok", { helyzet, meret, tartalom, arculat, nyelv }, 40);
  const adat = (await v.json().catch(() => null)) as Record<string, unknown> | null;
  if (v.status === 400) throw new KepgyarHiba("ERVENYTELEN_ADAT", adat?.["hiba"]);
  if (!v.ok || !adat) throw new KepgyarHiba("KEPGYAR_NEM_VALASZOL");
  return adat;
}
