import "server-only";
import { cache } from "react";
import { lapFeliratai } from "../szovegek";
import { ALAP_NYELV, FELULETI_NYELVEK, type Nyelv } from "@rogton/design-system";
import { sablonKitolt } from "./sablon";


export function nyelvKeresbol(cookieErtek: string | undefined, acceptLanguage: string | null): Nyelv {
  return nyelvDontes(cookieErtek, acceptLanguage).nyelv;
}

/**
 * R-17 D (Kati 10-02, design/R17-visszajelzes 17-ny1/ny2): a lap nyelve ÉS az, hogy el volt-e döntve. Eldöntött: a választott nyelv sütije
 * (km_nyelv), vagy a böngésző első HU/RO/EN nyelve (Accept-Language). Ha egyik sincs, az alapnyelv (ALAP_NYELV, D-11 óta angol) jön, `eldontve: false` —
 * a nyilvános nyitólap ilyenkor mutatja a háromnyelvű választót (a választás a sütibe kerül, utána nem jön elő).
 */
export function nyelvDontes(cookieErtek: string | undefined, acceptLanguage: string | null): { nyelv: Nyelv; eldontve: boolean } {
  // G3 (Rögtön): csak a FELÜLETI nyelvek számítanak; egyetlen felületi nyelvnél nincs mit eldönteni (nincs választó sáv)
  if (FELULETI_NYELVEK.length === 1) return { nyelv: FELULETI_NYELVEK[0]!, eldontve: true };
  if (cookieErtek && (FELULETI_NYELVEK as readonly string[]).includes(cookieErtek)) {
    return { nyelv: cookieErtek as Nyelv, eldontve: true };
  }
  if (acceptLanguage) {
    const nyelvek = acceptLanguage.split(",").map((resz) => resz.split(";")[0]?.trim().toLowerCase() ?? "");
    for (const nyelv of nyelvek) {
      const elso = nyelv.split("-")[0];
      if (elso && (FELULETI_NYELVEK as readonly string[]).includes(elso)) {
        return { nyelv: elso as Nyelv, eldontve: true };
      }
    }
  }
  return { nyelv: ALAP_NYELV, eldontve: false };
}

/**
 * A lap feliratai a kért nyelven (E-16-tól): a csomag alapja + a közös felülírás + a belépett ember szervezetének alkalmazott
 * felülírásai, tartaléknyelvvel. Szervezet nélkül (belépés előtt): alap + közös. A tárolás és a gyorsítótár az apps/web/szovegek-ben.
 */
export async function feliratok(nyelv: Nyelv, szervezetId: string | null = null): Promise<Record<string, string>> {
  return lapFeliratai(nyelv, szervezetId);
}

export function felirat(f: Record<string, string>, kulcs: string, ertekek?: Record<string, string | number>): string {
  const sablon = f[kulcs];
  if (sablon === undefined) return kulcs;
  return sablonKitolt(sablon, ertekek); // R-18 3. kör: többes szám is (nyelv/sablon.ts)
}

export const feliratokCache = cache(feliratok);
