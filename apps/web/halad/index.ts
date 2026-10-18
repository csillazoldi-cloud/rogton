import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { sema, szervezetKent } from "../adatbazis/kapcsolat";

// T8 — a heti haladás számláló gépezete. A hét hétfő 00:00-tól számít, Europe/Bucharest időzónában.

/** A hét kezdete (hétfő 00:00) Europe/Bucharest időzónában, ISO szövegként. */
function hetKezdete(most: Date): Date {
  // A helyi (Europe/Bucharest) dátumot daraboljuk szét, hogy a hétfőt megkapjuk.
  const reszek = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(most);
  const ev = Number(reszek.find((r) => r.type === "year")?.value);
  const honap = Number(reszek.find((r) => r.type === "month")?.value);
  const nap = Number(reszek.find((r) => r.type === "day")?.value);
  const napnev = reszek.find((r) => r.type === "weekday")?.value ?? "Mon";
  const napnevIndex: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const eltolas = napnevIndex[napnev] ?? 0;

  // A helyi hétfő 00:00-t megkeressük: a helyi dátumot UTC-ként értelmezzük, majd a Bucharest-eltolást levonjuk.
  const helyiHetfo = new Date(Date.UTC(ev, honap - 1, nap - eltolas, 0, 0, 0));
  // A Bucharest és UTC közti eltolás ezen a napon (ms-ban).
  const eltolasMs = bucharestEltolasMs(helyiHetfo);
  return new Date(helyiHetfo.getTime() - eltolasMs);
}

/** Egy adott pillanatban a Europe/Bucharest és UTC közti eltolás ezredmásodpercben. */
function bucharestEltolasMs(pillanat: Date): number {
  const formazo = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const r = formazo.formatToParts(pillanat);
  const kap = (t: string) => Number(r.find((x) => x.type === t)?.value);
  const helyi = Date.UTC(kap("year"), kap("month") - 1, kap("day"), kap("hour"), kap("minute"), kap("second"));
  return helyi - pillanat.getTime();
}

/** Egy kép letöltésének feljegyzése a halad_esemeny táblába. */
export async function kepLetoltesFeljegyez(szervezetId: string): Promise<void> {
  await szervezetKent(szervezetId, (tx) =>
    tx.insert(sema.haladEsemeny).values({ szervezetId, fajta: "kep_letoltve" }),
  );
}

/** A heti haladás: hány poszt készült és hány kép lett letöltve ezen a héten. */
export async function hetiHalad(
  szervezetId: string,
  most = new Date(),
): Promise<{ poszt_kesz: number; kep_letoltve: number; het_kezdete: string }> {
  const kezdet = hetKezdete(most);

  // A szervezet poszt_munka sorai — a jsonb-t JS-ben szűrjük.
  const munkak = await szervezetKent(szervezetId, (tx) =>
    tx.select().from(sema.posztMunka).where(eq(sema.posztMunka.szervezetId, szervezetId)),
  );

  let posztKesz = 0;
  for (const sor of munkak) {
    if ((sor.forras as { torolve?: unknown } | null)?.torolve) continue; // R-18 8. kör: a puhán törölt poszt nem számít
    const cellak = Array.isArray(sor.szovegek) ? (sor.szovegek as Array<Record<string, unknown>>) : [];
    for (const cella of cellak) {
      if (cella.allapot !== "vegleges") continue;
      const v = cella.veglegesitve;
      if (typeof v !== "string" || v.length === 0) continue;
      const ido = new Date(v);
      if (Number.isNaN(ido.getTime())) continue;
      if (ido.getTime() >= kezdet.getTime()) posztKesz += 1;
    }
  }

  // A héten feljegyzett kép-letöltések száma.
  const esemenyek = await szervezetKent(szervezetId, (tx) =>
    tx
      .select()
      .from(sema.haladEsemeny)
      .where(
        and(
          eq(sema.haladEsemeny.szervezetId, szervezetId),
          eq(sema.haladEsemeny.fajta, "kep_letoltve"),
          gte(sema.haladEsemeny.ido, kezdet),
        ),
      ),
  );

  return {
    poszt_kesz: posztKesz,
    kep_letoltve: esemenyek.length,
    het_kezdete: kezdet.toISOString(),
  };
}
