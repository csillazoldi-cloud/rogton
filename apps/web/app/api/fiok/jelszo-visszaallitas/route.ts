// E-34: a jelszó átállítása a jeggyel. Belépés NEM kell hozzá — a jegy maga a bizonyíték.
import { NextResponse } from "next/server";
import { kapu } from "../../_kapu";
import type { HibaValasz } from "@rogton/contracts";
import { keresCime, kiserletNaplo, korlatEllenoriz } from "../../../../hitelesites/korlat";
import { jelszoAtallit } from "../../../../hitelesites/visszaallitas";

export const dynamic = "force-dynamic";

function valasz(torzs: unknown, status: number, fejlecek?: Record<string, string>): Response {
  return NextResponse.json(torzs, { status, headers: { "cache-control": "no-store", ...(fejlecek ?? {}) } });
}

export async function POST(keres: Request): Promise<Response> {
  // B-01: a szint KIMONDVA — ez a végpont szándékosan belépés nélkül is hívható.
  // A kapu itt nem tilt, csak kimondja a döntést; a jogosultsági mátrix ezt ellenőrzi.
  await kapu(keres, "nyilvanos");
  const cim = keresCime(keres.headers);

  // A jegy találgatása ellen ugyanaz a korlát véd, mint a belépésnél. E-mail itt nincs
  // (a jegy nem árulja el, kié), ezért CSAK cím szerint tudunk számolni.
  const allas = await korlatEllenoriz("jelszo_visszaallitas", null, cim);
  if (!allas.szabad) {
    return valasz({ hiba: "TUL_SOK_KISERLET", mezok: { ujra_perc: String(allas.ujraPerc) } } satisfies HibaValasz, 429, {
      "retry-after": String(allas.ujraPerc * 60),
    });
  }

  let test: unknown;
  try {
    test = await keres.json();
  } catch {
    await kiserletNaplo("jelszo_visszaallitas", null, cim, false);
    return valasz({ hiba: "ERVENYTELEN_ADAT" } satisfies HibaValasz, 400);
  }

  const t = test as { jegy?: unknown; jelszo?: unknown } | null;
  if (typeof t?.jegy !== "string" || t.jegy === "") {
    await kiserletNaplo("jelszo_visszaallitas", null, cim, false);
    return valasz({ hiba: "ERVENYTELEN_ADAT", mezok: { jegy: "invalid_type" } } satisfies HibaValasz, 400);
  }

  const eredmeny = await jelszoAtallit(t.jegy, typeof t.jelszo === "string" ? t.jelszo : "");
  if (!eredmeny.ok) {
    await kiserletNaplo("jelszo_visszaallitas", null, cim, false);
    const status = eredmeny.hiba === "ERVENYTELEN_JEGY" ? 400 : 400;
    return valasz({ hiba: eredmeny.hiba } satisfies HibaValasz, status);
  }

  await kiserletNaplo("jelszo_visszaallitas", null, cim, true);
  return valasz({ ok: true }, 200);
}
