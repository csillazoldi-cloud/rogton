import "server-only";

// VZ-5b: a munkatér és a képgyártó (apps/kepgyar, a Gigabyte-on — V-6) összekötése.
// A NAS-on futó alkalmazás a Gigabyte LAN-címén éri el. Időtúllépésnél és hibánál KEPGYAR_NEM_VALASZOL.

const CIM = process.env["KEPGYAR_URL"] ?? "http://kepgyar:8601";

export class KepgyarHiba extends Error {
  constructor(
    readonly kod: "KEPGYAR_NEM_VALASZOL" | "ERVENYTELEN_ADAT" | "NINCS_ILYEN",
    readonly reszlet?: unknown,
  ) {
    super(kod);
  }
}

async function kerd(ut: string, init: RequestInit = {}, mp = 30): Promise<Response> {
  try {
    return await fetch(CIM + ut, { ...init, signal: AbortSignal.timeout(mp * 1000), cache: "no-store" });
  } catch {
    throw new KepgyarHiba("KEPGYAR_NEM_VALASZOL");
  }
}

/** Egy sablon mintaképe (PNG bájtok). */
export async function mintakep(sablon: string): Promise<ArrayBuffer> {
  if (!/^[a-z_]{1,40}$/.test(sablon)) throw new KepgyarHiba("NINCS_ILYEN");
  const v = await kerd(`/mintakep/${sablon}`, {}, 20);
  if (v.status === 404) throw new KepgyarHiba("NINCS_ILYEN");
  if (!v.ok) throw new KepgyarHiba("KEPGYAR_NEM_VALASZOL");
  return v.arrayBuffer();
}

/** Kép készítése: a képgyártó válaszát (kép base64, mezők, lépések, jelzések, tiltott) változatlanul továbbadjuk. */
export async function keszit(sablon: unknown, tartalom: unknown): Promise<unknown> {
  if (typeof sablon !== "string" || !/^[a-z_]{1,40}$/.test(sablon)) throw new KepgyarHiba("ERVENYTELEN_ADAT", { sablon: "ervenytelen" });
  const v = await kerd("/keszit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sablon, tartalom }),
  });
  const adat = (await v.json().catch(() => null)) as Record<string, unknown> | null;
  if (v.status === 400) throw new KepgyarHiba("ERVENYTELEN_ADAT", adat?.["reszlet"] ?? adat?.["hiba"]);
  if (!v.ok || !adat) throw new KepgyarHiba("KEPGYAR_NEM_VALASZOL");
  return adat;
}
