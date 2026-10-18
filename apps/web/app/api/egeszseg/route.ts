import { EgeszsegValasz, RENDSZER_VERZIO } from "@rogton/contracts";

// „Élsz még?" — a dobozkezelő és a feltöltés ellenőrzése ezt kérdezi.
export function GET() {
  const valasz = EgeszsegValasz.parse({
    allapot: "ok",
    verzio: RENDSZER_VERZIO,
    ido: new Date().toISOString(),
  });
  return Response.json(valasz, { headers: { "cache-control": "no-store" } });
}
