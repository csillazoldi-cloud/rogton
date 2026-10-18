# Feladat — ÉPÍTŐ (E-7): Anthropic-csatlakozó és biztonságos weboldal-letöltő

TypeScript 7 strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Node 24
(beépített `fetch`, `node:dns/promises`, `node:net`). Nincs külső csomag. Mellékelve a `@km/ai-adapters` csomag
`index.ts`-e (a `Szolgaltato`, `HivasKeres`, `HivasValasz`, `HivasMeres`, `AiHiba`, `koltseg`, `idokorlattal` felülete).

## 1. `packages/ai-adapters/src/anthropic.ts`
```ts
export const anthropicSzolgaltato: Szolgaltato;  // a leírólap + hiv()
```
- Leírólap: azonosito "anthropic", nev "Anthropic (Claude)", hol "felho", orszag "USA", nyelvek ["hu","ro","en"],
  modell = `process.env["AI_MODELL"] ?? "claude-sonnet-5"`, árak a modell szerint (USD / 1M token, be/ki):
  `claude-sonnet-5` 2 / 10 · `claude-haiku-4-5-20251001` 1 / 5 · `claude-opus-5` 5 / 25 · ismeretlen modell: 5 / 25 (felső becslés).
  feladatok: ["osszefoglalo"].
- `hiv(keres)`: kulcs `process.env["ANTHROPIC_API_KEY"]`; ha nincs → `throw new AiHiba("AI_NINCS_KULCS")`.
  `POST https://api.anthropic.com/v1/messages`, fejlécek: `x-api-key`, `anthropic-version: 2023-06-01`,
  `content-type: application/json`; törzs: `{ model, max_tokens: keres.maxKiToken ?? 400, system: keres.rendszer,
  messages: [{ role: "user", content: keres.szoveg }] }`. Időkorlát: `idokorlattal(keres.idokorlatMs ?? 30000, keres.jel, …)`.
  Válasz: `content[0].text` (ha nincs szöveg → `AiHiba("AI_ROSSZ_VALASZ")`), `usage.input_tokens/output_tokens` →
  `HivasMeres` (`becsult_usd` a `koltseg`-gel, `ido_ms` mérve). HTTP 429/5xx/hálózati hiba → `AiHiba("AI_NEM_ELERHETO")`
  (a válasz státuszával az üzenetben, a kulcs SOHA nem kerül naplóba/hibába). Egy újrapróbálás 429/5xx-nél, 1 s után.
  A JSON-t `unknown`-ként olvasd és ellenőrizd (nincs `any`).

## 2. `apps/web/onboarding/letolto.ts` — a megadott weboldal szövegének letöltése, BIZTONSÁGOSAN
(ALAPTERV 8.: „a letöltő csak nyilvános címeket érhet el, átirányítás után is ellenőrizve, mérettel és időkorláttal";
a NAS és a Dell egy belső hálózaton van — a belső címek elérése tilos.)
```ts
import "server-only";
export type LetoltesHibaKod = "FORRAS_ROSSZ_CIM" | "FORRAS_TILTOTT_CIM" | "FORRAS_NEM_ELERHETO" | "FORRAS_TUL_NAGY" | "FORRAS_NEM_SZOVEG";
export class LetoltesHiba extends Error { constructor(public readonly kod: LetoltesHibaKod, uzenet?: string) }
export function cimNormalizal(be: string): URL;          // "mintamuhely.hu" → https://mintamuhely.hu/ ; csak http/https; hibás → FORRAS_ROSSZ_CIM
export async function nyilvanosCim(url: URL): Promise<void>; // DNS-feloldás (node:dns/promises lookup, all: true); ha BÁRMELYIK cím
   // privát/loopback/link-local/multicast/IPv6 ULA/egyedi-lokális, vagy a hosztnév "localhost"/".local"/".internal"/számmal írt
   // privát cím → FORRAS_TILTOTT_CIM. Tiltott IPv4: 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, 0/8, 100.64/10, 224/4, 240/4;
   // IPv6: ::1, fc00::/7, fe80::/10, ::ffff:<tiltott IPv4>.
export async function weboldalSzoveg(be: string, opciok?: { idokorlatMs?: number; maxBajt?: number; maxAtiranyitas?: number })
  : Promise<{ vegsoCim: string; cim: string; szoveg: string }>;
```
- `weboldalSzoveg`: normalizál → `nyilvanosCim` → `fetch(url, { redirect: "manual", signal, headers: { "user-agent": "KommunikaciosMunkater/0.1 (+forrasfeldolgozas)", accept: "text/html,application/xhtml+xml" } })`;
  3xx esetén a `location`-t feloldja, ÚJRA ellenőrzi `nyilvanosCim`-mel, legfeljebb `maxAtiranyitas ?? 3` alkalommal
  (több → FORRAS_NEM_ELERHETO); nem 2xx → FORRAS_NEM_ELERHETO; `content-type` nem `text/html`/`xhtml`/`text/plain` → FORRAS_NEM_SZOVEG;
  a törzset darabonként olvasd (`body.getReader()`), és `maxBajt ?? 1_000_000` fölött FORRAS_TUL_NAGY (ne olvasd tovább);
  időkorlát `idokorlatMs ?? 10000` (AbortController) → FORRAS_NEM_ELERHETO.
- Szövegkinyerés (saját, reguláris kifejezésekkel, nincs külső csomag): `<script>`, `<style>`, `<noscript>`, `<svg>`,
  `<nav>`, `<footer>`, `<header>`, HTML-megjegyzések eldobása; `<title>` külön (`cim`); a `<br>`, `</p>`, `</div>`, `</li>`,
  `</h1..6>`, `</tr>` helyére sortörés; a többi címke eldobva; HTML-entitások feloldva (`&amp; &lt; &gt; &quot; &#39; &nbsp;`
  és a numerikusak); fehér karakterek összevonva; legfeljebb 12 000 karakter (a többi levágva).
- A kinyert szöveg ADAT: a modul nem értelmezi, csak visszaadja.

Csak ezt a két fájlt add vissza. Nincs `any`, nincs `console.log`.
