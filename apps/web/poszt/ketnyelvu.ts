// c30 F3 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §5; docs/decisions/2026-10-17-c30-f3-ketnyelvu-poszt.md): "both languages in one
// post" (`egyben`). Pure rules — no database, no network; the server (poszt/index.ts) and the Posztszöveg page (app/poszt) both use them.
// The two halves stay two ordinary cells (felulet × nyelv) in `szovegek[]`: the joined post is a VIEW and a COPY, never stored, so
// switching the mode can never lose or merge text (D1, plan §5).
import type { PosztFelulet, PosztSzoveg } from "@rogton/contracts";
import { KARAKTERHATAR } from "./bemenet";

/** The separator line between the two halves (D1: no flags — politically loaded in Transylvania). */
export const KETNYELVU_ELVALASZTO = "———";
const KOZ = "\n\n";

/** A text's trailing hashtag block (the last paragraph made only of #tags) split off: the body and the tags. */
export function hashtagVeg(szoveg: string): { torzs: string; hashtagek: string[] } {
  const t = szoveg.replace(/\s+$/u, "");
  const bekezdesek = t.split(/\n\s*\n/u);
  const utolso = (bekezdesek[bekezdesek.length - 1] ?? "").trim();
  const szavak = utolso.split(/\s+/u).filter(Boolean);
  if (bekezdesek.length < 2 || szavak.length === 0 || !szavak.every((s) => /^#[\p{L}\p{N}_]+$/u.test(s))) return { torzs: t, hashtagek: [] };
  return { torzs: bekezdesek.slice(0, -1).join(KOZ).replace(/\s+$/u, ""), hashtagek: szavak };
}

/** The hashtags of both halves, once each (case-insensitive), first half first. */
export function kozosHashtagek(a: string, b: string): string[] {
  const ki: string[] = [];
  const latott = new Set<string>();
  for (const h of [...hashtagVeg(a).hashtagek, ...hashtagVeg(b).hashtagek]) {
    const k = h.toLocaleLowerCase("hu");
    if (!latott.has(k)) { latott.add(k); ki.push(h); }
  }
  return ki;
}

/**
 * D1: the joined post = the first-language text, the separator, the second-language text, then the hashtags ONCE at the end.
 * `a` is the first language of `nyelvek`, `b` the second (the caller passes them in that order — a RO-first org gets RO first).
 * An empty half is left out (with its separator), so a half-written post never shows a dangling "———".
 */
export function ketnyelvuOsszefuz(a: string, b: string): string {
  const ta = hashtagVeg(a).torzs.trim();
  const tb = hashtagVeg(b).torzs.trim();
  const tagek = kozosHashtagek(a, b);
  const resz = [ta, tb].filter(Boolean).join(`${KOZ}${KETNYELVU_ELVALASZTO}${KOZ}`);
  return tagek.length ? `${resz}${KOZ}${tagek.join(" ")}` : resz;
}

/** A hashtag allowance assumed when budgeting before the hashtags are known (≈ 5–6 tags). */
export const HASHTAG_KERET = 90;

/** Budget per half (plan §5): floor((limit − separator − hashtags) / 2). IG → 1050, LI → 1450. Blog has no joined post (null). */
export function ketnyelvuKeret(felulet: PosztFelulet): number | null {
  if (felulet === "blog") return null;
  const elvalaszto = `${KOZ}${KETNYELVU_ELVALASZTO}${KOZ}`.length + KOZ.length;
  return Math.floor((KARAKTERHATAR[felulet] - elvalaszto - HASHTAG_KERET) / 2);
}

/** Is the joined post over the platform's own limit? (Then the machine is asked ONCE to shorten — never a silent cut.) */
export function tulHosszu(felulet: PosztFelulet, a: string, b: string): boolean {
  return felulet !== "blog" && ketnyelvuOsszefuz(a, b).length > KARAKTERHATAR[felulet];
}

type Cella = Pick<PosztSzoveg, "szoveg" | "javaslat" | "allapot" | "elavult_forditas">;

/** A half is the person's own when it was edited or finalised, or its text differs from the machine's last proposal. */
export function emberiResz(c: Cella | null | undefined): boolean {
  if (!c || !c.szoveg.trim()) return false;
  return c.allapot !== "javaslat" || c.szoveg.trim() !== c.javaslat.trim();
}

/**
 * What „Kész, másolom" does with the second half first (plan §5 Editing):
 *  - "ir":      missing → the machine writes it (translation of the first half), visibly ("Írjuk…"), then copies;
 *  - "frissit": the first half changed and the second is still untouched machine text → refreshed the same way, then copied;
 *  - "jelez":   the first half changed but a PERSON edited the second → never overwritten: the quiet line + "Frissítem a …t";
 *  - "kesz":    nothing to do.
 */
export function masodikTeendo(b: Cella | null | undefined): "ir" | "frissit" | "jelez" | "kesz" {
  if (!b || !b.szoveg.trim()) return "ir";
  if (!b.elavult_forditas) return "kesz";
  return emberiResz(b) ? "jelez" : "frissit";
}

/** The joined view applies only to these surfaces (blog stays separate per language: a website has language versions). */
export function ketnyelvuFelulet(felulet: PosztFelulet): boolean {
  return felulet !== "blog";
}

/** The trailing hashtag line exactly as the machine appends it ("\n\n#a #b"), for editing: the body keeps its own trailing spaces. */
const VEG_TAGEK = /\n\n(#[\p{L}\p{N}_]+(?: #[\p{L}\p{N}_]+)*)\s*$/u;

/** What the half's text field shows: the text without its trailing hashtag line (the hashtags are shown once, under both halves). */
export function mezoTorzs(teljes: string): string {
  const m = VEG_TAGEK.exec(teljes);
  return m ? teljes.slice(0, m.index) : teljes;
}

/** The half's full cell text after an edit of its body: the edited body + the half's own hashtag line, unchanged. */
export function mezoOsszerak(ujTorzs: string, regiTeljes: string): string {
  const m = VEG_TAGEK.exec(regiTeljes);
  return m ? `${ujTorzs}\n\n${m[1]}` : ujTorzs;
}

/** D15: the call-to-action INTENT the machine uses in `egyben` when the person has not given one (an intent, not a sentence — the
 *  machine writes it in the post's own voice into the first half, and the translation carries it into the second). */
export function alapCta(honlap: string): string {
  return honlap ? `rövid, a témához illő felhívás; ha illik, a honlapra (${honlap})` : "rövid, a témához illő felhívás (pl. gyere el, nézz be, írj nekünk)";
}
