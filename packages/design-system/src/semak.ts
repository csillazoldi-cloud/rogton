// R-10 (2026-09-18, Vilmos): három, egy kattintással váltható színséma — Éjkék (a mostani), Világos, Sötét.
// A séma = tokenkészlet (TemaFelulirasok), amit a meglévő téma-tár új verzióként alkalmaz. Kód a felületben nem
// változik, csak tokenértékek. Az Éjkék értékeit NEM kézzel írjuk be: a tema-alap.json-ból olvassuk ki futásidőben
// ugyanezekre a kulcsokra, így a mostani téma mindig visszaállítható.
import type { TemaFelulirasok } from "./tema-szintek";
import type { AlapTokenek } from "./tokenek";
import { TemaFelulirasok as TemaFelulirasokSema } from "./tema-szintek";
import alap from "./tema-alap.json";

export type SemaKod = "ejkek" | "vilagos" | "sotet" | "vegyes";

export type Sema = {
  kod: SemaKod;
  nev: Record<"hu" | "ro" | "en", string>;
  leiras: Record<"hu" | "ro" | "en", string>;
  tokenek: TemaFelulirasok;
};

/** A három séma által érintett kulcsok — pontosan a szerződés táblázatából. */
export const SEMA_KULCSOK = [
  "--bg",
  "--bg-elev",
  "--text",
  "--text-mut",
  "--text-dim",
  "--text-faint",
  "--on-primary",
  "--primary",
  "--primary-2",
  "--accent",
  "--accent-text",
  "--accent-link",
  "--ok",
  "--illesztve",
  "--err",
  "--focus",
  "--shadow-color",
  "--shadow-strength",
  "--font-display",
  "--accent-warm",
  "--accent-gold",
  "--aurora-opacity",
  "--orb-size",
  "--glass-alpha",
  "--r-card",
  "--r-btn",
] as const;

type SemaKulcs = (typeof SEMA_KULCSOK)[number];

/** Az Éjkék értékeit a tema-alap.json-ból olvassuk ki ugyanezekre a kulcsokra. */
function ejkekTokenek(): Record<SemaKulcs, string> {
  const tokens = (alap as { tokens: Record<string, string> }).tokens;
  const ki = {} as Record<SemaKulcs, string>;
  for (const k of SEMA_KULCSOK) {
    const v = tokens[k];
    if (typeof v !== "string") throw new Error(`A tema-alap.json-bol hianyzik a ${k} token`);
    ki[k] = v;
  }
  return ki;
}

const VILAGOS_TOKENEK: Record<SemaKulcs, string> = {
  "--bg": "#F7F7F5",
  "--bg-elev": "#FFFFFF",
  "--text": "#1C1C1A",
  "--text-mut": "#63635C",
  "--text-dim": "#75756E",
  "--text-faint": "#8A8A82",
  "--on-primary": "#FFFFFF",
  "--primary": "#4A63E7",
  "--primary-2": "#4A63E7",
  "--accent": "#C2410C",
  "--accent-text": "#9A3412",
  "--accent-link": "#3B52D1",
  "--ok": "#1F7A4D",
  "--illesztve": "#8A6A12",
  "--err": "#B42318",
  "--focus": "#4A63E7",
  "--shadow-color": "#000000",
  "--shadow-strength": "8",
  "--font-display": "'Manrope',sans-serif",
  "--accent-warm": "#C2410C",
  "--accent-gold": "#B7791F",
  "--aurora-opacity": "0",
  "--orb-size": "44px", // a szabály alsó határa (44–120); a korong marad, ragyogás nélkül
  "--glass-alpha": "4",
  "--r-card": "14px",
  "--r-btn": "10px",
};

// R-15 (Design javaslata, 2026-09-26): „Vegyes” — világos lap, sötét teendő-blokkok és felső sáv, átmenetes fő gomb.
// A sötét blokkok a apps/web/app/_kozos/r15.css [data-sema="vegyes"] hatókörében kapják a saját tokenjeiket.
// VILMOS MÉG NEM DÖNTÖTT RÓLA: ezért NINCS a SEMAK listában (nem választható, nem ismerhető fel) — a KESZULO_SEMAK-ban vár.
const VEGYES_TOKENEK: Record<SemaKulcs, string> = {
  ...VILAGOS_TOKENEK,
  "--bg": "#F3F4F7",
  "--bg-elev": "#FFFFFF",
  "--text": "#1A1C24",
  "--text-mut": "#535A68",
  "--text-dim": "#6F7684",
  "--primary": "#4F5FD6",
  "--primary-2": "#A06FF6",
  "--accent": "#D8471F",
  "--accent-text": "#B93C19",
  "--accent-link": "#4F5FD6",
  "--ok": "#25764A",
  "--err": "#C0392B",
  "--focus": "#4F5FD6",
};

const SOTET_TOKENEK: Record<SemaKulcs, string> = {
  "--bg": "#15161C",
  "--bg-elev": "#1D1F27",
  "--text": "#ECEDF1",
  "--text-mut": "#A2A5B3",
  "--text-dim": "#8E91A0",
  "--text-faint": "#7C8090",
  "--on-primary": "#FFFFFF",
  "--primary": "#5563E8",
  "--primary-2": "#5563E8",
  "--accent": "#FF8A65",
  "--accent-text": "#FFB39F",
  "--accent-link": "#9DA8FF",
  "--ok": "#7FE0A0",
  "--illesztve": "#E6C065",
  "--err": "#FFB3A3",
  "--focus": "#8A98FF",
  "--shadow-color": "#000000",
  "--shadow-strength": "35",
  "--font-display": "'Manrope',sans-serif",
  "--accent-warm": "#FF8A65",
  "--accent-gold": "#FFB86B",
  "--aurora-opacity": "0",
  "--orb-size": "44px", // a szabály alsó határa (44–120); a korong marad, ragyogás nélkül
  "--glass-alpha": "8",
  "--r-card": "14px",
  "--r-btn": "10px",
};

// A modul betöltésekor minden token átmegy a TemaFelulirasok sémán — elgépelt kulcs nem kerülhet ki.
function ellenorzott(tokenek: Record<SemaKulcs, string>): TemaFelulirasok {
  return TemaFelulirasokSema.parse(tokenek);
}

export const SEMAK: readonly Sema[] = [
  {
    kod: "ejkek",
    nev: { hu: "Éjkék", ro: "Albastru de noapte", en: "Night blue" },
    leiras: {
      // 2026-09-21 (Vilmos, D2): a fényudvar kikerült (--aurora-opacity 0 a tema-alap.json-ban is).
      hu: "Az alap: mély éjkék háttér, indigó gombok.",
      ro: "Cel de bază: fundal albastru-noapte, butoane indigo.",
      en: "The default: deep night-blue background, indigo buttons.",
    },
    tokenek: ellenorzott(ejkekTokenek()),
  },
  {
    kod: "vilagos",
    nev: { hu: "Világos", ro: "Luminos", en: "Light" },
    leiras: {
      hu: "Törtfehér alap, kék gombok, nyugodt.",
      ro: "Fundal alb cald, butoane albastre, calm.",
      en: "Warm white base, blue buttons, calm.",
    },
    tokenek: ellenorzott(VILAGOS_TOKENEK),
  },
  {
    kod: "sotet",
    nev: { hu: "Sötét", ro: "Întunecat", en: "Dark" },
    leiras: {
      hu: "Meleg sötétszürke, kék-lila csak a gombon.",
      ro: "Gri închis cald, albastru-violet doar pe buton.",
      en: "Warm dark grey, blue-purple only on the button.",
    },
    tokenek: ellenorzott(SOTET_TOKENEK),
  },
];

/** R-15: a Design által javasolt, még el nem döntött sémák — nem választhatók, amíg Vilmos nem dönt. */
export const KESZULO_SEMAK: readonly Sema[] = [
  {
    kod: "vegyes",
    nev: { hu: "Vegyes", ro: "Mixt", en: "Mixed" },
    leiras: {
      hu: "Világos lap, sötét blokkban az, amivel dolgod van.",
      ro: "Pagină luminoasă, în bloc întunecat ce ai de făcut.",
      en: "Light page; what needs you sits in a dark block.",
    },
    tokenek: ellenorzott(VEGYES_TOKENEK),
  },
];

/** Séma keresése kód alapján; ismeretlen kód → null. */
export function semaKeres(kod: string): Sema | null {
  return SEMAK.find((s) => s.kod === kod) ?? null;
}

// ---------------------------------------------------------------------------
// 2026-09-21 (Vilmos, D1): sémaváltáskor a tulajdonos SAJÁT fő színe és betűmérete megmarad.
// A séma a háttereket, szövegszíneket, formát cseréli; a Megjelenés lapon választott fő szín és
// betűméret a tulajdonosé.
// ---------------------------------------------------------------------------

/** A betűméret tokenjei — a Megjelenés lap „Betűméret” választója ezeket állítja. Sémaváltáskor megmaradnak. */
export const SAJAT_BETU_KULCSOK = ["--fs-base", "--fs-title", "--fs-h1"] as const;

const FO_SZIN_KULCSOK: readonly string[] = ["--primary", "--primary-2"];

function azonos(a: string | undefined, b: string | undefined): boolean {
  return a !== undefined && b !== undefined && a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Melyik sémát mutatja ez a tokenkészlet? A fő szín párja nem számít (azt a tulajdonos átírhatja),
 * a többi séma-tokennek egyeznie kell. Nincs egyezés → null (saját, egyedi készlet).
 */
export function semaFelismer(tokenek: Partial<Record<string, string>>): SemaKod | null {
  for (const s of SEMAK) {
    const st = s.tokenek as Partial<Record<string, string>>;
    const egyezik = SEMA_KULCSOK.every((k) => FO_SZIN_KULCSOK.includes(k) || azonos(tokenek[k], st[k]));
    if (egyezik) return s.kod;
  }
  return null;
}

/**
 * Az új séma felülírásai úgy, hogy a tulajdonos saját beállításai megmaradnak:
 * - a betűméret (SAJAT_BETU_KULCSOK), ha a munkatér felülírta;
 * - a fő szín párja, ha eltér a mostani séma saját fő színétől (vagyis a tulajdonos választotta).
 * `hatasos` = a munkatér mostani hatásos készlete, `felulirasok` = a mostani alkalmazott felülírásai.
 */
export function semaraValt(
  sema: Sema,
  hatasos: AlapTokenek,
  felulirasok: TemaFelulirasok | null | undefined,
): TemaFelulirasok {
  const ki: Record<string, string> = { ...(sema.tokenek as Record<string, string>) };
  const fel = (felulirasok ?? {}) as Partial<Record<string, string>>;
  for (const k of SAJAT_BETU_KULCSOK) {
    const v = fel[k];
    if (v !== undefined) ki[k] = v;
  }
  const elozo = SEMAK.find((s) => s.kod === semaFelismer(hatasos));
  const elozoFo = elozo ? (elozo.tokenek as Partial<Record<string, string>>)["--primary"] : undefined;
  if (elozoFo !== undefined && !azonos(hatasos["--primary"], elozoFo)) {
    ki["--primary"] = hatasos["--primary"];
    ki["--primary-2"] = hatasos["--primary-2"];
  }
  return TemaFelulirasokSema.parse(ki);
}
