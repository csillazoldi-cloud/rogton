import "server-only";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { JavitoCsomag, Visszajelzes } from "@rogton/visszajelzes-core";

// R-9 (V5): a Visszajelzés modul fájl-kimenete Claude-nak.
// Minden beküldött visszajelzés után és a napi csomag után kiírjuk a teljes listát (kép NÉLKÜL)
// egy Markdown táblázatba és egy JSON-ba; a napi csomagot külön fájlba.
// A `FAJL_MAPPA` a meglévő fájl-tár mappája (lásd apps/web/fajl/tar.ts).
// Hiba esetén CSAK naplózunk — a fő műveletet nem buktatjuk.

function mappaAlap(): string {
  return process.env.FAJL_MAPPA ?? "./adatok/fajlok";
}

function visszajelzesMappa(): string {
  return join(mappaAlap(), "visszajelzes");
}

/** Atomi írás: ideiglenes név, majd rename. */
async function ir(ut: string, tartalom: string): Promise<void> {
  await mkdir(dirname(ut), { recursive: true });
  const ideiglenes = `${ut}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(ideiglenes, tartalom, "utf8");
  await rename(ideiglenes, ut);
}

/** A Markdown táblázat cellájának tisztítása (sorvégek, csövek). */
function cella(szoveg: string): string {
  return szoveg.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

/** A visszajelzések listája Markdown táblázatként (kép NÉLKÜL). */
export function listaMarkdown(vjk: Visszajelzes[]): string {
  const fej = "| id | állapot | lap | elem | szöveg | dátum | ki |\n|---|---|---|---|---|---|---|";
  const sorok = vjk.map((v) => {
    const elem = v.elem ? `${v.elem.cimke} (${v.elem.szelektor})` : "—";
    return `| ${cella(v.id)} | ${cella(v.allapot)} | ${cella(v.lap)} | ${cella(elem)} | ${cella(v.szoveg)} | ${cella(v.letrehozva)} | ${cella(v.fiok_nev)} |`;
  });
  return `${fej}\n${sorok.join("\n")}\n`;
}

/** A teljes lista kiírása: `lista.md` + `lista.json`. Hiba esetén csak naplóz. */
export async function listaFajlbaIr(vjk: Visszajelzes[]): Promise<void> {
  try {
    const mappa = visszajelzesMappa();
    await ir(join(mappa, "lista.md"), listaMarkdown(vjk));
    await ir(join(mappa, "lista.json"), JSON.stringify(vjk, null, 2));
  } catch (h) {
    console.warn("[visszajelzes] lista fajlba iras hiba:", h);
  }
}

/** A napi csomag kiírása: `csomag-<nap>.md`. Hiba esetén csak naplóz. */
export async function csomagFajlbaIr(csomag: JavitoCsomag): Promise<void> {
  try {
    const mappa = visszajelzesMappa();
    const sorok = csomag.tetelek.map((t) => {
      const ids = t.visszajelzes_ids.join(", ");
      return `| ${cella(t.id)} | ${cella(t.allapot)} | ${cella(t.cim)} | ${cella(t.javaslat)} | ${cella(ids)} |`;
    });
    const tartalom = [
      `# Javítócsomag — ${csomag.nap}`,
      "",
      `- id: ${csomag.id}`,
      `- létrehozva: ${csomag.letrehozva}`,
      `- visszajelzések: ${csomag.visszajelzes_db}`,
      "",
      "## Összefoglaló",
      "",
      csomag.osszefoglalo,
      "",
      "## Tételek",
      "",
      "| id | állapot | cím | leírás | visszajelzés id-k |",
      "|---|---|---|---|---|",
      ...sorok,
      "",
    ].join("\n");
    await ir(join(mappa, `csomag-${csomag.nap}.md`), tartalom);
  } catch (h) {
    console.warn("[visszajelzes] csomag fajlba iras hiba:", h);
  }
}
