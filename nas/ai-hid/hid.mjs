// AI-híd doboz: a Claude Code és a Codex programok képernyő nélküli futtatása HTTP mögött.
// Külső csomag nélkül, csak node:http, node:child_process, node:fs, node:os, node:path.
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = Number(process.env.PORT || 8500);
const MAX_PARHUZAMOS = Number(process.env.MAX_PARHUZAMOS || 2);
const MAX_TORZS = 1024 * 1024; // 1 MB
const HOME = "/home/node";
const CLAUDE_BELEPO = process.env.CLAUDE_CODE_OAUTH_TOKEN || "";
const CODEX_BELEPO_UT = "/home/node/.codex/auth.json";
const CODEX_MODELL = process.env.CODEX_MODELL || "";
const CLAUDE_MODELL = process.env.CLAUDE_MODELL || "";

let futo = 0; // egyidejű hívások száma

// --- Segédfüggvények ---
function jsonValasz(res, status, obj) {
  const torzs = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(torzs) });
  res.end(torzs);
}

function hibaValasz(res, kod, reszlet) {
  jsonValasz(res, kod === "ROSSZ_KERES" ? 400 : kod === "NINCS_BELEPO" ? 503 : kod === "TUL_SOK" ? 429 : 502, { hiba: kod, reszlet });
}

function naplo(sor) {
  console.log(JSON.stringify({ ido: new Date().toISOString(), ...sor }));
}

// Hány gyerekfolyamat ÉL még (nem az, hogy hány válasz készült el). Biztonsági felülvizsgálat
// 2026-09-10 (B-05): a párhuzamossági helyet korábban a VÁLASZ lezárása szabadította fel, így egy
// meg nem halt folyamat mellé máris indulhatott a következő.
let eloFolyamatok = 0;

// --- Futtatás időkorláttal ---
function futtatasIdokorlattal(parancs, args, opts, idokorlatMs, bemenet) {
  return new Promise((megold) => {
    // sajat folyamatcsoport: a kenyszerleallitas az egesz fat elviszi, nem csak a kozvetlen gyereket
    const gyerek = spawn(parancs, args, { ...opts, detached: true });
    eloFolyamatok++;
    if (bemenet !== undefined && gyerek.stdin) { gyerek.stdin.on("error", () => {}); gyerek.stdin.end(bemenet); }
    let kimenet = "";
    let hibakimenet = "";
    let idozito = null;
    let kesz = false;      // a VÁLASZ elkészült (a hívó megkapta)
    let kilepett = false;  // a FOLYAMAT tényleg kilépett

    const befejez = (eredmeny) => {
      if (kesz) return;
      kesz = true;
      if (idozito) clearTimeout(idozito);
      megold(eredmeny);
    };

    const kilepes = () => {
      if (kilepett) return;
      kilepett = true;
      eloFolyamatok = Math.max(0, eloFolyamatok - 1);
    };

    gyerek.stdout.on("data", (d) => { kimenet += d.toString(); });
    gyerek.stderr.on("data", (d) => { hibakimenet += d.toString(); });
    gyerek.on("error", (e) => { kilepes(); befejez({ kod: 1, kimenet, hibakimenet, hiba: e.message }); });
    gyerek.on("close", (kod) => { kilepes(); befejez({ kod: kod ?? 1, kimenet, hibakimenet }); });

    idozito = setTimeout(() => {
      // a saját folyamatcsoportnak szól, hogy a gyerek gyerekei is megkapják
      try { process.kill(-gyerek.pid, "SIGTERM"); } catch { try { gyerek.kill("SIGTERM"); } catch { /* mar nincs */ } }
      // A kényszerleállítás feltétele a FOLYAMAT kilépése (`kilepett`), NEM a válasz elkészülte.
      // Korábban itt `!kesz` állt, amit a lenti `befejez()` azonnal igazra állított — így a SIGKILL
      // SOHA nem futott le, és a SIGTERM-et figyelmen kívül hagyó folyamat örökre életben maradt.
      setTimeout(() => {
        if (!kilepett) {
          try { process.kill(-gyerek.pid, "SIGKILL"); } catch { /* nincs folyamatcsoport */ }
          try { gyerek.kill("SIGKILL"); } catch { /* mar nincs */ }
          naplo({ esemeny: "kenyszerleallitas", parancs, pid: gyerek.pid });
        }
      }, 3000);
      befejez({ kod: null, kimenet, hibakimenet, idotullepes: true, pid: gyerek.pid });
    }, idokorlatMs);
  });
}

// --- Claude ág ---
async function claudeHivas(keres, idokorlatMs) {
  if (!CLAUDE_BELEPO) return { hiba: "NINCS_BELEPO", reszlet: "A CLAUDE_CODE_OAUTH_TOKEN környezeti változó üres." };

  // FIGYELEM: "--bare" NEM lehet benne — az a belépőt (CLAUDE_CODE_OAUTH_TOKEN) is figyelmen kívül hagyja (mérve 2026-09-07 a NAS-on).
  // A CLAUDE.md-felderítést üres munkamappával kerüljük el.
  const args = ["-p", "--output-format", "json", "--no-session-persistence", "--tools", "", "--max-turns", "1", "--system-prompt", keres.rendszer];
  if (CLAUDE_MODELL) args.push("--model", CLAUDE_MODELL);
  const opts = {
    env: { ...process.env, HOME, NO_COLOR: "1", CI: "1", CLAUDE_CODE_OAUTH_TOKEN: CLAUDE_BELEPO },
    stdio: ["pipe", "pipe", "pipe"],
    cwd: os.tmpdir(),
  };
  // a felhasználói rész a program bemenetére megy, utána a bemenet lezárva
  const eredmeny = await futtatasIdokorlattal("claude", args, opts, idokorlatMs, keres.szoveg);

  if (eredmeny.idotullepes) return { hiba: "AI_NEM_ELERHETO", reszlet: "időtúllépés" };
  let valasz = null;
  try { valasz = JSON.parse(eredmeny.kimenet); } catch { valasz = null; }
  if (!valasz || typeof valasz !== "object") {
    const hibaSzoveg = (eredmeny.hibakimenet + eredmeny.kimenet).toLowerCase();
    if (hibaSzoveg.includes("authentication error") || hibaSzoveg.includes("not logged in")) {
      return { hiba: "NINCS_BELEPO", reszlet: "A Claude Code nincs belépve." };
    }
    return { hiba: "AI_NEM_ELERHETO", reszlet: (eredmeny.hibakimenet || eredmeny.kimenet || "nem elemezhető kimenet").slice(0, 200) };
  }
  if (valasz.is_error) {
    const reszlet = String(valasz.result || "").slice(0, 200);
    if (reszlet.toLowerCase().includes("authentication error") || reszlet.toLowerCase().includes("not logged in")) {
      return { hiba: "NINCS_BELEPO", reszlet };
    }
    return { hiba: "AI_NEM_ELERHETO", reszlet };
  }
  const szoveg = String(valasz.result || "");
  if (!szoveg.trim()) return { hiba: "ROSSZ_VALASZ", reszlet: "Üres válasz." };
  const hasznalat = valasz.usage || {};
  const tokenekBe = (hasznalat.input_tokens || 0) + (hasznalat.cache_creation_input_tokens || 0) + (hasznalat.cache_read_input_tokens || 0);
  const tokenekKi = hasznalat.output_tokens || 0;
  const modelKulcsok = valasz.modelUsage ? Object.keys(valasz.modelUsage) : [];
  const modell = modelKulcsok[0] || CLAUDE_MODELL || "claude";
  return { szoveg, modell, tokenek_be: tokenekBe, tokenek_ki: tokenekKi };
}

// --- Codex ág ---
async function codexHivas(keres, idokorlatMs) {
  if (!fs.existsSync(CODEX_BELEPO_UT)) return { hiba: "NINCS_BELEPO", reszlet: "A Codex belépő fájl nem létezik." };

  const mappa = fs.mkdtempSync(path.join(os.tmpdir(), "codex-"));
  const valaszUt = path.join(mappa, "valasz.txt");
  const prompt = keres.rendszer + "\n\n---\n\n" + keres.szoveg;

  try {
    fs.writeFileSync(path.join(mappa, "AGENTS.md"), keres.rendszer);

    const args = ["exec", "--json", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "-C", mappa, "-o", valaszUt, prompt];
    if (CODEX_MODELL) args.push("-m", CODEX_MODELL);

    const opts = {
      env: { ...process.env, HOME, NO_COLOR: "1", CI: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    };

    // üres bemenet, azonnal lezárva (különben a Codex a bemenetre várna: „Reading additional input from stdin…")
    const eredmeny = await futtatasIdokorlattal("codex", args, opts, idokorlatMs, "");

    if (eredmeny.idotullepes) return { hiba: "AI_NEM_ELERHETO", reszlet: "időtúllépés" };

    // Szöveg: először a -o fájl
    let szoveg = "";
    try {
      if (fs.existsSync(valaszUt)) szoveg = fs.readFileSync(valaszUt, "utf8").trim();
    } catch { /* marad üres */ }

    // JSONL elemzés
    let tokenekBe = 0, tokenekKi = 0;
    let utolsoUzenet = "";
    let hibaUzenet = ""; // a Codex saját hibaüzenete (pl. elfogyott a keret) — ezt adjuk vissza részletként
    const sorok = eredmeny.kimenet.split("\n");
    for (const sor of sorok) {
      let esemeny;
      try { esemeny = JSON.parse(sor); } catch { continue; }
      if (!esemeny || typeof esemeny !== "object") continue;

      if (esemeny.type === "turn.completed" && esemeny.usage) {
        tokenekBe = (esemeny.usage.input_tokens || 0) + (esemeny.usage.cached_input_tokens || 0);
        tokenekKi = esemeny.usage.output_tokens || 0;
      }
      if (esemeny.type === "turn.failed" && esemeny.error?.message) hibaUzenet = String(esemeny.error.message);
      else if (esemeny.type === "error" && esemeny.message && !hibaUzenet) hibaUzenet = String(esemeny.message);
      if (esemeny.type === "item.completed" && esemeny.item?.type === "agent_message" && esemeny.item?.text) {
        utolsoUzenet = esemeny.item.text;
      }
    }

    if (!szoveg) szoveg = utolsoUzenet;

    if (!szoveg && hibaUzenet) {
      const h = hibaUzenet.toLowerCase();
      if (h.includes("usage limit") || h.includes("rate limit")) return { hiba: "AI_NEM_ELERHETO", reszlet: "Codex: elfogyott a keret — " + hibaUzenet.slice(0, 200) };
      if (h.includes("login") || h.includes("unauthorized")) return { hiba: "NINCS_BELEPO", reszlet: hibaUzenet.slice(0, 200) };
      return { hiba: "AI_NEM_ELERHETO", reszlet: hibaUzenet.slice(0, 200) };
    }
    if (eredmeny.kod !== 0 && !szoveg) {
      const hibaSzoveg = (eredmeny.hibakimenet + eredmeny.kimenet).toLowerCase();
      if (hibaSzoveg.includes("login") || hibaSzoveg.includes("not logged in") || hibaSzoveg.includes("unauthorized")) {
        return { hiba: "NINCS_BELEPO", reszlet: "A Codex nincs belépve." };
      }
      return { hiba: "AI_NEM_ELERHETO", reszlet: (eredmeny.hibakimenet || eredmeny.kimenet).slice(0, 200) };
    }

    if (!szoveg.trim()) return { hiba: "ROSSZ_VALASZ", reszlet: "Üres válasz." };

    return { szoveg, modell: CODEX_MODELL || "codex", tokenek_be: tokenekBe, tokenek_ki: tokenekKi };
  } finally {
    fs.rmSync(mappa, { recursive: true, force: true });
  }
}

// --- HTTP szerver ---
const szerver = http.createServer(async (ker, valasz) => {
  const url = new URL(ker.url, `http://${ker.headers.host}`);

  if (ker.method === "GET" && url.pathname === "/allapot") {
    jsonValasz(valasz, 200, {
      claude_belepo: Boolean(CLAUDE_BELEPO),
      codex_belepo: fs.existsSync(CODEX_BELEPO_UT),
      futo,
    });
    return;
  }

  if (ker.method !== "POST" || url.pathname !== "/hiv") {
    jsonValasz(valasz, 404, { hiba: "NINCS_VEGPONT", reszlet: "Ismeretlen végpont." });
    return;
  }

  // Törzs beolvasása (max 1 MB)
  let torzs = "";
  let tulNagy = false;
  ker.on("data", (d) => {
    torzs += d;
    if (torzs.length > MAX_TORZS) { tulNagy = true; ker.destroy(); }
  });

  ker.on("end", async () => {
    if (tulNagy) { hibaValasz(valasz, "ROSSZ_KERES", "A törzs túl nagy (max 1 MB)."); return; }

    let keres;
    try { keres = JSON.parse(torzs); } catch { hibaValasz(valasz, "ROSSZ_KERES", "Nem JSON törzs."); return; }

    // Ellenőrzés
    if (!keres || typeof keres !== "object" || !["claude", "codex"].includes(keres.szolgaltato) ||
        typeof keres.rendszer !== "string" || typeof keres.szoveg !== "string" ||
        (keres.nyelv !== undefined && typeof keres.nyelv !== "string")) {
      hibaValasz(valasz, "ROSSZ_KERES", "Hiányzó vagy rossz mező.");
      return;
    }

    const idokorlatMs = Math.min(Number(keres.idokorlatMs) || 60000, 180000);

    // A helyet a MÉG ÉLŐ folyamatok is foglalják, nem csak a folyamatban lévő válaszok (B-05).
    if (Math.max(futo, eloFolyamatok) >= MAX_PARHUZAMOS) {
      hibaValasz(valasz, "TUL_SOK", "Túl sok egyidejű hívás.");
      return;
    }

    futo++;
    const t0 = Date.now();
    try {
      const eredmeny = keres.szolgaltato === "claude"
        ? await claudeHivas(keres, idokorlatMs)
        : await codexHivas(keres, idokorlatMs);

      const idoMs = Date.now() - t0;

      if (eredmeny.hiba) {
        naplo({ szolgaltato: keres.szolgaltato, modell: "", ido_ms: idoMs, tokenek_be: 0, tokenek_ki: 0, allapot: "hiba", hiba: eredmeny.hiba });
        hibaValasz(valasz, eredmeny.hiba, eredmeny.reszlet || "");
        return;
      }

      naplo({ szolgaltato: keres.szolgaltato, modell: eredmeny.modell, ido_ms: idoMs, tokenek_be: eredmeny.tokenek_be, tokenek_ki: eredmeny.tokenek_ki, allapot: "ok" });
      jsonValasz(valasz, 200, {
        szoveg: eredmeny.szoveg,
        modell: eredmeny.modell,
        tokenek_be: eredmeny.tokenek_be,
        tokenek_ki: eredmeny.tokenek_ki,
        ido_ms: idoMs,
      });
    } catch (e) {
      const idoMs = Date.now() - t0;
      naplo({ szolgaltato: keres.szolgaltato, modell: "", ido_ms: idoMs, tokenek_be: 0, tokenek_ki: 0, allapot: "hiba", hiba: "AI_NEM_ELERHETO" });
      hibaValasz(valasz, "AI_NEM_ELERHETO", String(e?.message || e));
    } finally {
      futo--;
    }
  });
});

// A szerver CSAK akkor indul, ha ez a fájl a belépési pont. Importáláskor (próbák) nem —
// így a `futtatasIdokorlattal` külön is vizsgálható, port nyitása nélkül.
const belepesiPont = process.argv[1] && process.argv[1].endsWith("hid.mjs");
if (belepesiPont) {
  szerver.listen(PORT, "0.0.0.0", () => {
    console.log(`AI-híd fut a ${PORT} porton`);
  });

  process.on("SIGTERM", () => {
    szerver.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  });
}

// Próbákhoz: a futtató és az élő folyamatok számlálója.
export { futtatasIdokorlattal };
export function eloFolyamatokSzama() { return eloFolyamatok; }
