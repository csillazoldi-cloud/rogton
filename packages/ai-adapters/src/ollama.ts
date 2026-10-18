import { AiHiba, idokorlattal, type HivasKeres, type HivasValasz, type Szolgaltato, type SzolgaltatoLeirolap } from "./alap";

// A GPU sora: a helyi hívások EGYSZERRE EGY — modulszintű (globalThis-őrzött) ígéret-lánc.
// Két párhuzamos hívás ne fussa egyszerre a kártyát.
const globalKulcs = "km-ollama-sor";
type SorTipus = { utolso: Promise<unknown> };
function sor(): SorTipus {
  const glob = globalThis as Record<string, unknown>;
  if (!glob[globalKulcs]) {
    glob[globalKulcs] = { utolso: Promise.resolve() };
  }
  return glob[globalKulcs] as SorTipus;
}

function leirolap(): SzolgaltatoLeirolap {
  return {
    azonosito: "helyi-ollama",
    nev: "Helyi Ollama (Dell, Qwen)",
    hol: "helyi",
    orszag: "Románia",
    nyelvek: ["hu", "ro", "en"],
    modell: process.env["OLLAMA_MODELL"] ?? "qwen3.8:27b",
    ar_be_usd_1m: 0,
    ar_ki_usd_1m: 0,
    feladatok: ["osszefoglalo", "javaslatok", "hangnem_finomitas", "arculat_javaslat", "hf_beallitas_javaslat", "hf_relevancia", "hf_osszkep", "hf_ugyanaz_az_esemeny", "hf_szabaly_javaslat", "hf_tartalomotlet", "hf_szolista", "hf_cim_szures", "iranytu_javaslat", "poszt_szoveg", "poszt_atiras", "poszt_forditas", "poszt_nyelvre_szabas", "poszt_osszhang", "kep_peldak", "kozlemeny_kitoltes", "kinalat_kiolvasas", "program_kiolvasas", "temak_terv", "poszt_tipus"],
  };
}

interface OllamaValasz {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

async function hivEgyszer(keres: HivasKeres, jel: AbortSignal): Promise<Response> {
  const l = leirolap();
  const cim = process.env["OLLAMA_URL"] ?? "http://192.168.1.188:11434";
  const torzs: Record<string, unknown> = {
    model: l.modell,
    messages: [
      { role: "system", content: keres.rendszer },
      { role: "user", content: keres.szoveg },
    ],
    stream: false,
    format: "json",
    options: { temperature: 0, num_predict: keres.maxKiToken ?? 400 },
    // A modell maradjon betöltve a futás (és a napi futások) között — a hideg betöltés ~30 mp.
    keep_alive: process.env["OLLAMA_KEEP_ALIVE"] ?? "30m",
    think: false,
  };
  const valasz = await fetch(`${cim}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(torzs),
    signal: jel,
  });
  // Ha a szerver 400-at ad a think: false-ra, próbáld nélküle egyszer
  if (valasz.status === 400) {
    delete torzs["think"];
    return fetch(`${cim}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(torzs),
      signal: jel,
    });
  }
  return valasz;
}

export const ollamaSzolgaltato: Szolgaltato = {
  leirolap: leirolap(),
  async hiv(keres: HivasKeres): Promise<HivasValasz> {
    const t0 = Date.now();
    const l = leirolap();
    const maxVarMs = Number(process.env["OLLAMA_MAX_VAR_MS"] ?? "600000"); // alap 10 perc
    const sajatIdokorlat = keres.idokorlatMs ?? 120_000;

    try {
      // Sorba állás (a GPU sora): a helyet SZINKRON foglaljuk le — a következő hívó a MI végünket várja, nem az előzőt,
      // így két egyszerre érkező hívás sem indulhat egyszerre. Ha a várakozás a korlátnál hosszabb: AI_NEM_ELERHETO.
      const sorban = sor();
      const elozo = sorban.utolso;
      let sajatVege!: () => void;
      const sajatVegIge = new Promise<void>((megold) => { sajatVege = megold; });
      sorban.utolso = elozo.then(() => sajatVegIge, () => sajatVegIge);
      let varasMegszakitva = false;
      await new Promise<void>((megold) => {
        const idozito = setTimeout(() => { varasMegszakitva = true; megold(); }, maxVarMs);
        elozo.then(() => { clearTimeout(idozito); megold(); }, () => { clearTimeout(idozito); megold(); });
      });
      if (varasMegszakitva) {
        sajatVege();
        throw new AiHiba("AI_NEM_ELERHETO", "túl sokat várt a GPU-sorban");
      }

      // A tényleges hívás a láncban
      const hivasIge = (async () => {
        try {
          return await idokorlattal(sajatIdokorlat, keres.jel, async (jel) => {
            const valasz = await hivEgyszer(keres, jel);
            if (!valasz.ok) {
              throw new AiHiba("AI_NEM_ELERHETO", `HTTP ${valasz.status}`);
            }
            const adat: unknown = await valasz.json();
            const ellenorzott = adat as OllamaValasz;
            const szoveg = ellenorzott?.message?.content;
            if (typeof szoveg !== "string" || szoveg.length === 0) {
              throw new AiHiba("AI_ROSSZ_VALASZ");
            }
            const be = ellenorzott?.prompt_eval_count ?? 0;
            const ki = ellenorzott?.eval_count ?? 0;
            return {
              szoveg,
              meres: {
                szolgaltato: "helyi-ollama",
                modell: l.modell,
                feladat: keres.feladat,
                tokenek_be: be,
                tokenek_ki: ki,
                becsult_usd: 0,
                ido_ms: Date.now() - t0,
                allapot: "ok" as const,
              },
            };
          });
        } catch (hiba) {
          if (hiba instanceof AiHiba) {
            throw hiba;
          }
          throw new AiHiba("AI_NEM_ELERHETO", "hálózati hiba", hiba);
        }
      })();

      try {
        return await hivasIge;
      } finally {
        sajatVege(); // a következő hívó innen indulhat
      }
    } catch (hiba) {
      if (hiba instanceof AiHiba) {
        throw hiba;
      }
      throw new AiHiba("AI_NEM_ELERHETO", "hálózati hiba", hiba);
    }
  },
};

/** A Dell Ollama elérhetőségének ellenőrzése — a felület/ellenőrzés használja. */
export async function ollamaElerheto(): Promise<{ ok: boolean; modellek: string[]; fut: string[] }> {
  const cim = process.env["OLLAMA_URL"] ?? "http://192.168.1.188:11434";
  try {
    const [tagsValasz, psValasz] = await Promise.all([
      idokorlattal(5000, undefined, (jel) => fetch(`${cim}/api/tags`, { signal: jel })),
      idokorlattal(5000, undefined, (jel) => fetch(`${cim}/api/ps`, { signal: jel })),
    ]);
    if (!tagsValasz.ok || !psValasz.ok) {
      return { ok: false, modellek: [], fut: [] };
    }
    const tagsAdat = await tagsValasz.json() as { models?: Array<{ name?: string }> };
    const psAdat = await psValasz.json() as { models?: Array<{ name?: string }> };
    const modellek = (tagsAdat.models ?? []).map((m) => m.name ?? "").filter(Boolean);
    const fut = (psAdat.models ?? []).map((m) => m.name ?? "").filter(Boolean);
    return { ok: true, modellek, fut };
  } catch {
    return { ok: false, modellek: [], fut: [] };
  }
}
