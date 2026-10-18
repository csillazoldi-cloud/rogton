// @rogton/design-system — az alaptokenek sémája (km-theme/2). ALAPTERV 7. pont:
// EGYETLEN tokenkészlet (a v6 tema-alap.json szerkezete, km-theme/2), komponensben nincs szín/betű/méret.
// A km-theme.js ellenőrző és származtató logikája itt él szerződésként (átemelve, nem másolva: TypeScript, zod).
import { z } from "zod";

const szin = z.string().regex(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-zA-Z]+)$/, "badColor");
const meret = (min: number, max: number) =>
  z.string().regex(/^-?\d+(\.\d+)?px$/, "badSize").refine((v) => { const n = parseFloat(v); return n >= min && n <= max; }, "outOfRange");
const szazalek = (min: number, max: number) => z.string().refine((v) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max; }, "badPercent");
const szam = (min: number, max: number) => z.string().refine((v) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max; }, "badNumber");
const betu = z.string().min(1).max(120).refine((v) => !v.includes("<"), "badChar");

/** Az alaptokenek sémája — pontosan a km-theme/2 SCHEMA. Ismeretlen kulcs: elutasítva (strict). */
export const AlapTokenek = z.object({
  "--bg": szin, "--bg-elev": szin,
  "--text": szin, "--text-mut": szin, "--text-dim": szin, "--text-faint": szin,
  "--on-primary": szin, "--primary": szin, "--primary-2": szin,
  "--accent": szin, "--accent-text": szin, "--accent-link": szin,
  "--ok": szin, "--err": szin, "--focus": szin, "--shadow-color": szin,
  "--shadow-strength": szazalek(0, 80),
  "--font-display": betu, "--font-body": betu, "--font-code": betu,
  "--font-display-arab": betu, "--font-body-arab": betu,
  "--fw-head": z.enum(["500", "600", "700", "800"]),
  "--fw-strong": z.enum(["500", "600", "700"]),
  "--fs-h1": meret(20, 56), "--fs-base": meret(12, 20), "--fs-title": meret(14, 24),
  // E-41 (nyitólap): a nyilvános főoldal saját méretei — a közös készlet része, a Theme-felületen állíthatók.
  "--fs-hero": meret(24, 80), "--fs-hero-sm": meret(20, 48), "--fs-szekcio": meret(16, 40), "--fs-zaro": meret(18, 48),
  "--r-card": meret(0, 999), "--r-block": meret(0, 999), "--r-btn": meret(0, 999), "--r-field": meret(0, 999), "--r-badge": meret(0, 999),
  "--bw": meret(0, 4),
  // F-1: a térköz-skála — tizenöt fok, a régi hét térköz-token ezekből származik (lásd szarmaztat()).
  "--ter-0": z.literal("0px"),
  "--ter-1": meret(0, 8), "--ter-2": meret(0, 12), "--ter-3": meret(0, 16), "--ter-4": meret(0, 20),
  "--ter-5": meret(0, 24), "--ter-6": meret(0, 28), "--ter-7": meret(0, 32), "--ter-8": meret(0, 40),
  "--ter-9": meret(0, 48), "--ter-10": meret(0, 64), "--ter-11": meret(0, 80), "--ter-12": meret(0, 112),
  "--ter-13": meret(0, 160), "--ter-14": meret(0, 160),
  "--control-min": meret(32, 64),
  // F-2 (R-1 tokenek.md 3.): a csemperács egy hasábjának minimális szélessége — ez dönti el, hol tör sorba a rács (390-en egy, 1440-en három hasáb);
  // és a csempék mérőszáma (új találatok, összeg, fiókszám) — a h1 (34) és a h2 (24) közé esik. Mindkettő méret, nem térköz, ezért nem a skálából jön.
  "--tile-min": meret(200, 520), "--fs-metric": meret(18, 48),
  // R-7e: egységes tartalomszélesség — űrlap · lista.
  "--urlap-max": meret(640, 720), "--lista-max": meret(1100, 1200),
  // F-5b (R-4 tokenek.md): a „még nem működik" jelölés színe (nem hibaszín), az olvasatlan pont/harang színe, a kapcsoló mérete (kapcsoló-komponens eddig nem volt).
  "--keszul": szin, "--olvasatlan": szin, "--illesztve": szin, "--kapcsolo-w": meret(28, 64), "--kapcsolo-h": meret(16, 36),
  "--blur-glass": meret(0, 60), "--glass-alpha": szazalek(0, 30),
  "--motion": z.enum(["normal", "slow", "off"]),
  "--lh": szam(1.1, 2.2),
  "--sat-glass": szazalek(50, 300),
  // A nyitólap fotórétegei: mennyire látszik a fotó, és mennyire sűrű a rá kerülő sötét fátyol.
  "--foto-hero": szazalek(0, 100), "--foto-zaro": szazalek(0, 100), "--fatyol": szazalek(0, 100),
  // R-8 (2026-09-15, a terméktulajdonos): meleg korall kiemelő (a gradiens vége, az AI-korong, a „fontos" jelzés), arany az „érdekes"-hez,
  // a fényudvar erőssége (0 = nincs), az AI-korong mérete.
  "--accent-warm": szin, "--accent-gold": szin,
  "--aurora-opacity": szazalek(0, 70),
  "--orb-size": meret(44, 120),
}).strict();
export type AlapTokenek = z.infer<typeof AlapTokenek>;

/** Egy témadefiníció — ahogy a tema-alap.json és az adatbázis tárolja. */
export const TemaDefinicio = z.object({
  $schema: z.literal("km-theme/2"),
  name: z.string().min(1).max(80),
  tokens: AlapTokenek,
});
export type TemaDefinicio = z.infer<typeof TemaDefinicio>;
