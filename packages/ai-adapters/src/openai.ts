// OpenAI API (T-25, D-F37): a tesztoldal hírfigyelője a Dell Ollamája helyett — Vilmos döntése 2026-09-13.
// Chat Completions végpont, API-kulccsal (OPENAI_API_KEY a NAS .env-jében, a vault/openai-key.txt-ből). A modell: OPENAI_MODELL (alap gpt-5-mini).
// Ugyanaz a szerződés, mint az Anthropic-csatlakozónál: feladatot kap, leírólapot ad, a költséget méri; a kulcs hiánya AI_NINCS_KULCS, minden más AI_NEM_ELERHETO / AI_ROSSZ_VALASZ.
import { AiHiba, koltseg, idokorlattal, type HivasKeres, type HivasValasz, type Szolgaltato, type SzolgaltatoLeirolap } from "./alap";

/** USD / 1 millió token — az OpenAI 2025-08-i árlistája (gpt-5 család); ismeretlen modellnél óvatos becslés. A Költség lap ebből számol. */
const ARAK: Record<string, { be: number; ki: number }> = {
  "gpt-5": { be: 1.25, ki: 10 },
  "gpt-5-mini": { be: 0.25, ki: 2 },
  "gpt-5-nano": { be: 0.05, ki: 0.4 },
  "gpt-4.1": { be: 2, ki: 8 },
  "gpt-4.1-mini": { be: 0.4, ki: 1.6 },
};

function leirolap(): SzolgaltatoLeirolap {
  const modell = process.env["OPENAI_MODELL"] ?? "gpt-5-mini";
  return {
    azonosito: "openai",
    nev: "OpenAI (API)",
    hol: "felho",
    orszag: "USA",
    nyelvek: ["hu", "ro", "en"],
    modell,
    ar_be_usd_1m: ARAK[modell]?.be ?? 2,
    ar_ki_usd_1m: ARAK[modell]?.ki ?? 8,
    // minden feladat: a hírfigyelő is ezen a csatlakozón fut (T-25)
    feladatok: ["osszefoglalo", "javaslatok", "hangnem_finomitas", "arculat_javaslat", "hf_beallitas_javaslat", "hf_relevancia", "hf_osszkep", "hf_szabaly_javaslat", "hf_tartalomotlet", "hf_szolista", "hf_cim_szures", "hf_ugyanaz_az_esemeny", "iranytu_javaslat", "poszt_szoveg", "poszt_atiras", "poszt_forditas", "poszt_nyelvre_szabas", "poszt_osszhang", "kep_peldak", "kozlemeny_kitoltes", "kinalat_kiolvasas", "program_kiolvasas", "temak_terv", "poszt_tipus"],
  };
}

interface OpenAiValasz {
  choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/** A válasz nyelvének megerősítése a rendszerutasítás végén — a mezők szövege a felület nyelvén legyen, a JSON-kulcsok változatlanul. */
export function nyelviZaradek(nyelv: string): string {
  switch (nyelv) {
    case "ro": return "Toate câmpurile de text din răspuns trebuie scrise în limba română. Cheile JSON rămân neschimbate.";
    case "en": return "Every text field in the answer must be written in English. JSON keys stay unchanged.";
    default: return "A válasz minden szöveges mezője magyarul legyen. A JSON-kulcsok változatlanok maradnak.";
  }
}

async function hivEgyszer(keres: HivasKeres, jel: AbortSignal): Promise<Response> {
  const kulcs = process.env["OPENAI_API_KEY"]?.trim();
  if (!kulcs) throw new AiHiba("AI_NINCS_KULCS");
  const l = leirolap();
  return fetch(process.env["OPENAI_URL"] ?? "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${kulcs}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: l.modell,
      // a gpt-5 család a max_completion_tokens-t várja (a max_tokens-t elutasítja); hőfok nem állítható rajta, ezért nem küldjük.
      // MÉRVE 2026-09-13 a teszten: alapbeállítással a modell a 400 tokenes keretet MIND a saját gondolkodására költötte (reasoning_tokens 400,
      // finish_reason "length", üres válasz → AI_ROSSZ_VALASZ, 10/10 hívás); minimális gondolkodással 72 tokenből jó JSON-t adott. Ezért a gpt-5 családnál
      // reasoning_effort: "minimal" — a hírfigyelő feladatai rövid, szerkezetes válaszok, nem érvelés.
      max_completion_tokens: keres.maxKiToken ?? 400,
      // 2026-09-22: a szigorú hírszűrő (hf_relevancia) "low"-t kér — minimális gondolkodással a több feltételes szabályt nem tartotta be (mérve).
      ...(l.modell.startsWith("gpt-5") || l.modell.startsWith("o") ? { reasoning_effort: keres.gondolkodas ?? "minimal" } : {}),
      messages: [
        // MÉRVE 2026-09-13: a gpt-5-mini minimális gondolkodással a rendszerutasítás nyelvi kérését átlépte, és angolul indokolt (a többi szolgáltató nem) —
        // ezért a rendszerutasítás végére a válasz nyelve még egyszer, a saját nyelvén, kimondva
        { role: "system", content: keres.nyelvSzabad ? keres.rendszer : `${keres.rendszer}

${nyelviZaradek(keres.nyelv)}` },
        { role: "user", content: keres.szoveg },
      ],
    }),
    signal: jel,
  });
}

export const openaiSzolgaltato: Szolgaltato = {
  leirolap: leirolap(),
  async hiv(keres: HivasKeres): Promise<HivasValasz> {
    const t0 = Date.now();
    const l = leirolap();
    try {
      const valasz = await idokorlattal(keres.idokorlatMs ?? 30000, keres.jel, async (jel) => {
        let v = await hivEgyszer(keres, jel);
        if (v.status === 429 || v.status >= 500) {
          await new Promise((r) => setTimeout(r, 1000));
          v = await hivEgyszer(keres, jel);
        }
        return v;
      });
      if (valasz.status === 401) throw new AiHiba("AI_NINCS_KULCS", "HTTP 401 — a kulcs nem érvényes");
      if (!valasz.ok) throw new AiHiba("AI_NEM_ELERHETO", `HTTP ${valasz.status}`);

      const adat = (await valasz.json()) as OpenAiValasz;
      const szoveg = adat?.choices?.[0]?.message?.content;
      if (typeof szoveg !== "string" || szoveg.length === 0) {
        const miert = adat?.choices?.[0]?.finish_reason === "length" ? "üres válasz — a kimeneti keret elfogyott (finish_reason: length)" : "üres válasz";
        throw new AiHiba("AI_ROSSZ_VALASZ", miert);
      }
      const be = adat?.usage?.prompt_tokens ?? 0;
      const ki = adat?.usage?.completion_tokens ?? 0;
      return {
        szoveg,
        meres: { szolgaltato: "openai", modell: l.modell, feladat: keres.feladat, tokenek_be: be, tokenek_ki: ki, becsult_usd: koltseg(l, be, ki), ido_ms: Date.now() - t0, allapot: "ok" },
      };
    } catch (hiba) {
      if (hiba instanceof AiHiba) throw hiba;
      throw new AiHiba("AI_NEM_ELERHETO", "hálózati hiba", hiba);
    }
  },
};
