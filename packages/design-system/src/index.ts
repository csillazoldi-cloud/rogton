// @km/design-system — tokenek, származtatás, CSS-kibocsátás. ALAPTERV 7. pont:
// EGYETLEN tokenkészlet (a v6 tema-alap.json szerkezete, km-theme/2), komponensben nincs szín/betű/méret.
// A km-theme.js ellenőrző és származtató logikája itt él szerződésként (átemelve, nem másolva: TypeScript, zod).
import { z } from "zod";
import { type AlapTokenek } from "./tokenek";
export { AlapTokenek, TemaDefinicio } from "./tokenek";
export * from "./tema-szintek";
export * from "./nyelvek";
export * from "./feliratok";
export * from "./semak";
export * from "./modok";
export * from "./betuk";
import { MOD_SAJAT, R18_KOZOS, modFelulirasok, r18Mozgas, type Mod } from "./modok";
import { egyesit } from "./tema-szintek";

const px = (v: string) => parseInt(v, 10);
const kever = (szin: string, szazalek: number | string, alap = "transparent") => `color-mix(in srgb, ${szin} ${szazalek}%, ${alap})`;

/** Származtatott tokenek — kizárólag az alaptokenekből (km-theme.js derive(), 'ar' nyelvi ág nélkül: az még nem kell). */
export function szarmaztat(t: AlapTokenek): Record<string, string> {
  const a = t["--accent"], at = t["--accent-text"], txt = t["--text"];
  const ga = parseInt(t["--glass-alpha"] || "10", 10);
  const arny = kever(t["--shadow-color"], t["--shadow-strength"] || "45");
  const arnyLagy = kever(t["--shadow-color"], Math.round(parseInt(t["--shadow-strength"] || "45", 10) * 1.1));
  const fatyol = parseInt(t["--fatyol"] || "70", 10);
  const fatyolSzin = (arany: number) => kever(t["--bg"], Math.max(0, Math.min(100, Math.round(fatyol * arany))));
  const fotoHero = parseInt(t["--foto-hero"] || "55", 10);
  const fotoZaro = parseInt(t["--foto-zaro"] || "32", 10);
  const durs = t["--motion"] === "off" ? ["0.001s", "0.001s", "0.001s", "0.001s", "0.001s"]
    : t["--motion"] === "slow" ? ["0.35s", "0.8s", "30s", "1.2s", "4s"] : ["0.2s", "0.45s", "18s", "0.7s", "2.5s"];
  // R-7e (2026-09-13): arányos skála, alsó korlát 12,5px; az AI-eredet és a saját eredet nem figyelmeztetés és nem eredmény.
  const fsBase = px(t["--fs-base"]);
  const fsXs = Math.max(12.5, fsBase * 0.78);
  return {
    "--font-display-active": t["--font-display"], "--font-body-active": t["--font-body"], "--font-code-active": t["--font-code"],
    "--grad-primary": `linear-gradient(120deg,${t["--primary"]} 0%,${t["--primary-2"]} 100%)`, // R-12 A1 (2026-09-21): kék → világoskék; a korall (R-8 visszavont színvilága) kikerült — narancs csak figyelmeztetésre
    "--grad-headline": `linear-gradient(110deg,${at},${a})`,
    "--accent-tint-weak": kever(a, 9), "--accent-tint": kever(a, 16), "--accent-tint-mid": kever(a, 28),
    "--accent-border": kever(a, 75), "--accent-border-soft": kever(a, 45),
    "--focus-ring": kever(t["--focus"], 30),
    // R-8: a ragyogás teljes árnyék-érték; a régi szín-változat --glow-primary-color
    // R-10: effekt nélküli sémánál nincs ragyogás
    "--glow-primary-color": kever(t["--primary"], 40),
    "--glow-primary": parseInt(t["--aurora-opacity"] || "50", 10) === 0 ? "none" : `0 8px 28px ${kever(t["--primary-2"], 45)}`,
    "--glow-primary-strong": parseInt(t["--aurora-opacity"] || "50", 10) === 0 ? "none" : `0 12px 40px ${kever(t["--primary-2"], 60)}`,
    "--glow-warm": parseInt(t["--aurora-opacity"] || "50", 10) === 0 ? "none" : `0 0 14px ${kever(t["--accent-warm"], 30)}`,
    "--ok-strong": t["--ok"], "--ok-bg": kever(t["--ok"], 13),
    "--grad-ok": `linear-gradient(140deg,${t["--ok"]},${kever(t["--ok"], 60, t["--shadow-color"])})`, "--glow-ok": kever(t["--ok"], 45),
    "--err-strong": t["--err"], "--err-bg": kever(t["--err"], 10), "--err-border": kever(t["--err"], 30),
    "--err-btn-border": kever(t["--err"], 45), "--err-btn-bg": kever(t["--err"], 12),
    "--warn": at, "--warn-border": kever(at, 30), "--warn-bg": kever(a, 8),
    // F-5b (R-4): a „még nem működik" jelölés alapja és szaggatott kerete a --keszul-ból (11% / 34%, a rajz szerint)
    "--keszul-bg": kever(t["--keszul"], 11), "--keszul-border": kever(t["--keszul"], 34),
    // VZ-1 (tokenek.md): a kiférés-sáv sárga állapota („a gép lépett”) — tájékoztatás, nem figyelmeztetés
    "--illesztve-bg": kever(t["--illesztve"], 12), "--illesztve-border": kever(t["--illesztve"], 32),
    // VZ-2 (tokenek.md): a méretválasztó („Hová kerül?”) kiválasztott gombja — a --primary-ből
    "--valaszto-aktiv-bg": kever(t["--primary"], 10), "--valaszto-aktiv-border": t["--primary"],
    // R-7e (2026-09-13): a saját eredet nem eredmény, csak eredet — a --text-mut-ból, halk háttérrel.
    "--src-user": t["--text-mut"], "--src-user-bg": kever(txt, 7),
    "--src-web": t["--primary-2"], "--src-web-bg": kever(t["--primary-2"], 15),
    // R-7e (2026-09-13): az AI-eredet nem figyelmeztetés — a --primary-2-ből, halk háttérrel.
    "--src-ai": t["--primary-2"], "--src-ai-bg": kever(t["--primary-2"], 14),
    "--src-empty": t["--text-faint"], "--src-empty-bg": kever(txt, 7),
    "--selection": kever(t["--primary"], 40),
    "--blob1": kever(a, 32), "--blob2": kever(t["--primary"], 24), "--blob3": kever(t["--primary-2"], 14),
    "--aurora-1": kever(t["--primary"], t["--aurora-opacity"] || "50"), "--aurora-2": kever(t["--accent-warm"], t["--aurora-opacity"] || "50"), "--aurora-3": kever(t["--accent-gold"], Math.round(parseInt(t["--aurora-opacity"] || "50", 10) * 0.7)),
    "--orb-size-sm": `${Math.round(px(t["--orb-size"]) / 2)}px`,
    "--motion-rise": t["--motion"] === "off" ? "0.001s" : t["--motion"] === "slow" ? "1s" : "0.6s",
    // R-8: üvegszerű kártyák a fényudvar fölött
    "--surface": kever(txt, 3.5), "--surface-2": kever(txt, 7), "--border": kever(txt, 8), "--border-2": kever(txt, 16),
    "--glass-bg": `linear-gradient(160deg,${kever(txt, ga)},${kever(txt, Math.max(1, Math.round(ga * 0.35)))})`,
    "--glass-border": kever(txt, 16),
    "--line": kever(txt, 10), "--line-soft": kever(txt, 7), "--line-dash": kever(txt, 15), "--vaz-bg": kever(txt, 12), // VZ-1: a „készül” váz csíkjai
    "--field-bg": kever(txt, 5), "--field-border": kever(txt, 14),
    "--panel-soft": kever(txt, 2), "--panel-soft-2": kever(txt, 4),
    "--btn-ghost-bg": kever(txt, 5), "--btn-ghost-border": kever(txt, 14),
    "--btn-ghost-text": kever(txt, 85, t["--bg"]), "--btn-ghost-hover": kever(txt, 10),
    "--btn-disabled-bg": kever(txt, 8),
    // R-7e (2026-09-13): arányos skála, alsó korlát 12,5px; az AI-eredet és a saját eredet nem figyelmeztetés és nem eredmény.
    "--fs-h2": `${Math.round(fsBase * 1.625)}px`,
    "--fs-md": `${Math.round(fsBase * 0.9375)}px`,
    "--fs-sm": `${Math.round(fsBase * 0.875)}px`,
    "--fs-xs": `${Math.round(fsXs * 10) / 10}px`,
    "--control-min-s": `${px(t["--control-min"]) - 8}px`, // kis vezérlő (fejléc-gomb, nyelvváltó) — a v6-ban 40px a 48-hoz
    "--dur-fast": durs[0]!, "--dur-med": durs[1]!, "--dur-amb": durs[2]!, "--dur-spin": durs[3]!, "--dur-flow": durs[4]!,
    "--glass-shadow": `0 24px 80px ${arny}, inset 0 1px 0 ${kever(txt, 14)}`,
    "--shadow-pop": `0 12px 32px ${arnyLagy}`,
    "--header-bg": kever(t["--bg"], 90), "--sat-glass": `${t["--sat-glass"] || "150"}%`,
    // A nyitólap fotórétegei. A fátyol a HÁTTÉRSZÍNBŐL készül, öt sűrűségben; egyetlen csúszka
    // (--fatyol) mozgatja mind az ötöt, az arányok a rajzból valók (70 → 78/60/55/40/82).
    "--foto-hero": `${fotoHero}%`, "--foto-hero-sm": `${Math.round(fotoHero * 0.91)}%`,
    "--foto-zaro": `${fotoZaro}%`, "--foto-zaro-sm": `${Math.round(fotoZaro * 0.94)}%`,
    "--fatyol-teli": t["--bg"],
    "--fatyol-eros": fatyolSzin(1.11),
    "--fatyol-kozep": fatyolSzin(0.86),
    "--fatyol-halk": fatyolSzin(0.57),
    "--fatyol-zaro": fatyolSzin(0.79),
    "--fatyol-mobil": fatyolSzin(1.17),
    // E-50: a megerősítő sáv fátyla a Fiókok lapon — ugyanaz a csúszka mozgatja, mint a nyitólapét.
    "--fatyol-sav": fatyolSzin(1),
    // F-1: a régi hét térköz-token a skálából származik (szó szerinti var()-hivatkozás), plusz három új.
    "--gap": "var(--ter-6)",
    "--pad-card": "var(--ter-11)",
    "--pad-block": "var(--ter-9)",
    "--pad-field-y": "var(--ter-6)",
    "--pad-field-x": "var(--ter-7)",
    "--btn-pad-y": "var(--ter-6)",
    "--btn-pad-x": "var(--ter-10)",
    "--gap-tile": "var(--ter-7)",
    "--pad-tile": "var(--ter-8)",
    "--pad-row-y": "var(--ter-7)",
  };
}

/** Alap + származtatott tokenek együtt. */
export function teljesTokenek(t: AlapTokenek): Record<string, string> {
  return { ...t, ...szarmaztat(t) };
}

/** A :root CSS-blokk szövege — ezt teszi a befogadó alkalmazás a lap fejébe. Érték nem tartalmazhat '<'-t vagy '}'-t. */
export function cssValtozok(t: AlapTokenek): string {
  const sorok = Object.entries(teljesTokenek(t)).map(([k, v]) => `${k}:${String(v).replace(/[<}]/g, "")}`);
  return `:root{${sorok.join(";")}}`;
}

/** R-18: egy mód teljes tokenkészlete — a hatásos (szervezeti) készletre a mód kulcsai, plusz az R-18 saját tokenjei. */
export function modTokenek(hatasos: AlapTokenek, mod: Mod): Record<string, string> {
  const t = egyesit(hatasos, modFelulirasok(mod));
  const fenyudvar = Math.max(0, Math.min(100, parseInt(t["--aurora-opacity"] || "0", 10))) / 100;
  return { ...teljesTokenek(t), ...MOD_SAJAT[mod], "--aurora-atlatszo": String(fenyudvar) };
}

/**
 * R-18: a két mód CSS-blokkja a lap fejébe, a `km-tokenek` blokk UTÁN. A blokkok `:root[data-mod=…]` választót kapnak
 * (erősebb, mint a `:root`), így a nyilvános lapok közös-alap blokkja (KozosTema) sem írja felül a mód színeit. Csak az kerül bele,
 * ami eltér a hatásos készlettől — a többi a `km-tokenek` blokkból jön. Jelölés nélkül (a fej szkriptje nem futott) a sötét mód él.
 */
export function modCss(hatasos: AlapTokenek): string {
  const alap = teljesTokenek(hatasos);
  const blokk = (m: Mod) => Object.entries(modTokenek(hatasos, m))
    .filter(([k, v]) => alap[k] !== v)
    .map(([k, v]) => `${k}:${String(v).replace(/[<}]/g, "")}`)
    .join(";");
  const kozos = Object.entries({ ...R18_KOZOS, ...r18Mozgas(hatasos["--motion"]) }).map(([k, v]) => `${k}:${v}`).join(";");
  const sotet = blokk("sotet"), vilagos = blokk("vilagos");
  return `:root{${kozos}}:root[data-mod="sotet"],:root:not([data-mod]){${sotet};color-scheme:dark}:root[data-mod="vilagos"]{${vilagos};color-scheme:light}`;
}
