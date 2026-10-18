// Fiókonkénti hírszűrés (R-13, 2026-09-22 — Vilmos: „egyénenként minden”, a gép egyszer olvas, a költség megoszlik).
// A gép egy cikket EGYSZER olvas el; a tényeiből (és az előszűrő tényeiből) a PROGRAM dönt tagonként, a tag fokozata
// és előszűrés-kapcsolója szerint. Tiszta szabályok: nincs tárolás, nincs AI.
import { z } from "zod";
import type { Ertekeles, Fontossag, Talalat } from "./talalat";
import type { EloTenyek } from "./elo-tenyek";

/** A három fokozat (Vilmos): nagyon szigorú = hely + fő téma · közepes = fő téma · laza = fő vagy érdemben érintett téma. */
export const SzuresFokozat = z.enum(["nagyon_szigoru", "kozepes", "laza"]);
export type SzuresFokozat = z.infer<typeof SzuresFokozat>;

export const TagSzures = z.object({
  fiok_id: z.string().min(1),
  fokozat: SzuresFokozat,
  /** Bekapcsolva a szólista és a címek szűrnek; kikapcsolva a gép minden friss hírt elolvas neki. */
  eloszures: z.boolean(),
});
export type TagSzures = z.infer<typeof TagSzures>;

/** Aki nem állított semmit: a mai viselkedés. */
export const ALAP_SZURES: Omit<TagSzures, "fiok_id"> = { fokozat: "nagyon_szigoru", eloszures: true };

/** Az azonos beállítású tagok ugyanazt látják — pl. az összkép ezzel a kulccsal tárolható. */
export function szuroKulcs(sz: Pick<TagSzures, "fokozat" | "eloszures">): string {
  return `${sz.fokozat}|${sz.eloszures ? "be" : "ki"}`;
}

export { EloTenyek } from "./elo-tenyek";

/** A szólista része: átmegy-e ennek a tagnak (a cím nélkül). */
function szolistaAtmegy(s: NonNullable<EloTenyek["szolista"]>, fokozat: SzuresFokozat): boolean {
  if (s.nev) return true;
  return fokozat === "nagyon_szigoru" ? s.hely && s.tema : s.tema;
}

/** Átmegy-e a cikk ennek a tagnak az előszűrőjén. Kikapcsolt előszűrésnél és hiányzó tényeknél: igen. */
export function eloAtmegy(elo: EloTenyek | null | undefined, sz: Pick<TagSzures, "fokozat" | "eloszures">): boolean {
  if (!sz.eloszures || !elo) return true;
  if (elo.szolista && !szolistaAtmegy(elo.szolista, sz.fokozat)) return false;
  if (elo.cim === "nem") return false;
  if (elo.cim === "erinti" && sz.fokozat !== "laza") return false;
  return true;
}

/** Kinek kell elolvasni a cikket (akinek az előszűrőjén átmegy) — ők osztoznak az olvasás kreditjén. */
export function kinekKell(elo: EloTenyek | null | undefined, tagok: TagSzures[]): TagSzures[] {
  return tagok.filter((sz) => eloAtmegy(elo, sz));
}

/**
 * A teljes olvasás tényeiből a tag fokozata szerinti fontosság. A tárolt `fontossag` a LEGENGEDÉKENYEBB fokozaté
 * (a modell így adja, v12); a szigorúbb fokozatok ebből lefelé vágnak. Régi (v12 előtti) értékelésnél — nincs
 * `hely_ok` — a tárolt fontosság marad.
 */
export function fokozatSzerint(e: Ertekeles, fokozat: SzuresFokozat): Fontossag {
  if (e.fontossag === "hatter") return "hatter";
  if (e.rola_szol === true) return e.fontossag;
  if (e.hely_ok === undefined) return e.fontossag;
  const fo = (e.fo_tema ?? "") !== "";
  const erint = (e.erintett_tema ?? "") !== "";
  switch (fokozat) {
    case "laza": return fo || erint ? e.fontossag : "hatter";
    case "kozepes": return fo ? e.fontossag : "hatter";
    case "nagyon_szigoru": return fo && e.hely_ok ? e.fontossag : "hatter";
  }
}

/**
 * A találat a néző szemével: a fontosság a néző fokozata és előszűrője szerint. Csak OLVASÁSRA — a visszaadott
 * találatot soha nem szabad visszamenteni (a tárolt tények a legengedékenyebb fokozatéi).
 */
export function nezoSzerint(t: Talalat, sz: Pick<TagSzures, "fokozat" | "eloszures"> | null | undefined): Talalat {
  if (!sz || !t.ertekeles || t.ertekeles_allapot !== "kesz") return t;
  const e = t.ertekeles;
  let f: Fontossag;
  if (e.kiszurve === "szolista" || e.kiszurve === "cim") f = "hatter"; // senkinek nem kellett — a gép el sem olvasta
  else if (!eloAtmegy(e.elo, sz)) f = "hatter";
  else f = fokozatSzerint(e, sz.fokozat);
  return f === e.fontossag ? t : { ...t, ertekeles: { ...e, fontossag: f } };
}
