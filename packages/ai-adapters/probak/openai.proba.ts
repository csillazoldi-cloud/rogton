import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiHiba } from "../src/alap";
import { openaiSzolgaltato } from "../src/openai";

// T-25 (D-F37): az OpenAI-csatlakozó — a hálózat helyett álfetch; a kulcs, a kérés alakja, a válasz feldolgozása, a hibák.

const keres = { feladat: "hf_relevancia" as const, rendszer: "rendszer", szoveg: "szöveg", nyelv: "hu", maxKiToken: 200 };

describe("OpenAI-csatlakozó", () => {
  const eredetiFetch = globalThis.fetch;
  beforeEach(() => { process.env["OPENAI_API_KEY"] = "teszt-kulcs"; process.env["OPENAI_MODELL"] = "gpt-5-mini"; });
  afterEach(() => { globalThis.fetch = eredetiFetch; delete process.env["OPENAI_API_KEY"]; delete process.env["OPENAI_MODELL"]; });

  it("kulcs nélkül AI_NINCS_KULCS, hívás nélkül", async () => {
    delete process.env["OPENAI_API_KEY"];
    const f = vi.fn();
    globalThis.fetch = f as unknown as typeof fetch;
    await expect(openaiSzolgaltato.hiv(keres)).rejects.toMatchObject({ kod: "AI_NINCS_KULCS" });
    expect(f).not.toHaveBeenCalled();
  });

  it("a kérés a Chat Completions alakja: Bearer kulcs, system + user üzenet, max_completion_tokens; a válasz szövege és mérése", async () => {
    let kapott: { url: string; init: RequestInit } | null = null;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      kapott = { url: String(url), init: init ?? {} };
      return new Response(JSON.stringify({ choices: [{ message: { content: "{\"relevans\":true}" } }], usage: { prompt_tokens: 1000, completion_tokens: 100 } }), { status: 200 });
    }) as typeof fetch;
    const v = await openaiSzolgaltato.hiv(keres);
    expect(v.szoveg).toBe("{\"relevans\":true}");
    expect(v.meres.szolgaltato).toBe("openai");
    expect(v.meres.modell).toBe("gpt-5-mini");
    expect(v.meres.tokenek_be).toBe(1000);
    expect(v.meres.tokenek_ki).toBe(100);
    // gpt-5-mini: 0,25 USD / 1M be + 2 USD / 1M ki → 1000 be + 100 ki = 0,00025 + 0,0002
    expect(v.meres.becsult_usd).toBeCloseTo(0.00045, 6);
    expect(kapott).not.toBeNull();
    const k = kapott!;
    expect(k.url).toBe("https://api.openai.com/v1/chat/completions");
    expect((k.init.headers as Record<string, string>)["authorization"]).toBe("Bearer teszt-kulcs");
    const torzs = JSON.parse(String(k.init.body)) as { model: string; max_completion_tokens: number; messages: { role: string; content: string }[]; temperature?: number; reasoning_effort?: string };
    expect(torzs.model).toBe("gpt-5-mini");
    expect(torzs.max_completion_tokens).toBe(200);
    expect(torzs.messages.map((m) => m.role)).toEqual(["system", "user"]);
    expect(torzs.messages[0]!.content.startsWith("rendszer")).toBe(true);
    expect(torzs.messages[0]!.content).toContain("magyarul legyen"); // a válasz nyelve a rendszerutasítás végén (mérve: enélkül angolul indokolt)
    expect(torzs.temperature).toBeUndefined();
    expect(torzs.reasoning_effort).toBe("minimal"); // mérve: enélkül a gpt-5-mini a keretet a gondolkodásra költi, a válasz üres
  });

  it("401 → AI_NINCS_KULCS (rossz kulcs); 500 kétszer → AI_NEM_ELERHETO; üres válasz → AI_ROSSZ_VALASZ", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch;
    await expect(openaiSzolgaltato.hiv(keres)).rejects.toMatchObject({ kod: "AI_NINCS_KULCS" });
    let hivasok = 0;
    globalThis.fetch = (async () => { hivasok += 1; return new Response("{}", { status: 500 }); }) as typeof fetch;
    await expect(openaiSzolgaltato.hiv(keres)).rejects.toMatchObject({ kod: "AI_NEM_ELERHETO" });
    expect(hivasok).toBe(2); // egy ismétlés 1 mp után
    globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [{ message: { content: "" } }] }), { status: 200 })) as typeof fetch;
    await expect(openaiSzolgaltato.hiv(keres)).rejects.toBeInstanceOf(AiHiba);
  });

  it("a leírólap: felhő, USA, minden feladat, a hírfigyelő feladatai is", () => {
    const l = openaiSzolgaltato.leirolap;
    expect(l.hol).toBe("felho");
    expect(l.feladatok).toContain("hf_relevancia");
    expect(l.feladatok).toContain("hf_osszkep");
  });
});
