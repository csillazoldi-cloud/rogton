// Egy AI-válasz FOLYÓ SZÖVEGKÉNT. Némelyik modell akkor is JSON-ba vagy kódjelölésbe csomagol,
// ha a prompt folyó szöveget kér (mérve 2026-09-19: az OpenAI `{"summary":"…"}`-t adott a
// tevékenység-összefoglalóra). Ez a függvény kibontja — tiszta függvény, próbálható.

const MEZOK = ["osszefoglalo", "summary", "szoveg", "text", "valasz", "content"];

export function szovegRobusztusan(nyers: string): string {
  let t = nyers.trim();
  const kodKerites = t.match(/```(?:json|markdown|md|text)?\s*([\s\S]*?)```/);
  if (kodKerites) t = (kodKerites[1] ?? "").trim();
  if (!(t.startsWith("{") && t.endsWith("}"))) return t;
  let elemzett: unknown;
  try {
    elemzett = JSON.parse(t);
  } catch {
    return t; // mégsem JSON — marad, ahogy jött
  }
  if (typeof elemzett !== "object" || elemzett === null || Array.isArray(elemzett)) return t;
  const o = elemzett as Record<string, unknown>;
  for (const mezo of MEZOK) {
    const ertek = o[mezo];
    if (typeof ertek === "string" && ertek.trim()) return ertek.trim();
  }
  const szovegek = Object.values(o).filter((e): e is string => typeof e === "string" && e.trim().length > 0);
  if (szovegek.length === 1) return (szovegek[0] ?? "").trim();
  return t;
}
