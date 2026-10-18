// G9 — az oldal kapuja AZON az egy úton, amelyet a proxy nem lát: /api/arculat/fajl (a 95 MB-os arculati fájlok feltöltése).
// Miért kerüli a proxy: a Next a proxy előtt a kérés törzsét a MEMÓRIÁBA másolja (proxyClientMaxBodySize, alap 10 MB), és ami fölötte
// van, azt csonkolva adja tovább — a nagy fájl így elromlott volna, és a G4 óta lemezre folyó feltöltés memóriába került volna
// (mérve: nagy-feltoltes.proba.ts 94 MB → csonka, 101 MB → 201 a 413 helyett). Ezért a proxy.ts matcher-e ezt az utat kihagyja, és
// a route a törzs olvasása ELŐTT ugyanazt a döntést kéri itt — ugyanaz a válasz: 401 {"hiba":"kapu"} / 503.
import { KAPU_SUTI, dontes, helyiKeres, kapuJelszo } from "./szabaly";
import { jegyErvenyes } from "./jegy";

const JSON_FEJ = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } as const;

function sutiErtek(keres: Request, nev: string): string | undefined {
  for (const resz of (keres.headers.get("cookie") ?? "").split(";")) {
    const [n, ...e] = resz.trim().split("=");
    if (n === nev) return e.join("=");
  }
  return undefined;
}

/** null = mehet tovább; különben a kapu válasza (a route ezt adja vissza, a törzshöz nem nyúl). */
export async function kapuUtvonalon(keres: Request): Promise<Response | null> {
  const jelszo = kapuJelszo();
  const jegyOk = jelszo !== "" ? await jegyErvenyes(sutiErtek(keres, KAPU_SUTI), jelszo) : false;
  const d = dontes({ modszer: keres.method, ut: new URL(keres.url).pathname, jelszoVan: jelszo !== "", helyi: helyiKeres(keres.headers), jegyErvenyes: jegyOk });
  if (d.tipus === "tovabb") return null;
  if (d.tipus === "zarva-api" || d.tipus === "zarva-lap") return Response.json({ hiba: "kapu_nincs_beallitva" }, { status: 503, headers: JSON_FEJ });
  return Response.json({ hiba: "kapu" }, { status: 401, headers: JSON_FEJ });
}
