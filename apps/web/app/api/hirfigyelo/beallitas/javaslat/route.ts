import { beallitasJavaslatKer } from "@km/news-monitor-core";
import { belepettSzervezet, eredmenyValasz, hiba, kapu } from "../../_kozos";
import { hostKontextus, kornyezet } from "../../../../../hirfigyelo";
import { z } from "zod";
import { HANGNEM_LEIRAS_MAX } from "@km/contracts";

export const dynamic = "force-dynamic";

const JavaslatKer = z.object({
  szabad_szoveg: z.string().max(2000).optional(),
  // R-8: az első beállításban a profil még piszkozat — a javaslat abból dolgozik
  profil_tervezet: z.object({
    nev: z.string().max(120),
    tevekenyseg: z.string().max(4000),
    celkozonseg: z.string().max(1000),
    cel: z.string().max(1000),
    nyelvek: z.array(z.string().max(5)).max(6),
    hangnem_leiras: z.string().max(HANGNEM_LEIRAS_MAX),
  }).optional(),
});

export async function POST(keres: Request): Promise<Response> {
  try {
    const eredmeny = await kapu(keres, "szerkeszto");
    if (eredmeny instanceof Response) return eredmeny;
    const ktx = hostKontextus(eredmeny.fiok, eredmeny.szervezet.id);
    if (!ktx) return hiba({ hiba: "NINCS_JOG" }, 403);

    const be = await keres.json().catch(() => null);
    const e = JavaslatKer.safeParse(be);
    if (!e.success) return hiba({ hiba: "ERVENYTELEN_ADAT" }, 400);

    const k = await kornyezet(eredmeny.szervezet.id, undefined, eredmeny.fiok.id, { fizeto: eredmeny.fiok.id }); // R-13: a kérő kreditjéből
    if (e.data.profil_tervezet) k.profil = { ...(k.profil as object), ...e.data.profil_tervezet, osszefoglalo: e.data.profil_tervezet.tevekenyseg }; // R-8: az első beállításban a profil még piszkozat — a javaslat abból dolgozik
    return eredmenyValasz(await beallitasJavaslatKer(k, ktx, e.data.szabad_szoveg ?? ""));
  } catch (h) {
    console.error("Hirfigyelo beallitas javaslat POST hiba:", h);
    return hiba({ hiba: "BELSO_HIBA" }, 500);
  }
}
