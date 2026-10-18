// R-17 A6 (12d3, Kati #10, H3 „pontos színkódot nem lehet megadni”): a „Pontos kódom van” mező értelmezése. Tiszta függvény (próba:
// probak/r17-szin-kod.proba.ts). Elfogadja: #RRGGBB · RRGGBB · #RGB · RGB · „R, G, B” · „R G B” · „rgb (R, G, B)” (zárójeles CSS-alak) — kis- és nagybetű,
// szóközök. Vissza: a normalizált, kisbetűs `#rrggbb` (a GYURU és a mentés alakja), vagy null, ha nem ismerhető fel (a lap egy halk
// mondatot mutat, a szín nem változik).
export function szinKodErtelmez(be: string): string | null {
  const s = be.trim().toLowerCase();
  if (!s) return null;
  const hex = s.match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/);
  if (hex) {
    const h = hex[1]!;
    const hat = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return `#${hat}`;
  }
  const rgb = s.match(/^(?:rgb\s*\(\s*)?(\d{1,3})\s*[,;\s]\s*(\d{1,3})\s*[,;\s]\s*(\d{1,3})\s*\)?$/);
  if (rgb) {
    const n = [rgb[1], rgb[2], rgb[3]].map((x) => Number(x));
    if (n.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return null;
    if (s.startsWith("rgb") !== s.endsWith(")")) return null;
    return `#${n.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  return null;
}
