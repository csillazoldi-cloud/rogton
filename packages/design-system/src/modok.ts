// R-18 arculatfrissítés (2026-10-11, a megrendelő): a termék két módja — sötét („Éjszaka”, tema-sotet.json) és világos („Papír”,
// tema-vilagos.json). A felhasználó a fejléc váltójával választ; első látogatáskor a készülék beállítása dönt (prefers-color-scheme).
// A választás a böngészőben marad (localStorage `km-mod`), szerverre nem kerül. A mód a <html data-mod="sotet|vilagos"> jelölésből
// dolgozik: a lap feje (layout) a modCss() blokkjait teszi ki a hatásos (szervezeti) tokenkészlet UTÁN, magasabb specificitással,
// így a mód kulcsai (színek, betűk, lekerekítés, üveg, fényudvar) mindig a jóváhagyott értékek. G5 (Rögtön): tinta / neonzöld #D0FF2C /
// narancs #FF4501, Saira Condensed + Saira; alapból SÖTÉT (a készülék beállítása nem dönt, csak a felhasználó választása).
// Ami nem mód-kulcs (betűméret, térköz-skála, vezérlőméret), az továbbra is a szervezet témájából jön.
// Döntés: docs/decisions/2026-10-11-r18-arculatfrissites.md · rajz: design/R18-arculatfrissites/ (IRANYOK.md, IRANYOK-round4.md).
import alapJson from "./tema-alap.json";
import sotetJson from "./tema-sotet.json";
import vilagosJson from "./tema-vilagos.json";
import { AlapTokenek } from "./tokenek";
import { TOKEN_KULCSOK, type TemaFelulirasok } from "./tema-szintek";

export const MODOK = ["sotet", "vilagos"] as const;
export type Mod = (typeof MODOK)[number];
/** A böngésző tárolójának kulcsa (IRANYOK.md: „localStorage key km-mod = sotet/vilagos”). */
export const MOD_TAROLO = "km-mod";
/** Ennyi ideig van a gyökéren a `.mod-valt` osztály, amíg a színek átúsznak (IRANYOK.md: 250 ms). */
export const MOD_VALTAS_MS = 250;

const ALAP = AlapTokenek.parse((alapJson as { tokens: unknown }).tokens);
const MOD_TEMAK: Record<Mod, AlapTokenek> = {
  sotet: AlapTokenek.parse((sotetJson as { tokens: unknown }).tokens),
  vilagos: AlapTokenek.parse((vilagosJson as { tokens: unknown }).tokens),
};

/** A mód kulcsai: amit bármelyik mód a közös alaphoz képest megváltoztat (színek, betűcsaládok, lekerekítés, üveg, fényudvar). */
export const MOD_KULCSOK: readonly (keyof AlapTokenek)[] = TOKEN_KULCSOK.filter((k) => MODOK.some((m) => MOD_TEMAK[m][k] !== ALAP[k]));

/** Egy mód felülírásai — csak a mód kulcsai, a jóváhagyott rajz értékeivel. */
export function modFelulirasok(mod: Mod): TemaFelulirasok {
  const ki: Record<string, string> = {};
  for (const k of MOD_KULCSOK) ki[k] = MOD_TEMAK[mod][k];
  return ki as TemaFelulirasok;
}

/**
 * Az R-18 saját tokenjei módonként (a km-theme/2 készleten kívül: nem állíthatók a Theme-felületen, a rajz értékei).
 * Üveg CSAK a sávokon és menükön; a kártyák és gombok tömör lapok. Forrás: design/R18-arculatfrissites/tema-r3-referencia.css,
 * IRANYOK.md „Revised values (round 2 → round 3)”.
 */
export const MOD_SAJAT: Record<Mod, Record<string, string>> = {
  // G5 (Rögtön, 2026-10-18): tinta / neonzöld / narancs. A fényudvar halk (neon + narancs, alacsony fedéssel); a „lila” helyett neon.
  sotet: {
    "--uveg-bg": "rgba(255,255,255,0.04)",
    "--uveg-tomor": "#141414",
    "--uveg-el": "rgba(255,255,255,0.10)",
    "--uveg-feny": "rgba(255,255,255,0.08)",
    "--uveg-arnyek": "0 10px 30px -12px rgba(0,0,0,0.7)",
    "--sav-bg": "rgba(10,10,10,0.78)",
    "--aur-1": "rgba(208,255,44,0.55)",
    "--aur-2": "rgba(208,255,44,0.30)",
    "--aur-3": "rgba(255,69,1,0.45)",
    "--halvany": "0.13",
    "--aurora-szorzo": "1",
    "--aur-min": "0.15",
    "--aur-max": "0.45",
    "--btn-edge": "rgba(255,255,255,0.22)",
    "--btn-shadow": "rgba(0,0,0,0.6)",
    "--hover-edge": "rgba(255,69,1,0.75)",
    "--glow": "rgba(208,255,44,0.30)",
    "--fatyol-menu": "rgba(0,0,0,0.5)",
    // az AI/web eredet jele halk szürke szöveg, neon alappal (a neon itt csak felület)
    "--src-web": "#c4c4c4",
    "--src-ai": "#c4c4c4",
    "--src-web-bg": "rgba(208,255,44,0.14)",
    "--src-ai-bg": "rgba(208,255,44,0.14)",
    // a » jel színe (Marka.tsx) és a narancs / neon kitöltésen álló szöveg színe (mindig tinta)
    "--marka-jel": "#d0ff2c",
    "--on-accent": "#0a0a0a",
  },
  vilagos: {
    "--uveg-bg": "rgba(255,255,255,0.72)",
    "--uveg-tomor": "#ffffff",
    "--uveg-el": "rgba(10,10,10,0.10)",
    "--uveg-feny": "rgba(255,255,255,0.9)",
    "--uveg-arnyek": "0 10px 30px -14px rgba(10,10,10,0.22)",
    "--sav-bg": "rgba(255,255,255,0.78)",
    "--aur-1": "rgba(208,255,44,0.45)",
    "--aur-2": "rgba(208,255,44,0.25)",
    "--aur-3": "rgba(255,69,1,0.18)",
    "--halvany": "0.14",
    "--aurora-szorzo": "1",
    "--aur-min": "0.2",
    "--aur-max": "0.55",
    "--btn-edge": "transparent",
    "--btn-shadow": "rgba(10,10,10,0.25)",
    "--hover-edge": "rgba(255,69,1,0.8)",
    "--glow": "rgba(10,10,10,0.18)",
    "--fatyol-menu": "rgba(10,10,10,0.24)",
    "--marka-jel": "#0a0a0a",
    "--on-accent": "#0a0a0a",
  },
};

/** Mindkét módban azonos R-18 tokenek: az a referencia-oldal betűrendje (IRANYOK-round4.md), a fejléc méretei, a mozgás. */
export const R18_KOZOS: Readonly<Record<string, string>> = {
  "--fs-ui": "15px", // G5b: Saira Condensed 500 (volt JetBrains Mono 13px): felső menü, menüsorok, gombok, cselekvő linkek
  "--fw-ui": "600", // G5b: Saira Condensed 600 (500 nincs kiszolgálva)
  "--fs-gomb": "16px", // fő gomb (G5b: a sűrített betűhöz nagyobb)
  "--fs-ui-kicsi": "13px", // telefonos csempék, számjelvény
  "--fs-cimke": "13px", // csoportcímek, „Készül a kép”
  // G5b: a valódi kód / azonosító helyek betűje (téma-kulcsok, színkódok, feliratkulcsok, nyelvkódok, URL-mező) — a többi UI-szöveg Saira Condensed
  "--font-mono": "'JetBrains Mono',monospace",
  "--ls-h1": "0em", // G5: Saira Condensed — a sűrített betű nem kér szorosabb betűközt
  "--ls-h2": "0.005em",
  "--jel-h": "20px", // G5: a » jel (= a név nagybetűinek) magassága a felső sávban (asztal)
  "--jel-h-tel": "17px", // … telefonon
  "--cap-ratio": "0.688", // G5: Saira Condensed nagybetű-magasság / em (mérve a betűfájlból: 688/1000)
  // a megrendelő 10-11: „A TERMÉKNÉV should be about 20% smaller than now” — a rajz mérete (jel / 0,734) × 0,8
  "--nev-arany": "0.8",
  // G5: a logó SVG magassága a nagybetű-magasság (= a » jel) többszöröse — a rajz 104 egység magas, a nagybetű 74 (Marka.tsx)
  "--marka-arany": "1.405",
  "--sav-h": "72px",
  "--sav-h-tel": "60px",
  "--menu-w": "248px",
  "--lap-w": "300px",
  "--hl-w": "110px",
  "--hl-h": "16px",
  "--hl-w-tel": "96px",
  "--hl-h-tel": "14px",
  "--szam-h": "18px",
  "--e-out": "cubic-bezier(0.2, 0.8, 0.2, 1)",
  "--e-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "--kapcsolo-gomb": "#ffffff",
  "--keszul-reteg": "rgba(20,14,10,0.62)",
  "--gomb-feny": "rgba(255,255,255,0.08)",
};

/** A mozgás tartamai a `--motion` token szerint (normal / slow / off) — a meglévő --dur-* mintájára. */
export function r18Mozgas(motion: string): Record<string, string> {
  const s = motion === "off" ? 0 : motion === "slow" ? 1.6 : 1;
  const ms = (n: number) => `${Math.max(1, Math.round(n * s))}ms`;
  return { "--t-fast": ms(180), "--t-press": ms(90), "--t-release": ms(320), "--t-enter": ms(480), "--t-mode": ms(MOD_VALTAS_MS), "--t-menu": ms(240), "--t-lap": ms(320) };
}
