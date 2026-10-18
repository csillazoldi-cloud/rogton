// Előszűrő (2026-09-22, v11 — Vilmos: „ne is nézzen olyan cikket, ami nem a témába vagy iránytűbe vág”; döntése: szólista ÉS címek).
// A teljes olvasás (hf_relevancia) ELŐTT két lépés dönti el, hogy a gép egyáltalán elolvassa-e a cikket:
//  1) szólista — egy AI-kérés gyűjtésenként: a hely minden alakja, témánként a szavak/szótövek (HU+RO), a figyelt nevek;
//     ezekkel a PROGRAM keres, AI nélkül (szolistaDont);
//  2) címek — a megmaradt címeket egy AI-kérés egyszerre átfutja (hf_cim_szures).
// Ha valamelyik lépés nem sikerül, az a lépés kimarad (nem dob el mindent) — a teljes olvasás szigorú marad.
import type { Beallitas } from "./beallitas";
import type { Kivonat } from "./kivonat";
import type { Ertekeles } from "./talalat";
import { SZURO_VERZIO } from "./talalat";
import { aiValaszEllenoriz, osszevetoAlak, type CimSzuresValasz, type HfFeladat, type SzolistaValasz } from "./ai";
import type { AiHivo } from "./host";
import { ALAP_SZURES, eloAtmegy, type EloTenyek, type TagSzures } from "./tag-szures";

export type EloszuroOk = "szolista" | "cim";

/** Egy címszűrő-kérésben legfeljebb ennyi cím megy. */
export const HF_CIM_ADAG = 50;

/** Háttér-mondat az előszűrt hírhez (a felület úgysem mutatja, csak a számát). */
export const ELOSZURT_MIERT = "Háttérhír; most nem kell tennetek semmit.";

/**
 * Egy szó (vagy szótő) szerepel-e a szövegben. A szöveg `osszevetoAlak`-ban, szóközzel körülvéve jön.
 * Legfeljebb 3 betűnél egész szót keres (az „AI” ne találjon bele a „vakáció”-ba), felette a szó elejét
 * (az „iskola” megtalálja az „iskolában”-t, a „scoal” a „școală”-t).
 */
export function szoSzerepel(szo: string, normSzoveg: string): boolean {
  const s = osszevetoAlak(szo);
  if (s.length < 2) return false;
  return s.replace(/ /g, "").length <= 3 ? normSzoveg.includes(` ${s} `) : normSzoveg.includes(` ${s}`);
}

/** A szólista tényei egy cikkre: a figyelt név · a hely (true, ha nincs helyfeltétel) · egy téma szava (true, ha nincs témalista). */
export function szolistaTenyek(lista: SzolistaValasz, cikk: { cim: string; szoveg: string }): { nev: boolean; hely: boolean; tema: boolean } {
  const t = ` ${osszevetoAlak(`${cikk.cim} ${cikk.szoveg}`)} `;
  const nev = lista.nevek.some((n) => szoSzerepel(n, t));
  const hely = !lista.hely || lista.hely.szavak.length === 0 || [lista.hely.nev, ...lista.hely.szavak].some((s) => szoSzerepel(s, t));
  const temaSzavak = lista.temak.flatMap((x) => [x.nev, ...x.szavak]);
  const tema = temaSzavak.length === 0 || temaSzavak.some((s) => szoSzerepel(s, t));
  return { nev, hely, tema };
}

/**
 * A szólista döntése egy cikkre a NAGYON SZIGORÚ fokozaton (v11): a figyelt név mindig átenged; különben — ha van
 * helyfeltétel — a hely egyik alakja ÉS egy téma szava kell. Üres témalistánál átenged.
 */
export function szolistaDont(lista: SzolistaValasz, cikk: { cim: string; szoveg: string }): "atmegy" | "hely" | "tema" {
  const s = szolistaTenyek(lista, cikk);
  if (s.nev) return "atmegy";
  if (!s.hely) return "hely";
  return s.tema ? "atmegy" : "tema";
}

/** Az előszűrt hír értékelése — AI nélkül; a cím az eredeti (a felület úgysem mutatja). */
export function eloszurtErtekeles(
  kivonat: { cim: string; csonkolt: boolean },
  ok: EloszuroOk,
  szabalyVerzio: number,
  most: Date,
  elo: EloTenyek | null = null,
): Ertekeles {
  return {
    fontossag: "hatter",
    temacimke: "tartalomotlet",
    miert: ELOSZURT_MIERT,
    indoklas: "",
    osszefoglalo: "",
    cim_forditott: kivonat.cim.slice(0, 200),
    cegednek: "",
    vevoidnek: "",
    szabaly_verzio: szabalyVerzio,
    ertekelve: most.toISOString(),
    csonkolt_alapjan: kivonat.csonkolt,
    szuro_verzio: SZURO_VERZIO,
    kiszurve: ok,
    elo,
  };
}

/** Az AI-hívás, hibatűrően: ami nem sikerül (vagy kivételt dob), az null — a lépés kimarad. */
async function probal<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Az előszűrő (R-13: tagonként): minden cikkre az előszűrő tényei, és hogy kell-e a gépnek elolvasnia — akkor kell,
 * ha LEGALÁBB EGY tagnak átmegy a saját előszűrőjén (kikapcsolt előszűrésnél mindig). Amit senkinek nem kell, az
 * a `kiszurt`-ban van, az okával. Ha egy lépés nem sikerül, az a lépés kimarad (nem dob el mindent).
 * `tagok` üres → egy tag az alap beállítással (nagyon szigorú, előszűrés be).
 * `lejart`: ha a host határideje lejárt, a címlépés kimarad (a teljes olvasás úgyis megáll).
 */
export async function eloszur(
  k: { ai: AiHivo; profil: unknown; kreditTerhel?: (fiokok: string[], feladat: HfFeladat) => Promise<void> },
  beallitas: Beallitas,
  kivonatok: Pick<Kivonat, "id" | "cim" | "szoveg">[],
  tagokBe: TagSzures[] = [],
  lejart: () => boolean = () => false,
  /** J-1g2: ezekre a cikkekre (szakmai oldalról jöttek) nem vonatkozik a helyfeltétel. */
  helyNelkul: (kivonatId: string) => boolean = () => false,
): Promise<{ kiszurt: Map<string, EloszuroOk>; tenyek: Map<string, EloTenyek>; szolistaVolt: boolean; cimKeres: number }> {
  const kiszurt = new Map<string, EloszuroOk>();
  const tenyek = new Map<string, EloTenyek>();
  const tagok: TagSzures[] = tagokBe.length > 0 ? tagokBe : [{ fiok_id: "-", ...ALAP_SZURES }];
  const eloTagok = tagok.filter((t) => t.eloszures);
  // R-13: az előszűrés kreditje a bekapcsolt előszűrésű (valódi) tagoké
  const terhel = async (feladat: HfFeladat): Promise<void> => {
    const idk = tagokBe.filter((t) => t.eloszures).map((t) => t.fiok_id);
    if (k.kreditTerhel && idk.length > 0) await k.kreditTerhel(idk, feladat);
  };
  if (kivonatok.length === 0 || eloTagok.length === 0) return { kiszurt, tenyek, szolistaVolt: false, cimKeres: 0 };

  // 1) szólista (egy kérés), a keresés AI nélkül
  const lista = await probal(async () => {
    const v = await k.ai("hf_szolista", { profil: k.profil, beallitas });
    if (!v.ok) return null;
    await terhel("hf_szolista");
    const ell = aiValaszEllenoriz("hf_szolista", v.valasz, { talalat_ids: [] });
    return ell.ok ? (ell.ertek as SzolistaValasz) : null;
  });
  for (const kv of kivonatok) {
    const sz = lista ? szolistaTenyek(lista, kv) : null;
    tenyek.set(kv.id, { szolista: sz && helyNelkul(kv.id) ? { ...sz, hely: true } : sz, cim: null });
  }

  // 2) a címek — csak azokra, amelyek a szólistán legalább egy bekapcsolt előszűrésű tagnak átmentek; adagonként egy kérés
  const cimre = kivonatok.filter((kv) => eloTagok.some((t) => eloAtmegy(tenyek.get(kv.id), t)));
  let cimKeres = 0;
  for (let i = 0; i < cimre.length; i += HF_CIM_ADAG) {
    if (lejart()) break;
    const adag = cimre.slice(i, i + HF_CIM_ADAG);
    cimKeres++;
    const valasz = await probal(async () => {
      const v = await k.ai("hf_cim_szures", { profil: k.profil, beallitas, cimek: adag.map((kv, j) => ({ sorszam: j + 1, cim: kv.cim })) });
      if (!v.ok) return null;
      await terhel("hf_cim_szures");
      const ell = aiValaszEllenoriz("hf_cim_szures", v.valasz, { talalat_ids: [] });
      return ell.ok ? (ell.ertek as CimSzuresValasz) : null;
    });
    if (!valasz) continue;
    const fo = new Set(valasz.megtart);
    const erinti = new Set(valasz.erinti);
    adag.forEach((kv, j) => {
      const e = tenyek.get(kv.id)!;
      tenyek.set(kv.id, { ...e, cim: fo.has(j + 1) ? "fo" : erinti.has(j + 1) ? "erinti" : "nem" });
    });
  }

  // 3) kinek kell: ha senkinek, a gép nem olvassa el — az ok: már a szólistán elbukott mindenkinek, vagy csak a címen
  for (const kv of kivonatok) {
    const e = tenyek.get(kv.id)!;
    if (tagok.some((t) => eloAtmegy(e, t))) continue;
    const szolistanBukott = eloTagok.every((t) => !eloAtmegy({ szolista: e.szolista, cim: null }, t));
    kiszurt.set(kv.id, szolistanBukott ? "szolista" : "cim");
  }
  return { kiszurt, tenyek, szolistaVolt: lista !== null, cimKeres };
}
