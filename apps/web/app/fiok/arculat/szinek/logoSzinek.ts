"use client";
// R-16 K4 (TERV §2-K4, §1.4) — a K1 ELŐTT feltöltött logók színei. Ezeknek nincs tárolt elemzése (`arculat_fajl.elemzes` NULL),
// a kiszolgálón pedig nincs canvas. A böngésző ugyanazzal a tiszta függvénnyel nézi meg őket, mint a 12f a feltöltéskor
// (kicsinyítés ≤ 64 × 64 → @rogton/arculat-core `logoElemzes`), és a javaslatokat ugyanazzal a `szinJavaslatok`-kal számolja újra.
// Nem ír semmit (TERV 1.7 R5: meglévő sort nem módosítunk) — minden megnyitáskor újra megnézi (néhány ezredmásodperc).
import { useEffect, useMemo, useState } from "react";
import { logoElemzes, logoSzinSor, szinJavaslatok, type SzinJavaslat } from "@rogton/arculat-core";
import type { SzinekAdat } from "../../../../arculat/szinek";

const ELEMZES_MERET = 64;

async function kepSzinei(id: string, jel: AbortSignal): Promise<string[]> {
  try {
    const v = await fetch(`/api/arculat/fajl/${id}`, { credentials: "same-origin", signal: jel });
    if (!v.ok || typeof createImageBitmap !== "function") return [];
    const bmp = await createImageBitmap(await v.blob());
    const arany = Math.min(1, ELEMZES_MERET / Math.max(bmp.width, bmp.height, 1));
    const w = Math.max(1, Math.round(bmp.width * arany)), h = Math.max(1, Math.round(bmp.height * arany));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) { bmp.close(); return []; }
    ctx.drawImage(bmp, 0, 0, w, h);
    const e = logoElemzes({ rgba: ctx.getImageData(0, 0, w, h).data, szelesseg: w, magassag: h }, bmp.width, bmp.height);
    bmp.close();
    return e.szinek;
  } catch {
    return []; // olvashatatlan kép vagy megszakítva: a logó színei nélkül megy tovább (a lap a bevált szettekkel teljes)
  }
}

/** A logó színei és a 12d négy kártyája — a tárolt elemzésből, kiegészítve a böngészőben megnézett régi logókéval. */
export function useLogoSzinek(adat: SzinekAdat): { logoSzinek: string[]; javaslatok: SzinJavaslat[] } {
  const [extra, setExtra] = useState<string[]>([]);
  const kulcs = adat.elemzesNelkul.join(",");
  useEffect(() => {
    if (!kulcs) return;
    const v = new AbortController();
    void (async () => {
      const ki: string[] = [];
      for (const id of kulcs.split(",")) ki.push(...(await kepSzinei(id, v.signal)));
      if (!v.signal.aborted && ki.length) setExtra(ki);
    })();
    return () => v.abort();
  }, [kulcs]);
  return useMemo(() => {
    if (extra.length === 0) return { logoSzinek: adat.logoSzinek, javaslatok: adat.javaslatok };
    const logoSzinek = logoSzinSor([...adat.logoSzinek, ...extra]);
    return { logoSzinek, javaslatok: szinJavaslatok({ ...adat.bemenet, logoSzinek }) };
  }, [adat, extra]);
}
