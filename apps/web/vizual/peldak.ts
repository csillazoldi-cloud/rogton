import "server-only";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { AiHiba, type HivasMeres } from "@rogton/ai-adapters";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";
import { jsonRobusztusan, keretEllenoriz, meresRogzit, prompt, szolgaltato } from "../ai";
import { profilBetolt } from "../profil";
import { profilSorok } from "../poszt/profil-blokk";
import { iranytuJovahagyott } from "../iranytu";
import { tipusOf } from "../profil/tipus-szabaly";
import { HELYZETEK, KERDESEK, mintaSzoveg, type Helyzet } from "./helyzet";
import { fotoKategoria, kepKategoria, mintaKategoria, taroltPeldak, type MintaFotoKategoria, type MintaKategoria } from "./minta-kategoria";

// VZ-2 (Vilmos, 2026-09-24): a hét helyzet példaszövegét a GÉP írja meg a cég szakmájából — egyszer, amikor a profil
// elkészül, és újra, ha a profil (vagy az Iránytű „amit tolni kell” része) változik. Ebből lesz a kártyák mintaképe
// és a kitöltő első szövege. A tárolt sor a forrás ujjlenyomatát őrzi: ha az eltér, a szöveg elavult → újraírjuk.
// AI nélkül / hibánál az általános minta (MINTA) áll — a lap soha nem vár a gépre.

export type Peldak = Record<Helyzet, Record<string, string>>;
// c15 (2026-10-08): v3 — a válasz a szakma-kategóriát is hozza (a „Kész munka” mintafotójához); a változat az ujjlenyomatban
// van, ezért minden munkatér példái EGYSZER újraíródnak (a következő Képek-látogatáskor), és így kapják meg a kategóriát.
const PROMPT_VERZIO = "kep_peldak v3";
const MAX: Record<string, number> = { cim: 60, sor: 90, szam: 8, mikor: 45, hol: 45 };

async function forras(szervezetId: string) {
  const [p, ir] = await Promise.all([profilBetolt(szervezetId).catch(() => null), iranytuJovahagyott(szervezetId).catch(() => null)]);
  const nyelv = ["hu", "ro", "en"].find((n) => n === p?.nyelvek?.[0]) ?? "hu";
  const sorok = profilSorok(p);
  const tolni = ((ir as { tolni?: { nev?: string }[] } | null)?.tolni ?? []).map((x) => x.nev ?? "").filter(Boolean);
  if (tolni.length) sorok.push(`Amit a cég tolni szeretne:\n${tolni.join("\n")}`);
  // c30 F1 (plan §3 kep_peldak): a confirmed (stored) category is passed in and wins over the AI's own pick. Only orgs that have
  // one get the extra line, so every other org's fingerprint — and its stored examples — stays exactly as it is (no rewrite, no cost).
  const megerositett = mintaKategoria(p?.kategoria);
  if (megerositett !== "semleges") sorok.push(`A cég szakma-kategóriája (megerősítve, a "kategoria" kulcsba ezt írd): ${megerositett}`);
  // a prompt változata is benne van: ha a promptot javítjuk, a gép minden munkatérnél újraírja a példákat
  const ujj = createHash("sha1").update(JSON.stringify([PROMPT_VERZIO, nyelv, sorok])).digest("hex");
  // c30 F11: the org type only picks the sample photo (fotoKategoria) — it is NOT in the fingerprint, so no example is rewritten
  return { nyelv, sorok, ujj, vanProfil: !!p, megerositett, tipus: p ? tipusOf(p) : undefined };
}

/** A tárolt példák, ha frissek; különben null (és a hívó dönthet, elindítja-e az írást). */
/** c15: `kategoria` — a szakma a „Kész munka” mintafotójához; a c15 előtti (vagy még újra nem írt) soroknál "semleges".
 *  c30 F11: `fotoKategoria` — amit a képgyártó a mintafotóhoz kap: fesztiválnál `rendezveny`, cégnél a `kategoria`. */
export async function peldakFrissen(szervezetId: string): Promise<{ peldak: Peldak | null; kategoria: MintaKategoria; fotoKategoria: MintaFotoKategoria; nyelv: string; elavult: boolean }> {
  const f = await forras(szervezetId);
  const sor = await szervezetKent(szervezetId, async (tx) =>
    tx.select().from(sema.kepPelda).where(eq(sema.kepPelda.szervezetId, szervezetId)).limit(1),
  ).then((s) => s[0]).catch(() => undefined);
  const t = taroltPeldak<Peldak>(sor?.adat);
  const foto = fotoKategoria(f.tipus, t.kategoria);
  if (sor && sor.ujj === f.ujj && sor.nyelv === f.nyelv) return { ...t, fotoKategoria: foto, nyelv: f.nyelv, elavult: false };
  return { ...t, fotoKategoria: foto, nyelv: f.nyelv, elavult: f.vanProfil };
}

function ellenoriz(nyers: unknown, nyelv: string, fesztival = false): Peldak | null {
  if (!nyers || typeof nyers !== "object") return null;
  const ki = {} as Peldak;
  for (const h of HELYZETEK) {
    const be = (nyers as Record<string, unknown>)[h] as Record<string, unknown> | undefined;
    const minta = mintaSzoveg(nyelv, h, fesztival); // c30 F12: fesztiválnál a fesztivál mintája a tartalék
    const egy: Record<string, string> = {};
    for (const k of KERDESEK[h]) {
      const v = typeof be?.[k.mezo] === "string" ? String(be[k.mezo]).replace(/\s+/g, " ").trim() : "";
      egy[k.mezo] = v && v.length <= (MAX[k.mezo] ?? 60) ? v : minta[k.mezo] ?? "";
    }
    ki[h] = egy;
  }
  return ki;
}

const folyamatban = new Set<string>();
/** Megírja (és eltárolja) a példákat. Egyszerre szervezetenként egy írás fut; hibánál null. Nem terhel kreditet
 *  a munkatársnak — a munkatér írja magának (a dolláros keret véd). */
export async function peldakatIr(szervezetId: string): Promise<Peldak | null> {
  if (folyamatban.has(szervezetId)) return null;
  folyamatban.add(szervezetId);
  const sz = szolgaltato();
  const t0 = Date.now();
  try {
    const f = await forras(szervezetId);
    if (!f.vanProfil) return null;
    await keretEllenoriz(szervezetId);
    const v = await sz.hiv({
      feladat: "kep_peldak",
      rendszer: await prompt("kep_peldak", "hu", f.nyelv, f.tipus), // c30 F12
      szoveg: f.sorok.join("\n"),
      nyelv: f.nyelv,
      maxKiToken: 1200,
      idokorlatMs: 60_000,
    });
    await meresRogzit(szervezetId, v.meres);
    const valasz = JSON.parse(jsonRobusztusan(v.szoveg)) as unknown;
    const peldak = ellenoriz(valasz, f.nyelv, f.tipus === "fesztival");
    if (!peldak) return null;
    // c15: ugyanabból a válaszból a szakma; hiány / ismeretlen érték → "semleges" (a példák ettől még jók)
    // c30 F1: the confirmed category (if any) is used as is; the AI's pick only when the profile has none
    const adat = { ...peldak, kategoria: kepKategoria(f.megerositett, (valasz as Record<string, unknown>)["kategoria"]) };
    await szervezetKent(szervezetId, async (tx) => {
      await tx
        .insert(sema.kepPelda)
        .values({ szervezetId, nyelv: f.nyelv, ujj: f.ujj, adat })
        .onConflictDoUpdate({ target: sema.kepPelda.szervezetId, set: { nyelv: f.nyelv, ujj: f.ujj, adat, frissitve: new Date() } });
    });
    return peldak;
  } catch (hiba) {
    const kod = hiba instanceof AiHiba ? hiba.kod : "AI_NEM_ELERHETO";
    const meres: HivasMeres = { szolgaltato: sz.leirolap.azonosito, modell: sz.leirolap.modell, feladat: "kep_peldak", tokenek_be: 0, tokenek_ki: 0, becsult_usd: 0, ido_ms: Date.now() - t0, allapot: "hiba", hiba_kod: kod };
    await meresRogzit(szervezetId, meres).catch(() => undefined);
    console.error("[kep_peldak] sikertelen:", kod, hiba instanceof Error ? hiba.message : hiba);
    return null;
  } finally {
    folyamatban.delete(szervezetId);
  }
}

/** Háttérben: ha a példák hiányoznak vagy elavultak, megírja őket (nem várunk rá). */
export function peldakatFrissit(szervezetId: string): void {
  void peldakFrissen(szervezetId)
    .then((e) => (e.elavult ? peldakatIr(szervezetId) : null))
    .catch((h) => console.error("[kep_peldak] frissítés:", h));
}
