import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ollamaSzolgaltato, ollamaElerheto } from "../src/index";
import { AiHiba } from "../src/index";

describe("ollamaSzolgaltato", () => {
  const alapKeres = {
    feladat: "osszefoglalo" as const,
    rendszer: "Rendszer",
    szoveg: "Szöveg",
    nyelv: "hu",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("(a) jo valasz — szoveg es tokenek", async () => {
    const hamisFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: { content: '{"a":1}' },
        prompt_eval_count: 10,
        eval_count: 5,
      }),
    });
    vi.stubGlobal("fetch", hamisFetch);

    const valasz = await ollamaSzolgaltato.hiv(alapKeres);
    expect(valasz.szoveg).toBe('{"a":1}');
    expect(valasz.meres.tokenek_be).toBe(10);
    expect(valasz.meres.tokenek_ki).toBe(5);
    expect(valasz.meres.allapot).toBe("ok");
  });

  it("(b) HTTP 500 → AiHiba AI_NEM_ELERHETO", async () => {
    const hamisFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "hiba",
    });
    vi.stubGlobal("fetch", hamisFetch);

    await expect(ollamaSzolgaltato.hiv(alapKeres)).rejects.toBeInstanceOf(AiHiba);
    await expect(ollamaSzolgaltato.hiv(alapKeres)).rejects.toMatchObject({ kod: "AI_NEM_ELERHETO" });
  });

  it("(c) ures content → AI_ROSSZ_VALASZ", async () => {
    const hamisFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: { content: "" },
        prompt_eval_count: 10,
        eval_count: 5,
      }),
    });
    vi.stubGlobal("fetch", hamisFetch);

    await expect(ollamaSzolgaltato.hiv(alapKeres)).rejects.toBeInstanceOf(AiHiba);
    await expect(ollamaSzolgaltato.hiv(alapKeres)).rejects.toMatchObject({ kod: "AI_ROSSZ_VALASZ" });
  });

  it("(d) egyszerre egy — a masodik csak az elso vege utan kezdodik", async () => {
    const sorrend: string[] = [];
    const hamisFetch = vi.fn().mockImplementation(async () => {
      sorrend.push("kezd");
      await new Promise((r) => setTimeout(r, 30));
      sorrend.push("veg");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          message: { content: "ok" },
          prompt_eval_count: 1,
          eval_count: 1,
        }),
      };
    });
    vi.stubGlobal("fetch", hamisFetch);

    const [v1, v2] = await Promise.all([
      ollamaSzolgaltato.hiv(alapKeres),
      ollamaSzolgaltato.hiv(alapKeres),
    ]);

    expect(v1.szoveg).toBe("ok");
    expect(v2.szoveg).toBe("ok");
    expect(sorrend).toEqual(["kezd", "veg", "kezd", "veg"]);
  });

  it("(e) ollamaElerheto — a /api/tags valaszabol a modellnevek", async () => {
    const hamisFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        models: [{ name: "qwen2.5:7b" }, { name: "llama3.1:8b" }],
      }),
    });
    vi.stubGlobal("fetch", hamisFetch);

    const modellek = (await ollamaElerheto()).modellek;
    expect(modellek).toEqual(["qwen2.5:7b", "llama3.1:8b"]);
  });
});
