// R-11/A · A-4: az eredetjelölés. A végleges szöveget összevetjük az utolsó AI-javaslattal,
// és ami eltér, azt az ember írta. Nem billentyűkövetés: a két szöveg összehasonlítása dönt.

export type Darab = { szoveg: string; sajat: boolean };

/** Ennél hosszabb szövegnél nem vetjük össze szavanként — a lap nem akadhat meg tőle. */
const FELSO_HATAR = 1200;

/** Szavakra és a köztük lévő térközökre bontás úgy, hogy összefűzve visszakapjuk az eredetit. */
function darabol(szoveg: string): string[] {
  return szoveg.split(/(\s+)/).filter((d) => d.length > 0);
}

/**
 * A két szöveg közös része az AI javaslata, a többi az emberé.
 * Leghosszabb közös részsorozat (LCS) szavankénti szinten.
 */
export function eredetDarabok(javaslat: string, szoveg: string): Darab[] {
  if (!szoveg) return [];
  if (!javaslat.trim()) return [{ szoveg, sajat: true }];
  if (javaslat === szoveg) return [{ szoveg, sajat: false }];

  const a = darabol(javaslat);
  const b = darabol(szoveg);
  if (a.length > FELSO_HATAR || b.length > FELSO_HATAR) return [{ szoveg, sajat: true }];

  const n = a.length;
  const m = b.length;
  const tabla = new Int32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const itt = i * (m + 1) + j;
      const atlo = tabla[(i + 1) * (m + 1) + (j + 1)] ?? 0;
      const lefele = tabla[(i + 1) * (m + 1) + j] ?? 0;
      const jobbra = tabla[i * (m + 1) + (j + 1)] ?? 0;
      tabla[itt] = a[i] === b[j] ? atlo + 1 : Math.max(lefele, jobbra);
    }
  }

  const ki: Darab[] = [];
  const hozzafuz = (resz: string, sajat: boolean): void => {
    const utolso = ki[ki.length - 1];
    if (utolso && utolso.sajat === sajat) utolso.szoveg += resz;
    else ki.push({ szoveg: resz, sajat });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      hozzafuz(b[j] ?? "", false);
      i++;
      j++;
    } else if ((tabla[(i + 1) * (m + 1) + j] ?? 0) >= (tabla[i * (m + 1) + (j + 1)] ?? 0)) {
      i++; // a javaslatból kimaradt szó — a végleges szövegben nincs benne
    } else {
      hozzafuz(b[j] ?? "", true);
      j++;
    }
  }
  while (j < m) {
    hozzafuz(b[j] ?? "", true);
    j++;
  }
  return ki;
}

/** Hány százalékot írt át az ember (a karakterek arányában)? */
export function sajatArany(darabok: Darab[]): number {
  let ossz = 0;
  let sajat = 0;
  for (const d of darabok) {
    ossz += d.szoveg.length;
    if (d.sajat) sajat += d.szoveg.length;
  }
  return ossz === 0 ? 0 : Math.round((sajat / ossz) * 100);
}
