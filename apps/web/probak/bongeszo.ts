// Böngészős próbák közös indítója (G8/G9): a playwright-core a tools/kepernyokep alól (az apps/web nem függ tőle — így a
// csomaglista és a Docker-kép változatlan), a böngésző a gépen lévő Chromium (BONGESZO_UT). Ha bármelyik hiányzik, a hívó
// próba kimarad (VAN_BONGESZO). A típusok szándékosan szűkek: csak amit a próbák használnak.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

export type Valasz = { url(): string; status(): number };
export type Lokator = { count(): Promise<number>; first(): Lokator; last(): Lokator; click(): Promise<void>; fill(s: string): Promise<void>; press(k: string): Promise<void> };
export type Lap = {
  goto(u: string): Promise<Valasz | null>;
  on(e: "response", f: (r: Valasz) => void): void;
  waitForLoadState(s: "load" | "networkidle"): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  locator(s: string): Lokator;
  evaluate<T, A>(f: (a: A) => T | Promise<T>, a: A): Promise<T>;
  screenshot(o: { path: string; fullPage?: boolean }): Promise<unknown>;
  url(): string;
};
export type Ktx = {
  newPage(): Promise<Lap>;
  request: { get(u: string): Promise<{ text(): Promise<string> }> };
  cookies(): Promise<{ name: string; value: string; httpOnly: boolean; secure: boolean; sameSite: string; expires: number }[]>;
  close(): Promise<void>;
};
export type Bongeszo = { newContext(o: Record<string, unknown>): Promise<Ktx>; close(): Promise<void> };

export const BONGESZO_UT = process.env.BONGESZO_UT ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PW_UT = new URL("../../../tools/kepernyokep/node_modules/playwright-core/index.js", import.meta.url).pathname;
export const VAN_BONGESZO = existsSync(BONGESZO_UT) && existsSync(PW_UT);

export async function bongeszoIndit(): Promise<Bongeszo> {
  const pw = createRequire(import.meta.url)(PW_UT) as { chromium: { launch(o: { executablePath: string }): Promise<Bongeszo> } };
  return pw.chromium.launch({ executablePath: BONGESZO_UT });
}
