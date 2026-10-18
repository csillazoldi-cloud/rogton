export * from "./alap";
export { anthropicSzolgaltato } from "./anthropic";
export { claudeElofizetesSzolgaltato, codexElofizetesSzolgaltato, hidSzolgaltato } from "./hid";
export { ollamaSzolgaltato, ollamaElerheto } from "./ollama";
export { openaiSzolgaltato } from "./openai";

/**
 * Hol dolgozza fel az adatot egy szolgáltató (E-39): "helyi" = a házon belüli gépen, "felho" = külső cégnél.
 * A leírólapok `hol` mezőjéből, hogy ez a tudás EGY helyen éljen (az adatút leírása is erre hivatkozik).
 */
export function szolgaltatoHol(azonosito: string): "helyi" | "felho" {
  switch (azonosito) {
    case "anthropic":
    case "claude-elofizetes":
    case "codex-elofizetes":
    case "openai":
      return "felho";
    default:
      return "helyi"; // teszt, helyi-ollama és minden későbbi házon belüli
  }
}
