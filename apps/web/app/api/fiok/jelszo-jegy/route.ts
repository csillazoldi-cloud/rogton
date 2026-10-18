// E-34: a rendszergazda jelszó-visszaállító jegyet ad ki egy e-mail-címhez.
// D-17: e-mail-küldés nincs, ezért a linket a rendszergazda juttatja el a felhasználónak.
import { NextResponse } from "next/server";
import { Email, type HibaValasz } from "@rogton/contracts";
import { kapu } from "../../_kapu";
import { jegyKiad } from "../../../../hitelesites/visszaallitas";

export const dynamic = "force-dynamic";

function valasz(torzs: unknown, status: number): Response {
  return NextResponse.json(torzs, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(keres: Request): Promise<Response> {
  const e = await kapu(keres, "rendszergazda");
  if (e instanceof Response) return e;
  const { fiok } = e;

  let test: unknown;
  try {
    test = await keres.json();
  } catch {
    return valasz({ hiba: "ERVENYTELEN_ADAT" } satisfies HibaValasz, 400);
  }

  const elemzes = Email.safeParse((test as { email?: unknown } | null)?.email);
  if (!elemzes.success) {
    return valasz({ hiba: "ERVENYTELEN_ADAT", mezok: { email: "invalid_format" } } satisfies HibaValasz, 400);
  }

  const eredmeny = await jegyKiad(elemzes.data, fiok.id);
  if (!eredmeny.ok) return valasz({ hiba: eredmeny.hiba } satisfies HibaValasz, 400);

  // `jegy: null` = nincs ilyen fiók. A rendszergazdának ezt megmondjuk (ő látja, hogy nem keletkezett jegy),
  // de a jegy útvonala magától nem árulja el fiókok létezését idegennek: ide csak rendszergazda jut be.
  return valasz(
    {
      jegy: eredmeny.ertek.jegy,
      lejar: eredmeny.ertek.lejar.toISOString(),
      utvonal: eredmeny.ertek.jegy ? `/jelszo-visszaallitas?jegy=${encodeURIComponent(eredmeny.ertek.jegy)}` : null,
    },
    200,
  );
}
