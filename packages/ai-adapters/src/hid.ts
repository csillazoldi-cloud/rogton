import { z } from "zod";
import { AiHiba, idokorlattal, type HivasKeres, type HivasValasz, type Szolgaltato, type SzolgaltatoLeirolap } from "./alap";

const HidValaszSema = z.object({
  szoveg: z.string(),
  modell: z.string(),
  tokenek_be: z.number(),
  tokenek_ki: z.number(),
  ido_ms: z.number(),
});

interface HidBeallitas {
  azonosito: "claude-elofizetes" | "codex-elofizetes";
  nev: string;
  hidNev: "claude" | "codex";
  modellEnv: "CLAUDE_MODELL" | "CODEX_MODELL";
}

function leirolap(beallitas: HidBeallitas): () => SzolgaltatoLeirolap {
  return () => ({
    azonosito: beallitas.azonosito,
    nev: beallitas.nev,
    hol: "felho",
    orszag: "USA",
    nyelvek: ["hu", "ro", "en"],
    modell: process.env[beallitas.modellEnv] ?? beallitas.hidNev,
    ar_be_usd_1m: 0,
    ar_ki_usd_1m: 0,
    feladatok: ["osszefoglalo", "javaslatok", "hangnem_finomitas", "arculat_javaslat", "iranytu_javaslat", "poszt_szoveg", "poszt_atiras", "poszt_forditas", "poszt_nyelvre_szabas", "poszt_osszhang", "kep_peldak", "kozlemeny_kitoltes", "kinalat_kiolvasas", "program_kiolvasas", "temak_terv", "poszt_tipus"],
  });
}

export function hidSzolgaltato(beallitas: HidBeallitas): Szolgaltato {
  const leiro = leirolap(beallitas);
  return {
    leirolap: leiro(),
    async hiv(keres: HivasKeres): Promise<HivasValasz> {
      const t0 = Date.now();
      const l = leiro();
      const cim = process.env["AI_HID_CIM"] ?? "http://ai-hid:8500";
      const sajatIdokorlat = keres.idokorlatMs ?? 90_000;
      const hidIdokorlat = Math.max(10_000, sajatIdokorlat - 5_000);

      try {
        const valasz = await idokorlattal(sajatIdokorlat, keres.jel, async (jel) => {
          const valasz = await fetch(`${cim}/hiv`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              szolgaltato: beallitas.hidNev,
              rendszer: keres.rendszer,
              szoveg: keres.szoveg,
              nyelv: keres.nyelv,
              maxKiToken: keres.maxKiToken,
              idokorlatMs: hidIdokorlat,
            }),
            signal: jel,
          });
          return valasz;
        });

        if (!valasz.ok) {
          const statusz = valasz.status;
          if (statusz === 503) {
            throw new AiHiba("AI_NINCS_KULCS");
          }
          if (statusz === 400) {
            throw new AiHiba("AI_NEM_ELERHETO", `HTTP ${statusz} ROSSZ_KERES`);
          }
          if (statusz === 429) {
            throw new AiHiba("AI_NEM_ELERHETO", `HTTP ${statusz} TUL_SOK`);
          }
          const hibaKod = statusz === 502 ? "AI_NEM_ELERHETO" : "AI_NEM_ELERHETO";
          throw new AiHiba("AI_NEM_ELERHETO", `HTTP ${statusz} ${hibaKod}`);
        }

        const adat: unknown = await valasz.json();
        const ellenorzott = HidValaszSema.safeParse(adat);
        if (!ellenorzott.success || ellenorzott.data.szoveg.length === 0) {
          throw new AiHiba("AI_ROSSZ_VALASZ");
        }

        const { szoveg, modell, tokenek_be, tokenek_ki } = ellenorzott.data;
        return {
          szoveg,
          meres: {
            szolgaltato: beallitas.azonosito,
            modell,
            feladat: keres.feladat,
            tokenek_be,
            tokenek_ki,
            becsult_usd: 0,
            ido_ms: Date.now() - t0,
            allapot: "ok",
          },
        };
      } catch (hiba) {
        if (hiba instanceof AiHiba) {
          throw hiba;
        }
        throw new AiHiba("AI_NEM_ELERHETO", "hálózati hiba", hiba);
      }
    },
  };
}

export const claudeElofizetesSzolgaltato: Szolgaltato = hidSzolgaltato({
  azonosito: "claude-elofizetes",
  nev: "Claude (előfizetés, Claude Code-on át)",
  hidNev: "claude",
  modellEnv: "CLAUDE_MODELL",
});

export const codexElofizetesSzolgaltato: Szolgaltato = hidSzolgaltato({
  azonosito: "codex-elofizetes",
  nev: "ChatGPT (előfizetés, Codexen át)",
  hidNev: "codex",
  modellEnv: "CODEX_MODELL",
});
