// Tiszta szövegsegéd (nincs React): a kliens.tsx újraexportálja, a probak/ közvetlenül futtatja.

/** Témalista bontása vessző és pontosvessző mentén (V2, 2026-09-18): üres és dupla kihagyva, sorrend megőrizve. */
export function temakBont(szoveg: string): string[] {
  const darabok = szoveg.split(/[,;]/);
  const latott = new Set<string>();
  const ki: string[] = [];
  for (const d of darabok) {
    const n = d.trim();
    if (n.length < 1) continue;
    if (latott.has(n)) continue;
    latott.add(n);
    ki.push(n);
  }
  return ki;
}
