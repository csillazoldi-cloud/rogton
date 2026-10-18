// A figyelés beállítása és verziói — tiszta szabályok, nincs tárolás.
import { z } from "zod";

export const FigyelesiCel = z.enum(["sajat_marka", "szakmai", "tartalomotlet"]);
export type FigyelesiCel = z.infer<typeof FigyelesiCel>;

export const Tema = z.object({
  nev: z.string().trim().min(1).max(120),
  nevvaltozatok: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  megkulonboztetes: z.string().trim().max(500).default(""),
});
export type Tema = z.infer<typeof Tema>;

export const Idozites = z.object({
  mod: z.enum(["kezi", "napi"]),
  ora: z.number().int().min(0).max(23).default(7),
  perc: z.number().int().min(0).max(59).default(0),
  idozona: z.string().min(1).default("Europe/Bucharest"),
});
export type Idozites = z.infer<typeof Idozites>;

export const Beallitas = z.object({
  celok: z.array(FigyelesiCel).min(1),
  temak: z.array(Tema).min(1).max(30),
  foldrajzi_fokusz: z.string().trim().max(300).default(""),
  nyelvek: z.array(z.string().length(2)).max(10).default([]),
  kizarasok: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  idozites: Idozites,
  szabad_szoveg: z.string().trim().max(2000).default(""),
});
export type Beallitas = z.infer<typeof Beallitas>;

export const BeallitasVerzio = z.object({
  verzio: z.number().int().positive(),
  allapot: z.enum(["aktiv", "korabbi"]),
  letrehozva: z.iso.datetime(),
  eredet: z.enum(["kezi", "ai_elokeszites", "ai_javaslat", "visszaallitas"]),
  beallitas: Beallitas,
});
export type BeallitasVerzio = z.infer<typeof BeallitasVerzio>;

/** A zod hibáiból {mezo, kod} párokat készít; a felület a `hirfigyelo.ellenorzes_<kod>` feliratokkal fordít. */
export function beallitasEllenoriz(be: unknown): { ok: true; beallitas: Beallitas } | { ok: false; hibak: { mezo: string; kod: string }[] } {
  const res = Beallitas.safeParse(be);
  if (res.success) return { ok: true, beallitas: res.data };
  const hibak = res.error.issues.map((i) => {
    const mezo = i.path.join(".") || "beallitas";
    // Kódok a felületnek: hiányzó mező vagy üres lista → required; rövid szöveg → too_short; hosszú → too_long; egyéb → invalid.
    let kod = "invalid";
    const tul = i as unknown as { origin?: string; minimum?: number; input?: unknown };
    if (i.code === "invalid_type" && (tul.input === undefined || tul.input === null)) kod = "required";
    else if (i.code === "too_small") kod = tul.origin === "array" ? "required" : "too_short";
    else if (i.code === "too_big") kod = "too_long";
    return { mezo, kod };
  });
  return { ok: false, hibak };
}

/** Trim, üres elemek ki, névváltozatok és kizárások egyedien, rendezve. */
export function beallitasNormalizal(b: Beallitas): Beallitas {
  const temak = b.temak.map((t) => ({
    ...t,
    nev: t.nev.trim(),
    nevvaltozatok: [...new Set(t.nevvaltozatok.map((n) => n.trim()).filter((n) => n.length > 0))].sort((a, b) => a.localeCompare(b, "hu")),
    megkulonboztetes: t.megkulonboztetes.trim(),
  }));
  return {
    ...b,
    celok: [...b.celok],
    temak,
    foldrajzi_fokusz: b.foldrajzi_fokusz.trim(),
    nyelvek: [...b.nyelvek],
    kizarasok: [...new Set(b.kizarasok.map((k) => k.trim()).filter((k) => k.length > 0))].sort((a, b) => a.localeCompare(b, "hu")),
    idozites: { ...b.idozites },
    szabad_szoveg: b.szabad_szoveg.trim(),
  };
}

/** Normalizálás után mély egyezés — változatlan mentés nem ad új verziót. */
export function beallitasAzonos(a: Beallitas, b: Beallitas): boolean {
  return JSON.stringify(beallitasNormalizal(a)) === JSON.stringify(beallitasNormalizal(b));
}

/** Új verzió: ha az aktívval azonos, nincs új; különben az aktív korabbi lesz, az új aktiv, verzió = max+1. */
export function ujVerzio(
  verziok: BeallitasVerzio[],
  beallitas: Beallitas,
  eredet: BeallitasVerzio["eredet"],
  most: Date,
): { verziok: BeallitasVerzio[]; uj: BeallitasVerzio | null } {
  const aktiv = aktivVerzio(verziok);
  if (aktiv && beallitasAzonos(aktiv.beallitas, beallitas)) return { verziok, uj: null };
  const maxVerzio = verziok.reduce((m, v) => Math.max(m, v.verzio), 0);
  const uj: BeallitasVerzio = {
    verzio: maxVerzio + 1,
    allapot: "aktiv",
    letrehozva: most.toISOString(),
    eredet,
    beallitas: beallitasNormalizal(beallitas),
  };
  const ujLista = verziok.map((v) => (v.allapot === "aktiv" ? { ...v, allapot: "korabbi" as const } : v));
  return { verziok: [...ujLista, uj], uj };
}

/** A kért verzió beállításából ÚJ aktív verzió (eredet: "visszaallitas"); nincs ilyen → null. */
export function visszaallit(verziok: BeallitasVerzio[], verzio: number, most: Date): { verziok: BeallitasVerzio[]; uj: BeallitasVerzio } | null {
  const keresett = verziok.find((v) => v.verzio === verzio);
  if (!keresett) return null;
  const e = ujVerzio(verziok, keresett.beallitas, "visszaallitas", most);
  // Az aktívval azonos beállítás visszaállítása: nincs új verzió (változatlan mentés nem ad verziót) → az aktív marad a válasz.
  if (!e.uj) { const aktiv = verziok.find((v) => v.allapot === "aktiv"); return aktiv ? { verziok, uj: aktiv } : null; }
  return { verziok: e.verziok, uj: e.uj };
}

/** Az aktív verzió, vagy null ha nincs. */
export function aktivVerzio(verziok: BeallitasVerzio[]): BeallitasVerzio | null {
  return verziok.find((v) => v.allapot === "aktiv") ?? null;
}
