// R-13 (2026-09-22, Vilmos): a kreditrendszer tiszta szabályai — DeepSeek írta (R13-K1), Claude javította (kijelzés kerekítése, szigorú típus).
/** Az egység: ezred kredit. Minden összeg belül EGÉSZ ezred (lebegőpontos hiba nélkül). */
export const EZRED = 1000;

/** Egy mai AI-művelet ára krediten (Vilmos: minden mai művelet 1 kredit). */
export const MUVELET_AR = 1;

/** A munkatér alap havi kreditje, ha a rendszergazda nem adott meg mást (teszt: ≈ a régi 5 USD-s keret). */
export const ALAP_MUNKATER_HAVI = 1000;

/** Kreditből ezred (kerekítve a legközelebbi egészre). */
export function ezredbe(kredit: number): number {
  return Math.round(kredit * EZRED);
}

/** Ezredből kredit. */
export function kreditbe(ezred: number): number {
  return ezred / EZRED;
}

/** A hónap kulcsa ("YYYY-MM") a megadott időzónában (alap: "Europe/Bucharest"), `Intl.DateTimeFormat`-tal. */
export function honapKulcs(d: Date, idozona: string = "Europe/Bucharest"): string {
  const formazo = new Intl.DateTimeFormat("en-CA", {
    timeZone: idozona,
    year: "numeric",
    month: "2-digit",
  });
  const reszek = formazo.formatToParts(d);
  let ev = "";
  let honap = "";
  for (const resz of reszek) {
    if (resz.type === "year") {
      ev = resz.value;
    } else if (resz.type === "month") {
      honap = resz.value;
    }
  }
  return `${ev}-${honap}`;
}

export type TagKeret = { fiok_id: string; kulon: number | null }; // kulon: a tulajdonos által megadott havi kredit, null = egyenlő rész

/**
 * A tagok havi kerete EZREDBEN.
 * - A külön megadott összegek (kulon !== null, negatív → 0) úgy maradnak, ahogy vannak — akkor is, ha az összegük
 *   több, mint a munkatér havi kreditje (a tulajdonos döntése; a munkatér összkerete a felső határ máshol fog).
 * - A maradék = max(0, munkaterHavi − a külön megadottak összege); ezt a kulon === null tagok EGYENLŐEN kapják,
 *   ezredre lefelé kerekítve; a kerekítésből megmaradó ezredek a lista ELEJÉN álló egyenlő-részes tagokhoz kerülnek
 *   egyesével (így az egyenlő részek összege pontosan a maradék).
 * - Üres tagokra üres Map.
 */
export function haviKeretek(munkaterHavi: number, tagok: TagKeret[]): Map<string, number> {
  const eredmeny = new Map<string, number>();
  if (tagok.length === 0) {
    return eredmeny;
  }

  const munkaterEzred = ezredbe(munkaterHavi);

  // A külön megadott összegek ezredben (negatív → 0).
  const kulonEzred = new Map<string, number>();
  let kulonOsszeg = 0;
  for (const tag of tagok) {
    if (tag.kulon !== null) {
      const ertek = Math.max(0, ezredbe(tag.kulon));
      kulonEzred.set(tag.fiok_id, ertek);
      kulonOsszeg += ertek;
    }
  }

  // Az egyenlő részes tagok sorrendje (a lista elejétől).
  const egyenloTagok: string[] = [];
  for (const tag of tagok) {
    if (tag.kulon === null) {
      egyenloTagok.push(tag.fiok_id);
    }
  }

  const maradek = Math.max(0, munkaterEzred - kulonOsszeg);

  // Alap egyenlő rész lefelé kerekítve.
  const alapResz = egyenloTagok.length > 0 ? Math.floor(maradek / egyenloTagok.length) : 0;
  let plusz = maradek - alapResz * egyenloTagok.length; // a maradék ezredek, egyesével a lista elejére

  for (const fiok of egyenloTagok) {
    let ertek = alapResz;
    if (plusz > 0) {
      ertek += 1;
      plusz -= 1;
    }
    eredmeny.set(fiok, ertek);
  }

  // A külön megadottak felülírják (illetve bekerülnek).
  for (const [fiok, ertek] of kulonEzred) {
    eredmeny.set(fiok, ertek);
  }

  return eredmeny;
}

/**
 * Egy költség (kreditben) szétosztása a fiókok között EZREDBEN: egyenlően, lefelé kerekítve, a maradék ezredek a
 * lista elején állókhoz egyesével. Az eredmény összege PONTOSAN ezredbe(osszeg). Ismétlődő fiók_id egyszer számít.
 * Üres listára üres Map.
 */
export function megoszt(osszeg: number, fiokok: string[]): Map<string, number> {
  const eredmeny = new Map<string, number>();
  if (fiokok.length === 0) {
    return eredmeny;
  }

  // Ismétlődő fiók_id egyszer számít, de a sorrend az első előfordulás szerint marad.
  const egyedi: string[] = [];
  const latott = new Set<string>();
  for (const fiok of fiokok) {
    if (!latott.has(fiok)) {
      latott.add(fiok);
      egyedi.push(fiok);
    }
  }

  const osszegEzred = ezredbe(osszeg);
  const alapResz = Math.floor(osszegEzred / egyedi.length);
  let plusz = osszegEzred - alapResz * egyedi.length;

  for (const fiok of egyedi) {
    let ertek = alapResz;
    if (plusz > 0) {
      ertek += 1;
      plusz -= 1;
    }
    eredmeny.set(fiok, ertek);
  }

  return eredmeny;
}

export type Egyenleg = { keret: number; felhasznalt: number }; // mindkettő EZREDBEN

/** Maradt ezred (lehet 0, soha nem negatív). */
export function maradt(e: Egyenleg): number {
  return Math.max(0, e.keret - e.felhasznalt);
}

/**
 * Indítható-e egy művelet ennek a tagnak: a tagnak maradt > 0 ÉS a munkatér egészének maradt > 0.
 * (Egy tört kredit is elég az indításhoz — a művelet után lehet kicsit negatív; ezt a `maradt` 0-nak mutatja.)
 */
export function indithato(tag: Egyenleg, munkater: Egyenleg): boolean {
  return maradt(tag) > 0 && maradt(munkater) > 0;
}

/** Kijelzés egy tizedesre, a nyelv szerinti tizedesjellel ("hu" → "312,5", "ro" → "312,5", "en" → "312.5");
 *  egész számnál tizedes nélkül ("312"). Bemenet: ezred. */
export function kijelzes(ezred: number, nyelv: "hu" | "ro" | "en"): string {
  // Kézi javítás (Claude): tizedekre kerekítünk EGYSZER, így a 999 ezred „1” lesz, nem „1,0”.
  const tizedek = Math.round(ezred / 100);
  const egesz = Math.trunc(tizedek / 10);
  const tized = Math.abs(tizedek % 10);
  if (tized === 0) return `${egesz}`;
  return `${tizedek < 0 && egesz === 0 ? "-" : ""}${egesz}${nyelv === "en" ? "." : ","}${tized}`;
}
