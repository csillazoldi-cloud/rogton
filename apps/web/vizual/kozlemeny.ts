import "server-only";
// VZ-1 · Közlemények — a három új gépezet (design/VZ1-szerkeszto/gepezet.md 2., 5. és kerdesek 4., 8.):
//  - a közlemény száma: az utolsó letöltött + 1, munkaterenként és receptenként (`kozlemeny_sorszam`, sorszintű védelemmel — A-11);
//  - a posztból kitöltés: EGY AI-hívás a megnyitáskor, a meglévő csatlakozón, a meglévő keret-, költség- és kreditkönyveléssel (mint a
//    VZ-2 „Mit írj mellé?”, vizual/melle.ts); a válasz a tiszta szabály (kozlemeny-szabaly.ts) ellenőrzésén megy át;
//  - a letöltött kép szabály-jelzései a rendszergazdáé (`kep_jelzes`); a lista SECURITY DEFINER függvényen át (0152).
import { and, eq, sql } from "drizzle-orm";
import { AiHiba, type HivasMeres } from "@rogton/ai-adapters";
import { db, sema, szervezetKent } from "../adatbazis/kapcsolat";
import { AiKozosHiba, jsonRobusztusan, keretEllenoriz, meresRogzit, prompt, szolgaltato } from "../ai";
import { posztTar } from "../poszt/tar";
import { foSzoveg, rovidNev } from "../r15/szamol";
import { SABLONOK, kitoltesErtelmez, type Sablon, type Urlap } from "./kozlemeny-szabaly";

export * from "./kozlemeny-szabaly";

export class KozlemenyHiba extends Error {
  constructor(readonly kod: "ERVENYTELEN_ADAT" | "NINCS_ILYEN" | "AI_KERET_KIMERULT" | "AI_NEM_ELERHETO") {
    super(kod);
  }
}

export function sablonE(x: unknown): x is Sablon {
  return typeof x === "string" && (SABLONOK as readonly string[]).includes(x);
}

/** A javasolt szám: az utolsó letöltött + 1 (még nincs: 1). */
export async function sorszamJavaslat(szervezetId: string, sablon: Sablon): Promise<number> {
  const sor = await szervezetKent(szervezetId, (tx) =>
    tx.select({ u: sema.kozlemenySorszam.utolso }).from(sema.kozlemenySorszam)
      .where(and(eq(sema.kozlemenySorszam.szervezetId, szervezetId), eq(sema.kozlemenySorszam.sablon, sablon))).limit(1),
  );
  return (sor[0]?.u ?? 0) + 1;
}

export type LetoltesJelzes = { szabaly: string; szigorusag: "tiltas" | "figyelmeztetes"; arculati: boolean; mezo: string; reszlet: string };

/** A letöltés feljegyzése: a szám lesz az „utolsó” (a munkatárs átírt száma is), és a kép jelzései a rendszergazdáé. */
export async function letoltesRogzit(
  k: { szervezetId: string; fiokId: string },
  be: { sablon?: unknown; sorszam?: unknown; jelzesek?: unknown },
): Promise<{ sorszam: number; jelzes: number }> {
  if (!sablonE(be.sablon)) throw new KozlemenyHiba("ERVENYTELEN_ADAT");
  const n = typeof be.sorszam === "number" ? be.sorszam : Number(be.sorszam);
  if (!Number.isInteger(n) || n < 0 || n > 999_999) throw new KozlemenyHiba("ERVENYTELEN_ADAT");
  const nyers = Array.isArray(be.jelzesek) ? be.jelzesek.slice(0, 20) : [];
  const jelzesek: LetoltesJelzes[] = [];
  for (const j of nyers) {
    if (!j || typeof j !== "object") continue;
    const o = j as Record<string, unknown>;
    const szabaly = typeof o["szabaly"] === "string" && /^[A-Za-z]{1,3}\d{0,3}$/.test(o["szabaly"]) ? o["szabaly"] : null;
    if (!szabaly) continue;
    jelzesek.push({
      szabaly,
      szigorusag: o["szigorusag"] === "tiltas" ? "tiltas" : "figyelmeztetes",
      arculati: o["arculati"] === true,
      mezo: typeof o["mezo"] === "string" && /^[a-z_]{0,40}$/.test(o["mezo"]) ? o["mezo"] : "",
      reszlet: typeof o["reszlet"] === "string" ? o["reszlet"].slice(0, 200) : "",
    });
  }
  const sablon = be.sablon;
  await szervezetKent(k.szervezetId, async (tx) => {
    await tx.insert(sema.kozlemenySorszam).values({ szervezetId: k.szervezetId, sablon, utolso: n })
      .onConflictDoUpdate({ target: [sema.kozlemenySorszam.szervezetId, sema.kozlemenySorszam.sablon], set: { utolso: n, frissitve: new Date() } });
    if (jelzesek.length) {
      await tx.insert(sema.kepJelzes).values(jelzesek.map((j) => ({ szervezetId: k.szervezetId, fiokId: k.fiokId, sablon, sorszam: n, ...j })));
    }
  });
  return { sorszam: n, jelzes: jelzesek.length };
}

export type KepJelzesSor = {
  id: string; szervezet_id: string; szervezet_nev: string; sablon: string; sorszam: number | null; szabaly: string;
  szigorusag: "tiltas" | "figyelmeztetes"; arculati: boolean; mezo: string; reszlet: string; letrehozva: string;
};

/** A rendszergazda listája (minden munkatér, legújabb elöl, legfeljebb 500). A JOGOT a hívó lap / végpont ellenőrzi. */
export async function kepJelzesLista(): Promise<KepJelzesSor[]> {
  const e = await db().execute(sql`SELECT * FROM kep_jelzes_osszes()`);
  const sorok = (e as unknown as { rows: Record<string, unknown>[] }).rows ?? [];
  return sorok.map((r) => ({
    id: String(r["id"]), szervezet_id: String(r["szervezet_id"]), szervezet_nev: String(r["szervezet_nev"] ?? ""),
    sablon: String(r["sablon"]), sorszam: r["sorszam"] === null || r["sorszam"] === undefined ? null : Number(r["sorszam"]),
    szabaly: String(r["szabaly"]), szigorusag: r["szigorusag"] === "tiltas" ? "tiltas" : "figyelmeztetes", arculati: r["arculati"] === true,
    mezo: String(r["mezo"] ?? ""), reszlet: String(r["reszlet"] ?? ""), letrehozva: new Date(String(r["letrehozva"])).toISOString(),
  }));
}

/** A poszt, amelyből a közleményt nyitották (a munkatér sajátja) — a lap alcíméhez a rövid neve. */
export async function posztNeve(szervezetId: string, posztId: string): Promise<{ id: string; nev: string } | null> {
  const m = await posztTar.betolt(szervezetId, posztId).catch(() => null);
  return m ? { id: m.id, nev: rovidNev(m) } : null;
}

/**
 * A posztból kitöltés (gepezet 2): a poszt szövege → a recept mezői, EGY AI-hívással. Kitalált tényt nem kér (a prompt szabálya), és
 * a válaszból csak az kerül a lapra, ami helyes alakú. A hívás a tag kreditjéből megy (meresRogzit), a keret kimerülése külön hiba.
 */
export async function kitoltPosztbol(
  k: { szervezetId: string; fiokId: string },
  be: { poszt?: unknown; sablon?: unknown },
  ma: string,
): Promise<{ urlap: Partial<Urlap>; nev: string }> {
  if (!sablonE(be.sablon) || typeof be.poszt !== "string" || !/^[0-9a-f-]{36}$/i.test(be.poszt)) throw new KozlemenyHiba("ERVENYTELEN_ADAT");
  const munka = await posztTar.betolt(k.szervezetId, be.poszt).catch(() => null);
  if (!munka) throw new KozlemenyHiba("NINCS_ILYEN");
  const szoveg = foSzoveg(munka).trim().slice(0, 3000);
  const nyelv = munka.szovegek.find((c) => c.szoveg.trim())?.nyelv ?? "hu";
  if (!szoveg) return { urlap: {}, nev: rovidNev(munka) };
  try {
    await keretEllenoriz(k.szervezetId, k.fiokId);
  } catch (h) {
    if (h instanceof AiKozosHiba) throw new KozlemenyHiba("AI_KERET_KIMERULT");
    throw h;
  }
  const sz = szolgaltato();
  const t0 = Date.now();
  const bemenet = [`A kép fajtája: ${be.sablon}`, `A mai dátum: ${ma}`, `A poszt szövege:\n${szoveg}`].join("\n");
  try {
    const v = await sz.hiv({ feladat: "kozlemeny_kitoltes", rendszer: await prompt("kozlemeny_kitoltes", "hu", nyelv), szoveg: bemenet, nyelv, maxKiToken: 500, idokorlatMs: 30_000 });
    await meresRogzit(k.szervezetId, v.meres, k.fiokId);
    const j = JSON.parse(jsonRobusztusan(v.szoveg)) as unknown;
    return { urlap: kitoltesErtelmez(be.sablon, j, ma), nev: rovidNev(munka) };
  } catch (hiba) {
    if (hiba instanceof KozlemenyHiba) throw hiba;
    if (hiba instanceof SyntaxError) throw new KozlemenyHiba("AI_NEM_ELERHETO"); // a válasz nem JSON: a lap üresen nyílik
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "kozlemeny_kitoltes", tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod };
    await meresRogzit(k.szervezetId, meres).catch(() => undefined);
    console.error("[kozlemeny kitoltes] sikertelen:", kod);
    throw new KozlemenyHiba(kod === "AI_KERET_KIMERULT" ? "AI_KERET_KIMERULT" : "AI_NEM_ELERHETO");
  }
}
