// R-16 K3 (TERV §2-K3 Self-test): a felület „Betűk” sorának betűi (public/kepbetuk) bájtra ugyanazok, mint a képgyártóéi
// (tools/vizual/referencia/betuk-munkater) — amit Tibor a sorban lát, azzal készül a kép. Adatbázis és hálózat nélkül fut.
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WEB = new URL("../public/kepbetuk/", import.meta.url).pathname;
const EREDETI = new URL("../../../tools/vizual/referencia/betuk-munkater/", import.meta.url).pathname;
const CSS = new URL("../app/fiok/arculat/kepbetuk.css", import.meta.url).pathname;
const CSALADOK = ["archivo", "public-sans", "space-grotesk", "ibm-plex-sans", "gelasio"];
const VART = CSALADOK.flatMap((c) => [400, 700].flatMap((w) => ["latin", "latin-ext"].map((s) => `${c}-${s}-${w}-normal.woff2`))).sort();
const hash = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

describe("kepbetuk: a képgyártó betűinek másolata", () => {
  it("pontosan az öt család 400 + 700 súlya, latin + latin-ext (20 fájl), semmi más", () => {
    expect(readdirSync(WEB).sort()).toEqual(VART);
  });
  it("minden másolat bájtra egyezik az eredetivel", () => {
    for (const f of VART) expect(hash(join(WEB, f)), f).toBe(hash(join(EREDETI, f)));
  });
  it("a kepbetuk.css minden fájlra hivatkozik, és csak ezekre", () => {
    const css = readFileSync(CSS, "utf8");
    const hivatkozott = [...css.matchAll(/url\('\/kepbetuk\/([^']+)'\)/g)].map((m) => m[1]!).sort();
    expect(hivatkozott).toEqual(VART);
    for (const c of CSALADOK) expect(css).toContain(`.kb-${c} {`);
  });
});
