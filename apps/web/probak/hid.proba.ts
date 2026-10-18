import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { claudeElofizetesSzolgaltato, codexElofizetesSzolgaltato, AiHiba } from "@km/ai-adapters";

let valasz: { statusz: number; torzs: unknown } = { statusz: 200, torzs: {} };
let utolsoKeresTorzs: unknown = null;
let szerver: Server;
let szerverCim: string;

beforeAll(async () => {
  szerver = createServer((req, res) => {
    if (req.url === "/hiv" && req.method === "POST") {
      let test = "";
      req.on("data", (chunk) => { test += chunk; });
      req.on("end", () => {
        try {
          utolsoKeresTorzs = JSON.parse(test);
        } catch {
          utolsoKeresTorzs = test;
        }
        res.writeHead(valasz.statusz, { "content-type": "application/json" });
        res.end(JSON.stringify(valasz.torzs));
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise<void>((resolve) => {
    szerver.listen(0, "127.0.0.1", () => {
      const cim = szerver.address();
      if (cim && typeof cim === "object") {
        szerverCim = `http://127.0.0.1:${cim.port}`;
        process.env["AI_HID_CIM"] = szerverCim;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    szerver.close(() => resolve());
  });
});

describe("hid szolgaltato", () => {
  it("sikeres claude hivas", async () => {
    valasz = {
      statusz: 200,
      torzs: { szoveg: "Szia", modell: "claude-x", tokenek_be: 12, tokenek_ki: 3, ido_ms: 40 },
    };

    const eredmeny = await claudeElofizetesSzolgaltato.hiv({
      feladat: "osszefoglalo",
      rendszer: "Rendszer utasitas",
      szoveg: "Hello",
      nyelv: "hu",
    });

    expect(eredmeny.szoveg).toBe("Szia");
    expect(eredmeny.meres.szolgaltato).toBe("claude-elofizetes");
    expect(eredmeny.meres.modell).toBe("claude-x");
    expect(eredmeny.meres.tokenek_be).toBe(12);
    expect(eredmeny.meres.tokenek_ki).toBe(3);
    expect(eredmeny.meres.becsult_usd).toBe(0);
    expect(eredmeny.meres.allapot).toBe("ok");

    expect(utolsoKeresTorzs).toMatchObject({
      szolgaltato: "claude",
      rendszer: "Rendszer utasitas",
      szoveg: "Hello",
      nyelv: "hu",
      idokorlatMs: expect.any(Number),
    });
  });

  it("sikeres codex hivas", async () => {
    valasz = {
      statusz: 200,
      torzs: { szoveg: "Szia", modell: "codex-x", tokenek_be: 5, tokenek_ki: 2, ido_ms: 30 },
    };

    const eredmeny = await codexElofizetesSzolgaltato.hiv({
      feladat: "javaslatok",
      rendszer: "Rendszer",
      szoveg: "Kerdes",
      nyelv: "en",
    });

    expect(eredmeny.meres.szolgaltato).toBe("codex-elofizetes");
    expect(utolsoKeresTorzs).toMatchObject({
      szolgaltato: "codex",
    });
  });

  it("503 NINCS_BELEPO → AI_NINCS_KULCS", async () => {
    valasz = { statusz: 503, torzs: { hiba: "NINCS_BELEPO" } };

    await expect(
      claudeElofizetesSzolgaltato.hiv({
        feladat: "osszefoglalo",
        rendszer: "R",
        szoveg: "S",
        nyelv: "hu",
      })
    ).rejects.toSatisfy((hiba: unknown) => hiba instanceof AiHiba && hiba.kod === "AI_NINCS_KULCS");
  });

  it("502 AI_NEM_ELERHETO → AI_NEM_ELERHETO", async () => {
    valasz = { statusz: 502, torzs: { hiba: "AI_NEM_ELERHETO" } };

    await expect(
      claudeElofizetesSzolgaltato.hiv({
        feladat: "osszefoglalo",
        rendszer: "R",
        szoveg: "S",
        nyelv: "hu",
      })
    ).rejects.toSatisfy((hiba: unknown) => hiba instanceof AiHiba && hiba.kod === "AI_NEM_ELERHETO");
  });

  it("200 ures szoveg → AI_ROSSZ_VALASZ", async () => {
    valasz = {
      statusz: 200,
      torzs: { szoveg: "", modell: "x", tokenek_be: 1, tokenek_ki: 0, ido_ms: 10 },
    };

    await expect(
      claudeElofizetesSzolgaltato.hiv({
        feladat: "osszefoglalo",
        rendszer: "R",
        szoveg: "S",
        nyelv: "hu",
      })
    ).rejects.toSatisfy((hiba: unknown) => hiba instanceof AiHiba && hiba.kod === "AI_ROSSZ_VALASZ");
  });

  it("idotullepes → AI_NEM_ELERHETO", async () => {
    valasz = {
      statusz: 200,
      torzs: { szoveg: "Kesik", modell: "x", tokenek_be: 1, tokenek_ki: 1, ido_ms: 5000 },
    };

    // kesleltetett valasz a szerver oldalon
    const eredetiSzerver = szerver;
    const kesleltetoSzerver = createServer((req, res) => {
      if (req.url === "/hiv" && req.method === "POST") {
        let test = "";
        req.on("data", (chunk) => { test += chunk; });
        req.on("end", () => {
          try {
            utolsoKeresTorzs = JSON.parse(test);
          } catch {
            utolsoKeresTorzs = test;
          }
          setTimeout(() => {
            res.writeHead(valasz.statusz, { "content-type": "application/json" });
            res.end(JSON.stringify(valasz.torzs));
          }, 200);
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>((resolve) => {
      kesleltetoSzerver.listen(0, "127.0.0.1", () => {
        const cim = kesleltetoSzerver.address();
        if (cim && typeof cim === "object") {
          process.env["AI_HID_CIM"] = `http://127.0.0.1:${cim.port}`;
        }
        resolve();
      });
    });

    await expect(
      claudeElofizetesSzolgaltato.hiv({
        feladat: "osszefoglalo",
        rendszer: "R",
        szoveg: "S",
        nyelv: "hu",
        idokorlatMs: 100,
      })
    ).rejects.toSatisfy((hiba: unknown) => hiba instanceof AiHiba && hiba.kod === "AI_NEM_ELERHETO");

    await new Promise<void>((resolve) => {
      kesleltetoSzerver.close(() => resolve());
    });
    process.env["AI_HID_CIM"] = szerverCim;
  });
});
