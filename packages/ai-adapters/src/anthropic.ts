import { AiHiba, koltseg, idokorlattal, type HivasKeres, type HivasValasz, type Szolgaltato, type SzolgaltatoLeirolap } from "./alap";

const ARAK: Record<string, { be: number; ki: number }> = {
  "claude-sonnet-5": { be: 2, ki: 10 },
  "claude-haiku-4-5-20251001": { be: 1, ki: 5 },
  "claude-opus-5": { be: 5, ki: 25 },
};

function arBeUsd(modell: string): number {
  return ARAK[modell]?.be ?? 5;
}

function arKiUsd(modell: string): number {
  return ARAK[modell]?.ki ?? 25;
}

function leirolap(): SzolgaltatoLeirolap {
  const modell = process.env["AI_MODELL"] ?? "claude-sonnet-5";
  return {
    azonosito: "anthropic",
    nev: "Anthropic (Claude)",
    hol: "felho",
    orszag: "USA",
    nyelvek: ["hu", "ro", "en"],
    modell,
    ar_be_usd_1m: arBeUsd(modell),
    ar_ki_usd_1m: arKiUsd(modell),
    feladatok: ["osszefoglalo", "javaslatok", "hangnem_finomitas", "arculat_javaslat", "iranytu_javaslat", "poszt_szoveg", "poszt_atiras", "poszt_forditas", "poszt_nyelvre_szabas", "poszt_osszhang", "kep_peldak", "kozlemeny_kitoltes", "kinalat_kiolvasas", "program_kiolvasas", "temak_terv", "poszt_tipus"],
  };
}

interface AnthropicValasz {
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

async function hivEgyszer(keres: HivasKeres, jel: AbortSignal): Promise<Response> {
  const kulcs = process.env["ANTHROPIC_API_KEY"];
  if (!kulcs) {
    throw new AiHiba("AI_NINCS_KULCS");
  }
  const l = leirolap();
  const valasz = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": kulcs,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: l.modell,
      max_tokens: keres.maxKiToken ?? 400,
      system: keres.rendszer,
      messages: [{ role: "user", content: keres.szoveg }],
    }),
    signal: jel,
  });
  return valasz;
}

export const anthropicSzolgaltato: Szolgaltato = {
  leirolap: leirolap(),
  async hiv(keres: HivasKeres): Promise<HivasValasz> {
    const t0 = Date.now();
    const l = leirolap();
    try {
      const valasz = await idokorlattal(keres.idokorlatMs ?? 30000, keres.jel, async (jel) => {
        let valasz = await hivEgyszer(keres, jel);
        if (valasz.status === 429 || valasz.status >= 500) {
          await new Promise((r) => setTimeout(r, 1000));
          valasz = await hivEgyszer(keres, jel);
        }
        return valasz;
      });

      if (!valasz.ok) {
        throw new AiHiba("AI_NEM_ELERHETO", `HTTP ${valasz.status}`);
      }

      const adat: unknown = await valasz.json();
      const ellenorzott = adat as AnthropicValasz;
      const szoveg = ellenorzott?.content?.[0]?.text;
      if (typeof szoveg !== "string" || szoveg.length === 0) {
        throw new AiHiba("AI_ROSSZ_VALASZ");
      }
      const be = ellenorzott?.usage?.input_tokens ?? 0;
      const ki = ellenorzott?.usage?.output_tokens ?? 0;
      return {
        szoveg,
        meres: {
          szolgaltato: "anthropic",
          modell: l.modell,
          feladat: keres.feladat,
          tokenek_be: be,
          tokenek_ki: ki,
          becsult_usd: koltseg(l, be, ki),
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
