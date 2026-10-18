import { kapu } from "../../_kapu";
import { iranytutJavasol, IranytuJavaslatHiba, type JavaslatBlokk } from "../../../../iranytu/javaslat";

export const dynamic = "force-dynamic";

const ERVENYES_BLOKKOK: readonly JavaslatBlokk[] = [
  "celok",
  "vizio",
  "ertekek",
  "idoszakok",
  "tolni",
  "kerulni",
  "mind",
];

function blokkotEllenoriz(ertek: unknown): JavaslatBlokk | null {
  if (typeof ertek !== "string") return null;
  return (ERVENYES_BLOKKOK as readonly string[]).includes(ertek) ? (ertek as JavaslatBlokk) : null;
}

export async function POST(req: Request): Promise<Response> {
  const e = await kapu(req, "szerkeszto");
  if (e instanceof Response) return e; // a kapu maga válaszol (nincs belépve / nincs jog)
  const szervezetId = e.szervezet.id;

  let torzs: unknown;
  try {
    torzs = await req.json();
  } catch {
    return Response.json(
      { hiba: "ERVENYTELEN_ADAT", mezok: { torzs: "ervenytelen_json" } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const blokk = blokkotEllenoriz((torzs as { blokk?: unknown } | null)?.blokk);
  if (!blokk) {
    return Response.json(
      { hiba: "ERVENYTELEN_ADAT", mezok: { blokk: "ervenytelen" } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const felulet = req.headers.get("accept-language")?.split(",")[0]?.trim() || "hu";

  try {
    const javaslat = await iranytutJavasol(szervezetId, blokk, felulet, e.fiok.id);
    return Response.json(
      { javaslat },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (hiba) {
    if (hiba instanceof IranytuJavaslatHiba) {
      switch (hiba.kod) {
        case "AI_NEM_ELERHETO":
          return Response.json(
            { hiba: "AI_NEM_ELERHETO" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        case "AI_KERET_KIMERULT":
          return Response.json(
            { hiba: "AI_KERET_KIMERULT" },
            { status: 429, headers: { "cache-control": "no-store" } },
          );
        case "AI_KIKAPCSOLVA":
          return Response.json(
            { hiba: "AI_KIKAPCSOLVA" },
            { status: 409, headers: { "cache-control": "no-store" } },
          );
        case "ERVENYTELEN_ADAT":
          return Response.json(
            { hiba: "ERVENYTELEN_ADAT", mezok: hiba.mezok ?? {} },
            { status: 400, headers: { "cache-control": "no-store" } },
          );
      }
    }
    console.error("iranytu javaslat hiba:", hiba instanceof Error ? hiba.message : hiba);
    return Response.json(
      { hiba: "BELSO_HIBA" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
