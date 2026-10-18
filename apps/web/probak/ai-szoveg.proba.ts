import { describe, it, expect } from "vitest";
import { szovegRobusztusan } from "../ai/szoveg";

// 2026-09-19: az OpenAI a tevékenység-összefoglalóra {"summary":"…"}-t adott, pedig a prompt
// folyó szöveget kért. A felületre a nyers JSON került ki. Ez a próba őrzi a javítást.

describe("AI-válasz folyó szövegként", () => {
  it("a sima szöveget változatlanul adja vissza", () => {
    expect(szovegRobusztusan("  Egy tömör összefoglaló.  ")).toBe("Egy tömör összefoglaló.");
  });

  it("kibontja a summary mezőt", () => {
    expect(szovegRobusztusan('{"summary":"A pékség kovászos kenyeret süt."}')).toBe("A pékség kovászos kenyeret süt.");
  });

  it("kibontja a magyar mezőnevet is", () => {
    expect(szovegRobusztusan('{"osszefoglalo":"Két üzlet és egy kávézó."}')).toBe("Két üzlet és egy kávézó.");
  });

  it("lehúzza a kódjelölést", () => {
    expect(szovegRobusztusan('```json\n{"summary":"Kész."}\n```')).toBe("Kész.");
    expect(szovegRobusztusan("```\nSima szöveg.\n```")).toBe("Sima szöveg.");
  });

  it("egyetlen ismeretlen nevű szöveges mezőt is kibont", () => {
    expect(szovegRobusztusan('{"valami":"Ez a szöveg."}')).toBe("Ez a szöveg.");
  });

  it("több szöveges mezőnél nem talál ki semmit", () => {
    const be = '{"a":"egy","b":"kettő"}';
    expect(szovegRobusztusan(be)).toBe(be);
  });

  it("a hibás JSON-t érintetlenül hagyja", () => {
    const be = '{ez nem json}';
    expect(szovegRobusztusan(be)).toBe(be);
  });

  it("a kapcsos zárójellel kezdődő mondatot nem csonkolja", () => {
    expect(szovegRobusztusan("A cég neve: {Próba}. Kenyeret süt.")).toBe("A cég neve: {Próba}. Kenyeret süt.");
  });
});
