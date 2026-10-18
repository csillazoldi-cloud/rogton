// R-18 arculatfrissítés (2026-10-11, Csilla): a termék két módja — sötét („Éjszaka”, tema-sotet.json) és világos („Papír”,
// tema-vilagos.json). A felhasználó a fejléc váltójával választ; első látogatáskor a készülék beállítása dönt (prefers-color-scheme).
// A választás a böngészőben marad (localStorage `km-mod`), szerverre nem kerül. A mód a <html data-mod="sotet|vilagos"> jelölésből
// dolgozik: a lap feje (layout) a modCss() blokkjait teszi ki a hatásos (szervezeti) tokenkészlet UTÁN, magasabb specificitással,
// így a mód kulcsai (színek, betűk, lekerekítés, üveg, fényudvar) mindig a jóváhagyott rajz értékei — „egyetlen lila: #4b09d8”.
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
  sotet: {
    "--uveg-bg": "rgba(255,255,255,0.05)",
    "--uveg-tomor": "#151515",
    "--uveg-el": "rgba(255,255,255,0.09)",
    "--uveg-feny": "rgba(255,255,255,0.10)",
    "--uveg-arnyek": "0 10px 30px -12px rgba(0,0,0,0.6)",
    "--sav-bg": "rgba(10,10,10,0.62)",
    "--aur-1": "#4b09d8",
    "--aur-2": "#4b09d8",
    "--aur-3": "#eb5928",
    "--halvany": "0.13",
    // 2. kör (Csilla 10-11, „nem lüktet”): a légzés látható íve és sötétben erősebb lila — a réteg 0,55 × 1,6 ≈ 0,88
    "--aurora-szorzo": "1.6",
    "--aur-min": "0.25",
    "--aur-max": "0.9",
    "--btn-edge": "rgba(255,255,255,0.24)",
    "--btn-shadow": "rgba(0,0,0,0.55)",
    "--hover-edge": "rgba(255,255,255,0.28)",
    "--glow": "rgba(75,9,216,0.35)",
    "--fatyol-menu": "rgba(0,0,0,0.42)",
    // egyetlen lila: sötét lapon lila SZÖVEG nincs (IRANYOK.md one-purple rule) — az AI/web eredet jele halk szürke, lila alappal
    "--src-web": "#b3b3b3",
    "--src-ai": "#b3b3b3",
    "--src-web-bg": "rgba(75,9,216,0.22)",
    "--src-ai-bg": "rgba(75,9,216,0.22)",
  },
  vilagos: {
    "--uveg-bg": "rgba(255,255,255,0.58)",
    "--uveg-tomor": "#f6f5f1",
    "--uveg-el": "rgba(17,17,17,0.08)",
    "--uveg-feny": "rgba(255,255,255,0.85)",
    "--uveg-arnyek": "0 10px 30px -14px rgba(42,36,24,0.25)",
    "--sav-bg": "rgba(236,234,229,0.66)",
    "--aur-1": "rgba(75,9,216,0.42)",
    "--aur-2": "rgba(75,9,216,0.22)",
    "--aur-3": "#ffb894",
    "--halvany": "0.14",
    // világosban finomabban: a réteg 0,70 × 1,1 ≈ 0,77, az ív 0,35 → 0,8
    "--aurora-szorzo": "1.1",
    "--aur-min": "0.35",
    "--aur-max": "0.8",
    "--btn-edge": "transparent",
    "--btn-shadow": "rgba(42,36,24,0.28)",
    "--hover-edge": "rgba(75,9,216,0.40)",
    "--glow": "rgba(75,9,216,0.35)",
    "--fatyol-menu": "rgba(40,32,20,0.24)",
  },
};

/** Mindkét módban azonos R-18 tokenek: az aitmetica.ro betűrendje (IRANYOK-round4.md), a fejléc méretei, a mozgás. */
export const R18_KOZOS: Readonly<Record<string, string>> = {
  "--fs-ui": "13px", // JetBrains Mono 500: felső menü, menüsorok, gombok, cselekvő linkek
  "--fw-ui": "500",
  "--fs-gomb": "14px", // fő gomb
  "--fs-ui-kicsi": "11.5px", // telefonos csempék, számjelvény
  "--fs-cimke": "12px", // csoportcímek, „Készül a kép”
  "--ls-h1": "-0.028em", // aitmetica.ro h1 88px/−2.46px
  "--ls-h2": "-0.018em", // aitmetica.ro h2 44px/−0.79px
  "--jel-h": "22px", // az a/t jel magassága a felső sávban (asztal)
  "--jel-h-tel": "16px", // … telefonon
  "--cap-ratio": "0.734", // Inter Tight 700 nagybetű-magasság (mérve, IRANYOK-round4.md)
  // Csilla 10-11: „POSZTGYÁR should be about 20% smaller than now” — a rajz mérete (jel / 0,734) × 0,8
  "--nev-arany": "0.8",
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
